import type { VercelRequest, VercelResponse } from '@vercel/node'
import { rateLimit, getClientIp } from '../_lib/rate-limit'
import { requireEnv } from '../_lib/validate-env'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY ?? ''

const MODEL_MAP: Record<string, string> = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250514',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req)
  const limit = rateLimit(`claude:${ip}`, { limit: 20, windowMs: 60_000 })
  if (!limit.success) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a moment.', resetAt: limit.resetAt })
  }

  if (!requireEnv(res, ['CLAUDE_API_KEY'])) return

  try {
    const { messages, model = 'haiku', maxTokens = 2048, system } = req.body

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL_MAP[model] ?? MODEL_MAP.haiku,
        max_tokens: maxTokens,
        system: system ?? undefined,
        messages,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return res.status(response.status).json({ error })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    return res.status(200).json({ text, usage: data.usage })
  } catch (error) {
    console.error('Claude API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
