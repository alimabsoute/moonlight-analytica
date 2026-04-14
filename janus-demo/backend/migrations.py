# backend/migrations.py — Versioned SQLite migration system
from __future__ import annotations

import sqlite3

# Each migration: (version_id, description, sql_statements)
MIGRATIONS = [
    (
        1,
        "Gate 2.2: add geometry columns to zones, events, sessions",
        [
            "ALTER TABLE zones ADD COLUMN polygon_world TEXT",
            "ALTER TABLE zones ADD COLUMN polygon_image TEXT",
            "ALTER TABLE zones ADD COLUMN color TEXT DEFAULT '#4dd8e6'",
            "ALTER TABLE events ADD COLUMN world_x REAL",
            "ALTER TABLE events ADD COLUMN world_y REAL",
            "ALTER TABLE sessions ADD COLUMN trajectory TEXT",
        ],
    ),
    (
        2,
        "Gate 3.1: add camera_calibration table",
        [
            """
            CREATE TABLE IF NOT EXISTS camera_calibration (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                camera_id           TEXT NOT NULL UNIQUE,
                pixel_points        TEXT NOT NULL,
                world_points        TEXT NOT NULL,
                h_matrix            TEXT NOT NULL,
                reprojection_error  REAL,
                created_at          TEXT DEFAULT (datetime('now')),
                updated_at          TEXT DEFAULT (datetime('now'))
            )
            """
        ],
    ),
]


def run_migrations(db_path: str) -> None:
    """Apply all pending migrations to db_path. Safe to call multiple times."""
    con = sqlite3.connect(db_path)
    try:
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version     INTEGER PRIMARY KEY,
                description TEXT,
                applied_at  TEXT DEFAULT (datetime('now'))
            )
            """
        )
        con.commit()

        applied = {r[0] for r in con.execute("SELECT version FROM schema_migrations")}

        for version, description, statements in MIGRATIONS:
            if version in applied:
                continue
            for sql in statements:
                try:
                    con.execute(sql)
                except sqlite3.OperationalError as e:
                    if "duplicate column name" in str(e).lower():
                        pass  # Already exists — idempotent
                    else:
                        raise
            con.execute(
                "INSERT INTO schema_migrations (version, description) VALUES (?, ?)",
                (version, description),
            )
            con.commit()
    finally:
        con.close()
