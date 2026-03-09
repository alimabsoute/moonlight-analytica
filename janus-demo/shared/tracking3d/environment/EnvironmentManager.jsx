import { useMemo } from 'react'
import * as THREE from 'three'
import { FURNITURE_LAYOUT, FURNITURE_TYPES } from './furnitureConfig'

// Generic transparent furniture component
function TransparentBox({ position, rotation, width, height, depth, color, opacity, edgeOpacity }) {
  const geometry = useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth])
  const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry])

  return (
    <group position={position} rotation={[0, (rotation || 0) * Math.PI / 180, 0]}>
      {/* Solid fill with transparency */}
      <mesh castShadow={false} receiveShadow={false}>
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Edge outline for visibility */}
      <lineSegments>
        <primitive object={edgeGeometry} attach="geometry" />
        <lineBasicMaterial
          color={color}
          transparent
          opacity={edgeOpacity}
        />
      </lineSegments>
    </group>
  )
}

// Counter (checkout stations)
function Counter({ item, cellSize }) {
  const config = FURNITURE_TYPES.counter
  const width = item.width || config.defaultWidth
  const height = item.height || config.defaultHeight
  const depth = item.depth || config.defaultDepth

  return (
    <TransparentBox
      position={[item.x * cellSize, height / 2, item.z * cellSize]}
      rotation={item.rotation}
      width={width}
      height={height}
      depth={depth}
      color={config.color}
      opacity={config.opacity}
      edgeOpacity={config.edgeOpacity}
    />
  )
}

// Display table (rectangular)
function DisplayTable({ item, cellSize }) {
  const config = FURNITURE_TYPES.display_table
  const width = item.width || config.defaultWidth
  const height = item.height || config.defaultHeight
  const depth = item.depth || config.defaultDepth

  return (
    <group position={[item.x * cellSize, 0, item.z * cellSize]} rotation={[0, (item.rotation || 0) * Math.PI / 180, 0]}>
      {/* Tabletop */}
      <TransparentBox
        position={[0, height - 0.05, 0]}
        width={width}
        height={0.1}
        depth={depth}
        color={config.color}
        opacity={config.opacity}
        edgeOpacity={config.edgeOpacity}
      />
      {/* Legs */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([dx, dz], i) => (
        <TransparentBox
          key={i}
          position={[dx * (width / 2 - 0.08), (height - 0.1) / 2, dz * (depth / 2 - 0.08)]}
          width={0.08}
          height={height - 0.1}
          depth={0.08}
          color={config.color}
          opacity={config.opacity * 0.7}
          edgeOpacity={config.edgeOpacity * 0.7}
        />
      ))}
    </group>
  )
}

// Round table
function RoundTable({ item, cellSize }) {
  const config = FURNITURE_TYPES.round_table
  const radius = item.radius || config.defaultRadius
  const height = item.height || config.defaultHeight

  const topGeometry = useMemo(() => new THREE.CylinderGeometry(radius, radius, 0.05, 24), [radius])
  const legGeometry = useMemo(() => new THREE.CylinderGeometry(0.04, 0.04, height - 0.05, 8), [height])
  const topEdge = useMemo(() => new THREE.EdgesGeometry(topGeometry), [topGeometry])

  return (
    <group position={[item.x * cellSize, 0, item.z * cellSize]}>
      {/* Tabletop */}
      <mesh position={[0, height - 0.025, 0]}>
        <primitive object={topGeometry} attach="geometry" />
        <meshStandardMaterial
          color={config.color}
          transparent
          opacity={config.opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <lineSegments position={[0, height - 0.025, 0]}>
        <primitive object={topEdge} attach="geometry" />
        <lineBasicMaterial color={config.color} transparent opacity={config.edgeOpacity} />
      </lineSegments>

      {/* Center leg */}
      <mesh position={[0, (height - 0.05) / 2, 0]}>
        <primitive object={legGeometry} attach="geometry" />
        <meshStandardMaterial
          color={config.color}
          transparent
          opacity={config.opacity * 0.6}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// Chair
function Chair({ item, cellSize }) {
  const config = FURNITURE_TYPES.chair
  const width = item.width || config.defaultWidth
  const height = item.height || config.defaultHeight
  const depth = item.depth || config.defaultDepth
  const seatHeight = 0.45

  return (
    <group position={[item.x * cellSize, 0, item.z * cellSize]} rotation={[0, (item.rotation || 0) * Math.PI / 180, 0]}>
      {/* Seat */}
      <TransparentBox
        position={[0, seatHeight, 0]}
        width={width}
        height={0.05}
        depth={depth}
        color={config.color}
        opacity={config.opacity}
        edgeOpacity={config.edgeOpacity}
      />
      {/* Back */}
      <TransparentBox
        position={[0, seatHeight + (height - seatHeight) / 2, -depth / 2 + 0.03]}
        width={width}
        height={height - seatHeight}
        depth={0.05}
        color={config.color}
        opacity={config.opacity}
        edgeOpacity={config.edgeOpacity}
      />
      {/* Legs */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([dx, dz], i) => (
        <TransparentBox
          key={i}
          position={[dx * (width / 2 - 0.04), seatHeight / 2, dz * (depth / 2 - 0.04)]}
          width={0.04}
          height={seatHeight}
          depth={0.04}
          color={config.color}
          opacity={config.opacity * 0.5}
          edgeOpacity={config.edgeOpacity * 0.5}
        />
      ))}
    </group>
  )
}

// Shelf unit
function Shelf({ item, cellSize }) {
  const config = FURNITURE_TYPES.shelf
  const width = item.width || config.defaultWidth
  const height = item.height || config.defaultHeight
  const depth = item.depth || config.defaultDepth
  const shelfCount = 4

  return (
    <group position={[item.x * cellSize, 0, item.z * cellSize]} rotation={[0, (item.rotation || 0) * Math.PI / 180, 0]}>
      {/* Side panels */}
      {[-1, 1].map((dx, i) => (
        <TransparentBox
          key={`side-${i}`}
          position={[dx * (width / 2 - 0.03), height / 2, 0]}
          width={0.05}
          height={height}
          depth={depth}
          color={config.color}
          opacity={config.opacity}
          edgeOpacity={config.edgeOpacity}
        />
      ))}
      {/* Shelves */}
      {Array.from({ length: shelfCount }).map((_, i) => (
        <TransparentBox
          key={`shelf-${i}`}
          position={[0, (i + 0.5) * (height / shelfCount), 0]}
          width={width - 0.1}
          height={0.03}
          depth={depth - 0.05}
          color={config.color}
          opacity={config.opacity * 0.8}
          edgeOpacity={config.edgeOpacity}
        />
      ))}
      {/* Back panel */}
      <TransparentBox
        position={[0, height / 2, -depth / 2 + 0.02]}
        width={width - 0.1}
        height={height - 0.1}
        depth={0.02}
        color={config.color}
        opacity={config.opacity * 0.3}
        edgeOpacity={config.edgeOpacity * 0.3}
      />
    </group>
  )
}

// Display rack (clothing)
function DisplayRack({ item, cellSize }) {
  const config = FURNITURE_TYPES.display_rack
  const width = item.width || config.defaultWidth
  const height = item.height || config.defaultHeight
  const depth = item.depth || config.defaultDepth

  return (
    <group position={[item.x * cellSize, 0, item.z * cellSize]} rotation={[0, (item.rotation || 0) * Math.PI / 180, 0]}>
      {/* Base frame */}
      <TransparentBox
        position={[0, 0.05, 0]}
        width={width}
        height={0.1}
        depth={depth}
        color={config.color}
        opacity={config.opacity}
        edgeOpacity={config.edgeOpacity}
      />
      {/* Vertical posts */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([dx, dz], i) => (
        <TransparentBox
          key={i}
          position={[dx * (width / 2 - 0.05), height / 2, dz * (depth / 2 - 0.05)]}
          width={0.05}
          height={height}
          depth={0.05}
          color={config.color}
          opacity={config.opacity}
          edgeOpacity={config.edgeOpacity}
        />
      ))}
      {/* Cross bar (for hanging) */}
      <TransparentBox
        position={[0, height - 0.1, 0]}
        width={width - 0.15}
        height={0.04}
        depth={0.04}
        color={config.color}
        opacity={config.opacity * 1.2}
        edgeOpacity={config.edgeOpacity}
      />
    </group>
  )
}

// Barrier post
function BarrierPost({ item, cellSize }) {
  const config = FURNITURE_TYPES.barrier_post
  const radius = item.radius || config.defaultRadius
  const height = item.height || config.defaultHeight

  const geometry = useMemo(() => new THREE.CylinderGeometry(radius, radius, height, 12), [radius, height])

  return (
    <mesh position={[item.x * cellSize, height / 2, item.z * cellSize]}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color={config.color}
        transparent
        opacity={config.opacity}
        depthWrite={false}
        emissive={config.color}
        emissiveIntensity={0.2}
      />
    </mesh>
  )
}

// Component mapping
const FURNITURE_COMPONENTS = {
  counter: Counter,
  display_table: DisplayTable,
  round_table: RoundTable,
  chair: Chair,
  shelf: Shelf,
  display_rack: DisplayRack,
  barrier_post: BarrierPost,
}

// Main environment manager
export function EnvironmentManager({ zones, cellSize = 1, theme = 'dark' }) {
  return (
    <group>
      {FURNITURE_LAYOUT.map((item, index) => {
        const Component = FURNITURE_COMPONENTS[item.type]
        if (!Component) {
          console.warn(`Unknown furniture type: ${item.type}`)
          return null
        }
        return (
          <Component
            key={`${item.type}-${index}`}
            item={item}
            cellSize={cellSize}
            theme={theme}
          />
        )
      })}
    </group>
  )
}
