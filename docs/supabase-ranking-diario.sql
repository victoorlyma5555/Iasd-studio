-- Ranking DIÁRIO e SEMANAL dos jogos (Desafio do Dia).
-- Rode UMA vez no Supabase: SQL Editor > New query > colar > Run.
--
-- Como funciona:
--  * Cada pessoa joga o "Desafio do Dia" de cada jogo UMA vez por dia (quiz, quem sou eu, linha do tempo, memória).
--  * Os pontos entram no ranking do dia e da semana (segunda a domingo, horário de Brasília).
--  * Jogo livre continua liberado para todos, mas não conta pontos.
--  * O servidor impede repetir o mesmo jogo no mesmo dia e limita a pontuação máxima de cada jogo.

create table if not exists public.iasd_game_daily (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  day         date not null,
  game        text not null check (game in ('quiz','who','order','memory')),
  score       int  not null check (score between 0 and 3000),
  correct     int  not null default 0,
  total       int  not null default 0,
  best_streak int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, day, game)
);
create index if not exists iasd_game_daily_day_idx on public.iasd_game_daily (day);
alter table public.iasd_game_daily enable row level security;
-- Sem políticas de leitura/escrita direta: tudo passa pelas funções abaixo.

create or replace function public.iasd_record_daily(
  p_game text, p_score int, p_correct int, p_total int, p_streak int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'America/Sao_Paulo')::date;
  v_cap int;
  v_n int;
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para pontuar' using errcode = '42501';
  end if;
  if p_game not in ('quiz','who','order','memory') then
    raise exception 'Jogo inválido';
  end if;
  v_cap := case p_game when 'quiz' then 2600 when 'who' then 2200 when 'order' then 2400 else 2000 end;
  insert into public.iasd_game_daily (user_id, day, game, score, correct, total, best_streak)
  values (auth.uid(), v_day, p_game,
          least(greatest(coalesce(p_score,0),0), v_cap),
          least(greatest(coalesce(p_correct,0),0), 100),
          least(greatest(coalesce(p_total,0),0), 100),
          least(greatest(coalesce(p_streak,0),0), 100))
  on conflict (user_id, day, game) do nothing;
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;

create or replace function public.iasd_my_daily()
returns table (game text, score int, correct int, total int)
language sql
stable
security definer
set search_path = public
as $$
  select d.game, d.score, d.correct, d.total
  from public.iasd_game_daily d
  where d.user_id = auth.uid()
    and d.day = (now() at time zone 'America/Sao_Paulo')::date;
$$;

create or replace function public.iasd_daily_ranking(p_scope text default 'day')
returns table (
  user_id uuid,
  full_name text,
  avatar_path text,
  score bigint,
  games int,
  correct bigint,
  total bigint,
  best_streak int
)
language sql
stable
security definer
set search_path = public
as $$
  with hoje as (select (now() at time zone 'America/Sao_Paulo')::date as d),
  janela as (
    select case when p_scope = 'week'
                then (select d - ((extract(isodow from d)::int) - 1) from hoje)
                when p_scope = 'month'
                then (select date_trunc('month', d)::date from hoje)
                else (select d from hoje) end as ini,
           (select d from hoje) as fim
  )
  select d.user_id,
         coalesce(nullif(btrim(p.full_name), ''), 'Participante') as full_name,
         p.avatar_path,
         sum(d.score)::bigint as score,
         count(*)::int as games,
         sum(d.correct)::bigint as correct,
         sum(d.total)::bigint as total,
         max(d.best_streak)::int as best_streak
  from public.iasd_game_daily d
  left join public.iasd_profiles p on p.user_id = d.user_id
  cross join janela j
  where d.day between j.ini and j.fim
  group by d.user_id, p.full_name, p.avatar_path
  order by score desc, total asc
  limit 50;
$$;

revoke all on function public.iasd_record_daily(text,int,int,int,int) from public, anon;
revoke all on function public.iasd_my_daily() from public, anon;
revoke all on function public.iasd_daily_ranking(text) from public, anon;
grant execute on function public.iasd_record_daily(text,int,int,int,int) to authenticated;
grant execute on function public.iasd_my_daily() to authenticated;
grant execute on function public.iasd_daily_ranking(text) to authenticated;
