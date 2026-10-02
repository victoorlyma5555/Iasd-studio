-- Gatilho: envia a notificação push assim que um alerta é RESPONDIDO, direto do banco (só quem enviou é notificado).
-- Não depende do site aberto, do Projetor nem do aparelho de quem respondeu.
-- 1) No Vercel crie a variável PUSH_WEBHOOK_SECRET com o MESMO segredo abaixo e faça Redeploy.
-- 2) Troque SEU_SEGREDO_AQUI pelo segredo e rode no SQL Editor do Supabase.
-- ATENÇÃO: escrito a partir do código do site, ainda NÃO testado no banco real.
create extension if not exists pg_net with schema extensions;

create or replace function public.iasd_push_alert_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text := 'https://iasdapp.com.br/api/push';
  v_secret text := 'SEU_SEGREDO_AQUI';
begin
  if TG_OP = 'UPDATE' and new.reply_message is not null and new.reply_message is distinct from old.reply_message then
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret),
      body := jsonb_build_object('kind', 'reply', 'alert_id', new.id),
      timeout_milliseconds := 5000
    );
  end if;
  return new;
exception when others then
  return new; -- nunca bloqueia o envio do alerta por falha na notificação
end;
$$;

drop trigger if exists iasd_push_alert on public.iasd_sound_alerts;
create trigger iasd_push_alert
after update on public.iasd_sound_alerts
for each row execute function public.iasd_push_alert_trigger();
