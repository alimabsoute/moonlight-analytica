#!/usr/bin/env python3
"""
Janus Batch Processing Engine — RF-DETR + Supervision
=====================================================
Analyzes recorded videos frame-by-frame using RF-DETR with zero frame
skipping, producing "verified truth" analytics data alongside live tracking data.

Uses Supervision PolygonZone for zone counting and LineZone for entry/exit,
eliminating ~500 lines of custom zone/tracking code.

Usage:
    python batch_processor.py process --video-id <id> [--conf 0.30]
    python batch_processor.py process-all
    python batch_processor.py status
    python batch_processor.py clear [--video-id <id>]
"""

import argparse
import json
import os
import sqlite3
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

# cv2 and supervision are lightweight — safe to import at module level.
# rfdetr and trackers pull in PyTorch which needs significant virtual memory on
# Windows (shm.dll).  We defer those imports to the point of actual inference
# so that CLI commands like `status` and `clear` work without loading the GPU stack.
import cv2
import supervision as sv

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "janus.db")
ZONE_CONFIG = os.path.join(os.path.dirname(__file__), "zones.json")
VIDEO_LIBRARY_DIR = os.path.join(os.path.dirname(__file__), "video_library")
VIDEO_LIBRARY_META = os.path.join(VIDEO_LIBRARY_DIR, "metadata.json")
REFERENCE_WIDTH = 640
REFERENCE_HEIGHT = 480


@dataclass
class BatchConfig:
    video_path: str
    video_id: str
    confidence: float = 0.30
    device: str = "cpu"
    zone_config: str = ZONE_CONFIG
    base_timestamp: Optional[datetime] = None
    commit_interval: int = 500  # frames between DB commits


# ---------------------------------------------------------------------------
# JSON output writer — writes _tracking.json and _progress.json per video
# ---------------------------------------------------------------------------

class JSONOutputWriter:
    """Writes per-frame tracking JSON and progress JSON to video_library/."""

    def __init__(self, video_id: str, library_dir: str):
        self.video_id = video_id
        self.library_dir = library_dir
        self._frames: List[dict] = []

    def add_frame(self, frame_idx: int, timestamp_ms: float, tracks: List[dict]):
        """Accumulate one frame of tracking data."""
        self._frames.append({
            "frame_idx": frame_idx,
            "timestamp_ms": timestamp_ms,
            "tracks": tracks,
        })

    def write_progress(self, processed_frames: int, total_frames: int, fps: float,
                       status: str = "processing"):
        """Write {video_id}_progress.json (overwrites each call)."""
        pct = round(processed_frames / total_frames * 100, 1) if total_frames > 0 else 0.0
        data = {
            "video_id": self.video_id,
            "status": status,
            "total_frames": total_frames,
            "processed_frames": processed_frames,
            "fps": fps,
            "percent": pct,
        }
        path = os.path.join(self.library_dir, f"{self.video_id}_progress.json")
        with open(path, "w") as f:
            json.dump(data, f)

    def write_tracking(self, total_frames: int, fps: float):
        """Write {video_id}_tracking.json with all accumulated frames."""
        data = {
            "video_id": self.video_id,
            "status": "completed",
            "total_frames": total_frames,
            "fps": fps,
            "frame_count": len(self._frames),
            "frames": self._frames,
        }
        path = os.path.join(self.library_dir, f"{self.video_id}_tracking.json")
        with open(path, "w") as f:
            json.dump(data, f)


# ---------------------------------------------------------------------------
# Zone loading — Supervision PolygonZone
# ---------------------------------------------------------------------------

def load_zones(config_path: str, frame_w: int, frame_h: int):
    """Load zones from JSON and create Supervision PolygonZones scaled to frame."""
    if not os.path.exists(config_path):
        print(f"[WARN] Zone config not found: {config_path}, using defaults")
        return _default_zones(frame_w, frame_h)

    try:
        with open(config_path) as f:
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
            }

        return zones
    except Exception as e:
        print(f"[ERROR] Failed to load zones: {e}")
        return _default_zones(frame_w, frame_h)


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


def load_video_library() -> List[dict]:
    if not os.path.exists(VIDEO_LIBRARY_META):
        return []
    with open(VIDEO_LIBRARY_META) as f:
        return json.load(f).get("videos", [])


def find_video_by_id(video_id: str) -> Optional[dict]:
    for v in load_video_library():
        if v["id"] == video_id:
            return v
    return None


# ---------------------------------------------------------------------------
# Session tracker (lightweight replacement for BatchZoneTracker)
# ---------------------------------------------------------------------------

class BatchSessionTracker:
    """Tracks person sessions using Supervision zones during batch processing."""

    def __init__(self, zones: dict, video_id: str):
        self.zones = zones
        self.video_id = video_id
        self.sessions: Dict[int, dict] = {}  # track_id -> session data
        self.pending_events: List[dict] = []
        self.pending_sessions: List[dict] = []

    def _person_id(self, track_id: int) -> str:
        return f"B-{self.video_id[:8]}-{track_id}"

    def _find_zone(self, x: float, y: float) -> Optional[str]:
        """Find which zone contains the point."""
        for name, z_info in self.zones.items():
            poly = z_info["zone"].polygon
            if cv2.pointPolygonTest(poly.astype(np.float32), (float(x), float(y)), False) >= 0:
                return name
        return None

    def update(self, detections: sv.Detections, timestamp: datetime, frame_num: int):
        """Process detections for this frame."""
        if detections.tracker_id is None or len(detections) == 0:
            return

        feet = detections.get_anchors_coordinates(sv.Position.BOTTOM_CENTER)

        for i, track_id in enumerate(detections.tracker_id):
            track_id = int(track_id)
            fx, fy = feet[i]
            current_zone = self._find_zone(fx, fy)
            person_id = self._person_id(track_id)

            if track_id not in self.sessions:
                self.sessions[track_id] = {
                    "entry_time": timestamp,
                    "last_seen": timestamp,
                    "last_frame": frame_num,
                    "zone_history": [current_zone] if current_zone else [],
                    "converted": False,
                }
                if current_zone:
                    self.pending_events.append({
                        "timestamp": timestamp.isoformat(timespec="seconds"),
                        "person_id": person_id,
                        "event_type": "entry",
                        "zone_id": self.zones[current_zone]["zone_id"],
                        "direction": "in",
                        "confidence": 1.0,
                    })
            else:
                sess = self.sessions[track_id]
                old_zone = sess["zone_history"][-1] if sess["zone_history"] else None
                sess["last_seen"] = timestamp
                sess["last_frame"] = frame_num

                if current_zone and current_zone != old_zone:
                    if current_zone not in sess["zone_history"]:
                        sess["zone_history"].append(current_zone)
                    self.pending_events.append({
                        "timestamp": timestamp.isoformat(timespec="seconds"),
                        "person_id": person_id,
                        "event_type": "zone_change",
                        "zone_id": self.zones[current_zone]["zone_id"],
                        "direction": "lateral",
                        "confidence": 1.0,
                    })

                if current_zone and self.zones.get(current_zone, {}).get("zone_type") == "checkout":
                    sess["converted"] = True

    def cleanup_inactive(self, current_frame: int, timeout_frames: int = 90):
        """Remove sessions not seen for timeout_frames."""
        to_remove = []
        for tid, sess in self.sessions.items():
            if current_frame - sess["last_frame"] > timeout_frames:
                person_id = self._person_id(tid)
                self.pending_events.append({
                    "timestamp": sess["last_seen"].isoformat(timespec="seconds"),
                    "person_id": person_id,
                    "event_type": "exit",
                    "zone_id": None,
                    "direction": "out",
                    "confidence": 1.0,
                })
                dwell = int((sess["last_seen"] - sess["entry_time"]).total_seconds())
                self.pending_sessions.append({
                    "person_id": person_id,
                    "entry_time": sess["entry_time"].isoformat(timespec="seconds"),
                    "exit_time": sess["last_seen"].isoformat(timespec="seconds"),
                    "dwell_seconds": dwell,
                    "zone_path": json.dumps(sess["zone_history"]),
                    "converted": 1 if sess["converted"] else 0,
                })
                to_remove.append(tid)
        for tid in to_remove:
            del self.sessions[tid]

    def flush_all(self):
        """Finalize all remaining sessions."""
        for tid, sess in list(self.sessions.items()):
            person_id = self._person_id(tid)
            self.pending_events.append({
                "timestamp": sess["last_seen"].isoformat(timespec="seconds"),
                "person_id": person_id,
                "event_type": "exit",
                "zone_id": None,
                "direction": "out",
                "confidence": 1.0,
            })
            dwell = int((sess["last_seen"] - sess["entry_time"]).total_seconds())
            self.pending_sessions.append({
                "person_id": person_id,
                "entry_time": sess["entry_time"].isoformat(timespec="seconds"),
                "exit_time": sess["last_seen"].isoformat(timespec="seconds"),
                "dwell_seconds": dwell,
                "zone_path": json.dumps(sess["zone_history"]),
                "converted": 1 if sess["converted"] else 0,
            })
        self.sessions.clear()


# ---------------------------------------------------------------------------
# Database writer (direct SQLite, not HTTP) — UNCHANGED from original
# ---------------------------------------------------------------------------

class BatchDBWriter:
    """Writes batch processing results directly to SQLite."""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = os.path.normpath(os.path.abspath(db_path))

    def _connect(self):
        con = sqlite3.connect(self.db_path, timeout=30)
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA journal_mode=WAL")
        return con

    def delete_previous_results(self, video_id: str):
        con = self._connect()
        try:
            con.execute("DELETE FROM events WHERE source='batch' AND video_id=?", (video_id,))
            con.execute("DELETE FROM sessions WHERE source='batch' AND video_id=?", (video_id,))
            con.commit()
        finally:
            con.close()

    def write_events(self, events: List[dict], video_id: str) -> int:
        if not events:
            return 0
        con = self._connect()
        try:
            con.executemany(
                """INSERT INTO events (timestamp, person_id, event_type, zone_id, direction, confidence, source, video_id)
                   VALUES (:timestamp, :person_id, :event_type, :zone_id, :direction, :confidence, 'batch', :video_id)""",
                [{**e, "video_id": video_id} for e in events],
            )
            con.commit()
            return len(events)
        finally:
            con.close()

    def write_sessions(self, sessions: List[dict], video_id: str) -> int:
        if not sessions:
            return 0
        con = self._connect()
        try:
            con.executemany(
                """INSERT INTO sessions (person_id, entry_time, exit_time, dwell_seconds, zone_path, converted, source, video_id)
                   VALUES (:person_id, :entry_time, :exit_time, :dwell_seconds, :zone_path, :converted, 'batch', :video_id)""",
                [{**s, "video_id": video_id} for s in sessions],
            )
            con.commit()
            return len(sessions)
        finally:
            con.close()

    def create_job(self, video_id: str, video_name: str, video_path: str,
                   model: str, total_frames: int, fps: float) -> int:
        con = self._connect()
        try:
            cur = con.execute(
                """INSERT INTO batch_jobs (video_id, video_name, video_path, model, tracker,
                   status, total_frames, fps, started_at)
                   VALUES (?, ?, ?, ?, 'bytetrack', 'processing', ?, ?, ?)""",
                (video_id, video_name, video_path, model, total_frames, fps,
                 datetime.now(timezone.utc).isoformat(timespec="seconds")),
            )
            con.commit()
            return cur.lastrowid
        finally:
            con.close()

    def update_job_progress(self, job_id: int, processed_frames: int,
                            total_events: int, total_sessions: int):
        con = self._connect()
        try:
            con.execute(
                "UPDATE batch_jobs SET processed_frames=?, total_events=?, total_sessions=? WHERE id=?",
                (processed_frames, total_events, total_sessions, job_id),
            )
            con.commit()
        finally:
            con.close()

    def complete_job(self, job_id: int, total_events: int, total_sessions: int):
        con = self._connect()
        try:
            con.execute(
                """UPDATE batch_jobs SET status='completed', processed_frames=total_frames,
                   total_events=?, total_sessions=?, completed_at=? WHERE id=?""",
                (total_events, total_sessions,
                 datetime.now(timezone.utc).isoformat(timespec="seconds"), job_id),
            )
            con.commit()
        finally:
            con.close()

    def fail_job(self, job_id: int, error_message: str):
        con = self._connect()
        try:
            con.execute(
                "UPDATE batch_jobs SET status='failed', error_message=?, completed_at=? WHERE id=?",
                (error_message, datetime.now(timezone.utc).isoformat(timespec="seconds"), job_id),
            )
            con.commit()
        finally:
            con.close()

    def get_jobs(self) -> List[dict]:
        con = self._connect()
        try:
            rows = con.execute("SELECT * FROM batch_jobs ORDER BY id DESC").fetchall()
            return [dict(r) for r in rows]
        finally:
            con.close()


# ---------------------------------------------------------------------------
# Video Analyzer
# ---------------------------------------------------------------------------

class VideoAnalyzer:
    def __init__(self, config: BatchConfig):
        self.config = config
        self.db = BatchDBWriter()

    def process(self):
        video_path = self.config.video_path
        video_id = self.config.video_id

        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration_sec = total_frames / fps if fps > 0 else 0
        cap.release()

        print(f"[INFO] Video: {video_path}")
        print(f"[INFO] Resolution: {width}x{height} | FPS: {fps:.1f} | Frames: {total_frames} | Duration: {duration_sec:.1f}s")

        base_ts = self.config.base_timestamp or (datetime.now(timezone.utc) - timedelta(seconds=duration_sec))
        video_meta = find_video_by_id(video_id)
        video_name = video_meta["name"] if video_meta else os.path.basename(video_path)

        # Delete previous results and create job
        self.db.delete_previous_results(video_id)
        job_id = self.db.create_job(video_id, video_name, video_path,
                                    "rf-detr-nano", total_frames, fps)
        print(f"[INFO] Created batch job #{job_id}")

        # Load zones scaled to video resolution
        zones = load_zones(self.config.zone_config, width, height)
        print(f"[INFO] Loaded {len(zones)} zones (scaled to {width}x{height})")

        # Deferred import — loads PyTorch + model weights only when inference runs.
        # On Windows, set thread counts before torch loads to reduce VA pressure.
        import os as _os
        _os.environ.setdefault("OMP_NUM_THREADS", "1")
        _os.environ.setdefault("MKL_NUM_THREADS", "1")
        from rfdetr import RFDETRNano
        from trackers import ByteTrackTracker

        # Initialize RF-DETR + ByteTrack
        model = RFDETRNano()
        tracker = ByteTrackTracker(
            lost_track_buffer=int(fps * 3),
            minimum_consecutive_frames=3,
        )
        print("[INFO] RF-DETR-Nano + ByteTrack initialized")

        # Initialize session tracker
        session_tracker = BatchSessionTracker(zones, video_id)

        # Initialize JSON output writer
        json_writer = JSONOutputWriter(video_id, VIDEO_LIBRARY_DIR)
        json_writer.write_progress(0, total_frames, fps)

        total_events_written = 0
        total_sessions_written = 0
        t0 = time.time()
        cleanup_interval = int(fps * 3)

        try:
            print(f"[INFO] Starting batch analysis...")
            frame_num = 0

            for frame in sv.get_video_frames_generator(source_path=video_path):
                frame_num += 1
                video_ts = base_ts + timedelta(seconds=frame_num / fps)

                # Detect with RF-DETR
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                detections = model.predict(rgb, threshold=self.config.confidence)

                # Filter to person class (class_id 1 in RF-DETR's COCO map)
                if detections.class_id is not None and len(detections) > 0:
                    detections.data.pop("source_image", None)
                    detections.data.pop("source_shape", None)
                    detections = detections[detections.class_id == 1]

                # Track
                detections = tracker.update(detections)

                # Accumulate per-frame tracking data for JSON output
                tracks = []
                if detections.tracker_id is not None and len(detections) > 0:
                    for i, tid in enumerate(detections.tracker_id):
                        bbox = [round(v) for v in detections.xyxy[i].tolist()]
                        conf = round(float(detections.confidence[i]), 4) if detections.confidence is not None else None
                        tracks.append({"id": int(tid), "bbox": bbox, "conf": conf})
                timestamp_ms = round((frame_num / fps) * 1000, 1)
                json_writer.add_frame(frame_num, timestamp_ms, tracks)

                # Update zone-based session tracking
                session_tracker.update(detections, video_ts, frame_num)

                # Periodic cleanup
                if frame_num % cleanup_interval == 0:
                    timeout_frames = int(fps * 3)
                    session_tracker.cleanup_inactive(frame_num, timeout_frames)

                # Periodic DB commit + progress JSON update
                if frame_num % self.config.commit_interval == 0:
                    ev_count = self.db.write_events(session_tracker.pending_events, video_id)
                    ss_count = self.db.write_sessions(session_tracker.pending_sessions, video_id)
                    total_events_written += ev_count
                    total_sessions_written += ss_count
                    session_tracker.pending_events.clear()
                    session_tracker.pending_sessions.clear()

                    self.db.update_job_progress(job_id, frame_num,
                                                total_events_written, total_sessions_written)
                    json_writer.write_progress(frame_num, total_frames, fps)

                    elapsed = time.time() - t0
                    pct = (frame_num / total_frames * 100) if total_frames > 0 else 0
                    proc_fps = frame_num / elapsed if elapsed > 0 else 0
                    eta = (total_frames - frame_num) / proc_fps if proc_fps > 0 else 0
                    print(f"  [{pct:5.1f}%] Frame {frame_num}/{total_frames} | "
                          f"{proc_fps:.1f} fps | ETA {eta:.0f}s | "
                          f"Events: {total_events_written} Sessions: {total_sessions_written}")

            # Finalize remaining sessions
            session_tracker.flush_all()
            ev_count = self.db.write_events(session_tracker.pending_events, video_id)
            ss_count = self.db.write_sessions(session_tracker.pending_sessions, video_id)
            total_events_written += ev_count
            total_sessions_written += ss_count

            self.db.complete_job(job_id, total_events_written, total_sessions_written)

            # Write final JSON outputs
            json_writer.write_tracking(total_frames, fps)
            json_writer.write_progress(total_frames, total_frames, fps, status="completed")

            elapsed = time.time() - t0
            print(f"\n[DONE] Batch processing complete in {elapsed:.1f}s")
            print(f"  Total frames: {total_frames}")
            print(f"  Events: {total_events_written}")
            print(f"  Sessions: {total_sessions_written}")
            print(f"  Processing FPS: {total_frames / elapsed:.1f}")

        except Exception as e:
            self.db.fail_job(job_id, str(e))
            print(f"[ERROR] Batch processing failed: {e}")
            raise


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def cmd_process(args):
    video = find_video_by_id(args.video_id)
    if not video:
        print(f"[ERROR] Video not found in library: {args.video_id}")
        sys.exit(1)
    if not os.path.exists(video["path"]):
        print(f"[ERROR] Video file not found: {video['path']}")
        sys.exit(1)

    config = BatchConfig(
        video_path=video["path"],
        video_id=args.video_id,
        confidence=args.conf,
        device=args.device,
    )
    VideoAnalyzer(config).process()


def cmd_process_all(args):
    videos = load_video_library()
    if not videos:
        print("[WARN] No videos in library")
        return

    print(f"[INFO] Processing {len(videos)} videos from library...")
    for i, video in enumerate(videos, 1):
        print(f"\n{'='*60}")
        print(f"[{i}/{len(videos)}] {video['name']} ({video['id']})")
        print(f"{'='*60}")

        if not os.path.exists(video["path"]):
            print(f"[SKIP] File not found: {video['path']}")
            continue

        config = BatchConfig(
            video_path=video["path"],
            video_id=video["id"],
            confidence=args.conf,
            device=args.device,
        )
        try:
            VideoAnalyzer(config).process()
        except Exception as e:
            print(f"[ERROR] Failed to process {video['name']}: {e}")


def cmd_status(args):
    db = BatchDBWriter()
    jobs = db.get_jobs()
    if not jobs:
        print("No batch jobs found.")
        return

    print(f"{'ID':>4} {'Status':<12} {'Video':<25} {'Model':<14} {'Progress':>12} {'Events':>8} {'Sessions':>8}")
    print("-" * 95)
    for j in jobs:
        total = j["total_frames"] or 1
        done = j["processed_frames"] or 0
        pct = f"{done}/{total} ({done/total*100:.0f}%)"
        name = (j["video_name"] or "")[:24]
        print(f"{j['id']:>4} {j['status']:<12} {name:<25} {j['model']:<14} {pct:>12} {j['total_events']:>8} {j['total_sessions']:>8}")


def cmd_clear(args):
    db = BatchDBWriter()
    if args.video_id:
        print(f"[INFO] Clearing batch data for video {args.video_id}")
        db.delete_previous_results(args.video_id)
        con = db._connect()
        try:
            con.execute("DELETE FROM batch_jobs WHERE video_id=?", (args.video_id,))
            con.commit()
        finally:
            con.close()
    else:
        print("[INFO] Clearing ALL batch data")
        con = db._connect()
        try:
            con.execute("DELETE FROM events WHERE source='batch'")
            con.execute("DELETE FROM sessions WHERE source='batch'")
            con.execute("DELETE FROM batch_jobs")
            con.commit()
        finally:
            con.close()
    print("[DONE] Batch data cleared")


def main():
    parser = argparse.ArgumentParser(description="Janus Batch Processing Engine")
    sub = parser.add_subparsers(dest="command", help="Command")

    p_proc = sub.add_parser("process", help="Process a single video")
    p_proc.add_argument("--video-id", required=True, help="Video ID from library")
    p_proc.add_argument("--conf", type=float, default=0.30, help="Confidence threshold")
    p_proc.add_argument("--device", default="cpu", help="Inference device")

    p_all = sub.add_parser("process-all", help="Process all library videos")
    p_all.add_argument("--conf", type=float, default=0.30, help="Confidence threshold")
    p_all.add_argument("--device", default="cpu", help="Inference device")

    sub.add_parser("status", help="Show batch job status")

    p_clear = sub.add_parser("clear", help="Clear batch data")
    p_clear.add_argument("--video-id", default=None, help="Clear data for specific video")

    args = parser.parse_args()
    if args.command == "process":
        cmd_process(args)
    elif args.command == "process-all":
        cmd_process_all(args)
    elif args.command == "status":
        cmd_status(args)
    elif args.command == "clear":
        cmd_clear(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
