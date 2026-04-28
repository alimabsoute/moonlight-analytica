# Janus — Industry Use Cases & KPIs Master Reference

**Status:** Official strategy documentation
**Locked:** 2026-04-28
**Purpose:** Canonical reference for what Janus measures for whom, with **specific KPIs per industry** and the operational decisions those KPIs drive. Used for vertical sales playbooks, pitch decks, capability briefs, and product roadmap prioritization.
**Companion docs:** [JANUS-USE-CASES.md](JANUS-USE-CASES.md), [JANUS-DEFENSE-VERTICAL.md](JANUS-DEFENSE-VERTICAL.md), [JANUS-DATA-MOAT.md](JANUS-DATA-MOAT.md)

---

## How to read this doc

Every industry section follows the same shape:

1. **Buyer** — who signs the contract
2. **Use cases** — concrete operational scenarios where Janus is deployed
3. **Specific KPIs** — measurable metrics with units, computed in real-world world-space (not pixels)
4. **What each KPI unlocks** — the decision it informs
5. **Pricing range** — $/camera/month for that vertical

Every KPI in this doc is computed from world-space zone tracking and is structurally only possible when zones are 3D physical-space planes (not 2D pixel polygons). Cross-venue benchmarks within each vertical are the retention layer.

---

# COMMERCIAL VERTICALS

## 1. Restaurants & Bars (Independent — beachhead vertical)

### Buyer
Owner-operator of a single venue or 2–3 location group. $1.5M–$15M annual revenue. SF / NYC primary.

### Use cases
- **Front-of-house** — host stand, dining floor, bar rail
- **Back-of-house** — kitchen pickup window, server stations
- **Outdoor** — patio, sidewalk, line management
- **Multi-section** — bar vs dining vs private dining
- **Reservation conversion** — book → arrive → seated → ordered

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Walk-in rate per hour | persons/hr | Staff scheduling, peak hour identification |
| Host-stand wait time (median + p90) | seconds | When to add a host, reservation slot length tuning |
| Line abandonment rate | % | Lost-revenue quantification (every % point ≈ $200–$800/night) |
| Walk-in to seated conversion | % | Hosting effectiveness |
| Walk-in to ordered conversion | % (joined with POS) | True throughput rate |
| Per-table dwell time | minutes | Identify slow tables for reconfiguration |
| Per-table turn rate | turns/night | Direct revenue lever (0.3 turn improvement ≈ $200k–$400k/yr) |
| Section utilization | % occupied of operating hours | Close sections on slow nights ($80–$150/shift labor savings) |
| Bar-rail concurrent occupancy | persons (at counter height) | Bartender scheduling, density-driven pricing |
| Server-station load | persons/server | Workload balancing across the floor |
| Average ticket-time per zone | minutes | Service speed by section |
| Capacity utilization vs declared | % | Real fire-marshal compliance, insurance documentation |
| Cross-zone customer journey | sequence | Identify "browsers who don't order" segment |
| Happy hour vs peak occupancy delta | persons | Pricing/promotion effectiveness |
| Friday/Saturday peak shift offset | minutes | Predictive staffing |

### Pricing
- Tier 1 Brand: $79/mo
- Tier 2 Intelligence: $299/mo
- Tier 3 Operations (with Janus): $499–$999/mo per venue
- Tier 4 Group: $1,500–$5,000/mo for 3–10 venues

### What only Janus does (vs Toast / Resy)
Toast tracks transactions. Resy tracks reservations. **Neither tracks pre-transaction physical behavior.** Janus measures the gap between someone walking in and someone paying. That gap is where 60-80% of operational decisions live.

---

## 2. Quick-Service Restaurants (QSR Chains)

### Buyer
VP of Operations / VP of Innovation at 50–500 location chains. Multi-stakeholder, RFP-driven.

### Use cases
- **Drive-thru lanes** — entry, order point, pickup window
- **Counter** — queue, ordering, mobile-order pickup
- **Dining-in** — turn rate, kid play areas
- **Multi-store rollup** — cross-store benchmarking from corporate

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Drive-thru cycle time per lane | seconds (entry → exit) | OKR-tracked at corporate level |
| Per-segment drive-thru dwell | seconds (order, payment, pickup) | Identify the bottleneck segment |
| Drive-thru abandonment rate | % | Lane-balancing decisions |
| Counter queue length | persons | Staff redeployment from kitchen |
| Counter wait time | seconds | Walk-out risk threshold |
| Mobile-order pickup-to-departure | seconds | Mobile vs counter throughput |
| Kitchen-to-customer handoff time | seconds | Service speed under volume |
| Per-store rank (national) | percentile | Manager bonus / corrective action |
| Day-of-week × time-of-day occupancy | heatmap | Labor scheduling |
| Day-part transition smoothness | persons during 5-min window | Breakfast-to-lunch staffing |

### Pricing
- $200/mo per camera, 3–6 cameras per store
- Annual contract value at scale: $20k–$80k per location
- Multi-million-dollar contract value at chain level

---

## 3. Boutique Retail

### Buyer
Owner of 1–10 location specialty retail (apparel, home goods, beauty, books, eyewear). $500k–$5M revenue per store.

### Use cases
- Front-display engagement
- Fixture-level dwell tracking
- Fitting room conversion
- Cashier line management
- Dead-zone identification

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Walk-in to register conversion | % | The single most important retail metric |
| Per-fixture dwell time | seconds | Which displays attract real attention |
| Per-fixture visitor count | persons/hour | Effectiveness of new collection placement |
| Fitting room conversion | % (entered → bought) | Service flow validation |
| Fitting room abandonment | % | Sales floor staffing during fitting wait |
| Time-from-entry-to-purchase | minutes | Customer journey optimization |
| Browse vs purchase segments | % of traffic | Pricing strategy + targeting |
| Dead-zone identification | m² of floor | Reconfiguration / new merchandising priority |
| Register queue | persons + seconds | Open second register threshold |
| First-touch fixture | which fixture they engaged with first | Lead-display effectiveness |

### Pricing
- $79–$249/mo per camera
- 1–4 cameras per store
- Annual contract value: $1.8k–$8k per location

---

## 4. Big-Box Retail

### Buyer
District manager / VP of Stores at 100+ location chains. Often already have an incumbent vendor (RetailNext, ShopperTrak).

### Use cases
- Department-level traffic vs sales conversion
- Loss prevention (high-shrink fixtures)
- Department staffing
- Self-checkout vs manned checkout flow

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Per-department conversion | % | Budget allocation, staffing |
| Department-level dwell heatmap | seconds/m² | Merchandise placement |
| High-shrink fixture loitering | events (>X seconds) | Loss prevention triage |
| Self-checkout vs cashier ratio | % | Future capex on machines |
| Cart abandonment near register | % | Queue length management |
| Department visit sequence | journey | Strategic placement (impulse fixtures) |
| Peak-hour staff coverage | persons-on-floor / customer | Schedule efficiency |
| Promotional area lift | visitor count delta vs baseline | Promotion ROI |

### Pricing
- $200–$500/mo per camera
- 20–50+ cameras per store
- Multi-million-dollar enterprise contracts

---

## 5. Fitness & Studios

### Buyer
Owner / GM of independent gym, boutique studio (yoga, climbing, pilates), or 10–30 location chain.

### Use cases
- Class capacity tracking
- Per-equipment utilization
- Locker room flow (privacy boundary — entry-only)
- Member engagement segmentation
- Insurance / liability capacity documentation

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Class fill rate | % (booked vs actual) | Class scheduling, instructor allocation |
| Class no-show rate | % | Cancellation policy enforcement |
| Per-equipment dwell | seconds | Equipment purchase decisions |
| Equipment availability % | uptime | When to add machines |
| Cardio vs strength segmentation | minutes per visit | Member behavior insights |
| Peak-hour density | persons/m² | Capacity planning |
| Locker room capacity | persons | Liability documentation |
| Off-peak utilization | % of capacity | Pricing experiments |
| Member visit frequency | visits/week | Retention modeling |
| Time-of-day member type | demographic | Scheduling targeted classes |

### Pricing
- $50–$199/mo per camera
- 2–4 cameras per location

---

## 6. Hotels & Hospitality

### Buyer
F&B Director, GM, or VP of Operations. Independent boutique hotels (10–60 rooms) and chains.

### Use cases
- Lobby + check-in queue management
- F&B outlet tracking (each restaurant + bar within hotel)
- Pool / gym / spa amenity capacity (insurance + experience)
- Conference / event space utilization
- Concierge / front desk wait times
- Elevator bank traffic flow

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Check-in queue wait time | seconds | Front desk staffing during peaks |
| Check-out queue wait time | seconds | Same |
| Lobby occupancy throughout day | persons | Lounge/seating capacity |
| F&B outlet occupancy by hour | persons per outlet | Cross-outlet revenue routing |
| Pool deck capacity | persons | Liability + safety alerts |
| Gym utilization (24-hr) | persons-hours | ROI on amenity investment |
| Conference room ghost-meeting rate | % booked but empty | Real conference room demand |
| Spa booking conversion | % | Cross-sell effectiveness |
| Per-elevator-bank traffic | persons/hour | Elevator capacity planning |
| Cross-property benchmark | percentile vs portfolio | Group operational ranking |

### Pricing
- $150–$400/mo per camera
- 15–40 cameras per property
- $2k–$8k MRR per hotel

---

## 7. Healthcare (Outpatient)

### Buyer
Practice manager at outpatient clinic, urgent care, dental, dermatology, or similar. 1–5 locations.

### Use cases
- Patient wait time management
- Exam room turnover and utilization
- Front-desk staffing
- Compliance / throughput reporting
- Pharmacy queue management

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Patient wait-room time | seconds (median + p90) | NPS-critical board metric |
| Check-in counter wait | seconds | Front-desk staffing |
| Exam room turnover time | seconds (patient out → next in) | Provider productivity |
| Exam room utilization | % of operating hours | Capital planning (new rooms) |
| Provider productivity | exam rooms per provider hour | Staffing model validation |
| Lab / draw queue length | persons | Lab tech allocation |
| Pharmacy fill-time | seconds | Patient experience metric |
| Cross-practice benchmark | percentile | "Your wait time vs regional average" — retention hook |

### Compliance posture
HIPAA-pre-compliant. No facial recognition, no stored video, no PHI processed. Already structurally aligned.

### Pricing
- $200–$500/mo per camera
- Higher than restaurants because compliance overhead is real engineering cost

---

## 8. Coworking & Modern Office

### Buyer
Workplace director, VP Real Estate, or coworking operator (Industrious, Convene, Mindspace).

### Use cases
- Conference room ghost-meeting detection
- Desk neighborhood utilization
- Common area amenity ROI
- RTO data for real estate decisions
- Phone booth / private call room capacity

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Conference room ghost-meeting rate | % booked but empty | **Major capital decision driver** |
| Conference room utilization by capacity | % | Right-size meeting rooms |
| Per-desk neighborhood utilization | % occupied | Floor consolidation / sublease decisions |
| Day-of-week occupancy (Tue vs Thu) | persons | RTO policy data |
| Cafe / kitchen throughput | persons/hour | Amenity ROI |
| Phone booth usage | minutes/booth/day | When to add booths |
| Lounge / collaboration utilization | persons-hours | Space programming |
| Floor traffic across the day | heatmap | HVAC zoning, lighting schedules |
| Per-amenity engagement | persons-hours | "Should we keep the wellness room" |

### Pricing
- $100–$300/mo per camera (coworking)
- $200–$500/mo (enterprise office where data drives 8-figure RE decisions)
- Annual contracts preferred at this tier

---

## 9. Stadiums & Venues

### Buyer
Operations VP at a stadium / arena or facility-management firm (ASM Global, Oak View Group).

### Use cases
- Concession queue lengths during games
- Restroom queue and capacity
- Concourse flow / bottleneck detection
- Evacuation modeling validation
- Concourse merchandising effectiveness

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Per-concession queue length | persons | Open second register / self-serve trigger |
| Per-concession throughput | persons/hour | Revenue lift correlation |
| Restroom queue distribution by inning | persons | Restroom expansion / portable additions |
| Concourse density heatmap | persons/m² | Crowd flow safety, throttling decisions |
| Section-portal arrival time | persons by minute | Pre-game traffic analysis |
| Egress flow rate | persons/min through portal | Evacuation modeling validation |
| Halftime restroom surge | persons over 15min | Capacity planning |
| VIP/club lounge occupancy | persons | Premium product utilization |

### Pricing
- $300–$1,000/mo per camera
- 100–500+ cameras per venue
- Multi-million-dollar contracts

---

## 10. Casinos

### Buyer
Director of Surveillance or Director of Operations. Regional casinos, tribal casinos, commercial casinos (Strip operators are typically owned by larger groups).

### Use cases
- Floor density tracking (regulatory + revenue)
- Per-table game activity
- VIP host coverage
- Loitering / suspicious dwell detection
- Cage / cashier queue management

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Per-pit occupancy | persons | Hot vs cold pit identification |
| Per-table game activity | minutes occupied | Table opening / closing decisions |
| Slot floor density | persons/m² | Walking-density "feel" management |
| Suspicious dwell at table game | events (>X minutes) | Advantage-play flagging |
| VIP/high-limit area utilization | persons | Host coverage |
| Cage queue length | persons | Cashier deployment |
| Player-card lounge occupancy | persons | Comp tier effectiveness |
| Cross-property benchmark | percentile | Multi-property chain optimization |

### Pricing
- $500–$2,000/mo per camera
- 50–500+ cameras per property

---

## 11. Civic / Smart City

### Buyer
Public works, planning department, transit authority, parks department, or downtown BID.

### Use cases
- Plaza / park utilization
- Transit station flow (subway, bus stops)
- Crosswalk / intersection pedestrian behavior
- Event-day flow (festivals, parades)
- Park amenity utilization

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Plaza occupancy by hour | persons | Programming, vendor placement |
| Transit platform crowding | persons/m² | Surge capacity, train scheduling |
| Fare gate throughput | persons/min | Gate count expansion |
| Crosswalk wait time | seconds | Signal timing optimization |
| Event-day vs baseline traffic | persons delta | Event impact quantification |
| Park amenity utilization | persons-hours | Maintenance budget justification |
| Time-of-day pedestrian density | heatmap | Lighting / safety improvements |
| Cross-zone movement patterns | flows | Urban planning input |

### Pricing
- $200–$1,500/mo per camera
- Civic budgets are smaller per-camera but stable
- Privacy-first architecture (no FR, no stored video) is a major civic procurement asset

---

# DEFENSE INDUSTRY (DoD)

Higher pricing, longer cycles, parallel track to commercial. Full deep-dive: [JANUS-DEFENSE-VERTICAL.md](JANUS-DEFENSE-VERTICAL.md). KPIs by service branch below.

## 12. Defense — Air Force

### Buyer
Squadron commander, MX group commander, AFWERX (SBIR), AFRL.

### Use cases
- Flightline / hangar operations
- Base perimeter force protection
- HQ / SCIF entry audit
- Munitions / weapons-storage area monitoring

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Personnel-in-exclusion-zone alerts | binary + time | Real-time safety intervention (engine intake, prop arc) |
| Aircraft turn time per bay | minutes | MX productivity metric |
| GSE dwell at aircraft | seconds per piece | Ground-handling efficiency |
| Per-tail-number maintenance window | minutes | Mission readiness reporting |
| Hangar entry/exit by time-of-day | persons/hour | Shift transition coverage |
| Cross-hangar comparison | minutes per turn | Best-practice identification |
| Vehicle gate throughput | vehicles/hour | Gate staffing |
| Pedestrian gate inspection time | seconds | Anomaly detection (long inspection = potential issue) |
| Visitor center queue depth | persons | SF (Security Forces) deployment |
| SCIF entry audit log | entries/exits per hour | Compliance documentation (no PII) |
| Munitions storage approach | persons by zone | Two-person rule compliance flagging |

### Pricing
- $1,000–$3,000/mo per camera
- Single-base contract value: $1M–$10M annually

---

## 13. Defense — Army

### Buyer
Range Operations, Training Center commands, Garrison Commander, xTech Search.

### Use cases
- Range control (live-fire safety + training pace)
- Motor pool / logistics yard operations
- Barracks common areas (force protection)
- Cantonment area pedestrian flow

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Downrange personnel during live-fire | binary alert | **Immediate safety stop** |
| Firing line shooter count | persons | Range capacity utilization |
| Range-day throughput | shooters/hour | Training pace optimization |
| Cross-range benchmark | shooters/hour by similar range type | Best-practice identification |
| Motor pool vehicle dwell | minutes per maintenance bay | Maintenance throughput |
| Yard turn rate | vehicle-cycles/day | Logistics readiness |
| Fuel point throughput | vehicles/hour | Fuel point capacity |
| Barracks common area dwell anomalies | events outside historical bounds | Force protection trigger |
| Day room utilization | persons-hours | Quality-of-life programming |
| Mail room queue | persons | Service hours adjustment |

### Pricing
- $500–$2,000/mo per camera
- Range complex contract: $500k–$5M annually

---

## 14. Defense — Navy

### Buyer
Pier-side operations, Quarterdeck OOD, Type Commander, NavalX.

### Use cases
- Pier / waterfront operations
- Quarterdeck / ship entry audit
- Aircraft carrier flight deck (long-term, high-stakes)
- Submarine basin operations

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| Brow throughput (boarding rate) | persons/hour | Embarkation efficiency |
| ID check zone dwell | seconds per person | Anomaly detection |
| Quarterdeck OOD coverage | minutes covered/total minutes | Watch standard compliance |
| Pier patrol coverage | minutes covered per zone | Sentry compliance |
| Visitor escort tracking | paired tracks | Two-person rule on visitors |
| Crane operating zone clearance | binary alert during lifts | Safety intervention |
| Provisioning loading throughput | persons-trips/hour | Logistics readiness |
| Pier vehicle dwell | minutes | Throughput |
| Flight deck personnel safe-zone violations | events | Safety / FOD prevention |
| Catapult / arresting gear exclusion | binary alert | Safety intervention |

### Pricing
- $500–$3,000/mo per camera
- Per-pier or per-ship contract: $500k–$2M annually

---

## 15. Defense — Marines / SOF

### Buyer
USMC operational units, USSOCOM, MARSOC, JSOC.

### Use cases
- Embarkation / combat loading
- MOUT / kill house training facilities
- Forward Operating Sites (FOS) compound monitoring
- Range complexes

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| **Kill house room time per fireteam** | seconds per room | Training quality, AAR debrief |
| **Movement pattern across kill house** | sequence of zone entries | Tactical pattern analysis |
| **Per-team performance trend** | over multiple iterations | Team development tracking |
| **MOUT exercise pacing** | room-clearings/hour | Training intensity calibration |
| Embarkation throughput | persons + equipment-pieces/hour | Operational readiness |
| Combat-loading time | minutes | Mission cycle time |
| FOS compound entry/exit | persons by gate | Force protection |
| FOS perimeter sector activity | events per sector per hour | Threat-intel context |
| Range complex utilization | shooter-hours/day | Training capacity |

**The kill house / MOUT AAR application is the highest-value defense use of Janus.** Special operations training currently relies on body cams + trainer observation. Janus provides ground-truth quantitative data on movement patterns, time-in-room, and team performance — converting an art-form debrief into a data product.

### Pricing
- $1,000–$5,000/mo per camera (high due to mission criticality)
- Single training facility contract: $250k–$2M annually

---

# ADJACENT INDUSTRIES — PMC AND SECURITY

## 16. Private Military Contractors (PMC)

### Buyer
Constellis (formerly Triple Canopy + others), GardaWorld Federal Services, Aegis (now GardaWorld), DynCorp (now Amentum), Olive Group, MPRI, smaller boutique firms in the global protective services space.

### Why this is different from defense
PMC contracts are commercial entities executing security missions on government contracts (or on commercial contracts in conflict zones). They're cost-plus or fixed-price firms — every minute of personnel time is a cost line. KPI-driven analytics directly improve their margins on existing contracts and help them win bids by demonstrating quantitative readiness.

### Use cases
- **Diplomatic protection details (DSS contracts):** embassy / consulate / ambassador residence security
- **Compound security at remote sites:** oil/gas, mining, port facilities in Iraq, Libya, Nigeria, Mali, etc.
- **Convoy and route protection:** vehicle staging, briefing, departure, hand-off
- **Maritime anti-piracy:** vessel protection details aboard commercial ships
- **Critical infrastructure protection:** pipelines, power plants, telecom infrastructure under contract
- **Training facility analytics:** in-house ranges and shoot houses for operator certification
- **Quick reaction force (QRF) readiness:** response time at compound entry events
- **Personnel accountability at remote sites:** who is on station, who is off, who is in the wire

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| **Personnel-on-station per shift** | head count by zone, by shift | Contract billing accuracy + audit defense |
| **Shift handoff coverage gap** | minutes of zero overlap | Compliance with contract SLA |
| **Compound entry event response time** | seconds (gate trigger → guard at gate) | QRF readiness metric (often a contract OKR) |
| **Perimeter integrity events** | breaches/24hr per sector | Threat-intel feed for client briefings |
| **Convoy assembly time** | minutes (pre-stage to roll) | Training readiness, mission cycle time |
| **VIP movement timing** | seconds (residence egress to vehicle, vehicle to destination) | Protective detail efficiency |
| **Personnel rotation compliance** | minutes between rotations at high-stress posts | Fatigue/safety management |
| **Operator training time per certification** | hours per quarter, per operator | Certification compliance for contract requirements |
| **Range/shoothouse utilization** | hours/day | Training capacity, certification throughput |
| **Threat zone dwell anomalies** | events (>X minutes in restricted zone) | Investigation triggers |
| **Cross-site benchmark** | KPI comparison across multiple compound contracts | Bid pricing and contract performance reporting |
| **Aircraft / helicopter LZ activity** | landings/takeoffs per day | Operational tempo documentation |

### Why this is a strong fit
- **Documentation defense.** PMC contracts get audited heavily. Quantitative data on personnel placement, response times, and coverage is gold for both contract retention and dispute resolution.
- **No facial recognition is a feature.** PMC operators are often working under hostile-intelligence threat — anything that creates identifiable records of operator placement is a security liability. Janus's anonymous-track architecture aligns perfectly.
- **Edge-deployable matters.** Remote sites (Mali, Iraq, deep maritime) often have no reliable internet. Edge-only deployment is non-negotiable.
- **Cross-site benchmarking is contract gold.** Demonstrating "we hit 95th percentile QRF response time across all our compound contracts" wins bids.
- **Contract-line-item alignment.** PMC contracts have explicit line items for "X personnel on station for Y hours per day." Janus produces the audit trail for that exact billing.

### Pricing
- **$1,000–$4,000/mo per camera** at the operator side
- Per-compound contract value: $250k–$3M annually
- Multi-compound enterprise deals: $5M–$50M+

### Sales motion
- Direct enterprise sales to PMC corporate (Constellis, GardaWorld, Amentum)
- Partnership with primes that subcontract PMCs (Lockheed, Booz Allen)
- Trade show: ISC West, Future Forces Forum (UK), defense procurement conferences

---

## 17. Security Industry (Private Security)

### Buyer
Allied Universal, Securitas, GardaWorld, Brinks, Pinkerton (corporate division), in-house corporate security teams, residential/condominium HOAs, event security firms, airport security contractors.

### Why this is its own segment
Private security overlaps with PMC at the edges but is structurally different: civilian environment, lower threat profile, much higher volume. The TAM here is $40B+ in the US alone. Buyers are commercial firms protecting commercial properties — different compliance posture, different contract structure, different sales cycle.

### Use cases
- **Corporate security:** lobby, executive floors, server rooms, after-hours building access
- **Residential security:** high-net-worth residences, gated communities, condo/co-op buildings
- **Event security:** concerts, conferences, sporting events (auxiliary, not primary venue)
- **Retail loss prevention:** high-shrink categories (jewelry, electronics, baby formula, cosmetics)
- **Transit security:** airport TSA-adjacent zones, train/bus stations, transit operations centers
- **Bank / financial branch security:** vault access, branch lobby, cash-in-transit staging
- **Cannabis dispensary security:** mandated by regulation in many states, high-cash environment
- **Industrial / warehouse security:** loading docks, perimeters, parking lots
- **Executive protection (EP):** residence, vehicle pre-stage areas, route protection
- **Casino surveillance:** floor density, table-game integrity (overlaps with commercial #10)

### Specific KPIs

| KPI | Unit | Decision it informs |
|---|---|---|
| **Guard tour compliance** | % of scheduled posts covered for required hours | Audit-defensible billing + contract retention |
| **Post coverage gap** | minutes of zero presence at required post | Compliance violation flag |
| **Alarm response time** | seconds (alarm → guard at scene) | SLA reporting |
| **Tailgating detection at access-controlled door** | events per day | Door integrity, badge enforcement |
| **Loitering events outside business hours** | events per night | After-hours threat detection |
| **Perimeter breach attempts** | events per sector per night | Threat intel for clients |
| **Visitor vs employee identification (anonymous)** | persons by behavior pattern (no FR) | Visitor management workflow |
| **Lobby occupancy after hours** | persons | Security posture validation |
| **Vault access window compliance** | binary (was someone in vault during audited window) | Bank regulator reporting |
| **Crowd density at events** | persons/m² | Capacity / safety thresholds |
| **Queue length at airport security** | persons + seconds | TSA wait time SLA |
| **Loss-prevention high-shrink fixture loitering** | events (>X seconds dwell) | Investigation triggers |
| **Cash-in-transit staging duration** | minutes from pickup to depart | Anomaly flags (lingering = potential threat) |
| **EP residence perimeter activity** | events outside expected pattern | Pre-incident threat indication |
| **Cross-property benchmark** | KPI comparison across portfolio | Account expansion within enterprise client |

### Why Janus wins this market
- **Allied Universal / Securitas pay guards by the hour and bill clients by the post-hour.** Every minute of unverified coverage is exposure. Janus turns "guard tour log" from paper-clipboard to ground-truth data.
- **No FR removes the customer's privacy compliance burden.** Corporate clients hate facial recognition because of employee privacy lawsuits. Janus's architecture removes the conversation entirely.
- **Volume-friendly SaaS pricing.** Security firms operate on thin margins — $99–$299/mo per camera is the sweet spot. Multi-property deployments compound fast.
- **Insurance / litigation defense.** Quantitative coverage data is a defense in slip-and-fall, premises liability, and inadequate-security lawsuits. The commercial value of a documented security record is enormous.

### Specific sub-vertical KPIs

#### 17a. Corporate Security
- After-hours occupancy by floor
- Server room access frequency
- Executive floor visitor escort compliance
- Lobby tailgating events

#### 17b. Residential / HOA
- Visitor entry by gate
- Pool / amenity capacity (insurance)
- Common area loitering events
- Resident vs visitor pattern segmentation

#### 17c. Event Security
- Crowd density by section (real-time)
- Egress flow at end-of-event
- Vendor/staff zone compliance
- Restricted area integrity (backstage, VIP)

#### 17d. Retail Loss Prevention
- Per-fixture loitering events
- Cashier-area integrity (suspicious patterns)
- Loading dock activity (after-hours)
- Stockroom access frequency

#### 17e. Transit Security
- Platform crowding (safety threshold)
- Egress chokepoint flow
- Restricted area compliance (operations rooms)
- Customer service line wait time

#### 17f. Bank / Financial
- Vault access dwell time
- Branch lobby capacity
- ATM lobby loitering
- Cash-handling area integrity

#### 17g. Cannabis Dispensary
- Display case dwell (regulatory + theft)
- Limited-access area integrity
- Cash drawer area dwell
- Customer queue + dwell (state-mandated tracking)

#### 17h. Industrial / Warehouse
- Loading dock activity by shift
- Parking lot security (loitering, vehicle dwell)
- Restricted area entries
- Per-aisle pedestrian traffic

### Pricing
- **$99–$499/mo per camera** (most security applications)
- Higher tier ($499–$1,500) for sensitive sites (vault, server room, EP residence)
- Multi-property enterprise contracts: $50k–$5M annual

### Sales motion
- Direct enterprise sales to security firm corporate (Allied Universal, Securitas)
- Partnership with security technology integrators (Convergint, ADT Commercial)
- Vertical sub-segment sales (cannabis, banking, residential HOA)
- ISC West (Las Vegas) is the premier industry event

### Why this is the largest single Janus TAM
The US private security industry is **$45B+ annually**, with ~1.1 million security guards. If Janus reaches 1% of the cameras these firms operate against, that's a 9-figure ARR business. **Security is potentially the single largest commercial vertical for Janus.** It's been listed as Phase 4 only because it requires reference customers from Phase 1-3 to enter at scale.

---

# CROSS-CUTTING OBSERVATIONS

## What every industry shares
- World-space zone abstraction (the moat)
- Privacy-first architecture (no FR, no stored video)
- The Define / Orient / Anchor / Commit interaction model
- Cross-venue / cross-installation benchmarking as the retention layer
- Edge-deployable (no cloud dependency for sensitive deployments)

## What scales differently per industry
- **Compliance posture** — none (hospitality) → HIPAA (healthcare) → SOC 2 (corporate security) → CMMC 2.0 (defense)
- **Sales cycle** — 2 weeks (independent restaurant) → 2 months (mid-market) → 18 months (enterprise) → 24+ months (DoD program of record)
- **Pricing** — $79/mo (Tier 1 retail) → $5,000/mo (sensitive defense / EP residence)
- **Buyer profile** — owner-operator → ops director → VP → program manager → contracting officer

## Total addressable market summary

| Vertical | Estimated US TAM (ACV × establishments) |
|---|---|
| Independent restaurants & bars | ~$1.2B |
| QSR | ~$7.5B |
| Independent retail | ~$3B |
| Big-box retail | ~$5B |
| Healthcare outpatient | ~$1.25B |
| Coworking + enterprise office | ~$2B |
| Stadiums & arenas | ~$0.75B |
| Hotels | ~$1.65B |
| Casinos | ~$0.5B |
| Civic / smart city | ~$3B |
| Defense (DoD addressable) | ~$5B |
| **PMC industry** | ~$2B |
| **Private security industry** | **~$15B+** |
| **Total US TAM** | **~$50B+** |

## Vertical sequencing recap
1. **Phase 1 (Beachhead, 0–12 months):** Independent restaurants & bars (SF + NYC), integrated with ForkFox
2. **Phase 2 (12–24 months):** QSR chains, boutique retail, hospitality groups
3. **Phase 3 (18–30 months):** Hotels, fitness, coworking
4. **Phase 4 (24–36 months):** Big-box retail, healthcare, stadiums, **private security firms**
5. **Phase 5 (30–48 months):** Casinos, civic / smart city
6. **Parallel track (begin month 0):** Defense (SBIR / DIU), **PMC enterprise contracts**

PMC and Security industry deserve dedicated attention because:
- They are the **largest single TAM** outside hospitality (~$17B combined)
- They have **high willingness to pay** ($499–$5,000/mo per camera)
- They are **structurally aligned** with Janus's privacy-first + edge-deployable + world-space architecture
- They have **explicit contract-line-item KPIs** that map directly to Janus output

## Reference

- Existing strategy: [JANUS-USE-CASES.md](JANUS-USE-CASES.md)
- Defense deep-dive: [JANUS-DEFENSE-VERTICAL.md](JANUS-DEFENSE-VERTICAL.md)
- Data moat: [JANUS-DATA-MOAT.md](JANUS-DATA-MOAT.md)
- Vertical playbooks: [JANUS-VERTICAL-PLAYBOOKS.md](JANUS-VERTICAL-PLAYBOOKS.md)
- ForkFox business integration: [../../forkfox-business-platform/specs/JANUS-CAPABILITY-REFERENCE.md](../../forkfox-business-platform/specs/JANUS-CAPABILITY-REFERENCE.md)
- Platform thesis: [../../moonlight-deploy/strategy/MOONLIGHT-ANALYTICA-PLATFORM.md](../../moonlight-deploy/strategy/MOONLIGHT-ANALYTICA-PLATFORM.md)
