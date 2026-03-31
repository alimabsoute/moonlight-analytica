REM Edit SOURCE, then double-click this file (or run from CMD).
@echo off
setlocal

REM ======== CONFIGURE THESE ========
set SOURCE=0
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
echo [edge_agent] starting... source=%SOURCE% backend=%BACKEND% interval=%INTERVAL%s
echo.
python edge_agent.py --source "%SOURCE%" --backend "%BACKEND%" --interval %INTERVAL%

endlocal
