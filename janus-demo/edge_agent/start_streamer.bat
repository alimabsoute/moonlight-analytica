@echo off
cd /d "%~dp0"
call .venv\Scripts\activate
python video_streamer.py --source "%~1" --port %2
