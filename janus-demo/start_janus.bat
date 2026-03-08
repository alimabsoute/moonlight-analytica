@echo off
echo ========================================
echo  Janus Demo - Full System Startup
echo ========================================
echo.

:: Step 1: Start backend
echo [1/2] Starting Backend (port 8000)...
cd /d "%~dp0backend"
start "Janus Backend" cmd /k ".venv\Scripts\python main.py"
timeout /t 2 /nobreak >nul
echo.

:: Step 2: Start video streamer (cloud mode - uses Roboflow API, no local GPU needed)
echo [2/2] Starting Video Streamer (port 8001, cloud inference)...
cd /d "%~dp0edge_agent"
start "Video Streamer" cmd /k ".venv\Scripts\python video_streamer.py --source video_library\57bf97a9-0d8f-4b5c-9f88-90b0062fea92.mp4 --port 8001 --mode cloud --backend-url http://localhost:8000"

echo.
echo ========================================
echo  All services started!
echo ========================================
echo.
echo   Backend:          http://localhost:8000/health
echo   Video Streamer:   http://localhost:8001/video_feed
echo   Frontend:         http://localhost:5173
echo   Detection:        Roboflow Cloud API (no local GPU needed)
echo.
echo Close the terminal windows to stop services.
