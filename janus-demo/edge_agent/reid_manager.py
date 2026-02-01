#!/usr/bin/env python3
"""
Re-ID Manager for Persistent Person Tracking
=============================================
Handles appearance-based re-identification to maintain track IDs
when people are temporarily occluded or leave the frame briefly.

Uses feature extraction to create visual "fingerprints" of tracked persons.
When a new detection appears, we compare its features against the gallery
of recently lost tracks to potentially reassign their original ID.

Features:
- Feature extraction using lightweight CNN (OSNet)
- Gallery management for lost tracks
- Appearance matching with cosine similarity
- Configurable matching thresholds and timeouts
"""

import time
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np

# Feature extraction will use boxmot or torchreid when available
# Falls back to simple histogram features if ML libraries unavailable
_REID_BACKEND = None


def _init_reid_backend():
    """Initialize the Re-ID feature extractor backend"""
    global _REID_BACKEND

    if _REID_BACKEND is not None:
        return _REID_BACKEND

    # Try boxmot first (includes OSNet)
    try:
        from boxmot.appearance.reid_auto_backend import ReidAutoBackend
        _REID_BACKEND = "boxmot"
        print("[ReID] Using boxmot backend with OSNet")
        return _REID_BACKEND
    except ImportError:
        pass

    # Try torchreid
    try:
        import torchreid
        _REID_BACKEND = "torchreid"
        print("[ReID] Using torchreid backend")
        return _REID_BACKEND
    except ImportError:
        pass

    # Fallback to histogram features
    _REID_BACKEND = "histogram"
    print("[ReID] Using histogram fallback (install boxmot for better accuracy)")
    return _REID_BACKEND


@dataclass
class TrackedPerson:
    """Represents a tracked person with appearance features"""
    track_id: int
    features: np.ndarray  # Appearance feature vector
    last_seen_frame: int
    last_bbox: List[float]
    confidence: float
    entry_time: float = field(default_factory=time.time)

    def age(self, current_frame: int) -> int:
        """How many frames since this person was last seen"""
        return current_frame - self.last_seen_frame


class ReIDManager:
    """
    Manages Re-ID for persistent person tracking.

    Workflow:
    1. When a new track is created, extract and store features
    2. When a track is lost, move to the "lost gallery"
    3. When a new detection appears, check against lost gallery
    4. If match found, reassign the original track ID
    """

    def __init__(
        self,
        similarity_threshold: float = 0.5,
        max_lost_age: int = 300,  # 10 seconds at 30fps
        gallery_size: int = 100,
        feature_dim: int = 512,
    ):
        """
        Initialize the Re-ID manager.

        Args:
            similarity_threshold: Minimum cosine similarity for a match (0-1)
            max_lost_age: Max frames to keep a lost track in gallery
            gallery_size: Maximum number of tracks to keep in gallery
            feature_dim: Dimension of feature vectors
        """
        self.similarity_threshold = similarity_threshold
        self.max_lost_age = max_lost_age
        self.gallery_size = gallery_size
        self.feature_dim = feature_dim

        # Active tracks: {track_id: TrackedPerson}
        self.active_tracks: Dict[int, TrackedPerson] = {}

        # Lost track gallery (FIFO with size limit)
        self.lost_gallery: deque = deque(maxlen=gallery_size)

        # Track ID mapping for reassigned IDs
        # {new_tracker_id: original_track_id}
        self.id_mapping: Dict[int, int] = {}

        # Feature extractor (lazy loaded)
        self._extractor = None

        # Statistics
        self.stats = {
            "total_reids": 0,
            "failed_reids": 0,
            "gallery_hits": 0,
        }

        # Initialize backend
        _init_reid_backend()

    def _get_extractor(self):
        """Lazy load the feature extractor"""
        if self._extractor is not None:
            return self._extractor

        backend = _init_reid_backend()

        if backend == "boxmot":
            try:
                from boxmot.appearance.reid_auto_backend import ReidAutoBackend
                # Use OSNet - lightweight and fast
                self._extractor = ReidAutoBackend(
                    weights="osnet_x0_25_msmt17.pt",
                    device="cpu",  # Change to "cuda:0" for GPU
                    half=False,
                )
            except Exception as e:
                print(f"[ReID] Failed to load boxmot extractor: {e}")
                self._extractor = "histogram"

        elif backend == "torchreid":
            try:
                import torchreid
                self._extractor = torchreid.utils.FeatureExtractor(
                    model_name="osnet_x0_25",
                    device="cpu",  # Change to "cuda" for GPU
                )
            except Exception as e:
                print(f"[ReID] Failed to load torchreid extractor: {e}")
                self._extractor = "histogram"

        else:
            self._extractor = "histogram"

        return self._extractor

    def extract_features(self, frame: np.ndarray, bbox: List[float]) -> np.ndarray:
        """
        Extract appearance features from a person crop.

        Args:
            frame: Full video frame (HxWxC numpy array)
            bbox: Bounding box [x1, y1, x2, y2]

        Returns:
            Feature vector (normalized)
        """
        extractor = self._get_extractor()

        # Crop the person from frame
        x1, y1, x2, y2 = [int(v) for v in bbox]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(frame.shape[1], x2), min(frame.shape[0], y2)

        if x2 <= x1 or y2 <= y1:
            # Invalid crop, return zero features
            return np.zeros(self.feature_dim)

        crop = frame[y1:y2, x1:x2]

        if extractor == "histogram":
            # Fallback: use color histogram as features
            return self._extract_histogram_features(crop)

        try:
            if _REID_BACKEND == "boxmot":
                # boxmot expects list of crops
                features = extractor([crop])
                return features[0] if len(features) > 0 else np.zeros(self.feature_dim)

            elif _REID_BACKEND == "torchreid":
                # torchreid expects PIL image or file path
                import cv2
                from PIL import Image
                crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                pil_crop = Image.fromarray(crop_rgb)
                features = extractor([pil_crop])
                return features[0].numpy() if len(features) > 0 else np.zeros(self.feature_dim)

        except Exception as e:
            print(f"[ReID] Feature extraction failed: {e}")
            return self._extract_histogram_features(crop)

    def _extract_histogram_features(self, crop: np.ndarray) -> np.ndarray:
        """
        Fallback feature extraction using color histograms.
        Less accurate than deep features but works without ML dependencies.
        """
        import cv2

        # Resize to standard size
        crop_resized = cv2.resize(crop, (64, 128))

        # Convert to HSV for better color representation
        hsv = cv2.cvtColor(crop_resized, cv2.COLOR_BGR2HSV)

        # Calculate histogram for each channel
        h_hist = cv2.calcHist([hsv], [0], None, [32], [0, 180])
        s_hist = cv2.calcHist([hsv], [1], None, [32], [0, 256])
        v_hist = cv2.calcHist([hsv], [2], None, [32], [0, 256])

        # Concatenate histograms
        features = np.concatenate([
            h_hist.flatten(),
            s_hist.flatten(),
            v_hist.flatten(),
        ])

        # Normalize to unit vector
        norm = np.linalg.norm(features)
        if norm > 0:
            features = features / norm

        # Pad to feature_dim if needed
        if len(features) < self.feature_dim:
            features = np.pad(features, (0, self.feature_dim - len(features)))

        return features[:self.feature_dim]

    def cosine_similarity(self, feat1: np.ndarray, feat2: np.ndarray) -> float:
        """Calculate cosine similarity between two feature vectors"""
        norm1 = np.linalg.norm(feat1)
        norm2 = np.linalg.norm(feat2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(np.dot(feat1, feat2) / (norm1 * norm2))

    def register_track(
        self,
        track_id: int,
        frame: np.ndarray,
        bbox: List[float],
        confidence: float,
        current_frame: int,
    ):
        """
        Register a new track or update an existing one.

        Args:
            track_id: Tracker-assigned ID
            frame: Current video frame
            bbox: Detection bounding box
            confidence: Detection confidence
            current_frame: Current frame number
        """
        # Check if this ID was remapped
        original_id = self.id_mapping.get(track_id, track_id)

        features = self.extract_features(frame, bbox)

        if original_id in self.active_tracks:
            # Update existing track
            person = self.active_tracks[original_id]
            # Running average of features for stability
            person.features = 0.7 * person.features + 0.3 * features
            person.last_seen_frame = current_frame
            person.last_bbox = bbox
            person.confidence = confidence
        else:
            # New track
            self.active_tracks[original_id] = TrackedPerson(
                track_id=original_id,
                features=features,
                last_seen_frame=current_frame,
                last_bbox=bbox,
                confidence=confidence,
            )

    def mark_lost(self, track_id: int, current_frame: int):
        """
        Move a track to the lost gallery when it disappears.

        Args:
            track_id: ID of the lost track
            current_frame: Current frame number
        """
        original_id = self.id_mapping.get(track_id, track_id)

        if original_id in self.active_tracks:
            person = self.active_tracks.pop(original_id)
            person.last_seen_frame = current_frame
            self.lost_gallery.append(person)

    def try_reidentify(
        self,
        frame: np.ndarray,
        bbox: List[float],
        new_track_id: int,
        current_frame: int,
    ) -> Optional[int]:
        """
        Try to re-identify a new detection as a previously lost track.

        Args:
            frame: Current video frame
            bbox: New detection bounding box
            new_track_id: ID assigned by tracker
            current_frame: Current frame number

        Returns:
            Original track ID if matched, None otherwise
        """
        # Clean up old entries from gallery
        self._cleanup_gallery(current_frame)

        if len(self.lost_gallery) == 0:
            return None

        # Extract features for the new detection
        new_features = self.extract_features(frame, bbox)

        # Find best match in gallery
        best_match = None
        best_similarity = self.similarity_threshold

        for person in self.lost_gallery:
            similarity = self.cosine_similarity(new_features, person.features)

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = person

        if best_match is not None:
            # Found a match! Reassign the original ID
            self.lost_gallery.remove(best_match)

            # Update the mapping
            self.id_mapping[new_track_id] = best_match.track_id

            # Re-register with original ID
            self.active_tracks[best_match.track_id] = TrackedPerson(
                track_id=best_match.track_id,
                features=new_features,
                last_seen_frame=current_frame,
                last_bbox=bbox,
                confidence=1.0,
                entry_time=best_match.entry_time,  # Keep original entry time
            )

            self.stats["total_reids"] += 1
            self.stats["gallery_hits"] += 1

            print(f"[ReID] Matched new track {new_track_id} to lost track {best_match.track_id} "
                  f"(similarity: {best_similarity:.3f})")

            return best_match.track_id

        self.stats["failed_reids"] += 1
        return None

    def _cleanup_gallery(self, current_frame: int):
        """Remove tracks that have been lost for too long"""
        # Remove entries older than max_lost_age
        while self.lost_gallery and self.lost_gallery[0].age(current_frame) > self.max_lost_age:
            self.lost_gallery.popleft()

    def get_original_id(self, track_id: int) -> int:
        """Get the original track ID (handles remapping)"""
        return self.id_mapping.get(track_id, track_id)

    def get_stats(self) -> Dict:
        """Get Re-ID statistics"""
        return {
            **self.stats,
            "active_tracks": len(self.active_tracks),
            "gallery_size": len(self.lost_gallery),
            "id_mappings": len(self.id_mapping),
        }


# Convenience function for integration
def create_reid_manager(
    use_gpu: bool = False,
    similarity_threshold: float = 0.5,
    max_lost_seconds: float = 10.0,
    fps: int = 30,
) -> ReIDManager:
    """
    Factory function to create a configured ReIDManager.

    Args:
        use_gpu: Whether to use GPU for feature extraction
        similarity_threshold: Minimum similarity for matching (0-1)
        max_lost_seconds: How long to keep lost tracks in gallery
        fps: Video frame rate for calculating max_lost_age

    Returns:
        Configured ReIDManager instance
    """
    return ReIDManager(
        similarity_threshold=similarity_threshold,
        max_lost_age=int(max_lost_seconds * fps),
        gallery_size=100,
        feature_dim=512,
    )
