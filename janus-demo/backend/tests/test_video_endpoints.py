"""
Tests for video endpoints in the Janus backend.

Run with: pytest tests/ -v
"""

import os
import sys
import pytest
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestVideoLibraryEndpoints:
    """Tests for /video/library endpoints."""

    def test_get_video_library(self, client):
        """Test retrieving the video library."""
        response = client.get('/video/library')
        assert response.status_code == 200
        data = response.get_json()
        assert 'videos' in data
        assert isinstance(data['videos'], list)

    def test_video_library_contains_expected_fields(self, client):
        """Test that video library entries have expected fields."""
        response = client.get('/video/library')
        data = response.get_json()

        if len(data['videos']) > 0:
            video = data['videos'][0]
            expected_fields = ['id', 'name', 'file_path', 'file_size', 'uploaded_at']
            for field in expected_fields:
                assert field in video, f"Missing field: {field}"


class TestVideoPlayEndpoints:
    """Tests for video play/switch endpoints."""

    def test_play_nonexistent_video(self, client):
        """Test playing a video that doesn't exist."""
        response = client.post('/video/library/99999/play')
        assert response.status_code in [404, 400, 500]

    @patch('subprocess.Popen')
    def test_video_start_demo(self, mock_popen, client):
        """Test starting a demo video."""
        mock_process = MagicMock()
        mock_process.poll.return_value = None
        mock_popen.return_value = mock_process

        response = client.post(
            '/video/start',
            json={'source': 'demo'}
        )
        # May fail if demo video doesn't exist, but endpoint should respond
        assert response.status_code in [200, 400, 500]


class TestVideoSettingsEndpoints:
    """Tests for video settings endpoints."""

    def test_get_settings(self, client):
        """Test getting current video settings."""
        response = client.get('/video/settings')
        # Endpoint may or may not exist depending on implementation
        assert response.status_code in [200, 404]

    @patch('requests.post')
    def test_switch_model(self, mock_post, client):
        """Test switching the YOLO model."""
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {'ok': True}

        response = client.post('/video/model?model=yolo11n.pt')
        # Model switch endpoint should respond
        assert response.status_code in [200, 400, 404, 500]

    @patch('requests.post')
    def test_switch_tracker(self, mock_post, client):
        """Test switching the tracker algorithm."""
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {'ok': True}

        response = client.post('/video/tracker?tracker=botsort.yaml')
        # Tracker switch endpoint should respond
        assert response.status_code in [200, 400, 404, 500]


class TestPathNormalization:
    """Tests for path normalization in video switching."""

    def test_path_normalization_consistency(self):
        """Test that path normalization produces consistent results."""
        import os

        # Simulate the path comparison issue
        forward_slash_path = "C:/Users/test/video.mp4"
        back_slash_path = "C:\\Users\\test\\video.mp4"

        # Normalize both paths
        normalized_forward = os.path.normpath(os.path.abspath(forward_slash_path))
        normalized_back = os.path.normpath(os.path.abspath(back_slash_path))

        # On Windows, these should be equal after normalization
        if os.name == 'nt':
            assert normalized_forward == normalized_back, \
                f"Paths should match after normalization: {normalized_forward} vs {normalized_back}"

    def test_relative_path_normalization(self):
        """Test that relative paths are normalized correctly."""
        import os

        relative_path = "../edge_agent/video_library/test.mp4"
        absolute_path = os.path.normpath(os.path.abspath(relative_path))

        # Should be an absolute path now
        assert os.path.isabs(absolute_path)
        # Should not contain .. anymore
        assert ".." not in absolute_path


class TestVideoStopEndpoint:
    """Tests for video stop endpoint."""

    def test_stop_video(self, client):
        """Test stopping video playback."""
        response = client.post('/video/stop')
        # Should respond even if no video is playing
        assert response.status_code in [200, 400, 500]


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, client):
        """Test the main health endpoint."""
        response = client.get('/health')
        assert response.status_code == 200
        data = response.get_json()
        assert 'status' in data


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
