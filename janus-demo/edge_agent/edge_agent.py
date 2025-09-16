# Usage examples:
#   python edge_agent.py --rtsp "rtsp://user:pass@CAMERA/stream" --backend "http://localhost:8000" --interval 60
#   python edge_agent.py --rtsp 0 --backend "http://localhost:8000" --interval 60   # webcam
#
# What it does:
# - Runs YOLOv8 person detection with ByteTrack tracking
# - Counts distinct tracked persons per frame (occupancy proxy)
# - Every N seconds, posts the AVERAGE occupancy to /count on your backend
#
# Privacy:
# - No frames stored, no identities; only numeric counts are sent.

import argparse
import os
import signal
import sys
import time
from datetime import datetime, timezone

import numpy as np
import requests
from ultralytics import YOLO

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
    p = argparse.ArgumentParser(description="Edge tracker → posts average occupancy to Janus backend.")
    p.add_argument("--rtsp", required=True, help="RTSP/Video source (rtsp://..., file path, or 0 for webcam)")
    p.add_argument("--backend", default=os.getenv("JANUS_BACKEND", "http://localhost:8000"),
                   help="Janus backend base URL (default: http://localhost:8000)")
    p.add_argument("--interval", type=int, default=int(os.getenv("AGG_INTERVAL", "60")),
                   help="Aggregation interval in seconds (default: 60)")
    p.add_argument("--model", default=os.getenv("YOLO_MODEL", "yolov8n.pt"),
                   help="Ultralytics model (default: yolov8n.pt)")
    p.add_argument("--conf", type=float, default=float(os.getenv("CONF", "0.35")),
                   help="Detection confidence threshold (default: 0.35)")
    p.add_argument("--device", default=os.getenv("DEVICE", "cpu"),
                   help="Inference device: cpu or cuda:0")
    args = p.parse_args()

    print(f"[edge_agent] source={args.rtsp} backend={args.backend} "
          f"interval={args.interval}s model={args.model} device={args.device}")

    model = YOLO(args.model)

    last_push = time.time()
    occup_samples = 0
    occup_sum = 0

    try:
        # Built-in ByteTrack; class 0 = 'person'
        results_gen = model.track(
            source=args.rtsp,
            stream=True,
            device=args.device,
            conf=args.conf,
            iou=0.5,
            classes=[0],
            tracker="bytetrack.yaml",
            verbose=False,
        )

        for res in results_gen:
            if not _RUNNING:
                break

            boxes = getattr(res, "boxes", None)
            people_now = 0
            if boxes is not None and getattr(boxes, "shape", [0])[0] > 0:
                ids = boxes.id
                clses = boxes.cls
                if ids is not None and clses is not None:
                    valid = (clses.cpu().numpy().astype(int) == 0)
                    track_ids = ids.cpu().numpy().astype(int)[valid]
                    people_now = int(len(np.unique(track_ids)))

            occup_samples += 1
            occup_sum += people_now

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
        if occup_samples > 0:
            avg_occupancy = int(round(occup_sum / max(1, occup_samples)))
            ok = post_count(args.backend, avg_occupancy)
            stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
            print(f"[{stamp}] final_avg_occupancy={avg_occupancy} posted={'OK' if ok else 'FAIL'}")

if __name__ == "__main__":
    main()