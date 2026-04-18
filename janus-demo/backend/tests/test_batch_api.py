"""
Gate 7.1 tests — Batch API file-serving endpoints.

Covers:
  /api/tracking-data/<video_id>    — serves {video_id}_tracking.json
  /api/process-status/<video_id>   — reports progress/completion status

These endpoints bridge edge-agent output (batch_processor.py JSON writes)
and the frontend player (PreProcessedPlayer.jsx fetch). They had zero test
coverage before this gate.
"""

import json
import os

import pytest


def _valid_tracking_payload(video_id: str):
    """Minimal schema matching edge_agent/batch_processor.JSONOutputWriter."""
    return {
        "video_id": video_id,
        "status": "completed",
        "total_frames": 3,
        "fps": 30.0,
        "frame_count": 3,
        "processed_at": "2026-04-18T00:00:00Z",
        "frames": [
            {"frame": 0, "timestamp_ms": 0, "detections": []},
            {
                "frame": 1,
                "timestamp_ms": 33,
                "detections": [
                    {"id": 1, "bbox": [10, 20, 50, 80], "confidence": 0.9}
                ],
            },
            {"frame": 2, "timestamp_ms": 66, "detections": []},
        ],
        "metrics": {},
        "sessions": [],
    }


class TestTrackingData:
    def test_tracking_data_serves_json(self, client, video_library_dir):
        """GET /api/tracking-data/<id> returns the JSON file when present."""
        video_id = "test-vid-123"
        payload = _valid_tracking_payload(video_id)
        with open(os.path.join(video_library_dir, f"{video_id}_tracking.json"), "w") as f:
            json.dump(payload, f)

        resp = client.get(f"/api/tracking-data/{video_id}")
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["video_id"] == video_id
        assert body["total_frames"] == 3
        assert len(body["frames"]) == 3
        assert body["frames"][1]["detections"][0]["bbox"] == [10, 20, 50, 80]

    def test_tracking_data_404_when_missing(self, client, video_library_dir):
        """GET /api/tracking-data/<id> returns 404 when file not present."""
        resp = client.get("/api/tracking-data/nonexistent-id")
        assert resp.status_code == 404
        assert "error" in resp.get_json()


class TestBatchPlaybackContract:
    """Gate 8.2 — E2E data contract: batch_processor output → backend API →
    PreProcessedPlayer schema.

    These tests pin the exact JSON shape that PreProcessedPlayer.jsx
    consumes. If JSONOutputWriter changes its key names or if the backend
    route transforms the payload, these tests will catch it before the
    frontend breaks silently.
    """

    def test_served_json_has_required_top_level_keys(self, client, video_library_dir):
        """Response must include all keys PreProcessedPlayer accesses at top level."""
        video_id = "contract-vid-1"
        payload = _valid_tracking_payload(video_id)
        with open(os.path.join(video_library_dir, f"{video_id}_tracking.json"), "w") as f:
            json.dump(payload, f)

        resp = client.get(f"/api/tracking-data/{video_id}")
        body = resp.get_json()

        for key in ("video_id", "status", "total_frames", "fps", "frame_count", "frames"):
            assert key in body, f"Missing required key: {key}"

    def test_frame_objects_use_correct_keys_for_preprocessed_player(
        self, client, video_library_dir
    ):
        """Frames must use 'frame' and 'detections' keys.

        PreProcessedPlayer's findFrameByIndex binary searches on frames[i].frame
        and iterates frames[i].detections. Using 'frame_idx' or 'tracks' breaks it.
        """
        video_id = "contract-vid-2"
        payload = _valid_tracking_payload(video_id)
        with open(os.path.join(video_library_dir, f"{video_id}_tracking.json"), "w") as f:
            json.dump(payload, f)

        resp = client.get(f"/api/tracking-data/{video_id}")
        frames = resp.get_json()["frames"]

        for frame in frames:
            assert "frame" in frame, "Frame must have 'frame' key for binary search"
            assert "frame_idx" not in frame, "Legacy 'frame_idx' key must not be present"
            assert "detections" in frame, "Frame must have 'detections' key"
            assert "tracks" not in frame, "Legacy 'tracks' key must not be present"

    def test_detection_objects_use_confidence_key_not_conf(self, client, video_library_dir):
        """Detections must use 'confidence' key (not 'conf').

        PreProcessedPlayer reads det.confidence for display; 'conf' is the
        internal batch_processor accumulation key before write_tracking()
        normalizes it.
        """
        video_id = "contract-vid-3"
        payload = _valid_tracking_payload(video_id)
        with open(os.path.join(video_library_dir, f"{video_id}_tracking.json"), "w") as f:
            json.dump(payload, f)

        resp = client.get(f"/api/tracking-data/{video_id}")
        frames = resp.get_json()["frames"]
        detections = [d for f in frames for d in f["detections"]]

        assert len(detections) >= 1, "Need at least one detection to validate keys"
        for det in detections:
            assert "confidence" in det, "Detection must have 'confidence' key"
            assert "conf" not in det, "Legacy 'conf' key must not be present"
            assert "id" in det
            assert "bbox" in det


class TestProcessStatus:
    def test_process_status_completed_when_tracking_exists(self, client, video_library_dir):
        """Presence of {id}_tracking.json implies status=completed, percent=100."""
        video_id = "done-vid"
        with open(os.path.join(video_library_dir, f"{video_id}_tracking.json"), "w") as f:
            json.dump(_valid_tracking_payload(video_id), f)

        resp = client.get(f"/api/process-status/{video_id}")
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["status"] == "completed"
        assert body["percent"] == 100

    def test_process_status_processing_when_only_progress_exists(self, client, video_library_dir):
        """Progress file only → returns the in-progress payload verbatim."""
        video_id = "in-progress-vid"
        progress = {
            "video_id": video_id,
            "status": "processing",
            "percent": 45,
            "frame": 450,
            "total": 1000,
        }
        with open(os.path.join(video_library_dir, f"{video_id}_progress.json"), "w") as f:
            json.dump(progress, f)

        resp = client.get(f"/api/process-status/{video_id}")
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["status"] == "processing"
        assert body["percent"] == 45

    def test_process_status_not_started_when_neither_exists(self, client, video_library_dir):
        """Neither file → status=not_started, percent=0."""
        resp = client.get("/api/process-status/never-touched-vid")
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["status"] == "not_started"
        assert body["percent"] == 0
