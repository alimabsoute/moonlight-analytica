# ForkFox Pipeline — Credentials Setup

One-time setup. Takes ~90 minutes total. Do this before anything else.

---

## Step 1: Facebook Developer App + ForkFox Page (~30 min)

### 1a. Create your ForkFox Facebook Page (if not done)
1. facebook.com → Create → Page
2. Name: "ForkFox" | Category: Food & Beverage Website
3. Fill bio: "Dish intelligence for Philly and SF. We score plates, not restaurants."
4. Set profile photo to your ForkFox logo

### 1b. Create a Facebook Developer App
1. developers.facebook.com → My Apps → Create App
2. Type: **Business** → name it "ForkFox Pipeline"
3. Add products: **Facebook Login**, **Instagram Graph API**

### 1c. Connect Instagram Business Account
1. On your Instagram app: Settings → Account → Switch to Professional → Business
2. Link it to your ForkFox Facebook Page
3. In Meta Business Suite, confirm the IG account is connected to the Page

### 1d. Get a long-lived Page Token
Run this (replace values):
```bash
# Step 1: short-lived user token — go to:
# developers.facebook.com → Tools → Graph API Explorer
# Select your app → Generate User Access Token
# Permissions: pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish

# Step 2: convert to long-lived (60-day):
curl "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_TOKEN}"

# Step 3: get Page Token from long-lived user token:
curl "https://graph.facebook.com/v19.0/me/accounts?access_token={LONG_LIVED_TOKEN}"
# → copy the access_token for your ForkFox Page — this is your FB_PAGE_TOKEN

# Step 4: get your Page ID and IG Account ID:
curl "https://graph.facebook.com/v19.0/{PAGE_ID}?fields=instagram_business_account&access_token={FB_PAGE_TOKEN}"
# → instagram_business_account.id = your IG_ACCOUNT_ID
```

**Calendar reminder:** Token expires in 60 days. Refresh with one curl command.

---

## Step 2: Twitter/X Developer App (~15 min)

1. developer.twitter.com → Sign in → Projects & Apps → New Project
2. Name project: "ForkFox" | Use case: Publishing & Curating Tweets
3. Create App within project → name: "ForkFox Pipeline"
4. App Settings → Keys and Tokens → Generate:
   - API Key + Secret
   - Access Token + Secret (for your account)
   - Make sure Access Token is set to **Read and Write**
5. Copy all 4 values

Free tier limits: 1,500 tweets/month = 50/day. Pipeline posts every 2nd article automatically.

---

## Step 3: Firecrawl (~5 min)

1. firecrawl.dev → Sign up (free)
2. Dashboard → API Keys → Create key → name: "ForkFox Pipeline"
3. Copy the key

Free tier: 500 scrapes/month (~150 articles). Upgrade to Starter ($16/mo) when you hit scale.

---

## Step 4: Anthropic API Key (~2 min)

1. console.anthropic.com → API Keys → Create Key
2. Name: "ForkFox Pipeline"
3. Copy the key

---

## Step 5: Vercel Token (~2 min)

1. vercel.com → Account Settings → Tokens → Create Token
2. Name: "forkfox-pipeline" | Scope: alimabsoute's team
3. Copy the token

Also collect from `tastyr-iq/landing-pages/.vercel/project.json`:
- `projectId` = your VERCEL_PROJECT_ID
- `orgId` = your VERCEL_ORG_ID

---

## Step 6: Add All Secrets to GitHub (~10 min)

1. github.com → alimabsoute/[your repo] → Settings → Secrets and variables → Actions
2. New repository secret for each:

| Secret Name | Where to get it |
|-------------|----------------|
| `ANTHROPIC_API_KEY` | Step 4 |
| `FIRECRAWL_API_KEY` | Step 3 |
| `VERCEL_TOKEN` | Step 5 |
| `VERCEL_ORG_ID` | `landing-pages/.vercel/project.json` → orgId |
| `VERCEL_PROJECT_ID` | `landing-pages/.vercel/project.json` → projectId |
| `FB_PAGE_ID` | From Step 1d (your Page numeric ID) |
| `FB_PAGE_TOKEN` | From Step 1d (long-lived Page token) |
| `IG_ACCOUNT_ID` | From Step 1d (instagram_business_account.id) |
| `TWITTER_API_KEY` | Step 2 |
| `TWITTER_API_SECRET` | Step 2 |
| `TWITTER_ACCESS_TOKEN` | Step 2 |
| `TWITTER_ACCESS_SECRET` | Step 2 |

---

## Step 7: GA4 + Google Search Console (~15 min)

### GA4
1. analytics.google.com → Create → Account → Property: "ForkFox" → Web stream
2. URL: forkfox.ai → copy the **Measurement ID** (G-XXXXXXXXXX)
3. Add to GitHub secrets as `GA4_MEASUREMENT_ID`

### Google Search Console
1. search.google.com/search-console → Add Property → Domain → forkfox.ai
2. Verify via HTML tag → copy the `content=` value (long string)
3. Add to GitHub secrets as `GSC_VERIFICATION_TOKEN`
4. After first deploy, submit your sitemap: `https://forkfox.ai/sitemap.xml`

---

## Step 8: Install Python Dependencies

```bash
cd tastyr-iq
pip install anthropic firecrawl-py requests jinja2 tweepy
```

---

## What the pipeline does (no more setup needed after this)

- **Hourly**: GitHub Actions → picks N Carte topics from queue.json → enriches with real data → Haiku generates article + all social copy → renders HTML → deploys to Vercel → 30 min later posts to FB + IG + Twitter
- **On git push to the-dish/**: deploys immediately → Haiku generates social copy from the article → 30 min later posts to FB + IG + Twitter
- **After each deploy**: sitemap.xml auto-generated, submitted to GSC

---

## Monthly maintenance (~2 min)

- Refresh Meta token every 60 days (one curl command, see Step 1d)
- Check Twitter rate: if approaching 1,500 tweets/month, the pipeline already throttles to every 2nd article
- Check Firecrawl usage at firecrawl.dev dashboard — upgrade if near limit

---

## Cost at 100 articles/day

| Item | Monthly cost |
|------|-------------|
| Anthropic Haiku (3K tokens × 2 passes × 3,000 articles) | ~$9 |
| Firecrawl Starter (3,000 scrapes) | $16 |
| Meta Graph API | $0 |
| Twitter API v2 free | $0 |
| GitHub Actions | $0 (free tier) |
| Vercel | $0 (free tier) |
| **Total** | **~$25/month** |
