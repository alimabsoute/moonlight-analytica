# JANUS — Complete Product Overview

> **Use this document as the single source of truth for all marketing materials, promo videos, pitch decks, sales collateral, and technical explainers.**

---

## TABLE OF CONTENTS

1. [The Elevator Pitch](#1-the-elevator-pitch)
2. [The Problem](#2-the-problem)
3. [The Solution](#3-the-solution)
4. [How It Works — Plain English](#4-how-it-works--plain-english)
5. [How It Works — Technical Deep Dive](#5-how-it-works--technical-deep-dive)
6. [Feature Breakdown](#6-feature-breakdown)
7. [Use Cases & Verticals](#7-use-cases--verticals)
8. [Business Case & ROI](#8-business-case--roi)
9. [Competitive Landscape](#9-competitive-landscape)
10. [Privacy & Compliance](#10-privacy--compliance)
11. [Pricing Strategy Framework](#11-pricing-strategy-framework)
12. [Promo Video Script Outlines](#12-promo-video-script-outlines)
13. [Key Messaging & Taglines](#13-key-messaging--taglines)
14. [Technical Specifications](#14-technical-specifications)
15. [Glossary](#15-glossary)

---

## 1. THE ELEVATOR PITCH

**One-liner:**
Janus turns any camera into an intelligent people analytics engine — tracking who enters, where they go, how long they stay, and whether they convert — all without facial recognition.

**30-second pitch:**
Every physical business makes decisions based on gut feeling. How many people walked in today? Where did they spend time? Why did they leave without buying? Janus answers these questions in real time. We use AI-powered computer vision to track foot traffic, map visitor journeys, and surface actionable insights — all from the cameras you already have. No facial recognition. No personal data. Just the operational intelligence you need to optimize your space, staff smarter, and grow revenue.

**60-second pitch:**
Imagine having Google Analytics for your physical space. Janus is an AI-powered people analytics platform that transforms any standard camera feed into a rich stream of business intelligence. Our edge agent uses state-of-the-art YOLO detection models and multi-object tracking to monitor foot traffic in real time — counting entries and exits, mapping visitor journeys across zones, calculating dwell times, conversion rates, and queue lengths. The dashboard surfaces 50+ KPIs through live monitoring, interactive heatmaps, zone analytics, and trend reports. We support everything from a single webcam to multi-camera RTSP deployments. The best part? We never use facial recognition. Every person is tracked as an anonymous silhouette with a temporary session ID. When they leave, the ID expires. Privacy-first by design, not by afterthought. Whether you run a retail store, restaurant, event venue, or office — Janus gives you the data to make better decisions about your physical space.

---

## 2. THE PROBLEM

### The Physical-Digital Divide

Online businesses know everything about their visitors. Click paths, session duration, conversion funnels, bounce rates, heatmaps — it's all tracked automatically. Physical businesses? They're flying blind.

### Pain Points by Role

| Role | Pain Point |
|------|-----------|
| **Store Manager** | "I have no idea how many people actually walked in today vs. how many bought something." |
| **Operations Director** | "We staff based on last year's schedule, not what's actually happening on the floor." |
| **Real Estate/Leasing** | "We can't prove foot traffic to potential tenants or justify rent prices." |
| **Event Organizer** | "Fire code says 200 max occupancy but I'm counting heads manually." |
| **Restaurant Owner** | "I don't know if people are leaving because of long wait times or because tables look full." |
| **Retail Chain VP** | "I can compare online conversion rates across 200 stores but I can't compare physical conversion rates across 5 locations." |
| **Security Team** | "We have 50 cameras but we're only watching 4 monitors. We see incidents after they happen." |

### The Numbers

- **68%** of retail managers say they cannot accurately measure foot traffic (RetailNext, 2024)
- **$4.5B** is lost annually to overstaffing and understaffing in US retail alone
- Physical conversion rates average **20-40%** but most stores don't even measure them
- **91%** of purchases still happen in physical stores (US Census Bureau)
- Traditional people counters (beam/thermal) cost **$2,000-5,000+ per door** and only count — no analytics

---

## 3. THE SOLUTION

### What Janus Is

Janus is a **full-stack real-time people analytics platform** that consists of three components:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [CAMERA]  →  [EDGE AGENT]  →  [BACKEND]  →  [DASHBOARD]   │
│   Any IP       AI Detection     Analytics     Actionable     │
│   camera       & Tracking       Engine        Insights       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

1. **Edge Agent** — Lightweight AI software that runs on any computer near your camera. Detects and tracks people using computer vision. No cloud upload of video required.
2. **Backend** — Analytics engine that processes tracking events, builds visitor sessions, and computes KPIs. Stores only metadata — never images or video.
3. **Dashboard** — Beautiful, real-time web dashboard with live monitoring, analytics, heatmaps, zone management, and reports.

### What Janus Is NOT

- **Not a security/surveillance system** — We don't identify people
- **Not a facial recognition tool** — We track silhouettes, not faces
- **Not a cloud-dependent SaaS** — Runs entirely on-premise if needed
- **Not a simple door counter** — We track full visitor journeys

---

## 4. HOW IT WORKS — PLAIN ENGLISH

### Step 1: Point a Camera

Any camera works — a $30 USB webcam, an existing IP security camera, even a YouTube live stream. Janus doesn't need special hardware.

### Step 2: The AI Watches

Our edge agent runs an AI model (YOLOv11) that's been trained to detect people in video. Every frame, it finds every person and draws an invisible bounding box around them. Then a tracking algorithm (ByteTrack or BoT-SORT) assigns each person a unique anonymous ID, so even as people move around, the system knows "Person #47 just walked from the entrance to the checkout area."

### Step 3: Zones Tell the Story

You define zones on the camera view — entrance, main floor, checkout, waiting area — whatever makes sense for your space. As people move between zones, Janus records the journey: "Person #47 entered at 2:15 PM, spent 8 minutes on the main floor, 3 minutes at checkout, and exited at 2:26 PM."

### Step 4: Data Becomes Insight

The dashboard processes thousands of these journeys and surfaces the patterns:
- **"Tuesdays at 2 PM are your busiest hour"** — staff accordingly
- **"35% of visitors never leave the entrance zone"** — your layout needs work
- **"Average dwell time dropped 20% this week"** — investigate what changed
- **"Queue wait times spike past 4 minutes at 3 PM"** — add a register

### Step 5: Better Decisions

With real data, you stop guessing. You optimize staffing, improve store layout, reduce wait times, measure the impact of promotions, and prove ROI on physical space investments.

---

## 5. HOW IT WORKS — TECHNICAL DEEP DIVE

### Architecture Overview

```
VIDEO SOURCE                  EDGE AGENT                    BACKEND                     FRONTEND
─────────────                 ──────────                    ───────                     ────────
                              ┌──────────────┐
Webcam ──────────┐            │ Frame Grab   │
RTSP Camera ─────┤            │      │       │
YouTube Live ────┤───────────→│ YOLO v11     │
MP4 File ────────┘            │ (Detection)  │
                              │      │       │              ┌──────────────┐
                              │ ByteTrack /  │   REST API   │ Flask Server │           ┌──────────────┐
                              │ BoT-SORT     │──────────────│              │           │ React 19     │
                              │ (Tracking)   │   /events    │ SQLite DB    │  REST API │ Recharts     │
                              │      │       │   /sessions  │ (events,     │───────────│ Tailwind CSS │
                              │ Zone Check   │              │  sessions,   │  /api/*   │ Canvas/WebGL │
                              │      │       │              │  zones)      │           │              │
                              │ MJPEG Stream │              │              │           │ Live Monitor │
                              │ (:8001)      │              │ KPI Engine   │           │ Analytics    │
                              └──────────────┘              │ Time Series  │           │ Heatmap      │
                                                            │ Aggregation  │           │ Reports      │
                                                            └──────────────┘           │ Zone Config  │
                                                                                       │ Settings     │
                                                                                       └──────────────┘
```

### Detection Layer — YOLO (You Only Look Once)

Janus uses Ultralytics YOLOv11, a state-of-the-art real-time object detection model. Key details:

- **Model variants available:**
  - `yolo11n.pt` (Nano) — 6 MB, 25-30 FPS on GPU. Best for real-time on commodity hardware.
  - `yolo11s.pt` (Small) — 22 MB, 15-20 FPS on GPU. Better accuracy for crowded scenes.
  - `yolo11m.pt` (Medium) — 49 MB, 8-12 FPS on GPU. Maximum accuracy for complex environments.
- **Detection target:** Class 0 (person) only. We filter out all other COCO classes.
- **Confidence threshold:** Configurable per use case (default 0.35, range 0.10-0.80).
- **What it outputs:** For every frame, a list of bounding boxes with (x, y, width, height, confidence) for each detected person.
- **Key advancement over v8:** 22% fewer parameters with equal or better accuracy. Improved small-object detection and occlusion handling.

### Tracking Layer — Multi-Object Tracking (MOT)

Detection alone tells you "there are 5 people in this frame." Tracking tells you "Person A is the same person as Person A in the previous frame — and they moved 3 pixels to the right."

**ByteTrack (Default — Speed Priority)**
- Associates detections across frames using motion prediction (Kalman filter)
- Two-stage matching: high-confidence detections first, then low-confidence
- 171 FPS throughput — effectively free on top of detection
- MOTA score: 77.3% on MOT17 benchmark
- Best for: static cameras, moderate crowds, real-time requirements

**BoT-SORT (Recommended — Accuracy Priority)**
- Combines motion prediction with appearance features (what the person looks like)
- Camera motion compensation — works with moving/shaking cameras
- Box prediction refinement for better bounding box stability
- Significantly fewer ID switches than ByteTrack
- Best for: crowded environments, entrances with heavy traffic, when tracking continuity matters

**Runtime Switching:** The system supports switching models and trackers at runtime via API call — no restart required. This allows operators to trade speed for accuracy on the fly.

### Zone Analytics Engine

Zones are defined as rectangular regions on the camera's field of view. Each zone has:
- **Name** (e.g., "Entrance", "Checkout")
- **Type** (entrance, checkout, general, queue)
- **Capacity** (maximum safe occupancy)
- **Coordinates** (x, y, width, height on a 640x480 baseline, auto-scaled to actual resolution)

**Zone event logic:**
```
For each tracked person, each frame:
  1. Calculate bounding box center point
  2. Check which zone (if any) contains that point
  3. If zone changed from previous frame → fire "zone_change" event
  4. If person appeared in entrance zone → fire "entry" event
  5. If person left all zones → fire "exit" event, close session
```

### Session Management

A **session** represents one person's complete visit:

```json
{
  "person_id": "a1b2c3d4",
  "entry_time": "2025-02-21T14:15:00",
  "exit_time": "2025-02-21T14:26:30",
  "dwell_seconds": 690,
  "zone_path": ["entrance", "main_floor", "main_floor", "checkout", "entrance"],
  "converted": true
}
```

- `person_id`: Anonymous UUID, never linked to identity. Expires when person exits.
- `dwell_seconds`: Total time from entry to exit.
- `zone_path`: Ordered sequence of zones visited (the "customer journey").
- `converted`: Whether the person visited a "conversion zone" (e.g., checkout, register).

### Analytics & KPI Engine

The backend computes 50+ KPIs from raw events and sessions:

**Real-Time (updated every 2 seconds):**
- Current occupancy (total and per-zone)
- Active person count
- Live entry/exit rate

**Windowed (configurable: 1h, 6h, 24h, 7d, 30d):**
- Average occupancy
- Peak occupancy (and time of peak)
- Total throughput (entries + exits)
- Average dwell time
- Dwell time distribution (buckets: <1m, 1-5m, 5-15m, 15-30m, 30m+)
- Conversion rate (sessions with conversion / total sessions)
- Bounce rate (sessions with dwell < 60 seconds / total sessions)
- Engagement rate (sessions with dwell > 5 minutes / total sessions)
- Queue length and average wait time
- Zone utilization (% of capacity used)
- Entries vs. exits over time (detect accumulation or exodus)
- Busiest hours ranking

### Data Storage

- **Database:** SQLite (single file, zero configuration)
- **Tables:** `events`, `sessions`, `zones`, `counts`
- **What IS stored:** Timestamps, anonymous IDs, zone transitions, dwell times, confidence scores
- **What is NOT stored:** Video frames, images, faces, biometric data, personally identifiable information

### Frontend Visualization Stack

- **React 19** — Latest React with concurrent features
- **Recharts** — Time series, bar, pie, radar, and area charts
- **HTML5 Canvas** — Heatmaps, 3D isometric views, tracking animations
- **Framer Motion** — Smooth transitions and micro-animations
- **Radix UI** — Accessible, composable UI primitives
- **Tailwind CSS** — Utility-first styling with two theme variants

---

## 6. FEATURE BREAKDOWN

### Live Monitor
Real-time operational view. See what's happening right now.
- **Hero KPI cards:** Current count, total entries, total exits, peak, average dwell
- **Live video feed** with detection overlays (bounding boxes, zone boundaries, track IDs)
- **Time range selector:** 1h / 6h / 24h / 7d / 30d
- **Model switcher:** Change AI model and tracker on the fly
- **Video source controls:** Switch between cameras, YouTube streams, uploaded files
- **Auto-refresh:** Configurable polling (default 2 seconds)
- **CSV export:** Download raw time-series data

### Analytics Dashboard
Deep-dive into visitor behavior patterns.
- **12+ KPI cards** with trend arrows (up/down vs. previous period)
- **Traffic trend line chart** — Visualize foot traffic over time
- **Zone performance radar chart** — Compare activity across zones
- **Dwell time pie chart** — Distribution of visit lengths (5 buckets)
- **Conversion funnel** — Entry → Engagement → Conversion pipeline
- **Entry/exit comparison** — Spot accumulation or exodus patterns
- **Queue analytics** — Length, wait time, service rate
- **Period comparison** — Compare any two time ranges side by side

### Heatmap View
Spatial intelligence at a glance.
- **Canvas-rendered intensity map** — Blue (low) → Yellow (medium) → Red (high)
- **Zone-by-zone traffic breakdown**
- **Click any zone** to see detailed stats
- **Time range filtering** — See how hot zones shift throughout the day

### Reports
Structured insights for stakeholders.
- **Daily summary:** Total events, average count, peak count, throughput
- **Weekly table:** 7-day breakdown with day-by-day comparison
- **Top 5 busiest hours** — Ranked by traffic volume
- **Date range picker** with quick-select presets

### Zone Configuration
Visual, drag-and-drop zone management.
- **Draw zones** directly on the camera view
- **Resize handles** for precise boundary adjustment
- **Set capacity** per zone for occupancy compliance
- **Color customization** for visual clarity
- **Lock/unlock, show/hide, duplicate** zones
- **Save to backend** — Zones persist and apply to all analytics

### Settings & Configuration
Operational control panel.
- **Theme toggle** — Dark (cyber) and light modes
- **Auto-refresh intervals** — Configure polling frequency
- **Use-case presets** — One-click optimized configs:
  - Retail/Foot Traffic
  - Restaurant/Hospitality
  - Queue Analysis
  - Office/Coworking
  - Venue/Events
- **Custom configuration** — Fine-tune model, tracker, and confidence
- **Backend health check** — Verify system status

### 3D Tracking Visualization
Stunning demo-mode visualization.
- **Isometric 3D floor plan** with animated stick figures
- **5 dynamic zones** with real-time occupancy counts
- **People spawn, walk, idle, and exit** with natural movement
- **Play/Pause/Speed controls** for presentations
- **Toggle trails, labels, bounding boxes** for different audiences

---

## 7. USE CASES & VERTICALS

### Retail Stores

**The challenge:** You don't know your physical conversion rate. You know revenue, but not how many people walked in and left without buying.

**What Janus does:**
- Counts every entry and exit accurately
- Calculates conversion rate (visitors who reach checkout / total visitors)
- Measures dwell time (longer dwell = higher purchase probability)
- Identifies dead zones (areas visitors avoid)
- Tracks the impact of window displays, promotions, and layout changes

**Sample insight:** *"Saturday 2-4 PM sees 340 entries but only 12% conversion. Tuesday 10 AM-12 PM sees 120 entries but 38% conversion. Your Saturday crowd is browsing; your Tuesday crowd is buying. Staff and promote accordingly."*

**ROI example:** A store with 500 daily visitors and 25% conversion rate that improves conversion by just 2 percentage points (to 27%) and a $35 average transaction value generates an additional **$3,500/month** in revenue.

---

### Restaurants & Hospitality

**The challenge:** You don't know if people are leaving because of wait times, perceived fullness, or something else.

**What Janus does:**
- Monitors queue length in real time
- Calculates average wait time
- Tracks table turnover through zone analytics
- Identifies peak congestion periods
- Measures lobby vs. dining area flow

**Sample insight:** *"When queue length exceeds 6 people, 40% of new arrivals leave within 90 seconds. Assign a host to manage expectations when queue reaches 5."*

---

### Events & Venues

**The challenge:** Fire code compliance, crowd management, and post-event analytics.

**What Janus does:**
- Real-time occupancy counting per zone (with capacity alerts)
- Entry/exit rates for crowd flow management
- Zone-based density monitoring
- Dwell time per exhibit/stage/area
- Post-event reports: peak attendance, popular areas, flow patterns

**Sample insight:** *"Main stage peaked at 1,847 at 8:15 PM (92% capacity). North food court hit capacity at 7:30 PM, causing overflow to South food court which was only at 40%. Add signage directing to South next event."*

---

### Offices & Coworking Spaces

**The challenge:** Post-COVID, real estate is expensive and space utilization is unknown.

**What Janus does:**
- Measures actual desk/room/zone utilization
- Tracks peak vs. off-peak occupancy
- Identifies underused areas for consolidation
- Provides data for hybrid work policy decisions

**Sample insight:** *"Floor 3 averages 23% utilization on Fridays. Consolidate Friday workers to Floors 1-2 and sublease Floor 3 on Fridays — saving $4,200/month."*

---

### Malls & Multi-Tenant Properties

**The challenge:** Proving foot traffic to tenants and optimizing common area layouts.

**What Janus does:**
- Per-entrance and per-zone traffic counts
- Tenant-specific foot traffic reporting
- Common area flow analysis
- Impact measurement for events and promotions

**Sample insight:** *"Anchor store A drives 62% of mall traffic past Tenant B's entrance. Tenant B's lease renewal should reflect this value — justify $4/sqft premium."*

---

### Smart Cities & Public Spaces

**The challenge:** Pedestrian flow optimization, public safety, and urban planning.

**What Janus does:**
- Crosswalk and sidewalk traffic counting
- Public space utilization measurement
- Crowd density monitoring for safety
- Transit hub flow optimization

---

## 8. BUSINESS CASE & ROI

### Cost Comparison

| Solution | Hardware Cost | Monthly Cost | Analytics Depth | Privacy |
|----------|-------------|-------------|-----------------|---------|
| **Manual counting** | $0 | Staff time (~$2,000/mo) | Minimal | N/A |
| **Beam counters** | $2,000-5,000/door | $0-50/mo | Count only | Good |
| **Thermal sensors** | $1,500-3,000/unit | $50-200/mo | Count + direction | Good |
| **Legacy CV systems** | $10,000+ | $500-2,000/mo | Moderate | Varies |
| **Janus** | $0 (use existing cameras) | Software license | Full journey analytics | Excellent |

### ROI Scenarios

**Scenario 1: Single Retail Store**
- Monthly license: $X
- Camera: Existing security camera ($0 incremental)
- Compute: $200 mini PC (one-time)
- Value: 2% conversion improvement = $3,500/month additional revenue
- **Payback: < 1 month**

**Scenario 2: Restaurant Chain (10 locations)**
- Monthly license: $X per location
- Value: Reduce walkaway rate by 15% through queue management = ~$8,000/month per location
- **Payback: < 2 weeks per location**

**Scenario 3: Corporate Office**
- Monthly license: $X
- Value: Identify 30% underutilized space, sublease 1 floor = $15,000/month savings
- **Payback: < 1 month**

### The Data Moat

Every day Janus runs, it builds a richer dataset. After 30 days, you can compare week-over-week trends. After 90 days, you have seasonal patterns. After a year, you have a complete behavioral model of your space. This data compounds in value — making the platform stickier over time.

---

## 9. COMPETITIVE LANDSCAPE

### Direct Competitors

| Competitor | Approach | Pricing | Weakness vs. Janus |
|-----------|---------|---------|-------------------|
| **RetailNext** | Proprietary sensors + cloud | $$$$ | Expensive hardware, cloud-dependent |
| **ShopperTrak** | Beam/thermal counting | $$$ | Count only, no journey analytics |
| **Density** | Depth sensors | $$$ | Proprietary hardware lock-in |
| **V-Count** | Thermal + 3D stereo | $$ | Limited analytics, basic dashboards |
| **Xovis** | 3D stereo cameras | $$$$ | Enterprise-only pricing |

### Janus Differentiation

1. **No proprietary hardware** — Works with any camera you already own
2. **Full journey tracking** — Not just counting, but behavioral analytics
3. **Privacy-first architecture** — No facial recognition, no cloud video upload
4. **On-premise option** — Data never leaves your building
5. **AI model flexibility** — Switch between speed and accuracy at runtime
6. **Use-case presets** — Optimized out-of-the-box for different verticals
7. **Modern UX** — Beautiful dashboard that stakeholders actually want to use
8. **Open architecture** — REST APIs for integration with existing systems

---

## 10. PRIVACY & COMPLIANCE

### Privacy-by-Design Principles

Janus was built from the ground up with privacy as a core architectural constraint, not an afterthought:

1. **No Facial Recognition** — The AI detects human silhouettes only. It cannot and does not identify individuals by face, gait, or other biometric markers.

2. **Anonymous Tracking** — Each detected person receives a random UUID that exists only for the duration of their visit. There is no cross-session linking. When the person exits, the ID is discarded permanently.

3. **No Image Storage** — Video frames are processed in real-time in memory and immediately discarded. The edge agent stores only metadata (timestamps, zone transitions, dwell times). No frames, screenshots, or video clips are ever saved to disk.

4. **Edge Processing** — Video is processed on the local edge device. Raw video never leaves the premises. No cloud upload required.

5. **Metadata Only** — The backend database contains only: timestamps, anonymous person IDs, zone names, event types, and confidence scores. It is impossible to reconstruct a person's appearance from this data.

6. **Data Minimization** — We collect only what's needed for analytics. No demographic inference, no emotion detection, no behavior profiling beyond zone transitions.

### Compliance Alignment

| Regulation | Status | Notes |
|-----------|--------|-------|
| **GDPR** | Aligned | No personal data processing. Anonymous aggregate analytics. |
| **CCPA** | Aligned | No personal information collected or sold. |
| **BIPA** (Illinois) | Compliant | No biometric identifiers collected. |
| **EU AI Act** | Low-risk | No biometric identification or categorization. |
| **HIPAA** | Not applicable | No health data involved. |

### Privacy Messaging for Marketing

> *"Janus sees crowds, not faces. We count visitors, not identities. Your customers' privacy isn't a trade-off — it's our architecture."*

---

## 11. PRICING STRATEGY FRAMEWORK

### Suggested Tier Structure

| Tier | Target | Features | Suggested Price Range |
|------|--------|----------|----------------------|
| **Starter** | Small retail, single location | 1 camera, Live Monitor, basic KPIs, 7-day history | $49-99/mo |
| **Professional** | Multi-area businesses | Up to 4 cameras, full analytics, heatmaps, 30-day history, CSV export | $149-299/mo |
| **Enterprise** | Chains, malls, venues | Unlimited cameras, API access, custom zones, 1-year history, white-label dashboard | Custom pricing |
| **On-Premise** | High-security environments | Full self-hosted deployment, no external connectivity | One-time license + support |

### Upsell Opportunities

- Additional camera licenses
- Extended data retention (1 year, 5 years)
- API access for custom integrations
- White-label dashboard for property managers
- Custom KPI development
- Professional installation and zone optimization
- Training and onboarding packages

---

## 12. PROMO VIDEO SCRIPT OUTLINES

### Video 1: "The Problem" (30 seconds)

```
[Scene: Store owner staring at an empty register, then at a crowded store floor]
NARRATOR: "You know how many sales you made today. But do you know how
many people walked in... and walked right back out?"

[Scene: Person entering store, looking around, leaving]
NARRATOR: "68% of retail managers can't accurately measure foot traffic.
You're making million-dollar decisions based on guesswork."

[Scene: Janus dashboard fading in]
NARRATOR: "Janus changes that."

[End card: Janus logo + tagline]
```

### Video 2: "How It Works" (60 seconds)

```
[Scene: Camera mounted above a doorway]
NARRATOR: "Step one — point a camera."
TEXT ON SCREEN: "Works with any camera you already have."

[Scene: Edge agent UI showing bounding boxes around people]
NARRATOR: "Step two — Janus watches. Our AI detects and tracks every
person — assigning an anonymous ID, never a face."
TEXT ON SCREEN: "YOLOv11 AI Detection — 30+ FPS"

[Scene: Floor plan with colored zones]
NARRATOR: "Step three — define your zones. Entrance. Main floor.
Checkout. Queue. Whatever matters to your business."

[Scene: Dashboard with live KPIs ticking up]
NARRATOR: "Step four — see the story. Dwell times. Conversion rates.
Queue lengths. Traffic trends. All updating in real time."

[Scene: Manager making decisions with data on screen]
NARRATOR: "Step five — act on it. Staff smarter. Redesign layouts.
Reduce wait times. Grow revenue."

[End card: "Google Analytics for Physical Spaces" + Janus logo]
```

### Video 3: "Privacy-First" (30 seconds)

```
[Scene: Split screen — left shows a surveillance camera (menacing),
right shows Janus dashboard (friendly)]
NARRATOR: "Most people counting solutions make you choose:
data or privacy."

[Scene: Janus bounding boxes — blurred silhouettes, no faces]
NARRATOR: "Janus sees crowds, not faces. Anonymous IDs that expire
the moment someone leaves. No video stored. Ever."

[Scene: GDPR, CCPA badges appearing]
NARRATOR: "Privacy isn't our policy. It's our architecture."

[End card: Janus logo + "Built Different"]
```

### Video 4: "Technical Deep Dive" (2-3 minutes)

```
[Scene: Architecture diagram animating in]
NARRATOR: "Under the hood, Janus runs a three-tier architecture..."

[Segment 1: Edge Agent]
- Show YOLO model detecting people in video
- Explain ByteTrack vs. BoT-SORT tracking
- Show zone boundary overlay
- Emphasize: processed locally, no cloud upload

[Segment 2: Backend]
- Show event stream flowing into database
- Session construction from events
- KPI calculation engine
- Emphasize: metadata only, no images stored

[Segment 3: Dashboard]
- Walk through each tab (Live Monitor, Analytics, Heatmap, Reports, Zones)
- Show model/tracker switching at runtime
- Show use-case presets

[Segment 4: Results]
- Show before/after: guessing vs. data-driven decisions
- Real ROI numbers

[End card: CTA + Janus logo]
```

### Video 5: "60-Second Product Demo" (Screen recording style)

```
[Screen recording of dashboard]
0:00 — Open Live Monitor, show real-time count updating
0:10 — Switch to video feed, show bounding boxes on people
0:15 — Click through zones on heatmap
0:25 — Open Analytics, show conversion funnel
0:35 — Show dwell time distribution chart
0:40 — Open Reports, show weekly summary
0:45 — Open Settings, switch use-case preset
0:50 — Show 3D tracking visualization
0:55 — End card with CTA

NARRATOR (voice-over): Fast-paced feature highlights matching screen action.
```

---

## 13. KEY MESSAGING & TAGLINES

### Primary Tagline
**"Google Analytics for Physical Spaces"**

### Alternative Taglines
- "See Your Space. Know Your Crowd."
- "Every Visitor Tells a Story. Janus Reads It."
- "Count What Counts."
- "From Cameras to Clarity."
- "AI-Powered Foot Traffic Intelligence."
- "Privacy-First People Analytics."
- "Turn Foot Traffic Into Revenue."
- "Your Space, Decoded."
- "The Physical Store's Missing Dashboard."

### Key Messages by Audience

**For C-Suite / Decision Makers:**
> "Janus gives you the same depth of visitor analytics for your physical locations that you already have for your website — conversion rates, visitor journeys, engagement metrics — without the privacy risk."

**For Operations / Store Managers:**
> "Know exactly how many people walked in, where they went, how long they stayed, and whether they converted — updated every 2 seconds on a dashboard you'll actually enjoy using."

**For IT / Technical Buyers:**
> "YOLO v11 detection with ByteTrack/BoT-SORT tracking, processing at the edge with no cloud video upload. REST API, SQLite storage, React dashboard. Deploys on commodity hardware in under an hour."

**For Privacy / Legal / Compliance:**
> "No facial recognition. No biometric data. No image storage. Anonymous session IDs that expire on exit. Edge-processed video never leaves your premises. GDPR and CCPA aligned by architecture, not by policy."

### Feature Headlines (for marketing pages)

| Feature | Headline | Subtext |
|---------|----------|---------|
| Live Monitoring | **Real-Time, Not Real-Late** | See your space as it is, not as it was an hour ago. |
| Analytics | **50+ KPIs, Zero Guesswork** | Conversion rates, dwell times, queue lengths — all automated. |
| Heatmaps | **Where the Crowd Goes** | Visualize traffic intensity across every zone. |
| Zone Config | **Your Space, Your Rules** | Draw zones, set capacity, get alerts. Drag and drop. |
| Privacy | **Sees Crowds, Not Faces** | Anonymous tracking. No images stored. No exceptions. |
| Edge Processing | **Your Video Stays Home** | All AI runs locally. Nothing uploaded to the cloud. |
| Model Switching | **Speed or Accuracy — Your Call** | Switch AI models at runtime. No restart needed. |
| Use-Case Presets | **Optimized in One Click** | Pre-tuned for retail, restaurants, venues, and more. |

---

## 14. TECHNICAL SPECIFICATIONS

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Edge Agent CPU** | Intel i5 / AMD Ryzen 5 | Intel i7 / AMD Ryzen 7 |
| **Edge Agent GPU** | None (CPU mode) | NVIDIA GTX 1060+ (CUDA) |
| **Edge Agent RAM** | 4 GB | 8 GB |
| **Edge Agent Storage** | 500 MB (models) | 2 GB |
| **Backend** | Any machine with Python 3.8+ | Same as edge or separate |
| **Frontend** | Modern web browser | Chrome, Firefox, Edge, Safari |
| **Camera** | 640x480 @ 15 FPS | 1080p @ 30 FPS |
| **Network** | 100 Mbps LAN | 1 Gbps LAN |

### Performance Benchmarks

| Configuration | FPS (CPU) | FPS (GPU) | Accuracy | Best For |
|--------------|----------|----------|----------|----------|
| YOLOv11n + ByteTrack | 4-7 | 25-45 | Good | Real-time, budget hardware |
| YOLOv11n + BoT-SORT | 3-6 | 20-40 | Better | Crowded entrances |
| YOLOv11s + ByteTrack | 2-4 | 15-25 | Better | Accuracy-focused |
| YOLOv11s + BoT-SORT | 1-3 | 15-25 | Best | Maximum tracking continuity |

### API Reference Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | System health check |
| `/api/occupancy` | GET | Real-time zone occupancy |
| `/api/dwell-time?hours=N` | GET | Dwell time statistics |
| `/api/conversion?hours=N` | GET | Conversion & bounce rates |
| `/api/entries-exits?hours=N` | GET | Traffic flow data |
| `/api/zones?hours=N` | GET | Per-zone analytics |
| `/api/queue?hours=N` | GET | Queue metrics |
| `/kpis?hours=N` | GET | Summary KPIs |
| `/series.csv?hours=N` | GET | CSV time-series export |
| `/events` | POST | Ingest tracking events |
| `/sessions` | POST | Ingest completed sessions |
| `/video/start` | POST | Start video source |
| `/video/model` | POST | Switch AI model |
| `/video/tracker` | POST | Switch tracking algorithm |

### Supported Video Sources

| Source | Format | Notes |
|--------|--------|-------|
| USB Webcam | DirectShow / V4L2 | Index 0, 1, 2... |
| IP Camera | RTSP | `rtsp://user:pass@host:554/stream` |
| YouTube Live | HTTPS | Via yt-dlp extraction |
| Video File | MP4, AVI, MOV | Upload or local path |
| Demo Mode | Procedural | Animated simulation |

---

## 15. GLOSSARY

| Term | Definition |
|------|-----------|
| **YOLO** | "You Only Look Once" — A family of real-time object detection neural networks. Janus uses YOLOv11. |
| **ByteTrack** | A multi-object tracking algorithm that associates detections across video frames using motion prediction. Prioritizes speed. |
| **BoT-SORT** | "Bag of Tricks for SORT" — An advanced tracker that combines motion and appearance cues for more accurate person tracking. |
| **Re-ID** | Re-Identification — The ability to recognize the same person after they temporarily disappear from view (e.g., behind a pillar). |
| **Bounding Box** | A rectangle drawn around a detected person in a video frame. Contains position (x, y) and size (width, height). |
| **Confidence Score** | A value from 0 to 1 indicating how certain the AI is that a detection is actually a person. Higher = more certain. |
| **Dwell Time** | The total time a visitor spends in a space, from entry to exit. |
| **Conversion Rate** | The percentage of visitors who complete a desired action (e.g., reaching checkout). |
| **Bounce Rate** | The percentage of visitors who leave within 60 seconds of entering. |
| **Zone** | A defined region within the camera's view (e.g., entrance, checkout, queue). Used for spatial analytics. |
| **Edge Processing** | Running AI computation on a local device near the camera, rather than sending video to the cloud. |
| **MJPEG** | Motion JPEG — A video streaming format where each frame is a JPEG image. Used for the live video overlay feed. |
| **Session** | A complete visitor journey from entry to exit, including all zones visited and total dwell time. |
| **Throughput** | Total number of entries plus exits in a given time period. Measures overall traffic volume. |
| **MOT** | Multi-Object Tracking — The computer vision task of following multiple objects (people) across video frames. |
| **MOTA** | Multiple Object Tracking Accuracy — A benchmark metric for tracking quality. Higher is better. |
| **Kalman Filter** | A mathematical algorithm that predicts where an object will be in the next frame based on its motion history. Core component of ByteTrack. |
| **KPI** | Key Performance Indicator — A measurable metric used to evaluate performance (e.g., conversion rate, dwell time). |
| **Heatmap** | A color-coded visualization showing traffic intensity across different areas. Red = high traffic, blue = low. |

---

## APPENDIX: QUICK REFERENCE CARD

```
┌─────────────────────────────────────────────────────────────────┐
│                        JANUS AT A GLANCE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHAT:  AI-powered real-time people analytics platform         │
│  WHO:   Retail, restaurants, venues, offices, malls            │
│  HOW:   Camera → AI Detection → Tracking → Analytics          │
│  WHY:   Turn foot traffic into actionable business insights    │
│                                                                 │
│  DETECTION:  YOLOv11 (nano/small/medium)                       │
│  TRACKING:   ByteTrack (speed) / BoT-SORT (accuracy)          │
│  DASHBOARD:  React 19, Recharts, Tailwind, Canvas              │
│  DATABASE:   SQLite (metadata only, no images)                 │
│  PRIVACY:    No facial recognition. No video storage.          │
│  ANALYTICS:  50+ KPIs, heatmaps, zone tracking, reports       │
│                                                                 │
│  DEPLOY TIME:   < 1 hour                                       │
│  HARDWARE:      Any camera + commodity PC                      │
│  PERFORMANCE:   25-45 FPS (GPU) / 3-7 FPS (CPU)              │
│                                                                 │
│  TAGLINE:  "Google Analytics for Physical Spaces"              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*Document version: 1.0 | Last updated: February 21, 2026*
*Generated by Moonlight Analytica for internal use and marketing material creation.*
