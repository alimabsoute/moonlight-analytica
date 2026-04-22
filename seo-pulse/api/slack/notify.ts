import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { webhook_url, message } = req.body as { webhook_url: string; message?: string }
  if (!webhook_url) return res.status(400).json({ error: 'webhook_url required' })

  const r = await fetch(webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message ?? '✅ Caposeo connected successfully! You\'ll receive SEO alerts here.' }),
  })

  if (!r.ok) return res.status(400).json({ error: 'Slack webhook failed', status: r.status })
  return res.status(200).json({ ok: true })
}
