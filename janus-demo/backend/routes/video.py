# backend/routes/video.py — Video streaming and inference endpoints
from __future__ import annotations

import os
import sys

from flask import Blueprint, request, jsonify

from db import db

video_bp = Blueprint('video', __name__)

INFERENCE_URL = os.environ.get("INFERENCE_URL", "http://localhost:8002")


def _kill_streamer_on_port(port=8001):
    """Kill any process listening on the given port."""
    import subprocess, time
    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True, text=True, shell=True
        )
        for line in result.stdout.splitlines():
            if f":{port}" in line and "LISTENING" in line:
                pid = line.strip().split()[-1]
                if pid.isdigit():
                    subprocess.run(["taskkill", "/F", "/PID", pid],
                                   capture_output=True, shell=True)
        time.sleep(1)
    except Exception:
        pass


@video_bp.post("/video/start")
def start_video_stream():
    """Start video streamer with specified source."""
    import subprocess
    import os
    import requests as req

    body = request.get_json() or {}
    source = body.get("source")
    url = body.get("url")

    edge_agent_dir = os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent")
    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")

    try:
        if source == 'demo':
            demo_path = os.path.normpath(os.path.join(
                os.path.dirname(__file__), "..", "..", "frontend", "public", "demo.mp4"
            ))

            if not os.path.exists(demo_path):
                library_dir = os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent", "video_library")
                metadata_file = os.path.join(library_dir, "metadata.json")
                if os.path.exists(metadata_file):
                    import json
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                    videos = metadata.get("videos", [])
                    if videos:
                        demo_path = os.path.normpath(videos[0]["path"])

            if not os.path.exists(demo_path):
                return jsonify({"error": "No demo video found. Upload a video to the library first."}), 404

            try:
                resp = req.post(
                    "http://localhost:8001/switch",
                    params={"source": demo_path},
                    timeout=5
                )
                if resp.ok:
                    return jsonify({"ok": True, "source": source, "video_path": demo_path, "method": "switch"})
            except req.exceptions.ConnectionError:
                pass

            subprocess.Popen(
                [venv_python, "video_streamer.py", "--source", demo_path, "--port", "8001"],
                cwd=edge_agent_dir,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            return jsonify({"ok": True, "source": source, "video_path": demo_path, "method": "subprocess"})

        elif source == 'youtube' and url:
            _kill_streamer_on_port(8001)
            subprocess.Popen(
                [venv_python, "video_streamer.py", "--youtube", url, "--port", "8001"],
                cwd=edge_agent_dir,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            return jsonify({"ok": True, "source": source})

        elif source == 'webcam':
            subprocess.Popen(
                [venv_python, "video_streamer.py", "--source", "0", "--port", "8001"],
                cwd=edge_agent_dir,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            return jsonify({"ok": True, "source": source})

        elif source == 'procedural':
            return jsonify({"ok": True, "message": "Procedural mode - use seed_demo endpoint for data"})

        else:
            return jsonify({"error": "Invalid source or missing URL"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@video_bp.post("/video/upload")
def upload_video():
    """Upload MP4 video for tracking"""
    import os
    import shutil
    import subprocess

    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith('.mp4'):
        return jsonify({"error": "Only MP4 files supported"}), 400

    upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    video_path = os.path.join(upload_dir, "uploaded_video.mp4")
    file.save(video_path)

    edge_agent_dir = os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent")
    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")

    try:
        subprocess.Popen(
            [venv_python, "video_streamer.py", "--source", video_path, "--port", "8001"],
            cwd=edge_agent_dir,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
        return jsonify({"ok": True, "video_path": video_path})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@video_bp.post("/video/stop")
def stop_video():
    """Stop video streamer"""
    try:
        _kill_streamer_on_port(8001)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@video_bp.get("/video/library")
def list_videos():
    """List all videos in the library"""
    import os
    import json
    from datetime import datetime

    library_dir = os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent", "video_library")
    metadata_file = os.path.join(library_dir, "metadata.json")

    if not os.path.exists(metadata_file):
        return jsonify({"videos": []})

    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    return jsonify({"videos": metadata.get("videos", [])})


@video_bp.post("/video/library/upload")
def upload_to_library():
    """Upload MP4 video to library with metadata"""
    import os
    import json
    from datetime import datetime
    import uuid

    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith('.mp4'):
        return jsonify({"error": "Only MP4 files supported"}), 400

    video_name = request.form.get('name', file.filename.replace('.mp4', ''))
    description = request.form.get('description', '')

    library_dir = os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent", "video_library")
    os.makedirs(library_dir, exist_ok=True)

    video_id = str(uuid.uuid4())
    video_filename = f"{video_id}.mp4"
    video_path = os.path.join(library_dir, video_filename)
    file.save(video_path)

    file_size = os.path.getsize(video_path)

    metadata_file = os.path.join(library_dir, "metadata.json")
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = {"videos": []}

    video_metadata = {
        "id": video_id,
        "name": video_name,
        "description": description,
        "filename": video_filename,
        "original_filename": file.filename,
        "file_size": file_size,
        "uploaded_at": datetime.now().isoformat(),
        "path": os.path.normpath(os.path.abspath(video_path))
    }
    metadata["videos"].append(video_metadata)

    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

    return jsonify({"ok": True, "video": video_metadata})


@video_bp.delete("/video/library/<video_id>")
def delete_from_library(video_id):
    """Delete video from library"""
    import os
    import json

    library_dir = os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent", "video_library")
    metadata_file = os.path.join(library_dir, "metadata.json")

    if not os.path.exists(metadata_file):
        return jsonify({"error": "Video not found"}), 404

    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    videos = metadata.get("videos", [])
    video_to_delete = None
    for i, video in enumerate(videos):
        if video["id"] == video_id:
            video_to_delete = video
            videos.pop(i)
            break

    if not video_to_delete:
        return jsonify({"error": "Video not found"}), 404

    video_path = video_to_delete["path"]
    if os.path.exists(video_path):
        os.remove(video_path)

    metadata["videos"] = videos
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

    return jsonify({"ok": True})


@video_bp.post("/video/library/<video_id>/play")
def play_library_video(video_id):
    """Start playing a video from the library"""
    import os
    import json
    import subprocess
    import requests as req

    library_dir = os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent", "video_library")
    metadata_file = os.path.join(library_dir, "metadata.json")

    if not os.path.exists(metadata_file):
        return jsonify({"error": "Video not found"}), 404

    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    video = None
    for v in metadata.get("videos", []):
        if v["id"] == video_id:
            video = v
            break

    if not video:
        return jsonify({"error": "Video not found"}), 404

    video_path = os.path.normpath(os.path.abspath(video["path"]))

    if not os.path.exists(video_path):
        return jsonify({"error": f"Video file not found: {video_path}"}), 404

    edge_agent_dir = os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent")
    venv_python = os.path.join(edge_agent_dir, ".venv", "Scripts", "python.exe")

    try:
        resp = req.post(
            "http://localhost:8001/switch",
            params={"source": video_path},
            timeout=5
        )
        if resp.ok:
            return jsonify({"ok": True, "video": video, "switch_result": resp.json()})
        else:
            return jsonify({"error": f"Video streamer error: {resp.text}"}), resp.status_code
    except req.exceptions.ConnectionError:
        if not os.path.exists(venv_python):
            return jsonify({"error": f"Python venv not found at {venv_python}. Run setup first."}), 500
        try:
            subprocess.Popen(
                [venv_python, "video_streamer.py", "--source", video_path, "--port", "8001"],
                cwd=os.path.normpath(edge_agent_dir),
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            return jsonify({"ok": True, "video": video, "method": "subprocess_start"})
        except Exception as e:
            return jsonify({"error": f"Failed to start video streamer: {e}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@video_bp.get("/video/settings")
def get_video_settings():
    """Get current video streamer settings"""
    import requests
    try:
        resp = requests.get("http://localhost:8001/settings", timeout=5)
        if resp.ok:
            return jsonify(resp.json())
        else:
            return jsonify({"error": "Video streamer error"}), resp.status_code
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Video streamer not running"}), 503


@video_bp.post("/video/model")
def set_video_model():
    """Switch YOLO model -- proxies to inference server directly"""
    import requests as req
    model = request.args.get('model') or (request.json.get('model') if request.is_json else None)
    if not model:
        return jsonify({"error": "Missing 'model' parameter"}), 400
    try:
        resp = req.post(f"{INFERENCE_URL}/model", json={"model": model}, timeout=30)
        return jsonify(resp.json()), resp.status_code
    except req.exceptions.ConnectionError:
        pass
    try:
        resp = req.post("http://localhost:8001/model", params={"model": model}, timeout=10)
        return jsonify(resp.json()), resp.status_code
    except req.exceptions.ConnectionError:
        return jsonify({"error": "Neither inference server nor video streamer running"}), 503


@video_bp.get("/inference/health")
def inference_health():
    """Check inference server health"""
    import requests as req
    try:
        resp = req.get(f"{INFERENCE_URL}/health", timeout=5)
        return jsonify(resp.json()), resp.status_code
    except req.exceptions.ConnectionError:
        return jsonify({"status": "offline", "url": INFERENCE_URL}), 503


@video_bp.get("/inference/info")
def inference_info():
    """Get inference server info"""
    import requests as req
    try:
        resp = req.get(f"{INFERENCE_URL}/info", timeout=5)
        return jsonify(resp.json()), resp.status_code
    except req.exceptions.ConnectionError:
        return jsonify({"error": "Inference server not running"}), 503


@video_bp.post("/video/tracker")
def set_video_tracker():
    """Switch tracker algorithm"""
    import requests
    tracker = request.args.get('tracker') or (request.json.get('tracker') if request.is_json else None)
    if not tracker:
        return jsonify({"error": "Missing 'tracker' parameter"}), 400
    try:
        resp = requests.post("http://localhost:8001/tracker", params={"tracker": tracker}, timeout=10)
        return jsonify(resp.json()), resp.status_code
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Video streamer not running"}), 503


@video_bp.get("/video/library/<video_id>/file")
def serve_library_video_file(video_id):
    """Serve a video file from the library for HTML5 <video> playback."""
    from flask import send_file

    library_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "edge_agent", "video_library")
    )

    for ext in [".mp4", ".avi", ".mov"]:
        candidate = os.path.join(library_dir, f"{video_id}{ext}")
        if os.path.exists(candidate):
            return send_file(candidate, mimetype="video/mp4")

    metadata_file = os.path.join(library_dir, "metadata.json")
    if os.path.exists(metadata_file):
        import json as _json
        with open(metadata_file, "r") as f:
            meta = _json.load(f)
        for v in meta.get("videos", []):
            if v["id"] == video_id and os.path.exists(v.get("path", "")):
                return send_file(v["path"], mimetype="video/mp4")

    return jsonify({"error": "Video file not found"}), 404
