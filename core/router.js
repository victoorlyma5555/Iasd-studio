(function(){
'use strict';
const routes={
  'Painel':'/',
  'Cronograma':'/cronogramas',
  'Escalas':'/escalas',
  'Sonoplastia':'/sonoplastia',
  'Projeção':'/sonoplastia/projecao',
  'Sorteadores':'/sonoplastia/sorteadores',
  'Mídia':'/midia',
  'Bíblia':'/biblia',
  'Lição da Escola Sabatina':'/licao-sabatica',
  'Datas especiais':'/datas-especiais',
  'Palavra em Cena':'/jograis',
  'Jogo':'/jogos',
  'Hinário':'/hinario',
  'Estudo':'/estudo',
  'Fundador':'/admin',
  'Acervo':'/admin/acervo',
  'Perfil':'/perfil',
  'Alertas':'/alertas',
  'Mais':'/menu'
};
const normalized=p=>{p=String(p||'/').split('?')[0].split('#')[0].replace(/\/+$/,'')||'/';return p};
const reverse=Object.fromEntries(Object.entries(routes).map(([page,path])=>[normalized(path),page]));
function pathForPage(page){
 if(String(page||'').startsWith('custom:'))return '/pagina/'+encodeURIComponent(String(page).slice(7));
 return routes[page]||'/';
}
function pageFromLocation(){
 const path=normalized(location.pathname);
 if(path.startsWith('/pagina/'))return 'custom:'+decodeURIComponent(path.slice(8));
 return reverse[path]||null;
}
function sync(page,{replace=false}={}){
 const path=pathForPage(page);
 if(normalized(location.pathname)===normalized(path))return;
 history[replace?'replaceState':'pushState']({iasdPage:page},'',path+location.search+location.hash);
}
window.IASDRouter={routes,pathForPage,pageFromLocation,sync};
})();