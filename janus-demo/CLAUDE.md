# Janus Demo

Real-time people counting & analytics platform. Computer vision + dashboards for foot traffic in physical spaces (retail, restaurants, venues). Privacy-first: no video/images stored, only counts and journey metadata.

## Current Status: CV Upgrade In Progress

**Phase**: Foundation work (Sprint 1) — security fixes, backend split, test infrastructure
**Branch**: `feature/toolset-enhancement`
**Reference docs**: `JANUS-AUDIT-REPORT.md`, `JANUS-RESEARCH-REPORT.md`, `JANUS-ARCHITECTURE-DESIGN.md`, `JANUS-TEST-PLAN.md`, `DEVELOPMENT-GATES.md`

## Architecture

```
Frontend (React+Vite :3003)  →  Backend (Flask :8000)  ←  Edge Agent (YOLO, optional)
                                      ↓                    Inference Server (FastAPI :8002)
                                 SQLite (janus.db)          Video Streamer (Flask :8001)
```

**Primary frontend**: `frontend-v3/` (Corporate theme, 13 pages)
**6 legacy themes**: v1-v6 (same backend API, different CSS)

## Quick Start

```bash
# Backend
cd backend && python main.py                    # Port 8000, auto-creates janus.db

# Frontend
cd frontend-v3 && npm run dev                   # Port 3003

# Seed demo data
curl -X POST http://localhost:8000/seed_demo

# Edge Agent (optional)
cd edge_agent && python edge_agent.py --rtsp 0  # 0=webcam
```

---

## DEVELOPMENT RULES (MANDATORY)

### Gate-Based Development — NEVER Skip a Gate

This project uses strict gate-based development. See `DEVELOPMENT-GATES.md` for the full plan.

**The Iron Rules:**

1. **NEVER write feature code without a failing test first** (Red-Green-Refactor)
2. **NEVER move to the next gate until ALL tests for the current gate are green**
3. **NEVER skip running the FULL regression suite before a checkpoint commit**
4. **ALWAYS git tag at every gate completion** (`git tag gate-X.Y`)
5. **ALWAYS record benchmark numbers** at performance gates
6. **If a test fails after a change, STOP and fix it before continuing**
7. **If you need to skip a test, mark it `@pytest.mark.skip(reason="...")` with a TODO to fix it — NEVER delete a failing test**

### Test Commands

```bash
# Backend tests
cd backend && python -m pytest tests/ -v --tb=short

# Backend with coverage
cd backend && python -m pytest tests/ -v --cov=. --cov-report=term-missing

# Edge agent tests
cd edge_agent && python -m pytest tests/ -v --tb=short

# Frontend tests
cd frontend-v3 && npx vitest run

# Frontend with coverage
cd frontend-v3 && npx vitest run --coverage

# ALL tests (run before every checkpoint commit)
cd backend && python -m pytest tests/ -v && cd ../edge_agent && python -m pytest tests/ -v && cd ../frontend-v3 && npx vitest run
```

### Git Workflow

```bash
# Before EVERY commit: run full test suite
# Tag format at gates: git tag gate-1.1-security-fixes
# Commit format:
#   type(scope): Brief description
#
#   - Detail
#   - Gate: X.Y — [gate name]
#
#   Tests: X passed, Y skipped, 0 failed
#   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
**Push policy**: DO NOT auto-push. Only push when explicitly requested.

---

## Key Files

| File | What | Lines |
|------|------|-------|
| `backend/main.py` | Monolithic Flask backend — all routes, DB, KPI logic | 2,631 |
| `edge_agent/edge_agent.py` | Basic YOLO + ByteTrack counter | 117 |
| `edge_agent/edge_agent_enhanced.py` | Full zone tracking + events + sessions | ~500 |
| `edge_agent/batch_processor.py` | Offline batch video analysis | ~600 |
| `edge_agent/video_streamer.py` | MJPEG stream + detection overlay | ~300 |
| `inference-server/server.py` | FastAPI local YOLO inference | 233 |
| `shared/RealTimeDetection.jsx` | Browser COCO-SSD + IoU tracker | 797 |
| `shared/RealTimeDetectionEnhanced.jsx` | Browser COCO-SSD + ByteTrack JS | 936 |
| `shared/Tracking3DView.jsx` | Simulated isometric 3D (NOT real data) | 558 |
| `shared/HumanoidTrackingDemo.jsx` | Canvas stick-figure animation | 715 |
| `edge_agent/zones.json` | Zone definitions (pixel rectangles) | ~20 |

## Tech Stack

- **Frontend**: React 18, Vite 5, Recharts, Nivo, Framer Motion
- **Backend**: Flask 3.0, SQLite (WAL mode), Flask-CORS
- **Edge Agent**: Python, OpenCV, ultralytics (YOLO), supervision (ByteTrack)
- **Inference Server**: FastAPI, uvicorn, ultralytics
- **Testing**: pytest (backend + edge), vitest + RTL (frontend), Playwright (E2E)

## Database (SQLite — auto-created)

6 tables: `counts`, `zones`, `events`, `sessions`, `batch_jobs`, `profile`
9 indexes on hot columns. WAL mode enabled. `busy_timeout = 5000`.

### Known DB Issues (from audit)
- `db()` context manager commits even on exceptions — needs rollback fix
- Foreign keys not enforced (`PRAGMA foreign_keys = ON` never called)
- `zone_path` stored as JSON text, queried via `LIKE` — fragile
- No migration system — schema changes via try/except ALTER TABLE

## Backend API (32 endpoints)

**Core**: `/health`, `/seed_demo`, `/count`, `/kpis`, `/series.csv`, `/events`, `/sessions`
**Analytics (14)**: `/api/dwell-time`, `/api/occupancy`, `/api/entries-exits`, `/api/conversion`, `/api/zones`, `/api/queue`, `/api/hourly-patterns`, `/api/dwell-distribution`, `/api/flow-between-zones`, `/api/period-comparison`, `/api/trends`, `/api/sessions/recent`, `/api/zones/<id>/detail`, `/api/anomalies`
**Deep Analytics (8)**: `/api/forecast`, `/api/peak-analysis`, `/api/customer-journey`, `/api/cohort-analysis`, `/api/realtime-snapshot`, `/api/zone-rankings`, `/api/revenue-estimates`, `/api/hourly-comparison`
**Profile**: `GET/PUT /api/profile`
**Video (10)**: `/video/start|stop|upload`, `/video/library/*`, `/video/settings`, `/video/model`, `/video/tracker`
**Batch (4)**: `/api/batch/jobs`, `/api/batch/jobs/<id>`, `/api/batch/start`, `/api/batch/results/<id>`

## Known Security Issues (from audit — P0)

1. Hardcoded Roboflow API key in `edge_agent/.env` — ROTATE
2. `debug=True` in production (`main.py` line 2631) — DISABLE
3. No auth on any endpoint — ADD
4. No file upload size limits — ADD
5. `db()` always commits, even on error — FIX

## CV Upgrade Sprint Plan

| Sprint | Focus | Gate Range | Status |
|--------|-------|-----------|--------|
| 1 | Security + code quality + test infra | Gates 1.1-1.6 | **Next** |
| 2 | YOLO-seg detection + polygon zones | Gates 2.1-2.5 | Queued |
| 3 | Homography calibration + Three.js 3D | Gates 3.1-3.5 | Queued |
| 4 | BoxMOT + ReID + scale testing | Gates 4.1-4.4 | Queued |
| 5 | Polish + docs + final regression | Gates 5.1-5.3 | Queued |

**Full gate details**: See `DEVELOPMENT-GATES.md`

## Detection Pipeline (Current)

| Pipeline | Model | Tracker | Output |
|----------|-------|---------|--------|
| Browser Standard | COCO-SSD lite_mobilenet_v2 | IoU (greedy) | Bboxes |
| Browser Enhanced | COCO-SSD + ByteTrack JS | Kalman + EMA | Bboxes |
| Edge Live | yolov8n.pt | ByteTrack | Aggregate count |
| Batch Offline | yolo11l.pt | BoT-SORT | Events + sessions |

## Detection Pipeline (Target)

| Pipeline | Model | Tracker | Output |
|----------|-------|---------|--------|
| Edge Live | **YOLO26s-seg** | **BoT-SORT + ReID (BoxMOT)** | **Masks + world coords + events** |
| Batch Offline | **YOLO26l-seg** | **BoT-SORT + ReID** | **Masks + world coords + events** |
| Browser | **YOLO26n-seg (ONNX + WebGPU)** | ByteTrack JS | **Masks + bboxes** |
| 3D View | N/A (consumes edge data) | N/A | **Real positions via homography** |
