interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>()

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  'resume-scan':     { max: 10, windowMs: 60 * 60 * 1000 }, // 10 / hour
  'resume-optimize': { max: 10, windowMs: 60 * 60 * 1000 }, // 10 / hour
  'extract-resume':  { max: 30, windowMs: 60 * 60 * 1000 }, // 30 / hour
}

/**
 * Returns true if the request is allowed, false if rate-limited.
 * Uses an in-memory sliding window per userId+route.
 */
export function checkRateLimit(userId: string, route: string): boolean {
  const { max, windowMs } = LIMITS[route] ?? { max: 20, windowMs: 60 * 60 * 1000 }
  const key  = `${userId}:${route}`
  const now  = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}
