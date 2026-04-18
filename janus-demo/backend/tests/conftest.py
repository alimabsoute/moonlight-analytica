"""
Shared test fixtures for Janus backend tests.

All tests use a temporary SQLite database (not janus.db) to avoid polluting
real data. The DB is created fresh for each test function.
"""

import os
import sys
import tempfile
import sqlite3
import pytest

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main


@pytest.fixture
def tmp_db(tmp_path):
    """Create a temporary SQLite DB with full schema, override main.DB."""
    db_path = str(tmp_path / "test_janus.db")
    original_db = main.DB
    main.DB = db_path
    main.ensure_schema()
    yield db_path
    main.DB = original_db


@pytest.fixture
def client(tmp_db):
    """Flask test client with fresh empty DB (schema + default zones only)."""
    main.app.config['TESTING'] = True
    with main.app.test_client() as c:
        yield c


@pytest.fixture
def seeded_client(client):
    """Flask test client with 7 days of demo data seeded."""
    resp = client.post('/seed_demo')
    assert resp.status_code == 200
    yield client


@pytest.fixture
def fresh_db(tmp_db):
    """Raw sqlite3 Connection to the test DB for direct SQL assertions."""
    con = sqlite3.connect(tmp_db)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    yield con
    con.close()


@pytest.fixture
def video_library_dir(tmp_path, monkeypatch):
    """Isolated video_library directory for batch API tests.

    Overrides routes.batch.VIDEO_LIBRARY_DIR so endpoints reading tracking
    and progress JSON point at an empty tmp dir instead of the real edge_agent/.
    """
    from routes import batch as batch_module
    lib_dir = tmp_path / "video_library"
    lib_dir.mkdir()
    monkeypatch.setattr(batch_module, "VIDEO_LIBRARY_DIR", str(lib_dir))
    return str(lib_dir)
