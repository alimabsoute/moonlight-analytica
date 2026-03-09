import { useMemo } from 'react'
import * as THREE from 'three'

export function FloorGrid({ size = 10, cellSize = 1, theme = 'dark' }) {
  const floorGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(size * cellSize, size * cellSize)
  }, [size, cellSize])

  const floorMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? '#1a1a2e' : '#e2e8f0',
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })
  }, [theme])

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = []
    const gridColor = theme === 'dark' ? '#2a2a4e' : '#cbd5e1'
    const material = new THREE.LineBasicMaterial({
      color: gridColor,
      transparent: true,
      opacity: 0.5,
    })

    // Horizontal lines
    for (let i = 0; i <= size; i++) {
      const points = [
        new THREE.Vector3(0, 0.01, i * cellSize),
        new THREE.Vector3(size * cellSize, 0.01, i * cellSize),
      ]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      lines.push({ geometry, material, key: `h-${i}` })
    }

    // Vertical lines
    for (let i = 0; i <= size; i++) {
      const points = [
        new THREE.Vector3(i * cellSize, 0.01, 0),
        new THREE.Vector3(i * cellSize, 0.01, size * cellSize),
      ]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      lines.push({ geometry, material, key: `v-${i}` })
    }

    return lines
  }, [size, cellSize, theme])

  // Isometric tile pattern (optional decorative tiles)
  const tiles = useMemo(() => {
    const tileArray = []
    const lightColor = theme === 'dark' ? '#1e1e38' : '#f1f5f9'
    const darkColor = theme === 'dark' ? '#16162a' : '#e2e8f0'

    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const isLight = (x + z) % 2 === 0
        tileArray.push({
          position: [(x + 0.5) * cellSize, 0.005, (z + 0.5) * cellSize],
          color: isLight ? lightColor : darkColor,
          key: `tile-${x}-${z}`,
        })
      }
    }
    return tileArray
  }, [size, cellSize, theme])

  return (
    <group>
      {/* Main floor plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[size * cellSize / 2, 0, size * cellSize / 2]}
        receiveShadow
      >
        <primitive object={floorGeometry} attach="geometry" />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* Checkerboard tiles for depth perception */}
      {tiles.map(tile => (
        <mesh
          key={tile.key}
          rotation={[-Math.PI / 2, 0, 0]}
          position={tile.position}
          receiveShadow
        >
          <planeGeometry args={[cellSize * 0.98, cellSize * 0.98]} />
          <meshStandardMaterial
            color={tile.color}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      ))}

      {/* Grid lines */}
      {gridLines.map(line => (
        <line key={line.key}>
          <primitive object={line.geometry} attach="geometry" />
          <primitive object={line.material} attach="material" />
        </line>
      ))}
    </group>
  )
}
