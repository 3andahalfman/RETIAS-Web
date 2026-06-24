# Page: Dashboard — Screenshot Library (admin)

| Attribute | Value |
|---|---|
| **Route** | `/dashboard/screenshots` |
| **File** | `app/dashboard/screenshots/page.tsx` |
| **Auth gate** | Admin only — `user.email === 'admin@retias.com'`. Non-admins see a 🔒 "Admin only" panel. |
| **Status** | Live |

## Purpose

Admin-only review tool for Online Assessment screenshot captures uploaded from the desktop app. Used to inspect what users actually saw + what the AI answered, and to transfer high-quality captures into the curated `solved_questions` library that Premium Plus users browse.

## Layout & sections

1. **Header row** — "Screenshot Library" + sub explanation + Refresh button.
2. **Metrics row** — three cards: Total Captures · Avg Score · Users.
3. **Three-level browse**:
   - **Level 1 — Users grid** (default) — one card per unique uploader, shows email, capture count, and avg score.
   - **Level 2 — Captures list** for the selected user — each row shows detected test type, detected platform, score, source URL, with **📤 Send to Solved Assessment** and **🗑 Delete** quick actions.
   - **Level 3 — Capture detail** — full Q&A view for one capture: scores, score_notes, extracted questions, AI answer, source URL. Send to Solved + Delete actions at the bottom.
4. **Back navigation** — "← Back to users" / "← Back to {user_email}" at the top toolbar.
5. **Send-to-Solved modal** — admin types Platform + Assessment Type (pre-filled from `detected_platform` / `detected_test_type`), reviews extracted questions and AI answer, hits Send. Generates 5 humanized base variants via Electron `paraphraseGenerateVariants` IPC when in the desktop app, otherwise `POST /api/paraphrase-variants` (Claude).

## Components used

Self-contained. Imports admin email check inline.

## Data sources

| Source | Fields read/written | Notes |
|---|---|---|
| Electron IPC `adminListScreenshots` (if running inside Electron) | full row + stats | Admin only, falls back to direct Supabase in browser |
| `from('online_test_captures').select('*')` (browser path) | all rows | RLS gates SELECT to `admin@retias.com` |
| `from('online_test_captures').delete().in('id', ids)` | — | Admin DELETE policy |
| `storage.from('online-test-screenshots').remove(paths)` | — | Storage delete policy for admin |
| `from('solved_questions').insert(rows)` | platform, assessment_type, question, answer, answer_variants, source_capture_id, source_url | Insert via admin RLS |
| Electron IPC `paraphraseGenerateVariants` (desktop only) | string in, string[] out | QuillBot first, Claude fallback |
| `POST /api/paraphrase-variants` (browser path) | `{ answer }` → `{ variants: string[] }` | Admin-only; Claude fallback when not in Electron |

## Features

- Three-level browse: Users → Captures → Q&A detail
- Live metrics (total / avg score / unique users)
- Refresh button on the users level
- Per-capture quick-actions (Send to Solved 📤, Delete 🗑)
- "Send to Solved Assessment bank" modal:
  - Pre-fills Platform + Assessment Type from detected fields
  - Splits questions on blank lines — one row per question into `solved_questions`
  - On desktop, calls QuillBot Premium for 5 humanized base variants per question; falls back to Claude silently if QuillBot is unavailable
  - Shows success / error inline
- Lock screen for non-admin users (page is publicly mounted but data is RLS-gated; UI also surfaces a friendly admin-only message)

## Copy (verbatim, currently live)

> **Header:** Screenshot Library
> **Header sub:** Scored online-test captures from all users — admin only.

> **Metrics labels:** Total Captures · Avg Score · Users
> **Metrics sub:** Stored screenshots · Overall (0–100) · Contributing accounts

> **Empty state:** No captures yet. They appear when users run Online Assessment in the desktop app and click Analyse All.

> **Forbidden:** 🔒 · Admin only · Your account doesn't have access to this page.

> **Modal title:** Send to Solved Assessment bank
> **Modal hint:** Each blank-line-separated question becomes its own row. The same answer is attached to all of them.
> **Modal labels:** Platform · Assessment Type · Questions (blank line between each) · Answer
> **Modal CTAs:** Close · Send / Sending… / Generating humanized variants…
> **Success format:** Added N question(s) to the Solved Assessment bank with M base variants each.

## How to extend

- **Add filters / search** — currently no search at the users grid. Add an input that filters by email substring, and one inside the captures level for question content.
- **Bulk Send** — multi-select captures and send them all to Solved in one batch.
- **Export** — admin export of `online_test_captures` to CSV for offline review.
- **Score adjustments** — let admin override `score_*` fields before sending.
- **Different paraphrase engine** — swap the `paraphraseGenerateVariants` implementation in `electron/lib/paraphrase.ts`; the UI here doesn't need to change.

## Open ideas / not yet built

- Auto-suggest Platform from `source_url` (e.g. `outlier.ai` → "Outlier")
- Charts: captures per day, avg score by platform
- "Promote to featured" toggle so the Solve Assessment page can highlight curated items

## Related desktop docs

This page is the web mirror of the desktop Screenshot Library + Send-to-Solved flow. Behaviour stays in sync via the shared `solved_questions` schema and the (admin-only) IPCs in the Electron build.
