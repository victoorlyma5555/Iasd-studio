-- Additive editor migration. Existing public content and policies are preserved.
create schema if not exists iasd_editor_private;
revoke all on schema iasd_editor_private from public, anon;
grant usage on schema iasd_editor_private to authenticated;

create table public.iasd_editor_state(id integer primary key check(id=1), revision bigint not null default 1);
insert into public.iasd_editor_state(id) values(1);
create table public.iasd_editor_drafts(
 user_id uuid primary key references auth.users(id) on delete cascade,
 document jsonb not null, base_revision bigint not null, base_fingerprint text not null,
 draft_revision bigint not null default 1, updated_at timestamptz not null default now()
);
create table public.iasd_editor_versions(
 revision bigint primary key, document jsonb not null, fingerprint text not null,
 actor uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
 reason text not null, restored_from bigint, summary jsonb not null default '{}'
);
create table public.iasd_editor_audit(
 id bigint generated always as identity primary key, actor uuid references auth.users(id) on delete set null,
 action text not null, created_at timestamptz not null default now(), details jsonb not null default '{}'
);
alter table public.iasd_editor_state enable row level security;
alter table public.iasd_editor_drafts enable row level security;
alter table public.iasd_editor_versions enable row level security;
alter table public.iasd_editor_audit enable row level security;
revoke all on public.iasd_editor_state,public.iasd_editor_drafts,public.iasd_editor_versions,public.iasd_editor_audit from anon,authenticated;
grant select on public.iasd_editor_state to anon,authenticated;
grant select on public.iasd_editor_drafts,public.iasd_editor_versions,public.iasd_editor_audit to authenticated;
create policy editor_revision_read on public.iasd_editor_state for select to anon,authenticated using(true);
create policy editor_draft_owner on public.iasd_editor_drafts for select to authenticated using(user_id=auth.uid() and (public.iasd_has_perm('site.edit') or public.iasd_has_perm('site.texts') or public.iasd_has_perm('site.tabs')));
create policy editor_version_read on public.iasd_editor_versions for select to authenticated using(public.iasd_has_perm('site.edit') or public.iasd_has_perm('site.texts') or public.iasd_has_perm('site.tabs'));
create policy editor_audit_read on public.iasd_editor_audit for select to authenticated using(actor=auth.uid() or public.iasd_is_founder());

create function iasd_editor_private.document() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'texts',coalesce((select jsonb_object_agg(content_key,content_value) from public.iasd_site_content),'{}'::jsonb),
 'assets',coalesce((select jsonb_object_agg(slot,image_path) from public.iasd_site_assets),'{}'::jsonb),
 'frames',coalesce((select jsonb_object_agg(slot,jsonb_build_object('position_x',position_x,'position_y',position_y,'zoom',zoom)) from public.iasd_asset_framing),'{}'::jsonb),
 'tabs',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'description',description,'icon',icon,'sort_order',sort_order) order by sort_order,id) from public.iasd_custom_tabs),'[]'::jsonb));
$$;
-- Public snapshot is intentionally readable, but grants no access to drafts/history.
create function public.iasd_editor_published() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('document',d,'revision',s.revision,'fingerprint',md5(d::text))
 from public.iasd_editor_state s cross join lateral (select iasd_editor_private.document() d) x where id=1;
$$;
revoke all on function public.iasd_editor_published() from public;
grant execute on function public.iasd_editor_published() to anon,authenticated;

create function iasd_editor_private.authorize() returns void language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not(public.iasd_has_perm('site.edit') or public.iasd_has_perm('site.texts') or public.iasd_has_perm('site.tabs')) then raise exception 'EDITOR_PERMISSION_DENIED' using errcode='42501'; end if;
end $$;
create function iasd_editor_private.validate(d jsonb, b jsonb) returns void language plpgsql security definer set search_path='' as $$
declare k text; v jsonb; t jsonb; p jsonb; n integer; x text;
begin
 if d is null or jsonb_typeof(d) is distinct from 'object' or (select count(*) from jsonb_object_keys(d))<>4 or jsonb_typeof(d->'texts') is distinct from 'object' or jsonb_typeof(d->'assets') is distinct from 'object' or jsonb_typeof(d->'frames') is distinct from 'object' or jsonb_typeof(d->'tabs') is distinct from 'array' or octet_length(d::text)>500000 then raise exception 'EDITOR_INVALID_DOCUMENT'; end if;
 if d->'texts' is distinct from b->'texts' and not(public.iasd_has_perm('site.texts') or public.iasd_has_perm('site.edit')) then raise exception 'EDITOR_TEXT_PERMISSION_DENIED' using errcode='42501'; end if;
 if (d->'assets' is distinct from b->'assets' or d->'frames' is distinct from b->'frames') and not public.iasd_has_perm('site.edit') then raise exception 'EDITOR_IMAGE_PERMISSION_DENIED' using errcode='42501'; end if;
 if d->'tabs' is distinct from b->'tabs' and not public.iasd_has_perm('site.tabs') then raise exception 'EDITOR_TAB_PERMISSION_DENIED' using errcode='42501'; end if;
 for k,v in select * from jsonb_each(d->'texts') loop
  if length(k) not between 1 and 100 or jsonb_typeof(v) is distinct from 'string' or length(v#>>'{}')>10000 then raise exception 'EDITOR_INVALID_TEXT'; end if;
 end loop;
 if d->'texts' ? 'home_carousel_seconds' and not((d->'texts'->>'home_carousel_seconds')::numeric between 2 and 30) then raise exception 'EDITOR_INVALID_CAROUSEL_TIME'; end if;
 for k,v in select * from jsonb_each(d->'assets') loop
  x=v#>>'{}';
  if k !~ '^(home_banner(_[1-9][0-9]*)?|site_logo|home_passage|home_icon_[a-zA-Z0-9_-]{1,120}|custom_cover_[a-zA-Z0-9_-]{1,120})$' or jsonb_typeof(v) is distinct from 'string' or length(x)>500 or x !~ '^[a-zA-Z0-9_./ -]+$' or position('..' in x)>0 or left(x,1)='/' then raise exception 'EDITOR_INVALID_IMAGE'; end if;
  if v is distinct from b->'assets'->k and not exists(select 1 from storage.objects where bucket_id='iasd-images' and name=x) then raise exception 'EDITOR_IMAGE_NOT_FOUND: %',x; end if;
 end loop;
 for k,v in select * from jsonb_each(d->'frames') loop
  if k !~ '^(home_banner(_[1-9][0-9]*)?|site_logo|home_passage|home_icon_[a-zA-Z0-9_-]{1,120}|custom_cover_[a-zA-Z0-9_-]{1,120})$' or jsonb_typeof(v) is distinct from 'object' or (select count(*) from jsonb_object_keys(v))<>3 or jsonb_typeof(v->'position_x') is distinct from 'number' or jsonb_typeof(v->'position_y') is distinct from 'number' or jsonb_typeof(v->'zoom') is distinct from 'number' or not((v->>'position_x')::numeric between 0 and 100) or not((v->>'position_y')::numeric between 0 and 100) or (v->>'position_x')::numeric<>trunc((v->>'position_x')::numeric) or (v->>'position_y')::numeric<>trunc((v->>'position_y')::numeric) or not((v->>'zoom')::numeric between 1 and 3) then raise exception 'EDITOR_INVALID_FRAME'; end if;
 end loop;
 for t in select * from jsonb_array_elements(d->'tabs') loop
  if jsonb_typeof(t) is distinct from 'object' or not(t ?& array['id','title','description','icon','sort_order']) or (select count(*) from jsonb_object_keys(t))<>5 or jsonb_typeof(t->'id') is distinct from 'string' or t->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or jsonb_typeof(t->'title') is distinct from 'string' or length(trim(t->>'title')) not between 1 and 70 or jsonb_typeof(t->'description') is distinct from 'string' or length(t->>'description')>2000 or jsonb_typeof(t->'icon') is distinct from 'string' or length(t->>'icon')>12 or jsonb_typeof(t->'sort_order') is distinct from 'number' or not((t->>'sort_order')::numeric between 0 and 100000) or (t->>'sort_order')::numeric<>trunc((t->>'sort_order')::numeric) then raise exception 'EDITOR_INVALID_TAB'; end if;
 end loop;
 if (select count(*) from jsonb_array_elements(d->'tabs'))<>(select count(distinct tab_item->>'id') from jsonb_array_elements(d->'tabs') tab_item) then raise exception 'EDITOR_DUPLICATE_TAB'; end if;
 if d->'texts' ? 'home_carousel_cfg' then
  p=(d->'texts'->>'home_carousel_cfg')::jsonb;
  if jsonb_typeof(p) is distinct from 'object' then raise exception 'EDITOR_INVALID_CAROUSEL'; end if;
  for x,t in select * from jsonb_each(p) loop
   if x='sec' then if jsonb_typeof(t) is distinct from 'number' or not((t#>>'{}')::numeric between 2 and 30) then raise exception 'EDITOR_INVALID_CAROUSEL'; end if;
   elsif x='fx' then if jsonb_typeof(t) is distinct from 'string' or t#>>'{}' not in ('fade','slide','zoom') then raise exception 'EDITOR_INVALID_CAROUSEL'; end if;
   elsif x in ('shuffle','dots','arrows','pause') then if jsonb_typeof(t) is distinct from 'boolean' then raise exception 'EDITOR_INVALID_CAROUSEL'; end if;
   elsif x in ('order','off') then
    if jsonb_typeof(t) is distinct from 'array' then raise exception 'EDITOR_INVALID_CAROUSEL'; end if;
    if exists(select 1 from jsonb_array_elements(t) item where jsonb_typeof(item) is distinct from 'string' or item#>>'{}' !~ '^home_banner(_[1-9][0-9]*)?$') or jsonb_array_length(t)<>(select count(distinct item#>>'{}') from jsonb_array_elements(t) item) then raise exception 'EDITOR_INVALID_CAROUSEL'; end if;
   else raise exception 'EDITOR_INVALID_CAROUSEL'; end if;
  end loop;
 end if;
 if d->'texts' ? 'home_editor_props' then
  p=(d->'texts'->>'home_editor_props')::jsonb;
  if jsonb_typeof(p) is distinct from 'object' then raise exception 'EDITOR_INVALID_PROPERTIES'; end if;
  for k,v in select * from jsonb_each(p) loop
   if k !~ '^(banner|passage|cards|card:[a-zA-Z0-9_:-]+)$' or jsonb_typeof(v) is distinct from 'object' then raise exception 'EDITOR_INVALID_COMPONENT'; end if;
   for x,t in select * from jsonb_each(v) loop
    if x='hidden' then if jsonb_typeof(t) is distinct from 'boolean' then raise exception 'EDITOR_INVALID_VISIBILITY'; end if;
    elsif x='align' then if jsonb_typeof(t) is distinct from 'string' or t#>>'{}' not in ('left','center','right') then raise exception 'EDITOR_INVALID_ALIGNMENT'; end if;
    elsif x='order' then if jsonb_typeof(t) is distinct from 'number' or not((t#>>'{}')::numeric between 0 and 1000) or (t#>>'{}')::numeric<>trunc((t#>>'{}')::numeric) then raise exception 'EDITOR_INVALID_ORDER'; end if;
    elsif x in ('title','description','alt') then if jsonb_typeof(t) is distinct from 'string' or length(t#>>'{}')>1000 then raise exception 'EDITOR_INVALID_PROPERTY_TEXT'; end if;
    elsif x='destination' then
     if jsonb_typeof(t) is distinct from 'string' or t#>>'{}' not in ('Cronograma','Bíblia','Escalas','Datas especiais','Mídia','Mais') and not exists(select 1 from jsonb_array_elements(d->'tabs') a where 'custom:'||(a->>'id')=t#>>'{}') then raise exception 'EDITOR_INVALID_LINK'; end if;
    else raise exception 'EDITOR_UNKNOWN_PROPERTY'; end if;
   end loop;
  end loop;
 end if;
end $$;

create function public.iasd_editor_save(p_document jsonb,p_base_revision bigint,p_base_fingerprint text,p_expected bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.iasd_editor_drafts; b jsonb;
begin
 perform iasd_editor_private.authorize();
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if p_document is null or octet_length(p_document::text)>500000 then raise exception 'EDITOR_DRAFT_TOO_LARGE'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));select * into r from public.iasd_editor_drafts where user_id=auth.uid() for update;
 if p_expected is null or coalesce(r.draft_revision,0)<>p_expected then raise exception 'EDITOR_DRAFT_CONFLICT' using errcode='40001'; end if;
 b=iasd_editor_private.document();perform iasd_editor_private.validate(p_document,b);
 insert into public.iasd_editor_drafts(user_id,document,base_revision,base_fingerprint,draft_revision) values(auth.uid(),p_document,p_base_revision,p_base_fingerprint,p_expected+1)
 on conflict(user_id) do update set document=excluded.document,base_revision=excluded.base_revision,base_fingerprint=excluded.base_fingerprint,draft_revision=excluded.draft_revision,updated_at=now()
 returning * into r;
 return to_jsonb(r);
end $$;

create function public.iasd_editor_publish(p_expected bigint,p_revision bigint,p_fingerprint text,p_restore bigint default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare b jsonb; d jsonb; rev bigint; f text; r public.iasd_editor_drafts; summary jsonb;
begin
 perform iasd_editor_private.authorize();
 select revision into rev from public.iasd_editor_state where id=1 for update;
 lock table public.iasd_site_content,public.iasd_site_assets,public.iasd_asset_framing,public.iasd_custom_tabs in share row exclusive mode;
 b=iasd_editor_private.document();f=md5(b::text);
 if p_expected is null or p_revision is null or p_fingerprint is null or rev<>p_revision or f<>p_fingerprint then raise exception 'EDITOR_PUBLICATION_CONFLICT' using errcode='40001'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));select * into r from public.iasd_editor_drafts where user_id=auth.uid() for update;
 if coalesce(r.draft_revision,0)<>p_expected then raise exception 'EDITOR_DRAFT_CONFLICT' using errcode='40001';end if;
 if p_restore is null then
  if r.user_id is null or r.draft_revision<>p_expected then raise exception 'EDITOR_DRAFT_CONFLICT' using errcode='40001'; end if;
  if r.base_revision<>rev or r.base_fingerprint<>f then raise exception 'EDITOR_PUBLICATION_CONFLICT' using errcode='40001'; end if;
  d=r.document;
 else select document into d from public.iasd_editor_versions where revision=p_restore;
  if d is null then raise exception 'EDITOR_VERSION_NOT_FOUND'; end if;
 end if;
 perform iasd_editor_private.validate(d,b);
 if d=b then raise exception 'EDITOR_NO_CHANGES'; end if;
 -- Capture legacy writes since the previous snapshot without changing old history.
 if not exists(select 1 from public.iasd_editor_versions where revision=rev and fingerprint=f) then
  rev=rev+1;insert into public.iasd_editor_versions(revision,document,fingerprint,actor,reason) values(rev,b,f,auth.uid(),'Conteúdo anterior à publicação');
 end if;
 summary=jsonb_build_object('texts',(select count(*) from (select key from jsonb_each(b->'texts') union select key from jsonb_each(d->'texts')) x where b->'texts'->key is distinct from d->'texts'->key),'images',(select count(*) from (select key from jsonb_each(b->'assets') union select key from jsonb_each(d->'assets')) x where b->'assets'->key is distinct from d->'assets'->key),'frames',(select count(*) from (select key from jsonb_each(b->'frames') union select key from jsonb_each(d->'frames')) x where b->'frames'->key is distinct from d->'frames'->key),'tabs',case when b->'tabs'=d->'tabs' then 0 else jsonb_array_length(d->'tabs') end);
 delete from public.iasd_site_content where not(d->'texts' ? content_key);
 insert into public.iasd_site_content(content_key,content_value,updated_by,updated_at) select key,value#>>'{}',auth.uid(),now() from jsonb_each(d->'texts') where value is distinct from b->'texts'->key on conflict(content_key) do update set content_value=excluded.content_value,updated_by=excluded.updated_by,updated_at=excluded.updated_at;
 delete from public.iasd_site_assets where not(d->'assets' ? slot);
 insert into public.iasd_site_assets(slot,image_path,updated_at) select key,value#>>'{}',now() from jsonb_each(d->'assets') where value is distinct from b->'assets'->key on conflict(slot) do update set image_path=excluded.image_path,updated_at=excluded.updated_at;
 delete from public.iasd_asset_framing where not(d->'frames' ? slot);
 insert into public.iasd_asset_framing(slot,position_x,position_y,zoom,updated_at) select key,(value->>'position_x')::integer,(value->>'position_y')::integer,(value->>'zoom')::numeric,now() from jsonb_each(d->'frames') where value is distinct from b->'frames'->key on conflict(slot) do update set position_x=excluded.position_x,position_y=excluded.position_y,zoom=excluded.zoom,updated_at=excluded.updated_at;
 delete from public.iasd_custom_tabs where id not in(select (t->>'id')::uuid from jsonb_array_elements(d->'tabs') t);
 insert into public.iasd_custom_tabs(id,title,description,icon,sort_order) select (t->>'id')::uuid,t->>'title',t->>'description',t->>'icon',(t->>'sort_order')::integer from jsonb_array_elements(d->'tabs') t on conflict(id) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order;
 rev=rev+1;d=iasd_editor_private.document();f=md5(d::text);
 insert into public.iasd_editor_versions(revision,document,fingerprint,actor,reason,restored_from,summary) values(rev,d,f,auth.uid(),case when p_restore is null then 'Publicação' else 'Restauração' end,p_restore,summary);
 update public.iasd_editor_state set revision=rev where id=1;
 delete from public.iasd_editor_drafts where user_id=auth.uid();
 insert into public.iasd_editor_audit(actor,action,details) values(auth.uid(),case when p_restore is null then 'publish' else 'restore' end,jsonb_build_object('revision',rev,'restored_from',p_restore,'summary',summary));
 return jsonb_build_object('document',d,'revision',rev,'fingerprint',f);
end $$;
create function public.iasd_editor_discard(p_expected bigint) returns void language plpgsql security definer set search_path='' as $$
declare r public.iasd_editor_drafts;
begin
 perform iasd_editor_private.authorize();perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));select * into r from public.iasd_editor_drafts where user_id=auth.uid() for update;
 if p_expected is null or coalesce(r.draft_revision,0)<>p_expected then raise exception 'EDITOR_DRAFT_CONFLICT' using errcode='40001'; end if;
 delete from public.iasd_editor_drafts where user_id=auth.uid();
 insert into public.iasd_editor_audit(actor,action,details) values(auth.uid(),'discard',jsonb_build_object('base_revision',r.base_revision));
end $$;
-- Security definer functions are guarded and use a fixed, empty search_path.
revoke all on all functions in schema iasd_editor_private from public,anon,authenticated;
revoke all on function public.iasd_editor_save(jsonb,bigint,text,bigint),public.iasd_editor_publish(bigint,bigint,text,bigint),public.iasd_editor_discard(bigint) from public,anon;
grant execute on function public.iasd_editor_save(jsonb,bigint,text,bigint),public.iasd_editor_publish(bigint,bigint,text,bigint),public.iasd_editor_discard(bigint) to authenticated;
insert into public.iasd_editor_versions(revision,document,fingerprint,reason) select 1,d,md5(d::text),'Estado anterior ao editor' from (select iasd_editor_private.document() d) x;

-- Retain media used in immutable restoration points and private drafts.
create function public.iasd_editor_image_retained(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.iasd_site_assets where image_path=p_name)
 or exists(select 1 from public.iasd_editor_versions v,jsonb_each_text(v.document->'assets') a where a.value=p_name)
 or exists(select 1 from public.iasd_editor_drafts v,jsonb_each_text(v.document->'assets') a where a.value=p_name);
$$;
revoke all on function public.iasd_editor_image_retained(text) from public,anon;
grant execute on function public.iasd_editor_image_retained(text) to authenticated;
create policy editor_retain_images on storage.objects as restrictive for delete to authenticated using(bucket_id<>'iasd-images' or not public.iasd_editor_image_retained(name));

-- Exposed RPC wrappers run as the caller; guarded privileged work lives in a non-exposed schema.
alter function public.iasd_editor_save(jsonb,bigint,text,bigint) set schema iasd_editor_private;
alter function public.iasd_editor_publish(bigint,bigint,text,bigint) set schema iasd_editor_private;
alter function public.iasd_editor_discard(bigint) set schema iasd_editor_private;
alter function public.iasd_editor_image_retained(text) set schema iasd_editor_private;
create function public.iasd_editor_save(p_document jsonb,p_base_revision bigint,p_base_fingerprint text,p_expected bigint) returns jsonb language sql security invoker set search_path='' as $$ select iasd_editor_private.iasd_editor_save(p_document,p_base_revision,p_base_fingerprint,p_expected); $$;
create function public.iasd_editor_publish(p_expected bigint,p_revision bigint,p_fingerprint text,p_restore bigint default null) returns jsonb language sql security invoker set search_path='' as $$ select iasd_editor_private.iasd_editor_publish(p_expected,p_revision,p_fingerprint,p_restore); $$;
create function public.iasd_editor_discard(p_expected bigint) returns void language sql security invoker set search_path='' as $$ select iasd_editor_private.iasd_editor_discard(p_expected); $$;
revoke all on function public.iasd_editor_save(jsonb,bigint,text,bigint),public.iasd_editor_publish(bigint,bigint,text,bigint),public.iasd_editor_discard(bigint) from public,anon;
grant execute on function public.iasd_editor_save(jsonb,bigint,text,bigint),public.iasd_editor_publish(bigint,bigint,text,bigint),public.iasd_editor_discard(bigint) to authenticated;
create or replace function public.iasd_editor_published() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('document',d,'revision',s.revision,'fingerprint',md5(d::text)) from public.iasd_editor_state s cross join lateral (select jsonb_build_object(
 'texts',coalesce((select jsonb_object_agg(content_key,content_value) from public.iasd_site_content),'{}'::jsonb),
 'assets',coalesce((select jsonb_object_agg(slot,image_path) from public.iasd_site_assets),'{}'::jsonb),
 'frames',coalesce((select jsonb_object_agg(slot,jsonb_build_object('position_x',position_x,'position_y',position_y,'zoom',zoom)) from public.iasd_asset_framing),'{}'::jsonb),
 'tabs',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'description',description,'icon',icon,'sort_order',sort_order) order by sort_order,id) from public.iasd_custom_tabs),'[]'::jsonb))) x(d) where id=1;
$$;

create policy editor_retain_image_updates on storage.objects as restrictive for update to authenticated using(bucket_id<>'iasd-images' or not iasd_editor_private.iasd_editor_image_retained(name)) with check(bucket_id<>'iasd-images' or not iasd_editor_private.iasd_editor_image_retained(name));

create function public.iasd_editor_image_retained(p_name text) returns boolean language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null or not public.iasd_has_perm('site.edit') then raise exception 'EDITOR_IMAGE_PERMISSION_DENIED' using errcode='42501';end if;
 return iasd_editor_private.iasd_editor_image_retained(p_name);
end $$;
revoke all on function public.iasd_editor_image_retained(text) from public,anon;
grant execute on function public.iasd_editor_image_retained(text) to authenticated;
