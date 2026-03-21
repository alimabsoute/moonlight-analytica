#!/usr/bin/env python3
"""
Offline Video Processing Pipeline (Roboflow Cloud)
===================================================
Pre-processes video files using Roboflow cloud API for detection
and local ByteTrack for tracking. Outputs tracking JSON for
zero-compute replay in the frontend.

Architecture:
    Video → Extract frames (every Nth) → Roboflow Cloud API → ByteTrack → JSON

Usage:
    python process_video.py --source video_library/57bf97a9.mp4
    python process_video.py --source video_library/57bf97a9.mp4 --skip 5
    python process_video.py --source video_library/57bf97a9.mp4 --model coco/9
"""

import argparse
import base64
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import cv2
import numpy as np
import requests
import supervision as sv

# Load .env file if present
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

# Roboflow config
ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY", "")
ROBOFLOW_MODEL = os.environ.get("ROBOFLOW_MODEL", "people-detection-o4rdr/4")
DETECTION_CONF = 0.30

# Progress file for backend polling
_progress = {"video_id": "", "status": "idle", "frame": 0, "total": 0, "percent": 0}


def get_progress_path(video_id: str) -> str:
    """Get path to progress file for a video."""
    return os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "video_library", f"{video_id}_progress.json")


def write_progress(video_id: str, frame: int, total: int, status: str = "processing"):
    """Write progress to a JSON file for backend polling."""
    progress = {
        "video_id": video_id,
        "status": status,
        "frame": frame,
        "total": total,
        "percent": round((frame / total) * 100, 1) if total > 0 else 0,
    }
    path = get_progress_path(video_id)
    try:
        with open(path, "w") as f:
            json.dump(progress, f)
    except Exception:
        pass


# ── Zone configuration (reused from video_streamer.py) ───────────────

class Zone:
    def __init__(self, zone_id: int, name: str, x1: int, y1: int,
                 x2: int, y2: int, zone_type: str = "general"):
        self.zone_id = zone_id
        self.name = name
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.zone_type = zone_type


def load_zones(config_path: str = "zones.json") -> List[Zone]:
    """Load zone configuration."""
    full_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), config_path)
    if not os.path.exists(full_path):
        return [
            Zone(1, "entrance", 0, 0, 200, 480, "entrance"),
            Zone(2, "main_floor", 200, 0, 440, 480, "general"),
            Zone(3, "queue", 440, 240, 540, 480, "queue"),
            Zone(4, "checkout", 540, 0, 640, 480, "checkout"),
        ]
    with open(full_path, "r") as f:
        data = json.load(f)
    return [Zone(**z) for z in data.get("zones", [])]


def find_zone_for_point(cx: float, cy: float, zones: List[Zone],
                        frame_w: int, frame_h: int) -> str:
    """Return zone name for a center point."""
    for zone in zones:
        zx1 = (zone.x1 / 640) * frame_w
        zy1 = (zone.y1 / 480) * frame_h
        zx2 = (zone.x2 / 640) * frame_w
        zy2 = (zone.y2 / 480) * frame_h
        if zx1 <= cx <= zx2 and zy1 <= cy <= zy2:
            return zone.name
    return ""


# ── Roboflow cloud detection ─────────────────────────────────────────

def detect_via_roboflow(frame: np.ndarray, model: str = None,
                        api_key: str = None) -> List[dict]:
    """Send frame to Roboflow cloud API for person detection."""
    model = model or ROBOFLOW_MODEL
    api_key = api_key or ROBOFLOW_API_KEY

    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    img_b64 = base64.b64encode(buffer.tobytes()).decode("utf-8")

    url = f"https://detect.roboflow.com/{model}"
    params = {
        "api_key": api_key,
        "confidence": int(DETECTION_CONF * 100),
        "overlap": 50,
    }

    try:
        resp = requests.post(
            url, params=params, data=img_b64,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        if resp.status_code != 200:
            print(f"  [WARN] Roboflow API {resp.status_code}: {resp.text[:100]}")
            return []

        detections = []
        for pred in resp.json().get("predictions", []):
            cls = pred.get("class", "").lower()
            if cls not in ("person", "people", "human", "pedestrian"):
                continue
            cx, cy = pred["x"], pred["y"]
            w, h = pred["width"], pred["height"]
            detections.append({
                "bbox": [int(cx - w / 2), int(cy - h / 2),
                         int(cx + w / 2), int(cy + h / 2)],
                "confidence": round(float(pred["confidence"]), 4),
            })
        return detections

    except Exception as e:
        print(f"  [WARN] Roboflow error: {e}")
        return []


# ── Interpolation for skipped frames ─────────────────────────────────

def interpolate_detections(prev_dets: List[dict], next_dets: List[dict],
                           alpha: float) -> List[dict]:
    """Linearly interpolate bounding boxes between two detection sets.

    Matches detections by track ID. alpha=0 gives prev, alpha=1 gives next.
    """
    if not prev_dets:
        return next_dets if alpha > 0.5 else []
    if not next_dets:
        return prev_dets if alpha < 0.5 else []

    # Build lookup by ID
    next_by_id = {d["id"]: d for d in next_dets if "id" in d}
    prev_by_id = {d["id"]: d for d in prev_dets if "id" in d}

    result = []
    all_ids = set(prev_by_id.keys()) | set(next_by_id.keys())

    for tid in all_ids:
        p = prev_by_id.get(tid)
        n = next_by_id.get(tid)

        if p and n:
            # Interpolate bbox
            bbox = [
                int(p["bbox"][i] * (1 - alpha) + n["bbox"][i] * alpha)
                for i in range(4)
            ]
            result.append({
                "id": tid,
                "bbox": bbox,
                "confidence": round(p["confidence"] * (1 - alpha) + n["confidence"] * alpha, 4),
                "zone": n["zone"] if alpha > 0.5 else p["zone"],
            })
        elif p and alpha < 0.7:
            result.append(p)
        elif n and alpha > 0.3:
            result.append(n)

    return result


# ── Session tracker (lightweight, offline version) ────────────────────

class OfflineSessionTracker:
    """Tracks entries, exits, dwell time, and zone visits offline."""

    def __init__(self, exit_timeout_frames: int = 90):
        self.exit_timeout = exit_timeout_frames  # frames before exit
        self.sessions: Dict[int, dict] = {}  # {id: session_data}
        self.completed: List[dict] = []
        self.total_entries = 0
        self.total_exits = 0
        self.peak_occupancy = 0

    def update(self, frame_num: int, timestamp_ms: float,
               detections: List[dict]):
        """Process detections for one frame."""
        active_ids = set()

        for det in detections:
            tid = det.get("id")
            if tid is None:
                continue
            active_ids.add(tid)
            zone = det.get("zone", "")

            if tid not in self.sessions:
                # New entry
                self.sessions[tid] = {
                    "entry_frame": frame_num,
                    "entry_ms": timestamp_ms,
                    "last_frame": frame_num,
                    "last_ms": timestamp_ms,
                    "zones_visited": [zone] if zone else [],
                    "current_zone": zone,
                    "converted": False,
                }
                self.total_entries += 1
            else:
                sess = self.sessions[tid]
                sess["last_frame"] = frame_num
                sess["last_ms"] = timestamp_ms
                if zone and zone != sess["current_zone"]:
                    if zone not in sess["zones_visited"]:
                        sess["zones_visited"].append(zone)
                    sess["current_zone"] = zone
                if zone == "checkout":
                    sess["converted"] = True

        # Check exits
        exited = []
        for tid, sess in list(self.sessions.items()):
            if tid not in active_ids:
                if frame_num - sess["last_frame"] > self.exit_timeout:
                    exited.append(tid)

        for tid in exited:
            sess = self.sessions.pop(tid)
            dwell_ms = sess["last_ms"] - sess["entry_ms"]
            self.completed.append({
                "id": tid,
                "entry_ms": sess["entry_ms"],
                "exit_ms": sess["last_ms"],
                "dwell_s": round(dwell_ms / 1000, 1),
                "zones": sess["zones_visited"],
                "converted": sess["converted"],
            })
            self.total_exits += 1

        # Update peak
        current = len(self.sessions)
        if current > self.peak_occupancy:
            self.peak_occupancy = current

    def finalize(self, final_frame: int, final_ms: float):
        """Close out remaining sessions at end of video."""
        for tid, sess in list(self.sessions.items()):
            dwell_ms = sess["last_ms"] - sess["entry_ms"]
            self.completed.append({
                "id": tid,
                "entry_ms": sess["entry_ms"],
                "exit_ms": sess["last_ms"],
                "dwell_s": round(dwell_ms / 1000, 1),
                "zones": sess["zones_visited"],
                "converted": sess["converted"],
            })
            self.total_exits += 1
        self.sessions.clear()

    def get_metrics(self) -> dict:
        """Compute aggregate metrics."""
        dwell_times = [s["dwell_s"] for s in self.completed]
        avg_dwell = sum(dwell_times) / len(dwell_times) if dwell_times else 0

        zone_counts: Dict[str, dict] = {}
        for s in self.completed:
            for z in s["zones"]:
                if z not in zone_counts:
                    zone_counts[z] = {"visits": 0, "entries": 0}
                zone_counts[z]["visits"] += 1
            if s["zones"]:
                first = s["zones"][0]
                zone_counts[first]["entries"] = zone_counts[first].get("entries", 0) + 1

        return {
            "total_entries": self.total_entries,
            "total_exits": self.total_exits,
            "peak_occupancy": self.peak_occupancy,
            "avg_dwell_time_s": round(avg_dwell, 1),
            "total_conversions": sum(1 for s in self.completed if s["converted"]),
            "zones": zone_counts,
        }


# ── Main processing pipeline ─────────────────────────────────────────

def process_video(source: str, skip: int = 3, model: str = None,
                  output_dir: str = None, zones_config: str = "zones.json"):
    """Process a video file using Roboflow cloud + local ByteTrack.

    Args:
        source: Path to video file
        skip: Process every Nth frame (1=all, 3=every 3rd)
        model: Roboflow model ID override
        output_dir: Output directory (default: same as video)
        zones_config: Zone configuration file
    """
    if not os.path.exists(source):
        print(f"[ERROR] Video not found: {source}")
        return None

    if not ROBOFLOW_API_KEY:
        print("[ERROR] ROBOFLOW_API_KEY not set. Add it to .env file.")
        return None

    # Derive video ID from filename
    video_id = Path(source).stem
    model = model or ROBOFLOW_MODEL

    # Open video
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open video: {source}")
        return None

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration_s = total_frames / fps

    print(f"[INFO] Processing: {source}")
    print(f"[INFO] Frames: {total_frames} | FPS: {fps:.1f} | Duration: {duration_s:.1f}s")
    print(f"[INFO] Resolution: {width}x{height}")
    print(f"[INFO] Model: {model} | Skip: every {skip} frame(s)")
    print(f"[INFO] API calls needed: ~{total_frames // skip}")

    # Initialize ByteTrack
    byte_tracker = sv.ByteTrack(
        track_activation_threshold=0.4,
        lost_track_buffer=90,
        minimum_matching_threshold=0.8,
        frame_rate=int(fps),
    )

    # Load zones
    zones = load_zones(zones_config)
    print(f"[INFO] Loaded {len(zones)} zones")

    # Session tracker
    session_tracker = OfflineSessionTracker(exit_timeout_frames=int(fps * 10))

    # Storage
    frames_data = []
    api_calls = 0
    start_time = time.time()
    last_detected_dets = []  # Last detected frame's results (with IDs)

    # Write initial progress
    write_progress(video_id, 0, total_frames, "processing")

    frame_num = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        timestamp_ms = round((frame_num / fps) * 1000, 1)
        is_detection_frame = (frame_num % skip == 0)

        if is_detection_frame:
            # ── Call Roboflow API ──────────────────────────────
            raw_dets = detect_via_roboflow(frame, model)
            api_calls += 1

            if raw_dets:
                # Build supervision Detections for ByteTrack
                bboxes = np.array([d["bbox"] for d in raw_dets], dtype=np.float32)
                confs = np.array([d["confidence"] for d in raw_dets], dtype=np.float32)
                sv_dets = sv.Detections(xyxy=bboxes, confidence=confs)

                # ByteTrack assigns persistent IDs
                tracked = byte_tracker.update_with_detections(sv_dets)

                frame_dets = []
                if tracked.tracker_id is not None and len(tracked.tracker_id) > 0:
                    for i, tid in enumerate(tracked.tracker_id):
                        bbox = tracked.xyxy[i].tolist()
                        conf = float(tracked.confidence[i]) if tracked.confidence is not None else 0.5
                        cx = (bbox[0] + bbox[2]) / 2
                        cy = (bbox[1] + bbox[3]) / 2
                        zone = find_zone_for_point(cx, cy, zones, width, height)
                        frame_dets.append({
                            "id": int(tid),
                            "bbox": [int(b) for b in bbox],
                            "confidence": round(conf, 4),
                            "zone": zone,
                        })

                last_detected_dets = frame_dets
            else:
                # No detections — feed empty to tracker
                sv_dets = sv.Detections(
                    xyxy=np.empty((0, 4), dtype=np.float32),
                    confidence=np.empty(0, dtype=np.float32),
                )
                byte_tracker.update_with_detections(sv_dets)
                last_detected_dets = []
                frame_dets = []

            frames_data.append({
                "frame": frame_num,
                "timestamp_ms": timestamp_ms,
                "detections": frame_dets,
            })

            # Update session tracker
            session_tracker.update(frame_num, timestamp_ms, frame_dets)

            # Log progress
            if api_calls % 10 == 0:
                elapsed = time.time() - start_time
                rate = api_calls / elapsed if elapsed > 0 else 0
                print(f"  Frame {frame_num}/{total_frames} "
                      f"({frame_num/total_frames*100:.0f}%) | "
                      f"{api_calls} API calls | {rate:.1f} calls/s | "
                      f"{len(frame_dets)} people")

        else:
            # ── Interpolate for skipped frames ────────────────
            # Use last known detections (no API call)
            frames_data.append({
                "frame": frame_num,
                "timestamp_ms": timestamp_ms,
                "detections": last_detected_dets,  # Carry forward
            })
            session_tracker.update(frame_num, timestamp_ms, last_detected_dets)

        # Update progress file
        if frame_num % 30 == 0:
            write_progress(video_id, frame_num, total_frames)

        frame_num += 1

    cap.release()

    # Finalize sessions
    final_ms = round((frame_num / fps) * 1000, 1)
    session_tracker.finalize(frame_num, final_ms)

    elapsed = time.time() - start_time
    metrics = session_tracker.get_metrics()

    # Build output JSON
    tracking_data = {
        "video_id": video_id,
        "source_path": os.path.abspath(source),
        "total_frames": frame_num,
        "fps": round(fps, 2),
        "duration_s": round(duration_s, 1),
        "resolution": [width, height],
        "model": model,
        "frame_skip": skip,
        "api_calls": api_calls,
        "processing_time_s": round(elapsed, 1),
        "processed_at": datetime.now(timezone.utc).isoformat(timespec="seconds") + "Z",
        "metrics": metrics,
        "sessions": session_tracker.completed,
        "frames": frames_data,
    }

    # Save output
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(source))
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, f"{video_id}_tracking.json")
    with open(output_path, "w") as f:
        json.dump(tracking_data, f, separators=(",", ":"))

    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)

    # Write completion progress
    write_progress(video_id, frame_num, total_frames, "completed")

    print(f"\n{'='*60}")
    print(f"[DONE] Processing complete!")
    print(f"  Output: {output_path} ({file_size_mb:.1f} MB)")
    print(f"  Frames: {frame_num} | API calls: {api_calls}")
    print(f"  Time: {elapsed:.1f}s ({api_calls/elapsed:.1f} calls/s)")
    print(f"  Entries: {metrics['total_entries']} | Exits: {metrics['total_exits']}")
    print(f"  Peak occupancy: {metrics['peak_occupancy']}")
    print(f"  Avg dwell: {metrics['avg_dwell_time_s']}s")
    print(f"  Conversions: {metrics['total_conversions']}")
    print(f"{'='*60}")

    return output_path


# ── CLI ───────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(
        description="Process video with Roboflow cloud detection + ByteTrack tracking"
    )
    p.add_argument("--source", required=True, help="Video file path")
    p.add_argument("--skip", type=int, default=3,
                   help="Process every Nth frame (default: 3)")
    p.add_argument("--model", default=None,
                   help=f"Roboflow model (default: {ROBOFLOW_MODEL})")
    p.add_argument("--output-dir", default=None,
                   help="Output directory (default: same as video)")
    p.add_argument("--zones", default="zones.json",
                   help="Zone config file")
    p.add_argument("--conf", type=float, default=0.30,
                   help="Detection confidence threshold")
    args = p.parse_args()

    global DETECTION_CONF
    DETECTION_CONF = args.conf

    result = process_video(
        source=args.source,
        skip=args.skip,
        model=args.model,
        output_dir=args.output_dir,
        zones_config=args.zones,
    )

    if result is None:
        sys.exit(1)


if __name__ == "__main__":
    main()
