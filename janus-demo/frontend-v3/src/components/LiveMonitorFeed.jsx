import { lazy, Suspense, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AnimatePresence } from 'framer-motion'
import ZoneOverlay from './ZoneOverlay'
import { VIEW_MODES } from './LiveMonitorViewTabs'

// Lazy-loaded tracking components — keeps initial bundle small
const HumanoidTrackingDemo = lazy(() => import('../../../shared/HumanoidTrackingDemo'))
const Tracking3DView = lazy(() => import('../../../shared/Tracking3DView'))
const RealTimeDetection = lazy(() => import('../../../shared/RealTimeDetection'))
const RealTimeDetectionEnhanced = lazy(() => import('../../../shared/RealTimeDetectionEnhanced'))
const PreProcessedPlayer = lazy(() => import('./PreProcessedPlayer'))

function LoadingSpinner() {
  return (
    <div
      role="status"
      aria-label="Loading visualization"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)'
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--navy)',
          borderRadius: '50%'
        }}
      />
    </div>
  )
}

/**
 * LiveMonitorFeed — the main visualization panel (2D / 3D / ML with zone overlay).
 * Extracted from LiveMonitor.jsx (Gate 5.2 decomposition).
 */
export default function LiveMonitorFeed({
  viewMode,
  pipelineVersion,
  overlayZones,
  trackingMetrics,
  onMetricsUpdate,
  onMlStatsUpdate
}) {
  const activeMode = VIEW_MODES.find(m => m.id === viewMode)

  const handleMLMetrics = (metrics, fallbackPeak) => {
    onMetricsUpdate({
      currentCount: metrics.currentCount,
      totalEntries: metrics.totalEntries || 0,
      totalExits: metrics.totalExits || 0,
      peakCount: metrics.peakCount ?? Math.max(fallbackPeak || 0, metrics.currentCount)
    })
    onMlStatsUpdate({ fps: metrics.fps ?? 30, tracking: { confirmedCount: metrics.currentCount } })
  }

  return (
    <motion.section
      className="card"
      aria-label="Tracking visualization"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="card-header">
        <h3 className="card-title">{activeMode?.label} View</h3>
        <div
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--success)'
          }}
        >
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            aria-hidden="true"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--success)'
            }}
          />
          {activeMode?.description}
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          minHeight: 'clamp(280px, 40vw, 400px)'
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          {viewMode === '2d' && (
            <HumanoidTrackingDemo theme="light" onMetricsUpdate={onMetricsUpdate} />
          )}
          {viewMode === '3d' && (
            <Tracking3DView theme="light" onMetricsUpdate={onMetricsUpdate} />
          )}
          {viewMode === 'ml' && (
            <div
              role="region"
              aria-label="ML detection feed"
              style={{ position: 'relative', width: '100%', height: '100%', minHeight: 'clamp(280px, 40vw, 400px)' }}
            >
              {overlayZones.length > 0 && (
                <ZoneOverlay zones={overlayZones} width={640} height={480} alpha={0.2} />
              )}
              {pipelineVersion === 'A' && (
                <RealTimeDetection
                  theme="dark"
                  onMetricsUpdate={(m) => handleMLMetrics(m, trackingMetrics?.peakCount)}
                />
              )}
              {pipelineVersion === 'E' && (
                <RealTimeDetectionEnhanced
                  theme="dark"
                  onMetricsUpdate={(m) => handleMLMetrics(m, trackingMetrics?.peakCount)}
                />
              )}
              {pipelineVersion === 'P' && (
                <PreProcessedPlayer
                  theme="dark"
                  onMetricsUpdate={(m) => handleMLMetrics(m, trackingMetrics?.peakCount)}
                />
              )}
            </div>
          )}
        </Suspense>
      </div>
    </motion.section>
  )
}
