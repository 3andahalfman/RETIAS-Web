# Page: Dashboard — Resume Optimizer Results

| Attribute | Value |
|---|---|
| **Route** | `/dashboard/resume-optimizer/results` |
| **File** | `app/dashboard/resume-optimizer/results/page.tsx` |
| **Auth gate** | Signed-in |
| **Status** | Live |

## Purpose

Show the outcome of a `scanATS` run: an overall match score, lists of matched and missing keywords, and an AI-rewrite action that produces an optimised version of the resume.

## Layout & sections

1. **Score card** — large number out of 100, colour-coded (green ≥80, amber 60–79, red <60). Tagline matches the score band.
2. **Matched keywords** — green chips list.
3. **Missing keywords** — amber/red chips list — the headline value of the page.
4. **AI Rewrite button** — generates a rewritten resume that integrates missing keywords without losing the original meaning. Premium-only feature.
5. **Rewritten resume panel** — appears below after the rewrite call returns; copy / download / save-as-new-CV actions.
6. **"Run another scan" link** — back to `/dashboard/resume-optimizer`.

## Components used

Self-contained.

## Data sources

| Source | Fields read/written | Notes |
|---|---|---|
| `searchParams.scanId` (or in-memory state from the previous page) | Score, matched, missing, original resume, original JD | Carries the scan result across pages |
| AI rewrite call | Anthropic / OpenAI via a server route (e.g. `/api/resume-rewrite`) | Premium gate |
| `auth.updateUser({ data: { base_cv_id } })` or `cvs.insert(...)` | — | "Save as new CV" path |

## Features

- Visual score card with colour bands
- Matched / Missing keyword chips
- AI-rewritten resume (Premium): paid feature that's gated client-side and validated server-side
- Save the rewrite as a new CV (lands in CV Manager)
- Copy / download the rewrite

## Copy (verbatim, currently live)

(Update once final UI lands.)

> **Score labels:** Excellent match (≥80) · Good match (60–79) · Needs work (<60)
> **CTA:** Generate AI-optimised version
> **Premium nag (free users):** Upgrade to Premium to unlock AI rewrites

## How to extend

- **Per-keyword "Insert into bullet"** — instead of a full rewrite, let the user accept individual missing-keyword insertions.
- **Side-by-side diff** — show original resume on the left, rewritten on the right, with green highlights on added phrases.
- **Score history** — chart of past scans for the same CV across different JDs.
- **PDF export** — generate a styled PDF of the rewritten resume.

## Open ideas / not yet built

- Multiple rewrite styles (concise / detailed / leadership-flavoured)
- Cover letter generation from the same matched/missing set
- "Send to recruiter" — email export
