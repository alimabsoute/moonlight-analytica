"""
Gate 2.2 — Zone system tests.

Tests the point-in-polygon engine and zone transition detection.
All geometry is in normalized image coordinates (0.0–1.0).
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from zone_engine import point_in_polygon, find_zone_for_point, detect_zone_transition


class TestPointInRectangle:
    """Ray-casting PIP on axis-aligned rectangles."""

    RECT = [(0.1, 0.1), (0.5, 0.1), (0.5, 0.5), (0.1, 0.5)]

    def test_center_is_inside(self):
        assert point_in_polygon(0.3, 0.3, self.RECT) is True

    def test_outside_right(self):
        assert point_in_polygon(0.7, 0.3, self.RECT) is False

    def test_outside_above(self):
        assert point_in_polygon(0.3, 0.0, self.RECT) is False

    def test_outside_below(self):
        assert point_in_polygon(0.3, 0.9, self.RECT) is False

    def test_outside_left(self):
        assert point_in_polygon(0.0, 0.3, self.RECT) is False


class TestPointInIrregularPolygon:
    """Ray-casting PIP on an L-shaped polygon."""

    # L-shape: full square minus top-right quadrant
    L_SHAPE = [
        (0.0, 0.0), (1.0, 0.0), (1.0, 0.5),
        (0.5, 0.5), (0.5, 1.0), (0.0, 1.0),
    ]

    def test_bottom_left_inside(self):
        assert point_in_polygon(0.25, 0.75, self.L_SHAPE) is True

    def test_bottom_right_inside(self):
        assert point_in_polygon(0.75, 0.25, self.L_SHAPE) is True

    def test_top_right_cut_out(self):
        """The cut-out corner should be outside."""
        assert point_in_polygon(0.75, 0.75, self.L_SHAPE) is False

    def test_far_outside(self):
        assert point_in_polygon(1.5, 1.5, self.L_SHAPE) is False


class TestPointInConcavePolygon:
    """Ray-casting PIP on a concave (arrow/chevron) polygon."""

    # Arrow pointing right — concave on the left side
    ARROW = [
        (0.0, 0.3), (0.6, 0.3), (0.6, 0.1),
        (1.0, 0.5),
        (0.6, 0.9), (0.6, 0.7), (0.0, 0.7),
    ]

    def test_shaft_center_inside(self):
        assert point_in_polygon(0.3, 0.5, self.ARROW) is True

    def test_arrowhead_tip_inside(self):
        assert point_in_polygon(0.85, 0.5, self.ARROW) is True

    def test_above_shaft_outside(self):
        assert point_in_polygon(0.3, 0.1, self.ARROW) is False

    def test_below_shaft_outside(self):
        assert point_in_polygon(0.3, 0.9, self.ARROW) is False


class TestFindZoneForPoint:
    """find_zone_for_point returns the ID of the first matching zone."""

    ZONES = [
        {"id": 1, "zone_name": "entrance", "polygon_image": [[0.0, 0.0], [0.3, 0.0], [0.3, 1.0], [0.0, 1.0]]},
        {"id": 2, "zone_name": "main_floor", "polygon_image": [[0.3, 0.0], [1.0, 0.0], [1.0, 1.0], [0.3, 1.0]]},
    ]

    def test_point_in_entrance(self):
        assert find_zone_for_point(0.15, 0.5, self.ZONES) == 1

    def test_point_in_main_floor(self):
        assert find_zone_for_point(0.65, 0.5, self.ZONES) == 2

    def test_point_in_no_zone_returns_none(self):
        # Outside all zones
        assert find_zone_for_point(1.5, 0.5, self.ZONES) is None

    def test_empty_zone_list_returns_none(self):
        assert find_zone_for_point(0.5, 0.5, []) is None

    def test_zone_without_polygon_is_skipped(self):
        """Zones missing polygon_image are skipped, not crashed."""
        zones = [
            {"id": 1, "zone_name": "no_poly"},  # no polygon_image
            {"id": 2, "zone_name": "has_poly", "polygon_image": [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]]},
        ]
        assert find_zone_for_point(0.5, 0.5, zones) == 2


class TestZoneTransitionDetection:
    """detect_zone_transition returns (from_zone_id, to_zone_id) or None."""

    def test_same_zone_no_transition(self):
        assert detect_zone_transition(1, 1) is None

    def test_zone_change_detected(self):
        assert detect_zone_transition(1, 2) == (1, 2)

    def test_entry_from_no_zone(self):
        """Person entering from outside (prev=None) is an entry, not a transition."""
        result = detect_zone_transition(None, 2)
        assert result == (None, 2)

    def test_exit_to_no_zone(self):
        """Person leaving frame (next=None) is an exit."""
        result = detect_zone_transition(1, None)
        assert result == (1, None)

    def test_both_none_no_transition(self):
        assert detect_zone_transition(None, None) is None
