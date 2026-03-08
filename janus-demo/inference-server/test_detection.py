#!/usr/bin/env python3
"""
Test script for Janus Inference Server.

Tests detection on MP4 video files by sending frames to the server.

Usage:
    python test_detection.py --video path/to/video.mp4
    python test_detection.py --video path/to/video.mp4 --output output.mp4
    python test_detection.py --health-only
"""

import argparse
import sys
import time

import cv2
import numpy as np
import requests

SERVER_URL = "http://localhost:8002"


def check_health():
    """Check if the inference server is ready."""
    try:
        r = requests.get(f"{SERVER_URL}/health", timeout=5)
        data = r.json()
        print(f"Server status: {data['status']}, model: {data['model']}")
        return data["status"] == "ready"
    except requests.ConnectionError:
        print("ERROR: Cannot connect to inference server at", SERVER_URL)
        return False


def detect_frame(frame: np.ndarray) -> dict:
    """Send a frame to the inference server and get detections."""
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    files = {"file": ("frame.jpg", buffer.tobytes(), "image/jpeg")}
    r = requests.post(f"{SERVER_URL}/detect", files=files, timeout=10)
    return r.json()


def test_video(video_path: str, output_path: str = None, skip_frames: int = 1):
    """Run detection on a video file and optionally save output."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"ERROR: Cannot open video: {video_path}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"Video: {video_path}")
    print(f"Resolution: {width}x{height}, FPS: {fps:.1f}, Frames: {total_frames}")
    print(f"Processing every {skip_frames} frame(s)...")
    print()

    writer = None
    if output_path:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    frame_num = 0
    total_detections = 0
    total_inference_ms = 0
    processed = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_num += 1

        if frame_num % skip_frames != 0:
            if writer:
                writer.write(frame)
            continue

        result = detect_frame(frame)
        processed += 1
        count = result["count"]
        inference_ms = result["inference_ms"]
        total_detections += count
        total_inference_ms += inference_ms

        # Draw bounding boxes
        for det in result["detections"]:
            x1, y1, x2, y2 = det["bbox"]
            conf = det["confidence"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(
                frame,
                f"{conf:.2f}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2,
            )

        # Status bar
        cv2.putText(
            frame,
            f"Frame {frame_num}/{total_frames} | People: {count} | {inference_ms:.0f}ms",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
        )

        if writer:
            writer.write(frame)

        # Progress output every 30 processed frames
        if processed % 30 == 0:
            avg_ms = total_inference_ms / processed
            print(
                f"  Frame {frame_num}/{total_frames} | "
                f"Detections this frame: {count} | "
                f"Avg inference: {avg_ms:.1f}ms"
            )

    cap.release()
    if writer:
        writer.release()

    avg_ms = total_inference_ms / max(processed, 1)
    avg_count = total_detections / max(processed, 1)

    print()
    print("=" * 50)
    print(f"Results: {processed} frames processed")
    print(f"  Avg detections/frame: {avg_count:.1f}")
    print(f"  Avg inference time:   {avg_ms:.1f}ms")
    print(f"  Total detections:     {total_detections}")
    if output_path:
        print(f"  Output saved to:      {output_path}")
    print("=" * 50)


def main():
    parser = argparse.ArgumentParser(description="Test Janus Inference Server")
    parser.add_argument("--video", help="Path to MP4 video file")
    parser.add_argument("--output", help="Output video path (optional)")
    parser.add_argument("--skip", type=int, default=1, help="Process every Nth frame")
    parser.add_argument("--health-only", action="store_true", help="Only check health")
    parser.add_argument("--server", default=SERVER_URL, help="Server URL")
    args = parser.parse_args()

    global SERVER_URL
    SERVER_URL = args.server

    if not check_health():
        print("Server not ready. Start it with: python server.py")
        sys.exit(1)

    if args.health_only:
        # Also get server info
        r = requests.get(f"{SERVER_URL}/info")
        info = r.json()
        print(f"Uptime: {info['uptime_s']}s")
        print(f"Requests served: {info['request_count']}")
        print(f"Model load time: {info['model_load_time_s']}s")
        return

    if not args.video:
        print("ERROR: --video path required (or use --health-only)")
        sys.exit(1)

    test_video(args.video, args.output, args.skip)


if __name__ == "__main__":
    main()
