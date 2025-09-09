$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\alima\Desktop\Quick Screenshot.lnk")
$Shortcut.TargetPath = "C:\Users\alima\quick-screenshot.bat"
$Shortcut.WorkingDirectory = "C:\Users\alima"
$Shortcut.WindowStyle = 1
$Shortcut.Description = "Quick Screenshot for Claude Code"
$Shortcut.Save()

Write-Host "Desktop shortcut created!"