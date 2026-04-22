# Vercel Deploy Checklist — Caposeo

## 1. Vercel Environment Variables
Set all of the following in Project Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLAUDE_API_KEY`
- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`
- `BRAVE_SEARCH_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` → `https://your-domain.com/api/google/callback`

## 2. Supabase
- Run migrations in order: `001_init.sql`, `002_...`, `003_...`
- Enable Google OAuth provider in Authentication → Providers → Google

## 3. Stripe
- Create webhook endpoint at `https://your-domain.com/api/stripe/webhook`
- Subscribe to events: `checkout.session.completed`, `customer.subscription.deleted`
- Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## 4. Google Cloud (OAuth2)
- Create OAuth2 credentials at console.cloud.google.com
- Add authorized redirect URI: `https://your-domain.com/api/google/callback`
- Enable APIs: Google Search Console API, Google Analytics Data API

## 5. Third-party signups
- DataForSEO: free trial at dataforseo.com
- Brave Search: free tier at api.search.brave.com
