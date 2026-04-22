import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rateLimit, getClientIp } from '../_lib/rate-limit'

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY ?? ''
const BRAVE_NEWS_URL = 'https://api.search.brave.com/res/v1/news/search'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req)
  const limit = rateLimit(`brave:${ip}`, { limit: 60, windowMs: 60_000 })
  if (!limit.success) {
    return res.status(429).json({ error: 'Rate limit exceeded.' })
  }

  if (!BRAVE_API_KEY) {
    return res.status(500).json({ error: 'BRAVE_SEARCH_API_KEY not configured' })
  }

  try {
    const { q, count = '10' } = req.query
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' })
    }

    const url = new URL(BRAVE_NEWS_URL)
    url.searchParams.set('q', q)
    url.searchParams.set('count', String(count))

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return res.status(response.status).json({ error })
    }

    const data = await response.json()
    const results = (data.results ?? []).map((r: Record<string, unknown>) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      source: (r.meta_url as Record<string, unknown>)?.hostname ?? '',
      age: r.age,
    }))

    return res.status(200).json({ results })
  } catch (error) {
    console.error('Brave News error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
