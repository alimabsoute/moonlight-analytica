# backend/main.py — drop-in replacement (single file)
# Flask + SQLite backend for Janus demo: health, seed_demo, count, KPIs, CSV
from __future__ import annotations

import random
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

DB = "janus.db"

app = Flask(__name__)
# Allow Vite on 5173/5174 (localhost & 127.0.0.1)
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
)


@contextmanager
def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    try:
        yield con
    finally:
        con.close()


def ensure_schema():
    with db() as con:
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS counts (
              id           INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp    TEXT NOT NULL,          -- ISO-8601 with timezone (+00:00)
              count_value  INTEGER NOT NULL
            )
            """
        )
        con.commit()


ensure_schema()


@app.get("/health")
def health():
    return jsonify({"ok": True})


def parse_hours(default: float = 168.0) -> float:
    """
    Parse ?hours=… from the query string.
    Accepts decimals (e.g. 0.167) and shorthands like 10m, 24h, 7d.
    Falls back to `default` on bad/missing input.
    """
    raw = request.args.get("hours")
    if raw is None:
        return float(default)

    v = str(raw).strip().lower()
    try:
        if v.endswith("m"):  # minutes, e.g. 10m
            return float(v[:-1]) / 60.0
        if v.endswith("h"):  # hours, e.g. 24h
            return float(v[:-1])
        if v.endswith("d"):  # days, e.g. 7d
            return float(v[:-1]) * 24.0
        return float(v)  # plain number supports decimals like 0.167
    except (TypeError, ValueError):
        return float(default)


@app.post("/seed_demo")
def seed_demo():
    """
    Reseed demo data for the last 14 days, roughly hourly points with some noise.
    """
    days = 14
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    with db() as con:
        # Clear existing data to keep the demo tidy
        con.execute("DELETE FROM counts")

        # Create ~24 * days rows (one per hour)
        base = 30
        for d in range(days, -1, -1):
            for h in range(24):
                ts = now - timedelta(days=d, hours=(23 - h))
                # daytime bump so charts look alive
                hour = ts.hour
                wave = 15 * (1 if 9 <= hour <= 18 else 0)  # busier daytime
                noise = random.randint(-5, 12)
                val = max(0, base + wave + noise)
                con.execute(
                    "INSERT INTO counts(timestamp, count_value) VALUES (?, ?)",
                    (ts.isoformat(timespec="seconds"), int(val)),
                )

        con.commit()

    return jsonify({"ok": True, "seeded_days": days})


@app.post("/count")
def record_count():
    """
    Ingest a single count point (used by tracker/counter demos).
    Body: { "count_value": <int> }
    """
    data = request.get_json(silent=True) or {}
    try:
        count_value = int(data.get("count_value", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "count_value must be an integer"}), 400

    ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with db() as con:
        con.execute(
            "INSERT INTO counts(timestamp, count_value) VALUES (?, ?)",
            (ts, count_value),
        )
        con.commit()

    return jsonify({"timestamp": ts, "count_value": count_value})


@app.get("/kpis")
def kpis():
    """
    Returns coarse KPIs based on the window (?hours=...).
    Supports 0.167, 10m, 24h, 7d, 30d, etc.
    """
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    with db() as con:
        rows = con.execute(
            """
            SELECT substr(timestamp,1,13) AS hour,
                   AVG(count_value)       AS avg_val,
                   MAX(count_value)       AS peak,
                   SUM(count_value)       AS throughput
            FROM counts
            WHERE timestamp > ?
            GROUP BY substr(timestamp,1,13)
            ORDER BY hour ASC
            """,
            (since.isoformat(timespec="seconds"),),
        ).fetchall()

    if not rows:
        return jsonify({"error": "no data"}), 404

    avg_people = sum(r["avg_val"] for r in rows) / len(rows)
    peak_people = max(r["peak"] for r in rows)
    throughput = sum(r["throughput"] for r in rows)

    return jsonify(
        {
            "avg_people": round(avg_people, 2),
            "peak_people": int(peak_people),
            "throughput": int(throughput),
            "hours": float(hours),
        }
    )


@app.get("/series.csv")
def series_csv():
    """
    Returns a CSV suitable for the frontend line chart.
    Columns: timestamp,count_value,peak,throughput
    - `timestamp` is the hour bucket (…:00)
    - `count_value` is the hourly average (frontend uses dataKey='count_value')
    """
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    with db() as con:
        rows = con.execute(
            """
            SELECT substr(timestamp,1,13) AS hour,
                   AVG(count_value)       AS avg_val,
                   MAX(count_value)       AS peak,
                   SUM(count_value)       AS throughput
            FROM counts
            WHERE timestamp > ?
            GROUP BY substr(timestamp,1,13)
            ORDER BY hour ASC
            """,
            (since.isoformat(timespec="seconds"),),
        ).fetchall()

    if not rows:
        return Response("timestamp,count_value,peak,throughput\n", mimetype="text/csv")

    header = "timestamp,count_value,peak,throughput\n"
    body = "\n".join(
        f"{r['hour']}:00,{round(r['avg_val'], 2)},{int(r['peak'])},{int(r['throughput'])}"
        for r in rows
    )
    return Response(header + body + "\n", mimetype="text/csv")


if __name__ == "__main__":
    # Dev server
    app.run(host="0.0.0.0", port=8000, debug=True)