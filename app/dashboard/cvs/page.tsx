'use client'

import { useEffect, useState } from 'react'
import { createClient, type CV } from '@/lib/supabase'

export default function CvManagerPage() {
  const [cvs, setCvs]         = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState<CV | null>(null)
  const [baseCvId, setBaseCvId]   = useState<string | null>(null)
  const [settingBase, setSettingBase] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data }, ] = await Promise.all([
      supabase.from('cvs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setCvs(data ?? [])
    setBaseCvId(user.user_metadata?.base_cv_id ?? null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSetBase(id: string) {
    setSettingBase(id)
    const supabase = createClient()
    await supabase.auth.updateUser({ data: { base_cv_id: id === baseCvId ? null : id } })
    setBaseCvId(id === baseCvId ? null : id)
    setSettingBase(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this CV?')) return
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('cvs').delete().eq('id', id)
    if (baseCvId === id) {
      await supabase.auth.updateUser({ data: { base_cv_id: null } })
      setBaseCvId(null)
    }
    await load()
    setDeleting(null)
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-5xl mx-auto">

      {/* Banner */}
      <div className="rounded-2xl p-6 mb-6 flex items-center justify-between gap-6 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(251,146,60,0.10))', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-1)' }}>Select a base resume to save time.</h2>
          <p className="text-sm" style={{ color: 'var(--text-2)', maxWidth: 420 }}>
            Your base resume is used by default for all new scans. Star an established resume to save time on future scans.
          </p>
        </div>
        <div className="shrink-0 text-5xl select-none opacity-60">📄✨</div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>CV Manager</h1>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {cvs.length} document{cvs.length !== 1 ? 's' : ''} · manage via the desktop app
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : cvs.length === 0 ? (
        <div className="glass py-14 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>No CVs uploaded yet.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Upload CVs from the desktop app.</p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_120px_120px_88px] px-4 py-2.5 text-xs font-semibold"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)', background: 'rgba(255,255,255,0.02)' }}>
            <span>Base</span>
            <span>Resume</span>
            <span>Created</span>
            <span>Last Modified</span>
            <span className="text-right">Actions</span>
          </div>

          {cvs.map((cv, i) => {
            const isBase = baseCvId === cv.id
            return (
              <div key={cv.id}
                className="grid grid-cols-[40px_1fr_120px_120px_88px] items-center px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: i < cvs.length - 1 ? '1px solid var(--border)' : 'none', background: isBase ? 'rgba(251,146,60,0.04)' : undefined }}>

                {/* Star */}
                <button type="button" onClick={() => handleSetBase(cv.id)} disabled={settingBase === cv.id}
                  title={isBase ? 'Remove as base resume' : 'Set as base resume'}
                  className="text-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-40">
                  {settingBase === cv.id ? '…' : isBase ? '⭐' : '☆'}
                </button>

                {/* Name */}
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{cv.name}</p>
                    {isBase && (
                      <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>BASE</span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {(cv.text?.length ?? 0).toLocaleString()} chars
                  </p>
                </div>

                {/* Created */}
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{fmt(cv.created_at)}</p>

                {/* Modified — same as created since we don't track updates */}
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{fmt(cv.created_at)}</p>

                {/* Actions */}
                <div className="flex items-center gap-4 justify-end">
                  <button type="button" onClick={() => setPreviewing(cv)}
                    title="Preview" className="text-base transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-3)' }}>👁</button>
                  <button type="button" onClick={() => handleDelete(cv.id)} disabled={deleting === cv.id}
                    title="Delete" className="text-base transition-opacity hover:opacity-70 disabled:opacity-30"
                    style={{ color: deleting === cv.id ? 'var(--text-3)' : '#f87171' }}>
                    {deleting === cv.id ? '…' : '🗑'}
                  </button>
                </div>
              </div>
            )
          })}

          <div className="px-4 py-2.5 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-3)' }}>
            Showing 1–{cvs.length} of {cvs.length}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setPreviewing(null)}>
          <div className="glass p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{previewing.name}</p>
              <button type="button" onClick={() => setPreviewing(null)}
                className="text-lg leading-none" style={{ color: 'var(--text-3)' }}>✕</button>
            </div>
            <pre className="flex-1 text-xs leading-relaxed overflow-auto rounded-lg p-4"
              style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {previewing.text ?? 'No text content.'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
