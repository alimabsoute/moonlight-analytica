import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * CalibrationView — click-to-calibrate UI for camera homography.
 *
 * Props:
 *   cameraId  {string}  Camera identifier sent to POST /api/calibration/<cameraId>
 *   width     {number}  Canvas width in pixels  (default 640)
 *   height    {number}  Canvas height in pixels (default 480)
 *   imageUrl  {string}  Optional background image URL (camera snapshot)
 *   onSaved   {fn}      Called with { matrix, reprojection_error } on success
 */
export default function CalibrationView({
  cameraId = 'default',
  width = 640,
  height = 480,
  imageUrl = null,
  onSaved = null
}) {
  const canvasRef = useRef(null)

  // Each point: { px, py, wx: '', wy: '' }
  const [points, setPoints] = useState([])
  const [calibResult, setCalibResult] = useState(null) // { reprojection_error, matrix }
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // ── Draw dots on canvas whenever points change ──────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    points.forEach(({ px, py }, idx) => {
      // Outer ring
      ctx.beginPath()
      ctx.arc(px, py, 9, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,191,255,0.25)'
      ctx.fill()

      // Inner dot
      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#00bfff'
      ctx.fill()

      // Index label
      ctx.font = 'bold 11px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(idx + 1, px, py)
    })
  }, [points, width, height])

  // ── Handle canvas click ─────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = Math.round(e.clientX - rect.left)
    const py = Math.round(e.clientY - rect.top)
    setPoints(prev => [...prev, { px, py, wx: '', wy: '' }])
    setCalibResult(null)
    setError(null)
  }, [])

  // ── Update world-coord input for a point ────────────────────────────────
  const updateWorld = (idx, field, value) => {
    setPoints(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  // ── Remove last point ───────────────────────────────────────────────────
  const removeLastPoint = () => {
    setPoints(prev => prev.slice(0, -1))
    setCalibResult(null)
  }

  // ── Reset all ───────────────────────────────────────────────────────────
  const reset = () => {
    setPoints([])
    setCalibResult(null)
    setError(null)
  }

  // ── POST calibration to backend ─────────────────────────────────────────
  const calibrate = async () => {
    setError(null)
    setCalibResult(null)
    setLoading(true)

    const imagePoints  = points.map(p => [p.px, p.py])
    const worldPoints  = points.map(p => [parseFloat(p.wx), parseFloat(p.wy)])

    const invalid = worldPoints.some(([wx, wy]) => isNaN(wx) || isNaN(wy))
    if (invalid) {
      setError('All world coordinates must be valid numbers.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/calibration/${cameraId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_points: imagePoints, world_points: worldPoints })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Server error ${res.status}`)
      } else {
        setCalibResult(data)
        onSaved?.(data)
      }
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const canCalibrate = points.length >= 4

  return (
    <div data-testid="calibration-view" style={styles.container}>
      <h3 style={styles.heading}>Camera Calibration</h3>
      <p style={styles.hint}>
        Click <strong>4 or more</strong> points on the camera feed, then enter their real-world
        coordinates (metres) to compute the homography matrix.
      </p>

      {/* ── Canvas ── */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Camera feed"
            width={width}
            height={height}
            style={{ display: 'block', userSelect: 'none' }}
            draggable={false}
          />
        )}
        {!imageUrl && (
          <div style={{ ...styles.placeholder, width, height }}>
            <span style={styles.placeholderText}>Camera feed / snapshot</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          data-testid="calibration-canvas"
          onClick={handleClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            cursor: 'crosshair'
          }}
        />
      </div>

      {/* ── Point list with world-coord inputs ── */}
      {points.length > 0 && (
        <div style={styles.pointList}>
          <div style={styles.pointListHeader}>
            <span style={styles.subHeading}>Reference points</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={removeLastPoint} style={styles.btnSecondary}>
                Undo last
              </button>
              <button onClick={reset} style={styles.btnSecondary}>
                Reset
              </button>
            </div>
          </div>

          {points.map((pt, idx) => (
            <div key={idx} style={styles.pointRow}>
              <span style={styles.pointIndex}>{idx + 1}</span>

              <span style={styles.pixelCoords}>
                px ({pt.px}, {pt.py})
              </span>

              <label style={styles.label}>World X (m)</label>
              <input
                type="number"
                placeholder="World X"
                value={pt.wx}
                onChange={e => updateWorld(idx, 'wx', e.target.value)}
                style={styles.input}
                step="0.01"
              />

              <label style={styles.label}>World Y (m)</label>
              <input
                type="number"
                placeholder="World Y"
                value={pt.wy}
                onChange={e => updateWorld(idx, 'wy', e.target.value)}
                style={styles.input}
                step="0.01"
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Calibrate button ── */}
      {canCalibrate && (
        <button
          onClick={calibrate}
          disabled={loading}
          style={loading ? { ...styles.btnPrimary, opacity: 0.6 } : styles.btnPrimary}
        >
          {loading ? 'Calibrating…' : 'Calibrate'}
        </button>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={styles.error} data-testid="calibration-error">
          {error}
        </div>
      )}

      {/* ── Result ── */}
      {calibResult && (
        <div style={styles.result} data-testid="calibration-result">
          <span style={styles.resultLabel}>Reprojection error:</span>
          <span style={styles.resultValue}>
            {calibResult.reprojection_error.toFixed(3)} px
          </span>
          {calibResult.reprojection_error < 2 && (
            <span style={styles.badge('good')}>Excellent</span>
          )}
          {calibResult.reprojection_error >= 2 && calibResult.reprojection_error < 5 && (
            <span style={styles.badge('ok')}>Acceptable</span>
          )}
          {calibResult.reprojection_error >= 5 && (
            <span style={styles.badge('bad')}>High — re-calibrate</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Inline styles (no CSS import needed) ──────────────────────────────────
const styles = {
  container: {
    fontFamily: 'Inter, sans-serif',
    maxWidth: 720,
    padding: '1.5rem',
    background: '#111',
    color: '#e2e8f0',
    borderRadius: 10,
    border: '1px solid #1e293b'
  },
  heading: {
    fontSize: '1.1rem',
    fontWeight: 700,
    margin: '0 0 0.5rem',
    color: '#f8fafc'
  },
  subHeading: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#94a3b8'
  },
  hint: {
    fontSize: '0.82rem',
    color: '#94a3b8',
    margin: '0 0 1rem'
  },
  placeholder: {
    background: '#1e293b',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderText: {
    color: '#475569',
    fontSize: '0.8rem'
  },
  pointList: {
    marginTop: '1rem',
    background: '#0f172a',
    borderRadius: 8,
    padding: '0.75rem 1rem'
  },
  pointListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  pointRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 0',
    borderBottom: '1px solid #1e293b'
  },
  pointIndex: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#00bfff',
    color: '#000',
    fontSize: '0.7rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  pixelCoords: {
    fontSize: '0.75rem',
    color: '#64748b',
    width: 90,
    flexShrink: 0
  },
  label: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    whiteSpace: 'nowrap'
  },
  input: {
    width: 80,
    padding: '3px 6px',
    fontSize: '0.82rem',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#f1f5f9',
    outline: 'none'
  },
  btnPrimary: {
    marginTop: '1rem',
    padding: '0.5rem 1.5rem',
    background: '#00bfff',
    color: '#000',
    border: 'none',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer'
  },
  btnSecondary: {
    padding: '2px 10px',
    background: 'transparent',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#94a3b8',
    fontSize: '0.75rem',
    cursor: 'pointer'
  },
  error: {
    marginTop: '0.75rem',
    padding: '0.5rem 0.75rem',
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 6,
    color: '#fca5a5',
    fontSize: '0.82rem'
  },
  result: {
    marginTop: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0.5rem 0.75rem',
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.35)',
    borderRadius: 6
  },
  resultLabel: {
    fontSize: '0.82rem',
    color: '#94a3b8'
  },
  resultValue: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#10b981'
  },
  badge: (quality) => ({
    padding: '2px 8px',
    borderRadius: 99,
    fontSize: '0.7rem',
    fontWeight: 600,
    background: quality === 'good' ? 'rgba(16,185,129,0.2)'
               : quality === 'ok'   ? 'rgba(234,179,8,0.2)'
               : 'rgba(239,68,68,0.2)',
    color: quality === 'good' ? '#10b981'
           : quality === 'ok' ? '#eab308'
           : '#ef4444'
  })
}
