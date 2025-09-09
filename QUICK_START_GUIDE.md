# Image Verification System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This quick start guide will have you running image verification in minutes.

---

## Step 1: Installation

### Automated Setup (Recommended)
```bash
# Run the automated setup script
python setup_image_verification.py --auto
```

### Manual Setup
```bash
# Install dependencies
pip install -r requirements_image_verification.txt

# Create directories and configs
python image_verification_utils.py setup
```

---

## Step 2: First Test

### Test Your Website
```bash
# Replace with your URL
python image_verification_agent.py \
    --url "https://your-website.com" \
    --test-name "homepage_test"
```

### Expected Output
```
🔍 Running image verification...
📸 Screenshot captured: verification_screenshots/homepage_test_20240907_143052_after.png
🔍 Image comparison completed: SSIM=0.000, PixelDiff=0, HashDiff=999
⚠️ WARNING: Images are identical - deployment may have failed

===============================================
VERIFICATION RESULT: FAILED
===============================================
Test: homepage_test
URL: https://your-website.com
Similarity Score: 0.0000
Pixel Differences: 0
Hash Difference: 999
Message: WARNING: Images are identical - deployment may have failed
===============================================
```

---

## Step 3: Configure for Your Project

### Edit Configuration
```bash
# Edit the main config file
nano verification_configs/default_config.json
```

### Key Settings to Update:
```json
{
  "deployment": {
    "base_url": "https://YOUR-WEBSITE.com",
    "pages_to_verify": [
      {"name": "homepage", "url": "/"},
      {"name": "about", "url": "/about"},
      {"name": "products", "url": "/products"}
    ]
  },
  "notifications": {
    "slack_webhook": "https://hooks.slack.com/services/YOUR/WEBHOOK"
  }
}
```

---

## Step 4: Integration

### Git Hook (Automatic)
The setup script already installed a pre-commit hook. Test it:

```bash
# Make an image change
git add modified-image.png
git commit -m "Update hero image"
# Hook runs automatically
```

### CI/CD Pipeline
GitHub Actions workflow is already created at `.github/workflows/image-verification.yml`

Update your repository secrets:
- `SLACK_WEBHOOK`: Your Slack webhook URL  
- `VERIFICATION_CONFIG`: Additional config overrides

---

## Step 5: Real Deployment Test

### Before/After Comparison
```bash
# 1. Capture before screenshot
python image_verification_agent.py \
    --url "https://your-website.com" \
    --test-name "before_deploy"

# 2. Make your changes and deploy

# 3. Verify deployment with comparison
python deployment_verification_workflow.py \
    --mode post-deploy \
    --base-url "https://your-website.com" \
    --commit "abc123"
```

---

## Common Commands

### Single Page Verification
```bash
python image_verification_agent.py \
    --url "https://example.com/page" \
    --test-name "page_verification" \
    --mobile  # Add for mobile testing
```

### Batch Verification
```bash
# Create urls.json with your pages
echo '[
  {"url": "https://example.com/", "name": "homepage"},
  {"url": "https://example.com/about", "name": "about"}
]' > urls.json

# Run batch verification
python -c "
from image_verification_utils import BatchProcessor
from image_verification_agent import ImageVerificationAgent
agent = ImageVerificationAgent()
processor = BatchProcessor(agent)
results = processor.process_url_list('urls.json')
print(f'Results: {len([r for r in results if r[\"success\"]])} passed')
"
```

### Full Deployment Workflow
```bash
python deployment_verification_workflow.py \
    --mode post-deploy \
    --base-url "https://your-website.com"
```

---

## Understanding Results

### ✅ Success Criteria
- **SSIM Score**: 0.85-0.99 (similar but with changes)
- **Changes Detected**: Visual differences present
- **Images Load**: No broken image errors

### ❌ Failure Indicators  
- **Identical Images**: SSIM = 1.0 (deployment likely failed)
- **Extreme Differences**: SSIM < 0.5 (unexpected major changes)
- **Loading Errors**: Screenshots fail to capture

### 📊 Reading Reports
Check the generated HTML reports in `verification_reports/` for:
- Side-by-side image comparison
- Detailed similarity metrics
- Visual difference heatmaps

---

## Environment Variables

```bash
# Optional environment setup
export SLACK_WEBHOOK="https://hooks.slack.com/services/..."
export VERIFICATION_CONFIG='{"similarity_threshold": 0.90}'
export CHROME_BIN="/usr/bin/google-chrome"  # If Chrome in custom location
```

---

## Troubleshooting

### Chrome/ChromeDriver Issues
```bash
# Install Chrome (Ubuntu/Debian)
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update && sudo apt install google-chrome-stable

# Test Chrome
google-chrome --version
```

### Permission Issues
```bash
# Fix directory permissions
chmod -R 755 verification_*
```

### Import Errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements_image_verification.txt
```

---

## Next Steps

1. **Customize thresholds** for your specific use case
2. **Set up notifications** (Slack, email, webhooks)
3. **Integrate with deployment pipeline**
4. **Train your team** on the verification process
5. **Schedule regular audits** of all pages

---

## Need Help?

- 📖 **Full Documentation**: `IMAGE-VERIFICATION-MANAGEMENT-SYSTEM.md`
- 🔧 **Troubleshooting**: Check the troubleshooting section in the full docs
- 🐛 **Issues**: Create detailed bug reports with logs and screenshots
- 💬 **Questions**: Contact the development team

---

**Remember**: This system is mandatory for all image-related deployments. It prevents silent failures and ensures your changes actually take effect!

✅ **You're now ready to verify your deployments with confidence!**