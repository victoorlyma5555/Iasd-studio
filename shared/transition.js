/* Transição ao projetar: o telão faz a imagem anterior sair e a nova entrar (sem corte seco).
   A escolha do estilo fica em localStorage ("iasd-transition") e vai ao telão como prefixo IASD_TR:tipo:ms| */
(function(){
'use strict';
const TYPES={fade:'Suave',zoom:'Zoom',slide:'Deslizar',blur:'Desfoque',wipe:'Cortina',none:'Nenhuma'};
const SPEEDS={350:'Rápida',600:'Normal',1000:'Lenta'};
function get(){let v=null;try{v=JSON.parse(localStorage.getItem('iasd-transition')||'null')}catch(e){}
 const type=v&&TYPES[v.type]?v.type:'fade',ms=v&&SPEEDS[v.ms]?+v.ms:600;return{type,ms}}
function set(p){const c=get(),n={type:p.type||c.type,ms:p.ms||c.ms};try{localStorage.setItem('iasd-transition',JSON.stringify(n))}catch(e){}return n}
/* conteúdo vazio (tela preta) e jogo não levam prefixo: o telão lembra o último estilo */
function wire(c){
 if(typeof c!=='string'||!c||/^IASD_(GAME|DRAW_STYLE|TR):/.test(c))return c;
 const t=get();if(t.type==='none')return c;
 return 'IASD_TR:'+t.type+':'+t.ms+'|'+c;
}
window.IASDTr=Object.freeze({types:TYPES,speeds:SPEEDS,get,set,wire});
})();
