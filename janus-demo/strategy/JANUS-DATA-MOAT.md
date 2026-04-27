# Janus Data Moat — Strategic Position

**Status:** Official strategy documentation
**Locked:** 2026-04-27
**Predecessor docs:** [JANUS-ZONE-MODEL.md](../JANUS-ZONE-MODEL.md), [docs/ADR-001-zone-model-3d-world-space.md](../docs/ADR-001-zone-model-3d-world-space.md)

## The thesis in one sentence

Janus's defensibility is not the computer vision and not the dashboard — it's that **every event Janus records is anchored to a labeled, world-space zone in real physical units**, producing a normalized cross-venue event log that takes 12–24 months of customer onboarding to replicate, and is impossible to bootstrap without going through the same per-camera calibration + per-customer zone-labeling process.

## Why the CV is not the moat

The detection and tracking stack — RF-DETR + ByteTrack + Supervision — is open source, Apache 2.0 / MIT licensed. Any competitor with a few days of engineering can stand up an equivalent CV pipeline. Person detection is a commodity. Tracking is a commodity. Heatmaps and dwell times are commodities.

If Janus's product surface ended at "we ran CV on your video and made dashboards," the company would be one funded competitor away from irrelevance.

## Why the dashboard is not the moat

The 13-tab analytics dashboard — KPIs, charts, exports, alerts — is replicable in a quarter by a team of three React engineers. Pretty UI is table stakes. Toast, Square, Resy, OpenTable all have dashboards. Toast has 100,000+ restaurant customers and dashboards that ship better-looking screenshots than ours.

If Janus's product surface ended at "we visualize foot traffic prettier than the next guy," the company would be one design refresh away from being undifferentiated.

## What the moat actually is

The moat is the **structure of the data Janus produces**, not the data itself.

Because zones are 3D world-space planes anchored to physical surfaces (not pixel polygons), every recorded event includes:

- **A labeled zone** ("bar_top", "host_stand", "queue", "table_4") that semantically corresponds to a real piece of the customer's business
- **A world coordinate** in meters (`x = 4.2m, y = 12.8m`) that is meaningful and comparable, not a pixel coordinate that depends on the camera lens and angle
- **A time-stamped transition** between zones that reflects actual customer journey (entrance → host_stand → table_3 → bar_top → exit)
- **A dwell duration in real seconds**, not in frame counts that vary with camera FPS
- **A density measurement in people/m²**, the same unit on every venue regardless of how the camera was set up

Every venue Janus onboards adds a new stream of these events to a global event log where **the schema means the same thing across every venue**. That normalization is the moat.

## Why this is hard to copy

A competitor wanting to replicate this dataset must:

1. **Convince the same restaurant owners to install a second camera or share their existing one.** Every onboarded customer is a moat point. They are not going to deploy two competing tracking systems.
2. **Redo the per-camera homography calibration.** This requires either a manual UX (60+ seconds per camera × 30+ venues = 30 minutes of customer time, gated by trust) or an autonomous calibration pipeline (months of CV research). Janus has the former built.
3. **Re-label every zone in every venue.** A bar zone in venue A is a different geometric polygon from a bar zone in venue B. Each one represents a one-on-one conversation with the owner about their layout. Across 30 venues, that's 30 owner relationships and 100+ owner-validated zone labels.
4. **Wait 60–90 days for the event log to be statistically meaningful.** No amount of capital accelerates this — it's wall-clock time on real foot traffic.
5. **Match the cross-venue normalization.** Even if the competitor builds zones, if their zones are still pixel polygons (the easy path), their cross-venue queries break. They have to commit to the same world-space architecture, which means rebuilding their whole tracking layer.

The minimum time for a well-funded competitor to match a Janus deployment of 30 venues with 90 days of data: **~14–18 months from a standing start.** And every additional venue Janus onboards in the meantime widens the gap by another month of dataset depth.

## What the data layer enables (compounding products)

The zone-anchored event log is not a feature. It is the foundation for at least four distinct products that Janus can ship without changing the underlying data model:

### Product 1: Real-time operational dashboards (the wedge)
Per-venue tracking, occupancy, dwell, queue. This is the "Janus" most prospects will buy on Day 1. Sold per-venue, $X/month per camera.

### Product 2: Cross-venue benchmarking (the retention hook)
"Your Friday 8pm dwell is 40 min; the Philly independent-bar average from 23 venues is 32 min." This is only possible because every venue's data is in the same coordinate meaning. **Customers cannot get this from any competitor**, because no one else has the normalized cross-venue dataset. This is the feature that prevents churn — switching to a competitor means losing access to the benchmark you've been comparing yourself against for a year.

### Product 3: Predictive operations (the pricing-power lever)
"Based on 30 venues × 90 days, when your entrance hits 12 at 7:30pm, your host-stand queue will hit 8 in 11 minutes — pre-stage staff now." This is forecasting trained on the cross-venue dataset. Charges 3–5x the wedge price because it directly drives revenue. Only possible if the dataset is normalized.

### Product 4: Anonymized industry intelligence (the second business)
Sell anonymized, aggregated benchmarks to non-customers: real estate developers, restaurant consultants, equipment vendors, insurance underwriters, civic planners. "How does foot traffic in Philly's Fishtown compare to East Passyunk?" This is a $50k–$500k/year contract product, sold to buyers who never need to install a camera. **Janus is the only entity that can sell this product** because Janus is the only entity that has the normalized data. This is a defensible second business that emerges automatically from the first.

## The data flywheel

Each new customer simultaneously:
- Pays Janus directly (Product 1 revenue)
- Adds calibration + zone labels + event stream to the dataset (improves Products 2, 3, 4 for everyone)
- Improves the predictive models that get sold back as Product 3 (improves margin per existing customer)
- Tightens the cross-venue benchmarks (improves retention via Product 2)

Customer N+1's data makes customer N more sticky and more profitable.

## How the zone-manipulation UX is the data acquisition mechanism

The zone editor isn't UI polish — it's the data-acquisition pipeline.

Every time a customer drags a quad, rotates it in 3D, places it on a surface, and commits, they are:

1. **Labeling a polygon** in their physical space ("this 6m² area is my bar")
2. **Validating the label** by virtue of being the venue owner (the highest-quality possible labeler)
3. **Anchoring it to world coordinates** that survive camera changes, lens swaps, and reinstallation
4. **Adding it to a cross-venue dataset** of owner-labeled physical-space polygons

That dataset alone — **labeled physical layouts of restaurants, bars, and retail spaces, validated by owners, in standardized world coordinates** — has standalone commercial value. ML companies have paid for less. Insurance underwriters, commercial real estate firms, restaurant chains, retail consultants, and architecture firms would all pay for access to this dataset, anonymized.

The zone editor is the data acquisition tool disguised as a UX feature.

## Implication for product priorities

This reframes how to evaluate every feature roadmap decision:

| Feature type | Strategic value |
|---|---|
| Anything that improves zone-creation UX | **Critical** — it's the data acquisition pipeline |
| Anything that improves homography calibration | **Critical** — same reason |
| Anything that ensures cross-venue data normalization | **Critical** — protects the moat |
| Better tracking accuracy | **Important but commodity** — doesn't widen the moat |
| Prettier dashboards | **Important but commodity** — doesn't widen the moat |
| New KPIs | **Marginal** — table stakes |
| Anything that adds proprietary data fields the customer's owner-knowledge surfaces | **High value** — extends the moat (e.g., "table_4 has avg check $X" tied to zone) |
| Anything that requires customers to re-do zone work | **Avoid** — destroys the moat |

## The investor-readable version

> Janus is building the cross-venue dataset of how independent hospitality and retail businesses actually flow. The wedge product (real-time analytics, $X/month/venue) is the data acquisition mechanism. The defensible product is the resulting normalized event log, which compounds with every onboarded venue and unlocks (a) cross-venue benchmarking that prevents customer churn, (b) predictive operations that command 3–5x pricing power, and (c) an industry-intelligence data-product business sold to non-customers. The moat is not the computer vision — that is open source. The moat is being the first to consolidate physical-space behavior across hundreds of independent operators in a normalized, world-space-zone-anchored format.

## Reference

- Technical foundation: [JANUS-ZONE-MODEL.md](../JANUS-ZONE-MODEL.md)
- Architecture decision: [docs/ADR-001-zone-model-3d-world-space.md](../docs/ADR-001-zone-model-3d-world-space.md)
- Visual proof: [demo_assets/zone_concept.html](../demo_assets/zone_concept.html)
- Sector use cases: [JANUS-USE-CASES.md](JANUS-USE-CASES.md)
- Defense vertical deep-dive: [JANUS-DEFENSE-VERTICAL.md](JANUS-DEFENSE-VERTICAL.md)
