"""
Gate 1.1 — Database security tests.

Tests: rollback on error, WAL mode, foreign keys.
"""

import sqlite3
import pytest


class TestDBContextManager:
    """Tests for the db() context manager fix."""

    def test_rollback_on_error(self, client, fresh_db):
        """Verify that a failed transaction does not leave partial data."""
        # Insert a valid zone
        client.post('/count', json={"count_value": 99})

        # Verify the count was stored
        row = fresh_db.execute("SELECT count_value FROM counts ORDER BY id DESC LIMIT 1").fetchone()
        assert row is not None
        assert row["count_value"] == 99

        # Now try to insert a duplicate unique zone_name via direct SQL
        # This should fail and rollback
        import main
        try:
            with main.db() as con:
                con.execute("INSERT INTO zones (zone_name, capacity) VALUES ('entrance', 50)")
                # This should raise due to UNIQUE constraint on zone_name
        except sqlite3.IntegrityError:
            pass  # Expected

        # Verify no partial data leaked
        zones = fresh_db.execute("SELECT COUNT(*) as cnt FROM zones WHERE zone_name = 'entrance'").fetchone()
        assert zones["cnt"] == 1  # Only the original default zone

    def test_wal_mode_enabled(self, fresh_db):
        """Verify WAL journal mode is active."""
        mode = fresh_db.execute("PRAGMA journal_mode").fetchone()[0]
        assert mode == "wal"

    def test_foreign_keys_enabled(self, client, fresh_db):
        """Verify PRAGMA foreign_keys is ON in the app's db() context."""
        import main
        with main.db() as con:
            fk = con.execute("PRAGMA foreign_keys").fetchone()[0]
            assert fk == 1


class TestHealthEndpoint:
    """Gate 1.1 — Health check returns correct response."""

    def test_health_returns_ok(self, client):
        """GET /health returns 200 with {ok: true}."""
        resp = client.get('/health')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data == {"ok": True}
