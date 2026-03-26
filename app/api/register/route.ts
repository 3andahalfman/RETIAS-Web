import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service-role client — never exposed to the browser
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  try {
    const { email, password, displayName } = await req.json()

    if (!email?.trim() || !password || !displayName?.trim())
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })

    const supabase = adminClient()

    // 1. Check display name availability
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('display_name', displayName.trim())
      .maybeSingle()

    if (existing)
      return NextResponse.json({ error: 'That display name is already taken. Please choose another.' }, { status: 409 })

    // 2. Create the auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      user_metadata: { display_name: displayName.trim() },
      email_confirm: true,
    })

    if (authErr || !authData.user)
      return NextResponse.json({ error: authErr?.message ?? 'Failed to create account.' }, { status: 400 })

    // 3. Insert profile (atomic — if this fails the name wasn't reserved)
    const { error: profileErr } = await supabase
      .from('profiles')
      .insert({ id: authData.user.id, display_name: displayName.trim() })

    if (profileErr) {
      // Clean up the auth user so they can retry
      await supabase.auth.admin.deleteUser(authData.user.id)
      if (profileErr.code === '23505') // unique_violation
        return NextResponse.json({ error: 'That display name was just taken. Please choose another.' }, { status: 409 })
      return NextResponse.json({ error: 'Failed to create profile. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
