"""
Gate 4.3 — WebSocket tests.

Tests:
  test_connection              — WS endpoint can be reached via HTTP upgrade check
  test_receives_frame_update   — format_position_frame() produces valid JSON with person data

Note: flask-sock WebSocket endpoints can't easily be exercised via the standard
Flask test client (it needs an actual HTTP upgrade). We therefore test:
  (a) that the WebSocket route is registered on the app
  (b) that the helper function that formats outgoing frames is correct
  (c) that the position cache mechanism stores and retrieves data

This is consistent with the project's pattern of testing logic in isolation
(see test_detection.py, test_tracking.py).
"""

import json
import threading
import time
from unittest.mock import MagicMock, patch

import pytest

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main  # noqa: E402


class TestWebSocketConnection:

    def test_connection(self, client):
        """
        The WS endpoint registers an HTTP route that returns 400 (Bad Request /
        Upgrade Required) when called without a proper WS handshake.
        A 400 response (not 404) proves the route *exists* and flask-sock is
        intercepting the request.
        """
        resp = client.get("/ws/positions")
        # flask-sock returns 400 when no WS upgrade header is present
        assert resp.status_code == 400, (
            f"Expected 400 (WS upgrade required), got {resp.status_code}. "
            "The /ws/positions route may not be registered."
        )

    def test_ws_route_registered(self):
        """The /ws/positions URL is present in the app's URL map."""
        from app import app
        rules = [str(rule) for rule in app.url_map.iter_rules()]
        assert any("ws/positions" in r for r in rules), (
            f"Could not find /ws/positions in URL map. Registered rules: {rules}"
        )


class TestWebSocketFrameFormat:

    def test_receives_frame_update(self):
        """
        format_position_frame() produces valid JSON containing:
          - 'persons' list with world_x / world_y per entry
          - 'timestamp' field
          - 'count' matching len(persons)
        """
        from routes.websocket import format_position_frame

        persons = [
            {"id": 1, "world_x": 1.5, "world_y": 2.3, "zone": "Entrance"},
            {"id": 2, "world_x": 5.0, "world_y": 3.1, "zone": "Main Floor"},
        ]

        payload = format_position_frame(persons)
        data = json.loads(payload)

        assert "persons" in data
        assert len(data["persons"]) == 2
        assert "timestamp" in data
        assert data["count"] == 2

        first = data["persons"][0]
        assert "world_x" in first
        assert "world_y" in first
        assert "id" in first

    def test_empty_persons_frame(self):
        """Empty person list still produces a valid frame."""
        from routes.websocket import format_position_frame

        payload = format_position_frame([])
        data = json.loads(payload)

        assert data["persons"] == []
        assert data["count"] == 0
        assert "timestamp" in data


class TestPositionCache:

    def test_update_and_read_cache(self):
        """
        update_position_cache() stores persons; get_position_cache() returns them.
        """
        from routes.websocket import update_position_cache, get_position_cache

        persons = [{"id": 99, "world_x": 3.0, "world_y": 4.0}]
        update_position_cache(persons)

        result = get_position_cache()
        assert len(result) == 1
        assert result[0]["id"] == 99

    def test_cache_is_replaced_not_appended(self):
        """Each update_position_cache() call replaces the previous state."""
        from routes.websocket import update_position_cache, get_position_cache

        update_position_cache([{"id": 1, "world_x": 1.0, "world_y": 1.0}])
        update_position_cache([{"id": 2, "world_x": 2.0, "world_y": 2.0},
                                {"id": 3, "world_x": 3.0, "world_y": 3.0}])

        result = get_position_cache()
        assert len(result) == 2
        assert result[0]["id"] == 2
