#!/usr/bin/env python3
"""
Auto-crop whitespace from Amazon and NVIDIA logo images
to center them properly in news cards.
"""

from PIL import Image, ImageChops
import os

def trim_whitespace(image_path, output_path):
    """
    Automatically crop whitespace from an image.
    
    Args:
        image_path: Path to input image
        output_path: Path for cropped output image
    """
    try:
        # Open the image
        img = Image.open(image_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Create a white background image of same size
        bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
        
        # Get difference between image and white background
        diff = ImageChops.difference(img, bg)
        
        # Get bounding box of non-white content
        bbox = diff.getbbox()
        
        if bbox:
            # Crop to the bounding box with some padding
            padding = 20  # Add 20px padding around the logo
            left, top, right, bottom = bbox
            
            # Add padding but keep within image bounds
            left = max(0, left - padding)
            top = max(0, top - padding)
            right = min(img.width, right + padding)
            bottom = min(img.height, bottom + padding)
            
            # Crop the image
            cropped = img.crop((left, top, right, bottom))
            
            # Save the cropped image
            cropped.save(output_path, 'PNG', optimize=True)
            
            print(f"SUCCESS: Cropped {image_path}")
            print(f"   Original size: {img.width}x{img.height}")
            print(f"   Cropped size: {cropped.width}x{cropped.height}")
            print(f"   Saved to: {output_path}")
            
            return True
        else:
            print(f"ERROR: No content found to crop in {image_path}")
            return False
            
    except Exception as e:
        print(f"ERROR processing {image_path}: {str(e)}")
        return False

def main():
    """Process the problematic logo images."""
    print("Auto-cropping Amazon and NVIDIA logos...")
    print("=" * 50)
    
    # Define input and output paths
    images_to_process = [
        {
            'input': 'C:\\Users\\alima\\moonlight-analytica\\4a.png',
            'output': 'C:\\Users\\alima\\moonlight-analytica\\4a_cropped.png',
            'name': 'Amazon Logo'
        },
        {
            'input': 'C:\\Users\\alima\\moonlight-analytica\\5a.png', 
            'output': 'C:\\Users\\alima\\moonlight-analytica\\5a_cropped.png',
            'name': 'NVIDIA Logo'
        }
    ]
    
    success_count = 0
    
    for img_info in images_to_process:
        print(f"\nProcessing {img_info['name']}...")
        
        # Check if input file exists
        if not os.path.exists(img_info['input']):
            print(f"ERROR: Input file not found: {img_info['input']}")
            continue
            
        # Process the image
        if trim_whitespace(img_info['input'], img_info['output']):
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"Processing complete! {success_count}/{len(images_to_process)} images cropped successfully.")
    
    if success_count > 0:
        print("\nNext steps:")
        print("1. Check the cropped images: 4a_cropped.png and 5a_cropped.png")
        print("2. View test page to compare before/after")
        print("3. If satisfied, replace original files with cropped versions")

if __name__ == "__main__":
    main()