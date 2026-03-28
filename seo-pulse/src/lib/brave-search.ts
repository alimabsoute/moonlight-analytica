// ─── Types ───────────────────────────────────────────────────────────

export interface BraveSearchResult {
  title: string
  url: string
  description: string
  age: string
}

export interface BraveNewsResult {
  title: string
  url: string
  description: string
  source: string
  age: string
}

interface BraveWebResponse {
  results: BraveSearchResult[]
}

interface BraveNewsResponse {
  results: BraveNewsResult[]
}

// ─── Web Search ──────────────────────────────────────────────────────

/**
 * Search the web via Brave Search backend proxy.
 */
export async function webSearch(query: string, count = 10): Promise<BraveSearchResult[]> {
  try {
    const params = new URLSearchParams({ q: query, count: String(count) })
    const res = await fetch(`/api/brave/web?${params.toString()}`)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Brave web search failed (${res.status})`)
    }

    const data = (await res.json()) as BraveWebResponse
    return data.results
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Web search failed'
    console.error('[brave] webSearch:', message)
    throw new Error(message)
  }
}

// ─── News Search ─────────────────────────────────────────────────────

/**
 * Search news via Brave Search backend proxy.
 */
export async function newsSearch(query: string, count = 10): Promise<BraveNewsResult[]> {
  try {
    const params = new URLSearchParams({ q: query, count: String(count) })
    const res = await fetch(`/api/brave/news?${params.toString()}`)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Brave news search failed (${res.status})`)
    }

    const data = (await res.json()) as BraveNewsResponse
    return data.results
  } catch (err) {
    const message = err instanceof Error ? err.message : 'News search failed'
    console.error('[brave] newsSearch:', message)
    throw new Error(message)
  }
}

// ─── People Also Ask ─────────────────────────────────────────────────

/**
 * Search for a query and extract "People Also Ask" questions.
 * Falls back to an empty array if PAA data is unavailable.
 */
export async function extractPAA(query: string): Promise<string[]> {
  try {
    const params = new URLSearchParams({ q: query })
    const res = await fetch(`/api/brave/paa?${params.toString()}`)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Brave PAA extraction failed (${res.status})`)
    }

    const data = (await res.json()) as { questions: string[] }
    return data.questions
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PAA extraction failed'
    console.error('[brave] extractPAA:', message)
    return []
  }
}
