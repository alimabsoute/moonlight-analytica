import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getKpis, getSeriesCsv, parseSeries, seedDemo, getDwellTime, getOccupancy, getEntriesExits, getQueue } from '../api';
import TimeRangePicker from '../components/TimeRangePicker';
import KPIStat from '../components/KPIStat';
import ChartCard from '../components/ChartCard';
import ErrorBanner from '../components/ErrorBanner';
import Loading from '../components/Loading';
import './LiveMonitor.css';

export default function LiveMonitor() {
  const [timeRange, setTimeRange] = useState(1); // 1 hour default
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
  const [videoSource, setVideoSource] = useState('demo'); // 'demo' | 'webcam' | 'procedural'
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
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 2000); // Update every 2 seconds for real-time
    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

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
          // Upload MP4 file
          const formData = new FormData();
          formData.append('video', uploadedVideo);

          response = await fetch('http://localhost:8000/video/upload', {
            method: 'POST',
            body: formData
          });
          data = await response.json();
          if (!data.ok) throw new Error(data.error || 'Failed to upload video');

        } else if (youtubeUrl) {
          // Use YouTube URL
          response = await fetch('http://localhost:8000/video/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: 'youtube', url: youtubeUrl })
          });
          data = await response.json();
          if (!data.ok) throw new Error(data.error || 'Failed to start YouTube video');

        } else {
          // Use default demo.mp4
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
        response = await fetch('http://localhost:8000/video/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'procedural' })
        });
        data = await response.json();
        if (!data.ok) throw new Error(data.error || 'Failed to start procedural demo');
      }

      // Wait for video streamer to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Refresh data
      setLoading(false);
      setVideoPlaying(true);
      await fetchData();

      // Force video feed refresh by adding timestamp
      setVideoStreamUrl(`http://localhost:8001/video_feed?t=${Date.now()}`);

    } catch (err) {
      setError(err.message || 'Failed to start video stream');
      setLoading(false);
    }
  };

  const handleStopVideo = async () => {
    try {
      const response = await fetch('http://localhost:8000/video/stop', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.ok) {
        setVideoPlaying(false);
        setVideoStreamUrl('');
      }
    } catch (err) {
      setError('Failed to stop video stream');
    }
  };

  const handlePauseVideo = () => {
    // Toggle pause state (just hides video feed visually)
    setVideoPlaying(!videoPlaying);
  };

  const handleResumeVideo = () => {
    setVideoPlaying(true);
    // Force video feed refresh
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

      // Reset form
      setNewVideoFile(null);
      setNewVideoName('');
      setNewVideoDescription('');

      // Refresh library
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
      setLoading(true);
      const response = await fetch(`http://localhost:8000/video/library/${videoId}/play`, {
        method: 'POST'
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to play video');

      // Wait for video streamer to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Close library and refresh
      setShowVideoLibrary(false);
      setLoading(false);
      setVideoPlaying(true);
      await fetchData();

      // Force video feed refresh
      setVideoStreamUrl(`http://localhost:8001/video_feed?t=${Date.now()}`);

    } catch (err) {
      setError(err.message || 'Failed to play video');
      setLoading(false);
    }
  };

  const handleDeleteFromLibrary = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const response = await fetch(`http://localhost:8000/video/library/${videoId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to delete video');

      // Refresh library
      await fetchVideoLibrary();
    } catch (err) {
      setError(err.message || 'Failed to delete video');
    }
  };

  useEffect(() => {
    if (showVideoLibrary) {
      fetchVideoLibrary();
    }
  }, [showVideoLibrary]);

  if (loading) {
    return <Loading message="Loading live monitor data..." />;
  }

  return (
    <div className="live-monitor">
      <div className="page-header">
        <h1>Live Monitor</h1>
        <div className="header-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (10s)
          </label>
          <button onClick={() => setShowVideoLibrary(true)} className="btn-secondary">
            📚 Video Library
          </button>
          <button onClick={fetchData} className="btn-refresh">
            🔄 Refresh Now
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div className="time-range-section">
        <TimeRangePicker value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="kpi-grid">
        <KPIStat
          label="Current Count"
          value={kpis?.current_count ?? 0}
        />
        <KPIStat
          label="Average"
          value={(kpis?.avg_count ?? 0).toFixed(1)}
        />
        <KPIStat
          label="Peak"
          value={kpis?.peak_count ?? 0}
        />
        <KPIStat
          label="Total Events"
          value={kpis?.total_events ?? 0}
        />
        <KPIStat
          label="Occupancy %"
          value={`${occupancy?.occupancy_rate?.toFixed(1) ?? 0}%`}
        />
        <KPIStat
          label="Entries"
          value={entriesExits?.entries ?? 0}
        />
        <KPIStat
          label="Exits"
          value={entriesExits?.exits ?? 0}
        />
        <KPIStat
          label="Avg Dwell Time"
          value={dwellTime ? `${Math.floor(dwellTime.avg_dwell_seconds / 60)}m` : '0m'}
        />
        <KPIStat
          label="Queue Length"
          value={queue?.current_queue_length ?? 0}
        />
        <KPIStat
          label="Avg Wait Time"
          value={queue ? `${Math.floor(queue.avg_wait_seconds / 60)}m` : '0m'}
        />
      </div>

      <ChartCard
        title="Live Video Feed"
        className="video-feed-card"
        actions={
          <button onClick={() => setShowVideoSourceModal(true)} className="btn-secondary">
            📹 Change Video Source
          </button>
        }
      >
        <div className="video-container">
          {videoPlaying && videoStreamUrl && (
            <>
              <img
                src={videoStreamUrl}
                alt="Live tracking feed"
                className="video-stream"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="video-controls">
                <button
                  className="control-btn"
                  onClick={handlePauseVideo}
                  title="Pause"
                >
                  ⏸️
                </button>
                <button
                  className="control-btn"
                  onClick={handleStopVideo}
                  title="Stop"
                >
                  ⏹️
                </button>
                <button
                  className="control-btn"
                  onClick={() => setShowVideoSourceModal(true)}
                  title="Change Source"
                >
                  ⚙️
                </button>
              </div>
            </>
          )}
          {!videoPlaying && videoStreamUrl && (
            <div className="video-paused">
              <div className="paused-content">
                <h3>⏸️ Video Paused</h3>
                <button
                  className="btn-primary"
                  onClick={handleResumeVideo}
                >
                  ▶️ Resume
                </button>
              </div>
            </div>
          )}
          {!videoStreamUrl && (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <h3>📹 No Video Feed</h3>
                <p>Click "Change Video Source" to select a video source</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowVideoSourceModal(true)}
                >
                  📹 Select Video Source
                </button>
              </div>
            </div>
          )}
        </div>
      </ChartCard>

      {/* Video Source Modal */}
      {showVideoSourceModal && (
        <div className="modal-overlay" onClick={() => setShowVideoSourceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Video Source</h2>
              <button onClick={() => setShowVideoSourceModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="video-source-options">

                {/* Option 1: Demo Video/YouTube */}
                <div className={`source-option ${videoSource === 'demo' ? 'active' : ''}`}>
                  <div className="source-header" onClick={() => setVideoSource('demo')}>
                    <input
                      type="radio"
                      name="videoSource"
                      value="demo"
                      checked={videoSource === 'demo'}
                      onChange={() => setVideoSource('demo')}
                    />
                    <h3>📹 Demo Video / YouTube</h3>
                  </div>
                  {videoSource === 'demo' && (
                    <div className="source-config">
                      <div className="upload-section">
                        <label>
                          <strong>Upload MP4 Video:</strong>
                          <input
                            type="file"
                            accept="video/mp4"
                            onChange={(e) => setUploadedVideo(e.target.files[0])}
                          />
                        </label>
                        {uploadedVideo && <p className="file-name">Selected: {uploadedVideo.name}</p>}
                      </div>
                      <div className="divider">OR</div>
                      <div className="youtube-section">
                        <label>
                          <strong>YouTube URL:</strong>
                          <input
                            type="text"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                          />
                        </label>
                      </div>
                      <button className="btn-primary" onClick={() => handleStartVideoStream('demo')}>
                        ▶️ Start Demo Video
                      </button>
                    </div>
                  )}
                </div>

                {/* Option 2: Live Webcam */}
                <div className={`source-option ${videoSource === 'webcam' ? 'active' : ''}`}>
                  <div className="source-header" onClick={() => setVideoSource('webcam')}>
                    <input
                      type="radio"
                      name="videoSource"
                      value="webcam"
                      checked={videoSource === 'webcam'}
                      onChange={() => setVideoSource('webcam')}
                    />
                    <h3>📷 Live Webcam</h3>
                  </div>
                  {videoSource === 'webcam' && (
                    <div className="source-config">
                      <p>Connect to your computer's webcam for live tracking</p>
                      <button className="btn-primary" onClick={() => handleStartVideoStream('webcam')}>
                        ▶️ Start Webcam
                      </button>
                    </div>
                  )}
                </div>

                {/* Option 3: Procedural Demo */}
                <div className={`source-option ${videoSource === 'procedural' ? 'active' : ''}`}>
                  <div className="source-header" onClick={() => setVideoSource('procedural')}>
                    <input
                      type="radio"
                      name="videoSource"
                      value="procedural"
                      checked={videoSource === 'procedural'}
                      onChange={() => setVideoSource('procedural')}
                    />
                    <h3>🎲 Procedural Demo</h3>
                  </div>
                  {videoSource === 'procedural' && (
                    <div className="source-config">
                      <p>Generate simulated tracking data for testing</p>
                      <button className="btn-primary" onClick={() => handleStartVideoStream('procedural')}>
                        ▶️ Start Procedural Demo
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      <ChartCard
        title="Count Over Time"
        actions={
          <>
            <button onClick={handleDownloadCSV} className="btn-secondary">
              📥 Download CSV
            </button>
            <button onClick={handleSeedDemo} className="btn-secondary">
              🎲 Seed Demo
            </button>
          </>
        }
      >
        {series.length === 0 ? (
          <div className="no-data">No data available for selected time range</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="ts"
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(ts) => new Date(ts).toLocaleString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count_value"
                stroke="#007bff"
                name="Count"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="stats-grid">
        <ChartCard title="Throughput (Events/Hour)">
          <div className="stat-value">{(kpis?.throughput ?? 0).toFixed(2)}</div>
        </ChartCard>
        <ChartCard title="Time Range">
          <div className="stat-value">{timeRange}h</div>
        </ChartCard>
      </div>

      {/* Video Library Modal */}
      {showVideoLibrary && (
        <div className="modal-overlay" onClick={() => setShowVideoLibrary(false)}>
          <div className="modal-content library-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📚 Video Library</h2>
              <button onClick={() => setShowVideoLibrary(false)} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              {/* Upload Section */}
              <div className="library-upload-section">
                <h3>Upload New Video</h3>
                <div className="upload-form">
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => setNewVideoFile(e.target.files[0])}
                    className="file-input"
                  />
                  {newVideoFile && (
                    <>
                      <input
                        type="text"
                        placeholder="Video name (optional)"
                        value={newVideoName}
                        onChange={(e) => setNewVideoName(e.target.value)}
                        className="text-input"
                      />
                      <textarea
                        placeholder="Description (optional)"
                        value={newVideoDescription}
                        onChange={(e) => setNewVideoDescription(e.target.value)}
                        className="textarea-input"
                        rows="2"
                      />
                      <button
                        onClick={handleUploadToLibrary}
                        disabled={uploadingToLibrary}
                        className="btn-primary"
                      >
                        {uploadingToLibrary ? '⏳ Uploading...' : '📤 Upload to Library'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Video Library List */}
              <div className="library-list-section">
                <h3>Saved Videos ({videoLibrary.length})</h3>
                {videoLibrary.length === 0 ? (
                  <div className="empty-library">
                    <p>No videos in library yet. Upload your first video above!</p>
                  </div>
                ) : (
                  <div className="video-grid">
                    {videoLibrary.map((video) => (
                      <div key={video.id} className="video-card">
                        <div className="video-card-header">
                          <h4>{video.name}</h4>
                          <button
                            onClick={() => handleDeleteFromLibrary(video.id)}
                            className="delete-btn"
                            title="Delete video"
                          >
                            🗑️
                          </button>
                        </div>
                        {video.description && (
                          <p className="video-description">{video.description}</p>
                        )}
                        <div className="video-meta">
                          <span className="video-size">
                            {(video.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="video-date">
                            {new Date(video.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handlePlayFromLibrary(video.id)}
                          className="btn-primary play-btn"
                        >
                          ▶️ Play & Track
                        </button>
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
