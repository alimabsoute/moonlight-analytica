import { motion } from 'framer-motion'

/**
 * LiveMonitorHeader — page title + live/paused status badge + pause/resume toggle.
 * Extracted from LiveMonitor.jsx (Gate 5.2 decomposition).
 */
export default function LiveMonitorHeader({ isLive, onToggleLive }) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}
    >
      <div>
        <h1 className="page-title">Live Monitor</h1>
        <p className="page-subtitle">Real-time occupancy and traffic analytics</p>
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
        role="group"
        aria-label="Live feed controls"
      >
        {/* Status badge */}
        <motion.div
          animate={{ scale: isLive ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 2, repeat: isLive ? Infinity : 0 }}
          aria-live="polite"
          aria-label={isLive ? 'Feed is live' : 'Feed is paused'}
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
          <div
            aria-hidden="true"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLive ? 'var(--success)' : 'var(--text-muted)'
            }}
          />
          <span
            style={{
              fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
              fontWeight: '500',
              color: isLive ? 'var(--success)' : 'var(--text-muted)'
            }}
          >
            {isLive ? 'LIVE' : 'PAUSED'}
          </span>
        </motion.div>

        {/* Toggle button */}
        <button
          className={`btn ${isLive ? 'btn-secondary' : 'btn-primary'}`}
          onClick={onToggleLive}
          aria-pressed={isLive}
          aria-label={isLive ? 'Pause live feed' : 'Resume live feed'}
        >
          {isLive ? 'Pause' : 'Resume'}
        </button>
      </div>
    </header>
  )
}
