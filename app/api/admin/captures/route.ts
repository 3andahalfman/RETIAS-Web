import { NextResponse } from 'next/server'
import { requireAdmin, serviceRoleClient } from '@/lib/api-auth'
import { parseJsonBody, sanitizeUuid, sanitizeText } from '@/lib/input-validation'

const SCREENSHOT_PATH_RE = /^[\w-]+\/[\w-]+\/\d+\.png$/

export async function GET(req: Request) {
  const gate = await requireAdmin(req)
  if ('response' in gate) return gate.response

  const admin = serviceRoleClient()
  const { data: rows, error } = await admin
    .from('online_test_captures')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const allRows = rows ?? []
  const scored = allRows.filter((r) => r.score_overall != null)
  const avg = scored.length
    ? scored.reduce((sum, r) => sum + Number(r.score_overall), 0) / scored.length
    : null

  return NextResponse.json({
    captures: allRows,
    stats: {
      totalCaptures: allRows.length,
      avgOverallScore: avg != null ? Math.round(avg * 10) / 10 : null,
      uniqueUsers: new Set(allRows.map((r) => r.user_id)).size,
    },
  })
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin(req)
  if ('response' in gate) return gate.response

  const body = await parseJsonBody<{ ids?: unknown; paths?: unknown }>(req)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.map(sanitizeUuid).filter(Boolean) as string[]
    : []
  const paths = Array.isArray(body.paths)
    ? body.paths
        .map((p) => (typeof p === 'string' && SCREENSHOT_PATH_RE.test(p) ? p : null))
        .filter(Boolean) as string[]
    : []

  if (!ids.length) {
    return NextResponse.json({ error: 'At least one valid capture id is required.' }, { status: 400 })
  }

  const admin = serviceRoleClient()

  if (paths.length) {
    await admin.storage.from('online-test-screenshots').remove(paths)
  }

  const { error } = await admin.from('online_test_captures').delete().in('id', ids)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, deleted: ids.length })
}
