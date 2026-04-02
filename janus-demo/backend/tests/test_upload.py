"""
Gate 1.1 — File upload size limit tests.
"""

import io
import pytest


class TestUploadSizeLimit:
    """Verify 50MB upload limit is enforced."""

    def test_upload_size_limit(self, client):
        """POST a payload larger than 50MB to /video/upload, expect 413."""
        # Create a fake file just over 50MB
        large_data = b"x" * (50 * 1024 * 1024 + 1)
        data = {
            'video': (io.BytesIO(large_data), 'huge_video.mp4')
        }
        resp = client.post(
            '/video/upload',
            data=data,
            content_type='multipart/form-data'
        )
        assert resp.status_code == 413
