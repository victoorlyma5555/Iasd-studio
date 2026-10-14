/* IASD APP — Home do usuário logado (layout de referência aprovado).
   Só desenha e liga os botões às funções que já existem (go, IASDExtras, IASDVerseShare, editCover...).
   Usa o estado do app pela ponte window.IASDUI.bridge(). Se algo falhar, shell.js volta para a Home anterior. */
(function(){
'use strict';

const I={
  search:'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  bell:'M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  down:'M6 9l6 6 6-6',
  arrow:'M5 12h14M13 6l6 6-6 6',
  calendar:'M3 6.5A2.5 2.5 0 015.5 4h13A2.5 2.5 0 0121 6.5v12a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 18.5zM3 10h18M8 2.5V6M16 2.5V6',
  calgrid:'M3 6.5A2.5 2.5 0 015.5 4h13A2.5 2.5 0 0121 6.5v12a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 18.5zM3 10h18M8 2.5V6M16 2.5V6M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01',
  book:'M2 4.5h6.5A3.5 3.5 0 0112 8v13a2.5 2.5 0 00-2.5-2.5H2zM22 4.5h-6.5A3.5 3.5 0 0012 8v13a2.5 2.5 0 012.5-2.5H22z',
  lesson:'M6 3h11a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V4a1 1 0 011-1zM5 17a2 2 0 012-2h12M9 7h6M9 10.5h4',
  music:'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',
  users:'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 4.5a4 4 0 010 7M22 21c0-3-2-5-4-5.5',
  gift:'M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9C9 9 7.5 5.5 9.5 4.3S13.5 6.5 12 9zM12 9c3 0 4.5-3.500 2.500-4.700S10.500 6.500 12 9z',
  grid:'M4 4h6.5v6.500H4zM13.500 4H20v6.500h-6.500zM4 13.500h6.500V20H4zM13.500 13.500H20V20h-6.500z',
  file:'M6 3h8.500L19 7.500V21H6zM14 3v5h5M9 13h6M9 17h6',
  sliders:'M5 3v8M5 15v6M12 3v3M12 10v11M19 3v11M19 18v3M2.500 11h5M9.500 6h5M16.500 14h5',
  clock:'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  trophy:'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',
  heart:'M12 20.500C6 16.500 3 13.500 3 9.800 3 7.500 4.800 6 7 6c2 0 3.500 1.200 5 3 1.500-1.800 3-3 5-3 2.200 0 4 1.500 4 3.800 0 3.700-3 6.700-9 10.700z',
  confetti:'M4 21l4.500-12.500L16 16zM14 4v3M19 9h3M17 12.500l3-2.500M12 8l1.500-1.500',
  user:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3-6 8-6s8 2 8 6',
  more:'M5 12h.01M12 12h.01M19 12h.01',
  image:'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M9 9.500h.01',
  play:'M7 4l13 8-13 8z',
  star:'M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z'
};
const ICON_OF={home:'grid',book:'book',music:'music',game:'grid',film:'file',star:'gift',monitor:'sliders',dice:'grid',calendar:'calgrid',users:'users',bell:'bell'};
const svg=(n,s=20,sw=1.7)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${I[n]||I.star}"/></svg>`;

let B=null;                       /* ponte com o shell */
const g=fn=>{try{return fn()}catch(e){return undefined}};
const E=s=>B.E(s);
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const isoToday=()=>new Date().toLocaleDateString('en-CA');
const cap=s=>s.charAt(0).toLocaleUpperCase('pt-BR')+s.slice(1);
const hm=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(t||''));return m?(+m[1])+'h'+m[2]:String(t||'')};
const church=()=>String(g(()=>myProfile.church_name)||'IASD - Caldas do Jorro').replace(/^IASD\s*[-–]\s*/i,'IASD ');
function dateOf(iso){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||''));return m?new Date(+m[1],+m[2]-1,+m[3]):null}
function dayLabel(iso){
  const d=dateOf(iso);if(!d)return '';
  if(iso===isoToday())return 'Hoje';
  const t=new Date();t.setDate(t.getDate()+1);
  if(iso===t.toLocaleDateString('en-CA'))return 'Amanhã';
  return cap(new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(d))+', '+new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'short'}).format(d).replace('.','');
}
function items(sc){return B.parseItems(sc&&sc.items)}
function firstTime(sc){const r=items(sc).find(x=>/^\d{1,2}:\d{2}$/.test(x.time));return r?r.time:''}
function upcoming(){
  const t=isoToday();
  return (B.S.schedules()||[]).filter(x=>x.date&&x.date>=t).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
}

/* ---------- minha escala (data.escalas: "data — nome — área — hora") ---------- */
function myNextScale(){
  const list=g(()=>data.escalas);if(!Array.isArray(list))return null;
  const prof=g(()=>myProfile)||{},u=B.S.user()||{};
  const me=fold(prof.full_name||(u.user_metadata&&u.user_metadata.full_name)||'');
  if(!me)return null;
  const today=isoToday(),out=[];
  list.forEach(raw=>{
    const parts=String(raw).split(/\s+[—–-]\s+/).map(x=>x.trim());
    let iso='';const m=(parts[0]||'').match(/(\d{4})-(\d{2})-(\d{2})/);
    if(m)iso=m[0];else{const b=(parts[0]||'').match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);if(b){let y=b[3]?+b[3]:new Date().getFullYear();if(y<100)y+=2000;iso=y+'-'+String(+b[2]).padStart(2,'0')+'-'+String(+b[1]).padStart(2,'0')}}
    if(!iso||iso<today)return;
    const rest=parts.slice(1);let time='';
    const rows=rest.filter(x=>{const t=x.match(/^(\d{1,2}:\d{2})$/);if(t){time=t[1];return false}return true});
    const name=fold(rows[0]||'');
    if(name&&(name===me||(name.includes(' ')&&me.startsWith(name))))out.push({iso,time,area:rows[1]||'Escala'});
  });
  out.sort((a,b)=>a.iso<b.iso?-1:a.iso>b.iso?1:0);
  return out[0]||null;
}

/* ---------- blocos ---------- */
function headerHTML(active){
  active=active||'Painel';
  const user=B.S.user(),prof=g(()=>myProfile)||null;
  const name=B.auName()||'Conta';
  let av=`<span class="hm-av">${svg('user',18)}</span>`;
  if(prof&&prof.avatar_path){const src=g(()=>profileMediaUrl(prof.avatar_path));const st=g(()=>profileImageStyle('avatar'))||'';if(src)av=`<span class="hm-av"><img src="${E(src)}" alt="" style="${E(st)}"></span>`}
  else if(name)av=`<span class="hm-av">${E(name.slice(0,1).toUpperCase())}</span>`;
  const sched=B.S.viewSchedules();
  const T=B.topLinks?B.topLinks():{inline:[],more:[],members:[]};
  const cur=id=>active===id?' class="on" aria-current="page"':'';
  const lnk=x=>`<button type="button" class="hm-in${active===x.id?' on':''}"${active===x.id?' aria-current="page"':''} data-go="${E(x.id)}">${E(x.label)}</button>`;
  const row=x=>`<button type="button" role="menuitem" data-go="${E(x.id)}">${svg(ICON_OF[x.icon]||'grid',17)}<span>${E(x.label)}</span></button>`;
  const moreMenu=`<div class="hm-menu hm-more-menu" role="menu" aria-label="Mais abas" hidden>${T.more.map(row).join('')}${T.members.length?'<div class="hm-menu-sec">Área de membros</div>'+T.members.map(row).join(''):''}</div>`;
  const nav=T.inline.map(lnk).join('')+`<span class="hm-morew"><button type="button" class="hm-more" data-hm="more" aria-haspopup="menu" aria-expanded="false">Mais${svg('down',15,2)}</button>${moreMenu}</span>`;
  const bell=B.S.assigned()?`<button type="button" class="hm-bell" data-go="Alertas" aria-label="Notificações e alertas">${svg('bell',20)}</button><i class="hm-sep" aria-hidden="true"></i>`:'';
  return `<header class="hm-nav"><button type="button" class="hm-brand" data-go="Painel" aria-label="IASD APP, ir para o início"><img src="/iasd-app-logo.png?v=1" alt=""><b>IASD APP</b></button><nav class="hm-links" aria-label="Navegação principal">${nav}</nav><div class="hm-me">${bell}<button type="button" class="hm-prof" data-hm="menu" aria-haspopup="menu" aria-expanded="false" aria-controls="hm-menu">${av}<span class="hm-pname">${E(name)}</span>${svg('down',15,2)}</button>${menuHTML()}</div></header>`;
}
function menuHTML(){
  const S=B.S;const rows=[];
  const add=(id,label,icon)=>rows.push(`<button type="button" role="menuitem" data-go="${E(id)}">${svg(icon||'grid',17)}<span>${E(label)}</span></button>`);
  const act=(a,label,icon)=>rows.push(`<button type="button" role="menuitem" data-act="${a}">${svg(icon||'grid',17)}<span>${E(label)}</span></button>`);
  add('Perfil','Meu perfil','user');
  if(S.viewSchedules())add('Cronograma','Cronogramas','calgrid');
  add('Escalas','Escalas','users');
  add('Sonoplastia','IASD Studio','sliders');
  add('Hinário','Hinário','music');
  add('Bíblia','Bíblia','book');
  add('Lição da Escola Sabatina','Lição Sabática','lesson');
  add('Palavra em Cena','Jogral (Palavra em Cena)','file');
  add('Jogo','Jogos','grid');
  add('Datas especiais','Datas especiais','gift');
  (B.S.tabs()||[]).forEach(t=>add('custom:'+t.id,t.title||'Aba','star'));
  if(S.alerts())add('Alertas','Alertar sonoplastia','bell');
  if(S.study())add('Estudo','Sala de Estudo','book');
  if(S.sound()){add('Sorteadores','Sorteadores','grid');add('Mídia','Mídia e músicas','music')}
  const adm=[];
  const aadd=(id,label,icon)=>adm.push(`<button type="button" role="menuitem" data-go="${E(id)}">${svg(icon,17)}<span>${E(label)}</span></button>`);
  if(g(()=>canAdminProjector()))aadd('Painel Sonoplastia','Administração do Studio','sliders');
  if(S.give())aadd('Cargos','Cargos e acessos','users');
  if(S.founder())aadd('Fundador','Painel do Fundador','star');
  if(S.manage()){aadd('Acervo','Acervo do site','image');adm.push(`<button type="button" role="menuitem" data-act="landing-editor">${svg('image',17)}<span>Editar página de entrada</span></button><button type="button" role="menuitem" data-act="newtab">${svg('star',17)}<span>Criar aba</span></button>`)}
  return `<div class="hm-menu" id="hm-menu" role="menu" aria-label="Menu da conta" hidden>${rows.join('')}${adm.length?'<div class="hm-menu-sec">Administração</div>'+adm.join(''):''}<div class="hm-menu-sec"></div><button type="button" role="menuitem" class="hm-out" data-hm="logout">${svg('arrow',17)}<span>Sair da conta</span></button></div>`;
}
function greetingHTML(){
  const n=B.auName();
  return `<section class="hm-greet" aria-label="Boas-vindas"><div><h1>${E(B.auGreeting())}${n?', '+E(n):''}.</h1><p>Sua igreja mais perto, todos os dias.</p></div><div class="hm-search" role="search"><span class="hm-s-ic">${svg('search',20)}</span><input id="hm-q" type="search" placeholder="Buscar na Bíblia, no hinário e nos recursos..." aria-label="Buscar na Bíblia, no hinário e nos recursos" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="hm-sr"><div class="hm-sr" id="hm-sr" role="listbox" hidden></div></div></section>`;
}
function bannerHTML(){
  const list=g(()=>homeBannerItems())||[];
  const url=list.length?g(()=>imageUrl(list[0].path)):'';
  const up=upcoming(),ev=up[0];
  const canEdit=B.S.manage();
  let evHTML;
  if(ev){
    const t=firstTime(ev),sub=[dayLabel(ev.date),t?hm(t):''].filter(Boolean).join(' · ');
    evHTML=`<div class="hm-ev"><span class="hm-ev-ic">${svg('calendar',24,1.6)}</span><div><b>${E(ev.name)}</b><small>${E(sub)}</small></div></div>`;
  }else evHTML=`<div class="hm-ev"><span class="hm-ev-ic">${svg('calendar',24,1.6)}</span><div><b>Nenhuma programação próxima</b><small>Quando houver eventos cadastrados, eles aparecem aqui.</small></div></div>`;
  const btn=B.S.viewSchedules()?`<button type="button" class="hm-btn" data-go="Cronograma">Ver programação${svg('arrow',18,2)}</button>`:'';
  const edit=canEdit?`<div class="hm-adm"><button type="button" class="hm-dots" data-hm="adm" aria-haspopup="true" aria-expanded="false" aria-label="Opções do banner">${svg('more',18,2.4)}</button><div class="hm-adm-menu" hidden><button type="button" data-act="banner">Editar fotos do banner</button></div></div>`:'';
  return `<section class="hm-card hm-banner" aria-labelledby="hm-ban-t">${url?`<img class="hm-ban-img" src="${E(url)}" alt="" width="640" height="360" fetchpriority="high">`:''}<div class="hm-ban-fade" aria-hidden="true"></div><span class="hm-wave w1" aria-hidden="true"></span><span class="hm-wave w2" aria-hidden="true"></span>${edit}<div class="hm-ban-in"><span class="hm-kick">${E(church().toUpperCase().replace(/^IASD\s+/,''))}</span><h2 id="hm-ban-t">Sua semana<br>na igreja</h2>${evHTML}${btn}</div></section>`;
}
function passageHTML(){
  const p=B.passage,url=B.imageOf('home_passage');
  const edit=B.S.manage()?`<div class="hm-adm"><button type="button" class="hm-dots" data-hm="adm" aria-haspopup="true" aria-expanded="false" aria-label="Opções da Palavra do Dia">${svg('more',18,2.4)}</button><div class="hm-adm-menu" hidden><button type="button" data-act="cover" data-slot="home_passage">Editar imagem</button></div></div>`:'';
  const text=String(p.text||'').replace(/^“|”$/g,'');
  const ref=String(p.ref||'').replace(/\s*\(NVI\)\s*$/,'');
  return `<section class="hm-card hm-passage" id="hm-passage" aria-labelledby="hm-pas-t"><div class="hm-pas-img${url?'':' none'}" aria-hidden="true">${url?`<img src="${E(url)}" alt="" width="400" height="200" loading="lazy">`:''}</div>${edit}<div class="hm-pas-in"><span class="hm-kick">PALAVRA DO DIA</span><h2 id="hm-pas-t">${E(text)}</h2><small>${E(ref)}</small><hr><div class="hm-pas-acts"><button type="button" class="hm-btn ghost" data-act="passage">${svg('book',18)}Ler na Bíblia</button><button type="button" class="hm-btn ghost icon" data-hm="vdl" aria-label="Baixar imagem do versículo" title="Baixar imagem do versículo">${svg('arrow',18).replace('M5 12h14M13 6l6 6-6 6','M12 3v12M7 10l5 5 5-5M4 20h16')}</button></div><div class="hm-pas-more"><button type="button" data-go="Bíblia">Pesquisar na Bíblia</button><button type="button" data-act="vshare">Compartilhar</button></div></div></section>`;
}
const QUICK=[['Bíblia','book','Bíblia'],['Lição da Escola Sabatina','lesson','Lição Sabática'],['Hinário','music','Hinário'],['__members','users','Área de membros'],['Datas especiais','gift','Datas especiais'],['Jogo','grid','Jogos'],['Palavra em Cena','file','Jogral'],['Sonoplastia','sliders','Sonoplastia']];
function quickHTML(){
  const members=(B.topLinks?B.topLinks().members:[])[0];
  const items=QUICK.filter(([id])=>id!=='__members'||!!members);
  return `<section class="hm-sec" aria-labelledby="hm-q-t"><h2 class="hm-h" id="hm-q-t">Acessos rápidos</h2><div class="hm-quick" style="--n:${items.length}">${items.map(([id,ic,l],i)=>`<button type="button" class="hm-q${i===0?' first':''}" data-go="${E(id==='__members'?members.id:id)}">${svg(ic,26,1.5)}<span>${E(l)}</span></button>`).join('')}</div></section>`;
}
function myScaleHTML(){
  const s=myNextScale();
  let body;
  if(s){
    const d=dateOf(s.iso),mon=new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(d).replace('.','').toUpperCase();
    body=`<div class="hm-scale"><div class="hm-date"><small>${E(cap(new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(d).replace('.','')).toUpperCase())}</small><b>${d.getDate()}</b><small>${E(mon)}</small></div><div><b>${E(s.area)}</b><span>${E([dayLabel(s.iso),s.time?hm(s.time):''].filter(Boolean).join(' · '))}</span><span>${E(church())}</span></div></div>`;
  }else body=`<div class="hm-scale empty"><div><b>Você não tem escalas próximas</b><span>Quando você for escalado, a próxima escala aparece aqui.</span></div></div>`;
  return `<section class="hm-card hm-info" aria-labelledby="hm-esc-t"><header><span class="hm-ic">${svg('calendar',22)}</span><h2 id="hm-esc-t">Minha escala</h2><button type="button" class="hm-lnk" data-go="Escalas">Ver minhas escalas${svg('arrow',15,2)}</button></header>${body}</section>`;
}
function meetingsHTML(){
  const up=upcoming().slice(0,3);
  const rows=up.length?`<ol class="hm-tl">${up.map((x,i)=>{const t=firstTime(x);return `<li class="${i===0?'on':''}"><b>${E(x.name)}</b><span>${E([dayLabel(x.date),t?hm(t):''].filter(Boolean).join(' · '))}</span><em>${E(church())}</em></li>`}).join('')}</ol>`:`<p class="hm-empty">Nenhum encontro programado por enquanto.</p>`;
  return `<section class="hm-card hm-info" aria-labelledby="hm-enc-t"><header><span class="hm-ic">${svg('calendar',22)}</span><h2 id="hm-enc-t">Próximos encontros</h2>${B.S.viewSchedules()?`<button type="button" class="hm-lnk" data-go="Cronograma">Ver programação${svg('arrow',15,2)}</button>`:''}</header>${rows}</section>`;
}
function studyHTML(){
  const rs=g(()=>readerState)||null;
  let saved=false;try{saved=!!localStorage.getItem(g(()=>READER_KEY))}catch(e){}
  const name=rs&&saved?(g(()=>bibleBooks.find(x=>x[1]===rs.book))||[])[0]:'';
  const bible=name?`<button type="button" class="hm-st" data-act="resume"><span class="hm-thumb b">${svg('book',26,1.5)}</span><span><small>CONTINUAR LENDO</small><b>${E(name)} ${E(rs.chapter)}</b><em>Última leitura neste aparelho</em></span></button>`:`<button type="button" class="hm-st" data-go="Bíblia"><span class="hm-thumb b">${svg('book',26,1.5)}</span><span><small>BÍBLIA</small><b>Comece a ler</b><em>Escolha um livro e um capítulo</em></span></button>`;
  const lesson=`<button type="button" class="hm-st" data-go="Lição da Escola Sabatina"><span class="hm-thumb l">${svg('lesson',26,1.5)}</span><span><small>LIÇÃO DESTA SEMANA</small><b>Lição Sabática</b><em>Abrir a lição</em></span>${svg('arrow',16,2)}</button>`;
  return `<section class="hm-card hm-info" aria-labelledby="hm-est-t"><header><span class="hm-ic">${svg('book',22)}</span><h2 id="hm-est-t">Continue seu estudo</h2><button type="button" class="hm-lnk" data-go="Bíblia">Abrir a Bíblia${svg('arrow',15,2)}</button></header><div class="hm-sts">${bible}${lesson}</div></section>`;
}
function arenaHTML(){
  const ctrl=`<svg class="hm-ctrl" viewBox="0 0 200 150" aria-hidden="true"><defs><linearGradient id="hmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6bff"/><stop offset="1" stop-color="#4a22e8"/></linearGradient></defs><ellipse cx="104" cy="128" rx="64" ry="9" fill="#6230ff" opacity=".14"/><path d="M52 44h96c18 0 30 12 34 34l8 40c3 16-14 24-26 12l-18-20H70l-18 20c-12 12-29 4-26-12l8-40c4-22 16-34 34-34z" fill="url(#hmg)"/><path d="M52 44h96c18 0 30 12 34 34" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/><rect x="62" y="64" width="26" height="8" rx="4" fill="#fff" opacity=".9"/><rect x="71" y="55" width="8" height="26" rx="4" fill="#fff" opacity=".9"/><circle cx="132" cy="62" r="6" fill="#fff" opacity=".9"/><circle cx="148" cy="74" r="6" fill="#fff" opacity=".9"/><circle cx="116" cy="74" r="6" fill="#fff" opacity=".55"/><circle cx="132" cy="86" r="6" fill="#fff" opacity=".55"/></svg>`;
  return `<section class="hm-card hm-arena" aria-labelledby="hm-ar-t"><span class="hm-orb o1" aria-hidden="true"></span><span class="hm-orb o2" aria-hidden="true"></span>${ctrl}<div class="hm-ar-in"><span class="hm-kick">JOGO COLETIVO</span><h2 id="hm-ar-t">Arena<br>da turma</h2><p>Crie uma sala e jogue com a comunidade.</p><ul class="hm-chips" aria-label="Modos de jogo"><li>Quiz</li><li>Verdadeiro ou falso</li><li>Travessia</li><li>Aposta</li><li>Votação</li></ul><button type="button" class="hm-btn block" data-go="Jogo">Abrir jogos${svg('arrow',18,2)}</button></div></section>`;
}
function todayHTML(){
  const today=isoToday(),sc=(B.S.schedules()||[]).find(x=>x.date===today)||null;
  const label=cap(new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(new Date()));
  let body;
  if(!sc)body=`<p class="hm-empty big">Nenhuma programação para hoje.<small>Quando houver atividades cadastradas, elas aparecerão aqui.</small></p>`;
  else{
    const rows=items(sc);const now=new Date(),cur=now.getHours()*60+now.getMinutes();
    let idx=-1;rows.forEach((a,i)=>{const m=/^(\d{1,2}):(\d{2})$/.exec(a.time);if(m&&(+m[1])*60+(+m[2])<=cur)idx=i});
    let start=Math.max(0,idx<0?0:idx);if(start+3>rows.length)start=Math.max(0,rows.length-3);
    body=`<ol class="hm-day">${rows.slice(start,start+3).map((a,k)=>`<li class="${start+k===(idx<0?0:idx)?'on':''}"><time>${E(/^\d{1,2}:\d{2}$/.test(a.time)?hm(a.time):'')}</time><i aria-hidden="true"></i><div><b>${E(a.title)}</b><span>${E(a.person||church())}</span></div></li>`).join('')}</ol>`;
  }
  return `<section class="hm-card hm-today" aria-labelledby="hm-hoje-t"><header><span class="hm-ic">${svg('calendar',22)}</span><h2 id="hm-hoje-t">Cronograma de hoje</h2><time>${E(label)}</time></header>${body}<button type="button" class="hm-btn outline block" data-go="Cronograma">${svg('calendar',17)}Ver cronograma completo${svg('arrow',17,2)}</button></section>`;
}
function communityHTML(){
  const plan=g(()=>window.IASDExtras&&IASDExtras.planToday());
  const planSub=plan?`Dia ${plan.day} · ${plan.label}`:'Comece seu plano de leitura';
  const c=[['plan','book','Plano de leitura',planSub],['remind','bell','Lembrete diário','Versículo do dia'],['prayer','heart','Pedidos de oração','Orar uns pelos outros'],['cards','confetti','Cartão de parabéns','Aniversários e datas'],['champ','trophy','Campeões','Pódio do Domingo Jovem']];
  return `<section class="hm-sec" id="hm-community" tabindex="-1" aria-labelledby="hm-c-t"><h2 class="hm-h" id="hm-c-t">Para a comunidade</h2><div class="hm-comm">${c.map(([k,ic,t,s])=>`<button type="button" class="hm-cc" data-act="ex" data-ex="${k}"><span class="hm-cc-i">${svg(ic,30,1.4)}</span><span><b>${E(t)}</b><small>${E(s)}</small></span></button>`).join('')}</div></section>`;
}
function studioHTML(){
  return `<section class="hm-card hm-studio" aria-labelledby="hm-stu-t"><span class="hm-orb o3" aria-hidden="true"></span><div class="hm-stu-in"><span class="hm-kick">SONOPLASTIA E PROJEÇÃO</span><h2 id="hm-stu-t">Cada momento do culto,<br>bem preparado.</h2><p>Conheça o IASD Studio: músicas, Bíblia, sorteios e cronômetro em uma central para a sua igreja.</p><ul class="hm-pills"><li>Studio WEB</li><li>Studio PC: Windows</li></ul><button type="button" class="hm-btn block" data-go="Sonoplastia" aria-describedby="hm-stu-n">Conhecer IASD Studio${svg('arrow',18,2)}</button><small id="hm-stu-n">Escolha a versão WEB ou baixe o aplicativo para Windows.</small></div><div class="hm-stu-vis"><div class="hm-mon"><img src="/shots/studio-entry/pc.png" loading="lazy" width="1280" height="800" alt="IASD Studio com prévia de projeção e ferramentas para o culto"></div><div class="hm-mon-base" aria-hidden="true"></div></div></section>`;
}
function footerHTML(){
  const L=(id,t)=>`<li><button type="button" data-go="${E(id)}">${E(t)}</button></li>`,X=(k,t)=>`<li><button type="button" data-act="ex" data-ex="${k}">${E(t)}</button></li>`;
  return `<footer class="hm-foot"><div class="hm-foot-brand"><img src="/iasd-app-logo.png?v=1" alt=""><div><b>IASD APP</b><small>Comunidade e serviço</small></div></div><nav class="hm-foot-cols" aria-label="Rodapé"><div><h3>Recursos</h3><ul>${L('Bíblia','Bíblia')}${L('Hinário','Hinário')}${L('Lição da Escola Sabatina','Lição Sabática')}</ul></div><div><h3>Comunidade</h3><ul>${X('prayer','Pedidos de oração')}${X('cards','Cartão de parabéns')}${X('champ','Campeões')}</ul></div><div><h3>Ajuda</h3><ul><li><a href="/privacidade">Privacidade</a></li><li><a href="/termos">Termos de uso</a></li></ul></div></nav><p class="hm-copy">© ${new Date().getFullYear()} IASD APP. Todos os direitos reservados.</p></footer>`;
}

/* uma falha em um bloco não derruba a Home */
function safe(fn,name){try{return fn()}catch(e){console.error('[Home] bloco '+name+' falhou',e);return ''}}

function html(bridge){
  B=bridge;
  try{B.loadPassage().then(()=>update())}catch(e){}
  return `<div class="iu-home hm"><div class="hm-bg" aria-hidden="true"><i class="a"></i><i class="b"></i></div><div class="hm-wrap">${safe(headerHTML,'cabeçalho')}${safe(greetingHTML,'saudação')}<div class="hm-row r1">${safe(bannerHTML,'banner')}${safe(passageHTML,'palavra')}</div>${safe(quickHTML,'acessos')}<div class="hm-row r3">${safe(myScaleHTML,'escala')}${safe(meetingsHTML,'encontros')}${safe(studyHTML,'estudo')}</div><div class="hm-row r4">${safe(arenaHTML,'arena')}${safe(todayHTML,'hoje')}</div>${safe(communityHTML,'comunidade')}${safe(studioHTML,'studio')}${safe(footerHTML,'rodapé')}</div>${B.sideTabsHTML()}</div>`;
}
function update(){
  const el=document.getElementById('hm-passage');if(!el||!B)return;
  const t=document.createElement('div');t.innerHTML=safe(passageHTML,'palavra');
  if(t.firstElementChild)el.replaceWith(t.firstElementChild);
}

/* ---------- busca ---------- */
function searchResults(q){
  const v=fold(q);if(!v)return [];
  const out=[];
  B.searchable().filter(x=>fold(x.label).includes(v)).slice(0,5).forEach(x=>out.push({k:'go',id:x.id,label:x.label,sub:'Recurso'}));
  const m=/^(.*?)(?:\s+(\d{1,3}))?(?::(\d{1,3}))?$/.exec(q.trim());
  const bn=fold(m&&m[1]);
  if(bn.length>=2)(g(()=>bibleBooks)||[]).filter(b=>fold(b[0]).startsWith(bn)).slice(0,3).forEach(b=>out.push({k:'bible',book:b[1],chapter:m[2]?+m[2]:1,verse:m[3]?+m[3]:1,label:b[0]+(m[2]?' '+m[2]+(m[3]?':'+m[3]:''):''),sub:'Bíblia'}));
  const hin=g(()=>window.IASDHinario&&IASDHinario.search&&IASDHinario.search(q));
  if(Array.isArray(hin))hin.slice(0,4).forEach(h=>out.push({k:'hymn',n:h.n,label:String(h.n).padStart(3,'0')+' — '+h.t,sub:'Hinário'}));
  return out.slice(0,9);
}
function runSearch(input){
  const box=document.getElementById('hm-sr');if(!box)return;
  const res=searchResults(input.value);box._res=res;
  if(!res.length){box.hidden=!input.value.trim();box.innerHTML=input.value.trim()?'<p>Nada encontrado.</p>':'';input.setAttribute('aria-expanded',String(!box.hidden));return}
  box.innerHTML=res.map((r,i)=>`<button type="button" role="option" data-i="${i}"${i===0?' class="hl"':''}><b>${E(r.label)}</b><small>${E(r.sub)}</small></button>`).join('');
  box.hidden=false;input.setAttribute('aria-expanded','true');
}
function openResult(r){
  if(!r)return;
  if(r.k==='go')return g(()=>go(r.id));
  if(r.k==='bible'){g(()=>{readerState.book=r.book;readerState.chapter=r.chapter;window.__rdGoto={book:r.book,chapter:r.chapter,from:r.verse||1,to:0};saveReader()});return g(()=>go('Bíblia'))}
  if(r.k==='hymn'){g(()=>go('Hinário'));setTimeout(()=>g(()=>IASDHinario.open(r.n)),350)}
}
function closeSearch(){const b=document.getElementById('hm-sr'),i=document.getElementById('hm-q');if(b){b.hidden=true}if(i)i.setAttribute('aria-expanded','false')}
function closeMenus(except){
  document.querySelectorAll('.hm .hm-menu:not([hidden]),.hm .hm-adm-menu:not([hidden])').forEach(m=>{if(m!==except){m.hidden=true;const b=m.previousElementSibling;if(b&&b.setAttribute)b.setAttribute('aria-expanded','false')}});
}

let bound=false;
function bind(){
  if(bound)return;bound=true;
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='hm-q')runSearch(e.target)});
  document.addEventListener('keydown',e=>{
    const t=e.target;
    if(t&&t.id==='hm-q'){
      const box=document.getElementById('hm-sr');
      if(e.key==='Enter'&&box&&box._res&&box._res.length){e.preventDefault();openResult(box._res[0]);closeSearch()}
      if(e.key==='Escape')closeSearch();
    }
    if(e.key==='Escape')closeMenus();
  });
  document.addEventListener('click',e=>{
    const root=e.target.closest&&e.target.closest('.hm');
    if(!root){closeSearch();closeMenus();return}
    const opt=e.target.closest('#hm-sr [data-i]');
    if(opt){const box=document.getElementById('hm-sr');openResult(box._res&&box._res[+opt.dataset.i]);closeSearch();return}
    if(!e.target.closest('.hm-search'))closeSearch();
    const h=e.target.closest('[data-hm]');
    if(!h){closeMenus();return}
    const a=h.dataset.hm;
    if(a==='menu'||a==='adm'||a==='more'){
      const menu=h.nextElementSibling;if(!menu)return;
      const open=menu.hidden;closeMenus(open?menu:null);menu.hidden=!open;h.setAttribute('aria-expanded',String(open));
      if(open){const f=menu.querySelector('button');if(f&&a!=='adm')try{f.focus({preventScroll:true})}catch(x){}}
    }else if(a==='community'){const c=document.getElementById('hm-community');if(c){c.scrollIntoView({behavior:'smooth',block:'start'});try{c.focus({preventScroll:true})}catch(x){}}}
    else if(a==='vdl'){
      const p=B&&B.passage;if(!p)return;
      g(()=>window.IASDVerseShare.open({text:p.text,ref:p.ref,link:true}));
      setTimeout(()=>{const d=document.querySelector('[data-vs="dl"]');if(d)d.click()},450);
    }else if(a==='logout'){closeMenus();g(()=>cloudLogout())}
  });
  /* "Continuar lendo": abre o último livro/capítulo salvo */
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('.hm [data-act="resume"]');if(!b)return;
    const rs=g(()=>readerState);if(rs)g(()=>{window.__rdGoto={book:rs.book,chapter:Number(rs.chapter),from:1,to:0}});
    g(()=>go('Bíblia'));
  });
}
bind();

function chrome(bridge,active){B=bridge;return {header:safe(()=>headerHTML(active),'cabeçalho'),footer:safe(footerHTML,'rodapé')}}
function menu(bridge){B=bridge;return safe(menuHTML,'menu')}
window.IASDHomeRef={html,update,chrome,menu};
})();
