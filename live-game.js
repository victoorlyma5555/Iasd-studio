/* IASD APP · Jogo Coletivo ao vivo (estilo "sala + celulares + telão").
   - O apresentador cria a sala e projeta a tela; cada pessoa entra pelo celular com o código.
   - 8 modos: Maratona mista e 7 jogos (Quiz, Verdadeiro/Falso, Quem Sou Eu, Versículo Perdido, Linha do Tempo, Quem Disse, Memória Relâmpago).
   - A configuração (modo e nº de rodadas) vai dentro do próprio código da sala (1º e 2º dígitos) e as perguntas saem de uma
     semente = código, então telão e celulares mostram as mesmas perguntas sem precisar de nada novo no servidor. */
(()=>{
'use strict';
const URL='https://gtsaaixuampeaivugxdm.supabase.co',KEY='sb_publishable_0nIK7568ulLb9JN0ctyiug_wHWDV7Qf';
const H={'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Prefer':'return=representation'};
const api=async(path,opt={})=>{const r=await fetch(URL+'/rest/v1/'+path,{...opt,headers:{...H,...(opt.headers||{})}});if(!r.ok)throw Error(await r.text());const t=await r.text();return t?JSON.parse(t):null};
const rpc=(name,body)=>api('rpc/'+name,{method:'POST',body:JSON.stringify(body)});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const speed=()=>Number(window.__LG_SPEED)||1;
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
const A=()=>window.IASDGameAudio||new Proxy({},{get:()=>()=>{}});

/* ---------- bibliotecas (carregadas só quando precisa) ---------- */
let libP=null;
const loadScript=src=>new Promise((ok,no)=>{if(document.querySelector('script[data-g="'+src+'"]'))return ok();const s=document.createElement('script');s.src=src;s.dataset.g=src;s.onload=ok;s.onerror=()=>no(Error('Falha ao carregar '+src));document.head.appendChild(s)});
function libs(){
 if(window.IASDGameEngine&&window.IASDGameAudio)return Promise.resolve();
 if(!libP)libP=(async()=>{for(const f of ['audio','bank-quiz','bank-people','bank-study'])await loadScript('/games/'+f+'.js?v=3');await loadScript('/games/engine.js?v=3')})().catch(e=>{libP=null;throw e});
 return libP;
}

/* ---------- tipos de rodada e modos ---------- */
const TYPES={
 quiz:{n:'Quiz Relâmpago',e:'⚡',c:'#f5b73a',t:20,d:'Escolha a resposta certa o mais rápido que puder'},
 vf:{n:'Verdadeiro ou Falso',e:'⚖️',c:'#38bdf8',t:12,d:'A afirmação está certa ou errada?'},
 who:{n:'Quem Sou Eu?',e:'🎭',c:'#a78bfa',t:24,d:'As pistas aparecem aos poucos: quem acerta cedo ganha mais'},
 verse:{n:'Versículo Perdido',e:'📜',c:'#34d399',t:20,d:'Complete a palavra que sumiu do versículo'},
 tempo:{n:'Linha do Tempo',e:'⏳',c:'#fb7185',t:20,d:'O que veio antes? O que veio depois?'},
 said:{n:'Quem Disse?',e:'💬',c:'#f97316',t:16,d:'Descubra quem falou a frase'},
 flash:{n:'Memória Relâmpago',e:'👁️',c:'#22d3ee',t:18,d:'Olhe com atenção: vai passar rápido!'}
};
const MODES=[
 {id:0,n:'Maratona mista',e:'🎪',d:'Todos os jogos, um atrás do outro',types:Object.keys(TYPES)},
 {id:1,n:'Quiz Relâmpago',e:'⚡',d:'Perguntas de toda a Bíblia',types:['quiz']},
 {id:2,n:'Verdadeiro ou Falso',e:'⚖️',d:'Decisão rápida',types:['vf']},
 {id:3,n:'Quem Sou Eu?',e:'🎭',d:'Pistas que vão aparecendo',types:['who']},
 {id:4,n:'Versículo Perdido',e:'📜',d:'Complete a palavra',types:['verse']},
 {id:5,n:'Linha do Tempo',e:'⏳',d:'Antes e depois',types:['tempo']},
 {id:6,n:'Quem Disse?',e:'💬',d:'Frases famosas',types:['said']},
 {id:7,n:'Memória Relâmpago',e:'👁️',d:'Olho vivo!',types:['flash']}
];
const ROUNDS=[10,15,20,25];
const SHAPES=['▲','◆','●','■'];
const AVATARS=['🦁','🐑','🕊️','🐟','🐫','🌳','⭐','🔥','🌈','⚓','👑','📖','🦅','🍇','⛵','🏔️'];
const EMO=['🕊️','🐑','🐟','🍞','🍇','🌾','🐫','🦁','🌳','⭐','🔥','🌊','🏺','👑','🗝️','📜','🪔','🐍','🌈','🍎','⚓','🔔','🪙','🛡️'];

/* ---------- baralho determinístico (mesmo em todos os aparelhos) ---------- */
const decks={};
function cfgOf(code){code=String(code||'');return{mode:MODES[+code[0]]||MODES[0],total:ROUNDS[+code[1]]||15}}
function flashQ(r,E){
 if(r()<.5){
  const target=E.pick(EMO,r),n=3+Math.floor(r()*6),others=E.sample(EMO.filter(x=>x!==target),5,r);
  const seq=E.shuffle(Array(n).fill(target).concat(Array.from({length:6+Math.floor(r()*4)},()=>E.pick(others,r))),r);
  const wrong=new Set();while(wrong.size<3){const v=Math.max(1,n+Math.round((r()-.5)*6));if(v!==n)wrong.add(v)}
  const opts=E.shuffle([String(n)].concat([...wrong].map(String)),r);
  return{type:'mc',flashKind:'count',seq,target,q:'Quantas vezes apareceu '+target+' ?',opts,ans:opts.indexOf(String(n)),a:String(n),ref:'',showMs:seq.length*420+600};
 }
 const shown=E.sample(EMO,6,r),missing=E.pick(EMO.filter(x=>!shown.includes(x)),r);
 const opts=E.shuffle([missing].concat(E.sample(shown,3,r)),r);
 return{type:'mc',flashKind:'missing',shown,q:'Qual destes NÃO apareceu?',opts,ans:opts.indexOf(missing),a:missing,ref:'',showMs:4600};
}
function build(type,seed){
 const E=window.IASDGameEngine,r=E.rng(seed);let q=null;
 if(type==='quiz')q=E.quiz({n:1,seed,mix:.3})[0];
 else if(type==='vf')q=E.tf({n:1,seed})[0];
 else if(type==='who'){q=E.who({n:1,seed})[0];if(q)q={...q,type:'mc',q:'Quem sou eu?',ans:q.opts.indexOf(q.a)}}
 else if(type==='verse')q=E.GEN.verse(r);
 else if(type==='tempo')q=(r()<.6?E.GEN.before(r):E.GEN.last(r));
 else if(type==='said')q=E.GEN.said(r);
 else if(type==='flash')q=flashQ(r,E);
 if(!q||q.ans<0||!q.opts||q.opts.length<2)return null;
 if(type==='vf')q={...q,q:q.q+'  →  “'+q.claim+'”. Está certo?'};
 return{...q,ltype:type};
}
function deckFor(code){
 if(decks[code])return decks[code];
 const E=window.IASDGameEngine,{mode,total}=cfgOf(code),r=E.rng('deck|'+code);
 const seq=mode.types.length>1?E.shuffle(mode.types,r):mode.types;
 const out=[],seen=new Set();let i=0,guard=0;
 while(out.length<total&&guard++<total*30){
  const type=seq[out.length%seq.length];
  const q=build(type,code+'|'+out.length+'|'+(i++%50));
  if(!q)continue;const key=E.fold(q.q)+'|'+E.fold(q.a);if(seen.has(key)){continue}seen.add(key);out.push(q);i=0}
 return decks[code]=out;
}
const roundSecs=q=>Math.round((TYPES[q.ltype].t)/speed());

/* ---------- estado ---------- */
let S={room:null,player:null,host:false,poll:null,clock:null,auto:null,phase:'',me:null};
let HS={prev:{},streak:{},correct:{},best:{},joined:new Set(),order:[]};
let PS={answered:-1,lastScore:0,sawQ:-1,revealFor:-1};
const code=()=>S.room?.code;
const qi=()=>Number(S.room?.current_question)||0;
const curQ=()=>deckFor(code())[qi()];

/* ---------- nomes com avatar ("🦁 Maria") ---------- */
function splitName(n){const m=/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s+(.+)$/u.exec(String(n||''));return m?{av:m[1],name:m[2]}:{av:'🙂',name:String(n||'')}}
const avatarHTML=(n,cls)=>'<span class="lg2-av '+(cls||'')+'">'+esc(splitName(n).av)+'</span>';

/* ---------- casca da tela ---------- */
function root(){let r=$('lg2');if(!r){r=document.createElement('div');r.id='lg2';r.className='lg2';document.body.appendChild(r);document.documentElement.classList.add('lg2-open');reconnect()}return r}
function screen(html,cls,opts){
 css();const r=root();
 r.innerHTML='<div class="lg2-bg"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="lg2-chrome"><button class="lg2-ic" onclick="IASDLive.close()" aria-label="Fechar">✕</button><span class="lg2-sp"></span>'+(S.host?'<button class="lg2-ic" onclick="IASDLive.fullscreen()" aria-label="Tela cheia" title="Tela cheia">⛶</button>':'')+'<button class="lg2-ic" id="lg2-snd" onclick="IASDLive.sndMenu(this)" aria-label="Som" title="Som">'+(A().state?.().sfx||A().state?.().music?'🔊':'🔇')+'</button></div><div class="lg2-body '+(cls||'')+'" style="'+((opts&&opts.style)||'')+'">'+html+'</div>';
}
function sndMenu(btn){
 $('lg2-menu')?.remove();const st=A().state();const m=document.createElement('div');m.id='lg2-menu';m.className='lg2-menu';
 m.innerHTML='<label><input type="checkbox" id="lg2-m1" '+(st.music?'checked':'')+'> Música</label><label><input type="checkbox" id="lg2-m2" '+(st.sfx?'checked':'')+'> Efeitos</label><label>Volume <input type="range" id="lg2-m3" min="0" max="100" value="'+Math.round(st.vol*100)+'"></label>';
 $('lg2').appendChild(m);
 $('lg2-m1').onchange=e=>{A().setMusic(e.target.checked);btn.textContent=A().state().sfx||A().state().music?'🔊':'🔇'};
 $('lg2-m2').onchange=e=>{A().setSfx(e.target.checked);btn.textContent=A().state().sfx||A().state().music?'🔊':'🔇'};
 $('lg2-m3').oninput=e=>A().vol(e.target.value/100);
 setTimeout(()=>document.addEventListener('click',function h(ev){if(!m.contains(ev.target)&&ev.target!==btn){m.remove();document.removeEventListener('click',h)}}),0);
}
function confetti(ms=5200){
 const c=document.createElement('canvas');c.className='lg2-confetti';document.body.appendChild(c);const x=c.getContext('2d');
 const W=c.width=innerWidth,Hh=c.height=innerHeight,cols=['#f5b73a','#38bdf8','#fb7185','#34d399','#a78bfa','#fff'];
 const ps=Array.from({length:150},()=>({x:Math.random()*W,y:-20-Math.random()*Hh*.6,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,s:5+Math.random()*7,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:cols[Math.floor(Math.random()*cols.length)]}));
 const t0=performance.now();(function f(t){x.clearRect(0,0,W,Hh);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6);x.restore()});if(t-t0<ms&&c.isConnected)requestAnimationFrame(f);else c.remove()})(t0);
}
function floatPts(text,el){if(!el)return;const s=document.createElement('b');s.className='lg2-float';s.textContent=text;el.appendChild(s);setTimeout(()=>s.remove(),1600)}

/* ---------- CSS ---------- */
function css(){
 if($('live-game-css'))return;const s=document.createElement('style');s.id='live-game-css';s.textContent=`
html.lg2-open{overflow:hidden}
.lg2{position:fixed;inset:0;z-index:9999;color:#f4f7ff;font-family:Inter,system-ui,Arial,sans-serif;background:radial-gradient(1200px 700px at 20% -10%,#3b2c8f 0%,transparent 60%),radial-gradient(1000px 700px at 100% 110%,#8a5a12 0%,transparent 60%),linear-gradient(160deg,#0a1130,#0f1c4d 55%,#080d24);overflow:hidden}
.lg2 *{box-sizing:border-box}.lg2 button{font:inherit;color:inherit;cursor:pointer}
.lg2-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.lg2-bg i{position:absolute;width:26vmin;height:26vmin;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.09),transparent 65%);animation:lgdrift 18s ease-in-out infinite}
.lg2-bg i:nth-child(1){left:-6%;top:10%}.lg2-bg i:nth-child(2){left:70%;top:-8%;animation-delay:-4s}.lg2-bg i:nth-child(3){left:30%;top:60%;animation-delay:-8s}.lg2-bg i:nth-child(4){left:85%;top:55%;animation-delay:-2s}
.lg2-bg i:nth-child(5){left:12%;top:80%;animation-delay:-11s}.lg2-bg i:nth-child(6){left:50%;top:5%;animation-delay:-6s}.lg2-bg i:nth-child(7){left:-10%;top:45%;animation-delay:-13s}.lg2-bg i:nth-child(8){left:62%;top:85%;animation-delay:-9s}
@keyframes lgdrift{50%{transform:translate(6vmin,-5vmin) scale(1.25)}}
.lg2-chrome{position:absolute;z-index:5;top:10px;left:10px;right:10px;display:flex;gap:8px;align-items:center}.lg2-sp{flex:1}
.lg2-ic{width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);backdrop-filter:blur(6px);font-size:17px}
.lg2-ic:hover{background:rgba(255,255,255,.18)}
.lg2-menu{position:absolute;z-index:8;top:58px;right:10px;background:#0f1a3a;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px 14px;display:grid;gap:10px;font-size:14px;min-width:200px}
.lg2-menu label{display:flex;justify-content:space-between;gap:10px;align-items:center}
.lg2-body{position:absolute;inset:0;padding:64px clamp(14px,3vw,44px) clamp(14px,3vw,30px);overflow:auto;display:flex;flex-direction:column;animation:lgin .4s ease both}
@keyframes lgin{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}
.lg2 h1,.lg2 h2,.lg2 h3{margin:0}
.lg2-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);font-weight:800;font-size:clamp(12px,1.6vw,16px);letter-spacing:.06em}
.lg2-btn{border:0;border-radius:16px;padding:14px 26px;font-weight:900;font-size:clamp(16px,2vw,22px);background:rgba(255,255,255,.14);transition:.15s}
.lg2-btn:hover:not(:disabled){transform:translateY(-2px);background:rgba(255,255,255,.22)}
.lg2-btn.gold{background:linear-gradient(135deg,#f8c14f,#e38a10);color:#1c1406;box-shadow:0 10px 30px rgba(224,138,18,.45)}
.lg2-btn:disabled{opacity:.5;cursor:default}
.lg2-center{margin:auto;width:min(960px,100%);display:grid;gap:18px;text-align:center;justify-items:center}
.lg2-input{width:100%;border-radius:16px;border:2px solid rgba(255,255,255,.2);background:rgba(0,0,0,.28);color:#fff;padding:16px 18px;font:inherit;font-size:20px;outline:0;text-align:center}
.lg2-input:focus{border-color:#f5b73a}
/* início */
.lg2-hero{font-size:clamp(34px,6vw,64px);font-weight:900;line-height:1.05;background:linear-gradient(135deg,#fff,#f5b73a);-webkit-background-clip:text;background-clip:text;color:transparent}
.lg2-sub{opacity:.75;font-size:clamp(15px,2vw,21px);max-width:60ch}
.lg2-row{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.lg2-modes{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;width:100%}
.lg2-mode{border:2px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);border-radius:18px;padding:16px 12px;text-align:center;transition:.15s}
.lg2-mode:hover{transform:translateY(-3px);background:rgba(255,255,255,.14)}
.lg2-mode.on{border-color:#f5b73a;background:rgba(245,183,58,.18);box-shadow:0 0 30px rgba(245,183,58,.3)}
.lg2-mode b{display:block;font-size:17px;margin-top:6px}.lg2-mode small{opacity:.7;display:block;margin-top:2px}.lg2-mode span{font-size:34px}
.lg2-chip{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);border-radius:999px;padding:10px 20px;font-weight:800}
.lg2-chip.on{background:#f5b73a;color:#1c1406;border-color:transparent}
/* lobby */
.lg2-code{font-size:clamp(40px,5.2vw,76px);font-weight:900;letter-spacing:.08em;line-height:1;color:#f5b73a;text-shadow:0 0 60px rgba(245,183,58,.5)}
.lg2-lobby{display:grid;grid-template-columns:minmax(260px,420px) minmax(0,1fr);gap:clamp(16px,3vw,42px);align-items:center;margin:auto;width:min(1200px,100%)}
.lg2-join{display:grid;gap:12px;justify-items:center;text-align:center;padding:22px;border-radius:26px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}
.lg2-qr{width:min(240px,60vw);aspect-ratio:1;border-radius:18px;background:#fff;padding:10px}
.lg2-ppl{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-content:flex-start;min-height:180px}
.lg2-pp{display:flex;align-items:center;gap:10px;padding:8px 18px 8px 8px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);font-weight:800;font-size:clamp(15px,2vw,22px);animation:lgpop .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes lgpop{from{transform:scale(0) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}
.lg2-av{display:grid;place-items:center;width:1.9em;height:1.9em;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);font-size:1.05em;flex:none}
.lg2-av.big{font-size:clamp(34px,5vw,54px)}
/* intro da rodada */
.lg2-intro{margin:auto;text-align:center;display:grid;gap:14px;justify-items:center}
.lg2-intro .e{font-size:clamp(90px,18vw,190px);animation:lgboing 1s ease both}
.lg2-intro h1{font-size:clamp(34px,7vw,76px);font-weight:900}.lg2-intro p{opacity:.8;font-size:clamp(16px,2.4vw,26px);margin:0}
@keyframes lgboing{0%{transform:scale(0) rotate(-30deg)}60%{transform:scale(1.25) rotate(8deg)}100%{transform:none}}
/* pergunta */
.lg2-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:space-between;margin-bottom:12px}
.lg2-ring{position:relative;width:clamp(64px,9vw,104px);aspect-ratio:1;flex:none}
.lg2-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.lg2-ring circle{fill:none;stroke-width:9}.lg2-ring .tr{stroke:rgba(255,255,255,.15)}.lg2-ring .pg{stroke:var(--tc,#f5b73a);stroke-linecap:round;transition:stroke-dashoffset .12s linear,stroke .3s}
.lg2-ring b{position:absolute;inset:0;display:grid;place-items:center;font-size:clamp(24px,3.6vw,42px);font-weight:900}
.lg2-ring.hot b{color:#fb7185;animation:lgbeat .5s ease infinite}
@keyframes lgbeat{50%{transform:scale(1.25)}}
.lg2-qcard{flex:0 0 auto;padding:clamp(16px,3vw,34px);border-radius:26px;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.16);text-align:center;margin-bottom:14px;animation:lgin .45s both}
.lg2-qcard h2{font-size:clamp(22px,4.2vw,50px);line-height:1.2}
.lg2-qcard .ref{opacity:.6;margin-top:8px;font-size:14px}
.lg2-clues{display:grid;gap:10px;text-align:left;width:min(900px,100%);margin:0 auto}
.lg2-clues p{margin:0;display:flex;gap:14px;align-items:center;padding:12px 18px;border-radius:16px;font-size:clamp(17px,2.8vw,30px);font-weight:700;transition:.5s}
.lg2-clues p b{flex:none;width:1.6em;height:1.6em;border-radius:50%;display:grid;place-items:center;background:var(--tc);color:#111;font-size:.8em}
.lg2-clues p.on{background:rgba(255,255,255,.14);animation:lgin .5s both}.lg2-clues p.off{background:rgba(255,255,255,.04);opacity:.35;font-style:italic;font-weight:500}
.lg2-flash{display:grid;place-items:center;min-height:clamp(150px,26vh,260px)}
.lg2-flash .one{font-size:clamp(90px,17vw,190px);animation:lgpop .35s both}
.lg2-flash .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(8px,2vw,22px);font-size:clamp(50px,9vw,110px)}
.lg2-flash .grid span{animation:lgpop .5s both}
.lg2-flash .hide{font-size:clamp(40px,7vw,80px);opacity:.5}
.lg2-ans{flex:1 1 auto;display:grid;grid-template-columns:1fr 1fr;gap:clamp(10px,1.6vw,18px);min-height:0}
.lg2-ans.two{grid-template-columns:1fr 1fr}.lg2-ans.hidden{visibility:hidden}
.lg2-a{position:relative;display:flex;align-items:center;gap:clamp(10px,1.6vw,20px);text-align:left;border:0;border-radius:20px;padding:clamp(12px,2vw,24px);min-height:clamp(70px,14vh,160px);font-weight:800;font-size:clamp(17px,2.8vw,36px);color:#fff;box-shadow:0 8px 0 rgba(0,0,0,.3);transition:transform .15s,opacity .4s,filter .4s;animation:lgin .5s both}
.lg2-a i{flex:none;font-style:normal;width:1.5em;height:1.5em;border-radius:12px;display:grid;place-items:center;background:rgba(0,0,0,.25);font-size:1em}
.lg2-a span{overflow-wrap:anywhere}
.lg2-a.c0{background:linear-gradient(135deg,#ef4444,#b91c1c)}.lg2-a.c1{background:linear-gradient(135deg,#3b82f6,#1d4ed8)}.lg2-a.c2{background:linear-gradient(135deg,#f59e0b,#b45309)}.lg2-a.c3{background:linear-gradient(135deg,#10b981,#047857)}
.lg2-a.tfT{background:linear-gradient(135deg,#10b981,#047857)}.lg2-a.tfF{background:linear-gradient(135deg,#ef4444,#b91c1c)}
button.lg2-a:hover:not(:disabled){transform:translateY(-3px)}button.lg2-a:active:not(:disabled){transform:translateY(4px);box-shadow:0 3px 0 rgba(0,0,0,.3)}
.lg2-a.ok{box-shadow:0 0 0 5px #fff,0 0 60px rgba(52,211,153,.95);animation:lgok .7s}.lg2-a.ok:after{content:'✓';margin-left:auto;font-size:1.3em}
.lg2-a.no{filter:grayscale(.8) brightness(.6);opacity:.55}
@keyframes lgok{40%{transform:scale(1.06)}}
.lg2-count{display:flex;gap:10px;align-items:center;font-weight:800;font-size:clamp(14px,2vw,20px)}
.lg2-dots{display:flex;gap:5px;flex-wrap:wrap;max-width:46vw}.lg2-dots i{width:13px;height:13px;border-radius:50%;background:rgba(255,255,255,.2);transition:.3s}.lg2-dots i.on{background:#34d399;box-shadow:0 0 12px #34d399;transform:scale(1.15)}
.lg2-shake{animation:lgshake .5s infinite}@keyframes lgshake{25%{transform:translate(3px,-2px)}75%{transform:translate(-3px,2px)}}
/* placar / caminhada */
.lg2-board{margin:0 auto;width:min(1100px,100%);display:grid;gap:10px}
.lg2-lane{position:relative;display:grid;grid-template-columns:2.4em 2.2em minmax(90px,200px) minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 16px;border-radius:18px;background:rgba(255,255,255,.08);animation:lgin .5s both;transition:transform .7s cubic-bezier(.3,1.3,.5,1)}
.lg2-lane .rk{font-weight:900;font-size:clamp(17px,2.4vw,28px);text-align:center}.lg2-lane .nm{font-weight:800;font-size:clamp(15px,2.2vw,24px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lg2-lane .tk{position:relative;height:16px;border-radius:99px;background:rgba(255,255,255,.12);overflow:visible}
.lg2-lane .tk i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,#6366f1,#f5b73a);transition:width 1.2s cubic-bezier(.3,1.2,.4,1);min-width:16px}
.lg2-lane .tk:after{content:'🏁';position:absolute;right:-6px;top:-8px;font-size:22px}
.lg2-lane .sc{font-weight:900;font-size:clamp(17px,2.4vw,28px);font-variant-numeric:tabular-nums;text-align:right;min-width:4.4em}
.lg2-lane .dl{position:absolute;right:14px;top:-10px;padding:2px 10px;border-radius:99px;background:#34d399;color:#06281c;font-weight:900;font-size:14px;animation:lgpop .5s both}
.lg2-lane .bd{grid-column:3/-1;display:flex;gap:6px;flex-wrap:wrap;margin-top:-4px}.lg2-lane .bd em{font-style:normal;font-size:12.5px;padding:2px 9px;border-radius:99px;background:rgba(255,255,255,.12);font-weight:700}
.lg2-lane.first{background:linear-gradient(90deg,rgba(245,183,58,.28),rgba(255,255,255,.08));border:1px solid rgba(245,183,58,.6)}
.lg2-ansbar{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:12px;font-size:clamp(18px,2.8vw,34px);font-weight:900}
.lg2-ansbar b{color:#34d399}
.lg2-autobar{height:6px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;width:min(360px,80%)}.lg2-autobar i{display:block;height:100%;width:100%;background:#f5b73a;transform-origin:left;animation:lgauto var(--ad,9s) linear forwards}
@keyframes lgauto{to{transform:scaleX(0)}}
/* pódio */
.lg2-pod{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(8px,2vw,24px);align-items:end;width:min(900px,100%);margin:0 auto;min-height:clamp(240px,42vh,420px)}
.lg2-pod .s{display:grid;justify-items:center;gap:8px;text-align:center}
.lg2-pod .nm{font-weight:900;font-size:clamp(16px,2.6vw,30px);overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap}.lg2-pod .pt{font-weight:800;opacity:.85}
.lg2-pod .bar{width:100%;border-radius:18px 18px 0 0;display:grid;place-items:start center;padding-top:10px;font-size:clamp(34px,6vw,70px);font-weight:900;transform-origin:bottom;animation:lgrise 1.2s cubic-bezier(.2,1.1,.3,1) both;color:rgba(0,0,0,.55)}
.lg2-pod .p1 .bar{height:clamp(150px,28vh,280px);background:linear-gradient(180deg,#fde68a,#f5b73a);animation-delay:2.4s}.lg2-pod .p2 .bar{height:clamp(110px,21vh,210px);background:linear-gradient(180deg,#e5e7eb,#9ca3af);animation-delay:1.3s}.lg2-pod .p3 .bar{height:clamp(80px,15vh,150px);background:linear-gradient(180deg,#fdba74,#c2410c);animation-delay:.3s}
.lg2-pod .s>:not(.bar){opacity:0;animation:lgin .6s both}.lg2-pod .p1>:not(.bar){animation-delay:3.4s}.lg2-pod .p2>:not(.bar){animation-delay:2.3s}.lg2-pod .p3>:not(.bar){animation-delay:1.3s}
.lg2-pod .crown{font-size:clamp(34px,5vw,60px);animation:lgfloat 2s ease-in-out infinite!important;animation-delay:3.4s}
@keyframes lgrise{from{transform:scaleY(0)}to{transform:none}}@keyframes lgfloat{50%{transform:translateY(-8px)}}
.lg2-awards{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:10px}.lg2-awards div{padding:10px 16px;border-radius:16px;background:rgba(255,255,255,.1);font-weight:800;animation:lgin .6s 4.4s both;opacity:0}
.lg2-awards small{display:block;opacity:.7;font-weight:600}
/* celular */
.lg2-phone{margin:auto;width:min(520px,100%);display:grid;gap:16px;text-align:center;justify-items:center}
.lg2-me{display:flex;align-items:center;gap:12px;font-weight:900;font-size:22px}
.lg2-wait{display:flex;gap:8px;justify-content:center}.lg2-wait i{width:14px;height:14px;border-radius:50%;background:#f5b73a;animation:lgbounce 1s infinite}.lg2-wait i:nth-child(2){animation-delay:.15s}.lg2-wait i:nth-child(3){animation-delay:.3s}
@keyframes lgbounce{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-12px);opacity:1}}
.lg2-res{display:grid;gap:10px;justify-items:center}
.lg2-res .big{font-size:clamp(80px,22vw,150px);animation:lgboing .8s both}
.lg2-res .pts{font-size:clamp(34px,9vw,60px);font-weight:900;color:#34d399;animation:lgin .6s .3s both}
.lg2-res.bad .pts{color:#fb7185}
.lg2-float{position:absolute;left:50%;top:0;transform:translateX(-50%);font-size:34px;color:#34d399;animation:lgup 1.5s ease-out forwards}@keyframes lgup{to{transform:translate(-50%,-90px);opacity:0}}
.lg2-ph-q{font-size:clamp(20px,5.4vw,30px);font-weight:800;line-height:1.25}
.lg2-ph-ans{display:grid;gap:12px;width:100%}.lg2-ph-ans .lg2-a{min-height:74px;font-size:clamp(17px,4.6vw,24px)}
.lg2-confetti{position:fixed;inset:0;z-index:10000;pointer-events:none}
.lg2-tbar{width:100%;height:10px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden}.lg2-tbar i{display:block;height:100%;background:linear-gradient(90deg,#34d399,#facc15,#ef4444);transition:width .12s linear}
@media (max-width:860px){.lg2-lobby{grid-template-columns:minmax(0,1fr)}.lg2-ans{grid-template-columns:1fr}.lg2-lane{grid-template-columns:1.8em 2em minmax(60px,110px) minmax(0,1fr) auto}}
@media (max-width:560px){.lg2-ans.two{grid-template-columns:1fr 1fr}}
@media (prefers-reduced-motion:reduce){.lg2 *{animation-duration:.01s!important}}
`;document.head.appendChild(s);
}

/* ---------- início ---------- */
async function home(){
 try{await libs()}catch(e){alert('Não foi possível carregar o Jogo Coletivo. Verifique a conexão.');return}
 A().unlock();S.host=false;
 screen('<div class="lg2-center"><span class="lg2-pill">🎮 JOGO COLETIVO</span><h1 class="lg2-hero">Desafio Bíblico Ao Vivo</h1><p class="lg2-sub">Projete no telão e jogue com todos pelo celular. Vários jogos, pontos, sequências e um pódio final.</p><div class="lg2-row"><button class="lg2-btn gold" onclick="IASDLive.setup()">📺 Criar sala no telão</button><button class="lg2-btn" onclick="IASDLive.joinForm()">📱 Entrar com código</button></div><small class="lg2-sub">'+fmt(window.IASDGameEngine.stats().total)+'+ perguntas e desafios para sortear.</small></div>','');
 A().music('menu');
}
let SET={mode:0,rounds:1};
function setup(){
 A().sfx('click');
 const paint=()=>screen('<div class="lg2-center"><span class="lg2-pill">📺 NOVA SALA</span><h2 class="lg2-hero" style="font-size:clamp(28px,5vw,48px)">Escolha o jogo</h2><div class="lg2-modes">'+MODES.map(m=>'<button class="lg2-mode '+(SET.mode===m.id?'on':'')+'" onclick="IASDLive._set(\'mode\','+m.id+')"><span>'+m.e+'</span><b>'+m.n+'</b><small>'+m.d+'</small></button>').join('')+'</div><div class="lg2-row" style="align-items:center"><small class="lg2-sub" style="margin:0">Rodadas:</small>'+ROUNDS.map((n,i)=>'<button class="lg2-chip '+(SET.rounds===i?'on':'')+'" onclick="IASDLive._set(\'rounds\','+i+')">'+n+'</button>').join('')+'</div><div class="lg2-row"><button class="lg2-btn" onclick="IASDLive.home()">← Voltar</button><button class="lg2-btn gold" onclick="IASDLive.create()">Criar sala</button></div></div>','');
 API._set=(k,v)=>{SET[k]=v;A().sfx('tap');paint()};paint();
}
function joinForm(pre){
 A().sfx('click');const av=AVATARS[Math.floor(Math.random()*AVATARS.length)];let pick=av;
 screen('<div class="lg2-phone"><span class="lg2-pill">📱 ENTRAR NA PARTIDA</span><h2>Quem é você?</h2><div class="lg2-row" id="lg2-avs" style="gap:8px">'+AVATARS.map(a=>'<button class="lg2-chip '+(a===av?'on':'')+'" style="font-size:24px;padding:6px 12px" data-a="'+a+'">'+a+'</button>').join('')+'</div><input class="lg2-input" id="lg-code" inputmode="numeric" maxlength="6" placeholder="Código da sala" value="'+esc(pre||'')+'"><input class="lg2-input" id="lg-name" maxlength="24" placeholder="Seu nome"><button class="lg2-btn gold" style="width:100%" onclick="IASDLive.join()">Entrar</button><button class="lg2-btn" onclick="IASDLive.home()">← Voltar</button></div>','');
 $('lg2-avs').onclick=e=>{const b=e.target.closest('button');if(!b)return;pick=b.dataset.a;$('lg2-avs').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));A().sfx('tap');API._av=pick};API._av=pick;
}
async function join(){
 const c=($('lg-code').value||'').replace(/\D/g,''),nm=($('lg-name').value||'').trim();
 if(c.length!==6||!nm)return alert('Informe o código de 6 dígitos e seu nome.');
 const full=(API._av||'🙂')+' '+nm;
 try{
  const p=await rpc('live_join_room',{p_code:c,p_name:full});
  if(!p?.length)return alert('Sala não encontrada ou a partida já começou.');
  S.player=p[0];const rooms=await rpc('live_room_state',{p_room:S.player.room_id});if(!rooms?.length)throw Error('room_state_missing');
  S.room=rooms[0];S.host=false;PS={answered:-1,lastScore:0,sawQ:-1,revealFor:-1};
  A().sfx('join');localStorage.setItem('iasd_live_player',JSON.stringify({room:S.room.id,player:S.player.id,token:S.player.player_token}));
  deckFor(code());playerView();poll();
 }catch(e){console.error('IASDLive join:',e);alert('Não foi possível entrar na sala. Confira o código e tente novamente.')}
}
/* ---------- APRESENTADOR ---------- */
async function create(){
 try{
  const c=String(SET.mode)+String(SET.rounds)+String(Math.floor(1000+Math.random()*9000));
  const r=await rpc('live_create_room',{p_code:c});if(!r?.length)throw Error('room_not_created');
  S.room=r[0];S.host=true;HS={prev:{},streak:{},correct:{},best:{},joined:new Set(),order:[]};
  localStorage.setItem('iasd_live_host',JSON.stringify({id:S.room.id,token:S.room.host_token,code:c}));
  deckFor(c);A().sfx('join');lobby();poll();
 }catch(e){console.error('IASDLive create room:',e);alert('Não foi possível criar a sala. Tente novamente.')}
}
const players=async()=>await rpc('live_room_players',{p_room:S.room.id});
async function lobby(){
 S.phase='lobby';A().music('lobby');
 const ps=await players();const {mode,total}=cfgOf(code());
 const link=location.origin+'/jogos?game='+code();
 const qr='https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data='+encodeURIComponent(link);
 screen('<div class="lg2-lobby"><div class="lg2-join"><span class="lg2-pill">'+mode.e+' '+esc(mode.n)+' · '+total+' rodadas</span><small style="opacity:.75">Abra o IASD APP no celular e digite o código:</small><div class="lg2-code">'+esc(code())+'</div><img class="lg2-qr" alt="QR Code para entrar" src="'+qr+'"><small style="opacity:.75">ou escaneie o QR Code</small></div><div style="display:grid;gap:16px;justify-items:center;text-align:center"><h2 style="font-size:clamp(22px,3.4vw,40px)"><span id="lg-player-count">'+ps.length+'</span> jogador(es) na sala</h2><div class="lg2-ppl" id="lg-player-list"></div><button class="lg2-btn gold" id="lg-start" onclick="IASDLive.start()">▶ COMEÇAR PARTIDA</button></div></div>','');
 paintLobbyPlayers(ps,true);
}
function paintLobbyPlayers(ps,first){
 const box=$('lg-player-list');if(!box)return;const cnt=$('lg-player-count');if(cnt)cnt.textContent=ps.length;
 ps.forEach(p=>{if(!HS.joined.has(p.id)){HS.joined.add(p.id);const n=splitName(p.name);const d=document.createElement('div');d.className='lg2-pp';d.innerHTML='<span class="lg2-av">'+esc(n.av)+'</span>'+esc(n.name);box.appendChild(d);if(!first)A().sfx('join')}});
}
async function start(){
 const ps=await players();if(!ps.length&&!confirm('Ninguém entrou ainda. Começar assim mesmo?'))return;
 A().sfx('start');HS.prev={};ps.forEach(p=>{HS.prev[p.id]=Number(p.score)||0;HS.streak[p.id]=0;HS.correct[p.id]=0;HS.best[p.id]=0});
 intro(0);
}
async function patchRoom(obj){
 const h=JSON.parse(localStorage.getItem('iasd_live_host')||'null');if(!h?.token)throw Error('host_not_authorized');
 const r=await rpc('live_host_update',{p_room:S.room.id,p_token:h.token,p_status:obj.status||S.room.status,p_question:Number.isInteger(obj.current_question)?obj.current_question:null});
 if(r)S.room=r;else Object.assign(S.room,obj);
}
function intro(i){
 clearTimers();S.phase='intro';S.qn=i;const q=deckFor(code())[i],t=TYPES[q.ltype];A().music('play');A().sfx('whoosh');
 screen('<div class="lg2-intro" style="--tc:'+t.c+'"><span class="lg2-pill">RODADA '+(i+1)+' DE '+cfgOf(code()).total+'</span><div class="e">'+t.e+'</div><h1 style="color:'+t.c+'">'+esc(t.n)+'</h1><p>'+esc(t.d)+'</p></div>','');
 S.auto=setTimeout(async()=>{try{await patchRoom({status:'question',current_question:i})}catch(e){console.error(e);return}hostQuestion()},2300/speed());
}
function ringHTML(t){return '<div class="lg2-ring" id="lg-ring" style="--tc:'+t.c+'"><svg viewBox="0 0 100 100"><circle class="tr" cx="50" cy="50" r="44"/><circle class="pg" id="lg-pg" cx="50" cy="50" r="44" stroke-dasharray="276.46" stroke-dashoffset="0"/></svg><b id="lg-timer">'+0+'</b></div>'}
function ansTiles(q,mode,onclickFn){
 if(q.type==='tf')return q.opts.map((o,i)=>'<'+(mode==='host'?'div':'button')+' class="lg2-a '+(i===0?'tfT':'tfF')+'" '+(mode==='host'?'':'onclick="'+onclickFn+'('+i+')"')+'><i>'+(i===0?'✓':'✗')+'</i><span>'+esc(o)+'</span></'+(mode==='host'?'div':'button')+'>').join('');
 return q.opts.map((o,i)=>'<'+(mode==='host'?'div':'button')+' class="lg2-a c'+i+'" '+(mode==='host'?'':'onclick="'+onclickFn+'('+i+')"')+' data-i="'+i+'"><i>'+SHAPES[i]+'</i><span>'+esc(o)+'</span></'+(mode==='host'?'div':'button')+'>').join('');
}
/* corpo da pergunta (igual no telão e no celular) */
function qBody(q,t,mode){
 let mid='';
 if(q.ltype==='who'){const clues=q.clues;mid='<div class="lg2-qcard"><div class="lg2-clues" style="--tc:'+t.c+'">'+clues.map((c,i)=>'<p data-c="'+i+'" class="'+(i===0?'on':'off')+'"><b>'+(i+1)+'</b><span>'+(i===0?esc(c):'Próxima pista a caminho…')+'</span></p>').join('')+'</div></div>'}
 else if(q.ltype==='flash')mid='<div class="lg2-qcard"><div class="lg2-flash" id="lg-flash"></div><h2 id="lg-flash-q" style="visibility:hidden">'+esc(q.q)+'</h2></div>';
 else mid='<div class="lg2-qcard"><h2>'+esc(q.q)+'</h2>'+(q.hint?'<div class="ref">'+esc(q.hint)+'</div>':'')+'</div>';
 return mid;
}
function runFlash(q,onDone){
 const box=$('lg-flash');if(!box){onDone&&onDone();return}
 const ms=420/speed();
 if(q.flashKind==='count'){let i=0;const step=()=>{if(!$('lg-flash'))return;if(i>=q.seq.length){box.innerHTML='<div class="hide">🤔</div>';S.flashT=setTimeout(onDone,300/speed());return}box.innerHTML='<div class="one" style="animation-duration:'+(ms/1000)+'s">'+q.seq[i]+'</div>';A().sfx('tick');i++;S.flashT=setTimeout(step,ms)};S.flashT=setTimeout(step,500/speed())}
 else{box.innerHTML='<div class="grid">'+q.shown.map((e,i)=>'<span style="animation-delay:'+(i*.08)+'s">'+e+'</span>').join('')+'</div>';A().sfx('reveal');S.flashT=setTimeout(()=>{if(!$('lg-flash'))return;box.innerHTML='<div class="hide">🤔 Qual sumiu?</div>';S.flashT=setTimeout(onDone,350/speed())},q.showMs/speed())}
}
function hostQuestion(){
 clearTimers();S.phase='question';const i=qi(),q=deckFor(code())[i],t=TYPES[q.ltype],secs=roundSecs(q);
 players().then(ps=>{ps.forEach(p=>{HS.prev[p.id]=Number(p.score)||0});HS.n=ps.length;paintDots(0)}).catch(()=>{});
 screen('<div class="lg2-top"><span class="lg2-pill" style="color:'+t.c+'">'+t.e+' '+esc(t.n)+' · '+(i+1)+'/'+cfgOf(code()).total+'</span><div class="lg2-count"><div class="lg2-dots" id="lg-dots"></div><span id="lg-count">0 responderam</span></div>'+ringHTML(t)+'</div>'+qBody(q,t,'host')+'<div class="lg2-ans '+(q.type==='tf'?'two':'')+'" id="lg-ans">'+ansTiles(q,'host')+'</div><div class="lg2-row" style="margin-top:12px"><button class="lg2-btn" onclick="IASDLive.reveal()">Mostrar resposta</button></div>','',{style:'--tc:'+t.c});
 S.qStart=Date.now();S.flashing=q.ltype==='flash';
 if(q.ltype==='flash'){$('lg-ans').classList.add('hidden');runFlash(q,()=>{S.qStart=Date.now();S.flashing=false;const a=$('lg-ans');if(a)a.classList.remove('hidden');const fq=$('lg-flash-q');if(fq)fq.style.visibility='visible';A().sfx('whoosh')})}
 const total=secs-(q.ltype==='flash'?Math.round(q.showMs/1000/speed()):0);
 S.clock=setInterval(()=>tickClock(q,t,secs),100);
 S.shownClues=1;
}
function tickClock(q,t,secs){
 const flash=S.flashing;const dur=q.ltype==='flash'?Math.max(6,secs-Math.round(q.showMs/1000/speed())):secs;
 const el=(Date.now()-S.qStart)/1000,left=flash?dur:Math.max(0,dur-el);
 const pg=$('lg-pg'),tm=$('lg-timer'),ring=$('lg-ring');
 if(pg)pg.style.strokeDashoffset=String(276.46*(1-left/dur));if(tm)tm.textContent=Math.ceil(left);
 if(ring)ring.classList.toggle('hot',left<=5&&!flash);
 if(q.ltype==='who'){const n=Math.min(q.clues.length,1+Math.floor(el/(dur/3.2)));while(S.shownClues<n){const p=document.querySelector('.lg2-clues p[data-c="'+S.shownClues+'"]');if(p){p.className='on';p.querySelector('span').textContent=q.clues[S.shownClues];A().sfx('reveal')}S.shownClues++}}
 const sec=Math.ceil(left);if(!flash&&sec<=5&&sec>0&&sec!==S.lastSec){S.lastSec=sec;A().sfx('urgent');if(A().current?.()!=='tension')A().music('tension')}
 if(!flash&&left<=0){clearInterval(S.clock);reveal()}
}
function paintDots(n){const d=$('lg-dots');if(!d)return;const tot=HS.n||0;d.innerHTML=Array.from({length:Math.min(tot,40)},(_,k)=>'<i class="'+(k<n?'on':'')+'"></i>').join('');const c=$('lg-count');if(c)c.textContent=n+(tot?' de '+tot:'')+' responderam'}
async function reveal(){
 if(S.phase!=='question')return;S.phase='reveal';clearTimers();
 const i=qi(),q=deckFor(code())[i];A().music('play');A().sfx('reveal');
 try{
  await patchRoom({status:'reveal'});
  const h=JSON.parse(localStorage.getItem('iasd_live_host')||'null');
  await rpc('live_host_score',{p_room:S.room.id,p_token:h.token,p_question:i,p_correct:q.ans});
 }catch(e){console.error(e)}
 await scoreboard(i,q);
}
async function scoreboard(i,q){
 const ps=(await players()).map(p=>({...p,score:Number(p.score)||0}));
 const before=HS.order.slice();
 ps.forEach(p=>{const d=p.score-(HS.prev[p.id]||0);p.delta=d;if(d>0){HS.streak[p.id]=(HS.streak[p.id]||0)+1;HS.correct[p.id]=(HS.correct[p.id]||0)+1;HS.best[p.id]=Math.max(HS.best[p.id]||0,HS.streak[p.id])}else HS.streak[p.id]=0});
 ps.sort((a,b)=>b.score-a.score);
 const maxD=Math.max(0,...ps.map(p=>p.delta)),max=Math.max(1,...ps.map(p=>p.score));
 HS.order=ps.map(p=>p.id);
 const t=TYPES[q.ltype],gotIt=ps.filter(p=>p.delta>0).length;
 const lane=(p,k)=>{const n=splitName(p.name),moved=before.length?before.indexOf(p.id)-k:0,prev=HS.prev[p.id]||0;
  const badges=[];if(p.delta>0&&p.delta===maxD&&ps.length>1)badges.push('<em>⚡ Mais veloz</em>');if(HS.streak[p.id]>=2)badges.push('<em>🔥 '+HS.streak[p.id]+' seguidas</em>');if(moved>0)badges.push('<em>🚀 subiu '+moved+'</em>');
  return '<div class="lg2-lane '+(k===0?'first':'')+'" style="animation-delay:'+(k*.07)+'s"><span class="rk">'+(k===0?'🥇':k===1?'🥈':k===2?'🥉':(k+1)+'º')+'</span>'+avatarHTML(p.name)+'<span class="nm">'+esc(n.name)+'</span><div class="tk"><i data-w="'+Math.max(3,Math.round(p.score/max*100))+'" style="width:'+Math.max(3,Math.round(prev/Math.max(1,max)*100))+'%"></i></div><span class="sc">'+fmt(p.score)+'</span>'+(p.delta>0?'<span class="dl">+'+fmt(p.delta)+'</span>':'')+(badges.length?'<div class="bd">'+badges.join('')+'</div>':'')+'</div>'};
 const isLast=i+1>=cfgOf(code()).total;
 const ansHTML=ansTiles(q,'host');
 S.phase='board';
 screen('<div class="lg2-top"><span class="lg2-pill" style="color:'+t.c+'">'+t.e+' '+esc(t.n)+' · '+(i+1)+'/'+cfgOf(code()).total+'</span><span class="lg2-pill">✓ '+gotIt+' de '+ps.length+' acertaram</span></div>'+
  '<div class="lg2-ansbar">Resposta: <b>'+esc(q.a)+'</b>'+(q.ref?'<small style="opacity:.6;font-weight:600;font-size:.55em">'+esc(q.ref)+'</small>':'')+'</div>'+
  '<div class="lg2-board">'+(ps.slice(0,7).map(lane).join('')||'<p class="lg2-sub">Sem jogadores.</p>')+(ps.length>7?'<small class="lg2-sub" style="text-align:center">+'+(ps.length-7)+' jogadores</small>':'')+'</div>'+
  '<div class="lg2-row" style="margin-top:auto;padding-top:14px;flex-direction:column;align-items:center"><button class="lg2-btn gold" onclick="IASDLive.next()">'+(isLast?'🏆 Ver o pódio':'Próxima rodada →')+'</button><div class="lg2-autobar" style="--ad:'+(10/speed())+'s"><i></i></div></div>','',{style:'--tc:'+t.c});
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelectorAll('.lg2-lane .tk i').forEach(el=>el.style.width=el.dataset.w+'%')));
 ps.forEach(p=>{HS.prev[p.id]=p.score});
 if(gotIt)A().sfx(HS.streak[ps[0]?.id]>=3?'streak':'correct');
 S.auto=setTimeout(()=>{if(S.phase==='board')next()},10000/speed());
}
async function next(){
 if(S.phase!=='board')return;clearTimers();
 const n=qi()+1;if(n>=cfgOf(code()).total){await finalPodium();return}
 intro(n);
}
async function finalPodium(){
 clearTimers();S.phase='final';
 try{await patchRoom({status:'finished'})}catch(e){}
 const ps=(await players()).map(p=>({...p,score:Number(p.score)||0})).sort((a,b)=>b.score-a.score);
 A().music('victory');setTimeout(()=>A().sfx('drum'),200);setTimeout(()=>{A().sfx('win');confetti(8000)},3400/ (speed()>1?1:1));
 const top3=[ps[1],ps[0],ps[2]],cls=['p2','p1','p3'],pos=['2','1','3'];
 const bestStreak=ps.slice().sort((a,b)=>(HS.best[b.id]||0)-(HS.best[a.id]||0))[0],mostOk=ps.slice().sort((a,b)=>(HS.correct[b.id]||0)-(HS.correct[a.id]||0))[0];
 const total=cfgOf(code()).total;
 screen('<div class="lg2-center" style="width:min(1000px,100%)"><span class="lg2-pill">🏁 FIM DE JOGO · '+total+' RODADAS</span><h1 class="lg2-hero" style="font-size:clamp(30px,5vw,56px)">Pódio</h1>'+
  '<div class="lg2-pod">'+top3.map((p,k)=>p?'<div class="s '+cls[k]+'">'+(cls[k]==='p1'?'<span class="crown">👑</span>':'')+avatarHTML(p.name,'big')+'<div class="nm">'+esc(splitName(p.name).name)+'</div><div class="pt">'+fmt(p.score)+' pts</div><div class="bar">'+pos[k]+'</div></div>':'<div class="s '+cls[k]+'"></div>').join('')+'</div>'+
  '<div class="lg2-awards">'+(bestStreak&&HS.best[bestStreak.id]>=2?'<div>🔥 Sequência de fogo<small>'+esc(splitName(bestStreak.name).name)+' · '+HS.best[bestStreak.id]+' seguidas</small></div>':'')+(mostOk&&HS.correct[mostOk.id]?'<div>🎯 Mais acertos<small>'+esc(splitName(mostOk.name).name)+' · '+HS.correct[mostOk.id]+' de '+total+'</small></div>':'')+'</div>'+
  (ps.length>3?'<div class="lg2-ppl" style="margin-top:6px">'+ps.slice(3,12).map((p,k)=>'<div class="lg2-pp" style="animation-delay:'+(4+k*.1)+'s"><b>'+(k+4)+'º</b>'+avatarHTML(p.name)+esc(splitName(p.name).name)+' · '+fmt(p.score)+'</div>').join('')+'</div>':'')+
  '<div class="lg2-row"><button class="lg2-btn gold" onclick="IASDLive.leave();IASDLive.home()">Nova partida</button><button class="lg2-btn" onclick="IASDLive.close()">Encerrar</button></div></div>','');
}
/* ---------- JOGADOR (celular) ---------- */
async function playerView(){
 const st=S.room.status,i=qi();
 if(st==='lobby'){S.phase='p-lobby';return screen('<div class="lg2-phone"><span class="lg2-pill">🎉 VOCÊ ENTROU!</span><div class="lg2-me">'+avatarHTML(S.player.name,'big')+'</div><h2>'+esc(splitName(S.player.name).name)+'</h2><div class="lg2-code" style="font-size:54px">'+esc(code())+'</div><p class="lg2-sub">Olhe para o telão. Quando o apresentador começar, é só responder aqui!</p><div class="lg2-wait"><i></i><i></i><i></i></div></div>','')}
 if(st==='question'){
  if(PS.sawQ===i&&S.phase==='p-question')return;
  if(PS.answered===i){S.phase='p-sent';return sentScreen()}
  return phoneQuestion(i)}
 if(st==='reveal'){if(PS.revealFor!==i){PS.revealFor=i;S.phase='p-reveal';return phoneReveal(i)}return}
 return phoneFinal();
}
function sentScreen(){screen('<div class="lg2-phone"><div class="lg2-res"><div class="big">✅</div><h2>Resposta enviada!</h2><p class="lg2-sub">Aguardando os outros jogadores…</p><div class="lg2-wait"><i></i><i></i><i></i></div></div></div>','')}
function phoneQuestion(i){
 const q=deckFor(code())[i],t=TYPES[q.ltype],secs=roundSecs(q);clearTimers();PS.sawQ=i;S.phase='p-question';S.qStart=Date.now();S.shownClues=1;
 A().sfx('whoosh');
 const flash=q.ltype==='flash';
 screen('<div class="lg2-phone" style="--tc:'+t.c+'"><div class="lg2-tbar"><i id="lg-pbar" style="width:100%"></i></div><span class="lg2-pill" style="color:'+t.c+'">'+t.e+' '+esc(t.n)+' · '+(i+1)+'/'+cfgOf(code()).total+'</span>'+
  (q.ltype==='who'?'<div class="lg2-clues" style="--tc:'+t.c+'">'+q.clues.map((c,k)=>'<p data-c="'+k+'" class="'+(k===0?'on':'off')+'" style="font-size:clamp(15px,4.4vw,20px)"><b>'+(k+1)+'</b><span>'+(k===0?esc(c):'…')+'</span></p>').join('')+'</div>':flash?'<div class="lg2-flash" id="lg-flash"></div><div class="lg2-ph-q" id="lg-flash-q" style="visibility:hidden">'+esc(q.q)+'</div>':'<div class="lg2-ph-q">'+esc(q.q)+'</div>')+
  '<div class="lg2-ph-ans '+(q.type==='tf'?'':'')+'" id="lg-ans" style="'+(flash?'visibility:hidden':'')+'">'+ansTiles(q,'player','IASDLive.answer')+'</div></div>','',{style:'--tc:'+t.c});
 const dur=flash?Math.max(6,secs-Math.round(q.showMs/1000/speed())):secs;
 if(flash)runFlash(q,()=>{S.qStart=Date.now();S.flashing=false;const a=$('lg-ans');if(a)a.style.visibility='visible';const fq=$('lg-flash-q');if(fq)fq.style.visibility='visible'});
 S.flashing=flash;
 S.clock=setInterval(()=>{
  const el=(Date.now()-S.qStart)/1000,left=S.flashing?dur:Math.max(0,dur-el),b=$('lg-pbar');if(b)b.style.width=(left/dur*100)+'%';
  if(q.ltype==='who'){const n=Math.min(q.clues.length,1+Math.floor(el/(dur/3.2)));while(S.shownClues<n){const p=document.querySelector('.lg2-clues p[data-c="'+S.shownClues+'"]');if(p){p.className='on';p.querySelector('span').textContent=q.clues[S.shownClues]}S.shownClues++}}
  if(left<=0&&!S.flashing)clearInterval(S.clock)},120);
}
async function answer(i){
 if(PS.answered===qi())return;const ix=qi();PS.answered=ix;
 document.querySelectorAll('#lg-ans .lg2-a').forEach(b=>{b.disabled=true;if(+b.dataset.i!==i&&b.dataset.i!==undefined)b.classList.add('no')});
 A().sfx('sent');
 try{const s=JSON.parse(localStorage.getItem('iasd_live_player')||'null');await rpc('live_submit_answer',{p_room:S.room.id,p_player:S.player.id,p_token:s?.token,p_question:ix,p_answer:i});PS.lastPick=i;PS.pickFor=ix}catch(e){console.warn(e)}
 clearInterval(S.clock);sentScreen();
}
async function phoneReveal(i){
 clearTimers();const q=deckFor(code())[i],mine=PS.pickFor===i?PS.lastPick:-1,ok=mine===q.ans;
 screen('<div class="lg2-phone"><div class="lg2-res '+(ok?'':'bad')+'"><div class="big">'+(ok?'🎉':mine<0?'⏰':'😅')+'</div><h2>'+(ok?'Acertou!':mine<0?'Tempo esgotado':'Quase!')+'</h2><div class="pts" id="lg-pts">'+(ok?'calculando…':'')+'</div><p class="lg2-sub">Resposta certa: <b>'+esc(q.a)+'</b></p><div id="lg-rank" class="lg2-pill" style="visibility:hidden"></div></div></div>','');
 A().sfx(ok?'correct':'wrong');if(navigator.vibrate)navigator.vibrate(ok?[60,40,60]:200);if(ok)confetti(1800);
 for(const wait of [1300,1600]){
  await new Promise(r=>setTimeout(r,wait/speed()));if(S.phase!=='p-reveal'||PS.revealFor!==i)return;
  try{const ps=(await players()).map(p=>({...p,score:Number(p.score)||0})).sort((a,b)=>b.score-a.score),me=ps.find(p=>p.id===S.player.id);
   if(me){const d=me.score-PS.lastScore;const pts=$('lg-pts');if(pts)pts.textContent=d>0?'+'+fmt(d)+' pontos':(ok?'':'+0');PS.cur=me.score;
    const pos=ps.findIndex(p=>p.id===S.player.id)+1,r=$('lg-rank');if(r){r.style.visibility='visible';r.textContent=pos+'º lugar · '+fmt(me.score)+' pts'+(pos>1?' · faltam '+fmt(ps[pos-2].score-me.score+1)+' p/ subir':'')}}}catch(e){}
 }
 PS.lastScore=PS.cur??PS.lastScore;
}
async function phoneFinal(){
 clearTimers();S.phase='p-final';
 let pos='',pts=0,n=0;
 try{const ps=(await players()).map(p=>({...p,score:Number(p.score)||0})).sort((a,b)=>b.score-a.score);n=ps.length;pos=ps.findIndex(p=>p.id===S.player.id)+1;pts=ps[pos-1]?.score||0}catch(e){}
 A().sfx(pos&&pos<=3?'win':'level');if(pos&&pos<=3)confetti(6000);
 screen('<div class="lg2-phone"><div class="lg2-res"><div class="big">'+(pos===1?'🏆':pos===2?'🥈':pos===3?'🥉':'🎖️')+'</div><h2>Fim de jogo!</h2><div class="pts" style="color:#f5b73a">'+(pos?pos+'º lugar':'')+'</div><p class="lg2-sub">'+fmt(pts)+' pontos'+(n?' · '+n+' jogadores':'')+'</p><button class="lg2-btn gold" onclick="IASDLive.leave();IASDLive.home()">Jogar de novo</button></div></div>','');
}
/* ---------- sincronização ---------- */
function clearTimers(){clearInterval(S.clock);clearTimeout(S.auto);clearTimeout(S.flashT)}
async function tick(){
 if(!S.room)return;
 try{
  const r=await rpc('live_room_state',{p_room:S.room.id});if(!r.length)return;
  const old=S.room.status+'|'+S.room.current_question;S.room={...S.room,...r[0]};const now=S.room.status+'|'+S.room.current_question;
  if(S.host){
   if(S.phase==='lobby')paintLobbyPlayers(await players());
   else if(S.phase==='question'){
    const n=await rpc('live_answer_count',{p_room:S.room.id,p_question:qi()});const c=Number(n)||0;paintDots(c);
    if(HS.n&&c>=HS.n&&!S.allIn){S.allIn=true;setTimeout(()=>{if(S.phase==='question')reveal()},1200/speed())}}
   if(S.phase!=='question')S.allIn=false;
  }else if(old!==now||(S.room.status==='reveal'&&S.phase==='p-question'))playerView();
 }catch(e){}
}
function poll(){clearInterval(S.poll);S.poll=setInterval(tick,1500/Math.min(3,speed()))}
function closeAll(){clearInterval(S.poll);clearTimers();S.poll=null;$('lg2')?.remove();document.documentElement.classList.remove('lg2-open');A().music(null)}
function leave(){closeAll();if(S.host)localStorage.removeItem('iasd_live_host');else localStorage.removeItem('iasd_live_player');S={room:null,player:null,host:false,poll:null,clock:null,auto:null,phase:'',me:null}}
function fullscreen(){const el=$('lg2');if(!document.fullscreenElement)el?.requestFullscreen?.();else document.exitFullscreen?.()}
async function reconnect(){
 try{
  await libs();
  const h=JSON.parse(localStorage.getItem('iasd_live_host')||'null');
  if(h?.id){const rr=await rpc('live_room_state',{p_room:h.id});if(rr.length&&rr[0].status!=='finished'){S.room=rr[0];S.host=true;HS.prev={};poll();deckFor(code());if(S.room.status==='lobby')lobby();else{S.phase='board';const ps=await players();ps.forEach(p=>{HS.prev[p.id]=Number(p.score)||0;HS.streak[p.id]=0;HS.correct[p.id]=0;HS.best[p.id]=0});if(S.room.status==='question'){S.phase='question';hostQuestion()}else{S.phase='board';scoreboard(qi(),deckFor(code())[qi()])}}return}}
  const p=JSON.parse(localStorage.getItem('iasd_live_player')||'null');
  if(p?.room&&p?.player){const rr=await rpc('live_room_state',{p_room:p.room}),pp=await rpc('live_room_players',{p_room:p.room}),me=pp.find(x=>x.id===p.player);
   if(rr.length&&me&&rr[0].status!=='finished'){S.room=rr[0];S.player={...me,player_token:p.token};S.host=false;PS={answered:-1,lastScore:Number(me.score)||0,sawQ:-1,revealFor:-1};deckFor(code());poll();playerView()}}
 }catch(e){}
}
function install(){
 const gameCode=new URLSearchParams(location.search).get('game');
 if(gameCode){setTimeout(async()=>{await home();joinForm(gameCode)},300)}
 else if(location.pathname==='/jogos'&&(localStorage.getItem('iasd_live_host')||localStorage.getItem('iasd_live_player')))root();
}
const API={home,setup,create,joinForm,join,start,reveal,next,answer,close:closeAll,leave,fullscreen,sndMenu,
 sound:new Proxy({},{get:(_,k)=>()=>{try{window.IASDGameAudio?.sfx(k)}catch(e){}}}),
 _state:()=>({S,HS,PS}),_deck:c=>deckFor(c)};
window.IASDLive=API;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
