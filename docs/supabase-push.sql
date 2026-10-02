-- Notificações push (celular/computador). Rode UMA vez no Supabase (SQL Editor).
-- ATENÇÃO: escrito a partir do código do site, ainda NÃO testado no banco real.
create table if not exists public.iasd_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists iasd_push_subscriptions_user on public.iasd_push_subscriptions(user_id);
alter table public.iasd_push_subscriptions enable row level security;
drop policy if exists "iasd_push_own_select" on public.iasd_push_subscriptions;
drop policy if exists "iasd_push_own_insert" on public.iasd_push_subscriptions;
drop policy if exists "iasd_push_own_update" on public.iasd_push_subscriptions;
drop policy if exists "iasd_push_own_delete" on public.iasd_push_subscriptions;
create policy "iasd_push_own_select" on public.iasd_push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy "iasd_push_own_insert" on public.iasd_push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy "iasd_push_own_update" on public.iasd_push_subscriptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "iasd_push_own_delete" on public.iasd_push_subscriptions for delete to authenticated using (user_id = auth.uid());
