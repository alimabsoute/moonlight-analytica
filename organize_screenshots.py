import os
import shutil
from datetime import datetime
from pathlib import Path

# Get the desktop path
desktop = Path(os.path.join(os.path.expanduser('~'), 'OneDrive', 'Desktop'))

# Create Screenshots folder
screenshots_folder = desktop / "Screenshots"
screenshots_folder.mkdir(exist_ok=True)

# Common screenshot patterns
screenshot_patterns = [
    'Screenshot', 'screenshot', 'Screen Shot', 'screen shot',
    'Capture', 'capture', 'Snip', 'snip', 'SS_', 'ss_'
]

# Get all files on desktop
moved_count = 0
for file in desktop.iterdir():
    if file.is_file():
        # Check if it's an image file
        if file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.bmp', '.gif']:
            # Check if filename contains screenshot patterns
            is_screenshot = any(pattern in file.name for pattern in screenshot_patterns)
            
            # Also check for date-like filenames (common for screenshots)
            if not is_screenshot:
                # Check for patterns like "2024-01-15" or "20240115" in filename
                name_parts = file.stem
                if any(char.isdigit() for char in name_parts):
                    digit_count = sum(c.isdigit() for c in name_parts)
                    if digit_count >= 6:  # Likely a date
                        is_screenshot = True
            
            if is_screenshot:
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
                    print(f"Moved: {file.name}")
                    moved_count += 1
                except Exception as e:
                    print(f"Error moving {file.name}: {e}")

print(f"\nDone! Moved {moved_count} screenshots to {screenshots_folder}")
print(f"Screenshots folder location: {screenshots_folder}")