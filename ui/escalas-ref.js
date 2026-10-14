/* IASD APP — página Escalas (layout de referência).
   Só desenha: dados, permissões, criação, edição, exclusão, exportação e sincronização continuam em pages.js
   (ES, escList, escFiltered, escCan, esSet, esNav, esDay, esExport, esOpenAdd). */
(function(){
'use strict';

const P={
  sliders:'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  music:'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z',
  mic:'M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v3',
  book:'M2 4h7a3 3 0 013 3v14a2 2 0 00-2-2H2zM22 4h-7a3 3 0 00-3 3v14a2 2 0 012-2h8z',
  users:'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 4.500a4 4 0 010 7M22 21c0-3-2-5-4-5.500',
  monitor:'M3 4h18v12H3zM8 20h8M12 16v4',
  left:'M15 6l-6 6 6 6',
  right:'M9 6l6 6-6 6',
  download:'M12 3v12M7 10l5 5 5-5M4 20h16',
  plus:'M12 5v14M5 12h14',
  calendar:'M3 6.500A2.500 2.500 0 015.500 4h13A2.500 2.500 0 0121 6.500v12a2.500 2.500 0 01-2.500 2.500h-13A2.500 2.500 0 013 18.500zM3 10h18M8 2.500V6M16 2.500V6',
  chart:'M4 20V10M10 20V4M16 20v-8M22 20H2',
  clock:'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  star:'M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z'
};
const svg=(n,s=20,sw=1.8)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]||P.star}"/></svg>`;
const AREA_ICON={'sonoplastia':'sliders','regência':'music','regencia':'music','pregação':'mic','pregacao':'mic','escola sabatina':'book','recepção':'users','recepcao':'users','projeção':'monitor','projecao':'monitor'};
const areaIcon=a=>AREA_ICON[String(a||'').toLowerCase()]||'users';
const AREA_TONE={'sonoplastia':'#6a4cff','regência':'#26b673','regencia':'#26b673','pregação':'#f0a21a','pregacao':'#f0a21a','escola sabatina':'#ef5f6a','recepção':'#9b6bff','recepcao':'#9b6bff','projeção':'#d94fd2','projecao':'#d94fd2'};
const tone=a=>AREA_TONE[String(a||'').toLowerCase()]||'#7a80b8';

/* cor estável por pessoa (mesmo nome, mesma cor) */
const TAGS=[['#ece6ff','#4a37b8'],['#ffe1f0','#a5236b'],['#dcedff','#1f5da8'],['#d9f7e8','#17744a'],['#fff0c9','#8a5a00'],['#ffdfe7','#a32550'],['#ffe5d1','#9a4a12'],['#d8f4f7','#136c78']];
function tagOf(name){let h=0;const s=String(name||'').trim().toLowerCase();for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return TAGS[h%TAGS.length]}

let B=null;
const E=s=>B.esc(s);
const pad=n=>String(n).padStart(2,'0');

function art(){
  return `<svg class="esr-art" viewBox="0 0 360 200" aria-hidden="true" focusable="false"><defs>
<linearGradient id="esrc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9e4ff"/><stop offset="1" stop-color="#bdb0ff"/></linearGradient>
<linearGradient id="esrp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9a8ff"/><stop offset="1" stop-color="#8a77f0"/></linearGradient>
<radialGradient id="esrg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8f7bff" stop-opacity=".55"/><stop offset="1" stop-color="#8f7bff" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="190" cy="110" rx="170" ry="80" fill="url(#esrg)"/>
<g transform="translate(40 18) rotate(-9 100 80)"><rect x="0" y="14" width="190" height="150" rx="22" fill="url(#esrc)" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>
<rect x="0" y="14" width="190" height="34" rx="22" fill="#fff" fill-opacity=".55"/><rect x="26" y="0" width="12" height="30" rx="6" fill="#d6cdff"/><rect x="74" y="0" width="12" height="30" rx="6" fill="#d6cdff"/><rect x="122" y="0" width="12" height="30" rx="6" fill="#d6cdff"/><rect x="164" y="0" width="12" height="30" rx="6" fill="#d6cdff"/>
${Array.from({length:12},(_,i)=>`<rect x="${18+(i%4)*42}" y="${62+Math.floor(i/4)*32}" width="32" height="22" rx="7" fill="#fff" fill-opacity="${i===5?'.95':'.55'}"/>`).join('')}</g>
<g><circle cx="262" cy="86" r="20" fill="url(#esrp)"/><path d="M226 168c0-26 14-42 36-42s36 16 36 42z" fill="url(#esrp)"/>
<circle cx="316" cy="104" r="14" fill="#a897f5" opacity=".9"/><path d="M290 168c0-20 10-32 26-32s26 12 26 32z" fill="#a897f5" opacity=".9"/>
<circle cx="214" cy="106" r="14" fill="#c2b6ff" opacity=".95"/><path d="M190 168c0-19 9-31 24-31s24 12 24 31z" fill="#c2b6ff" opacity=".95"/></g></svg>`;
}

function hero(bridge){
  B=bridge;
  const canAdd=B.escCan('add');
  return `<div class="esr-hero"><div class="esr-hero-t"><span class="esr-kick">EQUIPES DO MÊS</span><h1>Escalas</h1><p>Organize equipes e acompanhe os próximos compromissos.</p></div>${art()}<div class="esr-acts"><button type="button" class="esr-btn ghost" onclick="IASDPages.esExport()">${svg('download',18)}Exportar CSV</button>${canAdd?`<button type="button" class="esr-btn" onclick="IASDPages.esOpenAdd()">${svg('plus',18,2.2)}Adicionar escalado</button>`:''}</div></div>`;
}

function body(bridge){
  B=bridge;
  const ES=B.ES,all=B.escList(),list=B.escFiltered(all),today=B.todayD(),todayIso=B.isoOf(today);
  const inMonth=e=>e.date.getMonth()===ES.m&&e.date.getFullYear()===ES.y;
  const extra=[...new Set(all.map(e=>e.area).filter(a=>!B.AREAS.some(x=>x[0].toLowerCase()===a.toLowerCase())))];
  const areas=[...B.AREAS.map(a=>a[0]),...extra];
  const monthAll=all.filter(inMonth).length;
  const card=(label,n,icon,on,key,unit)=>`<button type="button" class="esr-f${on?' on':''}" style="--t:${key==='all'?'#6a4cff':tone(label)}" aria-pressed="${on}" onclick="IASDPages.esSet('area',${B.jq(key==='all'?'all':label)})"><span class="esr-f-i">${svg(icon,22,1.7)}</span><span class="esr-f-t"><b>${E(label)}</b><small>${unit?n+' escalado'+(n===1?'':'s'):n}</small></span></button>`;
  const filters=`<nav class="esr-filters" aria-label="Filtrar por categoria">${card('Todas',monthAll,'sliders',ES.area==='all','all',false)}${areas.map(a=>{const n=all.filter(e=>e.area.toLowerCase()===a.toLowerCase()&&inMonth(e)).length;return card(a,n,areaIcon(a),ES.area.toLowerCase()===a.toLowerCase(),a,true)}).join('')}</nav>`;

  /* calendário */
  const first=new Date(ES.y,ES.m,1),start=new Date(ES.y,ES.m,1-first.getDay()),weeks=Math.ceil((first.getDay()+new Date(ES.y,ES.m+1,0).getDate())/7);
  let cells='';
  for(let k=0;k<weeks*7;k++){
    const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+k),iso=B.isoOf(d),out=d.getMonth()!==ES.m,es=list.filter(e=>B.isoOf(e.date)===iso).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
    const names=[...new Map(es.map(e=>[e.name.trim().toLowerCase(),e.name.trim()])).values()];
    const show=names.slice(0,3),more=names.length-show.length;
    const isToday=iso===todayIso;
    cells+=`<div class="esr-d${out?' out':''}${es.length?' has':''}${isToday?' today':''}" role="button" tabindex="0" data-d="${iso}" aria-label="${E(d.getDate()+' de '+B.MESES[d.getMonth()]+(es.length?': '+names.join(', '):''))}" onclick="IASDPages.esDay('${iso}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();IASDPages.esDay('${iso}')}"><span class="esr-n">${d.getDate()}</span>${isToday?'<em class="esr-hoje">HOJE</em>':''}<div class="esr-tags">${show.map(n=>{const [bg,fg]=tagOf(n);return `<span class="esr-tag" style="--bg:${bg};--fg:${fg}" title="${E(n)}">${E(n)}</span>`}).join('')}${more>0?`<span class="esr-more">+${more}</span>`:''}</div></div>`;
  }
  const cal=`<section class="esr-card esr-calc" aria-label="Calendário de escalas"><div class="esr-ch"><button type="button" class="esr-nav" onclick="IASDPages.esNav(-1)" aria-label="Mês anterior">${svg('left',20,2)}</button><div class="esr-mt"><b>${E(B.MESES[ES.m])}</b><small>${ES.y}</small></div><button type="button" class="esr-nav" onclick="IASDPages.esNav(1)" aria-label="Próximo mês">${svg('right',20,2)}</button></div><div class="esr-grid" role="group" aria-label="${E(B.MESES[ES.m]+' de '+ES.y)}">${B.DOW.map(d=>`<div class="esr-w">${d.toUpperCase()}</div>`).join('')}${cells}</div></section>`;

  /* estatísticas (sem nomes) */
  const inM=list.filter(inMonth);
  const people=new Set(inM.map(e=>e.name.trim().toLowerCase()));
  const days=new Set(inM.map(e=>B.isoOf(e.date)));
  const upcoming=list.filter(e=>e.date>=today).length;
  const todayN=list.filter(e=>B.isoOf(e.date)===todayIso).length;
  const row=(ic,l,v)=>`<div class="esr-s"><span class="esr-s-i">${svg(ic,22,1.6)}</span><span class="esr-s-l">${l}</span><b>${v}</b></div>`;
  const stats=`<aside class="esr-card esr-stats" aria-label="Estatísticas"><h3>${svg('chart',24,1.8)}Estatísticas — ${E(ES.area==='all'?'Todas':ES.area)}</h3>${row('calendar','Total de escalas',inM.length)}${row('users','Escalados no mês',people.size)}${row('clock','Compromissos próximos',upcoming)}${row('star','Dias com escala',days.size)}${row('calendar','Escalas hoje',todayN)}</aside>`;
  return filters+`<div class="esr-main">${cal}${stats}</div>`;
}

window.IASDEscalasRef={hero,body};
})();
