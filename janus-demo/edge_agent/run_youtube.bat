@echo off
REM Quick start script for YouTube video tracking
REM Usage: run_youtube.bat "https://www.youtube.com/watch?v=VIDEO_ID"

if "%1"=="" (
    echo Usage: run_youtube.bat "YOUTUBE_URL"
    echo.
    echo Example:
    echo   run_youtube.bat "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    echo.
    echo This will:
    echo   1. Extract the video stream from YouTube
    echo   2. Run YOLO person detection and tracking
    echo   3. Track people across zones
    echo   4. Stream events to backend
    echo   5. Update all dashboard KPIs in real-time
    exit /b 1
)

echo ========================================
echo  Janus YouTube Tracking Demo
echo ========================================
echo.
echo YouTube URL: %1
echo Backend: http://localhost:8000
echo Config: zones.json
echo.
echo Starting enhanced edge agent...
echo.

.venv\Scripts\python.exe edge_agent_enhanced.py --youtube %1 --backend http://localhost:8000 --config zones.json

echo.
echo ========================================
echo  Tracking Complete!
echo ========================================
