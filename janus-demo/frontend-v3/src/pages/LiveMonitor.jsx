import { useState, useEffect, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, TrendingDown, Clock, AlertTriangle,
  Activity, ArrowUpRight, ArrowDownRight, Eye, Zap,
  Box, Cpu, MonitorDot, Database, BarChart3, Timer, Target, MousePointerClick
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// Lazy load tracking components
const HumanoidTrackingDemo = lazy(() => import('../../../shared/HumanoidTrackingDemo'))
const Tracking3DView = lazy(() => import('../../../shared/Tracking3DView'))
// Standard: TensorFlow.js + COCO-SSD (works reliably)
const RealTimeDetection = lazy(() => import('../../../shared/RealTimeDetection'))
// Enhanced: TensorFlow.js + COCO-SSD with ByteTrack smoothing & Kalman filter
const RealTimeDetectionEnhanced = lazy(() => import('../../../shared/RealTimeDetectionEnhanced'))
// Pre-Processed: Roboflow Cloud + ByteTrack offline pipeline
const PreProcessedPlayer = lazy(() => import('../components/PreProcessedPlayer'))

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

// View mode tabs - 3 modes for tracking visualization
const VIEW_MODES = [
  { id: '2d', label: '2D Simulation', icon: MonitorDot, description: 'Stick figure tracking' },
  { id: '3d', label: '3D Isometric', icon: Box, description: 'Floor plan view' },
  { id: 'ml', label: 'ML Detection', icon: Cpu, description: 'Real-time person detection' }
]

// ML Pipeline versions - Standard, Enhanced, and Pre-Processed
const PIPELINE_VERSIONS = [
  { id: 'A', label: 'Standard', description: 'TensorFlow + COCO-SSD', color: '#3b82f6' },
  { id: 'E', label: 'Enhanced', description: 'COCO-SSD + ByteTrack smoothing', color: '#10b981' },
  { id: 'P', label: 'Pre-Processed', description: 'Offline YOLO + BoT-SORT (highest accuracy)', color: '#8b5cf6' }
]

// Custom tooltip for recharts
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

// Loading component
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '400px',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)'
    }}>
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
  )
}

function KPICard({ title, value, unit, trend, trendValue, icon: Icon, delay }) {
  const isPositive = trend === 'up'

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <Icon size={20} />
        </div>
        {trendValue && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: isPositive ? 'var(--success)' : 'var(--danger)',
            background: isPositive ? 'rgba(56, 161, 105, 0.1)' : 'rgba(229, 62, 62, 0.1)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)'
          }}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}%
          </div>
        )}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <motion.span
          style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {value}
        </motion.span>
        {unit && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
    </motion.div>
  )
}

function ActivityItem({ activity, index }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'entry': return <ArrowUpRight size={14} color="var(--success)" />
      case 'exit': return <ArrowDownRight size={14} color="var(--warning)" />
      case 'alert': return <AlertTriangle size={14} color="var(--danger)" />
      case 'dwell': return <Clock size={14} color="var(--info)" />
      case 'conversion': return <Zap size={14} color="var(--gold)" />
      default: return <Activity size={14} />
    }
  }

  return (
    <motion.div
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
          <span>•</span>
          <span>{activity.time}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function LiveMonitor() {
  const [kpis, setKpis] = useState(generateLiveKPIs())
  const [activities, setActivities] = useState(generateActivityFeed())
  const [isLive, setIsLive] = useState(true)
  const [viewMode, setViewMode] = useState('2d')
  const [trackingMetrics, setTrackingMetrics] = useState(null)
  const [pipelineVersion, setPipelineVersion] = useState('A') // 'A' standard, 'E' enhanced
  const [mlStats, setMlStats] = useState(null)
  const [apiData, setApiData] = useState({ conversion: null, queue: null, zones: null })
  const [entryExitTrend, setEntryExitTrend] = useState([])

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
      } catch (e) {
        console.error('API fetch error:', e)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

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

  const handleTrackingMetrics = (metrics) => {
    setTrackingMetrics(metrics)
  }

  // Derive KPI values from API data with fallbacks
  const bounceRate = apiData.conversion?.bounce_rate ?? apiData.conversion?.bounceRate ?? '--'
  const engagementRate = apiData.conversion?.engagement_rate ?? apiData.conversion?.engagementRate ?? '--'
  const conversionRate = apiData.conversion?.conversion_rate ?? apiData.conversion?.conversionRate ?? kpis.conversionRate
  const queueWaitTime = apiData.queue?.avg_wait_time ?? apiData.queue?.avgWaitTime ?? apiData.queue?.wait_time ?? '--'

  // Prepare zone data for bar chart
  const zoneChartData = apiData.zones
    ? (Array.isArray(apiData.zones) ? apiData.zones : apiData.zones?.data || apiData.zones?.zones || []).map(z => ({
        name: z.name || z.zone_name || z.zone || z.label || 'Zone',
        occupancy: z.occupancy ?? z.count ?? z.current ?? 0,
        capacity: z.capacity ?? z.max ?? 100
      }))
    : []

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="page-title">Live Monitor</h1>
          <p className="page-subtitle">Real-time occupancy and traffic analytics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <motion.div
            animate={{ scale: isLive ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 2, repeat: isLive ? Infinity : 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: 'var(--space-xs) var(--space-sm)',
              background: isLive ? 'rgba(56, 161, 105, 0.1)' : 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${isLive ? 'var(--success)' : 'var(--border)'}`
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLive ? 'var(--success)' : 'var(--text-muted)'
            }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: isLive ? 'var(--success)' : 'var(--text-muted)' }}>
              {isLive ? 'LIVE' : 'PAUSED'}
            </span>
          </motion.div>
          <button
            className={`btn ${isLive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          background: 'var(--bg-secondary)',
          padding: 'var(--space-xs)',
          borderRadius: 'var(--radius-lg)',
          width: 'fit-content'
        }}>
          {VIEW_MODES.map((mode) => (
            <motion.button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                padding: 'var(--space-sm) var(--space-md)',
                background: viewMode === mode.id ? 'var(--navy)' : 'transparent',
                color: viewMode === mode.id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.813rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              <mode.icon size={16} />
              {mode.label}
            </motion.button>
          ))}
        </div>

        {/* Pipeline Version Selector - only shown in ML mode */}
        <AnimatePresence>
          {viewMode === 'ml' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Pipeline:</span>
              <div style={{
                display: 'flex',
                gap: '4px',
                background: 'var(--bg-tertiary)',
                padding: '4px',
                borderRadius: 'var(--radius-md)'
              }}>
                {PIPELINE_VERSIONS.map((v) => (
                  <motion.button
                    key={v.id}
                    onClick={() => setPipelineVersion(v.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '6px 12px',
                      background: pipelineVersion === v.id ? v.color : 'transparent',
                      color: pipelineVersion === v.id ? (v.id === 'A' ? '#fff' : '#000') : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    title={v.description}
                  >
                    {v.label}
                  </motion.button>
                ))}
              </div>
              {mlStats && (
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--success)',
                  fontFamily: 'monospace',
                  background: 'rgba(56, 161, 105, 0.1)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {mlStats.fps} FPS | {mlStats.tracking?.confirmedCount || 0} tracks
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <KPICard
          title="Current Occupancy"
          value={trackingMetrics?.currentCount || kpis.currentOccupancy}
          unit={`/ ${kpis.capacity}`}
          trend="up"
          trendValue="12"
          icon={Users}
          delay={0}
        />
        <KPICard
          title="Occupancy Rate"
          value={occupancyPercent}
          unit="%"
          trend={occupancyPercent > 70 ? 'up' : 'down'}
          trendValue="5"
          icon={Activity}
          delay={1}
        />
        <KPICard
          title="Entries This Hour"
          value={trackingMetrics?.totalEntries || kpis.entriesThisHour}
          trend="up"
          trendValue="8"
          icon={TrendingUp}
          delay={2}
        />
        <KPICard
          title="Exits This Hour"
          value={trackingMetrics?.totalExits || kpis.exitsThisHour}
          trend="down"
          trendValue="3"
          icon={TrendingDown}
          delay={3}
        />
        <KPICard
          title="Avg Dwell Time"
          value={kpis.avgDwellTime}
          unit="min"
          trend="up"
          trendValue="15"
          icon={Clock}
          delay={4}
        />
        <KPICard
          title="Peak Today"
          value={trackingMetrics?.peakCount || kpis.peakToday}
          trend="up"
          trendValue="7"
          icon={Eye}
          delay={5}
        />
      </div>

      {/* Secondary KPI Row - Conversion & Queue Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)'
      }}>
        <KPICard
          title="Bounce Rate"
          value={bounceRate}
          unit="%"
          trend="down"
          trendValue="4"
          icon={MousePointerClick}
          delay={6}
        />
        <KPICard
          title="Engagement Rate"
          value={engagementRate}
          unit="%"
          trend="up"
          trendValue="6"
          icon={Target}
          delay={7}
        />
        <KPICard
          title="Conversion Rate"
          value={conversionRate}
          unit="%"
          trend="up"
          trendValue="3"
          icon={Zap}
          delay={8}
        />
        <KPICard
          title="Queue Wait Time"
          value={queueWaitTime}
          unit="min"
          trend="down"
          trendValue="2"
          icon={Timer}
          delay={9}
        />
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-lg)' }}>
        {/* Video Feed */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <h3 className="card-title">
              {VIEW_MODES.find(m => m.id === viewMode)?.label} View
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--success)'
            }}>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--success)'
                }}
              />
              {VIEW_MODES.find(m => m.id === viewMode)?.description}
            </div>
          </div>
          <div style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            minHeight: '400px'
          }}>
            <Suspense fallback={<LoadingSpinner />}>
              {viewMode === '2d' && (
                <HumanoidTrackingDemo
                  theme="light"
                  onMetricsUpdate={handleTrackingMetrics}
                />
              )}
              {viewMode === '3d' && (
                <Tracking3DView
                  theme="light"
                  onMetricsUpdate={handleTrackingMetrics}
                />
              )}
              {viewMode === 'ml' && (
                <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
                  {/* Render appropriate tracking view based on pipeline version */}
                  {pipelineVersion === 'A' ? (
                    /* Standard tracking - TensorFlow.js + COCO-SSD */
                    <RealTimeDetection
                      theme="dark"
                      onMetricsUpdate={(metrics) => {
                        handleTrackingMetrics({
                          currentCount: metrics.currentCount,
                          totalEntries: metrics.totalEntries || 0,
                          totalExits: metrics.totalExits || 0,
                          peakCount: Math.max(trackingMetrics?.peakCount || 0, metrics.currentCount)
                        })
                        setMlStats({ fps: metrics.fps, tracking: { confirmedCount: metrics.currentCount } })
                      }}
                    />
                  ) : pipelineVersion === 'E' ? (
                    /* Enhanced tracking - COCO-SSD + ByteTrack smoothing + Kalman filter */
                    <RealTimeDetectionEnhanced
                      theme="dark"
                      onMetricsUpdate={(metrics) => {
                        handleTrackingMetrics({
                          currentCount: metrics.currentCount,
                          totalEntries: metrics.totalEntries || 0,
                          totalExits: metrics.totalExits || 0,
                          peakCount: Math.max(trackingMetrics?.peakCount || 0, metrics.currentCount)
                        })
                        setMlStats({ fps: metrics.fps, tracking: { confirmedCount: metrics.currentCount } })
                      }}
                    />
                  ) : (
                    /* Pre-Processed: Roboflow Cloud offline pipeline */
                    <PreProcessedPlayer
                      theme="dark"
                      onMetricsUpdate={(metrics) => {
                        handleTrackingMetrics({
                          currentCount: metrics.currentCount,
                          totalEntries: metrics.totalEntries || 0,
                          totalExits: metrics.totalExits || 0,
                          peakCount: metrics.peakCount || Math.max(trackingMetrics?.peakCount || 0, metrics.currentCount)
                        })
                        setMlStats({ fps: 30, tracking: { confirmedCount: metrics.currentCount } })
                      }}
                    />
                  )}
                </div>
              )}
            </Suspense>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h3 className="card-title">Activity Feed</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Last 5 events
            </span>
          </div>
          <div>
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <ActivityItem key={activity.id} activity={activity} index={index} />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Capacity Progress */}
      <motion.div
        className="card"
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
          <div style={{
            height: '12px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
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
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <span>0%</span>
            <span style={{ color: 'var(--warning)' }}>60% Warning</span>
            <span style={{ color: 'var(--danger)' }}>80% Critical</span>
            <span>100%</span>
          </div>
        </div>
      </motion.div>

      {/* Trend Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-lg)',
        marginTop: 'var(--space-lg)'
      }}>
        {/* Entry/Exit Trend Line Chart */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card-header">
            <h3 className="card-title">Entry / Exit Trend (24h)</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Hourly traffic flow
            </span>
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
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="entries"
                  name="Entries"
                  stroke="#1e3a5f"
                  strokeWidth={2}
                  fill="url(#entryGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#1e3a5f' }}
                />
                <Area
                  type="monotone"
                  dataKey="exits"
                  name="Exits"
                  stroke="#c9a227"
                  strokeWidth={2}
                  fill="url(#exitGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#c9a227' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            justifyContent: 'center',
            marginTop: 'var(--space-sm)',
            fontSize: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 3, background: '#1e3a5f', borderRadius: 2 }} />
              <span style={{ color: 'var(--text-muted)' }}>Entries</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 3, background: '#c9a227', borderRadius: 2 }} />
              <span style={{ color: 'var(--text-muted)' }}>Exits</span>
            </div>
          </div>
        </motion.div>

        {/* Zone Occupancy Bar Chart */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="card-header">
            <h3 className="card-title">Zone Occupancy</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Current by zone
            </span>
          </div>
          <div style={{ width: '100%', height: 280, marginTop: 'var(--space-md)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={zoneChartData.length > 0 ? zoneChartData : generateFallbackZoneData()}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="occupancy"
                  name="Occupancy"
                  fill="#1e3a5f"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="capacity"
                  name="Capacity"
                  fill="#38a169"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  opacity={0.3}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            justifyContent: 'center',
            marginTop: 'var(--space-sm)',
            fontSize: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 12, background: '#1e3a5f', borderRadius: 2 }} />
              <span style={{ color: 'var(--text-muted)' }}>Current</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 12, background: '#38a169', borderRadius: 2, opacity: 0.3 }} />
              <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Fallback data generators when API is unavailable
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
