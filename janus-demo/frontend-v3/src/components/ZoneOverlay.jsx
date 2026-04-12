import { useEffect, useRef } from 'react'

/**
 * ZoneOverlay — draws named polygon zones on a canvas element.
 *
 * Props:
 *   zones      {Array}  Zone objects from /api/zones — each must have:
 *                         id, name, polygon_image (array of [x,y] pixel coords),
 *                         color (optional hex), count (optional occupancy)
 *   width      {number} Canvas width in pixels (matches camera feed width)
 *   height     {number} Canvas height in pixels (matches camera feed height)
 *   alpha      {number} Fill opacity 0–1 (default 0.25)
 */
export default function ZoneOverlay({ zones = [], width = 640, height = 480, alpha = 0.25 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    zones.forEach((zone) => {
      const polygon = zone.polygon_image
      if (!Array.isArray(polygon) || polygon.length < 3) return

      const color = zone.color || '#3b82f6'
      const count = zone.count ?? null

      // --- fill ---
      ctx.beginPath()
      polygon.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()

      // Semi-transparent fill
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.fill()

      // Solid border
      ctx.globalAlpha = 1
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()

      // --- label ---
      const labelX = polygon.reduce((sum, [x]) => sum + x, 0) / polygon.length
      const labelY = polygon.reduce((sum, [, y]) => sum + y, 0) / polygon.length

      const label = count !== null ? `${zone.name} (${count})` : zone.name

      ctx.font = 'bold 13px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Background pill
      const metrics = ctx.measureText(label)
      const padX = 6
      const padY = 3
      const bw = metrics.width + padX * 2
      const bh = 20
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.beginPath()
      ctx.roundRect(labelX - bw / 2, labelY - bh / 2, bw, bh, 4)
      ctx.fill()

      // Text
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, labelX, labelY)
    })
  }, [zones, width, height, alpha])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      data-testid="zone-overlay-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none'
      }}
    />
  )
}
