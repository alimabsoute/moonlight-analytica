@echo off
REM Start video streamer with live tracking overlay
REM Usage: run_video_stream.bat "YOUTUBE_URL"

if "%1"=="" (
    echo Usage: run_video_stream.bat "YOUTUBE_URL"
    echo.
    echo Example:
    echo   run_video_stream.bat "https://www.youtube.com/watch?v=9_jAmVSiPQg"
    echo.
    echo This will stream video with:
    echo   - Green rectangles around tracked people
    echo   - Zone overlays (entrance, main_floor, queue, checkout)
    echo   - Track IDs and confidence scores
    echo   - Live people count
    echo.
    echo View at: http://localhost:5173 (Live Monitor tab)
    exit /b 1
)

echo ========================================
echo  Janus Live Video Streamer
echo ========================================
echo.
echo YouTube URL: %1
echo Stream Port: 8001
echo Dashboard: http://localhost:5173
echo.
echo Starting video streamer...
echo.

.venv\Scripts\python.exe video_streamer.py --youtube %1 --port 8001 --config zones.json

echo.
echo ========================================
echo  Stream Stopped
echo ========================================
