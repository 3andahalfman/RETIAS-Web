'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()

  // Logged-in users skip the marketing page. getSession() reads the local
  // session (no network round-trip), so this stays fast and lets the page
  // remain statically cached at the edge.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  return (
    <div style={{ background: '#09090f', color: 'rgba(255,255,255,0.92)', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <style>{`
        .landing-hero { padding: 100px 24px 80px; }
        .landing-section { padding: 80px 24px; }
        .landing-cta-section { padding: 40px 24px 100px; }
        .cta-banner-inner { padding: 64px 40px; }
        @media (max-width: 768px) {
          .landing-hero { padding: 64px 20px 48px; }
          .landing-section { padding: 52px 20px; }
          .landing-cta-section { padding: 24px 20px 64px; }
          .cta-banner-inner { padding: 36px 24px; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(9,9,15,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', height: 60, gap: 16 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>R</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.92)' }}>RETIAS</span>
          </div>

          {/* Nav links – hidden on mobile */}
          <div className="hidden md:flex items-center" style={{ gap: 28, flex: 1 }}>
            {[['#features', 'Features'], ['#how', 'How it works'], ['/pricing', 'Pricing']].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.15s', whiteSpace: 'nowrap' }}
                onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.92)')}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}>
                {label}
              </a>
            ))}
          </div>

          {/* Spacer on mobile (pushes CTA to the right) */}
          <div className="flex-1 md:hidden" />

          {/* CTA */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <Link href="/login" className="hidden md:block" style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', padding: '7px 14px', whiteSpace: 'nowrap' }}>Sign in</Link>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: 8, padding: '7px 14px', textDecoration: 'none', boxShadow: '0 0 16px rgba(59,130,246,0.3)', whiteSpace: 'nowrap' }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero" style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 99, padding: '5px 14px', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: '#60a5fa', fontWeight: 500 }}>Real-time AI interview coaching</span>
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1.5px' }}>
          Ace every interview with<br />
          <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            real-time AI coaching
          </span>
        </h1>

        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
          RETIAS listens to your interview in real time and delivers precise, structured answers — so you can focus on performing, not memorising.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{ fontSize: 15, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: 10, padding: '13px 28px', textDecoration: 'none', boxShadow: '0 0 28px rgba(59,130,246,0.35)' }}>
            Start for free →
          </Link>
          <a href="https://github.com/3andahalfman/RETIAS/releases/latest/download/RETIAS-Setup.exe" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px 28px', textDecoration: 'none' }}>
            ⬇ Download Desktop App
          </a>
        </div>

        {/* Social proof */}
        <p style={{ marginTop: 32, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          Free to use · No credit card required · Windows desktop app available
        </p>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.5px' }}>Everything you need to land the job</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            Built for serious candidates who want an edge — without the prep burnout.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 28px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 18 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Session Types ── */}
      <section id="how" className="landing-section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.5px' }}>Three modes. Every scenario covered.</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
            Whether it&apos;s a live interview, a practice run, or a coding challenge — RETIAS has a mode for it.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {SESSION_TYPES.map(t => (
            <div key={t.title} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.borderColor}`, borderRadius: 16, padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 18 }}>
                {t.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{t.desc}</p>
              <p style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: t.color }}>{t.cta} →</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="landing-cta-section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="cta-banner-inner" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 24, textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.5px' }}>Ready to ace your next interview?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 440, margin: '0 auto 36px' }}>
            Join thousands of candidates using RETIAS to perform at their best.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ fontSize: 15, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: 10, padding: '13px 28px', textDecoration: 'none', boxShadow: '0 0 28px rgba(59,130,246,0.35)' }}>
              Create free account →
            </Link>
            <a href="https://github.com/3andahalfman/RETIAS/releases/latest/download/RETIAS-Setup.exe" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px 28px', textDecoration: 'none' }}>
              ⬇ Download Desktop App
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 20px' }}>
        <div className="footer-inner" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 12 }}>R</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>RETIAS</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['mailto:support@retias.app', 'Support'], ['https://github.com/3andahalfman/RETIAS/releases/latest', 'Download'], ['/login', 'Sign in']].map(([href, label]) => (
              <a key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} RETIAS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  { icon: '🎙️', title: 'Real-time transcription',   bg: 'rgba(59,130,246,0.15)',  desc: 'Instantly transforms spoken audio into text as the interviewer speaks, giving you the full context in real time.' },
  { icon: '🧠', title: 'Context-aware answers',     bg: 'rgba(139,92,246,0.15)', desc: 'Tailored answers based on your CV, the job description, and the specific question — not generic responses.' },
  { icon: '👁️', title: 'Stealth mode overlay',      bg: 'rgba(251,146,60,0.15)', desc: 'Invisible to screen-sharing software. Only you can see the overlay — your interviewer sees nothing.' },
  { icon: '📄', title: 'CV-aware suggestions',       bg: 'rgba(16,185,129,0.15)', desc: 'Upload your resume and RETIAS personalises every answer to match your actual experience and skills.' },
  { icon: '✨', title: 'Resume Optimizer',           bg: 'rgba(245,158,11,0.15)', desc: 'Scan your resume against any job description and get an ATS score, keyword gaps, and an AI-optimised version.' },
  { icon: '📊', title: 'Session history & analytics', bg: 'rgba(99,102,241,0.15)',desc: 'Review every session, track your progress, and identify patterns across companies and roles.' },
]

const SESSION_TYPES = [
  { icon: '🎙️', title: 'Real Interview',   bg: 'rgba(59,130,246,0.15)',  borderColor: 'rgba(59,130,246,0.2)',  color: '#60a5fa', desc: 'Use AI to analyse your answers in real time as the interviewer speaks — stay sharp without memorising scripts.', cta: 'Real Interview' },
  { icon: '🤖', title: 'Mock Interview',   bg: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399', desc: 'Practice with a simulated AI interviewer that poses realistic questions based on your target role and CV.', cta: 'Mock Interview' },
  { icon: '💻', title: 'Online Assessment & Onboarding', bg: 'rgba(251,146,60,0.15)', borderColor: 'rgba(251,146,60,0.2)', color: '#fb923c', desc: 'Get real-time AI assistance during coding challenges, MCQ assessments, and onboarding tests.', cta: 'Online Assessment & Onboarding' },
]
