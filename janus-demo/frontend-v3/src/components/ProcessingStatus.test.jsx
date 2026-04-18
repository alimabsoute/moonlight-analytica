/**
 * Gate 8.1 — ProcessingStatus component tests.
 *
 * ProcessingStatus polls /api/process-status/<videoId> every 2 s.
 * Uses vi.useFakeTimers() + act(advanceTimersByTimeAsync) instead of
 * waitFor — RTL's waitFor polls via setTimeout which stalls under fake
 * timers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ProcessingStatus from './ProcessingStatus'

function mockFetchOnce(response) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => response,
  })
}

function mockFetchReject(msg = 'Network error') {
  global.fetch = vi.fn().mockRejectedValueOnce(new Error(msg))
}

async function tickInterval() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2001)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('ProcessingStatus', () => {
  it('renders nothing when no videoId is provided', () => {
    const { container } = render(<ProcessingStatus />)
    // No videoId → not_started state → null
    expect(container.firstChild).toBeNull()
  })

  it('polls /api/process-status/<videoId> when videoId is given', async () => {
    mockFetchOnce({ status: 'processing', percent: 30, frame: 30, total: 100 })

    render(<ProcessingStatus videoId="test-video-id" />)
    await tickInterval()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/process-status/test-video-id')
    )
  })

  it('shows progress UI while status is processing', async () => {
    mockFetchOnce({ status: 'processing', percent: 65, frame: 65, total: 100 })

    render(<ProcessingStatus videoId="vid-abc" />)
    await tickInterval()

    expect(screen.getByText('65%')).toBeTruthy()
    expect(screen.getByText('65 / 100 frames')).toBeTruthy()
  })

  it('shows completed state and fires onComplete when status is completed', async () => {
    const onComplete = vi.fn()
    mockFetchOnce({ status: 'completed', percent: 100, frame: 100, total: 100 })

    render(<ProcessingStatus videoId="vid-done" onComplete={onComplete} />)
    await tickInterval()

    expect(screen.getByText(/Processing complete/i)).toBeTruthy()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('shows error message when fetch fails', async () => {
    mockFetchReject('connection refused')

    render(<ProcessingStatus videoId="vid-err" />)
    await tickInterval()

    expect(screen.getByText('Cannot reach backend')).toBeTruthy()
  })
})
