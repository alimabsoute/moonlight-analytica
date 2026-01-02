import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Calendar, Clock, Mail, Plus,
  ChevronDown, Check, Trash2, Edit2, Eye, Send
} from 'lucide-react'

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

const RECENT_REPORTS = [
  { id: 1, name: 'Daily Summary - Jan 15', type: 'daily', date: '2024-01-15', size: '2.4 MB' },
  { id: 2, name: 'Weekly Analysis - Week 2', type: 'weekly', date: '2024-01-14', size: '5.1 MB' },
  { id: 3, name: 'Monthly Report - December', type: 'monthly', date: '2024-01-01', size: '12.3 MB' },
  { id: 4, name: 'Daily Summary - Jan 14', type: 'daily', date: '2024-01-14', size: '2.2 MB' },
  { id: 5, name: 'Custom Zone Analysis', type: 'custom', date: '2024-01-13', size: '3.8 MB' }
]

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
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isSelected ? 'white' : 'var(--navy)'
        }}>
          <FileText size={20} />
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Check size={14} color="white" />
          </motion.div>
        )}
      </div>
      <h4 style={{
        fontSize: '0.938rem',
        fontWeight: '600',
        color: isSelected ? 'white' : 'var(--text-primary)',
        marginBottom: '4px'
      }}>
        {type.label}
      </h4>
      <p style={{
        fontSize: '0.75rem',
        color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'
      }}>
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
        <div style={{ fontWeight: '500' }}>{report.name}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {report.recipients.length} recipient{report.recipients.length > 1 ? 's' : ''}
        </div>
      </td>
      <td>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          textTransform: 'capitalize'
        }}>
          <FileText size={12} />
          {report.type}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.813rem' }}>
          <Clock size={14} color="var(--text-muted)" />
          {report.schedule}
        </div>
      </td>
      <td style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
        {report.lastRun}
      </td>
      <td>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.7rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          background: report.status === 'active' ? 'rgba(56, 161, 105, 0.1)' : 'rgba(203, 213, 224, 0.3)',
          color: report.status === 'active' ? 'var(--success)' : 'var(--text-muted)'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: report.status === 'active' ? 'var(--success)' : 'var(--text-muted)'
          }} />
          {report.status}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <button className="btn btn-ghost btn-icon btn-sm">
            <Edit2 size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

function RecentReportRow({ report, index }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
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
            <FileText size={16} />
          </div>
          <div>
            <div style={{ fontWeight: '500' }}>{report.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{report.size}</div>
          </div>
        </div>
      </td>
      <td>
        <span style={{
          padding: '4px 10px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          textTransform: 'capitalize'
        }}>
          {report.type}
        </span>
      </td>
      <td style={{ fontSize: '0.813rem', color: 'var(--text-muted)' }}>
        {report.date}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <button className="btn btn-ghost btn-icon btn-sm">
            <Eye size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm">
            <Download size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm">
            <Send size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

export default function Reports() {
  const [selectedType, setSelectedType] = useState('daily')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 2000)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate, schedule, and manage analytics reports</p>
      </div>

      {/* Generate Report Section */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-header">
          <h3 className="card-title">Generate New Report</h3>
        </div>

        {/* Report Type Selection */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)'
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

        {/* Date Range & Options */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-md)',
          padding: 'var(--space-lg)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-lg)'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Start Date
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="date"
                className="input"
                style={{ paddingLeft: '40px' }}
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>
              End Date
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="date"
                className="input"
                style={{ paddingLeft: '40px' }}
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Export Format
            </label>
            <select className="input">
              <option value="pdf">PDF Document</option>
              <option value="csv">CSV Spreadsheet</option>
              <option value="xlsx">Excel Workbook</option>
            </select>
          </div>
        </div>

        {/* Actions */}
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

      {/* Scheduled Reports */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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

      {/* Recent Reports */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ marginTop: 'var(--space-lg)' }}
      >
        <div className="card-header">
          <h3 className="card-title">Recent Reports</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 30 days</span>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>Type</th>
                <th>Generated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_REPORTS.map((report, index) => (
                <RecentReportRow key={report.id} report={report} index={index} />
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
