/* IASD APP · Imagens do site: editor de capas com prévia fiel, carrossel do banner completo e popup do perfil.
   Carregado depois de app/main.js: redefine editCover/saveCover/…, editHomeCarousel/homeCarouselMarkup/startHomeCarousel e toggleAccountMenu.
   Regra única de enquadramento (igual na prévia e no site): object-fit:cover + object-position X% Y% + zoom com origem em X% Y%. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const $=id=>document.getElementById(id);
const J=v=>JSON.stringify(v).replace(/"/g,'&quot;');
const isVideo=p=>/\.(mp4|webm|mov)$/i.test(p||'');
const frameOf=slot=>{const f=(typeof assetFrames!=='undefined'&&assetFrames[slot])||{};return{x:Number(f.position_x??50),y:Number(f.position_y??50),z:Math.max(1,Number(f.zoom??1))}};
const fstyle=f=>'object-fit:cover;object-position:'+f.x+'% '+f.y+'%;transform-origin:'+f.x+'% '+f.y+'%;transform:scale('+f.z+')';
function img(slot){const p=typeof siteAssets!=='undefined'&&siteAssets[slot];if(!p||isVideo(p))return '';return '<img class="fr-img" loading="lazy" alt="" src="'+esc(imageUrl(p))+'" style="'+fstyle(frameOf(slot))+'">'}

/* ---------- perfis de cada lugar onde uma imagem aparece ---------- */
const CARD=[172,74];
function profile(slot){
 if(slot==='home_banner'||/^home_banner_\d+$/.test(slot))return{n:'Banner da página inicial',where:'Faixa grande do topo do Início',views:[['Computador',1150,230],['Celular',360,250]]};
 if(/^hero_/.test(slot))return{n:'Banner da página',where:'Faixa do topo desta página (a imagem ocupa o lado direito)',views:[['Computador',760,216],['Celular',360,216]]};
 if(slot==='home_projector')return{n:'Imagem do IASD Projetor',where:'Cartão do projetor no Início',views:[['Cartão',420,140]]};
 if(slot==='site_logo')return{n:'Logotipo',where:'Marca do site',views:[['Logotipo',220,220]]};
 if(/^home_icon_/.test(slot))return{n:'Ícone do acesso rápido',where:'Ícone do cartão',views:[['Ícone',160,160]]};
 if(/^custom_cover_/.test(slot)||typeof CARDS!=='undefined')return{n:'Capa do acesso rápido',where:'Cartões do Acesso rápido no Início',views:[['Cartão',CARD[0],CARD[1]]]};
 return{n:'Capa do acesso rápido',where:'Cartões do Acesso rápido no Início',views:[['Cartão',CARD[0],CARD[1]]]};
}
function slotLabel(slot){try{const a=assetSlots.find(x=>x[0]===slot);if(a)return a[1]}catch(e){}
 if(/^custom_cover_/.test(slot)){const id=slot.slice(13),t=(typeof customTabs!=='undefined'?customTabs:[]).find(x=>String(x.id)===id);return 'Capa da aba '+(t?t.title:'')}
 return profile(slot).n}

/* ---------- CSS ---------- */
function css(){if($('media-css'))return;const s=document.createElement('style');s.id='media-css';s.textContent=`
.fr-img{position:absolute;inset:0;width:100%;height:100%;display:block;max-width:none;pointer-events:none;user-select:none}
.iu-card .im{position:relative;overflow:hidden}.iu-pv{position:relative;overflow:hidden;min-height:140px}.iu-pv>.fr-img{z-index:0}.iu-pv>.iu-edit{z-index:2}
.dashboard-hero-carousel .hero-slide{transform-origin:var(--hero-x,50%) var(--hero-y,50%)!important;transform:scale(var(--hero-z,1))!important}
.dashboard-hero-carousel[data-fx=zoom] .hero-slide.active{animation:hcz 9s ease-out forwards}@keyframes hcz{from{scale:1}to{scale:1.12}}
.dashboard-hero-carousel[data-fx=slide] .hero-slide{opacity:1;translate:100% 0;transition:translate .9s cubic-bezier(.6,0,.2,1)}
.dashboard-hero-carousel[data-fx=slide] .hero-slide.active{translate:0 0}.dashboard-hero-carousel[data-fx=slide] .hero-slide.out{translate:-100% 0}
.hc-ctl{position:absolute;inset:0;z-index:3;pointer-events:none}
.hc-dots{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);display:flex;gap:7px;pointer-events:auto}
.hc-dots button{width:9px;height:9px;padding:0;border-radius:99px;border:0;background:rgba(255,255,255,.5);cursor:pointer;transition:.25s}.hc-dots button.on{width:26px;background:#f5b73a}
.hc-arw{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:0;background:rgba(6,14,31,.55);color:#fff;font-size:20px;cursor:pointer;pointer-events:auto;opacity:0;transition:.2s}
.iu-ban:hover .hc-arw{opacity:1}.hc-arw.l{left:10px}.hc-arw.r{right:10px}@media(hover:none){.hc-arw{opacity:.8}}
/* editor de capas */
.cv-ov{position:fixed;inset:0;z-index:9992;background:rgba(3,8,20,.7);display:grid;place-items:center;padding:12px;animation:cvin .2s both}@keyframes cvin{from{opacity:0}}
.cv-md{width:min(1080px,100%);max-height:94vh;display:flex;flex-direction:column;background:var(--iu-sf,#fff);color:var(--iu-tx,#0f1c3a);border:1px solid var(--iu-bd,#b4c3dc);border-radius:22px;overflow:hidden}
.cv-hd{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--iu-bd,#b4c3dc)}.cv-hd b{font-size:19px}.cv-hd small{display:block;opacity:.7;margin-top:2px}.cv-hd .x{margin-left:auto}
.cv-bd{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:18px;padding:18px 20px;overflow:auto}
.cv-b{border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf,#fff);color:inherit;border-radius:12px;padding:9px 14px;font:inherit;font-weight:700;cursor:pointer}
.cv-b.p{background:linear-gradient(135deg,#f8c14f,#e38a10);color:#1c1406;border-color:transparent}.cv-b.d{color:#b91c1c}.cv-b:disabled{opacity:.5}
.cv-views{display:flex;gap:6px;margin-bottom:10px}.cv-views .cv-b{padding:6px 12px;font-size:13px}.cv-views .cv-b.on{background:var(--iu-pr,#2563eb);color:#fff;border-color:transparent}
.cv-stage{display:grid;place-items:center;padding:14px;border-radius:16px;background:repeating-conic-gradient(#0000000d 0 25%,transparent 0 50%) 0 0/18px 18px,var(--iu-sf2,#edf1f9)}
.cv-frame{position:relative;overflow:hidden;border-radius:12px;background:#0b1328;box-shadow:0 0 0 2px #f5b73a,0 10px 30px rgba(0,0,0,.35);touch-action:none;cursor:grab;width:100%}
.cv-frame:active{cursor:grabbing}.cv-frame .fr-img{pointer-events:none}
.cv-frame.empty{display:grid;place-items:center;color:#9fb2d8;font-size:14px;text-align:center;padding:10px}
.cv-info{font-size:13px;opacity:.75;margin:8px 2px}
.cv-ctl{display:grid;gap:10px;margin-top:12px}.cv-ctl label{display:grid;grid-template-columns:78px 1fr 46px;gap:8px;align-items:center;font-weight:700;font-size:13.5px}.cv-ctl output{font-variant-numeric:tabular-nums;opacity:.75;text-align:right;font-size:13px}
.cv-foc{display:grid;grid-template-columns:repeat(3,34px);gap:4px}.cv-foc button{height:30px;border-radius:8px;border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf,#fff);cursor:pointer;color:inherit}
.cv-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.cv-gal h4{margin:0}.cv-gal .top{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}.cv-gal .top .cv-b{margin-left:auto}
.cv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));grid-auto-rows:84px;align-content:start;gap:8px;max-height:430px;overflow:auto;-webkit-overflow-scrolling:touch;padding:2px}.cv-grid>button{width:100%;height:100%;min-height:0;aspect-ratio:auto;flex:none}
.cv-grid button{position:relative;padding:0;aspect-ratio:4/3;border-radius:10px;border:2px solid transparent;overflow:hidden;cursor:pointer;background:var(--iu-sf2,#edf1f9)}.cv-grid button img{width:100%;height:100%;object-fit:cover;display:block}.cv-grid button.on{border-color:#f5b73a;box-shadow:0 0 0 2px #f5b73a55}
.cv-grid button.ck:after{content:'✓';position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:#34d399;color:#06281c;font-weight:900;display:grid;place-items:center}
.cv-ft{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap;padding:14px 20px;border-top:1px solid var(--iu-bd,#b4c3dc)}.cv-ft small{margin-right:auto;opacity:.75}
@media(max-width:820px){.cv-bd{grid-template-columns:minmax(0,1fr)}.cv-grid{max-height:260px}}
/* carrossel */
.ce-list{display:grid;gap:8px;max-height:48vh;overflow:auto;padding:2px}
.ce-it{display:grid;grid-template-columns:auto 150px minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 10px;border-radius:14px;border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf,#fff)}
.ce-it.off{opacity:.5}.ce-it.drag{outline:2px dashed #f5b73a}.ce-h{cursor:grab;font-size:18px;opacity:.6;padding:0 4px;user-select:none}
.ce-th{position:relative;width:150px;aspect-ratio:5/1.6;border-radius:8px;overflow:hidden;background:#0b1328}.ce-th .n{position:absolute;left:5px;top:4px;background:#0009;color:#fff;border-radius:99px;font-size:11px;font-weight:800;padding:1px 7px;z-index:2}
.ce-tx b{display:block}.ce-tx small{opacity:.65;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ce-ac{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.ce-ac .cv-b{padding:7px 10px;font-size:13px}
.ce-set{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px}
.ce-box{padding:12px 14px;border-radius:14px;border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf2,#edf1f9);display:grid;gap:8px}.ce-box b{font-size:14px}
.ce-box label.sw{display:flex;align-items:center;gap:8px;font-size:14px}.ce-box select,.ce-box input[type=number]{padding:8px 10px;border-radius:10px;border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf,#fff);color:inherit;font:inherit}
@media(max-width:720px){.ce-it{grid-template-columns:auto 96px minmax(0,1fr)}.ce-th{width:96px}.ce-ac{grid-column:1/-1;justify-content:flex-start}}
/* popup do perfil */
.acp-dismiss{position:fixed;inset:0;z-index:40;background:rgba(3,8,20,.25);animation:cvin .15s both}
.acp{position:fixed;right:max(14px,calc((100vw - 1200px)/2 + 16px));top:76px;z-index:41;width:min(352px,calc(100vw - 20px));border-radius:22px;overflow:hidden;background:var(--iu-sf,#fff);color:var(--iu-tx,#0f1c3a);border:1px solid var(--iu-bd,#b4c3dc);box-shadow:0 24px 70px rgba(4,10,30,.45);animation:acpin .22s cubic-bezier(.2,1.2,.4,1) both;transform-origin:top right}
@keyframes acpin{from{opacity:0;transform:translateY(-8px) scale(.96)}}
.acp-top{position:relative;padding:24px 20px 20px;background:linear-gradient(135deg,#1d2f6b,#6d4be0 60%,#e8945a);color:#fff;display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center}
.acp-top.c{background-size:cover;background-position:center}.acp-top.c:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,14,31,.88),rgba(6,14,31,.62))}.acp-top.c .acp-nm{text-shadow:0 1px 6px rgba(0,0,0,.7)}.acp-top>*{position:relative}
.acp-av{position:relative;width:64px;height:64px;border-radius:50%;background:#f5b73a;color:#1c1406;font-size:28px;font-weight:900;display:grid;place-items:center;box-shadow:0 0 0 3px #fff8,0 6px 18px #0006;overflow:visible}
.acp-av .ph{position:absolute;inset:0;border-radius:50%;overflow:hidden}.acp-av .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.acp-av i{position:absolute;right:0;bottom:2px;width:14px;height:14px;border-radius:50%;background:#34d399;border:2px solid #fff}
.acp-nm{min-width:0}.acp-nm b{display:block;font-size:18px;line-height:1.15;overflow:hidden;text-overflow:ellipsis}.acp-nm small{display:block;opacity:.92;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:4px}
.acp-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.acp-tags span{font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:99px;background:rgba(255,255,255,.2);backdrop-filter:blur(4px)}
.acp-lst{padding:8px}.acp-lst button,.acp-lst .acp-sw{display:grid;grid-template-columns:38px 1fr auto;gap:12px;align-items:center;width:100%;text-align:left;border:0;background:none;color:inherit;border-radius:14px;padding:10px;font:inherit;cursor:pointer;transition:.12s}
.acp-lst button:hover{background:var(--iu-sf2,#edf1f9)}.acp-lst .ic{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-size:18px;background:var(--iu-sf2,#edf1f9)}
.acp-lst b{display:block;font-size:14.5px}.acp-lst small{display:block;opacity:.65;font-size:12px}.acp-lst .ch{opacity:.4;font-size:18px}
.acp-lst .ok .ic{background:#34d39922}.acp-lst .gd .ic{background:#f5b73a33}.acp-lst .bl .ic{background:#3b82f633}.acp-lst .pu .ic{background:#8b5cf633}
.acp-lst .out{margin-top:4px;color:#b91c1c}.acp-lst .out .ic{background:#fee2e2}.acp-sep{height:1px;background:var(--iu-bd,#b4c3dc);margin:6px 10px;opacity:.6}
.acp-ft{padding:8px 16px 14px;text-align:center;font-size:12px;opacity:.6}
.acp-tg{width:40px;height:22px;border-radius:99px;background:#94a3b8;position:relative;transition:.2s}.acp-tg:after{content:'';position:absolute;left:2px;top:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s}.acp-tg.on{background:#34d399}.acp-tg.on:after{left:20px}
.acp-guest{padding:22px 18px;display:grid;gap:10px;text-align:center}.acp-guest h3{margin:0}.acp-guest p{margin:0;opacity:.75;font-size:14px}.acp-guest button{border:0;border-radius:14px;padding:12px;font:inherit;font-weight:800;cursor:pointer}
.acp-guest .p{background:linear-gradient(135deg,#f8c14f,#e38a10);color:#1c1406}.acp-guest .s{background:var(--iu-sf2,#edf1f9);color:inherit}
`;document.head.appendChild(s)}

/* ================= EDITOR DE CAPAS ================= */
const C={slot:'',path:'',x:50,y:50,z:1,view:0,gal:[],sel:'',nat:null};
function frameHTML(){
 const pf=profile(C.slot),v=pf.views[C.view]||pf.views[0];
 const style='aspect-ratio:'+v[1]+'/'+v[2]+';max-width:'+Math.min(520,Math.round(v[1]*(v[1]>600?.5:1)+60))+'px';
 if(!C.path)return '<div class="cv-frame empty" id="cv-fr" style="'+style+'">Escolha uma imagem da galeria ou envie do computador.</div>';
 return '<div class="cv-frame" id="cv-fr" style="'+style+'"><img class="fr-img" id="cv-img" alt="Prévia" src="'+esc(imageUrl(C.path))+'" style="'+fstyle({x:C.x,y:C.y,z:C.z})+'"></div>';
}
function editCover(slot){
 if(typeof canManageSite==='function'&&!canManageSite())return;css();
 const f=frameOf(slot);C.reopen=false;C.slot=slot;C.path=(siteAssets&&siteAssets[slot])||'';C.x=f.x;C.y=f.y;C.z=f.z;C.view=0;C.sel=C.path;
 paint();loadGal();
}
function paint(){
 const pf=profile(C.slot);$('cv-ov')?.remove();
 const d=document.createElement('div');d.className='cv-ov';d.id='cv-ov';d.onmousedown=e=>{if(e.target===d)closeCover()};
 d.innerHTML='<div class="cv-md" role="dialog" aria-modal="true" aria-label="Editar imagem"><div class="cv-hd"><span style="font-size:22px">🖼️</span><div><b>'+esc(slotLabel(C.slot))+'</b><small>'+esc(pf.where)+'</small></div><button class="cv-b x" onclick="closeCover()" aria-label="Fechar">✕</button></div>'+
 '<div class="cv-bd"><div>'+(pf.views.length>1?'<div class="cv-views">'+pf.views.map((v,i)=>'<button class="cv-b '+(i===C.view?'on':'')+'" onclick="IASDMedia.view('+i+')">'+v[0]+'</button>').join('')+'</div>':'<div class="cv-views"><span class="cv-info" style="margin:0">Prévia: '+esc(pf.views[0][0])+'</span></div>')+
 '<div class="cv-stage" id="cv-stage">'+frameHTML()+'</div><div class="cv-info">A moldura dourada é exatamente o que aparece no site. Arraste a imagem para posicionar e use a roda do mouse (ou o controle de zoom) para aproximar.</div>'+
 '<div class="cv-ctl"><label>Zoom<input type="range" id="cv-z" min="1" max="3" step=".02" value="'+C.z+'" oninput="IASDMedia.set(\'z\',this.value)"><output id="cv-zo">'+C.z.toFixed(2)+'×</output></label><label>Horizontal<input type="range" id="cv-x" min="0" max="100" step="1" value="'+C.x+'" oninput="IASDMedia.set(\'x\',this.value)"><output id="cv-xo">'+Math.round(C.x)+'%</output></label><label>Vertical<input type="range" id="cv-y" min="0" max="100" step="1" value="'+C.y+'" oninput="IASDMedia.set(\'y\',this.value)"><output id="cv-yo">'+Math.round(C.y)+'%</output></label>'+
 '<div class="cv-row"><div class="cv-foc" title="Ponto de foco">'+[[0,0,'↖'],[50,0,'↑'],[100,0,'↗'],[0,50,'←'],[50,50,'●'],[100,50,'→'],[0,100,'↙'],[50,100,'↓'],[100,100,'↘']].map(a=>'<button onclick="IASDMedia.focus('+a[0]+','+a[1]+')">'+a[2]+'</button>').join('')+'</div><div style="display:grid;gap:6px"><button class="cv-b" onclick="IASDMedia.reset()">Centralizar e ajustar</button><small class="cv-info" style="margin:0">Foco rápido: escolha a parte da foto que deve aparecer.</small></div></div></div></div>'+
 '<div class="cv-gal"><div class="top"><h4>Galeria do site</h4><label class="cv-b p" style="cursor:pointer">＋ Enviar do computador<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onchange="IASDMedia.upload(this)"></label></div><div class="cv-grid" id="cv-grid">Carregando…</div></div></div>'+
 '<div class="cv-ft"><small id="cv-st"></small>'+(C.path?'<button class="cv-b d" onclick="IASDMedia.remove()">Remover imagem</button>':'')+'<button class="cv-b" onclick="closeCover()">Cancelar</button><button class="cv-b p" id="cv-save" onclick="IASDMedia.save()">Salvar e publicar</button></div></div>';
 document.body.appendChild(d);bindDrag();
}
function closeCover(){const re=C.reopen;$('cv-ov')?.remove();C.slot='';C.reopen=false;try{coverSlotEditing=''}catch(e){}if(re&&CE)renderCE()}
function sync(){
 const im=$('cv-img');if(im)im.style.cssText=fstyle({x:C.x,y:C.y,z:C.z});
 const set=(id,v,o)=>{const e=$(id);if(e&&document.activeElement!==e)e.value=v;const t=$(id+'o');if(t)t.textContent=o};
 set('cv-z',C.z,C.z.toFixed(2)+'×');set('cv-x',C.x,Math.round(C.x)+'%');set('cv-y',C.y,Math.round(C.y)+'%');
}
function set(k,v){C[k]=Number(v);C.z=Math.min(3,Math.max(1,C.z));C.x=Math.min(100,Math.max(0,C.x));C.y=Math.min(100,Math.max(0,C.y));sync()}
function bindDrag(){
 const fr=$('cv-fr');if(!fr||!C.path)return;let st=null;
 fr.onpointerdown=e=>{fr.setPointerCapture(e.pointerId);st={px:e.clientX,py:e.clientY,x:C.x,y:C.y}};
 fr.onpointermove=e=>{if(!st)return;const im=$('cv-img'),r=fr.getBoundingClientRect(),nw=im.naturalWidth||1,nh=im.naturalHeight||1,sc=Math.max(r.width/nw,r.height/nh),ow=Math.max(nw*sc-r.width,r.width*.3),oh=Math.max(nh*sc-r.height,r.height*.3);
  C.x=Math.min(100,Math.max(0,st.x-(e.clientX-st.px)/ow*100/(C.z>1?C.z:1)*(C.z>1?1:1)));C.y=Math.min(100,Math.max(0,st.y-(e.clientY-st.py)/oh*100/(C.z>1?C.z:1)));sync()};
 fr.onpointerup=fr.onpointercancel=()=>{st=null};
 fr.onwheel=e=>{e.preventDefault();set('z',C.z+(e.deltaY<0?.08:-.08))};
}
async function loadGal(){
 const slot=C.slot;let all=[];
 try{const r=await cloud.rpc('iasd_list_site_images');if(r.error)throw r.error;all=(r.data||[]).map(x=>x.name).filter(Boolean)}catch(e){const g=$('cv-grid');if(g)g.textContent='Não foi possível carregar a galeria: '+(e.message||e);return}
 C.gal=all;if(C.slot!==slot)return;drawGal();
}
function drawGal(){const g=$('cv-grid');if(!g)return;g.innerHTML=C.gal.length?C.gal.map(p=>'<button class="'+(C.path===p?'on':'')+'" onclick="IASDMedia.choose('+J(p)+')"><img loading="lazy" src="'+esc(imageUrl(p))+'" alt=""></button>').join(''):'Nenhuma imagem na biblioteca. Envie uma do computador.'}
function choose(p){C.path=p;C.x=50;C.y=50;C.z=1;const st=$('cv-stage');if(st){st.innerHTML=frameHTML();bindDrag()}sync();drawGal()}
function view(i){C.view=i;const st=$('cv-stage');if(st){st.innerHTML=frameHTML();bindDrag()}document.querySelectorAll('.cv-views .cv-b').forEach((b,k)=>b.classList.toggle('on',k===i))}
function reset(){C.x=50;C.y=50;C.z=1;sync()}
function focus(x,y){C.x=x;C.y=y;sync()}
async function upload(inp){
 const file=inp.files?.[0];if(!file)return;const st=$('cv-st');
 if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)||file.size>50*1024*1024){st.textContent='Imagem inválida ou maior que 50 MB.';return}
 st.textContent='Enviando…';const path=crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,60);
 const r=await cloud.storage.from('iasd-images').upload(path,file,{contentType:file.type});if(r.error){st.textContent=r.error.message;return}
 C.gal.unshift(path);st.textContent='Imagem enviada.';choose(path);
}
async function save(){
 if(!C.slot||!C.path){$('cv-st').textContent='Escolha uma imagem.';return}
 const slot=C.slot,b=$('cv-save');b.disabled=true;$('cv-st').textContent='Publicando…';
 const r=await cloud.from('iasd_site_assets').upsert({slot,image_path:C.path,updated_at:new Date().toISOString()});if(r.error){b.disabled=false;$('cv-st').textContent=r.error.message;return}
 siteAssets[slot]=C.path;const fr={slot,position_x:Math.round(C.x),position_y:Math.round(C.y),zoom:Math.round(C.z*100)/100};
 const q=await cloud.from('iasd_asset_framing').upsert(fr);if(q.error){b.disabled=false;$('cv-st').textContent=q.error.message;return}
 assetFrames[slot]=fr;const reopen=C.reopen;C.reopen=false;closeCover();render();if(reopen&&CE)renderCE();
}
async function remove(){
 if(!C.slot||!(await IASDDialog.confirm('Remover a imagem desta capa?')))return;const slot=C.slot;
 const r=await cloud.from('iasd_site_assets').delete().eq('slot',slot);if(r.error){$('cv-st').textContent=r.error.message;return}
 delete siteAssets[slot];closeCover();render();
}

/* ================= CARROSSEL ================= */
const origItems=typeof homeBannerItems==='function'?homeBannerItems:()=>[];
const DEF={sec:0,fx:'fade',shuffle:false,dots:true,arrows:true,pause:true,order:[],off:[]};
function cfg(){let c={};try{c=JSON.parse(siteTextOverrides.home_carousel_cfg||'{}')}catch(e){}
 const base=Number(siteTextOverrides.home_carousel_seconds||4.5);return Object.assign({},DEF,{sec:Math.min(30,Math.max(2,Number.isFinite(base)?base:4.5))},c)}
function allItems(c){c=c||cfg();const it=origItems();const pos=s=>{const i=c.order.indexOf(s);return i<0?1e6+it.findIndex(x=>x.slot===s):i};return it.slice().sort((a,b)=>pos(a.slot)-pos(b.slot))}
function activeItems(){const c=cfg();let it=allItems(c).filter(x=>!c.off.includes(x.slot));if(c.shuffle&&it.length>1){const k='iasd-hc-seed';let seed=Number(sessionStorage.getItem(k));if(!seed){seed=Math.floor(Math.random()*1e9)+1;try{sessionStorage.setItem(k,seed)}catch(e){}}let a=seed;const r=()=>{a=(a*16807)%2147483647;return a/2147483647};it=it.map(v=>[r(),v]).sort((p,q)=>p[0]-q[0]).map(v=>v[1])}return it}
window.homeBannerItems=function(){return activeItems()};
window.homeCarouselSeconds=function(){return cfg().sec};
window.homeCarouselMarkup=function(){
 css();const items=activeItems();if(!items.length)return '';const c=cfg();
 const slides=items.map(({slot,path:p},i)=>{const f=frameOf(slot),st='--hero-x:'+f.x+'%;--hero-y:'+f.y+'%;--hero-z:'+f.z+';';return isVideo(p)?'<video class="hero-slide '+(i===0?'active':'')+'" muted loop playsinline autoplay src="'+esc(imageUrl(p))+'"></video>':'<img class="hero-slide '+(i===0?'active':'')+'" src="'+esc(imageUrl(p))+'" style="'+st+'" alt="">'}).join('');
 const ctl=items.length>1?'<div class="hc-ctl">'+(c.arrows?'<button class="hc-arw l" aria-label="Anterior" onclick="IASDMedia.hcGo(-1)">‹</button><button class="hc-arw r" aria-label="Próxima" onclick="IASDMedia.hcGo(1)">›</button>':'')+(c.dots?'<div class="hc-dots">'+items.map((_,i)=>'<button class="'+(i===0?'on':'')+'" aria-label="Imagem '+(i+1)+'" onclick="IASDMedia.hcTo('+i+')"></button>').join('')+'</div>':'')+'</div>':'';
 return '<div class="dashboard-hero-carousel" id="home-banner-carousel" data-fx="'+esc(c.fx)+'">'+slides+'</div>'+ctl;
}
let HC={i:0,t:null};
function hcShow(n){
 const box=$('home-banner-carousel');if(!box)return;const sl=[...box.querySelectorAll('.hero-slide')];if(sl.length<2)return;
 const prev=HC.i;HC.i=(n+sl.length)%sl.length;if(prev===HC.i)return;
 sl.forEach((s,k)=>{s.classList.remove('out');if(k===prev){s.classList.remove('active');s.classList.add('out')}if(k===HC.i){s.classList.remove('out');s.classList.add('active')}});
 setTimeout(()=>sl[prev]?.classList.remove('out'),1000);
 document.querySelectorAll('.hc-dots button').forEach((d,k)=>d.classList.toggle('on',k===HC.i));
}
function hcTimer(){clearInterval(HC.t);HC.t=null;const box=$('home-banner-carousel');if(!box||box.querySelectorAll('.hero-slide').length<2)return;HC.t=setInterval(()=>hcShow(HC.i+1),cfg().sec*1000)}
window.startHomeCarousel=function(){
 try{if(typeof homeCarouselTimer!=='undefined'&&homeCarouselTimer){clearInterval(homeCarouselTimer);homeCarouselTimer=null}}catch(e){}
 HC.i=0;hcTimer();const ban=document.querySelector('.iu-ban');const c=cfg();
 if(ban&&!ban.dataset.hc){ban.dataset.hc='1';
  if(c.pause){ban.addEventListener('mouseenter',()=>{clearInterval(HC.t)});ban.addEventListener('mouseleave',hcTimer)}
  let sx=null;ban.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});ban.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50){hcShow(HC.i+(dx<0?1:-1));hcTimer()}sx=null},{passive:true})}
};
const hcGo=d=>{hcShow(HC.i+d);hcTimer()},hcTo=i=>{hcShow(i);hcTimer()};

/* ---- editor do carrossel ---- */
let CE=null;
function openCarousel(){if(typeof canManageSite==='function'&&!canManageSite())return;CE={cfg:cfg(),drag:null};renderCE()}
function renderCE(){
 css();if(!CE)return;
 const c=CE.cfg,items=allItems(c);c.order=items.map(x=>x.slot);
 $('cv-ov')?.remove();$('ce-ov')?.remove();
 const d=document.createElement('div');d.className='cv-ov';d.id='ce-ov';d.onmousedown=e=>{if(e.target===d)closeCarousel()};
 const on=items.filter(x=>!c.off.includes(x.slot)).length;
 d.innerHTML='<div class="cv-md" role="dialog" aria-modal="true" aria-label="Editar carrossel"><div class="cv-hd"><span style="font-size:22px">🎞️</span><div><b>Carrossel do banner</b><small>'+items.length+' imagem(ns) · '+on+' ativa(s). Arraste ☰ ou use as setas para mudar a ordem.</small></div><button class="cv-b x" onclick="IASDMedia.closeCarousel()" aria-label="Fechar">✕</button></div>'+
 '<div style="padding:16px 20px;overflow:auto"><div class="ce-list" id="ce-list">'+(items.length?items.map((it,i)=>{const off=c.off.includes(it.slot),f=frameOf(it.slot);
  return '<div class="ce-it '+(off?'off':'')+'" draggable="true" data-slot="'+esc(it.slot)+'"><span class="ce-h" title="Arrastar">☰</span><div class="ce-th"><span class="n">'+(i+1)+'</span>'+(isVideo(it.path)?'<video src="'+esc(imageUrl(it.path))+'" muted></video>':'<img class="fr-img" alt="" src="'+esc(imageUrl(it.path))+'" style="'+fstyle(f)+'">')+'</div><div class="ce-tx"><b>Imagem '+(i+1)+(off?' · desativada':'')+'</b><small>'+esc(String(it.path).split('/').pop())+'</small></div><div class="ce-ac"><button class="cv-b" onclick="IASDMedia.ceMove('+J(it.slot)+',-1)" '+(i===0?'disabled':'')+'>↑</button><button class="cv-b" onclick="IASDMedia.ceMove('+J(it.slot)+',1)" '+(i===items.length-1?'disabled':'')+'>↓</button><button class="cv-b" onclick="IASDMedia.ceToggle('+J(it.slot)+')">'+(off?'Ativar':'Desativar')+'</button><button class="cv-b" onclick="IASDMedia.ceFrame('+J(it.slot)+')">Enquadrar</button><button class="cv-b d" onclick="IASDMedia.ceRemove('+J(it.slot)+')">Remover</button></div></div>'}).join(''):'<p style="opacity:.7">Nenhuma imagem no carrossel. Envie ou escolha da biblioteca.</p>')+'</div>'+
 '<div class="cv-row" style="margin-top:12px"><label class="cv-b p" style="cursor:pointer">＋ Enviar imagens<input type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onchange="IASDMedia.ceUpload(this)"></label><button class="cv-b" onclick="IASDMedia.ceLib()">🖼️ Escolher da biblioteca</button></div>'+
 '<div class="ce-set"><div class="ce-box"><b>⏱️ Tempo de troca</b><div class="cv-row"><input type="range" id="ce-sec" min="2" max="20" step=".5" value="'+c.sec+'" oninput="IASDMedia.ceSet(\'sec\',this.value)" style="flex:1"><output id="ce-seco">'+c.sec+'s</output></div></div>'+
 '<div class="ce-box"><b>✨ Efeito de transição</b><select onchange="IASDMedia.ceSet(\'fx\',this.value)">'+[['fade','Suave (esmaecer)'],['slide','Deslizar'],['zoom','Zoom lento (cinema)']].map(o=>'<option value="'+o[0]+'" '+(c.fx===o[0]?'selected':'')+'>'+o[1]+'</option>').join('')+'</select></div>'+
 '<div class="ce-box"><b>🎛️ Opções</b><label class="sw"><input type="checkbox" '+(c.shuffle?'checked':'')+' onchange="IASDMedia.ceSet(\'shuffle\',this.checked)"> Ordem aleatória a cada visita</label><label class="sw"><input type="checkbox" '+(c.dots?'checked':'')+' onchange="IASDMedia.ceSet(\'dots\',this.checked)"> Mostrar bolinhas</label><label class="sw"><input type="checkbox" '+(c.arrows?'checked':'')+' onchange="IASDMedia.ceSet(\'arrows\',this.checked)"> Mostrar setas</label><label class="sw"><input type="checkbox" '+(c.pause?'checked':'')+' onchange="IASDMedia.ceSet(\'pause\',this.checked)"> Pausar ao passar o mouse</label></div></div></div>'+
 '<div class="cv-ft"><small id="ce-st">Ajuste e clique em Salvar para publicar.</small><button class="cv-b" onclick="IASDMedia.closeCarousel()">Fechar</button><button class="cv-b p" id="ce-save" onclick="IASDMedia.ceSave()">Salvar alterações</button></div></div>';
 document.body.appendChild(d);
 const list=$('ce-list');
 list.ondragstart=e=>{const it=e.target.closest('.ce-it');if(!it)return;CE.drag=it.dataset.slot;it.classList.add('drag');e.dataTransfer.effectAllowed='move'};
 list.ondragend=e=>{e.target.closest('.ce-it')?.classList.remove('drag');CE.drag=null};
 list.ondragover=e=>{e.preventDefault()};
 list.ondrop=e=>{e.preventDefault();const it=e.target.closest('.ce-it');if(!it||!CE.drag||it.dataset.slot===CE.drag)return;const o=CE.cfg.order.filter(s=>s!==CE.drag),i=o.indexOf(it.dataset.slot);o.splice(i,0,CE.drag);CE.cfg.order=o;renderCE()};
}
function closeCarousel(){$('ce-ov')?.remove();CE=null}
function ceSet(k,v){if(!CE)return;CE.cfg[k]=(k==='sec')?Number(v):v;if(k==='sec'){const o=$('ce-seco');if(o)o.textContent=v+'s'}}
function ceMove(slot,d){const o=CE.cfg.order,i=o.indexOf(slot),j=i+d;if(i<0||j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];renderCE()}
function ceToggle(slot){const off=CE.cfg.off,i=off.indexOf(slot);if(i<0)off.push(slot);else off.splice(i,1);renderCE()}
function ceFrame(slot){const keep=CE;$('ce-ov')?.remove();editCover(slot);C.reopen=true;CE=keep}
async function ceSave(){
 const b=$('ce-save');b.disabled=true;$('ce-st').textContent='Salvando…';
 const value=JSON.stringify({sec:CE.cfg.sec,fx:CE.cfg.fx,shuffle:CE.cfg.shuffle,dots:CE.cfg.dots,arrows:CE.cfg.arrows,pause:CE.cfg.pause,order:CE.cfg.order,off:CE.cfg.off});
 const r=await cloud.from('iasd_site_content').upsert({content_key:'home_carousel_cfg',content_value:value,updated_by:cloudUser?.id,updated_at:new Date().toISOString()});
 if(r.error){b.disabled=false;$('ce-st').textContent='Erro: '+r.error.message;return}
 siteTextOverrides.home_carousel_cfg=value;siteTextOverrides.home_carousel_seconds=String(CE.cfg.sec);
 cloud.from('iasd_site_content').upsert({content_key:'home_carousel_seconds',content_value:String(CE.cfg.sec),updated_by:cloudUser?.id,updated_at:new Date().toISOString()});
 closeCarousel();render();
}
async function ceRemove(slot){
 if(!(await IASDDialog.confirm('Remover esta imagem do carrossel?')))return;
 const r=await cloud.from('iasd_site_assets').delete().eq('slot',slot);if(r.error)return alert(r.error.message);
 delete siteAssets[slot];CE.cfg.order=CE.cfg.order.filter(s=>s!==slot);CE.cfg.off=CE.cfg.off.filter(s=>s!==slot);renderCE();render();
}
async function ceUpload(inp){
 const files=[...(inp.files||[])];if(!files.length)return;const st=$('ce-st');
 const used=new Set(Object.keys(siteAssets).filter(s=>s==='home_banner'||/^home_banner_\d+$/.test(s)));let nx=1;
 const nextSlot=()=>{if(!used.has('home_banner')){used.add('home_banner');return 'home_banner'}while(used.has('home_banner_'+nx))nx++;const s='home_banner_'+nx++;used.add(s);return s};
 for(let i=0;i<files.length;i++){const f=files[i];if(f.size>15*1024*1024){alert(f.name+' ultrapassa 15 MB.');continue}
  st.textContent='Enviando '+(i+1)+' de '+files.length+'…';
  const slot=nextSlot(),ext=(f.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg',path='banners/'+Date.now()+'-'+i+'-'+Math.random().toString(36).slice(2)+'.'+ext;
  const up=await cloud.storage.from('iasd-images').upload(path,f,{contentType:f.type,cacheControl:'3600',upsert:false});if(up.error){alert('Falha ao enviar '+f.name+': '+up.error.message);used.delete(slot);continue}
  const db=await cloud.from('iasd_site_assets').upsert({slot,image_path:path,updated_at:new Date().toISOString()});if(db.error){alert(db.error.message);continue}
  siteAssets[slot]=path;CE.cfg.order.push(slot)}
 renderCE();render();
}
async function ceLib(){
 let all=[];try{const r=await cloud.rpc('iasd_list_site_images');if(r.error)throw r.error;all=(r.data||[]).map(x=>x.name).filter(Boolean)}catch(e){return alert('Não foi possível abrir a biblioteca: '+(e.message||e))}
 const inUse=new Set(Object.values(siteAssets));const pick=new Set();
 const d=document.createElement('div');d.className='cv-ov';d.id='cl-ov';d.style.zIndex=9994;
 d.innerHTML='<div class="cv-md" style="width:min(760px,100%)"><div class="cv-hd"><b>Escolher da biblioteca</b><button class="cv-b x" onclick="document.getElementById(\'cl-ov\').remove()">✕</button></div><div style="padding:16px 20px;overflow:auto"><div class="cv-grid" style="max-height:none">'+all.filter(p=>!/\.(mp4|webm|mov)$/i.test(p)).map(p=>'<button data-p="'+esc(p)+'"'+(inUse.has(p)?' title="Já está em uso"':'')+'><img loading="lazy" src="'+esc(imageUrl(p))+'" alt=""></button>').join('')+'</div></div><div class="cv-ft"><small id="cl-n">Toque nas imagens para selecionar.</small><button class="cv-b" onclick="document.getElementById(\'cl-ov\').remove()">Cancelar</button><button class="cv-b p" id="cl-ok">Adicionar ao carrossel</button></div></div>';
 document.body.appendChild(d);
 d.querySelector('.cv-grid').onclick=e=>{const b=e.target.closest('button');if(!b)return;const p=b.dataset.p;pick.has(p)?pick.delete(p):pick.add(p);b.classList.toggle('ck',pick.has(p));$('cl-n').textContent=pick.size+' selecionada(s)'};
 $('cl-ok').onclick=async()=>{
  if(!pick.size)return;const used=new Set(Object.keys(siteAssets).filter(s=>s==='home_banner'||/^home_banner_\d+$/.test(s)));let nx=1;
  const nextSlot=()=>{if(!used.has('home_banner')){used.add('home_banner');return 'home_banner'}while(used.has('home_banner_'+nx))nx++;const s='home_banner_'+nx++;used.add(s);return s};
  for(const p of pick){const slot=nextSlot();const db=await cloud.from('iasd_site_assets').upsert({slot,image_path:p,updated_at:new Date().toISOString()});if(db.error){alert(db.error.message);break}siteAssets[slot]=p;CE.cfg.order.push(slot)}
  d.remove();renderCE();render();
 };
}

/* ================= POPUP DO PERFIL ================= */
function roleIcon(r){return({founder:'👑',cofounder:'⭐',admin:'🛡️',sonoplasta:'🎧'})[r]||'🙂'}
function closeMenu(){const r=$('account-popover-root');if(r)r.innerHTML=''}
window.toggleAccountMenu=function(){
 css();const root=$('account-popover-root');if(!root)return;if(root.innerHTML){root.innerHTML='';return}
 let h='<div class="acp-dismiss" onclick="closeAccountMenu()"></div><div class="acp" role="dialog" aria-label="Minha conta">';
 if(typeof cloudUser!=='undefined'&&cloudUser){
  const p=(typeof myProfile!=='undefined'&&myProfile)||{},name=p.full_name||cloudUser.user_metadata?.full_name||cloudUser.email,initial=String(name||'U').trim()[0].toUpperCase();
  let av='',cover='';try{if(p.avatar_path)av='<span class="ph"><img alt="" src="'+esc(profileMediaUrl(p.avatar_path))+'" style="'+profileImageStyle('avatar')+'"></span>';if(p.cover_path)cover=' c" style="background-image:url('+esc(profileMediaUrl(p.cover_path))+')'}catch(e){}
  const manage=typeof canManageSite==='function'&&canManageSite(),role=typeof roleLabel==='function'?roleLabel():'',ed=window.IASDEdit&&IASDEdit.allowed();
  h+='<div class="acp-top'+cover+'"><div class="acp-av">'+(av||esc(initial))+'<i></i></div><div class="acp-nm"><b>'+esc(name)+'</b><small>'+esc(cloudUser.email||'')+'</small><div class="acp-tags"><span>'+roleIcon(cloudRole)+' '+esc(role)+'</span>'+(p.church_position?'<span>⛪ '+esc(p.church_position)+'</span>':'')+'</div></div></div>'+
  '<div class="acp-lst"><button class="bl" onclick="closeAccountMenu();go(\'Perfil\')"><span class="ic">👤</span><span><b>Meu perfil</b><small>Foto, capa e dados do cadastro</small></span><span class="ch">›</span></button>'+
  '<button class="gd" onclick="closeAccountMenu();go(\'Jogo\')"><span class="ic">🏆</span><span><b>Jogos e ranking</b><small>Desafio do dia e pontuação</small></span><span class="ch">›</span></button>'+
  (cloudRole==='founder'?'<button class="pu" onclick="closeAccountMenu();go(\'Fundador\')"><span class="ic">👑</span><span><b>Painel do Fundador</b><small>Usuários, cargos e Central de Dados</small></span><span class="ch">›</span></button>':'')+
  (manage?'<button class="ok" onclick="closeAccountMenu();go(\'Acervo\')"><span class="ic">🗂️</span><span><b>Acervo do Site</b><small>Imagens, vídeos e arquivos</small></span><span class="ch">›</span></button>':'')+
  (ed?'<button class="gd" onclick="closeAccountMenu();IASDEdit.toggle()"><span class="ic">✏️</span><span><b>Modo edição</b><small>Editar textos e imagens do site</small></span><span class="ch">›</span></button>':'')+
  '<div class="acp-sep"></div><button onclick="toggleTheme()"><span class="ic">🌓</span><span><b>Tema claro / escuro</b><small>Alterna a aparência do app</small></span><span class="acp-tg '+(document.documentElement.getAttribute('data-theme')==='dark'?'on':'')+'"></span></button>'+
  '<button class="out" onclick="closeAccountMenu();cloudLogout()"><span class="ic">↪</span><span><b>Sair da conta</b><small>Encerrar sessão neste aparelho</small></span><span></span></button></div><div class="acp-ft">IASD · Caldas do Jorro</div>';
 }else{
  h+='<div class="acp-guest"><div style="font-size:42px">✦</div><h3>Bem-vindo ao IASD APP</h3><p>Navegue livremente ou entre para participar dos jogos, escalas e alertas.</p><button class="p" onclick="closeAccountMenu();openAuthModal()">Entrar na conta</button><button class="s" onclick="closeAccountMenu();openAuthModal(true)">Criar conta</button></div>';
 }
 root.innerHTML=h+'</div>';
 placeAcp();
};
function placeAcp(){
 const pop=document.querySelector('#account-popover-root .acp');if(!pop)return;
 if(innerWidth<=640){pop.style.top='';pop.style.right='';return}
 const trg=[...document.querySelectorAll('[data-act="account"],[onclick*="toggleAccountMenu"]')].find(el=>el.offsetParent!==null&&el.getBoundingClientRect().width>0);
 if(!trg)return;const r=trg.getBoundingClientRect();
 pop.style.top=Math.round(r.bottom+10)+'px';pop.style.right=Math.max(12,Math.round(innerWidth-r.right))+'px';
}
addEventListener('resize',()=>{if(document.querySelector('#account-popover-root .acp'))placeAcp()});

/* ---------- entrega ---------- */
window.editCover=slot=>window.IASDEdit?IASDEdit.open(slot==='home_banner'||slot.startsWith('home_banner_')?'banner':slot==='home_passage'?'passage':'card:'+slot):editCover(slot);window.closeCover=closeCover;window.saveCover=save;window.removeCover=remove;
window.editHomeCarousel=()=>window.IASDEdit?IASDEdit.open('banner'):openCarousel();
window.IASDMedia={img,view,set,focus,reset,choose,upload,save,remove,closeCarousel,ceSet,ceMove,ceToggle,ceFrame,ceSave,ceRemove,ceUpload,ceLib,hcGo,hcTo,frameStyle:fstyle,frameOf};
css();
})();
