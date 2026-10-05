/* Studio de Projeção — mídias: Músicas especiais, Provai e Vede e Dízimos/Informativos.
   Base comum: pesquisa no YouTube (/api/youtube-search), biblioteca (navegador + nuvem), fila de reprodução
   e barra de ações do telão (Projetar · Fechar vídeo · Tela preta).
   Carrega depois de studio.js e antes de studio-ambient.js; substitui funções antigas pelas novas. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
if(!$('special')||typeof youtubeEmbed!=='function')return;

/* ---------- utilitários ---------- */
const rd=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
function h(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function ic(n){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','ti');const u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href','#i-'+n);s.append(u);return s}
function btn(label,cls,fn,icon,title){const b=h('button',cls||'mp-btn');b.type='button';if(icon)b.append(ic(icon));if(label)b.append(document.createTextNode(label));if(title){b.title=title;b.setAttribute('aria-label',title)}if(fn)b.onclick=fn;return b}
const valid=id=>/^[\w-]{11}$/.test(id||'');
const dec=s=>typeof decodeYouTubeText==='function'?decodeYouTubeText(s||''):(s||'');
const thumbUrl=id=>'https://i.ytimg.com/vi/'+id+'/mqdefault.jpg';
function thumb(id){const i=h('img','amb-th');i.src=thumbUrl(id);i.alt='';i.loading='lazy';i.onerror=()=>{i.style.visibility='hidden'};return i}
const fmtDur=s=>{s=Number(s)||0;if(!s)return'';const hh=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60,p=n=>String(n).padStart(2,'0');return hh?hh+':'+p(m)+':'+p(r):m+':'+p(r)};
let toastT=null;
function toast(msg){try{feedback(msg)}catch(e){}const t=$('mmToast');if(!t)return;t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2600)}
function resize(){if(typeof requestStudioHeight==='function')requestStudioHeight()}

/* ---------- títulos dos vídeos (compartilhados com as Músicas ambientes) ---------- */
const TK='iasd-yt-titles',AMB_META='iasd-ambient-meta';
let titles=rd(TK,{});
const BUILTIN=(typeof PROVAI_E_VEDE_LIBRARY!=='undefined'?PROVAI_E_VEDE_LIBRARY:[]);
const builtinOf=id=>BUILTIN.find(v=>v.id===id);
function titleOf(id,fb){const b=builtinOf(id);return(b&&b.title)||titles[id]||((rd(AMB_META,{})[id]||{}).title)||fb||'Vídeo do YouTube'}
function setTitle(id,t){if(!id||!t)return;if(titles[id]===t)return;titles[id]=t;wr(TK,titles)}
const tInflight=new Set();
async function ensureTitle(id){if(titleOf(id,'')||tInflight.has(id)||!valid(id))return;tInflight.add(id);try{const r=await fetch('https://noembed.com/embed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+id),{signal:AbortSignal.timeout(6000)});const j=await r.json();if(j&&j.title){setTitle(id,j.title);renderAll()}}catch(e){}finally{tInflight.delete(id)}}

/* ---------- pesquisa no YouTube ---------- */
const NOKEY='A pesquisa do YouTube precisa da chave da API (YOUTUBE_API_KEY) no Vercel. Veja docs/YOUTUBE-API.md.';
async function ytSearch(q,opts){
 const r=await fetch('/api/youtube-search?q='+encodeURIComponent(q)+((opts&&opts.music)?'&music=1':''));
 let d={};try{d=await r.json()}catch(e){}
 if(!r.ok){const m=d.error||'Falha na pesquisa';throw Error(m==='YOUTUBE_API_KEY_NOT_CONFIGURED'?NOKEY:m)}
 return(Array.isArray(d.items)?d.items:[]).map(x=>({id:x.id,title:dec(x.title),channel:dec(x.channel),duration:x.duration||0,thumb:x.thumbnail||''})).filter(x=>valid(x.id));
}
window.IASDYouTube={search:ytSearch};

/* ---------- biblioteca: navegador + nuvem (tabela iasd_media_library) ---------- */
const LK={special:'iasd-lib-special',testimony:'iasd-lib-testimony'};
const libs={special:rd(LK.special,[]),testimony:rd(LK.testimony,[])};
let cloudNote='';
function cdb(){try{return window.parent!==window?window.parent.iasdCloud:null}catch(e){return null}}
function cuser(){try{return window.parent.iasdCurrentUser?.()}catch(e){return null}}
async function cloudLoad(kind){const c=cdb();if(!c||!cuser())return null;try{const {data,error}=await c.from('iasd_media_library').select('youtube_id,title,channel,pool,created_at').eq('kind',kind).order('created_at');if(error)throw error;cloudNote='';return(data||[]).map(r=>({id:r.youtube_id,title:r.title||'',channel:r.channel||'',pool:r.pool!==false}))}catch(e){cloudNote='Biblioteca salva só neste navegador (falta rodar docs/supabase-sonoplastia-biblioteca.sql).';return null}}
async function cloudAdd(kind,it){const c=cdb(),u=cuser();if(!c||!u||cloudNote)return;try{await c.from('iasd_media_library').upsert({kind,youtube_id:it.id,title:(it.title||'').slice(0,200),channel:(it.channel||'').slice(0,120),pool:it.pool!==false,added_by:u.id},{onConflict:'kind,youtube_id'})}catch(e){}}
async function cloudDel(kind,id){const c=cdb();if(!c||!cuser()||cloudNote)return;try{await c.from('iasd_media_library').delete().eq('kind',kind).eq('youtube_id',id)}catch(e){}}
async function cloudPool(kind,id,pool){const c=cdb();if(!c||!cuser()||cloudNote)return;try{await c.from('iasd_media_library').update({pool}).eq('kind',kind).eq('youtube_id',id)}catch(e){}}
const lib=kind=>libs[kind]||[];
const inLib=(kind,id)=>lib(kind).some(x=>x.id===id);
function libSave(kind){wr(LK[kind],libs[kind])}
function libAdd(kind,it){if(!valid(it.id))return false;if(inLib(kind,it.id)){toast('Já está na biblioteca.');return false}const row={id:it.id,title:it.title||titleOf(it.id,''),channel:it.channel||'',pool:true};libs[kind].push(row);if(row.title)setTitle(row.id,row.title);libSave(kind);cloudAdd(kind,row);toast('Salvo na biblioteca.');renderAll();return true}
function libDel(kind,id){libs[kind]=lib(kind).filter(x=>x.id!==id);libSave(kind);cloudDel(kind,id);renderAll()}
async function libSync(kind){
 const remote=await cloudLoad(kind);if(!remote)return;
 const local=lib(kind);let changed=false;
 remote.forEach(r=>{const l=local.find(x=>x.id===r.id);if(!l){local.push(r);if(r.title)setTitle(r.id,r.title);changed=true}else if(l.pool!==r.pool){l.pool=r.pool;changed=true}});
 local.forEach(l=>{if(!remote.some(r=>r.id===l.id))cloudAdd(kind,l)});
 if(changed){libSave(kind);renderAll()}
}
/* a biblioteca de Músicas ambientes é guardada pelo próprio módulo; aqui só o espelho na nuvem */
window.IASDLib={cloudLoad,cloudAdd,cloudDel,inLib,libAdd,libDel,toast};

/* ---------- fila de reprodução (Músicas especiais e Provai e Vede) ---------- */
const QK={special:'iasd-special-videos',testimony:'iasd-testimony-queue'};
const QN={special:'Músicas especiais',testimony:'Provai e Vede'};
const sel={special:null,testimony:null};
const qpos={special:-1,testimony:-1};
const qlist=kind=>{const x=rd(QK[kind],[]);return Array.isArray(x)?x.filter(valid):[]};
function qsave(kind,l){wr(QK[kind],l);renderQueue();renderAll()}
function qadd(kind,id,title){if(title)setTitle(id,title);const l=qlist(kind);if(l.includes(id)){toast('Esse vídeo já está na fila.');return}l.push(id);qsave(kind,l);toast('Adicionado à fila ('+l.length+').')}
function qrem(kind,id){qsave(kind,qlist(kind).filter(x=>x!==id))}
function qmove(kind,a,b){const l=qlist(kind);if(b<0||b>=l.length||a===b)return;const [x]=l.splice(a,1);l.splice(b,0,x);qsave(kind,l)}
function nextInQueue(kind){const l=qlist(kind);if(!l.length){toast('A fila está vazia.');return null}const cur=l.indexOf(sel[kind]);const i=(cur>=0?cur+1:qpos[kind]+1)%l.length;return l[i]}
async function playNext(kind){const id=nextInQueue(kind);if(!id)return;select(kind,id);await projectSelectedYouTube(kind)}
const curKind=()=>{const t=document.body.dataset.tool;return t==='testimony'?'testimony':'special'};
let dragFrom=-1;
function renderQueue(){
 const box=$('ambQueue');if(!box)return;const kind=curKind();const queue=qlist(kind);box.replaceChildren();
 queue.forEach(ensureTitle);
 const hd=h('div','q-head');hd.append(ic('queue'),h('h3','','Fila de reprodução · '+QN[kind]),h('span','q-count',queue.length+(queue.length===1?' item':' itens')),h('span','st-sp'));
 hd.append(btn('Projetar próximo','mp-blue',()=>playNext(kind),'play','Seleciona o próximo vídeo da fila e envia ao telão'),btn('Embaralhar','mp-btn',()=>{const l=qlist(kind);for(let i=l.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[l[i],l[j]]=[l[j],l[i]]}qsave(kind,l)},'shuffle'),btn('Limpar','mp-btn',async ()=>{if(qlist(kind).length&&(await IASDDialog.confirm('Limpar a fila de '+QN[kind]+'?')))qsave(kind,[])},'trash'));
 box.append(hd);
 if(!queue.length){const e=h('div','q-empty');e.append(ic('queue'),h('b','','A fila de reprodução está vazia.'),h('small','','Use “＋ Fila” nos resultados da pesquisa ou na biblioteca para montar a sequência.'));box.append(e);return}
 queue.forEach((id,i)=>{const r=h('div','q-row'+(sel[kind]===id?' is-sel':''));r.draggable=true;
  r.append(h('span','q-drag','⠿'),h('span','q-n',String(i+1)),thumb(id));
  const inf=h('div','amb-info');inf.append(h('b','',titleOf(id,'Vídeo '+(i+1))),h('small','',sel[kind]===id?'Selecionado':QN[kind]));
  const pb=h('button','amb-play');pb.type='button';pb.title='Selecionar';pb.setAttribute('aria-label','Selecionar vídeo '+(i+1));pb.append(ic('play'));pb.onclick=()=>select(kind,id);
  const up=btn('','amb-more',()=>qmove(kind,i,i-1),'up','Subir na fila'),dn=btn('','amb-more',()=>qmove(kind,i,i+1),'dn','Descer na fila'),x=btn('','amb-x',()=>qrem(kind,id),'x','Remover da fila');
  r.append(inf,pb,up,dn,x);
  r.ondragstart=e=>{dragFrom=i;r.classList.add('drag');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i))}catch(_){}};
  r.ondragend=()=>{dragFrom=-1;r.classList.remove('drag');box.querySelectorAll('.over').forEach(n=>n.classList.remove('over'))};
  r.ondragover=e=>{e.preventDefault();r.classList.add('over')};r.ondragleave=()=>r.classList.remove('over');
  r.ondrop=e=>{e.preventDefault();if(dragFrom>=0)qmove(kind,dragFrom,i)};
  box.append(r)})}
window.stQueueRender=renderQueue;

/* ---------- barra de ações do telão (mesma em todos os módulos) ---------- */
function actionsBar(kind){
 const bar=h('div','pj-actions');
 const go=btn('Projetar no telão','pj-go',()=>kind==='video'?projectOfferingVideo():projectSelectedYouTube(kind),'tv','Envia a seleção ao telão pelo IASD Projetor');
 const cl=btn('Fechar vídeo','pj-close',()=>closeVideo(kind),'x','Fecha o vídeo no telão e no preview (a janela de projeção continua)');
 const bk=btn('Tela preta','pj-black',()=>blackScreen(),'sq','Cobre o telão de preto sem fechar a janela');
 bar.append(go,cl,bk);
 if(kind==='ambient'){const n=h('p','pj-note','ⓘ “Fechar telão” não para a música ambiente. Para parar a música, use o botão “Fechar vídeo” aqui no preview.');bar.append(n)}
 return bar;
}
window.stActionsBar=actionsBar;
function closeVideo(kind){
 if(kind==='video'){const v=$('serviceVideo');if(v)try{stFadePause(v,900)}catch(e){}}
 if(kind==='testimony'){const p=$('testimonyPlayer');if(p)try{stFadePause(p,900)}catch(e){}}
 closePrivateYoutube();
}

/* ---------- cartão "selecionado" (embaixo de cada módulo) ---------- */
const embedOpen={special:false,testimony:false};
function renderNow(kind){
 const box=$(kind+'Now');if(!box)return;box.replaceChildren();const id=sel[kind];
 box.classList.toggle('has',!!id);
 if(!id){box.append(h('p','mm-none','Nenhum vídeo selecionado. Escolha um nos resultados, na galeria ou na fila.'),actionsBar(kind));syncGrow();return}
 ensureTitle(id);
 const row=h('div','mm-sel');row.append(thumb(id));const inf=h('div','amb-info');inf.append(h('small','','SELECIONADO'),h('b','',titleOf(id)));
 const acts=h('div','mm-sel-acts');
 if(kind==='testimony'){acts.append(btn('','amb-x',()=>{sel[kind]=null;selectedYouTube[kind]=null;embedOpen[kind]=false;renderNow(kind);renderQueue();renderAll()},'x','Limpar seleção'));row.append(inf,acts);box.append(row,actionsBar(kind));syncGrow();return}
 acts.append(btn(embedOpen[kind]?'Ocultar':'Ver','mp-btn',()=>{embedOpen[kind]=!embedOpen[kind];if(embedOpen[kind])youtubeEmbed(id,kind+'Embed');else $(kind+'Embed')?.replaceChildren();renderNow(kind)},'eye','Mostra o player aqui no painel (só para o sonoplasta)'));
 if(!queueHas(kind,id))acts.append(btn('Fila','mp-btn',()=>qadd(kind,id),'plus','Adicionar à fila'));
 if(!inLib(kind,id))acts.append(btn('Salvar','mp-btn',()=>libAdd(kind,{id,title:titleOf(id,'')}),'star','Salvar na biblioteca'));
 acts.append(btn('','amb-x',()=>{sel[kind]=null;selectedYouTube[kind]=null;embedOpen[kind]=false;renderNow(kind);renderQueue();renderAll()},'x','Limpar seleção'));
 row.append(inf,acts);
 const em=h('div','mm-embed');em.id=kind+'Embed';
 box.append(row,em,actionsBar(kind));
 if(embedOpen[kind])youtubeEmbed(id,kind+'Embed');
 syncGrow();resize();
}
const queueHas=(kind,id)=>qlist(kind).includes(id);
function select(kind,id){
 if(!valid(id))return;sel[kind]=id;selectedYouTube[kind]=id;embedOpen[kind]=false;
 const l=qlist(kind);const p=l.indexOf(id);if(p>=0)qpos[kind]=p;
 renderNow(kind);renderQueue();renderAll();toast('Selecionado: '+titleOf(id)+'. Toque em Projetar no telão.');
}

/* ---------- cartões de resultado / biblioteca ---------- */
function vrow(kind,it,o){
 o=o||{};const id=it.id;const r=h('div','amb-row'+(sel[kind]===id?' is-sel':''));
 const th=thumb(id);if(it.thumb&&!/ytimg/.test(it.thumb))th.src=it.thumb;
 const inf=h('div','amb-info');inf.append(h('b','',it.title||titleOf(id)),h('small','',([it.channel,fmtDur(it.duration),o.sub].filter(Boolean).join(' · ')||'YouTube')+' · pode ter anúncio'));
 const acts=h('div','vr-acts');
 acts.append(btn('','amb-play',()=>select(kind,id),'play','Selecionar para projetar'));
 if(!o.noQueue)acts.append(btn(queueHas(kind,id)?'Na fila':'Fila',queueHas(kind,id)?'mp-btn is-on':'mp-btn',()=>{if(it.title)setTitle(id,it.title);qadd(kind,id)},queueHas(kind,id)?'check':'plus','Adicionar à fila de reprodução'));
 if(o.save){const saved=inLib(kind,id);acts.append(btn(saved?'Salva':'Salvar',saved?'mp-btn is-on':'mp-btn',()=>{if(!saved)libAdd(kind,it)},saved?'starf':'star',saved?'Já está na biblioteca':'Salvar na biblioteca'))}
 (o.extra||[]).forEach(x=>acts.append(x));
 r.append(th,inf,acts);return r;
}
function tabs(boxId,onPane){
 const box=$(boxId);if(!box)return;
 box.querySelectorAll('button').forEach(b=>b.onclick=()=>{box.querySelectorAll('button').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-selected',on)});onPane(b.dataset.pane);syncGrow();resize()});
}
function paneShow(prefix,names,cur){names.forEach(n=>{const e=$(prefix+n[0].toUpperCase()+n.slice(1));if(e)e.hidden=n!==cur})}

/* ===================== MÚSICAS ESPECIAIS ===================== */
let spResults=[];
window.searchSpecialYouTube=async function(){
 const q=$('specialSearch').value.trim(),st=$('specialSearchStatus');
 if(!q){st.textContent='Digite o nome de uma música ou artista.';$('specialSearch').focus();return}
 st.textContent='Pesquisando no YouTube…';spResults=[];renderSpResults();
 try{spResults=await ytSearch(q);st.textContent=spResults.length?spResults.length+' resultado(s).':'Nenhum vídeo encontrado.'}
 catch(e){st.textContent=e.message}
 renderSpResults();
};
/* botão "Fechar resultados": libera a tela para colar um link ou escolher outra coisa */
function closeBtn(box,statusId,onClose){let b=box.previousElementSibling&&box.previousElementSibling.classList&&box.previousElementSibling.classList.contains('res-close')?box.previousElementSibling:null;const has=box.children.length>0;
 if(!has){if(b)b.remove();return}
 if(!b){b=h('button','mp-btn res-close');b.type='button';b.textContent='✕ Fechar resultados';b.style.cssText='margin:6px 0;align-self:flex-start';b.onclick=()=>{onClose();const st=$(statusId);if(st)st.textContent=''};box.parentNode.insertBefore(b,box)}}
function closeSpResults(){spResults=[];renderSpResults()}
function renderSpResults(){const box=$('specialSearchResults');if(!box)return;box.replaceChildren();spResults.forEach(it=>box.append(vrow('special',it,{save:true})));closeBtn(box,'specialSearchStatus',closeSpResults);resize()}
(function(){const i=$('specialSearch');if(i)i.addEventListener('search',()=>{if(!i.value.trim()){closeSpResults();const st=$('specialSearchStatus');if(st)st.textContent=''}})})();
function renderSpGallery(){
 const box=$('specialGalList');if(!box)return;box.replaceChildren();const q=($('specialGalQ').value||'').trim().toLowerCase();
 const items=lib('special').filter(x=>!q||titleOf(x.id,x.title).toLowerCase().includes(q));
 $('spGalN').textContent=String(lib('special').length);
 if(!items.length){const e=h('div','amb-empty');e.append(h('p','',lib('special').length?'Nada encontrado.':'A galeria está vazia. Pesquise uma música e toque em Salvar para guardá-la aqui.'));if(cloudNote)e.append(h('small','muted',cloudNote));box.append(e);return}
 items.forEach(it=>box.append(vrow('special',{...it,title:titleOf(it.id,it.title)},{extra:[btn('','amb-x',async ()=>{if((await IASDDialog.confirm('Remover da galeria?')))libDel('special',it.id)},'trash','Remover da galeria')]})));
}
window.addSpecial=function(select_){
 const id=youtubeId($('specialUrl').value||'');if(!id){toast('Cole um link válido do YouTube.');return}
 ensureTitle(id);if(select_)select('special',id);else qadd('special',id);$('specialUrl').value='';
};
window.addSpecialId=function(id){if(!valid(id))return;qadd('special',id)};
window.renderSpecial=function(){renderAll()};
window.selectSpecial=function(id){select('special',id)};
window.nextSpecial=function(){playNext('special')};
window.showGallery=function(){const t=$('spTabs')?.querySelector('[data-pane=gal]');t&&t.click()};
window.hideGallery=function(){};
tabs('spTabs',p=>{paneShow('spPane',['find','gal'],p);if(p==='gal')renderSpGallery()});
$('specialGalQ').addEventListener('input',renderSpGallery);

/* ===================== PROVAI E VEDE ===================== */
const SEEN='iasd-testimony-seen';
const pool=()=>[...new Set([...BUILTIN.map(v=>v.id),...lib('testimony').filter(x=>x.pool!==false).map(x=>x.id)])];
window.youtubeList=(function(orig){return function(kind){if(kind==='testimony')return pool();return orig.apply(this,arguments)}})(window.youtubeList);
const seenList=()=>{const s=rd(SEEN,[]);return Array.isArray(s)?s:[]};
window.randomYouTube=function(){
 const ids=pool();if(!ids.length){toast('A biblioteca está vazia.');return}
 let seen=seenList().filter(x=>ids.includes(x));let avail=ids.filter(id=>!seen.includes(id));
 if(!avail.length){seen=[];avail=ids}
 const id=avail[Math.floor(Math.random()*avail.length)];seen.push(id);wr(SEEN,seen);
 select('testimony',id);const b=builtinOf(id);
 $('testimonyChosen').textContent=(b?b.title+' · '+b.year:titleOf(id))+' — sorteado';
 renderTsDraw();
};
window.resetYouTubeHistory=function(){try{localStorage.removeItem(SEEN)}catch(e){}renderTsDraw();toast('Histórico reiniciado: todos os vídeos voltam ao sorteio.')};
function renderTsDraw(){
 const ids=pool(),seen=seenList().filter(x=>ids.includes(x));
 $('tsLeft').textContent=(ids.length-seen.length)+' de '+ids.length;
 const box=$('tsSeen');box.replaceChildren();
 if(!seen.length){box.append(h('p','amb-empty muted','Nenhum sorteado ainda nesta rodada.'));return}
 seen.slice(-6).reverse().forEach(id=>box.append(vrow('testimony',{id,title:titleOf(id)},{noQueue:false,save:true})));
}
let tsQ='';
let tsRecent=false;
window.tsToggleRecent=function(){tsRecent=!tsRecent;const b=$('tsRecentBtn');if(b){b.classList.toggle('on',tsRecent);b.setAttribute('aria-pressed',tsRecent)}renderTsLib();const l=$('tsLibList');if(l)l.scrollTop=0};
function renderTsLib(){
 const box=$('tsLibList');if(!box)return;box.replaceChildren();const ql=($('tsLibQ').value||'').trim().toLowerCase();
 const extras=lib('testimony'),all=[...BUILTIN.map(v=>({id:v.id,title:v.title,sub:v.d?v.d.split('-').reverse().join('/'):String(v.year||''),d:v.d||'',builtin:true})),...extras.filter(x=>!builtinOf(x.id)).map(x=>({...x,title:titleOf(x.id,x.title),sub:'Adicionado',builtin:false}))];
 $('tsLibN').textContent=String(all.length);
 let view=all.filter(x=>!ql||x.title.toLowerCase().includes(ql));
 if(tsRecent){/* mais novos primeiro (data de exibição); os adicionados por você vêm antes; mostra os 20 mais novos */const ix=new Map(all.map((x,k)=>[x.id,k]));view=view.sort((a,b)=>((a.builtin===false?1:0)!==(b.builtin===false?1:0))?(a.builtin===false?-1:1):String(b.d||'').localeCompare(String(a.d||''))||(ix.get(a.id)-ix.get(b.id))).slice(0,20)}
 if(!view.length){box.append(h('p','amb-empty muted','Nenhum vídeo encontrado.'));return}
 view.forEach(it=>{
  const extra=[];
  if(!it.builtin){
   const on=it.pool!==false;
   extra.push(btn(on?'No sorteio':'Fora',on?'mp-btn is-on':'mp-btn',()=>{const l=lib('testimony').find(x=>x.id===it.id);if(l){l.pool=!on;libSave('testimony');cloudPool('testimony',it.id,l.pool);renderAll()}},'dice','Escolha se este vídeo participa do sorteio'));
   extra.push(btn('','amb-x',async ()=>{if((await IASDDialog.confirm('Remover da biblioteca?')))libDel('testimony',it.id)},'trash','Remover da biblioteca'));
  }
  box.append(vrow('testimony',it,{extra,sub:it.sub}));
 });
}
let tsRes=[];
window.tsYtSearch=async function(){
 const q=$('tsYtQ').value.trim(),st=$('tsYtStatus');if(!q){st.textContent='Digite o que procurar.';return}
 st.textContent='Pesquisando no YouTube…';tsRes=[];renderTsRes();
 try{tsRes=await ytSearch(q);st.textContent=tsRes.length?tsRes.length+' resultado(s).':'Nenhum vídeo encontrado.'}catch(e){st.textContent=e.message}
 renderTsRes();
};
function closeTsRes(){tsRes=[];renderTsRes()}
function renderTsRes(){const box=$('tsYtRes');if(!box)return;box.replaceChildren();tsRes.forEach(it=>box.append(vrow('testimony',it,{save:true})));closeBtn(box,'tsYtStatus',closeTsRes);resize()}
(function(){const i=$('tsYtQ');if(i)i.addEventListener('search',()=>{if(!i.value.trim()){closeTsRes();const st=$('tsYtStatus');if(st)st.textContent=''}})})();
window.tsAddUrl=function(now){const id=youtubeId($('tsUrl').value||'');if(!id){toast('Cole um link válido do YouTube.');return}ensureTitle(id);if(now)select('testimony',id);else qadd('testimony',id);$('tsUrl').value=''};
window.tsLocal=function(){const v=$('testimonyPlayer');if(v){v.hidden=false}$('tsLocalAct').hidden=false;syncGrow();resize()};
/* “Gerenciar vídeos adicionais” e “Importar vídeo” antigos agora vivem na aba Biblioteca */
window.toggleTestimonyDrawer=function(){const t=$('tsTabs')?.querySelector('[data-pane=lib]');t&&t.click()};
window.closeTestimonyProjection=function(){closeVideo('testimony')};
tabs('tsTabs',p=>{paneShow('tsPane',['draw','lib','yt'],p);if(p==='lib')renderTsLib();if(p==='draw')renderTsDraw()});
$('tsLibQ').addEventListener('input',renderTsLib);
$('tsYtQ').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();tsYtSearch()}});

/* ===================== DÍZIMOS E INFORMATIVOS ===================== */
const BASE_KINDS=['Dízimos e ofertas','Informativo','Vídeo especial'];
let vlCats=(()=>{try{const a=JSON.parse(localStorage.getItem('iasd-vl-cats')||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'):[]}catch(e){return[]}})();
function vlSaveCats(){try{localStorage.setItem('iasd-vl-cats',JSON.stringify(vlCats))}catch(e){}}
/* categorias = as 3 fixas + as que já existem nos vídeos (compartilhadas) + as recém-criadas neste aparelho */
const NOCAT='Sem categoria';
let vlHidden=(()=>{try{const a=JSON.parse(localStorage.getItem('iasd-vl-hidden')||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}})();
function vlSaveHidden(){try{localStorage.setItem('iasd-vl-hidden',JSON.stringify(vlHidden))}catch(e){}}
function kinds(){const used=vlItems.map(x=>vlKind(x));const out=BASE_KINDS.filter(k=>!vlHidden.includes(k)||used.includes(k));[...used,...vlCats].forEach(k=>{if(k&&!out.some(o=>o.toLowerCase()===k.toLowerCase()))out.push(k)});return out}
async function vlDelCat(k){
 const its=vlItems.filter(x=>vlKind(x)===k);
 if(its.length){
  if(!(await IASDDialog.confirm('Apagar a categoria “'+k+'”? Os '+its.length+' vídeo(s) não serão excluídos: passam para “'+NOCAT+'”.')))return;
  try{const c=offeringCloud();const {error}=await c.from('iasd_offering_videos').update({kind:NOCAT}).in('id',its.map(x=>x.id));if(error)throw error;
   its.forEach(x=>{x.kind=NOCAT})}catch(e){toast('Não foi possível mover os vídeos: '+e.message);return}
 }else if(!(await IASDDialog.confirm('Apagar a categoria vazia “'+k+'”?')))return;
 vlCats=vlCats.filter(c=>c!==k);vlSaveCats();if(BASE_KINDS.includes(k)&&!vlHidden.includes(k)){vlHidden.push(k);vlSaveHidden()}
 if(vlFilter===k)vlFilter='';renderVl();toast('Categoria “'+k+'” apagada.');
}
async function vlNewCat(){
 const n=((await IASDDialog.prompt('Nome da nova categoria:',''))||'').trim().replace(/\s+/g,' ').slice(0,30);if(!n)return;
 const ex=kinds().find(k=>k.toLowerCase()===n.toLowerCase());if(ex&&true){vlFilter=ex;renderVl();toast('Essa categoria já existe.');return}
 vlHidden=vlHidden.filter(h2=>h2.toLowerCase()!==n.toLowerCase());vlSaveHidden();vlCats.push(n);vlSaveCats();vlFilter=n;renderVl();toast('Categoria “'+n+'” criada. Escolha-a ao enviar ou editar um vídeo.');
}
let vlItems=[],vlFilter='',vlFile=null,vlSel=null,vlBusy=false;
const OFFER_BUCKET_='iasd-offering-videos';
function vlUrl(item){const c=offeringCloud();const {data}=c.storage.from(OFFER_BUCKET_).getPublicUrl(item.storage_path);return data&&data.publicUrl}
function vlKind(it){const k=(it.kind||'').trim();return k?k:(/inform/i.test(it.title||'')?'Informativo':'Dízimos e ofertas')}
function vlDate(s){try{return new Date(s).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return''}}
window.__offNew=true;
window.renderOfferings=async function(){
 const box=$('offeringLibrary');if(!box)return;
 if(!vlItems.length)box.replaceChildren(h('p','amb-empty muted','Carregando vídeos do site…'));
 try{
  const c=offeringCloud();const {data,error}=await c.from('iasd_offering_videos').select('*').order('created_at',{ascending:false});if(error)throw error;vlItems=data||[];
 }catch(e){vlItems=[];box.replaceChildren(h('p','amb-empty muted','Não foi possível carregar a biblioteca: '+e.message));renderVlChips();return}
 renderVl();
};
function renderVlChips(){
 const box=$('vlChips');if(!box)return;box.replaceChildren();
 const ks=kinds();if(vlFilter&&!ks.includes(vlFilter))vlFilter='';
 ['',...ks].forEach(k=>{const n=k?vlItems.filter(x=>vlKind(x)===k).length:vlItems.length;const b=h('button',k===vlFilter?'on':'',(k||'Todos')+' · '+n);b.type='button';b.onclick=()=>{vlFilter=k;renderVl()};box.append(b);
});
 const add=h('button','vl-catadd','+ Nova categoria');add.type='button';add.onclick=vlNewCat;box.append(add);
 const sel=$('vlKind');if(sel){const cur=sel.value||vlFilter;sel.replaceChildren(...ks.map(k=>{const o=document.createElement('option');o.textContent=k;return o}));if(cur&&ks.includes(cur))sel.value=cur}
}
function renderVl(){
 renderVlChips();const box=$('offeringLibrary');box.replaceChildren();
 const items=vlItems.filter(x=>!vlFilter||vlKind(x)===vlFilter);
 if(!items.length){const e=h('div','amb-empty vl-empty');e.append(ic('cam'),h('b','',vlItems.length?'Nenhum vídeo nesta categoria.':'A biblioteca de vídeos está vazia.'),h('small','','Use “Enviar vídeo” para guardar o vídeo dos dízimos ou um informativo. Ele fica disponível para toda a equipe.'));box.append(e);resize();return}
 items.forEach(it=>{
  const card=h('article','vl-card'+(vlSel&&vlSel.id===it.id?' is-sel':''));
  const tv=h('div','vl-thumb');const v=document.createElement('video');v.preload='metadata';v.muted=true;v.playsInline=true;v.addEventListener('loadedmetadata',()=>{const d=v.duration||0;const t=it.cover_at!=null?+it.cover_at:Math.min(Math.max(d*0.2,1),Math.max(d-.1,0));try{v.currentTime=Math.max(0,t)}catch(e){}});try{v.src=vlUrl(it)}catch(e){}tv.append(v);
  const tag=h('span','vl-tag',vlKind(it));tv.append(tag);
  tv.onclick=()=>vlChoose(it);tv.setAttribute('role','button');tv.tabIndex=0;tv.onkeydown=e=>{if(e.key==='Enter')vlChoose(it)};
  const info=h('div','vl-info');info.append(h('b','',it.title||'Vídeo'),h('small','',vlDate(it.created_at)));
  const acts=h('div','vl-acts');
  acts.append(btn('Selecionar','mp-blue',()=>vlChoose(it),'play'));
  card.append(tv,info,acts);box.append(card);
 });
 if(document.querySelector('.vl-mgr'))renderMgr();resize();
}
/* ===== pré-carregamento do vídeo selecionado: o arquivo já vai sendo preparado antes de projetar ===== */
let vlWarmEl=null,vlPrep={id:null,st:'idle'},vlPrepCh=null;
function vlWarmStop(){if(vlWarmEl){try{vlWarmEl.onprogress=vlWarmEl.oncanplaythrough=vlWarmEl.onerror=vlWarmEl.onloadedmetadata=null;vlWarmEl.removeAttribute('src');vlWarmEl.load()}catch(e){}vlWarmEl=null}vlPrep={id:null,st:'idle'}}
function vlPaintPrep(){
 const go=document.querySelector('#videoNowAct .pj-go');if(!go)return;
 let t='Projetar no telão',cls='';
 if(vlSel&&vlPrep.id===vlSel.id){if(vlPrep.st==='prep'){t='Preparando…';cls='is-prep'}else if(vlPrep.st==='ready'){t='Pronto para projetar';cls='is-ready'}}
 go.classList.remove('is-prep','is-ready');if(cls)go.classList.add(cls);
 const n=[...go.childNodes].reverse().find(x=>x.nodeType===3);if(n)n.textContent=t;else go.append(document.createTextNode(t));
 go.title=cls==='is-prep'?'O vídeo está sendo baixado em segundo plano. Você já pode projetar, mas pode demorar um pouco mais para abrir.':cls==='is-ready'?'Vídeo carregado: deve abrir quase na hora no telão.':'Envia a seleção ao telão pelo IASD Projetor';
}
function vlWarm(it){
 vlWarmStop();let url='';try{url=vlUrl(it)}catch(e){}if(!url)return;
 vlPrep={id:it.id,st:'prep'};const v=document.createElement('video');vlWarmEl=v;v.preload='auto';v.muted=true;v.playsInline=true;
 const done=()=>{if(vlWarmEl!==v||vlPrep.st==='ready')return;vlPrep.st='ready';vlPaintPrep()};
 const check=()=>{if(vlWarmEl!==v)return;try{const d=v.duration||0;const b=v.buffered;if(b.length&&d&&(b.end(b.length-1)>=Math.min(d-.25,20)))done()}catch(e){}};
 v.oncanplaythrough=done;v.onprogress=check;v.onloadedmetadata=check;
 v.onerror=()=>{if(vlWarmEl!==v)return;vlPrep.st='error';vlPaintPrep()};
 v.src=url;
 try{vlPrepCh??=new BroadcastChannel('iasd-preload');vlPrepCh.postMessage({type:'preload',url})}catch(e){}
 vlPaintPrep();
}
function vlChoose(it){
 vlSel=it;vlFile=null;$('vlUpBox').hidden=true;const v=$('serviceVideo');if(v){stMediaSource(v,vlUrl(it));v._iasdFile=null;v._iasdRemote=it}
 renderNowVideo();renderVl();vlWarm(it);toast('Selecionado: '+it.title+'.');
}
window.chooseOffering=vlChoose;
function renderNowVideo(){
 const box=$('videoNow'),head=$('videoNowHead'),act=$('videoNowAct'),v=$('serviceVideo');if(!box)return;
 head.replaceChildren();act.replaceChildren();box.classList.toggle('has',!!vlSel||!!vlFile);
 if(!vlSel&&!vlFile){vlWarmStop();v.hidden=true;head.append(h('p','mm-none','Nenhum vídeo selecionado. Escolha um da biblioteca ou envie um novo.'));act.append(actionsBar('video'));syncGrow();return}
 const row=h('div','mm-sel');const inf=h('div','amb-info');
 inf.append(h('small','',vlSel?'SELECIONADO · '+vlKind(vlSel).toUpperCase():'ARQUIVO DO COMPUTADOR · AINDA NÃO SALVO'),h('b','',vlSel?vlSel.title:vlFile.name));
 row.append(inf,btn('','amb-x',()=>{vlSel=null;vlFile=null;$('vlUpBox').hidden=true;stMediaSource(v,'');v._iasdRemote=null;v._iasdFile=null;renderNowVideo();renderVl()},'x','Limpar seleção'));
 head.append(row);v.hidden=false;act.append(actionsBar('video'));vlPaintPrep();syncGrow();resize();
}
/* escolher a capa (quadro do próprio vídeo) */
function vlCover(it){
 document.querySelector('.vl-cover')?.remove();
 const ov=h('div','vl-cover');ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Escolher capa');
 const box=h('div','vl-cover-box');const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=vlUrl(it);
 const rng=document.createElement('input');rng.type='range';rng.min='0';rng.max='1';rng.step='0.05';rng.value='0';rng.disabled=true;rng.setAttribute('aria-label','Momento do vídeo');
 const lab=h('small','vl-cover-t','Carregando vídeo…');
 const fmt=t=>{t=Math.max(0,t||0);return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')+'.'+Math.floor((t%1)*10)};
 v.addEventListener('loadedmetadata',()=>{rng.max=String(v.duration||1);rng.disabled=false;const t0=it.cover_at!=null?+it.cover_at:Math.min(Math.max(v.duration*0.2,1),Math.max(v.duration-.1,0));rng.value=String(t0);try{v.currentTime=t0}catch(e){}lab.textContent='Arraste para escolher o quadro · '+fmt(t0)});
 rng.oninput=()=>{try{v.currentTime=+rng.value}catch(e){}lab.textContent='Quadro em '+fmt(+rng.value)+' de '+fmt(v.duration)};
 const step=(d)=>{if(rng.disabled)return;const t=Math.min(Math.max(+rng.value+d,0),v.duration||0);rng.value=String(t);rng.oninput()};
 const row=h('div','vl-cover-row');
 const save=btn('Usar este quadro','mp-blue',async()=>{if(rng.disabled)return;save.disabled=true;
  try{const c=offeringCloud();const {error}=await c.from('iasd_offering_videos').update({cover_at:+(+rng.value).toFixed(2)}).eq('id',it.id);if(error)throw error;
   it.cover_at=+(+rng.value).toFixed(2);close();toast('Capa atualizada.');renderVl()}
  catch(e){save.disabled=false;toast('Não foi possível salvar a capa: '+e.message)}},'img');
 const close=()=>{document.removeEventListener('keydown',onKey);ov.remove();try{v.removeAttribute('src');v.load()}catch(e){}};
 const onKey=e=>{if(e.key==='Escape')close();else if(e.key==='ArrowLeft')step(-.5);else if(e.key==='ArrowRight')step(.5)};
 document.addEventListener('keydown',onKey);
 row.append(btn('−1 s','mp-btn',()=>step(-1)),btn('+1 s','mp-btn',()=>step(1)),save,btn('Cancelar','mp-btn',close));
 box.append(h('h3','','Escolher a capa'),h('p','muted',it.title||'Vídeo'),v,rng,lab,row);ov.append(box);ov.onclick=e=>{if(e.target===ov)close()};document.body.append(ov);
}
/* ===================== GERENCIAR VÍDEOS (popup) ===================== */
async function vlUpdate(it,patch){const c=offeringCloud();const {error}=await c.from('iasd_offering_videos').update(patch).eq('id',it.id);if(error)throw error;Object.assign(it,patch)}
async function vlRenameCat(k){
 const n=((await IASDDialog.prompt('Novo nome da categoria “'+k+'”:',k))||'').trim().replace(/\s+/g,' ').slice(0,30);if(!n||n===k)return;
 if(kinds().some(x=>x!==k&&x.toLowerCase()===n.toLowerCase())){toast('Já existe uma categoria com esse nome.');return}
 const its=vlItems.filter(x=>vlKind(x)===k);
 try{if(its.length){const c=offeringCloud();const {error}=await c.from('iasd_offering_videos').update({kind:n}).in('id',its.map(x=>x.id));if(error)throw error;its.forEach(x=>{x.kind=n})}}
 catch(e){toast('Não foi possível renomear: '+e.message);return}
 vlCats=vlCats.filter(c=>c!==k);if(!its.length)vlCats.push(n);vlSaveCats();if(BASE_KINDS.includes(k)&&!vlHidden.includes(k)){vlHidden.push(k);vlSaveHidden()}
 if(vlFilter===k)vlFilter=n;renderVl();toast('Categoria renomeada.');
}
window.vlManage=function(){
 if(document.querySelector('.vl-mgr'))return;
 const ov=h('div','vl-mgr');ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Gerenciar vídeos');
 const box=h('div','vl-mgr-box');ov.append(box);
 const close=()=>{document.removeEventListener('keydown',onKey);ov.remove()};
 const onKey=e=>{if(e.key==='Escape'&&!document.querySelector('.vl-cover'))close()};
 document.addEventListener('keydown',onKey);ov.onclick=e=>{if(e.target===ov)close()};ov._close=close;
 document.body.append(ov);renderMgr();
};
function renderMgr(){
 const ov=document.querySelector('.vl-mgr');if(!ov)return;const box=ov.firstElementChild;const top=box.scrollTop;box.replaceChildren();
 const head=h('div','vl-mgr-head');head.append(h('h3','','Gerenciar vídeos'),btn('','vl-mgr-x',()=>ov._close(),'x','Fechar'));
 const cs=h('section','vl-mgr-sec');cs.append(h('h4','','Categorias'));const chips=h('div','vl-mgr-cats');
 kinds().forEach(k=>{const n=vlItems.filter(x=>vlKind(x)===k).length;const c=h('span','vl-mgr-cat');c.append(h('b','',k),h('small','',String(n)));
  const rn=btn('','vl-mini',()=>vlRenameCat(k),'gear','Renomear categoria');c.append(rn);
  if(k!==NOCAT)c.append(btn('','vl-mini vl-mini-d',()=>vlDelCat(k),'trash','Apagar categoria'));chips.append(c)});
 chips.append(btn('+ Nova categoria','vl-catadd',vlNewCat));cs.append(chips);
 const ls=h('section','vl-mgr-sec');ls.append(h('h4','','Vídeos · '+vlItems.length));
 if(!vlItems.length)ls.append(h('p','muted','Nenhum vídeo na biblioteca ainda.'));
 vlItems.forEach(it=>{
  const row=h('div','vl-mgr-row');
  const th=h('button','vl-mgr-th');th.type='button';th.title='Escolher a capa';th.setAttribute('aria-label','Escolher a capa de '+(it.title||'vídeo'));
  const v=document.createElement('video');v.preload='metadata';v.muted=true;v.playsInline=true;v.addEventListener('loadedmetadata',()=>{const d=v.duration||0;const t=it.cover_at!=null?+it.cover_at:Math.min(Math.max(d*0.2,1),Math.max(d-.1,0));try{v.currentTime=Math.max(0,t)}catch(e){}});try{v.src=vlUrl(it)}catch(e){}
  th.append(v,h('span','vl-mgr-cov','Mudar capa'));th.onclick=()=>vlCover(it);
  const f=h('div','vl-mgr-f');
  const nm=document.createElement('input');nm.type='text';nm.maxLength=80;nm.value=it.title||'';nm.setAttribute('aria-label','Nome do vídeo');
  const save=async()=>{const t=nm.value.trim().slice(0,80);if(!t){nm.value=it.title||'';return}if(t===it.title)return;try{await vlUpdate(it,{title:t});toast('Nome salvo.');renderVl()}catch(e){nm.value=it.title||'';toast('Não foi possível salvar: '+e.message)}};
  nm.onchange=save;nm.onkeydown=e=>{if(e.key==='Enter')nm.blur()};
  const sel=document.createElement('select');sel.setAttribute('aria-label','Categoria');const ks=kinds();ks.forEach(k=>{const o=document.createElement('option');o.textContent=k;sel.append(o)});sel.value=vlKind(it);
  const on=document.createElement('option');on.textContent='+ Nova categoria…';on.value='__new';sel.append(on);
  sel.onchange=async()=>{let k=sel.value;
   if(k==='__new'){const n=((await IASDDialog.prompt('Nome da nova categoria:',''))||'').trim().replace(/\s+/g,' ').slice(0,30);if(!n){sel.value=vlKind(it);return}k=kinds().find(x=>x.toLowerCase()===n.toLowerCase())||n;if(!kinds().includes(k)){vlCats.push(k);vlSaveCats()}}
   try{await vlUpdate(it,{kind:k});toast('Movido para “'+k+'”.');renderVl()}catch(e){sel.value=vlKind(it);toast('Não foi possível mover: '+e.message)}};
  const meta=h('small','',vlDate(it.created_at));
  f.append(nm,sel,meta);
  const ac=h('div','vl-mgr-ac');ac.append(btn('Selecionar','mp-btn',()=>{vlChoose(it);ov._close()},'play'),btn('Excluir','mp-btn vl-del',()=>vlDelete(it),'trash'));
  row.append(th,f,ac);ls.append(row)});
 box.append(head,cs,ls);box.scrollTop=top;
}
async function vlDelete(it){
 if(!(await IASDDialog.confirm('Excluir “'+it.title+'” da biblioteca compartilhada?')))return;
 try{const c=offeringCloud();const {error}=await c.from('iasd_offering_videos').delete().eq('id',it.id);if(error)throw error;
  const {error:se}=await c.storage.from(OFFER_BUCKET_).remove([it.storage_path]);
  if(vlSel&&vlSel.id===it.id){vlSel=null;renderNowVideo()}
  toast(se?'Registro removido, mas o arquivo precisa de limpeza: '+se.message:'Vídeo excluído.');await renderOfferings()}catch(e){toast('Erro ao excluir: '+e.message)}
}
window.vlPick=function(input){
 const f=input.files&&input.files[0];if(!f)return;input.value='';
 const okTypes=['video/mp4','video/webm','video/quicktime','video/x-m4v','video/ogg'];
 if(!okTypes.includes(f.type)){toast('Formato não permitido. Use MP4, WebM ou MOV.');return}
 if(f.size>100*1024*1024){toast('O limite por vídeo é 100 MB. Comprima o arquivo antes de enviar.');return}
 vlFile=f;const v=$('serviceVideo');loadVideoFile(f,v);
 vlSel=null;renderNowVideo();renderVl();$('vlName').value=f.name.replace(/\.[^.]+$/,'').slice(0,80);$('vlUpBox').hidden=false;$('vlUpSt').textContent=(f.size/1048576).toFixed(1)+' MB · pronto para salvar.';$('vlName').focus();resize();
};
function loadVideoFile(f,v){v._iasdFile=f;v._iasdRemote=null;const u=URL.createObjectURL(f);urls.set('serviceVideo',u);stMediaSource(v,u);IASDAudio.volume(v,muted?0:volume);v.hidden=false}
window.vlCancel=function(){vlFile=null;$('vlUpBox').hidden=true;const v=$('serviceVideo');if(v&&v._iasdFile){stMediaSource(v,'');v._iasdFile=null}renderNowVideo();resize()};
window.vlProjectLocal=function(){if(!vlFile){toast('Escolha um vídeo primeiro.');return}projectLocalMedia('serviceVideo','video')};
window.vlSave=async function(){
 if(!vlFile||vlBusy)return;vlBusy=true;const b=$('vlSave');b.disabled=true;$('vlUpSt').textContent='Enviando vídeo… não feche esta janela.';
 try{
  const c=offeringCloud(),user=window.parent.iasdCurrentUser?.();if(!user)throw Error('Entre na conta de sonoplastia antes de enviar vídeos.');
  const path=user.id+'/'+crypto.randomUUID()+'.'+((vlFile.name.split('.').pop()||'mp4').toLowerCase());
  const up=await c.storage.from(OFFER_BUCKET_).upload(path,vlFile,{contentType:vlFile.type,upsert:false});if(up.error)throw up.error;
  const title=($('vlName').value.trim()||vlFile.name).slice(0,80),kind=$('vlKind').value;
  let r=await c.from('iasd_offering_videos').insert({title,storage_path:path,uploaded_by:user.id,kind});
  if(r.error)r=await c.from('iasd_offering_videos').insert({title,storage_path:path,uploaded_by:user.id});
  if(r.error){await c.storage.from(OFFER_BUCKET_).remove([path]);throw r.error}
  toast('Vídeo salvo na biblioteca.');vlFile=null;$('vlUpBox').hidden=true;
  const v=$('serviceVideo');if(v){stMediaSource(v,'');v._iasdFile=null}
  renderNowVideo();await renderOfferings();
 }catch(e){$('vlUpSt').textContent='Não foi possível salvar: '+(e.message||e)}
 finally{vlBusy=false;b.disabled=false;resize()}
};
/* funções antigas removidas da tela */
window.migrateLocalOfferings=function(){};
window.prepareOffering=function(){toast('O vídeo dos dízimos agora é escolhido na biblioteca.')};
window.saveOffering=window.vlSave;

/* ===================== BÍBLIA DE PROJEÇÃO ===================== */
window.biblePrev=function(){const v=$('verse').value.trim();if(!/^\d+$/.test(v)){toast('Para voltar, selecione um único versículo.');return}if(Number(v)<=1){toast('Este já é o primeiro versículo do capítulo.');return}$('verse').value=String(Number(v)-1);searchBible()};
window.bibleRecentClear=async function(){if(!bibleRecentList().length){toast('Não há passagens recentes.');return}if(!(await IASDDialog.confirm('Apagar a lista de passagens recentes?')))return;try{localStorage.removeItem('iasd-studio-bible-recent')}catch(e){}bibleRecentRender();toast('Passagens recentes apagadas.')};

/* ---------- janela do módulo alinhada ao preview ---------- */
function growNeeded(){
 const t=document.body.dataset.tool;
 if(t==='special')return !!sel.special;
 if(t==='testimony')return !!sel.testimony||(!$('testimonyPlayer').hidden);
 if(t==='video')return !!vlSel||!!vlFile;
 return false;
}
function syncGrow(){
 const t=document.body.dataset.tool,w=t&&$(t);
 document.querySelectorAll('main>.work').forEach(x=>x.classList.remove('grow'));
 if(w&&growNeeded())w.classList.add('grow');
 alignHeight();
}
function alignHeight(){
 const left=document.querySelector('.st-left');if(!left)return;
 const px=Math.round(left.getBoundingClientRect().height);if(px>200)document.documentElement.style.setProperty('--stH',px+'px');
}
if('ResizeObserver' in window){const ro=new ResizeObserver(()=>{alignHeight();resize()});const l=document.querySelector('.st-left');if(l)ro.observe(l)}
addEventListener('resize',alignHeight);
const _showTool=window.showTool;
window.showTool=function(n){_showTool.apply(this,arguments);renderQueue();syncGrow()};

function renderAll(){renderSpResults();renderSpGallery();renderTsDraw();renderTsLib();renderTsRes();renderNow('special');renderNow('testimony');renderNowVideo();renderQueue();syncGrow();resize()}

/* ---------- aviso rápido (toast) ---------- */
(function(){const t=h('div','mm-toast');t.id='mmToast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.append(t)})();

/* ---------- partida ---------- */
(async function init(){
 renderAll();
 ['special','testimony'].forEach(libSync);
 renderOfferings();
 try{const t=sessionStorage.getItem('iasd-studio-tool');if(t)showTool(t)}catch(e){}
})();
})();
