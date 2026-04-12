# backend/db.py — Database connection and schema management
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager

from migrations import run_migrations

DB = "janus.db"


@contextmanager
def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA busy_timeout = 5000")
    con.execute("PRAGMA foreign_keys = ON")
    try:
        yield con
    except Exception:
        con.rollback()
        raise
    else:
        con.commit()
    finally:
        con.close()


def ensure_schema():
    with db() as con:
        # Enable WAL mode for concurrent read (Flask) + write (batch processor)
        con.execute("PRAGMA journal_mode=WAL")

        # Legacy counts table (preserved for compatibility)
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS counts (
              id           INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp    TEXT NOT NULL,
              count_value  INTEGER NOT NULL
            )
            """
        )

        # New zones table for area tracking
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS zones (
              id           INTEGER PRIMARY KEY AUTOINCREMENT,
              zone_name    TEXT NOT NULL UNIQUE,
              capacity     INTEGER DEFAULT 0,
              zone_type    TEXT DEFAULT 'general'  -- entrance, checkout, dining, product_area
            )
            """
        )

        # New events table for detailed tracking
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
              id            INTEGER PRIMARY KEY AUTOINCREMENT,
              timestamp     TEXT NOT NULL,
              person_id     TEXT,                  -- Anonymous tracking ID
              event_type    TEXT NOT NULL,         -- entry, exit, zone_change
              zone_id       INTEGER,
              direction     TEXT,                  -- in, out, lateral
              confidence    REAL DEFAULT 1.0,      -- Detection accuracy 0-1
              FOREIGN KEY (zone_id) REFERENCES zones(id)
            )
            """
        )

        # New sessions table for visit tracking
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
              id             INTEGER PRIMARY KEY AUTOINCREMENT,
              person_id      TEXT NOT NULL,
              entry_time     TEXT NOT NULL,
              exit_time      TEXT,
              dwell_seconds  INTEGER,              -- Calculated on exit
              zone_path      TEXT,                 -- JSON array of zones visited
              converted      INTEGER DEFAULT 0     -- 1 if made purchase
            )
            """
        )

        # Batch processing jobs table
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS batch_jobs (
              id               INTEGER PRIMARY KEY AUTOINCREMENT,
              video_id         TEXT NOT NULL,
              video_name       TEXT,
              video_path       TEXT,
              model            TEXT DEFAULT 'yolo11l.pt',
              tracker          TEXT DEFAULT 'botsort_tuned.yaml',
              status           TEXT DEFAULT 'pending',
              total_frames     INTEGER DEFAULT 0,
              processed_frames INTEGER DEFAULT 0,
              total_events     INTEGER DEFAULT 0,
              total_sessions   INTEGER DEFAULT 0,
              fps              REAL DEFAULT 0,
              started_at       TEXT,
              completed_at     TEXT,
              error_message    TEXT
            )
            """
        )

        # Add source and video_id columns to events/sessions (idempotent)
        for alter in [
            "ALTER TABLE events ADD COLUMN source TEXT DEFAULT 'live'",
            "ALTER TABLE events ADD COLUMN video_id TEXT",
            "ALTER TABLE sessions ADD COLUMN source TEXT DEFAULT 'live'",
            "ALTER TABLE sessions ADD COLUMN video_id TEXT",
            "ALTER TABLE profile ADD COLUMN avg_transaction_value REAL DEFAULT 25.0",
        ]:
            try:
                con.execute(alter)
            except sqlite3.OperationalError:
                pass  # Column already exists

        # Create indexes for source filtering
        for idx in [
            "CREATE INDEX IF NOT EXISTS idx_events_source ON events(source)",
            "CREATE INDEX IF NOT EXISTS idx_events_video_id ON events(video_id)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_source ON sessions(source)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_video_id ON sessions(video_id)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_entry_time ON sessions(entry_time)",
            "CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_events_zone_id ON events(zone_id)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_converted ON sessions(converted)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_dwell ON sessions(dwell_seconds)",
        ]:
            con.execute(idx)

        # Profile table (singleton row, id=1)
        con.execute(
            """
            CREATE TABLE IF NOT EXISTS profile (
              id                   INTEGER PRIMARY KEY CHECK (id = 1),
              store_name           TEXT DEFAULT 'My Store',
              total_capacity       INTEGER DEFAULT 100,
              camera_name          TEXT DEFAULT 'Camera 1',
              timezone             TEXT DEFAULT 'America/New_York',
              business_hours_start INTEGER DEFAULT 9,
              business_hours_end   INTEGER DEFAULT 21,
              updated_at           TEXT
            )
            """
        )
        # Ensure default profile row exists
        con.execute(
            "INSERT OR IGNORE INTO profile (id) VALUES (1)"
        )

        # Insert default zones if empty
        con.execute("INSERT OR IGNORE INTO zones (zone_name, capacity, zone_type) VALUES ('entrance', 50, 'entrance')")
        con.execute("INSERT OR IGNORE INTO zones (zone_name, capacity, zone_type) VALUES ('checkout', 20, 'checkout')")
        con.execute("INSERT OR IGNORE INTO zones (zone_name, capacity, zone_type) VALUES ('main_floor', 100, 'general')")
        con.execute("INSERT OR IGNORE INTO zones (zone_name, capacity, zone_type) VALUES ('queue', 30, 'queue')")

        con.commit()

    run_migrations(DB)
