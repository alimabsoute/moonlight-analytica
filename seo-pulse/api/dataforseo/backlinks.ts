import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rateLimit, getClientIp } from '../_lib/rate-limit'

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN ?? ''
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD ?? ''
const BASE_URL = 'https://api.dataforseo.com/v3'

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ip = getClientIp(req)
  const limit = rateLimit(`dataforseo:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!limit.success) return res.status(429).json({ error: 'Rate limit exceeded.' })

  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD)
    return res.status(500).json({ error: 'DataForSEO credentials not configured' })

  try {
    const { domain, limit = '50' } = req.query
    if (!domain || typeof domain !== 'string')
      return res.status(400).json({ error: 'domain required' })

    const response = await fetch(`${BASE_URL}/backlinks/domain_pages/live`, {
      method: 'POST',
      headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify([{ target: domain, limit: parseInt(String(limit), 10) }]),
    })

    if (!response.ok) return res.status(response.status).json({ error: await response.text() })

    const data = await response.json()
    const items = data.tasks?.[0]?.result ?? []

    return res.status(200).json({
      results: items.map((item: Record<string, unknown>) => ({
        sourceUrl: item.url ?? '',
        targetUrl: item.target ?? domain,
        anchor: item.anchor ?? '',
        domainRank: item.domain_from_rank ?? 0,
        firstSeen: item.first_seen ?? '',
        lastSeen: item.last_seen ?? '',
      })),
    })
  } catch (error) {
    console.error('DataForSEO backlinks error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
