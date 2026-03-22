# Janus — Floorplan Analysis & Polygonal Zone System

## Vision

Transform Janus from abstract zone labels ("Zone A", "entrance") into a spatial analytics platform where users upload their actual store floorplan, draw polygonal zones on it, calibrate cameras to the floorplan, and see real-time heatmaps and person tracking overlaid on their real space.

---

## Phase 1: Floorplan Upload & Polygon Zone Editor

### Goal
User can upload a floorplan image and draw polygonal zones on it with a visual canvas editor. Zones are saved to the database with full geometry.

### Backend Changes

**New table: `floorplans`**
```sql
CREATE TABLE floorplans (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  image_path    TEXT NOT NULL,        -- relative path to uploaded image
  width_px      INTEGER NOT NULL,     -- native image width
  height_px     INTEGER NOT NULL,     -- native image height
  scale_factor  REAL,                 -- optional: pixels per meter
  uploaded_at   TEXT NOT NULL
);
```

**New table: `zone_polygons`**
```sql
CREATE TABLE zone_polygons (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id       INTEGER NOT NULL,     -- FK to zones table
  floorplan_id  INTEGER NOT NULL,     -- FK to floorplans table
  vertices      TEXT NOT NULL,        -- JSON array of [x,y] pairs (pixel coords)
  color         TEXT DEFAULT '#3b82f6',
  opacity       REAL DEFAULT 0.3,
  created_at    TEXT NOT NULL,
  updated_at    TEXT,
  FOREIGN KEY (zone_id) REFERENCES zones(id),
  FOREIGN KEY (floorplan_id) REFERENCES floorplans(id)
);
```

**New endpoints:**
- `POST /api/floorplans` — upload floorplan image (multipart form)
- `GET /api/floorplans` — list all floorplans
- `GET /api/floorplans/:id` — get floorplan with its zone polygons
- `DELETE /api/floorplans/:id` — remove floorplan
- `POST /api/zones/:id/polygon` — save polygon vertices for a zone
- `PUT /api/zones/:id/polygon` — update polygon vertices
- `GET /api/floorplans/:id/zones` — get all zone polygons for a floorplan

**File storage:**
- Store uploads in `backend/uploads/floorplans/`
- Serve via Flask static route `/uploads/<path>`
- Accept PNG, JPG, SVG, PDF (convert PDF first page to PNG via Pillow)
- Max file size: 10MB

### Frontend: ZoneConfig Page Redesign

**Canvas-based polygon editor using HTML5 Canvas or a library:**

Options (pick one):
1. **react-konva** — React bindings for Konva.js canvas library. Best for this use case: supports polygons, drag handles, image backgrounds, zoom/pan.
2. **Fabric.js** — Full-featured canvas library. Heavier but more polygon editing built-in.
3. **Raw HTML5 Canvas + custom hooks** — Lightest, most control, more code.

**Recommendation: react-konva** — it has the best React integration, polygon support, and image layering.

**Editor UX flow:**
1. User uploads floorplan image → displayed as canvas background
2. Click "Add Zone" → enters polygon drawing mode
3. Click on canvas to place vertices → polygon preview drawn in real-time
4. Double-click or press Enter to close polygon
5. Name the zone, set type (entrance/checkout/display/queue), set capacity
6. Polygon appears filled with semi-transparent color
7. Click existing polygon to select → drag vertices to adjust
8. Right-click vertex to delete it
9. Drag entire polygon to reposition
10. "Save Layout" persists all zones to backend

**Editor features:**
- Zoom in/out (scroll wheel or +/- buttons)
- Pan (middle-click drag or spacebar+drag)
- Snap-to-grid toggle (optional)
- Undo/redo (Ctrl+Z/Ctrl+Y)
- Zone list sidebar showing all zones with color indicators
- Toggle zone visibility
- Zone opacity slider
- Measurement tool (if scale_factor is set, show dimensions in meters)

**Mobile considerations:**
- Touch-to-place vertices (long press to close polygon)
- Pinch-to-zoom on canvas
- Simplified toolbar
- This feature is primarily desktop — mobile can view but editing is desktop-focused

### Data Model Integration

Update existing `zones` table to optionally link to polygon:
```sql
ALTER TABLE zones ADD COLUMN has_polygon INTEGER DEFAULT 0;
```

When a polygon is saved for a zone, set `has_polygon = 1`. This lets the rest of the app know whether to show spatial data or just the abstract zone card.

---

## Phase 2: Camera Calibration & Homography

### Goal
User maps their camera's view to the floorplan so that tracked person coordinates (pixel x,y from camera) can be transformed to floorplan coordinates.

### Concepts

**Homography matrix**: A 3x3 transformation matrix that maps points from one plane (camera image) to another (floorplan). Requires minimum 4 corresponding point pairs.

**Calibration flow:**
1. Show camera view on left, floorplan on right (split screen)
2. User clicks a point on the camera view → then clicks the corresponding point on the floorplan
3. Repeat for at least 4 points (more = better accuracy)
4. Compute homography matrix using the point pairs
5. Show preview: overlay camera view warped onto floorplan
6. User accepts or adds more points to improve

### Backend Changes

**New table: `camera_calibrations`**
```sql
CREATE TABLE camera_calibrations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  camera_name     TEXT NOT NULL,
  floorplan_id    INTEGER NOT NULL,
  point_pairs     TEXT NOT NULL,       -- JSON: [[cam_x, cam_y, floor_x, floor_y], ...]
  homography      TEXT NOT NULL,       -- JSON: 3x3 matrix [[h11,h12,h13],[h21,h22,h23],[h31,h32,h33]]
  reprojection_error REAL,            -- accuracy metric (lower = better)
  calibrated_at   TEXT NOT NULL,
  FOREIGN KEY (floorplan_id) REFERENCES floorplans(id)
);
```

**New endpoints:**
- `POST /api/calibrations` — save calibration point pairs, compute and return homography
- `GET /api/calibrations/:camera_name` — get calibration for a camera
- `POST /api/calibrations/transform` — transform a batch of camera points to floorplan coordinates

**Homography computation (Python, backend):**
```python
import numpy as np

def compute_homography(point_pairs):
    """
    point_pairs: list of [cam_x, cam_y, floor_x, floor_y]
    Returns: 3x3 homography matrix
    """
    src = np.float32([[p[0], p[1]] for p in point_pairs])
    dst = np.float32([[p[2], p[3]] for p in point_pairs])

    # Use OpenCV if available, otherwise manual DLT
    try:
        import cv2
        H, mask = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
        return H.tolist()
    except ImportError:
        # Manual Direct Linear Transform (DLT) implementation
        return dlt_homography(src, dst)

def transform_point(H, x, y):
    """Transform camera point to floorplan point using homography."""
    p = np.array([x, y, 1.0])
    result = H @ p
    return (result[0] / result[2], result[1] / result[2])
```

**Dependencies to add:** `numpy`, `opencv-python-headless` (optional, for better RANSAC)

### Frontend: Calibration Page

New page or sub-tab of ZoneConfig:
- Split view: camera feed (left) + floorplan (right)
- Click-to-place numbered markers on both views
- Lines connecting corresponding points
- "Compute" button → sends pairs to backend → gets matrix back
- Preview mode: shows test grid warped from camera to floorplan
- Accuracy indicator (reprojection error in pixels)

---

## Phase 3: Real-Time Zone Hit-Testing

### Goal
When the edge agent tracks a person at camera coordinates (x, y), transform those coordinates to floorplan space and determine which zone polygon they're in.

### Point-in-Polygon Algorithm

```python
def point_in_polygon(x, y, vertices):
    """
    Ray casting algorithm for point-in-polygon test.
    vertices: list of [x, y] pairs forming the polygon.
    """
    n = len(vertices)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = vertices[i]
        xj, yj = vertices[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside
```

### Integration with Edge Agent

**Option A: Backend-side transformation (simpler)**
1. Edge agent sends raw camera coordinates in events: `{person_id, cam_x, cam_y, ...}`
2. Backend receives event, looks up active calibration
3. Transforms (cam_x, cam_y) → (floor_x, floor_y) via homography
4. Tests (floor_x, floor_y) against all zone polygons
5. Assigns zone_id to the event
6. Stores both raw and transformed coordinates

**Option B: Edge-side transformation (lower latency)**
1. Edge agent downloads calibration matrix and zone polygons on startup
2. Transforms and assigns zones locally
3. Sends events with zone_id already populated

**Recommendation: Option A** for now — keeps edge agent simple, all logic centralized.

### Backend Changes

**Add coordinate columns to events:**
```sql
ALTER TABLE events ADD COLUMN cam_x REAL;
ALTER TABLE events ADD COLUMN cam_y REAL;
ALTER TABLE events ADD COLUMN floor_x REAL;
ALTER TABLE events ADD COLUMN floor_y REAL;
```

**Modify POST /events handler:**
- Accept optional `cam_x`, `cam_y` in event payload
- If calibration exists, transform to floor coordinates
- Run point-in-polygon against all zone polygons
- Auto-assign `zone_id` based on which polygon contains the point
- Fall back to manual zone_id if no calibration

---

## Phase 4: Spatial Heatmap Visualization

### Goal
Show a heatmap overlaid on the floorplan showing where people spend time, high-traffic paths, and zone density.

### Backend: Heatmap Data Endpoint

`GET /api/floorplans/:id/heatmap?hours=24`

Returns a grid of density values:
```json
{
  "width": 100,
  "height": 75,
  "cell_size_px": 10,
  "grid": [[0, 0, 2, 5, 8, ...], ...],
  "max_value": 42
}
```

**Computation:** Bin all (floor_x, floor_y) events into a grid, count per cell, normalize.

### Frontend: Heatmap Overlay

- Canvas layer on top of floorplan image
- Color gradient: transparent (0) → blue → green → yellow → red (max)
- Gaussian blur for smooth appearance (not blocky cells)
- Time range selector (last hour, today, this week)
- Toggle heatmap on/off
- Animate heatmap over time (playback slider showing hourly patterns)

**Libraries:**
- **simpleheat** — lightweight canvas heatmap library (~3KB)
- **heatmap.js** — more features, slightly heavier
- Or custom Canvas 2D with radial gradients per point

### Additional Visualizations

- **Path traces**: Draw actual movement paths (connect sequential events per person_id) on the floorplan
- **Zone dwell bubbles**: Circle size proportional to avg dwell time per zone
- **Flow arrows**: Animated arrows showing dominant movement patterns between zones
- **Bottleneck indicators**: Highlight areas where people cluster/slow down

---

## Phase 5: Multi-Camera Support

### Goal
Support multiple cameras covering different (or overlapping) areas of the same floorplan.

### Challenges
- Each camera has its own calibration matrix
- Overlapping coverage: same person detected by multiple cameras
- Person re-identification across cameras (hardest problem in CV)

### Approach
- Each camera gets its own calibration entry
- Events tagged with `camera_id`
- For non-overlapping cameras: simple — each camera covers different zones
- For overlapping: use floorplan-space proximity to merge detections (if two cameras see a person at the same floorplan location within 2 seconds, merge into one track)

---

## Implementation Priority & Effort

| Phase | Effort | Dependencies | Priority |
|-------|--------|-------------|----------|
| 1. Floorplan + Polygon Editor | 3-4 days | react-konva | **HIGH** — foundational |
| 2. Camera Calibration | 2-3 days | numpy, Phase 1 | **HIGH** — required for real data |
| 3. Zone Hit-Testing | 1-2 days | Phase 1 + 2 | **HIGH** — core value |
| 4. Spatial Heatmap | 2-3 days | Phase 3 | MEDIUM — impressive demo |
| 5. Multi-Camera | 3-5 days | Phase 2 + 3 | LOW — future |

**Total estimated: 2-3 weeks of focused development**

## Tech Stack Additions

```
Frontend:
  react-konva          — canvas polygon editor
  konva                — underlying canvas library
  simpleheat           — heatmap rendering (Phase 4)

Backend:
  numpy                — homography math
  opencv-python-headless — RANSAC homography (optional, improves accuracy)
  Pillow               — PDF-to-image conversion for floorplan uploads
```

## File Structure (New)

```
backend/
├── uploads/
│   └── floorplans/          # Uploaded floorplan images
├── spatial.py               # Homography + point-in-polygon utilities

frontend-v3/src/
├── pages/
│   └── ZoneConfig.jsx       # Redesigned with canvas editor
├── components/
│   ├── FloorplanEditor.jsx  # Main canvas editor component
│   ├── PolygonDrawer.jsx    # Polygon creation/editing tool
│   ├── CalibrationView.jsx  # Camera-to-floorplan calibration
│   ├── FloorplanHeatmap.jsx # Heatmap overlay component
│   └── ZoneSidebar.jsx      # Zone list panel
```

---

## Phase 0: Beta Deployment Readiness (Before Floorplan Work)

### Goal
A real store owner can sign up, connect their security camera, and see real data — without touching a command line.

### 0.1 Authentication & Multi-Tenant

**User accounts:**
- Sign up / login (email + password, or OAuth with Google)
- JWT token-based auth for API
- Each user gets their own tenant (isolated data)
- Options: build custom, or use **Supabase Auth** (already in your stack)

**Database changes:**
- Add `user_id` foreign key to: `profile`, `sessions`, `events`, `zones`, `floorplans`
- All queries filtered by authenticated user's tenant
- Migrate from SQLite → **PostgreSQL** (Supabase provides this free)

**Effort:** 2-3 days

### 0.2 Camera Connection UI

**"Connect Camera" page in dashboard:**
- Input field for RTSP URL (e.g. `rtsp://192.168.1.100:554/stream`)
- Or upload a video file for batch processing
- "Test Connection" button — grabs a single frame, shows preview
- "Start Tracking" button — launches edge agent in background
- Status indicator: Connected / Processing / Error
- Stop/restart controls

**Backend:**
- `POST /api/cameras` — register camera with RTSP URL
- `POST /api/cameras/:id/start` — spawn edge agent subprocess
- `POST /api/cameras/:id/stop` — kill edge agent
- `GET /api/cameras/:id/status` — running, frame count, errors
- Store camera configs in DB, auto-restart on server reboot

**Effort:** 2-3 days

### 0.3 Cloud Deployment

**Options (cheapest to most robust):**

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **Railway.app** | Free tier → $5/mo | One-click deploy, Postgres included | Limited GPU |
| **Render** | Free tier → $7/mo | Auto-deploy from git, easy | No GPU |
| **DigitalOcean Droplet** | $12/mo | Full control, can add GPU later | Manual setup |
| **Supabase + Vercel** | Free tiers | You already use both | Edge agent needs a server |

**Recommended: DigitalOcean or Railway** — need a persistent server for the edge agent (can't run YOLO on serverless).

**Deployment checklist:**
- Dockerize backend + edge agent (Dockerfiles exist in plan already)
- Postgres connection string from environment
- CORS origins from environment variable
- HTTPS via reverse proxy (Caddy or nginx)
- File uploads to S3/R2 instead of local disk
- Process manager (systemd or PM2) for edge agent

**Effort:** 1-2 days

### 0.4 Onboarding Flow

First-time user experience:
1. Sign up → lands on empty dashboard
2. Guided setup wizard: "Name your store" → "Set capacity" → "Connect camera"
3. Option to load demo data to explore first
4. Once camera connected: "We're collecting data — check back in an hour for your first insights"

**Effort:** 1 day

### Updated Priority Order

| Phase | What | Effort | Priority |
|-------|------|--------|----------|
| **0.1** | Auth + multi-tenant + Postgres | 2-3 days | **CRITICAL** — blocks real users |
| **0.2** | Camera connection UI | 2-3 days | **CRITICAL** — blocks real data |
| **0.3** | Cloud deployment | 1-2 days | **CRITICAL** — blocks access |
| **0.4** | Onboarding wizard | 1 day | HIGH — first impression |
| 1 | Floorplan + polygon editor | 3-4 days | HIGH — core feature |
| 2 | Camera calibration | 2-3 days | HIGH — spatial accuracy |
| 3 | Zone hit-testing | 1-2 days | HIGH — core value |
| 4 | Spatial heatmap | 2-3 days | MEDIUM — wow factor |
| 5 | Multi-camera | 3-5 days | LOW — future |

**Total to real beta: ~2 weeks (Phase 0) + 2-3 weeks (Phases 1-4)**

---

## Open Questions for Planning Session

1. **Do you have actual floorplan images** to test with, or should we include a sample floorplan generator?
2. **Camera feed source**: Will calibration use a live camera feed, a screenshot, or a reference image?
3. **Scale**: Do you need real-world measurements (meters) or is pixel-space sufficient?
4. **Export**: Should zone configurations be exportable (JSON/SVG) for use in other tools?
5. **Templates**: Should we include preset zone templates (standard retail layout, restaurant, office)?
