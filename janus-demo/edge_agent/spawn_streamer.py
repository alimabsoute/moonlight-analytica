#!/usr/bin/env python3
"""Helper script to spawn video_streamer.py in a new console window."""
import subprocess
import sys
import os

if len(sys.argv) < 3:
    print("Usage: spawn_streamer.py <video_path> <port>")
    sys.exit(1)

video_path = sys.argv[1]
port = sys.argv[2]

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
venv_python = os.path.join(script_dir, ".venv", "Scripts", "python.exe")
streamer_script = os.path.join(script_dir, "video_streamer.py")

# Spawn in new console window
subprocess.Popen(
    [venv_python, streamer_script, "--source", video_path, "--port", port],
    creationflags=subprocess.CREATE_NEW_CONSOLE,
    cwd=script_dir
)

print(f"Spawned video_streamer.py for {video_path} on port {port}")
