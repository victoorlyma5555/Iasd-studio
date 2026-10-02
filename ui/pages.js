/* IASD APP — novas telas: Alertas, Jogos, Bíblia, Cronogramas e Painel do Fundador.
   Só monta o HTML; toda a lógica (envio, jogos, leitor, cronogramas, contas) continua em app/main.js.
   Se este arquivo falhar ao carregar, o app usa as telas antigas. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jq=v=>esc(JSON.stringify(String(v)));/* literal JS seguro dentro de onclick="..." */
const P={
 bell:'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
 send:'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
 trash:'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
 refresh:'M21 12a9 9 0 01-15.5 6.3L3 16M3 12a9 9 0 0115.5-6.3L21 8M21 3v5h-5M3 21v-5h5',
 clock:'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
 users:'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM21 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
 bulb:'M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0012 2z',
 cal:'M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 10h18M8 2v4M16 2v4',
 plus:'M12 5v14M5 12h14',
 pen:'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
 more:'M12 5h.01M12 12h.01M12 19h.01',
 pad:'M6 12h4M8 10v4M15 13h.01M18 11h.01M17.3 5H6.7a4 4 0 00-3.9 3.2l-1.5 7A3 3 0 006.2 18l1.6-2h8.4l1.6 2a3 3 0 004.9-2.8l-1.5-7A4 4 0 0017.3 5z',
 trophy:'M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4M6 3h12v6a6 6 0 01-12 0zM12 15v4M8 21h8',
 chart:'M4 20V10M10 20V4M16 20v-8M22 20H2',
 search:'M21 21l-4.3-4.3M17 11a6 6 0 11-12 0 6 6 0 0112 0z',
 right:'M9 6l6 6-6 6',
 left:'M15 6l-6 6 6 6',
 book:'M2 4h6a4 4 0 014 4v13a3 3 0 00-3-3H2zM22 4h-6a4 4 0 00-4 4v13a3 3 0 013-3h7z',
 star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
 share:'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
 copy:'M9 9h11v11H9zM5 15H4V4h11v1',
 head:'M3 14v-2a9 9 0 0118 0v2M3 14h3a1 1 0 011 1v3a1 1 0 01-1 1H5a2 2 0 01-2-2zM21 14h-3a1 1 0 00-1 1v3a1 1 0 001 1h1a2 2 0 002-2z',
 pin:'M12 21s-7-6.2-7-12a7 7 0 1114 0c0 5.8-7 12-7 12zM12 11a2 2 0 100-4 2 2 0 000 4z',
 list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
 crown:'M2 18l2-11 5 5 3-7 3 7 5-5 2 11zM4 21h16',
 link:'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1',
 check:'M20 6L9 17l-5-5',
 img:'M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
 sort:'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',
 play:'M6 4l14 8-14 8z',
 doc:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h5',
 drag:'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
 msg:'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
 gear:'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
 music:'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z',
 medal:'M12 15a6 6 0 100-12 6 6 0 000 12zM8.2 13.9L7 22l5-3 5 3-1.2-8.1',
 mail:'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6',
 gift:'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z',
 upload:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
 folder:'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z',
 grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
 filter:'M3 4h18l-7 8.5V19l-4 2v-8.5z',
 video:'M23 7l-7 5 7 5zM1 5h15a2 2 0 012 2v10a2 2 0 01-2 2H1z',
 sliders:'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
 mic:'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8',
 screen:'M2 4h20v13H2zM8 21h8M12 17v4',
 download:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
 help:'M12 17h.01M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
};
const I=(n,c)=>'<svg class="pgi '+(c||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(P[n]||'')+'"/></svg>';

/* ---------- ilustrações dos banners (substituíveis por imagens no Acervo) ---------- */
const defs=(id,stops)=>'<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1">'+stops.map(([o,c])=>'<stop offset="'+o+'" stop-color="'+c+'"/>').join('')+'</linearGradient>';
const svg=(body)=>'<svg viewBox="0 0 640 260" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">'+body+'</svg>';
const ART={
 alertas:svg('<defs>'+defs('a1',[[0,'#0b1330'],[.6,'#241a4d'],[1,'#7a3b2e']])+'<radialGradient id="a2"><stop offset="0" stop-color="#ffb347" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient><linearGradient id="a3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a3c86"/><stop offset="1" stop-color="#0a1a4a"/></linearGradient></defs><rect width="640" height="260" fill="url(#a1)"/><g opacity=".85"><circle cx="90" cy="70" r="44" fill="url(#a2)"/><circle cx="220" cy="150" r="60" fill="url(#a2)" opacity=".5"/><circle cx="330" cy="60" r="26" fill="url(#a2)"/><circle cx="470" cy="200" r="50" fill="url(#a2)" opacity=".6"/></g><g fill="#0a0f24" opacity=".75"><rect x="40" y="110" width="8" height="150"/><rect x="150" y="90" width="8" height="170"/><rect x="300" y="100" width="8" height="160"/></g><g transform="rotate(-4 470 100)"><rect x="350" y="22" width="240" height="150" rx="6" fill="#050a1e" stroke="#9aa7c7" stroke-width="5"/><rect x="358" y="30" width="224" height="134" rx="3" fill="url(#a3)"/><path d="M470 56l24 42h-48z" fill="none" stroke="#9cc3ff" stroke-width="4" stroke-linejoin="round"/><path d="M470 70v14M470 91v2" stroke="#9cc3ff" stroke-width="4" stroke-linecap="round"/><text x="470" y="126" text-anchor="middle" font-family="Inter,sans-serif" font-size="15" font-weight="800" fill="#fff">AVISO</text><text x="470" y="144" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#cfe0ff">Mensagem do líder</text><rect x="455" y="172" width="30" height="10" fill="#2a2f45"/></g><rect y="200" width="640" height="60" fill="#0a0f24"/><g><rect x="250" y="205" width="390" height="40" rx="6" fill="#151b38"/><g fill="#ffb347"><circle cx="280" cy="216" r="3"/><circle cx="300" cy="216" r="3"/><circle cx="320" cy="216" r="3"/></g><g fill="#58a6ff"><circle cx="360" cy="216" r="3"/><circle cx="380" cy="216" r="3"/><circle cx="400" cy="216" r="3"/><circle cx="440" cy="216" r="3"/><circle cx="460" cy="216" r="3"/></g><g fill="#ff5d7a"><circle cx="500" cy="216" r="3"/><circle cx="520" cy="216" r="3"/></g><g stroke="#3b4570" stroke-width="2"><path d="M270 232h340M270 238h340"/></g></g>'),
 jogos:svg('<defs><radialGradient id="g1" cx=".7" cy=".3" r=".9"><stop offset="0" stop-color="#7a3bd1"/><stop offset=".5" stop-color="#241a66"/><stop offset="1" stop-color="#070b24"/></radialGradient><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#263a8f"/><stop offset="1" stop-color="#0b1340"/></linearGradient><radialGradient id="g3"><stop offset="0" stop-color="#ffb347" stop-opacity=".7"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><rect width="640" height="260" fill="url(#g1)"/><circle cx="540" cy="230" r="140" fill="url(#g3)"/><g fill="#fff"><circle cx="60" cy="40" r="1.5"/><circle cx="210" cy="30" r="1.2"/><circle cx="330" cy="70" r="1.6"/><circle cx="600" cy="30" r="1.4"/><circle cx="420" cy="20" r="1.2"/><circle cx="120" cy="120" r="1"/></g><g transform="translate(70 70)"><path d="M40 30h150c30 0 50 25 56 60l14 70c4 22-22 34-40 18l-30-28H60l-30 28c-18 16-44 4-40-18l14-70c6-35 26-60 56-60z" fill="url(#g2)" stroke="#6ea0ff" stroke-width="3"/><circle cx="75" cy="85" r="22" fill="#0a1140" stroke="#5a86e8" stroke-width="3"/><path d="M75 74v22M64 85h22" stroke="#8fb4ff" stroke-width="5" stroke-linecap="round"/><circle cx="190" cy="74" r="7" fill="#ffb347"/><circle cx="210" cy="92" r="7" fill="#58a6ff"/><circle cx="170" cy="92" r="7" fill="#ff5d7a"/><circle cx="190" cy="110" r="7" fill="#5fe0a0"/><path d="M130 60l12-20 12 20-7 6h-10z" fill="#7fb0ff"/></g><g transform="translate(225 28) rotate(-12)"><rect width="56" height="70" rx="6" fill="#d8892b" stroke="#ffd27a" stroke-width="3"/><path d="M28 16v38M16 28h24" stroke="#ffe9b3" stroke-width="5" stroke-linecap="round"/></g><circle cx="190" cy="44" r="26" fill="#3a1f8f" stroke="#a78bfa" stroke-width="3"/><text x="190" y="55" text-anchor="middle" font-family="Inter,sans-serif" font-size="32" font-weight="800" fill="#e9ddff">?</text><g transform="translate(318 14)"><path d="M0 40l8-28 14 14 14-20 14 20 14-14 8 28z" fill="#e8a21f" stroke="#ffd27a" stroke-width="3"/></g><g transform="translate(360 150)"><path d="M0 0h50v24c0 16-10 28-25 28S0 40 0 24z" fill="#e8a21f" stroke="#ffd27a" stroke-width="3"/><path d="M20 52h10v14H20zM10 66h30v8H10z" fill="#c4841a"/></g>'),
 biblia:svg('<defs>'+defs('b1',[[0,'#1d2b6b'],[.45,'#7a4a96'],[.75,'#f0935a'],[1,'#ffd08a']])+'<radialGradient id="b2"><stop offset="0" stop-color="#fff2c4"/><stop offset=".3" stop-color="#ffc974" stop-opacity=".8"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><rect width="640" height="260" fill="url(#b1)"/><circle cx="300" cy="160" r="170" fill="url(#b2)"/><g stroke="#ffe3a8" stroke-opacity=".35" stroke-width="2"><path d="M300 160L130 20M300 160L210 0M300 160L310 -10M300 160L410 0M300 160L500 40"/></g><path d="M0 200l90-60 70 40 90-70 100 70 90-50 110 70 90-40v130H0z" fill="#4b3a7a" opacity=".85"/><path d="M0 230l120-50 100 40 110-60 120 60 90-30 100 40v90H0z" fill="#1f2a5c"/><g transform="translate(210 140)"><path d="M0 40l90-14 90 14v30l-90-10-90 10z" fill="#f3e3bd" stroke="#8a6a3a" stroke-width="2"/><path d="M90 26v44" stroke="#8a6a3a" stroke-width="2"/><g stroke="#b8976a" stroke-width="1.4"><path d="M14 40l66-8M14 47l66-8M14 54l66-8M100 32l66 8M100 39l66 8M100 46l66 8"/></g></g><path d="M0 250l80-20 80 10 100-18 100 14 120-16 160 12v28H0z" fill="#0d1440"/>'),
 cronogramas:svg('<defs>'+defs('c1',[[0,'#26306e'],[.5,'#9a5a9a'],[.8,'#f39a5a'],[1,'#ffcf86']])+'<radialGradient id="c2"><stop offset="0" stop-color="#ffe3a8"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><rect width="640" height="260" fill="url(#c1)"/><circle cx="360" cy="150" r="150" fill="url(#c2)" opacity=".75"/><path d="M60 40q8-6 14 0M100 70q8-6 14 0M500 50q8-6 14 0M560 90q8-6 14 0" stroke="#2a1d4a" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M0 210l100-70 80 40 100-60 120 80 100-50 140 70v50H0z" fill="#5a3f7a" opacity=".85"/><path d="M0 235l120-50 80 30 110-45 130 50 100-20 100 40v20H0z" fill="#2a2a5c"/><g transform="translate(290 50)"><path d="M70 0l12 50H58z" fill="#2a1d3a"/><rect x="58" y="50" width="24" height="60" fill="#3a2848"/><path d="M40 110l30-20 30 20v60H40z" fill="#3a2848"/><rect x="0" y="120" width="44" height="50" fill="#4a3358"/><rect x="96" y="120" width="44" height="50" fill="#4a3358"/><path d="M0 120l22-18 22 18zM96 120l22-18 22 18z" fill="#2a1d3a"/><g fill="#ffcf6b"><rect x="62" y="64" width="6" height="14" rx="3"/><rect x="72" y="64" width="6" height="14" rx="3"/><rect x="64" y="130" width="12" height="22" rx="6"/><rect x="14" y="136" width="8" height="14" rx="4"/><rect x="110" y="136" width="8" height="14" rx="4"/></g></g><path d="M300 235q90-55 240-45l100 30v40H300z" fill="#1d2046"/>'),
 fundador:svg('<defs><radialGradient id="f1" cx=".75" cy=".4" r=".9"><stop offset="0" stop-color="#3a3f9f"/><stop offset=".6" stop-color="#16194a"/><stop offset="1" stop-color="#070b24"/></radialGradient><radialGradient id="f2" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffb37a"/><stop offset=".45" stop-color="#b94a7a"/><stop offset="1" stop-color="#241a5c"/></radialGradient><linearGradient id="f3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf86" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf86" stop-opacity="0"/></linearGradient></defs><rect width="640" height="260" fill="url(#f1)"/><g fill="#fff" opacity=".8"><circle cx="40" cy="30" r="1.3"/><circle cx="260" cy="40" r="1.5"/><circle cx="360" cy="20" r="1.2"/><circle cx="600" cy="60" r="1.5"/><circle cx="300" cy="100" r="1.1"/><circle cx="560" cy="200" r="1.2"/></g><g transform="translate(540 120)" fill="none" stroke="#8a93d6" stroke-opacity=".55" stroke-width="3"><circle r="100"/><circle r="84" stroke-width="1.5"/><g stroke-width="2"><path d="M0-100v16M0 100v-16M-100 0h16M100 0h-16M-70-70l11 11M70 70l-11-11M-70 70l11-11M70-70l-11 11"/></g><path d="M0 0l-40-56M0 0l58 18" stroke-width="4" stroke="#a9b2ef"/></g><circle cx="330" cy="130" r="110" fill="url(#f2)"/><g fill="#fff" opacity=".18"><ellipse cx="290" cy="80" rx="80" ry="14"/><ellipse cx="370" cy="110" rx="70" ry="10"/><ellipse cx="300" cy="150" rx="90" ry="12"/></g><path d="M240 200l30-30 20 14 26-40 30 30 20-20 40 50v46H240z" fill="#170f3a" opacity=".9"/><path d="M315 250l6-30 10-10 12 10 6 30z" fill="#07061c"/><circle cx="332" cy="196" r="9" fill="#07061c"/><rect y="220" width="640" height="40" fill="#0a0f24" opacity=".6"/>')
};
function hero(key,o){
 const url=(typeof siteAssets!=='undefined'&&siteAssets&&siteAssets['hero_'+key]&&typeof imageUrl==='function')?imageUrl(siteAssets['hero_'+key]):'';
 return '<section class="pg-hero pg-hero-'+key+'"><div class="pg-art">'+(url?'<img src="'+esc(url)+'" alt=""'+(window.IASDMedia&&typeof assetFrames!=='undefined'&&assetFrames['hero_'+key]?' style="'+IASDMedia.frameStyle(IASDMedia.frameOf('hero_'+key))+'"':'')+'>':ART[key])+'</div><div class="pg-hero-txt"><span class="pg-kick">'+esc(o.kick)+'</span><h1>'+o.title+'</h1><p>'+esc(o.text)+'</p>'+(o.cta||'')+'</div>'+(o.quote?'<blockquote class="pg-quote">“'+esc(o.quote[0])+'”<cite>'+esc(o.quote[1])+'</cite></blockquote>':'')+'</section>';
}
const go=n=>"go('"+n+"')";
const dt=v=>{const d=new Date(v);if(isNaN(d))return '';return d.toLocaleDateString('pt-BR')+' às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};

/* ====================== ALERTAS ====================== */
let alRoster=null,alRosterAt=0,alRosterBusy=false;
/* Quem pode receber alerta: sonoplastas e fundadores cadastrados (não só os online agora). Só o fundador consegue ler essa lista. */
function alLoadRoster(){
 if(alRosterBusy||Date.now()-alRosterAt<60000||typeof cloud==='undefined'||!window.IASDPresence||!IASDPresence.isFounder())return;
 alRosterBusy=true;
 Promise.resolve(cloud.rpc('iasd_founder_users')).then(r=>{alRoster=((r&&r.data)||[]).filter(u=>['sonoplasta','founder','cofounder'].includes(u.role));alRosterAt=Date.now()}).catch(()=>{alRoster=alRoster||[]}).finally(()=>{alRosterBusy=false;alRefreshTargets()});
}
function alTargetOptions(keep){
 const P=window.IASDPresence,me=typeof cloudUser!=='undefined'&&cloudUser?cloudUser.id:'';
 const all='<option value="">Todos os sonoplastas</option>';
 if(!(P&&P.isFounder()))return all;
 alLoadRoster();
 const online=P.view().rows,seen=new Set(online.map(r=>r.uid));
 const opt=(uid,name,tail)=>'<option value="'+esc(uid)+'" data-name="'+esc(name)+'"'+(keep===uid?' selected':'')+'>'+esc(name)+(uid===me?' (você)':'')+tail+'</option>';
 const off=(alRoster||[]).filter(u=>!seen.has(u.user_id));
 return all+online.map(r=>opt(r.uid,r.name,' · online desde '+r.arrived)).join('')+(off.length?'<optgroup label="Offline · recebem quando abrirem o site">'+off.map(u=>opt(u.user_id,u.full_name||u.email||'Sem nome',' · offline')).join('')+'</optgroup>':'');
}
function alRefreshTargets(){
 const sel=document.getElementById('founder-alert-target');if(!sel){return false}
 const keep=sel.value;sel.innerHTML=alTargetOptions(keep);
 if(keep&&sel.value!==keep){sel.value='';const n=document.getElementById('al-online');if(n)n.textContent='O sonoplasta escolhido saiu da lista; o envio voltou para “Todos”.'}
 else{const n=document.getElementById('al-online'),c=window.IASDPresence?IASDPresence.view().rows.length:0;if(n)n.textContent=!(window.IASDPresence&&IASDPresence.isFounder())?'O alerta vai para todos os sonoplastas.':c?c+' sonoplasta'+(c===1?'':'s')+' online agora. Escolha um ou envie para todos.':'Nenhum sonoplasta online agora. O alerta vai para todos e chega quando abrirem o site.'}
 return true;
}
function alerts(){
 const sched=(typeof cloudSchedules!=='undefined'?cloudSchedules:[]);
 setTimeout(()=>{try{if(!window.__alPresHook&&window.IASDPresence){IASDPresence.onChange(alRefreshTargets);window.__alPresHook=1}}catch(e){}alRefreshTargets();refreshSoundAlertThread();window.alRenderPush&&alRenderPush();if(!soundThreadTimer)soundThreadTimer=setInterval(refreshSoundAlertThread,15000)},0);
 return '<div class="pg pg-alertas">'+hero('alertas',{kick:'COMUNICAÇÃO RÁPIDA',title:'Alerta para o <em>Sonoplasta</em>',text:'Envie um aviso para aparecer no monitor principal do computador da igreja, sem substituir o conteúdo do telão.'})+
 '<div class="pg-cols al-cols"><section class="pg-card al-form"><h2 class="pg-h">'+I('bell','gold')+'Enviar alerta</h2>'+
 '<div class="al-sched"><span>Enviar para</span><label class="pg-sel">'+I('users')+'<select id="founder-alert-target">'+alTargetOptions()+'</select></label><small id="al-online" class="al-online"></small></div>'+
 '<div class="al-sched"><span>Cronograma (opcional)</span><label class="pg-sel">'+I('cal')+'<select id="founder-alert-schedule"><option value="">Aviso geral</option>'+sched.map(g=>'<option value="'+esc(g.name)+'">'+esc(g.name)+'</option>').join('')+'</select></label></div>'+
 '<div class="al-ta">'+I('msg')+'<textarea id="founder-sound-alert" maxlength="500" rows="3" placeholder="Ex.: O próximo hino foi alterado. Prepare o hino 123." oninput="document.getElementById(\'al-count\').textContent=this.value.length+\'/500\'"></textarea><small id="al-count">0/500</small></div>'+
 '<div class="al-act"><button class="pg-gold" id="founder-send-alert" onclick="sendFounderSoundAlert()">'+I('send')+'Enviar alerta ao sonoplasta</button><button class="pg-ghost" onclick="var t=document.getElementById(\'founder-sound-alert\');t.value=\'\';document.getElementById(\'al-count\').textContent=\'0/500\'">'+I('trash')+'Limpar mensagem</button></div></section>'+
 '<aside class="pg-card al-how"><div class="al-how-i">'+I('bulb','gold')+'<div><h3>Como funciona?</h3><p>O alerta será exibido apenas no monitor principal do computador da igreja, sem substituir o conteúdo do telão.</p></div></div><hr><div class="al-how-i">'+I('users','blue')+'<p>Todos os membros com cargo podem enviar alertas. O computador da sonoplastia precisa estar com o site aberto e o aplicativo Windows em execução.</p></div></aside></div>'+
 '<section class="pg-card al-push" id="al-push" style="margin-bottom:14px"></section>'+'<section class="pg-card al-recent"><div class="pg-head"><h2 class="pg-h">'+I('clock','blue')+'Alertas recentes</h2><span class="pg-sub lead">Veja os últimos alertas enviados para o sonoplasta.</span><button class="pg-ghost" onclick="refreshSoundAlertThread()">'+I('refresh')+'Atualizar</button>'+(alDelOk()?'<button class="pg-danger" onclick="IASDPages.alDelAll()">'+I('trash')+'Apagar todos</button>':'')+'</div><div id="sound-alert-thread"></div></section></div>';
}
const alStaff=()=>typeof cloudUser!=='undefined'&&cloudUser&&window.IASDAccess&&IASDAccess.canSendSoundAlert(cloudRole);
const alDelOk=()=>typeof cloudUser!=='undefined'&&cloudUser&&window.IASDAccess&&IASDAccess.canDeleteAlert(cloudRole);
const delBtn=x=>alDelOk()?'<button type="button" class="pg-danger" style="margin-top:8px" onclick="IASDPages.alDel('+jq(x.id)+')">'+I('trash')+'Apagar este alerta</button>':'';
async function alDel(id){
 if(!alDelOk()||!(await IASDDialog.confirm('Apagar este alerta?')))return;
 const r=await cloud.from('iasd_sound_alerts').delete().eq('id',id).select();
 if(r.error)return alert('Não foi possível apagar: '+r.error.message);
 if(!(r.data||[]).length)return alert('Nada foi apagado. Falta permissão no servidor: rode docs/supabase-alertas-apagar.sql no Supabase.');
 refreshSoundAlertThread();
}
async function alDelAll(){
 if(!alDelOk()||!(await IASDDialog.confirm('Apagar TODOS os alertas? Não dá para desfazer.')))return;
 const r=await cloud.from('iasd_sound_alerts').delete().not('id','is',null).select();
 if(r.error)return alert('Não foi possível apagar: '+r.error.message);
 if(!(r.data||[]).length)return alert('Nada foi apagado (não há alertas ou falta permissão). Se os alertas continuam aparecendo, rode docs/supabase-alertas-apagar.sql no Supabase.');
 refreshSoundAlertThread();
}
function alertRows(rows,sound){
 if(!rows.length)return '<p class="pg-empty">Nenhum alerta ainda.</p>';
 const quick=(window.SOUND_QUICK_REPLIES||[]);
 return rows.map((x,i)=>{
  const replied=!!x.reply_message;
  const reply=replied?'<div class="al-reply-b"><b>'+I('left')+esc(x.replied_by_name||'Sonoplastia')+'</b><small>'+esc(typeof soundAgo==='function'?soundAgo(x.replied_at):'')+'</small><div>'+esc(x.reply_message)+'</div></div>':(sound?'':'<div class="al-wait">Aguardando resposta da sonoplastia…</div>');
  const panel=sound?'<div class="al-panel" hidden><div class="al-quick">'+quick.map((t,k)=>'<button type="button" data-alert-reply="'+esc(x.id)+'" data-quick="'+k+'">'+esc(t)+'</button>').join('')+'</div><div class="al-write"><input type="text" maxlength="300" placeholder="Escrever resposta…" data-alert-input="'+esc(x.id)+'"><button type="button" class="pg-blue" data-alert-reply="'+esc(x.id)+'" data-send="1">Responder</button></div>'+delBtn(x)+'</div>':'<div class="al-panel" hidden><button type="button" class="pg-ghost" onclick="navigator.clipboard&&navigator.clipboard.writeText(this.dataset.t);this.textContent=\'Copiado\'" data-t="'+esc(x.message)+'">'+I('copy')+'Copiar mensagem</button>'+delBtn(x)+'</div>';
  return '<article class="al-row"><span class="al-ico '+(replied?'ok':(i%2?'blue':'ok'))+'">'+I('send')+'</span><div class="al-main"><b>'+esc(x.message)+'</b><small>'+esc(x.sender_name||'Equipe')+' <i>•</i> '+esc(dt(x.created_at))+(alertScheduleOf(x)?' <i>✦</i> '+esc(alertScheduleOf(x)):' <i>✦</i> Aviso geral')+(alertTargetOf(x)?' <i>✦</i> Para '+esc(alertTargetOf(x).name):'')+'</small>'+reply+'</div><span class="al-chip '+(replied?'replied':'')+'">'+I('check')+(replied?'Respondido':'Enviado')+'</span>'+(sound?'<button class="al-rbtn" type="button" onclick="var p=this.closest(\'.al-row\').querySelector(\'.al-panel\');p.hidden=!p.hidden">'+(replied?'Responder de novo':'Responder')+'</button>':'')+'<button class="al-more" type="button" aria-label="Mais ações" onclick="var p=this.closest(\'.al-row\').querySelector(\'.al-panel\');p.hidden=!p.hidden">'+I('more')+'</button>'+panel+'</article>';
 }).join('');
}

/* ====================== JOGOS ====================== */
const GAMES=[
 {m:'quiz',t:'Quiz Bíblico',d:'Teste seus conhecimentos sobre a Palavra de Deus.',b:'Quiz',c:'#7c5cff',n:()=>'1.000+ perguntas',pts:'+100 pts',art:'linear-gradient(135deg,#1b2a6b,#6b3fa8 60%,#e8a21f)',g:'help'},
 {m:'who',t:'Quem Sou Eu?',d:'Descubra personagens bíblicos e suas histórias.',b:'Pistas',c:'#22c3a6',n:()=>'120+ personagens',pts:'+150 pts',art:'linear-gradient(135deg,#0d2c4a,#1c6c8a 55%,#ffb347)',g:'users'},
 {m:'order',t:'Linha do Tempo',d:'Organize os acontecimentos bíblicos na ordem correta.',b:'Desafio',c:'#f0b44c',n:()=>'45+ linhas do tempo',pts:'+180 pts',art:'linear-gradient(135deg,#24305f,#8a5a7a 55%,#ffcf86)',g:'sort'},
 {m:'memory',t:'Memória Bíblica',d:'Encontre os pares: personagens, feitos, lugares e mais.',b:'Memória',c:'#a855f7',n:()=>'17 temas',pts:'+120 pts',art:'linear-gradient(135deg,#3a1d5c,#a8473a 60%,#ffb347)',g:'book'}
];
function gameCards(){
 const solo=GAMES.map(g=>'<article class="gm-card" data-t="'+esc(g.t.toLowerCase())+'"><div class="gm-art" style="background:'+g.art+'">'+I(g.g)+'<span class="gm-badge" style="--bc:'+g.c+'">'+g.b+'</span></div><div class="gm-body"><h3>'+esc(g.t)+'</h3><p>'+esc(g.d)+'</p><div class="gm-meta"><span>'+I('doc')+esc(g.n())+'</span><b>'+I('users','gold')+g.pts+'</b></div><button class="pg-outline" onclick="IASDSolo.open(\''+g.m+'\')">'+I('play')+'Jogar agora</button></div></article>').join('');
 const live='<article class="gm-card gm-feat" data-t="jogo coletivo"><div class="gm-art" style="background:linear-gradient(135deg,#0b2a55,#2563eb 55%,#22c55e)">'+I('pad')+'<span class="gm-badge" style="--bc:#4ade80">★ Destaque · Ao vivo</span></div><div class="gm-body"><h3>Jogo Coletivo</h3><p>Crie uma sala, conecte os celulares e jogue ao vivo no telão — individual ou Time × Time.</p><div class="gm-chips"><span>Telão</span><span>Celulares</span><span>Time × Time</span><span>Sem ranking</span></div><button class="pg-gold" onclick="gameSfx(\'start\');openCollectiveGame()">'+I('play')+'Criar sala agora</button>'+(window.IASDLivePresence&&IASDLivePresence.canSee()?'<button class="pg-ghost" onclick="IASDLivePresence.open()">👥 Presença: quem joga</button>':'')+'</div></article>';
 return '<div class="gm-wrap"><div class="gm-row" id="gm-row">'+live+solo+'</div><button class="gm-next" aria-label="Ver mais jogos" onclick="document.getElementById(\'gm-row\').scrollBy({left:320,behavior:\'smooth\'})">'+I('right')+'</button></div>';
}

/* ---- Ranking diário/semanal + Desafio do Dia ---- */
const DR={scope:'day',rows:{day:[],week:[],month:[]},loaded:{},legacy:false,err:''};
const DAILY_GAMES=[['quiz','⚡','Quiz Bíblico','#f5b73a'],['who','🎭','Quem Sou Eu?','#a78bfa'],['order','⏳','Linha do Tempo','#38bdf8'],['memory','🃏','Memória Bíblica','#34d399']];
const PRIZE_TEXT='Os campeões do dia e da semana (segunda a domingo) são anunciados no Domingo Jovem.';
function drDone(g){try{return window.IASDSolo?.dailyDone(g)}catch(e){return null}}
function drPointsToday(){return DAILY_GAMES.reduce((t,g)=>t+(drDone(g[0])?.score||0),0)}
function drMap(x){return {user_id:x.user_id,score:Number(x.score||0),correct_answers:Number(x.correct||0),total_answers:Number(x.total||0),best_streak:x.best_streak,games_played:x.games,iasd_profiles:{full_name:x.full_name,avatar_path:x.avatar_path}}}
function dailySection(){
 const done=DAILY_GAMES.filter(g=>drDone(g[0])).length,pts=drPointsToday();
 return '<section id="pg-daily" class="gm-sec"><div class="pg-head"><h2 class="pg-h">'+I('trophy','gold')+'Desafio do dia</h2><span class="gm-tag rk">🏆 VALE RANKING</span><span class="pg-sub">'+done+' de '+DAILY_GAMES.length+' concluídos · '+pts.toLocaleString('pt-BR')+' pts hoje</span></div>'+
 '<p class="dy-note">1 tentativa por jogo por dia, com as mesmas perguntas para todos. <details class="dy-more"><summary>Como funciona o ranking</summary>Jogar mais horas não dá vantagem. <b>'+PRIZE_TEXT+'</b> Os jogos livres, mais abaixo, ficam abertos para treinar e não pontuam.</details></p>'+
 '<div class="dy-grid">'+DAILY_GAMES.map(([k,ic,t,c])=>{const d=drDone(k);return '<article class="dy-card '+(d?'done':'')+'" style="--gc:'+c+'"><span class="dy-ic">'+ic+'</span><div><b>'+esc(t)+'</b><small>'+(d?'✓ '+Number(d.score).toLocaleString('pt-BR')+' pontos hoje':'Disponível agora')+'</small></div><button class="pg-outline" '+(d?'disabled':'onclick="IASDSolo.startDaily(\''+k+'\')"')+'>'+(d?'Concluído':I('play')+'Jogar')+'</button></article>'}).join('')+'</div></section>';
}
function rankTabs(){return '<div class="dy-tabs" id="dy-tabs"><button class="'+(DR.scope==='day'?'on':'')+'" onclick="IASDPages.dailyScope(\'day\')">Hoje</button><button class="'+(DR.scope==='week'?'on':'')+'" onclick="IASDPages.dailyScope(\'week\')">Esta semana</button><button class="'+(DR.scope==='month'?'on':'')+'" onclick="IASDPages.dailyScope(\'month\')">Este mês</button></div>'}
function rankBody(){
 if(DR.legacy){const rank=(typeof gameRanking!=='undefined'?gameRanking:[]);return '<p class="dy-note">Ranking antigo (geral). O ranking diário será ativado quando o administrador rodar o script do servidor.</p>'+rankRows(rank)}
 if(!DR.loaded[DR.scope])return '<p class="pg-empty">Carregando ranking…</p>';
 if(DR.err&&!DR.rows[DR.scope].length)return '<p class="pg-empty">Não foi possível carregar o ranking agora.</p>';
 const rows=DR.rows[DR.scope];
 return rows.length?rankRows(rows):'<p class="pg-empty">'+(DR.scope==='day'?'Ninguém pontuou hoje ainda. Faça um Desafio do dia e abra o ranking!':DR.scope==='month'?'Ninguém pontuou neste mês ainda.':'Ninguém pontuou nesta semana ainda.')+'</p>';
}
function paintRank(){const b=document.getElementById('gm-rank');if(b)b.innerHTML=rankBody();const t=document.getElementById('dy-tabs');if(t)t.outerHTML=rankTabs();const n=document.querySelector('.gm-tile.t2 b');if(n)n.textContent=String(DR.legacy?(typeof gameRanking!=='undefined'?gameRanking.length:0):(DR.rows[DR.scope]||[]).length)}
async function dailyLoad(scope,force){
 scope=scope||DR.scope;if(typeof cloud==='undefined'||!cloud||!cloudUser)return;
 if(!force&&DR.loaded[scope]&&Date.now()-DR.loaded[scope]<45000){paintRank();return}
 const r=await cloud.rpc('iasd_daily_ranking',{p_scope:scope});
 if(r.error){DR.err=r.error.message;DR.legacy=/function|schema cache|does not exist/i.test(r.error.message);DR.loaded[scope]=Date.now()}
 else{DR.err='';DR.legacy=false;DR.rows[scope]=(r.data||[]).map(drMap);DR.loaded[scope]=Date.now()}
 paintRank();
 if(!DR.legacy&&!DR.myLoaded){DR.myLoaded=true;const m=await cloud.rpc('iasd_my_daily');if(!m.error&&Array.isArray(m.data)){let ch=false;m.data.forEach(x=>{try{const k='iasd-daily-'+new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})+'-'+x.game;if(!localStorage.getItem(k)){localStorage.setItem(k,JSON.stringify({score:x.score,correct:x.correct,total:x.total,at:Date.now()}));ch=true}}catch(e){}});if(ch&&document.getElementById('pg-daily'))render()}}
}
function dailyScope(s){DR.scope=s;paintRank();dailyLoad(s,true)}
function dailyReload(){DR.loaded={};DR.myLoaded=false;setTimeout(()=>{if(document.getElementById('gm-rank'))dailyLoad(DR.scope,true)},200)}
function games(){
 setTimeout(()=>dailyLoad(),0);
 const rank=(typeof gameRanking!=='undefined'?gameRanking:[]);
 const me=rank.find(x=>x.user_id===cloudUser?.id);
 const score=me?Number(me.score||0):0;
 const tile=(cls,ico,num,label,click,sm)=>'<button class="gm-tile '+cls+'" onclick="'+click+'"><span class="gm-ti">'+I(ico)+'</span><span class="gm-tx">'+(sm?'<b class="sm">'+esc(num)+'</b><small>'+esc(label)+'</small>':'<b>'+esc(num)+'</b><small>'+esc(label)+'</small>')+'</span>'+I('right','chev')+'</button>';
 const jump=id=>"document.getElementById('"+id+"')?.scrollIntoView({behavior:'smooth',block:'start'})";
 return '<div class="pg pg-jogos">'+hero('jogos',{kick:'JOGOS',title:'Aprenda de forma <em>divertida</em>',text:'Desafie seus conhecimentos, participe de jogos e atividades que fortalecem a sua fé e o aprendizado da Palavra de Deus.',cta:'<button class="pg-cta" onclick="'+jump('pg-games')+'">'+I('pad')+'Ver todos os jogos'+I('right')+'</button>',quote:['Tudo o que fizerem, façam de todo o coração, como para o Senhor e não para os homens.','Colossenses 3:23']})+
 '<div class="gm-tiles">'+tile('t1','pad','5','Jogos disponíveis',jump('pg-games'))+tile('t2','users',String((DR.rows[DR.scope]||[]).length||rank.length),'Participantes no ranking',jump('pg-rank'))+tile('t3','trophy',drPointsToday().toLocaleString('pt-BR'),'Seus pontos hoje',jump('pg-daily'))+tile('t4','chart','Ver ranking','Confira os melhores da comunidade',jump('pg-rank'),true)+'</div>'+
 dailySection()+'<section id="pg-games" class="gm-sec gm-free"><div class="pg-head">'+'<h2 class="pg-h">'+I('pad','blue')+'Jogos livres</h2><span class="gm-tag fr">🎮 TREINO · NÃO PONTUA</span><div class="gm-tools"><label class="pg-search">'+I('search')+'<input type="search" placeholder="Pesquisar jogos…" oninput="var q=this.value.trim().toLowerCase();document.querySelectorAll(\'.gm-card\').forEach(c=>c.style.display=(!q||c.dataset.t.includes(q))?\'\':\'none\')"></label><label class="pg-sel sm">'+I('sort')+'<select onchange="var r=document.getElementById(\'gm-row\');if(!r)return;var cs=[...r.children];cs.sort((a,b)=>this.value===\'nome\'?a.dataset.t.localeCompare(b.dataset.t):0);if(this.value===\'nome\')cs.forEach(c=>r.appendChild(c));else{/* ordem padrão */var o=[\'jogo coletivo\',\'quiz bíblico\',\'quem sou eu?\',\'linha do tempo\',\'memória bíblica\'];cs.sort((a,b)=>o.indexOf(a.dataset.t)-o.indexOf(b.dataset.t)).forEach(c=>r.appendChild(c))}"><option value="">Ordenar por</option><option value="nome">Nome (A–Z)</option></select></label><button class="pg-blue" onclick="gameSfx(\'start\');openCollectiveGame()">'+I('plus')+'Novo jogo</button></div></div><div id="game-stage">'+gameCards()+'</div></section>'+
 '<section id="pg-rank" class="gm-sec"><div class="pg-head"><h2 class="pg-h">'+I('trophy','gold')+'Ranking da comunidade</h2>'+(window.IASDAccess&&IASDAccess.canResetRanking(cloudRole)?'<button class="pg-danger" onclick="IASDPages.resetRank(this)">'+I('trash')+'Zerar ranking</button>':'')+'<button class="pg-link" onclick="var l=document.getElementById(\'gm-rank\');l.classList.toggle(\'all\');this.firstChild.textContent=l.classList.contains(\'all\')?\'Ver menos \':\'Ver completo \'">Ver completo '+I('right')+'</button></div>'+rankTabs()+'<div id="gm-rank" class="gm-rank">'+rankBody()+'</div></section></div>';
}
async function resetRank(btn){
 if(!(window.IASDAccess&&IASDAccess.canResetRanking(cloudRole)))return;
 if(!(await IASDDialog.confirm('Zerar o ranking de TODOS os participantes? Esta ação não pode ser desfeita.')))return;
 if((await IASDDialog.prompt('Para confirmar, digite ZERAR'))?.trim().toUpperCase()!=='ZERAR')return;
 btn.disabled=true;
 const r=await cloud.rpc('iasd_reset_ranking');
 btn.disabled=false;
 if(r.error){alert(/function|schema cache|does not exist/i.test(r.error.message)?'Falta rodar o script docs/supabase-ranking-reset.sql no Supabase (uma vez).':'Não foi possível zerar: '+r.error.message);return}
 gameRanking=[];gameRankingLoaded=false;loadGameRanking(true);render();
}
function rankRows(rows){
 if(!rows.length)return '<p class="pg-empty">O ranking começa com a primeira partida.</p>';
 const medal=['crown','medal','medal'];
 return rows.map((x,i)=>{const p=x.iasd_profiles||{},acc=x.total_answers?Math.round(x.correct_answers*100/x.total_answers):0,mine=x.user_id===cloudUser?.id,avatar=p.avatar_path?'<img src="'+esc(profileMediaUrl(p.avatar_path))+'" alt="">':defaultProfileAvatar();
  return '<article class="gm-r '+(i>=3?'more':'')+' '+(mine?'mine':'')+'"><span class="gm-pos p'+i+'">'+(i<3?'<em>'+(i+1)+'</em>'+I(medal[i]):(i+1))+'</span><span class="gm-av">'+avatar+'</span><strong>'+esc(p.full_name||'Participante')+(mine?' <span class="gm-me">'+esc(typeof roleLabel==='function'?roleLabel():'Você')+'</span>':'')+'</strong><b class="gm-pts">'+Number(x.score||0).toLocaleString('pt-BR')+' pts</b><span class="gm-j">'+Number(x.games_played||0)+' jogos</span><span class="gm-acc">'+acc+'% acertos</span></article>'}).join('');
}

/* ====================== BÍBLIA ====================== */
const VOTD=[['João','John',17,'A tua palavra é a verdade.','João 17:17'],['Salmos','Psalms',119,'Lâmpada para os meus pés é a tua palavra.','Salmos 119:105'],['Filipenses','Philippians',4,'Tudo posso naquele que me fortalece.','Filipenses 4:13'],['Isaías','Isaiah',41,'Não temas, porque eu sou contigo.','Isaías 41:10']];

/* ---- Bíblia: escolher versículos (intervalo + seleção por toque) ---- */
const RD={verses:[],name:'',chapter:0,from:0,to:0,sel:new Set(),key:''};
/* marca-texto: fica salvo neste aparelho (book|chapter -> {verso:cor}) */
const HL_KEY='iasd-hl-v1',HL_COLORS=['','#facc15','#4ade80','#60a5fa','#f472b6'];
function hlAll(){try{return JSON.parse(localStorage.getItem(HL_KEY)||'{}')||{}}catch(e){return {}}}
function hlChap(){return hlAll()[readerState.book+'|'+RD.chapter]||{}}
function hlApply(color){
 const all=hlAll(),k=readerState.book+'|'+RD.chapter,m=all[k]||{},sel=[...RD.sel];
 const same=color&&sel.length&&sel.every(n=>m[n]===color);
 sel.forEach(n=>{if(!color||same)delete m[n];else m[n]=color});
 if(Object.keys(m).length)all[k]=m;else delete all[k];
 try{localStorage.setItem(HL_KEY,JSON.stringify(all))}catch(e){}
 RD.sel=new Set();rdPaint();
 bbToast(!color||same?'Marca removida':'Marcado ✓');
}
function rdVersionLabel(){const t=(readerState.translation||'nvi').toUpperCase();return t==='ALMEIDA'?'Almeida 1911':t}
function rdSet(name,chapter,verses){
 const key=readerState.book+'|'+chapter;
 if(RD.key!==key){RD.key=key;RD.from=0;RD.to=0;RD.sel=new Set()}
 const go=window.__rdGoto;let jumped=false;
 if(go&&go.book===readerState.book&&Number(go.chapter)===Number(chapter)){
  const last=verses.length?verses[verses.length-1].verse:1;
  let f=Math.min(Math.max(1,go.from||1),last),t=go.to?Math.min(Math.max(f,go.to),last):0;
  if(go.from){RD.from=f;RD.to=t===f?0:t;RD.sel=new Set();jumped=true}
  window.__rdGoto=null;
 }
 RD.name=name;RD.chapter=chapter;RD.verses=verses;rdPaint();
 if(jumped)setTimeout(()=>document.getElementById('reader-text')?.scrollIntoView({block:'start',behavior:'smooth'}),60);
}
function rdPassage(){
 const a=[...RD.sel].sort((x,y)=>x-y);let from=0,to=0;
 if(a.length){from=a[0];to=a[a.length-1]}else if(RD.from){from=RD.from;to=RD.to||RD.from}
 const vs=from?RD.verses.filter(v=>v.verse>=from&&v.verse<=to):RD.verses.slice(0,2);
 return {book:readerState.book,name:RD.name,chapter:RD.chapter,from,to:to===from?0:to,tr:readerState.translation||'nvi',text:vs.map(v=>v.text.trim()).join(' ')};
}
function rdPassRef(p){return p.name+' '+p.chapter+(p.from?':'+p.from+(p.to&&p.to!==p.from?'-'+p.to:''):'')}
function bbToast(m){let t=document.getElementById('bb-toast');if(!t){t=document.createElement('div');t.id='bb-toast';t.className='bb-toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=m;t.classList.add('on');clearTimeout(bbToast.t);bbToast.t=setTimeout(()=>t.classList.remove('on'),2200)}
function favRefresh(){
 const b=document.getElementById('bb-fav');if(!b||!window.IASDExtras)return;
 const on=IASDExtras.favHas(rdPassage());b.classList.toggle('on',!!on);b.setAttribute('aria-pressed',on?'true':'false');
 const n=IASDExtras.favCount(),c=document.getElementById('bb-favn');if(c){c.textContent=n?String(n):'';c.hidden=!n}
}
function favToggle(){
 if(!window.IASDExtras)return;const p=rdPassage();if(!p.chapter)return;
 const on=IASDExtras.favToggle(p);favRefresh();
 bbToast(on?'★ '+rdPassRef(p)+' salvo nos favoritos':'Removido dos favoritos');
}
function share(){const p=rdPassage();if(!p.from){bbToast('Toque nos versículos que quer compartilhar (ou use De/Até).');return}window.IASDVerseShare.open({text:p.text,ref:rdPassRef(p),ver:rdVersionLabel(),link:true})}
function copyQuick(btn){const p=rdPassage();if(p.from){navigator.clipboard?.writeText('“'+p.text+'” — '+rdPassRef(p)+' ('+rdVersionLabel()+')').then(()=>bbToast('Texto copiado ✓'));return}readerCopy()}
function rdVisible(){return RD.from?RD.verses.filter(v=>v.verse>=RD.from&&v.verse<=(RD.to||RD.from)):RD.verses}
function rdPaint(){
 const el=document.getElementById('reader-text');if(!el)return;
 const vis=rdVisible(),hl=hlChap();
 el.innerHTML='<h3>'+esc(RD.name)+' <span>'+RD.chapter+(RD.from?':'+RD.from+(RD.to&&RD.to!==RD.from?'-'+RD.to:''):'')+'</span></h3>'+vis.map(v=>'<p class="reader-verse'+(RD.sel.has(v.verse)?' sel':'')+(hl[v.verse]?' hl hl'+Math.max(1,HL_COLORS.indexOf(hl[v.verse])):'')+'" data-v="'+v.verse+'" tabindex="0"><sup>'+v.verse+'</sup>'+esc(v.text.trim())+(window.IASDBibleNotes?IASDBibleNotes.html(readerState.book,RD.chapter,v.verse):'')+'</p>').join('');
 const f=document.getElementById('rd-from'),t=document.getElementById('rd-to');
 const sb=document.getElementById('bb-share-mini');if(sb)sb.hidden=!RD.from;
 if(f&&t){const max=RD.verses.length,opts=(sel)=>Array.from({length:max},(_,i)=>'<option value="'+(i+1)+'"'+(sel===i+1?' selected':'')+'>'+(i+1)+'</option>').join('');
  f.innerHTML='<option value="0">Todos</option>'+opts(RD.from);t.innerHTML='<option value="0">—</option>'+opts(RD.to);t.disabled=!RD.from}
 const ref=document.getElementById('reader-ref');if(ref)ref.textContent=RD.name+' '+RD.chapter+(RD.from?':'+RD.from+(RD.to&&RD.to!==RD.from?'-'+RD.to:''):'');
 rdBar();favRefresh();
}
function rdRange(){
 const f=+document.getElementById('rd-from').value,t0=+document.getElementById('rd-to').value;
 RD.from=f;RD.to=f&&t0>=f?t0:0;if(t0&&t0<f){RD.to=0}
 RD.sel=new Set();rdPaint();
 if(f)document.getElementById('reader-text')?.scrollTo?.({top:0});
}
function rdGoRef(inp){
 const msg=document.getElementById('bb-ref-msg'),text=(inp&&inp.value||'').trim();if(!text)return;
 const r=window.IASDBibleRef&&IASDBibleRef.parse(text,bibleBooks);
 if(!r){if(msg)msg.textContent='Não reconheci “'+text+'”. Exemplos: João 3:16, Sl 23, 1 Co 13:4-7.';return}
 const idx=bibleBooks.findIndex(x=>x[1]===r.book),max=bibleChapterCounts[idx]||150,chapter=Math.min(r.chapter,max);
 window.__rdGoto={book:r.book,chapter,from:r.from,to:r.to};
 readerGoto(r.book,chapter);
}
function rdAll(){RD.from=0;RD.to=0;rdPaint()}
function rdSelRef(){const a=[...RD.sel].sort((x,y)=>x-y);if(!a.length)return '';const parts=[];let s=a[0],p=a[0];for(let i=1;i<=a.length;i++){if(a[i]===p+1){p=a[i];continue}parts.push(s===p?String(s):s+'-'+p);s=a[i];p=a[i]}return RD.name+' '+RD.chapter+':'+parts.join(',')}
function rdSelText(){const a=[...RD.sel].sort((x,y)=>x-y);return a.map(n=>RD.verses.find(v=>v.verse===n)).filter(Boolean).map(v=>v.text.trim()).join(' ')}
function rdQuote(){return '“'+rdSelText()+'” — '+rdSelRef()+' ('+rdVersionLabel()+')'}
function rdBar(){
 let bar=document.getElementById('rd-bar');const n=RD.sel.size;
 if(!document.querySelector('.bb-main')||!n){bar?.remove();return}
 const p=rdPassage(),hl=hlChap(),marked=[...RD.sel].some(v=>hl[v]);
 const dots=[1,2,3,4].map(c=>'<button class="vb-c" style="--c:'+HL_COLORS[c]+'" aria-label="Marcar com a cor '+c+'" onclick="IASDPages.hlApply('+"'"+HL_COLORS[c]+"'"+')"></button>').join('')
  +(marked?'<button class="vb-x" aria-label="Tirar a marca" title="Tirar a marca" onclick="IASDPages.hlApply(0)">'+I('trash')+'</button>':'');
 const fav=window.IASDExtras&&IASDExtras.favHas(p);
 const html='<div class="vb-t"><b>'+esc(rdPassRef(p))+'</b><span>'+n+' versículo'+(n===1?'':'s')+'</span><button class="vb-close" onclick="IASDPages.rdClear()" aria-label="Limpar seleção">✕</button></div>'
  +'<div class="vb-r"><span class="vb-dots" role="group" aria-label="Marca-texto">'+dots+'</span><button class="vb-b'+(fav?' on':'')+'" onclick="IASDPages.favToggle()" aria-label="Favoritar">'+I('star')+'</button><button class="vb-b" onclick="IASDBibleNotes.open()" aria-label="Anotar" title="Anotação">📝</button><button class="vb-b" onclick="IASDPages.copyQuick(this)" aria-label="Copiar">'+I('doc')+'</button><button class="vb-go" onclick="IASDPages.share()">'+I('share')+'Compartilhar</button></div>';
 if(!bar){bar=document.createElement('div');bar.id='rd-bar';bar.className='vbar';document.body.appendChild(bar)}
 bar.innerHTML=html;
}
function rdToggle(v){if(RD.sel.has(v))RD.sel.delete(v);else RD.sel.add(v);document.querySelector('#reader-text .reader-verse[data-v="'+v+'"]')?.classList.toggle('sel',RD.sel.has(v));rdBar();favRefresh()}
function rdClear(){RD.sel=new Set();rdPaint()}
function rdCopy(btn){navigator.clipboard?.writeText(rdQuote()).then(()=>{if(btn){const o=btn.innerHTML;btn.textContent='Copiado ✓';setTimeout(()=>btn.innerHTML=o,1400)}})}
function rdShare(){const t=rdQuote();if(navigator.share)navigator.share({title:rdSelRef(),text:t,url:location.origin+'/biblia'}).catch(()=>{});else rdCopy()}
function rdProject(){if(typeof project!=='function')return;project(rdSelText()+'\n\n'+rdSelRef()+' ('+rdVersionLabel()+')')}
setInterval(()=>{if(!document.querySelector('.bb-main'))document.getElementById('rd-bar')?.remove()},600);
document.addEventListener('click',e=>{const p=e.target.closest?.('#reader-text .reader-verse');if(p&&!window.getSelection().toString())rdToggle(+p.dataset.v)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('#reader-text .reader-verse')){e.preventDefault();rdToggle(+e.target.dataset.v)}});
function bible(){
 const index=Math.max(0,bibleBooks.findIndex(x=>x[1]===readerState.book));
 const max=bibleChapterCounts[index]||1,name=bibleBooks[index][0];
 const options=bibleBooks.map(([pt,en])=>'<option value="'+esc(en)+'" '+(en===readerState.book?'selected':'')+'>'+esc(pt)+'</option>').join('');
 const chapters=Array.from({length:max},(_,i)=>'<option value="'+(i+1)+'" '+(i+1===Number(readerState.chapter)?'selected':'')+'>'+(i+1)+'</option>').join('');
 const tr=[['acf','ACF — Almeida Corrigida e Fiel'],['aa','AA — Almeida Revisada'],['nvi','NVI — Nova Versão Internacional'],['almeida','ALM — Almeida 1911'],['kjv','KJV — King James (inglês)'],['web','WEB — World English Bible (inglês)']];
 const cur=readerState.translation||'almeida';
 return '<div class="pg pg-biblia '+(readerState.theme==='light'?'reader-light':'')+'" id="personal-reader">'+hero('biblia',{kick:'SUA BÍBLIA • LEITURA PESSOAL',title:'Um momento com a <em class="big">PALAVRA</em>',text:'Leia nos cultos, em casa ou onde estiver. Seu último capítulo e seus favoritos ficam salvos neste aparelho.',quote:['Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.','Salmos 119:105']})+
 '<section class="pg-card bb-find"><label><span class="sr">Ir para a passagem</span><div class="pg-sel">'+I('search')+'<input id="bb-ref" aria-label="Ir para a passagem" type="search" autocomplete="off" placeholder="Ex.: João 3:16 · Sl 23 · 1 Co 13:4-7" onkeydown="if(event.key===\'Enter\'){event.preventDefault();IASDPages.rdGoRef(this)}"></div></label><button class="pg-ghost strong" onclick="IASDPages.rdGoRef(document.getElementById(\'bb-ref\'))">Ir</button><small id="bb-ref-msg" role="status"></small><div class="bb-find2"><button class="pg-ghost" onclick="IASDBibleNotes.search()">🔎 Buscar na Bíblia</button><button class="pg-ghost" onclick="IASDBibleNotes.list()">📝 Anotações</button></div></section>'+
 '<section class="pg-card bb-bar"><label class="f-tr"><span>Tradução</span><div class="pg-sel">'+I('book')+'<select id="reader-translation" onchange="readerTranslation(this.value)">'+tr.map(([k,l])=>'<option value="'+k+'" '+(cur===k?'selected':'')+'>'+l+'</option>').join('')+'</select></div></label><label class="f-bk"><span>Livro</span><div class="pg-sel">'+I('book')+'<select id="reader-book" onchange="readerSelectBook(this.value)">'+options+'</select></div></label><label class="f-ch"><span>Cap.</span><div class="pg-sel">'+I('list')+'<select id="reader-chapter" onchange="readerOpen(this.value)">'+chapters+'</select></div></label><div class="bb-tools"><button class="pg-ghost sq" onclick="readerFont(-1)" title="Diminuir letra" aria-label="Diminuir letra">A−</button><button class="pg-ghost sq" onclick="readerFont(1)" title="Aumentar letra" aria-label="Aumentar letra">A+</button><button class="pg-ghost" onclick="readerTheme()" title="Alternar tema" aria-label="Alternar tema">'+(readerState.theme==='light'?'☾':'☀')+'</button></div></section>'+
 '<div class="pg-card bb-nav"><button class="pg-ghost strong" onclick="readerMove(-1)" aria-label="Capítulo anterior">'+I('left')+'<em>Anterior</em></button><span id="reader-ref">'+esc(name)+' '+readerState.chapter+'</span><button class="pg-ghost sq fav" id="bb-fav" onclick="IASDPages.favToggle()" aria-label="Favoritar esta passagem" title="Favoritar">'+I('star')+'</button><button class="pg-ghost sq favs" onclick="IASDExtras.open(\'fav\')" aria-label="Meus favoritos" title="Meus favoritos">'+I('list')+'<i id="bb-favn"></i></button><button class="pg-ghost strong" onclick="readerMove(1)" aria-label="Próximo capítulo"><em>Próximo</em>'+I('right')+'</button></div>'+
 '<div class="pg-card bb-verses"><div class="bv-l"><b>'+I('list')+'Versículos</b></div><label>De<div class="pg-sel"><select id="rd-from" onchange="IASDPages.rdRange()"><option value="0">Todos</option></select></div></label><label>Até<div class="pg-sel"><select id="rd-to" onchange="IASDPages.rdRange()" disabled><option value="0">—</option></select></div></label><button class="pg-ghost" onclick="IASDPages.rdAll()">Inteiro</button></div>'+
 '<div class="bb-main"><article class="pg-card bb-paper reader-paper" id="reader-text" aria-live="polite"><p>Carregando capítulo…</p></article><aside class="bb-side">'+
 '<div class="pg-card bb-quick bb-mini"><button id="bb-share-mini" class="bb-sharebtn" hidden onclick="IASDPages.share()">'+I('share')+'Compartilhar versículo</button><button onclick="IASDPages.listen(this)">'+I('head')+'Ouvir capítulo</button><button onclick="readerCopy()">'+I('doc')+'Copiar capítulo</button></div></aside></div>'+
 '<p class="reader-source">Tradução Almeida em português, consultada online. A disponibilidade dos capítulos depende da fonte externa e da conexão. Não há projeção nesta área.</p></div>';
}
function listen(btn){const s=window.speechSynthesis;if(!s)return;if(s.speaking){s.cancel();btn.lastChild.textContent='Ouvir capítulo';return}const t=(document.getElementById('reader-text')?.innerText||'').trim();if(!t)return;const u=new SpeechSynthesisUtterance(t);u.lang=/^(kjv|web)$/.test(readerState.translation)?'en-US':'pt-BR';u.onend=()=>{btn.lastChild.textContent='Ouvir capítulo'};s.speak(u);btn.lastChild.textContent='Parar leitura'}

/* ====================== CRONOGRAMAS ====================== */
const WD=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const fdate=s=>s?s.split('-').reverse().join('/'):'';
function minutes(t){const m=/^(\d{1,2}):(\d{2})/.exec(t||'');return m?(+m[1])*60+(+m[2]):null}
function sched(ctx){
 const {group,editForm}=ctx,list=cloudSchedules;
 const strip='<div class="sc-tabs"><div class="sc-strip" id="schedule-strip">'+list.map(g=>'<button class="sc-tab '+(g.id===selectedSchedule?'on':'')+'" onclick="showSchedule(\''+g.id+'\')"><span class="sc-ti">'+I('cal')+'</span><span><b>'+esc(g.name)+'</b>'+(g.date?'<small>'+esc(fdate(g.date))+'</small>':'')+'</span></button>').join('')+'</div><div class="sc-nav"><button class="pg-ghost sq" onclick="scrollSchedules(-1)" aria-label="Ver cultos anteriores">'+I('left')+'</button><button class="pg-ghost sq" onclick="scrollSchedules(1)" aria-label="Ver próximos cultos">'+I('right')+'</button>'+(canEditSchedule()?'<button class="pg-gold" onclick="newSchedule()">'+I('plus')+'Novo cronograma</button>':'')+'</div></div>';
 let body='';
 if(editForm)body=editForm;
 else if(group)body=detail(group);
 else body='<section class="pg-card"><h2 class="pg-h">Nenhum cronograma ainda</h2><p class="pg-sub">Toque em “Novo cronograma” para cadastrar o primeiro culto.</p></section>';
 return '<div class="pg pg-cronogramas">'+hero('cronogramas',{kick:'CRONOGRAMAS',title:'PROGRAMAÇÃO <em>DA IGREJA</em>',text:'Organize, edite e acompanhe todas as programações da igreja de forma simples e completa.',quote:['Tudo tem o seu tempo, e tudo o que se quer debaixo do céu tem a sua hora.','Eclesiastes 3:1']})+strip+body+'</div>';
}

/* ---- Formulário de cronograma: colar tudo de uma vez + equipe escalada ---- */
const TEAM_TAG='@@equipe ';
const isTeam=x=>String(x).startsWith(TEAM_TAG);
const teamOf=items=>{const t=(items||[]).find(isTeam);return t?t.slice(TEAM_TAG.length).split(/\s*[,;]\s*/).map(x=>x.trim()).filter(Boolean):[]};
const plain=items=>(items||[]).filter(x=>!isTeam(x));
let schTeam=[],schKey=null;
const SCH_TPL={
 sabado:['09:00 — Escola Sabatina — Superintendente','09:45 — Recepção e boas-vindas —','10:00 — Hino inicial e oração —','10:10 — Informativos —','10:20 — Estudo da lição —','11:00 — Intervalo —','11:15 — Louvor congregacional —','11:30 — Sermão — Pregador','12:15 — Oração final e bênção —'],
 escola:['09:00 — Recepção —','09:10 — Louvor inicial —','09:20 — Oração —','09:25 — Relatório missionário —','09:35 — Estudo da lição —','10:15 — Encerramento —'],
 jovem:['19:00 — Recepção —','19:10 — Louvor inicial —','19:25 — Boas-vindas e oração —','19:30 — Tema —','20:10 — Dinâmica —','20:30 — Oração final —'],
 oracao:['19:30 — Hino e oração inicial —','19:40 — Meditação — Dirigente','20:00 — Pedidos e motivos de oração —','20:20 — Oração final —']
};
/* Limpa o texto colado: tira marcadores (*, •, -), "9h30" vira "09:30" e mantém o restante como está */
function normSched(text){
 return String(text||'').split(/\r?\n/).map(l=>{
  l=l.replace(/^\s*(?:[*•▪◦●·\-–—]+|\d{1,2}[.)])\s+(?=\S)/,'').replace(/\s+/g,' ').trim();
  l=l.replace(/^(\d{1,2})\s*[hH]\s*(\d{2})?(?=\s|$|[-–—:])/,(m,h,mi)=>String(h).padStart(2,'0')+':'+(mi||'00'));
  l=l.replace(/^(\d{1,2}:\d{2})\s*[-–:]?\s+(?=[^\s—–-])/,(m,t)=>t+' — ');
  l=l.replace(/\s[-–]\s/g,' — ');
  return l}).filter(Boolean).filter(x=>!isTeam(x)).filter((x,i)=>!(i===0&&/^cronograma\b/i.test(x)&&!/\s—\s/.test(x)));
}
function schParse(text){const f=typeof parseSchedule==='function'?parseSchedule:x=>({time:'•',title:x,person:''});return normSched(text).map(x=>f(x))}
function schKnownPeople(){const set=new Set();(cloudSchedules||[]).forEach(g=>{teamOf(g.items).forEach(n=>set.add(n));plain(g.items).forEach(x=>{const a=schParse(x)[0];(a?.person||'').split(/[,;]| e /).map(n=>n.trim()).filter(n=>n&&n.length<40).forEach(n=>set.add(n))})});return [...set].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function schPeopleFromText(text){const set=[];schParse(text).filter(a=>!/^(tema|vers[ií]culo|texto|lema|leitura|obs|observa|local|data)/i.test(a.title)).forEach(a=>(a.person||'').split(/[,;]| e /).map(n=>n.trim().replace(/[.:]+$/,'')).filter(n=>n&&n.length<40&&/[A-Za-zÀ-ú]/.test(n)&&!/[\d:]/.test(n)).forEach(n=>{if(!set.some(x=>x.toLowerCase()===n.toLowerCase()))set.push(n)}));return set}
function schPrev(){
 const ta=document.getElementById('schedule-lines'),box=document.getElementById('sf-prev');if(!ta||!box)return;
 const rows=schParse(ta.value);
 box.innerHTML=rows.length?'<div class="sf-ph"><b>'+rows.length+' atividade'+(rows.length===1?'':'s')+' reconhecida'+(rows.length===1?'':'s')+'</b><small>Confira como vai ficar. Edite o texto acima se precisar.</small></div>'+rows.map(a=>'<div class="sf-r"><span class="t'+(a.time==='•'?' n':'')+'">'+esc(a.time)+'</span><span class="x"><b>'+esc(a.title)+'</b>'+(a.person?'<small>'+esc(a.person)+'</small>':'')+'</span></div>').join(''):'<p class="pg-empty">As atividades aparecem aqui conforme você cola ou digita.</p>';
 const n=document.getElementById('sf-pull');if(n){const c=schPeopleFromText(ta.value).filter(x=>!schTeam.some(t=>t.toLowerCase()===x.toLowerCase())).length;n.hidden=!c;n.querySelector('b').textContent=c}
}
function schTeamPaint(){
 const box=document.getElementById('sf-chips');if(!box)return;
 box.innerHTML=schTeam.length?schTeam.map((n,i)=>'<span class="sf-chip"><i>'+esc(n[0].toUpperCase())+'</i>'+esc(n)+'<button type="button" aria-label="Remover '+esc(n)+'" onclick="IASDPages.schTeamDel('+i+')">×</button></span>').join(''):'<p class="pg-empty">Ninguém escalado ainda.</p>';
 const c=document.getElementById('sf-count');if(c)c.textContent=schTeam.length;
}
function schTeamAdd(raw){
 const inp=document.getElementById('sf-person');const v=raw!=null?raw:(inp?inp.value:'');
 String(v).split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(n=>{if(!schTeam.some(t=>t.toLowerCase()===n.toLowerCase()))schTeam.push(n)});
 if(inp&&raw==null){inp.value='';inp.focus()}schTeamPaint();schPrev();
}
function schTeamDel(i){schTeam.splice(i,1);schTeamPaint();schPrev()}
function schPull(){const ta=document.getElementById('schedule-lines');if(ta)schPeopleFromText(ta.value).forEach(n=>schTeamAdd(n))}
async function schTpl(k){const ta=document.getElementById('schedule-lines');if(!ta||!SCH_TPL[k])return;if(ta.value.trim()&&!(await IASDDialog.confirm('Substituir o texto atual pelo modelo?')))return;ta.value=SCH_TPL[k].join('\n');schPrev()}
async function schFromOld(id){const g=(cloudSchedules||[]).find(x=>x.id===id);const ta=document.getElementById('schedule-lines');if(!g||!ta)return;if(ta.value.trim()&&!(await IASDDialog.confirm('Substituir o texto atual pelo cronograma copiado?')))return;ta.value=plain(g.items).join('\n');schTeam=teamOf(g.items);schTeamPaint();schPrev()}
function schTeamGet(){const inp=document.getElementById('sf-person');if(inp&&inp.value.trim())schTeamAdd();return schTeam.slice()}
function schedForm(g,isNew){
 const key=isNew?'new':g.id;
 if(schKey!==key){schKey=key;schTeam=teamOf(g.items)}
 const tpl=[['sabado','Culto de sábado'],['escola','Escola Sabatina'],['jovem','Culto jovem'],['oracao','Culto de oração']];
 const olds=(cloudSchedules||[]).filter(x=>x.id!==g.id).slice(0,12);
 const known=schKnownPeople();
 setTimeout(()=>{schTeamPaint();schPrev()},0);
 return '<section class="pg-card sf"><h2 class="pg-h">'+I(isNew?'plus':'pen')+(isNew?'Novo cronograma':'Editar cronograma')+'</h2>'+
 '<div class="sf-top"><label>Nome do culto<input id="schedule-name" placeholder="Ex.: Culto de sábado — manhã" value="'+esc(g.name)+'"></label><label>Data (opcional)<input type="date" id="schedule-date" value="'+esc(g.date||'')+'"></label></div>'+
 '<div class="sf-step"><span class="n">1</span><div><b>Cole a programação inteira de uma vez</b><small>Uma atividade por linha. Serve texto do WhatsApp, com marcadores (*, •, -) ou no formato “09:00 — Abertura — Ana”.</small></div></div>'+
 '<div class="sf-tpl"><small>Começar de um modelo:</small>'+tpl.map(t=>'<button type="button" class="pg-ghost" onclick="IASDPages.schTpl(\''+t[0]+'\')">'+t[1]+'</button>').join('')+(olds.length?'<select onchange="if(this.value){IASDPages.schFromOld(this.value);this.value=\'\'}" aria-label="Copiar de outro cronograma"><option value="">Copiar de outro cronograma…</option>'+olds.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+(o.date?' — '+esc(fdate(o.date)):'')+'</option>').join('')+'</select>':'')+'</div>'+
 '<textarea id="schedule-lines" rows="10" oninput="IASDPages.schPrev()" placeholder="Cole aqui o cronograma completo&#10;&#10;09:00 — Abertura — Ana Paula&#10;09:15 — Louvor — Equipe de música&#10;* Recepção - Ingrid, Clecia">'+esc(plain(g.items).join('\n'))+'</textarea>'+
 '<div id="sf-prev" class="sf-prev"></div>'+
 '<div class="sf-step"><span class="n">2</span><div><b>Pessoas escaladas</b><small>Quem vai participar neste culto. Digite vários nomes separados por vírgula.</small></div></div>'+
 '<div class="sf-add"><input id="sf-person" list="sf-known" placeholder="Nome da pessoa (ou vários: Ana, João, Maria)" onkeydown="if(event.key===\'Enter\'||event.key===\',\'){event.preventDefault();IASDPages.schTeamAdd()}"><datalist id="sf-known">'+known.map(n=>'<option value="'+esc(n)+'">').join('')+'</datalist><button type="button" class="pg-blue" onclick="IASDPages.schTeamAdd()">'+I('plus')+'Adicionar</button></div>'+
 '<button type="button" id="sf-pull" class="sf-pull" hidden onclick="IASDPages.schPull()">'+I('users')+'Adicionar <b>0</b> pessoas citadas nas atividades</button>'+
 '<div class="sf-ch"><span>Escalados (<b id="sf-count">0</b>)</span><div id="sf-chips" class="sf-chips"></div></div>'+
 '<div class="actions sf-act"><button id="save-schedule-btn" class="pg-gold" onclick="saveSchedule()">✓ Salvar cronograma</button><button class="pg-ghost" onclick="cancelSchedule()">Cancelar</button></div><p id="schedule-feedback" role="alert" style="display:none;font-weight:650"></p></section>';
}
function detail(g){
 const team=teamOf(g.items),gitems=plain(g.items);
 const items=gitems.map(parseSchedule),times=items.map(a=>minutes(a.time)).filter(n=>n!==null);
 const who=new Set(items.map(a=>(a.person||'').split(/[,;]/)[0].trim()).filter(Boolean));team.forEach(n=>who.add(n));
 let dur='—';if(times.length>1){const d=Math.max(...times)-Math.min(...times);dur=Math.floor(d/60)+'h '+String(d%60).padStart(2,'0')+'min'}
 const today=new Date().toLocaleDateString('en-CA');
 const status=!g.date?['Programado','ok']:g.date===today?['Hoje','live']:g.date>today?['Programado','ok']:['Realizado','done'];
 const wd=g.date?WD[new Date(g.date+'T12:00:00').getDay()]:'';
 const cover=localStorage.getItem('iasd-sched-cover-'+g.id);
 const span=times.length>1?('das '+items.find(a=>minutes(a.time)===Math.min(...times)).time+' às '+items.find(a=>minutes(a.time)===Math.max(...times)).time):'';
 const canE=canEditSchedule();
 return '<section class="pg-card sc-detail"><div class="sc-dh"><span class="sc-big">'+I('cal')+'</span><div class="sc-dt"><h2>'+esc(g.name)+'<span class="sc-st '+status[1]+'">'+I('check')+status[0]+'</span></h2>'+(g.date?'<small>'+I('cal')+esc(fdate(g.date))+' ('+wd+')</small>':'')+'</div><div class="sc-dact">'+(canE?'<button class="pg-ghost" onclick="editSchedule(\''+g.id+'\')">'+I('pen')+'Editar</button>':'')+(canDeleteSchedule()?'<button class="pg-danger" onclick="deleteSchedule(\''+g.id+'\')">'+I('trash')+'Excluir</button>':'')+'<button class="pg-ghost sq" title="Copiar programação" onclick="IASDPages.copySched(\''+g.id+'\',this)">'+I('more')+'</button></div></div>'+
 '<div class="sc-info"><div class="sc-cover" style="'+(cover?'background-image:url('+esc(cover)+')':'')+'"><b>'+esc(g.name)+'</b>'+(canE?'<button onclick="IASDPages.cover(\''+g.id+'\')">'+I('img')+'Alterar imagem</button>':'')+'</div>'+
 '<div class="pg-card sc-desc"><div class="sc-row">'+I('doc')+'<div><b>Descrição</b><p>Programação com '+gitems.length+' atividade'+(gitems.length===1?'':'s')+(span?', '+span:'')+'.</p></div></div><div class="sc-row">'+I('pin')+'<div><b>Local</b><p>IASD - Caldas do Jorro</p></div></div></div>'+
 '<div class="sc-stats"><div class="sc-stat">'+I('list','blue')+'<span><b>'+gitems.length+'</b><small>Atividades</small></span></div><div class="sc-stat">'+I('users','gold')+'<span><b>'+who.size+'</b><small>Responsáveis</small></span></div><div class="sc-stat">'+I('clock','blue')+'<span><b>'+dur+'</b><small>Duração estimada</small></span></div></div></div>'+
 '<div class="pg-head sc-ph"><h2 class="pg-h">'+I('list','blue')+'Programação</h2><span class="pg-sub">'+gitems.length+' atividades</span>'+(canE?'<button class="pg-blue" onclick="editSchedule(\''+g.id+'\')">'+I('plus')+'Adicionar atividade</button>':'')+'</div>'+
 '<div class="sc-tl" data-id="'+esc(g.id)+'">'+(items.length?items.map((a,i)=>'<div class="sc-it" '+(canE?'draggable="true"':'')+' data-i="'+i+'"><i class="dot '+(i===0?'first':'')+'"></i><span class="sc-time">'+esc(a.time)+'</span><div class="sc-tx"><b>'+esc(a.title)+'</b>'+(a.person?'<small>'+esc(a.person)+'</small>':'')+'</div>'+(canE?'<span class="sc-drag" title="Arraste para reordenar">'+I('drag')+'</span><button class="pg-ico" title="Projetar" onclick="project(cloudSchedules.find(g=>g.id===selectedSchedule).items['+i+'])">'+I('play')+'</button><button class="pg-ico" title="Editar" onclick="editSchedule(\''+g.id+'\')">'+I('pen')+'</button><button class="pg-ico red" title="Excluir atividade" onclick="removeScheduleLine('+i+')">'+I('trash')+'</button>':'')+'</div>').join(''):'<p class="pg-empty">Nenhuma atividade cadastrada.</p>')+'</div>'+(team.length?'<div class="pg-card sc-team"><h2 class="pg-h">'+I('users','gold')+'Equipe escalada<span class="pg-sub">'+team.length+' pessoa'+(team.length===1?'':'s')+'</span></h2><div class="sf-chips">'+team.map(n=>'<span class="sf-chip"><i>'+esc(n[0].toUpperCase())+'</i>'+esc(n)+'</span>').join('')+'</div></div>':'')+'</section>';
}
function copySched(id,btn){const g=cloudSchedules.find(x=>x.id===id);if(!g)return;const tm=teamOf(g.items);const t=g.name+(g.date?' — '+fdate(g.date):'')+'\n'+plain(g.items).join('\n')+(tm.length?'\n\nEscalados: '+tm.join(', '):'');navigator.clipboard?.writeText(t).then(()=>{btn.classList.add('ok');setTimeout(()=>btn.classList.remove('ok'),1500)})}
function cover(id){const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=()=>{const f=inp.files[0];if(!f)return;const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),k=Math.min(1,640/Math.max(img.width,img.height));c.width=img.width*k;c.height=img.height*k;c.getContext('2d').drawImage(img,0,0,c.width,c.height);try{localStorage.setItem('iasd-sched-cover-'+id,c.toDataURL('image/jpeg',.82))}catch(e){alert('Imagem grande demais para guardar neste aparelho.')}render()};img.src=URL.createObjectURL(f)};inp.click()}
document.addEventListener('dragstart',e=>{const it=e.target.closest?.('.sc-it[draggable]');if(!it)return;window.__scDrag=+it.dataset.i;it.classList.add('drag');e.dataTransfer.effectAllowed='move'});
document.addEventListener('dragend',e=>{e.target.closest?.('.sc-it')?.classList.remove('drag')});
document.addEventListener('dragover',e=>{if(e.target.closest?.('.sc-tl')&&window.__scDrag!=null)e.preventDefault()});
document.addEventListener('drop',async e=>{const tl=e.target.closest?.('.sc-tl'),to=e.target.closest?.('.sc-it');if(!tl||!to||window.__scDrag==null)return;e.preventDefault();const from=window.__scDrag,dest=+to.dataset.i;window.__scDrag=null;if(from===dest)return;const g=cloudSchedules.find(x=>x.id===tl.dataset.id);if(!g||!canEditSchedule())return;const items=g.items.slice();const [m]=items.splice(from,1);items.splice(dest,0,m);const r=await cloud.from('iasd_schedules').update({items}).eq('id',g.id);if(r.error){alert(r.error.message);return}await loadCloud();selectedSchedule=g.id;render()});

/* ====================== PAINEL DO FUNDADOR ====================== */
const ROLE_ICON={founder:'crown',cofounder:'crown',admin:'gear',sonoplasta:'music',editor:'pen',operator:'pen'};
function founder(){
 const all=founderAccounts,ordinary=all.filter(u=>!u.role||u.role==='pending'||u.role==='viewer'),mgmt=all.filter(u=>['founder','cofounder','admin','editor','operator','midia','lider','sonoplasta'].includes(u.role));
 const tile=(cls,ico,n,l,click,chev)=>'<button class="fd-tile '+cls+'" onclick="'+click+'"><span class="gm-ti">'+I(ico)+'</span><span class="gm-tx"><b>'+n+'</b><small>'+l+'</small></span>'+I('right','chev')+'</button>';
 const hue=s=>{let h=0;for(const c of String(s||'?'))h=(h*31+c.charCodeAt(0))%360;return h};
 const card=u=>{const nm=u.full_name||u.email||'Conta sem e-mail',rk=u.role||'viewer',ico=ROLE_ICON[rk]||'users';
  return '<article class="fd-card" data-q="'+esc((nm+' '+(u.email||'')+' '+roleDisplay(u.role)).toLowerCase())+'"><div class="fd-id"><span class="fd-av" style="--h:'+hue(nm)+'">'+esc(nm[0].toUpperCase())+'</span><div><b>'+esc(nm)+'</b><small>'+esc(u.email||'')+'</small><span class="fd-role r-'+rk+'">'+I(ico)+esc(roleDisplay(u.role))+'</span>'+(u.church_position?'<em class="fd-pos">'+esc(u.church_position)+'</em>':'')+'</div></div>'+
  (u.role==='founder'?'<div class="fd-lock">'+I('crown','gold')+'Conta do fundador · cargo protegido</div>':'<div class="fd-acc"><label class="pg-sel">'+I(ico)+'<select id="founder-role-'+u.user_id+'" aria-label="Permissão de '+esc(u.email)+'"><option value="viewer" '+(!u.role||u.role==='pending'||u.role==='viewer'?'selected':'')+'>Sem cargo administrativo</option><option value="admin" '+(u.role==='admin'?'selected':'')+'>Administrador</option><option value="cofounder" '+(u.role==='cofounder'?'selected':'')+'>Co-Fundador</option>'+(u.role==='operator'?'<option value="operator" selected>Operador (cargo antigo · migrar)</option>':'')+'</select></label><button id="founder-save-'+u.user_id+'" class="pg-gold full" onclick="setFounderRole(\''+u.user_id+'\')">Salvar acesso</button></div>')+
  '<div class="fd-btns"><button class="pg-ghost" onclick="editFounderProfile(\''+u.user_id+'\')">'+I('pen')+'Editar cadastro</button>'+(u.role==='founder'?'':'<button id="founder-delete-'+u.user_id+'" class="pg-danger" onclick="deleteFounderUser(\''+u.user_id+'\')">Excluir usuário</button>')+'</div>'+
  '<div class="fd-meta"><span>'+I('pin')+'IASD - Caldas do Jorro</span>'+(u.phone?'<span>'+I('msg')+esc(u.phone)+'</span>':'')+(u.ministry?'<span>'+I('music')+esc(u.ministry)+'</span>':'')+'<span>'+I('cal')+'Cadastro: '+new Date(u.created_at).toLocaleDateString('pt-BR')+'</span><span>'+I('clock')+'Último login: '+(u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleString('pt-BR',{timeZone:'America/Bahia'}):'Não informado')+'</span><span class="ok">'+I('check')+'E-mail: '+(u.email_confirmed_at?'Confirmado':'Não confirmado')+'</span></div>'+
  '<div class="fd-pos-row"><label for="founder-position-'+u.user_id+'">Função na igreja</label>'+churchPositionSelect('founder-position-'+u.user_id,u.church_position||'')+'<button class="pg-ghost" onclick="saveFounderPosition(\''+u.user_id+'\')">Salvar função</button></div></article>'};
 const list=founderLoading?'<div class="pg-card pg-empty">Carregando contas…</div>':founderError?'<div class="pg-card pg-empty" role="alert">Erro: '+esc(founderError)+'</div>':
  (mgmt.length?'<h3 class="fd-sub">Cargos administrativos</h3>'+mgmt.map(card).join(''):'<p class="pg-empty">Nenhum cargo administrativo adicional.</p>')+(ordinary.length?'<h3 class="fd-sub">Usuários comuns</h3>'+ordinary.map(card).join(''):'');
 return '<div class="pg pg-fundador">'+hero('fundador',{kick:'PAINEL DO FUNDADOR',title:'VISÃO E <em>CONTROLE</em>',text:'Gerencie usuários, permissões e acompanhe o funcionamento da sua igreja.',quote:['Tudo tem o seu tempo, e tudo o que se quer debaixo do céu tem a sua hora.','Eclesiastes 3:1']})+
 '<div class="fd-tiles">'+tile('t1','users',all.length,'Contas cadastradas',"document.getElementById('fd-list')?.scrollIntoView({behavior:'smooth'})")+tile('t2','users',ordinary.length,'Usuários comuns',"document.querySelector('.fd-sub:last-of-type')?.scrollIntoView({behavior:'smooth'})")+tile('t3','crown',mgmt.length,'Com cargo administrativo',"document.getElementById('fd-list')?.scrollIntoView({behavior:'smooth'})")+'<button class="fd-tile t4" onclick="loadFounderAccounts()"><span class="gm-ti">'+I('chart')+'</span><span class="gm-tx"><b class="sm">Gerenciar usuários</b><small>Permissões e acessos</small></span>'+I('refresh','chev')+'</button></div>'+
 '<section id="fd-list" class="fd-sec"><div class="pg-head"><h2 class="pg-h">'+I('users','blue')+'Usuários e cargos administrativos</h2><div class="gm-tools"><label class="pg-search">'+I('search')+'<input type="search" placeholder="Pesquisar usuário…" oninput="var q=this.value.trim().toLowerCase();document.querySelectorAll(\'.fd-card\').forEach(c=>c.style.display=(!q||c.dataset.q.includes(q))?\'\':\'none\')"></label><button class="pg-blue" onclick="IASDPages.newUser(this)">'+I('plus')+'Novo usuário</button></div></div>'+list+'</section>'+(window.IASDData?IASDData.section():'')+'</div>';
}
function newUser(btn){const link=location.origin+'/';navigator.clipboard?.writeText(link);alert('Novos usuários criam a própria conta pela tela “Entrar ou criar conta”. O link do site foi copiado para você enviar. Depois que a pessoa se cadastrar, ela aparece aqui e você define o cargo.');if(btn)btn.lastChild.textContent='Link copiado'}

/* ====================== LIÇÃO DA ESCOLA SABATINA ====================== */
ART.licao=svg('<defs>'+defs('l1',[[0,'#1d2b5e'],[.4,'#8a5a8a'],[.7,'#f0934f'],[1,'#ffd08a']])+'<radialGradient id="l2"><stop offset="0" stop-color="#fff2c4"/><stop offset=".35" stop-color="#ffc974" stop-opacity=".7"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><rect width="640" height="260" fill="url(#l1)"/><circle cx="300" cy="120" r="150" fill="url(#l2)"/><path d="M0 150l80-40 70 30 90-60 100 60 80-40 120 60 100-30v130H0z" fill="#5a4a82" opacity=".8"/><path d="M0 185l100-30 90 25 110-40 120 50 110-25 110 35v60H0z" fill="#2c2f66"/><rect y="215" width="640" height="45" fill="#3a2a22"/><path d="M0 222h640" stroke="#6a4a36" stroke-width="3"/><g transform="translate(170 120)"><path d="M0 70l130-26 130 26v20l-130-18L0 90z" fill="#8a5a36"/><path d="M0 70l130-26v-30L0 40z" fill="#f4e6c4" stroke="#8a6a3a" stroke-width="2"/><path d="M260 70l-130-26v-30l130 26z" fill="#efdcb2" stroke="#8a6a3a" stroke-width="2"/><g stroke="#b59a6a" stroke-width="1.4"><path d="M14 46l104-20M14 54l104-20M14 62l104-20M146 26l100 20M146 34l100 20M146 42l100 20"/></g></g>');
ART.acervo=svg('<defs>'+defs('k1',[[0,'#1b2452'],[.5,'#7a4a8a'],[.8,'#f08a4f'],[1,'#ffc07a']])+'<radialGradient id="k2"><stop offset="0" stop-color="#ffd7a0"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient><linearGradient id="k3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2a5c"/><stop offset="1" stop-color="#16183f"/></linearGradient></defs><rect width="640" height="260" fill="url(#k1)"/><circle cx="380" cy="130" r="140" fill="url(#k2)" opacity=".8"/><path d="M0 200l70-90 40 30 80-110 70 110 50-40 90 80 60-50 90 70 90-40v140H0z" fill="#4b3a7a" opacity=".9"/><path d="M0 230l100-40 90 30 120-50 120 50 110-30 100 40v30H0z" fill="#1f2557"/><g fill="#0f1a3a" opacity=".8"><path d="M40 240l8-40 8 40zM70 240l10-50 10 50zM560 240l8-40 8 40z"/></g><g transform="translate(400 40)"><path d="M0 24a10 10 0 0110-10h50l14 16h86a10 10 0 0110 10v100a10 10 0 01-10 10H10a10 10 0 01-10-10z" fill="#f0a24a" opacity=".9"/><rect x="6" y="44" width="164" height="100" rx="10" fill="url(#k3)" stroke="#ffd27a" stroke-width="3"/><rect x="50" y="64" width="76" height="58" rx="6" fill="none" stroke="#c9d6ff" stroke-width="4"/><circle cx="70" cy="82" r="7" fill="#c9d6ff"/><path d="M54 118l24-22 16 14 14-12 18 20z" fill="#c9d6ff"/></g>');

const LC={type:'all',q:'all'};
const quarterOf=q=>{const m=String(sabbathId(q)||'').match(/20\d{2}[-_/]0?([1-4])(?:\D|$)/);return m?m[1]:''};
function licao(){
 return '<div class="pg pg-licao">'+hero('licao',{kick:'ESTUDO SEMANAL',title:'Lição da <em>Escola Sabatina</em>',text:'Leia as lições sem sair do IASD APP. O conteúdo é carregado da fonte Adventech e apresentado na nossa interface.'})+'<div id="sabbath-content">'+sabbathContentMarkup()+'</div><p class="pg-src">Fonte do conteúdo: Adventech / Sabbath School. O IASD APP não altera o texto das lições.</p></div>';
}
function setLC(k,v){LC[k]=v;updateSabbathContent()}
function lcOpen(v){LC.fopen=!!v}
const SHELF={Adulto:['Lições para Adultos','Estudo da Palavra de forma profunda e contextualizada.','book'],Jovem:['Lições para Jovens','Conteúdo dinâmico e relevante para a juventude.','users'],Portugal:['Edição de Portugal','Lições da edição portuguesa.','book'],Outras:['Outras lições','Demais edições disponíveis.','book']};
function catalog(list){
 const years=[...new Set([...list.map(sabbathYear).filter(Boolean),'2026'])].sort((a,b)=>Number(b)-Number(a));
 const groups={Adulto:[],Jovem:[],Portugal:[],Outras:[]};
 list.forEach((q,i)=>{if(SABBATH_YEAR_FILTER!=='all'&&sabbathYear(q)!==SABBATH_YEAR_FILTER)return;if(LC.q!=='all'&&quarterOf(q)!==LC.q)return;const a=sabbathAudience(q);if(LC.type!=='all'&&a!==LC.type)return;(groups[a]||groups.Outras).push({q,i})});
 Object.keys(groups).forEach(k=>groups[k]=sabbathSortByDate(groups[k]));
 const sel=(label,icon,id,html,onch)=>'<label class="ls-f"><span>'+label+'</span><div class="pg-sel"><select id="'+id+'" onchange="'+onch+'">'+html+'</select></div></label>';
 const opt=(v,l,cur)=>'<option value="'+esc(v)+'" '+(String(cur)===String(v)?'selected':'')+'>'+esc(l)+'</option>';
 const fo=LC.fopen===undefined?innerWidth>900:LC.fopen,TN={Adulto:'Adultos',Jovem:'Jovens',Portugal:'Portugal',Outras:'Outras'};
 const act=[LC.type!=='all'?TN[LC.type]:'',SABBATH_YEAR_FILTER!=='all'?SABBATH_YEAR_FILTER:'',LC.q!=='all'?LC.q+'º trimestre':''].filter(Boolean).join(' · ')||'Todas as lições';
 const filters='<details class="pg-card ls-filter" '+(fo?'open':'')+' ontoggle="IASDPages.lcOpen(this.open)"><summary class="pg-h ls-sum">'+I('filter')+'Filtrar lições<small>'+esc(act)+'</small><i class="ls-chev" aria-hidden="true"></i></summary><div class="ls-fg">'+
  sel('Tipo de lição','', 'ls-type',opt('all','Todas',LC.type)+opt('Adulto','Adultos',LC.type)+opt('Jovem','Jovens',LC.type)+opt('Portugal','Portugal',LC.type)+opt('Outras','Outras',LC.type),"IASDPages.setLC('type',this.value)")+
  sel('Ano','', 'ls-year',opt('all','Todos',SABBATH_YEAR_FILTER)+years.map(y=>opt(y,y,SABBATH_YEAR_FILTER)).join(''),"setSabbathYearFilter(this.value)")+
  sel('Trimestre','', 'ls-q',opt('all','Todos',LC.q)+[1,2,3,4].map(n=>opt(String(n),n+'º trimestre',LC.q)).join(''),"IASDPages.setLC('q',this.value)")+
  sel('Ordem','', 'ls-ord',opt('asc','Mais antigas primeiro',SABBATH_DATE_ORDER)+opt('desc','Mais recentes primeiro',SABBATH_DATE_ORDER),"setSabbathDateOrder(this.value)")+
  '<button class="pg-gold ls-go" onclick="IASDPages.lcOpen(innerWidth>900);updateSabbathContent()">'+I('search')+'Buscar</button></div></details>';
 const manual=(q)=>{if(!(cloudRole==='founder'||cloudRole==='admin'))return '';const id=sabbathId(q),cur=sabbathAudience(q);return '<label class="ls-move" onclick="event.stopPropagation()">Mover para <select onclick="event.stopPropagation()" onchange="event.stopPropagation();setSabbathAudience('+JSON.stringify(id).replace(/"/g,'&quot;')+',this.value)"><option value="">Automático</option>'+['Jovem','Adulto','Portugal','Outras'].map(a=>'<option value="'+a+'" '+(cur===a?'selected':'')+'>'+a+'</option>').join('')+'</select></label>'};
 const shelf=(k)=>{const items=groups[k];if(!items.length)return '';const [t,sub,ic]=SHELF[k],rid='ls-row-'+k;
  return '<section class="ls-shelf"><div class="pg-head"><h2 class="pg-h">'+I(ic,'blue')+esc(t)+'</h2><span class="pg-sub lead">'+esc(sub)+'</span><button class="pg-link" onclick="var r=document.getElementById(\''+rid+'\');r.classList.toggle(\'wrap\');this.firstChild.textContent=r.classList.contains(\'wrap\')?\'Ver menos \':\'Ver todas \'">Ver todas '+I('right')+'</button></div><div class="ls-wrap"><div class="ls-row" id="'+rid+'">'+items.map(({q,i})=>{const id=sabbathId(q),cover=sabbathCover(q);return '<article class="ls-card" tabindex="0" role="button" onclick="openSabbathQuarter('+JSON.stringify(id).replace(/"/g,'&quot;')+','+i+')" onkeydown="if(event.key===\'Enter\')this.click()"><div class="ls-cov">'+(cover?'<img src="'+esc(cover)+'" alt="'+esc(sabbathTitle(q,'Capa da lição'))+'" loading="lazy">':I('book'))+'</div><div class="ls-cp"><small>'+esc(q?.human_date||q?.date||'Escola Sabatina')+'</small><b>'+esc(sabbathTitle(q,'Lição da Escola Sabatina'))+'</b></div><div class="ls-open"><span>'+I('book')+'Abrir</span>'+I('right')+'</div>'+manual(q)+'</article>'}).join('')+'</div><button class="gm-next" aria-label="Ver mais" onclick="document.getElementById(\''+rid+'\').scrollBy({left:420,behavior:\'smooth\'})">'+I('right')+'</button></div></section>'};
 const any=Object.values(groups).some(g=>g.length);
 return '<div class="ls-root">'+filters+(any?shelf('Adulto')+shelf('Jovem')+shelf('Portugal')+shelf('Outras'):'<div class="pg-card pg-empty">Nenhuma edição encontrada com esses filtros.</div>')+'</div>';
}

/* ====================== ACERVO DO SITE ====================== */
const fsize=n=>!n?'':n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
function acervo(){
 const lib=imageLibrary,used=new Set(Object.values(siteAssets||{}));
 const kind=f=>/\.(mp4|webm|mov)$/i.test(f.name)?'video':/\.gif$/i.test(f.name)?'gif':'image';
 const cnt=k=>lib.filter(f=>k==='all'?true:k==='used'?used.has(f.name):kind(f)===k).length;
 const slots=assetSlots.filter(x=>/^hero_/.test(x[0]));
 const folders=[['all','Todos os arquivos'],['image','Imagens'],['video','Vídeos'],['gif','GIFs'],['used','Em uso no site']];
 const first=k=>lib.find(f=>k==='all'?true:k==='used'?used.has(f.name):kind(f)===k);
 const fold=folders.map(([k,n],i)=>{const f=first(k),th=f&&kind(f)!=='video'?'background-image:url('+esc(imageUrl(f.name))+')':'';return '<button class="ac-fold '+(i===0?'on':'')+'" data-k="'+k+'" onclick="IASDPages.acFold(this)"><span class="ac-fth" style="'+th+'"></span>'+I('folder','blue')+'<b>'+n+'</b><small>'+cnt(k)+' arquivo'+(cnt(k)===1?'':'s')+'</small>'+I('right','chev')+'</button>'}).join('');
 const cards=lib.map(f=>{const path=f.name,url=imageUrl(path),k=kind(f),label=path.replace(/^[a-f0-9-]{36}-/i,''),dt=f.created_at?new Date(f.created_at):null,sz=fsize(f.metadata&&f.metadata.size),inuse=used.has(path);
  const media=k==='video'?'<video preload="metadata" muted src="'+esc(url)+'#t=0.5"></video>':'<img loading="lazy" src="'+esc(url)+'" alt="'+esc(label)+'">';
  return '<article class="ac-card" data-kind="'+k+'" data-used="'+(inuse?1:0)+'" data-name="'+esc(label.toLowerCase())+'" data-ts="'+(dt?dt.getTime():0)+'" data-path="'+esc(path)+'" data-url="'+esc(url)+'"><div class="ac-th">'+media+'<span class="ac-type">'+I(k==='video'?'play':'img')+'</span>'+(inuse?'<span class="ac-use">em uso</span>':'')+'</div><div class="ac-info"><span class="ac-fi">'+I(k==='video'?'video':'doc')+'</span><div><b title="'+esc(label)+'">'+esc(label)+'</b><small>'+(dt?dt.toLocaleDateString('pt-BR'):'')+(sz?' • '+sz:'')+'</small></div><button class="ac-more" type="button" aria-label="Mais ações" onclick="this.closest(\'.ac-card\').querySelector(\'.ac-menu\').toggleAttribute(\'hidden\')">'+I('more')+'</button></div>'+
  '<div class="ac-menu" hidden>'+(k==='video'?'':'<label>Usar como banner de<div class="pg-sel sm"><select onchange="IASDPages.useAs(this)"><option value="">Escolher…</option>'+slots.map(x=>'<option value="'+x[0]+'">'+esc(x[1].replace('Banner: ',''))+'</option>').join('')+'</select></div></label>')+'<a class="pg-ghost" href="'+esc(url)+'" target="_blank" rel="noopener">Abrir arquivo</a></div>'+
  '<div class="ac-act"><button class="pg-ghost" onclick="var u=this.closest(\'.ac-card\').dataset.url;navigator.clipboard.writeText(u).then(()=>alert(\'Link copiado\')).catch(()=>IASDDialog.prompt(\'Copie o link:\',u))">'+I('link')+'Copiar link</button><button class="pg-danger" onclick="deleteImage(this.closest(\'.ac-card\').dataset.path)">'+I('trash')+'Excluir</button></div></article>'}).join('');
 return '<div class="pg pg-acervo">'+hero('acervo',{kick:'ACERVO DO SITE',title:'Imagens e <em>mídias</em>',text:'Importe e organize os arquivos do site. As imagens e os vídeos ficam disponíveis para seleção nos futuros editores de banners, capas, ícones e outros elementos.'})+
 '<label class="ac-up">'+I('upload')+'Adicionar imagens ou vídeos<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple onchange="uploadImages(this)" style="display:none"></label>'+
 '<div class="ac-note"><span>JPG, PNG, WebP, GIF, MP4, WebM e MOV • até 50 MB por arquivo.</span><b>'+I('folder')+lib.length+' arquivos salvos</b></div><p id="site-media-progress" class="ac-prog" role="status">'+esc(imageNotice)+'</p>'+
 '<section class="ac-sec"><div class="pg-head"><h2 class="pg-h">Pastas do acervo ('+folders.length+')</h2></div><div class="ac-folds">'+fold+'</div></section>'+
 '<section class="ac-sec"><div class="pg-head"><h2 class="pg-h">'+I('clock','blue')+'Arquivos recentes</h2><span class="pg-sub lead">Veja os últimos arquivos adicionados ao acervo.</span><div class="gm-tools"><label class="pg-search">'+I('search')+'<input type="search" placeholder="Pesquisar arquivos…" oninput="IASDPages.acApply()"></label><label class="pg-sel sm"><select id="ac-sort" onchange="IASDPages.acApply()"><option value="new">Mais recentes</option><option value="old">Mais antigos</option><option value="name">Nome (A–Z)</option></select></label><div class="ac-view"><button class="on" onclick="IASDPages.acView(this,\'\')" aria-label="Grade">'+I('grid')+'</button><button onclick="IASDPages.acView(this,\'list\')" aria-label="Lista">'+I('list')+'</button></div></div></div>'+
 '<div class="ac-grid" id="ac-grid">'+(cards||'<p class="pg-empty">Nenhuma mídia salva ainda. Adicione seu primeiro arquivo acima.</p>')+'</div>'+(lib.length>=IMAGE_PAGE_SIZE?'<button class="pg-ghost" style="justify-self:center" onclick="loadImages(false)">Carregar mais</button>':'')+'</section></div>';
}
const AC={k:'all'};
function acApply(){const g=document.getElementById('ac-grid');if(!g)return;const q=(document.querySelector('.pg-acervo .pg-search input')?.value||'').trim().toLowerCase(),sort=document.getElementById('ac-sort')?.value||'new';const cards=[...g.querySelectorAll('.ac-card')];cards.forEach(c=>{const okK=AC.k==='all'||(AC.k==='used'?c.dataset.used==='1':c.dataset.kind===AC.k);c.style.display=(okK&&(!q||c.dataset.name.includes(q)))?'':'none'});cards.sort((a,b)=>sort==='name'?a.dataset.name.localeCompare(b.dataset.name):sort==='old'?a.dataset.ts-b.dataset.ts:b.dataset.ts-a.dataset.ts).forEach(c=>g.appendChild(c))}
function acFold(btn){AC.k=btn.dataset.k;document.querySelectorAll('.ac-fold').forEach(b=>b.classList.toggle('on',b===btn));acApply()}
function acView(btn,mode){document.getElementById('ac-grid')?.classList.toggle('list',mode==='list');btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===btn))}
async function useAs(sel){const card=sel.closest('.ac-card');if(!sel.value)return;if((await IASDDialog.confirm('Usar este arquivo como banner de "'+sel.options[sel.selectedIndex].text+'"?')))setSiteAsset(sel.value,card.dataset.path);else sel.value=''}

/* ====================== ESCALAS ====================== */
ART.escalas=svg('<defs>'+defs('e1',[[0,'#0c1530'],[.6,'#2a2040'],[1,'#6a3a2a']])+'<radialGradient id="e2"><stop offset="0" stop-color="#ffd28a"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><rect width="640" height="260" fill="url(#e1)"/><g opacity=".9"><rect x="120" y="20" width="60" height="140" rx="30" fill="#ffc979" opacity=".75"/><rect x="220" y="14" width="64" height="150" rx="32" fill="#ffd18a" opacity=".8"/><rect x="320" y="20" width="60" height="140" rx="30" fill="#ffc979" opacity=".7"/></g><circle cx="250" cy="90" r="160" fill="url(#e2)" opacity=".55"/><g fill="#0b0f22" opacity=".85"><rect x="100" y="0" width="6" height="170"/><rect x="200" y="0" width="6" height="170"/><rect x="300" y="0" width="6" height="170"/><rect x="400" y="0" width="6" height="170"/></g><rect y="190" width="640" height="70" fill="#2a1a16"/><path d="M0 190h640" stroke="#6a3f2c" stroke-width="3"/><g transform="translate(250 130)"><path d="M0 62l120-24 120 24v20L120 66 0 82z" fill="#8a5a36"/><path d="M0 62l120-24v-30L0 34z" fill="#f4e6c4" stroke="#8a6a3a" stroke-width="2"/><path d="M240 62l-120-24v-30l120 26z" fill="#efdcb2" stroke="#8a6a3a" stroke-width="2"/><g stroke="#b59a6a" stroke-width="1.3"><path d="M12 40l96-18M12 48l96-18M12 56l96-18M132 22l96 18M132 30l96 18M132 38l96 18"/></g></g>');
const AREAS=[['Sonoplastia','sliders','#3b82f6'],['Regência','music','#22c55e'],['Pregação','mic','#f59e0b'],['Escola Sabatina','book','#ef4444'],['Recepção','users','#a855f7'],['Projeção','screen','#d946ef']];
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DOW=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const now0=new Date();
const ES={m:now0.getMonth(),y:now0.getFullYear(),area:'Sonoplastia',status:'all',view:'month',anchor:new Date(now0.getFullYear(),now0.getMonth(),now0.getDate())};
const pad=n=>String(n).padStart(2,'0');
const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
function areaInfo(a){const f=AREAS.find(x=>x[0].toLowerCase()===String(a||'').trim().toLowerCase());return f||[a||'Outras','users','#64748b']}
function parseEsc(str,i){
 const parts=String(str).split(/\s+[—–-]\s+/).map(x=>x.trim());let dt=null,rest=parts.slice();
 const d0=rest[0]||'';let m=d0.match(/(\d{4})-(\d{2})-(\d{2})/);
 if(m)dt=new Date(+m[1],+m[2]-1,+m[3]);
 else if(m=d0.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)){let y=m[3]?+m[3]:ES.y;if(y<100)y+=2000;dt=new Date(y,+m[2]-1,+m[1])}
 if(dt)rest.shift();
 let time='';rest=rest.filter(x=>{const t=x.match(/^(\d{1,2}:\d{2})$/);if(t){time=t[1];return false}return true});
 return {i,raw:str,date:dt,name:rest[0]||str,area:rest[1]||'Outras',time};
}
/* ---- escalas compartilhadas (Supabase): data.escalas continua sendo a lista de textos; ESC_IDS guarda o id de cada linha ---- */
let ESC_IDS=[],ESC_CLOUD=false,ESC_UID=null,ESC_CH=null,ESC_BUSY=false;
const escLogged=()=>typeof cloudUser!=='undefined'&&cloudUser&&typeof cloud!=='undefined'&&cloud;
const escSave=()=>{try{localStorage.setItem('iasd-studio',JSON.stringify(data))}catch(e){}};
async function escSync(){
 if(ESC_BUSY)return;
 if(!escLogged()){if(ESC_CLOUD){ESC_CLOUD=false;ESC_IDS=[];ESC_UID=null;data.escalas=[];escSave();try{if(ES)esRender()}catch(e){}}return}
 ESC_BUSY=true;
 try{
  const uid=cloudUser.id;
  let r=await cloud.from('iasd_escalas').select('id,line').order('created_at',{ascending:true}).order('id',{ascending:true});
  if(r.error)return;
  /* uma vez por aparelho: quem pode adicionar leva para o servidor o que já tinha salvo aqui */
  const flag='iasd-esc-imported:'+uid;let done=false;try{done=localStorage.getItem(flag)==='1'}catch(e){}
  if(!done&&escCan('add')){
   const have=new Set((r.data||[]).map(x=>x.line)),local=(Array.isArray(data.escalas)&&!ESC_CLOUD?data.escalas:[]).filter(x=>typeof x==='string'&&x.trim().length>=8&&!have.has(x));
   if(local.length){const ins=await cloud.from('iasd_escalas').insert(local.map(line=>({line})));if(!ins.error)r=await cloud.from('iasd_escalas').select('id,line').order('created_at',{ascending:true}).order('id',{ascending:true});else return}
   try{localStorage.setItem(flag,'1')}catch(e){}
  }
  if(r.error)return;
  ESC_IDS=(r.data||[]).map(x=>x.id);data.escalas=(r.data||[]).map(x=>x.line);ESC_CLOUD=true;ESC_UID=uid;escSave();
  try{if(document.getElementById('esc-root'))esRender()}catch(e){}
  if(!ESC_CH&&cloud.channel){try{ESC_CH=cloud.channel('iasd-escalas').on('postgres_changes',{event:'*',schema:'public',table:'iasd_escalas'},()=>escSync()).subscribe()}catch(e){}}
 }finally{ESC_BUSY=false}
}
setInterval(()=>{const u=escLogged()?cloudUser.id:null;if(u!==ESC_UID||(!ESC_CLOUD&&u))escSync();},3000);
setInterval(()=>{if(ESC_CLOUD)escSync()},60000);
window.addEventListener('iasd-access-changed',()=>escSync());
function escList(){return (typeof data!=='undefined'&&Array.isArray(data.escalas)?data.escalas:[]).map(parseEsc).filter(e=>e.date)}
const escCan=k=>!!(typeof cloudUser!=='undefined'&&cloudUser&&window.IASDAccess&&IASDAccess.canEscala(k,cloudRole));
const todayD=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())};
function escFiltered(list){const today=todayD();return list.filter(e=>(ES.area==='all'||e.area.toLowerCase()===ES.area.toLowerCase())&&(ES.status==='all'||(ES.status==='next'?e.date>=today:e.date<today)))}
function escalas(){setTimeout(escSync,0);return '<div class="pg pg-escalas"><div id="esc-root">'+esBody()+'</div></div>'}
function esRender(){const r=document.getElementById('esc-root');if(r)r.innerHTML=esBody()}
function esSet(k,v){if(k==='m'||k==='y')ES[k]=+v;else ES[k]=v;if(k==='m'||k==='y')ES.anchor=new Date(ES.y,ES.m,1);esRender()}
function esNav(d){if(ES.view==='week'){ES.anchor=new Date(ES.anchor.getFullYear(),ES.anchor.getMonth(),ES.anchor.getDate()+7*d);ES.m=ES.anchor.getMonth();ES.y=ES.anchor.getFullYear()}else{const x=new Date(ES.y,ES.m+d,1);ES.m=x.getMonth();ES.y=x.getFullYear();ES.anchor=x}esRender()}
function esToday(){const t=new Date();ES.m=t.getMonth();ES.y=t.getFullYear();ES.anchor=new Date(t.getFullYear(),t.getMonth(),t.getDate());esRender()}
function esAdd(){const ed=ES.editing;if(!escCan(ed!=null?'edit':'add'))return alert('Você não tem permissão para isso.');const g=id=>document.getElementById(id);const d=g('es-d').value,n=g('es-n').value.trim(),a=g('es-a').value.trim(),t=g('es-t').value;if(!d||!n||!a){alert('Preencha data, nome e área.');return}
 const line=d+' — '+n+' — '+a+(t?' — '+t:'');let at;
 if(ESC_CLOUD){const bt=document.querySelector('.es-add .pg-blue,.es-add .pg-gold');if(bt)bt.disabled=true;
  const q=ed!=null&&ESC_IDS[ed]?cloud.from('iasd_escalas').update({line}).eq('id',ESC_IDS[ed]).select('id'):cloud.from('iasd_escalas').insert({line}).select('id');
  return q.then(async r=>{if(bt)bt.disabled=false;if(r.error||!(r.data||[]).length){alert('Não foi possível salvar: '+(r.error?r.error.message:'sem permissão no servidor'));return}
   ES.editing=null;await escSync();const dt0=parseEsc(line).date;if(dt0){ES.m=dt0.getMonth();ES.y=dt0.getFullYear();ES.anchor=dt0}
   ES.area=(AREAS.find(x=>x[0].toLowerCase()===a.toLowerCase())||[a])[0];ES.status='all';esRender();const nn=g('es-n');if(nn)nn.focus()})}
 if(ed!=null&&data.escalas[ed]!==undefined){data.escalas[ed]=line;at=ed}else{data.escalas.push(line);at=data.escalas.length-1}ES.editing=null;localStorage.setItem('iasd-studio',JSON.stringify(data));
 const dt=parseEsc(data.escalas[at]).date;if(dt){ES.m=dt.getMonth();ES.y=dt.getFullYear();ES.anchor=dt}
 ES.area=(AREAS.find(x=>x[0].toLowerCase()===a.toLowerCase())||[a])[0];ES.status='all';esRender();const nn=g('es-n');if(nn)nn.focus()}
function esEdit(i){if(!escCan('edit'))return;ES.editing=i;esRender();const f=document.getElementById('es-n');if(f){try{f.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}f.focus()}}
function esCancel(){ES.editing=null;esRender()}
async function esDel(i){if(!escCan('delete'))return;if(!(await IASDDialog.confirm('Remover este escalado?')))return;if(ESC_CLOUD){const r=await cloud.from('iasd_escalas').delete().eq('id',ESC_IDS[i]).select('id');if(r.error||!(r.data||[]).length){alert('Não foi possível remover: '+(r.error?r.error.message:'sem permissão no servidor'));return}await escSync();esRender();return}data.escalas.splice(i,1);localStorage.setItem('iasd-studio',JSON.stringify(data));esRender()}
function esExport(){const rows=escFiltered(escList()).filter(e=>e.date.getMonth()===ES.m&&e.date.getFullYear()===ES.y).sort((a,b)=>a.date-b.date);const csv='Data;Horário;Nome;Área\n'+rows.map(e=>[isoOf(e.date),e.time,e.name,e.area].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(';')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}));a.download='escalas-'+ES.y+'-'+pad(ES.m+1)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
function chip(e,del){const [n,ic,col]=areaInfo(e.area);return '<span class="es-chip" style="--ac:'+col+'" title="'+esc(e.name+' — '+e.area+(e.time?' às '+e.time:''))+'">'+I(ic)+'<b>'+esc(e.name)+'</b>'+(e.time?'<small>'+e.time+'</small>':'')+(del&&escCan('delete')?'<button class="es-x" onclick="IASDPages.esDel('+e.i+')" aria-label="Remover">×</button>':'')+'</span>'}
function esBody(){
 const all=escList(),list=escFiltered(all),today=todayD();
 const inMonth=e=>e.date.getMonth()===ES.m&&e.date.getFullYear()===ES.y;
 const years=[...new Set([now0.getFullYear()-1,now0.getFullYear(),now0.getFullYear()+1,ES.y,...all.map(e=>e.date.getFullYear())])].sort();
 const opt=(v,l,c)=>'<option value="'+esc(v)+'" '+(String(c)===String(v)?'selected':'')+'>'+esc(l)+'</option>';
 const extra=[...new Set(all.map(e=>e.area).filter(a=>!AREAS.some(x=>x[0].toLowerCase()===a.toLowerCase())))];
 const areas=[...AREAS,...extra.map(a=>[a,'users','#64748b'])];
 const fld=(ic,label,id,html,ch)=>'<label class="es-f">'+I(ic,'blue')+'<span>'+label+'</span><div class="pg-sel"><select id="'+id+'" onchange="'+ch+'">'+html+'</select></div></label>';
 const chips='<div class="es-areas">'+areas.map(a=>{const n=all.filter(e=>e.area.toLowerCase()===a[0].toLowerCase()&&inMonth(e)).length;return '<button class="es-area '+(ES.area.toLowerCase()===a[0].toLowerCase()?'on':'')+'" style="--ac:'+a[2]+'" onclick="IASDPages.esSet(\'area\','+jq(a[0])+')"><span class="es-ai">'+I(a[1])+'</span><span><b>'+esc(a[0])+'</b><small>'+n+' escalado'+(n===1?'':'s')+'</small></span></button>'}).join('')+'</div>';
 const aName=ES.area==='all'?'todas as áreas':ES.area;
 const seg=(v,l)=>'<button class="'+(ES.view===v?'on':'')+'" onclick="IASDPages.esSet(\'view\',\''+v+'\')">'+l+'</button>';
 let title=MESES[ES.m]+' de '+ES.y,body='';
 if(ES.view==='month'){
  const first=new Date(ES.y,ES.m,1),start=new Date(ES.y,ES.m,1-first.getDay()),weeks=Math.ceil((first.getDay()+new Date(ES.y,ES.m+1,0).getDate())/7);
  body='<div class="es-cal">'+DOW.map(d=>'<div class="es-dow">'+d+'</div>').join('');
  for(let k=0;k<weeks*7;k++){const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+k),out=d.getMonth()!==ES.m,es=list.filter(e=>isoOf(e.date)===isoOf(d));body+='<div class="es-day '+(out?'out':'')+' '+(isoOf(d)===isoOf(today)?'today':'')+'"><span>'+d.getDate()+'</span>'+(isoOf(d)===isoOf(today)?'<em class="es-hoje">Hoje</em>':'')+es.map(e=>chip(e,true)).join('')+'</div>'}
  body+='</div>';
 }else if(ES.view==='week'){
  const a=ES.anchor,s0=new Date(a.getFullYear(),a.getMonth(),a.getDate()-a.getDay()),e0=new Date(s0.getFullYear(),s0.getMonth(),s0.getDate()+6);
  title=s0.getDate()+' – '+e0.getDate()+' de '+MESES[e0.getMonth()]+' de '+e0.getFullYear();
  body='<div class="es-week">'+Array.from({length:7},(_,k)=>{const d=new Date(s0.getFullYear(),s0.getMonth(),s0.getDate()+k),es=list.filter(e=>isoOf(e.date)===isoOf(d));return '<div class="es-wd '+(isoOf(d)===isoOf(today)?'today':'')+'"><b>'+DOW[d.getDay()]+', '+d.getDate()+' de '+MESES[d.getMonth()].toLowerCase()+'</b><div>'+(es.length?es.map(e=>chip(e,true)).join(''):'<small>Sem escalados</small>')+'</div></div>'}).join('')+'</div>';
 }else{
  const rows=list.filter(inMonth).sort((a,b)=>a.date-b.date);
  body='<div class="es-list">'+(rows.length?rows.map(e=>{const [n,ic,col]=areaInfo(e.area);return '<div class="es-lr" style="--ac:'+col+'"><span class="es-dt"><b>'+pad(e.date.getDate())+'</b><small>'+MESES[e.date.getMonth()].slice(0,3).toUpperCase()+'</small></span><span class="es-ai">'+I(ic)+'</span><div><b>'+esc(e.name)+'</b><small>'+esc(e.area)+(e.time?' • '+e.time:'')+'</small></div>'+(escCan('edit')?'<button class="pg-ico" onclick="IASDPages.esEdit('+e.i+')" title="Editar">'+I('pen')+'</button>':'')+(escCan('delete')?'<button class="pg-ico red" onclick="IASDPages.esDel('+e.i+')" title="Remover">'+I('trash')+'</button>':'')+'</div>'}).join(''):'<p class="pg-empty">Nenhum escalado neste mês.</p>')+'</div>';
 }
 const sel=(id,html,ch,cls)=>'<span class="pg-sel es-sl '+(cls||'')+'"><select id="'+id+'" onchange="'+ch+'" aria-label="'+id+'">'+html+'</select></span>';
 const tool='<div class="es-bar2"><div class="es-bar2a"><button class="pg-ghost sq" onclick="IASDPages.esNav(-1)" aria-label="Anterior">'+I('left')+'</button>'
  +(ES.view==='week'?'<b class="es-wt">'+esc(title)+'</b>':sel('es-m',MESES.map((m,i)=>opt(i,m,ES.m)).join(''),"IASDPages.esSet('m',this.value)",'m')+sel('es-y',years.map(y=>opt(y,y,ES.y)).join(''),"IASDPages.esSet('y',this.value)",'y'))
  +'<button class="pg-ghost sq" onclick="IASDPages.esNav(1)" aria-label="Próximo">'+I('right')+'</button></div>'
  +'<div class="es-bar2b"><button class="pg-ghost es-hj" onclick="IASDPages.esToday()">Hoje</button><div class="es-seg">'+seg('month','Mensal')+seg('week','Semanal')+seg('list','Lista')+'</div>'
  +sel('es-st',opt('all','Todos',ES.status)+opt('next','Próximos',ES.status)+opt('past','Realizados',ES.status),"IASDPages.esSet('status',this.value)",'st')
  +'<button class="pg-ghost es-ex" onclick="IASDPages.esExport()" aria-label="Exportar">'+I('download')+'<span>Exportar</span></button></div></div>';
 const cal='<section class="pg-card es-main">'+tool+'<div class="es-hint">'+(ES.area!=='all'?'Escala de <b>'+esc(ES.area)+'</b>':'Todas as áreas')+' · '+(ES.view==='week'?esc(title):esc(MESES[ES.m]+' de '+ES.y))+'</div>'+body+'</section>';
 const upc=list.filter(e=>e.date>=today).sort((a,b)=>a.date-b.date).slice(0,5);
 const inM=list.filter(inMonth),people={};inM.forEach(e=>{people[e.name]=(people[e.name]||0)+1});
 const side='<aside class="es-side"><section class="pg-card es-up"><h3>'+I('clock','blue')+'Próximos compromissos</h3>'+(upc.length?upc.map(e=>{const [n,ic,col]=areaInfo(e.area);return '<div class="es-ur" style="--ac:'+col+'"><span class="es-dt"><b>'+pad(e.date.getDate())+'</b><small>'+MESES[e.date.getMonth()].slice(0,3).toUpperCase()+'</small></span><span class="es-ai">'+I(ic)+'</span><div><b>'+esc(e.area)+'</b><small>'+esc(e.name)+(e.time?'<br>'+e.time:'')+'</small></div></div>'}).join(''):'<p class="pg-empty">Nada agendado.</p>')+'</section>'+
 '<section class="pg-card es-stat"><h3>'+I('chart','blue')+'Estatísticas — '+esc(ES.area==='all'?'Todas':ES.area)+'</h3><div class="es-sr">'+I('cal','blue')+'<span>Total de escalas</span><b>'+inM.length+'</b></div><div class="es-sr">'+I('users','blue')+'<span>Escalados no mês</span><b>'+Object.keys(people).length+'</b></div>'+Object.entries(people).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,c])=>'<div class="es-sr sub"><span>'+esc(n)+'</span><b>'+c+'</b></div>').join('')+'</section></aside>';
 const ed=ES.editing!=null&&data.escalas[ES.editing]!==undefined?parseEsc(data.escalas[ES.editing],ES.editing):null;
 const add0='<section class="pg-card es-add"><h3>'+I(ed?'pen':'plus','gold')+(ed?'Editar escalado':'Adicionar escalado')+'</h3><div class="es-af"><label>Data<input type="date" id="es-d" value="'+isoOf(ed&&ed.date?ed.date:today)+'"></label><label>Nome<input id="es-n" placeholder="Ex.: Marcos Lima" value="'+(ed?esc(ed.name):'')+'"></label><label>Área / Função<input id="es-a" list="es-al" placeholder="Ex.: Sonoplastia" value="'+(ed?esc(ed.area):(ES.area==='all'?'':esc(ES.area)))+'"><datalist id="es-al">'+areas.map(a=>'<option value="'+esc(a[0])+'">').join('')+'</datalist></label><label>Horário<input type="time" id="es-t" value="'+(ed?esc(ed.time):'')+'"></label><button class="pg-blue" onclick="IASDPages.esAdd()">'+I(ed?'pen':'plus')+(ed?'Salvar alterações':'Adicionar')+'</button>'+(ed?'<button class="pg-ghost" onclick="IASDPages.esCancel()">Cancelar</button>':'')+'</div><p class="pg-sub">As escalas ficam salvas neste aparelho (mesma lista de antes).</p></section>';
 const add=escCan(ed?'edit':'add')?add0:'';
 return chips+'<div class="es-grid">'+cal+side+'</div>'+add;
}


/* ====================== MEU PERFIL ====================== */
const PF={scope:'week'};
function pfDayKey(d){return d.toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})}
function pfStreak(){
 try{
  const days=new Set();for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';const m=/^iasd-daily-(\d{4}-\d{2}-\d{2})-/.exec(k);if(m)days.add(m[1])}
  let d=new Date(),n=0;if(!days.has(pfDayKey(d)))d=new Date(Date.now()-864e5);
  while(days.has(pfDayKey(d))){n++;d=new Date(d.getTime()-864e5)}return n;
 }catch(e){return 0}
}
function pfMe(){const id=typeof cloudUser!=='undefined'&&cloudUser?cloudUser.id:'';const rank=(typeof gameRanking!=='undefined'?gameRanking:[])||[];const i=rank.findIndex(x=>x.user_id===id);return {row:i>=0?rank[i]:null,pos:i>=0?i+1:0,id}}
const PF_BADGES=[
 ['Primeiros passos','Concluiu seu primeiro desafio','📖','#c2762b','#7a3f12',c=>c.played>=1],
 ['3 dias seguidos','Voltou 3 dias em sequência','🔥','#2f7bff','#13328c',c=>c.streak>=3],
 ['7 dias seguidos','Manteve a sequência semanal','🔥','#3b82f6','#0b2a7a',c=>c.streak>=7],
 ['Top 20','Está entre os 20 melhores do site','🏆','#7c3aed','#3b1478',c=>c.pos>0&&c.pos<=20],
 ['Pódio','Está entre os 3 primeiros','🥇','#f5b73a','#8a5a07',c=>c.pos>0&&c.pos<=3],
 ['1.000 pontos','Passou de mil pontos','⭐','#16a34a','#0b4a24',c=>c.score>=1000],
 ['5.000 pontos','Passou de cinco mil pontos','💎','#06b6d4','#0a4a58',c=>c.score>=5000],
 ['Precisão','80% de acertos em 20+ respostas','🎯','#ef4444','#7a1414',c=>c.total>=20&&c.acc>=80],
 ['Leitor fiel','7 dias do plano de leitura','📚','#0d9488','#134e4a',c=>c.plan>=7],
 ['30 dias de Palavra','30 dias do plano de leitura','🕊️','#0ea5e9','#0c3b5e',c=>c.plan>=30],
 ['Um quarto da Bíblia','Leu 25% do plano (91 dias)','🏔️','#8b5cf6','#3b1c7a',c=>c.plan>=91]
];
const pfAllB=()=>PF_BADGES.concat((window.IASDStudyMe&&IASDStudyMe.SEALS)||[]);
function pfStudy(){try{return window.IASDStudyMe?IASDStudyMe.counts():{ans:0,les:0,tro:0,rooms:0,won:0}}catch(e){return {ans:0,les:0,tro:0,rooms:0,won:0}}}
function pfCtx(){const m=pfMe(),r=m.row||{};const total=Number(r.total_answers||0),ok=Number(r.correct_answers||0);
 let plan=0;try{plan=window.IASDExtras?.planStats().done||0}catch(e){}
 return {...pfStudy(),plan,score:Number(r.score||0),pos:m.pos,streak:pfStreak(),played:Number(r.games_played||0)||(Number(r.score||0)>0||pfStreak()?1:0),total,acc:total?Math.round(ok*100/total):0}}
function pfBadge(b,on){return '<div class="pf-bd'+(on?'':' off')+'" title="'+esc(b[1])+'"><span class="pf-hex" style="--c1:'+b[3]+';--c2:'+b[4]+'"><i>'+(on?b[2]:'🔒')+'</i></span><b>'+esc(b[0])+'</b><small>'+esc(b[1])+'</small></div>'}
function pfRankRows(){
 const me=pfMe();let rows=[];
 if(PF.scope==='week'){rows=(typeof DR!=='undefined'&&DR.rows.week)||[]}else{rows=(typeof gameRanking!=='undefined'?gameRanking:[])||[]}
 const av=x=>{const p=x.iasd_profiles||{};return p.avatar_path&&typeof profileMediaUrl==='function'?'<img src="'+esc(profileMediaUrl(p.avatar_path))+'" alt="">':'<span>'+esc((p.full_name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase())+'</span>'};
 const medal=i=>['<b class="pf-m g">1</b>','<b class="pf-m s">2</b>','<b class="pf-m b">3</b>'][i]||'<b class="pf-n">'+(i+1)+'</b>';
 const one=(x,i,you)=>'<div class="pf-rk'+(you?' me':'')+'">'+medal(i)+'<span class="pf-av">'+av(x)+'</span><strong>'+esc((x.iasd_profiles||{}).full_name||'Participante')+(you?' <em>· Você</em>':'')+'</strong><span class="pf-pts">'+Number(x.score||0).toLocaleString('pt-BR')+' pts</span></div>';
 if(PF.scope==='week'&&typeof DR!=='undefined'&&!DR.loaded.week)return '<p class="pg-empty">Carregando ranking…</p>';
 if(!rows.length)return '<p class="pg-empty">'+(PF.scope==='week'?'Ninguém pontuou nesta semana ainda. Faça um Desafio do dia!':'O ranking começa com a primeira partida.')+'</p>';
 const top=rows.slice(0,3).map((x,i)=>one(x,i,x.user_id===me.id)).join('');
 const mi=rows.findIndex(x=>x.user_id===me.id);
 const mine=mi>=3?'<div class="pf-gap"></div>'+one(rows[mi],mi,true):(mi<0?'<p class="pf-nopts">Você ainda não pontuou '+(PF.scope==='week'?'nesta semana':'no ranking')+'. Jogue um Desafio do dia para entrar!</p>':'');
 return top+mine;
}
function pfNext(c){
 let done=false;try{done=(typeof DAILY_GAMES!=='undefined'?DAILY_GAMES:[]).every(g=>drDone(g[0]))}catch(e){}
 if(!c.played)return ['Faça seu primeiro desafio','Jogue o Desafio do dia e entre no ranking da semana.','Jogar agora','Jogo'];
 if(!done)return ['Complete o Desafio do dia','Ainda há desafios de hoje esperando por você.','Ir para Jogos','Jogo'];
 return ['Chame a turma no Jogo Coletivo','Crie uma sala e jogue ao vivo com os celulares.','Ir para Jogos','Jogo'];
}
function profile(){
 const c=pfCtx(),lvl=Math.max(1,Math.floor(c.score/500)+1),into=c.score%500,left=500-into;
 const AB=pfAllB(),un=AB.filter(b=>b[5](c)),lk=AB.filter(b=>!b[5](c));
 const p=(typeof myProfile!=='undefined'&&myProfile)||{};
 const cover=p.cover_path?'<img src="'+esc(profileMediaUrl(p.cover_path))+'" style="'+profileImageStyle('cover')+'" alt="Foto de capa">':'';
 const role=typeof roleLabel==='function'?roleLabel():'';
 const nx=pfNext(c);
 const showAll=PF.all?AB:un.slice(0,3).concat(un.length<3?lk.slice(0,3-un.length):[]);
 return '<div class="pg pg-perfil">'+
 '<section class="pf-hero"><div class="pf-cover">'+cover+'<button class="pf-pen" onclick="editProfileMedia(\'cover\')" aria-label="Editar capa">'+I('pen')+'</button></div>'+
 '<div class="pf-id"><div class="pf-avatar"><div class="pf-ai">'+profileAvatarMarkup()+'</div><button class="pf-pen sm" onclick="editProfileMedia(\'avatar\')" aria-label="Editar foto">'+I('pen')+'</button></div>'+
 '<div class="pf-nm"><h2>'+esc(p.full_name||'Meu perfil')+'</h2><p>'+esc(p.church_position||p.ministry||'Membro da comunidade')+'</p><span class="pf-role">'+I('crown')+esc(role)+'</span></div>'+
 '<button class="pf-edit" onclick="openProfileEditor()">'+I('pen')+'Editar perfil</button></div></section>'+
 '<section class="pg-card pf-jr"><div class="pf-jh"><div><h3>Minha jornada</h3><small>Sua evolução na comunidade.</small></div><div class="pf-lv"><div><b>Nível '+lvl+'</b><small>'+c.score.toLocaleString('pt-BR')+' pontos</small></div><span class="pf-hex gold"><i>'+lvl+'</i></span></div></div>'+
 '<div class="pf-bar" role="progressbar" aria-valuenow="'+into+'" aria-valuemin="0" aria-valuemax="500"><i style="width:'+Math.round(into/5)+'%"></i></div><small class="pf-left">'+left+' pts para o próximo nível</small>'+
 '<div class="pf-st"><div>'+I('chart','blue')+'<span><b>'+(c.pos?c.pos+'º':'—')+'</b><small>Posição</small></span></div><div><span class="pf-fire">🔥</span><span><b>'+c.streak+' '+(c.streak===1?'dia':'dias')+'</b><small>Sequência</small></span></div><div>'+I('star','gold')+'<span><b>'+un.length+'</b><small>Conquistas</small></span></div></div></section>'+
 '<section class="pg-card pf-rank"><div class="pf-rh"><span class="pf-tr">'+I('trophy','gold')+'</span><div><h3>Ranking do site</h3><small>Sua evolução na comunidade.</small></div><div class="pf-seg" role="tablist"><button class="'+(PF.scope==='week'?'on':'')+'" onclick="IASDPages.pfScope(\'week\')">Semanal</button><button class="'+(PF.scope==='all'?'on':'')+'" onclick="IASDPages.pfScope(\'all\')">Geral</button></div></div><div id="pf-rows">'+pfRankRows()+'</div><button class="pf-link" onclick="go(\'Jogo\')">Ver ranking completo '+I('right')+'</button></section>'+
 '<section class="pg-card pf-ach"><div class="pf-ah"><span>'+I('star','gold')+'</span><div><h3>Minhas conquistas</h3><small>Medalhas que mostram a sua dedicação.</small></div><button class="pf-link inl" onclick="IASDPages.pfAll()">'+(PF.all?'Ver menos':'Ver todas')+' '+I('right')+'</button></div><div class="pf-bds">'+showAll.map(b=>pfBadge(b,b[5](c))).join('')+'</div></section>'+
 pfStudySec(c)+
 '<section class="pg-card pf-nx"><span class="pf-tg">🎯</span><div><h3>Seu próximo passo</h3><small>'+esc(nx[1])+'</small></div><button class="pg-gold" onclick="go(\''+nx[3]+'\')">'+esc(nx[2])+' '+I('right')+'</button></section>'+
 '<div class="pf-out"><button class="pg-ghost" onclick="cloudLogout()">Sair da conta</button></div></div>';
}
function pfStudySec(c){
 const M=window.IASDStudyMe;if(!M)return '';const cs=M.view();
 const tro=c.tro?'<div class="pf-bds" style="margin-top:10px">'+pfBadge(M.SEALS[M.SEALS.length-1],true)+'</div>':'';
 const list=cs.length?'<div class="pf-sl">'+cs.map(k=>{const ls=Object.keys(k.lessons).sort((a,b)=>a-b),dn=ls.filter(i=>k.lessons[i].d).length;
  return '<details class="pf-sc"><summary><span>'+(k.trophy?'🏆 ':'📖 ')+esc(k.title||'Estudo')+'</span><small>'+dn+(k.total?' de '+k.total:'')+' lições</small></summary><div class="pf-ls">'+ls.map(i=>{const l=k.lessons[i],as=Object.values(l.a||{});
   return '<details><summary>'+(l.d?'✔ ':'')+esc(l.t||('Lição '+(+i+1)))+' <small>· '+as.length+' resposta(s)</small></summary>'+(as.length?as.map(a=>'<p class="pf-qa"><b>'+(a.r==='ok'?'✅ ':a.r==='part'?'🟡 ':a.r==='no'?'❌ ':'')+esc(a.q)+'</b><span>'+esc(a.a)+'</span></p>').join(''):'<p class="pf-qa"><span>Sem respostas guardadas.</span></p>')+'</details>'}).join('')+'</div></details>'}).join('')+'</div>'
  :'<p class="pg-empty">Suas respostas e lições concluídas da Sala de Estudo aparecem aqui.</p>';
 return '<section class="pg-card pf-study"><div class="pf-ah"><span>📖</span><div><h3>Meu estudo</h3><small>'+c.ans+' resposta(s) · '+c.les+' lição(ões) concluída(s)</small></div><button class="pf-link inl" onclick="go(\'Estudo\')">Abrir '+I('right')+'</button></div>'+tro+list+'</section>'}
function pfRepaint(){if(typeof current!=='undefined'&&current==='Perfil'&&document.querySelector('.pg-perfil')&&typeof render==='function')render()}
function pfScope(sc){PF.scope=sc;if(sc==='week'&&typeof dailyLoad==='function')dailyLoad('week',true).then(pfRepaint);pfRepaint()}
function pfAll(){PF.all=!PF.all;pfRepaint()}
function pfLoad(){
 try{if(window.IASDStudyMe)IASDStudyMe.loadOnce().then(f=>{if(f)pfRepaint()})}catch(e){}
 try{if(typeof loadGameRanking==='function')loadGameRanking();if(typeof dailyLoad==='function'&&typeof DR!=='undefined'&&!DR.loaded.week)Promise.resolve(dailyLoad('week')).then(pfRepaint)}catch(e){}
}

try{window.addEventListener('iasd-study-me',()=>pfRepaint())}catch(e){}
window.IASDPages={hlApply,rdPassage,favToggle,favRefresh,copyQuick,profile,pfLoad,pfScope,pfAll,rdGoRef,lcOpen,alDel,alDelAll,dailyScope,dailyReload,dailyLoad,rdSet,rdPaint,rdRange,rdAll,rdCopy,rdShare,rdProject,rdClear,resetRank,schedForm,schPrev,schTpl,schFromOld,schTeamAdd,schTeamDel,schPull,schTeamGet,normSched,isTeam,plain,teamOf,TEAM_TAG,escalas,esSet,esNav,esToday,esAdd,esEdit,esCancel,esDel,esExport,esRender,licao,catalog,setLC,acervo,acApply,acFold,acView,useAs,alerts,alertRows,games,gameCards,rankRows,bible,share,listen,sched,copySched,cover,founder,newUser,hero};
})();
