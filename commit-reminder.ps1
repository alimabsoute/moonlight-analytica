# Smart Commit Reminder for Moonlight Analytica
# Provides intelligent reminders for manual commits

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName PresentationFramework

function Show-CommitReminder {
    param(
        [string]$Message = "Time to commit your changes!",
        [string]$Title = "Moonlight Commit Reminder"
    )
    
    $msgBoxInput = [System.Windows.MessageBox]::Show(
        $Message,
        $Title,
        'YesNo',
        'Information'
    )
    
    if ($msgBoxInput -eq 'Yes') {
        Write-Host "Opening terminal for commit..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\alima\moonlight-analytica'; git status"
    }
}

Write-Host "🔔 Moonlight Smart Reminders Active" -ForegroundColor Cyan
Write-Host "Monitoring for important commit points..." -ForegroundColor Gray
Write-Host ""

$lastReminderTime = Get-Date
$sessionStartTime = Get-Date

while ($true) {
    cd "C:\Users\alima\moonlight-analytica"
    $status = git status --porcelain
    $fileCount = ($status | Measure-Object -Line).Lines
    $timeSinceLastReminder = ((Get-Date) - $lastReminderTime).TotalMinutes
    $sessionDuration = ((Get-Date) - $sessionStartTime).TotalMinutes
    
    # Reminder triggers
    $triggers = @()
    
    # Trigger 1: Many files changed (10+)
    if ($fileCount -ge 10) {
        $triggers += "You have $fileCount uncommitted files"
    }
    
    # Trigger 2: Been working for 2+ hours without reminder
    if ($sessionDuration -gt 120 -and $timeSinceLastReminder -gt 60) {
        $triggers += "You've been working for $([math]::Round($sessionDuration/60, 1)) hours"
    }
    
    # Trigger 3: Critical files changed
    $criticalFiles = $status | Where-Object { $_ -match "(index\.html|news\.html|\.env|package\.json)" }
    if ($criticalFiles) {
        $triggers += "Critical files have been modified"
    }
    
    # Show reminder if triggers exist
    if ($triggers.Count -gt 0 -and $timeSinceLastReminder -gt 30) {
        $message = "🎯 Smart Reminder Triggered:`n`n"
        $message += ($triggers -join "`n")
        $message += "`n`nCommit now for a clean history?"
        
        Show-CommitReminder -Message $message -Title "Moonlight Smart Commit"
        $lastReminderTime = Get-Date
    }
    
    # Status update every 5 minutes
    if ((Get-Date).Minute % 5 -eq 0 -and (Get-Date).Second -lt 10) {
        Write-Host "[$((Get-Date).ToString('HH:mm'))] Status: $fileCount uncommitted files | Session: $([math]::Round($sessionDuration)) min" -ForegroundColor DarkGray
    }
    
    Start-Sleep -Seconds 60  # Check every minute
}