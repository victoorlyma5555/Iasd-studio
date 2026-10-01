-- Sonoplastia: bibliotecas compartilhadas (músicas ambientes, músicas especiais, Provai e Vede)
-- e categoria dos vídeos de Dízimos e Informativos.
-- Rode uma vez no Supabase (SQL Editor). Sem isto, tudo continua funcionando: as bibliotecas ficam salvas
-- só no navegador de cada sonoplasta (o Studio avisa isso na Galeria).
-- ATENÇÃO: escrito a partir do código do site, ainda NÃO testado no banco real.

create table if not exists public.iasd_media_library (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('ambient','special','testimony')),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title text,
  channel text,
  pool boolean not null default true,          -- Provai e Vede: participa do sorteio?
  added_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (kind, youtube_id)
);
alter table public.iasd_media_library enable row level security;

create or replace function public.iasd_media_can()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.iasd_members m
                  where m.user_id = auth.uid() and m.role in ('sonoplasta','founder','cofounder'));
$$;

drop policy if exists iasd_media_library_select on public.iasd_media_library;
drop policy if exists iasd_media_library_write on public.iasd_media_library;
create policy iasd_media_library_select on public.iasd_media_library for select using (public.iasd_media_can());
create policy iasd_media_library_write  on public.iasd_media_library for all    using (public.iasd_media_can()) with check (public.iasd_media_can());

-- Dízimos e Informativos: categoria do vídeo (Dízimos e ofertas / Informativo / Vídeo especial)
alter table public.iasd_offering_videos add column if not exists kind text;

-- tempo real (a biblioteca atualiza sozinha nos outros computadores)
do $$ begin
  begin alter publication supabase_realtime add table public.iasd_media_library; exception when duplicate_object then null; end;
end $$;
