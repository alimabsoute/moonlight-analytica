import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveLine } from '@nivo/line'
import {
  Users, Clock, Target, TrendingUp, TrendingDown, Activity,
  ArrowUpRight, ArrowDownRight, ArrowRight, Zap, BarChart3, RefreshCw
} from 'lucide-react'

const API_BASE = 'http://localhost:8000'

const DATE_RANGES = [
  { key: '24h', label: '24h', hours: 24 },
  { key: '7d', label: '7d', hours: 168 },
  { key: '30d', label: '30d', hours: 720 }
]

const nivoTheme = {
  text: { fill: 'var(--text-secondary)' },
  axis: {
    ticks: { text: { fill: 'var(--text-muted)', fontSize: 11 } },
    legend: { text: { fill: 'var(--text-secondary)', fontSize: 12 } }
  },
  grid: { line: { stroke: 'var(--border)', strokeWidth: 1 } },
  tooltip: {
    container: {
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      color: 'var(--text-primary)',
      fontSize: 12,
      padding: '8px 12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.08)'
    }
  },
  labels: { text: { fill: 'var(--text-primary)', fontSize: 11 } },
  legends: { text: { fill: 'var(--text-secondary)', fontSize: 11 } }
}

const CHART_COLORS = {
  navy: '#1e3a5f',
  navyLight: '#2d5a87',
  gold: '#c9a227',
  goldLight: '#e8c547',
  success: '#38a169',
  warning: '#dd6b20',
  danger: '#e53e3e',
  info: '#3182ce',
  purple: '#805ad5',
  teal: '#319795'
}

// ============ Utility functions ============

function formatDwell(seconds) {
  if (seconds == null || isNaN(seconds)) return '--'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const min = Math.floor(seconds / 60)
  const sec = Math.round(seconds % 60)
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`
}

function formatPercent(val) {
  if (val == null || isNaN(val)) return '--'
  return `${Number(val).toFixed(1)}%`
}

function formatChange(val) {
  if (val == null || isNaN(val)) return null
  return Number(val).toFixed(1)
}

function changeType(val) {
  if (val == null || isNaN(val)) return 'neutral'
  return Number(val) >= 0 ? 'positive' : 'negative'
}

// ============ Sub-components ============

function Spinner() {
  return (
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
  )
}

function KpiCard({ title, value, unit, change, changeDir, icon: Icon, delay }) {
  const isPositive = changeDir === 'positive'
  const isNeutral = changeDir === 'neutral'
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.4 }}
      style={{ minWidth: 0 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
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
          color: 'var(--navy)',
          flexShrink: 0
        }}>
          <Icon size={18} />
        </div>
      </div>
      {change != null && !isNeutral && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: 'var(--space-sm)',
          fontSize: '0.7rem',
          color: isPositive ? 'var(--success)' : 'var(--danger)'
        }}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span style={{ fontWeight: '600' }}>{Math.abs(change)}%</span>
          <span style={{ color: 'var(--text-muted)' }}>vs last period</span>
        </div>
      )}
    </motion.div>
  )
}

function ChartCard({ title, subtitle, children, delay, actions, style: extraStyle }) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      style={extraStyle}
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

// ============ Main Component ============

export default function Analytics() {
  const [dateRange, setDateRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // API data state
  const [dwellData, setDwellData] = useState(null)
  const [hourlyData, setHourlyData] = useState(null)
  const [conversionData, setConversionData] = useState(null)
  const [zoneData, setZoneData] = useState(null)
  const [comparisonData, setComparisonData] = useState(null)
  const [flowData, setFlowData] = useState(null)

  const abortRef = useRef(null)

  const hoursForRange = DATE_RANGES.find(r => r.key === dateRange)?.hours || 168

  const fetchAllData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const signal = controller.signal

    setIsLoading(true)
    setError(null)

    const endpoints = [
      { key: 'dwell', url: `${API_BASE}/api/dwell-distribution?hours=${hoursForRange}` },
      { key: 'hourly', url: `${API_BASE}/api/hourly-patterns?hours=${hoursForRange}` },
      { key: 'conversion', url: `${API_BASE}/api/conversion?hours=${hoursForRange}` },
      { key: 'zones', url: `${API_BASE}/api/zones?hours=${hoursForRange}` },
      { key: 'comparison', url: `${API_BASE}/api/period-comparison?hours=${hoursForRange}` },
      { key: 'flow', url: `${API_BASE}/api/flow-between-zones?hours=${hoursForRange}` }
    ]

    try {
      const results = await Promise.allSettled(
        endpoints.map(ep =>
          fetch(ep.url, { signal })
            .then(res => {
              if (!res.ok) throw new Error(`${ep.key}: ${res.status}`)
              return res.json()
            })
            .then(data => ({ key: ep.key, data }))
        )
      )

      if (signal.aborted) return

      let anySuccess = false
      for (const result of results) {
        if (result.status === 'fulfilled') {
          anySuccess = true
          const { key, data } = result.value
          switch (key) {
            case 'dwell': setDwellData(data); break
            case 'hourly': setHourlyData(data); break
            case 'conversion': setConversionData(data); break
            case 'zones': setZoneData(data); break
            case 'comparison': setComparisonData(data); break
            case 'flow': setFlowData(data); break
          }
        }
      }

      if (!anySuccess) {
        setError('Unable to connect to the backend API. Ensure the server is running at ' + API_BASE)
      }
    } catch (err) {
      if (!signal.aborted) {
        setError('Failed to fetch analytics data. ' + (err.message || ''))
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [hoursForRange])

  useEffect(() => {
    fetchAllData()
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [fetchAllData])

  // ============ Derived chart data ============

  // KPI values from comparison + conversion endpoints
  const kpis = buildKpis(comparisonData, conversionData, hourlyData)

  // Hourly traffic line chart data
  const hourlyLineData = buildHourlyLine(hourlyData)

  // Dwell distribution bar chart data
  const dwellBarData = buildDwellBar(dwellData)

  // Zone performance grouped bar data
  const zoneBarData = buildZoneBar(zoneData)

  // Conversion funnel horizontal bar data
  const funnelBarData = buildFunnelBar(conversionData)

  // Flow table data
  const flowTableRows = flowData?.transitions || []

  // Period comparison cards
  const periodCards = buildPeriodCards(comparisonData)

  // ============ Render ============

  if (isLoading) {
    return (
      <div className="page-container">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">
            Real-time traffic and performance metrics
            {error && (
              <span style={{ color: 'var(--warning)', marginLeft: 'var(--space-sm)', fontSize: '0.75rem' }}>
                (some data unavailable)
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div className="btn-group">
            {DATE_RANGES.map(range => (
              <button
                key={range.key}
                className={`btn btn-sm ${dateRange === range.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDateRange(range.key)}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            className="btn btn-secondary btn-icon"
            onClick={fetchAllData}
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md) var(--space-lg)',
              marginBottom: 'var(--space-xl)',
              fontSize: '0.813rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}
          >
            <Activity size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Summary Row */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <KpiCard
          title="Total Visitors"
          value={kpis.totalVisitors.toLocaleString()}
          change={kpis.totalVisitorsChange}
          changeDir={kpis.totalVisitorsDir}
          icon={Users}
          delay={0}
        />
        <KpiCard
          title="Avg Dwell Time"
          value={formatDwell(kpis.avgDwell)}
          change={kpis.avgDwellChange}
          changeDir={kpis.avgDwellDir}
          icon={Clock}
          delay={1}
        />
        <KpiCard
          title="Conversion Rate"
          value={formatPercent(kpis.conversionRate)}
          change={kpis.conversionRateChange}
          changeDir={kpis.conversionRateDir}
          icon={Target}
          delay={2}
        />
        <KpiCard
          title="Bounce Rate"
          value={formatPercent(kpis.bounceRate)}
          change={kpis.bounceRateChange}
          changeDir={kpis.bounceRateDir}
          icon={TrendingDown}
          delay={3}
        />
        <KpiCard
          title="Engagement Rate"
          value={formatPercent(kpis.engagementRate)}
          change={kpis.engagementRateChange}
          changeDir={kpis.engagementRateDir}
          icon={Zap}
          delay={4}
        />
        <KpiCard
          title="Peak Hour"
          value={kpis.peakHour}
          icon={TrendingUp}
          changeDir="neutral"
          delay={5}
        />
      </div>

      {/* Row 1: Hourly Traffic + Dwell Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Hourly Traffic Pattern */}
        <ChartCard
          title="Hourly Traffic Pattern"
          subtitle="Sessions and average dwell time by hour"
          delay={1}
        >
          <div style={{ height: '320px', marginTop: 'var(--space-md)' }}>
            {hourlyLineData.length > 0 ? (
              <ResponsiveLine
                data={hourlyLineData}
                theme={nivoTheme}
                margin={{ top: 20, right: 30, bottom: 50, left: 50 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Hour',
                  legendOffset: 42,
                  legendPosition: 'middle'
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  legend: 'Sessions',
                  legendOffset: -40,
                  legendPosition: 'middle'
                }}
                colors={[CHART_COLORS.navy, CHART_COLORS.gold]}
                pointSize={6}
                pointColor={{ from: 'color' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableArea={true}
                areaOpacity={0.1}
                useMesh={true}
                enableSlices="x"
                sliceTooltip={({ slice }) => (
                  <div style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                      {slice.points[0]?.data?.x}
                    </div>
                    {slice.points.map(point => (
                      <div key={point.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: point.serieColor }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{point.serieId}:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{point.data.yFormatted}</span>
                      </div>
                    ))}
                  </div>
                )}
                legends={[
                  {
                    anchor: 'top-right',
                    direction: 'row',
                    translateY: -20,
                    itemWidth: 100,
                    itemHeight: 20,
                    symbolSize: 10,
                    symbolShape: 'circle'
                  }
                ]}
              />
            ) : (
              <EmptyChart message="No hourly data available" />
            )}
          </div>
          {hourlyData && (
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
                Peak: <strong style={{ color: 'var(--text-primary)' }}>{hourlyData.peak_hour || '--'}</strong>
                {' | '}
                Quiet: <strong style={{ color: 'var(--text-primary)' }}>{hourlyData.quiet_hour || '--'}</strong>
              </span>
            </div>
          )}
        </ChartCard>

        {/* Dwell Distribution */}
        <ChartCard
          title="Dwell Time Distribution"
          subtitle={dwellData ? `${(dwellData.total_sessions || 0).toLocaleString()} total sessions` : 'Session duration breakdown'}
          delay={2}
        >
          <div style={{ height: '320px', marginTop: 'var(--space-md)' }}>
            {dwellBarData.length > 0 ? (
              <ResponsiveBar
                data={dwellBarData}
                theme={nivoTheme}
                keys={['count']}
                indexBy="label"
                margin={{ top: 10, right: 20, bottom: 50, left: 50 }}
                padding={0.3}
                colors={({ index }) => {
                  const palette = [
                    CHART_COLORS.danger,
                    CHART_COLORS.warning,
                    CHART_COLORS.gold,
                    CHART_COLORS.success,
                    CHART_COLORS.navy
                  ]
                  return palette[index % palette.length]
                }}
                borderRadius={4}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -30,
                  legend: 'Duration',
                  legendPosition: 'middle',
                  legendOffset: 42
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  legend: 'Sessions',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={20}
                labelSkipHeight={12}
                labelTextColor="var(--bg-primary)"
                tooltip={({ data: d }) => (
                  <div style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.08)'
                  }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{d.label}</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                      {d.count.toLocaleString()} sessions ({d.percentage}%)
                    </div>
                  </div>
                )}
              />
            ) : (
              <EmptyChart message="No dwell data available" />
            )}
          </div>
          {dwellBarData.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(dwellBarData.length, 5)}, 1fr)`,
              gap: 'var(--space-sm)',
              padding: 'var(--space-md)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              marginTop: 'var(--space-md)'
            }}>
              {dwellBarData.map((bin, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{bin.label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>{bin.percentage}%</div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Zone Performance + Conversion Funnel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Zone Performance */}
        <ChartCard
          title="Zone Performance"
          subtitle="Events and unique visitors by zone"
          delay={3}
        >
          <div style={{ height: '320px', marginTop: 'var(--space-md)' }}>
            {zoneBarData.length > 0 ? (
              <ResponsiveBar
                data={zoneBarData}
                theme={nivoTheme}
                keys={['total_events', 'unique_visitors']}
                indexBy="zone"
                margin={{ top: 10, right: 120, bottom: 50, left: 50 }}
                padding={0.25}
                groupMode="grouped"
                colors={[CHART_COLORS.navy, CHART_COLORS.gold]}
                borderRadius={3}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -30,
                  legend: 'Zone',
                  legendPosition: 'middle',
                  legendOffset: 42
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  legend: 'Count',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={24}
                labelSkipHeight={12}
                labelTextColor="var(--bg-primary)"
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'right',
                    direction: 'column',
                    translateX: 110,
                    itemWidth: 100,
                    itemHeight: 20,
                    symbolSize: 10,
                    symbolShape: 'circle',
                    effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
                  }
                ]}
                tooltip={({ id, value, indexValue, color }) => (
                  <div style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                      <strong style={{ color: 'var(--text-primary)' }}>{indexValue}</strong>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                      {id === 'total_events' ? 'Events' : 'Unique Visitors'}: {value.toLocaleString()}
                    </div>
                  </div>
                )}
              />
            ) : (
              <EmptyChart message="No zone data available" />
            )}
          </div>
        </ChartCard>

        {/* Conversion Funnel */}
        <ChartCard
          title="Conversion Funnel"
          subtitle="Visitor journey breakdown"
          delay={4}
        >
          <div style={{ height: '320px', marginTop: 'var(--space-md)' }}>
            {funnelBarData.length > 0 ? (
              <ResponsiveBar
                data={funnelBarData}
                theme={nivoTheme}
                keys={['value']}
                indexBy="stage"
                layout="horizontal"
                margin={{ top: 10, right: 30, bottom: 40, left: 120 }}
                padding={0.35}
                colors={({ data }) => data.color}
                borderRadius={4}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  legend: 'Count',
                  legendPosition: 'middle',
                  legendOffset: 32
                }}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 10
                }}
                enableLabel={true}
                label={d => `${d.value.toLocaleString()} (${d.data.pct}%)`}
                labelSkipWidth={60}
                labelTextColor="var(--bg-primary)"
                tooltip={({ data: d }) => (
                  <div style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.08)'
                  }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{d.stage}</strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                      {d.value.toLocaleString()} ({d.pct}%)
                    </div>
                  </div>
                )}
              />
            ) : (
              <EmptyChart message="No conversion data available" />
            )}
          </div>
          {conversionData && (
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
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Engagement</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--navy)' }}>
                  {formatPercent(conversionData.engagement_rate)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Bounce Rate</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--warning)' }}>
                  {formatPercent(conversionData.bounce_rate)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Conversion</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--success)' }}>
                  {formatPercent(conversionData.conversion_rate)}
                </div>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Flow Table + Period Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)'
      }}>
        {/* Zone-to-Zone Flow Table */}
        <ChartCard
          title="Zone-to-Zone Flow"
          subtitle="Transition counts between zones"
          delay={5}
        >
          <div className="data-table" style={{ marginTop: 'var(--space-md)', maxHeight: '360px', overflowY: 'auto' }}>
            {flowTableRows.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>From</th>
                    <th style={{ textAlign: 'center', width: 40 }}></th>
                    <th>To</th>
                    <th style={{ textAlign: 'right' }}>Count</th>
                    <th style={{ textAlign: 'right' }}>Flow</th>
                  </tr>
                </thead>
                <tbody>
                  {flowTableRows
                    .sort((a, b) => b.count - a.count)
                    .map((row, i) => {
                      const maxCount = flowTableRows[0]?.count || 1
                      const barWidth = Math.max(5, (row.count / maxCount) * 100)
                      return (
                        <motion.tr
                          key={`${row.from}-${row.to}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <td style={{ fontWeight: 500 }}>{row.from}</td>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            <ArrowRight size={14} />
                          </td>
                          <td style={{ fontWeight: 500 }}>{row.to}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {row.count.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', width: 100 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 'var(--space-xs)'
                            }}>
                              <div style={{
                                width: '80px',
                                height: '6px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-full)',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${barWidth}%`,
                                  height: '100%',
                                  background: CHART_COLORS.navy,
                                  borderRadius: 'var(--radius-full)',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                </tbody>
              </table>
            ) : (
              <div style={{
                padding: 'var(--space-xl)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.813rem'
              }}>
                No flow data available
              </div>
            )}
          </div>
        </ChartCard>

        {/* Period Comparison Cards */}
        <ChartCard
          title="Period Comparison"
          subtitle="Current vs previous period metrics"
          delay={6}
        >
          <div style={{ marginTop: 'var(--space-md)' }}>
            {periodCards.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                {periodCards.map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-lg)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 'var(--space-sm)'
                    }}>
                      {card.label}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {card.current}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          prev: {card.previous}
                        </div>
                      </div>
                      {card.change != null && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          fontSize: '0.813rem',
                          fontWeight: 600,
                          color: card.changeDir === 'positive' ? 'var(--success)' : card.changeDir === 'negative' ? 'var(--danger)' : 'var(--text-muted)',
                          background: card.changeDir === 'positive'
                            ? 'rgba(56, 161, 105, 0.1)'
                            : card.changeDir === 'negative'
                              ? 'rgba(229, 62, 62, 0.1)'
                              : 'var(--bg-tertiary)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {card.changeDir === 'positive' ? <ArrowUpRight size={12} /> : card.changeDir === 'negative' ? <ArrowDownRight size={12} /> : null}
                          {Math.abs(card.change)}%
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: 'var(--space-xl)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.813rem'
              }}>
                No comparison data available
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

// ============ Empty chart placeholder ============

function EmptyChart({ message }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-muted)',
      gap: 'var(--space-sm)'
    }}>
      <BarChart3 size={32} style={{ opacity: 0.4 }} />
      <span style={{ fontSize: '0.813rem' }}>{message}</span>
    </div>
  )
}

// ============ Data builder functions ============

function buildKpis(comparison, conversion, hourly) {
  const current = comparison?.current || {}
  const changes = comparison?.changes || {}

  const totalVisitors = current.total_visitors ?? conversion?.total_sessions ?? 0
  const avgDwell = current.avg_dwell_seconds ?? null
  const conversionRate = current.conversion_rate ?? conversion?.conversion_rate ?? null
  const bounceRate = current.bounce_rate ?? conversion?.bounce_rate ?? null
  const engagementRate = current.engagement_rate ?? conversion?.engagement_rate ?? null

  let peakHourLabel = '--'
  if (hourly?.peak_hour != null) {
    peakHourLabel = hourly.peak_hour
  }

  const tvChange = formatChange(changes.total_visitors)
  const adChange = formatChange(changes.avg_dwell_seconds)
  const crChange = formatChange(changes.conversion_rate)
  const brChange = formatChange(changes.bounce_rate)
  const erChange = formatChange(changes.engagement_rate)

  return {
    totalVisitors: totalVisitors,
    totalVisitorsChange: tvChange,
    totalVisitorsDir: changeType(tvChange),
    avgDwell: avgDwell,
    avgDwellChange: adChange,
    avgDwellDir: changeType(adChange),
    conversionRate: conversionRate,
    conversionRateChange: crChange,
    conversionRateDir: changeType(crChange),
    bounceRate: bounceRate,
    bounceRateChange: brChange != null ? Math.abs(Number(brChange)).toFixed(1) : null,
    bounceRateDir: brChange != null ? (Number(brChange) <= 0 ? 'positive' : 'negative') : 'neutral',
    engagementRate: engagementRate,
    engagementRateChange: erChange,
    engagementRateDir: changeType(erChange),
    peakHour: peakHourLabel
  }
}

function buildHourlyLine(hourly) {
  if (!hourly?.hours?.length) return []

  const sessionsLine = {
    id: 'Sessions',
    data: hourly.hours.map(h => ({
      x: h.label || `${String(h.hour).padStart(2, '0')}:00`,
      y: h.sessions ?? 0
    }))
  }

  const conversionsLine = {
    id: 'Conversions',
    data: hourly.hours.map(h => ({
      x: h.label || `${String(h.hour).padStart(2, '0')}:00`,
      y: h.conversions ?? 0
    }))
  }

  return [sessionsLine, conversionsLine]
}

function buildDwellBar(dwell) {
  if (!dwell?.bins?.length) return []
  return dwell.bins.map(bin => ({
    label: bin.label,
    count: bin.count,
    percentage: typeof bin.percentage === 'number' ? bin.percentage.toFixed(1) : bin.percentage
  }))
}

function buildZoneBar(zones) {
  if (!zones?.zones?.length) return []
  return zones.zones.map(z => ({
    zone: z.zone,
    total_events: z.total_events ?? 0,
    unique_visitors: z.unique_visitors ?? 0,
    capacity: z.capacity ?? 0
  }))
}

function buildFunnelBar(conversion) {
  if (!conversion) return []

  const total = conversion.total_sessions || 0
  if (total === 0) return []

  const conversions = conversion.conversions || 0
  const engagementRate = conversion.engagement_rate ?? 0
  const bounceRate = conversion.bounce_rate ?? 0

  const engaged = Math.round(total * (engagementRate / 100))
  const notBounced = Math.round(total * (1 - bounceRate / 100))
  const converted = conversions

  const stages = [
    { stage: 'Total Sessions', value: total, pct: '100.0', color: CHART_COLORS.navy },
    { stage: 'Engaged', value: engaged, pct: total > 0 ? ((engaged / total) * 100).toFixed(1) : '0.0', color: CHART_COLORS.navyLight },
    { stage: 'Not Bounced', value: notBounced, pct: total > 0 ? ((notBounced / total) * 100).toFixed(1) : '0.0', color: CHART_COLORS.gold },
    { stage: 'Converted', value: converted, pct: total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0', color: CHART_COLORS.success }
  ]

  return stages
}

function buildPeriodCards(comparison) {
  if (!comparison?.current || !comparison?.previous) return []

  const cur = comparison.current
  const prev = comparison.previous
  const chg = comparison.changes || {}

  const cards = [
    {
      label: 'Total Visitors',
      current: (cur.total_visitors ?? 0).toLocaleString(),
      previous: (prev.total_visitors ?? 0).toLocaleString(),
      change: formatChange(chg.total_visitors),
      changeDir: changeType(chg.total_visitors)
    },
    {
      label: 'Avg Dwell',
      current: formatDwell(cur.avg_dwell_seconds),
      previous: formatDwell(prev.avg_dwell_seconds),
      change: formatChange(chg.avg_dwell_seconds),
      changeDir: changeType(chg.avg_dwell_seconds)
    },
    {
      label: 'Conversion Rate',
      current: formatPercent(cur.conversion_rate),
      previous: formatPercent(prev.conversion_rate),
      change: formatChange(chg.conversion_rate),
      changeDir: changeType(chg.conversion_rate)
    },
    {
      label: 'Bounce Rate',
      current: formatPercent(cur.bounce_rate),
      previous: formatPercent(prev.bounce_rate),
      change: formatChange(chg.bounce_rate) != null ? Math.abs(Number(formatChange(chg.bounce_rate))).toFixed(1) : null,
      changeDir: chg.bounce_rate != null ? (Number(chg.bounce_rate) <= 0 ? 'positive' : 'negative') : 'neutral'
    },
    {
      label: 'Engagement Rate',
      current: formatPercent(cur.engagement_rate),
      previous: formatPercent(prev.engagement_rate),
      change: formatChange(chg.engagement_rate),
      changeDir: changeType(chg.engagement_rate)
    }
  ]

  return cards
}
