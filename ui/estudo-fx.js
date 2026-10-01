/* Sala de Estudo — efeitos e atividades ao vivo: sons, desafio por questão, palco de respostas, intervalo.
   Usa a API interna exposta por estudo.js em window.IASDEstudoCore. Tudo é sincronizado pelo canal da sala. */
(function(){
'use strict';
const K=()=>window.IASDEstudoCore;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rid=()=>Math.random().toString(36).slice(2,8);
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const F={ch:null,hostCh:null,stage:null,brk:null,score:{},board:[]};

/* ---------- sons (WebAudio, sem arquivos) ---------- */
let ctx=null,muted=false;try{muted=localStorage.getItem('iasd-study-sfx')==='0'}catch(e){}
function ac(){if(!ctx){try{ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{ac()},{passive:true}));
function tone(f,d,type,v,at,f2){const a=ac();if(!a||muted||document.body.classList.contains('es-susp'))return;const t=a.currentTime+(at||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.05)}
function noise(d,hp,v,at){const a=ac();if(!a||muted||document.body.classList.contains('es-susp'))return;const n=Math.max(1,Math.floor(a.sampleRate*d)),buf=a.createBuffer(1,n,a.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource();s.buffer=buf;const f=a.createBiquadFilter();f.type='highpass';f.frequency.value=hp||800;const g=a.createGain();g.gain.value=v||.15;s.connect(f);f.connect(g);g.connect(a.destination);s.start(a.currentTime+(at||0))}
const SFX={
 tick(){tone(1400,.035,'square',.07)},tock(){tone(900,.05,'square',.06)},
 beat(){tone(70,.14,'sine',.5);tone(58,.16,'sine',.4,.17)},
 riser(){tone(150,1.5,'sawtooth',.05,0,900)},
 buzz(){tone(140,.75,'sawtooth',.22);tone(105,.75,'square',.12)},
 ding(){tone(880,.35,'sine',.2);tone(1320,.5,'sine',.14,.08)},
 win(){[523,659,784,1046].forEach((f,i)=>tone(f,.3,'triangle',.18,i*.1))},
 lose(){tone(260,.55,'sawtooth',.12,0,110)},
 pop(){tone(520,.12,'sine',.18,0,980)},
 whoosh(){noise(.55,700,.12)},
 drum(){for(let i=0;i<20;i++)noise(.07,180,.1*(.5+i/26),i*.075)},
 crash(){noise(1.3,2800,.2)},
 chime(){tone(660,.6,'sine',.12);tone(990,.8,'sine',.08,.15)}
};
function setMuted(m){muted=!!m;try{localStorage.setItem('iasd-study-sfx',muted?'0':'1')}catch(e){}document.querySelectorAll('.fx-snd').forEach(b=>{b.textContent=muted?'🔇':'🔊'})}
const sndBtn=()=>'<button type="button" class="fx-snd" onclick="IASDEstudoFX.toggleSound()" aria-label="Som">'+(muted?'🔇':'🔊')+'</button>';

/* ---------- desafio por questão ---------- */
const STOP=new Set(['porque','sendo','entre','sobre','quando','assim','ainda','nosso','nossa','vossa','dessa','desse','aquele','aquela','todos','todas','também','portanto','contudo','mesmo','depois','antes','onde','qual','quais','pois','como','muito','todo','toda','seus','suas','esse','essa','isto','aquilo','cujo','cuja']);
const words=t=>(t.match(/[A-Za-zÀ-ÿ]{5,}/g)||[]).filter(w=>!STOP.has(w.toLowerCase()));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
async function verseOf(ref){
 const k=K(),r=k.parseRef(ref);if(!r)return null;
 const vs=await k.chapter(r.book,r.chapter);
 const from=r.from||1,to=r.from?(r.to||r.from):Math.min(from+1,vs.length);
 const pick=vs.filter(v=>v.verse>=from&&v.verse<=to);if(!pick.length)return null;
 return {r,vs,pick,text:pick.map(v=>String(v.text).trim()).join(' ')};
}
async function mkVerso(b){
 for(const ref of shuffle(b.refs||[])){
  const v=await verseOf(ref).catch(()=>null);if(!v)continue;
  const ws=words(v.text);if(ws.length<2)continue;
  const ans=ws[Math.floor(ws.length*(.25+Math.random()*.5))]||ws[0];
  const pool=[...new Set(words(v.vs.map(x=>x.text).join(' ')).filter(w=>w.toLowerCase()!==ans.toLowerCase()&&Math.abs(w.length-ans.length)<=3))];
  if(pool.length<3)continue;
  const opts=shuffle([ans].concat(shuffle(pool).slice(0,3)));
  const re=new RegExp('(^|[^A-Za-zÀ-ÿ])'+ans+'(?![A-Za-zÀ-ÿ])');
  return {kind:'verso',ref,prompt:'“'+v.text.replace(re,(m,p)=>p+'_____')+'”',opts,answer:opts.indexOf(ans),secs:20,head:'Complete o versículo'};
 }
 return null;
}
async function mkRef(b){
 for(const ref of shuffle(b.refs||[])){
  const v=await verseOf(ref).catch(()=>null);if(!v||v.text.length<20)continue;
  const lbl=(r,c,a,z)=>r.name+' '+c+':'+a+(z&&z!==a?'-'+z:'');
  const r=v.r,a=r.from||1,z=r.to&&r.to!==a?r.to:null,right=lbl(r,r.chapter,a,z),set=new Set([right]);
  let guard=0;while(set.size<4&&guard++<40){const c=Math.max(1,r.chapter+Math.floor(Math.random()*7)-3),vv=Math.max(1,a+Math.floor(Math.random()*9)-4);set.add(lbl(r,c,vv,z?vv+(z-a):null))}
  if(set.size<4)continue;
  const opts=shuffle([...set]);
  return {kind:'ref',ref,prompt:'“'+v.text.slice(0,420)+'”',opts,answer:opts.indexOf(right),secs:20,head:'Qual é a referência?'};
 }
 return null;
}
function mkVF(b){
 if(b.kind!=='vf'||!b.opts||!(b.keys||[]).length)return null;
 const idx=[];b.opts.forEach((o,i)=>{if(/^[VF]$/i.test(String(b.keys[i]||'').trim()))idx.push(i)});if(!idx.length)return null;
 const i=idx[Math.floor(Math.random()*idx.length)];
 return {kind:'vf',ref:'',prompt:'“'+b.opts[i]+'”',opts:['Verdadeiro','Falso'],answer:/^V/i.test(String(b.keys[i]).trim())?0:1,secs:12,head:'Verdadeiro ou falso?'};
}
async function build(b,kind){
 const tries=kind&&kind!=='auto'?[kind]:shuffle(['verso','ref','vf']);
 for(const t of tries){const s=t==='verso'?await mkVerso(b):t==='ref'?await mkRef(b):mkVF(b);if(s)return s}
 return null;
}
async function launch(bi,kind){
 const k=K(),R=k.S.room;if(!R||!R.host)return;
 if(F.hostCh&&F.hostCh.live){k.toast('Já há um desafio em andamento.');return}
 const L=k.lessonSrc(),b=L&&L.blocks[bi];
 if(!b||b.t!=='q'){k.toast('Marque uma pergunta com “▶ Aqui” primeiro.');return}
 k.toast('Preparando o desafio…');
 const s=await build(b,kind);
 if(!s){k.toast('Esta pergunta não tem versículo nem V/F para virar desafio.');return}
 const cid=rid();
 F.hostCh={cid,key:s.answer,answers:{},live:true,secs:s.secs,t0:Date.now()+1700,end:null};
 const pub={cid,kind:s.kind,head:s.head,title:b.text,ref:s.ref,prompt:s.prompt,opts:s.opts,secs:s.secs};
 k.send('chs',pub);playChallenge(pub,true);
}
const SHAPES=['▲','◆','●','■'];
function closeFx(){const o=$('es-fx');if(o)o.remove();if(F.ch){clearInterval(F.ch.tm);clearTimeout(F.ch.auto);F.ch=null}document.body.classList.remove('es-fxon')}
function playChallenge(p,isHost){
 closeFx();stageClose(true);
 const k=K();
 const o=document.createElement('div');o.id='es-fx';o.className='es-fx fx-intro';document.body.appendChild(o);document.body.classList.add('es-fxon');
 F.ch={p,isHost,answered:-1,t0:0,left:p.secs,tm:null,done:false,res:null};
 o.innerHTML='<div class="fx-vig"></div><div class="fx-top"><span class="fx-tag">🎯 DESAFIO</span>'+sndBtn()+(isHost?'':'<button type="button" class="fx-x" onclick="IASDEstudoFX.closeLocal()" aria-label="Fechar">✕</button>')+'</div>'
  +'<div class="fx-intro-box"><div class="fx-big">DESAFIO!</div><p>'+esc(p.head)+'</p><small>'+esc(p.title)+'</small></div>';
 SFX.whoosh();SFX.riser();
 setTimeout(()=>{if(!F.ch||F.ch.p!==p)return;
  F.ch.t0=Date.now();o.classList.remove('fx-intro');o.classList.add('fx-play');
  o.innerHTML='<div class="fx-vig"></div><div class="fx-top"><span class="fx-tag">🎯 '+esc(p.head.toUpperCase())+(p.ref&&!isHost?'':'')+'</span>'+sndBtn()+(isHost?'':'<button type="button" class="fx-x" onclick="IASDEstudoFX.closeLocal()" aria-label="Fechar">✕</button>')+'</div>'
   +'<div class="fx-body"><div class="fx-timer"><svg viewBox="0 0 100 100"><circle class="fx-ring-bg" cx="50" cy="50" r="44"/><circle id="fx-ring" class="fx-ring" cx="50" cy="50" r="44"/></svg><b id="fx-num">'+p.secs+'</b></div>'
   +'<div class="fx-q">'+esc(p.prompt)+'</div>'
   +'<div class="fx-opts n'+p.opts.length+'">'+p.opts.map((t,i)=>'<button type="button" class="fx-o c'+i+'" data-i="'+i+'" '+(isHost?'disabled':'')+' onclick="IASDEstudoFX.pick('+i+')"><i>'+SHAPES[i%4]+'</i><span>'+esc(t)+'</span></button>').join('')+'</div>'
   +'<div class="fx-foot" id="fx-foot">'+(isHost?'<span id="fx-cnt">0 respostas</span><button type="button" class="fx-end" onclick="IASDEstudoFX.endNow()">Encerrar agora</button>':'<span>Toque na resposta certa — quanto mais rápido, mais pontos.</span>')+'</div></div>';
  tickCh();F.ch.tm=setInterval(tickCh,100);
 },1700);
}
function tickCh(){
 const c=F.ch;if(!c||c.done)return;const p=c.p,el=Math.max(0,(Date.now()-c.t0)/1000),left=Math.max(0,p.secs-el),sec=Math.ceil(left);
 const ring=$('fx-ring'),num=$('fx-num'),o=$('es-fx');if(!ring||!num||!o)return;
 const C=2*Math.PI*44;ring.style.strokeDasharray=C;ring.style.strokeDashoffset=C*(1-left/p.secs);
 if(num.textContent!==String(sec)){num.textContent=sec;
  if(left>0){if(sec<=5){SFX.beat();SFX.tick()}else SFX.tock()}}
 o.classList.toggle('fx-hot',left<=5&&left>0);o.classList.toggle('fx-late',left<=2&&left>0);
 if(left<=0){c.done=true;clearInterval(c.tm);SFX.buzz();o.classList.remove('fx-hot','fx-late');o.classList.add('fx-time');
  const f=$('fx-foot');if(f&&!c.isHost)f.innerHTML='<span>⏰ Tempo! Aguardando o resultado…</span>';
  if(c.isHost)setTimeout(()=>finishChallenge(),900)}
}
function pick(i){
 const c=F.ch,k=K();if(!c||c.isHost||c.done||c.answered>=0)return;
 c.answered=i;const ms=Date.now()-c.t0;SFX.pop();
 document.querySelectorAll('#es-fx .fx-o').forEach(b=>{b.disabled=true;b.classList.toggle('sel',+b.dataset.i===i);b.classList.toggle('dim',+b.dataset.i!==i)});
 const f=$('fx-foot');if(f)f.innerHTML='<span>✔ Resposta enviada! Aguardando o tempo acabar…</span>';
 k.send('cha',{cid:c.p.cid,id:k.S.room.me,name:k.myName(),i,ms});
}
function onAnswer(m){
 const h=F.hostCh;if(!h||!h.live||m.cid!==h.cid||h.answers[m.id])return;
 h.answers[m.id]={name:String(m.name||'?').slice(0,40),i:+m.i,ms:Math.max(0,Math.min(+m.ms||0,h.secs*1000))};
 const n=Object.keys(h.answers).length,cnt=$('fx-cnt');if(cnt)cnt.textContent=n+(n===1?' resposta':' respostas');
 SFX.pop();
 const R=K().S.room;if(!R)return;const total=Object.keys(R.peers).length;
 if(total&&n>=total&&F.ch&&!F.ch.done){setTimeout(()=>{if(F.hostCh&&F.hostCh.live&&F.ch&&!F.ch.done){F.ch.done=true;clearInterval(F.ch.tm);finishChallenge()}},900)}
}
function endNow(){if(F.ch&&F.hostCh&&F.hostCh.live){F.ch.done=true;clearInterval(F.ch.tm);finishChallenge()}}
function finishChallenge(){
 const h=F.hostCh,k=K();if(!h||!h.live||!k.S.room)return;h.live=false;
 const ans=Object.entries(h.answers).map(([id,a])=>{const ok=a.i===h.key,pts=ok?Math.round(1000-700*(a.ms/(h.secs*1000))):0;
  const s=F.score[id]=F.score[id]||{name:a.name,pts:0};s.name=a.name;s.pts+=pts;return {id,name:a.name,i:a.i,pts,ms:a.ms}});
 const board=Object.entries(F.score).map(([id,s])=>({id,name:s.name,pts:s.pts})).sort((a,b)=>b.pts-a.pts).slice(0,8);
 const res={cid:h.cid,correct:h.key,ans,board,total:Object.keys(k.S.room.peers).length};
 k.send('chr',res);showResult(res);
}
function showResult(res){
 const c=F.ch,k=K();if(!c||c.p.cid!==res.cid)return;
 c.done=true;clearInterval(c.tm);c.res=res;
 const o=$('es-fx');if(!o)return;o.classList.remove('fx-hot','fx-late','fx-time','fx-play','fx-intro');o.classList.add('fx-res');
 const me=res.ans.find(a=>a.id===k.S.room.me),ok=me&&me.i===res.correct;
 o.querySelectorAll('.fx-o').forEach(b=>{const i=+b.dataset.i;b.disabled=true;b.classList.remove('sel','dim');b.classList.add(i===res.correct?'right':'wrong')});
 const nOk=res.ans.filter(a=>a.i===res.correct).length;
 const f=$('fx-foot');
 const board=res.board.map((b,i)=>'<div class="fx-row'+(b.id===k.S.room.me?' me':'')+'" style="--d:'+(i*.12)+'s"><em>'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'º')+'</em><b>'+esc(b.name)+'</b><span>'+b.pts+' pts</span></div>').join('');
 const msg=c.isHost?'<div class="fx-verdict">'+nOk+' de '+res.ans.length+' acertaram</div>':(me?(ok?'<div class="fx-verdict ok">🎉 Acertou! +'+me.pts+' pontos</div>':'<div class="fx-verdict no">Quase! A resposta certa está em verde.</div>'):'<div class="fx-verdict no">⏰ Você não respondeu a tempo.</div>');
 if(f)f.outerHTML='<div class="fx-result">'+msg+(res.board.length?'<div class="fx-board"><h4>Placar da sala</h4>'+board+'</div>':'')+'<div class="fx-acts">'+(c.isHost?'<button type="button" class="fx-end" onclick="IASDEstudoFX.closeAll()">Fechar para todos</button>':'<button type="button" class="fx-end" onclick="IASDEstudoFX.closeLocal()">Continuar</button>')+'</div></div>';
 if(c.isHost||me){if(ok||c.isHost){SFX.win()}else SFX.lose()}else SFX.lose();
 if(c.isHost)F.hostCh=null;
}
function closeAll(){const k=K();k.send('chx',{});closeFx();F.hostCh=null}
function closeLocal(){closeFx()}

/* ---------- palco: revelar respostas como um jogo ---------- */
function ansList(bid){const R=K().S.room;return Object.entries(R.ans[bid]||{}).filter(([id,a])=>a&&String(a.text||'').trim()).map(([id,a])=>({id,name:a.name,text:a.text}))}
function stageOpen(bid){
 const k=K(),R=k.S.room;if(!R)return;
 const L=k.lessonSrc(),b=L&&L.blocks.find(x=>x.id===bid);if(!b)return;
 closeFx();stageClose(true);
 const o=document.createElement('div');o.id='es-stage';o.className='es-stage';document.body.appendChild(o);document.body.classList.add('es-fxon');
 const S2=F.stage={bid,b,shown:new Set(),tm:null,intro:true,spot:null};
 o.innerHTML='<div class="stg-top"><span class="fx-tag">🎬 RESPOSTAS</span>'+sndBtn()+(R.host?'<button type="button" class="stg-close" onclick="IASDEstudoFX.stageEnd()">Encerrar</button>':'<button type="button" class="fx-x" onclick="IASDEstudoFX.stageClose()" aria-label="Fechar">✕</button>')+'</div>'
  +'<h2 class="stg-q">'+esc(b.text)+'</h2>'
  +'<div class="stg-intro" id="stg-intro"><div class="stg-rings"><i></i><i></i><i></i></div><div class="stg-it">Revelando respostas…</div></div>'
  +'<div class="stg-grid" id="stg-grid"></div><div class="stg-tally" id="stg-tally"></div><div class="stg-note" id="stg-note"></div>';
 SFX.drum();
 setTimeout(()=>{if(F.stage!==S2)return;SFX.crash();S2.intro=false;const i=$('stg-intro');if(i)i.classList.add('out');setTimeout(()=>{const i2=$('stg-intro');if(i2)i2.remove()},500);stageRun()},2000);
}
function stageRun(){
 const S2=F.stage;if(!S2||S2.intro)return;
 if(S2.tm)return;
 S2.tm=setInterval(()=>{
  const st=F.stage;if(!st){return}
  const next=ansList(st.bid).find(a=>!st.shown.has(a.id));
  if(!next){clearInterval(st.tm);st.tm=null;stageNote();return}
  st.shown.add(next.id);addCard(next);
 },720);
}
function fmtFor(b,text){return String(text||'')}
function addCard(a){
 const g=$('stg-grid');const k=K(),R=k.S.room;if(!g||!R)return;
 const d=document.createElement('div');d.className='stg-card';d.dataset.id=a.id;d.style.setProperty('--h',hue(a.name));
 d.innerHTML='<span class="stg-av">'+esc((a.name||'?').charAt(0).toUpperCase())+'</span><b>'+esc(a.id===R.me?a.name+' (você)':a.name)+'</b><p>'+esc(a.text)+'</p>';
 d.onclick=()=>{if(R.host)k.send('hl',{bid:F.stage&&F.stage.bid,id:a.id}),spot(F.stage&&F.stage.bid,a.id)};
 g.appendChild(d);SFX.pop();d.scrollIntoView({block:'nearest',behavior:'smooth'});stageTally();stageNote();
}
function stageTally(){
 const S2=F.stage;if(!S2)return;const b=S2.b,t=$('stg-tally');if(!t||b.kind!=='x'||!b.opts)return;
 const list=ansList(S2.bid).filter(a=>S2.shown.has(a.id)),counts=b.opts.map(o=>list.filter(a=>a.text===o).length),mx=Math.max(1,...counts);
 t.innerHTML=b.opts.map((o,i)=>'<div class="stg-bar"><span>'+esc(o)+'</span><i style="--w:'+Math.round(counts[i]*100/mx)+'%"></i><em>'+counts[i]+'</em></div>').join('');
}
function stageNote(){
 const S2=F.stage;if(!S2)return;const k=K(),R=k.S.room,n=$('stg-note');if(!n||!R)return;
 const total=Object.keys(R.peers).length+1,got=ansList(S2.bid).length;
 n.textContent=got?(got<total?(total-got)+' ainda não responderam · toque num cartão para destacar':'Todos responderam · toque num cartão para destacar'):'Ninguém respondeu ainda. As respostas aparecem aqui assim que chegarem.';
 if(!R.host)n.textContent=got?got+' resposta'+(got>1?'s':'')+' reveladas':n.textContent;
}
function spot(bid,id){
 const S2=F.stage;if(!S2||S2.bid!==bid)return;
 const old=document.querySelector('.stg-spot');if(old)old.remove();
 if(!id||S2.spot===id){S2.spot=null;return}
 const a=ansList(bid).find(x=>x.id===id);if(!a)return;S2.spot=id;
 const d=document.createElement('div');d.className='stg-spot';d.style.setProperty('--h',hue(a.name));
 d.innerHTML='<div class="stg-spotc"><span class="stg-av big">'+esc((a.name||'?').charAt(0).toUpperCase())+'</span><b>'+esc(a.name)+'</b><p>'+esc(a.text)+'</p><small>'+(K().S.room.host?'Toque para fechar':'')+'</small></div>';
 d.onclick=()=>{if(K().S.room.host){K().send('hl',{bid,id:null});spot(bid,null)}else{d.remove();S2.spot=null}};
 $('es-stage').appendChild(d);SFX.chime();
}
function stageEnd(){const k=K(),R=k.S.room;if(!R||!R.host||!F.stage)return;const bid=F.stage.bid;R.rev[bid]=false;k.send('rev',{bid,on:false});stageClose(true);k.repaintRv()}
function stageClose(silent){const s=F.stage;if(s&&s.tm)clearInterval(s.tm);F.stage=null;const o=$('es-stage');if(o)o.remove();if(!$('es-fx'))document.body.classList.remove('es-fxon')}

/* ---------- intervalo ---------- */
function breakStart(secs){
 const k=K();breakStop(true);if(!secs)return;
 const o=document.createElement('div');o.id='es-break';o.className='es-break';
 o.innerHTML='<div class="brk-c"><div class="brk-ic">☕</div><h3>Intervalo</h3><div class="brk-t" id="brk-t">--:--</div><p>Aproveitem para esticar as pernas e conversar no chat. Voltamos já.</p>'+(k.S.room.host?'<button type="button" class="fx-end" onclick="IASDEstudoFX.breakEnd()">Encerrar intervalo</button>':'')+'</div>';
 document.body.appendChild(o);F.brk={end:Date.now()+secs*1000,tm:null};SFX.chime();
 const tick=()=>{const left=Math.max(0,Math.ceil((F.brk.end-Date.now())/1000)),t=$('brk-t');if(t)t.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left<=0){SFX.chime();if(k.S.room&&k.S.room.host)breakEnd();else breakStop(true)}};
 tick();F.brk.tm=setInterval(tick,500);
}
function breakStop(silent){if(F.brk&&F.brk.tm)clearInterval(F.brk.tm);F.brk=null;const o=$('es-break');if(o)o.remove()}
function breakEnd(){const k=K();k.send('brk',{secs:0});breakStop(true);k.toast('Intervalo encerrado.')}
function breakGo(secs){const k=K();if(!k.S.room||!k.S.room.host)return;k.send('brk',{secs});breakStart(secs)}

/* ---------- eventos vindos da sala ---------- */
function on(ev,p){
 const k=K(),R=k.S.room;if(!R)return;
 if(ev==='chs'&&!R.host)playChallenge(p,false);
 else if(ev==='cha'&&R.host)onAnswer(p);
 else if(ev==='chr'&&!R.host)showResult(p);
 else if(ev==='chx'&&!R.host)closeFx();
 else if(ev==='stage'){if(p.on)stageOpen(p.bid);else stageClose(true)}
 else if(ev==='ans'){if(F.stage&&F.stage.bid===p.bid){stageRun();stageNote()}}
 else if(ev==='hl')spot(p.bid,p.id);
 else if(ev==='brk')breakStart(+p.secs||0);
 else if(ev==='call'&&p.to===R.me){SFX.chime();k.toast('🙋 O dirigente chamou você. Se quiser falar, ligue o microfone.');if(R.hand){R.hand=false;k.track();k.paintBar()}}
 else if(ev==='mute'&&!R.host){k.muteMic()}
 else if(ev==='end'&&!R.host){closeFx();stageClose(true);breakStop(true);k.endedByHost()}
}
function reset(){closeFx();stageClose(true);breakStop(true);F.hostCh=null;F.score={}}
window.IASDEstudoFX={on,launch,pick,endNow,closeAll,closeLocal,stageEnd,stageClose,toggleSound(){setMuted(!muted)},breakGo,breakEnd,reset,sfx:SFX,stageOpen,
 isLive:()=>!!(F.hostCh&&F.hostCh.live)};
})();
