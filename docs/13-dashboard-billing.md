# Page: Dashboard — Billing (admin)

| Attribute | Value |
|---|---|
| **Route** | `/dashboard/billing` |
| **File** | `app/dashboard/billing/page.tsx` |
| **Auth gate** | Admin (`admin@retias.com`) |
| **Status** | Live |

## Purpose

Admin-only view of all Paystack subscriptions: user email, plan tier, status, renewal date.

## Layout & sections

1. Page title + refresh
2. Table: email, plan (Premium / Premium Plus / Free), status (active, past_due, canceled, …), renewal, last updated
3. Empty / loading / error states

## Data sources

| Source | Notes |
|---|---|
| `GET /api/admin/billing` | Server route; service role or admin check |

## Features

- Sort/filter by status (if implemented in page)
- Read-only — no inline subscription edits

## Copy

> **Title:** Billing  
> **Subtitle:** All subscriber accounts and renewal dates.

Update when visible headings change.
