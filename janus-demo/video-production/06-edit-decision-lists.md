# Edit Decision Lists (EDLs) — Shot-by-Shot Assembly

## Editing Software
- **Recommended**: DaVinci Resolve (free) or Adobe Premiere Pro
- **Timeline**: 1920x1080, 24fps, 16:9
- **Audio**: 48kHz, stereo
- **Export**: H.264, 10 Mbps, MP4

## Global Settings
- **Crossfade default**: 0.2s (6 frames at 24fps)
- **Fade to black**: 0.5s between major segments
- **Lower third hold**: 2 seconds
- **Music level under VO**: -18 to -20 dB
- **Music level without VO**: -12 dB
- **VO level**: -6 dB

---

## EDL: VIDEO 1 — "Product Demo" (60s)

**Timeline**: `V1-product-demo.drp`
**Music track**: `music-05-demo-energetic.wav` (loop 2x for 60s)

| # | TC In | TC Out | Dur | V-Track | Source | Transition In | Transition Out |
|---|-------|--------|-----|---------|--------|---------------|----------------|
| 1 | 00:00:00 | 00:00:03 | 3s | V1 | MG-1A: Title card | Fade from black (0.5s) | Crossfade (0.2s) |
| 2 | 00:00:03 | 00:00:10 | 7s | V1 | Session 1 Shot 1.1: Hero stat cards | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:03 | 00:00:05 | 2s | V2 | MG-1B: "LIVE MONITOR" lower third | Slide in left | Fade out |
| 3 | 00:00:10 | 00:00:17 | 7s | V1 | Session 1 Shot 1.2: Video feed + bboxes | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:10 | 00:00:12 | 2s | V2 | MG-1B: "AI DETECTION" lower third | Slide in left | Fade out |
| 4 | 00:00:17 | 00:00:22 | 5s | V1 | Session 3 Shot 3.1: Heatmap full view | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:17 | 00:00:19 | 2s | V2 | MG-1B: "HEATMAP" lower third | Slide in left | Fade out |
| 5 | 00:00:22 | 00:00:28 | 6s | V1 | Session 2 Shot 2.6: Conversion funnel | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:22 | 00:00:24 | 2s | V2 | MG-1B: "CONVERSION FUNNEL" lower third | Slide in left | Fade out |
| 6 | 00:00:28 | 00:00:33 | 5s | V1 | Session 2 Shot 2.5: Dwell time pie | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:28 | 00:00:30 | 2s | V2 | MG-1B: "DWELL TIME" lower third | Slide in left | Fade out |
| 7 | 00:00:33 | 00:00:38 | 5s | V1 | Session 2 Shot 2.4: Zone radar chart | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:33 | 00:00:35 | 2s | V2 | MG-1B: "ZONE PERFORMANCE" lower third | Slide in left | Fade out |
| 8 | 00:00:38 | 00:00:43 | 5s | V1 | Session 5 Shot 5.2: Preset switching | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:38 | 00:00:40 | 2s | V2 | MG-1B: "USE-CASE PRESETS" lower third | Slide in left | Fade out |
| 9 | 00:00:43 | 00:00:50 | 7s | V1 | Session 6 Shot 6.1: 3D Tracking (hero) | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:43 | 00:00:45 | 2s | V2 | MG-1B: "3D TRACKING" lower third | Slide in left | Fade out |
| 10 | 00:00:50 | 00:00:53 | 3s | V1 | Session 2 Shot 2.8: Insight cards | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:50 | 00:00:52 | 2s | V2 | MG-1B: "INSIGHTS" lower third | Slide in left | Fade out |
| 11 | 00:00:53 | 00:00:57 | 4s | V1 | Session 2 Shot 2.7: Traffic comparison | Crossfade (0.2s) | Crossfade (0.2s) |
| — | 00:00:53 | 00:00:55 | 2s | V2 | MG-1B: "TRENDS" lower third | Slide in left | Fade out |
| 12 | 00:00:57 | 00:01:00 | 3s | V1 | MG-1C: End card | Crossfade (0.2s) | Fade to black (0.5s) |

**Audio tracks**:
| Track | Source | TC In | TC Out | Level |
|-------|--------|-------|--------|-------|
| A1 | Narration VO | 00:00:00 | 00:01:00 | -6 dB |
| A2 | music-05-demo-energetic.wav (loop) | 00:00:00 | 00:01:00 | -18 dB (duck under VO) |

---

## EDL: VIDEO 2 — "The Problem" (30s)

**Timeline**: `V2-the-problem.drp`
**Music track**: `music-01-problem-tense.wav` (single play)

| # | TC In | TC Out | Dur | V-Track | Source | Transition In | Transition Out |
|---|-------|--------|-----|---------|--------|---------------|----------------|
| 1 | 00:00:00 | 00:00:05 | 5s | V1 | Veo B1: Frustrated store owner | Fade from black (0.5s) | Crossfade (0.2s) |
| 2 | 00:00:05 | 00:00:10 | 5s | V1 | Veo B2: Busy store overhead | Crossfade (0.2s) | Hard cut |
| 3 | 00:00:10 | 00:00:14 | 4s | V1 | Veo B3: Person enters and leaves | Hard cut | Hard cut to black (0.3s) |
| 4 | 00:00:14 | 00:00:18 | 4s | V1 | MG-2A: "68%" stat reveal | Cut from black | Hard cut to black (0.2s) |
| 5 | 00:00:18 | 00:00:22 | 4s | V1 | MG-2B: "$4.5B" stat reveal | Cut from black | Dissolve (0.5s) |
| 6 | 00:00:22 | 00:00:27 | 5s | V1 | Session 1 Shot 1.1: Live Monitor stats | Dissolve in (0.5s) | Crossfade (0.3s) |
| 7 | 00:00:27 | 00:00:30 | 3s | V1 | MG-2C: End card | Crossfade (0.3s) | Fade to black (0.5s) |

**Audio tracks**:
| Track | Source | TC In | TC Out | Level |
|-------|--------|-------|--------|-------|
| A1 | Narration VO | 00:00:00 | 00:00:30 | -6 dB |
| A2 | music-01-problem-tense.wav | 00:00:00 | 00:00:30 | -18 dB (full -12 dB at 0:10-0:14 during VO silence) |

**Special Notes**:
- Shot 3 (B3): NO narration — music fills at higher volume (-12 dB)
- Hard cut to black between B3 and "68%" creates dramatic impact
- Dissolve from "$4.5B" into dashboard = "solution emerging from the problem"

---

## EDL: VIDEO 3 — "How It Works" (60s)

**Timeline**: `V3-how-it-works.drp`
**Music track**: `music-02-how-it-works-confident.wav` (loop 2x)

| # | TC In | TC Out | Dur | V-Track | Source | Transition In | Transition Out |
|---|-------|--------|-----|---------|--------|---------------|----------------|
| 1 | 00:00:00 | 00:00:06 | 6s | V1 | Veo B4: Camera above doorway | Fade from black (0.5s) | Hard cut |
| 2 | 00:00:06 | 00:00:10 | 4s | V1 | MG-3A: Step 1 card | Hard cut | Crossfade (0.2s) |
| 3 | 00:00:10 | 00:00:18 | 8s | V1 | Session 1 Shot 1.2: YOLO bounding boxes | Crossfade (0.2s) | — |
| 4 | 00:00:18 | 00:00:20 | 2s | V2 | MG-3B: Detection overlay (on top of V1) | Slide down | Slide up |
| 5 | 00:00:20 | 00:00:28 | 8s | V1 | Session 4 Shot 4.1-4.3: Zone Config | Crossfade (0.2s) | Hard cut |
| 6 | 00:00:28 | 00:00:30 | 2s | V1 | MG-3C: Step 3 card | Hard cut | Hard cut |
| 7a | 00:00:30 | 00:00:33 | 3s | V1 | Session 2 Shot 2.1: KPI grid | Hard cut | Hard cut |
| 7b | 00:00:33 | 00:00:36 | 3s | V1 | Session 2 Shot 2.5: Dwell pie chart | Hard cut | Hard cut |
| 7c | 00:00:36 | 00:00:39 | 3s | V1 | Session 2 Shot 2.6: Conversion funnel | Hard cut | Hard cut |
| 7d | 00:00:39 | 00:00:42 | 3s | V1 | Session 2 Shot 2.7: Traffic comparison | Hard cut | — |
| 8 | 00:00:42 | 00:00:44 | 2s | V2 | MG-3D: "50+ KPIs" overlay (on top of V1) | Slide up | Fade out |
| 9 | 00:00:44 | 00:00:52 | 8s | V1 | Veo B5: Manager viewing dashboard | Crossfade (0.3s) | — |
| 10 | 00:00:52 | 00:00:55 | 3s | V2 | MG-3E: Action text overlay (on B5) | Fade in | Fade out |
| 11 | 00:00:55 | 00:01:00 | 5s | V1 | MG-3F: End card | Crossfade (0.3s) | Fade to black (0.5s) |

**Audio tracks**:
| Track | Source | TC In | TC Out | Level |
|-------|--------|-------|--------|-------|
| A1 | Narration VO | 00:00:00 | 00:01:00 | -6 dB |
| A2 | music-02-how-it-works-confident.wav (loop) | 00:00:00 | 00:01:00 | -18 dB |

**Special Notes**:
- 0:30-0:42 is a "dashboard montage" — 4 rapid 3-second cuts with hard transitions (SaaS demo style)
- MG-3B and MG-3D are overlays on V2 track, composited on top of dashboard footage
- MG-3E action text appears over the B5 Veo footage (bottom-right position)

---

## EDL: VIDEO 4 — "Privacy-First" (30s)

**Timeline**: `V4-privacy-first.drp`
**Music track**: `music-03-privacy-calm.wav` (single play)

| # | TC In | TC Out | Dur | V-Track | Source | Transition In | Transition Out |
|---|-------|--------|-----|---------|--------|---------------|----------------|
| 1L | 00:00:00 | 00:00:08 | 8s | V1 (left 50%) | Veo B6: Menacing CCTV camera | Fade from black (0.5s) | Wipe right (right side expands) |
| 1R | 00:00:00 | 00:00:08 | 8s | V2 (right 50%) | Session 1 Shot 1.1: Live Monitor | Fade from black (0.5s) | Expand to full (0.3s) |
| 2 | 00:00:08 | 00:00:14 | 6s | V1 | Session 1 Shot 1.7: 2D Humanoid Demo | Wipe from right | Crossfade (0.2s) |
| 3 | 00:00:14 | 00:00:16 | 2s | V1 | MG-4A: Anonymous ID animation | Crossfade (0.2s) | Hard cut |
| 4 | 00:00:16 | 00:00:18 | 2s | V1 | MG-4B: "No video stored" | Hard cut | Hard cut |
| 5 | 00:00:18 | 00:00:24 | 6s | V1 | MG-4C: Compliance badges | Hard cut | Crossfade (0.2s) |
| 6 | 00:00:24 | 00:00:27 | 3s | V1 | MG-4D: Architecture statement | Crossfade (0.2s) | Crossfade (0.3s) |
| 7 | 00:00:27 | 00:00:30 | 3s | V1 | MG-4E: End card "Built Different" | Crossfade (0.3s) | Fade to black (0.5s) |

**Audio tracks**:
| Track | Source | TC In | TC Out | Level |
|-------|--------|-------|--------|-------|
| A1 | Narration VO | 00:00:00 | 00:00:30 | -6 dB |
| A2 | music-03-privacy-calm.wav | 00:00:00 | 00:00:30 | -20 dB (quieter — voice is intimate) |

**Special Notes — Split Screen Composite (Shot 1)**:
- This is the most complex edit in the series
- V1 = Left half of frame: Veo B6 (menacing CCTV)
- V2 = Right half of frame: Janus Live Monitor dashboard
- At 0:08, the right side wipes/expands to full screen, becoming Shot 2 (2D Humanoid Demo)
- The expansion symbolizes "Janus replaces surveillance"
- Add a thin white vertical divider line (1px) between left and right during split

---

## EDL: VIDEO 5 — "Technical Deep Dive" (2:30)

**Timeline**: `V5-tech-deep-dive.drp`
**Music track**: `music-04-tech-deep-dive-electronic.wav` (loop 5x)

### Segment 1: Architecture (0:00-0:25)

| # | TC In | TC Out | Dur | V-Track | Source | Transition In | Transition Out |
|---|-------|--------|-----|---------|--------|---------------|----------------|
| 1 | 00:00:00 | 00:00:25 | 25s | V1 | MG-5A: Architecture diagram (animated) | Fade from black (0.5s) | Fade to black (0.5s) |

### Segment 2: Edge Agent (0:25-1:00)

| # | TC In | TC Out | Dur | V-Track | Source | Transition In | Transition Out |
|---|-------|--------|-----|---------|--------|---------------|----------------|
| 2 | 00:00:25 | 00:00:35 | 10s | V1 | Session 1 Shot 1.2: YOLO detection | Fade from black (0.5s) | Crossfade (0.2s) |
| 3 | 00:00:35 | 00:00:45 | 10s | V1 | MG-5B: Model comparison (3 cards) | Crossfade (0.2s) | Crossfade (0.2s) |
| 4 | 00:00:45 | 00:00:55 | 10s | V1 | MG-5C: Tracker comparison | Crossfade (0.2s) | Crossfade (0.2s) |
| 5 | 00:00:55 | 00:01:00 | 5s | V1 | Session 4 Shot 4.1: Zone overlay | Crossfade (0.2s) | Fade to black (0.5s) |

### Segment 3: Backend (1:00-1:30)

| # | TC In | TC Out | Dur | V-Track | Source | Transition In | Transition Out |
|---|-------|--------|-----|---------|--------|---------------|----------------|
| 6 | 00:01:00 | 00:01:10 | 10s | V1 | MG: Event stream visualization (JSON) | Fade from black (0.5s) | Crossfade (0.2s) |
| 7 | 00:01:10 | 00:01:20 | 10s | V1 | MG: Session construction diagram | Crossfade (0.2s) | Crossfade (0.2s) |
| 8 | 00:01:20 | 00:01:30 | 10s | V1 | MG-5D: IS vs NOT stored | Crossfade (0.2s) | Fade to black (0.5s) |

### Segment 4: Dashboard Walkthrough (1:30-2:10)

| # | TC In | TC Out | Dur | V-Track | Source | Transition In | Transition Out |
|---|-------|--------|-----|---------|--------|---------------|----------------|
| 9 | 00:01:30 | 00:01:38 | 8s | V1 | Session 1 Shot 1.1: Live Monitor | Fade from black (0.5s) | Hard cut |
| 10 | 00:01:38 | 00:01:46 | 8s | V1 | Session 2 Shot 2.1+2.5+2.6: Analytics montage | Hard cut | Hard cut |
| 11 | 00:01:46 | 00:01:54 | 8s | V1 | Session 3 Shot 3.1: Heatmap | Hard cut | Hard cut |
| 12 | 00:01:54 | 00:02:02 | 8s | V1 | Session 4 Shot 4.1+4.3: Zone Config | Hard cut | Hard cut |
| 13 | 00:02:02 | 00:02:10 | 8s | V1 | Session 6 Shot 6.1: 3D Tracking | Hard cut | Fade to black (0.5s) |

### Segment 5: Results (2:10-2:30)

| # | TC In | TC Out | Dur | V-Track | Source | Transition In | Transition Out |
|---|-------|--------|-----|---------|--------|---------------|----------------|
| 14L | 00:02:10 | 00:02:22 | 12s | V1 (left 50%) | Veo B7: Manual counting | Fade from black (0.5s) | Crossfade (0.3s) |
| 14R | 00:02:10 | 00:02:22 | 12s | V2 (right 50%) | Veo B8: Data-driven manager | Fade from black (0.5s) | Crossfade (0.3s) |
| — | 00:02:10 | 00:02:12 | 2s | V3 (left label) | "BEFORE" text overlay | Fade in | Fade out |
| — | 00:02:10 | 00:02:12 | 2s | V3 (right label) | "AFTER" text overlay | Fade in | Fade out |
| 15 | 00:02:22 | 00:02:28 | 6s | V1 | MG-5E: ROI counter "$3,500/mo" | Crossfade (0.3s) | Crossfade (0.3s) |
| 16 | 00:02:28 | 00:02:30 | 2s | V1 | MG-5F: End card with CTA | Crossfade (0.3s) | Fade to black (0.5s) |

**Audio tracks**:
| Track | Source | TC In | TC Out | Level |
|-------|--------|-------|--------|-------|
| A1 | Narration VO | 00:00:00 | 00:02:30 | -6 dB |
| A2 | music-04-tech-deep-dive-electronic.wav (5x loop) | 00:00:00 | 00:02:30 | -18 dB |

**Special Notes**:
- 0.5s fade-to-black between each segment (Architecture → Edge → Backend → Dashboard → Results)
- Dashboard Walkthrough uses hard cuts (fast, confident pacing)
- Before/After split screen (2:10-2:22): Same composite technique as Video 4
  - Left 50%: B7 with "BEFORE" label (white text, top-center of left half)
  - Right 50%: B8 with "AFTER" label (cyan text, top-center of right half)
  - 1px white vertical divider line
- The "BEFORE" side should be slightly desaturated, "AFTER" slightly boosted

---

## Export Settings for All Videos

### YouTube / Social Upload
- **Codec**: H.264
- **Container**: MP4
- **Resolution**: 1920x1080
- **Frame rate**: 24fps
- **Bitrate**: 10 Mbps (VBR, high quality)
- **Audio**: AAC, 256 kbps, stereo
- **Color space**: Rec. 709

### Archive / Master
- **Codec**: ProRes 422 or DNxHR HQ
- **Container**: MOV
- **Resolution**: 1920x1080
- **Frame rate**: 24fps
- **Audio**: PCM, 48kHz, 24-bit

### File Naming
```
JANUS-V1-Product-Demo-FINAL-1080p.mp4
JANUS-V2-The-Problem-FINAL-1080p.mp4
JANUS-V3-How-It-Works-FINAL-1080p.mp4
JANUS-V4-Privacy-First-FINAL-1080p.mp4
JANUS-V5-Tech-Deep-Dive-FINAL-1080p.mp4
```
