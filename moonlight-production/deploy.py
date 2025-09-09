#!/usr/bin/env python3
"""
Moonlight Analytica - Standardized Deployment Script
Clean, reliable deployment to moonlightanalytica.com
"""

import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime
import json
import shutil

class MoonlightDeployer:
    """Clean deployment system for Moonlight Analytica."""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.root_dir = self.base_dir / "public"  # Vercel expects a public directory
        self.articles_dir = self.base_dir / "articles"
        self.pages_dir = self.base_dir / "pages"
        self.assets_dir = self.base_dir / "assets"
        
        self.deployment_log = self.base_dir / "deployment.log"
        
    def log(self, message: str, level: str = "INFO"):
        """Log deployment activities."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        
        with open(self.deployment_log, 'a', encoding='utf-8') as f:
            f.write(log_entry + "\\n")
    
    def clean_public_dir(self):
        """Clean and recreate public directory."""
        if self.root_dir.exists():
            shutil.rmtree(self.root_dir)
            self.log("Cleaned existing public directory")
        
        self.root_dir.mkdir(parents=True, exist_ok=True)
        self.log("Created fresh public directory")
    
    def copy_content_files(self):
        """Copy all content files to public directory."""
        
        # Copy articles (HTML files go to root for direct access)
        if self.articles_dir.exists():
            for article_file in self.articles_dir.glob("*.html"):
                dest = self.root_dir / article_file.name
                shutil.copy2(article_file, dest)
                self.log(f"Copied article: {article_file.name}")
        
        # Copy pages (HTML files go to root)
        if self.pages_dir.exists():
            for page_file in self.pages_dir.glob("*.html"):
                dest = self.root_dir / page_file.name
                shutil.copy2(page_file, dest)
                self.log(f"Copied page: {page_file.name}")
        
        # Copy assets if they exist
        if self.assets_dir.exists():
            assets_dest = self.root_dir / "assets"
            shutil.copytree(self.assets_dir, assets_dest, dirs_exist_ok=True)
            self.log("Copied assets directory")
    
    def create_vercel_config(self):
        """Create optimized Vercel configuration."""
        
        vercel_config = {
            "version": 2,
            "name": "moonlight-analytica-production",
            "regions": ["iad1"],  # US East for better performance
            "github": {
                "silent": True
            },
            "cleanUrls": True,
            "trailingSlash": False,
            "headers": [
                {
                    "source": "/(.*)",
                    "headers": [
                        {
                            "key": "Cache-Control",
                            "value": "public, max-age=3600, s-maxage=86400"
                        },
                        {
                            "key": "X-Content-Type-Options",
                            "value": "nosniff"
                        },
                        {
                            "key": "X-Frame-Options",
                            "value": "DENY"
                        },
                        {
                            "key": "X-XSS-Protection",
                            "value": "1; mode=block"
                        }
                    ]
                }
            ],
            "redirects": [
                {
                    "source": "/",
                    "destination": "/moonlight-complete-structure.html",
                    "permanent": False
                },
                {
                    "source": "/index.html",
                    "destination": "/moonlight-complete-structure.html",
                    "permanent": True
                }
            ]
        }
        
        vercel_json = self.base_dir / "vercel.json"
        with open(vercel_json, 'w', encoding='utf-8') as f:
            json.dump(vercel_config, f, indent=2)
        
        self.log("Created Vercel configuration")
    
    def create_deployment_info(self):
        """Create deployment info file."""
        
        deployment_info = {
            "deployment_time": datetime.now().isoformat(),
            "version": "1.0.0",
            "status": "production",
            "domain": "moonlightanalytica.com",
            "files_deployed": []
        }
        
        # List all files being deployed
        for file_path in self.root_dir.rglob("*"):
            if file_path.is_file():
                relative_path = file_path.relative_to(self.root_dir)
                deployment_info["files_deployed"].append(str(relative_path))
        
        info_file = self.root_dir / "deployment-info.json"
        with open(info_file, 'w', encoding='utf-8') as f:
            json.dump(deployment_info, f, indent=2)
        
        self.log(f"Created deployment info with {len(deployment_info['files_deployed'])} files")
    
    def verify_required_files(self):
        """Verify that essential files exist."""
        
        required_files = [
            "moonlight-complete-structure.html",  # Home page
            "news.html",                          # News page
            "google-nano-banana-photoshop-killer.html"  # Feature article
        ]
        
        missing_files = []
        for file_name in required_files:
            file_path = self.root_dir / file_name
            if not file_path.exists():
                missing_files.append(file_name)
        
        if missing_files:
            self.log(f"ERROR: Missing required files: {missing_files}", "ERROR")
            return False
        
        self.log("All required files present")
        return True
    
    def deploy_to_vercel(self, dry_run: bool = False):
        """Deploy to Vercel production."""
        
        if dry_run:
            self.log("DRY RUN: Would deploy to Vercel now")
            return True
        
        try:
            # Change to base directory for deployment
            os.chdir(self.base_dir)
            
            # Deploy to production - try multiple vercel paths
            vercel_paths = [
                "vercel",
                r"C:\Users\alima\AppData\Roaming\npm\vercel.cmd",
                "npx vercel"
            ]
            
            result = None
            for vercel_cmd in vercel_paths:
                try:
                    if vercel_cmd == "npx vercel":
                        cmd = ["npx", "vercel", "--prod", "--yes"]
                    else:
                        cmd = [vercel_cmd, "--prod", "--yes"]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=300  # 5 minute timeout
                    )
                    break
                except Exception as e:
                    self.log(f"Tried {vercel_cmd}: {e}")
                    continue
            
            if result is None:
                self.log("ERROR: Could not find Vercel CLI", "ERROR")
                return False
            
            if result.returncode == 0:
                # Extract production URL from output
                output_lines = result.stdout.strip().split("\\n")
                production_url = None
                
                for line in output_lines:
                    if "moonlightanalytica.com" in line or "https://" in line:
                        production_url = line.strip()
                        break
                
                self.log(f"SUCCESS: Deployment successful!")
                if production_url:
                    self.log(f"Live at: {production_url}")
                else:
                    self.log("Live at: https://moonlightanalytica.com")
                
                return True
            else:
                self.log(f"ERROR: Deployment failed: {result.stderr}", "ERROR")
                return False
                
        except subprocess.TimeoutExpired:
            self.log("ERROR: Deployment timed out after 5 minutes", "ERROR")
            return False
        except Exception as e:
            self.log(f"ERROR: Deployment error: {e}", "ERROR")
            return False
    
    def full_deployment(self, dry_run: bool = False):
        """Complete deployment process."""
        
        self.log("Starting Moonlight Analytica deployment")
        self.log(f"Base directory: {self.base_dir}")
        
        try:
            # Step 1: Clean and prepare
            self.clean_public_dir()
            
            # Step 2: Copy content
            self.copy_content_files()
            
            # Step 3: Create configuration
            self.create_vercel_config()
            
            # Step 4: Create deployment info
            self.create_deployment_info()
            
            # Step 5: Verify files
            if not self.verify_required_files():
                return False
            
            # Step 6: Deploy
            success = self.deploy_to_vercel(dry_run)
            
            if success:
                self.log("SUCCESS: Deployment completed successfully!")
                self.log("Visit: https://moonlightanalytica.com")
            else:
                self.log("ERROR: Deployment failed - check logs above")
            
            return success
            
        except Exception as e:
            self.log(f"ERROR: Deployment process failed: {e}", "ERROR")
            return False


def main():
    """Main deployment function."""
    
    print("="*60)
    print("   MOONLIGHT ANALYTICA - PRODUCTION DEPLOYMENT")
    print("="*60)
    
    deployer = MoonlightDeployer()
    
    # Check for dry run argument
    dry_run = "--dry-run" in sys.argv or "--test" in sys.argv
    
    if dry_run:
        print("TEST DRY RUN MODE - No actual deployment")
        print("-"*60)
    
    success = deployer.full_deployment(dry_run=dry_run)
    
    print("-"*60)
    if success:
        print("SUCCESS: Ready for production!")
        if not dry_run:
            print("Your site is live at: https://moonlightanalytica.com")
    else:
        print("FAILED: Check deployment.log for details")
    
    print("="*60)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())