import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

function Sparkline({ data, width = 60, height = 24, color = 'var(--navy)' }) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  })

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function SparklineKPI({
  title,
  value,
  subtitle,
  icon: Icon,
  trendData,
  change,
  changeLabel,
  color = 'var(--navy)',
  sparkColor,
}) {
  const isPositive = change != null && change >= 0
  const isNeutral = change == null || change === 0

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: 'var(--space-lg)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {Icon && (
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: `${color}15`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: color,
            }}>
              <Icon size={18} />
            </div>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
        </div>
        {trendData && trendData.length >= 2 && (
          <Sparkline data={trendData} color={sparkColor || color} />
        )}
      </div>

      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' }}>
        {change != null && !isNeutral && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontSize: '0.75rem', fontWeight: 600,
            color: isPositive ? 'var(--success)' : 'var(--danger)',
          }}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}%
          </span>
        )}
        {subtitle && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</span>
        )}
      </div>
    </motion.div>
  )
}
