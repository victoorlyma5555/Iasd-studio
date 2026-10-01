-- Músicas especiais: "Meus arquivos" (áudio e vídeo próprios da igreja, sem anúncio). Bucket PRIVADO.
-- Requer public.iasd_media_can() (supabase-sonoplastia-biblioteca.sql). Rode uma vez no SQL Editor.
create table if not exists public.iasd_media_files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  mime text,
  storage_path text not null unique,
  size_bytes bigint,
  added_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.iasd_media_files enable row level security;
drop policy if exists iasd_media_files_select on public.iasd_media_files;
drop policy if exists iasd_media_files_write on public.iasd_media_files;
create policy iasd_media_files_select on public.iasd_media_files for select using (public.iasd_media_can());
create policy iasd_media_files_write  on public.iasd_media_files for all    using (public.iasd_media_can()) with check (public.iasd_media_can());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('iasd-media-files', 'iasd-media-files', false, 52428800,
        array['audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/aac','audio/wav','audio/x-wav','audio/ogg','audio/webm','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_files_read"   on storage.objects;
drop policy if exists "media_files_insert" on storage.objects;
drop policy if exists "media_files_update" on storage.objects;
drop policy if exists "media_files_delete" on storage.objects;
create policy "media_files_read"   on storage.objects for select using (bucket_id = 'iasd-media-files' and public.iasd_media_can());
create policy "media_files_insert" on storage.objects for insert with check (bucket_id = 'iasd-media-files' and public.iasd_media_can());
create policy "media_files_update" on storage.objects for update using (bucket_id = 'iasd-media-files' and public.iasd_media_can());
create policy "media_files_delete" on storage.objects for delete using (bucket_id = 'iasd-media-files' and public.iasd_media_can());
