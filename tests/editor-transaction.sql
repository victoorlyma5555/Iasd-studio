-- Run with a database administrator connection. Every write is rolled back.
begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.iasd_members where role='founder' limit 1),true);
set local role authenticated;
do $$
declare p jsonb; d jsonb; r jsonb; bad jsonb;
begin
 p=public.iasd_editor_published();d=jsonb_set(p->'document','{texts,home_editor_banner_title}','"TESTE TRANSACIONAL"');
 r=public.iasd_editor_save(d,(p->>'revision')::bigint,p->>'fingerprint',0);
 if public.iasd_editor_published()->'document'<>p->'document' then raise exception 'Draft leaked';end if;
 begin perform public.iasd_editor_save(d,(p->>'revision')::bigint,p->>'fingerprint',0);raise exception 'Draft CAS bypass';exception when serialization_failure then null;end;
 begin perform public.iasd_editor_publish(1,null,p->>'fingerprint',null);raise exception 'Null revision accepted';exception when serialization_failure then null;end;
 begin perform public.iasd_editor_publish(1,(p->>'revision')::bigint,null,null);raise exception 'Null fingerprint accepted';exception when serialization_failure then null;end;
 begin perform public.iasd_editor_publish(1,(p->>'revision')::bigint,'stale',null);raise exception 'Stale publication accepted';exception when serialization_failure then null;end;
 bad=jsonb_set(d,'{frames,home_banner}','{"position_x":101,"position_y":50,"zoom":1}');
 begin perform public.iasd_editor_save(bad,(p->>'revision')::bigint,p->>'fingerprint',1);raise exception 'Invalid frame accepted';exception when raise_exception then if sqlerrm='Invalid frame accepted' then raise;end if;end;
 bad=jsonb_set(d,'{assets,home_banner}','"../invalid.png"');
 begin perform public.iasd_editor_save(bad,(p->>'revision')::bigint,p->>'fingerprint',1);raise exception 'Invalid path accepted';exception when raise_exception then if sqlerrm='Invalid path accepted' then raise;end if;end;
 bad=jsonb_set(d,'{texts,home_editor_props}',to_jsonb('{"banner":{"html":"<script>"}}'::text));
 begin perform public.iasd_editor_save(bad,(p->>'revision')::bigint,p->>'fingerprint',1);raise exception 'Arbitrary property accepted';exception when raise_exception then if sqlerrm='Arbitrary property accepted' then raise;end if;end;
 bad=jsonb_set(d,'{texts,home_editor_props}',to_jsonb('{"card:home_icon_bible":{"destination":"Bíblia"}}'::text));
 r=public.iasd_editor_save(bad,(p->>'revision')::bigint,p->>'fingerprint',1);
 r=public.iasd_editor_save(d,(p->>'revision')::bigint,p->>'fingerprint',2);
 r=public.iasd_editor_publish(3,(p->>'revision')::bigint,p->>'fingerprint',null);
 if r->'document'<>d then raise exception 'Publication mismatch';end if;
 r=public.iasd_editor_publish(0,(r->>'revision')::bigint,r->>'fingerprint',(p->>'revision')::bigint);
 if r->'document'<>p->'document' then raise exception 'Restore mismatch';end if;
 if exists(select 1 from public.iasd_site_assets where not public.iasd_editor_image_retained(image_path)) then raise exception 'Snapshot media not retained';end if;
 if (select count(*) from public.iasd_editor_versions)<3 then raise exception 'History lost';end if;
 if not exists(select 1 from public.iasd_editor_versions where restored_from=(p->>'revision')::bigint) then raise exception 'Restoration audit missing';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);
set local role authenticated;
do $$begin
 if (select count(*) from public.iasd_editor_versions)<>0 then raise exception 'History exposed';end if;
 if (select count(*) from public.iasd_editor_drafts)<>0 then raise exception 'Draft exposed';end if;
 begin perform public.iasd_editor_image_retained('private-test-path');raise exception 'Retention metadata exposed';exception when insufficient_privilege then null;end;
 begin perform public.iasd_editor_discard(0);raise exception 'Unauthorized write';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select public.iasd_editor_published()->>'fingerprint' as public_snapshot;
rollback;
select public.iasd_editor_published()->>'fingerprint' as preserved_fingerprint;
