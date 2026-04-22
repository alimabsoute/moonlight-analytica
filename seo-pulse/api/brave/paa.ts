import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rateLimit, getClientIp } from '../_lib/rate-limit'

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY ?? ''
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

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
    const { q } = req.query
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' })
    }

    const url = new URL(BRAVE_API_URL)
    url.searchParams.set('q', q)
    url.searchParams.set('count', '5')
    url.searchParams.set('result_filter', 'faq')

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
    const questions: string[] = []

    // Extract from FAQ results
    if (data.faq?.results) {
      for (const faq of data.faq.results) {
        if (faq.question) questions.push(faq.question)
      }
    }

    // Also try extracting from web result snippets containing question patterns
    if (data.web?.results) {
      for (const result of data.web.results) {
        const desc = result.description ?? ''
        const matches = desc.match(/(?:^|\.\s+)([A-Z][^.?]*\?)/g)
        if (matches) {
          questions.push(...matches.map((m: string) => m.replace(/^\.\s+/, '').trim()))
        }
      }
    }

    const unique = [...new Set(questions)].slice(0, 10)
    return res.status(200).json({ questions: unique })
  } catch (error) {
    console.error('Brave PAA error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
