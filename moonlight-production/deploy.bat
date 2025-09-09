@echo off
echo ==========================================
echo   MOONLIGHT ANALYTICA - QUICK DEPLOY
echo ==========================================

cd /d "%~dp0"

if "%1"=="test" (
    echo Running in TEST mode...
    python deploy.py --dry-run
) else (
    echo Deploying to PRODUCTION...
    python deploy.py
)

echo.
echo Done! Press any key to continue...
pause >nul