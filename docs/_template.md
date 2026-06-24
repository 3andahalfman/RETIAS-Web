# Page: {{ Name }}

| Attribute | Value |
|---|---|
| **Route** | `/...` |
| **File** | `app/.../page.tsx` |
| **Auth gate** | Public / Signed-in / Premium / Premium+ / Admin |
| **Status** | Live / WIP / Deprecated |

## Purpose

One or two sentences. Who is this page for and what should they leave it having done?

## Layout & sections (top to bottom)

1. **Section name** — what it shows, key copy if any.
2. ...

## Components used

- `ComponentName` ([components/ComponentName.tsx](../../components/ComponentName.tsx)) — purpose

## Data sources

| Source | Fields read | Notes |
|---|---|---|
| `supabase.auth.getUser()` | `id`, `email`, `app_metadata` | |
| `from('table')` | columns | RLS rule that protects it |

## Features

Plain-English bullets of what the page can do today. AI agents read this first.

- Feature 1
- Feature 2

## Copy (verbatim, currently live)

> Header copy here

> Subhead

> Body paragraphs

Update this section every time visible text changes.

## How to extend

- To add X, change Y in file Z
- Common pitfalls:
  - …

## Open ideas / not yet built

- …
