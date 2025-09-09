@echo off
title Custom Reminder App
cd /d "C:\Users\alima"
echo Starting Custom Reminder App...
python CustomReminderApp.pyw
if errorlevel 1 (
    echo Error starting the app. Press any key to exit.
    pause >nul
)