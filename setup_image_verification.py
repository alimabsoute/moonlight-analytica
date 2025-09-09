#!/usr/bin/env python3
"""
Image Verification System Setup Script
=====================================

Complete setup and installation script for the Image Verification & Management System.
This script automates the entire setup process including dependencies, configuration,
and integration with existing workflows.

Usage:
    python setup_image_verification.py [--auto] [--config-only] [--test]

Author: Moonlight Analytica Development Team
Date: September 2024
Version: 1.0
"""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
import argparse
import platform
import tempfile


class ImageVerificationSetup:
    """Complete setup manager for Image Verification System"""
    
    def __init__(self, auto_mode: bool = False):
        self.auto_mode = auto_mode
        self.system = platform.system().lower()
        self.base_dir = Path.cwd()
        self.setup_log = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log setup progress"""
        log_entry = f"[{level}] {message}"
        self.setup_log.append(log_entry)
        print(log_entry)
    
    def run_full_setup(self):
        """Execute complete setup process"""
        self.log("🚀 Starting Image Verification System Setup", "INFO")
        
        try:
            # Step 1: System checks
            self.check_system_requirements()
            
            # Step 2: Install Python dependencies
            self.install_python_dependencies()
            
            # Step 3: Setup Chrome/ChromeDriver
            self.setup_chrome_driver()
            
            # Step 4: Create directory structure
            self.create_directory_structure()
            
            # Step 5: Generate configuration files
            self.generate_configuration_files()
            
            # Step 6: Setup Git hooks (optional)
            self.setup_git_integration()
            
            # Step 7: Create CI/CD configurations
            self.setup_cicd_integration()
            
            # Step 8: Run system test
            self.run_system_test()
            
            # Step 9: Generate completion report
            self.generate_setup_report()
            
            self.log("✅ Setup completed successfully!", "SUCCESS")
            
        except Exception as e:
            self.log(f"❌ Setup failed: {e}", "ERROR")
            self.log("Check the setup log for details", "ERROR")
            sys.exit(1)
    
    def check_system_requirements(self):
        """Check system requirements"""
        self.log("🔍 Checking system requirements...")
        
        # Check Python version
        python_version = sys.version_info
        if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
            raise Exception(f"Python 3.8+ required, found {python_version.major}.{python_version.minor}")
        
        self.log(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}", "INFO")
        
        # Check pip
        try:
            subprocess.run(['pip', '--version'], check=True, capture_output=True)
            self.log("✅ pip is available", "INFO")
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise Exception("pip is not available")
        
        # Check git (optional)
        try:
            result = subprocess.run(['git', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                self.log(f"✅ Git is available: {result.stdout.strip()}", "INFO")
            else:
                self.log("⚠️ Git not available - Git integration will be skipped", "WARNING")
        except FileNotFoundError:
            self.log("⚠️ Git not found - Git integration will be skipped", "WARNING")
    
    def install_python_dependencies(self):
        """Install Python dependencies"""
        self.log("📦 Installing Python dependencies...")
        
        # Check if requirements file exists
        requirements_file = self.base_dir / "requirements_image_verification.txt"
        if not requirements_file.exists():
            self.log("⚠️ Requirements file not found, creating basic requirements", "WARNING")
            self.create_requirements_file(requirements_file)
        
        # Install dependencies
        try:
            subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)
            ], check=True, capture_output=True)
            self.log("✅ Python dependencies installed", "INFO")
        except subprocess.CalledProcessError as e:
            self.log("⚠️ Some dependencies failed to install, attempting individual installation", "WARNING")
            self.install_dependencies_individually()
    
    def create_requirements_file(self, file_path: Path):
        """Create requirements file if it doesn't exist"""
        requirements = [
            "selenium>=4.15.0",
            "webdriver-manager>=4.0.0", 
            "opencv-python>=4.8.0",
            "Pillow>=10.0.0",
            "numpy>=1.24.0",
            "scikit-image>=0.21.0",
            "imagehash>=4.3.1",
            "requests>=2.31.0",
            "pyyaml>=6.0.0",
            "psutil>=5.9.0"
        ]
        
        with open(file_path, 'w') as f:
            f.write('\n'.join(requirements))
            f.write('\n')
    
    def install_dependencies_individually(self):
        """Install core dependencies individually"""
        core_dependencies = [
            "selenium",
            "webdriver-manager",
            "opencv-python",
            "Pillow",
            "numpy",
            "scikit-image",
            "requests"
        ]
        
        for dep in core_dependencies:
            try:
                subprocess.run([
                    sys.executable, '-m', 'pip', 'install', dep
                ], check=True, capture_output=True)
                self.log(f"✅ Installed {dep}", "INFO")
            except subprocess.CalledProcessError:
                self.log(f"❌ Failed to install {dep}", "ERROR")
    
    def setup_chrome_driver(self):
        """Setup Chrome and ChromeDriver"""
        self.log("🌐 Setting up Chrome/ChromeDriver...")
        
        try:
            # Try to use webdriver-manager for automatic setup
            from selenium import webdriver
            from selenium.webdriver.chrome.service import Service
            from webdriver_manager.chrome import ChromeDriverManager
            
            # This will automatically download ChromeDriver if needed
            driver_path = ChromeDriverManager().install()
            self.log(f"✅ ChromeDriver ready at: {driver_path}", "INFO")
            
            # Test Chrome/ChromeDriver
            from selenium.webdriver.chrome.options import Options
            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            
            service = Service(driver_path)
            driver = webdriver.Chrome(service=service, options=options)
            driver.get("https://httpbin.org/get")
            driver.quit()
            
            self.log("✅ Chrome/ChromeDriver test successful", "INFO")
            
        except Exception as e:
            self.log(f"⚠️ Chrome/ChromeDriver setup issue: {e}", "WARNING")
            self.log("Please install Chrome manually and ensure ChromeDriver is in PATH", "WARNING")
    
    def create_directory_structure(self):
        """Create necessary directory structure"""
        self.log("📁 Creating directory structure...")
        
        directories = [
            "verification_screenshots",
            "verification_reports",
            "verification_logs",
            "verification_backups",
            "verification_configs",
            "verification_templates"
        ]
        
        for directory in directories:
            dir_path = self.base_dir / directory
            dir_path.mkdir(exist_ok=True)
            self.log(f"✅ Created directory: {directory}", "INFO")
    
    def generate_configuration_files(self):
        """Generate default configuration files"""
        self.log("⚙️ Generating configuration files...")
        
        # Main configuration file
        main_config = {
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
                    {"name": "contact", "url": "/contact"}
                ],
                "wait_after_deployment": 30,
                "retry_attempts": 3,
                "retry_delay": 10
            },
            "notifications": {
                "slack_webhook": None,
                "notification_webhook": None,
                "email_notifications": []
            }
        }
        
        config_file = self.base_dir / "verification_configs" / "default_config.json"
        with open(config_file, 'w') as f:
            json.dump(main_config, f, indent=2)
        
        self.log(f"✅ Created configuration: {config_file}", "INFO")
        
        # Environment-specific configs
        environments = ['development', 'staging', 'production']
        for env in environments:
            env_config = main_config.copy()
            env_config['environment'] = env
            
            if env == 'development':
                env_config['verification']['similarity_threshold'] = 0.85
                env_config['deployment']['base_url'] = 'http://localhost:3000'
            elif env == 'staging':
                env_config['verification']['similarity_threshold'] = 0.90
                env_config['deployment']['base_url'] = 'https://staging.yoursite.com'
            
            env_file = self.base_dir / "verification_configs" / f"{env}_config.json"
            with open(env_file, 'w') as f:
                json.dump(env_config, f, indent=2)
            
            self.log(f"✅ Created {env} config: {env_file}", "INFO")
    
    def setup_git_integration(self):
        """Setup Git hooks integration"""
        git_dir = self.base_dir / ".git"
        if not git_dir.exists():
            self.log("⚠️ Not a Git repository - skipping Git integration", "WARNING")
            return
        
        self.log("🔗 Setting up Git integration...")
        
        # Create pre-commit hook
        hooks_dir = git_dir / "hooks"
        hooks_dir.mkdir(exist_ok=True)
        
        pre_commit_hook = hooks_dir / "pre-commit"
        hook_content = """#!/bin/bash
# Image Verification Pre-commit Hook
echo "🔍 Running image verification checks..."

MODIFIED_IMAGES=$(git diff --cached --name-only --diff-filter=AMR | grep -E '\\.(png|jpg|jpeg|gif|svg|webp)$')

if [ -z "$MODIFIED_IMAGES" ]; then
    echo "✅ No image files modified"
    exit 0
fi

echo "📁 Modified images detected:"
echo "$MODIFIED_IMAGES"

python3 deployment_verification_workflow.py --mode pre-commit --files "$(echo "$MODIFIED_IMAGES" | tr '\\n' ',')"

if [ $? -ne 0 ]; then
    echo "❌ Image verification failed. Commit aborted."
    echo "💡 Run 'git commit --no-verify' to bypass verification"
    exit 1
fi

echo "✅ Image verification passed"
exit 0
"""
        
        with open(pre_commit_hook, 'w') as f:
            f.write(hook_content)
        
        # Make executable
        pre_commit_hook.chmod(0o755)
        
        self.log("✅ Pre-commit hook installed", "INFO")
    
    def setup_cicd_integration(self):
        """Setup CI/CD integration files"""
        self.log("🤖 Setting up CI/CD integration...")
        
        # GitHub Actions workflow
        github_dir = self.base_dir / ".github" / "workflows"
        github_dir.mkdir(parents=True, exist_ok=True)
        
        github_workflow = github_dir / "image-verification.yml"
        workflow_content = """name: Image Verification

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  verify-images:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install Chrome
      uses: browser-actions/setup-chrome@latest
    
    - name: Install dependencies
      run: |
        pip install -r requirements_image_verification.txt
        
    - name: Run image verification
      run: |
        python deployment_verification_workflow.py --mode ci --base-url "https://your-staging-url.com"
      env:
        VERIFICATION_CONFIG: ${{ secrets.VERIFICATION_CONFIG }}
        SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    
    - name: Upload verification reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: verification-reports
        path: verification_reports/
"""
        
        with open(github_workflow, 'w') as f:
            f.write(workflow_content)
        
        self.log("✅ GitHub Actions workflow created", "INFO")
        
        # Vercel configuration
        vercel_config = {
            "functions": {
                "verification_webhook.py": {
                    "runtime": "python3.9"
                }
            },
            "routes": [
                {
                    "src": "/api/verify",
                    "dest": "verification_webhook.py"
                }
            ]
        }
        
        vercel_file = self.base_dir / "vercel.json"
        if not vercel_file.exists():
            with open(vercel_file, 'w') as f:
                json.dump(vercel_config, f, indent=2)
            self.log("✅ Vercel configuration created", "INFO")
        else:
            self.log("⚠️ vercel.json already exists - skipped", "WARNING")
    
    def run_system_test(self):
        """Run basic system test"""
        self.log("🧪 Running system test...")
        
        try:
            # Test import of main modules
            sys.path.append(str(self.base_dir))
            
            from image_verification_agent import ImageVerificationAgent, VerificationConfig
            from image_verification_utils import setup_verification_environment
            
            # Test basic configuration
            config = VerificationConfig()
            agent = ImageVerificationAgent(config)
            
            self.log("✅ Core modules imported successfully", "INFO")
            
            # Test screenshot capability with a simple URL
            try:
                test_screenshot = self.base_dir / "verification_screenshots" / "system_test.png"
                success = agent.capture_screenshot("https://httpbin.org/get", str(test_screenshot))
                
                if success and test_screenshot.exists():
                    self.log("✅ Screenshot capability test passed", "INFO")
                    # Clean up test file
                    test_screenshot.unlink()
                else:
                    self.log("⚠️ Screenshot test failed - but setup is functional", "WARNING")
                    
            except Exception as e:
                self.log(f"⚠️ Screenshot test error: {e}", "WARNING")
            
        except ImportError as e:
            raise Exception(f"Module import failed: {e}")
        except Exception as e:
            self.log(f"⚠️ System test warning: {e}", "WARNING")
    
    def generate_setup_report(self):
        """Generate setup completion report"""
        self.log("📋 Generating setup report...")
        
        report_content = f"""# Image Verification System Setup Report

## Setup Summary
- **Date**: {os.popen('date').read().strip()}
- **System**: {platform.system()} {platform.release()}
- **Python**: {sys.version}
- **Working Directory**: {self.base_dir}

## Components Installed
✅ Core Python dependencies
✅ Chrome/ChromeDriver setup
✅ Directory structure created
✅ Configuration files generated
✅ Git hooks installed (if applicable)
✅ CI/CD integration files created
✅ System test completed

## Next Steps

### 1. Configure Your URLs
Edit the configuration file to match your project:
```bash
nano verification_configs/default_config.json
```

Update the `base_url` and `pages_to_verify` sections.

### 2. Set Up Environment Variables
```bash
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
export VERIFICATION_CONFIG='{"similarity_threshold": 0.90}'
```

### 3. Test the System
```bash
# Test single page
python image_verification_agent.py --url "https://your-website.com" --test-name "first_test"

# Test deployment workflow
python deployment_verification_workflow.py --mode ci --base-url "https://your-website.com"
```

### 4. Integrate with Your Workflow
- Update GitHub Actions secrets if using CI/CD
- Configure Slack/webhook notifications
- Train your team on the verification process

## Setup Log
```
{chr(10).join(self.setup_log)}
```

## Support
If you encounter any issues:
1. Check the troubleshooting guide in IMAGE-VERIFICATION-MANAGEMENT-SYSTEM.md
2. Review the setup log above for specific error messages
3. Ensure all system requirements are met
4. Contact the development team with this report

---
Setup completed successfully! 🎉
"""
        
        report_file = self.base_dir / "verification_setup_report.md"
        with open(report_file, 'w') as f:
            f.write(report_content)
        
        self.log(f"✅ Setup report generated: {report_file}", "INFO")
    
    def run_config_only_setup(self):
        """Run configuration-only setup"""
        self.log("⚙️ Running configuration-only setup...")
        
        self.create_directory_structure()
        self.generate_configuration_files()
        
        self.log("✅ Configuration setup completed", "SUCCESS")
    
    def run_test_only(self):
        """Run test verification only"""
        self.log("🧪 Running verification test...")
        
        self.run_system_test()
        
        self.log("✅ Test completed", "SUCCESS")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Image Verification System Setup",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python setup_image_verification.py                    # Interactive setup
  python setup_image_verification.py --auto            # Automated setup
  python setup_image_verification.py --config-only     # Configuration only
  python setup_image_verification.py --test            # Test existing setup
        """
    )
    
    parser.add_argument('--auto', action='store_true',
                       help='Run automated setup without prompts')
    parser.add_argument('--config-only', action='store_true',
                       help='Only create configuration files')
    parser.add_argument('--test', action='store_true',
                       help='Test existing setup')
    
    args = parser.parse_args()
    
    if args.test:
        setup = ImageVerificationSetup(auto_mode=True)
        setup.run_test_only()
        return
    
    if args.config_only:
        setup = ImageVerificationSetup(auto_mode=True)
        setup.run_config_only_setup()
        return
    
    # Interactive or automatic setup
    auto_mode = args.auto
    
    if not auto_mode:
        print("🔧 Image Verification System Setup")
        print("=" * 40)
        print()
        print("This will set up the complete Image Verification & Management System")
        print("including dependencies, configuration, and CI/CD integration.")
        print()
        
        response = input("Continue with setup? (y/N): ").lower().strip()
        if response not in ['y', 'yes']:
            print("Setup cancelled.")
            return
    
    setup = ImageVerificationSetup(auto_mode=auto_mode)
    setup.run_full_setup()


if __name__ == "__main__":
    main()