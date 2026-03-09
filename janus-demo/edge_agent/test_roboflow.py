#!/usr/bin/env python3
"""Quick test: verify Roboflow API connection and find working model."""

import base64
import os
import sys

import cv2
import numpy as np
import requests

# Load .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

API_KEY = os.environ.get("ROBOFLOW_API_KEY", "")

if not API_KEY:
    print("ERROR: No ROBOFLOW_API_KEY found. Check .env file.")
    sys.exit(1)

print(f"API Key: {API_KEY[:6]}...{API_KEY[-4:]}")
print()

# Create a test frame from a real video if possible, else use dummy
video_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "video_library")
test_frame = None

for root, dirs, files in os.walk(video_dir):
    for f in files:
        if f.endswith((".mp4", ".avi", ".mov")):
            cap = cv2.VideoCapture(os.path.join(root, f))
            ret, test_frame = cap.read()
            cap.release()
            if ret:
                print(f"Using real video frame from: {f}")
                break
    if test_frame is not None:
        break

if test_frame is None:
    print("No video found, using dummy frame")
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)

_, buffer = cv2.imencode(".jpg", test_frame)
img_b64 = base64.b64encode(buffer.tobytes()).decode("utf-8")

# Try multiple model endpoints to find one that works
models_to_try = [
    # Pre-trained YOLO models (Roboflow hosted)
    "yolov8s-640",
    "yolov8n-640",
    # COCO dataset models on Universe
    "coco-dataset-vdnr1/2",
    "coco/9",
    "coco/3",
    # People detection models on Universe
    "people-detection-o4rdr/4",
    "person-detection-yolov5/3",
]

print("Testing model endpoints...\n")

working_model = None

for model_id in models_to_try:
    url = f"https://detect.roboflow.com/{model_id}"
    params = {"api_key": API_KEY, "confidence": 30, "overlap": 50}

    try:
        resp = requests.post(
            url, params=params, data=img_b64,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        status = resp.status_code

        if status == 200:
            data = resp.json()
            preds = data.get("predictions", [])
            classes = set(p.get("class", "?") for p in preds)
            print(f"  [OK]   {model_id} -> {len(preds)} detections, classes: {classes or 'none'}")
            if working_model is None:
                working_model = model_id
        elif status == 403:
            print(f"  [403]  {model_id} -> Forbidden (no access)")
        elif status == 404:
            print(f"  [404]  {model_id} -> Not found")
        elif status == 401:
            print(f"  [401]  {model_id} -> Unauthorized (bad API key)")
        else:
            print(f"  [{status}]  {model_id} -> {resp.text[:100]}")

    except requests.exceptions.ConnectionError:
        print(f"  [ERR]  {model_id} -> Connection failed")
    except Exception as e:
        print(f"  [ERR]  {model_id} -> {e}")

print()

if working_model:
    print(f"WORKING MODEL: {working_model}")
    print(f"Update .env with: ROBOFLOW_MODEL={working_model}")
else:
    print("No working model found.")
    print()
    print("You may need to:")
    print("1. Go to https://universe.roboflow.com/search?q=people+detection")
    print("2. Pick a model and click 'Deploy' -> 'Use via API'")
    print("3. Copy the model ID and update .env")
