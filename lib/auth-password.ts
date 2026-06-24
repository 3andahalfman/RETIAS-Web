export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.'
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.'
  return null
}

export interface StrengthRule { label: string; pass: boolean }

export function getStrengthRules(pw: string): StrengthRule[] {
  return [
    { label: 'At least 8 characters', pass: pw.length >= 8 },
    { label: 'One uppercase letter (A–Z)', pass: /[A-Z]/.test(pw) },
    { label: 'One number (0–9)', pass: /[0-9]/.test(pw) },
  ]
}

export function passwordResetRedirectUrl(): string {
  if (typeof window === 'undefined') return '/auth/callback?next=/reset-password'
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`
}
