// ─── Types ───────────────────────────────────────────────────────────

export interface KeywordData {
  keyword: string
  searchVolume: number
  difficulty: number
  cpc: number
  competition: number
  trend: number[]
  serpFeatures: string[]
}

export interface DomainData {
  domain: string
  organicTraffic: number
  organicKeywords: number
  backlinks: number
  referringDomains: number
  domainRank: number
}

export interface BacklinkData {
  sourceUrl: string
  targetUrl: string
  anchor: string
  domainRank: number
  firstSeen: string
  lastSeen: string
}

export interface SerpResult {
  position: number
  url: string
  title: string
  description: string
  domain: string
  features: string[]
}

interface SerpResponse {
  keyword: string
  totalResults: number
  results: SerpResult[]
  features: string[]
}

// ─── Keyword Data ────────────────────────────────────────────────────

/**
 * Get keyword metrics for one or more keywords.
 * Optional location code (default: US — 2840).
 */
export async function getKeywordData(
  keywords: string[],
  location = '2840',
): Promise<KeywordData[]> {
  try {
    const res = await fetch('/api/dataforseo/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, location }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Keyword data fetch failed (${res.status})`)
    }

    const data = (await res.json()) as { results: KeywordData[] }
    return data.results
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch keyword data'
    console.error('[dataforseo] getKeywordData:', message)
    throw new Error(message)
  }
}

// ─── Domain Overview ─────────────────────────────────────────────────

/**
 * Get an overview of domain SEO metrics.
 */
export async function getDomainOverview(domain: string): Promise<DomainData> {
  try {
    const params = new URLSearchParams({ domain })
    const res = await fetch(`/api/dataforseo/domain/overview?${params.toString()}`)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Domain overview failed (${res.status})`)
    }

    const data = (await res.json()) as DomainData
    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch domain overview'
    console.error('[dataforseo] getDomainOverview:', message)
    throw new Error(message)
  }
}

// ─── Domain Keywords ─────────────────────────────────────────────────

/**
 * Get keywords that a domain ranks for.
 */
export async function getDomainKeywords(
  domain: string,
  limit = 100,
): Promise<KeywordData[]> {
  try {
    const params = new URLSearchParams({ domain, limit: String(limit) })
    const res = await fetch(`/api/dataforseo/domain/keywords?${params.toString()}`)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Domain keywords failed (${res.status})`)
    }

    const data = (await res.json()) as { results: KeywordData[] }
    return data.results
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch domain keywords'
    console.error('[dataforseo] getDomainKeywords:', message)
    throw new Error(message)
  }
}

// ─── Backlinks ───────────────────────────────────────────────────────

/**
 * Get backlinks pointing to a domain.
 */
export async function getBacklinks(
  domain: string,
  limit = 100,
): Promise<BacklinkData[]> {
  try {
    const params = new URLSearchParams({ domain, limit: String(limit) })
    const res = await fetch(`/api/dataforseo/backlinks?${params.toString()}`)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Backlinks fetch failed (${res.status})`)
    }

    const data = (await res.json()) as { results: BacklinkData[] }
    return data.results
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch backlinks'
    console.error('[dataforseo] getBacklinks:', message)
    throw new Error(message)
  }
}

// ─── SERP Results ────────────────────────────────────────────────────

/**
 * Get SERP analysis for a keyword.
 */
export async function getSerpResults(keyword: string): Promise<SerpResponse> {
  try {
    const params = new URLSearchParams({ keyword })
    const res = await fetch(`/api/dataforseo/serp?${params.toString()}`)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `SERP analysis failed (${res.status})`)
    }

    const data = (await res.json()) as SerpResponse
    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch SERP results'
    console.error('[dataforseo] getSerpResults:', message)
    throw new Error(message)
  }
}
