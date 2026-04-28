/**
 * Gate 6.3 — ZoneConfig API integration tests.
 *
 * Verifies that ZoneConfig:
 *  1. Fetches zones from GET /api/zones/config on mount
 *  2. Renders API zones (not hardcoded INITIAL_ZONES)
 *  3. Re-fetches zones after ZoneDrawer saves a new zone
 *  4. Shows a loading indicator while fetching
 *  5. Shows an error state when the API call fails
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import ZoneConfig, { polygonToBBox } from './ZoneConfig'

// jsdom has no canvas — stub getContext
beforeEach(() => {
  const ctx = {
    clearRect: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(),
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    closePath: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
    fillText: vi.fn(), measureText: vi.fn(() => ({ width: 60 })),
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    font: '', textAlign: '', globalAlpha: 1,
  }
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx)
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ── helpers ────────────────────────────────────────────────────────────────

function makeApiZone(id, name, color = '#3182ce') {
  return {
    id,
    name,
    zone_name: name,
    color,
    capacity: 50,
    polygon_image: [[10, 10], [110, 10], [110, 110], [10, 110]],
    polygon_world: null,
  }
}

function mockFetch(zones) {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ zones }),
  })
}

function mockFetchError() {
  global.fetch.mockRejectedValue(new Error('Network error'))
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('ZoneConfig API integration (Gate 6.3)', () => {
  it('fetches zones from /api/zones/config on mount', async () => {
    mockFetch([])
    render(<ZoneConfig />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/zones/config')
      )
    })
  })

  it('renders zone names returned by the API', async () => {
    mockFetch([makeApiZone(1, 'Front Door'), makeApiZone(2, 'Back Counter')])
    render(<ZoneConfig />)

    await waitFor(() => {
      expect(screen.getByText('Front Door')).toBeTruthy()
      expect(screen.getByText('Back Counter')).toBeTruthy()
    })
  })

  it('does NOT render hardcoded INITIAL_ZONES names when API returns data', async () => {
    mockFetch([makeApiZone(1, 'My API Zone')])
    render(<ZoneConfig />)

    await waitFor(() => {
      expect(screen.queryByText('Main Entrance')).toBeNull()
      expect(screen.queryByText('Lobby')).toBeNull()
    })
  })

  it('shows loading indicator while fetching', async () => {
    // Never resolve — keeps fetch pending
    global.fetch.mockReturnValue(new Promise(() => {}))
    render(<ZoneConfig />)

    expect(screen.getByTestId('zones-loading')).toBeTruthy()
  })

  it('removes loading indicator after fetch completes', async () => {
    mockFetch([makeApiZone(1, 'Zone Alpha')])
    render(<ZoneConfig />)

    await waitFor(() => {
      expect(screen.queryByTestId('zones-loading')).toBeNull()
    })
  })

  it('shows error state when API call fails', async () => {
    mockFetchError()
    render(<ZoneConfig />)

    await waitFor(() => {
      expect(screen.getByTestId('zones-error')).toBeTruthy()
    })
  })

  it('shows empty state when API returns no zones', async () => {
    mockFetch([])
    render(<ZoneConfig />)

    await waitFor(() => {
      expect(screen.getByTestId('zones-empty')).toBeTruthy()
    })
  })

  it('re-fetches zones after ZoneDrawer onSaved fires', async () => {
    // First call returns 1 zone, second returns 2
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ zones: [makeApiZone(1, 'Zone One')] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ zones: [makeApiZone(1, 'Zone One'), makeApiZone(2, 'Zone Two')] }),
      })

    const { container } = render(<ZoneConfig />)

    await waitFor(() => {
      expect(screen.getByText('Zone One')).toBeTruthy()
    })

    // Simulate ZoneDrawer calling onSaved
    // ZoneDrawer is rendered inside a slide-in panel — find the trigger button
    // and fire onSaved via the component's internal state callback
    // We do this by directly invoking the prop via the component's test interface
    act(() => {
      // Find and call handleZoneDrawerSaved via the exposed data-testid hook
      const hook = container.querySelector('[data-testid="zone-drawer-saved-hook"]')
      if (hook) hook.click()
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('zone count header reflects API data', async () => {
    mockFetch([makeApiZone(1, 'A'), makeApiZone(2, 'B'), makeApiZone(3, 'C')])
    render(<ZoneConfig />)

    await waitFor(() => {
      expect(screen.getByText('Zones (3)')).toBeTruthy()
    })
  })
})

// ── Gate 7.2 — zone persistence round-trip (frontend side) ────────────────

describe('ZoneConfig zone persistence round-trip (Gate 7.2)', () => {
  it('polygonToBBox computes correct axis-aligned bbox from polygon_image', () => {
    // Rectangle polygon [10,20] → [300,480]. Width = 290, height = 460.
    const bbox = polygonToBBox([[10, 20], [300, 20], [300, 480], [10, 480]])
    expect(bbox).toEqual({ x: 10, y: 20, width: 290, height: 460 })
  })

  it('zone capacity from API is rendered in the zone card', async () => {
    const zone = makeApiZone(1, 'Capacity Zone')
    zone.capacity = 42
    mockFetch([zone])
    render(<ZoneConfig />)

    await waitFor(() => {
      // Card row: "Capacity: <span>42</span>" — plus total capacity sum is also 42.
      // Both are valid renderings of the persisted capacity.
      const matches = screen.getAllByText('42')
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })
})

// ── 3D Zone Editor integration — overlay open/close ──────────────────────

describe('ZoneConfig 3D editor overlay', () => {
  it('does not render the 3D editor by default', async () => {
    mockFetch([])
    render(<ZoneConfig />)
    await waitFor(() => expect(screen.getByTestId('open-3d-editor')).toBeTruthy())
    expect(screen.queryByTestId('zone-3d-loading')).toBeNull()
    expect(screen.queryByTestId('close-3d-editor')).toBeNull()
  })

  it('opens the 3D editor overlay when "Draw Zone (3D)" is clicked', async () => {
    mockFetch([])
    render(<ZoneConfig />)
    await waitFor(() => expect(screen.getByTestId('open-3d-editor')).toBeTruthy())

    act(() => { fireEvent.click(screen.getByTestId('open-3d-editor')) })

    // Suspense fallback shows while ZoneEditor3D's lazy chunk resolves;
    // the close button is rendered outside Suspense, so it appears immediately.
    expect(screen.getByTestId('close-3d-editor')).toBeTruthy()
  })

  it('closes the 3D editor when the close button is clicked', async () => {
    mockFetch([])
    render(<ZoneConfig />)
    await waitFor(() => expect(screen.getByTestId('open-3d-editor')).toBeTruthy())

    act(() => { fireEvent.click(screen.getByTestId('open-3d-editor')) })
    expect(screen.getByTestId('close-3d-editor')).toBeTruthy()

    act(() => { fireEvent.click(screen.getByTestId('close-3d-editor')) })
    expect(screen.queryByTestId('close-3d-editor')).toBeNull()
  })

  it('closes the 3D editor on Escape key', async () => {
    mockFetch([])
    render(<ZoneConfig />)
    await waitFor(() => expect(screen.getByTestId('open-3d-editor')).toBeTruthy())

    act(() => { fireEvent.click(screen.getByTestId('open-3d-editor')) })
    expect(screen.getByTestId('close-3d-editor')).toBeTruthy()

    act(() => { fireEvent.keyDown(window, { key: 'Escape' }) })
    expect(screen.queryByTestId('close-3d-editor')).toBeNull()
  })
})
