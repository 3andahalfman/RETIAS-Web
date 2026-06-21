-- RETIAS subscriptions table — single source of truth for paid access.
-- Access is derived as: status = 'active' AND current_period_end > now().
-- Written by the verify-payment + paystack-webhook edge functions (service role).
-- One row per user (unique user_id) = enforces a single active subscription.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  provider text not null default 'paystack',
  customer_code text,
  subscription_code text,
  plan_code text,
  tier text,                                  -- 'pro' | 'plus'
  status text not null default 'inactive',    -- active | past_due | canceled | expired | inactive
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

alter table public.subscriptions enable row level security;

drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);
