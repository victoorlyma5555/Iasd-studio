/* IASD APP — textos sobre o banner (carrossel) com editor: fontes, cores, estilos, modelos e arrastar para posicionar.
   Salvo em iasd_site_content (chave home_banner_layers) como JSON. Sempre desenhado POR CIMA das imagens. */
(function(){
'use strict';
const KEY='home_banner_layers';
const FONTS=[['Bricolage Grotesque','Moderna'],['Instrument Sans','Limpa'],['Fraunces','Elegante'],['Playfair Display','Clássica'],['Anton','Impacto'],['Oswald','Condensada'],['Pacifico','Manuscrita'],['JetBrains Mono','Técnica']];
const SWATCH=['#ffffff','#fff1d6','#ffc15e','#ff8a4c','#ff6a88','#35f0b9','#7dd3fc','#111111'];
const BGS=[['','Sem fundo'],['dark','Escuro'],['light','Claro'],['accent','Destaque']];
const SHADOWS=[['0','Sem sombra'],['1','Suave'],['2','Forte']];
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const g=fn=>{try{return fn()}catch(e){return undefined}};
const uid=()=>'l'+Math.random().toString(36).slice(2,8);

function base(o){return Object.assign({id:uid(),t:'Novo texto',x:50,y:50,s:6,c:'#ffffff',f:'Bricolage Grotesque',w:700,i:0,u:0,a:'center',sh:1,bg:'',ls:0},o||{})}
function read(){
  try{const v=JSON.parse(g(()=>siteTextOverrides[KEY])||'[]');return Array.isArray(v)?v.map(base):[]}catch(e){return []}
}
function css(l){
  const shadow=l.sh==2?'0 3px 14px rgba(0,0,0,.85),0 1px 3px rgba(0,0,0,.9)':l.sh==1?'0 2px 10px rgba(0,0,0,.55)':'none';
  const bg=l.bg==='dark'?'background:rgba(8,6,16,.62);':l.bg==='light'?'background:rgba(255,255,255,.88);':l.bg==='accent'?'background:linear-gradient(135deg,var(--au-a1,#ffc15e),var(--au-a2,#ff8a4c));':'';
  const pad=l.bg?'padding:.35em .8em;border-radius:.6em;':'';
  const color=(l.bg==='light'||l.bg==='accent')&&(l.c==='#ffffff'||l.c==='#fff')?'#1a0f05':l.c;
  return `left:${l.x}%;top:${l.y}%;font-size:calc(${Number(l.s)} * 1cqw);color:${E(color)};font-family:'${E(l.f)}',sans-serif;font-weight:${l.w};font-style:${l.i?'italic':'normal'};text-transform:${l.u?'uppercase':'none'};text-align:${E(l.a)};letter-spacing:${Number(l.ls)}em;text-shadow:${shadow};${bg}${pad}`;
}
function layerEl(l,extra){return `<div class="bn-l${extra||''}" data-id="${E(l.id)}" style="${css(l)}">${E(l.t).replace(/\n/g,'<br>')}</div>`}

/* usado pela Home */
window.bannerLayersHTML=function(){const ls=read();return ls.length?`<div class="bn-layers" aria-hidden="false">${ls.map(l=>layerEl(l)).join('')}</div>`:''};

/* ---------- modelos prontos ---------- */
const TEMPLATES=[
 ['Evento especial',()=>[
  base({t:'EVENTO ESPECIAL',x:50,y:20,s:2.8,c:'#ffc15e',f:'JetBrains Mono',w:700,ls:.25,sh:1}),
  base({t:'Nome do evento',x:50,y:42,s:9,f:'Anton',w:400,u:1,sh:2}),
  base({t:'Sábado · 19h30',x:50,y:63,s:3.6,f:'Instrument Sans',w:600,sh:1}),
  base({t:'Participe!',x:50,y:82,s:3.2,f:'Instrument Sans',w:700,bg:'accent',sh:0})]],
 ['Aviso importante',()=>[
  base({t:'AVISO IMPORTANTE',x:50,y:28,s:5.2,c:'#ffc15e',f:'Oswald',w:700,ls:.08,sh:2}),
  base({t:'Escreva aqui o recado\npara a igreja.',x:50,y:58,s:4.2,f:'Instrument Sans',w:600,sh:2})]],
 ['Convite',()=>[
  base({t:'Você é nosso convidado',x:50,y:34,s:6.4,f:'Pacifico',w:400,c:'#fff1d6',sh:2}),
  base({t:'Sábado, às 9h',x:50,y:58,s:4,f:'Instrument Sans',w:700,sh:1}),
  base({t:'IASD · Caldas do Jorro',x:50,y:74,s:2.8,f:'JetBrains Mono',w:500,c:'#ffc15e',ls:.12,u:1,sh:1})]],
 ['Título grande',()=>[
  base({t:'TÍTULO\nEM DESTAQUE',x:50,y:50,s:10,f:'Anton',w:400,sh:2})]],
 ['Data em destaque',()=>[
  base({t:'05',x:22,y:42,s:17,f:'Anton',w:400,c:'#ffc15e',sh:2}),
  base({t:'OUTUBRO',x:22,y:66,s:3.4,f:'JetBrains Mono',w:700,ls:.25,sh:2}),
  base({t:'Nome do evento',x:64,y:46,s:6.4,f:'Bricolage Grotesque',w:800,a:'left',sh:2}),
  base({t:'Local · horário',x:64,y:64,s:3.2,f:'Instrument Sans',w:600,a:'left',sh:1})]],
 ['Versículo',()=>[
  base({t:'“Texto do versículo aqui.”',x:50,y:44,s:5.2,f:'Fraunces',w:500,i:1,c:'#fff6e8',sh:2}),
  base({t:'Livro 0:0',x:50,y:68,s:2.8,f:'JetBrains Mono',w:700,c:'#ffc15e',ls:.18,u:1,sh:1})]]
];

/* ---------- editor ---------- */
let S=null;
function bg(){return g(()=>{const it=homeBannerItems();return it.length?imageUrl(it[0].path):''})||''}
function root(){return document.getElementById('inline-editor-root')}
function cur(){return S.layers.find(l=>l.id===S.sel)||null}
function open(){
  if(!g(()=>canManageSite()))return;
  S={layers:read(),sel:null,img:bg()};
  S.sel=S.layers[0]?.id||null;
  paint();
}
function ctl(l){
  if(!l)return '<p class="bn-hint">Toque em um texto no banner para editar, ou adicione um novo.</p>';
  const opt=(arr,v)=>arr.map(([k,n])=>`<option value="${E(k)}"${String(v)===String(k)?' selected':''}>${E(n)}</option>`).join('');
  return `<label class="bn-f"><span>Texto</span><textarea id="bn-t" rows="2">${E(l.t)}</textarea></label>
<div class="bn-row"><label class="bn-f"><span>Fonte</span><select id="bn-f">${FONTS.map(([k,n])=>`<option value="${E(k)}"${l.f===k?' selected':''} style="font-family:'${E(k)}'">${E(n)}</option>`).join('')}</select></label>
<label class="bn-f"><span>Peso</span><select id="bn-w">${opt([[400,'Normal'],[600,'Médio'],[700,'Negrito'],[800,'Extra']],l.w)}</select></label></div>
<label class="bn-f"><span>Tamanho</span><input id="bn-s" type="range" min="2" max="20" step=".2" value="${l.s}"></label>
<div class="bn-f"><span>Cor</span><div class="bn-sw">${SWATCH.map(c=>`<button type="button" class="bn-c${l.c===c?' on':''}" data-c="${c}" style="background:${c}" aria-label="Cor ${c}"></button>`).join('')}<input id="bn-c" type="color" value="${/^#[0-9a-f]{6}$/i.test(l.c)?l.c:'#ffffff'}" aria-label="Outra cor"></div></div>
<div class="bn-row"><div class="bn-tg">
<button type="button" data-tg="i" class="${l.i?'on':''}"><i>I</i></button><button type="button" data-tg="u" class="${l.u?'on':''}">AA</button>
<button type="button" data-al="left" class="${l.a==='left'?'on':''}">⟸</button><button type="button" data-al="center" class="${l.a==='center'?'on':''}">≡</button><button type="button" data-al="right" class="${l.a==='right'?'on':''}">⟹</button></div></div>
<div class="bn-row"><label class="bn-f"><span>Sombra</span><select id="bn-sh">${opt(SHADOWS,l.sh)}</select></label><label class="bn-f"><span>Fundo do texto</span><select id="bn-bg">${opt(BGS,l.bg)}</select></label></div>
<label class="bn-f"><span>Espaço entre letras</span><input id="bn-ls" type="range" min="0" max=".4" step=".01" value="${l.ls}"></label>
<div class="bn-row"><button type="button" class="bn-b" id="bn-dup">Duplicar</button><button type="button" class="bn-b danger" id="bn-del">Excluir</button></div>`;
}
function paint(){
  const r=root();if(!r||!S)return;
  const prev=S.layers.map(l=>layerEl(l,l.id===S.sel?' sel':'')).join('');
  r.innerHTML=`<div class="iasd-edit-backdrop" id="bn-bd"></div><section class="iasd-edit-dialog bn-dlg" role="dialog" aria-modal="true" aria-label="Textos do banner">
<div class="iasd-edit-head"><strong>Aa Textos do banner</strong><button type="button" id="bn-x" aria-label="Fechar">✕</button></div>
<div class="bn-body">
 <div class="bn-left"><div class="bn-stage" id="bn-stage" style="${S.img?`background-image:url('${E(S.img)}')`:''}"><div class="bn-shade"></div>${prev}</div>
 <p class="bn-hint">Arraste os textos para posicionar. Eles ficam sempre por cima das imagens do carrossel.</p>
 <div class="bn-tpl"><b>Modelos prontos</b><div>${TEMPLATES.map((t,i)=>`<button type="button" class="bn-b" data-tpl="${i}">${E(t[0])}</button>`).join('')}</div></div></div>
 <div class="bn-right"><div class="bn-tabs">${S.layers.map((l,i)=>`<button type="button" class="bn-tab${l.id===S.sel?' on':''}" data-sel="${E(l.id)}">${i+1}. ${E(l.t.replace(/\n/g,' ').slice(0,14)||'texto')}</button>`).join('')}<button type="button" class="bn-tab add" id="bn-add">＋ Texto</button></div>
 <div id="bn-ctl">${ctl(cur())}</div></div>
</div>
<div class="iasd-edit-actions"><button type="button" class="primary" id="bn-save">Salvar textos</button><button type="button" id="bn-cancel">Cancelar</button></div></section>`;
  bind();
}
function refreshStage(){
  const st=document.getElementById('bn-stage');if(!st)return;
  st.querySelectorAll('.bn-l').forEach(n=>n.remove());
  st.insertAdjacentHTML('beforeend',S.layers.map(l=>layerEl(l,l.id===S.sel?' sel':'')).join(''));
}
function upd(k,v,repaintCtl){const l=cur();if(!l)return;l[k]=v;refreshStage();if(repaintCtl){document.getElementById('bn-ctl').innerHTML=ctl(cur());bindCtl()}}
function bindCtl(){
  const $=id=>document.getElementById(id);
  $('bn-t')&&($('bn-t').oninput=e=>{upd('t',e.target.value);const tab=document.querySelector('.bn-tab.on');if(tab)tab.textContent=(S.layers.indexOf(cur())+1)+'. '+(e.target.value.replace(/\n/g,' ').slice(0,14)||'texto')});
  $('bn-f')&&($('bn-f').onchange=e=>upd('f',e.target.value));
  $('bn-w')&&($('bn-w').onchange=e=>upd('w',+e.target.value));
  $('bn-s')&&($('bn-s').oninput=e=>upd('s',+e.target.value));
  $('bn-ls')&&($('bn-ls').oninput=e=>upd('ls',+e.target.value));
  $('bn-sh')&&($('bn-sh').onchange=e=>upd('sh',+e.target.value));
  $('bn-bg')&&($('bn-bg').onchange=e=>upd('bg',e.target.value));
  $('bn-c')&&($('bn-c').oninput=e=>{upd('c',e.target.value);document.querySelectorAll('.bn-c').forEach(b=>b.classList.remove('on'))});
  document.querySelectorAll('.bn-c').forEach(b=>b.onclick=()=>upd('c',b.dataset.c,true));
  document.querySelectorAll('[data-tg]').forEach(b=>b.onclick=()=>{const l=cur();upd(b.dataset.tg,l[b.dataset.tg]?0:1,true)});
  document.querySelectorAll('[data-al]').forEach(b=>b.onclick=()=>upd('a',b.dataset.al,true));
  $('bn-dup')&&($('bn-dup').onclick=()=>{const l=cur();if(!l)return;const n=base(Object.assign({},l,{id:uid(),x:Math.min(95,l.x+4),y:Math.min(95,l.y+6)}));S.layers.push(n);S.sel=n.id;paint()});
  $('bn-del')&&($('bn-del').onclick=()=>{const l=cur();if(!l)return;S.layers=S.layers.filter(x=>x.id!==l.id);S.sel=S.layers[0]?.id||null;paint()});
}
function bind(){
  const $=id=>document.getElementById(id);
  $('bn-x').onclick=$('bn-cancel').onclick=$('bn-bd').onclick=close;
  $('bn-save').onclick=save;
  $('bn-add').onclick=()=>{const n=base({y:50+Math.min(20,S.layers.length*8)-10});S.layers.push(n);S.sel=n.id;paint()};
  document.querySelectorAll('[data-sel]').forEach(b=>b.onclick=()=>{S.sel=b.dataset.sel;paint()});
  document.querySelectorAll('[data-tpl]').forEach(b=>b.onclick=async()=>{
    if(S.layers.length){const ok=await g(()=>IASDDialog.confirm('Trocar os textos atuais por este modelo? (você ainda pode cancelar sem salvar)'));if(ok===false)return}
    S.layers=TEMPLATES[+b.dataset.tpl][1]();S.sel=S.layers[0].id;paint();
  });
  bindCtl();
  /* arrastar e posicionar */
  const st=$('bn-stage');
  st.addEventListener('pointerdown',e=>{
    const el=e.target.closest('.bn-l');if(!el)return;
    e.preventDefault();
    const id=el.dataset.id,l=S.layers.find(x=>x.id===id);if(!l)return;
    const sel=S.sel!==id;S.sel=id;
    const rect=st.getBoundingClientRect();
    const sx=e.clientX,sy=e.clientY,ox=l.x,oy=l.y;let moved=false;
    el.setPointerCapture?.(e.pointerId);
    const mv=ev=>{
      const dx=(ev.clientX-sx)/rect.width*100,dy=(ev.clientY-sy)/rect.height*100;
      if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>3)moved=true;
      l.x=Math.round(Math.min(97,Math.max(3,ox+dx))*10)/10;l.y=Math.round(Math.min(97,Math.max(3,oy+dy))*10)/10;
      el.style.left=l.x+'%';el.style.top=l.y+'%';
    };
    const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);if(sel||!moved)paint();else refreshStage()};
    window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  });
}
function close(){const r=root();if(r)r.innerHTML='';S=null}
async function save(){
  if(!S)return;
  const btn=document.getElementById('bn-save');if(btn){btn.disabled=true;btn.textContent='Salvando…'}
  const value=JSON.stringify(S.layers.filter(l=>String(l.t).trim()));
  const r=await g(()=>cloud.from('iasd_site_content').upsert({content_key:KEY,content_value:value}));
  if(!r||r.error){if(btn){btn.disabled=false;btn.textContent='Salvar textos'}return alert('Não foi possível salvar os textos: '+((r&&r.error&&r.error.message)||'sem conexão'))}
  g(()=>{siteTextOverrides[KEY]=value});
  close();g(()=>render());
}
window.IASDBannerEditor={open};
})();
