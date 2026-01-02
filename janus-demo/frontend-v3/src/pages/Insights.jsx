import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Lightbulb, Target, Zap, Clock, Users, BarChart3, ArrowRight
} from 'lucide-react'
import { INDUSTRY_KPIS, getIndustryKPIs, getIndustryList } from '../../../shared/industryKPIs'
import { generateInsight, generatePerformanceScore, generateDailySummary } from '../../../shared/insights'

function InsightCard({ insight, index }) {
  const priorityColors = {
    high: { bg: 'rgba(229, 62, 62, 0.1)', border: 'var(--danger)', icon: AlertTriangle },
    medium: { bg: 'rgba(201, 162, 39, 0.1)', border: 'var(--gold)', icon: Lightbulb },
    low: { bg: 'rgba(56, 161, 105, 0.1)', border: 'var(--success)', icon: CheckCircle }
  }

  const { bg, border, icon: Icon } = priorityColors[insight.priority] || priorityColors.medium

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{
        padding: 'var(--space-md)',
        background: bg,
        borderLeft: `4px solid ${border}`,
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-sm)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
        <Icon size={18} color={border} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {insight.title}
          </div>
          <div style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
            {insight.description}
          </div>
          {insight.metric && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: 'var(--space-xs)',
              padding: '4px 8px',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              fontWeight: '500'
            }}>
              <BarChart3 size={12} />
              {insight.metric}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ActionCard({ action, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{
        padding: 'var(--space-md)',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        cursor: 'pointer'
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--navy)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        flexShrink: 0
      }}>
        <action.icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '2px' }}>{action.title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{action.description}</div>
      </div>
      <ArrowRight size={16} color="var(--text-muted)" />
    </motion.div>
  )
}

function ScoreRing({ score, size = 160 }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getScoreColor = (s) => {
    if (s >= 80) return 'var(--success)'
    if (s >= 60) return 'var(--gold)'
    if (s >= 40) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
        />
        {/* Score ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference
          }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          style={{ fontSize: '2.5rem', fontWeight: '700', color: getScoreColor(score) }}
        >
          {score}
        </motion.div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>out of 100</div>
      </div>
    </div>
  )
}

export default function Insights() {
  const [industry, setIndustry] = useState('generic')
  const [insights, setInsights] = useState([])
  const [score, setScore] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      // Transform insights to match expected shape
      const rawInsights = generateInsight('general', [], 5)
      const transformedInsights = rawInsights.map(insight => ({
        title: insight.text?.split(' - ')[0] || insight.text || 'Insight',
        description: insight.text?.split(' - ')[1] || insight.text || '',
        priority: insight.type === 'anomaly' || insight.type === 'warning' ? 'high'
                : insight.type === 'recommendation' ? 'medium' : 'low',
        metric: insight.type || 'General'
      }))
      setInsights(transformedInsights)

      // Transform score breakdown from object to array
      const rawScore = generatePerformanceScore()
      const breakdownArray = Object.entries(rawScore.breakdown || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        score: value
      }))
      setScore({
        ...rawScore,
        breakdown: breakdownArray
      })

      setIsLoading(false)
    }, 800)
  }, [industry])

  const recommendedActions = [
    { icon: Users, title: 'Optimize Peak Staffing', description: 'Add 2 staff during 2-4 PM based on traffic patterns' },
    { icon: Target, title: 'Improve Zone B Flow', description: 'Consider adjusting layout to reduce dwell time' },
    { icon: Clock, title: 'Extend Opening Hours', description: 'Data suggests demand exists for earlier opening' },
    { icon: Zap, title: 'Run Promotion Campaign', description: 'Low traffic period identified for targeted offers' }
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
          <h1 className="page-title">AI Insights</h1>
          <p className="page-subtitle">Intelligent analysis and recommendations powered by your data</p>
        </div>
        <select
          className="input"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          style={{ width: '200px' }}
        >
          {getIndustryList().map(ind => (
            <option key={ind.id} value={ind.id}>{ind.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-lg)' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Key Findings */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-header">
              <h3 className="card-title">
                <Brain size={18} style={{ marginRight: '8px' }} />
                Today's Key Findings
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {insights.length} insights generated
              </span>
            </div>
            <div>
              {insights.slice(0, 5).map((insight, index) => (
                <InsightCard key={index} insight={insight} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Recommended Actions */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-header">
              <h3 className="card-title">
                <Lightbulb size={18} style={{ marginRight: '8px' }} />
                Recommended Actions
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {recommendedActions.map((action, index) => (
                <ActionCard key={index} action={action} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Trend Summary */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="card-header">
              <h3 className="card-title">Weekly Trend Summary</h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'var(--space-md)'
            }}>
              {[
                { label: 'Total Visitors', value: '12,450', change: '+8.2%', up: true },
                { label: 'Avg Dwell Time', value: '24 min', change: '+12%', up: true },
                { label: 'Conversion Rate', value: '32.5%', change: '+3.1%', up: true },
                { label: 'Bounce Rate', value: '18.2%', change: '-2.4%', up: false }
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--navy)' }}>
                    {stat.value}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    marginTop: '4px',
                    fontSize: '0.75rem',
                    color: stat.up ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Performance Score */}
          <motion.div
            className="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="card-header">
              <h3 className="card-title">Performance Score</h3>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 'var(--space-lg) 0'
            }}>
              <ScoreRing score={score?.overall || 75} />
              <div style={{
                marginTop: 'var(--space-lg)',
                width: '100%'
              }}>
                {score?.breakdown?.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-sm) 0',
                      borderBottom: index < score.breakdown.length - 1 ? '1px solid var(--border)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          style={{
                            height: '100%',
                            background: item.score >= 70 ? 'var(--success)' : item.score >= 40 ? 'var(--gold)' : 'var(--danger)',
                            borderRadius: 'var(--radius-full)'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', width: '30px' }}>{item.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Industry KPIs */}
          <motion.div
            className="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-header">
              <h3 className="card-title">Industry KPIs</h3>
              <span style={{
                fontSize: '0.7rem',
                padding: '4px 8px',
                background: 'var(--navy)',
                color: 'white',
                borderRadius: 'var(--radius-sm)'
              }}>
                {getIndustryList().find(i => i.id === industry)?.name || industry}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {getIndustryKPIs(industry).slice(0, 6).map((kpi, index) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-sm)',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <span style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>{kpi.name}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)' }}>
                    {kpi.value}{kpi.unit}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Anomaly Alerts */}
          <motion.div
            className="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-header">
              <h3 className="card-title">
                <AlertTriangle size={16} style={{ marginRight: '6px', color: 'var(--warning)' }} />
                Anomaly Alerts
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {[
                { time: '2:15 PM', message: 'Unusual spike in Zone B traffic', severity: 'warning' },
                { time: '11:30 AM', message: 'Dwell time 40% above average in Lobby', severity: 'info' }
              ].map((alert, index) => (
                <div
                  key={index}
                  style={{
                    padding: 'var(--space-sm)',
                    background: alert.severity === 'warning' ? 'rgba(201, 162, 39, 0.1)' : 'rgba(49, 130, 206, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${alert.severity === 'warning' ? 'var(--gold)' : 'var(--info)'}`
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{alert.time}</div>
                  <div style={{ fontSize: '0.813rem', color: 'var(--text-primary)' }}>{alert.message}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
