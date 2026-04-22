# Caposeo Setup Guide

## Prerequisites

- Node.js 20+ and npm 10+
- A Supabase account (free tier is sufficient)
- API keys from external providers (Brave, DataForSEO, Anthropic, Stripe for payments)

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/alimabsoute/caposeo.git
cd caposeo
npm install
```

### 2. Copy Environment Template

```bash
cp .env.example .env
```

Open `.env` and fill in the placeholders (instructions below).

### 3. Set Up Supabase

1. Create a new project at https://supabase.com/dashboard
2. Go to **Project Settings** → **API** tab
3. Copy **Project URL** and paste into `VITE_SUPABASE_URL`
4. Copy **anon public key** and paste into `VITE_SUPABASE_ANON_KEY`
5. Copy **service_role key** and set aside (backend scripts may need it later)
6. Run migrations:

```bash
npx supabase start
npx supabase migration up
```

(Note: Migration 004 creates the `rankings` table used by the rank tracker.)

### 4. Get API Credentials

#### Supabase
- Already done above (URL + anon key)

#### DataForSEO
1. Visit https://dataforseo.com/
2. **Pricing** → Choose a plan
3. **Sign up** (email + password)
4. Go to **Dashboard** → **Account Settings** → **API Access**
5. Copy your **Login** (email) and **Password**
6. Paste into `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`

#### Brave Search API
1. Visit https://brave.com/search/api/
2. Click **Get Started** (or sign in)
3. Create a new API key
4. Copy and paste into `BRAVE_SEARCH_API_KEY`

#### Anthropic (Claude)
1. Visit https://console.anthropic.com/
2. **API Keys** → **Create Key**
3. Copy and paste into `CLAUDE_API_KEY`

#### Stripe (for payments, optional for demo)
1. Visit https://dashboard.stripe.com/apikeys
2. Under **Standard keys**, copy the **Publishable key** (pk_test_...)
3. Paste into `VITE_STRIPE_PUBLISHABLE_KEY`
4. Copy the **Secret key** (sk_test_...)
5. Paste into `STRIPE_SECRET_KEY` (backend only)

### 5. Seed Data (Optional)

The app ships with demo seed data. To load real ranking history:

```bash
npx tsx scripts/seed-rankings.ts --project-id <your-project-uuid>
```

(This script populates sample keyword rankings for testing.)

### 6. Run Dev Server

```bash
npm run dev
```

Visit http://localhost:5173

## Troubleshooting

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
- Double-check `.env` has both variables filled
- Ensure you copied the **anon key**, not the service role key
- Restart the dev server

### Supabase auth fails / "Invalid API key"
- Verify the project URL matches your Supabase project
- Check your internet connection
- Try creating a new Supabase project and swapping credentials

### Rate limit exceeded (DataForSEO or Brave)
- These APIs have usage tiers; upgrade your plan or wait for the quota reset
- Check your provider dashboard for rate-limit status

### Stripe payments not working
- Ensure you're using **test keys** (pk_test_*, sk_test_*)
- Never commit real live keys
- For production, swap to live keys (pk_live_*, sk_live_*)

## Next Steps

- **Dashboard**: Create a project and add keywords to track
- **Competitors**: Use the Competitors tab to analyze competitor rankings
- **Content Editor**: Generate SEO-optimized content with Claude insights
- **Reports**: Schedule automated weekly/monthly reports
