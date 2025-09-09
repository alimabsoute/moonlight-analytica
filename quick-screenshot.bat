@echo off
rem Quick Screenshot Tool for Claude Code Workflow
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
set filepath=%USERPROFILE%\Desktop\Screenshots\screenshot-%timestamp%.png

rem Create screenshots folder if it doesn't exist
if not exist "%USERPROFILE%\Desktop\Screenshots\" mkdir "%USERPROFILE%\Desktop\Screenshots\"

echo Taking screenshot...

rem Take screenshot using PowerShell
powershell -command "Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height; $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size); $bitmap.Save('%filepath%', [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bitmap.Dispose()"

echo.
echo ✅ Screenshot saved to: %filepath%
echo.
echo 📎 Ready to drag into Claude Code conversation!
echo.
echo Press any key to take another screenshot, or close this window...
pause > nul
goto :eof