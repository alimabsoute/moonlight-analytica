# Janus Test Plan

**Date**: 2026-03-28
**Based on**: JANUS-AUDIT-REPORT.md + JANUS-ARCHITECTURE-DESIGN.md
**Status**: Phase 4 Complete — Test specs ready for implementation before any feature code changes

---

## Table of Contents

1. [Test Infrastructure](#1-test-infrastructure)
2. [Backend Tests (pytest)](#2-backend-tests-pytest)
3. [Edge Agent Tests (pytest)](#3-edge-agent-tests-pytest)
4. [Frontend Tests (vitest + RTL)](#4-frontend-tests-vitest--rtl)
5. [Integration Tests](#5-integration-tests)
6. [Performance Benchmarks](#6-performance-benchmarks)
7. [Test Execution Strategy](#7-test-execution-strategy)

---

## 1. Test Infrastructure

### 1.1 Backend (Python)

```
backend/
├── tests/
│   ├── conftest.py              # Fixtures: test DB, Flask test client, seed data
│   ├── test_health.py           # Health endpoint
│   ├── test_data.py             # /count, /events, /sessions
│   ├── test_analytics.py        # 14 analytics endpoints
│   ├── test_deep_analytics.py   # 8 deep analytics endpoints
│   ├── test_video.py            # Video management (existing, needs expansion)
│   ├── test_batch.py            # Batch processing
│   ├── test_profile.py          # Profile CRUD
│   ├── test_calibration.py      # NEW: calibration endpoints
│   ├── test_zones.py            # Zone logic + point-in-polygon
│   ├── test_db.py               # Schema, migrations, transaction handling
│   └── test_kpi_engine.py       # KPI calculation accuracy
```

**Dependencies**: `pytest`, `pytest-cov`, `pytest-flask`

**Key fixtures** (`conftest.py`):
```python
@pytest.fixture
def app():
    """Create test Flask app with in-memory SQLite."""
    app = create_app(testing=True)
    with app.app_context():
        init_db(":memory:")
        seed_test_data()
    yield app

@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()

@pytest.fixture
def seeded_db(app):
    """DB with known test data for deterministic assertions."""
    # 4 zones, 10 sessions, 50 events, known timestamps
```

### 1.2 Edge Agent (Python)

```
edge_agent/
├── tests/
│   ├── conftest.py              # Fixtures: sample frames, mock YOLO, mock backend
│   ├── test_detection.py        # Model loading, inference, output format
│   ├── test_tracking.py         # Track ID persistence, matching
│   ├── test_zone_engine.py      # Point-in-polygon, zone transitions
│   ├── test_homography.py       # Calibration math, projection accuracy
│   ├── test_event_stream.py     # Event generation, backend communication
│   └── test_batch_processor.py  # Batch pipeline
│   └── fixtures/
│       ├── sample_frame_640x480.jpg
│       ├── sample_detections.json    # Known YOLO output for reproducibility
│       └── test_calibration.json     # Known reference points + expected H
```

**Dependencies**: `pytest`, `pytest-cov`, `numpy`, `opencv-python`

### 1.3 Frontend (vitest + React Testing Library)

```
frontend-v3/
├── src/
│   └── __tests__/
│       ├── setup.js                  # vitest setup, mock WebSocket, mock canvas
│       ├── LiveMonitor.test.jsx      # Main dashboard rendering
│       ├── KPICards.test.jsx         # KPI display
│       ├── Detection.test.jsx        # Detection component rendering
│       ├── CalibrationView.test.jsx  # NEW: calibration UI flow
│       ├── ThreeJSRoom.test.jsx      # NEW: 3D room rendering
│       ├── ZoneEditor.test.jsx       # NEW: zone polygon editing
│       ├── useWebSocket.test.js      # NEW: WebSocket hook
│       └── useDetection.test.js      # NEW: ONNX inference hook
├── vitest.config.js
```

**Dependencies**: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

---

## 2. Backend Tests (pytest)

### 2.1 Health & Core Data

```python
# test_health.py
def test_health_returns_ok(client):
    """GET /health returns {ok: true}."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json["ok"] is True

# test_data.py
class TestCount:
    def test_post_count(client):
        """POST /count records a count value."""
        resp = client.post("/count", json={"count_value": 5})
        assert resp.status_code == 200
        assert resp.json["count_value"] == 5

    def test_post_count_missing_value(client):
        """POST /count without count_value returns 400."""
        resp = client.post("/count", json={})
        assert resp.status_code == 400

class TestEvents:
    def test_post_entry_event(client):
        """POST /events with entry event records correctly."""
        resp = client.post("/events", json={
            "event_type": "entry",
            "person_id": "track_1",
            "zone_id": 1,
            "direction": "in",
            "confidence": 0.92
        })
        assert resp.status_code == 200

    def test_post_event_with_world_coords(client):
        """POST /events with world_x, world_y stores coordinates."""
        resp = client.post("/events", json={
            "event_type": "zone_change",
            "person_id": "track_1",
            "zone_id": 2,
            "world_x": 4.2,
            "world_y": 2.8
        })
        assert resp.status_code == 200

    def test_post_event_invalid_type(client):
        """POST /events with unknown event_type returns 400."""

class TestSessions:
    def test_post_complete_session(client):
        """POST /sessions with full data records session."""
    def test_post_session_with_trajectory(client):
        """POST /sessions with trajectory stores position history."""
    def test_post_session_minimal(client):
        """POST /sessions with only required fields succeeds."""
```

### 2.2 Analytics Endpoints (14 tests minimum)

```python
# test_analytics.py — Every endpoint tested with known seeded data

class TestDwellTime:
    def test_dwell_time_basic(seeded_client):
        """GET /api/dwell-time returns correct avg, median, min, max."""
        resp = seeded_client.get("/api/dwell-time?hours=168")
        data = resp.json
        assert "avg" in data
        assert "median" in data
        assert data["avg"] > 0

    def test_dwell_time_with_source_filter(seeded_client):
        """GET /api/dwell-time?source=live filters correctly."""

class TestOccupancy:
    def test_current_occupancy(seeded_client):
        """GET /api/occupancy returns zone-level counts."""
        resp = seeded_client.get("/api/occupancy")
        data = resp.json
        assert "zones" in data
        assert "total" in data

class TestEntriesExits:
    def test_entries_exits_count(seeded_client):
        """GET /api/entries-exits returns correct directional counts."""
        resp = seeded_client.get("/api/entries-exits?hours=168")
        data = resp.json
        assert data["entries"] >= 0
        assert data["exits"] >= 0

class TestConversion:
    def test_conversion_rate(seeded_client):
        """GET /api/conversion returns rate between 0 and 1."""
        resp = seeded_client.get("/api/conversion?hours=168")
        assert 0 <= resp.json["conversion_rate"] <= 1

class TestZones:
    def test_zone_analytics(seeded_client):
        """GET /api/zones returns all zones with stats."""
    def test_zone_detail(seeded_client):
        """GET /api/zones/1/detail returns deep zone analytics."""

class TestHourlyPatterns:
    def test_24_bins(seeded_client):
        """GET /api/hourly-patterns returns exactly 24 hour bins."""
        resp = seeded_client.get("/api/hourly-patterns")
        assert len(resp.json["hours"]) == 24

class TestFlowBetweenZones:
    def test_transition_matrix(seeded_client):
        """GET /api/flow-between-zones returns zone-to-zone counts."""

class TestPeriodComparison:
    def test_current_vs_previous(seeded_client):
        """GET /api/period-comparison returns both periods with delta."""

class TestTrends:
    def test_daily_aggregates(seeded_client):
        """GET /api/trends?days=7 returns 7 daily data points."""

class TestSessionsRecent:
    def test_pagination(seeded_client):
        """GET /api/sessions/recent?limit=5&offset=0 returns paginated results."""

class TestAnomalies:
    def test_anomaly_detection(seeded_client):
        """GET /api/anomalies returns items exceeding 1.5 sigma threshold."""

class TestQueue:
    def test_queue_analytics(seeded_client):
        """GET /api/queue returns wait time stats for queue zones."""
```

### 2.3 Deep Analytics (8 tests minimum)

```python
# test_deep_analytics.py

class TestForecast:
    def test_forecast_returns_predictions(seeded_client):
        """GET /api/forecast returns day-of-week predictions."""

class TestPeakAnalysis:
    def test_peak_quiet_hours(seeded_client):
        """GET /api/peak-analysis identifies peak and quiet hours."""

class TestCustomerJourney:
    def test_top_paths(seeded_client):
        """GET /api/customer-journey returns top zone path sequences."""

class TestCohortAnalysis:
    def test_visitor_segments(seeded_client):
        """GET /api/cohort-analysis segments visitors by dwell time."""

class TestRealtimeSnapshot:
    def test_live_state(seeded_client):
        """GET /api/realtime-snapshot returns active sessions and velocity."""

class TestZoneRankings:
    def test_ranked_by_traffic(seeded_client):
        """GET /api/zone-rankings returns zones sorted by visitor count."""

class TestRevenueEstimates:
    def test_revenue_modeling(seeded_client):
        """GET /api/revenue-estimates returns estimates from conversion data."""

class TestHourlyComparison:
    def test_today_vs_yesterday(seeded_client):
        """GET /api/hourly-comparison returns multi-day overlay data."""
```

### 2.4 Calibration Endpoints (New)

```python
# test_calibration.py

class TestCalibration:
    def test_save_calibration(client):
        """POST /api/calibration stores homography + reference points."""
        resp = client.post("/api/calibration", json={
            "camera_id": "cam_1",
            "reference_points_image": [{"x":100,"y":200}, {"x":500,"y":200}, {"x":500,"y":400}, {"x":100,"y":400}],
            "reference_points_world": [{"x":0,"y":0}, {"x":5,"y":0}, {"x":5,"y":3}, {"x":0,"y":3}],
            "room_width_m": 5.0,
            "room_depth_m": 3.0,
            "camera_height_m": 3.0,
            "camera_angle_deg": 30
        })
        assert resp.status_code == 200
        assert "homography_matrix" in resp.json

    def test_get_calibration(client):
        """GET /api/calibration/cam_1 returns stored calibration."""

    def test_update_calibration(client):
        """PUT /api/calibration/cam_1 updates existing calibration."""

    def test_delete_calibration(client):
        """DELETE /api/calibration/cam_1 removes calibration."""

    def test_calibration_not_found(client):
        """GET /api/calibration/nonexistent returns 404."""
```

### 2.5 Database Tests

```python
# test_db.py

class TestSchema:
    def test_all_tables_exist(db):
        """Verify all 7 tables are created."""
    def test_indexes_exist(db):
        """Verify all 9+ indexes are created."""
    def test_foreign_keys_enabled(db):
        """PRAGMA foreign_keys returns 1."""

class TestMigrations:
    def test_migrations_apply_in_order(fresh_db):
        """Apply all migrations to empty DB without errors."""
    def test_migrations_idempotent(seeded_db):
        """Running migrations on already-migrated DB is safe."""

class TestTransactions:
    def test_rollback_on_error(db):
        """DB context manager rolls back on exception (not commits)."""
    def test_wal_mode_enabled(db):
        """PRAGMA journal_mode returns 'wal'."""
```

### 2.6 KPI Calculation Tests

```python
# test_kpi_engine.py — Deterministic tests with known inputs

class TestKPIAccuracy:
    def test_dwell_time_calculation(known_sessions):
        """Given sessions with known durations, verify avg/median/min/max."""
        # Sessions: 60s, 120s, 180s, 240s, 300s
        # Expected avg: 180s, median: 180s, min: 60s, max: 300s

    def test_conversion_rate_calculation(known_sessions):
        """Given 10 sessions where 3 converted, rate = 0.3."""

    def test_bounce_rate_calculation(known_sessions):
        """Given sessions where 4 had dwell < 30s, bounce = 0.4."""

    def test_zone_dwell_calculation(known_events):
        """Given known zone entry/exit times, verify per-zone dwell."""

    def test_flow_matrix_calculation(known_sessions):
        """Given known zone paths, verify transition counts."""
        # Path ["entrance","main","checkout"] → entrance→main: 1, main→checkout: 1
```

---

## 3. Edge Agent Tests (pytest)

### 3.1 Detection Pipeline

```python
# test_detection.py

class TestModelLoading:
    def test_load_yolo_seg_model():
        """YOLO26s-seg model loads and returns segmentation results."""
        from ultralytics import YOLO
        model = YOLO("yolo26s-seg.pt")
        assert model is not None

    def test_detect_person_in_frame(sample_frame):
        """Given a frame with a person, model returns at least 1 detection with mask."""
        results = model(sample_frame, classes=[0])
        assert len(results[0].boxes) >= 1
        assert results[0].masks is not None

    def test_seg_output_has_masks(sample_frame):
        """Segmentation model outputs masks.data AND masks.xy."""
        results = model(sample_frame, classes=[0])
        assert results[0].masks.data.shape[0] > 0  # (N, H, W)
        assert len(results[0].masks.xy) > 0          # polygon contours

    def test_empty_frame_returns_no_detections(empty_frame):
        """Frame with no people returns empty results."""
        results = model(empty_frame, classes=[0])
        assert len(results[0].boxes) == 0
```

### 3.2 Tracking

```python
# test_tracking.py

class TestTrackPersistence:
    def test_same_person_keeps_id(sequential_frames):
        """Person moving across 5 frames maintains same track ID."""
        track_ids = []
        for frame in sequential_frames:
            results = model.track(frame, persist=True, classes=[0])
            if results[0].boxes.id is not None:
                track_ids.append(results[0].boxes.id[0].item())
        assert len(set(track_ids)) == 1  # Same ID throughout

    def test_two_people_get_different_ids(two_person_frame):
        """Two people in frame get distinct track IDs."""

    def test_track_survives_brief_occlusion():
        """Person occluded for <30 frames retains same ID after reappearing."""
```

### 3.3 Zone Engine

```python
# test_zone_engine.py

class TestPointInPolygon:
    def test_point_inside_rectangle():
        polygon = [(0,0), (5,0), (5,3), (0,3)]
        assert point_in_polygon(2.5, 1.5, polygon) is True

    def test_point_outside_rectangle():
        polygon = [(0,0), (5,0), (5,3), (0,3)]
        assert point_in_polygon(6.0, 1.5, polygon) is False

    def test_point_on_edge():
        polygon = [(0,0), (5,0), (5,3), (0,3)]
        # Edge behavior should be deterministic
        result = point_in_polygon(5.0, 1.5, polygon)
        assert isinstance(result, bool)

    def test_irregular_polygon():
        """L-shaped polygon correctly determines inside/outside."""
        polygon = [(0,0), (3,0), (3,2), (2,2), (2,3), (0,3)]
        assert point_in_polygon(1, 1, polygon) is True   # Inside
        assert point_in_polygon(2.5, 2.5, polygon) is False  # Outside notch

    def test_concave_polygon():
        """Concave polygon with inward notch."""
        polygon = [(0,0), (4,0), (4,4), (2,2), (0,4)]
        assert point_in_polygon(3, 1, polygon) is True
        assert point_in_polygon(2, 3, polygon) is False  # Inside notch

class TestZoneTransitions:
    def test_entry_detected():
        """Person moving from no-zone to zone_1 generates entry event."""
    def test_exit_detected():
        """Person moving from zone_1 to no-zone generates exit event."""
    def test_zone_change_detected():
        """Person moving from zone_1 to zone_2 generates zone_change event."""
    def test_staying_in_zone_no_event():
        """Person remaining in same zone generates no event."""
```

### 3.4 Homography

```python
# test_homography.py

class TestHomographyComputation:
    def test_compute_homography_4_points():
        """Given 4 point pairs, compute valid 3x3 homography matrix."""
        src = np.float32([[100,200], [500,200], [500,400], [100,400]])
        dst = np.float32([[0,0], [5,0], [5,3], [0,3]])
        H, _ = cv2.findHomography(src, dst)
        assert H.shape == (3, 3)
        assert not np.any(np.isnan(H))

    def test_known_projection():
        """Given known H, verify pixel→world projection is correct."""
        # If (300, 300) in pixels should map to (2.5, 1.5) in meters
        # Verify to within 0.1m tolerance
        world = cv2.perspectiveTransform(np.float32([[[300, 300]]]), H)
        assert abs(world[0][0][0] - 2.5) < 0.1
        assert abs(world[0][0][1] - 1.5) < 0.1

    def test_inverse_projection():
        """world→pixel→world roundtrip returns original coords within tolerance."""
        H_inv = np.linalg.inv(H)
        pixel = cv2.perspectiveTransform(np.float32([[[2.5, 1.5]]]), H_inv)
        world = cv2.perspectiveTransform(pixel, H)
        assert abs(world[0][0][0] - 2.5) < 0.01
        assert abs(world[0][0][1] - 1.5) < 0.01

    def test_reprojection_error():
        """Reprojection error for calibration points is < 5 pixels."""

class TestFootPointExtraction:
    def test_bbox_bottom_center():
        """Bbox [100, 80, 250, 380] → foot point (175, 380)."""
        bbox = [100, 80, 250, 380]
        foot = ((bbox[0] + bbox[2]) / 2, bbox[3])
        assert foot == (175.0, 380)

    def test_foot_point_projection():
        """Foot point projected through H gives reasonable world coords."""
```

---

## 4. Frontend Tests (vitest + RTL)

### 4.1 Component Rendering

```javascript
// LiveMonitor.test.jsx
describe('LiveMonitor', () => {
  it('renders without crashing', () => {
    render(<LiveMonitor />);
    expect(screen.getByText(/Live Monitor/i)).toBeInTheDocument();
  });

  it('displays KPI cards with mock data', () => {
    render(<LiveMonitor />);
    expect(screen.getByText(/Current Occupancy/i)).toBeInTheDocument();
  });

  it('switches between 2D, 3D, and ML views', async () => {
    render(<LiveMonitor />);
    fireEvent.click(screen.getByText('3D View'));
    // Verify 3D component rendered
  });
});

// Detection.test.jsx
describe('RealTimeDetection', () => {
  it('renders canvas overlay', () => {
    render(<RealTimeDetection />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows loading state while model loads', () => {
    render(<RealTimeDetection />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('displays FPS counter when running', async () => {
    // Mock model loaded state
  });
});
```

### 4.2 Calibration UI

```javascript
// CalibrationView.test.jsx
describe('CalibrationView', () => {
  it('renders camera feed area and floor plan area', () => {
    render(<CalibrationView />);
    expect(screen.getByTestId('camera-feed')).toBeInTheDocument();
    expect(screen.getByTestId('floor-plan')).toBeInTheDocument();
  });

  it('allows clicking 4 reference points on camera feed', async () => {
    render(<CalibrationView />);
    const feed = screen.getByTestId('camera-feed');
    // Click 4 points
    for (let i = 0; i < 4; i++) {
      fireEvent.click(feed, { clientX: 100 + i * 100, clientY: 200 });
    }
    expect(screen.getByText(/4 points selected/i)).toBeInTheDocument();
  });

  it('shows measurement input fields after selecting points', async () => {
    // After 4 points, measurement inputs should appear
  });

  it('computes and displays reprojection error', async () => {
    // After entering measurements, error metric shown
  });

  it('saves calibration to backend', async () => {
    // Mock API call, verify POST /api/calibration
  });
});
```

### 4.3 WebSocket Hook

```javascript
// useWebSocket.test.js
describe('useWebSocket', () => {
  it('connects to WebSocket server', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/live'));
    expect(result.current.connected).toBe(true);
  });

  it('receives person update messages', async () => {
    // Mock WebSocket message
    const message = {
      type: 'frame_update',
      persons: [{ track_id: 1, world_x: 4.2, world_y: 2.8 }]
    };
    // Verify hook state updates
  });

  it('reconnects on connection loss', async () => {
    // Simulate disconnect, verify reconnection attempt
  });

  it('handles malformed messages gracefully', () => {
    // Send invalid JSON, verify no crash
  });
});
```

### 4.4 Three.js Room

```javascript
// ThreeJSRoom.test.jsx
describe('ThreeJSRoom', () => {
  it('renders WebGL canvas', () => {
    render(<ThreeJSRoom roomWidth={10} roomDepth={8} />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders floor plane with correct dimensions', () => {
    // Verify Three.js scene contains floor geometry
  });

  it('renders zone overlays', () => {
    const zones = [{ id: 1, name: 'entrance', polygon: [{x:0,y:0},{x:2,y:0},{x:2,y:3},{x:0,y:3}] }];
    render(<ThreeJSRoom zones={zones} />);
    // Verify zone meshes in scene
  });

  it('updates person positions from props', async () => {
    const persons = [{ trackId: 1, worldX: 4.2, worldY: 2.8 }];
    const { rerender } = render(<ThreeJSRoom persons={persons} />);
    // Update positions
    rerender(<ThreeJSRoom persons={[{ trackId: 1, worldX: 5.0, worldY: 3.0 }]} />);
    // Verify marker moved
  });
});
```

---

## 5. Integration Tests

### 5.1 Full Pipeline Test

```python
# tests/integration/test_full_pipeline.py

class TestFullPipeline:
    def test_video_to_events(test_video, running_backend):
        """
        Full pipeline: sample video → edge_agent → backend → verify DB events.

        Given: 10-second video with 3 people walking through 2 zones
        When: Edge agent processes video and posts events
        Then: Backend has correct entry/exit/zone_change events
        """
        # 1. Start edge_agent_enhanced with test_video
        # 2. Wait for processing to complete
        # 3. Query /api/entries-exits
        # 4. Verify: 3 entries, zone_change events, eventual exits
        assert data["entries"] == 3

    def test_video_to_sessions(test_video, running_backend):
        """
        Full pipeline: video → sessions with correct dwell times.

        Given: 10-second video with known person durations
        When: Processing completes
        Then: Sessions have correct dwell_seconds within 1s tolerance
        """

    def test_batch_to_analytics(test_video, running_backend):
        """
        Batch pipeline: upload video → batch process → analytics available.

        1. POST /video/library/upload with test video
        2. POST /api/batch/start
        3. Poll /api/batch/jobs/<id> until completed
        4. GET /api/dwell-time?source=batch — verify results
        """
```

### 5.2 Calibration Integration

```python
# tests/integration/test_calibration.py

class TestCalibrationIntegration:
    def test_calibration_to_world_coords():
        """
        Given: Known reference points (4 tile corners measured in room)
        When: Calibration is saved and edge agent uses it
        Then: Person at known position projects to correct world coords (within 30cm)
        """
        # 1. POST /api/calibration with known reference points
        # 2. Process frame with person at known pixel location
        # 3. Verify world_x, world_y in event match expected position
        assert abs(event["world_x"] - expected_x) < 0.3  # 30cm tolerance
        assert abs(event["world_y"] - expected_y) < 0.3

    def test_zone_projection_roundtrip():
        """
        Given: Zone defined in world coordinates
        When: Projected to pixel coordinates and back
        Then: Roundtrip error < 5 pixels
        """
```

### 5.3 Zone Analytics Integration

```python
# tests/integration/test_zone_analytics.py

class TestZoneAnalytics:
    def test_known_path_dwell_time():
        """
        Given: Person enters entrance (0s), moves to main_floor (10s), exits (60s)
        When: Session completes
        Then: Dwell time = 60s, zone_path = [entrance, main_floor]
        """

    def test_conversion_tracking():
        """
        Given: 5 people enter, 2 reach checkout zone
        When: Sessions complete
        Then: Conversion rate = 0.4
        """

    def test_zone_transition_matrix():
        """
        Given: Known person paths through zones
        When: Querying /api/flow-between-zones
        Then: Transition counts match expected values
        """
```

---

## 6. Performance Benchmarks

### 6.1 Detection FPS Benchmark

```python
# benchmarks/bench_detection.py

MODELS = ["yolo26n-seg.pt", "yolo26s-seg.pt", "yolo26m-seg.pt"]
DEVICES = ["cpu"]  # Add "cuda:0" if GPU available
FRAME_COUNT = 100

def benchmark_detection(model_name, device, frames):
    """Measure average FPS for detection + segmentation."""
    model = YOLO(model_name)
    times = []
    for frame in frames:
        start = time.perf_counter()
        results = model(frame, device=device, classes=[0])
        times.append(time.perf_counter() - start)
    avg_ms = (sum(times) / len(times)) * 1000
    fps = 1000 / avg_ms
    return {"model": model_name, "device": device, "avg_ms": avg_ms, "fps": fps}

# Expected output:
# | Model | Device | Avg ms | FPS |
# |-------|--------|--------|-----|
# | yolo26n-seg | cpu | ~53ms | ~19 |
# | yolo26s-seg | cpu | ~118ms | ~8 |
# | yolo26m-seg | cpu | ~328ms | ~3 |
```

### 6.2 Tracking Accuracy Benchmark

```python
# benchmarks/bench_tracking.py

TRACKERS = ["bytetrack.yaml", "botsort.yaml", "botsort_tuned.yaml"]
PEOPLE_COUNTS = [10, 20, 50]

def benchmark_tracking(tracker, video, ground_truth):
    """Measure MOTA, IDF1, ID switches for a tracker config."""
    # Run tracker on video
    # Compare against ground truth annotations
    # Return: { mota, idf1, id_switches, fps }

# Expected output:
# | Tracker | People | MOTA | IDF1 | ID Switches |
# |---------|--------|------|------|-------------|
# | ByteTrack | 10 | 70%+ | 65%+ | <20 |
# | BoT-SORT | 10 | 75%+ | 70%+ | <15 |
# | BoT-SORT+ReID | 10 | 78%+ | 75%+ | <10 |
```

### 6.3 Browser Inference Benchmark

```javascript
// benchmarks/bench_browser.js

async function benchmarkBrowserInference(modelPath, frameCount = 50) {
  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['webgpu']
  });

  const times = [];
  for (let i = 0; i < frameCount; i++) {
    const start = performance.now();
    await session.run(inputTensor);
    times.push(performance.now() - start);
  }

  return {
    avg_ms: times.reduce((a, b) => a + b) / times.length,
    fps: 1000 / (times.reduce((a, b) => a + b) / times.length),
    p95_ms: times.sort()[Math.floor(times.length * 0.95)],
    backend: session.handler?.ep || 'unknown'
  };
}

// Test on 3 device tiers:
// Low:  Integrated GPU (Intel UHD), 8GB RAM
// Mid:  RTX 3060 laptop, 16GB RAM
// High: RTX 4070+, 32GB RAM
```

### 6.4 Backend Load Benchmark

```python
# benchmarks/bench_backend.py

import concurrent.futures
import requests

def benchmark_backend_load(base_url, concurrent_events=50):
    """Simulate concurrent person events hitting the backend."""
    events = [
        {"event_type": "zone_change", "person_id": f"track_{i}", "zone_id": 1}
        for i in range(concurrent_events)
    ]

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_events) as executor:
        start = time.perf_counter()
        futures = [
            executor.submit(requests.post, f"{base_url}/events", json=e)
            for e in events
        ]
        results = [f.result() for f in futures]
        elapsed = time.perf_counter() - start

    success = sum(1 for r in results if r.status_code == 200)
    return {
        "concurrent_events": concurrent_events,
        "success_rate": success / concurrent_events,
        "total_time_s": elapsed,
        "events_per_second": concurrent_events / elapsed
    }

# Target: 50 concurrent events processed in < 2 seconds
```

---

## 7. Test Execution Strategy

### 7.1 Before Any Code Changes (Sprint 1)

1. Set up pytest infrastructure (conftest, fixtures, test DB)
2. Write baseline tests for ALL existing endpoints (tasks 2.1-2.3)
3. Run full suite → establish baseline (expect some failures for known bugs)
4. Document known failures as tech debt

### 7.2 During Each Sprint

| When | What |
|------|------|
| Before changes | Run full suite, note baseline |
| After each file change | Run affected test module |
| After each feature | Run full suite |
| Before checkpoint commit | Run full suite + benchmarks |

### 7.3 CI Configuration (Future)

```yaml
# .github/workflows/test.yml
name: Janus Tests
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-python@v5
      - run: pip install -r backend/requirements.txt pytest pytest-cov
      - run: cd backend && pytest --cov=. --cov-report=xml

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
      - run: cd frontend-v3 && npm ci && npx vitest run --coverage
```

### 7.4 Coverage Targets

| Component | Current Coverage | Sprint 1 Target | Final Target |
|-----------|-----------------|----------------|-------------|
| Backend endpoints | ~5% (10 shallow tests) | 60% | 85% |
| Edge agent | 0% | 40% | 75% |
| Frontend components | 0% (v3), ~10% (frontend/) | 30% | 60% |
| Integration | 0% | 20% | 50% |
| Benchmarks | 0% | Established | Tracked per sprint |

---

*Test plan designed based on JANUS-AUDIT-REPORT.md findings and JANUS-ARCHITECTURE-DESIGN.md component plan.*
*Tests should be implemented BEFORE any feature code changes in Sprint 1.*
