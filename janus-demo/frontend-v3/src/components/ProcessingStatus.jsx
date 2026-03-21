import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader, CheckCircle, AlertCircle } from 'lucide-react'

const API_BASE = 'http://localhost:8000'

export default function ProcessingStatus({ videoId, onComplete }) {
  const [progress, setProgress] = useState({ status: 'not_started', percent: 0, frame: 0, total: 0 })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!videoId) return

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/process-status/${videoId}`)
        const data = await res.json()
        setProgress(data)

        if (data.status === 'completed') {
          clearInterval(poll)
          onComplete?.()
        }
      } catch (e) {
        setError('Cannot reach backend')
      }
    }, 2000)

    return () => clearInterval(poll)
  }, [videoId, onComplete])

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '12px 16px', background: 'rgba(229, 62, 62, 0.1)',
        borderRadius: 'var(--radius-md)', color: 'var(--danger)'
      }}>
        <AlertCircle size={16} />
        <span style={{ fontSize: '0.813rem' }}>{error}</span>
      </div>
    )
  }

  if (progress.status === 'completed') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '12px 16px', background: 'rgba(56, 161, 105, 0.1)',
        borderRadius: 'var(--radius-md)', color: 'var(--success)'
      }}>
        <CheckCircle size={16} />
        <span style={{ fontSize: '0.813rem', fontWeight: '500' }}>Processing complete — loading replay</span>
      </div>
    )
  }

  if (progress.status === 'not_started' || progress.status === 'idle') {
    return null
  }

  return (
    <div style={{
      padding: '16px', background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader size={14} color="var(--navy)" />
          </motion.div>
          <span style={{ fontSize: '0.813rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            Processing with Roboflow Cloud
          </span>
        </div>
        <span style={{
          fontSize: '0.75rem', fontFamily: 'monospace',
          color: 'var(--text-muted)'
        }}>
          {progress.frame} / {progress.total} frames
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '6px', background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-full)', overflow: 'hidden'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
            borderRadius: 'var(--radius-full)'
          }}
        />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)'
      }}>
        <span>{progress.percent}%</span>
        <span>Every 3rd frame via cloud API</span>
      </div>
    </div>
  )
}
