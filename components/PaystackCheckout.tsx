'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  planCode: string
  // When true, an existing active subscription is cancelled first (a plan switch),
  // instead of blocking. Prevents double billing on upgrade/downgrade.
  replaceActive?: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

interface PaystackSetupConfig {
  key: string
  email: string
  plan?: string
  ref?: string
  metadata?: unknown
  callback: (response: { reference: string }) => void
  onClose: () => void
}

declare global {
  interface Window {
    PaystackPop?: {
      setup(config: PaystackSetupConfig): { openIframe(): void }
    }
  }
}

const PAYSTACK_SCRIPT_SRC = 'https://js.paystack.co/v1/inline.js'
const PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('no window')); return }
    if (window.PaystackPop) { resolve(); return }
    const existing = document.querySelector(`script[src="${PAYSTACK_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Paystack script failed to load')))
      return
    }
    const script = document.createElement('script')
    script.src = PAYSTACK_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Paystack script failed to load'))
    document.head.appendChild(script)
  })
}

export default function PaystackCheckout({ planCode, replaceActive, className, style, children }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadPaystackScript().catch(() => {}) }, [])

  const handleClick = async () => {
    if (loading) return
    setError(null)

    if (!PUBLIC_KEY || !planCode) {
      setError('Payment is not configured. Please contact support.')
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Must be signed in so we can attach premium to the right account
    if (!user || !user.email) {
      router.push('/login?next=/pricing')
      return
    }

    // Double-payment guard: don't start a second checkout while one is active...
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle()
    const hasActive = !!existing && existing.status === 'active' &&
      (!existing.current_period_end || new Date(existing.current_period_end) > new Date())
    if (hasActive) {
      if (!replaceActive) {
        setError('You already have an active subscription. Manage it from your dashboard.')
        return
      }
      // ...unless this is a plan switch — cancel the current one first to avoid double billing
      setLoading(true)
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        if (!res.ok) {
          const b = await res.json().catch(() => ({}))
          throw new Error(b.error || 'Could not switch plan')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not switch plan')
        setLoading(false)
        return
      }
      setLoading(false)
    }

    try {
      await loadPaystackScript()
    } catch {
      setError('Could not load payment system. Check your connection.')
      return
    }
    if (!window.PaystackPop) {
      setError('Payment system unavailable.')
      return
    }

    const ref = `ret_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    const handler = window.PaystackPop.setup({
      key: PUBLIC_KEY,
      email: user.email,
      plan: planCode,
      ref,
      metadata: {
        user_id: user.id,
        custom_fields: [
          { display_name: 'User ID', variable_name: 'user_id', value: user.id },
        ],
      },
      callback: (response) => {
        // Paystack callback is synchronous — fire async work without awaiting
        void verifyAndActivate(response.reference)
      },
      onClose: () => setLoading(false),
    })

    setLoading(true)
    handler.openIframe()
  }

  const verifyAndActivate = async (reference: string) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ reference, user_id: session?.user?.id }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Payment verification failed')
      }

      // Refresh so the new JWT carries app_metadata.is_premium = true
      await supabase.auth.refreshSession().catch(() => {})
      router.push('/dashboard?upgraded=1')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not activate premium')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" className={className} style={style} onClick={handleClick} disabled={loading}>
        {loading ? 'Processing…' : children}
      </button>
      {error && (
        <p style={{ color: '#f87171', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{error}</p>
      )}
    </>
  )
}
