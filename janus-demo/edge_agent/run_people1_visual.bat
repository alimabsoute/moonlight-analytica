@echo off
cd /d "%~dp0"
call .venv\Scripts\activate
echo Running edge agent with VISUAL DISPLAY for people1.mp4...
echo Press 'q' in the video window to quit
echo.
python edge_agent_visual.py --rtsp "C:/Users/alima/Videos/people1.mp4" --backend http://localhost:8000 --interval 10
pause
