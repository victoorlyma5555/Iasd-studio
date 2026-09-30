/* Hinário Adventista: letras do hinário antigo e do novo, com busca por número, nome e trecho da letra.
   As fontes de dados ficam em /hinario-fontes.json (editável online). Cada fonte é baixada uma vez e guardada no aparelho. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const FALLBACK={versao:2,edicoes:[
 {id:'antigo',nome:'Hinário Adventista',sub:'Edição antiga (1996)',adapter:'local',urls:['/data/hinario-hasd.json']},
 {id:'novo',nome:'Novo Hinário Adventista',sub:'Edição nova (2022)',adapter:'local',urls:['/data/hinario-nha.json']}]};
const S={manifest:null,ed:'antigo',q:'',deep:false,sel:null,fav:[],font:0,data:{},status:{},favOnly:false};
try{S.fav=JSON.parse(localStorage.getItem('iasd-hin-fav')||'[]');S.ed=localStorage.getItem('iasd-hin-ed')||'antigo';S.font=+localStorage.getItem('iasd-hin-font')||0}catch(e){}

/* ---------- adaptadores: cada fonte vira {n,t,en,cat,sub,autores,ref,coro,estrofes,txt} ---------- */
const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
function finish(h){h.txt=fold([h.t,h.en].join(' '));h.body=fold((h.coro||[]).concat((h.estrofes||[]).map(e=>e.txt)).join(' '));return h}
const ADAPT={
 hina7(raw){
  const list=Array.isArray(raw)?raw:(raw.hinos||raw.songs||[]);
  return list.map((x,i)=>finish({n:Number(x.numero||x.id||i+1),t:String(x.title||x.titulo||'').trim(),en:x.ingles||'',cat:x.categoria||'',sub:x.sub_categoria||'',
   autores:(x.autores||[]).map(a=>a.nome||a).filter(Boolean),ref:x.texto_biblico||'',
   coro:(x.coro||[]).map(c=>c&&c.coro).filter(Boolean),
   estrofes:(x.estrofes||[]).map((e,j)=>({n:e.numero||roman[j]||String(j+1),txt:String(e.estrofe||'').trim()})).filter(e=>e.txt)}));
 },
 local(raw){
  return (Array.isArray(raw)?raw:[]).map(x=>finish({n:Number(x.n),t:String(x.t||'').trim(),en:'',cat:'',sub:'',autores:x.a||[],ref:'',coro:[],estrofes:(x.v||[]).map((v,j)=>({n:roman[j]||String(j+1),txt:String(v).trim()})).filter(e=>e.txt)}));
 },
 videopsalm(raw){
  const list=raw.Songs||raw.songs||(Array.isArray(raw)?raw:[]);
  return list.map((x,i)=>{
   const num=Number(x.Number||x.number||x.ID||x.id||i+1);
   let t=String(x.Text||x.Title||x.title||'').trim().replace(/^\s*\d{1,3}\s*[-–.)]\s*/,'');
   const verses=(x.Verses||x.verses||[]).map(v=>String(v.Text||v.text||'').trim()).filter(Boolean);
   return finish({n:num,t,en:'',cat:'',sub:'',autores:[x.Author,x.Composer].filter(Boolean),ref:'',coro:[],estrofes:verses.map((v,j)=>({n:roman[j]||String(j+1),txt:v}))});
  });
 }
};

/* ---------- carregamento ---------- */
async function getManifest(){
 if(S.manifest)return S.manifest;
 try{const r=await fetch('/hinario-fontes.json',{cache:'no-cache'});if(r.ok){const j=await r.json();if(j&&Array.isArray(j.edicoes)&&j.edicoes.length){S.manifest=j;return j}}}catch(e){}
 S.manifest=FALLBACK;return S.manifest;
}
async function load(id,force){
 const m=await getManifest(),ed=m.edicoes.find(e=>e.id===id);if(!ed)return;
 if(S.data[id]&&!force)return;
 const key='iasd-hin-data-v2-'+id;try{localStorage.removeItem('iasd-hin-data-'+id)}catch(e){}
 if(!force){try{const c=JSON.parse(localStorage.getItem(key)||'null');if(c&&c.list&&c.list.length){S.data[id]=c.list;S.status[id]='ok';return}}catch(e){}}
 S.status[id]='loading';paint();
 let lastErr='';
 for(const url of ed.urls||[]){
  try{
   const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),25000);
   const r=await fetch(url,{signal:ctl.signal});clearTimeout(to);
   if(!r.ok)throw Error('HTTP '+r.status);
   const list=(ADAPT[ed.adapter]||ADAPT.hina7)(await r.json()).filter(h=>h.t&&h.estrofes.length).sort((a,b)=>a.n-b.n);
   if(!list.length)throw Error('arquivo sem hinos reconhecidos');
   S.data[id]=list;S.status[id]='ok';
   try{localStorage.setItem(key,JSON.stringify({t:Date.now(),list}))}catch(e){}
   return;
  }catch(e){lastErr=e.message||String(e)}
 }
 S.status[id]='erro:'+lastErr;
}

/* ---------- busca: número exato → título → trecho da letra ---------- */
function search(list){
 const raw=S.q.trim();if(!raw&&!S.favOnly)return list.slice(0,700);
 let out=list;
 if(S.favOnly)out=out.filter(h=>S.fav.includes(S.ed+'|'+h.n));
 if(!raw)return out;
 if(/^\d{1,3}$/.test(raw)){const n=+raw;const ex=out.filter(h=>h.n===n),ps=out.filter(h=>h.n!==n&&String(h.n).startsWith(raw));return ex.concat(ps).slice(0,60)}
 const q=fold(raw),words=q.split(' ').filter(Boolean);
 const byTitle=out.filter(h=>words.every(w=>h.txt.includes(w)));
 if(!S.deep&&byTitle.length)return byTitle.slice(0,120);
 const ids=new Set(byTitle.map(h=>h.n));
 const byBody=out.filter(h=>!ids.has(h.n)&&words.every(w=>h.body.includes(w)));
 return byTitle.concat(byBody).slice(0,120);
}

/* ---------- interface ---------- */
function favKey(h){return S.ed+'|'+h.n}
function pad(n){return String(n).padStart(3,'0')}
function listHTML(){
 const st=S.status[S.ed]||'';
 if(st==='loading'||!S.data[S.ed]&&!st.startsWith('erro'))return '<p class="hn-empty"><i class="hn-spin"></i>Carregando o hinário…</p>';
 if(st.startsWith('erro'))return '<p class="hn-empty">Não foi possível carregar esta edição agora.<br><small>'+esc(st.slice(5))+'</small><br><button class="hn-btn" onclick="IASDHinario.retry()">Tentar de novo</button></p>';
 const rows=search(S.data[S.ed]);
 if(!rows.length)return '<p class="hn-empty">Nenhum hino encontrado'+(S.q?' para “'+esc(S.q)+'”':'')+'.'+(S.q&&!S.deep?'<br><button class="hn-btn" onclick="IASDHinario.deep(1)">Buscar também dentro das letras</button>':'')+'</p>';
 return rows.map(h=>'<button class="hn-row '+(S.sel===h.n?'on':'')+'" onclick="IASDHinario.open('+h.n+')"><b>'+pad(h.n)+'</b><span><strong>'+esc(h.t)+'</strong>'+(h.cat?'<small>'+esc(h.cat)+'</small>':'')+'</span>'+(S.fav.includes(favKey(h))?'<i class="hn-star">★</i>':'')+'</button>').join('');
}
function detailHTML(){
 const h=(S.data[S.ed]||[]).find(x=>x.n===S.sel);
 if(!h)return '<div class="hn-placeholder"><b>♪</b><p>Escolha um hino na lista ou digite o número.</p></div>';
 const fav=S.fav.includes(favKey(h));
 const proj=typeof canUseSound==='function'&&canUseSound()&&typeof project==='function';
 const coro=(h.coro||[]).map(c=>'<div class="hn-coro"><em>Coro</em><p>'+esc(c).replace(/\n/g,'<br>')+'</p>'+(proj?'<button class="hn-mini" onclick="IASDHinario.proj(\'c\')">Projetar coro</button>':'')+'</div>').join('');
 const est=h.estrofes.map((e,i)=>'<div class="hn-est"><em>'+esc(e.n)+'</em><p>'+esc(e.txt).replace(/\n/g,'<br>')+'</p>'+(proj?'<button class="hn-mini" onclick="IASDHinario.proj('+i+')">Projetar</button>':'')+'</div>'+(i===0?coro:'')).join('');
 return '<article class="hn-det" style="--hf:'+S.font+'"><div class="hn-dh"><span class="hn-num">'+pad(h.n)+'</span><div><h2>'+esc(h.t)+'</h2>'+(h.en?'<small>'+esc(h.en)+'</small>':'')+'</div></div>'+
 '<div class="hn-meta">'+(h.cat?'<span>'+esc(h.cat)+(h.sub&&h.sub!==h.cat?' · '+esc(h.sub):'')+'</span>':'')+(h.ref?'<span>📖 '+esc(h.ref)+'</span>':'')+(h.autores.length?'<span>✍ '+esc(h.autores.join(' · '))+'</span>':'')+'</div>'+
 '<div class="hn-tools"><button class="hn-btn" onclick="IASDHinario.fav()">'+(fav?'★ Favorito':'☆ Favoritar')+'</button><button class="hn-btn" onclick="IASDHinario.copy(this)">Copiar letra</button><button class="hn-btn" onclick="IASDHinario.size(-1)">A−</button><button class="hn-btn" onclick="IASDHinario.size(1)">A+</button><button class="hn-btn" onclick="IASDHinario.move(-1)">← Anterior</button><button class="hn-btn" onclick="IASDHinario.move(1)">Próximo →</button>'+(proj?'<button class="hn-btn gold" onclick="IASDHinario.proj(\'all\')">Projetar letra completa</button>':'')+'</div>'+
 '<div class="hn-lyrics">'+est+(h.coro.length&&h.estrofes.length===0?coro:'')+'</div></article>';
}
function page(){
 setTimeout(mount,0);
 const m=(S.manifest||FALLBACK).edicoes;
 return '<div class="pg pg-hinario hn"><div class="hn-head"><div><span class="hn-kick">HINÁRIO ADVENTISTA</span><h1>Letras dos hinos</h1><p>Pesquise pelo número, pelo nome ou por um trecho da letra.</p></div><div class="hn-eds" id="hn-eds">'+m.map(e=>'<button class="'+(e.id===S.ed?'on':'')+'" onclick="IASDHinario.edition(\''+esc(e.id)+'\')"><b>'+esc(e.nome)+'</b><small>'+esc(e.sub||'')+'</small></button>').join('')+'</div></div>'+
 '<div class="hn-bar"><label class="hn-search"><span>⌕</span><input id="hn-q" type="search" inputmode="search" autocomplete="off" placeholder="Número (ex.: 123) ou nome do hino" value="'+esc(S.q)+'" oninput="IASDHinario.q(this.value)"></label><label class="hn-chk"><input type="checkbox" '+(S.deep?'checked':'')+' onchange="IASDHinario.deep(this.checked)"> Buscar dentro das letras</label><label class="hn-chk"><input type="checkbox" '+(S.favOnly?'checked':'')+' onchange="IASDHinario.favOnly(this.checked)"> Só favoritos</label></div>'+
 '<div class="hn-main"><aside class="hn-list" id="hn-list">'+listHTML()+'</aside><section class="hn-view" id="hn-view">'+detailHTML()+'</section></div>'+
 '<p class="hn-note">As letras vêm de fontes abertas da internet e ficam guardadas neste aparelho. Os direitos dos textos pertencem aos seus titulares.</p></div>';
}
function paint(){const l=document.getElementById('hn-list'),v=document.getElementById('hn-view');if(l)l.innerHTML=listHTML();if(v)v.innerHTML=detailHTML();const e=document.getElementById('hn-eds');if(e&&S.manifest)e.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',S.manifest.edicoes[i].id===S.ed))}
async function mount(){await getManifest();if(document.getElementById('hn-eds')&&document.getElementById('hn-eds').children.length!==S.manifest.edicoes.length){try{render()}catch(e){}}
 if(!S.manifest.edicoes.some(e=>e.id===S.ed))S.ed=S.manifest.edicoes[0].id;
 await load(S.ed);paint();
 const p=new URLSearchParams(location.search);const n=+p.get('n');if(n&&S.sel==null){S.sel=n;paint()}}
function cur(){return (S.data[S.ed]||[]).find(x=>x.n===S.sel)}
function text(h,mode){const parts=[];h.estrofes.forEach((e,i)=>{parts.push(e.txt);if(i===0&&h.coro.length&&mode==='all')h.coro.forEach(c=>parts.push(c))});return parts}
const API={
 page,
 edition(id){S.ed=id;S.sel=null;try{localStorage.setItem('iasd-hin-ed',id)}catch(e){}paint();load(id).then(paint)},
 q(v){S.q=v;const l=document.getElementById('hn-list');if(l)l.innerHTML=listHTML()},
 deep(v){S.deep=!!v;const l=document.getElementById('hn-list');if(l)l.innerHTML=listHTML();const c=document.querySelector('.hn-chk input');if(c)c.checked=S.deep},
 favOnly(v){S.favOnly=!!v;const l=document.getElementById('hn-list');if(l)l.innerHTML=listHTML()},
 open(n){S.sel=n;paint();if(window.innerWidth<900)document.getElementById('hn-view')?.scrollIntoView({behavior:'smooth',block:'start'})},
 fav(){const h=cur();if(!h)return;const k=favKey(h),i=S.fav.indexOf(k);if(i>=0)S.fav.splice(i,1);else S.fav.push(k);try{localStorage.setItem('iasd-hin-fav',JSON.stringify(S.fav))}catch(e){}paint()},
 size(d){S.font=Math.max(-2,Math.min(5,S.font+d));try{localStorage.setItem('iasd-hin-font',S.font)}catch(e){}paint()},
 move(d){const list=S.data[S.ed]||[],i=list.findIndex(x=>x.n===S.sel);if(i<0)return;const j=Math.max(0,Math.min(list.length-1,i+d));S.sel=list[j].n;paint();document.getElementById('hn-view')?.scrollIntoView({block:'nearest'})},
 copy(btn){const h=cur();if(!h)return;const t=pad(h.n)+' — '+h.t+'\n\n'+h.estrofes.map((e,i)=>e.txt+(i===0&&h.coro.length?'\n\n'+h.coro.join('\n\n'):'')).join('\n\n');navigator.clipboard?.writeText(t).then(()=>{const o=btn.textContent;btn.textContent='Copiado ✓';setTimeout(()=>btn.textContent=o,1400)})},
 proj(which){const h=cur();if(!h||typeof project!=='function')return;let t;if(which==='all')t=pad(h.n)+' — '+h.t+'\n\n'+text(h,'all').join('\n\n');else if(which==='c')t=h.coro.join('\n\n');else t=h.estrofes[which]?.txt||'';project(t)},
 retry(){delete S.data[S.ed];load(S.ed,true).then(paint)},
 state:S,adapters:ADAPT,search:q=>{S.q=q;return search(S.data[S.ed]||[])}
};
window.IASDHinario=API;
})();
