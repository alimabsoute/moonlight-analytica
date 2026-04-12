import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface TrendPulseWaveProps {
  score: number
  keyword: string
  velocity: number
  width?: number
  height?: number
  className?: string
}

function getScoreColor(score: number): {
  primary: string
  glow: string
  label: string
} {
  if (score < 30) {
    return {
      primary: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.6)',
      label: 'Low',
    }
  }
  if (score <= 60) {
    return {
      primary: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.6)',
      label: 'Medium',
    }
  }
  return {
    primary: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.6)',
    label: 'High',
  }
}

function getVelocityArrow(velocity: number): string {
  if (velocity > 0) return '\u25B2'
  if (velocity < 0) return '\u25BC'
  return '\u2014'
}

function TrendPulseWave({
  score,
  keyword,
  velocity,
  width: propWidth,
  height: propHeight = 180,
  className,
}: TrendPulseWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const offsetRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)

    const { primary, glow } = getScoreColor(score)

    // Amplitude scales with score: min 8px at 0, max ~45% of height at 100
    const amplitude = 8 + (score / 100) * (h * 0.35)
    // Frequency scales slightly with score for a tighter wave at higher scores
    const frequency = 0.015 + (score / 100) * 0.008
    const speed = 1.5 + (Math.abs(velocity) / 100) * 2
    const centerY = h * 0.5

    offsetRef.current += speed

    // Background grid lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.lineWidth = 1
    const gridSpacing = 30
    for (let gy = gridSpacing; gy < h; gy += gridSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.lineTo(w, gy)
      ctx.stroke()
    }

    // Draw secondary trailing wave (dimmer, slightly offset)
    ctx.beginPath()
    ctx.strokeStyle = primary
    ctx.globalAlpha = 0.15
    ctx.lineWidth = 1
    for (let x = 0; x < w; x++) {
      const y =
        centerY +
        Math.sin((x + offsetRef.current * 0.7) * frequency * 1.3) *
          amplitude *
          0.5
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1

    // Draw main wave
    ctx.beginPath()
    const wavePoints: [number, number][] = []
    for (let x = 0; x < w; x++) {
      const phase = (x + offsetRef.current) * frequency
      // Composite wave: main sine + harmonic for organic feel
      const y =
        centerY +
        Math.sin(phase) * amplitude +
        Math.sin(phase * 2.5) * amplitude * 0.15
      wavePoints.push([x, y])
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    // Main stroke
    ctx.strokeStyle = primary
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()

    // Glow effect on the leading edge (rightmost ~60px)
    const glowWidth = 60
    const glowStart = w - glowWidth
    ctx.beginPath()
    for (let i = 0; i < wavePoints.length; i++) {
      const [px, py] = wavePoints[i]
      if (px < glowStart) {
        if (i === 0 || wavePoints[i - 1][0] < glowStart) ctx.moveTo(px, py)
        continue
      }
      if (px === glowStart || (i > 0 && wavePoints[i - 1][0] < glowStart)) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.strokeStyle = glow
    ctx.lineWidth = 5
    ctx.globalAlpha = 0.5
    ctx.filter = 'blur(4px)'
    ctx.stroke()
    ctx.filter = 'none'
    ctx.globalAlpha = 1

    // Leading edge dot
    if (wavePoints.length > 0) {
      const [lastX, lastY] = wavePoints[wavePoints.length - 1]
      ctx.beginPath()
      ctx.arc(lastX - 2, lastY, 4, 0, Math.PI * 2)
      ctx.fillStyle = primary
      ctx.fill()

      // Outer glow ring
      ctx.beginPath()
      ctx.arc(lastX - 2, lastY, 8, 0, Math.PI * 2)
      ctx.strokeStyle = glow
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.005) * 0.2
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Area fill under wave
    ctx.beginPath()
    for (let i = 0; i < wavePoints.length; i++) {
      const [px, py] = wavePoints[i]
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    const areaGradient = ctx.createLinearGradient(0, centerY - amplitude, 0, h)
    areaGradient.addColorStop(0, glow.replace('0.6', '0.08'))
    areaGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = areaGradient
    ctx.fill()

    animationRef.current = requestAnimationFrame(draw)
  }, [score, velocity])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [draw])

  const { primary, label } = getScoreColor(score)
  const velocityColor =
    velocity > 0
      ? 'text-success'
      : velocity < 0
        ? 'text-danger'
        : 'text-muted-foreground'

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div ref={containerRef} className="relative" style={{ height: propHeight }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ width: propWidth ?? '100%', height: propHeight }}
        />

        {/* Score overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-5xl font-bold tabular-nums"
            style={{ color: primary, textShadow: `0 0 20px ${primary}40` }}
          >
            {score}
          </span>
          <span
            className="text-xs font-medium tracking-wider uppercase mt-1"
            style={{ color: primary }}
          >
            {label} Pulse
          </span>
        </div>

        {/* Bottom info bar */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-card/90 to-transparent">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
              {keyword}
            </span>
            <span className="text-xs text-muted-foreground">Trend Pulse</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn('text-sm font-medium', velocityColor)}>
              {getVelocityArrow(velocity)} {Math.abs(velocity).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">/wk</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export { TrendPulseWave }
export type { TrendPulseWaveProps }
