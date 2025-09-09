from PIL import Image
import os
import numpy as np

def crop_whitespace(image_path, output_path, padding=20):
    """
    Crop white space from an image, leaving a small padding around the content.
    """
    # Open the image
    img = Image.open(image_path)
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Convert to numpy array
    img_array = np.array(img)
    
    # Get the alpha channel (or create one based on non-white pixels)
    if img_array.shape[2] == 4:
        # Use alpha channel
        alpha = img_array[:, :, 3]
        non_empty = alpha > 0
    else:
        # For RGB, consider non-white pixels
        # White is (255, 255, 255), so we look for pixels that aren't white
        white_threshold = 250  # Slightly less than pure white to catch anti-aliasing
        is_white = np.all(img_array[:, :, :3] >= white_threshold, axis=2)
        non_empty = ~is_white
    
    # Find the bounding box of non-empty pixels
    rows = np.any(non_empty, axis=1)
    cols = np.any(non_empty, axis=0)
    
    if not np.any(rows) or not np.any(cols):
        print(f"Warning: {image_path} appears to be entirely white/empty")
        return
    
    # Find the bounds
    top = np.argmax(rows)
    bottom = len(rows) - np.argmax(rows[::-1])
    left = np.argmax(cols)
    right = len(cols) - np.argmax(cols[::-1])
    
    # Add padding
    height, width = img_array.shape[:2]
    top = max(0, top - padding)
    bottom = min(height, bottom + padding)
    left = max(0, left - padding)
    right = min(width, right + padding)
    
    # Crop the image
    cropped = img.crop((left, top, right, bottom))
    
    # Save the cropped image
    cropped.save(output_path, 'PNG')
    print(f"Cropped {image_path} -> {output_path}")
    print(f"  Original: {width}x{height}, Cropped: {right-left}x{bottom-top}")

def main():
    # Process images in current directory
    base_dir = r"C:\Users\alima"
    
    # Create backup folder
    backup_dir = os.path.join(base_dir, "original_images_backup")
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    # Process each 'a' image (1a.png through 10a.png)
    for i in range(1, 11):
        filename = f"{i}a.png"
        filepath = os.path.join(base_dir, filename)
        
        if os.path.exists(filepath):
            # Backup original
            backup_path = os.path.join(backup_dir, filename)
            
            # First, copy to backup if not already backed up
            if not os.path.exists(backup_path):
                img = Image.open(filepath)
                img.save(backup_path)
                print(f"Backed up {filename}")
            
            # Crop and save over the original
            crop_whitespace(filepath, filepath, padding=10)
        else:
            print(f"Warning: {filename} not found")
    
    print("\nAll images processed! The logos should now appear much larger on the news cards.")
    print(f"Original images backed up to: {backup_dir}")

if __name__ == "__main__":
    main()