# YouTube Video Tracking - Quick Start Guide

## 🎥 Using YouTube Videos for Testing

The Janus tracking system now supports YouTube videos as input! This is perfect for:
- Testing the system without a physical camera
- Analyzing existing crowd footage
- Demonstrating the system with public videos
- Comparing tracking results across different scenarios

## ✅ Quick Start (3 Steps)

### 1. Find a YouTube Video
Search for videos with people, such as:
- "retail store footage"
- "shopping mall crowd"
- "restaurant busy hours"
- "airport terminal timelapse"
- "subway station crowd"

Example videos that work well:
- Mall/retail footage with clear camera angle
- Fixed-position security camera footage
- Timelapse videos of busy areas

### 2. Copy the YouTube URL
Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

### 3. Run the Tracker

**Windows (Easy):**
```batch
cd C:\Users\alima\janus-demo\edge_agent
run_youtube.bat "YOUR_YOUTUBE_URL_HERE"
```

**Command Line (All Platforms):**
```bash
cd C:\Users\alima\janus-demo\edge_agent
.venv\Scripts\python.exe edge_agent_enhanced.py --youtube "YOUR_YOUTUBE_URL" --backend http://localhost:8000
```

## 📊 What Happens

1. **Video Download**: yt-dlp extracts the direct stream URL (no file download!)
2. **Person Detection**: YOLO detects all people in each frame
3. **Tracking**: ByteTrack assigns persistent IDs to each person
4. **Zone Detection**: Determines which zone each person is in
5. **Event Streaming**: Sends entry/exit/zone_change events to backend
6. **Session Tracking**: Records complete visitor journeys
7. **Dashboard Updates**: All 58+ KPIs update in real-time!

## 🎯 Example Use Cases

### Test Retail Analytics
```bash
# Use a shopping mall video
run_youtube.bat "https://www.youtube.com/watch?v=MALL_VIDEO_ID"

# Watch the dashboard show:
# - Entry/exit counts
# - Dwell time per zone
# - Conversion rate (who reached checkout)
# - Traffic heatmap
# - Queue analytics
```

### Compare Time Periods
```bash
# Run tracker on morning rush hour video
run_youtube.bat "https://www.youtube.com/watch?v=MORNING_VIDEO"

# Then run on evening video
run_youtube.bat "https://www.youtube.com/watch?v=EVENING_VIDEO"

# Compare analytics in the dashboard
```

## ⚙️ Configuration

### Custom Zones
1. Open browser → http://localhost:5173/#zones
2. Drag rectangles to match video layout
3. Save config to `zones.json`
4. Run tracker with your custom zones

### Adjust Detection Confidence
```bash
# More sensitive (detect more people, possible false positives)
python edge_agent_enhanced.py --youtube "URL" --conf 0.25

# Less sensitive (fewer false positives, might miss some people)
python edge_agent_enhanced.py --youtube "URL" --conf 0.50
```

### Use GPU for Faster Processing
```bash
python edge_agent_enhanced.py --youtube "URL" --device cuda:0
```

## 📈 View Results

### Real-Time Dashboard
Open browser: http://localhost:5173

**Live Monitor Tab**: Current counts, occupancy, dwell time, queue length
**Analytics Tab**: Conversion rates, bounce rates, engagement
**Heatmap Tab**: Visual traffic patterns and dwell distribution
**Reports Tab**: Weekly summaries and peak hours

### Database
All tracking data is stored in SQLite:
```
C:\Users\alima\janus-demo\backend\janus.db
```

View with any SQLite browser:
- `events` table: All entry/exit/zone_change events
- `sessions` table: Complete visitor journeys with dwell time
- `zones` table: Zone configurations

## 🛠️ Troubleshooting

### "Failed to extract YouTube URL"
- Check the YouTube URL is valid and accessible
- Some private/restricted videos won't work
- Try a different video

### "No people detected"
- Adjust `--conf` threshold (try 0.25)
- Make sure the video actually has people in frame
- Check the video quality (480p+ recommended)

### "Zones don't match video"
- Use the Zone Config UI to adjust zones
- Default zones are for 640x480 video
- Drag rectangles to match your video layout

### Slow Performance
- Use `--device cuda:0` if you have an NVIDIA GPU
- Lower the video resolution: `--format best[height<=480]`
- Close other applications

## 💡 Pro Tips

1. **Choose fixed-camera videos**: Moving cameras confuse the tracker
2. **Overhead angles work best**: Clear view of people's heads
3. **Good lighting helps**: Dark videos have poor detection
4. **Test with short videos first**: Start with 1-2 minute clips
5. **Adjust zones to match video**: Use Zone Config UI before running

## 🎬 Suggested Search Terms

YouTube search terms that work well:
- "retail store security camera"
- "shopping mall timelapse"
- "busy restaurant footage"
- "airport terminal crowd"
- "subway station rush hour"
- "checkout line timelapse"
- "store entrance people counting"

## 📞 Support

Having issues? Check:
1. Backend is running: http://localhost:8000/health
2. Frontend is running: http://localhost:5173
3. YouTube URL is accessible in your browser
4. yt-dlp is installed: `pip list | grep yt-dlp`

## 🚀 Next Steps

Once you've tested with YouTube videos:
1. Connect a real camera: `--rtsp rtsp://camera_ip/stream`
2. Use a webcam: `--rtsp 0`
3. Use a video file: `--rtsp /path/to/video.mp4`
4. Deploy to production with actual retail camera feeds
