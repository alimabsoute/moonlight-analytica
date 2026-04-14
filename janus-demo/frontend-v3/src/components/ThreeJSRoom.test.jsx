import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Mock Three.js before importing the component ───────────────────────────
// jsdom has no WebGL. Rather than papering over every internal Three.js check,
// we stub WebGLRenderer (the only part that needs a real GL context) and keep
// all geometry / material / scene objects as lightweight fakes.
vi.mock('three', async (importOriginal) => {
  const THREE = await importOriginal()

  // Fake renderer — no real GL, just tracks render() calls
  class FakeWebGLRenderer {
    domElement = document.createElement('canvas')
    constructor() {}
    setSize() {}
    setPixelRatio() {}
    setClearColor() {}
    render() {}
    dispose() {}
  }

  return {
    ...THREE,
    WebGLRenderer: FakeWebGLRenderer
  }
})

// Import AFTER mock is registered
import ThreeJSRoom from './ThreeJSRoom'

// ResizeObserver stub (jsdom doesn't have it)
global.ResizeObserver = global.ResizeObserver || vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('ThreeJSRoom', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Gate 3.4 required tests ──────────────────────────────────────────────

  it('renders_webgl_canvas', () => {
    render(<ThreeJSRoom />)
    const canvas = screen.getByTestId('threejs-room-canvas')
    expect(canvas).toBeTruthy()
    expect(canvas.tagName.toLowerCase()).toBe('canvas')
  })

  it('renders_zone_overlays', () => {
    const zones = [
      {
        id: 1,
        name: 'Entrance',
        polygon_world: [[0,0],[2,0],[2,2],[0,2]],
        color: '#00bfff'
      },
      {
        id: 2,
        name: 'Main Floor',
        polygon_world: [[3,0],[8,0],[8,5],[3,5]],
        color: '#10b981'
      }
    ]

    render(<ThreeJSRoom zones={zones} roomWidth={10} roomDepth={6} />)

    // Canvas present
    expect(screen.getByTestId('threejs-room-canvas')).toBeTruthy()

    // Zone labels rendered in the DOM via HTML overlay — visible without WebGL
    expect(screen.getByText('Entrance')).toBeTruthy()
    expect(screen.getByText('Main Floor')).toBeTruthy()
  })

  // ── Additional coverage ──────────────────────────────────────────────────

  it('renders person markers for provided persons list', () => {
    const persons = [
      { id: 1, world_x: 1.5, world_y: 1.5 },
      { id: 2, world_x: 4.0, world_y: 3.0 }
    ]

    render(<ThreeJSRoom persons={persons} />)
    expect(screen.getByTestId('threejs-room-canvas')).toBeTruthy()

    // Person count badge
    const badge = screen.getByTestId('person-count')
    expect(badge).toBeTruthy()
    expect(badge.textContent).toContain('2')
  })

  it('shows room dimensions legend', () => {
    render(<ThreeJSRoom roomWidth={12} roomDepth={8} />)
    const dims = screen.getByTestId('room-dimensions')
    expect(dims).toBeTruthy()
    expect(dims.textContent).toMatch(/12/)
    expect(dims.textContent).toMatch(/8/)
  })
})
