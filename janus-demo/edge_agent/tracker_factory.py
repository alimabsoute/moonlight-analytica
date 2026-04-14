"""
TrackerFactory — unified adapter for ByteTrack and BoxMOT BoT-SORT.

Usage:
    from tracker_factory import create_tracker

    tracker = create_tracker("botsort")   # uses BoxMOT if installed, falls back
    tracker = create_tracker("bytetrack") # always uses Roboflow ByteTrack

The TrackerAdapter exposes a single method:
    detections_out = tracker.update(detections_in)

where detections_in / detections_out are sv.Detections-like objects with
tracker_id populated by the underlying implementation.
"""

from __future__ import annotations

import os
import warnings
from typing import Any

# ---------------------------------------------------------------------------
# Internal builders
# ---------------------------------------------------------------------------

def _build_bytetrack(track_buffer: int = 90, **kwargs):
    """Instantiate a Roboflow ByteTrackTracker."""
    from trackers import ByteTrackTracker  # type: ignore[import]
    return ByteTrackTracker(
        lost_track_buffer=track_buffer,
        minimum_consecutive_frames=kwargs.get("minimum_consecutive_frames", 3),
    )


def _build_botsort(config_path: str | None = None, **kwargs):
    """
    Instantiate a BoxMOT BoT-SORT tracker.

    Raises ImportError if boxmot is not installed — caller handles fallback.
    """
    from boxmot import BoTSORT  # type: ignore[import]

    _default_cfg = os.path.join(os.path.dirname(__file__), "botsort_tuned.yaml")
    cfg_path = config_path or _default_cfg

    # Load yaml config if available
    track_buffer = 90
    if os.path.exists(cfg_path):
        try:
            import yaml
            with open(cfg_path) as f:
                cfg = yaml.safe_load(f) or {}
            track_buffer = cfg.get("track_buffer", 90)
        except Exception:
            pass

    return BoTSORT(
        reid_weights=kwargs.get("reid_weights", None),
        track_high_thresh=kwargs.get("track_high_thresh", 0.5),
        track_low_thresh=kwargs.get("track_low_thresh", 0.1),
        new_track_thresh=kwargs.get("new_track_thresh", 0.5),
        track_buffer=track_buffer,
        match_thresh=kwargs.get("match_thresh", 0.8),
    )


# ---------------------------------------------------------------------------
# Public adapter
# ---------------------------------------------------------------------------

class TrackerAdapter:
    """
    Thin wrapper around any tracker that exposes update().

    Normalises the call interface so the edge agent doesn't need to
    care whether it's using ByteTrack or BoxMOT.
    """

    def __init__(self, tracker: Any, backend_name: str):
        self._tracker   = tracker
        self.backend_name = backend_name

    def update(self, detections, frame=None):
        """
        Call the underlying tracker.

        ByteTrack: tracker.update(detections)
        BoxMOT:    tracker.update(detections, frame)  — frame optional
        """
        if self.backend_name == "botsort" and frame is not None:
            return self._tracker.update(detections, frame)
        return self._tracker.update(detections)

    def __repr__(self):
        return f"TrackerAdapter(backend={self.backend_name!r})"


def create_tracker(
    tracker_type: str = "bytetrack",
    config_path: str | None = None,
    **kwargs,
) -> TrackerAdapter:
    """
    Factory function.

    Args:
        tracker_type: "bytetrack" or "botsort"
        config_path:  Path to botsort_tuned.yaml (used only for botsort)
        **kwargs:     Passed through to the underlying tracker constructor

    Returns:
        TrackerAdapter wrapping the selected backend.
        If "botsort" requested but boxmot not installed, falls back to bytetrack
        with a warning.
    """
    tracker_type = tracker_type.lower().strip()

    if tracker_type == "botsort":
        try:
            tracker = _build_botsort(config_path=config_path, **kwargs)
            return TrackerAdapter(tracker, "botsort")
        except ImportError:
            warnings.warn(
                "boxmot not installed — falling back to ByteTrack. "
                "Install with: pip install boxmot",
                RuntimeWarning,
                stacklevel=2,
            )
            tracker = _build_bytetrack(**kwargs)
            return TrackerAdapter(tracker, "bytetrack")

    # default: bytetrack
    tracker = _build_bytetrack(**kwargs)
    return TrackerAdapter(tracker, "bytetrack")
