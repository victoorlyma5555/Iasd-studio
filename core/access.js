(function(){
'use strict';
/* Fonte única de permissões. Cargos administrativos: founder, cofounder, admin.
   Os demais acessos vêm de permissões (por cargo agregado ou direto na pessoa), carregadas do Supabase em setPerms().
   Os cargos antigos (editor, midia, lider, sonoplasta, operator) continuam valendo como garantia, e o banco os converte em cargos agregados. */
const roles=Object.freeze({
 management:['founder','cofounder','admin'],                                   // abas, excluir cronograma, texto do site
 siteEditors:['founder','cofounder','admin','midia'],                          // modo edição, capas, carrossel, acervo
 scheduleEditors:['founder','cofounder','admin','editor','operator'],          // cronogramas
 assigned:['founder','cofounder','admin','editor','operator','midia','lider','sonoplasta'], // qualquer cargo: enviar/apagar alertas
 sound:['sonoplasta','founder','cofounder']                                    // receber/responder alertas, Projetor
});
/* Catálogo: ready=false aparece como "em breve" (o site ainda não consulta essa permissão); sensitive=só o fundador concede */
const catalog=Object.freeze([
 {group:'Cronogramas',items:[
  {key:'cron.edit',label:'Criar e editar cronogramas',hint:'Inclui importar cronogramas antigos',ready:true},
  {key:'cron.delete',label:'Apagar cronogramas',ready:true}]},
 {group:'Escalas',items:[
  {key:'escala.add',label:'Adicionar pessoas nas escalas',ready:true},
  {key:'escala.edit',label:'Editar escalas',ready:true},
  {key:'escala.delete',label:'Excluir escalas',ready:true}]},
 {group:'Escalas por setor (só aquele setor, já predefinido)',items:['Sonoplastia','Regência','Pregação','Escola Sabatina','Recepção','Projeção'].map(n=>({key:'escala.area:'+n,label:'Escalar no setor '+n,ready:true}))},
 {group:'Sonoplastia',items:[
  {key:'sound.use',label:'Usar a sonoplastia e o IASD Projetor',hint:'Studio, telão, sorteadores, receber e responder alertas',ready:true},
  {key:'sound.library',label:'Gerenciar a biblioteca de mídias',hint:'Enviar e apagar vídeos e mídias, sem abrir o Projetor',ready:true}]},
 {group:'Avisos',items:[
  {key:'alert.send_sound',label:'Enviar alertas à sonoplastia',ready:true},
  {key:'alert.delete',label:'Apagar alertas da sonoplastia',ready:true},
  {key:'alert.send_members',label:'Enviar avisos aos membros',hint:'Todos ou uma pessoa, com popup e notificação',ready:true}]},
 {group:'Oração',items:[
  {key:'prayer.moderate',label:'Moderar pedidos de oração',hint:'Marcar como respondido e apagar pedidos de outros',ready:true}]},
 {group:'Sala de Estudo',items:[
  {key:'study.use',label:'Abrir a Sala de Estudo e criar salas',hint:'Criar cursos e conduzir a sala ao vivo',ready:true}]},
 {group:'Site',items:[
  {key:'site.edit',label:'Editar capas, carrossel e acervo de imagens',ready:true},
  {key:'site.texts',label:'Editar textos do site',ready:true},
  {key:'site.tabs',label:'Gerenciar abas personalizadas',ready:true}]},
 {group:'Administração (só o fundador concede)',items:[
  {key:'admin.ranking_reset',label:'Zerar o ranking do jogo',sensitive:true,ready:true}]}
]);
let perms=new Set();
const has=(group,role)=>roles[group]?.includes(role)||false;
const can=k=>perms.has(k);
window.IASDAccess=Object.freeze({
 roles,catalog,
 has,can,
 setPerms:list=>{perms=new Set(Array.isArray(list)?list:[])},
 perms:()=>[...perms],
 canManage:role=>has('management',role),
 canGivePerms:role=>has('management',role),
 canEditSite:role=>has('siteEditors',role)||can('site.edit'),
 canEditTexts:role=>has('management',role)||can('site.texts'),
 canManageTabs:role=>has('management',role)||can('site.tabs'),
 canEscala:(k,role)=>can('escala.'+k)||((k==='add'||k==='edit')&&[...perms].some(x=>x.startsWith('escala.area:')))||has('management',role)||has('scheduleEditors',role)||has('assigned',role),
 canStudy:role=>role==='founder'||can('study.use'),
 canModeratePrayer:role=>role==='founder'||can('prayer.moderate'),
 canResetRanking:role=>role==='founder'||can('admin.ranking_reset'),
 canEditSchedule:role=>has('scheduleEditors',role)||can('cron.edit'),
 canDeleteSchedule:role=>has('management',role)||can('cron.delete'),
 hasAssignedRole:role=>has('assigned',role)||perms.size>0,
 canUseSound:role=>has('sound',role)||can('sound.use'),
 canSendSoundAlert:role=>has('assigned',role)||can('alert.send_sound')||can('sound.use'),
 canDeleteAlert:role=>has('assigned',role)||can('alert.delete'),
 canSendMemberAlert:role=>has('sound',role)||can('alert.send_members')
});
})();
