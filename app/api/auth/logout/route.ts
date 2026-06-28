import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.startsWith('Bearer ')
    ? req.headers.get('authorization')!.slice(7).trim()
    : null

  if (token) {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    )
    await supabase.auth.signOut({ scope: 'global' })
  }

  await getApiUser(req).catch(() => null)

  return NextResponse.json({ success: true })
}
