-- IASD APP · Permitir que quem tem cargo apague alertas da sonoplastia.
-- Rode UMA vez no SQL Editor do Supabase. Só acrescenta uma permissão; não altera regras existentes.
drop policy if exists "iasd_alert_staff_delete" on public.iasd_sound_alerts;
create policy "iasd_alert_staff_delete" on public.iasd_sound_alerts
  for delete to authenticated
  using (exists (
    select 1 from public.iasd_members m
    where m.user_id = auth.uid()
      and m.role in ('founder','cofounder','admin','editor','operator','sonoplasta')
  ));
