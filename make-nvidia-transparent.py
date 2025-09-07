#!/usr/bin/env python3
"""
NVIDIA Logo Transparency Fixer
Removes white background and ensures full transparency for NVIDIA logo
"""

from PIL import Image
import numpy as np
import os

def make_logo_transparent(input_path, output_path):
    """Remove white background and make logo fully transparent"""
    
    print(f"🔍 Processing: {input_path}")
    
    # Open the image
    img = Image.open(input_path)
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
        print("✓ Converted to RGBA mode")
    
    # Convert to numpy array for pixel manipulation
    data = np.array(img)
    
    # Get the original dimensions
    height, width = data.shape[:2]
    print(f"✓ Image dimensions: {width}x{height}")
    
    # Remove white and near-white pixels (make them transparent)
    # This targets RGB values that are very close to white
    white_threshold = 240  # Adjust this to catch more/less white pixels
    
    # Find pixels that are predominantly white
    red, green, blue = data[:,:,0], data[:,:,1], data[:,:,2]
    white_pixels = (red >= white_threshold) & (green >= white_threshold) & (blue >= white_threshold)
    
    # Make white pixels transparent
    data[white_pixels] = [255, 255, 255, 0]  # White with 0 alpha (fully transparent)
    
    # Also handle light gray pixels that might appear as white
    light_gray_threshold = 220
    light_pixels = (red >= light_gray_threshold) & (green >= light_gray_threshold) & (blue >= light_gray_threshold)
    data[light_pixels] = [255, 255, 255, 0]  # Make transparent
    
    white_pixel_count = np.sum(white_pixels)
    print(f"✓ Made {white_pixel_count} white pixels transparent")
    
    # Create new image from modified data
    result_img = Image.fromarray(data, 'RGBA')
    
    # Save the result
    result_img.save(output_path, 'PNG')
    print(f"✅ Saved transparent logo: {output_path}")
    
    return True

def main():
    """Main function to process NVIDIA logo"""
    
    print("🚀 NVIDIA LOGO TRANSPARENCY FIXER")
    print("="*50)
    
    # File paths
    input_file = "5a.png"  # Current NVIDIA logo
    output_file = "5a_transparent.png"  # New transparent version
    backup_file = "5a_original_backup.png"  # Backup of original
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"❌ Error: {input_file} not found!")
        print("Make sure you're running this from the moonlight-analytica directory")
        return False
    
    try:
        # Create backup of original
        original = Image.open(input_file)
        original.save(backup_file)
        print(f"✓ Created backup: {backup_file}")
        
        # Process the logo
        success = make_logo_transparent(input_file, output_file)
        
        if success:
            print("\n🎉 SUCCESS!")
            print(f"✓ Original backed up to: {backup_file}")
            print(f"✓ Transparent version created: {output_file}")
            print("\nNext steps:")
            print("1. Compare the files to see the difference")
            print("2. If satisfied, replace 5a.png with 5a_transparent.png")
            print("3. Deploy to see the transparent logo on your website")
            
            return True
            
    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        return False

if __name__ == "__main__":
    main()