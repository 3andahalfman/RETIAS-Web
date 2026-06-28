import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin'
import type { User } from '@supabase/supabase-js'

function anonClient(accessToken?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    },
  )
}

function bearerToken(req?: Request): string | null {
  if (!req) return null
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token || null
}

/** Returns the authenticated user from Bearer token (localStorage session) or cookies. */
export async function getApiUser(req?: Request): Promise<User | null> {
  const token = bearerToken(req)
  if (token) {
    const supabase = anonClient(token)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) return user
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAdmin(req: Request): Promise<
  { user: User } | { response: NextResponse }
> {
  const user = await getApiUser(req)
  if (!user) {
    return { response: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) }
  }
  if (!isAdminEmail(user.email)) {
    return { response: NextResponse.json({ error: 'Admin only.' }, { status: 403 }) }
  }
  return { user }
}

export function serviceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
