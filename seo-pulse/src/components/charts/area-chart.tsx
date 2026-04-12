import { motion } from 'motion/react'
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn, formatNumber } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface AreaChartProps {
  data: Record<string, unknown>[]
  dataKey: string
  xAxisKey?: string
  compareDataKey?: string
  height?: number
  color?: string
  compareColor?: string
  loading?: boolean
  title?: string
  showGrid?: boolean
  className?: string
}

function AreaChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  )
}

function AreaChart({
  data,
  dataKey,
  xAxisKey = 'date',
  compareDataKey,
  height = 300,
  color = 'var(--color-primary)',
  compareColor = 'var(--color-muted-foreground)',
  loading = false,
  title,
  showGrid = true,
  className,
}: AreaChartProps) {
  if (loading) {
    return <AreaChartSkeleton height={height} />
  }

  const gradientId = `area-gradient-${dataKey}`
  const compareGradientId = compareDataKey
    ? `area-gradient-${compareDataKey}`
    : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className={cn(className)}>
        {title && (
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className={cn(!title && 'pt-6')}>
          <ResponsiveContainer width="100%" height={height}>
            <RechartsAreaChart
              data={data}
              margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                {compareGradientId && (
                  <linearGradient
                    id={compareGradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={compareColor}
                      stopOpacity={0.1}
                    />
                    <stop
                      offset="95%"
                      stopColor={compareColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                )}
              </defs>

              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
              )}

              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                tickFormatter={(v: number) =>
                  formatNumber(v, { compact: true })
                }
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--color-popover-foreground)',
                  fontSize: 13,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
                cursor={{
                  stroke: 'var(--color-muted-foreground)',
                  strokeDasharray: '3 3',
                }}
              />

              {compareDataKey && (
                <Area
                  type="monotone"
                  dataKey={compareDataKey}
                  stroke={compareColor}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  fill={`url(#${compareGradientId})`}
                  fillOpacity={1}
                  dot={false}
                  animationDuration={1000}
                />
              )}

              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                fillOpacity={1}
                dot={false}
                animationDuration={1200}
                animationBegin={200}
              />
            </RechartsAreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { AreaChart, AreaChart as AreaChartWidget }
export type { AreaChartProps }
