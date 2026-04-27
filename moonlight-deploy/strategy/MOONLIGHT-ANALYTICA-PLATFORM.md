# Moonlight Analytica — Integrated Platform Strategy

**Status:** Official strategy documentation
**Locked:** 2026-04-27
**Audience:** Ali (CEO/CMO equivalent), co-founder (CTO/Product equivalent)

## Executive thesis

Moonlight Analytica is the **intelligence layer** for hospitality and retail businesses. The transactional layer (POS, payments, reservations, online ordering) is owned by Toast, Square, Resy, and OpenTable. We do not compete with that layer. We sit on top of it and supply the data products operators need to actually run their businesses better — discovery and brand (ForkFox), in-venue physical analytics (Janus), search/SEO intelligence (Caposeo), and review/sentiment intelligence (Pulse, repurposed from Hyatt review analytics).

**The integrated thesis:** ForkFox owns the consumer-side discovery surface and the operator's brand presence. Moonlight Analytica's products extend that relationship into operational intelligence. Customers acquired by ForkFox become Moonlight customers via the owner business portal. Moonlight customers, in aggregate, generate the cross-venue dataset that makes every individual customer's analytics smarter than they could be alone.

## Why an integrated platform beats standalone products

### Standalone problem
Each Moonlight product, sold individually, is a feature pretending to be a company:
- Janus alone = "another camera analytics company"
- Caposeo alone = "another SEO tool"
- Pulse alone = "another review monitoring tool"
- ForkFox alone = "another restaurant discovery site"

Each individually is in a contested space against funded competitors. Each individually has 9–18 month sales cycles to prove value. Each individually has high CAC and low expansion revenue.

### Integrated solution
Bundled, the same products become the **operating system for hospitality intelligence**:
- ForkFox is the front door (consumer + brand)
- The owner portal is the platform spine (account, billing, identity)
- Janus, Caposeo, Pulse are the intelligence modules an owner adds as their business matures
- Cross-product data fusion (Janus foot traffic × Caposeo search rankings × Pulse sentiment shift) is impossible to replicate without owning all four layers

This is the same playbook HubSpot ran on marketing tools, the same playbook Toast is running on restaurant POS+adjacent, and the same playbook Datadog ran on observability. **Integrate before competitors notice you have multiple products.**

## The platform tiers (canonical pricing ladder)

This becomes the GTM spine — every customer enters at one tier and is upsold across the others.

### Tier 0 — Free (Acquisition / data acquisition)
- ForkFox basic listing on consumer site
- Free unclaimed business profile (we have your data, owner doesn't have control yet)
- "Claim Your Business" CTA → entry point to Tier 1

**Goal:** maximum coverage of independent restaurants in target metros (SF, NYC). The data acquisition cost is zero — we scrape public data, we display it on ForkFox, owners see their venue on a third-party site and want to control the narrative.

### Tier 1 — Brand ($49–$99/mo per venue)
- Claim and edit business profile
- Photo/menu/event management on ForkFox
- Basic Pulse: aggregated review monitoring across Yelp, Google, OpenTable, etc.
- Basic Caposeo: monthly search visibility report ("you rank #4 for 'philly cocktail bar', here are the queries you should target")

**Goal:** capture the "I want to manage my online presence" buyer. Low cost, high LTV via expansion. **This tier alone is a defensible business** even if no one upgrades — it's what Yelp Business has, but better-priced and integrated.

### Tier 2 — Intelligence ($249–$499/mo per venue)
- Tier 1 +
- Full Pulse: real-time sentiment alerts, competitor benchmarking, category-level reputation scoring
- Full Caposeo: keyword tracking, competitor SEO, content recommendations driven by ForkFox's content engine
- Monthly intelligence report combining all three layers

**Goal:** capture the operator who treats marketing as a discipline, not an afterthought. Most independents will never reach this tier. The 20% who do are 80% of revenue.

### Tier 3 — Operations ($499–$1,500/mo per venue, 1–4 cameras included)
- Tier 2 +
- **Janus tracking layer** — physical-space analytics, real-time occupancy, dwell, queue, abandonment, cross-zone flow
- Janus + ForkFox attribution — tie consumer-side traffic to in-venue conversion
- Janus + Caposeo attribution — tie search ranking shifts to actual foot traffic shifts
- Cross-venue benchmarking against the Moonlight customer base

**Goal:** capture the operator who runs their venue like a tech company. SF/NYC concentration. This is where Janus enters as an upsell, not a cold sale.

### Tier 4 — Group / Enterprise (custom, $5k–$50k/mo)
- Multi-venue / multi-brand operators
- Cross-venue rollups, P&L attribution, predictive models
- API access, white-label dashboards
- Dedicated account team

**Goal:** restaurant groups (Stephen Starr in Philly, Major Food Group in NYC, Daniel Patterson Group in SF). Land one, expand to all their venues. **One customer at this tier = 5–20 venue contracts.**

## Why this tiering wins

### The price ladder is a tested model
HubSpot, Salesforce, Notion, Datadog, Stripe all use the same shape: free → cheap-and-broad → mid-priced-power-user → enterprise. Land at any tier, expand within the customer over time. Average customer lifetime expansion across this shape is 2–3x of starting ARR.

### Each tier solves a different "I have a $X budget for this" buyer
- $0 budget → Tier 0 (data acquisition, future upsell)
- $50–100/mo budget → Tier 1 (the "I should claim my listing" budget)
- $300–500/mo budget → Tier 2 (the "I have a marketing line item" budget)
- $500–1500/mo budget → Tier 3 (the "I run this place like a business" budget)
- $5k+/mo budget → Tier 4 (the "I have a corporate ops team" budget)

Restaurants don't have a single buyer profile. Catering five buyer profiles with one platform captures the entire mid-market.

### Tier 3 is where Janus's CAC becomes economic
Cold-pitching Janus at $500–1500/mo to a restaurant owner who's never heard of you = $5k–$15k CAC and 30%+ churn. Upsell to a Tier 2 ForkFox customer who already pays $300/mo and trusts you = $500–1500 CAC and <10% churn. **The integrated motion is what makes Janus's unit economics work.** Standalone Janus is the product we accidentally built first.

## The data flywheel (across products)

Each customer at any tier contributes data that improves every other customer's product:

| Customer activity | Data produced | Improves which product |
|---|---|---|
| Owner claims venue (Tier 1) | Verified business identity, hours, menu, photos | ForkFox content quality, category coverage |
| Reviews scraped + categorized (Pulse) | Sentiment time series per venue | Cross-venue category benchmarks for Tier 2 |
| Search rankings tracked (Caposeo) | Keyword visibility per venue per metro | "What's the avg #1 ranker doing differently" model |
| Janus tracking events (Tier 3) | World-space behavioral data per venue | Cross-venue operational benchmarks (the moat) |
| Customer feedback / NPS | Product priority signal | All four products |

After 30+ Tier 3 customers in a single metro, Moonlight has a dataset combining (digital presence) × (search performance) × (review sentiment) × (in-venue behavior) at venue-level granularity. **No competitor has any one of those layers, let alone all four.** This is the actual platform moat — it's not Janus alone, and it's not ForkFox alone. It's the cross-product fusion.

## Why the cross-ownership equity structure makes this work

- Ali = CMO of ForkFox + 30% Moonlight = leads the integrated GTM, decides which product to pitch which buyer
- Co-founder = builds ForkFox iOS + 30% Moonlight = aligned on platform integration, not just ForkFox
- Both equity stakes pay out together when the platform compounds, not when any one product wins

This structure is a feature. Most platform plays fail because the underlying products are owned by different cap tables and the cross-product integration becomes a politics problem. **Aligned ownership is what lets the integrated tier ladder actually ship.**

## The competitive landscape (honest)

| Layer | Incumbents | Moonlight position |
|---|---|---|
| Reservations | OpenTable, Resy, Tock | We don't compete. Integrate via API. |
| POS / payments | Toast, Square, Clover | We don't compete. Integrate via API. |
| Online ordering | DoorDash, Toast Online, ChowNow | We don't compete. Integrate. |
| Discovery | Yelp, Google Maps, OpenTable | **ForkFox is the modern alternative for our metros.** |
| Listing management | Yext, Birdeye | **Pulse + ForkFox bundled is cheaper and integrated.** |
| Review monitoring | Birdeye, Reputation, Podium | **Pulse, integrated, beats standalone tools.** |
| Marketing automation | Mailchimp, Klaviyo, Toast Marketing | **Not in our stack. Defer to integrators.** |
| SEO | Semrush, Ahrefs, BrightLocal | **Caposeo, restaurant-tuned, integrated with menu/content data, beats general-purpose tools.** |
| In-venue analytics | RetailNext, ShopperTrak, Density | **Janus is structurally better (world-space zones, no FR) and integrated.** |
| Loyalty / CRM | Toast Loyalty, Square Loyalty, Punchh | **Not in our stack. Defer or partner.** |

**Moonlight is positioned as the modern intelligence layer for independent operators.** We don't try to replace Toast — we plug into Toast and make Toast more valuable to its customers via insights they can't get from Toast.

## What this strategy does NOT do

- **Does not enter transactional layers.** No POS, no reservations, no online ordering, no payments, no labor management, no inventory. The unit economics on those are crushed and the incumbents are entrenched.
- **Does not chase enterprise chains as the wedge.** We chase mid-market ($1M–$15M revenue) independent and small-group operators who are tech-curious but not enterprise.
- **Does not enter every metro.** SF and NYC are the beachhead because (a) higher per-venue revenue, (b) tech-comfortable operators, (c) media + investor visibility. Philly is secondary because hometown advantage exists but ceiling is lower.
- **Does not productize defense and hospitality in the same SKU.** Defense (via Janus) is a parallel track sold to a different buyer with a different SKU and different compliance posture. Hospitality customers should not see the defense capability and vice versa.

## What success looks like

### Year 1 (12 months from 2026-04-27)
- ForkFox iOS launched in SF and NYC, 5–20k consumer users
- 100–300 Tier 1 paying customers ($50–$99/mo) → ~$10–$25k MRR / $120–$300k ARR
- 20–50 Tier 2 customers → ~$8–$25k MRR / $100–$300k ARR
- 5–15 Tier 3 customers (Janus deployed) → ~$5–$25k MRR / $60–$300k ARR
- **Total Year 1 ARR target: $300k–$900k.** Honest range, not investor-pitch.

### Year 2
- 500–1500 Tier 1 customers
- 100–300 Tier 2 customers
- 30–80 Tier 3 customers (Janus actually starts cooking)
- 1–3 Tier 4 group accounts
- **Year 2 ARR target: $1.5M–$4M**

### Year 3
- Cross-metro expansion (LA, Chicago, Boston, Miami)
- 50–100 Tier 3 customers (Janus cross-venue benchmarks become the retention moat)
- 5–15 Tier 4 group accounts
- First defense pilot (SBIR Phase II awarded, deployed at 1 base)
- **Year 3 ARR target: $5M–$15M**

These ranges are calibrated to "things go reasonably well, not perfectly." If you hit the high end of Year 2, the company is venture-fundable. If you hit the low end of Year 1, you're still building toward something real.

## What gates the next 90 days

1. **Co-founder + Ali alignment meeting** on this integrated thesis. Both must agree this is the platform play, not three side products.
2. **ForkFox iOS beta to public TestFlight** — this is the consumer wedge that makes everything else work.
3. **Owner business portal v0** — even if minimal (claim listing, edit photos, basic Pulse review pull). This is the spine that all upsells flow through.
4. **First 5 Tier 1 customers** — paying, not free. Prove $49–$99/mo can be charged.
5. **Janus 3D zone demo video** (in flight) — for Tier 3 prospects.
6. **Pulse restaurant-reskin MVP** — repurpose the Hyatt review analytics into a restaurant version. ~2–4 weeks of work.
7. **Caposeo restaurant-vertical content** — already exists, needs a packaging pass for restaurant buyers.

## Reference

- Tools inventory + business gaps: [MOONLIGHT-PORTFOLIO-AUDIT.md](MOONLIGHT-PORTFOLIO-AUDIT.md)
- Cross-product data flows: [MOONLIGHT-PRODUCT-INTEGRATION.md](MOONLIGHT-PRODUCT-INTEGRATION.md)
- Janus-specific GTM by vertical: [../../janus-demo/strategy/JANUS-VERTICAL-PLAYBOOKS.md](../../janus-demo/strategy/JANUS-VERTICAL-PLAYBOOKS.md)
- Janus data moat: [../../janus-demo/strategy/JANUS-DATA-MOAT.md](../../janus-demo/strategy/JANUS-DATA-MOAT.md)
- Janus use cases: [../../janus-demo/strategy/JANUS-USE-CASES.md](../../janus-demo/strategy/JANUS-USE-CASES.md)
- Janus defense vertical: [../../janus-demo/strategy/JANUS-DEFENSE-VERTICAL.md](../../janus-demo/strategy/JANUS-DEFENSE-VERTICAL.md)
