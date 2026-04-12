# backend/zone_engine.py — Point-in-polygon and zone transition logic
from __future__ import annotations

from typing import Optional


def point_in_polygon(x: float, y: float, polygon: list) -> bool:
    """
    Ray-casting algorithm. Returns True if (x, y) is inside polygon.

    polygon: list of [x, y] or (x, y) pairs in any winding order.
    Coordinates should be consistent (e.g. both normalized 0-1 or both pixels).
    """
    n = len(polygon)
    if n < 3:
        return False
    inside = False
    px, py = x, y
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i][0], polygon[i][1]
        xj, yj = polygon[j][0], polygon[j][1]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def find_zone_for_point(x: float, y: float, zones: list) -> Optional[int]:
    """
    Return the id of the first zone whose polygon_image contains (x, y).
    Zones missing polygon_image are skipped.
    Returns None if no zone matches.
    """
    for zone in zones:
        poly = zone.get("polygon_image")
        if not poly:
            continue
        if point_in_polygon(x, y, poly):
            return zone["id"]
    return None


def detect_zone_transition(
    prev_zone_id: Optional[int], curr_zone_id: Optional[int]
) -> Optional[tuple]:
    """
    Returns (prev_zone_id, curr_zone_id) if a transition occurred, else None.
    Both None means person is outside all zones — no transition.
    """
    if prev_zone_id == curr_zone_id:
        return None
    if prev_zone_id is None and curr_zone_id is None:
        return None
    return (prev_zone_id, curr_zone_id)
