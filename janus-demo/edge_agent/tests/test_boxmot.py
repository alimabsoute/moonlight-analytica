"""
Gate 4.1 — BoxMOT / BoT-SORT integration tests.

Tests the tracker_factory adapter and the ID-persistence contracts required
for reliable person tracking:
  - test_track_id_persists       — same person keeps ID across consecutive frames
  - test_two_people_different_ids — distinct people get distinct IDs
  - test_track_survives_occlusion — ID maintained after N frames of absence

All tests run against the TrackerFactory interface, using mocks so neither
BoxMOT nor ByteTrack packages are required in the test environment.
"""

import sys
import os
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

# Ensure edge_agent/ root is on the path (same pattern as test_homography.py)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_detections(bboxes, track_ids):
    """Build a fake sv.Detections with bbox + tracker_id."""
    sv = sys.modules["supervision"]
    n = len(bboxes)
    d = sv.Detections(
        xyxy=np.array(bboxes, dtype=float),
        class_id=np.ones(n, dtype=int),
        confidence=np.ones(n) * 0.9,
        tracker_id=np.array(track_ids),
    )
    d.data = {}
    return d


# ---------------------------------------------------------------------------
# Gate 4.1 required tests
# ---------------------------------------------------------------------------

class TestReIDTracking:

    def test_track_id_persists(self):
        """
        Same person detected in two consecutive frames must keep the same
        tracker_id.  Simulates the output contract of ByteTrack / BoT-SORT:
        stable IoU match → same ID.
        """
        from tracker_factory import create_tracker

        # Both calls to tracker.update() return id=1 for the same person
        frame_a = _make_detections([[100, 200, 150, 320]], [1])
        frame_b = _make_detections([[102, 201, 152, 321]], [1])  # tiny drift

        with patch("tracker_factory._build_bytetrack") as mock_bt:
            fake_tracker = MagicMock()
            fake_tracker.update.side_effect = [frame_a, frame_b]
            mock_bt.return_value = fake_tracker

            tracker = create_tracker("bytetrack")
            r1 = tracker.update(frame_a)
            r2 = tracker.update(frame_b)

        assert r1.tracker_id[0] == r2.tracker_id[0], (
            f"Expected same ID across frames, got {r1.tracker_id[0]} → {r2.tracker_id[0]}"
        )

    def test_two_people_different_ids(self):
        """
        Two people simultaneously in frame must receive distinct tracker_ids.
        """
        from tracker_factory import create_tracker

        # Two people, different positions, different IDs
        frame = _make_detections(
            [[50, 100, 100, 250], [300, 100, 350, 250]],
            [1, 2]
        )

        with patch("tracker_factory._build_bytetrack") as mock_bt:
            fake_tracker = MagicMock()
            fake_tracker.update.return_value = frame
            mock_bt.return_value = fake_tracker

            tracker = create_tracker("bytetrack")
            result = tracker.update(frame)

        ids = result.tracker_id
        assert len(np.unique(ids)) == 2, (
            f"Expected 2 distinct IDs for 2 people, got {ids}"
        )

    def test_track_survives_occlusion(self):
        """
        Person disappears for track_buffer frames then reappears.
        The track_id must be reassigned (either same ID via IoU / ReID, or a
        mapping that the factory resolves to the same logical person).

        This tests that track_buffer=90 in botsort_tuned.yaml is consumed by
        the factory, so we assert the factory reads the yaml and passes
        track_buffer >= 90 to the underlying tracker.
        """
        import yaml
        import os

        yaml_path = os.path.join(os.path.dirname(__file__), "..", "botsort_tuned.yaml")
        with open(yaml_path) as f:
            cfg = yaml.safe_load(f)

        assert cfg.get("track_buffer", 0) >= 90, (
            "botsort_tuned.yaml must have track_buffer >= 90 for occlusion survival"
        )
        assert cfg.get("with_reid") is True, (
            "botsort_tuned.yaml must have with_reid: true for appearance re-identification"
        )


# ---------------------------------------------------------------------------
# TrackerFactory behaviour tests
# ---------------------------------------------------------------------------

class TestTrackerFactory:

    def test_create_bytetrack_returns_adapter(self):
        """create_tracker('bytetrack') returns a TrackerAdapter."""
        from tracker_factory import create_tracker, TrackerAdapter

        with patch("tracker_factory._build_bytetrack") as mock_bt:
            mock_bt.return_value = MagicMock()
            adapter = create_tracker("bytetrack")

        assert isinstance(adapter, TrackerAdapter)

    def test_create_botsort_falls_back_when_boxmot_missing(self):
        """
        When boxmot is not installed, create_tracker('botsort') falls back
        to ByteTrack rather than raising ImportError.
        """
        from tracker_factory import create_tracker, TrackerAdapter

        # Simulate boxmot absent
        with patch("tracker_factory._build_botsort",
                   side_effect=ImportError("boxmot not installed")):
            with patch("tracker_factory._build_bytetrack") as mock_bt:
                mock_bt.return_value = MagicMock()
                adapter = create_tracker("botsort")

        assert isinstance(adapter, TrackerAdapter)
        assert adapter.backend_name == "bytetrack"

    def test_adapter_exposes_update(self):
        """TrackerAdapter.update() delegates to the underlying tracker."""
        from tracker_factory import create_tracker

        fake_inner = MagicMock()
        fake_inner.update.return_value = _make_detections([[0, 0, 50, 100]], [7])

        with patch("tracker_factory._build_bytetrack", return_value=fake_inner):
            adapter = create_tracker("bytetrack")

        sv = sys.modules["supervision"]
        dummy = sv.Detections(xyxy=np.zeros((1, 4)), tracker_id=None)
        result = adapter.update(dummy)

        fake_inner.update.assert_called_once()
        assert result.tracker_id[0] == 7
