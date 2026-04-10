# backend/routes/data.py — Core data endpoints: seed, count, KPIs, CSV, events, sessions
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify, Response

from db import db
from helpers import parse_hours, source_filter

data_bp = Blueprint('data', __name__)


@data_bp.post("/seed_demo")
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


@data_bp.post("/count")
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


@data_bp.get("/kpis")
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


@data_bp.get("/series.csv")
def series_csv():
    """
    Returns a CSV suitable for the frontend line chart.
    Columns: timestamp,count_value,peak,throughput
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


@data_bp.post("/events")
def post_event():
    """
    Receive tracking events from enhanced edge agent
    Expected: {event_type, person_id, zone_id?, direction?, confidence?, timestamp?}
    """
    body = request.get_json() or {}
    event_type = body.get("event_type")  # entry, exit, zone_change
    person_id = body.get("person_id")
    zone_id = body.get("zone_id")
    zone_name = body.get("zone")  # streamer sends zone name; look up id
    direction = body.get("direction")  # in, out, lateral
    confidence = body.get("confidence", 1.0)
    timestamp = body.get("timestamp") or datetime.now(timezone.utc).isoformat(timespec="seconds")

    if not event_type or person_id is None:
        return jsonify({"error": "event_type and person_id required"}), 400

    with db() as con:
        if zone_id is None and zone_name:
            row = con.execute("SELECT id FROM zones WHERE zone_name = ?", (zone_name,)).fetchone()
            if row:
                zone_id = row["id"]
        con.execute(
            """
            INSERT INTO events (timestamp, person_id, event_type, zone_id, direction, confidence)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (timestamp, str(person_id), event_type, zone_id, direction, confidence),
        )

    return jsonify({"ok": True, "event_type": event_type, "person_id": person_id})


@data_bp.post("/sessions")
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
