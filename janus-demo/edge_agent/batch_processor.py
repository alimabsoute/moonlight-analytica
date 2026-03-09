#!/usr/bin/env python3
"""
Janus Batch Processing Engine
==============================
Analyzes recorded videos frame-by-frame using larger YOLO models with zero frame
skipping, producing "verified truth" analytics data alongside live tracking data.

Usage:
    python batch_processor.py process --video-id <id> [--model yolo11l.pt] [--tracker botsort_tuned.yaml] [--conf 0.30]
    python batch_processor.py process-all [--model yolo11l.pt]
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

import cv2
import numpy as np

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "janus.db")
ZONE_CONFIG = os.path.join(os.path.dirname(__file__), "zones.json")
VIDEO_LIBRARY_META = os.path.join(os.path.dirname(__file__), "video_library", "metadata.json")
REFERENCE_WIDTH = 640
REFERENCE_HEIGHT = 480


@dataclass
class BatchConfig:
    video_path: str
    video_id: str
    model: str = "yolo11l.pt"
    tracker: str = "botsort_tuned.yaml"
    confidence: float = 0.30
    device: str = "cpu"
    zone_config: str = ZONE_CONFIG
    base_timestamp: Optional[datetime] = None
    commit_interval: int = 500  # frames between DB commits


# ---------------------------------------------------------------------------
# Zone & Person tracking (adapted from edge_agent_enhanced.py)
# ---------------------------------------------------------------------------

class Zone:
    """Represents a physical zone in the tracking area."""
    def __init__(self, zone_id: int, name: str, x1: int, y1: int, x2: int, y2: int, zone_type: str = "general"):
        self.zone_id = zone_id
        self.name = name
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        self.zone_type = zone_type

    def contains_point(self, x: float, y: float) -> bool:
        return self.x1 <= x <= self.x2 and self.y1 <= y <= self.y2

    def scaled(self, sx: float, sy: float) -> "Zone":
        """Return a new Zone with coordinates scaled by (sx, sy)."""
        return Zone(
            self.zone_id, self.name,
            int(self.x1 * sx), int(self.y1 * sy),
            int(self.x2 * sx), int(self.y2 * sy),
            self.zone_type,
        )


class PersonTracker:
    """Tracks a single person's session across zones (batch variant)."""
    def __init__(self, person_id: str, entry_time: datetime, initial_zone: Optional[Zone] = None):
        self.person_id = person_id
        self.entry_time = entry_time
        self.exit_time: Optional[datetime] = None
        self.current_zone: Optional[Zone] = initial_zone
        self.zone_history: List[str] = [initial_zone.name] if initial_zone else []
        self.last_seen = entry_time
        self.last_frame: int = 0
        self.converted = False

    def update_zone(self, new_zone: Optional[Zone], timestamp: datetime):
        self.last_seen = timestamp
        if new_zone and (not self.current_zone or new_zone.zone_id != self.current_zone.zone_id):
            self.current_zone = new_zone
            if new_zone.name not in self.zone_history:
                self.zone_history.append(new_zone.name)
            if new_zone.zone_type == "checkout":
                self.converted = True

    def mark_exit(self, timestamp: datetime):
        self.exit_time = timestamp

    def get_dwell_seconds(self) -> Optional[int]:
        if self.exit_time:
            return int((self.exit_time - self.entry_time).total_seconds())
        return None


class BatchZoneTracker:
    """Zone tracker adapted for batch processing with video timestamps."""
    def __init__(self, zones: List[Zone], video_id: str):
        self.zones = zones
        self.video_id = video_id
        self.active_trackers: Dict[int, PersonTracker] = {}
        self.pending_events: List[dict] = []
        self.pending_sessions: List[dict] = []
        self.person_id_prefix = f"B-{video_id[:8]}-"
        self.next_person_id = 1

    def get_zone_at_point(self, x: float, y: float) -> Optional[Zone]:
        for zone in self.zones:
            if zone.contains_point(x, y):
                return zone
        return None

    def _make_person_id(self, track_id: int) -> str:
        return f"{self.person_id_prefix}{track_id}"

    def update(self, track_id: int, bbox: Tuple[float, float, float, float],
               timestamp: datetime, frame_num: int):
        x1, y1, x2, y2 = bbox
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        current_zone = self.get_zone_at_point(cx, cy)
        person_id = self._make_person_id(track_id)

        if track_id not in self.active_trackers:
            tracker = PersonTracker(person_id, timestamp, current_zone)
            tracker.last_frame = frame_num
            self.active_trackers[track_id] = tracker
            if current_zone:
                self.pending_events.append({
                    "timestamp": timestamp.isoformat(timespec="seconds"),
                    "person_id": person_id,
                    "event_type": "entry",
                    "zone_id": current_zone.zone_id,
                    "direction": "in",
                    "confidence": 1.0,
                })
        else:
            tracker = self.active_trackers[track_id]
            old_zone = tracker.current_zone
            tracker.last_frame = frame_num

            if current_zone and old_zone and current_zone.zone_id != old_zone.zone_id:
                tracker.update_zone(current_zone, timestamp)
                self.pending_events.append({
                    "timestamp": timestamp.isoformat(timespec="seconds"),
                    "person_id": person_id,
                    "event_type": "zone_change",
                    "zone_id": current_zone.zone_id,
                    "direction": "lateral",
                    "confidence": 1.0,
                })
            tracker.last_seen = timestamp

    def cleanup_inactive(self, current_frame: int, current_time: datetime,
                         fps: float, timeout_frames: int = 90):
        """Remove trackers not seen for timeout_frames frames."""
        to_remove = []
        for track_id, tracker in self.active_trackers.items():
            if current_frame - tracker.last_frame > timeout_frames:
                tracker.mark_exit(tracker.last_seen)
                if tracker.current_zone:
                    self.pending_events.append({
                        "timestamp": tracker.last_seen.isoformat(timespec="seconds"),
                        "person_id": tracker.person_id,
                        "event_type": "exit",
                        "zone_id": tracker.current_zone.zone_id,
                        "direction": "out",
                        "confidence": 1.0,
                    })
                dwell = tracker.get_dwell_seconds()
                if dwell is not None:
                    self.pending_sessions.append({
                        "person_id": tracker.person_id,
                        "entry_time": tracker.entry_time.isoformat(timespec="seconds"),
                        "exit_time": tracker.exit_time.isoformat(timespec="seconds"),
                        "dwell_seconds": dwell,
                        "zone_path": json.dumps(tracker.zone_history),
                        "converted": 1 if tracker.converted else 0,
                    })
                to_remove.append(track_id)
        for tid in to_remove:
            del self.active_trackers[tid]

    def flush_all(self, current_time: datetime):
        """Finalize all remaining active trackers."""
        for track_id, tracker in list(self.active_trackers.items()):
            tracker.mark_exit(tracker.last_seen)
            if tracker.current_zone:
                self.pending_events.append({
                    "timestamp": tracker.last_seen.isoformat(timespec="seconds"),
                    "person_id": tracker.person_id,
                    "event_type": "exit",
                    "zone_id": tracker.current_zone.zone_id,
                    "direction": "out",
                    "confidence": 1.0,
                })
            dwell = tracker.get_dwell_seconds()
            if dwell is not None:
                self.pending_sessions.append({
                    "person_id": tracker.person_id,
                    "entry_time": tracker.entry_time.isoformat(timespec="seconds"),
                    "exit_time": tracker.exit_time.isoformat(timespec="seconds"),
                    "dwell_seconds": dwell,
                    "zone_path": json.dumps(tracker.zone_history),
                    "converted": 1 if tracker.converted else 0,
                })
        self.active_trackers.clear()


# ---------------------------------------------------------------------------
# Database writer (direct SQLite, not HTTP)
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
        """Delete old batch data for a video (idempotent re-processing)."""
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
                   model: str, tracker: str, total_frames: int, fps: float) -> int:
        con = self._connect()
        try:
            cur = con.execute(
                """INSERT INTO batch_jobs (video_id, video_name, video_path, model, tracker,
                   status, total_frames, fps, started_at)
                   VALUES (?, ?, ?, ?, ?, 'processing', ?, ?, ?)""",
                (video_id, video_name, video_path, model, tracker, total_frames, fps,
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
                """UPDATE batch_jobs SET processed_frames=?, total_events=?, total_sessions=?
                   WHERE id=?""",
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

    def get_job(self, job_id: int) -> Optional[dict]:
        con = self._connect()
        try:
            row = con.execute("SELECT * FROM batch_jobs WHERE id=?", (job_id,)).fetchone()
            return dict(row) if row else None
        finally:
            con.close()


# ---------------------------------------------------------------------------
# Zone loading helpers
# ---------------------------------------------------------------------------

def load_zones(config_path: str) -> List[Zone]:
    if not os.path.exists(config_path):
        print(f"[WARN] Zone config not found: {config_path}, using defaults")
        return _default_zones()
    try:
        with open(config_path) as f:
            data = json.load(f)
        zones = []
        for z in data.get("zones", []):
            zones.append(Zone(z["zone_id"], z["name"],
                              z["x1"], z["y1"], z["x2"], z["y2"],
                              z.get("zone_type", "general")))
        return zones
    except Exception as e:
        print(f"[ERROR] Failed to load zones: {e}")
        return _default_zones()


def _default_zones() -> List[Zone]:
    return [
        Zone(1, "entrance", 0, 0, 200, 480, "entrance"),
        Zone(2, "main_floor", 200, 0, 440, 480, "general"),
        Zone(3, "queue", 440, 240, 540, 480, "queue"),
        Zone(4, "checkout", 540, 0, 640, 480, "checkout"),
    ]


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
# Video Analyzer (main processing loop)
# ---------------------------------------------------------------------------

class VideoAnalyzer:
    def __init__(self, config: BatchConfig):
        self.config = config
        self.db = BatchDBWriter()

    def _load_model(self):
        from ultralytics import YOLO
        model_name = self.config.model
        # Auto-fallback: try requested model, then smaller alternatives
        fallbacks = [model_name]
        if model_name not in fallbacks:
            fallbacks.append(model_name)
        if "yolo11x" in model_name:
            fallbacks.extend(["yolo11l.pt", "yolo11s.pt"])
        elif "yolo11l" in model_name:
            fallbacks.extend(["yolo11s.pt"])

        for m in fallbacks:
            try:
                print(f"[INFO] Loading YOLO model: {m}")
                model = YOLO(m)
                print(f"[OK] Model loaded: {m}")
                return model
            except Exception as e:
                print(f"[WARN] Failed to load {m}: {e}")
        raise RuntimeError(f"Could not load any YOLO model from {fallbacks}")

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

        print(f"[INFO] Video: {video_path}")
        print(f"[INFO] Resolution: {width}x{height} | FPS: {fps:.1f} | Frames: {total_frames} | Duration: {duration_sec:.1f}s")
        cap.release()

        # Base timestamp: default to now - video_duration
        base_ts = self.config.base_timestamp or (datetime.now(timezone.utc) - timedelta(seconds=duration_sec))

        # Video metadata for job record
        video_meta = find_video_by_id(video_id)
        video_name = video_meta["name"] if video_meta else os.path.basename(video_path)

        # Delete previous batch results for this video (idempotent re-processing)
        print(f"[INFO] Clearing previous batch results for video {video_id}")
        self.db.delete_previous_results(video_id)

        # Create job record
        job_id = self.db.create_job(video_id, video_name, video_path,
                                    self.config.model, self.config.tracker,
                                    total_frames, fps)
        print(f"[INFO] Created batch job #{job_id}")

        # Load zones and scale to video resolution
        raw_zones = load_zones(self.config.zone_config)
        sx = width / REFERENCE_WIDTH
        sy = height / REFERENCE_HEIGHT
        zones = [z.scaled(sx, sy) for z in raw_zones]
        print(f"[INFO] Loaded {len(zones)} zones (scaled {REFERENCE_WIDTH}x{REFERENCE_HEIGHT} -> {width}x{height})")

        # Load YOLO model
        model = self._load_model()

        # Initialize zone tracker
        zone_tracker = BatchZoneTracker(zones, video_id)

        # Resolve tracker config path
        tracker_path = self.config.tracker
        if not os.path.isabs(tracker_path):
            tracker_path = os.path.join(os.path.dirname(__file__), tracker_path)

        total_events_written = 0
        total_sessions_written = 0
        t0 = time.time()

        try:
            # Process every frame via model.track with persist=True
            print(f"[INFO] Starting batch analysis with {self.config.model}...")
            results_gen = model.track(
                source=video_path,
                stream=True,
                device=self.config.device,
                conf=self.config.confidence,
                iou=0.5,
                classes=[0],  # person class only
                tracker=tracker_path,
                persist=True,
                verbose=False,
            )

            frame_num = 0
            last_cleanup_frame = 0
            cleanup_interval = int(fps * 3)  # cleanup every ~3 seconds of video

            for res in results_gen:
                frame_num += 1
                video_ts = base_ts + timedelta(seconds=frame_num / fps)

                boxes = getattr(res, "boxes", None)
                if boxes is not None and boxes.shape[0] > 0:
                    ids = boxes.id
                    xyxy = boxes.xyxy
                    if ids is not None:
                        for i, track_id in enumerate(ids.cpu().numpy().astype(int)):
                            bbox = tuple(xyxy[i].cpu().numpy())
                            zone_tracker.update(track_id, bbox, video_ts, frame_num)

                # Periodic cleanup
                if frame_num - last_cleanup_frame >= cleanup_interval:
                    timeout_frames = int(fps * 3)  # 3 seconds of video time
                    zone_tracker.cleanup_inactive(frame_num, video_ts, fps, timeout_frames)
                    last_cleanup_frame = frame_num

                # Periodic DB commit
                if frame_num % self.config.commit_interval == 0:
                    ev_count = self.db.write_events(zone_tracker.pending_events, video_id)
                    ss_count = self.db.write_sessions(zone_tracker.pending_sessions, video_id)
                    total_events_written += ev_count
                    total_sessions_written += ss_count
                    zone_tracker.pending_events.clear()
                    zone_tracker.pending_sessions.clear()

                    self.db.update_job_progress(job_id, frame_num,
                                                total_events_written, total_sessions_written)

                    elapsed = time.time() - t0
                    pct = (frame_num / total_frames * 100) if total_frames > 0 else 0
                    proc_fps = frame_num / elapsed if elapsed > 0 else 0
                    eta = (total_frames - frame_num) / proc_fps if proc_fps > 0 else 0
                    print(f"  [{pct:5.1f}%] Frame {frame_num}/{total_frames} | "
                          f"{proc_fps:.1f} fps | ETA {eta:.0f}s | "
                          f"Events: {total_events_written} Sessions: {total_sessions_written}")

            # Finalize remaining active tracks
            final_ts = base_ts + timedelta(seconds=total_frames / fps)
            zone_tracker.flush_all(final_ts)

            # Write remaining pending data
            ev_count = self.db.write_events(zone_tracker.pending_events, video_id)
            ss_count = self.db.write_sessions(zone_tracker.pending_sessions, video_id)
            total_events_written += ev_count
            total_sessions_written += ss_count
            zone_tracker.pending_events.clear()
            zone_tracker.pending_sessions.clear()

            # Mark job as completed
            self.db.complete_job(job_id, total_events_written, total_sessions_written)
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

    video_path = video["path"]
    if not os.path.exists(video_path):
        print(f"[ERROR] Video file not found: {video_path}")
        sys.exit(1)

    config = BatchConfig(
        video_path=video_path,
        video_id=args.video_id,
        model=args.model,
        tracker=args.tracker,
        confidence=args.conf,
        device=args.device,
    )
    analyzer = VideoAnalyzer(config)
    analyzer.process()


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
            model=args.model,
            tracker=args.tracker,
            confidence=args.conf,
            device=args.device,
        )
        try:
            analyzer = VideoAnalyzer(config)
            analyzer.process()
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
        # Also remove job records
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

    # process
    p_proc = sub.add_parser("process", help="Process a single video")
    p_proc.add_argument("--video-id", required=True, help="Video ID from library")
    p_proc.add_argument("--model", default="yolo11l.pt", help="YOLO model (default: yolo11l.pt)")
    p_proc.add_argument("--tracker", default="botsort_tuned.yaml", help="Tracker config")
    p_proc.add_argument("--conf", type=float, default=0.30, help="Confidence threshold")
    p_proc.add_argument("--device", default="cpu", help="Inference device")

    # process-all
    p_all = sub.add_parser("process-all", help="Process all library videos")
    p_all.add_argument("--model", default="yolo11l.pt", help="YOLO model")
    p_all.add_argument("--tracker", default="botsort_tuned.yaml", help="Tracker config")
    p_all.add_argument("--conf", type=float, default=0.30, help="Confidence threshold")
    p_all.add_argument("--device", default="cpu", help="Inference device")

    # status
    sub.add_parser("status", help="Show batch job status")

    # clear
    p_clear = sub.add_parser("clear", help="Clear batch data")
    p_clear.add_argument("--video-id", default=None, help="Clear data for specific video (or all)")

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
