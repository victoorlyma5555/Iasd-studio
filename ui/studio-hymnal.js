/* Hinário no Studio — músicas do Louvor JA tocando direto dos arquivos deste computador (nada vai para a internet).
   Coleções: Hinário Adventista (novo), Hinário 1996, JA/Min. Música, Coletâneas Diversas e Músicas Infantis.
   Slides: Cantado, Playback ou Sem áudio, com a letra sincronizada e o fundo do programa. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const ED={novo:{nome:'Hinário Adventista',sub:'Novo · 2022',url:'/data/hinario-nha.json',hy:true},antigo:{nome:'Hinário 1996',sub:'Antigo',url:'/data/hinario-hasd.json',hy:true},jamin:{nome:'JA/Min. Música',sub:'CDs oficiais',coll:true},misc:{nome:'Coletâneas Diversas',sub:'',coll:true},kids:{nome:'Músicas Infantis',sub:'',coll:true}};
const HY=['novo','antigo'];
const KEYS=Object.keys(ED);
const S={ed:'novo',mode:'cantado',album:null,data:{},status:{},q:'',limit:80,queue:[],cur:null,busy:'',msg:''};
try{S.ed=localStorage.getItem('iasd-sth-ed')||'novo';if(!ED[S.ed])S.ed='novo';S.mode=localStorage.getItem('iasd-sth-mode')||'cantado';if(!['cantado','pb','sem'].includes(S.mode))S.mode='cantado'}catch(e){}
const pad=n=>String(n).padStart(3,'0');
function clean(s){return String(s||'').replace(/\s+([,.;:!?])/g,'$1').replace(/^\s*\d+\.\s*/,'').trim()}
function norm(raw){return (Array.isArray(raw)?raw:[]).map(x=>{let v=(x.v||[]).map(clean).filter(Boolean);if(v.length>1&&fold(v[0])===fold(x.t))v.shift();return{n:Number(x.n),t:String(x.t||'').trim(),est:v,key:fold(x.t),body:fold(v.join(' '))}}).filter(h=>h.n)}
const list=(ed)=>S.data[ed||S.ed]||[];
const find=(ed,n)=>list(ed).find(h=>h.n===n);
const fmt=t=>{t=Math.floor(t||0);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
const say=m=>{S.msg=m;if(typeof window.feedback==='function')try{window.feedback(m)}catch(e){}};

/* ---------- dados ---------- */
const _LP={};
function loadLyrics(id){if(S.status[id]==='err')delete _LP[id];return _LP[id]||(_LP[id]=loadLyrics0(id))}
async function loadLyrics0(id){
 if(S.data[id])return;S.status[id]='loading';paint();
 try{
  if(ED[id].coll)await loadCol(id);
  else{const r=await fetch(ED[id].url);if(!r.ok)throw 0;S.data[id]=norm(await r.json());S.status[id]='ok';await colAlbums(id);hymnMaps(id)}
  if(S.aidx.size){S.local[id]=matchCol(id);S.lstat[id]='ok';S.statV++}
 }catch(e){S.status[id]='err'}
 paint();
}
/* ---------- pasta do computador (sem enviar nada: toca direto dos arquivos da igreja) ---------- */
S.local={};KEYS.forEach(k=>S.local[k]={});S.lstat={};S.files=[];S.aidx=new Map();
const hasLocal=(ed,n)=>!!(S.local[ed]&&S.local[ed][n]);
const hasAudio=(ed,n)=>hasLocal(ed,n);
const playable=(ed,h)=>S.mode==='sem'?!!(h.est&&h.est.length):hasAudio(ed,h.n);
const IMG=/\.(jpe?g|png|webp|bmp)$/i;
S.imgs={};
const AUD=/\.(mp3|m4a|aac|wav|ogg|opus|flac|mp4|m4v|webm)$/i;
const _tk=new Map();
const tkey=t=>{let v=_tk.get(t);if(v===undefined){v=String(t||'');if(/[^\x00-\x7f]/.test(v))v=v.normalize('NFD').replace(/[\u0300-\u036f]/g,'');v=v.toLowerCase().replace(/[^a-z0-9]+/g,'');if(_tk.size>20000)_tk.clear();_tk.set(t,v)}return v};
const pn=it=>it._p||(it._p=parseName(it.name));
function parseName(name){let b=String(name||'').replace(/\.[^.]+$/,'');const pb=/\s*[-–_]\s*(pb|playback|instrumental)\s*$/i.test(b);b=b.replace(/\s*[-–_]\s*(pb|playback|instrumental)\s*$/i,'');return{key:tkey(b.replace(/^\s*\d{1,3}\s*[-.–_]\s*/,'')),pb}}
/* casa os arquivos (nomeados pelo TÍTULO, como no Louvor JA) com os hinos da edição; prefere o cantado, usa o playback (PB) se for só ele */
const _hk={};
const hkeys=ed=>{const L=list(ed),c=_hk[ed];if(c&&c.n===L.length)return c.s;return(_hk[ed]={n:L.length,s:new Set(L.map(h=>tkey(h.t)))}).s};
function dirScore(ed,its){const hk=hkeys(ed),seen=new Set();let n=0;its.forEach(i=>{const k=pn(i).key;if(!seen.has(k)){seen.add(k);if(hk.has(k))n++}});return n}
function matchEd(ed,items){const out={};const other=ed==='novo'?'antigo':'novo';const dirs={};items.forEach(it=>{(dirs[it.dir||'']=dirs[it.dir||'']||[]).push(it)});
 /* a pasta só vale para a edição com a qual os títulos mais combinam (não depende do nome da pasta) */
 const mine=[];Object.keys(dirs).forEach(d=>{const a=dirScore(ed,dirs[d]),o=dirScore(other,dirs[d]);if(a>=o&&a>0)mine.push(...dirs[d])});
 const byKey={};mine.forEach(it=>{const p=pn(it);(byKey[p.key]=byKey[p.key]||[]).push(Object.assign({pb:p.pb},it))});
 list(ed).forEach(h=>{const c=byKey[tkey(h.t)];if(!c||!c.length)return;c.sort((x,y)=>x.pb-y.pb);out[h.n]=c[0]});
 mine.forEach(it=>{if(/^\s*\d/.test(it.name)){const n=numOf(it.name);if(n&&!out[n]&&n<=list(ed).length)out[n]=it}});return out}

function numOf(name){const b=String(name||'').replace(/\.[^.]+$/,'');
 let m=/^\s*(?:hino\s*(?:n[º°o.]*)?\s*)?0*(\d{1,3})(?!\d)/i.exec(b);if(m&&+m[1]>0)return +m[1];
 const g=(b.match(/\d+/g)||[]);const pad3=g.filter(x=>x.length>=3&&+x>0&&+x<1000);const pick=pad3.length?pad3[pad3.length-1]:g.filter(x=>+x>0&&+x<1000).pop();return pick?+pick:0}
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('iasd-sth-fs',1);r.onupgradeneeded=()=>r.result.createObjectStore('h');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function idbGet(k){try{const d=await idb();return await new Promise(res=>{const q=d.transaction('h').objectStore('h').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)})}catch(e){return null}}
async function idbSet(k,v){try{const d=await idb();await new Promise(res=>{const t=d.transaction('h','readwrite');t.objectStore('h').put(v,k);t.oncomplete=res;t.onerror=res})}catch(e){}}
async function walk(dir,out,depth,path){path=path||'';
 for await(const [name,e] of dir.entries()){
  if(e.kind==='directory'){if(depth<5)await walk(e,out,depth+1,path+'/'+name)}
  else if(AUD.test(name))out.push({handle:e,name,dir:path});
  else if(IMG.test(name))S.imgs[name.toLowerCase()]={handle:e}}
}
/* ---------- IASD Projetor (app do Windows): lê a pasta do Louvor JA sem passar pelo Chrome ---------- */
const CP='http://127.0.0.1:38741';
const cpTok=()=>{try{return localStorage.getItem('iasd-projetor-token')||''}catch(e){return ''}};
S.cp=null;S.cpInfo=null;
async function cpFetch(route,opt,ms){
 const t=cpTok();if(!t)throw Error('Pareie o IASD Projetor para usar a pasta do Louvor JA.');
 const o=Object.assign({targetAddressSpace:'loopback',cache:'no-store'},opt||{});o.headers=Object.assign({Authorization:'Bearer '+t},o.headers||{});if(ms)o.signal=AbortSignal.timeout(ms);
 try{return await fetch(CP+route,o)}catch(e){throw Error('O IASD Projetor não está aberto neste computador.')}
}
async function cpJson(route,body,ms){
 const r=await cpFetch(route,body!==undefined?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{},ms);
 const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'IASD Projetor indisponível');return j
}
const cpFile=async rel=>{const r=await cpFetch('/lja/file?p='+encodeURIComponent(rel));if(!r.ok)throw Error('Arquivo não encontrado no computador. Toque em Sincronizar.');return r.blob()};
async function cpProbe(){
 S.cp=null;S.cpInfo=null;
 try{const r=await fetch(CP+'/status',{targetAddressSpace:'loopback',cache:'no-store',signal:AbortSignal.timeout(1500)});const b=await r.json();S.cpInfo={online:!!b.online,paired:!!b.paired,version:b.version||''}}catch(e){S.cpInfo=null;return null}
 if(!cpTok())return null;
 try{S.cp=await cpJson('/lja/state',undefined,2500)}catch(e){S.cp=null}
 return S.cp
}
S.scanAt=0;S.syncAt=0;S.rootH=null;S.dbH=null;S.stOpen={};S.syncing=false;S.cnt=null;S.statV=0;
const baseOf=d=>String(d||'').split(/[\\/]/).filter(Boolean).pop()?.toLowerCase()||'';
function setFiles(raw){S.files=raw;S.aidx=new Map();raw.forEach(it=>{const k=it.name.toLowerCase();let a=S.aidx.get(k);if(!a)S.aidx.set(k,a=[]);a.push(it)})}
function pickF(name,dir){
 if(!name)return null;const c=S.aidx.get(String(name).toLowerCase());if(!c||!c.length)return null;
 if(c.length===1)return c[0];const b=baseOf(dir);return c.find(x=>baseOf(x.dir)===b)||c[0]
}
/* liga cada item da coleção ao arquivo da pasta: pelo nome exato que o programa registra (cantado e playback) */
function matchCol(id){
 const out={};if(!S.aidx.size)return out;
 list(id).forEach(h=>{const e=entryOf(id,h);if(!e)return;const sung=pickF(e.mp3,e.mp3dir),pb=pickF(e.pb,e.pbdir);if(!sung&&!pb)return;
  const r=Object.assign({},sung||pb);r.onlyPb=!sung;if(sung&&pb)r.pb=pb;out[h.n]=r});
 if(ED[id].hy){const t=matchEd(id,S.files);Object.keys(t).forEach(n=>{if(!out[n]){out[n]=t[n];out[n].onlyPb=/\s[-–]\s*pb\s*\.[a-z0-9]+$/i.test(t[n].name||'')}})}
 return out
}
const yieldUI=()=>new Promise(r=>setTimeout(r,0));
async function rematch(){
 for(let i=0;i<S.files.length;i++){pn(S.files[i]);if(i%300===299)await yieldUI()}
 for(const id of KEYS){if(S.data[id]){S.local[id]=matchCol(id);S.lstat[id]='ok';await yieldUI()}}
 S.scanAt=Date.now();S.statV++
}
function saveScan(){if(S.files.every(x=>x.handle||x.rel))idbSet('scan',{files:S.files,imgs:S.imgs,cnt:S.cnt,at:S.syncAt||Date.now()})}
async function scanCp(){
 const r=await cpJson('/lja/scan',{});S.imgs={};const raw=[];
 r.items.forEach(([name,dir,k])=>{const rel=dir?dir+'/'+name:name;if(k==='a')raw.push({name,dir,rel});else S.imgs[name.toLowerCase()]={rel}});
 setFiles(raw);return raw.length
}
async function scanRoot(h){S.imgs={};const raw=[];await walk(h,raw,0,h.name||'');setFiles(raw);return raw.length}
/* contagem por coleção: quantos itens, quantos têm arquivo aqui, quantos faltam */
async function computeCounts(){
 await Promise.all(KEYS.map(loadLyrics));await rematch();
 const hasImgs=Object.keys(S.imgs).length>0,c={};
 for(const id of KEYS){
  const L=list(id),loc=S.local[id]||{},x={total:L.length,found:0,synced:0,noBg:0,miss:[],noProg:[],prog:ED[id].hy&&S.hy[id]?S.hy[id].length:null};
  L.forEach(h=>{const e=entryOf(id,h);
   if(ED[id].hy&&S.hy[id]&&!e)x.noProg.push(h.n+' · '+h.t);
   if(loc[h.n]){x.found++;if(e&&e.L.length)x.synced++;if(e&&hasImgs&&e.img&&!S.imgs[String(e.img).toLowerCase()])x.noBg++}
   else x.miss.push((ED[id].coll?(h.album||'')+' · ':h.n+' · ')+h.t)});
  c[id]=x}
 S.cnt=c;S.statV++;return c
}
async function indexFiles(ed,files){
 S.imgs={};[...files].forEach(f=>{if(IMG.test(f.name||''))S.imgs[f.name.toLowerCase()]={file:f}});
 setFiles([...files].filter(f=>AUD.test(f.name||'')).map(f=>({file:f,name:f.name,dir:f.webkitRelativePath||''})));
 S.syncAt=Date.now();await computeCounts();
 say('Pasta lida: '+KEYS.filter(k=>S.cnt[k].total).map(k=>ED[k].nome+' '+S.cnt[k].found+' de '+S.cnt[k].total).join(' · ')+'. Neste navegador, use Chrome ou Edge para a pasta ficar lembrada.');paint();
}
async function applyIndex(ix,f){
 await Promise.all(KEYS.map(async k=>{await idbSet('lja:'+k,ix.cols[k]||[])}));
 const counts={};KEYS.forEach(k=>counts[k]=(ix.cols[k]||[]).reduce((n,a)=>n+a.tracks.length,0));
 const meta={at:ix.at,meta:f?{size:f.size,mod:f.lastModified,name:f.name}:null,counts};
 await idbSet('lja:meta',meta);S.ljaMeta=meta;resetCols();
 await Promise.all(HY.map(async id=>{await colAlbums(id);hymnMaps(id)}));
}
async function syncAll(why){
 if(S.syncing)return;S.syncing=true;S.busy='Sincronizando com a pasta e o banco…';paintBar();const notes=[];
 try{
  if(await cpProbe()){
   try{
    const st=S.cp;
    if(st.db){const m=S.ljaMeta&&S.ljaMeta.meta;
     if(!m||m.size!==st.db.size||m.mod!==st.db.mtime){S.busy='Lendo o banco do Louvor JA…';paintBar();
      const r=await cpFetch('/lja/db');if(!r.ok)throw Error('banco indisponível');const f=new File([await r.blob()],'database.db',{lastModified:st.db.mtime});
      await applyIndex(await window.LJADB.buildIndex(f,m=>{S.busy=m;paintBar()}),f);notes.push('banco atualizado')}}
    else notes.push('banco do Louvor JA não encontrado: escolha o database.db')
    if(st.root){S.busy='Contando os arquivos da pasta…';paintBar();await scanCp();S.syncAt=Date.now();await computeCounts();saveScan()}
    else notes.push('escolha a pasta do Louvor JA')
   }catch(e){notes.push(e.message||String(e))}
  }
  else if(S.dbH){
   let p='granted';try{p=await S.dbH.queryPermission({mode:'read'})}catch(e){}
   if(p==='granted'){
    try{const f=await S.dbH.getFile(),m=S.ljaMeta&&S.ljaMeta.meta;
     if(!m||m.size!==f.size||m.mod!==f.lastModified){S.busy='O banco do Louvor JA mudou. Lendo de novo…';paintBar();await applyIndex(await window.LJADB.buildIndex(f),f);notes.push('banco atualizado')}}
    catch(e){notes.push('banco: '+(e.message||e))}
   }else S.lstat.db='perm'
  }
  if(!S.cp&&S.rootH){
   let p='granted';try{p=await S.rootH.queryPermission({mode:'read'})}catch(e){}
   if(p==='granted'){try{S.busy='Contando os arquivos da pasta…';paintBar();await scanRoot(S.rootH);S.syncAt=Date.now();await computeCounts();saveScan()}catch(e){notes.push('pasta: '+(e.message||e))}}else{S.lstat.novo='perm'}
  }
 }finally{S.syncing=false;S.busy=''}
 S.syncAt=S.syncAt||Date.now();
 if(why==='manual'||notes.length){const c=S.cnt;say('Sincronizado. '+(c?KEYS.filter(k=>c[k].total).map(k=>ED[k].nome+': '+c[k].found+' de '+c[k].total).join(' · '):'')+(notes.length?' ('+notes.join('; ')+')':''))}
 paint()
}
async function cpPick(kind){
 try{S.busy='Escolha no IASD Projetor (a janela abre no Windows)…';paintBar();
  const r=await cpJson('/lja/pick',{kind});S.cp=r;S.busy='';
  if(r.canceled){paint();return}
  await syncAll('manual')}
 catch(e){S.busy='';say('IASD Projetor: '+(e.message||e));paint()}
}
async function connectFolder(){
 if(cpTok()){if(!S.cp)await cpProbe();if(S.cp)return cpPick('root')}
 if(window.showDirectoryPicker){
  try{const h=await window.showDirectoryPicker({id:'louvorja-root',mode:'read'});S.rootH=h;await idbSet('root',h);S.permOk=true;await syncAll('manual')}
  catch(e){if(e&&e.name!=='AbortError')say('Não foi possível abrir a pasta: '+(e.message||e))}
 }else{
  const i=document.createElement('input');i.type='file';i.webkitdirectory=true;i.multiple=true;i.onchange=()=>{if(i.files.length)indexFiles(S.ed,i.files)};i.click();
 }
}
async function reconnectFolder(){
 try{
  if(S.rootH)await S.rootH.requestPermission({mode:'read'});
  if(S.dbH)await S.dbH.requestPermission({mode:'read'});
  S.lstat.novo='saved';S.lstat.db='ok';S.permOk=true;say('Pasta reconectada.');paint()
 }catch(e){say('Não foi possível reconectar: '+(e.message||e))}
}
async function ensureRead(){
 if(S.permOk||S.cp||!S.rootH)return;
 try{const q=await S.rootH.queryPermission({mode:'read'});if(q!=='granted')await S.rootH.requestPermission({mode:'read'});S.permOk=true}catch(e){}
}
async function restoreLocal(){
 await loadLja();await cpProbe();S.rootH=await idbGet('root');S.dbH=await idbGet('ljadb');
 const sv=await idbGet('scan');
 if(sv&&sv.files){setFiles(sv.files);S.imgs=sv.imgs||{};S.cnt=sv.cnt||null;S.syncAt=sv.at||0;S.lstat.novo='saved';await rematch()}
 paint()
}
function ago(t){if(!t)return 'nunca';const m=Math.round((Date.now()-t)/60000);return m<1?'agora há pouco':m<60?'há '+m+' min':'há '+Math.round(m/60)+' h'}
/* ---------- banco do Louvor JA (coletâneas, letra com tempo, capas e fundos), lido no próprio computador ---------- */
S.ljaMeta=null;S.bgc={};S.sync=null;S.colx={};S.hy={};S.lmap={};S.alb={};S.thumbs={};
async function colAlbums(id){if(S.colx[id])return S.colx[id];S.colx[id]=(await idbGet('lja:'+id))||[];return S.colx[id]}
function hymnMaps(id){
 const t=[];(S.colx[id]||[]).forEach(a=>a.tracks.forEach(e=>t.push(e)));S.hy[id]=t.length?t:null;
 const tr=new Map(),ky=new Map();t.forEach(e=>{e._k=tkey(e.name);if(!tr.has(e.tr))tr.set(e.tr,e);if(!ky.has(e._k))ky.set(e._k,e)});S.lmap[id]={tr,ky}
}
function ljaEntry(ed,n){
 const m=S.lmap[ed];if(!m)return null;const h=find(ed,n);if(!h)return null;
 if(!h._k)h._k=tkey(h.t);const e=m.tr.get(n);
 return e&&e._k===h._k?e:(m.ky.get(h._k)||null)
}
const entryOf=(id,h)=>h?(ED[id].coll?h.e:ljaEntry(id,h.n)):null;
async function loadLja(){try{S.ljaMeta=(await idbGet('lja:meta'))||null}catch(e){}}
function resetCols(){S.colx={};S.hy={};S.lmap={};S.alb={};KEYS.forEach(k=>{if(ED[k].coll){delete S.data[k];delete S.status[k];delete _LP[k]}});S.cnt=null;S.statV++}
/* coleção (JA/Min., Diversas, Infantis) vira uma lista plana pesquisável, igual à dos hinários */
async function loadCol(id){
 const al=await colAlbums(id);S.alb[id]=al;const items=[];let n=0;
 al.forEach((a,ai)=>a.tracks.forEach(e=>{n++;items.push({n,t:e.name,key:fold(e.name+' '+a.name),body:'',est:e.L.map(l=>l[2]),album:a.name,ai,tr:e.tr,e,cover:a.cover})}));
 S.data[id]=items;S.status[id]=items.length?'ok':'nodb'
}
async function connectDb(){
 if(cpTok()){if(!S.cp)await cpProbe();if(S.cp)return cpPick('db')}
 const run=async f=>{
  try{S.busy='Lendo o banco do Louvor JA…';paintBar();const ix=await window.LJADB.buildIndex(f,m=>{S.busy=m;paintBar()});
   await applyIndex(ix,f);
   S.busy='';await Promise.all(KEYS.map(loadLyrics));if(S.aidx.size)await computeCounts();
   const c=S.ljaMeta.counts;say('Banco lido: '+KEYS.map(k=>ED[k].nome+' '+c[k]).join(' · ')+'. Fica guardado neste navegador.');paint()}
  catch(e){S.busy='';say('Não consegui ler o banco: '+(e.message||e));paint()}
 };
 if(window.showOpenFilePicker){try{const [h]=await window.showOpenFilePicker({id:'lja-db',types:[{description:'Banco do Louvor JA (database.db)',accept:{'application/octet-stream':['.db']}}]});S.dbH=h;await idbSet('ljadb',h);run(await h.getFile())}catch(e){if(e&&e.name!=='AbortError')say('Não foi possível abrir: '+(e.message||e))}}
 else{const i=document.createElement('input');i.type='file';i.accept='.db';i.onchange=()=>{if(i.files[0])run(i.files[0])};i.click()}
}
/* imagem da pasta -> fundo reduzido (poucos KB) ou miniatura de capa */
async function imgBlob(name,w,q){
 const r=S.imgs[String(name).toLowerCase()];if(!r)return null;
 try{const f=r.file||(r.rel?await cpFile(r.rel):await r.handle.getFile());const bm=await createImageBitmap(f);const W=Math.min(w,bm.width),H=Math.round(bm.height*W/bm.width);
  const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(bm,0,0,W,H);if(bm.close)bm.close();return c}catch(e){return null}
}
const verGE=(v,m)=>{const x=String(v||'0').split('.').map(Number),y=m.split('.').map(Number);for(let i=0;i<3;i++){if((x[i]||0)!==y[i])return(x[i]||0)>y[i]}return true};
/* IASD Projetor antes da 0.5.8 recusa mensagens com mais de 50 KB: o fundo é reduzido para caber */
const bgLimit=()=>verGE(S.cpInfo&&S.cpInfo.version,'0.5.8')?0:43000;
async function bgFor(name){
 if(!name)return '';const k=String(name).toLowerCase()+'|'+bgLimit();if(S.bgc[k]!==undefined)return S.bgc[k];
 await ensureRead();let u='';const lim=bgLimit();
 if(!lim){const c=await imgBlob(name,1600);u=c?c.toDataURL('image/jpeg',.8):''}
 else for(const [w,q] of [[960,.6],[800,.5],[640,.45],[480,.4],[360,.35]]){const c=await imgBlob(name,w);if(!c)break;u=c.toDataURL('image/jpeg',q);if(u.length<=lim)break}
 S.bgc[k]=u;const ks=Object.keys(S.bgc);if(ks.length>40)delete S.bgc[ks[0]];return u
}
async function thumbFor(name){
 const k=String(name).toLowerCase();if(S.thumbs[k]!==undefined)return S.thumbs[k];
 const c=await imgBlob(name,240);if(!c){S.thumbs[k]='';return ''}
 const u=await new Promise(r=>c.toBlob(b=>r(b?URL.createObjectURL(b):''),'image/jpeg',.75));S.thumbs[k]=u;return u
}
let _cvRun=0;
async function fillCovers(){
 const run=++_cvRun;await ensureRead();
 for(const el of document.querySelectorAll('#sth-body .sth-cv[data-cv]')){
  if(run!==_cvRun)return;const n=el.getAttribute('data-cv');if(!n)continue;
  const u=await thumbFor(n);if(u&&el.isConnected){el.style.backgroundImage='url("'+u+'")';el.classList.add('has')}
 }
}
function sendLyric(o){if(typeof window.project!=='function')return;window.project('IASD_LYRIC:'+JSON.stringify(o))}
function mkEntry(ed,n){const h=find(ed,n);return h&&h.est&&h.est.length?{name:h.t,img:'',L:h.est.map(x=>[0,0,x,'',''])}:null}
function startSync(ed,n,fileName,opt){
 const manual=!!(opt&&opt.manual);let e=entryOf(ed,find(ed,n));
 if(!e||!e.L.length){e=manual?mkEntry(ed,n):null;if(!e){S.sync=null;return false}}
 const pb=!!(opt&&opt.pb)||/\s[-–]\s*pb\s*\.[a-z0-9]+$/i.test(fileName||'');
 const sy=S.sync={ed,n,e,pb,manual,last:-9,bgk:'',busy:false};sendStanza(sy,manual?-1:curStanza(sy,0));return true
}
function curStanza(sy,t){const ti=sy.pb?1:0;let k=-1;for(let i=0;i<sy.e.L.length;i++){if(sy.e.L[i][ti]<=t+0.15)k=i;else break}return k}
async function sendStanza(sy,k){
 if(sy.busy){sy.want=k;return}sy.busy=true;sy.last=k;
 try{
  const L=k>=0?sy.e.L[k]:null,img=(L&&L[3])||sy.e.img||(sy.e.L[0]&&sy.e.L[0][3])||'';
  const bgk=String(img).toLowerCase();let bg;
  if(bgk!==sy.bgk){bg=await bgFor(img);sy.bgk=bgk}
  if(S.sync!==sy)return;
  const o=L?{text:L[2],aux:L[4]||'',title:0}:{text:sy.e.name,title:1};if(bg!==undefined)o.bg=bg;
  sendLyric(o);
  const nx=sy.e.L[k+1];if(nx&&nx[3]&&String(nx[3]).toLowerCase()!==bgk)bgFor(nx[3]);
 }finally{sy.busy=false;const w=sy.want;sy.want=undefined;if(w!==undefined&&w!==sy.last&&S.sync===sy)sendStanza(sy,w)}
 paintSync()
}
function tick(){
 const sy=S.sync,a=audioEl();if(!sy||sy.manual||!a||!S.cur||S.cur.n!==sy.n||S.cur.ed!==sy.ed)return;
 const k=curStanza(sy,a.currentTime||0);if(k!==sy.last)sendStanza(sy,k)
}
function paintSync(){const el=$('sth-sync');if(!el)return;const sy=S.sync;if(!sy||!S.cur||S.cur.n!==sy.n){el.innerHTML='';return}
 el.innerHTML='<small>'+(sy.last<0?'Título':'Estrofe '+(sy.last+1)+' de '+sy.e.L.length)+'</small> <button onclick="STHymn.stz(-1)">◀ Estrofe</button><button onclick="STHymn.stz(1)">Estrofe ▶</button>'}
function stanzaJump(d){
 const sy=S.sync,a=audioEl();if(!sy)return;
 if(sy.manual){const k=Math.max(-1,Math.min(sy.e.L.length-1,sy.last+d));if(k!==sy.last)sendStanza(sy,k);return}
 if(!a)return;const ti=sy.pb?1:0,k=Math.max(0,Math.min(sy.e.L.length-1,(sy.last<0?0:sy.last)+d));a.currentTime=sy.e.L[k][ti];sy.last=-9;tick()
}
document.addEventListener('timeupdate',ev=>{if(ev.target&&ev.target.id==='sthAudio')tick()},true);
document.addEventListener('seeked',ev=>{if(ev.target&&ev.target.id==='sthAudio'){if(S.sync)S.sync.last=-9;tick()}},true);

/* ---------- player ---------- */
let objUrl='';
async function urlFor(ed,n,mode){
 const L=S.local[ed]&&S.local[ed][n];
 if(L){
  await ensureRead();let r=L,note='';
  if(mode==='pb'){if(L.pb)r=L.pb;else if(!L.onlyPb)note='Este item não tem playback; tocando o cantado.'}
  const f=r.file||(r.rel?await cpFile(r.rel):await r.handle.getFile());if(objUrl)try{URL.revokeObjectURL(objUrl)}catch(e){}objUrl=URL.createObjectURL(f);
  return{url:objUrl,name:r.name,pb:(mode==='pb'&&!!L.pb)||(r===L&&!!L.onlyPb),note}
 }
 throw Error('Este item não tem arquivo neste computador. Toque em Sincronizar.')
}
function audioEl(){return $('sthAudio')}
async function play(ed,n,opts){
 const a=audioEl();if(!a)return;const h=find(ed,n);
 try{
  S.sync=null;
  if(S.mode==='sem'){
   a.pause();a.removeAttribute('src');a.load();S.cur={ed,n};
   if(startSync(ed,n,'',{manual:true}))say('Slide sem áudio: '+(h?h.t:'')+'. Use ◀ Estrofe e Estrofe ▶.');
   else{S.cur=null;say('Este item não tem letra para projetar.')}
   paintPlayer();paint();return
  }
  const u=await urlFor(ed,n,S.mode);
  S.cur={ed,n};a.src=u.url;a.volume=typeof window.volume==='number'?Math.min(1,Math.max(0,window.volume)):1;await a.play();
  if(!(opts&&opts.silent))startSync(ed,n,u.name,{pb:u.pb});
  say(u.note||('Tocando: '+(ED[ed].coll?'':n+' · ')+(h?h.t:'')))
 }catch(e){say('Não foi possível tocar: '+(e&&e.message||e))}
 paintPlayer();paint();
}
function next(dir){
 if(S.queue.length&&dir>0){const q=S.queue.shift();play(q.ed,q.n);return}
 const c=S.cur;if(!c)return;const ls=list(c.ed).filter(h=>playable(c.ed,h));const i=ls.findIndex(h=>h.n===c.n);const t=ls[i+(dir>0?1:-1)];if(t)play(c.ed,t.n)
}

/* ---------- ações ---------- */
const api={
 mode(m){S.mode=m;try{localStorage.setItem('iasd-sth-mode',m)}catch(e){}paintMode();paintBody()},
 album(i){S.album=i;S.limit=80;S.q='';setQ('');paintBody();scrollTop()},albumBack(){S.album=null;S.limit=80;paintBody()},
 ed(id){S.ed=id;S.album=null;S.q='';setQ('');S.limit=80;try{localStorage.setItem('iasd-sth-ed',id)}catch(e){}loadLyrics(id);paintCols();paintBody()},
 input(v){S.q=v;S.limit=80;paintBody()},
 more(){S.limit+=120;paintBody()},
 play(ed,n){play(ed,n)},
 rowPlay(ed,n){const a=audioEl(),c=S.cur;if(c&&c.ed===ed&&c.n===n&&S.mode!=='sem'&&a&&a.src){a.paused?a.play():a.pause()}else play(ed,n)},
 queue(ed,n){const h=find(ed,n);S.queue.push({ed,n,t:h?h.t:''});say('Na fila: '+(h?h.t:n));if(!S.cur||audioEl().paused&&!audioEl().currentTime)next(1);else paintPlayer()},
 unqueue(i){S.queue.splice(i,1);paintPlayer()},
 clearQueue(){S.queue=[];paintPlayer()},
 toggle(){const a=audioEl();if(!a||!a.src)return;a.paused?a.play():a.pause()},
 next(){next(1)},prev(){next(-1)},
 stop(){const a=audioEl();if(a){a.pause();a.removeAttribute('src');a.load()}S.cur=null;S.sync=null;paintPlayer();paintBody()},
 seek(v){const a=audioEl();if(a&&a.duration)a.currentTime=a.duration*(+v/1000)},
 vol(v){const a=audioEl();if(a)a.volume=+v/100},
 stz(d){stanzaJump(d)},sync(){syncAll('manual')},tg(k,o){S.stOpen[k]=o},db(){connectDb()},
 folder(){connectFolder()},reconnect(){reconnectFolder()},indexFiles(ed,files){return indexFiles(ed,files)},numOf
};
window.STHymn=api;

/* ---------- desenho ---------- */
const ico=n=>'<svg class="ti"><use href="#i-'+n+'"/></svg>';
const hasFolder=()=>!!((S.cp&&S.cp.root)||S.rootH||S.files.length),hasDb=()=>!!((S.cp&&S.cp.db)||S.dbH||S.ljaMeta),connected=()=>hasFolder()||hasDb();
function setQ(v){const i=$('sthq');if(i)i.value=v}
function scrollTop(){const b=$('sth-body');if(b&&b.scrollIntoView)b.scrollIntoView({block:'nearest'})}
function filtered(){
 const c=!!ED[S.ed].coll,q=S.q.trim();let r=list();
 if(c&&S.album!==null&&!q)r=r.filter(h=>h.ai===S.album);
 if(q){
  if(/^\d+$/.test(q)){const n=+q;if(c)r=r.filter(h=>h.tr===n&&(S.album===null||h.ai===S.album));else r=r.filter(h=>h.n===n).concat(r.filter(h=>h.n!==n&&String(h.n).startsWith(q)))}
  else{const f=fold(q);r=r.filter(h=>h.key.includes(f)).concat(r.filter(h=>!h.key.includes(f)&&h.body.includes(f)))}}
 return r;
}
function cpHint(){
 if(S.cp)return '<div class="sth-via ok">Lendo pelo <b>IASD Projetor</b>, sem pedir permissão ao Chrome.</div>';
 const i=S.cpInfo;
 if(!i)return '<div class="sth-via">Dica: abra o <b>IASD Projetor</b> neste computador. Assim o site lê a pasta do Louvor JA sozinho, sem permissão do Chrome.</div>';
 if(!cpTok()||!i.paired)return '<div class="sth-via">O IASD Projetor está aberto, mas não está pareado com este site. Em <b>Sonoplastia → Conectar IASD Projetor</b>, digite o código.</div>';
 return '<div class="sth-via">O IASD Projetor aberto é antigo (v'+esc(i.version)+'). Atualize para a 0.5.7 ou mais nova para ler a pasta do Louvor JA.</div>'
}
/* 1) conexão: três passos na primeira vez; depois, uma linha só */
let _cnHtml='';
function paintConn(){
 const el=$('sth-conn');if(!el)return;let html;
 if(S.busy){html='<div class="sth-conn"><div class="sth-busy"><i class="sth-spin"></i><span>'+esc(S.busy)+'</span></div></div>'}
 else if(!(hasFolder()&&hasDb()&&S.cnt)){
  const pth=x=>x?'<small class="sth-path" title="'+esc(x)+'">'+esc(x)+'</small>':'';
  const st=(n,done,t,d,btn,fn,pri)=>'<li class="'+(done?'ok':'')+'"><span class="n">'+(done?ico('check'):n)+'</span><div class="t"><b>'+t+'</b><small>'+d+'</small></div><button type="button" class="'+(pri?'mp-blue':'mp-btn')+'" onclick="STHymn.'+fn+'()"'+(fn==='sync'&&!(hasFolder()||hasDb())?' disabled':'')+'>'+btn+'</button></li>';
  html='<div class="sth-conn"><div class="sth-ch"><b>Conectar o Louvor JA</b><small>Só na primeira vez neste computador. Nada é enviado para a internet.</small></div><ol class="sth-steps">'
   +st(1,hasFolder(),'Pasta do programa',(S.cp&&S.cp.root?'Encontrada neste computador.'+pth(S.cp.root):'Escolha a pasta <code>config</code> (a que tem <code>musicas</code> e <code>imagens</code>).'),hasFolder()?'Trocar':'Escolher pasta','folder',!hasFolder())
   +st(2,hasDb(),'Banco de dados',(S.cp&&S.cp.db?'Encontrado neste computador.'+pth(S.cp.db.path):'Escolha o arquivo <code>database.db</code> do programa.'),hasDb()?'Trocar':'Escolher arquivo','db',hasFolder()&&!hasDb())
   +st(3,!!S.cnt,'Sincronizar','Confere o que já está neste computador.','Sincronizar agora','sync',hasFolder()&&hasDb()&&!S.cnt)
   +'</ol>'+cpHint()+(S.cp?'':'<details class="sth-help"><summary>O Chrome disse que a pasta contém arquivos do sistema?</summary><p>O Chrome não deixa abrir pastas como <code>Program Files</code>, <code>ProgramData</code>, <code>Windows</code> ou a raiz do disco. Se o Louvor JA estiver em uma delas, use o <b>IASD Projetor</b> (ele lê a pasta sem esse bloqueio) ou escolha uma pasta de outro lugar que tenha os mesmos arquivos.</p></details>')+'</div>'
 }else{
  const c=S.cnt,tot=KEYS.reduce((a,k)=>a+(c[k]?c[k].found:0),0),all=KEYS.reduce((a,k)=>a+(c[k]?c[k].total:0),0);
  const perm=S.lstat.novo==='perm'||S.lstat.db==='perm';
  const det=(id,t,arr)=>arr.length?'<details'+(S.stOpen[id+t]?' open':'')+' ontoggle="STHymn.tg(\''+id+t+'\',this.open)"><summary>'+arr.length+' '+t+'</summary><div class="sth-miss">'+arr.slice(0,80).map(esc).join('<br>')+(arr.length>80?'<br>…e mais '+(arr.length-80):'')+'</div></details>':'';
  const card=id=>{const x=c[id];if(!x||!x.total)return '';const ln=[x.found+' de '+x.total+' com áudio'];
   if(x.prog!==null)ln.push(x.synced+' com letra sincronizada');else if(x.synced!==x.found)ln.push(x.synced+' com letra');
   if(x.noBg)ln.push(x.noBg+' sem fundo');
   return '<div class="sth-sc"><b>'+esc(ED[id].nome)+'</b><span>'+ln.join(' · ')+'</span>'+det(id,'faltando na pasta',x.miss)+det(id,'sem correspondência no programa',x.noProg)+'</div>'};
  html='<div class="sth-conn ok"><div class="sth-sum"><span class="sth-dot'+(perm?' warn':'')+'"></span><div class="t"><b>'+tot+' de '+all+' itens com áudio neste computador</b><small>'+(perm?'O Chrome pediu permissão de novo para ler a pasta.':'Sincronizado '+ago(S.syncAt)+(S.cp?' · via IASD Projetor':''))+'</small></div>'
   +(perm?'<button type="button" class="mp-blue" onclick="STHymn.reconnect()">Reconectar</button>':'<button type="button" class="mp-btn" onclick="STHymn.sync()">'+ico('shuffle')+'Sincronizar agora</button>')+'</div>'
   +'<details class="sth-more-d"'+(S.stOpen.all?' open':'')+' ontoggle="STHymn.tg(\'all\',this.open)"><summary>Detalhes por coleção</summary><div class="sth-cards">'+KEYS.map(card).join('')+'</div><div class="sth-acts"><button type="button" class="mp-btn" onclick="STHymn.folder()">Trocar pasta</button><button type="button" class="mp-btn" onclick="STHymn.db()">Trocar banco</button>'+(perm?'':'<button type="button" class="mp-btn" onclick="STHymn.reconnect()">Reconectar</button>')+'</div></details></div>'
 }
 if(html!==_cnHtml){_cnHtml=html;el.innerHTML=html}
}
function paintBar(){paintConn()}
/* 2) coleções, busca e tipo de slide */
function colCount(k){const x=S.cnt&&S.cnt[k];if(x)return x.found;const m=S.ljaMeta&&S.ljaMeta.counts;return m?m[k]:0}
function paintCols(){
 const el=$('sth-cols');if(!el)return;
 el.innerHTML=KEYS.map(k=>'<button type="button" role="tab" class="'+(S.ed===k?'on':'')+'" onclick="STHymn.ed(\''+k+'\')"><span>'+esc(ED[k].nome)+'</span><i class="cnt">'+colCount(k)+'</i></button>').join('')
}
const MODES=[['cantado','Slide Cantado','Toca a música cantada e mostra cada estrofe na hora certa.'],['pb','Slide Playback','Toca só o instrumental e mostra a letra na hora certa.'],['sem','Slide sem Áudio','Não toca nada: você passa as estrofes com os botões ◀ ▶.']];
function paintMode(){
 const el=$('sth-mode');if(!el)return;
 el.innerHTML='<div class="seg s3" role="radiogroup" aria-label="Tipo de slide">'+MODES.map(([k,l])=>'<button type="button" role="radio" aria-checked="'+(S.mode===k)+'" class="'+(S.mode===k?'on':'')+'" onclick="STHymn.mode(\''+k+'\')">'+l+'</button>').join('')+'</div><p class="sth-hint">'+MODES.find(m=>m[0]===S.mode)[2]+'</p>'
}
/* 3) lista */
function row(h){
 const coll=!!ED[S.ed].coll,has=playable(S.ed,h),c=S.cur,cur=c&&c.ed===S.ed&&c.n===h.n,a=audioEl(),pl=cur&&a&&!a.paused&&S.mode!=='sem';
 const loc=S.local[S.ed]&&S.local[S.ed][h.n];let sub='';
 if(!has)sub='Sem arquivo neste computador';
 else if(S.mode==='pb'&&loc&&!loc.pb&&!loc.onlyPb)sub='Sem playback · toca o cantado';
 else if(S.mode==='cantado'&&loc&&loc.onlyPb)sub='Só playback';
 else if(coll&&h.album&&(S.q||S.album===null))sub=h.album;
 return '<div class="amb-row sth-r'+(cur?' is-sel':'')+(has?'':' no')+'"><button type="button" class="amb-play" '+(has?'onclick="STHymn.rowPlay(\''+S.ed+'\','+h.n+')"':'disabled')+' title="'+(S.mode==='sem'?'Projetar':'Tocar')+'">'+(pl?'<b class="sth-pz">Ⅱ</b>':ico('play'))+'</button>'
  +'<span class="sth-no">'+(coll?(h.tr||'·'):h.n)+'</span><div class="amb-info"><b>'+esc(h.t)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div>'
  +(has?'<button type="button" class="amb-x" onclick="STHymn.queue(\''+S.ed+'\','+h.n+')" title="Adicionar à fila">'+ico('plus')+'</button>':'')+'</div>';
}
function albumGrid(al){
 const cnt={};(S.data[S.ed]||[]).forEach(h=>{if(playable(S.ed,h))cnt[h.ai]=(cnt[h.ai]||0)+1});
 return '<div class="sth-albs">'+al.map((a,i)=>'<button type="button" class="sth-ab" onclick="STHymn.album('+i+')"><span class="sth-cv" data-cv="'+esc(a.cover||'')+'"><i>'+esc(String(a.name||'?').slice(0,1))+'</i></span><b>'+esc(a.name)+'</b><small>'+a.tracks.length+' música'+(a.tracks.length===1?'':'s')+(S.cnt?' · '+(cnt[i]||0)+' com áudio':'')+'</small></button>').join('')+'</div>'
}
const empty=(t,b)=>'<div class="amb-empty"><span>'+t+'</span>'+(b||'')+'</div>';
function paintBody(){
 const b=$('sth-body');if(!b)return;
 if(!connected()){b.innerHTML=empty('Conecte o Louvor JA acima para ver e tocar as músicas.');return}
 const st=S.status[S.ed],coll=!!ED[S.ed].coll,albs=S.alb[S.ed]||[],q0=S.q.trim();let html='';
 if(st==='loading'||(!st&&!S.data[S.ed])){b.innerHTML=empty('Carregando…');return}
 if(st==='err'){b.innerHTML=empty('Não foi possível carregar esta coleção.','<button type="button" class="mp-btn" onclick="STHymn.ed(\''+S.ed+'\')">Tentar de novo</button>');return}
 if(coll&&st==='nodb'){b.innerHTML=empty(hasDb()?'Esta coleção está vazia no banco do programa.':'Escolha o arquivo <code>database.db</code> no passo 2 para ver esta coleção.');return}
 if(coll&&albs.length>1&&S.album===null&&!q0){b.innerHTML=albumGrid(albs);fillCovers();return}
 if(coll&&S.album!==null&&!q0&&albs[S.album])html+='<div class="sth-albhd"><button type="button" class="mp-btn" onclick="STHymn.albumBack()">← Álbuns</button><b>'+esc(albs[S.album].name)+'</b></div>';
 const L=filtered(),shown=L.slice(0,S.limit);
 html+='<div class="amb-list">'+shown.map(row).join('')+'</div>'+(L.length>shown.length?'<button type="button" class="amb-more" onclick="STHymn.more()">Mostrar mais ('+(L.length-shown.length)+')</button>':'')+(!L.length?empty('Nenhuma música encontrada.'):'');
 b.innerHTML=html;
}
/* 4) tocando agora */
function paintPlayer(){
 const el=$('sthp');if(!el)return;
 const c=S.cur,h=c&&find(c.ed,c.n),a=audioEl(),playing=a&&!a.paused,sem=S.mode==='sem';
 if(!c&&!S.queue.length){el.hidden=true;el.innerHTML='';return}
 el.hidden=false;
 const q=S.queue.length?'<div class="sth-q"><small>Fila · '+S.queue.length+'</small>'+S.queue.map((x,i)=>'<span>'+esc(x.t)+'<button type="button" onclick="STHymn.unqueue('+i+')" title="Tirar da fila">'+ico('x')+'</button></span>').join('')+'<button type="button" class="sth-cl" onclick="STHymn.clearQueue()">Limpar</button></div>':'';
 el.innerHTML=(c?'<div class="sth-now"><div class="amb-info"><small>TOCANDO AGORA · '+esc(MODES.find(m=>m[0]===S.mode)[1].toUpperCase())+'</small><b>'+(ED[c.ed].coll?'':c.n+' · ')+esc(h?h.t:'')+'</b></div>'
   +'<div class="sth-ctl"><button type="button" class="sthb" onclick="STHymn.prev()" title="Anterior">⏮</button>'+(sem?'':'<button type="button" class="sthb big" onclick="STHymn.toggle()" title="Tocar / pausar">'+(playing?'Ⅱ':'▶')+'</button>')+'<button type="button" class="sthb" onclick="STHymn.next()" title="Próximo">⏭</button><button type="button" class="sthb" onclick="STHymn.stop()" title="Parar">■</button></div></div>'
   +(sem?'':'<div class="sth-seek"><span id="sthpT">0:00</span><input id="sthpS" type="range" min="0" max="1000" value="0" oninput="STHymn.seek(this.value)" aria-label="Posição"><span id="sthpD">0:00</span><label class="sth-vol" title="Volume">🔊<input type="range" min="0" max="100" value="'+Math.round((a?a.volume:1)*100)+'" oninput="STHymn.vol(this.value)" aria-label="Volume"></label></div>')
   +'<div id="sth-sync" class="sth-stz"></div>':'')+q;
 paintSync();
}
function paintSync(){const el=$('sth-sync');if(!el)return;const sy=S.sync;if(!sy||!S.cur||S.cur.n!==sy.n){el.innerHTML='';return}
 el.className='sth-stz'+(sy.manual?' big':'');
 el.innerHTML='<button type="button" class="mp-btn" onclick="STHymn.stz(-1)">◀ Estrofe</button><span>'+(sy.last<0?'Título':'Estrofe '+(sy.last+1)+' de '+sy.e.L.length)+'</span><button type="button" class="mp-btn" onclick="STHymn.stz(1)">Estrofe ▶</button>'}
function paint(){paintCols();paintMode();paintConn();paintBody();paintPlayer()}

function mount(){
 const sec=$('hymnal');if(!sec||$('sth'))return;
 const box=document.createElement('div');box.id='sth';
 box.innerHTML='<div id="sth-conn"></div><div class="seg sth-cols" id="sth-cols" role="tablist"></div>'
  +'<div class="amb-search"><label class="amb-in">'+ico('search')+'<input id="sthq" type="search" inputmode="search" autocomplete="off" placeholder="Pesquisar por nome ou número…" oninput="STHymn.input(this.value)"></label></div>'
  +'<div id="sth-mode"></div><div id="sthp" class="amb-sel has sth-player" hidden></div><div id="sth-body"></div><audio id="sthAudio" preload="auto"></audio>';
 sec.appendChild(box);
 const a=$('sthAudio');
 a.addEventListener('timeupdate',()=>{const s=$('sthpS');if(s&&a.duration&&document.activeElement!==s)s.value=Math.round(a.currentTime/a.duration*1000);const t=$('sthpT'),d=$('sthpD');if(t)t.textContent=fmt(a.currentTime);if(d)d.textContent=fmt(a.duration)});
 a.addEventListener('play',()=>{paintPlayer();paintBody()});a.addEventListener('pause',()=>{paintPlayer();paintBody()});
 a.addEventListener('ended',()=>{if(S.queue.length)next(1);else{paintPlayer();paintBody()}});
 a.addEventListener('error',()=>{if(S.cur&&a.src)say('Falha ao carregar o áudio. Tente de novo.')});
 const style=document.createElement('style');style.textContent=
 '#sth{display:grid;gap:14px;min-width:0;max-width:100%}#sth *{box-sizing:border-box;min-width:0}#sth code{background:rgba(127,150,200,.18);padding:1px 6px;border-radius:5px;font-size:12px}#sth input[type=range]{width:auto;accent-color:#3574f3}'
 +'.sth-conn{border:1px solid var(--bd);border-radius:12px;background:var(--sf2);padding:14px;display:grid;gap:12px}.sth-ch{display:grid;gap:2px}.sth-ch small,.sth-conn small{color:var(--mu);font-size:12.5px}'
 +'.sth-steps{list-style:none;margin:0;padding:0;display:grid;gap:8px}.sth-steps li{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--bd);border-radius:10px;background:var(--sf)}.sth-steps .n{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;flex:none;font-size:13px;font-weight:700;background:var(--sf3);color:var(--tx)}.sth-steps .n .ti{width:16px;height:16px}.sth-steps li.ok .n{background:#16a34a;color:#fff}.sth-steps .t{flex:1;display:grid;gap:2px}.sth-steps .t b{font-size:14px}.sth-steps button{flex:none}.sth-steps button[disabled]{opacity:.45;cursor:not-allowed}'
 +'.sth-path{display:block;word-break:break-all;color:var(--mu);font-size:11.5px}.sth-via{font-size:12.5px;color:var(--mu);line-height:1.45;padding:8px 10px;border-radius:9px;background:var(--sf)}.sth-via.ok{color:#4ade80}.sth-help summary,.sth-more-d summary{cursor:pointer;color:#7fa6ff;font-size:13px;font-weight:600}.sth-help p{margin:8px 0 0;font-size:13px;color:var(--mu);line-height:1.5}'
 +'.sth-conn.ok{padding:10px 12px;gap:8px}.sth-sum{display:flex;align-items:center;gap:12px}.sth-sum .t{flex:1;display:grid;gap:2px}.sth-sum .t b{font-size:14px}.sth-dot{width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.18);flex:none}.sth-dot.warn{background:#f59e0b;box-shadow:0 0 0 4px rgba(245,158,11,.2)}'
 +'.sth-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;margin-top:10px}.sth-sc{display:grid;gap:4px;padding:10px;border:1px solid var(--bd);border-radius:10px;background:var(--sf);font-size:12.5px}.sth-sc span{color:var(--mu)}.sth-sc summary{cursor:pointer;color:#7fa6ff}.sth-miss{max-height:140px;overflow:auto;padding:4px 0 2px 10px;color:var(--mu)}.sth-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}'
 +'.sth-busy{display:flex;align-items:center;gap:10px;font-size:13.5px}.sth-spin{width:16px;height:16px;border-radius:50%;border:2px solid var(--bd2);border-top-color:#5b93ff;animation:sthspin .8s linear infinite;flex:none}@keyframes sthspin{to{transform:rotate(360deg)}}'
 +'.sth-cols{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}.sth-cols button{height:auto;min-height:44px;padding:6px 8px!important;line-height:1.2;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 8px!important}.sth-cols button span{white-space:normal;text-align:center}.sth-cols .cnt{flex:none}'
 +'#sth .amb-search{display:flex}#sth-mode .seg{margin:0}.sth-hint{margin:8px 2px 0;font-size:12.5px;color:var(--mu)}#sth-mode .seg.s3 button{height:42px}'
 +'.sth-r.no{opacity:.55}.sth-r .amb-play[disabled]{opacity:.4;cursor:not-allowed}.sth-no{min-width:34px;text-align:center;font-weight:700;font-size:15px;color:#f5b73a;flex:none}.sth-pz{font-size:15px;letter-spacing:-1px}.sth-r .amb-info small{font-size:12px}'
 +'.sth-albs{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}.sth-ab{display:flex!important;flex-direction:column;gap:6px;align-items:stretch;text-align:left;padding:8px!important;border-radius:12px!important;background:var(--sf2)!important;border:1px solid var(--bd)!important;height:auto!important;cursor:pointer}.sth-ab:hover{border-color:#5b93ff!important}.sth-ab b{font-size:13px;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-weight:600}.sth-ab small{color:var(--mu);font-size:11.5px}'
 +'.sth-cv{display:block;aspect-ratio:1/1;border-radius:9px;background:linear-gradient(135deg,#1d3a6e,#0e1f3d) center/cover no-repeat;position:relative;overflow:hidden}.sth-cv i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:34px;font-weight:800;color:#fff;opacity:.4}.sth-cv.has i{display:none}'
 +'.sth-albhd{display:flex;gap:12px;align-items:center;margin-bottom:6px}.sth-albhd b{font-size:15px}'
 +'.sth-player{display:grid!important;gap:10px}.sth-player[hidden]{display:none!important}.sth-now{display:flex;align-items:center;gap:12px}.sth-now .amb-info b{font-size:15px}.sth-ctl{display:flex;gap:6px;flex:none}.sthb{width:40px;height:40px;padding:0!important;border-radius:50%!important;background:#13244a!important;border:1px solid var(--bd)!important;color:#fff!important;font-size:15px;display:grid;place-items:center;cursor:pointer}.sthb.big{width:46px;height:46px;background:linear-gradient(180deg,#3574f3,#1e4fd0)!important;border-color:#5b93ff!important;font-size:17px}'
 +'.sth-seek{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--mu)}.sth-seek>input{flex:1}.sth-vol{display:flex;gap:6px;align-items:center;flex:none;font-size:13px}.sth-vol input{width:90px}'
 +'.sth-stz{display:flex;align-items:center;justify-content:center;gap:10px;font-size:13px}.sth-stz:empty{display:none}.sth-stz span{min-width:110px;text-align:center;color:var(--mu);font-weight:600}.sth-stz.big button{flex:1;height:48px;font-size:14px}.sth-stz.big span{color:var(--tx)}'
 +'.sth-q{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px}.sth-q small{color:var(--mu)}.sth-q span{display:flex;gap:4px;align-items:center;padding:3px 4px 3px 10px;border-radius:99px;background:var(--sf3)}.sth-q span button{width:22px;height:22px;padding:0;border:0;background:transparent;color:inherit;display:grid;place-items:center;cursor:pointer}.sth-q span .ti{width:13px;height:13px}.sth-cl{padding:4px 10px;border-radius:99px;border:1px solid var(--bd);background:transparent;color:inherit;font-size:11.5px;cursor:pointer}'
 +'@media(max-width:620px){.sth-steps li{flex-wrap:wrap}.sth-steps button{width:100%}.sth-sum{flex-wrap:wrap}.sth-now{flex-wrap:wrap}.sth-seek{flex-wrap:wrap}.sth-vol{width:100%}.sth-vol input{flex:1;width:auto}}';
 document.head.appendChild(style);
 loadLyrics(S.ed).then(paint);restoreLocal();paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
