# Page: Reset password

| Attribute | Value |
|---|---|
| **Route** | `/reset-password` |
| **File** | `app/reset-password/page.tsx` |
| **Auth gate** | Public (requires valid reset token in URL hash/query from email link) |
| **Status** | Live |

## Purpose

User sets a new password after clicking the email link from forgot-password flow.

## Layout & sections

1. RETIAS logo block
2. Card: new password + confirm, strength rules, submit
3. Success → redirect to `/login`
4. Invalid/expired token → error + link to request a new reset

## Data sources

| Source | Notes |
|---|---|
| `supabase.auth.updateUser({ password })` | After session established from reset link |

## Features

- Same password strength rules as sign-up (`lib/auth-password.ts`)
- Friendly errors for expired or invalid links
