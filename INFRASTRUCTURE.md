# RETIAS — Infrastructure Map

A pointer to **where everything lives**: repos, environments, env variables, Supabase, Vercel, and Paystack.

> ⚠️ **No secret values are stored in this file — only their names and locations.**
> Secrets live in `.env` files (gitignored), Vercel env vars, and Supabase secrets.

---

## 1. Repositories

| Repo | Path | GitHub | What it is |
|------|------|--------|------------|
| Desktop app | `c:\Users\emera\RETIAS` | `3andahalfman/RETIAS` (branch `master`) | Electron + Vite app. Also holds the Supabase **edge functions** (`supabase/functions/`). |
| Website | `c:\Users\emera\RETIAS-Web` | `3andahalfman/RETIAS-Web` (`dev` → `staging` → `master`) | Next.js 14 site + dashboard, deployed on Vercel. |

---

## 2. Local development

| App | Command (run in repo root) | URL |
|-----|----------------------------|-----|
| Website | `npm run dev` | http://localhost:3000 |
| Desktop | `npm run dev` (Vite + Electron) | Vite at http://localhost:5173 |

- Node.js: `C:\Program Files\nodejs`
- Supabase CLI: `%LOCALAPPDATA%\supabase-cli\supabase.exe`

---

## 3. Environment variables

### Website — `RETIAS-Web/.env.local`  *(gitignored)*
Mirrored into **Vercel → Project → Settings → Environment Variables**.

| Variable | Secret? | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Publishable anon key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | public | `pk_test_…` (test) / `pk_live_…` (live) |
| `NEXT_PUBLIC_PAYSTACK_PLAN_PRO` | public | Premium plan code |
| `NEXT_PUBLIC_PAYSTACK_PLAN_PLUS` | public | Premium Plus plan code |
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRET** | Server-only (used by `/api/register`). Never `NEXT_PUBLIC`. |

### Desktop — `RETIAS/.env`  *(gitignored; see `RETIAS/.env.example`)*
Keys: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, code-signing (`CSC_*` / Azure), `NODE_ENV`.
*(The `VITE_PAYSTACK_*` vars are no longer used — the desktop app links to the website for checkout.)*

---

## 4. Supabase

- **Dashboard:** https://supabase.com/dashboard/project/ygvqhvqplgljrksquwsr
- **Project ref:** `ygvqhvqplgljrksquwsr`
- **URL:** `https://ygvqhvqplgljrksquwsr.supabase.co`

### Auth
- Users live in **Authentication → Users**.
- Cached premium flags on `app_metadata`: `is_premium`, `is_premium_plus`, `premium_tier`.
- **Auth → URL Configuration:** add deployed domains here for Google OAuth redirects (localhost + Vercel + retiasai.com).

### Key tables
- **`subscriptions`** — source of truth for paid access. Migration: `RETIAS-Web/supabase-subscriptions-migration.sql`.
  - Columns: `user_id` (unique), `provider`, `customer_code`, `subscription_code`, `plan_code`, `tier` (`pro`|`plus`), `status` (`active`|`past_due`|`canceled`|…), `current_period_end`.
  - Access = `status='active' AND current_period_end > now()`.
- Others: `profiles`, `past_sessions`, `session_qa`, `cvs`, online-test capture tables.

### Edge functions  *(source in `RETIAS/supabase/functions/`)*
Deploy: `supabase functions deploy <name> --no-verify-jwt --project-ref ygvqhvqplgljrksquwsr`

| Function | Purpose |
|----------|---------|
| `verify-payment` | Verifies a Paystack transaction after checkout, writes `subscriptions`, sets flags |
| `paystack-webhook` | Handles `charge.success`, `invoice.payment_failed`, `subscription.disable` |
| `cancel-subscription` | Disables the user's Paystack subscription (used by cancel + plan switch) |

### Edge function secrets  *(set via `supabase secrets set …`)*
- `PAYSTACK_SECRET_KEY` — **SECRET** (`sk_test_…` / `sk_live_…`)
- `PAYSTACK_PLAN_PLUS` — Premium Plus plan code (for tier mapping)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by Supabase

---

## 5. Vercel

- **Account:** `3andahalfman`
- **Project:** `retias-web` (`prj_cKvsfMh1fRBmGr1OwO9GzB3067aK`)
- **Deployment protection:** currently **disabled** (previews are public)

### Environments
Three **hosted** environments (localhost is not used as an environment):

| Environment | Branch | URL | Purpose | Vercel target |
|-------------|--------|-----|---------|---------------|
| **Development** | `dev` | https://retias-web-git-dev-3andahalfmans-projects.vercel.app | active work | `Preview` |
| **Staging** | `staging` | https://retias-web-git-staging-3andahalfmans-projects.vercel.app | final check | `Preview` |
| **Production** | `master` | **https://www.retiasai.com** (+ retiasai.com) | live | `Production` |

**Flow:** `dev` → merge to `staging` → merge to `master`.
Each push auto-deploys to that branch's URL.

> The 6 env vars from §3 are set for both `Production` and `Preview` targets (Preview covers `dev` + `staging`).
> *Local `npm run dev` (localhost:3000, reads `.env.local`) is optional — it is **not** an environment.*

---

## 6. Paystack

- **Dashboard:** https://dashboard.paystack.com (toggle **Test ↔ Live** top-right)
- **Webhook URL** (set under Settings → API Keys & Webhooks, **separately for Test and Live**):
  `https://ygvqhvqplgljrksquwsr.supabase.co/functions/v1/paystack-webhook`

### Plans
| Tier | Price | Test plan code | Live plan code |
|------|-------|----------------|----------------|
| Premium | ₦10,000/mo | `PLN_wsrschrbywm1908` | `PLN_lb1dsm9ywkyx9q2` |
| Premium Plus | ₦25,000/mo | `PLN_xutk4b9wubm5tsc` | `PLN_h1kks52qko847zv` |

### Keys
- Public: `pk_test_…` / `pk_live_…` → in the website env (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`).
- Secret: `sk_test_…` / `sk_live_…` → **Supabase secret** `PAYSTACK_SECRET_KEY` only. Never in the repo or frontend.

---

## 7. Going live (test → live checklist)

1. **Website env (Vercel + `.env.local`):** swap to `pk_live_…`, `PLN_lb1dsm9ywkyx9q2` (Pro), `PLN_h1kks52qko847zv` (Plus).
2. **Supabase secrets:** `PAYSTACK_SECRET_KEY` → `sk_live_…`; `PAYSTACK_PLAN_PLUS` → `PLN_h1kks52qko847zv`.
3. **Paystack (Live mode):** set the Live webhook URL (above); ensure the account is **activated** for live.
4. **Deploy:** promote `dev → staging → master`, deploy production (→ www.retiasai.com), redeploy after env changes.
5. **Supabase Auth:** add `https://retiasai.com` to redirect URLs.

---

## 8. Payment flow (how it fits together)

```
User → /pricing (or dashboard "Manage plan" modal)
  → Paystack popup (plan checkout)
  → verify-payment edge fn  → writes subscriptions + app_metadata flags
  → paystack-webhook        → confirms / renews / cancels (source of truth)
  → success dialog → dashboard reflects new tier
Plan switch → cancel-subscription (disable old) → checkout new plan
```
