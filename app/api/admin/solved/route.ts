import { NextResponse } from 'next/server'
import { requireAdmin, serviceRoleClient } from '@/lib/api-auth'
import { parseJsonBody, sanitizeText, sanitizeUuid } from '@/lib/input-validation'

export async function GET(req: Request) {
  const gate = await requireAdmin(req)
  if ('response' in gate) return gate.response

  const admin = serviceRoleClient()
  const { data, error } = await admin
    .from('solved_questions')
    .select('id, platform, assessment_type, question, answer, created_at')
    .order('platform')
    .order('assessment_type')
    .order('created_at', { ascending: false })
    .limit(2000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [] })
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req)
  if ('response' in gate) return gate.response

  const body = await parseJsonBody<{
    platform?: unknown
    assessment_type?: unknown
    question?: unknown
    answer?: unknown
    rows?: unknown
    paraphrase_enabled?: unknown
    source_capture_id?: unknown
    source_url?: unknown
  }>(req)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const admin = serviceRoleClient()

  if (Array.isArray(body.rows)) {
    const inserts = body.rows
      .map((row) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) return null
        const r = row as Record<string, unknown>
        const platform = sanitizeText(r.platform, 120)
        const assessment_type = sanitizeText(r.assessment_type, 120)
        const question = sanitizeText(r.question, 8000)
        const answer = sanitizeText(r.answer, 8000)
        if (!platform || !assessment_type || !question || !answer) return null
        return {
          platform,
          assessment_type,
          question,
          answer,
          answer_variants: [] as string[],
          paraphrase_enabled: r.paraphrase_enabled === true,
          source_capture_id: sanitizeUuid(r.source_capture_id),
          source_url: sanitizeText(r.source_url, 2000),
        }
      })
      .filter(Boolean)

    if (!inserts.length) {
      return NextResponse.json({ error: 'At least one valid row is required.' }, { status: 400 })
    }

    const { error } = await admin.from('solved_questions').upsert(inserts, {
      onConflict: 'platform,assessment_type,question',
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, inserted: inserts.length })
  }

  const platform = sanitizeText(body.platform, 120)
  const assessment_type = sanitizeText(body.assessment_type, 120)
  const question = sanitizeText(body.question, 8000)
  const answer = sanitizeText(body.answer, 8000)

  if (!platform || !assessment_type || !question || !answer) {
    return NextResponse.json({ error: 'platform, assessment_type, question, and answer are required.' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('solved_questions')
    .upsert({
      platform,
      assessment_type,
      question,
      answer,
      answer_variants: [],
      paraphrase_enabled: body.paraphrase_enabled === true,
      source_capture_id: sanitizeUuid(body.source_capture_id),
      source_url: sanitizeText(body.source_url, 2000),
    }, { onConflict: 'platform,assessment_type,question' })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data?.id })
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin(req)
  if ('response' in gate) return gate.response

  const body = await parseJsonBody<{
    ids?: unknown
    platform?: unknown
    assessment_type?: unknown
  }>(req)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const admin = serviceRoleClient()

  const ids = Array.isArray(body.ids)
    ? body.ids.map(sanitizeUuid).filter(Boolean) as string[]
    : []

  if (ids.length) {
    const { error } = await admin.from('solved_questions').delete().in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, deleted: ids.length })
  }

  const platform = sanitizeText(body.platform, 120)
  const assessment_type = sanitizeText(body.assessment_type, 120)
  if (!platform || !assessment_type) {
    return NextResponse.json({ error: 'ids or platform+assessment_type required.' }, { status: 400 })
  }

  const { error, count } = await admin
    .from('solved_questions')
    .delete({ count: 'exact' })
    .eq('platform', platform)
    .eq('assessment_type', assessment_type)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, deleted: count ?? 0 })
}
