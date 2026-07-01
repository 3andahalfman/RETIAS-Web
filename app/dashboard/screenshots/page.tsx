'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authFetch } from '@/lib/auth-fetch'
import { classifySolvedQuestionCategory, getSolvedCategoryLabel } from '@/lib/solved-question-category'

type Tab = 'captures' | 'solved'

const SCREENSHOT_PATH_REGEX = /^[\w-]+\/[\w-]+\/\d+\.png$/

async function fetchScreenshotUrl(path: string): Promise<string | null> {
  if (!SCREENSHOT_PATH_REGEX.test(path)) return null
  const res = await authFetch(`/api/admin/captures/sign?path=${encodeURIComponent(path)}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.url ?? null
}

declare global {
  interface Window {
    electronAPI?: Record<string, unknown>
  }
}

interface OnlineTestCapture {
  id: string
  user_id: string
  user_email: string
  session_id: string | null
  test_type: string
  screenshot_paths: string[]
  screenshot_count: number
  ai_answer: string
  score_accuracy: number | null
  score_completeness: number | null
  score_overall: number | null
  score_notes: string | null
  extracted_questions: string | null
  detected_test_type: string | null
  detected_platform: string | null
  source_url: string | null
  created_at: string
}

interface CaptureStats {
  totalCaptures: number
  avgOverallScore: number | null
  uniqueUsers: number
}

interface SolvedRow {
  id: string
  platform: string
  assessment_type: string
  question: string
  answer: string
  created_at: string
  source_capture_id: string | null
}

function InSolvedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`font-semibold rounded-full shrink-0 ${compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }}
      title="Already sent to Solved Assessment"
    >
      ✓ In Solved
    </span>
  )
}

function preview(text: string, max = 90): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return t.slice(0, max) + '…'
}

function formatTestType(type: string) {
  if (type.startsWith('role:')) return type.slice(5)
  return type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function scoreColor(score: number | null) {
  if (score == null) return 'var(--text-3)'
  if (score >= 80) return '#34d399'
  if (score >= 60) return '#fbbf24'
  return '#f87171'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function deleteCaptures(ids: string[], paths: string[]): Promise<void> {
  const res = await authFetch('/api/admin/captures', {
    method: 'DELETE',
    body: JSON.stringify({ ids, paths }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Delete failed')
}

export default function ScreenshotLibraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'solved' ? 'solved' : 'captures'

  const setTab = useCallback((next: Tab) => {
    router.replace(next === 'solved' ? '/dashboard/screenshots?tab=solved' : '/dashboard/screenshots')
  }, [router])

  const [captures, setCaptures] = useState<OnlineTestCapture[]>([])
  const [stats, setStats] = useState<CaptureStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [sendModalCap, setSendModalCap] = useState<OnlineTestCapture | null>(null)
  const [sendPlatform, setSendPlatform] = useState('')
  const [sendAssessment, setSendAssessment] = useState('')
  const [sendQuestionsText, setSendQuestionsText] = useState('')
  const [sendAnswerText, setSendAnswerText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendDone, setSendDone] = useState(false)
  const [sendParaphraseEnabled, setSendParaphraseEnabled] = useState(false)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [detailUrls, setDetailUrls] = useState<string[]>([])

  const [solvedRows, setSolvedRows] = useState<SolvedRow[]>([])
  const [solvedLoading, setSolvedLoading] = useState(true)
  const [solvedError, setSolvedError] = useState<string | null>(null)
  const [solvedSearch, setSolvedSearch] = useState('')
  const [expandedSolvedId, setExpandedSolvedId] = useState<string | null>(null)
  const [deletingSolvedId, setDeletingSolvedId] = useState<string | null>(null)
  const [deletingSolvedGroup, setDeletingSolvedGroup] = useState<string | null>(null)
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null)

  const loadCaptures = useCallback(async () => {
    setLoading(true)
    setError(null)

    const res = await authFetch('/api/admin/captures')
    if (res.status === 403 || res.status === 401) {
      setForbidden(true)
      setLoading(false)
      return
    }

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to load captures')
      setLoading(false)
      return
    }

    setCaptures((data.captures ?? []) as OnlineTestCapture[])
    setStats(data.stats ?? null)
    setLoading(false)
  }, [])

  const loadSolved = useCallback(async () => {
    setSolvedLoading(true)
    setSolvedError(null)

    const res = await authFetch('/api/admin/solved')
    if (res.status === 403 || res.status === 401) {
      setForbidden(true)
      setSolvedLoading(false)
      return
    }

    const data = await res.json()
    if (!res.ok) {
      setSolvedError(data.error ?? 'Failed to load solved questions')
      setSolvedRows([])
    } else {
      setSolvedRows((data.rows ?? []) as SolvedRow[])
    }
    setSolvedLoading(false)
  }, [])

  const loadAll = useCallback(async () => {
    await Promise.all([loadCaptures(), loadSolved()])
  }, [loadCaptures, loadSolved])

  useEffect(() => { void loadAll() }, [loadAll])

  const sentCaptureIds = useMemo(() => {
    const ids = new Set<string>()
    for (const row of solvedRows) {
      if (row.source_capture_id) ids.add(row.source_capture_id)
    }
    return ids
  }, [solvedRows])

  const isCaptureInSolved = useCallback((captureId: string) => sentCaptureIds.has(captureId), [sentCaptureIds])

  const userSummaries = useMemo(() => {
    const map = new Map<string, { email: string; captures: OnlineTestCapture[] }>()
    for (const cap of captures) {
      const email = cap.user_email?.trim() || 'Unknown user'
      if (!map.has(email)) map.set(email, { email, captures: [] })
      map.get(email)!.captures.push(cap)
    }
    return Array.from(map.values())
      .map((u) => ({
        ...u,
        captures: u.captures.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      }))
      .sort((a, b) => b.captures.length - a.captures.length || a.email.localeCompare(b.email))
  }, [captures])

  const activeUser = useMemo(
    () => userSummaries.find((u) => u.email === selectedUserEmail) ?? null,
    [userSummaries, selectedUserEmail],
  )

  const activeUserCaptures = activeUser?.captures ?? []

  useEffect(() => {
    if (!userSummaries.length) {
      setSelectedUserEmail(null)
      return
    }
    if (!selectedUserEmail || !userSummaries.some((u) => u.email === selectedUserEmail)) {
      setSelectedUserEmail(userSummaries[0].email)
    }
  }, [userSummaries, selectedUserEmail])

  const selectUser = useCallback((email: string) => {
    setSelectedUserEmail(email)
    setSelectedId((prev) => {
      if (!prev) return null
      const cap = captures.find((c) => c.id === prev)
      return cap?.user_email === email ? prev : null
    })
  }, [captures])

  const selected = captures.find((c) => c.id === selectedId) ?? null

  useEffect(() => {
    if (!activeUserCaptures.length) {
      setThumbUrls({})
      return
    }
    let cancelled = false
    ;(async () => {
      const urls: Record<string, string> = {}
      await Promise.all(
        activeUserCaptures.slice(0, 50).map(async (cap) => {
          const path = cap.screenshot_paths[0]
          if (!path) return
          const url = await fetchScreenshotUrl(path).catch(() => null)
          if (url && !cancelled) urls[cap.id] = url
        }),
      )
      if (!cancelled) setThumbUrls(urls)
    })()
    return () => { cancelled = true }
  }, [activeUserCaptures])

  useEffect(() => {
    if (!selected) {
      setDetailUrls([])
      return
    }
    let cancelled = false
    ;(async () => {
      const urls: string[] = []
      for (const path of selected.screenshot_paths) {
        const url = await fetchScreenshotUrl(path).catch(() => null)
        if (url) urls.push(url)
      }
      if (!cancelled) setDetailUrls(urls)
    })()
    return () => { cancelled = true }
  }, [selected])

  const handleDeleteCapture = useCallback(async (cap: OnlineTestCapture) => {
    if (!confirm(`Delete this capture from ${cap.user_email}? This removes the screenshots and AI answer permanently.`)) return
    setDeletingIds(prev => new Set(prev).add(cap.id))
    try {
      await deleteCaptures([cap.id], cap.screenshot_paths)
      setCaptures(prev => prev.filter(c => c.id !== cap.id))
      if (selectedId === cap.id) setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete capture')
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(cap.id); return n })
    }
  }, [selectedId])

  const handleDeleteSession = useCallback(async (caps: OnlineTestCapture[]) => {
    const sessionLabel = caps[0].session_id ? `session ${caps[0].session_id.slice(0, 8)}` : 'this group'
    if (!confirm(`Delete all ${caps.length} captures in ${sessionLabel}? This cannot be undone.`)) return
    const ids = caps.map(c => c.id)
    setDeletingIds(prev => { const n = new Set(prev); ids.forEach(i => n.add(i)); return n })
    try {
      const paths = caps.flatMap(c => c.screenshot_paths)
      await deleteCaptures(ids, paths)
      setCaptures(prev => prev.filter(c => !ids.includes(c.id)))
      if (selectedId && ids.includes(selectedId)) setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); ids.forEach(i => n.delete(i)); return n })
    }
  }, [selectedId])

  const openSendModal = useCallback((cap: OnlineTestCapture) => {
    if (sentCaptureIds.has(cap.id)) return
    setSendModalCap(cap)
    setSendPlatform(cap.detected_platform ?? '')
    setSendAssessment(cap.detected_test_type ?? '')
    setSendQuestionsText(cap.extracted_questions ?? '')
    setSendAnswerText(cap.ai_answer ?? '')
    setSendParaphraseEnabled(false)
    setSendError(null)
    setSendDone(false)
  }, [sentCaptureIds])

  const closeSendModal = useCallback(() => {
    setSendModalCap(null)
    setSending(false)
    setSendError(null)
    setSendDone(false)
  }, [])

  useEffect(() => {
    if (!sendDone) return
    const t = setTimeout(() => closeSendModal(), 900)
    return () => clearTimeout(t)
  }, [sendDone, closeSendModal])

  const handleSendToSolved = useCallback(async () => {
    if (!sendModalCap) return
    if (sentCaptureIds.has(sendModalCap.id)) {
      setSendError('This capture is already in Solved Assessment.')
      return
    }
    setSending(true)
    setSendError(null)
    setSendDone(false)
    try {
      const platform = sendPlatform.trim()
      const assessment = sendAssessment.trim()
      const answer = sendAnswerText.trim()
      if (!platform || !assessment) throw new Error('Platform is required.')
      if (!answer) throw new Error('Answer cannot be empty.')

      const questions = sendQuestionsText
        .split(/\n\s*\n+/)
        .map((q) => q.trim())
        .filter(Boolean)
      if (!questions.length) {
        throw new Error('No questions to send. Add at least one question (separate multiple with a blank line).')
      }

      const rows = questions.map((q) => ({
        platform,
        assessment_type: classifySolvedQuestionCategory(q, assessment),
        question: q,
        answer,
        paraphrase_enabled: sendParaphraseEnabled,
        source_capture_id: sendModalCap.id,
        source_url: sendModalCap.source_url,
      }))

      const res = await authFetch('/api/admin/solved', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Insert failed')
      await loadSolved()
      setSendDone(true)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send to Solved Assessment bank.')
    } finally {
      setSending(false)
    }
  }, [sendModalCap, sendPlatform, sendAssessment, sendQuestionsText, sendAnswerText, sendParaphraseEnabled, loadSolved, sentCaptureIds])

  const filteredSolved = useMemo(() => {
    const q = solvedSearch.trim().toLowerCase()
    if (!q) return solvedRows
    return solvedRows.filter((r) => {
      const category = classifySolvedQuestionCategory(r.question, r.assessment_type)
      const categoryLabel = getSolvedCategoryLabel(category).toLowerCase()
      return (
        r.platform.toLowerCase().includes(q) ||
        r.assessment_type.toLowerCase().includes(q) ||
        categoryLabel.includes(q) ||
        r.question.toLowerCase().includes(q) ||
        r.answer.toLowerCase().includes(q)
      )
    })
  }, [solvedRows, solvedSearch])

  const solvedGroups = useMemo(() => {
    const map = new Map<string, SolvedRow[]>()
    for (const row of filteredSolved) {
      const category = classifySolvedQuestionCategory(row.question, row.assessment_type)
      const key = `${row.platform}\0${category}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return Array.from(map.entries())
      .map(([key, items]) => {
        const [platform, category] = key.split('\0')
        return { platform, category, items }
      })
      .sort((a, b) =>
        a.platform.localeCompare(b.platform) ||
        getSolvedCategoryLabel(a.category).localeCompare(getSolvedCategoryLabel(b.category)),
      )
  }, [filteredSolved])

  const handleDeleteSolvedQuestion = useCallback(async (row: SolvedRow) => {
    if (!confirm(`Remove this Q&A from Solved Assessment?\n\n"${preview(row.question, 120)}"\n\nPremium Plus users will no longer see it. This cannot be undone.`)) {
      return
    }
    setDeletingSolvedId(row.id)
    setSolvedError(null)
    try {
      const res = await authFetch('/api/admin/solved', {
        method: 'DELETE',
        body: JSON.stringify({ ids: [row.id] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      setSolvedRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch (err) {
      setSolvedError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingSolvedId(null)
    }
  }, [])

  const handleDeleteSolvedAssessment = useCallback(async (platform: string, category: string, items: SolvedRow[]) => {
    const label = getSolvedCategoryLabel(category)
    if (!confirm(`Remove all ${items.length} question${items.length !== 1 ? 's' : ''} in "${platform} · ${label}" from Solved Assessment?\n\nThis cannot be undone.`)) {
      return
    }
    const groupKey = `${platform}\0${category}`
    setDeletingSolvedGroup(groupKey)
    setSolvedError(null)
    try {
      const res = await authFetch('/api/admin/solved', {
        method: 'DELETE',
        body: JSON.stringify({ ids: items.map((r) => r.id) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      const removed = new Set(items.map((r) => r.id))
      setSolvedRows((prev) => prev.filter((r) => !removed.has(r.id)))
    } catch (err) {
      setSolvedError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingSolvedGroup(null)
    }
  }, [])

  if (forbidden) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-4xl mb-3">🔒</p>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>Admin only</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Your account doesn't have access to this page.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Assessment Archive</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            Screenshot captures and Q&amp;A sent to Solved Assessment — manage both in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          disabled={loading || solvedLoading}
          className="text-xs font-semibold px-3 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
        >
          {loading || solvedLoading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      <div className="flex rounded-lg p-1 mb-6 w-full max-w-md" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {([
          { id: 'captures' as Tab, label: `Captures (${captures.length})` },
          { id: 'solved' as Tab, label: `Sent to Solved (${solvedRows.length})` },
        ]).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="flex-1 py-2 text-xs font-semibold rounded-md transition-all"
            style={{
              background: tab === id ? 'var(--blue)' : 'transparent',
              color: tab === id ? '#fff' : 'var(--text-2)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'captures' && (
        <>
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Captures', value: stats?.totalCaptures ?? '—', sub: 'Stored screenshots' },
          { label: 'Avg Score',      value: stats?.avgOverallScore ?? '—', sub: 'Overall (0–100)' },
          { label: 'Users',          value: stats?.uniqueUsers ?? '—', sub: 'Contributing accounts' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{m.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-1)' }}>{m.value}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {!loading && captures.length === 0 && !error && (
        <div className="glass py-14 text-center">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>No captures yet.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            They appear when users run Online Assessment in the desktop app and click Analyse All.
          </p>
        </div>
      )}

      {!loading && captures.length > 0 && (
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: selected
            ? 'minmax(150px, 190px) minmax(0, 1fr) minmax(0, 1fr)'
            : 'minmax(150px, 190px) minmax(0, 1fr)',
        }}
      >
        {/* User rail */}
        <div className="rounded-xl p-2 self-start sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1.5 mb-1"
            style={{ color: 'var(--text-3)' }}>
            Users ({userSummaries.length})
          </p>
          <div className="space-y-1">
            {userSummaries.map((u) => {
              const active = u.email === selectedUserEmail
              const scored = u.captures.filter((c) => c.score_overall != null)
              const avg = scored.length
                ? Math.round(scored.reduce((s, c) => s + Number(c.score_overall), 0) / scored.length)
                : null
              return (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => selectUser(u.email)}
                  className="w-full text-left rounded-lg px-2.5 py-2 transition-colors"
                  style={{
                    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                    border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  }}
                >
                  <p className="text-xs font-semibold truncate" style={{ color: active ? '#60a5fa' : 'var(--text-1)' }}>
                    {u.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-3)' }}>{u.email}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>
                    {u.captures.length} capture{u.captures.length !== 1 ? 's' : ''}
                    {avg != null && <> · avg {avg}</>}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Captures for selected user, grouped by session */}
        <div className="space-y-4 min-w-0">
          {activeUser && (
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-1)' }}>{activeUser.email}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {activeUser.captures.length} capture{activeUser.captures.length !== 1 ? 's' : ''} for this account
                </p>
              </div>
            </div>
          )}

          {activeUserCaptures.length === 0 && !loading && (
            <div className="glass py-10 text-center">
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>No captures for this user.</p>
            </div>
          )}

          {(() => {
            const groups = new Map<string, OnlineTestCapture[]>()
            for (const cap of activeUserCaptures) {
              const key = cap.session_id ?? `solo-${cap.id}`
              const arr = groups.get(key) ?? []
              arr.push(cap)
              groups.set(key, arr)
            }
            return Array.from(groups.entries()).map(([sessionKey, caps]) => {
              const head = caps[0]
              const groupLabel = sessionKey.startsWith('solo-')
                ? `Single capture · ${formatDate(head.created_at)}`
                : `Session ${sessionKey.slice(0, 8)} · ${caps.length} capture${caps.length === 1 ? '' : 's'}`
              return (
                <div key={sessionKey}>
                  <div className="flex items-center justify-between mb-2 pb-1 border-b"
                    style={{ borderColor: 'var(--border)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-3)' }}>
                      {groupLabel}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(caps)}
                      className="text-[10px] font-medium px-2 py-1 rounded-md hover:bg-red-500/10"
                      style={{ color: '#f87171', border: '1px solid var(--border)' }}
                    >
                      🗑 Delete all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {caps.map((cap) => (
                      <button
                        key={cap.id}
                        type="button"
                        onClick={() => setSelectedId(cap.id)}
                        className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/5"
                        style={{
                          background: selectedId === cap.id ? 'rgba(59,130,246,0.1)' : 'var(--surface)',
                          border: `1px solid ${selectedId === cap.id ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                        }}
                      >
                        <div
                          className="w-14 h-10 rounded-md overflow-hidden shrink-0 flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)' }}
                        >
                          {thumbUrls[cap.id] ? (
                            <img src={thumbUrls[cap.id]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">📸</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                            {formatTestType(cap.detected_test_type || cap.test_type)}
                            {cap.detected_platform && (
                              <span className="ml-2 text-xs font-normal" style={{ color: '#60a5fa' }}>· {cap.detected_platform}</span>
                            )}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                            {formatDate(cap.created_at)} · {cap.screenshot_count} img
                          </p>
                          {cap.source_url && (
                            <p className="text-[10px] truncate font-mono" style={{ color: '#60a5fa' }}>
                              {cap.source_url}
                            </p>
                          )}
                        </div>
                        <div className="text-lg font-bold shrink-0" style={{ color: scoreColor(cap.score_overall) }}>
                          {cap.score_overall != null ? Math.round(cap.score_overall) : '—'}
                        </div>
                        {isCaptureInSolved(cap.id) ? (
                          <InSolvedBadge compact />
                        ) : (
                          <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); openSendModal(cap) }}
                            className="text-base p-1 rounded-md hover:bg-blue-500/10 shrink-0 cursor-pointer select-none"
                            style={{ color: '#60a5fa' }}
                            title="Send to Solved Assessment bank"
                          >
                            📤
                          </span>
                        )}
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCapture(cap) }}
                          className="text-base p-1 rounded-md hover:bg-red-500/10 shrink-0 cursor-pointer select-none"
                          style={{
                            color: '#f87171',
                            opacity: deletingIds.has(cap.id) ? 0.4 : 1,
                            pointerEvents: deletingIds.has(cap.id) ? 'none' : undefined,
                          }}
                          title="Delete this capture"
                        >
                          {deletingIds.has(cap.id) ? '…' : '🗑'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          })()}
        </div>

        {/* Detail */}
        {selected && (
          <div className="rounded-xl p-4 self-start" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{formatTestType(selected.detected_test_type || selected.test_type)}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {selected.user_email} · {formatDate(selected.created_at)}
                  {selected.detected_platform && <> · {selected.detected_platform}</>}
                  {selected.session_id && <> · session {selected.session_id.slice(0, 8)}</>}
                </p>
                {selected.source_url && (
                  <p className="text-[11px] mt-1 font-mono break-all" style={{ color: '#60a5fa' }}>
                    {selected.source_url}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setSelectedId(null)}
                className="text-lg leading-none" style={{ color: 'var(--text-3)' }}>✕</button>
            </div>

            <div className="flex gap-4 mb-4 text-xs">
              <span style={{ color: scoreColor(selected.score_accuracy) }}>Acc {selected.score_accuracy ?? '—'}</span>
              <span style={{ color: scoreColor(selected.score_completeness) }}>Comp {selected.score_completeness ?? '—'}</span>
              <span style={{ color: scoreColor(selected.score_overall) }}>Overall {selected.score_overall ?? '—'}</span>
            </div>

            {selected.score_notes && (
              <p className="text-xs italic mb-4 p-3 rounded-lg" style={{ color: 'var(--text-2)', background: 'rgba(0,0,0,0.2)' }}>
                {selected.score_notes}
              </p>
            )}

            {detailUrls.length > 0 && (
              <div className="grid gap-3 mb-4">
                {detailUrls.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="w-full rounded-lg border"
                    style={{ borderColor: 'var(--border)' }}
                  />
                ))}
              </div>
            )}

            {selected.extracted_questions && (
              <>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Questions</p>
                <pre className="text-xs leading-relaxed p-3 rounded-lg overflow-auto max-h-80 mb-4"
                  style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selected.extracted_questions}
                </pre>
              </>
            )}

            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>AI Answer</p>
            <pre className="text-xs leading-relaxed p-3 rounded-lg overflow-auto max-h-80 mb-4"
              style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {selected.ai_answer}
            </pre>

            <div className="flex gap-2 flex-wrap items-center">
              {isCaptureInSolved(selected.id) ? (
                <InSolvedBadge />
              ) : (
                <button
                  type="button"
                  onClick={() => openSendModal(selected)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff' }}
                >
                  📤 Send to Solved Assessment bank
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDeleteCapture(selected)}
                className="text-xs font-semibold px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'var(--surface)', color: '#f87171', border: '1px solid var(--border)' }}
              >
                🗑 Delete capture
              </button>
            </div>
          </div>
        )}
      </div>
      )}
        </>
      )}

      {tab === 'solved' && (
        <>
          <input
            type="search"
            placeholder="Search platform, assessment, question, or answer…"
            value={solvedSearch}
            onChange={(e) => setSolvedSearch(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm mb-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
          />

          {solvedError && (
            <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
              {solvedError}
            </div>
          )}

          {!solvedLoading && solvedGroups.length === 0 && !solvedError && (
            <div className="glass py-14 text-center">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Nothing sent to Solved Assessment yet.</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                Open a capture and use 📤 Send to add Q&amp;A for Premium Plus users.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {solvedGroups.map(({ platform, category, items }) => {
              const groupKey = `${platform}\0${category}`
              return (
                <section key={groupKey} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: 'var(--surface)' }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{platform}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{getSolvedCategoryLabel(category)} · {items.length} question{items.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSolvedAssessment(platform, category, items)}
                      disabled={deletingSolvedGroup === groupKey}
                      className="text-[10px] font-medium px-2 py-1 rounded-md hover:bg-red-500/10 disabled:opacity-40"
                      style={{ color: '#f87171', border: '1px solid var(--border)' }}
                      title="Remove entire assessment from Solved"
                    >
                      {deletingSolvedGroup === groupKey ? 'Deleting…' : '🗑 Delete all'}
                    </button>
                  </div>
                  <ul>
                    {items.map((row) => (
                      <li key={row.id} className="border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setExpandedSolvedId(expandedSolvedId === row.id ? null : row.id)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                              {expandedSolvedId === row.id ? row.question : preview(row.question)}
                            </p>
                            {expandedSolvedId === row.id && (
                              <pre className="text-xs mt-2 p-3 rounded-lg overflow-auto max-h-60"
                                style={{ background: 'rgba(0,0,0,0.25)', color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                                {row.answer}
                              </pre>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSolvedQuestion(row)}
                            disabled={deletingSolvedId === row.id}
                            className="text-base p-1 rounded-md hover:bg-red-500/10 shrink-0 disabled:opacity-40"
                            style={{ color: '#f87171' }}
                            title="Remove from Solved Assessment"
                          >
                            {deletingSolvedId === row.id ? '…' : '🗑'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </>
      )}

      {sendModalCap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={closeSendModal}
        >
          <div
            className="w-full max-w-lg rounded-xl p-5 max-h-[90vh] overflow-y-auto"
            style={{ background: '#14141c', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                Send to Solved Assessment bank
              </h2>
              <button type="button" onClick={closeSendModal} className="text-lg leading-none" style={{ color: 'var(--text-3)' }}>
                ✕
              </button>
            </div>
            {sendDone ? (
              <div className="text-center py-10">
                <p className="text-5xl mb-3" style={{ color: '#34d399' }}>✓</p>
                <p className="text-sm font-semibold" style={{ color: '#34d399' }}>Sent</p>
              </div>
            ) : (
              <>
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
              Each blank-line-separated question becomes its own row. The same answer is attached to all of them.
            </p>

            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Platform</label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 text-sm mb-3"
              style={{ background: '#0d0d12', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              placeholder="e.g. Outlier, HackerRank, Mettl"
              value={sendPlatform}
              onChange={(e) => setSendPlatform(e.target.value)}
            />

            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Assessment hint (optional)</label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 text-sm mb-1"
              style={{ background: '#0d0d12', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              placeholder="e.g. coding, behavioural — used only as a hint"
              value={sendAssessment}
              onChange={(e) => setSendAssessment(e.target.value)}
            />
            <p className="text-[10px] mb-3" style={{ color: 'var(--text-3)' }}>
              Each question is auto-sorted into Python, SQL, Generalist, etc. based on its content.
            </p>

            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
              Questions (blank line between each)
            </label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-sm mb-3 font-mono"
              style={{ background: '#0d0d12', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              rows={6}
              value={sendQuestionsText}
              onChange={(e) => setSendQuestionsText(e.target.value)}
            />

            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Answer</label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-sm mb-3 font-mono"
              style={{ background: '#0d0d12', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              rows={8}
              value={sendAnswerText}
              onChange={(e) => setSendAnswerText(e.target.value)}
            />

            <label className="flex items-start gap-2 text-xs mb-3 cursor-pointer" style={{ color: 'var(--text-2)' }}>
              <input
                type="checkbox"
                className="mt-0.5"
                checked={sendParaphraseEnabled}
                onChange={(e) => setSendParaphraseEnabled(e.target.checked)}
              />
              <span>
                Allow users to paraphrase / humanize this answer
                <span className="block mt-1" style={{ color: 'var(--text-3)' }}>
                  Premium Plus users highlight text in the desktop app to rewrite via QuillBot.
                </span>
              </span>
            </label>

            {sendError && (
              <p className="text-xs mb-3 p-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                {sendError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeSendModal}
                disabled={sending}
                className="text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
                style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendToSolved}
                disabled={sending || (sendModalCap ? isCaptureInSolved(sendModalCap.id) : false)}
                className="text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff' }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
