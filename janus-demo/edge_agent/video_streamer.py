#!/usr/bin/env python3
"""
Video Streamer with Full Tracking Pipeline
===========================================
Streams video frames with bounding boxes, zone overlays, and session
analytics via HTTP. Uses a separate inference server for detection and
supervision ByteTrack for tracking.

Architecture:
    Inference Server (:8002) → Detection (bboxes)
    video_streamer.py (:8001) → ByteTrack → Re-ID → Zones → Sessions → MJPEG

Phases implemented:
    2. ByteTrack people counting with persistent track IDs
    3. Zone-based occupancy counting
    4. Entry/exit detection + session lifecycle
    5. Re-ID integration for identity persistence through occlusion
    6. Per-zone dwell time tracking
    7. Conversion tracking (visited checkout zone)

Usage:
    python video_streamer.py --source video.mp4 --port 8001
    python video_streamer.py --youtube "URL" --port 8001
"""

import argparse
import base64
import json
import os
import sys
import time
from typing import Dict, List, Optional

import cv2
import numpy as np
import requests
import supervision as sv
from flask import Flask, Response, jsonify
from flask_cors import CORS

from path_utils import normalize_video_path, paths_equal
from reid_manager import ReIDManager

# Load .env file if present (no extra dependency)
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

app = Flask(__name__)
CORS(app)

# ── Configuration ─────────────────────────────────────────────────────

# Inference mode: "cloud" (Roboflow API) or "local" (inference server on :8002)
INFERENCE_MODE = os.environ.get("INFERENCE_MODE", "cloud")
INFERENCE_URL = os.environ.get("INFERENCE_URL", "http://localhost:8002")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

# Roboflow cloud settings
ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY", "")
ROBOFLOW_MODEL = os.environ.get("ROBOFLOW_MODEL", "people-detection-o4rdr/4")

DETECTION_CONF = 0.30           # Lower than before (was 0.35) to catch more people
EXIT_TIMEOUT_S = 30             # Seconds before a lost track becomes an exit (was 300s)
REID_SIMILARITY = 0.5           # Re-ID cosine similarity threshold
REID_MAX_LOST_S = 10.0          # Keep lost tracks in Re-ID gallery for 10s
POST_INTERVAL_S = 5.0           # How often to post counts to backend

# ── Global state ──────────────────────────────────────────────────────

current_frame = None
tracked_boxes = []              # [{track_id, bbox, confidence, zone}]
zones = []
current_source = None
new_source = None
# Model switching (proxied to inference server)
current_model = "yolo11s.pt"
new_model = None
AVAILABLE_MODELS = ["yolov8n.pt", "yolo11n.pt", "yolo11s.pt", "yolo11m.pt"]
# Tracker is now managed locally (ByteTrack via supervision)
current_tracker = "bytetrack"

# Session & analytics state (updated by tracking thread, read by API)
session_stats = {
    "total_visitors": 0,
    "peak_occupancy": 0,
    "current_occupancy": 0,
    "total_entries": 0,
    "total_exits": 0,
    "total_sessions": 0,
    "total_reids": 0,
    "avg_dwell_s": 0,
    "conversions": 0,
}


# ── Zone class ────────────────────────────────────────────────────────

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
        self.color = self.get_color()

    def get_color(self):
        colors = {
            'entrance': (76, 175, 80),
            'checkout': (244, 67, 54),
            'queue': (255, 152, 0),
            'general': (33, 150, 243),
        }
        return colors.get(self.zone_type, (100, 100, 100))


def load_zones(config_path: str = "zones.json") -> List[Zone]:
    """Load zone configuration."""
    if not os.path.exists(config_path):
        return [
            Zone(1, "entrance", 0, 0, 200, 480, "entrance"),
            Zone(2, "main_floor", 200, 0, 440, 480, "general"),
            Zone(3, "queue", 440, 240, 540, 480, "queue"),
            Zone(4, "checkout", 540, 0, 640, 480, "checkout"),
        ]
    with open(config_path, 'r') as f:
        data = json.load(f)
    return [Zone(**z) for z in data.get("zones", [])]


# ── PersonSession (Phase 4 + 6 + 7) ──────────────────────────────────

class PersonSession:
    """Tracks a single person's journey through the scene."""

    def __init__(self, track_id: int, entry_time: float, entry_zone: str = ""):
        self.track_id = track_id
        self.entry_time = entry_time
        self.last_seen = entry_time
        self.zone_history: List[str] = []       # Ordered list of zones visited
        self.zone_dwell: Dict[str, float] = {}  # {zone_name: seconds_spent}
        self.current_zone: str = ""
        self.zone_enter_time: float = entry_time
        self.converted: bool = False

        if entry_zone:
            self.zone_history.append(entry_zone)
            self.current_zone = entry_zone
            self.zone_dwell[entry_zone] = 0.0

    def update_zone(self, zone_name: str, now: float):
        """Update zone tracking for this person."""
        if zone_name == self.current_zone:
            # Still in same zone — accumulate dwell
            self.zone_dwell[zone_name] = self.zone_dwell.get(zone_name, 0) + (now - self.last_seen)
        else:
            # Zone transition
            if self.current_zone:
                self.zone_dwell[self.current_zone] = (
                    self.zone_dwell.get(self.current_zone, 0) + (now - self.zone_enter_time)
                )
            self.current_zone = zone_name
            self.zone_enter_time = now
            if zone_name and zone_name not in self.zone_history:
                self.zone_history.append(zone_name)
            self.zone_dwell.setdefault(zone_name, 0.0)

        # Check conversion (Phase 7)
        if zone_name == "checkout":
            self.converted = True

        self.last_seen = now

    def finalize(self, exit_time: float) -> dict:
        """Finalize session when person exits."""
        # Close out current zone dwell
        if self.current_zone:
            self.zone_dwell[self.current_zone] = (
                self.zone_dwell.get(self.current_zone, 0) + (exit_time - self.zone_enter_time)
            )
        dwell_s = exit_time - self.entry_time
        return {
            "person_id": self.track_id,
            "entry_time": self.entry_time,
            "exit_time": exit_time,
            "dwell_seconds": round(dwell_s, 1),
            "zone_path": self.zone_history,
            "zone_dwell": {k: round(v, 1) for k, v in self.zone_dwell.items()},
            "converted": 1 if self.converted else 0,
        }


# ── SessionManager ────────────────────────────────────────────────────

class SessionManager:
    """Manages all active person sessions and posts events to backend."""

    def __init__(self, backend_url: str, exit_timeout: float = 30.0):
        self.backend_url = backend_url
        self.exit_timeout = exit_timeout
        self.sessions: Dict[int, PersonSession] = {}    # {track_id: PersonSession}
        self.completed: List[dict] = []                  # Completed session records
        self.total_visitors = 0
        self.total_entries = 0
        self.total_exits = 0
        self.total_conversions = 0
        self.peak_occupancy = 0
        self._last_post_time = time.time()

    def on_track_active(self, track_id: int, zone_name: str, now: float):
        """Called for every active track each frame."""
        if track_id not in self.sessions:
            # New person — entry event (Phase 4)
            self.sessions[track_id] = PersonSession(track_id, now, zone_name)
            self.total_visitors += 1
            self.total_entries += 1
            self._post_event("entry", track_id, zone_name)
        else:
            # Update existing session zone tracking (Phase 6)
            session = self.sessions[track_id]
            old_zone = session.current_zone
            session.update_zone(zone_name, now)
            if old_zone and zone_name != old_zone:
                self._post_event("zone_change", track_id, zone_name)

        # Update peak
        current = len(self.sessions)
        if current > self.peak_occupancy:
            self.peak_occupancy = current

    def check_exits(self, active_ids: set, now: float):
        """Check for exited people (not seen for exit_timeout)."""
        exited = []
        for tid, session in list(self.sessions.items()):
            if tid not in active_ids and (now - session.last_seen) > self.exit_timeout:
                exited.append(tid)

        for tid in exited:
            session = self.sessions.pop(tid)
            record = session.finalize(session.last_seen)
            self.completed.append(record)
            self.total_exits += 1
            if record["converted"]:
                self.total_conversions += 1
            self._post_event("exit", tid, session.current_zone)
            self._post_session(record)

    def periodic_post_counts(self, count: int, now: float):
        """Post count to backend periodically."""
        if now - self._last_post_time >= POST_INTERVAL_S:
            self._last_post_time = now
            try:
                requests.post(
                    f"{self.backend_url}/count",
                    json={"count_value": count},
                    timeout=2,
                )
            except Exception:
                pass

    def _post_event(self, event_type: str, person_id: int, zone: str):
        """Post tracking event to backend."""
        try:
            requests.post(
                f"{self.backend_url}/events",
                json={
                    "event_type": event_type,
                    "person_id": person_id,
                    "zone": zone,
                },
                timeout=2,
            )
        except Exception:
            pass

    def _post_session(self, record: dict):
        """Post completed session to backend."""
        try:
            requests.post(
                f"{self.backend_url}/sessions",
                json=record,
                timeout=2,
            )
        except Exception:
            pass

    def get_stats(self) -> dict:
        """Get session statistics."""
        dwell_times = [s["dwell_seconds"] for s in self.completed]
        avg_dwell = sum(dwell_times) / len(dwell_times) if dwell_times else 0
        return {
            "total_visitors": self.total_visitors,
            "peak_occupancy": self.peak_occupancy,
            "current_occupancy": len(self.sessions),
            "total_entries": self.total_entries,
            "total_exits": self.total_exits,
            "total_sessions": len(self.completed),
            "conversions": self.total_conversions,
            "avg_dwell_s": round(avg_dwell, 1),
        }


# ── Detection (Cloud or Local) ────────────────────────────────────────

def detect_via_roboflow(frame: np.ndarray) -> List[dict]:
    """Send frame to Roboflow cloud API for person detection.

    Returns list of {bbox: [x1,y1,x2,y2], confidence: float}.
    """
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    img_b64 = base64.b64encode(buffer.tobytes()).decode("utf-8")

    conf_pct = int(DETECTION_CONF * 100)  # Roboflow expects 0-100
    url = f"https://detect.roboflow.com/{ROBOFLOW_MODEL}"
    params = {
        "api_key": ROBOFLOW_API_KEY,
        "confidence": conf_pct,
        "overlap": 50,
    }

    try:
        resp = requests.post(
            url, params=params, data=img_b64,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        if resp.status_code != 200:
            print(f"[WARN] Roboflow API error {resp.status_code}: {resp.text[:200]}")
            return []

        data = resp.json()
        detections = []
        for pred in data.get("predictions", []):
            # Filter for person class (Roboflow returns class name)
            cls = pred.get("class", "").lower()
            if cls not in ("person", "people", "human", "pedestrian"):
                continue
            # Convert center+size to x1,y1,x2,y2
            cx, cy = pred["x"], pred["y"]
            w, h = pred["width"], pred["height"]
            detections.append({
                "bbox": [int(cx - w / 2), int(cy - h / 2),
                         int(cx + w / 2), int(cy + h / 2)],
                "confidence": round(float(pred["confidence"]), 4),
            })
        return detections

    except Exception as e:
        print(f"[WARN] Roboflow API error: {e}")
        return []


def detect_via_server(frame: np.ndarray) -> List[dict]:
    """Send frame to local inference server and get detections.

    Returns list of {bbox: [x1,y1,x2,y2], confidence: float}.
    """
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    try:
        resp = requests.post(
            f"{INFERENCE_URL}/detect",
            files={"file": ("frame.jpg", buffer.tobytes(), "image/jpeg")},
            params={"conf": DETECTION_CONF},
            timeout=5,
        )
        if resp.status_code == 200:
            return resp.json().get("detections", [])
    except Exception as e:
        print(f"[WARN] Inference server error: {e}")
    return []


def detect(frame: np.ndarray) -> List[dict]:
    """Run detection using configured mode (cloud or local)."""
    if INFERENCE_MODE == "cloud":
        return detect_via_roboflow(frame)
    else:
        return detect_via_server(frame)


def wait_for_detection_ready(timeout: float = 30):
    """Verify detection is working (cloud or local)."""
    if INFERENCE_MODE == "cloud":
        if not ROBOFLOW_API_KEY:
            print("[ERROR] ROBOFLOW_API_KEY not set. Add it to .env file.")
            return False
        print(f"[INFO] Using Roboflow cloud inference (model: {ROBOFLOW_MODEL})")
        # Quick test with a small dummy image
        dummy = np.zeros((100, 100, 3), dtype=np.uint8)
        try:
            detect_via_roboflow(dummy)
            print("[INFO] Roboflow API connection verified")
            return True
        except Exception as e:
            print(f"[ERROR] Roboflow API test failed: {e}")
            return False
    else:
        print(f"[INFO] Using local inference server at {INFERENCE_URL}")
        start = time.time()
        while time.time() - start < timeout:
            try:
                r = requests.get(f"{INFERENCE_URL}/health", timeout=3)
                if r.status_code == 200 and r.json().get("status") == "ready":
                    model = r.json().get("model", "unknown")
                    print(f"[INFO] Inference server ready (model: {model})")
                    return True
            except Exception:
                pass
            time.sleep(2)
        print(f"[ERROR] Inference server not ready after {timeout}s")
        return False


# ── YouTube helper ────────────────────────────────────────────────────

def get_youtube_stream_url(youtube_url: str) -> str:
    """Extract direct video stream URL from YouTube."""
    try:
        import yt_dlp
    except ImportError:
        print("[ERROR] yt-dlp not installed. Run: pip install -U yt-dlp")
        sys.exit(1)

    print(f"[INFO] Extracting stream URL from: {youtube_url}")
    ydl_opts = {
        'format': 'best[height<=720]/best',
        'quiet': False,
        'no_warnings': False,
        'socket_timeout': 30,
        'retries': 3,
        'extractor_retries': 3,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            if info is None:
                print("[ERROR] Failed to extract video info")
                sys.exit(1)
            stream_url = info.get('url')
            if not stream_url:
                formats = info.get('formats', [])
                for fmt in reversed(formats):
                    if fmt.get('url') and fmt.get('vcodec') != 'none':
                        stream_url = fmt['url']
                        break
            if not stream_url:
                print("[ERROR] No valid stream URL found")
                sys.exit(1)
            print("[INFO] Stream URL extracted successfully")
            return stream_url
    except Exception as e:
        print(f"[ERROR] Failed to extract YouTube stream: {e}")
        sys.exit(1)


# ── Drawing helpers ───────────────────────────────────────────────────

def get_color_for_track_id(track_id):
    """Generate unique color for each track ID."""
    colors = [
        (255, 0, 0), (0, 255, 0), (0, 0, 255),
        (255, 255, 0), (255, 0, 255), (0, 255, 255),
        (255, 128, 0), (128, 0, 255), (0, 255, 128),
        (255, 0, 128), (128, 255, 0), (0, 128, 255),
    ]
    return colors[track_id % len(colors)]


def check_person_in_zone(bbox, zone, frame_width, frame_height):
    """Check if person's center point is inside a zone."""
    person_x = (bbox[0] + bbox[2]) / 2
    person_y = (bbox[1] + bbox[3]) / 2
    zone_x1 = (zone.x1 / 640) * frame_width
    zone_y1 = (zone.y1 / 480) * frame_height
    zone_x2 = (zone.x2 / 640) * frame_width
    zone_y2 = (zone.y2 / 480) * frame_height
    return zone_x1 <= person_x <= zone_x2 and zone_y1 <= person_y <= zone_y2


def find_zone_for_person(bbox, zones_list, frame_width, frame_height) -> str:
    """Return the zone name a person is in, or empty string."""
    for zone in zones_list:
        if check_person_in_zone(bbox, zone, frame_width, frame_height):
            return zone.name
    return ""


def draw_tracking_overlay(frame, boxes_data, zones_list, stats=None):
    """Draw bounding boxes, zones, and stats on frame."""
    overlay = frame.copy()
    frame_height, frame_width = frame.shape[:2]

    # Scale zones to frame dimensions
    scaled_zones = []
    for zone in zones_list:
        sx1 = int((zone.x1 / 640) * frame_width)
        sy1 = int((zone.y1 / 480) * frame_height)
        sx2 = int((zone.x2 / 640) * frame_width)
        sy2 = int((zone.y2 / 480) * frame_height)
        scaled_zones.append((zone, sx1, sy1, sx2, sy2))

    # Draw zones with transparency
    for zone, x1, y1, x2, y2 in scaled_zones:
        cv2.rectangle(overlay, (x1, y1), (x2, y2), zone.color, -1)
        cv2.rectangle(frame, (x1, y1), (x2, y2), zone.color, 3)
        cv2.putText(frame, zone.name.upper(), (x1 + 10, y1 + 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.addWeighted(overlay, 0.15, frame, 0.85, 0, frame)

    # Zone counts
    zone_counts = {zone.name: 0 for zone, *_ in scaled_zones}
    zone_counts["no_zone"] = 0

    # Draw bounding boxes
    for box in boxes_data:
        x1, y1, x2, y2 = box['bbox']
        track_id = box['track_id']
        zone_name = box.get('zone', '')
        color = get_color_for_track_id(track_id)

        if zone_name:
            zone_counts[zone_name] = zone_counts.get(zone_name, 0) + 1
        else:
            zone_counts["no_zone"] += 1

        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 3)

        label = f"ID:{track_id}"
        if zone_name:
            label += f" | {zone_name.upper()}"
        label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
        cv2.rectangle(frame, (int(x1), int(y1) - 30),
                      (int(x1) + label_size[0] + 10, int(y1)), color, -1)
        cv2.putText(frame, label, (int(x1) + 5, int(y1) - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # Stats panel (top-left)
    active_zones = [n for n, c in zone_counts.items() if c > 0]
    panel_lines = 1 + len(active_zones)
    if stats:
        panel_lines += 3
    box_h = 10 + panel_lines * 18
    cv2.rectangle(frame, (5, 5), (220, box_h), (0, 0, 0), -1)

    y_pos = 18
    cv2.putText(frame, f"PEOPLE: {len(boxes_data)}", (10, y_pos),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
    y_pos += 18

    for zn in active_zones:
        cv2.putText(frame, f"{zn.upper()}: {zone_counts[zn]}", (10, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        y_pos += 18

    if stats:
        cv2.putText(frame, f"VISITORS: {stats.get('total_visitors', 0)}", (10, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        y_pos += 18
        cv2.putText(frame, f"REIDS: {stats.get('total_reids', 0)}", (10, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 200), 1)
        y_pos += 18
        cv2.putText(frame, f"DWELL: {stats.get('avg_dwell_s', 0):.0f}s", (10, y_pos),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 255), 1)

    return frame


# ── MJPEG streaming ───────────────────────────────────────────────────

def generate_frames():
    """Generate video frames with tracking overlays."""
    global current_frame, tracked_boxes, zones, session_stats

    while True:
        if current_frame is not None:
            frame_with_overlay = draw_tracking_overlay(
                current_frame.copy(), tracked_boxes, zones, session_stats
            )
            ret, buffer = cv2.imencode('.jpg', frame_with_overlay,
                                       [cv2.IMWRITE_JPEG_QUALITY, 85])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' +
                       buffer.tobytes() + b'\r\n')
        time.sleep(0.03)


# ── Flask routes ──────────────────────────────────────────────────────

@app.route('/video_feed')
def video_feed():
    """Video streaming route."""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/health')
def health():
    """Health check."""
    return jsonify({"status": "ok", "streaming": current_frame is not None})


@app.route('/switch', methods=['POST', 'GET'])
def switch_video():
    """Switch to a different video source."""
    global new_source, current_source
    from flask import request

    source = (request.args.get('source') or
              (request.json.get('source') if request.is_json else None))
    if not source:
        return jsonify({"error": "Missing 'source' parameter"}), 400

    try:
        normalized_source = normalize_video_path(source)
    except (ValueError, OSError) as e:
        return jsonify({"error": f"Invalid path: {str(e)}"}), 400

    if not os.path.exists(normalized_source):
        return jsonify({"error": f"Video file not found: {normalized_source}"}), 404

    print(f"[INFO] Switching to new video source: {normalized_source}")
    new_source = normalized_source
    return jsonify({"ok": True, "source": normalized_source, "previous": current_source})


@app.route('/model', methods=['POST', 'GET'])
def switch_model():
    """Switch YOLO model (proxied to inference server)."""
    global new_model, current_model
    from flask import request

    if request.method == 'GET' and not request.args.get('model'):
        return jsonify({"current": current_model, "available": AVAILABLE_MODELS})

    model_name = (request.args.get('model') or
                  (request.json.get('model') if request.is_json else None))
    if not model_name:
        return jsonify({"error": "Missing 'model' parameter"}), 400
    if model_name not in AVAILABLE_MODELS:
        return jsonify({"error": f"Unknown model: {model_name}"}), 400

    # Proxy to inference server
    try:
        r = requests.post(f"{INFERENCE_URL}/model",
                          json={"model": model_name}, timeout=30)
        if r.status_code == 200:
            current_model = model_name
            return jsonify({"ok": True, "model": model_name})
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({"error": f"Inference server error: {e}"}), 502


@app.route('/tracker', methods=['POST', 'GET'])
def switch_tracker():
    """Get tracker info (ByteTrack is now the only tracker, managed locally)."""
    return jsonify({
        "current": current_tracker,
        "available": ["bytetrack"],
        "note": "Tracking is now handled by supervision ByteTrack locally"
    })


@app.route('/settings', methods=['GET'])
def get_settings():
    """Get current settings."""
    return jsonify({
        "model": current_model,
        "tracker": current_tracker,
        "source": current_source,
        "available_models": AVAILABLE_MODELS,
        "available_trackers": ["bytetrack"],
        "inference_server": INFERENCE_URL,
    })


@app.route('/stats', methods=['GET'])
def get_stats():
    """Get session and tracking statistics."""
    return jsonify(session_stats)


@app.route('/kpis', methods=['GET'])
def get_kpis():
    """Get real-time KPIs from the tracking pipeline."""
    return jsonify(session_stats)


# ── Main tracking loop (Phases 2-7 combined) ─────────────────────────

def run_tracking(source, conf=0.30, backend_url="http://localhost:8000"):
    """Main tracking loop: detect → track → Re-ID → zones → sessions.

    Args:
        source: Video source (file path, RTSP, or webcam index)
        conf: Detection confidence threshold
        backend_url: Backend API URL for posting events/sessions
    """
    global current_frame, tracked_boxes, zones, current_source, new_source
    global current_model, new_model, session_stats

    # Wait for detection to be ready (cloud or local)
    if not wait_for_detection_ready(timeout=30):
        print("[ERROR] Detection not available. Check .env or inference server.")
        return

    # Initialize ByteTrack (Phase 2)
    byte_tracker = sv.ByteTrack(
        track_activation_threshold=0.5,
        lost_track_buffer=90,               # 3 seconds at 30fps
        minimum_matching_threshold=0.8,
        frame_rate=30,
    )
    print("[INFO] ByteTrack initialized (buffer=90 frames, thresh=0.5)")

    # Initialize Re-ID Manager (Phase 5)
    reid = ReIDManager(
        similarity_threshold=REID_SIMILARITY,
        max_lost_age=int(REID_MAX_LOST_S * 30),  # 300 frames
        gallery_size=100,
    )
    print(f"[INFO] Re-ID initialized (threshold={REID_SIMILARITY}, gallery_timeout={REID_MAX_LOST_S}s)")

    # Initialize Session Manager (Phase 4)
    session_mgr = SessionManager(backend_url, exit_timeout=EXIT_TIMEOUT_S)

    # Open video source
    current_source = normalize_video_path(source)
    print(f"[INFO] Starting tracking on: {current_source}")
    cap = cv2.VideoCapture(current_source)

    if not cap.isOpened():
        print(f"[ERROR] Failed to open video source: {source}")
        return

    print("[INFO] Video opened. Tracking pipeline active.")
    print(f"[INFO] Pipeline: Detect({INFERENCE_URL}) -> ByteTrack -> Re-ID -> Zones -> Sessions")

    frame_num = 0
    prev_track_ids: set = set()

    while True:
        now = time.time()

        # ── Video source switching ────────────────────────────────
        if new_source is not None and not paths_equal(new_source, current_source):
            normalized = normalize_video_path(new_source)
            print(f"[INFO] Switching source: {current_source} → {normalized}")
            new_cap = cv2.VideoCapture(normalized)
            time.sleep(0.1)
            if new_cap.isOpened():
                cap.release()
                cap = new_cap
                current_source = normalized
                byte_tracker = sv.ByteTrack(
                    track_activation_threshold=0.5,
                    lost_track_buffer=90,
                    minimum_matching_threshold=0.8,
                    frame_rate=30,
                )
                frame_num = 0
                prev_track_ids.clear()
                print(f"[INFO] Now playing: {current_source}")
            else:
                new_cap.release()
                print(f"[ERROR] Failed to open: {normalized}")
            new_source = None

        # ── Model switching (proxied to inference server) ─────────
        if new_model is not None and new_model != current_model:
            try:
                r = requests.post(f"{INFERENCE_URL}/model",
                                  json={"model": new_model}, timeout=30)
                if r.status_code == 200:
                    current_model = new_model
                    print(f"[INFO] Model switched to: {current_model}")
            except Exception as e:
                print(f"[WARN] Model switch failed: {e}")
            new_model = None

        # ── Read frame ────────────────────────────────────────────
        ret, frame = cap.read()
        if not ret:
            print("[INFO] Video ended, looping...")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            frame_num = 0
            byte_tracker = sv.ByteTrack(
                track_activation_threshold=0.5,
                lost_track_buffer=90,
                minimum_matching_threshold=0.8,
                frame_rate=30,
            )
            prev_track_ids.clear()
            continue

        current_frame = frame
        frame_num += 1
        frame_h, frame_w = frame.shape[:2]

        # ── Phase 2: Detect via inference server ──────────────────
        raw_detections = detect(frame)

        if not raw_detections:
            # No detections — check exits and continue
            session_mgr.check_exits(set(), now)
            session_mgr.periodic_post_counts(0, now)
            session_stats = {**session_mgr.get_stats(), "total_reids": reid.stats["total_reids"]}
            continue

        # Build supervision Detections object
        bboxes = np.array([d["bbox"] for d in raw_detections], dtype=np.float32)
        confs = np.array([d["confidence"] for d in raw_detections], dtype=np.float32)

        detections = sv.Detections(
            xyxy=bboxes,
            confidence=confs,
        )

        # ── Phase 2: ByteTrack assigns track IDs ─────────────────
        tracked = byte_tracker.update_with_detections(detections)

        # ── Phase 5: Re-ID for identity persistence ──────────────
        current_track_ids = set()
        result_boxes = []

        if tracked.tracker_id is not None and len(tracked.tracker_id) > 0:
            for i, tracker_id in enumerate(tracked.tracker_id):
                tracker_id = int(tracker_id)
                bbox = tracked.xyxy[i].tolist()
                conf = float(tracked.confidence[i]) if tracked.confidence is not None else 0.5

                # Re-ID check for NEW tracks
                if tracker_id not in prev_track_ids:
                    original_id = reid.try_reidentify(frame, bbox, tracker_id, frame_num)
                    if original_id is not None:
                        tracker_id = original_id

                # Register/update in Re-ID gallery
                reid.register_track(tracker_id, frame, bbox, conf, frame_num)
                current_track_ids.add(tracker_id)

                # ── Phase 3: Zone assignment ──────────────────────
                zone_name = find_zone_for_person(bbox, zones, frame_w, frame_h)

                # ── Phase 4+6: Session & zone dwell tracking ─────
                session_mgr.on_track_active(tracker_id, zone_name, now)

                result_boxes.append({
                    'track_id': tracker_id,
                    'bbox': [int(b) for b in bbox],
                    'confidence': conf,
                    'zone': zone_name,
                })

        # Mark lost tracks in Re-ID gallery
        lost_ids = prev_track_ids - current_track_ids
        for lost_id in lost_ids:
            reid.mark_lost(lost_id, frame_num)

        prev_track_ids = current_track_ids

        # ── Phase 4: Check for exits ──────────────────────────────
        session_mgr.check_exits(current_track_ids, now)

        # ── Post counts periodically ──────────────────────────────
        session_mgr.periodic_post_counts(len(result_boxes), now)

        # ── Update global state for MJPEG stream ──────────────────
        tracked_boxes = result_boxes
        session_stats = {
            **session_mgr.get_stats(),
            "total_reids": reid.stats["total_reids"],
        }


# ── Main entry point ─────────────────────────────────────────────────

def main():
    import threading

    p = argparse.ArgumentParser(description="Video streamer with full tracking pipeline")

    source_group = p.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--source", help="Video source (file, rtsp://, or 0 for webcam)")
    source_group.add_argument("--youtube", help="YouTube video URL")

    p.add_argument("--port", type=int, default=8001, help="HTTP server port")
    p.add_argument("--config", default="zones.json", help="Zone configuration file")
    p.add_argument("--conf", type=float, default=0.30, help="Detection confidence")
    p.add_argument("--mode", choices=["cloud", "local"], default=None,
                    help="Detection mode: cloud (Roboflow) or local (inference server)")
    p.add_argument("--inference-url", default="http://localhost:8002",
                    help="Local inference server URL (only used in local mode)")
    p.add_argument("--backend-url", default="http://localhost:8000",
                    help="Backend API URL")
    p.add_argument("--exit-timeout", type=float, default=30.0,
                    help="Seconds before lost track counts as exit")
    args = p.parse_args()

    # Set globals from args (CLI args override .env)
    global INFERENCE_MODE, INFERENCE_URL, BACKEND_URL, DETECTION_CONF, EXIT_TIMEOUT_S
    if args.mode:
        INFERENCE_MODE = args.mode
    INFERENCE_URL = args.inference_url
    BACKEND_URL = args.backend_url
    DETECTION_CONF = args.conf
    EXIT_TIMEOUT_S = args.exit_timeout

    # Load zones
    global zones
    zones = load_zones(args.config)
    print(f"[INFO] Loaded {len(zones)} zones")

    # Determine video source
    if args.youtube:
        print(f"[INFO] Processing YouTube video: {args.youtube}")
        video_source = get_youtube_stream_url(args.youtube)
    else:
        video_source = args.source

    # Start tracking in background thread
    tracking_thread = threading.Thread(
        target=run_tracking,
        args=(video_source, args.conf, args.backend_url),
        daemon=True,
    )
    tracking_thread.start()

    # Start Flask server
    print(f"[INFO] Starting video server on http://0.0.0.0:{args.port}")
    print(f"[INFO] Stream URL: http://localhost:{args.port}/video_feed")
    app.run(host="0.0.0.0", port=args.port, debug=False, threaded=True)


if __name__ == "__main__":
    main()
