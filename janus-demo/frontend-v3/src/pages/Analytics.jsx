import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, Clock, DollarSign, Target,
  ArrowUpRight, ArrowDownRight, Calendar, Filter, Download
} from 'lucide-react'
import { generateKPIs, generateTimeSeriesData, generateZoneData } from '../../../shared/mockData'

const COLORS = {
  navy: '#1e3a5f',
  navyLight: '#2d5a87',
  gold: '#c9a227',
  success: '#38a169',
  warning: '#dd6b20',
  danger: '#e53e3e',
  info: '#3182ce'
}

const CHART_COLORS = ['#1e3a5f', '#c9a227', '#38a169', '#3182ce', '#dd6b20', '#e53e3e']

function StatCard({ title, value, unit, change, changeType, icon: Icon, delay }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</span>
            {unit && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unit}</span>}
          </div>
        </div>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--navy)'
        }}>
          <Icon size={18} />
        </div>
      </div>
      {change && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: 'var(--space-sm)',
          fontSize: '0.7rem',
          color: changeType === 'positive' ? 'var(--success)' : 'var(--danger)'
        }}>
          {changeType === 'positive' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span style={{ fontWeight: '600' }}>{change}%</span>
          <span style={{ color: 'var(--text-muted)' }}>vs last period</span>
        </div>
      )}
    </motion.div>
  )
}

function ChartCard({ title, subtitle, children, delay, actions }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
    >
      <div className="card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>{actions}</div>}
      </div>
      {children}
    </motion.div>
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
          <p key={index} style={{ fontSize: '0.813rem', color: entry.color, fontWeight: '600' }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [kpis, setKpis] = useState(null)
  const [timeSeriesData, setTimeSeriesData] = useState([])
  const [zoneData, setZoneData] = useState([])
  const [dateRange, setDateRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      // Transform KPI data to expected format
      const rawKpis = generateKPIs()
      setKpis({
        totalVisitors: rawKpis.total_events || rawKpis.current_count * 24,
        avgDwellTime: Math.round(Math.random() * 10 + 8), // 8-18 minutes
        conversionRate: Math.round(Math.random() * 15 + 15), // 15-30%
        currentCount: rawKpis.current_count,
        peakCount: rawKpis.peak_count,
        avgCount: rawKpis.avg_count
      })

      // Transform time series to expected format
      const rawTimeSeries = generateTimeSeriesData(dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90)
      const transformedTimeSeries = rawTimeSeries.map(d => ({
        date: d.timestamp,
        visitors: d.count_value,
        entries: d.entries,
        exits: d.exits
      }))
      setTimeSeriesData(transformedTimeSeries)

      // Transform zone data to expected format (it returns { zones: [...] })
      const rawZoneData = generateZoneData()
      const transformedZoneData = (rawZoneData.zones || []).map(z => ({
        id: z.zone,
        name: z.name,
        capacity: z.capacity,
        currentCount: z.current_occupancy || Math.round(z.capacity * Math.random() * 0.7)
      }))
      setZoneData(transformedZoneData)

      setIsLoading(false)
    }, 500)
  }, [dateRange])

  if (isLoading || !kpis) {
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

  // Prepare chart data
  const trafficData = timeSeriesData.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visitors: d.visitors,
    entries: d.entries,
    exits: d.exits
  }))

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    traffic: Math.floor(Math.random() * 100) + (i >= 9 && i <= 18 ? 100 : 20)
  }))

  const dwellTimeData = [
    { name: '< 5 min', value: 25, color: COLORS.danger },
    { name: '5-15 min', value: 35, color: COLORS.warning },
    { name: '15-30 min', value: 25, color: COLORS.gold },
    { name: '30-60 min', value: 10, color: COLORS.success },
    { name: '> 60 min', value: 5, color: COLORS.navy }
  ]

  const radarData = zoneData.map(z => ({
    zone: z.name,
    traffic: z.currentCount,
    dwell: Math.floor(Math.random() * 100),
    conversion: Math.floor(Math.random() * 100)
  }))

  const funnelData = [
    { stage: 'Visitors', value: 1000, fill: COLORS.navy },
    { stage: 'Engaged', value: 650, fill: COLORS.navyLight },
    { stage: 'Interested', value: 420, fill: COLORS.gold },
    { stage: 'Converted', value: 280, fill: COLORS.success }
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Comprehensive traffic and performance metrics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div className="btn-group">
            {['7d', '30d', '90d'].map(range => (
              <button
                key={range}
                className={`btn btn-sm ${dateRange === range ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDateRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-icon">
            <Filter size={16} />
          </button>
          <button className="btn btn-secondary btn-icon">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <StatCard title="Total Visitors" value={kpis.totalVisitors?.toLocaleString()} change="12.5" changeType="positive" icon={Users} delay={0} />
        <StatCard title="Avg Dwell Time" value={kpis.avgDwellTime} unit="min" change="8.2" changeType="positive" icon={Clock} delay={1} />
        <StatCard title="Conversion Rate" value={kpis.conversionRate} unit="%" change="3.1" changeType="positive" icon={Target} delay={2} />
        <StatCard title="Revenue/Visitor" value={`$${(Math.random() * 20 + 10).toFixed(2)}`} change="5.7" changeType="positive" icon={DollarSign} delay={3} />
        <StatCard title="Peak Hour" value="2:00 PM" change="15" changeType="positive" icon={TrendingUp} delay={4} />
        <StatCard title="Bounce Rate" value="18.5" unit="%" change="2.3" changeType="negative" icon={TrendingDown} delay={5} />
      </div>

      {/* Traffic Trends Chart */}
      <ChartCard
        title="Traffic Trends"
        subtitle={`Daily visitor trends over the last ${dateRange === '7d' ? '7 days' : dateRange === '30d' ? '30 days' : '90 days'}`}
        delay={1}
      >
        <div style={{ height: '320px', marginTop: 'var(--space-md)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.navy} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.navy} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke={COLORS.navy}
                strokeWidth={2}
                fill="url(#colorVisitors)"
                name="Visitors"
              />
              <Area
                type="monotone"
                dataKey="entries"
                stroke={COLORS.gold}
                strokeWidth={2}
                fill="url(#colorEntries)"
                name="Entries"
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
          <span style={{ color: 'var(--text-muted)' }}>📊 Peak traffic occurred on weekdays between 11AM-3PM, averaging 23% higher than weekends</span>
        </div>
      </ChartCard>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
        {/* Hourly Distribution */}
        <ChartCard title="Hourly Traffic Distribution" subtitle="Average traffic by hour of day" delay={2}>
          <div style={{ height: '280px', marginTop: 'var(--space-md)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={2} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="traffic" fill={COLORS.navy} radius={[4, 4, 0, 0]} name="Traffic" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Dwell Time Distribution */}
        <ChartCard title="Dwell Time Distribution" subtitle="Visitor time spent breakdown" delay={3}>
          <div style={{ height: '280px', marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={dwellTimeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {dwellTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {dwellTimeData.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.color }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', marginLeft: 'auto' }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Second Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
        {/* Zone Performance Radar */}
        <ChartCard title="Zone Performance" subtitle="Multi-metric zone comparison" delay={4}>
          <div style={{ height: '300px', marginTop: 'var(--space-md)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="zone" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <PolarRadiusAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Radar name="Traffic" dataKey="traffic" stroke={COLORS.navy} fill={COLORS.navy} fillOpacity={0.3} />
                <Radar name="Dwell" dataKey="dwell" stroke={COLORS.gold} fill={COLORS.gold} fillOpacity={0.3} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Conversion Funnel */}
        <ChartCard title="Conversion Funnel" subtitle="Visitor journey stages" delay={5}>
          <div style={{ height: '300px', marginTop: 'var(--space-md)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Count">
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-md)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Engagement Rate</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--navy)' }}>65%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Interest Rate</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gold)' }}>64.6%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Conversion Rate</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--success)' }}>28%</div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Zone Performance Table */}
      <ChartCard title="Zone Performance Details" subtitle="Detailed metrics by zone" delay={6} style={{ marginTop: 'var(--space-lg)' }}>
        <div className="data-table" style={{ marginTop: 'var(--space-md)' }}>
          <table>
            <thead>
              <tr>
                <th>Zone</th>
                <th>Current</th>
                <th>Capacity</th>
                <th>Utilization</th>
                <th>Avg Dwell</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {zoneData.map((zone, index) => {
                const utilization = ((zone.currentCount / zone.capacity) * 100).toFixed(0)
                const trend = Math.random() > 0.5
                return (
                  <motion.tr
                    key={zone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td style={{ fontWeight: '500' }}>{zone.name}</td>
                    <td>{zone.currentCount}</td>
                    <td>{zone.capacity}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <div style={{
                          width: '60px',
                          height: '6px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${utilization}%`,
                            height: '100%',
                            background: utilization > 80 ? 'var(--danger)' : utilization > 60 ? 'var(--warning)' : 'var(--success)',
                            borderRadius: 'var(--radius-full)'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem' }}>{utilization}%</span>
                      </div>
                    </td>
                    <td>{Math.floor(Math.random() * 20 + 10)} min</td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: trend ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {trend ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.floor(Math.random() * 15 + 1)}%
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
