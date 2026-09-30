/*
 IASD APP — ponte da nova interface aprovada no MagicPath.
 Esta camada NÃO substitui Supabase, rotas, permissões ou o IASD Projetor.
 Ela expõe somente dados/ações reais para a nova apresentação consumir.
*/
(function(){
'use strict';
const routes=window.IASDRouter?.routes||{};
const pageFor={
 home:'Painel',schedule:'Cronograma',scales:'Escalas',sound:'Sonoplastia',
 bible:'Bíblia',lesson:'Lição da Escola Sabatina',games:'Jogo',
 dates:'Datas especiais',stage:'Palavra em Cena',hymnal:'Hinário',
 admin:'Fundador',assets:'Acervo',profile:'Perfil',alerts:'Alertas'
};
function go(key){
 const page=pageFor[key]||key;
 if(typeof window.go==='function') return window.go(page);
 const path=window.IASDRouter?.pathForPage?.(page)||routes[page]||'/';
 location.assign(path);
}
async function user(){
 const svc=window.IASDCloudService;
 const u=svc?.currentUser?.();
 if(!u)return null;
 const [profile,role]=await Promise.all([
   svc.profile?.(u.id).catch(()=>null),
   svc.role?.(u.id).catch(()=>null)
 ]);
 return {id:u.id,email:u.email||'',name:profile?.name||profile?.full_name||u.user_metadata?.name||u.email||'',avatar:profile?.avatar_url||u.user_metadata?.avatar_url||'',role:role||''};
}
async function schedules(){
 const rows=await window.IASDCloudService?.schedules?.();
 return Array.isArray(rows)?rows:[];
}
async function projector(){
 try{
  const s=await window.IASDProjectorService?.status?.();
  if(!s)return {paired:!!window.IASDProjectorService?.token?.(),connected:false};
  return {paired:true,connected:true,...s};
 }catch(_){
  return {paired:!!window.IASDProjectorService?.token?.(),connected:false};
 }
}
function theme(){
 return localStorage.getItem('iasd-theme')||document.documentElement.dataset.theme||'dark';
}
function setTheme(value){
 localStorage.setItem('iasd-theme',value);
 document.documentElement.dataset.theme=value;
 window.dispatchEvent(new CustomEvent('iasd:theme',{detail:{theme:value}}));
}
window.IASDMagicPathBridge=Object.freeze({
 go,user,schedules,projector,theme,setTheme,
 routeFor:key=>window.IASDRouter?.pathForPage?.(pageFor[key]||key)||'/'
});
})();