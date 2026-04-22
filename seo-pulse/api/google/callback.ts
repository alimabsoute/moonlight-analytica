import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query
  if (error) return res.redirect(302, `/settings?integration_error=${error}`)
  if (!code || !state) return res.redirect(302, '/settings?integration_error=missing_params')

  let parsed: { provider: string; user_id: string }
  try { parsed = JSON.parse(String(state)) } catch { return res.redirect(302, '/settings?integration_error=invalid_state') }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: String(code), client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT_URI, grant_type: 'authorization_code' }),
  })
  if (!tokenRes.ok) return res.redirect(302, '/settings?integration_error=token_exchange_failed')

  const tokens = await tokenRes.json()

  // Store in Supabase using service role key (bypasses RLS for server-side write)
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    await supabase.from('integrations').upsert({
      user_id: parsed.user_id,
      provider: parsed.provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' })
  }

  return res.redirect(302, `/settings?integration_success=${parsed.provider}`)
}
