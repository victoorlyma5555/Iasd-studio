(function(){
'use strict';
/* Fonte única de permissões. Cargos: founder, cofounder, admin, editor (Programação),
   midia (Comunicação), lider (Líder de ministério), sonoplasta, operator (antigo → Programação). */
const roles=Object.freeze({
 management:['founder','cofounder','admin'],                                   // abas, excluir cronograma
 siteEditors:['founder','cofounder','admin','midia'],                          // modo edição, capas, carrossel, acervo
 scheduleEditors:['founder','cofounder','admin','editor','operator'],          // cronogramas
 assigned:['founder','cofounder','admin','editor','operator','midia','lider','sonoplasta'], // qualquer cargo: enviar/apagar alertas
 sound:['sonoplasta','founder','cofounder']                                    // receber/responder alertas, Projetor
});
const has=(group,role)=>roles[group]?.includes(role)||false;
window.IASDAccess=Object.freeze({
 roles,
 has,
 canManage:role=>has('management',role),
 canEditSite:role=>has('siteEditors',role),
 canEditSchedule:role=>has('scheduleEditors',role),
 hasAssignedRole:role=>has('assigned',role),
 canUseSound:role=>has('sound',role)
});
})();
