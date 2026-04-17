import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * ZoneDrawer — polygon draw tool for defining camera zones.
 *
 * Props:
 *   width      {number}  Canvas width in pixels (default 640)
 *   height     {number}  Canvas height in pixels (default 480)
 *   imageUrl   {string}  Optional background image URL (camera snapshot)
 *   onSaved    {fn}      Called with zone data after successful POST
 */

const SNAP_RADIUS = 15

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#6366f1'
]

export default function ZoneDrawer({
  width = 640,
  height = 480,
  imageUrl = null,
  onSaved = null
}) {
  const canvasRef = useRef(null)
  const [points, setPoints] = useState([])   // [{x, y}]
  const [closed, setClosed] = useState(false)
  const [zoneName, setZoneName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // ── Draw polygon in progress ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    if (points.length === 0) return

    // Polygon path
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    if (closed) ctx.closePath()

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    if (closed) {
      ctx.globalAlpha = 0.2
      ctx.fillStyle = color
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Snap indicator on first point when >= 3 points placed and not yet closed
    if (!closed && points.length >= 3) {
      ctx.beginPath()
      ctx.arc(points[0].x, points[0].y, SNAP_RADIUS, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Draw vertex dots
    points.forEach((p, i) => {
      const isFirst = i === 0
      ctx.beginPath()
      ctx.arc(p.x, p.y, isFirst ? 7 : 5, 0, Math.PI * 2)
      ctx.fillStyle = isFirst ? '#ffffff' : color
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [points, closed, color, width, height])

  // ── Canvas click: add point or snap-close ────────────────────────────────
  const handleClick = useCallback((e) => {
    if (closed) return
    // Ignore the second click that browser fires before dblclick
    if (e.detail >= 2) return

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)

    setPoints(prev => {
      // Snap-close when >= 3 points and click is near the first point
      if (prev.length >= 3) {
        const dx = x - prev[0].x
        const dy = y - prev[0].y
        if (Math.sqrt(dx * dx + dy * dy) < SNAP_RADIUS) {
          setClosed(true)
          return prev  // don't add a new point
        }
      }
      return [...prev, { x, y }]
    })
    setError(null)
  }, [closed])

  // ── Double-click: close polygon ──────────────────────────────────────────
  const handleDoubleClick = useCallback((e) => {
    if (closed) return
    // In real browser, two click events fire before dblclick — those were
    // already handled (detail:2 was skipped in handleClick, detail:1 added 1 point).
    // We just need >= 3 points to close.
    setPoints(prev => {
      if (prev.length >= 3) {
        setClosed(true)
      }
      return prev
    })
  }, [closed])

  // ── Reset to drawing mode ────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPoints([])
    setClosed(false)
    setZoneName('')
    setError(null)
    setSaving(false)
  }, [])

  // ── Save zone to backend ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!zoneName.trim()) {
      setError('Zone name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const polygon_image = points.map(p => [p.x, p.y])
      const res = await fetch('/api/zones/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_name: zoneName.trim(), polygon_image, color })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Server error ${res.status}`)
      } else {
        onSaved?.(data)
        reset()
      }
    } catch (err) {
      setError(err.message || 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const canClose = points.length >= 3

  return (
    <div data-testid="zone-drawer" style={styles.container}>
      {/* Canvas */}
      <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
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
          data-testid="zone-drawer-canvas"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            cursor: closed ? 'default' : 'crosshair'
          }}
        />
      </div>

      {/* Hint bar — drawing mode */}
      {!closed && (
        <div style={styles.hint}>
          {points.length === 0 && 'Click to place polygon vertices'}
          {points.length === 1 && 'Click to add more points'}
          {points.length === 2 && 'Click to add more points (need 1 more)'}
          {points.length >= 3 && `${points.length} points — double-click or click near start to close`}
        </div>
      )}

      {/* Naming form — after polygon closed */}
      {closed && (
        <div style={styles.form}>
          <div style={styles.formRow}>
            <label style={styles.label}>Zone name</label>
            <input
              type="text"
              data-testid="zone-name-input"
              value={zoneName}
              onChange={e => { setZoneName(e.target.value); setError(null) }}
              placeholder="e.g. Entrance, Zone A"
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.formRow}>
            <label style={styles.label}>Color</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 24, height: 24,
                    borderRadius: 4,
                    background: c,
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                    padding: 0
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              data-testid="zone-save-btn"
              onClick={handleSave}
              disabled={saving}
              style={saving ? { ...styles.btnPrimary, opacity: 0.6 } : styles.btnPrimary}
            >
              {saving ? 'Saving…' : 'Save Zone'}
            </button>
            <button
              data-testid="zone-reset-btn"
              onClick={reset}
              style={styles.btnSecondary}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Reset button while drawing */}
      {!closed && points.length > 0 && (
        <button
          data-testid="zone-reset-btn"
          onClick={reset}
          style={{ ...styles.btnSecondary, marginTop: 8 }}
        >
          Clear
        </button>
      )}

      {/* Error */}
      {error && (
        <div data-testid="zone-drawer-error" style={styles.error}>
          {error}
        </div>
      )}
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container: {
    fontFamily: 'Inter, sans-serif',
    display: 'inline-flex',
    flexDirection: 'column',
    gap: 0
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
  hint: {
    marginTop: 8,
    fontSize: '0.78rem',
    color: '#64748b',
    padding: '6px 10px',
    background: '#0f172a',
    borderRadius: 6,
    border: '1px solid #1e293b'
  },
  form: {
    marginTop: 12,
    padding: '14px 16px',
    background: '#0f172a',
    borderRadius: 8,
    border: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  label: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    fontWeight: 500
  },
  input: {
    padding: '6px 10px',
    fontSize: '0.875rem',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#f1f5f9',
    outline: 'none'
  },
  btnPrimary: {
    padding: '7px 18px',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer'
  },
  btnSecondary: {
    padding: '7px 14px',
    background: 'transparent',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#94a3b8',
    fontSize: '0.875rem',
    cursor: 'pointer'
  },
  error: {
    marginTop: 8,
    padding: '7px 10px',
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 6,
    color: '#fca5a5',
    fontSize: '0.82rem'
  }
}
