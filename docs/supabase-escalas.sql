-- Escalas compartilhadas, com permissão no servidor
create table if not exists public.iasd_escalas (
  id uuid primary key default gen_random_uuid(),
  line text not null check (char_length(line) between 8 and 400),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.iasd_escalas enable row level security;
drop policy if exists "escalas ler" on public.iasd_escalas;
drop policy if exists "escalas adicionar" on public.iasd_escalas;
drop policy if exists "escalas editar" on public.iasd_escalas;
drop policy if exists "escalas excluir" on public.iasd_escalas;
create policy "escalas ler" on public.iasd_escalas for select to authenticated using (true);
create policy "escalas adicionar" on public.iasd_escalas for insert to authenticated with check (public.iasd_has_perm('escala.add'));
create policy "escalas editar" on public.iasd_escalas for update to authenticated using (public.iasd_has_perm('escala.edit')) with check (public.iasd_has_perm('escala.edit'));
create policy "escalas excluir" on public.iasd_escalas for delete to authenticated using (public.iasd_has_perm('escala.delete'));
create or replace function public.iasd_escalas_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists iasd_escalas_touch on public.iasd_escalas;
create trigger iasd_escalas_touch before update on public.iasd_escalas for each row execute function public.iasd_escalas_touch();
alter publication supabase_realtime add table public.iasd_escalas;
revoke all on public.iasd_escalas from anon;
