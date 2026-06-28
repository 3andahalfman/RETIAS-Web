'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not send reset email.')
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Check your connection.')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Reset password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            {sent ? 'Check your inbox' : 'We’ll email you a reset link'}
          </p>
        </div>

        <div className="glass p-6">
          {sent ? (
            <div className="text-center">
              <p className="text-sm mb-4" style={{ color: 'var(--text-2)', lineHeight: 1.6 }}>
                If an account exists for <strong style={{ color: 'var(--text-1)' }}>{email.trim()}</strong>, you’ll receive a link to choose a new password.
              </p>
              <Link href="/login" className="btn-primary inline-block text-center no-underline" style={{ display: 'block' }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input className="input" type="email" placeholder="Email address"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />

              {error && (
                <p className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </p>
              )}

              <button type="submit" className="btn-primary mt-1" disabled={loading || !email.trim()}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <p className="text-xs text-center mt-2" style={{ color: 'var(--text-3)' }}>
                <Link href="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>← Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
