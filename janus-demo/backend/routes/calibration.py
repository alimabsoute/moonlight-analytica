# backend/routes/calibration.py — Camera calibration: pixel ↔ world via homography
#
# Stores per-camera calibration (4+ reference point pairs → OpenCV homography).
# The H matrix is used by the edge agent to project foot-points into world coords.
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

import cv2
import numpy as np
from flask import Blueprint, jsonify, request

from db import db
from rate_limit import rate_limit

log = logging.getLogger(__name__)
calibration_bp = Blueprint('calibration', __name__)


def _compute_homography(pixel_points: list, world_points: list):
    """
    Compute homography H from pixel_points → world_points using OpenCV RANSAC.

    Returns (H_list, reprojection_error_px) or raises ValueError.
    H maps pixel coords → world coords: world_pt = H @ [px, py, 1]^T (homogeneous).
    """
    if len(pixel_points) < 4 or len(world_points) < 4:
        raise ValueError("At least 4 point pairs are required to compute homography")
    if len(pixel_points) != len(world_points):
        raise ValueError("pixel_points and world_points must have the same length")

    src = np.array(pixel_points, dtype=np.float64)
    dst = np.array(world_points, dtype=np.float64)

    H, mask = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
    if H is None:
        raise ValueError("OpenCV findHomography failed — points may be collinear")

    # Compute reprojection error (pixel space: project world→pixel and compare)
    H_inv, _ = cv2.findHomography(dst, src, cv2.RANSAC, 5.0)
    if H_inv is not None:
        n = len(pixel_points)
        src_h = np.hstack([src, np.ones((n, 1))])           # [N, 3]
        proj_h = (H_inv @ H @ src_h.T).T                    # [N, 3]
        proj = proj_h[:, :2] / proj_h[:, 2:3]               # de-homogenise
        errors = np.linalg.norm(proj - src, axis=1)
        reprojection_error = float(np.mean(errors))
    else:
        reprojection_error = None

    return H.tolist(), reprojection_error


def _project_pixel_to_world(H: list, px: float, py: float):
    """Apply homography H to a single pixel point → world coords."""
    H_arr = np.array(H, dtype=np.float64)
    pt = np.array([px, py, 1.0])
    world_h = H_arr @ pt
    return float(world_h[0] / world_h[2]), float(world_h[1] / world_h[2])


@calibration_bp.post("/api/calibration/<camera_id>")
@rate_limit(30)  # calibration is infrequent — 30 req/min is generous
def save_calibration(camera_id: str):
    """
    Store or replace calibration for a camera.

    Body (JSON):
      pixel_points  list  required — [[px,py], ...] ≥4 pairs
      world_points  list  required — [[wx,wy], ...] in metres
    """
    body = request.get_json(force=True, silent=True) or {}
    pixel_points = body.get("pixel_points")
    world_points = body.get("world_points")

    if not pixel_points or not world_points:
        return jsonify({"error": "pixel_points and world_points are required"}), 400

    try:
        h_matrix, reprojection_error = _compute_homography(pixel_points, world_points)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    with db() as con:
        existing = con.execute(
            "SELECT id FROM camera_calibration WHERE camera_id = ?", [camera_id]
        ).fetchone()

        if existing:
            con.execute(
                """
                UPDATE camera_calibration
                SET pixel_points=?, world_points=?, h_matrix=?,
                    reprojection_error=?, updated_at=?
                WHERE camera_id=?
                """,
                [
                    json.dumps(pixel_points), json.dumps(world_points),
                    json.dumps(h_matrix), reprojection_error, now, camera_id,
                ],
            )
            action = "updated"
        else:
            con.execute(
                """
                INSERT INTO camera_calibration
                  (camera_id, pixel_points, world_points, h_matrix, reprojection_error, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    camera_id, json.dumps(pixel_points), json.dumps(world_points),
                    json.dumps(h_matrix), reprojection_error, now, now,
                ],
            )
            action = "created"

    log.info(
        "calibration %s for camera '%s': %d points, reprojection error=%.4f",
        action, camera_id, len(pixel_points), reprojection_error or 0.0,
    )
    return jsonify({
        "camera_id": camera_id,
        "h_matrix": h_matrix,
        "reprojection_error": reprojection_error,
        "num_points": len(pixel_points),
        "action": action,
    }), 201 if action == "created" else 200


@calibration_bp.get("/api/calibration/<camera_id>")
def get_calibration(camera_id: str):
    """Return stored calibration + H matrix for a camera."""
    with db() as con:
        row = con.execute(
            "SELECT * FROM camera_calibration WHERE camera_id = ?", [camera_id]
        ).fetchone()

    if not row:
        return jsonify({"error": f"No calibration found for camera '{camera_id}'"}), 404

    return jsonify({
        "camera_id": row["camera_id"],
        "pixel_points": json.loads(row["pixel_points"]),
        "world_points": json.loads(row["world_points"]),
        "h_matrix": json.loads(row["h_matrix"]),
        "reprojection_error": row["reprojection_error"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    })


@calibration_bp.put("/api/calibration/<camera_id>")
def update_calibration(camera_id: str):
    """Alias for save_calibration — always recomputes H from new points."""
    return save_calibration(camera_id)


@calibration_bp.delete("/api/calibration/<camera_id>")
def delete_calibration(camera_id: str):
    """Remove calibration for a camera."""
    with db() as con:
        result = con.execute(
            "DELETE FROM camera_calibration WHERE camera_id = ?", [camera_id]
        )
    if result.rowcount == 0:
        return jsonify({"error": f"No calibration found for camera '{camera_id}'"}), 404
    return jsonify({"camera_id": camera_id, "deleted": True})
