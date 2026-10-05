-- Teste do servidor oficial de Constelações (rodar num Postgres com docs/supabase-sequencia.sql aplicado).
-- psql -v ON_ERROR_STOP=1 -f tests/seq-sql-test.sql   -> termina com "TODOS OS TESTES SQL PASSARAM"
do $$
declare
  a jsonb; b jsonb; c jsonb; w jsonb; s jsonb; room uuid; code text;
  pa uuid; ta uuid; pb uuid; tb uuid; pc uuid; tc uuid;
  v int; cur uuid; curt uuid; oth uuid; othtok uuid; st jsonb; hnd int[]; ok boolean; i int; cell int; card int;
  err text; mv uuid;
  k int;
begin
  -- ---------- sala e lobby ----------
  a := public.seq_create_room('1v1','Victor',null);
  room := (a->>'room')::uuid; code := a->'pub'->>'code'; pa := (a->>'player')::uuid; ta := (a->>'token')::uuid;
  assert code ~ '^[0-9]{6}$', 'codigo de 6 digitos';
  assert a->'pub'->>'status'='lobby', 'lobby';
  b := public.seq_join_room(code,'João',null);
  pb := (b->>'player')::uuid; tb := (b->>'token')::uuid;
  assert (b->'pub'->'players')::jsonb @> '[{"name":"João"}]'::jsonb, 'joao entrou';
  assert jsonb_array_length(b->'pub'->'players')=2, 'dois jogadores';
  -- mesmo token (F5) e mesmo nome (duplo clique) não criam fantasma
  c := public.seq_join_room(code,'João',tb);
  assert (c->>'player')::uuid=pb, 'F5 volta ao mesmo jogador';
  c := public.seq_join_room(code,'joão',null);
  assert (c->>'player')::uuid=pb, 'duplo clique/mesmo nome nao duplica';
  assert (select count(*) from seqg.players where room_id=room)=2, 'sem fantasmas';
  begin perform public.seq_join_room(code,'Carlos',null); raise exception 'deveria falhar'; exception when others then assert sqlerrm='room_full','sala cheia: '||sqlerrm; end;
  begin perform public.seq_start(room,pb,tb); raise exception 'deveria falhar'; exception when others then assert sqlerrm='host_only','so host inicia: '||sqlerrm; end;
  begin perform public.seq_start(room,pa,gen_random_uuid()); raise exception 'deveria falhar'; exception when others then assert sqlerrm='player_not_authorized','token errado: '||sqlerrm; end;

  -- ---------- início ----------
  s := public.seq_start(room,pa,ta);
  assert s->'pub'->>'status'='playing','playing';
  assert jsonb_array_length(s->'me'->'hand')=6,'mao de 6 no 1v1';
  assert (select cardinality(deck) from seqg.rooms where id=room)=136-12,'baralho 124';
  assert (select count(distinct x) from unnest((select b_card from seqg.rooms where id=room)) x)=32,'32 cartas no tabuleiro';
  assert (select count(*) from seqg.rooms r, unnest(r.b_card) x where r.id=room and x=5)=2,'cada carta em duas casas';
  -- privacidade: o estado público nunca traz mãos; o de outro jogador traz só a mão dele
  assert not ((s->'pub')::text ~ '"hand": ?\['),'pub sem mao';
  w := public.seq_watch(code);
  assert (w->'me') is null or w->'me'='null'::jsonb,'telao sem mao';
  assert not (w::text ~ '"hand": ?\['), 'telao sem lista de cartas';
  st := public.seq_state(room,pb,tb);
  assert st->'me'->'hand' <> s->'me'->'hand','maos diferentes';
  begin perform public.seq_state(room,pb,ta); raise exception 'deveria falhar'; exception when others then assert sqlerrm='player_not_authorized','token de outro: '||sqlerrm; end;
  begin perform public.seq_join_room(code,'Intruso',null); raise exception 'deveria falhar'; exception when others then assert sqlerrm='room_started','partida iniciada: '||sqlerrm; end;

  -- ---------- turno ----------
  v := (s->'pub'->>'v')::int;
  cur := (s->'pub'->>'turnPlayer')::uuid;
  if cur=pa then oth:=pb; othtok:=tb; curt:=ta; else oth:=pa; othtok:=ta; curt:=tb; end if;
  begin perform public.seq_move(room,oth,othtok,v,gen_random_uuid(),'play',0,0); raise exception 'deveria falhar'; exception when others then assert sqlerrm='not_your_turn','fora do turno: '||sqlerrm; end;
  begin perform public.seq_move(room,cur,curt,v-1,gen_random_uuid(),'play',0,0); raise exception 'deveria falhar'; exception when others then assert sqlerrm='stale_version','versao antiga: '||sqlerrm; end;
  -- jogada válida: pega a primeira carta comum da mão e uma casa dela
  st := public.seq_state(room,cur,curt);
  hnd := array(select jsonb_array_elements_text(st->'me'->'hand')::int);
  i := null;
  for k in 1..cardinality(hnd) loop if hnd[k]<32 then i:=k-1; exit; end if; end loop;
  if i is null then i:=0; end if;
  card := hnd[i+1];
  cell := (select (seqg.valid_cells(r2,card,(st->'me'->>'team')::int))[1] from seqg.rooms r2 where id=room);
  if cell is null then
    -- mão sem jogada: força uma mão jogável
    update seqg.players set hand = array[ (select b_card[1] from seqg.rooms where id=room) ] || hand[2:cardinality(hand)] where id=cur;
    st := public.seq_state(room,cur,curt); card := (select b_card[1] from seqg.rooms where id=room); i:=0; cell:=0;
  end if;
  begin perform public.seq_move(room,cur,curt,v,gen_random_uuid(),'play',i,
     (select x from generate_series(0,63) x where x<>all(coalesce(seqg.valid_cells((select r3 from seqg.rooms r3 where id=room),card,0),'{}')) limit 1)); raise exception 'deveria falhar'; exception when others then assert sqlerrm='invalid_cell','casa invalida: '||sqlerrm; end;
  mv := gen_random_uuid();
  w := public.seq_move(room,cur,curt,v,mv,'play',i,cell);
  assert (w->'pub'->>'v')::int=v+1,'versao subiu';
  assert w->'pub'->'board'->cell->>1=(st->'me'->>'team'),'ficha da equipe colocada';
  assert (w->'pub'->>'turnPlayer')::uuid=oth,'turno passou';
  assert jsonb_array_length(w->'me'->'hand')=6,'repôs carta';
  -- idempotência: repetir o mesmo move não duplica nada
  w := public.seq_move(room,cur,curt,v,mv,'play',i,cell);
  assert (w->'pub'->>'v')::int=v+1,'idempotente: mesma versao';
  assert (select count(*) from seqg.rooms r, unnest(r.b_own) x where r.id=room and x<>-1)=1,'uma ficha só';

  -- ---------- sequências: horizontal, vertical, diagonais ----------
  declare dirs int[][] := array[[0,1],[1,0],[1,1],[1,-1]]; d int; tm int; baseR int; baseC int; cells int[]; k2 int; line_ok boolean; pl uuid; tk uuid; vv int; ww jsonb; wins int;
  begin
   for d in 1..4 loop
    -- reinicia partida
    update seqg.rooms set status='lobby' where id=room;
    s := public.seq_start(room,pa,ta);
    vv := (s->'pub'->>'v')::int; pl := (s->'pub'->>'turnPlayer')::uuid; tk := case when pl=pa then ta else tb end;
    tm := (select team from seqg.players where id=pl);
    baseR := 1; baseC := case when d=4 then 5 else 1 end; cells := '{}';
    for k2 in 0..4 loop cells := cells || ((baseR+k2*dirs[d][1])*8 + baseC+k2*dirs[d][2]); end loop;
    -- coloca 4 fichas da equipe do jogador da vez e dá a carta da 5ª
    update seqg.rooms set b_own = (select array_agg(case when (g-1) = any(cells[1:4]) then tm else -1 end order by g) from generate_series(1,64) g) where id=room;
    update seqg.players set hand = array[(select b_card[cells[5]+1] from seqg.rooms where id=room)] || hand[2:cardinality(hand)] where id=pl;
    ww := public.seq_move(room,pl,tk,vv,gen_random_uuid(),'play',0,cells[5]);
    assert jsonb_array_length(ww->'pub'->'lines')=1, 'linha formada dir '||d||' '||ww->'pub'->>'lines';
    assert ww->'pub'->'last'->'lines'->0->'c' = to_jsonb(cells), 'celulas da linha dir '||d;
    assert ww->'pub'->>'status'='playing','uma sequencia ainda nao vence';
   end loop;
  end;

  -- ---------- vitória (2 sequências) + sobreposição de 1 ficha ----------
  update seqg.rooms set status='lobby' where id=room;
  s := public.seq_start(room,pa,ta);
  declare vv int; pl uuid; tk uuid; tm int; ww jsonb; cells1 int[]; cells2 int[];
  begin
    vv := (s->'pub'->>'v')::int; pl := (s->'pub'->>'turnPlayer')::uuid; tk := case when pl=pa then ta else tb end;
    tm := (select team from seqg.players where id=pl);
    -- linha 1: linha 0 casas 0..4 já pronta; linha 2: coluna 4 (casas 4,12,20,28,36) compartilhando a casa 4
    cells1 := array[0,1,2,3,4]; cells2 := array[4,12,20,28,36];
    update seqg.rooms set b_own=(select array_agg(case when (g-1)=any(cells1) or ((g-1)=any(cells2[2:4])) then tm else -1 end order by g) from generate_series(1,64) g),
      lines=jsonb_build_array(jsonb_build_object('t',tm,'c',to_jsonb(cells1))) where id=room;
    update seqg.players set hand = array[(select b_card[37] from seqg.rooms where id=room)] || hand[2:cardinality(hand)] where id=pl;
    ww := public.seq_move(room,pl,tk,vv,gen_random_uuid(),'play',0,36);
    assert ww->'pub'->>'status'='finished','venceu com 2 sequencias';
    assert (ww->'pub'->>'winner')::int=tm,'equipe vencedora';
    assert jsonb_array_length(ww->'pub'->'lines')=2,'duas linhas compartilhando 1 ficha';
    begin perform public.seq_move(room,pl,tk,(ww->'pub'->>'v')::int,gen_random_uuid(),'play',0,0); raise exception 'deveria falhar'; exception when others then assert sqlerrm='not_playing','apos fim: '||sqlerrm; end;
  end;

  -- ---------- remover, coringa, trocar, passar, tempo ----------
  update seqg.rooms set status='lobby' where id=room;
  s := public.seq_start(room,pa,ta);
  declare vv int; pl uuid; tk uuid; tm int; ww jsonb; opp int;
  begin
    vv := (s->'pub'->>'v')::int; pl := (s->'pub'->>'turnPlayer')::uuid; tk := case when pl=pa then ta else tb end;
    tm := (select team from seqg.players where id=pl); opp := 1-tm;
    -- ficha adversária solta na casa 10, ficha adversária travada na casa 20
    update seqg.rooms set b_own=(select array_agg(case when (g-1) in (10,20) then opp else -1 end order by g) from generate_series(1,64) g),
      lines=jsonb_build_array(jsonb_build_object('t',opp,'c','[20,21,22,23,24]'::jsonb)) where id=room;
    update seqg.players set hand = array[33,32,(select b_card[1] from seqg.rooms where id=room)] || hand[4:cardinality(hand)] where id=pl;
    begin perform public.seq_move(room,pl,tk,vv,gen_random_uuid(),'play',0,20); raise exception 'deveria falhar'; exception when others then assert sqlerrm='invalid_cell','ficha de sequencia nao pode ser removida: '||sqlerrm; end;
    begin perform public.seq_move(room,pl,tk,vv,gen_random_uuid(),'play',0,5); raise exception 'deveria falhar'; exception when others then assert sqlerrm='invalid_cell','remover casa vazia: '||sqlerrm; end;
    ww := public.seq_move(room,pl,tk,vv,gen_random_uuid(),'play',0,10);
    assert (ww->'pub'->'board'->10->>1)::int=-1,'removeu a ficha adversaria';
    -- agora é o outro; volta ao primeiro via timeout simulado para testar coringa
    update seqg.rooms set deadline=now()-interval '1 second' where id=room;
    begin perform public.seq_move(room,pl,tk,(ww->'pub'->>'v')::int,gen_random_uuid(),'timeout'); exception when others then err:=sqlerrm; end;
    assert err is null,'qualquer jogador pode registrar o timeout: '||coalesce(err,'');
    ww := public.seq_state(room,pa,ta);
    assert (ww->'pub'->'last'->>'k')='timeout','turno consumido por tempo';
    begin perform public.seq_move(room,pa,ta,(ww->'pub'->>'v')::int,gen_random_uuid(),'timeout'); raise exception 'deveria falhar'; exception when others then assert sqlerrm='not_expired','sem expirar: '||sqlerrm; end;
  end;

  -- carta morta: troca (uma vez) sem gastar o turno
  update seqg.rooms set status='lobby' where id=room;
  s := public.seq_start(room,pa,ta);
  declare vv int; pl uuid; tk uuid; ww jsonb; dead int;
  begin
    vv := (s->'pub'->>'v')::int; pl := (s->'pub'->>'turnPlayer')::uuid; tk := case when pl=pa then ta else tb end;
    -- ocupa as duas casas da carta 7 e entrega a carta 7 ao jogador
    update seqg.rooms set b_own=(select array_agg(case when b_card[g]=7 then 0 else -1 end order by g) from generate_series(1,64) g, seqg.rooms where id=room) where id=room;
    update seqg.players set hand = array[7,32] || hand[3:cardinality(hand)] where id=pl;
    begin perform public.seq_move(room,pl,tk,vv,gen_random_uuid(),'exchange',1); raise exception 'deveria falhar'; exception when others then assert sqlerrm='card_not_dead','coringa nao e carta morta: '||sqlerrm; end;
    ww := public.seq_move(room,pl,tk,vv,gen_random_uuid(),'exchange',0);
    assert (ww->'pub'->>'turnPlayer')::uuid=pl,'trocar nao gasta o turno';
    begin perform public.seq_move(room,pl,tk,(ww->'pub'->>'v')::int,gen_random_uuid(),'exchange',0); raise exception 'deveria falhar'; exception when others then assert sqlerrm in ('already_swapped','card_not_dead'),'so uma troca: '||sqlerrm; end;
  end;

  -- ---------- 2v2: equipes, ordem alternada, 5 cartas ----------
  a := public.seq_create_room('2v2','Victor',null); room := (a->>'room')::uuid; code := a->'pub'->>'code'; pa := (a->>'player')::uuid; ta := (a->>'token')::uuid;
  b := public.seq_join_room(code,'João',null); pb := (b->>'player')::uuid; tb := (b->>'token')::uuid;
  c := public.seq_join_room(code,'Carlos',null); pc := (c->>'player')::uuid; tc := (c->>'token')::uuid;
  assert (select team from seqg.players where id=pa)=0 and (select team from seqg.players where id=pb)=1 and (select team from seqg.players where id=pc)=0,'equilibrio automatico';
  begin perform public.seq_start(room,pa,ta); raise exception 'deveria falhar'; exception when others then assert sqlerrm='need_players','faltam jogadores: '||sqlerrm; end;
  w := public.seq_join_room(code,'Pedro',null);
  begin perform public.seq_assign(room,pa,ta,pb,0); raise exception 'deveria falhar'; exception when others then assert sqlerrm='team_full','equipe cheia: '||sqlerrm; end;
  s := public.seq_start(room,pa,ta);
  assert jsonb_array_length(s->'me'->'hand')=5,'mao de 5 no 2v2';
  assert (select count(*) from jsonb_array_elements_text(s->'pub'->'order') o join seqg.players p on p.id=o::uuid where p.team=0)=2,'2 por equipe';
  assert (select array_agg(p.team order by ord) from jsonb_array_elements_text(s->'pub'->'order') with ordinality t(o,ord) join seqg.players p on p.id=t.o::uuid) in ('{0,1,0,1}','{0,1,0,1}'::int[]),'ordem alterna equipes';

  -- ---------- 3v3 ----------
  a := public.seq_create_room('3v3','A',null); room := (a->>'room')::uuid; code := a->'pub'->>'code'; pa := (a->>'player')::uuid; ta := (a->>'token')::uuid;
  for i in 2..6 loop perform public.seq_join_room(code,'J'||i,null); end loop;
  s := public.seq_start(room,pa,ta);
  assert jsonb_array_length(s->'pub'->'order')=6,'6 jogadores no 3v3';
  assert (select count(distinct x) from jsonb_array_elements_text(s->'pub'->'order') x)=6,'ordem sem repetidos';

  raise notice 'TODOS OS TESTES SQL PASSARAM';
end $$;
