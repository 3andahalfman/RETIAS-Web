# Page: Dashboard — Session detail

| Attribute | Value |
|---|---|
| **Route** | `/dashboard/sessions/[id]` |
| **File** | `app/dashboard/sessions/[id]/page.tsx` |
| **Auth gate** | Signed-in. Row is also gated `eq('user_id', user.id)` so users only see their own sessions. |
| **Status** | Live |

## Purpose

Drill into one recorded session: header info (company / role / time / duration), then either the AI Q&A pairs or the raw transcript.

## Layout & sections

1. **Loading skeleton** while data loads.
2. **Header** — company, target role, start time (`fmt`), duration (`dur` — minutes between `started_at` and `ended_at`, or "In progress").
3. **Tabs** — "Q&A" / "Transcript".
4. **Tab content**
   - **Q&A** — list of `session_qa` rows, each with question, question_type, answer.
   - **Transcript** — list of `session_transcript` lines (role + text in timestamp order).
5. **404 fallback** — if the session row is missing (or RLS hides it), the page redirects to `/dashboard/sessions`.

## Components used

Self-contained — no shared visual components yet. Likely candidates to extract later: `<QACard>`, `<TranscriptLine>`.

## Data sources

| Source | Fields read | Notes |
|---|---|---|
| `useParams<{id: string}>()` | `id` | URL segment |
| `supabase.auth.getUser()` | `id` | Auth gate |
| `from('past_sessions').single()` | `*` | One row, scoped by `eq('id', id).eq('user_id', user.id)` |
| `from('session_qa')` | `*`, ordered `timestamp asc` | Q&A pairs |
| `from('session_transcript')` | `*`, ordered `timestamp asc` | Raw transcript lines |

All three queries fire in parallel via `Promise.all`.

## Features

- Header metadata (company, role, time, duration)
- Two-tab view: Q&A pairs (default) and raw transcript
- Loading skeleton for entire page
- Auto-redirect to sessions list if the row is unavailable
- "In progress" duration label when `ended_at` is null

## Copy (verbatim, currently live)

> **Tabs:** Q&A · Transcript
> **Duration when not ended:** In progress

(Most copy on this page is data-driven — there's no marketing text to maintain.)

## How to extend

- **Add an "Export" button** (PDF / Markdown of the Q&A) — drop a button beside the tabs and call a new `/api/export-session/[id]` route.
- **Add inline answer regeneration** — for premium users, expose a button per QA row that re-asks the LLM with a different model.
- **Add comments / private notes** — a per-row text input that writes to a new `session_notes` table.
- **Add scoring** — compute a per-session quality score and surface it in the header (use the same scoring approach as `online_test_captures.score_overall`).

## Open ideas / not yet built

- Audio playback alongside transcript (would require uploading session audio — not currently captured to storage)
- Share link (signed URL to a read-only public view)
- "Compare to previous session" diff
