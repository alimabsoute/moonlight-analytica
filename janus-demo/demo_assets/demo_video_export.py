#!/usr/bin/env python3
"""
Janus Demo Video Export
=======================
Renders a single MP4 from a source video showing:
  1. Zone polygons being "drawn" by a simulated cursor (intro phase)
  2. Real RF-DETR + ByteTrack person tracking with bounding boxes + IDs
  3. Live KPI dashboard side-panel computed from per-frame tracking output

Output is a composited 1760x720 MP4 ready to send to prospects.

Usage:
    # Live inference (slower, ~3 FPS on CPU)
    python demo_video_export.py --video PATH --config demo_config.json --output out.mp4

    # Replay from existing _tracking.json (fast, visual iteration)
    python demo_video_export.py --video PATH --config demo_config.json --output out.mp4 \\
        --replay edge_agent/video_library/<id>_tracking.json
"""
import argparse
import json
import math
import os
import sys
import time
from collections import deque
from pathlib import Path

import cv2
import numpy as np


VIDEO_W = 1280
VIDEO_H = 720
PANEL_W = 480
OUT_W = VIDEO_W + PANEL_W
OUT_H = VIDEO_H

ZONE_DRAW_DURATION_S = 2.5
SETTLE_DURATION_S = 0.5
HISTORY_WINDOW_S = 30

PANEL_BG = (245, 245, 247)
PANEL_LINE = (220, 220, 226)
TEXT_PRIMARY = (28, 28, 32)
TEXT_SECONDARY = (110, 110, 120)
ACCENT = (32, 116, 255)


def load_config(path):
    with open(path) as f:
        return json.load(f)


def load_replay(path):
    with open(path) as f:
        data = json.load(f)
    by_frame = {}
    frames = data.get("frames", [])
    indices = [int(f_entry["frame"]) for f_entry in frames] if frames else [0]
    offset = 1 if min(indices) == 0 else 0
    for f_entry in frames:
        idx = int(f_entry["frame"]) + offset
        by_frame[idx] = [
            {"id": det["id"], "bbox": det["bbox"]}
            for det in f_entry.get("detections", [])
        ]
    return by_frame


def scale_polygon(points, src_w, src_h, dst_w, dst_h):
    sx = dst_w / src_w
    sy = dst_h / src_h
    return np.array([[p[0] * sx, p[1] * sy] for p in points], dtype=np.float32)


def point_in_polygon(x, y, poly_pts):
    return cv2.pointPolygonTest(poly_pts.astype(np.float32), (float(x), float(y)), False) >= 0


def draw_zone_intro(canvas, zones, progress):
    """progress in [0,1] across all zones -> draw cursor motion, dot placement, polygon close."""
    n = len(zones)
    if n == 0:
        return
    per_zone = 1.0 / n

    for i, z in enumerate(zones):
        zone_start = i * per_zone
        zone_local = (progress - zone_start) / per_zone
        if zone_local <= 0:
            continue

        pts = z["polygon_scaled"]
        color = z["color_bgr"]
        num_pts = len(pts)

        place_phase = 0.85
        close_phase = 1.0

        if zone_local <= place_phase:
            sub = zone_local / place_phase
            placed = int(sub * num_pts)
            t_within = (sub * num_pts) - placed

            for k in range(min(placed, num_pts)):
                cv2.circle(canvas, tuple(pts[k].astype(int)), 6, color, -1)
                cv2.circle(canvas, tuple(pts[k].astype(int)), 8, (255, 255, 255), 2)
            for k in range(min(placed, num_pts) - 1):
                cv2.line(canvas, tuple(pts[k].astype(int)), tuple(pts[k + 1].astype(int)), color, 2)

            if placed < num_pts:
                if placed == 0:
                    cur = pts[0]
                else:
                    a = pts[placed - 1]
                    b = pts[placed]
                    cur = a + (b - a) * t_within
                cur_int = tuple(cur.astype(int))
                cv2.circle(canvas, cur_int, 10, (255, 255, 255), 2)
                cv2.circle(canvas, cur_int, 4, color, -1)
                cv2.line(canvas, (cur_int[0] - 14, cur_int[1]), (cur_int[0] + 14, cur_int[1]),
                         (255, 255, 255), 1)
                cv2.line(canvas, (cur_int[0], cur_int[1] - 14), (cur_int[0], cur_int[1] + 14),
                         (255, 255, 255), 1)

                cv2.putText(canvas, f"placing {z['name']}",
                            (cur_int[0] + 18, cur_int[1] - 12),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)
        else:
            close_local = (zone_local - place_phase) / (close_phase - place_phase)
            close_local = max(0.0, min(1.0, close_local))

            for k in range(num_pts):
                cv2.circle(canvas, tuple(pts[k].astype(int)), 6, color, -1)
            for k in range(num_pts):
                cv2.line(canvas, tuple(pts[k].astype(int)),
                         tuple(pts[(k + 1) % num_pts].astype(int)), color, 2)

            overlay = canvas.copy()
            cv2.fillPoly(overlay, [pts.astype(np.int32)], color)
            alpha = 0.18 * close_local
            cv2.addWeighted(overlay, alpha, canvas, 1 - alpha, 0, canvas)

            cx, cy = pts.mean(axis=0).astype(int)
            label = z["name"]
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(canvas, (cx - tw // 2 - 8, cy - th - 8),
                          (cx + tw // 2 + 8, cy + 8), color, -1)
            cv2.putText(canvas, label, (cx - tw // 2, cy + 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)


def draw_zones_static(canvas, zones, occupancy_by_zone):
    overlay = canvas.copy()
    for z in zones:
        pts = z["polygon_scaled"].astype(np.int32)
        cv2.fillPoly(overlay, [pts], z["color_bgr"])
    cv2.addWeighted(overlay, 0.18, canvas, 0.82, 0, canvas)

    for z in zones:
        pts = z["polygon_scaled"].astype(np.int32)
        cv2.polylines(canvas, [pts], True, z["color_bgr"], 2)
        cx, cy = pts.mean(axis=0).astype(int)
        count = occupancy_by_zone.get(z["name"], 0)
        label = f"{z['name'].upper()}  {count}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(canvas, (cx - tw // 2 - 8, cy - th - 8),
                      (cx + tw // 2 + 8, cy + 8), z["color_bgr"], -1)
        cv2.putText(canvas, label, (cx - tw // 2, cy + 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)


def draw_tracks(canvas, tracks, palette):
    for t in tracks:
        x1, y1, x2, y2 = t["bbox"]
        tid = t["id"]
        color = palette[tid % len(palette)]
        cv2.rectangle(canvas, (x1, y1), (x2, y2), color, 2)
        label = f"#{tid}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(canvas, (x1, y1 - th - 8), (x1 + tw + 6, y1), color, -1)
        cv2.putText(canvas, label, (x1 + 3, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        fx, fy = (x1 + x2) // 2, y2
        cv2.circle(canvas, (fx, fy), 4, color, -1)


def render_panel(panel, scenario, kpis, zones, occupancy_by_zone, history, t_seconds):
    panel[:] = PANEL_BG
    pad = 20
    cv2.rectangle(panel, (0, 0), (PANEL_W, 64), (255, 255, 255), -1)
    cv2.line(panel, (0, 64), (PANEL_W, 64), PANEL_LINE, 1)
    cv2.putText(panel, "JANUS", (pad, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, TEXT_PRIMARY, 2, cv2.LINE_AA)
    cv2.putText(panel, scenario.upper(), (pad, 52),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, TEXT_SECONDARY, 1, cv2.LINE_AA)
    cv2.circle(panel, (PANEL_W - pad - 8, 30), 5, (0, 200, 80), -1)
    cv2.putText(panel, "LIVE", (PANEL_W - pad - 50, 34),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 160, 60), 2, cv2.LINE_AA)

    y = 84
    tile_w = (PANEL_W - pad * 2 - 12) // 2
    tile_h = 80

    tiles = [
        ("CURRENT OCCUPANCY", str(kpis["occupancy"]), "people"),
        ("TOTAL ENTRIES", str(kpis["entries"]), "since start"),
        ("AVG DWELL", kpis["avg_dwell"], "seconds"),
        ("PEAK OCCUPANCY", str(kpis["peak"]), "this session"),
    ]
    for i, (label, value, sub) in enumerate(tiles):
        row = i // 2
        col = i % 2
        tx = pad + col * (tile_w + 12)
        ty = y + row * (tile_h + 10)
        cv2.rectangle(panel, (tx, ty), (tx + tile_w, ty + tile_h), (255, 255, 255), -1)
        cv2.rectangle(panel, (tx, ty), (tx + tile_w, ty + tile_h), PANEL_LINE, 1)
        cv2.putText(panel, label, (tx + 10, ty + 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.36, TEXT_SECONDARY, 1, cv2.LINE_AA)
        cv2.putText(panel, value, (tx + 10, ty + 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.95, TEXT_PRIMARY, 2, cv2.LINE_AA)
        cv2.putText(panel, sub, (tx + 10, ty + 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.36, TEXT_SECONDARY, 1, cv2.LINE_AA)

    y = 84 + 2 * (tile_h + 10) + 8
    cv2.putText(panel, "PER ZONE", (pad, y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, TEXT_SECONDARY, 1, cv2.LINE_AA)
    y += 14

    max_count = max(occupancy_by_zone.values()) if occupancy_by_zone else 1
    max_count = max(max_count, 1)
    bar_h = 24
    for z in zones:
        name = z["name"]
        count = occupancy_by_zone.get(name, 0)
        cv2.putText(panel, name.upper(), (pad, y + 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, TEXT_PRIMARY, 1, cv2.LINE_AA)
        cv2.putText(panel, str(count), (PANEL_W - pad - 30, y + 14),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, TEXT_PRIMARY, 2, cv2.LINE_AA)
        bar_y = y + 18
        bar_x1 = pad
        bar_x2 = PANEL_W - pad
        cv2.rectangle(panel, (bar_x1, bar_y), (bar_x2, bar_y + 4), (230, 230, 234), -1)
        fill = int((bar_x2 - bar_x1) * count / max_count) if max_count > 0 else 0
        cv2.rectangle(panel, (bar_x1, bar_y), (bar_x1 + fill, bar_y + 4), z["color_bgr"], -1)
        y += bar_h + 8

    y += 8
    cv2.putText(panel, "OCCUPANCY  LAST 30s", (pad, y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, TEXT_SECONDARY, 1, cv2.LINE_AA)
    y += 10
    spark_h = 80
    cv2.rectangle(panel, (pad, y), (PANEL_W - pad, y + spark_h), (255, 255, 255), -1)
    cv2.rectangle(panel, (pad, y), (PANEL_W - pad, y + spark_h), PANEL_LINE, 1)
    if len(history) >= 2:
        hmax = max(max(history), 1)
        n = len(history)
        for i in range(n - 1):
            x1 = pad + int((PANEL_W - pad * 2) * i / max(n - 1, 1))
            x2 = pad + int((PANEL_W - pad * 2) * (i + 1) / max(n - 1, 1))
            y1 = y + spark_h - int((spark_h - 8) * history[i] / hmax) - 4
            y2 = y + spark_h - int((spark_h - 8) * history[i + 1] / hmax) - 4
            cv2.line(panel, (x1, y1), (x2, y2), ACCENT, 2)
    y += spark_h + 12

    cv2.putText(panel, f"runtime  {t_seconds:5.1f}s", (pad, OUT_H - 16),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, TEXT_SECONDARY, 1, cv2.LINE_AA)


def hex_to_bgr(s):
    s = s.lstrip("#")
    r = int(s[0:2], 16)
    g = int(s[2:4], 16)
    b = int(s[4:6], 16)
    return (b, g, r)


def fit_video_frame(frame):
    h, w = frame.shape[:2]
    scale = min(VIDEO_W / w, VIDEO_H / h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((VIDEO_H, VIDEO_W, 3), dtype=np.uint8)
    ox = (VIDEO_W - new_w) // 2
    oy = (VIDEO_H - new_h) // 2
    canvas[oy:oy + new_h, ox:ox + new_w] = resized
    return canvas, scale, ox, oy, w, h


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--config", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--replay", help="Pre-computed _tracking.json for fast visual iteration")
    ap.add_argument("--conf", type=float, default=0.30)
    ap.add_argument("--max-seconds", type=float, default=None)
    ap.add_argument("--detect-every", type=int, default=2,
                    help="Detect every N frames (live mode); skipped frames reuse previous tracks")
    args = ap.parse_args()

    cfg = load_config(args.config)
    scenario = cfg.get("scenario", "Demo")
    src_w = cfg.get("reference_resolution", [VIDEO_W, VIDEO_H])[0]
    src_h = cfg.get("reference_resolution", [VIDEO_W, VIDEO_H])[1]

    cap = cv2.VideoCapture(args.video)
    if not cap.isOpened():
        print(f"Cannot open video: {args.video}")
        sys.exit(1)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    src_w_actual = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    src_h_actual = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if args.max_seconds:
        total_frames = min(total_frames, int(args.max_seconds * fps))
    duration = total_frames / fps
    print(f"[INFO] Source: {src_w_actual}x{src_h_actual} @ {fps:.1f}fps  frames={total_frames}  duration={duration:.1f}s")

    _, scale, ox, oy, _, _ = fit_video_frame(np.zeros((src_h_actual, src_w_actual, 3), dtype=np.uint8))

    zones = []
    for z in cfg.get("zones", []):
        pts_src = np.array(z["polygon"], dtype=np.float32)
        pts_video = np.array([[p[0] * scale + ox, p[1] * scale + oy] for p in pts_src], dtype=np.float32)
        zones.append({
            "name": z["name"],
            "color_bgr": hex_to_bgr(z.get("color", "#2074FF")),
            "polygon_src": pts_src,
            "polygon_scaled": pts_video,
            "polygon_for_hit_test": np.array(
                [[p[0] * (src_w_actual / src_w), p[1] * (src_h_actual / src_h)] for p in pts_src],
                dtype=np.float32),
            "type": z.get("type", "general"),
        })

    intro_frames = int(ZONE_DRAW_DURATION_S * fps)
    settle_frames = int(SETTLE_DURATION_S * fps)
    total_intro = intro_frames + settle_frames

    palette = [
        (255, 87, 51), (255, 195, 0), (76, 175, 80), (33, 150, 243),
        (156, 39, 176), (255, 152, 0), (0, 188, 212), (233, 30, 99),
        (139, 195, 74), (96, 125, 139),
    ]

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(args.output, fourcc, fps, (OUT_W, OUT_H))
    if not writer.isOpened():
        print(f"Cannot open writer: {args.output}")
        sys.exit(1)

    replay_by_frame = None
    model = None
    tracker = None
    last_tracks = []
    last_detections = None
    if args.replay:
        replay_by_frame = load_replay(args.replay)
        print(f"[INFO] Replay mode: {len(replay_by_frame)} frames in tracking.json")
    else:
        print("[INFO] Live mode: loading RF-DETR + ByteTrack (this takes ~30s)")
        os.environ.setdefault("OMP_NUM_THREADS", "1")
        os.environ.setdefault("MKL_NUM_THREADS", "1")
        from rfdetr import RFDETRNano
        from trackers import ByteTrackTracker
        import supervision as sv
        model = RFDETRNano()
        tracker = ByteTrackTracker(
            lost_track_buffer=int(fps * 3),
            minimum_consecutive_frames=3,
        )
        globals()["sv"] = sv

    seen_ids = set()
    peak_occupancy = 0
    track_first_frame = {}
    history = deque(maxlen=int(HISTORY_WINDOW_S * fps / 3))
    panel = np.zeros((OUT_H, PANEL_W, 3), dtype=np.uint8)

    frame_idx = 0
    t0 = time.time()

    while True:
        ok, frame = cap.read()
        if not ok or frame_idx >= total_frames:
            break
        frame_idx += 1

        canvas, _, _, _, _, _ = fit_video_frame(frame)

        in_intro = frame_idx <= total_intro
        intro_progress = min(1.0, frame_idx / max(intro_frames, 1)) if in_intro else 1.0

        if in_intro and frame_idx <= intro_frames:
            draw_zone_intro(canvas, zones, intro_progress)
            tracks_now = []
        else:
            if replay_by_frame is not None:
                tracks_now = replay_by_frame.get(frame_idx, last_tracks)
            else:
                if (frame_idx - 1) % args.detect_every == 0:
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    detections = model.predict(rgb, threshold=args.conf)
                    if detections.class_id is not None and len(detections) > 0:
                        detections.data.pop("source_image", None)
                        detections.data.pop("source_shape", None)
                        detections = detections[detections.class_id == 1]
                    detections = tracker.update(detections)
                    last_detections = detections
                    tracks_now = []
                    if detections.tracker_id is not None and len(detections) > 0:
                        for i, tid in enumerate(detections.tracker_id):
                            bbox_src = [int(round(v)) for v in detections.xyxy[i].tolist()]
                            bbox_canvas = [
                                int(bbox_src[0] * scale + ox),
                                int(bbox_src[1] * scale + oy),
                                int(bbox_src[2] * scale + ox),
                                int(bbox_src[3] * scale + oy),
                            ]
                            tracks_now.append({"id": int(tid), "bbox": bbox_canvas})
                else:
                    tracks_now = last_tracks

            last_tracks = tracks_now

            occ_by_zone = {z["name"]: 0 for z in zones}
            for t in tracks_now:
                x1, y1, x2, y2 = t["bbox"]
                fx, fy = (x1 + x2) / 2, y2
                for z in zones:
                    if point_in_polygon(fx, fy, z["polygon_scaled"]):
                        occ_by_zone[z["name"]] += 1
                        break

            draw_zones_static(canvas, zones, occ_by_zone)
            draw_tracks(canvas, tracks_now, palette)

        for t in tracks_now:
            if t["id"] not in seen_ids:
                seen_ids.add(t["id"])
                track_first_frame[t["id"]] = frame_idx

        current_occ = len(tracks_now)
        peak_occupancy = max(peak_occupancy, current_occ)

        if not in_intro:
            avg_dwell_frames = 0
            if track_first_frame:
                avg_dwell_frames = sum((frame_idx - f) for f in track_first_frame.values()) / len(track_first_frame)
            avg_dwell_s = avg_dwell_frames / fps
            avg_dwell_str = f"{avg_dwell_s:.1f}"
        else:
            avg_dwell_str = "0.0"

        kpis = {
            "occupancy": current_occ,
            "entries": len(seen_ids),
            "avg_dwell": avg_dwell_str,
            "peak": peak_occupancy,
        }

        if frame_idx % 3 == 0:
            history.append(current_occ)

        occ_by_zone_panel = {z["name"]: 0 for z in zones}
        if not in_intro:
            for t in tracks_now:
                x1, y1, x2, y2 = t["bbox"]
                fx, fy = (x1 + x2) / 2, y2
                for z in zones:
                    if point_in_polygon(fx, fy, z["polygon_scaled"]):
                        occ_by_zone_panel[z["name"]] += 1
                        break

        render_panel(panel, scenario, kpis, zones, occ_by_zone_panel, history, frame_idx / fps)

        out_frame = np.zeros((OUT_H, OUT_W, 3), dtype=np.uint8)
        out_frame[:, :VIDEO_W] = canvas
        out_frame[:, VIDEO_W:] = panel

        writer.write(out_frame)

        if frame_idx % 30 == 0:
            elapsed = time.time() - t0
            proc_fps = frame_idx / elapsed if elapsed > 0 else 0
            eta = (total_frames - frame_idx) / proc_fps if proc_fps > 0 else 0
            print(f"  [{100*frame_idx/total_frames:5.1f}%] frame {frame_idx}/{total_frames}  "
                  f"{proc_fps:.1f} render-fps  ETA {eta:.0f}s  occ={current_occ}  entries={len(seen_ids)}")

    writer.release()
    cap.release()
    elapsed = time.time() - t0
    print(f"\n[DONE] Wrote {args.output}  ({elapsed:.1f}s, {frame_idx/elapsed:.1f} render-fps)")


if __name__ == "__main__":
    main()
