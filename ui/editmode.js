/* IASD APP · Modo edição (Fundador / Co-fundador / Admin).
   Botão "✏️ Editar site" no topo: com ele ligado, qualquer texto do site vira clicável para editar ou ocultar,
   e as imagens levam ao Acervo. As mudanças valem para todos e ficam em iasd_site_content (chaves "u_…").
   Qualquer visitante recebe os textos já trocados. */
(function(){
'use strict';
const SKIP='script,style,svg,input,textarea,select,option,button,code,pre,[contenteditable],#inline-editor-root,.fdx,.fdx-ov,.lg2,#ue-bar,#ue-ov,.hn-lyrics,.sg-root,.rd-verses,.iasd-edit-dialog';
const TAGS=new Set(['H1','H2','H3','H4','H5','H6','P','SPAN','SMALL','B','STRONG','EM','LABEL','LI','A','DIV','TD','TH','BLOCKQUOTE','FIGCAPTION','I']);
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return 'u_'+(h>>>0).toString(36)};
let on=false;
const ov=()=>{try{return siteTextOverrides}catch(e){return {}}};
const allowed=()=>{try{return contentEditAllowed()}catch(e){return false}};
const root=()=>document.getElementById('content');
const dtext=el=>[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue).join('').replace(/\s+/g,' ').trim();
function setText(el,v){const ns=[...el.childNodes].filter(n=>n.nodeType===3&&n.nodeValue.trim());if(!ns.length){el.appendChild(document.createTextNode(v));return}ns[0].nodeValue=v;ns.slice(1).forEach(n=>n.nodeValue='')}
function leaf(el){if(!TAGS.has(el.tagName))return false;if(el.closest(SKIP))return false;for(const c of el.children){if(c.textContent.trim())return false}const t=dtext(el);if(t.length<2||t.length>600)return false;if(/^[\d\s.,:;%+\-–—/()R$]+$/.test(t))return false;return true}
function apply(){
 const r=root();if(!r)return;const O=ov();
 r.querySelectorAll('*').forEach(el=>{
  if(!leaf(el))return;
  const now=dtext(el);
  if(el.dataset.uc===undefined||now!==el.dataset.uc){el.dataset.u0=now;el.classList.remove('ue-hid')}
  const orig=el.dataset.u0,key=hash(orig),val=O[key];
  if(val==='__hidden__'){el.classList.add('ue-hid')}
  else{el.classList.remove('ue-hid');const want=val!==undefined?val:orig;if(want!==dtext(el))setText(el,want)}
  el.dataset.uc=dtext(el);el.dataset.ue=key;
  if(on&&allowed())el.title='Clique para editar';
 });
}
let tm=null;const later=()=>{clearTimeout(tm);tm=setTimeout(()=>{try{apply();bar()}catch(e){}},90)};
function css(){if(document.getElementById('ue-css'))return;const s=document.createElement('style');s.id='ue-css';s.textContent=`
#ue-bar{position:fixed;z-index:9000;right:18px;bottom:18px;display:none;gap:8px;align-items:center;padding:6px 8px;border-radius:999px;background:#0f1c3a;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.35);font:700 14px Inter,system-ui,sans-serif}
#ue-bar.show{display:flex}#ue-bar button{border:0;border-radius:999px;padding:9px 16px;font:inherit;cursor:pointer;background:#f5b73a;color:#1c1406}
#ue-bar.on button{background:#34d399}#ue-bar span{padding:0 6px;opacity:.85;font-weight:600;max-width:260px;font-size:12.5px;line-height:1.25}@media(max-width:899px){#ue-bar{bottom:78px;right:10px;left:10px;justify-content:center;border-radius:18px}}
body.ue-on #content [data-ue]:hover{outline:2px dashed #f5b73a;outline-offset:3px;cursor:pointer;background:rgba(245,183,58,.12)}
body.ue-on #content img:hover{outline:3px dashed #38bdf8;outline-offset:2px;cursor:pointer}
body:not(.ue-on) .ue-hid{display:none!important}body.ue-on .ue-hid{opacity:.35;text-decoration:line-through}
#ue-ov{position:fixed;inset:0;z-index:9995;background:rgba(3,8,20,.66);display:grid;place-items:center;padding:14px}
#ue-ov .m{width:min(560px,100%);background:var(--iu-sf,#fff);color:var(--iu-tx,#0f1c3a);border:1px solid var(--iu-bd,#b4c3dc);border-radius:20px;padding:20px;display:grid;gap:12px}
#ue-ov h3{margin:0}#ue-ov textarea{width:100%;min-height:110px;padding:12px;border-radius:12px;border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf2,#edf1f9);color:inherit;font:inherit;font-size:16px}
#ue-ov .a{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}#ue-ov .a button{border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf,#fff);color:inherit;border-radius:12px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer}
#ue-ov .a .p{background:var(--iu-pr,#2563eb);color:#fff;border-color:transparent}#ue-ov .a .d{color:#b91c1c}#ue-ov small{opacity:.7}`;document.head.appendChild(s)}
function bar(){
 let b=document.getElementById('ue-bar');
 if(!b){b=document.createElement('div');b.id='ue-bar';b.innerHTML='<button type="button" id="ue-tg" onclick="IASDEdit.toggle()"></button><span id="ue-tx"></span>';document.body.appendChild(b)}
 const ok=allowed();b.classList.toggle('show',ok);b.classList.toggle('on',on&&ok);
 if(!ok&&on){on=false;document.body.classList.remove('ue-on')}
 document.getElementById('ue-tg').textContent=on?'✔ Concluir edição':'✏️ Editar site';
 document.getElementById('ue-tx').textContent=on?'Clique em qualquer texto para editar ou ocultar · imagens abrem o Acervo':'';
}
function toggle(){if(!allowed())return;on=!on;document.body.classList.toggle('ue-on',on);apply();bar()}
function closeEd(){document.getElementById('ue-ov')?.remove()}
function open(el){
 const key=el.dataset.ue,orig=(el.dataset.u0||'').trim(),cur=el.classList.contains('ue-hid')?orig:dtext(el);
 closeEd();const d=document.createElement('div');d.id='ue-ov';d.onclick=e=>{if(e.target===d)closeEd()};
 d.innerHTML='<div class="m" role="dialog" aria-label="Editar texto"><h3>✏️ Editar texto</h3><small>Vale para todo o site onde este mesmo texto aparecer. Original: “'+orig.replace(/[<>&]/g,'').slice(0,80)+'”</small><textarea id="ue-v" maxlength="1000"></textarea><div class="a"><button class="d" onclick="IASDEdit.hide(\''+key+'\')">Ocultar</button><button onclick="IASDEdit.reset(\''+key+'\')">Restaurar original</button><button onclick="IASDEdit.closeEd()">Cancelar</button><button class="p" onclick="IASDEdit.save(\''+key+'\')">Salvar</button></div></div>';
 document.body.appendChild(d);const t=document.getElementById('ue-v');t.value=cur;t.focus();
}
async function put(key,value){
 if(!allowed())return;const c=window.iasdCloud;
 let r;if(value===null)r=await c.from('iasd_site_content').delete().eq('content_key',key);
 else r=await c.from('iasd_site_content').upsert({content_key:key,content_value:value,updated_by:window.iasdCurrentUser?.()?.id,updated_at:new Date().toISOString()});
 if(r.error)return alert('Não foi possível salvar: '+r.error.message);
 const O=ov();if(value===null)delete O[key];else O[key]=value;closeEd();
 apply();
}
function save(key){const v=document.getElementById('ue-v').value.trim();if(!v)return alert('O texto não pode ficar vazio. Use "Ocultar" para esconder.');put(key,v)}
const hide=key=>put(key,'__hidden__'),reset=key=>put(key,null);
document.addEventListener('click',e=>{
 if(!on||!allowed())return;
 if(e.target.closest('#ue-bar,#ue-ov,#inline-editor-root,.fdx,.fdx-ov'))return;
 const img=e.target.closest('#content img');
 if(img){e.preventDefault();e.stopPropagation();if(confirm('Imagens e banners são trocados no Acervo do Site. Abrir agora?')&&typeof go==='function')go('Acervo');return}
 const el=e.target.closest('#content [data-ue]');
 if(el){e.preventDefault();e.stopPropagation();open(el)}
},true);
function start(){css();bar();const r=document.getElementById('content');if(r)new MutationObserver(later).observe(r,{childList:true,subtree:true,characterData:true});later();setInterval(()=>{bar()},1500)}
window.IASDEdit={toggle,save,hide,reset,closeEd,apply};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
