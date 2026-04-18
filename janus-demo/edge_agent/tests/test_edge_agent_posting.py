"""
Gate 8.3 — edge_agent.py post_count() tests.

post_count() is the function that POSTs occupancy counts to the backend.
It is the only network boundary in edge_agent.py and was previously
untested. Tests cover: success path, timeout, connection failure, URL
construction, and payload shape.
"""

import sys
from unittest.mock import MagicMock, patch

import pytest

# edge_agent imports are safe here — conftest.py mocks the heavy ML deps
# (rfdetr, trackers, supervision) before any edge_agent import.
from edge_agent import post_count


class TestPostCountSuccess:
    def test_returns_true_on_200(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None

        with patch("edge_agent.requests.post", return_value=mock_response) as mock_post:
            result = post_count("http://localhost:8000", 42)

        assert result is True

    def test_posts_to_count_endpoint(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None

        with patch("edge_agent.requests.post", return_value=mock_response) as mock_post:
            post_count("http://localhost:8000", 7)

        args, kwargs = mock_post.call_args
        assert args[0] == "http://localhost:8000/count"

    def test_payload_wraps_value_as_count_value(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None

        with patch("edge_agent.requests.post", return_value=mock_response) as mock_post:
            post_count("http://localhost:8000", 13)

        _, kwargs = mock_post.call_args
        assert kwargs["json"] == {"count_value": 13}

    def test_strips_trailing_slash_from_backend_url(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None

        with patch("edge_agent.requests.post", return_value=mock_response) as mock_post:
            post_count("http://localhost:8000/", 1)

        args, _ = mock_post.call_args
        assert args[0] == "http://localhost:8000/count"


class TestPostCountFailure:
    def test_returns_false_on_timeout(self):
        import requests as req

        with patch("edge_agent.requests.post", side_effect=req.exceptions.Timeout):
            result = post_count("http://localhost:8000", 5)

        assert result is False

    def test_returns_false_on_connection_error(self):
        import requests as req

        with patch("edge_agent.requests.post", side_effect=req.exceptions.ConnectionError):
            result = post_count("http://localhost:8000", 5)

        assert result is False
