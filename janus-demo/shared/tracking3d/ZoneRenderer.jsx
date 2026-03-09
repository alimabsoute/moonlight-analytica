import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export function ZoneRenderer({ zones, cellSize = 1, theme = 'dark' }) {
  return (
    <group>
      {zones.map(zone => (
        <Zone
          key={zone.id}
          zone={zone}
          cellSize={cellSize}
          theme={theme}
        />
      ))}
    </group>
  )
}

function Zone({ zone, cellSize, theme }) {
  const { col, row, width, depth, color, name, id } = zone

  // Zone floor highlight
  const position = useMemo(() => [
    (col + width / 2) * cellSize,
    0.02, // Slightly above floor
    (row + depth / 2) * cellSize,
  ], [col, row, width, depth, cellSize])

  const size = useMemo(() => [
    width * cellSize,
    depth * cellSize,
  ], [width, depth, cellSize])

  // Parse color and create transparent version
  const zoneColor = useMemo(() => {
    return new THREE.Color(color)
  }, [color])

  // Zone boundary edges
  const edgePoints = useMemo(() => {
    const x1 = col * cellSize
    const x2 = (col + width) * cellSize
    const z1 = row * cellSize
    const z2 = (row + depth) * cellSize
    const y = 0.03

    return [
      // Bottom edge
      new THREE.Vector3(x1, y, z1),
      new THREE.Vector3(x2, y, z1),
      // Right edge
      new THREE.Vector3(x2, y, z1),
      new THREE.Vector3(x2, y, z2),
      // Top edge
      new THREE.Vector3(x2, y, z2),
      new THREE.Vector3(x1, y, z2),
      // Left edge
      new THREE.Vector3(x1, y, z2),
      new THREE.Vector3(x1, y, z1),
    ]
  }, [col, row, width, depth, cellSize])

  const edgeGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(edgePoints)
  }, [edgePoints])

  // Zone vertical boundary (subtle)
  const boundaryHeight = 0.3

  return (
    <group>
      {/* Zone floor highlight */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={position}
      >
        <planeGeometry args={size} />
        <meshStandardMaterial
          color={zoneColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Zone boundary edges (glowing lines) */}
      <lineSegments>
        <primitive object={edgeGeometry} attach="geometry" />
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          linewidth={2}
        />
      </lineSegments>

      {/* Corner posts */}
      <ZoneCornerPost
        position={[col * cellSize, 0, row * cellSize]}
        color={color}
        height={boundaryHeight}
      />
      <ZoneCornerPost
        position={[(col + width) * cellSize, 0, row * cellSize]}
        color={color}
        height={boundaryHeight}
      />
      <ZoneCornerPost
        position={[(col + width) * cellSize, 0, (row + depth) * cellSize]}
        color={color}
        height={boundaryHeight}
      />
      <ZoneCornerPost
        position={[col * cellSize, 0, (row + depth) * cellSize]}
        color={color}
        height={boundaryHeight}
      />

      {/* Zone label - temporarily disabled for debugging */}
      {/* <Html
        position={[
          (col + width / 2) * cellSize,
          boundaryHeight + 0.1,
          (row + depth / 2) * cellSize,
        ]}
        center
        distanceFactor={15}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{
          background: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
          color: color,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          border: `1px solid ${color}`,
          backdropFilter: 'blur(4px)',
        }}>
          {name}
        </div>
      </Html> */}
    </group>
  )
}

function ZoneCornerPost({ position, color, height }) {
  return (
    <mesh position={[position[0], height / 2, position[2]]}>
      <cylinderGeometry args={[0.03, 0.03, height, 8]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}
