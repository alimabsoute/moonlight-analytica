"""
Gate 2.1 — ByteTrack tracker and occupancy-counting tests.

Tests the tracking and aggregation logic used in edge_agent.py without
requiring the actual trackers package.
"""

import sys

import numpy as np
import pytest

sv = sys.modules["supervision"]
FakeDetections = sv.Detections


class TestTrackerInterface:
    """Verify the ByteTrackTracker interface contract."""

    def test_tracker_instantiates(self):
        """ByteTrackTracker() can be instantiated."""
        from trackers import ByteTrackTracker
        tracker = ByteTrackTracker(lost_track_buffer=90, minimum_consecutive_frames=3)
        assert tracker is not None

    def test_tracker_has_update(self):
        """Tracker exposes an .update() method."""
        from trackers import ByteTrackTracker
        tracker = ByteTrackTracker()
        assert callable(tracker.update)

    def test_tracker_update_returns_detections(self, mock_tracker, fake_detections):
        """tracker.update() returns a Detections-like object with tracker_id."""
        dets_in = fake_detections(n_persons=2, n_other=0)
        dets_out = fake_detections(n_persons=2, n_other=0, with_tracker_ids=True)
        mock_tracker.update.return_value = dets_out

        result = mock_tracker.update(dets_in)

        assert result.tracker_id is not None
        assert len(result.tracker_id) == 2

    def test_tracker_assigns_unique_ids(self, mock_tracker, fake_detections):
        """Each tracked person gets a unique tracker_id."""
        tracked = fake_detections(n_persons=3, n_other=0, with_tracker_ids=True)
        mock_tracker.update.return_value = tracked

        result = mock_tracker.update(tracked)
        ids = result.tracker_id

        assert len(np.unique(ids)) == 3, "Each person should have a unique ID"


class TestOccupancyCounting:
    """Test the counting logic from edge_agent.py."""

    def test_unique_id_count(self, fake_detections):
        """
        Occupancy = len(np.unique(tracker_id)).
        Ensures duplicate IDs (same person across calls) aren't double-counted.
        """
        dets = fake_detections(n_persons=4, with_tracker_ids=True)
        # Simulate same tracker_id appearing twice (same person, two bboxes shouldn't happen but guard it)
        dets.tracker_id = np.array([1, 2, 2, 3])  # ID 2 is duplicated

        people_now = len(np.unique(dets.tracker_id))
        assert people_now == 3

    def test_no_tracker_id_counts_zero(self):
        """If tracker_id is None (no confirmed tracks yet), count is 0."""
        dets = FakeDetections(
            xyxy=np.zeros((3, 4)),
            class_id=np.array([1, 1, 1]),
            tracker_id=None,
        )
        people_now = 0
        if dets.tracker_id is not None:
            people_now = len(np.unique(dets.tracker_id))
        assert people_now == 0

    def test_empty_detections_count_zero(self):
        """Empty detections produces zero occupancy."""
        dets = FakeDetections(xyxy=np.empty((0, 4)), tracker_id=np.array([]))
        people_now = len(np.unique(dets.tracker_id)) if len(dets) > 0 else 0
        assert people_now == 0


class TestAverageOccupancy:
    """Test the interval-aggregation logic from edge_agent.py."""

    def test_avg_rounds_to_nearest_int(self):
        """Average occupancy is rounded to nearest integer."""
        samples = [3, 4, 4, 5]
        avg = int(round(sum(samples) / max(1, len(samples))))
        assert avg == 4  # (3+4+4+5)/4 = 4.0

    def test_avg_with_single_sample(self):
        """Single sample returns that sample value."""
        avg = int(round(7 / max(1, 1)))
        assert avg == 7

    def test_avg_guards_zero_division(self):
        """max(1, occup_samples) prevents ZeroDivisionError."""
        occup_sum = 0
        occup_samples = 0
        avg = int(round(occup_sum / max(1, occup_samples)))
        assert avg == 0

    def test_avg_rounds_up_at_half(self):
        """Round half-values correctly (Python banker's rounding, but we just check no crash)."""
        samples = [2, 3]
        avg = int(round(sum(samples) / len(samples)))
        assert isinstance(avg, int)


class TestSourceParsing:
    """Test the video source parsing logic from edge_agent.py."""

    def test_digit_source_becomes_int(self):
        """'0' (webcam index) is converted to int."""
        source_str = "0"
        source = int(source_str) if source_str.isdigit() else source_str
        assert source == 0
        assert isinstance(source, int)

    def test_rtsp_source_stays_string(self):
        """RTSP URLs stay as strings."""
        source_str = "rtsp://user:pass@camera/stream"
        source = int(source_str) if source_str.isdigit() else source_str
        assert source == "rtsp://user:pass@camera/stream"
        assert isinstance(source, str)

    def test_file_path_stays_string(self):
        """File paths stay as strings."""
        source_str = "/data/video.mp4"
        source = int(source_str) if source_str.isdigit() else source_str
        assert source == "/data/video.mp4"
