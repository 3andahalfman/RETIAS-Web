# Product feature registry

**Single catalog of every user-facing RETIAS capability** and where it appears on the website. Update this file **first** whenever you ship a new feature, then propagate copy to the pages listed in [Website surfaces](#website-surfaces).

Cross-repo: desktop implementation details live in `RETIAS/docs/` (views + `features/`). This file is the **marketing & website content** source of truth.

---

## How to append a new feature (required checklist)

When you add **any** new user-facing feature (desktop, web, or both):

1. **Add a row** to [Master feature list](#master-feature-list) below (use the next `F-###` id).
2. **Set website columns** — `Landing`, `Pricing`, `Dashboard` → `✓`, `partial`, `—`, or `admin`.
3. **If the feature is customer-facing marketing:**
   - Append to `FEATURES` in `app/page.tsx` **and** update the table in [00-landing.md](./00-landing.md).
   - If tier-gated, append to the correct array in `lib/plan-features.ts` **and** update [02-pricing.md](./02-pricing.md).
4. **If it gets its own page or dashboard section** — copy `_template.md`, add to [README.md](./README.md) page index, fill the page doc.
5. **Add a changelog entry** at the bottom of this file (date + feature id + one line).
6. **Desktop-only features:** still register here so the website gap is visible until copy is added.

> Docs that drift from code are worse than no docs — mark `partial` or `—` honestly until marketing is updated.

---

## Master feature list

| ID | Feature | Description (user-facing) | Tier | Ships on | Landing | Pricing | Dashboard |
|---|---|---|---|---|---|---|---|
| F-001 | Real-time transcription | Live speech-to-text during interviews and assessments | Free | Desktop | ✓ | ✓ | — |
| F-002 | Context-aware answers | AI answers use CV, job description, and the question asked | Free | Desktop | ✓ | ✓ | — |
| F-003 | Stealth overlay | Overlay hidden from screen sharing; dock/expand workflow | Free | Desktop | ✓ | ✓ | — |
| F-004 | CV Manager | Upload and manage resumes; powers personalised answers | Free (3 CVs) | Desktop + Web | ✓ | ✓ | ✓ (`/dashboard/cvs`) |
| F-005 | Resume Optimizer | ATS score, keyword gaps, AI-optimised CV vs a job description | Premium | Web + Desktop link | — | — | ✓ |
| F-006 | Session history | Review past sessions, Q&A, transcripts | Free | Desktop + Web | ✓ | ✓ | ✓ (`/dashboard/sessions`) |
| F-007 | Real Interview mode | Live coaching during a real job interview | Free (10 min cap) | Desktop | session card | — | CTA → download |
| F-008 | Mock Interview mode | Practice with YouTube mock interview audio | Free | Desktop | session card | ✓ | CTA → download |
| F-009 | Online Assessment | Screenshot capture + AI analysis for tests/onboarding | Premium | Desktop | ✓ | ✓ | CTA → download |
| F-010 | Dual-monitor capture | Capture from a chosen display during online tests | Premium | Desktop | — | — | — |
| F-011 | Manual prompt bar | Type a custom prompt mid-session | Premium | Desktop | — | ✓ | — |
| F-012 | AI model picker | Choose Sonnet vs Opus (Opus gated) | Premium / Plus | Desktop | — | ✓ | — |
| F-013 | Solved Assessment library | Browse curated Q&A by platform; study or go live | Premium Plus | Desktop | ✓ | ✓ | — |
| F-014 | Paraphrase / Humanize | Highlight answer text → QuillBot-style rewrite (admin opt-in per question) | Premium Plus | Desktop | ✓ | ✓ | — |
| F-015 | Auto-Typer | Paste answers into any field at human-like speed | All (usage varies) | Desktop | ✓ | ✓ | — |
| F-016 | Go Live (Solved Q&A) | Run a live assessment session from a saved solved question | Premium Plus | Desktop | — | — | — |
| F-017 | Screenshot Library (admin) | Review scored captures; send Q&A to Solved bank | Admin | Desktop + Web | — | — | admin (`/dashboard/screenshots`) |
| F-018 | Admin billing overview | All subscribers, plan, renewal status | Admin | Web | — | — | admin (`/dashboard/billing`) |
| F-019 | Paystack subscriptions | Upgrade / switch Premium ↔ Premium Plus | — | Web | — | ✓ | modal in sidebar |
| F-020 | Google sign-in | OAuth via Supabase | Free | Web | — | — | login/signup |
| F-021 | Email sign-up / sign-in | Email + password auth; unique display name | Free | Web | — | — | `/login`, `/signup` |
| F-022 | Password reset | Forgot + reset password email flow | Free | Web | — | — | `/forgot-password`, `/reset-password` |
| F-023 | One account per device | Desktop binds PC to first logged-in user | Free | Desktop | — | — | — |
| F-024 | Auto-updater | In-app update download + install | Free | Desktop | — | — | — |
| F-025 | Email support | `mailto:` support link | — | Web + Desktop | footer | — | sidebar |

**Legend:** `✓` = clearly mentioned · `partial` = implied or incomplete · `—` = not on that surface · `admin` = admin-only

---

## Website content gaps

| ID | Feature | Notes |
|---|---|---|
| F-023 | One account per device | Intentionally not marketed (security policy) |
| F-017–F-018 | Admin tools | Admin-only; not on public marketing pages |
| F-024 | Auto-updater | Desktop-only; not marketed on web |

---

## Website surfaces

| Surface | Doc | Code source of truth for copy |
|---|---|---|
| Landing `/` | [00-landing.md](./00-landing.md) | `app/page.tsx` → `FEATURES`, `SESSION_TYPES` |
| Login `/login` | [01-login.md](./01-login.md) | `components/AuthPage.tsx` |
| Sign up `/signup` | [10-signup.md](./10-signup.md) | `components/AuthPage.tsx` (`initialMode="signup"`) |
| Forgot password | [11-forgot-password.md](./11-forgot-password.md) | `app/forgot-password/page.tsx` |
| Reset password | [12-reset-password.md](./12-reset-password.md) | `app/reset-password/page.tsx` |
| Pricing `/pricing` | [02-pricing.md](./02-pricing.md) | `lib/plan-features.ts` → imported by `components/PlanCards.tsx` |
| Dashboard overview | [03-dashboard-overview.md](./03-dashboard-overview.md) | `app/dashboard/page.tsx` |
| Sessions | [04-dashboard-sessions.md](./04-dashboard-sessions.md) | `app/dashboard/sessions/page.tsx` |
| Session detail | [05-dashboard-session-detail.md](./05-dashboard-session-detail.md) | `app/dashboard/sessions/[id]/page.tsx` |
| CV Manager | [06-dashboard-cvs.md](./06-dashboard-cvs.md) | `app/dashboard/cvs/page.tsx` |
| Resume Optimizer | [07-dashboard-resume-optimizer.md](./07-dashboard-resume-optimizer.md) | `app/dashboard/resume-optimizer/page.tsx` |
| Optimizer results | [08-dashboard-resume-optimizer-results.md](./08-dashboard-resume-optimizer-results.md) | `app/dashboard/resume-optimizer/results/page.tsx` |
| Screenshot Library | [09-dashboard-screenshot-library.md](./09-dashboard-screenshot-library.md) | `app/dashboard/screenshots/page.tsx` |
| Billing (admin) | [13-dashboard-billing.md](./13-dashboard-billing.md) | `app/dashboard/billing/page.tsx` |

---

## Changelog

Append-only — newest first.

| Date | ID(s) | Note |
|---|---|---|
| 2025-06-23 | F-002, F-003, F-004 | Sync pricing tiers with landing — Context-aware answers, CV-aware, stealth; centralised bullets in `lib/plan-features.ts` |
| 2025-06-23 | F-009–F-016, F-015 | Landing + pricing + dashboard copy updated for screenshot analyse, Solved library, Go Live, paraphrase, Auto-Typer, dual-monitor |
| 2025-06-23 | — | Created feature registry; documented website content gaps vs desktop app |
| 2025-06-23 | F-025 | Support email → `realmsemerald@gmail.com` (temporary until domain mail forwarding) |
| 2025-06-23 | F-021–F-022 | Added `/signup`, forgot-password, reset-password page docs to index |
| 2025-06-23 | F-023 | Desktop one-account-per-device binding (not on website) |
