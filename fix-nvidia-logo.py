#!/usr/bin/env python3
"""
NVIDIA Logo Transparency Fixer
Removes white background and ensures full transparency
"""

from PIL import Image
import numpy as np

def remove_white_background(image_path, output_path):
    """Remove white background from logo and make it transparent"""
    
    print("Processing NVIDIA logo...")
    
    # Open image
    img = Image.open(image_path)
    
    # Convert to RGBA
    img = img.convert("RGBA")
    
    # Convert to numpy array
    data = np.array(img)
    
    # Get image dimensions
    height, width = data.shape[:2]
    print(f"Image size: {width}x{height}")
    
    # Remove white and light colored backgrounds
    # Target pixels that are predominantly white/light gray
    red, green, blue, alpha = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Define thresholds for white/light pixels
    white_threshold = 240
    light_threshold = 220
    
    # Find white pixels
    white_pixels = (red >= white_threshold) & (green >= white_threshold) & (blue >= white_threshold)
    
    # Find light gray pixels 
    light_pixels = (red >= light_threshold) & (green >= light_threshold) & (blue >= light_threshold)
    
    # Make these pixels transparent
    data[white_pixels] = [0, 0, 0, 0]  # Fully transparent
    data[light_pixels] = [0, 0, 0, 0]  # Fully transparent
    
    # Count processed pixels
    processed_count = np.sum(white_pixels) + np.sum(light_pixels)
    print(f"Made {processed_count} pixels transparent")
    
    # Create new image
    result = Image.fromarray(data, 'RGBA')
    
    # Save
    result.save(output_path, 'PNG')
    print(f"Saved transparent logo: {output_path}")
    
    return True

# Main execution
if __name__ == "__main__":
    print("NVIDIA Logo Transparency Fixer")
    print("==============================")
    
    try:
        # Process the logo
        input_file = "5a.png"
        output_file = "5a_fixed.png"
        
        remove_white_background(input_file, output_file)
        
        print("\nSUCCESS!")
        print(f"Original: {input_file}")
        print(f"Fixed version: {output_file}")
        print("\nTo use the fixed version:")
        print(f"1. Check {output_file} to verify it looks correct")
        print(f"2. Replace {input_file} with the fixed version")
        print("3. Deploy to see the change on your website")
        
    except FileNotFoundError:
        print("Error: 5a.png not found!")
        print("Make sure you're in the moonlight-analytica directory")
    except Exception as e:
        print(f"Error: {e}")