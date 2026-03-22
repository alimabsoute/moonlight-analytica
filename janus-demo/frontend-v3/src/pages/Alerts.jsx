import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, AlertTriangle, TrendingUp, TrendingDown, Plus, Trash2,
  RefreshCw, Clock, CheckCircle, Shield, Zap
} from 'lucide-react'

const API = 'http://localhost:8000'

const COLORS = { navy: '#1e3a5f', gold: '#c9a227', success: '#38a169', info: '#3182ce', danger: '#e53e3e', warning: '#dd6b20' }

function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <RefreshCw size={24} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
  </div>
}

const DEFAULT_RULES = [
  { id: 1, name: 'High Occupancy', condition: 'occupancy > 80%', field: 'occupancy_rate', op: '>', value: 80, enabled: true },
  { id: 2, name: 'High Bounce Rate', condition: 'bounce rate > 50%', field: 'bounce_rate', op: '>', value: 50, enabled: true },
  { id: 3, name: 'Low Conversion', condition: 'conversion < 10%', field: 'conversion_rate', op: '<', value: 10, enabled: true },
]

export default function Alerts() {
  const [anomalies, setAnomalies] = useState([])
  const [rules, setRules] = useState(() => {
    try {
      const stored = localStorage.getItem('janus_alert_rules')
      return stored ? JSON.parse(stored) : DEFAULT_RULES
    } catch { return DEFAULT_RULES }
  })
  const [ruleAlerts, setRuleAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState({ name: '', field: 'occupancy_rate', op: '>', value: 0 })

  const saveRules = (updated) => {
    setRules(updated)
    localStorage.setItem('janus_alert_rules', JSON.stringify(updated))
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [anomResp, snapResp, convResp] = await Promise.all([
        fetch(`${API}/api/anomalies?hours=168`).then(r => r.json()),
        fetch(`${API}/api/realtime-snapshot`).then(r => r.json()),
        fetch(`${API}/api/conversion`).then(r => r.json()),
      ])
      setAnomalies(anomResp.anomalies || [])

      // Evaluate rules against current data
      const currentData = {
        occupancy_rate: 0, // Would come from /api/occupancy
        bounce_rate: convResp.bounce_rate || 0,
        conversion_rate: convResp.conversion_rate || 0,
        total_today: snapResp.total_today || 0,
        velocity_per_min: snapResp.velocity_per_min || 0,
      }

      const triggered = rules.filter(r => r.enabled).filter(r => {
        const val = currentData[r.field]
        if (val === undefined) return false
        return r.op === '>' ? val > r.value : val < r.value
      }).map(r => ({
        ...r,
        current_value: currentData[r.field],
        triggered_at: new Date().toISOString(),
      }))
      setRuleAlerts(triggered)

    } catch (e) {
      console.error('Alerts fetch error:', e)
    }
    setLoading(false)
  }, [rules])

  useEffect(() => { fetchData() }, [fetchData])

  const addRule = () => {
    if (!newRule.name) return
    const updated = [...rules, { ...newRule, id: Date.now(), enabled: true, condition: `${newRule.field} ${newRule.op} ${newRule.value}` }]
    saveRules(updated)
    setNewRule({ name: '', field: 'occupancy_rate', op: '>', value: 0 })
    setShowAddRule(false)
  }

  const deleteRule = (id) => saveRules(rules.filter(r => r.id !== id))
  const toggleRule = (id) => saveRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))

  // Build anomaly heatmap (7 days x 24 hours)
  const heatmapData = Array.from({ length: 7 }, () => Array(24).fill(0))
  anomalies.forEach(a => {
    try {
      const d = new Date(a.hour + ':00')
      const dayIndex = d.getDay()
      const hourIndex = d.getHours()
      if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 24) {
        heatmapData[dayIndex][hourIndex] += 1
      }
    } catch {}
  })
  const maxHeat = Math.max(1, ...heatmapData.flat())

  if (loading) return <Spinner />

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">Anomaly detection and configurable monitoring rules</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Active Alerts from Anomaly Detection */}
      <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
          <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 8, color: COLORS.warning }} />
          Active Anomalies
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
            {anomalies.length} detected
          </span>
        </h3>

        {anomalies.length === 0 ? (
          <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle size={32} style={{ marginBottom: 8 }} />
            <div>No anomalies detected in the last 7 days</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)', maxHeight: 400, overflowY: 'auto' }}>
            {anomalies.slice(0, 20).map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${a.type === 'spike' ? COLORS.warning : COLORS.info}30`,
                  background: `${a.type === 'spike' ? COLORS.warning : COLORS.info}08`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {a.type === 'spike'
                      ? <TrendingUp size={14} color={COLORS.warning} />
                      : <TrendingDown size={14} color={COLORS.info} />}
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                      color: a.type === 'spike' ? COLORS.warning : COLORS.info,
                    }}>
                      {a.type}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {a.sigma}σ
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {a.actual} visitors <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                    (expected {a.expected})
                  </span>
                </div>
                <div style={{
                  fontSize: '0.75rem', fontWeight: 600, marginTop: 2,
                  color: Math.abs(a.deviation_pct) > 50 ? COLORS.danger : 'var(--text-secondary)',
                }}>
                  {a.deviation_pct > 0 ? '+' : ''}{a.deviation_pct}% deviation
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {a.hour}:00
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        {/* Alert Rules */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              <Shield size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Alert Rules
            </h3>
            <button className="btn btn-sm btn-primary" onClick={() => setShowAddRule(!showAddRule)}>
              <Plus size={14} /> Add Rule
            </button>
          </div>

          <AnimatePresence>
            {showAddRule && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: 'var(--space-md)' }}
              >
                <div style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <input
                    placeholder="Rule name"
                    value={newRule.name}
                    onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                    style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <select value={newRule.field} onChange={e => setNewRule({ ...newRule, field: e.target.value })}
                      style={{ flex: 1, padding: '6px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      <option value="occupancy_rate">Occupancy %</option>
                      <option value="bounce_rate">Bounce Rate %</option>
                      <option value="conversion_rate">Conversion Rate %</option>
                      <option value="total_today">Total Today</option>
                    </select>
                    <select value={newRule.op} onChange={e => setNewRule({ ...newRule, op: e.target.value })}
                      style={{ width: 60, padding: '6px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                    </select>
                    <input type="number" value={newRule.value} onChange={e => setNewRule({ ...newRule, value: parseFloat(e.target.value) || 0 })}
                      style={{ width: 80, padding: '6px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={addRule}>Save Rule</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {rules.map(r => (
            <div key={r.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 'var(--space-sm) var(--space-md)',
              borderBottom: '1px solid var(--border)',
              opacity: r.enabled ? 1 : 0.5,
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.condition}</div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                {ruleAlerts.find(a => a.id === r.id) && (
                  <Zap size={14} color={COLORS.danger} />
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => toggleRule(r.id)} style={{ fontSize: '0.7rem' }}>
                  {r.enabled ? 'On' : 'Off'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteRule(r.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {ruleAlerts.length > 0 && (
            <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: `${COLORS.danger}10`, borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: COLORS.danger }}>
              <Zap size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {ruleAlerts.length} rule(s) currently triggered
            </div>
          )}
        </div>

        {/* Anomaly Heatmap */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
            Anomaly Heatmap
            <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>Day x Hour</span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateRows: `repeat(7, 1fr)`, gap: 2, minWidth: 500 }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(24, 1fr)', gap: 2 }}>
                <div></div>
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} style={{ fontSize: '0.55rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {h % 4 === 0 ? `${h}` : ''}
                  </div>
                ))}
              </div>
              {/* Data rows */}
              {dayLabels.map((day, di) => (
                <div key={di} style={{ display: 'grid', gridTemplateColumns: '44px repeat(24, 1fr)', gap: 2, alignItems: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{day}</div>
                  {heatmapData[di].map((count, hi) => {
                    const intensity = count / maxHeat
                    const bg = count === 0
                      ? 'var(--bg-tertiary)'
                      : `rgba(229, 62, 62, ${0.15 + intensity * 0.7})`
                    return (
                      <div key={hi} title={`${day} ${hi}:00 — ${count} anomalies`} style={{
                        width: '100%', aspectRatio: '1', borderRadius: 2,
                        background: bg, cursor: 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.5rem', color: count > 0 ? 'white' : 'transparent',
                        fontWeight: 600,
                      }}>
                        {count > 0 ? count : ''}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 2, background: v === 0 ? 'var(--bg-tertiary)' : `rgba(229, 62, 62, ${0.15 + v * 0.7})` }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Alert History */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h3 style={{ margin: '0 0 var(--space-md)', fontSize: '1rem', fontWeight: 600 }}>
          <Clock size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Alert History (Last 7 Days)
        </h3>
        {anomalies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No anomalies in the selected period
          </div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {anomalies.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: a.type === 'spike' ? COLORS.warning : COLORS.info,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{a.type === 'spike' ? 'Traffic Spike' : 'Traffic Drop'}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{a.actual} vs {a.expected} expected</span>
                </div>
                <div style={{ color: Math.abs(a.deviation_pct) > 50 ? COLORS.danger : 'var(--text-muted)', fontWeight: 600, fontSize: '0.78rem' }}>
                  {a.deviation_pct > 0 ? '+' : ''}{a.deviation_pct}%
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', minWidth: 100, textAlign: 'right' }}>
                  {a.hour}:00
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
