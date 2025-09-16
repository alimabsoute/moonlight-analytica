:: run_all_counts_only.bat — one-click: start backend, seed data, start edge agent (video or webcam), run checks
:: Save this file as: C:\Users\alima\janus-demo\run_all_counts_only.bat
:: Then double-click it (or run from CMD). Assumes repo layout:
::   C:\Users\alima\janus-demo\
::     ├─ backend\main.py
::     └─ edge_agent\ (edge_agent.py, requirements.txt)

@echo off
setlocal

REM ======== CONFIGURE HERE ========
set "BACKEND=http://localhost:8000"
set "INTERVAL=60"
set "RTSP_URL=C:\Path\To\your_demo_video.mp4"   REM <-- change to your demo video; use 0 for webcam
REM =================================

REM Move to repo root (this .bat should live in janus-demo\)
cd /d "%~dp0"

REM ---------- Start backend ----------
echo [run_all] starting backend...
start "Janus Backend" cmd /k "cd /d %CD%\backend && python main.py"

REM ---------- Wait for backend health ----------
echo [run_all] waiting for backend %BACKEND% (health)...
for /l %%i in (1,1,30) do (
  curl -s "%BACKEND%/health" >nul && goto :backend_up
  timeout /t 1 >nul
)
echo [run_all] ERROR: backend not responding. Exiting.
goto :end
:backend_up
echo [run_all] backend is up.

REM ---------- (Optional) seed demo data so charts have history ----------
curl -s -X POST "%BACKEND%/seed_demo" >nul

REM ---------- Prepare edge agent env & deps ----------
echo [run_all] preparing edge agent environment...
cd edge_agent
if not exist .venv (
  where py >nul 2>nul && (
    py -3.11 -m venv .venv 2>nul || py -3.12 -m venv .venv 2>nul || py -3.10 -m venv .venv 2>nul || py -m venv .venv
  ) || (
    python -m venv .venv
  )
)
call .venv\Scripts\activate
python -m pip install --upgrade pip >nul
pip install -r requirements.txt

REM ---------- Start edge agent (counts-only) ----------
echo [run_all] starting edge agent (source=%RTSP_URL%)...
start "Janus Edge Agent" cmd /k "cd /d %CD% && .venv\Scripts\python.exe edge_agent.py --rtsp \"%RTSP_URL%\" --backend \"%BACKEND%\" --interval %INTERVAL%"

REM (Optional alternative) Start with webcam instead of file:
REM start "Janus Edge Agent (Webcam)" cmd /k "cd /d %CD% && .venv\Scripts\python.exe edge_agent.py --rtsp 0 --backend \"%BACKEND%\" --interval %INTERVAL%"

REM ---------- Prime a point so 10m KPI always has data immediately ----------
timeout /t 3 >nul
curl -s -H "Content-Type: application/json" -d "{\"count_value\":42}" "%BACKEND%/count" >nul

REM ---------- Quick checks ----------
echo.
echo === Health ===
curl -s "%BACKEND%/health" & echo.
echo.

echo === KPIs (last 24h) ===
curl -s "%BACKEND%/kpis?hours=24h" & echo.
echo.

echo === KPIs (last 10m) ===
curl -s "%BACKEND%/kpis?hours=10m" & echo.
echo.

echo === CSV header (24h) ===
for /f "delims=" %%A in ('curl -s "%BACKEND%/series.csv?hours=24h"') do (echo %%A & goto :csv_done)
:csv_done
echo.

echo [run_all] Done. Backend and Edge Agent are running in separate windows.
echo  - Backend window title:  Janus Backend
echo  - Agent  window title:  Janus Edge Agent
echo Open your dashboard:  http://localhost:5173/#analytics

:end
endlocal