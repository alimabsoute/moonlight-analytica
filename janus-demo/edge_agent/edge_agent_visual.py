# Visual edge agent with bounding boxes displayed
# Shows real-time video with YOLOv8 person detection and tracking visualization

import argparse
import os
import signal
import sys
import time
from datetime import datetime, timezone

import cv2
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
    p = argparse.ArgumentParser(description="Edge tracker with visual display")
    p.add_argument("--rtsp", required=True, help="RTSP/Video source")
    p.add_argument("--backend", default=os.getenv("JANUS_BACKEND", "http://localhost:8000"),
                   help="Janus backend base URL")
    p.add_argument("--interval", type=int, default=int(os.getenv("AGG_INTERVAL", "60")),
                   help="Aggregation interval in seconds")
    p.add_argument("--model", default=os.getenv("YOLO_MODEL", "yolov8n.pt"),
                   help="Ultralytics model")
    p.add_argument("--conf", type=float, default=float(os.getenv("CONF", "0.35")),
                   help="Detection confidence threshold")
    p.add_argument("--device", default=os.getenv("DEVICE", "cpu"),
                   help="Inference device: cpu or cuda:0")
    args = p.parse_args()

    print(f"[edge_agent_visual] source={args.rtsp} backend={args.backend} interval={args.interval}s")
    print("[VISUAL MODE] Press 'q' to quit")

    model = YOLO(args.model)

    last_push = time.time()
    occup_samples = 0
    occup_sum = 0

    try:
        # Built-in ByteTrack with visual output
        results_gen = model.track(
            source=args.rtsp,
            stream=True,
            device=args.device,
            conf=args.conf,
            iou=0.5,
            classes=[0],  # person class
            tracker="bytetrack.yaml",
            verbose=False,
            show=False,  # We'll handle display manually
        )

        for res in results_gen:
            if not _RUNNING:
                break

            # Get the frame with annotations
            frame = res.plot()  # This draws bounding boxes, IDs, and confidence scores

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

            # Add text overlay with current count
            cv2.putText(frame, f"People: {people_now}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, f"Avg: {occup_sum/max(1,occup_samples):.1f}", (10, 70),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            # Resize frame to fit screen (max width 1280)
            height, width = frame.shape[:2]
            if width > 1280:
                scale = 1280 / width
                new_width = 1280
                new_height = int(height * scale)
                frame = cv2.resize(frame, (new_width, new_height))

            # Display the frame
            cv2.imshow("Janus - People Tracking", frame)

            # Check for 'q' key to quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

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
        cv2.destroyAllWindows()
        if occup_samples > 0:
            avg_occupancy = int(round(occup_sum / max(1, occup_samples)))
            ok = post_count(args.backend, avg_occupancy)
            stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
            print(f"[{stamp}] final_avg_occupancy={avg_occupancy} posted={'OK' if ok else 'FAIL'}")

if __name__ == "__main__":
    main()
