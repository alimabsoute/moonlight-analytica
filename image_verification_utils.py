#!/usr/bin/env python3
"""
Image Verification Utilities
============================

Supporting utilities and helper functions for the Image Verification Agent.
Includes batch processing, configuration management, and integration helpers.

Author: Moonlight Analytica Development Team
Date: September 2024
Version: 1.0
"""

import os
import json
import yaml
import time
import shutil
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import concurrent.futures
from threading import Lock

import requests
from PIL import Image
import cv2
import numpy as np


@dataclass
class DeploymentConfig:
    """Configuration for deployment verification workflows"""
    base_url: str
    pages_to_verify: List[Dict[str, str]]
    wait_after_deployment: int = 30
    retry_attempts: int = 3
    retry_delay: int = 10
    notification_webhook: Optional[str] = None
    slack_webhook: Optional[str] = None
    email_notifications: List[str] = None
    
    def __post_init__(self):
        if self.email_notifications is None:
            self.email_notifications = []


class ImageOptimizer:
    """Optimize images for web deployment and verification"""
    
    @staticmethod
    def optimize_for_web(input_path: str, output_path: str, 
                        quality: int = 85, max_width: int = 1920) -> bool:
        """
        Optimize image for web deployment
        
        Args:
            input_path: Source image path
            output_path: Destination path
            quality: JPEG quality (1-100)
            max_width: Maximum width in pixels
            
        Returns:
            bool: Success status
        """
        try:
            with Image.open(input_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    rgb_img.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
                    img = rgb_img
                
                # Resize if too large
                if img.width > max_width:
                    aspect_ratio = img.height / img.width
                    new_height = int(max_width * aspect_ratio)
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                
                # Save with optimization
                img.save(output_path, 'JPEG', quality=quality, optimize=True)
                
            return True
            
        except Exception as e:
            print(f"Error optimizing image {input_path}: {e}")
            return False
    
    @staticmethod
    def create_responsive_images(input_path: str, output_dir: str) -> List[str]:
        """
        Create responsive image variants for different screen sizes
        
        Args:
            input_path: Source image path
            output_dir: Directory for output images
            
        Returns:
            List of created image paths
        """
        variants = [
            ('mobile', 480),
            ('tablet', 768),
            ('desktop', 1200),
            ('large', 1920)
        ]
        
        created_files = []
        base_name = Path(input_path).stem
        
        try:
            with Image.open(input_path) as img:
                for variant_name, max_width in variants:
                    if img.width <= max_width:
                        continue
                        
                    aspect_ratio = img.height / img.width
                    new_height = int(max_width * aspect_ratio)
                    resized_img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                    
                    output_path = Path(output_dir) / f"{base_name}_{variant_name}.jpg"
                    resized_img.save(output_path, 'JPEG', quality=85, optimize=True)
                    created_files.append(str(output_path))
                    
        except Exception as e:
            print(f"Error creating responsive images: {e}")
            
        return created_files


class DeploymentMonitor:
    """Monitor deployments and trigger verification automatically"""
    
    def __init__(self, config: DeploymentConfig):
        self.config = config
        self.lock = Lock()
        self.last_check = {}
        
    def monitor_deployment(self, deployment_url: str, 
                         expected_changes: List[str] = None) -> bool:
        """
        Monitor a deployment URL for changes
        
        Args:
            deployment_url: URL to monitor
            expected_changes: List of expected change indicators
            
        Returns:
            bool: True if changes detected
        """
        try:
            response = requests.get(deployment_url, timeout=30)
            current_hash = hashlib.md5(response.content).hexdigest()
            
            with self.lock:
                last_hash = self.last_check.get(deployment_url)
                self.last_check[deployment_url] = current_hash
                
            if last_hash and last_hash != current_hash:
                return True
                
            # Check for expected changes in content
            if expected_changes:
                content = response.text.lower()
                for change in expected_changes:
                    if change.lower() in content:
                        return True
                        
            return False
            
        except Exception as e:
            print(f"Error monitoring deployment: {e}")
            return False
    
    def wait_for_deployment(self, deployment_url: str, timeout: int = 300) -> bool:
        """
        Wait for deployment to complete
        
        Args:
            deployment_url: URL to check
            timeout: Maximum wait time in seconds
            
        Returns:
            bool: True if deployment completed
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if self.monitor_deployment(deployment_url):
                return True
            time.sleep(10)
            
        return False


class VerificationWorkflow:
    """Automated verification workflow orchestrator"""
    
    def __init__(self, verification_agent, config: DeploymentConfig):
        self.agent = verification_agent
        self.config = config
        
    def pre_deployment_capture(self) -> Dict[str, str]:
        """Capture screenshots before deployment"""
        screenshots = {}
        
        for page_config in self.config.pages_to_verify:
            url = page_config['url']
            name = page_config['name']
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            screenshot_path = f"./verification_screenshots/{name}_before_{timestamp}.png"
            
            if self.agent.capture_screenshot(url, screenshot_path):
                screenshots[name] = screenshot_path
            
        return screenshots
    
    def post_deployment_verify(self, before_screenshots: Dict[str, str]) -> List[Dict]:
        """Verify deployment with before/after comparison"""
        results = []
        
        # Wait for deployment to stabilize
        time.sleep(self.config.wait_after_deployment)
        
        for page_config in self.config.pages_to_verify:
            name = page_config['name']
            url = page_config['url']
            
            if name in before_screenshots:
                result = self.agent.verify_deployment(
                    url=url,
                    test_name=f"deployment_{name}",
                    before_screenshot=before_screenshots[name]
                )
                results.append({
                    'name': name,
                    'url': url,
                    'result': result,
                    'success': result.success
                })
        
        return results
    
    def full_deployment_workflow(self) -> Dict[str, Any]:
        """Complete deployment verification workflow"""
        workflow_start = time.time()
        
        # Step 1: Capture before screenshots
        print("📸 Capturing pre-deployment screenshots...")
        before_screenshots = self.pre_deployment_capture()
        
        # Step 2: Wait for deployment trigger (external)
        print("⏳ Ready for deployment. Waiting for completion signal...")
        
        # Step 3: Post-deployment verification
        print("🔍 Running post-deployment verification...")
        verification_results = self.post_deployment_verify(before_screenshots)
        
        # Step 4: Generate summary
        total_tests = len(verification_results)
        passed_tests = sum(1 for r in verification_results if r['success'])
        
        workflow_summary = {
            'timestamp': datetime.now().isoformat(),
            'duration': time.time() - workflow_start,
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': total_tests - passed_tests,
            'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0,
            'results': verification_results
        }
        
        # Step 5: Send notifications
        self._send_notifications(workflow_summary)
        
        return workflow_summary
    
    def _send_notifications(self, summary: Dict[str, Any]):
        """Send notifications about verification results"""
        if summary['failed_tests'] > 0:
            message = f"❌ Deployment Verification FAILED\n" \
                     f"Failed: {summary['failed_tests']}/{summary['total_tests']} tests\n" \
                     f"Success Rate: {summary['success_rate']:.1f}%"
        else:
            message = f"✅ Deployment Verification PASSED\n" \
                     f"All {summary['total_tests']} tests successful"
        
        # Slack notification
        if self.config.slack_webhook:
            self._send_slack_notification(message, summary)
        
        # Generic webhook
        if self.config.notification_webhook:
            self._send_webhook_notification(summary)
    
    def _send_slack_notification(self, message: str, summary: Dict[str, Any]):
        """Send Slack notification"""
        try:
            payload = {
                "text": message,
                "attachments": [{
                    "color": "danger" if summary['failed_tests'] > 0 else "good",
                    "fields": [
                        {"title": "Total Tests", "value": summary['total_tests'], "short": True},
                        {"title": "Success Rate", "value": f"{summary['success_rate']:.1f}%", "short": True},
                        {"title": "Duration", "value": f"{summary['duration']:.1f}s", "short": True}
                    ]
                }]
            }
            
            requests.post(self.config.slack_webhook, json=payload, timeout=30)
            
        except Exception as e:
            print(f"Error sending Slack notification: {e}")
    
    def _send_webhook_notification(self, summary: Dict[str, Any]):
        """Send generic webhook notification"""
        try:
            requests.post(self.config.notification_webhook, json=summary, timeout=30)
        except Exception as e:
            print(f"Error sending webhook notification: {e}")


class BatchProcessor:
    """Process multiple verification tasks efficiently"""
    
    def __init__(self, verification_agent, max_workers: int = 4):
        self.agent = verification_agent
        self.max_workers = max_workers
    
    def process_url_list(self, url_file: str, output_dir: str = None) -> List[Dict]:
        """
        Process a list of URLs from file
        
        Args:
            url_file: Path to file with URLs (one per line or JSON)
            output_dir: Directory for results
            
        Returns:
            List of verification results
        """
        urls = self._load_url_list(url_file)
        results = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_url = {
                executor.submit(self._verify_single_url, url_info): url_info 
                for url_info in urls
            }
            
            for future in concurrent.futures.as_completed(future_to_url):
                url_info = future_to_url[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    print(f"Error processing {url_info}: {e}")
                    results.append({
                        'url': url_info.get('url', 'unknown'),
                        'error': str(e),
                        'success': False
                    })
        
        return results
    
    def _load_url_list(self, file_path: str) -> List[Dict]:
        """Load URLs from various file formats"""
        with open(file_path, 'r') as f:
            content = f.read().strip()
            
        # Try JSON format first
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # Try YAML format
        try:
            return yaml.safe_load(content)
        except yaml.YAMLError:
            pass
        
        # Fallback to simple line-by-line format
        urls = []
        for line in content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                urls.append({
                    'url': line,
                    'name': line.split('/')[-1] or 'homepage'
                })
        
        return urls
    
    def _verify_single_url(self, url_info: Dict) -> Dict:
        """Verify a single URL with error handling"""
        try:
            result = self.agent.verify_deployment(
                url=url_info['url'],
                test_name=url_info.get('name', 'batch_test')
            )
            
            return {
                'url': url_info['url'],
                'name': url_info.get('name', 'batch_test'),
                'success': result.success,
                'similarity_score': result.similarity_score,
                'pixel_differences': result.pixel_differences,
                'message': result.message
            }
            
        except Exception as e:
            return {
                'url': url_info['url'],
                'name': url_info.get('name', 'batch_test'),
                'success': False,
                'error': str(e)
            }


class ConfigManager:
    """Manage configuration files and environments"""
    
    @staticmethod
    def create_default_config(output_path: str = "image_verification_config.json"):
        """Create default configuration file"""
        default_config = {
            "verification": {
                "screenshot_dir": "./verification_screenshots",
                "report_dir": "./verification_reports",
                "max_wait_time": 30,
                "viewport_width": 1920,
                "viewport_height": 1080,
                "mobile_width": 375,
                "mobile_height": 667,
                "similarity_threshold": 0.95,
                "pixel_diff_threshold": 10,
                "hash_threshold": 5
            },
            "deployment": {
                "base_url": "https://your-website.com",
                "pages_to_verify": [
                    {"name": "homepage", "url": "/"},
                    {"name": "about", "url": "/about"},
                    {"name": "products", "url": "/products"}
                ],
                "wait_after_deployment": 30,
                "retry_attempts": 3,
                "retry_delay": 10
            },
            "notifications": {
                "slack_webhook": null,
                "notification_webhook": null,
                "email_notifications": []
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(default_config, f, indent=2)
        
        print(f"Default configuration created: {output_path}")
        return output_path
    
    @staticmethod
    def validate_config(config_path: str) -> bool:
        """Validate configuration file"""
        required_keys = [
            'verification.screenshot_dir',
            'verification.report_dir',
            'deployment.base_url'
        ]
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            for key_path in required_keys:
                keys = key_path.split('.')
                current = config
                for key in keys:
                    if key not in current:
                        print(f"Missing required configuration: {key_path}")
                        return False
                    current = current[key]
            
            print("Configuration validation passed")
            return True
            
        except Exception as e:
            print(f"Configuration validation failed: {e}")
            return False


def cleanup_old_files(directory: str, days_old: int = 30):
    """Clean up old verification files"""
    cutoff_date = datetime.now() - timedelta(days=days_old)
    
    for file_path in Path(directory).glob("*"):
        if file_path.is_file():
            file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
            if file_time < cutoff_date:
                file_path.unlink()
                print(f"Deleted old file: {file_path}")


def setup_verification_environment():
    """Set up the verification environment with all necessary directories"""
    directories = [
        "./verification_screenshots",
        "./verification_reports", 
        "./verification_logs",
        "./verification_backups",
        "./verification_configs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {directory}")
    
    # Create default config
    config_path = ConfigManager.create_default_config("./verification_configs/default_config.json")
    
    print("\n✅ Verification environment setup complete!")
    print(f"📁 Directories created: {len(directories)}")
    print(f"⚙️  Default config: {config_path}")
    print("\n📝 Next steps:")
    print("1. Edit the configuration file to match your environment")
    print("2. Install requirements: pip install -r requirements_image_verification.txt")
    print("3. Run your first verification test")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "setup":
        setup_verification_environment()
    else:
        print("Usage: python image_verification_utils.py setup")
        print("This will set up the verification environment with default configurations.")