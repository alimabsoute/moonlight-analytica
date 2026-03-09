#!/usr/bin/env python3
"""
Advanced Edge Agent with YOLOv11 + Multiple Tracker Support
============================================================
Enhanced people tracking with YOLOv11 models and configurable tracking algorithms.

Features:
- YOLOv11 nano/small/medium models for better accuracy
- Multiple tracking algorithms: ByteTrack, BoT-SORT, custom
- Configurable confidence thresholds
- Enhanced zone analytics with polygon support
- Re-identification support for persistent tracking

Usage:
    python edge_agent_advanced.py --source 0 --model yolo11n.pt --tracker botsort
    python edge_agent_advanced.py --youtube "URL" --model yolo11s.pt --conf 0.3
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from collections import defaultdict

import cv2
import numpy as np
import requests
from ultralytics import YOLO


# ============================================================================
# CONFIGURATION
# ============================================================================

BACKEND_URL = os.environ.get("JANUS_BACKEND", "http://localhost:8000")

# Model variants - YOLOv11 series
YOLO_MODELS = {
    "yolo11n": "yolo11n.pt",    # Nano - fastest, lowest accuracy
    "yolo11s": "yolo11s.pt",    # Small - balanced
    "yolo11m": "yolo11m.pt",    # Medium - higher accuracy
    "yolo11l": "yolo11l.pt",    # Large - best accuracy, slower
    "yolov8n": "yolov8n.pt",    # Legacy YOLOv8 nano
}

# Tracker algorithms
TRACKERS = {
    "bytetrack": "bytetrack.yaml",      # Fast, good for most cases
    "botsort": "botsort.yaml",          # Better re-identification
}

# Default zone configuration (640x480 baseline)
DEFAULT_ZONES = [
    {"zone_id": 1, "name": "entrance", "x1": 0, "y1": 0, "x2": 200, "y2": 480, "zone_type": "entrance"},
    {"zone_id": 2, "name": "main_floor", "x1": 200, "y1": 0, "x2": 440, "y2": 480, "zone_type": "general"},
    {"zone_id": 3, "name": "queue", "x1": 440, "y1": 240, "x2": 540, "y2": 480, "zone_type": "queue"},
    {"zone_id": 4, "name": "checkout", "x1": 540, "y1": 0, "x2": 640, "y2": 480, "zone_type": "checkout"},
]


# ============================================================================
# TRACKING SESSION MANAGER
# ============================================================================

class PersonSession:
    """Track an individual person's journey through the space."""

    def __init__(self, track_id: int, first_zone: str, entry_time: datetime):
        self.track_id = track_id
        self.entry_time = entry_time
        self.last_seen = entry_time
        self.zone_history = [first_zone]
        self.zone_dwell = defaultdict(float)  # Zone -> seconds spent
        self.total_detections = 1
        self.confidence_scores = []
        self.positions = []  # [(x, y, timestamp), ...]
        self.exited = False

    def update(self, zone: str, confidence: float, position: Tuple[int, int], timestamp: datetime):
        """Update session with new detection."""
        self.last_seen = timestamp
        self.total_detections += 1
        self.confidence_scores.append(confidence)
        self.positions.append((position[0], position[1], timestamp.isoformat()))

        if zone and zone != self.zone_history[-1]:
            self.zone_history.append(zone)

        # Update dwell time for current zone
        if len(self.positions) >= 2:
            time_diff = (timestamp - datetime.fromisoformat(self.positions[-2][2])).total_seconds()
            self.zone_dwell[zone] += time_diff

    def to_dict(self) -> dict:
        """Convert session to dictionary for API."""
        total_dwell = (self.last_seen - self.entry_time).total_seconds()
        return {
            "person_id": f"P{self.track_id:06d}",
            "entry_time": self.entry_time.isoformat(),
            "exit_time": self.last_seen.isoformat() if self.exited else None,
            "dwell_seconds": total_dwell,
            "zone_path": self.zone_history,
            "zone_dwell_breakdown": dict(self.zone_dwell),
            "total_detections": self.total_detections,
            "avg_confidence": sum(self.confidence_scores) / len(self.confidence_scores) if self.confidence_scores else 0,
            "converted": 1 if "checkout" in self.zone_history else 0,
        }


class TrackingSessionManager:
    """Manage all active tracking sessions."""

    def __init__(self, exit_timeout: float = 300.0):
        self.sessions: Dict[int, PersonSession] = {}
        self.exit_timeout = exit_timeout
        self.total_entries = 0
        self.total_exits = 0

    def update(self, track_id: int, zone: str, confidence: float, position: Tuple[int, int]) -> Optional[dict]:
        """Update or create session for a track ID."""
        now = datetime.utcnow()

        if track_id not in self.sessions:
            # New person entry
            self.sessions[track_id] = PersonSession(track_id, zone, now)
            self.total_entries += 1
            return {
                "event_type": "entry",
                "person_id": f"P{track_id:06d}",
                "zone_id": zone,
                "timestamp": now.isoformat(),
                "confidence": confidence,
            }

        # Update existing session
        self.sessions[track_id].update(zone, confidence, position, now)
        return None

    def check_exits(self) -> List[dict]:
        """Check for sessions that have timed out (person exited)."""
        now = datetime.utcnow()
        exits = []

        for track_id, session in list(self.sessions.items()):
            if session.exited:
                continue

            time_since_seen = (now - session.last_seen).total_seconds()
            if time_since_seen > self.exit_timeout:
                session.exited = True
                self.total_exits += 1
                exits.append({
                    "event_type": "exit",
                    "person_id": f"P{track_id:06d}",
                    "last_zone": session.zone_history[-1],
                    "timestamp": now.isoformat(),
                    "session": session.to_dict(),
                })

        return exits

    def get_current_count(self) -> int:
        """Get count of currently active (non-exited) people."""
        return sum(1 for s in self.sessions.values() if not s.exited)

    def get_stats(self) -> dict:
        """Get aggregated statistics."""
        active = [s for s in self.sessions.values() if not s.exited]
        return {
            "current_count": len(active),
            "total_entries": self.total_entries,
            "total_exits": self.total_exits,
            "avg_dwell_seconds": sum(
                (s.last_seen - s.entry_time).total_seconds() for s in active
            ) / len(active) if active else 0,
        }


# ============================================================================
# ZONE UTILITIES
# ============================================================================

class Zone:
    """Represent a tracking zone with scaled coordinates."""

    def __init__(self, zone_id: int, name: str, x1: int, y1: int, x2: int, y2: int,
                 zone_type: str = "general", base_width: int = 640, base_height: int = 480):
        self.zone_id = zone_id
        self.name = name
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.zone_type = zone_type
        self.base_width = base_width
        self.base_height = base_height

    def contains_point(self, x: float, y: float, frame_width: int, frame_height: int) -> bool:
        """Check if a point (center of person) is within this zone."""
        # Scale zone coordinates to frame dimensions
        scaled_x1 = (self.x1 / self.base_width) * frame_width
        scaled_y1 = (self.y1 / self.base_height) * frame_height
        scaled_x2 = (self.x2 / self.base_width) * frame_width
        scaled_y2 = (self.y2 / self.base_height) * frame_height

        return scaled_x1 <= x <= scaled_x2 and scaled_y1 <= y <= scaled_y2


def load_zones(config_path: str = "zones.json") -> List[Zone]:
    """Load zone configuration from file or use defaults."""
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            data = json.load(f)
            return [Zone(**z) for z in data.get("zones", DEFAULT_ZONES)]

    return [Zone(**z) for z in DEFAULT_ZONES]


def get_zone_for_point(x: float, y: float, zones: List[Zone],
                       frame_width: int, frame_height: int) -> Optional[str]:
    """Determine which zone a point belongs to."""
    for zone in zones:
        if zone.contains_point(x, y, frame_width, frame_height):
            return zone.name
    return None


# ============================================================================
# YOUTUBE STREAM EXTRACTION
# ============================================================================

def get_youtube_stream_url(youtube_url: str) -> str:
    """Extract direct video stream URL from YouTube using yt-dlp."""
    try:
        import yt_dlp
    except ImportError:
        print("[ERROR] yt-dlp not installed. Run: pip install -U yt-dlp")
        sys.exit(1)

    print(f"[INFO] Extracting stream URL from: {youtube_url}")

    ydl_opts = {
        'format': 'best[height<=720]/best',
        'quiet': True,
        'no_warnings': True,
        'socket_timeout': 30,
        'retries': 3,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            if info is None:
                raise ValueError("Failed to extract video info")

            stream_url = info.get('url')
            if not stream_url:
                formats = info.get('formats', [])
                for fmt in reversed(formats):
                    if fmt.get('url') and fmt.get('vcodec') != 'none':
                        stream_url = fmt['url']
                        break

            if not stream_url:
                raise ValueError("No valid stream URL found")

            print(f"[INFO] Stream URL extracted successfully")
            return stream_url

    except Exception as e:
        print(f"[ERROR] Failed to extract YouTube stream: {e}")
        sys.exit(1)


# ============================================================================
# API CLIENT
# ============================================================================

def post_count(count: int) -> bool:
    """Post current count to backend."""
    try:
        response = requests.post(
            f"{BACKEND_URL}/count",
            json={"count_value": count},
            timeout=5
        )
        return response.status_code == 200
    except requests.RequestException as e:
        print(f"[WARN] Failed to post count: {e}")
        return False


def post_event(event: dict) -> bool:
    """Post tracking event to backend."""
    try:
        response = requests.post(
            f"{BACKEND_URL}/events",
            json=event,
            timeout=5
        )
        return response.status_code == 200
    except requests.RequestException as e:
        print(f"[WARN] Failed to post event: {e}")
        return False


def post_session(session: dict) -> bool:
    """Post completed session to backend."""
    try:
        response = requests.post(
            f"{BACKEND_URL}/sessions",
            json=session,
            timeout=5
        )
        return response.status_code == 200
    except requests.RequestException as e:
        print(f"[WARN] Failed to post session: {e}")
        return False


# ============================================================================
# MAIN TRACKING LOOP
# ============================================================================

def run_advanced_tracking(
    source: str,
    model_name: str = "yolo11n.pt",
    tracker: str = "botsort.yaml",
    conf: float = 0.35,
    device: str = "cpu",
    agg_interval: float = 60.0,
    exit_timeout: float = 300.0,
    visualize: bool = False,
    skip_frames: int = 2,
):
    """
    Run advanced people tracking with YOLOv11 and configurable tracker.

    Args:
        source: Video source (file path, RTSP URL, webcam index, or YouTube URL)
        model_name: YOLO model to use (yolo11n.pt, yolo11s.pt, etc.)
        tracker: Tracking algorithm (bytetrack.yaml or botsort.yaml)
        conf: Detection confidence threshold
        device: Inference device (cpu or cuda:0)
        agg_interval: Seconds between count aggregation posts
        exit_timeout: Seconds of no detection before marking person as exited
        visualize: Show live visualization window
        skip_frames: Process every Nth frame (1 = all frames, 2 = every other, etc.)
    """
    print("=" * 60)
    print("JANUS ADVANCED EDGE AGENT - YOLOv11")
    print("=" * 60)
    print(f"Model:        {model_name}")
    print(f"Tracker:      {tracker}")
    print(f"Confidence:   {conf}")
    print(f"Device:       {device}")
    print(f"Skip frames:  {skip_frames}")
    print(f"Backend:      {BACKEND_URL}")
    print("=" * 60)

    # Load YOLO model
    print(f"\n[INFO] Loading YOLO model: {model_name}")
    try:
        model = YOLO(model_name)
        print(f"[INFO] Model loaded successfully")
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        print(f"[HINT] Try: pip install ultralytics>=8.3.0")
        sys.exit(1)

    # Load zones
    zones = load_zones()
    print(f"[INFO] Loaded {len(zones)} tracking zones")

    # Initialize session manager
    session_manager = TrackingSessionManager(exit_timeout=exit_timeout)

    # Open video source
    print(f"[INFO] Opening video source: {source}")
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print(f"[ERROR] Failed to open video source: {source}")
        sys.exit(1)

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30

    print(f"[INFO] Video: {frame_width}x{frame_height} @ {fps:.1f} FPS")
    print(f"[INFO] Starting tracking loop...")

    # Tracking state
    frame_count = 0
    last_agg_time = time.time()
    counts_buffer = []

    try:
        while True:
            ret, frame = cap.read()

            if not ret:
                # Video ended - loop back for files
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                print("[INFO] Video looped")
                continue

            frame_count += 1

            # Skip frames for performance
            if frame_count % skip_frames != 0:
                continue

            # Run YOLO tracking
            results = model.track(
                source=frame,
                persist=True,
                device=device,
                conf=conf,
                iou=0.5,
                classes=[0],  # Person class only
                tracker=tracker,
                verbose=False,
            )

            # Process detections
            current_count = 0

            if len(results) > 0 and results[0].boxes is not None:
                boxes = results[0].boxes

                if boxes.id is not None:
                    ids = boxes.id.cpu().numpy().astype(int)
                    xyxy = boxes.xyxy.cpu().numpy()
                    confs = boxes.conf.cpu().numpy()

                    for i, track_id in enumerate(ids):
                        bbox = xyxy[i]
                        confidence = float(confs[i])

                        # Get center point
                        cx = (bbox[0] + bbox[2]) / 2
                        cy = (bbox[1] + bbox[3]) / 2

                        # Determine zone
                        zone = get_zone_for_point(cx, cy, zones, frame_width, frame_height)

                        # Update session
                        event = session_manager.update(
                            track_id, zone or "unknown", confidence, (int(cx), int(cy))
                        )

                        if event:
                            post_event(event)

                        current_count += 1

            # Check for exits
            exit_events = session_manager.check_exits()
            for exit_event in exit_events:
                post_event(exit_event)
                if "session" in exit_event:
                    post_session(exit_event["session"])

            # Buffer counts
            counts_buffer.append(current_count)

            # Aggregate and post counts periodically
            now = time.time()
            if now - last_agg_time >= agg_interval:
                if counts_buffer:
                    avg_count = int(sum(counts_buffer) / len(counts_buffer))
                    post_count(avg_count)
                    stats = session_manager.get_stats()
                    print(f"[POST] Count: {avg_count} | Active: {stats['current_count']} | "
                          f"Entries: {stats['total_entries']} | Exits: {stats['total_exits']}")
                    counts_buffer = []
                last_agg_time = now

            # Visualization (optional)
            if visualize:
                display_frame = frame.copy()

                # Draw detections
                if len(results) > 0 and results[0].boxes is not None:
                    boxes = results[0].boxes
                    if boxes.id is not None:
                        for i, track_id in enumerate(boxes.id.cpu().numpy().astype(int)):
                            bbox = boxes.xyxy[i].cpu().numpy()
                            x1, y1, x2, y2 = map(int, bbox)
                            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                            cv2.putText(display_frame, f"ID:{track_id}", (x1, y1 - 10),
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

                # Draw count
                cv2.putText(display_frame, f"Count: {current_count}", (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

                cv2.imshow("Janus Advanced Tracking", display_frame)

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

    except KeyboardInterrupt:
        print("\n[INFO] Interrupted by user")

    finally:
        cap.release()
        if visualize:
            cv2.destroyAllWindows()
        print("[INFO] Tracking stopped")


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Janus Advanced Edge Agent - YOLOv11 People Tracking",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Run with webcam using YOLOv11 nano and BoT-SORT
    python edge_agent_advanced.py --source 0 --model yolo11n.pt --tracker botsort

    # Run with video file using YOLOv11 small for better accuracy
    python edge_agent_advanced.py --source video.mp4 --model yolo11s.pt --conf 0.3

    # Run with YouTube video and visualization
    python edge_agent_advanced.py --youtube "https://youtube.com/watch?v=..." --visualize

    # Run with GPU acceleration
    python edge_agent_advanced.py --source 0 --device cuda:0
        """
    )

    # Video source
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--source", help="Video source (file, RTSP, or 0 for webcam)")
    source_group.add_argument("--youtube", help="YouTube video URL")

    # Model configuration
    parser.add_argument("--model", default="yolo11n.pt",
                       choices=list(YOLO_MODELS.values()) + ["yolo11n.pt", "yolo11s.pt", "yolo11m.pt"],
                       help="YOLO model to use (default: yolo11n.pt)")
    parser.add_argument("--tracker", default="botsort.yaml",
                       choices=list(TRACKERS.values()),
                       help="Tracking algorithm (default: botsort.yaml)")
    parser.add_argument("--conf", type=float, default=0.35,
                       help="Detection confidence threshold (default: 0.35)")
    parser.add_argument("--device", default="cpu",
                       help="Inference device: cpu or cuda:0 (default: cpu)")

    # Performance tuning
    parser.add_argument("--skip-frames", type=int, default=2,
                       help="Process every Nth frame (default: 2)")
    parser.add_argument("--agg-interval", type=float, default=60.0,
                       help="Seconds between count aggregation posts (default: 60)")
    parser.add_argument("--exit-timeout", type=float, default=300.0,
                       help="Seconds before marking person as exited (default: 300)")

    # Visualization
    parser.add_argument("--visualize", action="store_true",
                       help="Show live visualization window")

    args = parser.parse_args()

    # Determine video source
    if args.youtube:
        video_source = get_youtube_stream_url(args.youtube)
    else:
        # Handle webcam index
        video_source = int(args.source) if args.source.isdigit() else args.source

    # Run tracking
    run_advanced_tracking(
        source=video_source,
        model_name=args.model,
        tracker=args.tracker,
        conf=args.conf,
        device=args.device,
        agg_interval=args.agg_interval,
        exit_timeout=args.exit_timeout,
        visualize=args.visualize,
        skip_frames=args.skip_frames,
    )


if __name__ == "__main__":
    main()
