@echo off
title Moonlight Backup System
color 0B

echo ========================================
echo    MOONLIGHT ANALYTICA BACKUP SYSTEM  
echo ========================================
echo.
echo Repository: https://github.com/alimabsoute/moonlight-analytica
echo Live Site: https://moonlightanalytica.com
echo.
echo This system will automatically commit your changes every 30 minutes
echo to protect your work and maintain version history.
echo.
echo Features:
echo - Automatic commits every 30 minutes when changes detected
echo - Only commits if files have actually changed  
echo - Includes timestamp and file count in commit message
echo - Pushes to GitHub repository for cloud backup
echo - Runs continuously in the background
echo.
echo Press any key to start the backup system, or Ctrl+C to cancel...
pause >nul

echo Starting PowerShell auto-commit system...
echo Press Ctrl+C in the PowerShell window to stop the backup system.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0auto-commit-30min.ps1"

echo.
echo Backup system stopped.
pause