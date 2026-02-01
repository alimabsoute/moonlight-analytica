#!/usr/bin/env python3
"""
Enhanced Edge Agent with Person Trajectory Tracking + Re-ID
============================================================
Tracks individual people across zones with persistent identity through:
- YOLO detection + ByteTrack/BoT-SORT tracking
- Re-ID for identity recovery after occlusions
- Entries/Exits detection
- Zone transitions
- Per-person dwell time per zone
- Complete visitor sessions

Usage:
    python edge_agent_pro.py --source "video.mp4" --backend "http://localhost:8000" --config zones.json
    python edge_agent_pro.py --source 0 --backend "http://localhost:8000" --config zones.json  # webcam

Tracker Options:
    --tracker bytetrack_tuned.yaml   # Tuned ByteTrack (default, 3s buffer)
    --tracker botsort_tuned.yaml     # BoT-SORT with camera motion compensation
    --tracker bytetrack.yaml         # Default ByteTrack

Re-ID Options:
    --enable-reid                    # Enable appearance-based re-identification
    --reid-threshold 0.5             # Similarity threshold for Re-ID matching
"""

import argparse
import json
import os
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Optional

import numpy as np
import requests
from ultralytics import YOLO

# Import Re-ID manager (optional - graceful fallback if not available)
try:
    from reid_manager import ReIDManager, create_reid_manager
    REID_AVAILABLE = True
except ImportError:
    REID_AVAILABLE = False
    print("[INFO] Re-ID module not available. Using standard tracking only.")


class Zone:
    def __init__(self, zone_id: int, name: str, x1: int, y1: int, x2: int, y2: int, zone_type: str = "general"):
        self.zone_id = zone_id
        self.name = name
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.zone_type = zone_type

    def contains_point(self, x: float, y: float, frame_width: int, frame_height: int) -> bool:
        """Check if point (x, y) is inside this zone"""
        # Scale zone coordinates to frame size
        zone_x1 = (self.x1 / 640) * frame_width
        zone_y1 = (self.y1 / 480) * frame_height
        zone_x2 = (self.x2 / 640) * frame_width
        zone_y2 = (self.y2 / 480) * frame_height

        return (zone_x1 <= x <= zone_x2) and (zone_y1 <= y <= zone_y2)


def load_zones(config_path: str = "zones.json") -> List[Zone]:
    """Load zone configuration"""
    if not os.path.exists(config_path):
        return [
            Zone(1, "entrance", 0, 0, 200, 480, "entrance"),
            Zone(2, "main_floor", 200, 0, 440, 480, "general"),
            Zone(3, "queue", 440, 240, 540, 480, "queue"),
            Zone(4, "checkout", 540, 0, 640, 480, "checkout")
        ]

    with open(config_path, 'r') as f:
        data = json.load(f)

    return [Zone(**z) for z in data.get("zones", [])]


class PersonTracker:
    """Tracks individual person trajectories across zones with optional Re-ID"""

    def __init__(
        self,
        backend_url: str,
        zones: List[Zone],
        lost_threshold: int = 90,  # Increased from 30 to 90 (3 seconds at 30fps)
        enable_reid: bool = False,
        reid_threshold: float = 0.5,
    ):
        self.backend = backend_url.rstrip('/')
        self.zones = zones
        self.lost_threshold = lost_threshold  # frames before considering person exited

        # Active persons: {track_id: {'entry_time': datetime, 'current_zone': zone_id, 'zone_history': [...], 'last_seen': frame_num}}
        self.active_persons = {}

        # Zone mapping for quick lookup
        self.zone_map = {z.zone_id: z for z in zones}

        # Frame counter
        self.frame_num = 0

        # Stats
        self.total_entries = 0
        self.total_exits = 0
        self.total_zone_changes = 0
        self.total_reids = 0

        # Re-ID manager (optional)
        self.reid_manager = None
        self.enable_reid = enable_reid and REID_AVAILABLE

        if self.enable_reid:
            self.reid_manager = create_reid_manager(
                similarity_threshold=reid_threshold,
                max_lost_seconds=lost_threshold / 30.0,  # Convert frames to seconds
                fps=30,
            )
            print(f"[INFO] Re-ID enabled with threshold {reid_threshold}")
        elif enable_reid and not REID_AVAILABLE:
            print("[WARNING] Re-ID requested but module not available. Install boxmot or torchreid.")

        # Current frame storage for Re-ID
        self._current_frame = None

    def get_person_zone(self, bbox: List[float], frame_width: int, frame_height: int) -> Optional[int]:
        """Determine which zone contains the person's center point"""
        # Calculate person's center point
        person_x = (bbox[0] + bbox[2]) / 2
        person_y = (bbox[1] + bbox[3]) / 2

        # Check each zone
        for zone in self.zones:
            if zone.contains_point(person_x, person_y, frame_width, frame_height):
                return zone.zone_id

        return None  # Not in any zone

    def post_event(self, event_type: str, person_id: int, zone_id: Optional[int],
                   direction: str, confidence: float = 1.0) -> bool:
        """Post tracking event to backend"""
        url = f"{self.backend}/events"
        timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")

        payload = {
            "event_type": event_type,  # entry, exit, zone_change
            "person_id": str(person_id),
            "zone_id": zone_id,
            "direction": direction,  # in, out, lateral
            "confidence": confidence,
            "timestamp": timestamp
        }

        print(f"[DEBUG] POST {url} with payload: {payload}")

        try:
            r = requests.post(url, json=payload, timeout=5)
            print(f"[DEBUG] Response status: {r.status_code}, body: {r.text[:200]}")
            r.raise_for_status()
            print(f"[SUCCESS] Event posted: {event_type} for person {person_id}")
            return True
        except requests.exceptions.ConnectionError as e:
            print(f"[ERROR] Connection failed to {url}: {e}", file=sys.stderr)
            return False
        except requests.exceptions.Timeout as e:
            print(f"[ERROR] Timeout posting to {url}: {e}", file=sys.stderr)
            return False
        except requests.exceptions.HTTPError as e:
            print(f"[ERROR] HTTP error from {url}: {e}, response: {r.text}", file=sys.stderr)
            return False
        except Exception as e:
            print(f"[ERROR] Unexpected error posting to {url}: {type(e).__name__}: {e}", file=sys.stderr)
            return False

    def post_session(self, person_id: int, entry_time: datetime, exit_time: datetime,
                     zone_path: List[str], converted: int = 0) -> bool:
        """Post completed session to backend"""
        url = f"{self.backend}/sessions"

        dwell_seconds = int((exit_time - entry_time).total_seconds())

        payload = {
            "person_id": str(person_id),
            "entry_time": entry_time.isoformat(timespec="seconds"),
            "exit_time": exit_time.isoformat(timespec="seconds"),
            "dwell_seconds": dwell_seconds,
            "zone_path": json.dumps(zone_path),
            "converted": converted
        }

        print(f"[DEBUG] POST {url} with payload: {payload}")

        try:
            r = requests.post(url, json=payload, timeout=5)
            print(f"[DEBUG] Response status: {r.status_code}, body: {r.text[:200]}")
            r.raise_for_status()
            print(f"[SUCCESS] Session posted for person {person_id}, dwell: {dwell_seconds}s")
            return True
        except requests.exceptions.ConnectionError as e:
            print(f"[ERROR] Connection failed to {url}: {e}", file=sys.stderr)
            return False
        except requests.exceptions.Timeout as e:
            print(f"[ERROR] Timeout posting to {url}: {e}", file=sys.stderr)
            return False
        except requests.exceptions.HTTPError as e:
            print(f"[ERROR] HTTP error from {url}: {e}, response: {r.text}", file=sys.stderr)
            return False
        except Exception as e:
            print(f"[ERROR] Unexpected error posting to {url}: {type(e).__name__}: {e}", file=sys.stderr)
            return False

    def set_current_frame(self, frame: np.ndarray):
        """Store current frame for Re-ID feature extraction"""
        self._current_frame = frame

    def update(self, tracked_boxes: List[Dict], frame_width: int, frame_height: int):
        """Update person tracking with new frame data"""
        self.frame_num += 1
        current_track_ids = set()

        # Process currently tracked persons
        for box in tracked_boxes:
            track_id = box['track_id']
            bbox = box['bbox']
            confidence = box['confidence']

            current_track_ids.add(track_id)

            # Determine current zone
            current_zone = self.get_person_zone(bbox, frame_width, frame_height)

            # Check for Re-ID match if this is a new track
            if track_id not in self.active_persons and self.enable_reid and self._current_frame is not None:
                # Try to match against lost gallery
                original_id = self.reid_manager.try_reidentify(
                    self._current_frame, bbox, track_id, self.frame_num
                )
                if original_id is not None:
                    # Re-identified! Use the original track data
                    track_id = original_id
                    self.total_reids += 1
                    print(f"[REID] Track {box['track_id']} re-identified as person {original_id}")

            if track_id not in self.active_persons:
                # New person detected
                entry_time = datetime.now(timezone.utc)
                self.active_persons[track_id] = {
                    'entry_time': entry_time,
                    'current_zone': current_zone,
                    'zone_history': [current_zone] if current_zone else [],
                    'last_seen': self.frame_num,
                    'zone_times': defaultdict(float),  # Track time per zone
                    'last_zone_entry': datetime.now(timezone.utc) if current_zone else None
                }

                # Register with Re-ID manager
                if self.enable_reid and self._current_frame is not None:
                    self.reid_manager.register_track(
                        track_id, self._current_frame, bbox, confidence, self.frame_num
                    )

                # Post entry event
                if current_zone:
                    zone_name = self.zone_map[current_zone].name
                    self.post_event("entry", track_id, current_zone, "in", confidence)
                    self.total_entries += 1
                    print(f"[ENTRY] Person {track_id} entered {zone_name}")

            else:
                # Existing person - check for zone change
                person = self.active_persons[track_id]
                person['last_seen'] = self.frame_num

                # Update Re-ID features periodically
                if self.enable_reid and self._current_frame is not None and self.frame_num % 30 == 0:
                    self.reid_manager.register_track(
                        track_id, self._current_frame, bbox, confidence, self.frame_num
                    )

                if current_zone != person['current_zone']:
                    # Zone transition detected
                    old_zone = person['current_zone']

                    # Calculate time spent in previous zone
                    if old_zone and person['last_zone_entry']:
                        time_in_zone = (datetime.now(timezone.utc) - person['last_zone_entry']).total_seconds()
                        person['zone_times'][old_zone] += time_in_zone

                    # Update current zone
                    person['current_zone'] = current_zone
                    person['last_zone_entry'] = datetime.now(timezone.utc)

                    if current_zone:
                        person['zone_history'].append(current_zone)

                    # Post zone change event
                    if current_zone:
                        zone_name = self.zone_map[current_zone].name
                        self.post_event("zone_change", track_id, current_zone, "lateral", confidence)
                        self.total_zone_changes += 1

                        old_zone_name = self.zone_map[old_zone].name if old_zone else "NO ZONE"
                        print(f"[ZONE CHANGE] Person {track_id}: {old_zone_name} → {zone_name}")

        # Check for persons who have exited (not seen for N frames)
        to_remove = []
        for track_id, person in self.active_persons.items():
            if track_id not in current_track_ids:
                frames_missing = self.frame_num - person['last_seen']

                # Move to Re-ID gallery when first lost (not yet timed out)
                if frames_missing == 1 and self.enable_reid:
                    self.reid_manager.mark_lost(track_id, self.frame_num)

                if frames_missing >= self.lost_threshold:
                    # Person has exited
                    exit_time = datetime.now(timezone.utc)

                    # Calculate final zone time
                    if person['current_zone'] and person['last_zone_entry']:
                        time_in_zone = (exit_time - person['last_zone_entry']).total_seconds()
                        person['zone_times'][person['current_zone']] += time_in_zone

                    # Build zone path (names instead of IDs)
                    zone_path = [self.zone_map[zid].name for zid in person['zone_history'] if zid in self.zone_map]

                    # Determine if converted (visited checkout zone)
                    checkout_zone_id = next((z.zone_id for z in self.zones if z.zone_type == "checkout"), None)
                    converted = 1 if checkout_zone_id in person['zone_history'] else 0

                    # Post exit event
                    last_zone = person['current_zone'] or person['zone_history'][-1] if person['zone_history'] else None
                    if last_zone:
                        self.post_event("exit", track_id, last_zone, "out", 1.0)

                    # Post session
                    self.post_session(track_id, person['entry_time'], exit_time, zone_path, converted)

                    self.total_exits += 1
                    dwell_seconds = int((exit_time - person['entry_time']).total_seconds())
                    print(f"[EXIT] Person {track_id} exited. Dwell: {dwell_seconds}s, Converted: {converted}, Path: {' → '.join(zone_path)}")

                    to_remove.append(track_id)

        # Remove exited persons
        for track_id in to_remove:
            del self.active_persons[track_id]

    def get_stats(self) -> Dict:
        """Get current tracking statistics"""
        stats = {
            "active_persons": len(self.active_persons),
            "total_entries": self.total_entries,
            "total_exits": self.total_exits,
            "total_zone_changes": self.total_zone_changes,
            "total_reids": self.total_reids,
            "frame_num": self.frame_num,
        }

        # Add Re-ID stats if available
        if self.enable_reid and self.reid_manager:
            reid_stats = self.reid_manager.get_stats()
            stats["reid_gallery_size"] = reid_stats.get("gallery_size", 0)
            stats["reid_total_matches"] = reid_stats.get("gallery_hits", 0)

        return stats


def main():
    import cv2

    p = argparse.ArgumentParser(
        description="Enhanced edge tracker with person trajectory tracking and Re-ID",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage with tuned ByteTrack
  python edge_agent_pro.py --source video.mp4

  # Use BoT-SORT with camera motion compensation
  python edge_agent_pro.py --source video.mp4 --tracker botsort_tuned.yaml

  # Enable Re-ID for identity persistence through occlusions
  python edge_agent_pro.py --source video.mp4 --enable-reid

  # Full configuration
  python edge_agent_pro.py --source rtsp://camera:554/stream \\
      --tracker botsort_tuned.yaml --enable-reid --reid-threshold 0.6
        """,
    )
    p.add_argument("--source", required=True,
                   help="Video source (file path, rtsp://, or 0 for webcam)")
    p.add_argument("--backend", default=os.getenv("JANUS_BACKEND", "http://localhost:8000"),
                   help="Janus backend base URL (default: http://localhost:8000)")
    p.add_argument("--config", default="zones.json",
                   help="Zone configuration file")
    p.add_argument("--model", default=os.getenv("YOLO_MODEL", "yolov8n.pt"),
                   help="Ultralytics model (default: yolov8n.pt)")
    p.add_argument("--conf", type=float, default=float(os.getenv("CONF", "0.35")),
                   help="Detection confidence threshold (default: 0.35)")
    p.add_argument("--device", default=os.getenv("DEVICE", "cpu"),
                   help="Inference device: cpu or cuda:0")

    # Tracker configuration
    p.add_argument("--tracker", default="bytetrack_tuned.yaml",
                   choices=["bytetrack.yaml", "bytetrack_tuned.yaml", "botsort.yaml", "botsort_tuned.yaml"],
                   help="Tracker configuration (default: bytetrack_tuned.yaml)")
    p.add_argument("--lost-threshold", type=int, default=90,
                   help="Frames before considering person exited (default: 90 = 3s at 30fps)")

    # Re-ID configuration
    p.add_argument("--enable-reid", action="store_true",
                   help="Enable appearance-based re-identification")
    p.add_argument("--reid-threshold", type=float, default=0.5,
                   help="Similarity threshold for Re-ID matching (0-1, default: 0.5)")

    args = p.parse_args()

    print(f"[edge_agent_pro] source={args.source} backend={args.backend} config={args.config}")
    print(f"[edge_agent_pro] tracker={args.tracker} lost_threshold={args.lost_threshold} enable_reid={args.enable_reid}")

    # Load zones
    zones = load_zones(args.config)
    print(f"[INFO] Loaded {len(zones)} zones: {', '.join([z.name for z in zones])}")

    # Initialize tracker with Re-ID support
    tracker = PersonTracker(
        args.backend,
        zones,
        lost_threshold=args.lost_threshold,
        enable_reid=args.enable_reid,
        reid_threshold=args.reid_threshold,
    )

    # Determine tracker config path
    tracker_config = args.tracker
    # Check if custom config exists in edge_agent directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    custom_tracker_path = os.path.join(script_dir, args.tracker)
    if os.path.exists(custom_tracker_path):
        tracker_config = custom_tracker_path
        print(f"[INFO] Using custom tracker config: {tracker_config}")
    else:
        print(f"[INFO] Using default tracker config: {tracker_config}")

    # Load YOLO model
    print(f"[INFO] Loading YOLO model: {args.model}")
    model = YOLO(args.model)

    # Open video source
    print(f"[INFO] Opening video source: {args.source}")
    cap = cv2.VideoCapture(args.source)

    if not cap.isOpened():
        print(f"[ERROR] Failed to open video source: {args.source}")
        sys.exit(1)

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[INFO] Video resolution: {frame_width}x{frame_height}")

    # Process frames
    last_stats_print = time.time()
    frame_counter = 0

    try:
        while True:
            ret, frame = cap.read()

            if not ret:
                # Video ended - loop back or exit
                print("[INFO] Video ended, looping back...")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            # Skip frames for performance (process every 3rd frame)
            frame_counter += 1
            if frame_counter % 3 != 0:
                continue

            # Store frame for Re-ID feature extraction
            tracker.set_current_frame(frame)

            # Run YOLO tracking with configured tracker
            results = model.track(
                source=frame,
                persist=True,
                device=args.device,
                conf=args.conf,
                iou=0.5,
                classes=[0],  # person class
                tracker=tracker_config,
                verbose=False
            )

            # Extract tracked boxes
            tracked_boxes = []

            if len(results) > 0:
                boxes = results[0].boxes

                if boxes is not None and len(boxes) > 0:
                    ids = boxes.id
                    xyxy = boxes.xyxy
                    conf_scores = boxes.conf

                    if ids is not None:
                        for i, track_id in enumerate(ids.cpu().numpy().astype(int)):
                            bbox = xyxy[i].cpu().numpy()
                            confidence = float(conf_scores[i].cpu().numpy())

                            tracked_boxes.append({
                                'track_id': int(track_id),
                                'bbox': [float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])],
                                'confidence': confidence
                            })

            # Update person tracker
            tracker.update(tracked_boxes, frame_width, frame_height)

            # Print stats every 10 seconds
            if time.time() - last_stats_print >= 10:
                stats = tracker.get_stats()
                reid_info = ""
                if args.enable_reid:
                    reid_info = f", ReIDs: {stats.get('total_reids', 0)}, Gallery: {stats.get('reid_gallery_size', 0)}"
                print(f"[STATS] Active: {stats['active_persons']}, "
                      f"Entries: {stats['total_entries']}, "
                      f"Exits: {stats['total_exits']}, "
                      f"Zone Changes: {stats['total_zone_changes']}{reid_info}, "
                      f"Frames: {stats['frame_num']}")
                last_stats_print = time.time()

    except KeyboardInterrupt:
        print("\n[INFO] Shutting down...")
    finally:
        cap.release()

        # Final stats
        stats = tracker.get_stats()
        print(f"\n[FINAL STATS]")
        print(f"  Total Entries: {stats['total_entries']}")
        print(f"  Total Exits: {stats['total_exits']}")
        print(f"  Total Zone Changes: {stats['total_zone_changes']}")
        if args.enable_reid:
            print(f"  Total Re-IDs: {stats.get('total_reids', 0)}")
            print(f"  ReID Gallery Hits: {stats.get('reid_total_matches', 0)}")
        print(f"  Frames Processed: {stats['frame_num']}")
        print(f"  Active Persons: {stats['active_persons']}")


if __name__ == "__main__":
    main()
