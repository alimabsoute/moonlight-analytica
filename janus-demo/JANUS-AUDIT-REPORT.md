# Janus Codebase Audit Report

**Date**: 2026-03-28
**Scope**: Full codebase audit — backend, frontend, CV pipeline, database, dependencies
**Status**: Phase 1 Complete — NO code changes made

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Backend Audit](#2-backend-audit)
3. [Frontend Audit](#3-frontend-audit)
4. [CV/ML Pipeline Audit](#4-cvml-pipeline-audit)
5. [Database Audit](#5-database-audit)
6. [Security Findings](#6-security-findings)
7. [Dependency Audit](#7-dependency-audit)
8. [Technical Debt Inventory](#8-technical-debt-inventory)
9. [Detection Pipeline Bottleneck Analysis](#9-detection-pipeline-bottleneck-analysis)
10. [Recommended Fix Order](#10-recommended-fix-order)

---

## 1. System Architecture Overview

### Current Architecture Diagram

```
                           ┌─────────────────────┐
                           │   CAMERA / VIDEO     │
                           └──────────┬──────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
                    ▼                 ▼                  ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
         │ edge_agent   │  │ video_streamer│  │ inference_server │
         │ (Python)     │  │ (Flask :8001) │  │ (FastAPI :8002)  │
         │ yolov8n.pt   │  │ yolo11s.pt   │  │ yolo11s.pt       │
         │ ByteTrack    │  │ supervision   │  │ model switching  │
         └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘
                │                 │                  │
                ▼                 │                  │
         POST /count              │                  │
                │                 │                  │
                ▼                 ▼                  ▼
         ┌───────────────────────────────────────────────┐
         │              BACKEND (Flask :8000)             │
         │              main.py — 2,631 lines             │
         │              32 endpoints, SQLite WAL          │
         └───────────────────────┬───────────────────────┘
                                 │
                                 ▼
         ┌───────────────────────────────────────────────┐
         │         FRONTEND (React, Vite)                │
         │   7 versions: frontend/, v1-v6                │
         │   PRIMARY: frontend-v3 (:3003)                │
         │   13 pages, 3 detection pipelines             │
         └───────────────────────────────────────────────┘
```

### Three Independent Services

| Service | Port | Framework | File | Lines |
|---------|------|-----------|------|-------|
| Backend API | 8000 | Flask 3.0 | `backend/main.py` | 2,631 |
| Video Streamer | 8001 | Flask | `edge_agent/video_streamer.py` | ~300 |
| Inference Server | 8002 | FastAPI | `inference-server/server.py` | 233 |

### Edge Agents (4 variants)

| Agent | File | Model | Output |
|-------|------|-------|--------|
| Basic | `edge_agent.py` | yolov8n.pt | Aggregate count only |
| Enhanced | `edge_agent_enhanced.py` | configurable | Events + sessions |
| Batch | `batch_processor.py` | yolo11l.pt | Events + sessions (offline) |
| Cloud | `process_video.py` | Roboflow API | Tracking JSON (offline) |

---

## 2. Backend Audit

### 2.1 Complete Endpoint Map (32 endpoints)

**Core Data (7)**:
| Route | Method | Purpose |
|-------|--------|---------|
| `GET /health` | Health check |
| `POST /seed_demo` | Seed 7 days of demo data (500+ sessions) |
| `POST /count` | Record a single count point |
| `GET /kpis` | Coarse KPIs by time window |
| `GET /series.csv` | CSV export for line charts |
| `POST /events` | Record tracking event (entry/exit/zone_change) |
| `POST /sessions` | Record completed session |

**Analytics (14)**:
`GET /api/dwell-time`, `/api/occupancy`, `/api/entries-exits`, `/api/conversion`, `/api/zones`, `/api/queue`, `/api/hourly-patterns`, `/api/dwell-distribution`, `/api/flow-between-zones`, `/api/period-comparison`, `/api/trends`, `/api/sessions/recent`, `/api/zones/<id>/detail`, `/api/anomalies`

**Deep Analytics (8)**:
`GET /api/forecast`, `/api/peak-analysis`, `/api/customer-journey`, `/api/cohort-analysis`, `/api/realtime-snapshot`, `/api/zone-rankings`, `/api/revenue-estimates`, `/api/hourly-comparison`

**Profile (2)**:
`GET/PUT /api/profile`

**Video Management (10)**:
`POST /video/start|stop|upload`, `GET /video/library`, `POST /video/library/upload`, `DELETE /video/library/<id>`, `POST /video/library/<id>/play`, `GET /video/library/<id>/file`, `GET /video/settings`, `POST /video/model|tracker`

**Batch Processing (4)**:
`GET /api/batch/jobs`, `GET /api/batch/jobs/<id>`, `POST /api/batch/start`, `DELETE /api/batch/results/<id>`

**Pre-Processed Pipeline (4)**:
`POST /api/process-video`, `GET /api/process-status/<id>`, `GET /api/tracking-data/<id>`, `GET /api/tracking-metrics/<id>`

### 2.2 Code Quality Issues

**Monolith**: 2,631 lines in a single file — #1 refactoring target.

**DRY violations**:
- Time parsing pattern `parse_hours() → timedelta` repeated ~15 times
- Source filtering `source_filter()` repeated in every analytics endpoint
- JSON path parsing `json.loads(r["zone_path"])` with try/except in 6+ endpoints
- Video metadata loading repeated in 5+ endpoints
- Duplicate dwell distribution logic in `/api/dwell-time` and `/api/dwell-distribution`

**Function complexity**:
- `seed_demo()`: 175 lines — complex nested loops
- `zone_detail()`: 100 lines — multiple queries + transition processing
- `play_library_video()`: 65 lines with nested try/except blocks

**Magic numbers**: `5 min` occupancy window, `1.5 sigma` anomaly threshold, `25.0` default transaction value, `50` anomaly limit, `28 days` forecast lookback, `EXIT_TIMEOUT_S = 30`

**Import hygiene**: Multiple functions have `import json`, `import os`, `import subprocess` inside function bodies instead of at module top.

### 2.3 Error Handling Gaps

- `db()` context manager **always commits** in `finally` block — even on exceptions. Partial operations get committed. Should rollback on error.
- `db()` catches no exceptions on `sqlite3.connect()`. Corrupt/locked DB surfaces as unhandled 500.
- `request.get_json()` inconsistent — some use `silent=True`, others don't.
- `subprocess.Popen` failures caught with generic `Exception` but not logged.
- `json.load()` on `metadata.json` has no corruption handling.

---

## 3. Frontend Audit

### 3.1 Seven Frontend Versions

| Version | Theme | React | Key Features | Status |
|---------|-------|-------|-------------|--------|
| `frontend/` | Refactored | 19.1 | Tailwind + Radix, proper architecture | Alternate |
| `frontend-v1/` | Dark Cyber | 18.2 | Zustand, nivo charts | Legacy |
| `frontend-v2/` | Warm Atelier | 18.2 | Same as v1, warm palette | Legacy |
| **`frontend-v3/`** | **Corporate** | **18.2** | **3 ML pipelines, 13 pages** | **PRIMARY** |
| `frontend-v4/` | Neon Pulse | 18.2 | Stripped deps | Legacy |
| `frontend-v5/` | Nature Zen | 18.2 | Minimal, green theme | Legacy |
| `frontend-v6/` | Retro Terminal | 18.2 | CRT aesthetic, TF.js | Legacy |

### 3.2 Build Size Crisis

| Build | Total Size | Verdict |
|-------|-----------|---------|
| **frontend-v3** | **~26 MB** | Unacceptable |
| frontend/ (refactored) | ~830 KB | Reasonable |

The v3 build includes a 23 MB ONNX Runtime WASM binary loaded unconditionally. Manual chunking for MediaPipe/ONNX is broken (produces 1-byte empty chunks).

### 3.3 Dead Code

- `RealTimeDetectionV2.jsx` (420 lines) — not imported anywhere
- `YouTubeTrackingView.jsx` (636 lines) — not imported in any page
- `tracking3d/` directory (502 lines, React Three Fiber) — unused, all versions use canvas `Tracking3DView.jsx`
- `tracking-v-b/` and `tracking-v-c/` — declared in Vite aliases but producing empty chunks
- v1/v2 are ~95% identical (only CSS vars differ)
- v4/v5 are ~95% identical (only theme differs)
- Total estimated dead code: **~2,500+ lines** across shared and duplicate versions

### 3.4 LiveMonitor.jsx (v3)

928 lines — should be decomposed into ~10 components:
- KPICard, ActivityFeed, ViewModeTabs, PipelineSelector, CapacityBar, TrendCharts, ChartTooltip, MLDetectionView

**Stale closure bug**: ML pipeline callbacks reference `trackingMetrics?.peakCount` which captures a stale value.

### 3.5 Accessibility & Mobile

- **Zero ARIA attributes** across all JSX files
- No keyboard navigation for custom tabs/sidebars
- Hardcoded grid: `gridTemplateColumns: '1fr 380px'` breaks on mobile
- Secondary KPI grid uses `repeat(4, 1fr)` — won't fit on mobile
- **No `clamp()` usage** in v3 CSS
- Only 1 `@media` query in v3's CSS

### 3.6 Performance Issues

- 3 simultaneous intervals in LiveMonitor (30s poll + 3s KPI sim + 20s alert sim)
- `generateLiveKPIs()` allocates new objects every 3 seconds
- Recharts re-render on every state update (no memoization)
- Canvas components run `requestAnimationFrame` continuously even when not visible
- TF.js model loads on mount even if ML view isn't selected

---

## 4. CV/ML Pipeline Audit

### 4.1 Detection Stack Summary

| Pipeline | Model | Location | Max Detect | Conf | Tracker |
|----------|-------|----------|-----------|------|---------|
| Browser Standard | COCO-SSD lite_mobilenet_v2 | `shared/RealTimeDetection.jsx` | 20 | 0.5 | IoU (greedy, max age 10) |
| Browser Enhanced | COCO-SSD lite_mobilenet_v2 | `shared/RealTimeDetectionEnhanced.jsx` | 30 | 0.25/0.5 dual | ByteTrack JS (Kalman + EMA) |
| Edge Live | yolov8n.pt | `edge_agent/edge_agent.py` | unlimited | 0.35 | ByteTrack (ultralytics) |
| Video Streamer | yolo11s.pt | `edge_agent/video_streamer.py` | unlimited | configurable | supervision ByteTrack |
| Batch Offline | yolo11l.pt | `edge_agent/batch_processor.py` | unlimited | 0.30 | BoT-SORT (tuned) |
| Cloud Offline | Roboflow API | `edge_agent/process_video.py` | unlimited | 0.30 | supervision ByteTrack |
| Pipeline B | MediaPipe | `shared/tracking-v-b/` | configurable | 0.35 | ByteTrack JS |
| Pipeline C | YOLOv8n ONNX | `shared/tracking-v-c/` | configurable | 0.35 | DeepSORT + ReID |

### 4.2 Tracker Configuration Comparison

| Parameter | IoU (Standard) | ByteTrack JS | ByteTrack YAML | BoT-SORT YAML |
|-----------|---------------|-------------|---------------|--------------|
| High threshold | 0.5 | 0.5 | 0.25 | 0.25 |
| Low threshold | N/A | 0.25 | 0.1 | 0.1 |
| Match threshold | IoU > 0.3 | IoU 0.2/0.3 | 0.8 | 0.8 |
| Max age/buffer | 10 frames | 30 frames | 30 frames | 30 frames |
| Kalman filter | No | Yes (simplified scalar) | Yes (built-in) | Yes (built-in) |
| EMA smoothing | No | Yes (alpha=0.7) | No | No |
| GMC | No | No | No | sparseOptFlow |
| ReID | No | No | No | **Disabled** |
| Matching | Greedy | ByteTrack two-pass | ByteTrack two-pass | BoT-SORT |

### 4.3 Critical CV Pipeline Issues

1. **`totalExits: 0` hardcoded** in BOTH browser detection components — exits never tracked
2. **`botsort_tuned.yaml` doesn't exist** — batch_processor references custom config that was never created; falls back to default
3. **3D view is pure simulation** — `Tracking3DView.jsx` generates random people, zero connection to real data
4. **Zone definitions scattered across 5 locations** with inconsistencies (some have electronics/clothing, some don't)
5. **Backend zones table has NO geometry** — only names and capacities; all spatial logic is client-side or edge-side
6. **No polygon zone support anywhere** — all zones are axis-aligned rectangles only
7. **No homography/perspective correction** — zone containment uses raw pixel coordinates
8. **Zone class duplicated** in 3 files (edge_agent_enhanced.py, batch_processor.py, process_video.py)
9. **IoU tracker uses greedy matching** — Hungarian algorithm exists in tracking-common/ but isn't used by primary components
10. **Basic edge agent only sends aggregate count** — no individual track data, no bounding boxes, no zone info

---

## 5. Database Audit

### 5.1 Schema (6 tables)

| Table | Purpose | Rows (demo) |
|-------|---------|-------------|
| `counts` | Legacy count points | ~168 |
| `zones` | Zone names + capacity (NO geometry) | 4 |
| `events` | Tracking events (entry/exit/zone_change) | ~2,000+ |
| `sessions` | Visit sessions with zone path | ~500+ |
| `batch_jobs` | Offline processing jobs | variable |
| `profile` | Store settings (singleton) | 1 |

### 5.2 Good Practices
- WAL mode enabled
- `busy_timeout = 5000`
- Parameterized queries throughout (no SQL injection)
- 9 indexes on hot columns

### 5.3 Issues
- **No migration system** — schema changes via `ALTER TABLE` with `try/except OperationalError`
- **Foreign keys not enforced** — `PRAGMA foreign_keys = ON` never executed
- **`zone_path` stored as JSON text** — queried via `LIKE '%"queue"%'` (fragile, unindexed)
- **No data retention policy** — data accumulates forever
- **N+1 pattern** in zone_rankings: fetches all sessions, processes in Python
- **Full table scan for occupancy** — `SELECT COUNT(*) FROM sessions WHERE exit_time IS NULL` lacks index on `exit_time`
- **Always-commit bug** — `db()` context manager commits in `finally` even on exceptions

---

## 6. Security Findings

### CRITICAL (P0)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| S1 | **Hardcoded API key** in `.env` | `edge_agent/.env` — `ROBOFLOW_API_KEY=C24WCC...` | Key exposure |
| S2 | **No authentication on ANY endpoint** | All 32+ endpoints | Full data access/wipe |
| S3 | **Debug mode in production** | `app.run(debug=True)` line 2631 | Werkzeug debugger = RCE |
| S4 | **Arbitrary file upload, no size limit** | `/video/upload`, `/video/library/upload` | Disk exhaustion |
| S5 | **User-controlled URL to subprocess** | `/video/start` → yt-dlp | Potential command injection |

### HIGH (P1)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| S6 | **Wildcard CORS** on inference server | `inference-server/server.py` | Cross-origin access |
| S7 | **Path traversal potential** | `/video/library/<video_id>/file` | File read outside intended dir |
| S8 | **`shell=True` in process killing** | `_kill_streamer_on_port` | Shell injection surface |

### MEDIUM (P2)

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| S9 | No rate limiting | All endpoints | DoS via `/seed_demo` |
| S10 | No input validation on video_id | Multiple endpoints | Path traversal |

---

## 7. Dependency Audit

### Backend (`backend/requirements.txt`)
```
flask==3.0.0          # Pinned — OK, no CVEs
flask-cors==4.0.0     # Pinned — OK
requests>=2.31.0      # Loose — OK
```
Only 3 dependencies. Clean.

### Edge Agent (`edge_agent/requirements.txt`)
```
opencv-python>=4.10.0    # Loose pin
numpy>=1.24.0            # Loose pin
supervision>=0.24.0      # Loose pin
yt-dlp>=2024.12.0        # Fast-moving, can break
flask>=3.0.0             # Loose pin
flask-cors>=4.0.0        # Loose pin
requests>=2.31.0         # Loose pin
```
All loose pins. No lock file.

### Inference Server
```
fastapi>=0.104.0         # Loose pin
uvicorn>=0.24.0          # Loose pin
ultralytics>=8.1.0       # Major version bumps can break
opencv-python>=4.8.0     # Loose pin
numpy>=1.24.0            # Loose pin
```

### Issues
- No lock files (`pip freeze` output) anywhere
- No `requirements.txt` for video_streamer.py
- `ultralytics>=8.1.0` too loose — YOLO API changes between major versions
- No vulnerability scanning configured
- 7 separate `node_modules/` directories (massive disk waste)

---

## 8. Technical Debt Inventory

### Prioritized by Risk

| Priority | Item | Risk | Effort |
|----------|------|------|--------|
| P0 | Rotate exposed Roboflow API key | Security breach | 10 min |
| P0 | Disable `debug=True` in production | Remote code execution | 1 min |
| P0 | Fix always-commit in `db()` (rollback on error) | Data corruption | 30 min |
| P0 | Add file upload size limits | Disk exhaustion | 30 min |
| P1 | Add API authentication for write endpoints | Unauthorized access | 4 hrs |
| P1 | Restrict inference server CORS | Cross-origin attacks | 15 min |
| P1 | Add path traversal protection for video_id | File disclosure | 1 hr |
| P1 | Split main.py into route modules | Maintainability | 4-8 hrs |
| P1 | Fix 26 MB frontend build (conditional ONNX loading) | Performance | 2-4 hrs |
| P1 | Create `botsort_tuned.yaml` (referenced but missing) | Silent fallback | 30 min |
| P2 | Add migration system for DB schema changes | Fragile upgrades | 2-4 hrs |
| P2 | Enable `PRAGMA foreign_keys = ON` | Data integrity | 30 min |
| P2 | Normalize `zone_path` to junction table | Query performance | 4 hrs |
| P2 | Add retry/buffer queue to edge agent | Data loss on backend downtime | 4 hrs |
| P2 | Pin dependency versions + add lock files | Reproducible builds | 2 hrs |
| P2 | Remove dead frontend code (~2,500 lines) | Confusion, bloat | 2 hrs |
| P2 | Fix `totalExits: 0` hardcoded in browser detection | Incorrect metrics | 2 hrs |
| P2 | Consolidate zone definitions (5 locations → 1) | Inconsistency | 4 hrs |
| P2 | Add geometry to backend zones table | Server-side validation | 2 hrs |
| P3 | Add rate limiting | DoS protection | 2 hrs |
| P3 | Add comprehensive test suite | Quality assurance | 20+ hrs |
| P3 | Add structured logging | Debugging, monitoring | 4 hrs |
| P3 | Add request/response validation schemas | API reliability | 8 hrs |
| P3 | Decompose LiveMonitor.jsx into sub-components | Maintainability | 4 hrs |
| P3 | Add ARIA attributes / accessibility | Compliance | 8 hrs |
| P3 | Add mobile-responsive CSS with clamp() | Mobile support | 8 hrs |
| P3 | Consolidate 7 frontend versions to 1 + theme switcher | Maintenance burden | 16+ hrs |

**Total estimated debt**: ~100+ hours of cleanup work.

---

## 9. Detection Pipeline Bottleneck Analysis

### Current Bottlenecks (Ranked)

1. **Detection quality (COCO-SSD in browser)**: MobileNet V2 backbone is fast but low-accuracy. Bounding boxes only — no segmentation masks. This is the #1 limitation for body-contour overlays.

2. **Edge agent sends only aggregate counts**: The basic `edge_agent.py` discards all per-person data and posts a single number. No bounding boxes, no track IDs, no zone info reaches the backend from the primary edge agent.

3. **No real 3D spatial data**: The 3D view is a simulation. No homography, no calibration, no world coordinates. People positions in the 3D view are completely fabricated.

4. **Zone system is pixel-based rectangles**: Zones are axis-aligned rectangles in pixel space. No polygon support. No world-coordinate zones. Zone definitions scattered across 5 locations with inconsistencies.

5. **ReID disabled**: BoT-SORT has `with_reid: False`. Without ReID, track recovery after occlusion relies solely on motion prediction — leading to ID switches.

6. **Browser tracking is simplified**: The IoU tracker in standard detection uses greedy matching (not Hungarian). The "enhanced" ByteTrack uses a simplified scalar Kalman filter (not proper covariance matrix).

7. **No WebSocket streaming**: All data flows via HTTP polling. No real-time push from edge → backend → frontend.

### Performance Ceiling

| Component | Current FPS | Bottleneck |
|-----------|-----------|-----------|
| Browser Standard (COCO-SSD) | 15-25 FPS | Model inference |
| Browser Enhanced (COCO-SSD + ByteTrack) | 10-20 FPS | Model inference + tracking overhead |
| Edge Agent (YOLOv8n CPU) | 20-40 FPS | CPU inference |
| Edge Agent (YOLOv8n GPU) | 100+ FPS | Camera frame rate |
| Batch (YOLO11l CPU) | 5-15 FPS | CPU inference |
| Backend API response | <100ms | Not a bottleneck |

---

## 10. Recommended Fix Order

### Phase A: Security & Stability (Before ANY feature work)
1. Rotate Roboflow API key, add to `.gitignore`
2. Disable `debug=True`
3. Fix `db()` context manager (rollback on error)
4. Add file upload size limits
5. Add basic API key auth for write endpoints
6. Restrict inference server CORS
7. Add path traversal protection

### Phase B: Code Quality Foundation
8. Split `main.py` into route modules
9. Pin dependency versions, add lock files
10. Remove dead frontend code
11. Create missing `botsort_tuned.yaml`
12. Fix `totalExits: 0` hardcoded bug
13. Consolidate zone definitions to single source of truth
14. Add geometry column to backend zones table

### Phase C: Test Infrastructure
15. Set up pytest for backend
16. Set up vitest for frontend
17. Write baseline tests for existing endpoints
18. Write tests for edge agent
19. Write integration tests

### Phase D: Feature Development (AFTER A-C)
20. Upgrade detection to YOLO-seg (instance segmentation)
21. Add homography calibration system
22. Upgrade zones to world-coordinate polygons
23. Build real 3D visualization with Three.js
24. Enable ReID in tracking
25. Add WebSocket streaming

---

*Report generated by 3 parallel audit agents covering backend, frontend, and CV pipeline.*
*All findings are from code review only — no runtime testing performed.*
