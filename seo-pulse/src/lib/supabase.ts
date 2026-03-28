import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

/**
 * Get the current session, or null if not authenticated.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  } catch (err) {
    console.error('[supabase] getSession failed:', err)
    return null
  }
}

/**
 * Sign in with email + password.
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return { user: data.user, session: data.session, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed'
    return { user: null, session: null, error: message }
  }
}

/**
 * Create a new account with email + password.
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return { user: data.user, session: data.session, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign up failed'
    return { user: null, session: null, error: message }
  }
}

/**
 * Sign in with Google OAuth. Redirects the browser.
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    return { url: data.url, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google sign in failed'
    return { url: null, error: message }
  }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign out failed'
    return { error: message }
  }
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const { data } = supabase.auth.onAuthStateChange(callback)
  return data.subscription.unsubscribe
}
