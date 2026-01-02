/**
 * Enhanced Real-Time Person Detection Component
 * Uses TensorFlow.js with COCO-SSD model + ByteTrack-style improvements
 *
 * Improvements over Standard:
 * - ByteTrack-style low-confidence detection matching (reduces flickering)
 * - Kalman filter for motion prediction (smoother boxes)
 * - Extended maxAge (30 frames vs 10) for better occlusion handling
 * - EMA smoothing on bounding boxes (eliminates jitter)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// ============================================
// CONFIGURATION - Enhanced settings
// ============================================

const CONFIG = {
  MODEL_BASE: 'lite_mobilenet_v2',
  HIGH_CONF_THRESHOLD: 0.5,    // High confidence threshold
  LOW_CONF_THRESHOLD: 0.25,    // Low confidence for ByteTrack second pass
  MAX_DETECTIONS: 30,
  BOX_COLORS: [
    '#22d3ee', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#14b8a6', '#a855f7', '#3b82f6'
  ],
  TRAIL_LENGTH: 20,
  UPDATE_INTERVAL: 100,
  // Enhanced tracking settings
  MAX_AGE: 30,                 // Frames before track is deleted (was 10)
  MIN_HITS: 2,                 // Min detections before track is confirmed
  IOU_THRESHOLD_HIGH: 0.3,     // IoU threshold for high-conf matching
  IOU_THRESHOLD_LOW: 0.2,      // IoU threshold for low-conf matching
  SMOOTHING_ALPHA: 0.7,        // EMA smoothing factor (0.7 = 70% new, 30% old)
  KALMAN_PROCESS_NOISE: 0.1,
  KALMAN_MEASUREMENT_NOISE: 1.0
};

// ============================================
// KALMAN FILTER for motion prediction
// ============================================

class SimpleKalmanFilter {
  constructor() {
    // State: [x, y, w, h, vx, vy]
    this.state = null;
    this.P = 100; // Initial uncertainty
    this.Q = CONFIG.KALMAN_PROCESS_NOISE; // Process noise
    this.R = CONFIG.KALMAN_MEASUREMENT_NOISE; // Measurement noise
  }

  init(bbox) {
    const [x, y, w, h] = bbox;
    this.state = {
      x: x + w / 2,  // Center x
      y: y + h / 2,  // Center y
      w,
      h,
      vx: 0,
      vy: 0
    };
    this.P = 100;
  }

  predict() {
    if (!this.state) return null;

    // Predict new position based on velocity
    this.state.x += this.state.vx;
    this.state.y += this.state.vy;

    // Increase uncertainty
    this.P += this.Q;

    return this.getBbox();
  }

  update(bbox) {
    if (!this.state) {
      this.init(bbox);
      return this.getBbox();
    }

    const [x, y, w, h] = bbox;
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Kalman gain
    const K = this.P / (this.P + this.R);

    // Update velocity estimate
    this.state.vx = K * (cx - this.state.x) + (1 - K) * this.state.vx;
    this.state.vy = K * (cy - this.state.y) + (1 - K) * this.state.vy;

    // Update position and size
    this.state.x = this.state.x + K * (cx - this.state.x);
    this.state.y = this.state.y + K * (cy - this.state.y);
    this.state.w = this.state.w + K * (w - this.state.w);
    this.state.h = this.state.h + K * (h - this.state.h);

    // Update uncertainty
    this.P = (1 - K) * this.P;

    return this.getBbox();
  }

  getBbox() {
    if (!this.state) return null;
    return [
      this.state.x - this.state.w / 2,
      this.state.y - this.state.h / 2,
      this.state.w,
      this.state.h
    ];
  }
}

// ============================================
// BBOX SMOOTHER (EMA)
// ============================================

class BBoxSmoother {
  constructor(alpha = CONFIG.SMOOTHING_ALPHA) {
    this.alpha = alpha;
    this.lastBbox = null;
  }

  smooth(bbox) {
    if (!this.lastBbox) {
      this.lastBbox = [...bbox];
      return bbox;
    }

    const smoothed = bbox.map((val, i) =>
      this.alpha * val + (1 - this.alpha) * this.lastBbox[i]
    );

    this.lastBbox = smoothed;
    return smoothed;
  }

  reset() {
    this.lastBbox = null;
  }
}

// ============================================
// ENHANCED PERSON TRACKER (ByteTrack-style)
// ============================================

class EnhancedPersonTracker {
  constructor() {
    this.tracks = new Map();
    this.nextId = 1;
    this.maxAge = CONFIG.MAX_AGE;
    this.minHits = CONFIG.MIN_HITS;
  }

  calculateIoU(box1, box2) {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;

    const xA = Math.max(x1, x2);
    const yA = Math.max(y1, y2);
    const xB = Math.min(x1 + w1, x2 + w2);
    const yB = Math.min(y1 + h1, y2 + h2);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;
    const unionArea = box1Area + box2Area - interArea;

    return unionArea > 0 ? interArea / unionArea : 0;
  }

  // ByteTrack-style two-pass matching
  update(allDetections) {
    const currentTime = Date.now();

    // Split detections by confidence
    const highConfDetections = allDetections.filter(d => d.score >= CONFIG.HIGH_CONF_THRESHOLD);
    const lowConfDetections = allDetections.filter(d =>
      d.score >= CONFIG.LOW_CONF_THRESHOLD && d.score < CONFIG.HIGH_CONF_THRESHOLD
    );

    const matchedTracks = new Set();
    const matchedDetections = new Set();
    const results = [];

    // ===== FIRST PASS: Match high-confidence detections =====
    for (let di = 0; di < highConfDetections.length; di++) {
      const detection = highConfDetections[di];
      const bbox = detection.bbox;
      let bestMatch = null;
      let bestIoU = CONFIG.IOU_THRESHOLD_HIGH;

      for (const [id, track] of this.tracks) {
        if (matchedTracks.has(id)) continue;

        // Use predicted position for matching
        const predictedBbox = track.kalman.predict() || track.bbox;
        const iou = this.calculateIoU(bbox, predictedBbox);

        if (iou > bestIoU) {
          bestIoU = iou;
          bestMatch = id;
        }
      }

      if (bestMatch !== null) {
        matchedTracks.add(bestMatch);
        matchedDetections.add(di);
        this.updateTrack(bestMatch, detection, currentTime);
      }
    }

    // ===== SECOND PASS: Match low-confidence to unmatched tracks =====
    // This is the KEY ByteTrack improvement - prevents flickering
    const unmatchedTracks = [...this.tracks.keys()].filter(id => !matchedTracks.has(id));

    for (const detection of lowConfDetections) {
      const bbox = detection.bbox;
      let bestMatch = null;
      let bestIoU = CONFIG.IOU_THRESHOLD_LOW;

      for (const trackId of unmatchedTracks) {
        if (matchedTracks.has(trackId)) continue;

        const track = this.tracks.get(trackId);
        const predictedBbox = track.kalman.predict() || track.bbox;
        const iou = this.calculateIoU(bbox, predictedBbox);

        if (iou > bestIoU) {
          bestIoU = iou;
          bestMatch = trackId;
        }
      }

      if (bestMatch !== null) {
        matchedTracks.add(bestMatch);
        this.updateTrack(bestMatch, detection, currentTime);
      }
    }

    // ===== Create new tracks for unmatched high-conf detections =====
    for (let di = 0; di < highConfDetections.length; di++) {
      if (matchedDetections.has(di)) continue;

      const detection = highConfDetections[di];
      const id = this.nextId++;

      const newTrack = {
        id,
        bbox: detection.bbox,
        score: detection.score,
        color: CONFIG.BOX_COLORS[id % CONFIG.BOX_COLORS.length],
        trail: [{
          x: detection.bbox[0] + detection.bbox[2] / 2,
          y: detection.bbox[1] + detection.bbox[3]
        }],
        firstSeen: currentTime,
        lastSeen: currentTime,
        age: 0,
        hits: 1,
        confirmed: false,
        kalman: new SimpleKalmanFilter(),
        smoother: new BBoxSmoother()
      };

      newTrack.kalman.init(detection.bbox);
      this.tracks.set(id, newTrack);
    }

    // ===== Age unmatched tracks and remove old ones =====
    for (const [id, track] of this.tracks) {
      if (!matchedTracks.has(id)) {
        track.age++;
        // Use Kalman prediction to maintain position during occlusion
        const predictedBbox = track.kalman.predict();
        if (predictedBbox) {
          track.bbox = predictedBbox;
        }

        if (track.age > this.maxAge) {
          this.tracks.delete(id);
        }
      }
    }

    // ===== Build results (only confirmed tracks) =====
    for (const [id, track] of this.tracks) {
      if (track.confirmed || track.hits >= this.minHits) {
        track.confirmed = true;
        results.push({ ...track });
      }
    }

    return results;
  }

  updateTrack(trackId, detection, currentTime) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    // Update with Kalman filter
    const filteredBbox = track.kalman.update(detection.bbox);

    // Apply EMA smoothing
    const smoothedBbox = track.smoother.smooth(filteredBbox);

    // Update trail
    track.trail.push({
      x: smoothedBbox[0] + smoothedBbox[2] / 2,
      y: smoothedBbox[1] + smoothedBbox[3]
    });
    if (track.trail.length > CONFIG.TRAIL_LENGTH) {
      track.trail.shift();
    }

    track.bbox = smoothedBbox;
    track.score = detection.score;
    track.lastSeen = currentTime;
    track.age = 0;
    track.hits++;
  }

  reset() {
    this.tracks.clear();
    this.nextId = 1;
  }

  getStats() {
    const confirmed = [...this.tracks.values()].filter(t => t.confirmed).length;
    return {
      activeCount: confirmed,
      totalTracked: this.nextId - 1,
      pendingCount: this.tracks.size - confirmed
    };
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function RealTimeDetectionEnhanced({
  className = '',
  theme = 'dark',
  onMetricsUpdate
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const fileInputRef = useRef(null);
  const trackerRef = useRef(new EnhancedPersonTracker());
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing TensorFlow.js...');
  const [isRunning, setIsRunning] = useState(false);
  const [source, setSource] = useState('none');
  const [isDragging, setIsDragging] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [metrics, setMetrics] = useState({
    peopleCount: 0,
    fps: 0,
    avgConfidence: 0,
    totalDetections: 0,
    processingTime: 0
  });

  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const totalDetectionsRef = useRef(0);

  const colors = theme === 'dark' ? {
    bg: '#0f172a',
    card: '#1e293b',
    border: '#334155',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accent: '#10b981', // Green accent for Enhanced mode
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  } : {
    bg: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b',
    accent: '#059669',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626'
  };

  // Prevent default browser file drop behavior
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);
    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  // Load the COCO-SSD model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoadingStatus('Loading TensorFlow.js backend...');
        await tf.ready();

        setLoadingStatus('Loading COCO-SSD model with Enhanced Tracking...');
        const model = await cocoSsd.load({
          base: CONFIG.MODEL_BASE
        });

        modelRef.current = model;
        setIsLoading(false);
        setLoadingStatus('Enhanced model loaded!');
      } catch (error) {
        console.error('Error loading model:', error);
        setLoadingStatus(`Error: ${error.message}`);
      }
    };

    loadModel();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setSource('webcam');
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Webcam error:', error);
      alert('Could not access webcam.');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) loadVideoFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length > 0 && files[0].type.startsWith('video/')) {
      loadVideoFile(files[0]);
    }
  };

  const loadVideoFile = (file) => {
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.srcObject = null;
      setSource('file');
      setIsRunning(true);
    }
  };

  const stopSource = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    setSource('none');
    setIsRunning(false);
    trackerRef.current.reset();
  };

  // Detection loop with low-confidence detection for ByteTrack
  const detect = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || !canvasRef.current || !isRunning) {
      animationRef.current = requestAnimationFrame(detect);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detect);
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    const startTime = performance.now();

    try {
      // Get ALL detections including low-confidence ones
      const predictions = await modelRef.current.detect(
        video,
        CONFIG.MAX_DETECTIONS,
        CONFIG.LOW_CONF_THRESHOLD // Use lower threshold to get more candidates
      );

      const personDetections = predictions.filter(p => p.class === 'person');
      const trackedPeople = trackerRef.current.update(personDetections);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw tracked people
      trackedPeople.forEach(person => {
        const [x, y, width, height] = person.bbox;

        // Draw trail
        if (showTrails && person.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(person.trail[0].x, person.trail[0].y);
          for (let i = 1; i < person.trail.length; i++) {
            ctx.lineTo(person.trail[i].x, person.trail[i].y);
          }
          ctx.strokeStyle = person.color + '60';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Draw smooth bounding box
        ctx.strokeStyle = person.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Corner accents
        const cornerSize = Math.min(15, Math.min(width, height) * 0.15);
        ctx.fillStyle = person.color;
        ctx.fillRect(x - 2, y - 2, cornerSize, 4);
        ctx.fillRect(x - 2, y - 2, 4, cornerSize);
        ctx.fillRect(x + width - cornerSize + 2, y - 2, cornerSize, 4);
        ctx.fillRect(x + width - 2, y - 2, 4, cornerSize);
        ctx.fillRect(x - 2, y + height - 2, cornerSize, 4);
        ctx.fillRect(x - 2, y + height - cornerSize + 2, 4, cornerSize);
        ctx.fillRect(x + width - cornerSize + 2, y + height - 2, cornerSize, 4);
        ctx.fillRect(x + width - 2, y + height - cornerSize + 2, 4, cornerSize);

        // Center point
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = person.color;
        ctx.fill();

        // Label
        if (showLabels) {
          const label = `ID:${person.id} ${(person.score * 100).toFixed(0)}%`;
          ctx.font = 'bold 12px monospace';
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = person.color + 'E0';
          ctx.fillRect(x, y - 22, textWidth + 10, 20);
          ctx.fillStyle = '#000';
          ctx.fillText(label, x + 5, y - 7);
        }
      });

      // Enhanced overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(10, 10, 220, 100);
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 220, 100);

      ctx.fillStyle = colors.accent;
      ctx.font = 'bold 12px monospace';
      ctx.fillText('JANUS ENHANCED DETECTION', 20, 28);

      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.fillText(`People: ${trackedPeople.length}`, 20, 48);
      ctx.fillText(`FPS: ${metrics.fps}`, 130, 48);

      const stats = trackerRef.current.getStats();
      ctx.fillText(`Tracked: ${stats.totalTracked}`, 20, 65);
      ctx.fillText(`Pending: ${stats.pendingCount}`, 130, 65);

      ctx.fillStyle = '#10b981';
      ctx.fillText(`ByteTrack + Kalman`, 20, 82);
      ctx.fillText(`maxAge: ${CONFIG.MAX_AGE}`, 20, 96);

      // Live indicator
      ctx.beginPath();
      ctx.arc(210, 23, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      // Update metrics
      const processingTime = Math.round(performance.now() - startTime);
      frameCountRef.current++;
      totalDetectionsRef.current += trackedPeople.length;

      const now = Date.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        const fps = Math.round(frameCountRef.current / ((now - lastFpsTimeRef.current) / 1000));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;

        const avgConfidence = trackedPeople.length > 0 ?
          trackedPeople.reduce((a, p) => a + p.score, 0) / trackedPeople.length : 0;

        const newMetrics = {
          peopleCount: trackedPeople.length,
          fps,
          avgConfidence,
          totalDetections: totalDetectionsRef.current,
          processingTime
        };

        setMetrics(newMetrics);

        if (onMetricsUpdate) {
          onMetricsUpdate({
            currentCount: trackedPeople.length,
            totalEntries: stats.totalTracked,
            totalExits: 0,
            peakCount: Math.max(trackedPeople.length, newMetrics.peopleCount),
            fps,
            avgConfidence
          });
        }
      }
    } catch (error) {
      console.error('Detection error:', error);
    }

    animationRef.current = requestAnimationFrame(detect);
  }, [isRunning, showTrails, showLabels, colors, metrics.fps, onMetricsUpdate]);

  useEffect(() => {
    if (isRunning && modelRef.current) {
      animationRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, detect]);

  return (
    <div className={className} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Loading State */}
      {isLoading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          background: colors.card,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.accent,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ marginTop: '20px', color: colors.text, fontSize: '14px' }}>
            {loadingStatus}
          </div>
          <div style={{ marginTop: '8px', color: colors.accent, fontSize: '12px', fontWeight: '600' }}>
            Enhanced Mode: ByteTrack + Kalman Filter
          </div>
        </div>
      )}

      {/* Source Selection */}
      {!isLoading && source === 'none' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            background: colors.card,
            border: `2px ${isDragging ? 'dashed' : 'solid'} ${isDragging ? colors.accent : colors.border}`,
            borderRadius: '8px',
            padding: '24px',
            transition: 'all 0.2s',
            ...(isDragging && { background: `${colors.accent}10` })
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: colors.text, fontSize: '16px', margin: 0 }}>
              Enhanced Detection
            </h3>
            <span style={{
              background: colors.accent,
              color: '#000',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '700'
            }}>
              BYTETRACK
            </span>
          </div>

          <div style={{
            padding: '12px',
            background: `${colors.accent}15`,
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '12px',
            color: colors.textMuted,
            borderLeft: `3px solid ${colors.accent}`
          }}>
            <strong style={{ color: colors.accent }}>Improvements:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
              <li>ByteTrack low-confidence matching (reduces flickering)</li>
              <li>Kalman filter for motion prediction</li>
              <li>30-frame occlusion tolerance (3x longer)</li>
              <li>EMA smoothing for stable boxes</li>
            </ul>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <button
              onClick={startWebcam}
              style={{
                padding: '32px 20px',
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                color: colors.text,
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = colors.accent}
              onMouseOut={(e) => e.currentTarget.style.borderColor = colors.border}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📹</div>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Webcam</div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>Live camera feed</div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '32px 20px',
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                color: colors.text,
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = colors.accent}
              onMouseOut={(e) => e.currentTarget.style.borderColor = colors.border}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Upload Video</div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>Click or drag & drop</div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}

      {/* Video Display */}
      <div style={{ display: (!isLoading && source !== 'none') ? 'block' : 'none' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            loop={source === 'file'}
            style={{
              width: '100%',
              maxWidth: '800px',
              borderRadius: '8px',
              background: '#000'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              maxWidth: '800px',
              borderRadius: '8px',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            onClick={stopSource}
            style={{
              padding: '10px 20px',
              background: colors.danger,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Stop
          </button>
          <button
            onClick={() => setShowTrails(!showTrails)}
            style={{
              padding: '10px 20px',
              background: showTrails ? colors.accent : colors.card,
              color: showTrails ? '#000' : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Trails {showTrails ? 'On' : 'Off'}
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            style={{
              padding: '10px 20px',
              background: showLabels ? colors.accent : colors.card,
              color: showLabels ? '#000' : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Labels {showLabels ? 'On' : 'Off'}
          </button>
        </div>

        {/* Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px'
        }}>
          {[
            { label: 'People', value: metrics.peopleCount, color: colors.accent },
            { label: 'FPS', value: metrics.fps, color: colors.success },
            { label: 'Confidence', value: `${(metrics.avgConfidence * 100).toFixed(0)}%`, color: colors.warning },
            { label: 'Processing', value: `${metrics.processingTime}ms`, color: '#8b5cf6' },
            { label: 'Total', value: metrics.totalDetections, color: '#ec4899' }
          ].map(m => (
            <div key={m.label} style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: m.color }}>
                {m.value}
              </div>
              <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase' }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { CONFIG as ENHANCED_CONFIG };
