-- Painel de presença do Jogo Coletivo (para a liderança).
-- Registra quem entra nas salas (apenas quem está logado) e resume frequência e primeira vez. Rode uma vez no SQL Editor.
create table if not exists public.iasd_live_attendance (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  room_code text,
  kind text not null default 'player',
  joined_at timestamptz not null default now()
);
create index if not exists iasd_live_attendance_user_idx on public.iasd_live_attendance(user_id, joined_at desc);
alter table public.iasd_live_attendance enable row level security;
drop policy if exists "live_att_insert_own" on public.iasd_live_attendance;
drop policy if exists "live_att_select_own" on public.iasd_live_attendance;
create policy "live_att_insert_own" on public.iasd_live_attendance for insert with check (auth.uid() = user_id);
create policy "live_att_select_own" on public.iasd_live_attendance for select using (auth.uid() = user_id);

create or replace function public.live_presence_summary(p_days int default 90)
returns table(user_id uuid, name text, avatar_path text, days int, games int, first_seen timestamptz, last_seen timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.iasd_members m where m.user_id = auth.uid()
      and m.role in ('founder','cofounder','admin','editor','operator','midia','lider','sonoplasta')) then
    raise exception 'sem permissão';
  end if;
  return query
  with life as (select a.user_id, min(a.joined_at) as first_seen from public.iasd_live_attendance a group by a.user_id),
  per as (
    select a.user_id,
      max(a.name) as nm,
      count(distinct (a.joined_at at time zone 'America/Sao_Paulo')::date)::int as d,
      count(distinct coalesce(a.room_code,'') || '|' || (a.joined_at at time zone 'America/Sao_Paulo')::date::text)::int as g,
      max(a.joined_at) as last_seen
    from public.iasd_live_attendance a
    where a.joined_at >= now() - make_interval(days => greatest(p_days,1))
    group by a.user_id)
  select per.user_id, coalesce(nullif(p.full_name,''), per.nm, 'Participante'), p.avatar_path, per.d, per.g, life.first_seen, per.last_seen
  from per join life on life.user_id = per.user_id
  left join public.iasd_profiles p on p.user_id = per.user_id
  order by per.d desc, per.last_seen desc;
end $$;
revoke all on function public.live_presence_summary(int) from public;
grant execute on function public.live_presence_summary(int) to authenticated;
