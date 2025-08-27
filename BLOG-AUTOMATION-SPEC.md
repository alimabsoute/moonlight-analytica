# Blog Automation System Technical Specification

## Current Status - December 2024
**Project Status**: On Hold - Prioritizing Core Website UI/UX
**Next Review**: After Janus Beta launch and hero section completion

## Overview
Automated daily blog article generation system for Moonlight Analytica that scrapes tech news sources, analyzes content, and generates 1,500-2,500 word SEO-optimized articles.

## Recent Updates
- **Hero section redesigned** with neon cyber theme and proper CTA hierarchy
- **Janus Beta positioning** as premium visual line counter solution
- **UI design system** established for consistent future development
- **Mobile responsiveness** implemented across landing page

## System Architecture

### Phase 1: Data Collection & Storage
**Goal**: Reliable content scraping and storage system
**Timeline**: Week 1-2

#### Technical Stack
```javascript
// Backend Framework
- Node.js (v18+)
- Express.js server
- Cron jobs (node-cron)

// Database
- Supabase PostgreSQL (existing setup)
- Tables: articles, sources, keywords, publishing_queue

// Web Scraping
- Puppeteer (for dynamic content)
- Cheerio (for HTML parsing)
- node-fetch (for API calls)
- RSS Parser (for RSS feeds)
```

#### Manual Inputs Needed From You
1. **Content Sources List**: Final approval of which sites to scrape
2. **Rate Limiting Preferences**: How frequently to scrape each source
3. **Content Filtering Rules**: Topics to include/exclude
4. **Database Schema Review**: Approve table structures

#### Deliverables
- [ ] Web scraping infrastructure
- [ ] Database schema with tables
- [ ] Content deduplication system
- [ ] Basic admin dashboard to monitor scraping

---

### Phase 2: Content Analysis & Selection
**Goal**: AI-powered content ranking and topic selection
**Timeline**: Week 3

#### Technical Stack
```javascript
// AI Services
- Claude AI API (Anthropic) - primary article generation
- OpenAI GPT-4 API (your existing ChatGPT Pro) - content analysis & SEO
- Fallback system between both APIs

// SEO Tools (Custom Solution)
- Google Trends API (trending topics) - FREE
- Reddit API (trending discussions) - FREE  
- Hacker News API (tech community insights) - FREE
- Custom keyword extraction from scraped content
- AI-powered SEO optimization (using Claude/ChatGPT)

// Content Processing
- Natural Language Processing libraries
- Sentiment analysis
- Keyword extraction
```

#### Manual Inputs Needed From You
1. **Content Criteria**: Define what makes a "good" article topic
2. **Brand Voice Guidelines**: Your preferred writing style/tone
3. **SEO Target Keywords**: Primary focus areas for Moonlight Analytica
4. **API Keys**: Claude AI, OpenAI (your ChatGPT Pro) credentials

#### Deliverables
- [ ] Content scoring algorithm
- [ ] Topic selection automation
- [ ] SEO keyword integration
- [ ] Daily topic recommendation system

---

### Phase 3: Article Generation
**Goal**: Automated long-form article writing with SEO optimization
**Timeline**: Week 4-5

#### Technical Stack
```javascript
// Content Generation
- Claude AI API (primary article writing)
- OpenAI GPT-4 (SEO optimization & analysis)
- Custom prompts for consistent quality
- Dual-AI system for best results

// Content Management
- Rich text formatting
- Image integration (Unsplash API)
- Internal linking system
- Meta data generation
```

#### Manual Inputs Needed From You
1. **Article Templates**: Approve structure and formatting
2. **Quality Standards**: Review sample articles and provide feedback
3. **Brand Integration**: How to incorporate Moonlight Analytica perspective
4. **Publishing Approval**: Manual review process before going fully automated

#### Deliverables
- [ ] Article generation system
- [ ] SEO optimization engine
- [ ] Content formatting pipeline
- [ ] Quality assurance checks

---

### Phase 4: Publishing & Distribution
**Goal**: Automated publishing to blog and social media
**Timeline**: Week 6

#### Technical Stack
```javascript
// Publishing Platforms
- Direct integration with existing Moonlight Analytica HTML site
- Dynamic content injection into insights.html
- Static HTML generation for individual articles
- Social media APIs (Twitter, LinkedIn)
- Email newsletter system (ConvertKit/Mailchimp)

// Scheduling
- Advanced cron jobs
- Publishing queue management
- Error handling and retry logic
- HTML template system for consistent styling
```

#### Manual Inputs Needed From You
1. **HTML Template Approval**: Review article layout design
2. **Social Media Accounts**: Twitter, LinkedIn API access
3. **Publishing Schedule**: Preferred times for posting
4. **Distribution Strategy**: Which platforms get what content
5. **File Structure**: Confirm how to organize article files

#### Deliverables
- [ ] HTML article generation system
- [ ] Dynamic insights.html page updates
- [ ] Individual article pages with consistent styling
- [ ] Social media distribution
- [ ] Email newsletter integration
- [ ] Publishing analytics dashboard

---

## HTML Site Integration Approach

### Current Site Structure
- **insights.html**: Main blog listing page (already created)
- **Individual article pages**: Will be generated (e.g., `article-2024-12-27-ai-breakthrough.html`)
- **Consistent styling**: Match existing glass morphism design

### Publishing System
```javascript
// Article Generation Process
1. Generate article content in database
2. Create individual HTML file using template
3. Update insights.html with new article card
4. Maintain file naming convention
5. Preserve existing site styling/navigation
```

### File Organization
```
C:\Users\alima\
├── insights.html                 # Main blog page (updated automatically)
├── articles/
│   ├── 2024-12-27-ai-breakthrough.html
│   ├── 2024-12-28-saas-trends.html
│   └── 2024-12-29-productivity-tools.html
├── templates/
│   ├── article-template.html     # Template for individual articles
│   └── blog-card-template.html   # Template for insights.html cards
└── automation/
    ├── content-scraper.js
    ├── article-generator.js
    └── html-publisher.js
```

### Integration Benefits
- **No external CMS**: Everything stays on your existing site
- **Consistent design**: Articles match your glass morphism theme
- **Fast loading**: Static HTML files
- **SEO friendly**: Individual URLs for each article
- **Full control**: No third-party dependencies for content

---

## Hosting & Backend Architecture

### Option 1: Vercel + Supabase (Recommended)
**Best for**: Scalable, professional deployment

```javascript
// Frontend Hosting
- Vercel (free tier supports this perfectly)
- Automatic deployments from Git
- Global CDN for fast loading
- Custom domain support

// Backend Infrastructure
- Supabase (your existing setup)
- Database for articles, sources, keywords
- Edge functions for automation scripts
- Scheduled functions (cron jobs)

// File Structure on Vercel
vercel-project/
├── public/
│   ├── index.html              # Your landing page
│   ├── insights.html           # Blog listing
│   ├── products.html
│   └── articles/               # Generated articles
├── api/
│   ├── scrape-content.js       # Vercel serverless function
│   ├── generate-article.js     # Article generation
│   └── publish-article.js      # Publishing automation
└── vercel.json                 # Deployment config with cron
```

### Option 2: Local Development + Static Hosting
**Best for**: Simple setup, full control

```javascript
// Development Environment
- Run automation scripts locally (your current setup)
- Generate HTML files on your machine
- Supabase for data storage (cloud)

// Hosting Options
- Vercel (deploy static files)
- Netlify (free tier)
- GitHub Pages (free)
- Any static hosting service

// Workflow
1. Automation runs on your local machine
2. Generates HTML files in project folder
3. Git push triggers automatic deployment
4. Site updates live automatically
```

### Option 3: Hybrid Approach (Recommended Start)
**Best for**: Easy transition, minimal setup

```javascript
// Phase 1: Local Development
- Build and test everything locally
- Use your existing Supabase setup
- Generate articles on your machine
- Deploy static files to Vercel/Netlify

// Phase 2: Move to Cloud (Later)
- Migrate automation to Vercel Edge Functions
- Keep database in Supabase
- Fully automated cloud deployment
```

### Required Services & Costs

#### Supabase (Database & Backend)
- **Free tier**: 500MB database, 2GB bandwidth
- **Pro tier**: $25/month (if you need more)
- **What it handles**: Article storage, content analysis, user data

#### Vercel (Hosting & Automation)
- **Free tier**: 100GB bandwidth, unlimited static sites
- **Pro tier**: $20/month (for more edge function usage)
- **What it handles**: Site hosting, scheduled functions, API endpoints

#### Total Monthly Costs
```
Minimum Setup:
- Supabase Free + Vercel Free = $0/month
- Claude AI API = $15-25/month
- OpenAI API (your ChatGPT Pro) = $20/month (you already have this!)
- Custom SEO solution = $0/month (FREE APIs + AI)
- Total: ~$35-45/month ✅

Production Ready:
- Supabase Pro + Vercel Pro = $45/month
- Claude AI API = $25-40/month
- OpenAI API = $20/month
- Custom SEO solution = $0/month
- Total: ~$90-105/month ✅
```

### Deployment Strategy

#### Immediate (This Week)
1. **Deploy current site** to Vercel (5 minutes)
2. **Connect custom domain** if you have one
3. **Test all pages** work correctly

#### Phase 1 (Week 1-2)
1. **Build automation locally** on your machine
2. **Test with Supabase** database
3. **Generate first articles** manually

#### Phase 2 (Week 3-4)
1. **Move automation to Vercel** Edge Functions
2. **Set up scheduled jobs** (daily article generation)
3. **Full automation** running in cloud

### Recommended Approach
**Start Simple → Scale Smart**

1. **Today**: Deploy your current HTML site to Vercel (free)
2. **Week 1**: Build automation locally, test with Supabase
3. **Week 2**: Generate first articles, prove the system works
4. **Week 3+**: Move to cloud automation for full hands-off operation

This gives you a professional setup that costs almost nothing to start, but can scale to handle millions of visitors.

---

## Custom SEO Solution (No SEMrush Needed)

### Free Data Sources
```javascript
// Trending Topics
- Google Trends API (free, official)
- Reddit API (trending discussions by subreddit)  
- Hacker News API (tech community trends)
- Twitter API v2 (trending hashtags) - free tier
- GitHub Trending (popular repositories)

// Search Intent Analysis  
- Google Search Console API (if you have GSC setup)
- YouTube API (trending tech videos for content ideas)
- Wikipedia API (related topics and references)
```

### AI-Powered SEO Strategy
```javascript
// Keyword Research Process
1. Extract keywords from scraped tech articles
2. Use ChatGPT Pro to expand keyword lists
3. Claude AI analyzes search intent and competition
4. Cross-reference with Google Trends for volume
5. Generate LSI (semantically related) keywords

// Content Optimization
1. Claude AI writes the article with SEO structure
2. ChatGPT Pro optimizes meta descriptions  
3. AI generates internal linking suggestions
4. Auto-create featured snippet targets
5. Optimize for voice search queries
```

### Custom Keyword Database
```sql
CREATE TABLE keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(200) NOT NULL,
  search_intent VARCHAR(50), -- 'informational', 'commercial', 'navigational'
  trend_score INTEGER, -- from Google Trends
  difficulty_score INTEGER, -- AI-estimated based on competition
  related_keywords TEXT[], -- LSI keywords
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE keyword_performance (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES keywords(id),
  article_id INTEGER REFERENCES articles(id),
  ranking_position INTEGER,
  clicks INTEGER,
  impressions INTEGER,
  date_recorded DATE DEFAULT CURRENT_DATE
);
```

### SEO Analysis Features
- **Competitor Analysis**: Scrape top-ranking articles for target keywords
- **Content Gap Detection**: Find topics competitors haven't covered well
- **Trend Prediction**: Use AI to predict upcoming trending topics
- **Performance Tracking**: Monitor your own article rankings
- **Auto-Optimization**: Update articles that drop in rankings

### Implementation Benefits
- **$99/month savings** (no SEMrush needed)
- **Real-time data** from multiple free sources
- **AI-powered insights** potentially better than traditional tools
- **Custom to your niche** (tech/AI/SaaS focus)
- **Continuous learning** system that improves over time

---

## Database Schema

### Articles Table
```sql
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  seo_keywords TEXT[],
  meta_description VARCHAR(160),
  source_urls TEXT[],
  publish_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',
  word_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Sources Table
```sql
CREATE TABLE content_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type VARCHAR(20), -- 'rss', 'scrape', 'api'
  scrape_frequency INTEGER DEFAULT 60, -- minutes
  last_scraped TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### Keywords Table
```sql
CREATE TABLE seo_keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(200) NOT NULL,
  search_volume INTEGER,
  competition_level VARCHAR(10),
  trend_score DECIMAL(3,2),
  last_updated TIMESTAMP DEFAULT NOW()
);
```

## Required Environment Variables
```bash
# AI API Keys
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_chatgpt_pro_key
SEMRUSH_API_KEY=your_semrush_key
UNSPLASH_ACCESS_KEY=your_unsplash_key

# Database (using existing Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Publishing
MOONLIGHT_SITE_PATH=C:\Users\alima\
ARTICLE_TEMPLATE_PATH=./templates/
BACKUP_PATH=./backups/

# Social Media
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
LINKEDIN_ACCESS_TOKEN=your_linkedin_token

# Email
MAILCHIMP_API_KEY=your_mailchimp_key
MAILCHIMP_LIST_ID=your_list_id
```

## Content Source List (For Your Review)

### Tier 1 Sources (Daily Scraping)
- [ ] TechCrunch (RSS + Web)
- [ ] The Verge (RSS)
- [ ] Ars Technica (RSS)
- [ ] Wired (RSS)
- [ ] MIT Technology Review (RSS)

### Tier 2 Sources (Twice Daily)
- [ ] Hacker News (API)
- [ ] Reddit r/technology (API)
- [ ] Reddit r/artificial (API)
- [ ] Product Hunt (API)
- [ ] VentureBeat (RSS)

### Tier 3 Sources (Weekly)
- [ ] GitHub Trending (API)
- [ ] Y Combinator News
- [ ] Engadget (RSS)
- [ ] TechRadar (RSS)

## Manual Review Checkpoints

### Before Each Phase
1. **Technical Review**: Code review and testing
2. **Content Quality Check**: Sample output evaluation
3. **Performance Testing**: System load and reliability
4. **Your Approval**: Sign-off before proceeding

### Ongoing Manual Inputs
1. **Weekly Content Review**: Check article quality
2. **SEO Performance**: Review keyword rankings
3. **Topic Adjustments**: Modify focus areas as needed
4. **System Monitoring**: Performance and error alerts

## Success Metrics
- **Daily Output**: 1 article (1,500-2,500 words)
- **SEO Performance**: Improved search rankings
- **Content Quality**: Engaging, original analysis
- **System Reliability**: 99% uptime for automation
- **Time Savings**: Near-zero manual effort after setup

## Risk Mitigation
- **Content Backup**: All articles stored in database
- **Manual Override**: Ability to pause/modify automation
- **Quality Filters**: Multiple checkpoints before publishing
- **Legal Compliance**: Proper attribution and fair use

## Cost Estimates (Monthly)
- Claude AI API: ~$15-25 (much more cost-effective for long articles)
- OpenAI API: $20 (your existing ChatGPT Pro subscription)
- Custom SEO Solution: $0 (using free APIs + AI analysis)
- Hosting/Infrastructure: $0-45 (Vercel + Supabase free tiers)
- **Total**: ~$35-90/month for fully automated system

## Next Steps
1. **Review this specification** and provide feedback
2. **Approve content source list**
3. **Set up required API accounts** (OpenAI, SEMrush, etc.)
4. **Define success criteria** and quality standards
5. **Begin Phase 1 development**