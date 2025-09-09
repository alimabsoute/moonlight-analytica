#!/usr/bin/env python3
"""
Deployment Verification Workflow
===============================

Complete automation scripts for deployment verification workflows.
Integrates with CI/CD pipelines, git hooks, and deployment services.

Author: Moonlight Analytica Development Team
Date: September 2024
Version: 1.0
"""

import os
import sys
import json
import time
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import argparse
import yaml

from image_verification_agent import ImageVerificationAgent, VerificationConfig
from image_verification_utils import DeploymentConfig, VerificationWorkflow


class GitHookIntegration:
    """Integration with Git hooks for automatic verification"""
    
    @staticmethod
    def install_pre_commit_hook(repo_path: str = "."):
        """Install pre-commit hook for image verification"""
        hook_path = Path(repo_path) / ".git" / "hooks" / "pre-commit"
        
        hook_content = '''#!/bin/bash
# Image Verification Pre-commit Hook
# Automatically verify images before commit

echo "🔍 Running image verification checks..."

# Get list of modified image files
MODIFIED_IMAGES=$(git diff --cached --name-only --diff-filter=AMR | grep -E '\\.(png|jpg|jpeg|gif|svg|webp)$')

if [ -z "$MODIFIED_IMAGES" ]; then
    echo "✅ No image files modified"
    exit 0
fi

echo "📁 Modified images detected:"
echo "$MODIFIED_IMAGES"

# Run image verification
python3 deployment_verification_workflow.py --mode pre-commit --files "$MODIFIED_IMAGES"

if [ $? -ne 0 ]; then
    echo "❌ Image verification failed. Commit aborted."
    echo "💡 Run 'git commit --no-verify' to bypass verification"
    exit 1
fi

echo "✅ Image verification passed"
exit 0
'''
        
        with open(hook_path, 'w') as f:
            f.write(hook_content)
        
        # Make executable
        os.chmod(hook_path, 0o755)
        
        print(f"✅ Pre-commit hook installed: {hook_path}")
        return str(hook_path)
    
    @staticmethod
    def install_post_receive_hook(repo_path: str = "."):
        """Install post-receive hook for deployment verification"""
        hook_path = Path(repo_path) / ".git" / "hooks" / "post-receive"
        
        hook_content = '''#!/bin/bash
# Image Verification Post-receive Hook
# Automatically verify deployment after push

echo "🚀 Deployment received, starting verification..."

# Get the latest commit info
while read oldrev newrev refname; do
    if [[ $refname == "refs/heads/main" || $refname == "refs/heads/master" ]]; then
        echo "📝 Verifying deployment for $refname"
        
        # Trigger deployment verification
        python3 deployment_verification_workflow.py --mode post-deploy --commit "$newrev"
        
        if [ $? -ne 0 ]; then
            echo "❌ Deployment verification failed"
            echo "🔔 Notification sent to development team"
        else
            echo "✅ Deployment verification passed"
        fi
    fi
done
'''
        
        with open(hook_path, 'w') as f:
            f.write(hook_content)
            
        os.chmod(hook_path, 0o755)
        
        print(f"✅ Post-receive hook installed: {hook_path}")
        return str(hook_path)


class CIPipelineIntegration:
    """Integration with CI/CD pipeline services"""
    
    @staticmethod
    def create_github_action():
        """Create GitHub Action workflow for image verification"""
        workflow_dir = Path(".github/workflows")
        workflow_dir.mkdir(parents=True, exist_ok=True)
        
        workflow_content = '''name: Image Verification

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
    
    - name: Install ChromeDriver
      uses: nanasess/setup-chromedriver@v2
    
    - name: Install dependencies
      run: |
        pip install -r requirements_image_verification.txt
        
    - name: Run image verification
      run: |
        python deployment_verification_workflow.py --mode ci --base-url "${{ secrets.STAGING_URL }}"
      env:
        VERIFICATION_CONFIG: ${{ secrets.VERIFICATION_CONFIG }}
        SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    
    - name: Upload verification reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: verification-reports
        path: verification_reports/
        
    - name: Comment PR with results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const path = require('path');
          
          // Read verification results
          const reportsDir = 'verification_reports';
          if (fs.existsSync(reportsDir)) {
            const files = fs.readdirSync(reportsDir);
            const latestReport = files
              .filter(f => f.endsWith('.json'))
              .sort()
              .pop();
              
            if (latestReport) {
              const results = JSON.parse(
                fs.readFileSync(path.join(reportsDir, latestReport), 'utf8')
              );
              
              const comment = `## 🔍 Image Verification Results
              
**Status:** ${results.success ? '✅ PASSED' : '❌ FAILED'}
**Tests:** ${results.total_tests}
**Success Rate:** ${results.success_rate}%

${results.failed_tests > 0 ? '⚠️ Some tests failed. Check the detailed report for more information.' : ''}
              `;
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
          }
'''
        
        workflow_path = workflow_dir / "image-verification.yml"
        with open(workflow_path, 'w') as f:
            f.write(workflow_content)
            
        print(f"✅ GitHub Action created: {workflow_path}")
        return str(workflow_path)
    
    @staticmethod
    def create_vercel_config():
        """Create Vercel configuration for image verification"""
        vercel_config = {
            "builds": [
                {
                    "src": "package.json",
                    "use": "@vercel/static-build"
                }
            ],
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
            ],
            "env": {
                "VERIFICATION_ENABLED": "true"
            }
        }
        
        with open("vercel.json", 'w') as f:
            json.dump(vercel_config, f, indent=2)
            
        # Create webhook handler
        webhook_content = '''from http.server import BaseHTTPRequestHandler
import json
import os
import subprocess

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/verify':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Trigger verification
                result = subprocess.run([
                    'python3', 'deployment_verification_workflow.py',
                    '--mode', 'webhook',
                    '--url', data.get('url', '')
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'success'}).encode())
                else:
                    self.send_response(500)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'status': 'error',
                        'message': result.stderr
                    }).encode())
                    
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'error',
                    'message': str(e)
                }).encode())
        else:
            self.send_response(404)
            self.end_headers()
'''
        
        with open("verification_webhook.py", 'w') as f:
            f.write(webhook_content)
            
        print("✅ Vercel configuration created")
        return "vercel.json"


class DeploymentVerifier:
    """Main deployment verification orchestrator"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config = self._load_config(config_path)
        self.agent = ImageVerificationAgent(VerificationConfig(**self.config.get('verification', {})))
        self.deployment_config = DeploymentConfig(**self.config.get('deployment', {}))
        self.workflow = VerificationWorkflow(self.agent, self.deployment_config)
        
    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from file or environment"""
        config = {}
        
        # Load from file
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                if config_path.endswith('.yaml') or config_path.endswith('.yml'):
                    config = yaml.safe_load(f)
                else:
                    config = json.load(f)
        
        # Override with environment variables
        env_config = os.environ.get('VERIFICATION_CONFIG')
        if env_config:
            try:
                env_data = json.loads(env_config)
                config.update(env_data)
            except json.JSONDecodeError:
                print("Warning: Invalid VERIFICATION_CONFIG environment variable")
        
        return config
    
    def verify_pre_commit(self, modified_files: List[str]) -> bool:
        """Verify images before commit"""
        print(f"🔍 Pre-commit verification for {len(modified_files)} files...")
        
        # Basic checks for image files
        issues = []
        
        for file_path in modified_files:
            if not os.path.exists(file_path):
                continue
                
            try:
                from PIL import Image
                with Image.open(file_path) as img:
                    # Check file size
                    file_size = os.path.getsize(file_path)
                    if file_size > 5 * 1024 * 1024:  # 5MB
                        issues.append(f"⚠️  {file_path}: File too large ({file_size / 1024 / 1024:.1f}MB)")
                    
                    # Check dimensions
                    if img.width > 4000 or img.height > 4000:
                        issues.append(f"⚠️  {file_path}: Dimensions too large ({img.width}x{img.height})")
                    
                    # Check format
                    if img.format not in ['JPEG', 'PNG', 'WEBP']:
                        issues.append(f"⚠️  {file_path}: Consider using JPEG, PNG, or WebP format")
                        
            except Exception as e:
                issues.append(f"❌ {file_path}: Error processing image - {e}")
        
        if issues:
            print("\n".join(issues))
            print("\n💡 Consider optimizing images before committing")
            return False
        
        print("✅ All images passed pre-commit verification")
        return True
    
    def verify_post_deploy(self, base_url: str, commit_hash: Optional[str] = None) -> Dict[str, Any]:
        """Verify deployment after push/deploy"""
        print(f"🚀 Post-deployment verification for {base_url}")
        
        if commit_hash:
            print(f"📝 Commit: {commit_hash}")
        
        # Update deployment config with base URL
        self.deployment_config.base_url = base_url
        
        # Run full verification workflow
        results = self.workflow.full_deployment_workflow()
        
        # Log results
        print(f"\n{'='*50}")
        print(f"DEPLOYMENT VERIFICATION RESULTS")
        print(f"{'='*50}")
        print(f"Tests: {results['passed_tests']}/{results['total_tests']}")
        print(f"Success Rate: {results['success_rate']:.1f}%")
        print(f"Duration: {results['duration']:.1f}s")
        
        if results['failed_tests'] > 0:
            print(f"\n❌ {results['failed_tests']} tests failed:")
            for result in results['results']:
                if not result['success']:
                    print(f"  • {result['name']}: {result['result'].message}")
        else:
            print(f"\n✅ All tests passed!")
        
        return results
    
    def verify_ci_pipeline(self, base_url: str) -> bool:
        """Verify in CI/CD pipeline"""
        print("🤖 Running CI pipeline verification...")
        
        try:
            results = self.verify_post_deploy(base_url)
            success = results['failed_tests'] == 0
            
            # Create CI-friendly output
            if 'GITHUB_ACTIONS' in os.environ:
                self._create_github_summary(results)
            
            return success
            
        except Exception as e:
            print(f"❌ CI verification failed: {e}")
            return False
    
    def verify_webhook(self, url: str) -> Dict[str, Any]:
        """Handle webhook verification request"""
        print(f"🔗 Webhook verification for {url}")
        
        try:
            # Simple single-page verification
            result = self.agent.verify_deployment(
                url=url,
                test_name="webhook_verification"
            )
            
            return {
                'success': result.success,
                'message': result.message,
                'similarity_score': result.similarity_score,
                'timestamp': result.timestamp
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f"Verification error: {e}",
                'timestamp': datetime.now().isoformat()
            }
    
    def _create_github_summary(self, results: Dict[str, Any]):
        """Create GitHub Actions job summary"""
        summary_file = os.environ.get('GITHUB_STEP_SUMMARY')
        if not summary_file:
            return
            
        summary_content = f"""# 🔍 Image Verification Results

## Summary
- **Total Tests:** {results['total_tests']}
- **Passed:** {results['passed_tests']}
- **Failed:** {results['failed_tests']}
- **Success Rate:** {results['success_rate']:.1f}%
- **Duration:** {results['duration']:.1f}s

## Test Results
"""
        
        for result in results['results']:
            status_emoji = "✅" if result['success'] else "❌"
            summary_content += f"- {status_emoji} **{result['name']}**: {result['result'].message}\n"
        
        if results['failed_tests'] > 0:
            summary_content += "\n## ⚠️ Action Required\nSome tests failed. Please review the verification reports and fix any issues before deploying to production.\n"
        
        try:
            with open(summary_file, 'w') as f:
                f.write(summary_content)
        except Exception as e:
            print(f"Warning: Could not create GitHub summary: {e}")


def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description="Deployment Verification Workflow")
    parser.add_argument('--mode', required=True, 
                       choices=['pre-commit', 'post-deploy', 'ci', 'webhook', 'setup'],
                       help='Verification mode')
    parser.add_argument('--config', help='Configuration file path')
    parser.add_argument('--base-url', help='Base URL to verify')
    parser.add_argument('--url', help='Single URL to verify')
    parser.add_argument('--files', help='Comma-separated list of files (pre-commit mode)')
    parser.add_argument('--commit', help='Commit hash (post-deploy mode)')
    
    args = parser.parse_args()
    
    if args.mode == 'setup':
        print("🛠️  Setting up deployment verification...")
        
        # Create directory structure
        from image_verification_utils import setup_verification_environment
        setup_verification_environment()
        
        # Install Git hooks
        git_integration = GitHookIntegration()
        git_integration.install_pre_commit_hook()
        git_integration.install_post_receive_hook()
        
        # Create CI configurations
        ci_integration = CIPipelineIntegration()
        ci_integration.create_github_action()
        ci_integration.create_vercel_config()
        
        print("\n✅ Deployment verification setup complete!")
        print("📝 Don't forget to:")
        print("1. Update configuration files with your URLs")
        print("2. Set up environment variables/secrets")
        print("3. Test the verification workflow")
        
        return 0
    
    # Initialize verifier
    verifier = DeploymentVerifier(args.config)
    
    if args.mode == 'pre-commit':
        files = args.files.split(',') if args.files else []
        success = verifier.verify_pre_commit(files)
        return 0 if success else 1
        
    elif args.mode == 'post-deploy':
        if not args.base_url:
            print("❌ --base-url required for post-deploy mode")
            return 1
        
        results = verifier.verify_post_deploy(args.base_url, args.commit)
        return 0 if results['failed_tests'] == 0 else 1
        
    elif args.mode == 'ci':
        if not args.base_url:
            print("❌ --base-url required for CI mode")
            return 1
        
        success = verifier.verify_ci_pipeline(args.base_url)
        return 0 if success else 1
        
    elif args.mode == 'webhook':
        if not args.url:
            print("❌ --url required for webhook mode")
            return 1
        
        result = verifier.verify_webhook(args.url)
        print(json.dumps(result, indent=2))
        return 0 if result['success'] else 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())