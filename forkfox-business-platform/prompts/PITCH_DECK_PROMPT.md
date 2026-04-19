# PITCH DECK PROMPT — ForkFox for Business

**How to use this file:** Two deck variants are below. Variant A is a short restaurant-owner sales deck (10 slides, 4-minute pitch). Variant B is an investor / seed-pitch deck (14 slides). Pick one, paste into Claude, iterate.

Both prompts produce a self-contained HTML presentation (single file, CSS slide nav) that you can view in a browser, export to PDF, or port to Keynote/Google Slides later.

---

## VARIANT A — Restaurant-Owner Sales Deck

Use this for walking into restaurants in Philly. Short, direct, ROI-focused.

### PROMPT (Variant A)

```
Generate a 10-slide sales pitch deck as a self-contained HTML file for "ForkFox for
Business", pitched to an independent restaurant owner in Philadelphia.

Audience: Time-starved owner-operator. Reads the slide in <15 seconds before deciding
whether to keep listening. Copy must be blunt, ROI-focused, no fluff.

Design system:
  --brand-red:    #FA2A52
  --brand-orange: #F97316
  --ink:          #1a1f2e
  --surface:      #ffffff
  --surface-cool: #f8f9fb
  --success:      #34d399
  Typography: Inter (body), Geologica or Inter Bold (headlines)
  Visual feel: clean, data-forward, minimal. No gradients. Linear / Stripe-style.

Slide structure (render each as a full-screen section with slide nav):

SLIDE 1 — Cover
  "ForkFox for Business"
  Tagline: "Grow your restaurant without paying DoorDash another 25%."
  Ali Mabsoute · Philadelphia · 2026
  Small logo top-left, red dot top-right

SLIDE 2 — The 3 problems every independent faces
  Three columns, each with a blunt problem statement:
    1. "People can't find you." (local search, discovery)
    2. "DoorDash takes 25–30%." (commission bleed)
    3. "You have no idea what's happening inside." (blind ops)
  Small icon above each, one sentence below.

SLIDE 3 — Why existing tools don't work for independents
  Price-comparison table. Five rows:
    Toast ($69+ + hardware), Yext ($199+), Birdeye ($250+), RetailNext ($150+/cam + hardware), "5 tools, 5 logins, 5 invoices"
  Last row: "ForkFox for Business — $49–$497 for all three. One login."
  Highlight the last row in brand-red.

SLIDE 4 — Meet ForkFox for Business
  Three product cards in a row:
    Presence (ForkFox) — featured placement in the discovery app used by thousands of Philly diners
    Intelligence (Janus) — in-store foot-traffic analytics, one camera at a time
    SEO (Caposeo) — rank higher on "best [cuisine] in [neighborhood]"
  Below: "One dashboard. Built for independents."

SLIDE 5 — What you'll actually see
  Screenshot-style mockup of the Overview dashboard (embedded SVG or data-viz)
  Three KPI tiles: Foot Traffic ↑12%, SEO Rank #4 ↑3, ForkFox Impressions 1,842 → 9 walk-ins
  "This is Greg's dashboard at Suraya, Fishtown."

SLIDE 6 — Three tiers, three prices
  Clear price table. Use the draft tiers from PRODUCT_SPEC.md.
  Highlight "Intelligence" as "Most restaurants start here."
  All prices clearly stated. No "contact us" nonsense.

SLIDE 7 — Real results (simulated for now, use realistic numbers)
  Case-study-style tile: "Café La Maude, Fishtown"
    - SEO rank for 'best french philadelphia': #11 → #3 in 60 days
    - Walk-ins from ForkFox app: 0 → 34/week
    - Peak-hour queue alerts prevented 3 customer walk-outs
    - "Our marketing agency was charging us $2,100/mo. ForkFox is $248."
  (Note on deck: this is a composite example until we have real signed customers.)

SLIDE 8 — How we compare to DoorDash
  Two-column: "Order through DoorDash" vs "Order through ForkFox"
  DoorDash: 25–30% commission, they own the customer, no brand control
  ForkFox: 10–15% (when affiliate deal signs), your brand, your customer, deep-link to DD at user's choice
  Clear winner.

SLIDE 9 — Getting started is easy
  Four-step timeline:
    Day 1 — 30-min onboarding call, connect Google Business Profile
    Day 3 — Janus camera ships, 20-min install (optional)
    Day 7 — First weekly insights email
    Day 30 — Full scorecard + optimization plan
  "Month-to-month. Cancel anytime. No setup fee."

SLIDE 10 — Let's do this
  Big CTA: "Book a 20-minute demo"
  Calendly-style phone number + email + QR code
  Small: "Founding rate locked in for the first 10 Philly restaurants."
  Ali's name, email, phone.

Output: one HTML file with slide navigation (arrow keys + side nav dots). Use
Tailwind via CDN. Dark-on-light. Data-forward. No gradients.
```

---

## VARIANT B — Investor / Seed Pitch Deck

Use this when pitching VCs / angels / accelerators. Market-size-first, traction-grounded.

### PROMPT (Variant B)

```
Generate a 14-slide investor pitch deck as a self-contained HTML file for "ForkFox",
a Philadelphia-based restaurant-tech startup raising a $500K–$1M pre-seed round.

Audience: Seed VC partner or angel. Reads the deck at 10 seconds per slide.
Every slide must answer "why should I fund this specifically?"

Design system:
  --brand-red:    #FA2A52
  --brand-orange: #F97316
  --ink:          #1a1f2e
  --surface:      #ffffff
  --surface-cool: #f8f9fb
  Typography: Inter (body), Geologica or Inter Bold (headlines)
  Visual feel: polished pre-seed deck. Think Lightspeed's portfolio-company decks,
  not WeWork's. Generous whitespace, strong typography, data-forward.

Slide structure:

SLIDE 1 — Cover
  "ForkFox" · "Toast for independents, with built-in local SEO and in-store analytics."
  Ali Mabsoute, Founder · 2026 · Philadelphia

SLIDE 2 — Why now
  Three stats, one per column:
    - Independents fled DoorDash in 2024–2025 as commission-rate outrage peaked
    - Local SEO market will hit $X.XB by 2028 (need to verify, cite source)
    - SMB video analytics commoditized — Jetson Nano + open-source CV = $30 of hardware
  "The stack to give independents their own growth engine is finally cheap enough."

SLIDE 3 — Problem
  Single stat as the hero:
    "Independents pay 25–30% to delivery apps and still have no idea who's walking in."
  Three sub-bullets:
    - Discovery is rented from DoorDash / Google
    - SEO is outsourced to $3K/mo agencies or ignored
    - Operations are blind (no foot-traffic data below enterprise price points)

SLIDE 4 — Solution
  Three-product stack diagram:
    ForkFox (consumer discovery) → Janus (in-store analytics) → Caposeo (local SEO)
  Tagline: "One login. One invoice. Three growth channels."
  Visual: restaurant owner's dashboard at the center, three products feeding in.

SLIDE 5 — Product in action
  Screenshot (composite) of the Overview dashboard with real numbers for a pilot
  restaurant. Annotate the key metrics visible.

SLIDE 6 — Market
  TAM / SAM / SOM breakdown (use realistic US independent-restaurant numbers):
    - TAM: ~500K independent restaurants in the US
    - SAM: ~150K in top-20 metros with dense indie scenes
    - SOM (3-year): 5,000 paying at $2,000 ACV = $10M ARR
  Comparable: Toast IPO'd at $20B+ serving similar audience.

SLIDE 7 — Why ForkFox wins
  Competitive matrix: 8 competitors across 4 capability columns
  (Discovery · SEO · In-store Analytics · Independent Pricing)
  Only ForkFox hits all four.

SLIDE 8 — Traction / proof points (be honest — use what exists)
  - forkfox.ai live
  - Janus platform: 234 tests passing, Sprint 7 complete, architected for multi-tenant
  - Caposeo: Phase 1 complete, 12 pages seeded
  - Philly beachhead: founder embedded, [X] pilot conversations booked
  If no paying customers yet, say so — "Design-partner pilots launching Q2 2026"

SLIDE 9 — Business model
  Three SaaS tiers (from PRODUCT_SPEC.md), ACVs of $600–$6,000/yr
  Plus: DoorDash / UberEats affiliate revenue (5–15% of intercepted orders)
  Plus: Ad placement revenue from Tier 3 restaurants
  Blend target: $2,000 average ACV at steady state.

SLIDE 10 — GTM
  Phase 1: Philly ground-game (50 restaurants in 6 months)
  Phase 2: Bay Area (Ali's second market)
  Phase 3: 2nd metro hire + outbound engine
  "Founder-led sales for first 100 restaurants. No SDR until $50K MRR."

SLIDE 11 — Team
  Ali Mabsoute — Founder
    Built ForkFox, Janus, Caposeo solo hands-on.
    Ex-Citigroup AVP ($200M portfolio), Hyatt ($29M paid-media P&L, architected full-stack Python MMM).
    PMP + Six Sigma Black Belt. M.S. Finance (Temple), Penn (Economics + PPE).
  Hiring: one full-stack engineer + one restaurant sales lead post-raise.
  Advisors: (add as you line them up)

SLIDE 12 — Financials (if including)
  5-quarter projected ARR + burn
  Unit economics: $2,000 ACV, 80% gross margin, LTV/CAC > 3 at scale
  Use of funds from this raise:
    50% engineering (2 hires)
    30% sales + marketing (1 sales lead, CAC tests)
    20% ops / legal / runway buffer
  12-month milestones to seed: $30K MRR, 150 paying restaurants, DoorDash or UE affiliate signed

SLIDE 13 — Ask
  $750K pre-seed
  18-month runway to $30–50K MRR
  Looking for: restaurant / SMB / marketplace-experienced leads
  Targeting: Bloomberg Beta, Homebrew, Susa, Afore, specific Philly angels
  Close: May–June 2026

SLIDE 14 — Close
  "ForkFox is the growth stack independents should have had ten years ago.
   We'll give it to them at a price point the enterprise players never will."
  Contact: alimabsoute@gmail.com · 610-574-1793 · forkfox.ai

Output: one self-contained HTML file, Tailwind CDN, arrow-key navigation, clean
typography, no gradients, no stock icons. Pre-seed deck polish.
```

---

## Iteration tips

### For the sales deck (A)
- Drop slide 7 if you have no customers yet — don't simulate a testimonial.
- Have a version with the Janus camera hardware shown as a tangible object — owners love touching hardware.
- Test it by reading each slide out loud in <15 seconds. If you can't, cut words.

### For the investor deck (B)
- Do NOT fabricate traction. If there's no revenue, lead with product velocity + design-partner pipeline.
- Verify the market-size stat on slide 2 with a real source (IBISWorld / Statista) before pitching.
- Competitive matrix (slide 7) is the highest-leverage slide — make it cleaner than you think it needs to be.
- Have a Team slide backup ready with any advisors / angels already committed.

### What NOT to include in either deck
- Generic "AI-powered" language without specifics
- Any mention of side projects outside the restaurant-tech thesis (Prism, Ink & Ivory, etc.) — they dilute focus
- Logos of companies you've worked at — you're not pitching "ex-Citi AVP", you're pitching ForkFox
- Screenshots of any non-polished product UI
