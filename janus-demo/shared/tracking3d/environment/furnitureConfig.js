// Furniture layout configuration
// All positions are in grid coordinates (multiply by cellSize for world position)

export const FURNITURE_LAYOUT = [
  // CHECKOUT AREA (zone: checkout)
  { type: 'counter', x: 7.5, z: 3.5, rotation: 0, width: 1.5, height: 1, depth: 0.6 },
  { type: 'counter', x: 7.5, z: 5, rotation: 0, width: 1.5, height: 1, depth: 0.6 },

  // MAIN FLOOR - Display Tables
  { type: 'display_table', x: 3, z: 3.5, rotation: 0, width: 1.2, height: 0.8, depth: 0.8 },
  { type: 'display_table', x: 4.5, z: 4.5, rotation: 45, width: 1, height: 0.8, depth: 1 },
  { type: 'display_table', x: 3.5, z: 5.5, rotation: 0, width: 1.2, height: 0.8, depth: 0.8 },

  // MAIN FLOOR - Round Gathering Tables
  { type: 'round_table', x: 5, z: 3, rotation: 0, radius: 0.5, height: 0.75 },

  // Chairs around gathering table
  { type: 'chair', x: 4.5, z: 2.6, rotation: 45 },
  { type: 'chair', x: 5.5, z: 2.6, rotation: -45 },
  { type: 'chair', x: 4.5, z: 3.4, rotation: 135 },
  { type: 'chair', x: 5.5, z: 3.4, rotation: -135 },

  // ELECTRONICS ZONE - Shelving
  { type: 'shelf', x: 2.5, z: 0.5, rotation: 0, width: 2, height: 1.8, depth: 0.4 },
  { type: 'shelf', x: 4, z: 0.5, rotation: 0, width: 1.5, height: 1.8, depth: 0.4 },

  // CLOTHING ZONE - Display Racks
  { type: 'display_rack', x: 5.5, z: 0.5, rotation: 0, width: 1.5, height: 1.5, depth: 0.5 },
  { type: 'display_rack', x: 6.5, z: 1, rotation: 90, width: 1.2, height: 1.5, depth: 0.5 },

  // ENTRANCE - Barrier Posts
  { type: 'barrier_post', x: 0.3, z: 6.5, rotation: 0 },
  { type: 'barrier_post', x: 1.7, z: 6.5, rotation: 0 },
]

// Furniture type definitions with default properties
export const FURNITURE_TYPES = {
  counter: {
    color: 0x4a90d9,
    opacity: 0.35,
    edgeOpacity: 0.6,
    defaultWidth: 1.5,
    defaultHeight: 1,
    defaultDepth: 0.6,
  },
  display_table: {
    color: 0x8b5cf6,
    opacity: 0.3,
    edgeOpacity: 0.5,
    defaultWidth: 1.2,
    defaultHeight: 0.8,
    defaultDepth: 0.8,
  },
  round_table: {
    color: 0x10b981,
    opacity: 0.3,
    edgeOpacity: 0.5,
    defaultRadius: 0.5,
    defaultHeight: 0.75,
  },
  chair: {
    color: 0xf59e0b,
    opacity: 0.25,
    edgeOpacity: 0.4,
    defaultWidth: 0.4,
    defaultHeight: 0.8,
    defaultDepth: 0.4,
  },
  shelf: {
    color: 0x6366f1,
    opacity: 0.25,
    edgeOpacity: 0.5,
    defaultWidth: 2,
    defaultHeight: 1.8,
    defaultDepth: 0.4,
  },
  display_rack: {
    color: 0xec4899,
    opacity: 0.25,
    edgeOpacity: 0.5,
    defaultWidth: 1.5,
    defaultHeight: 1.5,
    defaultDepth: 0.5,
  },
  barrier_post: {
    color: 0x22d3ee,
    opacity: 0.4,
    edgeOpacity: 0.7,
    defaultRadius: 0.05,
    defaultHeight: 1,
  },
}

// Queue positions relative to counters
export const QUEUE_POSITIONS = [
  // Counter 1 queue (x: 7.5, z: 3.5)
  { counterId: 0, positions: [
    { x: 6.5, z: 3.5 },
    { x: 5.5, z: 3.5 },
    { x: 4.5, z: 3.5 },
    { x: 3.5, z: 3.5 },
  ]},
  // Counter 2 queue (x: 7.5, z: 5)
  { counterId: 1, positions: [
    { x: 6.5, z: 5 },
    { x: 5.5, z: 5 },
    { x: 4.5, z: 5 },
    { x: 3.5, z: 5 },
  ]},
]

// Interest points for browsing behavior
export const INTEREST_POINTS = [
  // Display tables
  { x: 3, z: 3.5, type: 'browse', dwellTime: [3000, 8000] },
  { x: 4.5, z: 4.5, type: 'browse', dwellTime: [2000, 6000] },
  { x: 3.5, z: 5.5, type: 'browse', dwellTime: [3000, 7000] },

  // Electronics shelves
  { x: 2.5, z: 0.8, type: 'inspect', dwellTime: [4000, 10000] },
  { x: 4, z: 0.8, type: 'inspect', dwellTime: [3000, 8000] },

  // Clothing racks
  { x: 5.5, z: 0.8, type: 'browse', dwellTime: [2000, 5000] },
  { x: 6.5, z: 1.3, type: 'browse', dwellTime: [2000, 5000] },

  // Gathering table
  { x: 5, z: 3, type: 'gather', dwellTime: [5000, 15000], maxCapacity: 4 },
]
