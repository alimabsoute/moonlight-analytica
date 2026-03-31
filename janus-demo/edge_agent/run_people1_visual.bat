@echo off
cd /d "%~dp0"
call .venv\Scripts\activate
echo Running video streamer with VISUAL DISPLAY for people1.mp4...
echo View at: http://localhost:8001/video_feed
echo.
python video_streamer.py --source "C:/Users/alima/Videos/people1.mp4" --port 8001 --backend-url http://localhost:8000
pause
