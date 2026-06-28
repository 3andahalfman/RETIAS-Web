import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { isAdminEmail } from '@/lib/admin'

export interface BillingRow {
  user_id: string
  email: string
  plan: string
  status: string
  renewal_date: string | null
  updated_at: string
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function tierLabel(tier: string | null): string {
  if (tier === 'plus') return 'Premium Plus'
  if (tier === 'pro') return 'Premium'
  return 'Unknown'
}

export async function GET(req: Request) {
  const user = await getApiUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Admin only.' }, { status: 403 })
  }

  const admin = adminClient()
  const { data: subs, error } = await admin
    .from('subscriptions')
    .select('user_id, tier, status, current_period_end, updated_at')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows: BillingRow[] = []
  for (const sub of subs ?? []) {
    const { data: userData } = await admin.auth.admin.getUserById(sub.user_id)
    rows.push({
      user_id: sub.user_id,
      email: userData.user?.email ?? '—',
      plan: tierLabel(sub.tier),
      status: sub.status,
      renewal_date: sub.current_period_end,
      updated_at: sub.updated_at,
    })
  }

  return NextResponse.json({ rows })
}
