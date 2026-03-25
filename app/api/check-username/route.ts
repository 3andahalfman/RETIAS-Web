import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('name')?.trim()
  if (!name || name.length < 2)
    return NextResponse.json({ available: false })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('display_name', name)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
