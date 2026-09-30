-- Resposta a alertas da sonoplastia.
-- Rode uma vez no Supabase (SQL Editor). Sem isto, o botão "Responder" mostra um aviso e o resto do site segue normal.
-- ATENÇÃO: escrito a partir do código do site, ainda NÃO testado no banco real.

alter table public.iasd_sound_alerts
  add column if not exists reply_message text,
  add column if not exists replied_by uuid references auth.users(id),
  add column if not exists replied_by_name text,
  add column if not exists replied_at timestamptz;

-- Quem enviou o alerta pode ler o próprio alerta e ver a resposta.
-- (As políticas somam: quem já lia todos os alertas continua lendo.)
drop policy if exists "iasd_alert_sender_reads_own" on public.iasd_sound_alerts;
create policy "iasd_alert_sender_reads_own" on public.iasd_sound_alerts
  for select to authenticated using (created_by = auth.uid());

-- Só sonoplasta, fundador e cofundador respondem. Só a resposta é alterada.
create or replace function public.iasd_reply_sound_alert(p_alert_id uuid, p_reply text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_name text;
  v_reply text := left(btrim(coalesce(p_reply, '')), 300);
begin
  if auth.uid() is null then raise exception 'Entre na sua conta para responder.'; end if;
  select role into v_role from public.iasd_members where user_id = auth.uid();
  if v_role is null or v_role not in ('sonoplasta', 'founder', 'cofounder') then
    raise exception 'Somente a sonoplastia pode responder alertas.';
  end if;
  if v_reply = '' then raise exception 'Escreva uma resposta.'; end if;
  select nullif(btrim(coalesce(p.full_name, '')), '') into v_name
    from public.iasd_profiles p where p.user_id = auth.uid();
  update public.iasd_sound_alerts
     set reply_message = v_reply,
         replied_by = auth.uid(),
         replied_by_name = coalesce(v_name, 'Sonoplastia'),
         replied_at = now()
   where id = p_alert_id;
  if not found then raise exception 'Alerta não encontrado.'; end if;
end;
$$;

revoke all on function public.iasd_reply_sound_alert(uuid, text) from public;
grant execute on function public.iasd_reply_sound_alert(uuid, text) to authenticated;
