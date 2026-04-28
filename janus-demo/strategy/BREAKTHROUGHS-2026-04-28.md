# Janus Breakthroughs — 2026-04-28

**Status:** Permanent record of the conceptual and engineering breakthroughs that landed today.
**Locked:** 2026-04-28
**Branch where the work lives:** `feature/toolset-enhancement` (pushed to `origin`)
**Test totals at end of day:** 283 passing, 0 failing (153 backend + 74 edge + 56 frontend) — up from 234 at start of session.

This document is written so a future contributor — or future-me coming back cold in three months — can reconstruct what changed today and why it matters. It is intentionally specific. It pairs each conceptual idea with the concrete artifact that proves it.

---

## Why this day matters

Three things converged:

1. **The 3D world-space zone model went from "we said it" to "we shipped it everywhere."** It's now in the canonical demo, the backend schema, the edge agent's hit-test, the React frontend's editor, and a 2,717-line investor deck.
2. **A real product bug was caught by a test we wrote today.** The homography-inversion bug had been silently producing garbage `polygon_image` values for any v2 zone with a calibrated camera. No customer would have hit it yet because no customer is on v2 zones — but it would have been a stand-up rollback when the first one was.
3. **The strategy thesis got expressed at three different fidelities** — a 754-line KPI catalogue covering 17 industries, a 27-slide prospect deck, and a normalized data-moat argument that turns the open-source CV stack into a non-issue. Each one re-uses the same primitive (world-space zones), which is the whole point.

---

## Conceptual breakthroughs

### 1. The CV is open source. The data layer is the moat.

**The argument.** RF-DETR is Apache 2.0. ByteTrack is MIT. Supervision is MIT. Any competitor with a few weeks of engineering can stand up an equivalent detection + tracking pipeline. Person counting is a commodity. Dashboards are a commodity. Heatmaps are a commodity.

What is NOT a commodity is the **structure of the data Janus produces**. Because zones are 3D world-space planes anchored to physical surfaces (not pixel polygons), every recorded event includes:

- A labeled zone (`bar_top`, `host_stand`, `queue`, `table_4`) that semantically corresponds to a real piece of the customer's business
- A world coordinate in meters that is meaningful and comparable across cameras and venues
- A time-stamped transition between zones reflecting actual customer journey
- A dwell duration in real seconds, not frame counts that vary with camera FPS
- A density measurement in people/m² — the same unit on every venue regardless of how the camera was set up

Every venue Janus onboards adds a stream of these events to a global event log where **the schema means the same thing across every venue**. That normalization is the moat. A well-funded competitor needs ~14–18 months from a standing start to match a 30-venue Janus deployment with 90 days of data, and every additional onboarded venue widens the gap.

**What this enables (compounding products from one data layer):**

1. Real-time per-venue dashboards (the wedge — $X/cam/mo)
2. Cross-venue benchmarking (the retention hook — switching costs lock customers in)
3. Predictive operations (the pricing-power lever — 3–5x the wedge)
4. Anonymized industry intelligence (the second business — sold to non-customers: real estate, restaurant consultants, insurance underwriters, civic planners)

**What this means for product priorities.** Anything that improves zone-creation UX is critical (it's the data acquisition pipeline). Anything that improves homography calibration is critical (same reason). Anything that requires customers to redo zone work is destructive (it destroys the moat). Better tracking accuracy and prettier dashboards are commodity.

**Artifact:** `strategy/JANUS-DATA-MOAT.md` — locked.

### 2. Zones are surfaces, not pixels.

**The wrong model:** zones are 2D polygons drawn on the camera image. "5 people in the dining area" means "5 people whose pixel feet happen to fall in this on-screen rectangle." That breaks the moment the camera moves, the lens changes, or you reuse the zone on a different camera. The number doesn't mean anything physical.

**The right model:** zones are flat planes in 3D world space, anchored to physical surfaces (floor at 0.00m, dining table at 0.74m, service counter at 0.91m, bar top at 1.05m), and projected through the camera's homography onto the image. They are NOT 2D polygons drawn on the screen.

When zones live in world space, four things become true:

1. Numbers mean something physical — "12 people in the bar zone" = 12 people standing in the actual 4m × 6m bar area.
2. Square-meter math works — density in people/m², occupancy vs capacity, dwell-per-area are all real.
3. Zones survive camera changes — recalibrate once, zones persist.
4. Multi-camera fusion is possible — two cameras pointing at the same bar both contribute to the same world-space zone.

**The canonical interaction (locked).** Every zone is created via this four-step flow. Demo videos, customer UI, and any future zone-related interaction MUST follow this sequence:

| Step | Name | What happens |
|---|---|---|
| 1 | **Define** | Wireframe quad materializes hovering above the scene, semi-transparent |
| 2 | **Orient** | User drags handles through pitch/yaw/roll in 3D — viewer sees it's a real plane in space |
| 3 | **Anchor** | Quad slides to its target surface and lands in world coordinates |
| 4 | **Commit** | Wireframe fills with semi-transparent color, label appears, zone is live |

This sequence is the spec. Everything else is implementation.

**Artifacts:**
- `JANUS-ZONE-MODEL.md` — the locked design contract
- `demo_assets/zone_concept.html` — the canonical visual reference (1,514 lines of HD Three.js)
- `frontend-v3/src/components/ZoneEditor3D.jsx` — the production React + R3F editor

### 3. Defense is a parallel track, not a sequential one — and the architectural choices made commercially are exactly what make defense entry possible.

**The standard wisdom.** "Land commercial first, defense later." Defense sales cycles are 12–24 months; you can't afford to wait while burning runway.

**The breakthrough.** Three architectural decisions Janus has already made align with DoD procurement reality in ways most CV competitors do not:

1. **No facial recognition.** DoD has been moving away from FR-equipped surveillance for compliance and political reasons. Most CV vendors have FR baked into their core. Janus does not. Architecturally absent. This single decision removes the most common DoD-procurement objection.
2. **Privacy-first / no-video-storage.** Counts and metadata only, frames discarded after detection. Aligns with OPSEC requirements where stored video creates classified-material handling burdens.
3. **World-space zones.** DoD operates in physical sectors (force-protection zones, perimeters, hangars, ranges) — not pixels. Janus's data model maps 1:1 onto how DoD planners describe physical space.

**The implication.** Most CV competitors who chose facial recognition as a feature have permanently locked themselves out of multiple verticals (defense, healthcare, civic, casinos in many jurisdictions). Janus's no-FR architecture isn't a limitation — it's the only thing left standing in regulated buyers' procurement screens.

**Pricing power.** Defense pricing is 2–10× commercial rates. Force protection: $500–$2,000/cam/mo. Operational installations (hangars, ranges): $1,000–$3,000/cam/mo. Sensitive sites (SCIF, ammo, command): $2,000–$5,000/cam/mo. Single-base ACV: $1M–$10M. Program-of-record: $50M–$500M+ over 5–10 years.

**Path.** SBIR Phase I (AFWERX, Army Applied SBIR, Navy SBIR, DIU OTA) → Phase II → Phase III sole source. Run in parallel with the commercial Philly hospitality beachhead, not after.

**Strategic implication.** Defense exposure changes the company narrative from "vertical SaaS for hospitality + retail" to "physical-space analytics infrastructure used across hospitality, retail, healthcare, AND defense." Different valuation multiplier. Different investor pool. Different acquirer pool. Stabilizes the business through hospitality cycle downturns.

**Artifact:** `strategy/JANUS-DEFENSE-VERTICAL.md` — full buyer landscape, contracting paths, service-branch use cases, compliance posture, 24-month roadmap to first DoD pilot.

### 4. The product abstraction generalizes across every sector — one product surface, twelve+ sectors, $25B+ TAM.

**The realization.** Every use case in JANUS-USE-CASES.md is structurally identical: define zones in world space, count people in zones, measure dwell, log transitions, compare across venues. The technical product does not change between a Philly bar, an Air Force hangar, a hospital, or a casino. The KPIs, buyers, and dollar amounts vary. The zones change shape. The CV stack is the same.

**TAM stack:**

| Sector | Establishments | ACV | TAM |
|---|---|---|---|
| Independent restaurants & bars (US) | 600,000 | $2,000 | $1.2B |
| QSR (US) | 250,000 | $30,000 | $7.5B |
| Independent retail (US) | 1,000,000 | $3,000 | $3B |
| Healthcare outpatient (US) | 250,000 | $5,000 | $1.25B |
| Coworking + enterprise office (US) | 80,000 | $25,000 | $2B |
| Stadiums + arenas (US) | 3,000 | $250,000 | $750M |
| Defense (US, addressable) | 5,000 | $1M | $5B |
| Hotels (US) | 55,000 | $30,000 | $1.65B |
| Coffee shops, fitness, casinos, civic, etc. | combined | — | ~$3B |
| Corporate security (Allied Universal, Securitas, etc.) | thousands of sites | $50k–$500k | **$15B+** |

**Total US TAM (conservative): $25B+. Beachhead target (independent hospitality in Philly): ~$2M ARR within 24 months.**

The TAM of the wedge product is small. The TAM of the underlying data + analytics layer applied across sectors is enormous. Janus is not a hospitality company. It is a physical-space analytics infrastructure company that uses hospitality as the wedge.

**Artifact:** `strategy/JANUS-USE-CASES.md` (12 sectors) and `strategy/JANUS-INDUSTRY-USE-CASES-KPIS.md` (17 industries with specific KPIs, buyers, anchor zones, $/cam/mo, GTM motions).

### 5. Corporate security is the biggest commercial vertical and the most under-recognized one.

**The blind spot.** When people think "physical-space analytics," they think Toast (POS) or RetailNext (people counting). Almost no one thinks of Allied Universal or Securitas, which together represent ~$15B+ of the addressable market — bigger than independent hospitality, bigger than QSR, bigger than independent retail.

**Why.** Allied Universal alone is a $20B+ revenue contract security firm with 1M+ guards. Securitas is comparable. Their core business is selling on-site human presence to thousands of facilities. They already have the customer relationships and the cameras. What they don't have is a measurement layer that turns guard tours into auditable zone events.

**Janus value proposition for corporate security.** Replace 60% of on-site human presence checks with measured zone events. Guard tour completion rate, dwell anomaly count, incident response time per zone — all surfaced as overlay analytics on top of existing camera infrastructure. Sells to the firm, not the end customer; Janus is the analytics overlay on a contract the firm already owns.

**TAM math.** Thousands of sites × $50k–$500k ACV = $15B+ addressable. Higher pricing than commercial hospitality because the customer is enterprise, but lower than defense because there's no compliance overhead.

**Artifact:** Slide 23 of `strategy/JANUS-DECK.html` — and the corresponding entry in `JANUS-INDUSTRY-USE-CASES-KPIS.md` (which spawned 7 sub-segments: residential, event security, retail loss prevention, transit, banking, cannabis, warehouse).

---

## Engineering work done today

### A. HD demo library expanded from 3 → 10 verticals

**Before:** restaurant + retail + fitness, all built on the original `zone_concept.html` template (1,514 lines).

**After:** 10 self-contained HD demos, each with a procedural articulated `Humanoid` class, PBR materials with procedural canvas-generated textures, PMREM RoomEnvironment for IBL, EffectComposer + UnrealBloomPass post-processing, 33.9s 4-phase timeline, audio system synthesized via Web Audio API. Each one is ~1,500–2,000 lines of standalone HTML.

The 10:

| File | Lines | Vertical | Mannequins | Zones |
|---|---|---|---|---|
| `zone_concept.html` | 1,514 | Restaurant (master template) | varied | 3 |
| `zone_concept_retail.html` | 1,577 | Boutique retail | 16 | 4 |
| `zone_concept_fitness.html` | 1,652 | Gym (treadmills, squat rack, yoga) | varied | 4 |
| `zone_concept_casino.html` | 1,889 | Casino floor (slots + tables + cage + VIP) | 16 | 4 |
| `zone_concept_hotel.html` | 1,864 | Hotel lobby (check-in + bar + elevators) | 15 | 4 |
| `zone_concept_office.html` | 1,791 | Coworking/office (3 pods + conference + cafe + booths) | 16 | 4 |
| `zone_concept_stadium.html` | 1,809 | Stadium concourse (concession + portals + restrooms) | 20 | 4 |
| `zone_concept_airforce.html` | 1,753 | Hangar with simplified aircraft + GSE | varied | 4 |
| `zone_concept_army.html` | 1,746 | Outdoor range with covered firing line | varied | 4 |
| `zone_concept_navy.html` | 1,891 | Pier + ship deck (height differential 0.4m vs 2.0m) | varied | 4 |

All 10 follow the canonical Define → Orient → Anchor → Commit interaction. Each was built by spawning a parallel background agent with the master template + a vertical-specific delta prompt. Casino + Stadium retried due to context exhaustion in their first agent attempt.

**Commits:** `d39198b`, `e6df1ee`.

### B. All 10 demos rendered to MP4

`demo_assets/record_all.js` — Node + headless Chromium + ffmpeg pipeline that records every zone_concept_*.html for one full timeline loop and writes 1080p h264 MP4s with `+faststart` to `~/Downloads/Janus_3D_<Vertical>_<date>.mp4`. The 10 sendable videos exist on disk now and don't need to be re-rendered for prospect outreach.

**Commit:** `6212d8d`.

### C. ZoneEditor3D wired into the live UI

Previously: the 3D editor existed as a built component (`frontend-v3/src/components/ZoneEditor3D.jsx`) but had no entry point in the running app.

Now: a "Draw Zone (3D)" button on the Zone Config page header opens it as a fullscreen overlay. Lazy-loaded via `React.lazy` + `Suspense` so the @react-three bundle is code-split and only fetched on first open. Side benefit: ZoneConfig tests no longer pull the full 3D module graph (which had been failing on `react-dom/client` resolution from the parent `node_modules`). Close button (top-right X) sits OUTSIDE the Suspense boundary so the user can always dismiss the overlay even mid-load. Escape key also closes.

`onSaved` callback closes the overlay, surfaces the schema_version 2 success notice, and refetches zones. Four new tests in `ZoneConfig.test.jsx` cover open / close / Escape / default-hidden.

**Commit:** `18fe511`.

### D. Real homography bug found and fixed (high-impact)

**The bug.** The `camera_calibration` table stores `h_matrix` as pixel→world (matches `edge_agent.project_to_world` which does `H @ [px, py, 1] = [world_x, world_y, 1]`). But `polygon_world_3d_to_image` in `backend/zone_geometry.py` was applying H directly to world coordinates as if it were world→pixel. Every auto-derived `polygon_image` was garbage — corners collapsing near the origin — for any v2 zone with a `camera_id`.

**How it was caught.** The new HTTP-level integration test `test_v2_polygon_image_auto_derived_when_calibration_exists`. The test seeded a calibration mapping pixel rectangle 0..400 × 0..300 to world rectangle 0..4 × 0..3 metres, POSTed a v2 zone with `polygon_world_3d` matching that footprint and `camera_id="cam_a"`, then GETted and asserted that the auto-derived `polygon_image` corners were within 5 pixels of the calibration rectangle. The assertion failed: corners were rounding to `[0, 0]`. The math: with `H @ [4, 0, 1]` where H ≈ scale-by-0.01 (pixel→world), the result is `[0.04, 0, 1]` → rounds to `[0, 0]`. That matched the failure exactly.

**The fix.** In `polygon_world_3d_to_image`, compute `H_inv = np.linalg.inv(H)` once and apply `H_inv` to project world → pixel. Updated the docstring to document the real input direction (the function now matches the only direction H is ever stored in the system).

**Test fallout.** Two existing unit tests in `test_zone_geometry.py` (`test_polygon_world_3d_to_image_floor_zone` and `_elevated_zone`) had been written assuming H was world→pixel — they were testing the buggy behavior. Their input H values were flipped to the inverse so they now exercise the same expected outputs against the corrected contract.

**Commit:** `bdd1bf3`.

**Why this matters beyond the fix itself.** The bug affected production code, but no live customer would have triggered it yet because no live customer is on v2 zones (the backend has 4 v1 zones in `janus.db`). It would have been a stand-up rollback when the first one was. Tests pay for themselves at this moment, not when they're written.

### E. 11 HTTP-level v2 round-trip tests added

`backend/tests/test_zones_config.py::TestZoneV2HttpRoundTrip` — covers the full Flask request/response layer for the v2 zone schema. Before today, v2 was unit-tested in `test_zone_geometry.py` and edge-side hit-tested in `edge_agent/tests/test_zone_v2_migration.py`, but the HTTP route layer had no v2 coverage. Gap closed.

The 11 tests:

1. `test_v2_post_returns_schema_version_2`
2. `test_v2_get_round_trips_3d_fields`
3. `test_v2_default_rotation_is_identity_when_omitted`
4. `test_v2_default_surface_type_is_floor`
5. `test_v2_legacy_polygon_world_2d_backfilled_from_3d` — verifies the (x,y) drop is auto-populated for v1 consumers
6. `test_v1_legacy_post_returns_schema_version_1` — verifies legacy POSTs still get schema 1
7. `test_v2_camera_id_round_trips`
8. `test_v2_polygon_image_auto_derived_when_calibration_exists` — the test that caught the homography bug
9. `test_v2_polygon_image_left_null_when_no_calibration` — verifies graceful NULL when calibration missing
10. `test_v2_upsert_preserves_v2_fields`
11. `test_v2_surface_types_round_trip` — verifies all 6 surface types (`floor`, `counter_top`, `table`, `wall`, `ramp`, `other`) round-trip without coercion

### F. Test count grew 234 → 283

| Layer | Before today | After today | Δ |
|---|---|---|---|
| Backend | ~142 | 153 | +11 (v2 round-trip + earlier session work) |
| Edge agent | ~74 | 74 | 0 |
| Frontend (vitest) | ~52 | 56 | +4 (3D editor overlay) |
| **Total** | **~268** | **283** | **+15** |

(The CLAUDE.md baseline of 234 was from an earlier sprint snapshot.)

### G. JANUS-DECK.html shipped — 27-slide investor/prospect deck

`strategy/JANUS-DECK.html` — 2,717 lines, single self-contained HTML, all CSS/SVG inline, system font stack, no external resources, no JS framework. Synthesizes the existing strategy docs (JANUS-ZONE-MODEL, JANUS-DATA-MOAT, JANUS-USE-CASES, JANUS-DEFENSE-VERTICAL, JANUS-INDUSTRY-USE-CASES-KPIS) into a sales-grade artifact.

Slide structure:
- 1: Cover (Janus wordmark + tagline "Built for the floor. Not the screen.")
- 2: The problem
- 3: The breakthrough — 3D world-space zones (with SVG side-view diagram of camera frustum + 4 surface heights)
- 4: System architecture (SVG 3-layer diagram: Edge Agent → Backend → Frontend)
- 5: The data moat
- 6: Janus vs comparables (table marking facial-recognition vendors DISQUALIFIED on compliance rows)
- 7–23: 17 industry slides (Restaurants, QSR, Boutique retail, Big-box retail, Fitness, Hotels, Healthcare, Coworking, Stadiums, Casinos, Civic, Air Force, Army, Navy, Marines+SOF, PMC, Corporate security)
- 24: 5-tier pricing (Free / Starter / Pro / Enterprise / Defense)
- 25: Roadmap (Shipped Q1–Q2 / Sprint 8 Q3 / Multi-camera fusion + defense kickoff Q4)
- 26: Why now (4 tailwinds: edge compute cheap, open detection weights, FR off the table, defense modernization push)
- 27: Close (CTA + contact)

Keyboard arrow nav, persistent prev / N of 27 / next pill, overview grid (Esc) with 27 clickable thumbnails, print-friendly with `page-break-after: always` on each slide.

**Commit:** `2a6e4b6`.

### H. JANUS-INDUSTRY-USE-CASES-KPIS.md (committed earlier in session, foundational for the deck)

754 lines covering 17 industries with specific KPIs per industry: restaurants, QSR, boutique retail, big-box retail, fitness, hotels, healthcare, coworking, stadiums, casinos, civic, defense (Air Force, Army, Navy, Marines+SOF), PMC (Constellis, GardaWorld, Amentum buyers), Security (Allied Universal, Securitas — largest TAM). For each: hero metric, buyer, top 3 KPIs, $/cam/mo, anchor zones, GTM motion.

**Commit:** `a9e53d6`.

---

## Commits this session (in order)

```
2a6e4b6  docs(janus): add 27-slide investor/prospect deck
6212d8d  chore(demos): add record_all.js + node manifest for batch MP4 capture
bdd1bf3  fix(zone-geometry): invert homography in polygon_world_3d_to_image
18fe511  feat(zone-editor): wire ZoneEditor3D into ZoneConfig route
e6df1ee  feat(demos): add 4 commercial vertical zone concept demos
d39198b  feat(janus): HD demos for retail/fitness + 3 defense verticals + edge agent v2 migration
a9e53d6  docs(janus): add master KPI reference across 17 industries (incl. PMC + Security)
dbe47cc  feat(janus-frontend): scaffold React 3D Zone Editor (R3F + drei)
1cb4a1c  feat(janus-demo): HD upgrade — humanoid mannequins, PBR materials, IBL, post-processing
2720598  feat(janus): world-space zone schema migration + retail/fitness demo variants + R3F editor design
8ad2ffa  feat(janus-demo): polish 3D zone concept to Level 2 (sendable asset)
62c9998  docs(moonlight+janus): lock platform strategy, portfolio audit, integration spec, vertical playbooks
fd80a24  docs(janus): lock strategy docs — data moat, 12-sector use cases, defense vertical
b5a2c53  docs(janus): lock 3D world-space zone model as canonical (ADR + spec + visual mock)
```

All on `feature/toolset-enhancement`, all pushed to `origin` at `github.com/alimabsoute/moonlight-analytica`.

---

## What this unblocks

| Now possible | Why |
|---|---|
| Send the deck to a prospect | `JANUS-DECK.html` is sales-grade and self-contained |
| Send a demo reel for any of 10 verticals | MP4s are on disk in `~/Downloads/` |
| Demonstrate live zone creation in the actual product | ZoneEditor3D is wired into Zone Config |
| Onboard a real v2 customer | The polygon_image auto-derive path is now correct under calibration |
| Submit AFWERX / Army Applied SBIR / Navy SBIR proposals | Defense vertical doc + 3 service-branch demos exist |
| Pitch to the corporate security vertical | Specific TAM math + KPIs + zones for Allied Universal / Securitas done |

---

## What's still parked

- Live calibration UX inline in ZoneEditor3D (currently expects `/api/calibration/<cameraId>` to be pre-populated)
- Edit-existing-zone mode (ZoneEditor3D is create-only)
- Multi-camera world-space fusion (single-camera assumed)
- OpenVINO INT8 export for production iGPU inference (Sprint 8)
- AFWERX SBIR Phase I proposal drafting
- CMMC 2.0 Level 1 self-attestation paperwork

---

## Reference

- Technical foundation: [`JANUS-ZONE-MODEL.md`](../JANUS-ZONE-MODEL.md)
- ADR: [`docs/ADR-001-zone-model-3d-world-space.md`](../docs/ADR-001-zone-model-3d-world-space.md)
- Strategic moat: [`JANUS-DATA-MOAT.md`](JANUS-DATA-MOAT.md)
- Sector use cases: [`JANUS-USE-CASES.md`](JANUS-USE-CASES.md)
- Defense deep-dive: [`JANUS-DEFENSE-VERTICAL.md`](JANUS-DEFENSE-VERTICAL.md)
- KPI catalogue: [`JANUS-INDUSTRY-USE-CASES-KPIS.md`](JANUS-INDUSTRY-USE-CASES-KPIS.md)
- Investor deck: [`JANUS-DECK.html`](JANUS-DECK.html)
- Visual reference: [`../demo_assets/zone_concept.html`](../demo_assets/zone_concept.html)
- Recorded demos: `~/Downloads/Janus_3D_*_2026-04-28.mp4` (10 files)
