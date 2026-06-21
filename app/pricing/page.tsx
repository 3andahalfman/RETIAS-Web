'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import PaystackCheckout from '@/components/PaystackCheckout'

const PLAN_PRO = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO as string
const PLAN_PLUS = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PLUS as string

interface Sub { status: string; tier: string | null; current_period_end: string | null }

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [sub, setSub] = useState<Sub | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null)
      if (data.user) {
        const { data: s } = await supabase
          .from('subscriptions')
          .select('status, tier, current_period_end')
          .eq('user_id', data.user.id)
          .maybeSingle()
        setSub(s as Sub | null)
      }
      setAuthChecked(true)
    })
  }, [])

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Account'
  const initials = displayName.slice(0, 2).toUpperCase()

  // Active subscription = paid access right now (drives the double-payment guard UI)
  const isActive = !!sub && sub.status === 'active' &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date())
  const currentTier = isActive ? sub!.tier : null

  // One CTA per paid tier — never offers a second checkout when one is active.
  function renderCta(tier: 'pro' | 'plus', planCode: string, gradient: string, label: string) {
    if (!authChecked) {
      return <div style={ctaBoxStyle('rgba(255,255,255,0.06)')}>…</div>
    }
    if (isActive && currentTier === tier) {
      return <div style={ctaBoxStyle('rgba(52,211,153,0.15)', '#34d399')}>✓ Your current plan</div>
    }
    const btnStyle: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#fff', background: gradient, border: 'none', borderRadius: 10, padding: '11px 0', cursor: 'pointer', fontFamily: 'inherit' }
    if (isActive && currentTier !== tier) {
      // Switch plans: cancels the current subscription, then checks out the new one
      const switchLabel = tier === 'plus' ? 'Upgrade to Pro Plus' : 'Switch to Pro'
      return (
        <PaystackCheckout planCode={planCode} replaceActive style={btnStyle}>
          {switchLabel}
        </PaystackCheckout>
      )
    }
    return (
      <PaystackCheckout planCode={planCode} style={btnStyle}>
        {label}
      </PaystackCheckout>
    )
  }

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
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 14, letterSpacing: '-1px' }}>Simple pricing</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Start free. Upgrade when you&apos;re ready.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 1060, margin: '0 auto' }}>
          {/* Free */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Free</p>
            <p style={{ fontSize: 42, fontWeight: 800, marginBottom: 4 }}>₦0</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Forever free</p>
            {FREE_FEATURES.map(f => <FeatureRow key={f} label={f} />)}
            <div style={{ marginTop: 'auto', paddingTop: 28 }}>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '11px 0', textDecoration: 'none' }}>
                Get started
              </Link>
            </div>
          </div>

          {/* Pro */}
          <div style={{ background: 'linear-gradient(145deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, padding: 32, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -1, right: 20, background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', borderRadius: '0 0 8px 8px', padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fff' }}>POPULAR</div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Pro</p>
            <p style={{ fontSize: 42, fontWeight: 800, marginBottom: 4 }}>₦10,000</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>per month</p>
            {PRO_FEATURES.map(f => <FeatureRow key={f} label={f} accent />)}
            <div style={{ marginTop: 'auto', paddingTop: 28 }}>
              {renderCta('pro', PLAN_PRO, 'linear-gradient(135deg,#3b82f6,#2563eb)', 'Upgrade to Pro')}
            </div>
          </div>

          {/* Pro Plus */}
          <div style={{ background: 'linear-gradient(145deg, rgba(245,158,11,0.10), rgba(251,146,60,0.06))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: 32, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Pro Plus</p>
            <p style={{ fontSize: 42, fontWeight: 800, marginBottom: 4 }}>₦25,000</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>per month</p>
            {PRO_PLUS_FEATURES.map(f => <FeatureRow key={f} label={f} gold />)}
            <div style={{ marginTop: 'auto', paddingTop: 28 }}>
              {renderCta('plus', PLAN_PLUS, 'linear-gradient(135deg,#f59e0b,#d97706)', 'Upgrade to Pro Plus')}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          Secure payments by Paystack · Cancel anytime
        </p>
      </section>
    </div>
  )
}

function ctaBoxStyle(bg: string, color = 'rgba(255,255,255,0.8)'): React.CSSProperties {
  return { display: 'block', width: '100%', textAlign: 'center', fontSize: 14, fontWeight: 600, color, background: bg, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 0' }
}

function FeatureRow({ label, accent, gold }: { label: string; accent?: boolean; gold?: boolean }) {
  const checkColor = gold ? '#fbbf24' : accent ? '#60a5fa' : '#34d399'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 14, color: checkColor }}>✓</span>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>{label}</span>
    </div>
  )
}

const FREE_FEATURES = ['5 sessions per month', 'Real-time transcription', 'Mock Interview mode', 'Session history', 'CV Manager (3 CVs)']
const PRO_FEATURES  = ['Unlimited sessions', 'AI Screen Analysis', 'Manual prompt bar', 'Online Assessment & Onboarding', 'Resume Optimizer', 'Unlimited CV storage', 'Priority support']
const PRO_PLUS_FEATURES = ['Everything in Pro', 'Top-tier AI (Claude Opus & GPT-5)', 'Custom branded reports & exports', 'Early access to new features', 'Dedicated support channel']
