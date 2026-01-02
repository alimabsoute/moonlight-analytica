/**
 * YouTube Video Tracking Component
 * Simulates real-time people tracking overlay on YouTube videos
 * Uses canvas overlay for tracking visualization
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  DETECTION_INTERVAL: 100, // ms between detections
  MAX_PEOPLE: 25,
  MIN_PEOPLE: 3,
  BOX_COLORS: [
    '#22d3ee', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ],
  CONFIDENCE_THRESHOLD: 0.7
};

// ============================================
// SIMULATED DETECTION CLASS
// ============================================

class SimulatedPerson {
  constructor(id, canvasWidth, canvasHeight) {
    this.id = id;
    this.x = Math.random() * (canvasWidth - 80) + 40;
    this.y = Math.random() * (canvasHeight - 160) + 80;
    this.width = 40 + Math.random() * 30;
    this.height = this.width * (2 + Math.random() * 0.5);
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = (Math.random() - 0.5) * 2;
    this.confidence = 0.75 + Math.random() * 0.24;
    this.color = CONFIG.BOX_COLORS[id % CONFIG.BOX_COLORS.length];
    this.trail = [];
    this.maxTrail = 20;
    this.lastUpdate = Date.now();
  }

  update(canvasWidth, canvasHeight) {
    // Add current position to trail
    this.trail.push({ x: this.x + this.width / 2, y: this.y + this.height });
    if (this.trail.length > this.maxTrail) {
      this.trail.shift();
    }

    // Move with some randomness
    this.x += this.vx + (Math.random() - 0.5) * 0.5;
    this.y += this.vy + (Math.random() - 0.5) * 0.3;

    // Bounce off edges
    if (this.x < 20 || this.x + this.width > canvasWidth - 20) {
      this.vx *= -1;
      this.x = Math.max(20, Math.min(canvasWidth - this.width - 20, this.x));
    }
    if (this.y < 40 || this.y + this.height > canvasHeight - 20) {
      this.vy *= -1;
      this.y = Math.max(40, Math.min(canvasHeight - this.height - 20, this.y));
    }

    // Occasionally change direction
    if (Math.random() < 0.02) {
      this.vx = (Math.random() - 0.5) * 3;
      this.vy = (Math.random() - 0.5) * 2;
    }

    // Update confidence with slight variation
    this.confidence = Math.max(0.7, Math.min(0.99,
      this.confidence + (Math.random() - 0.5) * 0.05
    ));
  }
}

// ============================================
// YOUTUBE URL PARSER
// ============================================

function extractYouTubeId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function YouTubeTrackingView({
  className = '',
  theme = 'dark',
  onMetricsUpdate,
  initialUrl = ''
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const peopleRef = useRef([]);

  const [url, setUrl] = useState(initialUrl);
  const [videoId, setVideoId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 854, height: 480 });
  const [metrics, setMetrics] = useState({
    peopleCount: 0,
    fps: 0,
    avgConfidence: 0,
    detections: 0
  });

  let nextId = useRef(1);
  let frameCount = useRef(0);
  let lastFpsUpdate = useRef(Date.now());

  const colors = theme === 'dark' ? {
    bg: '#0f172a',
    card: '#1e293b',
    border: '#334155',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#22d3ee',
    success: '#10b981',
    warning: '#f59e0b'
  } : {
    bg: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b',
    accent: '#0891b2',
    success: '#059669',
    warning: '#d97706'
  };

  // Parse URL and extract video ID
  const handleUrlSubmit = useCallback(() => {
    const id = extractYouTubeId(url);
    if (id) {
      setVideoId(id);
      setIsTracking(true);
      // Reset people when loading new video
      peopleRef.current = [];
      nextId.current = 1;
    }
  }, [url]);

  // Initialize people simulation
  const spawnPerson = useCallback(() => {
    const id = nextId.current++;
    const person = new SimulatedPerson(id, canvasSize.width, canvasSize.height);
    peopleRef.current.push(person);
    return person;
  }, [canvasSize]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isTracking || !showOverlay) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const ctx = canvas.getContext('2d');
    const people = peopleRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn/remove people randomly
    if (Math.random() < 0.02 && people.length < CONFIG.MAX_PEOPLE) {
      spawnPerson();
    }
    if (Math.random() < 0.01 && people.length > CONFIG.MIN_PEOPLE) {
      people.splice(Math.floor(Math.random() * people.length), 1);
    }

    // Ensure minimum people
    while (people.length < CONFIG.MIN_PEOPLE) {
      spawnPerson();
    }

    // Update and draw people
    let totalConfidence = 0;

    people.forEach(person => {
      person.update(canvas.width, canvas.height);
      totalConfidence += person.confidence;

      // Draw trail
      if (showTrails && person.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(person.trail[0].x, person.trail[0].y);
        for (let i = 1; i < person.trail.length; i++) {
          ctx.lineTo(person.trail[i].x, person.trail[i].y);
        }
        ctx.strokeStyle = person.color + '40';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw bounding box
      ctx.strokeStyle = person.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(person.x, person.y, person.width, person.height);

      // Draw corner accents
      const cornerSize = 8;
      ctx.fillStyle = person.color;

      // Top-left
      ctx.fillRect(person.x - 1, person.y - 1, cornerSize, 3);
      ctx.fillRect(person.x - 1, person.y - 1, 3, cornerSize);

      // Top-right
      ctx.fillRect(person.x + person.width - cornerSize + 1, person.y - 1, cornerSize, 3);
      ctx.fillRect(person.x + person.width - 2, person.y - 1, 3, cornerSize);

      // Bottom-left
      ctx.fillRect(person.x - 1, person.y + person.height - 2, cornerSize, 3);
      ctx.fillRect(person.x - 1, person.y + person.height - cornerSize + 1, 3, cornerSize);

      // Bottom-right
      ctx.fillRect(person.x + person.width - cornerSize + 1, person.y + person.height - 2, cornerSize, 3);
      ctx.fillRect(person.x + person.width - 2, person.y + person.height - cornerSize + 1, 3, cornerSize);

      // Draw label
      if (showLabels) {
        const label = `ID:${person.id} ${(person.confidence * 100).toFixed(0)}%`;
        ctx.font = 'bold 11px monospace';
        const textWidth = ctx.measureText(label).width;

        // Label background
        ctx.fillStyle = person.color + 'DD';
        ctx.fillRect(person.x, person.y - 18, textWidth + 8, 16);

        // Label text
        ctx.fillStyle = '#000';
        ctx.fillText(label, person.x + 4, person.y - 6);
      }

      // Draw center dot
      ctx.beginPath();
      ctx.arc(
        person.x + person.width / 2,
        person.y + person.height / 2,
        3, 0, Math.PI * 2
      );
      ctx.fillStyle = person.color;
      ctx.fill();
    });

    // Update FPS counter
    frameCount.current++;
    const now = Date.now();
    if (now - lastFpsUpdate.current >= 1000) {
      const fps = Math.round(frameCount.current / ((now - lastFpsUpdate.current) / 1000));
      frameCount.current = 0;
      lastFpsUpdate.current = now;

      const newMetrics = {
        peopleCount: people.length,
        fps: fps,
        avgConfidence: people.length > 0 ? totalConfidence / people.length : 0,
        detections: metrics.detections + people.length
      };
      setMetrics(newMetrics);

      if (onMetricsUpdate) {
        onMetricsUpdate(newMetrics);
      }
    }

    // Draw overlay info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 80);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 180, 80);

    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 12px monospace';
    ctx.fillText('JANUS TRACKING ACTIVE', 20, 28);

    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.fillText(`People: ${people.length}`, 20, 45);
    ctx.fillText(`FPS: ${metrics.fps}`, 100, 45);
    ctx.fillText(`Confidence: ${(metrics.avgConfidence * 100).toFixed(1)}%`, 20, 60);
    ctx.fillText(`Detections: ${metrics.detections}`, 20, 75);

    // Live indicator
    ctx.beginPath();
    ctx.arc(170, 23, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    animationRef.current = requestAnimationFrame(animate);
  }, [isTracking, showOverlay, showTrails, showLabels, spawnPerson, metrics, colors, onMetricsUpdate]);

  // Start animation when tracking
  useEffect(() => {
    if (isTracking) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTracking, animate]);

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = Math.min(854, containerRef.current.clientWidth);
        const height = Math.round(width * (9 / 16));
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className={className} ref={containerRef} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* URL Input Section */}
      <div style={{
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: '600',
          color: colors.text,
          marginBottom: '8px'
        }}>
          YouTube Video URL
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or video ID"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: colors.text,
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleUrlSubmit}
            style={{
              padding: '10px 20px',
              background: colors.accent,
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Load Video
          </button>
        </div>
        <p style={{
          fontSize: '12px',
          color: colors.textMuted,
          marginTop: '8px'
        }}>
          Enter a YouTube URL to test real-time people tracking simulation on the video feed.
        </p>
      </div>

      {/* Video + Overlay Container */}
      {videoId && (
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: `${canvasSize.width}px`,
          margin: '0 auto'
        }}>
          {/* YouTube iframe */}
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&loop=1`}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{
              display: 'block',
              border: 'none',
              borderRadius: '8px'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Tracking Overlay Canvas */}
          {showOverlay && (
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                borderRadius: '8px'
              }}
            />
          )}
        </div>
      )}

      {/* Placeholder when no video */}
      {!videoId && (
        <div style={{
          width: '100%',
          maxWidth: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          margin: '0 auto',
          background: colors.card,
          border: `2px dashed ${colors.border}`,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{ fontSize: '48px', opacity: 0.5 }}>▶</div>
          <div style={{ color: colors.textMuted, fontSize: '14px' }}>
            Enter a YouTube URL above to start tracking
          </div>
        </div>
      )}

      {/* Controls */}
      {videoId && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setIsTracking(!isTracking)}
            style={{
              padding: '10px 20px',
              background: isTracking ? '#ef4444' : colors.success,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {isTracking ? '⏸ Pause Tracking' : '▶ Start Tracking'}
          </button>
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            style={{
              padding: '10px 20px',
              background: showOverlay ? colors.accent : colors.card,
              color: showOverlay ? '#000' : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {showOverlay ? '👁 Overlay On' : '👁 Overlay Off'}
          </button>
          <button
            onClick={() => setShowTrails(!showTrails)}
            style={{
              padding: '10px 20px',
              background: showTrails ? colors.accent : colors.card,
              color: showTrails ? '#000' : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {showTrails ? '〰 Trails On' : '〰 Trails Off'}
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            style={{
              padding: '10px 20px',
              background: showLabels ? colors.accent : colors.card,
              color: showLabels ? '#000' : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {showLabels ? '🏷 Labels On' : '🏷 Labels Off'}
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      {videoId && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginTop: '16px'
        }}>
          {[
            { label: 'People Detected', value: metrics.peopleCount, color: colors.accent },
            { label: 'Frame Rate', value: `${metrics.fps} FPS`, color: colors.success },
            { label: 'Avg Confidence', value: `${(metrics.avgConfidence * 100).toFixed(1)}%`, color: colors.warning },
            { label: 'Total Detections', value: metrics.detections.toLocaleString(), color: '#8b5cf6' }
          ].map(metric => (
            <div key={metric.label} style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: metric.color,
                marginBottom: '4px'
              }}>
                {metric.value}
              </div>
              <div style={{
                fontSize: '11px',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sample Videos */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: colors.text,
          marginBottom: '12px'
        }}>
          Sample Videos for Testing
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { label: 'Crowd Walking', id: 'dQw4w9WgXcQ' },
            { label: 'Shopping Mall', id: 'JGwWNGJdvx8' },
            { label: 'Train Station', id: 'L_LUpnjgPso' },
            { label: 'Street Scene', id: 'oHg5SJYRHA0' }
          ].map(sample => (
            <button
              key={sample.id}
              onClick={() => {
                setUrl(sample.id);
                setVideoId(sample.id);
                setIsTracking(true);
                peopleRef.current = [];
                nextId.current = 1;
              }}
              style={{
                padding: '8px 14px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                color: colors.text,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { extractYouTubeId, CONFIG as YOUTUBE_CONFIG };
