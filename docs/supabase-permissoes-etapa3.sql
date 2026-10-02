-- Etapa 3: escalas, Sala de Estudo e catálogo final (sem "em breve")
create or replace function public.iasd_perm_catalog() returns text[] language sql immutable as $$
  select array['cron.edit','cron.delete','escala.add','escala.edit','escala.delete','sound.use','sound.library',
               'alert.send_sound','alert.delete','alert.send_members','prayer.moderate','study.use',
               'site.edit','site.texts','site.tabs','admin.ranking_reset']::text[]
$$;
create or replace function public.iasd_perm_sensitive() returns text[] language sql immutable as $$
  select array['admin.ranking_reset']::text[]
$$;
create or replace function public.iasd_legacy_perms(p_role text) returns text[] language sql immutable as $$
  select case p_role
    when 'founder' then public.iasd_perm_catalog()
    when 'cofounder' then array['cron.edit','cron.delete','escala.add','escala.edit','escala.delete','sound.use','alert.send_sound','alert.delete','alert.send_members','prayer.moderate','study.use','site.edit','site.texts','site.tabs']
    when 'admin' then array['cron.edit','cron.delete','escala.add','escala.edit','escala.delete','alert.send_sound','alert.delete','site.edit','site.texts','site.tabs']
    else array[]::text[] end
$$;
create or replace function public.iasd_study_can() returns boolean
language sql stable security definer set search_path = public as $$ select public.iasd_has_perm('study.use') $$;

-- tira permissões que não existem mais
update public.iasd_cargos set perms = array(select x from unnest(perms) x where x = any(public.iasd_perm_catalog()));
update public.iasd_member_perms set perms = array(select x from unnest(perms) x where x = any(public.iasd_perm_catalog()));

-- cargos já criados continuam podendo mexer nas escalas
update public.iasd_cargos set perms = array(select distinct unnest(perms || array['escala.add','escala.edit','escala.delete']))
 where name in ('Sonoplasta','Programação','Comunicação','Líder de ministério');

-- apagar alertas vira função própria (quem já enviava continua podendo apagar)
update public.iasd_cargos set perms = array(select distinct unnest(perms || array['alert.delete'])) where perms && array['alert.send_sound','sound.use'];
update public.iasd_member_perms set perms = array(select distinct unnest(perms || array['alert.delete'])) where perms && array['alert.send_sound','sound.use'];
drop policy if exists "perm alert delete" on public.iasd_sound_alerts;
create policy "perm alert delete" on public.iasd_sound_alerts for delete to authenticated using (public.iasd_has_perm('alert.delete'));
