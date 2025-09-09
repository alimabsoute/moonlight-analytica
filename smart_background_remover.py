#!/usr/bin/env python3
"""
Smart Background Remover - Intelligent transparency tool
Automatically selects the best method for background removal with fallback chain
"""

import os
import sys
import numpy as np
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
import warnings
warnings.filterwarnings("ignore")

class SmartBackgroundRemover:
    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.available_methods = self._check_available_libraries()
        
    def _log(self, message: str, level: str = "INFO"):
        """Internal logging"""
        if self.verbose:
            emoji = {"INFO": "[INFO]", "SUCCESS": "[SUCCESS]", "ERROR": "[ERROR]", "WARN": "[WARN]"}
            print(f"{emoji.get(level, '[INFO]')} {message}")
    
    def _check_available_libraries(self) -> Dict[str, bool]:
        """Check which background removal libraries are available"""
        available = {}
        
        # Check PIL/Pillow
        try:
            from PIL import Image
            available['pil'] = True
            self._log("PIL/Pillow available")
        except ImportError:
            available['pil'] = False
            self._log("PIL/Pillow not available", "WARN")
        
        # Check rembg
        try:
            from rembg import remove
            available['rembg'] = True
            self._log("rembg (AI method) available")
        except ImportError:
            available['rembg'] = False
            self._log("rembg not available - install with: pip install rembg", "WARN")
        
        # Check OpenCV
        try:
            import cv2
            available['opencv'] = True
            self._log("OpenCV available")
        except ImportError:
            available['opencv'] = False
            self._log("OpenCV not available", "WARN")
        
        # Check numpy
        try:
            import numpy
            available['numpy'] = True
        except ImportError:
            available['numpy'] = False
            self._log("NumPy not available", "WARN")
        
        return available
    
    def _analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Analyze image to determine best removal method"""
        if not self.available_methods['pil']:
            return {'method': 'none', 'confidence': 0}
        
        from PIL import Image
        
        try:
            img = Image.open(image_path).convert('RGB')
            width, height = img.size
            
            # Sample corners and edges for background detection
            corner_samples = [
                img.getpixel((0, 0)),  # top-left
                img.getpixel((width-1, 0)),  # top-right
                img.getpixel((0, height-1)),  # bottom-left
                img.getpixel((width-1, height-1))  # bottom-right
            ]
            
            # Check if corners have similar colors (indicates solid background)
            def color_distance(c1, c2):
                return sum((a - b) ** 2 for a, b in zip(c1, c2)) ** 0.5
            
            corner_similarities = []
            for i in range(len(corner_samples)):
                for j in range(i+1, len(corner_samples)):
                    corner_similarities.append(color_distance(corner_samples[i], corner_samples[j]))
            
            avg_corner_distance = sum(corner_similarities) / len(corner_similarities)
            
            # Analyze background complexity
            if avg_corner_distance < 30:  # Similar corner colors = likely solid background
                if all(sum(c) > 600 for c in corner_samples):  # Light background
                    return {
                        'method': 'simple_light',
                        'confidence': 0.9,
                        'background_color': corner_samples[0],
                        'complexity': 'simple'
                    }
                else:
                    return {
                        'method': 'simple_dark',
                        'confidence': 0.8,
                        'background_color': corner_samples[0],
                        'complexity': 'simple'
                    }
            else:
                return {
                    'method': 'complex',
                    'confidence': 0.7,
                    'complexity': 'complex'
                }
                
        except Exception as e:
            self._log(f"Image analysis failed: {e}", "WARN")
            return {'method': 'auto', 'confidence': 0.5}
    
    def _method_rembg(self, input_path: str, output_path: str) -> bool:
        """AI-based background removal using rembg"""
        if not self.available_methods['rembg']:
            return False
            
        try:
            from rembg import remove
            
            self._log("Using rembg (AI method)...")
            
            with open(input_path, 'rb') as input_file:
                input_data = input_file.read()
                output_data = remove(input_data)
            
            with open(output_path, 'wb') as output_file:
                output_file.write(output_data)
            
            return self._validate_transparency(output_path)
            
        except Exception as e:
            self._log(f"rembg method failed: {e}", "ERROR")
            return False
    
    def _method_simple_color(self, input_path: str, output_path: str, 
                           background_color: Optional[Tuple[int, int, int]] = None,
                           tolerance: int = 50) -> bool:
        """Simple color-based background removal"""
        if not (self.available_methods['pil'] and self.available_methods['numpy']):
            return False
            
        try:
            from PIL import Image
            
            self._log(f"Using simple color removal (tolerance: {tolerance})...")
            
            # Open and convert to RGBA
            img = Image.open(input_path).convert('RGBA')
            data = np.array(img)
            
            # Determine background color
            if background_color is None:
                # Use top-left corner as background
                background_color = data[0, 0][:3]
            
            self._log(f"Removing background color: {background_color}")
            
            # Create mask for similar colors
            color_diff = np.abs(data[:, :, :3] - background_color)
            mask = np.all(color_diff < tolerance, axis=2)
            
            # Set alpha channel (0 = transparent, 255 = opaque)
            data[:, :, 3] = np.where(mask, 0, 255)
            
            # Save result
            result = Image.fromarray(data, 'RGBA')
            result.save(output_path, 'PNG')
            
            return self._validate_transparency(output_path)
            
        except Exception as e:
            self._log(f"Simple color method failed: {e}", "ERROR")
            return False
    
    def _method_opencv_advanced(self, input_path: str, output_path: str) -> bool:
        """Advanced OpenCV-based background removal"""
        if not (self.available_methods['opencv'] and self.available_methods['pil']):
            return False
            
        try:
            import cv2
            from PIL import Image
            
            self._log("Using OpenCV advanced method...")
            
            # Read image
            img = cv2.imread(input_path)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply GaussianBlur to reduce noise
            gray = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Apply threshold to create binary mask
            _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
            mask = cv2.bitwise_not(mask)
            
            # Morphological operations to clean up the mask
            kernel = np.ones((3, 3), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
            
            # Apply edge smoothing
            mask = cv2.medianBlur(mask, 5)
            
            # Convert to RGBA and apply mask
            img_rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA)
            img_rgba[:, :, 3] = mask
            
            # Save using PIL for better PNG handling
            pil_img = Image.fromarray(cv2.cvtColor(img_rgba, cv2.COLOR_BGRA2RGBA))
            pil_img.save(output_path, 'PNG')
            
            return self._validate_transparency(output_path)
            
        except Exception as e:
            self._log(f"OpenCV method failed: {e}", "ERROR")
            return False
    
    def _validate_transparency(self, image_path: str) -> bool:
        """Validate that the image actually has transparency"""
        if not self.available_methods['pil']:
            return True  # Can't validate, assume success
            
        try:
            from PIL import Image
            
            img = Image.open(image_path)
            if img.mode != 'RGBA':
                return False
                
            # Check if there are actually transparent pixels
            data = np.array(img) if self.available_methods['numpy'] else None
            if data is not None:
                transparent_pixels = np.sum(data[:, :, 3] == 0)
                total_pixels = data.shape[0] * data.shape[1]
                transparency_ratio = transparent_pixels / total_pixels
                
                self._log(f"Transparency validation: {transparency_ratio:.1%} transparent pixels")
                return transparency_ratio > 0.01  # At least 1% transparent
            
            return True  # Fallback: assume success if can't check
            
        except Exception as e:
            self._log(f"Transparency validation failed: {e}", "WARN")
            return True  # Assume success if validation fails
    
    def remove_background(self, input_path: str, output_path: Optional[str] = None,
                         method: str = 'auto') -> bool:
        """
        Main function to remove background with intelligent method selection
        
        Args:
            input_path: Path to input image
            output_path: Path for output image (optional)
            method: Method to use ('auto', 'rembg', 'simple', 'opencv')
            
        Returns:
            bool: True if successful, False otherwise
        """
        # Validate input
        if not os.path.exists(input_path):
            self._log(f"Input file not found: {input_path}", "ERROR")
            return False
        
        # Set output path
        if output_path is None:
            path = Path(input_path)
            output_path = str(path.parent / f"{path.stem}_transparent.png")
        
        self._log(f"Processing: {input_path} -> {output_path}")
        
        # Analyze image for best method selection
        analysis = self._analyze_image(input_path) if method == 'auto' else {'method': method}
        suggested_method = analysis.get('method', 'auto')
        
        self._log(f"Image analysis: {analysis}")
        
        # Try methods in order of preference based on analysis
        methods_to_try = []
        
        if method == 'auto':
            if suggested_method == 'simple_light':
                methods_to_try = [
                    ('simple_light', lambda: self._method_simple_color(input_path, output_path, (255, 255, 255), 30)),
                    ('simple_aggressive', lambda: self._method_simple_color(input_path, output_path, None, 80)),
                    ('rembg', lambda: self._method_rembg(input_path, output_path)),
                    ('opencv', lambda: self._method_opencv_advanced(input_path, output_path))
                ]
            elif suggested_method == 'simple_dark':
                methods_to_try = [
                    ('simple_color', lambda: self._method_simple_color(input_path, output_path, analysis.get('background_color'), 40)),
                    ('rembg', lambda: self._method_rembg(input_path, output_path)),
                    ('opencv', lambda: self._method_opencv_advanced(input_path, output_path))
                ]
            else:  # complex background
                methods_to_try = [
                    ('rembg', lambda: self._method_rembg(input_path, output_path)),
                    ('simple_aggressive', lambda: self._method_simple_color(input_path, output_path, None, 80)),
                    ('opencv', lambda: self._method_opencv_advanced(input_path, output_path))
                ]
        else:
            # Single method requested
            if method == 'rembg':
                methods_to_try = [('rembg', lambda: self._method_rembg(input_path, output_path))]
            elif method == 'simple':
                methods_to_try = [('simple', lambda: self._method_simple_color(input_path, output_path))]
            elif method == 'opencv':
                methods_to_try = [('opencv', lambda: self._method_opencv_advanced(input_path, output_path))]
        
        # Try methods until one succeeds
        for method_name, method_func in methods_to_try:
            self._log(f"Trying {method_name} method...")
            if method_func():
                self._log(f"SUCCESS! Background removed using {method_name} method", "SUCCESS")
                self._log(f"Output saved to: {output_path}", "SUCCESS")
                return True
            else:
                self._log(f"{method_name} method failed, trying next...", "WARN")
        
        self._log("All methods failed", "ERROR")
        return False
    
    def batch_process(self, folder_path: str, method: str = 'auto') -> Dict[str, bool]:
        """Process all images in a folder"""
        results = {}
        folder = Path(folder_path)
        image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'}
        
        image_files = [f for f in folder.iterdir() 
                      if f.suffix.lower() in image_extensions]
        
        if not image_files:
            self._log("No image files found in folder", "WARN")
            return results
        
        self._log(f"Processing {len(image_files)} images...")
        
        for img_file in image_files:
            output_path = folder / f"{img_file.stem}_transparent.png"
            self._log(f"\nProcessing {img_file.name}...")
            results[str(img_file)] = self.remove_background(str(img_file), str(output_path), method)
        
        # Summary
        successful = sum(results.values())
        self._log(f"\nBatch processing complete: {successful}/{len(results)} successful")
        
        return results


def main():
    """Command line interface"""
    print("""
Smart Background Remover
========================
Intelligent background removal with automatic method selection
""")
    
    if len(sys.argv) < 2:
        print("""
Usage:
  python smart_background_remover.py <input_image> [output_image] [method]
  
Methods:
  auto    - Automatically choose best method (default)
  rembg   - AI-based removal (best for complex images)
  simple  - Color-based removal (good for solid backgrounds)
  opencv  - Advanced edge detection
  
Examples:
  python smart_background_remover.py logo.png
  python smart_background_remover.py logo.png logo_clean.png auto
  python smart_background_remover.py /path/to/folder/ auto  # Batch process
        """)
        return
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    method = sys.argv[3] if len(sys.argv) > 3 else 'auto'
    
    # Create remover instance
    remover = SmartBackgroundRemover(verbose=True)
    
    # Check if input is a directory (batch processing)
    if os.path.isdir(input_path):
        print(f"Batch processing folder: {input_path}")
        results = remover.batch_process(input_path, method)
        return
    
    # Single file processing
    success = remover.remove_background(input_path, output_path, method)
    
    if success:
        print("\nBackground removal completed successfully!")
    else:
        print("\nBackground removal failed. Try installing additional libraries:")
        print("  pip install rembg pillow numpy opencv-python")
        sys.exit(1)


# Convenience function for agent use
def remove_background_simple(input_path: str, output_path: str = None) -> bool:
    """
    Simple function for agents/scripts to use
    Returns True if successful, False otherwise
    """
    remover = SmartBackgroundRemover(verbose=False)
    return remover.remove_background(input_path, output_path, 'auto')


if __name__ == "__main__":
    main()