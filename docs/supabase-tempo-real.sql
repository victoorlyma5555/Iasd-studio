-- Atualização instantânea: ativa o Realtime nas tabelas do site (rode uma vez no SQL Editor do Supabase).
do $$
declare t text;
begin
  foreach t in array array['iasd_schedules','iasd_site_content','iasd_site_assets','iasd_custom_tabs','iasd_site_theme','iasd_offering_videos'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
             when undefined_table then null;
    end;
  end loop;
end $$;
