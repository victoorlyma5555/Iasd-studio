-- IASD APP · Novos cargos: Programação (editor), Comunicação (midia) e Líder de ministério (lider).
-- PARTE 1 — permissões no banco. Rode no SQL Editor do Supabase. Só acrescenta/ajusta regras de alertas e de conteúdo do site.
-- PARTE 2 (função que grava o cargo) será entregue depois de ver a função atual; sem ela o site ainda não consegue SALVAR os cargos novos.

-- Alertas: qualquer pessoa com cargo envia e apaga; usuário comum não.
drop policy if exists "iasd_alert_staff_insert" on public.iasd_sound_alerts;
create policy "iasd_alert_staff_insert" on public.iasd_sound_alerts
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.iasd_members m where m.user_id = auth.uid()
      and m.role in ('founder','cofounder','admin','editor','operator','midia','lider','sonoplasta'))
  );

drop policy if exists "iasd_alert_staff_delete" on public.iasd_sound_alerts;
create policy "iasd_alert_staff_delete" on public.iasd_sound_alerts
  for delete to authenticated
  using (exists (select 1 from public.iasd_members m where m.user_id = auth.uid()
    and m.role in ('founder','cofounder','admin','editor','operator','midia','lider','sonoplasta')));

-- Comunicação: edita textos, capas, carrossel e acervo (não mexe em abas).
do $$
declare t text;
begin
  foreach t in array array['iasd_site_content','iasd_site_assets','iasd_asset_framing'] loop
    execute format('drop policy if exists "iasd_midia_write" on public.%I', t);
    execute format($p$create policy "iasd_midia_write" on public.%I for all to authenticated
      using (exists (select 1 from public.iasd_members m where m.user_id = auth.uid() and m.role = 'midia'))
      with check (exists (select 1 from public.iasd_members m where m.user_id = auth.uid() and m.role = 'midia'))$p$, t);
  end loop;
end $$;

drop policy if exists "iasd_midia_storage" on storage.objects;
create policy "iasd_midia_storage" on storage.objects
  for all to authenticated
  using (bucket_id = 'iasd-images' and exists (select 1 from public.iasd_members m where m.user_id = auth.uid() and m.role = 'midia'))
  with check (bucket_id = 'iasd-images' and exists (select 1 from public.iasd_members m where m.user_id = auth.uid() and m.role = 'midia'));
