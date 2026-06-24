# Page: Dashboard — Resume Optimizer

| Attribute | Value |
|---|---|
| **Route** | `/dashboard/resume-optimizer` |
| **File** | `app/dashboard/resume-optimizer/page.tsx` |
| **Auth gate** | Signed-in |
| **Status** | Live |

## Purpose

Scan a resume against a job description, return an ATS-style keyword-match score, list matched and missing keywords, and offer an AI-rewritten version. Designed for users picking which roles to apply to and what to add to their resume before applying.

## Layout & sections

1. **Header** — title + brief explainer.
2. **CV picker** — dropdown of the user's saved CVs; preselects the base CV (`user_metadata.base_cv_id`) if set, otherwise the most recent.
3. **Job Description input** — textarea or "paste a URL" option (URL is scraped server-side for the JD).
4. **Scan button** — kicks off `scanATS(resume, jd)` client-side, then routes to `/dashboard/resume-optimizer/results?scanId=…` with the result.

The actual keyword extraction + scoring logic (`extractKeywords`, `scanATS`) lives at the top of the file as pure functions.

## Components used

Self-contained.

## Data sources

| Source | Fields read | Notes |
|---|---|---|
| `from('cvs')` | id + name + text | CV picker |
| `auth.getUser()` | `user_metadata.base_cv_id` | Default selection |
| Client-side `scanATS` | — | Returns `{ score, matched, missing, total }` |

## Features

- Pick which saved CV to score
- Paste a JD as text **or** a URL (URL → server scrape)
- Stop-word filter + bigram detection (skill phrases like "machine learning") so the keyword set isn't noise
- Match score = matched / total visible JD keywords
- Capped at 80 keywords to keep the UI digestible
- Result page (see `08-…md`) shows the score, matched + missing keyword chips, and an AI-rewrite CTA

## Copy (verbatim, currently live)

(Update once final UI lands — the keyword/scoring constants and intro copy are stable.)

> **Page heading:** Resume Optimizer
> **Page sub:** Match your resume against any job description and see where the gaps are.

## How to extend

- **Improve keyword extraction** — extend `STOP_WORDS` with industry-irrelevant filler, or swap to a small NER/embedding-based scorer server-side.
- **Add a tone / experience-level slider** — pass into the AI rewrite prompt.
- **Score breakdown** — beyond ATS keywords, surface section coverage (Experience / Education / Skills) by checking heading presence.
- **Save scan history** — persist the result to a new `resume_scans` table so the user can compare versions over time.

## Open ideas / not yet built

- Per-keyword "where in the JD" excerpt
- Cover-letter generator off the same JD + CV
- Multi-JD batch scan (e.g. 5 job postings at once)
