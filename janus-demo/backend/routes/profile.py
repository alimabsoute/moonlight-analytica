# backend/routes/profile.py — Profile endpoints
from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, request, jsonify

from db import db

profile_bp = Blueprint('profile', __name__)


@profile_bp.get("/api/profile")
def get_profile():
    """Get location profile settings."""
    with db() as con:
        row = con.execute("SELECT * FROM profile WHERE id = 1").fetchone()
    if not row:
        return jsonify({"error": "no profile"}), 404
    return jsonify(dict(row))


@profile_bp.put("/api/profile")
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
