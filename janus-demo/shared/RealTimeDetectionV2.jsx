/**
 * RealTimeDetection V2
 * Unified interface for both tracking pipelines:
 * - Version B: MediaPipe + ByteTrack (40+ FPS, lightweight)
 * - Version C: YOLOv8 + DeepSORT + ReID (9-12 FPS, max accuracy)
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

// Pipeline versions - dynamically imported using Vite aliases
const PIPELINES = {
  B: () => import('@tracking-v-b/JanusVisionPipelineB.js'),
  C: () => import('@tracking-v-c/JanusVisionPipelineC.js')
};

/**
 * Track color generator - consistent colors per ID
 */
const getTrackColor = (id) => {
  const colors = [
    '#00ff88', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95afc0',
    '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#00cec9'
  ];
  return colors[id % colors.length];
};

/**
 * RealTimeDetection Component
 * @param {string} version - 'B' for lightweight, 'C' for max accuracy
 * @param {Object} videoRef - Ref to video element
 * @param {Function} onTrackUpdate - Callback when tracks update
 * @param {Function} onStatsUpdate - Callback for performance stats
 * @param {Object} options - Pipeline configuration options
 */
export function RealTimeDetection({
  version = 'B',
  videoRef,
  canvasRef,
  onTrackUpdate,
  onStatsUpdate,
  onCountUpdate,
  entryLineY = null,
  options = {},
  enabled = true,
  showBboxes = true,
  showIds = true,
  showConfidence = false,
  bboxStyle = 'solid' // 'solid', 'dashed', 'corner'
}) {
  const pipelineRef = useRef(null);
  const animationRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const internalCanvasRef = useRef(null);

  const effectiveCanvasRef = canvasRef || internalCanvasRef;

  // Initialize pipeline
  useEffect(() => {
    let mounted = true;

    async function initPipeline() {
      try {
        setError(null);
        setIsReady(false);

        // Dynamic import of selected pipeline
        const pipelineModule = await PIPELINES[version]();
        const PipelineClass = pipelineModule.default;

        const pipeline = new PipelineClass({
          ...options,
          entryLine: entryLineY ? { y: entryLineY } : null,
          onTrackEnter: (track, direction) => {
            if (onCountUpdate) {
              onCountUpdate({ type: 'enter', track, direction });
            }
          },
          onTrackExit: (track, direction) => {
            if (onCountUpdate) {
              onCountUpdate({ type: 'exit', track, direction });
            }
          }
        });

        await pipeline.initialize();

        if (mounted) {
          pipelineRef.current = pipeline;
          setIsReady(true);
          console.log(`[RealTimeDetection] Pipeline ${version} ready`);
        }
      } catch (err) {
        console.error('[RealTimeDetection] Initialization error:', err);
        if (mounted) {
          setError(err.message || 'Failed to initialize detection pipeline');
        }
      }
    }

    initPipeline();

    return () => {
      mounted = false;
      if (pipelineRef.current) {
        pipelineRef.current.dispose();
        pipelineRef.current = null;
      }
    };
  }, [version, JSON.stringify(options)]);

  // Set entry line when it changes
  useEffect(() => {
    if (pipelineRef.current && entryLineY !== null) {
      pipelineRef.current.setEntryLine(entryLineY);
    }
  }, [entryLineY]);

  // Process frame function
  const processFrame = useCallback(async () => {
    if (!pipelineRef.current || !videoRef?.current || !enabled) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    if (video.paused || video.ended || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      // Process frame through pipeline
      const result = await pipelineRef.current.processFrame(video);

      // Update stats
      if (result.stats) {
        setStats(result.stats);
        if (onStatsUpdate) {
          onStatsUpdate(result.stats);
        }
      }

      // Notify track updates
      if (onTrackUpdate) {
        onTrackUpdate(result.tracks, result.detections);
      }

      // Draw on canvas
      if (effectiveCanvasRef.current && showBboxes) {
        drawTracks(
          effectiveCanvasRef.current,
          video,
          result.tracks,
          result.detections,
          entryLineY
        );
      }
    } catch (err) {
      console.error('[RealTimeDetection] Processing error:', err);
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [enabled, showBboxes, entryLineY, onTrackUpdate, onStatsUpdate]);

  // Start/stop processing loop
  useEffect(() => {
    if (isReady && enabled) {
      animationRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isReady, enabled, processFrame]);

  // Draw tracks on canvas
  const drawTracks = (canvas, video, tracks, detections, lineY) => {
    const ctx = canvas.getContext('2d');
    const { videoWidth, videoHeight } = video;

    // Match canvas size to video
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw entry line if configured
    if (lineY !== null) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(canvas.width, lineY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw each track
    for (const track of tracks) {
      const [x1, y1, x2, y2] = track.bbox;
      const color = getTrackColor(track.id);

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      if (bboxStyle === 'corner') {
        // Corner-style bbox
        const cornerLength = Math.min((x2 - x1) * 0.2, (y2 - y1) * 0.2, 15);
        ctx.beginPath();
        // Top-left
        ctx.moveTo(x1, y1 + cornerLength);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1 + cornerLength, y1);
        // Top-right
        ctx.moveTo(x2 - cornerLength, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y1 + cornerLength);
        // Bottom-right
        ctx.moveTo(x2, y2 - cornerLength);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2 - cornerLength, y2);
        // Bottom-left
        ctx.moveTo(x1 + cornerLength, y2);
        ctx.lineTo(x1, y2);
        ctx.lineTo(x1, y2 - cornerLength);
        ctx.stroke();
      } else if (bboxStyle === 'dashed') {
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.setLineDash([]);
      } else {
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      }

      // Draw ID label
      if (showIds) {
        const label = showConfidence && track.score
          ? `#${track.id} (${Math.round(track.score * 100)}%)`
          : `#${track.id}`;

        ctx.font = 'bold 14px sans-serif';
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = 16;

        // Background
        ctx.fillStyle = color;
        ctx.fillRect(x1, y1 - textHeight - 2, textWidth + 8, textHeight + 2);

        // Text
        ctx.fillStyle = '#000';
        ctx.fillText(label, x1 + 4, y1 - 4);
      }
    }

    // Draw FPS counter
    if (stats) {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#00ff00';
      ctx.fillText(`FPS: ${stats.fps} | Tracks: ${tracks.length}`, 10, 20);
    }
  };

  // Render overlay canvas if not provided externally
  if (error) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#ff6b6b',
        padding: 20,
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: 24, marginBottom: 10 }}>Detection Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!canvasRef) {
    return (
      <canvas
        ref={internalCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    );
  }

  return null;
}

/**
 * Hook for using the detection pipeline imperatively
 */
export function useDetectionPipeline(version = 'B', options = {}) {
  const pipelineRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const pipelineModule = await PIPELINES[version]();
        const PipelineClass = pipelineModule.default;
        const pipeline = new PipelineClass(options);
        await pipeline.initialize();

        if (mounted) {
          pipelineRef.current = pipeline;
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (pipelineRef.current) {
        pipelineRef.current.dispose();
      }
    };
  }, [version]);

  const processFrame = useCallback(async (frame, timestamp) => {
    if (!pipelineRef.current) return null;
    return pipelineRef.current.processFrame(frame, timestamp);
  }, []);

  const reset = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.reset();
    }
  }, []);

  const getStats = useCallback(() => {
    if (pipelineRef.current) {
      return pipelineRef.current.getStats();
    }
    return null;
  }, []);

  return {
    isReady,
    error,
    processFrame,
    reset,
    getStats,
    pipeline: pipelineRef.current
  };
}

/**
 * Version selector component
 */
export function PipelineSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => onChange('B')}
        style={{
          padding: '8px 16px',
          backgroundColor: value === 'B' ? '#4ecdc4' : '#2d3436',
          color: value === 'B' ? '#000' : '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        Version B (Fast)
      </button>
      <button
        onClick={() => onChange('C')}
        style={{
          padding: '8px 16px',
          backgroundColor: value === 'C' ? '#6c5ce7' : '#2d3436',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        Version C (Accurate)
      </button>
    </div>
  );
}

export default RealTimeDetection;
