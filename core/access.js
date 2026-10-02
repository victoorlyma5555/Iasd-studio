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
 {group:'Sonoplastia',items:[
  {key:'sound.use',label:'Usar a sonoplastia e o IASD Projetor',hint:'Studio, telão, sorteadores, receber e responder alertas',ready:true},
  {key:'sound.library',label:'Gerenciar a biblioteca de mídias da sonoplastia',ready:false}]},
 {group:'Avisos',items:[
  {key:'alert.send_sound',label:'Enviar alertas à sonoplastia',ready:true},
  {key:'alert.send_members',label:'Enviar avisos aos membros',hint:'Todos ou uma pessoa, com popup e notificação',ready:true}]},
 {group:'Oração',items:[
  {key:'prayer.moderate',label:'Moderar pedidos de oração',ready:false}]},
 {group:'Site',items:[
  {key:'site.edit',label:'Editar capas, carrossel e acervo de imagens',ready:true},
  {key:'site.texts',label:'Editar textos do site',ready:true},
  {key:'site.tabs',label:'Gerenciar abas personalizadas',ready:true},
  {key:'site.theme',label:'Mudar o tema do site',ready:false}]},
 {group:'Administração (só o fundador concede)',items:[
  {key:'admin.accounts',label:'Ver contas e editar perfis de membros',sensitive:true,ready:false},
  {key:'admin.layout',label:'Ajustar layout e prévia dos aparelhos',sensitive:true,ready:false},
  {key:'admin.ranking_reset',label:'Reiniciar o ranking do jogo',sensitive:true,ready:false},
  {key:'admin.study',label:'Gerenciar a Sala de Estudo',sensitive:true,ready:false}]}
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
 canEditSchedule:role=>has('scheduleEditors',role)||can('cron.edit'),
 canDeleteSchedule:role=>has('management',role)||can('cron.delete'),
 hasAssignedRole:role=>has('assigned',role)||perms.size>0,
 canUseSound:role=>has('sound',role)||can('sound.use'),
 canSendSoundAlert:role=>has('assigned',role)||can('alert.send_sound')||can('sound.use'),
 canSendMemberAlert:role=>has('sound',role)||can('alert.send_members')
});
})();
