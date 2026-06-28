import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import { getApiUser } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_FILE_SIZE  = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTS   = ['.pdf', '.doc', '.docx', '.txt']
const ALLOWED_MIMES  = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

export async function POST(req: Request) {
  try {
    // Auth
    const user = await getApiUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    // Rate limit
    if (!checkRateLimit(user.id, 'extract-resume'))
      return NextResponse.json({ error: 'Too many requests. Please wait before uploading again.' }, { status: 429 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })

    // File size check
    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 })

    // MIME type check
    if (file.type && !ALLOWED_MIMES.has(file.type))
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, DOCX, DOC, or TXT.' }, { status: 400 })

    // Extension check
    const name = file.name.toLowerCase()
    if (!ALLOWED_EXTS.some(ext => name.endsWith(ext)))
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, DOCX, DOC, or TXT.' }, { status: 400 })

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    let text = ''

    if (name.endsWith('.txt')) {
      text = buffer.toString('utf-8')

    } else if (name.endsWith('.pdf')) {
      const result = await extractText(new Uint8Array(bytes), { mergePages: true })
      const pages  = (result as any).text ?? result
      text = Array.isArray(pages) ? pages.join('\n') : String(pages ?? '')

    } else if (name.endsWith('.doc') || name.endsWith('.docx')) {
      const mammoth = await import('mammoth')
      const result  = await mammoth.extractRawText({ buffer })
      text = result.value
    }

    if (!text.trim())
      return NextResponse.json({ error: 'Could not extract text from this file.' }, { status: 422 })

    return NextResponse.json({ text: text.trim() })
  } catch (err: any) {
    console.error('[extract-resume]', err?.message ?? err)
    return NextResponse.json({ error: 'Failed to process file. Please try again.' }, { status: 500 })
  }
}
