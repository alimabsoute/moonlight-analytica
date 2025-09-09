#!/usr/bin/env python3
"""
Image Verification Agent - Comprehensive Image Management System
================================================================

This agent provides automated image verification capabilities including:
- Web page screenshot capture before/after deployments
- Pixel-by-pixel image comparison
- Visual similarity detection
- Deployment validation with rollback capabilities
- Automated reporting with visual evidence

Author: Moonlight Analytica Development Team
Date: September 2024
Version: 1.0
"""

import os
import sys
import json
import time
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse

# Core dependencies
import requests
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2

# Web automation
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

# Image processing and comparison
from skimage.metrics import structural_similarity as ssim
from skimage import filters
import imagehash


@dataclass
class VerificationConfig:
    """Configuration for image verification operations"""
    screenshot_dir: str = "./verification_screenshots"
    report_dir: str = "./verification_reports"
    max_wait_time: int = 30
    viewport_width: int = 1920
    viewport_height: int = 1080
    mobile_width: int = 375
    mobile_height: int = 667
    similarity_threshold: float = 0.95
    pixel_diff_threshold: int = 10
    hash_threshold: int = 5
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class VerificationResult:
    """Results from image verification process"""
    success: bool
    similarity_score: float
    pixel_differences: int
    hash_difference: int
    before_image: str
    after_image: str
    diff_image: str
    timestamp: str
    url: str
    test_name: str
    message: str
    details: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ImageVerificationAgent:
    """
    Main agent for comprehensive image verification and management
    """
    
    def __init__(self, config: Optional[VerificationConfig] = None):
        self.config = config or VerificationConfig()
        self.logger = self._setup_logging()
        self.driver: Optional[webdriver.Chrome] = None
        self._ensure_directories()
        
    def _setup_logging(self) -> logging.Logger:
        """Setup comprehensive logging system"""
        logger = logging.getLogger('ImageVerificationAgent')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            # Create logs directory
            log_dir = Path("./verification_logs")
            log_dir.mkdir(exist_ok=True)
            
            # File handler for detailed logs
            file_handler = logging.FileHandler(
                log_dir / f"verification_{datetime.now().strftime('%Y%m%d')}.log"
            )
            file_handler.setLevel(logging.DEBUG)
            
            # Console handler for immediate feedback
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            
            # Formatter
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            file_handler.setFormatter(formatter)
            console_handler.setFormatter(formatter)
            
            logger.addHandler(file_handler)
            logger.addHandler(console_handler)
            
        return logger
        
    def _ensure_directories(self) -> None:
        """Create necessary directories for operation"""
        directories = [
            self.config.screenshot_dir,
            self.config.report_dir,
            "./verification_logs",
            "./verification_backups"
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
            
        self.logger.info(f"Verification directories ensured: {directories}")
        
    def _setup_driver(self, mobile: bool = False) -> webdriver.Chrome:
        """Setup Chrome WebDriver with optimal settings"""
        chrome_options = Options()
        
        # Essential Chrome options for reliability
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-plugins')
        chrome_options.add_argument('--disable-images')  # Load images explicitly when needed
        chrome_options.add_argument('--disable-javascript')  # Disable unless specifically needed
        
        # Set viewport size
        if mobile:
            chrome_options.add_argument(f'--window-size={self.config.mobile_width},{self.config.mobile_height}')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15')
        else:
            chrome_options.add_argument(f'--window-size={self.config.viewport_width},{self.config.viewport_height}')
            
        # Additional performance optimizations
        chrome_options.add_argument('--disable-background-timer-throttling')
        chrome_options.add_argument('--disable-backgrounding-occluded-windows')
        chrome_options.add_argument('--disable-renderer-backgrounding')
        
        try:
            driver = webdriver.Chrome(options=chrome_options)
            driver.implicitly_wait(10)
            self.logger.info(f"WebDriver initialized - Mobile: {mobile}")
            return driver
        except Exception as e:
            self.logger.error(f"Failed to initialize WebDriver: {e}")
            raise
    
    def capture_screenshot(self, url: str, output_path: str, 
                          mobile: bool = False, wait_for: Optional[str] = None) -> bool:
        """
        Capture screenshot of web page with comprehensive error handling
        
        Args:
            url: URL to capture
            output_path: Path to save screenshot
            mobile: Whether to use mobile viewport
            wait_for: CSS selector to wait for before capturing
            
        Returns:
            bool: Success status
        """
        driver = None
        try:
            driver = self._setup_driver(mobile=mobile)
            
            self.logger.info(f"Navigating to: {url}")
            driver.get(url)
            
            # Wait for page load
            WebDriverWait(driver, self.config.max_wait_time).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            
            # Wait for specific element if provided
            if wait_for:
                WebDriverWait(driver, self.config.max_wait_time).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_for))
                )
                
            # Additional wait for dynamic content
            time.sleep(2)
            
            # Enable images for screenshot
            driver.execute_script("""
                var images = document.getElementsByTagName('img');
                for(var i = 0; i < images.length; i++) {
                    images[i].style.display = 'block';
                }
            """)
            
            # Take screenshot
            screenshot_taken = driver.save_screenshot(output_path)
            
            if screenshot_taken and os.path.exists(output_path):
                self.logger.info(f"Screenshot captured: {output_path}")
                return True
            else:
                self.logger.error(f"Screenshot failed: {output_path}")
                return False
                
        except TimeoutException as e:
            self.logger.error(f"Timeout capturing screenshot for {url}: {e}")
            return False
        except WebDriverException as e:
            self.logger.error(f"WebDriver error capturing {url}: {e}")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error capturing {url}: {e}")
            return False
        finally:
            if driver:
                driver.quit()
    
    def compare_images(self, image1_path: str, image2_path: str, 
                      output_diff_path: str) -> Dict[str, Any]:
        """
        Comprehensive image comparison using multiple algorithms
        
        Args:
            image1_path: Path to first image (before)
            image2_path: Path to second image (after)
            output_diff_path: Path to save difference image
            
        Returns:
            Dict containing comparison results
        """
        try:
            # Load images
            img1 = cv2.imread(image1_path)
            img2 = cv2.imread(image2_path)
            
            if img1 is None or img2 is None:
                raise ValueError("Failed to load one or both images")
            
            # Ensure images are same size
            if img1.shape != img2.shape:
                # Resize to match smaller image
                height = min(img1.shape[0], img2.shape[0])
                width = min(img1.shape[1], img2.shape[1])
                img1 = cv2.resize(img1, (width, height))
                img2 = cv2.resize(img2, (width, height))
            
            # Convert to grayscale for analysis
            gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
            
            # 1. Structural Similarity Index (SSIM)
            ssim_score, ssim_diff = ssim(gray1, gray2, full=True)
            ssim_diff = (ssim_diff * 255).astype(np.uint8)
            
            # 2. Pixel-by-pixel difference
            pixel_diff = cv2.absdiff(gray1, gray2)
            pixel_differences = np.sum(pixel_diff > self.config.pixel_diff_threshold)
            
            # 3. Perceptual hash comparison
            pil_img1 = Image.fromarray(cv2.cvtColor(img1, cv2.COLOR_BGR2RGB))
            pil_img2 = Image.fromarray(cv2.cvtColor(img2, cv2.COLOR_BGR2RGB))
            
            hash1 = imagehash.phash(pil_img1)
            hash2 = imagehash.phash(pil_img2)
            hash_diff = hash1 - hash2
            
            # 4. Histogram comparison
            hist1 = cv2.calcHist([gray1], [0], None, [256], [0, 256])
            hist2 = cv2.calcHist([gray2], [0], None, [256], [0, 256])
            hist_correlation = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
            
            # 5. Feature-based comparison (ORB)
            orb = cv2.ORB_create()
            kp1, des1 = orb.detectAndCompute(gray1, None)
            kp2, des2 = orb.detectAndCompute(gray2, None)
            
            feature_similarity = 0.0
            if des1 is not None and des2 is not None:
                bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
                matches = bf.match(des1, des2)
                feature_similarity = len(matches) / max(len(kp1), len(kp2), 1)
            
            # Create comprehensive difference visualization
            diff_image = self._create_diff_visualization(
                img1, img2, pixel_diff, ssim_diff
            )
            cv2.imwrite(output_diff_path, diff_image)
            
            results = {
                'ssim_score': float(ssim_score),
                'pixel_differences': int(pixel_differences),
                'total_pixels': int(gray1.size),
                'pixel_diff_percentage': float(pixel_differences / gray1.size * 100),
                'hash_difference': int(hash_diff),
                'histogram_correlation': float(hist_correlation),
                'feature_similarity': float(feature_similarity),
                'images_identical': ssim_score > 0.999 and pixel_differences == 0,
                'images_similar': ssim_score > self.config.similarity_threshold,
                'hash_similar': hash_diff < self.config.hash_threshold
            }
            
            self.logger.info(f"Image comparison completed: SSIM={ssim_score:.3f}, "
                           f"PixelDiff={pixel_differences}, HashDiff={hash_diff}")
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error comparing images: {e}")
            return {
                'error': str(e),
                'ssim_score': 0.0,
                'pixel_differences': 0,
                'hash_difference': 999
            }
    
    def _create_diff_visualization(self, img1: np.ndarray, img2: np.ndarray, 
                                 pixel_diff: np.ndarray, ssim_diff: np.ndarray) -> np.ndarray:
        """Create comprehensive difference visualization"""
        height, width = img1.shape[:2]
        
        # Create 2x2 grid visualization
        grid_height = height * 2
        grid_width = width * 2
        visualization = np.zeros((grid_height, grid_width, 3), dtype=np.uint8)
        
        # Top-left: Original image 1
        visualization[0:height, 0:width] = img1
        
        # Top-right: Original image 2  
        visualization[0:height, width:grid_width] = img2
        
        # Bottom-left: Pixel difference (heatmap)
        pixel_diff_colored = cv2.applyColorMap(pixel_diff, cv2.COLORMAP_HOT)
        visualization[height:grid_height, 0:width] = pixel_diff_colored
        
        # Bottom-right: SSIM difference (heatmap)
        ssim_diff_colored = cv2.applyColorMap(ssim_diff, cv2.COLORMAP_JET)
        visualization[height:grid_height, width:grid_width] = ssim_diff_colored
        
        # Add labels
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(visualization, "Before", (10, 30), font, 1, (255, 255, 255), 2)
        cv2.putText(visualization, "After", (width + 10, 30), font, 1, (255, 255, 255), 2)
        cv2.putText(visualization, "Pixel Diff", (10, height + 30), font, 1, (255, 255, 255), 2)
        cv2.putText(visualization, "SSIM Diff", (width + 10, height + 30), font, 1, (255, 255, 255), 2)
        
        return visualization
    
    def verify_deployment(self, url: str, test_name: str, 
                         before_screenshot: Optional[str] = None,
                         mobile: bool = False) -> VerificationResult:
        """
        Complete deployment verification workflow
        
        Args:
            url: URL to verify
            test_name: Name for this verification test
            before_screenshot: Path to pre-deployment screenshot
            mobile: Whether to test mobile view
            
        Returns:
            VerificationResult with complete analysis
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        test_id = f"{test_name}_{timestamp}"
        
        # Setup paths
        screenshot_dir = Path(self.config.screenshot_dir)
        after_path = screenshot_dir / f"{test_id}_after{'_mobile' if mobile else ''}.png"
        
        if before_screenshot:
            before_path = before_screenshot
        else:
            before_path = screenshot_dir / f"{test_id}_before{'_mobile' if mobile else ''}.png"
            # Capture before screenshot
            if not self.capture_screenshot(url, str(before_path), mobile=mobile):
                return VerificationResult(
                    success=False,
                    similarity_score=0.0,
                    pixel_differences=0,
                    hash_difference=999,
                    before_image="",
                    after_image="",
                    diff_image="",
                    timestamp=timestamp,
                    url=url,
                    test_name=test_name,
                    message="Failed to capture before screenshot",
                    details={}
                )
        
        # Wait for deployment (if needed)
        self.logger.info("Waiting for deployment to complete...")
        time.sleep(5)  # Configurable delay
        
        # Capture after screenshot
        if not self.capture_screenshot(url, str(after_path), mobile=mobile):
            return VerificationResult(
                success=False,
                similarity_score=0.0,
                pixel_differences=0,
                hash_difference=999,
                before_image=str(before_path),
                after_image="",
                diff_image="",
                timestamp=timestamp,
                url=url,
                test_name=test_name,
                message="Failed to capture after screenshot",
                details={}
            )
        
        # Compare images
        diff_path = screenshot_dir / f"{test_id}_diff{'_mobile' if mobile else ''}.png"
        comparison_results = self.compare_images(
            str(before_path), str(after_path), str(diff_path)
        )
        
        # Determine success
        success = True
        message = "Verification completed successfully"
        
        if 'error' in comparison_results:
            success = False
            message = f"Comparison failed: {comparison_results['error']}"
        elif comparison_results.get('images_identical', False):
            success = False
            message = "WARNING: Images are identical - deployment may have failed"
        elif not comparison_results.get('images_similar', False):
            message = "WARNING: Significant differences detected - manual review recommended"
        
        # Create result
        result = VerificationResult(
            success=success,
            similarity_score=comparison_results.get('ssim_score', 0.0),
            pixel_differences=comparison_results.get('pixel_differences', 0),
            hash_difference=comparison_results.get('hash_difference', 999),
            before_image=str(before_path),
            after_image=str(after_path),
            diff_image=str(diff_path),
            timestamp=timestamp,
            url=url,
            test_name=test_name,
            message=message,
            details=comparison_results
        )
        
        # Generate report
        self.generate_report(result)
        
        return result
    
    def generate_report(self, result: VerificationResult) -> str:
        """Generate comprehensive HTML report"""
        report_path = Path(self.config.report_dir) / f"{result.test_name}_{result.timestamp}_report.html"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Image Verification Report - {result.test_name}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .success {{ color: green; }}
                .warning {{ color: orange; }}
                .error {{ color: red; }}
                .metrics {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }}
                .metric {{ background: #f9f9f9; padding: 15px; border-radius: 5px; }}
                .images {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }}
                .image-container {{ text-align: center; }}
                .image-container img {{ max-width: 100%; border: 1px solid #ddd; }}
                .details {{ background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                pre {{ background: #fff; padding: 10px; border: 1px solid #ddd; overflow-x: auto; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Image Verification Report</h1>
                <p><strong>Test:</strong> {result.test_name}</p>
                <p><strong>URL:</strong> {result.url}</p>
                <p><strong>Timestamp:</strong> {result.timestamp}</p>
                <p class="{'success' if result.success else 'error'}">
                    <strong>Status:</strong> {'✓ PASSED' if result.success else '✗ FAILED'}
                </p>
                <p><strong>Message:</strong> {result.message}</p>
            </div>
            
            <div class="metrics">
                <div class="metric">
                    <h3>Similarity Score (SSIM)</h3>
                    <p><strong>{result.similarity_score:.4f}</strong></p>
                    <small>Higher is more similar (max: 1.0)</small>
                </div>
                <div class="metric">
                    <h3>Pixel Differences</h3>
                    <p><strong>{result.pixel_differences:,}</strong></p>
                    <small>Number of significantly different pixels</small>
                </div>
                <div class="metric">
                    <h3>Hash Difference</h3>
                    <p><strong>{result.hash_difference}</strong></p>
                    <small>Perceptual hash difference (lower is more similar)</small>
                </div>
            </div>
            
            <div class="images">
                <div class="image-container">
                    <h3>Before</h3>
                    <img src="{os.path.relpath(result.before_image, self.config.report_dir)}" alt="Before">
                </div>
                <div class="image-container">
                    <h3>After</h3>
                    <img src="{os.path.relpath(result.after_image, self.config.report_dir)}" alt="After">
                </div>
                <div class="image-container">
                    <h3>Differences</h3>
                    <img src="{os.path.relpath(result.diff_image, self.config.report_dir)}" alt="Differences">
                </div>
            </div>
            
            <div class="details">
                <h3>Detailed Analysis</h3>
                <pre>{json.dumps(result.details, indent=2)}</pre>
            </div>
        </body>
        </html>
        """
        
        with open(report_path, 'w') as f:
            f.write(html_content)
            
        self.logger.info(f"Report generated: {report_path}")
        return str(report_path)
    
    def batch_verify(self, urls_and_tests: List[Tuple[str, str]], 
                    mobile: bool = False) -> List[VerificationResult]:
        """Run verification on multiple URLs"""
        results = []
        
        for url, test_name in urls_and_tests:
            self.logger.info(f"Starting verification: {test_name}")
            result = self.verify_deployment(url, test_name, mobile=mobile)
            results.append(result)
            
        # Generate batch report
        self._generate_batch_report(results)
        
        return results
    
    def _generate_batch_report(self, results: List[VerificationResult]) -> str:
        """Generate summary report for batch verification"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_path = Path(self.config.report_dir) / f"batch_verification_{timestamp}.html"
        
        passed = sum(1 for r in results if r.success)
        total = len(results)
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Batch Verification Report - {timestamp}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
                .summary {{ background: #e8f4f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
                .test-result {{ border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }}
                .success {{ border-left: 5px solid green; }}
                .failed {{ border-left: 5px solid red; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Batch Image Verification Report</h1>
                <p><strong>Timestamp:</strong> {timestamp}</p>
            </div>
            
            <div class="summary">
                <h2>Summary</h2>
                <p><strong>Total Tests:</strong> {total}</p>
                <p><strong>Passed:</strong> {passed}</p>
                <p><strong>Failed:</strong> {total - passed}</p>
                <p><strong>Success Rate:</strong> {(passed/total*100):.1f}%</p>
            </div>
            
            <h2>Test Results</h2>
            <table>
                <tr>
                    <th>Test Name</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Similarity</th>
                    <th>Pixel Diff</th>
                    <th>Message</th>
                </tr>
        """
        
        for result in results:
            status_class = "success" if result.success else "failed"
            status_text = "PASSED" if result.success else "FAILED"
            html_content += f"""
                <tr class="{status_class}">
                    <td>{result.test_name}</td>
                    <td><a href="{result.url}" target="_blank">{result.url}</a></td>
                    <td>{status_text}</td>
                    <td>{result.similarity_score:.3f}</td>
                    <td>{result.pixel_differences:,}</td>
                    <td>{result.message}</td>
                </tr>
            """
        
        html_content += """
            </table>
        </body>
        </html>
        """
        
        with open(report_path, 'w') as f:
            f.write(html_content)
            
        self.logger.info(f"Batch report generated: {report_path}")
        return str(report_path)


# CLI Interface and Main Functions
def main():
    """Main CLI interface for the Image Verification Agent"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Image Verification Agent")
    parser.add_argument('--url', required=True, help='URL to verify')
    parser.add_argument('--test-name', required=True, help='Name for this test')
    parser.add_argument('--before', help='Path to before screenshot')
    parser.add_argument('--mobile', action='store_true', help='Use mobile viewport')
    parser.add_argument('--config', help='Path to config file')
    
    args = parser.parse_args()
    
    # Load configuration
    config = VerificationConfig()
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r') as f:
            config_dict = json.load(f)
            for key, value in config_dict.items():
                if hasattr(config, key):
                    setattr(config, key, value)
    
    # Initialize agent
    agent = ImageVerificationAgent(config)
    
    # Run verification
    result = agent.verify_deployment(
        url=args.url,
        test_name=args.test_name,
        before_screenshot=args.before,
        mobile=args.mobile
    )
    
    # Print results
    print(f"\n{'='*50}")
    print(f"VERIFICATION RESULT: {'PASSED' if result.success else 'FAILED'}")
    print(f"{'='*50}")
    print(f"Test: {result.test_name}")
    print(f"URL: {result.url}")
    print(f"Similarity Score: {result.similarity_score:.4f}")
    print(f"Pixel Differences: {result.pixel_differences:,}")
    print(f"Hash Difference: {result.hash_difference}")
    print(f"Message: {result.message}")
    print(f"{'='*50}")
    
    # Exit with appropriate code
    sys.exit(0 if result.success else 1)


if __name__ == "__main__":
    main()