# ADR-001: Zones Are 3D World-Space Planes

**Status:** Accepted (locked 2026-04-27)
**Decider:** Ali Mabsoute
**Reference:** [JANUS-ZONE-MODEL.md](../JANUS-ZONE-MODEL.md), [demo_assets/zone_concept.html](../demo_assets/zone_concept.html)

## Context

Janus tracks foot traffic in physical spaces. The core abstraction is the *zone* — a region the user defines, in which Janus counts people, measures dwell time, and computes KPIs. Until 2026-04-27, "zone" meant a 2D polygon drawn directly on the camera image: the user clicked points on the screen, the polygon was stored as pixel coordinates, and hit-testing happened in pixel space.

This produced four problems:

1. **Numbers had no physical meaning.** "5 people in the dining area" actually meant "5 people whose pixel feet happened to fall in this on-screen rectangle." Density and capacity math broke.
2. **Zones did not survive camera changes.** Move the camera, swap the lens, the zone became wrong instantly. There was no concept of "the same physical area on the floor" — only "this set of pixels."
3. **Multi-camera fusion was impossible.** Two cameras pointing at the same bar produced two unrelated zones.
4. **The visual model felt amateur in demos.** A flat polygon on the screen reads as "we drew on top of a video." Restaurant prospects could not distinguish this from a CV experiment.

The screen-overlay model also conflicted with the existing Sprint 3 work on homography calibration (`routes/calibration.py`, `edge_agent_enhanced.py` foot-point world projection), which already projected detections to world coordinates but stored zones in pixel coordinates — an inconsistency that made the analytics layer brittle.

## Decision

**Zones are flat planes in 3D world space, anchored to physical surfaces, projected through the camera homography onto the image.**

A zone is defined by:
- Four corner points in world coordinates (meters)
- A rotation matrix (so the plane can sit on any surface, not just the floor)
- A translation in world space

Per-frame rendering projects the four world corners through the camera homography to image pixels, producing a perspective-correct quadrilateral on the screen.

Per-detection counting back-projects the foot-anchor pixel to world coordinates, then performs a 3D point-in-quad hit test in world space.

The user-facing interaction is **Create → Rotate → Place → Commit**:
1. Wireframe quad materializes hovering above the scene
2. User rotates it freely in 3D (pitch/yaw/roll)
3. User translates it onto its target surface (floor, bar top, ramp, etc.)
4. Quad fills with color, gets a label, becomes a tracked zone

## Consequences

### Positive
- Numbers mean physical things (density, capacity, dwell-per-area)
- Zones survive camera moves, lens swaps, and multi-camera setups
- Multi-camera fusion becomes possible
- Demo visual is dramatically more compelling — prospects see "Janus mapped my floor" not "Janus drew on my video"
- Aligns with existing homography work in the edge agent
- Supports non-floor zones (bar top, table surface, ramp, stair) without special-casing

### Negative
- Each camera angle requires a one-time homography calibration (~30 seconds: pick 4 known points, supply real-world distances). This adds onboarding friction.
- Storage schema must change: `polygon_world` (4×3 floats) + rotation matrix (3×3 floats) becomes the source of truth; `polygon_image` becomes a derived/cached projection.
- `ZoneDrawer.jsx` (Sprint 6.1, the existing 2D polygon draw tool) becomes deprecated for the customer-facing UI. It can stay as an internal/debug tool but is not the canonical zone-creation path.
- The demo video export script (`demo_assets/demo_video_export.py`) needs to be rebuilt with 3D zone rendering. The first version (committed 2026-04-27) used flat polygons and is replaced.

### Migration plan
- Backend: zone schema migration adds `polygon_world` + `rotation` + `homography_id` columns. Old `polygon_image` becomes a derived view.
- Edge agent: hit-testing already happens in world coords via `edge_agent_enhanced.py` — only zone storage migrates.
- Frontend: new 3D zone editor component (Three.js overlay on camera feed). `ZoneDrawer.jsx` deprecated.
- Demo assets: rebuild `demo_video_export.py` to project world-space quads through homography per frame.

## Alternatives considered

### A. Keep flat-overlay zones, add a "physical interpretation" layer on top
Treat the existing pixel polygons as the source of truth and back-fill physical meaning by computing world-space stats post-hoc. Rejected because the abstraction leaks — every customer-facing number remains pixel-anchored, and the demo continues to look like a CV experiment. Multi-camera fusion remains impossible.

### B. 3D voxel zones (full volumes, not planes)
Define zones as 3D volumes (a 4m × 6m × 3m box of bar space). Rejected because it overcomplicates calibration (need depth data or stereo) and adds no value over a planar zone for foot-traffic tracking. The detected feet are 2D points on a plane; a 3D volume zone reduces to its floor projection for counting.

### C. Per-camera zones with no world model
Each camera defines its own zones in pixel space, no world coordinates. Rejected for the four reasons in the Context section.

## Why this matters as a moat

Every cheap competitor demo uses flat-overlay zones because that's the easier thing to build. Janus doing world-space zones with proper homography projection is what separates "Python script with bounding boxes" from "physical-space analytics product." Restaurant owners can intuitively understand "we mapped your floor"; they cannot intuitively trust "we drew on your video."

## References

- Visual proof point: `demo_assets/zone_concept.html` (open in browser, orbit camera, observe Bar Top zone elevated above floor on the bar counter)
- Full spec: `JANUS-ZONE-MODEL.md`
- Existing math: `edge_agent/edge_agent_enhanced.py`, `routes/calibration.py`
- Memory pin: `feedback_janus_zone_model.md`
