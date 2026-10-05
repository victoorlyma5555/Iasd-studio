-- ============================================================================
-- IASD APP · Constelações (jogo de cartas e tabuleiro) — ONLINE, servidor oficial
-- Isolado: schema próprio "seqg" (nunca exposto pela API) + RPCs "seq_*" no public.
-- Não toca no Jogo Coletivo (live_*) nem em nenhuma outra tabela.
-- Padrão igual ao Jogo Coletivo: RPC SECURITY DEFINER, sala por código de 6 dígitos,
-- token secreto por jogador. As mãos e o baralho ficam SÓ no servidor.
-- Cartas: 0..31 comuns (naipe = id/8, valor = id%8) · 32 = Coringa · 33 = Remover
-- ============================================================================
create schema if not exists seqg;
revoke all on schema seqg from public, anon, authenticated;

create table if not exists seqg.rooms(
  id uuid primary key default gen_random_uuid(),
  code text not null,
  mode text not null default '1v1' check (mode in ('1v1','2v2','3v3','4v4','5v5','6v6')),
  status text not null default 'lobby' check (status in ('lobby','playing','finished')),
  version int not null default 1,
  b_card int[], b_own int[],
  lines jsonb not null default '[]'::jsonb,
  deck int[] not null default '{}', discard int[] not null default '{}',
  order_ids uuid[] not null default '{}',
  turn int not null default 0,
  secs int not null default 45,
  deadline timestamptz,
  swapped boolean not null default false,
  winner int,
  turns int not null default 0,
  last jsonb,
  last_move uuid,
  host_player uuid,
  games int not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '8 hours'
);
create index if not exists seq_rooms_code on seqg.rooms(code) where expires_at is not null;

create table if not exists seqg.players(
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references seqg.rooms(id) on delete cascade,
  name text not null,
  seat int not null,
  team int not null check (team in (0,1)),
  token uuid not null default gen_random_uuid(),
  hand int[] not null default '{}',
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index if not exists seq_players_room on seqg.players(room_id);
alter table seqg.rooms enable row level security;
alter table seqg.players enable row level security;
revoke all on all tables in schema seqg from public, anon, authenticated;

-- ---------- utilidades internas ----------
create or replace function seqg.shuffle(a int[]) returns int[] language sql volatile set search_path='' as
$$ select coalesce(array_agg(x order by random()),'{}') from unnest(a) x $$;

create or replace function seqg.cap(m text) returns int language sql immutable set search_path='' as
$$ select case m when '1v1' then 2 when '2v2' then 4 when '3v3' then 6 when '4v4' then 8 when '5v5' then 10 when '6v6' then 12 else 2 end $$;

create or replace function seqg.is_locked(p_lines jsonb, p_cell int) returns boolean language sql immutable set search_path='' as
$$ select exists(select 1 from jsonb_array_elements(p_lines) l, jsonb_array_elements_text(l->'c') e where e::int = p_cell) $$;

-- novas linhas de 5 que passam pela casa p_cell (sem dividir mais de 1 ficha com linha já feita da mesma equipe)
create or replace function seqg.find_lines(p_own int[], p_cell int, p_team int, p_existing jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare
  r int := p_cell/8; c int := p_cell%8;
  dr int[] := array[0,1,1,1]; dc int[] := array[1,0,1,-1];
  d int; off int; k int; rr int; cc int; cells int[]; ok boolean; okk boolean;
  found jsonb := '[]'::jsonb; allq jsonb; ln jsonb; ov int;
begin
  for d in 1..4 loop
    for off in 0..4 loop
      cells := '{}'; ok := true;
      for k in 0..4 loop
        rr := r + (k-off)*dr[d]; cc := c + (k-off)*dc[d];
        if rr<0 or rr>7 or cc<0 or cc>7 then ok:=false; exit; end if;
        if p_own[rr*8+cc+1] is distinct from p_team then ok:=false; exit; end if;
        cells := cells || (rr*8+cc);
      end loop;
      if ok then
        allq := p_existing || found; okk := true;
        for ln in select * from jsonb_array_elements(allq) loop
          if (ln->>'t')::int = p_team then
            select count(*) into ov from jsonb_array_elements_text(ln->'c') e where e::int = any(cells);
            if ov > 1 then okk:=false; exit; end if;
          end if;
        end loop;
        if okk then found := found || jsonb_build_array(jsonb_build_object('t',p_team,'c',to_jsonb(cells))); end if;
      end if;
    end loop;
  end loop;
  return found;
end $$;

-- casas válidas para uma carta, para a equipe p_team
create or replace function seqg.valid_cells(r seqg.rooms, p_card int, p_team int) returns int[]
language plpgsql immutable set search_path='' as $$
declare i int; res int[] := '{}';
begin
  for i in 0..63 loop
    if p_card = 33 then
      if r.b_own[i+1] is not null and r.b_own[i+1] <> -1 and r.b_own[i+1] <> p_team and not seqg.is_locked(r.lines,i) then res := res || i; end if;
    elsif p_card = 32 then
      if r.b_own[i+1] = -1 then res := res || i; end if;
    else
      if r.b_card[i+1] = p_card and r.b_own[i+1] = -1 then res := res || i; end if;
    end if;
  end loop;
  return res;
end $$;

create or replace function seqg.pub(r seqg.rooms) returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object(
    'v', r.version, 'code', r.code, 'mode', r.mode, 'status', r.status, 'secs', r.secs,
    'board', case when r.b_card is null then null else (select jsonb_agg(jsonb_build_array(c, o) order by i) from unnest(r.b_card, r.b_own) with ordinality as t(c,o,i)) end,
    'lines', r.lines, 'order', to_jsonb(r.order_ids), 'turn', r.turn,
    'turnPlayer', case when r.status='playing' then to_jsonb(r.order_ids[r.turn+1]) else null end,
    'deadline', case when r.deadline is null then null else (extract(epoch from r.deadline)*1000)::bigint end,
    'winner', r.winner, 'last', r.last, 'deckLeft', cardinality(r.deck), 'host', r.host_player, 'games', r.games,
    'swapped', r.swapped,
    'players', coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'seat',p.seat,'team',p.team,'hand',cardinality(p.hand),'on',p.last_seen > now()-interval '30 seconds') order by p.seat) from seqg.players p where p.room_id=r.id),'[]'::jsonb),
    'now', (extract(epoch from clock_timestamp())*1000)::bigint
  ) $$;

create or replace function seqg.view(r seqg.rooms, me seqg.players) returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('room', r.id, 'pub', seqg.pub(r),
    'me', case when me.id is null then null else jsonb_build_object('id',me.id,'seat',me.seat,'team',me.team,'hand',to_jsonb(me.hand),'host',(r.host_player=me.id)) end) $$;

create or replace function seqg.auth(p_room uuid, p_player uuid, p_token uuid) returns seqg.players language plpgsql security definer set search_path='' as $$
declare me seqg.players;
begin
  select * into me from seqg.players where id=p_player and room_id=p_room and token=p_token;
  if not found then raise exception 'player_not_authorized'; end if;
  return me;
end $$;

-- ---------- API pública (RPC) ----------
create or replace function public.seq_create_room(p_mode text, p_name text, p_token uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players; c text; n int := 0; nm text;
begin
  if p_mode not in ('1v1','2v2','3v3','4v4','5v5','6v6') then raise exception 'invalid_mode'; end if;
  nm := left(trim(coalesce(p_name,'')),24);
  if length(nm) < 1 then raise exception 'invalid_player_name'; end if;
  delete from seqg.rooms where expires_at < now();
  if (select count(*) from seqg.rooms) > 400 then raise exception 'too_many_rooms'; end if;
  loop
    c := lpad((floor(random()*1000000))::int::text,6,'0'); n := n+1;
    exit when not exists(select 1 from seqg.rooms where code=c and expires_at>now());
    if n>30 then raise exception 'no_code'; end if;
  end loop;
  insert into seqg.rooms(code,mode) values (c,p_mode) returning * into r;
  insert into seqg.players(room_id,name,seat,team,token) values (r.id,nm,0,0,coalesce(p_token,gen_random_uuid())) returning * into me;
  update seqg.rooms set host_player=me.id where id=r.id returning * into r;
  return jsonb_build_object('player',me.id,'token',me.token) || seqg.view(r,me);
end $$;

create or replace function public.seq_join_room(p_code text, p_name text, p_token uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players; nm text; norm text; cnt int; t0 int; t1 int; v_team int;
begin
  if p_code !~ '^[0-9]{6}$' then raise exception 'invalid_room_code'; end if;
  nm := left(trim(coalesce(p_name,'')),24);
  if length(nm) < 1 then raise exception 'invalid_player_name'; end if;
  norm := lower(nm);
  select * into r from seqg.rooms where code=p_code and expires_at>now() order by created_at desc limit 1;
  if not found then raise exception 'room_not_found'; end if;
  perform pg_advisory_xact_lock(hashtext('seq|'||r.id::text));
  select * into r from seqg.rooms where id=r.id for update;
  -- volta com o token (F5 / queda de internet): mesmo jogador, sem duplicar
  if p_token is not null then
    select * into me from seqg.players where room_id=r.id and token=p_token;
    if found then update seqg.players set last_seen=now() where id=me.id; return jsonb_build_object('player',me.id,'token',me.token) || seqg.view(r,me); end if;
  end if;
  -- mesmo nome já na sala: reaproveita (duplo clique / token perdido) em vez de criar fantasma
  select * into me from seqg.players where room_id=r.id and lower(name)=norm order by joined_at limit 1;
  if found then update seqg.players set last_seen=now() where id=me.id; return jsonb_build_object('player',me.id,'token',me.token) || seqg.view(r,me); end if;
  if r.status<>'lobby' then raise exception 'room_started'; end if;
  select count(*), count(*) filter (where team=0), count(*) filter (where team=1) into cnt,t0,t1 from seqg.players where room_id=r.id;
  if cnt >= seqg.cap(r.mode) then raise exception 'room_full'; end if;
  v_team := case when t0 <= t1 then 0 else 1 end;
  insert into seqg.players(room_id,name,seat,team,token) values (r.id,nm,cnt,v_team,coalesce(p_token,gen_random_uuid())) returning * into me;
  update seqg.rooms set version=version+1 where id=r.id returning * into r;
  return jsonb_build_object('player',me.id,'token',me.token) || seqg.view(r,me);
end $$;

create or replace function public.seq_state(p_room uuid, p_player uuid, p_token uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players;
begin
  me := seqg.auth(p_room,p_player,p_token);
  update seqg.players set last_seen=now() where id=me.id and last_seen < now()-interval '5 seconds';
  select * into r from seqg.rooms where id=p_room and expires_at>now();
  if not found then raise exception 'room_not_found'; end if;
  return seqg.view(r,me);
end $$;

-- telão / espectador: só estado público (nunca mãos)
create or replace function public.seq_watch(p_code text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms;
begin
  if p_code !~ '^[0-9]{6}$' then raise exception 'invalid_room_code'; end if;
  select * into r from seqg.rooms where code=p_code and expires_at>now() order by created_at desc limit 1;
  if not found then raise exception 'room_not_found'; end if;
  return jsonb_build_object('room',r.id,'pub',seqg.pub(r),'me',null);
end $$;

create or replace function public.seq_set_mode(p_room uuid, p_player uuid, p_token uuid, p_mode text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players; cnt int;
begin
  me := seqg.auth(p_room,p_player,p_token);
  select * into r from seqg.rooms where id=p_room and expires_at>now() for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_player<>me.id then raise exception 'host_only'; end if;
  if r.status='playing' then raise exception 'already_started'; end if;
  if p_mode not in ('1v1','2v2','3v3','4v4','5v5','6v6') then raise exception 'invalid_mode'; end if;
  select count(*) into cnt from seqg.players where room_id=p_room;
  if cnt > seqg.cap(p_mode) then raise exception 'too_many_players'; end if;
  update seqg.rooms set mode=p_mode, version=version+1 where id=p_room returning * into r;
  return seqg.view(r,me);
end $$;

create or replace function public.seq_assign(p_room uuid, p_player uuid, p_token uuid, p_target uuid, p_team int) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players; tcount int;
begin
  me := seqg.auth(p_room,p_player,p_token);
  select * into r from seqg.rooms where id=p_room and expires_at>now() for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_player<>me.id then raise exception 'host_only'; end if;
  if r.status='playing' then raise exception 'already_started'; end if;
  if p_team not in (0,1) then raise exception 'invalid_team'; end if;
  select count(*) into tcount from seqg.players where room_id=p_room and team=p_team and id<>p_target;
  if tcount >= seqg.cap(r.mode)/2 then raise exception 'team_full'; end if;
  update seqg.players set team=p_team where id=p_target and room_id=p_room;
  update seqg.rooms set version=version+1 where id=p_room returning * into r;
  return seqg.view(r,me);
end $$;

create or replace function public.seq_swap_teams(p_room uuid, p_player uuid, p_token uuid, p_a uuid, p_b uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players; ta int; tb int;
begin
  me := seqg.auth(p_room,p_player,p_token);
  select * into r from seqg.rooms where id=p_room and expires_at>now() for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_player<>me.id then raise exception 'host_only'; end if;
  if r.status='playing' then raise exception 'already_started'; end if;
  select team into ta from seqg.players where id=p_a and room_id=p_room;
  select team into tb from seqg.players where id=p_b and room_id=p_room;
  if ta is null or tb is null then raise exception 'player_not_found'; end if;
  update seqg.players set team=case when id=p_a then tb else ta end where id in (p_a,p_b);
  update seqg.rooms set version=version+1 where id=p_room returning * into r;
  return seqg.view(r,me);
end $$;

create or replace function public.seq_remove(p_room uuid, p_player uuid, p_token uuid, p_target uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players;
begin
  me := seqg.auth(p_room,p_player,p_token);
  select * into r from seqg.rooms where id=p_room and expires_at>now() for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_player<>me.id then raise exception 'host_only'; end if;
  if r.status='playing' then raise exception 'already_started'; end if;
  if p_target=me.id then raise exception 'cannot_remove_host'; end if;
  delete from seqg.players where id=p_target and room_id=p_room;
  with s as (select id, row_number() over (order by seat)-1 as n from seqg.players where room_id=p_room)
    update seqg.players p set seat=s.n from s where p.id=s.id;
  update seqg.rooms set version=version+1 where id=p_room returning * into r;
  return seqg.view(r,me);
end $$;

create or replace function public.seq_leave(p_room uuid, p_player uuid, p_token uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players; nh uuid;
begin
  me := seqg.auth(p_room,p_player,p_token);
  select * into r from seqg.rooms where id=p_room for update;
  if not found then return jsonb_build_object('ok',true); end if;
  if r.status='lobby' then
    delete from seqg.players where id=me.id;
    select id into nh from seqg.players where room_id=p_room order by seat limit 1;
    if nh is null then delete from seqg.rooms where id=p_room; return jsonb_build_object('ok',true); end if;
    with s as (select id, row_number() over (order by seat)-1 as n from seqg.players where room_id=p_room)
      update seqg.players p set seat=s.n from s where p.id=s.id;
    update seqg.rooms set host_player=case when host_player=me.id then nh else host_player end, version=version+1 where id=p_room;
  else
    update seqg.players set last_seen=now()-interval '10 minutes' where id=me.id;
  end if;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.seq_start(p_room uuid, p_player uuid, p_token uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players; cnt int; t0 int; t1 int; half int; hs int; i int;
  vals int[]; bc int[]; bo int[]; dk int[]; ord uuid[] := '{}'; a uuid[]; b uuid[]; pl record; n int;
begin
  me := seqg.auth(p_room,p_player,p_token);
  select * into r from seqg.rooms where id=p_room and expires_at>now() for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_player<>me.id and r.status<>'finished' then raise exception 'host_only'; end if;
  if r.status='playing' then raise exception 'already_started'; end if;
  select count(*), count(*) filter (where team=0), count(*) filter (where team=1) into cnt,t0,t1 from seqg.players where room_id=p_room;
  n := seqg.cap(r.mode); half := n/2;
  if cnt < n then raise exception 'need_players'; end if;
  if t0<>half or t1<>half then raise exception 'teams_unbalanced'; end if;
  hs := case r.mode when '1v1' then 6 when '2v2' then 5 when '3v3' then 5 when '4v4' then 4 else 3 end;
  -- tabuleiro: 32 cartas, cada uma em duas casas
  select array_agg(x) into vals from (select (g%32) x from generate_series(0,63) g) s;
  bc := seqg.shuffle(vals);
  bo := array_fill(-1,array[64]);
  -- baralho: 4 de cada carta comum + 4 Coringas + 4 Remover
  select array_agg(x) into dk from (select (g%32) x from generate_series(0,127) g union all select 32 from generate_series(1,4) union all select 33 from generate_series(1,4)) s;
  dk := seqg.shuffle(dk);
  -- ordem alternando as equipes
  select array_agg(id order by seat) into a from seqg.players where room_id=p_room and team=0;
  select array_agg(id order by seat) into b from seqg.players where room_id=p_room and team=1;
  for i in 1..half loop ord := ord || a[i] || b[i]; end loop;
  for pl in select id from seqg.players where room_id=p_room loop
    update seqg.players set hand = dk[1:hs] where id=pl.id;
    dk := dk[hs+1:cardinality(dk)];
  end loop;
  update seqg.rooms set status='playing', b_card=bc, b_own=bo, lines='[]'::jsonb, deck=dk, discard='{}', order_ids=ord,
    turn=floor(random()*n)::int, deadline=case when secs>0 then now()+make_interval(secs=>secs) else null end,
    swapped=false, winner=null, turns=0, last=null, last_move=null, games=games+1, version=version+1,
    expires_at=now()+interval '8 hours'
  where id=p_room returning * into r;
  select * into me from seqg.players where id=me.id;
  return seqg.view(r,me);
end $$;

create or replace function public.seq_set_timer(p_room uuid, p_player uuid, p_token uuid, p_secs int) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players;
begin
  me := seqg.auth(p_room,p_player,p_token);
  select * into r from seqg.rooms where id=p_room and expires_at>now() for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_player<>me.id then raise exception 'host_only'; end if;
  if r.status='playing' then raise exception 'already_started'; end if;
  if p_secs not in (0,30,45,60) then raise exception 'invalid_timer'; end if;
  update seqg.rooms set secs=p_secs, version=version+1 where id=p_room returning * into r;
  return seqg.view(r,me);
end $$;

-- jogada: servidor valida TUDO (turno, versão, carta, casa) e é idempotente por p_move
create or replace function public.seq_move(p_room uuid, p_player uuid, p_token uuid, p_version int, p_move uuid,
  p_kind text, p_idx int default null, p_cell int default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r seqg.rooms; me seqg.players; cur seqg.players; card int; valid int[]; expired boolean; n int; h int[];
  newl jsonb; cnt0 int; cnt1 int; nd int; c int; anyplay boolean; i int; adv boolean := true; lastj jsonb;
begin
  me := seqg.auth(p_room,p_player,p_token);
  select * into r from seqg.rooms where id=p_room and expires_at>now() for update;
  if not found then raise exception 'room_not_found'; end if;
  update seqg.players set last_seen=now() where id=me.id;
  if p_move is not null and r.last_move = p_move then
    select * into me from seqg.players where id=me.id; return seqg.view(r,me);
  end if;
  if r.status<>'playing' then raise exception 'not_playing'; end if;
  if p_version is distinct from r.version then raise exception 'stale_version'; end if;
  n := cardinality(r.order_ids);
  select * into cur from seqg.players where id=r.order_ids[r.turn+1];
  expired := r.deadline is not null and now() >= r.deadline;

  if p_kind='timeout' then
    if not expired then raise exception 'not_expired'; end if;
    lastj := jsonb_build_object('p',cur.id,'k','timeout');
  elsif p_kind='skip' then
    if r.host_player<>me.id then raise exception 'host_only'; end if;
    if not (expired or cur.last_seen < now()-interval '45 seconds') then raise exception 'player_online'; end if;
    lastj := jsonb_build_object('p',cur.id,'k','skip');
  else
    if cur.id<>me.id then raise exception 'not_your_turn'; end if;
    if expired then raise exception 'time_over'; end if;
    if p_kind in ('play','exchange') then
      if p_idx is null or p_idx<0 or p_idx>=cardinality(cur.hand) then raise exception 'invalid_card'; end if;
      card := cur.hand[p_idx+1];
      valid := seqg.valid_cells(r,card,cur.team);
    end if;
    if p_kind='exchange' then
      if r.swapped then raise exception 'already_swapped'; end if;
      if cardinality(valid)>0 then raise exception 'card_not_dead'; end if;
      r.discard := r.discard || card;
      h := cur.hand[1:p_idx] || cur.hand[p_idx+2:cardinality(cur.hand)];
      if cardinality(r.deck)=0 and cardinality(r.discard)>0 then r.deck := seqg.shuffle(r.discard); r.discard := '{}'; end if;
      if cardinality(r.deck)>0 then h := h || r.deck[cardinality(r.deck)]; r.deck := r.deck[1:cardinality(r.deck)-1]; end if;
      update seqg.players set hand=h where id=cur.id;
      update seqg.rooms set deck=r.deck, discard=r.discard, swapped=true, version=version+1, last_move=p_move,
        last=jsonb_build_object('p',cur.id,'k','exchange') where id=p_room returning * into r;
      select * into me from seqg.players where id=me.id;
      return seqg.view(r,me);
    elsif p_kind='pass' then
      anyplay := false;
      for i in 1..cardinality(cur.hand) loop
        if cardinality(seqg.valid_cells(r,cur.hand[i],cur.team))>0 then anyplay:=true; exit; end if;
      end loop;
      if anyplay then raise exception 'must_play'; end if;
      lastj := jsonb_build_object('p',cur.id,'k','pass');
    elsif p_kind='play' then
      if p_cell is null or not (p_cell = any(valid)) then raise exception 'invalid_cell'; end if;
      if card=33 then
        r.b_own[p_cell+1] := -1;
        lastj := jsonb_build_object('p',cur.id,'k','remove','cell',p_cell,'card',card);
      else
        r.b_own[p_cell+1] := cur.team;
        newl := seqg.find_lines(r.b_own,p_cell,cur.team,r.lines);
        r.lines := r.lines || newl;
        lastj := jsonb_build_object('p',cur.id,'k','place','cell',p_cell,'card',card,'lines',newl);
      end if;
      r.discard := r.discard || card;
      h := cur.hand[1:p_idx] || cur.hand[p_idx+2:cardinality(cur.hand)];
      if cardinality(r.deck)=0 and cardinality(r.discard)>0 then r.deck := seqg.shuffle(r.discard); r.discard := '{}'; end if;
      if cardinality(r.deck)>0 then h := h || r.deck[cardinality(r.deck)]; r.deck := r.deck[1:cardinality(r.deck)-1]; end if;
      update seqg.players set hand=h where id=cur.id;
    else
      raise exception 'invalid_kind';
    end if;
  end if;

  -- fim de jogo?
  select count(*) filter (where (l->>'t')::int=0), count(*) filter (where (l->>'t')::int=1) into cnt0,cnt1 from jsonb_array_elements(r.lines) l;
  r.turns := r.turns+1;
  if cnt0>=2 or cnt1>=2 then
    update seqg.rooms set status='finished', winner=case when cnt0>=2 then 0 else 1 end, deadline=null, swapped=false,
      b_own=r.b_own, lines=r.lines, deck=r.deck, discard=r.discard, turns=r.turns, version=version+1, last_move=p_move, last=lastj where id=p_room returning * into r;
  elsif not (-1 = any(r.b_own)) or r.turns>=500 then
    update seqg.rooms set status='finished', winner=-1, deadline=null, swapped=false,
      b_own=r.b_own, lines=r.lines, deck=r.deck, discard=r.discard, turns=r.turns, version=version+1, last_move=p_move, last=lastj where id=p_room returning * into r;
  else
    update seqg.rooms set turn=(r.turn+1)%n, deadline=case when secs>0 then now()+make_interval(secs=>secs) else null end, swapped=false,
      b_own=r.b_own, lines=r.lines, deck=r.deck, discard=r.discard, turns=r.turns, version=version+1, last_move=p_move, last=lastj where id=p_room returning * into r;
  end if;
  select * into me from seqg.players where id=me.id;
  return seqg.view(r,me);
end $$;

revoke all on all functions in schema seqg from public, anon, authenticated;
grant execute on function public.seq_create_room(text,text,uuid), public.seq_join_room(text,text,uuid), public.seq_state(uuid,uuid,uuid),
  public.seq_watch(text), public.seq_set_mode(uuid,uuid,uuid,text), public.seq_assign(uuid,uuid,uuid,uuid,int),
  public.seq_remove(uuid,uuid,uuid,uuid), public.seq_leave(uuid,uuid,uuid), public.seq_start(uuid,uuid,uuid),
  public.seq_set_timer(uuid,uuid,uuid,int), public.seq_swap_teams(uuid,uuid,uuid,uuid,uuid), public.seq_move(uuid,uuid,uuid,int,uuid,text,int,int) to anon, authenticated;
