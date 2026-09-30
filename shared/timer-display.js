/* Cronômetro projetável do IASD APP.
   Uso: IASDTimerDisplay.mount(elemento, dados) -> { stop() }
   dados: { title, subtitle, total (s), state: 'idle'|'running'|'paused', remaining (s), endsAt (ms epoch), warn (s), alert (s) }
   A tela calcula o tempo sozinha a partir de endsAt: o Studio só envia quando algo muda. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const THEMES={
 noturno:{name:'Noturno Dourado',bg:'radial-gradient(ellipse at 50% 28%,#1d2760 0%,#0b1029 58%,#04060f 100%)',c1:'#c9a24a',c2:'#f5e3a6',glow:'rgba(214,170,80,.4)'},
 esmeralda:{name:'Esmeralda',bg:'radial-gradient(ellipse at 50% 28%,#124b40 0%,#072a24 58%,#02100d 100%)',c1:'#34d399',c2:'#b7f5db',glow:'rgba(52,211,153,.4)'},
 ouro:{name:'Ouro Real',bg:'radial-gradient(ellipse at 50% 30%,#35290f 0%,#14100a 60%,#060503 100%)',c1:'#d4a73d',c2:'#fde9a2',glow:'rgba(212,167,61,.42)'},
 vinho:{name:'Vinho',bg:'radial-gradient(ellipse at 50% 28%,#5a1630 0%,#2a0a18 58%,#0c0308 100%)',c1:'#e9a08f',c2:'#fde2d9',glow:'rgba(233,160,143,.38)'},
 aurora:{name:'Aurora',bg:'linear-gradient(135deg,#0c2f52 0%,#3a1f63 52%,#0a1a33 100%)',c1:'#5cc8f5',c2:'#d6c8ff',glow:'rgba(120,170,255,.42)'},
 grafite:{name:'Grafite',bg:'radial-gradient(ellipse at 50% 28%,#2c313c 0%,#14171d 60%,#07080b 100%)',c1:'#94a3b8',c2:'#e8edf4',glow:'rgba(148,163,184,.3)'},
 pergaminho:{name:'Pergaminho (claro)',bg:'radial-gradient(ellipse at 50% 35%,#fff8e8 0%,#f0e0bd 65%,#dcc797 100%)',c1:'#9a6418',c2:'#c58a2b',glow:'rgba(154,100,24,.22)',tx:'#2a1f0c',trk:'rgba(60,40,10,.12)',tk:'rgba(60,40,10,.3)',sh1:'rgba(255,255,255,.5)',sh2:'rgba(120,80,20,.08)'}
};
const DEFAULT_THEME='noturno';
const CSS=`
.iasd-tm{--tx:#fff;--trk:rgba(255,255,255,.09);--tk:rgba(255,255,255,.22);position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;color:var(--tx);font-family:Inter,system-ui,Arial,sans-serif;background:var(--bg);transition:background .8s}
${Object.keys(THEMES).map(k=>{const t=THEMES[k];return`.iasd-tm[data-theme="${k}"]{--bg:${t.bg};--c1:${t.c1};--c2:${t.c2};--glow:${t.glow};${t.tx?`--tx:${t.tx};--trk:${t.trk};--tk:${t.tk};`:''}${t.sh1?`--sh1:${t.sh1};--sh2:${t.sh2};`:''}}`}).join('\n')}
.iasd-tm.warn{--c1:#f59e0b;--c2:#fbbf24;--glow:rgba(245,158,11,.5)}
.iasd-tm.alert,.iasd-tm.done{--c1:#ef4444;--c2:#f87171;--glow:rgba(239,68,68,.55)}
.iasd-tm:after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(239,68,68,.0) 100%);opacity:0;transition:opacity .8s,background .8s;pointer-events:none}.iasd-tm.warn:after{background:radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(245,158,11,.22) 100%);opacity:1}.iasd-tm.alert:after,.iasd-tm.done:after{background:radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(239,68,68,.32) 100%);opacity:1}
.iasd-tm.idle{--c1:#64748b;--c2:#94a3b8;--glow:rgba(148,163,184,.25)}
.iasd-tm:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 18% 12%,var(--sh1,rgba(255,255,255,.08)),transparent 42%),radial-gradient(circle at 88% 92%,var(--sh2,rgba(255,255,255,.05)),transparent 46%);pointer-events:none}
.iasd-tm svg{width:min(96vh,96vw);height:min(96vh,96vw);display:block;filter:drop-shadow(0 0 3vmin var(--glow))}
.iasd-tm .trk{fill:none;stroke:var(--trk);stroke-width:26}
.iasd-tm .arc{fill:none;stroke:url(#iasd-tm-g);stroke-width:26;stroke-linecap:round}
.iasd-tm .dot{fill:var(--tx);filter:drop-shadow(0 0 14px var(--c2))}
.iasd-tm .tk{stroke:var(--tk);stroke-width:4;stroke-linecap:round}
.iasd-tm .tk.m{stroke-width:7}.iasd-tm .tk.on{stroke:var(--c2)}
.iasd-tm .time{font-weight:800;fill:var(--tx);text-anchor:middle;font-variant-numeric:tabular-nums;letter-spacing:-4px;font-feature-settings:'tnum'}
.iasd-tm .ttl{font-weight:800;fill:var(--tx);text-anchor:middle;letter-spacing:5px;text-transform:uppercase}
.iasd-tm .sub{font-weight:600;fill:var(--c2);text-anchor:middle;letter-spacing:4px;text-transform:uppercase}
.iasd-tm .st{font-weight:800;fill:var(--c2);text-anchor:middle;letter-spacing:6px;text-transform:uppercase}
.iasd-tm .ico{fill:none;stroke:var(--tx);stroke-width:9;stroke-linecap:round;stroke-linejoin:round;opacity:.92}
.iasd-tm.paused .time,.iasd-tm.paused .st{animation:iasdTmBlink 1.4s ease-in-out infinite}
.iasd-tm.done .time,.iasd-tm.done .st{animation:iasdTmPulse .9s ease-in-out infinite}
.iasd-tm.done .arc{animation:iasdTmPulse .9s ease-in-out infinite}
.iasd-tm.alert .time{animation:iasdTmTick 1s ease-in-out infinite;transform-origin:500px 500px}
@keyframes iasdTmBlink{50%{opacity:.35}}
@keyframes iasdTmPulse{50%{opacity:.25}}
@keyframes iasdTmTick{50%{transform:scale(1.025)}}
@media (prefers-reduced-motion:reduce){.iasd-tm *{animation:none!important}}`;
function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);if(parent)parent.appendChild(n);return n}
function num(v,min,max,def){v=Number(v);return Number.isFinite(v)?Math.min(max,Math.max(min,v)):def}
function clean(d){
 d=d&&typeof d==='object'?d:{};
 const total=Math.round(num(d.total,1,86400,3600));
 return{
  title:String(d.title||'Escola Sabatina').slice(0,40),
  subtitle:String(d.subtitle||'').slice(0,60),
  total,
  state:['idle','running','paused'].includes(d.state)?d.state:'idle',
  remaining:num(d.remaining,0,total,total),
  endsAt:num(d.endsAt,0,4e12,0),
  warn:Math.round(num(d.warn,0,86400,300)),
  alert:Math.round(num(d.alert,0,86400,60)),
  theme:THEMES[d.theme]?d.theme:DEFAULT_THEME
 };
}
function fmt(s){
 s=Math.max(0,Math.ceil(s));
 const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60,p=n=>String(n).padStart(2,'0');
 return h?`${h}:${p(m)}:${p(r)}`:`${p(m)}:${p(r)}`;
}
function mount(root,raw){
 const d=clean(raw);
 if(!document.getElementById('iasd-tm-css')){const st=document.createElement('style');st.id='iasd-tm-css';st.textContent=CSS;document.head.appendChild(st)}
 const box=document.createElement('div');box.className='iasd-tm idle';box.dataset.theme=d.theme;
 const svg=el('svg',{viewBox:'0 0 1000 1000',role:'img','aria-label':'Cronômetro'},null);box.appendChild(svg);
 const defs=el('defs',{},svg),g=el('linearGradient',{id:'iasd-tm-g',x1:'0',y1:'0',x2:'1',y2:'1'},defs);
 el('stop',{offset:'0','stop-color':'var(--c2)'},g);el('stop',{offset:'1','stop-color':'var(--c1)'},g);
 const R=430,C=2*Math.PI*R;
 el('circle',{class:'trk',cx:500,cy:500,r:R},svg);
 const ticks=[];
 for(let i=0;i<60;i++){const a=i/60*2*Math.PI-Math.PI/2,r1=R-46,r2=R-(i%5?64:84);
  ticks.push(el('line',{class:'tk'+(i%5?'':' m'),x1:500+Math.cos(a)*r1,y1:500+Math.sin(a)*r1,x2:500+Math.cos(a)*r2,y2:500+Math.sin(a)*r2},svg))}
 const arc=el('circle',{class:'arc',cx:500,cy:500,r:R,transform:'rotate(-90 500 500)','stroke-dasharray':C,'stroke-dashoffset':0},svg);
 const dot=el('circle',{class:'dot',r:15,cx:500,cy:500-R},svg);
 // ícone de livro aberto (desenho próprio)
 const ico=el('g',{class:'ico',transform:'translate(500 262)'},svg);
 el('path',{d:'M0-28C-22-42-58-44-82-34V34C-58 24-22 26 0 40C22 26 58 24 82 34V-34C58-44 22-42 0-28ZM0-28V40'},ico);
 const time=el('text',{class:'time',x:500,y:575,'font-size':205},svg);
 const ttl=el('text',{class:'ttl',x:500,y:672,'font-size':46},svg);
 const sub=el('text',{class:'sub',x:500,y:722,'font-size':28},svg);
 const st=el('text',{class:'st',x:500,y:772,'font-size':28},svg);
 ttl.textContent=d.title;sub.textContent=d.subtitle;
 root.appendChild(box);
 let raf=0,stopped=false,lastTxt='',lastCls='',lastTick=-1;
 function left(now){return d.state==='running'?Math.max(0,(d.endsAt-now)/1000):d.remaining}
 function frame(){
  if(stopped)return;
  const now=Date.now(),rem=left(now),txt=fmt(rem);
  const done=d.state!=='idle'&&rem<=0;
  let cls=d.state==='idle'?'idle':done?'done':rem<=d.alert&&d.alert>0?'alert':rem<=d.warn&&d.warn>0?'warn':'';
  if(d.state==='paused'&&!done)cls=(rem<=d.alert&&d.alert>0?'alert':rem<=d.warn&&d.warn>0?'warn':'')+' paused';
  if(cls!==lastCls){box.className='iasd-tm '+cls;lastCls=cls}
  if(txt!==lastTxt){time.textContent=done?'00:00':txt;lastTxt=txt;
   time.setAttribute('font-size',txt.length>5?'150':'205')}
  const frac=Math.max(0,Math.min(1,rem/d.total));
  arc.setAttribute('stroke-dashoffset',String(C*(1-frac)));
  const ang=frac*2*Math.PI-Math.PI/2;
  dot.setAttribute('cx',500+Math.cos(ang)*R);dot.setAttribute('cy',500+Math.sin(ang)*R);
  dot.style.display=frac<=0?'none':'';
  const on=Math.ceil(frac*60);
  if(on!==lastTick){ticks.forEach((t,i)=>t.classList.toggle('on',i<on));lastTick=on}
  st.textContent=d.state==='idle'?'Pronto':done?'Tempo encerrado':d.state==='paused'?'Pausado':cls.indexOf('alert')>=0?'Últimos instantes':cls.indexOf('warn')>=0?'Tempo final':'';
  raf=requestAnimationFrame(frame);
 }
 frame();
 return{stop(){stopped=true;cancelAnimationFrame(raf);box.remove()},format:fmt};
}
window.IASDTimerDisplay=Object.freeze({mount,format:fmt,clean,themes:THEMES,defaultTheme:DEFAULT_THEME});
})();
