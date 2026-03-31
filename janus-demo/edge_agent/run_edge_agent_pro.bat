@echo off
REM Start enhanced edge agent with person trajectory tracking
REM Usage: run_edge_agent_pro.bat "VIDEO_PATH"

if "%1"=="" (
    echo Usage: run_edge_agent_pro.bat "VIDEO_PATH"
    echo.
    echo Example:
    echo   run_edge_agent_pro.bat "C:\Users\alima\Downloads\peoplewalking.mp4"
    echo.
    echo This will track:
    echo   - Individual person entries/exits
    echo   - Zone transitions (entrance - main_floor - queue - checkout)
    echo   - Per-person dwell time per zone
    echo   - Complete visitor sessions with conversion tracking
    echo.
    echo View analytics at: http://localhost:5173
    exit /b 1
)

echo ========================================
echo  Janus Enhanced Edge Agent
echo ========================================
echo.
echo Video Source: %1
echo Backend: http://localhost:8000
echo Zones Config: zones.json
echo.
echo Starting person trajectory tracking...
echo.

.venv\Scripts\python.exe edge_agent_enhanced.py --source %1 --backend http://localhost:8000 --config zones.json

echo.
echo ========================================
echo  Tracking Stopped
echo ========================================
