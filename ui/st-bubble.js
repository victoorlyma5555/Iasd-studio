/* Bolinha flutuante da sonoplastia (estilo "assistive touch"): arraste para onde quiser; toque para abrir o painel rápido.
   Atalhos: Tela preta, Fechar telão, fade dos sons (liga/desliga e velocidade), Temas e Alertas. */
(function(){
'use strict';
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const FADE_KEY='iasd-fade',POS_KEY='iasd-bubble-pos';
const fadeCfg=()=>Object.assign({on:true,f:1},LS.get(FADE_KEY,{}));
/* usado pelo site (e lido igual pelo Studio/telão): duração do fade já com a velocidade escolhida */
window.stFadeMs=base=>{const c=fadeCfg();return c.on===false?0:Math.round(base*(c.f||1))};
/* fade de ENTRADA (início de vídeos/músicas): liga/desliga próprio, mesma velocidade */
window.stFadeInMs=base=>{const c=fadeCfg();return c.on===false||c.i===false?0:Math.round(base*(c.f||1))};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fw=()=>{try{const f=document.getElementById('iasd-studio-frame');return f&&f.contentWindow}catch(e){return null}};
let root=null,btn=null,panel=null,badge=null,open=false,view='main',unseen=0,drag=null;
const SIZE=56;

function css(){if(document.getElementById('stb-css'))return;const s=document.createElement('style');s.id='stb-css';s.textContent=`
#stb{position:fixed;left:0;top:0;z-index:9996;touch-action:none;font:600 13px/1.35 Inter,system-ui,sans-serif;color:#f4f7ff}
#stb .bb{position:relative;width:${SIZE}px;height:${SIZE}px;border-radius:50%;border:1px solid rgba(160,190,255,.55);background:radial-gradient(circle at 35% 30%,#3d6fe0,#16336e 70%);box-shadow:0 8px 24px rgba(0,0,0,.5),inset 0 0 0 5px rgba(255,255,255,.07);cursor:grab;display:grid;place-items:center;opacity:.88;transition:opacity .2s,transform .2s;padding:0}
#stb .bb:hover,#stb.open .bb{opacity:1}#stb.drag .bb{cursor:grabbing;transform:scale(1.07);opacity:1}
#stb .bb i{width:24px;height:24px;border-radius:50%;border:3px solid rgba(255,255,255,.92);box-shadow:0 0 0 5px rgba(255,255,255,.18);display:block}
#stb .bd{position:absolute;right:-3px;top:-3px;min-width:20px;height:20px;padding:0 5px;border-radius:99px;background:#ef4444;color:#fff;font-size:12px;font-weight:800;display:none;place-items:center;border:2px solid #0b1730}
#stb .bd.on{display:grid}#stb.ring .bb{animation:stbr .6s ease 2}@keyframes stbr{0%,100%{transform:rotate(0)}25%{transform:rotate(-14deg)}75%{transform:rotate(14deg)}}
#stb .pn{position:absolute;width:min(300px,calc(100vw - 20px));max-height:min(520px,calc(100vh - 24px));overflow:auto;border-radius:18px;padding:12px;background:rgba(10,22,48,.97);border:1px solid rgba(140,172,255,.4);box-shadow:0 16px 44px rgba(0,0,0,.55);display:none}
#stb.open .pn{display:block}
#stb .tl{display:grid;grid-template-columns:1fr 1fr;gap:8px}#stb .t{display:flex;flex-direction:column;gap:3px;align-items:flex-start;padding:12px;border-radius:14px;border:1px solid rgba(140,172,255,.28);background:rgba(255,255,255,.06);color:inherit;font:inherit;cursor:pointer;text-align:left;position:relative}
#stb .t:hover{background:rgba(255,255,255,.12)}#stb .t b{font-size:13.5px}#stb .t small{font-size:11.5px;opacity:.72;font-weight:500}#stb .t .ic{font-size:20px;line-height:1}
#stb .t.wide{grid-column:1/-1}#stb .t.on{border-color:#7ee0a0;background:rgba(126,224,160,.12)}#stb .t.danger{border-color:rgba(255,120,120,.45)}
#stb .tn{position:absolute;right:8px;top:8px;min-width:19px;height:19px;border-radius:99px;background:#ef4444;color:#fff;font-size:11.5px;font-weight:800;display:none;place-items:center;padding:0 5px}#stb .tn.on{display:grid}
#stb .seg{display:flex;gap:6px;margin-top:6px;width:100%}#stb .seg button{flex:1;padding:7px 4px;border-radius:9px;border:1px solid rgba(140,172,255,.3);background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}#stb .seg button.on{background:#2f6bff;border-color:#2f6bff}
#stb .hd{display:flex;align-items:center;gap:8px;margin-bottom:10px}#stb .hd button{border:0;background:rgba(255,255,255,.1);color:inherit;border-radius:9px;padding:6px 10px;font:inherit;cursor:pointer}#stb .hd b{font-size:14px}
#stb .th{display:grid;grid-template-columns:1fr 1fr;gap:7px}#stb .th button{padding:10px;border-radius:12px;border:1px solid rgba(140,172,255,.28);background:rgba(255,255,255,.06);color:inherit;font:inherit;font-size:12.5px;cursor:pointer;text-align:left}#stb .th button.on{border-color:#f5b73a;background:rgba(245,183,58,.14)}
#stb .al .sound-alert-item{background:rgba(255,255,255,.05);color:#f4f7ff}#stb .al button,#stb .al input{font:inherit}#stb .al input{background:rgba(0,0,0,.3);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:9px;padding:8px}#stb .al button{border-radius:9px;border:1px solid rgba(140,172,255,.35);background:rgba(255,255,255,.08);color:#fff;padding:7px 9px;cursor:pointer}
/*alerts*/
#stb .al .ai{padding:10px;border-radius:12px;border:1px solid rgba(140,172,255,.25);background:rgba(255,255,255,.05);margin-bottom:8px}
#stb .ai .ah{display:flex;justify-content:space-between;gap:8px;align-items:baseline}#stb .ai .ah span,#stb .ai .as{font-size:11.5px;opacity:.7;font-weight:500}
#stb .ai .am{margin-top:4px;font-size:13.5px;line-height:1.4;overflow-wrap:anywhere;white-space:pre-wrap}
#stb .ai .ar{margin-top:7px;padding:7px 9px;border-radius:9px;background:rgba(34,197,94,.14);border:1px solid rgba(34,197,94,.4);font-size:13px}#stb .ai .ar span{font-size:11px;opacity:.7;font-weight:500}#stb .ai .ar div{margin-top:2px;overflow-wrap:anywhere}
#stb .ai .aq{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#stb .ai .aq button{flex:1 1 auto;font-size:12px;padding:7px 8px}
#stb .ai .af{display:flex;gap:6px;margin-top:6px}#stb .ai .af input{flex:1;min-width:0;font-size:13px}#stb .ai .af button{flex:none}
#stb.wide .pn{width:min(360px,calc(100vw - 20px))}
#stb .nt{margin:8px 2px 0;font-size:11.5px;opacity:.7;font-weight:500}
@media (prefers-reduced-motion:reduce){#stb .bb,#stb.ring .bb{animation:none;transition:none}}`;document.head.append(s)}

function pos(){const p=LS.get(POS_KEY,null),w=innerWidth,h=innerHeight;let x,y;if(p&&typeof p.x==='number'){x=p.x*(w-SIZE);y=p.y*(h-SIZE)}else{x=w-SIZE-14;y=h-SIZE-230}return clamp(x,y)}
function clamp(x,y){const w=innerWidth,h=innerHeight,keep=24;return {x:Math.min(w-keep,Math.max(keep-SIZE,x)),y:Math.min(h-keep,Math.max(0,y))}}
function place(x,y){root.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)';placePanel(x,y)}
function placePanel(x,y){if(!panel)return;const w=innerWidth,h=innerHeight,pw=Math.min(view==='alerts'?360:300,w-20);
 const below=y<h/2;panel.style.top=below?(SIZE+8)+'px':'auto';panel.style.bottom=below?'auto':(SIZE+8)+'px';
 let left=0;if(x+pw>w-10)left=(w-10)-(x+pw);if(x+left<10)left=10-x;panel.style.left=Math.round(left)+'px';
 panel.style.maxHeight=Math.max(220,(below?h-y-SIZE-20:y-20))+'px'}
function save(x,y){LS.set(POS_KEY,{x:Math.max(0,Math.min(1,(x)/(innerWidth-SIZE||1))),y:Math.max(0,Math.min(1,y/(innerHeight-SIZE||1)))})}

function mainView(){const c=fadeCfg(),hasW=!!fw();
 return `<div class="tl">
 <button class="t" data-a="black"><span class="ic">⬛</span><b>Tela preta</b><small>Cobre o telão</small></button>
 <button class="t danger" data-a="close"><span class="ic">✖</span><b>Fechar telão</b><small>Com fade no som</small></button>
 <div class="t wide${c.on!==false?' on':''}" style="cursor:default"><div style="display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px"><div><span class="ic">🔉</span> <b>Fade dos sons</b><br><small>Sem corte seco ao fechar ou pausar (hinos não mudam)</small></div><button class="tg" data-a="fade" style="border:0;border-radius:99px;padding:8px 13px;cursor:pointer;font:inherit;font-weight:800;background:${c.on!==false?'#22c55e':'#475569'};color:#fff">${c.on!==false?'LIGADO':'DESLIGADO'}</button></div>
  <div class="seg">${[['Curto',.6],['Médio',1],['Longo',1.8]].map(([n,f])=>`<button data-a="speed" data-f="${f}" class="${(c.f||1)===f?'on':''}">${n}</button>`).join('')}</div></div>
 <div class="t wide${c.on!==false&&c.i!==false?' on':''}" style="cursor:default"><div style="display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px"><div><span class="ic">🔊</span> <b>Fade de entrada</b><br><small>Som sobe devagar ao iniciar vídeos e músicas (hinos não)</small></div><button class="tg" data-a="fadein" style="border:0;border-radius:99px;padding:8px 13px;cursor:pointer;font:inherit;font-weight:800;background:${c.on!==false&&c.i!==false?'#22c55e':'#475569'};color:#fff">${c.on!==false&&c.i!==false?'LIGADO':'DESLIGADO'}</button></div></div>
 <button class="t" data-a="themes"><span class="ic">🎨</span><b>Temas</b><small>Fundo do telão</small></button>
 <button class="t" data-a="alerts"><span class="ic">🔔</span><b>Alertas</b><small>Ler e responder</small><span class="tn${unseen?' on':''}">${unseen}</span></button>
 </div>${hasW?'':'<p class="nt">Abra o IASD Projetor uma vez para liberar Tela preta, Fechar telão e Temas.</p>'}`}
function themesView(){const w=fw();let items=[];try{items=[...w.document.querySelectorAll('#stThemes button')].map(b=>({t:b.dataset.t,n:(b.querySelector('b,strong')?.textContent||b.textContent||'').trim().split('\n')[0].slice(0,26),on:b.classList.contains('on')}))}catch(e){}
 return `<div class="hd"><button data-a="back">← Voltar</button><b>Temas do telão</b></div>`+(items.length?`<div class="th">${items.map(i=>`<button data-a="theme" data-t="${E(i.t)}" class="${i.on?'on':''}">${E(i.n||i.t)}</button>`).join('')}</div>`:'<p class="nt">Abra o IASD Projetor uma vez para listar os temas.</p>')}
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
 if(a==='black'){try{w.project('')}catch(x){}toggle(false)}
 else if(a==='close'){try{w.closeScreenNow()}catch(x){}toggle(false)}
 else if(a==='fade'){const c=fadeCfg();c.on=!(c.on!==false);LS.set(FADE_KEY,c);render()}
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
 root.innerHTML='<button class="bb" type="button" aria-label="Atalhos da sonoplastia" title="Atalhos da sonoplastia (arraste para mover)"><i></i><span class="bd"></span></button><div class="pn" role="dialog" aria-label="Painel rápido"></div>';
 btn=root.querySelector('.bb');badge=root.querySelector('.bd');panel=root.querySelector('.pn');document.body.append(root);
 btn.addEventListener('pointerdown',down);btn.addEventListener('pointermove',move);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);
 btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}else if(e.key==='Escape')toggle(false)});
 panel.addEventListener('click',act);
 document.addEventListener('pointerdown',e=>{if(open&&!root.contains(e.target))toggle(false)},true);
 addEventListener('resize',()=>{const p=pos();place(p.x,p.y)});
 const p=pos();place(p.x,p.y);setBadge()}
function destroy(){if(!root)return;root.remove();root=btn=panel=badge=null;open=false}
function sync(){const ok=!(window.isMobileDevice&&isMobileDevice())&&typeof canUseSound==='function'&&typeof cloudUser!=='undefined'&&!!cloudUser&&canUseSound();if(ok)build();else destroy()}

/* avisos: alerta novo (para mim) ou resposta chegando */
addEventListener('iasd-alert-new',e=>{try{const d=e.detail||{};const t=window.alertTargetOf&&alertTargetOf(d);if(t&&typeof cloudUser!=='undefined'&&cloudUser&&t.uid!==cloudUser.id)return}catch(x){}
 if(!root)return;if(open&&view==='alerts'){render();return}unseen++;setBadge();root.classList.add('ring');setTimeout(()=>root&&root.classList.remove('ring'),1400)});
addEventListener('iasd-alert-changed',()=>{if(root&&open&&view==='alerts')render()});
setInterval(()=>{sync();if(root&&open&&view==='themes')render()},1500);
})();
