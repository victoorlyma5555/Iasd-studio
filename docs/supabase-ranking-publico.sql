-- Ranking público para visitantes (Destaques da comunidade na Home).
-- Rode UMA vez no Supabase: SQL Editor > New query > colar > Run.
--
-- O que faz: cria a função iasd_public_ranking(), que devolve só o TOP do ranking com
-- primeiro nome + inicial do sobrenome ("Maria S.") e as pontuações. Não expõe e-mail,
-- telefone, foto nem a tabela inteira. Visitantes (anon) só conseguem chamar esta função.
--
-- Sem rodar este script, visitantes continuam vendo o bloco com o convite "Entrar para participar"
-- (quem está logado vê o ranking normalmente).

create or replace function public.iasd_public_ranking(p_limit int default 10)
returns table (
  display_name text,
  score int,
  correct_answers int,
  total_answers int,
  best_streak int
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      btrim(coalesce(p.full_name, '')) as nome,
      coalesce(s.score, 0)::int as score,
      coalesce(s.correct_answers, 0)::int as correct_answers,
      coalesce(s.total_answers, 0)::int as total_answers,
      coalesce(s.best_streak, 0)::int as best_streak
    from public.iasd_game_stats s
    left join public.iasd_profiles p on p.user_id = s.user_id
  )
  select
    case
      when nome = '' then 'Participante'
      when position(' ' in nome) = 0 then nome
      else split_part(nome, ' ', 1) || ' ' ||
           upper(left((regexp_split_to_array(nome, '\s+'))[array_length(regexp_split_to_array(nome, '\s+'), 1)], 1)) || '.'
    end as display_name,
    score, correct_answers, total_answers, best_streak
  from base
  order by score desc
  limit least(greatest(coalesce(p_limit, 10), 1), 20);
$$;

revoke all on function public.iasd_public_ranking(int) from public;
grant execute on function public.iasd_public_ranking(int) to anon, authenticated;
