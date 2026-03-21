import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, SkipBack, Upload, Database,
  Users, TrendingUp, Clock, Zap
} from 'lucide-react'
import ProcessingStatus from './ProcessingStatus'

const API_BASE = 'http://localhost:8000'

// Box colors matching existing theme
const BOX_COLORS = [
  '#22d3ee', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#14b8a6', '#a855f7', '#3b82f6'
]

const ZONE_COLORS = {
  entrance: 'rgba(76, 175, 80, 0.2)',
  checkout: 'rgba(244, 67, 54, 0.2)',
  queue: 'rgba(255, 152, 0, 0.2)',
  general: 'rgba(33, 150, 243, 0.2)',
  main_floor: 'rgba(33, 150, 243, 0.2)',
}

const ZONE_BORDER_COLORS = {
  entrance: '#4caf50',
  checkout: '#f44336',
  queue: '#ff9800',
  general: '#2196f3',
  main_floor: '#2196f3',
}

export default function PreProcessedPlayer({ theme = 'dark', onMetricsUpdate }) {
  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [trackingData, setTrackingData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isProcessed, setIsProcessed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [showTrails, setShowTrails] = useState(true)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const animFrameRef = useRef(null)
  const trailsRef = useRef({}) // {trackId: [{x, y}]}

  // Fetch video library
  useEffect(() => {
    fetch(`${API_BASE}/video/library`)
      .then(r => r.json())
      .then(data => setVideos(data.videos || []))
      .catch(() => {})
  }, [])

  // Check if selected video has tracking data
  useEffect(() => {
    if (!selectedVideo) return

    fetch(`${API_BASE}/api/process-status/${selectedVideo.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'completed') {
          setIsProcessed(true)
          loadTrackingData(selectedVideo.id)
        } else if (data.status === 'processing') {
          setIsProcessing(true)
        }
      })
      .catch(() => {})
  }, [selectedVideo])

  const loadTrackingData = useCallback(async (videoId) => {
    try {
      const res = await fetch(`${API_BASE}/api/tracking-data/${videoId}`)
      const data = await res.json()
      setTrackingData(data)
      trailsRef.current = {}

      // Report metrics
      if (onMetricsUpdate && data.metrics) {
        onMetricsUpdate({
          currentCount: 0,
          totalEntries: data.metrics.total_entries || 0,
          totalExits: data.metrics.total_exits || 0,
          peakCount: data.metrics.peak_occupancy || 0,
        })
      }
    } catch (e) {
      console.error('Failed to load tracking data:', e)
    }
  }, [onMetricsUpdate])

  const startProcessing = async () => {
    if (!selectedVideo) return
    setIsProcessing(true)

    try {
      await fetch(`${API_BASE}/api/process-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: selectedVideo.id, skip: 3 })
      })
    } catch (e) {
      console.error('Failed to start processing:', e)
      setIsProcessing(false)
    }
  }

  const onProcessingComplete = useCallback(() => {
    setIsProcessing(false)
    setIsProcessed(true)
    if (selectedVideo) {
      loadTrackingData(selectedVideo.id)
    }
  }, [selectedVideo, loadTrackingData])

  // Canvas rendering loop
  const renderOverlay = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !trackingData) return

    const ctx = canvas.getContext('2d')
    const { videoWidth, videoHeight } = video

    // Match canvas to video dimensions
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth
      canvas.height = videoHeight
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Find current frame in tracking data
    const currentTime = video.currentTime
    const fps = trackingData.fps || 30
    const frameIdx = Math.round(currentTime * fps)
    setCurrentFrame(frameIdx)

    // Find closest frame data
    const frames = trackingData.frames || []
    let frameData = null

    // Binary search for closest frame
    let lo = 0, hi = frames.length - 1
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (frames[mid].frame === frameIdx) {
        frameData = frames[mid]
        break
      } else if (frames[mid].frame < frameIdx) {
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    // Use closest if exact not found
    if (!frameData && frames.length > 0) {
      const closestIdx = Math.min(lo, frames.length - 1)
      frameData = frames[closestIdx]
    }

    if (!frameData) return

    const detections = frameData.detections || []

    // Update metrics
    if (onMetricsUpdate && trackingData.metrics) {
      onMetricsUpdate({
        currentCount: detections.length,
        totalEntries: trackingData.metrics.total_entries || 0,
        totalExits: trackingData.metrics.total_exits || 0,
        peakCount: trackingData.metrics.peak_occupancy || 0,
      })
    }

    // Draw zone overlays
    const zones = [
      { name: 'entrance', x1: 0, y1: 0, x2: 200, y2: 480 },
      { name: 'main_floor', x1: 200, y1: 0, x2: 440, y2: 480 },
      { name: 'queue', x1: 440, y1: 240, x2: 540, y2: 480 },
      { name: 'checkout', x1: 540, y1: 0, x2: 640, y2: 480 },
    ]

    for (const zone of zones) {
      const sx1 = (zone.x1 / 640) * videoWidth
      const sy1 = (zone.y1 / 480) * videoHeight
      const sx2 = (zone.x2 / 640) * videoWidth
      const sy2 = (zone.y2 / 480) * videoHeight

      ctx.fillStyle = ZONE_COLORS[zone.name] || ZONE_COLORS.general
      ctx.fillRect(sx1, sy1, sx2 - sx1, sy2 - sy1)

      ctx.strokeStyle = ZONE_BORDER_COLORS[zone.name] || '#666'
      ctx.lineWidth = 2
      ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1)

      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = `bold ${Math.max(12, videoWidth / 60)}px sans-serif`
      ctx.fillText(zone.name.toUpperCase(), sx1 + 8, sy1 + 20)
    }

    // Draw trails
    if (showTrails) {
      for (const det of detections) {
        const tid = det.id
        const cx = (det.bbox[0] + det.bbox[2]) / 2
        const cy = (det.bbox[1] + det.bbox[3]) / 2

        if (!trailsRef.current[tid]) trailsRef.current[tid] = []
        trailsRef.current[tid].push({ x: cx, y: cy })
        if (trailsRef.current[tid].length > 15) {
          trailsRef.current[tid].shift()
        }

        const trail = trailsRef.current[tid]
        if (trail.length > 1) {
          const color = BOX_COLORS[tid % BOX_COLORS.length]
          ctx.beginPath()
          ctx.moveTo(trail[0].x, trail[0].y)
          for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y)
          }
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.5
          ctx.stroke()
          ctx.globalAlpha = 1.0
        }
      }
    }

    // Draw bounding boxes
    for (const det of detections) {
      const [x1, y1, x2, y2] = det.bbox
      const color = BOX_COLORS[det.id % BOX_COLORS.length]

      // Box
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

      // Label background
      const label = `ID:${det.id}${det.zone ? ` | ${det.zone.toUpperCase()}` : ''}`
      ctx.font = `bold ${Math.max(11, videoWidth / 80)}px sans-serif`
      const textWidth = ctx.measureText(label).width
      const labelHeight = Math.max(18, videoWidth / 50)

      ctx.fillStyle = color
      ctx.fillRect(x1, y1 - labelHeight, textWidth + 10, labelHeight)

      // Label text
      ctx.fillStyle = '#fff'
      ctx.fillText(label, x1 + 4, y1 - 5)
    }

    // Stats panel
    const panelX = 8, panelY = 8
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(panelX, panelY, 200, 60)
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.max(12, videoWidth / 60)}px sans-serif`
    ctx.fillText(`PEOPLE: ${detections.length}`, panelX + 8, panelY + 20)
    ctx.font = `${Math.max(10, videoWidth / 70)}px sans-serif`
    ctx.fillStyle = '#0ff'
    ctx.fillText(`Frame ${frameIdx} / ${trackingData.total_frames}`, panelX + 8, panelY + 38)
    ctx.fillStyle = '#8b5cf6'
    ctx.fillText('PRE-PROCESSED (Roboflow Cloud)', panelX + 8, panelY + 52)

    // Continue animation
    if (!video.paused) {
      animFrameRef.current = requestAnimationFrame(renderOverlay)
    }
  }, [trackingData, showTrails, onMetricsUpdate])

  // Sync rendering with video playback
  useEffect(() => {
    const video = videoRef.current
    if (!video || !trackingData) return

    const onPlay = () => {
      setIsPlaying(true)
      animFrameRef.current = requestAnimationFrame(renderOverlay)
    }
    const onPause = () => {
      setIsPlaying(false)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      renderOverlay() // Render current frame
    }
    const onSeeked = () => renderOverlay()

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('timeupdate', () => {
      if (video.paused) renderOverlay()
    })

    // Initial render
    renderOverlay()

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('seeked', onSeeked)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [trackingData, renderOverlay])

  // ── Video library picker ──────────────────────────────
  if (!selectedVideo) {
    return (
      <div style={{
        padding: '24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '16px', minHeight: '400px', justifyContent: 'center'
      }}>
        <Database size={32} color="var(--navy)" />
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
          Select a Video to Process
        </h3>
        <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
          Choose a video from the library. It will be processed using Roboflow Cloud
          for high-accuracy detection, then played back with tracking overlays.
        </p>

        {videos.length === 0 ? (
          <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
            No videos in library. Upload one first.
          </p>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '8px', width: '100%', maxHeight: '250px', overflowY: 'auto',
            padding: '4px'
          }}>
            {videos.map(v => (
              <motion.button
                key={v.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedVideo(v)}
                style={{
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.2s'
                }}
              >
                <div style={{ fontSize: '0.813rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {v.name || v.id.slice(0, 8)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {v.original_filename || `${v.id.slice(0, 8)}.mp4`}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Processing state ──────────────────────────────────
  if (!isProcessed) {
    return (
      <div style={{
        padding: '24px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '16px', minHeight: '400px', justifyContent: 'center'
      }}>
        {isProcessing ? (
          <ProcessingStatus
            videoId={selectedVideo.id}
            onComplete={onProcessingComplete}
          />
        ) : (
          <>
            <Zap size={32} color="#8b5cf6" />
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Ready to Process: {selectedVideo.name || selectedVideo.id.slice(0, 8)}
            </h3>
            <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center', maxWidth: '400px' }}>
              This will send every 3rd frame to Roboflow's cloud API for person detection,
              then run ByteTrack locally for persistent tracking IDs.
              ~300 API calls for a 30-second video.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startProcessing}
                style={{
                  padding: '10px 24px',
                  background: '#8b5cf6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Zap size={16} />
                Process Video
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedVideo(null); setIsProcessing(false) }}
                style={{
                  padding: '10px 16px',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.813rem'
                }}
              >
                Back
              </motion.button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Replay view ───────────────────────────────────────
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Video + Canvas overlay */}
      <div style={{ position: 'relative', width: '100%', background: '#000' }}>
        <video
          ref={videoRef}
          src={`${API_BASE}/video/library/${selectedVideo.id}/file`}
          style={{ width: '100%', display: 'block' }}
          loop
          muted
          playsInline
          onError={() => {
            // Fallback: try loading directly from filesystem path
            if (videoRef.current && selectedVideo.path) {
              // The backend serves the file, so this is handled by the API
            }
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Playback controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 12px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)'
      }}>
        <button
          onClick={() => {
            const v = videoRef.current
            if (!v) return
            v.paused ? v.play() : v.pause()
          }}
          style={{
            padding: '6px 12px', background: 'var(--navy)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.75rem'
          }}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0
              trailsRef.current = {}
            }
          }}
          style={{
            padding: '6px 8px', background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            color: 'var(--text-secondary)'
          }}
        >
          <SkipBack size={14} />
        </button>

        <label style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer',
          marginLeft: '8px'
        }}>
          <input
            type="checkbox"
            checked={showTrails}
            onChange={e => setShowTrails(e.target.checked)}
            style={{ width: '14px', height: '14px' }}
          />
          Trails
        </label>

        <div style={{ flex: 1 }} />

        {trackingData && (
          <div style={{
            display: 'flex', gap: '12px', fontSize: '0.7rem',
            color: 'var(--text-muted)', fontFamily: 'monospace'
          }}>
            <span style={{ color: '#8b5cf6' }}>
              <Users size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
              {trackingData.metrics?.total_entries || 0} entries
            </span>
            <span style={{ color: '#10b981' }}>
              <TrendingUp size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
              Peak: {trackingData.metrics?.peak_occupancy || 0}
            </span>
            <span style={{ color: '#f59e0b' }}>
              <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
              Avg: {trackingData.metrics?.avg_dwell_time_s || 0}s
            </span>
          </div>
        )}

        <button
          onClick={() => {
            setSelectedVideo(null)
            setTrackingData(null)
            setIsProcessed(false)
            setIsProcessing(false)
            trailsRef.current = {}
          }}
          style={{
            padding: '4px 8px', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-muted)'
          }}
        >
          Change Video
        </button>
      </div>
    </div>
  )
}
