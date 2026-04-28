# backend/zone_geometry.py — World-space zone projection helpers
#
# JANUS-ZONE-MODEL.md (locked 2026-04-27): zones are 3D world-space planes
# anchored to physical surfaces. This module computes the projection from
# world-space corners through a camera homography to image pixel polygons.
#
# Derived projections (polygon_image) are cached in the zones table for
# performance, but world-space (polygon_world_3d + rotation_matrix) is the
# authoritative source.

from __future__ import annotations

import json
import math
from typing import List, Optional

import numpy as np


# ============================================================
# Rotation matrix helpers
# ============================================================

def identity_rotation() -> List[List[float]]:
    """Identity rotation = zone lies flat on the floor (xy-plane), normal points up."""
    return [[1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0]]


def rotation_from_euler(pitch: float, yaw: float, roll: float) -> List[List[float]]:
    """Compose a 3x3 rotation matrix from Euler angles in radians (XYZ order)."""
    cp, sp = math.cos(pitch), math.sin(pitch)
    cy, sy = math.cos(yaw), math.sin(yaw)
    cr, sr = math.cos(roll), math.sin(roll)

    # XYZ extrinsic = ZYX intrinsic
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
    R = Rz @ Ry @ Rx
    return R.tolist()


def is_floor_zone(rotation_matrix: List[List[float]], tol: float = 1e-3) -> bool:
    """Heuristic: is this zone effectively lying flat on the floor (xy-plane)?"""
    R = np.array(rotation_matrix)
    identity = np.eye(3)
    return float(np.linalg.norm(R - identity)) < tol


# ============================================================
# Polygon projection
# ============================================================

def polygon_world_3d_to_2d(
    polygon_world_3d: List[List[float]],
    rotation_matrix: Optional[List[List[float]]] = None,
) -> List[List[float]]:
    """Project a 3D world polygon onto the floor (xy-plane) by dropping Z.

    Used for legacy compatibility with 2D `polygon_world` consumers.
    Loses information for elevated/tilted zones — caller should know.
    """
    return [[float(p[0]), float(p[1])] for p in polygon_world_3d]


def polygon_world_3d_to_image(
    polygon_world_3d: List[List[float]],
    rotation_matrix: List[List[float]],
    h_matrix: List[List[float]],
    floor_only_homography: bool = True,
) -> List[List[int]]:
    """Project 3D world-space corners through a camera homography to pixel polygon.

    Args:
        polygon_world_3d: 4 corners as [[x, y, z], ...] in world meters.
        rotation_matrix: 3x3 rotation matrix applied to corners around their centroid.
        h_matrix: 3x3 homography mapping world-floor (x, y) -> image (u, v).
        floor_only_homography: if True, the homography only maps the z=0 plane.
            For elevated zones (z != 0), we currently project the (x, y) component
            ignoring z, which is approximate. Full perspective projection requires
            a 3x4 camera matrix (intrinsic + extrinsic) — future upgrade.

    Returns:
        4 image-space corners as [[u, v], ...] integer pixel coords.
    """
    pts = np.array(polygon_world_3d, dtype=np.float64)  # (4, 3)
    R = np.array(rotation_matrix, dtype=np.float64)
    H = np.array(h_matrix, dtype=np.float64)

    centroid = pts.mean(axis=0)
    centered = pts - centroid
    rotated = (R @ centered.T).T
    world_pts = rotated + centroid

    # Project the (x, y) component through the floor homography. Z is dropped under
    # floor_only_homography assumption — this is sufficient for floor zones and
    # approximate for slightly-elevated zones (bar tops at consistent height).
    if floor_only_homography:
        homog = np.column_stack([world_pts[:, 0], world_pts[:, 1], np.ones(world_pts.shape[0])])
        projected = (H @ homog.T).T  # (4, 3)
        projected /= projected[:, 2:3]
        return [[int(round(p[0])), int(round(p[1]))] for p in projected[:, :2]]
    else:
        # Future: full 3x4 projection. For now, raise so callers don't rely on it.
        raise NotImplementedError("Full 3D projection (non-floor) not yet implemented")


def derive_polygon_image_from_world(
    polygon_world_3d: List[List[float]],
    rotation_matrix: List[List[float]],
    camera_id: str,
    db_con,
) -> Optional[List[List[int]]]:
    """Look up camera homography and project a world-space zone to image pixels.

    Returns None if the camera is not calibrated (caller should handle gracefully).
    """
    row = db_con.execute(
        "SELECT h_matrix FROM camera_calibration WHERE camera_id = ?", [camera_id]
    ).fetchone()
    if row is None:
        return None
    h_matrix = json.loads(row["h_matrix"])
    return polygon_world_3d_to_image(polygon_world_3d, rotation_matrix, h_matrix)


# ============================================================
# Hit testing
# ============================================================

def point_in_zone_world(
    world_point: List[float],
    polygon_world_3d: List[List[float]],
    rotation_matrix: List[List[float]],
    surface_tolerance: float = 0.5,
) -> bool:
    """3D world-space hit test: is a point inside (or on) a zone's footprint?

    Args:
        world_point: [x, y, z] in world meters. Typically the foot anchor of a detection
            back-projected through H_inverse.
        polygon_world_3d: zone's 4 corners in world coords.
        rotation_matrix: zone's orientation.
        surface_tolerance: meters of vertical leniency. Default 0.5m means a person
            standing at the bar (z ~ 0) is counted in a bar-top zone (z = 1.0m) as
            long as they're within the xy footprint and within 0.5m vertical of the
            zone's plane after accounting for rotation. For floor zones this defaults
            to "any z" since floor zones are below all detections.

    Returns:
        True if the point is inside the zone's footprint within tolerance.
    """
    pts = np.array(polygon_world_3d, dtype=np.float64)
    R = np.array(rotation_matrix, dtype=np.float64)
    p = np.array(world_point, dtype=np.float64)

    centroid = pts.mean(axis=0)
    R_inv = R.T  # rotation matrix inverse = transpose for orthonormal
    p_local = R_inv @ (p - centroid) + centroid

    # 2D point-in-polygon on the (x, y) projection
    poly_2d = pts[:, :2]
    if not _point_in_polygon_2d(p_local[:2], poly_2d):
        return False

    # Z tolerance: if rotation is identity (floor zone), accept any z below the zone
    if is_floor_zone(rotation_matrix):
        return True

    # Otherwise, check vertical distance from the zone's plane in local coords
    return abs(p_local[2] - centroid[2]) < surface_tolerance


def _point_in_polygon_2d(point: np.ndarray, polygon: np.ndarray) -> bool:
    """Ray casting algorithm. polygon is (N, 2)."""
    x, y = float(point[0]), float(point[1])
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside
