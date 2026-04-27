# Janus Defense Vertical — Strategic Analysis & Entry Plan

**Status:** Official strategy documentation
**Locked:** 2026-04-27
**Predecessor docs:** [JANUS-DATA-MOAT.md](JANUS-DATA-MOAT.md), [JANUS-USE-CASES.md](JANUS-USE-CASES.md)
**Classification:** Unclassified internal strategy — written for commercial-side planning. Any actual DoD-facing material requires separate handling under appropriate ITAR/EAR review.

## Executive summary

Defense is the highest willingness-to-pay vertical Janus can credibly enter. Three architectural decisions Janus has already made align with DoD procurement reality in ways most CV competitors do not:

1. **No facial recognition.** DoD has been moving away from FR-equipped surveillance for both compliance and political reasons. Many CV vendors have FR baked into their core. Janus does not. This removes the single most common DoD-procurement objection to commercial CV systems.
2. **Privacy-first / no-video-storage.** Counts and metadata only. Aligns with operational security (OPSEC) requirements where stored video creates classified-material handling burdens.
3. **World-space zones with normalized cross-installation analytics.** This is structurally what DoD wants — they think in physical sectors (force protection zones, perimeters, hangars, ranges), not pixels. Janus's data model maps 1:1 onto how DoD planners describe physical space.

This document covers the buyer landscape, contracting paths, specific use cases by service branch, compliance posture, technical gaps, and a 24-month roadmap to a first DoD pilot.

**Recommendation:** Defense should run as a parallel track to the commercial beachhead, not after it. The sales cycle is too long to defer. Initiating the SBIR / contracting groundwork in parallel with the Philly hospitality beachhead means by the time the commercial business is at $1M ARR, defense pilots are entering award stage.

---

## Why defense is a fit

### The architectural alignment

| What DoD wants | What Janus has | Why this matters |
|---|---|---|
| No facial recognition / biometric ID | Architecturally absent — never built | Removes major procurement blocker; aligns with EO 14110 and DoD AI ethics directives |
| Physical-space-anchored analytics | World-space zone model | DoD operates in physical sectors (perimeters, hangar floors, gates) — pixel-space CV doesn't fit |
| Cross-installation standardized data | Normalized world-coordinate event log | DoD wants comparable metrics across bases / installations / commands |
| Privacy-defensible for cleared personnel | No video storage, anonymous track IDs | Reduces classified-data handling burden and PII risk |
| Edge-deployable (no cloud dependency for sensitive sites) | Edge agent runs locally; cloud sync optional | Required for SCIF, classified network (NIPRNet/SIPRNet) and remote-installation operation |
| Auditability of zone definitions | Zones are explicit, owner-validated, version-controlled | Required for any AI/CV system in DoD use under JAIC / DCDAO oversight |

### The pricing power

| Layer | Commercial $/cam/mo | Defense $/cam/mo | Multiplier |
|---|---|---|---|
| Independent hospitality | $50–$200 | — | — |
| QSR / mid-market enterprise | $100–$300 | — | — |
| Big-box retail enterprise | $200–$500 | — | — |
| Healthcare | $200–$500 | — | — |
| **Force protection / base operations** | — | **$500–$2,000** | 2–4× retail |
| **Operational installations (hangars, ranges)** | — | **$1,000–$3,000** | 4–6× retail |
| **Sensitive sites (SCIF, ammo, nuclear, command)** | — | **$2,000–$5,000+** | 8–10× retail |

Defense pricing is justified by:
- Compliance overhead (ATO, CMMC, etc.) — real engineering cost passed through
- Higher reliability requirements (24/7/365, hardened uptime)
- Specialized integration (SIPR, JWICS, CCTV systems, security force C2)
- Mission criticality (a base perimeter outage during an actual incident is unacceptable)

A single Air Force base contract: $1M–$10M annual contract value. A program-of-record win across multiple installations: $50M–$500M+ over 5–10 years.

---

## Buyer landscape

DoD is not one buyer. It is hundreds of buyers across multiple chains of command, each with different procurement authorities and budgets.

### Tier 1 buyers (start here)

| Buyer | Authority | Budget | Cycle |
|---|---|---|---|
| **AFWERX (Air Force)** | SBIR / STTR awards | $50k Phase I, $1M Phase II, up to $50M Phase III | 6–18 months from proposal to first contract |
| **Army xTechSearch / Applied SBIR** | SBIR + xTech awards | Similar to AFWERX, with Army-specific Phase III paths | 6–18 months |
| **Navy NavalX / SBIR** | SBIR + OTAs (Other Transaction Authorities) | $1M–$5M typical OTA | 6–12 months |
| **Defense Innovation Unit (DIU)** | OT-prototyping authority | Direct DoD-wide deals, $1M–$25M | 4–9 months — fastest path |
| **AFRL (Air Force Research Lab)** | Direct contracts via SBIR / BAA | $250k–$10M | 6–18 months |

### Tier 2 buyers (expand into after first pilot)

| Buyer | Authority | Notes |
|---|---|---|
| Installation / Garrison Commanders | Installation-level O&M budgets | Local procurement, smaller contracts ($100k–$1M), faster decisions |
| Service-branch HQ logistics commands | Multi-installation contracts | Large but slow |
| US Special Operations Command (USSOCOM) | High autonomy, direct contracts | Excellent fit for Janus mission profile (small footprint, rapid deployment) |
| Intelligence Community (IC) | Various | Higher classification requirements; pursue only with cleared advisor |

### Tier 3 buyers (long-term TAM)

| Buyer | Authority |
|---|---|
| Federal civilian (DHS, TSA, GSA, VA hospitals) | Adjacent vertical, similar procurement |
| State / National Guard | Lower classification, faster cycles |
| NATO partners (UK MOD, Australian DoD, etc.) | Foreign Military Sales (FMS) post-ITAR review |

### Decision-makers within each buyer

A typical DoD procurement involves:
- **Program manager (PM)** — owns the contract and the technical evaluation
- **Contracting officer (KO)** — the legal authority to bind the government
- **End user** — the security force commander, base CO, hangar chief, etc.
- **Authority to Operate (ATO) authority** — typically the installation's CIO or CISO
- **Privacy Officer** — increasingly mandatory for AI/CV systems
- **JAIC / Chief Digital and AI Office (CDAO)** — provides AI ethics review for projects above a threshold

A successful sale requires the end-user to want it, the PM to fund it, the KO to find a contracting vehicle, and the ATO authority to bless the deployment. Roughly 4–6 distinct stakeholders per base.

---

## Contracting paths

### Path 1: SBIR / STTR (recommended starting point)
**Why:** No prior DoD relationship needed. Funded R&D to prove out the product against a specific DoD problem statement. Phase II awards ($1M) often convert to Phase III sole-source contracts ($10M–$50M+).

**Timeline:**
- Watch SBIR.gov for relevant topics (typically 4 cycles/year)
- AFWERX has the fastest cycles: ~3 months from open to award
- Phase I is typically 6 months ($75k–$200k) to prove concept
- Phase II is 24 months ($1M–$2M) to develop production capability
- Phase III is sole-source unlimited DoD-wide

**Topic alignment for Janus:** force protection, base security, autonomous monitoring, anti-intrusion, crowd management for events, hangar/flightline operations, contested-environment situational awareness.

**Action:** Subscribe to AFWERX, Army Applied SBIR, Navy SBIR, and DIU topic releases. Build a 1-page problem-statement-to-Janus-capability matrix and update each cycle.

### Path 2: Direct OTA (Other Transaction Authority) via DIU
**Why:** Faster than FAR-based contracting. DIU is the DoD's commercial-tech portal — exists explicitly to onboard companies like Janus.

**Timeline:** 4–9 months from Commercial Solutions Opening (CSO) response to first prototype contract.

**Action:** Monitor DIU CSOs for relevant topics. Prepare a 5-page commercial brief on Janus that can be tailored per CSO.

### Path 3: GSA Schedule + Direct Sale to Bases
**Why:** Once a few bases want Janus, having a GSA schedule lets installation-level KOs purchase without re-competing the contract.

**Timeline:** 12+ months to obtain GSA schedule. Worth doing in parallel with Paths 1 and 2.

### Path 4: Subcontract to a Prime
**Why:** Lockheed, Northrop, Raytheon, Booz Allen, Leidos, etc. hold massive DoD contracts and are constantly looking for commercial AI/CV components. Subcontracting through them is the fastest path to scaled deployment but compresses margin.

**When:** After SBIR Phase II / DIU prototype, when you have a deployable product and need scale.

### Path 5: Avoid (for now)
- **FAR Part 15 negotiated procurements** — too slow, too bureaucratic for a startup
- **GSA without a prime relationship** — schedules don't sell themselves
- **Direct sole-source pursuit** — only viable post-Phase III

---

## Specific use cases by service branch

### Air Force

#### Use case A1 — Flightline / Hangar Operations
**Problem:** Airframe maintenance involves dozens of personnel, ground support equipment (GSE), and aircraft moving across hangar floors. Currently tracked by paper logs and verbal coordination. Errors lead to FOD (foreign object damage), GSE collisions, and personnel safety incidents.

**Janus zones:**
- Aircraft parking spots (per-tail-number zones)
- GSE staging areas
- Personnel safe zones / exclusion zones around running engines
- Hangar entry/exit zones
- Tool crib / supply zones

**Metrics:**
- Personnel-in-exclusion-zone alerts (immediate)
- GSE dwell at maintenance points
- Aircraft turn time
- Cross-hangar comparisons (which hangar turns fastest)

**Buyer:** Squadron commander, MX group commander, AFRL.

#### Use case A2 — Base Perimeter Force Protection
**Problem:** Vehicle and pedestrian gates at every base. Currently monitored by SF (Security Forces) personnel watching CCTV. Janus can flag dwell anomalies, queue lengths, and provide audit trails.

**Janus zones:**
- Vehicle inspection zones (inbound + outbound)
- Pedestrian gate zones
- Visitor center queue zones
- Perimeter sectors (for fence-line monitoring with wide-angle cameras)

**Metrics:**
- Gate throughput (vehicles/hour, pedestrians/hour)
- Inspection dwell time per vehicle (anomaly detection)
- Queue length at peak times
- Cross-base benchmark for similar gates

**Buyer:** SF squadron, AFOSI, installation CO.

#### Use case A3 — Headquarters / SCIF Entry Audit
**Problem:** Need to audit who is entering / leaving headquarters and SCIFs without storing identifiable data. Janus does this with anonymous counts and zone events.

**Janus zones:**
- SCIF entry vestibules
- HQ lobby + check-in
- Classified work area entry zones (capacity audit, NOT identification)
- Visitor escort tracking via dwell pattern (visitor with escort = always-paired tracks)

### Army

#### Use case B1 — Range Control
**Problem:** Ranges have safety zones, firing positions, observation areas. Tracking who is where during live-fire exercises is currently manual.

**Janus zones:**
- Firing line (per shooter)
- Down-range exclusion zones (must be empty during live fire)
- OP/RSO positions
- Vehicle staging / ammunition handling areas

**Metrics:**
- Real-time exclusion-zone clearance verification
- Range-day throughput (shooters/hour)
- Cross-range benchmark for training pace

**Buyer:** Range Operations, Training Center commands.

#### Use case B2 — Motor Pool / Logistics Yard
**Problem:** Vehicle and equipment movement through motor pools needs tracking for accountability and operational tempo measurement.

**Janus zones:**
- Vehicle parking spots (per-bumper-number zone)
- Maintenance bay zones
- Fuel point zones
- POV / personal-vehicle staging

**Metrics:**
- Vehicle dwell at maintenance points
- Yard turn rate
- Fuel point throughput

#### Use case B3 — Barracks Common Areas (Force Protection)
**Problem:** Common-area dwell anomalies can indicate force-protection issues. Janus monitors common areas without identifying individuals.

**Janus zones:**
- Day room
- Mail room
- CQ / front desk
- Hallway monitoring (loitering detection)

### Navy

#### Use case N1 — Pier / Waterfront Operations
**Problem:** Personnel and equipment movement across piers during ship operations is dynamic and high-stakes.

**Janus zones:**
- Per-berth pier zones
- Brow / gangway zones (capacity for safety)
- Crane operating zones (exclusion during lifts)
- Provisioning loading areas

#### Use case N2 — Quarterdeck / Ship Entry
**Problem:** All ship entries/exits go through the quarterdeck. Currently logged on paper by the Officer of the Deck (OOD).

**Janus zones:**
- Quarterdeck queue
- ID check zone
- Brow approach

**Metrics:**
- Throughput by hour
- Queue length anomalies
- Audit log for all transitions

#### Use case N3 — Aircraft Carrier Flight Deck (long-term, high-difficulty)
**Problem:** Carrier flight deck is one of the most dangerous workplaces in the world. Wandering into a jet blast or rotating prop kills.

**Janus zones:**
- Each aircraft parking spot
- Catapult / arresting gear exclusion zones
- Flight deck personnel safe zones (color-coded by jersey color)
- Hangar deck zones below

**This is a long-term target, post-pilot. Cited because it represents the upper ceiling of where Janus's value proposition becomes dramatic — preventing fatalities.**

### Marines

#### Use case M1 — Embarkation / Combat Loading
**Problem:** Marines and equipment loading onto ships, aircraft, vehicles in time-pressured ops requires throughput tracking.

#### Use case M2 — MOUT (Military Operations on Urbanized Terrain) Training Sites
**Problem:** Training site activity tracking, exercise pacing, cross-site benchmarking.

### Special Operations (USSOCOM)

#### Use case S1 — Forward Operating Site (FOS) Compound Monitoring
**Problem:** Small-footprint sites need autonomous monitoring with minimal personnel. Janus's edge-deployable, low-bandwidth model fits.

#### Use case S2 — Urban Training (Kill Houses, MOUT)
**Problem:** AAR (after-action review) tracking of personnel movement during room-clearing exercises. Currently relies on body-cams and trainer observation.

**Janus zones:**
- Each room of the kill house (per-room zones)
- Hallways
- Entry/exit points

**Metrics:**
- Time-in-room per fireteam
- Movement pattern across exercises
- Cross-team performance benchmarking

**This is potentially Janus's most valuable defense application** — kill-house / MOUT AAR is currently a major pain point in special operations training, and the customer (TIER-1 / TIER-2 SOF units) has high willingness to pay for analytics that improve training quality.

---

## Compliance posture

### What Janus already satisfies architecturally

| Requirement | Status | Notes |
|---|---|---|
| No facial recognition | ✅ | Architecturally absent. Cannot be added without major rebuild — this is a strength. |
| No biometric identifiers | ✅ | Track IDs are session-anonymous integers |
| No video storage | ✅ | Counts + metadata only. Frames discarded after detection. |
| Edge-deployable (no cloud dependency) | ✅ | Edge agent runs locally; backend can run on local network only |
| Anonymous track IDs | ✅ | No PII collection |

### What Janus needs to add for DoD pilots

| Requirement | Gap | Effort to close |
|---|---|---|
| **CMMC 2.0 Level 2 (cybersecurity)** | Need: SSP (System Security Plan), POA&M, NIST 800-171 controls implemented | 6–12 months, ~$50k–$200k in compliance work |
| **Authority to Operate (ATO)** | Per-installation document. Each base requires its own ATO. | 3–6 months per ATO; reusable templates after first |
| **AI ethics / CDAO review** | Need documented AI ethics posture, bias testing, transparency | 1–3 months; mostly documentation |
| **Section 508 accessibility** | UI must meet federal accessibility standards | 1–2 months |
| **FedRAMP (if cloud component used)** | If any cloud sync is offered, need FedRAMP Moderate at minimum | 6–18 months, ~$500k+; **avoid by deploying edge-only initially** |
| **ITAR / EAR review of any export-restricted features** | None currently, but flag if any defense-specific features are added | Ongoing legal review |
| **Supply chain risk management (SCRM)** | Verify all dependencies (RF-DETR, ByteTrack, etc.) are not on prohibited-vendor lists | 1 month audit; ongoing |

### What Janus should NOT add (would compromise the moat)

- ❌ Facial recognition (even as a "if customer wants it" feature) — destroys procurement positioning across DoD
- ❌ Stored video — destroys procurement positioning, increases ATO burden
- ❌ Cloud-only deployment — locks out classified-network installations
- ❌ Foreign-vendor dependencies — supply chain risk

---

## Technical gaps to close before first DoD pilot

| Gap | Why it matters | Estimated effort |
|---|---|---|
| Edge-only deployment package | Required for SCIF / classified network | 2–3 months |
| RTSP / ONVIF camera support | DoD uses standard CCTV cameras, not webcams | 1 month |
| Multi-camera fusion | Bases have hundreds of cameras feeding one operations center | 3–6 months |
| Hardened uptime (no flask debug, supervised processes, watchdog) | Already in roadmap (Sprint 5 partial); finish | 1 month |
| Audit log of every zone change | Required for ATO and accountability | 1 month |
| Role-based access control | Required for any DoD UI | 1–2 months |
| Encryption at rest + in transit (FIPS 140-2 validated) | CMMC requirement | 1 month |
| Air-gap-friendly model updates | Bases without internet need offline model packages | 1–2 months |
| Per-installation tenancy isolation | One Janus deployment per base, no cross-installation data leak | Architectural — already aligned |

**Total estimated effort to be DoD-pilot-ready: 12–18 months of focused engineering.** This can run in parallel with the commercial beachhead.

---

## 24-month roadmap to first DoD pilot

### Months 0–6: Foundation
- ✅ Lock the world-space zone model (DONE 2026-04-27)
- Continue commercial beachhead (Philly hospitality)
- Begin reading SBIR / DIU topic releases monthly
- Identify a defense-cleared advisor (retired O-5/O-6 or former DoD PM) — equity advisor relationship
- File for CAGE code, register on SAM.gov, begin GSA schedule application
- Start CMMC 2.0 Level 1 self-attestation, plan Level 2 path

### Months 6–12: First proposal
- Submit first SBIR Phase I proposal (AFWERX, Army Applied SBIR, or Navy SBIR — pick best topic match)
- Begin DIU CSO monitoring; respond to one CSO with a 5-page brief
- Build a defense-specific demo (perimeter / hangar / kill house — pick one based on advisor input)
- Begin CMMC 2.0 Level 2 SSP
- File for DIU "Trusted Capital Marketplace" inclusion if relevant

### Months 12–18: First award and pilot
- SBIR Phase I awarded (~$200k)
- Begin DoD-relevant technical work funded by Phase I
- Submit Phase II proposal at Phase I milestone
- Pursue parallel pilot via DIU OTA if a CSO match emerges

### Months 18–24: Phase II and second contract
- Phase II awarded (~$1M, 24 months)
- Begin first deployed pilot at a single installation
- Use deployed pilot data (operations metrics, not classified) as case study for additional bases
- Begin GSA schedule award process for direct base sales

### Year 2+: Scale and program of record
- Multi-base deployment via GSA + Phase III sole source
- Subcontract opportunities with primes (Lockheed, Booz Allen, Leidos)
- Expand to second service branch

---

## Risks and how to mitigate

| Risk | Severity | Mitigation |
|---|---|---|
| **CMMC 2.0 cost overrun** | High | Budget $200k+; do not enter DoD without it. Use a CMMC-RPO (Registered Practitioner Org) early. |
| **Sales cycle longer than expected** | High | Run defense as parallel track to commercial; do not depend on it for cash flow. |
| **A prime contractor copies the architecture** | Medium | The data layer moat (cross-installation normalized data) cannot be copied without onboarded customers. Get to first pilot before primes notice. |
| **Procurement preference for incumbent vendors** | High | SBIR + DIU bypass FAR procurement preferences. Stay on these paths. |
| **Foreign ownership / control / influence (FOCI) issues** | Medium | Maintain US ownership and operations. Document supply chain. |
| **Founder lacks security clearance** | Medium | Hire a cleared engineering lead before Phase II. Janus advisor network can provide referrals. |
| **Architectural drift toward features that disqualify (FR, cloud-only, etc.)** | High | The JANUS-ZONE-MODEL.md and JANUS-DATA-MOAT.md docs are the protection here — every PM and roadmap decision is gated against them. |

---

## Strategic implication: defense changes the company narrative

If Janus enters defense successfully, the company's story to investors changes:

**Without defense:** "Vertical SaaS for hospitality and retail, $25B TAM, defensible via cross-venue data."

**With defense:** "Physical-space analytics infrastructure used across hospitality, retail, healthcare, **and defense**. Architectural choices (no FR, no video storage, edge-deployable, world-space zones) make us the only AI surveillance product positioned for both consumer-grade venues and DoD installations. Defense alone is a $5B addressable market with 10× pricing power vs commercial verticals."

This narrative supports:
- Higher Series A valuation (defense exposure is a multiple expander)
- Different investor pool (defense-specialist VCs: Founders Fund, Lux, A* Capital, Lockheed Ventures, ShieldCapital)
- Better strategic acquirer pool (Anduril, Palantir, Booz Allen, Lockheed, Leidos)
- Reduced reliance on hospitality unit economics (which are mid-tier SaaS at best)

Defense exposure also stabilizes the business through hospitality cycle downturns. Restaurants close in recessions; bases do not.

---

## What I (the strategy author) recommend Ali do next

1. **Approve this strategy doc and the data-moat doc as official.** They become the documents that gate every roadmap decision going forward.
2. **Begin defense groundwork now — in parallel with the Philly beachhead, not after.** Specific actions:
   - Register on SAM.gov (free, ~2 weeks for activation)
   - Get a CAGE code (free, comes with SAM)
   - Subscribe to AFWERX / Army SBIR / Navy SBIR / DIU mailing lists
   - Identify and engage a defense-cleared advisor (offer 0.25–1.0% equity)
   - Start writing a generic Janus-for-defense one-pager that can be tailored per SBIR topic
3. **Do NOT begin CMMC 2.0 work until first SBIR award is in hand or a serious DIU conversation is open.** It's expensive and the timing only matters relative to a real deal.
4. **Continue the Philly hospitality beachhead at full pace.** Defense pilots fund themselves via SBIR; the commercial business funds the company. Both must move forward simultaneously.
5. **Treat every Janus design decision through the lens of "would this disqualify us from defense?"** The architectural integrity (no FR, no video storage, edge-deployable, normalized world-space data) is what makes both the commercial moat and the defense fit possible. If anyone proposes facial recognition, cloud-only, or pixel-space zones, the answer is no — across all verticals.

---

## Reference

- Strategic moat: [JANUS-DATA-MOAT.md](JANUS-DATA-MOAT.md)
- Sector use cases: [JANUS-USE-CASES.md](JANUS-USE-CASES.md)
- Technical foundation: [../JANUS-ZONE-MODEL.md](../JANUS-ZONE-MODEL.md)
- ADR: [../docs/ADR-001-zone-model-3d-world-space.md](../docs/ADR-001-zone-model-3d-world-space.md)

## Caveats

This document is **internal strategy**, not a DoD proposal. Any actual proposals to DoD entities must be reviewed by qualified counsel for ITAR/EAR, classification, and accuracy. Specific budget figures, sales cycle estimates, and contract values are based on industry-typical ranges and should be validated per opportunity. The defense vertical is a long-cycle, capital-intensive expansion path — pursued in parallel with, not as a substitute for, the commercial beachhead.
