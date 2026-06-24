import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { authCallbackUrl } from '@/lib/site-url'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function publicAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function POST(req: Request) {
  try {
    const { email, password, displayName } = await req.json()

    if (!email?.trim() || !password || !displayName?.trim())
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })

    const supabase = adminClient()

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('display_name', displayName.trim())
      .maybeSingle()

    if (existing)
      return NextResponse.json({ error: 'That display name is already taken. Please choose another.' }, { status: 409 })

    // signUp sends the confirmation email when mailer_autoconfirm is off in Supabase
    const { data: signUpData, error: signUpErr } = await publicAuthClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: authCallbackUrl(req),
      },
    })

    if (signUpErr)
      return NextResponse.json({ error: signUpErr.message ?? 'Failed to create account.' }, { status: 400 })

    if (!signUpData.user)
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 400 })

    const { error: profileErr } = await supabase
      .from('profiles')
      .insert({ id: signUpData.user.id, display_name: displayName.trim() })

    if (profileErr) {
      await supabase.auth.admin.deleteUser(signUpData.user.id)
      if (profileErr.code === '23505')
        return NextResponse.json({ error: 'That display name was just taken. Please choose another.' }, { status: 409 })
      return NextResponse.json({ error: 'Failed to create profile. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, needsEmailConfirmation: true })
  } catch (err: unknown) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
