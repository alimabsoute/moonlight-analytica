@echo off
cd /d "%~dp0"
call .venv\Scripts\activate
echo Running edge agent with people1.mp4...
python edge_agent.py --source "C:/Users/alima/Videos/people1.mp4" --backend http://localhost:8000 --interval 10
pause
