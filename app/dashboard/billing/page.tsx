'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/admin'

interface BillingRow {
  user_id: string
  email: string
  plan: string
  status: string
  renewal_date: string | null
  updated_at: string
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusStyle(status: string): React.CSSProperties {
  const s = status.toLowerCase()
  if (s === 'active') return { color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }
  if (s === 'past_due') return { color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }
  if (s === 'canceled' || s === 'expired') return { color: '#f87171', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)' }
  return { color: 'var(--text-2)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }
}

function planStyle(plan: string): React.CSSProperties {
  if (plan === 'Premium Plus') return { color: '#fbbf24' }
  if (plan === 'Premium') return { color: '#60a5fa' }
  return { color: 'var(--text-2)' }
}

export default function BillingPage() {
  const [rows, setRows] = useState<BillingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isAdminEmail(user.email)) {
      setForbidden(true)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/billing')
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not load billing data')
      setRows(body.rows ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load billing data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  if (forbidden) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="glass p-10 text-center">
          <p style={{ fontSize: 32, marginBottom: 12 }}>🔒</p>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>Admin only</h1>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Billing overview is restricted to admin@retias.com.
          </p>
        </div>
      </div>
    )
  }

  const activeCount = rows.filter(r => r.status === 'active').length

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Billing</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Subscription overview — {activeCount} active · {rows.length} total record{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button type="button" onClick={() => void loadData()} disabled={loading}
          className="text-xs font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-1)', border: '1px solid var(--border)' }}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="glass px-4 py-3 mb-4 text-sm" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
          {error}
        </div>
      )}

      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                {['Email', 'Plan', 'Status', 'Renewal date', 'Last updated'].map(h => (
                  <th key={h} className="text-left font-semibold px-4 py-3" style={{ color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center" style={{ color: 'var(--text-3)' }}>Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center" style={{ color: 'var(--text-2)' }}>
                    No subscription records yet.
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--text-1)' }}>{row.email}</td>
                    <td className="px-4 py-3 font-medium" style={planStyle(row.plan)}>{row.plan}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                        style={statusStyle(row.status)}>
                        {row.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                      {formatDate(row.renewal_date)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {formatDate(row.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs mt-4" style={{ color: 'var(--text-3)' }}>
        Sorted by most recently updated. Active = paid and within the current billing period.
      </p>
    </div>
  )
}
