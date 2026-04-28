"""
Smoke tests for the v2 (world-space 3D) zone migration in edge_agent_enhanced.py.

These tests do NOT require RF-DETR / supervision / trackers to be importable —
they exercise the pure-Python helpers `is_foot_in_zone` and the import path
to backend/zone_geometry.py.

Run:
    cd edge_agent && python -m pytest tests/test_zone_v2_migration.py -v
"""

import os
import sys

import pytest

# Make edge_agent + backend importable without running main()
EDGE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(EDGE_DIR, "..", "backend")
for p in (EDGE_DIR, BACKEND_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)


def _import_edge_module():
    """Try to import edge_agent_enhanced; skip if heavy CV deps missing."""
    try:
        import edge_agent_enhanced  # noqa: F401
    except Exception as e:
        pytest.skip(f"edge_agent_enhanced import failed (likely missing rfdetr/supervision): {e}")
    return sys.modules["edge_agent_enhanced"]


def test_zone_geometry_importable_via_edge_path():
    """Edge agent's sys.path bootstrap makes zone_geometry importable."""
    mod = _import_edge_module()
    assert mod._ZONE_GEOMETRY_AVAILABLE, "zone_geometry should be importable from edge_agent"


def test_floor_zone_v2_hit():
    """Foot inside a floor zone footprint → hit."""
    mod = _import_edge_module()
    zone = {
        "schema_version": 2,
        "surface_type": "floor",
        "polygon_world_3d": [[0, 0, 0], [4, 0, 0], [4, 3, 0], [0, 3, 0]],
        "rotation_matrix": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    }
    assert mod.is_foot_in_zone(2.0, 1.5, zone) is True
    assert mod.is_foot_in_zone(10.0, 10.0, zone) is False


def test_counter_top_zone_elevated():
    """A person at z=0 standing inside the bar's xy footprint counts as 'at the bar'."""
    mod = _import_edge_module()
    # Bar top: 4m wide x 0.6m deep, elevated at z=1.05m
    zone = {
        "schema_version": 2,
        "surface_type": "counter_top",
        "polygon_world_3d": [
            [0, 0, 1.05], [4, 0, 1.05], [4, 0.6, 1.05], [0, 0.6, 1.05],
        ],
        "rotation_matrix": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    }
    # Inside footprint (xy)
    assert mod.is_foot_in_zone(2.0, 0.3, zone) is True
    # Outside footprint
    assert mod.is_foot_in_zone(5.0, 0.3, zone) is False


def test_v1_zone_returns_false_for_caller_fallback():
    """v1 zones must return False so the caller falls back to pixel-space test."""
    mod = _import_edge_module()
    zone = {
        "schema_version": 1,
        "surface_type": "floor",
        "polygon_world_3d": None,
        "rotation_matrix": None,
    }
    assert mod.is_foot_in_zone(2.0, 1.5, zone) is False


def test_uncalibrated_world_coords_returns_false():
    """If world coords are None (camera uncalibrated), v2 hit-test returns False."""
    mod = _import_edge_module()
    zone = {
        "schema_version": 2,
        "surface_type": "floor",
        "polygon_world_3d": [[0, 0, 0], [4, 0, 0], [4, 3, 0], [0, 3, 0]],
        "rotation_matrix": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    }
    assert mod.is_foot_in_zone(None, None, zone) is False


def test_load_zones_from_api_classifies_v1_and_v2(monkeypatch, capsys):
    """load_zones_from_api correctly classifies a mixed v1/v2 response and logs the split."""
    mod = _import_edge_module()

    fake_payload = {
        "zones": [
            {
                "id": 1, "zone_name": "dining_area", "schema_version": 2,
                "surface_type": "floor",
                "polygon_world_3d": [[0, 0, 0], [6, 0, 0], [6, 4, 0], [0, 4, 0]],
                "rotation_matrix": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                "polygon_world": [[0, 0], [6, 0], [6, 4], [0, 4]],
                "polygon_image": [[100, 100], [540, 100], [540, 380], [100, 380]],
            },
            {
                "id": 2, "zone_name": "bar_top", "schema_version": 2,
                "surface_type": "counter_top",
                "polygon_world_3d": [[7, 0, 1.05], [11, 0, 1.05], [11, 0.6, 1.05], [7, 0.6, 1.05]],
                "rotation_matrix": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                "polygon_world": [[7, 0], [11, 0], [11, 0.6], [7, 0.6]],
                "polygon_image": None,  # v2-only, no cached pixel polygon
            },
            {
                "id": 3, "zone_name": "queue", "schema_version": 1,
                "surface_type": None,
                "polygon_world_3d": None,
                "rotation_matrix": None,
                "polygon_world": None,
                "polygon_image": [[440, 240], [540, 240], [540, 480], [440, 480]],
            },
        ]
    }

    class FakeResp:
        status_code = 200
        def raise_for_status(self): return None
        def json(self): return fake_payload

    def fake_get(url, timeout=None):
        return FakeResp()

    monkeypatch.setattr(mod.requests, "get", fake_get)

    zones, lines = mod.load_zones_from_api("http://fake", frame_w=640, frame_h=480)
    assert zones is not None
    assert len(zones) == 3
    assert lines == []

    # v2 zones
    assert zones["dining_area"]["schema_version"] == 2
    assert zones["dining_area"]["surface_type"] == "floor"
    assert zones["dining_area"]["polygon_world_3d"] is not None

    assert zones["bar_top"]["schema_version"] == 2
    assert zones["bar_top"]["surface_type"] == "counter_top"
    assert zones["bar_top"]["zone"] is None  # no polygon_image -> no sv.PolygonZone

    # v1 zone
    assert zones["queue"]["schema_version"] == 1
    assert zones["queue"]["zone"] is not None  # built from polygon_image

    # Log line
    out = capsys.readouterr().out
    assert "2 v2 (world-space 3D)" in out
    assert "1 v1 (legacy pixel-space)" in out


def test_v2_hit_test_chosen_over_v1_when_calibrated():
    """End-to-end: a v2 floor zone returns True for an inside foot, v1 zone returns False."""
    mod = _import_edge_module()
    v2_zone = {
        "schema_version": 2, "surface_type": "floor",
        "polygon_world_3d": [[0, 0, 0], [4, 0, 0], [4, 3, 0], [0, 3, 0]],
        "rotation_matrix": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    }
    v1_zone = {
        "schema_version": 1, "surface_type": "floor",
        "polygon_world_3d": None, "rotation_matrix": None,
    }
    assert mod.is_foot_in_zone(2.0, 1.5, v2_zone) is True
    assert mod.is_foot_in_zone(2.0, 1.5, v1_zone) is False  # caller must fall back
