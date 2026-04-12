/**
 * Real-Time Person Detection Component
 * Uses TensorFlow.js with COCO-SSD model for actual person detection
 * Supports webcam, video files, and video streams
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  MODEL_BASE: 'lite_mobilenet_v2', // Faster model for real-time
  MIN_SCORE: 0.5, // Minimum confidence threshold
  MAX_DETECTIONS: 20,
  BOX_COLORS: [
    '#22d3ee', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#14b8a6', '#a855f7', '#3b82f6'
  ],
  TRAIL_LENGTH: 15,
  UPDATE_INTERVAL: 100 // ms between detections
};

// ============================================
// PERSON TRACKER (for ID persistence)
// ============================================

class PersonTracker {
  constructor() {
    this.tracks = new Map();
    this.nextId = 1;
    this.maxAge = 10; // frames before track is deleted
  }

  // Calculate IoU (Intersection over Union) for matching
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

    return interArea / unionArea;
  }

  // Update tracks with new detections
  update(detections) {
    const currentTime = Date.now();
    const matched = new Set();
    const results = [];

    // Try to match each detection to existing tracks
    for (const detection of detections) {
      const bbox = detection.bbox;
      let bestMatch = null;
      let bestIoU = 0.3; // Minimum IoU threshold for matching

      for (const [id, track] of this.tracks) {
        if (matched.has(id)) continue;
        const iou = this.calculateIoU(bbox, track.bbox);
        if (iou > bestIoU) {
          bestIoU = iou;
          bestMatch = id;
        }
      }

      if (bestMatch !== null) {
        // Update existing track
        matched.add(bestMatch);
        const track = this.tracks.get(bestMatch);

        // Add to trail
        track.trail.push({
          x: bbox[0] + bbox[2] / 2,
          y: bbox[1] + bbox[3]
        });
        if (track.trail.length > CONFIG.TRAIL_LENGTH) {
          track.trail.shift();
        }

        track.bbox = bbox;
        track.score = detection.score;
        track.lastSeen = currentTime;
        track.age = 0;

        results.push({ ...track, detection });
      } else {
        // Create new track
        const id = this.nextId++;
        const newTrack = {
          id,
          bbox,
          score: detection.score,
          color: CONFIG.BOX_COLORS[id % CONFIG.BOX_COLORS.length],
          trail: [{ x: bbox[0] + bbox[2] / 2, y: bbox[1] + bbox[3] }],
          firstSeen: currentTime,
          lastSeen: currentTime,
          age: 0
        };
        this.tracks.set(id, newTrack);
        results.push({ ...newTrack, detection });
      }
    }

    // Age and remove old tracks
    for (const [id, track] of this.tracks) {
      if (!matched.has(id)) {
        track.age++;
        if (track.age > this.maxAge) {
          this.tracks.delete(id);
        }
      }
    }

    return results;
  }

  reset() {
    this.tracks.clear();
    this.nextId = 1;
  }

  getStats() {
    return {
      activeCount: this.tracks.size,
      totalTracked: this.nextId - 1
    };
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function RealTimeDetection({
  className = '',
  theme = 'dark',
  onMetricsUpdate
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const fileInputRef = useRef(null);
  const trackerRef = useRef(new PersonTracker());
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing TensorFlow.js...');
  const [isRunning, setIsRunning] = useState(false);
  const [source, setSource] = useState('none'); // 'none', 'webcam', 'file', 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
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
    accent: '#22d3ee',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  } : {
    bg: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b',
    accent: '#0891b2',
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

    // Prevent browser from opening dropped files
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

        setLoadingStatus('Loading COCO-SSD model (this may take a moment)...');
        const model = await cocoSsd.load({
          base: CONFIG.MODEL_BASE
        });

        modelRef.current = model;
        setIsLoading(false);
        setLoadingStatus('Model loaded successfully!');
      } catch (error) {
        console.error('Error loading model:', error);
        setLoadingStatus(`Error loading model: ${error.message}`);
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

  // Start webcam
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
      console.error('Error accessing webcam:', error);
      alert('Could not access webcam. Please ensure camera permissions are granted.');
    }
  };

  // Handle file upload from input
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      loadVideoFile(file);
    }
  };

  // Drag and drop handlers
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
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        loadVideoFile(file);
      } else {
        alert('Please drop a video file (.mp4, .webm, .mov, etc.)');
      }
    }
  };

  // Load video from file
  const loadVideoFile = (file) => {
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.srcObject = null;
      setSource('file');
      setIsRunning(true);
    }
  };

  // Stop all sources
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

  // Detection loop
  const detect = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || !canvasRef.current || !isRunning) {
      animationRef.current = requestAnimationFrame(detect);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Ensure video is playing and has dimensions
    if (video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detect);
      return;
    }

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    const startTime = performance.now();

    try {
      // Run detection
      const predictions = await modelRef.current.detect(video, CONFIG.MAX_DETECTIONS, CONFIG.MIN_SCORE);

      // Filter only person detections
      const personDetections = predictions.filter(p => p.class === 'person');

      // Update tracker
      const trackedPeople = trackerRef.current.update(personDetections);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw detections
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

        // Draw bounding box with dynamic size
        ctx.strokeStyle = person.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw corner accents (proportional to box size)
        const cornerSize = Math.min(15, Math.min(width, height) * 0.15);
        ctx.fillStyle = person.color;

        // Top-left corner
        ctx.fillRect(x - 2, y - 2, cornerSize, 4);
        ctx.fillRect(x - 2, y - 2, 4, cornerSize);

        // Top-right corner
        ctx.fillRect(x + width - cornerSize + 2, y - 2, cornerSize, 4);
        ctx.fillRect(x + width - 2, y - 2, 4, cornerSize);

        // Bottom-left corner
        ctx.fillRect(x - 2, y + height - 2, cornerSize, 4);
        ctx.fillRect(x - 2, y + height - cornerSize + 2, 4, cornerSize);

        // Bottom-right corner
        ctx.fillRect(x + width - cornerSize + 2, y + height - 2, cornerSize, 4);
        ctx.fillRect(x + width - 2, y + height - cornerSize + 2, 4, cornerSize);

        // Draw center point
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = person.color;
        ctx.fill();

        // Draw label
        if (showLabels) {
          const label = `ID:${person.id} ${(person.score * 100).toFixed(0)}%`;
          ctx.font = 'bold 12px monospace';
          const textWidth = ctx.measureText(label).width;

          // Label background
          ctx.fillStyle = person.color + 'E0';
          ctx.fillRect(x, y - 22, textWidth + 10, 20);

          // Label text
          ctx.fillStyle = '#000';
          ctx.fillText(label, x + 5, y - 7);

          // Size indicator
          const sizeLabel = `${Math.round(width)}x${Math.round(height)}`;
          ctx.font = '10px monospace';
          ctx.fillStyle = person.color + 'A0';
          ctx.fillRect(x, y + height + 2, ctx.measureText(sizeLabel).width + 8, 16);
          ctx.fillStyle = '#000';
          ctx.fillText(sizeLabel, x + 4, y + height + 14);
        }
      });

      // Draw overlay info
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 200, 90);
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 200, 90);

      ctx.fillStyle = colors.accent;
      ctx.font = 'bold 12px monospace';
      ctx.fillText('JANUS REAL-TIME DETECTION', 20, 28);

      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.fillText(`People: ${trackedPeople.length}`, 20, 48);
      ctx.fillText(`FPS: ${metrics.fps}`, 120, 48);
      ctx.fillText(`Confidence: ${trackedPeople.length > 0 ?
        (trackedPeople.reduce((a, p) => a + p.score, 0) / trackedPeople.length * 100).toFixed(1) : 0}%`, 20, 65);
      ctx.fillText(`Processing: ${metrics.processingTime}ms`, 20, 82);

      // Live indicator
      ctx.beginPath();
      ctx.arc(190, 23, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
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
            totalEntries: trackerRef.current.getStats().totalTracked,
            totalExits: trackerRef.current.getStats().totalTracked - trackerRef.current.getStats().activeCount,
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

  // Start detection loop
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
          <div style={{ marginTop: '8px', color: colors.textMuted, fontSize: '12px' }}>
            TensorFlow.js + COCO-SSD Model
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
          {/* Drag overlay */}
          {isDragging && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${colors.accent}20`,
              borderRadius: '8px',
              zIndex: 10
            }}>
              <div style={{
                padding: '24px 48px',
                background: colors.card,
                borderRadius: '12px',
                border: `2px dashed ${colors.accent}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📥</div>
                <div style={{ color: colors.accent, fontWeight: '600', fontSize: '18px' }}>
                  Drop Video Here
                </div>
              </div>
            </div>
          )}

          <h3 style={{ color: colors.text, marginBottom: '16px', fontSize: '16px' }}>
            Select Video Source
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {/* Webcam Button */}
            <button
              onClick={startWebcam}
              style={{
                padding: '32px 20px',
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                cursor: 'pointer',
                color: colors.text,
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = colors.accent}
              onMouseOut={(e) => e.currentTarget.style.borderColor = colors.border}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📹</div>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Webcam</div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>Live camera feed</div>
            </button>

            {/* Upload Video Button */}
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

          {/* Drag and Drop Zone */}
          <div
            style={{
              padding: '24px',
              background: `${colors.bg}`,
              border: `2px dashed ${colors.border}`,
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '16px',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📥</div>
            <div style={{ color: colors.textMuted, fontSize: '14px' }}>
              <strong style={{ color: colors.text }}>Drag & drop</strong> a video file here
            </div>
            <div style={{ color: colors.textMuted, fontSize: '12px', marginTop: '4px' }}>
              Supports: .mp4, .webm, .mov, .avi
            </div>
          </div>

          <div style={{
            padding: '12px',
            background: colors.bg,
            borderRadius: '6px',
            fontSize: '12px',
            color: colors.textMuted
          }}>
            <strong style={{ color: colors.accent }}>Real ML Detection:</strong> Using TensorFlow.js with COCO-SSD model for actual person detection.
            Bounding boxes dynamically scale to match detected person size.
          </div>
        </div>
      )}

      {/* Video Display - always render video element so ref is available */}
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
              ⏹ Stop
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
              〰 Trails {showTrails ? 'On' : 'Off'}
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
              🏷 Labels {showLabels ? 'On' : 'Off'}
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

export { CONFIG as DETECTION_CONFIG };
