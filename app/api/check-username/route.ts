import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sanitizeDisplayName } from '@/lib/input-validation'
import { checkIpRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request'

export async function GET(req: Request) {
  const ip = getClientIp(req)
  if (!checkIpRateLimit(ip, 'check-username')) {
    return rateLimitResponse(3600)
  }

  const raw = new URL(req.url).searchParams.get('name')
  const name = sanitizeDisplayName(raw)
  if (!name) {
    return NextResponse.json({ available: false })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('display_name', name)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
