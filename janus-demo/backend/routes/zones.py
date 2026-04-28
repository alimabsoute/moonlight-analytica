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

    World-space (preferred — schema_version 2):
      zone_name        str   required
      polygon_world_3d list  4 corners as [[x,y,z], ...] in world meters
      rotation_matrix  list  3x3 rotation matrix (default identity = floor zone)
      surface_type     str   floor|counter_top|table|ramp|wall|other (default 'floor')
      camera_id        str   optional FK to camera_calibration.camera_id
      capacity         int   optional (default 100)
      color            str   optional hex color (default '#4dd8e6')

    Legacy (schema_version 1, still accepted):
      polygon_world    list  2D [[x,y], ...] in world meters
      polygon_image    list  2D [[x,y], ...] in pixel coords

    If polygon_world_3d is supplied without polygon_image, and a camera_id is
    given, polygon_image is derived via the camera's homography for caching.
    """
    body = request.get_json(force=True, silent=True) or {}
    zone_name = body.get("zone_name") or body.get("name")
    if not zone_name:
        return jsonify({"error": "zone_name is required"}), 400

    capacity = int(body.get("capacity", 100))
    color = body.get("color", "#4dd8e6")

    polygon_world_3d = body.get("polygon_world_3d")
    rotation_matrix = body.get("rotation_matrix")
    surface_type = body.get("surface_type", "floor")
    camera_id = body.get("camera_id")

    polygon_world = body.get("polygon_world")     # legacy 2D
    polygon_image = body.get("polygon_image")     # legacy / cached projection

    # Determine schema version: 2 if 3D + rotation provided, else 1
    if polygon_world_3d is not None:
        schema_version = 2
        if rotation_matrix is None:
            # Default to identity (floor zone) when 3D provided but no rotation
            from zone_geometry import identity_rotation
            rotation_matrix = identity_rotation()
        # Backfill 2D legacy from 3D for downstream consumers that haven't migrated
        if polygon_world is None:
            polygon_world = [[float(p[0]), float(p[1])] for p in polygon_world_3d]
    else:
        schema_version = 1

    p3d_json = json.dumps(polygon_world_3d) if polygon_world_3d is not None else None
    rot_json = json.dumps(rotation_matrix) if rotation_matrix is not None else None
    pw_json = json.dumps(polygon_world) if polygon_world is not None else None
    pi_json = json.dumps(polygon_image) if polygon_image is not None else None

    with db() as con:
        # Auto-derive polygon_image from world-space if camera calibration available
        if (polygon_image is None and polygon_world_3d is not None
                and rotation_matrix is not None and camera_id is not None):
            from zone_geometry import polygon_world_3d_to_image
            row = con.execute(
                "SELECT h_matrix FROM camera_calibration WHERE camera_id = ?",
                [camera_id],
            ).fetchone()
            if row is not None:
                try:
                    h_matrix = json.loads(row["h_matrix"])
                    derived = polygon_world_3d_to_image(
                        polygon_world_3d, rotation_matrix, h_matrix
                    )
                    pi_json = json.dumps(derived)
                except Exception:
                    pass  # leave polygon_image NULL if projection fails

        existing = con.execute(
            "SELECT id FROM zones WHERE zone_name = ?", [zone_name]
        ).fetchone()

        if existing:
            con.execute(
                """
                UPDATE zones
                SET capacity = ?, polygon_world = ?, polygon_image = ?, color = ?,
                    polygon_world_3d = ?, rotation_matrix = ?, surface_type = ?,
                    camera_id = ?, schema_version = ?
                WHERE zone_name = ?
                """,
                [capacity, pw_json, pi_json, color, p3d_json, rot_json,
                 surface_type, camera_id, schema_version, zone_name],
            )
            zone_id = existing["id"]
            action = "updated"
        else:
            cur = con.execute(
                """
                INSERT INTO zones
                  (zone_name, capacity, polygon_world, polygon_image, color,
                   polygon_world_3d, rotation_matrix, surface_type, camera_id, schema_version)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [zone_name, capacity, pw_json, pi_json, color,
                 p3d_json, rot_json, surface_type, camera_id, schema_version],
            )
            zone_id = cur.lastrowid
            action = "created"

    return jsonify({
        "id": zone_id,
        "zone_name": zone_name,
        "capacity": capacity,
        "polygon_world_3d": polygon_world_3d,
        "rotation_matrix": rotation_matrix,
        "surface_type": surface_type,
        "camera_id": camera_id,
        "schema_version": schema_version,
        "polygon_world": polygon_world,
        "polygon_image": json.loads(pi_json) if pi_json else None,
        "color": color,
        "action": action,
    }), 201 if action == "created" else 200


@zones_bp.get("/api/zones/config")
def list_zones():
    """
    Return all zones with their polygon geometry.
    This is the authoritative zone registry for both the edge agent and frontend.

    Each zone includes both world-space (polygon_world_3d + rotation_matrix —
    schema v2 source of truth) and legacy 2D (polygon_world / polygon_image)
    fields. Frontend should prefer schema_version >= 2 fields when available.
    """
    with db() as con:
        rows = con.execute(
            """
            SELECT id, zone_name, capacity,
                   polygon_world, polygon_image, color,
                   polygon_world_3d, rotation_matrix, surface_type, camera_id,
                   schema_version
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
            "polygon_world_3d": json.loads(row["polygon_world_3d"]) if row["polygon_world_3d"] else None,
            "rotation_matrix": json.loads(row["rotation_matrix"]) if row["rotation_matrix"] else None,
            "surface_type": row["surface_type"] or "floor",
            "camera_id": row["camera_id"],
            "schema_version": row["schema_version"] or 1,
            "polygon_world": json.loads(row["polygon_world"]) if row["polygon_world"] else None,
            "polygon_image": json.loads(row["polygon_image"]) if row["polygon_image"] else None,
            "color": row["color"] or "#4dd8e6",
        })

    return jsonify({"zones": zones})
