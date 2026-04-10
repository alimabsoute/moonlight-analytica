#!/usr/bin/env python3
"""
Janus Edge Agent — RF-DETR + ByteTrack Pipeline
================================================
Runs RF-DETR person detection with ByteTrack tracking.
Counts distinct tracked persons per frame (occupancy proxy).
Every N seconds, posts the AVERAGE occupancy to /count on the backend.

Usage:
    python edge_agent.py --source "rtsp://user:pass@CAMERA/stream" --backend "http://localhost:8000" --interval 60
    python edge_agent.py --source 0 --backend "http://localhost:8000" --interval 60   # webcam
    python edge_agent.py --source video.mp4 --backend "http://localhost:8000"

Privacy:
    No frames stored, no identities; only numeric counts are sent.
"""

import argparse
import os
import signal
import sys
import time
from datetime import datetime, timezone

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


def post_count(backend: str, value: int) -> bool:
    url = f"{backend.rstrip('/')}/count"
    payload = {"count_value": int(value)}
    try:
        r = requests.post(url, json=payload, timeout=5)
        r.raise_for_status()
        return True
    except Exception as e:
        print(f"[{datetime.now(timezone.utc).isoformat()}] POST {url} failed: {e}", file=sys.stderr)
        return False


def main():
    p = argparse.ArgumentParser(description="Edge tracker — posts average occupancy to Janus backend.")
    p.add_argument("--source", required=True,
                   help="Video source (rtsp://, file path, or 0 for webcam)")
    p.add_argument("--backend", default=os.getenv("JANUS_BACKEND", "http://localhost:8000"),
                   help="Janus backend base URL (default: http://localhost:8000)")
    p.add_argument("--interval", type=int, default=int(os.getenv("AGG_INTERVAL", "60")),
                   help="Aggregation interval in seconds (default: 60)")
    p.add_argument("--conf", type=float, default=float(os.getenv("CONF", "0.40")),
                   help="Detection confidence threshold (default: 0.40)")
    p.add_argument("--resolution", type=int, default=480,
                   help="Input resolution for RF-DETR (default: 480, use 640 if FPS allows)")
    args = p.parse_args()

    print(f"[edge_agent] source={args.source} backend={args.backend} interval={args.interval}s conf={args.conf}")

    # Initialize RF-DETR (Apache 2.0)
    model = RFDETRNano()
    print("[edge_agent] RF-DETR-Nano loaded")

    # Initialize ByteTrack (Apache 2.0 via Roboflow Trackers)
    tracker = ByteTrackTracker(
        lost_track_buffer=90,            # 3 sec @ 30fps
        minimum_consecutive_frames=3,    # Confirm track after 3 frames
    )

    # Open video source
    source = int(args.source) if args.source.isdigit() else args.source
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"[ERROR] Failed to open video source: {args.source}", file=sys.stderr)
        sys.exit(1)

    last_push = time.time()
    occup_samples = 0
    occup_sum = 0

    try:
        while _RUNNING:
            ret, frame = cap.read()
            if not ret:
                # Video ended — loop for files, stop for streams
                if isinstance(source, str) and not source.startswith("rtsp"):
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                break

            # Detect persons with RF-DETR
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            detections = model.predict(rgb, threshold=args.conf)

            # Filter to person class only (class_id 1 in RF-DETR's COCO map)
            if detections.class_id is not None and len(detections) > 0:
                # RF-DETR stuffs the raw frame into data['source_image'];
                # supervision's boolean indexing fails on it. Strip before filter.
                detections.data.pop("source_image", None)
                detections.data.pop("source_shape", None)
                person_mask = detections.class_id == 1
                detections = detections[person_mask]

            # Track with ByteTrack
            detections = tracker.update(detections)

            # Count unique tracked persons
            people_now = 0
            if detections.tracker_id is not None:
                people_now = len(np.unique(detections.tracker_id))

            occup_samples += 1
            occup_sum += people_now

            # Push average occupancy at interval
            now = time.time()
            if now - last_push >= args.interval:
                avg_occupancy = int(round(occup_sum / max(1, occup_samples)))
                last_push = now
                occup_sum = 0
                occup_samples = 0

                ok = post_count(args.backend, avg_occupancy)
                stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
                print(f"[{stamp}] interval_avg_occupancy={avg_occupancy} posted={'OK' if ok else 'FAIL'}")

    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        if occup_samples > 0:
            avg_occupancy = int(round(occup_sum / max(1, occup_samples)))
            ok = post_count(args.backend, avg_occupancy)
            stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
            print(f"[{stamp}] final_avg_occupancy={avg_occupancy} posted={'OK' if ok else 'FAIL'}")


if __name__ == "__main__":
    main()
