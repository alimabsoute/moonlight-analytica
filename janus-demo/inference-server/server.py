#!/usr/bin/env python3
"""
Janus Inference Server
======================
Dedicated YOLO detection server. Model loads ONCE at startup,
eliminating cold-start delays. Detection-only (no tracking).

Endpoints:
    POST /detect  — Send JPEG frame, get bounding boxes
    POST /model   — Switch model at runtime
    GET  /model   — Current model + available list
    GET  /health  — Readiness check
    GET  /info    — Uptime, request count, model load time

Usage:
    python server.py --model yolo11s.pt --port 8002
"""

import argparse
import io
import os
import threading
import time

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI(title="Janus Inference Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global state ──────────────────────────────────────────────────────
model: YOLO = None
model_lock = threading.Lock()
current_model_name: str = ""
start_time: float = 0
model_load_time: float = 0
request_count: int = 0
request_count_lock = threading.Lock()

AVAILABLE_MODELS = ["yolov8n.pt", "yolo11n.pt", "yolo11s.pt", "yolo11m.pt", "yolo11l.pt"]

# Default detection settings
DEFAULT_CONF = 0.30
DEFAULT_IOU = 0.5
DEFAULT_CLASSES = [0]  # person class only


def load_model(model_name: str):
    """Load a YOLO model with warm-up inference."""
    global model, current_model_name, model_load_time

    print(f"[INFO] Loading model: {model_name}")
    t0 = time.time()

    with model_lock:
        model = YOLO(model_name)
        current_model_name = model_name

        # Warm-up inference on dummy frame to eliminate first-frame latency
        dummy = np.zeros((480, 640, 3), dtype=np.uint8)
        model.predict(source=dummy, verbose=False, conf=0.5)

    model_load_time = time.time() - t0
    print(f"[INFO] Model loaded in {model_load_time:.2f}s: {model_name}")


# ── Endpoints ─────────────────────────────────────────────────────────

@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    conf: float = DEFAULT_CONF,
    iou: float = DEFAULT_IOU,
):
    """
    Run person detection on an uploaded JPEG frame.

    Returns:
        {
            "detections": [{"bbox": [x1,y1,x2,y2], "confidence": 0.87}, ...],
            "count": 3,
            "model": "yolo11s.pt",
            "inference_ms": 12.4
        }
    """
    global request_count

    with request_count_lock:
        request_count += 1

    # Read the uploaded image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return JSONResponse(
            status_code=400,
            content={"error": "Could not decode image"},
        )

    # Run detection (NOT tracking — detection only)
    t0 = time.time()
    with model_lock:
        results = model.predict(
            source=frame,
            conf=conf,
            iou=iou,
            classes=DEFAULT_CLASSES,
            verbose=False,
        )
    inference_ms = (time.time() - t0) * 1000

    # Parse results
    detections = []
    if len(results) > 0:
        boxes = results[0].boxes
        if boxes is not None and len(boxes) > 0:
            xyxy = boxes.xyxy.cpu().numpy()
            confs = boxes.conf.cpu().numpy()

            for i in range(len(xyxy)):
                detections.append({
                    "bbox": [
                        int(xyxy[i][0]),
                        int(xyxy[i][1]),
                        int(xyxy[i][2]),
                        int(xyxy[i][3]),
                    ],
                    "confidence": round(float(confs[i]), 4),
                })

    return {
        "detections": detections,
        "count": len(detections),
        "model": current_model_name,
        "inference_ms": round(inference_ms, 1),
    }


class ModelSwitch(BaseModel):
    model: str


@app.post("/model")
async def switch_model(body: ModelSwitch):
    """Switch to a different YOLO model at runtime."""
    model_name = body.model

    if model_name not in AVAILABLE_MODELS:
        return JSONResponse(
            status_code=400,
            content={
                "error": f"Unknown model: {model_name}",
                "available": AVAILABLE_MODELS,
            },
        )

    if model_name == current_model_name:
        return {"ok": True, "model": model_name, "message": "Already loaded"}

    load_model(model_name)
    return {"ok": True, "model": model_name, "load_time_s": round(model_load_time, 2)}


@app.get("/model")
async def get_model():
    """Get current model and available models."""
    return {
        "current": current_model_name,
        "available": AVAILABLE_MODELS,
    }


@app.get("/health")
async def health():
    """Readiness check — returns 200 when model is loaded and ready."""
    ready = model is not None
    return JSONResponse(
        status_code=200 if ready else 503,
        content={
            "status": "ready" if ready else "loading",
            "model": current_model_name,
        },
    )


@app.get("/info")
async def info():
    """Server info: uptime, request count, model load time."""
    return {
        "uptime_s": round(time.time() - start_time, 1),
        "request_count": request_count,
        "model": current_model_name,
        "model_load_time_s": round(model_load_time, 2),
        "available_models": AVAILABLE_MODELS,
    }


# ── Main ──────────────────────────────────────────────────────────────

def main():
    global start_time

    parser = argparse.ArgumentParser(description="Janus Inference Server")
    parser.add_argument("--model", default="yolo11s.pt", help="YOLO model to load")
    parser.add_argument("--port", type=int, default=8002, help="Server port")
    parser.add_argument("--host", default="0.0.0.0", help="Server host")
    args = parser.parse_args()

    start_time = time.time()
    load_model(args.model)

    print(f"[INFO] Starting inference server on http://{args.host}:{args.port}")
    print(f"[INFO] Endpoints: POST /detect, POST /model, GET /model, GET /health, GET /info")
    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
