import { motion } from 'motion/react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { cn, formatNumber } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface BarChartProps {
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
  orientation?: 'vertical' | 'horizontal'
  className?: string
  barColors?: string[]
}

function BarChartSkeleton({ height = 300 }: { height?: number }) {
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

function BarChartComponent({
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
  orientation = 'vertical',
  className,
  barColors,
}: BarChartProps) {
  if (loading) {
    return <BarChartSkeleton height={height} />
  }

  const isHorizontal = orientation === 'horizontal'

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
            <RechartsBarChart
              data={data}
              layout={isHorizontal ? 'vertical' : 'horizontal'}
              margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={!isHorizontal}
                  horizontal={isHorizontal}
                />
              )}

              {isHorizontal ? (
                <>
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--color-muted-foreground)',
                      fontSize: 12,
                    }}
                    tickFormatter={(v: number) =>
                      formatNumber(v, { compact: true })
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey={xAxisKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--color-muted-foreground)',
                      fontSize: 12,
                    }}
                    width={80}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey={xAxisKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--color-muted-foreground)',
                      fontSize: 12,
                    }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--color-muted-foreground)',
                      fontSize: 12,
                    }}
                    tickFormatter={(v: number) =>
                      formatNumber(v, { compact: true })
                    }
                  />
                </>
              )}

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
                  fill: 'var(--color-muted)',
                  opacity: 0.3,
                }}
              />

              <Bar
                dataKey={dataKey}
                fill={color}
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationBegin={100}
              >
                {barColors &&
                  data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={barColors[index % barColors.length]}
                    />
                  ))}
              </Bar>

              {compareDataKey && (
                <Bar
                  dataKey={compareDataKey}
                  fill={compareColor}
                  radius={[4, 4, 0, 0]}
                  opacity={0.5}
                  animationDuration={800}
                  animationBegin={300}
                />
              )}
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export { BarChartComponent as BarChart, BarChartComponent as BarChartWidget }
export type { BarChartProps }
