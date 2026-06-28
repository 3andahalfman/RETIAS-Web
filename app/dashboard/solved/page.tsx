'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/admin'

interface SolvedRow {
  id: string
  platform: string
  assessment_type: string
  question: string
  answer: string
  created_at: string
}

function preview(text: string, max = 90): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return t.slice(0, max) + '…'
}

export default function SolvedBankPage() {
  const [rows, setRows] = useState<SolvedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) {
      setForbidden(true)
      setLoading(false)
      return
    }

    const { data, error: listErr } = await supabase
      .from('solved_questions')
      .select('id, platform, assessment_type, question, answer, created_at')
      .order('platform')
      .order('assessment_type')
      .order('created_at', { ascending: false })
      .limit(2000)

    if (listErr) {
      setError(listErr.message)
      setRows([])
    } else {
      setRows((data ?? []) as SolvedRow[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      r.platform.toLowerCase().includes(q) ||
      r.assessment_type.toLowerCase().includes(q) ||
      r.question.toLowerCase().includes(q) ||
      r.answer.toLowerCase().includes(q),
    )
  }, [rows, search])

  const groups = useMemo(() => {
    const map = new Map<string, SolvedRow[]>()
    for (const row of filtered) {
      const key = `${row.platform}\0${row.assessment_type}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return Array.from(map.entries())
      .map(([key, items]) => {
        const [platform, assessment_type] = key.split('\0')
        return { platform, assessment_type, items }
      })
      .sort((a, b) => a.platform.localeCompare(b.platform) || a.assessment_type.localeCompare(b.assessment_type))
  }, [filtered])

  const handleDeleteQuestion = async (row: SolvedRow) => {
    if (!confirm(`Delete this question from ${row.platform} · ${row.assessment_type}?\n\n"${preview(row.question, 120)}"\n\nThis cannot be undone.`)) {
      return
    }
    setDeletingId(row.id)
    setError(null)
    try {
      const supabase = createClient()
      const { error: delErr } = await supabase.from('solved_questions').delete().eq('id', row.id)
      if (delErr) throw new Error(delErr.message)
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAssessment = async (platform: string, assessment_type: string, count: number) => {
    if (!confirm(`Delete all ${count} question${count !== 1 ? 's' : ''} in "${platform} · ${assessment_type}"?\n\nThis cannot be undone.`)) {
      return
    }
    const groupKey = `${platform}\0${assessment_type}`
    setDeletingGroup(groupKey)
    setError(null)
    try {
      const supabase = createClient()
      const { error: delErr } = await supabase
        .from('solved_questions')
        .delete()
        .eq('platform', platform)
        .eq('assessment_type', assessment_type)
      if (delErr) throw new Error(delErr.message)
      setRows((prev) => prev.filter((r) => !(r.platform === platform && r.assessment_type === assessment_type)))
      if (expanded === groupKey) setExpanded(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingGroup(null)
    }
  }

  if (forbidden) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-4xl mb-3">🔒</p>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>Admin only</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Your account doesn&apos;t have access to this page.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Solved Bank</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            Curated Q&amp;A sent from the Assessment Archive — admin only.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="text-xs font-semibold px-3 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      <input
        type="search"
        placeholder="Search platform, assessment, or question…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl px-4 py-2.5 text-sm mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
      />

      {error && (
        <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="glass py-14 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            {search.trim() ? 'No matches.' : 'No solved questions yet.'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            Send captures from the Assessment Archive to populate this bank.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {groups.map(({ platform, assessment_type, items }) => {
          const groupKey = `${platform}\0${assessment_type}`
          const isOpen = expanded === groupKey
          const busy = deletingGroup === groupKey
          return (
            <div key={groupKey} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}>
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2 text-left text-sm font-medium py-1"
                  onClick={() => setExpanded(isOpen ? null : groupKey)}
                  style={{ color: 'var(--text-1)' }}
                >
                  <span style={{ color: 'var(--text-3)', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
                  <span>{platform}</span>
                  <span style={{ color: 'var(--text-3)' }}>·</span>
                  <span style={{ color: '#60a5fa' }}>{assessment_type}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-3)' }}>
                    {items.length}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={busy || !!deletingId}
                  onClick={() => handleDeleteAssessment(platform, assessment_type, items.length)}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md hover:bg-red-500/10 disabled:opacity-40"
                  style={{ color: '#f87171', border: '1px solid var(--border)' }}
                >
                  {busy ? 'Deleting…' : 'Delete all'}
                </button>
              </div>
              {isOpen && (
                <ul>
                  {items.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-start gap-3 px-4 py-3"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{preview(row.question, 140)}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{preview(row.answer, 100)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={deletingId === row.id || busy}
                        onClick={() => handleDeleteQuestion(row)}
                        className="text-base p-1 rounded-md hover:bg-red-500/10 shrink-0 disabled:opacity-40"
                        style={{ color: '#f87171' }}
                        title="Delete this question"
                      >
                        {deletingId === row.id ? '…' : '🗑'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
