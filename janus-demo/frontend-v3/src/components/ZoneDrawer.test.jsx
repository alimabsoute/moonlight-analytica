import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ZoneDrawer from './ZoneDrawer'

// jsdom doesn't implement canvas — minimal mock (same pattern as CalibrationView.test.jsx)
function makeCanvasMock() {
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 60 })),
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

function mockBoundingRect(canvas, left = 0, top = 0) {
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left, top, width: 640, height: 480,
    right: left + 640, bottom: top + 480
  })
}

describe('ZoneDrawer', () => {
  beforeEach(() => {
    makeCanvasMock()
    global.fetch = vi.fn()
  })

  // ── Gate 6.1 required tests ──────────────────────────────────────────────

  it('renders_without_crash', () => {
    render(<ZoneDrawer />)
    expect(screen.getByTestId('zone-drawer-canvas')).toBeTruthy()
  })

  it('click_adds_point_to_polygon', () => {
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    // Before any clicks, no naming form visible
    expect(screen.queryByTestId('zone-name-input')).toBeNull()

    // Click a point — still in drawing mode
    fireEvent.click(canvas, { clientX: 100, clientY: 100, detail: 1 })
    fireEvent.click(canvas, { clientX: 200, clientY: 100, detail: 1 })

    // Still drawing — no naming form yet
    expect(screen.queryByTestId('zone-name-input')).toBeNull()
  })

  it('double_click_closes_polygon_after_3_points', () => {
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    // Add 3 points with detail:1 clicks
    fireEvent.click(canvas, { clientX: 100, clientY: 100, detail: 1 })
    fireEvent.click(canvas, { clientX: 300, clientY: 100, detail: 1 })
    fireEvent.click(canvas, { clientX: 200, clientY: 250, detail: 1 })

    // Double-click should close polygon → show naming form
    fireEvent.dblClick(canvas)

    expect(screen.getByTestId('zone-name-input')).toBeTruthy()
    expect(screen.getByTestId('zone-save-btn')).toBeTruthy()
  })

  it('double_click_ignored_with_fewer_than_3_points', () => {
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    fireEvent.click(canvas, { clientX: 100, clientY: 100, detail: 1 })
    fireEvent.click(canvas, { clientX: 200, clientY: 100, detail: 1 })

    // Double-click with only 2 points should NOT close
    fireEvent.dblClick(canvas)

    expect(screen.queryByTestId('zone-name-input')).toBeNull()
  })

  it('click_near_first_point_snaps_closed', () => {
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    // Place 3 points
    fireEvent.click(canvas, { clientX: 100, clientY: 100, detail: 1 })
    fireEvent.click(canvas, { clientX: 300, clientY: 100, detail: 1 })
    fireEvent.click(canvas, { clientX: 200, clientY: 250, detail: 1 })

    // Click within SNAP_RADIUS (15px) of first point → closes polygon
    fireEvent.click(canvas, { clientX: 107, clientY: 107, detail: 1 })

    expect(screen.getByTestId('zone-name-input')).toBeTruthy()
  })

  it('snap_does_not_trigger_with_fewer_than_3_points', () => {
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    // 2 points: click near first should just add a 3rd point, not close
    fireEvent.click(canvas, { clientX: 100, clientY: 100, detail: 1 })
    fireEvent.click(canvas, { clientX: 300, clientY: 100, detail: 1 })
    fireEvent.click(canvas, { clientX: 107, clientY: 107, detail: 1 }) // near first point, but only 2 prior

    // Not closed — no naming form
    expect(screen.queryByTestId('zone-name-input')).toBeNull()
  })

  it('shows_naming_form_when_polygon_closed', () => {
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    fireEvent.click(canvas, { clientX: 50, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 250, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 150, clientY: 200, detail: 1 })
    fireEvent.dblClick(canvas)

    const nameInput = screen.getByTestId('zone-name-input')
    expect(nameInput).toBeTruthy()

    const saveBtn = screen.getByTestId('zone-save-btn')
    expect(saveBtn).toBeTruthy()

    const resetBtn = screen.getByTestId('zone-reset-btn')
    expect(resetBtn).toBeTruthy()
  })

  it('save_shows_error_when_name_empty', async () => {
    const user = userEvent.setup()
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    fireEvent.click(canvas, { clientX: 50, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 250, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 150, clientY: 200, detail: 1 })
    fireEvent.dblClick(canvas)

    // Leave name empty, click save
    await user.click(screen.getByTestId('zone-save-btn'))

    expect(screen.getByTestId('zone-drawer-error')).toBeTruthy()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('save_posts_to_api_and_calls_onSaved', async () => {
    const mockOnSaved = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 42,
        zone_name: 'Entrance',
        polygon_image: [[50, 50], [250, 50], [150, 200]],
        color: '#3b82f6',
        action: 'created'
      })
    })

    const user = userEvent.setup()
    render(<ZoneDrawer onSaved={mockOnSaved} />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    fireEvent.click(canvas, { clientX: 50, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 250, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 150, clientY: 200, detail: 1 })
    fireEvent.dblClick(canvas)

    await user.type(screen.getByTestId('zone-name-input'), 'Entrance')
    await user.click(screen.getByTestId('zone-save-btn'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/zones/config', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }))
    })

    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.zone_name).toBe('Entrance')
    expect(body.polygon_image).toEqual([[50, 50], [250, 50], [150, 200]])
    expect(body.color).toBeTruthy()

    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalledWith(expect.objectContaining({ zone_name: 'Entrance' }))
    })
  })

  it('save_shows_error_on_api_failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'zone_name is required' })
    })

    const user = userEvent.setup()
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    fireEvent.click(canvas, { clientX: 50, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 250, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 150, clientY: 200, detail: 1 })
    fireEvent.dblClick(canvas)

    await user.type(screen.getByTestId('zone-name-input'), 'Test')
    await user.click(screen.getByTestId('zone-save-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('zone-drawer-error')).toBeTruthy()
    })
  })

  it('reset_returns_to_drawing_mode', () => {
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    fireEvent.click(canvas, { clientX: 50, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 250, clientY: 50, detail: 1 })
    fireEvent.click(canvas, { clientX: 150, clientY: 200, detail: 1 })
    fireEvent.dblClick(canvas)

    // In naming mode — reset should go back to drawing
    fireEvent.click(screen.getByTestId('zone-reset-btn'))

    expect(screen.queryByTestId('zone-name-input')).toBeNull()
  })

  it('second_click_of_double_click_does_not_add_point', () => {
    // detail:2 clicks should be ignored (they're the 2nd click of a double-click in real browser)
    render(<ZoneDrawer />)
    const canvas = screen.getByTestId('zone-drawer-canvas')
    mockBoundingRect(canvas)

    fireEvent.click(canvas, { clientX: 100, clientY: 100, detail: 1 })
    fireEvent.click(canvas, { clientX: 200, clientY: 100, detail: 2 }) // should be ignored

    // Should only have 1 point → naming form not visible even with dblclick
    // (dblclick requires >= 3 points)
    fireEvent.dblClick(canvas)
    expect(screen.queryByTestId('zone-name-input')).toBeNull()
  })
})
