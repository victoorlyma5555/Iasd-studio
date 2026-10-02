-- Passa as funções dos cargos prontos direto para cada pessoa e apaga esses cargos
insert into public.iasd_member_perms(user_id, perms)
select mc.user_id, array(select distinct unnest(c.perms)) from public.iasd_member_cargos mc join public.iasd_cargos c on c.id = mc.cargo_id
 where c.name in ('Sonoplasta','Programação','Comunicação','Líder de ministério')
on conflict (user_id) do update set perms = array(select distinct unnest(public.iasd_member_perms.perms || excluded.perms));
delete from public.iasd_cargos where name in ('Sonoplasta','Programação','Comunicação','Líder de ministério');
