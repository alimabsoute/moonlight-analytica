# Janus CV Architecture Upgrade — Session Handoff (2026-03-31)

## What Was Done This Session

Migrated the entire Janus edge agent CV pipeline from YOLO/ultralytics (AGPL) to RF-DETR + Supervision (Apache 2.0/MIT). Commit: `d76e5f8` on `feature/toolset-enhancement`.

### Files Changed (7 files, -414 net lines)

| File | Change | Status |
|------|--------|--------|
| `edge_agent/requirements.txt` | ultralytics → rfdetr + trackers + supervision + openvino + nncf | Done |
| `edge_agent/zones.json` | Added polygon coords, line definitions, reference_resolution | Done |
| `edge_agent/edge_agent.py` | 117→~100 lines. YOLO → RF-DETR-Nano + ByteTrackTracker. `--rtsp` → `--source` | Done |
| `edge_agent/edge_agent_enhanced.py` | 407→~290 lines. Custom Zone/PersonTracker/EventStream → sv.PolygonZone + sv.LineZone | Done |
| `edge_agent/batch_processor.py` | 709→~470 lines. Custom BatchZoneTracker → BatchSessionTracker using Supervision. BatchDBWriter preserved. | Done |
| `edge_agent/video_streamer.py` | 948→~450 lines. Removed inference server dependency. Direct RF-DETR + Supervision annotators. | Done |
| `CLAUDE.md` | Updated architecture, tech stack, pipeline tables, file descriptions | Done |

### What Was NOT Changed
- `backend/main.py` — no changes needed yet (world_x/world_y fields come in Sprint 3)
- `inference-server/server.py` — deprecated but kept for reference
- `shared/*.jsx` — browser components unchanged (COCO-SSD stays for demo)
- `reid_manager.py` — still used by video_streamer.py, works as-is
- `path_utils.py` — unchanged, still imported

## What Needs to Happen Next

### Immediate (before running)
1. **Install new deps**: `cd edge_agent && pip install -r requirements.txt`
2. **Test imports**: `python -c "from rfdetr import RFDETRNano; from trackers import ByteTrackTracker; print('OK')"`
3. **Run basic smoke test**: `python edge_agent.py --source 0 --interval 10` (webcam)

### Verification Plan (from the architecture doc)
1. **Phase 1 — Model Swap Validation**: Run RF-DETR on one test video from `video_library/`, compare detection count vs old YOLO
2. **Phase 2 — Zone Counting**: Run enhanced agent with zones, verify PolygonZone counts match expected
3. **Phase 3 — Integration**: Run new edge agent → POST to existing backend → verify frontend displays correct data
4. **Phase 4 — Performance**: Measure FPS on Ali's Intel Iris Xe (target: 35-50 FPS with OpenVINO INT8)

### Sprint Roadmap Remaining
- **Sprint 1 Gates** (security fixes, test infra) — still needed, not started
- **Sprint 2** (detection upgrade) — **SIGNIFICANTLY SIMPLIFIED** by this session's work
- **Sprint 3** (homography calibration + 3D) — unchanged, next after Sprint 1
- **Sprint 4** (tracking scale-up) — simplified, ByteTrack already integrated
- **Sprint 5** (polish) — unchanged

### OpenVINO INT8 Export (for production speed)
```bash
# Export RF-DETR-Nano to ONNX
python -c "from rfdetr import RFDETRNano; m = RFDETRNano(); m.export('rf_detr_nano.onnx')"

# Convert to OpenVINO IR
mo --input_model rf_detr_nano.onnx --output_dir openvino_model/

# Quantize to INT8 with nncf (for ~35-50 FPS on Iris Xe)
# See nncf documentation for calibration dataset setup
```

### CLI Changes (Breaking)
- `edge_agent.py`: `--rtsp` → `--source`, removed `--model` and `--device`, added `--resolution`
- `edge_agent_enhanced.py`: `--rtsp` → `--source`, removed `--model` and `--device`
- `batch_processor.py`: removed `--model` and `--tracker` args (fixed to RF-DETR + ByteTrack)
- `video_streamer.py`: removed `--mode`, `--inference-url` args (no inference server needed)
- **Update any .bat scripts** in edge_agent/ that use old args

### Known Considerations
- RF-DETR requires PyTorch — heavier initial install than ultralytics alone
- OpenVINO export not yet done — running on CPU/PyTorch for now
- `trackers` package API may differ slightly from supervision's built-in ByteTrack — test thoroughly
- The `sv.Color` class usage in video_streamer may need adjustment based on supervision version
