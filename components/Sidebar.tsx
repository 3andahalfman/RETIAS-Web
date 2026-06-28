'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import PricingModal from '@/components/PricingModal'

import { isAdminEmail } from '@/lib/admin'

const NAV = [
  { href: '/dashboard',                   icon: '⚡',  label: 'Overview' },
  { href: '/dashboard/sessions',          icon: '🎙️', label: 'Sessions' },
  { href: '/dashboard/cvs',              icon: '📄',  label: 'CV Manager' },
  { href: '/dashboard/resume-optimizer', icon: '✨',  label: 'Resume Optimizer' },
]

const ADMIN_NAV = [
  { href: '/dashboard/screenshots', icon: '🗂️', label: 'Assessment Archive' },
  { href: '/dashboard/solved', icon: '📚', label: 'Solved Bank' },
  { href: '/dashboard/billing', icon: '💳', label: 'Billing' },
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

  const [menuOpen, setMenuOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const isPlus = user.app_metadata?.is_premium_plus === true || isAdminEmail(user.email)

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
          ...((user.email && isAdminEmail(user.email)) ? ADMIN_NAV : []),
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
        <a href="mailto:realmsemerald@gmail.com"
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

      {/* User + account menu */}
      <div ref={menuRef} className="px-2 pb-3 pt-2 relative" style={{ borderTop: '1px solid var(--border)' }}>

        {/* Dropdown (opens upward) */}
        {menuOpen && (
          <div className="absolute bottom-full mb-2 rounded-xl overflow-hidden"
            style={{ left: 8, width: 216, background: '#14141c', border: '1px solid var(--border)', boxShadow: '0 12px 32px rgba(0,0,0,0.55)' }}>
            <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{displayName}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{user.email}</p>
            </div>
            <button type="button" onClick={() => { setMenuOpen(false); setPricingOpen(true) }}
              className="block w-full m-2 text-center text-xs font-semibold py-2 rounded-lg transition-opacity hover:opacity-80"
              style={isPremium
                ? { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', cursor: 'pointer', width: 'calc(100% - 16px)' }
                : { background: 'linear-gradient(135deg,#fb923c,#f97316)', color: '#fff', cursor: 'pointer', border: 'none', width: 'calc(100% - 16px)' }}>
              {isPremium ? 'Manage plan' : '✦ Upgrade to Premium'}
            </button>
            <a href="/dashboard/settings" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-2)', textDecoration: 'none' }}>
              <span style={{ fontSize: 14 }}>⚙️</span> Settings
            </a>
            <button type="button" onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-2)', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14 }}>⎋</span> Log Out
            </button>
          </div>
        )}

        {/* Profile button (toggles dropdown) */}
        <button type="button" onClick={() => setMenuOpen(o => !o)}
          title={collapsed ? displayName : undefined}
          className={`w-full flex items-center rounded-xl transition-colors hover:bg-white/5 ${collapsed ? 'justify-center py-1' : 'gap-3 px-3 py-2.5'}`}
          style={{ background: collapsed ? 'transparent' : 'var(--surface)', border: 'none', cursor: 'pointer' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#fb923c)', color: '#fff' }}>
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{displayName}</p>
                  {isPremium
                    ? <span className="sidebar-badge-pro">{isPlus ? 'PREMIUM+' : 'PREMIUM'}</span>
                    : <span className="sidebar-badge-free">FREE</span>}
                </div>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{user.email}</p>
              </div>
              <span className="shrink-0" style={{ color: 'var(--text-3)', fontSize: 16, lineHeight: 1 }}>⋯</span>
            </>
          )}
        </button>
      </div>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </aside>
  )
}
