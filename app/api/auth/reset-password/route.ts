import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { sanitizePassword, parseJsonBody } from '@/lib/input-validation'
import { validatePassword } from '@/lib/auth-password'

function authedClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  )
}

export async function POST(req: Request) {
  const user = await getApiUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Open the reset link from your email again.' }, { status: 401 })
  }

  const body = await parseJsonBody<{ password?: unknown }>(req)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const password = typeof body.password === 'string' ? body.password : null
  if (!password) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
  }

  const pwError = validatePassword(password)
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 })
  }

  const cleaned = sanitizePassword(password)
  if (!cleaned) {
    return NextResponse.json({ error: 'Password does not meet requirements.' }, { status: 400 })
  }

  const token = req.headers.get('authorization')!.slice(7).trim()
  const supabase = authedClient(token)
  const { error } = await supabase.auth.updateUser({ password: cleaned })

  if (error) {
    return NextResponse.json({ error: 'Could not update password.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
