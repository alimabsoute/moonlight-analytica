# AI Studio Motion Graphics Specifications — Day 2

## Design System

All motion graphics follow the Janus brand:
- **Background**: #0a0a0f (near-black)
- **Primary text**: #ffffff (white)
- **Accent**: #22d3ee (cyan, Janus brand color)
- **Secondary accent**: #3b82f6 (blue)
- **Warning**: #f59e0b (amber)
- **Success**: #22c55e (green)
- **Font**: Inter (body), JetBrains Mono (technical/numbers)
- **All graphics**: 1920x1080, 24fps

---

## VIDEO 1: Product Demo — Motion Graphics

### MG-1A: Title Card (0:00-0:03)

**Type**: Animated title reveal
**Duration**: 3 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│                                                       │
│           ◆  JANUS                                   │
│              Platform Demo                            │
│                                                       │
│           ─── v2.0 ───                               │
│                                                       │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **"JANUS"**: White, 72px, Inter Bold, center-aligned
- **Diamond icon (◆)**: Cyan (#22d3ee), subtle glow pulse
- **"Platform Demo"**: Cyan, 36px, Inter Light
- **"v2.0"**: Gray (#6b7280), 18px, flanked by subtle horizontal lines
- **Animation**: Title fades in from 0% to 100% opacity over 0.5s, then the diamond pulses with a cyan glow. Entire card holds for 2s, then crossfades to dashboard footage.

### MG-1B: Lower Thirds (throughout)

**Type**: Feature label overlays
**Duration**: 2 seconds each, appears at each cut point

10 lower thirds needed:

| Timecode | Label Text | Subtext |
|----------|-----------|---------|
| 0:03 | LIVE MONITOR | Real-time occupancy |
| 0:10 | AI DETECTION | YOLO v11 + BoT-SORT |
| 0:17 | HEATMAP | Spatial intelligence |
| 0:22 | CONVERSION FUNNEL | Visitor → Customer |
| 0:28 | DWELL TIME | Visit duration analysis |
| 0:33 | ZONE PERFORMANCE | Area-by-area metrics |
| 0:38 | USE-CASE PRESETS | One-click optimization |
| 0:43 | 3D TRACKING | Isometric visualization |
| 0:50 | INSIGHTS | Automated recommendations |
| 0:53 | TRENDS | Historical patterns |

**Design per lower third**:
```
┌──────────────────────────────────┐
│  ▌ LIVE MONITOR                  │
│     Real-time occupancy          │
└──────────────────────────────────┘
```

- Position: Bottom-left, 80px from left edge, 100px from bottom
- Background: Semi-transparent black (#0a0a0f at 80% opacity), rounded 8px
- Cyan accent bar (▌): 4px wide, left edge
- **Label**: White, 20px, Inter SemiBold, ALL CAPS, letter-spacing 2px
- **Subtext**: Gray (#9ca3af), 14px, Inter Regular
- **Animation**: Slide in from left over 0.3s, hold 1.5s, fade out 0.2s

### MG-1C: End Card (0:57-1:00)

**Type**: Logo + tagline
**Duration**: 3 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│               ◆  JANUS                               │
│                                                       │
│     "Google Analytics for Physical Spaces"           │
│                                                       │
│            janus.moonlightanalytica.com               │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **"JANUS"**: White, 64px, Inter Bold
- **Tagline**: Cyan (#22d3ee), 24px, Inter Italic, in quotes
- **URL**: Gray (#6b7280), 16px, Inter Regular
- **Background**: #0a0a0f with subtle radial gradient (dark center to slightly lighter edges)
- **Animation**: Fade in over 0.5s, diamond pulses once, hold

---

## VIDEO 2: The Problem — Motion Graphics

### MG-2A: Stat Reveal — "68%" (0:14-0:18)

**Type**: Animated large statistic
**Duration**: 4 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│                    68%                                │
│                                                       │
│     of retail managers cannot accurately              │
│          measure foot traffic                         │
│                                                       │
│                    — RetailNext, 2024                 │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **"68%"**: White, 144px, Inter Black, center
- **Subtext**: Gray (#d1d5db), 24px, Inter Regular, two lines centered
- **Source**: Cyan (#22d3ee), 16px, Inter Italic, right-aligned with em-dash
- **Background**: #0a0a0f
- **Animation**: Number counts up from 0% to 68% over 1.5s (like a counter). Subtext fades in at 1.5s. Source fades in at 2.5s. Hold until 4s.

### MG-2B: Stat Reveal — "$4.5B" (0:18-0:22)

**Type**: Animated large statistic
**Duration**: 4 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│                  $4.5B                                │
│                                                       │
│       lost annually to staffing inefficiency          │
│              in US retail alone                       │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **"$4.5B"**: Amber (#f59e0b), 144px, Inter Black, center — amber for "loss/warning"
- **Subtext**: Gray (#d1d5db), 24px, Inter Regular
- **Background**: #0a0a0f
- **Animation**: Dollar sign appears first, then number counts from $0 to $4.5B over 1.5s. Subtext fades in. Hold.

### MG-2C: End Card (0:27-0:30)

Same as MG-1C but with added text:
- Below tagline: **"Stop guessing. Start knowing."** in white, 20px

---

## VIDEO 3: How It Works — Motion Graphics

### MG-3A: Step 1 Card (0:06-0:10)

**Type**: Step indicator
**Duration**: 4 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│         ① Point a Camera                             │
│                                                       │
│     Works with any camera you already have           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **Step number (①)**: Cyan circle with white "1", 48px
- **"Point a Camera"**: White, 48px, Inter SemiBold
- **Subtext**: Gray, 24px, Inter Regular
- **Background**: #0a0a0f
- **Animation**: Circle scales up from 0 to 100% over 0.3s, text slides in from right over 0.4s, hold

### MG-3B: Detection Overlay (0:18-0:20)

**Type**: Tech spec overlay on dashboard footage
**Duration**: 2 seconds

**Design**: Overlaid on top of the YOLO detection footage
```
┌─────────────────────────────────────────────────────┐
│ ┌───────────────────────────┐                         │
│ │  YOLOv11 AI Detection     │                         │
│ │  30+ FPS · 95% Accuracy   │                         │
│ └───────────────────────────┘                         │
│                                    [dashboard below]  │
└─────────────────────────────────────────────────────┘
```

- Position: Top-left corner
- Background: #0a0a0f at 85% opacity, rounded 8px
- **Line 1**: White, 20px, Inter SemiBold
- **Line 2**: Cyan, 16px, Inter Regular, middle-dot separator
- **Animation**: Slide down from top over 0.2s, hold 1.5s, slide back up

### MG-3C: Step 3 Card (0:28-0:30)

Same format as MG-3A but:
- **Step number**: ③
- **"Define Your Zones"**: White, 48px
- **Subtext**: "Entrance · Main Floor · Checkout · Queue"

### MG-3D: KPI Count Overlay (0:42-0:44)

**Type**: Stat banner over dashboard montage
**Duration**: 2 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│     50+ KPIs. Real-time. Every 2 seconds.            │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- Centered overlay on dashboard footage
- **Text**: White, 36px, Inter Bold
- **Periods create rhythm** — each phrase separated by period
- Background: Full-width black bar at 70% opacity
- **Animation**: Bar slides in from bottom, text types on character by character, hold

### MG-3E: Action Text Overlay (0:52-0:55)

**Type**: CTA text over B5 footage
**Duration**: 3 seconds

**Design**: Three lines appearing sequentially:
```
Staff smarter.
Redesign layouts.
Grow.
```

- Position: Bottom-right, over the B5 manager footage
- **Lines 1-2**: White, 28px, Inter Regular
- **"Grow."**: Cyan (#22d3ee), 36px, Inter Bold — emphasis word
- **Animation**: Each line fades in 0.5s apart (staggered), "Grow." scales up slightly

### MG-3F: End Card (0:55-1:00)

Same format as MG-1C with tagline: **"From Cameras to Clarity"**

---

## VIDEO 4: Privacy-First — Motion Graphics

### MG-4A: Anonymous ID Text (0:14-0:16)

**Type**: Statement overlay
**Duration**: 2 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│     Anonymous IDs that expire instantly               │
│                                                       │
│     a1b2c3d4 → ████████ → [deleted]                  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **Statement**: White, 32px, Inter SemiBold
- **ID animation**: Shows a UUID, then redacts it with blocks, then shows "[deleted]"
- **Animation**: UUID appears (0.3s), blocks sweep left-to-right over it (0.5s), "[deleted]" replaces in cyan (0.5s), hold

### MG-4B: No Video Stored (0:16-0:18)

**Type**: Statement with icon
**Duration**: 2 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│        ✕  No video stored. Ever.                     │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **Red X (✕)**: #ef4444, 48px, bold
- **Text**: White, 36px, Inter Bold
- **"Ever."**: Slightly larger, cyan underline
- **Animation**: Red X slams in (scale 200% → 100% with bounce), text slides in from right

### MG-4C: Compliance Badges (0:18-0:24)

**Type**: Badge grid
**Duration**: 6 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│     ✓ GDPR    ✓ CCPA    ✓ BIPA    ✓ EU AI Act      │
│     Aligned    Aligned   Compliant  Low-risk         │
│                                                       │
│         "Privacy by design, not by policy"           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **Checkmarks (✓)**: Green (#22c55e), 32px
- **Badge names**: White, 24px, Inter Bold, ALL CAPS
- **Status text**: Gray, 16px, Inter Regular
- **Quote**: Cyan, 20px, Inter Italic
- **Animation**: Each badge fades in left-to-right with 0.3s delay (staggered), quote fades in last
- **Layout**: 4 badges in a horizontal row, evenly spaced

### MG-4D: Architecture Statement (0:24-0:27)

**Type**: Bold statement
**Duration**: 3 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│     Privacy isn't our policy.                        │
│     It's our architecture.                           │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **Line 1**: Gray (#9ca3af), 36px, Inter Regular
- **Line 2**: White, 48px, Inter Bold — emphasis line
- **Animation**: Line 1 fades in, 0.5s pause, Line 2 types on character by character

### MG-4E: End Card (0:27-0:30)

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│               ◆  JANUS                               │
│                                                       │
│              Built Different.                        │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **"Built Different."**: Cyan, 28px, Inter Bold
- Same layout as other end cards

---

## VIDEO 5: Technical Deep Dive — Motion Graphics

### MG-5A: Architecture Diagram (0:00-0:25)

**Type**: Animated system diagram
**Duration**: 25 seconds (longest graphic)

**Design**: Three-tier architecture animating in stages:

```
Stage 1 (0:00-0:08): Full diagram fades in
┌──────────┐     ┌──────────┐     ┌──────────┐
│  CAMERA   │ ──→ │   EDGE   │ ──→ │ BACKEND  │ ──→ │DASHBOARD │
│  Any IP   │     │  AGENT   │     │ Analytics │     │ React 19 │
│  camera   │     │ YOLO v11 │     │  Engine   │     │ 50+ KPIs │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

Stage 2 (0:08-0:15): Camera box pulses, then arrow animates to Edge Agent
Stage 3 (0:15-0:20): Edge Agent box zooms in slightly, showing sub-components
Stage 4 (0:20-0:25): Full diagram visible, all arrows pulsing with data flow

- **Boxes**: Rounded rectangles, #1e293b fill, #22d3ee border (1px)
- **Box titles**: White, 20px, Inter Bold, ALL CAPS
- **Box subtitles**: Cyan, 14px, Inter Regular
- **Arrows**: Cyan, animated dashes flowing left-to-right
- **Background**: #0a0a0f with subtle grid pattern (like the 3D tracking view)

### MG-5B: Model Comparison Cards (0:35-0:45)

**Type**: Three-card comparison
**Duration**: 10 seconds

**Design**:
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   YOLO 11n    │  │   YOLO 11s    │  │   YOLO 11m    │
│   ─────────   │  │   ─────────   │  │   ─────────   │
│   6 MB        │  │   22 MB       │  │   49 MB       │
│   25-45 FPS   │  │   15-25 FPS   │  │   8-12 FPS    │
│   ★★★☆☆       │  │   ★★★★☆       │  │   ★★★★★       │
│   Real-time   │  │   Balanced    │  │   Max Accuracy │
└──────────────┘  └──────────────┘  └──────────────┘
```

- Cards appear one-by-one from left to right (0.5s stagger)
- **Model name**: White, 24px, Inter Bold
- **Stats**: Gray, 16px, Inter Regular
- **Stars**: Amber (#f59e0b) for filled, gray for empty
- **Category label**: Cyan, 14px, Inter SemiBold

### MG-5C: Tracker Comparison (0:45-0:55)

**Type**: Side-by-side comparison
**Duration**: 10 seconds

**Design**:
```
┌─────────────────────┐    ┌─────────────────────┐
│     ByteTrack        │    │      BoT-SORT        │
│     ──────────       │    │      ────────         │
│  ⚡ Speed Priority    │    │  🎯 Accuracy Priority │
│                      │    │                       │
│  171 FPS throughput  │    │  Appearance matching  │
│  Kalman filter only  │    │  Camera compensation  │
│  Low compute cost    │    │  Fewer ID switches    │
│                      │    │                       │
│  Best: Static cams,  │    │  Best: Crowded areas, │
│  moderate crowds     │    │  heavy traffic        │
└─────────────────────┘    └─────────────────────┘
```

- Two cards slide in from opposite sides
- **Lightning bolt / Target**: Accent icons
- **Stats**: White text with cyan highlights for key values

### MG-5D: What IS vs NOT Stored (1:20-1:30)

**Type**: Two-column comparison
**Duration**: 10 seconds

**Design**:
```
┌─────────────────────┬─────────────────────┐
│   ✓ WHAT IS STORED   │   ✕ WHAT IS NOT      │
│   ────────────────   │   ──────────────      │
│   ✓ Timestamps       │   ✕ Video frames      │
│   ✓ Anonymous IDs    │   ✕ Photos/images     │
│   ✓ Zone transitions │   ✕ Faces             │
│   ✓ Dwell times      │   ✕ Biometric data    │
│   ✓ Confidence scores│   ✕ Personal info     │
│   ✓ Event types      │   ✕ Audio             │
└─────────────────────┴─────────────────────┘
```

- Left column: Green checkmarks (#22c55e), white text
- Right column: Red X marks (#ef4444), white text
- Divider: Vertical cyan line
- Items appear one-by-one (0.3s stagger, alternating columns)

### MG-5E: ROI Counter (2:22-2:28)

**Type**: Animated revenue counter
**Duration**: 6 seconds

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│     Additional Monthly Revenue                       │
│                                                       │
│           $3,500/mo                                  │
│                                                       │
│     from just 2% conversion improvement              │
│     (500 daily visitors × $35 AOV)                   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **Header**: Gray, 20px, Inter Regular, ALL CAPS
- **"$3,500/mo"**: Green (#22c55e), 96px, Inter Black
- **Subtext**: Gray, 18px, Inter Regular
- **Animation**: Dollar amount counts up from $0 to $3,500 over 2s, subtext fades in after

### MG-5F: End Card with CTA (2:25-2:30)

**Design**:
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│               ◆  JANUS                               │
│                                                       │
│     "Google Analytics for Physical Spaces"           │
│                                                       │
│        [ Request Beta Access ]                       │
│                                                       │
│          janus.moonlightanalytica.com                │
│                                                       │
└─────────────────────────────────────────────────────┘
```

- **CTA Button**: Cyan border, transparent fill, "Request Beta Access" in white
- Button has subtle glow animation (pulsing cyan border)

---

## Production Notes

### Creating in AI Studio
1. Use Google AI Studio's image/video generation for each graphic
2. Provide the design spec + color hex codes as the prompt
3. For animated graphics, generate as video clips (not static images)
4. If AI Studio can't generate animations, create static frames and add motion in editing

### Alternative: Manual Creation
If AI Studio motion graphics aren't sufficient quality:
- Use **Canva Pro** (free trial) for title cards and lower thirds
- Use **DaVinci Resolve** (free) for animated text and counters
- Use **Figma** for design mockups, then animate with CSS/JS and screen record

### File Organization
```
video-production/
  graphics/
    v1-demo/
      mg-1a-title-card.mp4
      mg-1b-lower-thirds/  (10 individual files)
      mg-1c-end-card.mp4
    v2-problem/
      mg-2a-68-percent.mp4
      mg-2b-4-5-billion.mp4
      mg-2c-end-card.mp4
    v3-how-it-works/
      mg-3a-step1.mp4
      mg-3b-detection-overlay.mp4
      mg-3c-step3.mp4
      mg-3d-kpi-count.mp4
      mg-3e-action-text.mp4
      mg-3f-end-card.mp4
    v4-privacy/
      mg-4a-anonymous-id.mp4
      mg-4b-no-video.mp4
      mg-4c-compliance-badges.mp4
      mg-4d-architecture-statement.mp4
      mg-4e-end-card.mp4
    v5-tech-deep-dive/
      mg-5a-architecture-diagram.mp4
      mg-5b-model-comparison.mp4
      mg-5c-tracker-comparison.mp4
      mg-5d-stored-vs-not.mp4
      mg-5e-roi-counter.mp4
      mg-5f-end-card.mp4
```
