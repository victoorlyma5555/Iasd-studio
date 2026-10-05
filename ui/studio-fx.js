/* Studio de Projeção — estilos: formatos e animações do Cronômetro, modelos do Sorteador e legenda dos Temas.
   Carrega depois de studio.js; só acrescenta opções e repassa ao telão junto com o conteúdo. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const TD=window.IASDTimerDisplay;
if(!TD||typeof tmPayload!=='function')return;
const lsGet=(k,d)=>{try{return localStorage.getItem(k)||d}catch(e){return d}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
function chips(boxId,pairs,getCur,onPick){
 const box=$(boxId);if(!box)return;box.replaceChildren();
 pairs.forEach(([k,label])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.k=k;b.setAttribute('aria-pressed',String(getCur()===k));b.className=getCur()===k?'on':'';b.onclick=()=>{onPick(k);chips(boxId,pairs,getCur,onPick);if(typeof requestStudioHeight==='function')requestStudioHeight()};box.append(b)});
}

/* ---------- Cronômetro: formato e animação ---------- */
let tmLayout=lsGet('iasd-timer-layout','ring'),tmAnim=lsGet('iasd-timer-anim','suave');
if(!TD.layouts[tmLayout])tmLayout='ring';if(!TD.anims[tmAnim])tmAnim='suave';
const _payload=window.tmPayload;
window.tmPayload=function(){const p=_payload.apply(this,arguments);p.layout=tmLayout;p.anim=tmAnim;return p};
const _thMount=window.thMount;
window.thMount=function(){
 const box=$('thPrev');if(!box)return;
 if(typeof thView!=='undefined'&&thView)thView.stop();
 thView=TD.mount(box,{title:'Escola Sabatina',subtitle:'Caldas do Jorro',total:3600,state:'running',remaining:2100,endsAt:Date.now()+2100000,beep:false,theme:tmThemeFx(),layout:tmLayout,anim:tmAnim});
};
let refreshTimer;refreshTimer=function(){try{tmSync()}catch(e){}try{thMount()}catch(e){}};
/* prévia ao vivo dentro do Cronômetro + formatos como miniaturas reais (cada uma já animada) */
let tmPrevView=null,thumbs=[];
function tmPrevMount(){
 const box=$('tmPrev');if(!box)return;
 if(tmPrevView)tmPrevView.stop();
 const t=($('tmTitle')&&$('tmTitle').value.trim())||'Escola Sabatina';
 tmPrevView=TD.mount(box,{title:t,subtitle:'Caldas do Jorro',total:3600,state:'running',remaining:2100,endsAt:Date.now()+2100000,beep:false,theme:tmThemeFx(),layout:tmLayout,anim:tmAnim});
}
function paintLayouts(){
 const box=$('tmLayouts');if(!box)return;
 thumbs.forEach(v=>{try{v.stop()}catch(e){}});thumbs=[];box.replaceChildren();box.classList.add('lay-grid');
 Object.entries(TD.layouts).forEach(([k,label])=>{
  const b=document.createElement('button');b.type='button';b.dataset.k=k;b.className='lay-card'+(k===tmLayout?' on':'');b.setAttribute('aria-pressed',String(k===tmLayout));
  const th=document.createElement('span');th.className='lay-th';const sp=document.createElement('span');sp.textContent=label;b.append(th,sp);
  b.onclick=()=>{tmLayout=k;lsSet('iasd-timer-layout',k);refreshTimer();paintLayouts()};
  box.append(b);
  try{thumbs.push(TD.mount(th,{title:'',subtitle:'',total:3600,state:'running',remaining:2100,endsAt:Date.now()+2100000,beep:false,theme:tmThemeFx(),layout:k,anim:'nenhuma'}))}catch(e){}
 });
}
const _refresh=refreshTimer;refreshTimer=function(){_refresh();tmPrevMount()};
const _th2=window.thMount;window.thMount=function(){_th2.apply(this,arguments);try{tmPrevMount();if(thumbs.length)paintLayouts()}catch(e){}};
const tt=$('tmTitle');if(tt)tt.addEventListener('input',()=>{try{tmPrevMount()}catch(e){}});
paintLayouts();tmPrevMount();
chips('tmAnims',Object.entries(TD.anims),()=>tmAnim,k=>{tmAnim=k;lsSet('iasd-timer-anim',k);refreshTimer()});

/* ---------- Sorteador: modelo, animação e comemoração ---------- */
const TPLS=[['cartoes','Cartões'],['bolas','Bolas de bingo'],['neon','Neon'],['led','LED'],['slot','Slot'],['minimal','Minimalista']];
const FXS=[['suspense','Suspense'],['cascata','Dígito a dígito'],['contagem','Contagem (1 → número)']];
const CELS=[['fogos','Fogos'],['confete','Confete'],['brilho','Brilho'],['nenhum','Nenhuma']];
const DS={tpl:lsGet('iasd-draw-tpl','cartoes'),fx:lsGet('iasd-draw-fx','suspense'),cel:lsGet('iasd-draw-cel','fogos')};
if(!TPLS.some(x=>x[0]===DS.tpl))DS.tpl='cartoes';if(!FXS.some(x=>x[0]===DS.fx))DS.fx='suspense';if(!CELS.some(x=>x[0]===DS.cel))DS.cel='fogos';
const _themed=window.stThemed;
window.stThemed=function(c){
 const o=_themed.apply(this,arguments);
 if(typeof o!=='string')return o;
 for(const pre of ['IASD_DRAW_READY:','IASD_DRAW_ANIM:']){if(o.startsWith(pre)){try{const d=JSON.parse(o.slice(pre.length));d.tpl=DS.tpl;d.fx=DS.fx;d.cel=DS.cel;return pre+JSON.stringify(d)}catch(e){}return o}}
 if(o.startsWith('IASD_DRAW:'))return o.split('|').slice(0,2).join('|')+'|'+DS.tpl+'|'+DS.fx+'|'+DS.cel;
 return o;
};
function redraw(){try{stRethemeLive()}catch(e){}}
/* muda o estilo ao vivo: durante o sorteio troca na hora; com número já na tela, redesenha com o novo estilo */
function liveStyle(){
 let on=false;try{on=typeof rolling!=='undefined'&&rolling}catch(e){}
 if(on){const m='IASD_DRAW_STYLE:'+JSON.stringify({tpl:DS.tpl,fx:DS.fx,cel:DS.cel});try{call('project',m)}catch(e){}try{mirrorProjection(m)}catch(e){}}
 else{
  let st='';try{st=localStorage.getItem('iasd-stage')||''}catch(e){}
  let ld=null;try{ld=typeof lastDraw!=='undefined'?lastDraw:null}catch(e){}
  if(st.startsWith('IASD_DRAW_ANIM:')&&ld!==null){try{project('IASD_DRAW:'+ld)}catch(e){}}
  else redraw();
 }
}
chips('drTpl',TPLS,()=>DS.tpl,k=>{DS.tpl=k;lsSet('iasd-draw-tpl',k);liveStyle();drawPreviewStyle()});
chips('drFx',FXS,()=>DS.fx,k=>{DS.fx=k;lsSet('iasd-draw-fx',k);liveStyle()});
chips('drCel',CELS,()=>DS.cel,k=>{DS.cel=k;lsSet('iasd-draw-cel',k);liveStyle()});
/* o visor do painel imita o modelo escolhido */
function drawPreviewStyle(){const o=$('drawNumber');if(!o)return;o.dataset.tpl=DS.tpl}
drawPreviewStyle();

/* ---------- Temas: legenda do estilo ---------- */
const PAT={grid:'grade neon',stars:'estrelas',scan:'terminal',diamonds:'vitral',sun:'sol',frame:'moldura',paper:'papel',bokeh:'brilhos',embers:'brasas',rays:'raios de luz',dust:'poeira dourada',ribbon:'fitas de luz',shine:'brilho',pulse:'respiração de luz',borealis:'aurora boreal',stripes:'listras',candle:'luz de vela',facets:'facetas',waves:'ondas',fireflies:'vaga-lumes',ripple:'ondas de luz',float:'bolhas',sparks:'faíscas',dawn:'sol nascendo',blobs:'manchas de cor',clouds:'nuvens'};
document.querySelectorAll('#stThemes button').forEach(b=>{const t=TD.themes[b.dataset.t];if(!t)return;const bits=[t.pat?PAT[t.pat]:'',t.font?({serif:'serifa',mono:'monoespaçada',rounded:'arredondada',thin:'fina'})[t.font]:'',t.tx?'claro':''].filter(Boolean);if(bits.length)b.title=t.name+' · '+bits.join(' · ')});
try{thMount()}catch(e){}
try{stThemeFxPaint()}catch(e){}
})();
