import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveLine } from '@nivo/line'
import {
  MapPin, RefreshCw, ArrowRight, Users, Clock, Target, Gauge
} from 'lucide-react'
import SparklineKPI from '../components/SparklineKPI'

const API = 'http://localhost:8000'

const nivoTheme = {
  text: { fill: 'var(--text-secondary)' },
  axis: {
    ticks: { text: { fill: 'var(--text-muted)', fontSize: 11 } },
    legend: { text: { fill: 'var(--text-secondary)', fontSize: 12 } }
  },
  grid: { line: { stroke: 'var(--border)', strokeWidth: 1 } },
  tooltip: {
    container: {
      background: 'var(--bg-primary)', border: '1px solid var(--border)',
      borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
      padding: '8px 12px', boxShadow: '0 4px 6px rgba(0,0,0,0.08)'
    }
  }
}

const COLORS = {
  navy: '#1e3a5f', gold: '#c9a227', success: '#38a169', info: '#3182ce',
  danger: '#e53e3e', purple: '#805ad5', teal: '#319795'
}

const ZONE_COLORS = [COLORS.navy, COLORS.gold, COLORS.success, COLORS.info, COLORS.purple, COLORS.teal]

function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <RefreshCw size={24} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
  </div>
}

function formatDwell(s) {
  if (!s) return '--'
  if (s < 60) return `${Math.round(s)}s`
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

function GaugeChart({ value, max = 100, color = COLORS.navy, size = 80 }) {
  const pct = Math.min(value / max, 1)
  const angle = pct * 180
  const r = size / 2 - 6
  const cx = size / 2
  const cy = size / 2
  const endAngle = (Math.PI * (180 - angle)) / 180
  const endX = cx + r * Math.cos(endAngle)
  const endY = cy - r * Math.sin(endAngle)
  const largeArc = angle > 180 ? 1 : 0

  return (
    <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="var(--bg-tertiary)" strokeWidth={8} strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
        fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text-primary)">
        {Math.round(value)}%
      </text>
    </svg>
  )
}

export default function ZoneExplorer() {
  const [rankings, setRankings] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [zoneDetail, setZoneDetail] = useState(null)
  const [compareZones, setCompareZones] = useState([])
  const [compareData, setCompareData] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchRankings = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${API}/api/zone-rankings?hours=168`).then(r => r.json())
      setRankings(resp.zones || [])
      if (resp.zones?.length > 0 && !selectedZone) {
        setSelectedZone(resp.zones[0].zone_id)
      }
    } catch (e) {
      console.error('ZoneExplorer fetch error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchRankings() }, [fetchRankings])

  const fetchZoneDetail = useCallback(async (zoneId) => {
    setDetailLoading(true)
    try {
      const resp = await fetch(`${API}/api/zones/${zoneId}/detail?hours=168`).then(r => r.json())
      setZoneDetail(resp)
    } catch (e) {
      console.error('Zone detail error:', e)
    }
    setDetailLoading(false)
  }, [])

  useEffect(() => {
    if (selectedZone) fetchZoneDetail(selectedZone)
  }, [selectedZone, fetchZoneDetail])

  // Fetch compare data
  useEffect(() => {
    if (compareZones.length < 2) { setCompareData([]); return }
    Promise.all(
      compareZones.map(zid => fetch(`${API}/api/zones/${zid}/detail?hours=168`).then(r => r.json()))
    ).then(setCompareData).catch(() => {})
  }, [compareZones])

  const toggleCompare = (zoneId) => {
    setCompareZones(prev => {
      if (prev.includes(zoneId)) return prev.filter(z => z !== zoneId)
      if (prev.length >= 3) return prev
      return [...prev, zoneId]
    })
  }

  if (loading) return <Spinner />

  // Hourly bar data for selected zone
  const hourlyData = zoneDetail?.hourly_pattern?.map(h => ({
    hour: `${h.hour}:00`,
    events: h.events,
  })) || []

  // Daily line data
  const dailyLineData = zoneDetail?.daily_trend?.length > 0 ? [{
    id: zoneDetail.zone_name,
    data: zoneDetail.daily_trend.map(d => ({ x: d.date, y: d.events }))
  }] : []

  // Compare overlay lines
  const compareLines = compareData.map((cd, i) => ({
    id: cd.zone_name,
    data: (cd.hourly_pattern || []).map(h => ({ x: `${h.hour}`, y: h.events })),
    color: ZONE_COLORS[i % ZONE_COLORS.length],
  }))

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Zone Explorer</h1>
          <p className="page-subtitle">Deep dive into individual zone performance</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchRankings}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Zone Selector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {rankings.map((z, i) => (
          <motion.div
            key={z.zone_id}
            className="card"
            onClick={() => setSelectedZone(z.zone_id)}
            whileHover={{ y: -2 }}
            style={{
              padding: 'var(--space-md)',
              cursor: 'pointer',
              border: selectedZone === z.zone_id ? `2px solid ${COLORS.navy}` : '2px solid transparent',
              transition: 'border 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>
                <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4, color: ZONE_COLORS[i % ZONE_COLORS.length] }} />
                {z.zone_name.replace('_', ' ')}
              </span>
              <input type="checkbox" checked={compareZones.includes(z.zone_id)}
                onChange={(e) => { e.stopPropagation(); toggleCompare(z.zone_id) }}
                title="Compare"
                style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <GaugeChart value={Math.min(z.utilization_pct, 100)} color={ZONE_COLORS[i % ZONE_COLORS.length]} size={60} />
              <div style={{ fontSize: '0.75rem' }}>
                <div><Users size={10} style={{ verticalAlign: 'middle' }} /> {z.unique_visitors}</div>
                <div style={{ color: 'var(--text-muted)' }}>{z.total_events} events</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Zone Detail */}
      {zoneDetail && !detailLoading && (
        <>
          <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {zoneDetail.zone_name.replace('_', ' ')} — Detail
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                {zoneDetail.zone_type}
              </span>
            </h3>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              <SparklineKPI title="Total Events" value={zoneDetail.total_events} icon={Users} color={COLORS.navy}
                trendData={zoneDetail.daily_trend?.map(d => d.events)} />
              <SparklineKPI title="Avg Dwell" value={formatDwell(zoneDetail.avg_dwell)} icon={Clock} color={COLORS.info} />
              <SparklineKPI title="Conversion" value={`${zoneDetail.conversion_rate}%`} icon={Target} color={COLORS.success} />
              <SparklineKPI title="Utilization" value={`${zoneDetail.utilization_pct}%`} icon={Gauge} color={COLORS.gold} />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              {/* Hourly Traffic */}
              <div>
                <h4 style={{ margin: '0 0 var(--space-sm)', fontSize: '0.9rem', fontWeight: 500 }}>Hourly Traffic Pattern</h4>
                <div style={{ height: 220 }}>
                  {hourlyData.length > 0 ? (
                    <ResponsiveBar
                      data={hourlyData}
                      keys={['events']}
                      indexBy="hour"
                      theme={nivoTheme}
                      margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
                      padding={0.25}
                      colors={[COLORS.navy]}
                      borderRadius={3}
                      axisBottom={{ tickValues: 'every 4 hours', tickRotation: 0 }}
                      enableLabel={false}
                    />
                  ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 80 }}>No data</div>}
                </div>
              </div>

              {/* Daily Trend */}
              <div>
                <h4 style={{ margin: '0 0 var(--space-sm)', fontSize: '0.9rem', fontWeight: 500 }}>7-Day Trend</h4>
                <div style={{ height: 220 }}>
                  {dailyLineData.length > 0 ? (
                    <ResponsiveLine
                      data={dailyLineData}
                      theme={nivoTheme}
                      margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
                      xScale={{ type: 'point' }}
                      yScale={{ type: 'linear', min: 0, max: 'auto' }}
                      curve="monotoneX"
                      colors={[COLORS.info]}
                      pointSize={6}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      enableArea
                      areaOpacity={0.1}
                      useMesh
                      axisBottom={{ tickRotation: -30 }}
                    />
                  ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 80 }}>No data</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Transitions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h4 style={{ margin: '0 0 var(--space-md)', fontSize: '0.9rem', fontWeight: 600 }}>
                <ArrowRight size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Inbound Transitions
              </h4>
              {zoneDetail.top_inbound?.length > 0 ? (
                zoneDetail.top_inbound.map(([from, count], i) => {
                  const total = zoneDetail.top_inbound.reduce((s, [, c]) => s + c, 0)
                  const pct = Math.round(count / total * 100)
                  return (
                    <div key={i} style={{ marginBottom: 'var(--space-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
                        <span style={{ textTransform: 'capitalize' }}>{from.replace('_', ' ')}</span>
                        <span style={{ fontWeight: 600 }}>{pct}% ({count})</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          style={{ height: '100%', background: COLORS.info, borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })
              ) : <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No inbound data</div>}
            </div>

            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h4 style={{ margin: '0 0 var(--space-md)', fontSize: '0.9rem', fontWeight: 600 }}>
                <ArrowRight size={14} style={{ verticalAlign: 'middle', marginRight: 6, transform: 'rotate(180deg)' }} />
                Outbound Transitions
              </h4>
              {zoneDetail.top_outbound?.length > 0 ? (
                zoneDetail.top_outbound.map(([to, count], i) => {
                  const total = zoneDetail.top_outbound.reduce((s, [, c]) => s + c, 0)
                  const pct = Math.round(count / total * 100)
                  return (
                    <div key={i} style={{ marginBottom: 'var(--space-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
                        <span style={{ textTransform: 'capitalize' }}>{to.replace('_', ' ')}</span>
                        <span style={{ fontWeight: 600 }}>{pct}% ({count})</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          style={{ height: '100%', background: COLORS.gold, borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })
              ) : <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No outbound data</div>}
            </div>
          </div>
        </>
      )}

      {detailLoading && <Spinner />}

      {/* Zone Comparison */}
      {compareData.length >= 2 && (
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
            Zone Comparison
            <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
              {compareData.map(d => d.zone_name).join(' vs ')}
            </span>
          </h3>

          {/* Overlay Chart */}
          <div style={{ height: 280, marginBottom: 'var(--space-lg)' }}>
            <ResponsiveLine
              data={compareLines}
              theme={nivoTheme}
              margin={{ top: 10, right: 100, bottom: 40, left: 45 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, max: 'auto' }}
              curve="monotoneX"
              colors={compareLines.map(l => l.color)}
              pointSize={3}
              useMesh
              legends={[{
                anchor: 'right', direction: 'column', translateX: 90,
                itemWidth: 80, itemHeight: 20, symbolSize: 10
              }]}
            />
          </div>

          {/* Side-by-side metrics */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: 8, color: 'var(--text-muted)' }}>Metric</th>
                  {compareData.map((d, i) => (
                    <th key={i} style={{ textAlign: 'right', padding: 8, color: ZONE_COLORS[i % ZONE_COLORS.length], fontWeight: 600, textTransform: 'capitalize' }}>
                      {d.zone_name.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Total Events', key: 'total_events' },
                  { label: 'Avg Dwell', key: 'avg_dwell', fmt: formatDwell },
                  { label: 'Conversion', key: 'conversion_rate', suffix: '%' },
                  { label: 'Utilization', key: 'utilization_pct', suffix: '%' },
                  { label: 'Capacity', key: 'capacity' },
                ].map((metric, mi) => (
                  <tr key={mi} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 8, fontWeight: 500 }}>{metric.label}</td>
                    {compareData.map((d, i) => (
                      <td key={i} style={{ padding: 8, textAlign: 'right' }}>
                        {metric.fmt ? metric.fmt(d[metric.key]) : `${d[metric.key]}${metric.suffix || ''}`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
