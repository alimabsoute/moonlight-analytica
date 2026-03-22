import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveBar } from '@nivo/bar'
import {
  TrendingUp, Users, DollarSign, Target, Calendar,
  BarChart3, RefreshCw, ArrowUpRight, Route
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
  },
  legends: { text: { fill: 'var(--text-secondary)', fontSize: 11 } }
}

const COLORS = {
  navy: '#1e3a5f', gold: '#c9a227', success: '#38a169',
  info: '#3182ce', purple: '#805ad5', teal: '#319795', danger: '#e53e3e'
}

function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <RefreshCw size={24} className="spin" style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
  </div>
}

function formatDwell(s) {
  if (!s) return '--'
  if (s < 60) return `${Math.round(s)}s`
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

export default function DeepAnalytics() {
  const [trends, setTrends] = useState(null)
  const [cohorts, setCohorts] = useState(null)
  const [journeys, setJourneys] = useState(null)
  const [peakData, setPeakData] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [trendMetric, setTrendMetric] = useState('visitors')
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [t, c, j, p, cmp, r] = await Promise.all([
        fetch(`${API}/api/trends?days=30`).then(r => r.json()),
        fetch(`${API}/api/cohort-analysis`).then(r => r.json()),
        fetch(`${API}/api/customer-journey`).then(r => r.json()),
        fetch(`${API}/api/peak-analysis`).then(r => r.json()),
        fetch(`${API}/api/hourly-comparison`).then(r => r.json()),
        fetch(`${API}/api/revenue-estimates`).then(r => r.json()),
      ])
      setTrends(t.trends || [])
      setCohorts(c.cohorts || [])
      setJourneys(j.journeys || [])
      setPeakData(p)
      setComparison(cmp.comparison || [])
      setRevenue(r)
    } catch (e) {
      console.error('DeepAnalytics fetch error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return <Spinner />

  // Trend line chart data
  const trendLineData = trends ? [{
    id: trendMetric,
    data: trends.map(t => ({
      x: t.date,
      y: trendMetric === 'visitors' ? t.visitors
        : trendMetric === 'conversions' ? t.conversions
        : trendMetric === 'bounce_rate' ? t.bounce_rate
        : t.avg_dwell
    }))
  }] : []

  const trendColor = trendMetric === 'visitors' ? COLORS.navy
    : trendMetric === 'conversions' ? COLORS.success
    : trendMetric === 'bounce_rate' ? COLORS.danger : COLORS.info

  // Hourly comparison lines
  const compLines = comparison ? [
    { id: 'Today', data: comparison.map(c => ({ x: c.label, y: c.today })), color: COLORS.navy },
    { id: 'Yesterday', data: comparison.map(c => ({ x: c.label, y: c.yesterday })), color: COLORS.gold },
    { id: 'Last Week', data: comparison.map(c => ({ x: c.label, y: c.last_week })), color: COLORS.info },
  ] : []

  // DOW bar data
  const dowData = peakData?.dow_averages?.map(d => ({
    day: d.day,
    visitors: d.avg_visitors,
  })) || []

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Deep Analytics</h1>
          <p className="page-subtitle">30-day trends, cohorts, journeys, and revenue modeling</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAll}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Section F: Revenue KPIs */}
      {revenue && (
        <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <SparklineKPI
            title="Est. Revenue" value={`$${revenue.estimated_revenue?.toLocaleString()}`}
            icon={DollarSign} color={COLORS.success}
            trendData={revenue.daily_revenue?.map(d => d.estimated_revenue)}
            subtitle={`$${revenue.daily_avg_revenue}/day avg`}
          />
          <SparklineKPI
            title="Revenue / Visitor" value={`$${revenue.revenue_per_visitor}`}
            icon={Users} color={COLORS.navy}
            trendData={trends?.slice(-7).map(t => t.conversions)}
            subtitle={`${revenue.total_conversions} conversions`}
          />
          <SparklineKPI
            title="Conversion Value" value={`$${revenue.conversion_value}`}
            icon={Target} color={COLORS.gold}
            subtitle="Avg transaction value"
          />
          <SparklineKPI
            title="Daily Avg Revenue" value={`$${revenue.daily_avg_revenue}`}
            icon={TrendingUp} color={COLORS.info}
            trendData={revenue.daily_revenue?.slice(-7).map(d => d.estimated_revenue)}
          />
        </div>
      )}

      {/* Section A: Daily Trend Chart */}
      <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
            <BarChart3 size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            30-Day Trend
          </h3>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            {['visitors', 'conversions', 'bounce_rate', 'avg_dwell'].map(m => (
              <button key={m} className={`btn btn-sm ${trendMetric === m ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTrendMetric(m)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                {m === 'avg_dwell' ? 'Dwell' : m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 280 }}>
          {trendLineData[0]?.data?.length > 0 ? (
            <ResponsiveLine
              data={trendLineData}
              theme={nivoTheme}
              margin={{ top: 10, right: 20, bottom: 50, left: 50 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
              curve="monotoneX"
              colors={[trendColor]}
              pointSize={4}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              enableArea
              areaOpacity={0.08}
              axisBottom={{ tickRotation: -45, tickValues: 'every 5 days' }}
              useMesh
              enableSlices="x"
            />
          ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 100 }}>No trend data</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        {/* Section B: Cohort Breakdown */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
            <Users size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Visitor Cohorts
          </h3>
          {cohorts && cohorts.map(c => (
            <div key={c.id} style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 500 }}>{c.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{c.count} ({c.pct_of_total}%)</span>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 4, height: 24, position: 'relative', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct_of_total}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  style={{
                    height: '100%', borderRadius: 4,
                    background: c.id === 'quick' ? COLORS.danger : c.id === 'casual' ? COLORS.gold : c.id === 'engaged' ? COLORS.info : COLORS.success,
                  }}
                />
                <span style={{ position: 'absolute', right: 8, top: 3, fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {c.conversion_rate}% conv
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Section D: Day-of-Week Pattern */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
            <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Day-of-Week Pattern
          </h3>
          <div style={{ height: 240 }}>
            {dowData.length > 0 ? (
              <ResponsiveBar
                data={dowData}
                keys={['visitors']}
                indexBy="day"
                theme={nivoTheme}
                margin={{ top: 10, right: 10, bottom: 40, left: 45 }}
                padding={0.3}
                colors={({ index }) => {
                  // Highlight weekend bars
                  return index === 0 || index === 6 ? COLORS.gold : COLORS.navy
                }}
                borderRadius={4}
                axisLeft={{ legend: 'Avg Visitors', legendOffset: -40, legendPosition: 'middle' }}
                enableLabel={false}
              />
            ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 80 }}>No data</div>}
          </div>
          {peakData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', fontSize: '0.8rem' }}>
              <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)' }}>Weekday Avg</div>
                <div style={{ fontWeight: 600 }}>{peakData.weekday_avg}</div>
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)' }}>Weekend Avg</div>
                <div style={{ fontWeight: 600 }}>{peakData.weekend_avg}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section E: Hourly Comparison */}
      <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
          <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Today vs Yesterday vs Last Week
        </h3>
        <div style={{ height: 280 }}>
          {compLines[0]?.data?.length > 0 ? (
            <ResponsiveLine
              data={compLines}
              theme={nivoTheme}
              margin={{ top: 10, right: 100, bottom: 40, left: 45 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, max: 'auto' }}
              curve="monotoneX"
              colors={[COLORS.navy, COLORS.gold, COLORS.info]}
              pointSize={3}
              enableArea={false}
              useMesh
              legends={[{
                anchor: 'right', direction: 'column', translateX: 90,
                itemWidth: 80, itemHeight: 20, symbolSize: 10
              }]}
              axisBottom={{ tickValues: 'every 3 hours' }}
            />
          ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 100 }}>No comparison data</div>}
        </div>
      </div>

      {/* Section C: Customer Journeys */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
          <Route size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Top Customer Journeys
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Zone Path</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Sessions</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Avg Dwell</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>Conversion</th>
              </tr>
            </thead>
            <tbody>
              {journeys && journeys.map((j, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.8rem' }}>{j.path}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{j.sessions}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatDwell(j.avg_dwell)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                      background: j.conversion_rate > 30 ? '#38a16920' : '#e53e3e20',
                      color: j.conversion_rate > 30 ? COLORS.success : COLORS.danger,
                    }}>
                      {j.conversion_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
