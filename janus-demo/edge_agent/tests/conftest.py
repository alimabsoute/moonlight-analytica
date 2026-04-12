"""
Edge agent test fixtures and module mocking.

rfdetr, trackers, and supervision are not installed in the test environment
(they require PyTorch + heavy deps). We mock those modules at the sys.modules
level so edge_agent code can be imported and its logic tested in isolation.
"""

import sys
import types
from unittest.mock import MagicMock

import numpy as np
import pytest


# ---------------------------------------------------------------------------
# Mock the heavy ML dependencies before any edge_agent import
# ---------------------------------------------------------------------------

def _make_mock_modules():
    """Create lightweight stub modules for rfdetr, trackers, and supervision."""

    # -- supervision stubs --
    sv_mod = types.ModuleType("supervision")

    class FakeDetections:
        """Minimal sv.Detections-like object for testing."""
        def __init__(self, xyxy=None, class_id=None, confidence=None, tracker_id=None):
            self.xyxy = xyxy if xyxy is not None else np.empty((0, 4))
            self.class_id = class_id
            self.confidence = confidence
            self.tracker_id = tracker_id
            self.data = {}

        def __len__(self):
            return len(self.xyxy)

        def __getitem__(self, mask):
            return FakeDetections(
                xyxy=self.xyxy[mask],
                class_id=self.class_id[mask] if self.class_id is not None else None,
                confidence=self.confidence[mask] if self.confidence is not None else None,
                tracker_id=self.tracker_id[mask] if self.tracker_id is not None else None,
            )

    sv_mod.Detections = FakeDetections
    sv_mod.PolygonZone = MagicMock()
    sv_mod.LineZone = MagicMock()
    sv_mod.BoxAnnotator = MagicMock()
    sv_mod.LabelAnnotator = MagicMock()
    sv_mod.TraceAnnotator = MagicMock()
    sv_mod.Color = MagicMock()
    sv_mod.ColorPalette = MagicMock()

    # -- rfdetr stubs --
    rf_mod = types.ModuleType("rfdetr")
    rf_mod.RFDETRNano = MagicMock()

    # -- trackers stubs --
    tr_mod = types.ModuleType("trackers")
    tr_mod.ByteTrackTracker = MagicMock()

    return sv_mod, rf_mod, tr_mod


# Install mocks into sys.modules before any import of edge_agent code
_sv_mod, _rf_mod, _tr_mod = _make_mock_modules()
sys.modules.setdefault("supervision", _sv_mod)
sys.modules.setdefault("rfdetr", _rf_mod)
sys.modules.setdefault("trackers", _tr_mod)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def fake_detections():
    """Factory for FakeDetections objects."""
    FakeDetections = sys.modules["supervision"].Detections

    def _make(n_persons=2, n_other=1, with_tracker_ids=False):
        total = n_persons + n_other
        xyxy = np.array([[10*i, 10*i, 10*i+50, 10*i+100] for i in range(total)], dtype=float)
        class_id = np.array([1] * n_persons + [3] * n_other)  # 1=person, 3=car
        confidence = np.ones(total, dtype=float) * 0.9
        tracker_id = np.arange(1, total + 1) if with_tracker_ids else None
        d = FakeDetections(xyxy=xyxy, class_id=class_id, confidence=confidence,
                           tracker_id=tracker_id)
        d.data = {}
        return d

    return _make


@pytest.fixture
def mock_model():
    """RF-DETR model mock that returns controllable detections."""
    model = MagicMock()
    return model


@pytest.fixture
def mock_tracker():
    """ByteTrack tracker mock."""
    tracker = MagicMock()
    return tracker
