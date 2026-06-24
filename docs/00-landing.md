# Page: Landing

| Attribute | Value |
|---|---|
| **Route** | `/` |
| **File** | `app/page.tsx` |
| **Auth gate** | Public — but logged-in users are auto-redirected to `/dashboard` |
| **Status** | Live |

## Purpose

The marketing front door. A first-time visitor should leave knowing what RETIAS does, who it's for, and how to either start the free dashboard or download the desktop app. Returning, signed-in users skip this and land on their dashboard.

## Layout & sections (top to bottom)

1. **Auto-redirect effect** — `supabase.auth.getSession()` on mount; if a session exists, `router.replace('/dashboard')`. Local read, no network round-trip.
2. **Sticky navbar** — Logo · "Features" / "How it works" / "Pricing" (`#features`, `#how`, `/pricing`) · "Sign in" + "Get started free" CTA.
3. **Hero** — pill ("Real-time AI interview coaching"), headline ("Ace every interview with real-time AI coaching"), supporting paragraph, two CTAs (Start for free, Download Desktop App), social-proof line.
4. **Features grid** (`#features`) — six (or more) feature cards driven by the `FEATURES` array at the bottom of the file. Each card: icon, title, description, tinted background.
5. **Session types** (`#how`) — three cards (Real Interview / Mock Interview / Online Assessment & Onboarding) driven by `SESSION_TYPES`.
6. **CTA banner** — "Ready to ace your next interview?" with the same two CTAs as the hero.
7. **Footer** — small RETIAS mark + Support / Download / Sign in links + copyright.

## Components used

- `Link` (`next/link`) — internal routing
- No shared UI components — page is self-contained inline JSX

## Data sources

| Source | Fields read | Notes |
|---|---|---|
| `supabase.auth.getSession()` | `session` only | Used purely to auto-redirect signed-in users |

## Features

- Auto-redirect signed-in users to `/dashboard`
- Marketing presentation: hero, features, session types, CTA, footer
- Direct download link to the Windows installer
- Mobile responsive via inline `@media (max-width: 768px)` rules in the page's `<style>` block

## Copy (verbatim, currently live)

> **Pill:** Real-time AI interview coaching

> **Headline:** Ace every interview with real-time AI coaching

> **Supporting:** RETIAS listens to your interview in real time and delivers precise, structured answers — so you can focus on performing, not memorising.

> **Hero CTAs:** Start for free → · ⬇ Download Desktop App

> **Social proof line:** Free to use · No credit card required · Windows desktop app available

> **Features section heading:** Everything you need to land the job
> **Features section subhead:** Built for serious candidates who want an edge — without the prep burnout.

> **Session types heading:** Three modes. Every scenario covered.
> **Session types subhead:** Whether it's a live interview, a practice run, or a coding challenge — RETIAS has a mode for it.

> **CTA banner:** Ready to ace your next interview?
> Join thousands of candidates using RETIAS to perform at their best.

### Feature card content (FEATURES array, source of truth)

| Icon | Title | Description |
|---|---|---|
| 🎙️ | Real-time transcription | Instantly transforms spoken audio into text as the interviewer speaks, giving you the full context in real time. |
| 🧠 | Context-aware answers | Tailored answers based on your CV, the job description, and the specific question — not generic responses. |
| 👁️ | Stealth mode overlay | Invisible to screen-sharing software. Only you can see the overlay — your interviewer sees nothing. |
| 📄 | CV-aware suggestions | Upload your resume and RETIAS personalises every answer to match your actual experience and skills. |
| ✨ | Resume Optimizer | Scan your resume against any job description and get an ATS score, keyword gaps, and an AI-optimised version. |
| 📊 | Session history & analytics | Review every session, track your progress, and identify patterns across companies and roles. |

When you add features, also surface them here AND in the pricing doc.

## How to extend

- **Add a feature card** — append to `FEATURES` at the bottom of `app/page.tsx` and add the row to the table above. Pick an icon + a `bg: rgba(R,G,B,0.15)` tint that hasn't been used yet.
- **Add a session-type card** — append to `SESSION_TYPES`.
- **Change a CTA URL** — search for the desktop download URL pattern (`RETIAS-Setup.exe`) before swapping; it appears multiple places.
- **Add a new section between Features and Session Types** — wrap it in `<section className="landing-section">` so it inherits the responsive padding.

## Open ideas / not yet built

- Testimonials/quotes section
- Demo video embed
- Comparison table vs other tools
