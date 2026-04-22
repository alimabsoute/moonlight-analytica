import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../auth'

// Helper: get store state directly (outside React)
const getState = () => useAuthStore.getState()

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      session: null,
      loading: false,
      initialized: false,
    })
  })

  it('has correct initial state', () => {
    const state = getState()
    expect(state.user).toBeNull()
    expect(state.session).toBeNull()
    expect(state.initialized).toBe(false)
  })

  it('setUser mutates user correctly', () => {
    const fakeUser = {
      id: 'u1',
      email: 'test@example.com',
      fullName: 'Test User',
      avatarUrl: null,
      plan: 'free' as const,
      createdAt: '2024-01-01',
    }

    getState().setUser(fakeUser)

    expect(getState().user).toEqual(fakeUser)
  })

  it('logout clears user and session', () => {
    // Pre-populate state
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@b.com', fullName: 'A', avatarUrl: null, plan: 'pro', createdAt: '2024-01-01' },
      session: { access_token: 'tok', refresh_token: 'ref' },
      loading: false,
      initialized: true,
    })

    getState().logout()

    expect(getState().user).toBeNull()
    expect(getState().session).toBeNull()
  })

  it('initialize() flips initialized to true', () => {
    expect(getState().initialized).toBe(false)

    getState().initialize()

    expect(getState().initialized).toBe(true)
  })
})
