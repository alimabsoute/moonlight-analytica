@echo off
echo ========================================
echo   DEPLOYMENT VERIFICATION CHECKLIST
echo ========================================
echo.

echo Checking deployment status...
vercel ls | head -1
echo.

echo Opening verification URLs...
echo.
echo ✓ Primary domain: https://moonlightanalytica.com
start https://moonlightanalytica.com
echo.

timeout /t 3 >nul
echo Manual verification checklist:
echo.
echo [ ] Quote section with "WE ANALYZE YOUR DATA" visible
echo [ ] Capabilities section with 3 cards visible  
echo [ ] Animations working (Quantum Field + Data Flow)
echo [ ] Portrait image displaying correctly
echo [ ] Company logos updated (Amazon, NVIDIA, Intel)
echo [ ] Mobile responsiveness working
echo [ ] All sections loading without errors
echo.
echo If ANY items fail, run: restore-backup.bat
echo.
pause