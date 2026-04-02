"""
Gate 1.3 — Profile endpoint tests.
"""

import pytest


class TestProfile:

    def test_get_profile(self, client):
        """GET /api/profile returns default profile."""
        resp = client.get('/api/profile')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["store_name"] == "My Store"
        assert data["total_capacity"] == 100

    def test_update_profile(self, client):
        """PUT /api/profile updates store name."""
        resp = client.put('/api/profile', json={
            "store_name": "Test Store",
            "total_capacity": 200
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["store_name"] == "Test Store"
        assert data["total_capacity"] == 200

    def test_profile_roundtrip(self, client):
        """PUT then GET returns updated values."""
        client.put('/api/profile', json={"store_name": "Roundtrip Store"})
        resp = client.get('/api/profile')
        data = resp.get_json()
        assert data["store_name"] == "Roundtrip Store"
