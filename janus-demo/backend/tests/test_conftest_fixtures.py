"""
Gate 1.2 — Fixture validation tests.

Verify that conftest fixtures work correctly before writing real tests.
"""


class TestFixtures:

    def test_client_works(self, client):
        """Flask test client returns 200 on /health."""
        resp = client.get('/health')
        assert resp.status_code == 200
        assert resp.get_json() == {"ok": True}

    def test_seeded_db_has_data(self, seeded_client):
        """Seeded client has demo data — /api/conversion returns sessions > 0."""
        resp = seeded_client.get('/api/conversion')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["total_sessions"] > 0

    def test_fresh_db_has_schema(self, fresh_db):
        """Fresh DB has all 6 expected tables."""
        rows = fresh_db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).fetchall()
        table_names = sorted([r["name"] for r in rows])
        for expected in ["batch_jobs", "counts", "events", "profile", "sessions", "zones"]:
            assert expected in table_names, f"Missing table: {expected}"
