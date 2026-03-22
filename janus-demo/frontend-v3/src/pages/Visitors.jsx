import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveBar } from '@nivo/bar'
import {
  Users, Clock, Target, ArrowUpRight, RefreshCw,
  ChevronDown, ChevronRight, CheckCircle2, XCircle
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

const COLORS = { navy: '#1e3a5f', gold: '#c9a227', success: '#38a169', info: '#3182ce', danger: '#e53e3e' }

function formatDwell(s) {
  if (!s) return '--'
  if (s < 60) return `${Math.round(s)}s`
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${Math.round(s % 60)}s`
}

function formatTime(iso) {
  if (!iso) return '--'
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <RefreshCw size={24} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
  </div>
}

export default function Visitors() {
  const [sessions, setSessions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [expandedRow, setExpandedRow] = useState(null)
  const [conversion, setConversion] = useState(null)
  const [dwell, setDwell] = useState(null)
  const [distribution, setDistribution] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortCol, setSortCol] = useState('entry_time')
  const [sortDir, setSortDir] = useState('desc')
  const limit = 25

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [sessResp, convResp, dwellResp, distResp] = await Promise.all([
        fetch(`${API}/api/sessions/recent?limit=${limit}&offset=${page * limit}`).then(r => r.json()),
        fetch(`${API}/api/conversion`).then(r => r.json()),
        fetch(`${API}/api/dwell-time`).then(r => r.json()),
        fetch(`${API}/api/dwell-distribution`).then(r => r.json()),
      ])
      setSessions(sessResp.sessions || [])
      setTotal(sessResp.total || 0)
      setConversion(convResp)
      setDwell(dwellResp)
      setDistribution(distResp)
    } catch (e) {
      console.error('Visitors fetch error:', e)
    }
    setLoading(false)
  }, [page])

  useEffect(() => { fetchData() }, [fetchData])

  const sortedSessions = [...sessions].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortCol === 'dwell_seconds') return (a.dwell_seconds - b.dwell_seconds) * mul
    if (sortCol === 'zones_visited_count') return (a.zones_visited_count - b.zones_visited_count) * mul
    if (sortCol === 'converted') return (a.converted - b.converted) * mul
    return a.entry_time > b.entry_time ? mul : -mul
  })

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const SortIcon = ({ col }) => sortCol === col
    ? <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
    : null

  // Histogram data
  const histData = distribution?.bins?.map(b => ({
    label: b.label,
    count: b.count,
  })) || []

  if (loading && sessions.length === 0) return <Spinner />

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visitors</h1>
          <p className="page-subtitle">Individual session details and duration analysis</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <SparklineKPI title="Total Sessions" value={conversion?.total_sessions || 0} icon={Users} color={COLORS.navy} />
        <SparklineKPI title="Avg Duration" value={formatDwell(dwell?.avg_dwell_seconds)} icon={Clock} color={COLORS.info} />
        <SparklineKPI
          title="Conversion Rate"
          value={`${conversion?.conversion_rate || 0}%`}
          icon={Target} color={COLORS.success}
          subtitle={`${conversion?.conversions || 0} conversions`}
        />
        <SparklineKPI
          title="Bounce Rate"
          value={`${conversion?.bounce_rate || 0}%`}
          icon={ArrowUpRight} color={COLORS.danger}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        {/* Sessions Table */}
        <div className="card" style={{ padding: 'var(--space-lg)', overflow: 'hidden' }}>
          <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
            Recent Sessions
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
              {total} total
            </span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ width: 28 }}></th>
                  <th onClick={() => toggleSort('entry_time')} style={{ textAlign: 'left', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    Time <SortIcon col="entry_time" />
                  </th>
                  <th onClick={() => toggleSort('dwell_seconds')} style={{ textAlign: 'right', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Duration <SortIcon col="dwell_seconds" />
                  </th>
                  <th onClick={() => toggleSort('zones_visited_count')} style={{ textAlign: 'right', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Zones <SortIcon col="zones_visited_count" />
                  </th>
                  <th onClick={() => toggleSort('converted')} style={{ textAlign: 'center', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Conv <SortIcon col="converted" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.map((s, i) => (
                  <motion.tr key={`${s.person_id}-${i}`}
                    initial={false}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                  >
                    <td style={{ padding: '8px 4px' }}>
                      {expandedRow === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                      <div>{formatTime(s.entry_time)} - {formatTime(s.exit_time)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(s.entry_time)}</div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>{formatDwell(s.dwell_seconds)}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{s.zones_visited_count}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {s.converted ? <CheckCircle2 size={16} color={COLORS.success} /> : <XCircle size={16} color="var(--text-muted)" style={{ opacity: 0.4 }} />}
                    </td>
                  </motion.tr>
                ))}
                {sortedSessions.map((s, i) => expandedRow === i && (
                  <tr key={`exp-${i}`}>
                    <td colSpan={5} style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.8rem' }}>
                        <strong>Visitor:</strong> {s.person_id} &nbsp;|&nbsp;
                        <strong>Journey:</strong>{' '}
                        <span style={{ fontFamily: 'monospace' }}>{s.zone_path?.join(' → ')}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn btn-ghost btn-sm" disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>

        {/* Duration Distribution */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
            Duration Distribution
          </h3>
          <div style={{ height: 300 }}>
            {histData.length > 0 ? (
              <ResponsiveBar
                data={histData}
                keys={['count']}
                indexBy="label"
                theme={nivoTheme}
                margin={{ top: 10, right: 10, bottom: 60, left: 50 }}
                padding={0.3}
                colors={[COLORS.navy]}
                borderRadius={4}
                axisBottom={{ tickRotation: -30 }}
                axisLeft={{ legend: 'Sessions', legendOffset: -40, legendPosition: 'middle' }}
                enableLabel
                label={d => d.value}
                labelTextColor="white"
              />
            ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 100 }}>No data</div>}
          </div>
          {distribution?.bins && (
            <div style={{ marginTop: 'var(--space-sm)' }}>
              {distribution.bins.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{b.label}</span>
                  <span style={{ fontWeight: 500 }}>{b.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
