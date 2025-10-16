-- Supabase Schema for Captain Clean Sheet
-- This script creates core tables, constraints, indexes, and RLS policies
-- used across the application. Run in your Supabase project SQL editor
-- or via migrations. Adjust as needed for your environment.

-- Extensions (pgcrypto provides gen_random_uuid)
create extension if not exists pgcrypto;

-- =====================
-- profiles
-- =====================
-- Stores per-user metadata and plan information; linked to auth.users
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  plan text,
  plan_expires timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create/maintain profile rows on new users
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
drop policy if exists profiles_select_owner on public.profiles;
create policy profiles_select_owner
  on public.profiles for select
  using (user_id = auth.uid());

drop policy if exists profiles_update_owner on public.profiles;
create policy profiles_update_owner
  on public.profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =====================
-- subscriptions
-- =====================
-- Tracks user or org subscriptions synced via Creem webhooks
create table if not exists public.subscriptions (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  org_id uuid,
  subscription_id text unique,
  customer_id text,
  plan text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_org_id_idx on public.subscriptions (org_id);
create index if not exists subscriptions_period_end_idx on public.subscriptions (current_period_end);

alter table public.subscriptions enable row level security;
drop policy if exists subscriptions_select_owner on public.subscriptions;
create policy subscriptions_select_owner
  on public.subscriptions for select
  using (user_id = auth.uid());

-- =====================
-- usage_events
-- =====================
-- Audits plugin/API usage for rate limiting and analytics
create table if not exists public.usage_events (
  id bigserial primary key,
  event_id text not null unique,
  user_id uuid references auth.users(id) on delete cascade,
  org_id uuid,
  installation_id text,
  event_type text not null,
  units integer not null default 1 check (units >= 0),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_day_idx on public.usage_events (user_id, created_at);
create index if not exists usage_events_org_day_idx on public.usage_events (org_id, created_at);

alter table public.usage_events enable row level security;
drop policy if exists usage_events_select_owner on public.usage_events;
create policy usage_events_select_owner
  on public.usage_events for select
  using (user_id = auth.uid());

-- Optionally allow owners to insert their own usage events (disabled by default)
-- drop policy if exists usage_events_insert_owner on public.usage_events;
-- create policy usage_events_insert_owner
--   on public.usage_events for insert
--   with check (user_id = auth.uid());

-- =====================
-- refresh_tokens
-- =====================
-- Stores long-lived refresh tokens for plugin access exchange; admin-only access
create table if not exists public.refresh_tokens (
  token text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.refresh_tokens enable row level security;
-- No policies: regular users cannot read/write; service role bypasses RLS

create index if not exists refresh_tokens_user_idx on public.refresh_tokens (user_id);
create index if not exists refresh_tokens_expiry_idx on public.refresh_tokens (expires_at);

-- =====================
-- api_keys (PAT)
-- =====================
-- Personal Access Tokens (plaintext stored only for demo purposes)
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('active','revoked')) default 'active',
  plaintext_key text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists api_keys_user_idx on public.api_keys (user_id);

alter table public.api_keys enable row level security;
drop policy if exists api_keys_select_owner on public.api_keys;
create policy api_keys_select_owner
  on public.api_keys for select
  using (user_id = auth.uid());

drop policy if exists api_keys_update_owner on public.api_keys;
create policy api_keys_update_owner
  on public.api_keys for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists api_keys_insert_owner on public.api_keys;
create policy api_keys_insert_owner
  on public.api_keys for insert
  with check (user_id = auth.uid());

-- =====================
-- device_codes
-- =====================
-- Device code login flow: server creates code; user approves; server exchanges for tokens
create table if not exists public.device_codes (
  code text primary key,
  status text not null check (status in ('pending','approved','claimed','expired')),
  user_id uuid references auth.users(id) on delete set null,
  verification_uri text,
  expires_at timestamptz not null,
  approved_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists device_codes_status_idx on public.device_codes (status);
create index if not exists device_codes_expiry_idx on public.device_codes (expires_at);

alter table public.device_codes enable row level security;
-- No policies: access via server/admin only

-- =====================
-- webhooks_log
-- =====================
-- Creem webhook idempotency and processing log
create table if not exists public.webhooks_log (
  id bigserial primary key,
  event_id text,
  type text,
  digest text not null unique,
  payload jsonb,
  received_at timestamptz not null default now(),
  status text not null check (status in ('received','processed','error')),
  error text
);

create index if not exists webhooks_log_received_idx on public.webhooks_log (received_at);

-- Ensure event_id is unique when present to strengthen idempotency
create unique index if not exists webhooks_log_event_unique
  on public.webhooks_log (event_id)
  where event_id is not null;

alter table public.webhooks_log enable row level security;
-- No policies: admin-only access

-- =====================
-- Helpful grants (ensure authenticated role can access rows via policies)
-- Supabase creates roles like authenticated/anon; RLS governs access
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.usage_events to authenticated;
grant all on public.api_keys to authenticated;

-- End of schema