// ─── Types ───────────────────────────────────────────────────────────

export type ClaudeModel = 'haiku' | 'sonnet'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClaudeChatOptions {
  model?: ClaudeModel
  maxTokens?: number
  system?: string
}

interface ClaudeChatResponse {
  text: string
  model: string
  usage: { input_tokens: number; output_tokens: number }
}

// ─── Core API ────────────────────────────────────────────────────────

/**
 * Send a chat request to the Claude backend proxy.
 * Returns the full response text.
 */
export async function claudeChat(
  messages: ClaudeMessage[],
  opts: ClaudeChatOptions = {},
): Promise<string> {
  try {
    const res = await fetch('/api/claude/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: opts.model ?? 'haiku',
        max_tokens: opts.maxTokens ?? 4096,
        system: opts.system,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Claude chat failed (${res.status})`)
    }

    const data = (await res.json()) as ClaudeChatResponse
    return data.text
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Claude chat request failed'
    console.error('[claude] claudeChat:', message)
    throw new Error(message)
  }
}

/**
 * Stream a chat response from the Claude backend proxy via SSE.
 * Calls `onChunk` for each text delta. Returns the full concatenated text.
 */
export async function claudeStream(
  messages: ClaudeMessage[],
  opts: ClaudeChatOptions = {},
  onChunk: (text: string) => void,
): Promise<string> {
  try {
    const res = await fetch('/api/claude/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: opts.model ?? 'haiku',
        max_tokens: opts.maxTokens ?? 4096,
        system: opts.system,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? `Claude stream failed (${res.status})`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('Response body is not readable')

    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Parse SSE lines
      const lines = buffer.split('\n')
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim()

          if (payload === '[DONE]') continue

          try {
            const event = JSON.parse(payload) as { type: string; text?: string }
            if (event.type === 'content_block_delta' && event.text) {
              fullText += event.text
              onChunk(event.text)
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }

    return fullText
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Claude stream request failed'
    console.error('[claude] claudeStream:', message)
    throw new Error(message)
  }
}

// ─── SEO Helpers ─────────────────────────────────────────────────────

/**
 * Quick SEO analysis for a given URL + keyword using Haiku.
 */
export async function analyzeSEO(url: string, keyword: string): Promise<string> {
  const system = `You are an expert SEO analyst. Analyze the given URL for the target keyword and provide actionable recommendations. Be specific and data-driven. Format your response in clear sections: Title & Meta Analysis, Content Analysis, Technical Issues, Quick Wins, and Overall Score (1-100).`

  return claudeChat(
    [
      {
        role: 'user',
        content: `Analyze the SEO performance of this URL for the target keyword.\n\nURL: ${url}\nTarget Keyword: "${keyword}"\n\nProvide a comprehensive but concise SEO analysis.`,
      },
    ],
    {
      model: 'haiku',
      maxTokens: 2048,
      system,
    },
  )
}

/**
 * Generate an in-depth content brief for a keyword using Sonnet.
 */
export async function generateContentBrief(keyword: string, intent: string): Promise<string> {
  const system = `You are a senior SEO content strategist. Generate detailed, publication-ready content briefs that help writers create top-ranking content. Include specific data points, competitor insights, and structural recommendations.`

  return claudeChat(
    [
      {
        role: 'user',
        content: `Create a comprehensive content brief for the following:\n\nTarget Keyword: "${keyword}"\nSearch Intent: ${intent}\n\nInclude:\n1. Recommended title options (5 variations)\n2. Meta description (2 options)\n3. Suggested word count range\n4. Content outline with H2/H3 headings\n5. Key topics and subtopics to cover\n6. Related keywords to include naturally\n7. Internal linking opportunities\n8. Featured snippet optimization tips\n9. Recommended media (images, videos, infographics)\n10. Competitor content gaps to exploit`,
      },
    ],
    {
      model: 'sonnet',
      maxTokens: 4096,
      system,
    },
  )
}
