@echo off
setlocal
title Janus Dev Launcher
pushd %~dp0
cd ..
echo Starting backend...
start "janus-backend" cmd /c "cd /d backend && (python -m pip install -r requirements.txt || python -m pip install flask==3.0.0 flask-cors==4.0.0) && python main.py"
timeout /t 3 /nobreak >nul
echo Seeding demo data...
powershell -NoProfile -Command "Try { Invoke-WebRequest -UseBasicParsing -Method Post http://localhost:8000/seed_demo | Out-Null } Catch {}"
echo Starting frontend on 5173 (strict)...
start "janus-frontend" cmd /c "cd /d frontend && npm install && npm run dev -- --port 5173 --strictPort --host"
echo Opening browser...
start http://localhost:5173/#tracker
popd
endlocal