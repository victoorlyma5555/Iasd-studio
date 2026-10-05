/* Bolinha flutuante da sonoplastia (estilo "assistive touch"): arraste para onde quiser; toque para abrir o painel rápido.
   Atalhos: Tela preta, Fechar telão, fade dos sons (liga/desliga e velocidade), Temas e Alertas. */
(function(){
'use strict';
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const FADE_KEY='iasd-fade',POS_KEY='iasd-bubble-pos';
const fadeCfg=()=>Object.assign({on:true,f:1},LS.get(FADE_KEY,{}));
const fadeDuration=(c,base)=>({0.6:1500,1:3000,1.8:5000}[Number(c.f)||1]??Math.round(base*(c.f||1)));
/* usado pelo site (e lido igual pelo Studio/telão): duração do fade já com a velocidade escolhida */
window.stFadeMs=base=>{const c=fadeCfg();return c.on===false?0:fadeDuration(c,base)};
window.stFadeVisualMs=base=>fadeDuration(fadeCfg(),base);
/* fade de ENTRADA (início de vídeos/músicas): liga/desliga próprio, mesma velocidade */
window.stFadeInMs=base=>{const c=fadeCfg();return c.on===false||c.i===false?0:fadeDuration(c,base)};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fw=()=>{try{const f=document.getElementById('iasd-studio-frame');return f&&f.contentWindow}catch(e){return null}};
let root=null,btn=null,panel=null,badge=null,open=false,view='main',unseen=0,drag=null;
const SIZE=56;

function css(){if(document.getElementById('stb-css'))return;const s=document.createElement('style');s.id='stb-css';s.textContent=`
#stb{position:fixed;left:0;top:0;z-index:9996;touch-action:none;font:600 13px/1.35 "Instrument Sans",Inter,system-ui,sans-serif;color:var(--au-tx,#f4f7ff)}
#stb .bb{position:relative;width:${SIZE}px;height:${SIZE}px;border-radius:50%;border:2px solid rgba(255,255,255,.28);background:var(--au-grad,linear-gradient(135deg,#ffc15e,#ff8a4c));color:var(--au-on,#1a0f05);display:grid;place-items:center;cursor:grab;padding:0;box-shadow:0 10px 26px rgba(0,0,0,.4),0 0 0 6px rgba(var(--au-a1-rgb,255,193,94),.16);transition:transform .15s,box-shadow .15s}
#stb .bb svg{width:24px;height:24px;display:block;pointer-events:none}
#stb .bb:hover{transform:scale(1.06)}#stb.open .bb{box-shadow:0 10px 26px rgba(0,0,0,.4),0 0 0 8px rgba(var(--au-a1-rgb,255,193,94),.28)}
#stb.drag .bb{cursor:grabbing;transform:scale(1.1)}
#stb .bb:focus-visible{outline:2px solid #fff;outline-offset:4px}
#stb .bd{position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:99px;background:#ef4444;color:#fff;font-size:11.5px;font-weight:800;display:none;place-items:center;border:2px solid var(--au-bg,#0b1730)}
#stb .bd.on{display:grid}#stb.ring .bb{animation:stbr .6s ease 2}@keyframes stbr{0%,100%{transform:rotate(0)}25%{transform:rotate(-14deg)}75%{transform:rotate(14deg)}}
#stb .pn{position:absolute;width:min(320px,calc(100vw - 20px));max-height:min(560px,calc(100vh - 24px));overflow:auto;border-radius:22px;padding:14px;background:linear-gradient(160deg,var(--au-card1,#1f1830),var(--au-card2,#151022));border:1px solid rgba(var(--au-w,255,255,255),.2);box-shadow:0 22px 60px rgba(0,0,0,.55);display:none}
#stb.open .pn{display:block}
#stb .ph{display:flex;align-items:center;gap:10px;margin:0 2px 12px}#stb .ph i{width:32px;height:32px;border-radius:11px;display:grid;place-items:center;background:var(--au-grad,#ffc15e);color:var(--au-on,#111)}#stb .ph i svg{width:18px;height:18px}
#stb .ph b{font:800 16px "Bricolage Grotesque",Inter,sans-serif;display:block;line-height:1.1}#stb .ph small{font-size:11.5px;color:var(--au-mu,#a8a2bd);font-weight:500}
#stb .sec{margin:12px 2px 6px;font:500 10.5px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--au-mu,#a8a2bd)}
#stb .tl{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#stb .t{display:flex;flex-direction:column;gap:3px;align-items:flex-start;padding:12px;border-radius:16px;border:1px solid rgba(var(--au-w,255,255,255),.16);background:rgba(var(--au-w,255,255,255),.07);color:inherit;font:inherit;cursor:pointer;text-align:left;position:relative}
#stb .t:hover{background:rgba(var(--au-w,255,255,255),.13)}#stb .t b{font-size:13.5px}#stb .t small{font-size:11.5px;color:var(--au-mu,#a8a2bd);font-weight:500}
#stb .t .ic{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:rgba(var(--au-a1-rgb,255,193,94),.16);color:var(--au-a1,#ffc15e);margin-bottom:4px}#stb .t .ic svg{width:17px;height:17px}
#stb .t.danger .ic{background:rgba(255,110,130,.18);color:#ff8a9c}
#stb .t.wide{grid-column:1/-1}
#stb .row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;border:1px solid rgba(var(--au-w,255,255,255),.14);background:rgba(var(--au-w,255,255,255),.06);margin-bottom:8px}
#stb .row>div{flex:1;min-width:0}#stb .row b{font-size:13.5px;display:block}#stb .row small{font-size:11.5px;color:var(--au-mu,#a8a2bd);font-weight:500}
#stb .sw{all:unset;box-sizing:border-box;flex:none;position:relative;width:42px;height:24px;border-radius:12px;background:rgba(var(--au-w,255,255,255),.22);cursor:pointer;transition:background .15s}
#stb .sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s}
#stb .sw.on{background:var(--au-c1,#35f0b9)}#stb .sw.on::after{left:21px}#stb .sw:focus-visible{outline:2px solid var(--au-a1);outline-offset:2px}
#stb .seg{display:flex;gap:6px;margin:-2px 0 8px;width:100%}#stb .seg button{flex:1;padding:8px 4px;border-radius:12px;border:1px solid rgba(var(--au-w,255,255,255),.2);background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}#stb .seg button.on{background:var(--au-grad,#2f6bff);border-color:transparent;color:var(--au-on,#fff)}
#stb .go{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;border-radius:16px;border:1px solid rgba(var(--au-w,255,255,255),.14);background:rgba(var(--au-w,255,255,255),.06);cursor:pointer;margin-bottom:8px;position:relative}
#stb .go:hover{background:rgba(var(--au-w,255,255,255),.12)}#stb .go .ic{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:rgba(var(--au-a1-rgb,255,193,94),.16);color:var(--au-a1,#ffc15e);flex:none}#stb .go .ic svg{width:17px;height:17px}
#stb .go>div{flex:1}#stb .go b{display:block;font-size:13.5px}#stb .go small{font-size:11.5px;color:var(--au-mu,#a8a2bd);font-weight:500}#stb .go em{font-style:normal;color:var(--au-mu);font-size:18px}
#stb .tn{min-width:19px;height:19px;border-radius:99px;background:#ef4444;color:#fff;font-size:11.5px;font-weight:800;display:none;place-items:center;padding:0 5px}#stb .tn.on{display:grid}
#stb .hd{display:flex;align-items:center;gap:8px;margin-bottom:10px}#stb .hd button{border:0;background:rgba(var(--au-w,255,255,255),.12);color:inherit;border-radius:12px;padding:7px 12px;font:inherit;cursor:pointer}#stb .hd b{font-size:14px}
#stb .th{display:grid;grid-template-columns:1fr 1fr;gap:7px}#stb .th button{padding:10px;border-radius:14px;border:1px solid rgba(var(--au-w,255,255,255),.2);background:rgba(var(--au-w,255,255,255),.06);color:inherit;font:inherit;font-size:12.5px;cursor:pointer;text-align:left}#stb .th button.on{border-color:var(--au-a1,#f5b73a);background:rgba(var(--au-a1-rgb,245,183,58),.16)}
#stb.wide .pn{width:min(360px,calc(100vw - 20px))}
#stb .nt{margin:8px 2px 0;font-size:11.5px;color:var(--au-mu,#a8a2bd);font-weight:500}
#stb .al .sound-alert-item{background:rgba(255,255,255,.05);color:#f4f7ff}#stb .al button,#stb .al input{font:inherit}#stb .al input{background:rgba(0,0,0,.3);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:9px;padding:8px}#stb .al button{border-radius:9px;border:1px solid rgba(140,172,255,.35);background:rgba(255,255,255,.08);color:#fff;padding:7px 9px;cursor:pointer}
/*alerts*/
#stb .al .ai{padding:10px;border-radius:12px;border:1px solid rgba(140,172,255,.25);background:rgba(255,255,255,.05);margin-bottom:8px}
#stb .ai .ah{display:flex;justify-content:space-between;gap:8px;align-items:baseline}#stb .ai .ah span,#stb .ai .as{font-size:11.5px;opacity:.7;font-weight:500}
#stb .ai .am{margin-top:4px;font-size:13.5px;line-height:1.4;overflow-wrap:anywhere;white-space:pre-wrap}
#stb .ai .ar{margin-top:7px;padding:7px 9px;border-radius:9px;background:rgba(34,197,94,.14);border:1px solid rgba(34,197,94,.4);font-size:13px}#stb .ai .ar span{font-size:11px;opacity:.7;font-weight:500}#stb .ai .ar div{margin-top:2px;overflow-wrap:anywhere}
#stb .ai .aq{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#stb .ai .aq button{flex:1 1 auto;font-size:12px;padding:7px 8px}
#stb .ai .af{display:flex;gap:6px;margin-top:6px}#stb .ai .af input{flex:1;min-width:0;font-size:13px}#stb .ai .af button{flex:none}
@media (prefers-reduced-motion:reduce){#stb .bb,#stb.ring .bb{animation:none;transition:none}}`;document.head.append(s)}

function pos(){const p=LS.get(POS_KEY,null),w=innerWidth,h=innerHeight;let x,y;if(p&&typeof p.x==='number'){x=p.x*(w-SIZE);y=p.y*(h-SIZE)}else{x=w-SIZE-14;y=h-SIZE-230}return clamp(x,y)}
function clamp(x,y){const w=innerWidth,h=innerHeight,keep=24;return {x:Math.min(w-keep,Math.max(keep-SIZE,x)),y:Math.min(h-keep,Math.max(0,y))}}
function place(x,y){root.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)';placePanel(x,y)}
function placePanel(x,y){if(!panel)return;const w=innerWidth,h=innerHeight,pw=Math.min(view==='alerts'?360:300,w-20);
 const below=y<h/2;panel.style.top=below?(SIZE+8)+'px':'auto';panel.style.bottom=below?'auto':(SIZE+8)+'px';
 let left=0;if(x+pw>w-10)left=(w-10)-(x+pw);if(x+left<10)left=10-x;panel.style.left=Math.round(left)+'px';
 panel.style.maxHeight=Math.max(220,(below?h-y-SIZE-20:y-20))+'px'}
function save(x,y){LS.set(POS_KEY,{x:Math.max(0,Math.min(1,(x)/(innerWidth-SIZE||1))),y:Math.max(0,Math.min(1,y/(innerHeight-SIZE||1)))})}

function mainView(){const c=fadeCfg(),hasW=!!fw();const IC={mon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',vol:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/></svg>',vol2:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/></svg>',pal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/><path d="M12 21a2.5 2.5 0 010-5h2a2 2 0 000-4"/></svg>',bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0"/></svg>',head:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>'};
 const fOn=c.on!==false,iOn=c.on!==false&&c.i!==false;
 return `<div class="ph"><i>${IC.head}</i><div><b>Atalhos da sonoplastia</b><small>Controle rápido do telão e do som</small></div></div>
 <div class="sec">Telão</div>
 <div class="tl"><button class="t" data-a="black"><span class="ic">${IC.mon}</span><b>Tela preta</b><small>Cobre o telão</small></button>
 <button class="t danger" data-a="close"><span class="ic">${IC.x}</span><b>Fechar telão</b><small>Com fade no som</small></button></div>
 <div class="sec">Som</div>
 <div class="row"><div><b>Fade ao fechar/pausar</b><small>Sem corte seco no som</small></div><button class="sw${fOn?' on':''}" data-a="fade" role="switch" aria-checked="${fOn}" aria-label="Fade dos sons"></button></div>
 <div class="seg">${[['Curto',.6],['Médio',1],['Longo',1.8]].map(([n,f])=>`<button data-a="speed" data-f="${f}" class="${(c.f||1)===f?'on':''}">${n}</button>`).join('')}</div>
 <div class="row"><div><b>Fade de entrada</b><small>Som sobe devagar ao iniciar</small></div><button class="sw${iOn?' on':''}" data-a="fadein" role="switch" aria-checked="${iOn}" aria-label="Fade de entrada"></button></div>
 <div class="sec">Mais</div>
 <button class="go" data-a="themes"><span class="ic">${IC.pal}</span><div><b>Temas do telão</b><small>Fundo e animações</small></div><em>›</em></button>
 <button class="go" data-a="alerts"><span class="ic">${IC.bell}</span><div><b>Alertas</b><small>Ler e responder</small></div><span class="tn${unseen?' on':''}">${unseen}</span><em>›</em></button>
 ${hasW?'':'<p class="nt">Abra o IASD Projetor uma vez para liberar Tela preta, Fechar telão e Temas.</p>'}`}
function themesView(){const w=fw();let items=[];try{items=[...w.document.querySelectorAll('#stThemes button')].map(b=>({t:b.dataset.t,n:(b.querySelector('b,strong')?.textContent||b.textContent||'').trim().split('\n')[0].slice(0,26),on:b.classList.contains('on')}))}catch(e){}
 let fx=true;try{fx=w.stThemeFxOn?w.stThemeFxOn():true}catch(e){}
 return `<div class="hd"><button data-a="back">← Voltar</button><b>Temas do telão</b></div><div class="t wide${fx?' on':''}" style="cursor:default;margin-bottom:8px"><div style="display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px"><div><span class="ic">✨</span> <b>Animações</b><br><small>Fundos animados dos temas</small></div><button class="tg" data-a="themefx" style="border:0;border-radius:99px;padding:8px 13px;cursor:pointer;font:inherit;font-weight:800;background:${fx?'#22c55e':'#475569'};color:#fff">${fx?'LIGADAS':'DESLIGADAS'}</button></div></div>`+(items.length?`<div class="th">${items.map(i=>`<button data-a="theme" data-t="${E(i.t)}" class="${i.on?'on':''}">${E(i.n||i.t)}</button>`).join('')}</div>`:'<p class="nt">Abra o IASD Projetor uma vez para listar os temas.</p>')}
function alertItem(x,sound){
 const ago=(typeof soundAgo==='function')?soundAgo(x.created_at):'';
 const sched=(typeof alertScheduleOf==='function')?alertScheduleOf(x):'';
 const tgt=(typeof alertTargetOf==='function')?alertTargetOf(x):null;
 const quick=(window.SOUND_QUICK_REPLIES||[]);
 const reply=x.reply_message?`<div class="ar"><b>↩ ${E(x.replied_by_name||'Sonoplastia')}</b> <span>${E(typeof soundAgo==='function'?soundAgo(x.replied_at):'')}</span><div>${E(x.reply_message)}</div></div>`:(sound?'':'<div class="nt">Aguardando resposta…</div>');
 const form=sound&&!x.reply_message?`<div class="aq">${quick.map((t,i)=>`<button type="button" data-alert-reply="${E(x.id)}" data-quick="${i}">${E(t)}</button>`).join('')}</div><div class="af"><input type="text" maxlength="300" placeholder="Escrever resposta…" data-alert-input="${E(x.id)}"><button type="button" data-alert-reply="${E(x.id)}" data-send="1">Enviar</button></div>`:'';
 return `<div class="ai"><div class="ah"><b>${E(x.sender_name||'Equipe')}</b><span>${E(ago)}</span></div>${(sched||tgt)?`<div class="as">${E(sched)}${sched&&tgt?' · ':''}${tgt?'para '+E(tgt.name):''}</div>`:''}<div class="am">${E(x.message)}</div>${reply}${form}</div>`}
async function alertsView(){panel.innerHTML=`<div class="hd"><button data-a="back">← Voltar</button><b>Alertas</b></div><div class="al" id="stb-al"><p class="nt">Carregando…</p></div><div class="tl" style="margin-top:8px"><button class="t wide" data-a="sendalert"><span class="ic">✉</span><b>Enviar um alerta</b><small>Abre a página de Alertas</small></button></div>`;
 try{const rows=await window.loadSoundAlertRows();const sound=!!(window.canUseSound&&canUseSound());const box=document.getElementById('stb-al');if(!box||view!=='alerts')return;
  box.innerHTML=rows.length?rows.slice(0,5).map(x=>alertItem(x,sound)).join(''):'<p class="nt">Nenhum alerta ainda.</p>'}catch(e){const box=document.getElementById('stb-al');if(box)box.innerHTML='<p class="nt">Não foi possível carregar os alertas.</p>'}}
function render(){if(!panel)return;root.classList.toggle('wide',view==='alerts');if(view==='main')panel.innerHTML=mainView();else if(view==='themes')panel.innerHTML=themesView();else if(view==='alerts')void alertsView();
 const x=root.getBoundingClientRect();placePanel(x.left,x.top)}
function setBadge(){if(!badge)return;badge.textContent=unseen>9?'9+':String(unseen);badge.classList.toggle('on',unseen>0)}
function toggle(v){open=typeof v==='boolean'?v:!open;root.classList.toggle('open',open);if(open){view='main';render()}}

function act(e){const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,w=fw();
 if(a==='black'){try{w.blackScreen()}catch(x){}toggle(false)}
 else if(a==='close'){try{w.closeScreenNow()}catch(x){}toggle(false)}
 else if(a==='fade'){const c=fadeCfg();c.on=!(c.on!==false);LS.set(FADE_KEY,c);render()}
 else if(a==='themefx'){try{const w=fw();w.stSetThemeFx(!w.stThemeFxOn())}catch(x){}setTimeout(render,80)}
 else if(a==='fadein'){const c=fadeCfg();c.i=(c.i===false);if(c.i)c.on=true;LS.set(FADE_KEY,c);render()}
 else if(a==='speed'){const c=fadeCfg();c.f=+b.dataset.f;c.on=true;LS.set(FADE_KEY,c);render()}
 else if(a==='themes'){view='themes';render()}
 else if(a==='theme'){try{const t=b.dataset.t;[...w.document.querySelectorAll('#stThemes button')].find(x=>x.dataset.t===t)?.click()}catch(x){}setTimeout(render,120)}
 else if(a==='alerts'){view='alerts';unseen=0;setBadge();render()}
 else if(a==='back'){view='main';render()}
 else if(a==='sendalert'){toggle(false);try{go('Alertas')}catch(x){}}}

function down(e){if(e.button!==undefined&&e.button!==0)return;const r=root.getBoundingClientRect();drag={sx:e.clientX,sy:e.clientY,ox:r.left,oy:r.top,moved:false,id:e.pointerId};try{btn.setPointerCapture(e.pointerId)}catch(x){}}
function move(e){if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;if(!drag.moved&&Math.hypot(dx,dy)<6)return;if(!drag.moved){drag.moved=true;root.classList.add('drag');if(open)toggle(false)}
 const p=clamp(drag.ox+dx,drag.oy+dy);place(p.x,p.y);drag.last=p}
function up(e){if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;root.classList.remove('drag');try{btn.releasePointerCapture(e.pointerId)}catch(x){}
 if(d.moved&&d.last){save(d.last.x,d.last.y)}else toggle()}

function build(){if(root)return;css();root=document.createElement('div');root.id='stb';root.setAttribute('aria-label','Atalhos da sonoplastia');
 root.innerHTML='<button class="bb" type="button" aria-label="Atalhos da sonoplastia" title="Atalhos da sonoplastia (arraste para mover)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg><span class="bd"></span></button><div class="pn" role="dialog" aria-label="Painel rápido"></div>';
 btn=root.querySelector('.bb');badge=root.querySelector('.bd');panel=root.querySelector('.pn');document.body.append(root);
 btn.addEventListener('pointerdown',down);btn.addEventListener('pointermove',move);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);
 btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}else if(e.key==='Escape')toggle(false)});
 panel.addEventListener('click',act);
 document.addEventListener('pointerdown',e=>{if(open&&!root.contains(e.target))toggle(false)},true);
 addEventListener('resize',()=>{const p=pos();place(p.x,p.y)});
 addEventListener('blur',()=>{if(open&&!drag)setTimeout(()=>{if(open&&document.activeElement&&document.activeElement.tagName==='IFRAME')toggle(false)},0)});
 document.addEventListener('touchstart',e=>{if(open&&!root.contains(e.target))toggle(false)},{capture:true,passive:true});
 const p=pos();place(p.x,p.y);setBadge()}
function destroy(){if(!root)return;root.remove();root=btn=panel=badge=null;open=false}
function sync(){const ok=!(window.isMobileDevice&&isMobileDevice())&&typeof canUseSound==='function'&&typeof cloudUser!=='undefined'&&!!cloudUser&&canUseSound()&&typeof current!=='undefined'&&current==='Projeção';if(ok)build();else destroy()}

/* avisos: alerta novo (para mim) ou resposta chegando */
addEventListener('iasd-alert-new',e=>{try{const d=e.detail||{};const t=window.alertTargetOf&&alertTargetOf(d);if(t&&typeof cloudUser!=='undefined'&&cloudUser&&t.uid!==cloudUser.id)return}catch(x){}
 if(!root)return;if(open&&view==='alerts'){render();return}unseen++;setBadge();root.classList.add('ring');setTimeout(()=>root&&root.classList.remove('ring'),1400)});
addEventListener('iasd-alert-changed',()=>{if(root&&open&&view==='alerts')render()});
setInterval(()=>{sync();if(root&&open&&view==='themes')render()},1500);
})();
