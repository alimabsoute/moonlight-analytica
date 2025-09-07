@echo off
title Moonlight Backup System
color 0B

echo ========================================
echo    MOONLIGHT ANALYTICA BACKUP SYSTEM
echo ========================================
echo.
echo Starting hybrid backup system...
echo - Auto-commits every 30 minutes
echo - Smart reminders for important changes
echo.
echo ========================================
echo.

REM Start auto-commit in background (hidden window)
start /min powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\alima\moonlight-analytica\auto-commit.ps1" -Silent

REM Start smart reminders in minimized window
start /min powershell.exe -WindowStyle Minimized -ExecutionPolicy Bypass -File "C:\Users\alima\moonlight-analytica\commit-reminder.ps1"

echo ✅ Backup system is now running!
echo.
echo 🔄 Auto-commits: Every 30 minutes
echo 🔔 Smart reminders: Based on your work
echo.
echo You can close this window - backups continue in background
echo To stop: Close the minimized PowerShell windows
echo.
pause