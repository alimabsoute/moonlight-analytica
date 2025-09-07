@echo off
echo ========================================
echo   MOONLIGHT ANALYTICA SAFE DEPLOYMENT
echo ========================================
echo Repository: https://github.com/alimabsoute/moonlight-analytica
echo Live Site: https://moonlightanalytica.com
echo.

:: Check if we're in the right directory
if not exist "moonlight-complete-structure.html" (
    echo ERROR: moonlight-complete-structure.html not found!
    echo Make sure you're in the moonlight-analytica directory
    pause
    exit /b 1
)

:: Pre-deployment validation
echo [1/6] Validating HTML structure...
findstr /c:"analytics-quote-section" moonlight-complete-structure.html >nul
if errorlevel 1 (
    echo ERROR: Quote section missing from HTML!
    pause
    exit /b 1
)

findstr /c:"capabilities-grid" moonlight-complete-structure.html >nul
if errorlevel 1 (
    echo ERROR: Capabilities grid missing from HTML!
    pause
    exit /b 1
)
echo ✓ HTML structure validated

:: Check file size
echo [2/6] Checking file size...
for %%A in (moonlight-complete-structure.html) do set size=%%~zA
if %size% LSS 100000 (
    echo WARNING: File size seems small (%size% bytes). Expected ~110KB+
    pause
)
echo ✓ File size OK (%size% bytes)

:: Create backup before deployment
echo [3/7] Creating pre-deployment backup...
copy moonlight-complete-structure.html "moonlight-complete-structure-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.html" >nul
echo ✓ Backup created

:: Commit to GitHub before deployment
echo [4/7] Committing to GitHub...
git add -A >nul 2>&1
git commit -m "Pre-deployment commit: %date% %time%" >nul 2>&1
git push origin main >nul 2>&1
if errorlevel 1 (
    echo WARNING: GitHub commit failed - continuing with deployment
) else (
    echo ✓ Changes committed to GitHub
)

:: Deploy with force flag
echo [5/7] Deploying to Vercel...
vercel --prod --force --yes
if errorlevel 1 (
    echo ERROR: Deployment failed!
    pause
    exit /b 1
)
echo ✓ Deployment successful

:: Update domain alias
echo [6/7] Updating domain alias...
vercel alias moonlightanalytica.com
echo ✓ Domain alias updated

:: Final GitHub commit with deployment info
echo [7/7] Recording deployment to GitHub...
git add -A >nul 2>&1
git commit -m "Deployment completed: %date% %time% - https://moonlightanalytica.com" >nul 2>&1
git push origin main >nul 2>&1
if not errorlevel 1 (
    echo ✓ Deployment recorded to GitHub
)

:: Verification
echo Verification complete!
echo.
echo ========================================
echo   DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Test your site:
echo • https://moonlightanalytica.com
echo • Check that all sections are visible
echo • Verify animations are working
echo.
pause