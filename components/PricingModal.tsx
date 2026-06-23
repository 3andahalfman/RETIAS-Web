'use client'

import { useEffect } from 'react'
import PlanCards from '@/components/PlanCards'

// Floating "Adjust your plan" dialog with a blurred backdrop over the dashboard.
export default function PricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(5,5,10,0.6)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 960, margin: 'auto',
          background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
          padding: '40px 32px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
          color: 'rgba(255,255,255,0.92)',
        }}
      >
        {/* Close */}
        <button type="button" onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 8px' }}>Adjust your plan</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Upgrade, switch, or stay on your current plan.</p>
        </div>

        <PlanCards />
      </div>
    </div>
  )
}
