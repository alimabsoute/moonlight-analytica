/**
 * Gate 7.3 tests — PreProcessedPlayer.
 *
 * Coverage:
 *   - findFrameByIndex binary search: exact match, closest fallback, empty array
 *   - Video library fetch on mount
 *   - Video picker renders when no video selected
 *   - Tracking-data fetch triggered when selected video has status=completed
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import PreProcessedPlayer, { findFrameByIndex } from './PreProcessedPlayer'

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

  // Silence RAF so renderOverlay doesn't spin during tests
  global.requestAnimationFrame = vi.fn((cb) => { cb(0); return 1 })
  global.cancelAnimationFrame = vi.fn()

  // HTMLMediaElement has no default implementation in jsdom
  window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
  window.HTMLMediaElement.prototype.pause = vi.fn()

  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mockLibrary(videos) {
  return { ok: true, json: async () => ({ videos }) }
}

function mockStatus(payload) {
  return { ok: true, json: async () => payload }
}

function mockTracking(payload) {
  return { ok: true, json: async () => payload }
}

// ── findFrameByIndex (pure function) ───────────────────────────────────────

describe('findFrameByIndex binary search (Gate 7.3)', () => {
  it('returns the exact frame when index is present', () => {
    const frames = [
      { frame: 0, detections: [] },
      { frame: 1, detections: [{ id: 1, bbox: [10, 20, 50, 80] }] },
      { frame: 2, detections: [] },
    ]
    const result = findFrameByIndex(frames, 1)
    expect(result).toBe(frames[1])
    expect(result.detections[0].bbox).toEqual([10, 20, 50, 80])
  })

  it('returns the closest later frame when exact index not present', () => {
    const frames = [
      { frame: 0, detections: [] },
      { frame: 5, detections: [{ id: 1, bbox: [0, 0, 10, 10] }] },
      { frame: 10, detections: [] },
    ]
    // Looking for frame 3 — no exact match. Binary search should land
    // with lo=1 (past frame 0), returning frames[1] as closest.
    const result = findFrameByIndex(frames, 3)
    expect(result).toBe(frames[1])
  })

  it('clamps to last frame when index is past the end', () => {
    const frames = [
      { frame: 0, detections: [] },
      { frame: 10, detections: [] },
      { frame: 20, detections: [{ id: 9, bbox: [1, 2, 3, 4] }] },
    ]
    const result = findFrameByIndex(frames, 999)
    expect(result).toBe(frames[2])
  })

  it('returns null for an empty frames array', () => {
    expect(findFrameByIndex([], 5)).toBeNull()
    expect(findFrameByIndex(null, 5)).toBeNull()
    expect(findFrameByIndex(undefined, 5)).toBeNull()
  })
})

// ── Component integration ──────────────────────────────────────────────────

describe('PreProcessedPlayer component (Gate 7.3)', () => {
  it('fetches video library from /video/library on mount', async () => {
    global.fetch.mockResolvedValueOnce(mockLibrary([]))
    render(<PreProcessedPlayer />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/video/library')
      )
    })
  })

  it('renders video picker with library entries', async () => {
    const videos = [
      { id: 'vid-abc-123', name: 'Lobby Camera 1', original_filename: 'lobby1.mp4' },
      { id: 'vid-def-456', name: 'Entrance Cam', original_filename: 'entrance.mp4' },
    ]
    global.fetch.mockResolvedValueOnce(mockLibrary(videos))
    render(<PreProcessedPlayer />)

    await waitFor(() => {
      expect(screen.getByText('Lobby Camera 1')).toBeTruthy()
      expect(screen.getByText('Entrance Cam')).toBeTruthy()
    })
  })

  it('shows empty-library message when no videos', async () => {
    global.fetch.mockResolvedValueOnce(mockLibrary([]))
    render(<PreProcessedPlayer />)

    await waitFor(() => {
      expect(screen.getByText(/No videos in library/i)).toBeTruthy()
    })
  })

  it('fetches /api/tracking-data/<id> when selected video has status=completed', async () => {
    const videos = [{ id: 'abc-123', name: 'Clip 1', original_filename: 'c1.mp4' }]
    global.fetch
      .mockResolvedValueOnce(mockLibrary(videos))
      .mockResolvedValueOnce(mockStatus({ status: 'completed', percent: 100 }))
      .mockResolvedValueOnce(mockTracking({
        video_id: 'abc-123',
        total_frames: 3,
        fps: 30,
        frames: [{ frame: 0, detections: [] }],
        metrics: {},
      }))

    render(<PreProcessedPlayer />)

    // Wait for library to render
    const clipButton = await screen.findByText('Clip 1')
    fireEvent.click(clipButton)

    await waitFor(() => {
      const urls = global.fetch.mock.calls.map(c => c[0])
      expect(urls.some(u => u.includes('/api/process-status/abc-123'))).toBe(true)
      expect(urls.some(u => u.includes('/api/tracking-data/abc-123'))).toBe(true)
    })
  })
})
