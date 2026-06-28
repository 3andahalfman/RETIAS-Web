import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { passwordResetRedirectUrl } from '@/lib/auth-password'
import { sanitizeEmail, parseJsonBody } from '@/lib/input-validation'
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
  if (!checkIpRateLimit(ip, 'auth-forgot-password')) {
    return rateLimitResponse(3600)
  }

  const body = await parseJsonBody<{ email?: unknown }>(req)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = sanitizeEmail(body.email)
  if (!email) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  const supabase = publicAuthClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectUrl(),
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return rateLimitResponse(3600)
    }
    console.error('[auth/forgot-password]', error.message)
  }

  // Always return success to avoid email enumeration
  return NextResponse.json({ success: true })
}
