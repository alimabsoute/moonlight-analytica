"""
Gate 2.4 tests — Zone geometry CRUD: single source of truth.

Tests:
  test_create_zone_with_polygon  — POST /api/zones/config with polygon_image
  test_get_zone_returns_polygon  — GET  /api/zones/config includes geometry
"""

import json
import pytest


ENTRANCE_POLYGON = [[10, 10], [200, 10], [200, 480], [10, 480]]
MAIN_POLYGON = [[200, 10], [440, 10], [440, 480], [200, 480]]


class TestCreateZoneWithPolygon:
    def test_create_zone_with_polygon(self, client):
        """POST /api/zones/config creates a zone and returns polygon_image."""
        resp = client.post(
            "/api/zones/config",
            json={
                "zone_name": "test_entrance",
                "capacity": 50,
                "polygon_image": ENTRANCE_POLYGON,
                "color": "#00bfff"
            }
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["zone_name"] == "test_entrance"
        assert data["polygon_image"] == ENTRANCE_POLYGON
        assert data["color"] == "#00bfff"
        assert data["action"] == "created"

    def test_create_zone_requires_name(self, client):
        """POST without zone_name returns 400."""
        resp = client.post("/api/zones/config", json={"capacity": 30})
        assert resp.status_code == 400

    def test_create_zone_upsert(self, client):
        """Second POST with same zone_name updates rather than duplicates."""
        client.post(
            "/api/zones/config",
            json={"zone_name": "lobby", "polygon_image": ENTRANCE_POLYGON}
        )
        resp = client.post(
            "/api/zones/config",
            json={"zone_name": "lobby", "polygon_image": MAIN_POLYGON, "capacity": 75}
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["action"] == "updated"
        assert data["polygon_image"] == MAIN_POLYGON
        assert data["capacity"] == 75

    def test_create_zone_with_world_polygon(self, client):
        """POST can include polygon_world (meter coordinates) alongside polygon_image."""
        resp = client.post(
            "/api/zones/config",
            json={
                "zone_name": "vip_area",
                "polygon_image": ENTRANCE_POLYGON,
                "polygon_world": [[0.0, 0.0], [5.0, 0.0], [5.0, 8.0], [0.0, 8.0]],
                "color": "#8b5cf6"
            }
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["polygon_world"] is not None
        assert len(data["polygon_world"]) == 4


class TestGetZoneReturnsPolygon:
    def test_get_zone_returns_polygon(self, client):
        """GET /api/zones/config returns zones with polygon_image geometry."""
        # Seed two zones with geometry
        client.post(
            "/api/zones/config",
            json={"zone_name": "entrance", "polygon_image": ENTRANCE_POLYGON, "color": "#00bfff"}
        )
        client.post(
            "/api/zones/config",
            json={"zone_name": "main_floor", "polygon_image": MAIN_POLYGON, "color": "#10b981"}
        )

        resp = client.get("/api/zones/config")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "zones" in data

        # Find the zones we created
        zone_map = {z["zone_name"]: z for z in data["zones"]}
        assert "entrance" in zone_map
        assert "main_floor" in zone_map

        entrance = zone_map["entrance"]
        assert entrance["polygon_image"] == ENTRANCE_POLYGON
        assert entrance["color"] == "#00bfff"
        assert "id" in entrance
        assert "capacity" in entrance

    def test_get_zones_empty_polygon_when_not_set(self, client):
        """Zones without geometry have polygon_image as None."""
        resp = client.get("/api/zones/config")
        assert resp.status_code == 200
        data = resp.get_json()
        # Default zones from seed have no polygon_image set initially
        for zone in data["zones"]:
            if zone["polygon_image"] is None:
                assert zone["polygon_world"] is None or zone["polygon_world"] is None
                break  # found at least one zone without geometry — pass

    def test_get_zones_name_alias(self, client):
        """Response includes both zone_name and name alias for frontend compatibility."""
        client.post(
            "/api/zones/config",
            json={"zone_name": "checkout", "polygon_image": MAIN_POLYGON}
        )
        resp = client.get("/api/zones/config")
        zone_map = {z["zone_name"]: z for z in resp.get_json()["zones"]}
        checkout = zone_map["checkout"]
        assert checkout["name"] == checkout["zone_name"]


class TestZonePersistenceRoundTrip:
    """Gate 7.2 — verify polygons and capacity survive JSON serialization,
    SQLite round-trip, and new DB connections (simulated restart)."""

    def test_polygon_image_json_roundtrip(self, client):
        """POST polygon_image → GET returns the exact same nested array."""
        original = [[10, 20], [300, 20], [300, 480], [10, 480]]
        client.post(
            "/api/zones/config",
            json={"zone_name": "roundtrip_img", "polygon_image": original},
        )
        resp = client.get("/api/zones/config")
        zone = next(z for z in resp.get_json()["zones"] if z["zone_name"] == "roundtrip_img")
        # Exact structural equality — not a string, coordinate order preserved
        assert zone["polygon_image"] == original
        assert isinstance(zone["polygon_image"], list)
        assert isinstance(zone["polygon_image"][0], list)

    def test_polygon_world_json_roundtrip(self, client):
        """POST polygon_world with floats → GET returns the same float array."""
        original = [[0.0, 0.0], [5.0, 0.0], [5.0, 8.0], [0.0, 8.0]]
        client.post(
            "/api/zones/config",
            json={
                "zone_name": "roundtrip_world",
                "polygon_image": ENTRANCE_POLYGON,
                "polygon_world": original,
            },
        )
        resp = client.get("/api/zones/config")
        zone = next(z for z in resp.get_json()["zones"] if z["zone_name"] == "roundtrip_world")
        assert zone["polygon_world"] == original

    def test_zone_persists_across_new_db_connection(self, client, tmp_db):
        """Zone written by POST must be visible when a fresh sqlite connection is opened.

        Simulates a backend restart: the process dies after commit, a new
        connection opens the same DB file and must still find the row.
        """
        import sqlite3

        client.post(
            "/api/zones/config",
            json={
                "zone_name": "durable_zone",
                "capacity": 77,
                "polygon_image": MAIN_POLYGON,
            },
        )

        # Open an entirely new sqlite3 connection to the same file
        con = sqlite3.connect(tmp_db)
        con.row_factory = sqlite3.Row
        try:
            row = con.execute(
                "SELECT zone_name, capacity, polygon_image FROM zones WHERE zone_name = ?",
                ("durable_zone",),
            ).fetchone()
        finally:
            con.close()

        assert row is not None, "Zone did not survive new DB connection"
        assert row["zone_name"] == "durable_zone"
        assert row["capacity"] == 77
        assert json.loads(row["polygon_image"]) == MAIN_POLYGON

    def test_capacity_persists(self, client):
        """POST capacity → GET returns the same integer capacity."""
        client.post(
            "/api/zones/config",
            json={
                "zone_name": "capacity_zone",
                "capacity": 42,
                "polygon_image": ENTRANCE_POLYGON,
            },
        )
        resp = client.get("/api/zones/config")
        zone = next(z for z in resp.get_json()["zones"] if z["zone_name"] == "capacity_zone")
        assert zone["capacity"] == 42


# ── v2 (3D world-space) HTTP round-trip ────────────────────────────────
#
# The lower-level zone_geometry helpers are unit-tested in
# test_zone_geometry.py and the edge-side hit test is covered by
# edge_agent/tests/test_zone_v2_migration.py. These tests exercise the
# full Flask request/response layer for the v2 zone schema:
# polygon_world_3d + rotation_matrix + surface_type + camera_id +
# schema_version, including auto-derivation of polygon_image via the
# camera homography.

# 1m × 0.5m bar-top zone elevated to 1.05m, parallel to the floor.
BAR_TOP_3D = [
    [0.0, 0.0, 1.05],
    [1.0, 0.0, 1.05],
    [1.0, 0.5, 1.05],
    [0.0, 0.5, 1.05],
]
IDENTITY_R = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]

# 4m × 3m floor zone.
FLOOR_3D = [
    [0.0, 0.0, 0.0],
    [4.0, 0.0, 0.0],
    [4.0, 3.0, 0.0],
    [0.0, 3.0, 0.0],
]


class TestZoneV2HttpRoundTrip:
    """The full POST → DB → GET path with the schema_version 2 fields."""

    def test_v2_post_returns_schema_version_2(self, client):
        resp = client.post(
            "/api/zones/config",
            json={
                "zone_name": "bar_top",
                "polygon_world_3d": BAR_TOP_3D,
                "rotation_matrix": IDENTITY_R,
                "surface_type": "counter_top",
                "color": "#b56cff",
            },
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["schema_version"] == 2
        assert data["surface_type"] == "counter_top"
        assert data["polygon_world_3d"] == BAR_TOP_3D
        assert data["rotation_matrix"] == IDENTITY_R

    def test_v2_get_round_trips_3d_fields(self, client):
        client.post(
            "/api/zones/config",
            json={
                "zone_name": "bar_top",
                "polygon_world_3d": BAR_TOP_3D,
                "rotation_matrix": IDENTITY_R,
                "surface_type": "counter_top",
            },
        )
        resp = client.get("/api/zones/config")
        zone = next(z for z in resp.get_json()["zones"] if z["zone_name"] == "bar_top")
        assert zone["schema_version"] == 2
        assert zone["polygon_world_3d"] == BAR_TOP_3D
        assert zone["rotation_matrix"] == IDENTITY_R
        assert zone["surface_type"] == "counter_top"

    def test_v2_default_rotation_is_identity_when_omitted(self, client):
        """POST polygon_world_3d without rotation_matrix → identity is filled in."""
        resp = client.post(
            "/api/zones/config",
            json={"zone_name": "floor_zone", "polygon_world_3d": FLOOR_3D},
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["rotation_matrix"] == IDENTITY_R

    def test_v2_default_surface_type_is_floor(self, client):
        resp = client.post(
            "/api/zones/config",
            json={"zone_name": "auto_floor", "polygon_world_3d": FLOOR_3D},
        )
        assert resp.json["surface_type"] == "floor"

    def test_v2_legacy_polygon_world_2d_backfilled_from_3d(self, client):
        """polygon_world (2D) is populated as the (x,y) drop of polygon_world_3d
        so legacy v1 consumers see something sensible."""
        client.post(
            "/api/zones/config",
            json={"zone_name": "fb_zone", "polygon_world_3d": BAR_TOP_3D},
        )
        resp = client.get("/api/zones/config")
        zone = next(z for z in resp.get_json()["zones"] if z["zone_name"] == "fb_zone")
        assert zone["polygon_world"] == [[p[0], p[1]] for p in BAR_TOP_3D]

    def test_v1_legacy_post_returns_schema_version_1(self, client):
        """POSTs that only carry polygon_image keep schema_version 1."""
        resp = client.post(
            "/api/zones/config",
            json={"zone_name": "legacy_2d", "polygon_image": ENTRANCE_POLYGON},
        )
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["schema_version"] == 1
        assert data["polygon_world_3d"] is None

    def test_v2_camera_id_round_trips(self, client):
        client.post(
            "/api/zones/config",
            json={
                "zone_name": "cam_zone",
                "polygon_world_3d": FLOOR_3D,
                "camera_id": "cam_a",
            },
        )
        resp = client.get("/api/zones/config")
        zone = next(z for z in resp.get_json()["zones"] if z["zone_name"] == "cam_zone")
        assert zone["camera_id"] == "cam_a"

    def test_v2_polygon_image_auto_derived_when_calibration_exists(self, client):
        """When a v2 zone is POSTed with camera_id but no polygon_image, AND a
        calibration exists for that camera, the backend auto-derives the pixel
        polygon from the homography and persists it."""
        # Seed a calibration: 100 px = 1 metre, floor rectangle 0..400 × 0..300.
        cal_resp = client.post(
            "/api/calibration/cam_a",
            json={
                "pixel_points": [[0, 0], [400, 0], [400, 300], [0, 300]],
                "world_points": [[0.0, 0.0], [4.0, 0.0], [4.0, 3.0], [0.0, 3.0]],
            },
        )
        assert cal_resp.status_code == 201

        # Floor zone exactly matching the calibrated rectangle.
        client.post(
            "/api/zones/config",
            json={
                "zone_name": "calibrated_floor",
                "polygon_world_3d": FLOOR_3D,
                "camera_id": "cam_a",
            },
        )

        resp = client.get("/api/zones/config")
        zone = next(z for z in resp.get_json()["zones"] if z["zone_name"] == "calibrated_floor")
        assert zone["polygon_image"] is not None, "polygon_image should be auto-derived"
        # Each corner should be within ~5 px of the calibration rectangle.
        expected = [[0, 0], [400, 0], [400, 300], [0, 300]]
        for got, want in zip(zone["polygon_image"], expected):
            assert abs(got[0] - want[0]) <= 5, f"x off: {got} vs {want}"
            assert abs(got[1] - want[1]) <= 5, f"y off: {got} vs {want}"

    def test_v2_polygon_image_left_null_when_no_calibration(self, client):
        """If camera_id is given but no calibration row exists, the route should
        not crash — it just leaves polygon_image NULL."""
        client.post(
            "/api/zones/config",
            json={
                "zone_name": "uncalibrated",
                "polygon_world_3d": FLOOR_3D,
                "camera_id": "ghost_cam",
            },
        )
        resp = client.get("/api/zones/config")
        zone = next(z for z in resp.get_json()["zones"] if z["zone_name"] == "uncalibrated")
        assert zone["schema_version"] == 2
        assert zone["polygon_image"] is None

    def test_v2_upsert_preserves_v2_fields(self, client):
        """Re-POST same zone_name with updated v2 fields → values overwrite cleanly."""
        client.post(
            "/api/zones/config",
            json={"zone_name": "upsert_zone", "polygon_world_3d": FLOOR_3D, "surface_type": "floor"},
        )
        resp = client.post(
            "/api/zones/config",
            json={
                "zone_name": "upsert_zone",
                "polygon_world_3d": BAR_TOP_3D,
                "surface_type": "counter_top",
                "capacity": 7,
            },
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["action"] == "updated"
        assert data["polygon_world_3d"] == BAR_TOP_3D
        assert data["surface_type"] == "counter_top"
        assert data["capacity"] == 7

    def test_v2_surface_types_round_trip(self, client):
        """All valid surface types make the round trip without coercion."""
        for surf in ("floor", "counter_top", "table", "wall", "ramp", "other"):
            client.post(
                "/api/zones/config",
                json={
                    "zone_name": f"surf_{surf}",
                    "polygon_world_3d": FLOOR_3D,
                    "surface_type": surf,
                },
            )
        resp = client.get("/api/zones/config")
        zones = {z["zone_name"]: z for z in resp.get_json()["zones"]}
        for surf in ("floor", "counter_top", "table", "wall", "ramp", "other"):
            assert zones[f"surf_{surf}"]["surface_type"] == surf
