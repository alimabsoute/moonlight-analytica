import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'

// All components re-enabled
import { FloorGrid } from './FloorGrid'
import { ZoneRenderer } from './ZoneRenderer'
import { EnvironmentManager } from './environment/EnvironmentManager'
import { CharacterManager } from './characters/CharacterManager'

// Zone definitions (compatible with existing system)
export const ZONES_3D = [
  { id: 'entrance', name: 'ENTRANCE', col: 0, row: 6, width: 2, depth: 2, color: '#22d3ee' },
  { id: 'main_floor', name: 'MAIN FLOOR', col: 2, row: 2, width: 4, depth: 4, color: '#a78bfa' },
  { id: 'checkout', name: 'CHECKOUT', col: 7, row: 3, width: 2, depth: 3, color: '#f472b6' },
  { id: 'electronics', name: 'ELECTRONICS', col: 2, row: 0, width: 3, depth: 2, color: '#4ade80' },
  { id: 'clothing', name: 'CLOTHING', col: 5, row: 0, width: 2, depth: 2, color: '#fbbf24' },
]

// Config
const CONFIG = {
  GRID_SIZE: 8,
  CELL_SIZE: 1,
  CAMERA_ZOOM: 45,
  MAX_PEOPLE: 35,
  SPAWN_INTERVAL: 2000,
}

// Scene setup - camera is configured via OrthographicCamera component
function SceneSetup() {
  const { camera } = useThree()

  useEffect(() => {
    // Center of the grid
    const centerX = (CONFIG.GRID_SIZE * CONFIG.CELL_SIZE) / 2
    const centerZ = (CONFIG.GRID_SIZE * CONFIG.CELL_SIZE) / 2

    // Make camera look at center
    camera.lookAt(centerX, 0, centerZ)
    camera.updateProjectionMatrix()

    console.log('Camera setup:', {
      position: camera.position.toArray(),
      zoom: camera.zoom,
      type: camera.type
    })
  }, [camera])

  return null
}

// Main scene content
function SceneContent({ onMetricsUpdate, theme, characterCount, showLabels }) {
  const characterManagerRef = useRef()
  const [metrics, setMetrics] = useState({
    totalEntries: 0,
    totalExits: 0,
    currentCount: 0,
    zoneCounts: {},
    peakCount: 0,
  })

  // Update metrics callback
  const handleMetricsUpdate = useCallback((newMetrics) => {
    setMetrics(newMetrics)
    onMetricsUpdate?.(newMetrics)
  }, [onMetricsUpdate])

  // Debug logging
  useEffect(() => {
    console.log('SceneContent mounted')
  }, [])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.4} />

      {/* All scene components */}
      <FloorGrid size={CONFIG.GRID_SIZE} cellSize={CONFIG.CELL_SIZE} theme={theme} />
      <ZoneRenderer zones={ZONES_3D} cellSize={CONFIG.CELL_SIZE} theme={theme} />
      <EnvironmentManager zones={ZONES_3D} cellSize={CONFIG.CELL_SIZE} theme={theme} />
      <CharacterManager
        ref={characterManagerRef}
        zones={ZONES_3D}
        cellSize={CONFIG.CELL_SIZE}
        maxPeople={characterCount || CONFIG.MAX_PEOPLE}
        spawnInterval={CONFIG.SPAWN_INTERVAL}
        onMetricsUpdate={handleMetricsUpdate}
        showLabels={false}
        showBoundingBoxes={showBoundingBoxes}
        theme={theme}
      />
    </>
  )
}

// Stats overlay
function StatsOverlay({ metrics, theme }) {
  const bgColor = theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'
  const textColor = theme === 'dark' ? '#fff' : '#1a1a2e'

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      left: '12px',
      padding: '12px 16px',
      background: bgColor,
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      color: textColor,
      backdropFilter: 'blur(8px)',
      border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      zIndex: 10,
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
        Live Tracking (3D)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
        <span>Current:</span>
        <span style={{ fontWeight: 'bold', color: '#22d3ee' }}>{metrics.currentCount}</span>
        <span>Peak:</span>
        <span style={{ fontWeight: 'bold', color: '#f472b6' }}>{metrics.peakCount}</span>
        <span>Entries:</span>
        <span style={{ color: '#4ade80' }}>{metrics.totalEntries}</span>
        <span>Exits:</span>
        <span style={{ color: '#fbbf24' }}>{metrics.totalExits}</span>
      </div>
    </div>
  )
}

// Main exported component
export default function Tracking3DScene({
  onMetricsUpdate,
  theme = 'dark',
  className = '',
  characterCount = 25,
  showLabels = true,
  showBoundingBoxes = true,
  showStats = true,
}) {
  const [metrics, setMetrics] = useState({
    totalEntries: 0,
    totalExits: 0,
    currentCount: 0,
    zoneCounts: {},
    peakCount: 0,
  })

  const handleMetricsUpdate = useCallback((newMetrics) => {
    setMetrics(newMetrics)
    onMetricsUpdate?.(newMetrics)
  }, [onMetricsUpdate])

  const canvasStyle = useMemo(() => ({
    background: theme === 'dark'
      ? 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  }), [theme])

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        minWidth: '400px',
        height: '450px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: theme === 'dark' ? '#0f0f1a' : '#f8fafc',
      }}
    >
      {showStats && <StatsOverlay metrics={metrics} theme={theme} />}

      <Canvas
        shadows
        style={{ width: '100%', height: '100%', ...canvasStyle }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        dpr={[1, 2]}
      >
        {/* Orthographic camera for isometric view */}
        <OrthographicCamera
          makeDefault
          position={[15, 12, 15]}
          zoom={CONFIG.CAMERA_ZOOM}
          near={0.1}
          far={1000}
        />
        <SceneSetup />

        {/* OrbitControls for debugging - can be removed later */}
        <OrbitControls
          target={[4, 0, 4]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />

        <SceneContent
          onMetricsUpdate={handleMetricsUpdate}
          theme={theme}
          characterCount={characterCount}
          showLabels={showLabels}
          showBoundingBoxes={showBoundingBoxes}
        />
      </Canvas>
    </div>
  )
}
