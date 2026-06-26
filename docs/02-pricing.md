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

- Three tiers: Free, Premium ($10/mo USD display), Premium Plus ($25/mo USD display)
- Free: Real/Mock interviews (10 min cap on Real), stealth, Auto-Typer, session history, 3 CVs
- Premium: unlimited sessions, screenshot Analyse All, Online Assessment, manual prompt, Sonnet model
- Premium Plus: Solved library, Paraphrase & Humanize, Opus 4.5
- Active-subscription detection: shows "✓ Your current plan" on the matching tier and "Switch to Premium" / "Upgrade to Premium Plus" on the others
- Logged-out checkout button redirects to `/login?next=/pricing` instead of opening Paystack
- "POPULAR" ribbon on the Premium card

## Copy (verbatim, currently live)

> **Page heading:** Simple pricing
> **Page subhead:** Start free with Real Interview, Mock Interview, stealth mode, context-aware answers, and Auto-Typer. Upgrade for screenshot analysis, Online Assessment, and the Solved Q&A library with paraphrase tools.
> **Trust line:** Prices shown in USD · Charged in NGN at checkout via Paystack · Cancel anytime

### Plan content (`lib/plan-features.ts`, source of truth)

**Free — $0 — Forever free**
- 10-minute Real Interview sessions
- Real-time transcription
- Context-aware answers
- Mock Interview mode
- Stealth mode overlay
- CV-aware answers (3 CVs)
- Auto-Typer
- Session history & web dashboard

**Premium — $10 /mo — POPULAR**
- Unlimited Real & Mock sessions
- Screenshot capture & Analyse All
- Online Assessment & Onboarding
- Manual prompt bar
- Choose your AI model (Sonnet)
- Priority email support

**Premium Plus — $25 /mo**
- Everything in Premium
- Solved Assessment library
- Paraphrase & Humanize answers
- Claude Opus 4.5 model
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

- **Add a feature to a tier** — append to the matching array in `lib/plan-features.ts`. `PlanCards` (pricing page + PricingModal) updates automatically.
- **Change a price** — edit the `<p style={priceStyle}>₦…</p>` literal inside `PlanCards.tsx`. Also update the Paystack plan code env var if the plan is brand new (the plan code is the source of truth for actual billing).
- **Add a new tier** — duplicate one of the existing card blocks in `PlanCards.tsx`, add a feature array, add `NEXT_PUBLIC_PAYSTACK_PLAN_X` env, extend the `tier` union in `verify-payment` + `paystack-webhook` edge functions.
- **Move the "POPULAR" ribbon** — it's the absolute-positioned div inside the Premium card.

## Open ideas / not yet built

- Annual billing toggle (with discount)
- Team / multi-seat plan
- USD pricing for non-Nigerian visitors
- Feature comparison table (vertical) below the cards
