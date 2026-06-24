# Page: Dashboard — Sessions list

| Attribute | Value |
|---|---|
| **Route** | `/dashboard/sessions` |
| **File** | `app/dashboard/sessions/page.tsx` |
| **Auth gate** | Signed-in |
| **Status** | Live |

## Purpose

Complete searchable + filterable history of every interview session the signed-in user has run. Each row links to the detail page.

## Layout & sections

1. **Header row** — "Sessions" + count subtitle ("N total sessions") on the left; "+ New Session" CTA (links to installer) on the right.
2. **Search input** — full-text filter on `company` and `target_role`.
3. **Tabs** — All / Interview / Mock / Online Assessment (filters by `session_type`).
4. **Results glass card** — list of `SessionRow`s. Loading skeleton while initial fetch runs. Empty state if no matches.

## Components used

- `SessionRow` ([components/SessionRow.tsx](../../components/SessionRow.tsx)) — renders a single row + click-through to detail.

## Data sources

| Source | Fields read | Notes |
|---|---|---|
| `supabase.auth.getUser()` | `id` | |
| `from('past_sessions')` | `*`, filtered `eq('user_id', user.id)`, ordered `started_at desc` | One round trip, filtered client-side |

`matchesTab` maps:
- All → everything
- Interview → `session_type === 'interview'`
- Mock → `session_type === 'mock'`
- Online Assessment → `session_type === 'online_test'` or `'online test'`

Internal IDs stay legacy (`online_test`) to avoid breaking older rows.

## Features

- Full list of user's sessions, newest first
- Text search across company + target_role (case-insensitive)
- Tab filter by session type
- Loading skeleton
- Empty states differentiate "no sessions yet" from "no matches for this search"
- "+ New Session" CTA points to the Windows installer (sessions originate in desktop)

## Copy (verbatim, currently live)

> **Heading:** Sessions
> **Subtitle:** N total session(s)
> **CTA:** + New Session
> **Search placeholder:** Search sessions…
> **Tabs:** All · Interview · Mock · Online Assessment
> **Empty states:** "No sessions match your search." / "No sessions yet."

## How to extend

- **Add a filter dimension** (e.g. by company) — add another tab row or a select dropdown above the tabs and chain another filter in the `useEffect` that builds `filtered`.
- **Add sorting** — currently fixed to newest first; expose a sort menu by switching the `useEffect` to apply a configurable comparator before slicing.
- **Pagination** — replace the `select('*')` with `range(start, end)` once the list grows beyond ~100 sessions.
- **Bulk delete** — would require an admin-style action menu + an RLS-checked delete RPC.

## Open ideas / not yet built

- Date range picker
- "Group by week"
- Export to CSV
