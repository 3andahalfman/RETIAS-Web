import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { isAdminEmail } from '@/lib/admin'
import { generateBaseVariants } from '@/lib/paraphrase-variants'

const MAX_ANSWER_LEN = 50_000

export async function POST(req: Request) {
  const user = await getApiUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Admin only.' }, { status: 403 })
  }

  let body: { answer?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const answer = typeof body.answer === 'string' ? body.answer.trim() : ''
  if (!answer) return NextResponse.json({ error: 'Answer is required.' }, { status: 400 })
  if (answer.length > MAX_ANSWER_LEN) {
    return NextResponse.json({ error: 'Answer is too long.' }, { status: 400 })
  }

  try {
    const variants = await generateBaseVariants(answer)
    return NextResponse.json({ variants })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Paraphrase failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
