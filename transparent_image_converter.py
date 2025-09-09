#!/usr/bin/env python3
"""
Transparent Image Converter
Advanced tool for converting images to transparent backgrounds with sophisticated error handling and testing.
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Tuple, Optional, List, Union
import hashlib
import json
import base64

try:
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
    import cv2
    from skimage import measure, morphology
    from scipy import ndimage
except ImportError as e:
    print(f"Missing required dependencies: {e}")
    print("Install with: pip install Pillow numpy opencv-python scikit-image scipy")
    sys.exit(1)


class TransparencyError(Exception):
    """Custom exception for transparency conversion errors."""
    pass


class ImageValidator:
    """Validates images and conversion results."""
    
    @staticmethod
    def validate_input_image(image_path: Path) -> bool:
        """Validate that input image exists and is readable."""
        if not image_path.exists():
            raise TransparencyError(f"Image file not found: {image_path}")
        
        if not image_path.is_file():
            raise TransparencyError(f"Path is not a file: {image_path}")
        
        try:
            with Image.open(image_path) as img:
                img.verify()
            return True
        except Exception as e:
            raise TransparencyError(f"Invalid image file {image_path}: {e}")
    
    @staticmethod
    def validate_transparency_success(original_img: Image.Image, transparent_img: Image.Image) -> bool:
        """Validate that transparency conversion was successful."""
        if transparent_img.mode != 'RGBA':
            raise TransparencyError("Output image is not in RGBA mode")
        
        # Check if image has actual transparency
        alpha_channel = transparent_img.getchannel('A')
        alpha_array = np.array(alpha_channel)
        
        # If all alpha values are 255, no transparency was added
        if np.all(alpha_array == 255):
            raise TransparencyError("No transparency detected in output image")
        
        # Check if image is completely transparent (failed conversion)
        if np.all(alpha_array == 0):
            raise TransparencyError("Image is completely transparent (conversion failed)")
        
        return True
    
    @staticmethod
    def calculate_image_hash(img: Image.Image) -> str:
        """Calculate hash of image for comparison."""
        img_bytes = img.tobytes()
        return hashlib.md5(img_bytes).hexdigest()


class TransparentImageConverter:
    """Advanced image transparency converter with multiple algorithms."""
    
    def __init__(self, debug: bool = False):
        self.debug = debug
        self.validator = ImageValidator()
        self.setup_logging()
    
    def setup_logging(self):
        """Setup logging configuration."""
        log_level = logging.DEBUG if self.debug else logging.INFO
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
    
    def detect_background_color(self, img: Image.Image) -> Tuple[int, int, int]:
        """Detect the most likely background color using corner analysis."""
        try:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            width, height = img.size
            corner_size = min(20, width // 10, height // 10)
            
            # Sample corners
            corners = [
                img.crop((0, 0, corner_size, corner_size)),  # Top-left
                img.crop((width - corner_size, 0, width, corner_size)),  # Top-right
                img.crop((0, height - corner_size, corner_size, height)),  # Bottom-left
                img.crop((width - corner_size, height - corner_size, width, height))  # Bottom-right
            ]
            
            color_counts = {}
            for corner in corners:
                colors = corner.getcolors(maxcolors=256*256*256)
                if colors:
                    for count, color in colors:
                        if color in color_counts:
                            color_counts[color] += count
                        else:
                            color_counts[color] = count
            
            if not color_counts:
                # Fallback: assume white background
                return (255, 255, 255)
            
            # Return most common color
            bg_color = max(color_counts, key=color_counts.get)
            self.logger.info(f"Detected background color: {bg_color}")
            return bg_color
            
        except Exception as e:
            self.logger.warning(f"Background detection failed: {e}, using white")
            return (255, 255, 255)
    
    def remove_background_color_based(self, img: Image.Image, tolerance: int = 30) -> Image.Image:
        """Remove background using color-based detection."""
        try:
            # Detect background color
            bg_color = self.detect_background_color(img)
            
            # Convert to RGBA
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Convert to numpy array
            data = np.array(img)
            
            # Create mask for pixels similar to background color
            diff = np.abs(data[:, :, :3].astype(int) - np.array(bg_color).astype(int))
            mask = np.all(diff <= tolerance, axis=2)
            
            # Set alpha to 0 for background pixels
            data[mask, 3] = 0
            
            return Image.fromarray(data, 'RGBA')
            
        except Exception as e:
            raise TransparencyError(f"Color-based background removal failed: {e}")
    
    def remove_background_edge_based(self, img: Image.Image) -> Image.Image:
        """Remove background using edge detection and flood fill."""
        try:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Convert to numpy array
            img_array = np.array(img)
            
            # Convert to grayscale for edge detection
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Edge detection
            edges = cv2.Canny(blurred, 50, 150)
            
            # Morphological operations to close gaps
            kernel = np.ones((3, 3), np.uint8)
            edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                raise TransparencyError("No contours found for edge-based removal")
            
            # Create mask
            mask = np.zeros(gray.shape, np.uint8)
            cv2.fillPoly(mask, contours, 255)
            
            # Convert back to PIL and add alpha channel
            result = img.convert('RGBA')
            result_array = np.array(result)
            
            # Apply mask to alpha channel
            result_array[:, :, 3] = mask
            
            return Image.fromarray(result_array, 'RGBA')
            
        except Exception as e:
            raise TransparencyError(f"Edge-based background removal failed: {e}")
    
    def remove_background_ml_based(self, img: Image.Image) -> Image.Image:
        """Remove background using machine learning approach (GrabCut)."""
        try:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            img_array = np.array(img)
            height, width = img_array.shape[:2]
            
            # Initialize mask
            mask = np.zeros((height, width), np.uint8)
            
            # Define rectangle around the image (assuming object is in center)
            rect = (width // 6, height // 6, width - width // 6, height - height // 6)
            
            # Initialize background and foreground models
            bg_model = np.zeros((1, 65), np.float64)
            fg_model = np.zeros((1, 65), np.float64)
            
            # Apply GrabCut
            cv2.grabCut(img_array, mask, rect, bg_model, fg_model, 5, cv2.GC_INIT_WITH_RECT)
            
            # Create final mask
            mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
            
            # Apply mask
            result_array = img_array * mask2[:, :, np.newaxis]
            
            # Convert to RGBA and set alpha channel
            result = Image.fromarray(result_array).convert('RGBA')
            result_array = np.array(result)
            result_array[:, :, 3] = mask2 * 255
            
            return Image.fromarray(result_array, 'RGBA')
            
        except Exception as e:
            raise TransparencyError(f"ML-based background removal failed: {e}")
    
    def convert_to_transparent(self, image_path: Path, output_path: Path = None, 
                             method: str = 'color', tolerance: int = 30) -> Path:
        """Convert image to transparent background using specified method."""
        try:
            # Validate input
            self.validator.validate_input_image(image_path)
            
            # Load image
            with Image.open(image_path) as original_img:
                original_img.load()
                
                self.logger.info(f"Processing image: {image_path}")
                self.logger.info(f"Original size: {original_img.size}, mode: {original_img.mode}")
                
                # Apply conversion method
                if method == 'color':
                    transparent_img = self.remove_background_color_based(original_img, tolerance)
                elif method == 'edge':
                    transparent_img = self.remove_background_edge_based(original_img)
                elif method == 'ml':
                    transparent_img = self.remove_background_ml_based(original_img)
                else:
                    raise TransparencyError(f"Unknown method: {method}")
                
                # Validate conversion success
                self.validator.validate_transparency_success(original_img, transparent_img)
                
                # Determine output path
                if output_path is None:
                    output_path = image_path.parent / f"{image_path.stem}_transparent.png"
                
                # Save result
                transparent_img.save(output_path, 'PNG')
                
                self.logger.info(f"Transparent image saved: {output_path}")
                return output_path
                
        except Exception as e:
            raise TransparencyError(f"Conversion failed: {e}")


class ImageComparisonTester:
    """Test suite for image transparency conversion."""
    
    def __init__(self, converter: TransparentImageConverter):
        self.converter = converter
        self.test_results = []
    
    def create_test_image(self, bg_color: Tuple[int, int, int] = (255, 255, 255), 
                         size: Tuple[int, int] = (400, 200)) -> Image.Image:
        """Create a test image with known background color."""
        img = Image.new('RGB', size, bg_color)
        draw = ImageDraw.Draw(img)
        
        # Draw some content
        draw.rectangle([50, 50, size[0]-50, size[1]-50], fill=(255, 0, 0), outline=(0, 0, 0), width=2)
        draw.text((size[0]//2-50, size[1]//2-10), "TEST", fill=(0, 0, 255))
        
        return img
    
    def test_background_detection(self) -> bool:
        """Test background color detection accuracy."""
        test_colors = [(255, 255, 255), (0, 0, 0), (128, 128, 128), (255, 0, 0)]
        
        for color in test_colors:
            test_img = self.create_test_image(bg_color=color)
            detected_color = self.converter.detect_background_color(test_img)
            
            # Allow some tolerance in color detection
            color_diff = sum(abs(a - b) for a, b in zip(color, detected_color))
            
            if color_diff > 30:  # Tolerance threshold
                self.test_results.append({
                    'test': 'background_detection',
                    'expected': color,
                    'detected': detected_color,
                    'passed': False,
                    'error': f"Color difference: {color_diff}"
                })
                return False
        
        self.test_results.append({
            'test': 'background_detection',
            'passed': True,
            'message': 'All background colors detected correctly'
        })
        return True
    
    def test_transparency_conversion(self, method: str = 'color') -> bool:
        """Test that transparency conversion works and produces different results."""
        try:
            # Create test image
            original_img = self.create_test_image()
            
            # Save temporarily
            temp_path = Path('temp_test_image.png')
            original_img.save(temp_path)
            
            try:
                # Convert to transparent
                output_path = self.converter.convert_to_transparent(temp_path, method=method)
                
                # Load converted image
                with Image.open(output_path) as transparent_img:
                    # Check if images are different
                    original_hash = ImageValidator.calculate_image_hash(original_img.convert('RGBA'))
                    transparent_hash = ImageValidator.calculate_image_hash(transparent_img)
                    
                    if original_hash == transparent_hash:
                        self.test_results.append({
                            'test': f'transparency_conversion_{method}',
                            'passed': False,
                            'error': 'Images are identical - no transparency added'
                        })
                        return False
                    
                    # Check for actual transparency
                    alpha_channel = transparent_img.getchannel('A')
                    alpha_array = np.array(alpha_channel)
                    has_transparency = np.any(alpha_array < 255)
                    
                    if not has_transparency:
                        self.test_results.append({
                            'test': f'transparency_conversion_{method}',
                            'passed': False,
                            'error': 'No transparency found in output image'
                        })
                        return False
                
                self.test_results.append({
                    'test': f'transparency_conversion_{method}',
                    'passed': True,
                    'message': 'Transparency conversion successful'
                })
                return True
                
            finally:
                # Cleanup
                if temp_path.exists():
                    temp_path.unlink()
                if output_path.exists():
                    output_path.unlink()
                    
        except Exception as e:
            self.test_results.append({
                'test': f'transparency_conversion_{method}',
                'passed': False,
                'error': str(e)
            })
            return False
    
    def run_all_tests(self) -> bool:
        """Run all tests and return overall result."""
        print("Running image transparency tests...")
        
        tests = [
            self.test_background_detection,
            lambda: self.test_transparency_conversion('color'),
            lambda: self.test_transparency_conversion('edge'),
        ]
        
        all_passed = True
        for test in tests:
            try:
                result = test()
                all_passed = all_passed and result
            except Exception as e:
                all_passed = False
                self.test_results.append({
                    'test': test.__name__,
                    'passed': False,
                    'error': str(e)
                })
        
        self.print_test_results()
        return all_passed
    
    def print_test_results(self):
        """Print test results summary."""
        print("\n" + "="*60)
        print("TEST RESULTS SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result['passed'])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "PASS" if result['passed'] else "FAIL"
            print(f"{result['test']}: {status}")
            if not result['passed'] and 'error' in result:
                print(f"  Error: {result['error']}")
            elif result['passed'] and 'message' in result:
                print(f"  {result['message']}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        print("="*60)


def create_google_logo_transparent() -> str:
    """Create a transparent version of Google logo and return as base64."""
    try:
        # Create SVG with explicit transparent background
        svg_content = '''<svg width="272" height="92" viewBox="0 0 272 92" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
<path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC04"/>
<path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
<path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
<path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
<path d="M35.29 41.41V32H67.8c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
</svg>'''
        
        # Encode to base64
        svg_b64 = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
        return f"data:image/svg+xml;base64,{svg_b64}"
        
    except Exception as e:
        raise TransparencyError(f"Failed to create Google logo: {e}")


def main():
    """Main function with command line interface."""
    parser = argparse.ArgumentParser(description='Convert images to transparent background')
    parser.add_argument('input_image', type=str, help='Input image path')
    parser.add_argument('-o', '--output', type=str, help='Output image path')
    parser.add_argument('-m', '--method', choices=['color', 'edge', 'ml'], 
                       default='color', help='Conversion method')
    parser.add_argument('-t', '--tolerance', type=int, default=30, 
                       help='Color tolerance for background removal')
    parser.add_argument('--test', action='store_true', help='Run test suite')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--google-logo', action='store_true', help='Generate Google logo base64')
    
    args = parser.parse_args()
    
    try:
        converter = TransparentImageConverter(debug=args.debug)
        
        if args.test:
            tester = ImageComparisonTester(converter)
            success = tester.run_all_tests()
            sys.exit(0 if success else 1)
        
        if args.google_logo:
            logo_b64 = create_google_logo_transparent()
            print("Google Logo Base64:")
            print(logo_b64)
            return
        
        if not args.input_image:
            parser.print_help()
            return
        
        input_path = Path(args.input_image)
        output_path = Path(args.output) if args.output else None
        
        result_path = converter.convert_to_transparent(
            input_path, output_path, args.method, args.tolerance
        )
        
        print(f"Success! Transparent image saved to: {result_path}")
        
    except TransparencyError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()