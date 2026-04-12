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
