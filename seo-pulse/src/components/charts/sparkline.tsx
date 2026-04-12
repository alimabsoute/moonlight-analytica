import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showArea?: boolean
  className?: string
  strokeWidth?: number
}

/**
 * Build a smooth cubic bezier path from a set of points.
 * Uses Catmull-Rom to Cubic Bezier conversion for natural curves.
 */
function buildSmoothPath(
  points: [number, number][],
  tension = 0.3
): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M${points[0][0]},${points[0][1]} L${points[1][0]},${points[1][1]}`
  }

  let d = `M${points[0][0]},${points[0][1]}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]

    const cp1x = p1[0] + (p2[0] - p0[0]) * tension
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
  }

  return d
}

function Sparkline({
  data,
  width = 120,
  height = 40,
  color,
  showArea = false,
  className,
  strokeWidth = 1.5,
}: SparklineProps) {
  const { path, areaPath, resolvedColor } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', areaPath: '', resolvedColor: color ?? 'var(--color-muted-foreground)' }
    }

    const padding = strokeWidth + 1
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points: [number, number][] = data.map((v, i) => [
      padding + (i / (data.length - 1)) * (width - padding * 2),
      height - padding - ((v - min) / range) * (height - padding * 2),
    ])

    const linePath = buildSmoothPath(points)
    const isUptrend = data[data.length - 1] >= data[0]
    const resolved =
      color ?? (isUptrend ? 'var(--color-success)' : 'var(--color-danger)')

    let area = ''
    if (showArea && points.length >= 2) {
      const first = points[0]
      const last = points[points.length - 1]
      area = `${linePath} L${last[0]},${height} L${first[0]},${height} Z`
    }

    return { path: linePath, areaPath: area, resolvedColor: resolved }
  }, [data, width, height, color, showArea, strokeWidth])

  if (data.length < 2) return null

  const gradientId = `sparkline-area-${data.length}-${data[0]}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
      preserveAspectRatio="none"
    >
      {showArea && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={resolvedColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={resolvedColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} />
        </>
      )}
      <path
        d={path}
        fill="none"
        stroke={resolvedColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { Sparkline }
export type { SparklineProps }
