@echo off
title Modern Reminder App
cd /d "C:\Users\alima"
echo Starting Modern Reminder App...
python ModernReminderApp.pyw
if errorlevel 1 (
    echo Error starting the app. Press any key to exit.
    pause >nul
)