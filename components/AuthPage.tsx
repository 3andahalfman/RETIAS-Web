'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PasswordEyeButton from '@/components/PasswordEyeButton'
import { getStrengthRules, validatePassword } from '@/lib/auth-password'

type Mode = 'signin' | 'signup'

function getNextPath(): string {
  if (typeof window === 'undefined') return '/dashboard'
  const n = new URLSearchParams(window.location.search).get('next')
  return n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard'
}

function friendlyError(err: any): string {
  const msg = (err?.message ?? '').toLowerCase()
  if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password'))
    return 'Wrong email or password.'
  if (msg.includes('user already registered') || msg.includes('already exists'))
    return 'An account with this email already exists.'
  if (msg.includes('email') && msg.includes('not found'))
    return 'No account found with this email.'
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Too many attempts. Please wait and try again.'
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error. Check your connection.'
  return err?.message ?? 'Something went wrong.'
}

interface Props {
  initialMode?: Mode
}

export default function AuthPage({ initialMode = 'signin' }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [mode, setMode]           = useState<Mode>(initialMode)
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [name, setName]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [pwFocused, setPwFocused] = useState(false)
  const [showPw, setShowPw]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const err = new URLSearchParams(window.location.search).get('error')
    if (err === 'reset_expired') setError('Your reset link expired or is invalid. Request a new one.')
    else if (err === 'auth_failed') setError('Sign-in failed. Please try again.')
  }, [])

  const strengthRules = getStrengthRules(password)
  const allRulesPass  = strengthRules.every(r => r.pass)
  const passwordsMatch = password === confirm

  useEffect(() => {
    if (mode !== 'signup' || name.trim().length < 2) {
      setNameStatus('idle')
      return
    }
    setNameStatus('checking')
    if (nameDebounce.current) clearTimeout(nameDebounce.current)
    nameDebounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/check-username?name=${encodeURIComponent(name.trim())}`)
        const data = await res.json()
        setNameStatus(data.available ? 'available' : 'taken')
      } catch {
        setNameStatus('idle')
      }
    }, 500)
  }, [name, mode])

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setPassword('')
    setConfirm('')
    setName('')
    setNameStatus('idle')

    const qs = typeof window !== 'undefined' ? window.location.search : ''
    if (m === 'signup' && pathname !== '/signup') {
      router.push(`/signup${qs}`)
    } else if (m === 'signin' && pathname !== '/login') {
      router.push(`/login${qs}`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (nameStatus === 'taken')     { setError('That display name is already taken.'); return }
      if (nameStatus !== 'available') { setError('Please wait for name availability check.'); return }
      const pwError = validatePassword(password)
      if (pwError) { setError(pwError); return }
      if (!passwordsMatch) { setError('Passwords do not match.'); return }
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        router.push(getNextPath())
        router.refresh()
      } else {
        const res  = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password, displayName: name.trim() }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Registration failed.'); return }

        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (signInErr) {
          setError('Account created! Please sign in.')
          switchMode('signin')
          return
        }
        router.push(getNextPath())
        router.refresh()
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(getNextPath())}` },
    })
    if (err) setError(friendlyError(err))
  }

  const canSubmit = mode === 'signin'
    ? !loading
    : !loading && nameStatus === 'available' && allRulesPass && passwordsMatch && confirm.length > 0

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.12) 0%, #09090f 60%)' }}>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', boxShadow: '0 0 32px rgba(59,130,246,0.4)' }}>
            <span className="text-2xl font-black text-white">R</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>RETIAS</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            {mode === 'signup' ? 'Create your account' : 'Real Time Interview Assistant'}
          </p>
        </div>

        <div className="glass p-6">
          <div className="flex rounded-lg p-1 mb-6" style={{ background: 'rgba(0,0,0,0.3)' }}>
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
                style={{
                  background: mode === m ? 'var(--blue)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-2)',
                }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <div>
                <input className="input" placeholder="Display name"
                  value={name} onChange={e => setName(e.target.value)} required />
                {name.trim().length >= 2 && (
                  <p className="text-xs mt-1.5 ml-1" style={{
                    color: nameStatus === 'available' ? '#34d399'
                         : nameStatus === 'taken'     ? '#f87171'
                         : 'var(--text-3)',
                  }}>
                    {nameStatus === 'checking'  && '⋯ Checking availability…'}
                    {nameStatus === 'available' && '✓ Name is available'}
                    {nameStatus === 'taken'     && '✗ Name is already taken'}
                  </p>
                )}
              </div>
            )}

            <input className="input" type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)} required />

            {mode === 'signin' && (
              <p className="text-xs text-right -mt-1">
                <Link href="/forgot-password" style={{ color: 'var(--blue)', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </p>
            )}

            <div>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Password"
                  style={{ paddingRight: 42 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  required />
                <PasswordEyeButton shown={showPw} onClick={() => setShowPw(s => !s)} />
              </div>

              {mode === 'signup' && (pwFocused || password.length > 0) && (
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

            {mode === 'signup' && (
              <div>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showConfirm ? 'text' : 'password'} placeholder="Confirm password"
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
            )}

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary mt-1" disabled={!canSubmit}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <button type="button" onClick={handleGoogle} className="btn-ghost w-full flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3-11.3-7.2l-6.6 5.1C9.7 39.7 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.3-4.5 5.7l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.2-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-center mt-5" style={{ color: 'var(--text-3)' }}>
            {mode === 'signup' ? (
              <>Already have an account? <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign in</Link></>
            ) : (
              <>Need an account? <Link href="/signup" style={{ color: 'var(--blue)', fontWeight: 600 }}>Create one</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
