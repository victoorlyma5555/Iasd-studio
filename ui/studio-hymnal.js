/* Hinário no Studio: letras do hinário antigo e novo sempre à mão — digite o número (ou parte do nome) e projete com um toque. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const ED={antigo:{nome:'Hinário Adventista',sub:'Antigo · 1996',url:'/data/hinario-hasd.json'},novo:{nome:'Novo Hinário',sub:'Novo · 2022',url:'/data/hinario-nha.json'}};
const roman=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const S={ed:'antigo',data:{},status:{},q:'',sel:null,idx:-1,recent:[]};
try{S.ed=localStorage.getItem('iasd-sth-ed')||'antigo';S.recent=JSON.parse(localStorage.getItem('iasd-sth-recent')||'[]')}catch(e){}
function clean(s){return String(s||'').replace(/\s+([,.;:!?])/g,'$1').replace(/^\s*\d+\.\s*/,'').trim()}
function norm(raw){return (Array.isArray(raw)?raw:[]).map(x=>{let v=(x.v||[]).map(clean).filter(Boolean);if(v.length>1&&fold(v[0])===fold(x.t))v.shift();return{n:Number(x.n),t:String(x.t||'').trim(),est:v,key:fold(x.t),body:fold(v.join(' '))}}).filter(h=>h.n)}
async function load(id){
 if(S.data[id])return;S.status[id]='loading';paint();
 try{const r=await fetch(ED[id].url);if(!r.ok)throw 0;S.data[id]=norm(await r.json());S.status[id]='ok'}catch(e){S.status[id]='err'}
 paint();
}
function list(){return S.data[S.ed]||[]}
function find(){
 const q=S.q.trim(),L=list();if(!q)return[];
 if(/^\d+$/.test(q)){const n=+q;const ex=L.filter(h=>h.n===n);const pre=L.filter(h=>h.n!==n&&String(h.n).startsWith(q)).slice(0,7);return ex.concat(pre)}
 const f=fold(q);return L.filter(h=>h.key.includes(f)).concat(L.filter(h=>!h.key.includes(f)&&h.body.includes(f))).slice(0,12);
}
function pick(n){const h=list().find(x=>x.n===n);if(!h)return;S.sel=h;S.idx=-1;
 S.recent=[{ed:S.ed,n:h.n,t:h.t}].concat(S.recent.filter(r=>!(r.ed===S.ed&&r.n===h.n))).slice(0,8);
 try{localStorage.setItem('iasd-sth-recent',JSON.stringify(S.recent))}catch(e){}
 const hn=$('hymnNumber'),nm=$('hymnName');if(hn)hn.value=h.n;if(nm)nm.value=h.t;paint()}
function send(text,ref){
 if(typeof window.project!=='function')return;
 window.project('IASD_BIBLE:'+JSON.stringify({ref,text}));
 if(typeof window.feedback==='function')window.feedback('Enviado ao telão: '+ref)}
const refOf=(h,tag)=>'Hino '+h.n+' · '+h.t+(tag?' · '+tag:'');
const api={
 ed(id){S.ed=id;S.sel=null;S.idx=-1;try{localStorage.setItem('iasd-sth-ed',id)}catch(e){}load(id).then(paint);paint()},
 input(v){S.q=v;S.sel=null;paint(true)},
 pick,
 recent(ed,n){if(S.ed!==ed){S.ed=ed;try{localStorage.setItem('iasd-sth-ed',ed)}catch(e){}}load(ed).then(()=>pick(n))},
 all(){const h=S.sel;if(!h)return;S.idx=-2;send(h.est.map((e,i)=>(i+1)+'. '+e).join('\n\n'),refOf(h));paint()},
 verse(i){const h=S.sel;if(!h||!h.est[i])return;S.idx=i;send(h.est[i],refOf(h,'Estrofe '+(i+1)));paint()},
 step(d){const h=S.sel;if(!h)return;const i=S.idx<0?(d>0?0:h.est.length-1):Math.max(0,Math.min(h.est.length-1,S.idx+d));api.verse(i)},
 title(){const h=S.sel;if(!h)return;S.idx=-3;send('♬ '+h.t,'Hino '+h.n);paint()}
};
function paint(keepFocus){
 const box=$('sth');if(!box)return;
 const st=S.status[S.ed],h=S.sel,res=h?[]:find();
 let html='<div class="sth-top"><div class="sth-ed">'+Object.keys(ED).map(k=>'<button class="'+(S.ed===k?'on':'')+'" onclick="STHymn.ed(\''+k+'\')"><b>'+ED[k].nome+'</b><small>'+ED[k].sub+'</small></button>').join('')+'</div>'
  +'<div class="sth-search"><input id="sthq" inputmode="search" autocomplete="off" placeholder="Número ou nome do hino…" value="'+esc(S.q)+'" oninput="STHymn.input(this.value)"></div></div>';
 if(st==='loading')html+='<p class="muted">Carregando hinos…</p>';
 else if(st==='err')html+='<p class="muted">Não foi possível carregar o hinário. Verifique a conexão.</p>';
 if(!h){
  if(res.length)html+='<div class="sth-res">'+res.map(x=>'<button onclick="STHymn.pick('+x.n+')"><b>'+x.n+'</b><span>'+esc(x.t)+'</span></button>').join('')+'</div>';
  else if(S.q&&st==='ok')html+='<p class="muted">Nenhum hino encontrado nesta edição.</p>';
  else if(S.recent.length)html+='<div class="sth-rec"><small>Recentes</small>'+S.recent.map(r=>'<button onclick="STHymn.recent(\''+r.ed+'\','+r.n+')"><b>'+r.n+'</b> '+esc(r.t)+'<i>'+(r.ed==='novo'?'novo':'antigo')+'</i></button>').join('')+'</div>';
  else html+='<p class="muted">Digite o número do hino para abrir a letra. Ex.: 1, 25, 188.</p>';
 }else{
  html+='<div class="sth-card"><div class="sth-hd"><span class="sth-n">'+h.n+'</span><div><h3>'+esc(h.t)+'</h3><small>'+ED[S.ed].nome+' · '+h.est.length+' estrofes</small></div><button class="sth-x" onclick="STHymn.input(\'\')" title="Trocar de hino">✕</button></div>'
   +'<div class="sth-acts"><button class="primary" onclick="STHymn.all()">▣ Projetar letra completa</button><button onclick="STHymn.title()">Só o número e título</button></div>'
   +'<div class="sth-vs">'+h.est.map((e,i)=>'<button class="'+(S.idx===i?'on':'')+'" onclick="STHymn.verse('+i+')"><b>'+(i+1)+'</b><span>'+esc(e.split('\n').slice(0,2).join(' / '))+'</span></button>').join('')+'</div>'
   +'<div class="sth-nav"><button onclick="STHymn.step(-1)">◀ Anterior</button><button class="primary" onclick="STHymn.step(1)">Próxima estrofe ▶</button></div></div>';
 }
 box.innerHTML=html;
 if(keepFocus){const i=$('sthq');if(i){i.focus();const l=i.value.length;i.setSelectionRange(l,l)}}
}
window.STHymn=api;
function mount(){
 const sec=$('hymnal');if(!sec||$('sth'))return;
 const old=Array.from(sec.children).slice(1);
 const det=document.createElement('details');det.className='sth-manual';
 det.innerHTML='<summary>Áudio e letra manual (arquivos próprios da igreja)</summary>';
 old.forEach(n=>det.appendChild(n));
 const p=sec.querySelector('.mp-tt p');if(p)p.textContent='Digite o número do hino e projete a letra no telão com um toque. Hinário antigo e novo incluídos.';
 const box=document.createElement('div');box.id='sth';sec.appendChild(box);sec.appendChild(det);
 const style=document.createElement('style');style.textContent=
 '#sth{margin-top:10px}.sth-top{display:flex;gap:10px;flex-wrap:wrap;align-items:stretch}.sth-ed{display:flex;gap:6px}.sth-ed button{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:8px 14px}.sth-ed button small{opacity:.7;font-size:11px}.sth-ed button.on{background:var(--primary,#2563eb);color:#fff;border-color:transparent}.sth-search{flex:1;min-width:200px}.sth-search input{width:100%;height:100%;font-size:18px;padding:10px 14px}'
 +'.sth-res,.sth-rec{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px;margin-top:10px}.sth-rec small{grid-column:1/-1;opacity:.7}.sth-res button,.sth-rec button{display:flex;gap:10px;align-items:center;text-align:left;padding:8px 12px}.sth-res b{min-width:34px;font-size:18px}.sth-rec i{margin-left:auto;font-size:11px;opacity:.6;font-style:normal}'
 +'.sth-card{margin-top:10px;display:flex;flex-direction:column;gap:10px}.sth-hd{display:flex;gap:12px;align-items:center}.sth-hd h3{margin:0}.sth-hd small{opacity:.7}.sth-n{font-size:30px;font-weight:800;min-width:64px;text-align:center;padding:6px 10px;border-radius:12px;background:rgba(37,99,235,.18)}.sth-x{margin-left:auto}'
 +'.sth-acts,.sth-nav{display:flex;gap:8px;flex-wrap:wrap}.sth-acts button,.sth-nav button{flex:1;min-width:150px;padding:10px}.sth-vs{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:6px;max-height:210px;overflow:auto}.sth-vs button{display:flex;gap:10px;align-items:center;text-align:left;padding:8px 10px;font-size:13px}.sth-vs b{min-width:22px}.sth-vs button.on{outline:2px solid #22c55e}'
 +'.sth-manual{margin-top:14px}.sth-manual summary{cursor:pointer;opacity:.8;padding:6px 0}';
 document.head.appendChild(style);
 load(S.ed).then(paint);paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
