import { NextResponse } from 'next/server'
import { requireAdmin, serviceRoleClient } from '@/lib/api-auth'

const SCREENSHOT_PATH_RE = /^[\w-]+\/[\w-]+\/\d+\.png$/

export async function GET(req: Request) {
  const gate = await requireAdmin(req)
  if ('response' in gate) return gate.response

  const path = new URL(req.url).searchParams.get('path')?.trim() ?? ''
  if (!SCREENSHOT_PATH_RE.test(path)) {
    return NextResponse.json({ error: 'Invalid screenshot path.' }, { status: 400 })
  }

  const admin = serviceRoleClient()
  const { data, error } = await admin.storage
    .from('online-test-screenshots')
    .createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not sign URL.' }, { status: 404 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
