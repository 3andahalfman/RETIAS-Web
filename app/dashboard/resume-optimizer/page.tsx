'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import type { CV } from '@/lib/supabase'

// ── ATS keyword scanner ────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','and','for','are','but','not','you','all','can','her','was','one',
  'our','out','day','get','has','him','his','how','its','may','new','now',
  'old','see','two','way','who','boy','did','let','put','say','she','too',
  'use','that','this','with','have','from','they','will','been','each',
  'from','which','their','there','what','were','when','your','more','also',
  'into','than','then','them','these','some','such','well','both','just',
  'over','back','after','years','about','other','could','would','should',
  'must','need','work','role','team','job','company','position','including',
  'experience','ability','strong','skills','excellent','understanding','good',
  'knowledge','working','proven','demonstrated','responsible','responsibilities',
])

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^[-.]|[-.]$/g, '').trim())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))

  // Also extract 2-word phrases (bigrams) that look like skills
  const tokens = text.toLowerCase().split(/\s+/)
  const bigrams: string[] = []
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`.replace(/[^a-z0-9+# ]/g, '')
    if (bigram.length > 5 && !STOP_WORDS.has(tokens[i]) && !STOP_WORDS.has(tokens[i + 1])) {
      bigrams.push(bigram)
    }
  }

  const unique = Array.from(new Set([...words, ...bigrams]))
  return unique.slice(0, 80) // cap at 80 keywords
}

function scanATS(resume: string, jd: string) {
  const jdKeywords = extractKeywords(jd)
  const resumeLower = resume.toLowerCase()

  const matched: string[] = []
  const missing: string[] = []

  jdKeywords.forEach(kw => {
    if (resumeLower.includes(kw)) matched.push(kw)
    else missing.push(kw)
  })

  const score = jdKeywords.length > 0
    ? Math.round((matched.length / jdKeywords.length) * 100)
    : 0

  return { score, matched, missing, total: jdKeywords.length }
}

// ── Score ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const fill = circ - (score / 100) * circ
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#fb923c' : '#f87171'

  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x="48" y="52" textAnchor="middle" fill={color}
        fontSize="18" fontWeight="700">{score}%</text>
    </svg>
  )
}

// ── Loading tips carousel ──────────────────────────────────────────────────

const TIPS = [
  { icon: '💡', title: 'Nice-to-Have ≠ Must-Have', body: 'Adding every mentioned skill often reduces clarity and focus.' },
  { icon: '🎯', title: 'Tailor, Don\'t Fabricate', body: 'Reframe real experience in the language of the job description.' },
  { icon: '📊', title: 'Numbers Win', body: 'Quantify achievements — "increased sales by 30%" beats "improved sales".' },
  { icon: '🤖', title: 'Beat the Bots', body: 'ATS systems scan for exact keywords. Mirror the JD\'s terminology.' },
  { icon: '✂️', title: 'One Page Rule', body: 'Unless you have 10+ years of experience, keep it to one page.' },
]

function LoadingTips() {
  const [idx, setIdx] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)
    const start = Date.now()
    const duration = 3500
    const frame = setInterval(() => {
      const p = Math.min(((Date.now() - start) / duration) * 100, 100)
      setProgress(p)
      if (p >= 100) {
        clearInterval(frame)
        setIdx(i => (i + 1) % TIPS.length)
      }
    }, 30)
    return () => clearInterval(frame)
  }, [idx])

  const tip = TIPS[idx]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="glass p-7 w-full max-w-md mx-4"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-6 overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-none"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />
        </div>

        {/* Tip */}
        <div className="flex gap-4 mb-6">
          <span className="text-2xl shrink-0 mt-0.5">{tip.icon}</span>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>{tip.title}</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{tip.body}</p>
          </div>
        </div>

        {/* Dots + button */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {TIPS.map((_, i) => (
              <button key={i} type="button" onClick={() => setIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === idx ? 20 : 8, height: 8,
                  background: i === idx ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                }} />
            ))}
          </div>
          <button type="button" onClick={() => setIdx(i => (i + 1) % TIPS.length)}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--surface-hv)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            Next tip
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

type Tab = 'optimized' | 'cover-letter'
type Mode = 'idle' | 'scanning' | 'scanned' | 'optimizing' | 'done'

export default function ResumeOptimizerPage() {
  const [resume, setResume]       = useState('')
  const [jd, setJd]               = useState('')
  const [mode, setMode]           = useState<Mode>('idle')
  const [ats, setAts]             = useState<ReturnType<typeof scanATS> | null>(null)
  const [optimized, setOptimized] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('optimized')
  const [error, setError]         = useState('')
  const [savedCvs, setSavedCvs]     = useState<CV[]>([])
  const [showCvs, setShowCvs]       = useState(false)
  const [loadingCvs, setLoadingCvs] = useState(false)
  const [coverLoading, setCoverLoading] = useState(false)
  const [fileLoading, setFileLoading]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router  = useRouter()

  async function loadSavedCvs() {
    setLoadingCvs(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('cvs').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setSavedCvs(data ?? [])
    setLoadingCvs(false)
    setShowCvs(true)
  }

  async function handleFile(file: File) {
    setFileLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await authFetch('/api/extract-resume', { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResume(data.text ?? '')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setFileLoading(false)
    }
  }

  async function handleScan() {
    if (!(resume ?? '').trim() || !(jd ?? '').trim()) {
      setError('Paste both your resume and the job description first.')
      return
    }
    setError('')
    setMode('scanning')
    try {
      const res = await authFetch('/api/resume-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      sessionStorage.setItem('retias-scan-result', JSON.stringify(data))
      sessionStorage.setItem('retias-scan-resume', resume)
      sessionStorage.setItem('retias-scan-jd', jd)
      router.push('/dashboard/resume-optimizer/results')
    } catch (e: any) {
      setError(e.message)
      setMode('idle')
    }
  }

  async function handleOptimize() {
    if (!resume.trim() || !jd.trim()) {
      setError('Paste both your resume and the job description first.')
      return
    }
    setError('')
    setMode('optimizing')
    try {
      const res = await authFetch('/api/resume-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jd, mode: 'optimize' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOptimized(data.optimized)
      setAts(scanATS(data.optimized, jd))
      setMode('done')
      setActiveTab('optimized')
    } catch (e: any) {
      setError(e.message)
      setMode('scanned')
    }
  }

  async function handleCoverLetter() {
    setCoverLoading(true)
    try {
      const res = await authFetch('/api/resume-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: optimized || resume, jobDescription: jd, mode: 'cover-letter' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCoverLetter(data.coverLetter)
      setActiveTab('cover-letter')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCoverLoading(false)
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text)
  }

  const canAction = (resume ?? '').trim().length > 50 && (jd ?? '').trim().length > 50
  const isWorking = mode === 'scanning' || mode === 'optimizing'

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Resume Optimizer</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          Scan for ATS keywords and AI-optimize your resume for any job.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Input panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Resume */}
        <div className="glass flex flex-col" style={{ minHeight: 340 }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>📄 Your Resume</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={loadSavedCvs}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--surface-hv)', color: 'var(--text-2)' }}>
                ☆ Saved CVs
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={fileLoading}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                style={{ background: 'var(--surface-hv)', color: 'var(--text-2)' }}>
                {fileLoading ? <Spinner /> : '⬆'} Upload PDF / DOCX / TXT
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = '' }} />
            </div>
          </div>

          {/* Saved CVs dropdown */}
          {showCvs && (
            <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              {loadingCvs ? (
                <p className="text-xs py-1" style={{ color: 'var(--text-3)' }}>Loading…</p>
              ) : savedCvs.length === 0 ? (
                <p className="text-xs py-1" style={{ color: 'var(--text-3)' }}>No saved CVs found. Upload one in the CVs tab.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {savedCvs.map(cv => (
                    <button key={cv.id} type="button"
                      onClick={() => { setResume(cv.text ?? ''); setShowCvs(false) }}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--blue-l)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      {cv.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <textarea
            value={resume}
            onChange={e => setResume(e.target.value)}
            placeholder="Paste your resume here…"
            className="flex-1 w-full p-4 text-sm resize-none bg-transparent outline-none"
            style={{ color: 'var(--text-1)', minHeight: 260 }} />

          <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              {(resume ?? '').trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
        </div>

        {/* Job Description */}
        <div className="glass flex flex-col" style={{ minHeight: 340 }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>💼 Job Description</span>
          </div>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste the job description here…"
            className="flex-1 w-full p-4 text-sm resize-none bg-transparent outline-none"
            style={{ color: 'var(--text-1)', minHeight: 280 }} />
          <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              {(jd ?? '').trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={handleScan} disabled={!canAction || isWorking}
          className="btn-ghost text-sm px-5 py-2.5 flex items-center gap-2">
          {mode === 'scanning' ? <Spinner /> : '🔍'} Scan ATS Match
        </button>
        <button type="button" onClick={handleOptimize} disabled={!canAction || isWorking}
          className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
          {mode === 'optimizing' ? <Spinner /> : '✨'} AI Optimize Resume
        </button>
        {mode === 'done' && (
          <button type="button" onClick={handleCoverLetter} disabled={coverLoading}
            className="btn-ghost text-sm px-5 py-2.5 flex items-center gap-2">
            {coverLoading ? <Spinner /> : '✉️'} Generate Cover Letter
          </button>
        )}
      </div>

      {/* Loading tips */}
      {(mode === 'scanning' || mode === 'optimizing') && <LoadingTips />}

      {/* ATS Results */}
      {ats && (
        <div className="glass p-5 mb-4">
          <div className="flex items-start gap-6">
            <div className="shrink-0 flex flex-col items-center gap-1">
              <ScoreRing score={ats.score} />
              <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>ATS Match</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
                  ✓ {ats.matched.length} matched
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                  ✗ {ats.missing.length} missing
                </span>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                  from {ats.total} JD keywords
                </span>
              </div>

              {ats.missing.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Missing keywords to add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ats.missing.slice(0, 30).map(kw => (
                      <span key={kw} className="text-xs px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                        {kw}
                      </span>
                    ))}
                    {ats.missing.length > 30 && (
                      <span className="text-xs px-2 py-0.5 rounded-md" style={{ color: 'var(--text-3)' }}>
                        +{ats.missing.length - 30} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {ats.matched.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Matched keywords:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ats.matched.slice(0, 20).map(kw => (
                      <span key={kw} className="text-xs px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                        {kw}
                      </span>
                    ))}
                    {ats.matched.length > 20 && (
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>+{ats.matched.length - 20} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Output tabs */}
      {mode === 'done' && (
        <div className="glass overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex gap-1">
              {(['optimized', 'cover-letter'] as Tab[]).map(tab => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  style={{
                    background: activeTab === tab ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: activeTab === tab ? 'var(--blue-l)' : 'var(--text-2)',
                    border: activeTab === tab ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                  }}>
                  {tab === 'optimized' ? '✨ Optimized Resume' : '✉️ Cover Letter'}
                </button>
              ))}
            </div>
            <button type="button"
              onClick={() => copyText(activeTab === 'optimized' ? optimized : coverLetter)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'var(--surface-hv)', color: 'var(--text-2)' }}>
              📋 Copy
            </button>
          </div>

          <pre className="p-5 text-sm whitespace-pre-wrap overflow-auto"
            style={{ color: 'var(--text-1)', fontFamily: 'inherit', maxHeight: 520, lineHeight: 1.65 }}>
            {activeTab === 'optimized'
              ? (optimized || 'Running AI optimization…')
              : (coverLetter || 'Click "Generate Cover Letter" above.')}
          </pre>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
  )
}
