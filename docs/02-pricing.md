# Page: Pricing

| Attribute | Value |
|---|---|
| **Route** | `/pricing` (supports `?next=/some-path` via login link) |
| **File** | `app/pricing/page.tsx` (thin wrapper) — actual cards in `components/PlanCards.tsx` |
| **Auth gate** | Public (page) — checkout requires signed-in user |
| **Status** | Live |

## Purpose

Convert visitors to paid users. Show the three tiers (Free / Premium / Premium Plus), surface what makes each distinct, and route to Paystack checkout for paid tiers. Already-subscribed users see "Your current plan" and can switch tiers.

## Layout & sections

1. **Sticky navbar** — RETIAS logo · "Home" link · either "Sign in" CTA or signed-in user pill linking to `/dashboard`.
2. **Page header** — "Simple pricing" + "Start free. Upgrade when you're ready."
3. **`<PlanCards />`** — the three plan cards in a responsive grid (`minmax(240px, 1fr)`).
4. **Trust line** — "Secure payments by Paystack · Cancel anytime" (rendered by `PlanCards`).

## Components used

- `PlanCards` ([components/PlanCards.tsx](../../components/PlanCards.tsx)) — the cards + checkout logic. Reused by `PricingModal` so any pricing change updates everywhere.
- `PaystackCheckout` ([components/PaystackCheckout.tsx](../../components/PaystackCheckout.tsx)) — wraps the upgrade button.
- `Link` (`next/link`) — internal nav.

## Data sources

| Source | Fields read | Notes |
|---|---|---|
| `supabase.auth.getUser()` | `id`, `user_metadata.display_name`, `email` | Drives navbar user pill |
| `from('subscriptions')` | `status`, `tier`, `current_period_end` | Determines "Your current plan" / "Switch" CTAs |
| Env: `NEXT_PUBLIC_PAYSTACK_PLAN_PRO` | — | Paystack plan code for Premium |
| Env: `NEXT_PUBLIC_PAYSTACK_PLAN_PLUS` | — | Paystack plan code for Premium Plus |

## Features

- Three tiers: Free, Premium (₦10,000/mo), Premium Plus (₦25,000/mo)
- Free has the 10-minute interview cap
- Premium = unlimited sessions + screen analysis + dual-monitor + model picker
- Premium Plus = everything in Premium + Solved Assessment library + humanized answers + Opus 4.5
- Active-subscription detection: shows "✓ Your current plan" on the matching tier and "Switch to Premium" / "Upgrade to Premium Plus" on the others
- Logged-out checkout button redirects to `/login?next=/pricing` instead of opening Paystack
- "POPULAR" ribbon on the Premium card

## Copy (verbatim, currently live)

> **Page heading:** Simple pricing
> **Page subhead:** Start free. Upgrade when you're ready.
> **Trust line:** Secure payments by Paystack · Cancel anytime

### Plan content (PlanCards feature arrays, source of truth)

**Free — ₦0 — Forever free**
- 10-minute interview sessions
- Real-time transcription
- Mock Interview mode
- Session history
- CV Manager (3 CVs)

**Premium — ₦10,000 /mo — POPULAR**
- Unlimited sessions
- AI Screen Analysis
- Manual prompt bar
- Online Assessment & Onboarding
- Dual-monitor screen capture
- Resume Optimizer
- Pick your AI model
- Priority support

**Premium Plus — ₦25,000 /mo**
- Everything in Premium
- Solved Assessment library
- Humanized AI answers (unique per user)
- Top-tier AI (Claude Opus 4.5)
- Early access to new features
- Dedicated support channel

### CTAs

| State | Free card | Premium card | Premium Plus card |
|---|---|---|---|
| Not signed in | "Current plan" → `/dashboard` | "Sign in to subscribe" → `/login?next=/pricing` | same |
| Signed in, no sub | "Included" | "Upgrade to Premium" → Paystack | "Upgrade to Premium Plus" → Paystack |
| On Premium | "Included" | "✓ Your current plan" | "Upgrade to Premium Plus" |
| On Premium Plus | "Included" | "Switch to Premium" | "✓ Your current plan" |

## How to extend

- **Add a feature to a tier** — append to the matching `*_FEATURES` array at the bottom of `PlanCards.tsx`. The pricing page and PricingModal update automatically.
- **Change a price** — edit the `<p style={priceStyle}>₦…</p>` literal inside `PlanCards.tsx`. Also update the Paystack plan code env var if the plan is brand new (the plan code is the source of truth for actual billing).
- **Add a new tier** — duplicate one of the existing card blocks in `PlanCards.tsx`, add a feature array, add `NEXT_PUBLIC_PAYSTACK_PLAN_X` env, extend the `tier` union in `verify-payment` + `paystack-webhook` edge functions.
- **Move the "POPULAR" ribbon** — it's the absolute-positioned div inside the Premium card.

## Open ideas / not yet built

- Annual billing toggle (with discount)
- Team / multi-seat plan
- USD pricing for non-Nigerian visitors
- Feature comparison table (vertical) below the cards
