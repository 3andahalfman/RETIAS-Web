/** Canonical site URL for auth email redirects (confirmation, password reset). */
export function getSiteUrl(request?: Request): string {
  if (typeof window !== 'undefined' && !request) {
    return window.location.origin.replace(/\/$/, '')
  }
  if (request) {
    const origin = request.headers.get('origin')
    if (origin) return origin.replace(/\/$/, '')
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://www.retiasai.com'
}

export function authCallbackUrl(request?: Request, next = '/dashboard'): string {
  return `${getSiteUrl(request)}/auth/callback?next=${encodeURIComponent(next)}`
}
