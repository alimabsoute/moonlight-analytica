:: verify_backend.bat — quick smoke test for the Janus backend

@echo off
setlocal

echo === 1) Seed demo data =========================
curl -s -X POST http://localhost:8000/seed_demo
echo.
echo.

echo === 2) Health check ===========================
curl -s http://localhost:8000/health
echo.
echo.

echo === 3) KPIs for last 24h (should be JSON) =====
curl -s "http://localhost:8000/kpis?hours=24h"
echo.
echo.

echo === 4) CSV for last 24h (header + first few lines) ==
for /f "tokens=1-4 delims=" %%A in ('curl -s "http://localhost:8000/series.csv?hours=24h"') do (
  echo %%A
  goto :aftercsv
)
:aftercsv
echo.
echo.

echo === 5) Prove sub-hour windows work ============
echo Posting a fresh count so 10m window has data...
curl -s -H "Content-Type: application/json" -d "{\"count_value\":42}" http://localhost:8000/count
echo.
echo.

echo KPIs for last 10m (now that we added a point):
curl -s "http://localhost:8000/kpis?hours=10m"
echo.
echo.

echo Done.
endlocal