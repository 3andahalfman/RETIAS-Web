import Anthropic from '@anthropic-ai/sdk'

const CLAUDE_MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 2200
const MAX_ANSWER_LEN = 50_000

export const PARAPHRASE_MODES = ['Standard', 'Fluency', 'Formal', 'Simple', 'Creative'] as const

const CLAUDE_VOICES: Record<(typeof PARAPHRASE_MODES)[number], string> = {
  Standard: 'concise and direct, every sentence carries information, no filler',
  Fluency:  'casual conversational tone, contractions allowed, friendly explanations',
  Formal:   'detailed and technical, precise terminology, formal sentence structure',
  Simple:   'structured step-by-step, lead with the conclusion then justify it',
  Creative: 'reflective first-person, sounds like someone reasoning out loud',
}

const ANTI_AI_RULES = `
- Do NOT use AI-tell phrases: "Furthermore", "Moreover", "It's important to note", "delve into", "in the realm of", "navigate the landscape", "elevate", "robust", "leverage", "synergy", "cutting-edge".
- Vary sentence length and structure — avoid the predictable medium-length pattern.
- Preserve every technical fact, formula, code block, number, and proper noun EXACTLY.
- Keep total length within ±15% of the original.
- Output ONLY the rewritten answer. No preamble, no quotes, no "Here is..." opener.`

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') return null
  return new Anthropic({ apiKey })
}

async function rewriteWithClaude(answer: string, voice: string): Promise<string | null> {
  const client = getClient()
  if (!client) return null

  const prompt = `You are paraphrasing a real interview/assessment answer so it sounds like a different person wrote it.

Voice: ${voice}

Rules:${ANTI_AI_RULES}

ORIGINAL ANSWER:
${answer}`

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
    return text || null
  } catch (err) {
    console.error('[paraphrase-variants] Claude rewrite failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/** Generate 5 humanized base variants (web fallback — Claude only). */
export async function generateBaseVariants(answer: string): Promise<string[]> {
  const trimmed = answer.trim()
  if (!trimmed) return []
  if (trimmed.length > MAX_ANSWER_LEN) {
    throw new Error('Answer is too long to paraphrase.')
  }

  const results = await Promise.all(
    PARAPHRASE_MODES.map((mode) => rewriteWithClaude(trimmed, CLAUDE_VOICES[mode])),
  )
  return results.filter((t): t is string => !!t && t.length > 0)
}
