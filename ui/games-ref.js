/* IASD APP — página Jogos (layout de referência). Só desenha: toda ação chama o que já existe
   (IASDSolo.startDaily/open, IASDLive.home/setup/joinForm, IASDPages.dailyScope/resetRank).
   Se algo falhar, pages.js volta para a página de Jogos anterior. */
(function(){
'use strict';

const I={
  search:'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  arrow:'M5 12h14M13 6l6 6-6 6',
  join:'M3 6.500A2.500 2.500 0 015.500 4h13A2.500 2.500 0 0121 6.500v12a2.500 2.500 0 01-2.500 2.500h-13A2.500 2.500 0 013 18.500zM3 10h18M8 2.500V6M16 2.500V6',
  pad:'M6 12h4M8 10v4M15 13h.01M18 11h.01M6 5h12a4 4 0 014 4l1 7a3 3 0 01-5 2l-2-2H8l-2 2a3 3 0 01-5-2l1-7a4 4 0 014-4z',
  user:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3-6 8-6s8 2 8 6',
  users:'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 4.500a4 4 0 010 7M22 21c0-3-2-5-4-5.500',
  monitor:'M3 4h18v12H3zM8 20h8M12 16v4',
  trophy:'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',
  chart:'M4 20V10M10 20V4M16 20v-8M22 20H2',
  check:'M5 12l5 5 9-10',
  more:'M5 12h.01M12 12h.01M19 12h.01'
};
const svg=(n,s=20,sw=1.8)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${I[n]||I.chart}"/></svg>`;
const ART='/design/assets/jogos/';
/* cores e ilustrações por jogo (imagens recortadas da referência aprovada) */
const META={
  quiz:{c:'#f5a623',soft:'#fff3d6',line:'#f6dc9a',btn:'linear-gradient(180deg,#fbc54a,#f4a81f)',ink:'#4a2e00',icon:ART+'ic-quiz.png',cover:ART+'cover-quiz.jpg',coverAlt:'Bíblia aberta com placas de perguntas e iluminação dourada'},
  who:{c:'#7c5cf5',soft:'#efeaff',line:'#d8cdff',btn:'linear-gradient(180deg,#a893ff,#8d73f5)',ink:'#fff',icon:ART+'ic-who.png',cover:ART+'cover-who.jpg',coverAlt:'Figura misteriosa violeta cercada de cartas com pistas'},
  order:{c:'#2ea8e6',soft:'#e3f4ff',line:'#b7e1f8',btn:'linear-gradient(180deg,#58c2f5,#2aa4e6)',ink:'#fff',icon:ART+'ic-order.png',cover:ART+'cover-order.jpg',coverAlt:'Percurso em cenário histórico com construções e marcadores'},
  memory:{c:'#2fbf8d',soft:'#e1f8ee',line:'#b4ebd4',btn:'linear-gradient(180deg,#5ddcae,#2fbf8d)',ink:'#fff',icon:ART+'ic-memory.png',cover:ART+'cover-memory.jpg',coverAlt:'Pares de cartas ilustradas em cenário verde'}
};
const ORDER=['quiz','who','order','memory'];
let B=null;
const E=s=>B.esc(s);
const g=fn=>{try{return fn()}catch(e){return undefined}};

/* ---------- ações (usam os fluxos existentes) ---------- */
async function liveRun(next){
  try{
    if(!(window.IASDLive&&window.IASDLive.home)){
      await new Promise((ok,fail)=>{const s=document.createElement('script');s.src='/live-game.js?v=55&t='+Date.now();s.onload=ok;s.onerror=()=>fail(new Error('live'));document.head.appendChild(s)});
    }
    g(()=>window.IASDLive.sound.start());
    await window.IASDLive.home();
    const inRoom=g(()=>window.IASDLive._state().S.room);
    if(next&&!inRoom)window.IASDLive[next]();
  }catch(e){alert('Não foi possível carregar o Jogo Coletivo. Verifique a conexão e tente novamente.')}
}

function dailyCard(k){
  const m=META[k],G=B.GAMES.find(x=>x.m===k),d=B.drDone(k);
  const title=G?G.t:k;
  const state=d?`<small class="gmx-ok">${svg('check',14,2.4)}${Number(d.score).toLocaleString('pt-BR')} pontos hoje</small>`:`<small>Disponível agora</small>`;
  const blurb={quiz:'Teste seus conhecimentos sobre a Palavra de Deus.',who:'Descubra personagens bíblicos e suas histórias.',order:'Organize os acontecimentos bíblicos na ordem correta.',memory:'Encontre os pares: personagens, feitos, lugares e mais.'}[k];
  return `<article class="gmx-dc${d?' done':''}" style="--c:${m.c};--soft:${m.soft};--line:${m.line}"><img class="gmx-dc-i" src="${m.icon}" alt="" width="56" height="56"><div class="gmx-dc-t"><b>${E(title)}</b><span>${E(blurb)}</span>${state}</div>${d?`<button type="button" class="gmx-play" disabled>Concluído</button>`:`<button type="button" class="gmx-play" style="background:${m.btn};color:${m.ink}" data-gmx="daily" data-g="${k}" aria-label="Jogar ${E(title)} (desafio do dia)">Jogar${svg('arrow',16,2.2)}</button>`}</article>`;
}
function freeCard(k,i){
  const m=META[k],G=B.GAMES.find(x=>x.m===k);if(!G)return '';
  return `<article class="gmx-gc" data-t="${E((G.t+' '+G.d).toLowerCase())}" data-n="${E(G.t.toLowerCase())}" style="--c:${m.c};--soft:${m.soft};--line:${m.line}"><div class="gmx-gc-img"><img src="${m.cover}" alt="${E(m.coverAlt)}" width="414" height="195" ${i<2?'':'loading="lazy"'}></div><div class="gmx-gc-body"><img src="${m.icon}" alt="" width="44" height="44"><div><b>${E(G.t)}</b><span>${E(G.d)}</span></div><button type="button" class="gmx-play" style="background:${m.btn};color:${m.ink}" data-gmx="free" data-g="${k}" aria-label="Jogar ${E(G.t)} no modo livre">Jogar livre${svg('arrow',16,2.2)}</button></div></article>`;
}
/* o motor dos jogos escreve dentro de #game-stage; ao voltar ele pede IASDPages.gameCards(), que devolve este catálogo */
function catalog(){return `<div class="gmx-games" id="gmx-games">${ORDER.map(freeCard).join('')}</div><p class="gmx-none" id="gmx-none" hidden>Nenhum jogo encontrado para essa busca.</p>`}
function active(){return !!document.querySelector('.gmx #game-stage')}
function rankInner(){
  const DR=B.DR,rows=DR.rows[DR.scope]||[];
  if(DR.loaded[DR.scope]&&!DR.err&&!DR.legacy&&!rows.length){
    return `<div class="gmx-podio"><img src="${ART}podio.jpg" alt="Pódio vazio com as posições 1, 2 e 3" width="394" height="140" loading="lazy"><b>Seja o primeiro a ocupar o pódio.</b><span>Complete um desafio do dia para entrar no ranking.</span></div>`;
  }
  return B.rankBody();
}
function rankTabsHTML(){return B.rankTabs()}

function html(bridge){
  B=bridge;
  const HR=window.IASDHomeRef;
  const chrome=HR&&HR.chrome?HR.chrome(window.IASDUI.bridge(),'Jogo'):{header:'',footer:''};
  const pts=B.drPointsToday();
  const reset=g(()=>window.IASDAccess&&IASDAccess.canResetRanking(cloudRole));
  const presence=g(()=>window.IASDLivePresence&&IASDLivePresence.canSee());
  const doneN=B.DAILY_GAMES.filter(x=>B.drDone(x[0])).length;
  const admin=(reset||presence)?`<div class="hm-adm"><button type="button" class="hm-dots" data-hm="adm" aria-haspopup="true" aria-expanded="false" aria-label="Opções administrativas dos jogos">${svg('more',18,2.4)}</button><div class="hm-adm-menu" hidden>${presence?'<button type="button" data-gmx="presence">Presença: quem joga</button>':''}${reset?'<button type="button" data-gmx="reset">Zerar ranking</button>':''}</div></div>`:'';
  return `<div class="iu-home hm gmx"><div class="hm-bg" aria-hidden="true"><i class="a"></i><i class="b"></i></div>
<section class="gmx-top" aria-labelledby="gmx-h1"><div class="gmx-art"><img src="${ART}arena.jpg" alt="" aria-hidden="true" width="447" height="420" fetchpriority="high">
 <div class="gmx-prog" role="status" aria-live="polite"><span class="gmx-prog-i">${svg('chart',24,1.8)}</span><div><small>Seu progresso</small><b>${pts.toLocaleString('pt-BR')}</b><small>pontos hoje</small></div></div></div><div class="hm-wrap gmx-in">${chrome.header}
 <div class="gmx-arena"><div class="gmx-title"><h1 id="gmx-h1">Entre na arena.</h1><p>Conhecimento, diversão e comunidade em cada partida.</p></div>
 <div class="gmx-panel"><span class="gmx-kick">${svg('pad',18,1.8)}JOGO COLETIVO</span><p>Cada jogador no seu celular.</p>
  <button type="button" class="gmx-create" data-gmx="create">Criar sala${svg('arrow',18,2.2)}</button>
  <button type="button" class="gmx-join" data-gmx="join">${svg('join',18,1.8)}Entrar com código</button>
  <ul class="gmx-modes" aria-label="Formatos disponíveis na sala"><li>${svg('user',16)}Individual</li><li>${svg('users',16)}Time × Time</li><li>${svg('monitor',16)}Telão</li></ul></div></div></div></section>
<div class="hm-wrap gmx-body">
 <section class="gmx-card gmx-daily" id="gmx-daily" aria-labelledby="gmx-d-t"><header><div><h2 id="gmx-d-t">Seu desafio de hoje</h2><p>Uma tentativa por jogo, por dia, com as mesmas perguntas para todos. Os pontos entram no ranking. <span class="gmx-cnt">${doneN} de ${B.DAILY_GAMES.length} concluídos.</span></p></div><span class="gmx-badge">${svg('trophy',16,1.8)}VALE RANKING</span><button type="button" class="hm-lnk" data-gmx="to-free">Jogos livres${svg('arrow',15,2)}</button></header>
  <div class="gmx-dg">${ORDER.map(dailyCard).join('')}</div>
  <details class="gmx-more"><summary>Como funciona o ranking</summary>Jogar mais horas não dá vantagem. <b>${E(B.PRIZE_TEXT)}</b> Os jogos livres ficam abertos para treinar e não pontuam.</details></section>
 <section class="gmx-free" id="gmx-free" aria-labelledby="gmx-f-t"><div class="gmx-free-h"><div><h2 id="gmx-f-t">Escolha seu próximo desafio</h2><p>Explore os jogos e aprenda de forma divertida.</p></div><span class="gmx-badge soft">${svg('pad',16,1.8)}Modo livre · não pontua</span>
  <label class="gmx-search">${svg('search',18,1.8)}<input id="gmx-q" type="search" placeholder="Pesquisar jogos..." aria-label="Pesquisar jogos" autocomplete="off"></label>
  <label class="gmx-sort"><span class="sr-only">Ordenar</span><select id="gmx-sort" aria-label="Ordenar jogos"><option value="padrao">Ordem padrão</option><option value="nome">Nome (A–Z)</option></select></label></div>
  <div id="game-stage">${catalog()}</div></section>
 <div class="gmx-two">
  <section class="gmx-card gmx-rank" id="gmx-rank" aria-labelledby="gmx-r-t"><header><h2 id="gmx-r-t">Ranking da comunidade</h2>${admin}</header>${rankTabsHTML()}<div id="gm-rank" class="gm-rank gmx-rk">${rankInner()}</div></section>
  <section class="gmx-card gmx-how" aria-labelledby="gmx-h-t"><div class="gmx-how-t"><h2 id="gmx-h-t">Como jogar em grupo</h2><p>É rápido e todos participam pelo celular.</p>
   <ol><li><i>1</i><div><b>Criar uma sala</b><span>Escolha o jogo e configure a sala.</span></div></li><li><i>2</i><div><b>Compartilhar o código</b><span>Envie o código ou o QR da sala para os participantes.</span></div></li><li><i>3</i><div><b>Jogar pelo celular</b><span>Cada pessoa entra pelo próprio celular e a diversão começa.</span></div></li></ol></div>
   <img class="gmx-how-i" src="${ART}celular.jpg" alt="" width="150" height="196" loading="lazy"></section>
 </div>
 ${chrome.footer}</div></div>`;
}

/* ranking: depois que os dados chegam, troca o texto padrão pelo estado vazio com o pódio */
function paint(){
  if(!B)return;
  const el=document.getElementById('gm-rank');if(!el)return;
  el.innerHTML=rankInner();
}

let bound=false;
function bind(){
  if(bound)return;bound=true;
  document.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('.gmx [data-gmx]');if(!t)return;
    const a=t.dataset.gmx;
    if(a==='create')return liveRun('setup');
    if(a==='join')return liveRun('joinForm');
    if(a==='daily')return g(()=>window.IASDSolo.startDaily(t.dataset.g));
    if(a==='free')return g(()=>window.IASDSolo.open(t.dataset.g));
    if(a==='to-free'){const f=document.getElementById('gmx-free');if(f)f.scrollIntoView({behavior:'smooth',block:'start'});return}
    if(a==='presence')return g(()=>window.IASDLivePresence.open());
    if(a==='reset')return g(()=>window.IASDPages.resetRank(t));
  });
  const filter=()=>{
    const q=(document.getElementById('gmx-q')||{}).value||'';const v=q.trim().toLowerCase();
    const cards=[...document.querySelectorAll('#gmx-games .gmx-gc')];let n=0;
    cards.forEach(c=>{const ok=!v||c.dataset.t.includes(v);c.hidden=!ok;if(ok)n++});
    const none=document.getElementById('gmx-none');if(none)none.hidden=n>0;
  };
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='gmx-q')filter()});
  document.addEventListener('change',e=>{
    if(!e.target||e.target.id!=='gmx-sort')return;
    const box=document.getElementById('gmx-games');if(!box)return;
    const cs=[...box.children];
    cs.sort((a,b)=>e.target.value==='nome'?a.dataset.n.localeCompare(b.dataset.n,'pt-BR'):ORDER.indexOf(a.querySelector('[data-g]').dataset.g)-ORDER.indexOf(b.querySelector('[data-g]').dataset.g));
    cs.forEach(c=>box.appendChild(c));
  });
}
bind();

window.IASDGamesRef={html,paint,catalog,active};
})();
