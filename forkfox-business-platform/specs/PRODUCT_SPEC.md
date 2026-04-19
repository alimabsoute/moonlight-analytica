# ForkFox for Business — Product Spec

**Status:** Draft v1 · 2026-04-19
**Owner:** Ali Mabsoute
**Purpose:** Single source of truth for the integrated restaurant-tech B2B platform. Feeds the wireframe prompt, pitch deck, sales collateral, and roadmap.

---

## 1. Thesis in one sentence

> **"ForkFox for Business gives independent restaurants a single login for discovery, local SEO, and in-store analytics — at a price point the big restaurant-tech stacks have never served."**

Reframed investor pitch: *"Toast for independents, with built-in local SEO and in-store foot-traffic analytics."*

---

## 2. The integrated stack

| Layer | Product | What it does | Status |
|---|---|---|---|
| **Consumer discovery** | **ForkFox** (`tastyr-iq/`, live at forkfox.ai) | Dish-level AI recommendation engine. Users pick a dish → deep-link to DoorDash / direct-order. | Live (consumer) |
| **In-store intelligence** | **Janus** (`janus-demo/`) | Low-cost video analytics. Custom zone tracking, dwell time, foot traffic, queue analytics. | Sprint 7 complete |
| **Local search / SEO** | **Caposeo** (`seo-pulse/`) | AI-powered local SEO for restaurants: keyword research, Google Business Profile optimization, schema markup, competitive analysis. | Phase 1 complete (12 pages seeded) |

Each product is independently useful. The integration is the unlock: **one restaurant account, one login, one invoice, one dashboard surfacing insights from all three.**

---

## 3. Target customer (ICP)

**Primary:** Independent restaurants, 1–5 locations, $500K–$5M annual revenue. Owner-operator or small-ops-team driven.

**Beachhead:** Philly — dense independent scene across Fishtown, Northern Liberties, South Philly, Passyunk, Queen Village, Rittenhouse, University City. Ali is local → ground-game sales is cheaper.

**Decision maker:** Owner (small independents) or GM / Marketing Manager (1–5 location groups).

**Jobs-to-be-done:**
1. "Get more people to discover my restaurant without paying DoorDash / UberEats 25–30%."
2. "Rank higher when someone searches 'best ramen in Fishtown' without hiring a $3K/mo SEO agency."
3. "Actually know what's happening inside my restaurant — who's walking in, when, how long they stay — without a $10K RetailNext install."
4. "Stop stitching 6 tools together. Give me one login."

---

## 4. Three-tier offer (draft pricing)

Pricing is DRAFT. Validate in first 10 Philly restaurant conversations.

### Tier 1 — **Presence** · $49–$99/mo per location
- Featured placement in the ForkFox consumer app
- Google Business Profile optimization (Caposeo lite)
- Schema markup + basic local SEO
- Monthly analytics snapshot (traffic to Google listing, ForkFox app clicks)
- Review monitoring across Google / Yelp

### Tier 2 — **Intelligence** · +$99–$149/mo per location ($148–$248 total)
- **Adds Janus:** single-camera in-store analytics. Foot traffic, dwell time, peak-hour heatmap.
- Competitive benchmarking — how your SEO + foot traffic compares to three neighborhood peers
- Weekly insights email
- Dish-level demand signals from ForkFox user behavior (which dishes people in your neighborhood search for)

### Tier 3 — **Performance** · +$149–$249/mo per location ($297–$497 total)
- **Adds multi-camera Janus:** custom zone tracking (bar, waiting area, patio, drive-thru)
- Ad placement across the ForkFox consumer app (neighborhood-targeted)
- DoorDash-referral revenue share (when DoorDash affiliate deal signs — or UberEats / Grubhub first)
- Dedicated CSM (1 per 50 accounts max)
- Quarterly business review with Ali / sales lead

### Add-ons (future)
- Online ordering flow (ChowNow-style direct ordering bypassing delivery-app commissions)
- Loyalty / rewards program
- SMS / email marketing module

---

## 5. Feature inventory (per product, for the dashboard)

### ForkFox side (consumer-facing, drives B2B signals)
- Dish recommendation feed
- Restaurant profile pages
- DoorDash / UberEats deep-linking
- User preference capture (cuisines, dietary tags, price tier)
- "Save for later" / lists
- Local neighborhood feeds (Fishtown feed, Passyunk feed, etc.)
- Admin: restaurant-owner onboarding, menu upload, featured placement management

### Janus (in-store video analytics)
- Edge-agent install (runs on cheap PC or Raspberry Pi + IP camera)
- Cloud dashboard
- Zone definition (draw boxes on floor plan)
- Counts: entries, exits, total traffic
- Dwell time per zone
- Heatmap overlay on floor plan
- Alerts (e.g., "queue longer than 8 people")
- Historical trends (week/month/year over year)
- Privacy-preserving (no facial recognition, no PII capture)

### Caposeo (local SEO)
- Google Business Profile audit + auto-fix suggestions
- Keyword tracking for local terms ("best [cuisine] in [neighborhood]")
- Schema markup generator (Restaurant schema, Menu schema, FAQ schema)
- Competitor SERP monitoring (top 3 competitors in the neighborhood)
- Review response drafting (AI-assisted)
- Monthly SEO scorecard
- Content calendar (suggested blog posts / menu updates for SEO)

### Unified dashboard (the new surface we'll wireframe)
- Login → see one card per product at top (Presence score, Foot traffic today, SEO rank delta)
- Drill into each product's own detail view
- Single billing, single account
- Alerts / notifications panel
- Help center + CSM contact

---

## 6. Brand + design system

### Design tension to resolve
- **Consumer ForkFox** is dark cinematic (black background, neon red accents). Built for hungry users at night.
- **Janus** is terminal-aesthetic (green-on-black, monospace). Built for showing off technical chops in demos.
- **Caposeo** is light SaaS (steel-blue primary on off-white background). Built for agencies.

These cannot all live in the same B2B dashboard. The restaurant-owner user needs a **professional, data-dense, daylight-workable** interface.

### Unified "ForkFox for Business" palette

| Token | Hex | Use |
|---|---|---|
| `--brand-red` | `#FA2A52` | Primary CTA, alerts, ForkFox heritage accent |
| `--brand-orange` | `#F97316` | Secondary accent, highlights, metrics trending up |
| `--ink` | `#1a1f2e` | Text, sidebar nav background |
| `--ink-2` | `#2c3345` | Secondary text, dividers |
| `--surface` | `#ffffff` | Cards, dashboard panels |
| `--surface-cool` | `#f8f9fb` | App background |
| `--surface-warm` | `#f7f5f2` | Alternate section background (for warmth cues) |
| `--border` | `#e5e7eb` | Card borders, dividers |
| `--success` | `#34d399` | Positive metrics, status indicators |
| `--warning` | `#c68a1d` | Caution states |
| `--danger` | `#c94a4a` | Errors, critical alerts |
| `--muted` | `#6b7280` | Labels, secondary info |

### Typography
- **Headings:** Geologica (ForkFox heritage) or Inter Bold
- **Body:** Inter
- **Data/code:** JetBrains Mono or SF Mono (for analytics tables, Janus zone IDs)

### Voice
- Owner-first. Skip jargon. Talk like a neighborhood regular who also happens to know analytics.
- Plain English over marketing-speak: "People stopped walking in after 3pm — here's why" beats "Traffic anomaly detected in afternoon window."
- Metrics with context: never a bare number without a comparison.

---

## 7. Critical flows for the restaurant-owner persona

1. **First login / onboarding**
   - Connect Google Business Profile
   - Upload menu (or scrape from existing URL)
   - Draw store floor plan + camera zones (Janus, if subscribed)
   - See first "Presence score" within 60 seconds

2. **Daily morning check**
   - Notification email → mobile dashboard
   - Yesterday's foot traffic vs. 4-week avg
   - Today's forecast (based on weather + historical)
   - Any new reviews? (from Google / Yelp via Caposeo)
   - Any neighborhood competitor SERP changes?

3. **Weekly insights review**
   - "Your SEO rank for 'best ramen Fishtown' moved from #8 → #5 this week"
   - "Foot traffic was 22% higher on Tue-Wed vs last week — here are the 2 reviews that went up during that window"
   - "Your featured ForkFox placement got 1,340 impressions and 48 clicks → estimated 6 walk-ins"

4. **Quarterly business review** (Tier 3)
   - Zoom / in-person with CSM
   - Full scorecard, competitor comps, recommended actions
   - Upsell conversation (add a camera, upgrade tier, etc.)

5. **Alerts / exception handling**
   - Queue exceeds X people → push notification to GM's phone
   - Negative review posted → auto-drafted response waiting for approval
   - SEO rank drop > 3 positions on a tracked keyword → investigation flagged

---

## 8. Data / integration model

### External integrations (in order of build priority)
1. Google Business Profile API (read + write)
2. Google Places API
3. Yelp Fusion API
4. DoorDash / UberEats (deep-link today, affiliate API when signed)
5. OpenTable / Resy reservation data (future)
6. Square / Toast POS (future, for revenue validation against foot traffic)

### Internal data produced
- Dish-demand signals (from ForkFox user behavior, aggregated)
- Foot-traffic streams (from Janus edge agents)
- Keyword rank tracking (from Caposeo)
- Review velocity + sentiment

### Data model sketch
```
restaurants
  - id, name, address, neighborhood, cuisine_tags[], tier_subscribed
  - gbp_id, yelp_id, doordash_url, ubereats_url
  - forkfox_featured_until, forkfox_placement_budget

cameras (one-to-many per restaurant)
  - id, restaurant_id, location, zones_json, stream_url, status

foot_traffic_events
  - timestamp, camera_id, zone_id, event_type (entry|exit|dwell)

seo_rank_snapshots
  - restaurant_id, keyword, rank, date, serp_features[]

dish_signals
  - dish_name, neighborhood, search_count, period
```

---

## 9. Competitive landscape

| Competitor | What they do | Price | Where ForkFox wins |
|---|---|---|---|
| **Toast** | POS + online order + marketing | $69–$165/mo per location + hardware | Toast requires POS replacement. We layer on existing POS. |
| **Olo** | Online ordering | Enterprise pricing | Too big / expensive for independents. |
| **ChowNow** | Direct ordering platform | $149/mo per location + 1.5% | Only ordering. Nothing on discovery, analytics, or SEO. |
| **Yext** | Local SEO + listings | $199+/mo per location | SEO only. No consumer discovery. No in-store analytics. |
| **BrightLocal** | Local SEO tools | $39–$79/mo | SEO only. Generic, not restaurant-vertical. |
| **Birdeye** | Reviews + reputation | $250+/mo | Reviews only. |
| **RetailNext** | In-store video analytics | $150+/mo per camera + hardware | Enterprise retail. Too expensive, not restaurant-built. |
| **Solink** | Video analytics + POS | $100+/mo per camera | Similar price, but not integrated with discovery/SEO. |

**Our unique position:** The only platform combining consumer-side dish-discovery, local SEO, and in-store analytics in one stack at independent-restaurant price points.

---

## 10. Go-to-market

### Phase 1 — Philly (months 1–6)
- Target: 50 restaurants, 25 paying
- Tactics: ground-game (Ali walks in, 60-sec pitch, leaves one-pager)
- Iconic beachhead spots in Fishtown, Passyunk, Queen Village
- Pricing: heavily discounted first 10 ("founding restaurants", lifetime lock-in rate)
- Goal: get testimonials + case-study metrics

### Phase 2 — Philly expansion (months 6–12)
- Target: 200 restaurants, 100 paying
- Channels: local referrals, neighborhood business associations, Philly restaurant industry press
- Launch DoorDash / UberEats / Grubhub affiliate pitch (send them volume, ask for rev share)

### Phase 3 — Second metro (months 12–18)
- Bay Area (Ali's second market)
- Hire first sales lead

### Phase 4 — Multi-metro SaaS (months 18+)
- Austin, Portland, Brooklyn, Nashville
- Raise seed, scale sales

### Phase 5 — Franchise / small chains (months 24+)
- Upsell existing independents who grow to 5+ locations
- Pitch regional small chains directly

---

## 11. Known risks / open questions

- **DoorDash affiliate** is not a done deal. No formal public program. Backup: UberEats / Grubhub / Slice.
- **Restaurant sales is brutal.** High churn, low margins, owners busy. Counter: lifetime founding rate + month-to-month + clear ROI in first 30 days.
- **Integration complexity** — three products, one dashboard, shared auth, unified billing. This is meaningful engineering work. Must sequence carefully.
- **ForkFox consumer traction required.** B2B story falls apart if consumer app has no users. Need at least 5–10K Philly DAU before pitching restaurants on "get on our app."
- **Janus privacy messaging** — cameras in restaurants require careful privacy communication. Staff and customers must know. Zero facial recognition, clearly stated.

---

## 12. What's NOT in scope (intentionally)

- POS replacement (let Toast / Square / Clover do that)
- Delivery / courier ops (deep-link to DoorDash; don't build our own drivers)
- Reservations (OpenTable / Resy own that; integrate later)
- Full-scale CRM (keep contacts lightweight; integrate HubSpot/Salesforce later)
- Consumer mobile apps for staff (web dashboard first)

---

## 13. Definition of "v1 launched"

- Three-tier offer live on a marketing site (`business.forkfox.ai`)
- Self-serve signup → Stripe billing → Tier 1 onboarding (can run without Ali in the loop)
- Tiers 2 and 3 require sales conversation (that's fine for first 100)
- 10 paying Philly restaurants
- 1 published case study
- 5 testimonials

If we hit that, restaurant-tech is real.
