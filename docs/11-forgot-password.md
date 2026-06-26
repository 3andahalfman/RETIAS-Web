# Page: Forgot password

| Attribute | Value |
|---|---|
| **Route** | `/forgot-password` |
| **File** | `app/forgot-password/page.tsx` |
| **Auth gate** | Public |
| **Status** | Live |

## Purpose

User requests a password-reset email. Supabase sends a link that opens `/reset-password`.

## Layout & sections

1. RETIAS logo block
2. Card: email field + "Send reset link"
3. Success state: confirmation that email was sent (if account exists)
4. Link back to `/login`

## Data sources

| Source | Notes |
|---|---|
| `supabase.auth.resetPasswordForEmail(email, { redirectTo })` | `redirectTo` from `lib/auth-password` → `/reset-password` |

## Features

- Rate-limit friendly error
- Does not reveal whether email exists (standard reset UX)

## How to extend

Update `passwordResetRedirectUrl()` in `lib/auth-password.ts` if the reset landing route changes.
