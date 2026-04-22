import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rateLimit, getClientIp } from '../_lib/rate-limit'

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN ?? ''
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD ?? ''
const BASE_URL = 'https://api.dataforseo.com/v3'

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req)
  const limit = rateLimit(`dataforseo:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!limit.success) {
    return res.status(429).json({ error: 'Rate limit exceeded.' })
  }

  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    return res.status(500).json({ error: 'DataForSEO credentials not configured' })
  }

  try {
    const { keywords, location = 2840 } = req.body

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Keywords array is required' })
    }

    const response = await fetch(`${BASE_URL}/keywords_data/google_ads/search_volume/live`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        keywords,
        location_code: location,
        language_code: 'en',
      }]),
    })

    if (!response.ok) {
      const error = await response.text()
      return res.status(response.status).json({ error })
    }

    const data = await response.json()
    const results = data.tasks?.[0]?.result ?? []

    const formatted = results.map((r: Record<string, unknown>) => ({
      keyword: r.keyword,
      searchVolume: r.search_volume ?? 0,
      difficulty: (r as Record<string, unknown>).keyword_difficulty ?? 0,
      cpc: r.cpc ?? 0,
      competition: r.competition ?? 0,
      trend: ((r.monthly_searches ?? []) as Array<{ search_volume: number }>).map(
        (m) => m.search_volume
      ),
      serpFeatures: [],
    }))

    return res.status(200).json({ keywords: formatted })
  } catch (error) {
    console.error('DataForSEO keywords error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
