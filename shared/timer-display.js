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
 pergaminho:{name:'Pergaminho (claro)',bg:'radial-gradient(ellipse at 50% 35%,#fff8e8 0%,#f0e0bd 65%,#dcc797 100%)',c1:'#9a6418',c2:'#c58a2b',glow:'rgba(154,100,24,.22)',tx:'#2a1f0c',trk:'rgba(60,40,10,.12)',tk:'rgba(60,40,10,.3)',sh1:'rgba(255,255,255,.5)',sh2:'rgba(120,80,20,.08)'},
 safira:{name:'Safira Real',bg:'radial-gradient(ellipse at 50% 26%,#1d3f94 0%,#0d1f55 56%,#050b24 100%)',c1:'#7aa2ff',c2:'#dbe6ff',glow:'rgba(122,162,255,.42)'},
 oceano:{name:'Oceano Profundo',bg:'linear-gradient(160deg,#0b5a6b 0%,#083a52 50%,#03182b 100%)',c1:'#2dd4d4',c2:'#c8fbff',glow:'rgba(45,212,212,.4)'},
 floresta:{name:'Floresta',bg:'radial-gradient(ellipse at 50% 28%,#1f5a2b 0%,#0d2f17 58%,#041008 100%)',c1:'#86d38a',c2:'#e3f9d8',glow:'rgba(134,211,138,.36)'},
 imperial:{name:'Roxo Imperial',bg:'radial-gradient(ellipse at 50% 26%,#4a1f8a 0%,#22104d 56%,#090320 100%)',c1:'#c4a3ff',c2:'#f1e6ff',glow:'rgba(196,163,255,.42)'},
 rose:{name:'Rosé ao Anoitecer',bg:'linear-gradient(145deg,#6b2a66 0%,#3b1454 52%,#13071f 100%)',c1:'#f59fb8',c2:'#ffe0ea',glow:'rgba(245,159,184,.4)'},
 cobre:{name:'Cobre e Noite',bg:'radial-gradient(ellipse at 50% 30%,#4a2415 0%,#20100a 60%,#090403 100%)',c1:'#e08a4f',c2:'#ffd9b8',glow:'rgba(224,138,79,.4)'},
 amanhecer:{name:'Amanhecer',bg:'linear-gradient(165deg,#2b1650 0%,#7b2f6e 46%,#dd6a52 100%)',c1:'#ffc27a',c2:'#fff0d6',glow:'rgba(255,194,122,.44)'},
 lavanda:{name:'Lavanda (claro)',bg:'radial-gradient(ellipse at 50% 35%,#f6f1ff 0%,#dfd4fb 62%,#c3b3f0 100%)',c1:'#6d4fd1',c2:'#8b6cf0',glow:'rgba(109,79,209,.22)',tx:'#241a4c',trk:'rgba(40,25,90,.12)',tk:'rgba(40,25,90,.3)',sh1:'rgba(255,255,255,.55)',sh2:'rgba(70,40,150,.08)'},
 ceu:{name:'Céu de Manhã (claro)',bg:'radial-gradient(ellipse at 50% 32%,#f2faff 0%,#cfe8fb 62%,#a8d1f2 100%)',c1:'#1d6fb8',c2:'#2f8fd8',glow:'rgba(29,111,184,.22)',tx:'#0e2a47',trk:'rgba(14,42,71,.12)',tk:'rgba(14,42,71,.3)',sh1:'rgba(255,255,255,.55)',sh2:'rgba(20,80,140,.08)'}
};
const DEFAULT_THEME='noturno';
const QR_N=29,QR_PATH='M0 0h7v1h-7zM9 0h3v1h-3zM13 0h2v1h-2zM18 0h1v1h-1zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM11 1h2v1h-2zM20 1h1v1h-1zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM9 2h3v1h-3zM14 2h1v1h-1zM19 2h2v1h-2zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM10 3h2v1h-2zM13 3h1v1h-1zM16 3h5v1h-5zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM10 4h1v1h-1zM12 4h1v1h-1zM14 4h1v1h-1zM16 4h5v1h-5zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h2v1h-2zM14 5h1v1h-1zM16 5h2v1h-2zM20 5h1v1h-1zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM9 7h1v1h-1zM12 7h1v1h-1zM18 7h2v1h-2zM0 8h2v1h-2zM5 8h3v1h-3zM9 8h2v1h-2zM12 8h4v1h-4zM17 8h1v1h-1zM24 8h2v1h-2zM2 9h1v1h-1zM4 9h2v1h-2zM8 9h1v1h-1zM10 9h1v1h-1zM13 9h3v1h-3zM18 9h2v1h-2zM23 9h2v1h-2zM26 9h2v1h-2zM3 10h1v1h-1zM6 10h1v1h-1zM9 10h1v1h-1zM11 10h2v1h-2zM15 10h4v1h-4zM21 10h2v1h-2zM0 11h1v1h-1zM2 11h3v1h-3zM7 11h1v1h-1zM10 11h2v1h-2zM14 11h2v1h-2zM18 11h4v1h-4zM23 11h1v1h-1zM25 11h1v1h-1zM2 12h1v1h-1zM5 12h6v1h-6zM15 12h1v1h-1zM20 12h1v1h-1zM22 12h2v1h-2zM28 12h1v1h-1zM0 13h2v1h-2zM3 13h2v1h-2zM7 13h2v1h-2zM10 13h1v1h-1zM12 13h1v1h-1zM15 13h2v1h-2zM19 13h1v1h-1zM22 13h1v1h-1zM24 13h1v1h-1zM27 13h2v1h-2zM4 14h1v1h-1zM6 14h4v1h-4zM13 14h1v1h-1zM15 14h4v1h-4zM21 14h1v1h-1zM23 14h1v1h-1zM25 14h2v1h-2zM1 15h5v1h-5zM7 15h1v1h-1zM9 15h2v1h-2zM12 15h1v1h-1zM18 15h1v1h-1zM20 15h5v1h-5zM26 15h1v1h-1zM28 15h1v1h-1zM0 16h1v1h-1zM2 16h2v1h-2zM5 16h3v1h-3zM9 16h1v1h-1zM12 16h3v1h-3zM17 16h2v1h-2zM20 16h1v1h-1zM23 16h1v1h-1zM25 16h2v1h-2zM0 17h3v1h-3zM5 17h1v1h-1zM7 17h2v1h-2zM10 17h1v1h-1zM15 17h1v1h-1zM17 17h8v1h-8zM26 17h3v1h-3zM0 18h4v1h-4zM6 18h3v1h-3zM12 18h4v1h-4zM19 18h4v1h-4zM25 18h1v1h-1zM28 18h1v1h-1zM0 19h1v1h-1zM3 19h3v1h-3zM7 19h2v1h-2zM10 19h2v1h-2zM14 19h3v1h-3zM21 19h4v1h-4zM0 20h2v1h-2zM3 20h1v1h-1zM6 20h2v1h-2zM10 20h2v1h-2zM17 20h1v1h-1zM20 20h5v1h-5zM26 20h3v1h-3zM8 21h1v1h-1zM12 21h4v1h-4zM17 21h4v1h-4zM24 21h2v1h-2zM0 22h7v1h-7zM8 22h2v1h-2zM13 22h4v1h-4zM19 22h2v1h-2zM22 22h1v1h-1zM24 22h3v1h-3zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h3v1h-3zM12 23h2v1h-2zM18 23h3v1h-3zM24 23h1v1h-1zM27 23h1v1h-1zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM9 24h5v1h-5zM15 24h2v1h-2zM19 24h7v1h-7zM27 24h1v1h-1zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM10 25h1v1h-1zM15 25h5v1h-5zM21 25h1v1h-1zM23 25h1v1h-1zM25 25h2v1h-2zM28 25h1v1h-1zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM9 26h1v1h-1zM11 26h2v1h-2zM15 26h2v1h-2zM18 26h1v1h-1zM21 26h7v1h-7zM0 27h1v1h-1zM6 27h1v1h-1zM8 27h1v1h-1zM11 27h1v1h-1zM15 27h2v1h-2zM21 27h3v1h-3zM25 27h2v1h-2zM28 27h1v1h-1zM0 28h7v1h-7zM8 28h4v1h-4zM15 28h1v1h-1zM17 28h1v1h-1zM19 28h1v1h-1zM21 28h1v1h-1zM23 28h4v1h-4z';  // QR de https://www.iasdapp.com.br/licao-sabatica

const CSS=`
.iasd-tm{--tx:#fff;--trk:rgba(255,255,255,.09);--tk:rgba(255,255,255,.22);position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;color:var(--tx);font-family:Inter,system-ui,Arial,sans-serif;background:var(--bg);transition:background .8s}
${Object.keys(THEMES).map(k=>{const t=THEMES[k];return`.iasd-tm[data-theme="${k}"]{--bg:${t.bg};--c1:${t.c1};--c2:${t.c2};--glow:${t.glow};${t.tx?`--tx:${t.tx};--trk:${t.trk};--tk:${t.tk};`:''}${t.sh1?`--sh1:${t.sh1};--sh2:${t.sh2};`:''}}`}).join('\n')}
.iasd-tm.warn{--c1:#ffb000;--c2:#ffe14d;--glow:rgba(255,176,0,.65);--tm:#ffe14d;--wash:rgba(255,176,0,.42);--wash0:rgba(255,176,0,.12)}
.iasd-tm.alert,.iasd-tm.done{--c1:#ff2d2d;--c2:#ff7a7a;--glow:rgba(255,45,45,.7);--tm:#ff5a5a;--wash:rgba(255,30,30,.55);--wash0:rgba(255,30,30,.2)}
.iasd-tm[data-theme="pergaminho"].warn{--c1:#d97706;--c2:#f59e0b;--glow:rgba(217,119,6,.35);--tm:#b45309;--wash:rgba(245,158,11,.5);--wash0:rgba(245,158,11,.14)}
.iasd-tm[data-theme="pergaminho"].alert,.iasd-tm[data-theme="pergaminho"].done{--c1:#b91c1c;--c2:#dc2626;--glow:rgba(185,28,28,.35);--tm:#b91c1c;--wash:rgba(220,38,38,.5);--wash0:rgba(220,38,38,.18)}
.iasd-tm .time{fill:var(--tm,var(--tx))!important;transition:fill .6s}
.iasd-tm.warn .st,.iasd-tm.alert .st,.iasd-tm.done .st{fill:var(--tm)}
.iasd-tm:after{content:'';position:absolute;inset:0;opacity:0;transition:opacity .8s;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,var(--wash0,transparent) 30%,var(--wash,transparent) 100%)}
.iasd-tm.warn:after,.iasd-tm.alert:after,.iasd-tm.done:after{opacity:1}
.iasd-tm.idle{--c1:#64748b;--c2:#94a3b8;--glow:rgba(148,163,184,.25)}
.iasd-tm:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 18% 12%,var(--sh1,rgba(255,255,255,.08)),transparent 42%),radial-gradient(circle at 88% 92%,var(--sh2,rgba(255,255,255,.05)),transparent 46%);pointer-events:none}
.iasd-tm{container-type:size}
.iasd-tm svg{width:min(96vh,96vw);height:min(96vh,96vw);width:min(96cqh,96cqw);height:min(96cqh,96cqw);display:block;filter:drop-shadow(0 0 3vmin var(--glow))}
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
.iasd-tm .qr{position:absolute;right:3cqh;bottom:3cqh;width:23cqh;padding:1.4cqh 1.4cqh 1.6cqh;border-radius:2.2cqh;background:linear-gradient(160deg,#fff,#f4ecd6);color:#1b1608;text-align:center;box-shadow:0 1.2cqh 4cqh rgba(0,0,0,.45),0 0 0 .35cqh var(--c1);font-family:inherit;z-index:2;transition:box-shadow .8s}
.iasd-tm .qr svg{width:100%;height:auto;display:block;filter:none;border-radius:1cqh}
.iasd-tm .qr b{display:block;margin-top:1.1cqh;font-size:1.75cqh;letter-spacing:.18em;font-weight:800;text-transform:uppercase;line-height:1.25}
.iasd-tm .qr small{display:block;margin-top:.5cqh;font-size:1.45cqh;font-weight:600;opacity:.7;line-height:1.3}
@media (max-aspect-ratio:1/1){.iasd-tm .qr{width:26cqw;right:3cqw;bottom:3cqw}.iasd-tm .qr b{font-size:2cqw}.iasd-tm .qr small{font-size:1.7cqw}}
@media (prefers-reduced-motion:reduce){.iasd-tm *{animation:none!important}}`;
/* Bip de fim: três toques curtos. Só toca quando o tempo ACABA de zerar com o cronômetro rodando. */
let audioCtx=null;
function beepEnd(){
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  const x=audioCtx;if(x.state==='suspended')x.resume();
  [0,.42,.84].forEach((dl,i)=>{
   const t=x.currentTime+dl,o=x.createOscillator(),g=x.createGain();
   o.type='square';o.frequency.setValueAtTime(i===2?1046:880,t);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.32,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.3);
   o.connect(g);g.connect(x.destination);o.start(t);o.stop(t+.34)})
 }catch(e){}
}
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
  theme:THEMES[d.theme]?d.theme:DEFAULT_THEME,
  qr:d.qr===true,
  beep:d.beep!==false
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
 if(d.qr){const q=document.createElement('div');q.className='qr';
  q.innerHTML='<svg viewBox="-2 -2 '+(QR_N+4)+' '+(QR_N+4)+'" shape-rendering="crispEdges" role="img" aria-label="QR Code da Lição da Escola Sabatina"><rect x="-2" y="-2" width="'+(QR_N+4)+'" height="'+(QR_N+4)+'" fill="#fff"/><path d="'+QR_PATH+'" fill="#0b1029"/></svg><b>Lição da<br>Escola Sabatina</b><small>Aponte a câmera do celular</small>';
  box.appendChild(q)}
 root.appendChild(box);
 let raf=0,stopped=false,lastTxt='',lastCls='',lastTick=-1,prevRem=null,beeped=false;
 function left(now){return d.state==='running'?Math.max(0,(d.endsAt-now)/1000):d.remaining}
 function frame(){
  if(stopped)return;
  const now=Date.now(),rem=left(now),txt=fmt(rem);
  const done=d.state!=='idle'&&rem<=0;
  if(d.beep&&d.state==='running'&&done&&!beeped&&prevRem!==null&&prevRem>0){beeped=true;beepEnd()}
  if(rem>0)beeped=false;prevRem=rem;
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
 return{stop(){stopped=true;cancelAnimationFrame(raf);box.remove()},format:fmt,beep:beepEnd};
}
window.IASDTimerDisplay=Object.freeze({mount,beep:beepEnd,format:fmt,clean,themes:THEMES,defaultTheme:DEFAULT_THEME});
})();
