:: run_counts_only.bat â€” counts-only pipeline (no video UI). Run AFTER backend is up.
@echo off
setlocal

REM ======== CONFIGURE ========
set "RTSP_URL=C:\Path\To\your_demo_video.mp4"   REM use 0 for webcam
set "BACKEND=http://localhost:8000"
set "INTERVAL=60"
REM ===========================

cd /d "%~dp0"

if not exist .venv (
  where py >nul 2>nul && (
    py -3.11 -m venv .venv 2>nul || py -3.12 -m venv .venv 2>nul || py -3.10 -m venv .venv 2>nul || py -m venv .venv
  ) || (
    python -m venv .venv
  )
)
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo [counts_only] runningâ€¦ source=%RTSP_URL% interval=%INTERVAL%s
python edge_agent.py --rtsp "%RTSP_URL%" --backend "%BACKEND%" --interval %INTERVAL%
IF ERRORLEVEL 1 echo [counts_only] edge agent exited with a non-zero code.

echo.
echo === Sanity: KPIs 24h ===
curl -s "%BACKEND%/kpis?hours=24h" & echo.
echo.
echo === CSV header (24h) ===
for /f "delims=" %%A in ('curl -s "%BACKEND%/series.csv?hours=24h"') do (echo %%A & goto :done)
:done
echo.
echo [counts_only] Done.
endlocal
