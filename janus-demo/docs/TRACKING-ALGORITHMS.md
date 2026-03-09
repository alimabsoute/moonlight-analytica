# Janus People Tracking - Algorithm Reference

## Overview

Janus supports multiple tracking configurations for different accuracy/speed tradeoffs.

## Detection Models

### YOLOv8 (Legacy)

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| `yolov8n.pt` | 6.3 MB | ~30 FPS | Good | Default, balanced |

### YOLOv11 (Recommended - January 2025)

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| `yolo11n.pt` | ~6 MB | ~25-30 FPS | Better | Fast & accurate |
| `yolo11s.pt` | ~22 MB | ~15-20 FPS | Higher | Balanced |
| `yolo11m.pt` | ~49 MB | ~8-12 FPS | Best | Maximum accuracy |

**Key Improvements in YOLOv11:**
- 22% fewer parameters than YOLOv8m with higher mAP
- Better handling of occlusions
- Improved small object detection
- More stable bounding box predictions

## Tracking Algorithms

### ByteTrack (Default)

**Config:** `bytetrack.yaml`

| Metric | Value |
|--------|-------|
| Speed | ~171 FPS |
| MOTA | 77.3% |
| ID Switches | 558 |
| False Positives | 3,828 |
| False Negatives | 14,661 |

**Best For:**
- Real-time applications
- Simple scenes with minimal occlusion
- Static camera setups
- When speed matters more than perfect ID preservation

**Limitations:**
- Can lose track of similar-looking people
- Struggles with heavy occlusion
- No appearance-based re-identification

### BoT-SORT (Recommended for Accuracy)

**Config:** `botsort.yaml`

| Metric | Improvement over ByteTrack |
|--------|---------------------------|
| Re-identification | Significantly better |
| Occlusion handling | Better |
| Camera motion | Compensated |

**Best For:**
- Crowded environments
- Scenarios requiring persistent person identity
- Moving or PTZ cameras
- Security and analytics applications

**Features:**
- Motion + appearance cues combined
- Camera motion compensation
- Box prediction refinement
- Better ID consistency across frames

### StrongSORT (Optional - Requires BoxMOT)

**Installation:** `pip install boxmot`

**Best For:**
- Maximum identity accuracy
- Complex environments with many similar-looking people
- Long-term tracking requirements

**Note:** Requires additional dependencies and is slower than ByteTrack/BoT-SORT.

## Configuration Guide

### UI Settings (Frontend)

The Settings page allows configuration of:
1. **Detection Model** - Choose between YOLOv8 and YOLOv11 variants
2. **Tracking Algorithm** - ByteTrack or BoT-SORT
3. **Confidence Threshold** - 10% to 80%

Changes take effect on the next video start.

### Command Line

```bash
# Basic tracking with ByteTrack (fast)
python video_streamer.py --source 0 --model yolov8n.pt --tracker bytetrack.yaml

# YOLOv11 with BoT-SORT (accurate)
python video_streamer.py --source 0 --model yolo11n.pt --tracker botsort.yaml

# Advanced agent with full analytics
python edge_agent_advanced.py --source video.mp4 --model yolo11s.pt --tracker botsort.yaml
```

### Confidence Threshold Tuning

| Threshold | Effect |
|-----------|--------|
| 0.25 | More detections, some false positives |
| 0.35 | **Default** - Balanced |
| 0.45 | Fewer but more confident detections |
| 0.55+ | Very strict, may miss people |

**Recommendations:**
- **Crowded scenes:** Use 0.25-0.30
- **Sparse scenes:** Use 0.40-0.50
- **High accuracy needed:** Use 0.45+ with larger model

## Performance Comparison

| Configuration | FPS (CPU) | FPS (GPU) | Accuracy |
|---------------|-----------|-----------|----------|
| YOLOv8n + ByteTrack | ~5-8 | ~30-50 | Good |
| YOLOv11n + ByteTrack | ~4-7 | ~25-45 | Better |
| YOLOv11n + BoT-SORT | ~3-6 | ~20-40 | Best |
| YOLOv11s + BoT-SORT | ~2-4 | ~15-25 | Highest |

## Video Sources

### Supported Sources

1. **Webcam:** `--source 0`
2. **Video File:** `--source path/to/video.mp4`
3. **RTSP Stream:** `--source rtsp://user:pass@host/stream`
4. **YouTube:** `--youtube "https://youtube.com/watch?v=..."`

### Test Videos

Download free test videos:
```bash
cd edge_agent
python download_test_videos.py --count 5
```

Sources:
- [Pexels](https://www.pexels.com/search/videos/people%20walking/) - Free 4K videos
- [Pixabay](https://pixabay.com/videos/search/walking%20people/) - Free HD videos

## Troubleshooting

### YouTube Not Working

1. Update yt-dlp: `pip install -U yt-dlp`
2. Check video availability (private, age-restricted, etc.)
3. Run test: `run_youtube_test.bat`

### Low Detection Accuracy

1. Try lower confidence threshold (0.25-0.30)
2. Use YOLOv11s instead of nano model
3. Ensure good lighting in video
4. Use BoT-SORT for better tracking

### ID Switches / Lost Tracks

1. Switch from ByteTrack to BoT-SORT
2. Lower the exit timeout (default 300s)
3. Increase skip_frames for smoother tracking

### Slow Performance

1. Use YOLOv8n or YOLOv11n (nano models)
2. Use ByteTrack instead of BoT-SORT
3. Increase frame skipping (--skip-frames 3)
4. Use GPU if available (--device cuda:0)

## References

- [Ultralytics YOLO11 Docs](https://docs.ultralytics.com/models/yolo11/)
- [ByteTrack Paper](https://arxiv.org/abs/2110.06864)
- [BoT-SORT Paper](https://arxiv.org/abs/2206.14651)
- [OpenCV 4.13 Release Notes](https://github.com/opencv/opencv/wiki/OpenCV-Change-Logs)
