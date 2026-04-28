# 3D Zone Editor — Usage

The component that replaces `ZoneDrawer.jsx` for v2 (world-space) zone creation.

## Files

| File | Role |
|---|---|
| `src/components/ZoneEditor3D.jsx` | Main wizard component (Define / Orient / Anchor / Commit) |
| `src/components/ZoneEditor3D.css` | Styles |
| `src/components/ZoneEditor3DScene.jsx` | React Three Fiber Canvas + scene + TransformControls gizmo |
| `src/stores/zoneEditorStore.js` | Zustand store + surface presets |
| `src/lib/zoneApi.js` | API client (zones + calibration) + draft → world-space payload converter |

## Dependencies (added to package.json)

```
@react-three/fiber  ^8.17.0
@react-three/drei   ^9.115.0
```

After pulling these changes, run:

```bash
cd janus-demo/frontend-v3
npm install
```

## Usage

```jsx
import ZoneEditor3D from './components/ZoneEditor3D';

function ZoneConfigPage() {
  return (
    <ZoneEditor3D
      cameraId="primary"
      onSaved={(zone) => {
        // refresh zones list, close modal, etc.
        console.log('Zone committed:', zone);
      }}
    />
  );
}
```

## What it does

1. **Define** — user types zone name + default size (meters)
2. **Orient** — drag the gizmo on the canvas to rotate in 3D (pitch/yaw/roll). Numeric inputs available as fallback.
3. **Anchor** — pick a surface preset (Floor 0m / Bar Top 1.05m / Service Counter 0.91m / Dining Table 0.74m / Custom). Then drag the gizmo to translate the zone over its target surface.
4. **Commit** — set capacity + color, review summary, POST to `/api/zones/config`.

The payload sent to the backend follows schema_version 2:
- `polygon_world_3d` — 4 corners in meters, computed from local corners + scale + rotation + position
- `rotation_matrix` — 3×3 from Euler angles
- `surface_type` — `floor | counter_top | table | wall | other`
- `camera_id` — passed in via prop

The backend auto-derives `polygon_image` via the camera homography for legacy edge agent consumers.

## v0 limitations (planned upgrades)

- **No live camera feed underlay yet.** Scene shows a grid floor with reference geometry. Live MJPEG-on-canvas overlay is the next iteration.
- **Single camera assumed.** Multi-camera selection comes when multi-camera fusion ships in the edge agent.
- **No calibration UX inline.** Editor expects `/api/calibration/<cameraId>` to already have an H matrix. If 404, the zone still saves but no `polygon_image` is auto-derived. Use existing `CalibrationView.jsx` to set up calibration first.
- **No edit-existing-zone mode yet.** v0 is create-only. Edit/delete come next.
- **No keyboard shortcuts.** TransformControls are mouse/touch only.

## Integration with existing frontend-v3

`ZoneEditor3D` is a full-screen component. Drop it into the `Zone Config` route as a "Create Zone (3D)" mode toggle, alongside the legacy `ZoneDrawer.jsx` for the transition period. After 30 days of stable v2 zone creation, deprecate `ZoneDrawer`.
