-- Sala de Estudo (fase fundador): cursos/lições e progresso individual.
-- Rode uma vez no SQL Editor do Supabase. A sala ao vivo (voz, classe) usa Realtime e não precisa de tabela.

-- só o fundador usa por enquanto
create or replace function public.iasd_study_can()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.iasd_members m where m.user_id = auth.uid() and m.role = 'founder');
$$;

create table if not exists public.iasd_study_courses (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  lessons jsonb not null default '[]'::jsonb,   -- [{title, blocks:[{id,t:'text'|'q'|'v',text|ref,guide}]}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.iasd_study_courses enable row level security;
drop policy if exists iasd_study_courses_all on public.iasd_study_courses;
create policy iasd_study_courses_all on public.iasd_study_courses for all
  using (public.iasd_study_can()) with check (public.iasd_study_can());

create table if not exists public.iasd_study_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null references public.iasd_study_courses(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,      -- {"0":{"a":{"blockId":"resposta"},"d":true}}
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
alter table public.iasd_study_progress enable row level security;
drop policy if exists iasd_study_progress_own on public.iasd_study_progress;
create policy iasd_study_progress_own on public.iasd_study_progress for all
  using (auth.uid() = user_id and public.iasd_study_can())
  with check (auth.uid() = user_id and public.iasd_study_can());
