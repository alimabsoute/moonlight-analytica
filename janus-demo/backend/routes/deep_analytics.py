# backend/routes/deep_analytics.py — 8 deep analytics endpoints
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify

from db import db
from helpers import parse_hours, source_filter

deep_analytics_bp = Blueprint('deep_analytics', __name__)


@deep_analytics_bp.get("/api/forecast")
def forecast():
    """Historical-based forecast: day-of-week averages from past 4 weeks."""
    days = int(request.args.get("days", 7))
    now = datetime.now(timezone.utc)
    four_weeks_ago = now - timedelta(days=28)
    src_sql, src_params = source_filter()

    with db() as con:
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


@deep_analytics_bp.get("/api/peak-analysis")
def peak_analysis():
    """Busiest/quietest patterns: day, hour, weekend vs weekday, time-of-day splits."""
    hours = parse_hours(168)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()

    with db() as con:
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


@deep_analytics_bp.get("/api/customer-journey")
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
            key = " \u2192 ".join(path)
        except Exception:
            continue
        path_stats[key]["count"] += 1
        path_stats[key]["total_dwell"] += r["dwell_seconds"] or 0
        path_stats[key]["conversions"] += r["converted"] or 0

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


@deep_analytics_bp.get("/api/cohort-analysis")
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


@deep_analytics_bp.get("/api/realtime-snapshot")
def realtime_snapshot():
    """Live state: active sessions, entries/exits last hour, velocity, peak today."""
    now = datetime.now(timezone.utc)
    five_min_ago = (now - timedelta(minutes=5)).isoformat(timespec="seconds")
    one_hour_ago = (now - timedelta(hours=1)).isoformat(timespec="seconds")
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat(timespec="seconds")

    with db() as con:
        active = con.execute(
            "SELECT COUNT(*) AS cnt FROM sessions WHERE entry_time > ? AND exit_time IS NULL",
            (five_min_ago,),
        ).fetchone()["cnt"]

        active_recent = con.execute(
            "SELECT COUNT(*) AS cnt FROM sessions WHERE entry_time > ?",
            (five_min_ago,),
        ).fetchone()["cnt"]

        hourly = con.execute(
            """
            SELECT
                SUM(CASE WHEN event_type = 'entry' THEN 1 ELSE 0 END) AS entries,
                SUM(CASE WHEN event_type = 'exit' THEN 1 ELSE 0 END) AS exits
            FROM events WHERE timestamp > ?
            """,
            (one_hour_ago,),
        ).fetchone()

        peak = con.execute(
            """
            SELECT CAST(strftime('%H', entry_time) AS INTEGER) AS hour,
                   COUNT(*) AS cnt
            FROM sessions WHERE entry_time > ?
            GROUP BY hour ORDER BY cnt DESC LIMIT 1
            """,
            (today_start,),
        ).fetchone()

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


@deep_analytics_bp.get("/api/zone-rankings")
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

        session_rows = con.execute(
            "SELECT zone_path, dwell_seconds, converted FROM sessions WHERE entry_time > ? AND exit_time IS NOT NULL",
            (since.isoformat(timespec="seconds"),),
        ).fetchall()

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


@deep_analytics_bp.get("/api/revenue-estimates")
def revenue_estimates():
    """Revenue modeling from conversion data and configurable avg transaction value."""
    hours = parse_hours(168)
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    src_sql, src_params = source_filter()
    import json as _json

    with db() as con:
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

        session_rows = con.execute(
            f"""
            SELECT zone_path, converted FROM sessions
            WHERE entry_time > ? AND exit_time IS NOT NULL AND converted = 1{src_sql}
            """,
            [since.isoformat(timespec="seconds")] + src_params,
        ).fetchall()

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

    from collections import defaultdict
    zone_revenue = defaultdict(int)
    for r in session_rows:
        try:
            path = _json.loads(r["zone_path"]) if r["zone_path"] else []
        except Exception:
            continue
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


@deep_analytics_bp.get("/api/hourly-comparison")
def hourly_comparison():
    """Today vs Yesterday vs Last Week same day -- 3-line overlay data."""
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
