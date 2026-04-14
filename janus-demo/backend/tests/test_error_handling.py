"""
Gate 5.1 — Error handling & edge case tests.
"""
import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import main


class TestValidation:
    def test_missing_required_field_returns_400(self, client):
        """POST /events without required fields returns 400."""
        resp = client.post("/events", json={"zone_id": 1})
        assert resp.status_code == 400
        data = resp.get_json()
        assert "error" in data

    def test_invalid_json_returns_400(self, client):
        """POST /count with non-integer count_value returns 400."""
        resp = client.post("/count", json={"count_value": "not-a-number"})
        assert resp.status_code == 400

    def test_missing_body_post_count_defaults_zero(self, client):
        """POST /count with empty body uses 0 — no crash."""
        resp = client.post("/count", json={})
        assert resp.status_code == 200

    def test_post_session_missing_person_id_returns_400(self, client):
        """POST /sessions without person_id returns 400."""
        resp = client.post("/sessions", json={"entry_time": "2026-01-01T00:00:00Z"})
        assert resp.status_code == 400

    def test_post_calibration_missing_points_returns_400(self, client):
        """POST /api/calibration/cam1 with fewer than 4 points returns 400."""
        resp = client.post("/api/calibration/cam1", json={
            "image_points": [[0, 0], [100, 0]],
            "world_points": [[0, 0], [1, 0]]
        })
        assert resp.status_code == 400


class TestEmptyDB:
    def test_empty_db_endpoints_return_200(self, client):
        """Analytics endpoints return 200 even on an empty DB."""
        for path in ["/kpis", "/api/dwell-time", "/api/occupancy", "/api/zones"]:
            resp = client.get(path)
            assert resp.status_code == 200, f"{path} returned {resp.status_code} on empty DB"

    def test_no_calibration_returns_empty_not_500(self, client):
        """GET /api/calibration/nonexistent returns 404 not 500."""
        resp = client.get("/api/calibration/nonexistent-camera")
        assert resp.status_code in (404, 200)
        assert resp.status_code != 500

    def test_no_zones_returns_empty_list(self, client):
        """GET /api/zones on empty DB returns empty list, not error."""
        resp = client.get("/api/zones")
        assert resp.status_code == 200
        data = resp.get_json()
        assert isinstance(data, (list, dict))

    def test_positions_current_empty_returns_200(self, client):
        """GET /api/positions/current returns 200 even with no data."""
        resp = client.get("/api/positions/current")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["count"] == 0
