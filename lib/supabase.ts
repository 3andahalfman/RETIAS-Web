import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON)
}

// ── Types matching the desktop app schema ──────────────────────────────────

export interface PastSession {
  id: string
  user_id: string
  company: string
  target_role: string
  started_at: string
  ended_at: string | null
  qa_count: number
}

export interface SessionQA {
  id: number
  session_id: string
  question: string
  question_type: string
  answer: string
  timestamp: number
}

export interface SessionTranscriptLine {
  id: number
  session_id: string
  role: string
  text: string
  timestamp: number
}

export interface CV {
  id: string
  user_id: string
  name: string
  text: string
  created_at: string
}

export interface DashboardStats {
  totalSessions: number
  totalQAs: number
  avgDurationMins: number
  topCompany: string | null
  recentSessions: PastSession[]
}
