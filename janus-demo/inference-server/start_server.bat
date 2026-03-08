@echo off
echo ========================================
echo  Janus Inference Server
echo ========================================
echo.

cd /d "%~dp0"

:: Create venv if it doesn't exist
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
    echo Installing dependencies...
    .venv\Scripts\pip install -r requirements.txt
    echo.
)

:: Activate and run
echo Starting inference server on port 8002...
echo Model: yolo11s.pt (default)
echo.
.venv\Scripts\python server.py --model yolo11s.pt --port 8002
