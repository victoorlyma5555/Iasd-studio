-- IASD APP · Domínio total do Fundador
-- Rode UMA vez no Supabase (SQL Editor). Dá ao cargo "founder" permissão de ver, criar, editar e excluir
-- em todas as tabelas do site, pela "Central de Dados" do Painel do Fundador.
-- Não altera nem remove nenhuma regra existente (as políticas novas só ACRESCENTAM permissão ao fundador).

create or replace function public.iasd_is_founder()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.iasd_members m where m.user_id = auth.uid() and m.role = 'founder');
$$;
revoke all on function public.iasd_is_founder() from public, anon;
grant execute on function public.iasd_is_founder() to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'iasd_schedules','iasd_sound_alerts','iasd_custom_tabs','iasd_site_content','iasd_site_assets',
    'iasd_asset_framing','iasd_offering_videos','iasd_game_stats','iasd_game_daily','iasd_members',
    'iasd_profiles','iasd_site_theme'
  ] loop
    if to_regclass('public.'||t) is not null then
      execute format('drop policy if exists "iasd_founder_total" on public.%I', t);
      execute format('create policy "iasd_founder_total" on public.%I for all to authenticated using (public.iasd_is_founder()) with check (public.iasd_is_founder())', t);
    end if;
  end loop;
end $$;
