/* Músicas especiais › Meus arquivos: áudio e vídeo próprios da igreja (sem anúncio), guardados no Supabase (bucket privado). */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const sec=$('special'),tabs=$('spTabs');if(!sec||!tabs)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BUCKET='iasd-media-files';
const S={rows:[],st:'',err:'',busy:'',q:'',cur:null};
const cloud=()=>{try{return window.parent&&window.parent.iasdCloud||null}catch(e){return null}};
const me=()=>{try{return window.parent.iasdCurrentUser&&window.parent.iasdCurrentUser()}catch(e){return null}};
const say=m=>{try{window.feedback(m)}catch(e){}};
const isVideo=r=>/^video\//.test(r.mime||'')||/\.(mp4|webm|mov)$/i.test(r.storage_path||'');
const size=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round((n||0)/1024))+' KB';
const urls={};
async function url(r){const h=urls[r.id];if(h&&h.exp>Date.now())return h.u;const x=await cloud().storage.from(BUCKET).createSignedUrl(r.storage_path,3600);if(x.error)throw x.error;urls[r.id]={u:x.data.signedUrl,exp:Date.now()+50*60*1000};return x.data.signedUrl}
async function load(force){
 const c=cloud();if(!c){S.st='nocloud';paint();return}
 if(S.st==='ok'&&!force)return;S.st='loading';paint();
 try{const r=await c.from('iasd_media_files').select('*').order('created_at',{ascending:false});if(r.error)throw r.error;S.rows=r.data||[];S.st='ok'}
 catch(e){S.st='err';S.err=/relation|does not exist|schema cache/i.test(e.message||'')?'Falta rodar o SQL docs/supabase-sonoplastia-arquivos.sql no Supabase.':(e.message||'Falha ao carregar.')}
 paint();
}
const api={
 reload(){S.st='';load(true)},
 q(v){S.q=v;paintList()},
 upload(){const i=document.createElement('input');i.type='file';i.multiple=true;i.accept='audio/*,video/mp4,video/webm,video/quicktime';i.onchange=async()=>{
   const c=cloud(),u=me();if(!c||!u){say('Entre na conta de sonoplasta para enviar arquivos.');return}
   const fs=[...i.files];let ok=0;
   for(let k=0;k<fs.length;k++){const f=fs[k];S.busy='Enviando '+(k+1)+' de '+fs.length+': '+f.name;paint();
    try{if(f.size>50*1024*1024)throw Error('passa de 50 MB');
     const ext=(/\.([a-z0-9]{2,4})$/i.exec(f.name)||[,'mp3'])[1].toLowerCase(),path=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
     const up=await c.storage.from(BUCKET).upload(path,f,{contentType:f.type||undefined,cacheControl:'3600'});if(up.error)throw up.error;
     const title=f.name.replace(/\.[^.]+$/,'').replace(/[_]+/g,' ').trim().slice(0,120);
     const r=await c.from('iasd_media_files').insert({title,mime:f.type||'',storage_path:path,size_bytes:f.size}).select().single();if(r.error)throw r.error;S.rows.unshift(r.data);ok++}
    catch(e){say('Falha em '+f.name+': '+(e.message||e))}}
   S.busy='';say(ok+' arquivo'+(ok===1?'':'s')+' enviado'+(ok===1?'':'s')+'.');paint()};i.click()},
 async play(id){const r=S.rows.find(x=>x.id===id);if(!r)return;window.stTakeover&&stTakeover('');try{const u=await url(r);S.cur=r;const box=$('sfPlayer');box.hidden=false;box.querySelectorAll('audio,video').forEach(old=>{old.style.display='none';document.body.append(old);void IASDAudio.pause(old,IASDAudio.duration(180),()=>old.remove())});box.innerHTML='<b>'+esc(r.title)+'</b>';const el=document.createElement(isVideo(r)?'video':'audio');el.controls=true;el.src=u;el.style.width='100%';if(isVideo(r))el.style.maxHeight='160px';box.append(el);IASDAudio.install(el);el.play().catch(()=>{});say('Tocando aqui: '+r.title)}catch(e){say('Não foi possível tocar: '+(e.message||e))}},
 async project(id){const r=S.rows.find(x=>x.id===id);if(!r)return;try{const u=await url(r);const vol=(typeof window.muted!=='undefined'&&window.muted)?0:(typeof window.volume==='number'?window.volume:.75);
   const pl='IASD_LOCAL_MEDIA:'+JSON.stringify({kind:isVideo(r)?'video':'audio',url:u,name:r.title,volume:vol});
   if(typeof window.prepare==='function')try{window.prepare(pl,'Mídia: '+r.title)}catch(e){}
   window.project(pl);say('Enviado ao telão: '+r.title)}catch(e){say('Falha ao projetar: '+(e.message||e))}},
 async rename(id){const r=S.rows.find(x=>x.id===id);if(!r)return;const t=window.IASDDialog?await IASDDialog.prompt('Nome do arquivo:',r.title):prompt('Nome do arquivo:',r.title);if(!t||!t.trim())return;const x=await cloud().from('iasd_media_files').update({title:t.trim().slice(0,120)}).eq('id',id);if(x.error){say('Não foi possível renomear.');return}r.title=t.trim().slice(0,120);paint()},
 async remove(id){const r=S.rows.find(x=>x.id===id);if(!r)return;const ok=window.IASDDialog?await IASDDialog.confirm('Remover “'+r.title+'” dos seus arquivos?',{ok:'Remover'}):confirm('Remover?');if(!ok)return;
   try{await cloud().storage.from(BUCKET).remove([r.storage_path]);const x=await cloud().from('iasd_media_files').delete().eq('id',id);if(x.error)throw x.error;S.rows=S.rows.filter(y=>y.id!==id);delete urls[id];say('Arquivo removido.')}catch(e){say('Não foi possível remover: '+(e.message||e))}paint()}
};
window.STFiles=api;
function paintList(){
 const el=$('sfList');if(!el)return;const q=S.q.trim().toLowerCase();
 const rows=S.rows.filter(r=>!q||r.title.toLowerCase().includes(q));
 el.innerHTML=rows.map(r=>'<div class="sf-row"><span class="sf-ic">'+(isVideo(r)?'🎬':'🎵')+'</span><div class="sf-info"><b>'+esc(r.title)+'</b><small>'+(isVideo(r)?'Vídeo':'Áudio')+' · '+size(r.size_bytes)+' · <i>sem anúncio</i></small></div><div class="sf-bt"><button onclick="STFiles.play(\''+r.id+'\')" title="Tocar aqui (computador da sonoplastia)">▶</button><button class="pj" onclick="STFiles.project(\''+r.id+'\')" title="Projetar no telão">▣ Telão</button><button onclick="STFiles.rename(\''+r.id+'\')" title="Renomear">✎</button><button class="rm" onclick="STFiles.remove(\''+r.id+'\')" title="Remover">✕</button></div></div>').join('')||(S.st==='ok'?'<p class="muted">'+(S.rows.length?'Nada encontrado.':'Você ainda não enviou arquivos. Use “⬆ Enviar arquivos”.')+'</p>':'');
}
function paint(){
 const pane=$('spPaneFiles');if(!pane)return;
 const n=$('spFilesN');if(n)n.textContent=S.rows.length;
 const head=$('sfHead');
 head.innerHTML='<button class="mp-blue" onclick="STFiles.upload()">⬆ Enviar arquivos</button><label class="amb-in sf-q"><input type="search" placeholder="Filtrar meus arquivos…" value="'+esc(S.q)+'" oninput="STFiles.q(this.value)"></label>'
  +(S.busy?'<span class="sf-busy">⏳ '+esc(S.busy)+'</span>':'');
 const w=$('sfWarn');
 w.innerHTML=S.st==='nocloud'?'Abra o Studio pelo IASD APP (logado como sonoplasta) para usar os arquivos.':S.st==='err'?esc(S.err)+' <button onclick="STFiles.reload()">Tentar de novo</button>':S.st==='loading'?'Carregando…':'';
 w.hidden=!w.innerHTML;paintList();
}
function mount(){
 if($('spPaneFiles'))return;
 tabs.classList.remove('s2');tabs.classList.add('s3');
 const b=document.createElement('button');b.dataset.pane='files';b.setAttribute('role','tab');b.innerHTML='Meus arquivos <i class="cnt" id="spFilesN">0</i>';tabs.append(b);
 const pane=document.createElement('div');pane.className='mm-pane';pane.id='spPaneFiles';pane.hidden=true;
 pane.innerHTML='<p class="sf-tip">Áudio e vídeo da própria igreja, guardados na sua conta: <b>sem anúncio</b> e sem depender do YouTube. Envie só o que a igreja tem direito de usar.</p><div class="sf-head" id="sfHead"></div><p class="sth-warn" id="sfWarn" hidden></p><div id="sfPlayer" class="sf-player" hidden></div><div class="sf-list" id="sfList"></div>';
 const now=$('specialNow');now.parentNode.insertBefore(pane,now);
 const all=[...tabs.querySelectorAll('button')];
 b.addEventListener('click',()=>{all.forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-selected',on)});['spPaneFind','spPaneGal'].forEach(i=>{const e=$(i);if(e)e.hidden=true});pane.hidden=false;load();if(typeof requestStudioHeight==='function')requestStudioHeight()});
 all.filter(x=>x!==b).forEach(x=>x.addEventListener('click',()=>{pane.hidden=true}));
 const st=document.createElement('style');st.textContent=
 '#sfWarn[hidden],#sfPlayer[hidden]{display:none!important}.sf-tip{margin:6px 0 10px;padding:10px 12px;border-radius:12px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.35);font-size:13px;line-height:1.45}.sf-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}.sf-q{flex:1;min-width:160px}.sf-busy{font-size:12px;opacity:.85}'
 +'.sf-list{display:grid;gap:6px;max-height:260px;overflow:auto}.sf-row{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.05)}.sf-ic{font-size:22px}.sf-info{flex:1;min-width:0;display:grid}.sf-info b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sf-info small{opacity:.7;font-size:12px}.sf-info i{color:#4ade80;font-style:normal}'
 +'.sf-bt{display:flex;gap:4px}.sf-bt button{min-width:34px;height:34px;padding:0 9px;font-size:13px}.sf-bt .pj{background:#2563eb;color:#fff;border-color:transparent}.sf-bt .rm:hover{background:#e5484d;color:#fff}.sf-player{padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.06);margin-bottom:8px;display:grid;gap:4px}';
 document.head.appendChild(st);paint();
}
mount();
})();
