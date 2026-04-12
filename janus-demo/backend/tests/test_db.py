"""
Gates 1.1 + 2.2 — Database security and migration tests.

Tests: rollback on error, WAL mode, foreign keys, versioned migrations,
new zone/event/session columns added in Gate 2.2.
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


class TestMigrations:
    """Gate 2.2 — Versioned migration system."""

    def test_migrations_apply(self, tmp_db):
        """All migrations run without error on a fresh DB."""
        import main
        from migrations import run_migrations
        run_migrations(main.DB)  # Should not raise

    def test_new_columns_exist(self, fresh_db):
        """Gate 2.2 columns exist after migrations."""
        zones_cols = {r[1] for r in fresh_db.execute("PRAGMA table_info(zones)")}
        events_cols = {r[1] for r in fresh_db.execute("PRAGMA table_info(events)")}
        sessions_cols = {r[1] for r in fresh_db.execute("PRAGMA table_info(sessions)")}

        assert "polygon_world" in zones_cols
        assert "polygon_image" in zones_cols
        assert "color" in zones_cols
        assert "world_x" in events_cols
        assert "world_y" in events_cols
        assert "trajectory" in sessions_cols

    def test_migrations_idempotent(self, tmp_db):
        """Running migrations twice does not raise."""
        import main
        from migrations import run_migrations
        run_migrations(main.DB)
        run_migrations(main.DB)  # second run should be a no-op

    def test_schema_migrations_table_exists(self, fresh_db):
        """schema_migrations tracking table is created."""
        tables = {r[0] for r in fresh_db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert "schema_migrations" in tables


class TestHealthEndpoint:
    """Gate 1.1 — Health check returns correct response."""

    def test_health_returns_ok(self, client):
        """GET /health returns 200 with {ok: true}."""
        resp = client.get('/health')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data == {"ok": True}
