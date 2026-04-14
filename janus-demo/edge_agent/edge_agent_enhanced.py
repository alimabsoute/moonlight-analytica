#!/usr/bin/env python3
"""
Enhanced Janus Edge Agent — RF-DETR + Supervision Zones
=======================================================
Tracks people across polygon zones, detects entry/exit via line crossing,
calculates dwell time, and streams events to the backend.

Features:
- RF-DETR detection (Apache 2.0) — transformer-based, global attention
- ByteTrack tracking via Roboflow Trackers (Apache 2.0)
- Polygon zones via Supervision PolygonZone (MIT)
- Entry/exit counting via Supervision LineZone
- Session management with dwell time tracking
- Real-time event streaming to backend
- Zone configuration via JSON file (polygon + line definitions)
- YouTube video support via yt-dlp

Usage:
    python edge_agent_enhanced.py --source 0 --backend http://localhost:8000 --config zones.json
    python edge_agent_enhanced.py --youtube "https://youtube.com/watch?v=..." --backend http://localhost:8000
"""

import argparse
import json
import os
import signal
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, List, Optional

import cv2
import numpy as np
import requests
import supervision as sv
from rfdetr import RFDETRNano
from trackers import ByteTrackTracker

_RUNNING = True

def _handle_sig(signum, frame):
    global _RUNNING
    _RUNNING = False

signal.signal(signal.SIGINT, _handle_sig)
signal.signal(signal.SIGTERM, _handle_sig)


# ── Zone Configuration Loading ───────────────────────────────────────

def load_zones_from_api(backend_url: str, frame_w: int = 640, frame_h: int = 480):
    """
    Fetch zone definitions from the backend API (single source of truth).

    Returns (zones_dict, lines_list) in the same format as load_zone_config.
    Falls back to (None, None) if the backend is unreachable or has no zones with geometry.
    """
    try:
        resp = requests.get(f"{backend_url}/api/zones/config", timeout=5)
        resp.raise_for_status()
        data = resp.json()
        raw_zones = data.get("zones", [])
    except Exception as e:
        print(f"[WARN] Could not fetch zones from API ({e}), falling back to config file")
        return None, None

    zones_with_geo = [z for z in raw_zones if z.get("polygon_image")]
    if not zones_with_geo:
        print("[WARN] API returned no zones with polygon_image geometry, falling back to config file")
        return None, None

    zones = {}
    for z in zones_with_geo:
        name = z.get("zone_name") or z.get("name") or f"zone_{z['id']}"
        pts = np.array(z["polygon_image"], dtype=np.float32)

        # Scale from config resolution (pixel coords assumed at 640×480)
        sx, sy = frame_w / 640, frame_h / 480
        pts[:, 0] *= sx
        pts[:, 1] *= sy
        pts = pts.astype(np.int32)

        polygon_zone = sv.PolygonZone(polygon=pts)
        zones[name] = {
            "zone": polygon_zone,
            "zone_id": z["id"],
            "zone_type": "general",
        }

    print(f"[INFO] Loaded {len(zones)} zones from backend API ({backend_url}/api/zones/config)")
    return zones, []   # no line zones from API yet


def load_zone_config(config_path: str, frame_w: int = 640, frame_h: int = 480):
    """Load zones and lines from JSON config, scaled to frame dimensions."""
    if not os.path.exists(config_path):
        print(f"[WARN] Config not found: {config_path}, using defaults")
        return _default_zones(frame_w, frame_h), _default_lines(frame_w, frame_h)

    try:
        with open(config_path, 'r') as f:
            data = json.load(f)

        ref_w, ref_h = data.get("reference_resolution", [640, 480])
        sx = frame_w / ref_w
        sy = frame_h / ref_h

        zones = {}
        for z in data.get("zones", []):
            name = z["name"]
            # Use polygon if available, otherwise derive from AABB
            if "polygon" in z:
                pts = np.array(z["polygon"], dtype=np.float32)
            else:
                x1, y1, x2, y2 = z["x1"], z["y1"], z["x2"], z["y2"]
                pts = np.array([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], dtype=np.float32)

            # Scale to actual frame
            pts[:, 0] *= sx
            pts[:, 1] *= sy
            pts = pts.astype(np.int32)

            polygon_zone = sv.PolygonZone(polygon=pts)
            zones[name] = {
                "zone": polygon_zone,
                "zone_id": z["zone_id"],
                "zone_type": z.get("zone_type", "general"),
            }

        lines = []
        for ln in data.get("lines", []):
            start = sv.Point(int(ln["start"][0] * sx), int(ln["start"][1] * sy))
            end = sv.Point(int(ln["end"][0] * sx), int(ln["end"][1] * sy))
            line_zone = sv.LineZone(start=start, end=end)
            lines.append({"name": ln["name"], "line": line_zone})

        print(f"[INFO] Loaded {len(zones)} zones, {len(lines)} lines from {config_path}")
        return zones, lines

    except Exception as e:
        print(f"[ERROR] Failed to load config: {e}, using defaults")
        return _default_zones(frame_w, frame_h), _default_lines(frame_w, frame_h)


def _default_zones(frame_w: int, frame_h: int):
    sx, sy = frame_w / 640, frame_h / 480
    defaults = [
        ("entrance", 1, "entrance", [[0, 0], [200, 0], [200, 480], [0, 480]]),
        ("main_floor", 2, "general", [[200, 0], [440, 0], [440, 480], [200, 480]]),
        ("queue", 3, "queue", [[440, 240], [540, 240], [540, 480], [440, 480]]),
        ("checkout", 4, "checkout", [[540, 0], [640, 0], [640, 480], [540, 480]]),
    ]
    zones = {}
    for name, zid, ztype, pts in defaults:
        pts_arr = np.array(pts, dtype=np.float32)
        pts_arr[:, 0] *= sx
        pts_arr[:, 1] *= sy
        polygon_zone = sv.PolygonZone(polygon=pts_arr.astype(np.int32))
        zones[name] = {"zone": polygon_zone, "zone_id": zid, "zone_type": ztype}
    return zones


def _default_lines(frame_w: int, frame_h: int):
    sx, sy = frame_w / 640, frame_h / 480
    start = sv.Point(int(200 * sx), int(0 * sy))
    end = sv.Point(int(200 * sx), int(480 * sy))
    return [{"name": "entry_line", "line": sv.LineZone(start=start, end=end)}]


# ── Homography / World-Coordinate Helpers ────────────────────────────

def load_calibration_from_api(backend_url: str, camera_id: str = "cam_0"):
    """
    Fetch the H matrix for camera_id from the backend calibration API.

    Returns numpy 3×3 H array, or None if not available (uncalibrated).
    """
    try:
        resp = requests.get(f"{backend_url}/api/calibration/{camera_id}", timeout=5)
        if resp.status_code == 200:
            h_list = resp.json().get("h_matrix")
            if h_list:
                H = np.array(h_list, dtype=np.float64)
                print(f"[INFO] Loaded calibration for '{camera_id}' from backend API")
                return H
    except Exception as e:
        print(f"[WARN] Could not load calibration from API: {e}")
    print(f"[WARN] No calibration found for '{camera_id}' — world_x/world_y will be null")
    return None


def project_to_world(H: Optional[np.ndarray], px: float, py: float):
    """
    Project pixel foot-point (px, py) to world coords using homography H.

    Returns (world_x, world_y) in metres, or (None, None) if uncalibrated.
    """
    if H is None:
        return None, None
    pt_h = H @ np.array([px, py, 1.0])
    return float(pt_h[0] / pt_h[2]), float(pt_h[1] / pt_h[2])


# ── Event Posting ────────────────────────────────────────────────────

def post_event(backend_url: str, event_type: str, person_id: str,
               zone_id: Optional[int] = None, direction: Optional[str] = None,
               world_x: Optional[float] = None, world_y: Optional[float] = None):
    try:
        requests.post(f"{backend_url}/events", json={
            "event_type": event_type,
            "person_id": person_id,
            "zone_id": zone_id,
            "direction": direction,
            "confidence": 1.0,
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "world_x": world_x,
            "world_y": world_y,
        }, timeout=2)
    except Exception:
        pass


def post_session(backend_url: str, person_id: str, entry_time: datetime,
                 exit_time: datetime, zone_history: list, converted: bool):
    dwell = int((exit_time - entry_time).total_seconds())
    try:
        requests.post(f"{backend_url}/sessions", json={
            "person_id": person_id,
            "entry_time": entry_time.isoformat(timespec="seconds"),
            "exit_time": exit_time.isoformat(timespec="seconds"),
            "dwell_seconds": dwell,
            "zone_path": json.dumps(zone_history),
            "converted": 1 if converted else 0,
        }, timeout=2)
    except Exception:
        pass


# ── YouTube Helper ───────────────────────────────────────────────────

def get_youtube_stream_url(youtube_url: str) -> str:
    try:
        import yt_dlp
    except ImportError:
        print("[ERROR] yt-dlp not installed. Run: pip install yt-dlp")
        sys.exit(1)

    ydl_opts = {'format': 'best[height<=720]', 'quiet': True, 'no_warnings': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            return info['url']
    except Exception as e:
        print(f"[ERROR] Failed to extract YouTube URL: {e}")
        sys.exit(1)


# ── Main Pipeline ────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Enhanced edge tracker with RF-DETR + Supervision zones")

    source_group = p.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--source", help="Video source (rtsp://, file path, or 0 for webcam)")
    source_group.add_argument("--youtube", help="YouTube video URL")

    p.add_argument("--backend", default=os.getenv("JANUS_BACKEND", "http://localhost:8000"))
    p.add_argument("--config", default="zones.json", help="Zone configuration file")
    p.add_argument("--camera-id", default="cam_0", help="Camera ID for calibration lookup")
    p.add_argument("--conf", type=float, default=0.40, help="Detection confidence")
    p.add_argument("--timeout", type=int, default=30, help="Person exit timeout in seconds")
    args = p.parse_args()

    # Determine video source
    if args.youtube:
        print(f"[INFO] Processing YouTube video: {args.youtube}")
        video_source = get_youtube_stream_url(args.youtube)
    else:
        video_source = int(args.source) if args.source.isdigit() else args.source

    # Open video to get dimensions
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        print(f"[ERROR] Failed to open: {video_source}")
        sys.exit(1)

    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    print(f"[enhanced_edge_agent] Starting...")
    print(f"  Source: {args.youtube or args.source}")
    print(f"  Resolution: {frame_w}x{frame_h} @ {fps:.1f} FPS")
    print(f"  Backend: {args.backend}")

    # Load zones: prefer backend API (single source of truth), fall back to config file
    zones, lines = load_zones_from_api(args.backend, frame_w, frame_h)
    if zones is None:
        zones, lines = load_zone_config(args.config, frame_w, frame_h)
    for name, z in zones.items():
        print(f"  Zone: {name} [{z['zone_type']}]")

    # Load homography calibration for world-coordinate projection
    H_matrix = load_calibration_from_api(args.backend, args.camera_id)

    # Initialize detection + tracking
    model = RFDETRNano()
    tracker = ByteTrackTracker(
        lost_track_buffer=int(fps * 3),
        minimum_consecutive_frames=3,
    )
    print("[INFO] RF-DETR-Nano + ByteTrack initialized")

    # Session tracking state
    sessions: Dict[int, dict] = {}  # tracker_id -> {entry_time, zone_history, converted}
    last_cleanup = time.time()
    cleanup_interval = 10

    try:
        while _RUNNING:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            timestamp = datetime.now(timezone.utc)

            # 1. Detect with RF-DETR
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            detections = model.predict(rgb, threshold=args.conf)

            # Filter to person class only (class_id 1 in RF-DETR's COCO map)
            if detections.class_id is not None and len(detections) > 0:
                detections.data.pop("source_image", None)
                detections.data.pop("source_shape", None)
                detections = detections[detections.class_id == 1]

            # 2. Track with ByteTrack
            detections = tracker.update(detections)

            # 3. Zone analytics
            for name, z_info in zones.items():
                z_info["zone"].trigger(detections)

            # 4. Line crossing (entry/exit)
            for ln in lines:
                ln["line"].trigger(detections)

            # 5. Session tracking
            if detections.tracker_id is not None:
                active_ids = set()
                for i, track_id in enumerate(detections.tracker_id):
                    track_id = int(track_id)
                    active_ids.add(track_id)

                    # Determine zone from bottom-center anchor
                    feet = detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
                    fx, fy = feet[i]
                    world_x, world_y = project_to_world(H_matrix, fx, fy)
                    current_zone = None
                    for name, z_info in zones.items():
                        poly = z_info["zone"].polygon
                        if cv2.pointPolygonTest(poly.astype(np.float32), (float(fx), float(fy)), False) >= 0:
                            current_zone = name
                            break

                    person_id = f"P{track_id:06d}"

                    if track_id not in sessions:
                        sessions[track_id] = {
                            "entry_time": timestamp,
                            "last_seen": timestamp,
                            "zone_history": [current_zone] if current_zone else [],
                            "converted": False,
                        }
                        if current_zone:
                            post_event(args.backend, "entry", person_id,
                                       zones[current_zone]["zone_id"], "in",
                                       world_x, world_y)
                            print(f"[ENTRY] {person_id} -> {current_zone}")
                    else:
                        sess = sessions[track_id]
                        sess["last_seen"] = timestamp
                        old_zone = sess["zone_history"][-1] if sess["zone_history"] else None
                        if current_zone and current_zone != old_zone:
                            if current_zone not in sess["zone_history"]:
                                sess["zone_history"].append(current_zone)
                            post_event(args.backend, "zone_change", person_id,
                                       zones[current_zone]["zone_id"], "lateral",
                                       world_x, world_y)
                            print(f"[ZONE_CHANGE] {person_id}: {old_zone} -> {current_zone}")

                        # Check conversion
                        if current_zone and zones.get(current_zone, {}).get("zone_type") == "checkout":
                            sess["converted"] = True

            # 6. Cleanup inactive sessions
            now = time.time()
            if now - last_cleanup >= cleanup_interval:
                to_remove = []
                for tid, sess in sessions.items():
                    elapsed = (timestamp - sess["last_seen"]).total_seconds()
                    if elapsed > args.timeout:
                        person_id = f"P{tid:06d}"
                        post_session(args.backend, person_id, sess["entry_time"],
                                     sess["last_seen"], sess["zone_history"], sess["converted"])
                        post_event(args.backend, "exit", person_id, None, "out")
                        dwell = int((sess["last_seen"] - sess["entry_time"]).total_seconds())
                        print(f"[EXIT] {person_id} | Dwell: {dwell}s | Zones: {' -> '.join(filter(None, sess['zone_history']))}")
                        to_remove.append(tid)

                for tid in to_remove:
                    del sessions[tid]

                last_cleanup = now
                active = len(sessions)
                print(f"[STATUS] Active: {active} | Line in: {lines[0]['line'].in_count if lines else 0} out: {lines[0]['line'].out_count if lines else 0}")

    except KeyboardInterrupt:
        print("\n[INFO] Shutting down...")
    finally:
        # Final cleanup — close all sessions
        timestamp = datetime.now(timezone.utc)
        for tid, sess in sessions.items():
            person_id = f"P{tid:06d}"
            post_session(args.backend, person_id, sess["entry_time"],
                         timestamp, sess["zone_history"], sess["converted"])
        cap.release()
        print(f"[FINAL] Total sessions: {len(sessions)}")


if __name__ == "__main__":
    main()
