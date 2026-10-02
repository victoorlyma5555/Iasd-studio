-- Etapa 2 · arquivo C: três funções do banco que ainda liam o cargo antigo. Rode depois dos arquivos A e B.
-- ATENÇÃO: ainda NÃO testado no banco real.

-- Lista de imagens do acervo: quem pode editar o site (antes: só fundador, cofundador e administrador)
create or replace function public.iasd_list_site_images() returns table(name text)
language sql stable security definer set search_path to '' as $$
  select o.name from storage.objects o
   where o.bucket_id = 'iasd-images'
     and (o.name ~* '\.(png|jpe?g|webp|gif)$' or o.metadata->>'mimetype' like 'image/%')
     and public.iasd_has_perm('site.edit')
   order by o.created_at desc limit 1000 $$;

-- Presença do jogo ao vivo: qualquer pessoa com alguma permissão (antes: qualquer cargo)
create or replace function public.live_presence_summary(p_days integer default 90)
returns table(user_id uuid, name text, avatar_path text, days integer, games integer, first_seen timestamp with time zone, last_seen timestamp with time zone)
language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.iasd_has_any_perm() then raise exception 'sem permissão'; end if;
  return query
  with life as (select a.user_id, min(a.joined_at) as first_seen from public.iasd_live_attendance a group by a.user_id),
  per as (
    select a.user_id, max(a.name) as nm,
      count(distinct (a.joined_at at time zone 'America/Sao_Paulo')::date)::int as d,
      count(distinct coalesce(a.room_code,'') || '|' || (a.joined_at at time zone 'America/Sao_Paulo')::date::text)::int as g,
      max(a.joined_at) as last_seen
    from public.iasd_live_attendance a
    where a.joined_at >= now() - make_interval(days => greatest(p_days,1))
    group by a.user_id)
  select per.user_id, coalesce(nullif(p.full_name,''), per.nm, 'Participante'), p.avatar_path, per.d, per.g, life.first_seen, per.last_seen
  from per join life on life.user_id = per.user_id
  left join public.iasd_profiles p on p.user_id = per.user_id
  order by per.d desc, per.last_seen desc;
end $$;

-- Conceder acesso administrativo: só "administrador" ou "sem cargo" (os cargos de função agora são cargos agregados)
create or replace function public.iasd_grant_access(member_email text, member_role text) returns text
language plpgsql security definer set search_path to 'public' as $$
declare target_id uuid; existing_role text; caller_role text;
begin
  caller_role := public.iasd_role();
  if caller_role not in ('founder','admin') then raise exception 'Acesso restrito à administração'; end if;
  if member_role not in ('admin','viewer') then raise exception 'Perfil inválido'; end if;
  select id into target_id from auth.users where lower(email) = lower(trim(member_email));
  if target_id is null then raise exception 'Conta não encontrada. O colaborador deve se cadastrar primeiro.'; end if;
  select role into existing_role from public.iasd_members where user_id = target_id;
  if existing_role = 'founder' then raise exception 'Não é permitido alterar o fundador'; end if;
  if existing_role = 'cofounder' and caller_role <> 'founder' then raise exception 'Só o fundador altera o cofundador'; end if;
  insert into public.iasd_members(user_id, role) values (target_id, member_role) on conflict (user_id) do update set role = excluded.role;
  return 'Acesso liberado';
end $$;
