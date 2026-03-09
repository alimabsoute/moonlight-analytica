@echo off
echo ============================================
echo   JANUS ML TRACKING SETUP
echo ============================================
echo.

cd /d C:\Users\alima\janus-demo

echo [1/4] Creating models folder...
if not exist "frontend-v3\public\models" mkdir "frontend-v3\public\models"

echo [2/4] Downloading YOLOv8 model for accurate tracking...
echo      (This is ~6MB, may take a moment)
curl -L -o "frontend-v3\public\models\yolov8n.onnx" "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.onnx"

if exist "frontend-v3\public\models\yolov8n.onnx" (
    echo      [OK] YOLOv8 model downloaded successfully!
) else (
    echo      [WARN] Download failed - Accurate mode will use fallback
)

echo.
echo [3/4] Installing dependencies...
cd frontend-v3
call npm install

echo.
echo [4/4] Setup complete!
echo.
echo ============================================
echo   HOW TO USE
echo ============================================
echo.
echo 1. Run: cd frontend-v3 ^&^& npm run dev
echo 2. Open browser to http://localhost:3003
echo 3. Click "Live Monitor" tab
echo 4. Click "ML Detection" button
echo 5. Allow camera access when prompted
echo 6. Toggle between "Fast" and "Accurate" modes
echo.
echo MODES:
echo   Fast (40+ FPS)    = MediaPipe + ByteTrack
echo   Accurate (9-12 FPS) = YOLOv8 + DeepSORT
echo.
echo ============================================
pause
