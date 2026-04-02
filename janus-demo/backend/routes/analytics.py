# backend/routes/analytics.py — 14 analytics endpoints
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify

from db import db
from helpers import parse_hours, source_filter

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.get("/api/dwell-time")
def dwell_time():
    """Returns dwell time analytics: avg, min, max, distribution"""
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


@analytics_bp.get("/api/occupancy")
def occupancy():
    """Returns real-time occupancy metrics"""
    with db() as con:
        total_capacity = con.execute("SELECT SUM(capacity) as total FROM zones").fetchone()["total"] or 0
        current_occupancy = con.execute(
            "SELECT COUNT(*) as count FROM sessions WHERE exit_time IS NULL"
        ).fetchone()["count"]
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


@analytics_bp.get("/api/entries-exits")
def entries_exits():
    """Returns directional traffic (entry/exit counts)"""
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


@analytics_bp.get("/api/conversion")
def conversion():
    """Returns conversion metrics (visitors who converted)"""
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


@analytics_bp.get("/api/zones")
def zones_analytics():
    """Returns zone-specific analytics"""
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


@analytics_bp.get("/api/queue")
def queue_analytics():
    """Returns queue/wait time analytics"""
    hours = parse_hours()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    with db() as con:
        queue_zone = con.execute(
            "SELECT id FROM zones WHERE zone_type = 'queue' LIMIT 1"
        ).fetchone()

        if not queue_zone:
            return jsonify({
                "current_queue_length": 0,
                "avg_wait_seconds": 0,
                "total_queued": 0
            })

        current_queue = con.execute(
            """
            SELECT COUNT(DISTINCT person_id) as queue_length
            FROM events
            WHERE zone_id = ? AND timestamp > datetime('now', '-5 minutes')
              AND event_type != 'exit'
            """,
            (queue_zone["id"],),
        ).fetchone()["queue_length"]

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


@analytics_bp.get("/api/hourly-patterns")
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


@analytics_bp.get("/api/dwell-distribution")
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


@analytics_bp.get("/api/flow-between-zones")
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

    sorted_transitions = sorted(transitions.items(), key=lambda x: x[1], reverse=True)
    result = [{"from": t[0].split(" -> ")[0], "to": t[0].split(" -> ")[1], "count": t[1]}
              for t in sorted_transitions]

    return jsonify({"transitions": result, "total_paths": len(rows)})


@analytics_bp.get("/api/period-comparison")
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


@analytics_bp.get("/api/trends")
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


@analytics_bp.get("/api/sessions/recent")
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


@analytics_bp.get("/api/zones/<int:zone_id>/detail")
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

        paths = con.execute(
            "SELECT zone_path FROM sessions WHERE entry_time > ? AND zone_path IS NOT NULL",
            (since.isoformat(timespec="seconds"),),
        ).fetchall()

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


@analytics_bp.get("/api/anomalies")
def anomalies():
    """Real anomaly detection: compare hourly counts to 7-day rolling average."""
    hours = parse_hours(168)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
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

    from collections import defaultdict
    hour_counts = defaultdict(list)
    for r in rows:
        hour_counts[r["hour_of_day"]].append(r["count"])

    hour_stats = {}
    for h, counts in hour_counts.items():
        mean = sum(counts) / len(counts)
        variance = sum((c - mean) ** 2 for c in counts) / max(len(counts) - 1, 1)
        std = variance ** 0.5
        hour_stats[h] = {"mean": mean, "std": max(std, 1)}

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

    anomaly_list.sort(key=lambda x: abs(x["deviation_pct"]), reverse=True)

    return jsonify({
        "anomalies": anomaly_list[:50],
        "total_hours_analyzed": len(rows),
    })
