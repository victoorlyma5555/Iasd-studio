/* Hinário no Studio — biblioteca de hinos em ÁUDIO (antigo e novo) + letras sempre à mão.
   Áudios: arquivos da própria igreja, guardados no Supabase (bucket privado iasd-hymn-audio). Sem YouTube.
   Letras: /data/hinario-hasd.json e /data/hinario-nha.json. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const ED={antigo:{nome:'Hinário Adventista',sub:'Antigo · 1996',url:'/data/hinario-hasd.json'},novo:{nome:'Novo Hinário',sub:'Novo · 2022',url:'/data/hinario-nha.json'}};
const BUCKET='iasd-hymn-audio';
const S={ed:'antigo',data:{},status:{},q:'',sel:null,idx:-1,recent:[],view:'lib',filter:'all',audio:{},aStatus:{},aErr:'',limit:80,queue:[],cur:null,withLyrics:false,busy:'',msg:''};
try{S.ed=localStorage.getItem('iasd-sth-ed')||'antigo';S.recent=JSON.parse(localStorage.getItem('iasd-sth-recent')||'[]');S.withLyrics=localStorage.getItem('iasd-sth-wl')==='1'}catch(e){}
const pad=n=>String(n).padStart(3,'0');
const cloud=()=>{try{return window.parent&&window.parent.iasdCloud||null}catch(e){return null}};
const me=()=>{try{return window.parent.iasdCurrentUser&&window.parent.iasdCurrentUser()}catch(e){return null}};
function clean(s){return String(s||'').replace(/\s+([,.;:!?])/g,'$1').replace(/^\s*\d+\.\s*/,'').trim()}
function norm(raw){return (Array.isArray(raw)?raw:[]).map(x=>{let v=(x.v||[]).map(clean).filter(Boolean);if(v.length>1&&fold(v[0])===fold(x.t))v.shift();return{n:Number(x.n),t:String(x.t||'').trim(),est:v,key:fold(x.t),body:fold(v.join(' '))}}).filter(h=>h.n)}
const list=(ed)=>S.data[ed||S.ed]||[];
const find=(ed,n)=>list(ed).find(h=>h.n===n);
const fmt=t=>{t=Math.floor(t||0);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
const say=m=>{S.msg=m;if(typeof window.feedback==='function')try{window.feedback(m)}catch(e){}};

/* ---------- dados ---------- */
async function loadLyrics(id){
 if(S.data[id]||S.status[id]==='loading')return;S.status[id]='loading';paint();
 try{const r=await fetch(ED[id].url);if(!r.ok)throw 0;S.data[id]=norm(await r.json());S.status[id]='ok'}catch(e){S.status[id]='err'}
 paint();
}
async function loadAudio(force){
 const c=cloud();if(!c){S.aStatus.all='nocloud';paint();return}
 if(S.aStatus.all==='ok'&&!force)return;S.aStatus.all='loading';paint();
 try{
  const r=await c.from('iasd_hymn_audio').select('edition,number,storage_path,file_name,size_bytes');
  if(r.error)throw r.error;
  S.audio={antigo:{},novo:{}};(r.data||[]).forEach(a=>{(S.audio[a.edition]||(S.audio[a.edition]={}))[a.number]=a});
  S.aStatus.all='ok';S.aErr='';
 }catch(e){S.aStatus.all='err';S.aErr=/relation|does not exist|schema cache/i.test(e.message||'')?'Falta rodar o SQL docs/supabase-hinario-audio.sql no Supabase.':(e.message||'Falha ao carregar os áudios.')}
 paint();
}
/* ---------- pasta do computador (sem enviar nada: toca direto dos arquivos da igreja) ---------- */
S.local={antigo:{},novo:{}};S.lstat={};
const hasLocal=(ed,n)=>!!(S.local[ed]&&S.local[ed][n]);
const hasAudio=(ed,n)=>hasLocal(ed,n)||!!(S.audio[ed]&&S.audio[ed][n]);
const countAudio=ed=>{const k=new Set(Object.keys(S.audio[ed]||{}));Object.keys(S.local[ed]||{}).forEach(x=>k.add(x));return k.size};
const AUD=/\.(mp3|m4a|aac|wav|ogg|opus|flac|mp4)$/i;
function numOf(name){const b=String(name||'').replace(/\.[^.]+$/,'');
 let m=/^\s*(?:hino\s*(?:n[º°o.]*)?\s*)?0*(\d{1,3})(?!\d)/i.exec(b);if(m&&+m[1]>0)return +m[1];
 const g=(b.match(/\d+/g)||[]);const pad3=g.filter(x=>x.length>=3&&+x>0&&+x<1000);const pick=pad3.length?pad3[pad3.length-1]:g.filter(x=>+x>0&&+x<1000).pop();return pick?+pick:0}
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('iasd-sth-fs',1);r.onupgradeneeded=()=>r.result.createObjectStore('h');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function idbGet(k){try{const d=await idb();return await new Promise(res=>{const q=d.transaction('h').objectStore('h').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)})}catch(e){return null}}
async function idbSet(k,v){try{const d=await idb();await new Promise(res=>{const t=d.transaction('h','readwrite');t.objectStore('h').put(v,k);t.oncomplete=res;t.onerror=res})}catch(e){}}
async function walk(dir,out,depth){
 for await(const [name,e] of dir.entries()){
  if(e.kind==='directory'){if(depth<4)await walk(e,out,depth+1)}
  else if(AUD.test(name)){const n=numOf(name);if(n&&!out[n])out[n]={handle:e,name}}}
}
async function indexHandle(ed,h){
 S.busy='Lendo a pasta de hinos…';paintBar();const out={};
 try{await walk(h,out,0)}catch(e){S.busy='';say('Não consegui ler a pasta: '+(e.message||e));return}
 const max=list(ed).length;if(max)Object.keys(out).forEach(n=>{if(+n>max)delete out[n]});
 S.local[ed]=out;S.lstat[ed]='ok';S.busy='';
 say(Object.keys(out).length+' hinos encontrados na pasta ('+ED[ed].nome+'). Eles tocam direto do computador, sem internet.');paint();
}
function indexFiles(ed,files){
 const out={};[...files].forEach(f=>{if(!AUD.test(f.name||''))return;const n=numOf(f.name);if(n&&!out[n])out[n]={file:f,name:f.name}});
 const max=list(ed).length;if(max)Object.keys(out).forEach(n=>{if(+n>max)delete out[n]});
 S.local[ed]=out;S.lstat[ed]='ok';say(Object.keys(out).length+' hinos encontrados na pasta ('+ED[ed].nome+'). Valem até fechar esta página (neste navegador, use Chrome ou Edge para lembrar a pasta).');paint();
}
async function connectFolder(){
 const ed=S.ed;
 if(window.showDirectoryPicker){
  try{const h=await window.showDirectoryPicker({id:'hinos-'+ed,mode:'read'});await idbSet(ed,h);await indexHandle(ed,h)}
  catch(e){if(e&&e.name!=='AbortError')say('Não foi possível abrir a pasta: '+(e.message||e))}
 }else{
  const i=document.createElement('input');i.type='file';i.webkitdirectory=true;i.multiple=true;i.onchange=()=>{if(i.files.length)indexFiles(ed,i.files)};i.click();
 }
}
async function reconnectFolder(ed){
 const h=await idbGet(ed);if(!h)return;
 try{const p=await h.requestPermission({mode:'read'});if(p==='granted')await indexHandle(ed,h);else say('Permissão negada para a pasta.')}catch(e){say('Não foi possível reconectar: '+(e.message||e))}
}
async function restoreLocal(){
 for(const ed of Object.keys(ED)){
  const h=await idbGet(ed);if(!h)continue;
  try{const p=await h.queryPermission({mode:'read'});if(p==='granted')await indexHandle(ed,h);else{S.lstat[ed]='perm';paint()}}catch(e){}
 }
}

/* ---------- envio ---------- */
const extOf=f=>{const m=/\.(mp3|m4a|aac|wav|ogg|webm|mp4)$/i.exec(f.name||'');return m?m[1].toLowerCase():(/mpeg/.test(f.type)?'mp3':'mp3')};
async function uploadOne(ed,n,file){
 const c=cloud(),u=me();if(!c)throw Error('Conexão com o site indisponível. Abra o Studio pelo IASD APP.');if(!u)throw Error('Entre na conta de sonoplasta para enviar áudios.');
 if(file.size>50*1024*1024)throw Error('O limite é 50 MB por arquivo.');
 const path=ed+'/'+pad(n)+'.'+extOf(file);
 const old=S.audio[ed]&&S.audio[ed][n];
 const up=await c.storage.from(BUCKET).upload(path,file,{upsert:true,contentType:file.type||'audio/mpeg',cacheControl:'3600'});
 if(up.error)throw up.error;
 if(old&&old.storage_path!==path)try{await c.storage.from(BUCKET).remove([old.storage_path])}catch(e){}
 const row={edition:ed,number:n,storage_path:path,file_name:String(file.name||'').slice(0,160),size_bytes:file.size};
 const r=await c.from('iasd_hymn_audio').upsert(row,{onConflict:'edition,number'});if(r.error)throw r.error;
 (S.audio[ed]||(S.audio[ed]={}))[n]=row;delete urlCache[ed+'|'+n];
}
async function removeOne(ed,n){
 const a=S.audio[ed]&&S.audio[ed][n];if(!a)return;
 const ok=window.IASDDialog?await IASDDialog.confirm('Remover o áudio do hino '+n+' · '+((find(ed,n)||{}).t||'')+'?',{ok:'Remover áudio'}):confirm('Remover o áudio?');
 if(!ok)return;
 const c=cloud();try{await c.storage.from(BUCKET).remove([a.storage_path]);const r=await c.from('iasd_hymn_audio').delete().eq('edition',ed).eq('number',n);if(r.error)throw r.error;delete S.audio[ed][n];delete urlCache[ed+'|'+n];say('Áudio removido.')}catch(e){say('Não foi possível remover: '+(e.message||e))}
 paint();
}
async function bulk(files){
 const ed=S.ed;const arr=[...files];let ok=0;const bad=[];
 for(let i=0;i<arr.length;i++){
  const f=arr[i],m=/(\d{1,3})/.exec(f.name);S.busy='Enviando '+(i+1)+' de '+arr.length+'…';paintBar();
  if(!m||+m[1]<1){bad.push(f.name+' (sem número no nome)');continue}
  const n=+m[1];if(list(ed).length&&!find(ed,n)){bad.push(f.name+' (hino '+n+' não existe)');continue}
  try{await uploadOne(ed,n,f);ok++}catch(e){bad.push(f.name+' ('+(e.message||'erro')+')')}
 }
 S.busy='';
 say(ok+' áudio'+(ok===1?'':'s')+' enviado'+(ok===1?'':'s')+(bad.length?'. Falharam: '+bad.slice(0,4).join('; ')+(bad.length>4?'…':''):'.'));
 paint();
}

/* ---------- player ---------- */
const urlCache={};
let objUrl='';
async function urlFor(ed,n){
 const L=S.local[ed]&&S.local[ed][n];
 if(L){const f=L.file||await L.handle.getFile();if(objUrl)try{URL.revokeObjectURL(objUrl)}catch(e){}objUrl=URL.createObjectURL(f);return objUrl}
 const k=ed+'|'+n,hit=urlCache[k];if(hit&&hit.exp>Date.now())return hit.url;
 const a=S.audio[ed]&&S.audio[ed][n];if(!a)throw Error('Este hino ainda não tem áudio.');
 const r=await cloud().storage.from(BUCKET).createSignedUrl(a.storage_path,3600);
 if(r.error)throw r.error;urlCache[k]={url:r.data.signedUrl,exp:Date.now()+50*60*1000};return r.data.signedUrl;
}
function audioEl(){return $('sthAudio')}
async function play(ed,n,opts){
 const a=audioEl();if(!a)return;
 try{
  const url=await urlFor(ed,n);
  S.cur={ed,n};a.src=url;a.volume=typeof window.volume==='number'?Math.min(1,Math.max(0,window.volume)):1;await a.play();
  const h=find(ed,n);
  if(S.withLyrics&&h&&!(opts&&opts.silent))projectLyrics(h,ed);
  say('Tocando: '+n+' · '+(h?h.t:''));
 }catch(e){say('Não foi possível tocar: '+(e&&e.message||e))}
 paintPlayer();paint();
}
function projectLyrics(h,ed){
 if(typeof window.project!=='function'||!h)return;
 window.project('IASD_BIBLE:'+JSON.stringify({ref:'Hino '+h.n+' · '+h.t,text:h.est.map((e,i)=>(i+1)+'. '+e).join('\n\n')}));
}
function next(dir){
 if(S.queue.length&&dir>0){const q=S.queue.shift();play(q.ed,q.n);return}
 const c=S.cur;if(!c)return;const ls=list(c.ed).filter(h=>hasAudio(c.ed,h.n));const i=ls.findIndex(h=>h.n===c.n);const t=ls[i+(dir>0?1:-1)];if(t)play(c.ed,t.n)
}

/* ---------- ações ---------- */
function pick(n,ed){
 const e=ed||S.ed,h=find(e,n);if(!h)return;S.ed=e;S.sel=h;S.idx=-1;S.view='lyr';
 S.recent=[{ed:e,n:h.n,t:h.t}].concat(S.recent.filter(r=>!(r.ed===e&&r.n===h.n))).slice(0,8);
 try{localStorage.setItem('iasd-sth-recent',JSON.stringify(S.recent));localStorage.setItem('iasd-sth-ed',e)}catch(x){}
 const hn=$('hymnNumber'),nm=$('hymnName');if(hn)hn.value=h.n;if(nm)nm.value=h.t;paint();
}
function send(text,ref){if(typeof window.project!=='function')return;window.project('IASD_BIBLE:'+JSON.stringify({ref,text}));say('Enviado ao telão: '+ref)}
const refOf=(h,tag)=>'Hino '+h.n+' · '+h.t+(tag?' · '+tag:'');
const api={
 ed(id){S.ed=id;S.sel=null;S.idx=-1;S.limit=80;try{localStorage.setItem('iasd-sth-ed',id)}catch(e){}loadLyrics(id);paint()},
 view(v){S.view=v;if(v==='lib')S.sel=null;paint()},
 input(v){S.q=v;S.limit=80;if(S.view==='lyr'&&S.sel){S.sel=null}paintBody(true)},
 filter(f){S.filter=f;S.limit=80;paint()},
 more(){S.limit+=120;paintBody()},
 pick,
 recent(ed,n){S.ed=ed;loadLyrics(ed).then(()=>pick(n,ed));if(S.data[ed])pick(n,ed)},
 all(){const h=S.sel;if(!h)return;S.idx=-2;send(h.est.map((e,i)=>(i+1)+'. '+e).join('\n\n'),refOf(h));paint()},
 verse(i){const h=S.sel;if(!h||!h.est[i])return;S.idx=i;send(h.est[i],refOf(h,'Estrofe '+(i+1)));paint()},
 step(d){const h=S.sel;if(!h)return;const i=S.idx<0?(d>0?0:h.est.length-1):Math.max(0,Math.min(h.est.length-1,S.idx+d));api.verse(i)},
 title(){const h=S.sel;if(!h)return;S.idx=-3;send('♬ '+h.t,'Hino '+h.n);paint()},
 play(ed,n){play(ed,n)},
 queue(ed,n){const h=find(ed,n);S.queue.push({ed,n,t:h?h.t:''});say('Na fila: '+n+' · '+(h?h.t:''));if(!S.cur||audioEl().paused&&!audioEl().currentTime)next(1);else paint()},
 unqueue(i){S.queue.splice(i,1);paint()},
 clearQueue(){S.queue=[];paint()},
 toggle(){const a=audioEl();if(!a||!a.src)return;a.paused?a.play():a.pause()},
 next(){next(1)},prev(){next(-1)},
 stop(){const a=audioEl();if(a){a.pause();a.removeAttribute('src');a.load()}S.cur=null;paintPlayer();paint()},
 seek(v){const a=audioEl();if(a&&a.duration)a.currentTime=a.duration*(+v/1000)},
 vol(v){const a=audioEl();if(a)a.volume=+v/100},
 wl(on){S.withLyrics=!!on;try{localStorage.setItem('iasd-sth-wl',on?'1':'0')}catch(e){}},
 lyr(ed,n){const h=find(ed,n);if(h)projectLyrics(h,ed)},
 upload(ed,n){const i=document.createElement('input');i.type='file';i.accept='audio/*';i.onchange=async()=>{const f=i.files[0];if(!f)return;S.busy='Enviando '+pad(n)+'…';paintBar();try{await uploadOne(ed,n,f);say('Áudio do hino '+n+' salvo.')}catch(e){say('Falha no envio: '+(e.message||e))}S.busy='';paint()};i.click()},
 folder(){connectFolder()},reconnect(ed){reconnectFolder(ed)},indexFiles(ed,files){indexFiles(ed,files)},numOf,
 bulk(){const i=document.createElement('input');i.type='file';i.accept='audio/*';i.multiple=true;i.onchange=()=>{if(i.files.length)bulk(i.files)};i.click()},
 remove(ed,n){removeOne(ed,n)},
 reload(){S.aStatus.all='';loadAudio(true)}
};
window.STHymn=api;

/* ---------- desenho ---------- */
function filtered(){
 const L=list(),q=S.q.trim();let r=L;
 if(q){if(/^\d+$/.test(q)){const n=+q;r=L.filter(h=>h.n===n).concat(L.filter(h=>h.n!==n&&String(h.n).startsWith(q)))}
  else{const f=fold(q);r=L.filter(h=>h.key.includes(f)).concat(L.filter(h=>!h.key.includes(f)&&h.body.includes(f)))}}
 if(S.filter==='with')r=r.filter(h=>hasAudio(S.ed,h.n));else if(S.filter==='without')r=r.filter(h=>!hasAudio(S.ed,h.n));
 return r;
}
function paintNav(){
 const nav=$('sth-nav');if(!nav)return;
 const n=countAudio(S.ed),tot=list().length;
 nav.innerHTML='<div class="sth-tabs"><button class="'+(S.view==='lib'?'on':'')+'" onclick="STHymn.view(\'lib\')">🎵 Biblioteca de áudio</button><button class="'+(S.view==='lyr'?'on':'')+'" onclick="STHymn.view(\'lyr\')">📖 Letras</button></div>'
  +'<div class="sth-top"><div class="sth-ed">'+Object.keys(ED).map(k=>'<button class="'+(S.ed===k?'on':'')+'" onclick="STHymn.ed(\''+k+'\')"><b>'+ED[k].nome+'</b><small>'+ED[k].sub+(S.aStatus.all==='ok'||countAudio(k)?' · '+countAudio(k)+' com áudio':'')+'</small></button>').join('')+'</div>'
  +'<div class="sth-search"><input id="sthq" inputmode="search" autocomplete="off" placeholder="Número ou nome do hino…" value="'+esc(S.q)+'" oninput="STHymn.input(this.value)"></div></div>';
}
function row(h){
 const has=hasAudio(S.ed,h.n),cur=S.cur&&S.cur.ed===S.ed&&S.cur.n===h.n;
 return '<div class="sth-row'+(cur?' cur':'')+(has?'':' no')+'"><span class="sth-no">'+h.n+'</span><span class="sth-tt" onclick="STHymn.pick('+h.n+')" title="Abrir a letra">'+esc(h.t)+(has?'':'<i>sem áudio</i>')+'</span>'
  +'<span class="sth-bt">'
  +(has?'<button class="pl" onclick="STHymn.play(\''+S.ed+'\','+h.n+')" title="Tocar">'+(cur?'♪':'▶')+'</button><button onclick="STHymn.queue(\''+S.ed+'\','+h.n+')" title="Adicionar à fila">＋</button>':'')
  +'<button onclick="STHymn.pick('+h.n+')" title="Letra">📖</button>'
  +'<button class="up" onclick="STHymn.upload(\''+S.ed+'\','+h.n+')" title="'+(has?'Trocar o áudio':'Enviar áudio')+'">'+(has?'⟳':'⬆')+'</button>'
  +(has?'<button class="rm" onclick="STHymn.remove(\''+S.ed+'\','+h.n+')" title="Remover o áudio">✕</button>':'')
  +'</span></div>';
}
function paintBar(){
 const el=$('sth-bar');if(!el)return;
 if(S.busy){el.innerHTML='<span class="sth-busy">⏳ '+esc(S.busy)+'</span>';return}
 el.innerHTML='<div class="sth-fl">'+[['all','Todos'],['with','Com áudio'],['without','Sem áudio']].map(([k,l])=>'<button class="'+(S.filter===k?'on':'')+'" onclick="STHymn.filter(\''+k+'\')">'+l+'</button>').join('')+'</div>'
  +'<button class="sth-bulk sth-fold" onclick="STHymn.folder()" title="Escolha a pasta do computador onde estão os hinos. Nada é enviado: toca direto dos arquivos, sem internet.">📁 '+(Object.keys(S.local[S.ed]||{}).length?'Trocar pasta ('+Object.keys(S.local[S.ed]).length+' hinos)':'Conectar pasta de hinos')+'</button>'
  +(S.lstat[S.ed]==='perm'?'<button class="sth-bulk sth-fold" onclick="STHymn.reconnect(\''+S.ed+'\')">🔓 Reconectar pasta</button>':'')
  +'<button class="sth-bulk" onclick="STHymn.bulk()" title="Envia para a nuvem. O número do hino é lido do começo do nome (025.mp3, 25 - Nome.mp3).">⬆ Enviar para a nuvem</button>';
}
function paintBody(keepFocus){
 const b=$('sth-body');if(!b)return;
 if(S.view==='lib'){
  const st=S.status[S.ed],a=S.aStatus.all;let html='';
  if(st==='loading')html+='<p class="muted">Carregando hinos…</p>';else if(st==='err')html+='<p class="muted">Não foi possível carregar o hinário. Verifique a conexão.</p>';
  if(a==='nocloud')html+='<p class="sth-warn">Abra o Studio pelo IASD APP (logado como sonoplasta) para usar os áudios.</p>';
  else if(a==='err')html+='<p class="sth-warn">'+esc(S.aErr)+' <button onclick="STHymn.reload()">Tentar de novo</button></p>';
  else if(!countAudio('antigo')&&!countAudio('novo')&&a!=='loading')html+='<p class="sth-tip">A biblioteca está vazia. O jeito mais rápido: toque em <b>📁 Conectar pasta de hinos</b> e escolha a pasta onde estão os áudios no computador (sem enviar nada, toca direto de lá). Ou use <b>⬆ Enviar para a nuvem</b> (o número do hino vem do nome do arquivo: <code>025.mp3</code> ou <code>25 - Nome.mp3</code>) ou o <b>⬆</b> de cada hino. Envie só gravações que a igreja tem autorização para usar.</p>';
  const L=filtered(),shown=L.slice(0,S.limit);
  html+='<div class="sth-list">'+shown.map(row).join('')+(L.length>shown.length?'<button class="sth-more" onclick="STHymn.more()">Mostrar mais ('+(L.length-shown.length)+')</button>':'')+(!L.length&&st==='ok'?'<p class="muted">Nenhum hino encontrado.</p>':'')+'</div>';
  b.innerHTML=html;
 }else{
  const h=S.sel;let html='';
  if(!h){const res=filtered().slice(0,12);
   if(S.q.trim()&&res.length)html+='<div class="sth-res">'+res.map(x=>'<button onclick="STHymn.pick('+x.n+')"><b>'+x.n+'</b><span>'+esc(x.t)+'</span></button>').join('')+'</div>';
   else if(S.q.trim())html+='<p class="muted">Nenhum hino encontrado nesta edição.</p>';
   else if(S.recent.length)html+='<div class="sth-rec"><small>Recentes</small>'+S.recent.map(r=>'<button onclick="STHymn.recent(\''+r.ed+'\','+r.n+')"><b>'+r.n+'</b> '+esc(r.t)+'<i>'+(r.ed==='novo'?'novo':'antigo')+'</i></button>').join('')+'</div>';
   else html+='<p class="muted">Digite o número do hino para abrir a letra. Ex.: 1, 25, 188.</p>';
  }else{
   const has=hasAudio(S.ed,h.n);
   html+='<div class="sth-card"><div class="sth-hd"><span class="sth-n">'+h.n+'</span><div><h3>'+esc(h.t)+'</h3><small>'+ED[S.ed].nome+' · '+h.est.length+' estrofes</small></div><button class="sth-x" onclick="STHymn.view(\'lib\')" title="Voltar à biblioteca">✕</button></div>'
    +'<div class="sth-acts">'+(has?'<button onclick="STHymn.play(\''+S.ed+'\','+h.n+')">▶ Tocar o hino</button>':'')+'<button class="primary" onclick="STHymn.all()">▣ Projetar letra completa</button><button onclick="STHymn.title()">Só o número e título</button></div>'
    +'<div class="sth-vs">'+h.est.map((e,i)=>'<button class="'+(S.idx===i?'on':'')+'" onclick="STHymn.verse('+i+')"><b>'+(i+1)+'</b><span>'+esc(e.split('\n').slice(0,2).join(' / '))+'</span></button>').join('')+'</div>'
    +'<div class="sth-nav"><button onclick="STHymn.step(-1)">◀ Anterior</button><button class="primary" onclick="STHymn.step(1)">Próxima estrofe ▶</button></div></div>';
  }
  b.innerHTML=html;
 }
 if(keepFocus){const i=$('sthq');if(i){i.focus();const l=i.value.length;i.setSelectionRange(l,l)}}
}
function paintPlayer(){
 const el=$('sthp');if(!el)return;
 const c=S.cur,h=c&&find(c.ed,c.n),a=audioEl(),playing=a&&!a.paused;
 if(!c){el.hidden=!S.queue.length;if(el.hidden){el.innerHTML='';return}}
 else el.hidden=false;
 el.innerHTML=(c?'<div class="sthp-main"><button class="sthp-b" onclick="STHymn.prev()" title="Anterior">⏮</button><button class="sthp-b big" onclick="STHymn.toggle()" title="Tocar / pausar">'+(playing?'⏸':'▶')+'</button><button class="sthp-b" onclick="STHymn.next()" title="Próximo">⏭</button><button class="sthp-b" onclick="STHymn.stop()" title="Parar">⏹</button>'
   +'<div class="sthp-info"><b>'+c.n+' · '+esc(h?h.t:'')+'</b><div class="sthp-seek"><span id="sthpT">0:00</span><input id="sthpS" type="range" min="0" max="1000" value="0" oninput="STHymn.seek(this.value)"><span id="sthpD">0:00</span></div></div>'
   +'<label class="sthp-v" title="Volume">🔊<input type="range" min="0" max="100" value="'+Math.round((a?a.volume:1)*100)+'" oninput="STHymn.vol(this.value)"></label></div>':'')
  +'<div class="sthp-opt"><label><input type="checkbox" '+(S.withLyrics?'checked':'')+' onchange="STHymn.wl(this.checked)"> Projetar a letra ao tocar</label>'+(c?'<button onclick="STHymn.lyr(\''+c.ed+'\','+c.n+')">▣ Projetar letra agora</button>':'')+'</div>'
  +(S.queue.length?'<div class="sthp-q"><small>Fila (' +S.queue.length+')</small>'+S.queue.map((q,i)=>'<span><b>'+q.n+'</b> '+esc(q.t)+'<button onclick="STHymn.unqueue('+i+')" title="Tirar da fila">✕</button></span>').join('')+'<button class="sthp-cl" onclick="STHymn.clearQueue()">Limpar fila</button></div>':'');
}
function paint(){paintNav();paintBar();paintBody();paintPlayer()}

function mount(){
 const sec=$('hymnal');if(!sec||$('sth'))return;
 const old=Array.from(sec.children).slice(1);
 const det=document.createElement('details');det.className='sth-manual';
 det.innerHTML='<summary>Letra manual e áudio avulso (arquivos fora da biblioteca)</summary>';
 old.forEach(n=>det.appendChild(n));
 const p=sec.querySelector('.mp-tt p');if(p)p.textContent='Hinos antigo e novo como música: toque, coloque na fila e projete a letra junto.';
 const box=document.createElement('div');box.id='sth';
 box.innerHTML='<div id="sth-nav"></div><div id="sthp" class="sthp" hidden></div><div id="sth-bar" class="sth-barr"></div><div id="sth-body"></div><audio id="sthAudio" preload="auto"></audio>';
 sec.appendChild(box);sec.appendChild(det);
 const a=$('sthAudio');
 a.addEventListener('timeupdate',()=>{const s=$('sthpS');if(s&&a.duration&&document.activeElement!==s)s.value=Math.round(a.currentTime/a.duration*1000);const t=$('sthpT'),d=$('sthpD');if(t)t.textContent=fmt(a.currentTime);if(d)d.textContent=fmt(a.duration)});
 a.addEventListener('play',paintPlayer);a.addEventListener('pause',paintPlayer);
 a.addEventListener('ended',()=>{if(S.queue.length)next(1);else{paintPlayer();paint()}});
 a.addEventListener('error',()=>{if(S.cur&&a.src){delete urlCache[S.cur.ed+'|'+S.cur.n];say('Falha ao carregar o áudio. Tente de novo.')}});
 const style=document.createElement('style');style.textContent=
 '#sth{margin-top:8px;display:grid;gap:10px;min-width:0;max-width:100%}#sth *{box-sizing:border-box;min-width:0}#sth input[type=range]{width:auto}.sth-tabs{display:flex;gap:6px;margin-bottom:8px}.sth-tabs button{flex:1;padding:10px;font-weight:800}.sth-tabs button.on{background:var(--primary,#2563eb);color:#fff;border-color:transparent}'
 +'.sth-top{display:flex;gap:10px;flex-wrap:wrap;align-items:stretch}.sth-ed{display:flex;gap:6px}.sth-ed button{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:8px 14px}.sth-ed button small{opacity:.7;font-size:11px}.sth-ed button.on{background:rgba(37,99,235,.28);border-color:#2563eb}.sth-search{flex:1;min-width:150px}@media(max-width:700px){.sth-top{flex-direction:column}.sth-ed{width:100%}.sth-ed button{flex:1}.sth-tabs button{font-size:13px;padding:9px 4px}.sth-barr{flex-direction:column;align-items:stretch}.sth-fl button{flex:1}.sthp-main{flex-wrap:wrap}.sthp-v{width:100%}.sthp-v input{flex:1}.sth-row{gap:6px;padding:6px}.sth-bt button{min-width:30px;height:32px;padding:0 5px}}.sth-search input{width:100%;height:100%;font-size:17px;padding:10px 14px}'
 +'.sth-barr{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between}.sth-fl{display:flex;gap:6px}.sth-fl button{padding:7px 12px;font-size:13px}.sth-fl button.on{background:rgba(245,183,58,.2);border-color:#f5b73a}.sth-bulk{padding:8px 12px;font-size:13px}.sth-busy{opacity:.85}'
 +'.sth-list{display:grid;gap:5px;max-height:300px;overflow:auto;padding-right:4px}.sth-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid transparent}.sth-row.cur{border-color:#22c55e;background:rgba(34,197,94,.1)}.sth-row.no{opacity:.72}'
 +'.sth-no{min-width:38px;text-align:center;font-weight:800;font-size:16px;color:#f5b73a}.sth-tt{flex:1;min-width:0;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sth-tt i{margin-left:8px;font-size:11px;opacity:.6;font-style:normal}'
 +'.sth-bt{display:flex;gap:4px}.sth-bt button{min-width:34px;height:34px;padding:0 8px;font-size:14px}.sth-bt .pl{background:#16a34a;color:#fff;border-color:transparent}.sth-bt .rm:hover{background:#e5484d;color:#fff}.sth-more{padding:10px}'
 +'.sth-warn{padding:10px 12px;border-radius:12px;background:rgba(229,72,77,.14);border:1px solid rgba(229,72,77,.4);margin:0}.sth-tip{padding:10px 12px;border-radius:12px;background:rgba(245,183,58,.1);border:1px solid rgba(245,183,58,.35);margin:0;font-size:13px;line-height:1.5}.sth-tip code{background:rgba(255,255,255,.1);padding:1px 5px;border-radius:5px}'
 +'.sth-res,.sth-rec{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px}.sth-rec small{grid-column:1/-1;opacity:.7}.sth-res button,.sth-rec button{display:flex;gap:10px;align-items:center;text-align:left;padding:8px 12px}.sth-res b{min-width:34px;font-size:18px}.sth-rec i{margin-left:auto;font-size:11px;opacity:.6;font-style:normal}'
 +'.sth-card{display:flex;flex-direction:column;gap:10px}.sth-hd{display:flex;gap:12px;align-items:center}.sth-hd h3{margin:0}.sth-hd small{opacity:.7}.sth-n{font-size:30px;font-weight:800;min-width:64px;text-align:center;padding:6px 10px;border-radius:12px;background:rgba(37,99,235,.18)}.sth-x{margin-left:auto}'
 +'.sth-acts,.sth-nav{display:flex;gap:8px;flex-wrap:wrap}.sth-acts button,.sth-nav button{flex:1;min-width:150px;padding:10px}.sth-vs{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:6px;max-height:190px;overflow:auto}.sth-vs button{display:flex;gap:10px;align-items:center;text-align:left;padding:8px 10px;font-size:13px}.sth-vs b{min-width:22px}.sth-vs button.on{outline:2px solid #22c55e}'
 +'.sthp[hidden]{display:none!important}.sthp{padding:10px 12px;border-radius:14px;background:rgba(10,24,52,.96);border:1px solid rgba(34,197,94,.55);display:grid;gap:8px}.sthp-main{display:flex;align-items:center;gap:6px}.sthp-b{width:38px;height:38px;padding:0;font-size:16px}.sthp-b.big{width:46px;height:46px;font-size:20px;background:#16a34a;color:#fff;border-color:transparent}'
 +'.sthp-info{flex:1;min-width:0;display:grid;gap:2px}.sthp-info b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px}.sthp-seek{display:flex;gap:8px;align-items:center;font-size:11px;opacity:.85}.sthp-seek input{flex:1}.sthp-v{display:flex;gap:4px;align-items:center;width:110px}.sthp-v input{width:80px}'
 +'.sthp-opt{display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-size:12.5px;justify-content:space-between}.sthp-opt label{display:flex;flex-direction:row;gap:6px;align-items:center}.sthp-opt input[type=checkbox]{width:auto;min-height:0;margin:0}.sthp-opt button{padding:6px 10px;font-size:12px}.sthp-q{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px}.sthp-q small{opacity:.7}.sthp-q span{display:flex;gap:6px;align-items:center;padding:3px 4px 3px 9px;border-radius:99px;background:rgba(255,255,255,.08)}.sthp-q span button{width:22px;height:22px;padding:0;border-radius:50%;font-size:10px}.sthp-cl{padding:4px 9px;font-size:11px}'
 +'.sth-manual{margin-top:14px}.sth-manual summary{cursor:pointer;opacity:.8;padding:6px 0}';
 document.head.appendChild(style);
 loadLyrics(S.ed).then(paint);loadAudio();restoreLocal();paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
