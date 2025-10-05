#!/usr/bin/env python3
"""
Video Streamer with Tracking Overlays
=====================================
Streams video frames with bounding boxes and zone overlays via HTTP.

Usage:
    python video_streamer.py --source 0 --port 8001
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
from flask import Flask, Response, jsonify
from flask_cors import CORS
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# Global state
current_frame = None
tracked_boxes = []
zones = []
frame_lock = None


class Zone:
    def __init__(self, zone_id: int, name: str, x1: int, y1: int, x2: int, y2: int, zone_type: str = "general"):
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
            'entrance': (76, 175, 80),     # Green
            'checkout': (244, 67, 54),     # Red
            'queue': (255, 152, 0),        # Orange
            'general': (33, 150, 243)      # Blue
        }
        return colors.get(self.zone_type, (100, 100, 100))


def load_zones(config_path: str = "zones.json") -> List[Zone]:
    """Load zone configuration"""
    if not os.path.exists(config_path):
        return [
            Zone(1, "entrance", 0, 0, 200, 480, "entrance"),
            Zone(2, "main_floor", 200, 0, 440, 480, "general"),
            Zone(3, "queue", 440, 240, 540, 480, "queue"),
            Zone(4, "checkout", 540, 0, 640, 480, "checkout")
        ]

    with open(config_path, 'r') as f:
        data = json.load(f)

    return [Zone(**z) for z in data.get("zones", [])]


def get_youtube_stream_url(youtube_url: str) -> str:
    """Extract direct video stream URL from YouTube"""
    try:
        import yt_dlp
    except ImportError:
        print("[ERROR] yt-dlp not installed. Run: pip install yt-dlp")
        sys.exit(1)

    ydl_opts = {
        'format': 'best[height<=720]',
        'quiet': True,
        'no_warnings': True
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        return info['url']


def get_color_for_track_id(track_id):
    """Generate unique color for each track ID"""
    # Predefined vibrant colors for better visibility
    colors = [
        (255, 0, 0),      # Red
        (0, 255, 0),      # Green
        (0, 0, 255),      # Blue
        (255, 255, 0),    # Cyan
        (255, 0, 255),    # Magenta
        (0, 255, 255),    # Yellow
        (255, 128, 0),    # Orange
        (128, 0, 255),    # Purple
        (0, 255, 128),    # Spring Green
        (255, 0, 128),    # Rose
        (128, 255, 0),    # Chartreuse
        (0, 128, 255),    # Sky Blue
    ]
    return colors[track_id % len(colors)]


def check_person_in_zone(bbox, zone, frame_width, frame_height):
    """Check if person's center point is inside a zone"""
    # Get person's center point
    person_x = (bbox[0] + bbox[2]) / 2
    person_y = (bbox[1] + bbox[3]) / 2

    # Scale zone coordinates to frame size
    zone_x1 = (zone.x1 / 640) * frame_width
    zone_y1 = (zone.y1 / 480) * frame_height
    zone_x2 = (zone.x2 / 640) * frame_width
    zone_y2 = (zone.y2 / 480) * frame_height

    # Check if center point is in zone
    return (zone_x1 <= person_x <= zone_x2 and zone_y1 <= person_y <= zone_y2)


def draw_tracking_overlay(frame, boxes_data, zones_list):
    """Draw bounding boxes and zones on frame with zone assignment"""
    overlay = frame.copy()
    frame_height, frame_width = frame.shape[:2]

    # Scale zones to frame dimensions
    scaled_zones = []
    for zone in zones_list:
        # Scale from 640x480 to actual frame size
        scaled_x1 = int((zone.x1 / 640) * frame_width)
        scaled_y1 = int((zone.y1 / 480) * frame_height)
        scaled_x2 = int((zone.x2 / 640) * frame_width)
        scaled_y2 = int((zone.y2 / 480) * frame_height)
        scaled_zones.append((zone, scaled_x1, scaled_y1, scaled_x2, scaled_y2))

    # Draw zones with transparency
    for zone, x1, y1, x2, y2 in scaled_zones:
        color = zone.color
        # Draw filled rectangle with transparency
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
        # Draw border
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
        # Draw zone label
        cv2.putText(frame, zone.name.upper(), (x1 + 10, y1 + 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    # Blend overlay with original frame (15% transparency for subtlety)
    cv2.addWeighted(overlay, 0.15, frame, 0.85, 0, frame)

    # Assign people to zones
    zone_counts = {zone.name: 0 for zone, _, _, _, _ in scaled_zones}
    zone_counts["no_zone"] = 0

    # Draw bounding boxes with unique colors per person and zone assignment
    for box in boxes_data:
        x1, y1, x2, y2 = box['bbox']
        track_id = box['track_id']
        confidence = box['confidence']

        # Get unique color for this track ID
        color = get_color_for_track_id(track_id)

        # Check which zone this person is in
        person_zone = "NO ZONE"
        for zone in zones_list:
            if check_person_in_zone([x1, y1, x2, y2], zone, frame_width, frame_height):
                person_zone = zone.name.upper()
                zone_counts[zone.name] += 1
                break

        if person_zone == "NO ZONE":
            zone_counts["no_zone"] += 1

        # Draw rectangle around person (thicker)
        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 3)

        # Draw label background with zone info
        label = f"ID:{track_id} | {person_zone}"
        label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
        cv2.rectangle(frame, (int(x1), int(y1) - 30), (int(x1) + label_size[0] + 10, int(y1)), color, -1)

        # Draw label text (white for better visibility)
        cv2.putText(frame, label, (int(x1) + 5, int(y1) - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # Draw compact stats with zone breakdown in top-left
    stats_y = 18
    # Calculate box height based on number of zones with people
    active_zones = [name for name, count in zone_counts.items() if count > 0]
    box_height = 20 + len(active_zones) * 18
    cv2.rectangle(frame, (5, 5), (180, box_height), (0, 0, 0), -1)

    # Total people count
    stats_text = f"PEOPLE: {len(boxes_data)}"
    cv2.putText(frame, stats_text, (10, stats_y),
               cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

    # Zone breakdown (only show zones with people)
    stats_y += 18
    for zone_name in active_zones:
        count = zone_counts[zone_name]
        zone_text = f"{zone_name.upper()}: {count}"
        cv2.putText(frame, zone_text, (10, stats_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        stats_y += 18

    return frame


def generate_frames():
    """Generate video frames with tracking overlays"""
    global current_frame, tracked_boxes, zones

    while True:
        if current_frame is not None:
            # Draw overlays
            frame_with_overlay = draw_tracking_overlay(current_frame.copy(), tracked_boxes, zones)

            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame_with_overlay, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ret:
                continue

            frame_bytes = buffer.tobytes()

            # Yield frame in multipart format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        time.sleep(0.03)  # ~30 FPS


@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/health')
def health():
    """Health check"""
    return jsonify({"status": "ok", "streaming": current_frame is not None})


def run_tracking(source, model_path="yolov8n.pt", conf=0.35, device="cpu"):
    """Run tracking and update global frame state with video looping"""
    global current_frame, tracked_boxes, zones

    print(f"[INFO] Loading YOLO model: {model_path}")
    model = YOLO(model_path)

    print(f"[INFO] Starting tracking on: {source}")

    # Use OpenCV VideoCapture for manual frame control and looping
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print(f"[ERROR] Failed to open video source: {source}")
        return

    print(f"[INFO] Video opened successfully. Starting tracking with looping...")

    # Track ID persistence across loops
    tracker = None
    frame_counter = 0  # Frame skipping counter

    while True:
        ret, frame = cap.read()

        # If video ended, loop back to start
        if not ret:
            print("[INFO] Video ended, looping back to start...")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            tracker = None  # Reset tracker for new loop
            frame_counter = 0
            continue

        # Update current frame for display (always update for smooth video)
        current_frame = frame

        # Skip frames for YOLO processing (process every 3rd frame)
        frame_counter += 1
        if frame_counter % 3 != 0:
            continue

        # Run YOLO tracking on frame
        results = model.track(
            source=frame,
            persist=True,
            device=device,
            conf=conf,
            iou=0.5,
            classes=[0],  # person class
            tracker="bytetrack.yaml",
            verbose=False
        )

        # Get tracked boxes
        tracked_boxes = []

        if len(results) > 0:
            boxes = results[0].boxes

            if boxes is not None and len(boxes) > 0:
                ids = boxes.id
                xyxy = boxes.xyxy
                conf_scores = boxes.conf

                if ids is not None:
                    for i, track_id in enumerate(ids.cpu().numpy().astype(int)):
                        bbox = xyxy[i].cpu().numpy()
                        confidence = float(conf_scores[i].cpu().numpy())

                        tracked_boxes.append({
                            'track_id': int(track_id),
                            'bbox': [int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])],
                            'confidence': confidence
                        })

        # No delay - let it run at maximum speed
        # YOLO inference will naturally limit the frame rate


def main():
    import threading

    p = argparse.ArgumentParser(description="Video streamer with tracking overlays")

    # Video source
    source_group = p.add_mutually_exclusive_group(required=True)
    source_group.add_argument("--source", help="Video source (file, rtsp://, or 0 for webcam)")
    source_group.add_argument("--youtube", help="YouTube video URL")

    p.add_argument("--port", type=int, default=8001, help="HTTP server port")
    p.add_argument("--config", default="zones.json", help="Zone configuration file")
    p.add_argument("--model", default="yolov8n.pt", help="YOLO model")
    p.add_argument("--conf", type=float, default=0.35, help="Detection confidence")
    p.add_argument("--device", default="cpu", help="Inference device")
    args = p.parse_args()

    # Load zones
    global zones
    zones = load_zones(args.config)
    print(f"[INFO] Loaded {len(zones)} zones")

    # Determine video source
    if args.youtube:
        print(f"[INFO] Processing YouTube video: {args.youtube}")
        print("[INFO] Extracting stream URL...")
        video_source = get_youtube_stream_url(args.youtube)
    else:
        video_source = args.source

    # Start tracking in background thread
    tracking_thread = threading.Thread(
        target=run_tracking,
        args=(video_source, args.model, args.conf, args.device),
        daemon=True
    )
    tracking_thread.start()

    # Start Flask server
    print(f"[INFO] Starting video server on http://0.0.0.0:{args.port}")
    print(f"[INFO] Stream URL: http://localhost:{args.port}/video_feed")
    app.run(host="0.0.0.0", port=args.port, debug=False, threaded=True)


if __name__ == "__main__":
    main()
