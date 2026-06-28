import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sanitizeEmail, sanitizePasswordForLogin, parseJsonBody } from '@/lib/input-validation'
import { checkIpRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'

function publicAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  if (!checkIpRateLimit(ip, 'auth-login')) {
    return rateLimitResponse(900)
  }

  const body = await parseJsonBody<{ email?: unknown; password?: unknown }>(req)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = sanitizeEmail(body.email)
  const password = sanitizePasswordForLogin(body.password)
  if (!email || !password) {
    return NextResponse.json({ error: 'Valid email and password are required.' }, { status: 400 })
  }

  const supabase = publicAuthClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return rateLimitResponse(900)
    }
    return NextResponse.json({ error: 'Wrong email or password.' }, { status: 401 })
  }

  if (!data.session) {
    return NextResponse.json({ error: 'Sign-in failed.' }, { status: 401 })
  }

  return NextResponse.json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
    user: {
      id: data.user?.id,
      email: data.user?.email,
    },
  })
}
