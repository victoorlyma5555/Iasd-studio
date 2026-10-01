-- Bíblia na nuvem: marca-texto e anotações por versículo ficam salvos na conta (além do aparelho).
-- Rode uma vez no SQL Editor do Supabase.
create table if not exists public.iasd_bible_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  highlights jsonb not null default '{}'::jsonb,
  notes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.iasd_bible_data enable row level security;
drop policy if exists "bible_data_own_select" on public.iasd_bible_data;
drop policy if exists "bible_data_own_insert" on public.iasd_bible_data;
drop policy if exists "bible_data_own_update" on public.iasd_bible_data;
drop policy if exists "bible_data_own_delete" on public.iasd_bible_data;
create policy "bible_data_own_select" on public.iasd_bible_data for select using (auth.uid() = user_id);
create policy "bible_data_own_insert" on public.iasd_bible_data for insert with check (auth.uid() = user_id);
create policy "bible_data_own_update" on public.iasd_bible_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bible_data_own_delete" on public.iasd_bible_data for delete using (auth.uid() = user_id);
