import type { PastSession } from '@/lib/supabase'

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function dur(s: PastSession) {
  if (!s.ended_at) return null
  const mins = Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
  return `${mins}m`
}

export default function SessionRow({ session: s, isLast }: { session: PastSession; isLast: boolean }) {
  return (
    <a href={`/dashboard/sessions/${s.id}`}
      className="flex items-center gap-4 px-5 py-4 transition-all block"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        textDecoration: 'none',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hv)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
          {s.target_role || 'Untitled Session'}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-2)' }}>
          {s.company || '—'} · {fmt(s.started_at)}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {s.qa_count > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
            {s.qa_count} Q&As
          </span>
        )}
        {dur(s) && (
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{dur(s)}</span>
        )}
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>→</span>
      </div>
    </a>
  )
}
