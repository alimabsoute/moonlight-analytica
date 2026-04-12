# backend/routes/zones.py — Zone geometry CRUD: single source of truth
#
# These endpoints manage zone definitions WITH polygon geometry.
# The analytics /api/zones endpoint returns occupancy stats.
# This blueprint is the authoritative zone registry.
from __future__ import annotations

import json

from flask import Blueprint, jsonify, request

from db import db

zones_bp = Blueprint('zones_config', __name__)


@zones_bp.post("/api/zones/config")
def create_zone():
    """
    Create or update a zone with polygon geometry.

    Body (JSON):
      zone_name       str   required
      capacity        int   optional (default 100)
      polygon_world   list  optional — [[x,y], ...] in world/meter coords
      polygon_image   list  optional — [[x,y], ...] in pixel coords
      color           str   optional — hex color (default '#4dd8e6')
    """
    body = request.get_json(force=True, silent=True) or {}
    zone_name = body.get("zone_name") or body.get("name")
    if not zone_name:
        return jsonify({"error": "zone_name is required"}), 400

    capacity = int(body.get("capacity", 100))
    polygon_world = body.get("polygon_world")
    polygon_image = body.get("polygon_image")
    color = body.get("color", "#4dd8e6")

    # Serialize polygon arrays to JSON text for SQLite storage
    pw_json = json.dumps(polygon_world) if polygon_world is not None else None
    pi_json = json.dumps(polygon_image) if polygon_image is not None else None

    with db() as con:
        # Upsert — update geometry if zone already exists by name
        existing = con.execute(
            "SELECT id FROM zones WHERE zone_name = ?", [zone_name]
        ).fetchone()

        if existing:
            con.execute(
                """
                UPDATE zones
                SET capacity = ?, polygon_world = ?, polygon_image = ?, color = ?
                WHERE zone_name = ?
                """,
                [capacity, pw_json, pi_json, color, zone_name],
            )
            zone_id = existing["id"]
            action = "updated"
        else:
            cur = con.execute(
                """
                INSERT INTO zones (zone_name, capacity, polygon_world, polygon_image, color)
                VALUES (?, ?, ?, ?, ?)
                """,
                [zone_name, capacity, pw_json, pi_json, color],
            )
            zone_id = cur.lastrowid
            action = "created"

    return jsonify({
        "id": zone_id,
        "zone_name": zone_name,
        "capacity": capacity,
        "polygon_world": polygon_world,
        "polygon_image": polygon_image,
        "color": color,
        "action": action
    }), 201 if action == "created" else 200


@zones_bp.get("/api/zones/config")
def list_zones():
    """
    Return all zones with their polygon geometry.
    This is the authoritative zone registry for both the edge agent and frontend.
    """
    with db() as con:
        rows = con.execute(
            """
            SELECT id, zone_name, capacity,
                   polygon_world, polygon_image, color
            FROM zones
            ORDER BY id
            """
        ).fetchall()

    zones = []
    for row in rows:
        zones.append({
            "id": row["id"],
            "zone_name": row["zone_name"],
            "name": row["zone_name"],   # convenience alias for frontend
            "capacity": row["capacity"],
            "polygon_world": json.loads(row["polygon_world"]) if row["polygon_world"] else None,
            "polygon_image": json.loads(row["polygon_image"]) if row["polygon_image"] else None,
            "color": row["color"] or "#4dd8e6"
        })

    return jsonify({"zones": zones})
