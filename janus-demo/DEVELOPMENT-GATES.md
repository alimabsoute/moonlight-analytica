# Janus Development Gates

**Iron Rule: NO gate is passed until EVERY test in that gate is green. NO exceptions.**

Each gate has: (1) tasks, (2) tests to write, (3) pass criteria, (4) checkpoint commit + tag.

---

## Sprint 1: Foundation (Security + Code Quality + Test Infrastructure)

### Gate 1.1 — Security Fixes
**Tasks:**
- [ ] Rotate/remove Roboflow API key from `edge_agent/.env`
- [ ] Add `*.env` to `.gitignore` (verify it's there)
- [ ] Change `debug=True` to `debug=False` in `main.py` line 2631
- [ ] Fix `db()` context manager: rollback on exception, commit only on success
- [ ] Add 50MB file upload size limit to `/video/upload` and `/video/library/upload`
- [ ] Restrict inference server CORS from `*` to `localhost:3001-3006,5173,8000`

**Tests to write:**
- `test_db.py::test_rollback_on_error` — Insert bad data, verify no partial commit
- `test_db.py::test_wal_mode_enabled` — `PRAGMA journal_mode` returns `wal`
- `test_health.py::test_health_returns_ok` — GET /health returns 200 + `{ok: true}`
- `test_data.py::test_upload_size_limit` — Upload >50MB returns 413

**Pass criteria:** All 4 tests green. No exposed secrets in working tree.
**Tag:** `gate-1.1-security`

---

### Gate 1.2 — Test Infrastructure Setup
**Tasks:**
- [ ] Create `backend/tests/conftest.py` with fixtures (test client, in-memory DB, seed data)
- [ ] Create `backend/tests/__init__.py`
- [ ] Add `pytest`, `pytest-cov` to `backend/requirements.txt`
- [ ] Create `edge_agent/tests/conftest.py` with fixtures
- [ ] Create `edge_agent/tests/__init__.py`
- [ ] Verify `cd backend && python -m pytest tests/ -v` runs clean
- [ ] Verify `cd edge_agent && python -m pytest tests/ -v` runs clean

**Tests to write:**
- `conftest.py` fixture tests — verify test client works, DB is in-memory, seed data loads

**Pass criteria:** `pytest` runs in both backend and edge_agent with 0 errors. Fixtures work.
**Tag:** `gate-1.2-test-infra`

---

### Gate 1.3 — Baseline Backend Tests (Existing Functionality)
**Tasks:**
- [ ] Write tests for ALL 7 core endpoints (/health, /seed_demo, /count, /kpis, /series.csv, /events, /sessions)
- [ ] Write tests for ALL 14 analytics endpoints
- [ ] Write tests for ALL 8 deep analytics endpoints
- [ ] Write tests for profile endpoints (GET/PUT)
- [ ] Fix existing `test_video_endpoints.py` — health check asserts `{ok: true}` not `{status: ...}`

**Tests to write (minimum 35):**
- `test_health.py` — 1 test
- `test_data.py` — 6 tests (count, events CRUD, sessions CRUD)
- `test_analytics.py` — 14 tests (one per endpoint, with seeded data)
- `test_deep_analytics.py` — 8 tests (one per endpoint)
- `test_profile.py` — 3 tests (get, update, get-after-update)
- `test_video.py` — 3 tests (fix existing)

**Pass criteria:** 35+ tests green. Coverage >50% on main.py.
**Tag:** `gate-1.3-baseline-tests`

---

### Gate 1.4 — Backend Modularization
**Tasks:**
- [ ] Split `main.py` into modules: `app.py`, `db.py`, `routes/health.py`, `routes/data.py`, `routes/analytics.py`, `routes/deep_analytics.py`, `routes/video.py`, `routes/batch.py`, `routes/profile.py`
- [ ] Extract repeated helpers: `parse_hours()`, `source_filter()`, `get_time_window()`
- [ ] Move DB schema + connection management to `db.py`
- [ ] Keep `main.py` as thin entry point that imports app

**Tests to write:** None new — rerun ALL Gate 1.3 tests.

**Pass criteria:** ALL 35+ baseline tests still pass after split. Zero regressions. Every endpoint returns identical responses.
**Tag:** `gate-1.4-backend-split`

---

### Gate 1.5 — Dependency Cleanup
**Tasks:**
- [ ] Pin all Python dependency versions (exact pins, not `>=`)
- [ ] Create `botsort_tuned.yaml` (currently referenced but missing — falls back silently)
- [ ] Remove dead frontend code: `RealTimeDetectionV2.jsx`, `YouTubeTrackingView.jsx`, `tracking3d/`
- [ ] Fix `totalExits: 0` hardcoded in `RealTimeDetection.jsx` and `RealTimeDetectionEnhanced.jsx`
- [ ] Enable `PRAGMA foreign_keys = ON` in db connection

**Tests to write:**
- `test_db.py::test_foreign_keys_enabled` — PRAGMA returns 1

**Pass criteria:** All prior tests + new test green. Dead code removed. Deps pinned.
**Tag:** `gate-1.5-cleanup`

---

### Gate 1.6 — Sprint 1 Checkpoint
**Tasks:**
- [ ] Run FULL test suite (backend + edge_agent + frontend if any)
- [ ] Record test counts: X passed, Y skipped, 0 failed
- [ ] Review all changes since gate-1.1

**Pass criteria:** ALL tests green. Zero regressions from any gate. Clean `git status` (no uncommitted changes).
**Tag:** `gate-1.6-sprint1-complete`

---

## Sprint 2: Detection Upgrade + Zone System

### Gate 2.1 — Validate RF-DETR + ByteTrack Pipeline (Edge Agent)
**Note:** YOLO → RF-DETR migration was completed in the 2026-03-31 session. This gate
validates the new pipeline with proper tests. RF-DETR is detection-only (no masks);
Gate 2.3 is updated accordingly.

**Tasks:**
- [x] Migrate edge_agent to RF-DETR-Nano + ByteTrackTracker (done 2026-03-31)
- [x] Migrate batch_processor to RF-DETR-Nano + ByteTrack (done 2026-03-31)
- [x] Migrate video_streamer to RF-DETR + Supervision annotators (done 2026-03-31)
- [ ] Create `edge_agent/tests/conftest.py` with test fixtures
- [ ] Write RF-DETR pipeline tests

**Tests to write:**
- `test_detection.py::test_model_loads` — RFDETRNano() loads without error
- `test_detection.py::test_detections_have_xyxy` — Output has xyxy bounding boxes
- `test_detection.py::test_detections_have_class_id` — Output has class_id array
- `test_detection.py::test_person_class_filter` — class_id==1 filter returns only persons
- `test_tracking.py::test_tracker_assigns_ids` — ByteTrackTracker assigns tracker_id
- `test_tracking.py::test_tracker_deduplicates` — Same person counts once not twice

**Pass criteria:** 6 new edge agent tests green + all Sprint 1 backend tests still green.
**Tag:** `gate-2.1-rfdetr-validated`

---

### Gate 2.2 — Zone System Upgrade (Backend)
**Tasks:**
- [ ] Add `polygon_world`, `polygon_image`, `color` columns to zones table
- [ ] Add `world_x`, `world_y` columns to events table (no mask_polygon — RF-DETR is bbox-only)
- [ ] Add `trajectory` column to sessions table
- [ ] Add versioned migration system (`backend/models/migrations.py`)
- [ ] Implement point-in-polygon (ray casting) in shared zone engine

**Tests to write:**
- `test_zones.py::test_point_in_rectangle` — Known inside point
- `test_zones.py::test_point_outside_rectangle` — Known outside point
- `test_zones.py::test_point_in_irregular_polygon` — L-shaped polygon
- `test_zones.py::test_point_in_concave_polygon` — Concave shape
- `test_zones.py::test_zone_transition_detected` — Person crosses zone boundary
- `test_db.py::test_migrations_apply` — All migrations run without error
- `test_db.py::test_new_columns_exist` — polygon_world, world_x etc. exist

**Pass criteria:** 7 new tests green + ALL prior tests still green.
**Tag:** `gate-2.2-zone-upgrade`

---

### Gate 2.3 — Zone Overlay (Frontend)
**Note:** RF-DETR produces bboxes, not segmentation masks. This gate replaces "mask
rendering" with zone polygon visualization — drawing configurable zone boundaries on the
canvas feed with per-zone occupancy labels.

**Tasks:**
- [ ] Create `ZoneOverlay.jsx` — draws named polygon zones on canvas
- [ ] Integrate with LiveMonitor camera feed overlay
- [ ] Per-zone color fills (semi-transparent) with zone name + count labels
- [ ] Loads zone definitions from backend `/api/zones` endpoint

**Tests to write:**
- `ZoneOverlay.test.jsx::renders_without_crash` — Component renders without error
- `ZoneOverlay.test.jsx::renders_zone_polygons` — Given zone data, draws polygons

**Pass criteria:** 2 new tests green + ALL prior tests green.
**Tag:** `gate-2.3-zone-overlay`

---

### Gate 2.4 — Consolidate Zone Definitions
**Tasks:**
- [ ] Single source of truth for zones: backend DB with geometry
- [ ] API endpoint to get zones with polygons
- [ ] Edge agent reads zones from backend API (not local zones.json)
- [ ] Frontend reads zones from backend API

**Tests to write:**
- `test_zones.py::test_create_zone_with_polygon` — POST zone with polygon_world
- `test_zones.py::test_get_zone_returns_polygon` — GET includes geometry

**Pass criteria:** 2 new tests green + ALL prior tests green.
**Tag:** `gate-2.4-zone-consolidation`

---

### Gate 2.5 — Sprint 2 Checkpoint
**Tasks:**
- [ ] Run FULL test suite
- [ ] Test detection on 3 YouTube videos (eye-level, angled, crowded)
- [ ] Verify zone overlays render correctly in browser
- [ ] Record: detection FPS, mask quality assessment, test counts

**Pass criteria:** ALL tests green. Detection works on test videos. Masks visible.
**Tag:** `gate-2.5-sprint2-complete`

---

## Sprint 3: 3D Spatial Mapping

### Gate 3.1 — Camera Calibration Backend
**Tasks:**
- [ ] Create `camera_calibration` table
- [ ] CRUD endpoints: POST/GET/PUT/DELETE `/api/calibration/:camera_id`
- [ ] Compute homography matrix from reference points (OpenCV)
- [ ] Store H matrix + metadata per camera

**Tests to write:**
- `test_calibration.py::test_save_calibration` — POST with 4 reference points
- `test_calibration.py::test_get_calibration` — GET returns stored H matrix
- `test_calibration.py::test_known_projection` — pixel→world matches expected
- `test_calibration.py::test_roundtrip_projection` — world→pixel→world within tolerance
- `test_calibration.py::test_reprojection_error` — Error < 5 pixels for calibration points

**Pass criteria:** 5 new tests green + ALL prior tests green.
**Tag:** `gate-3.1-calibration-backend`

---

### Gate 3.2 — Homography in Edge Agent
**Tasks:**
- [ ] Load H matrix from backend on startup
- [ ] Extract foot-point (bbox bottom-center) per person
- [ ] Project foot-point → world coordinates via H
- [ ] Include world_x, world_y in event posts
- [ ] Zone detection uses world-coordinate polygons + PIP

**Tests to write:**
- `test_homography.py::test_foot_point_extraction` — bbox → correct foot point
- `test_homography.py::test_world_projection` — known pixel → correct meters (±30cm)
- `test_homography.py::test_zone_detection_world_coords` — person in zone detected correctly

**Pass criteria:** 3 new tests green + ALL prior tests green.
**Tag:** `gate-3.2-homography-edge`

---

### Gate 3.3 — Calibration UI (Frontend)
**Tasks:**
- [ ] Build `CalibrationView.jsx` — click 4+ points on camera feed
- [ ] Input fields for world-coordinate measurements
- [ ] Display reprojection error after calibration
- [ ] Save to backend via POST /api/calibration

**Tests to write:**
- `CalibrationView.test.jsx::renders_without_crash`
- `CalibrationView.test.jsx::allows_point_selection`

**Pass criteria:** 2 new tests green + ALL prior tests green.
**Tag:** `gate-3.3-calibration-ui`

---

### Gate 3.4 — Three.js Room Visualization
**Tasks:**
- [ ] Build `ThreeJSRoom.jsx` with Three.js renderer
- [ ] Floor plane from room dimensions (meters)
- [ ] Zone overlays as colored transparent polygons
- [ ] Person markers (cylinders) at world coordinates
- [ ] WebSocket connection for real-time position updates
- [ ] Smooth interpolation (Vector3.lerp)

**Tests to write:**
- `ThreeJSRoom.test.jsx::renders_webgl_canvas`
- `ThreeJSRoom.test.jsx::renders_zone_overlays`

**Pass criteria:** 2 new tests green + ALL prior tests green.
**Tag:** `gate-3.4-threejs-room`

---

### Gate 3.5 — Sprint 3 Checkpoint
**Tasks:**
- [ ] Run FULL test suite
- [ ] End-to-end test: video → edge agent → calibrated world coords → 3D room view
- [ ] Measure spatial accuracy: verify positions within 30cm of expected
- [ ] Record: calibration reprojection error, position accuracy, test counts

**Pass criteria:** ALL tests green. Spatial accuracy < 30cm. 3D room shows real positions.
**Tag:** `gate-3.5-sprint3-complete`

---

## Sprint 4: Tracking Scale-Up

### Gate 4.1 — BoxMOT Integration
**Tasks:**
- [ ] Install BoxMOT, configure as tracker backend
- [ ] Enable ReID in BoT-SORT config (`with_reid: True`)
- [ ] Increase track_buffer to 90 frames

**Tests to write:**
- `test_tracking.py::test_track_id_persists` — Same person keeps ID across frames
- `test_tracking.py::test_two_people_different_ids` — Distinct IDs
- `test_tracking.py::test_track_survives_occlusion` — ID maintained after brief loss

**Pass criteria:** 3 new tests green + ALL prior tests green.
**Tag:** `gate-4.1-boxmot`

---

### Gate 4.2 — Scale Testing
**Tasks:**
- [ ] Test with 10, 20, 50 simulated/real people
- [ ] Benchmark: MOTA, IDF1, ID switches per video
- [ ] Record performance: FPS at each person count
- [ ] Identify breaking point

**Tests to write:**
- `bench_tracking.py` — Performance benchmark (not pass/fail, but recorded)

**Pass criteria:** ALL prior tests green. Benchmarks recorded. System handles 20+ people.
**Tag:** `gate-4.2-scale-test`

---

### Gate 4.3 — BEV Heatmap + WebSocket
**Tasks:**
- [ ] WebSocket server in backend for real-time person data
- [ ] Connect BEV heatmap to real spatial data (accumulated positions)
- [ ] Frontend WebSocket client hook

**Tests to write:**
- `test_websocket.py::test_connection` — Client connects successfully
- `test_websocket.py::test_receives_frame_update` — Gets person data

**Pass criteria:** 2 new tests green + ALL prior tests green.
**Tag:** `gate-4.3-websocket-heatmap`

---

### Gate 4.4 — Sprint 4 Checkpoint
**Pass criteria:** ALL tests green. 20+ people tracked. WebSocket streaming works. Heatmap reflects real data.
**Tag:** `gate-4.4-sprint4-complete`

---

## Sprint 5: Polish & Documentation

### Gate 5.1 — Error Handling & Edge Cases
- [ ] Add rate limiting to write endpoints
- [ ] Add request validation schemas
- [ ] Add structured logging (replace print statements)
- [ ] Handle edge cases: empty DB, no calibration, no zones

### Gate 5.2 — Frontend Polish
- [ ] Decompose LiveMonitor.jsx into sub-components
- [ ] Add ARIA attributes for accessibility
- [ ] Add responsive CSS with clamp() for mobile
- [ ] Fix 26MB build (conditional ONNX loading)

### Gate 5.3 — Final Regression
- [ ] Run FULL test suite
- [ ] Run ALL benchmarks
- [ ] Record final numbers vs Sprint 1 baseline
- [ ] Update all documentation (CLAUDE.md, README, Obsidian)

**Pass criteria:** ALL tests green. ALL benchmarks recorded. Documentation current.
**Tag:** `gate-5.3-project-complete`

---

## Test Count Tracking

Record after each gate:

| Gate | Backend | Edge | Frontend | Integration | Total | Coverage |
|------|---------|------|----------|-------------|-------|----------|
| 1.1 | 4 | 0 | 0 | 0 | 4 | — |
| 1.2 | 4 | 0 | 0 | 0 | 4 | — |
| 1.3 | 35+ | 0 | 0 | 0 | 35+ | >50% |
| 1.4 | 35+ | 0 | 0 | 0 | 35+ | >50% |
| 1.5 | 36+ | 0 | 0 | 0 | 36+ | >50% |
| 1.6 | 36+ | 0 | 0 | 0 | 36+ | >50% |
| 2.1 | 36+ | 4 | 0 | 0 | 40+ | >55% |
| 2.2 | 43+ | 4 | 0 | 0 | 47+ | >60% |
| 2.3 | 43+ | 4 | 2 | 0 | 49+ | >60% |
| 2.5 | 45+ | 4 | 2 | 0 | 51+ | >60% |
| 3.1 | 102 | 29 | 4 | 0 | 135 | — |
| 3.2 | 102 | 29 | 4 | 0 | 135 | — |
| 3.3 | 102 | 29 | 8 | 0 | 139 | — |
| 3.4 | 102 | 29 | 12 | 0 | 143 | — |
| 3.5 | 102 | 29 | 12 | 0 | 143 | — |
| 4.1 | 102 | 35 | 12 | 0 | 149 | — |
| 4.2 | 102 | 35 | 12 | 0 | 149 | — |
| 4.3 | 108 | 35 | 12 | 0 | 155 | — |
| 4.4 | 108 | 35 | 12 | 0 | 155 | — |
| 5.3 | 55+ | 10 | 8 | 5 | 78+ | >75% |

## Rollback Procedure

If any gate introduces a regression:
```bash
# Find the last good gate tag
git tag -l "gate-*"

# Reset to last good gate
git stash                           # Save current work
git checkout gate-X.Y               # Go to last good state
git checkout -b fix/gate-regression  # Branch for the fix

# After fixing:
git checkout feature/toolset-enhancement
git stash pop
# Apply fix, rerun tests
```
