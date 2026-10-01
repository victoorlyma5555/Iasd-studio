/* IASD APP · Jogo Coletivo ao vivo (estilo "sala + celulares + telão").
   - O apresentador cria a sala e projeta a tela; cada pessoa entra pelo celular com o código.
   - 8 modos: Maratona mista e 7 jogos (Quiz, Verdadeiro/Falso, Quem Sou Eu, Versículo Perdido, Linha do Tempo, Quem Disse, Memória Relâmpago).
   - A configuração (modo e nº de rodadas) vai dentro do próprio código da sala (1º e 2º dígitos) e as perguntas saem de uma
     semente = código, então telão e celulares mostram as mesmas perguntas sem precisar de nada novo no servidor. */
(()=>{
'use strict';
const URL='https://gtsaaixuampeaivugxdm.supabase.co',KEY='sb_publishable_0nIK7568ulLb9JN0ctyiug_wHWDV7Qf';
const H={'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Prefer':'return=representation'};
const api=async(path,opt={})=>{const ac=new AbortController(),to=setTimeout(()=>ac.abort(),8000);try{const r=await fetch(URL+'/rest/v1/'+path,{...opt,signal:ac.signal,headers:{...H,...(opt.headers||{})}});if(!r.ok)throw Error(await r.text());const t=await r.text();return t?JSON.parse(t):null}finally{clearTimeout(to)}};
const rpc=(name,body)=>api('rpc/'+name,{method:'POST',body:JSON.stringify(body)});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const speed=()=>Number(window.__LG_SPEED)||1;
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
const A=()=>window.IASDGameAudio||new Proxy({},{get:()=>()=>{}});
/* ---------- telão: 2ª janela que espelha a tela do apresentador (mesmo navegador) ---------- */
const BC=('BroadcastChannel' in window)?new BroadcastChannel('iasd-live-telao'):new Proxy({},{get:()=>()=>{}});
let snapT=null;
function snapSend(){const b=document.querySelector('#lg2 .lg2-body');if(!b)return;const m={t:'snap',sid:S.sid,cls:b.className,style:b.getAttribute('style')||'',html:b.innerHTML};try{BC.postMessage(m)}catch(e){}pjSend(m)}
let TL=false;
/* ---------- Projetor IASD (app do Windows): mesma ponte da Sonoplastia ---------- */
const PJ={on:false,busy:false,next:null,last:''};
function pjReq(route,payload){const T=localStorage.getItem('iasd-projetor-token')||'';
 if(!T)return Promise.reject(Error('nopair'));
 return fetch('http://127.0.0.1:38741'+route,{method:'POST',targetAddressSpace:'loopback',headers:{'Content-Type':'application/json',Authorization:'Bearer '+T},body:JSON.stringify(payload||{})}).then(async r=>{const b=await r.json().catch(()=>({}));if(!r.ok)throw Error(b.error||'IASD Projetor indisponível');return b})}
async function pjFlush(){if(PJ.busy)return;PJ.busy=true;try{while(PJ.next!==null){const c=PJ.next;PJ.next=null;try{await pjReq('/project',{content:c})}catch(e){if(/Mensagem|Conteúdo inválido/.test(e.message)){PJ.big=1}}}}finally{PJ.busy=false}}
function toast(t){try{const d=document.createElement('div');d.textContent=t;d.style.cssText='position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:99999;background:#14283e;color:#fff;border:1px solid #d3a653;padding:10px 18px;border-radius:12px;font:700 14px Inter,system-ui;box-shadow:0 8px 30px #0008';document.body.appendChild(d);setTimeout(()=>d.remove(),3200)}catch(e){}}
function pjSend(m){if(!PJ.on)return;const c='IASD_GAME:'+JSON.stringify(m);if(c.length>49000&&!PJ.big){/* projetor antigo limita 50 mil caracteres */}PJ.next=c;pjFlush()}
function snapSoon(now){if(!S.host)return;if(!now&&!TL&&!PJ.on)return;if(now){clearTimeout(snapT);snapT=null;return snapSend()}if(snapT)return;snapT=setTimeout(()=>{snapT=null;snapSend()},220)}
function bcSend(m){if(!S.host)return;if(BC)try{BC.postMessage(m)}catch(e){}pjSend(m)}
if(BC)BC.onmessage=e=>{if(e.data?.t==='hello'&&S.host){TL=true;snapSoon(true)}};
/* atualiza só o que mudou (não reinicia as animações) */
function syncNode(a,b){
 const ac=Array.from(a.childNodes),bc=Array.from(b.childNodes);
 for(let i=0;i<bc.length;i++){const x=ac[i],y=bc[i];
  if(!x){a.appendChild(y.cloneNode(true));continue}
  if(x.nodeType!==y.nodeType||x.nodeName!==y.nodeName){a.replaceChild(y.cloneNode(true),x);continue}
  if(y.nodeType!==1){if(x.nodeValue!==y.nodeValue)x.nodeValue=y.nodeValue;continue}
  Array.from(x.attributes).forEach(at=>{if(!y.hasAttribute(at.name))x.removeAttribute(at.name)});
  Array.from(y.attributes).forEach(at=>{if(x.getAttribute(at.name)!==at.value)x.setAttribute(at.name,at.value)});
  syncNode(x,y)}
 while(a.childNodes.length>bc.length)a.removeChild(a.lastChild);
}

/* ---------- bibliotecas (carregadas só quando precisa) ---------- */
let libP=null;
const loadScript=src=>new Promise((ok,no)=>{if(document.querySelector('script[data-g="'+src+'"]'))return ok();const s=document.createElement('script');s.src=src;s.dataset.g=src;s.onload=ok;s.onerror=()=>no(Error('Falha ao carregar '+src));document.head.appendChild(s)});
function libs(){
 if(window.IASDGameEngine&&window.IASDGameAudio)return Promise.resolve();
 if(!libP)libP=(async()=>{for(const f of ['audio','bank-quiz','bank-people','bank-study'])await loadScript('/games/'+f+'.js?v=7');await loadScript('/games/engine.js?v=7')})().catch(e=>{libP=null;throw e});
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
const FORMATS=[{id:0,n:'Individual',e:'🧍',d:'Cada um por si, pódio no final'},{id:1,n:'Time × Time',e:'⚔️',d:'Azul contra Vermelho: some os pontos do time'},{id:2,n:'Cabo de Guerra',e:'🪢',d:'Cada rodada vencida puxa a corda para o seu lado'}];
const TEAMS={A:{n:'Azul',e:'🔵',c:'#38bdf8',c2:'#1d6fd8'},B:{n:'Dourado',e:'🟡',c:'#ffc83d',c2:'#e8860c'}};
function cfgOf(code){code=String(code||'');const f=[1,2].includes(+code[2])?+code[2]:0;return{mode:MODES[+code[0]]||MODES[0],total:ROUNDS[+code[1]]||15,fmt:f,teams:f>0}}
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
 if(type==='vf')q={...q,q0:q.q,q:q.q+'  →  “'+q.claim+'”. Está certo?'};
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
const specialOf=(i,total)=>i===total-1&&total>=10?{n:'BATALHA FINAL',e:'🔥',m:2}:(i===Math.floor(total/2)-1&&total>=10?{n:'RODADA DUPLA',e:'✨',m:2}:null);
const spOf=i=>cfgOf(code()).teams?specialOf(i,cfgOf(code()).total):null;
const roundSecs=q=>Math.round((TYPES[q.ltype].t)/speed());

/* ---------- estado ---------- */
let S={room:null,player:null,host:false,poll:null,clock:null,auto:null,phase:'',me:null};
let HS={prev:{},streak:{},correct:{},best:{},joined:new Set(),order:[],rw:{A:0,B:0},bonus:{A:0,B:0}};
let PS={answered:-1,lastScore:0,sawQ:-1,revealFor:-1};
const code=()=>S.room?.code;
const qi=()=>Number(S.room?.current_question)||0;
const curQ=()=>deckFor(code())[qi()];

/* ---------- nomes com avatar ("🦁 Maria") ---------- */
const teamTag=n=>(/\u200B([AB])$/.exec(String(n||''))||[])[1]||'';
function splitName(n){n=String(n||'').replace(/\u200B[AB]$/,'');const m=/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s+(.+)$/u.exec(n);return m?{av:m[1],name:m[2]}:{av:'🙂',name:n}}
/* times: a escolha vai junto do nome; o apresentador equilibra ao começar e avisa todos pelo canal em tempo real */
function loadTm(){if(S.tm||!S.room)return;try{const o=JSON.parse(localStorage.getItem('iasd_live_tm')||'null');if(o&&o.room===S.room.id){S.tm=o.tm;if(S.host){HS.rw=o.rw||HS.rw;HS.bonus=o.bonus||HS.bonus}}}catch(e){}}
function saveTm(){try{localStorage.setItem('iasd_live_tm',JSON.stringify({room:S.room.id,tm:S.tm,rw:HS.rw,bonus:HS.bonus}))}catch(e){}}
const teamOf=p=>{loadTm();return(S.tm&&S.tm[p.id])||teamTag(p.name)||'A'};
const teamTotals=(ps,bonus)=>{const t={A:{pts:0,n:0},B:{pts:0,n:0}};ps.forEach(p=>{const k=teamOf(p);t[k].pts+=Number(p.score)||0;t[k].n++});const mx=Math.max(1,t.A.n,t.B.n);['A','B'].forEach(k=>{t[k].pts=Math.round(t[k].pts*(t[k].n?mx/t[k].n:0))+((bonus&&bonus[k])||0)});return t};
const teamBadge=k=>'<span class="tm-b '+k+'">'+TEAMS[k].e+' Time '+TEAMS[k].n+'</span>';
const avatarHTML=(n,cls)=>'<span class="lg2-av '+(cls||'')+'">'+esc(splitName(n).av)+'</span>';


/* ---------- sincronização: canal em tempo real + relógio do apresentador ----------
   O apresentador marca o instante exato (T) em que cada fase aparece; telão e celulares desenham no mesmo T.
   Sem tempo real (ou se a mensagem se perder) o jogo cai para a consulta periódica de antes. */
const SY={ch:null,on:false,off:0,rtt:1e9,seq:0,last:null,lastMsg:0,tm:null,hb:null,pingT:null,pid:''};
const sleep=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms)));
const LEAD=()=>900/speed();
const hostClock=()=>Date.now()+SY.off;
function sySend(m){try{if(SY.ch&&SY.on)SY.ch.send({type:'broadcast',event:'m',payload:m})}catch(e){}}
function syOpen(){
 const cl=window.iasdCloud;if(!cl||!cl.channel||SY.ch||!S.room)return;
 try{
  SY.ch=cl.channel('iasd-live-'+code(),{config:{broadcast:{self:false,ack:false}}});
  SY.ch.on('broadcast',{event:'m'},ev=>syRecv(ev&&ev.payload||{}));
  SY.ch.subscribe(st=>{if(st==='SUBSCRIBED'){SY.on=true;if(S.host){if(SY.last)sySend({...SY.last,hb:1})}else{syPing();sySend({t:'hello'})}}else if(st==='CLOSED'||st==='CHANNEL_ERROR'||st==='TIMED_OUT')SY.on=false});
 }catch(e){SY.ch=null;SY.on=false}
}
function syClose(){
 clearInterval(SY.hb);clearInterval(SY.pingT);clearTimeout(SY.tm);
 try{if(SY.ch&&window.iasdCloud?.removeChannel)window.iasdCloud.removeChannel(SY.ch)}catch(e){}
 SY.ch=null;SY.on=false;SY.last=null;SY.seq=0;SY.lastMsg=0;SY.off=0;SY.rtt=1e9;
}
/* apresentador: anuncia a fase que vai aparecer no instante T (horário do próprio apresentador) */
function syPhase(status,q,at){
 if(!SY.last||SY.last.status!==status||SY.last.q!==q)SY.seq++;
 SY.last={t:'phase',seq:SY.seq,status,q,at,tm:S.tm||undefined};
 sySend(SY.last);
 clearInterval(SY.hb);SY.hb=setInterval(()=>{if(SY.last)sySend({...SY.last,hb:1})},2000);
}
function syRecv(m){
 if(S.host){
  if(m.t==='ping')sySend({t:'pong',id:m.id,c0:m.c0,h:Date.now()});
  else if(m.t==='hello'&&SY.last)sySend({...SY.last,hb:1});
  return}
 SY.lastMsg=Date.now();
 if(m.t==='pong'){if(m.id!==SY.pid)return;const c1=Date.now(),rtt=c1-m.c0;if(rtt<SY.rtt){SY.rtt=rtt;SY.off=m.h+rtt/2-c1}}
 else if(m.t==='phase')syPhaseIn(m);
 else if(m.t==='tt')PS.tt=m.tt;
 else if(m.t==='vs'){S.tm=m.tm||S.tm;phoneVs()}
 else if(m.t==='closed')closedScreen();
}
function syPing(){
 let n=0;const go=()=>{SY.pid=Math.random().toString(36).slice(2);sySend({t:'ping',id:SY.pid,c0:Date.now()});if(++n<6)setTimeout(go,250)};
 go();clearInterval(SY.pingT);SY.pingT=setInterval(()=>{SY.rtt=1e9;n=0;go()},25000);
}
/* jogador: aplica a fase no instante T (convertido para o relógio do próprio aparelho) */
function syPhaseIn(m){
 if(m.tm){S.tm=m.tm}
 if(m.seq<=SY.seq||!S.room||S.host)return;SY.seq=m.seq;
 const delay=m.at-hostClock();
 clearTimeout(SY.tm);
 SY.tm=setTimeout(()=>{if(S.host||!S.room)return;S.room={...S.room,status:m.status,current_question:m.q};PS.at=m.at-SY.off;playerView()},Math.max(0,Math.min(delay,4000)));
}
const syHealthy=()=>!S.host&&SY.on&&SY.lastMsg&&Date.now()-SY.lastMsg<7000;

/* ---------- casca da tela ---------- */
function root(){let r=$('lg2');if(!r){r=document.createElement('div');r.id='lg2';r.className='lg2';document.body.appendChild(r);document.documentElement.classList.add('lg2-open');if(!window.__lgBg){window.__lgBg=1;try{const im=new Image();im.onload=()=>document.documentElement.style.setProperty('--lgbg','url(/games/bg-igreja.jpg) center/cover no-repeat');im.src='/games/bg-igreja.jpg'}catch(e){}}try{new MutationObserver(()=>snapSoon()).observe(r,{subtree:true,childList:true,attributes:true,characterData:true})}catch(e){}}return r}
function screen(html,cls,opts){
 css();const r=root();
 r.innerHTML='<div class="lg2-bg"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="lg2-chrome"><button class="lg2-ic sair" onclick="IASDLive.exit()" aria-label="Sair" title="'+(S.host?'Encerrar a sala':'Sair da sala')+'">‹ Sair</button><span class="lg2-sp"></span>'+(S.host?'<button class="lg2-ic" onclick="IASDLive.telao()" aria-label="Projetar no telão" title="Projetar no telão">📽</button><button class="lg2-ic" onclick="IASDLive.fullscreen()" aria-label="Tela cheia" title="Tela cheia">⛶</button>':'')+'<button class="lg2-ic" id="lg2-snd" onclick="IASDLive.sndMenu(this)" aria-label="Som" title="Som">'+((A().state?.().sfx||A().state?.().music)&&A().state?.().vol>0?'🔊':'🔇')+'</button></div><div class="lg2-body '+(cls||'')+'" style="'+((opts&&opts.style)||'')+'">'+html+'</div>';
 r.classList.toggle('host',!!S.host);S.sid=(S.sid||0)+1;snapSoon(true);
}
function sndIcons(){const st=A().state?.()||{};const on=st.sfx||st.music;document.querySelectorAll('#lg2-snd').forEach(b=>b.textContent=on&&st.vol>0?'🔊':'🔇')}
function sndMenu(btn){
 const old=$('lg2-menu');if(old){old.remove();return}
 const st=A().state();const m=document.createElement('div');m.id='lg2-menu';m.className='lg2-menu';
 m.innerHTML='<label><span>🎵 Música</span><input type="checkbox" id="lg2-m1" '+(st.music?'checked':'')+'></label><label><span>🔔 Efeitos sonoros</span><input type="checkbox" id="lg2-m2" '+(st.sfx?'checked':'')+'></label><label class="vol"><span>🔊 Volume <b id="lg2-m3v">'+Math.round(st.vol*100)+'%</b></span><input type="range" id="lg2-m3" min="0" max="100" step="5" value="'+Math.round(st.vol*100)+'"></label>';
 document.body.appendChild(m);
 const r=btn.getBoundingClientRect(),w=m.offsetWidth||240,h=m.offsetHeight||150;
 m.style.right=Math.max(8,Math.min(innerWidth-w-8,innerWidth-r.right))+'px';
 if(r.top>innerHeight/2)m.style.bottom=Math.max(8,innerHeight-r.top+8)+'px';else m.style.top=Math.min(innerHeight-h-8,r.bottom+8)+'px';
 $('lg2-m1').onchange=e=>{A().setMusic(e.target.checked);sndIcons()};
 $('lg2-m2').onchange=e=>{A().setSfx(e.target.checked);sndIcons()};
 $('lg2-m3').oninput=e=>{A().vol(e.target.value/100);$('lg2-m3v').textContent=e.target.value+'%';sndIcons()};
 const off=ev=>{if(!m.contains(ev.target)&&!btn.contains(ev.target)){m.remove();document.removeEventListener('pointerdown',off,true)}};
 setTimeout(()=>document.addEventListener('pointerdown',off,true),0);
}

/* encolhe o texto até caber na altura disponível (passagens longas nunca ultrapassam a tela) */
function fitText(el,maxH,minPx){
 if(!el||!maxH)return;el.style.fontSize='';const base=parseFloat(getComputedStyle(el).fontSize)||20;let px=base,n=0;
 while(el.scrollHeight>maxH+1&&px>(minPx||12)&&n++<24){px*=.93;el.style.fontSize=px.toFixed(1)+'px'}
}
const uPx=()=>Math.min(innerWidth/100,innerHeight/56.25);
function fitHost(){
 const h=document.querySelector('.lg2-qv .lg2-qcard h2');if(h){const c=h.parentElement,pad=parseFloat(getComputedStyle(c).paddingTop)*2;fitText(h,uPx()*17-pad,10)}
 document.querySelectorAll('.lg2-qv .lg2-a span').forEach(sp=>{const a=sp.closest('.lg2-a');if(a)fitText(sp,a.clientHeight*.82,10)});
 document.querySelectorAll('.lg2-clues p span').forEach(sp=>fitText(sp,uPx()*5,10));
}
function fitPhone(){
 const q=document.querySelector('.lg2-ph-q');if(q)fitText(q,innerHeight*.3,12);
 document.querySelectorAll('.lg2-ph-ans .lg2-a span').forEach(sp=>{const a=sp.closest('.lg2-a');if(a)fitText(sp,Math.max(36,a.clientHeight*.8),11)});
}
function confetti(ms=5200){
 bcSend({t:'confetti',ms});
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
.lg2.telao .lg2-btn,.lg2.telao .lg2-autobar,.lg2.telao .lb-mode{display:none!important}.lg2.telao .lg2-qv .qv-show{display:inline-flex!important}.lg2.telao .lg2-chrome{opacity:0;transition:opacity .4s}.lg2.telao:hover .lg2-chrome{opacity:1}.lg2.telao .lg2-body{pointer-events:none}
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
.lg2-menu{position:fixed;z-index:100000;background:#0f1a3a;color:#f4f7ff;font-family:Inter,system-ui,Arial,sans-serif;border:1px solid rgba(140,172,255,.4);border-radius:16px;padding:14px 16px;display:grid;gap:14px;font-size:16px;width:min(300px,calc(100vw - 16px));box-shadow:0 18px 50px rgba(0,0,0,.6)}
.lg2-menu label{display:flex;justify-content:space-between;gap:12px;align-items:center;min-height:36px}.lg2-menu label.vol{display:grid;gap:8px}.lg2-menu input[type=checkbox]{width:26px;height:26px;accent-color:#f5b73a}.lg2-menu input[type=range]{width:100%;height:32px;accent-color:#f5b73a;touch-action:pan-x}
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
/* telão / computador: tudo bem maior para ler e escanear de longe */
@media (min-width:900px){
.lg2-pill{font-size:clamp(14px,1.9vw,34px);padding:.4em .9em}
.lg2-btn{font-size:clamp(18px,2.2vw,36px);padding:.7em 1.4em}
.lg2-hero{font-size:clamp(40px,7.4vw,130px)}.lg2-sub{font-size:clamp(17px,2.5vw,44px);max-width:70ch}
.lg2-center{width:min(1700px,100%)}
.lg2-lobby{grid-template-columns:minmax(320px,46vw) minmax(0,1fr);width:min(1800px,100%);gap:clamp(24px,4vw,80px)}
.lg2-join{padding:clamp(18px,2.2vw,44px);gap:clamp(10px,1.4vw,26px);border-radius:34px}
.lg2-join small{font-size:clamp(14px,1.6vw,30px)}
.lg2-code{font-size:clamp(52px,min(6.2vw,11vh),130px)}
.lg2-qr{width:min(30vw,44vh,600px);min-width:220px;padding:clamp(10px,1.2vw,22px);border-radius:24px}
.lg2-lobby h2{font-size:clamp(28px,4.2vw,84px)!important}
.lg2-pp{font-size:clamp(17px,2.7vw,48px);padding:.4em 1em .4em .4em}

.lg2-ring{width:clamp(80px,11vw,210px)}.lg2-ring b{font-size:clamp(30px,4.8vw,94px)}
.lg2-count{font-size:clamp(16px,2.5vw,44px)}.lg2-dots i{width:clamp(13px,1.3vw,26px);height:clamp(13px,1.3vw,26px)}
.lg2-qcard h2{font-size:clamp(26px,5vw,104px)}.lg2-qcard .ref{font-size:clamp(14px,1.6vw,30px)}
.lg2-clues p{font-size:clamp(19px,3.3vw,64px)}
.lg2-a{font-size:clamp(20px,3.2vw,64px);min-height:clamp(80px,16vh,230px)}
.lg2-flash .one{font-size:clamp(110px,22vw,420px)}.lg2-flash .grid{font-size:clamp(60px,11vw,220px)}
.lg2-ansbar{font-size:clamp(22px,3.8vw,76px)}
.lg2-board{width:min(1700px,100%)}
.lg2-lane{padding:clamp(10px,1.1vw,20px) clamp(16px,1.6vw,30px);gap:clamp(12px,1.4vw,26px)}
.lg2-lane .rk,.lg2-lane .sc{font-size:clamp(19px,3.2vw,60px)}.lg2-lane .nm{font-size:clamp(17px,2.9vw,54px)}
.lg2-lane .tk{height:clamp(16px,1.4vw,28px)}.lg2-lane .dl{font-size:clamp(14px,1.5vw,28px)}.lg2-lane .bd em{font-size:clamp(13px,1.4vw,26px)}
.lg2-pod{width:min(1500px,100%)}.lg2-pod .nm{font-size:clamp(18px,3vw,56px)}.lg2-pod .pt{font-size:clamp(15px,1.8vw,34px)}
.lg2-pod .bar{font-size:clamp(40px,7vw,130px)}.lg2-pod .crown{font-size:clamp(40px,6vw,110px)}
.lg2-awards div{font-size:clamp(15px,1.8vw,34px)}
.lg2-av.big{font-size:clamp(40px,6.4vw,120px)}
}
/* ===== design de referência (telão 16:9): tudo medido em --u = 1% da largura (ou 1,78% da altura) ===== */
.lg2-body.lb,.lg2-body.bgx{--u:min(1vw,1.7777vh);background:
 radial-gradient(calc(var(--u)*13) calc(var(--u)*13) at 24% 4%,rgba(130,175,255,.55),transparent 70%),
 radial-gradient(calc(var(--u)*10) calc(var(--u)*10) at 78% 12%,rgba(90,140,255,.5),transparent 70%),
 radial-gradient(calc(var(--u)*30) calc(var(--u)*16) at 6% 40%,rgba(70,70,255,.4),transparent 70%),
 radial-gradient(calc(var(--u)*34) calc(var(--u)*18) at 96% 58%,rgba(40,90,255,.4),transparent 70%),
 radial-gradient(circle at 4% 24%,rgba(170,140,255,.85) 0 calc(var(--u)*.45),transparent calc(var(--u)*.6)),
 radial-gradient(circle at 1.5% 66%,rgba(90,160,255,.85) 0 calc(var(--u)*.5),transparent calc(var(--u)*.65)),
 linear-gradient(90deg,transparent 7%,rgba(90,130,255,.16) 8%,transparent 12%,transparent 26%,rgba(90,130,255,.14) 27%,transparent 31%,transparent 62%,rgba(90,130,255,.12) 63%,transparent 67%,transparent 84%,rgba(90,130,255,.16) 85%,transparent 90%),
 linear-gradient(0deg,rgba(2,6,26,.78),transparent 38%),
 var(--lgbg,linear-gradient(transparent,transparent)),
 linear-gradient(180deg,#0b1d62 0%,#0a1650 48%,#060d36 100%)}
.lg2-body.lb{padding:0;overflow:hidden}
.lg2-body.cl::before,.lg2-body.qz::before{content:'';position:absolute;z-index:0;width:calc(var(--u)*3.6);height:calc(var(--u)*9.4);pointer-events:none;background:linear-gradient(#fff7cf,#ffd978) center/calc(var(--u)*1.05) 100% no-repeat,linear-gradient(#fff7cf,#ffd978) 50% 24%/100% calc(var(--u)*1.05) no-repeat;filter:drop-shadow(0 0 calc(var(--u)*1.4) rgba(255,215,120,.95)) drop-shadow(0 0 calc(var(--u)*3) rgba(255,200,90,.6))}
.lg2-body.cl::before{left:calc(var(--u)*1);top:calc(var(--u)*5.2);opacity:.92}
.lg2-body.qz::before{right:calc(var(--u)*.6);top:calc(var(--u)*15.2);opacity:.8}
.lg2-body.cl::after{content:'BÍBLIA\\A SAGRADA';white-space:pre;position:absolute;z-index:0;right:calc(var(--u)*-2.5);top:calc(var(--u)*-.6);width:calc(var(--u)*17);height:calc(var(--u)*11.5);transform:perspective(calc(var(--u)*60)) rotateY(-24deg) rotateZ(-9deg);background:linear-gradient(135deg,#1c2a63,#090f33);border-radius:calc(var(--u)*1.2);border:1px solid rgba(160,130,255,.28);color:#a98be0;font:italic 800 calc(var(--u)*2.1)/1.2 Georgia,'Times New Roman',serif;text-align:center;padding-top:calc(var(--u)*4.4);text-shadow:0 0 calc(var(--u)*1) rgba(180,140,255,.55);opacity:.92;pointer-events:none}
.lg2-lb{--u:min(1vw,1.7777vh);position:absolute;z-index:1;inset:0;margin:0 auto;width:min(100%,calc(var(--u)*100));display:grid;grid-template-columns:minmax(0,44.6fr) minmax(0,42fr);grid-template-rows:auto minmax(0,1fr);column-gap:calc(var(--u)*2);padding:0 calc(var(--u)*5.8) calc(var(--u)*2.6)}
.lb-hd{grid-column:1/-1;position:relative;height:calc(var(--u)*14.8)}
.lb-iasd{display:flex;align-items:center;gap:calc(var(--u)*.8)}
.lb-iasd i{flex:none;width:calc(var(--u)*5);height:calc(var(--u)*4.7);filter:drop-shadow(0 0 calc(var(--u)*.3) rgba(255,255,255,.35));background:url(/iasd-simbolo-branco.png?v=1) center/contain no-repeat}
.lb-iasd span{font-size:calc(var(--u)*1.55);line-height:1.1;font-weight:400;color:#fff;white-space:nowrap}
.lb-hd .lb-iasd{position:absolute;left:calc(var(--u)*.8);top:calc(var(--u)*3.4)}
.lb-bar,.ph-brand{display:flex;align-items:center;justify-content:center;gap:calc(var(--u)*.9);font-weight:900;letter-spacing:.04em;color:#fff;pointer-events:none}
.lb-bar{position:absolute;left:50%;top:calc(var(--u)*1.1);transform:translateX(-50%);font-size:calc(var(--u)*1.7);z-index:2}
.lb-bar .pe svg{height:calc(var(--u)*2.6);width:auto;display:block;filter:drop-shadow(0 0 calc(var(--u)*.5) rgba(248,170,40,.55))}
.lb-bar i,.ph-brand i{font-style:normal;background:linear-gradient(180deg,#fff0a0,#ffc83d 50%,#e8860c);-webkit-background-clip:text;background-clip:text;color:transparent}
.ph-brand{font-size:18px;margin:0 auto 12px}.ph-brand .pe svg{height:30px;width:auto;display:block}
.lb-panel{padding-top:calc(var(--u)*4)}
.lb-intro{--tc:#ffd24a;margin:auto;text-align:center;display:grid;justify-items:center;gap:calc(var(--u)*1.4);max-width:calc(var(--u)*80);padding:0 calc(var(--u)*2)}
.lb-intro .e{font-size:calc(var(--u)*13);line-height:1;filter:drop-shadow(0 0 calc(var(--u)*1.5) var(--tc));animation:lgboing 1s ease both}
.lb-intro h1{margin:0;font-size:calc(var(--u)*6.4);line-height:1.05;font-weight:900;color:var(--tc);text-shadow:0 0 calc(var(--u)*1.4) var(--tc);overflow-wrap:anywhere}
.lb-intro p{margin:0;font-size:calc(var(--u)*2.3);opacity:.85;line-height:1.3}
.lb-chip{padding:calc(var(--u)*.6) calc(var(--u)*1.8);border-radius:999px;font-weight:800;font-size:calc(var(--u)*1.5);letter-spacing:.12em;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25)}
@media(max-width:900px){.lb-intro{--u:min(1vw,.9vh);}.lb-bar{display:none}}
/* ---- times ---- */
.lb-fmt{display:flex;gap:calc(var(--u)*1);justify-content:center;flex-wrap:wrap;margin-bottom:calc(var(--u)*1.2)}
.lb-f{display:grid;justify-items:center;gap:2px;padding:calc(var(--u)*1) calc(var(--u)*2);min-width:calc(var(--u)*17);border-radius:calc(var(--u)*1.6);border:2px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#fff;font-family:inherit;cursor:pointer}
.lb-f span{font-size:calc(var(--u)*3)}.lb-f b{font-size:calc(var(--u)*1.8)}.lb-f small{font-size:calc(var(--u)*1.1);opacity:.7;max-width:calc(var(--u)*17)}
.lb-f.on{border-color:#ffc83d;background:rgba(255,200,61,.16);box-shadow:0 0 calc(var(--u)*2) rgba(255,200,61,.35)}
@media(max-width:900px){.lb-f{min-width:0;flex:1;padding:8px 10px}.lb-f span{font-size:24px}.lb-f b{font-size:14px}.lb-f small{font-size:11px}}
.lb-teams{display:grid;grid-template-columns:1fr 1fr;gap:calc(var(--u)*1.2);width:100%}
.lb-tm{border-radius:calc(var(--u)*1.6);padding:calc(var(--u)*1);background:rgba(255,255,255,.06);border:2px solid var(--tc)}
.lb-tm.A{--tc:#38bdf8}.lb-tm.B{--tc:#ffc83d}
.lb-tm h4{margin:0 0 calc(var(--u)*.6);font-size:calc(var(--u)*1.5);letter-spacing:.08em;color:var(--tc);display:flex;justify-content:space-between}
.lb-tm .lg2-ppl{justify-content:flex-start}
.tm-b{display:inline-block;padding:.25em .8em;border-radius:99px;font-weight:900;font-size:14px;letter-spacing:.04em;border:2px solid currentColor}
.tm-b.A{color:#38bdf8;background:rgba(56,189,248,.14)}.tm-b.B{color:#ffc83d;background:rgba(255,200,61,.14)}
.tm-pick{display:grid;gap:8px;text-align:center}.tm-pick[hidden]{display:none}.tm-pick div{display:flex;gap:10px}
.tm-pick button{flex:1;padding:14px;border-radius:16px;border:2px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;font-weight:900;font-size:18px;font-family:inherit}
.tm-pick button.A.on{border-color:#38bdf8;background:rgba(56,189,248,.25)}.tm-pick button.B.on{border-color:#ffc83d;background:rgba(255,200,61,.25)}
.tm-ln{margin-top:10px;font-size:18px;text-align:center;line-height:1.6}.tm-ln b{font-size:1.3em}
.tm-head{display:grid;grid-template-columns:1fr 1.5fr 1fr;gap:calc(var(--u)*1.5);align-items:center;width:100%;margin:calc(var(--u)*.6) 0 calc(var(--u)*1)}
.tm-side{display:grid;justify-items:center;gap:calc(var(--u)*.2);padding:calc(var(--u)*1) 0;border-radius:calc(var(--u)*1.6);background:rgba(255,255,255,.07);border:2px solid transparent;position:relative}
.tm-side.A{--tc:#38bdf8}.tm-side.B{--tc:#ffc83d}.tm-side b{font-size:calc(var(--u)*1.7);letter-spacing:.1em;color:var(--tc)}
.tm-side.lead{border-color:var(--tc);box-shadow:0 0 calc(var(--u)*2.4) var(--tc)}
.tm-sc{font-size:calc(var(--u)*5.6);font-weight:900;line-height:1;text-shadow:0 0 calc(var(--u)*1) var(--tc)}
.tm-side em{font-style:normal;font-weight:900;color:#34d399;font-size:calc(var(--u)*2)}
.tm-side i{font-style:normal;font-weight:900;color:#ffd24a;font-size:calc(var(--u)*1.2);animation:lgpop .5s both}
.tm-side small{font-size:calc(var(--u)*1.2);opacity:.7}
.tm-split{height:calc(var(--u)*2.6);border-radius:99px;background:#ffc83d;overflow:hidden;box-shadow:inset 0 0 0 2px rgba(255,255,255,.25)}
.tm-split i{display:block;height:100%;background:#38bdf8;transition:width 1.2s cubic-bezier(.2,1,.3,1)}
.tm-rope{position:relative;height:calc(var(--u)*7)}
.tm-rope .tm-line{position:absolute;left:4%;right:4%;top:50%;height:calc(var(--u)*.7);border-radius:99px;background:repeating-linear-gradient(90deg,#e7c27a 0 calc(var(--u)*.8),#b98a3e calc(var(--u)*.8) calc(var(--u)*1.6));transform:translateY(-50%)}
.tm-rope .tm-mid{position:absolute;left:50%;top:15%;bottom:15%;width:3px;background:rgba(255,255,255,.55);transform:translateX(-50%)}
.tm-flag{position:absolute;top:50%;transform:translateY(-50%);font-size:calc(var(--u)*3)}.tm-flag.A{left:0}.tm-flag.B{right:0}
.tm-knot{position:absolute;top:50%;font-size:calc(var(--u)*4.4);transform:translate(-50%,-50%);transition:left 1.4s cubic-bezier(.3,1.4,.4,1);filter:drop-shadow(0 0 calc(var(--u)*.8) #ffd24a)}
.lg2-lane.tA{border-left:calc(var(--u)*.6) solid #38bdf8}.lg2-lane.tB{border-left:calc(var(--u)*.6) solid #ffc83d}
.tf-h{margin:calc(var(--u)*.4) 0 calc(var(--u)*1.2);font-size:calc(var(--u)*6.2);font-weight:900;line-height:1.05;text-align:center}
.tf-h.A{color:#38bdf8;text-shadow:0 0 calc(var(--u)*2) #38bdf8}.tf-h.B{color:#ffc83d;text-shadow:0 0 calc(var(--u)*2) #ffc83d}
.tf-two{display:grid;grid-template-columns:1fr 1fr;gap:calc(var(--u)*2);width:100%}
.tf-card{position:relative;padding:calc(var(--u)*1.4);border-radius:calc(var(--u)*2);background:rgba(255,255,255,.07);border:2px solid rgba(255,255,255,.14);text-align:center;opacity:.82}
.tf-card.A{--tc:#38bdf8}.tf-card.B{--tc:#ffc83d}.tf-card.win{opacity:1;border-color:var(--tc);box-shadow:0 0 calc(var(--u)*3) var(--tc);animation:lgin .6s both}
.tf-card .crown{position:absolute;left:50%;top:calc(var(--u)*-3.2);transform:translateX(-50%);font-size:calc(var(--u)*4);animation:lgfloat 2s ease-in-out infinite}
.tf-card h3{margin:0;font-size:calc(var(--u)*1.8);letter-spacing:.1em;color:var(--tc)}.tf-pts{font-size:calc(var(--u)*7);font-weight:900;line-height:1.05}
.tf-card small{font-size:calc(var(--u)*1.2);opacity:.75}
.tf-ms{display:grid;gap:calc(var(--u)*.4);margin-top:calc(var(--u)*.8)}.tf-ms div{display:flex;align-items:center;gap:calc(var(--u)*.8);font-size:calc(var(--u)*1.5);font-weight:700;padding:calc(var(--u)*.3) calc(var(--u)*1);border-radius:99px;background:rgba(255,255,255,.07)}.tf-ms span{flex:1;text-align:left}.tf-ms .lg2-av{width:calc(var(--u)*2.6);height:calc(var(--u)*2.6);font-size:calc(var(--u)*1.7)}
.tm-fin{display:grid;gap:8px;justify-items:center;margin:12px 0}.tm-win{font-size:22px;font-weight:900}.tm-win.A{color:#38bdf8}.tm-win.B{color:#ffc83d}
.tm-two{display:flex;gap:12px;font-size:26px;font-weight:900}.tm-two .A{color:#38bdf8}.tm-two .B{color:#ffc83d}
.lg2-board.tmb .lg2-lane{padding-top:calc(var(--u)*.5);padding-bottom:calc(var(--u)*.5)}
.lb-tm h4{font-size:calc(var(--u)*1.25)!important;white-space:nowrap}
.lb-chip.sp,.tm-b.sp{background:linear-gradient(180deg,#ffe27a,#f5a623);color:#3a2300;border-color:#ffd24a}
.lb-intro .lb-chip.sp{font-size:calc(var(--u)*1.7)}
.vs{margin:auto;display:grid;justify-items:center;gap:calc(var(--u)*2);width:100%}
.vs-row{display:grid;grid-template-columns:1fr auto 1fr;gap:calc(var(--u)*3);align-items:center;width:min(100%,calc(var(--u)*90))}
.vs-t{display:grid;gap:calc(var(--u)*.7);padding:calc(var(--u)*1.6);border-radius:calc(var(--u)*2);border:2px solid var(--tc);background:rgba(255,255,255,.07);box-shadow:0 0 calc(var(--u)*2.5) var(--tc);animation:vsIn .7s cubic-bezier(.2,1.1,.3,1) both}
.vs-t.A{--tc:#38bdf8;--from:-60px}.vs-t.B{--tc:#ffc83d;--from:60px}
@keyframes vsIn{from{opacity:0;transform:translateX(var(--from))}to{opacity:1;transform:none}}
.vs-t h3{margin:0;text-align:center;font-size:calc(var(--u)*2.2);letter-spacing:.1em;color:var(--tc)}
.vs-t div{display:flex;align-items:center;gap:calc(var(--u)*1);font-size:calc(var(--u)*2);font-weight:800;animation:lgin .5s both}
.vs-x{font-size:calc(var(--u)*8);font-weight:900;color:#fff;text-shadow:0 0 calc(var(--u)*2) #ffd24a;animation:lgboing .9s .4s both}
.vs-n{font-size:calc(var(--u)*30);font-weight:900;line-height:1;color:#ffd24a;text-shadow:0 0 calc(var(--u)*3) rgba(255,200,61,.8);animation:lgboing .6s both}
.lg2-phone .vs-n{font-size:140px}.vs-n.A{color:#38bdf8}.vs-n.B{color:#ffc83d}
.ph-vs{display:grid;justify-items:center;gap:6px;padding:20px;border-radius:24px;border:2px solid var(--tc);background:rgba(255,255,255,.07)}
.ph-vs.A{--tc:#38bdf8}.ph-vs.B{--tc:#ffc83d}.ph-vs .e{font-size:90px;animation:lgboing .8s both}.ph-vs h2{margin:0;color:var(--tc)}
@media(max-width:900px){.vs-row{grid-template-columns:1fr}}
/* ===== sistema visual "gx" (referências de design oficiais) ===== */
.gx{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;--gold:#ffc83d}
.gx-iasd{position:absolute;right:calc(var(--u)*1.6);top:calc(var(--u)*1.6);z-index:3}
.gx-iasd .lb-iasd{position:static}
.gx .lb-brand{top:calc(var(--u)*.6)}
.gx-h{margin:calc(var(--u)*13) 0 0;font-size:calc(var(--u)*6.4);font-weight:900;line-height:1;background:linear-gradient(180deg,#fff 25%,#bcd0ff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 calc(var(--u)*.3) calc(var(--u)*.4) rgba(0,0,30,.6))}
.gx-h b{background:linear-gradient(180deg,#fff0a0,#ffc83d 50%,#e8860c);-webkit-background-clip:text;background-clip:text;color:transparent}
.gx-sub{margin:calc(var(--u)*.5) 0 calc(var(--u)*1.6);font-size:calc(var(--u)*1.9);color:#dfe8ff;opacity:.92}
.gx-tiles{display:grid;grid-template-columns:repeat(7,1fr);gap:calc(var(--u)*1.2);width:calc(var(--u)*96)}
.gx-tile{display:grid;grid-template-rows:auto auto 1fr auto;justify-items:center;text-align:center;gap:calc(var(--u)*.4);padding:calc(var(--u)*1.4) calc(var(--u)*.8) calc(var(--u)*1);min-height:calc(var(--u)*16.5);border-radius:calc(var(--u)*1.6);color:#fff;font-family:inherit;border:2px solid rgba(110,150,255,.35);background:linear-gradient(180deg,rgba(24,44,120,.86),rgba(9,20,70,.9));box-shadow:inset 0 0 calc(var(--u)*1.4) rgba(80,120,255,.2),0 calc(var(--u)*.6) calc(var(--u)*1.6) rgba(0,0,30,.5);cursor:pointer;transition:transform .15s}
.gx-tile:hover{transform:translateY(calc(var(--u)*-.3))}
.gx-tile .e{font-size:calc(var(--u)*5.6);line-height:1.1;filter:drop-shadow(0 0 calc(var(--u)*.8) rgba(255,190,60,.55))}
.gx-tile b{font-size:calc(var(--u)*1.75);line-height:1.1}.gx-tile small{font-size:calc(var(--u)*1.3);opacity:.85;line-height:1.2}
.gx-tile em{display:flex;align-items:center;gap:calc(var(--u)*.5);font-style:normal;font-size:calc(var(--u)*1.25);color:#cfe0ff}.gx-tile em svg{height:calc(var(--u)*1.5);width:auto;color:#5aa2ff}
.gx-tile.on{border-color:#ffc83d;background:linear-gradient(180deg,rgba(60,66,130,.9),rgba(14,24,76,.92));box-shadow:0 0 0 1px #ffc83d,0 0 calc(var(--u)*2.4) rgba(255,200,61,.55)}
.gx-opts{display:flex;gap:calc(var(--u)*4);justify-content:center;align-items:center;flex-wrap:wrap;margin-top:calc(var(--u)*1.8)}
.gx-opts>div{display:flex;align-items:center;gap:calc(var(--u)*.8)}.gx-opts span{font-size:calc(var(--u)*2.2);font-weight:800}
.gx-ch{padding:calc(var(--u)*.6) calc(var(--u)*1.6);border-radius:99px;font-weight:800;font-size:calc(var(--u)*1.7);font-family:inherit;color:#fff;background:rgba(20,36,100,.7);border:1px solid rgba(140,172,255,.4);cursor:pointer}
.gx-ch.on{background:linear-gradient(180deg,#ffd45a,#f5a623);color:#2a1a00;border-color:transparent;box-shadow:0 0 calc(var(--u)*1.4) rgba(255,200,61,.5)}
.gx-cta{display:flex;gap:calc(var(--u)*2);margin-top:calc(var(--u)*1.6);align-items:center;justify-content:center}
.gx-go{border:0;border-radius:calc(var(--u)*1.6);padding:calc(var(--u)*1.2) calc(var(--u)*5);font-family:inherit;font-size:calc(var(--u)*3);font-weight:900;color:#1c1406;background:linear-gradient(180deg,#ffd75e,#f5a623);box-shadow:0 0 calc(var(--u)*2.4) rgba(255,190,50,.5),inset 0 2px 0 rgba(255,255,255,.5);cursor:pointer}
.gx-ghost{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:calc(var(--u)*1.6);padding:calc(var(--u)*1.2) calc(var(--u)*3);font-family:inherit;font-size:calc(var(--u)*2.3);font-weight:700;color:#fff;background:rgba(30,46,110,.7);border:1px solid rgba(140,172,255,.35);cursor:pointer}
.gx-ghost svg{height:calc(var(--u)*2.6);width:auto;vertical-align:middle;margin-right:calc(var(--u)*.8)}.gx-ghost small{font-size:calc(var(--u)*1.2);opacity:.75;font-weight:500}
/* intro */
.gx-intro{justify-content:flex-start;text-align:center}
.gx-rc{margin-top:calc(var(--u)*1.4);display:grid;justify-items:center;gap:calc(var(--u)*.7);padding:calc(var(--u)*.9) calc(var(--u)*4);border-radius:99px;background:rgba(10,24,84,.7);border:1.5px solid rgba(140,172,255,.45)}
.gx-rc span{font-size:calc(var(--u)*2.3);font-weight:800;letter-spacing:.03em}.gx-rc span i{font-style:normal;color:#ffc83d}
.gx-dots{display:flex;gap:calc(var(--u)*.9)}.gx-dots i{width:calc(var(--u)*.9);height:calc(var(--u)*.9);border-radius:50%;background:rgba(255,255,255,.28)}.gx-dots i.on{background:#ffc83d;box-shadow:0 0 calc(var(--u)*.8) #ffc83d}.gx-dots i.dn{background:rgba(255,200,61,.55)}
.gx-ico{margin-top:calc(var(--u)*2.2);width:calc(var(--u)*24);height:calc(var(--u)*24);border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle,rgba(255,200,61,.22),transparent 68%);border:2px solid rgba(110,160,255,.4);box-shadow:0 0 calc(var(--u)*4) rgba(80,140,255,.4),inset 0 0 calc(var(--u)*3) rgba(80,140,255,.25);animation:lgboing 1s both}
.gx-ico span{font-size:calc(var(--u)*13);filter:drop-shadow(0 0 calc(var(--u)*1.4) rgba(255,200,61,.65))}
.gx-title{margin:calc(var(--u)*1) 0 0;font-size:calc(var(--u)*8.2);font-weight:900;line-height:1;white-space:nowrap}
.gx-title span{background:linear-gradient(180deg,#fff 20%,#7fb2ff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 calc(var(--u)*.3) calc(var(--u)*.3) rgba(0,0,40,.6))}
.gx-title b{background:linear-gradient(180deg,#fff0a0,#ffc83d 50%,#e8860c);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 calc(var(--u)*.8) rgba(255,190,50,.55))}
.gx-title em{font-style:normal;display:inline-block;vertical-align:middle;font-size:.42em;padding:.15em .6em;border-radius:99px;background:rgba(20,40,120,.8);border:2px solid rgba(140,172,255,.5);color:#fff;margin:0 .2em}
.gx-tag{margin-top:calc(var(--u)*.6);font-size:calc(var(--u)*1.9);letter-spacing:.5em;color:#cfd9ff;font-weight:600}
.gx-d{margin:calc(var(--u)*.6) 0 0;font-size:calc(var(--u)*2);opacity:.85}
.gx-prep{position:absolute;bottom:calc(var(--u)*4);left:50%;transform:translateX(-50%);width:calc(var(--u)*42);padding:calc(var(--u)*1.4) calc(var(--u)*2);border-radius:calc(var(--u)*1.6);background:rgba(10,24,84,.72);border:1.5px solid rgba(255,200,61,.5);display:grid;gap:calc(var(--u)*1)}
.gx-prep span{font-size:calc(var(--u)*2);font-weight:700}.gx-prep .bar{height:calc(var(--u)*1.1);border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden}
.gx-prep .bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ffd75e,#f5a623);transform-origin:left;animation:gxfill 2.3s linear both}
@keyframes gxfill{from{transform:scaleX(.04)}to{transform:scaleX(1)}}
/* placar parcial */
.gx-board{align-items:stretch}
.gb-hd{position:absolute;left:calc(var(--u)*7);top:calc(var(--u)*9);right:calc(var(--u)*7);height:calc(var(--u)*6);display:flex;align-items:center;gap:calc(var(--u)*1.4);padding:0 calc(var(--u)*2);border-radius:calc(var(--u)*1.6);background:rgba(10,24,84,.55);border:1px solid rgba(140,172,255,.25)}
.gb-hd .tr{font-size:calc(var(--u)*4.2)}.gb-hd h2{margin:0;font-size:calc(var(--u)*4.2);font-weight:900}.gb-hd i{width:2px;height:60%;background:rgba(255,255,255,.3)}
.gb-t{font-size:calc(var(--u)*2.8);font-weight:800;color:#ffc83d;flex:1}.gb-r{display:inline-flex;align-items:center;gap:calc(var(--u)*.8);padding:calc(var(--u)*.7) calc(var(--u)*2);border-radius:99px;background:rgba(10,24,84,.8);border:1px solid rgba(140,172,255,.4);font-size:calc(var(--u)*2);font-weight:700}.gb-r svg{height:calc(var(--u)*2);color:#ffc83d}
.gb-ans{position:absolute;top:calc(var(--u)*16);left:50%;transform:translateX(-50%);font-size:calc(var(--u)*2.6);font-weight:800;white-space:nowrap;padding:calc(var(--u)*.5) calc(var(--u)*2.4);border-radius:99px;background:rgba(10,24,84,.7);border:1px solid rgba(52,211,153,.55)}.gb-ans b{color:#34d399}.gb-ans small{margin-left:1em;font-size:.6em;opacity:.65;font-weight:600}
.gb-pod{position:absolute;left:calc(var(--u)*4);top:calc(var(--u)*20);width:calc(var(--u)*52);height:calc(var(--u)*27);display:grid;grid-template-columns:1fr 1.15fr 1fr;align-items:end;gap:calc(var(--u)*1.2)}
.gp{position:relative;display:grid;justify-items:center;align-content:end;gap:calc(var(--u)*.4);animation:lgin .6s both}
.gp-av{position:relative;width:calc(var(--u)*8.4);height:calc(var(--u)*8.4);border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#7b6df0,#3a2fa8);border:calc(var(--u)*.45) solid var(--rc);box-shadow:0 0 calc(var(--u)*2) var(--rc)}
.gp-av span{font-size:calc(var(--u)*4.6)}.gp-av i{position:absolute;bottom:calc(var(--u)*-1.2);left:50%;transform:translateX(-50%);width:calc(var(--u)*2.8);height:calc(var(--u)*2.8);border-radius:50%;background:var(--rc);color:#1a1200;font-style:normal;font-weight:900;font-size:calc(var(--u)*1.7);display:grid;place-items:center}
.gp.g{--rc:#ffc83d}.gp.s{--rc:#8ab4ff}.gp.b{--rc:#e0894a}.gp.g .gp-av{width:calc(var(--u)*10.4);height:calc(var(--u)*10.4)}
.gp .crown{position:absolute;top:calc(var(--u)*-4.2);font-size:calc(var(--u)*4.6);filter:drop-shadow(0 0 calc(var(--u)*1) #ffc83d)}
.gp-nm{margin-top:calc(var(--u)*1.2);font-size:calc(var(--u)*2.2);font-weight:800;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gp-pt{display:grid;justify-items:center;padding:calc(var(--u)*.6) calc(var(--u)*2);border-radius:calc(var(--u)*1);border:1.5px solid var(--rc);background:rgba(10,20,60,.7);min-width:calc(var(--u)*11)}
.gp-pt b{font-size:calc(var(--u)*3.6);line-height:1}.gp.g .gp-pt b{font-size:calc(var(--u)*4.4);color:#ffd75e}.gp-pt small{font-size:calc(var(--u)*1.3);opacity:.8}.gp-pt em{font-style:normal;color:#34d399;font-weight:900;font-size:calc(var(--u)*1.5)}
.gp-bs{width:100%;height:calc(var(--u)*5);border-radius:calc(var(--u)*1) calc(var(--u)*1) 0 0;background:linear-gradient(180deg,var(--rc),rgba(0,0,0,.35));opacity:.55;box-shadow:0 0 calc(var(--u)*2) var(--rc)}
.gp.g .gp-bs{height:calc(var(--u)*8)}.gp.s .gp-bs{height:calc(var(--u)*6)}.gp.b .gp-bs{height:calc(var(--u)*4)}
.gb-list{position:absolute;right:calc(var(--u)*4);top:calc(var(--u)*20);width:calc(var(--u)*37);display:grid;gap:calc(var(--u)*.8)}
.gr{position:relative;display:grid;grid-template-columns:auto auto 1fr auto;align-items:center;gap:calc(var(--u)*1);padding:calc(var(--u)*.8) calc(var(--u)*1.4);border-radius:calc(var(--u)*1.2);background:rgba(10,24,84,.7);border:1px solid rgba(140,172,255,.3);animation:lgin .5s both}
.gr .rk{font-size:calc(var(--u)*2.3);font-weight:800;width:calc(var(--u)*4);text-align:center}.gr .av{width:calc(var(--u)*4);height:calc(var(--u)*4);border-radius:50%;display:grid;place-items:center;font-size:calc(var(--u)*2.4);background:#4b3fcc}
.gr .nm b{display:block;font-size:calc(var(--u)*1.9)}.gr .tk{height:calc(var(--u)*.8);border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden;margin-top:calc(var(--u)*.4)}.gr .tk i{display:block;height:100%;background:linear-gradient(90deg,#8b5cf6,#f5b73a);border-radius:99px}
.gr .pt{display:grid;justify-items:end}.gr .pt b{font-size:calc(var(--u)*3)}.gr .pt small{font-size:calc(var(--u)*1.2);opacity:.75}
.gr .dl{position:absolute;right:calc(var(--u)*1);top:calc(var(--u)*-.9);padding:0 calc(var(--u)*.8);border-radius:99px;background:#34d399;color:#06281c;font-weight:900;font-size:calc(var(--u)*1.3)}
.gr-empty{display:grid;justify-items:center;padding:calc(var(--u)*3);border-radius:calc(var(--u)*1.6);background:rgba(10,24,84,.6);border:1px solid rgba(140,172,255,.3)}.gr-empty b{font-size:calc(var(--u)*4);color:#34d399}.gr-empty small{font-size:calc(var(--u)*1.8);opacity:.8}
.gb-bar{position:absolute;left:calc(var(--u)*4);right:calc(var(--u)*4);bottom:calc(var(--u)*2.4);height:calc(var(--u)*7.6);display:grid;grid-template-columns:1fr 1.1fr auto;align-items:center;gap:calc(var(--u)*2);padding:0 calc(var(--u)*2.4);border-radius:calc(var(--u)*1.6);background:rgba(10,24,84,.78);border:1.5px solid rgba(140,172,255,.4)}
.gb-l,.gb-m{display:flex;align-items:center;gap:calc(var(--u)*1.2)}.gb-m{display:grid;border-left:1px solid rgba(255,255,255,.25);padding-left:calc(var(--u)*2)}
.gb-l .cr{font-size:calc(var(--u)*4)}.gb-l small,.gb-m small{display:block;font-size:calc(var(--u)*1.6);opacity:.85}.gb-l b{font-size:calc(var(--u)*3.6)}.gb-m b{font-size:calc(var(--u)*2.2)}
.gb-n{display:grid;gap:calc(var(--u)*.6);justify-items:center}.gb-n .gx-go{font-size:calc(var(--u)*2.4);padding:calc(var(--u)*1) calc(var(--u)*3)}.gb-n .lg2-autobar{width:100%;height:4px}
/* entrar na partida (px: funciona no celular e no PC) */
.gx-join{justify-content:flex-start;overflow:auto;padding:16px 16px 28px;--u:min(1vw,1.7777vh)}
.gx-join .gx-iasd{position:absolute;right:12px;top:12px;transform:scale(.6);transform-origin:top right}
.gx-bp{display:grid;justify-items:center;gap:2px;margin-top:6px;pointer-events:none}
.gx-bp .pe svg{height:34px;width:auto;display:block}.gx-bp b{font-size:26px;line-height:.95;font-weight:900;text-align:center;background:linear-gradient(180deg,#fff 20%,#aebbe6);-webkit-background-clip:text;background-clip:text;color:transparent}.gx-bp b i{font-style:normal;background:linear-gradient(180deg,#fff0a0,#ffc83d 50%,#e8860c);-webkit-background-clip:text;background-clip:text;color:transparent}.gx-bp small{font-size:10px;letter-spacing:.5em;color:#cfd9ff}
.gj-hd,.gj-card,.gx-join .tm-pick,.gj-go,.gj-bt{width:min(760px,100%)}
.gj-hd{margin-top:14px;display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:18px;background:rgba(10,24,84,.7);border:1.5px solid rgba(140,172,255,.4)}
.gj-ic{width:50px;height:50px;border-radius:12px;display:grid;place-items:center;border:2px solid rgba(140,172,255,.6);background:rgba(20,40,120,.7);flex:none}.gj-ic svg{height:28px;color:#fff}
.gj-hd h2{margin:0;font-size:clamp(20px,5vw,38px);font-weight:900;letter-spacing:.02em}.gj-hd h2 b{color:#ffc83d}.gj-hd p{margin:2px 0 0;font-size:clamp(12px,3vw,17px);opacity:.9}
.gj-card{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px 14px;padding:14px;border-radius:18px;background:rgba(10,24,84,.62);border:1px solid rgba(140,172,255,.3)}
.gj-f label{display:block;font-size:12px;font-weight:800;letter-spacing:.06em;color:#7fb2ff;margin-bottom:6px}
.gj-in{display:flex;align-items:center;gap:10px;padding:0 14px;height:52px;border-radius:12px;background:rgba(8,18,60,.8);border:1.5px solid rgba(140,172,255,.4)}.gj-in:focus-within{border-color:#4aa3ff;box-shadow:0 0 14px rgba(74,163,255,.5)}
.gj-in svg{height:22px;width:auto;color:#6aa7ff;flex:none}.gj-in input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font:inherit;font-size:20px}.gj-in input::placeholder{color:rgba(190,205,255,.45)}
.gj-av{grid-column:1/-1;display:flex;gap:8px;overflow-x:auto;padding:2px 2px 4px;scrollbar-width:none}.gj-av::-webkit-scrollbar{display:none}
.gj-av button{flex:none;width:46px;height:46px;border-radius:12px;font-size:24px;background:rgba(20,36,100,.8);border:1.5px solid rgba(140,172,255,.3);cursor:pointer}.gj-av button.on{border-color:#ffc83d;box-shadow:0 0 12px rgba(255,200,61,.6)}
.gj-go{margin-top:14px;padding:14px;font-size:clamp(20px,4.6vw,30px)!important;border-radius:16px}
.gj-bt{margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.gj-wait{display:flex;align-items:center;gap:10px;font-size:13px}.gj-wait svg{height:30px;color:#6aa7ff}.gj-wait b{display:block}.gj-wait small{opacity:.75}
.gj-bt .gx-ghost{font-size:16px;padding:10px 18px;border-radius:14px}.gj-bt .gx-ghost small{font-size:11px}
@media(max-width:560px){.gj-card{grid-template-columns:1fr}.gj-wait{display:none}.gj-bt{justify-content:center}}
@media(max-width:900px){.gx-setup,.gx-intro,.gx-board{position:relative;inset:auto;min-height:100%;padding-bottom:24px}.gx-h{margin-top:calc(var(--u)*5)}.gx-tiles{grid-template-columns:repeat(2,1fr);width:92%}.gx-tile{min-height:140px}.gx-tile .e{font-size:44px}.gx-tile b{font-size:17px}.gx-tile small,.gx-tile em{font-size:12px}.gx-h{font-size:40px}.gx-sub{font-size:15px}.gx-opts span,.gx-ch{font-size:15px}.gx-go{font-size:22px}.gx-ghost{font-size:17px}.lg2-body.lb{overflow:auto}}
/* ajustes de escala (referência 1672px = 100u) */
.gx .gx-h{margin:calc(var(--u)*12.6) 0 0;font-size:calc(var(--u)*4.4)}
.gx .gx-sub{font-size:calc(var(--u)*1.5);margin:calc(var(--u)*.3) 0 calc(var(--u)*1.2)}
.gx .gx-tiles{width:calc(var(--u)*96.5)}
.gx .gx-tile{min-height:calc(var(--u)*16.4);padding:calc(var(--u)*1.2) calc(var(--u)*.6) calc(var(--u)*.9)}
.gx .gx-tile .e{font-size:calc(var(--u)*5.6)}.gx .gx-tile b{font-size:calc(var(--u)*1.32)}.gx .gx-tile small{font-size:calc(var(--u)*1.02)}.gx .gx-tile em{font-size:calc(var(--u)*1)}.gx .gx-tile em svg{height:calc(var(--u)*1.2)}
.gx .gx-opts{margin-top:calc(var(--u)*1.2);gap:calc(var(--u)*3)}.gx .gx-opts span{font-size:calc(var(--u)*1.6)}.gx .gx-ch{font-size:calc(var(--u)*1.3);padding:calc(var(--u)*.5) calc(var(--u)*1.4)}
.gx .gx-cta{margin-top:calc(var(--u)*1.2)}.gx .gx-go{font-size:calc(var(--u)*2.2);padding:calc(var(--u)*.9) calc(var(--u)*3.6)}.gx .gx-ghost{font-size:calc(var(--u)*1.7);padding:calc(var(--u)*.9) calc(var(--u)*2.4)}.gx .gx-ghost svg{height:calc(var(--u)*2)}
.gx .gx-title{margin:calc(var(--u)*1) 0 0;font-size:calc(var(--u)*6.4)}.gx .gx-ico{width:calc(var(--u)*21);height:calc(var(--u)*21)}.gx .gx-ico span{font-size:calc(var(--u)*11)}
.gx .gx-rc span{font-size:calc(var(--u)*1.8)}.gx .gx-tag{font-size:calc(var(--u)*1.5)}.gx .gx-d{font-size:calc(var(--u)*1.6)}
.gx .gx-prep{width:calc(var(--u)*36);bottom:calc(var(--u)*3.4)}.gx .gx-prep span{font-size:calc(var(--u)*1.6)}
.gx .gb-hd h2{font-size:calc(var(--u)*3.4)}.gx .gb-hd .tr{font-size:calc(var(--u)*3.4)}.gx .gb-t{font-size:calc(var(--u)*2.2)}.gx .gb-r{font-size:calc(var(--u)*1.6)}.gx .gb-ans{font-size:calc(var(--u)*2)}
.gx .gp-nm{font-size:calc(var(--u)*1.8)}.gx .gp-pt b{font-size:calc(var(--u)*3)}.gx .gp.g .gp-pt b{font-size:calc(var(--u)*3.6)}
.gx .gr .nm b{font-size:calc(var(--u)*1.5)}.gx .gr .pt b{font-size:calc(var(--u)*2.3)}.gx .gr .rk{font-size:calc(var(--u)*1.8)}
.gx .gb-l b{font-size:calc(var(--u)*2.8)}.gx .gb-l small,.gx .gb-m small{font-size:calc(var(--u)*1.3)}.gx .gb-m b{font-size:calc(var(--u)*1.8)}.gx .gb-n .gx-go{font-size:calc(var(--u)*1.9)}
.gx .gj-hd{margin-top:14px}.gx .gj-hd h2{margin:0}
@media(max-width:900px){.gx .gx-h{font-size:40px;margin-top:calc(var(--u)*5)}.gx .gx-tile b{font-size:17px}.gx .gx-tile small,.gx .gx-tile em{font-size:12px}.gx .gx-sub{font-size:15px}.gx .gx-opts span,.gx .gx-ch{font-size:15px}.gx .gx-go{font-size:22px}.gx .gx-ghost{font-size:17px}.gx .gx-tiles{width:92%}.gx .gx-title{font-size:32px;white-space:normal}.gx .gx-ico{width:130px;height:130px}.gx .gx-ico span{font-size:70px}}
.gx .lb-brand.stack h1{font-size:calc(var(--u)*2.7)}.gx .lb-brand .pe svg{height:calc(var(--u)*3.4)}.gx .lb-brand small{font-size:calc(var(--u)*.8);margin-top:calc(var(--u)*.3)}
.gx .gx-h{margin-top:calc(var(--u)*12.3)}
.gx-tiles .gx-tile:nth-child(8){min-height:calc(var(--u)*12.4);grid-template-rows:auto auto auto auto}.gx-tiles .gx-tile:nth-child(8) .e{font-size:calc(var(--u)*4.4)}
.gx-side{grid-column:2/8;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:calc(var(--u)*.8)}
.gx-side .gx-opts,.gx-side .gx-cta{margin-top:0}
.gx-opts>div{flex-wrap:wrap;justify-content:center}
.gx-cta .gx-ghost{flex-direction:row}
.gx .lb-brand.stack h1{font-size:calc(var(--u)*2.4)}.gx .lb-brand .pe svg{height:calc(var(--u)*3)}
.gx .gb-hd{top:calc(var(--u)*10.2);height:calc(var(--u)*5.6)}
.gx .gb-ans{top:calc(var(--u)*16.6);font-size:calc(var(--u)*1.8);padding:calc(var(--u)*.3) calc(var(--u)*2)}
.gx .gb-pod{top:calc(var(--u)*21);height:calc(var(--u)*24.4);width:calc(var(--u)*54)}
.gx .gb-list{top:calc(var(--u)*21)}
.gx .gp-av{width:calc(var(--u)*6.6);height:calc(var(--u)*6.6)}.gx .gp.g .gp-av{width:calc(var(--u)*8.2);height:calc(var(--u)*8.2)}.gx .gp-av span{font-size:calc(var(--u)*3.6)}.gx .gp.g .gp-av span{font-size:calc(var(--u)*4.4)}
.gx .gp-av i{width:calc(var(--u)*2.4);height:calc(var(--u)*2.4);font-size:calc(var(--u)*1.4);bottom:calc(var(--u)*-1)}
.gx .gp .crown{top:calc(var(--u)*-3.4);font-size:calc(var(--u)*3.6)}
.gx .gp-nm{margin-top:calc(var(--u)*.9);font-size:calc(var(--u)*1.6)}.gx .gp-pt{padding:calc(var(--u)*.3) calc(var(--u)*1.6)}.gx .gp-pt b{font-size:calc(var(--u)*2.6)}.gx .gp.g .gp-pt b{font-size:calc(var(--u)*3.2)}.gx .gp-pt small{font-size:calc(var(--u)*1.1)}.gx .gp-pt em{font-size:calc(var(--u)*1.2)}
.gx .gp.g .gp-bs{height:calc(var(--u)*3.4)}.gx .gp.s .gp-bs{height:calc(var(--u)*2.4)}.gx .gp.b .gp-bs{height:calc(var(--u)*1.6)}
.lg2-qv.vf .lg2-qcard{flex:1 1 auto;display:grid;align-content:center;gap:calc(var(--u)*.6)}
.vfc small{font-size:calc(var(--u)*1.8);opacity:.85}.vfc h2{font-size:calc(var(--u)*5.2)!important}.vfc h2 span{color:#ffd24a}
.lg2-qv.vf .lg2-ans.two{flex:0 0 auto;grid-auto-rows:calc(var(--u)*9.4)}
.lg2-qv.vf .lg2-a{justify-content:center;gap:calc(var(--u)*2)}
.lg2-qv.vf .lg2-a i{width:calc(var(--u)*6.4);height:calc(var(--u)*6.4);border-radius:50%;border:calc(var(--u)*.3) solid rgba(255,255,255,.9);font-size:calc(var(--u)*3.6);background:rgba(0,0,0,.28);box-shadow:0 0 calc(var(--u)*1.2) rgba(255,255,255,.35)}
.lg2-qv.vf .lg2-a span{flex:none;font-size:calc(var(--u)*3.4);font-weight:900;text-transform:uppercase;letter-spacing:.02em}
.vfp{display:grid;gap:6px;text-align:center;padding:16px 12px;border-radius:18px;background:rgba(10,24,84,.6);border:1px solid rgba(140,172,255,.35)}
.vfp small{font-size:14px;font-weight:600;opacity:.85}.vfp b{font-size:clamp(28px,8vw,40px);color:#ffd24a;line-height:1.1}
.lg2-ph-ans .lg2-a.tfT,.lg2-ph-ans .lg2-a.tfF{justify-content:center;min-height:84px;font-weight:900;text-transform:uppercase;letter-spacing:.02em}
.lg2-ph-ans .lg2-a.tfT i,.lg2-ph-ans .lg2-a.tfF i{width:48px;height:48px;border-radius:50%;border:3px solid rgba(255,255,255,.9);font-size:26px;background:rgba(0,0,0,.28)}
.lg2-phone>.ph-brand{margin-top:0}
.lb-brand{position:absolute;left:50%;top:calc(var(--u)*1);transform:translateX(-50%);display:grid;justify-items:center;text-align:center;line-height:1}
.lb-brand .pe svg{height:calc(var(--u)*4.7);width:auto;display:block;filter:drop-shadow(0 0 calc(var(--u)*.7) rgba(248,170,40,.55))}
.lb-brand h1{margin:calc(var(--u)*.6) 0 0;font-size:calc(var(--u)*4.7);font-weight:900;letter-spacing:.005em;white-space:nowrap;line-height:1}
.lb-brand h1 span{background:linear-gradient(180deg,#fff 20%,#aebbe6);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 calc(var(--u)*.25) calc(var(--u)*.3) rgba(0,0,30,.55))}
.lb-brand h1 b{background:linear-gradient(180deg,#fff0a0 0%,#ffc83d 45%,#e8860c 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 calc(var(--u)*.6) rgba(245,170,40,.6)) drop-shadow(0 calc(var(--u)*.25) calc(var(--u)*.3) rgba(60,20,0,.6))}
.lb-brand small{margin-top:calc(var(--u)*.7);font-size:calc(var(--u)*1.25);letter-spacing:.5em;padding-left:.5em;font-weight:600;color:#cfd9ff;opacity:.9}
.lb-brand.stack h1{display:grid;font-size:calc(var(--u)*3.4);margin-top:calc(var(--u)*.3);line-height:.98}.lb-brand.stack h1 b{font-size:1.08em}
.lb-brand.stack small{display:flex;align-items:center;gap:calc(var(--u)*1);font-size:calc(var(--u)*.95);margin-top:calc(var(--u)*.6)}
.lb-brand.stack small:before,.lb-brand.stack small:after{content:'';width:calc(var(--u)*4.4);height:1px;background:linear-gradient(90deg,transparent,rgba(190,205,255,.7))}.lb-brand.stack small:after{transform:scaleX(-1)}
.lb-ac{position:absolute;right:0;top:calc(var(--u)*3.9);display:grid;gap:calc(var(--u)*.6);justify-items:end}
.lb-r2{display:flex;gap:calc(var(--u)*.6)}
.lb-mode{font-style:normal;font-size:calc(var(--u)*1.15);font-weight:800;opacity:.85}
.lg2-lb .lg2-btn{font-size:calc(var(--u)*1.2);padding:calc(var(--u)*.65) calc(var(--u)*1.3);border-radius:calc(var(--u)*1);white-space:nowrap}
.lg2-lb .lg2-btn.gold{font-size:calc(var(--u)*1.55);padding:calc(var(--u)*.85) calc(var(--u)*1.9)}
.lb-card{border-radius:calc(var(--u)*2);background:linear-gradient(160deg,rgba(26,56,150,.58),rgba(9,22,84,.66));border:1px solid rgba(140,172,255,.3);box-shadow:inset 0 0 calc(var(--u)*3) rgba(90,130,255,.12),0 calc(var(--u)*1.5) calc(var(--u)*4) rgba(0,0,14,.4)}
.lb-cd{display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;justify-items:center;align-items:center;padding:calc(var(--u)*1.3) calc(var(--u)*1.5) calc(var(--u)*1.1);min-height:0}
.lg2-lb h3{margin:0;font-size:calc(var(--u)*2.15);font-weight:800;letter-spacing:.13em}
.lg2-lb .lg2-code{font-size:calc(var(--u)*8);letter-spacing:.01em;line-height:1.02;font-weight:900;background:linear-gradient(180deg,#fff3ad 0%,#ffc83d 50%,#e8860c 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 calc(var(--u)*1.5) rgba(255,190,60,.6))}
.lb-qb{display:grid;place-items:center;min-height:0;width:100%}
.lg2-lb .lg2-qr{width:calc(var(--u)*20.6);height:calc(var(--u)*20.6);aspect-ratio:1;padding:calc(var(--u)*.7);border-radius:calc(var(--u)*1.6);background:#fff;box-shadow:0 0 0 calc(var(--u)*.22) #5aa0ff,0 0 calc(var(--u)*3) rgba(80,150,255,.9)}
.lb-sc{display:flex;align-items:center;gap:calc(var(--u)*1.2)}.lb-sc svg{height:calc(var(--u)*3.9);width:auto;color:#dce6ff}
.lb-sc b{display:block;font-size:calc(var(--u)*1.85);font-weight:800;letter-spacing:.02em}.lb-sc small{display:block;font-size:calc(var(--u)*1.25);letter-spacing:.2em;color:#aab9e8;font-weight:600}
.lb-rt{display:flex;flex-direction:column;gap:calc(var(--u)*.9);min-height:0}
.lb-ct{display:flex;align-items:center;justify-content:center;gap:calc(var(--u)*1.5);height:calc(var(--u)*7.5);flex:none}
.lb-ct svg{height:calc(var(--u)*4.4);width:auto;color:#eef3ff}
.lb-ct b{font-size:calc(var(--u)*5.4);line-height:1;font-weight:900;background:linear-gradient(180deg,#9be1ff,#1d9bf0);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 calc(var(--u)*.8) rgba(40,170,255,.65))}
.lb-ct span{font-size:calc(var(--u)*2.3);font-weight:700}
.lb-wt{flex:none;text-align:center;font-size:calc(var(--u)*1.15);letter-spacing:.4em;padding-left:.4em;color:#b9c6ee;font-weight:600}
.lg2-lb .lg2-ppl{flex:0 1 auto;min-height:0;overflow:hidden;gap:calc(var(--u)*.7);align-content:flex-start;width:100%}
.lg2-lb .lg2-ppl:empty{display:none}
.lg2-lb .lg2-pp{font-size:calc(var(--u)*1.55);padding:calc(var(--u)*.35) calc(var(--u)*1.1) calc(var(--u)*.35) calc(var(--u)*.35)}
.lb-hw{flex:1 1 0;min-height:0;display:flex;flex-direction:column;justify-content:space-between;padding:calc(var(--u)*2) calc(var(--u)*2.6) calc(var(--u)*1.6)}
.lb-hw h3{font-size:calc(var(--u)*2.3);font-weight:800;letter-spacing:.01em}
.lb-st{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:calc(var(--u)*1.2)}
.lb-n{width:calc(var(--u)*4.2);height:calc(var(--u)*4.2);border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,#4f9bff,#1459dd 70%);font-weight:800;font-size:calc(var(--u)*2.1);box-shadow:0 0 calc(var(--u)*1.4) rgba(60,130,255,.65),inset 0 calc(var(--u)*.15) 0 rgba(255,255,255,.4)}
.lb-ic{width:calc(var(--u)*4.2);height:calc(var(--u)*4.2);border-radius:50%;display:grid;place-items:center;background:rgba(18,36,110,.7);border:1px solid rgba(150,180,255,.35);color:#dbe6ff}.lb-ic svg{width:52%;height:52%}
.lb-st b{display:block;font-size:calc(var(--u)*1.65);font-weight:800;line-height:1.15;letter-spacing:.005em}.lb-st small{display:block;font-size:calc(var(--u)*1.25);color:#b3c1ee;line-height:1.25;margin-top:calc(var(--u)*.15)}
.lg2-lb.many .lb-hw{display:none}.lg2-lb.many .lg2-ppl{flex:1 1 0}
/* pergunta (referência 2) */
.lg2-lb.lg2-qv{display:flex;flex-direction:column;gap:calc(var(--u)*1.1);padding:0 calc(var(--u)*5.25) calc(var(--u)*2.8)}
.qv-top{position:relative;flex:none;height:calc(var(--u)*14.8)}
.qv-top .lb-brand{top:calc(var(--u)*1.1)}
.qv-l{position:absolute;left:calc(var(--u)*-1.6);bottom:calc(var(--u)*2.4)}
.qv-r{position:absolute;right:calc(var(--u)*-3.7);top:calc(var(--u)*1.2);display:grid;justify-items:end;gap:calc(var(--u)*1.9)}
.qv-r .lb-iasd{position:static}
.qv-row{display:flex;align-items:center;gap:calc(var(--u)*2.6)}
.qv-pill{display:inline-flex;align-items:center;gap:calc(var(--u)*1);height:calc(var(--u)*3.4);padding:0 calc(var(--u)*2);border-radius:99px;background:rgba(10,24,84,.72);border:1px solid rgba(140,172,255,.35);font-size:calc(var(--u)*1.6);font-weight:700;box-shadow:inset 0 0 calc(var(--u)*1.4) rgba(90,130,255,.15)}
.qv-pill svg{height:calc(var(--u)*2.1);width:auto}
.qv-pill.gold{border-color:rgba(245,183,58,.75);color:#ffc83d;font-weight:800;padding:0 calc(var(--u)*2.2);gap:calc(var(--u)*.9);box-shadow:0 0 calc(var(--u)*1.2) rgba(245,183,58,.25),inset 0 0 calc(var(--u)*1.4) rgba(245,183,58,.12)}
.qv-pill.gold i{width:1px;height:calc(var(--u)*1.9);background:rgba(255,255,255,.35);margin:0 calc(var(--u)*.5)}.qv-pill.gold span{color:#fff;font-weight:700}
.qv-pill #lg-count b{color:#2fb4ff;font-size:1.2em;margin-right:.25em}.qv-pill svg{color:#cfe0ff}
.lg2-qv .lg2-ring{width:calc(var(--u)*6.8);margin:0}
.lg2-qv .lg2-ring svg{filter:drop-shadow(0 0 calc(var(--u)*.8) rgba(245,183,58,.5))}
.lg2-qv .lg2-ring circle{stroke-width:7}.lg2-qv .lg2-ring .tr{stroke:rgba(245,183,58,.22)}.lg2-qv .lg2-ring .pg{stroke:#f5b73a}
.lg2-qv .lg2-ring:before{content:'';position:absolute;inset:8%;border-radius:50%;background:radial-gradient(circle,#0a1650 55%,#09123f)}
.lg2-qv .lg2-ring b{font-size:calc(var(--u)*3.3);font-weight:900;z-index:1}
.lg2-qv .lg2-qcard{flex:0 0 auto;margin:0 calc(var(--u)*1.1);padding:calc(var(--u)*1.7) calc(var(--u)*3);border-radius:calc(var(--u)*2.2);min-height:calc(var(--u)*10.9);display:grid;align-content:center;background:linear-gradient(180deg,rgba(34,66,170,.6),rgba(10,26,96,.78));border:1px solid rgba(150,180,255,.5);box-shadow:0 0 calc(var(--u)*2.4) rgba(80,130,255,.3),inset 0 calc(var(--u)*.12) 0 rgba(255,255,255,.22)}
.lg2-qv .lg2-qcard h2{font-size:calc(var(--u)*2.8);font-weight:800;line-height:1.25}
.lg2-qv .lg2-qcard h2[data-len=l]{font-size:calc(var(--u)*2.45)}.lg2-qv .lg2-qcard h2[data-len=xl]{font-size:calc(var(--u)*2.05)}
.lg2-qv .lg2-qcard .ref{font-size:calc(var(--u)*1.4)}
.lg2-qv .lg2-clues p{font-size:calc(var(--u)*2.2)}
.lg2-qv .lg2-flash{min-height:calc(var(--u)*12)}.lg2-qv .lg2-flash .grid{font-size:calc(var(--u)*7)}.lg2-qv .lg2-flash .one{font-size:calc(var(--u)*11)}
.lg2-qv .lg2-ans{flex:1 1 0;min-height:0;gap:calc(var(--u)*1.1) calc(var(--u)*1.6);grid-auto-rows:minmax(0,1fr)}
.lg2-qv .lg2-a{min-height:0;font-size:calc(var(--u)*2.3);font-weight:700;padding:0 calc(var(--u)*2) 0 calc(var(--u)*2);gap:calc(var(--u)*1.7);border-radius:calc(var(--u)*2)}
.lg2-qv .lg2-a i{width:calc(var(--u)*5.8);height:calc(var(--u)*5.8);border-radius:calc(var(--u)*1.3);font-size:calc(var(--u)*2.6);background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.28);box-shadow:inset 0 0 calc(var(--u)*1.2) rgba(0,0,0,.3)}
.qv-bot{flex:none;display:flex;justify-content:center;height:calc(var(--u)*3.8);margin-top:calc(var(--u)*.4)}
.lg2-qv .lg2-btn.qv-show{display:inline-flex;align-items:center;gap:calc(var(--u)*1);font-size:calc(var(--u)*1.65);font-weight:700;padding:0 calc(var(--u)*3);border-radius:99px;background:rgba(10,24,84,.72);border:1px solid rgba(140,172,255,.4)}.qv-show svg{height:calc(var(--u)*2.2);width:auto}
/* blocos de resposta neon (telão e celular) */
.lg2-a{border:2px solid var(--nb,#fff);box-shadow:0 0 26px var(--ng,rgba(255,255,255,.3)),inset 0 0 22px rgba(255,255,255,.16),inset 0 2px 0 rgba(255,255,255,.4);overflow:hidden}
.lg2-a:before{content:'';position:absolute;right:0;top:0;bottom:0;width:48%;pointer-events:none;background:radial-gradient(ellipse at 78% 58%,rgba(255,255,255,.34),transparent 62%);mix-blend-mode:soft-light}
.lg2-a.c0,.lg2-a.tfF{--nb:#ff6b86;--n1:#f2334f;--n2:#a60f2b;--ng:rgba(255,60,95,.5)}
.lg2-a.c1{--nb:#6fb0ff;--n1:#2f7bf2;--n2:#1239ad;--ng:rgba(70,135,255,.5)}
.lg2-a.c2{--nb:#ffd25c;--n1:#f6a50f;--n2:#b3600a;--ng:rgba(255,185,40,.5)}
.lg2-a.c3,.lg2-a.tfT{--nb:#62f2a4;--n1:#16b96c;--n2:#066b3d;--ng:rgba(40,230,140,.5)}
.lg2-a.c0,.lg2-a.c1,.lg2-a.c2,.lg2-a.c3,.lg2-a.tfT,.lg2-a.tfF{background:linear-gradient(135deg,var(--n1),var(--n2))}
.lg2-a.ok{box-shadow:0 0 0 5px #fff,0 0 60px rgba(52,211,153,.95)}
/* botão Sair */
.lg2.host .lg2-chrome .lg2-ic:not(.sair){position:fixed;bottom:12px;right:12px;z-index:5}.lg2.host .lg2-chrome .lg2-ic:not(.sair):nth-last-child(2){right:62px}.lg2.host .lg2-chrome .lg2-ic:not(.sair):nth-last-child(3){right:112px}
.lg2-chrome .lg2-ic.sair{width:auto;padding:0 18px;height:42px;display:inline-flex;align-items:center;gap:8px;border-radius:99px;font-weight:700;font-size:15px;background:rgba(10,24,84,.72);border:1px solid rgba(140,172,255,.35)}
@media (max-width:800px){.lg2-body.lb{overflow:auto}.lg2-lb{--u:2.4vw;position:relative;inset:auto;height:auto;grid-template-columns:1fr;grid-template-rows:none;padding:0 calc(var(--u)*3) calc(var(--u)*3)}.lb-hd{height:auto;display:grid;justify-items:center;gap:calc(var(--u)*1.5);padding-top:calc(var(--u)*5)}.lb-hd .lb-iasd,.lb-brand,.lb-ac{position:static;transform:none}.lb-ac{justify-items:center}.lb-cd{gap:calc(var(--u)*1.5)}.lg2-lb .lg2-qr{width:calc(var(--u)*44);height:calc(var(--u)*44)}.lb-rt{margin-top:calc(var(--u)*2)}}
/* ===== Celular: criar sala (escolha do jogo + sala de espera) ===== */
@media (max-width:820px){
 .lg2 .gx-setup{position:relative!important;inset:auto!important;width:100%;min-height:100%;box-sizing:border-box;padding:0 14px calc(28px + env(safe-area-inset-bottom,0px))!important;align-items:stretch!important}
 .lg2 .gx-setup .gx-iasd,.lg2 .gx-setup .lb-brand{display:none!important}
 .lg2 .gx-setup .gx-h{font-size:30px!important;margin:8px 0 0!important;text-align:center;line-height:1.1}
 .lg2 .gx-setup .gx-sub{font-size:14px!important;text-align:center;margin:6px 0 14px!important}
 .lg2 .gx-setup .gx-tiles{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;max-width:none!important}
 .lg2 .gx-setup .gx-tile,.lg2 .gx-setup .gx-tiles .gx-tile:nth-child(8){min-height:116px!important;padding:12px 10px!important;gap:3px!important;grid-template-rows:none!important;display:flex!important;flex-direction:column;align-items:center;justify-content:center;text-align:center}
 .lg2 .gx-setup .gx-tile .e{font-size:30px!important}.lg2 .gx-setup .gx-tile b{font-size:15.5px!important;line-height:1.15}.lg2 .gx-setup .gx-tile small{font-size:12px!important;line-height:1.2}.lg2 .gx-setup .gx-tile em{font-size:11px!important}
 .lg2 .gx-setup .gx-side{grid-column:1/-1!important;display:grid!important;gap:14px!important;margin-top:6px;width:100%}
 .lg2 .gx-setup .gx-opts{display:grid!important;gap:12px!important;margin:0!important;justify-content:stretch!important}
 .lg2 .gx-setup .gx-opts>div{display:flex;flex-wrap:wrap;justify-content:flex-start;align-items:center;gap:8px}
 .lg2 .gx-setup .gx-opts span{width:100%;font-size:14px!important;opacity:.85}
 .lg2 .gx-setup .gx-ch{font-size:14px!important;padding:8px 14px!important}
 .lg2 .gx-setup .gx-cta{display:grid!important;gap:10px!important;width:100%;margin:0!important}
 .lg2 .gx-setup .gx-go,.lg2 .gx-setup .gx-ghost{width:100%;justify-content:center;font-size:18px!important;padding:14px 16px!important;min-height:52px;box-sizing:border-box}
 /* sala de espera */
 .lg2-body.lb{overflow-y:auto!important;overflow-x:hidden!important}
 .lg2 .lg2-lb{--u:3.4vw;width:100%;box-sizing:border-box;padding:56px 14px calc(24px + env(safe-area-inset-bottom,0px))!important;gap:14px!important}
 .lg2 .lb-hd{padding-top:0!important;gap:10px!important}
 .lg2 .lb-hd .lb-iasd{transform:scale(.8);transform-origin:center}
 .lg2 .lb-brand h1{font-size:clamp(26px,9vw,38px)!important;white-space:nowrap}
 .lg2 .lb-brand small{font-size:11px!important}
 .lg2 .lb-ac{width:100%}.lg2 .lb-ac .lg2-btn.gold{width:100%;font-size:18px!important;padding:14px!important}
 .lg2 .lb-r2{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;width:100%}.lg2 .lb-r2 .lg2-btn{font-size:14px!important;padding:10px!important;justify-content:center}
 .lg2 .lb-cd h3{font-size:14px!important}
 .lg2 .lb-cd .lg2-code{font-size:clamp(44px,16vw,64px)!important;line-height:1}
 .lg2 .lb-qb{width:min(62vw,240px)!important;margin:0 auto}
 .lg2 .lg2-lb .lg2-qr{width:100%!important;height:auto!important;aspect-ratio:1}
 .lg2 .lb-sc{font-size:13px}.lg2 .lb-sc b{font-size:14px!important}
 .lg2 .lb-ct{font-size:16px}.lg2 .lb-ct b{font-size:30px!important}
 .lg2 .lb-hw{padding:14px!important}.lg2 .lb-hw h3{font-size:15px!important}.lg2 .lb-st b{font-size:14px!important}.lg2 .lb-st small{font-size:12.5px!important}
 .lg2 .lb-tm h4{font-size:15px!important}
}
@media (max-width:820px){
 .lg2 .gx-setup{padding-top:62px!important}
 .lg2 .gx-setup .gx-side,.lg2 .gx-setup .gx-cta{max-width:none!important;width:100%!important;align-items:stretch!important}
 .lg2 .gx-setup .gx-go,.lg2 .gx-setup .gx-ghost{display:flex;align-items:center;gap:8px}
 .lg2 .lb-sc{display:flex;align-items:center;gap:10px;letter-spacing:0!important}.lg2 .lb-sc small{letter-spacing:.04em!important;font-size:12px!important}.lg2 .lb-sc svg{width:30px;height:30px;flex:none}
 .lg2 .lb-ct{display:flex;align-items:center;gap:10px}.lg2 .lb-ct span{font-size:15px!important;letter-spacing:0!important}.lg2 .lb-ct svg{width:30px;height:24px;flex:none}
 .lg2 .lb-wt{font-size:12px!important;letter-spacing:.08em!important;text-align:center;display:block}
 .lg2 .lb-hw h3{margin:0 0 10px!important;padding:0!important;line-height:1.2;position:static!important;transform:none!important}
 .lg2 .lb-hw{display:grid;gap:10px;overflow:visible!important}
 .lg2 .lb-st{display:grid;grid-template-columns:36px 36px 1fr;gap:10px;align-items:center}.lg2 .lb-st .lb-n,.lg2 .lb-st .lb-ic{width:36px;height:36px;font-size:16px}
 .lg2 .lb-st b{display:block;font-size:13.5px!important;line-height:1.2}.lg2 .lb-st small{display:block;margin-top:2px}
}
@media (max-width:820px){.lg2 .lb-hw,.lg2 .lb-rt,.lg2 .lb-cd,.lg2 .lb-card{height:auto!important;min-height:0!important;max-height:none!important}.lg2 .lb-rt{display:grid;gap:12px}}
/* ===== ARENA: novo visual do Jogo Coletivo (fundo, botões, cartões e respostas) ===== */
@keyframes lgspin{to{transform:rotate(360deg)}}@keyframes lgtwk{0%,100%{opacity:.35}50%{opacity:1}}
.lg2{--ar-pink:#f472b6;--ar-cyan:#22d3ee;--ar-gold:#ffd24a;--ar-vio:#7c3aed;--ar-font:'Fredoka','Inter',system-ui,sans-serif;
 background:radial-gradient(900px 620px at 8% -10%,rgba(236,72,153,.42),transparent 62%),radial-gradient(900px 640px at 108% 4%,rgba(34,211,238,.30),transparent 60%),radial-gradient(1100px 720px at 50% 125%,rgba(124,58,237,.62),transparent 62%),linear-gradient(170deg,#14053f 0%,#1d0b57 46%,#0a0832 100%)!important}
.lg2::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.55;background-image:radial-gradient(rgba(255,255,255,.2) 1.2px,transparent 1.7px),radial-gradient(rgba(255,255,255,.09) 1px,transparent 1.5px);background-size:48px 48px,24px 24px;background-position:0 0,12px 12px;-webkit-mask-image:radial-gradient(ellipse at 50% 42%,#000 18%,transparent 78%);mask-image:radial-gradient(ellipse at 50% 42%,#000 18%,transparent 78%)}
.lg2::after{content:'';position:absolute;z-index:-1;left:50%;top:46%;width:190vmax;height:190vmax;margin:-95vmax 0 0 -95vmax;pointer-events:none;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.055) 0 6deg,transparent 6deg 20deg);-webkit-mask-image:radial-gradient(circle,#000 0,transparent 42%);mask-image:radial-gradient(circle,#000 0,transparent 42%);animation:lgspin 120s linear infinite}
.lg2-body.lb,.lg2-body.bgx{background:var(--lgbg,none)!important}
.lg2-body.cl::before,.lg2-body.qz::before,.lg2-body.cl::after{display:none!important}
.lg2-bg i{width:36vmin;height:36vmin;background:radial-gradient(circle,rgba(244,114,182,.24),transparent 66%)}
.lg2-bg i:nth-child(3n){background:radial-gradient(circle,rgba(34,211,238,.22),transparent 66%)}
.lg2-bg i:nth-child(3n+1){background:radial-gradient(circle,rgba(255,210,74,.16),transparent 66%)}
/* títulos com cara de jogo */
.lg2 h1,.lg2 h2,.lg2 .gx-h,.lg2 .lg2-hero,.lg2 .lg2-code,.lg2 .lb-brand h1,.lg2 .lg2-qcard h2{font-family:var(--ar-font)!important;letter-spacing:.01em}
.lg2 .lg2-pill,.lg2 .lb-chip{font-family:var(--ar-font);background:linear-gradient(135deg,rgba(244,114,182,.28),rgba(124,58,237,.28));border:1px solid rgba(255,255,255,.28);box-shadow:0 0 22px rgba(244,114,182,.25)}
.lg2 .lg2-code{color:var(--ar-gold);text-shadow:0 4px 0 #a9610a,0 0 50px rgba(255,210,74,.55)}
/* botões chunky */
.lg2 .lg2-btn{border-radius:18px;font-family:var(--ar-font);background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.08));border:1px solid rgba(255,255,255,.26);box-shadow:0 5px 0 rgba(8,4,40,.55),0 12px 24px rgba(0,0,20,.3)}
.lg2 .lg2-btn:hover:not(:disabled){background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,.12))}
.lg2 .lg2-btn:active:not(:disabled){transform:translateY(3px);box-shadow:0 2px 0 rgba(8,4,40,.55)}
.lg2 .lg2-btn.gold,.lg2 .gx-go{font-family:var(--ar-font);background:linear-gradient(180deg,#ffe58a 0%,#ffc83d 48%,#f5a623 100%);color:#2a1700;border:0;box-shadow:0 6px 0 #a9610a,0 14px 32px rgba(245,166,35,.45),inset 0 2px 0 rgba(255,255,255,.6)}
.lg2 .lg2-btn.gold:active:not(:disabled),.lg2 .gx-go:active{transform:translateY(4px);box-shadow:0 2px 0 #a9610a,0 6px 16px rgba(245,166,35,.4)}
.lg2 .gx-ghost{font-family:var(--ar-font);background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.3);box-shadow:0 5px 0 rgba(8,4,40,.5)}
.lg2 .gx-ch{font-family:var(--ar-font);background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.26)}
.lg2 .gx-ch.on{background:linear-gradient(180deg,#ffe58a,#f5a623);color:#2a1700;border-color:transparent;box-shadow:0 3px 0 #a9610a,0 0 18px rgba(255,200,60,.45)}
.lg2 .lg2-ic{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.24);box-shadow:0 3px 0 rgba(8,4,40,.5)}
.lg2-chrome .lg2-ic.sair{font-family:var(--ar-font);background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06))!important;border:1px solid rgba(255,255,255,.3)!important;box-shadow:0 3px 0 rgba(8,4,40,.5)}
/* cartões e peças */
.lg2 .lb-card,.lg2 .gx-tile{background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 14px 34px rgba(4,0,30,.45);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.lg2 .gx-tile{border-width:2px;font-family:var(--ar-font)}
.lg2 .gx-tile.on{border-color:var(--ar-gold);background:linear-gradient(160deg,rgba(255,210,74,.28),rgba(124,58,237,.18));box-shadow:0 0 0 2px rgba(255,210,74,.35),0 0 30px rgba(255,210,74,.35),0 14px 34px rgba(4,0,30,.45)}
.lg2 .gx-tile b,.lg2 .lb-card h3{font-family:var(--ar-font)}
.lg2 .lg2-pp{background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.07));border:1px solid rgba(255,255,255,.28);font-family:var(--ar-font)}
/* pergunta */
.lg2 .lg2-qcard{background:linear-gradient(160deg,rgba(255,255,255,.16),rgba(124,58,237,.18));border:2px solid rgba(255,255,255,.3);box-shadow:inset 0 2px 0 rgba(255,255,255,.3),0 0 40px rgba(124,58,237,.4),0 16px 36px rgba(4,0,30,.45);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.lg2 .lg2-qcard h2{font-weight:700;text-shadow:0 3px 0 rgba(10,4,50,.55)}
/* respostas */
.lg2 .lg2-a{font-family:var(--ar-font);font-weight:700;border:0!important;border-radius:22px;box-shadow:0 8px 0 var(--n2,#222),0 16px 28px rgba(0,0,20,.4),inset 0 3px 0 rgba(255,255,255,.45),inset 0 -10px 18px rgba(0,0,0,.18)!important}
.lg2 .lg2-a::after{content:'';position:absolute;left:4%;right:4%;top:6%;height:34%;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.28),transparent);pointer-events:none}
.lg2 .lg2-a:active{transform:translateY(5px);box-shadow:0 3px 0 var(--n2,#222),0 8px 16px rgba(0,0,20,.4),inset 0 3px 0 rgba(255,255,255,.4)!important}
.lg2 .lg2-a.c0,.lg2 .lg2-a.tfF{--n1:#ff6a8a;--n2:#b0133b;background:linear-gradient(180deg,#ff6a8a,#e11d48)}
.lg2 .lg2-a.c1{--n1:#52b6ff;--n2:#1747b8;background:linear-gradient(180deg,#52b6ff,#2563eb)}
.lg2 .lg2-a.c2{--n1:#ffd24a;--n2:#b36a00;background:linear-gradient(180deg,#ffd24a,#f59e0b);color:#2a1700}
.lg2 .lg2-a.c3,.lg2 .lg2-a.tfT{--n1:#52e8a0;--n2:#0a7a45;background:linear-gradient(180deg,#52e8a0,#16a34a)}
.lg2 .lg2-a.ok{box-shadow:0 8px 0 var(--n2,#222),0 0 0 5px #fff,0 0 60px rgba(52,211,153,.95)!important}
/* temporizador */
.lg2 .lg2-ring circle{stroke-width:10}.lg2 .lg2-ring .tr{stroke:rgba(255,255,255,.18)}
.lg2 .lg2-ring{filter:drop-shadow(0 0 14px rgba(255,210,74,.45))}.lg2 .lg2-ring b{font-family:var(--ar-font)}
/* pódio e placar */
.lg2 .lg2-podium b,.lg2 [class*="gx-"] b{font-family:var(--ar-font)}
.lg2 .lg2-row .lg2-btn{font-size:clamp(18px,2.1vw,34px);padding:.7em 1.5em}
@media (max-width:820px){
.lg2 .lg2-ans{grid-auto-rows:minmax(84px,130px);flex:none!important}
.lg2 .lg2-ring b,.lg2 #lg-timer{font-size:22px!important}
.lg2 .lg2-qv{padding-bottom:84px!important}
}
@media (max-width:820px){
.lg2 .lg2-a{gap:8px!important;flex-direction:column;text-align:center;justify-content:center}
.lg2 .lg2-a>*:first-child{width:38px!important;height:38px!important;font-size:18px!important;flex:none}
.lg2 .qv-top{flex-wrap:wrap;justify-content:center}
.lg2 .qv-top .qv-pill,.lg2 .qv-top .qv-row>*{max-width:100%}
.lg2 .lg2-qv{padding-bottom:96px!important}
.lg2 .gx-board{padding-bottom:96px!important}
.lg2 .gb-ans{padding-top:10px}
.lg2 .gb-pod{padding-top:22px}
}
@media (max-width:820px){
.lg2 .lg2-qv{display:flex!important;flex-direction:column;gap:12px;height:auto;min-height:100%;padding:56px 14px calc(18px + env(safe-area-inset-bottom))!important;overflow-y:auto}
.lg2 .qv-top{position:static!important;display:flex!important;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:0!important}
.lg2 .qv-top .lb-brand,.lg2 .qv-top .lb-iasd,.lg2 .qv-top .iasd-logo,.lg2 .qv-r>:first-child:not(.qv-row){display:none!important}
.lg2 .qv-l,.lg2 .qv-r{position:static!important;transform:none!important;width:auto!important}
.lg2 .qv-row{display:flex;align-items:center;gap:8px}
.lg2 .qv-pill{font-size:12px!important;padding:6px 10px!important}
.lg2 .lg2-ring{width:54px!important;height:54px!important;font-size:18px!important}
.lg2 .lg2-qcard{width:100%!important;padding:16px!important;min-height:0!important;margin:0!important}
.lg2 .lg2-qcard h2{font-size:clamp(18px,5.2vw,24px)!important;line-height:1.25}
.lg2 .lg2-ans{display:grid!important;grid-template-columns:1fr 1fr;gap:10px;width:100%!important;margin:0!important;position:static!important}
.lg2 .lg2-a{min-height:84px!important;font-size:clamp(15px,4.4vw,20px)!important;padding:10px!important;width:auto!important;height:auto!important}
.lg2 .qv-bot{position:static!important;width:100%;display:flex;justify-content:center;padding:0!important}
.lg2 .qv-bot .lg2-btn{width:100%}
.lg2 .gx-board{position:relative!important;display:flex!important;flex-direction:column;gap:12px;height:auto!important;min-height:100%;padding:56px 14px calc(18px + env(safe-area-inset-bottom))!important;overflow-y:auto}
.lg2 .gx-board>*{position:static!important;transform:none!important;width:100%!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;margin:0!important}
.lg2 .gx-board .gx-top,.lg2 .gx-board .gx-iasd{display:none!important}
.lg2 .gb-hd{font-size:15px!important;text-align:center}
.lg2 .gb-ans{white-space:normal!important;font-size:14px!important;text-align:center}
.lg2 .gb-pod{display:flex!important;align-items:flex-end;justify-content:center;gap:8px}
.lg2 .gb-pod .gp{flex:1;min-width:0;font-size:13px!important}
.lg2 .gp-av{width:56px!important;height:56px!important;font-size:22px!important}
.lg2 .gp-nm{font-size:13px!important}.lg2 .gp-pt{font-size:15px!important}
.lg2 .gb-list .gr{font-size:14px!important;padding:8px 10px!important;min-height:0!important;height:auto!important}
.lg2 .gb-bar{display:flex!important;flex-direction:column;gap:8px;align-items:stretch}
.lg2 .gb-bar .lg2-btn{width:100%}
.lg2 .lg2-center{width:100%!important;padding:56px 14px 18px}
.lg2 .lg2-pod{gap:6px}.lg2 .lg2-pod .s{min-width:0;flex:1}
.lg2 .lg2-awards{flex-direction:column;gap:8px}
.lg2 .lg2-row{flex-direction:column;width:100%}.lg2 .lg2-row .lg2-btn{width:100%}
}
@media (prefers-reduced-motion:reduce){.lg2 *{animation-duration:.01s!important}}
`;document.head.appendChild(s);
 if(!document.getElementById('lg2-font')){const l=document.createElement('link');l.id='lg2-font';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap';document.head.appendChild(l)}
}

/* ---------- início ---------- */
async function home(){
 try{await libs()}catch(e){alert('Não foi possível carregar o Jogo Coletivo. Verifique a conexão.');return}
 A().unlock();
 if(!S.room&&(localStorage.getItem('iasd_live_host')||localStorage.getItem('iasd_live_player'))&&await reconnect(2))return;
 S.host=false;
 screen(barHTML()+'<div class="lg2-center lb-panel"><span class="lg2-pill">🎮 JOGO COLETIVO</span><h1 class="lg2-hero">Desafio Bíblico Ao Vivo</h1><p class="lg2-sub">Projete no telão e jogue com todos pelo celular. Vários jogos, pontos, sequências e um pódio final.</p><div class="lg2-row"><button class="lg2-btn gold" onclick="IASDLive.setup()">📺 Criar sala no telão</button><button class="lg2-btn" onclick="IASDLive.joinForm()">📱 Entrar com código</button></div><small class="lg2-sub">'+fmt(window.IASDGameEngine.stats().total)+'+ perguntas e desafios para sortear.</small></div>','bgx cl');
 A().music('menu');
}
let SET={mode:0,rounds:1,fmt:0};
function setup(){
 A().sfx('click');
 const paint=()=>screen('<div class="gx gx-setup">'+gxTop()+
  '<h1 class="gx-h">Escolha o <b>jogo</b></h1><p class="gx-sub">Diversos jogos bíblicos para jogar em grupo</p>'+
  '<div class="gx-tiles">'+MODES.map(m=>'<button class="gx-tile '+(SET.mode===m.id?'on':'')+'" onclick="IASDLive._set(\'mode\','+m.id+')"><span class="e">'+m.e+'</span><b>'+m.n+'</b><small>'+m.d+'</small><em>'+LBI.group+TAGS[m.id]+'</em></button>').join('')+
  '<div class="gx-side"><div class="gx-opts"><div><span>Formato:</span>'+FORMATS.map(f=>'<button class="gx-ch '+(SET.fmt===f.id?'on':'')+'" onclick="IASDLive._set(\'fmt\','+f.id+')">'+f.e+' '+f.n+'</button>').join('')+'</div><div><span>Rodadas:</span>'+ROUNDS.map((n,i)=>'<button class="gx-ch '+(SET.rounds===i?'on':'')+'" onclick="IASDLive._set(\'rounds\','+i+')">'+n+'</button>').join('')+'</div></div>'+
  '<div class="gx-cta"><button class="gx-go" onclick="IASDLive.create()">▶ Criar sala</button><button class="gx-ghost" onclick="IASDLive.joinForm()">'+LBI.scan+' Entrar com código</button></div></div></div></div>','lb qz');
 API._set=(k,v)=>{SET[k]=v;A().sfx('tap');paint()};paint();
}
function joinForm(pre){
 A().sfx('click');const av=AVATARS[Math.floor(Math.random()*AVATARS.length)];let pick=av;
 screen('<div class="gx gx-join"><div class="gx-iasd">'+iasdLogo()+'</div>'+brandPx()+
  '<div class="gj-hd"><span class="gj-ic">'+LBI.phone+'</span><div><h2>ENTRAR NA <b>PARTIDA</b></h2><p>Informe o código da sala e seu nome para participar</p></div></div>'+
  '<div class="gj-card"><div class="gj-f"><label>CÓDIGO DA SALA</label><div class="gj-in">'+LBI.group+'<input id="lg-code" inputmode="numeric" maxlength="6" placeholder="123456" value="'+esc(pre||'')+'" oninput="IASDLive._teamPick()"></div></div>'+
  '<div class="gj-f"><label>SEU NOME</label><div class="gj-in"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.2"/><path d="M4 21c0-4.400 3.600-7 8-7s8 2.600 8 7z"/></svg><input id="lg-name" maxlength="24" placeholder="Digite seu nome" autocomplete="off"></div></div>'+
  '<div class="gj-av" id="lg2-avs">'+AVATARS.map(a=>'<button class="'+(a===av?'on':'')+'" data-a="'+a+'">'+a+'</button>').join('')+'</div></div>'+
  '<div class="tm-pick" id="lg-tm" hidden><small>Esta sala é de times! Escolha o seu:</small><div><button data-t="A" class="A on">🔵 Azul</button><button data-t="B" class="B">🟡 Dourado</button></div></div>'+
  '<button class="gx-go gj-go" onclick="IASDLive.join()">▶ Entrar na partida</button>'+
  '<div class="gj-bt"><span class="gj-wait">'+LBI.group+'<span><b>Já entrou na sala?</b><small>Aguarde o início da partida</small></span></span><button class="gx-ghost" onclick="IASDLive.home()">← Voltar<small>Escolher outro jogo</small></button></div></div>','lb qz');
 $('lg2-avs').onclick=e=>{const b=e.target.closest('button');if(!b)return;pick=b.dataset.a;$('lg2-avs').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));A().sfx('tap');API._av=pick};API._av=pick;
 API._team=Math.random()<.5?'A':'B';
 const tp=()=>{const c=($('lg-code').value||'').replace(/\D/g,''),box=$('lg-tm');if(!box)return;const on=c.length===6&&cfgOf(c).teams;box.hidden=!on;box.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t===API._team))};
 API._teamPick=tp;$('lg-tm').onclick=e=>{const b=e.target.closest('button');if(!b)return;API._team=b.dataset.t;A().sfx('tap');tp()};tp();
}
async function join(){
 const c=($('lg-code').value||'').replace(/\D/g,''),nm=($('lg-name').value||'').trim();
 if(c.length!==6||!nm)return alert('Informe o código de 6 dígitos e seu nome.');
 const full=(API._av||'🙂')+' '+nm+(cfgOf(c).teams?'\u200B'+(API._team||'A'):'');
 try{
  const p=await rpc('live_join_room',{p_code:c,p_name:full});
  if(!p?.length)return alert('Sala não encontrada ou a partida já começou.');
  S.player=p[0];const rooms=await rpc('live_room_state',{p_room:S.player.room_id});if(!rooms?.length)throw Error('room_state_missing');
  S.room=rooms[0];S.host=false;PS={answered:-1,lastScore:0,sawQ:-1,revealFor:-1};
  try{window.IASDLivePresence?.log('player',nm,c)}catch(e){}
  A().sfx('join');localStorage.setItem('iasd_live_player',JSON.stringify({room:S.room.id,player:S.player.id,token:S.player.player_token}));
  deckFor(code());playerView();poll();syOpen();
 }catch(e){console.error('IASDLive join:',e);alert('Não foi possível entrar na sala. Confira o código e tente novamente.')}
}
/* ---------- APRESENTADOR ---------- */
async function create(){
 try{
  const c=String(SET.mode)+String(SET.rounds)+String(SET.fmt)+String(Math.floor(100+Math.random()*900));
  const r=await rpc('live_create_room',{p_code:c});if(!r?.length)throw Error('room_not_created');
  S.room=r[0];S.host=true;HS={prev:{},streak:{},correct:{},best:{},joined:new Set(),order:[],rw:{A:0,B:0},bonus:{A:0,B:0}};S.tm=null;try{localStorage.removeItem('iasd_live_tm')}catch(e){}
  localStorage.setItem('iasd_live_host',JSON.stringify({id:S.room.id,token:S.room.host_token,code:c}));
  try{window.IASDLivePresence?.log('host','Anfitrião',c)}catch(e){}
  deckFor(c);A().sfx('join');lobby();poll();syOpen();
 }catch(e){console.error('IASDLive create room:',e);alert('Não foi possível criar a sala. Tente novamente.')}
}
const players=async()=>await rpc('live_room_players',{p_room:S.room.id});
const LBI={
 people:'<svg viewBox="0 0 64 44" fill="none" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="lbg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd86b"/><stop offset="1" stop-color="#f29a14"/></linearGradient><linearGradient id="lbg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb1ff"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs><g stroke="url(#lbg1)" stroke-width="3.4"><circle cx="32" cy="8.500" r="6"/><circle cx="12.500" cy="14" r="4.600"/><circle cx="51.500" cy="14" r="4.600"/></g><g stroke="url(#lbg2)" stroke-width="3.6"><path d="M20.500 35c0-7.500 5-12.500 11.500-12.500S43.500 27.500 43.500 35"/><path d="M5 32c0-5 3.200-8.500 7.500-8.500M59 32c0-5-3.200-8.500-7.500-8.500"/></g><path d="M2.500 41.500c11-9 48-9 59 0" stroke="url(#lbg1)" stroke-width="3.200"/></svg>',
 group:'<svg viewBox="0 0 64 48" fill="currentColor"><circle cx="24" cy="14" r="9"/><circle cx="47" cy="17" r="7"/><path d="M5 44c0-11 8-18 19-18s19 7 19 18z"/><path d="M44 30c9 0 17 5 17 14H48c0-6-1.500-11-4-14z" opacity=".8"/></svg>',
 phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.500"/><path d="M11 18.500h2"/></svg>',
 pad:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7.500h10a4.500 4.500 0 014.500 4.500v1.500a3.200 3.200 0 01-5.600 2.100l-1.100-1.300h-5.600l-1.100 1.300A3.200 3.200 0 012.500 13.500V12A4.500 4.500 0 017 7.500z"/><path d="M8 10.500v3M6.500 12h3"/><circle cx="15.500" cy="11" r=".7"/><circle cx="17.500" cy="13" r=".7"/></svg>',
 scan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V5.500A1.500 1.500 0 015.500 4H8M16 4h2.500A1.500 1.500 0 0120 5.500V8M20 16v2.500a1.500 1.500 0 01-1.500 1.500H16M8 20H5.500A1.500 1.500 0 014 18.500V16M7 12h10"/></svg>',
 bolt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.500 2 4.500 13.500H11L9.500 22l9-11.500H12z"/></svg>',
 eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.500 12S5.500 5 12 5s10.500 7 10.500 7-4 7-10.500 7S1.500 12 1.500 12z"/><circle cx="12" cy="12" r="3.200" fill="currentColor"/></svg>'
};
const phBrand=()=>'<div class="ph-brand"><span class="pe">'+LBI.people+'</span><b>JOGO <i>COLETIVO</i></b></div>';
const barHTML=()=>'<div class="lb-bar"><span class="pe">'+LBI.people+'</span><b>JOGO <i>COLETIVO</i></b></div>';
const gxTop=()=>'<div class="gx-iasd">'+iasdLogo()+'</div>'+brandHTML(true);
const brandPx=()=>'<div class="gx-bp"><span class="pe">'+LBI.people+'</span><b>JOGO<br><i>COLETIVO</i></b><small>IASD APP</small></div>';
const TAGS=['Grupo','Rápido','Clássico','Divertido','Conhecimento','História','Desafio','Atenção'];
const dots=(i,total)=>Array.from({length:Math.min(total,25)},(_,k)=>'<i class="'+(k<i?'dn':k===i?'on':'')+'"></i>').join('');
const iasdLogo=()=>'<div class="lb-iasd"><i></i><span>Igreja Adventista<br>do Sétimo Dia</span></div>';
const brandHTML=stack=>'<div class="lb-brand'+(stack?' stack':'')+'"><span class="pe">'+LBI.people+'</span><h1><span>JOGO</span> <b>COLETIVO</b></h1><small>IASD APP</small></div>';
async function lobby(){
 S.phase='lobby';A().music('lobby');
 const ps=await players();const {mode,total}=cfgOf(code());
 const link=location.origin+'/jogos?game='+code();
 const qr='https://api.qrserver.com/v1/create-qr-code/?size=640x640&margin=0&data='+encodeURIComponent(link);
 const step=(n,ic,t,d)=>'<div class="lb-st"><span class="lb-n">'+n+'</span><span class="lb-ic">'+LBI[ic]+'</span><div><b>'+t+'</b><small>'+d+'</small></div></div>';
 screen('<div class="lg2-lb">'+
  '<div class="lb-hd">'+iasdLogo()+brandHTML(false)+
  '<div class="lb-ac"><button class="lg2-btn gold" id="lg-start" onclick="IASDLive.start()">▶ COMEÇAR PARTIDA</button><div class="lb-r2"><button class="lg2-btn" onclick="IASDLive.telao()">📽 Projetar no telão</button><button class="lg2-btn" onclick="IASDLive.exit()">✕ Cancelar sala</button></div><em class="lb-mode">'+(cfgOf(code()).teams?FORMATS[cfgOf(code()).fmt].e+' '+FORMATS[cfgOf(code()).fmt].n+' · ':'')+mode.e+' '+esc(mode.n)+' · '+total+' rodadas</em></div></div>'+
  '<section class="lb-card lb-cd"><h3>CÓDIGO DA SALA</h3><div class="lg2-code">'+esc(code())+'</div><div class="lb-qb"><img class="lg2-qr" alt="QR Code para entrar" src="'+qr+'"></div><div class="lb-sc">'+LBI.phone+'<div><b>ESCANEIE O QR CODE</b><small>PARA ENTRAR NA SALA</small></div></div></section>'+
  '<section class="lb-rt"><div class="lb-card lb-ct">'+LBI.group+'<b id="lg-player-count">'+ps.length+'</b><span>jogador(es) na sala</span></div>'+
  '<small class="lb-wt" id="lg-wait">AGUARDANDO OS PARTICIPANTES...</small>'+(cfgOf(code()).teams?'<div class="lb-teams">'+['A','B'].map(k=>'<div class="lb-tm '+k+'"><h4>'+TEAMS[k].e+' TIME '+TEAMS[k].n.toUpperCase()+' <b id="tc-'+k+'">0</b></h4><div class="lg2-ppl" id="lg-list-'+k+'"></div></div>').join('')+'</div><div class="lg2-ppl" id="lg-player-list" hidden></div>':'<div class="lg2-ppl" id="lg-player-list"></div>')+
  '<div class="lb-card lb-hw"><h3>COMO PARTICIPAR?</h3>'+step(1,'phone','ABRA O IASD APP','No seu celular ou computador.')+step(2,'pad','ACESSE O JOGO COLETIVO','Vá até a aba “Jogos” e toque em “Entrar com código”.')+step(3,'scan','DIGITE O CÓDIGO OU<br>ESCANEIE O QR CODE','Use o código ao lado para entrar na sala.')+'</div></section></div>','lb cl');
 paintLobbyPlayers(ps,true);
}
function paintLobbyPlayers(ps,first){
 const box=$('lg-player-list');if(!box)return;const cnt=$('lg-player-count');if(cnt)cnt.textContent=ps.length;document.querySelector('.lg2-lb')?.classList.toggle('many',ps.length>6);const wt=$('lg-wait');if(wt)wt.textContent=ps.length?'TUDO PRONTO? É SÓ COMEÇAR!':'AGUARDANDO OS PARTICIPANTES...';
 if(cfgOf(code()).teams)['A','B'].forEach(k=>{const e=$('tc-'+k);if(e)e.textContent=ps.filter(p=>teamTag(p.name)===k).length});
 ps.forEach(p=>{if(!HS.joined.has(p.id)){HS.joined.add(p.id);const n=splitName(p.name);const d=document.createElement('div');d.className='lg2-pp';d.innerHTML='<span class="lg2-av">'+esc(n.av)+'</span>'+esc(n.name);(cfgOf(code()).teams?($('lg-list-'+teamOf(p))||box):box).appendChild(d);if(!first)A().sfx('join')}});
}
async function start(){
 const ps=await players();if(!ps.length&&!confirm('Ninguém entrou ainda. Começar assim mesmo?'))return;
 if(cfgOf(code()).teams){const tm={};ps.forEach(p=>tm[p.id]=teamTag(p.name)||'A');const cnt=k=>ps.filter(p=>tm[p.id]===k).length;for(let g=0;g<40&&Math.abs(cnt('A')-cnt('B'))>1;g++){const big=cnt('A')>cnt('B')?'A':'B',small=big==='A'?'B':'A',mv=ps.slice().reverse().find(p=>tm[p.id]===big);tm[mv.id]=small}S.tm=tm;HS.rw={A:0,B:0};HS.bonus={A:0,B:0};saveTm()}
 A().sfx('start');HS.prev={};ps.forEach(p=>{HS.prev[p.id]=Number(p.score)||0;HS.streak[p.id]=0;HS.correct[p.id]=0;HS.best[p.id]=0});
 if(cfgOf(code()).teams){if(!await teamIntro(ps))return}
 intro(0);
}
/* formação das equipes: VS + contagem 3-2-1 (celulares recebem o aviso pelo canal em tempo real) */
async function teamIntro(ps){
 S.phase='vs';const sp=speed(),side=k=>'<div class="vs-t '+k+'"><h3>'+TEAMS[k].e+' TIME '+TEAMS[k].n.toUpperCase()+'</h3>'+ps.filter(p=>teamOf(p)===k).slice(0,8).map((p,n)=>'<div style="animation-delay:'+(.25+n*.12)+'s">'+avatarHTML(p.name)+'<span>'+esc(splitName(p.name).name)+'</span></div>').join('')+'</div>';
 sySend({t:'vs',tm:S.tm,at:hostClock()});
 screen(barHTML()+'<div class="vs"><span class="lb-chip">AS EQUIPES ESTÃO FORMADAS</span><div class="vs-row">'+side('A')+'<div class="vs-x">VS</div>'+side('B')+'</div></div>','bgx qz');
 A().sfx('whoosh');await sleep(3000/sp);
 for(const n of [3,2,1]){if(S.phase!=='vs'||!S.room)return false;screen(barHTML()+'<div class="vs"><span class="lb-chip">PREPAREM-SE!</span><div class="vs-n" key="'+n+'">'+n+'</div></div>','bgx qz');A().sfx('count');await sleep(900/sp)}
 A().sfx('go');return S.phase==='vs'&&!!S.room;
}
async function patchRoom(obj){
 const h=JSON.parse(localStorage.getItem('iasd_live_host')||'null');if(!h?.token)throw Error('host_not_authorized');
 const r=await rpc('live_host_update',{p_room:S.room.id,p_token:h.token,p_status:obj.status||S.room.status,p_question:Number.isInteger(obj.current_question)?obj.current_question:null});
 if(r)S.room=r;else Object.assign(S.room,obj);
}
function intro(i){
 clearTimers();S.phase='intro';S.qn=i;const q=deckFor(code())[i],t=TYPES[q.ltype];A().music('play');A().sfx('whoosh');
 const words=t.n.split(' '),last=words.pop(),mid=words.length?words.filter(w=>w.toLowerCase()!=='ou'):[],hasOu=words.some(w=>w.toLowerCase()==='ou');
 const title=(mid.length?'<span>'+esc(mid.join(' '))+'</span> ':'')+(hasOu?'<em>ou</em> ':'')+'<b>'+esc(last)+'</b>';
 const sp=spOf(i);
 screen('<div class="gx gx-intro" style="--tc:'+t.c+'"><div class="gx-iasd">'+iasdLogo()+'</div>'+
  '<div class="gx-rc"><span>RODADA <i>'+(i+1)+'</i> DE '+cfgOf(code()).total+'</span><div class="gx-dots">'+dots(i,cfgOf(code()).total)+'</div></div>'+
  '<div class="gx-ico"><span>'+t.e+'</span></div><h1 class="gx-title">'+title+'</h1><div class="gx-tag">MEMÓRIA BÍBLICA</div><p class="gx-d">'+esc(t.d)+'</p>'+
  (sp?'<span class="lb-chip sp">'+sp.e+' '+sp.n+' · PONTOS ×'+sp.m+'</span>':'')+
  '<div class="gx-prep"><span>Preparando a próxima pergunta...</span><div class="bar"><i style="animation-duration:'+(2.3/speed())+'s"></i></div></div></div>','lb bgx qz',{style:'--tc:'+t.c});
 S.auto=setTimeout(async()=>{const T=Date.now()+LEAD();syPhase('question',i,T);try{await Promise.all([patchRoom({status:'question',current_question:i}),sleep(T-Date.now())])}catch(e){console.error(e);return}await sleep(T-Date.now());hostQuestion(T)},2300/speed());
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
 else if(q.ltype==='vf'&&q.claim&&mode==='host')mid='<div class="lg2-qcard vfc"><small>'+esc(q.q0||'')+'</small><h2>“<span>'+esc(q.claim)+'</span>”</h2><small>Está certo?</small></div>';
 else mid='<div class="lg2-qcard"><h2>'+esc(q.q)+'</h2>'+(q.hint?'<div class="ref">'+esc(q.hint)+'</div>':'')+'</div>';
 return mid;
}
function runFlash(q,onDone){
 const box=$('lg-flash');if(!box){onDone&&onDone();return}
 const ms=420/speed();
 if(q.flashKind==='count'){let i=0;const step=()=>{if(!$('lg-flash'))return;if(i>=q.seq.length){box.innerHTML='<div class="hide">🤔</div>';S.flashT=setTimeout(onDone,300/speed());return}box.innerHTML='<div class="one" style="animation-duration:'+(ms/1000)+'s">'+q.seq[i]+'</div>';A().sfx('tick');i++;S.flashT=setTimeout(step,ms)};S.flashT=setTimeout(step,500/speed())}
 else{box.innerHTML='<div class="grid">'+q.shown.map((e,i)=>'<span style="animation-delay:'+(i*.08)+'s">'+e+'</span>').join('')+'</div>';A().sfx('reveal');S.flashT=setTimeout(()=>{if(!$('lg-flash'))return;box.innerHTML='<div class="hide">🤔 Qual sumiu?</div>';S.flashT=setTimeout(onDone,350/speed())},q.showMs/speed())}
}
function hostQuestion(T0){
 clearTimers();S.phase='question';const i=qi(),q=deckFor(code())[i],t=TYPES[q.ltype],secs=roundSecs(q);
 players().then(ps=>{ps.forEach(p=>{HS.prev[p.id]=Number(p.score)||0});HS.n=ps.length;paintDots(0)}).catch(()=>{});
 screen('<div class="lg2-lb lg2-qv'+(q.type==='tf'?' vf':'')+'" style="--tc:'+t.c+'"><div class="qv-top"><div class="qv-l"><span class="qv-pill gold">'+LBI.bolt+'<b>'+esc(t.n)+'</b><i></i><span>'+(i+1)+'/'+cfgOf(code()).total+'</span></span></div>'+brandHTML(true)+'<div class="qv-r">'+iasdLogo()+'<div class="qv-row"><span class="qv-pill">'+LBI.group+'<span id="lg-count"><b>0</b> responderam</span></span>'+ringHTML(t)+'</div></div></div>'+qBody(q,t,'host')+'<div class="lg2-ans '+(q.type==='tf'?'two':'')+'" id="lg-ans">'+ansTiles(q,'host')+'</div><div class="qv-bot"><button class="lg2-btn qv-show" onclick="IASDLive.reveal()">'+LBI.eye+' Mostrar resposta</button></div></div>','lb qz',{style:'--tc:'+t.c});
 {const h=document.querySelector('.lg2-qv .lg2-qcard h2');if(h)h.dataset.len=String(q.q).length>170?'xl':String(q.q).length>110?'l':'m'}
 requestAnimationFrame(fitHost);
 S.qStart=T0||Date.now();S.flashing=q.ltype==='flash';
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
function paintDots(n){const tot=HS.n||0;const d=$('lg-dots');if(d)d.innerHTML=Array.from({length:Math.min(tot,40)},(_,k)=>'<i class="'+(k<n?'on':'')+'"></i>').join('');const c=$('lg-count');if(c)c.innerHTML='<b>'+n+'</b> responderam'}
async function reveal(){
 if(S.phase!=='question')return;S.phase='reveal';clearTimers();
 const i=qi(),q=deckFor(code())[i],T=Date.now()+LEAD();syPhase('reveal',i,T);
 const job=(async()=>{try{
  await patchRoom({status:'reveal'});
  const h=JSON.parse(localStorage.getItem('iasd_live_host')||'null');
  await rpc('live_host_score',{p_room:S.room.id,p_token:h.token,p_question:i,p_correct:q.ans});
 }catch(e){console.error(e)}})();
 await Promise.all([job,sleep(T-Date.now())]);
 A().music('play');A().sfx('reveal');
 await scoreboard(i,q);
}
function teamResult(ps){const cfg=cfgOf(code()),bonus=S.host?HS.bonus:((PS.tt&&PS.tt.bonus)||{A:0,B:0}),rw=S.host?HS.rw:((PS.tt&&PS.tt.rw)||{A:0,B:0}),t=teamTotals(ps,bonus);let w;
 if(cfg.fmt===2)w=rw.A>rw.B?'A':rw.B>rw.A?'B':(t.A.pts>t.B.pts?'A':t.B.pts>t.A.pts?'B':'');else w=t.A.pts>t.B.pts?'A':t.B.pts>t.A.pts?'B':'';
 return{t,rw,w,fmt:cfg.fmt}}
function teamHeader(tt,dA,pb,win,fmt,spc,spx){
 const side=k=>'<div class="tm-side '+k+(win===k?' lead':'')+'"><b>'+TEAMS[k].e+' '+TEAMS[k].n.toUpperCase()+'</b><span class="tm-sc">'+fmt_(tt.t[k].pts)+'</span>'+(dA[k]>0?'<em>+'+fmt_(dA[k])+'</em>':'')+(spc&&spx&&spx[k]?'<i>'+spc.e+' '+spc.n+' +'+fmt_(spx[k])+'</i>':'')+(pb[k]?'<i>⭐ TIME PERFEITO +'+pb[k]+'</i>':'')+'<small>'+(fmt===2?tt.rw[k]+(tt.rw[k]===1?' rodada vencida':' rodadas vencidas'):tt.t[k].n+' jogador(es)')+'</small></div>';
 const tot=Math.max(1,tt.t.A.pts+tt.t.B.pts);
 let mid;
 if(fmt===2){const K=Math.max(2,Math.ceil(cfgOf(code()).total/2)),x=Math.max(6,Math.min(94,50-(tt.rw.A-tt.rw.B)/K*44));
  mid='<div class="tm-rope"><div class="tm-line"></div><div class="tm-flag A">🔵</div><div class="tm-flag B">🟡</div><div class="tm-mid"></div><div class="tm-knot" style="left:'+x+'%">🪢</div></div>'}
 else mid='<div class="tm-split"><i class="A" style="width:'+(tt.t.A.pts+tt.t.B.pts?Math.max(4,Math.round(tt.t.A.pts/tot*100)):50)+'%"></i><i class="B"></i></div>';
 return '<div class="tm-head">'+side('A')+'<div class="tm-center">'+mid+'</div>'+side('B')+'</div>'}
const fmt_=n=>Number(n||0).toLocaleString('pt-BR');
function gxBoard(ps,i,q,t,gotIt,isLast){
 const total=cfgOf(code()).total,max=Math.max(1,...ps.map(p=>p.score));
 const pod=(p,k)=>{if(!p)return '<div class="gp '+['s','g','b'][k]+'"></div>';const n=splitName(p.name),cl=['s','g','b'][k],pos=[2,1,3][k];
  return '<div class="gp '+cl+'">'+(cl==='g'?'<span class="crown">👑</span>':'')+'<div class="gp-av"><span>'+esc(n.av)+'</span><i>'+pos+'</i></div><div class="gp-nm">'+esc(n.name)+'</div><div class="gp-pt"><b>'+fmt(p.score)+'</b><small>pontos</small>'+(p.delta>0?'<em>+'+fmt(p.delta)+'</em>':'')+'</div><div class="gp-bs"></div></div>'};
 const top=[ps[1],ps[0],ps[2]];
 const rest=ps.slice(3,8).map((p,k)=>{const n=splitName(p.name);return '<div class="gr" style="animation-delay:'+(k*.08)+'s"><span class="rk">'+(k+4)+'º</span><span class="av">'+esc(n.av)+'</span><div class="nm"><b>'+esc(n.name)+'</b><div class="tk"><i style="width:'+Math.max(4,Math.round(p.score/max*100))+'%"></i></div></div><span class="pt"><b>'+fmt(p.score)+'</b><small>pontos</small></span>'+(p.delta>0?'<span class="dl">+'+fmt(p.delta)+'</span>':'')+'</div>'}).join('');
 const side=rest||'<div class="gr-empty"><b>✓ '+gotIt+' de '+ps.length+'</b><small>acertaram esta rodada</small></div>';
 const lead=ps[0];
 return '<div class="gx gx-board">'+gxTop()+
  '<div class="gb-hd"><span class="tr">🏆</span><h2>Placar Parcial</h2><i></i><span class="gb-t">'+esc(t.n)+'</span><span class="gb-r">'+LBI.bolt+' Rodada '+(i+1)+' de '+total+'</span></div>'+
  '<div class="gb-ans">Resposta: <b>'+esc(q.a)+'</b>'+(q.ref?'<small>'+esc(q.ref)+'</small>':'')+'</div>'+
  '<div class="gb-pod">'+top.map(pod).join('')+'</div><div class="gb-list">'+side+'</div>'+
  '<div class="gb-bar"><div class="gb-l"><span class="cr">👑</span><div><small>Líder da partida</small><b>'+(lead?esc(splitName(lead.name).name):'—')+'</b></div></div><div class="gb-m"><b>'+(isLast?'Chegamos ao fim!':'Continue assim!')+'</b><small>'+(isLast?'Veja o pódio final.':'Ainda temos muitas rodadas!')+'</small></div><div class="gb-n"><button class="gx-go" onclick="IASDLive.next()">▶ '+(isLast?'Ver o pódio':'Próxima rodada')+' →</button><div class="lg2-autobar" style="--ad:'+(10/speed())+'s"><i></i></div></div></div></div>'}
async function scoreboard(i,q){
 const ps=(await players()).map(p=>({...p,score:Number(p.score)||0}));
 const before=HS.order.slice();
 ps.forEach(p=>{const d=p.score-(HS.prev[p.id]||0);p.delta=d;if(d>0){HS.streak[p.id]=(HS.streak[p.id]||0)+1;HS.correct[p.id]=(HS.correct[p.id]||0)+1;HS.best[p.id]=Math.max(HS.best[p.id]||0,HS.streak[p.id])}else HS.streak[p.id]=0});
 ps.sort((a,b)=>b.score-a.score);
 const cfgB=cfgOf(code());let TH='';
 if(cfgB.teams){
  const dA={A:0,B:0},nn={A:0,B:0},perf={A:true,B:true},pb={A:0,B:0};
  ps.forEach(p=>{const k=teamOf(p);dA[k]+=p.delta;nn[k]++;if(!(p.delta>0))perf[k]=false});
  const mx=Math.max(1,nn.A,nn.B);['A','B'].forEach(k=>{dA[k]=Math.round(dA[k]*(nn[k]?mx/nn[k]:0))});
  const win=dA.A>dA.B?'A':dA.B>dA.A?'B':'';
  const spc=spOf(i),spx={A:0,B:0};
  if(HS.tq!==i){HS.tq=i;['A','B'].forEach(k=>{if(nn[k]>=2&&perf[k]){HS.bonus[k]+=300;pb[k]=300}if(spc){spx[k]=dA[k]*(spc.m-1);HS.bonus[k]+=spx[k]}});if(win)HS.rw[win]++;saveTm();HS.spx=spx}else if(spc)Object.assign(spx,HS.spx||{});
  const tt={t:teamTotals(ps,HS.bonus),rw:HS.rw};
  sySend({t:'tt',tt:{rw:HS.rw,bonus:HS.bonus,win,round:dA,pb}});
  TH=teamHeader(tt,dA,pb,win,cfgB.fmt,spc,spx);
 }
 const maxD=Math.max(0,...ps.map(p=>p.delta)),max=Math.max(1,...ps.map(p=>p.score));
 HS.order=ps.map(p=>p.id);
 const t=TYPES[q.ltype],gotIt=ps.filter(p=>p.delta>0).length;
 const lane=(p,k)=>{const n=splitName(p.name),moved=before.length?before.indexOf(p.id)-k:0,prev=HS.prev[p.id]||0;
  const badges=[];if(p.delta>0&&p.delta===maxD&&ps.length>1)badges.push('<em>⚡ Mais veloz</em>');if(HS.streak[p.id]>=2)badges.push('<em>🔥 '+HS.streak[p.id]+' seguidas</em>');if(moved>0)badges.push('<em>🚀 subiu '+moved+'</em>');
  return '<div class="lg2-lane '+(k===0?'first':'')+(cfgB.teams?' t'+teamOf(p):'')+'" style="animation-delay:'+(k*.07)+'s"><span class="rk">'+(k===0?'🥇':k===1?'🥈':k===2?'🥉':(k+1)+'º')+'</span>'+avatarHTML(p.name)+'<span class="nm">'+esc(n.name)+'</span><div class="tk"><i data-w="'+Math.max(3,Math.round(p.score/max*100))+'" style="width:'+Math.max(3,Math.round(prev/Math.max(1,max)*100))+'%"></i></div><span class="sc">'+fmt(p.score)+'</span>'+(p.delta>0?'<span class="dl">+'+fmt(p.delta)+'</span>':'')+(badges.length?'<div class="bd">'+badges.join('')+'</div>':'')+'</div>'};
 const isLast=i+1>=cfgOf(code()).total;
 const ansHTML=ansTiles(q,'host');
 S.phase='board';
 const GX=cfgB.teams?'':gxBoard(ps,i,q,t,gotIt,isLast);
 screen(GX||(barHTML()+'<div class="lg2-top"><span class="lg2-pill" style="color:'+t.c+'">'+t.e+' '+esc(t.n)+' · '+(i+1)+'/'+cfgOf(code()).total+'</span><span class="lg2-pill">✓ '+gotIt+' de '+ps.length+' acertaram</span></div>'+
  '<div class="lg2-ansbar">Resposta: <b>'+esc(q.a)+'</b>'+(q.ref?'<small style="opacity:.6;font-weight:600;font-size:.55em">'+esc(q.ref)+'</small>':'')+'</div>'+
  TH+'<div class="lg2-board'+(cfgB.teams?' tmb':'')+'">'+(ps.slice(0,cfgB.teams?4:7).map(lane).join('')||'<p class="lg2-sub">Sem jogadores.</p>')+(ps.length>(cfgB.teams?4:7)?'<small class="lg2-sub" style="text-align:center">+'+(ps.length-(cfgB.teams?4:7))+' jogadores</small>':'')+'</div>'+
  '<div class="lg2-row" style="margin-top:auto;padding-top:14px;flex-direction:column;align-items:center"><button class="lg2-btn gold" onclick="IASDLive.next()">'+(isLast?'🏆 Ver o pódio':'Próxima rodada →')+'</button><div class="lg2-autobar" style="--ad:'+(10/speed())+'s"><i></i></div></div>'),GX?'lb bgx qz':'bgx qz',{style:'--tc:'+t.c});
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
 {const T=Date.now()+LEAD();syPhase('finished',qi(),T);try{await Promise.all([patchRoom({status:'finished'}),sleep(T-Date.now())])}catch(e){}await sleep(T-Date.now())}
 const ps=(await players()).map(p=>({...p,score:Number(p.score)||0})).sort((a,b)=>b.score-a.score);
 A().music('victory');setTimeout(()=>A().sfx('drum'),200);setTimeout(()=>{A().sfx('win');confetti(8000)},3400/ (speed()>1?1:1));
 if(cfgOf(code()).teams)return teamFinal(ps);
 const top3=[ps[1],ps[0],ps[2]],cls=['p2','p1','p3'],pos=['2','1','3'];
 const bestStreak=ps.slice().sort((a,b)=>(HS.best[b.id]||0)-(HS.best[a.id]||0))[0],mostOk=ps.slice().sort((a,b)=>(HS.correct[b.id]||0)-(HS.correct[a.id]||0))[0];
 const total=cfgOf(code()).total;
 screen(barHTML()+'<div class="lg2-center" style="width:min(1000px,100%)"><span class="lg2-pill">🏁 FIM DE JOGO · '+total+' RODADAS</span><h1 class="lg2-hero" style="font-size:clamp(30px,5vw,56px)">Pódio</h1>'+
  '<div class="lg2-pod">'+top3.map((p,k)=>p?'<div class="s '+cls[k]+'">'+(cls[k]==='p1'?'<span class="crown">👑</span>':'')+avatarHTML(p.name,'big')+'<div class="nm">'+esc(splitName(p.name).name)+'</div><div class="pt">'+fmt(p.score)+' pts</div><div class="bar">'+pos[k]+'</div></div>':'<div class="s '+cls[k]+'"></div>').join('')+'</div>'+
  '<div class="lg2-awards">'+(bestStreak&&HS.best[bestStreak.id]>=2?'<div>🔥 Sequência de fogo<small>'+esc(splitName(bestStreak.name).name)+' · '+HS.best[bestStreak.id]+' seguidas</small></div>':'')+(mostOk&&HS.correct[mostOk.id]?'<div>🎯 Mais acertos<small>'+esc(splitName(mostOk.name).name)+' · '+HS.correct[mostOk.id]+' de '+total+'</small></div>':'')+'</div>'+
  (ps.length>3?'<div class="lg2-ppl" style="margin-top:6px">'+ps.slice(3,12).map((p,k)=>'<div class="lg2-pp" style="animation-delay:'+(4+k*.1)+'s"><b>'+(k+4)+'º</b>'+avatarHTML(p.name)+esc(splitName(p.name).name)+' · '+fmt(p.score)+'</div>').join('')+'</div>':'')+
  '<div class="lg2-row"><button class="lg2-btn gold" onclick="IASDLive.leave();IASDLive.home()">Nova partida</button><button class="lg2-btn" onclick="IASDLive.leave()">Encerrar</button></div></div>','bgx qz');
}
function teamFinal(ps){
 const R=teamResult(ps),total=cfgOf(code()).total,w=R.w,mvp=ps[0];
 const card=k=>{const ms=ps.filter(p=>teamOf(p)===k).slice(0,6);return '<div class="tf-card '+k+(w===k?' win':'')+'">'+(w===k?'<span class="crown">👑</span>':'')+'<h3>'+TEAMS[k].e+' TIME '+TEAMS[k].n.toUpperCase()+'</h3><div class="tf-pts">'+fmt_(R.t[k].pts)+'</div><small>'+(R.fmt===2?R.rw[k]+' rodadas vencidas · ':'')+(HS.bonus[k]?'⭐ '+HS.bonus[k]+' de bônus · ':'')+R.t[k].n+' jogador(es)</small><div class="tf-ms">'+ms.map(p=>'<div>'+avatarHTML(p.name)+'<span>'+esc(splitName(p.name).name)+'</span><b>'+fmt_(p.score)+'</b></div>').join('')+'</div></div>'};
 const bestStreak=ps.slice().sort((a,b)=>(HS.best[b.id]||0)-(HS.best[a.id]||0))[0];
 A().music('victory');setTimeout(()=>A().sfx('drum'),200);setTimeout(()=>{A().sfx('win');confetti(8000)},2600);
 screen(barHTML()+'<div class="lg2-center tf" style="width:min(1200px,100%)"><span class="lg2-pill">🏁 FIM DE JOGO · '+total+' RODADAS</span><h1 class="tf-h '+(w||'')+'">'+(w?'🏆 TIME '+TEAMS[w].n.toUpperCase()+' VENCEU!':'🤝 EMPATE!')+'</h1><div class="tf-two">'+card('A')+card('B')+'</div>'+
  '<div class="lg2-awards">'+(mvp?'<div>⭐ Craque da partida<small>'+esc(splitName(mvp.name).name)+' · '+fmt_(mvp.score)+' pts</small></div>':'')+(bestStreak&&HS.best[bestStreak.id]>=2?'<div>🔥 Sequência de fogo<small>'+esc(splitName(bestStreak.name).name)+' · '+HS.best[bestStreak.id]+' seguidas</small></div>':'')+'</div>'+
  '<div class="lg2-row"><button class="lg2-btn gold" onclick="IASDLive.leave();IASDLive.home()">Nova partida</button><button class="lg2-btn" onclick="IASDLive.leave()">Encerrar</button></div></div>','bgx qz');
}
/* ---------- JOGADOR (celular) ---------- */
async function playerView(){
 const st=S.room.status,i=qi();
 if(st==='finished'&&(i>=cfgOf(code()).total||(i===0&&PS.sawQ<0)))return closedScreen();
 if(st==='lobby'){S.phase='p-lobby';return screen('<div class="lg2-phone">'+phBrand()+'<span class="lg2-pill">🎉 VOCÊ ENTROU!</span>'+(cfgOf(code()).teams?teamBadge(teamOf(S.player)):'')+'<div class="lg2-me">'+avatarHTML(S.player.name,'big')+'</div><h2>'+esc(splitName(S.player.name).name)+'</h2><div class="lg2-code" style="font-size:54px">'+esc(code())+'</div><p class="lg2-sub">Olhe para o telão. Quando o apresentador começar, é só responder aqui!</p><div class="lg2-wait"><i></i><i></i><i></i></div><button class="lg2-btn" onclick="IASDLive.exit()">Sair da sala</button></div>','')}
 if(st==='question'){
  if(PS.sawQ===i&&S.phase==='p-question')return;
  if(PS.answered===i){S.phase='p-sent';return sentScreen()}
  return phoneQuestion(i)}
 if(st==='reveal'){if(PS.revealFor!==i){PS.revealFor=i;S.phase='p-reveal';return phoneReveal(i)}return}
 return phoneFinal();
}
function closedScreen(){
 clearTimers();clearTimeout(SY.tm);S.phase='p-final';try{localStorage.removeItem('iasd_live_player')}catch(e){}A().music(null);
 screen('<div class="lg2-phone">'+phBrand()+'<div class="lg2-res"><div class="big">🚪</div><h2>Sala encerrada</h2><p class="lg2-sub">O apresentador encerrou esta sala.</p><button class="lg2-btn gold" onclick="IASDLive.leave();IASDLive.home()">Voltar</button></div></div>','');
}
async function phoneVs(){
 if(S.phase!=='p-lobby')return;S.phase='p-vs';const k=teamOf(S.player),sp=speed();
 screen('<div class="lg2-phone">'+phBrand()+'<span class="lg2-pill">AS EQUIPES ESTÃO FORMADAS</span><div class="ph-vs '+k+'"><small>VOCÊ ESTÁ NO</small><div class="e">'+TEAMS[k].e+'</div><h2>TIME '+TEAMS[k].n.toUpperCase()+'</h2></div><div class="lg2-wait"><i></i><i></i><i></i></div></div>','');
 A().sfx('whoosh');await sleep(3000/sp);
 for(const n of [3,2,1]){if(S.phase!=='p-vs')return;screen('<div class="lg2-phone">'+phBrand()+'<span class="lg2-pill">PREPAREM-SE!</span><div class="vs-n '+k+'">'+n+'</div></div>','');A().sfx('count');await sleep(900/sp)}
 if(S.phase==='p-vs')S.phase='p-lobby';
}
function sentScreen(){screen('<div class="lg2-phone">'+phBrand()+'<div class="lg2-res"><div class="big">✅</div><h2>Resposta enviada!</h2><p class="lg2-sub">Aguardando os outros jogadores…</p><div class="lg2-wait"><i></i><i></i><i></i></div></div></div>','')}
function phoneQuestion(i){
 const q=deckFor(code())[i],t=TYPES[q.ltype],secs=roundSecs(q);clearTimers();PS.sawQ=i;S.phase='p-question';S.qStart=PS.at||Date.now();PS.at=0;S.shownClues=1;
 A().sfx('whoosh');
 const flash=q.ltype==='flash';
 screen('<div class="lg2-phone" style="--tc:'+t.c+'">'+phBrand()+'<div class="lg2-tbar"><i id="lg-pbar" style="width:100%"></i></div><span class="lg2-pill" style="color:'+t.c+'">'+t.e+' '+esc(t.n)+' · '+(i+1)+'/'+cfgOf(code()).total+'</span>'+(cfgOf(code()).teams?teamBadge(teamOf(S.player)):'')+(spOf(i)?'<span class="tm-b sp">'+spOf(i).e+' '+spOf(i).n+' ×'+spOf(i).m+'</span>':'')+
  (q.ltype==='who'?'<div class="lg2-clues" style="--tc:'+t.c+'">'+q.clues.map((c,k)=>'<p data-c="'+k+'" class="'+(k===0?'on':'off')+'" style="font-size:clamp(15px,4.4vw,20px)"><b>'+(k+1)+'</b><span>'+(k===0?esc(c):'…')+'</span></p>').join('')+'</div>':flash?'<div class="lg2-flash" id="lg-flash"></div><div class="lg2-ph-q" id="lg-flash-q" style="visibility:hidden">'+esc(q.q)+'</div>':(q.ltype==='vf'&&q.claim?'<div class="lg2-ph-q vfp"><small>'+esc(q.q0||'')+'</small><b>“'+esc(q.claim)+'”</b><small>Está certo?</small></div>':'<div class="lg2-ph-q">'+esc(q.q)+'</div>'))+
  '<div class="lg2-ph-ans '+(q.type==='tf'?'':'')+'" id="lg-ans" style="'+(flash?'visibility:hidden':'')+'">'+ansTiles(q,'player','IASDLive.answer')+'</div></div>','',{style:'--tc:'+t.c});
 requestAnimationFrame(fitPhone);
 const dur=flash?Math.max(6,secs-Math.round(q.showMs/1000/speed())):secs;
 if(flash)runFlash(q,()=>{S.qStart=Date.now();S.flashing=false;const a=$('lg-ans');if(a)a.style.visibility='visible';const fq=$('lg-flash-q');if(fq)fq.style.visibility='visible'});
 S.flashing=flash;
 S.clock=setInterval(()=>{
  const el=(Date.now()-S.qStart)/1000,left=S.flashing?dur:Math.max(0,dur-el),b=$('lg-pbar');if(b)b.style.width=(left/dur*100)+'%';
  if(q.ltype==='who'){const n=Math.min(q.clues.length,1+Math.floor(el/(dur/3.2)));while(S.shownClues<n){const p=document.querySelector('.lg2-clues p[data-c="'+S.shownClues+'"]');if(p){p.className='on';p.querySelector('span').textContent=q.clues[S.shownClues]}S.shownClues++}}
  if(left<=0&&!S.flashing){clearInterval(S.clock);document.querySelectorAll('#lg-ans .lg2-a').forEach(b=>{b.disabled=true})}},120);
}
async function answer(i){
 if(PS.answered===qi())return;const ix=qi();PS.answered=ix;
 document.querySelectorAll('#lg-ans .lg2-a').forEach(b=>{b.disabled=true;if(+b.dataset.i!==i&&b.dataset.i!==undefined)b.classList.add('no')});
 A().sfx('sent');
 try{const s=JSON.parse(localStorage.getItem('iasd_live_player')||'null');await rpc('live_submit_answer',{p_room:S.room.id,p_player:S.player.id,p_token:s?.token,p_question:ix,p_answer:i});PS.lastPick=i;PS.pickFor=ix;try{localStorage.setItem('iasd_live_ans',JSON.stringify({room:S.room.id,q:ix,pick:i}))}catch(e){}}catch(e){console.warn(e)}
 clearInterval(S.clock);sentScreen();
}
async function phoneReveal(i){
 clearTimers();const q=deckFor(code())[i],mine=PS.pickFor===i?PS.lastPick:-1,ok=mine===q.ans;
 screen('<div class="lg2-phone"><div class="lg2-res '+(ok?'':'bad')+'"><div class="big">'+(ok?'🎉':mine<0?'⏰':'😅')+'</div><h2>'+(ok?'Acertou!':mine<0?'Tempo esgotado':'Quase!')+'</h2><div class="pts" id="lg-pts">'+(ok?'calculando…':'')+'</div><p class="lg2-sub">Resposta certa: <b>'+esc(q.a)+'</b></p><div id="lg-rank" class="lg2-pill" style="visibility:hidden"></div><div id="lg-team" class="tm-ln"></div></div></div>','');
 A().sfx(ok?'correct':'wrong');if(navigator.vibrate)navigator.vibrate(ok?[60,40,60]:200);if(ok)confetti(1800);
 for(const wait of [1300,1600]){
  await new Promise(r=>setTimeout(r,wait/speed()));if(S.phase!=='p-reveal'||PS.revealFor!==i)return;
  try{const ps=(await players()).map(p=>({...p,score:Number(p.score)||0})).sort((a,b)=>b.score-a.score),me=ps.find(p=>p.id===S.player.id);
   if(me){const d=me.score-PS.lastScore;const pts=$('lg-pts');if(pts)pts.textContent=d>0?'+'+fmt(d)+' pontos':(ok?'':'+0');PS.cur=me.score;if(cfgOf(code()).teams){const R=teamResult(ps),el=$('lg-team'),m=teamOf(S.player),o=m==='A'?'B':'A';if(el)el.innerHTML=teamBadge(m)+' <b>'+fmt_(R.t[m].pts)+'</b> × <b>'+fmt_(R.t[o].pts)+'</b> '+TEAMS[o].e+(R.fmt===2&&PS.tt?'<br><small>🪢 rodadas: '+R.rw[m]+' × '+R.rw[o]+'</small>':'')}
    const pos=ps.findIndex(p=>p.id===S.player.id)+1,r=$('lg-rank');if(r){r.style.visibility='visible';r.textContent=pos+'º lugar · '+fmt(me.score)+' pts'+(pos>1?' · faltam '+fmt(ps[pos-2].score-me.score+1)+' p/ subir':'')}}}catch(e){}
 }
 PS.lastScore=PS.cur??PS.lastScore;
}
async function phoneFinal(){
 clearTimers();S.phase='p-final';
 let pos='',pts=0,n=0,tl='';
 try{const ps=(await players()).map(p=>({...p,score:Number(p.score)||0})).sort((a,b)=>b.score-a.score);n=ps.length;if(cfgOf(code()).teams){const R=teamResult(ps),m=teamOf(S.player);tl='<div class="tm-fin"><div class="tm-win '+(R.w||'')+'">'+(R.w?(R.w===m?'🏆 Seu time venceu!':'😅 O time '+TEAMS[R.w].n+' venceu'):'🤝 Empate!')+'</div><div class="tm-two"><span class="A">🔵 '+fmt_(R.t.A.pts)+'</span><span class="B">🟡 '+fmt_(R.t.B.pts)+'</span></div>'+(R.fmt===2?'<small>🪢 rodadas vencidas: '+R.rw.A+' × '+R.rw.B+'</small>':'')+'</div>'}pos=ps.findIndex(p=>p.id===S.player.id)+1;pts=ps[pos-1]?.score||0}catch(e){}
 A().sfx(pos&&pos<=3?'win':'level');if(pos&&pos<=3)confetti(6000);
 screen('<div class="lg2-phone"><div class="lg2-res"><div class="big">'+(pos===1?'🏆':pos===2?'🥈':pos===3?'🥉':'🎖️')+'</div><h2>Fim de jogo!</h2><div class="pts" style="color:#f5b73a">'+(pos?pos+'º lugar':'')+'</div><p class="lg2-sub">'+fmt(pts)+' pontos'+(n?' · '+n+' jogadores':'')+'</p>'+tl+'<button class="lg2-btn gold" onclick="IASDLive.leave();IASDLive.home()">Jogar de novo</button></div></div>','');
}
/* ---------- sincronização ---------- */
function clearTimers(){clearInterval(S.clock);clearTimeout(S.auto);clearTimeout(S.flashT)}
let tickBusy=0;
async function tick(){
 if(!S.room||(tickBusy&&Date.now()-tickBusy<9000))return;tickBusy=Date.now();
 try{
  const r=await rpc('live_room_state',{p_room:S.room.id});if(!r.length)return;
  const old=S.room.status+'|'+S.room.current_question,hold=syHealthy()?{status:S.room.status,current_question:S.room.current_question}:{};S.room={...S.room,...r[0],...hold};const now=S.room.status+'|'+S.room.current_question;if(!S.host&&!hold.status)PS.at=0;
  if(S.host){
   if(S.phase==='lobby')paintLobbyPlayers(await players());
   else if(S.phase==='question'){
    const n=await rpc('live_answer_count',{p_room:S.room.id,p_question:qi()});const c=Number(n)||0;paintDots(c);
    if(HS.n&&c>=HS.n&&!S.allIn){S.allIn=true;setTimeout(()=>{if(S.phase==='question')reveal()},1200/speed())}}
   if(S.phase!=='question')S.allIn=false;
  }else if(old!==now||(S.room.status==='reveal'&&S.phase==='p-question'))playerView();
 }catch(e){}finally{tickBusy=0}
}
function poll(){clearInterval(S.poll);S.poll=setInterval(tick,1000/Math.min(3,speed()))}
function closeAll(){clearInterval(S.poll);clearTimers();syClose();S.poll=null;$('lg2-menu')?.remove();$('lg2')?.remove();document.documentElement.classList.remove('lg2-open');try{A().music(null);A().stopAll&&A().stopAll()}catch(e){}}
function leave(){bcSend({t:'end'});if(PJ.on){PJ.on=false;PJ.next='';pjFlush()}TL=false;closeAll();try{localStorage.removeItem('iasd_live_ans')}catch(e){}if(S.host)localStorage.removeItem('iasd_live_host');else localStorage.removeItem('iasd_live_player');S={room:null,player:null,host:false,poll:null,clock:null,auto:null,phase:'',me:null}}
function fullscreen(){const el=$('lg2');if(!document.fullscreenElement)el?.requestFullscreen?.();else document.exitFullscreen?.()}
let recBusy=false;
async function reconnect(tries=3,wanted){
 if(recBusy)return false;recBusy=true;
 try{
  for(let a=0;a<tries;a++){
   try{
    await libs();
    const h=JSON.parse(localStorage.getItem('iasd_live_host')||'null');
    if(h?.id){const rr=await rpc('live_room_state',{p_room:h.id});
     if(rr.length&&rr[0].status!=='finished'&&(!wanted||rr[0].code===wanted)){S.room=rr[0];S.host=true;HS.prev={};loadTm();poll();syOpen();deckFor(code());if(S.room.status==='lobby')lobby();else{S.phase='board';const ps=await players();ps.forEach(p=>{HS.prev[p.id]=Number(p.score)||0;HS.streak[p.id]=0;HS.correct[p.id]=0;HS.best[p.id]=0});if(S.room.status==='question'){S.phase='question';hostQuestion()}else{S.phase='board';scoreboard(qi(),deckFor(code())[qi()])}}return true}
     if(!rr.length||rr[0].status==='finished')localStorage.removeItem('iasd_live_host')}
    const p=JSON.parse(localStorage.getItem('iasd_live_player')||'null');
    if(p?.room&&p?.player){const rr=await rpc('live_room_state',{p_room:p.room}),pp=await rpc('live_room_players',{p_room:p.room}),me=pp.find(x=>x.id===p.player);
     if(rr.length&&me&&rr[0].status!=='finished'&&(!wanted||rr[0].code===wanted)){S.room=rr[0];S.player={...me,player_token:p.token};S.host=false;PS={answered:-1,lastScore:Number(me.score)||0,sawQ:-1,revealFor:-1};
      try{const an=JSON.parse(localStorage.getItem('iasd_live_ans')||'null');if(an&&an.room===S.room.id){PS.answered=an.q;PS.pickFor=an.q;PS.lastPick=an.pick}}catch(e){}
      deckFor(code());poll();playerView();syOpen();return true}
     if(!rr.length||!me||rr[0].status==='finished')localStorage.removeItem('iasd_live_player')}
    return false
   }catch(e){await new Promise(r=>setTimeout(r,1500))}
  }
  return false
 }finally{recBusy=false}
}
/* sair / encerrar */
async function cancelRoom(){
 const total=cfgOf(code()).total;sySend({t:'closed'});
 try{await patchRoom({status:'finished',current_question:total})}catch(e){try{await patchRoom({status:'finished'})}catch(e2){console.warn(e2)}}
 leave();
}
async function exit(){
 if(!S.room){closeAll();return}
 const done=S.phase==='final'||S.phase==='p-final';
 if(S.host){
  if(done)return leave();
  if(!confirm('Encerrar a sala? Os jogadores serão desconectados e a partida termina.'))return;
  await cancelRoom();
 }else{
  if(!done&&!confirm('Sair da sala?'))return;
  leave();
 }
}
async function telao(){
 let sent=false;
 if(localStorage.getItem('iasd-projetor-token')){
  try{await pjReq('/open');PJ.on=true;PJ.big=0;sent=true;snapSoon(true);
   toast('📽 Jogo enviado ao IASD Projetor');return}
  catch(e){if(!/nopair|Failed to fetch|NetworkError|Load failed/i.test(e.message)){if(!confirm('IASD Projetor: '+e.message+'\n\nAbrir o telão numa janela do navegador?'))return}}
 }
 const w=window.open('/jogos?telao=1','iasd-telao','popup=yes,width=1280,height=720');
 if(!w){alert('O navegador bloqueou a janela. Permita pop-ups para o IASD APP e tente de novo.');return}
 setTimeout(()=>snapSoon(true),1200);
}
/* janela do telão: só mostra o que o apresentador está vendo */
function telaoMode(){
 css();document.documentElement.classList.add('lg2-open');
 const r=document.createElement('div');r.id='lg2';r.className='lg2 telao';document.body.appendChild(r);
 const wait='<div class="lg2-center"><span class="lg2-pill">📺 TELÃO</span><h1 class="lg2-hero">Aguardando o apresentador…</h1><p class="lg2-sub">Crie a sala na outra janela e use o botão 📽 Projetar no telão.</p></div>';
 r.innerHTML='<div class="lg2-bg">'+'<i></i>'.repeat(8)+'</div><div class="lg2-chrome"><span class="lg2-sp"></span><button class="lg2-ic" onclick="IASDLive.fullscreen()" aria-label="Tela cheia" title="Tela cheia (F11)">⛶</button></div><div class="lg2-body" id="lg-mirror">'+wait+'</div>';
 const body=()=>document.getElementById('lg-mirror');let sid=-1,got=false;
 const onMsg=e=>{const m=e.data||{},b=body();if(!b)return;
  if(m.t==='snap'){got=true;b.className=m.cls;b.setAttribute('style',m.style);if(m.sid!==sid){sid=m.sid;b.innerHTML=m.html}else{const t=document.createElement('div');t.innerHTML=m.html;syncNode(b,t)}}
  else if(m.t==='confetti')confetti(m.ms);
  else if(m.t==='end'){got=false;sid=-1;b.className='lg2-body';b.removeAttribute('style');b.innerHTML=wait}};
 BC.onmessage=onMsg;window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data&&e.data.t)onMsg({data:e.data})});
 const emb=window.parent!==window;const hello=()=>{if(!got){BC.postMessage({t:'hello'});if(emb)try{parent.postMessage({t:'lg-hello'},location.origin)}catch(e){}}};hello();setInterval(hello,2500);
 document.addEventListener('dblclick',fullscreen);
}
function install(){
 const qs=new URLSearchParams(location.search);
 if(qs.get('telao'))return telaoMode();
 const gameCode=qs.get('game');
 if(gameCode){setTimeout(async()=>{if(await reconnect(1,gameCode))return;await home();joinForm(gameCode)},300)}
 else if(location.pathname==='/jogos'&&(localStorage.getItem('iasd_live_host')||localStorage.getItem('iasd_live_player')))reconnect();
}
const API={home,setup,create,joinForm,join,start,reveal,next,answer,close:closeAll,leave,exit,telao,cancel:cancelRoom,fullscreen,sndMenu,
 sound:new Proxy({},{get:(_,k)=>()=>{try{window.IASDGameAudio?.sfx(k)}catch(e){}}}),
 _state:()=>({S,HS,PS}),_deck:c=>deckFor(c)};
window.IASDLive=API;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
