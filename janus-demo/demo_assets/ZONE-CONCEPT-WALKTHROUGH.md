# Zone Concept HTML — Walkthrough Guide

> Open `zone_concept.html` in any browser. This guide annotates exactly what you're seeing and why each piece is the proof of the 3D world-space zone model.

## What's in the scene

A mock 3D restaurant: dark slate floor with a faint grid (so perspective is visible), host stand on the left, long bar counter on the right (raised top surface — this matters), 6 dining tables in a 3×2 grid with chairs, and 14 polygonal mannequins (cylinder body + sphere head, no faces — kept generic) walking around with simple AI.

## The animation loop (~28s, then repeats)

For each of three zones — **Entrance**, **Dining**, **Bar Top** — the same four-step sequence plays. This is the canonical interaction. Watch one full cycle:

### Step 1.1 — Create (~0.6s)
A wireframe rectangle materializes hovering above the scene, semi-transparent. The HUD top-left says `step 1.1 · create — wireframe materializes above scene`.

**What this proves:** zones start as ephemeral, before they're committed. They're objects, not screen pixels.

### Step 1.2 — Rotate (~1.4s)
The wireframe tumbles through pitch / yaw / roll in 3D. You can see all six faces of the rotation. The HUD says `step 1.2 · rotate in 3D — pitch / yaw / roll`.

**What this proves:** the zone is a real 3D plane in space — it has orientation, not just position. If it were a flat screen overlay, this rotation would be impossible (or fake). Drag the camera with your mouse during this phase to confirm the rotation is happening in world space, not in screen space.

### Step 1.3 — Place (~1s)
The wireframe slides through the air and lands on its target surface. For Entrance and Dining, that's the floor. For Bar Top, **it lands on top of the bar counter — elevated above the floor.** The HUD says `step 1.3 · place on surface`.

**What this proves:** zones can sit on any surface, not just the floor. Orbit the camera to see the Bar Top zone is genuinely above the floor at counter height.

### Step 1.4 — Commit (~0.6s)
The wireframe fills with semi-transparent color, the corner spheres dim, and a label badge appears centered on the zone. The HUD says `step 1.4 · commit — zone is live`.

**What this proves:** the zone has transitioned from "being created" to "live and tracking."

### Repeat for Dining and Bar Top
Same four-step sequence. After all three zones are placed, the loop enters LIVE mode.

## LIVE mode (~14s)

The mannequins start walking around the scene with simple AI:
- Each picks a target zone (weighted: 25% entrance, 45% dining, 30% bar)
- Walks toward a random point in that zone
- Hangs out for 1.5–5.5 seconds
- Picks a new target

The HUD on the left shows live counts per zone, updating as mannequins enter and leave the zones. The counts are computed by **3D world-space hit-testing**: each mannequin's position is a 3D point, each zone is a 3D quad, and the hit test asks "is this point inside this quad's footprint?"

**What this proves:** counting is anchored to physical space. The Bar Top zone counts mannequins standing at the bar (not just walking past it on the floor). Floor zones count mannequins whose feet are inside the floor polygon.

## How to verify the model is correct

1. **Drag to orbit the camera.** The zones should stay glued to their surfaces. Bar Top stays on the bar. Dining stays flat on the floor with foreshortening — narrower at the back, wider at the front. If a zone slid around with the camera, the model would be wrong.

2. **Look at the Bar Top zone from a low angle.** Orbit until you're nearly level with the bar counter. The Bar Top zone should appear as a thin sliver — because you're looking at a flat plane edge-on. A flat screen overlay would not behave this way.

3. **Watch a mannequin walk from the floor up to the bar.** When they enter the Bar Top zone's footprint and are at counter height, the Bar Top counter ticks up. When they leave, it ticks down. (Note: the mock simplifies this — mannequins don't actually climb onto the bar, they just enter the bar zone area at floor level.)

4. **Click "replay" (bottom right).** The animation restarts from zone 1. Use this to study individual steps.

## What the mock is NOT showing

- **Real video underneath.** The mock is the abstract "this is how Janus thinks about space" demo. The real product overlays the same world-space zones on top of a real camera feed via the camera's homography matrix. Same model, different background.
- **Person detection or tracking.** The mannequins follow scripted random walks; there's no RF-DETR or ByteTrack involved. Tracking is a separate concern — the zone model is about *where* counts happen, not *how* people get detected.
- **Calibration UX.** In the real product, the user calibrates the camera once (4 clicks + 1 distance) before drawing zones. The mock skips this because the 3D scene has no camera-to-world ambiguity.

## Files behind the mock

- `zone_concept.html` — the entire mock, single file, ~330 lines, Three.js from CDN
- No build step, no dependencies to install — open in a browser, it works

## The role of this mock in the project

- **Sales asset:** record a 30-second screen capture, send to prospects. It tells the story without needing real video.
- **Design source of truth:** every future zone-related feature (live UI, demo video, edge agent storage) references this behavior.
- **Onboarding:** new collaborators (human or AI) open this first to understand what zones are. Saves an hour of explanation.
