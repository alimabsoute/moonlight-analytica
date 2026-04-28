# React 3D Zone Editor — Design Document

> **Status:** Design — pre-implementation. Locked once Ali signs off on the open questions in section 11.
> **Replaces:** `frontend-v3/src/components/ZoneDrawer.jsx` + the editor surface in `frontend-v3/src/pages/ZoneConfig.jsx`.
> **Source of truth for behavior:** [`JANUS-ZONE-MODEL.md`](../../JANUS-ZONE-MODEL.md), visual reference [`demo_assets/zone_concept.html`](../../demo_assets/zone_concept.html).
> **Stack reality check (correcting the brief):** frontend-v3 runs **React 18.2**, Vite 5, plain CSS variables + lucide-react + framer-motion + zustand 4 + three.js 0.183. There is **no Tailwind and no Radix UI** in this app. The brief's premise of "React 19 + Tailwind + Radix" is incorrect for this codebase — design below is targeted at the actual stack.

---

## 1. Library choice — **react-three-fiber (R3F) + drei**

Three.js 0.183 is already a dependency (used by `shared/Tracking3DView.jsx`). R3F is a thin React reconciler over the same Three install — adds bindings, doesn't duplicate the engine.

| Option | Verdict |
|---|---|
| **R3F + drei** | **Pick.** Declarative JSX matches codebase; `<TransformControls>`/`<OrbitControls>`/`<Html>` from drei eliminate ~600 lines of gizmo code; ~60 KB gzipped on top of existing Three. |
| Raw Three.js wrapped in React | Skip. We re-implement TransformControls, raycasting, render loop, and disposal by hand — `Tracking3DView.jsx` already shows the pain. |
| Babylon.js / PlayCanvas | Skip. Replaces existing Three, breaks Tracking3DView, ~500 KB extra. |
| WebGPU / regl | Skip. No stable React bindings, no homography helpers. |

Learning curve: R3F's `<mesh>`, `<group>`, `useFrame`, `useThree` are the only new primitives. Drei components are drop-in.

---

## 2. Component API surface

```
<ZoneEditor3D
  cameraId={string}                        // selects homography + feed
  feedSrc={string}                         // MJPEG URL or snapshot
  fallbackImageSrc={string}                // when MJPEG offline
  homography={number[3][3] | null}         // null => prompt for calibration
  initialZones={Zone[]}
  onZoneCommit={(zone) => void}            // POST happens here
  onZoneUpdate={(zone) => void}
  onZoneDelete={(zoneId) => void}
  onCalibrationRequested={() => void}
  readOnly={boolean}
/>
```

`Zone` (matches the `polygon_world` schema):
```
{ id, zone_name, color, capacity,
  corners_world: [[x,y,z]*4],   // meters
  rotation:      [[r11..r33]],   // 3x3
  surface_type:  'floor'|'counter'|'table'|'ramp'|'wall',
  semantic_tag:  'entrance'|'bar'|'dining'|'queue'|... }
```

**Internal state** (Zustand, §3): `mode` (`idle|define|orient|anchor|committing`), `draftZone`, `selectedZoneId`, `gizmoMode` (`translate|rotate|scale`), `surfaceLock`.

---

## 3. State management — **Zustand store, scoped to the editor**

Three options considered:

1. **`useState` + prop drilling.** Works for ZoneDrawer (today) but the new component has 5+ child surfaces (toolbar, gizmo, wizard pill, zone list, calibration banner) that all need draft state. Drilling becomes ugly.
2. **Zustand (recommended).** Already a dependency in `frontend-v3`. One store per editor instance via `createStore` — no global pollution. R3F renders are reconciled via `useStore` selectors, so we avoid full-tree rerenders on every drag-frame.
3. **Redux.** Not in the codebase. Adding it for one component is overkill.

**Pick Zustand.** Pattern: `useEditorStore = create(...)` exposed only inside `ZoneEditor3D`. Drag-frame updates write to the store; `useFrame` reads from it via `useStore.getState()` to dodge React's render loop entirely on hot path.

---

## 4. Calibration UX — **separate component, integrated launcher**

Build `<CameraCalibration />` as a sibling at `/cameras/:id/calibrate`, embedded as an inline modal when the editor detects `homography == null`.

**Separate** because: per-camera and one-time; the interaction is a 2D pixel picker (click 4 known points + type one distance) — no Three.js needed; reusable from camera onboarding.

**Integrated launcher** because: opening the editor on an uncalibrated camera must not yield a blank scene. The editor renders a blocking "Calibrate this camera (60s)" card and routes through.

`routes/calibration.py` already exists (JANUS-ZONE-MODEL.md §11); backend wiring is mostly done.

---

## 5. Integration with frontend-v3

**Routing.** `pages/ZoneConfig.jsx` already exists. Replace its `<ZoneDrawer>` panel with `<ZoneEditor3D>`. Keep the right-hand zone list / summary cards — they still show committed zones and are unchanged in concept.

**File layout:**
```
src/components/zone-editor/
  ZoneEditor3D.jsx              ← orchestrator
  scene/  SceneRoot, CameraFeedPlane, ZoneQuad, ZoneGizmo, GroundGrid
  wizard/ WizardPill, {Define,Orient,Anchor,Commit}Step
  state/  editorStore.js (Zustand)
  hooks/  useHomography, useMjpegTexture
  api/    zonesClient.js
src/components/CameraCalibration.jsx   ← sibling
```

**Deprecate.** `ZoneDrawer.jsx` (delete after migration); `polygonToBBox` in `ZoneConfig.jsx` (dead once `polygon_world` is canonical).

**Keep.** `ZoneCard`, `ColorPicker`, the right-hand summary panel, the page header, the `/api/zones/config` client. Page chrome unchanged.

**Backend coordination.** `routes/zones.py` already accepts `polygon_world`. Editor writes `polygon_world` (4×3) + `rotation` (3×3) on commit. Continue writing `polygon_image` as a derived projection until the edge agent migrates; drop it then.

---

## 6. WebGL over MJPEG — rendering technique

Two layered surfaces, identical box, stacked via `position: absolute`:

1. **Background.** `<img src={mjpegUrl}>` — the browser decodes multipart/x-mixed-replace as a continuously-updating image, no JS needed. Static snapshot fallback when offline.
2. **Foreground.** R3F `<Canvas gl={{ alpha: true }} style={{ background: 'transparent' }}>` overlays transparently.

No video-into-texture path — keeping the feed as a sibling DOM element is simpler, lets the browser handle MJPEG, and survives stream hiccups without crashing WebGL.

**Camera coupling.** Fit the R3F PerspectiveCamera (`fov`, `position`, `lookAt`) once at homography load via `useHomography` so its projection matrix matches the physical camera's. For floor-only zones we project world→pixel via the homography directly; the WebGL camera mirrors the result.

---

## 7. Drag-handle UX — **drei `<TransformControls>` with mode pivots**

Pick TransformControls — battle-tested gizmo, one prop, UX matches Blender/Figma/Three.js editor. Custom corner-handle raycasting reinvents the wheel; X/Y/Z spinner panels belong in an "Advanced" sidecar (good a11y fallback).

**Wizard mapping:**
- **Define:** Click camera plane → 1m × 1m quad facing camera. No gizmo yet.
- **Orient:** TransformControls in `rotate` (yaw/pitch/roll only).
- **Anchor:** TransformControls in `translate`, with optional surface-snap (Z locked to surface height for `floor`/`counter`).
- **Commit:** Hide gizmo, fade fill to 30%, place label sprite, POST to `/api/zones/config`.

Scale mode exposed post-commit so users can resize without re-running the wizard.

---

## 8. Touch support

Zones are configured at install time on a laptop. Mobile is a 5% case. Minimum bar:
- TransformControls handles get a touch-friendly hit-radius bump (`size={0.9}` on small viewports).
- Wizard pill becomes bottom-sheet on `viewport < 768px`.
- OrbitControls already supports pinch-zoom and two-finger pan out of the box.

We do **not** invest in a custom touch IK rig. If a customer asks for tablet authoring, revisit.

---

## 9. Performance

- **Frame rate target:** 60 fps idle, 30 fps minimum during drag on Intel Iris Xe.
- **`frameloop="demand"`.** R3F renders only when the store mutates — saves ~80% of GPU on static views.
- **Drag hot path.** Pointer handlers write to Zustand; a single `useFrame` reads `getState()` and updates the mesh transform. No React reconciliation per pointer event.
- **MJPEG independence.** Feed is a `<img>`; we don't invalidate R3F on its frames.
- **Memoization.** `<ZoneQuad>` wrapped in `React.memo` keyed on serialized geometry — only the dragged quad rerenders.
- **Disposal.** R3F auto-disposes geometries/materials on unmount; verify with Three.js Inspector before flipping the flag on.

---

## 10. Implementation phases

| Sprint | Scope | Effort |
|---|---|---|
| **A. Skeleton & feed overlay** | New `zone-editor/` directory, R3F canvas, MJPEG plane behind, OrbitControls, ground grid, dummy quad. Page route swap behind a `?editor3d=1` flag. | 1.5 days |
| **B. Wizard + Define/Orient/Anchor/Commit** | Zustand store, 4-step state machine, drei TransformControls bound to mode, commit POSTs `polygon_world` + `rotation`. | 2 days |
| **C. Homography binding + camera fit** | `useHomography` hook, R3F camera matched to camera intrinsics, world→image projection verified against `routes/calibration.py` round-trip. | 1.5 days |
| **D. Calibration UX integration** | `<CameraCalibration>` sibling, modal on `homography == null`, return-to-editor flow. Reuse `routes/calibration.py` POST. | 1 day |
| **E. Polish, tests, deprecation** | Vitest unit tests for store + commit POST shape; visual regression via Playwright; delete `ZoneDrawer.jsx`; flip the editor flag on by default. | 1.5 days |

**Total:** ~7.5 dev-days. Maps to one sprint with buffer, two sprints conservative.

---

## 11. Open questions for Ali

1. **Calibration coverage (BLOCKER for Sprint D).** JANUS-ZONE-MODEL.md describes `routes/calibration.py` as "partially built" (Sprint 3, gates 3.1–3.4). Is the homography POST + storage path actually done, or do we need to spec the missing half? This is the biggest unknown.

2. **Schema migration timing.** Backend accepts `polygon_world` already; the edge agent still reads `polygon_image`. Editor writes both transitionally and we drop `polygon_image` once edge agent flips — confirm? Recommendation: yes.

3. **Multi-zone authoring.** Inline "Add another" after Commit (saves 3 clicks/zone) vs. always returning to the page-level "Add Zone" CTA? Recommendation: inline.

4. **Surface presets.** Anchor step with named height presets (Floor 0m, Counter 1.05m, Table 0.74m) vs. always free-Z? Presets cut authoring ~70% but need per-venue setup. Recommendation: ship presets, free-Z available.

5. **Save model.** Autosave on every gizmo release, or explicit "Save" button? Recommendation: explicit Save during wizard, autosave + undo stack post-commit.

---

## Appendix A — Stack reality check

Verified against `frontend-v3/package.json`: `react ^18.2.0`, no `tailwindcss`, no `@radix-ui/*`. Styling = plain CSS + `var(--token)` custom properties + `lucide-react` + `framer-motion`. `three ^0.183.2` and `zustand ^4.4.7` already installed — no new deps for the recommended stack except R3F + drei. A React 19 / Tailwind / Radix migration is a separate workstream and does not change the design choices in §1–§10.
