# Janus Architecture Design

**Date**: 2026-03-28
**Based on**: JANUS-AUDIT-REPORT.md (Phase 1) + JANUS-RESEARCH-REPORT.md (Phase 2)
**Status**: Phase 3 Complete — NO code changes made

---

## Table of Contents

1. [Target Architecture](#1-target-architecture)
2. [Component Change Plan](#2-component-change-plan)
3. [Database Migration Plan](#3-database-migration-plan)
4. [API Contract Changes](#4-api-contract-changes)
5. [Risk Assessment](#5-risk-assessment)
6. [Implementation Order](#6-implementation-order)

---

## 1. Target Architecture

### 1.1 System Diagram

```
CAMERA FEED
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  EDGE AGENT (Python)                                        │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ YOLO26-seg  │→ │ BoT-SORT     │→ │ Homography        │  │
│  │ (detect +   │  │ (BoxMOT)     │  │ Projection        │  │
│  │  segment)   │  │ with ReID    │  │ foot→world coords │  │
│  └─────────────┘  └──────────────┘  └───────┬───────────┘  │
│                                              │              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Zone Engine (point-in-polygon, world coordinates)   │    │
│  │ Entry/exit detection, dwell timing, zone transitions│    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
   ┌──────────────┐ ┌──────────┐ ┌──────────────────┐
   │ REST API     │ │ WebSocket│ │ Event Stream     │
   │ (events,    │ │ (live    │ │ (zone changes,   │
   │  sessions,  │ │  persons,│ │  entry/exit)     │
   │  analytics) │ │  masks)  │ │                  │
   └──────┬───────┘ └────┬─────┘ └────────┬─────────┘
          │              │               │
          ▼              ▼               ▼
┌───────────────────────────────────────────────────────┐
│  BACKEND (Flask → FastAPI migration path)             │
│                                                       │
│  ┌────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │ routes/    │  │ services/     │  │ models/      │ │
│  │ analytics  │  │ kpi_engine    │  │ db.py        │ │
│  │ video      │  │ zone_engine   │  │ schemas.py   │ │
│  │ batch      │  │ session_mgr   │  │ migrations/  │ │
│  │ calibrate  │  │ calibration   │  │              │ │
│  └────────────┘  └───────────────┘  └──────┬───────┘ │
└────────────────────────────────────────────┼─────────┘
                                             │
                                             ▼
┌───────────────────────────────────────────────────────┐
│  DATABASE (SQLite → PostgreSQL migration path)        │
│                                                       │
│  events | sessions | zones (+ polygon_world)          │
│  camera_calibration | batch_jobs | profile | counts   │
└───────────────────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────┐
│  FRONTEND (React + Three.js)                          │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Live Camera  │  │ Three.js 3D  │  │ Analytics   │ │
│  │ + Mask       │  │ Room View    │  │ Dashboard   │ │
│  │ Overlays     │  │ (real pos)   │  │             │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ BEV Heatmap  │  │ Calibration  │  │ Settings    │ │
│  │ (real data)  │  │ UI           │  │ (model,     │ │
│  │              │  │ (4-point)    │  │  tracker)   │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
└───────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Changes

| Aspect | Current | Target |
|--------|---------|--------|
| Detection | Bounding boxes only | Instance segmentation masks |
| Model | yolov8n (detect) | YOLO26n/s-seg (segment) |
| Tracking | ByteTrack (ReID off) | BoT-SORT via BoxMOT (ReID on) |
| Coordinates | Pixel-space | World-coordinate (meters) |
| Zones | Axis-aligned rectangles | Arbitrary polygons in world coords |
| 3D View | Simulated (random people) | Real positions via homography |
| Data Flow | HTTP polling | WebSocket streaming + REST |
| Backend | Single 2,631-line file | Modular routes/services/models |
| Frontend | 7 versions | Single version with theme system |

---

## 2. Component Change Plan

### 2.1 Edge Agent (`edge_agent/`)

**Current**: `edge_agent.py` (117 lines) — yolov8n detect → aggregate count → POST /count

**Target**: Expanded edge agent with full pipeline

| Change | Description | Files Affected |
|--------|-------------|---------------|
| Model swap | `yolov8n.pt` → `yolo26s-seg.pt` | edge_agent.py, edge_agent_enhanced.py |
| BoxMOT integration | Replace ultralytics built-in tracker with BoxMOT | New: requirements, tracker config |
| ReID enable | `with_reid: True` in BoT-SORT config | tracker config YAML |
| Mask output | Extract `results[0].masks.xy` polygon contours | edge_agent_enhanced.py |
| Homography | Foot-point → world coords via stored H matrix | New: homography.py |
| Zone engine | Point-in-polygon with world-coordinate zones | Refactor: Zone class → shared module |
| WebSocket | Stream person data (masks, world coords, track IDs) | New: websocket_server.py |
| Retry queue | Buffer events when backend is down | edge_agent_enhanced.py |

**New file structure**:
```
edge_agent/
├── edge_agent.py              # Simplified entry point
├── edge_agent_enhanced.py     # Full pipeline (modified)
├── batch_processor.py         # Batch processing (modified)
├── homography.py              # NEW: calibration + projection
├── zone_engine.py             # NEW: shared zone logic (polygon PIP)
├── websocket_server.py        # NEW: WebSocket streaming
├── zones.json                 # Zone definitions (world coords)
├── botsort_tuned.yaml         # NEW: custom tracker config (currently missing!)
├── requirements.txt           # Updated
└── video_streamer.py          # Existing
```

### 2.2 Backend (`backend/`)

**Current**: `main.py` (2,631 lines) — monolithic Flask app

**Target**: Modular Flask app with clear separation

**Split plan**:
```
backend/
├── app.py                     # Flask app factory, middleware, CORS
├── db.py                      # Database connection, migrations, schema
├── routes/
│   ├── __init__.py
│   ├── health.py              # /health
│   ├── data.py                # /count, /events, /sessions
│   ├── analytics.py           # /api/dwell-time, /api/occupancy, etc. (14 endpoints)
│   ├── deep_analytics.py      # /api/forecast, /api/customer-journey, etc. (8 endpoints)
│   ├── video.py               # /video/* (10 endpoints)
│   ├── batch.py               # /api/batch/* (4 endpoints)
│   ├── calibration.py         # NEW: /api/calibration/* (CRUD for camera calibration)
│   └── profile.py             # /api/profile (2 endpoints)
├── services/
│   ├── kpi_engine.py          # KPI calculation logic
│   ├── zone_engine.py         # Zone analytics (shared with edge_agent)
│   ├── session_manager.py     # Session lifecycle logic
│   └── calibration.py         # Homography storage/retrieval
├── models/
│   ├── schemas.py             # Request/response validation
│   └── migrations.py          # Schema migration system
├── requirements.txt
└── tests/
    ├── test_analytics.py
    ├── test_video.py
    ├── test_batch.py
    ├── test_calibration.py
    └── test_data.py
```

### 2.3 Frontend (`frontend-v3/` → `frontend/`)

**Current**: 7 frontend versions, v3 is primary (928-line LiveMonitor, 26MB build)

**Target**: Single frontend with theme system

| Change | Description |
|--------|-------------|
| Consolidate | Keep v3 as base, merge v1-v6 themes into theme switcher |
| Decompose LiveMonitor | Split into ~10 focused components |
| Fix build | Conditional ONNX/MediaPipe loading, fix empty chunks |
| YOLO26n-seg in browser | ONNX Runtime Web + WebGPU for browser detection |
| Mask rendering | Draw filled polygon contours on canvas overlay |
| Three.js 3D room | Replace simulated Tracking3DView with real Three.js room |
| Calibration UI | New page: click reference points + enter measurements |
| BEV heatmap | Connect to real spatial data from homography |
| WebSocket client | Real-time person data from edge agent |
| Zone editor | Draw polygon zones on floor plan |

**New component structure** (additions to v3):
```
src/
├── components/
│   ├── LiveMonitor/
│   │   ├── index.jsx          # Container
│   │   ├── KPICards.jsx       # KPI display
│   │   ├── ActivityFeed.jsx   # Event feed
│   │   ├── ViewModeTabs.jsx   # 2D/3D/ML tab switching
│   │   ├── PipelineSelector.jsx
│   │   ├── CapacityBar.jsx
│   │   └── TrendCharts.jsx
│   ├── Detection/
│   │   ├── YOLOSegDetection.jsx    # NEW: ONNX + WebGPU
│   │   ├── MaskRenderer.jsx         # NEW: body contour rendering
│   │   └── RealTimeDetection.jsx    # Existing (keep as fallback)
│   ├── Spatial/
│   │   ├── ThreeJSRoom.jsx          # NEW: Three.js 3D room
│   │   ├── BEVHeatmap.jsx           # NEW: real BEV from homography
│   │   └── CalibrationView.jsx      # NEW: 4-point calibration UI
│   └── Zones/
│       ├── ZoneEditor.jsx           # NEW: polygon zone drawing
│       └── ZoneOverlay.jsx          # NEW: zones on camera feed
├── hooks/
│   ├── useWebSocket.js              # NEW: WebSocket connection
│   └── useDetection.js              # NEW: ONNX inference hook
└── lib/
    ├── homography.js                # NEW: JS homography math
    └── pointInPolygon.js            # NEW: ray casting PIP
```

### 2.4 Tracking3DView → ThreeJSRoom

**Current** (`shared/Tracking3DView.jsx`, 558 lines):
- HTML5 Canvas with isometric projection
- Random person spawning (SPAWN_RATE=0.015)
- State machine: entering → browsing → checkout → exiting
- Hardcoded 5 zones in grid units
- Zero connection to real data

**Target** (`ThreeJSRoom.jsx`):
- Three.js WebGL renderer
- Room dimensions from camera_calibration table
- Person cylinders at real world coordinates (via WebSocket)
- Zone polygons rendered as semi-transparent floor overlays
- Smooth interpolation between position updates (Vector3.lerp)
- Orbit controls for camera manipulation
- BEV toggle (top-down view)

---

## 3. Database Migration Plan

### 3.1 New Tables

```sql
-- Camera calibration (homography + metadata)
CREATE TABLE camera_calibration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    camera_id TEXT NOT NULL UNIQUE,
    homography_matrix TEXT NOT NULL,       -- JSON: 3x3 matrix [[h00,h01,h02],[h10,h11,h12],[h20,h21,h22]]
    reference_points_image TEXT NOT NULL,   -- JSON: [{x,y},...] pixel coords
    reference_points_world TEXT NOT NULL,   -- JSON: [{x,y},...] meter coords
    room_width_m REAL,                     -- Room width in meters
    room_depth_m REAL,                     -- Room depth in meters
    camera_height_m REAL,                  -- Camera height from floor
    camera_angle_deg REAL,                 -- Camera angle from horizontal
    reprojection_error REAL,               -- Calibration quality metric
    calibrated_at TEXT NOT NULL DEFAULT (datetime('now')),
    notes TEXT
);
```

### 3.2 Schema Changes

```sql
-- Add geometry to zones table
ALTER TABLE zones ADD COLUMN polygon_world TEXT;    -- JSON: [{x,y},...] in meters
ALTER TABLE zones ADD COLUMN polygon_image TEXT;    -- JSON: [{x,y},...] in pixels (auto-projected from world via H_inv)
ALTER TABLE zones ADD COLUMN color TEXT DEFAULT '#3b82f6';  -- Display color

-- Add world coordinates to events
ALTER TABLE events ADD COLUMN world_x REAL;         -- X position in meters
ALTER TABLE events ADD COLUMN world_y REAL;         -- Y position in meters
ALTER TABLE events ADD COLUMN mask_polygon TEXT;     -- JSON: [{x,y},...] body contour pixels (optional)

-- Add world coordinates to sessions
ALTER TABLE sessions ADD COLUMN trajectory TEXT;     -- JSON: [{x,y,t},...] position history in meters

-- Add index for new columns
CREATE INDEX idx_events_world_pos ON events(world_x, world_y);
```

### 3.3 Migration Strategy

Replace current `try/except OperationalError` approach with a versioned migration system:

```python
# backend/models/migrations.py

MIGRATIONS = [
    {
        "version": 1,
        "description": "Initial schema (existing)",
        "sql": "-- already applied"
    },
    {
        "version": 2,
        "description": "Add camera calibration table",
        "sql": """
            CREATE TABLE IF NOT EXISTS camera_calibration (...);
        """
    },
    {
        "version": 3,
        "description": "Add geometry to zones",
        "sql": """
            ALTER TABLE zones ADD COLUMN polygon_world TEXT;
            ALTER TABLE zones ADD COLUMN polygon_image TEXT;
            ALTER TABLE zones ADD COLUMN color TEXT DEFAULT '#3b82f6';
        """
    },
    {
        "version": 4,
        "description": "Add world coordinates to events",
        "sql": """
            ALTER TABLE events ADD COLUMN world_x REAL;
            ALTER TABLE events ADD COLUMN world_y REAL;
            ALTER TABLE events ADD COLUMN mask_polygon TEXT;
        """
    },
    {
        "version": 5,
        "description": "Add trajectory to sessions",
        "sql": """
            ALTER TABLE sessions ADD COLUMN trajectory TEXT;
        """
    }
]

def apply_migrations(db_connection):
    """Apply pending migrations in order."""
    # Create schema_version table if not exists
    # Check current version
    # Apply each migration > current version
    # Update version number
```

### 3.4 Data Compatibility

- All new columns are nullable — existing data unaffected
- Old edge agents sending `/count` or `/events` without world coords continue to work
- Frontend gracefully handles missing calibration (shows pixel-based view)
- `counts` table preserved for backward compatibility (deprecated, not removed)

---

## 4. API Contract Changes

### 4.1 New Endpoints

```
# Camera Calibration
POST   /api/calibration              # Save calibration (reference points + H matrix)
GET    /api/calibration/:camera_id   # Get calibration for camera
PUT    /api/calibration/:camera_id   # Update calibration
DELETE /api/calibration/:camera_id   # Remove calibration

# Zone Management (enhanced)
PUT    /api/zones/:id/polygon        # Set world-coordinate polygon for zone
GET    /api/zones/:id/polygon        # Get zone polygon (world + projected image)
```

### 4.2 Modified Endpoints

```
# POST /events — add optional world coordinates
{
    "event_type": "zone_change",
    "person_id": "track_42",
    "zone_id": 3,
    "confidence": 0.87,
    "world_x": 4.2,         // NEW: meters from origin
    "world_y": 2.8,         // NEW: meters from origin
    "mask_polygon": [...]    // NEW: body contour pixels (optional)
}

# POST /sessions — add optional trajectory
{
    "person_id": "track_42",
    "entry_time": "...",
    "exit_time": "...",
    "dwell_seconds": 145,
    "zone_path": "[\"entrance\",\"main_floor\",\"checkout\"]",
    "converted": 1,
    "trajectory": [           // NEW: position history
        {"x": 1.2, "y": 3.4, "t": "2026-03-28T10:00:00Z"},
        {"x": 2.1, "y": 3.2, "t": "2026-03-28T10:00:05Z"}
    ]
}
```

### 4.3 WebSocket Protocol (New)

```
# Client connects to ws://localhost:8000/ws/live

# Server sends per-frame updates:
{
    "type": "frame_update",
    "timestamp": "2026-03-28T10:00:00.123Z",
    "persons": [
        {
            "track_id": 42,
            "bbox": [120, 80, 250, 380],           // [x1, y1, x2, y2] pixels
            "world_x": 4.2,                         // meters
            "world_y": 2.8,                         // meters
            "zone_id": 3,
            "confidence": 0.87,
            "mask_contour": [[120,80],[125,85],...], // body outline pixels (optional)
            "velocity": [0.3, -0.1]                  // m/s (optional)
        }
    ],
    "total_count": 12,
    "zone_counts": {"entrance": 2, "main_floor": 7, "checkout": 3}
}

# Server sends zone events:
{
    "type": "zone_event",
    "person_id": "track_42",
    "event": "zone_change",
    "from_zone": "main_floor",
    "to_zone": "checkout",
    "timestamp": "2026-03-28T10:00:05.456Z"
}
```

---

## 5. Risk Assessment

### 5.1 Per-Component Risk

| Component | Change Scope | Risk Level | Mitigation |
|---|---|---|---|
| `edge_agent.py` | Major rewrite → full pipeline | **High** | Keep old agent as fallback; feature flags |
| `main.py` | Split into modules | **Medium** | Automated tests before and after; endpoint-by-endpoint |
| `RealTimeDetection.jsx` | New ONNX inference | **High** | Keep COCO-SSD as fallback; feature toggle |
| `Tracking3DView.jsx` | Full replacement with Three.js | **High** | New component alongside old; gradual switch |
| `LiveMonitor.jsx` | Decomposition into sub-components | **Medium** | Visual regression tests; component-by-component |
| Zone system | Data model change (rect → polygon) | **Medium** | Backward-compatible (polygon nullable, rect preserved) |
| Heatmap | Connect to new data source | **Low** | New data additive; old mock data preserved |
| Database schema | New tables + columns | **Low** | All additions nullable; no destructive changes |
| Camera calibration | Entirely new feature | **Low** | New endpoint/UI; no impact on existing features |

### 5.2 Top Risks & Mitigations

**Risk 1: YOLO-seg model swap breaks inference pipeline**
- Mitigation: Segmentation models output boxes AND masks — bbox API is unchanged
- Test: Run both models side-by-side, verify box output matches

**Risk 2: BoxMOT integration has API incompatibilities**
- Mitigation: Keep ultralytics built-in tracker as fallback; BoxMOT is pip-installable
- Test: Run both trackers on same video, compare MOTA/IDF1

**Risk 3: WebGPU browser inference too slow on low-end devices**
- Mitigation: Feature detection → WebGPU if available, WASM fallback, server-side fallback
- Test: Benchmark on 3 device tiers before committing

**Risk 4: Backend split introduces regressions**
- Mitigation: Write endpoint tests BEFORE splitting; run after each module extraction
- Test: Full endpoint coverage with known inputs/outputs

**Risk 5: Three.js room view performance on complex scenes**
- Mitigation: Simple geometry (cylinders, flat polygons); instanced rendering for >20 people
- Test: Performance benchmark with 50 person markers

---

## 6. Implementation Order

### 6.1 Dependency Graph

```
                    ┌─────────────────┐
                    │  Sprint 1:      │
                    │  Foundation     │
                    │  (security +    │
                    │   code quality) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │  Sprint 2:   │ │ Sprint 2 │ │  Sprint 2:   │
     │  Detection   │ │ (cont):  │ │  Backend     │
     │  Upgrade     │ │ Zone     │ │  Split       │
     │  (YOLO-seg)  │ │ System   │ │              │
     └──────┬───────┘ └────┬─────┘ └──────┬───────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Sprint 3:       │
                  │  3D Spatial      │
                  │  (homography +   │
                  │   Three.js)      │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Sprint 4:       │
                  │  Tracking        │
                  │  Scale-Up        │
                  │  (BoxMOT + ReID) │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Sprint 5:       │
                  │  Polish &        │
                  │  Documentation   │
                  └──────────────────┘
```

### 6.2 Sprint Breakdown

**Sprint 1: Foundation Fixes** (from audit findings)
- [ ] Fix all P0 security issues (API key, debug mode, db rollback, upload limits)
- [ ] Fix P1 security issues (auth, CORS, path traversal)
- [ ] Split main.py into route modules
- [ ] Add migration system for DB schema changes
- [ ] Enable `PRAGMA foreign_keys = ON`
- [ ] Pin dependency versions, add lock files
- [ ] Remove dead frontend code (~2,500 lines)
- [ ] Set up pytest + vitest infrastructure
- [ ] Write baseline tests for existing endpoints
- [ ] **Checkpoint: all tests pass, nothing broken**

**Sprint 2: Detection Upgrade + Zone System**
- [ ] Swap edge_agent model: `yolov8n.pt` → `yolo26s-seg.pt`
- [ ] Create `botsort_tuned.yaml` with optimized parameters
- [ ] Output instance segmentation masks alongside bounding boxes
- [ ] Render body-contour overlays in frontend (semi-transparent polygons)
- [ ] Add geometry columns to zones table (polygon_world, polygon_image)
- [ ] Consolidate zone definitions to single source (backend DB)
- [ ] Implement point-in-polygon zone detection (ray casting)
- [ ] Add world_x, world_y columns to events table
- [ ] Write tests for new detection pipeline and zone system
- [ ] **Checkpoint: detection works, zones use polygons**

**Sprint 3: 3D Spatial Mapping**
- [ ] Create camera_calibration table
- [ ] Build CalibrationView.jsx (4-point click + measurement input)
- [ ] Implement homography computation (OpenCV in edge_agent, JS in frontend)
- [ ] Implement foot-point → world coordinate projection
- [ ] Build Three.js room visualization with real person positions
- [ ] Add WebSocket server for real-time person data streaming
- [ ] Connect BEV heatmap to real spatial data
- [ ] Write tests for calibration math and zone detection accuracy
- [ ] **Checkpoint: spatial accuracy within 30cm**

**Sprint 4: Tracking Scale-Up**
- [ ] Integrate BoxMOT framework for pluggable tracker selection
- [ ] Enable ReID in BoT-SORT config
- [ ] Increase track_buffer to 90 frames (3s @ 30fps)
- [ ] Test with 20, 30, 50 simulated people
- [ ] Benchmark MOTA/IDF1 with different tracker configs
- [ ] Write comprehensive E2E tests
- [ ] **Checkpoint: 50+ person tracking, measured accuracy**

**Sprint 5: Polish & Documentation**
- [ ] Camera placement guide per business environment
- [ ] Performance tuning based on benchmark results
- [ ] Error handling and edge case fixes
- [ ] Frontend accessibility (ARIA attributes, keyboard nav)
- [ ] Mobile-responsive CSS with clamp()
- [ ] Update CLAUDE.md, README, Obsidian docs
- [ ] Final E2E regression test pass
- [ ] **Checkpoint: full regression green**

---

## Appendix A: Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Detection model | YOLO26s-seg | Best speed/accuracy for real-time + crisper masks than YOLO11 |
| Batch model | YOLO26l-seg | Highest quality for offline processing |
| Browser model | YOLO26n-seg (ONNX + WebGPU) | 15-30 FPS achievable, smallest model |
| Tracker framework | BoxMOT | Pluggable (ByteTrack, BoT-SORT, DeepOCSORT, StrongSORT) |
| Spatial mapping | Homography (OpenCV) | 15-30cm accuracy, negligible compute, proven approach |
| Foot-point | Bbox bottom-center | Simplest, sufficient accuracy for homography |
| Zone geometry | World-coordinate polygons | Camera-independent, intuitive, multi-camera ready |
| 3D visualization | Three.js | Industry standard, WebGL, great ecosystem |
| Real-time transport | WebSocket | Low-latency push, built-in in modern browsers |
| Depth estimation | Depth Anything V2 Small (Phase 2) | Optional enhancement, not primary |
| Cloud services | None (stay local) | No cloud API provides instance seg + 3D |

## Appendix B: Estimated Model Sizes

| Component | Current Size | Target Size | Change |
|---|---|---|---|
| Edge agent model | ~6 MB (yolov8n.pt) | ~22 MB (yolo26s-seg.pt) | +16 MB |
| Browser model | ~4 MB (COCO-SSD) | ~11 MB (yolo26n-seg.onnx) | +7 MB |
| Batch model | ~50 MB (yolo11l.pt) | ~57 MB (yolo26l-seg.pt) | +7 MB |
| Frontend build | ~26 MB (broken chunks) | ~2-3 MB (fixed + conditional) | **-23 MB** |

---

*Architecture designed based on findings from 6 parallel audit/research agents.*
*No code changes have been made. This document is the blueprint for Phase 5 implementation.*
