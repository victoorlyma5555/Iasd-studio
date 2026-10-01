/* IASD APP — casco visual novo (menu, topo, navegação do celular e Home).
   Este arquivo só DESENHA. Toda ação chama as funções que já existem em app/main.js
   (go, toggleTheme, toggleAccountMenu, newTab, pairCompanion, editCover...).
   Carregue ANTES de app/main.js. Se algo falhar aqui, o visual antigo volta sozinho.
   Para voltar ao visual antigo manualmente: abra o site com ?ui=old  (e ?ui=new para reativar). */
(function(){
'use strict';

/* ---------- textos da Home (edite aqui) ---------- */
const config={
  banner:{eyebrow:'EVANGELISMO',title:['O FIM DO','PECADO'],verse:'“E vi novo céu e nova terra...”',ref:'Apocalipse 21:1',button:'Ver programação da semana'},
  passage:{text:'“Porque para Deus nada é impossível.”',ref:'Lucas 1:37',book:'luke',chapter:1}
};

/* ---------- ligado / desligado ---------- */
function preference(){
  try{
    const q=new URLSearchParams(location.search).get('ui');
    if(q==='old'||q==='new')localStorage.setItem('iasd-ui',q);
    return localStorage.getItem('iasd-ui')!=='old';
  }catch(e){return true}
}
const api={enabled:preference(),config};

/* ---------- acesso seguro ao estado do app (main.js) ---------- */
const g=fn=>{try{return fn()}catch(e){return undefined}};
const S={
  user:()=>g(()=>cloudUser)||null,
  role:()=>g(()=>cloudRole)||null,
  cur:()=>g(()=>current)||'Painel',
  tabs:()=>g(()=>customTabs)||[],
  schedules:()=>g(()=>cloudSchedules)||[],
  sound:()=>!!g(()=>canUseSound()),
  manage:()=>!!g(()=>canManageSite()),
  assigned:()=>!!g(()=>hasAssignedRole()),
  founder:()=>!!g(()=>cloudUser)&&g(()=>cloudRole)==='founder'
};
const E=s=>{const f=g(()=>esc);return f?f(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
const $=id=>document.getElementById(id);

/* ---------- ícones ---------- */
const P={chart:'M4 20V10M10 20V4M16 20v-8M22 20H2',share:'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',eye:'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',eyeoff:'M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.7 6.7C3.9 8.5 2 12 2 12s3.6 7 10 7a9.7 9.7 0 004.3-1M9.9 9.9a3 3 0 004.2 4.2',down:'M6 9l6 6 6-6',up:'M6 15l6-6 6 6',trophy:'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',menu:'M3 6h18M3 12h18M3 18h18',back:'M15 6l-6 6 6 6',home:'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',calendar:'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',users:'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 4a4 4 0 010 7M22 21c0-3-2-5-4-5.5',music:'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',book:'M2 4h7a3 3 0 013 3v14a2 2 0 00-2-2H2zM22 4h-7a3 3 0 00-3 3v14a2 2 0 012-2h8z',game:'M6 12h4M8 10v4M15 13h.01M18 11h.01M6 5h12a4 4 0 014 4l1 7a3 3 0 01-5 2l-2-2H8l-2 2a3 3 0 01-5-2l1-7a4 4 0 014-4z',star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',film:'M3 4h18v16H3zM3 9h18M8 4l-2 5M14 4l-2 5',crown:'M3 8l4 4 5-7 5 7 4-4-2 11H5z',folder:'M3 6h6l2 2h10v13H3z',plus:'M12 5v14M5 12h14',search:'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',bell:'M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',moon:'M21 13A9 9 0 1111 3a7 7 0 0010 10z',sun:'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',chev:'M9 6l6 6-6 6',play:'M6 4l14 8-14 8z',link:'M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1',monitor:'M3 4h18v12H3zM8 20h8M12 16v4',clock:'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',user:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3-6 8-6s8 2 8 6',bolt:'M13 2L4 14h7l-1 8 9-12h-7z',dice:'M4 4h16v16H4zM9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 12h.01',horn:'M3 10v4h4l8 5V5L7 10zM19 9a4 4 0 010 6',gear:'M12 15a3 3 0 100-6 3 3 0 000 6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2'};
const ic=(n,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]||P.star}"/></svg>`;

/* ---------- páginas do menu ---------- */
const MAIN=[['Painel','home','Início'],['Cronograma','calendar','Cronogramas'],['Escalas','users','Escalas'],['Projeção','music','IASD Projetor'],['Bíblia','book','Bíblia'],['Lição da Escola Sabatina','book','Lição Sabática'],['Jogo','game','Jogos'],['Datas especiais','star','Datas Especiais'],['Palavra em Cena','film','Palavra em Cena']];
function mainPages(){return MAIN.filter(x=>x[0]!=='Projeção'||S.sound())}
const MOBILE_BAR=[['Painel','home','Início'],['Bíblia','book','Bíblia'],['Cronograma','calendar','Cronograma'],['Escalas','users','Escalas'],['Palavra em Cena','film','Jogral']];
const TITLES={Painel:'Início',Cronograma:'Cronogramas',Escalas:'Escalas',Sonoplastia:'IASD Projetor','Projeção':'IASD Projetor',Sorteadores:'Sorteadores','Mídia':'Mídia',Bíblia:'Bíblia','Lição da Escola Sabatina':'Lição Sabática','Datas especiais':'Datas Especiais','Palavra em Cena':'Palavra em Cena',Jogo:'Jogos','Hinário':'Hinário',Fundador:'Painel do Fundador',Acervo:'Acervo do Site',Perfil:'Meu perfil',Alertas:'Alertar sonoplastia',Mais:'Menu'};
function titleOf(cur){
  if(String(cur).startsWith('custom:')){const t=S.tabs().find(x=>'custom:'+x.id===cur);return t?.title||'Aba'}
  return TITLES[cur]||cur;
}
function searchable(){
  const out=mainPages().map(([id,i,l])=>({id,icon:i,label:l}));
  S.tabs().forEach(t=>out.push({id:'custom:'+t.id,icon:'star',label:t.title||'Aba'}));
  if(S.sound()){out.push({id:'Sorteadores',icon:'dice',label:'Sorteadores'})}
  if(S.sound())out.push({id:'Mídia',icon:'music',label:'Mídia e músicas'});
  out.push({id:'Perfil',icon:'user',label:'Meu perfil'});
  if(S.founder())out.push({id:'Fundador',icon:'crown',label:'Painel do Fundador'});
  if(S.manage())out.push({id:'Acervo',icon:'folder',label:'Acervo do Site'});
  return out;
}
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

/* ---------- menu lateral ---------- */
function navBtn(id,iconHtml,label,cur){return `<button class="iu-nav${cur===id?' on':''}" data-go="${E(id)}">${iconHtml}<span>${E(label)}</span></button>`}
function sideHTML(){
  const cur=S.cur();
  let h='<div class="iu-logo"><img src="/iasd-app-logo.png?v=1" alt=""><div><b>IASD <i>APP</i></b><small>SONOPLASTIA E PROJEÇÃO</small></div></div>';
  h+=mainPages().map(([id,i,l])=>navBtn(id,ic(i,19),l,cur)).join('');
  h+=S.tabs().map(t=>navBtn('custom:'+t.id,`<span class="iu-glyph">${E(t.icon||'✦')}</span>`,t.title||'Aba',cur)).join('');
  if(S.assigned())h+='<div class="iu-sec">EQUIPE</div>'+navBtn('Alertas',ic('bell',19),'Alertar sonoplastia',cur);
  if(S.manage()){
    h+='<div class="iu-sec">ADMINISTRAÇÃO</div>';
    if(S.founder())h+=navBtn('Fundador',ic('crown',19),'Painel do Fundador',cur);
    h+=navBtn('Acervo',ic('folder',19),'Acervo do Site',cur);
    h+=`<button class="iu-nav" data-act="newtab">${ic('plus',19)}<span>Criar aba</span></button>`;
  }
  h+='<div class="iu-tag"><b>IASD APP</b>Mais que tecnologia, uma ferramenta para o Reino de Deus.</div>';
  return h;
}
function barHTML(){
  const cur=S.cur();
  return `<button class="iu-bn-menu" data-act="menu" aria-label="Abrir menu">${ic('menu',20)}Menu</button>`+MOBILE_BAR.map(([id,i,l])=>`<button class="${cur===id?'on':''}" data-go="${E(id)}">${ic(i,20)}${E(l)}</button>`).join('');
}

/* ---------- topo ---------- */
function topHTML(){
  return `<button class="iu-ib iu-menu" data-act="menu" aria-label="Abrir menu">${ic('menu',20)}</button>
<button class="iu-ib iu-back" data-act="back" aria-label="Voltar">${ic('back',20)}</button>
<div class="iu-title" id="iu-title"></div>
<div class="iu-search" role="search">${ic('search',18)}<input id="iu-q" placeholder="Pesquisar no IASD APP..." aria-label="Pesquisar no IASD APP" autocomplete="off"><kbd>Ctrl + K</kbd><div class="iu-sr" id="iu-sr" hidden></div></div>
<div class="iu-sp"></div>
<button class="iu-ib" id="iu-vis" data-act="vis" hidden></button><button class="iu-ib" id="iu-theme" data-act="theme"></button>
<button class="iu-ib" id="iu-bell" data-go="Alertas" aria-label="Alertar sonoplastia" title="Alertar sonoplastia" hidden>${ic('bell',19)}</button>
<button class="iu-me" id="iu-me" data-act="account" aria-label="Minha conta"></button>`;
}
function accountHTML(){
  const user=S.user();
  if(!user)return `<span class="iu-av">${ic('user',16)}</span><div><b>Entrar</b><small>Área da equipe</small></div>`;
  const prof=g(()=>myProfile)||null;
  const name=prof?.full_name||user.user_metadata?.full_name||(user.email||'').split('@')[0]||'Usuário';
  let av=E(String(name).slice(0,1).toUpperCase());
  if(prof?.avatar_path){
    const src=g(()=>profileMediaUrl(prof.avatar_path));
    const st=g(()=>profileImageStyle('avatar'))||'';
    if(src)av=`<img src="${E(src)}" style="width:100%;height:100%;object-fit:cover;${E(st)}" alt="">`;
  }
  return `<span class="iu-av">${av}</span><div><b>${E(name)}</b><small>${E(g(()=>roleLabel())||'')}</small></div>`;
}
function visIcon(){
  const b=$('iu-vis');if(!b)return;
  b.hidden=!S.founder();
  const on=g(()=>IASDPresence.isVisible());
  b.innerHTML=ic(on?'eye':'eyeoff',19);
  b.setAttribute('aria-pressed',String(!on));
  b.title=on?'Você está visível para os sonoplastas. Clique para ficar invisível.':'Você está invisível. Clique para aparecer nas listas.';
  b.setAttribute('aria-label',on?'Visível — clique para ficar invisível':'Invisível — clique para ficar visível');
  b.classList.toggle('iu-off',!on);
}
function themeIcon(){
  const dark=document.documentElement.getAttribute('data-theme')==='dark';
  const b=$('iu-theme');if(!b)return;
  b.innerHTML=ic(dark?'moon':'sun',19);
  b.setAttribute('aria-label',dark?'Ativar modo claro':'Ativar modo escuro');
  b.title=dark?'Ativar modo claro':'Ativar modo escuro';
}

/* ---------- Home ---------- */
const CARDS=[
 ['Cronograma','calendar','Cronogramas','Veja a programação de hoje','home_icon_schedule','#5b3aa8','#e8792f'],
 ['Projeção','music','IASD Projetor','Abra o Studio de Projeção','home_icon_projection','#1e2a78','#7c3aed'],
 ['Bíblia','book','Bíblia','Leia e pesquise as Escrituras','home_icon_bible','#8a4b2a','#e9b56a'],
 ['Lição da Escola Sabatina','book','Lição Sabática','Jovem e Adulto','home_icon_lesson','#1c3b6e','#4a7bd0'],
 ['Jogo','game','Jogos','Atividades e interação','home_icon_games','#a86a12','#f4c24a'],
 ['Escalas','users','Escalas','Consulte as escalas mensais','home_icon_scales','#1d2f6b','#6d4be0'],
 ['Datas especiais','star','Datas Especiais','Eventos e comemorações','home_icon_dates','#a0304a','#f08a5d'],
 ['Palavra em Cena','film','Palavra em Cena','Jograis e apresentações','home_icon_pec','#33307a','#8f6fe8']
];
const QUICK=[
 ['Sorteadores','dice','Sorteador','#92400e','#3b2a1a','sound'],
 ['Sorteadores','dice','Provai e Vede','#1d4ed8','#4c1d95','sound'],
 ['Mídia','music','Mídia e músicas','#b45309','#7c2d12','sound'],
 ['Projeção','play','IASD Projetor','#6d28d9','#312e81','sound'],
 ['Bíblia','book','Bíblia de Projeção','#9a3412','#1e293b','sound'],
 ['Alertas','horn','Alertar sonoplastia','#a16207','#422006','assigned']
];
function coverStyle(slot,c1,c2){
  const path=slot&&g(()=>siteAssets[slot]);
  if(path&&!/\.(mp4|webm|mov)$/i.test(path)){
    const url=g(()=>imageUrl(path));
    if(url){return `background-image:linear-gradient(135deg,${c1},${c2});`}
  }
  return `background-image:linear-gradient(135deg,${c1},${c2});`;
}
function cardsHTML(){
  const edit=S.manage();
  const base=CARDS.filter(x=>x[0]!=='Projeção'||S.sound()).map(([go,icon,title,desc,slot,c1,c2])=>`<div class="iu-cw"><button class="iu-card" data-go="${E(go)}"><div class="im" style="${coverStyle(slot,c1,c2)}">${g(()=>IASDMedia.img(slot))||''}</div><div class="bd"><span class="iu-badge">${ic(icon,18)}</span><b>${E(title)}</b><small>${E(desc)}</small></div></button>${edit&&slot?`<button class="iu-ed" data-act="cover" data-slot="${E(slot)}">✎ Editar capa</button>`:''}</div>`);
  const custom=S.tabs().map(t=>{const slot='custom_cover_'+t.id;return `<div class="iu-cw"><button class="iu-card" data-go="${E('custom:'+t.id)}"><div class="im" style="${coverStyle(slot,'#1d2f6b','#6d4be0')}">${g(()=>IASDMedia.img(slot))||''}</div><div class="bd"><span class="iu-badge"><span class="iu-glyph">${E(t.icon||'✦')}</span></span><b>${E(t.title||'Aba')}</b><small>${E(t.description||'')}</small></div></button>${edit?`<button class="iu-ed" data-act="cover" data-slot="${E(slot)}">✎ Editar capa</button>`:''}</div>`});
  return base.concat(custom).join('');
}
function parseItems(items){
  const f=g(()=>parseSchedule);
  return (items||[]).filter(x=>!String(x).startsWith('@@equipe ')).map(x=>f?f(x):{time:'•',title:String(x),person:''});
}
const sched={expanded:false,LIMIT:5};
function scheduleInner(){
  const today=new Date().toLocaleDateString('en-CA');
  const featured=S.schedules().find(x=>x.date===today)||null;
  const label=(()=>{const d=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});return d.charAt(0).toUpperCase()+d.slice(1)})();
  let body='',toggle='';
  if(!featured){
    body='<div class="iu-empty"><strong>Nenhuma programação para hoje</strong>Quando houver atividades cadastradas, elas aparecerão aqui.</div>';
  }else{
    const now=new Date(),cur=now.getHours()*60+now.getMinutes();
    const rows=parseItems(featured.items);
    let idx=-1;
    rows.forEach((a,i)=>{const m=/^(\d{1,2}):(\d{2})$/.exec(a.time);if(m&&(+m[1])*60+(+m[2])<=cur)idx=i});
    const many=rows.length>sched.LIMIT,collapsed=many&&!sched.expanded;
    let start=0,end=rows.length;
    if(collapsed){start=Math.min(Math.max(0,idx-1),rows.length-sched.LIMIT);end=start+sched.LIMIT}
    const li=(a,i)=>`<li class="${i<idx?'d':i===idx?'n':''}"><time>${E(a.time)}</time><i></i><span class="t">${E(a.title)}${a.person?`<small>${E(a.person)}</small>`:''}</span>${i===idx?'<em class="iu-now" style="font-style:normal">Agora</em>':''}</li>`;
    const before=start,after=rows.length-end;
    body=`<div style="font-weight:600">${E(featured.name)} <span style="color:var(--iu-mu);font-weight:400;font-size:12px">· ${rows.length} atividades</span></div>`
      +(before?`<div class="iu-more">${before} anterior${before>1?'es':''}</div>`:'')
      +`<div class="iu-sch-wrap${many&&sched.expanded?' scroll':''}"><ul class="iu-sch">${rows.slice(start,end).map((a,k)=>li(a,start+k)).join('')}</ul></div>`
      +(after?`<div class="iu-more">mais ${after} depois</div>`:'');
    if(many)toggle=`<button class="iu-btn" data-act="sched-toggle" aria-expanded="${sched.expanded}">${ic(sched.expanded?'up':'down',16)}${sched.expanded?'Recolher cronograma':'Mostrar todas as '+rows.length+' atividades'}</button>`;
  }
  return `<div class="iu-ph">${ic('calendar',20)}<h2>Cronograma de hoje</h2><small>${E(label)}</small></div>${body}${toggle}<button class="iu-btn" data-go="Cronograma">${ic('calendar',16)}Ver cronograma completo${ic('chev',16)}</button>`;
}
function scheduleHTML(){return `<section class="iu-pan" id="iu-sched">${scheduleInner()}</section>`}
function updateSchedule(){
  const el=$('iu-sched');if(el)el.innerHTML=scheduleInner();
  const grid=document.querySelector('.iu-grid');if(grid)grid.classList.toggle('exp',sched.expanded);
}

/* IASD Projetor: lê o status real do aplicativo do Windows (GET /status, sem login). */
const proj={state:'idle',data:null,busy:false,checkedAt:0};
function lastSeen(){try{return Number(localStorage.getItem('iasd-ui-proj-last'))||0}catch(e){return 0}}
function fmtLast(ts){
  if(!ts)return '—';
  const d=new Date(ts),hm=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  return d.toDateString()===new Date().toDateString()?'Hoje, '+hm:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+', '+hm;
}
function imageOf(slot){const path=g(()=>siteAssets[slot]);return path&&!/\.(mp4|webm|mov)$/i.test(path)?g(()=>imageUrl(path)):''}
function bgImage(slot,shade){
  const url=imageOf(slot);if(!url)return '';
  const f=g(()=>assetFrames[slot])||{};
  return `background-image:${shade?shade+',':''}url('${E(url)}');background-size:cover;background-position:${Number(f.position_x??50)}% ${Number(f.position_y??50)}%;`;
}
function projInner(){
  const st=proj.state,d=proj.data;
  const badge={ok:['Conectado',''],unpaired:['Sem pareamento','warn'],off:['Desconectado','off'],checking:['Verificando…','warn'],idle:['Pronto para conectar','off']}[st]||['—','off'];
  const monitors=d&&d.online?(d.secondMonitor?`${Math.max(1,(d.monitors||[]).length-1)} telão`+((d.monitors||[]).length-1>1?'s':''):'Nenhum telão'):'—';
  const name=S.user()?g(()=>loggedUserName()):'Visitante';
  const sound=S.sound();
  return `<div class="iu-ph">${ic('monitor',20)}<h2>IASD Projetor</h2><span class="iu-ok ${badge[1]}">${badge[0]}</span></div>
<div class="iu-pv">${g(()=>IASDMedia.img('home_projector'))||''}${imageOf('home_projector')?'':ic('monitor',40)}${S.manage()?'<button class="iu-edit" data-act="cover" data-slot="home_projector">✎ Editar imagem</button>':''}</div>
<div class="iu-inf"><div>${ic('clock',15)}Última conexão: <b>${E(fmtLast(lastSeen()))}</b></div><div>${ic('monitor',15)}Monitor detectado: <b>${E(monitors)}</b></div><div>${ic('user',15)}Usuário: <b>${E(name||'—')}</b></div></div>
<button class="iu-btn p" data-go="Projeção">${ic('play',16)}Abrir Studio de Projeção${ic('chev',16)}</button>
${sound?`<div class="iu-two"><button class="iu-btn" data-act="projtest"${proj.busy?' disabled':''}>${ic('link',16)}Testar conexão</button><button class="iu-btn" data-act="projpair" title="Informar o código de pareamento do IASD Projetor">${ic('gear',16)}Parear projetor</button></div><div class="iu-pres" id="iu-pres">${presInner()}</div>`:''}`;
}
function presInner(){
  const P=window.IASDPresence;if(!P)return '';const fd=P.isFounder();
  const v=P.view(),day=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'});
  const row=r=>`<li class="iu-pr ${r.tag}"><span class="iu-av">${E((r.name||'?').trim().charAt(0).toUpperCase())}</span><div class="iu-pt"><b>${E(r.name)}${r.me?' <em>(você)</em>':''}</b><small>Chegou ${E(r.arrived)} · online há ${E(r.online)} · ${E(r.device||'')}${r.projetor==='ok'?' · Projetor conectado':''}</small></div>${fd?`<span class="iu-tg ${r.tag}">${E(r.label)}</span>`:''}</li>`;
  const ab=a=>`<li class="iu-pr abs"><span class="iu-av">${E((a.name||'?').charAt(0).toUpperCase())}</span><div class="iu-pt"><b>${E(a.name)}</b><small>Escalado${a.time?' às '+E(a.time):''} · ainda não entrou</small></div><span class="iu-tg abs">Ausente</span></li>`;
  const empty=!v.rows.length&&!v.absent.length;
  return `<div class="iu-prh"><b>${ic('users',16)}Sonoplastas em serviço <span class="iu-cnt">${v.total}</span></b><small>${E(day)}</small></div>
${fd?`<p class="iu-pn">${v.visible?'Você aparece para os sonoplastas.':'Você está invisível (botão de olho no topo).'} Atrasos e ausências só aparecem para você.</p>`:''}
${v.subscribed?'':'<p class="iu-pn">Conectando ao serviço de presença…</p>'}
<ul class="iu-prl">${v.rows.map(row).join('')}${fd?v.absent.map(ab).join(''):''}${(fd?empty:!v.rows.length)&&v.subscribed?'<li class="iu-pe">Ninguém online agora.</li>':''}</ul>
${fd?'<p class="iu-pn">A escala vem do cadastro em Escalas deste aparelho (área Sonoplastia ou Projeção).</p>':''}`;
}
function updatePres(){const el=$('iu-pres');if(el)el.innerHTML=presInner()}
function updateProj(){const el=$('iu-proj');if(el)el.innerHTML=projInner()}
async function checkProjector(){
  if(proj.busy)return;
  proj.busy=true;proj.state='checking';updateProj();
  const token=g(()=>companionToken);
  try{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),2500);
    const url=g(()=>companionURL)||'http://127.0.0.1:38741';
    const r=await fetch(url+'/status',{targetAddressSpace:'loopback',signal:ctl.signal,cache:'no-store'});
    clearTimeout(timer);
    const b=await r.json();
    proj.data=b;
    proj.state=b.online?(b.paired&&token?'ok':'unpaired'):'off';
    if(proj.state==='ok'){try{localStorage.setItem('iasd-ui-proj-last',String(Date.now()))}catch(e){}}
  }catch(e){proj.state='off';proj.data=null}
  proj.busy=false;proj.checkedAt=Date.now();updateProj();
}
/* Passagem do dia: uma referência por dia (lista abaixo) e o texto vem da mesma Bíblia usada na tela Bíblia. */
const DAILY=[['psalms',23,1],['john',3,16],['proverbs',3,5],['isaiah',41,10],['philippians',4,13],['romans',8,28],['jeremiah',29,11],['matthew',11,28],['joshua',1,9],['psalms',46,1],['luke',1,37],['2 timothy',1,7],['hebrews',11,1],['matthew',6,33],['romans',12,2],['psalms',119,105],['galatians',2,20],['colossians',3,23],['1 john',4,19],['ephesians',2,8],['revelation',21,4],['psalms',27,1],['proverbs',16,3],['isaiah',40,31],['john',14,6],['1 corinthians',13,13],['deuteronomy',31,6],['matthew',28,20],['psalms',91,1],['2 corinthians',12,9],['james',1,5]];
const passage={book:config.passage.book,chapter:config.passage.chapter,verse:1,ref:config.passage.ref,text:config.passage.text,loaded:false};
function todayKey(){return new Date().toLocaleDateString('en-CA')}
function dailyRef(){
  const d=new Date(),day=Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);
  return DAILY[day%DAILY.length];
}
function bookName(id){return (g(()=>bibleBooks.find(x=>x[1]===id))||[])[0]||id}
function passageCacheKey(){return 'iasd-ui-passage:'+todayKey()+':'+'nvi'}
function loadPassage(){
  const [book,chapter,verse]=dailyRef();
  const apply=()=>{passage.book=book;passage.chapter=chapter;passage.verse=verse;passage.ref=bookName(book)+' '+chapter+':'+verse+' (NVI)'};
  try{const c=JSON.parse(localStorage.getItem(passageCacheKey())||'null');if(c&&c.text){apply();passage.text=c.text;passage.loaded=true;return Promise.resolve()}}catch(e){}
  if(passage.fetching)return passage.fetching;
  passage.fetching=(async()=>{
    try{
      const verses=await fetchBibleChapter(book,chapter,'nvi');
      const v=(verses||[]).find(x=>Number(x.verse)===verse);
      const text=v&&String(v.text||'').replace(/\s+/g,' ').trim();
      if(text){apply();passage.text='“'+text+'”';passage.loaded=true;try{localStorage.setItem(passageCacheKey(),JSON.stringify({text:passage.text}))}catch(e){}}
    }catch(e){console.warn('[IASD UI] passagem do dia indisponível, usando texto padrão',e)}
    passage.fetching=null;updatePassage();
  })();
  return passage.fetching;
}
function passageInner(){
  const long=passage.text.length>150;
  return `<div class="iu-ph">${ic('book',20)}<h2>Passagem do dia</h2></div><q${long?' class="long"':''}>${E(passage.text)}</q><small>${E(passage.ref)}</small><div class="iu-two"><button class="iu-btn" data-act="passage">${ic('book',16)}Ver versículo</button><button class="iu-btn" data-go="Bíblia">${ic('search',16)}Pesquisar</button><button class="iu-btn iu-sharev" data-act="vshare">${ic('share',16)}Compartilhar versículo</button></div>${S.manage()?'<button class="iu-edit" data-act="cover" data-slot="home_passage">✎ Editar imagem</button>':''}`;
}
function passageStyle(){return bgImage('home_passage','linear-gradient(180deg,rgba(8,16,38,.25),rgba(8,16,38,.82))')}
function updatePassage(){const el=$('iu-passage');if(el){el.innerHTML=passageInner();el.setAttribute('style',passageStyle())}}
function passageHTML(){
  loadPassage();
  return `<section class="iu-pan iu-pas" id="iu-passage" style="${passageStyle()}">${passageInner()}</section>`;
}

/* ---------- Destaques da comunidade (ranking do Desafio da Palavra) ---------- */
const rank={rows:null,loading:false,error:false,at:0,me:null,uid:undefined,reqUid:undefined,scope:'all'};
function initials(name){const w=String(name||'?').trim().split(/\s+/);return ((w[0]||'?')[0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase()}
function hue(name){let h=0;for(const c of String(name))h=(h*31+c.charCodeAt(0))%360;return h}
function avatarHTML(r,big){
  const cls='iu-rav'+(big?' big':'');
  if(r.avatar)return `<span class="${cls}"><img src="${E(r.avatar)}" alt=""></span>`;
  return `<span class="${cls}" style="background:hsl(${hue(r.name)} 55% 42%)">${E(initials(r.name))}</span>`;
}
function normRows(list){
  return (list||[]).map(x=>{
    const p=x.iasd_profiles||{};
    const path=p.avatar_path,url=path?g(()=>profileMediaUrl(path)):'';
    const total=Number(x.total_answers||0),ok=Number(x.correct_answers||0);
    return {name:x.display_name||p.full_name||'Participante',score:Number(x.score||0),acc:total?Math.round(ok*100/total):0,streak:Number(x.best_streak||0),avatar:url||'',uid:x.user_id||null};
  });
}
function loadRanking(force){
  const user=S.user(),uid=user?user.id:null;
  if(rank.loading&&rank.reqUid===uid)return;
  if(!force&&rank.uid===uid&&rank.at&&Date.now()-rank.at<60000)return;
  rank.loading=true;rank.reqUid=uid;
  const done=()=>{
    if((S.user()?S.user().id:null)!==uid){rank.loading=false;loadRanking(true);return}   // a conta mudou no meio da busca
    rank.loading=false;rank.uid=uid;rank.at=Date.now();updateRank();
  };
  if(user){
    Promise.resolve(g(()=>loadGameRanking())).catch(()=>{}).then(()=>{
      const list=g(()=>gameRanking)||[];
      rank.rows=normRows(list);rank.error=false;rank.scope='all';
      const i=list.findIndex(x=>x.user_id===user.id);
      rank.me=i>=0?{pos:i+1,score:Number(list[i].score||0)}:null;
      const c=g(()=>cloud);
      if(c&&c.rpc){
        Promise.resolve(c.rpc('iasd_daily_ranking',{p_scope:'week'})).then(r=>{
          if(r&&!r.error&&Array.isArray(r.data)&&r.data.length){
            rank.rows=normRows(r.data.map(x=>({user_id:x.user_id,score:x.score,correct_answers:x.correct,total_answers:x.total,best_streak:x.best_streak,iasd_profiles:{full_name:x.full_name,avatar_path:x.avatar_path}})));rank.scope='week';
            const j=r.data.findIndex(x=>x.user_id===user.id);rank.me=j>=0?{pos:j+1,score:Number(r.data[j].score||0)}:rank.me;
          }
        }).catch(()=>{}).then(done);
      }else done();
    });
    return;
  }
  // visitante: função pública do Supabase (docs/supabase-ranking-publico.sql). Sem ela, mostra o convite para entrar.
  const c=g(()=>cloud);
  if(!c||!c.rpc){rank.rows=[];rank.error=true;done();return}
  Promise.resolve(c.rpc('iasd_public_ranking',{p_limit:10})).then(r=>{
    if(r&&!r.error&&Array.isArray(r.data)){rank.rows=normRows(r.data);rank.error=false}
    else{rank.rows=[];rank.error=true}
    rank.me=null;done();
  }).catch(()=>{rank.rows=[];rank.error=true;rank.me=null;done()});
}
function pts(n){return Number(n||0).toLocaleString('pt-BR')}
function rankRow(r,place){
  return `<button class="iu-rk" data-go="Jogo"><b class="iu-rk-n n${place}">${place}</b>${avatarHTML(r,false)}<span class="nm">${E(r.name)}</span><span class="sc">${pts(r.score)} pts</span>${ic('chev',16)}</button>`;
}
function rankBody(){
  if(rank.rows===null)return '<div class="iu-empty">Carregando destaques…</div>';
  const rows=rank.rows,user=S.user(),me=rank.me,week=rank.scope==='week';
  let h='';
  if(rows[0]){
    const r=rows[0];
    h+=`<button class="iu-feat" data-go="Jogo"><span class="iu-feat-av">${avatarHTML(r,true)}</span><span class="iu-feat-tx"><span class="iu-feat-bd">${ic('star',13)}DESTAQUE ${week?'DA SEMANA':'DA COMUNIDADE'}</span><b>${E(r.name)}</b><small>${pts(r.score)} pontos</small><span class="iu-feat-pl">${ic('trophy',15)}1º lugar</span></span>${ic('chev',18)}</button>`;
  }
  if(rows[1])h+=rankRow(rows[1],2);
  if(rows[2])h+=rankRow(rows[2],3);
  let cta;
  if(!user)cta=`<button class="iu-next" data-act="signup"><span class="iu-next-ic">${ic('user',22)}</span><span><b>Participe e apareça aqui</b><small>Crie sua conta gratuita e dispute o topo.</small></span>${ic('chev',16)}</button>`;
  else if(me&&me.pos>3)cta=`<button class="iu-next" data-go="Jogo"><span class="iu-next-ic">${ic('game',22)}</span><span><b>Você está em ${me.pos}º lugar</b><small>${pts(me.score)} pontos. Jogue mais uma rodada e suba!</small></span>${ic('chev',16)}</button>`;
  else if(me)cta=`<button class="iu-next" data-go="Jogo"><span class="iu-next-ic">${ic('game',22)}</span><span><b>Você está em ${me.pos}º lugar</b><small>Continue jogando para defender o seu lugar.</small></span>${ic('chev',16)}</button>`;
  else cta=`<button class="iu-next" data-go="Jogo"><span class="iu-next-ic">${ic('user',22)}</span><span><b>O próximo destaque pode ser você</b><small>Participe dos desafios da comunidade.</small></span>${ic('chev',16)}</button>`;
  const empty=!rows.length?`<p class="iu-rank-note">${rank.error?'Entre na sua conta para ver e participar dos destaques da comunidade.':'O ranking começa com a primeira partida. Seja o primeiro da lista!'}</p>`:'';
  return h+empty+cta+`<div class="iu-rk-ft"><span>${ic('chart',16)}Pontos conquistados nos jogos da plataforma.</span><button class="iu-link" data-go="Jogo">Ver ranking completo${ic('chev',14)}</button></div>`;
}
function ctaBody(){return ''}
function updateRank(){
  const a=$('iu-rank-body'),b=$('iu-rank-cta');
  if(a)a.innerHTML=rankBody();
  const sc=$('iu-rank-scope');if(sc)sc.lastChild.textContent=rank.scope==='week'?'Nesta semana':'Geral';
}
function rankHTML(){
  loadRanking();
  return `<section class="iu-rank"><div class="iu-pan iu-rank-main"><div class="iu-ph">${ic('users',22)}<div class="iu-rk-tt"><h2>Nossa comunidade em destaque</h2><small class="iu-sub">Quem aprende junto vai mais longe.</small></div><span class="iu-scope" id="iu-rank-scope">${ic('calendar',14)}${rank.scope==='week'?'Nesta semana':'Geral'}</span></div><div id="iu-rank-body">${rankBody()}</div></div></section>`;
}
const EXTRAS=[
 ['plan','📖','Plano de leitura','__PLAN__','#0f766e','#134e4a'],
 ['remind','🔔','Lembrete diário','Versículo do dia','#1d4ed8','#312e81'],
 ['prayer','🙏','Pedidos de oração','Orar uns pelos outros','#7c3aed','#4c1d95'],
 ['cards','🎉','Cartão de parabéns','Aniversários e datas','#db2777','#7c2d6b'],
 ['champ','🏆','Campeões','Pódio do Domingo Jovem','#b45309','#7c2d12']
];
function planSub(){try{const t=window.IASDExtras&&IASDExtras.planToday();if(t)return (t.done?'✓ ':'')+'Dia '+t.day+' · '+t.label}catch(e){}return 'Bíblia em 1 ano'}
function extrasHTML(){
  return `<section class="iu-pan iu-extras"><div class="iu-ph">${ic('star',20)}<h2>Para a comunidade</h2></div><div class="iu-qg">${EXTRAS.map(([k,em,t,sub0,c1,c2])=>{const sub=sub0==='__PLAN__'?planSub():sub0;return `<button class="iu-q iu-ex" style="background:linear-gradient(135deg,${c1},${c2})" data-act="ex" data-ex="${k}"><span class="iu-em">${em}</span><span><b>${E(t)}</b><small>${E(sub)}</small></span></button>`}).join('')}</div></section>`;
}
function quickHTML(){
  const items=QUICK.filter(x=>x[5]===''||(x[5]==='sound'&&S.sound())||(x[5]==='assigned'&&S.assigned()));
  if(!items.length)return '';
  return `<section class="iu-pan iu-quick"><div class="iu-ph">${ic('bolt',20)}<h2>Acessos rápidos</h2></div><div class="iu-qg">${items.map(([go,icon,label,c1,c2])=>`<button class="iu-q" style="background:linear-gradient(135deg,${c1},${c2})" data-go="${E(go)}">${ic(icon,22)}<span>${E(label)}</span>${ic('chev',16)}</button>`).join('')}</div></section>`;
}
function bannerHTML(){
  const b=config.banner;
  const media=g(()=>homeCarouselMarkup())||'';
  return `<section class="iu-ban">${media?'':'<div class="iu-orb"></div>'}<div class="iu-ban-shade"></div>${S.manage()?'<button class="iu-edit" data-act="banner">✎ Editar banner</button>':''}<div class="in"><div class="iu-eb">${E(b.eyebrow)}</div><h1>${E(b.title[0])} <i>${E(b.title[1])}</i></h1><p>${E(b.verse)}</p><small>${E(b.ref)}</small><br><button class="iu-btn p" data-go="Cronograma">${ic('calendar',17)}${E(b.button)}${ic('chev',16)}</button></div>${media}</section>`;
}
api.home=function(){
  try{
    return `<div class="iu-home">${bannerHTML()}<div class="iu-rowwrap"><div class="iu-row" id="iu-cards">${cardsHTML()}</div><button class="iu-ib iu-arrow" data-act="cards-next" aria-label="Ver mais">${ic('chev',16)}</button></div><div class="iu-grid${S.sound()?'':' two'}${sched.expanded?' exp':''}">${scheduleHTML()}${S.sound()?`<section class="iu-pan" id="iu-proj">${projInner()}</section>`:''}${passageHTML()}</div>${rankHTML()}${extrasHTML()}</div>`;
  }catch(e){
    console.error('[IASD UI] falha na Home nova, voltando ao visual antigo',e);
    return api.fail(e);
  }
};

/* ---------- busca ---------- */
function runSearch(q){
  const box=$('iu-sr');if(!box)return;
  const v=fold(q.trim());
  if(!v){box.hidden=true;box.innerHTML='';return}
  const hits=searchable().filter(x=>fold(x.label).includes(v)).slice(0,7);
  box.innerHTML=hits.length?hits.map((x,i)=>`<button class="${i===0?'hl':''}" data-go="${E(x.id)}">${ic(x.icon,17)}${E(x.label)}</button>`).join(''):'<p>Nada encontrado.</p>';
  box.hidden=false;
}

/* ---------- montagem e atualização ---------- */
let mounted=false;
function mount(){
  if(mounted)return true;
  const side=document.createElement('aside');side.className='iu-side';side.id='iu-side';side.setAttribute('aria-label','Menu principal');
  const ov=document.createElement('div');ov.className='iu-ov';ov.id='iu-ov';
  const top=document.createElement('div');top.className='iu-top';top.id='iu-top';top.innerHTML=topHTML();
  const bn=document.createElement('nav');bn.className='iu-bn';bn.id='iu-bn';bn.setAttribute('aria-label','Navegação principal');
  const main=document.querySelector('body > main');
  document.body.insertBefore(side,document.body.firstChild);
  document.body.insertBefore(ov,document.body.firstChild);
  document.body.insertBefore(top,main||null);
  document.body.appendChild(bn);
  bind();
  mounted=true;
  return true;
}
function bind(){
  document.addEventListener('click',e=>{
    if(!api.enabled||!mounted)return;
    const goEl=e.target.closest('[data-go]');
    if(goEl&&goEl.closest('.iu-side,.iu-top,.iu-bn,.iu-home')){
      e.preventDefault();
      document.body.classList.remove('iu-open');
      const q=$('iu-q'),sr=$('iu-sr');if(sr){sr.hidden=true}if(q&&goEl.closest('.iu-sr'))q.value='';
      g(()=>go(goEl.dataset.go));
      return;
    }
    const act=e.target.closest('[data-act]');
    if(act&&act.closest('.iu-side,.iu-top,.iu-home,.iu-bn')){
      const a=act.dataset.act;
      if(a==='ex'){g(()=>window.IASDExtras.open(act.dataset.ex));return}
      if(a==='menu')document.body.classList.add('iu-open');
      else if(a==='back')g(()=>mobileGoBack());
      else if(a==='theme')g(()=>toggleTheme());
      else if(a==='vis'){g(()=>IASDPresence.setVisible(!IASDPresence.isVisible()));visIcon();updatePres()}
      else if(a==='pres-toggle'){g(()=>IASDPresence.setVisible(!!act.checked));visIcon()}
      else if(a==='account')g(()=>toggleAccountMenu());
      else if(a==='newtab'){document.body.classList.remove('iu-open');g(()=>newTab())}
      else if(a==='banner')g(()=>editHomeCarousel());
      else if(a==='cover')g(()=>editCover(act.dataset.slot));
      else if(a==='cards-next'){const r=$('iu-cards');if(r)r.scrollBy({left:Math.max(300,r.clientWidth*.72),behavior:'smooth'})}
      else if(a==='projtest')checkProjector();
      else if(a==='sched-toggle'){sched.expanded=!sched.expanded;updateSchedule()}
      else if(a==='signup')g(()=>openAuthModal(true));
      else if(a==='projpair')Promise.resolve(g(()=>pairCompanion())).then(()=>setTimeout(checkProjector,400));
      else if(a==='vshare'){g(()=>window.IASDVerseShare.open({text:passage.text,ref:passage.ref,link:true}))}
      else if(a==='passage'){
        g(()=>{readerState.book=passage.book;readerState.chapter=passage.chapter;window.__rdGoto={book:passage.book,chapter:Number(passage.chapter),from:Number(passage.verse)||1,to:0};saveReader()});
        g(()=>go('Bíblia'));
      }
      return;
    }
    if(e.target.id==='iu-ov')document.body.classList.remove('iu-open');
    if(!e.target.closest('.iu-search')){const sr=$('iu-sr');if(sr)sr.hidden=true}
  });
  document.addEventListener('input',e=>{if(e.target.id==='iu-q')runSearch(e.target.value)});
  document.addEventListener('keydown',e=>{
    if(!api.enabled||!mounted)return;
    if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();const q=$('iu-q');if(q){q.focus();q.select()}}
    if(e.key==='Escape'){const sr=$('iu-sr');if(sr)sr.hidden=true;document.body.classList.remove('iu-open')}
    if(e.key==='Enter'&&e.target.id==='iu-q'){const first=document.querySelector('#iu-sr button');if(first)first.click()}
  });
  new MutationObserver(themeIcon).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
}
function refresh(){
  const cur=S.cur();
  if(!S.sound()){proj.state='idle';proj.data=null}
  document.body.classList.toggle('iu-is-home',cur==='Painel');
  const side=$('iu-side');if(side)side.innerHTML=sideHTML();
  const bn=$('iu-bn');if(bn)bn.innerHTML=barHTML();
  const me=$('iu-me');if(me)me.innerHTML=accountHTML();
  const t=$('iu-title');if(t)t.textContent=titleOf(cur);
  const bell=$('iu-bell');if(bell)bell.hidden=!S.assigned();
  themeIcon();visIcon();
  g(()=>S.sound()?IASDPresence.ensure():IASDPresence.stop());
  if(cur==='Painel'&&S.sound()&&g(()=>companionToken)&&Date.now()-proj.checkedAt>20000&&!proj.busy)checkProjector();
}
api.afterRender=function(){
  if(!api.enabled)return;
  try{
    mount();
    refresh();
    document.body.classList.add('iu');   // só ativa o visual novo depois que tudo montou sem erro
  }catch(e){api.fail(e)}
};
api.fail=function(e){
  console.error('[IASD UI] desativado por erro:',e);
  api.enabled=false;
  document.body.classList.remove('iu','iu-open');
  ['iu-side','iu-ov','iu-top','iu-bn'].forEach(id=>{const el=$(id);if(el)el.remove()});
  mounted=false;
  setTimeout(()=>g(()=>render()),0);
  return '';
};
api.projState=()=>proj.state;
g(()=>IASDPresence.onChange(()=>{if(S.cur()==='Painel')updatePres()}));
api.passage=()=>passage;
window.IASDUI=api;
})();
