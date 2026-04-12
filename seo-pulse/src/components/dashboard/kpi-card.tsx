import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useMotionValue, useTransform, animate } from 'motion/react'
import { cn, formatNumber, formatPercent, getDeltaArrow, formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface KpiCardProps {
  label: string
  value: number
  previousValue?: number
  format?: 'number' | 'compact' | 'currency' | 'percent'
  sparklineData?: number[]
  loading?: boolean
  icon?: ReactNode
  tooltip?: string
  className?: string
}

function formatValue(value: number, format: KpiCardProps['format']): string {
  switch (format) {
    case 'compact':
      return formatNumber(value, { compact: true })
    case 'currency':
      return formatCurrency(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    default:
      return formatNumber(value)
  }
}

function AnimatedValue({
  value,
  format,
}: {
  value: number
  format: KpiCardProps['format']
}) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (latest) => formatValue(latest, format))
  const [displayText, setDisplayText] = useState(formatValue(0, format))

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayText(v))
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: 'easeOut',
    })
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, motionValue, display])

  return (
    <span className="text-3xl font-bold tracking-tight text-foreground">
      {displayText}
    </span>
  )
}

function InlineSparkline({
  data,
  className,
}: {
  data: number[]
  className?: string
}) {
  if (data.length < 2) return null

  const width = 100
  const height = 36
  const padding = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((v - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  const isUptrend = data[data.length - 1] >= data[0]
  const strokeColor = isUptrend
    ? 'var(--color-success)'
    : 'var(--color-danger)'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full h-[36px]', className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={`spark-fill-${isUptrend ? 'up' : 'down'}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${padding},${height} ${points} ${width - padding},${height}`}
        fill={`url(#spark-fill-${isUptrend ? 'up' : 'down'})`}
      />
    </svg>
  )
}

function KpiCard({
  label,
  value,
  previousValue,
  format = 'number',
  sparklineData,
  loading = false,
  icon,
  tooltip,
  className,
}: KpiCardProps) {
  if (loading) {
    return (
      <Card className={cn('p-5', className)}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-[36px] w-full" />
        </div>
      </Card>
    )
  }

  const delta =
    previousValue !== undefined && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : undefined

  const deltaVariant =
    delta !== undefined
      ? delta > 0
        ? 'success'
        : delta < 0
          ? 'danger'
          : 'secondary'
      : undefined

  return (
    <Card
      className={cn('p-5 relative overflow-hidden group', className)}
      title={tooltip}
    >
      <div className="flex flex-col gap-2">
        {/* Layer 1: Label */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          {icon && (
            <span className="text-muted-foreground/60">{icon}</span>
          )}
        </div>

        {/* Layer 2: Headline value with animated count-up */}
        <AnimatedValue value={value} format={format} />

        {/* Layer 3: Delta badge */}
        {delta !== undefined && deltaVariant && (
          <div>
            <Badge variant={deltaVariant} className="gap-1 text-xs">
              <span>{getDeltaArrow(delta)}</span>
              <span>{formatPercent(delta)}</span>
            </Badge>
          </div>
        )}

        {/* Layer 4: Inline sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="mt-1">
            <InlineSparkline data={sparklineData} />
          </div>
        )}
      </div>
    </Card>
  )
}

export { KpiCard }
export type { KpiCardProps }
