interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>()

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  'resume-scan':       { max: 10, windowMs: 60 * 60 * 1000 },
  'resume-optimize':   { max: 10, windowMs: 60 * 60 * 1000 },
  'extract-resume':    { max: 30, windowMs: 60 * 60 * 1000 },
  'auth-login':        { max: 10, windowMs: 15 * 60 * 1000 },
  'auth-forgot-password': { max: 5, windowMs: 60 * 60 * 1000 },
  'auth-register':       { max: 5, windowMs: 60 * 60 * 1000 },
  'check-username':      { max: 60, windowMs: 60 * 60 * 1000 },
}

function slidingWindow(key: string, route: string): boolean {
  const { max, windowMs } = LIMITS[route] ?? { max: 20, windowMs: 60 * 60 * 1000 }
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

/** Per authenticated user + route (existing resume APIs). */
export function checkRateLimit(userId: string, route: string): boolean {
  return slidingWindow(`${userId}:${route}`, route)
}

/** Per IP + route (auth and public endpoints). */
export function checkIpRateLimit(ip: string, route: string): boolean {
  return slidingWindow(`ip:${ip}:${route}`, route)
}

export function rateLimitResponse(retryAfterSec = 900) {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please wait and try again.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    },
  )
}
