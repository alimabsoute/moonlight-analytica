# Janus Zone Model — Design Source of Truth

> **Read this before touching any zone-related code, demo asset, or UI.**
> Visual reference: [`demo_assets/zone_concept.html`](demo_assets/zone_concept.html)
> Locked: 2026-04-27

## The model in one sentence

**Zones are flat planes in 3D world space, anchored to physical surfaces, and projected through the camera's perspective onto the image — they are NOT 2D polygons drawn on the screen.**

## Why this matters

A real restaurant floor is 3D. The host stand is at one depth, the bar at another, dining tables spread across a perspective plane. If a zone is a flat screen overlay, then "5 people in the dining area" actually means "5 people whose pixel feet happen to fall in this on-screen rectangle." That breaks the moment the camera moves, the lens changes, or you reuse the same zone definition on a different camera. The number doesn't mean anything physical.

When zones live in **world space anchored to the floor (or bar top, or any surface)**, four things become true:

1. **Numbers mean something physical.** "12 people in the bar zone" = 12 people standing in the actual 4m × 6m bar area, measured in real meters.
2. **Square-meter math works.** Density (people/m²), occupancy vs capacity, dwell-per-area — all real metrics.
3. **The zone survives camera changes.** Move the camera, swap the lens, the zone stays on the floor where it was placed. Recalibrate the camera once, zones persist.
4. **Multi-camera fusion is possible.** Two cameras pointing at the same bar both contribute to the same world-space zone.

This is the difference between a CV demo and a building-management product.

## The canonical interaction (locked)

Every zone is created via this four-step flow. Demo videos, customer UI, and any future zone-related interaction MUST follow this sequence.

| Step | Name | What happens |
|---|---|---|
| 1 | **Create** | Wireframe quad materializes hovering above the scene, semi-transparent, facing the camera by default |
| 2 | **Rotate** | User drags handles (or animation tumbles it) through pitch / yaw / roll in 3D — viewer can see it's a real plane in space, not a sticker |
| 3 | **Place** | Quad slides to its target surface (floor, bar top, ramp, etc.) and lands in world coordinates |
| 4 | **Commit** | Wireframe fills with semi-transparent color, label badge appears, zone is live and starts counting |

After commit, the zone is *anchored to the world*. The camera can pan, tilt, or even change — the zone re-projects through the new camera matrix and stays on its physical surface.

## What surfaces a zone can sit on

Any flat plane, not just the floor:

- **Floor zones** — entrance, dining area, queue line, lobby
- **Counter / bar top zones** — anyone standing at the bar (zone is elevated to counter height)
- **Table surfaces** — table-level activity tracking
- **Ramps / stairs** — angled zones for accessibility paths
- **Walls** (rare) — for "people facing this signage" detection in retail

## The math (high level)

**Two coordinate systems:**

1. **World space** (meters, anchored to the room): X-Y plane is the floor, Z points up. A zone is four corners on a plane in this space, plus a rotation matrix R and translation T.

2. **Image space** (pixels, what the camera sees): each world point projects to a pixel via the camera's homography matrix H (3×3 for floor-plane points; full 3×4 projection for elevated planes).

**Per frame:**
```
world_corners = (R @ local_corners.T).T + T          # 4×3 array
image_corners = H @ homogeneous(world_corners.xy)    # for floor planes
                or full_projection(world_corners)    # for any plane
draw_polygon(image_corners)                          # foreshortened correctly
```

**Per detection (live counting):**
```
foot_pixel = (bbox.x_center, bbox.y_bottom)
foot_world = H_inv @ homogeneous(foot_pixel)         # back-project to floor
for zone in zones:
    if zone.contains_3d(foot_world):                 # 3D point-in-polygon
        zone.count += 1
```

**Calibration:** done once per camera angle. User picks 4 known points in the scene with known real-world distances ("this floor tile is 60cm × 60cm"), `cv2.findHomography()` produces H. ~30 seconds of work per camera.

## What this means for each surface of the project

### Demo video (`demo_assets/demo_video_export.py`)
- Replace the existing flat-polygon zone rendering with 3D-projected quads
- Use a hand-calibrated homography per source video (one-time setup per video)
- The zone-draw animation must follow the create → rotate → place → commit sequence — over the real video, with the quad behaving as a 3D object

### 3D concept mock (`demo_assets/zone_concept.html`)
- This is the **canonical visual reference**. Match its behavior, not its programmer-default styling.
- The mock has no real video underneath — it's the abstract, "this is how Janus thinks" demo. Sendable as a screen capture on its own.

### Edge agent (`edge_agent/edge_agent_enhanced.py`, `batch_processor.py`)
- Already projects foot-points to world coords via homography (Sprint 3 work)
- Zone definitions need to migrate from `polygon_image` (pixel coords) to `polygon_world` (world meter coords) with optional rotation matrix
- `batch_processor.BatchSessionTracker` already does foot-anchor zone hit-testing — needs to test in world space

### Backend (`backend/routes/zones.py`)
- Zone schema must store `polygon_world` (4×3 floats) + rotation matrix (3×3 floats) as the source of truth
- `polygon_image` is a derived/cached projection through the current camera homography — never the source

### React frontend (future work)
- `ZoneDrawer.jsx` needs to be replaced or supplemented by a 3D zone editor
- Three.js overlay on top of the live camera feed (MJPEG or WebRTC)
- Drag handles on the wireframe quad for rotate / translate / scale in 3D
- The handles project through the same camera homography — drag a handle in screen space, it moves the world-space corner

### Calibration UX (`routes/calibration.py`, `CalibrationView.jsx`)
- One-time setup per camera: user clicks 4 points on the camera view, types in their real-world distances (or picks a known reference like "this floor tile is 60cm")
- Stored per-camera, reused for every zone on that camera
- Already partially built (Sprint 3, gates 3.1–3.4)

## What NOT to build

- **Flat 2D polygon zones drawn directly on the image.** The old screen-overlay model is dead. If anyone (including future me) starts building a flat overlay, point them at this doc.
- **Per-camera zone re-creation.** The zone is anchored to the world, not the camera. Swap the camera, recalibrate (30s), zones persist.
- **Pixel-space hit testing.** Detections back-project to world coords; zone tests happen in world space. Pixel-space hit tests give wrong answers under perspective.

## Glossary

- **Homography (H)** — 3×3 matrix mapping floor-plane world coords to image pixels. Computed once per camera via 4-point calibration. Invertible for floor-only zones.
- **Quad** — the four-corner planar shape that defines a zone. Always coplanar, can be rotated to any orientation in 3D.
- **Foot-anchor** — the bottom-center pixel of a person's bounding box; back-projected to world coords for zone hit-testing.
- **Calibration** — the act of computing H by clicking 4 known points and supplying their real-world distances.
- **World space** — meters, anchored to the physical room. Origin and axes chosen at calibration time.

## Reference

- **Visual concept:** `demo_assets/zone_concept.html` — open in any browser, drag to orbit. This is the reference everyone (human or AI) should look at first.
- **Existing math:** `edge_agent/edge_agent_enhanced.py` (homography projection), `routes/calibration.py` (RANSAC homography fit), `shared/Tracking3DView.jsx` (Three.js orthographic BEV — close but not the same model)
- **Canonical breakthrough conversation:** 2026-04-27 session
