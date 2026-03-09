import { useState, useEffect, lazy, Suspense } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getKpis, getSeriesCsv, parseSeries, seedDemo, getDwellTime, getOccupancy, getEntriesExits, getQueue, startBatchJob } from '../api';
import Button from '../components/Button';
import { HeroStatCard, StatCard } from '../components/Card';
import TimeRangePicker from '../components/TimeRangePicker';
import ErrorBanner from '../components/ErrorBanner';
import Loading from '../components/Loading';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Users, TrendingUp, LogIn, LogOut, Library, RefreshCw, Video, Settings, Play, Pause, Square, BarChart3, Clock, Activity, Layers } from 'lucide-react';
import './LiveMonitor.css';

// Lazy load the animated demo components
const HumanoidTrackingDemo = lazy(() => import('../../../shared/HumanoidTrackingDemo'));
const Tracking3DView = lazy(() => import('../../../shared/Tracking3DView'));

export default function LiveMonitor() {
  const [timeRange, setTimeRange] = useState(1);
  const [kpis, setKpis] = useState(null);
  const [series, setSeries] = useState([]);
  const [dwellTime, setDwellTime] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [entriesExits, setEntriesExits] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Video source state
  const [videoSource, setVideoSource] = useState('demo');
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showVideoSourceModal, setShowVideoSourceModal] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoStreamUrl, setVideoStreamUrl] = useState(`http://localhost:8001/video_feed?t=${Date.now()}`);

  // Video library state
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [videoLibrary, setVideoLibrary] = useState([]);
  const [uploadingToLibrary, setUploadingToLibrary] = useState(false);
  const [newVideoName, setNewVideoName] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [batchingVideoId, setBatchingVideoId] = useState(null);

  // Model and tracker state
  const [currentModel, setCurrentModel] = useState('yolov8n.pt');
  const [currentTracker, setCurrentTracker] = useState('bytetrack.yaml');
  const availableModels = ['yolov8n.pt', 'yolo11n.pt', 'yolo11s.pt'];
  const availableTrackers = ['bytetrack.yaml', 'botsort.yaml'];

  // Video feed error state
  const [videoFeedError, setVideoFeedError] = useState(false);

  // Procedural demo state
  const [showProceduralDemo, setShowProceduralDemo] = useState(false);
  const [demoMode, setDemoMode] = useState('3d');

  const fetchData = async () => {
    try {
      setError(null);
      const [kpiData, csvData, dwellData, occData, eeData, qData] = await Promise.all([
        getKpis(timeRange),
        getSeriesCsv(timeRange),
        getDwellTime(timeRange),
        getOccupancy(),
        getEntriesExits(timeRange),
        getQueue(timeRange)
      ]);
      setKpis(kpiData);
      setSeries(parseSeries(csvData));
      setDwellTime(dwellData);
      setOccupancy(occData);
      setEntriesExits(eeData);
      setQueue(qData);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  useEffect(() => {
    if (!autoRefresh || showProceduralDemo) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, timeRange, showProceduralDemo]);

  const handleSeedDemo = async () => {
    try {
      setError(null);
      await seedDemo();
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to seed demo data');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const csvData = await getSeriesCsv(timeRange);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `janus-series-${timeRange}h.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download CSV');
    }
  };

  const handleStartVideoStream = async (source) => {
    try {
      setError(null);
      setLoading(true);
      setShowVideoSourceModal(false);

      let response, data;

      if (source === 'demo') {
        if (uploadedVideo) {
          const formData = new FormData();
          formData.append('video', uploadedVideo);
          response = await fetch('http://localhost:8000/video/upload', {
            method: 'POST',
            body: formData
          });
          data = await response.json();
          if (!data.ok) throw new Error(data.error || 'Failed to upload video');
        } else if (youtubeUrl) {
          const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]+/;
          if (!ytRegex.test(youtubeUrl)) {
            throw new Error('Invalid YouTube URL format');
          }
          response = await fetch('http://localhost:8000/video/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: 'youtube', url: youtubeUrl })
          });
          data = await response.json();
          if (!data.ok) throw new Error(data.error || 'Failed to start YouTube video');
        } else {
          response = await fetch('http://localhost:8000/video/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: 'demo' })
          });
          data = await response.json();
          if (!data.ok) throw new Error(data.error || 'Failed to start demo video');
        }
      } else if (source === 'webcam') {
        response = await fetch('http://localhost:8000/video/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'webcam' })
        });
        data = await response.json();
        if (!data.ok) throw new Error(data.error || 'Failed to start webcam');
      } else if (source === 'procedural') {
        setShowProceduralDemo(true);
        setVideoPlaying(false);
        setVideoStreamUrl('');
        setLoading(false);
        setKpis({
          current_count: 0,
          avg_count: 0,
          peak_count: 0,
          total_events: 0,
          throughput: 0
        });
        setEntriesExits({ entries: 0, exits: 0 });
        setOccupancy({ occupancy_rate: 0 });
        setDwellTime({ avg_dwell_seconds: 0 });
        setQueue({ current_queue_length: 0, avg_wait_seconds: 0 });
        return;
      }

      // YouTube needs more time for yt-dlp extraction + model load
      const waitMs = youtubeUrl ? 10000 : 5000;
      await new Promise(resolve => setTimeout(resolve, waitMs));
      setLoading(false);
      setVideoPlaying(true);
      setVideoFeedError(false);
      await fetchData();
      setVideoStreamUrl(`http://localhost:8001/video_feed?t=${Date.now()}`);
    } catch (err) {
      setError(err.message || 'Failed to start video stream');
      setLoading(false);
    }
  };

  const handleStopVideo = async () => {
    try {
      const response = await fetch('http://localhost:8000/video/stop', { method: 'POST' });
      const data = await response.json();
      if (data.ok) {
        setVideoPlaying(false);
        setVideoStreamUrl('');
      }
    } catch (err) {
      setError('Failed to stop video stream');
    }
  };

  const handlePauseVideo = () => setVideoPlaying(!videoPlaying);
  const handleResumeVideo = () => {
    setVideoPlaying(true);
    setVideoFeedError(false);
    setVideoStreamUrl(`http://localhost:8001/video_feed?t=${Date.now()}`);
  };
  const handleRetryVideoFeed = () => {
    setVideoFeedError(false);
    setVideoStreamUrl(`http://localhost:8001/video_feed?t=${Date.now()}`);
  };

  const fetchVideoLibrary = async () => {
    try {
      const response = await fetch('http://localhost:8000/video/library');
      const data = await response.json();
      setVideoLibrary(data.videos || []);
    } catch (err) {
      console.error('Failed to fetch video library:', err);
    }
  };

  const handleUploadToLibrary = async () => {
    if (!newVideoFile) {
      setError('Please select a video file');
      return;
    }
    try {
      setUploadingToLibrary(true);
      const formData = new FormData();
      formData.append('video', newVideoFile);
      formData.append('name', newVideoName || newVideoFile.name.replace('.mp4', ''));
      formData.append('description', newVideoDescription);
      const response = await fetch('http://localhost:8000/video/library/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Upload failed');
      setNewVideoFile(null);
      setNewVideoName('');
      setNewVideoDescription('');
      await fetchVideoLibrary();
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to upload video');
    } finally {
      setUploadingToLibrary(false);
    }
  };

  const handlePlayFromLibrary = async (videoId) => {
    try {
      setPlayingVideoId(videoId);
      setError(null);
      const response = await fetch(`http://localhost:8000/video/library/${videoId}/play`, { method: 'POST' });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to play video');
      // For cold starts, wait for streamer to load YOLO model before showing feed
      if (data.method === 'subprocess_start') {
        let ready = false;
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 500));
          try {
            const health = await fetch('http://localhost:8001/health');
            if (health.ok) { ready = true; break; }
          } catch { /* streamer not ready yet */ }
        }
        if (!ready) throw new Error('Video streamer is starting but taking longer than expected. Try again in a few seconds.');
      }
      setVideoStreamUrl(`http://localhost:8001/video_feed?t=${Date.now()}`);
      setVideoPlaying(true);
      setVideoFeedError(false);
      setShowVideoLibrary(false);
      setPlayingVideoId(null);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to play video');
      setPlayingVideoId(null);
    }
  };

  const handleDeleteFromLibrary = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const response = await fetch(`http://localhost:8000/video/library/${videoId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to delete video');
      await fetchVideoLibrary();
    } catch (err) {
      setError(err.message || 'Failed to delete video');
    }
  };

  const handleBatchAnalyze = async (videoId) => {
    try {
      setBatchingVideoId(videoId);
      setError(null);
      const data = await startBatchJob(videoId);
      if (!data.ok) throw new Error(data.error || 'Failed to start batch analysis');
      setBatchingVideoId(null);
    } catch (err) {
      setError(err.message || 'Failed to start batch analysis');
      setBatchingVideoId(null);
    }
  };

  useEffect(() => {
    if (showVideoLibrary) fetchVideoLibrary();
  }, [showVideoLibrary]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://localhost:8000/video/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.model) setCurrentModel(data.model);
          if (data.tracker) setCurrentTracker(data.tracker);
        }
      } catch (err) {
        console.log('Could not fetch video settings');
      }
    };
    fetchSettings();
  }, []);

  const handleSwitchModel = async (model) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:8000/video/model?model=${model}`, { method: 'POST' });
      const data = await response.json();
      if (data.ok) setCurrentModel(model);
      else setError(data.error || 'Failed to switch model');
    } catch (err) {
      setError(err.message || 'Failed to switch model');
    }
  };

  const handleSwitchTracker = async (tracker) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:8000/video/tracker?tracker=${tracker}`, { method: 'POST' });
      const data = await response.json();
      if (data.ok) setCurrentTracker(tracker);
      else setError(data.error || 'Failed to switch tracker');
    } catch (err) {
      setError(err.message || 'Failed to switch tracker');
    }
  };

  if (loading) {
    return <Loading message="Loading live monitor data..." />;
  }

  return (
    <div className="live-monitor">
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Hero Stats Section */}
      <section className="hero-stats-section">
        <HeroStatCard
          label="Current Count"
          value={kpis?.current_count ?? 0}
          icon={<Users size={28} />}
          color="primary"
          pulsing={autoRefresh}
        />
        <HeroStatCard
          label="Peak Today"
          value={kpis?.peak_count ?? 0}
          icon={<TrendingUp size={28} />}
          color="warning"
        />
        <HeroStatCard
          label="Entries"
          value={entriesExits?.entries ?? 0}
          icon={<LogIn size={28} />}
          color="success"
        />
        <HeroStatCard
          label="Exits"
          value={entriesExits?.exits ?? 0}
          icon={<LogOut size={28} />}
          color="error"
        />
      </section>

      {/* Controls Bar */}
      <section className="controls-bar">
        <div className="controls-left">
          <TimeRangePicker value={timeRange} onChange={setTimeRange} />
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh</span>
          </label>
        </div>
        <div className="controls-right">
          <Button variant="secondary" size="sm" onClick={() => setShowVideoLibrary(true)} icon={<Library size={16} />}>
            Library
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchData} icon={<RefreshCw size={16} />}>
            Refresh
          </Button>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Video Feed Card */}
        <section className="video-section">
          <div className="section-header">
            <h2>Live Video Feed</h2>
            <div className="section-actions">
              <Button variant="ghost" size="sm" onClick={() => setShowVideoSourceModal(true)} icon={<Video size={16} />}>
                Change Source
              </Button>
            </div>
          </div>

          {/* Model/Tracker Selection - shadcn Select */}
          <div className="model-tracker-bar">
            <div className="selector-group">
              <label>Model:</label>
              <Select value={currentModel} onValueChange={handleSwitchModel}>
                <SelectTrigger className="w-[140px] h-9 bg-[#1e293b] border-[#374151] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-[#374151]">
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model} className="text-white hover:bg-[#374151] focus:bg-[#374151]">
                      {model.replace('.pt', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="selector-group">
              <label>Tracker:</label>
              <Select value={currentTracker} onValueChange={handleSwitchTracker}>
                <SelectTrigger className="w-[140px] h-9 bg-[#1e293b] border-[#374151] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-[#374151]">
                  {availableTrackers.map((tracker) => (
                    <SelectItem key={tracker} value={tracker} className="text-white hover:bg-[#374151] focus:bg-[#374151]">
                      {tracker.replace('.yaml', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Video Container */}
          <div className="video-container">
            {videoStreamUrl && !videoFeedError && !showProceduralDemo && (
              <>
                {videoPlaying ? (
                  <img
                    src={videoStreamUrl}
                    alt="Live tracking feed"
                    className="video-stream"
                    onError={() => setVideoFeedError(true)}
                    onLoad={() => setVideoFeedError(false)}
                  />
                ) : (
                  <div className="video-paused">
                    <div className="paused-content">
                      <span className="paused-icon">⏸️</span>
                      <h3>Video Paused</h3>
                      <p>Click play to resume</p>
                    </div>
                  </div>
                )}
                <div className="video-controls-overlay">
                  <button className="video-control-btn" onClick={videoPlaying ? handlePauseVideo : handleResumeVideo}>
                    {videoPlaying ? '⏸️' : '▶️'}
                  </button>
                  <button className="video-control-btn" onClick={handleStopVideo}>⏹️</button>
                  <button className="video-control-btn" onClick={() => setShowVideoSourceModal(true)}>⚙️</button>
                </div>
                <div className="video-status-badge">
                  <span className="status-dot live" />
                  <span>Live</span>
                </div>
              </>
            )}
            {videoFeedError && videoStreamUrl && (
              <div className="video-error-state">
                <span className="error-icon">⚠️</span>
                <h3>Video Feed Error</h3>
                <p>Could not connect to video stream</p>
                <div className="error-actions">
                  <Button variant="primary" size="sm" onClick={handleRetryVideoFeed}>Retry</Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowVideoLibrary(true)}>Open Library</Button>
                </div>
              </div>
            )}
            {!videoStreamUrl && !showProceduralDemo && (
              <div className="video-empty-state">
                <span className="empty-icon">📹</span>
                <h3>No Video Feed</h3>
                <p>Select a video source to start tracking</p>
                <Button variant="primary" onClick={() => setShowVideoSourceModal(true)}>Select Source</Button>
              </div>
            )}
            {showProceduralDemo && (
              <div className="procedural-demo-wrapper">
                <div className="demo-mode-toggle">
                  <button
                    onClick={() => setDemoMode('3d')}
                    className={`demo-mode-btn ${demoMode === '3d' ? 'active' : ''}`}
                  >
                    🎮 3D View
                  </button>
                  <button
                    onClick={() => setDemoMode('2d')}
                    className={`demo-mode-btn ${demoMode === '2d' ? 'active' : ''}`}
                  >
                    📊 2D View
                  </button>
                </div>
                <Suspense fallback={<div className="demo-loading">Loading demo...</div>}>
                  {demoMode === '3d' ? (
                    <Tracking3DView
                      onMetricsUpdate={(metrics) => {
                        setKpis(prev => ({
                          ...prev,
                          current_count: metrics.currentCount,
                          peak_count: metrics.peakCount,
                          total_events: metrics.totalEntries + metrics.totalExits,
                          avg_count: metrics.currentCount,
                          throughput: metrics.totalExits > 0 ? (metrics.totalExits / ((Date.now() - metrics.startTime) / 3600000)) : 0
                        }));
                        setEntriesExits({ entries: metrics.totalEntries, exits: metrics.totalExits });
                      }}
                      theme="dark"
                    />
                  ) : (
                    <HumanoidTrackingDemo
                      onMetricsUpdate={(metrics) => {
                        setKpis(prev => ({
                          ...prev,
                          current_count: metrics.currentCount,
                          peak_count: metrics.peakCount,
                          total_events: metrics.totalEntries + metrics.totalExits,
                          avg_count: metrics.currentCount,
                          throughput: metrics.totalExits > 0 ? (metrics.totalExits / ((Date.now() - metrics.startTime) / 3600000)) : 0
                        }));
                        setEntriesExits({ entries: metrics.totalEntries, exits: metrics.totalExits });
                      }}
                    />
                  )}
                </Suspense>
                <div className="demo-controls-bar">
                  <Button variant="secondary" size="sm" onClick={() => {
                    setShowProceduralDemo(false);
                    setShowVideoSourceModal(true);
                  }} icon={<Video size={16} />}>
                    Switch to Real Video
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Secondary Stats */}
        <section className="secondary-stats">
          <div className="section-header">
            <h2>Key Metrics</h2>
          </div>
          <div className="stats-grid">
            <StatCard label="Average Count" value={(kpis?.avg_count ?? 0).toFixed(1)} />
            <StatCard label="Total Events" value={kpis?.total_events ?? 0} />
            <StatCard label="Occupancy" value={`${occupancy?.occupancy_rate?.toFixed(1) ?? 0}%`} variant="primary" />
            <StatCard label="Avg Dwell" value={dwellTime ? `${Math.floor(dwellTime.avg_dwell_seconds / 60)}m` : '0m'} />
            <StatCard label="Queue Length" value={queue?.current_queue_length ?? 0} variant="warning" />
            <StatCard label="Avg Wait" value={queue ? `${Math.floor(queue.avg_wait_seconds / 60)}m` : '0m'} />
          </div>
        </section>
      </div>

      {/* Chart Section */}
      <section className="chart-section">
        <div className="section-header">
          <h2>Count Over Time</h2>
          <div className="section-actions">
            <Button variant="ghost" size="sm" onClick={handleDownloadCSV} icon={<BarChart3 size={16} />}>Export CSV</Button>
            <Button variant="ghost" size="sm" onClick={handleSeedDemo} icon={<Layers size={16} />}>Seed Demo</Button>
          </div>
        </div>
        <div className="chart-container">
          {series.length === 0 ? (
            <div className="chart-empty">No data available for selected time range</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="ts"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count_value"
                  stroke="#3b82f6"
                  fill="url(#colorCount)"
                  strokeWidth={2}
                  name="Count"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Throughput Stats */}
      <section className="throughput-section">
        <div className="throughput-card">
          <span className="throughput-label">Throughput</span>
          <span className="throughput-value">{(kpis?.throughput ?? 0).toFixed(2)}</span>
          <span className="throughput-unit">events/hour</span>
        </div>
        <div className="throughput-card">
          <span className="throughput-label">Time Range</span>
          <span className="throughput-value">{timeRange}</span>
          <span className="throughput-unit">hours</span>
        </div>
      </section>

      {/* Video Source Modal */}
      {showVideoSourceModal && (
        <div className="modal-overlay" onClick={() => setShowVideoSourceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Video Source</h2>
              <button onClick={() => setShowVideoSourceModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="source-options">
                <div className={`source-option ${videoSource === 'demo' ? 'active' : ''}`}>
                  <div className="source-option-header" onClick={() => setVideoSource('demo')}>
                    <input type="radio" name="source" value="demo" checked={videoSource === 'demo'} onChange={() => setVideoSource('demo')} />
                    <span className="source-icon">📹</span>
                    <span className="source-label">Demo Video / YouTube</span>
                  </div>
                  {videoSource === 'demo' && (
                    <div className="source-config">
                      <div className="upload-field">
                        <label>Upload MP4 Video:</label>
                        <input type="file" accept="video/mp4" onChange={(e) => setUploadedVideo(e.target.files[0])} />
                        {uploadedVideo && <p className="file-selected">{uploadedVideo.name}</p>}
                      </div>
                      <div className="divider"><span>OR</span></div>
                      <div className="input-field">
                        <label>YouTube URL:</label>
                        <input type="text" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                      </div>
                      <Button variant="primary" fullWidth onClick={() => handleStartVideoStream('demo')}>Start Demo</Button>
                    </div>
                  )}
                </div>

                <div className={`source-option ${videoSource === 'webcam' ? 'active' : ''}`}>
                  <div className="source-option-header" onClick={() => setVideoSource('webcam')}>
                    <input type="radio" name="source" value="webcam" checked={videoSource === 'webcam'} onChange={() => setVideoSource('webcam')} />
                    <span className="source-icon">📷</span>
                    <span className="source-label">Live Webcam</span>
                  </div>
                  {videoSource === 'webcam' && (
                    <div className="source-config">
                      <p>Connect to your computer's webcam for live tracking</p>
                      <Button variant="primary" fullWidth onClick={() => handleStartVideoStream('webcam')}>Start Webcam</Button>
                    </div>
                  )}
                </div>

                <div className={`source-option ${videoSource === 'procedural' ? 'active' : ''}`}>
                  <div className="source-option-header" onClick={() => setVideoSource('procedural')}>
                    <input type="radio" name="source" value="procedural" checked={videoSource === 'procedural'} onChange={() => setVideoSource('procedural')} />
                    <span className="source-icon">🎲</span>
                    <span className="source-label">Procedural Demo</span>
                  </div>
                  {videoSource === 'procedural' && (
                    <div className="source-config">
                      <p>Generate simulated tracking data for testing</p>
                      <Button variant="primary" fullWidth onClick={() => handleStartVideoStream('procedural')}>Start Demo</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Library Modal */}
      {showVideoLibrary && (
        <div className="modal-overlay" onClick={() => setShowVideoLibrary(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Video Library</h2>
              <button onClick={() => setShowVideoLibrary(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              {error && (
                <div style={{ background: '#dc2626', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{error}</span>
                  <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                </div>
              )}
              <div className="library-upload">
                <h3>Upload New Video</h3>
                <div className="upload-form">
                  <input type="file" accept="video/mp4" onChange={(e) => setNewVideoFile(e.target.files[0])} />
                  {newVideoFile && (
                    <>
                      <input type="text" placeholder="Video name" value={newVideoName} onChange={(e) => setNewVideoName(e.target.value)} />
                      <textarea placeholder="Description" value={newVideoDescription} onChange={(e) => setNewVideoDescription(e.target.value)} rows="2" />
                      <Button variant="primary" onClick={handleUploadToLibrary} loading={uploadingToLibrary}>
                        {uploadingToLibrary ? 'Uploading...' : 'Upload'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="library-list">
                <h3>Saved Videos ({videoLibrary.length})</h3>
                {videoLibrary.length === 0 ? (
                  <div className="library-empty">No videos in library</div>
                ) : (
                  <div className="video-grid">
                    {videoLibrary.map((video) => (
                      <div key={video.id} className="library-video-card">
                        <div className="video-card-header">
                          <h4>{video.name}</h4>
                          <button onClick={() => handleDeleteFromLibrary(video.id)} className="delete-btn">🗑️</button>
                        </div>
                        {video.description && <p className="video-description">{video.description}</p>}
                        <div className="video-meta">
                          <span>{(video.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>{new Date(video.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="primary" size="sm" style={{ flex: 1 }} onClick={() => handlePlayFromLibrary(video.id)} loading={playingVideoId === video.id} disabled={!!playingVideoId}>
                            {playingVideoId === video.id ? 'Starting...' : 'Play & Track'}
                          </Button>
                          <Button variant="secondary" size="sm" style={{ flex: 1 }} onClick={() => handleBatchAnalyze(video.id)} loading={batchingVideoId === video.id} disabled={!!batchingVideoId}>
                            {batchingVideoId === video.id ? 'Starting...' : 'Batch Analyze'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
