-- Alertas da sonoplastia PARA os membros (todos ou um só). Rode uma vez no Supabase (SQL Editor).
-- ATENÇÃO: escrito a partir do código do site, ainda NÃO testado no banco real.
-- Depois de rodar, troque SEU_SEGREDO_AQUI (o mesmo PUSH_WEBHOOK_SECRET do Vercel) no gatilho no fim do arquivo.

create table if not exists public.iasd_member_alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  sender_name text,
  message text not null check (char_length(message) between 1 and 500),
  target_uid uuid references auth.users(id),   -- null = todos os membros com cargo
  target_name text
);
alter table public.iasd_member_alerts enable row level security;

-- Só sonoplasta, fundador e cofundador enviam.
drop policy if exists "iasd_member_alert_insert" on public.iasd_member_alerts;
create policy "iasd_member_alert_insert" on public.iasd_member_alerts
  for insert to authenticated with check (
    created_by = auth.uid()
    and exists (select 1 from public.iasd_members m where m.user_id = auth.uid() and m.role in ('sonoplasta','founder','cofounder')));

-- Lê quem tem cargo e foi o destinatário (ou o alerta é geral), e quem enviou.
drop policy if exists "iasd_member_alert_select" on public.iasd_member_alerts;
create policy "iasd_member_alert_select" on public.iasd_member_alerts
  for select to authenticated using (
    created_by = auth.uid()
    or (exists (select 1 from public.iasd_members m where m.user_id = auth.uid()
          and m.role in ('founder','cofounder','admin','editor','operator','midia','lider','sonoplasta'))
        and (target_uid is null or target_uid = auth.uid())));

-- Lista de membros com cargo (para escolher o destinatário). Só a sonoplastia chama.
create or replace function public.iasd_alert_roster()
returns table(user_id uuid, full_name text, role text)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.iasd_members m where m.user_id = auth.uid() and m.role in ('sonoplasta','founder','cofounder')) then
    raise exception 'Somente a sonoplastia pode listar os membros.';
  end if;
  return query
    select m.user_id, coalesce(nullif(btrim(coalesce(p.full_name,'')),''),'Sem nome'), m.role
      from public.iasd_members m left join public.iasd_profiles p on p.user_id = m.user_id
     where m.role in ('founder','cofounder','admin','editor','operator','midia','lider','sonoplasta')
       and m.user_id <> auth.uid()
     order by 2;
end $$;
revoke all on function public.iasd_alert_roster() from public;
grant execute on function public.iasd_alert_roster() to authenticated;

-- Tempo real
do $$ begin
  alter publication supabase_realtime add table public.iasd_member_alerts;
exception when others then null; end $$;

-- Push no celular assim que o alerta nasce
create extension if not exists pg_net with schema extensions;
create or replace function public.iasd_push_member_alert_trigger()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://iasdapp.com.br/api/push',
    headers := jsonb_build_object('Content-Type','application/json','x-push-secret','SEU_SEGREDO_AQUI'),
    body := jsonb_build_object('kind','member','alert_id',new.id),
    timeout_milliseconds := 5000);
  return new;
exception when others then return new;
end $$;
drop trigger if exists iasd_push_member_alert on public.iasd_member_alerts;
create trigger iasd_push_member_alert after insert on public.iasd_member_alerts
  for each row execute function public.iasd_push_member_alert_trigger();
