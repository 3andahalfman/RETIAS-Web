'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'admin@retias.com'

const NAV = [
  { href: '/dashboard',                   icon: '⚡',  label: 'Overview' },
  { href: '/dashboard/sessions',          icon: '🎙️', label: 'Sessions' },
  { href: '/dashboard/cvs',              icon: '📄',  label: 'CV Manager' },
  { href: '/dashboard/resume-optimizer', icon: '✨',  label: 'Resume Optimizer' },
  { href: '/dashboard/settings',         icon: '⚙️',  label: 'Settings' },
]

const ADMIN_NAV = [
  { href: '/dashboard/screenshots', icon: '📸', label: 'Screenshot Library' },
]

export default function Sidebar({ user, isPremium }: { user: User; isPremium: boolean }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const displayName = user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'User'
  const initials    = displayName.slice(0, 2).toUpperCase()
  const w = collapsed ? 'w-[62px]' : 'w-56'

  return (
    <aside className={`${w} shrink-0 flex flex-col transition-all duration-200`}
      style={{ borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', minHeight: '100vh' }}>

      {/* Logo + toggle */}
      <div className="flex items-center px-3 py-4 gap-2" style={{ borderBottom: '1px solid var(--border)', minHeight: 60 }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', boxShadow: '0 0 16px rgba(59,130,246,0.35)' }}>
          <span className="text-sm font-black text-white">R</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-none truncate" style={{ color: 'var(--text-1)' }}>RETIAS</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Dashboard</p>
          </div>
        )}
        <button type="button" onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-3)', fontSize: 12 }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {[
          ...NAV,
          ...((user.email ?? '').toLowerCase() === ADMIN_EMAIL ? ADMIN_NAV : []),
        ].map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <a key={href} href={href} title={collapsed ? label : undefined}
              className="flex items-center rounded-xl text-sm font-medium transition-all"
              style={{
                gap: collapsed ? 0 : 12,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: active ? '#60a5fa' : 'var(--text-2)',
                border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
              }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {!collapsed && label}
            </a>
          )
        })}
      </nav>

      {/* Download + Support */}
      <div className="px-2 py-2 space-y-0.5">
        <a href="https://github.com/3andahalfman/RETIAS/releases/latest/download/RETIAS-Setup.exe"
          target="_blank" rel="noopener noreferrer"
          title={collapsed ? 'Download Desktop App' : undefined}
          className="flex items-center rounded-xl text-xs font-medium transition-all hover:bg-white/5"
          style={{
            gap: collapsed ? 0 : 10,
            padding: collapsed ? '9px 0' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--text-2)',
          }}>
          <span style={{ fontSize: 15 }}>⬇️</span>
          {!collapsed && <><span className="flex-1">Download Desktop App</span><span style={{ color: 'var(--text-3)' }}>›</span></>}
        </a>
        <a href="mailto:support@retias.app"
          title={collapsed ? 'Email Support' : undefined}
          className="flex items-center rounded-xl text-xs font-medium transition-all hover:bg-white/5"
          style={{
            gap: collapsed ? 0 : 10,
            padding: collapsed ? '9px 0' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--text-2)',
          }}>
          <span style={{ fontSize: 15 }}>✉️</span>
          {!collapsed && <span>Email Support</span>}
        </a>
      </div>

      {/* Upgrade to Premium */}
      {!isPremium && (
        <div className="px-2 pb-2">
          {collapsed ? (
            <a href="mailto:support@retias.app?subject=Premium%20Upgrade"
              title="Upgrade to Premium"
              className="flex justify-center items-center py-2 rounded-xl transition-colors hover:bg-white/5"
              style={{ color: '#fb923c' }}>
              <span style={{ fontSize: 15 }}>⭐</span>
            </a>
          ) : (
            <div className="rounded-xl p-3" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="sidebar-badge-free">FREE</span>
                <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Free Plan</p>
              </div>
              <a href="mailto:support@retias.app?subject=Premium%20Upgrade"
                className="block w-full text-center text-xs font-semibold py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'linear-gradient(135deg,#fb923c,#f97316)', color: '#fff' }}>
                Upgrade to Premium
              </a>
            </div>
          )}
        </div>
      )}

      {/* User */}
      <div className="px-2 pb-3 pt-2 group" style={{ borderTop: '1px solid var(--border)' }}>
        {collapsed ? (
          <div className="flex justify-center py-1" title={displayName}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#fb923c)', color: '#fff' }}>
              {initials}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--surface)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#fb923c)', color: '#fff' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{displayName}</p>
                {isPremium
                  ? <span className="sidebar-badge-pro">PRO</span>
                  : <span className="sidebar-badge-free">FREE</span>}
              </div>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{user.email}</p>
            </div>
            <button type="button" onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[10px] px-2 py-1 rounded-lg sidebar-signout-btn">
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
