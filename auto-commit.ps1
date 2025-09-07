# Auto-commit script for Moonlight Analytica
# Runs every 30 minutes to commit any changes as safety backup

param(
    [switch]$Silent = $false
)

Write-Host "🚀 Starting Moonlight Analytica Auto-Commit Service" -ForegroundColor Cyan
Write-Host "📍 Commits every 30 minutes if changes detected" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

while ($true) {
    $time = Get-Date -Format "HH:mm:ss"
    Write-Host "[$time] Checking for changes..." -ForegroundColor DarkGray
    
    cd "C:\Users\alima\moonlight-analytica"
    $status = git status --porcelain
    
    if ($status) {
        $fileCount = ($status | Measure-Object -Line).Lines
        Write-Host "✅ Found $fileCount file(s) with changes" -ForegroundColor Green
        
        # Add all changes
        git add -A
        
        # Create descriptive commit message
        $date = Get-Date -Format "yyyy-MM-dd HH:mm"
        $commitMsg = "Auto-backup: $date ($fileCount files)"
        
        # Commit changes
        git commit -m $commitMsg -q
        
        # Push to GitHub
        Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
        git push -q
        
        Write-Host "✅ Backup complete!" -ForegroundColor Green
        
        # Show Windows notification if not silent
        if (-not $Silent) {
            $notification = New-Object System.Windows.Forms.NotifyIcon
            $notification.Icon = [System.Drawing.SystemIcons]::Information
            $notification.BalloonTipTitle = "Moonlight Auto-Backup"
            $notification.BalloonTipText = "Saved $fileCount files to GitHub"
            $notification.Visible = $true
            $notification.ShowBalloonTip(3000)
        }
    } else {
        Write-Host "💤 No changes detected" -ForegroundColor DarkGray
    }
    
    Write-Host "⏰ Next check at $(((Get-Date).AddMinutes(30)).ToString('HH:mm:ss'))" -ForegroundColor DarkGray
    Write-Host "---" -ForegroundColor DarkGray
    Start-Sleep -Seconds 1800  # 30 minutes
}