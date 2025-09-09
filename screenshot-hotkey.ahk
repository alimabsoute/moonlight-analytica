; AutoHotkey Script for Quick Screenshots
; Press Ctrl+Shift+S to take screenshot and save to Desktop\Screenshots
; Requires AutoHotkey installed from https://www.autohotkey.com/

^+s::  ; Ctrl+Shift+S hotkey
    ; Get current timestamp
    FormatTime, timestamp, , yyyyMMdd-HHmmss
    
    ; Create screenshots directory
    screenshotDir := A_Desktop . "\Screenshots"
    FileCreateDir, %screenshotDir%
    
    ; Define file path
    filePath := screenshotDir . "\screenshot-" . timestamp . ".png"
    
    ; Take screenshot using Windows Snipping Tool method
    Run, powershell -command "Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height; $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size); $bitmap.Save('%filePath%', [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bitmap.Dispose()"
    
    ; Wait a moment for file to save
    Sleep, 1000
    
    ; Show notification
    TrayTip, Screenshot Saved!, Screenshot saved to:`n%filePath%`n`nReady to drag into Claude Code!, 5, 1
    
    ; Optional: Open the screenshots folder
    ; Run, explorer.exe "%screenshotDir%"
return

; Press Ctrl+Shift+F to open screenshots folder quickly
^+f::
    screenshotDir := A_Desktop . "\Screenshots"
    Run, explorer.exe "%screenshotDir%"
return