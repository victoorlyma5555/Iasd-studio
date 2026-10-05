/* Published compatibility + lazy editor entry. No observer or polling. */
(function(){
'use strict';
const child=new URLSearchParams(location.search).get('editor-preview')==='1'&&window.parent!==window;
let loader,flight,previewDocument,previewMode=false;
const allowed=()=>{try{return !!cloudUser&&(IASDAccess.canEditSite(cloudRole)||IASDAccess.canEditTexts(cloudRole)||IASDAccess.canManageTabs(cloudRole))}catch(e){return false}};
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return 'u_'+(h>>>0).toString(36)};
const direct=e=>[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue).join('').replace(/\s+/g,' ').trim();
function text(e,v){if(!e||v===undefined)return;const nodes=[...e.childNodes].filter(n=>n.nodeType===3&&n.nodeValue.trim());if(nodes.length){nodes[0].nodeValue=v+(/\s$/.test(nodes[0].nodeValue)?' ':'');nodes.slice(1).forEach(n=>n.nodeValue='')}else e.appendChild(document.createTextNode(v));}
function install(d){siteTextOverrides=d.texts;siteAssets=d.assets;assetFrames=d.frames;customTabs=d.tabs;const mark=document.getElementById('site-brandmark');if(mark){if(d.assets.site_logo){const img=document.createElement('img');img.src=imageUrl(d.assets.site_logo);img.alt='';img.style.cssText='width:38px;height:38px;object-fit:contain';mark.replaceChildren(img)}else mark.textContent='✦'}if(typeof applySiteTheme==='function'&&typeof activeSiteTheme!=='undefined')applySiteTheme(activeSiteTheme);}
function components(){const out=[];const add=(id,el,label,type,slot)=>{if(el){el.dataset.editorId=id;out.push({id,label,type,slot,description:el.querySelector('.bd small')?.textContent||''});}};
 add('banner',document.querySelector('.iu-ban,.hero'),'Banner principal','banner','home_banner');const banner=out.find(c=>c.id==='banner');if(banner){const q=s=>document.querySelector(s),h=q('.iu-ban h1');banner.fields={eyebrow:q('.iu-ban .iu-eb')?.textContent,title:h?direct(h):'',accent:q('.iu-ban h1 i')?.textContent,verse:q('.iu-ban .in>p')?.textContent,reference:q('.iu-ban .in>small')?.textContent,button:q('.iu-ban .in>.iu-btn')?.textContent};}
 add('passage',document.querySelector('#iu-passage,.verse-card'),'Versículo da página inicial','image','home_passage');
 add('cards',document.querySelector('#iu-cards,.quick-track'),'Cartões de acesso','section');
 document.querySelectorAll('#iu-cards .iu-cw').forEach(el=>{const s=el.querySelector('[data-slot]')?.dataset.slot||el.querySelector('.iu-card')?.dataset.editorSlot;if(s&&s!=='home_icon_projection')add('card:'+s,el,el.querySelector('b')?.textContent||s,'card',s)});
 const known=typeof assetSlots==='undefined'?[]:assetSlots;for(const [slot,label]of known){if(!/^(site_logo|home_icon_[a-zA-Z0-9_-]{1,120})$/.test(slot)||['home_icon_projection','home_icon_founder','home_icon_gallery'].includes(slot)||out.some(c=>c.slot===slot))continue;out.push({id:'card:'+slot,label,type:'image',slot});}return out;
}
function apply(){
 if(!child)window.IASDEditor?.checkAccess?.();
 const r=document.getElementById('content');if(!r||typeof siteTextOverrides==='undefined')return;
 const O=siteTextOverrides;
 for(const el of r.querySelectorAll('h1,h2,h3,h4,p,span,small,b,strong,em,label,li,a,div,td,th,blockquote,figcaption,i')){
  if(el.closest('script,style,svg,input,textarea,select,button,code,pre,[contenteditable],.hn-lyrics,.sg-root,.rd-verses,.iasd-edit-dialog'))continue;
  if([...el.children].some(c=>c.textContent.trim()))continue;const now=direct(el);if(now.length<2||now.length>600)continue;
  if(el.dataset.editorLegacyCurrent!==now)el.dataset.editorLegacyOriginal=now;
  const v=O[hash(el.dataset.editorLegacyOriginal)];if(v==='__hidden__')el.hidden=true;else if(v!==undefined)text(el,v);el.dataset.editorLegacyCurrent=direct(el);
 }
 const fields={eyebrow:'.iu-ban .iu-eb',title:'.iu-ban h1',accent:'.iu-ban h1 i',verse:'.iu-ban .in>p',reference:'.iu-ban .in>small',button:'.iu-ban .in>.iu-btn'};
 for(const [k,s]of Object.entries(fields))text(r.querySelector(s),O['home_editor_banner_'+k]);
 const list=components();let props={};try{props=JSON.parse(O.home_editor_props||'{}')}catch(e){}
 for(const c of list){const el=r.querySelector('[data-editor-id="'+c.id+'"]'),p=props[c.id]||{};if(!el)continue;el.hidden=!!p.hidden;el.style.textAlign=p.align||'';
  if(c.type==='card'){if(p.title!==undefined)text(el.querySelector('b'),p.title);if(p.description!==undefined)text(el.querySelector('.bd small'),p.description);if(p.destination)el.querySelector('[data-go]').dataset.go=p.destination;}
  if(p.alt!==undefined)el.querySelectorAll('img').forEach(img=>{img.alt=p.alt;img.removeAttribute('aria-hidden')});
 }
 const cards=r.querySelector('#iu-cards');if(cards){const items=[...cards.children],rank=new Map(items.map((e,i)=>[e,i]));items.sort((a,b)=>(props[a.dataset.editorId]?.order??rank.get(a))-(props[b.dataset.editorId]?.order??rank.get(b))).forEach(e=>cards.appendChild(e));}
 if(child){document.body.classList.toggle('editor-canvas',!previewMode);window.parent.postMessage({type:'iasd-editor-ready',components:list},location.origin);}
}
async function loadPublished(){if(child&&previewDocument){install(previewDocument);return true}if(!window.iasdCloud)return false;
 if(!flight)flight=window.iasdCloud.rpc('iasd_editor_published').then(r=>{if(r.error)return false;install(child&&previewDocument?previewDocument:r.data.document);render();return true}).catch(()=>false).finally(()=>{flight=null});return flight;
}
async function open(select,preset){if(child){window.parent.postMessage({type:'iasd-editor-select',id:select||'banner'},location.origin);return}if(!allowed())return;
 if(!loader)loader=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/ui/editor-model.js?v=1';s.onload=()=>{const t=document.createElement('script');t.src='/ui/editor.js?v=1';t.onload=resolve;t.onerror=reject;document.head.appendChild(t)};s.onerror=reject;document.head.appendChild(s)}).catch(e=>{loader=null;throw e});
 try{await loader;await window.IASDEditor.open(select,preset)}catch(e){alert('Não foi possível abrir o editor: '+e.message)}
}
window.IASDEdit={toggle:()=>open(),open,apply,loadPublished,allowed,get child(){return child},get active(){return !!window.IASDEditor?.active}};
if(child){
 const s=document.createElement('style');s.textContent='.editor-canvas [data-editor-id]:hover{outline:2px dashed #e5c483;outline-offset:3px;cursor:pointer}.iasd-pencil,.iu-edit,.iu-ed{display:none!important}';document.head.appendChild(s);
 window.addEventListener('message',e=>{if(e.source!==window.parent||e.origin!==location.origin||e.data?.type!=='iasd-editor-document')return;previewDocument=e.data.document;previewMode=!!e.data.preview;install(previewDocument);render()});
 document.addEventListener('click',e=>{if(e.target.closest('[data-act="account"],#account-trigger,[onclick*="openAuthModal"],[onclick*="toggleAccountMenu"]')){e.preventDefault();e.stopImmediatePropagation();return}if(previewMode)return;const el=e.target.closest('[data-editor-id]');if(el){e.preventDefault();e.stopImmediatePropagation();window.parent.postMessage({type:'iasd-editor-select',id:el.dataset.editorId},location.origin)}},true);
}
})();
