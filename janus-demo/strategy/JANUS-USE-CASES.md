# Janus Use Cases — Sector Analysis

**Status:** Official strategy documentation
**Locked:** 2026-04-27
**Predecessor docs:** [JANUS-DATA-MOAT.md](JANUS-DATA-MOAT.md), [JANUS-ZONE-MODEL.md](../JANUS-ZONE-MODEL.md)

## Document scope

This document maps Janus's core capability — world-space zone tracking with normalized cross-venue event logs — to specific commercial sectors. For each sector we cover: the buyer, their pain, the specific zones they would draw, the metrics those zones would produce, the willingness to pay, the GTM motion, and the moat depth in that sector.

Defense gets its own deep-dive document: [JANUS-DEFENSE-VERTICAL.md](JANUS-DEFENSE-VERTICAL.md). It is summarized here but the buyer/budget/compliance reality is fundamentally different from commercial verticals and warrants separate treatment.

## Sector summary

| Sector | Buyer | Wedge product | $/camera/mo | Moat depth | Recommended priority |
|---|---|---|---|---|---|
| Restaurants & Bars (independent) | Owner-operator | Operational dashboards | $50–$200 | High (cross-venue benchmark) | **Beachhead** |
| Quick-Service Restaurants (chains) | Ops director / franchise GM | Queue + drive-thru analytics | $100–$300 | High (per-store benchmarking) | Phase 2 |
| Boutique Retail | Owner / store manager | Conversion funnel, dwell map | $75–$250 | Medium-high | Phase 2 |
| Big-Box Retail | District manager / VP Stores | Department-level traffic | $200–$500 | Medium (already have CV vendors) | Phase 4 |
| Fitness & Studios | Owner / GM | Capacity, equipment dwell | $50–$150 | Medium | Phase 3 |
| Hotels & Hospitality | F&B Director, Ops VP | Restaurant + amenity tracking | $150–$400 | High | Phase 3 |
| Healthcare (Outpatient) | Practice manager | Wait time, room utilization | $200–$500 | High (HIPAA-defensive) | Phase 4 |
| Coworking & Office | Workplace director | Desk/room utilization | $100–$300 | High (RTO data) | Phase 3 |
| Stadiums & Venues | Operations VP | Crowd flow, queue, evacuation | $300–$1000 | High (event-day intelligence) | Phase 4 |
| Casinos | Surveillance director | Floor density, table activity | $500–$2000 | High (regulatory + advantage) | Phase 5 |
| **Defense** | DoD program office, base CO | Force protection, perimeter, hangar ops | **$500–$5000+** | **Very high** (normalized base data) | **Parallel track** |
| Civic / Smart City | Public works, planning dept | Plaza, transit, intersection flow | $200–$1500 | Medium | Phase 5 |

---

## 1. Restaurants & Bars (Independent) — The Beachhead

### Buyer
The owner-operator of a 1–3 location independent restaurant or bar. Decision is made by one person, signed in one meeting, paid by one card. Average buyer cycle: 2–6 weeks. Average venue: $1.5M–$5M annual revenue.

### Pain points
- Owner has no idea how long customers wait at the host stand before being seated.
- Owner cannot quantify how many customers walk in, see the line, and leave.
- Owner staffs based on reservations + gut feel, not actual foot traffic.
- Owner doesn't know which tables turn fast vs slow, or which dead zones could be reconfigured.
- Owner gets a POS report that says revenue was $X, but cannot connect that to what happened in the room.

### Zones a typical Philly bar would draw
- `entrance` — door area, floor zone, ~4m × 3m
- `host_stand` — directly behind hostess station, floor zone, ~2m × 3m, capacity = 8 (queue threshold)
- `bar_top` — quad on top of the bar counter (elevated zone), ~10m × 1.4m, capacity = 14
- `bar_floor` — floor area in front of the bar where standing patrons gather, ~10m × 4m, capacity = 25
- `dining_main` — primary dining floor, ~12m × 8m, capacity = 50
- `dining_back` — secondary section, ~8m × 6m, capacity = 30
- `bathroom_corridor` — narrow zone for queue detection at the restroom hallway
- `kitchen_window` — hot zone where servers pick up food (for service-flow tracking)
- `exit` — back of house, used to detect bounces vs converted exits

### Metrics produced
- **Walk-in rate per hour** vs **conversion rate to seated/ordered**
- **Host-stand wait time** distribution (median, p90, p95)
- **Line abandonment rate** — % of entries that hit `entrance + host_stand` and exit without ever reaching `dining_*` or `bar_top`
- **Table-zone turn time** (when zones are drawn at table-level, this becomes per-table turn rate)
- **Bar-side dwell vs dining-side dwell** — different pricing power
- **Server station load** — count of patrons in zones each server is responsible for
- **Time-of-day curves** by zone (when does the bar fill, when does dining peak)

### Willingness to pay
$50–$200 per camera per month, depending on venue revenue. Most independent venues have 1–3 cameras already (insurance / liability). Adding Janus to the existing camera is a per-camera SaaS cost. **Annual contract value per venue: $1,200–$5,000.**

### GTM motion
1. Cold DM / walk-in to Philly venues, 30s–60s demo video link
2. 15-min calendar booking → in-person live demo at the venue with a camera plugged in
3. 30-day pilot: free first month, $X/month after
4. Owner refers to peers (Philly hospitality is dense and gossipy — this works)

### Moat depth
**High.** Within 6 months of beachhead density (5–10 Philly venues), the cross-venue benchmark becomes a retention hook ("you're outperforming the Philly small-bar average by X"). Within 12 months, you have benchmark data that no competitor can replicate without convincing the same owners to deploy a competing system.

### Why this is the beachhead
- Smallest decision-making unit (one person, one signature)
- Densest geographic clustering (Philly hospitality is a 4-mile radius)
- High social referral velocity (owners talk to other owners)
- Lowest compliance burden (no HIPAA, no DoD, no PII sensitivity)
- Highest visibility ROI (a 5% reduction in line abandonment is observable)

---

## 2. Quick-Service Restaurants (QSR Chains)

### Buyer
Operations director or franchise GM at a 50–500 location chain. Multi-stakeholder decision. Average cycle: 3–9 months. RFP-driven.

### Pain points
- Drive-thru wait time directly impacts revenue and is OKR-tracked
- Counter queue length determines walk-out rate
- Labor scheduling is the single biggest controllable cost
- Corporate cannot get standardized data across franchisees

### Zones
- `drive_thru_lane_1` — angled zone covering each lane segment
- `drive_thru_pickup_window` — narrow zone at the pickup point
- `counter_queue` — floor zone where line forms
- `pos_area` — at the registers (per register if multiple)
- `pickup_shelf` — the mobile-order pickup zone
- `dining_in` — seating area
- `kitchen_handoff` — the pass-through where food crosses from kitchen to front of house

### Metrics
- Drive-thru cycle time (entry → pickup → exit), per lane
- Counter queue length and wait time
- Mobile-order pickup-to-departure time
- Labor utilization (zones occupied vs staff scheduled)
- Cross-store benchmarking — every store has the same zones, so corporate can rank stores nationally

### Willingness to pay
$100–$300 per camera per month, multi-camera per location (3–6 cameras typical). $20k–$80k annual contract value per location at scale. Multi-million-dollar contract value at the chain level.

### GTM motion
- RFP / corporate sales motion, not direct-to-store
- Pilot at 3–5 stores, scale to chain after 6 months of data
- Land via a single VP of Operations contact

### Moat depth
**High.** Once a chain has 6 months of normalized cross-store data, switching costs are massive — they'd lose the benchmark, the labor models, and the historical comparisons. This is enterprise SaaS lock-in.

### Why this is Phase 2, not Phase 1
- Sales cycle is too long for a pre-revenue startup
- Decision-makers want to see references — beachhead provides those
- Corporate IT compliance requirements are non-trivial
- Best entered with 30+ independent customers as proof points

---

## 3. Boutique Retail

### Buyer
Owner of a 1–10 location specialty retail (apparel, home goods, gifts, eyewear, beauty). Decision: owner. Cycle: 2–6 weeks. Annual revenue per store: $500k–$5M.

### Pain points
- Owner does not know conversion rate (entries → purchases)
- Owner does not know which fixtures attract dwell
- Staff scheduling is gut-feel
- High return / browse rate from impulse customers — no data on browse patterns

### Zones
- `entrance` — door zone for foot count
- `front_display` — the table or fixture immediately inside
- `feature_wall_left` — main merchandising surface (zone elevated to wall position OR floor zone in front of it)
- `fitting_rooms` — corridor zone, dwell tracker
- `register_queue` — checkout line
- `register_pos` — the actual register
- Various `fixture_X` zones for specific high-value displays

### Metrics
- Walk-in to register conversion rate
- Per-fixture dwell time and visitor count (is the new collection working?)
- Fitting-room conversion (people who enter fitting rooms convert at X% — track shifts)
- Dead-zone identification (which 4m² of floor never sees customers — re-merchandise)
- Time-from-entry-to-purchase

### Willingness to pay
$75–$250 per camera per month, 1–4 cameras per store. $1.8k–$8k annual contract value per location.

### GTM motion
Similar to restaurants: direct-to-owner, demo-driven. Slightly slower decision velocity than hospitality (less social density). Best entered through retail owners' associations or boutique-row geographic clustering.

### Moat depth
**Medium-high.** Cross-store fixture-performance benchmarks are valuable but the dataset is more fragmented than hospitality (every store has a different layout). The moat exists but takes longer to compound.

---

## 4. Big-Box Retail

### Buyer
District manager or VP of Stores at a chain of 100+ locations. Multi-stakeholder. Long cycle (12+ months). Often already have a CV vendor (RetailNext, Sensormatic, ShopperTrak).

### Pain points
- Department-level traffic vs sales conversion
- Staff scheduling at the department level
- Loss prevention (high-value zones, loitering detection)

### Zones
- Per-department floor zones (electronics, apparel, grocery, etc.)
- High-shrink fixture zones (jewelry, electronics, baby formula)
- Cashier line zones, self-checkout zones
- Entry / exit zones with directional flow

### Metrics
- Per-department conversion rate (entries → register transactions)
- Loitering detection and dwell anomalies
- Staff coverage vs traffic correlation

### Willingness to pay
$200–$500 per camera per month, 20–50+ cameras per store. Multi-million-dollar enterprise deals.

### Moat depth
**Medium.** Existing competitors (RetailNext etc.) have 10+ years of dataset depth in this sector. Janus's advantage is the world-space zone abstraction, which they don't have — but big-box buyers may not value that abstraction the way independents do.

### Why this is Phase 4
- Crowded competitor field
- Long sales cycle, enterprise procurement
- Best entered after Janus has proven itself in QSR (Phase 2) and has dataset breadth

---

## 5. Fitness & Studios

### Buyer
Owner or GM of independent gym, yoga studio, climbing gym, pilates studio. 1–5 locations. Cycle: 2–6 weeks.

### Pain points
- Class capacity vs actual attendance (no-shows are 20–40%)
- Equipment utilization (which machines / racks / mats sit idle?)
- Peak-hour overcrowding pushing churn
- Insurance / liability (capacity tracking)

### Zones
- Class studios (per-room floor zones)
- Cardio equipment cluster, weight equipment cluster, free weights, stretching area
- Locker rooms (entry zones only — no in-locker tracking, privacy boundary)
- Reception / welcome desk
- Pool deck (capacity for liability)

### Metrics
- Class fill rate (booked vs actual)
- Equipment dwell per fitness type (cardio vs weights vs flexibility)
- Peak-hour density per zone
- Member behavior segmentation (cardio-only vs strength-focused vs class-driven)

### Willingness to pay
$50–$150 per camera per month, 2–4 cameras per location.

### Moat depth
**Medium.** Cross-gym benchmarks (avg dwell on bench press at independent gyms in Philly) have novelty value. Less proprietary than hospitality but enough to support retention.

---

## 6. Hotels & Hospitality

### Buyer
F&B Director, Hotel General Manager, or Ops VP at hotel chain or independent boutique hotel.

### Pain points
- Lobby flow during check-in peaks
- Restaurant + bar within hotel (same use case as #1 but inside a hotel)
- Pool / amenity capacity tracking (insurance + experience)
- Conference / event space utilization
- Concierge / front desk wait times

### Zones
- Lobby with multiple sub-zones (check-in queue, seating, bar, bell-stand)
- Each F&B outlet (restaurant, bar, lounge)
- Pool deck, gym, spa
- Conference rooms (per room)
- Elevator banks (for traffic flow)

### Metrics
- Check-in queue wait time
- Amenity utilization (gym empty vs pool full)
- F&B revenue correlation with foot traffic
- Event space turn-around time

### Willingness to pay
$150–$400 per camera per month, 15–40 cameras per property.

### Moat depth
**High.** Hotel chains love standardized cross-property data. A 10-property chain on Janus produces inter-property benchmarks worth significant money to corporate ops.

---

## 7. Healthcare (Outpatient)

### Buyer
Practice manager at outpatient clinic, urgent care, dental practice, dermatology, etc.

### Pain points
- Patient wait time (NPS-critical)
- Exam room turnover and utilization
- Front-desk staffing
- Compliance reporting (ADA, throughput metrics)

### Zones
- Waiting room (capacity + dwell)
- Check-in counter
- Exam rooms (per room — utilization)
- Hallways for flow
- Lab / draw stations
- Pharmacy queue (if dispensing)

### Metrics
- Patient wait time distribution
- Exam room turnover (room cleared, next patient in)
- Provider productivity (exam rooms occupied per provider hour)
- Front-desk queue depth

### Willingness to pay
$200–$500 per camera per month. Healthcare has bigger budgets but stricter compliance.

### Compliance considerations
- **HIPAA boundary:** Janus must NEVER store video frames or biometric data. Counts and zone events only. This is already Janus's privacy-first architecture.
- **PHI exposure:** zones must NOT correlate to identified individuals. Current architecture (anonymous track IDs) satisfies this.

### Moat depth
**High.** Cross-practice benchmarking ("your wait time is 18 min, the regional dermatology average is 12 min") is valuable enough to drive retention. Healthcare also has regulatory-driven willingness to pay for documented throughput data.

---

## 8. Coworking & Modern Office

### Buyer
Workplace director, Real Estate / Facilities VP, or coworking space operator.

### Pain points (post-2026 RTO economy)
- Real-estate decisions: how much office do we actually need?
- Conference room booking vs actual usage (massive overprovisioning)
- Desk neighborhood utilization
- Common-area amenity ROI (the cafe, the wellness room, the phone booths)

### Zones
- Per-desk neighborhood zones
- Per-conference-room floor zones
- Cafe / kitchen / break areas
- Phone-booth / private-call zones (capacity 1)
- Lounge / collaboration spaces
- Reception / mail / printer zones

### Metrics
- Desk neighborhood utilization (which side of the floor is dead)
- Conference-room ghost-meeting rate (booked but empty)
- Amenity utilization
- Day-of-week occupancy patterns (Tuesday vs Thursday)

### Willingness to pay
$100–$300 per camera per month for coworking; higher ($200–$500) for enterprise office where the data drives 8-figure real-estate decisions.

### Moat depth
**High.** Real estate is a billion-dollar decision and any cross-portfolio data has enormous value. WeWork-scale customers can pay 6-figure annual contracts.

---

## 9. Stadiums & Venues

### Buyer
Operations VP at a stadium, arena, or multi-event venue.

### Pain points
- Concession queue lengths during games
- Restroom queue and capacity
- Bottleneck flow (causing missed plays / fan complaints)
- Evacuation modeling (regulatory requirement)
- Concourse merchandising effectiveness

### Zones
- Each concession stand (queue zone + service zone)
- Each restroom corridor (queue + capacity)
- Section entry portals (for crowd flow)
- Major concourse intersections
- VIP / club zones
- Egress paths (for evacuation modeling)

### Metrics
- Per-concession revenue lift correlated with queue speed
- Restroom queue distribution by inning / period
- Concourse density heatmaps
- Evacuation simulation validation (real flow vs modeled flow)

### Willingness to pay
$300–$1000 per camera per month, 100–500+ cameras per venue. Multi-million-dollar contracts.

### Moat depth
**High.** Cross-venue comparisons are very valuable to leagues / facility-management firms (ASM Global, Oak View Group). Single-venue data alone is worth significant money for in-game ops.

---

## 10. Casinos

### Buyer
Surveillance director or Director of Operations at a regional or commercial casino.

### Pain points
- Floor density and capacity tracking (regulatory + revenue)
- Table game activity tracking
- VIP host coverage
- Loitering / suspicious dwell detection (advantage play, theft)
- Staff response time

### Zones
- Each gaming pit (multi-table cluster)
- Each table game (per-table zones)
- Slot floor sections
- Cage / cashier
- VIP / high-limit areas
- Restaurants, bars, retail, restrooms (same as hospitality use case)

### Metrics
- Per-pit / per-table activity (occupancy, dwell, turn rate)
- Suspicious-dwell flagging (e.g., card-counting style table-hopping)
- Cage queue management
- Cross-property benchmarking for chains (Caesars, MGM)

### Willingness to pay
$500–$2000 per camera per month. Casinos already spend 7-figures on surveillance — this is incremental, but on top of an enormous base.

### Compliance considerations
- Coordinated with existing surveillance DVRs
- Often operate under state gaming control board oversight
- Must NOT do facial recognition or identification — Janus's no-FR architecture is a feature, not a limitation

### Moat depth
**High.** Casino-floor analytics is currently bespoke or absent. Janus enters with a normalized abstraction and a no-FR architecture that aligns with regulatory direction.

### Why this is Phase 5
- Vertical-specific compliance (gaming control boards in each state)
- Heavy procurement bureaucracy
- Best entered after a hospitality + retail track record

---

## 11. Defense — see [JANUS-DEFENSE-VERTICAL.md](JANUS-DEFENSE-VERTICAL.md)

**Summary:** Defense is the highest willingness-to-pay vertical Janus can credibly enter. The combination of (a) world-space zones (which map directly to physical force-protection requirements), (b) no-facial-recognition architecture (which removes a major DoD compliance objection that has killed competitors), and (c) the data-moat structure (which aligns with DoD's preference for normalized, cross-installation analytics) makes defense a parallel track worth pursuing alongside the commercial beachhead, not after it.

**Key zones for defense use cases:**
- Perimeter sectors (vehicle and pedestrian gates, fence-line zones)
- Hangar floor zones (aircraft positions, ground-support-equipment areas)
- Flight line tracking (taxiways, parking, fuel ops)
- Headquarters / SCIF entry zones (capacity + audit)
- Barracks common areas (force protection)
- Range / training facility activity tracking
- Logistics yards (vehicle / container flow)

**Pricing:** $500–$5,000+ per camera per month with multi-camera per installation. **Single-base contract values: $250k–$5M annually.** Multi-base or program-of-record contracts: $10M–$100M+.

**See dedicated doc for the full analysis** including buyer personas, contracting paths (SBIR, OTA, GSA, Direct), compliance posture (CMMC 2.0, ATO, no-FR), and a 24-month roadmap to a first DoD pilot.

---

## 12. Civic / Smart City

### Buyer
Public works department, planning department, transit authority, parks department, or downtown business improvement district (BID).

### Pain points
- Plaza / park utilization (justify maintenance budget)
- Transit station flow (subway entrances, bus stops)
- Crosswalk / intersection pedestrian behavior
- Event-day flow (festivals, parades)
- Crime / loitering hot-spots (without facial recognition — politically critical)

### Zones
- Plaza sub-zones (where do people actually congregate?)
- Transit platform zones, fare gate zones, escalator zones
- Crosswalk approach / wait zones
- Event area zones (vendor stalls, stage, viewing areas)
- Park amenities (playground, benches, water fountain)

### Metrics
- Foot traffic by hour / day / season
- Event-day vs baseline comparisons
- Pedestrian wait time at intersections
- Amenity utilization

### Willingness to pay
$200–$1500 per camera per month. Civic budgets are smaller per-camera but slower-churning. Large-scale projects (subway, smart-city pilots) can be 7-figure contracts.

### Compliance considerations
- Public-space surveillance is politically sensitive — Janus's no-facial-recognition + no-stored-video architecture is a major asset for civic buyers
- Many cities require explicit privacy reviews — a no-FR architecture passes these reviews trivially

### Moat depth
**Medium.** Civic data has lower commercial value than commercial data, but the contracts are stable and large. Long-term play, not a beachhead.

---

## Cross-cutting observations

### Privacy-first architecture is a feature, not a limitation
Every sector above includes a sentence like "Janus's no-stored-video, no-facial-recognition architecture is a feature, not a limitation." This is true. It removes a procurement objection in healthcare (HIPAA), defense (no-FR DoD policies), civic (political), and casinos (gaming control boards).

Competitors who chose facial recognition as a feature have permanently locked themselves out of multiple verticals. Janus's architectural choice is also a strategic moat against a class of competitor.

### The zone abstraction generalizes across every sector
Every use case in this document is structurally identical: define zones in world space, count people in zones, measure dwell, log transitions, compare across venues. The technical product does not change between a Philly bar, a hangar, a hospital, or a casino. **One product surface, twelve sectors.**

This means R&D effort compounds — improvements to the core platform benefit every sector. It also means that a customer's data layer, once invested in, can be extended to new use cases without architectural rework.

### Cross-venue normalization is the universal retention hook
In every sector, the cross-venue / cross-installation benchmark is the feature that prevents customer churn. Customers are not buying tracking — they're buying *being measured against everyone else*. The moat compounds with every onboarded customer in the same sector.

### The total addressable market
- **Independent restaurants & bars (US):** ~600,000 establishments × $2,000 ACV = $1.2B TAM
- **QSR (US):** ~250,000 stores × $30,000 ACV = $7.5B TAM
- **Independent retail (US):** ~1,000,000 stores × $3,000 ACV = $3B TAM
- **Healthcare outpatient (US):** ~250,000 facilities × $5,000 ACV = $1.25B TAM
- **Coworking + enterprise office (US):** ~80,000 properties × $25,000 ACV = $2B TAM
- **Stadiums + arenas (US):** ~3,000 venues × $250,000 ACV = $750M TAM
- **Defense (US, addressable):** ~5,000 installations × $1M ACV = $5B TAM
- **Hotels (US):** ~55,000 properties × $30,000 ACV = $1.65B TAM
- **Coffee shops, fitness, casinos, civic, etc.:** combined ~$3B TAM

**Total US TAM (conservatively): $25B+. Beachhead (independent hospitality in Philly): ~$2M ARR within 24 months.**

The TAM of the wedge product is small. The TAM of the underlying data + analytics layer applied across all sectors is enormous. Janus is not a hospitality company — it is a physical-space analytics infrastructure company that uses hospitality as the wedge.

## Reference

- Strategic moat: [JANUS-DATA-MOAT.md](JANUS-DATA-MOAT.md)
- Defense vertical deep-dive: [JANUS-DEFENSE-VERTICAL.md](JANUS-DEFENSE-VERTICAL.md)
- Technical foundation: [../JANUS-ZONE-MODEL.md](../JANUS-ZONE-MODEL.md)
- ADR: [../docs/ADR-001-zone-model-3d-world-space.md](../docs/ADR-001-zone-model-3d-world-space.md)
