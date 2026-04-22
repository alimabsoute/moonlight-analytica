import type { VercelRequest, VercelResponse } from '@vercel/node'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? ''

const SCOPES: Record<string, string> = {
  gsc: 'https://www.googleapis.com/auth/webmasters.readonly',
  ga4: 'https://www.googleapis.com/auth/analytics.readonly',
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { provider, user_id } = req.query
  if (!provider || !SCOPES[String(provider)]) return res.status(400).json({ error: 'Invalid provider' })
  if (!CLIENT_ID || !REDIRECT_URI) return res.status(500).json({ error: 'Google OAuth not configured' })

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES[String(provider)])
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', JSON.stringify({ provider, user_id }))

  return res.redirect(302, url.toString())
}
