import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts'
import {
  TrendingUp, Clock, Users, AlertTriangle, Sun, Cloud, CloudRain,
  Calendar, Target, Zap, ChevronRight
} from 'lucide-react'

// Generate 24-hour forecast data with confidence bands
const generateForecastData = () => {
  const data = []
  const baseValues = [20, 25, 40, 80, 120, 180, 220, 280, 320, 350, 380, 400,
    420, 410, 380, 340, 300, 280, 240, 200, 160, 100, 60, 30]

  for (let i = 0; i < 24; i++) {
    const hour = (i + 8) % 24
    const base = baseValues[i] + Math.random() * 40 - 20
    const variance = Math.random() * 30 + 20
    data.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      forecast: Math.round(base),
      upper: Math.round(base + variance),
      lower: Math.round(Math.max(0, base - variance)),
      actual: i < 8 ? Math.round(base + Math.random() * 20 - 10) : null
    })
  }
  return data
}

// Generate weekly outlook data
const generateWeeklyOutlook = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map(day => ({
    day,
    predicted: Math.floor(Math.random() * 2000) + 3000,
    lastWeek: Math.floor(Math.random() * 2000) + 2800,
    confidence: Math.floor(Math.random() * 15) + 80
  }))
}

function ForecastCard({ title, value, unit, subtitle, icon: Icon, trend, color, delay }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: color || 'var(--navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <Icon size={20} />
        </div>
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            background: trend > 0 ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: trend > 0 ? 'var(--success)' : 'var(--danger)'
          }}>
            <TrendingUp size={12} style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ marginTop: 'var(--space-md)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</span>
          {unit && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{unit}</span>}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{subtitle}</div>
        )}
      </div>
    </motion.div>
  )
}

function StaffingRow({ time, current, recommended, status }) {
  const statusColors = {
    optimal: 'var(--success)',
    understaffed: 'var(--danger)',
    overstaffed: 'var(--warning)'
  }

  return (
    <tr>
      <td style={{ fontWeight: '500' }}>{time}</td>
      <td>{current}</td>
      <td style={{ fontWeight: '600', color: 'var(--navy)' }}>{recommended}</td>
      <td>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.7rem',
          fontWeight: '500',
          textTransform: 'capitalize',
          background: statusColors[status] + '20',
          color: statusColors[status]
        }}>
          {status}
        </span>
      </td>
    </tr>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-sm) var(--space-md)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ fontSize: '0.813rem', color: entry.color, fontWeight: '500' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Forecasting() {
  const [forecastData, setForecastData] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setForecastData(generateForecastData())
      setWeeklyData(generateWeeklyOutlook())
      setIsLoading(false)
    }, 500)
  }, [])

  const staffingRecommendations = [
    { time: '08:00 - 10:00', current: 3, recommended: 3, status: 'optimal' },
    { time: '10:00 - 12:00', current: 4, recommended: 5, status: 'understaffed' },
    { time: '12:00 - 14:00', current: 5, recommended: 6, status: 'understaffed' },
    { time: '14:00 - 16:00', current: 6, recommended: 6, status: 'optimal' },
    { time: '16:00 - 18:00', current: 5, recommended: 5, status: 'optimal' },
    { time: '18:00 - 20:00', current: 4, recommended: 3, status: 'overstaffed' }
  ]

  const capacityWarnings = [
    { zone: 'Zone A', time: '13:00', risk: 85, message: 'Expected to reach 85% capacity' },
    { zone: 'Lobby', time: '14:30', risk: 78, message: 'High traffic predicted from event' },
    { zone: 'Retail Area', time: '16:00', risk: 72, message: 'Weekend rush expected' }
  ]

  if (isLoading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--navy)',
              borderRadius: '50%'
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">Traffic Forecasting</h1>
          <p className="page-subtitle">AI-powered predictions and capacity planning</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            padding: 'var(--space-xs) var(--space-sm)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem'
          }}>
            <Sun size={14} color="var(--gold)" />
            <span>72°F, Clear</span>
          </div>
          <select className="input" style={{ width: '150px' }}>
            <option>Today</option>
            <option>Tomorrow</option>
            <option>This Week</option>
          </select>
        </div>
      </div>

      {/* Forecast Cards */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <ForecastCard
          title="Peak Prediction"
          value="2:15"
          unit="PM"
          subtitle="Expected peak hour today"
          icon={Clock}
          trend={12}
          delay={0}
        />
        <ForecastCard
          title="Max Capacity Risk"
          value="78"
          unit="%"
          subtitle="Highest expected occupancy"
          icon={AlertTriangle}
          color="var(--warning)"
          trend={-5}
          delay={1}
        />
        <ForecastCard
          title="Staff Needed"
          value="6"
          unit="people"
          subtitle="Recommended for peak hours"
          icon={Users}
          delay={2}
        />
        <ForecastCard
          title="Weather Factor"
          value="+15"
          unit="%"
          subtitle="Clear weather traffic boost"
          icon={Sun}
          color="var(--gold)"
          trend={15}
          delay={3}
        />
      </div>

      {/* 24-Hour Forecast Chart */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginBottom: 'var(--space-lg)' }}
      >
        <div className="card-header">
          <h3 className="card-title">24-Hour Traffic Forecast</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '3px', background: 'var(--navy)', borderRadius: '2px' }} />
              <span style={{ color: 'var(--text-muted)' }}>Forecast</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', background: 'rgba(30, 58, 95, 0.2)', borderRadius: '2px' }} />
              <span style={{ color: 'var(--text-muted)' }}>Confidence Band</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--gold)', borderRadius: '50%' }} />
              <span style={{ color: 'var(--text-muted)' }}>Actual</span>
            </div>
          </div>
        </div>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={400} stroke="var(--danger)" strokeDasharray="5 5" label={{ value: 'Capacity', fill: 'var(--danger)', fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="transparent"
                fill="url(#confidenceBand)"
                name="Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="transparent"
                fill="var(--bg-primary)"
                name="Lower Bound"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#1e3a5f"
                strokeWidth={3}
                dot={false}
                name="Forecast"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#c9a227"
                strokeWidth={2}
                dot={{ fill: '#c9a227', r: 4 }}
                name="Actual"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          padding: 'var(--space-md)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          marginTop: 'var(--space-md)',
          fontSize: '0.75rem'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Demo mode — sample forecast data. Connect ML model for real predictions.
          </span>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Staffing Recommendations */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <h3 className="card-title">Staffing Recommendations</h3>
          </div>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Time Period</th>
                  <th>Current</th>
                  <th>Recommended</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffingRecommendations.map((row, index) => (
                  <StaffingRow key={index} {...row} />
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Capacity Warnings */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={16} style={{ marginRight: '6px', color: 'var(--warning)' }} />
              Capacity Warnings
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {capacityWarnings.map((warning, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                style={{
                  padding: 'var(--space-md)',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${warning.risk > 80 ? 'var(--danger)' : 'var(--warning)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{warning.zone}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: warning.risk > 80 ? 'var(--danger)' : 'var(--warning)'
                  }}>
                    {warning.risk}% risk
                  </span>
                </div>
                <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {warning.message}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Expected at {warning.time}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Weekly Outlook */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: 'var(--space-lg)' }}
      >
        <div className="card-header">
          <h3 className="card-title">
            <Calendar size={16} style={{ marginRight: '6px' }} />
            Weekly Outlook
          </h3>
        </div>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="predicted" name="Predicted" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lastWeek" name="Last Week" fill="#c9a227" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 'var(--space-sm)',
          marginTop: 'var(--space-md)'
        }}>
          {weeklyData.map((day, index) => (
            <div
              key={index}
              style={{
                textAlign: 'center',
                padding: 'var(--space-sm)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Confidence</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)' }}>{day.confidence}%</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
