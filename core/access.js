(function(){
'use strict';
const roles=Object.freeze({
 management:['founder','cofounder','admin'],
 scheduleEditors:['founder','cofounder','admin','editor','operator'],
 assigned:['founder','cofounder','admin','editor','operator','sonoplasta'],
 sound:['sonoplasta','founder','cofounder']
});
const has=(group,role)=>roles[group]?.includes(role)||false;
window.IASDAccess=Object.freeze({
 roles,
 has,
 canManage:role=>has('management',role),
 canEditSchedule:role=>has('scheduleEditors',role),
 hasAssignedRole:role=>has('assigned',role),
 canUseSound:role=>has('sound',role)
});
})();