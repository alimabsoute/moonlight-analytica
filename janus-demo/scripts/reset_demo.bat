@echo off
curl -s -X POST http://localhost:8000/seed_demo >nul
start http://localhost:5173/#analytics
echo ✅ Demo data reseeded and Analytics opened.