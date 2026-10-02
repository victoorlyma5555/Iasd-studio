/* Transição ao projetar: o telão faz a imagem anterior sair e a nova entrar (sem corte seco).
   A escolha fica em localStorage ("iasd-transition") e vai ao telão como prefixo IASD_TR:código:ms|
   O código é só letras minúsculas (compatível com o IASD Projetor): tipo + ritmo (lin|dyn|ela) + saída (xf = só dissolve). */
(function(){
'use strict';
const TYPES={fade:'Suave',zoom:'Zoom',zoomout:'Afastar',slide:'Deslizar',slideup:'Subir',slidedown:'Descer',blur:'Desfoque',glow:'Luz',wipe:'Cortina',curtain:'Cortina central',iris:'Círculo',flip:'Giro',corner:'Canto',none:'Nenhuma'};
const SPEEDS={200:'Relâmpago',350:'Rápida',600:'Normal',1000:'Lenta',1600:'Bem lenta'};
const EASES={soft:'Suave',lin:'Constante',dyn:'Dinâmico',ela:'Elástico'};
const EXITS={mirror:'Sai como entra',fade:'Só dissolve'};
function get(){let v=null;try{v=JSON.parse(localStorage.getItem('iasd-transition')||'null')}catch(e){}
 const type=v&&TYPES[v.type]?v.type:'fade',ms=v&&SPEEDS[v.ms]?+v.ms:600,ease=v&&EASES[v.ease]?v.ease:'soft',exit=v&&EXITS[v.exit]?v.exit:'mirror';return{type,ms,ease,exit}}
function set(p){const c=get(),n={type:p.type||c.type,ms:p.ms||c.ms,ease:p.ease||c.ease,exit:p.exit||c.exit};try{localStorage.setItem('iasd-transition',JSON.stringify(n))}catch(e){}return n}
/* conteúdo vazio (tela preta) e jogo não levam prefixo: o telão lembra o último estilo */
function wire(c){
 if(typeof c!=='string'||!c||/^IASD_(GAME|DRAW_STYLE|TR):/.test(c))return c;
 const t=get();if(t.type==='none')return c;
 return 'IASD_TR:'+t.type+(t.ease==='soft'?'':t.ease)+(t.exit==='fade'?'xf':'')+':'+t.ms+'|'+c;
}
window.IASDTr=Object.freeze({types:TYPES,speeds:SPEEDS,eases:EASES,exits:EXITS,get,set,wire});
})();
