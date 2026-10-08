-- O pareamento da câmera é privado e limitado à mesma conta administrativa.
-- Não altera os canais públicos usados pelos convidados na Sala de Estudo.
create policy study_camera_receive on realtime.messages for select to authenticated
using (
 extension = 'broadcast'
 and (select public.iasd_role()) in ('founder','cofounder','admin')
 and (select realtime.topic()) ~ ('^study-camera:' || (select auth.uid())::text || ':[a-f0-9-]{36}$')
);
create policy study_camera_send on realtime.messages for insert to authenticated
with check (
 extension = 'broadcast'
 and (select public.iasd_role()) in ('founder','cofounder','admin')
 and (select realtime.topic()) ~ ('^study-camera:' || (select auth.uid())::text || ':[a-f0-9-]{36}$')
);
