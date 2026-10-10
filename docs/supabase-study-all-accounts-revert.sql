-- Reverte somente as políticas/função ajustadas por supabase-study-all-accounts.sql.
-- Não altera nem apaga cursos, respostas, progresso ou salas já armazenados.

begin;

drop function if exists public.iasd_study_courses_public();

drop policy if exists iasd_study_courses_manage on public.iasd_study_courses;
drop policy if exists iasd_study_courses_all on public.iasd_study_courses;
create policy iasd_study_courses_all on public.iasd_study_courses for all
  using (public.iasd_study_can()) with check (public.iasd_study_can());

drop policy if exists iasd_study_progress_own on public.iasd_study_progress;
create policy iasd_study_progress_own on public.iasd_study_progress for all
  using (auth.uid() = user_id and public.iasd_study_can())
  with check (auth.uid() = user_id and public.iasd_study_can());

create or replace function public.iasd_study_room_register(p_code text,p_key jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not public.iasd_study_can() then raise exception 'Dirigente não autorizado'; end if;
 if p_code !~ '^[A-Z0-9]{4,8}$' or p_key->>'kty' is distinct from 'EC' or p_key->>'crv' is distinct from 'P-256' or coalesce(p_key->>'x','') !~ '^[A-Za-z0-9_-]{43}$' or coalesce(p_key->>'y','') !~ '^[A-Za-z0-9_-]{43}$' or p_key ? 'd' then raise exception 'Chave pública inválida';end if;
 insert into public.iasd_study_rooms(code,owner,public_key,expires_at) values(p_code,auth.uid(),p_key,now()+interval '12 hours')
 on conflict(code) do update set owner=excluded.owner,public_key=excluded.public_key,expires_at=excluded.expires_at
 where iasd_study_rooms.owner=auth.uid() or iasd_study_rooms.expires_at<now();
 if not found then raise exception 'Código de sala já está em uso';end if;
 return true;
end $$;
revoke all on function public.iasd_study_room_register(text,jsonb) from public,anon;
grant execute on function public.iasd_study_room_register(text,jsonb) to authenticated;

commit;

