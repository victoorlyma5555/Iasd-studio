/* Bíblia+: anotações por versículo, busca de palavra em toda a Bíblia e sincronização (marca-texto + notas) com a conta. */
(function(){
'use strict';
const NOTE_KEY='iasd-notes-v1',HL_KEY='iasd-hl-v1',META_KEY='iasd-bibledata-t';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const J=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
const W=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const books=()=>{try{return bibleBooks}catch(e){return[]}};
const bname=en=>(books().find(b=>b[1]===en)||[en])[0];
const toast=m=>{try{window.IASDPages&&IASDPages.toast?IASDPages.toast(m):0}catch(e){}let t=document.getElementById('bb-toast');if(!t){t=document.createElement('div');t.id='bb-toast';t.className='bb-toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)};
const cloud=()=>window.iasdCloud||null;
const user=()=>{try{return typeof window.iasdCurrentUser==='function'?window.iasdCurrentUser():null}catch(e){return null}};
const nk=(b,c,v)=>b+'|'+c+'|'+v;

/* ---------- notas ---------- */
const notes=()=>J(NOTE_KEY,{});
const N={
 has(b,c,v){return !!notes()[nk(b,c,v)]},
 html(b,c,v){const n=notes()[nk(b,c,v)];return n?'<span class="vnote" data-nb="'+esc(b)+'" data-nc="'+c+'" data-nv="'+v+'">📝 '+esc(n.x)+'</span>':''},
 open(ref){
  let p;try{p=ref||IASDPages.rdPassage()}catch(e){return}
  if(!p||!p.chapter||!p.from){toast('Toque em um versículo para anotar.');return}
  const key=nk(p.book,p.chapter,p.from),cur=notes()[key];
  const label=p.name+' '+p.chapter+':'+p.from+(p.to&&p.to!==p.from?'-'+p.to:'');
  sheet('Anotação · '+label,'<p class="bp-q">“'+esc((p.text||'').slice(0,220))+((p.text||'').length>220?'…':'')+'”</p><textarea id="bp-note" maxlength="1500" rows="6" placeholder="Escreva o que Deus falou ao seu coração…">'+esc(cur?cur.x:'')+'</textarea><div class="bp-acts"><button class="bp-pri" id="bp-save">Salvar anotação</button>'+(cur?'<button id="bp-del">Excluir</button>':'')+'<button id="bp-cancel">Cancelar</button></div><small class="bp-hint">'+(user()?'Salva neste aparelho e na sua conta.':'Salva neste aparelho. Entre na sua conta para guardar também na nuvem.')+'</small>');
  const ta=document.getElementById('bp-note');setTimeout(()=>ta&&ta.focus(),50);
  document.getElementById('bp-cancel').onclick=close;
  document.getElementById('bp-save').onclick=()=>{const x=ta.value.trim(),all=notes();if(x)all[key]={x,t:Date.now(),to:p.to||0};else delete all[key];W(NOTE_KEY,all);changed();close();repaint();toast(x?'Anotação salva ✓':'Anotação removida')};
  const d=document.getElementById('bp-del');if(d)d.onclick=()=>{const all=notes();delete all[key];W(NOTE_KEY,all);changed();close();repaint();toast('Anotação excluída')};
 },
 list(){
  const all=notes(),keys=Object.keys(all).sort((a,b)=>all[b].t-all[a].t);
  sheet('Minhas anotações',keys.length?'<input id="bp-nq" type="search" placeholder="Buscar nas anotações…" class="bp-in"><div id="bp-nl" class="bp-list"></div>':'<p class="bp-empty">Você ainda não fez anotações. Toque em um versículo e use o botão 📝.</p>');
  if(!keys.length)return;
  const paint=()=>{const q=fold(document.getElementById('bp-nq').value);document.getElementById('bp-nl').innerHTML=keys.filter(k=>!q||fold(all[k].x+' '+bname(k.split('|')[0])).includes(q)).map(k=>{const [b,c,v]=k.split('|');return '<button class="bp-r" data-k="'+esc(k)+'"><b>'+esc(bname(b))+' '+c+':'+v+'</b><span>'+esc(all[k].x)+'</span><i>'+new Date(all[k].t).toLocaleDateString('pt-BR')+'</i></button>'}).join('')||'<p class="bp-empty">Nada encontrado.</p>'};
  paint();document.getElementById('bp-nq').oninput=paint;
  document.getElementById('bp-nl').onclick=e=>{const b=e.target.closest('.bp-r');if(!b)return;const [bk,c,v]=b.dataset.k.split('|');close();try{readerGoto(bk,+c,+v)}catch(x){}};
 },
 search(){
  const tr=['acf','aa','nvi'].includes(readerState.translation)?readerState.translation:'nvi';
  sheet('Buscar na Bíblia','<form id="bp-sf" class="bp-sf"><input id="bp-sq" class="bp-in" type="search" autocomplete="off" placeholder="Palavra ou frase. Ex.: esperança, amor de Deus"><button class="bp-pri">Buscar</button></form><div class="bp-trs"><span>Tradução:</span>'+[['nvi','NVI'],['acf','ACF'],['aa','AA']].map(([k,l])=>'<label><input type="radio" name="bp-tr" value="'+k+'"'+(tr===k?' checked':'')+'>'+l+'</label>').join('')+'</div><div id="bp-sr" class="bp-list"><p class="bp-empty">Digite uma palavra para procurar em todos os 66 livros.</p></div>');
  const q=document.getElementById('bp-sq');setTimeout(()=>q.focus(),50);
  document.getElementById('bp-sf').onsubmit=e=>{e.preventDefault();run(q.value,document.querySelector('input[name=bp-tr]:checked').value)};
  document.getElementById('bp-sr').onclick=e=>{const b=e.target.closest('.bp-r');if(!b)return;const [bk,c,v]=b.dataset.k.split('|');close();try{readerGoto(bk,+c,+v)}catch(x){}};
 }
};
const SRC={acf:'https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/acf.json',aa:'https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/aa.json',nvi:'https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/nvi.json'};
const cache={};
async function bibleData(tr){if(!cache[tr])cache[tr]=fetch(SRC[tr]).then(r=>{if(!r.ok)throw 0;return r.json()}).catch(e=>{delete cache[tr];throw e});return cache[tr]}
async function run(raw,tr){
 const out=document.getElementById('bp-sr'),q=String(raw||'').trim();
 if(q.length<3){out.innerHTML='<p class="bp-empty">Digite pelo menos 3 letras.</p>';return}
 out.innerHTML='<p class="bp-empty">Procurando…</p>';
 let data;try{data=await bibleData(tr)}catch(e){out.innerHTML='<p class="bp-empty">Não foi possível carregar a Bíblia agora. Verifique a conexão.</p>';return}
 const words=fold(q).split(/\s+/).filter(Boolean),phrase=fold(q),res=[];let total=0;
 const bk=books();
 for(let i=0;i<data.length&&i<bk.length;i++){const ch=data[i].chapters||[];for(let c=0;c<ch.length;c++)for(let v=0;v<ch[c].length;v++){const t=ch[c][v];if(!t)continue;const f=fold(t);if(words.every(w=>f.includes(w))){total++;if(res.length<80)res.push({b:bk[i][1],n:bk[i][0],c:c+1,v:v+1,t,exact:f.includes(phrase)})}}}
 res.sort((a,b)=>b.exact-a.exact);
 const mark=t=>{let h=esc(t);words.forEach(w=>{const re=new RegExp('('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');h=h.replace(re,'<mark>$1</mark>')});return h};
 out.innerHTML=total?'<p class="bp-cnt">'+total+' versículo'+(total===1?'':'s')+' encontrado'+(total===1?'':'s')+(total>80?' · mostrando os 80 mais relevantes':'')+'</p>'+res.map(r=>'<button class="bp-r" data-k="'+esc(r.b+'|'+r.c+'|'+r.v)+'"><b>'+esc(r.n)+' '+r.c+':'+r.v+'</b><span>'+mark(r.t)+'</span></button>').join(''):'<p class="bp-empty">Nenhum versículo encontrado para “'+esc(q)+'”.</p>';
}

/* ---------- janela ---------- */
let el=null;
function close(){el?.remove();el=null;document.body.classList.remove('vs-lock')}
function sheet(title,html){
 close();el=document.createElement('div');el.className='bp-ov';
 el.innerHTML='<div class="bp-sh" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="bp-hd"><h3>'+esc(title)+'</h3><button class="bp-x" aria-label="Fechar">✕</button></div><div class="bp-bd">'+html+'</div></div>';
 el.addEventListener('click',e=>{if(e.target===el||e.target.closest('.bp-x'))close()});
 document.body.appendChild(el);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&el)close()});
function repaint(){try{IASDPages.rdPaint()}catch(e){}}
document.addEventListener('click',e=>{const n=e.target.closest?.('.vnote');if(!n)return;e.stopPropagation();N.open({book:n.dataset.nb,chapter:+n.dataset.nc,from:+n.dataset.nv,to:0,name:bname(n.dataset.nb),text:n.closest('.reader-verse')?.textContent.replace(/^\d+/,'').replace(/📝.*$/s,'')||''})},true);

/* ---------- nuvem ---------- */
let pushT=null,busy=false;
function changed(){W(META_KEY,Date.now());clearTimeout(pushT);pushT=setTimeout(push,1800)}
async function push(){
 const c=cloud(),u=user();if(!c||!u||busy)return;busy=true;
 try{const r=await c.from('iasd_bible_data').upsert({user_id:u.id,highlights:J(HL_KEY,{}),notes:notes(),updated_at:new Date().toISOString()},{onConflict:'user_id'});if(r.error)throw r.error}catch(e){console.warn('Bíblia na nuvem indisponível (rode docs/supabase-biblia-nuvem.sql):',e.message||e)}
 busy=false;
}
let pulled='';
async function pull(){
 const c=cloud(),u=user();if(!c||!u||pulled===u.id)return;pulled=u.id;
 try{
  const r=await c.from('iasd_bible_data').select('highlights,notes').eq('user_id',u.id).maybeSingle();if(r.error)throw r.error;
  const d=r.data;if(!d){if(Object.keys(notes()).length||Object.keys(J(HL_KEY,{})).length)push();return}
  /* mescla: nuvem + aparelho; na mesma nota vale a mais recente */
  const ln=notes(),cn=d.notes||{},mn={...cn};Object.keys(ln).forEach(k=>{if(!mn[k]||(ln[k].t||0)>(mn[k].t||0))mn[k]=ln[k]});
  const lh=J(HL_KEY,{}),ch=d.highlights||{},mh={...ch};Object.keys(lh).forEach(k=>{mh[k]={...(ch[k]||{}),...lh[k]}});
  W(NOTE_KEY,mn);W(HL_KEY,mh);
  if(JSON.stringify(mn)!==JSON.stringify(cn)||JSON.stringify(mh)!==JSON.stringify(ch))push();
  repaint();
 }catch(e){console.warn('Bíblia na nuvem indisponível:',e.message||e)}
}
function boot(){
 const t=setInterval(()=>{if(window.IASDPages&&window.iasdCloud){clearInterval(t);
  const orig=IASDPages.hlApply;if(orig)IASDPages.hlApply=function(){const r=orig.apply(this,arguments);changed();return r};
  window.iasdCloud.auth.onAuthStateChange((ev,ss)=>{if(ss?.user){pulled='';setTimeout(pull,400)}else pulled=''});
  setTimeout(pull,1200);
 }},300);setTimeout(()=>clearInterval(t),20000);
}
boot();
window.IASDBibleNotes=N;
const st=document.createElement('style');st.textContent=
'.bp-ov{position:fixed;inset:0;z-index:90;background:rgba(2,8,23,.66);display:flex;align-items:flex-end;justify-content:center;padding:0}@media(min-width:700px){.bp-ov{align-items:center;padding:20px}}'
+'.bp-sh{width:min(560px,100%);max-height:88vh;display:flex;flex-direction:column;border-radius:20px 20px 0 0;background:var(--iu-sf,#0b1730);color:var(--iu-tx,#fff);border:1px solid rgba(245,183,58,.5);box-shadow:0 20px 60px rgba(0,0,0,.6)}@media(min-width:700px){.bp-sh{border-radius:20px}}'
+'.bp-hd{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.1)}.bp-hd h3{margin:0;font-size:16px;flex:1}.bp-x{width:36px;height:36px;border-radius:10px;border:0;background:rgba(255,255,255,.1);color:inherit;font-size:16px;cursor:pointer}'
+'.bp-bd{padding:14px 16px 18px;overflow:auto;display:grid;gap:10px}.bp-q{margin:0;padding:10px 12px;border-left:3px solid #f5b73a;background:rgba(245,183,58,.08);border-radius:8px;font-style:italic;font-size:14px;opacity:.9}'
+'#bp-note,.bp-in{width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:inherit;font:inherit;font-size:16px}'
+'.bp-acts{display:flex;gap:8px;flex-wrap:wrap}.bp-acts button,.bp-pri{padding:11px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:inherit;font-weight:700;cursor:pointer}.bp-pri{background:#f5b73a;color:#241a00;border-color:transparent}.bp-hint{opacity:.65}'
+'.bp-sf{display:flex;gap:8px}.bp-sf .bp-in{flex:1}.bp-trs{display:flex;gap:14px;align-items:center;font-size:13px;opacity:.9}.bp-trs label{display:flex;gap:5px;align-items:center}'
+'.bp-list{display:grid;gap:8px}.bp-r{display:grid;gap:4px;text-align:left;padding:11px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:inherit;cursor:pointer;font:inherit}.bp-r b{color:#f5b73a;font-size:13px}.bp-r span{font-size:14px;line-height:1.45}.bp-r i{font-size:11px;opacity:.55;font-style:normal}.bp-r mark{background:rgba(245,183,58,.35);color:inherit;border-radius:3px;padding:0 2px}'
+'.bp-empty,.bp-cnt{margin:0;opacity:.7;font-size:14px}.vnote{display:block;margin:4px 0 2px 24px;padding:6px 10px;border-radius:8px;background:rgba(245,183,58,.14);border-left:3px solid #f5b73a;font-size:.82em;line-height:1.4;cursor:pointer;font-style:normal}';
document.head.appendChild(st);
})();
