# Page: Sign up

| Attribute | Value |
|---|---|
| **Route** | `/signup` |
| **File** | `app/signup/page.tsx` → `components/AuthPage.tsx` (`initialMode="signup"`) |
| **Auth gate** | Public |
| **Status** | Live |

## Purpose

Dedicated sign-up URL for marketing links (desktop app, emails). Same UI as `/login` but opens on the **Create Account** tab.

## Layout & sections

Same as [Login](./01-login.md) — see `AuthPage.tsx`. Sign-up form: display name, email, password, confirm password, strength checklist, username availability, Google OAuth, link to sign in.

## Features

- Create account via `POST /api/register`
- Redirect to `/dashboard` (or `?next=`) on success
- All validation and friendly errors from shared `AuthPage`

## Copy

Shared with login — see [01-login.md](./01-login.md). Tab default: **Create Account**.

## How to extend

Change `components/AuthPage.tsx` once — both `/login` and `/signup` update together.
