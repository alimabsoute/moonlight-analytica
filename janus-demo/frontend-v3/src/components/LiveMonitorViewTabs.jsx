import { motion, AnimatePresence } from 'framer-motion'
import { MonitorDot, Box, Cpu } from 'lucide-react'

const VIEW_MODES = [
  { id: '2d', label: '2D Simulation', icon: MonitorDot, description: 'Stick figure tracking' },
  { id: '3d', label: '3D Isometric', icon: Box, description: 'Floor plan view' },
  { id: 'ml', label: 'ML Detection', icon: Cpu, description: 'Real-time person detection' }
]

const PIPELINE_VERSIONS = [
  { id: 'A', label: 'Standard', description: 'TensorFlow + COCO-SSD', color: '#3b82f6' },
  { id: 'E', label: 'Enhanced', description: 'COCO-SSD + ByteTrack smoothing', color: '#10b981' },
  { id: 'P', label: 'Pre-Processed', description: 'Offline YOLO + BoT-SORT (highest accuracy)', color: '#8b5cf6' }
]

/**
 * LiveMonitorViewTabs — view mode selector (2D / 3D / ML) + pipeline version picker.
 * Extracted from LiveMonitor.jsx (Gate 5.2 decomposition).
 */
export default function LiveMonitorViewTabs({
  viewMode,
  onViewModeChange,
  pipelineVersion,
  onPipelineVersionChange,
  mlStats
}) {
  return (
    <nav
      aria-label="View mode selection"
      style={{
        display: 'flex',
        gap: 'var(--space-md)',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
        flexWrap: 'wrap'
      }}
    >
      {/* View mode tabs */}
      <div
        role="tablist"
        aria-label="Visualization mode"
        style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          background: 'var(--bg-secondary)',
          padding: 'var(--space-xs)',
          borderRadius: 'var(--radius-lg)',
          width: 'fit-content'
        }}
      >
        {VIEW_MODES.map((mode) => (
          <motion.button
            key={mode.id}
            role="tab"
            aria-selected={viewMode === mode.id}
            aria-label={mode.description}
            onClick={() => onViewModeChange(mode.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              padding: 'var(--space-sm) var(--space-md)',
              background: viewMode === mode.id ? 'var(--navy)' : 'transparent',
              color: viewMode === mode.id ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: 'clamp(0.7rem, 1.5vw, 0.813rem)',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
          >
            <mode.icon size={16} aria-hidden="true" />
            {mode.label}
          </motion.button>
        ))}
      </div>

      {/* Pipeline version selector — only in ML mode */}
      <AnimatePresence>
        {viewMode === 'ml' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}
          >
            <span
              id="pipeline-label"
              style={{
                fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)',
                color: 'var(--text-muted)',
                fontWeight: '500'
              }}
            >
              Pipeline:
            </span>
            <div
              role="group"
              aria-labelledby="pipeline-label"
              style={{
                display: 'flex',
                gap: '4px',
                background: 'var(--bg-tertiary)',
                padding: '4px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {PIPELINE_VERSIONS.map((v) => (
                <motion.button
                  key={v.id}
                  onClick={() => onPipelineVersionChange(v.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-pressed={pipelineVersion === v.id}
                  aria-label={v.description}
                  title={v.description}
                  style={{
                    padding: '6px 12px',
                    background: pipelineVersion === v.id ? v.color : 'transparent',
                    color: pipelineVersion === v.id ? (v.id === 'A' ? '#fff' : '#000') : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    minHeight: '44px'
                  }}
                >
                  {v.label}
                </motion.button>
              ))}
            </div>

            {mlStats && (
              <span
                aria-live="polite"
                aria-label={`${mlStats.fps} frames per second, ${mlStats.tracking?.confirmedCount || 0} active tracks`}
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--success)',
                  fontFamily: 'monospace',
                  background: 'rgba(56, 161, 105, 0.1)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {mlStats.fps} FPS | {mlStats.tracking?.confirmedCount || 0} tracks
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export { VIEW_MODES, PIPELINE_VERSIONS }
