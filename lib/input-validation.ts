import { validatePassword } from '@/lib/auth-password'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function sanitizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase().slice(0, 254)
  if (!email || !EMAIL_RE.test(email)) return null
  return email
}

export function sanitizeDisplayName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw.trim().replace(/\s+/g, ' ').slice(0, 50)
  if (name.length < 2) return null
  if (!/^[\p{L}\p{N} _.-]+$/u.test(name)) return null
  return name
}

export function sanitizePassword(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const password = raw
  const err = validatePassword(password)
  if (err) return null
  if (password.length > 128) return null
  return password
}

export function sanitizePasswordForLogin(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const password = raw
  if (!password || password.length > 128) return null
  return password
}

export function sanitizeUuid(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const id = raw.trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null
  return id
}

export function sanitizeText(raw: unknown, maxLen: number): string | null {
  if (typeof raw !== 'string') return null
  const text = raw.trim().slice(0, maxLen)
  return text || null
}

export async function parseJsonBody<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const body = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null
    return body as T
  } catch {
    return null
  }
}
