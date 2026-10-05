/* Constelações · jogo de cartas e tabuleiro ONLINE (1×1, 2×2, 3×3) — cada jogador no seu celular.
   Mesma ideia do Jogo Coletivo: sala por código de 6 dígitos + QR, RPC no Supabase (servidor é o dono do estado),
   canal Realtime só como "atalho" (um aviso de versão) e consulta periódica como garantia. Mãos e baralho
   nunca saem do servidor para quem não é o dono. */
(function(){
'use strict';
const E=window.ConstellationEngine;
const URLB=window.__SEQ_API||'https://gtsaaixuampeaivugxdm.supabase.co',KEYB='sb_publishable_0nIK7568ulLb9JN0ctyiug_wHWDV7Qf';
const K_ID='iasd-seq-id',K_NAME='iasd-seq-name',K_MUTE='iasd-seq-mute';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uuid=()=>(crypto&&crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)}));
const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}},del(k){try{localStorage.removeItem(k)}catch{}}};
const ERR={
  room_not_found:'Sala não encontrada. Confira o código.',room_full:'Esta sala já está cheia.',room_started:'A partida já começou. Peça ao anfitrião uma nova sala.',
  invalid_room_code:'O código tem 6 números.',invalid_player_name:'Digite seu nome.',host_only:'Só o anfitrião pode fazer isso.',
  need_players:'Faltam jogadores para este modo.',teams_unbalanced:'As equipes precisam ter o mesmo número de jogadores.',
  not_your_turn:'Ainda não é a sua vez.',time_over:'O tempo da jogada acabou.',invalid_cell:'Essa posição não é válida.',invalid_card:'Carta inválida.',
  team_full:'Essa equipe já está completa.',too_many_players:'Há jogadores demais para esse modo.',already_swapped:'Você já trocou uma carta neste turno.',
  card_not_dead:'Só dá para trocar carta sem posição livre.',must_play:'Você ainda tem jogadas possíveis.',too_many_rooms:'Muitas salas abertas. Tente de novo em instantes.',
  timeout:'A conexão está lenta. Tentando de novo…',network:'Sem conexão com o servidor.',already_started:'A partida já começou.'
};
const msgOf=e=>ERR[e&&e.code]||ERR[e&&e.message]||'Algo deu errado. Tente novamente.';

/* ---------- rede ---------- */
async function rpc(name,body){
  const ac=new AbortController(),to=setTimeout(()=>ac.abort(),9000);
  try{
    const r=await fetch(URLB+'/rest/v1/rpc/'+name,{method:'POST',signal:ac.signal,headers:{apikey:KEYB,Authorization:'Bearer '+KEYB,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch{}
    if(!r.ok){const e=new Error((j&&j.message)||('http_'+r.status));e.code=e.message;e.status=r.status;throw e}
    return j;
  }catch(e){
    if(e&&e.name==='AbortError'){const x=new Error('timeout');x.code='timeout';throw x}
    if(!e.code){e.code='network'}
    throw e;
  }finally{clearTimeout(to)}
}

/* ---------- estado ---------- */
let root=null,abort=null,S=null,pollT=null,tickT=null,ch=null,rt={on:false},audio=null,nodes=[],toastT=null,introT=null,winT=null;
const fresh=()=>({room:null,player:null,token:null,code:null,name:'',spectator:false,view:null,v:0,off:0,rtt:1e9,busy:false,sel:{card:null,cell:null,focus:0},
  net:{fail:0},tmo:{},game:-1,introUntil:0,resultFor:-1,lobbySel:null,screen:null,zoom:null,syncing:false,syncAgain:false});
const pubOf=()=>S&&S.view&&S.view.pub;
const meOf=()=>S&&S.view&&S.view.me;
const isMyTurn=()=>{const p=pubOf();return !!(p&&!S.spectator&&p.status==='playing'&&p.turnPlayer===S.player)};
const serverNow=()=>Date.now()+S.off;
const myName=()=>{const p=pubOf(),m=meOf();return (p&&m&&(p.players.find(x=>x.id===m.id)||{}).name)||S.name};

/* ---------- som (sintetizado; falhar nunca afeta a partida) ---------- */
const muted=()=>store.get(K_MUTE)==='1';
function sound(kind){
  if(muted())return;
  try{
    audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});
    nodes.forEach(n=>{try{n.stop()}catch{}});nodes=[];
    const mel={select:[620],card:[480,560],place:[300,520],remove:[520,260],turn:[520,780],invalid:[170,130],line:[520,660,880,1040],win:[520,660,780,1040,1320],lose:[440,330,220],draw:[420,360],tick:[900],start:[392,523,659]}[kind]||[460];
    mel.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.085;o.type=kind==='invalid'||kind==='lose'?'triangle':'sine';o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.13);
      o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.15);nodes.push(o);o.onended=()=>{try{o.disconnect();g.disconnect()}catch{}nodes=nodes.filter(n=>n!==o)}});
  }catch{/* sem áudio: segue o jogo */}
}
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch{}};

/* ---------- desenho das cartas ---------- */
const SPRITE='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+
 '<symbol id="cs-s0" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5 6 20.9l1.3-6.7-5-4.7 6.8-.8z"/></symbol>'+
 '<symbol id="cs-s1" viewBox="0 0 24 24"><path d="M12 2.5c3.2 4.2 6 7.3 6 11a6 6 0 11-12 0c0-3.7 2.8-6.8 6-11z"/></symbol>'+
 '<symbol id="cs-s2" viewBox="0 0 24 24"><path d="M20.5 3C9.5 3 4 8.800 4 15c0 2 .6 3.600 1.600 4.800C7 14 11 10.500 16 9c-4 3-6.500 6.600-7.800 11.200.8.3 1.700.5 2.600.5C17.500 20.700 21.500 14 20.500 3z"/></symbol>'+
 '<symbol id="cs-s3" viewBox="0 0 24 24"><path d="M3 18L2 7l5.500 4L12 4l4.500 7L22 7l-1 11zM4 20h16v2H4z"/></symbol>'+
 '</defs></svg>';
const pip=s=>'<svg class="cs-pip s'+s+'" viewBox="0 0 24 24" aria-hidden="true"><use href="#cs-s'+s+'"/></svg>';
function face(c){
  const i=E.info(c);
  if(i.kind==='wild')return '<span class="cs-face wild"><b class="cs-wmark">✦</b><em>Coringa</em></span>';
  if(i.kind==='remove')return '<span class="cs-face remove"><b class="cs-wmark">✕</b><em>Remover</em></span>';
  return '<span class="cs-face s'+i.suit+'"><span class="cs-cn"><b>'+E.RANKS[i.rank]+'</b>'+pip(i.suit)+'</span>'+pip(i.suit).replace('cs-pip','cs-pip cs-big')+'<span class="cs-cn br"><b>'+E.RANKS[i.rank]+'</b>'+pip(i.suit)+'</span></span>';
}
const cardLabel=c=>E.info(c).label;

/* ---------- raiz ---------- */
function toast(t,ms=2600){const el=root&&root.querySelector('.cs-toast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),ms)}
function setNet(ok){if(!root)return;root.classList.toggle('offline',!ok)}

function mount(){
  root=document.createElement('div');root.id='cs-root';root.className='cs-root';root.setAttribute('role','dialog');root.setAttribute('aria-label','Constelações');
  root.innerHTML=SPRITE+'<header class="cs-bar"><button class="cs-ib" data-act="back" aria-label="Voltar">←</button><b class="cs-title">✦ Constelações</b><span class="cs-netdot" title="Conexão"></span><button class="cs-ib" data-act="snd" aria-label="Som">'+(muted()?'🔇':'🔊')+'</button></header><main class="cs-screen"></main><div class="cs-toast" role="status" aria-live="polite"></div><div class="cs-ov" hidden></div>';
  document.body.append(root);document.documentElement.classList.add('cs-open');
  abort=new AbortController();const o={signal:abort.signal};
  root.addEventListener('click',onClick,o);
  root.addEventListener('keydown',onKey,o);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S&&S.room){sync('visible');schedule()}},o);
  window.addEventListener('online',()=>{if(S&&S.room)sync('online')},o);
  window.addEventListener('pageshow',()=>{if(S&&S.room)sync('pageshow')},o);
  window.addEventListener('focus',()=>{if(S&&S.room)sync('focus')},o);
}
function closeAll(){
  clearTimeout(pollT);pollT=null;clearInterval(tickT);tickT=null;clearTimeout(toastT);clearTimeout(introT);clearTimeout(winT);
  rtClose();abort&&abort.abort();abort=null;
  try{root&&root.getAnimations&&root.getAnimations({subtree:true}).forEach(a=>a.cancel())}catch{}
  nodes.forEach(n=>{try{n.stop()}catch{}});nodes=[];if(audio){audio.close().catch(()=>{});audio=null}
  root&&root.remove();root=null;S=null;document.documentElement.classList.remove('cs-open');
}
const screenEl=()=>root&&root.querySelector('.cs-screen');
function setScreen(name,html){
  if(!root)return;const el=screenEl();root.dataset.screen=name;
  if(S.screen!==name){S.screen=name;el.innerHTML=html;el.scrollTop=0}
  return el;
}

/* ---------- entrada: menu / entrar ---------- */
const savedId=()=>{try{const o=JSON.parse(store.get(K_ID)||'null');return o&&o.room&&o.player&&o.token&&o.code?o:null}catch{return null}};
function showMenu(prefill){
  S.screen=null;S.room=null;S.view=null;S.v=0;S.spectator=false;
  const sv=savedId();const name=store.get(K_NAME)||'';
  const el=setScreen('menu','<div class="cs-menu"><div class="cs-hero"><div class="cs-orb">✦</div><h1>Constelações</h1><p>Jogo de cartas e tabuleiro. Cada pessoa joga no seu celular, em equipes, e vence quem formar duas sequências de cinco fichas.</p></div>'+
   (sv?'<button class="cs-resume" data-act="resume"><span>↻</span><div><b>Voltar à partida</b><small>Sala '+esc(sv.code)+(sv.name?' · '+esc(sv.name):'')+'</small></div></button>':'')+
   '<label class="cs-fld"><span>Seu nome</span><input id="cs-name" maxlength="24" autocomplete="nickname" placeholder="Como você quer aparecer" value="'+esc(name)+'"></label>'+
   '<div class="cs-two"><section class="cs-box"><h3>Criar partida</h3><div class="cs-chips" id="cs-modes">'+Object.keys(E.MODES).map((m,i)=>'<button class="cs-chip'+(i===0?' on':'')+'" data-act="mode" data-m="'+m+'">'+E.MODES[m].label+'</button>').join('')+'</div><small class="cs-hint">Você será o anfitrião. Depois é só mostrar o código ou o QR.</small><button class="cs-btn gold" data-act="create">Criar partida</button></section>'+
   '<section class="cs-box"><h3>Entrar em partida</h3><input id="cs-code" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="Código de 6 números" value="'+esc(prefill||'')+'"><small class="cs-hint">Peça o código (ou o QR) para quem criou a partida.</small><button class="cs-btn" data-act="join">Entrar</button></section></div>'+
   '<details class="cs-rules"><summary>Como jogar</summary><ul><li>O tabuleiro é feito de cartas. Cada carta aparece em <b>duas</b> posições.</li><li>Na sua vez, escolha uma carta da mão e uma posição destacada: sua equipe coloca uma ficha ali.</li><li>Forme <b>5 fichas seguidas</b> (linha, coluna ou diagonal). Duas sequências vencem.</li><li>Ocupar casas também <b>bloqueia</b> o adversário.</li><li><b>Coringa</b> vale em qualquer casa livre. <b>Remover</b> tira uma ficha adversária (menos as de sequência pronta).</li><li>Sem posição livre para uma carta? Troque-a uma vez por turno.</li></ul></details></div>');
  const nm=el.querySelector('#cs-name');if(nm&&!nm.value&&!prefill){try{const p=window.cloudProfile||window.myProfile;if(p&&p.full_name)nm.value=String(p.full_name).split(' ')[0]}catch{}}
  S.createMode='1v1';
}
function readName(){const el=root.querySelector('#cs-name');const n=(el&&el.value||'').trim().slice(0,24);if(!n){toast('Digite seu nome para continuar.');el&&el.focus();return null}store.set(K_NAME,n);return n}
async function createRoom(){
  const name=readName();if(!name||S.busy)return;S.busy=true;paintBusy();
  try{const v=await rpc('seq_create_room',{p_mode:S.createMode||'1v1',p_name:name,p_token:uuid()});enter(v,name)}
  catch(e){toast(msgOf(e))}finally{if(S){S.busy=false;paintBusy()}}
}
async function joinRoom(code,nameArg){
  const name=nameArg||readName();code=String(code||root.querySelector('#cs-code')?.value||'').replace(/\D/g,'');
  if(!name||S.busy)return;if(code.length!==6){toast('O código tem 6 números.');return}
  S.busy=true;paintBusy();
  try{const sv=savedId();const v=await rpc('seq_join_room',{p_code:code,p_name:name,p_token:sv&&sv.code===code?sv.token:uuid()});enter(v,name)}
  catch(e){toast(msgOf(e))}finally{if(S){S.busy=false;paintBusy()}}
}
function enter(v,name){
  S.room=v.room;S.player=v.player;S.token=v.token;S.code=v.pub.code;S.name=name||S.name;S.spectator=false;S.v=0;S.view=null;S.screen=null;
  store.set(K_ID,JSON.stringify({room:S.room,player:S.player,token:S.token,code:S.code,name:S.name}));
  rtOpen();applyView(v,'enter');schedule();
}
async function resume(){
  const sv=savedId();if(!sv){showMenu();return}
  S.room=sv.room;S.player=sv.player;S.token=sv.token;S.code=sv.code;S.name=sv.name||'';S.spectator=false;
  setScreen('wait','<div class="cs-wait"><div class="cs-spin"></div><p>Reconectando à partida…</p></div>');
  try{const v=await rpc('seq_state',{p_room:sv.room,p_player:sv.player,p_token:sv.token});rtOpen();applyView(v,'resume');schedule()}
  catch(e){
    if(e.code==='room_not_found'||e.code==='player_not_authorized'){store.del(K_ID);S.room=null;showMenu();toast('Essa partida já terminou.')}
    else{toast(msgOf(e));showMenu()}
  }
}
async function watch(code){
  S.spectator=true;S.code=code;
  setScreen('wait','<div class="cs-wait"><div class="cs-spin"></div><p>Conectando ao telão…</p></div>');
  try{const v=await rpc('seq_watch',{p_code:code});S.room=v.room;rtOpen();applyView(v,'watch');schedule()}
  catch(e){setScreen('wait','<div class="cs-wait"><p>'+esc(msgOf(e))+'</p><button class="cs-btn" data-act="back">Fechar</button></div>')}
}

/* ---------- realtime (só atalho: o servidor continua sendo a fonte) ---------- */
function rtOpen(){
  if(ch||!S||!S.code)return;const cl=window.iasdCloud;if(!cl||!cl.channel)return;
  try{
    const mine=ch=cl.channel('iasd-seq-'+S.code,{config:{broadcast:{self:false,ack:false}}});
    mine.on('broadcast',{event:'m'},ev=>{if(ch!==mine||!S)return;const m=(ev&&ev.payload)||{};if(m.t==='v'&&Number(m.v)>S.v)sync('rt')});
    mine.subscribe(st=>{if(ch!==mine)return;rt.on=st==='SUBSCRIBED';if(rt.on)sync('rt-open')});
  }catch{ch=null;rt.on=false}
}
function rtPing(){try{if(ch&&rt.on)ch.send({type:'broadcast',event:'m',payload:{t:'v',v:S.v}})}catch{}}
function rtClose(){try{if(ch&&window.iasdCloud&&window.iasdCloud.removeChannel)window.iasdCloud.removeChannel(ch)}catch{}ch=null;rt.on=false}

/* ---------- sincronização ---------- */
async function sync(why){
  if(!S||!S.room||!root)return;
  if(S.syncing){S.syncAgain=true;return}
  S.syncing=true;const t0=Date.now(),me=S;
  try{
    const v=S.spectator?await rpc('seq_watch',{p_code:S.code}):await rpc('seq_state',{p_room:S.room,p_player:S.player,p_token:S.token});
    if(S!==me||!root)return;
    const t1=Date.now(),rtt=t1-t0;if(rtt<S.rtt+400){S.rtt=Math.min(S.rtt,rtt);S.off=v.pub.now-(t0+t1)/2}
    S.net.fail=0;setNet(true);applyView(v,why);
  }catch(e){
    if(S!==me||!root)return;
    if(e.code==='room_not_found'||e.code==='player_not_authorized'){store.del(K_ID);toast(S.spectator?'A sala foi encerrada.':'Essa partida foi encerrada.');const sp=S.spectator;const r=S;S=fresh();void r;sp?closeAll():showMenu()}
    else{S.net.fail++;setNet(false)}
  }finally{if(S===me){S.syncing=false;if(S.syncAgain){S.syncAgain=false;setTimeout(()=>sync('again'),40)}}}
}
function schedule(){
  clearTimeout(pollT);pollT=null;if(!root||!S||!S.room)return;
  const p=pubOf();let ms=document.hidden?15000:(p&&p.status==='playing'?(isMyTurn()?5000:3200):2400);
  if(rt.on)ms*=2;if(S.net.fail)ms=Math.min(15000,2000*Math.pow(1.6,S.net.fail));ms*=.85+Math.random()*.3;
  const me=S;pollT=setTimeout(async()=>{pollT=null;if(S!==me)return;await sync('poll');if(S===me)schedule()},ms);
}

/* ---------- aplicar estado (nunca andar para trás) ---------- */
function applyView(v,why){
  if(!S||!root||!v||!v.pub)return;
  if(S.view&&v.pub.v<S.v)return;                     // resposta/mensagem velha
  const prev=S.view;
  const same=prev&&v.pub.v===S.v&&JSON.stringify(v.me&&v.me.hand)===JSON.stringify(prev.me&&prev.me.hand)&&v.pub.players.length===prev.pub.players.length;
  S.view=v;S.v=v.pub.v;
  if(same){paintLive();return}
  render(prev,why);schedule();
}
function render(prev,why){
  const pub=S.view.pub;
  if(pub.status==='lobby'){S.resultFor=-1;paintLobby();stopTick();return}
  const entering=S.screen!=='table'||S.game!==pub.games;
  if(entering){S.game=pub.games;S.screen=null;S.sel={card:null,cell:null,focus:0};buildTable()}
  paintTable(entering?null:prev,why);
  startTick();
}
function paintLive(){if(S.screen==='table'){paintStatus();paintPlayers()}else if(S.screen==='lobby')paintLobby()}

/* ---------- lobby ---------- */
function teamCol(pub,t,me){
  const cap=E.MODES[pub.mode].size/2,ps=pub.players.filter(p=>p.team===t);
  const rows=ps.map(p=>'<li class="cs-pl'+(S.lobbySel===p.id?' sel':'')+(p.on?'':' off')+'" data-act="plsel" data-id="'+p.id+'"><i class="cs-av t'+t+'">'+esc(E.initials(p.name))+'</i><span>'+esc(p.name)+(p.id===pub.host?' <em title="Anfitrião">★</em>':'')+(p.id===(me&&me.id)?' <small>(você)</small>':'')+'</span>'+(me&&me.host&&p.id!==pub.host?'<button class="cs-x" data-act="kick" data-id="'+p.id+'" aria-label="Remover '+esc(p.name)+'">✕</button>':'')+'</li>').join('');
  const empt=Array.from({length:cap-ps.length},()=>'<li class="cs-pl empty'+(S.lobbySel&&me&&me.host?' drop':'')+'" data-act="slot" data-t="'+t+'"><i class="cs-av">+</i><span>Aguardando…</span></li>').join('');
  return '<section class="cs-team t'+t+'"><h4><i class="cs-dot t'+t+'"></i>Equipe '+E.TEAMS[t].name+'</h4><ul>'+rows+empt+'</ul></section>';
}
function paintLobby(){
  const pub=pubOf(),me=meOf();if(!pub)return;
  const link=location.origin+'/jogos?seq='+pub.code,qr='https://api.qrserver.com/v1/create-qr-code/?size=520x520&margin=0&data='+encodeURIComponent(link);
  const host=!!(me&&me.host),need=E.MODES[pub.mode].size,full=pub.players.length>=need,bal=pub.players.filter(p=>p.team===0).length===need/2&&pub.players.filter(p=>p.team===1).length===need/2;
  const tv=S.spectator;
  const html='<div class="cs-lobby'+(tv?' tv':'')+'"><section class="cs-codebox"><span class="cs-lab">CÓDIGO DA SALA</span><b class="cs-code" id="cs-codeTxt">'+esc(pub.code)+'</b><div class="cs-qrw"><img class="cs-qr" alt="QR Code para entrar na partida" src="'+qr+'" width="520" height="520"></div>'+
   '<small>Abra o IASD APP → Jogos → Constelações → Entrar, ou escaneie o QR.</small>'+(tv?'':'<div class="cs-row"><button class="cs-btn ghost" data-act="copy">Copiar link</button><button class="cs-btn ghost" data-act="telao">Abrir telão</button></div>')+'</section>'+
   '<section class="cs-room"><div class="cs-modeline"><span class="cs-lab">MODO</span>'+(host&&!tv?Object.keys(E.MODES).map(m=>'<button class="cs-chip'+(pub.mode===m?' on':'')+'" data-act="setmode" data-m="'+m+'">'+E.MODES[m].label+'</button>').join(''):'<b>'+E.MODES[pub.mode].label+'</b>')+'</div>'+
   '<div class="cs-modeline"><span class="cs-lab">TEMPO POR JOGADA</span>'+(host&&!tv?[0,30,45,60].map(s=>'<button class="cs-chip'+(pub.secs===s?' on':'')+'" data-act="settimer" data-s="'+s+'">'+(s?s+' s':'Sem tempo')+'</button>').join(''):'<b>'+(pub.secs?pub.secs+' s':'Sem tempo')+'</b>')+'</div>'+
   '<div class="cs-teams">'+teamCol(pub,0,me)+teamCol(pub,1,me)+'</div>'+
   (host&&!tv?'<small class="cs-hint">Toque em um jogador e depois em uma vaga (ou em outro jogador) para trocar de equipe.</small>':'')+
   (tv?'<p class="cs-wait-msg">Aguardando o anfitrião iniciar…</p>':host?'<button class="cs-btn gold big" data-act="start"'+(full&&bal?'':' disabled')+'>'+(full&&bal?'Iniciar partida':(full?'Equilibre as equipes':'Aguardando jogadores ('+pub.players.length+'/'+need+')'))+'</button>':'<p class="cs-wait-msg">Aguardando o anfitrião iniciar…</p>')+
   (tv?'':'<button class="cs-btn ghost" data-act="leave">Sair da sala</button>')+'</section></div>';
  S.screen=null;setScreen('lobby',html);
}

/* ---------- mesa ---------- */
function buildTable(){
  const pub=pubOf(),tv=S.spectator;
  const fit=S.zoom==null?'fit':S.zoom;S.zoom=fit;
  const html='<div class="cs-table'+(tv?' tv':'')+'" data-zoom="'+fit+'"><div class="cs-hud"><div class="cs-score" id="cs-score"></div><div class="cs-turn" id="cs-turn"></div></div><div class="cs-prow"><div class="cs-players" id="cs-players"></div><div class="cs-zoom"><button data-act="zoom" data-z="fit" aria-label="Ver o tabuleiro todo">⤢</button><button data-act="zoom" data-z="normal" aria-label="Tamanho normal">▫</button><button data-act="zoom" data-z="big" aria-label="Ampliar">＋</button></div></div>'+
   '<div class="cs-boardwrap"><div class="cs-viewport" id="cs-vp"><div class="cs-grid" id="cs-grid">'+pub.board.map(([c],i)=>'<button type="button" class="cs-cell" data-act="cell" data-i="'+i+'" aria-label="'+esc(cardLabel(c))+'">'+face(c)+'<span class="cs-slot"></span></button>').join('')+'</div></div>'+
   '<div class="cs-banner" id="cs-banner" aria-live="polite"></div></div>'+
   (tv?'':'<div class="cs-actions" id="cs-actions"></div><div class="cs-handwrap"><div class="cs-hand" id="cs-hand"></div></div>')+'</div>';
  setScreen('table',html);S.screen='table';
}
function paintStatus(){
  const pub=pubOf();if(!pub||S.screen!=='table')return;
  const tot=E.TARGET,sc=[0,1].map(t=>{const n=E.count(pub,t);return '<div class="cs-sc t'+t+(pub.winner===t?' win':'')+'"><i class="cs-dot t'+t+'"></i><b>'+E.TEAMS[t].name+'</b><span class="cs-pips">'+Array.from({length:tot},(_,k)=>'<i class="'+(k<n?'on':'')+'"></i>').join('')+'</span><small>'+n+'/'+tot+' sequências</small></div>'}).join('');
  const sce=root.querySelector('#cs-score');if(sce&&sce.dataset.k!==sc){sce.innerHTML=sc;sce.dataset.k=sc}
  const cur=pub.status==='playing'?pub.players.find(p=>p.id===pub.turnPlayer):null;
  const te=root.querySelector('#cs-turn');
  if(te){
    const mine=isMyTurn();
    const html=pub.status==='finished'?'<span class="cs-tl">Fim de jogo</span>':cur?'<i class="cs-av t'+cur.team+'">'+esc(E.initials(cur.name))+'</i><div><small>'+(mine?'SUA VEZ':'VEZ DE')+'</small><b>'+esc(cur.name)+'</b></div><div class="cs-ring" id="cs-ring"><span id="cs-left"></span></div>':'';
    const k=html+'|'+mine;if(te.dataset.k!==k){te.innerHTML=html;te.dataset.k=k;te.classList.toggle('mine',mine);te.className='cs-turn'+(mine?' mine':'')+(cur?' t'+cur.team:'')}
  }
}
function paintPlayers(){
  const pub=pubOf();if(!pub||S.screen!=='table')return;const el=root.querySelector('#cs-players');if(!el)return;
  const html=E.order(pub).map(p=>'<div class="cs-pp t'+p.team+(p.id===pub.turnPlayer&&pub.status==='playing'?' now':'')+(p.on?'':' off')+'" title="'+esc(p.name)+(p.on?'':' (sem conexão)')+'"><i class="cs-av t'+p.team+'">'+esc(E.initials(p.name))+'</i><span>'+esc(p.name)+'</span></div>').join('');
  if(el.dataset.k!==html){el.innerHTML=html;el.dataset.k=html}
}
function lineCells(pub){const s=new Map();(pub.lines||[]).forEach(l=>l.c.forEach(c=>s.set(c,l.t)));return s}
function paintBoard(prev){
  const pub=pubOf(),grid=root.querySelector('#cs-grid');if(!grid)return;
  const cells=grid.children,lk=lineCells(pub),last=pub.last,adv=prev&&prev.pub.v<pub.v&&pub.v-prev.pub.v<=2;
  for(let i=0;i<64;i++){
    const cell=cells[i],own=pub.board[i][1],slot=cell.lastElementChild,had=slot.firstElementChild?+slot.firstElementChild.dataset.t:-1;
    if(own!==had){
      slot.innerHTML=own===-1?'':'<i class="cs-chip t'+own+'" data-t="'+own+'"></i>';
      if(adv&&last){
        if(own!==-1&&last.k==='place'&&last.cell===i)slot.firstElementChild.classList.add('drop');
        if(own===-1&&last.k==='remove'&&last.cell===i){cell.classList.add('poof');setTimeout(()=>cell.classList.remove('poof'),700)}
      }
    }
    cell.dataset.own=own;cell.classList.toggle('lk',lk.has(i));if(lk.has(i))cell.dataset.lt=lk.get(i);else delete cell.dataset.lt;
    cell.classList.toggle('lastmove',!!(last&&last.cell===i&&(last.k==='place'||last.k==='remove')));
  }
  if(adv&&last&&last.lines&&last.lines.length){
    const set=new Set(last.lines.flatMap(l=>l.c));set.forEach(i=>cells[i].classList.add('seqwin'));
    clearTimeout(winT);winT=setTimeout(()=>{if(root)root.querySelectorAll('.seqwin').forEach(c=>c.classList.remove('seqwin'))},2600);
    banner('SEQUÊNCIA! '+E.TEAMS[last.lines[0].t].name,'seq t'+last.lines[0].t);sound('line');buzz([30,40,60]);
  }else if(adv&&last&&last.k==='remove'){sound('remove')}
  else if(adv&&last&&last.k==='place'){if(last.p!==S.player)sound('place')}
}
function banner(t,cls){const b=root&&root.querySelector('#cs-banner');if(!b)return;b.className='cs-banner on '+(cls||'');b.textContent=t;b.style.animation='none';void b.offsetWidth;b.style.animation='';setTimeout(()=>{if(b)b.classList.remove('on')},2200)}
function paintSel(){
  const pub=pubOf(),me=meOf();if(!pub||S.spectator||S.screen!=='table')return;
  const grid=root.querySelector('#cs-grid');if(!grid)return;
  const mine=isMyTurn()&&pub.status==='playing',card=S.sel.card!==null?me.hand[S.sel.card]:null;
  const valid=mine&&card!==null&&card!==undefined?E.validCells(pub,card,me.team):[];
  const vs=new Set(valid);
  for(let i=0;i<64;i++){const c=grid.children[i];c.classList.toggle('valid',vs.has(i));c.classList.toggle('vrm',vs.has(i)&&card===E.REMOVE);c.classList.toggle('dim',card!==null&&card!==undefined&&mine&&!vs.has(i));c.classList.toggle('pending',S.sel.cell===i)}
  S.valid=valid;
}
function paintHand(){
  const pub=pubOf(),me=meOf(),el=root.querySelector('#cs-hand');if(!el||!me)return;
  const mine=isMyTurn()&&pub.status==='playing';
  el.innerHTML=me.hand.map((c,i)=>{const ok=mine&&E.validCells(pub,c,me.team).length>0;const k=E.info(c).kind;
    return '<button type="button" class="cs-hc '+k+(S.sel.card===i?' sel':'')+(mine?(ok?' ok':' dead'):'')+'" data-act="card" data-i="'+i+'" aria-label="'+esc(cardLabel(c))+(S.sel.card===i?' (selecionada)':'')+'" aria-pressed="'+(S.sel.card===i)+'">'+face(c)+'</button>'}).join('');
  el.dataset.n=me.hand.length;
}
function paintActions(){
  const pub=pubOf(),me=meOf(),el=root.querySelector('#cs-actions');if(!el||!me)return;
  const mine=isMyTurn()&&pub.status==='playing';let h='';
  if(pub.status==='finished')h='<p class="cs-ahint">Partida encerrada.</p>';
  else if(!mine){const cur=pub.players.find(p=>p.id===pub.turnPlayer);h='<p class="cs-ahint wait">Vez de <b>'+esc(cur?cur.name:'…')+'</b>. Observe o tabuleiro e planeje.</p>'}
  else{
    const card=S.sel.card!==null?me.hand[S.sel.card]:null,v=S.valid||[],anyPlay=E.canPlay(pub,me.hand,me.team);
    if(card===null||card===undefined){
      h=anyPlay?'<p class="cs-ahint go">Sua vez! Escolha uma carta da sua mão.</p>':'<p class="cs-ahint">Nenhuma carta tem posição livre.</p><div class="cs-arow">'+(pub.swapped?'':'<button class="cs-btn" data-act="swapany">Trocar uma carta</button>')+'<button class="cs-btn ghost" data-act="pass">Passar a vez</button></div>';
    }else if(!v.length){
      h='<p class="cs-ahint">Carta morta: <b>'+esc(cardLabel(card))+'</b> não tem posição livre.</p><div class="cs-arow">'+(pub.swapped?'<small>Você já trocou uma carta neste turno.</small>':'<button class="cs-btn gold" data-act="swap">Trocar esta carta</button>')+(anyPlay?'':'<button class="cs-btn ghost" data-act="pass">Passar a vez</button>')+'</div>';
    }else if(S.sel.cell===null){
      const what=card===E.REMOVE?'a ficha adversária a remover':card===E.WILD?'qualquer casa livre':v.length>1?'uma das '+v.length+' posições':'a posição';
      h='<p class="cs-ahint go">Toque em '+what+' destacada.</p>'+(v.length>1?'<div class="cs-arow"><button class="cs-btn ghost sm" data-act="focus" data-d="-1">◀</button><span class="cs-fcount">posição '+((S.sel.focus%v.length)+1)+' de '+v.length+'</span><button class="cs-btn ghost sm" data-act="focus" data-d="1">▶</button></div>':'');
    }else{
      h='<div class="cs-arow"><button class="cs-btn gold big" data-act="confirm"'+(S.busy?' disabled':'')+'>✓ '+(card===E.REMOVE?'Remover aqui':'Jogar aqui')+'</button><button class="cs-btn ghost" data-act="cancel">Cancelar</button></div>';
    }
  }
  if(el.dataset.k!==h){el.innerHTML=h;el.dataset.k=h}
}
function paintBusy(){if(!root)return;root.classList.toggle('busy',!!(S&&S.busy));const b=root.querySelector('[data-act=confirm]');if(b)b.disabled=!!(S&&S.busy);root.querySelectorAll('.cs-btn[data-act=create],.cs-btn[data-act=join]').forEach(x=>x.disabled=!!(S&&S.busy))}
function paintTable(prev,why){
  const pub=pubOf(),me=meOf();
  // sorteio / início
  if(prev&&prev.pub.status!=='playing'&&pub.status==='playing'&&S.introFor!==pub.games){S.introFor=pub.games;intro()}
  else if(!prev&&pub.status==='playing'&&S.introFor===undefined)S.introFor=pub.games;
  const wasMine=prev&&prev.pub.status==='playing'&&prev.pub.turnPlayer===S.player,nowMine=isMyTurn();
  if(S.sel.card!==null&&me&&(!prev||JSON.stringify(prev.me&&prev.me.hand)!==JSON.stringify(me.hand)||!nowMine)){S.sel={card:null,cell:null,focus:0}}
  if(S.sel.cell!==null&&!nowMine)S.sel.cell=null;
  paintStatus();paintPlayers();paintBoard(prev);
  if(!S.spectator){paintHand();paintSel();paintActions()}
  if(nowMine&&!wasMine&&prev){sound('turn');buzz(40);toast('Sua vez!',1800)}
  if(pub.status==='finished'&&S.resultFor!==pub.games){S.resultFor=pub.games;showResult()}
  if(pub.status==='playing'){const ov=root.querySelector('.cs-ov');if(ov&&ov.dataset.kind==='result'){ov.hidden=true;ov.innerHTML='';ov.dataset.kind=''}}
}
/* sorteio de quem começa: visual; a escolha oficial vem do servidor */
function intro(){
  const pub=pubOf(),ov=root.querySelector('.cs-ov');if(!ov)return;
  const names=E.order(pub).map(p=>p.name),win=(pub.players.find(p=>p.id===pub.turnPlayer)||{}).name||'';
  ov.hidden=false;ov.dataset.kind='intro';S.introUntil=Date.now()+1500;sound('start');
  ov.innerHTML='<div class="cs-intro"><small>SORTEANDO QUEM COMEÇA</small><b id="cs-roll">'+esc(names[0]||'')+'</b></div>';
  let i=0;const roll=ov.querySelector('#cs-roll');
  const step=()=>{if(!root||ov.dataset.kind!=='intro')return;i++;if(i<9){roll.textContent=names[i%names.length]||'';introT=setTimeout(step,70+i*14)}else{roll.textContent=win;ov.classList.add('done');ov.querySelector('small').textContent='COMEÇA';introT=setTimeout(()=>{if(ov.dataset.kind==='intro'){ov.hidden=true;ov.innerHTML='';ov.dataset.kind='';ov.classList.remove('done')}},650)}};
  step();
}
function showResult(){
  const pub=pubOf(),me=meOf(),ov=root.querySelector('.cs-ov');if(!ov)return;
  const w=pub.winner,draw=w===-1,mineWon=me&&w===me.team;
  const head=draw?'Empate':S.spectator?'Equipe '+E.TEAMS[w].name+' venceu':mineWon?'Vitória!':'Derrota';
  const sub=draw?'O tabuleiro ficou sem jogadas.':S.spectator?'':mineWon?'Sua equipe formou '+E.count(pub,w)+' sequências.':'A equipe '+E.TEAMS[w].name+' formou as sequências primeiro.';
  sound(draw?'draw':S.spectator||mineWon?'win':'lose');if(mineWon)buzz([40,60,40,60,120]);
  ov.hidden=false;ov.dataset.kind='result';
  const conf=!draw&&(S.spectator||mineWon)?Array.from({length:26},(_,i)=>'<i style="--x:'+Math.round(Math.random()*100)+'%;--d:'+(Math.random()*1.4).toFixed(2)+'s;--c:'+['#f5b73a','#3b82f6','#fff','#edc778'][i%4]+'"></i>').join(''):'';
  ov.innerHTML='<div class="cs-result '+(draw?'draw':'t'+w)+'"><div class="cs-confetti" aria-hidden="true">'+conf+'</div><div class="cs-trophy">'+(draw?'🤝':'🏆')+'</div><h2>'+esc(head)+'</h2><p>'+esc(sub)+'</p>'+
   '<div class="cs-final">'+[0,1].map(t=>'<div class="'+(w===t?'win':'')+'"><i class="cs-dot t'+t+'"></i><b>'+E.TEAMS[t].name+'</b><span>'+E.count(pub,t)+'</span></div>').join('')+'</div>'+
   (S.spectator?'<p class="cs-wait-msg">Aguardando nova partida…</p>':'<div class="cs-arow"><button class="cs-btn gold big" data-act="again">Jogar de novo</button><button class="cs-btn ghost" data-act="leave">Sair</button></div>')+'</div>';
}

/* ---------- relógio da jogada ---------- */
function startTick(){if(tickT)return;tickT=setInterval(tick,250)}
function stopTick(){clearInterval(tickT);tickT=null}
function tick(){
  const pub=pubOf();if(!root||!S||!pub||pub.status!=='playing'){return}
  const ring=root.querySelector('#cs-ring'),lab=root.querySelector('#cs-left');
  if(!pub.deadline){if(lab)lab.textContent='∞';if(ring)ring.style.setProperty('--p','0');return}
  const left=pub.deadline-serverNow(),tot=pub.secs*1000;
  if(lab)lab.textContent=String(Math.max(0,Math.ceil(left/1000)));
  if(ring){ring.style.setProperty('--p',String(Math.max(0,Math.min(1,left/tot))));ring.classList.toggle('low',left<10000)}
  if(left<=0&&!S.spectator&&!S.tmo[pub.v]){
    const wait=isMyTurn()?200:2600+Math.random()*1800;
    if(-left>=wait){S.tmo[pub.v]=1;rpc('seq_move',{p_room:S.room,p_player:S.player,p_token:S.token,p_version:pub.v,p_move:uuid(),p_kind:'timeout',p_idx:null,p_cell:null}).then(v=>{applyView(v,'timeout');rtPing()}).catch(()=>sync('timeout'))}
  }
}

/* ---------- ações do jogador ---------- */
async function act(fn,okMsg){
  if(!S||S.busy)return false;S.busy=true;paintBusy();
  try{
    let v,tries=0;
    for(;;){try{v=await fn();break}catch(e){if((e.code==='timeout'||e.code==='network')&&tries++<2){await new Promise(r=>setTimeout(r,700*tries));continue}throw e}}
    if(!S)return false;applyView(v,'act');rtPing();if(okMsg)toast(okMsg);return true;
  }catch(e){
    if(!S)return false;
    if(e.code==='stale_version'||e.code==='not_your_turn'||e.code==='not_playing'){sync('conflict')}
    else{toast(msgOf(e));sound('invalid');if(e.code==='invalid_cell'||e.code==='time_over'||e.code==='card_not_dead')sync('err')}
    return false;
  }finally{if(S){S.busy=false;paintBusy();if(S.screen==='table'&&!S.spectator){paintActions()}}}
}
const canAct=()=>{const p=pubOf();return !!(p&&!S.spectator&&p.status==='playing'&&isMyTurn()&&!S.busy&&Date.now()>=S.introUntil)};
function pickCard(i){
  if(!canAct())return;const me=meOf();if(i<0||i>=me.hand.length)return;
  S.sel=S.sel.card===i?{card:null,cell:null,focus:0}:{card:i,cell:null,focus:0};
  sound(S.sel.card===null?'card':'select');paintHand();paintSel();paintActions();
  if(S.sel.card!==null&&S.valid&&S.valid.length)focusCell(S.valid[0]);
}
function pickCell(i){
  if(!canAct()||S.sel.card===null)return;
  if(!(S.valid||[]).includes(i)){if(S.valid&&S.valid.length)sound('invalid');return}
  if(S.sel.cell===i){confirmMove();return}
  S.sel.cell=i;sound('select');paintSel();paintActions();
}
function confirmMove(){
  if(!canAct()||S.sel.card===null||S.sel.cell===null)return;
  const pub=pubOf(),card=S.sel.card,cell=S.sel.cell,mv=uuid();
  act(()=>rpc('seq_move',{p_room:S.room,p_player:S.player,p_token:S.token,p_version:pub.v,p_move:mv,p_kind:'play',p_idx:card,p_cell:cell}));
}
function swapCard(i){
  if(!canAct())return;const pub=pubOf();const idx=i??S.sel.card;if(idx===null||idx===undefined)return;
  S.sel={card:null,cell:null,focus:0};
  act(()=>rpc('seq_move',{p_room:S.room,p_player:S.player,p_token:S.token,p_version:pub.v,p_move:uuid(),p_kind:'exchange',p_idx:idx,p_cell:null}),'Carta trocada.');
}
function swapAny(){const me=meOf(),pub=pubOf();const i=me.hand.findIndex(c=>E.validCells(pub,c,me.team).length===0);swapCard(i<0?0:i)}
function passTurn(){if(!canAct())return;const pub=pubOf();S.sel={card:null,cell:null,focus:0};act(()=>rpc('seq_move',{p_room:S.room,p_player:S.player,p_token:S.token,p_version:pub.v,p_move:uuid(),p_kind:'pass',p_idx:null,p_cell:null}),'Vez passada.')}
function focusCell(i,smooth=true){
  const vp=root&&root.querySelector('#cs-vp'),c=root&&root.querySelector('.cs-cell[data-i="'+i+'"]');if(!vp||!c)return;
  const left=c.offsetLeft+c.offsetWidth/2-vp.clientWidth/2,top=c.offsetTop+c.offsetHeight/2-vp.clientHeight/2;
  try{vp.scrollTo({left:Math.max(0,left),top:Math.max(0,top),behavior:smooth?'smooth':'auto'})}catch{vp.scrollLeft=left;vp.scrollTop=top}
}
function setZoom(z){S.zoom=z;const t=root.querySelector('.cs-table');if(t)t.dataset.zoom=z;const vp=root.querySelector('#cs-vp');if(vp&&z==='fit'){vp.scrollLeft=0;vp.scrollTop=0}if(S.valid&&S.valid.length)setTimeout(()=>focusCell(S.valid[S.sel.focus%S.valid.length],false),30)}

/* lobby */
async function lobbyCall(name,extra,okMsg){return act(()=>rpc(name,{p_room:S.room,p_player:S.player,p_token:S.token,...extra}),okMsg)}
function plsel(id){
  const me=meOf(),pub=pubOf();if(!me||!me.host)return;
  if(!S.lobbySel){S.lobbySel=id;paintLobby();return}
  if(S.lobbySel===id){S.lobbySel=null;paintLobby();return}
  const a=pub.players.find(p=>p.id===S.lobbySel),b=pub.players.find(p=>p.id===id);S.lobbySel=null;
  if(a&&b&&a.team!==b.team)lobbyCall('seq_swap_teams',{p_a:a.id,p_b:b.id});else paintLobby();
}
function slot(t){const me=meOf();if(!me||!me.host||!S.lobbySel)return;const id=S.lobbySel;S.lobbySel=null;lobbyCall('seq_assign',{p_target:id,p_team:t})}

/* ---------- cliques e teclado ---------- */
function onClick(ev){
  const b=ev.target.closest('[data-act]');if(!b||!S)return;const a=b.dataset.act;
  switch(a){
    case 'back':if(S.room&&!S.spectator&&pubOf()&&pubOf().status==='playing'){leave(false)}else if(S.room&&!S.spectator&&S.screen==='lobby'){leave(true)}else closeAll();break;
    case 'snd':{const m=!muted();store.set(K_MUTE,m?'1':'0');b.textContent=m?'🔇':'🔊';if(!m)sound('select');break}
    case 'mode':root.querySelectorAll('#cs-modes .cs-chip').forEach(x=>x.classList.toggle('on',x===b));S.createMode=b.dataset.m;sound('select');break;
    case 'create':createRoom();break;
    case 'join':joinRoom();break;
    case 'resume':resume();break;
    case 'copy':{const link=location.origin+'/jogos?seq='+S.code;(navigator.clipboard?navigator.clipboard.writeText(link):Promise.reject()).then(()=>toast('Link copiado!'),()=>toast(link));break}
    case 'telao':window.open(location.origin+'/jogos?seqtelao='+S.code,'_blank','noopener');break;
    case 'setmode':lobbyCall('seq_set_mode',{p_mode:b.dataset.m});break;
    case 'settimer':lobbyCall('seq_set_timer',{p_secs:+b.dataset.s});break;
    case 'plsel':plsel(b.dataset.id);break;
    case 'slot':slot(+b.dataset.t);break;
    case 'kick':ev.stopPropagation();lobbyCall('seq_remove',{p_target:b.dataset.id});break;
    case 'start':act(()=>rpc('seq_start',{p_room:S.room,p_player:S.player,p_token:S.token}));break;
    case 'again':act(()=>rpc('seq_start',{p_room:S.room,p_player:S.player,p_token:S.token}));break;
    case 'leave':leave(true);break;
    case 'card':pickCard(+b.dataset.i);break;
    case 'cell':pickCell(+b.dataset.i);break;
    case 'confirm':confirmMove();break;
    case 'cancel':S.sel.cell=null;paintSel();paintActions();break;
    case 'swap':swapCard();break;
    case 'swapany':swapAny();break;
    case 'pass':passTurn();break;
    case 'focus':{const v=S.valid||[];if(v.length){S.sel.focus=(S.sel.focus+ +b.dataset.d+v.length)%v.length;paintActions();focusCell(v[S.sel.focus])}break}
    case 'zoom':setZoom(b.dataset.z);break;
  }
}
function onKey(ev){
  if(!S)return;
  if(ev.key==='Escape'){if(S.sel&&S.sel.card!==null){S.sel={card:null,cell:null,focus:0};paintHand();paintSel();paintActions()}return}
  if(ev.target.tagName==='INPUT'){if(ev.key==='Enter'){const id=ev.target.id;if(id==='cs-code')joinRoom();else if(id==='cs-name')createRoom()}return}
  if(S.screen==='table'){
    if(/^[1-9]$/.test(ev.key))pickCard(+ev.key-1);
    else if(ev.key==='Enter')confirmMove();
  }
}
async function leave(really){
  if(!S)return;
  if(really&&S.room&&!S.spectator){
    const p=pubOf();
    if(p&&p.status==='lobby'){try{await rpc('seq_leave',{p_room:S.room,p_player:S.player,p_token:S.token})}catch{}store.del(K_ID);clearTimeout(pollT);rtClose();S=fresh();showMenu();return}
    // no meio da partida: "Sair" fecha a tela, mas o jogador pode voltar com o mesmo código
    closeAll();return;
  }
  closeAll();
}

/* ---------- abrir ---------- */
function open(opts){
  opts=opts||{};
  if(root){if(opts.telao&&S&&!S.spectator){closeAll()}else return}
  mount();S=fresh();
  const q=opts;
  if(q.telao){watch(String(q.telao).replace(/\D/g,'').slice(0,6));return}
  if(savedId()&&!q.code){showMenu();return}
  showMenu(q.code?String(q.code).replace(/\D/g,'').slice(0,6):'');
}
window.IASDConstellations=Object.assign(window.IASDConstellations||{},{open,close:closeAll,_v:2,get mounted(){return !!root},_state:()=>S,_rt:()=>({ch:!!ch,on:rt.on}),_timers:()=>({poll:!!pollT,tick:!!tickT})});
})();
