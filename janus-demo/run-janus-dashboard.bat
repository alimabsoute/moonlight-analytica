@echo off
echo ============================================
echo   STARTING JANUS DASHBOARD (Professional)
echo ============================================
echo.
cd /d C:\Users\alima\janus-demo\frontend-v3
echo Starting development server...
echo.
echo Dashboard will open at: http://localhost:3003
echo.
echo To use ML tracking:
echo   1. Go to Live Monitor tab
echo   2. Click "ML Detection"
echo   3. Allow camera access
echo   4. Toggle Fast/Accurate modes
echo.
start http://localhost:3003
npm run dev
