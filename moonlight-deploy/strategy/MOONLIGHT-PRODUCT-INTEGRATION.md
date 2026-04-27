# Moonlight Analytica — Product Integration & Data Flow

**Status:** Official strategy documentation
**Locked:** 2026-04-27
**Audience:** Co-founder (technical lead) + Ali (commercial lead)

## Purpose

How the four core products talk to each other technically, what data flows between them, what shared infrastructure they depend on, and where the integration leverage is. This doc complements [MOONLIGHT-ANALYTICA-PLATFORM.md](MOONLIGHT-ANALYTICA-PLATFORM.md) (which covers strategy / pricing / GTM) by defining the engineering surface.

## The shared spine

All four products in the integrated platform share three pieces of infrastructure that should be built once and reused:

### 1. Identity & Account Service
A single user/business account spans every product:
- Owner email + password (or magic link)
- Verified business profile (name, address, phone, hours, category)
- Tier subscription state
- Per-product feature flags
- Billing identity (Stripe customer)

**Build it as the first piece of the owner business portal.** Every product reads from it; no product has its own auth.

### 2. Business Identity Graph
Each business is a single canonical record across all products. Not "the Janus venue 47" and "the Caposeo project 312" — one canonical entity with stable ID, references from each product. The graph also captures relationships:
- Business → multiple physical locations (a 3-restaurant group)
- Location → multiple cameras (Janus)
- Location → multiple categories (ForkFox / Pulse)
- Location → multiple competitor entities (for cross-vendor benchmarking)

This is the database backbone. Postgres schema. Owned by the portal.

### 3. Event Bus
Every meaningful action across products emits events into a shared bus:
- ForkFox: `viewed`, `claimed`, `referred_to_venue`
- Janus: `entry`, `exit`, `zone_change`, `dwell_threshold`, `capacity_alert`
- Caposeo: `ranking_change`, `competitor_overtake`
- Pulse: `new_review`, `sentiment_shift`, `crisis_alert`

These get consumed by:
- The owner portal (for in-product activity feeds)
- Cross-product analytics (the actual data moat — see "Data fusion products" below)
- External integrations (Toast webhook on POS event, Slack/email alerts to owners)

**Implementation:** start with Postgres + simple polling, migrate to a real event bus (Redpanda, NATS, or Postgres LISTEN/NOTIFY) when volume justifies it. Don't over-engineer the bus before the platform has data flowing.

## Per-product data flows

### ForkFox → Owner Portal
- Consumer activity on ForkFox (viewed venue, clicked menu, added to favorites) → events in the bus
- Owner sees this in their portal: "your venue page got 1,847 views this week, 23 menu clicks, 8 favorited"
- This becomes the entry point for the upgrade conversation: "want to know what those 1,847 viewers actually did?" → Tier 3 Janus pitch

### Janus → Owner Portal
- Per-frame tracking (already built) → per-zone events → portal dashboard
- World-space coordinates (locked in JANUS-ZONE-MODEL.md) → cross-venue normalized events
- Daily aggregations → trend reports
- Anomaly detection → real-time alerts ("your queue is 4× longer than your Tuesday baseline")

### Caposeo → Owner Portal
- Daily keyword rank tracking → portal "search visibility" tab
- Competitor SEO comparison → portal "competitive landscape" widget
- Content gap analysis → recommendations ("you don't rank for 'philly happy hour' — add this to your menu page")

### Pulse → Owner Portal
- Hourly review scrape across Yelp, Google, OpenTable, Resy, TripAdvisor, Eater, Reddit
- Sentiment classification per review (the existing Hyatt review analytics logic, restaurant-reskinned)
- Real-time alerts on sentiment shift or crisis (a 1-star review storm)
- Competitor sentiment comparison

### ForkFox iOS app → ForkFox web → Owner Portal
- iOS app generates the consumer-side traffic that owner-side products monetize
- iOS user actions (saved venue, planned visit, checked in) feed both ForkFox-internal models and Moonlight cross-product attribution

## Data fusion products (the real moat)

The standalone products are commodity. The fusion products are not. Here's what becomes possible when the four data streams are unified:

### Fusion 1: Search-to-Visit Attribution
**Question:** "When my Caposeo ranking improved from #6 to #3 for 'fishtown cocktails' last month, did my actual foot traffic go up?"

**Computation:** Caposeo time series (rank for keyword) × Janus daily entries (foot traffic into the venue) × ForkFox referral source (did the visit come from a search-driven path?). Output: a regression on rank → foot traffic, per venue, per keyword.

**Sellable as:** Tier 3 / Tier 4 feature. **No competitor can compute this** because no competitor has all three layers.

### Fusion 2: Sentiment-to-Conversion Attribution
**Question:** "After that 2-star Yelp storm two weeks ago, did walk-in traffic actually drop?"

**Computation:** Pulse sentiment time series × Janus walk-in traffic × ForkFox impression decay. Output: dollar-cost-of-bad-reviews per venue per category.

**Sellable as:** crisis-management upsell, owner-defense argument for spending on reputation management.

### Fusion 3: Cross-Venue Operational Benchmarking
**Question:** "Am I doing better or worse than other independent cocktail bars in SF?"

**Computation:** Aggregate Janus zone metrics across all Tier 3 customers in same metro × same category × same time window. Output: percentile ranks for occupancy, dwell, abandonment, table turn.

**Sellable as:** the retention hook. Cancel Tier 3 = lose access to your industry benchmark.

### Fusion 4: Competitor New-Opening Impact
**Question:** "A new bar just opened a block from me. Did it cost me customers?"

**Computation:** Launch Sentinel (reskinned for restaurants) detects new openings within zip + Janus before/after foot traffic at affected venues + Pulse sentiment shifts. Output: predicted impact in dollars within 30 days of competitor opening.

**Sellable as:** Tier 2 / Tier 3 module. Sense competition entering your area before it shows up in your revenue.

### Fusion 5: Demand Forecasting (long-term, year 2+)
**Question:** "Should I staff up for next Friday at 8pm?"

**Computation:** Janus historical foot-traffic × Pulse review velocity (proxy for buzz) × Caposeo search trend (proxy for awareness) × ForkFox impression trend × external signals (weather, events, holidays). Output: predicted occupancy bands per hour for the next 7 days.

**Sellable as:** Tier 4 enterprise predictive ops feature. Likely the highest-priced individual feature in the platform.

## Technical dependencies (cross-product)

| Dependency | Owned by | Used by |
|---|---|---|
| Auth / Identity | Portal | All products |
| Business Identity Graph (Postgres) | Portal | All products |
| Stripe Billing integration | Portal | All products (paywalls per tier) |
| Event Bus | Portal | All products (publish + subscribe) |
| Toast / Square API integration | Portal | Janus (for revenue attribution), Caposeo (for product/menu data), ForkFox (for menu sync) |
| Yelp / Google / OpenTable / Resy scrapers | Pulse | All products (Pulse provides data, others consume) |
| Cross-venue benchmark aggregation pipeline | Portal | Janus, Pulse, Caposeo (each contributes, all read aggregates) |
| Brand component library (UI primitives) | Moonlight design system | All product front-ends |

## What "good integration" looks like

Concrete UX example: **A Tier 3 owner's morning routine.**

1. They open the Moonlight owner portal on their phone at 9am
2. Top of dashboard: "Last night's summary — 247 entries, 88 minute avg dwell, 4 zone-capacity alerts at 8:30pm"
3. Below: "Your search ranking for 'philly cocktail bar' moved up 2 spots overnight — Caposeo recommended 3 menu pages last week, this is the impact"
4. Below: "3 new reviews overnight — 2 positive, 1 negative. Click to read." (Pulse)
5. Below: "Your competitor *Bar X* opened last week. They got 89 visits per day in their first week. Your average is 211. You're holding." (Launch-Sentinel-as-restaurant-tool + Janus benchmark)
6. Below: "ForkFox: 1,847 views, 23 menu clicks, 8 favorites. 4 favorites visited within 24 hours of saving." (ForkFox + Janus attribution)

**Owner's reaction:** "I would pay $1,000/month for this dashboard." That's the integrated platform value at Tier 3. **None of the standalone products produce this experience.** Only the fusion does.

## Engineering priorities (next 90 days)

If the strategy is right, here's what gets built:

| Priority | Item | Effort | Owner |
|---|---|---|---|
| 1 | Owner business portal v0 (auth, claim listing, basic dashboard skeleton) | 4–6 weeks | Co-founder |
| 2 | Business Identity Graph (Postgres schema + APIs) | 2 weeks | Co-founder |
| 3 | Pulse restaurant-reskin (use existing Hyatt scraper, repurpose for restaurants) | 2–3 weeks | Co-founder or Ali |
| 4 | Janus → portal events integration (Janus already produces events, just needs to publish to portal) | 2 weeks | Either |
| 5 | Caposeo → portal integration (rank tracking visualizations in portal) | 2 weeks | Either |
| 6 | ForkFox iOS public TestFlight | In flight | Co-founder |
| 7 | Stripe Billing integration with tier paywalls | 1 week | Either |
| 8 | First Tier 1 paying customer | ongoing | Ali |
| 9 | Janus 3D zone demo video (in flight) | 1–2 weeks | Ali |
| 10 | Launch Sentinel restaurant-reskin (deferred to Q3) | 3–4 weeks | Either, after #1–8 |

The sequencing matters. **The portal is the spine.** Until it exists, every product sells and bills standalone, which destroys the integrated thesis.

## What this doc is NOT

- Not a finished spec — assumes co-founder will refine technical details
- Not a complete API design — that comes when portal v0 is being built
- Not a security/compliance spec — separate work, especially for Janus's no-FR / no-storage commitments and SOC 2 readiness
- Not a defense-vertical spec — defense Janus has separate technical and compliance requirements that should not be mixed with the commercial portal

## Reference

- Integrated platform strategy: [MOONLIGHT-ANALYTICA-PLATFORM.md](MOONLIGHT-ANALYTICA-PLATFORM.md)
- Portfolio audit + gaps: [MOONLIGHT-PORTFOLIO-AUDIT.md](MOONLIGHT-PORTFOLIO-AUDIT.md)
- Janus zone model: [../../janus-demo/JANUS-ZONE-MODEL.md](../../janus-demo/JANUS-ZONE-MODEL.md)
- Janus data moat: [../../janus-demo/strategy/JANUS-DATA-MOAT.md](../../janus-demo/strategy/JANUS-DATA-MOAT.md)
- Janus by-vertical playbooks: [../../janus-demo/strategy/JANUS-VERTICAL-PLAYBOOKS.md](../../janus-demo/strategy/JANUS-VERTICAL-PLAYBOOKS.md)
