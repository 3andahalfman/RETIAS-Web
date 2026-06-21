'use client'

import { useEffect, useState } from 'react'
import { createClient, type PastSession } from '@/lib/supabase'
import SessionRow from '@/components/SessionRow'

const TABS = ['All', 'Interview', 'Mock', 'Online Assessment'] as const
type Tab = typeof TABS[number]

function matchesTab(s: PastSession, tab: Tab) {
  if (tab === 'All') return true
  const t = (s.session_type ?? '').toLowerCase()
  if (tab === 'Interview')   return t === 'interview'
  if (tab === 'Mock')        return t === 'mock'
  if (tab === 'Online Assessment') return t === 'online_test' || t === 'online test'
  return false
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<PastSession[]>([])
  const [filtered, setFiltered] = useState<PastSession[]>([])
  const [search, setSearch]     = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('past_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
      const s = data ?? []
      setSessions(s)
      setFiltered(s)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      sessions
        .filter(s => matchesTab(s, activeTab))
        .filter(s => !q || s.company?.toLowerCase().includes(q) || s.target_role?.toLowerCase().includes(q))
    )
  }, [search, activeTab, sessions])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Sessions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            {sessions.length} total session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a href="https://github.com/3andahalfman/RETIAS/releases/latest/download/RETIAS-Setup.exe"
          target="_blank" rel="noopener noreferrer"
          className="text-xs font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', color: '#fff' }}>
          + New Session
        </a>
      </div>

      {/* Search */}
      <input className="input mb-3" placeholder="Search sessions…"
        value={search} onChange={e => setSearch(e.target.value)} />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: 'var(--surface)' }}>
        {TABS.map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: activeTab === tab ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: activeTab === tab ? '#60a5fa' : 'var(--text-2)',
              border: activeTab === tab ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass py-14 text-center text-sm" style={{ color: 'var(--text-2)' }}>
          {search ? 'No sessions match your search.' : 'No sessions yet.'}
        </div>
      ) : (
        <div className="glass p-0 overflow-hidden">
          {filtered.map((s, i) => (
            <SessionRow key={s.id} session={s} isLast={i === filtered.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}
