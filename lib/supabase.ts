import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Browser auth session persisted in localStorage (not cookies). */
export const AUTH_STORAGE_KEY = 'retias-auth'

export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,
      storageKey: AUTH_STORAGE_KEY,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })
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
  session_type: string | null
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
