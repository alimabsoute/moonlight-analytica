@echo off
REM Optional: reseed demo data (uncomment next line if desired)
REM curl -s -X POST http://localhost:8000/seed_demo >nul

start http://localhost:5173/?auto=1#analytics
echo ✅ Opened Analytics with auto-refresh enabled (via URL param).