import { useRef, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { INTEREST_POINTS, QUEUE_POSITIONS } from '../environment/furnitureConfig'

// Character configuration
const CHARACTER_CONFIG = {
  // Body proportions (relative to height of ~1.7 units)
  HEIGHT: 1.7,
  HEAD_RADIUS: 0.12,
  TORSO_HEIGHT: 0.5,
  TORSO_WIDTH: 0.35,
  TORSO_DEPTH: 0.2,
  HIP_HEIGHT: 0.25,
  LEG_LENGTH: 0.7,
  LEG_WIDTH: 0.1,
  ARM_LENGTH: 0.55,
  ARM_WIDTH: 0.08,

  // Animation
  WALK_SPEED_MIN: 0.008,
  WALK_SPEED_MAX: 0.02,
  WALK_CYCLE_SPEED: 8,
  ARM_SWING: 0.4,
  LEG_SWING: 0.5,

  // Behavior
  IDLE_TIME_MIN: 2000,
  IDLE_TIME_MAX: 8000,
  BROWSE_TIME_MIN: 3000,
  BROWSE_TIME_MAX: 10000,
  CHECKOUT_TIME_MIN: 5000,
  CHECKOUT_TIME_MAX: 15000,
}

// Character colors (clothing variations)
const CHARACTER_STYLES = [
  { shirt: '#3b82f6', pants: '#1e3a5f', skin: '#f5d0c5' }, // Blue casual
  { shirt: '#ef4444', pants: '#1f2937', skin: '#e8c4b8' }, // Red shirt
  { shirt: '#10b981', pants: '#374151', skin: '#f5d0c5' }, // Green top
  { shirt: '#8b5cf6', pants: '#1e293b', skin: '#d4a574' }, // Purple
  { shirt: '#f59e0b', pants: '#27272a', skin: '#f5d0c5' }, // Yellow/orange
  { shirt: '#ec4899', pants: '#18181b', skin: '#e8c4b8' }, // Pink
  { shirt: '#06b6d4', pants: '#1e3a5f', skin: '#d4a574' }, // Cyan
  { shirt: '#f8fafc', pants: '#0f172a', skin: '#f5d0c5' }, // White shirt
]

// Behavior states
const STATES = {
  ENTERING: 'entering',
  BROWSING: 'browsing',
  INSPECTING: 'inspecting',
  QUEUING: 'queuing',
  CHECKOUT: 'checkout',
  EXITING: 'exiting',
}

// Character class
class Character {
  constructor(id, cellSize, zones) {
    this.id = id
    this.cellSize = cellSize
    this.zones = zones

    // Spawn at entrance
    const entranceZone = zones.find(z => z.id === 'entrance')
    this.x = (entranceZone.col + Math.random() * entranceZone.width) * cellSize
    this.z = (entranceZone.row + entranceZone.depth + 0.5) * cellSize // Start outside

    this.targetX = this.x
    this.targetZ = (entranceZone.row + entranceZone.depth / 2) * cellSize

    // Movement
    this.speed = CHARACTER_CONFIG.WALK_SPEED_MIN +
      Math.random() * (CHARACTER_CONFIG.WALK_SPEED_MAX - CHARACTER_CONFIG.WALK_SPEED_MIN)
    this.direction = 0
    this.isMoving = true

    // Animation
    this.walkPhase = Math.random() * Math.PI * 2
    this.style = CHARACTER_STYLES[Math.floor(Math.random() * CHARACTER_STYLES.length)]

    // Behavior
    this.state = STATES.ENTERING
    this.stateTimer = 0
    this.currentZone = null
    this.queuePosition = -1
    this.queueId = -1

    // Interest tracking
    this.visitedInterests = new Set()
    this.currentInterest = null
  }

  update(deltaTime, queueManager) {
    // Update zone detection
    this.currentZone = this.detectZone()

    // State machine
    switch (this.state) {
      case STATES.ENTERING:
        this.handleEntering()
        break
      case STATES.BROWSING:
        this.handleBrowsing(deltaTime)
        break
      case STATES.INSPECTING:
        this.handleInspecting(deltaTime)
        break
      case STATES.QUEUING:
        this.handleQueuing(queueManager)
        break
      case STATES.CHECKOUT:
        this.handleCheckout(deltaTime, queueManager)
        break
      case STATES.EXITING:
        this.handleExiting()
        break
    }

    // Movement
    if (this.isMoving) {
      this.moveToTarget(deltaTime)
    }

    // Animation
    if (this.isMoving) {
      this.walkPhase += deltaTime * CHARACTER_CONFIG.WALK_CYCLE_SPEED * (this.speed / CHARACTER_CONFIG.WALK_SPEED_MAX)
    }
  }

  moveToTarget(deltaTime) {
    const dx = this.targetX - this.x
    const dz = this.targetZ - this.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    if (distance > 0.05) {
      const moveSpeed = this.speed * deltaTime * 60
      this.x += (dx / distance) * Math.min(moveSpeed, distance)
      this.z += (dz / distance) * Math.min(moveSpeed, distance)
      this.direction = Math.atan2(dx, dz)
      this.isMoving = true
    } else {
      this.x = this.targetX
      this.z = this.targetZ
      this.isMoving = false
    }
  }

  handleEntering() {
    if (!this.isMoving) {
      // Reached entrance, start browsing
      this.state = STATES.BROWSING
      this.pickBrowseTarget()
    }
  }

  handleBrowsing(deltaTime) {
    if (!this.isMoving) {
      this.stateTimer += deltaTime * 1000

      // Decide what to do
      if (this.stateTimer > CHARACTER_CONFIG.IDLE_TIME_MIN + Math.random() * (CHARACTER_CONFIG.IDLE_TIME_MAX - CHARACTER_CONFIG.IDLE_TIME_MIN)) {
        this.stateTimer = 0

        // Random decision: continue browsing, inspect, queue, or leave
        const decision = Math.random()
        if (decision < 0.4) {
          // Continue browsing
          this.pickBrowseTarget()
        } else if (decision < 0.7) {
          // Go inspect something
          this.pickInterestPoint()
        } else if (decision < 0.9) {
          // Go to checkout
          this.state = STATES.QUEUING
          this.pickQueue()
        } else {
          // Leave
          this.state = STATES.EXITING
          this.pickExitTarget()
        }
      }
    }
  }

  handleInspecting(deltaTime) {
    if (!this.isMoving) {
      this.stateTimer += deltaTime * 1000

      const dwellTime = this.currentInterest?.dwellTime ||
        [CHARACTER_CONFIG.BROWSE_TIME_MIN, CHARACTER_CONFIG.BROWSE_TIME_MAX]
      const maxDwell = dwellTime[0] + Math.random() * (dwellTime[1] - dwellTime[0])

      if (this.stateTimer > maxDwell) {
        this.stateTimer = 0
        this.visitedInterests.add(this.currentInterest)
        this.currentInterest = null

        // Decide next action
        if (Math.random() < 0.6) {
          this.state = STATES.BROWSING
          this.pickBrowseTarget()
        } else {
          this.state = STATES.QUEUING
          this.pickQueue()
        }
      }
    }
  }

  handleQueuing(queueManager) {
    if (this.queuePosition >= 0) {
      const pos = queueManager.getPosition(this.queueId, this.queuePosition)
      if (pos) {
        this.targetX = pos.x * this.cellSize
        this.targetZ = pos.z * this.cellSize
      }

      // Check if at front of queue
      if (this.queuePosition === 0 && !this.isMoving) {
        this.state = STATES.CHECKOUT
        this.stateTimer = 0
      }
    }
  }

  handleCheckout(deltaTime, queueManager) {
    this.stateTimer += deltaTime * 1000

    const checkoutTime = CHARACTER_CONFIG.CHECKOUT_TIME_MIN +
      Math.random() * (CHARACTER_CONFIG.CHECKOUT_TIME_MAX - CHARACTER_CONFIG.CHECKOUT_TIME_MIN)

    if (this.stateTimer > checkoutTime) {
      queueManager.leave(this.queueId, this.id)
      this.queuePosition = -1
      this.state = STATES.EXITING
      this.pickExitTarget()
    }
  }

  handleExiting() {
    // Character will be removed when reaching exit
  }

  pickBrowseTarget() {
    const mainFloor = this.zones.find(z => z.id === 'main_floor')
    if (mainFloor) {
      this.targetX = (mainFloor.col + Math.random() * mainFloor.width) * this.cellSize
      this.targetZ = (mainFloor.row + Math.random() * mainFloor.depth) * this.cellSize
    }
  }

  pickInterestPoint() {
    const unvisited = INTEREST_POINTS.filter(p => !this.visitedInterests.has(p))
    if (unvisited.length > 0) {
      const point = unvisited[Math.floor(Math.random() * unvisited.length)]
      this.currentInterest = point
      this.targetX = point.x * this.cellSize
      this.targetZ = point.z * this.cellSize
      this.state = STATES.INSPECTING
    } else {
      this.pickBrowseTarget()
    }
  }

  pickQueue() {
    // Pick random queue
    const queueId = Math.floor(Math.random() * QUEUE_POSITIONS.length)
    this.queueId = queueId
  }

  pickExitTarget() {
    const entrance = this.zones.find(z => z.id === 'entrance')
    if (entrance) {
      this.targetX = (entrance.col + entrance.width / 2) * this.cellSize
      this.targetZ = (entrance.row + entrance.depth + 1) * this.cellSize // Exit past entrance
    }
  }

  detectZone() {
    const gridX = this.x / this.cellSize
    const gridZ = this.z / this.cellSize

    for (const zone of this.zones) {
      if (gridX >= zone.col && gridX < zone.col + zone.width &&
          gridZ >= zone.row && gridZ < zone.row + zone.depth) {
        return zone.id
      }
    }
    return null
  }

  isOutOfBounds() {
    const entrance = this.zones.find(z => z.id === 'entrance')
    if (entrance && this.state === STATES.EXITING) {
      return this.z > (entrance.row + entrance.depth + 1.5) * this.cellSize
    }
    return false
  }
}

// Simple queue manager
class QueueManager {
  constructor() {
    this.queues = QUEUE_POSITIONS.map(() => [])
  }

  join(queueId, characterId) {
    if (queueId >= 0 && queueId < this.queues.length) {
      if (!this.queues[queueId].includes(characterId)) {
        this.queues[queueId].push(characterId)
        return this.queues[queueId].length - 1
      }
      return this.queues[queueId].indexOf(characterId)
    }
    return -1
  }

  leave(queueId, characterId) {
    if (queueId >= 0 && queueId < this.queues.length) {
      const index = this.queues[queueId].indexOf(characterId)
      if (index >= 0) {
        this.queues[queueId].splice(index, 1)
      }
    }
  }

  getPosition(queueId, position) {
    if (queueId >= 0 && queueId < QUEUE_POSITIONS.length) {
      const positions = QUEUE_POSITIONS[queueId].positions
      if (position < positions.length) {
        return positions[position]
      }
    }
    return null
  }

  getQueuePosition(queueId, characterId) {
    if (queueId >= 0 && queueId < this.queues.length) {
      return this.queues[queueId].indexOf(characterId)
    }
    return -1
  }
}

// Procedural humanoid component
function ProceduralHumanoid({ character, showLabel, theme }) {
  const groupRef = useRef()

  // Animation values
  const leftArmAngle = Math.sin(character.walkPhase) * CHARACTER_CONFIG.ARM_SWING * (character.isMoving ? 1 : 0)
  const rightArmAngle = Math.sin(character.walkPhase + Math.PI) * CHARACTER_CONFIG.ARM_SWING * (character.isMoving ? 1 : 0)
  const leftLegAngle = Math.sin(character.walkPhase + Math.PI) * CHARACTER_CONFIG.LEG_SWING * (character.isMoving ? 1 : 0)
  const rightLegAngle = Math.sin(character.walkPhase) * CHARACTER_CONFIG.LEG_SWING * (character.isMoving ? 1 : 0)

  // Body bob while walking
  const bodyBob = Math.abs(Math.sin(character.walkPhase * 2)) * 0.02 * (character.isMoving ? 1 : 0)

  const { shirt, pants, skin } = character.style

  return (
    <group
      ref={groupRef}
      position={[character.x, bodyBob, character.z]}
      rotation={[0, character.direction, 0]}
    >
      {/* Head */}
      <mesh position={[0, CHARACTER_CONFIG.HEIGHT - CHARACTER_CONFIG.HEAD_RADIUS, 0]} castShadow>
        <sphereGeometry args={[CHARACTER_CONFIG.HEAD_RADIUS, 16, 12]} />
        <meshStandardMaterial color={skin} roughness={0.8} />
      </mesh>

      {/* Hair (simple cap) */}
      <mesh position={[0, CHARACTER_CONFIG.HEIGHT - CHARACTER_CONFIG.HEAD_RADIUS * 0.5, 0]} castShadow>
        <sphereGeometry args={[CHARACTER_CONFIG.HEAD_RADIUS * 1.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, CHARACTER_CONFIG.HEIGHT - CHARACTER_CONFIG.HEAD_RADIUS * 2 - CHARACTER_CONFIG.TORSO_HEIGHT / 2 - 0.05, 0]} castShadow>
        <boxGeometry args={[CHARACTER_CONFIG.TORSO_WIDTH, CHARACTER_CONFIG.TORSO_HEIGHT, CHARACTER_CONFIG.TORSO_DEPTH]} />
        <meshStandardMaterial color={shirt} roughness={0.7} />
      </mesh>

      {/* Hips */}
      <mesh position={[0, CHARACTER_CONFIG.LEG_LENGTH + CHARACTER_CONFIG.HIP_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[CHARACTER_CONFIG.TORSO_WIDTH * 0.9, CHARACTER_CONFIG.HIP_HEIGHT, CHARACTER_CONFIG.TORSO_DEPTH]} />
        <meshStandardMaterial color={pants} roughness={0.7} />
      </mesh>

      {/* Left Arm */}
      <group position={[-CHARACTER_CONFIG.TORSO_WIDTH / 2 - CHARACTER_CONFIG.ARM_WIDTH / 2, CHARACTER_CONFIG.HEIGHT - CHARACTER_CONFIG.HEAD_RADIUS * 2 - 0.1, 0]}>
        <mesh rotation={[leftArmAngle, 0, 0]} position={[0, -CHARACTER_CONFIG.ARM_LENGTH / 2, 0]} castShadow>
          <capsuleGeometry args={[CHARACTER_CONFIG.ARM_WIDTH / 2, CHARACTER_CONFIG.ARM_LENGTH, 4, 8]} />
          <meshStandardMaterial color={shirt} roughness={0.7} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[CHARACTER_CONFIG.TORSO_WIDTH / 2 + CHARACTER_CONFIG.ARM_WIDTH / 2, CHARACTER_CONFIG.HEIGHT - CHARACTER_CONFIG.HEAD_RADIUS * 2 - 0.1, 0]}>
        <mesh rotation={[rightArmAngle, 0, 0]} position={[0, -CHARACTER_CONFIG.ARM_LENGTH / 2, 0]} castShadow>
          <capsuleGeometry args={[CHARACTER_CONFIG.ARM_WIDTH / 2, CHARACTER_CONFIG.ARM_LENGTH, 4, 8]} />
          <meshStandardMaterial color={shirt} roughness={0.7} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group position={[-CHARACTER_CONFIG.TORSO_WIDTH / 4, CHARACTER_CONFIG.LEG_LENGTH, 0]}>
        <mesh rotation={[leftLegAngle, 0, 0]} position={[0, -CHARACTER_CONFIG.LEG_LENGTH / 2, 0]} castShadow>
          <capsuleGeometry args={[CHARACTER_CONFIG.LEG_WIDTH / 2, CHARACTER_CONFIG.LEG_LENGTH, 4, 8]} />
          <meshStandardMaterial color={pants} roughness={0.7} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[CHARACTER_CONFIG.TORSO_WIDTH / 4, CHARACTER_CONFIG.LEG_LENGTH, 0]}>
        <mesh rotation={[rightLegAngle, 0, 0]} position={[0, -CHARACTER_CONFIG.LEG_LENGTH / 2, 0]} castShadow>
          <capsuleGeometry args={[CHARACTER_CONFIG.LEG_WIDTH / 2, CHARACTER_CONFIG.LEG_LENGTH, 4, 8]} />
          <meshStandardMaterial color={pants} roughness={0.7} />
        </mesh>
      </group>

      {/* ID Label */}
      {showLabel && (
        <Html position={[0, CHARACTER_CONFIG.HEIGHT + 0.2, 0]} center distanceFactor={12}>
          <div style={{
            background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
            color: theme === 'dark' ? '#22d3ee' : '#0891b2',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            border: `1px solid ${theme === 'dark' ? '#22d3ee' : '#0891b2'}`,
          }}>
            #{character.id}
          </div>
        </Html>
      )}
    </group>
  )
}

// Main character manager component
export const CharacterManager = forwardRef(function CharacterManager({
  zones,
  cellSize = 1,
  maxPeople = 25,
  spawnInterval = 2000,
  onMetricsUpdate,
  showLabels = true,
  theme = 'dark',
}, ref) {
  const [characters, setCharacters] = useState([])
  const nextIdRef = useRef(1)
  const lastSpawnRef = useRef(0)
  const queueManagerRef = useRef(new QueueManager())

  const metricsRef = useRef({
    totalEntries: 0,
    totalExits: 0,
    currentCount: 0,
    zoneCounts: {},
    peakCount: 0,
  })

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getCharacters: () => characters,
    getMetrics: () => metricsRef.current,
  }))

  // Update loop
  useFrame((state, delta) => {
    const now = state.clock.getElapsedTime() * 1000

    // Spawn new characters
    if (characters.length < maxPeople && now - lastSpawnRef.current > spawnInterval) {
      lastSpawnRef.current = now
      const newChar = new Character(nextIdRef.current++, cellSize, zones)
      setCharacters(prev => [...prev, newChar])
      metricsRef.current.totalEntries++
    }

    // Update all characters
    setCharacters(prev => {
      const updated = prev.map(char => {
        char.update(delta, queueManagerRef.current)

        // Handle queue joining
        if (char.state === STATES.QUEUING && char.queuePosition < 0) {
          char.queuePosition = queueManagerRef.current.join(char.queueId, char.id)
        }

        return char
      })

      // Remove exited characters
      const remaining = updated.filter(char => !char.isOutOfBounds())
      const exited = updated.length - remaining.length
      metricsRef.current.totalExits += exited

      return remaining
    })

    // Update metrics
    const zoneCounts = {}
    zones.forEach(z => zoneCounts[z.id] = 0)
    characters.forEach(char => {
      if (char.currentZone) {
        zoneCounts[char.currentZone] = (zoneCounts[char.currentZone] || 0) + 1
      }
    })

    metricsRef.current.currentCount = characters.length
    metricsRef.current.zoneCounts = zoneCounts
    metricsRef.current.peakCount = Math.max(metricsRef.current.peakCount, characters.length)

    onMetricsUpdate?.(metricsRef.current)
  })

  return (
    <group>
      {characters.map(char => (
        <ProceduralHumanoid
          key={char.id}
          character={char}
          showLabel={showLabels}
          theme={theme}
        />
      ))}
    </group>
  )
})
