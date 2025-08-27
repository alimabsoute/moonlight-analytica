# Environment Setup & Configuration Guide

## Environment Variable Configuration

### Local Development (.env.local)
```bash
# NODE ENVIRONMENT
NODE_ENV=development
DEBUG=true

# SUPABASE LOCAL DEVELOPMENT
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# AI APIS (Development/Testing Keys)
ANTHROPIC_API_KEY=sk-ant-test-development-key-here
OPENAI_API_KEY=sk-test-development-key-here

# SOCIAL MEDIA (Test Accounts)
TWITTER_API_KEY=test-twitter-key
TWITTER_API_SECRET=test-twitter-secret
TWITTER_ACCESS_TOKEN=test-access-token
TWITTER_ACCESS_SECRET=test-access-secret
LINKEDIN_ACCESS_TOKEN=test-linkedin-token

# EMAIL MARKETING (Test Configuration)
MAILCHIMP_API_KEY=test-mailchimp-key
MAILCHIMP_LIST_ID=test-list-id

# DEVELOPMENT SETTINGS
RATE_LIMIT_BYPASS=true
SKIP_EMAIL_SENDING=true
MOCK_SOCIAL_POSTS=true
```

### Staging Environment (.env.staging)
```bash
# NODE ENVIRONMENT
NODE_ENV=staging
DEBUG=true

# SUPABASE STAGING
SUPABASE_URL=https://your-project-staging.supabase.co
SUPABASE_ANON_KEY=your-staging-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-key-here

# AI APIS (Staging Keys with Lower Limits)
ANTHROPIC_API_KEY=sk-ant-staging-key-here
OPENAI_API_KEY=sk-staging-key-here

# SOCIAL MEDIA (Test/Staging Accounts)
TWITTER_API_KEY=staging-twitter-key
TWITTER_API_SECRET=staging-twitter-secret
TWITTER_ACCESS_TOKEN=staging-access-token
TWITTER_ACCESS_SECRET=staging-access-secret
LINKEDIN_ACCESS_TOKEN=staging-linkedin-token

# EMAIL MARKETING (Test Lists)
MAILCHIMP_API_KEY=staging-mailchimp-key
MAILCHIMP_LIST_ID=staging-test-list-id

# STAGING SPECIFIC SETTINGS
RATE_LIMIT_BYPASS=false
SKIP_EMAIL_SENDING=false
MOCK_SOCIAL_POSTS=false
CONTENT_APPROVAL_REQUIRED=true
```

### Production Environment (.env.production)
```bash
# NODE ENVIRONMENT  
NODE_ENV=production
DEBUG=false

# SUPABASE PRODUCTION
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key-here

# AI APIS (Production Keys)
ANTHROPIC_API_KEY=sk-ant-production-key-here
OPENAI_API_KEY=sk-production-key-here

# SOCIAL MEDIA (Production Accounts)
TWITTER_API_KEY=production-twitter-key
TWITTER_API_SECRET=production-twitter-secret
TWITTER_ACCESS_TOKEN=production-access-token
TWITTER_ACCESS_SECRET=production-access-secret
LINKEDIN_ACCESS_TOKEN=production-linkedin-token

# EMAIL MARKETING (Production Lists)
MAILCHIMP_API_KEY=production-mailchimp-key
MAILCHIMP_LIST_ID=production-list-id

# PRODUCTION SETTINGS
RATE_LIMIT_BYPASS=false
SKIP_EMAIL_SENDING=false
MOCK_SOCIAL_POSTS=false
CONTENT_APPROVAL_REQUIRED=false
AUTO_PUBLISH_ENABLED=true

# MONITORING & ALERTS
SENTRY_DSN=https://your-sentry-dsn-here
ERROR_REPORTING_ENABLED=true
PERFORMANCE_MONITORING=true
```

## API Key Setup Instructions

### 1. Anthropic Claude AI API
1. Visit https://console.anthropic.com/
2. Create account or sign in
3. Go to "API Keys" section
4. Generate new API key
5. Set usage limits ($50/month recommended for testing)
6. Copy key to appropriate environment file

**Required Permissions**: 
- Message creation
- Model access to Claude 3 Sonnet/Haiku

### 2. OpenAI API (ChatGPT Pro)
1. Visit https://platform.openai.com/
2. Sign in with your ChatGPT Pro account
3. Go to "API Keys" section
4. Create new secret key
5. Set usage limits ($100/month recommended)
6. Copy key to appropriate environment file

**Required Models**:
- GPT-4 (for content analysis)
- GPT-3.5-turbo (for SEO optimization)

### 3. Supabase Setup
1. Visit https://supabase.com/dashboard
2. Create new project or use existing
3. Go to Settings → API
4. Copy Project URL and anon/service role keys
5. Configure Row Level Security policies
6. Set up required database tables

**Required Tables**:
- articles
- content_sources
- seo_keywords
- email_subscribers

### 4. Social Media APIs

#### Twitter/X API
1. Apply for Twitter Developer Account
2. Create new App in Developer Portal
3. Generate API keys and access tokens
4. Enable OAuth 2.0 for posting
5. Test with test tweets

**Required Permissions**:
- Read tweets
- Write tweets
- Read user information

#### LinkedIn API
1. Create LinkedIn Developer account
2. Create new application
3. Request Marketing Developer Platform access
4. Generate access tokens
5. Test with company page posting

**Required Permissions**:
- Share on LinkedIn
- Read/write company updates

### 5. Email Marketing Setup (Mailchimp)
1. Create Mailchimp account
2. Generate API key in Account settings
3. Create audience/list for subscribers
4. Set up automated campaigns
5. Configure webhook endpoints

**Required Features**:
- Audience management
- Campaign creation
- Automation workflows

## Environment Validation Scripts

### validate-environment.js
```javascript
#!/usr/bin/env node

const required = {
  development: [
    'NODE_ENV',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY'
  ],
  staging: [
    'NODE_ENV',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'TWITTER_API_KEY',
    'LINKEDIN_ACCESS_TOKEN',
    'MAILCHIMP_API_KEY'
  ],
  production: [
    'NODE_ENV',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'TWITTER_API_KEY',
    'LINKEDIN_ACCESS_TOKEN',
    'MAILCHIMP_API_KEY',
    'SENTRY_DSN'
  ]
};

function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const missing = required[env].filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for ${env}:`);
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  console.log(`✅ All required environment variables present for ${env}`);
  return true;
}

// Test API connections
async function testConnections() {
  console.log('🔍 Testing API connections...');
  
  const tests = [];
  
  // Test Supabase
  if (process.env.SUPABASE_URL) {
    tests.push(testSupabase());
  }
  
  // Test Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    tests.push(testAnthropic());
  }
  
  // Test OpenAI
  if (process.env.OPENAI_API_KEY) {
    tests.push(testOpenAI());
  }
  
  const results = await Promise.allSettled(tests);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ ${result.value}`);
    } else {
      console.error(`❌ ${result.reason}`);
    }
  });
  
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} connection test(s) failed`);
    process.exit(1);
  }
  
  console.log('\n✅ All connection tests passed!');
}

async function testSupabase() {
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      return 'Supabase connection successful';
    } else {
      throw new Error(`Supabase returned ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
}

async function testAnthropic() {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    
    if (response.ok) {
      return 'Anthropic Claude API connection successful';
    } else {
      const error = await response.text();
      throw new Error(`Anthropic returned ${response.status}: ${error}`);
    }
  } catch (error) {
    throw new Error(`Anthropic connection failed: ${error.message}`);
  }
}

async function testOpenAI() {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    });
    
    if (response.ok) {
      return 'OpenAI API connection successful';
    } else {
      const error = await response.text();
      throw new Error(`OpenAI returned ${response.status}: ${error}`);
    }
  } catch (error) {
    throw new Error(`OpenAI connection failed: ${error.message}`);
  }
}

// Run validation
if (require.main === module) {
  (async () => {
    try {
      validateEnvironment();
      await testConnections();
      console.log('\n🎉 Environment validation completed successfully!');
    } catch (error) {
      console.error('\n💥 Environment validation failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { validateEnvironment, testConnections };
```

## Database Setup Instructions

### Required Tables Schema

```sql
-- Articles table
CREATE TABLE articles (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  seo_keywords TEXT[],
  meta_description VARCHAR(160),
  source_urls TEXT[],
  publish_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'draft',
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content sources table
CREATE TABLE content_sources (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  type VARCHAR(20), -- 'rss', 'api', 'scrape'
  scrape_frequency INTEGER DEFAULT 60, -- minutes
  last_scraped TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO keywords table
CREATE TABLE seo_keywords (
  id BIGSERIAL PRIMARY KEY,
  keyword VARCHAR(200) NOT NULL,
  search_volume INTEGER,
  competition_level VARCHAR(10),
  trend_score DECIMAL(5,2),
  related_keywords TEXT[],
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email subscribers table  
CREATE TABLE email_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  interests TEXT[],
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_engagement TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_articles_publish_date ON articles(publish_date);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_content_sources_active ON content_sources(is_active);
CREATE INDEX idx_email_subscribers_active ON email_subscribers(is_active);
```

### Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access for published articles
CREATE POLICY "Public articles are viewable by everyone" ON articles
  FOR SELECT USING (status = 'published');

-- Service role full access
CREATE POLICY "Service role full access" ON articles
  FOR ALL USING (auth.role() = 'service_role');

-- Similar policies for other tables...
```

## Vercel Deployment Configuration

### vercel.json
```json
{
  "version": 2,
  "framework": "nextjs",
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/scrape-content",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/generate-article", 
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/social-media-post",
      "schedule": "0 9,13,17 * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## Security Checklist

### API Key Security
- [ ] Never commit API keys to version control
- [ ] Use environment variables for all secrets
- [ ] Rotate keys regularly (monthly)
- [ ] Use minimum required permissions
- [ ] Monitor API usage for anomalies

### Database Security
- [ ] Enable Row Level Security (RLS)
- [ ] Use service role only for server-side operations
- [ ] Regular database backups
- [ ] Monitor for unusual query patterns
- [ ] Sanitize all user inputs

### Application Security
- [ ] HTTPS only in production
- [ ] Secure headers configuration
- [ ] Input validation and sanitization
- [ ] Rate limiting on all endpoints
- [ ] Error handling without information leakage

## Troubleshooting Common Issues

### "Module not found" errors
**Solution**: 
1. Delete node_modules and package-lock.json
2. Run `npm install` 
3. Ensure all imports use correct relative paths
4. Check TypeScript configuration if using TS

### "Database connection failed"
**Solution**:
1. Verify Supabase project is active (not paused)
2. Check environment variables are correct
3. Verify network access (no firewall blocking)
4. Test connection with Supabase CLI: `npx supabase status`

### "API rate limit exceeded"  
**Solution**:
1. Implement exponential backoff
2. Monitor API usage in dashboards
3. Use multiple API keys if allowed
4. Cache responses when appropriate

### "CORS errors in production"
**Solution**:
1. Configure CORS headers in vercel.json
2. Verify domain configuration
3. Check API endpoints use correct URLs
4. Test from multiple browsers/locations

---

*Keep this guide updated as you add new services or change configurations.*