"""
Gate 6.2 — batch_processor JSON output tests.

Tests that JSONOutputWriter:
  1. Accumulates per-frame tracking data via add_frame()
  2. Writes {video_id}_progress.json via write_progress()
  3. Writes {video_id}_tracking.json via write_tracking()

conftest.py installs sv / rfdetr / trackers mocks before any import,
so batch_processor can be imported without PyTorch.
"""

import json
import sys
from pathlib import Path

import numpy as np
import pytest

import batch_processor as bp

VIDEO_ID = "aaaabbbb-1234-5678-abcd-000000000001"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def lib_dir(tmp_path):
    d = tmp_path / "video_library"
    d.mkdir()
    return d


@pytest.fixture
def writer(lib_dir):
    return bp.JSONOutputWriter(VIDEO_ID, str(lib_dir))


def _progress_path(lib_dir, video_id=VIDEO_ID):
    return lib_dir / f"{video_id}_progress.json"


def _tracking_path(lib_dir, video_id=VIDEO_ID):
    return lib_dir / f"{video_id}_tracking.json"


# ---------------------------------------------------------------------------
# Frame accumulation
# ---------------------------------------------------------------------------

class TestAddFrame:
    def test_stores_frame_idx(self, writer):
        writer.add_frame(0, 0.0, [])
        assert writer._frames[0]["frame_idx"] == 0

    def test_stores_timestamp_ms(self, writer):
        writer.add_frame(5, 166.7, [])
        assert writer._frames[0]["timestamp_ms"] == 166.7

    def test_stores_tracks(self, writer):
        track = {"id": 1, "bbox": [10, 20, 60, 120], "conf": 0.9}
        writer.add_frame(0, 0.0, [track])
        assert writer._frames[0]["tracks"][0] == track

    def test_accumulates_multiple_frames_in_order(self, writer):
        for i in range(5):
            writer.add_frame(i, i * 33.3, [{"id": i + 1, "bbox": [0, 0, 10, 10], "conf": 0.8}])
        assert len(writer._frames) == 5
        assert writer._frames[4]["frame_idx"] == 4

    def test_empty_tracks_list_is_valid(self, writer):
        writer.add_frame(0, 0.0, [])
        assert writer._frames[0]["tracks"] == []


# ---------------------------------------------------------------------------
# write_progress()
# ---------------------------------------------------------------------------

class TestWriteProgress:
    def test_creates_progress_file(self, writer, lib_dir):
        writer.write_progress(10, 100, 30.0)
        assert _progress_path(lib_dir).exists()

    def test_video_id_in_output(self, writer, lib_dir):
        writer.write_progress(10, 100, 30.0)
        data = json.loads(_progress_path(lib_dir).read_text())
        assert data["video_id"] == VIDEO_ID

    def test_frame_counts_in_output(self, writer, lib_dir):
        writer.write_progress(50, 200, 29.97)
        data = json.loads(_progress_path(lib_dir).read_text())
        assert data["total_frames"] == 200
        assert data["processed_frames"] == 50
        assert data["fps"] == 29.97

    def test_percent_calculated(self, writer, lib_dir):
        writer.write_progress(25, 100, 30.0)
        data = json.loads(_progress_path(lib_dir).read_text())
        assert data["percent"] == 25.0

    def test_default_status_is_processing(self, writer, lib_dir):
        writer.write_progress(10, 100, 30.0)
        data = json.loads(_progress_path(lib_dir).read_text())
        assert data["status"] == "processing"

    def test_status_can_be_set_to_completed(self, writer, lib_dir):
        writer.write_progress(100, 100, 30.0, status="completed")
        data = json.loads(_progress_path(lib_dir).read_text())
        assert data["status"] == "completed"

    def test_second_write_overwrites_first(self, writer, lib_dir):
        writer.write_progress(10, 100, 30.0)
        writer.write_progress(50, 100, 30.0)
        data = json.loads(_progress_path(lib_dir).read_text())
        assert data["processed_frames"] == 50

    def test_zero_total_frames_gives_zero_percent(self, writer, lib_dir):
        writer.write_progress(0, 0, 30.0)
        data = json.loads(_progress_path(lib_dir).read_text())
        assert data["percent"] == 0.0


# ---------------------------------------------------------------------------
# write_tracking()
# ---------------------------------------------------------------------------

class TestWriteTracking:
    def test_creates_tracking_file(self, writer, lib_dir):
        writer.write_tracking(100, 30.0)
        assert _tracking_path(lib_dir).exists()

    def test_video_id_in_output(self, writer, lib_dir):
        writer.write_tracking(100, 30.0)
        data = json.loads(_tracking_path(lib_dir).read_text())
        assert data["video_id"] == VIDEO_ID

    def test_status_is_completed(self, writer, lib_dir):
        writer.write_tracking(100, 30.0)
        data = json.loads(_tracking_path(lib_dir).read_text())
        assert data["status"] == "completed"

    def test_total_frames_in_output(self, writer, lib_dir):
        writer.write_tracking(324, 29.97)
        data = json.loads(_tracking_path(lib_dir).read_text())
        assert data["total_frames"] == 324

    def test_fps_in_output(self, writer, lib_dir):
        writer.write_tracking(100, 29.97)
        data = json.loads(_tracking_path(lib_dir).read_text())
        assert data["fps"] == 29.97

    def test_includes_accumulated_frames(self, writer, lib_dir):
        for i in range(3):
            writer.add_frame(i, i * 33.3, [{"id": 1, "bbox": [0, 0, 10, 10], "conf": 0.9}])
        writer.write_tracking(3, 30.0)
        data = json.loads(_tracking_path(lib_dir).read_text())
        assert data["frame_count"] == 3
        assert len(data["frames"]) == 3

    def test_frame_has_required_keys(self, writer, lib_dir):
        writer.add_frame(0, 0.0, [{"id": 1, "bbox": [10, 20, 60, 120], "conf": 0.85}])
        writer.write_tracking(1, 30.0)
        data = json.loads(_tracking_path(lib_dir).read_text())
        frame = data["frames"][0]
        assert "frame_idx" in frame
        assert "timestamp_ms" in frame
        assert "tracks" in frame

    def test_track_has_required_keys(self, writer, lib_dir):
        writer.add_frame(0, 0.0, [{"id": 1, "bbox": [10, 20, 60, 120], "conf": 0.85}])
        writer.write_tracking(1, 30.0)
        data = json.loads(_tracking_path(lib_dir).read_text())
        track = data["frames"][0]["tracks"][0]
        assert "id" in track
        assert "bbox" in track
        assert "conf" in track

    def test_empty_frames_produces_valid_json(self, writer, lib_dir):
        writer.write_tracking(0, 30.0)
        data = json.loads(_tracking_path(lib_dir).read_text())
        assert data["frames"] == []
        assert data["frame_count"] == 0
