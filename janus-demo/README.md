# Project Janus - People Counting Analytics Platform

**Real-time people tracking and analytics for physical spaces**

![Version](https://img.shields.io/badge/version-2.0-blue)
![Status](https://img.shields.io/badge/status-production--ready-green)

---

## Overview

**Janus** is a real-time people tracking and analytics platform designed for retail stores, venues, and any physical space where understanding visitor behavior is critical. Named after the Roman god of doorways and transitions, Janus monitors entries, exits, dwell times, and zone-specific activity to provide actionable insights.

### Key Features

- **Real-Time Visibility** - See exactly how many people are in your space right now
- **Zone Intelligence** - Understand which areas get the most traffic
- **Behavioral Analytics** - Track dwell times, conversion funnels, and engagement
- **Operational Insights** - Optimize staffing, identify bottlenecks, reduce wait times
- **Visual Verification** - Live video feed with AI-powered person tracking
- **Dual Dashboard Themes** - Choose between dark cyber or warm organic aesthetics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │            REACT FRONTEND (V1 or V2)                        │   │
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
│         SQLite Database + REST API Endpoints                      │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                EDGE AGENT (Port 8001)                             │
│         YOLO v8 Detection + ByteTrack + MJPEG Stream              │
│         Supports: Webcam, MP4 Files, YouTube Streams              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Dashboard Versions

Janus includes **two distinct dashboard implementations** with the same functionality but different aesthetics:

### Frontend V1 - Dark Cyber Theme
**Port:** 3001

A modern, dark-theme-first design inspired by Vercel Analytics and Linear:
- Deep navy and charcoal backgrounds
- Cyan and violet accent glows
- Monospace typography for data
- Smooth micro-animations

```bash
cd janus-demo/frontend-v1
npm install
npm run dev
# Open http://localhost:3001
```

### Frontend V2 - Warm Atelier Theme
**Port:** 3002

A warm, organic aesthetic inspired by Japanese minimalism:
- Cream and sand backgrounds
- Terracotta and sage accent colors
- Elegant serif headings (Cormorant Garamond)
- Soft shadows and paper textures

```bash
cd janus-demo/frontend-v2
npm install
npm run dev
# Open http://localhost:3002
```

---

## Dashboard Tabs

Both dashboard versions include these fully-functional tabs:

### 1. Live Monitor
- Real-time people counting visualization
- Animated humanoid tracking demo
- KPI cards (current count, entries, exits, peak, dwell time)
- Alert notifications panel
- Zone occupancy display

### 2. Analytics
- 12+ KPI cards with trend indicators
- Traffic trends (area/line charts)
- Zone performance radar chart
- Dwell time distribution (pie chart)
- Conversion funnel visualization
- Entries vs Exits comparison
- Time range selector (1H, 6H, 24H, 7D, 30D)

### 3. Reports
- Report type selector (Daily, Weekly, Monthly, Custom)
- Date range picker with quick selections
- 30-day summary table
- Export to CSV and PDF
- Scheduled reports management

### 4. Heatmap
- Canvas-based zone intensity visualization
- Color gradient legend
- Time-lapse playback controls
- Zone statistics sidebar
- Click-to-select zone details

### 5. Zone Config
- Visual drag-and-drop zone editor
- Resize handles for zone boundaries
- Capacity settings per zone
- Color customization
- Lock/unlock, show/hide, duplicate zones

### 6. Settings
- Theme toggle (dark/light)
- Alert threshold configuration
- API connection settings
- Notification preferences (email, push, SMS)
- Data retention policies
- Keyboard shortcuts reference

---

## Shared Components

The `shared/` directory contains components and utilities used by both dashboards:

### Mock Data Generator (`mockData.js`)
30-day realistic data with easy removal:

```javascript
import { MOCK_DATA_ENABLED } from '@shared/mockData'

// Set to false to disable mock data
export const MOCK_DATA_ENABLED = true

// Available generators:
generateKPIs(count)           // KPI metrics
generateTimeSeriesData(hours) // Traffic time series
generateZoneData()            // Zone performance
generateDwellTimeData()       // Dwell distribution
generateConversionData()      // Funnel stages
generateEntriesExitsData(days)// Daily entries/exits
generateAlerts()              // Alert notifications
generateDailySummary(days)    // Daily summary table
```

### Humanoid Tracking Demo (`HumanoidTrackingDemo.jsx`)
Animated visualization of people tracking:

```jsx
import HumanoidTrackingDemo from '@shared/HumanoidTrackingDemo'

<HumanoidTrackingDemo
  onMetricsUpdate={(metrics) => {
    // metrics: { currentCount, totalEntries, totalExits, peakCount, avgDwellTime, zoneCounts }
  }}
/>
```

Features:
- Canvas-based stick figure animation
- Zone boundary visualization
- Real-time metrics capture
- Play/Pause/Reset controls
- Speed adjustment slider
- Toggle options for trails, labels, bounding boxes

---

## Quick Start

### 1. Start the Backend
```bash
cd janus-demo/backend
python main.py
# Backend running on http://localhost:8000
```

### 2. Seed Demo Data
```bash
curl -X POST http://localhost:8000/seed_demo
```

### 3. Start a Dashboard
```bash
# Option A: Dark Cyber Theme
cd janus-demo/frontend-v1
npm install && npm run dev
# Open http://localhost:3001

# Option B: Warm Atelier Theme
cd janus-demo/frontend-v2
npm install && npm run dev
# Open http://localhost:3002
```

### 4. (Optional) Start Edge Agent
```bash
cd janus-demo/edge_agent
python edge_agent.py
# MJPEG stream on http://localhost:8001/video_feed
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health probe |
| `/seed_demo` | POST | Seed 14 days of demo data |
| `/count` | POST | Record a count event |
| `/kpis?hours=<window>` | GET | KPIs for time window |
| `/series.csv?hours=<window>` | GET | CSV export |

### Time Format Support
| Format | Example | Meaning |
|--------|---------|---------|
| Minutes | `10m` | 10 minutes |
| Hours | `24h` | 24 hours |
| Days | `7d` | 7 days |
| Decimal | `0.167` | 10 minutes (decimal hours) |

---

## Keyboard Shortcuts

Both dashboards support these shortcuts:

| Keys | Action |
|------|--------|
| `Ctrl + 1` | Live Monitor |
| `Ctrl + 2` | Analytics |
| `Ctrl + 3` | Reports |
| `Ctrl + 4` | Heatmap |
| `Ctrl + 5` | Zone Config |
| `Ctrl + 6` | Settings |
| `Ctrl + D` | Toggle Theme |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Vite + Recharts + Framer Motion |
| Backend | Flask + SQLite |
| Edge Agent | Python + YOLO v8 + ByteTrack |
| Video Processing | OpenCV + yt-dlp |
| Streaming | MJPEG over HTTP |

### Frontend Dependencies
- `react` / `react-dom` - UI framework
- `recharts` - Data visualization
- `framer-motion` - Animations
- `lucide-react` - Icons
- `date-fns` - Date utilities
- `clsx` - Class names utility

---

## Project Structure

```
janus-demo/
├── backend/           # Flask API server
│   ├── main.py        # API endpoints
│   └── janus.db       # SQLite database
├── edge_agent/        # Video processing agent
│   ├── edge_agent.py  # People detection
│   └── video_streamer.py
├── frontend/          # Original frontend (legacy)
├── frontend-v1/       # Dark Cyber Dashboard
│   ├── src/
│   │   ├── pages/     # Tab components
│   │   ├── context/   # Theme & Toast providers
│   │   └── styles/    # CSS
│   └── package.json
├── frontend-v2/       # Warm Atelier Dashboard
│   ├── src/
│   │   ├── pages/     # Tab components
│   │   ├── context/   # Theme & Toast providers
│   │   └── styles/    # CSS
│   └── package.json
├── shared/            # Shared components
│   ├── mockData.js    # Mock data generators
│   ├── HumanoidTrackingDemo.jsx
│   └── theme.js       # Theme system
├── docs/              # Documentation
│   ├── PRD.md         # Product Requirements
│   └── mockups/       # Design mockups
└── README.md          # This file
```

---

## Removing Mock Data

To switch from mock data to real API:

1. In `shared/mockData.js`, set:
   ```javascript
   export const MOCK_DATA_ENABLED = false
   ```

2. Update API calls in pages to fetch from backend:
   ```javascript
   // Instead of:
   const data = generateTimeSeriesData(24)

   // Use:
   const response = await fetch('/kpis?hours=24h')
   const data = await response.json()
   ```

---

## Development

### Running Both Dashboards
```bash
# Terminal 1: Backend
cd janus-demo/backend && python main.py

# Terminal 2: Frontend V1
cd janus-demo/frontend-v1 && npm run dev

# Terminal 3: Frontend V2
cd janus-demo/frontend-v2 && npm run dev
```

### Building for Production
```bash
cd janus-demo/frontend-v1
npm run build
# Output in dist/

cd janus-demo/frontend-v2
npm run build
# Output in dist/
```

---

## Troubleshooting

**No data in 10m window?**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"count_value":42}' http://localhost:8000/count
```

**Database schema conflicts?**
```bash
rm -f janus-demo/backend/janus.db
curl -X POST http://localhost:8000/seed_demo
```

**Port already in use?**
```bash
# Kill process on port
npx kill-port 3001
npx kill-port 3002
```

---

## License

MIT License - See LICENSE file for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with React, Flask, and YOLO v8**
