interface RateLimitRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitRecord>()

interface RateLimitOptions {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(identifier: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const record = store.get(identifier)

  if (!record || now >= record.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + opts.windowMs })
    return { success: true, remaining: opts.limit - 1, resetAt: now + opts.windowMs }
  }

  if (record.count >= opts.limit) {
    return { success: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count++
  return { success: true, remaining: opts.limit - record.count, resetAt: record.resetAt }
}

export function getClientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers['x-forwarded-for']
  if (Array.isArray(forwarded)) return forwarded[0] ?? 'unknown'
  return (forwarded?.split(',')[0] ?? req.headers['x-real-ip'] ?? 'unknown') as string
}
