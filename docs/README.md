# RETIAS Web — Page Documentation

This folder is the **source of truth** for every page on the RETIAS marketing + dashboard website. Each page has its own doc that describes purpose, content, components, data sources, and update guidance. AI agents (and humans) should read the relevant doc *before* editing a page, then update the doc when the page changes.

## How to use these docs

| When you… | Do this |
|---|---|
| Build a new feature on a page | Open the page doc → check Data sources / Components → make the change → update the doc's *Features* and *Copy* sections |
| Change visible copy or pricing | Update the page doc's *Copy* section so it matches what's live |
| Add a new page | Copy `_template.md`, fill it in, add the entry to the index below |
| Read shared rules | See `_conventions.md` |

## Page index

| # | Doc | Route | File |
|---|---|---|---|
| 00 | [Landing](./00-landing.md) | `/` | `app/page.tsx` |
| 01 | [Login + Sign up](./01-login.md) | `/login` | `app/login/page.tsx` |
| 02 | [Pricing](./02-pricing.md) | `/pricing` | `app/pricing/page.tsx` |
| 03 | [Dashboard — Overview](./03-dashboard-overview.md) | `/dashboard` | `app/dashboard/page.tsx` |
| 04 | [Dashboard — Sessions list](./04-dashboard-sessions.md) | `/dashboard/sessions` | `app/dashboard/sessions/page.tsx` |
| 05 | [Dashboard — Session detail](./05-dashboard-session-detail.md) | `/dashboard/sessions/[id]` | `app/dashboard/sessions/[id]/page.tsx` |
| 06 | [Dashboard — CV Manager](./06-dashboard-cvs.md) | `/dashboard/cvs` | `app/dashboard/cvs/page.tsx` |
| 07 | [Dashboard — Resume Optimizer](./07-dashboard-resume-optimizer.md) | `/dashboard/resume-optimizer` | `app/dashboard/resume-optimizer/page.tsx` |
| 08 | [Dashboard — Resume Optimizer Results](./08-dashboard-resume-optimizer-results.md) | `/dashboard/resume-optimizer/results` | `app/dashboard/resume-optimizer/results/page.tsx` |
| 09 | [Dashboard — Screenshot Library (admin)](./09-dashboard-screenshot-library.md) | `/dashboard/screenshots` | `app/dashboard/screenshots/page.tsx` |

## Shared

- [Conventions](./_conventions.md) — design tokens, auth gates, shared components, Supabase tables
- [Template](./_template.md) — copy this when adding a new page

## Update protocol

When you change a page:
1. Edit the code.
2. Open the corresponding doc.
3. Reflect what changed (copy, components, data, gates).
4. If you added a new public feature, also add a one-liner to the top-level `## Features` section of the *Landing* doc and the *Pricing* doc.

Docs that drift from code are worse than no docs — keep them honest.
