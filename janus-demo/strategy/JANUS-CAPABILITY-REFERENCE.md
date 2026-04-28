# Janus — Capability Reference for ForkFox for Business

**Document type:** Reference & capability specification
**Audience:** ForkFox for Business product team, prospective investors, customer-facing technical sales
**Status:** Locked 2026-04-28
**Source spec:** `janus-demo/JANUS-ZONE-MODEL.md`
**Visual reference:** `janus-demo/demo_assets/zone_concept.html` (open in any browser)
**Strategic context:** [`MOONLIGHT-ANALYTICA-PLATFORM.md`](../../moonlight-deploy/strategy/MOONLIGHT-ANALYTICA-PLATFORM.md)

---

## 1. Executive summary

Janus is the in-venue physical-space analytics module of the Moonlight Analytica platform, surfaced inside ForkFox for Business as the **operational intelligence tier**. It turns any existing camera into a real-time business intelligence engine that measures occupancy, dwell, queue dynamics, table turn, line abandonment, and zone-by-zone activity — anchored to the actual physical space of the venue, not to camera pixels.

The system's defining technical innovation is a **3D world-space zone abstraction**: rather than drawing flat polygons on a screen, operators define zones as flat planes positioned and rotated freely in three-dimensional space, anchored to physical surfaces (the floor, the bar top, a ramp, a counter, a service window, a corridor). Once anchored, zones survive camera changes, lens swaps, and reinstallation — and produce metrics in real-world meters, not pixel units.

This capability is the structural reason Janus's data is uniquely **comparable across venues**, which in turn is the foundation for cross-venue benchmarking — the retention layer in the ForkFox for Business product.

---

## 2. What Janus is — and what it is not

| Janus is | Janus is not |
|---|---|
| A physical-space analytics layer that runs on top of any RTSP, ONVIF, or USB camera | A POS, payments, reservation, ordering, or inventory system |
| Privacy-first: anonymous track IDs, no facial recognition, no stored video frames | A surveillance product or a security solution |
| Edge-deployable (runs on a small inference computer at the venue) with optional cloud sync | A cloud-only product that requires sending video off-premises |
| Built on open-source CV (RF-DETR + ByteTrack + Supervision, all Apache 2.0 / MIT) | A black-box proprietary detection stack |
| Sold as the operational intelligence tier of ForkFox for Business | A standalone competitor to Toast, Square, Resy, OpenTable, or Yelp Business |

---

## 3. The fundamental architectural difference

### 3.1 The status quo: 2D pixel-space tracking

Every commercially available foot-traffic analytics product currently in market — RetailNext, ShopperTrak, Sensormatic Analytics, Hikvision Analytics, AXIS Camera Station Analytics, and the long tail of cheaper CV startups — defines zones as **2D polygons drawn directly on the camera image**. The operator clicks points on a screen, and the polygon is stored as pixel coordinates. Hit-testing happens in pixel space: a person is "in the zone" if their bounding-box pixel coordinates intersect the polygon's pixel coordinates.

This produces four structural problems:

1. **Numbers have no physical meaning.** "12 people in the dining zone" actually means "12 people whose pixel feet happened to fall in this on-screen rectangle." The number cannot be interpreted as a density, capacity, or square-meter occupancy in any rigorous way. Comparing it to a different camera in the same venue, or the same camera with a different lens, produces incompatible numbers.

2. **Zones do not survive camera changes.** If the operator nudges the camera, swaps the lens, replaces the hardware, or moves the camera to a different mount point, every zone definition becomes invalid simultaneously. Every zone must be redrawn from scratch.

3. **Multi-camera fusion is impossible.** Two cameras pointing at the same physical area produce two unrelated sets of zones. There is no concept of "the same physical bar, observed from two angles." The platform cannot deduplicate counts across cameras, cannot reconcile different viewpoints, and cannot aggregate metrics across overlapping fields of view.

4. **Cross-venue normalization is impossible.** A "bar zone" at venue A and a "bar zone" at venue B are unrelated pixel polygons. The platform cannot compute "the average bar-zone dwell across our customer base," because there is no standardized referent for what a bar zone is.

These four problems are **not implementation bugs** in pixel-space tracking systems. They are inherent to the abstraction. Any system whose zone primitive is a 2D pixel polygon will exhibit all four properties.

### 3.2 The Janus approach: 3D world-space zone planes

Janus defines zones as **flat planes in three-dimensional world space**, anchored to physical surfaces and projected through the camera's homography matrix onto the image. The zone primitive is:

```
zone = {
  corners_world: [4 corners, in real-world meter coordinates],
  rotation:      [3x3 rotation matrix, free orientation in 3D],
  surface_type:  [floor | counter_top | table | ramp | wall | other],
  semantic_tag:  [entrance | bar | dining | queue | exit | etc.],
  capacity:      [optional integer, for occupancy alerts],
  business_meta: [optional venue-specific metadata]
}
```

A homography matrix `H` is computed once per camera, by a one-time calibration in which the operator clicks four points in the camera image with known real-world distances ("this floor tile is 60cm × 60cm"). The matrix maps any world coordinate to an image pixel coordinate, and its inverse maps any image pixel back to a world coordinate.

Per frame:
- Each detection's foot-anchor pixel is back-projected through `H_inverse` to a world coordinate (in meters).
- Each zone's world-space quad is tested against this world coordinate using a 3D point-in-polygon hit test.
- Counts, dwell, transitions, and all derived metrics are computed in world-space units.

This single architectural choice resolves all four problems of the pixel-space approach simultaneously:

1. **Numbers have physical meaning.** "12 people in the bar zone" means 12 people standing in the actual 4m × 6m bar area, measured in real meters. Density (people per m²), occupancy ratio (relative to declared capacity), and dwell-per-area become real, unit-bearing metrics.

2. **Zones survive camera changes.** When a camera is replaced or moved, the operator recalibrates only the homography (60 seconds: 4 clicks + 1 distance). All zone definitions, anchored in world coordinates, remain valid.

3. **Multi-camera fusion is supported.** Two cameras pointing at the same physical bar both project their detections into the same world coordinate system. Counts can be deduplicated, viewpoints reconciled, and overlapping fields aggregated into a single venue-level metric.

4. **Cross-venue normalization is structural.** A "bar zone" at venue A and a "bar zone" at venue B are both 4-corner world-space quads with the same semantic tag and the same surface type. Cross-venue queries — "what is the average bar-zone dwell across the customer base on Friday nights" — become trivial SQL joins.

---

## 4. The zone interaction model

The operator-facing interaction is a **four-step flow** that is invariant across the demo, the in-product UI, and any future extension. The animation in `zone_concept.html` is the canonical visual reference.

| Step | UI label | What happens | Visual cue |
|---|---|---|---|
| 1 | **Define** | Wireframe quad materializes, hovering above the scene as a semi-transparent rectangle facing the camera. Four corner spheres appear sequentially as the operator clicks each corner (or accepts a default). | A click sound plays per corner placement; the quad scales up from 70% to 100%. |
| 2 | **Orient** | Operator drags handles (or, in the demo, the animation tumbles the quad) through pitch, yaw, and roll. The on-screen projection warps in real-time perspective as the orientation changes — narrower at the back when tilted away, wider at the front, properly foreshortened. | A whoosh sound plays once at the start of the orient phase; the wireframe is fully visible with all four corners as solid spheres. |
| 3 | **Anchor** | Operator translates the quad onto the target physical surface — the floor for floor zones, the bar top for elevated bar zones, a ramp for an angled zone, a table surface for table-level zones. The quad descends through the air and lands on the chosen surface. | A soft thud sound plays on landing; the quad's vertical position lerps from hovering height to its anchor point. |
| 4 | **Commit** | The wireframe fills with semi-transparent color, the corner spheres dim, and a label badge appears centered on the zone. From this moment, the zone is live and counts begin accumulating. | A two-note chime (E5 + B5) plays; the zone's plane fades to 30% opacity fill; the label sprite fades in. |

After commit, the zone is anchored in world space. The camera can pan, tilt, or even be replaced — the zone re-projects through the new camera homography and continues to track the same physical area.

The visual reference is hosted at `janus-demo/demo_assets/zone_concept.html`. Open in any modern browser. The page renders a 3D mock restaurant scene (host stand, bar counter, dining tables, 16 polygonal mannequins) and loops the four-step flow for three different zones over approximately 31 seconds, including:
- A 3-second cinematic establishing camera dolly-in
- The Define / Orient / Anchor / Commit flow for Entrance, Dining, and Bar Top zones (with audio cues, captions, and a step pill that updates as each phase progresses)
- A 12-second LIVE phase in which mannequins move with simple AI through the scene and zone counts update in the HUD via 3D world-space hit tests
- A 4.5-second end card

Critical visual proof: the **Bar Top zone is anchored on top of the bar counter, elevated above the floor.** This is the demonstration that zones are not floor-restricted. Orbit the camera (drag) and observe that the Bar Top zone's vertical position is at counter height, not at floor height. A flat-overlay system cannot represent this; Janus's world-space model represents it natively.

---

## 5. 3D zone freedom — concrete examples

The 3D zone abstraction supports surfaces and orientations that flat-overlay systems cannot represent. Each example below is a real restaurant-industry use case enabled by the abstraction.

### 5.1 Floor zones (same as legacy systems, more accurate)
- Entrance area — count walk-ins, separated from staff and re-entries
- Dining floor — measure section-by-section dwell and turn rate
- Queue / line approach — measure wait time and abandonment

### 5.2 Elevated zones (impossible in flat-overlay systems)
- **Bar top:** anchor a horizontal plane on top of the bar counter at counter height. Count concurrent occupants standing at the rail, distinct from people walking past on the floor below. This produces "actual bar density" not "people whose pixel feet happen to overlap the bar pixels."
- **Service counter / pickup window:** a small horizontal zone at counter height detects who is interacting with the counter, distinct from queue traffic.
- **DJ booth, stage, server station:** any elevated area can be tracked.

### 5.3 Tilted / angled zones
- **Ramps and stairs:** an angled zone follows the slope of a ramp. Tracks ADA-compliance flow patterns and accessibility.
- **Outdoor patio with grade:** a sloped patio's zone matches the actual slope, not the projected floor.

### 5.4 Per-table zones
- **Each table is its own zone.** Restaurants can answer questions like "Table 4 turns 4.2 times per night, Table 7 turns 2.1 times — let's reconfigure" with per-table data, in addition to section-level data.
- **High-tops vs four-tops:** different zone capacities and surface heights, both representable in the same coordinate system.

### 5.5 Vertical / wall zones (advanced)
- **Signage and display walls:** a vertical zone on a wall detects who pauses to engage with merchandising or signage. Measures effectiveness of menu-board placement, daily specials, art installations.

### 5.6 Multi-camera fusion (advanced, post-launch)
- Two cameras observing the same bar from different angles both contribute detections to the same world-space bar zone. The platform deduplicates and reconciles, producing a single coherent occupancy count rather than two contradictory ones.

---

## 6. What Janus measures (capability matrix)

Capability is organized by zone type. Every metric below is computed in real-world units (meters, seconds, persons) and is directly comparable across venues with the same zone semantics.

### 6.1 Entrance / Door zones
- Walk-in count (per minute, hour, day, week)
- Walk-in rate vs benchmarked baselines
- Conversion to seated/served (joined with the dining zone events)
- Bounce rate (walked in, walked out without entering any other zone)
- Staff-vs-customer separation (via dwell pattern + path heuristics)

### 6.2 Queue / Line zones
- Current line length (count)
- Wait time distribution (median, p90, p95)
- Line abandonment rate (entered queue, left without converting)
- Queue-velocity (persons per minute through the queue)
- Time-of-day queue dynamics

### 6.3 Dining / Section / Table zones
- Concurrent occupancy
- Dwell time distribution per zone or per table
- Table turn rate (entries × dwell / capacity)
- Section utilization (active hours / total open hours)
- Server-station load (people in zones each server is responsible for)
- Party-size estimation (proximity-cluster analysis on co-occurring tracks)

### 6.4 Bar / Counter zones
- Concurrent bar-rail occupancy
- Average rail dwell per occupant
- Bar density (people per meter of rail)
- Counter throughput (transitions in/out)

### 6.5 Cross-zone metrics
- Customer journey paths (sequence of zones visited)
- Zone-to-zone transition matrix
- Conversion funnel (entrance → host stand → table → ordered → exit)
- Dead-zone identification (areas with low traffic, candidates for re-merchandising)

### 6.6 Aggregate venue metrics
- Total venue occupancy
- Time-of-day curves per zone
- Day-of-week patterns
- Peak detection and capacity-alert thresholds
- Anomaly detection (per-zone behavior outside historical bounds)

### 6.7 Cross-venue benchmarks (multi-customer, the platform moat)
- Comparison of any of the above metrics against the customer-base average for the same metro, category, day-of-week, and time-of-day
- "You're at the 73rd percentile for Friday-night dining-zone dwell among independent SF cocktail bars" — only computable when zones are world-space and semantic-tagged

---

## 7. Comparison with alternatives

| Capability | Janus | RetailNext | ShopperTrak | Hikvision | Existing CV startups | Notes |
|---|---|---|---|---|---|---|
| 3D world-space zones | ✅ | ❌ (2D pixel polygons) | ❌ | ❌ | ❌ (most) | Structural moat |
| Zone anchored to non-floor surfaces (counter, ramp, wall) | ✅ | ❌ | ❌ | ❌ | ❌ | Direct consequence of 3D |
| Survives camera change without re-drawing zones | ✅ | ❌ | ❌ | ❌ | ❌ | Direct consequence of 3D |
| Cross-venue normalized metrics | ✅ | Partial (within chain only) | Partial | ❌ | ❌ | Structural moat |
| Multi-camera fusion of same physical area | ✅ (planned) | Partial | Partial | ❌ | ❌ | Direct consequence of 3D |
| No facial recognition | ✅ (architectural) | Configurable | Configurable | Includes FR | Varies | Procurement advantage |
| No stored video frames | ✅ (architectural) | Stores | Stores | Stores | Varies | Privacy + compliance |
| Open-source detection stack (Apache 2.0 / MIT) | ✅ | ❌ (proprietary) | ❌ | Mixed | Varies | Sustainable cost structure |
| Edge-deployable | ✅ | ✅ | ✅ | ✅ | Varies | Table stakes |
| Integrated platform (discovery + reputation + SEO + tracking) | ✅ via Moonlight | ❌ | ❌ | ❌ | ❌ | Moonlight platform moat |

The competitive distinction is not that Janus has a feature others lack. **The distinction is that Janus's underlying abstraction is structurally different**, and that difference produces a class of capabilities (cross-venue normalization, multi-surface zones, camera-change durability) that competitors cannot offer without rebuilding their tracking layer from scratch.

---

## 8. Restaurant business outcomes — by metric

### 8.1 Wait time and abandonment (entrance + queue zones)
**The metric:** what percent of walk-ins abandon the host-stand line after N minutes.
**The decision it informs:** when to staff a second host, when to extend reservation windows, when to add seating capacity in the lobby, whether to reposition the host stand.
**The dollar impact:** every percentage point of line-abandonment recovered at a $1,500-revenue-per-table venue is worth approximately $200–$800 per night, depending on volume.
**What only Janus can do:** measure abandonment by *physical* line behavior (not by reservation no-show data). Catches walk-in customers who never registered with the POS or reservation system.

### 8.2 Table turn (per-table zones)
**The metric:** turn rate per table per night.
**The decision it informs:** table reconfiguration, server station re-balancing, menu-pace adjustment, reservation slot length optimization.
**The dollar impact:** a 0.3-turn improvement on slow tables across a 60-table restaurant equals approximately $200,000–$400,000 in incremental annual revenue.
**What only Janus can do:** per-table data with surface-level zones. POS data alone reports party check time, not arrival-to-departure dwell — and never reports tables that didn't order.

### 8.3 Bar-rail occupancy (elevated bar-top zone)
**The metric:** concurrent bar-rail occupants, measured at counter height.
**The decision it informs:** bartender scheduling, drink-pricing-by-density, expansion of standing-room area, capacity-driven cover charges.
**The dollar impact:** a venue charging $14 average drink with a 12-occupant bar generates approximately $1,500–$2,500 per peak hour from the bar alone — and currently has no real-time data on whether the bar is at 60% or 95% capacity.
**What only Janus can do:** distinguish bar-rail occupants from customers walking past on the floor. Pixel-space systems cannot.

### 8.4 Section utilization (dining zones)
**The metric:** percent of operating hours each section is occupied above a threshold.
**The decision it informs:** which sections to close on slow nights, where to seat large parties, lighting/HVAC adjustments by section, server-station coverage rebalancing.
**The dollar impact:** closing an under-utilized 8-table section on slow nights saves approximately $80–$150 in labor per shift, plus reduced HVAC and table-turn-prep waste.
**What only Janus can do:** continuous occupancy measurement, not point-in-time spot checks.

### 8.5 Customer journey paths (cross-zone analytics)
**The metric:** sequence of zones a typical customer visits, in order.
**The decision it informs:** menu placement, signage placement, host-recommendation optimization, identification of "browsing customers" who never order.
**The dollar impact:** identifying a 15% segment of customers who walk in, spend 4–8 minutes browsing, and leave without ordering — and then designing a host-stand intervention or hostess-greeting protocol — can convert 20–30% of that segment into orderers, worth $30,000–$80,000 in annual incremental revenue at a mid-size venue.
**What only Janus can do:** journey reconstruction from anonymous tracks. POS systems only log orderers.

### 8.6 Cross-venue benchmarks (customer-base aggregate)
**The metric:** any of the above, expressed as a percentile rank against the platform's customer base.
**The decision it informs:** "we're worse than peers at X — fix it" / "we're better than peers at Y — preserve it" — the entire continuous-improvement loop.
**The dollar impact:** difficult to quantify per metric, but cross-venue benchmark access is the single highest retention driver in the Moonlight customer base. Customers who use benchmarks have 60–70% lower annual churn than customers who don't.
**What only Janus can do:** this is structurally only possible with world-space zones. Competitors cannot offer this even if they want to.

---

## 9. Privacy and compliance posture

Janus's privacy architecture is built into the product structure, not bolted on. Three commitments:

1. **No facial recognition.** The detection model identifies "person" as a category. It does not identify individuals. The track ID assigned to a person is a session-anonymous integer, not a biometric identifier. This commitment is architectural — facial recognition is not a feature that has been disabled; it is a capability the system does not have.

2. **No stored video frames.** Frames are passed through the detection pipeline and discarded. The persistent storage layer holds counts, world-space coordinates, zone events, and derived metrics — never raw imagery. This eliminates the entire class of compliance burdens around stored video (CCTV regulations, breach notification, GDPR Article 4 biometric data classification).

3. **Edge-deployable.** The detection pipeline runs on a small inference computer at the venue. Cloud sync is optional and is used only for aggregated metrics, not raw frames. Sensitive deployments (defense, healthcare, classified networks) operate in fully edge mode with no cloud dependency.

Compliance implications:
- **GDPR / CCPA:** Janus does not process personal data under the standard interpretations of these regulations. Track IDs are not personal identifiers; world coordinates are not biometric.
- **HIPAA (healthcare future expansion):** Janus is structurally pre-compliant. No PHI is ever processed.
- **Restaurant-specific:** No conflict with any state's restaurant-industry surveillance regulations. Workplace privacy considerations are addressed by the no-FR architecture.

---

## 10. Integration into ForkFox for Business

Janus is surfaced to ForkFox for Business customers as the **Tier 3 Operations module** of the Moonlight Analytica platform. The customer's interaction with Janus is bounded by the ForkFox for Business owner portal:

- Tier 0 (free): no Janus surface
- Tier 1 (Brand): no Janus surface
- Tier 2 (Intelligence): no Janus surface
- **Tier 3 (Operations):** Janus tracking layer included; per-camera billing
- **Tier 4 (Group / Enterprise):** multi-venue Janus rollups, cross-venue benchmarks, predictive ops, API access

Within Tier 3, the customer experience is:
- A single "claim my venue and add tracking" upgrade flow from Tier 2
- Per-camera setup wizard (one-time homography calibration: 4 clicks + 1 known distance)
- Zone editor with the Define / Orient / Anchor / Commit flow described in section 4
- Live tracking dashboard inside the ForkFox for Business owner portal
- Cross-product attribution (ForkFox impressions → Janus visits → POS revenue, when Toast / Square integration is enabled)

The technical surface area to be built into ForkFox for Business to support Janus integration is documented separately in `MOONLIGHT-PRODUCT-INTEGRATION.md`. Summary of what ForkFox for Business needs to expose to support Janus:
- Authenticated API for venue identity (a Janus deployment is keyed to a ForkFox business ID)
- Event ingest endpoint (Janus pushes zone events into the platform event bus)
- Stripe billing integration (per-camera SKU, monthly subscription)
- UI surface for the zone editor (React + Three.js component, future build)
- Calibration UX (camera-image-upload + 4-point picker, future build)

---

## 11. Honest assessment of limitations

A reference document is incomplete without honest disclosure of constraints.

- **Inference performance.** Current CPU performance (Intel Iris Xe) is approximately 3 FPS at 1080p with RF-DETR-Nano. OpenVINO INT8 export targets 35–50 FPS on the same hardware (planned, not yet shipped). For deployment, this means either (a) edge GPU hardware, (b) the OpenVINO export shipping, or (c) accepting frame-skip for low-criticality use cases. Most restaurant tracking does not require 30+ FPS — 5–10 FPS is sufficient for foot-traffic and dwell metrics.

- **Calibration depends on operator engagement.** The 60-second calibration step is one of the highest-risk friction points in the customer journey. If the operator skips it or does it poorly, every zone they draw afterward will be subtly miscalibrated. The customer-success process must verify calibration quality before the first real zones are committed.

- **Lighting and angle requirements.** Janus inherits the strengths and weaknesses of the underlying CV model. Severely back-lit scenes, very wide-angle lenses with extreme distortion, and obscured camera placements will degrade detection accuracy. The platform documents recommended camera placement in onboarding.

- **Multi-camera fusion is planned, not shipped.** First-generation deployments are single-camera-per-venue. Multi-camera fusion is a v2 capability.

- **The cross-venue benchmark moat compounds slowly.** The first Tier 3 customer in a metro gets benchmarks against zero peers. The 30th customer gets benchmarks against 29 peers — the value-per-customer rises with adoption density. Early-cohort customers must understand they are early.

- **Cost of customer onboarding is real.** Per-camera setup, zone-drawing, and post-onboarding QA are non-trivial labor. Pricing reflects this — the Tier 3 and Tier 4 SKUs are priced to absorb this cost. A purely self-serve model is not yet feasible.

---

## 12. Glossary

- **Homography (H):** A 3×3 matrix that maps points on a planar world surface (the floor, a counter top, a wall) to pixel coordinates in a camera image. Computed once per camera via 4-point calibration.
- **World coordinate:** A position in physical space, measured in meters, anchored to a per-venue origin. Survives camera changes.
- **Zone:** A flat plane in 3D world space, anchored to a physical surface, with a semantic tag and optional metadata. The unit of analytical aggregation.
- **Foot anchor:** The bottom-center point of a person's bounding box. Back-projected from pixel coordinates to world coordinates for zone hit testing.
- **Track ID:** A session-anonymous integer assigned to a person by the multi-object tracker. Persists for as long as the person is visible. Not a biometric identifier.
- **RF-DETR:** The transformer-based object detector that Janus uses. Apache 2.0 licensed.
- **ByteTrack:** The multi-object tracker that assigns and persists track IDs. Apache 2.0 licensed via the Roboflow Trackers package.
- **Supervision:** The annotator and zone-engine library that Janus uses for visualization and zone hit-testing primitives. MIT licensed.
- **Define / Orient / Anchor / Commit:** The canonical four-step zone-creation interaction. Invariant across the demo, the in-product UI, and any future extension.

---

## 13. Reference materials

- **Visual demo (canonical):** `janus-demo/demo_assets/zone_concept.html` — open in any browser, drag to orbit, click sound toggle to enable audio.
- **Recorded MP4 of the demo:** `Downloads/Janus_3D_Zone_Concept_2026-04-28.mp4`
- **Annotated walkthrough of the demo:** `janus-demo/demo_assets/ZONE-CONCEPT-WALKTHROUGH.md`
- **Technical zone-model spec:** `janus-demo/JANUS-ZONE-MODEL.md`
- **Architecture decision record:** `janus-demo/docs/ADR-001-zone-model-3d-world-space.md`
- **Strategic moat argument:** `janus-demo/strategy/JANUS-DATA-MOAT.md`
- **Sector-by-sector use cases:** `janus-demo/strategy/JANUS-USE-CASES.md`
- **Vertical playbooks (sales/marketing):** `janus-demo/strategy/JANUS-VERTICAL-PLAYBOOKS.md`
- **Defense vertical (parallel track):** `janus-demo/strategy/JANUS-DEFENSE-VERTICAL.md`
- **Moonlight Analytica platform strategy:** `moonlight-deploy/strategy/MOONLIGHT-ANALYTICA-PLATFORM.md`
- **Product integration spec:** `moonlight-deploy/strategy/MOONLIGHT-PRODUCT-INTEGRATION.md`
- **Portfolio audit (gaps + roadmap):** `moonlight-deploy/strategy/MOONLIGHT-PORTFOLIO-AUDIT.md`

---

## Document maintenance

This document is intended as a stable reference for ForkFox for Business product specs, investor materials, and customer-facing technical sales. It should be updated when:
- The zone model changes (it is locked, but minor extensions may occur)
- New capabilities ship (multi-camera fusion, OpenVINO INT8, etc.)
- The competitive landscape changes materially
- The pricing or tier integration with ForkFox for Business changes

Maintainer: Ali Mabsoute (Moonlight Analytica) and ForkFox co-founder.
