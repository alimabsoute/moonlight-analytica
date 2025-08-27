# Content Discovery Agent Configuration

## Agent Purpose
Autonomous content discovery and trend analysis agent responsible for scraping tech news sources, identifying trending topics, and feeding high-quality content opportunities to the content generation pipeline.

## Agent Responsibilities
- Monitor 15+ tech news sources for breaking stories
- Analyze trending topics across Reddit, Hacker News, and social platforms
- Score content relevance and viral potential
- Detect duplicate stories and prioritize authoritative sources
- Feed content opportunities to Content Generation Agent

## Data Sources Configuration

### Tier 1 Sources (RSS - Every 30 minutes)
```javascript
sources: [
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    type: "rss",
    priority: 9,
    categories: ["startups", "funding", "AI", "SaaS"],
    reliability_score: 0.95
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    type: "rss", 
    priority: 9,
    categories: ["tech", "reviews", "industry"],
    reliability_score: 0.93
  },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    type: "rss",
    priority: 8,
    categories: ["deep-tech", "analysis", "science"],
    reliability_score: 0.97
  }
]
```

### Tier 2 Sources (API - Every 60 minutes)
```javascript
api_sources: [
  {
    name: "Hacker News",
    endpoint: "https://hacker-news.firebaseio.com/v0/topstories.json",
    type: "api",
    priority: 8,
    rate_limit: "1req/sec",
    categories: ["developer", "startup", "tech"]
  },
  {
    name: "Reddit Technology",
    endpoint: "https://www.reddit.com/r/technology/hot.json",
    type: "api", 
    priority: 7,
    rate_limit: "60req/hour",
    categories: ["tech", "discussion", "trends"]
  },
  {
    name: "Product Hunt",
    endpoint: "https://api.producthunt.com/v2/posts",
    type: "api",
    priority: 7,
    auth_required: true,
    categories: ["products", "launches", "tools"]
  }
]
```

## Content Scoring Algorithm

### Relevance Scoring (0-100)
```javascript
scoring_criteria: {
  keyword_match: {
    weight: 0.25,
    keywords: ["AI", "machine learning", "SaaS", "productivity", "analytics", "startup", "automation", "API", "developer tools"]
  },
  source_authority: {
    weight: 0.20,
    tier1_sources: 1.0,
    tier2_sources: 0.8,
    tier3_sources: 0.6
  },
  engagement_potential: {
    weight: 0.25,
    social_shares: "reddit_score + hn_points",
    comment_volume: "discussion_activity",
    trending_velocity: "mentions_per_hour"
  },
  freshness: {
    weight: 0.15,
    optimal_age: "0-6 hours",
    decay_rate: "exponential"
  },
  content_depth: {
    weight: 0.15,
    min_word_count: 500,
    technical_detail: "code_examples + data_charts",
    unique_insights: "exclusive_quotes + original_research"
  }
}
```

### Viral Potential Indicators
- **Social velocity**: Rapid increase in mentions/shares
- **Community engagement**: High comment-to-upvote ratio
- **Cross-platform mentions**: Story appearing on multiple platforms
- **Expert citations**: Industry leaders sharing/commenting
- **Controversial topics**: High engagement potential but requires manual review

## Trend Detection System

### Keyword Trend Analysis
```javascript
trend_detection: {
  tracking_period: "7 days",
  keyword_monitoring: [
    "emerging tech terms",
    "company mentions (IPOs, acquisitions)", 
    "product launches",
    "regulatory changes",
    "funding announcements"
  ],
  trend_threshold: {
    mention_increase: "300% week-over-week",
    velocity: "10+ mentions per hour",
    source_diversity: "minimum 5 different sources"
  }
}
```

### Topic Clustering
- **Semantic grouping**: Group similar stories by topic
- **Timeline tracking**: Monitor story evolution over time
- **Impact assessment**: Measure story importance and longevity
- **Opportunity identification**: Find unique angles on trending topics

## Content Filtering Rules

### Auto-Accept Criteria (Score 80+)
- Major tech company announcements
- Significant AI/ML breakthroughs  
- Large funding rounds ($50M+)
- New developer tools with viral uptake
- Industry regulatory changes

### Auto-Reject Criteria (Score <30)
- Content older than 48 hours
- Duplicate stories already covered
- Non-English content
- Paywall-only sources
- Low engagement/social proof

### Manual Review Queue (Score 30-79)
- Controversial topics requiring brand alignment check
- Complex technical topics needing accuracy verification
- Stories with mixed signal quality
- First-time coverage of new companies/products

## Data Output Format

### Content Opportunity Structure
```json
{
  "story_id": "unique_identifier",
  "title": "original_headline",
  "source": "publication_name", 
  "url": "original_article_url",
  "published_at": "ISO_timestamp",
  "discovered_at": "ISO_timestamp",
  "relevance_score": 85,
  "viral_potential": "high",
  "category": "AI/ML",
  "keywords": ["artificial intelligence", "GPT", "automation"],
  "summary": "150_word_summary",
  "angle_suggestions": [
    "How this impacts SaaS companies",
    "What this means for developers", 
    "Market implications analysis"
  ],
  "related_stories": ["story_id_1", "story_id_2"],
  "sentiment": "positive",
  "technical_complexity": "intermediate"
}
```

## Performance Monitoring

### Success Metrics
- **Discovery accuracy**: % of flagged stories that become viral (target: 70%+)
- **Content freshness**: Average age of discovered content (target: <6 hours)
- **Source coverage**: % uptime for all monitored sources (target: 95%+)
- **Duplicate detection**: % reduction in duplicate content (target: 90%+)

### Alert Conditions
- Source downtime >15 minutes
- Relevance score accuracy drops below 60%
- API rate limit violations
- Content pipeline delays >2 hours
- Unusual traffic patterns (potential news event)

## Error Handling

### API Failures
- **Retry logic**: Exponential backoff (1s, 2s, 4s, 8s)
- **Fallback sources**: Switch to RSS if API unavailable
- **Cache strategy**: Serve cached content during outages
- **Manual override**: Emergency content injection capability

### Rate Limiting
- **Intelligent queuing**: Distribute requests across time windows
- **Priority system**: Critical sources get priority during limits
- **Alternative endpoints**: Use multiple API endpoints where available
- **Graceful degradation**: Reduce update frequency rather than fail

## Integration Points

### Upstream Data Flow
- **Scheduled execution**: Every 30 minutes via cron job
- **Event-triggered**: Breaking news alerts, trending topic spikes
- **Manual triggers**: On-demand content discovery requests

### Downstream Handoffs
- **Content Generation Agent**: Scored content opportunities
- **SEO Agent**: Trending keywords and search terms
- **Analytics Agent**: Discovery performance metrics
- **Master Orchestrator**: Status updates and error alerts

## Configuration Management

### Environment Variables
```bash
# Content Discovery Agent Config
CONTENT_DISCOVERY_ENABLED=true
DISCOVERY_INTERVAL=30 # minutes
MIN_RELEVANCE_SCORE=30
MAX_DAILY_DISCOVERIES=50
TREND_DETECTION_ENABLED=true

# Source API Keys
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
PRODUCTHUNT_API_KEY=your_ph_api_key
HACKER_NEWS_API_KEY=not_required

# Database
DISCOVERY_TABLE=content_discoveries
TRENDS_TABLE=trending_topics
SOURCES_TABLE=content_sources
```

### Runtime Configuration
- **Source weights**: Adjustable priority scores per source
- **Category filters**: Enable/disable specific content categories
- **Quality thresholds**: Minimum scores for different actions
- **Trend sensitivity**: Adjust trend detection algorithms

This agent operates continuously in the background, feeding high-quality content opportunities to the content generation pipeline while maintaining ethical scraping practices and respecting source terms of service.