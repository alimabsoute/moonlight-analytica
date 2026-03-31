@echo off
REM ============================================================
REM Janus Advanced Edge Agent - RF-DETR + ByteTrack
REM ============================================================
REM This script runs the enhanced tracking agent with RF-DETR-Nano
REM detection and ByteTrack tracking via Supervision zones.
REM
REM Usage:
REM   run_advanced.bat                    - Run with demo video
REM   run_advanced.bat webcam             - Run with webcam
REM   run_advanced.bat video.mp4          - Run with specific video
REM   run_advanced.bat youtube URL        - Run with YouTube video
REM ============================================================

cd /d "%~dp0"

echo ============================================================
echo JANUS ADVANCED EDGE AGENT
echo RF-DETR-Nano + ByteTrack + Supervision Zones
echo ============================================================
echo.

REM Check if virtual environment exists
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo [WARNING] Virtual environment not found. Using system Python.
)

REM Parse arguments
set SOURCE_TYPE=demo
set SOURCE_VALUE=

if "%1"=="webcam" (
    set SOURCE_TYPE=webcam
    set SOURCE_VALUE=0
) else if "%1"=="youtube" (
    set SOURCE_TYPE=youtube
    set SOURCE_VALUE=%2
) else if not "%1"=="" (
    set SOURCE_TYPE=file
    set SOURCE_VALUE=%1
)

echo Configuration:
echo   Model:    RF-DETR-Nano (Apache 2.0)
echo   Tracker:  ByteTrack (Roboflow Trackers)
echo   Zones:    Supervision PolygonZone + LineZone
echo   Source:   %SOURCE_TYPE%
echo.

REM Run based on source type
if "%SOURCE_TYPE%"=="webcam" (
    echo Starting webcam tracking...
    python edge_agent_enhanced.py --source 0 --backend http://localhost:8000 --config zones.json
) else if "%SOURCE_TYPE%"=="youtube" (
    echo Starting YouTube tracking: %SOURCE_VALUE%
    python edge_agent_enhanced.py --youtube "%SOURCE_VALUE%" --backend http://localhost:8000 --config zones.json
) else if "%SOURCE_TYPE%"=="file" (
    echo Starting file tracking: %SOURCE_VALUE%
    python edge_agent_enhanced.py --source "%SOURCE_VALUE%" --backend http://localhost:8000 --config zones.json
) else (
    echo Starting demo video tracking...
    if exist "video_library\people_walking_street_1.mp4" (
        python edge_agent_enhanced.py --source "video_library\people_walking_street_1.mp4" --backend http://localhost:8000 --config zones.json
    ) else (
        echo [ERROR] No demo video found.
        echo.
        echo Specify a video source:
        echo   run_advanced.bat webcam
        echo   run_advanced.bat path\to\video.mp4
        echo   run_advanced.bat youtube "https://youtube.com/watch?v=..."
    )
)

pause
