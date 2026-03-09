#!/usr/bin/env python3
"""
Enhanced Janus Edge Agent with Zone Tracking
===========================================
Tracks people across zones, detects entry/exit, calculates dwell time, and streams events.

Features:
- Multi-zone tracking (entrance, main_floor, queue, checkout)
- Entry/exit detection via virtual lines
- Person re-identification with persistent tracking
- Session management (entry time -> exit time)
- Real-time event streaming to backend
- Zone configuration via JSON file
- YouTube video support (paste any YouTube URL)

Usage:
    python edge_agent_enhanced.py --rtsp 0 --backend http://localhost:8000 --config zones.json
    python edge_agent_enhanced.py --youtube "https://www.youtube.com/watch?v=VIDEO_ID" --backend http://localhost:8000
"""

import argparse
import json
import os
import signal
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import requests
from ultralytics import YOLO

# Globals
_RUNNING = True

def _handle_sig(signum, frame):
    global _RUNNING
    _RUNNING = False

signal.signal(signal.SIGINT, _handle_sig)
signal.signal(signal.SIGTERM, _handle_sig)


class Zone:
    """Represents a physical zone in the tracking area"""
    def __init__(self, zone_id: int, name: str, x1: int, y1: int, x2: int, y2: int, zone_type: str = "general"):
        self.zone_id = zone_id
        self.name = name
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.zone_type = zone_type

    def contains_point(self, x: float, y: float) -> bool:
        """Check if a point (x, y) is inside this zone"""
        return self.x1 <= x <= self.x2 and self.y1 <= y <= self.y2

    def to_dict(self):
        return {
            "zone_id": self.zone_id,
            "name": self.name,
            "x1": self.x1,
            "y1": self.y1,
            "x2": self.x2,
            "y2": self.y2,
            "zone_type": self.zone_type
        }


class PersonTracker:
    """Tracks a single person's session across zones"""
    def __init__(self, person_id: str, entry_time: datetime, initial_zone: Optional[Zone] = None):
        self.person_id = person_id
        self.entry_time = entry_time
        self.exit_time: Optional[datetime] = None
        self.current_zone: Optional[Zone] = initial_zone
        self.zone_history: List[str] = [initial_zone.name] if initial_zone else []
        self.last_seen = entry_time
        self.converted = False  # Did they reach checkout?

    def update_zone(self, new_zone: Optional[Zone], timestamp: datetime):
        """Update person's current zone"""
        self.last_seen = timestamp
        if new_zone and (not self.current_zone or new_zone.zone_id != self.current_zone.zone_id):
            self.current_zone = new_zone
            if new_zone.name not in self.zone_history:
                self.zone_history.append(new_zone.name)

            # Check for conversion (reached checkout)
            if new_zone.zone_type == "checkout":
                self.converted = True

    def mark_exit(self, timestamp: datetime):
        """Mark this person as having exited"""
        self.exit_time = timestamp

    def get_dwell_seconds(self) -> Optional[int]:
        """Get total dwell time in seconds"""
        if self.exit_time:
            return int((self.exit_time - self.entry_time).total_seconds())
        return None

    def is_active(self, current_time: datetime, timeout_seconds: int = 300) -> bool:
        """Check if this person is still being tracked (seen within timeout)"""
        return (current_time - self.last_seen).total_seconds() < timeout_seconds


class EventStream:
    """Handles streaming events to backend"""
    def __init__(self, backend_url: str):
        self.backend_url = backend_url.rstrip('/')

    def post_event(self, event_type: str, person_id: str, zone_id: Optional[int] = None,
                   direction: Optional[str] = None, confidence: float = 1.0) -> bool:
        """Post a single event to backend"""
        url = f"{self.backend_url}/events"
        payload = {
            "event_type": event_type,  # entry, exit, zone_change
            "person_id": person_id,
            "zone_id": zone_id,
            "direction": direction,  # in, out, lateral
            "confidence": confidence,
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds")
        }

        try:
            r = requests.post(url, json=payload, timeout=5)
            r.raise_for_status()
            return True
        except Exception as e:
            print(f"[WARN] POST /events failed: {e}", file=sys.stderr)
            return False

    def post_session(self, tracker: PersonTracker) -> bool:
        """Post a completed session to backend"""
        url = f"{self.backend_url}/sessions"

        dwell_seconds = tracker.get_dwell_seconds()
        if dwell_seconds is None:
            return False

        payload = {
            "person_id": tracker.person_id,
            "entry_time": tracker.entry_time.isoformat(timespec="seconds"),
            "exit_time": tracker.exit_time.isoformat(timespec="seconds") if tracker.exit_time else None,
            "dwell_seconds": dwell_seconds,
            "zone_path": json.dumps(tracker.zone_history),
            "converted": 1 if tracker.converted else 0
        }

        try:
            r = requests.post(url, json=payload, timeout=5)
            r.raise_for_status()
            return True
        except Exception as e:
            print(f"[WARN] POST /sessions failed: {e}", file=sys.stderr)
            return False


class ZoneTracker:
    """Main tracking coordinator"""
    def __init__(self, zones: List[Zone], backend_url: str):
        self.zones = zones
        self.active_trackers: Dict[int, PersonTracker] = {}  # track_id -> PersonTracker
        self.completed_sessions: List[PersonTracker] = []
        self.event_stream = EventStream(backend_url)
        self.person_id_map: Dict[int, str] = {}  # track_id -> persistent person_id
        self.next_person_id = 1

    def get_zone_at_point(self, x: float, y: float) -> Optional[Zone]:
        """Find which zone contains this point"""
        for zone in self.zones:
            if zone.contains_point(x, y):
                return zone
        return None

    def get_or_create_person_id(self, track_id: int) -> str:
        """Get persistent person ID for this track_id"""
        if track_id not in self.person_id_map:
            self.person_id_map[track_id] = f"P{self.next_person_id:06d}"
            self.next_person_id += 1
        return self.person_id_map[track_id]

    def update(self, track_id: int, bbox: Tuple[float, float, float, float], timestamp: datetime):
        """Update tracking state for a detected person"""
        x1, y1, x2, y2 = bbox
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        current_zone = self.get_zone_at_point(center_x, center_y)
        person_id = self.get_or_create_person_id(track_id)

        # New person entering
        if track_id not in self.active_trackers:
            tracker = PersonTracker(person_id, timestamp, current_zone)
            self.active_trackers[track_id] = tracker

            # Post entry event
            if current_zone:
                self.event_stream.post_event("entry", person_id, current_zone.zone_id, "in")
                print(f"[ENTRY] {person_id} -> {current_zone.name}")

        # Existing person
        else:
            tracker = self.active_trackers[track_id]
            old_zone = tracker.current_zone

            # Zone change detected
            if current_zone and old_zone and current_zone.zone_id != old_zone.zone_id:
                tracker.update_zone(current_zone, timestamp)
                self.event_stream.post_event("zone_change", person_id, current_zone.zone_id, "lateral")
                print(f"[ZONE_CHANGE] {person_id}: {old_zone.name} -> {current_zone.name}")

            # Update last seen time
            tracker.last_seen = timestamp

    def cleanup_inactive(self, current_time: datetime, timeout_seconds: int = 300):
        """Remove inactive trackers and mark as exited"""
        to_remove = []

        for track_id, tracker in self.active_trackers.items():
            if not tracker.is_active(current_time, timeout_seconds):
                # Mark as exit
                tracker.mark_exit(current_time)

                # Post exit event
                if tracker.current_zone:
                    self.event_stream.post_event("exit", tracker.person_id, tracker.current_zone.zone_id, "out")

                # Post session
                self.event_stream.post_session(tracker)

                dwell = tracker.get_dwell_seconds()
                print(f"[EXIT] {tracker.person_id} | Dwell: {dwell}s | Zones: {' -> '.join(tracker.zone_history)}")

                self.completed_sessions.append(tracker)
                to_remove.append(track_id)

        for track_id in to_remove:
            del self.active_trackers[track_id]


def load_zone_config(config_path: str) -> List[Zone]:
    """Load zone configuration from JSON file"""
    if not os.path.exists(config_path):
        print(f"[WARN] Config file not found: {config_path}, using defaults")
        return get_default_zones()

    try:
        with open(config_path, 'r') as f:
            data = json.load(f)

        zones = []
        for z in data.get("zones", []):
            zones.append(Zone(
                zone_id=z["zone_id"],
                name=z["name"],
                x1=z["x1"],
                y1=z["y1"],
                x2=z["x2"],
                y2=z["y2"],
                zone_type=z.get("zone_type", "general")
            ))

        print(f"[INFO] Loaded {len(zones)} zones from {config_path}")
        return zones

    except Exception as e:
        print(f"[ERROR] Failed to load config: {e}, using defaults")
        return get_default_zones()


def get_default_zones() -> List[Zone]:
    """Get default zone configuration for 640x480 frame"""
    return [
        Zone(1, "entrance", 0, 0, 200, 480, "entrance"),
        Zone(2, "main_floor", 200, 0, 440, 480, "general"),
        Zone(3, "queue", 440, 240, 540, 480, "queue"),
        Zone(4, "checkout", 540, 0, 640, 480, "checkout")
    ]


def get_youtube_stream_url(youtube_url: str) -> str:
    """Extract direct video stream URL from YouTube using yt-dlp"""
    try:
        import yt_dlp
    except ImportError:
        print("[ERROR] yt-dlp not installed. Run: pip install yt-dlp")
        sys.exit(1)

    ydl_opts = {
        'format': 'best[height<=720]',  # Get 720p or lower for performance
        'quiet': True,
        'no_warnings': True
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            return info['url']
    except Exception as e:
        print(f"[ERROR] Failed to extract YouTube URL: {e}")
        print("[HINT] Make sure the YouTube URL is valid and accessible")
        sys.exit(1)


def main():
    p = argparse.ArgumentParser(description="Enhanced edge tracker with zone detection")

    # Video source options (mutually exclusive)
    source_group = p.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--rtsp", help="Video source (rtsp://, file path, or 0 for webcam)")
    source_group.add_argument("--youtube", help="YouTube video URL (e.g., https://www.youtube.com/watch?v=...)")

    p.add_argument("--backend", default=os.getenv("JANUS_BACKEND", "http://localhost:8000"),
                   help="Backend URL")
    p.add_argument("--config", default="zones.json", help="Zone configuration file")
    p.add_argument("--model", default="yolov8n.pt", help="YOLO model")
    p.add_argument("--conf", type=float, default=0.35, help="Detection confidence")
    p.add_argument("--device", default="cpu", help="Inference device")
    p.add_argument("--timeout", type=int, default=30, help="Person timeout in seconds")
    args = p.parse_args()

    # Determine video source
    if args.youtube:
        print(f"[INFO] Processing YouTube video: {args.youtube}")
        print("[INFO] Extracting stream URL (this may take a moment)...")
        video_source = get_youtube_stream_url(args.youtube)
        print(f"[INFO] Stream URL obtained successfully")
    else:
        video_source = args.rtsp

    print(f"[enhanced_edge_agent] Starting...")
    print(f"  Source: {args.youtube if args.youtube else args.rtsp}")
    print(f"  Backend: {args.backend}")
    print(f"  Config: {args.config}")

    # Load zones
    zones = load_zone_config(args.config)
    for zone in zones:
        print(f"  Zone: {zone.name} ({zone.x1},{zone.y1})->({zone.x2},{zone.y2}) [{zone.zone_type}]")

    # Initialize tracker
    zone_tracker = ZoneTracker(zones, args.backend)

    # Load YOLO model
    model = YOLO(args.model)

    # Start tracking
    last_cleanup = time.time()
    cleanup_interval = 10  # seconds

    try:
        results_gen = model.track(
            source=video_source,
            stream=True,
            device=args.device,
            conf=args.conf,
            iou=0.5,
            classes=[0],  # person class
            tracker="bytetrack.yaml",
            verbose=False
        )

        for res in results_gen:
            if not _RUNNING:
                break

            timestamp = datetime.now(timezone.utc)
            boxes = getattr(res, "boxes", None)

            if boxes is not None and boxes.shape[0] > 0:
                ids = boxes.id
                xyxy = boxes.xyxy

                if ids is not None:
                    for i, track_id in enumerate(ids.cpu().numpy().astype(int)):
                        bbox = xyxy[i].cpu().numpy()
                        zone_tracker.update(track_id, tuple(bbox), timestamp)

            # Periodic cleanup of inactive trackers
            now = time.time()
            if now - last_cleanup >= cleanup_interval:
                zone_tracker.cleanup_inactive(timestamp, args.timeout)
                last_cleanup = now

                # Status update
                active = len(zone_tracker.active_trackers)
                completed = len(zone_tracker.completed_sessions)
                print(f"[STATUS] Active: {active} | Completed: {completed}")

    except KeyboardInterrupt:
        print("\n[INFO] Shutting down...")
    finally:
        # Final cleanup
        timestamp = datetime.now(timezone.utc)
        zone_tracker.cleanup_inactive(timestamp, timeout_seconds=0)

        print(f"[FINAL] Total sessions: {len(zone_tracker.completed_sessions)}")


if __name__ == "__main__":
    main()
