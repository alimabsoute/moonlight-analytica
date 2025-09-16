:: === RUN COUNTS-ONLY PIPELINE (no video window) ===
:: 1) start backend (terminal #1)
:: python janus-demo\backend\main.py

:: 2) seed demo data (optional; terminal #2)
:: curl -s -X POST http://localhost:8000/seed_demo

:: 3) run edge agent against your existing demo video (counts only)
::    - replace the path below with your video file, or set RTSP_URL=0 for webcam
@echo off
setlocal

REM ======== CONFIGURE THESE ========
set RTSP_URL="C:\Path\To\your_demo_video.mp4"
set BACKEND=http://localhost:8000
set INTERVAL=60
REM =================================

cd /d "%~dp0"

REM Setup virtual environment and dependencies
if not exist .venv (
  where py >nul 2>nul && ( py -3.11 -m venv .venv || py -3.12 -m venv .venv || py -m venv .venv ) || python -m venv .venv
)
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo [edge_agent] starting counts-only pipeline...
echo Source: %RTSP_URL%
echo Backend: %BACKEND%
echo Interval: %INTERVAL%s
echo.

REM counts-only run (no viewer window)
python edge_agent.py --rtsp %RTSP_URL% --backend %BACKEND% --interval %INTERVAL%

echo.
echo === SANITY CHECKS ===

echo === KPIs 24h ===
curl -s "%BACKEND%/kpis?hours=24h" & echo.

echo === CSV 24h (first line) ===
for /f "usebackq delims=" %%L in (`curl -s "%BACKEND%/series.csv?hours=24h"`) do (echo %%L & goto :doneCSV)
:doneCSV

endlocal