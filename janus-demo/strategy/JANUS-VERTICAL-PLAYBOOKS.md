# Janus — Per-Vertical Marketing & Sales Playbooks

**Status:** Official strategy documentation
**Locked:** 2026-04-27
**Audience:** Ali (CMO Moonlight Analytica)
**Predecessor docs:** [JANUS-USE-CASES.md](JANUS-USE-CASES.md), [JANUS-DATA-MOAT.md](JANUS-DATA-MOAT.md)

## Purpose

Each vertical from the use-cases doc gets a concrete go-to-market playbook here: who to call, how to reach them, what to say, what to send, what the demo flow looks like, what the contract structure is, what the typical buyer's objection is and how to handle it. These are not theoretical — they're the playbooks an SDR or AE would run.

## Sequencing recap

From the use-cases doc:

- **Phase 1 — Beachhead:** Hospitality (independent restaurants & bars in SF + NYC, integrated with ForkFox)
- **Phase 2:** QSR chains, Boutique retail
- **Phase 3:** Fitness, Hotels, Coworking/Office
- **Phase 4:** Big-box retail, Healthcare, Stadiums
- **Phase 5:** Casinos, Civic / Smart City
- **Parallel track:** Defense (long-cycle, SBIR/DIU)

The playbooks below are ordered by phase. Phase 1 is the primary GTM motion for the next 12 months. Phases 2–5 are queued, with sales work beginning when Phase 1 is at $300k+ ARR.

---

## PHASE 1A — Independent Restaurants & Bars (SF + NYC) — THE BEACHHEAD

### Target ICP
- Independent, owner-operator
- Single venue or 2–3 location group
- $1.5M–$15M annual revenue per venue
- SF: SoMa, Mission, Hayes Valley, Marina, Castro
- NYC: Lower East Side, East Village, Williamsburg, Brooklyn Heights, Hell's Kitchen, West Village
- Restaurant categories: cocktail bars, modern American, ramen / Asian, neo-bistro, neighborhood gastropub, third-wave coffee
- Tech-comfortable owner profile (already on Resy or has a custom website, posts on Instagram regularly, mentioned in Eater/Resy editorial)

### How to find them
- **Resy "Notable" lists** (SF and NYC have curated editorial lists) — gold-tier prospect list
- **Eater 38 / Eater Heatmap** by metro (the canonical "where to eat now" lists)
- **Infatuation / The Bold Italic / Time Out** features
- **Instagram hashtags** by neighborhood (#sfdrinks, #nycbars) — find venues with strong social engagement
- **OpenTable / Resy** category browsing — filter by 4.5+ star, 100+ reviews
- **ForkFox's own data** — once ForkFox iOS has 5–10k consumer users, the most-favorited venues become the prospect list

**Build a target list of 50 SF + 50 NYC venues.** Specific names, addresses, owner names where possible. The list IS the GTM. Make it before any outreach.

### How to reach them
**Primary channel: Instagram DM** (yes, really)
- Most independent restaurant owners run their own Instagram or check it daily
- A DM with a 30-second video gets opened
- Cold email to a generic info@ address gets ignored

**Secondary: warm intros via ForkFox editorial relationships**
- Once ForkFox has covered a venue editorially, the owner is warm to follow-up
- Many of Phase 1 customers will come from ForkFox-driven warm intros, not cold

**Tertiary: in-person walk-ins during off-hours**
- 2–4pm on a Tuesday / Wednesday is when owners are at the venue but slow
- Bring a laptop with the demo loaded and ready to play
- 80% will say "leave a card." 20% will engage. The 20% is your conversion rate.

**Avoid:** LinkedIn (low signal in restaurant industry), generic cold email, "request a demo" form fills.

### The opening message (DM template — adapt per venue)
> Hi [name] — saw [specific compliment about their venue, drink, dish, or recent press]. I'm building Janus, a tracking system for independent bars/restaurants in SF (NYC) — it shows you in real time how full each section of your space is, how long the line at the host stand actually takes, and where customers spend the most time. Made a 60-second demo: [link]. Curious if you'd want to see how it'd work at [their venue] specifically. Either way, big fan of what you're doing.

**Why this works:**
- Specific compliment = you actually went there or read about it (not a templated DM)
- One-line product description that maps to a problem they recognize
- Demo is the proof — they can self-qualify before you take their time
- Soft close ("either way, big fan") leaves the door open if no

### The demo flow (15–20 minutes)
1. **2 min:** the 60s polished demo video (the one being built — 3D zone mock + RF-DETR tracking + KPIs side panel)
2. **3 min:** "here's how it works at YOUR venue" — show their venue's layout, point at where zones would go (entrance, host stand, bar, dining areas)
3. **5 min:** "here's what the data looks like" — show a populated demo dashboard with simulated numbers for their venue
4. **3 min:** "here's how it integrates with the platform" — quick mention of ForkFox + Pulse + Caposeo, but don't over-pitch
5. **2 min:** Pricing and pilot offer
6. **5 min:** Q&A and close

**Total: 20 min.** Anything longer loses them. Anything shorter doesn't sell.

### The pilot offer (the close)
- 30-day free pilot
- 1 camera installed (USB or RTSP — they probably already have CCTV)
- Janus tracking + Pulse review monitoring + Caposeo search visibility = full Tier 3 stack for 30 days
- After 30 days: $499/mo for Tier 3 OR drop to Tier 1 ($79/mo) OR cancel
- **No long-term contract.** Month-to-month.

The free pilot reduces purchase friction. The fact that you give them three downgrade options (full / partial / cancel) reduces post-pilot anxiety. Most pilots that go to Tier 3 stay there. Some drop to Tier 1, which is fine — they're still customers.

### Common objections and how to handle them

| Objection | Response |
|---|---|
| "I don't have a camera." | "Most don't. We can ship you one for $200 (cost) and credit it back if you stay 6 months. Or use your phone in a tripod for the pilot." |
| "Privacy / surveillance feels weird." | "We never store video and don't do facial recognition. We only track anonymized counts. Here's a one-pager on the architecture." [send the privacy doc] |
| "I don't have time to install or learn another tool." | "Total install is 30 min. Total learning is ~10 min once a week. Pilot is free; if it's not worth that, cancel." |
| "What does this cost vs ROI?" | "$499/mo if it gives you back 1 hour of better staffing decisions per week, you've made the money back. Most owners get more than that." |
| "Toast already has analytics." | "Toast tells you what was sold. We tell you what happened *before* the sale — how many walked in, how long they waited, where they spent time. We integrate with Toast for the full picture." |
| "How many other restaurants are using this?" | (Year 1 honest answer:) "We're rolling out with 5 SF/NYC venues right now. You'd be in the first 10. The benefit is you get founder-level attention; the cost is you're an early adopter." |
| "Send me more info, I'll think about it." | "Sure — but the pilot is free for the first 10 venues only. If you want to lock the slot, I'll set you up this week." (Mild urgency without lying. The 10-slot framing is real because we need to limit Year 1 deployments to ones we can actually support.) |

### Contract structure
- Month-to-month subscription (Tier 3, $499/mo + per-additional-camera fee)
- Stripe payment, auto-renewal
- 30-day cancellation
- **Hardware separate** ($200 starter kit, optional)

### Win definition
- 5 SF venues + 5 NYC venues at Tier 3 = $5,000 MRR / $60k ARR by month 6
- 30 venues across SF + NYC at Tier 3 by month 12 = $15k MRR / $180k ARR
- Cross-venue benchmarks become a real product when 30+ venues exist in a metro

---

## PHASE 1B — Hospitality Group / Multi-Venue Independent Operators

### Target ICP
- Restaurant groups: 3–15 venues under one ownership
- Examples in SF: Daniel Patterson Group, Anchor Oyster Bar parent, Rich Table parent
- Examples in NYC: Crown Shy / Saga group, Carbone parent (Major Food Group is too big), Frenchette parent
- Owner profile: experienced operator, has corporate ops capability, treats data as a discipline

### Why this is different from independent
- Decision-maker is a CFO/COO, not an owner-chef
- Sales cycle: 2–4 months instead of 2–4 weeks
- Deal size: $5k–$25k/mo (multiple venues at Tier 3 / Tier 4)
- Value prop: cross-venue rollup, P&L attribution, predictive ops

### How to reach them
- LinkedIn outreach to operations director / CFO / managing partner
- Warm intro through Resy / OpenTable account managers (these AMs talk to restaurant CFOs)
- Industry events (NYC Restaurant Show, NRA Show, Specialty Food Association)

### The opening message
> Hi [name] — Janus is a physical-space analytics platform built for restaurant groups. We help operators see, in real time, how full each section of each venue is, how long the line at every host stand takes, and how venue performance compares across the group. We're building this in SF and NYC and would value 20 minutes to show you how it could work for [group name]. Demo here: [link]. Worth a look?

### Demo flow (different from independent — 30 min)
1. **3 min:** the polished demo video
2. **5 min:** group-level cross-venue rollup mockup (occupancy heatmap across all their venues)
3. **5 min:** P&L attribution (foot traffic vs revenue per venue, normalized)
4. **5 min:** their own data, simulated (use ForkFox/Resy public data on their venues to ballpark numbers)
5. **5 min:** ROI math — "if Janus gives you back 1 hour of operations director time per venue per week, $X annually"
6. **5 min:** Pilot offer (3 venues, 30 days, $X/mo — pricing is ~Tier 3 × number of venues with a group discount)
7. **2 min:** Q&A and close

### Pricing
- Tier 4 group pricing: starts at $1,500/mo for 3-venue group, scales by venue count
- Annual contract preferred at this tier (still allow month-to-month with a 20% premium)

---

## PHASE 2 — QSR Chains (deferred 12+ months)

### Why this is Phase 2, not Phase 1
- Sales cycle: 6–18 months, RFP-driven
- Requires reference customers (need 30+ Phase 1 customers as proof)
- Corporate procurement requires SOC 2, integrations, MSAs
- **Don't pursue until Phase 1 is at $300k+ ARR**

### Target ICP (when ready)
- 50–500 location regional QSR chains (not the top 10 — those are owned by enterprise CV vendors)
- Examples: regional burger chains, regional sandwich shops, regional taquerias, regional pizza chains
- VP of Operations or VP of Innovation as buyer

### Wedge feature
**Drive-thru cycle time tracking + cross-store benchmarking.** This is the #1 OKR'd metric in QSR. Janus can measure it (entry to pickup-window time, per lane) better than the existing "honesty system" of staff timers. Per-store ranking against the chain average.

### Sales motion
- Account-based marketing (ABM) — target a list of 50 specific chains
- Sales cycle: pilot at 3 stores → 25 stores → full chain. Each step is a 6-month conversation.
- Land via VP Operations; expand via Director of Store Performance or Innovation
- **Annual contract value at scale: $200k–$2M per chain.**

### What to send in the cold reach
- A 5-page "QSR Drive-Thru Analytics Guide" (build this when ready) with one customer reference
- A custom 90-second demo video with a relevant chain's likely zones

### When to start
**Begin building the QSR-specific demo and 5-page guide when Phase 1 is at $200k+ ARR.** Begin outbound when at $300k+ ARR. Don't try to run both motions simultaneously before then.

---

## PHASE 2 — Boutique Retail

### Target ICP
- Specialty retail: independent apparel, eyewear, beauty, home goods, gift, bookstore, specialty food
- 1–10 locations
- $500k–$5M revenue per store
- Owner profile: design-conscious, brand-driven, often has an e-commerce side too

### Wedge feature
**Conversion funnel + dwell heatmap.** Owner sees: of 100 walk-ins, X engaged with the front display, Y entered the fitting rooms, Z bought something. Plus: heatmap of where customers spend time so they know what to merchandise.

### Sales motion
Identical to independent restaurants but with different category-specific outreach lists:
- SF target lists: Hayes Valley boutiques, Fillmore boutiques, Mission/Valencia retail row
- NYC target lists: SoHo, NoLita, Williamsburg, Brooklyn Heights retail rows

### Pricing
Identical tier ladder as restaurants: Tier 1 ($79), Tier 2 ($299), Tier 3 ($499) with possibly a Tier 3 retail-specific add-on (fitting room conversion module, $200/mo).

### When to start
**6 months after restaurants are working.** The motion is similar but the categories are different. Don't try to learn both at once — own one vertical, then expand.

---

## PHASE 3 — Fitness & Studios

### Target ICP
- Independent boutique gyms (CrossFit boxes, climbing gyms, Pilates studios, boutique yoga)
- Mid-tier chains (10–30 locations) — Equinox is too enterprise; Solidcore-tier is right
- 1–5 locations, $1M–$10M revenue per location

### Wedge feature
**Class capacity vs actual attendance + equipment dwell.** Owner sees: 75% no-show rate on Tuesday 6am yoga, 95% utilization of squat racks at 6pm, dead zone in the back of the gym 60% of the day.

### Sales motion
- Owner-direct outreach (similar to restaurants)
- Can leverage Mindbody / ClassPass partnerships if you can get the data integrations
- **Selling angle: insurance-related capacity tracking is a free additional value-add (liability documentation)**

### Pricing
$99–$199/mo Tier 1, $299–$399 Tier 2, $499–$799 Tier 3.

---

## PHASE 3 — Hotels & Hospitality

### Target ICP
- Boutique independent hotels (10–60 rooms)
- F&B-heavy properties (the hotel restaurant/bar is the wedge)
- Examples: SF — Hotel Drisco-tier, San Francisco Proper, Phoenix Hotel; NYC — The Bowery Hotel-tier, Hotel Henri, Made Hotel
- Buyer: F&B Director or General Manager

### Wedge feature
**Hotel restaurant + bar tracking** (same as Phase 1 hospitality module) **+ lobby/check-in flow.** Cross-amenity tracking (gym + pool + restaurants + meeting space) is a Tier 4 enterprise feature.

### Sales motion
- Trade shows: Boutique Hotel Investment Conference (BLLA), HD Expo, Hotel Internet Marketing Conference
- Trade press: Hotelier, Hotel News Resource, Skift
- Direct outreach to F&B Directors via LinkedIn

### Pricing
$300–$600/mo per camera, multiple cameras per property = $2k–$8k MRR per hotel.

---

## PHASE 3 — Coworking & Modern Office

### Target ICP
- Coworking operators: Industrious, Convene, Mindspace, regional players
- Mid-market enterprise office: 50–500 person offices that own their building
- Workplace director or Director of Real Estate as buyer
- The "RTO data" buyer: VP of HR / VP of Operations who needs data to justify return-to-office or downsize-office decisions

### Wedge feature
**Conference room ghost-meeting detection** (booked but empty, costs companies real money) + **desk neighborhood utilization** (which floor is dead).

### Sales motion
- Real-estate-focused outreach (CBRE, JLL, Cushman & Wakefield brokers can refer)
- Workplace strategy consultants (Gensler, HOK, etc. — they specify products)
- Direct to corporate facilities VPs at companies with 100+ person offices

### Pricing
$200–$500/mo per camera, 5–20 cameras per office = $1k–$10k MRR per customer. Annual contracts preferred.

### Why this is high-leverage
**Real estate decisions are 8-figure.** Being the data layer that informs "do we keep the floor or not" gets you a seat at the table where the big decisions are made. This is also where Density.io has been winning — but Janus's no-FR + integrated platform pitch is differentiated.

---

## PHASE 4 — Big-Box Retail (deferred 18+ months)

### Why deferred
- Crowded competitor field (RetailNext, ShopperTrak)
- Long sales cycle, enterprise procurement, multi-year RFPs
- Best entered after Phase 1, 2, 3 give Moonlight reference customers and a track record

### Approach when ready
- Pilot via boutique retail group expanding into mid-size chain
- Partnership with retail consultants (Marvin Traub Associates, Storch Advisors)
- ABM into District Manager / VP Stores

### Pricing
Enterprise SaaS: $200k–$2M annual contracts.

---

## PHASE 4 — Healthcare (Outpatient)

### Why this is interesting
- HIPAA-compliant from day 1 (no FR, no video storage = pre-compliant)
- Wait time / room utilization is a board-level KPI
- Practice managers have $200/mo to spend per camera without complex procurement

### Target ICP (when ready)
- Independent dental, dermatology, urgent care, primary care practices
- 1–5 locations, $2M+ revenue
- Practice manager as buyer (often the spouse/partner of the doctor — marketing-savvy, not bureaucratic)

### Wedge feature
**Patient wait time + exam room turnover.**

### Sales motion
- Practice management associations (AAPM, MGMA)
- Trade press (Medical Economics, Healthcare Finance News)
- Direct to practice managers via LinkedIn

### Why deferred
HIPAA compliance documentation, BAA contracts, cybersecurity attestations all need to be productized before this is sellable. **6 months of compliance work to be healthcare-ready.** Don't enter without it.

---

## PHASE 4 — Stadiums & Venues

### Target ICP
- Mid-size arenas: AHL hockey, MLS soccer, college basketball, mid-tier music venues
- Operations VP at the venue or facility-management firm (ASM Global, Oak View Group)

### Wedge feature
**Concession queue + restroom queue tracking** during events. Highly visible, directly impacts fan experience.

### Sales motion
- Industry trade shows (IAVM Venue Connect, NFL Operations conferences)
- Facility management partnerships (ASM, Oak View)
- Multi-year enterprise contracts ($300k–$2M annual)

### Why deferred
Long sales cycle, reference-customer requirement. **Best entered after Phase 1 and Phase 3 give Moonlight 100+ commercial customers.**

---

## PHASE 5 — Casinos

### Target ICP
- Regional casinos (tribal + commercial), not Strip mega-resorts
- Director of Surveillance or Director of Operations
- Markets: Pennsylvania (Wind Creek, Rivers), New Jersey (Borgata, Hard Rock AC), upstate NY, Connecticut (Foxwoods, Mohegan), tribal Midwest

### Wedge feature
**Floor density + table activity tracking** without facial recognition (no-FR is a feature here — many states moving away from FR-based casino surveillance).

### Sales motion
- Gaming industry conferences (G2E Las Vegas)
- State gaming commissions (relationships matter)
- Direct to surveillance directors through cleared advisor relationships

### Why deferred to Phase 5
Heavy state-by-state regulatory work. Each state's gaming control board has compliance review requirements. Best entered after a track record in healthcare (proves compliance maturity) and hotels (proves hospitality + multi-amenity capability).

---

## PARALLEL TRACK — Defense

See dedicated doc: [JANUS-DEFENSE-VERTICAL.md](JANUS-DEFENSE-VERTICAL.md). Summary:

- Begin SAM.gov + CAGE code immediately (free, takes weeks)
- Subscribe to AFWERX / Army SBIR / Navy SBIR / DIU mailing lists immediately (free)
- First SBIR proposal target: 6 months out
- First award target: 12–18 months out
- First deployed pilot: 18–24 months out
- **Run completely separately from commercial GTM.** Different SKU, different messaging, different audience. Customers should never see the defense capability and vice versa.

---

## Cross-vertical patterns

### What's the same across all verticals
- The 4-step zone interaction (Create → Rotate → Place → Commit) — universal
- The privacy-first architecture — feature in every vertical
- The cross-venue / cross-installation benchmark as retention hook — universal
- World-space zones as the data foundation — universal

### What changes per vertical
- The buyer (owner vs ops director vs facility VP vs program manager)
- The sales cycle (2 weeks vs 18 months)
- The price point ($79 vs $5k+ per camera per month)
- The compliance posture (none vs HIPAA vs CMMC vs gaming control board)
- The integration partners (Toast vs nothing vs HL7 vs SIPRNet)

The product is the same. The packaging, pricing, and motion change.

### The compounding effect across verticals
Each vertical compounds the moat for the others:
- Hospitality wins → reference customers for QSR
- Hospitality + retail → reference customers for fitness, hotels
- Hospitality + retail + fitness → reference customers for healthcare
- All commercial verticals → credibility for defense

**Don't try to enter every vertical at once.** Win one, expand to adjacent, repeat. The strategy is patience.

## What I (the strategist) recommend

1. **Spend the next 90 days exclusively on Phase 1A.** No QSR outreach, no fitness, no hotels. **Just SF + NYC independent restaurants and bars, integrated with ForkFox.** This is where the wedge converts.
2. **Build the target list this week.** 50 SF + 50 NYC venues. Specific names, addresses, owner names. The list is the GTM.
3. **Lock the 60-second demo video** (in flight). Without it, no DM gets a response.
4. **Start the SAM.gov + CAGE code defense paperwork in parallel.** Costs zero engineering hours and compounds for 24 months.
5. **At $200k ARR in Phase 1A, begin Phase 1B (hospitality groups).** This is the natural expansion within the same vertical.
6. **At $300k ARR overall, begin Phase 2 (QSR + retail) outreach.** Not before.
7. **All other verticals are 12+ months out.** Documented here so you don't forget the play, not because they're imminent.

## Reference

- Strategic moat: [JANUS-DATA-MOAT.md](JANUS-DATA-MOAT.md)
- All sectors at higher level: [JANUS-USE-CASES.md](JANUS-USE-CASES.md)
- Defense parallel track: [JANUS-DEFENSE-VERTICAL.md](JANUS-DEFENSE-VERTICAL.md)
- Integrated platform: [../../moonlight-deploy/strategy/MOONLIGHT-ANALYTICA-PLATFORM.md](../../moonlight-deploy/strategy/MOONLIGHT-ANALYTICA-PLATFORM.md)
- Portfolio audit: [../../moonlight-deploy/strategy/MOONLIGHT-PORTFOLIO-AUDIT.md](../../moonlight-deploy/strategy/MOONLIGHT-PORTFOLIO-AUDIT.md)
