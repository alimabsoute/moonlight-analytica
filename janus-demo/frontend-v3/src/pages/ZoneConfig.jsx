import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Edit2, Save, X, Move, Maximize2,
  Copy, Eye, EyeOff, Lock, Unlock, Settings, Palette, PenTool
} from 'lucide-react'
import ZoneDrawer from '../components/ZoneDrawer'

const API = 'http://localhost:8000'

/** Convert polygon_image [[x,y],...] to axis-aligned bounding box for canvas display. */
export function polygonToBBox(polygon) {
  if (!polygon || polygon.length === 0) return { x: 0, y: 0, width: 100, height: 100 }
  const xs = polygon.map(p => p[0])
  const ys = polygon.map(p => p[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

/** Map an API zone to the internal display format used by the canvas + ZoneCard. */
function apiZoneToDisplay(apiZone) {
  const bbox = polygonToBBox(apiZone.polygon_image)
  return {
    id: apiZone.id,
    name: apiZone.name || apiZone.zone_name,
    color: apiZone.color || '#4dd8e6',
    capacity: apiZone.capacity || 0,
    enabled: true,
    polygon_image: apiZone.polygon_image,
    ...bbox,
  }
}

const PRESET_COLORS = [
  '#1e3a5f', '#3182ce', '#38a169', '#c9a227',
  '#dd6b20', '#805ad5', '#e53e3e', '#319795'
]

function ColorPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: value,
          border: '2px solid var(--border)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Palette size={14} color="white" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              padding: 'var(--space-sm)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              zIndex: 100
            }}
          >
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => {
                  onChange(color)
                  setIsOpen(false)
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-sm)',
                  background: color,
                  border: value === color ? '2px solid var(--text-primary)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ZoneCard({ zone, isSelected, onSelect, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedZone, setEditedZone] = useState(zone)

  const handleSave = () => {
    onUpdate(editedZone)
    setIsEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      onClick={() => !isEditing && onSelect(zone)}
      style={{
        padding: 'var(--space-md)',
        background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
        border: `2px solid ${isSelected ? zone.color : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: isEditing ? 'default' : 'pointer',
        transition: 'border-color 0.2s ease'
      }}
    >
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Zone Name
            </label>
            <input
              type="text"
              className="input"
              value={editedZone.name}
              onChange={(e) => setEditedZone(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Capacity
              </label>
              <input
                type="number"
                className="input"
                value={editedZone.capacity}
                onChange={(e) => setEditedZone(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Color
              </label>
              <ColorPicker
                value={editedZone.color}
                onChange={(color) => setEditedZone(prev => ({ ...prev, color }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ flex: 1 }}>
              <Save size={14} />
              Save
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: 'var(--radius-sm)',
                background: zone.color
              }} />
              <span style={{ fontWeight: '600', fontSize: '0.938rem' }}>{zone.name}</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {zone.enabled ? (
                <Eye size={14} color="var(--success)" />
              ) : (
                <EyeOff size={14} color="var(--text-muted)" />
              )}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-xs)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-sm)'
          }}>
            <div>Capacity: <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{zone.capacity}</span></div>
            <div>Size: <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{zone.width}x{zone.height}</span></div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditedZone(zone); }}
            >
              <Edit2 size={14} />
            </button>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={(e) => { e.stopPropagation(); onUpdate({ ...zone, enabled: !zone.enabled }); }}
            >
              {zone.enabled ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={(e) => { e.stopPropagation(); onDelete(zone.id); }}
              style={{ color: 'var(--danger)' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}

export default function ZoneConfig() {
  const canvasRef = useRef(null)
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showDrawer, setShowDrawer] = useState(false)
  const [savedNotice, setSavedNotice] = useState(null)

  const fetchZones = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const res = await fetch(`${API}/api/zones/config`)
      const data = await res.json()
      setZones((data.zones || []).map(apiZoneToDisplay))
    } catch {
      setFetchError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchZones()
  }, [fetchZones])

  const handleZoneDrawerSaved = (savedZone) => {
    setShowDrawer(false)
    setSavedNotice(`Zone "${savedZone.zone_name}" saved`)
    setTimeout(() => setSavedNotice(null), 3000)
    fetchZones()
  }

  // Draw zones on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear and draw background
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    for (let i = 0; i <= width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let i = 0; i <= height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }

    // Draw zones
    zones.forEach(zone => {
      if (!zone.enabled) {
        ctx.globalAlpha = 0.3
      }

      // Fill
      ctx.fillStyle = zone.color + '40'
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height)

      // Border
      ctx.strokeStyle = selectedZone?.id === zone.id ? '#c9a227' : zone.color
      ctx.lineWidth = selectedZone?.id === zone.id ? 3 : 2
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height)

      // Label
      ctx.globalAlpha = 1
      ctx.fillStyle = zone.color
      ctx.font = 'bold 12px Inter'
      ctx.textAlign = 'center'
      ctx.fillText(zone.name, zone.x + zone.width / 2, zone.y + zone.height / 2)

      // Capacity label
      ctx.font = '10px Inter'
      ctx.fillStyle = '#64748b'
      ctx.fillText(`Cap: ${zone.capacity}`, zone.x + zone.width / 2, zone.y + zone.height / 2 + 16)

      ctx.globalAlpha = 1
    })

    // Draw selection handles
    if (selectedZone) {
      const zone = zones.find(z => z.id === selectedZone.id)
      if (zone) {
        const handles = [
          { x: zone.x, y: zone.y },
          { x: zone.x + zone.width, y: zone.y },
          { x: zone.x, y: zone.y + zone.height },
          { x: zone.x + zone.width, y: zone.y + zone.height }
        ]
        handles.forEach(handle => {
          ctx.fillStyle = '#c9a227'
          ctx.fillRect(handle.x - 5, handle.y - 5, 10, 10)
        })
      }
    }
  }, [zones, selectedZone])

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clicked = zones.find(zone =>
      x >= zone.x && x <= zone.x + zone.width &&
      y >= zone.y && y <= zone.y + zone.height
    )

    if (clicked) {
      setSelectedZone(clicked)
      setIsDragging(true)
      setDragOffset({ x: x - clicked.x, y: y - clicked.y })
    } else {
      setSelectedZone(null)
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !selectedZone) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, canvas.width - selectedZone.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, canvas.height - selectedZone.height))

    setZones(prev => prev.map(z =>
      z.id === selectedZone.id ? { ...z, x: Math.round(x / 10) * 10, y: Math.round(y / 10) * 10 } : z
    ))
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const addZone = () => {
    const newZone = {
      id: Date.now(),
      name: `Zone ${zones.length + 1}`,
      x: 100,
      y: 100,
      width: 120,
      height: 100,
      color: PRESET_COLORS[zones.length % PRESET_COLORS.length],
      capacity: 50,
      enabled: true
    }
    setZones(prev => [...prev, newZone])
    setSelectedZone(newZone)
  }

  const updateZone = (updatedZone) => {
    setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z))
    if (selectedZone?.id === updatedZone.id) {
      setSelectedZone(updatedZone)
    }
  }

  const deleteZone = (id) => {
    setZones(prev => prev.filter(z => z.id !== id))
    if (selectedZone?.id === id) {
      setSelectedZone(null)
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">Zone Configuration</h1>
          <p className="page-subtitle">Define and configure tracking zones</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary">
            <Copy size={16} />
            Import Layout
          </button>
          <button
            className={showDrawer ? 'btn btn-secondary' : 'btn btn-secondary'}
            onClick={() => setShowDrawer(v => !v)}
          >
            <PenTool size={16} />
            {showDrawer ? 'Hide Drawer' : 'Draw Zone'}
          </button>
          <button className="btn btn-primary" onClick={addZone}>
            <Plus size={16} />
            Add Zone
          </button>
        </div>
      </div>

      {/* Saved notice */}
      <AnimatePresence>
        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              marginBottom: 'var(--space-md)',
              padding: '10px 16px',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#10b981',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            {savedNotice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone Drawer panel */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            className="card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 'var(--space-lg)' }}
          >
            <div className="card-header">
              <h3 className="card-title">Draw New Zone</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowDrawer(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 'var(--space-md)', display: 'flex', justifyContent: 'center' }}>
              <ZoneDrawer
                width={640}
                height={480}
                onSaved={handleZoneDrawerSaved}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-lg)' }}>
        {/* Canvas */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card-header">
            <h3 className="card-title">Floor Plan Editor</h3>
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <button className="btn btn-ghost btn-icon btn-sm">
                <Maximize2 size={16} />
              </button>
              <button className="btn btn-ghost btn-icon btn-sm">
                <Settings size={16} />
              </button>
            </div>
          </div>
          <div style={{
            background: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}>
            <canvas
              ref={canvasRef}
              width={880}
              height={600}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{
                width: '100%',
                height: 'auto',
                cursor: isDragging ? 'grabbing' : 'pointer'
              }}
            />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            marginTop: 'var(--space-md)',
            padding: 'var(--space-sm)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <Move size={14} />
            <span>Drag zones to reposition • Click to select • Double-click to edit</span>
          </div>
        </motion.div>

        {/* Zone List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}
        >
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Zones ({zones.length})</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {zones.filter(z => z.enabled).length} active
              </span>
            </div>

            {/* Hidden test hook — triggers refetch to simulate ZoneDrawer onSaved */}
            <button
              data-testid="zone-drawer-saved-hook"
              style={{ display: 'none' }}
              onClick={fetchZones}
            />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              {loading ? (
                <div
                  data-testid="zones-loading"
                  style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  Loading zones…
                </div>
              ) : fetchError ? (
                <div
                  data-testid="zones-error"
                  style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--danger)', fontSize: '0.875rem' }}
                >
                  Failed to load zones. Check backend connection.
                </div>
              ) : zones.length === 0 ? (
                <div
                  data-testid="zones-empty"
                  style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  No zones configured. Draw a zone to get started.
                </div>
              ) : (
              <AnimatePresence>
                {zones.map(zone => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    isSelected={selectedZone?.id === zone.id}
                    onSelect={setSelectedZone}
                    onUpdate={updateZone}
                    onDelete={deleteZone}
                  />
                ))}
              </AnimatePresence>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Configuration Summary</h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-md)'
            }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--navy)' }}>{zones.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Zones</div>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold)' }}>
                  {zones.reduce((sum, z) => sum + z.capacity, 0)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Capacity</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
