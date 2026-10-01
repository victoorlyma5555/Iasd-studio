-- Mural de pedidos de oração.
-- Rode uma vez no Supabase (SQL Editor). Sem isto, o mural mostra um aviso e o resto do site segue normal.
-- ATENÇÃO: escrito a partir do código do site, ainda NÃO testado no banco real.
-- Privacidade: as tabelas ficam fechadas (RLS sem políticas); tudo passa pelas funções abaixo,
-- que nunca devolvem o autor de um pedido anônimo.

create table if not exists public.iasd_prayers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  anonymous boolean not null default false,
  body text not null check (char_length(body) between 3 and 400),
  answered boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.iasd_prayer_amens (
  prayer_id uuid not null references public.iasd_prayers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (prayer_id, user_id)
);
alter table public.iasd_prayers enable row level security;
alter table public.iasd_prayer_amens enable row level security;

create or replace function public.iasd_prayer_is_mod()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.iasd_members where user_id = auth.uid() and role in ('founder','cofounder'));
$$;

create or replace function public.iasd_prayer_list()
returns table (id uuid, author text, anonymous boolean, body text, answered boolean, created_at timestamptz, amens integer, i_prayed boolean, mine boolean)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Entre na sua conta para ver o mural.'; end if;
  return query
    select p.id,
           case when p.anonymous then null else p.author_name end,
           p.anonymous, p.body, p.answered, p.created_at,
           (select count(*)::int from public.iasd_prayer_amens a where a.prayer_id = p.id),
           exists (select 1 from public.iasd_prayer_amens a where a.prayer_id = p.id and a.user_id = auth.uid()),
           (p.user_id = auth.uid())
      from public.iasd_prayers p
     order by p.created_at desc
     limit 100;
end;
$$;

create or replace function public.iasd_prayer_add(p_body text, p_anonymous boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_name text; v_body text := btrim(coalesce(p_body, ''));
begin
  if auth.uid() is null then raise exception 'Entre na sua conta para publicar.'; end if;
  if char_length(v_body) < 3 then raise exception 'Escreva o seu pedido.'; end if;
  if (select count(*) from public.iasd_prayers where user_id = auth.uid() and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Limite de 5 pedidos por dia.';
  end if;
  select nullif(btrim(coalesce(full_name, '')), '') into v_name from public.iasd_profiles where user_id = auth.uid();
  insert into public.iasd_prayers (user_id, author_name, anonymous, body)
    values (auth.uid(), v_name, coalesce(p_anonymous, false), left(v_body, 400))
    returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.iasd_prayer_toggle(p_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  if exists (select 1 from public.iasd_prayer_amens where prayer_id = p_id and user_id = auth.uid()) then
    delete from public.iasd_prayer_amens where prayer_id = p_id and user_id = auth.uid();
  else
    insert into public.iasd_prayer_amens (prayer_id, user_id) values (p_id, auth.uid()) on conflict do nothing;
  end if;
  return (select count(*)::int from public.iasd_prayer_amens where prayer_id = p_id);
end;
$$;

create or replace function public.iasd_prayer_delete(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  delete from public.iasd_prayers where id = p_id and (user_id = auth.uid() or public.iasd_prayer_is_mod());
end;
$$;

create or replace function public.iasd_prayer_answer(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Entre na sua conta.'; end if;
  update public.iasd_prayers set answered = not answered
   where id = p_id and (user_id = auth.uid() or public.iasd_prayer_is_mod());
end;
$$;

revoke all on function public.iasd_prayer_is_mod() from public, anon;
revoke all on function public.iasd_prayer_list() from public, anon;
revoke all on function public.iasd_prayer_add(text, boolean) from public, anon;
revoke all on function public.iasd_prayer_toggle(uuid) from public, anon;
revoke all on function public.iasd_prayer_delete(uuid) from public, anon;
revoke all on function public.iasd_prayer_answer(uuid) from public, anon;
grant execute on function public.iasd_prayer_list() to authenticated;
grant execute on function public.iasd_prayer_add(text, boolean) to authenticated;
grant execute on function public.iasd_prayer_toggle(uuid) to authenticated;
grant execute on function public.iasd_prayer_delete(uuid) to authenticated;
grant execute on function public.iasd_prayer_answer(uuid) to authenticated;
