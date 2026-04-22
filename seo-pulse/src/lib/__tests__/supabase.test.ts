import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock must be hoisted before the import that triggers createClient
vi.mock('@supabase/supabase-js', () => {
  const signInWithPassword = vi.fn()
  const signUp = vi.fn()
  return {
    createClient: vi.fn(() => ({
      auth: {
        signInWithPassword,
        signUp,
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from: vi.fn().mockReturnThis(),
    })),
  }
})

import { signInWithEmail, signUpWithEmail } from '../supabase'
import { createClient } from '@supabase/supabase-js'

// Grab the mock auth instance
const mockAuth = (createClient as ReturnType<typeof vi.fn>).mock.results[0]?.value?.auth

describe('signInWithEmail', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns { user, session, error: null } on success', async () => {
    const fakeUser = { id: 'u1', email: 'test@example.com' }
    const fakeSession = { access_token: 'tok', refresh_token: 'ref' }
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    })

    const result = await signInWithEmail('test@example.com', 'pass123')

    expect(result.user).toEqual(fakeUser)
    expect(result.session).toEqual(fakeSession)
    expect(result.error).toBeNull()
  })

  it('returns { user: null, session: null, error } on failure', async () => {
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('Invalid credentials'),
    })

    const result = await signInWithEmail('bad@example.com', 'wrong')

    expect(result.user).toBeNull()
    expect(result.session).toBeNull()
    expect(result.error).toBe('Invalid credentials')
  })
})

describe('signUpWithEmail', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns { user, session, error: null } on success', async () => {
    const fakeUser = { id: 'u2', email: 'new@example.com' }
    const fakeSession = { access_token: 'tok2', refresh_token: 'ref2' }
    mockAuth.signUp.mockResolvedValueOnce({
      data: { user: fakeUser, session: fakeSession },
      error: null,
    })

    const result = await signUpWithEmail('new@example.com', 'pass456')

    expect(result.user).toEqual(fakeUser)
    expect(result.session).toEqual(fakeSession)
    expect(result.error).toBeNull()
  })

  it('returns { user: null, session: null, error } on failure', async () => {
    mockAuth.signUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('Email already in use'),
    })

    const result = await signUpWithEmail('dup@example.com', 'pass456')

    expect(result.user).toBeNull()
    expect(result.session).toBeNull()
    expect(result.error).toBe('Email already in use')
  })
})
