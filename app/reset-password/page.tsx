'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import PasswordEyeButton from '@/components/PasswordEyeButton'
import { getStrengthRules, validatePassword } from '@/lib/auth-password'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const strengthRules = getStrengthRules(password)
  const allRulesPass = strengthRules.every(r => r.pass)
  const passwordsMatch = password === confirm

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setChecking(false)
        return
      }
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession) {
          setChecking(false)
          subscription.unsubscribe()
        }
      })
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (!s) router.replace('/login?error=reset_expired')
        })
      }, 1500)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const pwError = validatePassword(password)
    if (pwError) { setError(pwError); return }
    if (!passwordsMatch) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const res = await authFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not update password.')
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090f' }}>
        <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.12) 0%, #09090f 60%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', boxShadow: '0 0 32px rgba(59,130,246,0.4)' }}>
            <span className="text-2xl font-black text-white">R</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Choose a new password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            {done ? 'Password updated — redirecting…' : 'Enter your new password below'}
          </p>
        </div>

        <div className="glass p-6">
          {done ? (
            <p className="text-sm text-center" style={{ color: '#34d399' }}>
              ✓ Your password has been updated.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPw ? 'text' : 'password'} placeholder="New password"
                    style={{ paddingRight: 42 }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPwFocused(true)}
                    onBlur={() => setPwFocused(false)}
                    required autoFocus />
                  <PasswordEyeButton shown={showPw} onClick={() => setShowPw(s => !s)} />
                </div>
                {(pwFocused || password.length > 0) && (
                  <div className="flex flex-col gap-1.5 mt-2 px-1">
                    {strengthRules.map(r => (
                      <div key={r.label} className="flex items-center gap-2">
                        <span style={{ fontSize: 12, color: r.pass ? '#34d399' : 'var(--text-3)' }}>
                          {r.pass ? '✓' : '○'}
                        </span>
                        <span className="text-xs" style={{ color: r.pass ? '#34d399' : 'var(--text-3)' }}>
                          {r.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showConfirm ? 'text' : 'password'} placeholder="Confirm new password"
                    style={{ paddingRight: 42 }}
                    value={confirm} onChange={e => setConfirm(e.target.value)} required />
                  <PasswordEyeButton shown={showConfirm} onClick={() => setShowConfirm(s => !s)} />
                </div>
                {confirm.length > 0 && (
                  <p className="text-xs mt-1.5 ml-1" style={{ color: passwordsMatch ? '#34d399' : '#f87171' }}>
                    {passwordsMatch ? '✓ Passwords match.' : '✗ Passwords do not match.'}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </p>
              )}

              <button type="submit" className="btn-primary mt-1"
                disabled={loading || !allRulesPass || !passwordsMatch || confirm.length === 0}>
                {loading ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
