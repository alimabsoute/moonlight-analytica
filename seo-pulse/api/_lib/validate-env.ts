import type { VercelResponse } from '@vercel/node'

export function requireEnv(res: VercelResponse, vars: string[]): boolean {
  const missing = vars.filter(v => !process.env[v])
  if (missing.length > 0) {
    res.status(500).json({
      error: `Server misconfiguration: missing env vars: ${missing.join(', ')}`,
      hint: 'See .env.example for required configuration',
    })
    return false
  }
  return true
}
