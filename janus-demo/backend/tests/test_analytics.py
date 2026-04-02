"""
Gate 1.3 — Analytics endpoint tests (14 endpoints).

All tests use the seeded_client fixture with 7 days of demo data.
"""

import pytest


class TestDwellTime:
    def test_dwell_time(self, seeded_client):
        resp = seeded_client.get('/api/dwell-time')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "avg_dwell_seconds" in data
        assert "distribution" in data
        assert data["total_sessions"] > 0


class TestOccupancy:
    def test_occupancy(self, seeded_client):
        resp = seeded_client.get('/api/occupancy')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "current_occupancy" in data
        assert "total_capacity" in data
        assert "zones" in data


class TestEntriesExits:
    def test_entries_exits(self, seeded_client):
        resp = seeded_client.get('/api/entries-exits')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "entries" in data
        assert "exits" in data
        assert "net_traffic" in data


class TestConversion:
    def test_conversion(self, seeded_client):
        resp = seeded_client.get('/api/conversion')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "total_sessions" in data
        assert "conversion_rate" in data
        assert data["total_sessions"] > 0


class TestZones:
    def test_zones(self, seeded_client):
        resp = seeded_client.get('/api/zones')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "zones" in data
        assert isinstance(data["zones"], list)
        assert len(data["zones"]) >= 4  # 4 default zones


class TestQueue:
    def test_queue(self, seeded_client):
        resp = seeded_client.get('/api/queue')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "current_queue_length" in data
        assert "avg_wait_seconds" in data


class TestHourlyPatterns:
    def test_hourly_patterns(self, seeded_client):
        resp = seeded_client.get('/api/hourly-patterns')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "hours" in data
        assert "peak_hour" in data
        assert "total_sessions" in data


class TestDwellDistribution:
    def test_dwell_distribution(self, seeded_client):
        resp = seeded_client.get('/api/dwell-distribution')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "bins" in data
        assert isinstance(data["bins"], list)
        assert "total_sessions" in data


class TestFlowBetweenZones:
    def test_flow_between_zones(self, seeded_client):
        resp = seeded_client.get('/api/flow-between-zones')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "transitions" in data
        assert "total_paths" in data


class TestPeriodComparison:
    def test_period_comparison(self, seeded_client):
        resp = seeded_client.get('/api/period-comparison')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "current" in data
        assert "previous" in data
        assert "changes" in data


class TestTrends:
    def test_trends(self, seeded_client):
        resp = seeded_client.get('/api/trends')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "trends" in data
        assert "days" in data


class TestSessionsRecent:
    def test_sessions_recent(self, seeded_client):
        resp = seeded_client.get('/api/sessions/recent')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "sessions" in data
        assert "total" in data
        assert len(data["sessions"]) > 0


class TestZoneDetail:
    def test_zone_detail(self, seeded_client):
        resp = seeded_client.get('/api/zones/1/detail')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "zone_name" in data
        assert "hourly_pattern" in data
        assert "daily_trend" in data


class TestAnomalies:
    def test_anomalies(self, seeded_client):
        resp = seeded_client.get('/api/anomalies')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "anomalies" in data
        assert "total_hours_analyzed" in data
