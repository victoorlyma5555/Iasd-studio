/* Jogos individuais do IASD APP: Quiz Bíblico, Quem Sou Eu?, Linha do Tempo e Memória.
   Jogo livre = treino, sem ranking. Desafio do Dia = mesmas perguntas para todos, 1 tentativa por jogo por dia, vale para o ranking. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jq=v=>esc(JSON.stringify(String(v)));/* literal JS seguro dentro de onclick="..." */
const $=id=>document.getElementById(id);
const stage=()=>$('game-stage');
const E=()=>window.IASDGameEngine;
const A=()=>window.IASDGameAudio||new Proxy({},{get:()=>()=>{}});
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
const GAMES={
 quiz:{t:'Quiz Bíblico',ic:'⚡',c:'#f5b73a',d:'Perguntas de toda a Bíblia, com tempo e combo.'},
 who:{t:'Quem Sou Eu?',ic:'🎭',c:'#a78bfa',d:'Descubra o personagem pelas pistas.'},
 order:{t:'Linha do Tempo',ic:'⏳',c:'#38bdf8',d:'Coloque os acontecimentos na ordem certa.'},
 memory:{t:'Memória Bíblica',ic:'🃏',c:'#34d399',d:'Encontre os pares relacionados.'}
};
let S=null,libPromise=null;

/* ---------- carrega bancos, motor e áudio só quando precisa ---------- */
function loadScript(src){return new Promise((ok,no)=>{if(document.querySelector('script[data-g="'+src+'"]'))return ok();const s=document.createElement('script');s.src=src;s.dataset.g=src;s.onload=ok;s.onerror=()=>no(Error('Falha ao carregar '+src));document.head.appendChild(s)})}
function lib(){
 if(window.IASDGameEngine&&window.IASDGameAudio)return Promise.resolve();
 if(!libPromise)libPromise=(async()=>{const v='?v=8';for(const f of ['audio','bank-quiz','bank-people','bank-study','bank-extra'])await loadScript('/games/'+f+'.js'+v);await loadScript('/games/engine.js'+v)})().catch(e=>{libPromise=null;throw e});
 return libPromise;
}

/* ---------- estrutura comum ---------- */
function stopTimers(){if(S){clearInterval(S.timer);clearTimeout(S.adv);clearInterval(S.clock)}}
function view(html,cls){const st=stage();if(!st)return;st.innerHTML='<div class="sg '+(cls||'')+'">'+html+'</div>';st.scrollIntoView?.({block:'nearest'})}
function top(title,sub,color){return '<div class="sg-top"><button class="sg-back" onclick="IASDSolo.back()"><span>←</span> Voltar aos jogos</button><div class="sg-ttl" style="--gc:'+(color||'#f5b73a')+'"><b>'+esc(title)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div><button class="sg-snd" onclick="IASDSolo.audioMenu(this)" aria-label="Som" title="Som e música">'+sndIcon()+'</button></div>'}
function sndIcon(){const s=A().state?.()||{};return s.music||s.sfx?'🔊':'🔇'}
function audioMenu(btn){
 document.getElementById('sg-audio')?.remove();const st=A().state();
 const m=document.createElement('div');m.id='sg-audio';m.className='sg-audio';
 m.innerHTML='<label><input type="checkbox" id="sg-am" '+(st.music?'checked':'')+'> Música de fundo</label><label><input type="checkbox" id="sg-as" '+(st.sfx?'checked':'')+'> Efeitos sonoros</label><label>Volume<input type="range" id="sg-av" min="0" max="100" value="'+Math.round(st.vol*100)+'"></label>';
 btn.parentElement.appendChild(m);
 $('sg-am').onchange=e=>{A().setMusic(e.target.checked);btn.textContent=sndIcon()};
 $('sg-as').onchange=e=>{A().setSfx(e.target.checked);btn.textContent=sndIcon()};
 $('sg-av').oninput=e=>{A().vol(e.target.value/100);A().sfx('tap')};
 setTimeout(()=>document.addEventListener('click',function h(ev){if(!m.contains(ev.target)&&ev.target!==btn){m.remove();document.removeEventListener('click',h)}}),0);
}
function home(){
 stopTimers();S=null;A().stop?.();
 const st=stage();if(!st)return;
 if(window.IASDPages?.gameCards)st.innerHTML=IASDPages.gameCards();else if(typeof gameModeCards==='function')st.innerHTML=gameModeCards();
 document.getElementById('pg-games')?.scrollIntoView({behavior:'smooth',block:'start'});
}
async function back(){
 if(S&&S.playing&&S.i>0&&!S.over&&!(await IASDDialog.confirm('Sair da partida agora? Seu progresso nesta partida será perdido.')))return;
 A().sfx('click');home();
}
function burst(el,chars){
 if(!el)return;const r=el.getBoundingClientRect(),host=document.createElement('div');host.className='sg-burst';host.style.cssText='left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height/2)+'px';
 for(let i=0;i<14;i++){const s=document.createElement('i');s.textContent=chars[i%chars.length];s.style.setProperty('--dx',(Math.random()*240-120)+'px');s.style.setProperty('--dy',(-60-Math.random()*150)+'px');s.style.setProperty('--r',(Math.random()*360-180)+'deg');s.style.animationDelay=(Math.random()*.12)+'s';host.appendChild(s)}
 document.body.appendChild(host);setTimeout(()=>host.remove(),1400);
}
const chips=(list,sel,fn,multi)=>list.map(x=>'<button type="button" class="sg-chip '+(multi?(sel.includes(x.v)?'on':''):(sel===x.v?'on':''))+'" onclick="IASDSolo.'+fn+'(\''+esc(String(x.v)).replace(/'/g,"\\'")+'\')">'+esc(x.l)+'</button>').join('');

/* ---------- configuração de cada jogo ---------- */
const DEF={quiz:{n:10,timed:20,diff:0,cats:[]},who:{n:8,cats:[]},order:{n:5,size:5,diff:0},memory:{pairs:8,deck:''}};
function open(mode){
 if(!GAMES[mode])return;
 lib().then(()=>{A().unlock();A().music('menu');S={mode,cfg:JSON.parse(JSON.stringify(DEF[mode])),daily:false};setup()}).catch(e=>alert('Não foi possível carregar o jogo. Verifique a conexão.\n'+e.message));
}
function setup(){
 if(S.mode==='memory')return setupMemory();
 const g=GAMES[S.mode],c=S.cfg,en=E();let body='';
 const dayDone=dailyDone(S.mode);
 const daily='<div class="sg-daily '+(dayDone?'done':'')+'"><div><b>🏆 Desafio do dia</b><small>'+(dayDone?'Feito hoje: '+fmt(dayDone.score)+' pontos. Volte amanhã!':'Mesmas perguntas para todos. Uma tentativa por dia. Vale para o ranking.')+'</small></div><button class="sg-go gold" '+(dayDone?'disabled':'onclick="IASDSolo.startDaily(\''+S.mode+'\')"')+'>'+(dayDone?'Concluído ✓':'Jogar o desafio')+'</button></div>';
 if(S.mode==='quiz')body='<div class="sg-opt"><h4>Assuntos</h4><div class="sg-chips">'+chips([{v:'*',l:'Todos os assuntos'}].concat(en.cats().map(x=>({v:x,l:x}))),c.cats.length?c.cats:['*'],'cat',true)+'</div></div>'+
  '<div class="sg-opt"><h4>Dificuldade</h4><div class="sg-chips">'+chips([{v:0,l:'Mista'},{v:1,l:'Fácil'},{v:2,l:'Média'},{v:3,l:'Difícil'}],c.diff,'diff')+'</div></div>'+
  '<div class="sg-opt"><h4>Perguntas</h4><div class="sg-chips">'+chips([{v:10,l:'10'},{v:20,l:'20'},{v:30,l:'30'},{v:50,l:'50'}],c.n,'n')+'</div></div>'+
  '<div class="sg-opt"><h4>Tempo por pergunta</h4><div class="sg-chips">'+chips([{v:0,l:'Sem tempo'},{v:30,l:'30 s'},{v:20,l:'20 s'},{v:10,l:'10 s'}],c.timed,'timed')+'</div></div>';
 if(S.mode==='who')body='<div class="sg-opt"><h4>Categorias</h4><div class="sg-chips">'+chips([{v:'*',l:'Todas'}].concat(en.whoCats().map(x=>({v:x,l:x}))),c.cats.length?c.cats:['*'],'cat',true)+'</div></div>'+
  '<div class="sg-opt"><h4>Personagens</h4><div class="sg-chips">'+chips([{v:5,l:'5'},{v:8,l:'8'},{v:12,l:'12'},{v:20,l:'20'}],c.n,'n')+'</div></div>';
 if(S.mode==='order')body='<div class="sg-opt"><h4>Dificuldade</h4><div class="sg-chips">'+chips([{v:0,l:'Mista'},{v:1,l:'Fácil'},{v:2,l:'Média'},{v:3,l:'Difícil'}],c.diff,'diff')+'</div></div>'+
  '<div class="sg-opt"><h4>Eventos por rodada</h4><div class="sg-chips">'+chips([{v:4,l:'4'},{v:5,l:'5'},{v:6,l:'6'},{v:7,l:'7'}],c.size,'size')+'</div></div>'+
  '<div class="sg-opt"><h4>Rodadas</h4><div class="sg-chips">'+chips([{v:3,l:'3'},{v:5,l:'5'},{v:8,l:'8'},{v:12,l:'12'}],c.n,'n')+'</div></div>';
 if(S.mode==='memory')body='<div class="sg-opt"><h4>Tema</h4><div class="sg-chips">'+chips([{v:'',l:'Surpresa'}].concat(en.decks().map(x=>({v:x.t,l:x.emoji+' '+x.t}))),c.deck,'deck')+'</div></div>'+
  '<div class="sg-opt"><h4>Pares</h4><div class="sg-chips">'+chips([{v:6,l:'6 (fácil)'},{v:8,l:'8'},{v:10,l:'10'},{v:12,l:'12 (difícil)'}],c.pairs,'pairs')+'</div></div>';
 view(top(g.t,'Jogo livre: treine à vontade',g.c)+'<div class="sg-hero" style="--gc:'+g.c+'"><span class="sg-big">'+g.ic+'</span><div><h2>'+esc(g.t)+'</h2><p>'+esc(g.d)+'</p></div></div>'+daily+'<div class="sg-free"><h3>Jogo livre <small>não conta pontos no ranking</small></h3>'+body+'<button class="sg-go" onclick="IASDSolo.start()">▶ Começar</button></div>','sg-setup');
}

/* ---------- Memória Bíblica: tela de escolha (tema + dificuldade) ---------- */
const MEM_ART={
 'Personagens e feitos':['🧔','#8a4412','#1b2552'],'Eventos e lugares':['🏛️','#6f4d1e','#1b2b5d'],'Livros da Bíblia e temas':['📖','#16356f','#0a1a3e'],
 'Discípulos e características':['👥','#7d3d14','#111b47'],'Mulheres da Bíblia':['👩','#80402c','#15244f'],'Casais da Bíblia':['💑','#8e3d24','#2b1a42'],
 'Parábolas de Jesus':['🌾','#745a18','#15244f'],'Profetas e mensagens':['📣','#15244f','#4b2b70'],'Pessoas curadas por Jesus':['🤲','#7d3d14','#15244f'],
 'Viagens de Paulo':['⛵','#0f4d72','#10244f'],'Apocalipse':['🐎','#8c1a1a','#3b0b0b'],'Símbolos e significados':['🦁','#7d4c10','#2b1709'],
 'Reis e feitos':['👑','#7d5c14','#1b1b42'],'Nomes de Jesus':['🌟','#8e4c10','#1b1131'],'O santuário':['⛺','#5d4c2c','#15244f'],
 'Criação e Éden':['🌿','#216e3c','#0c3c60'],'Lugares de Jesus':['⛰️','#6e4c2c','#1b2b62']
};
const MEM_LVL=[{p:6,t:'6 pares (Fácil)',d:'Ideal para iniciantes',c:'#22c55e'},{p:8,t:'8 pares (Médio)',d:'Equilíbrio perfeito',c:'#fbbf24'},{p:12,t:'12 pares (Difícil)',d:'Para quem já conhece bem',c:'#ef4444'}];
const MEM_BIBLE='<svg viewBox="0 0 520 240" aria-hidden="true"><defs><radialGradient id="mg" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#fff4c2"/><stop offset=".25" stop-color="#ffc24a" stop-opacity=".95"/><stop offset=".7" stop-color="#f08a1c" stop-opacity=".25"/><stop offset="1" stop-color="#f08a1c" stop-opacity="0"/></radialGradient><linearGradient id="mp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ecd2"/><stop offset="1" stop-color="#c9b58a"/></linearGradient><linearGradient id="mr" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd978" stop-opacity=".85"/><stop offset="1" stop-color="#ffd978" stop-opacity="0"/></linearGradient></defs><ellipse cx="260" cy="150" rx="250" ry="110" fill="url(#mg)"/><g fill="url(#mr)"><path d="M260 150 L120 0 L170 0z"/><path d="M260 150 L215 0 L250 0z"/><path d="M260 150 L270 0 L305 0z"/><path d="M260 150 L350 0 L400 0z"/></g><path d="M260 190 C205 158 120 150 52 168 L52 96 C122 78 207 90 260 126z" fill="url(#mp)"/><path d="M260 190 C315 158 400 150 468 168 L468 96 C398 78 313 90 260 126z" fill="url(#mp)"/><path d="M260 126 L260 192" stroke="#8a6a35" stroke-width="3"/><g stroke="#8a6a35" stroke-opacity=".45" stroke-width="2" fill="none"><path d="M78 112c40-8 95-4 160 20"/><path d="M78 130c40-8 95-4 160 20"/><path d="M78 148c40-8 95-4 160 20"/><path d="M442 112c-40-8-95-4-160 20"/><path d="M442 130c-40-8-95-4-160 20"/><path d="M442 148c-40-8-95-4-160 20"/></g></svg>';
function memCard(d,sel,i){
 const t=d?d.t:'Surpresa',art=d?(MEM_ART[d.t]||['✦','#27407a','#10204a']):['🧰','#0f3d42','#7a4a08'];
 const sub=d?d.n+' pares':'Tema aleatório';
 return '<button type="button" class="mm-th'+(sel?' on':'')+'" style="--a:'+art[1]+';--b:'+art[2]+'" onclick="IASDSolo.deck(\''+esc(d?d.t:'').replace(/'/g,"\\'")+'\')" aria-pressed="'+(sel?'true':'false')+'"><span class="art">'+art[0]+'</span><span class="ico">'+(d?esc(d.emoji||'✦'):'★')+'</span><b>'+esc(t)+'</b><small>'+sub+'</small><i class="go">'+(d?'→':'?')+'</i></button>';
}
function setupMemory(){
 const g=GAMES.memory,c=S.cfg,en=E(),decks=en.decks(),dayDone=dailyDone('memory');
 const cur=c.deck?decks.find(x=>x.t===c.deck):null;
 const daily='<div class="mm-daily'+(dayDone?' done':'')+'"><div class="hd"><span class="cup">🏆</span><b>Desafio do dia</b></div><p>'+(dayDone?'Feito hoje: '+fmt(dayDone.score)+' pontos.<br>Volte amanhã!':'Mesmas perguntas para todos.<br>Uma tentativa por dia.<br>Vale para o ranking.')+'</p><button class="mm-gold" '+(dayDone?'disabled':'onclick="IASDSolo.startDaily(\'memory\')"')+'>'+(dayDone?'Concluído ✓':'Jogar o desafio <span>›</span>')+'</button></div>';
 const themes=memCard(null,!c.deck,0)+decks.map((d,i)=>memCard(d,c.deck===d.t,i+1)).join('');
 const lvl=MEM_LVL.map(l=>'<button type="button" class="mm-lv'+(c.pairs===l.p?' on':'')+'" style="--c:'+l.c+'" onclick="IASDSolo.pairs('+l.p+')"><i></i><span><b>'+l.t+'</b><small>'+l.d+'</small></span></button>').join('');
 const n=c.pairs;
 view('<div class="sg-top"><button class="sg-back" onclick="IASDSolo.back()"><span>←</span> Voltar aos jogos</button><span style="flex:1"></span><button class="sg-snd" onclick="IASDSolo.audioMenu(this)" aria-label="Som">'+sndIcon()+'</button></div>'+
  '<section class="mm-hero"><div class="mm-bible">'+MEM_BIBLE+'</div><div class="mm-title"><span class="mm-tile">🎮</span><div><h2>Memória Bíblica</h2><p>Encontre os pares relacionados e teste seus conhecimentos sobre a Bíblia.</p></div></div>'+daily+'</section>'+
  '<section class="mm-card"><div class="mm-h"><span class="mm-hi">▰</span><div><h3>Escolha o tema</h3><small>Selecione um tema para começar o jogo</small></div></div><div class="mm-grid">'+themes+'</div></section>'+
  '<section class="mm-card mm-lvl"><div class="mm-h"><span class="mm-hi bars">▂▄▆</span><div><h3>Escolha o nível de dificuldade</h3><small>Mais pares deixam o jogo mais desafiador</small></div></div><div class="mm-lvs">'+lvl+'</div><button class="mm-start" onclick="IASDSolo.start()"><span class="pl">▶</span><span><b>Começar Jogo</b><small>Tema: '+esc(cur?cur.t:'Surpresa')+' • '+n+' pares</small></span></button></section>','sg-setup mm');
}
function set(k,v){S.cfg[k]=v;setup();A().sfx('tap')}
const API={
 open,back,home,audioMenu,
 cat(v){const c=S.cfg;if(v==='*')c.cats=[];else{const i=c.cats.indexOf(v);if(i>=0)c.cats.splice(i,1);else c.cats.push(v)}setup();A().sfx('tap')},
 diff(v){set('diff',+v)},n(v){set('n',+v)},timed(v){set('timed',+v)},size(v){set('size',+v)},pairs(v){set('pairs',+v)},deck(v){set('deck',v)},
 start(){build(false)},
 startDaily(game){lib().then(()=>{A().unlock();S={mode:game,cfg:JSON.parse(JSON.stringify(DEF[game])),daily:true};build(true)})}
};

/* ---------- desafio do dia: controle local ---------- */
function dayKey(game){return 'iasd-daily-'+E().today()+'-'+game}
function dailyDone(game){try{return JSON.parse(localStorage.getItem(dayKey(game))||'null')}catch(e){return null}}
function dailyMark(game,data){try{localStorage.setItem(dayKey(game),JSON.stringify(data))}catch(e){}}

function build(daily){
 const en=E(),c=S.cfg;S.daily=daily;S.i=0;S.score=0;S.streak=0;S.best=0;S.correct=0;S.answered=0;S.log=[];S.over=false;S.playing=true;S.t0=Date.now();S.fifty=daily?0:2;S.skips=daily?0:2;
 if(daily){if(dailyDone(S.mode)){alert('Você já fez o desafio de hoje deste jogo. Volte amanhã!');return setup()}
  S.qs=en.daily(S.mode);if(S.mode==='memory'){S.mem=S.qs;S.qs=[S.mem]}c.timed=S.mode==='quiz'?20:0}
 else{
  if(S.mode==='quiz')S.qs=en.quiz({n:c.n,cats:c.cats,diff:c.diff||0});
  if(S.mode==='who')S.qs=en.who({n:c.n,cats:c.cats});
  if(S.mode==='order')S.qs=en.timeline({n:c.n,size:c.size,diff:c.diff||0});
  if(S.mode==='memory'){S.mem=en.memory({pairs:c.pairs,deck:c.deck});S.qs=[S.mem]}}
 if(!S.qs||!S.qs.length||(S.mode==='memory'&&!S.mem.cards.length)){alert('Não há perguntas para esta escolha. Tente outros filtros.');return setup()}
 S.total=S.mode==='memory'?S.mem.pairs:S.qs.length;
 countdown(()=>{A().music('play');next()});
}
function countdown(done){
 let n=3;const g=GAMES[S.mode];
 const paint=()=>view('<div class="sg-count" style="--gc:'+g.c+'"><span>'+(S.daily?'Desafio do dia':g.t)+'</span><b>'+(n||'Já!')+'</b></div>','sg-cd');
 paint();A().sfx(n?'count':'go');
 S.clock=setInterval(()=>{n--;paint();if(n>0)A().sfx('count');else{A().sfx('go');clearInterval(S.clock);setTimeout(done,450)}},800);
}
function next(){
 if(S.mode==='memory')return playMemory();
 if(S.i>=S.qs.length)return finish();
 if(S.mode==='quiz')return playQuiz();
 if(S.mode==='who')return playWho();
 if(S.mode==='order')return playOrder();
}
function hud(extra){
 const pct=Math.round(S.i/Math.max(1,S.total)*100);
 return '<div class="sg-hud"><div class="sg-prog"><i style="width:'+pct+'%"></i></div><span class="sg-n">'+Math.min(S.i+1,S.total)+' / '+S.total+'</span><b class="sg-score" id="sg-score">'+fmt(S.score)+'</b><span class="sg-streak '+(S.streak>=2?'hot':'')+'" id="sg-streak">🔥 ×'+Math.max(1,S.streak)+'</span>'+(extra||'')+'</div>';
}
function setScore(add){
 const from=S.score;S.score+=add;const el=$('sg-score');if(!el)return;
 const t0=performance.now();const tick=now=>{const k=Math.min(1,(now-t0)/500);el.textContent=fmt(Math.round(from+(S.score-from)*k));if(k<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);
 el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');
}
function streakUp(ok){
 if(ok){S.streak++;S.best=Math.max(S.best,S.streak);S.correct++}else S.streak=0;S.answered++;
 const el=$('sg-streak');if(el){el.textContent='🔥 ×'+Math.max(1,S.streak);el.classList.toggle('hot',S.streak>=2)}
 if(ok&&S.streak>=3)A().sfx('streak');
}

/* ---------- QUIZ ---------- */
function playQuiz(){
 const q=S.qs[S.i],c=S.cfg,g=GAMES.quiz;S.locked=false;
 S.left=c.timed;
 view(top(S.daily?'Desafio do dia · Quiz':'Quiz Bíblico','',g.c)+hud()+
  (c.timed?'<div class="sg-tm"><i id="sg-tm-bar"></i><b id="sg-tm-n">'+c.timed+'</b></div>':'')+
  '<div class="sg-card"><span class="sg-cat">'+esc(q.cat||'Quiz')+'</span><h3 class="sg-q">'+esc(q.q)+'</h3>'+(q.hint?'<small class="sg-hint">'+esc(q.hint)+'</small>':'')+'</div>'+
  '<div class="sg-ans">'+q.opts.map((o,i)=>'<button class="sg-a c'+i+'" data-i="'+i+'" onclick="IASDSolo.pick('+i+')"><i>'+'ABCD'[i]+'</i><span>'+esc(o)+'</span></button>').join('')+'</div>'+
  (S.daily?'':'<div class="sg-life"><button onclick="IASDSolo.fifty()" '+(S.fifty?'':'disabled')+'>✂ 50/50 <em>'+S.fifty+'</em></button><button onclick="IASDSolo.skip()" '+(S.skips?'':'disabled')+'>⏭ Pular <em>'+S.skips+'</em></button></div>')+
  '<div id="sg-fb"></div>','sg-play sg-quiz');
 if(c.timed){const t0=Date.now();S.timer=setInterval(()=>{const left=Math.max(0,c.timed-(Date.now()-t0)/1000);S.left=left;const bar=$('sg-tm-bar'),n=$('sg-tm-n');if(bar)bar.style.width=(left/c.timed*100)+'%';if(n)n.textContent=Math.ceil(left);
  if(left<=5&&left>0&&Math.ceil(left)!==S.lastTick){S.lastTick=Math.ceil(left);A().sfx('urgent');if(A().current?.()!=='tension')A().music('tension')}
  if(left<=0){clearInterval(S.timer);answerQuiz(-1)}},100)}
 A().sfx('whoosh');
}
function answerQuiz(i){
 if(S.locked)return;S.locked=true;clearInterval(S.timer);S.lastTick=0;if(A().current?.()==='tension')A().music('play');
 const q=S.qs[S.i],ok=i===q.ans,c=S.cfg;let add=0;
 if(ok){const speed=c.timed?Math.round(100*S.left/c.timed):50;add=100+speed+Math.min(50,S.streak*10)}
 document.querySelectorAll('.sg-a').forEach(b=>{const k=+b.dataset.i;b.disabled=true;if(k===q.ans)b.classList.add('ok');else if(k===i)b.classList.add('bad');else b.classList.add('dim')});
 A().sfx(ok?'correct':'wrong');streakUp(ok);if(ok){setScore(add);burst(document.querySelector('.sg-a.ok'),['✦','⭐','✨'])}
 S.log.push({q:q.q,a:q.a,ok,cat:q.cat,ref:q.ref,pick:i>=0?q.opts[i]:'(sem resposta)'});
 const fb=$('sg-fb');if(fb)fb.innerHTML='<div class="sg-fb '+(ok?'ok':'bad')+'"><b>'+(ok?'✓ Certo! +'+add:(i<0?'⏰ Tempo esgotado':'✗ Não foi dessa vez'))+'</b><span>'+(ok?'':'Resposta: <em>'+esc(q.a)+'</em> · ')+esc(q.ref||'')+'</span><button onclick="IASDSolo.adv()">Próxima →</button></div>';
 S.adv=setTimeout(API.adv,ok?1700:2800);
}
Object.assign(API,{
 pick:i=>answerQuiz(i),
 adv(){if(!S||S.over)return;clearTimeout(S.adv);S.i++;next()},
 fifty(){if(S.locked||!S.fifty)return;const q=S.qs[S.i],wrong=[...document.querySelectorAll('.sg-a')].filter(b=>+b.dataset.i!==q.ans&&!b.disabled);E().shuffle(wrong,Math.random).slice(0,2).forEach(b=>{b.disabled=true;b.classList.add('gone')});S.fifty--;A().sfx('pop');const b=document.querySelector('.sg-life button');if(b){b.disabled=!S.fifty;b.querySelector('em').textContent=S.fifty}},
 skip(){if(S.locked||!S.skips)return;S.skips--;S.locked=true;clearInterval(S.timer);A().sfx('whoosh');const q=S.qs[S.i];S.log.push({q:q.q,a:q.a,ok:false,cat:q.cat,ref:q.ref,pick:'(pulou)',skipped:true});S.i++;S.total=S.total;next()}
});

/* ---------- QUEM SOU EU ---------- */
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
function whoMatch(q,txt){const t=E().fold(txt);if(!t)return false;return q.aliases.some(a=>a===t||(a.length>=5&&lev(a,t)<=(a.length>=9?2:1)))}
function playWho(){
 const q=S.qs[S.i],g=GAMES.who;S.locked=false;S.clues=1;S.tries=0;
 view(top(S.daily?'Desafio do dia · Quem Sou Eu?':'Quem Sou Eu?','',g.c)+hud()+
  '<div class="sg-card who"><span class="sg-cat">'+esc(q.cat)+'</span><div class="sg-mask">🎭</div><div id="sg-clues" class="sg-clues"></div><div class="sg-pts" id="sg-pts"></div></div>'+
  '<form class="sg-input" onsubmit="event.preventDefault();IASDSolo.guess()"><input id="sg-guess" autocomplete="off" autocapitalize="words" placeholder="Quem sou eu?"><button class="sg-go gold" type="submit">Responder</button></form>'+
  '<div class="sg-life"><button onclick="IASDSolo.clue()" id="sg-clue-b">💡 Nova pista <em>−100</em></button>'+'<button onclick="IASDSolo.skipWho()">⏭ Pular pergunta</button>'+(S.daily?'':'<button onclick="IASDSolo.giveup()">🏳 Desistir</button>')+'</div><div id="sg-fb"></div>','sg-play sg-who');
 paintClues();setTimeout(()=>$('sg-guess')?.focus(),50);A().sfx('whoosh');
}
function paintClues(){
 const q=S.qs[S.i],box=$('sg-clues');if(!box)return;
 box.innerHTML=q.clues.map((c,i)=>'<p class="'+(i<S.clues?'on':'off')+'"><b>'+(i+1)+'</b>'+(i<S.clues?esc(c):'Pista bloqueada')+'</p>').join('');
 const pts=[300,200,100][S.clues-1]||100;const p=$('sg-pts');if(p)p.textContent='Vale '+pts+' pontos';
 const b=$('sg-clue-b');if(b)b.disabled=S.clues>=q.clues.length;
}
Object.assign(API,{
 clue(){if(S.locked)return;const q=S.qs[S.i];if(S.clues>=q.clues.length)return;S.clues++;A().sfx('reveal');paintClues()},
 guess(){
  if(S.locked)return;const q=S.qs[S.i],inp=$('sg-guess'),v=inp.value;if(!v.trim())return;
  if(whoMatch(q,v)){const add=[300,200,100][S.clues-1]+Math.min(50,S.streak*10);S.locked=true;A().sfx('correct');streakUp(true);setScore(add);burst($('sg-clues'),['🎉','✨','⭐']);
   S.log.push({q:'Quem sou eu? ('+q.cat+')',a:q.a,ok:true,cat:q.cat,ref:q.ref,pick:v});endWho(true,add)}
  else{S.tries++;A().sfx('wrong');inp.value='';inp.classList.remove('shake');void inp.offsetWidth;inp.classList.add('shake');
   if(S.tries>=3){S.locked=true;streakUp(false);S.log.push({q:'Quem sou eu? ('+q.cat+')',a:q.a,ok:false,cat:q.cat,ref:q.ref,pick:v});endWho(false,0)}
   else if(S.clues<q.clues.length){S.clues++;paintClues()}}
 },
 skipWho(){if(S.locked)return;const q=S.qs[S.i];S.locked=true;clearTimeout(S.adv);A().sfx('whoosh');S.log.push({q:'Quem sou eu? ('+q.cat+')',a:q.a,ok:false,cat:q.cat,ref:q.ref,pick:'(pulou)',skipped:true});S.i++;next()},
 giveup(){if(S.locked)return;const q=S.qs[S.i];S.locked=true;streakUp(false);S.log.push({q:'Quem sou eu? ('+q.cat+')',a:q.a,ok:false,cat:q.cat,ref:q.ref,pick:'(desistiu)'});endWho(false,0)}
});
function endWho(ok,add){
 const q=S.qs[S.i];S.clues=q.clues.length;paintClues();
 const fb=$('sg-fb');fb.innerHTML='<div class="sg-fb '+(ok?'ok':'bad')+'"><b>'+(ok?'✓ Isso mesmo! +'+add:'Era…')+'</b><span><em>'+esc(q.a)+'</em> · '+esc(q.ref||'')+'</span><button onclick="IASDSolo.adv()">Próximo →</button></div>';
 S.adv=setTimeout(API.adv,ok?2200:3400);
}

/* ---------- LINHA DO TEMPO ---------- */
function playOrder(){
 const q=S.qs[S.i],g=GAMES.order;S.locked=false;S.cur=q.shuffled.slice();S.sel=-1;
 view(top(S.daily?'Desafio do dia · Linha do Tempo':'Linha do Tempo','',g.c)+hud()+
  '<div class="sg-card"><span class="sg-cat">Do mais antigo ao mais recente</span><h3 class="sg-q">'+esc(q.title)+'</h3><small class="sg-hint">Arraste, ou toque em dois itens para trocá-los. As setas também movem.</small></div>'+
  '<div class="sg-tl-wrap"><span class="sg-era a">⏪ Mais antigo</span><div class="sg-tl" id="sg-tl"></div><span class="sg-era b">Mais recente ⏩</span></div>'+
  '<button class="sg-go gold wide" id="sg-check" onclick="IASDSolo.check()">✓ Confirmar ordem</button><div id="sg-fb"></div>','sg-play sg-order');
 paintOrder();A().sfx('whoosh');
}
function paintOrder(res){
 const box=$('sg-tl');if(!box)return;const q=S.qs[S.i];
 box.innerHTML=S.cur.map((x,i)=>{const r=res?(q.items[i]===x?'ok':'bad'):'';
  return '<div class="sg-it '+r+(S.sel===i?' sel':'')+'" draggable="'+(res?'false':'true')+'" data-i="'+i+'"><span class="n">'+(i+1)+'</span><span class="gr">⠿</span><span class="t">'+esc(x)+(res&&r==='bad'?'<small>correto: nº '+(q.items.indexOf(x)+1)+'</small>':'')+'</span>'+(res?'<span class="m">'+(r==='ok'?'✓':'✗')+'</span>':'<span class="mv"><button aria-label="Subir" onclick="event.stopPropagation();IASDSolo.mv('+i+',-1)">▲</button><button aria-label="Descer" onclick="event.stopPropagation();IASDSolo.mv('+i+',1)">▼</button></span>')+'</div>'}).join('');
 if(!res){box.querySelectorAll('.sg-it').forEach(el=>{
  el.onclick=()=>{const i=+el.dataset.i;if(S.sel<0){S.sel=i;A().sfx('tap')}else if(S.sel===i)S.sel=-1;else{[S.cur[S.sel],S.cur[i]]=[S.cur[i],S.cur[S.sel]];S.sel=-1;A().sfx('flip')}paintOrder()};
  el.ondragstart=e=>{S.drag=+el.dataset.i;el.classList.add('drag');e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(S.drag))}catch(_){}};
  el.ondragend=()=>el.classList.remove('drag');
  el.ondragover=e=>{e.preventDefault();el.classList.add('over')};el.ondragleave=()=>el.classList.remove('over');
  el.ondrop=e=>{e.preventDefault();const to=+el.dataset.i,from=S.drag;if(from==null||from===to)return;const [m]=S.cur.splice(from,1);S.cur.splice(to,0,m);S.drag=null;S.sel=-1;A().sfx('flip');paintOrder()}})}
}
Object.assign(API,{
 mv(i,d){if(S.locked)return;const j=i+d;if(j<0||j>=S.cur.length)return;[S.cur[i],S.cur[j]]=[S.cur[j],S.cur[i]];S.sel=-1;A().sfx('flip');paintOrder()},
 check(){
  if(S.locked)return;S.locked=true;const q=S.qs[S.i];const right=S.cur.filter((x,i)=>q.items[i]===x).length,all=right===q.items.length;
  const add=right*60+(all?100+Math.min(50,S.streak*10):0);paintOrder(true);A().sfx(all?'correct':(right>=q.items.length/2?'match':'wrong'));streakUp(all);setScore(add);if(all)burst($('sg-tl'),['⏳','✨','⭐']);
  S.log.push({q:q.title,a:q.items.join(' → '),ok:all,cat:'Linha do Tempo',ref:q.ref,pick:right+' de '+q.items.length+' no lugar'});
  $('sg-check').style.display='none';
  $('sg-fb').innerHTML='<div class="sg-fb '+(all?'ok':'bad')+'"><b>'+(all?'✓ Ordem perfeita! +'+add:right+' de '+q.items.length+' no lugar certo · +'+add)+'</b><span>'+esc(q.ref||'')+'</span><button onclick="IASDSolo.adv()">Próxima →</button></div>';
  S.adv=setTimeout(API.adv,all?2200:4200)}
});

/* ---------- MEMÓRIA ---------- */
function playMemory(){
 const m=S.mem,g=GAMES.memory,n=m.cards.length;const cols=n<=12?4:n<=16?4:n<=20?5:6;
 S.open=[];S.matched=new Set();S.moves=0;S.locked=false;S.mt0=Date.now();
 view(top(S.daily?'Desafio do dia · Memória':'Memória Bíblica',m.deck,g.c)+
  '<div class="sg-hud mem"><span>⏱ <b id="sg-mt">0:00</b></span><span>🎯 Jogadas <b id="sg-mv">0</b></span><span>✦ Pares <b id="sg-mp">0/'+m.pairs+'</b></span><b class="sg-score" id="sg-score">0</b><span class="sg-streak" id="sg-streak">🔥 ×1</span></div>'+
  '<div class="sg-mem" style="--cols:'+cols+'">'+m.cards.map((c,i)=>'<button class="sg-mc" data-i="'+i+'" onclick="IASDSolo.flip('+i+')" aria-label="Carta"><span class="in"><span class="bk">'+esc(m.emoji||'✦')+'</span><span class="fr '+(c.side?'b':'a')+'">'+esc(c.v)+'</span></span></button>').join('')+'</div>','sg-play sg-memory');
 S.clock=setInterval(()=>{const s=Math.floor((Date.now()-S.mt0)/1000),el=$('sg-mt');if(el)el.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},500);
 A().sfx('whoosh');
}
Object.assign(API,{
 flip(i){
  if(S.locked||S.matched.has(i)||S.open.includes(i))return;
  const el=document.querySelector('.sg-mc[data-i="'+i+'"]');el.classList.add('open');S.open.push(i);A().sfx('flip');
  if(S.open.length<2)return;
  S.locked=true;S.moves++;$('sg-mv').textContent=S.moves;const [a,b]=S.open,ca=S.mem.cards[a],cb=S.mem.cards[b],ok=ca.pair===cb.pair;
  setTimeout(()=>{
   const ea=document.querySelector('.sg-mc[data-i="'+a+'"]'),eb=document.querySelector('.sg-mc[data-i="'+b+'"]');
   if(ok){S.matched.add(a);S.matched.add(b);ea.classList.add('matched');eb.classList.add('matched');A().sfx('match');streakUp(true);setScore(100+Math.min(60,S.streak*15));burst(eb,['✦','⭐']);$('sg-mp').textContent=(S.matched.size/2)+'/'+S.mem.pairs;
    S.answered=S.moves}
   else{ea.classList.add('miss');eb.classList.add('miss');A().sfx('miss');streakUp(false);S.answered=S.moves;setTimeout(()=>{ea.classList.remove('open','miss');eb.classList.remove('open','miss')},520)}
   S.open=[];S.locked=false;
   if(S.matched.size===S.mem.cards.length){clearInterval(S.clock);setTimeout(()=>{const secs=Math.round((Date.now()-S.mt0)/1000);const bonus=Math.max(0,(S.mem.pairs*50)-(S.moves-S.mem.pairs)*20)+Math.max(0,Math.round(S.mem.pairs*30-secs));S.score+=bonus;S.memExtra={moves:S.moves,secs,bonus};S.correct=S.mem.pairs;S.answered=S.moves;S.total=S.mem.pairs;S.i=1;finish()},700)}
  },ok?350:800)}
});

/* ---------- RESULTADO ---------- */
function finish(){
 stopTimers();S.over=true;S.playing=false;A().music(null);
 const en=E();let correct=S.correct,total=S.mode==='memory'?S.mem.pairs:S.total;
 const acc=S.mode==='memory'?Math.max(0,Math.round(100*S.mem.pairs/Math.max(S.moves,S.mem.pairs))):Math.round(100*correct/Math.max(1,total));
 const stars=acc>=90?3:acc>=65?2:acc>=35?1:0;
 A().sfx(stars>=2?'win':stars?'level':'lose');
 const miss=S.log.filter(x=>!x.ok);
 const dayBlock=S.daily?'<div class="sg-dsave" id="sg-dsave">Registrando no ranking do dia…</div>':'<div class="sg-dsave free">Jogo livre: não conta no ranking. Faça o <b>Desafio do dia</b> para pontuar!</div>';
 view(top(S.daily?'Desafio do dia':GAMES[S.mode].t,'Resultado',GAMES[S.mode].c)+
  '<div class="sg-res"><div class="sg-stars">'+[0,1,2].map(i=>'<i class="'+(i<stars?'on':'')+'" style="animation-delay:'+(i*.25)+'s">★</i>').join('')+'</div>'+
  '<h2>'+(stars===3?'Excelente!':stars===2?'Muito bem!':stars===1?'Bom começo!':'Continue treinando!')+'</h2>'+
  '<div class="sg-big-score"><small>PONTOS</small><b>'+fmt(S.score)+'</b></div>'+
  '<div class="sg-stats"><div><b>'+acc+'%</b><small>Precisão</small></div><div><b>'+(S.mode==='memory'?S.memExtra.moves:correct+'/'+total)+'</b><small>'+(S.mode==='memory'?'Jogadas':'Acertos')+'</small></div><div><b>'+(S.mode==='memory'?Math.floor(S.memExtra.secs/60)+':'+String(S.memExtra.secs%60).padStart(2,'0'):'×'+S.best)+'</b><small>'+(S.mode==='memory'?'Tempo':'Melhor sequência')+'</small></div></div>'+dayBlock+
  (miss.length?'<details class="sg-rev"><summary>Revisar o que errou ('+miss.length+')</summary>'+miss.map(x=>'<div><b>'+esc(x.q)+'</b><span>Resposta: <em>'+esc(x.a)+'</em>'+(x.ref?' · '+esc(x.ref):'')+'</span></div>').join('')+'</details>':'')+
  '<div class="sg-end">'+(S.daily?'':'<button class="sg-go gold" onclick="IASDSolo.again()">↻ Jogar de novo</button>')+'<button class="sg-go" onclick="IASDSolo.back()">Voltar aos jogos</button></div></div>','sg-result');
 if(stars>=2)setTimeout(()=>burst(document.querySelector('.sg-stars'),['🎉','⭐','✨','🎊']),300);
 if(S.daily)submitDaily({game:S.mode,score:Math.round(S.score),correct:S.mode==='memory'?S.mem.pairs:correct,total:S.mode==='memory'?S.mem.pairs:total,streak:S.best});
}
API.again=()=>{A().sfx('click');const mode=S.mode,cfg=S.cfg;S={mode,cfg,daily:false};build(false)};
async function submitDaily(r){
 dailyMark(r.game,{score:r.score,correct:r.correct,total:r.total,at:Date.now()});
 const el=()=>$('sg-dsave');
 try{
  if(typeof cloud==='undefined'||!cloud||typeof cloudUser==='undefined'||!cloudUser){if(el())el().innerHTML='Entre na sua conta para seu resultado entrar no ranking. <button class="sg-link" onclick="openAuthModal&&openAuthModal()">Entrar</button>';return}
  const res=await cloud.rpc('iasd_record_daily',{p_game:r.game,p_score:r.score,p_correct:r.correct,p_total:r.total,p_streak:r.streak});
  if(res.error)throw res.error;
  if(el())el().innerHTML=res.data===false?'Você já tinha pontuado neste jogo hoje.':'✅ <b>'+fmt(r.score)+' pontos</b> registrados no ranking de hoje!';
  window.IASDPages?.dailyReload?.();
 }catch(e){
  const miss=/function|schema cache|does not exist|iasd_record_daily/i.test(e?.message||'');
  if(el())el().innerHTML=miss?'O ranking diário ainda não foi ativado no servidor (o administrador precisa rodar o script do ranking). Seu resultado foi guardado neste aparelho.':'Não foi possível registrar agora: '+esc(e?.message||'erro')}
}

window.IASDSolo=Object.assign(API,{games:GAMES,dailyDone:g=>{try{return window.IASDGameEngine?dailyDone(g):JSON.parse(localStorage.getItem('iasd-daily-'+new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})+'-'+g)||'null')}catch(e){return null}},lib});
})();
