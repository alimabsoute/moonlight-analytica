"""
Gate 3.1 tests — Camera calibration backend.

Uses a synthetic calibration where pixel space maps to world space via a
known scale: world_x = px/100, world_y = py/100 (100 px = 1 metre).
This gives a predictable H that all projection tests can assert against.

Tests:
  test_save_calibration       — POST with 4 reference points returns H matrix
  test_get_calibration        — GET returns stored H + points
  test_known_projection       — pixel→world matches expected (±5 cm = ±0.05 m)
  test_roundtrip_projection   — world→pixel→world within ±0.05 m
  test_reprojection_error     — error < 5 pixels for calibration points
"""

import json
import math
import numpy as np
import pytest


# Synthetic reference points: a 4-metre × 3-metre floor rectangle,
# mapped to the pixel rectangle 0..400 × 0..300 (100 px = 1 m).
PIXEL_PTS = [
    [0.0,   0.0],
    [400.0, 0.0],
    [400.0, 300.0],
    [0.0,   300.0],
]
WORLD_PTS = [
    [0.0, 0.0],
    [4.0, 0.0],
    [4.0, 3.0],
    [0.0, 3.0],
]

CAMERA_ID = "cam_entrance"


class TestSaveCalibration:
    def test_save_calibration(self, client):
        """POST /api/calibration/<id> with 4 reference points returns H matrix."""
        resp = client.post(
            f"/api/calibration/{CAMERA_ID}",
            json={"pixel_points": PIXEL_PTS, "world_points": WORLD_PTS},
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["camera_id"] == CAMERA_ID
        assert data["action"] == "created"
        assert "h_matrix" in data
        # H is a 3×3 matrix serialised as [[...],[...],[...]]
        H = data["h_matrix"]
        assert len(H) == 3
        assert all(len(row) == 3 for row in H)
        assert data["num_points"] == 4

    def test_save_calibration_requires_points(self, client):
        """POST without pixel_points returns 400."""
        resp = client.post(
            "/api/calibration/cam_x",
            json={"world_points": WORLD_PTS},
        )
        assert resp.status_code == 400

    def test_save_calibration_requires_4_points(self, client):
        """POST with only 3 pairs returns 422."""
        resp = client.post(
            "/api/calibration/cam_x",
            json={
                "pixel_points": PIXEL_PTS[:3],
                "world_points": WORLD_PTS[:3],
            },
        )
        assert resp.status_code == 422

    def test_save_calibration_upsert(self, client):
        """Second POST to same camera_id updates (HTTP 200, action=updated)."""
        client.post(
            f"/api/calibration/{CAMERA_ID}",
            json={"pixel_points": PIXEL_PTS, "world_points": WORLD_PTS},
        )
        resp = client.post(
            f"/api/calibration/{CAMERA_ID}",
            json={"pixel_points": PIXEL_PTS, "world_points": WORLD_PTS},
        )
        assert resp.status_code == 200
        assert resp.get_json()["action"] == "updated"


class TestGetCalibration:
    def test_get_calibration(self, client):
        """GET /api/calibration/<id> returns stored H + source points."""
        client.post(
            f"/api/calibration/{CAMERA_ID}",
            json={"pixel_points": PIXEL_PTS, "world_points": WORLD_PTS},
        )
        resp = client.get(f"/api/calibration/{CAMERA_ID}")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["camera_id"] == CAMERA_ID
        assert data["pixel_points"] == PIXEL_PTS
        assert data["world_points"] == WORLD_PTS
        assert len(data["h_matrix"]) == 3
        assert "reprojection_error" in data
        assert "created_at" in data

    def test_get_calibration_missing(self, client):
        """GET for unknown camera_id returns 404."""
        resp = client.get("/api/calibration/nonexistent_cam")
        assert resp.status_code == 404


class TestKnownProjection:
    def _get_h(self, client):
        resp = client.post(
            f"/api/calibration/{CAMERA_ID}",
            json={"pixel_points": PIXEL_PTS, "world_points": WORLD_PTS},
        )
        return resp.get_json()["h_matrix"]

    def _project(self, H, px, py):
        H_arr = np.array(H, dtype=np.float64)
        pt_h = H_arr @ np.array([px, py, 1.0])
        return pt_h[0] / pt_h[2], pt_h[1] / pt_h[2]

    def test_known_projection(self, client):
        """
        pixel→world: centre of image (200,150) should map to world (2.0, 1.5).
        Tolerance: ±0.05 m (5 cm).
        """
        H = self._get_h(client)
        wx, wy = self._project(H, 200.0, 150.0)
        assert abs(wx - 2.0) < 0.05, f"world_x={wx:.4f} expected ~2.0"
        assert abs(wy - 1.5) < 0.05, f"world_y={wy:.4f} expected ~1.5"

    def test_known_projection_corner(self, client):
        """Origin pixel (0,0) must map to world origin (0,0)."""
        H = self._get_h(client)
        wx, wy = self._project(H, 0.0, 0.0)
        assert abs(wx) < 0.05
        assert abs(wy) < 0.05

    def test_known_projection_far_corner(self, client):
        """Pixel (400,300) must map to world (4.0, 3.0)."""
        H = self._get_h(client)
        wx, wy = self._project(H, 400.0, 300.0)
        assert abs(wx - 4.0) < 0.05
        assert abs(wy - 3.0) < 0.05


class TestRoundtripProjection:
    def test_roundtrip_projection(self, client):
        """
        world→pixel→world within ±0.05 m.
        Use H_inv (world→pixel) then H (pixel→world) to close the loop.
        """
        resp = client.post(
            f"/api/calibration/{CAMERA_ID}",
            json={"pixel_points": PIXEL_PTS, "world_points": WORLD_PTS},
        )
        H = np.array(resp.get_json()["h_matrix"], dtype=np.float64)
        H_inv = np.linalg.inv(H)

        # Test several interior world points
        test_points = [(1.0, 1.0), (2.0, 2.0), (3.5, 0.5), (0.5, 2.5)]
        for wx0, wy0 in test_points:
            # world → pixel via H_inv
            px_h = H_inv @ np.array([wx0, wy0, 1.0])
            px, py = px_h[0] / px_h[2], px_h[1] / px_h[2]

            # pixel → world via H
            wpt_h = H @ np.array([px, py, 1.0])
            wx1, wy1 = wpt_h[0] / wpt_h[2], wpt_h[1] / wpt_h[2]

            assert abs(wx1 - wx0) < 0.05, f"wx roundtrip: {wx0}→{wx1}"
            assert abs(wy1 - wy0) < 0.05, f"wy roundtrip: {wy0}→{wy1}"


class TestReprojectionError:
    def test_reprojection_error(self, client):
        """Reprojection error must be < 5 pixels for a clean synthetic calibration."""
        resp = client.post(
            f"/api/calibration/{CAMERA_ID}",
            json={"pixel_points": PIXEL_PTS, "world_points": WORLD_PTS},
        )
        data = resp.get_json()
        err = data["reprojection_error"]
        assert err is not None
        assert err < 5.0, f"reprojection_error={err:.3f} px should be < 5.0"

    def test_reprojection_error_stored(self, client):
        """GET also returns reprojection_error (persisted in DB)."""
        client.post(
            f"/api/calibration/{CAMERA_ID}",
            json={"pixel_points": PIXEL_PTS, "world_points": WORLD_PTS},
        )
        data = client.get(f"/api/calibration/{CAMERA_ID}").get_json()
        assert data["reprojection_error"] is not None
        assert data["reprojection_error"] < 5.0
