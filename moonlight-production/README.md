# Moonlight Analytica - Production Deployment System

## 🎯 Overview
Clean, standardized deployment system for moonlightanalytica.com

## 📁 Directory Structure
```
moonlight-production/
├── articles/                    # Article HTML files
│   └── google-nano-banana-photoshop-killer.html
├── pages/                       # Main site pages  
│   ├── moonlight-complete-structure.html (home)
│   ├── news.html
│   └── contact.html
├── assets/                      # Images, CSS, JS (future)
├── scripts/                     # CMS and utility scripts
│   ├── simple-cms-system.py
│   └── simple_logo_generator.py
├── public/                      # Auto-generated (don't edit)
├── deploy.py                    # Main deployment script
├── deploy.bat                   # Windows quick deploy
├── vercel.json                  # Auto-generated
└── deployment.log               # Deployment history
```

## 🚀 Deployment Commands

### Windows (Easy)
```cmd
# Test deployment (dry run)
deploy.bat test

# Deploy to production
deploy.bat
```

### Python (All platforms)
```bash
# Test deployment
python deploy.py --dry-run

# Deploy to production  
python deploy.py
```

## ✅ Deployment Process
1. **Clean** - Removes old public directory
2. **Copy** - Copies all content files
3. **Configure** - Creates Vercel config
4. **Verify** - Checks required files exist
5. **Deploy** - Pushes to production
6. **Log** - Records deployment details

## 📝 Adding New Content

### New Article
1. Create HTML file in `articles/` directory
2. Use existing article as template
3. Run deployment script
4. Article accessible at `moonlightanalytica.com/article-name.html`

### Update News Page
1. Edit `pages/news.html` 
2. Add new article preview
3. Run deployment script

## 🔧 Configuration
- **Domain**: moonlightanalytica.com (production)
- **Vercel Project**: moonlight-analytica  
- **Deployment**: Automatic to production
- **Cache**: 1 hour browser, 24 hours CDN

## 📊 Monitoring
- Check `deployment.log` for deployment history
- Each deployment creates `public/deployment-info.json`
- Failed deployments logged with ERROR level

## 🆘 Troubleshooting

### Deployment Fails
1. Check `deployment.log` for errors
2. Verify required files exist in source directories
3. Ensure Vercel CLI is logged in: `vercel login`
4. Try dry run first: `python deploy.py --dry-run`

### Files Not Showing  
1. Clear browser cache
2. Check file copied to `public/` directory
3. Verify deployment completed successfully
4. Check Vercel dashboard for deployment status

### Domain Issues
1. Confirm `moonlight-analytica` project has `moonlightanalytica.com`
2. Check DNS settings in Vercel dashboard
3. Wait up to 24 hours for DNS propagation

## 🎉 Success Indicators
- ✅ All files copied successfully
- ✅ Vercel deployment completes without errors  
- ✅ Site loads at https://moonlightanalytica.com
- ✅ All links work correctly
- ✅ Articles display properly

---

## 🚫 Important Rules
1. **NEVER edit files in `public/` directory** - they get overwritten
2. **ALWAYS use deployment script** - no manual file copying
3. **TEST with dry run first** for important changes
4. **ONE deployment method only** - use this system exclusively
5. **Keep it simple** - don't add complexity until basics work perfectly