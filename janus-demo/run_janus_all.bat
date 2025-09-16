:: run_janus_all.bat — launches backend, seeds data, starts edge agent (webcam by default), runs quick checks
@echo off
setlocal

REM ======== CONFIGURE HERE ========
REM Use 0 for webcam, or put your RTSP URL below (e.g., rtsp://user:pass@CAMERA/stream)
set RTSP_URL=0
set BACKEND=http://localhost:8000
set INTERVAL=60
REM =================================

REM 1) Start backend in a new window
start "Janus Backend" cmd /c python "janus-demo\backend\main.py"

REM 2) Wait for backend to boot (up to ~20s)
echo [run_all] waiting for backend %BACKEND%...
for /l %%i in (1,1,20) do (
  timeout /t 1 /nobreak >nul
  curl -s %BACKEND%/health >nul 2>nul && goto :backend_up
)
echo [run_all] ERROR: backend did not respond on %BACKEND%/health
goto :end

:backend_up
echo [run_all] backend is up

REM 3) Seed demo data (optional)
curl -s -X POST %BACKEND%/seed_demo >nul

REM 4) Prepare edge agent environment and deps
pushd "janus-demo\edge_agent"
if not exist .venv (
  where py >nul 2>nul
  if %ERRORLEVEL% EQU 0 (
    py -3.11 -m venv .venv 2>nul || py -3.12 -m venv .venv 2>nul || py -3.10 -m venv .venv 2>nul || py -m venv .venv
  ) else (
    python -m venv .venv
  )
)
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

REM 5) Start edge agent in a new window (YOLOv8; ByteTrack; posts avg occupancy every INTERVAL secs)
set CMD=python edge_agent.py --rtsp "%RTSP_URL%" --backend "%BACKEND%" --interval %INTERVAL%
start "Janus Edge Agent" cmd /k %CMD%
popd

REM 6) Quick checks
echo.
echo === Health ===
curl -s %BACKEND%/health & echo.

echo === KPIs (last 24h) ===
curl -s "%BACKEND%/kpis?hours=24h" & echo.

echo === CSV (first 5 lines, 24h) ===
powershell -NoProfile -Command "(Invoke-WebRequest -UseBasicParsing '%BACKEND%/series.csv?hours=24h').Content -split '`n' | Select-Object -First 5"

echo === Prime a fresh point (so 10m window has data), then show KPIs (10m) ===
curl -s -H "Content-Type: application/json" -d "{\"count_value\":42}" %BACKEND%/count & echo.
curl -s "%BACKEND%/kpis?hours=10m" & echo.

echo.
echo [run_all] Done. Backend and Edge Agent are running in separate windows.
echo - Backend window title:  Janus Backend
echo - Agent  window title:   Janus Edge Agent
echo Open your dashboard:  http://localhost:5173/#analytics
:end
endlocal