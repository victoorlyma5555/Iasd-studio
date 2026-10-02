-- Etapa 2: o banco passa a conferir as PERMISSÕES (cargos agregados + permissões soltas) em vez dos cargos antigos.
-- Requer docs/supabase-permissoes.sql já rodado. Rode na ordem, uma parte de cada vez.
-- Ninguém perde acesso nas partes 1 a 11: os cargos antigos continuam valendo até a parte 12 (opcional, por último).
-- ATENÇÃO: escrito a partir das regras reais do banco, mas ainda NÃO testado.

-- 1) cofundador também modera oração (como já fazia)
create or replace function public.iasd_legacy_perms(p_role text) returns text[] language sql immutable as $$
  select case p_role
    when 'founder' then public.iasd_perm_catalog()
    when 'cofounder' then array['cron.edit','cron.delete','sound.use','alert.send_sound','alert.send_members','site.edit','site.texts','site.tabs','prayer.moderate']
    when 'admin' then array['cron.edit','cron.delete','alert.send_sound','site.edit','site.texts','site.tabs']
    when 'sonoplasta' then array['sound.use','alert.send_sound','alert.send_members']
    when 'editor' then array['cron.edit','alert.send_sound']
    when 'operator' then array['cron.edit','alert.send_sound']
    when 'midia' then array['site.edit','alert.send_sound']
    when 'lider' then array['alert.send_sound']
    else array[]::text[] end
$$;

-- 2) nomes dos cargos da própria pessoa (aparecem no perfil)
create or replace function public.iasd_my_cargos() returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(c.name order by c.name), array[]::text[])
    from public.iasd_member_cargos mc join public.iasd_cargos c on c.id = mc.cargo_id where mc.user_id = auth.uid() $$;
grant execute on function public.iasd_my_cargos() to authenticated;

-- 3) funções usadas por várias regras (biblioteca de mídias, Sala de Estudo, oração)
create or replace function public.iasd_media_can() returns boolean
language sql stable security definer set search_path = public as $$
  select public.iasd_has_perm('sound.use') or public.iasd_has_perm('sound.library') $$;
create or replace function public.iasd_study_can() returns boolean
language sql stable security definer set search_path = public as $$ select public.iasd_has_perm('admin.study') $$;
create or replace function public.iasd_prayer_is_mod() returns boolean
language sql security definer set search_path = public as $$ select public.iasd_has_perm('prayer.moderate') $$;

-- 4) zerar o ranking
create or replace function public.iasd_reset_ranking() returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  if not public.iasd_has_perm('admin.ranking_reset') then raise exception 'Sem permissão para zerar o ranking' using errcode = '42501'; end if;
  delete from public.iasd_game_stats where true;
  get diagnostics v_n = row_count;
  if to_regclass('public.iasd_game_daily') is not null then delete from public.iasd_game_daily where true; end if;
  return v_n;
end $$;

-- 5) responder alertas da sonoplastia
create or replace function public.iasd_reply_sound_alert(p_alert_id uuid, p_reply text) returns void
language plpgsql security definer set search_path = public as $$
declare v_name text; v_reply text := left(btrim(coalesce(p_reply, '')), 300);
begin
  if auth.uid() is null then raise exception 'Entre na sua conta para responder.'; end if;
  if not public.iasd_has_perm('sound.use') then raise exception 'Somente a sonoplastia pode responder alertas.'; end if;
  if v_reply = '' then raise exception 'Escreva uma resposta.'; end if;
  select nullif(btrim(coalesce(p.full_name, '')), '') into v_name from public.iasd_profiles p where p.user_id = auth.uid();
  update public.iasd_sound_alerts set reply_message = v_reply, replied_by = auth.uid(),
         replied_by_name = coalesce(v_name, 'Sonoplastia'), replied_at = now() where id = p_alert_id;
  if not found then raise exception 'Alerta não encontrado.'; end if;
end $$;

-- 6) cronogramas
drop policy if exists "admins delete schedules" on public.iasd_schedules;
drop policy if exists "editors create schedules" on public.iasd_schedules;
drop policy if exists "editors update schedules" on public.iasd_schedules;
create policy "perm delete schedules" on public.iasd_schedules for delete to authenticated using (public.iasd_has_perm('cron.delete'));
create policy "perm create schedules" on public.iasd_schedules for insert to authenticated with check (public.iasd_has_perm('cron.edit') and created_by = auth.uid());
create policy "perm update schedules" on public.iasd_schedules for update to authenticated using (public.iasd_has_perm('cron.edit')) with check (public.iasd_has_perm('cron.edit'));

-- 7) abas personalizadas
drop policy if exists "managers delete tabs" on public.iasd_custom_tabs;
drop policy if exists "managers insert tabs" on public.iasd_custom_tabs;
drop policy if exists "managers update tabs" on public.iasd_custom_tabs;
create policy "perm manage tabs" on public.iasd_custom_tabs for all to authenticated using (public.iasd_has_perm('site.tabs')) with check (public.iasd_has_perm('site.tabs'));

-- 8) capas, carrossel e acervo
drop policy if exists "iasd_midia_write" on public.iasd_site_assets;
drop policy if exists "managers add site assets" on public.iasd_site_assets;
drop policy if exists "managers remove site assets" on public.iasd_site_assets;
drop policy if exists "managers update site assets" on public.iasd_site_assets;
create policy "perm site edit" on public.iasd_site_assets for all to authenticated using (public.iasd_has_perm('site.edit')) with check (public.iasd_has_perm('site.edit'));
drop policy if exists "iasd_midia_write" on public.iasd_asset_framing;
drop policy if exists "managers delete framing" on public.iasd_asset_framing;
drop policy if exists "managers insert framing" on public.iasd_asset_framing;
drop policy if exists "managers update framing" on public.iasd_asset_framing;
create policy "perm site edit" on public.iasd_asset_framing for all to authenticated using (public.iasd_has_perm('site.edit')) with check (public.iasd_has_perm('site.edit'));

-- 9) textos do site e arquivos de imagem
drop policy if exists "iasd_midia_write" on public.iasd_site_content;
drop policy if exists "managers insert site content" on public.iasd_site_content;
drop policy if exists "managers update site content" on public.iasd_site_content;
create policy "perm site texts" on public.iasd_site_content for all to authenticated
  using (public.iasd_has_perm('site.texts') or public.iasd_has_perm('site.edit'))
  with check (public.iasd_has_perm('site.texts') or public.iasd_has_perm('site.edit'));
drop policy if exists "iasd_midia_storage" on storage.objects;
drop policy if exists "iasd_perm_images_storage" on storage.objects;
create policy "iasd_perm_images_storage" on storage.objects for all to authenticated
  using (bucket_id = 'iasd-images' and public.iasd_has_perm('site.edit'))
  with check (bucket_id = 'iasd-images' and public.iasd_has_perm('site.edit'));

-- 10) vídeos de dízimos e informativos
drop policy if exists "offering videos delete" on public.iasd_offering_videos;
drop policy if exists "offering videos insert" on public.iasd_offering_videos;
drop policy if exists "offering videos read" on public.iasd_offering_videos;
create policy "perm videos read" on public.iasd_offering_videos for select to authenticated using (public.iasd_has_perm('sound.use') or public.iasd_perm_admin());
create policy "perm videos insert" on public.iasd_offering_videos for insert to authenticated with check (public.iasd_has_perm('sound.use') and uploaded_by = auth.uid());
create policy "perm videos delete" on public.iasd_offering_videos for delete to authenticated using (public.iasd_has_perm('sound.use'));

-- 11) alertas à sonoplastia
drop policy if exists "iasd_alert_staff_delete" on public.iasd_sound_alerts;
drop policy if exists "iasd_alert_staff_insert" on public.iasd_sound_alerts;
drop policy if exists "sound_alerts_assigned_roles_send" on public.iasd_sound_alerts;
create policy "perm alert insert" on public.iasd_sound_alerts for insert to authenticated with check (created_by = auth.uid() and public.iasd_has_perm('alert.send_sound'));
create policy "perm alert delete" on public.iasd_sound_alerts for delete to authenticated using (public.iasd_has_perm('alert.send_sound') or public.iasd_has_perm('sound.use'));

-- 12) SÓ DEPOIS de testar e de conferir as funções do banco: tira os cargos antigos das pessoas (o acesso fica só nos cargos agregados)
insert into public.iasd_member_cargos (user_id, cargo_id)
  select m.user_id, c.id from public.iasd_members m
  join public.iasd_cargos c on lower(c.name) = case m.role
      when 'sonoplasta' then 'sonoplasta' when 'editor' then 'programação' when 'operator' then 'programação'
      when 'midia' then 'comunicação' when 'lider' then 'líder de ministério' end
on conflict do nothing;
update public.iasd_members set role = 'viewer' where role in ('sonoplasta','editor','operator','midia','lider');
