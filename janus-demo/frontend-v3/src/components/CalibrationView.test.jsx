import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalibrationView from './CalibrationView'

// jsdom doesn't implement canvas — minimal mock (same pattern as ZoneOverlay.test.jsx)
function makeCanvasMock() {
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 40 })),
    set fillStyle(_) {},
    get fillStyle() { return '' },
    set strokeStyle(_) {},
    get strokeStyle() { return '' },
    set lineWidth(_) {},
    get lineWidth() { return 1 },
    set font(_) {},
    get font() { return '' },
    set textAlign(_) {},
    get textAlign() { return '' },
    set textBaseline(_) {},
    get textBaseline() { return '' },
    set globalAlpha(_) {},
    get globalAlpha() { return 1 }
  }
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx)
  return ctx
}

// getBoundingClientRect mock so click coords work
function mockBoundingRect(canvas, x = 0, y = 0) {
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: x, top: y, width: 640, height: 480,
    right: x + 640, bottom: y + 480
  })
}

describe('CalibrationView', () => {
  beforeEach(() => {
    makeCanvasMock()
  })

  // -----------------------------------------------------------------------
  // Gate 3.3 required tests
  // -----------------------------------------------------------------------

  it('renders_without_crash', () => {
    render(<CalibrationView />)
    expect(screen.getByTestId('calibration-canvas')).toBeTruthy()
  })

  it('allows_point_selection', () => {
    render(<CalibrationView />)

    const canvas = screen.getByTestId('calibration-canvas')
    mockBoundingRect(canvas)

    // Click 4 distinct points on the canvas
    fireEvent.click(canvas, { clientX: 50,  clientY: 50  })
    fireEvent.click(canvas, { clientX: 200, clientY: 50  })
    fireEvent.click(canvas, { clientX: 200, clientY: 200 })
    fireEvent.click(canvas, { clientX: 50,  clientY: 200 })

    // After 4 clicks, 4 sets of world-coordinate inputs should appear
    const worldXInputs = screen.getAllByPlaceholderText(/world x/i)
    const worldYInputs = screen.getAllByPlaceholderText(/world y/i)

    expect(worldXInputs).toHaveLength(4)
    expect(worldYInputs).toHaveLength(4)
  })

  // -----------------------------------------------------------------------
  // Additional coverage
  // -----------------------------------------------------------------------

  it('shows calibrate button only after 4 or more points', () => {
    render(<CalibrationView />)
    const canvas = screen.getByTestId('calibration-canvas')
    mockBoundingRect(canvas)

    // Button absent before 4 points
    expect(screen.queryByRole('button', { name: /calibrate/i })).toBeNull()

    fireEvent.click(canvas, { clientX: 10, clientY: 10 })
    fireEvent.click(canvas, { clientX: 100, clientY: 10 })
    fireEvent.click(canvas, { clientX: 100, clientY: 100 })
    expect(screen.queryByRole('button', { name: /calibrate/i })).toBeNull()

    fireEvent.click(canvas, { clientX: 10, clientY: 100 })
    expect(screen.getByRole('button', { name: /calibrate/i })).toBeTruthy()
  })

  it('shows reprojection error after successful calibration', async () => {
    const mockPost = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reprojection_error: 1.23, matrix: [] })
    })
    global.fetch = mockPost

    const user = userEvent.setup()

    render(<CalibrationView cameraId="cam-1" />)
    const canvas = screen.getByTestId('calibration-canvas')
    mockBoundingRect(canvas)

    // Add 4 points
    for (const [cx, cy] of [[50,50],[250,50],[250,250],[50,250]]) {
      fireEvent.click(canvas, { clientX: cx, clientY: cy })
    }

    // Fill in world coords for the 4 points
    const wxInputs = screen.getAllByPlaceholderText(/world x/i)
    const wyInputs = screen.getAllByPlaceholderText(/world y/i)
    const coords = [[0,0],[3,0],[3,3],[0,3]]
    for (let i = 0; i < 4; i++) {
      await user.clear(wxInputs[i])
      await user.type(wxInputs[i], String(coords[i][0]))
      await user.clear(wyInputs[i])
      await user.type(wyInputs[i], String(coords[i][1]))
    }

    await user.click(screen.getByRole('button', { name: /calibrate/i }))

    // Reprojection error must be visible
    expect(await screen.findByText(/reprojection error/i)).toBeTruthy()
    expect(await screen.findByText(/1\.23/)).toBeTruthy()
  })
})
