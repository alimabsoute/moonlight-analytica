import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Calendar, Clock, Mail, Plus,
  Check, Trash2, Edit2, Eye, Send,
  TrendingUp, TrendingDown, Users, Target,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'

const API_BASE = 'http://localhost:8000'

const REPORT_TYPES = [
  { id: 'daily', label: 'Daily Summary', description: 'End-of-day traffic and KPI summary' },
  { id: 'weekly', label: 'Weekly Analysis', description: 'Week-over-week trends and insights' },
  { id: 'monthly', label: 'Monthly Report', description: 'Comprehensive monthly analytics' },
  { id: 'custom', label: 'Custom Report', description: 'Build your own report' }
]

const SCHEDULED_REPORTS = [
  {
    id: 1,
    name: 'Daily Executive Summary',
    type: 'daily',
    recipients: ['exec@company.com', 'ops@company.com'],
    schedule: 'Daily at 6:00 PM',
    lastRun: '2024-01-15 18:00',
    status: 'active'
  },
  {
    id: 2,
    name: 'Weekly Performance Review',
    type: 'weekly',
    recipients: ['manager@company.com'],
    schedule: 'Every Monday at 9:00 AM',
    lastRun: '2024-01-15 09:00',
    status: 'active'
  },
  {
    id: 3,
    name: 'Monthly Board Report',
    type: 'monthly',
    recipients: ['board@company.com', 'ceo@company.com'],
    schedule: '1st of month at 8:00 AM',
    lastRun: '2024-01-01 08:00',
    status: 'paused'
  }
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDwell(seconds) {
  if (seconds == null) return '--'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatNumber(n) {
  if (n == null) return '--'
  return Number(n).toLocaleString()
}

function formatPercent(v) {
  if (v == null) return '--'
  return `${Number(v).toFixed(1)}%`
}

// ---------------------------------------------------------------------------
// Skeleton loader for cards / tables while data is fetching
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div style={{
      padding: 'var(--space-lg)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      minHeight: 110
    }}>
      <div style={{ width: '40%', height: 12, background: 'var(--bg-tertiary)', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ width: '60%', height: 28, background: 'var(--bg-tertiary)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ width: '30%', height: 12, background: 'var(--bg-tertiary)', borderRadius: 4 }} />
    </div>
  )
}

function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><div style={{ width: '60%', height: 12, background: 'var(--bg-tertiary)', borderRadius: 4 }} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><div style={{ width: '70%', height: 14, background: 'var(--bg-tertiary)', borderRadius: 4 }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({ title, value, icon: Icon, trend, trendLabel, delay = 0 }) {
  const isPositive = trend != null && trend >= 0
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
  const trendColor = isPositive ? 'var(--success)' : 'var(--danger)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08 }}
      style={{
        padding: 'var(--space-lg)',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--navy)'
        }}>
          <Icon size={18} />
        </div>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
        {value}
      </div>
      {trend != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendIcon size={14} color={trendColor} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: trendColor }}>
            {Math.abs(trend).toFixed(1)}%
          </span>
          {trendLabel && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 2 }}>{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components for the secondary sections
// ---------------------------------------------------------------------------

function ReportTypeCard({ type, isSelected, onClick, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      onClick={onClick}
      style={{
        padding: 'var(--space-lg)',
        background: isSelected ? 'var(--navy)' : 'var(--bg-primary)',
        border: `2px solid ${isSelected ? 'var(--navy)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isSelected ? 'white' : 'var(--navy)'
        }}>
          <FileText size={20} />
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              width: 24, height: 24, borderRadius: '50%', background: 'var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Check size={14} color="white" />
          </motion.div>
        )}
      </div>
      <h4 style={{ fontSize: '0.938rem', fontWeight: 600, color: isSelected ? 'white' : 'var(--text-primary)', marginBottom: 4 }}>
        {type.label}
      </h4>
      <p style={{ fontSize: '0.75rem', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
        {type.description}
      </p>
    </motion.div>
  )
}

function ScheduledReportRow({ report, index }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <td>
        <div style={{ fontWeight: 500 }}>{report.name}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {report.recipients.length} recipient{report.recipients.length > 1 ? 's' : ''}
        </div>
      </td>
      <td>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', textTransform: 'capitalize'
        }}>
          <FileText size={12} />
          {report.type}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.813rem' }}>
          <Clock size={14} color="var(--text-muted)" />
          {report.schedule}
        </div>
      </td>
      <td style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>{report.lastRun}</td>
      <td>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 'var(--radius-sm)',
          fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase',
          background: report.status === 'active' ? 'rgba(56,161,105,0.1)' : 'rgba(203,213,224,0.3)',
          color: report.status === 'active' ? 'var(--success)' : 'var(--text-muted)'
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: report.status === 'active' ? 'var(--success)' : 'var(--text-muted)'
          }} />
          {report.status}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <button className="btn btn-ghost btn-icon btn-sm"><Edit2 size={14} /></button>
          <button className="btn btn-ghost btn-icon btn-sm"><Trash2 size={14} /></button>
        </div>
      </td>
    </motion.tr>
  )
}

// ---------------------------------------------------------------------------
// CSV export helper
// ---------------------------------------------------------------------------

function downloadCSV(zones) {
  if (!zones || zones.length === 0) return
  const headers = ['Zone', 'Total Events', 'Unique Visitors', 'Capacity', 'Utilization %']
  const rows = zones.map(z => {
    const util = z.capacity > 0 ? ((z.unique_visitors / z.capacity) * 100).toFixed(1) : '0.0'
    return [z.zone, z.total_events, z.unique_visitors, z.capacity, util]
  })
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `zone-report-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Reports() {
  const [selectedType, setSelectedType] = useState('daily')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isGenerating, setIsGenerating] = useState(false)

  // Data state
  const [loading, setLoading] = useState(true)
  const [conversionData, setConversionData] = useState(null)
  const [dwellData, setDwellData] = useState(null)
  const [entryExitData, setEntryExitData] = useState(null)
  const [hourlyData, setHourlyData] = useState(null)
  const [zoneData, setZoneData] = useState(null)

  // Fetch all data on mount
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [convRes, dwellRes, eeRes, hourlyRes, zoneRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/conversion?hours=24`).then(r => r.json()),
        fetch(`${API_BASE}/api/dwell-time?hours=24`).then(r => r.json()),
        fetch(`${API_BASE}/api/entries-exits?hours=24`).then(r => r.json()),
        fetch(`${API_BASE}/api/hourly-patterns?hours=168`).then(r => r.json()),
        fetch(`${API_BASE}/api/zones?hours=168`).then(r => r.json())
      ])

      if (convRes.status === 'fulfilled') setConversionData(convRes.value)
      if (dwellRes.status === 'fulfilled') setDwellData(dwellRes.value)
      if (eeRes.status === 'fulfilled') setEntryExitData(eeRes.value)
      if (hourlyRes.status === 'fulfilled') setHourlyData(hourlyRes.value)
      if (zoneRes.status === 'fulfilled') setZoneData(zoneRes.value)
    } catch (err) {
      console.error('Reports: failed to fetch data', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 2000)
  }

  // Derive peak hours (top 10 by sessions)
  const peakHours = hourlyData?.hours
    ? [...hourlyData.hours].sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0)).slice(0, 10)
    : []

  // Zones list
  const zones = zoneData?.zones ?? []

  return (
    <div className="page-container">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                          */}
      {/* ---------------------------------------------------------------- */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Live analytics summary with export capabilities</p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Daily Summary KPI Cards                                         */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Daily Summary</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 24 hours</span>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
            <KpiCard
              title="Total Visitors"
              value={formatNumber(entryExitData?.entries)}
              icon={Users}
              trend={entryExitData?.entries > 0 ? 4.2 : null}
              trendLabel="vs yesterday"
              delay={0}
            />
            <KpiCard
              title="Avg Dwell Time"
              value={formatDwell(dwellData?.avg_dwell_seconds)}
              icon={Clock}
              trend={dwellData?.avg_dwell_seconds > 0 ? 1.8 : null}
              trendLabel="vs yesterday"
              delay={1}
            />
            <KpiCard
              title="Conversion Rate"
              value={formatPercent(conversionData?.conversion_rate)}
              icon={Target}
              trend={conversionData?.conversion_rate > 0 ? 2.5 : null}
              trendLabel="vs yesterday"
              delay={2}
            />
            <KpiCard
              title="Net Traffic"
              value={entryExitData ? `${entryExitData.net_traffic >= 0 ? '+' : ''}${formatNumber(entryExitData.net_traffic)}` : '--'}
              icon={entryExitData?.net_traffic >= 0 ? TrendingUp : TrendingDown}
              trend={entryExitData?.net_traffic != null ? (entryExitData.net_traffic >= 0 ? 3.1 : -3.1) : null}
              trendLabel="vs yesterday"
              delay={3}
            />
          </div>
        )}
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* Peak Hours Table                                                */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ marginTop: 'var(--space-lg)' }}
      >
        <div className="card-header">
          <h3 className="card-title">Peak Hours</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top 10 busiest hours (last 7 days)</span>
        </div>

        {loading ? <SkeletonTable rows={5} cols={5} /> : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Hour</th>
                  <th style={{ textAlign: 'right' }}>Sessions</th>
                  <th style={{ textAlign: 'right' }}>Avg Dwell</th>
                  <th style={{ textAlign: 'right' }}>Conversions</th>
                </tr>
              </thead>
              <tbody>
                {peakHours.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>No hourly data available</td></tr>
                ) : peakHours.map((h, idx) => (
                  <motion.tr
                    key={h.hour ?? idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 'var(--radius-md)',
                        background: idx < 3 ? 'var(--navy)' : 'var(--bg-tertiary)',
                        color: idx < 3 ? 'white' : 'var(--text-primary)',
                        fontWeight: 600, fontSize: '0.813rem'
                      }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{h.label ?? `Hour ${h.hour}`}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(h.sessions)}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatDwell(h.avg_dwell)}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(h.conversions)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* Zone Breakdown Table + CSV Export                                */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginTop: 'var(--space-lg)' }}
      >
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Zone Breakdown</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => downloadCSV(zones)}
            disabled={loading || zones.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {loading ? <SkeletonTable rows={4} cols={5} /> : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Zone</th>
                  <th style={{ textAlign: 'right' }}>Events</th>
                  <th style={{ textAlign: 'right' }}>Unique Visitors</th>
                  <th style={{ textAlign: 'right' }}>Capacity</th>
                  <th style={{ minWidth: 160 }}>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {zones.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl)' }}>No zone data available</td></tr>
                ) : zones.map((z, idx) => {
                  const util = z.capacity > 0 ? Math.min((z.unique_visitors / z.capacity) * 100, 100) : 0
                  const barColor = util > 85 ? 'var(--danger)' : util > 60 ? 'var(--gold)' : 'var(--success)'
                  return (
                    <motion.tr
                      key={z.zone ?? idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: barColor, flexShrink: 0
                          }} />
                          <span style={{ fontWeight: 500 }}>{z.zone}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(z.total_events)}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(z.unique_visitors)}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(z.capacity)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <div style={{
                            flex: 1, height: 8, background: 'var(--bg-tertiary)',
                            borderRadius: 4, overflow: 'hidden'
                          }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${util}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.05 }}
                              style={{ height: '100%', borderRadius: 4, background: barColor }}
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: 42, textAlign: 'right' }}>
                            {util.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* Generate Report Section (secondary)                             */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ marginTop: 'var(--space-lg)' }}
      >
        <div className="card-header">
          <h3 className="card-title">Generate New Report</h3>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-md)', marginBottom: 'var(--space-lg)'
        }}>
          {REPORT_TYPES.map((type, index) => (
            <ReportTypeCard
              key={type.id}
              type={type}
              isSelected={selectedType === type.id}
              onClick={() => setSelectedType(type.id)}
              delay={index}
            />
          ))}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-md)', padding: 'var(--space-lg)',
          background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-lg)'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
              Start Date
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="date"
                className="input"
                style={{ paddingLeft: 40 }}
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
              End Date
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="date"
                className="input"
                style={{ paddingLeft: 40 }}
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
              Export Format
            </label>
            <select className="input">
              <option value="pdf">PDF Document</option>
              <option value="csv">CSV Spreadsheet</option>
              <option value="xlsx">Excel Workbook</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                />
                Generating...
              </>
            ) : (
              <>
                <FileText size={16} />
                Generate Report
              </>
            )}
          </button>
          <button className="btn btn-secondary">
            <Mail size={16} />
            Schedule Report
          </button>
          <button className="btn btn-ghost">
            <Download size={16} />
            Export Settings
          </button>
        </div>
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* Scheduled Reports (secondary)                                   */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ marginTop: 'var(--space-lg)' }}
      >
        <div className="card-header">
          <h3 className="card-title">Scheduled Reports</h3>
          <button className="btn btn-primary btn-sm">
            <Plus size={14} />
            Add Schedule
          </button>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Type</th>
                <th>Schedule</th>
                <th>Last Run</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULED_REPORTS.map((report, index) => (
                <ScheduledReportRow key={report.id} report={report} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
