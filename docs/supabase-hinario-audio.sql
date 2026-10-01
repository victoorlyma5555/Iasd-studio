-- Hinário em áudio na Sonoplastia (antigo e novo): arquivos MP3 enviados pela própria igreja, guardados em bucket PRIVADO.
-- Só sonoplasta, fundador e co-fundador enviam, apagam e tocam. Rode uma vez no SQL Editor do Supabase.
-- Requer a função public.iasd_media_can() (criada em supabase-sonoplastia-biblioteca.sql: rode aquele antes).

create table if not exists public.iasd_hymn_audio (
  edition text not null check (edition in ('antigo','novo')),
  number int not null check (number between 1 and 999),
  storage_path text not null,
  file_name text,
  size_bytes bigint,
  added_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (edition, number)
);
alter table public.iasd_hymn_audio enable row level security;
drop policy if exists iasd_hymn_audio_select on public.iasd_hymn_audio;
drop policy if exists iasd_hymn_audio_write on public.iasd_hymn_audio;
create policy iasd_hymn_audio_select on public.iasd_hymn_audio for select using (public.iasd_media_can());
create policy iasd_hymn_audio_write  on public.iasd_hymn_audio for all    using (public.iasd_media_can()) with check (public.iasd_media_can());

-- bucket privado (50 MB por arquivo; só áudio)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('iasd-hymn-audio', 'iasd-hymn-audio', false, 52428800,
        array['audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/aac','audio/wav','audio/x-wav','audio/ogg','audio/webm'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "hymn_audio_read"   on storage.objects;
drop policy if exists "hymn_audio_insert" on storage.objects;
drop policy if exists "hymn_audio_update" on storage.objects;
drop policy if exists "hymn_audio_delete" on storage.objects;
create policy "hymn_audio_read"   on storage.objects for select using (bucket_id = 'iasd-hymn-audio' and public.iasd_media_can());
create policy "hymn_audio_insert" on storage.objects for insert with check (bucket_id = 'iasd-hymn-audio' and public.iasd_media_can());
create policy "hymn_audio_update" on storage.objects for update using (bucket_id = 'iasd-hymn-audio' and public.iasd_media_can());
create policy "hymn_audio_delete" on storage.objects for delete using (bucket_id = 'iasd-hymn-audio' and public.iasd_media_can());
