# Page: Dashboard — Overview

| Attribute | Value |
|---|---|
| **Route** | `/dashboard` |
| **File** | `app/dashboard/page.tsx` (wrapped by `app/dashboard/layout.tsx`) |
| **Auth gate** | Signed-in (layout redirects to `/login` otherwise) |
| **Status** | Live |

## Purpose

Home base for a returning user. Greets them, surfaces their headline stats, gives them a one-click path to start a session (which routes to the desktop installer), and shows their last few sessions.

## Layout & sections

1. **Greeting header** — "Welcome, {firstName} 👋" + "Ready for your next interview? Let's get started." (`firstName` derived from `user_metadata.display_name` → `email` local-part → "there").
2. **Stats row** — three `StatCard`s: Total Sessions / This Week / CVs Saved.
3. **Start a Session row** — three cards (Real Interview / Mock Interview / Online Assessment). Each is an `<a>` to the desktop installer.
4. **Recent Sessions glass card** — last 8 `past_sessions` rendered via `SessionRow`. Header has "View all →" link to `/dashboard/sessions`.

## Components used

- `StatCard` ([components/StatCard.tsx](../../components/StatCard.tsx))
- `SessionRow` ([components/SessionRow.tsx](../../components/SessionRow.tsx))
- `Sidebar` ([components/Sidebar.tsx](../../components/Sidebar.tsx)) — from layout

## Data sources

| Source | Fields read | Notes |
|---|---|---|
| `supabase.auth.getUser()` | `id`, `user_metadata.display_name`, `email` | Drives greeting |
| `from('past_sessions')` | `*`, filtered `eq('user_id', user.id)`, ordered by `started_at desc` | All sessions; `slice(0, 8)` for Recent block |
| `from('cvs')` (count head) | id count only | "CVs Saved" stat |

`thisWeek` is computed client-side as sessions with `started_at >= 7 days ago`.

## Features

- Greeting + stat summary
- Three session-type CTAs that link to the Windows installer (the assumption is users do sessions on desktop, the web is for review/management)
- Recent sessions list (top 8) with "View all" overflow to `/dashboard/sessions`
- Loading skeleton state while initial load runs
- "No sessions yet" empty state

## Copy (verbatim, currently live)

> **Greeting:** Welcome, {firstName} 👋
> **Greeting sub:** Ready for your next interview? Let's get started.

> **Stats:** Total Sessions · This Week · CVs Saved

> **Start a Session heading:** Start a Session

### Session-type cards (SESSION_TYPES array)

| Icon | Title | Description | CTA |
|---|---|---|---|
| 🎙️ | Real Interview | Use AI to analyse your answers in real-time as the interviewer speaks. | Start Real Interview |
| 🤖 | Mock Interview | Practice with a simulated interviewer — AI poses questions in real time. | Start Mock |
| 💻 | Online Assessment | Solve coding challenges and assessments with real-time AI help. | Start Test |

> **Recent Sessions heading:** Recent Sessions · "View all →"
> **Empty state:** No sessions yet. Start the desktop app to begin.

## How to extend

- **Add a stat** — append a `<StatCard>` to the stats grid (change `grid-cols-3` to `grid-cols-4`). Pull the value from a new field in `Stats`.
- **Add a new session type** — append to `SESSION_TYPES`. Keep three per row by adjusting the grid breakpoint.
- **Change the Recent count** — modify `s.slice(0, 8)` and consider updating the header sub-text.
- **Route session-type cards somewhere other than the installer** — e.g. an in-browser practice mode. Replace the `<a href={...}>` with `<Link>` and a new route.

## Open ideas / not yet built

- Per-session-type stats inside StatCard (e.g. "12 mocks · 4 real")
- Streak tracker
- Schedule-an-interview reminder
- Embedded "Practice now" mock interview that works in-browser
