import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LiveMonitorHeader from './LiveMonitorHeader'

describe('LiveMonitorHeader', () => {
  it('renders_without_crash', () => {
    render(<LiveMonitorHeader isLive={true} onToggleLive={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /live monitor/i })).toBeTruthy()
  })

  it('shows_camera_status', () => {
    const { rerender } = render(
      <LiveMonitorHeader isLive={true} onToggleLive={vi.fn()} />
    )
    expect(screen.getByText('LIVE')).toBeTruthy()

    rerender(<LiveMonitorHeader isLive={false} onToggleLive={vi.fn()} />)
    expect(screen.getByText('PAUSED')).toBeTruthy()
  })

  it('calls_onToggleLive_when_button_clicked', () => {
    const toggle = vi.fn()
    render(<LiveMonitorHeader isLive={true} onToggleLive={toggle} />)
    fireEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(toggle).toHaveBeenCalledOnce()
  })

  it('has_aria_label_on_toggle_button', () => {
    render(<LiveMonitorHeader isLive={true} onToggleLive={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /pause/i })
    expect(btn).toBeTruthy()
  })
})
