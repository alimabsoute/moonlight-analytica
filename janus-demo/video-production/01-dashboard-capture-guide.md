# Dashboard Capture Guide — Day 1

## Pre-Capture Setup

### 1. Start the Backend with Demo Data
```bash
cd C:\Users\alima\janus-demo\backend
python seed_two_weeks.py          # Seed 14 days of realistic demo data
python main.py                     # Start Flask on :5000
```

### 2. Start the Frontend
```bash
cd C:\Users\alima\janus-demo\frontend
npm run dev                        # Vite on :5173
```

### 3. Recording Software Settings
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 60 FPS
- **Format**: MP4 (H.264)
- **Theme**: Dark mode (Settings > Theme > Dark)
- **Browser**: Chrome, full-screen (F11), no bookmarks bar
- **Zoom**: 100% (Ctrl+0 to reset)
- **Tool**: OBS Studio recommended (or any screen recorder)

### 4. Pre-Recording Checklist
- [ ] Backend running, seeded data confirmed
- [ ] Frontend loaded, dark theme active
- [ ] Browser full-screen, no distractions
- [ ] Recording software configured at 1080p 60fps
- [ ] Notifications silenced (Focus Assist on Windows)
- [ ] Mouse cursor visible but not distracting

---

## Session 1 — Live Monitor (~10 minutes)

**Navigate to**: Live Monitor tab (`/#live`)

### Shots to Capture (in order):

**Shot 1.1 — Hero Stat Cards (30s)**
- Hold on the KPI cards at top: Current Count, Total Entries, Total Exits, Peak, Average Dwell
- Let the numbers pulse/update naturally (auto-refresh every 2s)
- Don't move the mouse — just let it breathe

**Shot 1.2 — MJPEG Video Feed with Bounding Boxes (60s)**
- Click "Procedural Demo" or connect to a live video source
- Show the video feed with YOLO bounding boxes on detected people
- Track IDs visible as colored rectangles with `#ID` labels
- Let it run for a full minute to capture varied detections

**Shot 1.3 — Model Switching (20s)**
- Open the Model dropdown
- Switch from `yolov8n` to `yolo11n` — pause briefly on each
- Show the dropdown closing and detection continuing

**Shot 1.4 — Tracker Switching (20s)**
- Open the Tracker dropdown
- Switch from `bytetrack` to `botsort`
- Show the change taking effect

**Shot 1.5 — Count Over Time Chart (30s)**
- Scroll down to the area chart showing count over time
- Let it update for a few cycles
- Hover over a data point to show the tooltip

**Shot 1.6 — Procedural Demo / 3D Tracking View (60s)**
- Switch to Procedural Demo mode
- Click into the 3D Tracking View
- Show isometric view with animated people walking through zones
- Let it run with full zone occupancy indicators visible

**Shot 1.7 — 2D Humanoid Demo (30s)**
- Switch to 2D Humanoid Demo view
- Show abstract bounding boxes with no facial features
- Important: This demonstrates privacy-first tracking

**Shot 1.8 — Time Range Changes (30s)**
- Click through time ranges: 1h → 6h → 24h → 7d → 30d
- Pause 3-4 seconds on each to show data updating
- Return to 24h

---

## Session 2 — Analytics Dashboard (~10 minutes)

**Navigate to**: Analytics tab (`/#analytics`)

### Shots to Capture:

**Shot 2.1 — Full KPI Grid (45s)**
- Slowly scroll through the full KPI card grid
- 12+ cards visible: Avg Occupancy, Peak Occupancy, Total Throughput, Avg Dwell, Conversion Rate, Bounce Rate, Engagement Rate, Queue Length, etc.
- Each card has a trend arrow (up/down) and sparkline
- 5-column layout on desktop

**Shot 2.2 — Time Range Cycling (30s)**
- Click through: 1h → 6h → 24h → 7d → 30d
- Watch KPI values shift with each range
- Pause on 24h for the "money shot"

**Shot 2.3 — Zone Traffic Bar Chart (20s)**
- Show the bar chart comparing traffic across zones
- Hover over a bar for tooltip data

**Shot 2.4 — Zone Utilization Radar Chart (20s)**
- Show the radar/spider chart with zone utilization percentages
- All 4 zones visible: Entrance, Main Floor, Checkout, Queue

**Shot 2.5 — Dwell Time Pie Chart (20s)**
- Show the 5-bucket pie chart:
  - <1 min, 1-5 min, 5-15 min, 15-30 min, 30+ min
- Hover over a slice for percentage

**Shot 2.6 — Conversion Funnel (30s)**
- Show the funnel visualization: Visitors → Engaged → Converted
- Numbers decreasing down the funnel
- Conversion rate percentage visible

**Shot 2.7 — Traffic Comparison Dual-Line Chart (20s)**
- Show the entry vs. exit lines over time
- Hover to show crossover points

**Shot 2.8 — Automated Insight Cards (30s)**
- Scroll to the insight cards section
- Show warning cards (orange) and success cards (green)
- Example: "Peak occupancy exceeded 80% capacity at 3:15 PM"
- Example: "Conversion rate improved 12% vs. last week"

**Shot 2.9 — CSV Export (10s)**
- Click the CSV export button
- Show the download starting

---

## Session 3 — Heatmap View (~5 minutes)

**Navigate to**: Heatmap tab (`/#heatmap`)

### Shots to Capture:

**Shot 3.1 — Full Heatmap (30s)**
- Show the canvas-rendered heatmap
- Color gradient: blue (low) → yellow (medium) → red (high)
- All zones visible with color-coded intensity

**Shot 3.2 — Zone Statistics Sidebar (20s)**
- Show the sidebar with per-zone stats
- Traffic count, percentage of total, utilization

**Shot 3.3 — Time Range Changes (30s)**
- Switch time ranges to show how hot zones shift
- 1h view (current state) vs. 24h (daily pattern) vs. 7d (weekly pattern)
- Pause on each to show color changes

**Shot 3.4 — Zone Click Details (20s)**
- Click on a specific zone
- Show the detailed popup/panel with zone-specific metrics

---

## Session 4 — Zone Configuration (~5 minutes)

**Navigate to**: Zone Config tab (`/#zones`)

### Shots to Capture:

**Shot 4.1 — Default Zone Layout (20s)**
- Show 4 default zones on the dark grid
- Colors: green (entrance), blue (main floor), orange (checkout), red (queue)
- Zone labels and capacity indicators visible

**Shot 4.2 — Click and Select a Zone (15s)**
- Click on a zone to select it
- Show the selection highlight and edit handles

**Shot 4.3 — Drag and Resize (20s)**
- Drag a zone to reposition it
- Use resize handles to change dimensions
- Show smooth drag interaction

**Shot 4.4 — Edit Zone Properties (20s)**
- Open zone properties panel
- Show name, type, capacity fields
- Change a value (e.g., capacity from 50 to 75)

**Shot 4.5 — Save Config (10s)**
- Click "Save Config" button
- Show success confirmation

---

## Session 5 — Settings (~3 minutes)

**Navigate to**: Settings tab (`/#settings`)

### Shots to Capture:

**Shot 5.1 — Theme Toggle (15s)**
- Toggle from dark theme to light theme
- Pause on light theme for 5s
- Toggle back to dark theme

**Shot 5.2 — Use-Case Presets (30s)**
- Click through each preset:
  1. Retail / Foot Traffic
  2. Restaurant / Hospitality
  3. Queue Analysis
  4. Office / Coworking
  5. Venue / Events
- Pause 3s on each, show the config values changing

**Shot 5.3 — Backend Health Check (10s)**
- Show the health status indicator (green = connected)

**Shot 5.4 — Model/Tracker Config (15s)**
- Show the model selection dropdown with all options
- Show the tracker selection with ByteTrack/BoT-SORT

---

## Session 6 — 3D Tracking Extended (~5 minutes)

**Navigate to**: Procedural Demo > 3D Tracking View

### Shots to Capture:

**Shot 6.1 — Full Isometric View Running (120s)**
- Let the 3D visualization run continuously for 2 full minutes
- People spawning at edges, walking through zones, exiting
- Zone occupancy counters updating in real time
- 5 zones visible with real-time counts
- This is the "hero shot" — needs to look impressive

**Shot 6.2 — Toggle Trails (20s)**
- Turn movement trails ON
- Show colored trail paths behind walking figures
- Turn trails OFF

**Shot 6.3 — Toggle Bounding Boxes (20s)**
- Turn isometric bounding boxes ON (3D wireframe rectangles)
- Show ID badges above each person (#1, #2, etc.)
- Turn OFF

**Shot 6.4 — Metrics Grid (15s)**
- Show the 5-metric grid below the canvas:
  Current | Entries | Exits | Peak | Net Flow
- Watch numbers update as people move

**Shot 6.5 — Pause/Play Controls (10s)**
- Pause the simulation
- Show frozen state
- Resume

---

## Post-Capture Checklist

- [ ] All 6 sessions recorded successfully
- [ ] Files named consistently: `session-1-live-monitor.mp4`, `session-2-analytics.mp4`, etc.
- [ ] Each recording verified for quality (no frame drops, correct resolution)
- [ ] All recordings uploaded to Google AI Studio
- [ ] Total footage: approximately 38 minutes across 6 sessions

## File Naming Convention
```
janus-capture-session1-live-monitor.mp4
janus-capture-session2-analytics.mp4
janus-capture-session3-heatmap.mp4
janus-capture-session4-zone-config.mp4
janus-capture-session5-settings.mp4
janus-capture-session6-3d-tracking.mp4
```
