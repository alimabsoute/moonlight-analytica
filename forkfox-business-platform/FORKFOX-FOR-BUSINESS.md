# ForkFox for Business — Master Brief

**Status:** Draft v1 · 2026-04-19 · Owner: Ali Mabsoute
**TL;DR:** Integrated restaurant-tech B2B platform — ForkFox (discovery) + Janus (in-store analytics) + Caposeo (local SEO) — one login, one invoice, built for Philly independents.

---

## The Thesis

> **"ForkFox for Business gives independent restaurants a single login for discovery, local SEO, and in-store analytics — at a price point the big restaurant-tech stacks have never served."**

Investor framing: *"Toast for independents, with built-in local SEO and in-store foot-traffic analytics."*

---

## The Stack

| Layer | Product | What it does | Status |
|---|---|---|---|
| Consumer discovery | **ForkFox** | Dish-level AI recommendation engine. Users pick a dish → deep-link to DoorDash / direct-order. | Live at forkfox.ai |
| In-store intelligence | **Janus** | Low-cost video analytics. Custom zone tracking, dwell time, foot traffic, queue analytics. | Sprint 7 complete, 234 tests |
| Local search / SEO | **Caposeo** | AI-powered local SEO: GBP optimization, local keyword tracking, schema markup, competitive SERP monitoring. | Phase 1 complete |

Each product is independently useful. The integration is the unlock: **one account, one login, one invoice, one dashboard.**

---

## Target Customer (ICP)

**Primary:** Independent restaurants, 1–5 locations, $500K–$5M annual revenue. Owner-operator or small-ops-team.

**Beachhead:** Philly — dense independent scene (Fishtown, Northern Liberties, South Philly, Passyunk, Queen Village, Rittenhouse, University City). Ground-game sales.

**Jobs-to-be-done:**
1. "Get more people to discover my restaurant without paying DoorDash 25–30%."
2. "Rank higher when someone searches 'best ramen in Fishtown' without hiring a $3K/mo SEO agency."
3. "Know what's happening inside my restaurant — who's walking in, when, how long they stay — without a $10K RetailNext install."
4. "Stop stitching 6 tools together. Give me one login."

---

## Three-Tier Offer (draft pricing)

### Tier 1 — Presence · $49–$99/mo per location
- Featured placement in the ForkFox consumer app
- Google Business Profile optimization (Caposeo lite)
- Schema markup + basic local SEO
- Monthly analytics snapshot (Google listing traffic, ForkFox app clicks)
- Review monitoring across Google / Yelp

### Tier 2 — Intelligence · +$99–$149/mo per location ($148–$248 total)
- **Adds Janus:** single-camera in-store analytics — foot traffic, dwell time, peak-hour heatmap
- Competitive benchmarking vs. 3 neighborhood peers
- Weekly insights email
- Dish-level demand signals from ForkFox user behavior

### Tier 3 — Performance · +$149–$249/mo per location ($297–$497 total)
- **Adds multi-camera Janus:** custom zone tracking (bar, waiting area, patio, drive-thru)
- Ad placement across the ForkFox consumer app (neighborhood-targeted)
- DoorDash / UberEats affiliate revenue share
- Dedicated CSM (1 per 50 accounts)
- Quarterly business review

---

## Feature Inventory

### ForkFox
- Dish recommendation feed, restaurant profile pages
- DoorDash / UberEats deep-linking
- "Save for later" / lists, local neighborhood feeds
- Admin: menu upload, featured placement management, dish-demand signals

### Janus (in-store video analytics)
- Edge-agent install (cheap PC or Raspberry Pi + IP camera)
- Zone definition (draw boxes on floor plan)
- Counts: entries, exits, total traffic; dwell time per zone; heatmap overlay
- Queue alerts, historical trends (week/month/YoY)
- **Privacy-preserving: no facial recognition, no PII capture**

### Caposeo
- Google Business Profile audit + auto-fix suggestions
- Keyword tracking for local terms, competitor SERP monitoring
- Schema markup generator (Restaurant, Menu, FAQ schemas)
- Review response drafting (AI-assisted)
- Monthly SEO scorecard, content calendar

### Unified Dashboard
- 3 top KPI cards: Presence score · Foot traffic today · SEO rank delta
- Drill-in per product
- Single billing, alerts/notifications panel, help center

---

## Brand / Design System

| Token | Hex | Use |
|---|---|---|
| `--brand-red` | `#FA2A52` | Primary CTA, ForkFox accent |
| `--brand-orange` | `#F97316` | Secondary, metrics trending up |
| `--ink` | `#1a1f2e` | Text, sidebar nav background |
| `--ink-2` | `#2c3345` | Secondary text, dividers |
| `--surface` | `#ffffff` | Cards |
| `--surface-cool` | `#f8f9fb` | App background |
| `--surface-warm` | `#f7f5f2` | Alternate sections |
| `--border` | `#e5e7eb` | Card borders |
| `--success` | `#34d399` | Positive metrics |
| `--warning` | `#c68a1d` | Caution |
| `--danger` | `#c94a4a` | Errors, critical alerts |
| `--muted` | `#6b7280` | Labels, secondary info |

**Typography:** Inter (body) · Inter Bold / Geologica (headings) · JetBrains Mono (data tables, Janus zone IDs)

**Voice:** Owner-first, plain English, no jargon. "People stopped walking in after 3pm — here's why" beats "Traffic anomaly detected in afternoon window."

---

## Competitive Landscape

| Competitor | What they do | Price | Where ForkFox wins |
|---|---|---|---|
| Toast | POS + online order + marketing | $69–$165/mo + hardware | Requires POS replacement. We layer on existing POS. |
| Olo | Online ordering | Enterprise | Too expensive for independents. |
| ChowNow | Direct ordering | $149/mo + 1.5% | Ordering only. No discovery, analytics, or SEO. |
| Yext | Local SEO + listings | $199+/mo | SEO only. No discovery, no in-store analytics. |
| BrightLocal | Local SEO tools | $39–$79/mo | Generic, not restaurant-vertical. |
| Birdeye | Reviews + reputation | $250+/mo | Reviews only. |
| RetailNext | In-store video analytics | $150+/mo per cam + hardware | Enterprise retail. Not restaurant-built. |
| Solink | Video analytics + POS | $100+/mo per cam | Not integrated with discovery/SEO. |

**Unique position:** Only platform combining consumer-side dish discovery, local SEO, and in-store analytics at independent-restaurant price points.

---

## Go-to-Market

| Phase | Timeline | Target | Key tactic |
|---|---|---|---|
| 1 — Philly | Months 1–6 | 50 restaurants, 25 paying | Ground-game; 10 founding restaurants at locked-in rate |
| 2 — Philly expand | Months 6–12 | 200 restaurants, 100 paying | Referrals, biz associations, delivery-app affiliate pitch |
| 3 — Second metro | Months 12–18 | Bay Area | First sales hire |
| 4 — Multi-metro | Months 18+ | Austin, Portland, Brooklyn, Nashville | Seed raise, scale sales |
| 5 — Small chains | Months 24+ | Independents growing to 5+ locations | Upsell + regional chain outreach |

---

## Known Risks

- **DoorDash affiliate** not a done deal — backup: UberEats / Grubhub / Slice
- **Restaurant sales is brutal** — high churn, busy owners — counter: month-to-month + clear 30-day ROI
- **Integration complexity** — 3 products, 1 dashboard, shared auth + billing — must sequence carefully
- **Consumer traction required** — need 5–10K Philly DAU before B2B pitch lands
- **Janus privacy messaging** — cameras need clear communication: zero facial recognition, clearly stated

---

## Definition of "v1 Launched"

- `business.forkfox.ai` live with three-tier offer
- Self-serve signup → Stripe billing → Tier 1 onboarding (no Ali required)
- 10 paying Philly restaurants
- 1 published case study, 5 testimonials

---

---

# Prompt A — Dashboard Wireframe

> **How to use:** Copy the block below, open a new Claude conversation (Opus or Sonnet), attach the logos from `assets/forkfox/` and paste. Claude generates a 5-screen hi-fi HTML/Tailwind dashboard you can iterate on inside the artifact.

```
Generate a high-fidelity, multi-page HTML/CSS wireframe (single self-contained HTML
file using Tailwind via CDN) for a SaaS dashboard called "ForkFox for Business". The
user is an independent restaurant owner in Philadelphia.

Produce a polished, production-grade visual design — not skeleton boxes. Use real
copy, real data, real numbers, not "Lorem ipsum". Think Linear, Vercel, and Stripe
Dashboard quality. Do NOT use generic stock icons or blurry gradients.

=========================================================
1. THE PRODUCT
=========================================================
ForkFox for Business gives independent restaurants a single login for three
integrated tools:

  • ForkFox (consumer-side discovery): featured placement in the ForkFox app,
    menu management, dish-level demand signals from users in their neighborhood.
  • Janus (in-store analytics): live video analytics with custom zone tracking,
    foot traffic counts, dwell time, heatmaps, queue alerts.
  • Caposeo (local SEO): Google Business Profile optimization, local keyword
    tracking, competitive SERP monitoring, schema markup, review management.

One account. One invoice. One dashboard.

Pricing tiers (show in Settings/Billing page):
  - Tier 1 Presence: $49–99/mo
  - Tier 2 Intelligence: $148–248/mo total (adds Janus single-camera)
  - Tier 3 Performance: $297–497/mo total (adds multi-camera, ad placement, CSM)

=========================================================
2. TARGET USER
=========================================================
Owner of an independent Philadelphia restaurant (1–5 locations). Time-starved,
checks dashboard from phone in the morning and laptop in the afternoon.

Sample restaurant:
  Name: Suraya
  Neighborhood: Fishtown, Philadelphia
  Cuisine: Lebanese
  Tier subscribed: Tier 2 Intelligence
  2 cameras: front entrance + main dining zone

Real-feeling numbers:
  - Foot traffic yesterday: 342 entries (↑12% vs 4-wk avg)
  - SEO rank "best lebanese philadelphia": #4 (up from #7 last week)
  - ForkFox app impressions: 1,842 this week, 67 clicks, est. 9 walk-ins
  - Dwell time in dining zone: 48 min avg
  - Peak hours: 7:15pm–8:30pm

=========================================================
3. DESIGN SYSTEM
=========================================================
Palette:
  --brand-red:    #FA2A52   (primary CTA, key highlights)
  --brand-orange: #F97316   (secondary accent, metrics-up)
  --ink:          #1a1f2e   (primary text, sidebar nav bg)
  --ink-2:        #2c3345   (secondary text)
  --surface:      #ffffff   (cards)
  --surface-cool: #f8f9fb   (app background)
  --surface-warm: #f7f5f2   (alternate sections)
  --border:       #e5e7eb
  --success:      #34d399
  --warning:      #c68a1d
  --danger:       #c94a4a
  --muted:        #6b7280

Typography:
  - Headings: Inter Bold or Geologica (Google Fonts)
  - Body: Inter
  - Data / monospace: JetBrains Mono (zone IDs, timestamps)

Layout:
  - Dark sidebar (#1a1f2e) with white text + red active state
  - Main area: #f8f9fb background, white cards with soft borders
  - Cards: 12px radius, 1px border #e5e7eb, shadow-sm
  - Generous whitespace — Linear/Vercel dashboard feel
  - Mobile-first responsive (reads well at 375px)

Visual style:
  - Clean, professional, data-forward
  - Charts via Chart.js CDN or inline SVG
  - NO purple gradients, NO generic stock imagery, NO emoji headlines
  - Brand red sparingly — CTAs, active nav, critical alerts only
  - SVG icons inline (Lucide / Heroicons style, stroke weight 1.5)

=========================================================
4. PAGES
=========================================================
Use sidebar nav to switch between pages. Render all; user clicks through.

PAGE 1 — Overview (default landing)
  Header: "Good morning, Greg" + today's date + weather chip
  4 KPI cards:
    Foot Traffic Yesterday: 342  ↑12% vs 4-wk avg
    SEO Rank (tracked kw):  #4   ↑3 positions this week
    ForkFox Impressions: 1,842   67 clicks · est. 9 walk-ins
    Reviews This Week:       8   avg 4.7★ (1 flagged for response)
  Main: foot traffic chart (14 days, line chart) + "This week's insights" (3 plain-English bullets)
  Right rail: Alerts panel (queue long at 7:18pm; review needs response; competitor rank-jumped)

PAGE 2 — ForkFox Presence
  - Featured placement status (On/Off, targeted neighborhoods)
  - Weekly impressions / clicks / walk-ins + trend chart
  - Top dishes searched in Fishtown this week (from ForkFox user behavior)
  - Menu manager preview (dish cards)
  - Placement upgrade CTA

PAGE 3 — Janus In-Store Analytics
  - Floor plan (SVG) with 2 zones drawn: "Entrance", "Dining"
  - Heatmap overlay toggle
  - Live counts: 23 in dining, 2 in entrance queue
  - Today's entries by hour (bar chart)
  - Dwell time histogram
  - Zone comparison table
  - Privacy note: "No facial recognition. No PII stored."

PAGE 4 — Caposeo Local SEO
  - GBP health score gauge (89/100)
  - Tracked keywords table: keyword | rank | delta | SERP features
  - Competitor SERP comparison (3 nearby competitors)
  - Review inbox (4 recent reviews, one with AI-drafted response ready)
  - Schema markup checklist

PAGE 5 — Settings / Billing
  - Account info
  - Current tier: "Intelligence" ($198/mo · next invoice May 19)
  - Tier comparison table with upgrade CTA
  - Invoice history
  - Team / users (1 owner, 2 staff)
  - Camera management (Janus devices)

=========================================================
5. DENSITY + POLISH
=========================================================
Each page: 6–10 distinct UI elements. Not a brochure — a working tool.
Include hover-state hints in markup, loading skeleton on one card per page.

=========================================================
6. DO NOT
=========================================================
- No gradient-heavy "dashboard template" looks
- No emoji as primary icons
- No Lorem ipsum
- No React / JSX — plain HTML + Tailwind only
- Don't break the palette

=========================================================
7. OUTPUT
=========================================================
Single self-contained .html file.
Tailwind via CDN (https://cdn.tailwindcss.com).
Chart.js via CDN for charts.
Inline SVG for icons and floor plan.

Start rendering now. Produce polished, specific, real-feeling screens.
```

---

### Wireframe iteration tips

- **Too sparse?** → "Each card needs 3x the data density — think Linear or Stripe Dashboard."
- **Too templatey?** → "Tighten spacing, reduce border-radius to 8px, remove any gradients, swap stock icons for hand-drawn Lucide-style SVG."
- **Redo one page:** → "Redo Page 3 (Janus In-Store Analytics) — the floor plan should be a real SVG with clickable zones, foot-traffic flow lines, and a heatmap toggle."
- **Copy tone off?** → "Rewrite every label and insight in the voice of a blunt neighborhood restaurant owner."

### Assets to attach alongside the prompt
- `assets/forkfox/forkfox-logo.png`
- `assets/forkfox/forkfox-alt-logo.png`
- `assets/forkfox/mockup-browse.png` / `mockup-detail.png` / `mockup-score.png`
- `assets/janus/JANUS-OVERVIEW.md` (Janus technical context)

> **Note on "Suraya":** That's a real Fishtown restaurant. Works well for in-person Philly demos. If you're sharing more broadly, find-and-replace with a fictional name before distributing.

---

---

# Prompt B — Sales Deck (Restaurant Owners)

> **How to use:** Copy the block below, paste into a new Claude conversation. Claude generates a 10-slide HTML deck (arrow-key navigation). Use this when walking into Philly restaurants.

```
Generate a 10-slide sales pitch deck as a self-contained HTML file for "ForkFox for
Business", pitched to an independent restaurant owner in Philadelphia.

Audience: Time-starved owner-operator. Reads each slide in <15 seconds. Copy must be
blunt, ROI-focused, no fluff.

Design system:
  --brand-red:    #FA2A52
  --brand-orange: #F97316
  --ink:          #1a1f2e
  --surface:      #ffffff
  --surface-cool: #f8f9fb
  --success:      #34d399
  Typography: Inter (body), Geologica or Inter Bold (headlines)
  Visual feel: clean, data-forward, minimal. No gradients. Linear / Stripe-style.

SLIDE 1 — Cover
  "ForkFox for Business"
  Tagline: "Grow your restaurant without paying DoorDash another 25%."
  Ali Mabsoute · Philadelphia · 2026
  Small logo top-left, red dot top-right

SLIDE 2 — The 3 problems every independent faces
  Three columns, blunt:
    1. "People can't find you." (local search, discovery)
    2. "DoorDash takes 25–30%." (commission bleed)
    3. "You have no idea what's happening inside." (blind ops)
  Small icon above each, one sentence below.

SLIDE 3 — Why existing tools don't work for independents
  Price comparison table (5 rows):
    Toast ($69+ + hardware), Yext ($199+), Birdeye ($250+),
    RetailNext ($150+/cam + hardware), "5 tools, 5 logins, 5 invoices"
  Last row: "ForkFox for Business — $49–$497 for all three. One login."
  Highlight last row in brand-red.

SLIDE 4 — Meet ForkFox for Business
  Three product cards:
    Presence (ForkFox) — featured placement in the discovery app used by thousands of Philly diners
    Intelligence (Janus) — in-store foot-traffic analytics, one camera at a time
    SEO (Caposeo) — rank higher on "best [cuisine] in [neighborhood]"
  Below: "One dashboard. Built for independents."

SLIDE 5 — What you'll actually see
  Screenshot-style mockup of the Overview dashboard (SVG / data-viz embedded)
  Three KPI tiles: Foot Traffic ↑12% · SEO Rank #4 ↑3 · ForkFox Impressions 1,842 → 9 walk-ins
  "This is Greg's dashboard at Suraya, Fishtown."

SLIDE 6 — Three tiers, three prices
  Clear price table:
    Tier 1 Presence:      $49–$99/mo     — Discovery placement + GBP optimization
    Tier 2 Intelligence:  $148–$248/mo   — Adds Janus single-camera analytics
    Tier 3 Performance:   $297–$497/mo   — Adds multi-camera + ad placement + CSM
  Highlight Tier 2 "Intelligence" as "Most restaurants start here."
  All prices stated clearly — no "contact us."

SLIDE 7 — Real results (composite example)
  Case study tile: "Café La Maude, Fishtown"
    - SEO rank 'best french philadelphia': #11 → #3 in 60 days
    - Walk-ins from ForkFox app: 0 → 34/week
    - Peak-hour queue alerts prevented 3 customer walk-outs
    - "Our marketing agency was charging $2,100/mo. ForkFox is $248."
  Small note: "Composite example — design-partner pilots launching Q2 2026."

SLIDE 8 — How we compare to DoorDash
  Two columns: "Order through DoorDash" vs "Order through ForkFox"
  DoorDash: 25–30% commission, they own the customer, no brand control
  ForkFox: 10–15% (when affiliate deal signs), your brand, your customer,
           deep-link to DD at the user's choice
  Clear winner.

SLIDE 9 — Getting started is easy
  4-step timeline:
    Day 1  — 30-min onboarding call, connect Google Business Profile
    Day 3  — Janus camera ships, 20-min install (optional)
    Day 7  — First weekly insights email
    Day 30 — Full scorecard + optimization plan
  "Month-to-month. Cancel anytime. No setup fee."

SLIDE 10 — Let's do this
  Big CTA: "Book a 20-minute demo"
  Phone number + email + QR code (placeholder)
  Small: "Founding rate locked in for the first 10 Philly restaurants."
  Ali Mabsoute · alimabsoute@gmail.com · 610-574-1793

Output: one HTML file, arrow-key + dot navigation, Tailwind CDN, dark-on-light,
data-forward, no gradients.
```

---

### Sales deck tips

- Drop Slide 7 until you have a real customer — don't simulate a testimonial in a live pitch.
- Test each slide out loud in <15 seconds. If you can't, cut words.
- Have a printed one-pager to leave behind — owners don't bookmark URLs mid-service.

---

---

# Prompt C — Investor Deck (Seed / Pre-Seed)

> **How to use:** Copy the block below, paste into a new Claude conversation. Claude generates a 14-slide HTML investor deck. Use for VCs, angels, and accelerators.

```
Generate a 14-slide investor pitch deck as a self-contained HTML file for "ForkFox",
a Philadelphia-based restaurant-tech startup raising a $500K–$1M pre-seed round.

Audience: Seed VC partner or angel. 10 seconds per slide. Every slide must answer
"why should I fund this specifically?"

Design system:
  --brand-red:    #FA2A52
  --brand-orange: #F97316
  --ink:          #1a1f2e
  --surface:      #ffffff
  --surface-cool: #f8f9fb
  Typography: Inter (body), Geologica or Inter Bold (headlines)
  Visual feel: polished pre-seed deck. Think Lightspeed portfolio-company decks,
  not WeWork. Generous whitespace, strong typography, data-forward.

SLIDE 1 — Cover
  "ForkFox"
  "Toast for independents, with built-in local SEO and in-store analytics."
  Ali Mabsoute, Founder · 2026 · Philadelphia

SLIDE 2 — Why now
  Three stats (one per column):
    - Independents fled DoorDash in 2024–2025 as commission-rate outrage peaked
    - Local SEO market projected to hit $X.XB by 2028 (cite source)
    - SMB video analytics commoditized — Jetson Nano + open-source CV = $30 hardware
  "The stack to give independents their own growth engine is finally cheap enough."

SLIDE 3 — Problem
  Hero stat: "Independents pay 25–30% to delivery apps and still have no idea who's walking in."
  Sub-bullets:
    - Discovery is rented from DoorDash / Google
    - SEO is outsourced to $3K/mo agencies or ignored
    - Operations are blind (no foot-traffic data below enterprise price points)

SLIDE 4 — Solution
  Three-product stack diagram:
    ForkFox (consumer discovery) → Janus (in-store analytics) → Caposeo (local SEO)
  Tagline: "One login. One invoice. Three growth channels."
  Visual: restaurant owner's dashboard at center, three products feeding in.

SLIDE 5 — Product in action
  Composite screenshot of Overview dashboard with annotated metrics.
  Key metrics visible: foot traffic, SEO rank delta, ForkFox impressions → walk-ins.

SLIDE 6 — Market
  TAM / SAM / SOM:
    TAM: ~500K independent restaurants in the US
    SAM: ~150K in top-20 metros with dense indie scenes
    SOM (3-year): 5,000 paying at $2,000 ACV = $10M ARR
  Comparable: Toast IPO'd at $20B+ serving similar audience.

SLIDE 7 — Why ForkFox wins
  Competitive matrix: 8 competitors × 4 capability columns:
    Discovery · SEO · In-store Analytics · Independent Pricing
  Only ForkFox checks all four. Competitors: Toast, Olo, ChowNow, Yext,
  BrightLocal, Birdeye, RetailNext, Solink.

SLIDE 8 — Traction
  - forkfox.ai live (consumer app)
  - Janus: 234 tests passing, Sprint 7 complete, multi-tenant architecture
  - Caposeo: Phase 1 complete, 12 pages seeded
  - Philly: founder embedded, design-partner pilots launching Q2 2026
  (Honest — no paying customers yet. Lead with product velocity.)

SLIDE 9 — Business model
  Three SaaS tiers, $600–$6,000 ACV/yr per restaurant
  Plus: DoorDash / UberEats affiliate revenue (5–15% of intercepted orders)
  Plus: Ad placement revenue from Tier 3 restaurants
  Target blend: $2,000 average ACV at steady state
  80%+ gross margin at scale (software + cloud CV; no hardware COGS)

SLIDE 10 — GTM
  Phase 1: Philly ground-game (50 restaurants, 6 months)
  Phase 2: Bay Area expansion (Ali's second market)
  Phase 3: 2nd metro hire + outbound engine
  "Founder-led sales for first 100 restaurants. No SDR until $50K MRR."

SLIDE 11 — Team
  Ali Mabsoute — Founder & CEO
    Built ForkFox, Janus, and Caposeo solo from scratch.
    Ex-Citigroup AVP ($200M portfolio management).
    Ex-Hyatt ($29M paid-media P&L, architected full-stack Python MMM).
    PMP + Six Sigma Black Belt. M.S. Finance (Temple), Penn (Economics + PPE).
  Hiring post-raise: full-stack engineer + restaurant sales lead.
  Advisors: (add as lined up)

SLIDE 12 — Financials
  5-quarter projected ARR + burn
  Unit economics: $2,000 ACV, 80% gross margin, LTV/CAC > 3 at scale
  Use of $750K:
    50% engineering (2 hires)
    30% sales + marketing (1 sales lead, CAC tests)
    20% ops / legal / runway buffer
  12-month milestones: $30K MRR · 150 paying restaurants · delivery affiliate signed

SLIDE 13 — The Ask
  $750K pre-seed
  18-month runway to $30–50K MRR
  Looking for: restaurant / SMB / marketplace-experienced leads
  Targeting: Bloomberg Beta, Homebrew, Susa, Afore, Philly angels
  Target close: May–June 2026

SLIDE 14 — Close
  "ForkFox is the growth stack independents should have had ten years ago.
   We'll give it to them at a price point the enterprise players never will."
  Contact: alimabsoute@gmail.com · 610-574-1793 · forkfox.ai

Output: one self-contained HTML file, Tailwind CDN, arrow-key navigation,
clean typography, no gradients, no stock icons. Pre-seed deck polish.
```

---

### Investor deck tips

- **Do NOT fabricate traction.** No revenue yet = lead with product velocity + design-partner pipeline. Slide 8 is written honestly.
- Verify the market-size stat on Slide 2 with IBISWorld / Statista before pitching.
- Slide 7 (competitive matrix) is the highest-leverage slide — make it cleaner than you think.
- Keep any advisors / committed angels on a backup slide ready to add.
- Do NOT mention Prism, Ink & Ivory, or any side projects — they dilute the restaurant-tech thesis.
- Logos from prior employers should stay off the deck — you're pitching ForkFox, not your résumé.

---

---

## Assets Reference

```
forkfox-business-platform/
├── assets/
│   ├── forkfox/
│   │   ├── forkfox-logo.png
│   │   ├── forkfox-alt-logo.png
│   │   ├── mockup-browse.png
│   │   ├── mockup-detail.png
│   │   └── mockup-score.png
│   ├── janus/
│   │   ├── JANUS-OVERVIEW.md
│   │   └── Janus-Presentation-Draft.md
│   └── caposeo/
│       └── Caposeo-Competitive-Analysis.pdf
├── specs/
│   └── PRODUCT_SPEC.md   ← detailed version of the brief above
└── prompts/
    ├── WIREFRAME_PROMPT.md
    └── PITCH_DECK_PROMPT.md
```
