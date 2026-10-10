-- Sala de Estudo: leitura, progresso pessoal e salas ao vivo para contas completas.
-- Incremental: não cria/remove tabelas nem altera linhas existentes.

begin;

-- A tabela completa (incluindo gabaritos) segue reservada a quem já tem study.use.
drop policy if exists iasd_study_courses_all on public.iasd_study_courses;
drop policy if exists iasd_study_courses_manage on public.iasd_study_courses;
create policy iasd_study_courses_manage on public.iasd_study_courses
  for all to authenticated
  using (public.iasd_study_can())
  with check (public.iasd_study_can());

-- Catálogo de leitura sem gabaritos, notas privadas ou orientações do dirigente.
create or replace function public.iasd_study_courses_public()
returns table (
  id uuid,
  owner uuid,
  title text,
  description text,
  lessons jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.owner,
    c.title,
    c.description,
    coalesce((
      select jsonb_agg(
        l.lesson || jsonb_build_object(
          'blocks', coalesce((
            select jsonb_agg(b.block - 'guide' - 'note' - 'keys' order by b.ordinality)
            from jsonb_array_elements(coalesce(l.lesson->'blocks', '[]'::jsonb))
              with ordinality as b(block, ordinality)
          ), '[]'::jsonb)
        ) order by l.ordinality
      )
      from jsonb_array_elements(coalesce(c.lessons, '[]'::jsonb))
        with ordinality as l(lesson, ordinality)
    ), '[]'::jsonb) as lessons,
    c.created_at,
    c.updated_at
  from public.iasd_study_courses as c
  where (select auth.uid()) is not null
    and coalesce((select auth.jwt()->>'is_anonymous'), 'false') <> 'true'
  order by c.created_at;
$$;

revoke all on function public.iasd_study_courses_public() from public, anon;
grant execute on function public.iasd_study_courses_public() to authenticated;

-- Cada conta completa lê e grava somente o próprio progresso.
drop policy if exists iasd_study_progress_own on public.iasd_study_progress;
create policy iasd_study_progress_own on public.iasd_study_progress
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and coalesce((select auth.jwt()->>'is_anonymous'), 'false') <> 'true'
  )
  with check (
    user_id = (select auth.uid())
    and coalesce((select auth.jwt()->>'is_anonymous'), 'false') <> 'true'
  );

-- Qualquer conta completa pode criar/retomar uma sala; códigos e chaves continuam validados.
create or replace function public.iasd_study_room_register(p_code text, p_key jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
     or coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'true' then
    raise exception 'É necessário entrar em uma conta do IASD APP';
  end if;

  if p_code is null
     or p_code !~ '^[A-Z0-9]{4,8}$'
     or p_key->>'kty' is distinct from 'EC'
     or p_key->>'crv' is distinct from 'P-256'
     or coalesce(p_key->>'x', '') !~ '^[A-Za-z0-9_-]{43}$'
     or coalesce(p_key->>'y', '') !~ '^[A-Za-z0-9_-]{43}$'
     or p_key ? 'd' then
    raise exception 'Chave pública inválida';
  end if;

  insert into public.iasd_study_rooms as room(code, owner, public_key, expires_at)
    values (p_code, (select auth.uid()), p_key, pg_catalog.now() + interval '12 hours')
  on conflict (code) do update
    set owner = excluded.owner,
        public_key = excluded.public_key,
        expires_at = excluded.expires_at
    where room.owner = (select auth.uid()) or room.expires_at < pg_catalog.now();

  if not found then
    raise exception 'Código de sala já está em uso';
  end if;
  return true;
end
$$;

revoke all on function public.iasd_study_room_register(text, jsonb) from public, anon;
grant execute on function public.iasd_study_room_register(text, jsonb) to authenticated;

commit;
