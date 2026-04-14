import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

/**
 * ThreeJSRoom — top-down 3D bird's-eye-view of a physical space.
 *
 * Props:
 *   roomWidth   {number}   Room width in metres  (default 10)
 *   roomDepth   {number}   Room depth in metres  (default 8)
 *   roomHeight  {number}   Ceiling height (for future walls) (default 3)
 *   zones       {Array}    Zone objects with polygon_world [[x,y],…] + color + name
 *   persons     {Array}    Person objects { id, world_x, world_y }
 *   wsUrl       {string}   Optional WebSocket URL for live position updates
 *   width       {number}   Canvas pixel width  (default 640)
 *   height      {number}   Canvas pixel height (default 480)
 */
export default function ThreeJSRoom({
  roomWidth  = 10,
  roomDepth  = 8,
  roomHeight = 3,
  zones      = [],
  persons    = [],
  wsUrl      = null,
  width      = 640,
  height     = 480
}) {
  const mountRef   = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef   = useRef(null)
  const cameraRef  = useRef(null)
  const rafRef     = useRef(null)
  const wsRef      = useRef(null)
  const personMeshRef = useRef({})   // id → mesh

  // Live persons state — merged from props and WebSocket updates
  const [livePersons, setLivePersons] = useState(persons)
  const [wsConnected, setWsConnected] = useState(false)

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Convert world (x, y) metres → Three.js (x, 0, z) */
  const w2three = useCallback((wx, wy) => ({
    x: wx - roomWidth  / 2,
    z: wy - roomDepth  / 2
  }), [roomWidth, roomDepth])

  /** Build a flat polygon Shape from [[x,y],…] world coords */
  const buildZoneShape = useCallback((polygon) => {
    const shape = new THREE.Shape()
    polygon.forEach(([wx, wy], i) => {
      const { x, z } = w2three(wx, wy)
      if (i === 0) shape.moveTo(x, z)
      else         shape.lineTo(x, z)
    })
    shape.closePath()
    return shape
  }, [w2three])

  // ── Scene setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: mount,
      antialias: true,
      alpha: false
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0f172a)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera — orthographic top-down gives the cleanest BEV
    const aspect = width / height
    const camW   = roomWidth  * 1.2
    const camH   = camW / aspect
    const camera = new THREE.OrthographicCamera(
      -camW / 2, camW / 2,
       camH / 2, -camH / 2,
      0.1, 200
    )
    camera.position.set(0, 50, 0)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const dir = new THREE.DirectionalLight(0xffffff, 0.4)
    dir.position.set(5, 20, 5)
    scene.add(dir)

    // Floor
    const floorGeo  = new THREE.PlaneGeometry(roomWidth, roomDepth)
    const floorMat  = new THREE.MeshLambertMaterial({ color: 0x1e293b, side: THREE.DoubleSide })
    const floor      = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    // Floor grid
    const grid = new THREE.GridHelper(Math.max(roomWidth, roomDepth), Math.max(roomWidth, roomDepth), 0x334155, 0x1e293b)
    scene.add(grid)

    // Room border
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(roomWidth, 0.02, roomDepth))
    const borderMat = new THREE.LineBasicMaterial({ color: 0x00bfff, linewidth: 2 })
    scene.add(new THREE.LineSegments(borderGeo, borderMat))

    // Animation loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafRef.current)
      renderer.dispose()
    }
  }, [width, height, roomWidth, roomDepth]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Zone overlays ────────────────────────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Remove old zone meshes
    const toRemove = scene.children.filter(c => c.userData.isZone)
    toRemove.forEach(c => { scene.remove(c); c.geometry?.dispose() })

    zones.forEach((zone) => {
      const poly = zone.polygon_world
      if (!Array.isArray(poly) || poly.length < 3) return

      const color = zone.color || '#3b82f6'

      const shape = buildZoneShape(poly)

      // Filled semi-transparent plane (ShapeGeometry is flat on XZ)
      const geo = new THREE.ShapeGeometry(shape)
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.y = 0.01
      mesh.userData.isZone = true
      scene.add(mesh)

      // Zone border line
      const points = [...poly, poly[0]].map(([wx, wy]) => {
        const { x, z } = w2three(wx, wy)
        return new THREE.Vector3(x, 0.02, z)
      })
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(color) })
      const line    = new THREE.Line(lineGeo, lineMat)
      line.userData.isZone = true
      scene.add(line)
    })
  }, [zones, buildZoneShape, w2three])

  // ── Person markers ───────────────────────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const nextIds = new Set(livePersons.map(p => p.id))
    const meshMap = personMeshRef.current

    // Remove stale markers
    Object.keys(meshMap).forEach(id => {
      if (!nextIds.has(Number(id))) {
        scene.remove(meshMap[id])
        meshMap[id].geometry?.dispose()
        delete meshMap[id]
      }
    })

    // Add / update markers
    livePersons.forEach(({ id, world_x, world_y }) => {
      const { x, z } = w2three(world_x ?? 0, world_y ?? 0)
      if (meshMap[id]) {
        // Interpolate position
        const target = new THREE.Vector3(x, 0.3, z)
        meshMap[id].position.lerp(target, 0.3)
      } else {
        const geo  = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 12)
        const mat  = new THREE.MeshLambertMaterial({ color: 0xfbbf24 })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(x, 0.3, z)
        mesh.userData.isPerson = true
        scene.add(mesh)
        meshMap[id] = mesh
      }
    })
  }, [livePersons, w2three])

  // ── WebSocket live updates ───────────────────────────────────────────────
  useEffect(() => {
    if (!wsUrl) return

    let ws
    try {
      ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => setWsConnected(true)
      ws.onclose = () => setWsConnected(false)
      ws.onerror = () => setWsConnected(false)

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          if (Array.isArray(data.persons)) {
            setLivePersons(data.persons)
          }
        } catch (_) { /* ignore malformed */ }
      }
    } catch (_) { /* ignore invalid wsUrl */ }

    return () => {
      ws?.close()
      setWsConnected(false)
    }
  }, [wsUrl])

  // ── Sync prop persons when no WS ────────────────────────────────────────
  useEffect(() => {
    if (!wsUrl) setLivePersons(persons)
  }, [persons, wsUrl])

  // ── Zone label positions for HTML overlay ───────────────────────────────
  const zoneLabelStyle = (zone) => {
    if (!Array.isArray(zone.polygon_world) || zone.polygon_world.length < 3) return null
    // centroid in world coords
    const cx = zone.polygon_world.reduce((s, [x]) => s + x, 0) / zone.polygon_world.length
    const cy = zone.polygon_world.reduce((s, [, y]) => s + y, 0) / zone.polygon_world.length
    // project to screen: map world→normalised→pixels
    const nx = (cx / roomWidth)
    const ny = (cy / roomDepth)
    return {
      position: 'absolute',
      left: `${nx * 100}%`,
      top:  `${ny * 100}%`,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      fontSize: '0.7rem',
      fontWeight: 700,
      color: zone.color || '#94a3b8',
      background: 'rgba(0,0,0,0.55)',
      padding: '1px 6px',
      borderRadius: 4,
      whiteSpace: 'nowrap'
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', background: '#0f172a', borderRadius: 8 }}>
      <canvas
        ref={mountRef}
        width={width}
        height={height}
        data-testid="threejs-room-canvas"
        style={{ display: 'block', borderRadius: 8 }}
      />

      {/* Zone name labels (HTML overlay — readable in tests without WebGL) */}
      {zones.map((zone) => {
        const s = zoneLabelStyle(zone)
        return s ? (
          <span key={zone.id} style={s}>
            {zone.name}
          </span>
        ) : null
      })}

      {/* Status bar */}
      <div style={statusBarStyle}>
        <span data-testid="person-count" style={badgeStyle('#fbbf24')}>
          {livePersons.length} person{livePersons.length !== 1 ? 's' : ''}
        </span>

        <span data-testid="room-dimensions" style={badgeStyle('#64748b')}>
          {roomWidth} m × {roomDepth} m
        </span>

        {wsUrl && (
          <span style={badgeStyle(wsConnected ? '#10b981' : '#ef4444')}>
            {wsConnected ? 'WS live' : 'WS off'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────
const statusBarStyle = {
  position: 'absolute',
  bottom: 8,
  left: 8,
  display: 'flex',
  gap: 6,
  alignItems: 'center'
}

const badgeStyle = (color) => ({
  fontSize: '0.7rem',
  fontWeight: 600,
  color,
  background: 'rgba(0,0,0,0.6)',
  padding: '2px 8px',
  borderRadius: 99,
  border: `1px solid ${color}55`
})
