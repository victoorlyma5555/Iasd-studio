-- Meu estudo: respostas, lições concluídas, selos e troféu no perfil de cada pessoa.
-- Rode uma vez no Supabase (SQL Editor). Sem isto o app guarda só no aparelho.
create table if not exists public.iasd_study_me (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.iasd_study_me enable row level security;
drop policy if exists iasd_study_me_own on public.iasd_study_me;
create policy iasd_study_me_own on public.iasd_study_me
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
