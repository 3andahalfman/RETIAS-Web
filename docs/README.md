# RETIAS Web — Page Documentation

This folder is the **source of truth** for every page on the RETIAS marketing + dashboard website. Each page has its own doc that describes purpose, content, components, data sources, and update guidance. AI agents (and humans) should read the relevant doc *before* editing a page, then update the doc when the page changes.

## Start here

| Doc | When to read |
|---|---|
| **[FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md)** | **Always** when adding or changing a product feature — register the feature, then update landing/pricing/page docs |
| [_conventions.md](./_conventions.md) | Shared auth gates, tiers, tokens, components |
| [_template.md](./_template.md) | Copy when adding a new page |

## How to use these docs

| When you… | Do this |
|---|---|
| **Ship a new feature (any repo)** | Open [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) → follow **How to append** checklist → update landing/pricing if customer-facing |
| Build a new feature on a page | Open the page doc → check Data sources / Components → make the change → update the doc's *Features* and *Copy* sections |
| Change visible copy or pricing | Update the page doc's *Copy* section + `FEATURE_REGISTRY` if it's a listed feature |
| Add a new page | Copy `_template.md`, fill it in, add to the index below + registry *Website surfaces* table |

## Page index

| # | Doc | Route | File |
|---|---|---|---|
| — | **[Feature registry](./FEATURE_REGISTRY.md)** | — | Master product + marketing map |
| 00 | [Landing](./00-landing.md) | `/` | `app/page.tsx` |
| 01 | [Login](./01-login.md) | `/login` | `app/login/page.tsx` → `AuthPage` |
| 10 | [Sign up](./10-signup.md) | `/signup` | `app/signup/page.tsx` → `AuthPage` |
| 11 | [Forgot password](./11-forgot-password.md) | `/forgot-password` | `app/forgot-password/page.tsx` |
| 12 | [Reset password](./12-reset-password.md) | `/reset-password` | `app/reset-password/page.tsx` |
| 02 | [Pricing](./02-pricing.md) | `/pricing` | `app/pricing/page.tsx` |
| 03 | [Dashboard — Overview](./03-dashboard-overview.md) | `/dashboard` | `app/dashboard/page.tsx` |
| 04 | [Dashboard — Sessions list](./04-dashboard-sessions.md) | `/dashboard/sessions` | `app/dashboard/sessions/page.tsx` |
| 05 | [Dashboard — Session detail](./05-dashboard-session-detail.md) | `/dashboard/sessions/[id]` | `app/dashboard/sessions/[id]/page.tsx` |
| 06 | [Dashboard — CV Manager](./06-dashboard-cvs.md) | `/dashboard/cvs` | `app/dashboard/cvs/page.tsx` |
| 07 | [Dashboard — Resume Optimizer](./07-dashboard-resume-optimizer.md) | `/dashboard/resume-optimizer` | `app/dashboard/resume-optimizer/page.tsx` |
| 08 | [Dashboard — Resume Optimizer Results](./08-dashboard-resume-optimizer-results.md) | `/dashboard/resume-optimizer/results` | `app/dashboard/resume-optimizer/results/page.tsx` |
| 09 | [Dashboard — Screenshot Library (admin)](./09-dashboard-screenshot-library.md) | `/dashboard/screenshots` | `app/dashboard/screenshots/page.tsx` |
| 13 | [Dashboard — Billing (admin)](./13-dashboard-billing.md) | `/dashboard/billing` | `app/dashboard/billing/page.tsx` |

## Shared

- [Conventions](./_conventions.md) — design tokens, auth gates, shared components, Supabase tables
- [Template](./_template.md) — copy this when adding a new page

## Update protocol

When you change a page or feature:

1. Edit the code.
2. **Register or update** [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) (required for new features).
3. Open the corresponding page doc(s).
4. Reflect what changed (copy, components, data, gates).
5. If you added a new public feature, update landing `FEATURES` / pricing `PlanCards` and mark columns `✓` in the registry.
6. Append a line to the registry **Changelog**.

Docs that drift from code are worse than no docs — keep them honest.

## Desktop app docs

Implementation details for the Windows app: `RETIAS/docs/` (sibling repo). When a desktop feature should appear on the website, register it in [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) even if marketing copy is not written yet.
