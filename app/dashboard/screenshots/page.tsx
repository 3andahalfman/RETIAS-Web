'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'admin@retias.com'
const STORAGE_BUCKET = 'online-test-screenshots'

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
  const supabase = createClient()
  if (paths.length) {
    const { error: storageErr } = await supabase.storage.from(STORAGE_BUCKET).remove(paths)
    if (storageErr) console.warn('[ScreenshotLibrary] storage delete error:', storageErr.message)
  }
  const { error } = await supabase.from('online_test_captures').delete().in('id', ids)
  if (error) throw new Error(error.message)
}

export default function ScreenshotLibraryPage() {
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
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const [sendParaphraseEnabled, setSendParaphraseEnabled] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || (user.email ?? '').toLowerCase() !== ADMIN_EMAIL) {
      setForbidden(true)
      setLoading(false)
      return
    }

    const { data: rows, error: listErr } = await supabase
      .from('online_test_captures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (listErr) {
      setError(listErr.message)
      setLoading(false)
      return
    }

    const rowsTyped = (rows ?? []) as OnlineTestCapture[]
    setCaptures(rowsTyped)

    const { data: statsRows } = await supabase
      .from('online_test_captures')
      .select('user_id, score_overall')

    const totalCaptures = statsRows?.length ?? 0
    const scored = (statsRows ?? []).filter((r) => r.score_overall != null)
    const avg = scored.length
      ? scored.reduce((sum, r) => sum + Number(r.score_overall), 0) / scored.length
      : null
    setStats({
      totalCaptures,
      avgOverallScore: avg != null ? Math.round(avg * 10) / 10 : null,
      uniqueUsers: new Set((statsRows ?? []).map((r) => r.user_id)).size,
    })

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

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
    setSendModalCap(cap)
    setSendPlatform(cap.detected_platform ?? '')
    setSendAssessment(cap.detected_test_type ?? '')
    setSendQuestionsText(cap.extracted_questions ?? '')
    setSendAnswerText(cap.ai_answer ?? '')
    setSendParaphraseEnabled(false)
    setSendError(null)
    setSendSuccess(null)
  }, [])

  const closeSendModal = useCallback(() => {
    setSendModalCap(null)
    setSending(false)
    setSendError(null)
    setSendSuccess(null)
  }, [])

  const handleSendToSolved = useCallback(async () => {
    if (!sendModalCap) return
    setSending(true)
    setSendError(null)
    setSendSuccess(null)
    try {
      const platform = sendPlatform.trim()
      const assessment = sendAssessment.trim()
      const answer = sendAnswerText.trim()
      if (!platform || !assessment) throw new Error('Platform and assessment type are required.')
      if (!answer) throw new Error('Answer cannot be empty.')

      const questions = sendQuestionsText
        .split(/\n\s*\n+/)
        .map((q) => q.trim())
        .filter(Boolean)
      if (!questions.length) {
        throw new Error('No questions to send. Add at least one question (separate multiple with a blank line).')
      }

      const supabase = createClient()
      const rows = questions.map((q) => ({
        platform,
        assessment_type: assessment,
        question: q,
        answer,
        answer_variants: [] as string[],
        paraphrase_enabled: sendParaphraseEnabled,
        source_capture_id: sendModalCap.id,
        source_url: sendModalCap.source_url,
      }))

      const { error } = await supabase.from('solved_questions').insert(rows)
      if (error) throw new Error(error.message)
      setSendSuccess(
        `Added ${rows.length} question${rows.length === 1 ? '' : 's'} to the Solved Assessment bank` +
        (sendParaphraseEnabled ? ' (users can highlight to paraphrase/humanize).' : '.'),
      )
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send to Solved Assessment bank.')
    } finally {
      setSending(false)
    }
  }, [sendModalCap, sendPlatform, sendAssessment, sendQuestionsText, sendAnswerText, sendParaphraseEnabled])

  const selected = captures.find((c) => c.id === selectedId) ?? null

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Screenshot Library</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            Scored online-test captures from all users — admin only.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="text-xs font-semibold px-3 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

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

      <div className="grid gap-4" style={{ gridTemplateColumns: selected ? '1fr 1fr' : '1fr' }}>
        {/* List, grouped by session */}
        <div className="space-y-4">
          {(() => {
            const groups = new Map<string, OnlineTestCapture[]>()
            for (const cap of captures) {
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
                      <span>{groupLabel}</span>
                      <span className="ml-2 opacity-70">{head.user_email}</span>
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
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); openSendModal(cap) }}
                          className="text-base p-1 rounded-md hover:bg-blue-500/10 shrink-0 cursor-pointer select-none"
                          style={{ color: '#60a5fa' }}
                          title="Send to Solved Assessment bank"
                        >
                          📤
                        </span>
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openSendModal(selected)}
                className="text-xs font-semibold px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff' }}
              >
                📤 Send to Solved Assessment bank
              </button>
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

      {sendModalCap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={closeSendModal}
        >
          <div
            className="w-full max-w-lg rounded-xl p-5 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
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
            <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
              Each blank-line-separated question becomes its own row. The same answer is attached to all of them.
            </p>

            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Platform</label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 text-sm mb-3"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              placeholder="e.g. Outlier, HackerRank, Mettl"
              value={sendPlatform}
              onChange={(e) => setSendPlatform(e.target.value)}
            />

            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Assessment Type</label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 text-sm mb-3"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              placeholder="e.g. Aether Onboarding, Skill: Python"
              value={sendAssessment}
              onChange={(e) => setSendAssessment(e.target.value)}
            />

            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>
              Questions (blank line between each)
            </label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-sm mb-3 font-mono"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              rows={6}
              value={sendQuestionsText}
              onChange={(e) => setSendQuestionsText(e.target.value)}
            />

            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Answer</label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-sm mb-3 font-mono"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
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
            {sendSuccess && (
              <p className="text-xs mb-3 p-2 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                {sendSuccess}
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
                disabled={sending}
                className="text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff' }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
