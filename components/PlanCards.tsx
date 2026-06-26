'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import PaystackCheckout from '@/components/PaystackCheckout'
import { ALL_PLAN_INCLUDES, PLAN_FEATURES } from '@/lib/plan-features'

const PLAN_PRO = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO as string
const PLAN_PLUS = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PLUS as string

// Display prices in USD; Paystack plans bill the NGN equivalent at checkout.
const PRICE_FREE = '$0'
const PRICE_PRO = '$10'
const PRICE_PLUS = '$25'

interface Sub { status: string; tier: string | null; current_period_end: string | null }

// The three plan cards + checkout/guard logic. Reused by /pricing and the modal.
export default function PlanCards() {
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

  const isActive = !!sub && sub.status === 'active' &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date())
  const currentTier = isActive ? sub!.tier : null
  const loggedIn = authChecked && !!user

  function renderCta(tier: 'pro' | 'plus', planCode: string, gradient: string, label: string) {
    if (!authChecked) return <div style={ctaBoxStyle('rgba(255,255,255,0.06)')}>…</div>
    if (!loggedIn) {
      return (
        <Link href={`/login?next=/pricing`} style={{ ...ctaBoxStyle('rgba(255,255,255,0.07)'), textDecoration: 'none' }}>
          Sign in to subscribe
        </Link>
      )
    }
    if (isActive && currentTier === tier) {
      return <div style={ctaBoxStyle('rgba(52,211,153,0.15)', '#34d399')}>✓ Your current plan</div>
    }
    const btnStyle: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#fff', background: gradient, border: 'none', borderRadius: 10, padding: '11px 0', cursor: 'pointer', fontFamily: 'inherit' }
    const planName = tier === 'plus' ? 'Premium Plus' : 'Premium'
    if (isActive && currentTier !== tier) {
      const switchLabel = tier === 'plus' ? 'Upgrade to Premium Plus' : 'Switch to Premium'
      return <PaystackCheckout planCode={planCode} planName={planName} replaceActive style={btnStyle}>{switchLabel}</PaystackCheckout>
    }
    return <PaystackCheckout planCode={planCode} planName={planName} style={btnStyle}>{label}</PaystackCheckout>
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', alignSelf: 'center', marginRight: 4 }}>All plans include</span>
        {ALL_PLAN_INCLUDES.map((f) => (
          <span key={f} style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, padding: '5px 12px' }}>
            {f}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {/* Free */}
        <div style={cardStyle('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)')}>
          <p style={tierLabel('rgba(255,255,255,0.4)')}>Free</p>
          <p style={priceStyle}>{PRICE_FREE}</p>
          <p style={periodStyle}>Forever free</p>
          <div style={{ flex: 1 }}>{PLAN_FEATURES.free.map(f => <FeatureRow key={f} label={f} />)}</div>
          <div style={{ marginTop: 20 }}>
            {currentTier
              ? <div style={ctaBoxStyle('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.4)')}>Included</div>
              : <Link href="/dashboard" style={{ ...ctaBoxStyle('rgba(255,255,255,0.07)'), textDecoration: 'none' }}>Current plan</Link>}
          </div>
        </div>

        {/* Pro */}
        <div style={{ ...cardStyle('linear-gradient(145deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))', 'rgba(59,130,246,0.3)'), position: 'relative' }}>
          <div style={{ position: 'absolute', top: -1, right: 20, background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', borderRadius: '0 0 8px 8px', padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fff' }}>POPULAR</div>
          <p style={tierLabel('#60a5fa')}>Premium</p>
          <p style={priceStyle}>{PRICE_PRO}<span style={perMo}> /mo</span></p>
          <div style={{ flex: 1, marginTop: 12 }}>{PLAN_FEATURES.premium.map(f => <FeatureRow key={f} label={f} accent />)}</div>
          <div style={{ marginTop: 20 }}>{renderCta('pro', PLAN_PRO, 'linear-gradient(135deg,#3b82f6,#2563eb)', 'Upgrade to Premium')}</div>
        </div>

        {/* Pro Plus */}
        <div style={cardStyle('linear-gradient(145deg, rgba(245,158,11,0.10), rgba(251,146,60,0.06))', 'rgba(245,158,11,0.3)')}>
          <p style={tierLabel('#fbbf24')}>Premium Plus</p>
          <p style={priceStyle}>{PRICE_PLUS}<span style={perMo}> /mo</span></p>
          <div style={{ flex: 1, marginTop: 12 }}>{PLAN_FEATURES.premiumPlus.map(f => <FeatureRow key={f} label={f} gold />)}</div>
          <div style={{ marginTop: 20 }}>{renderCta('plus', PLAN_PLUS, 'linear-gradient(135deg,#f59e0b,#d97706)', 'Upgrade to Premium Plus')}</div>
        </div>
      </div>
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        Prices shown in USD · Charged in NGN at checkout via Paystack · Cancel anytime
      </p>
    </>
  )
}

function cardStyle(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }
}
function tierLabel(color: string): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }
}
const priceStyle: React.CSSProperties = { fontSize: 32, fontWeight: 800, marginBottom: 2 }
const perMo: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }
const periodStyle: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }

function ctaBoxStyle(bg: string, color = 'rgba(255,255,255,0.8)'): React.CSSProperties {
  return { display: 'block', width: '100%', textAlign: 'center', fontSize: 14, fontWeight: 600, color, background: bg, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 0' }
}

function FeatureRow({ label, accent, gold }: { label: string; accent?: boolean; gold?: boolean }) {
  const checkColor = gold ? '#fbbf24' : accent ? '#60a5fa' : '#34d399'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: checkColor }}>✓</span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{label}</span>
    </div>
  )
}
