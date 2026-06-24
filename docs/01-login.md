# Page: Login + Sign up

| Attribute | Value |
|---|---|
| **Route** | `/login` (supports `?next=/some-path`) |
| **File** | `app/login/page.tsx` |
| **Auth gate** | Public |
| **Status** | Live |

## Purpose

Single page handling both sign-in and sign-up via a Tab switcher. Also offers Google OAuth. After success it redirects to whatever `?next=…` says (whitelisted to internal paths) or to `/dashboard`.

## Layout & sections

1. **Logo block** — gradient "R" tile + "RETIAS" + "Real Time Interview Assistant" subtitle.
2. **Glass card** with:
   - **Sign In / Create Account tab switcher**
   - **Sign up form** (Display name → Email → Password → Confirm Password) OR **Sign in form** (Email → Password)
   - **Live display-name availability** (debounced 500ms POST to `/api/check-username`)
   - **Live password strength checklist** (8 chars · uppercase · number) shown on focus/typing during sign-up
   - **Live passwords-match indicator**
   - **Inline error banner** (translated to friendly text via `friendlyError`)
   - **Submit button** — "Sign In" or "Create Account"
   - **"or" divider**
   - **Continue with Google button**

## Components used

- `EyeButton` (defined in-file) — password show/hide toggle
- No shared components

## Data sources

| Source | Fields read/written | Notes |
|---|---|---|
| `supabase.auth.signInWithPassword({email, password})` | — | Email/password sign in |
| `supabase.auth.signInWithOAuth({provider:'google'})` | — | Redirects to `/auth/callback?next=…` |
| `POST /api/register` | `email`, `password`, `displayName` | Server-side registration that enforces unique display name |
| `GET /api/check-username?name=…` | `available: boolean` | Display name availability |

## Features

- Sign in with email + password
- Create account with email + password + unique display name
- Google OAuth (single click)
- Live password strength + confirmation matching
- Live display-name availability
- Show / hide password toggle on both password fields
- Friendly error translation for common Supabase errors
- `?next=` redirect honoured for internal paths only (`/...`, not `//host.com/...`)

## Copy (verbatim, currently live)

> **Heading:** RETIAS
> **Subhead:** Real Time Interview Assistant
> **Tabs:** Sign In · Create Account
> **Placeholders:** Display name, Email address, Password, Confirm password
> **Strength rules:** At least 8 characters · One uppercase letter (A–Z) · One number (0–9)
> **Live name labels:** ⋯ Checking availability… / ✓ Name is available / ✗ Name is already taken
> **Live match labels:** ✓ Passwords match. / ✗ Passwords do not match.
> **Submit:** Sign In / Create Account
> **Google CTA:** Continue with Google

### Friendly error messages

| Trigger | Shown text |
|---|---|
| invalid login / wrong password | Wrong email or password. |
| user already exists | An account with this email already exists. |
| no account found | No account found with this email. |
| rate limit | Too many attempts. Please wait and try again. |
| network/fetch failure | Network error. Check your connection. |
| anything else | Original Supabase error message |

## How to extend

- **Add a new validation rule** — add a row to `getStrengthRules(pw)` and append to the rule check inside `validatePassword`.
- **Add a third auth provider** — add a button below the Google one; call `signInWithOAuth({ provider: '...' })`. The `redirectTo` URL points to `/auth/callback?next=…` so any provider works as long as the callback route is configured.
- **Change the redirect default** — `getNextPath()` is the single source.

## Open ideas / not yet built

- "Forgot password" link → magic link / reset
- Apple / GitHub OAuth
- Email-verification badge on first sign-in
