@echo off
echo ========================================
echo   EMERGENCY BACKUP RESTORATION
echo ========================================
echo.

echo WARNING: This will restore the homepage from backup
echo and overwrite any current changes.
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Restoration cancelled.
    pause
    exit /b 0
)

echo.
echo [1/4] Restoring from master backup...
if exist "C:\Users\alima\WORKING-HOMEPAGE-BACKUP.txt" (
    copy "C:\Users\alima\WORKING-HOMEPAGE-BACKUP.txt" "moonlight-complete-structure.html" >nul
    echo ✓ File restored from master backup
) else (
    echo ERROR: Master backup not found!
    echo Please manually restore from local file
    pause
    exit /b 1
)

echo [2/4] Validating restored file...
findstr /c:"analytics-quote-section" moonlight-complete-structure.html >nul
if errorlevel 1 (
    echo ERROR: Restored file is missing quote section!
    pause
    exit /b 1
)
echo ✓ Validation passed

echo [3/4] Deploying restored version...
vercel --prod --force --yes
if errorlevel 1 (
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)

echo [4/4] Updating domain...
vercel alias moonlightanalytica.com

echo.
echo ========================================
echo   RESTORATION COMPLETE!
echo ========================================
echo.
echo Your site has been restored to the last known good version.
echo Test: https://moonlightanalytica.com
echo.
pause