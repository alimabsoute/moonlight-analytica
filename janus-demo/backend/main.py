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
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB upload limit
# Allow Vite on 5173/5174 (localhost & 127.0.0.1)
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:3004",
        "http://127.0.0.1:3004",
    ],
)


@contextmanager
def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA busy_timeout = 5000")
    con.execute("PRAGMA foreign_keys = ON")
    try:
        yield con
    except Exception:
        con.rollback()
        raise
    else:
        con.commit()
    finally:
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
            "ALTER TABLE profile ADD COLUMN avg_transaction_value REAL DEFAULT 25.0",
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
            "CREATE INDEX IF NOT EXISTS idx_sessions_entry_time ON sessions(entry_time)",
            "CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_events_zone_id ON events(zone_id)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_converted ON sessions(converted)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_dwell ON sessions(dwell_seconds)",
        ]:
            con.execute(idx)

        # Profile table (singleton row, id=1)
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS profile (
              id                   INTEGER PRIMARY KEY CHECK (id = 1),
              store_name           TEXT DEFAULT 'My Store',
              total_capacity       INTEGER DEFAULT 100,
              camera_name          TEXT DEFAULT 'Camera 1',
              timezone             TEXT DEFAULT 'America/New_York',
              business_hours_start INTEGER DEFAULT 9,
              business_hours_end   INTEGER DEFAULT 21,
              updated_at           TEXT
            )
            """
        )
        # Ensure default profile row exists
        con.execute(
            "INSERT OR IGNORE INTO profile (id) VALUES (1)"
        )

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
    Reseed comprehensive demo data with 500+ sessions across 7 days.
    Features: day-of-week variation, hour bell curve, realistic zone paths,
    varied dwell, conversion correlation, zone_change events, repeat visitors.
    """
    import json
    import uuid
    import math

    days = 7
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    # Pre-generate a pool of ~15% repeat visitor IDs
    repeat_pool = [f"repeat-{i:04d}" for i in range(40)]

    with db() as con:
        # Clear existing data
        con.execute("DELETE FROM counts")
        con.execute("DELETE FROM events")
        con.execute("DELETE FROM sessions")

        # Get zone IDs
        zones = {row["zone_name"]: row["id"] for row in con.execute("SELECT id, zone_name FROM zones").fetchall()}
        zone_names = list(zones.keys())

        total_sessions = 0
        total_events = 0

        for d in range(days, -1, -1):
            day_dt = now - timedelta(days=d)
            weekday = day_dt.weekday()  # 0=Mon, 6=Sun
            is_weekend = weekday >= 5

            # Weekend = 60% of weekday traffic
            day_multiplier = 0.6 if is_weekend else 1.0

            for h in range(24):
                base_ts = now - timedelta(days=d, hours=(23 - h))
                hour = base_ts.hour

                # Hour-of-day bell curve: peak 11am-2pm, quiet before 8am / after 8pm
                # Using a Gaussian-like distribution centered at 12:30
                hour_weight = math.exp(-0.5 * ((hour - 12.5) / 3.5) ** 2)
                base_visitors = int(25 * hour_weight * day_multiplier)
                # Add some noise
                num_visitors = max(0, base_visitors + random.randint(-3, 5))

                for _ in range(num_visitors):
                    # 15% chance to pick a repeat visitor
                    if random.random() < 0.15:
                        person_id = random.choice(repeat_pool)
                    else:
                        person_id = str(uuid.uuid4())[:8]

                    entry_ts = base_ts + timedelta(minutes=random.randint(0, 55))

                    # Dwell time distribution: 10% bounce, 30% casual, 40% engaged, 20% power
                    dwell_type = random.choices(
                        ['bounce', 'casual', 'engaged', 'power'],
                        weights=[0.10, 0.30, 0.40, 0.20]
                    )[0]

                    if dwell_type == 'bounce':
                        dwell_sec = random.randint(10, 55)
                    elif dwell_type == 'casual':
                        dwell_sec = random.randint(120, 600)
                    elif dwell_type == 'engaged':
                        dwell_sec = random.randint(600, 1800)
                    else:  # power
                        dwell_sec = random.randint(1800, 5400)

                    exit_ts = entry_ts + timedelta(seconds=dwell_sec)

                    # Conversion: longer dwell = higher probability
                    if dwell_sec < 120:
                        conv_prob = 0.02
                    elif dwell_sec < 600:
                        conv_prob = 0.15
                    elif dwell_sec < 1800:
                        conv_prob = 0.45
                    else:
                        conv_prob = 0.65
                    converted = 1 if random.random() < conv_prob else 0

                    # Realistic zone paths based on dwell type
                    if dwell_type == 'bounce':
                        zone_path = ["entrance"]
                    elif dwell_type == 'casual':
                        zone_path = ["entrance", "main_floor"]
                        if random.random() < 0.3:
                            zone_path.append("queue")
                    elif dwell_type == 'engaged':
                        zone_path = ["entrance", "main_floor"]
                        if random.random() < 0.5:
                            zone_path.append("main_floor")  # revisit
                        if converted:
                            zone_path.extend(["queue", "checkout"])
                        else:
                            if random.random() < 0.3:
                                zone_path.append("queue")
                    else:  # power
                        zone_path = ["entrance", "main_floor", "main_floor"]
                        if random.random() < 0.4:
                            zone_path.append("queue")
                        if converted:
                            zone_path.extend(["checkout"])
                        zone_path.append("main_floor")

                    # Insert session
                    con.execute(
                        """
                        INSERT INTO sessions (person_id, entry_time, exit_time, dwell_seconds, zone_path, converted, source)
                        VALUES (?, ?, ?, ?, ?, ?, 'demo')
                        """,
                        (person_id, entry_ts.isoformat(timespec="seconds"),
                         exit_ts.isoformat(timespec="seconds"), dwell_sec,
                         json.dumps(zone_path), converted)
                    )
                    total_sessions += 1

                    # Insert entry event
                    con.execute(
                        """
                        INSERT INTO events (timestamp, person_id, event_type, zone_id, direction, confidence, source)
                        VALUES (?, ?, 'entry', ?, 'in', ?, 'demo')
                        """,
                        (entry_ts.isoformat(timespec="seconds"), person_id,
                         zones.get("entrance"), round(random.uniform(0.85, 1.0), 3))
                    )
                    total_events += 1

                    # Insert zone change events for every transition in the path
                    current_ts = entry_ts
                    for zone_name in zone_path[1:]:
                        step_secs = max(20, dwell_sec // (len(zone_path)))
                        current_ts += timedelta(seconds=random.randint(int(step_secs * 0.5), int(step_secs * 1.5)))
                        if current_ts < exit_ts and zone_name in zones:
                            con.execute(
                                """
                                INSERT INTO events (timestamp, person_id, event_type, zone_id, direction, confidence, source)
                                VALUES (?, ?, 'zone_change', ?, 'lateral', ?, 'demo')
                                """,
                                (current_ts.isoformat(timespec="seconds"), person_id,
                                 zones.get(zone_name), round(random.uniform(0.85, 1.0), 3))
                            )
                            total_events += 1

                    # Insert exit event
                    con.execute(
                        """
                        INSERT INTO events (timestamp, person_id, event_type, zone_id, direction, confidence, source)
                        VALUES (?, ?, 'exit', ?, 'out', ?, 'demo')
                        """,
                        (exit_ts.isoformat(timespec="seconds"), person_id,
                         zones.get("entrance"), round(random.uniform(0.85, 1.0), 3))
                    )
                    total_events += 1

                # Legacy counts for backwards compatibility
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
        return jsonify({
            "avg_people": 0,
            "peak_people": 0,
            "throughput": 0,
            "hours": float(hours),
        })

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

    dwell_times = [row["dwell_seconds"] for row in sessions_data if row["dwell_seconds"]]

    if not dwell_times:
        return jsonify({
            "avg_dwell_seconds": 0,
            "min_dwell_seconds": 0,
            "max_dwell_seconds": 0,
            "median_dwell_seconds": 0,
            "distribution": {
                "under_1min": 0, "1_to_5min": 0, "5_to_15min": 0,
                "15_to_30min": 0, "over_30min": 0
            },
            "total_sessions": 0
        })

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
            return jsonify({
                "current_queue_length": 0,
                "avg_wait_seconds": 0,
                "total_queued": 0
            })

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


# ── Profile Endpoints ─────────────────────────────────────────────────────

@app.get("/api/profile")
def get_profile():
    """Get location profile settings."""
    with db() as con:
        row = con.execute("SELECT * FROM profile WHERE id = 1").fetchone()
    if not row:
        return jsonify({"error": "no profile"}), 404
    return jsonify(dict(row))


@app.put("/api/profile")
def update_profile():
    """Update location profile settings."""
    body = request.get_json() or {}
    allowed = ["store_name", "total_capacity", "camera_name", "timezone",
               "business_hours_start", "business_hours_end", "avg_transaction_value"]
    updates = {k: body[k] for k in allowed if k in body}
    if not updates:
        return jsonify({"error": "no valid fields provided"}), 400

    # Validate inputs
    if "total_capacity" in updates:
        try:
            cap = int(updates["total_capacity"])
            if cap <= 0:
                return jsonify({"error": "total_capacity must be > 0"}), 400
            updates["total_capacity"] = cap
        except (TypeError, ValueError):
            return jsonify({"error": "total_capacity must be a positive integer"}), 400
    if "business_hours_start" in updates:
        try:
            h = int(updates["business_hours_start"])
            if not (0 <= h <= 23):
                return jsonify({"error": "business_hours_start must be 0-23"}), 400
            updates["business_hours_start"] = h
        except (TypeError, ValueError):
            return jsonify({"error": "business_hours_start must be an integer 0-23"}), 400
    if "business_hours_end" in updates:
        try:
            h = int(updates["business_hours_end"])
            if not (0 <= h <= 23):
                return jsonify({"error": "business_hours_end must be 0-23"}), 400
            updates["business_hours_end"] = h
        except (TypeError, ValueError):
            return jsonify({"error": "business_hours_end must be an integer 0-23"}), 400
    if "timezone" in updates:
        tz = str(updates["timezone"]).strip()
        if not tz or "/" not in tz:
            return jsonify({"error": "timezone must be IANA format (e.g. America/New_York)"}), 400
        updates["timezone"] = tz

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values())
    values.append(datetime.now(timezone.utc).isoformat(timespec="seconds"))

    with db() as con:
        con.execute(
            f"UPDATE profile SET {set_clause}, updated_at = ? WHERE id = 1",
            values,
        )
        con.commit()
        row = con.execute("SELECT * FROM profile WHERE id = 1").fetchone()
    return jsonify(dict(row))


# ── New Analytics Endpoints ───────────────────────────────────────────────

@app.get("/api/hourly-patterns")
def hourly_patterns():
    """Returns hourly traffic breakdown (24 bins) for peak/quiet hour identification."""
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
        rows = con.execute(
            f"""
            SELECT CAST(strftime('%H', entry_time) AS INTEGER) AS hour,
                   COUNT(*) AS sessions,
                   AVG(dwell_seconds) AS avg_dwell,
                   SUM(converted) AS conversions
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY hour
            ORDER BY hour
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    # Build full 24-hour array (fill missing hours with 0)
    hour_map = {row["hour"]: dict(row) for row in rows}
    result = []
    for h in range(24):
        if h in hour_map:
            result.append({
                "hour": h,
                "label": f"{h:02d}:00",
                "sessions": hour_map[h]["sessions"],
                "avg_dwell": round(hour_map[h]["avg_dwell"] or 0, 1),
                "conversions": hour_map[h]["conversions"] or 0,
            })
        else:
            result.append({
                "hour": h,
                "label": f"{h:02d}:00",
                "sessions": 0,
                "avg_dwell": 0,
                "conversions": 0,
            })

    peak = max(result, key=lambda x: x["sessions"])
    quiet = min(result, key=lambda x: x["sessions"])

    return jsonify({
        "hours": result,
        "peak_hour": peak["hour"],
        "quiet_hour": quiet["hour"],
        "total_sessions": sum(r["sessions"] for r in result),
    })


@app.get("/api/dwell-distribution")
def dwell_distribution():
    """Returns dwell time histogram bins with counts (binned in SQL for efficiency)."""
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
        row = con.execute(
            f"""
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN dwell_seconds < 60 THEN 1 ELSE 0 END) AS under_1min,
                SUM(CASE WHEN dwell_seconds >= 60 AND dwell_seconds < 300 THEN 1 ELSE 0 END) AS min_1_5,
                SUM(CASE WHEN dwell_seconds >= 300 AND dwell_seconds < 900 THEN 1 ELSE 0 END) AS min_5_15,
                SUM(CASE WHEN dwell_seconds >= 900 AND dwell_seconds < 1800 THEN 1 ELSE 0 END) AS min_15_30,
                SUM(CASE WHEN dwell_seconds >= 1800 THEN 1 ELSE 0 END) AS over_30min
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL AND dwell_seconds IS NOT NULL{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchone()

    total = row["total"] or 0
    counts = [
        row["under_1min"] or 0,
        row["min_1_5"] or 0,
        row["min_5_15"] or 0,
        row["min_15_30"] or 0,
        row["over_30min"] or 0,
    ]

    bins = [
        {"label": "< 1 min", "min": 0, "max": 60},
        {"label": "1-5 min", "min": 60, "max": 300},
        {"label": "5-15 min", "min": 300, "max": 900},
        {"label": "15-30 min", "min": 900, "max": 1800},
        {"label": "30+ min", "min": 1800, "max": 999999},
    ]

    for b, c in zip(bins, counts):
        b["count"] = c
        b["percentage"] = round((c / total * 100) if total > 0 else 0, 1)

    return jsonify({"bins": bins, "total_sessions": total})


@app.get("/api/flow-between-zones")
def flow_between_zones():
    """Returns zone-to-zone transition counts from session zone_path data."""
    import json as _json

    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
        rows = con.execute(
            f"""
            SELECT zone_path FROM sessions
            WHERE entry_time > ? AND zone_path IS NOT NULL{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    transitions = {}
    for row in rows:
        try:
            path = _json.loads(row["zone_path"])
        except (TypeError, _json.JSONDecodeError):
            continue
        for i in range(len(path) - 1):
            key = f"{path[i]} -> {path[i+1]}"
            transitions[key] = transitions.get(key, 0) + 1

    # Sort by count descending
    sorted_transitions = sorted(transitions.items(), key=lambda x: x[1], reverse=True)
    result = [{"from": t[0].split(" -> ")[0], "to": t[0].split(" -> ")[1], "count": t[1]}
              for t in sorted_transitions]

    return jsonify({"transitions": result, "total_paths": len(rows)})


@app.get("/api/period-comparison")
def period_comparison():
    """Compare KPIs between current and previous period."""
    current_hours = parse_hours(default=24)
    now = datetime.now(timezone.utc)
    current_start = now - timedelta(hours=current_hours)
    previous_start = current_start - timedelta(hours=current_hours)
    src_sql, src_params = source_filter()

    def get_period_kpis(start, end, src_sql, src_params):
        with db() as con:
            stats = con.execute(
                f"""
                SELECT
                    COUNT(*) as total_sessions,
                    AVG(dwell_seconds) as avg_dwell,
                    SUM(converted) as conversions,
                    SUM(CASE WHEN dwell_seconds < 60 THEN 1 ELSE 0 END) as bounced,
                    SUM(CASE WHEN dwell_seconds >= 300 THEN 1 ELSE 0 END) as engaged
                FROM sessions
                WHERE entry_time > ? AND entry_time <= ? AND exit_time IS NOT NULL{src_sql}
                """,
                [start.isoformat(timespec="seconds"),
                 end.isoformat(timespec="seconds")] + src_params,
            ).fetchone()

            entries = con.execute(
                f"""
                SELECT COUNT(*) as count FROM events
                WHERE timestamp > ? AND timestamp <= ? AND event_type = 'entry'{src_sql}
                """,
                [start.isoformat(timespec="seconds"),
                 end.isoformat(timespec="seconds")] + src_params,
            ).fetchone()["count"] or 0

        total = stats["total_sessions"] or 0
        conversions = stats["conversions"] or 0
        bounced = stats["bounced"] or 0
        engaged = stats["engaged"] or 0

        return {
            "total_visitors": entries,
            "total_sessions": total,
            "avg_dwell_seconds": round(stats["avg_dwell"] or 0, 1),
            "conversions": conversions,
            "conversion_rate": round((conversions / total * 100) if total > 0 else 0, 1),
            "bounce_rate": round((bounced / total * 100) if total > 0 else 0, 1),
            "engagement_rate": round((engaged / total * 100) if total > 0 else 0, 1),
        }

    current = get_period_kpis(current_start, now, src_sql, src_params)
    previous = get_period_kpis(previous_start, current_start, src_sql, src_params)

    # Calculate % changes
    changes = {}
    for key in current:
        curr_val = current[key]
        prev_val = previous[key]
        if prev_val and prev_val != 0:
            changes[key] = round(((curr_val - prev_val) / prev_val) * 100, 1)
        else:
            changes[key] = 0.0

    return jsonify({
        "current": current,
        "previous": previous,
        "changes": changes,
        "period_hours": current_hours,
    })


# ── Deep Analytics Endpoints ──────────────────────────────────────────────

@app.get("/api/trends")
def trends():
    """Daily aggregates for sparklines and trend charts."""
    days = int(request.args.get("days", 30))
    since = datetime.now(timezone.utc) - timedelta(days=days)
    src_sql, src_params = source_filter()

    with db() as con:
        rows = con.execute(
            f"""
            SELECT DATE(entry_time) AS date,
                   COUNT(*) AS visitors,
                   AVG(dwell_seconds) AS avg_dwell,
                   SUM(converted) AS conversions,
                   SUM(CASE WHEN dwell_seconds < 60 THEN 1 ELSE 0 END) AS bounced,
                   SUM(CASE WHEN dwell_seconds >= 300 THEN 1 ELSE 0 END) AS engaged
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY DATE(entry_time)
            ORDER BY date ASC
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

        # Get peak hour per day
        peak_rows = con.execute(
            f"""
            SELECT DATE(entry_time) AS date,
                   CAST(strftime('%H', entry_time) AS INTEGER) AS hour,
                   COUNT(*) AS cnt
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY DATE(entry_time), hour
            ORDER BY date, cnt DESC
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    # Build peak hour map (first row per date = highest count)
    peak_map = {}
    for r in peak_rows:
        if r["date"] not in peak_map:
            peak_map[r["date"]] = r["hour"]

    result = []
    for row in rows:
        total = row["visitors"] or 1
        bounced = row["bounced"] or 0
        engaged = row["engaged"] or 0
        result.append({
            "date": row["date"],
            "visitors": row["visitors"],
            "avg_dwell": round(row["avg_dwell"] or 0, 1),
            "conversions": row["conversions"] or 0,
            "bounce_rate": round(bounced / total * 100, 1),
            "engagement_rate": round(engaged / total * 100, 1),
            "peak_hour": peak_map.get(row["date"], 12),
        })

    return jsonify({"trends": result, "days": days})


@app.get("/api/sessions/recent")
def sessions_recent():
    """Individual session list for visitor detail."""
    limit = int(request.args.get("limit", 25))
    offset = int(request.args.get("offset", 0))
    src_sql, src_params = source_filter()

    with db() as con:
        rows = con.execute(
            f"""
            SELECT person_id, entry_time, exit_time, dwell_seconds, zone_path,
                   converted
            FROM sessions
            WHERE exit_time IS NOT NULL{src_sql}
            ORDER BY entry_time DESC
            LIMIT ? OFFSET ?
            """,
            src_params + [limit, offset],
        ).fetchall()

        total_row = con.execute(
            f"SELECT COUNT(*) AS cnt FROM sessions WHERE exit_time IS NOT NULL{src_sql}",
            src_params,
        ).fetchone()

    import json as _json
    sessions_list = []
    for r in rows:
        try:
            path = _json.loads(r["zone_path"]) if r["zone_path"] else []
        except Exception:
            path = []
        sessions_list.append({
            "person_id": r["person_id"],
            "entry_time": r["entry_time"],
            "exit_time": r["exit_time"],
            "dwell_seconds": r["dwell_seconds"],
            "zone_path": path,
            "converted": r["converted"],
            "zones_visited_count": len(set(path)),
        })

    return jsonify({
        "sessions": sessions_list,
        "total": total_row["cnt"],
        "limit": limit,
        "offset": offset,
    })


@app.get("/api/zones/<int:zone_id>/detail")
def zone_detail(zone_id):
    """Deep dive into a single zone: hourly pattern, daily trend, transitions."""
    hours = parse_hours(168)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    import json as _json

    with db() as con:
        zone_row = con.execute("SELECT * FROM zones WHERE id = ?", (zone_id,)).fetchone()
        if not zone_row:
            return jsonify({"error": "Zone not found"}), 404

        zone_name = zone_row["zone_name"]

        # Hourly pattern (24 buckets)
        hourly = con.execute(
            """
            SELECT CAST(strftime('%H', timestamp) AS INTEGER) AS hour,
                   COUNT(*) AS events,
                   COUNT(DISTINCT person_id) AS unique_visitors
            FROM events
            WHERE zone_id = ? AND timestamp > ?
            GROUP BY hour ORDER BY hour
            """,
            (zone_id, since.isoformat(timespec="seconds")),
        ).fetchall()

        # Daily trend (7 days)
        daily = con.execute(
            """
            SELECT DATE(timestamp) AS date,
                   COUNT(*) AS events,
                   COUNT(DISTINCT person_id) AS unique_visitors
            FROM events
            WHERE zone_id = ? AND timestamp > ?
            GROUP BY date ORDER BY date
            """,
            (zone_id, since.isoformat(timespec="seconds")),
        ).fetchall()

        # Avg dwell for sessions that visited this zone
        dwell_row = con.execute(
            """
            SELECT AVG(dwell_seconds) AS avg_dwell,
                   SUM(converted) AS conversions,
                   COUNT(*) AS total
            FROM sessions
            WHERE entry_time > ? AND zone_path LIKE ? AND exit_time IS NOT NULL
            """,
            (since.isoformat(timespec="seconds"), f'%"{zone_name}"%'),
        ).fetchone()

        # Zone transitions from zone_path
        paths = con.execute(
            "SELECT zone_path FROM sessions WHERE entry_time > ? AND zone_path IS NOT NULL",
            (since.isoformat(timespec="seconds"),),
        ).fetchall()

    # Process transitions
    inbound = {}
    outbound = {}
    for row in paths:
        try:
            path = _json.loads(row["zone_path"])
        except Exception:
            continue
        for i, z in enumerate(path):
            if z == zone_name:
                if i > 0:
                    inbound[path[i - 1]] = inbound.get(path[i - 1], 0) + 1
                if i < len(path) - 1:
                    outbound[path[i + 1]] = outbound.get(path[i + 1], 0) + 1

    # Build hourly array
    hour_map = {r["hour"]: dict(r) for r in hourly}
    hourly_result = []
    for h in range(24):
        hourly_result.append({
            "hour": h,
            "events": hour_map[h]["events"] if h in hour_map else 0,
            "unique_visitors": hour_map[h]["unique_visitors"] if h in hour_map else 0,
        })

    total_events = sum(h["events"] for h in hourly_result)
    capacity = zone_row["capacity"] or 1
    total = dwell_row["total"] or 1
    conversions = dwell_row["conversions"] or 0

    return jsonify({
        "zone_id": zone_id,
        "zone_name": zone_name,
        "zone_type": zone_row["zone_type"],
        "capacity": capacity,
        "hourly_pattern": hourly_result,
        "daily_trend": [dict(r) for r in daily],
        "avg_dwell": round(dwell_row["avg_dwell"] or 0, 1),
        "conversion_rate": round(conversions / total * 100, 1),
        "total_events": total_events,
        "utilization_pct": round(total_events / (capacity * 24) * 100, 1) if capacity > 0 else 0,
        "top_inbound": sorted(inbound.items(), key=lambda x: -x[1])[:5],
        "top_outbound": sorted(outbound.items(), key=lambda x: -x[1])[:5],
    })


@app.get("/api/anomalies")
def anomalies():
    """Real anomaly detection: compare hourly counts to 7-day rolling average."""
    hours = parse_hours(168)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
        # Get hourly session counts
        rows = con.execute(
            f"""
            SELECT substr(entry_time, 1, 13) AS hour_bucket,
                   CAST(strftime('%H', entry_time) AS INTEGER) AS hour_of_day,
                   CAST(strftime('%w', entry_time) AS INTEGER) AS day_of_week,
                   COUNT(*) AS count
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY hour_bucket
            ORDER BY hour_bucket
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    if not rows:
        return jsonify({"anomalies": [], "total_hours_analyzed": 0})

    # Build average by hour-of-day
    from collections import defaultdict
    hour_counts = defaultdict(list)
    for r in rows:
        hour_counts[r["hour_of_day"]].append(r["count"])

    # Compute mean and std for each hour-of-day
    hour_stats = {}
    for h, counts in hour_counts.items():
        mean = sum(counts) / len(counts)
        variance = sum((c - mean) ** 2 for c in counts) / max(len(counts) - 1, 1)
        std = variance ** 0.5
        hour_stats[h] = {"mean": mean, "std": max(std, 1)}

    # Flag deviations > 1.5 sigma
    anomaly_list = []
    for r in rows:
        stats = hour_stats.get(r["hour_of_day"], {"mean": 0, "std": 1})
        deviation = abs(r["count"] - stats["mean"])
        if stats["std"] > 0 and deviation > 1.5 * stats["std"]:
            deviation_pct = round((r["count"] - stats["mean"]) / stats["mean"] * 100, 1) if stats["mean"] > 0 else 0
            anomaly_list.append({
                "hour": r["hour_bucket"],
                "actual": r["count"],
                "expected": round(stats["mean"], 1),
                "deviation_pct": deviation_pct,
                "type": "spike" if r["count"] > stats["mean"] else "drop",
                "sigma": round(deviation / stats["std"], 2),
            })

    # Sort by severity
    anomaly_list.sort(key=lambda x: abs(x["deviation_pct"]), reverse=True)

    return jsonify({
        "anomalies": anomaly_list[:50],
        "total_hours_analyzed": len(rows),
    })


@app.get("/api/forecast")
def forecast():
    """Historical-based forecast: day-of-week averages from past 4 weeks."""
    days = int(request.args.get("days", 7))
    now = datetime.now(timezone.utc)
    four_weeks_ago = now - timedelta(days=28)
    src_sql, src_params = source_filter()

    with db() as con:
        # Day-of-week averages
        rows = con.execute(
            f"""
            SELECT CAST(strftime('%w', entry_time) AS INTEGER) AS dow,
                   DATE(entry_time) AS date,
                   COUNT(*) AS visitors
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY date
            ORDER BY date
            """,
            [four_weeks_ago.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

        # Hour-of-day averages for today's remaining hours
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        hourly_rows = con.execute(
            f"""
            SELECT CAST(strftime('%H', entry_time) AS INTEGER) AS hour,
                   COUNT(*) AS avg_count
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY hour
            """,
            [four_weeks_ago.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    # Compute day-of-week averages
    from collections import defaultdict
    dow_totals = defaultdict(list)
    for r in rows:
        dow_totals[r["dow"]].append(r["visitors"])

    dow_avg = {}
    dow_std = {}
    for dow, counts in dow_totals.items():
        mean = sum(counts) / len(counts)
        variance = sum((c - mean) ** 2 for c in counts) / max(len(counts) - 1, 1)
        dow_avg[dow] = round(mean)
        dow_std[dow] = round(variance ** 0.5)

    # Build forecast for next N days
    day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    forecast_days = []
    for d in range(days):
        future = now + timedelta(days=d)
        dow = int(future.strftime("%w"))
        predicted = dow_avg.get(dow, 0)
        std = dow_std.get(dow, 0)
        forecast_days.append({
            "date": future.strftime("%Y-%m-%d"),
            "day_name": day_names[dow],
            "predicted_visitors": predicted,
            "lower_bound": max(0, predicted - std),
            "upper_bound": predicted + std,
        })

    # Hour-of-day predictions for today
    weeks_count = max(1, len(set(r["date"] for r in rows)) // 7)
    hourly_forecast = []
    for r in hourly_rows:
        hourly_forecast.append({
            "hour": r["hour"],
            "predicted": round(r["avg_count"] / weeks_count),
        })

    return jsonify({
        "daily_forecast": forecast_days,
        "hourly_forecast": hourly_forecast,
        "based_on_weeks": weeks_count,
    })


@app.get("/api/peak-analysis")
def peak_analysis():
    """Busiest/quietest patterns: day, hour, weekend vs weekday, time-of-day splits."""
    hours = parse_hours(168)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
        # Day-level
        day_rows = con.execute(
            f"""
            SELECT DATE(entry_time) AS date,
                   CAST(strftime('%w', entry_time) AS INTEGER) AS dow,
                   COUNT(*) AS visitors
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY date ORDER BY visitors DESC
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

        # Hour-level
        hour_rows = con.execute(
            f"""
            SELECT CAST(strftime('%H', entry_time) AS INTEGER) AS hour,
                   COUNT(*) AS visitors
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY hour ORDER BY visitors DESC
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

        # Weekend vs weekday
        wkday_rows = con.execute(
            f"""
            SELECT
                CASE WHEN CAST(strftime('%w', entry_time) AS INTEGER) IN (0, 6) THEN 'weekend' ELSE 'weekday' END AS period,
                COUNT(*) AS visitors,
                COUNT(DISTINCT DATE(entry_time)) AS days_count
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY period
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

        # Morning/Afternoon/Evening split
        tod_row = con.execute(
            f"""
            SELECT
                SUM(CASE WHEN CAST(strftime('%H', entry_time) AS INTEGER) BETWEEN 6 AND 11 THEN 1 ELSE 0 END) AS morning,
                SUM(CASE WHEN CAST(strftime('%H', entry_time) AS INTEGER) BETWEEN 12 AND 17 THEN 1 ELSE 0 END) AS afternoon,
                SUM(CASE WHEN CAST(strftime('%H', entry_time) AS INTEGER) BETWEEN 18 AND 23 THEN 1 ELSE 0 END) AS evening,
                SUM(CASE WHEN CAST(strftime('%H', entry_time) AS INTEGER) BETWEEN 0 AND 5 THEN 1 ELSE 0 END) AS night
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchone()

    day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    busiest_day = dict(day_rows[0]) if day_rows else {}
    quietest_day = dict(day_rows[-1]) if day_rows else {}

    wk_map = {r["period"]: r for r in wkday_rows}
    wkday_info = wk_map.get("weekday", {"visitors": 0, "days_count": 1})
    wkend_info = wk_map.get("weekend", {"visitors": 0, "days_count": 1})

    # Day-of-week averages for bar chart
    from collections import defaultdict
    dow_totals = defaultdict(list)
    for r in day_rows:
        dow_totals[r["dow"]].append(r["visitors"])
    dow_avgs = []
    for d in range(7):
        vals = dow_totals.get(d, [0])
        dow_avgs.append({
            "day": day_names[d],
            "dow": d,
            "avg_visitors": round(sum(vals) / len(vals)),
        })

    return jsonify({
        "busiest_day": {
            "date": busiest_day.get("date", ""),
            "day_name": day_names[busiest_day.get("dow", 0)],
            "visitors": busiest_day.get("visitors", 0),
        },
        "quietest_day": {
            "date": quietest_day.get("date", ""),
            "day_name": day_names[quietest_day.get("dow", 0)],
            "visitors": quietest_day.get("visitors", 0),
        },
        "busiest_hour": hour_rows[0]["hour"] if hour_rows else 0,
        "quietest_hour": hour_rows[-1]["hour"] if hour_rows else 0,
        "weekday_avg": round(wkday_info["visitors"] / max(wkday_info["days_count"], 1)),
        "weekend_avg": round(wkend_info["visitors"] / max(wkend_info["days_count"], 1)),
        "time_of_day": {
            "morning": tod_row["morning"] or 0,
            "afternoon": tod_row["afternoon"] or 0,
            "evening": tod_row["evening"] or 0,
            "night": tod_row["night"] or 0,
        },
        "dow_averages": dow_avgs,
    })


@app.get("/api/customer-journey")
def customer_journey():
    """Top zone path sequences with conversion rate and avg dwell."""
    import json as _json
    hours = parse_hours(168)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
        rows = con.execute(
            f"""
            SELECT zone_path, dwell_seconds, converted
            FROM sessions
            WHERE entry_time > ? AND zone_path IS NOT NULL AND exit_time IS NOT NULL{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    from collections import defaultdict
    path_stats = defaultdict(lambda: {"count": 0, "total_dwell": 0, "conversions": 0})
    for r in rows:
        try:
            path = _json.loads(r["zone_path"])
            key = " → ".join(path)
        except Exception:
            continue
        path_stats[key]["count"] += 1
        path_stats[key]["total_dwell"] += r["dwell_seconds"] or 0
        path_stats[key]["conversions"] += r["converted"] or 0

    # Top 10 by count
    sorted_paths = sorted(path_stats.items(), key=lambda x: -x[1]["count"])[:10]
    result = []
    for path_str, stats in sorted_paths:
        count = stats["count"]
        result.append({
            "path": path_str,
            "sessions": count,
            "avg_dwell": round(stats["total_dwell"] / count, 1),
            "conversion_rate": round(stats["conversions"] / count * 100, 1),
        })

    return jsonify({"journeys": result, "total_sessions": len(rows)})


@app.get("/api/cohort-analysis")
def cohort_analysis():
    """Visitor segments: Quick (<2min), Casual (2-10min), Engaged (10-30min), Power (30min+)."""
    hours = parse_hours(168)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()
    import json as _json

    with db() as con:
        rows = con.execute(
            f"""
            SELECT dwell_seconds, converted, zone_path
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL AND dwell_seconds IS NOT NULL{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    cohorts = {
        "quick": {"label": "Quick Browsers", "min": 0, "max": 120, "count": 0, "conversions": 0, "zones_total": 0},
        "casual": {"label": "Casual Visitors", "min": 120, "max": 600, "count": 0, "conversions": 0, "zones_total": 0},
        "engaged": {"label": "Engaged Shoppers", "min": 600, "max": 1800, "count": 0, "conversions": 0, "zones_total": 0},
        "power": {"label": "Power Visitors", "min": 1800, "max": 999999, "count": 0, "conversions": 0, "zones_total": 0},
    }

    for r in rows:
        dwell = r["dwell_seconds"]
        for key, c in cohorts.items():
            if c["min"] <= dwell < c["max"]:
                c["count"] += 1
                c["conversions"] += r["converted"] or 0
                try:
                    path = _json.loads(r["zone_path"]) if r["zone_path"] else []
                    c["zones_total"] += len(set(path))
                except Exception:
                    pass
                break

    total = len(rows) or 1
    result = []
    for key, c in cohorts.items():
        count = c["count"] or 1
        result.append({
            "id": key,
            "label": c["label"],
            "count": c["count"],
            "pct_of_total": round(c["count"] / total * 100, 1),
            "conversion_rate": round(c["conversions"] / count * 100, 1),
            "avg_zones": round(c["zones_total"] / count, 1),
        })

    return jsonify({"cohorts": result, "total_sessions": len(rows)})


@app.get("/api/realtime-snapshot")
def realtime_snapshot():
    """Live state: active sessions, entries/exits last hour, velocity, peak today."""
    now = datetime.now(timezone.utc)
    five_min_ago = (now - timedelta(minutes=5)).isoformat(timespec="seconds")
    one_hour_ago = (now - timedelta(hours=1)).isoformat(timespec="seconds")
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat(timespec="seconds")

    with db() as con:
        # Active sessions (entry in last 5 min, not exited)
        active = con.execute(
            "SELECT COUNT(*) AS cnt FROM sessions WHERE entry_time > ? AND exit_time IS NULL",
            (five_min_ago,),
        ).fetchone()["cnt"]

        # Also count sessions with entry in last 5 min regardless of exit (for demo data)
        active_recent = con.execute(
            "SELECT COUNT(*) AS cnt FROM sessions WHERE entry_time > ?",
            (five_min_ago,),
        ).fetchone()["cnt"]

        # Entries/exits last hour
        hourly = con.execute(
            """
            SELECT
                SUM(CASE WHEN event_type = 'entry' THEN 1 ELSE 0 END) AS entries,
                SUM(CASE WHEN event_type = 'exit' THEN 1 ELSE 0 END) AS exits
            FROM events WHERE timestamp > ?
            """,
            (one_hour_ago,),
        ).fetchone()

        # Peak today (busiest hour)
        peak = con.execute(
            """
            SELECT CAST(strftime('%H', entry_time) AS INTEGER) AS hour,
                   COUNT(*) AS cnt
            FROM sessions WHERE entry_time > ?
            GROUP BY hour ORDER BY cnt DESC LIMIT 1
            """,
            (today_start,),
        ).fetchone()

        # Today total
        today_total = con.execute(
            "SELECT COUNT(*) AS cnt FROM sessions WHERE entry_time > ?",
            (today_start,),
        ).fetchone()["cnt"]

    entries = (hourly["entries"] or 0) if hourly else 0
    exits = (hourly["exits"] or 0) if hourly else 0

    return jsonify({
        "active_sessions": max(active, active_recent),
        "entries_last_hour": entries,
        "exits_last_hour": exits,
        "velocity_per_min": round(entries / 60, 2),
        "peak_hour_today": peak["hour"] if peak else 0,
        "peak_count_today": peak["cnt"] if peak else 0,
        "total_today": today_total,
    })


@app.get("/api/zone-rankings")
def zone_rankings():
    """Zones ranked by traffic with detailed metrics."""
    hours = parse_hours(24)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    import json as _json

    with db() as con:
        zones_list = con.execute("SELECT * FROM zones").fetchall()

        zone_stats = con.execute(
            """
            SELECT z.id, z.zone_name, z.capacity, z.zone_type,
                   COUNT(e.id) AS total_events,
                   COUNT(DISTINCT e.person_id) AS unique_visitors
            FROM zones z
            LEFT JOIN events e ON z.id = e.zone_id AND e.timestamp > ?
            GROUP BY z.id ORDER BY total_events DESC
            """,
            (since.isoformat(timespec="seconds"),),
        ).fetchall()

        # Get dwell per zone from sessions
        session_rows = con.execute(
            "SELECT zone_path, dwell_seconds, converted FROM sessions WHERE entry_time > ? AND exit_time IS NOT NULL",
            (since.isoformat(timespec="seconds"),),
        ).fetchall()

    # Compute per-zone dwell and conversion
    from collections import defaultdict
    zone_dwell = defaultdict(list)
    zone_conv = defaultdict(lambda: {"total": 0, "converted": 0})
    for r in session_rows:
        try:
            path = _json.loads(r["zone_path"]) if r["zone_path"] else []
        except Exception:
            continue
        for z in set(path):
            zone_dwell[z].append(r["dwell_seconds"] or 0)
            zone_conv[z]["total"] += 1
            zone_conv[z]["converted"] += r["converted"] or 0

    result = []
    for r in zone_stats:
        name = r["zone_name"]
        dwell_list = zone_dwell.get(name, [0])
        conv = zone_conv.get(name, {"total": 1, "converted": 0})
        cap = r["capacity"] or 1
        result.append({
            "zone_id": r["id"],
            "zone_name": name,
            "zone_type": r["zone_type"],
            "capacity": r["capacity"],
            "total_events": r["total_events"],
            "unique_visitors": r["unique_visitors"],
            "avg_dwell": round(sum(dwell_list) / len(dwell_list), 1),
            "conversion_rate": round(conv["converted"] / max(conv["total"], 1) * 100, 1),
            "utilization_pct": round(r["unique_visitors"] / cap * 100, 1) if cap > 0 else 0,
        })

    return jsonify({"zones": result, "hours": hours})


@app.get("/api/revenue-estimates")
def revenue_estimates():
    """Revenue modeling from conversion data and configurable avg transaction value."""
    hours = parse_hours(168)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()
    import json as _json

    with db() as con:
        # Get avg_transaction_value from profile
        profile = con.execute("SELECT * FROM profile WHERE id = 1").fetchone()
        avg_txn = 25.0
        if profile:
            try:
                avg_txn = float(profile["avg_transaction_value"] or 25.0)
            except Exception:
                avg_txn = 25.0

        stats = con.execute(
            f"""
            SELECT COUNT(*) AS total_sessions,
                   SUM(converted) AS total_conversions
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchone()

        # Per-zone revenue
        session_rows = con.execute(
            f"""
            SELECT zone_path, converted FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL AND converted = 1{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

        # Daily revenue
        daily = con.execute(
            f"""
            SELECT DATE(entry_time) AS date,
                   SUM(converted) AS conversions
            FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL{src_sql}
            GROUP BY date ORDER BY date
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

    total = stats["total_sessions"] or 1
    conversions = stats["total_conversions"] or 0
    estimated_revenue = conversions * avg_txn

    # Zone revenue attribution
    from collections import defaultdict
    zone_revenue = defaultdict(int)
    for r in session_rows:
        try:
            path = _json.loads(r["zone_path"]) if r["zone_path"] else []
        except Exception:
            continue
        # Attribute to checkout zone if present, else last zone
        if "checkout" in path:
            zone_revenue["checkout"] += 1
        elif path:
            zone_revenue[path[-1]] += 1

    zone_rev_list = [{"zone": z, "conversions": c, "estimated_revenue": round(c * avg_txn, 2)}
                     for z, c in sorted(zone_revenue.items(), key=lambda x: -x[1])]

    daily_rev = [{"date": r["date"], "conversions": r["conversions"] or 0,
                  "estimated_revenue": round((r["conversions"] or 0) * avg_txn, 2)} for r in daily]

    num_days = len(daily) or 1
    return jsonify({
        "total_conversions": conversions,
        "avg_transaction_value": avg_txn,
        "estimated_revenue": round(estimated_revenue, 2),
        "revenue_per_visitor": round(estimated_revenue / total, 2),
        "daily_avg_revenue": round(estimated_revenue / num_days, 2),
        "conversion_value": round(avg_txn, 2),
        "zone_revenue": zone_rev_list,
        "daily_revenue": daily_rev,
        "hours": hours,
    })


@app.get("/api/hourly-comparison")
def hourly_comparison():
    """Today vs Yesterday vs Last Week same day — 3-line overlay data."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    last_week_start = today_start - timedelta(days=7)
    src_sql, src_params = source_filter()

    def get_hourly(start, end):
        with db() as con:
            rows = con.execute(
                f"""
                SELECT CAST(strftime('%H', entry_time) AS INTEGER) AS hour,
                       COUNT(*) AS visitors
                FROM sessions
                WHERE entry_time >= ? AND entry_time < ? AND exit_time IS NOT NULL{src_sql}
                GROUP BY hour
                """,
                [start.isoformat(timespec="seconds"),
                 end.isoformat(timespec="seconds")] + src_params,
            ).fetchall()
        return {r["hour"]: r["visitors"] for r in rows}

    today_data = get_hourly(today_start, today_start + timedelta(days=1))
    yesterday_data = get_hourly(yesterday_start, today_start)
    last_week_data = get_hourly(last_week_start, last_week_start + timedelta(days=1))

    result = []
    for h in range(24):
        result.append({
            "hour": h,
            "label": f"{h:02d}:00",
            "today": today_data.get(h, 0),
            "yesterday": yesterday_data.get(h, 0),
            "last_week": last_week_data.get(h, 0),
        })

    return jsonify({"comparison": result})


if __name__ == "__main__":
    # Dev server
    import sys
    app.run(host="0.0.0.0", port=8000, debug=False)