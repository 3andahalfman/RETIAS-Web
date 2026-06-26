# Conventions

Cross-cutting rules every page doc inherits.

## Auth gates

| Gate | Mechanism | Where enforced |
|---|---|---|
| **Public** | No check | Landing, Login, Pricing |
| **Signed-in** | `supabase.auth.getUser()` returns a user, otherwise `router.replace('/login')` | `app/dashboard/layout.tsx` |
| **Premium / Premium Plus** | `user.app_metadata.is_premium` / `is_premium_plus` boolean from JWT | Inside each gated route |
| **Admin** | `user.email === 'admin@retias.com'` | Sidebar nav + Screenshot Library page |

Admin email lives in `components/Sidebar.tsx` (`ADMIN_EMAIL`) and `app/dashboard/screenshots/page.tsx`. Change it in one place at a time and keep them in sync.

## Subscription tiers

- `tier = null` → free
- `tier = 'pro'` → Premium
- `tier = 'plus'` → Premium Plus

Reads come from the `subscriptions` table (server-of-truth) AND `app_metadata.is_premium / is_premium_plus` (cached on the JWT). Always prefer the JWT for UI gates; the table is for billing logic.

## Supabase tables

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | Display name reservation | User owns own row |
| `past_sessions` | Recorded interview sessions | User owns own rows |
| `session_qa` | Q&A within a session | Inherited via `past_sessions` |
| `session_transcript` | Raw transcript lines | Inherited via `past_sessions` |
| `cvs` | Uploaded resumes | User owns own rows |
| `online_test_captures` | Online Assessment screenshots + AI answers | Insert by uploader; SELECT/DELETE by admin |
| `solved_questions` | Curated Q&A library | INSERT/UPDATE/DELETE admin; SELECT premium+ |
| `solved_answer_user_cache` | Per-user humanized variant of an answer | User reads own; admin reads all |
| `subscriptions` | Paystack subscription state | User reads own |

## Design tokens

CSS custom properties live in `app/globals.css`:

| Token | Use |
|---|---|
| `--text-1` | Primary text |
| `--text-2` | Secondary text |
| `--text-3` | Muted text |
| `--border` | All thin borders |
| `--surface` | Card background |
| `--blue` | Primary accent (`#3b82f6`) |
| `--brand-blue` | Gradient anchor (`#60a5fa`) |

Brand gradients (use `style={{ background: ... }}`):
- Primary CTA: `linear-gradient(135deg,#3b82f6,#2563eb)`
- Premium accent (Pro): `linear-gradient(135deg,#3b82f6,#60a5fa)`
- Premium Plus accent: `linear-gradient(135deg,#f59e0b,#d97706)` (amber)

## Shared components

| Component | File | Used by |
|---|---|---|
| `Sidebar` | `components/Sidebar.tsx` | All `/dashboard/*` pages via layout |
| `PlanCards` | `components/PlanCards.tsx` | Pricing page + PricingModal |
| `PricingModal` | `components/PricingModal.tsx` | Triggered from dashboard upgrade nags |
| `PaystackCheckout` | `components/PaystackCheckout.tsx` | Pricing card CTAs |
| `SessionRow` | `components/SessionRow.tsx` | Dashboard overview, Sessions list |
| `StatCard` | `components/StatCard.tsx` | Dashboard overview |

When you change a shared component, list every page that uses it in your PR description and update the affected docs.

## CTAs that link to the desktop app

Throughout the dashboard, "Start a session" / "Online Assessment" CTAs link to
```
https://github.com/3andahalfman/RETIAS/releases/latest/download/RETIAS-Setup.exe
```
This is the canonical download URL. Don't hardcode it elsewhere — if it ever needs to change, grep for the pattern first.

## Pricing source of truth

`lib/plan-features.ts` holds the three feature arrays (`free`, `premium`, `premiumPlus`). `components/PlanCards.tsx` imports them.

Both `/pricing` and `<PricingModal/>` render the same component, so editing the arrays updates every surface at once.

## Greeting

Dashboard greeting is **"Welcome, {firstName} 👋"** — not time-of-day based. Keep it consistent with the desktop app.

## "Online Test" vs "Online Assessment"

User-facing copy uses **"Online Assessment"**. Internal IDs / DB session_type still use `online-test` / `online_test`. Don't change those — they'd break legacy rows.

## New features → website content

When shipping a user-facing feature (desktop or web):

1. Register it in [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) (append checklist + master table + changelog).
2. Update landing/pricing code if the feature is marketed publicly.
3. Update the relevant page doc(s).

See **Website content gaps** in the registry for features that exist in the product but are not yet on the marketing site.
