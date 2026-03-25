'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient, type PastSession, type SessionQA, type SessionTranscriptLine } from '@/lib/supabase'

function fmt(ts: string | null | undefined) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
function dur(s: PastSession) {
  if (!s.ended_at) return 'In progress'
  const mins = Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
  return `${mins}m`
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [session,    setSession]    = useState<PastSession | null>(null)
  const [qa,         setQa]         = useState<SessionQA[]>([])
  const [transcript, setTranscript] = useState<SessionTranscriptLine[]>([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState<'qa' | 'transcript'>('qa')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: sess }, { data: qaData }, { data: txData }] = await Promise.all([
        supabase.from('past_sessions').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('session_qa').select('*').eq('session_id', id).order('timestamp'),
        supabase.from('session_transcript').select('*').eq('session_id', id).order('timestamp'),
      ])

      if (!sess) { router.replace('/dashboard/sessions'); return }
      setSession(sess)
      setQa(qaData ?? [])
      setTranscript(txData ?? [])
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-7 w-56 rounded-lg" style={{ background: 'var(--surface)' }} />
      <div className="h-28 rounded-2xl" style={{ background: 'var(--surface)' }} />
      <div className="h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={() => router.back()} className="text-sm mb-5 flex items-center gap-1"
        style={{ color: 'var(--text-2)' }}>
        ← Back to sessions
      </button>

      {/* Meta card */}
      <div className="glass p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
              {session!.target_role || 'Untitled Session'}
            </h1>
            {session!.company && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--blue-l, #60a5fa)' }}>{session!.company}</p>
            )}
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
            {session!.qa_count} Q&As
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Started',  value: fmt(session!.started_at) },
            { label: 'Ended',    value: fmt(session!.ended_at) },
            { label: 'Duration', value: dur(session!) },
          ].map(x => (
            <div key={x.label}>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{x.label}</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-1)' }}>{x.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['qa', 'transcript'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t ? 'var(--blue)' : 'var(--surface)',
              color: tab === t ? '#fff' : 'var(--text-2)',
              border: '1px solid ' + (tab === t ? 'transparent' : 'var(--border)'),
            }}>
            {t === 'qa' ? `Q&As (${qa.length})` : `Transcript (${transcript.length})`}
          </button>
        ))}
      </div>

      {/* Q&A */}
      {tab === 'qa' && (
        <div className="space-y-4">
          {qa.length === 0 ? (
            <div className="glass py-10 text-center text-sm" style={{ color: 'var(--text-2)' }}>No Q&As recorded.</div>
          ) : qa.map((item, i) => (
            <div key={item.id} className="glass p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>
                  {item.question_type || 'Question'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>#{i + 1}</span>
              </div>
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-1)' }}>
                🎯 {item.question}
              </p>
              <div className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--text-2)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                {item.answer}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transcript */}
      {tab === 'transcript' && (
        <div className="glass p-0 overflow-hidden">
          {transcript.length === 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: 'var(--text-2)' }}>No transcript recorded.</div>
          ) : transcript.map((line) => (
            <div key={line.id} className="flex gap-3 px-5 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs font-semibold w-20 shrink-0 mt-0.5"
                style={{ color: line.role === 'interviewer' ? 'var(--blue)' : 'var(--orange)' }}>
                {line.role}
              </span>
              <p className="text-sm" style={{ color: 'var(--text-1)' }}>{line.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
