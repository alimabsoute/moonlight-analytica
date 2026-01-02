import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Play, Pause, SkipBack, SkipForward, Clock,
  Maximize2, Download, RefreshCw, MapPin
} from 'lucide-react'

const ZONES = [
  { id: 1, name: 'Main Entrance', x: 50, y: 400, width: 100, height: 80 },
  { id: 2, name: 'Lobby', x: 200, y: 350, width: 200, height: 150 },
  { id: 3, name: 'Zone A', x: 450, y: 100, width: 150, height: 120 },
  { id: 4, name: 'Zone B', x: 450, y: 280, width: 150, height: 120 },
  { id: 5, name: 'Zone C', x: 450, y: 460, width: 150, height: 120 },
  { id: 6, name: 'Retail Area', x: 650, y: 200, width: 180, height: 200 },
  { id: 7, name: 'Service Desk', x: 200, y: 100, width: 120, height: 80 },
  { id: 8, name: 'Exit', x: 50, y: 100, width: 80, height: 80 }
]

const generateHeatmapData = () => {
  return ZONES.map(zone => ({
    ...zone,
    intensity: Math.random(),
    count: Math.floor(Math.random() * 100) + 10,
    avgDwell: Math.floor(Math.random() * 30) + 5
  }))
}

const getHeatColor = (intensity) => {
  if (intensity < 0.2) return 'rgba(30, 58, 95, 0.3)'      // Navy low
  if (intensity < 0.4) return 'rgba(49, 130, 206, 0.4)'    // Blue
  if (intensity < 0.6) return 'rgba(201, 162, 39, 0.5)'    // Gold
  if (intensity < 0.8) return 'rgba(221, 107, 32, 0.6)'    // Orange
  return 'rgba(229, 62, 62, 0.7)'                           // Red high
}

function ZoneStat({ label, value, unit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
        {value}{unit && <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-muted)' }}> {unit}</span>}
      </div>
    </div>
  )
}

export default function Heatmap() {
  const canvasRef = useRef(null)
  const [heatmapData, setHeatmapData] = useState(generateHeatmapData())
  const [selectedZone, setSelectedZone] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(9)
  const [timeRange, setTimeRange] = useState('today')

  // Draw heatmap
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background grid
    ctx.strokeStyle = 'var(--border)'
    ctx.lineWidth = 0.5
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }

    // Draw zones with heat colors
    heatmapData.forEach(zone => {
      // Zone fill with heat color
      ctx.fillStyle = getHeatColor(zone.intensity)
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height)

      // Zone border
      ctx.strokeStyle = selectedZone?.id === zone.id ? '#c9a227' : '#1e3a5f'
      ctx.lineWidth = selectedZone?.id === zone.id ? 3 : 1
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height)

      // Zone label
      ctx.fillStyle = '#1e3a5f'
      ctx.font = '11px Inter'
      ctx.textAlign = 'center'
      ctx.fillText(zone.name, zone.x + zone.width / 2, zone.y + zone.height / 2)
      ctx.font = 'bold 14px Inter'
      ctx.fillText(zone.count, zone.x + zone.width / 2, zone.y + zone.height / 2 + 18)
    })

    // Draw connections between zones
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.2)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    // Entrance to Lobby
    ctx.beginPath()
    ctx.moveTo(150, 440)
    ctx.lineTo(200, 425)
    ctx.stroke()

    // Lobby to zones
    ctx.beginPath()
    ctx.moveTo(400, 425)
    ctx.lineTo(450, 340)
    ctx.stroke()

    ctx.setLineDash([])
  }, [heatmapData, selectedZone])

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= 21) {
          setIsPlaying(false)
          return 9
        }
        return prev + 1
      })
      setHeatmapData(generateHeatmapData())
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying])

  // Handle canvas click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clicked = heatmapData.find(zone =>
      x >= zone.x && x <= zone.x + zone.width &&
      y >= zone.y && y <= zone.y + zone.height
    )

    setSelectedZone(clicked || null)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">Zone Heatmap</h1>
          <p className="page-subtitle">Visualize traffic density and flow patterns</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div className="btn-group">
            {['today', 'week', 'month'].map(range => (
              <button
                key={range}
                className={`btn btn-sm ${timeRange === range ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-icon">
            <Download size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-lg)' }}>
        {/* Heatmap Canvas */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card-header">
            <h3 className="card-title">Floor Plan Heatmap</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Clock size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '0.813rem', fontWeight: '500' }}>
                {currentTime}:00 - {currentTime + 1}:00
              </span>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-md)'
          }}>
            <canvas
              ref={canvasRef}
              width={880}
              height={600}
              onClick={handleCanvasClick}
              style={{
                width: '100%',
                height: 'auto',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)'
              }}
            />
          </div>

          {/* Playback Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-md)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCurrentTime(9)}>
                <SkipBack size={16} />
              </button>
              <button
                className="btn btn-primary btn-icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCurrentTime(21)}>
                <SkipForward size={16} />
              </button>
            </div>

            {/* Timeline */}
            <div style={{ flex: 1, margin: '0 var(--space-lg)' }}>
              <input
                type="range"
                min={9}
                max={21}
                value={currentTime}
                onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginTop: '4px'
              }}>
                <span>9:00 AM</span>
                <span>3:00 PM</span>
                <span>9:00 PM</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setHeatmapData(generateHeatmapData())}>
                <RefreshCw size={16} />
              </button>
              <button className="btn btn-ghost btn-icon btn-sm">
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          {/* Intensity Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-md)',
            marginTop: 'var(--space-md)',
            padding: 'var(--space-sm)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low</span>
            <div style={{
              display: 'flex',
              height: '12px',
              borderRadius: '6px',
              overflow: 'hidden',
              width: '200px'
            }}>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: getHeatColor(intensity)
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High</span>
          </div>
        </motion.div>

        {/* Zone Statistics Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Selected Zone Details */}
          <motion.div
            className="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="card-header">
              <h3 className="card-title">Zone Details</h3>
            </div>
            {selectedZone ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  marginBottom: 'var(--space-lg)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: getHeatColor(selectedZone.intensity),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MapPin size={18} color="var(--navy)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>{selectedZone.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Zone ID: {selectedZone.id}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <ZoneStat label="Current Count" value={selectedZone.count} />
                  <ZoneStat label="Avg Dwell" value={selectedZone.avgDwell} unit="min" />
                  <ZoneStat label="Peak Today" value={Math.floor(selectedZone.count * 1.5)} />
                  <ZoneStat label="Intensity" value={(selectedZone.intensity * 100).toFixed(0)} unit="%" />
                </div>

                <div style={{ marginTop: 'var(--space-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Traffic Intensity
                  </div>
                  <div style={{
                    height: '8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden'
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedZone.intensity * 100}%` }}
                      transition={{ duration: 0.5 }}
                      style={{
                        height: '100%',
                        background: getHeatColor(selectedZone.intensity),
                        borderRadius: 'var(--radius-full)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-xl)',
                color: 'var(--text-muted)'
              }}>
                <MapPin size={32} style={{ marginBottom: 'var(--space-sm)', opacity: 0.5 }} />
                <div style={{ fontSize: '0.813rem' }}>Click a zone to view details</div>
              </div>
            )}
          </motion.div>

          {/* Zone Rankings */}
          <motion.div
            className="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-header">
              <h3 className="card-title">Zone Rankings</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>By traffic</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {[...heatmapData]
                .sort((a, b) => b.count - a.count)
                .map((zone, index) => (
                  <motion.div
                    key={zone.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedZone(zone)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      padding: 'var(--space-sm)',
                      background: selectedZone?.id === zone.id ? 'var(--bg-tertiary)' : 'transparent',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm)',
                      background: index < 3 ? 'var(--navy)' : 'var(--bg-tertiary)',
                      color: index < 3 ? 'white' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.813rem', fontWeight: '500' }}>{zone.name}</div>
                    </div>
                    <div style={{
                      fontSize: '0.813rem',
                      fontWeight: '600',
                      color: 'var(--navy)'
                    }}>
                      {zone.count}
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
