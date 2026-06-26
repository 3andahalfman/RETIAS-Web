'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import PlanCards from '@/components/PlanCards'

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setAuthChecked(true)
    })
  }, [])

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Account'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div style={{ background: '#09090f', color: 'rgba(255,255,255,0.92)', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <style>{`
        .pricing-section { padding: 72px 24px 100px; }
        @media (max-width: 768px) { .pricing-section { padding: 48px 20px 64px; } }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(9,9,15,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', height: 60, gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>R</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.92)' }}>RETIAS</span>
          </Link>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <Link href="/" style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', padding: '7px 14px', whiteSpace: 'nowrap' }}>Home</Link>
            {authChecked && (user ? (
              <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '5px 12px 5px 5px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#fb923c)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
              </Link>
            ) : (
              <Link href="/login?next=/pricing" style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', borderRadius: 8, padding: '7px 14px', textDecoration: 'none', boxShadow: '0 0 16px rgba(59,130,246,0.3)', whiteSpace: 'nowrap' }}>
                Sign in
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Pricing ── */}
      <section className="pricing-section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 14, letterSpacing: '-1px' }}>Simple pricing</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            Start free with interviews, stealth mode, and Auto-Typer. Upgrade for screenshot analysis, Online Assessment, and the Solved Q&A library with Go Live and paraphrase tools.
          </p>
        </div>
        <PlanCards />
      </section>
    </div>
  )
}
