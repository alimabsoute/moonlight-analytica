import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rateLimit, getClientIp } from '../_lib/rate-limit'

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN ?? ''
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD ?? ''
const BASE_URL = 'https://api.dataforseo.com/v3'

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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
    const { domain, type = 'overview' } = req.query

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Domain parameter is required' })
    }

    if (type === 'overview') {
      const response = await fetch(`${BASE_URL}/domain_analytics/whois/overview/live`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ target: domain }]),
      })

      if (!response.ok) {
        const error = await response.text()
        return res.status(response.status).json({ error })
      }

      const data = await response.json()
      const result = data.tasks?.[0]?.result?.[0] ?? {}

      return res.status(200).json({
        domain: result.domain ?? domain,
        organicTraffic: result.metrics?.organic?.count ?? 0,
        organicKeywords: result.metrics?.organic?.pos ?? 0,
        backlinks: result.backlinks_info?.backlinks ?? 0,
        referringDomains: result.backlinks_info?.referring_domains ?? 0,
        domainRank: result.domain_rank ?? 0,
      })
    }

    if (type === 'keywords') {
      const limit = parseInt(String(req.query.limit ?? '100'), 10)
      const response = await fetch(`${BASE_URL}/dataforseo_labs/google/ranked_keywords/live`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          target: domain,
          location_code: 2840,
          language_code: 'en',
          limit,
        }]),
      })

      if (!response.ok) {
        const error = await response.text()
        return res.status(response.status).json({ error })
      }

      const data = await response.json()
      const items = data.tasks?.[0]?.result?.[0]?.items ?? []

      const keywords = items.map((item: Record<string, Record<string, unknown>>) => ({
        keyword: item.keyword_data?.keyword ?? '',
        searchVolume: item.keyword_data?.keyword_info?.search_volume ?? 0,
        difficulty: item.keyword_data?.keyword_properties?.keyword_difficulty ?? 0,
        cpc: item.keyword_data?.keyword_info?.cpc ?? 0,
        competition: item.keyword_data?.keyword_info?.competition ?? 0,
        position: item.ranked_serp_element?.serp_item?.rank_group ?? 0,
      }))

      return res.status(200).json({ keywords })
    }

    return res.status(400).json({ error: 'Invalid type parameter' })
  } catch (error) {
    console.error('DataForSEO domain error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
