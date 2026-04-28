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

# Make backend/zone_geometry.py importable for canonical world-space hit testing.
# (JANUS-ZONE-MODEL.md: zones live in 3D world space; backend module is SSOT.)
_BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)
try:
    from zone_geometry import point_in_zone_world, identity_rotation, _point_in_polygon_2d
    _ZONE_GEOMETRY_AVAILABLE = True
except Exception as _zg_err:
    print(f"[WARN] zone_geometry not importable ({_zg_err}); v2 zones will fall back to legacy pixel-space")
    _ZONE_GEOMETRY_AVAILABLE = False

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

    Each zone dict in the returned mapping contains:
        - "zone":             sv.PolygonZone (built from polygon_image when available;
                              required for sv.LineZone-style triggers/drawing). May be None
                              if the zone is v2-only with no cached polygon_image.
        - "zone_id":          int (DB primary key)
        - "zone_type":        str — semantic type (entrance/queue/checkout/general)
        - "schema_version":   1 or 2
        - "surface_type":     str — floor / counter_top / table / ramp / wall (v2 only)
        - "polygon_world_3d": [[x,y,z], ...] in world meters (v2 only)
        - "rotation_matrix":  3x3 list (v2 only)
    """
    try:
        resp = requests.get(f"{backend_url}/api/zones/config", timeout=5)
        resp.raise_for_status()
        data = resp.json()
        raw_zones = data.get("zones", [])
    except Exception as e:
        print(f"[WARN] Could not fetch zones from API ({e}), falling back to config file")
        return None, None

    # Accept any zone with v2 (polygon_world_3d + rotation_matrix) OR v1 (polygon_image) geometry
    zones_with_geo = [
        z for z in raw_zones
        if z.get("polygon_world_3d") or z.get("polygon_image")
    ]
    if not zones_with_geo:
        print("[WARN] API returned no zones with usable geometry, falling back to config file")
        return None, None

    zones = {}
    v2_count = 0
    v1_count = 0
    sx, sy = frame_w / 640, frame_h / 480

    for z in zones_with_geo:
        name = z.get("zone_name") or z.get("name") or f"zone_{z['id']}"
        schema_version = int(z.get("schema_version") or 1)
        # Default surface_type from API is 'floor' (see backend/routes/zones.py)
        surface_type = z.get("surface_type") or "floor"

        # Try to build sv.PolygonZone from polygon_image (cached pixel projection).
        # This is still useful for legacy v1 fallback hit-tests AND for downstream
        # supervision-based drawing/triggers if needed. v2 hit testing happens in
        # world space via is_foot_in_zone().
        polygon_image = z.get("polygon_image")
        sv_zone = None
        if polygon_image:
            try:
                pts = np.array(polygon_image, dtype=np.float32)
                pts[:, 0] *= sx
                pts[:, 1] *= sy
                sv_zone = sv.PolygonZone(polygon=pts.astype(np.int32))
            except Exception as e:
                print(f"[WARN] Could not build sv.PolygonZone for '{name}': {e}")

        # Map zone_type for downstream conversion logic. Backend doesn't store
        # zone_type yet; infer from surface_type / name fallbacks for now.
        zone_type = "general"
        lname = name.lower()
        if "checkout" in lname:
            zone_type = "checkout"
        elif "queue" in lname:
            zone_type = "queue"
        elif "entrance" in lname or "entry" in lname:
            zone_type = "entrance"

        entry = {
            "zone": sv_zone,
            "zone_id": z["id"],
            "zone_type": zone_type,
            "schema_version": schema_version,
            "surface_type": surface_type,
            "polygon_world_3d": z.get("polygon_world_3d"),
            "rotation_matrix": z.get("rotation_matrix"),
        }

        if schema_version >= 2 and entry["polygon_world_3d"] and entry["rotation_matrix"]:
            v2_count += 1
        else:
            # Treat as v1 even if backend reported v2 but the 3D fields were null
            entry["schema_version"] = 1
            v1_count += 1

        zones[name] = entry

    print(
        f"[INFO] Loaded {len(zones)} zones from backend API: "
        f"{v2_count} v2 (world-space 3D), {v1_count} v1 (legacy pixel-space)"
    )
    if v2_count > 0 and not _ZONE_GEOMETRY_AVAILABLE:
        print("[WARN] zone_geometry import failed — v2 zones will use legacy pixel-space hit-test fallback")
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
                "schema_version": 1,
                "surface_type": "floor",
                "polygon_world_3d": None,
                "rotation_matrix": None,
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
        zones[name] = {
            "zone": polygon_zone,
            "zone_id": zid,
            "zone_type": ztype,
            "schema_version": 1,
            "surface_type": "floor",
            "polygon_world_3d": None,
            "rotation_matrix": None,
        }
    return zones


def _default_lines(frame_w: int, frame_h: int):
    sx, sy = frame_w / 640, frame_h / 480
    start = sv.Point(int(200 * sx), int(0 * sy))
    end = sv.Point(int(200 * sx), int(480 * sy))
    return [{"name": "entry_line", "line": sv.LineZone(start=start, end=end)}]


# ── World-Space Zone Hit Testing ─────────────────────────────────────

def is_foot_in_zone(world_x: Optional[float], world_y: Optional[float], zone: dict) -> bool:
    """
    Test whether a person's foot (back-projected to world coords) lies inside a zone.

    Per JANUS-ZONE-MODEL.md, zones are 3D world-space planes — hit testing happens
    in world coords, not pixel coords. This wrapper:

      - Returns False for v1 zones (caller must fall back to legacy pixel-space test).
      - Returns False if world coords are missing (uncalibrated camera) — caller
        must fall back to legacy pixel-space test.
      - For v2 floor / ramp zones: 2D point-in-polygon on the xy footprint.
      - For v2 counter_top / table zones (elevated surfaces): person standing at
        the bar with foot z=0 still counts when their xy is inside the footprint.
        (point_in_zone_world() would otherwise reject them due to z mismatch.)
      - For v2 wall zones: tighter 3D distance check.
      - For other v2 surfaces: standard point_in_zone_world.
    """
    if not _ZONE_GEOMETRY_AVAILABLE:
        return False
    if zone.get("schema_version", 1) < 2:
        return False
    pw3d = zone.get("polygon_world_3d")
    rot = zone.get("rotation_matrix")
    if pw3d is None or rot is None:
        return False
    if world_x is None or world_y is None:
        return False  # uncalibrated — caller should use pixel-space fallback

    surface = zone.get("surface_type", "floor")
    foot_pt = [float(world_x), float(world_y), 0.0]

    if surface in ("floor", "ramp"):
        return point_in_zone_world(foot_pt, pw3d, rot)
    elif surface in ("counter_top", "table"):
        # Elevated zones: person at floor (z=0) standing under/at the bar counts
        # if their xy footprint intersects the zone's xy footprint.
        poly_xy = np.array([[p[0], p[1]] for p in pw3d], dtype=np.float64)
        return _point_in_polygon_2d(np.array([float(world_x), float(world_y)]), poly_xy)
    elif surface == "wall":
        return point_in_zone_world(foot_pt, pw3d, rot, surface_tolerance=1.0)
    else:
        return point_in_zone_world(foot_pt, pw3d, rot)


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
        sv_str = f"v{z.get('schema_version', 1)}"
        surf = z.get("surface_type", "floor")
        print(f"  Zone: {name} [{z['zone_type']}] ({sv_str}, surface={surf})")

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

            # 3. Zone analytics — only run sv.PolygonZone.trigger for zones that have one
            for name, z_info in zones.items():
                sv_zone = z_info.get("zone")
                if sv_zone is not None:
                    sv_zone.trigger(detections)

            # 4. Line crossing (entry/exit)
            for ln in lines:
                ln["line"].trigger(detections)

            # 5. Session tracking
            if detections.tracker_id is not None:
                active_ids = set()
                for i, track_id in enumerate(detections.tracker_id):
                    track_id = int(track_id)
                    active_ids.add(track_id)

                    # Determine zone from bottom-center anchor.
                    # Per JANUS-ZONE-MODEL.md: prefer world-space hit-test (v2 zones)
                    # and fall back to legacy pixel-space (v1 zones / uncalibrated camera).
                    feet = detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)
                    fx, fy = feet[i]
                    world_x, world_y = project_to_world(H_matrix, fx, fy)
                    current_zone = None
                    for name, z_info in zones.items():
                        is_v2 = (
                            z_info.get("schema_version", 1) >= 2
                            and z_info.get("polygon_world_3d") is not None
                            and z_info.get("rotation_matrix") is not None
                        )
                        if is_v2 and world_x is not None:
                            if is_foot_in_zone(world_x, world_y, z_info):
                                current_zone = name
                                break
                        else:
                            # Legacy v1 fallback: pixel-space point-in-polygon
                            sv_zone = z_info.get("zone")
                            if sv_zone is None:
                                continue  # v2-only zone with no cached polygon_image; skip
                            poly = sv_zone.polygon
                            if cv2.pointPolygonTest(
                                poly.astype(np.float32), (float(fx), float(fy)), False
                            ) >= 0:
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
