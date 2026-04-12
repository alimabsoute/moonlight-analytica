import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ZoneOverlay from './ZoneOverlay'

// jsdom doesn't implement canvas — provide a minimal mock
function makeCanvasMock() {
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 60 })),
    roundRect: vi.fn(),
    set globalAlpha(_) {},
    get globalAlpha() { return 1 },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: ''
  }
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx)
  return ctx
}

describe('ZoneOverlay', () => {
  let ctx

  beforeEach(() => {
    ctx = makeCanvasMock()
  })

  it('renders_without_crash', () => {
    render(<ZoneOverlay />)
    expect(screen.getByTestId('zone-overlay-canvas')).toBeTruthy()
  })

  it('renders_zone_polygons', () => {
    const zones = [
      {
        id: 1,
        name: 'Entrance',
        polygon_image: [[10, 10], [100, 10], [100, 80], [10, 80]],
        color: '#00bfff',
        count: 5
      },
      {
        id: 2,
        name: 'Main Floor',
        polygon_image: [[110, 10], [300, 10], [300, 200], [110, 200]],
        color: '#10b981',
        count: 12
      }
    ]

    render(<ZoneOverlay zones={zones} width={640} height={480} />)

    // Canvas rendered
    expect(screen.getByTestId('zone-overlay-canvas')).toBeTruthy()

    // Each zone's polygon was drawn (moveTo called once per zone for the first point)
    expect(ctx.moveTo).toHaveBeenCalledTimes(2)

    // lineTo called for remaining points: 3 per zone × 2 zones = 6
    expect(ctx.lineTo).toHaveBeenCalledTimes(6)

    // Each zone filled and stroked
    expect(ctx.fill).toHaveBeenCalledTimes(4) // 2 polygon fills + 2 label backgrounds
    expect(ctx.stroke).toHaveBeenCalledTimes(2)

    // Labels drawn
    expect(ctx.fillText).toHaveBeenCalledWith('Entrance (5)', expect.any(Number), expect.any(Number))
    expect(ctx.fillText).toHaveBeenCalledWith('Main Floor (12)', expect.any(Number), expect.any(Number))
  })

  it('skips zones with fewer than 3 polygon points', () => {
    const zones = [
      { id: 1, name: 'Bad', polygon_image: [[0, 0], [10, 0]], color: '#f00' },
      { id: 2, name: 'Good', polygon_image: [[0, 0], [50, 0], [50, 50]], color: '#0f0', count: 3 }
    ]

    render(<ZoneOverlay zones={zones} />)

    // Only 1 valid zone drawn
    expect(ctx.moveTo).toHaveBeenCalledTimes(1)
  })

  it('renders label without count when count is null', () => {
    const zones = [
      { id: 1, name: 'VIP Area', polygon_image: [[0, 0], [50, 0], [50, 50]], color: '#8b5cf6' }
    ]

    render(<ZoneOverlay zones={zones} />)
    expect(ctx.fillText).toHaveBeenCalledWith('VIP Area', expect.any(Number), expect.any(Number))
  })
})
