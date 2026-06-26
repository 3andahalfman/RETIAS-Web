'use client'

import { useEffect, useState } from 'react'
import { createClient, type PastSession } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import StatCard from '@/components/StatCard'
import SessionRow from '@/components/SessionRow'

interface Stats {
  totalSessions: number
  thisWeek: number
  cvsSaved: number
}

export default function DashboardPage() {
  const [stats, setStats]   = useState<Stats | null>(null)
  const [recent, setRecent] = useState<PastSession[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser]     = useState<User | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [{ data: sessions }, { count: cvCount }] = await Promise.all([
        supabase
          .from('past_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false }),
        supabase
          .from('cvs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

      const s = sessions ?? []
      const thisWeek = s.filter(x => x.started_at >= weekAgo).length

      setStats({ totalSessions: s.length, thisWeek, cvsSaved: cvCount ?? 0 })
      setRecent(s.slice(0, 8))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <LoadingSkeleton />

  const firstName = user?.user_metadata?.display_name?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? 'there'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
          Welcome, {firstName} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          Ready for your next interview? Let's get started.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Sessions" value={stats?.totalSessions ?? 0} icon="🎙️" />
        <StatCard label="This Week"      value={stats?.thisWeek ?? 0}      icon="📅" />
        <StatCard label="CVs Saved"      value={stats?.cvsSaved ?? 0}      icon="📄" />
      </div>

      {/* Start a Session */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Start a Session</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SESSION_TYPES.map(t => (
            <a key={t.title} href="https://github.com/3andahalfman/RETIAS/releases/latest/download/RETIAS-Setup.exe"
              target="_blank" rel="noopener noreferrer"
              className="glass p-4 flex flex-col gap-3 transition-all hover:border-blue-500/30 group"
              style={{ border: '1px solid var(--border)', textDecoration: 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: t.bg }}>
                {t.icon}
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{t.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{t.desc}</p>
              </div>
              <span className="text-xs font-medium mt-auto"
                style={{ color: t.color }}>
                {t.cta} →
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="glass p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Recent Sessions</h2>
          <a href="/dashboard/sessions" className="text-xs font-medium"
            style={{ color: 'var(--blue)' }}>View all →</a>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-2)' }}>
            No sessions yet. Start the desktop app to begin.
          </div>
        ) : (
          <div>
            {recent.map((s, i) => (
              <SessionRow key={s.id} session={s} isLast={i === recent.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const SESSION_TYPES = [
  {
    title: 'Real Interview',
    desc: 'Live coaching while the interviewer speaks — stealth overlay, transcription, and CV-aware answers.',
    icon: '🎙️',
    bg: 'rgba(59,130,246,0.15)',
    color: '#60a5fa',
    cta: 'Start Real Interview',
  },
  {
    title: 'Mock Interview',
    desc: 'Practice with YouTube mock interviews — AI detects questions and coaches you in real time.',
    icon: '🤖',
    bg: 'rgba(16,185,129,0.15)',
    color: '#34d399',
    cta: 'Start Mock',
  },
  {
    title: 'Online Assessment',
    desc: 'Capture screenshots, Analyse All for AI answers, browse Solved Q&A, or Go Live from saved questions.',
    icon: '💻',
    bg: 'rgba(251,146,60,0.15)',
    color: '#fb923c',
    cta: 'Start Test',
  },
]

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="h-7 w-48 rounded-lg mb-2" style={{ background: 'var(--surface)' }} />
      <div className="h-4 w-56 rounded mb-8"    style={{ background: 'var(--surface)' }} />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl" style={{ background: 'var(--surface)' }} />
        ))}
      </div>
      <div className="h-8 w-32 rounded mb-3" style={{ background: 'var(--surface)' }} />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl" style={{ background: 'var(--surface)' }} />
        ))}
      </div>
      <div className="h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
    </div>
  )
}
