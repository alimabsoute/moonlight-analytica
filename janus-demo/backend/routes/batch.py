# backend/routes/batch.py — Batch processing and pre-processed pipeline endpoints
from __future__ import annotations

import os
import sys

from flask import Blueprint, request, jsonify, Response

from db import db

batch_bp = Blueprint('batch', __name__)

EDGE_AGENT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent")
)
VIDEO_LIBRARY_DIR = os.path.join(EDGE_AGENT_DIR, "video_library")


@batch_bp.get("/api/batch/jobs")
def batch_jobs_list():
    """List all batch processing jobs."""
    with db() as con:
        rows = con.execute("SELECT * FROM batch_jobs ORDER BY id DESC").fetchall()
    return jsonify({"jobs": [dict(r) for r in rows]})


@batch_bp.get("/api/batch/jobs/<int:job_id>")
def batch_job_detail(job_id):
    """Get details for a single batch job."""
    with db() as con:
        row = con.execute("SELECT * FROM batch_jobs WHERE id=?", (job_id,)).fetchone()
    if not row:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(dict(row))


@batch_bp.post("/api/batch/start")
def batch_start():
    """Trigger batch processing for a video via subprocess."""
    import subprocess

    body = request.get_json() or {}
    video_id = body.get("video_id")
    model = body.get("model", "yolo11l.pt")
    tracker = body.get("tracker", "botsort_tuned.yaml")

    if not video_id:
        return jsonify({"error": "video_id required"}), 400

    edge_agent_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent")
    )
    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")
    batch_script = os.path.join(edge_agent_dir, "batch_processor.py")

    if not os.path.exists(batch_script):
        return jsonify({"error": "batch_processor.py not found"}), 500

    python_exe = venv_python if os.path.exists(venv_python) else sys.executable

    try:
        proc = subprocess.Popen(
            [python_exe, batch_script, "process",
             "--video-id", video_id,
             "--model", model,
             "--tracker", tracker],
            cwd=edge_agent_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE,
        )
        return jsonify({"ok": True, "video_id": video_id, "pid": proc.pid})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@batch_bp.delete("/api/batch/results/<video_id>")
def batch_clear_results(video_id):
    """Clear batch data for a specific video."""
    with db() as con:
        con.execute("DELETE FROM events WHERE source='batch' AND video_id=?", (video_id,))
        con.execute("DELETE FROM sessions WHERE source='batch' AND video_id=?", (video_id,))
        con.execute("DELETE FROM batch_jobs WHERE video_id=?", (video_id,))
        con.commit()
    return jsonify({"ok": True, "video_id": video_id})


@batch_bp.post("/api/process-video")
def process_video_start():
    """Trigger offline Roboflow cloud processing for a video."""
    import subprocess

    body = request.get_json() or {}
    video_id = body.get("video_id")
    skip = body.get("skip", 3)
    model = body.get("model")

    if not video_id:
        return jsonify({"error": "video_id required"}), 400

    edge_agent_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent")
    )
    library_dir = os.path.join(edge_agent_dir, "video_library")

    video_path = None
    for ext in [".mp4", ".avi", ".mov"]:
        candidate = os.path.join(library_dir, f"{video_id}{ext}")
        if os.path.exists(candidate):
            video_path = candidate
            break

    if not video_path:
        metadata_file = os.path.join(library_dir, "metadata.json")
        if os.path.exists(metadata_file):
            import json as _json
            with open(metadata_file, "r") as f:
                meta = _json.load(f)
            for v in meta.get("videos", []):
                if v["id"] == video_id and os.path.exists(v.get("path", "")):
                    video_path = v["path"]
                    break

    if not video_path:
        return jsonify({"error": f"Video not found for id: {video_id}"}), 404

    tracking_file = os.path.join(library_dir, f"{video_id}_tracking.json")
    if os.path.exists(tracking_file):
        return jsonify({"ok": True, "status": "already_processed",
                        "video_id": video_id})

    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")
    python_exe = venv_python if os.path.exists(venv_python) else sys.executable

    cmd = [python_exe, "process_video.py",
           "--source", video_path,
           "--skip", str(skip)]
    if model:
        cmd.extend(["--model", model])

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=edge_agent_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE,
        )
        return jsonify({"ok": True, "video_id": video_id, "pid": proc.pid,
                        "status": "started"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@batch_bp.get("/api/process-status/<video_id>")
def process_video_status(video_id):
    """Check processing progress for a video."""
    library_dir = VIDEO_LIBRARY_DIR

    tracking_file = os.path.join(library_dir, f"{video_id}_tracking.json")
    if os.path.exists(tracking_file):
        return jsonify({"video_id": video_id, "status": "completed",
                        "percent": 100, "frame": 0, "total": 0})

    progress_file = os.path.join(library_dir, f"{video_id}_progress.json")
    if os.path.exists(progress_file):
        try:
            import json as _json
            with open(progress_file, "r") as f:
                progress = _json.load(f)
            return jsonify(progress)
        except Exception:
            pass

    return jsonify({"video_id": video_id, "status": "not_started",
                    "percent": 0, "frame": 0, "total": 0})


@batch_bp.get("/api/tracking-data/<video_id>")
def get_tracking_data(video_id):
    """Serve the pre-computed tracking JSON for a video."""
    tracking_file = os.path.join(VIDEO_LIBRARY_DIR, f"{video_id}_tracking.json")

    if not os.path.exists(tracking_file):
        return jsonify({"error": "Tracking data not found. Process the video first."}), 404

    def generate():
        with open(tracking_file, "r") as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                yield chunk

    return Response(generate(), mimetype="application/json",
                    headers={"Cache-Control": "public, max-age=3600"})


@batch_bp.get("/api/tracking-metrics/<video_id>")
def get_tracking_metrics(video_id):
    """Serve pre-computed dashboard metrics for a video."""
    tracking_file = os.path.join(VIDEO_LIBRARY_DIR, f"{video_id}_tracking.json")

    if not os.path.exists(tracking_file):
        return jsonify({"error": "Tracking data not found"}), 404

    try:
        import json as _json
        with open(tracking_file, "r") as f:
            data = _json.load(f)
        return jsonify({
            "video_id": data.get("video_id"),
            "total_frames": data.get("total_frames"),
            "fps": data.get("fps"),
            "duration_s": data.get("duration_s"),
            "resolution": data.get("resolution"),
            "model": data.get("model"),
            "frame_skip": data.get("frame_skip"),
            "processing_time_s": data.get("processing_time_s"),
            "processed_at": data.get("processed_at"),
            "metrics": data.get("metrics", {}),
            "sessions": data.get("sessions", []),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
