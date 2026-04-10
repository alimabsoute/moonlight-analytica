#!/usr/bin/env python3
"""
Video Streamer — RF-DETR + Supervision Pipeline
================================================
Streams video frames with bounding boxes, zone overlays, trajectory trails,
and session analytics via HTTP. Detection runs in-process (no inference server).

Architecture:
    RF-DETR-Nano → ByteTrack → Re-ID → Supervision Zones → Sessions → MJPEG

Features:
    - RF-DETR-Nano detection (Apache 2.0, transformer-based)
    - ByteTrack tracking via Roboflow Trackers (Apache 2.0)
    - Supervision PolygonZone occupancy + LineZone entry/exit
    - Supervision annotators (boxes, traces, zones, heatmaps)
    - Re-ID integration for identity persistence through occlusion
    - Per-zone dwell time tracking + conversion detection
    - MJPEG streaming + REST API for stats

Usage:
    python video_streamer.py --source video.mp4 --port 8001
    python video_streamer.py --youtube "URL" --port 8001
"""

import argparse
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
from rfdetr import RFDETRNano
from trackers import ByteTrackTracker

from path_utils import normalize_video_path, paths_equal
from reid_manager import ReIDManager

# Load .env file if present
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

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
DETECTION_CONF = 0.40
EXIT_TIMEOUT_S = 30
REID_SIMILARITY = 0.5
REID_MAX_LOST_S = 10.0
POST_INTERVAL_S = 5.0

# ── Global state ──────────────────────────────────────────────────────

current_frame = None
tracked_boxes = []
zone_data = {}
line_data = []
current_source = None
new_source = None
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


# ── Zone Configuration ───────────────────────────────────────────────

def load_zone_config(config_path: str, frame_w: int = 640, frame_h: int = 480):
    """Load zones and lines from JSON config, scaled to frame dimensions."""
    if not os.path.exists(config_path):
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
            if "polygon" in z:
                pts = np.array(z["polygon"], dtype=np.float32)
            else:
                x1, y1, x2, y2 = z["x1"], z["y1"], z["x2"], z["y2"]
                pts = np.array([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], dtype=np.float32)
            pts[:, 0] *= sx
            pts[:, 1] *= sy
            polygon_zone = sv.PolygonZone(polygon=pts.astype(np.int32))
            zones[name] = {
                "zone": polygon_zone,
                "zone_id": z["zone_id"],
                "zone_type": z.get("zone_type", "general"),
                "color": _zone_color(z.get("zone_type", "general")),
            }

        lines = []
        for ln in data.get("lines", []):
            start = sv.Point(int(ln["start"][0] * sx), int(ln["start"][1] * sy))
            end = sv.Point(int(ln["end"][0] * sx), int(ln["end"][1] * sy))
            lines.append({"name": ln["name"], "line": sv.LineZone(start=start, end=end)})

        return zones, lines
    except Exception as e:
        print(f"[ERROR] Failed to load zones: {e}")
        return _default_zones(frame_w, frame_h), _default_lines(frame_w, frame_h)


def _zone_color(zone_type: str) -> sv.Color:
    colors = {
        'entrance': sv.Color(76, 175, 80),
        'checkout': sv.Color(244, 67, 54),
        'queue': sv.Color(255, 152, 0),
        'general': sv.Color(33, 150, 243),
    }
    return colors.get(zone_type, sv.Color(100, 100, 100))


def _default_zones(frame_w, frame_h):
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
        zones[name] = {"zone": polygon_zone, "zone_id": zid, "zone_type": ztype,
                        "color": _zone_color(ztype)}
    return zones


def _default_lines(frame_w, frame_h):
    sx, sy = frame_w / 640, frame_h / 480
    start = sv.Point(int(200 * sx), int(0 * sy))
    end = sv.Point(int(200 * sx), int(480 * sy))
    return [{"name": "entry_line", "line": sv.LineZone(start=start, end=end)}]


# ── Session Manager ──────────────────────────────────────────────────

class SessionManager:
    """Lightweight session tracking using tracker IDs and zone detection."""

    def __init__(self, backend_url: str, exit_timeout: float = 30.0):
        self.backend_url = backend_url
        self.exit_timeout = exit_timeout
        self.sessions: Dict[int, dict] = {}
        self.completed: List[dict] = []
        self.total_visitors = 0
        self.total_entries = 0
        self.total_exits = 0
        self.total_conversions = 0
        self.peak_occupancy = 0
        self._last_post_time = time.time()

    def on_track_active(self, track_id: int, zone_name: str, now: float):
        if track_id not in self.sessions:
            self.sessions[track_id] = {
                "entry_time": now,
                "last_seen": now,
                "zone_history": [zone_name] if zone_name else [],
                "zone_enter_time": now,
                "current_zone": zone_name,
                "zone_dwell": {zone_name: 0.0} if zone_name else {},
                "converted": False,
            }
            self.total_visitors += 1
            self.total_entries += 1
            self._post_event("entry", track_id, zone_name)
        else:
            sess = self.sessions[track_id]
            old_zone = sess["current_zone"]
            if zone_name != old_zone:
                # Close dwell on old zone
                if old_zone:
                    sess["zone_dwell"][old_zone] = sess["zone_dwell"].get(old_zone, 0) + (now - sess["zone_enter_time"])
                sess["current_zone"] = zone_name
                sess["zone_enter_time"] = now
                if zone_name and zone_name not in sess["zone_history"]:
                    sess["zone_history"].append(zone_name)
                sess["zone_dwell"].setdefault(zone_name, 0.0)
                if old_zone and zone_name != old_zone:
                    self._post_event("zone_change", track_id, zone_name)
            else:
                # Accumulate dwell in current zone
                if zone_name:
                    sess["zone_dwell"][zone_name] = sess["zone_dwell"].get(zone_name, 0) + (now - sess["last_seen"])

            if zone_name == "checkout":
                sess["converted"] = True
            sess["last_seen"] = now

        current = len(self.sessions)
        if current > self.peak_occupancy:
            self.peak_occupancy = current

    def check_exits(self, active_ids: set, now: float):
        exited = []
        for tid, sess in list(self.sessions.items()):
            if tid not in active_ids and (now - sess["last_seen"]) > self.exit_timeout:
                exited.append(tid)

        for tid in exited:
            sess = self.sessions.pop(tid)
            # Close current zone dwell
            if sess["current_zone"]:
                sess["zone_dwell"][sess["current_zone"]] = (
                    sess["zone_dwell"].get(sess["current_zone"], 0) + (sess["last_seen"] - sess["zone_enter_time"])
                )
            dwell_s = sess["last_seen"] - sess["entry_time"]
            record = {
                "person_id": tid,
                "entry_time": sess["entry_time"],
                "exit_time": sess["last_seen"],
                "dwell_seconds": round(dwell_s, 1),
                "zone_path": sess["zone_history"],
                "zone_dwell": {k: round(v, 1) for k, v in sess["zone_dwell"].items()},
                "converted": 1 if sess["converted"] else 0,
            }
            self.completed.append(record)
            self.total_exits += 1
            if record["converted"]:
                self.total_conversions += 1
            self._post_event("exit", tid, sess["current_zone"])
            self._post_session(record)

    def periodic_post_counts(self, count: int, now: float):
        if now - self._last_post_time >= POST_INTERVAL_S:
            self._last_post_time = now
            try:
                requests.post(f"{self.backend_url}/count",
                              json={"count_value": count}, timeout=2)
            except Exception:
                pass

    def _post_event(self, event_type: str, person_id: int, zone: str):
        try:
            requests.post(f"{self.backend_url}/events", json={
                "event_type": event_type, "person_id": person_id, "zone": zone,
            }, timeout=2)
        except Exception:
            pass

    def _post_session(self, record: dict):
        try:
            requests.post(f"{self.backend_url}/sessions", json=record, timeout=2)
        except Exception:
            pass

    def get_stats(self) -> dict:
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


# ── YouTube helper ───────────────────────────────────────────────────

def get_youtube_stream_url(youtube_url: str) -> str:
    try:
        import yt_dlp
    except ImportError:
        print("[ERROR] yt-dlp not installed. Run: pip install -U yt-dlp")
        sys.exit(1)

    print(f"[INFO] Extracting stream URL from: {youtube_url}")
    ydl_opts = {
        'format': 'best[height<=720]/best',
        'quiet': False, 'no_warnings': False,
        'socket_timeout': 30, 'retries': 3,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            if info is None:
                print("[ERROR] Failed to extract video info")
                sys.exit(1)
            stream_url = info.get('url')
            if not stream_url:
                for fmt in reversed(info.get('formats', [])):
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


# ── Zone point test helper ───────────────────────────────────────────

def find_zone_for_point(x: float, y: float, zones: dict) -> str:
    """Return the zone name containing (x, y), or empty string."""
    for name, z_info in zones.items():
        poly = z_info["zone"].polygon
        if cv2.pointPolygonTest(poly.astype(np.float32), (float(x), float(y)), False) >= 0:
            return name
    return ""


# ── MJPEG streaming ──────────────────────────────────────────────────

def generate_frames():
    global current_frame, tracked_boxes, zone_data, session_stats
    while True:
        if current_frame is not None:
            frame = current_frame.copy()
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' +
                       buffer.tobytes() + b'\r\n')
        time.sleep(0.03)


# ── Flask routes ─────────────────────────────────────────────────────

@app.route('/')
def index():
    viewer_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'viewer.html')
    if os.path.exists(viewer_path):
        with open(viewer_path, 'r', encoding='utf-8') as f:
            return f.read()
    return '<html><body><img src="/video_feed" style="width:100%"/></body></html>'


@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/health')
def health():
    return jsonify({"status": "ok", "streaming": current_frame is not None})


@app.route('/switch', methods=['POST', 'GET'])
def switch_video():
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

    new_source = normalized_source
    return jsonify({"ok": True, "source": normalized_source, "previous": current_source})


@app.route('/settings', methods=['GET'])
def get_settings():
    return jsonify({
        "model": "rf-detr-nano",
        "tracker": "bytetrack",
        "source": current_source,
        "available_models": ["rf-detr-nano"],
        "available_trackers": ["bytetrack"],
    })


@app.route('/stats', methods=['GET'])
def get_stats():
    return jsonify(session_stats)


@app.route('/kpis', methods=['GET'])
def get_kpis():
    return jsonify(session_stats)


# ── Main tracking loop ───────────────────────────────────────────────

def run_tracking(source, conf=0.40, backend_url="http://localhost:8000",
                 zone_config="zones.json"):
    """Main loop: RF-DETR detect → ByteTrack → Re-ID → Zones → Sessions."""
    global current_frame, tracked_boxes, zone_data, line_data
    global current_source, new_source, session_stats

    # Initialize RF-DETR
    model = RFDETRNano()
    print("[INFO] RF-DETR-Nano loaded")

    # Initialize ByteTrack
    tracker = ByteTrackTracker(
        lost_track_buffer=90,
        minimum_consecutive_frames=3,
    )
    print("[INFO] ByteTrack initialized")

    # Initialize Re-ID
    reid = ReIDManager(
        similarity_threshold=REID_SIMILARITY,
        max_lost_age=int(REID_MAX_LOST_S * 30),
        gallery_size=100,
    )
    print(f"[INFO] Re-ID initialized (threshold={REID_SIMILARITY})")

    # Initialize Session Manager
    session_mgr = SessionManager(backend_url, exit_timeout=EXIT_TIMEOUT_S)

    # Open video
    current_source = normalize_video_path(source)
    cap = cv2.VideoCapture(current_source)
    if not cap.isOpened():
        print(f"[ERROR] Failed to open video source: {source}")
        return

    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
    video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_time_s = 1.0 / video_fps

    # Load zones
    zone_data, line_data = load_zone_config(zone_config, frame_w, frame_h)
    print(f"[INFO] Loaded {len(zone_data)} zones, {len(line_data)} lines (video {video_fps:.0f} FPS)")

    # Supervision annotators
    box_ann = sv.BoxAnnotator(thickness=2)
    label_ann = sv.LabelAnnotator(text_position=sv.Position.TOP_LEFT)
    trace_ann = sv.TraceAnnotator(trace_length=90, thickness=2)

    print("[INFO] Tracking pipeline active")
    print("[INFO] Pipeline: RF-DETR -> ByteTrack -> Re-ID -> Zones -> Sessions")

    frame_num = 0
    prev_track_ids: set = set()
    last_iter_start = time.time()

    while True:
        iter_start = time.time()
        now = iter_start

        # Real-time playback: skip video frames to match wall-clock pacing.
        # If last iteration took 330ms and video is 30 FPS, skip ~9 frames.
        iter_elapsed = iter_start - last_iter_start
        frames_to_skip = max(0, int(iter_elapsed / frame_time_s) - 1)
        for _ in range(frames_to_skip):
            if not cap.grab():
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                break
        last_iter_start = iter_start

        # Video source switching
        if new_source is not None and not paths_equal(new_source, current_source):
            normalized = normalize_video_path(new_source)
            new_cap = cv2.VideoCapture(normalized)
            time.sleep(0.1)
            if new_cap.isOpened():
                cap.release()
                cap = new_cap
                current_source = normalized
                frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
                frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
                zone_data, line_data = load_zone_config(zone_config, frame_w, frame_h)
                tracker = ByteTrackTracker(lost_track_buffer=90, minimum_consecutive_frames=3)
                frame_num = 0
                prev_track_ids.clear()
                print(f"[INFO] Switched to: {current_source}")
            else:
                new_cap.release()
                print(f"[ERROR] Failed to open: {normalized}")
            new_source = None

        # Read frame
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            frame_num = 0
            tracker = ByteTrackTracker(lost_track_buffer=90, minimum_consecutive_frames=3)
            prev_track_ids.clear()
            continue

        frame_num += 1

        # 1. Detect with RF-DETR
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        detections = model.predict(rgb, threshold=conf)

        # Filter to person class (class_id 1 in RF-DETR's COCO map)
        if detections.class_id is not None and len(detections) > 0:
            detections.data.pop("source_image", None)
            detections.data.pop("source_shape", None)
            detections = detections[detections.class_id == 1]

        if len(detections) == 0:
            session_mgr.check_exits(set(), now)
            session_mgr.periodic_post_counts(0, now)
            session_stats = {**session_mgr.get_stats(), "total_reids": reid.stats["total_reids"]}
            current_frame = frame
            continue

        # 2. Track with ByteTrack
        detections = tracker.update(detections)

        # 3. Re-ID + Zone + Session
        current_track_ids = set()
        result_boxes = []

        if detections.tracker_id is not None and len(detections.tracker_id) > 0:
            feet = detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)

            for i, tracker_id in enumerate(detections.tracker_id):
                tracker_id = int(tracker_id)
                bbox = detections.xyxy[i].tolist()
                det_conf = float(detections.confidence[i]) if detections.confidence is not None else 0.5

                # Re-ID check for new tracks
                if tracker_id not in prev_track_ids:
                    original_id = reid.try_reidentify(frame, bbox, tracker_id, frame_num)
                    if original_id is not None:
                        tracker_id = original_id

                reid.register_track(tracker_id, frame, bbox, det_conf, frame_num)
                current_track_ids.add(tracker_id)

                # Zone assignment
                fx, fy = feet[i]
                zone_name = find_zone_for_point(fx, fy, zone_data)

                # Session tracking
                session_mgr.on_track_active(tracker_id, zone_name, now)

                result_boxes.append({
                    'track_id': tracker_id,
                    'bbox': [int(b) for b in bbox],
                    'confidence': det_conf,
                    'zone': zone_name,
                })

        # Mark lost tracks
        lost_ids = prev_track_ids - current_track_ids
        for lost_id in lost_ids:
            reid.mark_lost(lost_id, frame_num)
        prev_track_ids = current_track_ids

        # Line crossing
        for ln in line_data:
            ln["line"].trigger(detections)

        # Check exits + post counts
        session_mgr.check_exits(current_track_ids, now)
        session_mgr.periodic_post_counts(len(result_boxes), now)

        # 4. Annotate frame with Supervision
        labels = [f"ID:{b['track_id']} {b['zone'].upper()}" if b['zone'] else f"ID:{b['track_id']}"
                  for b in result_boxes]
        annotated = box_ann.annotate(scene=frame.copy(), detections=detections)
        annotated = label_ann.annotate(scene=annotated, detections=detections, labels=labels)
        annotated = trace_ann.annotate(scene=annotated, detections=detections)

        # Draw zone overlays
        for name, z_info in zone_data.items():
            poly = z_info["zone"].polygon
            color = z_info["color"]
            overlay = annotated.copy()
            cv2.fillPoly(overlay, [poly], (color.r, color.g, color.b))
            cv2.addWeighted(overlay, 0.15, annotated, 0.85, 0, annotated)
            cv2.polylines(annotated, [poly], True, (color.r, color.g, color.b), 2)
            # Zone label
            cx = int(poly[:, 0].mean())
            cy = int(poly[:, 1].min()) + 20
            cv2.putText(annotated, name.upper(), (cx - 30, cy),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # Stats overlay
        stats = session_mgr.get_stats()
        cv2.rectangle(annotated, (5, 5), (220, 90), (0, 0, 0), -1)
        cv2.putText(annotated, f"PEOPLE: {len(result_boxes)}", (10, 22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(annotated, f"VISITORS: {stats['total_visitors']}", (10, 42),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        cv2.putText(annotated, f"REIDS: {reid.stats['total_reids']}", (10, 58),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 200), 1)
        cv2.putText(annotated, f"DWELL: {stats['avg_dwell_s']:.0f}s", (10, 74),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 255), 1)

        # Update globals
        current_frame = annotated
        tracked_boxes = result_boxes
        session_stats = {**stats, "total_reids": reid.stats["total_reids"]}


# ── Main ─────────────────────────────────────────────────────────────

def main():
    import threading

    p = argparse.ArgumentParser(description="Video streamer with RF-DETR tracking pipeline")

    source_group = p.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--source", help="Video source (file, rtsp://, or 0 for webcam)")
    source_group.add_argument("--youtube", help="YouTube video URL")

    p.add_argument("--port", type=int, default=8001, help="HTTP server port")
    p.add_argument("--config", default="zones.json", help="Zone configuration file")
    p.add_argument("--conf", type=float, default=0.40, help="Detection confidence")
    p.add_argument("--backend-url", default="http://localhost:8000", help="Backend API URL")
    p.add_argument("--exit-timeout", type=float, default=30.0, help="Exit timeout seconds")
    args = p.parse_args()

    global BACKEND_URL, DETECTION_CONF, EXIT_TIMEOUT_S
    BACKEND_URL = args.backend_url
    DETECTION_CONF = args.conf
    EXIT_TIMEOUT_S = args.exit_timeout

    # Determine video source
    if args.youtube:
        video_source = get_youtube_stream_url(args.youtube)
    else:
        video_source = args.source

    # Start tracking in background thread
    tracking_thread = threading.Thread(
        target=run_tracking,
        args=(video_source, args.conf, args.backend_url, args.config),
        daemon=True,
    )
    tracking_thread.start()

    print(f"[INFO] Starting video server on http://0.0.0.0:{args.port}")
    print(f"[INFO] Stream URL: http://localhost:{args.port}/video_feed")
    app.run(host="0.0.0.0", port=args.port, debug=False, threaded=True)


if __name__ == "__main__":
    main()
