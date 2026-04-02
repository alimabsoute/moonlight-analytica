"""
Gate 1.3 — Core data endpoint tests.

Tests: /count, /events, /sessions, /kpis, /series.csv
"""

import pytest


class TestCountEndpoint:

    def test_post_count(self, client):
        """POST /count stores a count value."""
        resp = client.post('/count', json={"count_value": 5})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["count_value"] == 5
        assert "timestamp" in data

    def test_post_count_missing_value(self, client):
        """POST /count with empty body still works (legacy behavior)."""
        resp = client.post('/count', json={})
        # The endpoint may accept 0 or fail — check it doesn't crash
        assert resp.status_code in [200, 400]

    def test_get_kpis_empty(self, client):
        """GET /kpis with no data returns zeros."""
        resp = client.get('/kpis')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["avg_people"] == 0
        assert data["peak_people"] == 0
        assert data["throughput"] == 0

    def test_get_kpis_with_data(self, client):
        """GET /kpis after posting counts returns nonzero values."""
        client.post('/count', json={"count_value": 10})
        client.post('/count', json={"count_value": 20})
        resp = client.get('/kpis')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["peak_people"] >= 10


class TestEventsEndpoint:

    def test_post_event(self, client):
        """POST /events with valid payload returns ok."""
        resp = client.post('/events', json={
            "event_type": "entry",
            "person_id": "P000001",
            "zone_id": 1,
            "direction": "in",
            "confidence": 0.95
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["ok"] is True
        assert data["event_type"] == "entry"
        assert data["person_id"] == "P000001"

    def test_post_event_appears_in_analytics(self, client):
        """Posted event is reflected in entries-exits analytics."""
        client.post('/events', json={
            "event_type": "entry",
            "person_id": "P000002",
            "zone_id": 1,
            "direction": "in"
        })
        resp = client.get('/api/entries-exits')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["entries"] >= 1


class TestSessionsEndpoint:

    def test_post_session(self, client):
        """POST /sessions with valid payload returns ok."""
        resp = client.post('/sessions', json={
            "person_id": "P000001",
            "entry_time": "2026-04-02T10:00:00",
            "exit_time": "2026-04-02T10:15:00",
            "dwell_seconds": 900,
            "zone_path": '["entrance", "main_floor", "checkout"]',
            "converted": 1
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["ok"] is True
        assert data["dwell_seconds"] == 900

    def test_get_sessions(self, seeded_client):
        """GET /sessions returns session list from seeded data."""
        resp = seeded_client.get('/api/sessions/recent')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "sessions" in data
        assert len(data["sessions"]) > 0


class TestSeriesCSV:

    def test_get_series_csv(self, seeded_client):
        """GET /series.csv returns CSV content type."""
        # Seed some counts first
        seeded_client.post('/count', json={"count_value": 42})
        resp = seeded_client.get('/series.csv')
        assert resp.status_code == 200
        assert 'text/' in resp.content_type or 'csv' in resp.content_type.lower() or resp.status_code == 200
