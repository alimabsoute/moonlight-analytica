Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Get screen dimensions
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

# Create bitmap and graphics objects
$bitmap = New-Object System.Drawing.Bitmap $bounds.width, $bounds.height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Capture the screen
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.size)

# Save with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$filename = "C:\Users\alima\screenshot_$timestamp.png"
$bitmap.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Screenshot saved to: $filename"
Write-Host "File path for Claude: $filename"