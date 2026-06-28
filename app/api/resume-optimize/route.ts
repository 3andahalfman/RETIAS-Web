import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MAX_RESUME_LEN = 50_000
const MAX_JD_LEN     = 30_000

export async function POST(req: Request) {
  try {
    // Auth
    const user = await getApiUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    // Rate limit
    if (!checkRateLimit(user.id, 'resume-optimize'))
      return NextResponse.json({ error: 'Too many requests. Please wait before optimizing again.' }, { status: 429 })

    const { resume, jobDescription, mode } = await req.json()

    // Input validation
    if (!resume?.trim() || !jobDescription?.trim())
      return NextResponse.json({ error: 'Resume and job description are required.' }, { status: 400 })
    if (resume.length > MAX_RESUME_LEN)
      return NextResponse.json({ error: 'Resume is too long.' }, { status: 400 })
    if (jobDescription.length > MAX_JD_LEN)
      return NextResponse.json({ error: 'Job description is too long.' }, { status: 400 })

    if (mode === 'optimize') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are an expert resume writer and career coach. Your task is to optimize the candidate's resume to be highly tailored for the specific job description provided.

RULES:
- Preserve ALL factual information (companies, titles, dates, degrees). Never fabricate experience.
- Naturally incorporate missing keywords and skills from the JD where they are genuinely relevant.
- Rewrite bullet points to emphasize impact and relevance to this specific role.
- Use the same action verbs and terminology used in the job description.
- Improve ATS (Applicant Tracking System) match rate.
- Keep the same resume structure/sections.
- Return ONLY the optimized resume text. No explanations, no commentary.

JOB DESCRIPTION:
${jobDescription}

ORIGINAL RESUME:
${resume}

OPTIMIZED RESUME:`
        }],
      })

      const optimized = (message.content[0] as any).text
      return NextResponse.json({ optimized })
    }

    if (mode === 'cover-letter') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Write a concise, compelling cover letter for this job based on the candidate's resume.

RULES:
- 3 paragraphs max. Professional but personable tone.
- Opening: why this role excites them and one key achievement.
- Middle: 2-3 specific skills/experiences that match the JD.
- Closing: call to action.
- Do NOT use generic filler phrases like "I am writing to express my interest".
- Return ONLY the cover letter text.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resume}

COVER LETTER:`
        }],
      })

      const coverLetter = (message.content[0] as any).text
      return NextResponse.json({ coverLetter })
    }

    return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 })
  } catch (err: any) {
    console.error('[resume-optimize]', err)
    return NextResponse.json({ error: 'Request failed. Please try again.' }, { status: 500 })
  }
}
