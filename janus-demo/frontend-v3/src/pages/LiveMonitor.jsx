import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, TrendingDown, Clock, AlertTriangle,
  Activity, ArrowUpRight, ArrowDownRight, Eye, Zap,
  Timer, Target, MousePointerClick
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

import LiveMonitorHeader from '../components/LiveMonitorHeader'
import LiveMonitorViewTabs from '../components/LiveMonitorViewTabs'
import LiveMonitorFeed from '../components/LiveMonitorFeed'

// ─── Data generators ──────────────────────────────────────────────────────────

const generateLiveKPIs = () => ({
  currentOccupancy: Math.floor(Math.random() * 200) + 150,
  capacity: 500,
  entriesThisHour: Math.floor(Math.random() * 50) + 30,
  exitsThisHour: Math.floor(Math.random() * 40) + 25,
  avgDwellTime: Math.floor(Math.random() * 20) + 15,
  peakToday: Math.floor(Math.random() * 100) + 350,
  conversionRate: (Math.random() * 10 + 25).toFixed(1),
  alertCount: Math.floor(Math.random() * 5)
})

const generateActivityFeed = () => {
  const activities = [
    { type: 'entry', message: 'Group of 4 entered via Main Entrance', zone: 'Lobby' },
    { type: 'exit', message: '2 visitors exited through North Gate', zone: 'Exit A' },
    { type: 'alert', message: 'Zone B approaching 80% capacity', zone: 'Zone B' },
    { type: 'dwell', message: 'Extended dwell detected in Display Area', zone: 'Display' },
    { type: 'entry', message: 'Single visitor entered via Side Door', zone: 'Entrance B' },
    { type: 'conversion', message: 'Purchase completed in Retail Zone', zone: 'Retail' }
  ]
  return activities.sort(() => Math.random() - 0.5).slice(0, 5).map((a, i) => ({
    ...a,
    id: Date.now() + i,
    time: new Date(Date.now() - Math.random() * 600000).toLocaleTimeString()
  }))
}

function generateFallbackEntryExitData() {
  const hours = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now - i * 3600000)
    const hourLabel = h.getHours().toString().padStart(2, '0') + ':00'
    const isBusinessHours = h.getHours() >= 8 && h.getHours() <= 20
    const base = isBusinessHours ? 40 : 10
    hours.push({
      hour: hourLabel,
      entries: Math.floor(Math.random() * base + base * 0.5),
      exits: Math.floor(Math.random() * (base * 0.8) + base * 0.4)
    })
  }
  return hours
}

function generateFallbackZoneData() {
  return [
    { name: 'Lobby', occupancy: 45, capacity: 80 },
    { name: 'Zone A', occupancy: 72, capacity: 100 },
    { name: 'Zone B', occupancy: 58, capacity: 120 },
    { name: 'Retail', occupancy: 34, capacity: 60 },
    { name: 'Display', occupancy: 88, capacity: 100 },
    { name: 'Exit Hall', occupancy: 22, capacity: 50 }
  ]
}

// ─── Sub-components still local to this page ──────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-sm) var(--space-md)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontSize: '0.75rem'
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color, fontWeight: '600' }}>
          {entry.name}: {entry.value}
        </div>
      ))}
    </div>
  )
}

function KPICard({ title, value, unit, trend, trendValue, icon: Icon, delay }) {
  const isPositive = trend === 'up'
  return (
    <motion.article
      className="card"
      aria-label={`${title}: ${value}${unit ? ' ' + unit : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
        <div
          aria-hidden="true"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <Icon size={20} />
        </div>
        {trendValue && (
          <div
            aria-label={`Trend: ${isPositive ? 'up' : 'down'} ${trendValue}%`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isPositive ? 'var(--success)' : 'var(--danger)',
              background: isPositive ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {isPositive ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
            {trendValue}%
          </div>
        )}
      </div>
      <div style={{
        fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)',
        color: 'var(--text-muted)',
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <motion.span
          style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: '700', color: 'var(--text-primary)' }}
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {value}
        </motion.span>
        {unit && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
    </motion.article>
  )
}

function ActivityItem({ activity, index }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'entry':      return <ArrowUpRight size={14} color="var(--success)" aria-hidden="true" />
      case 'exit':       return <ArrowDownRight size={14} color="var(--warning)" aria-hidden="true" />
      case 'alert':      return <AlertTriangle size={14} color="var(--danger)" aria-hidden="true" />
      case 'dwell':      return <Clock size={14} color="var(--info)" aria-hidden="true" />
      case 'conversion': return <Zap size={14} color="var(--gold)" aria-hidden="true" />
      default:           return <Activity size={14} aria-hidden="true" />
    }
  }

  return (
    <motion.div
      role="listitem"
      aria-label={`${activity.type}: ${activity.message} — ${activity.zone} at ${activity.time}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-sm)',
        padding: 'var(--space-sm) 0',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.813rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
          {activity.message}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>{activity.zone}</span>
          <span aria-hidden="true">•</span>
          <time>{activity.time}</time>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main page component ───────────────────────────────────────────────────────

export default function LiveMonitor() {
  const [kpis, setKpis] = useState(generateLiveKPIs())
  const [activities, setActivities] = useState(generateActivityFeed())
  const [isLive, setIsLive] = useState(true)
  const [viewMode, setViewMode] = useState('2d')
  const [trackingMetrics, setTrackingMetrics] = useState(null)
  const [pipelineVersion, setPipelineVersion] = useState('A')
  const [mlStats, setMlStats] = useState(null)
  const [apiData, setApiData] = useState({ conversion: null, queue: null, zones: null })
  const [entryExitTrend, setEntryExitTrend] = useState([])
  const [apiError, setApiError] = useState(null)

  // Fetch real API data on mount and refresh every 30s
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, queueRes, zonesRes, entryExitRes] = await Promise.all([
          fetch('http://localhost:8000/api/conversion?hours=24'),
          fetch('http://localhost:8000/api/queue?hours=24'),
          fetch('http://localhost:8000/api/zones?hours=24'),
          fetch('http://localhost:8000/api/entries-exits?hours=24')
        ])
        setApiData({
          conversion: convRes.ok ? await convRes.json() : null,
          queue: queueRes.ok ? await queueRes.json() : null,
          zones: zonesRes.ok ? await zonesRes.json() : null
        })
        if (entryExitRes.ok) {
          const entryExitData = await entryExitRes.json()
          setEntryExitTrend(Array.isArray(entryExitData) ? entryExitData : entryExitData?.data || [])
        }
        setApiError(null)
      } catch (e) {
        console.error('API fetch error:', e)
        setApiError('Unable to connect to backend. Make sure the server is running on port 8000.')
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Live KPI simulation
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => {
      setKpis(generateLiveKPIs())
      if (Math.random() > 0.7) {
        setActivities(prev => [
          { ...generateActivityFeed()[0], id: Date.now() },
          ...prev.slice(0, 4)
        ])
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isLive])

  const occupancyPercent = (kpis.currentOccupancy / kpis.capacity * 100).toFixed(0)

  // Derive KPI values from API data with fallbacks
  const bounceRate = apiData.conversion?.bounce_rate ?? apiData.conversion?.bounceRate ?? '--'
  const engagementRate = apiData.conversion?.engagement_rate ?? apiData.conversion?.engagementRate ?? '--'
  const conversionRate = apiData.conversion?.conversion_rate ?? apiData.conversion?.conversionRate ?? kpis.conversionRate
  const queueWaitTime = apiData.queue?.avg_wait_time ?? apiData.queue?.avgWaitTime ?? apiData.queue?.wait_time ?? '--'

  // Prepare zone chart data
  const rawZones = apiData.zones
    ? (Array.isArray(apiData.zones) ? apiData.zones : apiData.zones?.data || apiData.zones?.zones || [])
    : []

  const zoneChartData = rawZones.map(z => ({
    name: z.name || z.zone_name || z.zone || z.label || 'Zone',
    occupancy: z.occupancy ?? z.count ?? z.current ?? 0,
    capacity: z.capacity ?? z.max ?? 100
  }))

  const overlayZones = useMemo(
    () => rawZones.filter(z => Array.isArray(z.polygon_image) && z.polygon_image.length >= 3),
    [rawZones]
  )

  return (
    <main className="page-container">
      <LiveMonitorHeader isLive={isLive} onToggleLive={() => setIsLive(v => !v)} />

      {/* API error banner */}
      {apiError && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'rgba(229, 62, 62, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
            fontSize: '0.813rem',
            color: 'var(--danger)'
          }}
        >
          <AlertTriangle size={16} aria-hidden="true" />
          {apiError}
        </motion.div>
      )}

      <LiveMonitorViewTabs
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pipelineVersion={pipelineVersion}
        onPipelineVersionChange={setPipelineVersion}
        mlStats={mlStats}
      />

      {/* Primary KPI grid */}
      <section
        aria-label="Key performance indicators"
        className="kpi-grid"
        style={{ marginBottom: 'var(--space-xl)' }}
      >
        <KPICard title="Current Occupancy" value={trackingMetrics?.currentCount || kpis.currentOccupancy} unit={`/ ${kpis.capacity}`} trend="up" trendValue="12" icon={Users} delay={0} />
        <KPICard title="Occupancy Rate" value={occupancyPercent} unit="%" trend={occupancyPercent > 70 ? 'up' : 'down'} trendValue="5" icon={Activity} delay={1} />
        <KPICard title="Entries This Hour" value={trackingMetrics?.totalEntries || kpis.entriesThisHour} trend="up" trendValue="8" icon={TrendingUp} delay={2} />
        <KPICard title="Exits This Hour" value={trackingMetrics?.totalExits || kpis.exitsThisHour} trend="down" trendValue="3" icon={TrendingDown} delay={3} />
        <KPICard title="Avg Dwell Time" value={kpis.avgDwellTime} unit="min" trend="up" trendValue="15" icon={Clock} delay={4} />
        <KPICard title="Peak Today" value={trackingMetrics?.peakCount || kpis.peakToday} trend="up" trendValue="7" icon={Eye} delay={5} />
      </section>

      {/* Secondary KPI row */}
      <section
        aria-label="Conversion and queue metrics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 20vw, 200px), 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)'
        }}
      >
        <KPICard title="Bounce Rate" value={bounceRate} unit="%" trend="down" trendValue="4" icon={MousePointerClick} delay={6} />
        <KPICard title="Engagement Rate" value={engagementRate} unit="%" trend="up" trendValue="6" icon={Target} delay={7} />
        <KPICard title="Conversion Rate" value={conversionRate} unit="%" trend="up" trendValue="3" icon={Zap} delay={8} />
        <KPICard title="Queue Wait Time" value={queueWaitTime} unit="min" trend="down" trendValue="2" icon={Timer} delay={9} />
      </section>

      {/* Main content: feed + activity feed */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) clamp(280px, 30vw, 380px)',
        gap: 'var(--space-lg)'
      }}>
        <LiveMonitorFeed
          viewMode={viewMode}
          pipelineVersion={pipelineVersion}
          overlayZones={overlayZones}
          trackingMetrics={trackingMetrics}
          onMetricsUpdate={setTrackingMetrics}
          onMlStatsUpdate={setMlStats}
        />

        {/* Activity feed */}
        <motion.aside
          className="card"
          aria-label="Recent activity"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h3 className="card-title">Activity Feed</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 5 events</span>
          </div>
          <div role="list" aria-label="Activity events">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <ActivityItem key={activity.id} activity={activity} index={index} />
              ))}
            </AnimatePresence>
          </div>
        </motion.aside>
      </div>

      {/* Capacity overview */}
      <motion.section
        className="card"
        aria-label="Capacity overview"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ marginTop: 'var(--space-lg)' }}
      >
        <div className="card-header">
          <h3 className="card-title">Capacity Overview</h3>
          <span style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
            {trackingMetrics?.currentCount || kpis.currentOccupancy} of {kpis.capacity} capacity
          </span>
        </div>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <div
            role="progressbar"
            aria-valuenow={Number(occupancyPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Capacity at ${occupancyPercent}%`}
            style={{
              height: '12px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancyPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: occupancyPercent > 80
                  ? 'linear-gradient(90deg, var(--danger), #ff6b6b)'
                  : occupancyPercent > 60
                    ? 'linear-gradient(90deg, var(--warning), #ffa726)'
                    : 'linear-gradient(90deg, var(--navy), var(--navy-light))',
                borderRadius: 'var(--radius-full)'
              }}
            />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'var(--space-sm)',
            fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)',
            color: 'var(--text-muted)'
          }}>
            <span>0%</span>
            <span style={{ color: 'var(--warning)' }}>60% Warning</span>
            <span style={{ color: 'var(--danger)' }}>80% Critical</span>
            <span>100%</span>
          </div>
        </div>
      </motion.section>

      {/* Trend charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 40vw, 500px), 1fr))',
        gap: 'var(--space-lg)',
        marginTop: 'var(--space-lg)'
      }}>
        {/* Entry / Exit trend */}
        <motion.section
          className="card"
          aria-label="Entry and exit trend chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card-header">
            <h3 className="card-title">Entry / Exit Trend (24h)</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hourly traffic flow</span>
          </div>
          <div style={{ width: '100%', height: 280, marginTop: 'var(--space-md)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={entryExitTrend.length > 0 ? entryExitTrend : generateFallbackEntryExitData()}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="entryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a227" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c9a227" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="entries" name="Entries" stroke="#1e3a5f" strokeWidth={2} fill="url(#entryGradient)" dot={false} activeDot={{ r: 4, fill: '#1e3a5f' }} />
                <Area type="monotone" dataKey="exits" name="Exits" stroke="#c9a227" strokeWidth={2} fill="url(#exitGradient)" dot={false} activeDot={{ r: 4, fill: '#c9a227' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center', marginTop: 'var(--space-sm)', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div aria-hidden="true" style={{ width: 12, height: 3, background: '#1e3a5f', borderRadius: 2 }} />
              <span style={{ color: 'var(--text-muted)' }}>Entries</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div aria-hidden="true" style={{ width: 12, height: 3, background: '#c9a227', borderRadius: 2 }} />
              <span style={{ color: 'var(--text-muted)' }}>Exits</span>
            </div>
          </div>
        </motion.section>

        {/* Zone occupancy */}
        <motion.section
          className="card"
          aria-label="Zone occupancy chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="card-header">
            <h3 className="card-title">Zone Occupancy</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current by zone</span>
          </div>
          <div style={{ width: '100%', height: 280, marginTop: 'var(--space-md)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={zoneChartData.length > 0 ? zoneChartData : generateFallbackZoneData()}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="occupancy" name="Occupancy" fill="#1e3a5f" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="capacity" name="Capacity" fill="#38a169" radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center', marginTop: 'var(--space-sm)', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div aria-hidden="true" style={{ width: 12, height: 12, background: '#1e3a5f', borderRadius: 2 }} />
              <span style={{ color: 'var(--text-muted)' }}>Current</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div aria-hidden="true" style={{ width: 12, height: 12, background: '#38a169', borderRadius: 2, opacity: 0.3 }} />
              <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
