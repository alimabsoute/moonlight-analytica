"""
Gate 1.3 — Deep analytics endpoint tests (8 endpoints).

All tests use the seeded_client fixture with 7 days of demo data.
"""

import pytest


class TestForecast:
    def test_forecast(self, seeded_client):
        resp = seeded_client.get('/api/forecast')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "daily_forecast" in data
        assert "hourly_forecast" in data


class TestPeakAnalysis:
    def test_peak_analysis(self, seeded_client):
        resp = seeded_client.get('/api/peak-analysis')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "busiest_day" in data
        assert "quietest_day" in data
        assert "weekday_avg" in data
        assert "weekend_avg" in data


class TestCustomerJourney:
    def test_customer_journey(self, seeded_client):
        resp = seeded_client.get('/api/customer-journey')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "journeys" in data
        assert "total_sessions" in data


class TestCohortAnalysis:
    def test_cohort_analysis(self, seeded_client):
        resp = seeded_client.get('/api/cohort-analysis')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "cohorts" in data
        assert "total_sessions" in data
        # Should have quick/casual/engaged/power cohorts
        labels = [c["label"] for c in data["cohorts"]]
        assert len(labels) > 0


class TestRealtimeSnapshot:
    def test_realtime_snapshot(self, seeded_client):
        resp = seeded_client.get('/api/realtime-snapshot')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "active_sessions" in data
        assert "entries_last_hour" in data
        assert "total_today" in data


class TestZoneRankings:
    def test_zone_rankings(self, seeded_client):
        resp = seeded_client.get('/api/zone-rankings')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "zones" in data
        assert isinstance(data["zones"], list)


class TestRevenueEstimates:
    def test_revenue_estimates(self, seeded_client):
        resp = seeded_client.get('/api/revenue-estimates')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "total_conversions" in data
        assert "estimated_revenue" in data
        assert "avg_transaction_value" in data


class TestHourlyComparison:
    def test_hourly_comparison(self, seeded_client):
        resp = seeded_client.get('/api/hourly-comparison')
        assert resp.status_code == 200
        data = resp.get_json()
        assert "comparison" in data
        assert isinstance(data["comparison"], list)
