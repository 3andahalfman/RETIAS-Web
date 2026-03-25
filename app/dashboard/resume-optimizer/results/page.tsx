'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

interface SkillRow   { skill: string; resumeCount: number; jdCount: number }
interface CheckItem  { label: string; status: 'pass' | 'fail' | 'warn'; detail: string }
interface TipItem    { label: string; status: 'pass' | 'fail'; detail: string }
interface FmtSection { category: string; tips: string[] }

interface ScanResult {
  score: number
  jobTitle: string
  searchability: { score: number; issues: number; items: CheckItem[] }
  hardSkills:    { score: number; issues: number; matched: SkillRow[]; missing: SkillRow[] }
  softSkills:    { score: number; issues: number; matched: SkillRow[]; missing: SkillRow[] }
  recruiterTips: { score: number; issues: number; items: TipItem[] }
  formatting:    { items: FmtSection[] }
}

// ── Score ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 44, circ = 2 * Math.PI * r
  const fill = circ - (score / 100) * circ
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#fb923c' : '#f87171'
  return (
    <svg width="112" height="112" viewBox="0 0 112 112">
      <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
      <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round"
        transform="rotate(-90 56 56)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x="56" y="60" textAnchor="middle" fill={color} fontSize="20" fontWeight="700">{score}%</text>
    </svg>
  )
}

// ── Mini bar ───────────────────────────────────────────────────────────────
function MiniBar({ score, issues, label, active, onClick }: {
  score: number; issues: number; label: string; active: boolean; onClick: () => void
}) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#fb923c' : '#f87171'
  return (
    <button type="button" onClick={onClick} className="w-full text-left px-3 py-2 rounded-lg transition-colors"
      style={{ background: active ? 'rgba(59,130,246,0.12)' : 'transparent' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: active ? '#60a5fa' : 'var(--text-2)' }}>{label}</span>
        {issues > 0
          ? <span className="text-[10px] font-semibold" style={{ color: '#f87171' }}>{issues} issue{issues > 1 ? 's' : ''}</span>
          : <span className="text-[10px] font-semibold" style={{ color: '#4ade80' }}>✓</span>}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color, transition: 'width 0.6s ease' }} />
      </div>
    </button>
  )
}

// ── Status icon ────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: 'pass' | 'fail' | 'warn' }) {
  if (status === 'pass') return <span className="text-base" style={{ color: '#4ade80' }}>✓</span>
  if (status === 'fail') return <span className="text-base font-bold" style={{ color: '#f87171' }}>✗</span>
  return <span className="text-base" style={{ color: '#fb923c' }}>!</span>
}

// ── Badge ──────────────────────────────────────────────────────────────────
function Badge({ label, variant }: { label: string; variant: 'important' | 'high' | 'medium' }) {
  const styles = {
    important: { background: 'rgba(248,113,113,0.15)', color: '#f87171' },
    high:      { background: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
    medium:    { background: 'rgba(250,204,21,0.15)',  color: '#fbbf24' },
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ml-2"
      style={styles[variant]}>
      {label}
    </span>
  )
}

// ── Skills table ───────────────────────────────────────────────────────────
function SkillsTable({ matched, missing }: { matched: SkillRow[]; missing: SkillRow[] }) {
  const all = [
    ...matched.map(s => ({ ...s, found: true })),
    ...missing.map(s => ({ ...s, found: false })),
  ].sort((a, b) => b.jdCount - a.jdCount)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="grid grid-cols-3 px-4 py-2.5 text-xs font-semibold"
        style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>
        <span>Skill</span>
        <span className="text-center">Resume</span>
        <span className="text-center">Job Description</span>
      </div>
      {all.map((row, i) => (
        <div key={i} className="grid grid-cols-3 px-4 py-3 items-center text-sm"
          style={{ borderBottom: i < all.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <span style={{ color: 'var(--text-1)' }}>{row.skill}</span>
          <span className="text-center font-medium" style={{ color: row.found ? 'var(--blue-l)' : '#f87171' }}>
            {row.found ? row.resumeCount : '✗'}
          </span>
          <span className="text-center" style={{ color: row.jdCount > 2 ? 'var(--blue-l)' : 'var(--text-2)' }}>
            {row.jdCount}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
type Section = 'searchability' | 'hardSkills' | 'softSkills' | 'recruiterTips' | 'formatting'

export default function ScanResultsPage() {
  const router = useRouter()
  const [data, setData]         = useState<ScanResult | null>(null)
  const [active, setActive]     = useState<Section>('searchability')
  const [activeTab, setActiveTab] = useState<'report' | 'jd'>('report')
  const [resume, setResume]     = useState('')
  const [jd, setJd]             = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('retias-scan-result')
    const r   = sessionStorage.getItem('retias-scan-resume')
    const j   = sessionStorage.getItem('retias-scan-jd')
    if (!raw) { router.replace('/dashboard/resume-optimizer'); return }
    setData(JSON.parse(raw))
    setResume(r ?? '')
    setJd(j ?? '')
  }, [router])

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  const sections: { key: Section; label: string; score: number; issues: number }[] = [
    { key: 'searchability', label: 'Searchability',   score: data.searchability.score,  issues: data.searchability.issues },
    { key: 'hardSkills',    label: 'Hard Skills',     score: data.hardSkills.score,     issues: data.hardSkills.issues },
    { key: 'softSkills',    label: 'Soft Skills',     score: data.softSkills.score,     issues: data.softSkills.issues },
    { key: 'recruiterTips', label: 'Recruiter Tips',  score: data.recruiterTips.score,  issues: data.recruiterTips.issues },
    { key: 'formatting',    label: 'Formatting',      score: 70,                        issues: 0 },
  ]

  return (
    <div className="flex gap-6 min-h-screen">

      {/* ── Left sidebar ── */}
      <aside className="w-52 shrink-0 flex flex-col gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Resume scan results</p>
          <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-1)' }}>{data.jobTitle}</p>
        </div>

        <div className="glass p-4 flex flex-col items-center gap-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Match Rate</p>
          <ScoreRing score={data.score} />
        </div>

        <button type="button" onClick={() => router.push('/dashboard/resume-optimizer')}
          className="btn-primary text-xs py-2 text-center">
          ⬆ Upload &amp; Rescan
        </button>

        <div className="glass p-2 flex flex-col gap-1">
          {sections.map(s => (
            <MiniBar key={s.key} label={s.label} score={s.score} issues={s.issues}
              active={active === s.key} onClick={() => setActive(s.key)} />
          ))}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">

        {/* Tabs */}
        <div className="flex mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          {(['report', 'jd'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-medium transition-colors"
              style={{
                color: activeTab === tab ? 'var(--text-1)' : 'var(--text-3)',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: -1,
              }}>
              {tab === 'report' ? 'Resume Report' : 'Job Description'}
            </button>
          ))}
        </div>

        {activeTab === 'jd' ? (
          <div className="glass p-6 prose-jd overflow-auto" style={{ maxHeight: 640 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{jd}</ReactMarkdown>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Searchability ── */}
            {active === 'searchability' && (
              <section>
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Searchability</h2>
                  <Badge label="Important" variant="important" />
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>
                  An ATS is used by 90% of companies to search and filter resumes. Below is how well your resume appears to an ATS and recruiter search.
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
                  Tip: Fix the red ✗ issues to ensure your resume is easily searchable and parsed correctly by the ATS.
                </p>
                <div className="glass overflow-hidden">
                  {data.searchability.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 px-5 py-4"
                      style={{ borderBottom: i < data.searchability.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span className="text-sm font-semibold w-40 shrink-0 pt-0.5" style={{ color: 'var(--text-2)' }}>{item.label}</span>
                      <StatusIcon status={item.status} />
                      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{item.detail}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Hard Skills ── */}
            {active === 'hardSkills' && (
              <section>
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Hard Skills</h2>
                  <Badge label="High Score Impact" variant="high" />
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>
                  Hard skills are job-specific abilities you can learn through training. They have a high impact on your match score.
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
                  Tip: Match skills to the exact spelling in the job description. Prioritise skills that appear most frequently.
                </p>
                <SkillsTable matched={data.hardSkills.matched} missing={data.hardSkills.missing} />
              </section>
            )}

            {/* ── Soft Skills ── */}
            {active === 'softSkills' && (
              <section>
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Soft Skills</h2>
                  <Badge label="Medium Score Impact" variant="medium" />
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>
                  Soft skills are personal traits that make you a good employee — communication, leadership, teamwork. They have medium impact on your match score.
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
                  Tip: Prioritise hard skills first to get interviews, then showcase soft skills to get the job.
                </p>
                <SkillsTable matched={data.softSkills.matched} missing={data.softSkills.missing} />
              </section>
            )}

            {/* ── Recruiter Tips ── */}
            {active === 'recruiterTips' && (
              <section>
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Recruiter Tips</h2>
                  <Badge label="Important" variant="important" />
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
                  These tips help you stand out to human recruiters reviewing your resume after it passes the ATS.
                </p>
                <div className="glass overflow-hidden">
                  {data.recruiterTips.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 px-5 py-4"
                      style={{ borderBottom: i < data.recruiterTips.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span className="text-sm font-semibold w-40 shrink-0 pt-0.5" style={{ color: 'var(--text-2)' }}>{item.label}</span>
                      <StatusIcon status={item.status} />
                      <span className="text-sm" style={{ color: 'var(--text-2)' }}>{item.detail}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Formatting ── */}
            {active === 'formatting' && (
              <section>
                <div className="flex items-center mb-1">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Formatting</h2>
                </div>
                <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: '#fb923c' }}>
                  ⚠ Formatting analysis is based on plain text. For full formatting checks, upload your resume as .docx.
                </div>
                <div className="glass overflow-hidden">
                  {data.formatting.items.map((section, si) => (
                    <div key={si} style={{ borderBottom: si < data.formatting.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div className="flex items-start gap-6 px-5 py-4">
                        <span className="text-sm font-semibold w-28 shrink-0 pt-0.5" style={{ color: 'var(--text-2)' }}>{section.category}</span>
                        <div className="flex flex-col gap-2">
                          {section.tips.map((tip, ti) => (
                            <div key={ti} className="flex items-start gap-2">
                              <span className="mt-0.5 shrink-0" style={{ color: 'var(--text-3)' }}>⊖</span>
                              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Optimize CTA */}
            <div className="glass p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Ready to optimise?</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Let AI rewrite your resume to fix all the issues above.</p>
              </div>
              <button type="button"
                onClick={() => router.push('/dashboard/resume-optimizer')}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 shrink-0">
                ✨ AI Optimise Resume
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
