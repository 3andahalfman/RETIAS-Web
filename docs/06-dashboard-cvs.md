# Page: Dashboard — CV Manager

| Attribute | Value |
|---|---|
| **Route** | `/dashboard/cvs` |
| **File** | `app/dashboard/cvs/page.tsx` |
| **Auth gate** | Signed-in |
| **Status** | Live |

## Purpose

Review, set-base, and delete CVs that the user uploaded from the desktop app. The web side is read-only-ish (no upload here yet — uploads happen in the desktop app).

## Layout & sections

1. **Banner** — gradient explainer about "base resume" (the one Resume Optimizer uses by default).
2. **Header row** — "CV Manager" + sub line "N document(s) · manage via the desktop app".
3. **Loading state** — three pulsing skeleton rows.
4. **Empty state** — large 📄 icon + "No CVs uploaded yet. Upload CVs from the desktop app."
5. **CV table** (glass card) with columns:
   - **Base** — star toggle (sets / unsets the base CV; stored in `user_metadata.base_cv_id`)
   - **Resume** — name + character count
   - **Created** date
   - **Last Modified** date (currently same as Created)
   - **Actions** — Preview (👁) and Delete (🗑)
6. **Footer count** — "Showing 1–N of N".
7. **Preview modal** — full-screen overlay with `<pre>` of the CV text.

## Components used

Self-contained. Likely candidates to extract: `<CvRow>`, `<PreviewModal>`.

## Data sources

| Source | Fields read/written | Notes |
|---|---|---|
| `supabase.auth.getUser()` | `id`, `user_metadata.base_cv_id` | |
| `from('cvs').select('*').eq('user_id', user.id)` | All user CVs | RLS gated to owner |
| `auth.updateUser({ data: { base_cv_id } })` | Sets/clears the base CV id in user_metadata | Toggling star calls this |
| `from('cvs').delete().eq('id', id)` | — | Also clears `base_cv_id` if the deleted CV was the base |

## Features

- View all CVs (newest first)
- Star one CV as the "base" (defaults for new Resume Optimizer scans)
- Preview any CV's text in a modal
- Delete a CV (with browser confirm dialog)
- "Manage via the desktop app" line for the upload flow (uploads aren't yet supported on web)

## Copy (verbatim, currently live)

> **Banner heading:** Select a base resume to save time.
> **Banner body:** Your base resume is used by default for all new scans. Star an established resume to save time on future scans.

> **Header heading:** CV Manager
> **Header sub:** N document(s) · manage via the desktop app

> **Empty state:** No CVs uploaded yet. · Upload CVs from the desktop app.

> **Column headers:** Base · Resume · Created · Last Modified · Actions
> **Footer:** Showing 1–N of N

> **Star button title:** Set as base resume / Remove as base resume
> **Delete confirm:** Delete this CV?

## How to extend

- **Add CV upload from web** — drop a file input above the table that POSTs to a new `/api/cv/upload` route. Parse PDF/DOCX server-side (the desktop app uses `pdf-parse` + `mammoth`).
- **Add "Last Modified" tracking** — add an `updated_at` column to `cvs` and a trigger/upsert flow when text edits land.
- **Inline rename** — currently CV name is set at upload time. Add an Edit (✏) button that PATCHes the row.
- **Multi-base CVs by category** — store an object `base_cv_ids: { engineering, design, … }` in user_metadata if users need multiple defaults.

## Open ideas / not yet built

- Drag-and-drop reordering
- Tag / category labels
- In-place markdown editor for the CV text
- Diff view between two CVs
