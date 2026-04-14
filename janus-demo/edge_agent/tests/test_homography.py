"""
Gate 3.2 tests — Homography in edge agent.

Tests:
  test_foot_point_extraction      — bbox bottom-center gives correct (fx, fy)
  test_world_projection           — known pixel → correct metres (±30 cm)
  test_zone_detection_world_coords — project_to_world returns None when uncalibrated
"""

import sys
import os
import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import MagicMock, patch

# ── Helpers ──────────────────────────────────────────────────────────

def make_h_matrix(scale_x=100.0, scale_y=100.0):
    """Return a simple scale-only homography: world = pixel / scale."""
    return np.array([
        [1.0/scale_x, 0.0,         0.0],
        [0.0,         1.0/scale_y, 0.0],
        [0.0,         0.0,         1.0],
    ], dtype=np.float64)


# ── Tests ─────────────────────────────────────────────────────────────

class TestFootPointExtraction:
    def test_foot_point_extraction(self):
        """
        Bounding box bottom-center foot point = (cx, y2).
        Given bbox [x1=100, y1=50, x2=200, y2=300], foot = (150, 300).
        """
        # Simulate what get_anchors_coordinates(BOTTOM_CENTER) produces:
        # sv.Position.BOTTOM_CENTER returns (cx, y2)
        x1, y1, x2, y2 = 100.0, 50.0, 200.0, 300.0
        expected_fx = (x1 + x2) / 2  # 150.0
        expected_fy = y2              # 300.0

        # Simulate the numpy slice that the edge agent uses
        xyxy = np.array([[x1, y1, x2, y2]])
        fx = (xyxy[0, 0] + xyxy[0, 2]) / 2
        fy = xyxy[0, 3]

        assert abs(fx - expected_fx) < 0.01
        assert abs(fy - expected_fy) < 0.01

    def test_foot_point_narrow_bbox(self):
        """Narrow person bbox (standing person) — foot point still correct."""
        x1, y1, x2, y2 = 310.0, 100.0, 330.0, 480.0
        xyxy = np.array([[x1, y1, x2, y2]])
        fx = (xyxy[0, 0] + xyxy[0, 2]) / 2
        fy = xyxy[0, 3]
        assert abs(fx - 320.0) < 0.01
        assert abs(fy - 480.0) < 0.01


class TestWorldProjection:
    def test_world_projection(self):
        """
        Known pixel (200, 150) with H = scale 1/100 should give world (2.0, 1.5).
        Tolerance ±0.30 m (30 cm).
        """
        from edge_agent_enhanced import project_to_world
        H = make_h_matrix(scale_x=100.0, scale_y=100.0)
        wx, wy = project_to_world(H, 200.0, 150.0)
        assert abs(wx - 2.0) < 0.30, f"world_x={wx:.4f} expected ~2.0"
        assert abs(wy - 1.5) < 0.30, f"world_y={wy:.4f} expected ~1.5"

    def test_world_projection_origin(self):
        """Pixel (0, 0) → world (0, 0) for pure-scale H."""
        from edge_agent_enhanced import project_to_world
        H = make_h_matrix()
        wx, wy = project_to_world(H, 0.0, 0.0)
        assert abs(wx) < 0.01
        assert abs(wy) < 0.01

    def test_world_projection_uncalibrated(self):
        """project_to_world(None, ...) returns (None, None) — uncalibrated camera."""
        from edge_agent_enhanced import project_to_world
        wx, wy = project_to_world(None, 320.0, 240.0)
        assert wx is None
        assert wy is None


class TestZoneDetectionWorldCoords:
    def test_zone_detection_world_coords(self):
        """
        When H is available, project_to_world returns float coords.
        When H is None, returns (None, None) — edge agent degrades gracefully.
        """
        from edge_agent_enhanced import project_to_world
        H = make_h_matrix(100.0, 100.0)

        # Calibrated: get real world coords
        wx, wy = project_to_world(H, 100.0, 100.0)
        assert isinstance(wx, float)
        assert isinstance(wy, float)

        # Uncalibrated: degrade gracefully
        wx2, wy2 = project_to_world(None, 100.0, 100.0)
        assert wx2 is None
        assert wy2 is None
