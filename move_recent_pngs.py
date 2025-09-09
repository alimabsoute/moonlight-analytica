import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path

# Get the desktop path
desktop = Path(os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop'))
screenshots_folder = desktop / "Screenshots"

# Define cutoff date (last few days - let's say 7 days)
cutoff_date = datetime.now() - timedelta(days=7)

# Find and move recent PNG files
moved_count = 0
png_files = []

for file in desktop.iterdir():
    if file.is_file() and file.suffix.lower() == '.png':
        # Check if file was modified recently
        mod_time = datetime.fromtimestamp(file.stat().st_mtime)
        if mod_time > cutoff_date:
            png_files.append((file, mod_time))

# Sort by modification time (newest first)
png_files.sort(key=lambda x: x[1], reverse=True)

print(f"Found {len(png_files)} PNG files from the last 7 days:\n")

for file, mod_time in png_files:
    print(f"{file.name} - Modified: {mod_time.strftime('%Y-%m-%d %H:%M')}")
    
    try:
        # Move the file
        new_path = screenshots_folder / file.name
        # If file already exists, add number suffix
        if new_path.exists():
            counter = 1
            while new_path.exists():
                new_path = screenshots_folder / f"{file.stem}_{counter}{file.suffix}"
                counter += 1
        
        shutil.move(str(file), str(new_path))
        print(f"  -> Moved to Screenshots folder")
        moved_count += 1
    except Exception as e:
        print(f"  -> Error moving: {e}")

print(f"\nDone! Moved {moved_count} PNG files to the Screenshots folder")
print(f"Location: {screenshots_folder}")