"""
Gate 1.3 — Seed demo endpoint tests.
"""

import pytest


class TestSeedDemo:

    def test_seed_demo_populates_data(self, client):
        """POST /seed_demo creates sessions and events."""
        resp = client.post('/seed_demo')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["ok"] is True
        assert data["total_sessions"] > 100
        assert data["total_events"] > 100
        assert data["seeded_days"] == 7

    def test_seed_demo_creates_events(self, client, fresh_db):
        """After seeding, events table has data."""
        client.post('/seed_demo')
        count = fresh_db.execute("SELECT COUNT(*) as cnt FROM events").fetchone()["cnt"]
        assert count > 100

    def test_seed_demo_idempotent(self, client):
        """Seeding twice doesn't crash."""
        resp1 = client.post('/seed_demo')
        assert resp1.status_code == 200
        resp2 = client.post('/seed_demo')
        assert resp2.status_code == 200
