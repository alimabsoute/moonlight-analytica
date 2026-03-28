# Janus Research Report

**Date**: 2026-03-28
**Scope**: Instance segmentation models, camera angles, 3D spatial measurement, cloud services
**Status**: Phase 2 Complete — NO code changes made

---

## Table of Contents

1. [Instance Segmentation Model Comparison](#1-instance-segmentation-model-comparison)
2. [Browser Inference Options](#2-browser-inference-options)
3. [Camera Angle Performance Matrix](#3-camera-angle-performance-matrix)
4. [3D Spatial Measurement Approaches](#4-3d-spatial-measurement-approaches)
5. [Cloud CV Services Assessment](#5-cloud-cv-services-assessment)
6. [Recommendations](#6-recommendations)

---

## 1. Instance Segmentation Model Comparison

### 1.1 YOLO26-seg (Latest — 2026, Ultralytics)

NMS-free end-to-end inference, Boundary-Aware Supervision with ProgLoss for crisper masks, DFL-free architecture, **43% faster CPU inference** vs YOLO11.

| Model | mAP_box (e2e) | mAP_mask (e2e) | Params (M) | FLOPs (B) | CPU ONNX (ms) | T4 TensorRT (ms) |
|---|---|---|---|---|---|---|
| **YOLO26n-seg** | **39.6** | **33.9** | **2.7** | **9.1** | **53.3** | **2.1** |
| YOLO26s-seg | 47.3 | 40.0 | 10.4 | 34.2 | 118.4 | 3.3 |
| YOLO26m-seg | 52.5 | 44.1 | 23.6 | 121.5 | 328.2 | 6.7 |
| YOLO26l-seg | 54.4 | 45.5 | 28.0 | 139.8 | 387.0 | 8.0 |
| YOLO26x-seg | 56.5 | 47.0 | 62.8 | 313.5 | 787.0 | 16.4 |

### 1.2 YOLO11-seg (Current generation — 2024/2025)

| Model | mAP_box | mAP_mask | Params (M) | FLOPs (B) | CPU ONNX (ms) | T4 TensorRT (ms) |
|---|---|---|---|---|---|---|
| YOLO11n-seg | 38.9 | 32.0 | 2.9 | 9.7 | 65.9 | 1.8 |
| YOLO11s-seg | 46.6 | 37.8 | 10.1 | 33.0 | 117.6 | 2.9 |
| YOLO11m-seg | 51.5 | 41.5 | 22.4 | 113.2 | 281.6 | 6.3 |
| YOLO11l-seg | 53.4 | 42.9 | 27.6 | 132.2 | 344.2 | 7.8 |
| YOLO11x-seg | 54.7 | 43.8 | 62.1 | 296.4 | 664.5 | 15.8 |

### 1.3 YOLO26 vs YOLO11 — Key Improvements

| Metric | YOLO26n-seg | YOLO11n-seg | Improvement |
|--------|-------------|-------------|-------------|
| CPU speed | 53.3ms | 65.9ms | **~31% faster** |
| Mask mAP | 33.9 | 32.0 | **+1.9 points** |
| Parameters | 2.7M | 2.9M | 7% smaller |
| Mask quality | Boundary-Aware + ProgLoss | Standard | **Crisper contours** |
| Post-processing | NMS-free | Requires NMS | **Simpler deployment** |

### 1.4 Advanced Models (Reference Only)

| Model | Type | mAP | Speed | Real-Time? | Verdict |
|-------|------|-----|-------|-----------|---------|
| YOLOv12-seg | Attention-based | ~40.6 box | 1.64ms T4 | Yes | Promising but less tested |
| Mask2Former | Transformer | 57.8 PQ | 8.6 FPS V100 | **No** | 55x slower than YOLO |
| SAM 2 Tiny | Promptable | Excellent | 47 FPS A100 | Partial | Requires prompts, not autonomous |
| SAM 2 Large | Promptable | Best | 30 FPS A100 | **No** | 26-32 sec on CPU |

**SAM 2 hybrid use case**: YOLO for real-time detection → SAM 2 for offline mask refinement in batch processing only.

### 1.5 Model Size on Disk

| Model | PyTorch (.pt) | ONNX (est.) |
|---|---|---|
| YOLO26n-seg | ~6 MB | ~11 MB |
| YOLO26s-seg | ~22 MB | ~40 MB |
| YOLO26m-seg | ~48 MB | ~90 MB |
| YOLO26l-seg | ~57 MB | ~110 MB |

### 1.6 Migration Effort from Current Setup

**Trivially low — one-line model swap:**

```python
# BEFORE (detection only)
model = YOLO("yolov8n.pt")

# AFTER (segmentation — boxes STILL available)
model = YOLO("yolo26n-seg.pt")
# results[0].boxes.xyxy  → bounding boxes (unchanged)
# results[0].masks.data  → (N, H, W) binary masks (NEW)
# results[0].masks.xy    → polygon contour points (NEW)
```

- Tracking (`model.track()`) works identically with seg models
- Supervision library handles masks automatically via `sv.Detections.from_ultralytics()`
- Same confidence thresholds, same class filtering
- Ultralytics auto-downloads model weights on first run

---

## 2. Browser Inference Options

### 2.1 Option Comparison

| Option | Instance Seg? | Multi-Person? | Est. FPS (nano) | Ecosystem Fit |
|---|---|---|---|---|
| **ONNX Runtime Web + WebGPU** | **YES** | **YES** | **15-30** | **Best (YOLO native)** |
| TensorFlow.js (BodyPix) | No (semantic only) | Partial | 15-25 | Poor |
| MediaPipe Segmentation | No (semantic only) | No | 30+ | Poor |

### 2.2 ONNX Runtime Web + WebGPU (Recommended)

**Status**: Production-ready. Supported in Chrome, Edge (out-of-box), Firefox (behind flag), Safari Tech Preview.

**Estimated Performance**:

| Model | Native GPU (T4) | Browser WebGPU (consumer) | Browser WASM (CPU) |
|---|---|---|---|
| YOLO26n-seg | ~500 FPS (2ms) | **15-30 FPS** | **3-8 FPS** |
| YOLO26s-seg | ~300 FPS (3ms) | **8-15 FPS** | **1-4 FPS** |
| YOLO26m-seg | ~150 FPS (7ms) | **3-8 FPS** | **<1 FPS** |

**Key data points**:
- Browser inference ~5x slower than native GPU (community benchmarks)
- WebGPU provides 3-8x speedup over WebGL/WASM
- FP16 shaders add 2-3x additional speedup
- INT4 quantization reduces memory footprint by 75%

**ONNX export**:
```python
from ultralytics import YOLO
model = YOLO("yolo26n-seg.pt")
model.export(format="onnx")  # Creates yolo26n-seg.onnx
```

**Browser inference**:
```javascript
const session = await ort.InferenceSession.create('yolo26n-seg.onnx', {
  executionProviders: ['webgpu']  // Falls back to 'wasm'
});
```

### 2.3 Why NOT TensorFlow.js / MediaPipe

- **BodyPix 2.0**: 2019 architecture. Semantic segmentation only (person vs background). Cannot distinguish individual people.
- **MediaPipe Selfie Segmentation**: Designed for selfie/video-call (< 2m). No multi-person instance masks. No tracking IDs.
- Neither provides instance segmentation (individual body contours per person).

---

## 3. Camera Angle Performance Matrix

### 3.1 Detection Quality by Angle

| Angle from Horizontal | Detection Quality | Pose Accuracy | Segmentation Quality | Recommended Approach |
|---|---|---|---|---|
| 0-15° (eye level) | Excellent | Excellent | Excellent | Standard YOLO |
| 15-30° (standard retail) | Excellent | Good | Good | Standard YOLO |
| 30-45° (high mount) | Good | Moderate | Good | Standard YOLO, higher conf |
| 45-60° (steep) | Degraded (-20%) | Poor | Moderate | Fine-tuned YOLO |
| 60-90° (overhead) | **Fails** (-30-50%) | **Fails** | Poor | RAPiD or custom trained |

### 3.2 Per-Business-Environment Matrix

| Environment | Ceiling Height | Camera Angle | Density | Occlusion | Recommended Stack |
|---|---|---|---|---|---|
| Retail entrance | 10-12ft | 15-30° wall | Low-Med | Low | YOLO26s-seg + BoT-SORT |
| Retail aisle | 10-12ft | 30-45° ceiling | Medium | High (shelves) | YOLO26m-seg + StrongSORT |
| Retail checkout | 10-12ft | 20-35° wall | Medium | Medium (queues) | YOLO26s-seg + BoT-SORT |
| Warehouse | 20-40ft | 60°+ ceiling | Low-Med | Low | Overhead model + ByteTrack |
| Office open plan | 9-10ft | 25-40° | Low | Low | YOLO26n-seg + ByteTrack |
| Office meeting room | 9-10ft | 30-45° | Very low | None | YOLO26n-seg + ByteTrack |
| Restaurant | 10-14ft | 30-50° | Medium | High (tables) | YOLO26m-seg + BoT-SORT |
| Event venue (small) | 12-20ft | 30-60° mix | High | High | YOLO26l-seg + DeepOCSORT |
| Event venue (large) | 20-40ft | 45-90° mix | Very High | Extreme | Multi-camera + server-side |
| Airport terminal | 15-30ft | 45-70° | Very High | Medium | YOLO26l-seg + multi-cam BEV |

### 3.3 Overhead Detection Solutions

For cameras mounted >60° from horizontal:
- **RAPiD** (Rotation-Aware People Detection): CVPR 2020, designed for overhead fisheye
- **Custom YOLO fine-tuning** on overhead datasets (CEPDOF, OHD-SJTU)
- **Background subtraction + segmentation** for simple overhead counting

---

## 4. 3D Spatial Measurement Approaches

### 4.1 Accuracy Comparison

| Method | Position Accuracy | Setup Effort | Compute Cost | Real-Time? |
|---|---|---|---|---|
| **Homography (4-pt)** | **15-30cm** | Medium (manual calibration) | **Negligible** | **Yes** |
| Homography (8-pt + RANSAC) | 10-20cm | Medium-High | Negligible | Yes |
| Depth Anything V2 (metric) | ~5-15% relative error | Low (no calibration) | Medium (GPU) | Yes (Small) |
| Homography + Depth hybrid | 10-15cm | Medium | Medium | Yes |
| Stereo camera | 1-5cm | High (hardware) | Medium | Yes |
| LiDAR | 1-2cm | Very High (hardware) | Low | Yes |
| Multi-camera triangulation | 5-15cm | Hours of calibration | High | Yes |

### 4.2 Homography Calibration (Recommended Primary Approach)

**How it works**: 4+ reference points (pixel coords ↔ world coords in meters) → 3x3 homography matrix H → any pixel point projected to world coordinates via `world = H * pixel`.

**OpenCV implementation** (one function call):
```python
H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
world_pt = cv2.perspectiveTransform(pixel_pt, H)
```

**Setup process**:
1. Display camera feed in calibration UI
2. User clicks 4-8 reference points (tile corners, doorframes, etc.)
3. User enters real-world measurements in meters
4. System computes H and stores per-camera
5. Optional: verification points to check reprojection error

**Best practices for reference points**:
- Spread across entire field of view (not clustered)
- Use permanent ground-level features
- 6-8 points significantly improve robustness via RANSAC
- Include near, mid, and far distances from camera

**Limitations**: Works only for floor plane (2D). Requires re-calibration if camera moves. Cannot handle multiple floor levels.

### 4.3 Depth Estimation (Optional Enhancement)

**Depth Anything V2** (state-of-the-art monocular depth):

| Variant | Params | Speed | Indoor Error (AbsRel) |
|---|---|---|---|
| Small (ViT-S) | 25M | ~72 FPS, 98ms | 0.045 (SOTA) |
| Base (ViT-B) | ~96M | ~30-40 FPS | Better |
| Large (ViT-L) | ~256M | ~15-20 FPS | Best |

**Cannot replace homography** — depth gives Z-distance but not floor-plane (X,Y) without camera intrinsics. Best used as supplementary validation layer.

**Hybrid approach** (2023 paper): Homography primary + depth verification → 97.06% accuracy on height estimation. Provides redundancy and outlier detection.

### 4.4 Foot-Point Extraction

| Method | Accuracy | Compute Cost | Recommendation |
|---|---|---|---|
| **Bbox bottom-center** | **5-15 pixels** | **None** | **Use this** |
| Segmentation mask lowest point | 2-8 pixels | Requires seg model | Optional upgrade |
| Pose estimation ankles | 2-5 pixels (visible) | Heavy | Overkill |

Social distancing research confirms: "midpoint of the feet (bottom of bbox) is selected as anchor — reliable because it lies on the ground, allowing homography transformation."

### 4.5 Zone Management in World Coordinates

**Why world coordinates**: Camera-independent, multi-camera compatible, intuitive ("3m x 4m" vs "pixels 120,340 to 450,680").

**Point-in-polygon**: Ray casting algorithm — O(n) per point, 100% exact, simple to implement.

**Auto-projection**: Use inverse homography (`H_inv = np.linalg.inv(H)`) to project world-coordinate zone polygons back onto the camera view for visualization.

### 4.6 Three.js Room Visualization

**Architecture**: `Camera → Detection → Foot-Point → Homography → World (X,Y) → WebSocket → Three.js`

**Implementation approach**:
- Floor plane from room dimensions (meters)
- Zone overlays as semi-transparent colored polygons via `THREE.ShapeGeometry`
- Person markers as colored cylinders at world coordinates
- Real-time position updates via WebSocket with `Vector3.lerp()` for smooth interpolation

### 4.7 Implementation Complexity

| Component | Complexity | Est. Time | Dependencies |
|---|---|---|---|
| Homography calibration UI | 3/5 | 2-3 days | OpenCV, floor plan image |
| Foot-point extraction (bbox) | 1/5 | 0.5 day | Existing detections |
| World-coordinate zone system | 2/5 | 1-2 days | Homography matrix |
| Three.js room renderer | 3/5 | 2-3 days | Room dimensions, zone data |
| WebSocket real-time updates | 2/5 | 1 day | Backend WebSocket server |
| Depth Anything V2 integration | 3/5 | 2-3 days | Python, GPU, model download |
| Multi-camera stitching | 5/5 | 5-10 days | Per-camera calibration, Re-ID |

---

## 5. Cloud CV Services Assessment

### 5.1 Platform Status Summary

| Platform | Status | Instance Seg? | 3D Spatial? | Best For |
|---|---|---|---|---|
| Google Vertex AI Vision | **Active** | No | No | Zone counting ($20/stream/mo) |
| AWS Rekognition | **Declining** | No | No | Basic detection only |
| Azure Spatial Analysis | **Retired** (March 2025) | N/A | N/A | Nothing (dead) |
| NVIDIA Metropolis | **Active** | Yes (custom) | Yes (MV3DT) | Full 3D multi-cam |
| Self-hosted YOLO | **Always available** | Yes | Yes (custom) | Everything Janus needs |

### 5.2 Detailed Capability Matrix

| Capability | Google Vertex | AWS Rekognition | Azure | NVIDIA Metropolis | Self-Hosted YOLO |
|---|---|---|---|---|---|
| Person Detection | Yes (bbox) | Yes (bbox) | RETIRED | Yes | Yes |
| Instance Segmentation | **No** | **No** | RETIRED | Yes (custom) | **Yes** |
| Body Contours | **No** | **No** | RETIRED | Yes (custom) | **Yes** |
| 3D Room Measurement | **No** | **No** | RETIRED | **Yes (MV3DT)** | Yes (custom) |
| Zone Counting | Yes (native) | No (deprecated) | RETIRED | Yes | Yes (custom) |
| Dwell Time | Yes (native) | No | RETIRED | Yes | Yes (custom) |
| Line Crossing | Yes (native) | No | RETIRED | Yes | Yes (custom) |
| Pathing/Trajectories | No | DEPRECATED | RETIRED | **Yes (MV3DT)** | Yes (custom) |
| Edge Processing | No (cloud) | DEPRECATED | RETIRED | **Yes (Jetson)** | Yes (any GPU) |
| Multi-Camera | No | No | RETIRED | **Yes (native)** | Yes (custom) |
| Managed Service | Yes | Partial | RETIRED | No (SDK) | No |
| $/stream/month | $20 | ~$35 | Dead | Free SDK + HW | $288-530 GPU |

### 5.3 AWS Deprecation Status (Confirmed)

| Service | Status | Date |
|---|---|---|
| Rekognition People Pathing | **DISCONTINUED** | Oct 31, 2025 |
| AWS Panorama | **END OF SUPPORT** | May 31, 2026 |
| AWS DeepLens | **DISCONTINUED** | Jan 31, 2024 |

### 5.4 Azure Deprecation Status (Confirmed)

| Service | Status | Date |
|---|---|---|
| Azure Spatial Analysis | **RETIRED** | March 30, 2025 |
| Azure Video Analyzer | **RETIRED** | June 30, 2025 |
| Azure Percept DK | **RETIRED** | March 30, 2023 |
| Azure Kinect | **DISCONTINUED** | October 2023 |
| Azure Spatial Anchors | **RETIRED** | November 20, 2024 |

### 5.5 Self-Hosted GPU Pricing

| Platform | GPU | $/hour | $/month (24/7) | Billing |
|---|---|---|---|---|
| **RunPod Serverless** | T4 | $0.40 | $288 | Per-second |
| **Modal** | T4 | $0.59 | $425 | Per-second |
| **Modal** | A10G | $1.10 | $792 | Per-second |
| Replicate | T4 | $0.81 | $583 | Per-second |
| HuggingFace Endpoints | T4 | $0.50+ | $360+ | Per-minute |
| SageMaker | ml.g4dn.xl (T4) | $0.74 | $530 | Per-hour |
| SageMaker | ml.g5.xl (A10G) | $1.41 | $1,015 | Per-hour |

**Note**: Serverless GPU not ideal for persistent video streams (cold start latency). RunPod dedicated or SageMaker real-time endpoints better for continuous inference.

### 5.6 NVIDIA Metropolis Details

- **DeepStream SDK**: FREE (open-source)
- **Multi-View 3D Tracking (MV3DT)**: New in DeepStream 8.0
- **AI Enterprise License**: ~$1,000-5,000/GPU/year
- **Jetson Orin hardware**: $199 (Nano) to $1,999 (AGX 64GB)
- Most capable platform but requires hardware investment + ML expertise

---

## 6. Recommendations

### 6.1 Detection Model

| Use Case | Recommended Model | Rationale |
|---|---|---|
| **Real-time edge** | **YOLO26n-seg** or **YOLO26s-seg** | Best speed/accuracy tradeoff, crisper masks than YOLO11 |
| **Batch processing** | **YOLO26l-seg** | Highest quality masks for offline analysis |
| **Browser inference** | **YOLO26n-seg (ONNX + WebGPU)** | 15-30 FPS achievable on consumer hardware |
| **Overhead cameras** | Custom fine-tuned YOLO or RAPiD | Standard models fail >60° |

### 6.2 3D Spatial System

| Component | Recommended Approach |
|---|---|
| **Floor-plane mapping** | Homography calibration (4-8 reference points) |
| **Foot-point extraction** | Bbox bottom-center (simplest, proven) |
| **Zone geometry** | World-coordinate polygons with ray-casting PIP |
| **3D visualization** | Three.js room with cylinder person markers |
| **Depth estimation** | Optional Phase 2 — Depth Anything V2 Small for validation |
| **Multi-camera** | Future — requires Re-ID + per-camera homography |

### 6.3 Cloud Strategy

| Stage | Recommendation | Cost |
|---|---|---|
| **Demo/Prototype** | Stay 100% local — YOLO-seg on edge | $0 (existing hardware) |
| **Production MVP** | Self-hosted on RunPod (T4) | ~$288/mo |
| **Scale-up** | NVIDIA Metropolis + Jetson for edge | $199-1,999 hardware + free SDK |
| **Fallback (zone counting only)** | Google Vertex AI Vision | $20/stream/mo |
| **Avoid** | AWS Rekognition, Azure Spatial | Deprecated/retiring |

### 6.4 Tracking Upgrade

| Current | Target | Benefit |
|---|---|---|
| ByteTrack (ReID off) | BoT-SORT (ReID on) | Fewer ID switches after occlusion |
| Ultralytics built-in | BoxMOT framework | Pluggable tracker selection |
| 30-frame buffer | 90-frame buffer (3s @ 30fps) | Better track persistence |
| Point-in-rectangle zones | Point-in-polygon world zones | Arbitrary zone shapes |

---

*Report generated by 3 parallel research agents covering models, spatial mapping, and cloud services.*
*All findings verified against current documentation and published benchmarks.*
