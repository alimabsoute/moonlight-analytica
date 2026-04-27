# Moonlight Analytica — Portfolio Audit & Business Gap Analysis

**Status:** Official strategy documentation
**Locked:** 2026-04-27
**Purpose:** Inventory every tool Ali has built or partially built, classify each by strategic role, identify what's missing.

## The honest inventory

### IN-PLATFORM PRODUCTS (Moonlight Analytica core)

| Product | Repo | State | Role in platform |
|---|---|---|---|
| **Janus** | `janus-demo/` | 234 tests, e2e validated, 3D zone model locked. No paying customers. | Tier 3 — in-venue analytics module |
| **Caposeo** | `seo-pulse/` | Phase 1 done, 12 pages seeded, Supabase backend live. No paying customers. | Tier 1/2 — search & SEO intelligence module |
| **Pulse (sentiment scraper)** | `hyatt-review-analytics/` | Built for Hyatt (existing job context). Will be reskinned for restaurants. Already has scraping + sentiment + comparison logic. | Tier 1/2 — review & sentiment intelligence module |
| **Moonlight Analytica brand site** | `moonlight-deploy/` | Live at moonlightanalytica.com | The holding company brand surface |

### COMPANION PRODUCT (separate cap table, integrated GTM)

| Product | Repo | State | Role |
|---|---|---|---|
| **ForkFox** | `forkfox/` | Live at forkfox.ai. The Dish blog: 5 articles. Carte pipeline built (awaiting credentials). iOS beta in build with co-founder. | The consumer wedge + owner brand portal |
| **ForkFox for Business** | `forkfox-business-platform/` | Specs only. Pre-build planning. | The B2B portal that ties the platform together |

### POSSIBLE PORTFOLIO PRODUCTS (currently dormant or off-thesis)

| Product | Repo | State | Strategic verdict |
|---|---|---|---|
| **Launch Sentinel** | `v0-product-sentinel/` | Live, 23k products tracked, 22 pages live | **Could be reskinned** as a competitive-intelligence module for restaurants ("see what new venues launched in your zip code last month, what they're charging, what reviews say"). Worth evaluating as a Tier 2 module. |
| **BoardLord** | `canvas-workbook/` | Phases 0–1 complete, paused | Off-thesis for hospitality. Different vertical. **Park or sell separately.** |
| **PhynxTimer** | `phynxtimer/` | Phase 3 in progress | Off-thesis. **Park or sell separately.** |
| **Ink & Ivory** | `ink-and-ivory/` | Phases 0–3 done, passion project | Personal. **Off-thesis. Keep as portfolio piece, not product.** |

### PERSONAL / FAMILY / SHOWCASE (not products)

| Repo | Role |
|---|---|
| `construction-site/` (Caputo) | Wife's family business site. Not a product. |
| `excalidraw-browser/` | Toolkit / portfolio piece. |
| `claude-skills-100/` | Showcase. |
| `orbai-replica/` | Pixel replica project. |
| `robinhood-trading-system/` | Personal trading signals. Not a product. |

## What's missing from the platform

If you walk an independent restaurant owner through their typical month of work, here's what they spend time on and where Moonlight currently has coverage:

| Owner activity | Typical tooling | Moonlight coverage |
|---|---|---|
| Updating menu / hours / specials | POS / website / social | ❌ — partial via ForkFox claim/edit (Tier 1) |
| Posting to social media | Instagram, TikTok manually | ❌ — gap |
| Email/SMS to past customers | Mailchimp, Klaviyo, Toast Marketing | ❌ — gap |
| Loyalty / repeat customer tracking | Toast, Square Loyalty, Punchh | ❌ — out of scope |
| Reading and responding to reviews | Yelp dashboard, Google My Business | ✅ — Pulse |
| Tracking search rankings | Semrush / nothing | ✅ — Caposeo |
| Tracking foot traffic / dwell | nothing / gut feel | ✅ — Janus (Tier 3) |
| Scheduling staff | 7shifts, HotSchedules, paper | ❌ — out of scope |
| Inventory / ordering | Toast, BlueCart, Clover | ❌ — out of scope |
| Reservations / waitlist | OpenTable, Resy, Tock | ❌ — out of scope (integrate via API) |
| Online ordering setup | DoorDash, Toast, Square Online | ❌ — out of scope |
| Competitive research (new openings, what's working in my zip) | Google searches, Eater, Reddit | **❌ — gap. Launch Sentinel could fill.** |
| Pricing / menu engineering | spreadsheets, gut | **❌ — gap.** |
| Demand forecasting | nothing | **❌ — gap. Janus + Pulse + Caposeo data could power this.** |
| Marketing attribution (where did this customer come from) | nothing real | **❌ — gap. ForkFox + Janus could solve.** |

## The strategic question: which gaps to fill, which to leave?

**Fill (in priority order):**

### 1. Competitive intelligence module ("Launch Sentinel for restaurants")
- Reskin Launch Sentinel's scraping and tracking infrastructure for restaurants
- Track new venue openings, pricing changes, menu updates, review sentiment shifts within a zip / metro
- Sell as a Tier 2 add-on or part of bundled Tier 2
- **Effort: ~3–4 weeks of focused work given Launch Sentinel infrastructure exists**
- **Value: real differentiation — no competitor offers this for independent restaurants**

### 2. Marketing attribution module
- The unique sell: tie ForkFox impressions → physical visits (Janus) → revenue (Toast API integration)
- Requires: integration with Toast's API for transaction data + Janus event log + ForkFox referral tracking
- Sell as part of Tier 3 or as Tier 4 enterprise feature
- **Effort: ~4–6 weeks if Toast API integration cooperates**
- **Value: very high — this is the metric every restaurant marketer wants but can't get**

### 3. Demand forecasting module
- Combine Janus (in-venue) + Pulse (review velocity) + Caposeo (search trend) + ForkFox (impression trend) → forecast next-week demand
- Sell as Tier 3 / Tier 4 feature
- **Effort: ~6–10 weeks of ML work**
- **Value: high in year 2 when there's enough data; premature in year 1**

**Don't fill:**

### POS / payments / online ordering / reservations / loyalty / inventory / scheduling
- All of these are owned by entrenched competitors with stronger relationships and integrated cash flows
- The unit economics of competing here are crushed
- **Stay in the intelligence layer. Don't try to be Toast.**

### Email/SMS marketing automation
- Mailchimp, Klaviyo, Toast Marketing all dominate
- Could partner with one of them via API integration so Moonlight insights → marketing automation actions
- **Don't build the marketing-automation product. Integrate with one.**

## What I think you might be missing on the business end

You asked: "am i missing anything on the business end of the tools ive been working on?" Here's the honest list of gaps that aren't product gaps but business-operations gaps:

### 1. **A defined ICP and target list**
You don't have a "list of 50 SF and 50 NYC venues we're going to acquire in the next 90 days." Build it. Specific names, addresses, owner names where possible. The list is the actual GTM. Without it, the strategy is theoretical.

### 2. **Pricing tested with real prospects**
The tier prices in the Platform doc are estimates calibrated to industry comparables. **Test them with 5 real prospects in the next 30 days.** Don't lock pricing without seeing buyer reactions.

### 3. **Legal entity structure**
Moonlight Analytica is referenced as a holding company but you haven't confirmed it's actually incorporated, what state, with what cap table on file. **Get this nailed down.** Same for ForkFox. Aligned equity is only aligned if it's documented.

### 4. **Customer feedback loop**
You have zero paying customers across any product. Even one paying customer per product (Janus, Caposeo, Pulse, ForkFox owner-side) generates feedback that beats every strategy doc. **First paying customer per product = priority.**

### 5. **Distribution surface**
The strategy assumes you can reach SF/NYC restaurant owners. *How?* Cold DM doesn't scale to thousands. You need:
- A repeatable cold outbound motion (email + DM templates, list-building)
- A content engine (ForkFox blog already partial — extend)
- An events / press strategy (SF Eater, NYC Eater, Resy editorial)
- A referral mechanism (one happy owner → 3 referrals)

### 6. **Onboarding playbook per tier**
What does a Tier 1 customer experience in their first 7 days? Tier 3? You haven't designed this and it's the highest-leverage activation lever. **A bad onboarding kills the platform play.**

### 7. **Pricing for the data product (Tier 4 / industry intelligence sales)**
The strategy doc mentions selling anonymized cross-venue data to non-customers (real estate, insurance, civic). You don't have a pricing model, contract template, or buyer list for this. **It's year 2+ work, but starting the conversations now is free.**

### 8. **Defense track operational kickoff**
Per the Janus defense doc, the 24-month roadmap to first DoD pilot starts with SAM.gov registration, CAGE code, advisor identification, and SBIR mailing list subscriptions. **None of these have been done.** They cost zero engineering hours and compound for 24 months.

### 9. **Data partnerships and API integrations**
The platform thesis depends on integrating with Toast, Square, OpenTable, Resy, etc. for cross-product attribution. **No conversations have started with any of these.** Begin with Toast — they have the most open dev program and the largest market share.

### 10. **The metric system**
What does the company measure weekly? Monthly? Per-product? Per-customer? You have KPIs inside Janus (it's literally a KPI product) but you don't have company-level KPIs documented. Define them. **This is the discipline that separates a portfolio of side projects from an actual company.**

## What to kill, defer, or sell

Honest reduction is part of strategy. The portfolio is too big for two operators (you + co-founder) to give meaningful attention to everything. Recommendations:

| Asset | Recommendation |
|---|---|
| Janus, Caposeo, Pulse, ForkFox, ForkFox for Business | **Core. All-in.** |
| Launch Sentinel | **Repurpose** as competitive intelligence module within platform. Sunset standalone product. |
| BoardLord | **Park.** Phase 1 complete. Don't develop further until platform is profitable. Could be sold separately to a productivity-tool acquirer in 1–2 years for $50k–$200k. |
| PhynxTimer | **Park or kill.** Same logic as BoardLord. Less mature, lower sale value. |
| Ink & Ivory | **Personal portfolio.** Not a product. Keep working on it as a creative outlet but don't allocate company time. |
| Construction Site (Caputo) | **Family work.** Out of scope. |
| Robinhood Trading | **Personal.** Out of scope. |
| Excalidraw, Claude Skills 100, Orb AI | **Showcase.** Not products. |
| Moonlight brand site | **Maintain.** It's the corporate face. |

The reduction frees ~30–40% of your weekly time to focus on the platform. **This is the single most leveraged strategic move available to you right now.**

## The decision-forcing question

Of the four core products (ForkFox, Janus, Caposeo, Pulse) and the two GTM-critical pieces (ForkFox iOS public beta + business portal v0):

**If you could only ship one in the next 30 days, which one?**

My recommendation: **Owner business portal v0.** Without it, every product in the stack has to be sold and onboarded individually. With it, every product can be packaged, billed, and delivered through a single account surface. It's the spine. **Build the spine before adding more limbs.**

If you and your co-founder agree, the next 30 days are: portal v0 + Pulse restaurant-reskin (because Pulse is the cheapest data-rich Tier 1/2 module to add to the portal once it exists).

## Reference

- Integrated platform thesis: [MOONLIGHT-ANALYTICA-PLATFORM.md](MOONLIGHT-ANALYTICA-PLATFORM.md)
- Cross-product integration: [MOONLIGHT-PRODUCT-INTEGRATION.md](MOONLIGHT-PRODUCT-INTEGRATION.md)
- Janus by-vertical playbooks: [../../janus-demo/strategy/JANUS-VERTICAL-PLAYBOOKS.md](../../janus-demo/strategy/JANUS-VERTICAL-PLAYBOOKS.md)
