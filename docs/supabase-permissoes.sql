-- Permissões por cargo agregado e por pessoa. Rode no Supabase (SQL Editor), de preferência uma seção de cada vez.
-- ATENÇÃO: escrito a partir do código do site, ainda NÃO testado no banco real.
-- Ninguém perde acesso: os cargos antigos (sonoplasta, editor, midia, lider...) continuam valendo e também viram cargos agregados.

-- ===== 1) TABELAS (sem política: só as funções abaixo mexem nelas) =====
create table if not exists public.iasd_cargos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  perms text[] not null default '{}',
  created_at timestamptz not null default now()
);
create unique index if not exists iasd_cargos_name_uq on public.iasd_cargos (lower(name));
create table if not exists public.iasd_member_cargos (
  user_id uuid not null references auth.users(id) on delete cascade,
  cargo_id uuid not null references public.iasd_cargos(id) on delete cascade,
  primary key (user_id, cargo_id)
);
create table if not exists public.iasd_member_perms (
  user_id uuid primary key references auth.users(id) on delete cascade,
  perms text[] not null default '{}'
);
alter table public.iasd_cargos enable row level security;
alter table public.iasd_member_cargos enable row level security;
alter table public.iasd_member_perms enable row level security;

-- ===== 2) CATÁLOGO E REGRAS =====
create or replace function public.iasd_perm_catalog() returns text[] language sql immutable as $$
  select array['cron.edit','cron.delete','sound.use','alert.send_sound','alert.send_members',
               'site.edit','site.texts','site.tabs','site.theme','prayer.moderate','sound.library',
               'admin.accounts','admin.layout','admin.ranking_reset','admin.study']::text[]
$$;
-- Só o fundador concede estas (nocivas ao site)
create or replace function public.iasd_perm_sensitive() returns text[] language sql immutable as $$
  select array['admin.accounts','admin.layout','admin.ranking_reset','admin.study']::text[]
$$;
-- O que cada cargo antigo já podia fazer (fica valendo como garantia)
create or replace function public.iasd_legacy_perms(p_role text) returns text[] language sql immutable as $$
  select case p_role
    when 'founder' then public.iasd_perm_catalog()
    when 'cofounder' then array['cron.edit','cron.delete','sound.use','alert.send_sound','alert.send_members','site.edit','site.texts','site.tabs']
    when 'admin' then array['cron.edit','cron.delete','alert.send_sound','site.edit','site.texts','site.tabs']
    when 'sonoplasta' then array['sound.use','alert.send_sound','alert.send_members']
    when 'editor' then array['cron.edit','alert.send_sound']
    when 'operator' then array['cron.edit','alert.send_sound']
    when 'midia' then array['site.edit','alert.send_sound']
    when 'lider' then array['alert.send_sound']
    else array[]::text[] end
$$;

create or replace function public.iasd_perms_of(p_uid uuid) returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct x), array[]::text[]) from (
    select unnest(public.iasd_legacy_perms((select role from public.iasd_members where user_id = p_uid))) as x
    union all select unnest(c.perms) from public.iasd_member_cargos mc join public.iasd_cargos c on c.id = mc.cargo_id where mc.user_id = p_uid
    union all select unnest(mp.perms) from public.iasd_member_perms mp where mp.user_id = p_uid
  ) t
$$;
revoke all on function public.iasd_perms_of(uuid) from public, anon, authenticated;

create or replace function public.iasd_my_perms() returns text[]
language sql stable security definer set search_path = public as $$ select public.iasd_perms_of(auth.uid()) $$;
create or replace function public.iasd_has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$ select p = any(public.iasd_perms_of(auth.uid())) $$;
create or replace function public.iasd_has_any_perm() returns boolean
language sql stable security definer set search_path = public as $$ select cardinality(public.iasd_perms_of(auth.uid())) > 0 $$;
create or replace function public.iasd_perm_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.iasd_members where user_id = auth.uid() and role in ('founder','cofounder','admin')) $$;
grant execute on function public.iasd_my_perms(), public.iasd_has_perm(text), public.iasd_has_any_perm(), public.iasd_perm_admin() to authenticated;

-- ===== 3) GESTÃO (fundador, cofundador e administrador) =====
create or replace function public.iasd_perm_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.iasd_perm_admin() then raise exception 'Sem permissão para gerenciar acessos.'; end if;
  return jsonb_build_object(
    'me_founder', exists (select 1 from public.iasd_members where user_id = auth.uid() and role = 'founder'),
    'cargos', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'perms', c.perms) order by c.name) from public.iasd_cargos c), '[]'::jsonb),
    'members', coalesce((select jsonb_agg(jsonb_build_object(
        'user_id', u.id, 'full_name', coalesce(nullif(btrim(coalesce(p.full_name,'')),''), 'Sem nome'), 'email', u.email,
        'role', m.role,
        'cargo_ids', coalesce((select jsonb_agg(mc.cargo_id) from public.iasd_member_cargos mc where mc.user_id = u.id), '[]'::jsonb),
        'perms', coalesce((select to_jsonb(mp.perms) from public.iasd_member_perms mp where mp.user_id = u.id), '[]'::jsonb)
      ) order by coalesce(nullif(btrim(coalesce(p.full_name,'')),''), u.email))
      from auth.users u left join public.iasd_profiles p on p.user_id = u.id left join public.iasd_members m on m.user_id = u.id), '[]'::jsonb));
end $$;

create or replace function public.iasd_is_founder() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.iasd_members where user_id = auth.uid() and role = 'founder') $$;
create or replace function public.iasd_clean_perms(p text[]) returns text[]
language plpgsql immutable as $$
declare r text[];
begin
  select coalesce(array_agg(distinct x), array[]::text[]) into r from unnest(coalesce(p, array[]::text[])) x;
  if exists (select 1 from unnest(r) x where x <> all(public.iasd_perm_catalog())) then raise exception 'Permissão desconhecida.'; end if;
  return r;
end $$;
create or replace function public.iasd_sens_of(p text[]) returns text[]
language sql immutable as $$
  select coalesce(array_agg(x order by x), array[]::text[]) from unnest(coalesce(p, array[]::text[])) x where x = any(public.iasd_perm_sensitive()) $$;
create or replace function public.iasd_sens_cargos(p uuid[]) returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(id order by id), array[]::uuid[]) from public.iasd_cargos
   where id = any(coalesce(p, array[]::uuid[])) and perms && public.iasd_perm_sensitive() $$;

create or replace function public.iasd_perm_save_cargo(p_id uuid, p_name text, p_perms text[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_name text := btrim(coalesce(p_name,'')); v_perms text[] := public.iasd_clean_perms(p_perms); v_id uuid := p_id;
begin
  if not public.iasd_perm_admin() then raise exception 'Sem permissão para gerenciar acessos.'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 40 then raise exception 'O nome do cargo deve ter de 2 a 40 letras.'; end if;
  if not public.iasd_is_founder() and (cardinality(public.iasd_sens_of(v_perms)) > 0
     or (v_id is not null and cardinality(public.iasd_sens_of((select perms from public.iasd_cargos where id = v_id))) > 0)) then
    raise exception 'Só o fundador pode dar ou alterar permissões sensíveis.';
  end if;
  if v_id is null then insert into public.iasd_cargos (name, perms) values (v_name, v_perms) returning id into v_id;
  else
    update public.iasd_cargos set name = v_name, perms = v_perms where id = v_id;
    if not found then raise exception 'Cargo não encontrado.'; end if;
  end if;
  return v_id;
exception when unique_violation then raise exception 'Já existe um cargo com esse nome.';
end $$;

create or replace function public.iasd_perm_delete_cargo(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.iasd_perm_admin() then raise exception 'Sem permissão para gerenciar acessos.'; end if;
  if not public.iasd_is_founder() and cardinality(public.iasd_sens_of((select perms from public.iasd_cargos where id = p_id))) > 0 then
    raise exception 'Só o fundador pode apagar este cargo.';
  end if;
  delete from public.iasd_cargos where id = p_id;
end $$;

create or replace function public.iasd_perm_set_member(p_uid uuid, p_cargo_ids uuid[], p_perms text[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_perms text[] := public.iasd_clean_perms(p_perms); v_cargos uuid[];
begin
  if not public.iasd_perm_admin() then raise exception 'Sem permissão para gerenciar acessos.'; end if;
  if exists (select 1 from public.iasd_members where user_id = p_uid and role in ('founder','cofounder','admin')) then
    raise exception 'Cargos administrativos já têm o acesso do próprio cargo.';
  end if;
  select coalesce(array_agg(id), array[]::uuid[]) into v_cargos from public.iasd_cargos where id = any(coalesce(p_cargo_ids, array[]::uuid[]));
  if not public.iasd_is_founder() then
    if public.iasd_sens_of(v_perms) is distinct from public.iasd_sens_of((select perms from public.iasd_member_perms where user_id = p_uid)) then
      raise exception 'Só o fundador pode dar ou tirar permissões sensíveis.';
    end if;
    if public.iasd_sens_cargos(v_cargos) is distinct from public.iasd_sens_cargos((select array_agg(cargo_id) from public.iasd_member_cargos where user_id = p_uid)) then
      raise exception 'Só o fundador pode dar ou tirar cargos sensíveis.';
    end if;
  end if;
  delete from public.iasd_member_cargos where user_id = p_uid;
  insert into public.iasd_member_cargos (user_id, cargo_id) select p_uid, unnest(v_cargos);
  if cardinality(v_perms) = 0 then delete from public.iasd_member_perms where user_id = p_uid;
  else insert into public.iasd_member_perms (user_id, perms) values (p_uid, v_perms)
       on conflict (user_id) do update set perms = excluded.perms; end if;
end $$;

revoke all on function public.iasd_perm_overview(), public.iasd_perm_save_cargo(uuid, text, text[]), public.iasd_perm_delete_cargo(uuid), public.iasd_perm_set_member(uuid, uuid[], text[]) from public, anon;
grant execute on function public.iasd_perm_overview(), public.iasd_perm_save_cargo(uuid, text, text[]), public.iasd_perm_delete_cargo(uuid), public.iasd_perm_set_member(uuid, uuid[], text[]) to authenticated;

-- ===== 4) CARGOS ATUAIS VIRAM CARGOS AGREGADOS (ninguém perde acesso) =====
insert into public.iasd_cargos (name, perms) values
  ('Sonoplasta', array['sound.use','alert.send_sound','alert.send_members']),
  ('Programação', array['cron.edit','alert.send_sound']),
  ('Comunicação', array['site.edit','alert.send_sound']),
  ('Líder de ministério', array['alert.send_sound'])
on conflict do nothing;
insert into public.iasd_member_cargos (user_id, cargo_id)
  select m.user_id, c.id from public.iasd_members m
  join public.iasd_cargos c on lower(c.name) = case m.role
      when 'sonoplasta' then 'sonoplasta' when 'editor' then 'programação' when 'operator' then 'programação'
      when 'midia' then 'comunicação' when 'lider' then 'líder de ministério' end
on conflict do nothing;

-- ===== 5) AVISOS AOS MEMBROS PASSAM A USAR AS PERMISSÕES =====
drop policy if exists "iasd_member_alert_insert" on public.iasd_member_alerts;
create policy "iasd_member_alert_insert" on public.iasd_member_alerts
  for insert to authenticated with check (created_by = auth.uid() and public.iasd_has_perm('alert.send_members'));
drop policy if exists "iasd_member_alert_select" on public.iasd_member_alerts;
create policy "iasd_member_alert_select" on public.iasd_member_alerts
  for select to authenticated using (created_by = auth.uid() or (public.iasd_has_any_perm() and (target_uid is null or target_uid = auth.uid())));

create or replace function public.iasd_alert_roster()
returns table(user_id uuid, full_name text, role text)
language plpgsql security definer set search_path = public as $$
begin
  if not public.iasd_has_perm('alert.send_members') then raise exception 'Sem permissão para avisar membros.'; end if;
  return query
    select u.id, coalesce(nullif(btrim(coalesce(p.full_name,'')),''),'Sem nome'), coalesce(m.role, 'cargo')
      from auth.users u left join public.iasd_profiles p on p.user_id = u.id left join public.iasd_members m on m.user_id = u.id
     where u.id <> auth.uid() and cardinality(public.iasd_perms_of(u.id)) > 0
     order by 2;
end $$;
revoke all on function public.iasd_alert_roster() from public;
grant execute on function public.iasd_alert_roster() to authenticated;

-- ===== 6) TEMPO REAL: quando o cargo ou a permissão muda, o site da pessoa se ajusta na hora =====
drop policy if exists "iasd_member_perms_own" on public.iasd_member_perms;
create policy "iasd_member_perms_own" on public.iasd_member_perms for select to authenticated using (user_id = auth.uid());
drop policy if exists "iasd_member_cargos_own" on public.iasd_member_cargos;
create policy "iasd_member_cargos_own" on public.iasd_member_cargos for select to authenticated using (user_id = auth.uid());
drop policy if exists "iasd_cargos_holder" on public.iasd_cargos;
create policy "iasd_cargos_holder" on public.iasd_cargos for select to authenticated
  using (exists (select 1 from public.iasd_member_cargos mc where mc.cargo_id = iasd_cargos.id and mc.user_id = auth.uid()));
do $$ begin alter publication supabase_realtime add table public.iasd_member_perms; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.iasd_member_cargos; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.iasd_cargos; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.iasd_members; exception when others then null; end $$;
