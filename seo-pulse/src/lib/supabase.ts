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

export async function fetchUserProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => ({
    id: row.id as string,
    name: row.name as string,
    domain: row.domain as string,
    competitors: (row.competitors ?? []) as string[],
    trackedKeywords: (row.tracked_keywords ?? []) as string[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }))
}

export async function persistProject(project: { name: string; domain: string; competitors: string[]; trackedKeywords: string[] }, userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: project.name,
      domain: project.domain,
      competitors: project.competitors,
      tracked_keywords: project.trackedKeywords,
    })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id as string,
    name: data.name as string,
    domain: data.domain as string,
    competitors: (data.competitors ?? []) as string[],
    trackedKeywords: (data.tracked_keywords ?? []) as string[],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw error
}

export async function fetchIntegrations(userId: string) {
  const { data, error } = await supabase
    .from('integrations')
    .select('provider, expires_at, config, updated_at')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []) as { provider: string; expires_at: string | null; config: Record<string, unknown>; updated_at: string }[]
}

export async function saveSlackWebhook(userId: string, webhookUrl: string) {
  const { error } = await supabase
    .from('integrations')
    .upsert({ user_id: userId, provider: 'slack', config: { webhook_url: webhookUrl }, updated_at: new Date().toISOString() }, { onConflict: 'user_id,provider' })
  if (error) throw error
}

export async function disconnectIntegration(userId: string, provider: string) {
  const { error } = await supabase.from('integrations').delete().eq('user_id', userId).eq('provider', provider)
  if (error) throw error
}

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase.from('user_profiles').select('plan, stripe_customer_id, subscription_status').eq('id', userId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data as { plan: 'free' | 'pro' | 'business'; stripe_customer_id: string | null; subscription_status: string } | null
}

export async function fetchApiKeys(userId: string) {
  const { data, error } = await supabase.from('api_keys').select('id, name, key_prefix, created_at, last_used_at').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null }[]
}

export async function createApiKey(userId: string, name: string) {
  const raw = `sp_live_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`
  const prefix = raw.slice(0, 12)
  // Simple hash (not cryptographic — for display purposes only)
  const encoder = new TextEncoder()
  const data = encoder.encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64)

  const { error } = await supabase.from('api_keys').insert({ user_id: userId, name, key_hash: keyHash, key_prefix: prefix })
  if (error) throw error
  return raw // return raw key ONCE for user to copy
}

export async function deleteApiKey(keyId: string) {
  const { error } = await supabase.from('api_keys').delete().eq('id', keyId)
  if (error) throw error
}
