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
    if (!checkRateLimit(user.id, 'resume-scan'))
      return NextResponse.json({ error: 'Too many requests. Please wait before scanning again.' }, { status: 429 })

    const { resume, jobDescription } = await req.json()

    // Input validation
    if (!resume?.trim() || !jobDescription?.trim())
      return NextResponse.json({ error: 'Resume and job description are required.' }, { status: 400 })
    if (resume.length > MAX_RESUME_LEN)
      return NextResponse.json({ error: 'Resume is too long. Please trim it to under 50,000 characters.' }, { status: 400 })
    if (jobDescription.length > MAX_JD_LEN)
      return NextResponse.json({ error: 'Job description is too long.' }, { status: 400 })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Analyse the resume against the job description below and return ONLY a valid JSON object — no markdown, no commentary.

JSON schema:
{
  "score": <integer 0-100 overall ATS match>,
  "jobTitle": <string — inferred job title from JD>,
  "searchability": {
    "score": <0-100>,
    "issues": <integer>,
    "items": [
      { "label": <string>, "status": <"pass"|"fail"|"warn">, "detail": <string> }
    ]
  },
  "hardSkills": {
    "score": <0-100>,
    "issues": <integer>,
    "matched": [ { "skill": <string>, "resumeCount": <int>, "jdCount": <int> } ],
    "missing": [ { "skill": <string>, "resumeCount": 0, "jdCount": <int> } ]
  },
  "softSkills": {
    "score": <0-100>,
    "issues": <integer>,
    "matched": [ { "skill": <string>, "resumeCount": <int>, "jdCount": <int> } ],
    "missing": [ { "skill": <string>, "resumeCount": 0, "jdCount": <int> } ]
  },
  "recruiterTips": {
    "score": <0-100>,
    "issues": <integer>,
    "items": [
      { "label": <string>, "status": <"pass"|"fail">, "detail": <string> }
    ]
  },
  "formatting": {
    "items": [
      { "category": <string>, "tips": [ <string> ] }
    ]
  }
}

Searchability items to check: Contact Information, Summary/Objective, Section Headings, Job Title Match, Date Formatting, Education Match, File Type compatibility.
Hard skills: technical tools, languages, frameworks, certifications from the JD.
Soft skills: communication, leadership, teamwork, time management etc from the JD.
Recruiter tips: Job Level Match, Measurable Results, Resume Tone, Word Count, Web Presence, Clichés.
Formatting: Font check, Layout, Page Setup — give general tips since we only have plain text.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resume}`,
      }],
    })

    const raw  = (message.content[0] as any).text.trim()
    const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const analysis = JSON.parse(json)
    return NextResponse.json(analysis)
  } catch (err: any) {
    console.error('[resume-scan]', err?.message ?? err)
    return NextResponse.json({ error: 'Scan failed. Please try again.' }, { status: 500 })
  }
}
