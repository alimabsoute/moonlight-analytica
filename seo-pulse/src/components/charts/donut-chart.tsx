import { motion } from 'motion/react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn, formatNumber } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DonutDatum {
  name: string
  value: number
  color?: string
}

interface DonutChartProps {
  data: DonutDatum[]
  title?: string
  loading?: boolean
  height?: number
  className?: string
  innerRadius?: number
  outerRadius?: number
}

const DEFAULT_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
  '#8b5cf6',
  '#06b6d4',
  '#f472b6',
  '#a3e635',
]

interface LegendPayloadItem {
  value: string
  color?: string
}

function CustomLegend(props: { payload?: LegendPayloadItem[] }) {
  const { payload } = props
  if (!payload) return null
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChartSkeleton({ height = 280 }: { height?: number }) {
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

function DonutChart({
  data,
  title,
  loading = false,
  height = 280,
  className,
  innerRadius = 60,
  outerRadius = 90,
}: DonutChartProps) {
  if (loading) {
    return <DonutChartSkeleton height={height} />
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

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
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                strokeWidth={0}
                animationDuration={1000}
                animationBegin={100}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--color-popover-foreground)',
                  fontSize: 13,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
                formatter={(value) =>
                  formatNumber(Number(value))
                }
              />

              <Legend content={<CustomLegend />} />

              {/* Center text */}
              <text
                x="50%"
                y="43%"
                textAnchor="middle"
                dominantBaseline="central"
              >
                <tspan
                  x="50%"
                  dy="-0.3em"
                  fill="var(--color-foreground)"
                  fontSize={22}
                  fontWeight={700}
                >
                  {formatNumber(total, { compact: true })}
                </tspan>
                <tspan
                  x="50%"
                  dy="1.5em"
                  fill="var(--color-muted-foreground)"
                  fontSize={11}
                >
                  Total
                </tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { DonutChart }
export type { DonutChartProps, DonutDatum }
