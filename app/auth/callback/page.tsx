'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')
    const nextParam = searchParams.get('next')
    const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'

    async function finish() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace('/login?error=auth_failed')
          return
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.replace('/login?error=auth_failed')
          return
        }
      }
      router.replace(next)
    }

    finish()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090f' }}>
      <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090f' }}>
        <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  )
}
