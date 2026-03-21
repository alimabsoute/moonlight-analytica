# backend/main.py — drop-in replacement (single file)
# Flask + SQLite backend for Janus demo: health, seed_demo, count, KPIs, CSV
from __future__ import annotations

import os
import random
import sqlite3
import sys
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Tuple

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

DB = "janus.db"
INFERENCE_URL = os.environ.get("INFERENCE_URL", "http://localhost:8002")

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
        con.commit()
        con.close()


def ensure_schema():
    with db() as con:
        # Enable WAL mode for concurrent read (Flask) + write (batch processor)
        con.execute("PRAGMA journal_mode=WAL")

        # Legacy counts table (preserved for compatibility)
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS counts (
              id           INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp    TEXT NOT NULL,
              count_value  INTEGER NOT NULL
            )
            """
        )

        # New zones table for area tracking
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS zones (
              id           INTEGER PRIMARY KEY AUTOINCREMENT,
              zone_name    TEXT NOT NULL UNIQUE,
              capacity     INTEGER DEFAULT 0,
              zone_type    TEXT DEFAULT 'general'  -- entrance, checkout, dining, product_area
            )
            """
        )

        # New events table for detailed tracking
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
              id            INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp     TEXT NOT NULL,
              person_id     TEXT,                  -- Anonymous tracking ID
              event_type    TEXT NOT NULL,         -- entry, exit, zone_change
              zone_id       INTEGER,
              direction     TEXT,                  -- in, out, lateral
              confidence    REAL DEFAULT 1.0,      -- Detection accuracy 0-1
              FOREIGN KEY (zone_id) REFERENCES zones(id)
            )
            """
        )

        # New sessions table for visit tracking
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
              id             INTEGER PRIMARY KEY AUTOINCREMENT,
              person_id      TEXT NOT NULL,
              entry_time     TEXT NOT NULL,
              exit_time      TEXT,
              dwell_seconds  INTEGER,              -- Calculated on exit
              zone_path      TEXT,                 -- JSON array of zones visited
              converted      INTEGER DEFAULT 0     -- 1 if made purchase
            )
            """
        )

        # Batch processing jobs table
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS batch_jobs (
              id               INTEGER PRIMARY KEY AUTOINCREMENT,
              video_id         TEXT NOT NULL,
              video_name       TEXT,
              video_path       TEXT,
              model            TEXT DEFAULT 'yolo11l.pt',
              tracker          TEXT DEFAULT 'botsort_tuned.yaml',
              status           TEXT DEFAULT 'pending',
              total_frames     INTEGER DEFAULT 0,
              processed_frames INTEGER DEFAULT 0,
              total_events     INTEGER DEFAULT 0,
              total_sessions   INTEGER DEFAULT 0,
              fps              REAL DEFAULT 0,
              started_at       TEXT,
              completed_at     TEXT,
              error_message    TEXT
            )
            """
        )

        # Add source and video_id columns to events/sessions (idempotent)
        for alter in [
            "ALTER TABLE events ADD COLUMN source TEXT DEFAULT 'live'",
            "ALTER TABLE events ADD COLUMN video_id TEXT",
            "ALTER TABLE sessions ADD COLUMN source TEXT DEFAULT 'live'",
            "ALTER TABLE sessions ADD COLUMN video_id TEXT",
        ]:
            try:
                con.execute(alter)
            except sqlite3.OperationalError:
                pass  # Column already exists

        # Create indexes for source filtering
        for idx in [
            "CREATE INDEX IF NOT EXISTS idx_events_source ON events(source)",
            "CREATE INDEX IF NOT EXISTS idx_events_video_id ON events(video_id)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_source ON sessions(source)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_video_id ON sessions(video_id)",
        ]:
            con.execute(idx)

        # Insert default zones if empty
        con.execute("INSERT OR IGNORE INTO zones (zone_name, capacity, zone_type) VALUES ('entrance', 50, 'entrance')")
        con.execute("INSERT OR IGNORE INTO zones (zone_name, capacity, zone_type) VALUES ('checkout', 20, 'checkout')")
        con.execute("INSERT OR IGNORE INTO zones (zone_name, capacity, zone_type) VALUES ('main_floor', 100, 'general')")
        con.execute("INSERT OR IGNORE INTO zones (zone_name, capacity, zone_type) VALUES ('queue', 30, 'queue')")

        con.commit()


ensure_schema()


@app.get("/health")
def health():
    return jsonify({"ok": True})


def parse_source() -> str:
    """Parse ?source=live|batch|all from query string. Default 'all'."""
    s = (request.args.get("source") or "all").strip().lower()
    return s if s in ("live", "batch", "all") else "all"


def source_filter(table: str = "") -> Tuple[str, list]:
    """Return (SQL fragment, params) for source filtering."""
    src = parse_source()
    prefix = f"{table}." if table else ""
    if src == "all":
        return "", []
    return f" AND {prefix}source = ?", [src]


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
    Reseed comprehensive demo data with sessions, events, zones for the last 14 days.
    """
    import json
    import uuid

    days = 14
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    with db() as con:
        # Clear existing data
        con.execute("DELETE FROM counts")
        con.execute("DELETE FROM events")
        con.execute("DELETE FROM sessions")

        # Get zone IDs
        zones = {row["zone_name"]: row["id"] for row in con.execute("SELECT id, zone_name FROM zones").fetchall()}

        total_sessions = 0
        total_events = 0

        # Generate realistic visitor sessions
        for d in range(days, -1, -1):
            for h in range(24):
                base_ts = now - timedelta(days=d, hours=(23 - h))
                hour = base_ts.hour

                # Hourly visitor volume (more during business hours 9-18)
                if 9 <= hour <= 18:
                    num_visitors = random.randint(15, 35)
                elif 6 <= hour < 9 or 18 < hour <= 22:
                    num_visitors = random.randint(5, 15)
                else:
                    num_visitors = random.randint(0, 5)

                for _ in range(num_visitors):
                    person_id = str(uuid.uuid4())[:8]
                    entry_ts = base_ts + timedelta(minutes=random.randint(0, 55))

                    # Dwell time distribution (seconds)
                    dwell_type = random.choices(
                        ['bounce', 'browse', 'shop', 'dine'],
                        weights=[0.15, 0.35, 0.35, 0.15]
                    )[0]

                    if dwell_type == 'bounce':
                        dwell_sec = random.randint(10, 55)  # < 1 min
                    elif dwell_type == 'browse':
                        dwell_sec = random.randint(60, 600)  # 1-10 min
                    elif dwell_type == 'shop':
                        dwell_sec = random.randint(600, 1800)  # 10-30 min
                    else:  # dine
                        dwell_sec = random.randint(1800, 5400)  # 30-90 min

                    exit_ts = entry_ts + timedelta(seconds=dwell_sec)

                    # Conversion (more likely with longer dwell)
                    converted = 1 if dwell_sec > 300 and random.random() < 0.4 else 0

                    # Zone path (entrance -> main_floor -> maybe queue -> checkout -> exit)
                    zone_path = ["entrance", "main_floor"]
                    if converted:
                        zone_path.extend(["queue", "checkout"])

                    # Insert session
                    con.execute(
                        """
                        INSERT INTO sessions (person_id, entry_time, exit_time, dwell_seconds, zone_path, converted)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (person_id, entry_ts.isoformat(timespec="seconds"),
                         exit_ts.isoformat(timespec="seconds"), dwell_sec,
                         json.dumps(zone_path), converted)
                    )
                    total_sessions += 1

                    # Insert entry event
                    con.execute(
                        """
                        INSERT INTO events (timestamp, person_id, event_type, zone_id, direction, confidence)
                        VALUES (?, ?, 'entry', ?, 'in', ?)
                        """,
                        (entry_ts.isoformat(timespec="seconds"), person_id,
                         zones.get("entrance"), random.uniform(0.85, 1.0))
                    )
                    total_events += 1

                    # Insert zone change events
                    current_ts = entry_ts
                    for zone_name in zone_path[1:]:
                        current_ts += timedelta(seconds=random.randint(30, 180))
                        if current_ts < exit_ts and zone_name in zones:
                            con.execute(
                                """
                                INSERT INTO events (timestamp, person_id, event_type, zone_id, direction, confidence)
                                VALUES (?, ?, 'zone_change', ?, 'lateral', ?)
                                """,
                                (current_ts.isoformat(timespec="seconds"), person_id,
                                 zones.get(zone_name), random.uniform(0.85, 1.0))
                            )
                            total_events += 1

                    # Insert exit event
                    con.execute(
                        """
                        INSERT INTO events (timestamp, person_id, event_type, zone_id, direction, confidence)
                        VALUES (?, ?, 'exit', ?, 'out', ?)
                        """,
                        (exit_ts.isoformat(timespec="seconds"), person_id,
                         zones.get("entrance"), random.uniform(0.85, 1.0))
                    )
                    total_events += 1

                # Also create legacy counts for backwards compatibility
                count_val = num_visitors + random.randint(-3, 3)
                con.execute(
                    "INSERT INTO counts(timestamp, count_value) VALUES (?, ?)",
                    (base_ts.isoformat(timespec="seconds"), max(0, count_val)),
                )

        con.commit()

    return jsonify({
        "ok": True,
        "seeded_days": days,
        "total_sessions": total_sessions,
        "total_events": total_events
    })


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


@app.get("/api/dwell-time")
def dwell_time():
    """
    Returns dwell time analytics: avg, min, max, distribution
    """
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
        sessions_data = con.execute(
            f"""
            SELECT dwell_seconds
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    if not sessions_data:
        return jsonify({"error": "no data"}), 404

    dwell_times = [row["dwell_seconds"] for row in sessions_data if row["dwell_seconds"]]

    if not dwell_times:
        return jsonify({"error": "no data"}), 404

    avg_dwell = sum(dwell_times) / len(dwell_times)
    min_dwell = min(dwell_times)
    max_dwell = max(dwell_times)

    # Distribution (buckets: <1min, 1-5min, 5-15min, 15-30min, 30min+)
    distribution = {
        "under_1min": len([d for d in dwell_times if d < 60]),
        "1_to_5min": len([d for d in dwell_times if 60 <= d < 300]),
        "5_to_15min": len([d for d in dwell_times if 300 <= d < 900]),
        "15_to_30min": len([d for d in dwell_times if 900 <= d < 1800]),
        "over_30min": len([d for d in dwell_times if d >= 1800]),
    }

    return jsonify({
        "avg_dwell_seconds": round(avg_dwell, 1),
        "min_dwell_seconds": min_dwell,
        "max_dwell_seconds": max_dwell,
        "median_dwell_seconds": sorted(dwell_times)[len(dwell_times) // 2],
        "distribution": distribution,
        "total_sessions": len(dwell_times)
    })


@app.get("/api/occupancy")
def occupancy():
    """
    Returns real-time occupancy metrics
    """
    with db() as con:
        # Get total capacity
        total_capacity = con.execute("SELECT SUM(capacity) as total FROM zones").fetchone()["total"] or 0

        # Count active sessions (people currently inside - no exit_time)
        current_occupancy = con.execute(
            "SELECT COUNT(*) as count FROM sessions WHERE exit_time IS NULL"
        ).fetchone()["count"]

        # Zone-specific occupancy
        zone_occupancy = con.execute(
            """
            SELECT z.zone_name, z.capacity,
                   COUNT(DISTINCT e.person_id) as current_count
            FROM zones z
            LEFT JOIN events e ON z.id = e.zone_id
                AND e.timestamp > datetime('now', '-5 minutes')
                AND e.event_type != 'exit'
            GROUP BY z.id, z.zone_name, z.capacity
            """
        ).fetchall()

    occupancy_rate = (current_occupancy / total_capacity * 100) if total_capacity > 0 else 0

    zones_data = [
        {
            "zone": row["zone_name"],
            "capacity": row["capacity"],
            "current": row["current_count"],
            "occupancy_rate": round((row["current_count"] / row["capacity"] * 100) if row["capacity"] > 0 else 0, 1)
        }
        for row in zone_occupancy
    ]

    return jsonify({
        "current_occupancy": current_occupancy,
        "total_capacity": total_capacity,
        "occupancy_rate": round(occupancy_rate, 1),
        "zones": zones_data
    })


@app.get("/api/entries-exits")
def entries_exits():
    """
    Returns directional traffic (entry/exit counts)
    """
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
        stats = con.execute(
            f"""
            SELECT
                SUM(CASE WHEN event_type = 'entry' THEN 1 ELSE 0 END) as entries,
                SUM(CASE WHEN event_type = 'exit' THEN 1 ELSE 0 END) as exits
            FROM events
            WHERE timestamp > ?{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchone()

    entries = stats["entries"] or 0
    exits = stats["exits"] or 0
    net_traffic = entries - exits

    return jsonify({
        "entries": entries,
        "exits": exits,
        "net_traffic": net_traffic,
        "hours": hours
    })


@app.get("/api/conversion")
def conversion():
    """
    Returns conversion metrics (visitors who converted)
    """
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
        stats = con.execute(
            f"""
            SELECT
                COUNT(*) as total_sessions,
                SUM(converted) as conversions,
                SUM(CASE WHEN dwell_seconds < 60 THEN 1 ELSE 0 END) as bounced,
                SUM(CASE WHEN dwell_seconds >= 300 THEN 1 ELSE 0 END) as engaged
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchone()

    total = stats["total_sessions"] or 0
    conversions = stats["conversions"] or 0
    bounced = stats["bounced"] or 0
    engaged = stats["engaged"] or 0

    conversion_rate = (conversions / total * 100) if total > 0 else 0
    bounce_rate = (bounced / total * 100) if total > 0 else 0
    engagement_rate = (engaged / total * 100) if total > 0 else 0

    return jsonify({
        "total_sessions": total,
        "conversions": conversions,
        "conversion_rate": round(conversion_rate, 1),
        "bounce_rate": round(bounce_rate, 1),
        "engagement_rate": round(engagement_rate, 1)
    })


@app.get("/api/zones")
def zones_analytics():
    """
    Returns zone-specific analytics
    """
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter("e")

    with db() as con:
        zone_stats = con.execute(
            f"""
            SELECT
                z.zone_name,
                z.capacity,
                COUNT(e.id) as total_events,
                COUNT(DISTINCT e.person_id) as unique_visitors
            FROM zones z
            LEFT JOIN events e ON z.id = e.zone_id AND e.timestamp > ?{src_sql}
            GROUP BY z.id, z.zone_name, z.capacity
            ORDER BY total_events DESC
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    zones_data = [
        {
            "zone": row["zone_name"],
            "capacity": row["capacity"],
            "total_events": row["total_events"],
            "unique_visitors": row["unique_visitors"]
        }
        for row in zone_stats
    ]

    return jsonify({"zones": zones_data})


@app.get("/api/queue")
def queue_analytics():
    """
    Returns queue/wait time analytics
    """
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    with db() as con:
        # Get queue zone ID
        queue_zone = con.execute(
            "SELECT id FROM zones WHERE zone_type = 'queue' LIMIT 1"
        ).fetchone()

        if not queue_zone:
            return jsonify({"error": "no queue zone configured"}), 404

        # Current queue length
        current_queue = con.execute(
            """
            SELECT COUNT(DISTINCT person_id) as queue_length
            FROM events
            WHERE zone_id = ? AND timestamp > datetime('now', '-5 minutes')
              AND event_type != 'exit'
            """,
            (queue_zone["id"],),
        ).fetchone()["queue_length"]

        # Average queue metrics
        src_sql, src_params = source_filter()
        queue_sessions = con.execute(
            f"""
            SELECT dwell_seconds
            FROM sessions
            WHERE zone_path LIKE ? AND entry_time > ?{src_sql}
            """,
            [f'%"queue"%', since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    wait_times = [row["dwell_seconds"] for row in queue_sessions if row["dwell_seconds"]]
    avg_wait = sum(wait_times) / len(wait_times) if wait_times else 0

    return jsonify({
        "current_queue_length": current_queue,
        "avg_wait_seconds": round(avg_wait, 1),
        "total_queued": len(wait_times)
    })


@app.post("/events")
def post_event():
    """
    Receive tracking events from enhanced edge agent
    Expected: {event_type, person_id, zone_id?, direction?, confidence?, timestamp?}
    """
    body = request.get_json() or {}
    event_type = body.get("event_type")  # entry, exit, zone_change
    person_id = body.get("person_id")
    zone_id = body.get("zone_id")
    direction = body.get("direction")  # in, out, lateral
    confidence = body.get("confidence", 1.0)
    timestamp = body.get("timestamp") or datetime.now(timezone.utc).isoformat(timespec="seconds")

    if not event_type or not person_id:
        return jsonify({"error": "event_type and person_id required"}), 400

    with db() as con:
        con.execute(
            """
            INSERT INTO events (timestamp, person_id, event_type, zone_id, direction, confidence)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (timestamp, person_id, event_type, zone_id, direction, confidence),
        )

    return jsonify({"ok": True, "event_type": event_type, "person_id": person_id})


@app.post("/sessions")
def post_session():
    """
    Receive completed session data from enhanced edge agent
    Expected: {person_id, entry_time, exit_time, dwell_seconds, zone_path, converted}
    """
    body = request.get_json() or {}
    person_id = body.get("person_id")
    entry_time = body.get("entry_time")
    exit_time = body.get("exit_time")
    dwell_seconds = body.get("dwell_seconds")
    zone_path = body.get("zone_path")  # JSON string
    converted = body.get("converted", 0)

    if not person_id or not entry_time:
        return jsonify({"error": "person_id and entry_time required"}), 400

    with db() as con:
        con.execute(
            """
            INSERT INTO sessions (person_id, entry_time, exit_time, dwell_seconds, zone_path, converted)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (person_id, entry_time, exit_time, dwell_seconds, zone_path, converted),
        )

    return jsonify({"ok": True, "person_id": person_id, "dwell_seconds": dwell_seconds})


def _kill_streamer_on_port(port=8001):
    """Kill any process listening on the given port."""
    import subprocess, time
    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True, text=True, shell=True
        )
        for line in result.stdout.splitlines():
            if f":{port}" in line and "LISTENING" in line:
                pid = line.strip().split()[-1]
                if pid.isdigit():
                    subprocess.run(["taskkill", "/F", "/PID", pid],
                                   capture_output=True, shell=True)
        time.sleep(1)
    except Exception:
        pass


@app.post("/video/start")
def start_video_stream():
    """Start video streamer with specified source.

    For demo videos, this endpoint tries to use the existing video_streamer's
    /switch endpoint first. If the streamer isn't running, it falls back to
    subprocess spawning.
    """
    import subprocess
    import os
    import requests as req  # Use alias to avoid conflict with Flask request

    body = request.get_json() or {}
    source = body.get("source")  # 'demo', 'webcam', 'procedural', 'youtube'
    url = body.get("url")  # YouTube URL if source == 'youtube'

    edge_agent_dir = os.path.join(os.path.dirname(__file__), "..", "edge_agent")
    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")

    try:
        if source == 'demo':
            # Try using the demo.mp4 from frontend public folder
            demo_path = os.path.normpath(os.path.join(
                os.path.dirname(__file__), "..", "frontend", "public", "demo.mp4"
            ))

            # If demo.mp4 doesn't exist, try the first video in the library
            if not os.path.exists(demo_path):
                library_dir = os.path.join(os.path.dirname(__file__), "..", "edge_agent", "video_library")
                metadata_file = os.path.join(library_dir, "metadata.json")
                if os.path.exists(metadata_file):
                    import json
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                    videos = metadata.get("videos", [])
                    if videos:
                        demo_path = os.path.normpath(videos[0]["path"])

            if not os.path.exists(demo_path):
                return jsonify({"error": "No demo video found. Upload a video to the library first."}), 404

            # Try to use the switch endpoint on running video_streamer first
            try:
                resp = req.post(
                    "http://localhost:8001/switch",
                    params={"source": demo_path},
                    timeout=5
                )
                if resp.ok:
                    return jsonify({"ok": True, "source": source, "video_path": demo_path, "method": "switch"})
            except req.exceptions.ConnectionError:
                # Video streamer not running, fall back to subprocess
                pass

            # Fall back to starting new subprocess
            subprocess.Popen(
                [venv_python, "video_streamer.py", "--source", demo_path, "--port", "8001"],
                cwd=edge_agent_dir,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            return jsonify({"ok": True, "source": source, "video_path": demo_path, "method": "subprocess"})

        elif source == 'youtube' and url:
            # YouTube requires subprocess since it needs yt-dlp extraction
            # Kill any existing video streamer on port 8001 first
            _kill_streamer_on_port(8001)

            subprocess.Popen(
                [venv_python, "video_streamer.py", "--youtube", url, "--port", "8001"],
                cwd=edge_agent_dir,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            return jsonify({"ok": True, "source": source})

        elif source == 'webcam':
            # Webcam requires subprocess to start fresh
            subprocess.Popen(
                [venv_python, "video_streamer.py", "--source", "0", "--port", "8001"],
                cwd=edge_agent_dir,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            return jsonify({"ok": True, "source": source})

        elif source == 'procedural':
            # For procedural, we don't start video streamer - just use seed_demo endpoint
            return jsonify({"ok": True, "message": "Procedural mode - use seed_demo endpoint for data"})

        else:
            return jsonify({"error": "Invalid source or missing URL"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/video/upload")
def upload_video():
    """Upload MP4 video for tracking"""
    import os
    import shutil

    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith('.mp4'):
        return jsonify({"error": "Only MP4 files supported"}), 400

    # Save uploaded video
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "edge_agent", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    video_path = os.path.join(upload_dir, "uploaded_video.mp4")
    file.save(video_path)

    # Start video streamer with uploaded file
    import subprocess
    edge_agent_dir = os.path.join(os.path.dirname(__file__), "..", "edge_agent")
    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")

    try:
        subprocess.Popen(
            [venv_python, "video_streamer.py", "--source", video_path, "--port", "8001"],
            cwd=edge_agent_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
        return jsonify({"ok": True, "video_path": video_path})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/video/stop")
def stop_video():
    """Stop video streamer"""
    try:
        _kill_streamer_on_port(8001)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/video/library")
def list_videos():
    """List all videos in the library"""
    import os
    import json
    from datetime import datetime

    library_dir = os.path.join(os.path.dirname(__file__), "..", "edge_agent", "video_library")
    metadata_file = os.path.join(library_dir, "metadata.json")

    if not os.path.exists(metadata_file):
        return jsonify({"videos": []})

    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    return jsonify({"videos": metadata.get("videos", [])})


@app.post("/video/library/upload")
def upload_to_library():
    """Upload MP4 video to library with metadata"""
    import os
    import json
    from datetime import datetime
    import uuid

    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith('.mp4'):
        return jsonify({"error": "Only MP4 files supported"}), 400

    # Get metadata from form
    video_name = request.form.get('name', file.filename.replace('.mp4', ''))
    description = request.form.get('description', '')

    # Create library directory
    library_dir = os.path.join(os.path.dirname(__file__), "..", "edge_agent", "video_library")
    os.makedirs(library_dir, exist_ok=True)

    # Generate unique ID and save video
    video_id = str(uuid.uuid4())
    video_filename = f"{video_id}.mp4"
    video_path = os.path.join(library_dir, video_filename)
    file.save(video_path)

    # Get file size
    file_size = os.path.getsize(video_path)

    # Load or create metadata
    metadata_file = os.path.join(library_dir, "metadata.json")
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = {"videos": []}

    # Add new video metadata (normalize path for consistent comparisons)
    video_metadata = {
        "id": video_id,
        "name": video_name,
        "description": description,
        "filename": video_filename,
        "original_filename": file.filename,
        "file_size": file_size,
        "uploaded_at": datetime.now().isoformat(),
        "path": os.path.normpath(os.path.abspath(video_path))
    }
    metadata["videos"].append(video_metadata)

    # Save metadata
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

    return jsonify({"ok": True, "video": video_metadata})


@app.delete("/video/library/<video_id>")
def delete_from_library(video_id):
    """Delete video from library"""
    import os
    import json

    library_dir = os.path.join(os.path.dirname(__file__), "..", "edge_agent", "video_library")
    metadata_file = os.path.join(library_dir, "metadata.json")

    if not os.path.exists(metadata_file):
        return jsonify({"error": "Video not found"}), 404

    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    # Find and remove video
    videos = metadata.get("videos", [])
    video_to_delete = None
    for i, video in enumerate(videos):
        if video["id"] == video_id:
            video_to_delete = video
            videos.pop(i)
            break

    if not video_to_delete:
        return jsonify({"error": "Video not found"}), 404

    # Delete video file
    video_path = video_to_delete["path"]
    if os.path.exists(video_path):
        os.remove(video_path)

    # Save updated metadata
    metadata["videos"] = videos
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

    return jsonify({"ok": True})


@app.post("/video/library/<video_id>/play")
def play_library_video(video_id):
    """Start playing a video from the library"""
    import os
    import json
    import subprocess

    library_dir = os.path.join(os.path.dirname(__file__), "..", "edge_agent", "video_library")
    metadata_file = os.path.join(library_dir, "metadata.json")

    if not os.path.exists(metadata_file):
        return jsonify({"error": "Video not found"}), 404

    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    # Find video
    video = None
    for v in metadata.get("videos", []):
        if v["id"] == video_id:
            video = v
            break

    if not video:
        return jsonify({"error": "Video not found"}), 404

    # Normalize video path (handles both relative and absolute paths in metadata)
    video_path = os.path.normpath(os.path.abspath(video["path"]))

    # Verify video exists
    if not os.path.exists(video_path):
        return jsonify({"error": f"Video file not found: {video_path}"}), 404

    # Call the video_streamer's switch endpoint to change video
    # If streamer isn't running, auto-start it with this video
    import requests as req
    edge_agent_dir = os.path.join(os.path.dirname(__file__), "..", "edge_agent")
    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")

    try:
        resp = req.post(
            "http://localhost:8001/switch",
            params={"source": video_path},
            timeout=5
        )
        if resp.ok:
            return jsonify({"ok": True, "video": video, "switch_result": resp.json()})
        else:
            return jsonify({"error": f"Video streamer error: {resp.text}"}), resp.status_code
    except req.exceptions.ConnectionError:
        # Streamer not running — auto-start it with this video
        if not os.path.exists(venv_python):
            return jsonify({"error": f"Python venv not found at {venv_python}. Run setup first."}), 500
        try:
            subprocess.Popen(
                [venv_python, "video_streamer.py", "--source", video_path, "--port", "8001"],
                cwd=os.path.normpath(edge_agent_dir),
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            # Return immediately — YOLO model loading can take 10-20s
            # Frontend will show the feed once the streamer is ready
            return jsonify({"ok": True, "video": video, "method": "subprocess_start"})
        except Exception as e:
            return jsonify({"error": f"Failed to start video streamer: {e}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/video/settings")
def get_video_settings():
    """Get current video streamer settings"""
    import requests
    try:
        resp = requests.get("http://localhost:8001/settings", timeout=5)
        if resp.ok:
            return jsonify(resp.json())
        else:
            return jsonify({"error": "Video streamer error"}), resp.status_code
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Video streamer not running"}), 503


@app.post("/video/model")
def set_video_model():
    """Switch YOLO model — proxies to inference server directly"""
    import requests as req
    model = request.args.get('model') or (request.json.get('model') if request.is_json else None)
    if not model:
        return jsonify({"error": "Missing 'model' parameter"}), 400
    # Try inference server first (new architecture), fall back to video streamer
    try:
        resp = req.post(f"{INFERENCE_URL}/model", json={"model": model}, timeout=30)
        return jsonify(resp.json()), resp.status_code
    except req.exceptions.ConnectionError:
        pass
    try:
        resp = req.post("http://localhost:8001/model", params={"model": model}, timeout=10)
        return jsonify(resp.json()), resp.status_code
    except req.exceptions.ConnectionError:
        return jsonify({"error": "Neither inference server nor video streamer running"}), 503


@app.get("/inference/health")
def inference_health():
    """Check inference server health"""
    import requests as req
    try:
        resp = req.get(f"{INFERENCE_URL}/health", timeout=5)
        return jsonify(resp.json()), resp.status_code
    except req.exceptions.ConnectionError:
        return jsonify({"status": "offline", "url": INFERENCE_URL}), 503


@app.get("/inference/info")
def inference_info():
    """Get inference server info"""
    import requests as req
    try:
        resp = req.get(f"{INFERENCE_URL}/info", timeout=5)
        return jsonify(resp.json()), resp.status_code
    except req.exceptions.ConnectionError:
        return jsonify({"error": "Inference server not running"}), 503


@app.post("/video/tracker")
def set_video_tracker():
    """Switch tracker algorithm"""
    import requests
    tracker = request.args.get('tracker') or (request.json.get('tracker') if request.is_json else None)
    if not tracker:
        return jsonify({"error": "Missing 'tracker' parameter"}), 400
    try:
        resp = requests.post("http://localhost:8001/tracker", params={"tracker": tracker}, timeout=10)
        return jsonify(resp.json()), resp.status_code
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Video streamer not running"}), 503


# ── Batch Processing Endpoints ───────────────────────────────────────────

@app.get("/api/batch/jobs")
def batch_jobs_list():
    """List all batch processing jobs."""
    with db() as con:
        rows = con.execute("SELECT * FROM batch_jobs ORDER BY id DESC").fetchall()
    return jsonify({"jobs": [dict(r) for r in rows]})


@app.get("/api/batch/jobs/<int:job_id>")
def batch_job_detail(job_id):
    """Get details for a single batch job."""
    with db() as con:
        row = con.execute("SELECT * FROM batch_jobs WHERE id=?", (job_id,)).fetchone()
    if not row:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(dict(row))


@app.post("/api/batch/start")
def batch_start():
    """Trigger batch processing for a video via subprocess."""
    import subprocess
    import os

    body = request.get_json() or {}
    video_id = body.get("video_id")
    model = body.get("model", "yolo11l.pt")
    tracker = body.get("tracker", "botsort_tuned.yaml")

    if not video_id:
        return jsonify({"error": "video_id required"}), 400

    edge_agent_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "edge_agent")
    )
    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")
    batch_script = os.path.join(edge_agent_dir, "batch_processor.py")

    if not os.path.exists(batch_script):
        return jsonify({"error": "batch_processor.py not found"}), 500

    # Use venv python if available, otherwise system python
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable

    try:
        proc = subprocess.Popen(
            [python_exe, batch_script, "process",
             "--video-id", video_id,
             "--model", model,
             "--tracker", tracker],
            cwd=edge_agent_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE,
        )
        return jsonify({"ok": True, "video_id": video_id, "pid": proc.pid})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.delete("/api/batch/results/<video_id>")
def batch_clear_results(video_id):
    """Clear batch data for a specific video."""
    with db() as con:
        con.execute("DELETE FROM events WHERE source='batch' AND video_id=?", (video_id,))
        con.execute("DELETE FROM sessions WHERE source='batch' AND video_id=?", (video_id,))
        con.execute("DELETE FROM batch_jobs WHERE video_id=?", (video_id,))
        con.commit()
    return jsonify({"ok": True, "video_id": video_id})


# ── Video file serving (for pre-processed replay) ────────────────────────

@app.get("/video/library/<video_id>/file")
def serve_library_video_file(video_id):
    """Serve a video file from the library for HTML5 <video> playback."""
    from flask import send_file

    library_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "edge_agent", "video_library")
    )

    # Try direct filename match
    for ext in [".mp4", ".avi", ".mov"]:
        candidate = os.path.join(library_dir, f"{video_id}{ext}")
        if os.path.exists(candidate):
            return send_file(candidate, mimetype="video/mp4")

    # Check metadata for path
    metadata_file = os.path.join(library_dir, "metadata.json")
    if os.path.exists(metadata_file):
        import json as _json
        with open(metadata_file, "r") as f:
            meta = _json.load(f)
        for v in meta.get("videos", []):
            if v["id"] == video_id and os.path.exists(v.get("path", "")):
                return send_file(v["path"], mimetype="video/mp4")

    return jsonify({"error": "Video file not found"}), 404


# ── Pre-Processed Pipeline Endpoints ─────────────────────────────────────

@app.post("/api/process-video")
def process_video_start():
    """Trigger offline Roboflow cloud processing for a video."""
    import subprocess

    body = request.get_json() or {}
    video_id = body.get("video_id")
    skip = body.get("skip", 3)
    model = body.get("model")

    if not video_id:
        return jsonify({"error": "video_id required"}), 400

    edge_agent_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "edge_agent")
    )
    library_dir = os.path.join(edge_agent_dir, "video_library")

    # Find video file
    video_path = None
    for ext in [".mp4", ".avi", ".mov"]:
        candidate = os.path.join(library_dir, f"{video_id}{ext}")
        if os.path.exists(candidate):
            video_path = candidate
            break

    if not video_path:
        # Check metadata.json for path
        metadata_file = os.path.join(library_dir, "metadata.json")
        if os.path.exists(metadata_file):
            import json as _json
            with open(metadata_file, "r") as f:
                meta = _json.load(f)
            for v in meta.get("videos", []):
                if v["id"] == video_id and os.path.exists(v.get("path", "")):
                    video_path = v["path"]
                    break

    if not video_path:
        return jsonify({"error": f"Video not found for id: {video_id}"}), 404

    # Check if already processed
    tracking_file = os.path.join(library_dir, f"{video_id}_tracking.json")
    if os.path.exists(tracking_file):
        return jsonify({"ok": True, "status": "already_processed",
                        "video_id": video_id})

    # Use venv python if available
    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable

    cmd = [python_exe, "process_video.py",
           "--source", video_path,
           "--skip", str(skip)]
    if model:
        cmd.extend(["--model", model])

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=edge_agent_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE,
        )
        return jsonify({"ok": True, "video_id": video_id, "pid": proc.pid,
                        "status": "started"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/process-status/<video_id>")
def process_video_status(video_id):
    """Check processing progress for a video."""
    edge_agent_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "edge_agent")
    )
    library_dir = os.path.join(edge_agent_dir, "video_library")

    # Check if tracking data already exists (completed)
    tracking_file = os.path.join(library_dir, f"{video_id}_tracking.json")
    if os.path.exists(tracking_file):
        return jsonify({"video_id": video_id, "status": "completed",
                        "percent": 100, "frame": 0, "total": 0})

    # Check progress file
    progress_file = os.path.join(library_dir, f"{video_id}_progress.json")
    if os.path.exists(progress_file):
        try:
            import json as _json
            with open(progress_file, "r") as f:
                progress = _json.load(f)
            return jsonify(progress)
        except Exception:
            pass

    return jsonify({"video_id": video_id, "status": "not_started",
                    "percent": 0, "frame": 0, "total": 0})


@app.get("/api/tracking-data/<video_id>")
def get_tracking_data(video_id):
    """Serve the pre-computed tracking JSON for a video."""
    edge_agent_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "edge_agent")
    )
    tracking_file = os.path.join(edge_agent_dir, "video_library",
                                  f"{video_id}_tracking.json")

    if not os.path.exists(tracking_file):
        return jsonify({"error": "Tracking data not found. Process the video first."}), 404

    # Stream the file directly for large JSON
    def generate():
        with open(tracking_file, "r") as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                yield chunk

    return Response(generate(), mimetype="application/json",
                    headers={"Cache-Control": "public, max-age=3600"})


@app.get("/api/tracking-metrics/<video_id>")
def get_tracking_metrics(video_id):
    """Serve pre-computed dashboard metrics for a video."""
    edge_agent_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "edge_agent")
    )
    tracking_file = os.path.join(edge_agent_dir, "video_library",
                                  f"{video_id}_tracking.json")

    if not os.path.exists(tracking_file):
        return jsonify({"error": "Tracking data not found"}), 404

    try:
        import json as _json
        with open(tracking_file, "r") as f:
            data = _json.load(f)
        # Return only metrics + summary (not the per-frame data)
        return jsonify({
            "video_id": data.get("video_id"),
            "total_frames": data.get("total_frames"),
            "fps": data.get("fps"),
            "duration_s": data.get("duration_s"),
            "resolution": data.get("resolution"),
            "model": data.get("model"),
            "frame_skip": data.get("frame_skip"),
            "processing_time_s": data.get("processing_time_s"),
            "processed_at": data.get("processed_at"),
            "metrics": data.get("metrics", {}),
            "sessions": data.get("sessions", []),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Dev server
    import sys
    app.run(host="0.0.0.0", port=8000, debug=True)