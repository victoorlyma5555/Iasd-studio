-- Reset do ranking de jogos (somente FUNDADOR).
-- Rode UMA vez no Supabase: SQL Editor > New query > colar > Run.
-- Cria iasd_reset_ranking(): apaga as pontuações da tabela iasd_game_stats.
-- Só funciona se quem chama tem o cargo "founder" em iasd_members.

create or replace function public.iasd_reset_ranking()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_n int;
begin
  select role into v_role from public.iasd_members where user_id = auth.uid();
  if v_role is distinct from 'founder' then
    raise exception 'Apenas o fundador pode zerar o ranking' using errcode = '42501';
  end if;
  delete from public.iasd_game_stats where true;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke all on function public.iasd_reset_ranking() from public, anon;
grant execute on function public.iasd_reset_ranking() to authenticated;
