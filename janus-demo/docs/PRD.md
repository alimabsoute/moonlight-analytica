# Project Janus - Product Requirements Document

**Version**: 1.0
**Last Updated**: December 2024
**Status**: Production-ready with ongoing development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [User Personas](#3-user-personas)
4. [System Architecture](#4-system-architecture)
5. [Page Specifications](#5-page-specifications)
   - 5.1 [Live Monitor](#51-live-monitor)
   - 5.2 [Analytics](#52-analytics)
   - 5.3 [Reports](#53-reports)
   - 5.4 [Heatmap](#54-heatmap)
   - 5.5 [Zone Config](#55-zone-config)
   - 5.6 [Settings](#56-settings)
6. [API Specification](#6-api-specification)
7. [Database Schema](#7-database-schema)
8. [Future Roadmap](#8-future-roadmap)
9. [Advanced KPI Research](#9-advanced-kpi-research)

---

## 1. Executive Summary

### Product Overview

**Janus** is a real-time people tracking and analytics platform designed for retail stores, venues, and any physical space where understanding visitor behavior is critical. Named after the Roman god of doorways and transitions, Janus monitors entries, exits, dwell times, and zone-specific activity to provide actionable insights.

### Key Value Propositions

1. **Real-Time Visibility** - See exactly how many people are in your space right now
2. **Zone Intelligence** - Understand which areas get the most traffic
3. **Behavioral Analytics** - Track dwell times, conversion funnels, and engagement
4. **Operational Insights** - Optimize staffing, identify bottlenecks, reduce wait times
5. **Visual Verification** - Live video feed with AI-powered person tracking

### Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite + Recharts |
| Backend | Flask + SQLite |
| Edge Agent | Python + YOLO v8 + ByteTrack |
| Video Processing | OpenCV + yt-dlp |
| Streaming | MJPEG over HTTP |

---

## 2. Product Vision

### Mission Statement

Empower physical space operators with the same level of visitor analytics that e-commerce platforms enjoy online.

### Core Principles

1. **Privacy-First** - No facial recognition, only silhouette tracking
2. **Real-Time** - Sub-second latency for live monitoring
3. **Actionable** - Every metric should drive a decision
4. **Accessible** - Simple setup, no specialized hardware required

### Target Use Cases

| Use Case | Primary Value |
|----------|---------------|
| Retail Store | Optimize layout, reduce checkout wait times |
| Restaurant | Manage table turnover, queue length |
| Event Venue | Monitor capacity, emergency planning |
| Office Space | Meeting room utilization, workspace planning |
| Museum/Gallery | Popular exhibit identification, crowd flow |

---

## 3. User Personas

### Persona 1: Store Manager (Sarah)

**Role**: Retail Store Manager
**Goals**:
- Understand peak hours to schedule staff
- Identify which departments attract most visitors
- Reduce checkout queue wait times

**Pain Points**:
- Currently guesses busy periods from sales data
- No visibility into visitor paths before purchase
- Can't quantify "browse but don't buy" behavior

**Key Features Used**: Live Monitor, Analytics, Reports

---

### Persona 2: Loss Prevention Analyst (Mike)

**Role**: Loss Prevention / Security
**Goals**:
- Monitor real-time occupancy for safety compliance
- Identify unusual traffic patterns
- Track zone activity for incident correlation

**Pain Points**:
- Manual headcounts are inaccurate and labor-intensive
- No historical data for incident investigation
- Can't prove occupancy compliance to auditors

**Key Features Used**: Live Monitor, Heatmap, Zone Config

---

### Persona 3: Operations Director (Lisa)

**Role**: Multi-Location Operations
**Goals**:
- Compare performance across locations
- Generate executive reports
- Plan staffing based on traffic predictions

**Pain Points**:
- Data from different locations isn't standardized
- Report generation is manual and time-consuming
- No predictive capability for planning

**Key Features Used**: Analytics, Reports, (Future) Historical Trends

---

## 4. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    REACT FRONTEND                            │   │
│  │  ┌──────────┐ ┌───────────┐ ┌─────────┐ ┌─────────┐        │   │
│  │  │   Live   │ │ Analytics │ │ Reports │ │ Heatmap │  ...   │   │
│  │  │  Monitor │ │           │ │         │ │         │        │   │
│  │  └────┬─────┘ └─────┬─────┘ └────┬────┘ └────┬────┘        │   │
│  └───────┼─────────────┼────────────┼───────────┼─────────────┘   │
└──────────┼─────────────┼────────────┼───────────┼─────────────────┘
           │             │            │           │
           ▼             ▼            ▼           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FLASK BACKEND (Port 8000)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │   /kpis     │  │  /api/*     │  │  /video/*   │               │
│  │   /count    │  │  Analytics  │  │  Management │               │
│  │   /series   │  │  Endpoints  │  │  Endpoints  │               │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
│         │                │                │                       │
│         └────────────────┴────────────────┘                       │
│                          │                                        │
│                    ┌─────┴─────┐                                  │
│                    │  SQLite   │                                  │
│                    │  Database │                                  │
│                    └───────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
           │
           │ Control Commands
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                EDGE AGENT (Port 8001)                             │
│  ┌─────────────────────┐  ┌─────────────────────┐                │
│  │   video_streamer.py │  │   edge_agent.py     │                │
│  │   - YOLO v8 detect  │  │   - Count events    │                │
│  │   - ByteTrack track │  │   - Zone tracking   │                │
│  │   - Zone overlay    │  │   - POST to backend │                │
│  │   - MJPEG stream    │  │                     │                │
│  └─────────────────────┘  └─────────────────────┘                │
│           │                                                       │
│           │ Video Sources                                         │
│           ├─────────────────────────────────────┐                │
│           ▼                                     ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐      │
│  │   Webcam    │  │  MP4 File   │  │  YouTube (yt-dlp)   │      │
│  └─────────────┘  └─────────────┘  └─────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

### Port Configuration

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 5173 | Vite dev server |
| Backend | 8000 | Flask API |
| Edge Agent | 8001 | MJPEG video stream |

### Data Flow

1. **Video Input** → Edge Agent captures frames
2. **Detection** → YOLO v8 identifies persons in frame
3. **Tracking** → ByteTrack assigns persistent IDs
4. **Zone Check** → Each person checked against zone boundaries
5. **Event Post** → Count/event data POSTed to backend
6. **Storage** → Backend stores in SQLite
7. **Query** → Frontend fetches aggregated KPIs
8. **Display** → React renders charts and metrics

---

## 5. Page Specifications

### 5.1 Live Monitor

**Route**: `#live`
**File**: `frontend/src/pages/LiveMonitor.jsx`
**Purpose**: Real-time operational dashboard for monitoring current traffic

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Live Monitor          [✓ Auto-refresh 10s]  [📚 Library] [🔄]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  TIME RANGE PICKER                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [10min] [30min] [1 hour] [24 hours] [7 days]                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  KPI CARDS (Row 1)                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │Current │ │Average │ │ Peak   │ │ Total  │ │Occupancy│              │
│  │ Count  │ │        │ │        │ │ Events │ │   %    │               │
│  │   12   │ │  8.5   │ │   24   │ │  1,847 │ │  45%   │               │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘               │
│                                                                         │
│  KPI CARDS (Row 2)                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │Entries │ │ Exits  │ │Avg Dwell│ │ Queue  │ │Avg Wait│              │
│  │        │ │        │ │  Time  │ │ Length │ │  Time  │               │
│  │  156   │ │  142   │ │  8m    │ │   4    │ │  3m    │               │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘               │
├─────────────────────────────────────────────────────────────────────────┤
│  VIDEO FEED CARD                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Live Video Feed                    [📹 Change Video Source]      │   │
│  │ ┌───────────────────────────────────────────────────────────┐   │   │
│  │ │                                                           │   │   │
│  │ │              ┌─────┐    ┌─────┐                           │   │   │
│  │ │              │ ID:1│    │ ID:2│   ← Bounding boxes       │   │   │
│  │ │              └─────┘    └─────┘     with track IDs       │   │   │
│  │ │                                                           │   │   │
│  │ │   [ENTRANCE]      [MAIN FLOOR]      [CHECKOUT]           │   │   │
│  │ │      Green            Blue              Red              │   │   │
│  │ │                                                           │   │   │
│  │ └───────────────────────────────────────────────────────────┘   │   │
│  │            [⏸️ Pause]    [⏹️ Stop]    [⚙️ Source]              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  COUNT OVER TIME CHART                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Count Over Time                [📥 Download CSV] [🎲 Seed Demo] │   │
│  │ ┌───────────────────────────────────────────────────────────┐   │   │
│  │ │     ^                                                     │   │   │
│  │ │  20 │        ╱╲                                           │   │   │
│  │ │     │   ╱╲  ╱  ╲    ╱╲                                    │   │   │
│  │ │  10 │  ╱  ╲╱    ╲  ╱  ╲                                   │   │   │
│  │ │     │ ╱          ╲╱    ╲                                  │   │   │
│  │ │   0 └─────────────────────────────────────────> Time      │   │   │
│  │ │      9:00   9:15   9:30   9:45   10:00                    │   │   │
│  │ └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  STATS GRID                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐             │
│  │ Throughput (Events/hr)  │  │ Time Range              │             │
│  │         245.6           │  │         1h              │             │
│  └─────────────────────────┘  └─────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

| Component | Purpose | Data Source |
|-----------|---------|-------------|
| Header Bar | Page title + controls | Local state |
| Time Range Picker | Filter data window | `timeRange` state |
| KPI Grid (10 cards) | Key metrics display | `/kpis`, `/api/*` endpoints |
| Video Feed Card | Live MJPEG stream | `localhost:8001/video_feed` |
| Count Chart | Historical line chart | `/series.csv` |
| Stats Grid | Summary metrics | `/kpis` |

#### KPI Cards Detail

| KPI | Description | Endpoint | Format |
|-----|-------------|----------|--------|
| Current Count | People in space now | `/kpis` → `current_count` | Integer |
| Average | Avg count in time range | `/kpis` → `avg_count` | Decimal (1 place) |
| Peak | Highest count | `/kpis` → `peak_count` | Integer |
| Total Events | Count records logged | `/kpis` → `total_events` | Integer |
| Occupancy % | Current/Capacity | `/api/occupancy` → `occupancy_rate` | Percentage |
| Entries | People who entered | `/api/entries-exits` → `entries` | Integer |
| Exits | People who exited | `/api/entries-exits` → `exits` | Integer |
| Avg Dwell Time | Avg time in space | `/api/dwell-time` → `avg_dwell_seconds` | Minutes |
| Queue Length | People in queue zone | `/api/queue` → `current_queue_length` | Integer |
| Avg Wait Time | Avg queue wait | `/api/queue` → `avg_wait_seconds` | Minutes |

#### Modal 1: Video Source Selection

```
┌─────────────────────────────────────────────────────────────┐
│  Select Video Source                                    [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ◉ 📹 Demo Video / YouTube                                  │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ Upload MP4 Video:                                   │ │
│    │ [Choose File] demo_retail_store.mp4                 │ │
│    │                                                     │ │
│    │ ─────────────── OR ───────────────                  │ │
│    │                                                     │ │
│    │ YouTube URL:                                        │ │
│    │ [https://youtube.com/watch?v=...                  ] │ │
│    │                                                     │ │
│    │                    [▶️ Start Demo Video]             │ │
│    └─────────────────────────────────────────────────────┘ │
│                                                             │
│  ○ 📷 Live Webcam                                          │
│    Connect to your computer's webcam for live tracking     │
│                                                             │
│  ○ 🎲 Procedural Demo                                       │
│    Generate simulated tracking data for testing            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Modal 2: Video Library

```
┌─────────────────────────────────────────────────────────────────┐
│  📚 Video Library                                           [X] │
├─────────────────────────────────────────────────────────────────┤
│  Upload New Video                                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [Choose File]  retail_morning_rush.mp4                    │ │
│  │ Name: [                                                 ] │ │
│  │ Description: [                                          ] │ │
│  │                                [📤 Upload to Library]     │ │
│  └───────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Saved Videos (3)                                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Morning Rush    │ │ Afternoon Peak  │ │ Weekend Demo    │   │
│  │ 45.2 MB         │ │ 62.1 MB         │ │ 38.5 MB         │   │
│  │ 12/15/2024      │ │ 12/14/2024      │ │ 12/10/2024      │   │
│  │ [▶️ Play] [🗑️]  │ │ [▶️ Play] [🗑️]  │ │ [▶️ Play] [🗑️]  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Change time range | Click time button | Refetch all data for new window |
| Toggle auto-refresh | Click checkbox | Enable/disable 2s polling |
| Open Video Library | Click 📚 button | Show video library modal |
| Refresh Now | Click 🔄 button | Immediate data refresh |
| Change Video Source | Click 📹 button | Show source selection modal |
| Play/Pause video | Click ⏸️/▶️ | Toggle video display |
| Stop video | Click ⏹️ | Stop stream, show placeholder |
| Download CSV | Click 📥 | Download time series data |
| Seed Demo | Click 🎲 | Generate 14 days test data |
| Upload video | Select file + click Upload | Upload to library |
| Play from library | Click ▶️ on card | Start tracking that video |
| Delete from library | Click 🗑️ | Remove video (with confirm) |

#### State Management

```javascript
// Core state
const [timeRange, setTimeRange] = useState(1);      // Hours: 1, 6, 24, 168
const [kpis, setKpis] = useState(null);             // KPI data object
const [series, setSeries] = useState([]);           // Chart data array
const [dwellTime, setDwellTime] = useState(null);   // Dwell analytics
const [occupancy, setOccupancy] = useState(null);   // Occupancy data
const [entriesExits, setEntriesExits] = useState(null); // Entry/exit counts
const [queue, setQueue] = useState(null);           // Queue metrics
const [loading, setLoading] = useState(true);       // Loading state
const [error, setError] = useState(null);           // Error message
const [autoRefresh, setAutoRefresh] = useState(true); // Auto-refresh toggle

// Video state
const [videoSource, setVideoSource] = useState('demo');
const [uploadedVideo, setUploadedVideo] = useState(null);
const [youtubeUrl, setYoutubeUrl] = useState('');
const [showVideoSourceModal, setShowVideoSourceModal] = useState(false);
const [videoPlaying, setVideoPlaying] = useState(true);
const [videoStreamUrl, setVideoStreamUrl] = useState(`http://localhost:8001/video_feed?t=${Date.now()}`);

// Library state
const [showVideoLibrary, setShowVideoLibrary] = useState(false);
const [videoLibrary, setVideoLibrary] = useState([]);
const [uploadingToLibrary, setUploadingToLibrary] = useState(false);
const [newVideoName, setNewVideoName] = useState('');
const [newVideoDescription, setNewVideoDescription] = useState('');
const [newVideoFile, setNewVideoFile] = useState(null);
```

#### Data Fetch Pattern

```javascript
// Fetch all data on mount and time range change
useEffect(() => {
  fetchData();
}, [timeRange]);

// Auto-refresh every 2 seconds when enabled
useEffect(() => {
  if (!autoRefresh) return;
  const interval = setInterval(fetchData, 2000);
  return () => clearInterval(interval);
}, [autoRefresh, timeRange]);

// Parallel fetch for performance
const fetchData = async () => {
  const [kpiData, csvData, dwellData, occData, eeData, qData] = await Promise.all([
    getKpis(timeRange),
    getSeriesCsv(timeRange),
    getDwellTime(timeRange),
    getOccupancy(),
    getEntriesExits(timeRange),
    getQueue(timeRange)
  ]);
  // Set all state...
};
```

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| No data in time range | Show "No data available" message |
| Video stream disconnected | Show placeholder with reconnect option |
| API error | Display ErrorBanner with message |
| YouTube URL invalid | Show error toast, keep modal open |
| Upload file too large | Backend returns error, display to user |
| Library empty | Show "No videos yet" message |

#### Performance Considerations

- Auto-refresh interval: 2 seconds (configurable)
- Parallel API calls reduce load time
- Video stream uses MJPEG (efficient, browser-native)
- Time range buttons prevent excessive queries
- CSV parsing done client-side

---

### 5.2 Analytics

**Route**: `#analytics`
**File**: `frontend/src/pages/Analytics.jsx`
**Purpose**: Comprehensive analytics dashboard with 26+ KPIs and visualizations

#### Current Implementation (26 KPIs, Dense Layout)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📊 Advanced Analytics Dashboard      [✓ Auto-refresh 30s]       │   │
│  │ "Comprehensive real-time visitor analytics with 26+ KPIs"       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  TIME RANGE SELECTOR                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Primary:  [1hr] [6hr] [24hr] [7d] [30d]                         │   │
│  │ Compare:  [None] [1hr] [6hr] [24hr] [7d] [30d]                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  🎯 KEY PERFORMANCE INDICATORS (26 KPIs in 5-column grid)              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │Entries│ │Exits │ │Net   │ │Total │ │Total │  ← Traffic Row          │
│  │  156  │ │ 142  │ │+14   │ │ 298  │ │Sessions│                       │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │Current│ │Total │ │Occ % │ │Avail │ │Util %│  ← Occupancy Row        │
│  │Occ: 12│ │Cap:200│ │ 45% │ │Space │ │  6%  │                         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │Avg   │ │Median│ │Max   │ │Min   │ │Samples│ ← Dwell Time Row        │
│  │Dwell │ │Dwell │ │Dwell │ │Dwell │ │  847  │                         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │Conv  │ │Conv %│ │Bounce│ │Engage│ │Non-  │  ← Conversion Row        │
│  │ 127  │ │ 42%  │ │ 15%  │ │ 68%  │ │Conv  │                         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │Queue │ │Wait  │ │Total │ │Avg   │ │Peak  │  ← Queue/Perf Row        │
│  │Len: 4│ │ 3.2m │ │Queued│ │Traffic│ │Traffic│                        │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                         │
│  ┌──────┐                                                              │
│  │Thru- │                                                              │
│  │put/hr│                                                              │
│  └──────┘                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  🏢 ZONE PERFORMANCE ANALYSIS                                          │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐      │
│  │ Zone Traffic Bar Chart      │ │ Zone Utilization Radar      │      │
│  │ [entrance] [main] [queue]   │ │      entrance               │      │
│  │     ████████                │ │     ╱    ╲                  │      │
│  │     █████████████           │ │   ╱        ╲                │      │
│  │     ████                    │ │ queue ──── main             │      │
│  │     ████████████            │ │   ╲        ╱                │      │
│  └─────────────────────────────┘ └─────────────────────────────┘      │
├─────────────────────────────────────────────────────────────────────────┤
│  ⏱️ DWELL TIME DISTRIBUTION                                            │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐      │
│  │ Pie Chart                   │ │ Bar Chart                   │      │
│  │    ┌────┐                   │ │ <1m  ████                   │      │
│  │   ╱ Deep ╲                  │ │ 1-5m ████████████           │      │
│  │  │ Shop ╲ Quick │           │ │ 5-15m████████████████       │      │
│  │   ╲  Browse  ╱              │ │ 15-30█████████              │      │
│  │    └────────┘               │ │ 30m+ ████                   │      │
│  └─────────────────────────────┘ └─────────────────────────────┘      │
├─────────────────────────────────────────────────────────────────────────┤
│  🔄 CONVERSION FUNNEL                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Visitors (298) ████████████████████████████████████████ 100%    │   │
│  │ Engaged (203)  ███████████████████████████░░░░░░░░░░░░░  68%    │   │
│  │ Converted (127)████████████████░░░░░░░░░░░░░░░░░░░░░░░░  42%    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  📈 TRAFFIC TRENDS (Area Chart or Comparison Line Chart)               │
├─────────────────────────────────────────────────────────────────────────┤
│  🌊 TRAFFIC FLOW SUMMARY                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Entries → Total Sessions → Conversions (42%) → Exits           │   │
│  │    156   →      298       →     127          →   142            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  💡 AUTOMATED INSIGHTS (Conditional Cards)                             │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐       │
│  │ ⚠️ High Bounce   │ │ ✅ Strong Engage │ │ 📊 Net Positive │       │
│  │ Rate: 41%       │ │ Rate: 68%        │ │ Traffic: +14    │       │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Proposed Redesign: Simplified + Details View

The redesigned layout shows **Top 10 essential KPIs** prominently with a "See All 26 KPIs" expandable section.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📊 Analytics Dashboard    [Auto-refresh] [📥 Export]            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  TIME SELECTOR: [1h] [6h] [24h] [7d] [30d] [Custom]                    │
├─────────────────────────────────────────────────────────────────────────┤
│  TOP 10 KPIs (Large Cards, 2 Rows x 5 Columns)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Current │ │  Total  │ │  Peak   │ │ Conv    │ │  Avg    │          │
│  │ Occupancy│ │ Visitors│ │ Traffic │ │ Rate %  │ │  Dwell  │          │
│  │   12    │ │   298   │ │   24    │ │  42%    │ │  8.5m   │          │
│  │  ↑ +3   │ │  ↑ +12% │ │  ↓ -2   │ │  ↑ +5%  │ │  → 0%   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Bounce  │ │  Queue  │ │ Engage  │ │   Net   │ │ Capacity│          │
│  │ Rate %  │ │ Length  │ │ Rate %  │ │ Traffic │ │  Util % │          │
│  │  15%    │ │    4    │ │  68%    │ │   +14   │ │   45%   │          │
│  │  ↓ -3%  │ │  ↑ +2   │ │  ↑ +8%  │ │  ↑ +6   │ │  ↑ +10% │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                              [See All 26 KPIs →]       │
├─────────────────────────────────────────────────────────────────────────┤
│  QUICK INSIGHTS (Collapsible, AI-generated)                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Queue above average (4 people)  •  ✅ Strong engagement today │   │
│  │ 📈 Traffic up 12% vs yesterday                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  PRIMARY CHART: Traffic Over Time (Area Chart)                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │     ^                                                           │   │
│  │  20 │        ╱╲        ╱╲                                       │   │
│  │     │   ╱╲  ╱  ╲  ╱╲  ╱  ╲                                      │   │
│  │  10 │  ╱  ╲╱    ╲╱  ╲╱    ╲                                     │   │
│  │     │ ╱                    ╲                                    │   │
│  │   0 └───────────────────────────────────────> Time              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  SECONDARY CHARTS (Collapsible Sections)                               │
│  [▼ Zone Performance]                                                   │
│     Zone Traffic + Zone Utilization Radar (side by side)               │
│                                                                         │
│  [▼ Dwell Distribution]                                                 │
│     Pie Chart + Bar Chart (side by side)                               │
│                                                                         │
│  [▼ Conversion Funnel]                                                  │
│     Horizontal bar funnel: Visitors → Engaged → Converted              │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

| Section | Components | Data Source |
|---------|-----------|-------------|
| Top 10 KPIs | 10 large KPIStat cards | Multiple APIs |
| Quick Insights | Conditional alert badges | Calculated from KPIs |
| Traffic Chart | AreaChart (Recharts) | `/series.csv` |
| Zone Performance | BarChart + RadarChart | `/api/zones` |
| Dwell Distribution | PieChart + BarChart | `/api/dwell-time` |
| Conversion Funnel | Horizontal BarChart | `/api/conversion` |

#### Top 10 Essential KPIs

| # | KPI | Source | Why Essential |
|---|-----|--------|---------------|
| 1 | Current Occupancy | `/api/occupancy` | Real-time capacity awareness |
| 2 | Total Visitors | `/api/entries-exits` | Volume indicator |
| 3 | Peak Traffic | `/kpis` | Staffing benchmark |
| 4 | Conversion Rate | `/api/conversion` | Business outcome |
| 5 | Avg Dwell Time | `/api/dwell-time` | Engagement quality |
| 6 | Bounce Rate | `/api/conversion` | Experience friction |
| 7 | Queue Length | `/api/queue` | Operational bottleneck |
| 8 | Engagement Rate | `/api/conversion` | Visitor quality |
| 9 | Net Traffic | `/api/entries-exits` | Flow balance |
| 10 | Capacity Util % | `/api/occupancy` | Space efficiency |

#### Full 26 KPIs (Expandable Section)

**Traffic Metrics (5)**
- Total Entries, Total Exits, Net Traffic, Total Sessions, Total Traffic

**Occupancy Metrics (5)**
- Current Occupancy, Total Capacity, Occupancy Rate, Available Space, Utilization %

**Dwell Time Metrics (5)**
- Avg Dwell, Median Dwell, Max Dwell, Min Dwell, Sample Count

**Conversion Metrics (5)**
- Conversions, Conversion Rate, Bounce Rate, Engagement Rate, Non-Converters

**Queue/Performance Metrics (6)**
- Queue Length, Avg Wait Time, Total Queued, Avg Traffic, Peak Traffic, Throughput/hr

#### Insight Rules Engine

| Condition | Insight Type | Message Template |
|-----------|-------------|------------------|
| `bounceRate > 40%` | Warning | "High Bounce Rate: {rate}% - Consider improving entrance" |
| `conversionRate < 20%` | Alert | "Low Conversion: {rate}% - Review zone engagement" |
| `queueLength > 10` | Warning | "Queue building: {count} people, {wait}m avg wait" |
| `occupancyRate > 80%` | Alert | "High Occupancy: {rate}% - Manage traffic flow" |
| `engagementRate > 60%` | Success | "Strong Engagement: {rate}% - Great experience!" |
| `netTraffic > 20` | Info | "Net Positive: +{count} visitors accumulating" |

#### State Management

```javascript
const [selectedRange, setSelectedRange] = useState(24);      // Hours
const [compareRange, setCompareRange] = useState(null);      // Comparison period
const [data, setData] = useState({});                        // All fetched data
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [autoRefresh, setAutoRefresh] = useState(true);        // 30s interval
const [expandedSections, setExpandedSections] = useState({   // Collapsible state
  zones: true,
  dwell: false,
  funnel: false,
  allKpis: false
});
```

#### Data Fetch Pattern

```javascript
// Fetch all analytics data in parallel
const fetchData = async (hours) => {
  const [kpis, csv, conv, dwell, zones, entries, occ, queue] = await Promise.all([
    getKpis(hours),
    getSeriesCsv(hours),
    getConversion(hours),
    getDwellTime(hours),
    getZones(hours),
    getEntriesExits(hours),
    getOccupancy(),
    getQueue(hours)
  ]);
  return { kpis, series: parseSeries(csv), conversion: conv, ... };
};
```

#### Chart Configuration

**Traffic Area Chart**
```javascript
<AreaChart data={series}>
  <Area type="monotone" dataKey="count_value" stroke="#8884d8" fill="#8884d8" />
  <Area type="monotone" dataKey="peak" stroke="#82ca9d" fill="#82ca9d" />
</AreaChart>
```

**Zone Bar Chart**
```javascript
<BarChart data={zonePerformance}>
  <Bar dataKey="visitors" fill="#0088FE" name="Unique Visitors" />
  <Bar dataKey="events" fill="#00C49F" name="Total Events" />
</BarChart>
```

**Zone Radar Chart**
```javascript
<RadarChart data={zonePerformance}>
  <Radar dataKey="utilization" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
</RadarChart>
```

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Select time range | Click range button | Refetch all data |
| Toggle comparison | Click compare button | Overlay comparison data |
| Toggle auto-refresh | Click checkbox | Start/stop 30s polling |
| Expand section | Click section header | Show/hide charts |
| See All KPIs | Click link | Expand full KPI grid |
| Export data | Click 📥 button | Download CSV (future) |

#### Mobile Responsiveness

- KPI grid: 5 cols → 3 cols → 2 cols
- Charts: Side-by-side → Stacked
- Insights: Horizontal → Vertical stack
- Time range: Horizontal buttons → Dropdown

---

### 5.3 Reports

**Route**: `#reports`
**File**: `frontend/src/pages/Reports.jsx`
**Purpose**: Generate daily and weekly summary reports with key metrics and insights

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📄 Reports                          [Daily] [Weekly]            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  DAILY VIEW (when Daily selected)                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Daily Summary (Last 24 Hours)                                    │   │
│  │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │   │
│  │ │ Total     │ │ Average   │ │ Peak      │ │ Throughput │        │   │
│  │ │ Events    │ │ Count     │ │ Count     │ │            │        │   │
│  │ │   1,847   │ │   8.5     │ │    24     │ │  45.2/hr   │        │   │
│  │ └───────────┘ └───────────┘ └───────────┘ └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  WEEKLY VIEW (when Weekly selected)                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Weekly Summary (Last 7 Days)                                     │   │
│  │ ┌───────────────────────────────────────────────────────────┐   │   │
│  │ │     ^                                                     │   │   │
│  │ │  25 │   ■        ■                                        │   │   │
│  │ │     │   █        █    ■                                   │   │   │
│  │ │  15 │   █  ■     █    █         ■                         │   │   │
│  │ │     │   █  █  ■  █    █    ■    █                         │   │   │
│  │ │   5 │   █  █  █  █    █    █    █    ■    ■              │   │   │
│  │ │     │   █  █  █  █    █    █    █    █    █              │   │   │
│  │ │   0 └───────────────────────────────────────────>        │   │   │
│  │ │      Mon  Tue  Wed  Thu  Fri  Sat  Sun                   │   │   │
│  │ │                                                           │   │   │
│  │ │      █ Average    ■ Peak                                  │   │   │
│  │ └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  TOP 5 BUSIEST HOURS                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Top 5 Busiest Hours (Last 24h / Last 7d)                        │   │
│  │ ┌──────┬─────────────────────────────────┬─────────────┐        │   │
│  │ │ Rank │ Time                            │ Count       │        │   │
│  │ ├──────┼─────────────────────────────────┼─────────────┤        │   │
│  │ │ #1   │ 12/15/2024, 2:30:00 PM          │    24       │        │   │
│  │ │ #2   │ 12/15/2024, 12:15:00 PM         │    22       │        │   │
│  │ │ #3   │ 12/15/2024, 3:45:00 PM          │    21       │        │   │
│  │ │ #4   │ 12/14/2024, 1:00:00 PM          │    19       │        │   │
│  │ │ #5   │ 12/15/2024, 11:30:00 AM         │    18       │        │   │
│  │ └──────┴─────────────────────────────────┴─────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

| Component | Purpose | Data Source |
|-----------|---------|-------------|
| Report Type Selector | Toggle between Daily/Weekly | `reportType` state |
| Daily Summary Cards | 4 KPI metrics (24h window) | `/kpis?hours=24` |
| Weekly Bar Chart | 7-day average vs peak | `/series.csv?hours=168` |
| Top 5 Table | Busiest periods ranked | Computed from series data |

#### Daily Summary Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Total Events | Count records in 24h | `kpis.total_events` |
| Average Count | Mean occupancy | `kpis.avg_count` (1 decimal) |
| Peak Count | Maximum occupancy | `kpis.peak_count` |
| Throughput | Events per hour | `kpis.throughput` (/hr format) |

#### Weekly Summary Data

The weekly view aggregates data by day:

```javascript
// Group time series by day
const days = {};
data.series.forEach(item => {
  const date = new Date(item.ts).toLocaleDateString();
  if (!days[date]) {
    days[date] = { total: 0, count: 0, peak: 0 };
  }
  days[date].total += item.count_value;
  days[date].count += 1;
  days[date].peak = Math.max(days[date].peak, item.count_value);
});

// Return chart-ready data
return Object.entries(days).map(([date, stats]) => ({
  date,
  average: (stats.total / stats.count).toFixed(1),
  peak: stats.peak,
  events: stats.count
}));
```

#### Top 5 Busiest Hours Algorithm

```javascript
const getTop5BusiestHours = () => {
  // Sort all data points by count (descending)
  const sorted = [...data.series].sort((a, b) => b.count_value - a.count_value);

  // Take top 5 and format for display
  return sorted.slice(0, 5).map(item => ({
    time: new Date(item.ts).toLocaleString(),
    count: item.count_value
  }));
};
```

#### State Management

```javascript
const [reportType, setReportType] = useState('daily');  // 'daily' or 'weekly'
const [data, setData] = useState(null);                 // { kpis, series }
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

#### Data Fetch Pattern

```javascript
const fetchData = async () => {
  const hours = reportType === 'daily' ? 24 : 168;  // 24h or 7 days

  const [kpiData, csvData] = await Promise.all([
    getKpis(hours),
    getSeriesCsv(hours)
  ]);

  const series = parseSeries(csvData);
  setData({ kpis: kpiData, series });
};

// Refetch when report type changes
useEffect(() => {
  fetchData();
}, [reportType]);
```

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Switch to Daily | Click "Daily" button | Fetch 24h data, show summary cards |
| Switch to Weekly | Click "Weekly" button | Fetch 7d data, show bar chart |
| Dismiss error | Click dismiss on ErrorBanner | Clear error state |

#### Chart Configuration (Weekly)

```javascript
<BarChart data={weeklyData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="average" fill="#007bff" name="Average" />
  <Bar dataKey="peak" fill="#dc3545" name="Peak" />
</BarChart>
```

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| No data available | Show "No data available" in table |
| API error | Display ErrorBanner with message |
| Loading state | Show Loading spinner with "Generating report..." |

#### Proposed Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Date picker | Medium | Custom date range selection |
| PDF export | High | Download report as PDF |
| Email scheduling | Medium | Auto-send reports at configured times |
| Comparison mode | Low | Compare current vs previous period |
| Zone breakdown | Medium | Per-zone reporting |
| Custom metrics | Low | User-configurable KPIs in report |

---

### 5.4 Heatmap

**Route**: `#heatmap`
**File**: `frontend/src/pages/Heatmap.jsx`
**Purpose**: Visual traffic heatmap and dwell time analysis across zones

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Zone Heatmap & Dwell Analysis                                    │   │
│  │ "Visual representation of traffic patterns and visitor behavior" │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  TIME RANGE PICKER                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [10min] [30min] [1 hour] [24 hours] [7 days*]                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  MAIN CONTENT GRID (2 columns)                                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │ Traffic Heatmap (Canvas)    │  │ Zone Statistics             │      │
│  │ ┌───────────────────────┐   │  │ ┌─────────────────────────┐ │      │
│  │ │░░░░░░░│▓▓▓▓▓▓▓▓▓▓▓│   │   │  │ │ entrance               │ │      │
│  │ │ ENTR- │   MAIN      │QUE│   │  │ │ Capacity: 50           │ │      │
│  │ │ ANCE  │   FLOOR     │UE │   │  │ │ Visitors: 156          │ │      │
│  │ │ Blue  │   Yellow    │Ora│   │  │ │ Events: 324            │ │      │
│  │ │  23%  │    67%      │nge│   │  │ │ Avg/Visitor: 2.1       │ │      │
│  │ │       │             │45%│   │  │ └─────────────────────────┘ │      │
│  │ │       │             │   │   │  │ ┌─────────────────────────┐ │      │
│  │ │       │             │CHK│   │  │ │ main_floor             │ │      │
│  │ │       │             │OUT│   │  │ │ Capacity: 200          │ │      │
│  │ │       │             │Red│   │  │ │ Visitors: 287          │ │      │
│  │ │       │             │100│   │  │ │ Events: 512            │ │      │
│  │ └───────────────────────┘   │  │ └─────────────────────────┘ │      │
│  │ ┌───────────────────────┐   │  │         ...                 │      │
│  │ │ Traffic Intensity     │   │  │                             │      │
│  │ │ Low [▓▓▓▓▓▓▓▓▓▓] High │   │  │                             │      │
│  │ └───────────────────────┘   │  │                             │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
├─────────────────────────────────────────────────────────────────────────┤
│  DWELL TIME DISTRIBUTION                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Summary Stats Row                                                │   │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │   │
│  │ │ Avg    │ │ Median │ │  Min   │ │  Max   │ │Sessions│         │   │
│  │ │ 8m 32s │ │  6m    │ │  12s   │ │  45m   │ │  847   │         │   │
│  │ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘         │   │
│  │                                                                  │   │
│  │ Histogram Chart                                                  │   │
│  │ ┌───────────────────────────────────────────────────────────┐   │   │
│  │ │     ^                                                     │   │   │
│  │ │ 150 │                    ████                             │   │   │
│  │ │     │           ████     █  █                             │   │   │
│  │ │ 100 │           █  █     █  █     ████                    │   │   │
│  │ │     │    ████   █  █     █  █     █  █                    │   │   │
│  │ │  50 │    █  █   █  █     █  █     █  █     ████           │   │   │
│  │ │     │    █  █   █  █     █  █     █  █     █  █           │   │   │
│  │ │   0 └────────────────────────────────────────────>        │   │   │
│  │ │      < 1min  1-5min  5-15min  15-30min  > 30min          │   │   │
│  │ └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

| Component | Purpose | Data Source |
|-----------|---------|-------------|
| Time Range Picker | Filter data window | `timeRange` state |
| Canvas Heatmap | Visual zone traffic | `/api/zones` (rendered on canvas) |
| Zone Statistics | Per-zone metrics | `/api/zones` |
| Dwell Summary | Avg/Median/Min/Max | `/api/dwell-time` |
| Dwell Histogram | Time distribution chart | `/api/dwell-time` distribution |

#### Canvas Rendering Details

The heatmap is rendered on a 640x480 canvas with the following process:

```javascript
// Zone positions (matching zones.json)
const zonePositions = {
  'entrance': { x1: 0, y1: 0, x2: 200, y2: 480 },
  'main_floor': { x1: 200, y1: 0, x2: 440, y2: 480 },
  'queue': { x1: 440, y1: 240, x2: 540, y2: 480 },
  'checkout': { x1: 540, y1: 0, x2: 640, y2: 480 }
};

// Heat color algorithm
const intensity = visitors / maxTraffic;  // 0.0 to 1.0

if (intensity < 0.5) {
  // Blue → Yellow (low traffic)
  r = intensity * 2 * 255;
  g = intensity * 2 * 255;
  b = 255 - intensity * 2 * 255;
} else {
  // Yellow → Red (high traffic)
  r = 255;
  g = 255 - (intensity - 0.5) * 2 * 255;
  b = 0;
}
```

#### Heat Color Scale

| Intensity | Color | Meaning |
|-----------|-------|---------|
| 0% | Blue `rgb(0, 0, 255)` | Very low traffic |
| 25% | Cyan `rgb(127, 127, 127)` | Below average |
| 50% | Yellow `rgb(255, 255, 0)` | Moderate traffic |
| 75% | Orange `rgb(255, 127, 0)` | Above average |
| 100% | Red `rgb(255, 0, 0)` | Highest traffic |

#### Zone Statistics Card

For each zone, displays:

| Metric | Description |
|--------|-------------|
| Capacity | Configured zone capacity |
| Unique Visitors | Distinct people detected |
| Total Events | Count records in zone |
| Avg per Visitor | Events / Visitors ratio |

#### Dwell Time Distribution

Histogram buckets:

| Range | Color | Label |
|-------|-------|-------|
| < 1 minute | `#F44336` Red | Quick pass-through |
| 1-5 minutes | `#FF9800` Orange | Brief stop |
| 5-15 minutes | `#FFC107` Yellow | Moderate engagement |
| 15-30 minutes | `#4CAF50` Green | Good engagement |
| > 30 minutes | `#2196F3` Blue | Deep engagement |

#### State Management

```javascript
const [timeRange, setTimeRange] = useState(168);      // 7 days default
const [zonesData, setZonesData] = useState(null);     // Zone traffic data
const [dwellData, setDwellData] = useState(null);     // Dwell time analytics
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const canvasRef = useRef(null);                       // Canvas DOM reference
```

#### Data Fetch Pattern

```javascript
const fetchData = async () => {
  const [zones, dwell] = await Promise.all([
    getZones(timeRange),
    getDwellTime(timeRange)
  ]);
  setZonesData(zones);
  setDwellData(dwell);
};

// Refetch when time range changes
useEffect(() => {
  fetchData();
}, [timeRange]);

// Redraw canvas when data changes
useEffect(() => {
  if (!zonesData || !canvasRef.current) return;
  // Canvas drawing logic...
}, [zonesData]);
```

#### API Response Shapes

**`/api/zones` Response:**
```javascript
{
  zones: [
    {
      zone: "entrance",
      capacity: 50,
      unique_visitors: 156,
      total_events: 324
    },
    // ... more zones
  ]
}
```

**`/api/dwell-time` Response:**
```javascript
{
  avg_dwell_seconds: 512,
  median_dwell_seconds: 360,
  min_dwell_seconds: 12,
  max_dwell_seconds: 2700,
  total_sessions: 847,
  distribution: {
    under_1min: 45,
    "1_to_5min": 89,
    "5_to_15min": 156,
    "15_to_30min": 98,
    over_30min: 32
  }
}
```

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Change time range | Click time button | Refetch zone & dwell data, redraw canvas |
| Hover zone (future) | Mouse over canvas | Show zone tooltip |
| Click zone (future) | Click on canvas | Drill down to zone detail |

#### Canvas Drawing Flow

1. Clear canvas with dark background (`#1a1a1a`)
2. Draw grid lines every 40px
3. Calculate max traffic for normalization
4. For each zone:
   - Calculate intensity (0-1)
   - Compute heat color (blue→yellow→red)
   - Draw filled rectangle with alpha 0.4
   - Draw border with full color
   - Render zone label and stats
   - Show intensity percentage at center
5. Draw legend bar at bottom

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| No zone data | Canvas shows empty grid |
| No dwell distribution | Histogram shows empty bars |
| API error | Display ErrorBanner |
| Loading state | Show Loading spinner |

#### Proposed Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Interactive zones | High | Click zones to see detailed breakdown |
| Time animation | Medium | Animate heatmap over time |
| Export heatmap | Medium | Save as PNG/SVG |
| Zone comparison | Low | Compare two time periods |
| Path flow | High | Show visitor flow between zones |
| Real-time mode | Medium | Live heatmap updates |

---

### 5.5 Zone Config

**Route**: `#zone-config`
**File**: `frontend/src/pages/ZoneConfig.jsx`
**Purpose**: Visual zone editor for configuring tracking regions

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Zone Configuration                                               │   │
│  │ "Click and drag zones to reposition. Click handles to resize."  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  CONFIG CONTROLS                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [Video stream URL (optional)             ] [📹 Connect Video]    │   │
│  │                                                                   │   │
│  │ [💾 Save Config] [🔄 Reset to Default]                ● Connected │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  CANVAS EDITOR (640 x 480)                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ┌───────────────┬─────────────────────────┬──────┬──────────┐   │   │
│  │ │               │                         │      │          │   │   │
│  │ │   entrance    │       main_floor        │      │ checkout │   │   │
│  │ │   (green)     │       (blue)            │ queue│  (red)   │   │   │
│  │ │               │                         │(orng)│          │   │   │
│  │ │  [■]──────[■] │  [■]───────────────[■]  │[■]───[■]────[■] │   │   │
│  │ │   │         │ │   │                  │  │ │      │      │ │   │   │
│  │ │   │         │ │   │                  │  │ │      │      │ │   │   │
│  │ │  [■]──────[■] │  [■]───────────────[■]  │[■]───[■]────[■] │   │   │
│  │ └───────────────┴─────────────────────────┴──────┴──────────┘   │   │
│  │                         [■] = Resize handle                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  ZONE LIST                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Zones                                                            │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ ● entrance    (0, 0) → (200, 480)              entrance     │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ ● main_floor  (200, 0) → (440, 480)            general      │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ ● queue       (440, 240) → (540, 480)          queue        │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ ● checkout    (540, 0) → (640, 480)            checkout     │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

| Component | Purpose | Data Source |
|-----------|---------|-------------|
| Video URL Input | Connect video stream for overlay | User input |
| Save Button | Export zones.json configuration | Local state |
| Reset Button | Restore default zones | `DEFAULT_ZONES` constant |
| Canvas Editor | Visual zone drag/resize | `zones` state |
| Zone List | Clickable zone selector | `zones` state |

#### Default Zone Configuration

```javascript
const DEFAULT_ZONES = [
  { zone_id: 1, name: 'entrance',    x1: 0,   y1: 0,   x2: 200, y2: 480, zone_type: 'entrance', color: '#4CAF50' },
  { zone_id: 2, name: 'main_floor',  x1: 200, y1: 0,   x2: 440, y2: 480, zone_type: 'general',  color: '#2196F3' },
  { zone_id: 3, name: 'queue',       x1: 440, y1: 240, x2: 540, y2: 480, zone_type: 'queue',    color: '#FF9800' },
  { zone_id: 4, name: 'checkout',    x1: 540, y1: 0,   x2: 640, y2: 480, zone_type: 'checkout', color: '#F44336' }
];
```

#### Zone Types

| Type | Purpose | Color |
|------|---------|-------|
| entrance | Entry/exit points | Green `#4CAF50` |
| general | Main floor areas | Blue `#2196F3` |
| queue | Queue/waiting areas | Orange `#FF9800` |
| checkout | Point of sale | Red `#F44336` |

#### State Management

```javascript
const [zones, setZones] = useState(DEFAULT_ZONES);
const [selectedZone, setSelectedZone] = useState(null);      // Selected zone ID
const [dragging, setDragging] = useState(null);              // { zoneId, handle }
const [videoUrl, setVideoUrl] = useState('');
const [videoConnected, setVideoConnected] = useState(false);
const canvasRef = useRef(null);
const videoRef = useRef(null);
```

#### Interaction Model

**Selection:**
1. Click inside zone → Select that zone
2. Click outside all zones → Deselect
3. Click zone in list → Select that zone

**Moving:**
1. Select zone
2. Mouse down inside zone (not on handle)
3. Drag to new position
4. Mouse up to confirm

**Resizing:**
1. Select zone
2. Mouse down on corner handle (tl, tr, bl, br)
3. Drag handle
4. Minimum zone size: 50x50 pixels

#### Canvas Drawing Flow

1. Clear canvas
2. Draw grid background (if no video)
3. For each zone:
   - Fill rectangle with color + 20% alpha
   - Stroke rectangle (thicker if selected)
   - Draw zone name label
   - If selected: Draw 4 corner handles

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Select zone | Click zone on canvas or list | Zone highlighted, handles shown |
| Move zone | Drag selected zone | Zone position updates |
| Resize zone | Drag corner handle | Zone bounds change |
| Connect video | Enter URL + click Connect | Video overlays canvas |
| Save config | Click Save | Download zones.json |
| Reset zones | Click Reset | Restore defaults |

#### Export Format (zones.json)

```json
{
  "zones": [
    {
      "zone_id": 1,
      "name": "entrance",
      "x1": 0,
      "y1": 0,
      "x2": 200,
      "y2": 480,
      "zone_type": "entrance"
    },
    ...
  ]
}
```

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| Zone too small | Minimum 50x50 enforced |
| Zone outside canvas | Bounded to canvas edges |
| Video connection fails | Show alert, keep canvas |
| Overlapping zones | Top zone wins for selection |

#### Proposed Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Add new zone | High | Button to create new zones |
| Delete zone | High | Remove selected zone |
| Zone properties | Medium | Edit name, type, capacity inline |
| Undo/redo | Medium | Track zone changes |
| Import config | Low | Load existing zones.json |
| Snap to grid | Low | Align zones to grid |

---

### 5.6 Settings

**Route**: `#settings`
**File**: `frontend/src/pages/Settings.jsx`
**Purpose**: User preferences, system health, and test utilities

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Settings                                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  SUCCESS BANNER (conditional)                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✓ Preferences saved!                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  USER PREFERENCES CARD                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ User Preferences                                                 │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ [✓] Enable Auto-Refresh                                     │ │   │
│  │ │                                                             │ │   │
│  │ │ Refresh Interval (seconds):                                 │ │   │
│  │ │ [  10  ▼]                                                   │ │   │
│  │ │                                                             │ │   │
│  │ │ Default Time Range (hours):                                 │ │   │
│  │ │ [ 1 hour ▼]                                                 │ │   │
│  │ │                                                             │ │   │
│  │ │ [Reset to Defaults]                                         │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  SYSTEM HEALTH CARD                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ System Health                                                    │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ [Check Health]                                               │ │   │
│  │ │                                                             │ │   │
│  │ │ Status:     ●  healthy                                      │ │   │
│  │ │ Database:   ●  Connected                                    │ │   │
│  │ │ Timestamp:  2024-12-15T14:30:00Z                           │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  TEST UTILITIES CARD                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Test Utilities                                                   │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ Post Test Count:                                             │ │   │
│  │ │ [Enter count value          ] [Post Count]                   │ │   │
│  │ │                                                             │ │   │
│  │ │ Use this to manually post a count value for testing.        │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Breakdown

| Section | Purpose | Storage |
|---------|---------|---------|
| User Preferences | Dashboard behavior settings | localStorage |
| System Health | Backend connectivity check | API response |
| Test Utilities | Manual data posting | API call |

#### User Preferences

| Preference | Type | Default | Range | localStorage Key |
|------------|------|---------|-------|------------------|
| Auto-Refresh | Boolean | `true` | - | `autoRefresh` |
| Refresh Interval | Integer | `10` | 5-60 seconds | `refreshInterval` |
| Default Time Range | Float | `1` | hours | `defaultTimeRange` |

#### Time Range Options

| Label | Value (hours) |
|-------|---------------|
| 10 minutes | `0.167` |
| 30 minutes | `0.5` |
| 1 hour | `1` |
| 24 hours | `24` |
| 7 days | `168` |

#### State Management

```javascript
const [preferences, setPreferences] = useState({
  autoRefresh: localStorage.getItem('autoRefresh') !== 'false',
  refreshInterval: parseInt(localStorage.getItem('refreshInterval') || '10'),
  defaultTimeRange: parseFloat(localStorage.getItem('defaultTimeRange') || '1')
});
const [healthStatus, setHealthStatus] = useState(null);
const [testCount, setTestCount] = useState('');
const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);
```

#### API Calls

**Health Check:**
```javascript
const checkHealth = async () => {
  const status = await health();  // GET /health
  setHealthStatus(status);
};

// Response:
{
  status: "healthy",
  database: true,
  timestamp: "2024-12-15T14:30:00Z"
}
```

**Post Test Count:**
```javascript
const handleTestCount = async (value) => {
  await postCount(value);  // POST /count { count: value }
};
```

#### User Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Toggle auto-refresh | Click checkbox | Save to localStorage, show success |
| Change interval | Input number | Save to localStorage |
| Change time range | Select dropdown | Save to localStorage |
| Reset preferences | Click Reset | Restore defaults to localStorage |
| Check health | Click button | Call /health API, display status |
| Post test count | Enter value + click Post | Call /count API |

#### Success/Error Feedback

- Success messages auto-dismiss after 3 seconds
- Error messages persist until dismissed
- Health status persists until next check

#### Edge Cases

| Scenario | Handling |
|----------|----------|
| Backend offline | Health check fails, show error |
| Invalid count value | Show error "Please enter valid number" |
| localStorage unavailable | Use default values |

#### Proposed Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Theme selection | Medium | Dark/light mode toggle |
| Export all data | Low | Download full database |
| Clear all data | Medium | Wipe database (with confirm) |
| Notification settings | Medium | Configure alert thresholds |
| API key management | Low | Manage external integrations |
| User profiles | Low | Multi-user support |

---

## 6. API Specification

### Core Endpoints

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/health` | GET | Health check | - | `{status, db, timestamp}` |
| `/seed_demo` | POST | Generate demo data | - | `{ok, message}` |
| `/count` | POST | Record count | `{count, zone}` | `{ok}` |
| `/kpis` | GET | Aggregated KPIs | `?hours=N` | `{current_count, avg_count, peak_count, total_events, throughput}` |
| `/series.csv` | GET | Time series | `?hours=N` | CSV data |

### Analytics Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/dwell-time` | GET | Dwell analytics | `{avg_dwell_seconds, median_dwell_seconds, max_dwell_seconds, min_dwell_seconds, session_count}` |
| `/api/occupancy` | GET | Occupancy | `{current_occupancy, capacity, occupancy_rate, available_capacity, utilization_percentage}` |
| `/api/entries-exits` | GET | Entry/exit | `{entries, exits, net_traffic}` |
| `/api/conversion` | GET | Conversion | `{total_sessions, conversions, conversion_rate, bounce_rate, engagement_rate, non_conversions}` |
| `/api/zones` | GET | Zone data | `{zone_traffic[], zone_utilization[]}` |
| `/api/queue` | GET | Queue metrics | `{current_queue_length, avg_wait_seconds, total_queued}` |

### Video Management Endpoints

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/video/start` | POST | Start stream | `{source, url?}` | `{ok, message}` |
| `/video/upload` | POST | Upload MP4 | FormData(video) | `{ok, message}` |
| `/video/stop` | POST | Stop stream | - | `{ok}` |
| `/video/library` | GET | List videos | - | `{videos[]}` |
| `/video/library/upload` | POST | Add to library | FormData | `{ok, video}` |
| `/video/library/<id>/play` | POST | Play from library | - | `{ok}` |
| `/video/library/<id>` | DELETE | Remove from library | - | `{ok}` |

---

## 7. Database Schema

### Tables

#### `counts`
```sql
CREATE TABLE counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    count_value INTEGER NOT NULL,
    zone TEXT DEFAULT 'main'
);
```

#### `zones`
```sql
CREATE TABLE zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    x1 INTEGER, y1 INTEGER,
    x2 INTEGER, y2 INTEGER,
    zone_type TEXT DEFAULT 'general',
    capacity INTEGER DEFAULT 50
);
```

#### `events`
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,  -- 'entry', 'exit', 'zone_enter', 'zone_exit'
    zone TEXT,
    track_id INTEGER,
    metadata TEXT  -- JSON blob for extra data
);
```

#### `sessions`
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    zones_visited TEXT,  -- JSON array
    converted BOOLEAN DEFAULT FALSE
);
```

---

## 8. Future Roadmap

### Phase 1: Current State (Completed)
- 6 core pages implemented
- 26+ KPIs across all analytics
- Video library system
- Zone-based tracking

---

### Phase 2: Alerts & Notifications (Planned)

**Route**: `#alerts`
**Purpose**: Real-time threshold monitoring and notification management

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Alerts & Notifications       [+ New Alert Rule]  [🔔 3 Active]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  ACTIVE ALERTS BANNER (when triggered)                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ High Occupancy Alert: 95% capacity reached (2 min ago) [ACK] │   │
│  │ 🚨 Queue Critical: 15 people waiting > 10 min (5 min ago) [ACK] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  ALERT RULES                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Rule Name           │ Condition              │ Severity │ Status │   │
│  ├─────────────────────┼────────────────────────┼──────────┼────────┤   │
│  │ High Occupancy      │ occupancy > 80%        │ Warning  │ ● ON   │   │
│  │ Critical Occupancy  │ occupancy > 95%        │ Critical │ ● ON   │   │
│  │ Long Queue          │ queue_length > 10      │ Warning  │ ● ON   │   │
│  │ No Activity         │ count = 0 for 30min    │ Info     │ ○ OFF  │   │
│  │ Conversion Drop     │ conversion < 20%       │ Warning  │ ● ON   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  ALERT HISTORY                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Time       │ Alert            │ Value   │ Status    │ Action    │   │
│  ├────────────┼──────────────────┼─────────┼───────────┼───────────┤   │
│  │ 2:30 PM    │ High Occupancy   │ 95%     │ Resolved  │ View      │   │
│  │ 1:15 PM    │ Long Queue       │ 12      │ Ack'd     │ View      │   │
│  │ 11:00 AM   │ Critical Occ.    │ 98%     │ Resolved  │ View      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  NOTIFICATION SETTINGS                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Email Notifications: [✓] enabled    alerts@company.com          │   │
│  │ SMS Notifications:   [✓] enabled    +1 555-123-4567             │   │
│  │ Slack Webhook:       [✓] enabled    #janus-alerts               │   │
│  │ In-App Sound:        [✓] enabled                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Alert Rule Configuration

| Field | Type | Options |
|-------|------|---------|
| Name | String | User-defined |
| Metric | Select | Occupancy, Queue Length, Conversion, Dwell Time, Entries, Exits |
| Operator | Select | >, <, =, >=, <=, change% |
| Threshold | Number | Metric-specific |
| Duration | Number | Minutes before triggering |
| Severity | Select | Info, Warning, Critical |
| Cooldown | Number | Minutes between repeated alerts |

#### New API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/alerts/rules` | GET, POST | List/create alert rules |
| `/api/alerts/rules/<id>` | PUT, DELETE | Update/delete rule |
| `/api/alerts/history` | GET | Alert event history |
| `/api/alerts/acknowledge/<id>` | POST | Acknowledge alert |
| `/api/alerts/settings` | GET, PUT | Notification config |

---

### Phase 3: Historical Trends (Planned)

**Route**: `#trends`
**Purpose**: Long-term trend analysis and pattern detection

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Historical Trends                    [30d] [90d] [1y] [Custom]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  TREND SUMMARY CARDS                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Visitors    │ │ Conversion  │ │ Avg Dwell   │ │ Peak Hours  │      │
│  │ ↑ +12%      │ │ ↓ -3%       │ │ ↑ +8%       │ │ 2-4 PM      │      │
│  │ vs last mo. │ │ vs last mo. │ │ vs last mo. │ │ consistent  │      │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────────────────────┤
│  MULTI-LINE TREND CHART                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │     ^                                                           │   │
│  │ 500 │                                    ╱╲                     │   │
│  │     │         ╱╲          ╱╲            ╱  ╲                    │   │
│  │ 300 │   ╱╲   ╱  ╲   ╱╲   ╱  ╲     ╱╲   ╱    ╲                   │   │
│  │     │  ╱  ╲ ╱    ╲ ╱  ╲ ╱    ╲   ╱  ╲ ╱                         │   │
│  │ 100 │ ╱    ╲      ╲    ╲      ╲ ╱    ╲                          │   │
│  │     └───────────────────────────────────────────────> Days      │   │
│  │      Week1   Week2   Week3   Week4   Week5   Week6              │   │
│  │      ── This Period    ─ ─ Last Period                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  DAY-OF-WEEK PATTERN                     HOUR-OF-DAY PATTERN           │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐     │
│  │ M  T  W  T  F  S  S         │  │ Traffic by Hour             │     │
│  │ ██ ██ ██ ██ ██ ▓▓ ▓▓        │  │    ╱╲                       │     │
│  │ 85 92 88 94 98 65 45        │  │   ╱  ╲  ╱╲                  │     │
│  │ Busiest: Friday             │  │ ─╱    ╲╱  ╲─                │     │
│  │ Quietest: Sunday            │  │ 9am  12pm  3pm  6pm        │     │
│  └─────────────────────────────┘  └─────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────────┤
│  SEASONAL INSIGHTS (AI-generated)                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📈 Traffic increasing steadily (+3% week-over-week)             │   │
│  │ 📅 Friday peak: 18% higher than weekday average                 │   │
│  │ ⏰ Lunch rush (12-1 PM) accounts for 22% of daily traffic       │   │
│  │ 📉 Weekend traffic 35% lower than weekdays                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Trend Calculations

| Metric | Calculation |
|--------|-------------|
| Period-over-Period Change | `((current - previous) / previous) * 100` |
| Day-of-Week Index | Average by day across all weeks |
| Hour-of-Day Index | Average by hour across all days |
| Seasonal Trend | Linear regression slope |
| Anomaly Detection | Standard deviation from mean |

#### New API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trends/summary` | GET | Period comparison stats |
| `/api/trends/series` | GET | Long-term time series |
| `/api/trends/patterns/dow` | GET | Day-of-week patterns |
| `/api/trends/patterns/hod` | GET | Hour-of-day patterns |
| `/api/trends/insights` | GET | AI-generated insights |

---

### Phase 4: Export Center (Planned)

**Route**: `#export`
**Purpose**: Report generation and scheduled exports

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Export Center                           [+ Schedule Report]      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  QUICK EXPORT                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Report Type: [Daily Summary ▼]                                   │   │
│  │ Date Range:  [12/01/2024] to [12/15/2024]                       │   │
│  │ Format:      [PDF ▼]   Include Charts: [✓]                      │   │
│  │                                                                   │   │
│  │              [📥 Generate & Download]                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  REPORT TEMPLATES                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Template       │ Contents                        │ Actions       │   │
│  ├────────────────┼─────────────────────────────────┼───────────────┤   │
│  │ Daily Summary  │ KPIs, Traffic Chart, Top Hours  │ [Use] [Edit]  │   │
│  │ Weekly Report  │ Trends, Zone Analysis, Funnel   │ [Use] [Edit]  │   │
│  │ Monthly Review │ Full Analytics, Comparisons     │ [Use] [Edit]  │   │
│  │ Executive      │ Key Metrics, Insights Only      │ [Use] [Edit]  │   │
│  │ Custom         │ User-defined sections           │ [Use] [Edit]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  SCHEDULED EXPORTS                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Schedule    │ Report         │ Recipients       │ Next Run      │   │
│  ├─────────────┼────────────────┼──────────────────┼───────────────┤   │
│  │ Daily 8am   │ Daily Summary  │ team@co.com      │ Tomorrow 8am  │   │
│  │ Mon 9am     │ Weekly Report  │ manager@co.com   │ Mon 12/18     │   │
│  │ 1st of Mo.  │ Monthly Review │ exec@co.com      │ Jan 1, 2025   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  EXPORT HISTORY                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Date        │ Report         │ Format │ Size    │ Download      │   │
│  ├─────────────┼────────────────┼────────┼─────────┼───────────────┤   │
│  │ Dec 14      │ Daily Summary  │ PDF    │ 2.4 MB  │ [📥]          │   │
│  │ Dec 13      │ Daily Summary  │ PDF    │ 2.1 MB  │ [📥]          │   │
│  │ Dec 11      │ Weekly Report  │ Excel  │ 4.8 MB  │ [📥]          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Export Formats

| Format | Contents | Use Case |
|--------|----------|----------|
| PDF | Charts + Tables + Branding | Executive sharing |
| Excel (.xlsx) | Raw data + Pivot tables | Data analysis |
| CSV | Raw data only | System integration |
| JSON | API-style data | Developer use |

#### Report Template Sections

| Section | Description | Data Source |
|---------|-------------|-------------|
| KPI Summary | Top 10 metrics with trends | `/kpis` |
| Traffic Chart | Line/area chart of counts | `/series.csv` |
| Zone Analysis | Heat colors + stats | `/api/zones` |
| Dwell Analysis | Distribution + averages | `/api/dwell-time` |
| Conversion Funnel | Entry → Engage → Convert | `/api/conversion` |
| Top Hours | Busiest periods ranked | Computed |
| Insights | AI-generated observations | Rule-based |

#### New API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/export/generate` | POST | Generate report |
| `/api/export/templates` | GET, POST | Manage templates |
| `/api/export/schedules` | GET, POST, DELETE | Scheduled exports |
| `/api/export/history` | GET | Past exports |

---

### Phase 5: Camera/Source Manager (Planned)

**Route**: `#cameras`
**Purpose**: Multi-camera configuration and health monitoring

#### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Camera/Source Manager         [+ Add Camera]  [🔄 Refresh All]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  CAMERA GRID                                                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐             │
│  │ Camera 1: Entrance      │  │ Camera 2: Main Floor    │             │
│  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │             │
│  │ │     [Live Feed]     │ │  │ │     [Live Feed]     │ │             │
│  │ │    Thumbnail        │ │  │ │    Thumbnail        │ │             │
│  │ └─────────────────────┘ │  │ └─────────────────────┘ │             │
│  │ Status: ● Online        │  │ Status: ● Online        │             │
│  │ FPS: 24  | Latency: 45ms│  │ FPS: 30  | Latency: 32ms│             │
│  │ [Configure] [Disable]   │  │ [Configure] [Disable]   │             │
│  └─────────────────────────┘  └─────────────────────────┘             │
│                                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────────┐             │
│  │ Camera 3: Checkout      │  │ Camera 4: Back Office   │             │
│  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │             │
│  │ │     [Live Feed]     │ │  │ │   ⚠️ OFFLINE       │ │             │
│  │ │    Thumbnail        │ │  │ │   Last seen: 2h ago │ │             │
│  │ └─────────────────────┘ │  │ └─────────────────────┘ │             │
│  │ Status: ● Online        │  │ Status: ○ Offline       │             │
│  │ FPS: 28  | Latency: 38ms│  │ [Reconnect] [Remove]    │             │
│  │ [Configure] [Disable]   │  │                         │             │
│  └─────────────────────────┘  └─────────────────────────┘             │
├─────────────────────────────────────────────────────────────────────────┤
│  SYSTEM STATUS                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Total Cameras: 4    │  Online: 3  │  Offline: 1  │  Uptime: 99.2% │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  CAMERA CONFIGURATION (Modal when Configure clicked)                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Name:       [Entrance Camera                                   ] │   │
│  │ Source:     ○ RTSP  ○ HTTP  ○ File  ○ YouTube                   │   │
│  │ URL:        [rtsp://192.168.1.100:554/stream1                 ] │   │
│  │ Resolution: [1280x720 ▼]                                        │   │
│  │ Zone Map:   [entrance ▼]    ← Which zone this camera covers     │   │
│  │ Failover:   [Camera 2 ▼]    ← Backup if this camera goes down   │   │
│  │ Recording:  [✓] Save to disk    Retention: [7 days ▼]           │   │
│  │                                                                   │   │
│  │                        [Save]  [Cancel]                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Camera Source Types

| Type | URL Format | Use Case |
|------|------------|----------|
| RTSP | `rtsp://ip:port/path` | IP cameras |
| HTTP | `http://ip:port/stream` | Web cameras |
| File | Local path | Demo/testing |
| YouTube | YouTube URL | Remote demos |
| USB | Device index (0, 1, 2) | Webcams |

#### Camera Health Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| Status | Online/Offline | Binary |
| FPS | Frames per second | < 15 = warning |
| Latency | Stream delay | > 100ms = warning |
| Packet Loss | % dropped frames | > 5% = warning |
| Last Seen | Time since last frame | > 30s = offline |

#### New API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cameras` | GET, POST | List/add cameras |
| `/api/cameras/<id>` | GET, PUT, DELETE | Manage camera |
| `/api/cameras/<id>/health` | GET | Camera health stats |
| `/api/cameras/<id>/reconnect` | POST | Force reconnect |
| `/api/cameras/<id>/stream` | GET | Live stream URL |

#### Failover Logic

```
1. Primary camera goes offline (no frames for 30s)
2. System logs alert
3. If failover configured:
   - Switch tracking to backup camera
   - Notify via alerts system
4. When primary comes back:
   - Optional: Auto-switch back
   - Or: Keep using backup until manual switch
```

---

## 9. Advanced KPI Research

This section provides a comprehensive catalog of all possible KPIs for people tracking analytics, organized by category with implementation complexity ratings and data requirements.

### 9.1 Traffic KPIs

#### Primary Traffic Metrics

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Total Visitors** | Unique people detected in time period | `COUNT(DISTINCT track_id)` | Low | Detection events |
| **Hourly Footfall** | People count per hour | `COUNT(*) GROUP BY hour` | Low | Detection events |
| **Daily Footfall** | People count per day | `COUNT(*) GROUP BY date` | Low | Detection events |
| **Peak Hour** | Hour with highest traffic | `MAX(hourly_count)` | Low | Hourly aggregates |
| **Entry Rate** | People entering per minute | `entrance_count / minutes` | Low | Zone events |
| **Exit Rate** | People exiting per minute | `exit_count / minutes` | Low | Zone events |
| **Net Flow** | Entries minus exits | `entries - exits` | Low | Zone events |

#### Advanced Traffic Metrics

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Traffic Velocity** | Speed of traffic flow change | `Δcount / Δtime` | Medium | Time-series counts |
| **Arrival Pattern** | Distribution of arrival times | Statistical distribution | Medium | Entry timestamps |
| **Traffic Correlation** | Zone-to-zone traffic relationship | Pearson correlation | High | Multi-zone counts |
| **Seasonality Index** | Day-of-week/hour patterns | Time series decomposition | High | Historical data |
| **Anomaly Score** | Deviation from expected traffic | `(actual - expected) / σ` | High | ML model |

### 9.2 Occupancy KPIs

#### Real-Time Occupancy

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Current Occupancy** | People currently in space | `entries - exits` | Low | Zone tracking |
| **Occupancy Rate** | Percentage of capacity used | `current / capacity × 100` | Low | Capacity config |
| **Zone Occupancy** | People per zone | `COUNT(*) per zone` | Low | Zone events |
| **Occupancy Trend** | Direction of occupancy change | `slope(occupancy, time)` | Medium | Time-series |
| **Max Occupancy** | Peak occupancy in period | `MAX(occupancy)` | Low | Occupancy history |
| **Min Occupancy** | Lowest occupancy in period | `MIN(occupancy)` | Low | Occupancy history |
| **Avg Occupancy** | Average occupancy in period | `AVG(occupancy)` | Low | Occupancy history |

#### Capacity Management

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Capacity Utilization** | How much capacity is used over time | `AVG(occupancy_rate)` | Medium | Continuous tracking |
| **Time Over Threshold** | Minutes above target occupancy | `SUM(minutes WHERE occ > threshold)` | Medium | Threshold config |
| **Capacity Breach Count** | Times capacity exceeded | `COUNT(events WHERE occ > capacity)` | Medium | Capacity config |
| **Safety Margin** | Buffer to capacity | `capacity - current` | Low | Capacity config |
| **Projected Peak** | Predicted max occupancy | ML regression | High | Historical patterns |

### 9.3 Dwell Time KPIs

#### Basic Dwell Metrics

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Avg Dwell Time** | Average time spent in zone | `AVG(exit_time - entry_time)` | Medium | Entry/exit events |
| **Max Dwell Time** | Longest time in zone | `MAX(dwell_time)` | Medium | Dwell calculations |
| **Min Dwell Time** | Shortest time in zone | `MIN(dwell_time)` | Medium | Dwell calculations |
| **Dwell Distribution** | Histogram of dwell times | Bucketed counts | Medium | Dwell calculations |
| **Total Dwell Hours** | Sum of all dwell time | `SUM(dwell_time)` | Medium | Dwell calculations |

#### Engagement Metrics

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Engagement Score** | Weighted dwell × zone importance | `dwell × zone_weight` | Medium | Zone config |
| **Bounce Rate** | % with dwell < threshold | `short_dwells / total × 100` | Medium | Threshold config |
| **Deep Engagement** | % with dwell > long threshold | `long_dwells / total × 100` | Medium | Threshold config |
| **Dwell Velocity** | Rate of dwell time change | `Δavg_dwell / Δtime` | High | Time-series |
| **Engagement Funnel** | Dwell time by journey stage | Multi-zone analysis | High | Path tracking |

### 9.4 Conversion & Journey KPIs

#### Conversion Metrics

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Zone Conversion** | % entering checkout from entrance | `checkout_visitors / entrance_visitors × 100` | Medium | Zone tracking |
| **Funnel Completion** | % completing full path | `full_path_visitors / total × 100` | High | Path tracking |
| **Drop-off Rate** | % not reaching next zone | `(zone1 - zone2) / zone1 × 100` | Medium | Zone sequence |
| **Conversion Time** | Avg time from entry to conversion | `AVG(conversion_time - entry_time)` | Medium | Event timestamps |
| **Assisted Conversion** | Conversions with queue visit | Multi-zone path analysis | High | Path tracking |

#### Journey Analytics

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Path Frequency** | Most common zone sequences | `COUNT(*) GROUP BY path` | High | Path reconstruction |
| **Journey Length** | Avg zones visited per person | `AVG(zones_visited)` | High | Path tracking |
| **Loop Detection** | People revisiting zones | Zone re-entry count | High | Path tracking |
| **Exit Point Analysis** | Where people leave from | `COUNT(*) GROUP BY last_zone` | Medium | Exit zone tracking |
| **Journey Duration** | Total time in premises | `exit_time - entry_time` | Medium | First/last detection |

### 9.5 Queue KPIs

#### Queue Metrics

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Current Queue Length** | People in queue zone | Zone occupancy | Low | Zone tracking |
| **Avg Queue Time** | Average wait in queue | `AVG(queue_dwell)` | Medium | Queue zone dwell |
| **Max Queue Time** | Longest wait recorded | `MAX(queue_dwell)` | Medium | Queue zone dwell |
| **Queue Abandonment** | % leaving queue without checkout | `(queue_entries - checkouts) / queue_entries × 100` | High | Path tracking |
| **Service Rate** | People processed per hour | `checkouts / hours` | Medium | Checkout events |

#### Queue Performance

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Queue Efficiency** | Service rate vs queue length | `service_rate / avg_queue` | Medium | Combined metrics |
| **Wait Time SLA** | % within target wait time | `within_target / total × 100` | Medium | SLA config |
| **Peak Queue Length** | Maximum queue size | `MAX(queue_occupancy)` | Low | Queue tracking |
| **Queue Build Rate** | How fast queue grows | `Δqueue_length / Δtime` | Medium | Time-series |
| **Estimated Wait** | Predicted wait for new arrival | `queue_length / service_rate` | Medium | Real-time calc |

### 9.6 Zone Performance KPIs

#### Zone Utilization

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Zone Popularity** | Ranking by visitor count | Ranked visitor counts | Low | Zone events |
| **Zone Utilization** | % of time zone is occupied | `occupied_minutes / total_minutes × 100` | Medium | Continuous tracking |
| **Density Index** | People per square meter | `occupancy / zone_area` | Low | Zone config |
| **Hotspot Score** | Heat intensity ranking | Weighted occupancy × dwell | Medium | Combined metrics |
| **Dead Zone Detection** | Zones with low traffic | Below threshold detection | Medium | Traffic baseline |

#### Zone Comparison

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Zone Performance Index** | Composite zone score | Weighted multi-KPI | High | Multiple metrics |
| **Cross-Zone Flow** | Movement between zones | Transition matrix | High | Path tracking |
| **Zone Affinity** | Zones visited together | Co-occurrence analysis | High | Path tracking |
| **Relative Performance** | Zone vs average | `zone_metric / avg_metric` | Medium | Baseline calc |
| **Zone ROI** | Value per square meter | Business metric / area | High | External data |

### 9.7 Trend & Predictive KPIs

#### Historical Trends

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Week-over-Week Growth** | % change from last week | `(this_week - last_week) / last_week × 100` | Low | Weekly aggregates |
| **Month-over-Month Growth** | % change from last month | `(this_month - last_month) / last_month × 100` | Low | Monthly aggregates |
| **Year-over-Year Growth** | % change from last year | `(this_year - last_year) / last_year × 100` | Low | Yearly aggregates |
| **Moving Average** | Smoothed trend line | `AVG(last_N_periods)` | Low | Historical data |
| **Trend Direction** | Up/down/stable | Slope analysis | Medium | Time-series |

#### Predictive Analytics

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Traffic Forecast** | Predicted traffic next hour/day | ML time-series | High | Historical patterns |
| **Peak Prediction** | When next peak will occur | Pattern recognition | High | Historical patterns |
| **Capacity Warning** | Time until capacity breach | Extrapolation | High | Real-time + forecast |
| **Staffing Recommendation** | Suggested staff levels | Traffic forecast × ratio | High | Staffing model |
| **Revenue Correlation** | Traffic to revenue relationship | Correlation analysis | High | External data |

### 9.8 Operational KPIs

#### System Health

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Detection Confidence** | Avg YOLO confidence score | `AVG(confidence)` | Low | Detection metadata |
| **Tracking Accuracy** | Track continuity score | Lost tracks / total | Medium | Track lifecycle |
| **Frame Rate** | Processing FPS | `frames / seconds` | Low | System metrics |
| **Latency** | Detection to display time | `display_time - frame_time` | Low | System metrics |
| **Uptime** | System availability | `running_time / total_time × 100` | Low | Health checks |

#### Data Quality

| KPI | Description | Formula | Complexity | Data Required |
|-----|-------------|---------|------------|---------------|
| **Data Completeness** | % of expected data received | `actual / expected × 100` | Medium | Expected counts |
| **Anomaly Rate** | % of outlier readings | Outlier detection | Medium | Statistical analysis |
| **Gap Detection** | Missing data periods | Gap analysis | Medium | Timestamp analysis |
| **Calibration Score** | Zone accuracy rating | Manual validation | High | Ground truth |

### 9.9 KPI Implementation Priority Matrix

#### Phase 1 - Core (Implemented)

| KPI | Priority | Status | Notes |
|-----|----------|--------|-------|
| Current Count | Critical | ✅ Done | Real-time display |
| Total Visitors | Critical | ✅ Done | Daily/hourly aggregates |
| Zone Occupancy | Critical | ✅ Done | Per-zone tracking |
| Avg Dwell Time | High | ✅ Done | Basic calculation |
| Peak Hour | High | ✅ Done | Reports page |

#### Phase 2 - Enhanced (Planned)

| KPI | Priority | Status | Notes |
|-----|----------|--------|-------|
| Conversion Rate | High | 📋 Planned | Requires path tracking |
| Queue Time | High | 📋 Planned | Queue zone config |
| Traffic Forecast | Medium | 📋 Planned | ML model needed |
| Journey Analysis | Medium | 📋 Planned | Path reconstruction |
| Trend Analysis | Medium | 📋 Planned | Historical comparison |

#### Phase 3 - Advanced (Future)

| KPI | Priority | Status | Notes |
|-----|----------|--------|-------|
| Anomaly Detection | Medium | 🔮 Future | ML model |
| Predictive Staffing | Low | 🔮 Future | External integration |
| Revenue Correlation | Low | 🔮 Future | POS integration |
| Behavior Clustering | Low | 🔮 Future | Advanced ML |
| A/B Testing Support | Low | 🔮 Future | Experiment framework |

### 9.10 KPI Data Requirements Summary

#### Database Schema Extensions

```sql
-- Additional tables for advanced KPIs

-- Path tracking
CREATE TABLE paths (
    path_id INTEGER PRIMARY KEY,
    track_id INTEGER,
    zone_sequence TEXT,  -- JSON array of zone_ids
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    total_dwell REAL
);

-- Predictions cache
CREATE TABLE predictions (
    prediction_id INTEGER PRIMARY KEY,
    metric_type TEXT,
    predicted_time TIMESTAMP,
    predicted_value REAL,
    confidence REAL,
    created_at TIMESTAMP
);

-- Anomalies log
CREATE TABLE anomalies (
    anomaly_id INTEGER PRIMARY KEY,
    metric_type TEXT,
    detected_at TIMESTAMP,
    expected_value REAL,
    actual_value REAL,
    severity TEXT
);
```

#### API Endpoint Requirements

| Endpoint | KPIs Served | Status |
|----------|-------------|--------|
| `/api/counts` | Current count, Total visitors | ✅ Exists |
| `/api/zones` | Zone occupancy, Density | ✅ Exists |
| `/api/history` | Trends, Aggregates | ✅ Exists |
| `/api/dwell` | Dwell metrics | ✅ Exists |
| `/api/paths` | Journey KPIs | 📋 Planned |
| `/api/predictions` | Forecast KPIs | 📋 Planned |
| `/api/anomalies` | Anomaly KPIs | 🔮 Future |

---

## Appendices

### A. Mockup Files

| Page | File | Status |
|------|------|--------|
| Live Monitor | `mockups/live-monitor.html` | Complete |
| Analytics | `mockups/analytics.html` | Complete |
| Reports | `mockups/reports.html` | Complete |
| Heatmap | `mockups/heatmap.html` | Complete |
| Zone Config | `mockups/zone-config.html` | Complete |
| Settings | `mockups/settings.html` | Complete |

### B. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial PRD with Live Monitor documentation |
| 1.1 | Dec 2024 | Added Analytics page documentation |
| 1.2 | Dec 2024 | Added Reports, Heatmap, Zone Config, Settings documentation |
| 1.3 | Dec 2024 | Added Future Pages specifications (Alerts, Trends, Export, Cameras) |
| 1.4 | Dec 2024 | Added comprehensive KPI research catalog |

### C. Glossary

| Term | Definition |
|------|------------|
| **Dwell Time** | Duration a person spends in a specific zone |
| **Footfall** | Total count of people entering a space |
| **Heatmap** | Visual representation of zone intensity based on occupancy |
| **Track ID** | Unique identifier assigned to a detected person by ByteTrack |
| **Zone** | Defined area within the camera view for analytics segmentation |
| **Conversion** | A person completing a desired action (e.g., reaching checkout) |
| **Bounce Rate** | Percentage of visitors with very short dwell times |
| **Path** | Sequence of zones visited by a single person |
| **SLA** | Service Level Agreement - target performance metrics |

---

*Generated by Claude Code for Project Janus*
