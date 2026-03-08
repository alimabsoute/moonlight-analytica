@echo off
echo ========================================
echo  Janus Demo - Full System Startup
echo ========================================
echo.

:: Step 1: Start inference server (must be ready before video streamer)
echo [1/3] Starting Inference Server (port 8002)...
cd /d "%~dp0inference-server"
start "Inference Server" cmd /k ".venv\Scripts\python server.py --model yolo11s.pt --port 8002"

:: Wait for inference server to load model and warm up
echo       Waiting for model to load...
timeout /t 8 /nobreak >nul

:: Check if inference server is ready
:check_inference
curl -s -f http://localhost:8002/health >nul 2>&1
if errorlevel 1 (
    echo       Still loading model...
    timeout /t 3 /nobreak >nul
    goto check_inference
)
echo       Inference server ready!
echo.

:: Step 2: Start backend
echo [2/3] Starting Backend (port 8000)...
cd /d "%~dp0backend"
start "Janus Backend" cmd /k ".venv\Scripts\python main.py"
timeout /t 2 /nobreak >nul
echo.

:: Step 3: Start video streamer (connects to inference server)
echo [3/3] Starting Video Streamer (port 8001)...
cd /d "%~dp0edge_agent"
start "Video Streamer" cmd /k ".venv\Scripts\python video_streamer.py --source video_library\57bf97a9-0d8f-4b5c-9f88-90b0062fea92.mp4 --port 8001 --inference-url http://localhost:8002 --backend-url http://localhost:8000"

echo.
echo ========================================
echo  All services started!
echo ========================================
echo.
echo   Inference Server: http://localhost:8002/health
echo   Backend:          http://localhost:8000/health
echo   Video Streamer:   http://localhost:8001/video_feed
echo   Frontend:         http://localhost:5173
echo.
echo Close the terminal windows to stop services.
