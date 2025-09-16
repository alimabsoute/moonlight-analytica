# bootstrap_janus_edge.ps1 — creates/updates all files you need (single copy/paste)
# Usage:
#   1) Save as C:\Users\alima\bootstrap_janus_edge.ps1
#   2) Run: powershell -ExecutionPolicy Bypass -File C:\Users\alima\bootstrap_janus_edge.ps1
#   3) Edit janus-demo\run_all_counts_only.bat -> set RTSP_URL to your video (or 0 for webcam)
#   4) Double-click C:\Users\alima\janus-demo\run_all_counts_only.bat

$root = "$env:USERPROFILE\janus-demo"
$edge = Join-Path $root "edge_agent"
New-Item -ItemType Directory -Force -Path $edge | Out-Null

# ---------- edge_agent/requirements.txt ----------
@'
# Minimal CPU-friendly stack (GPU optional)
ultralytics==8.3.27
opencv-python-headless==4.10.0.84
numpy==1.26.4
requests==2.32.3
'@ | Set-Content -Encoding UTF8 -Path (Join-Path $edge 'requirements.txt')

# ---------- edge_agent/edge_agent.py ----------
@'
# Usage examples:
#   python edge_agent.py --rtsp "rtsp://user:pass@CAMERA/stream" --backend "http://localhost:8000" --interval 60
#   python edge_agent.py --rtsp 0 --backend "http://localhost:8000" --interval 60   # webcam
#
# What it does:
# - Runs YOLOv8 person detection with ByteTrack tracking
# - Counts distinct tracked persons per frame (occupancy proxy)
# - Every N seconds, posts the AVERAGE occupancy to /count on your backend
#
# Privacy:
# - No frames stored, no identities; only numeric counts are sent.

import argparse
import os
import signal
import sys
import time
from datetime import datetime, timezone

import numpy as np
import requests
from ultralytics import YOLO

_RUNNING = True
def _handle_sig(signum, frame):
    global _RUNNING
    _RUNNING = False
signal.signal(signal.SIGINT, _handle_sig)
signal.signal(signal.SIGTERM, _handle_sig)

def post_count(backend: str, value: int) -> bool:
    url = f"{backend.rstrip('/')}/count"
    payload = {"count_value": int(value)}
    try:
        r = requests.post(url, json=payload, timeout=5)
        r.raise_for_status()
        return True
    except Exception as e:
        print(f"[{datetime.now(timezone.utc).isoformat()}] POST {url} failed: {e}", file=sys.stderr)
        return False

def main():
    p = argparse.ArgumentParser(description="Edge tracker → posts average occupancy to Janus backend.")
    p.add_argument("--rtsp", required=True, help="RTSP/Video source (rtsp://..., file path, or 0 for webcam)")
    p.add_argument("--backend", default=os.getenv("JANUS_BACKEND", "http://localhost:8000"),
                   help="Janus backend base URL (default: http://localhost:8000)")
    p.add_argument("--interval", type=int, default=int(os.getenv("AGG_INTERVAL", "60")),
                   help="Aggregation interval in seconds (default: 60)")
    p.add_argument("--model", default=os.getenv("YOLO_MODEL", "yolov8n.pt"),
                   help="Ultralytics model (default: yolov8n.pt)")
    p.add_argument("--conf", type=float, default=float(os.getenv("CONF", "0.35")),
                   help="Detection confidence threshold (default: 0.35)")
    p.add_argument("--device", default=os.getenv("DEVICE", "cpu"),
                   help="Inference device: cpu or cuda:0")
    args = p.parse_args()

    print(f"[edge_agent] source={args.rtsp} backend={args.backend} interval={args.interval}s model={args.model} device={args.device}")

    model = YOLO(args.model)

    last_push = time.time()
    occup_samples = 0
    occup_sum = 0

    try:
        # Built-in ByteTrack; class 0 = 'person'
        results_gen = model.track(
            source=args.rtsp,
            stream=True,
            device=args.device,
            conf=args.conf,
            iou=0.5,
            classes=[0],
            tracker="bytetrack.yaml",
            verbose=False,
        )

        for res in results_gen:
            if not _RUNNING:
                break

            boxes = getattr(res, "boxes", None)
            people_now = 0
            if boxes is not None and getattr(boxes, "shape", [0])[0] > 0:
                ids = boxes.id
                clses = boxes.cls
                if ids is not None and clses is not None:
                    valid = (clses.cpu().numpy().astype(int) == 0)
                    track_ids = ids.cpu().numpy().astype(int)[valid]
                    people_now = int(len(np.unique(track_ids)))

            occup_samples += 1
            occup_sum += people_now

            now = time.time()
            if now - last_push >= args.interval:
                avg_occupancy = int(round(occup_sum / max(1, occup_samples)))
                last_push = now
                occup_sum = 0
                occup_samples = 0

                ok = post_count(args.backend, avg_occupancy)
                stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
                print(f"[{stamp}] interval_avg_occupancy={avg_occupancy} posted={'OK' if ok else 'FAIL'}")

    except KeyboardInterrupt:
        pass
    finally:
        if occup_samples > 0:
            avg_occupancy = int(round(occup_sum / max(1, occup_samples)))
            ok = post_count(args.backend, avg_occupancy)
            stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
            print(f"[{stamp}] final_avg_occupancy={avg_occupancy} posted={'OK' if ok else 'FAIL'}")

if __name__ == "__main__":
    main()
'@ | Set-Content -Encoding UTF8 -Path (Join-Path $edge 'edge_agent.py')

# ---------- edge_agent/run_edge_agent.bat ----------
@'
REM Edit RTSP_URL, then double-click this file (or run from CMD).
@echo off
setlocal

REM ======== CONFIGURE THESE ========
set RTSP_URL=0
set BACKEND=http://localhost:8000
set INTERVAL=60
REM =================================

cd /d "%~dp0"
if not exist ..\backend\main.py (
  echo [warn] Backend not found at ..\backend\main.py (this script assumes janus-demo layout)
)

REM Prefer a Python with widest CV/torch support
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  py -3.11 -m venv .venv 2>nul || py -3.12 -m venv .venv 2>nul || py -3.10 -m venv .venv 2>nul || py -m venv .venv
) else (
  python -m venv .venv
)

call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo [edge_agent] starting… source=%RTSP_URL% backend=%BACKEND% interval=%INTERVAL%s
echo.
python edge_agent.py --rtsp "%RTSP_URL%" --backend "%BACKEND%" --interval %INTERVAL%

endlocal
'@ | Set-Content -Encoding UTF8 -Path (Join-Path $edge 'run_edge_agent.bat')

# ---------- edge_agent/run_counts_only.bat ----------
@'
:: run_counts_only.bat — counts-only pipeline (no video UI). Run AFTER backend is up.
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

echo [counts_only] running… source=%RTSP_URL% interval=%INTERVAL%s
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
'@ | Set-Content -Encoding UTF8 -Path (Join-Path $edge 'run_counts_only.bat')

# ---------- run_all_counts_only.bat (repo root) ----------
@'
:: run_all_counts_only.bat — one-click: start backend, seed data, start edge agent (video or webcam), run checks
:: Save as: C:\Users\alima\janus-demo\run_all_counts_only.bat
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
'@ | Set-Content -Encoding UTF8 -Path (Join-Path $root 'run_all_counts_only.bat')

Write-Host "[bootstrap] Files written to $root`n - edge_agent\requirements.txt`n - edge_agent\edge_agent.py`n - edge_agent\run_edge_agent.bat`n - edge_agent\run_counts_only.bat`n - run_all_counts_only.bat" -ForegroundColor Green