/* Músicas ambientes — biblioteca, fila de reprodução e playlists (Studio de Projeção).
   Usa as funções antigas do Studio (youtubeList, youtubeEmbed, saveYouTubeList, randomAmbient, projectSelectedYouTube);
   a lista salva continua na mesma chave do navegador ('iasd-youtube-ambient'). */
(function(){
'use strict';
const $=id=>document.getElementById(id);
if(!$('ambient')||typeof youtubeList!=='function')return;
const K={meta:'iasd-ambient-meta',queue:'iasd-ambient-queue',pls:'iasd-ambient-playlists'};
const TAGS=['Espontâneo','Pads','Soaking','Hinos','Piano','Instrumentais','Calmas','Adoração','Natureza','Clássicas'];
const rd=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let meta=rd(K.meta,{}),pls=rd(K.pls,[]),pane='lib',tag='',q='',sel=null,dragFrom=-1,plView=null;
const valid=id=>/^[\w-]{11}$/.test(id);
const lib=()=>youtubeList('ambient');
const title=id=>(meta[id]&&meta[id].title)||'Música ambiente';
const tagOf=id=>(meta[id]&&meta[id].tag)||'';
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function icon(n){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','ti');const u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href','#i-'+n);s.append(u);return s}
function thumb(id){const i=el('img','amb-th');i.src='https://i.ytimg.com/vi/'+id+'/mqdefault.jpg';i.alt='';i.loading='lazy';i.onerror=()=>{i.style.visibility='hidden'};return i}
function save(){wr(K.meta,meta);wr(K.pls,pls)}
function setLib(ids){$('ambientLinks').value=ids.map(i=>'https://www.youtube.com/watch?v='+i).join('\n');saveYouTubeList('ambient')}
const inflight=new Set();
async function fetchTitle(id){if((meta[id]&&meta[id].title)||inflight.has(id))return;inflight.add(id);try{const r=await fetch('https://noembed.com/embed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+id),{signal:AbortSignal.timeout(6000)});const j=await r.json();if(j&&j.title){meta[id]=Object.assign({},meta[id],{title:j.title});save();renderAll()}}catch(e){}finally{inflight.delete(id)}}
function addId(id,t){if(!valid(id)){feedback('Link do YouTube inválido.');return}const ids=lib();const had=ids.includes(id);if(!had){ids.push(id);setLib(ids)}if(t){meta[id]=Object.assign({},meta[id],{title:t})}else fetchTitle(id);save();if(window.IASDLib&&!had)IASDLib.cloudAdd('ambient',{id,title:title(id)==='Música ambiente'?'':title(id)});renderAll();feedback(had?'Essa música já está na biblioteca.':'Música salva na biblioteca.')}
function removeId(id){if(window.IASDLib)IASDLib.cloudDel('ambient',id);setLib(lib().filter(x=>x!==id));if(plView)plView=plView.filter(x=>x!==id);if(sel===id)clearSel();save();renderAll()}
function setTag(id,t){meta[id]=Object.assign({},meta[id],{tag:t});save();renderAll()}
function play(id){sel=id;selectedYouTube.ambient=id;youtubeEmbed(id,'ambientEmbed');renderSel();feedback('Música selecionada. Toque em Projetar no telão para enviar.')}
function clearSel(){sel=null;selectedYouTube.ambient=null;const h=$('ambientEmbed');if(h)h.replaceChildren();renderSel()}
/* menu flutuante "…" */
let menu=null;
function closeMenu(){if(menu){menu.remove();menu=null}}
function openMenu(btn,items){closeMenu();menu=el('div','amb-menu');menu.setAttribute('role','menu');items.forEach(it=>{if(it==='-'){menu.append(el('hr'));return}const b=el('button',it.danger?'danger':'',it.label);b.type='button';b.setAttribute('role','menuitem');b.onclick=e=>{e.stopPropagation();closeMenu();it.fn()};menu.append(b)});document.body.append(menu);const r=btn.getBoundingClientRect(),w=menu.offsetWidth,h=menu.offsetHeight;menu.style.left=Math.max(6,Math.min(innerWidth-w-6,r.right-w))+'px';menu.style.top=(r.bottom+h+6>innerHeight?Math.max(6,r.top-h-4):r.bottom+4)+'px'}
document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target))closeMenu()});
addEventListener('scroll',closeMenu,true);addEventListener('resize',closeMenu);
function libMenu(btn,id){const it=[{label:'Tocar agora',fn:()=>play(id)},'-'];TAGS.forEach(t=>it.push({label:(tagOf(id)===t?'✓ ':'')+'Categoria: '+t,fn:()=>setTag(id,tagOf(id)===t?'':t)}));it.push('-',{label:'Remover da biblioteca',danger:true,fn:()=>removeId(id)});openMenu(btn,it)}
/* fila de reprodução: serve somente às Músicas especiais */
const spList=()=>specialList();
function spSave(list){try{localStorage.setItem(specialKey,JSON.stringify(list))}catch(e){}}
function spMove(a,b){const l=spList();if(b<0||b>=l.length||a===b)return;const [x]=l.splice(a,1);l.splice(b,0,x);spSave(l);renderQueue()}
function spTitle(id,i){return(meta[id]&&meta[id].title)||('Vídeo '+(i+1))}
function queueMenu(btn,i){const l=spList(),id=l[i];openMenu(btn,[{label:'Selecionar',fn:()=>selectSpecial(id)},{label:'Subir na fila',fn:()=>spMove(i,i-1)},{label:'Descer na fila',fn:()=>spMove(i,i+1)},'-',{label:'Remover da fila',danger:true,fn:()=>{spSave(spList().filter(x=>x!==id));renderSpecial();renderQueue()}}])}
/* biblioteca */
function playBtn(id){const b=el('button','amb-play');b.type='button';b.title='Tocar';b.setAttribute('aria-label','Tocar '+title(id));b.append(icon('play'));b.onclick=()=>play(id);return b}
function moreBtn(fn,label){const b=el('button','amb-more');b.type='button';b.title='Mais opções';b.setAttribute('aria-label',label||'Mais opções');b.textContent='⋮';b.onclick=e=>{e.stopPropagation();fn(b)};return b}
function renderChips(){const box=$('ambChips');if(!box)return;box.replaceChildren();if(plView){const b=el('button','on','Playlist: '+plName+' ✕');b.type='button';b.title='Voltar a todas as músicas';b.onclick=()=>{plView=null;renderChips();renderList()};box.append(b)}['',...TAGS].forEach(t=>{const b=el('button',t===tag?'on':'',t||'Todas');b.type='button';b.onclick=()=>{tag=t;renderChips();renderList()};box.append(b)})}
function renderList(){const box=$('ambList');if(!box)return;box.replaceChildren();const ql=q.trim().toLowerCase();
 const ids=visibleIds();
 if(!ids.length){const e=el('div','amb-empty');e.append(el('p','',lib().length?'Nenhuma música encontrada.':'Sua biblioteca está vazia. Adicione uma URL do YouTube ou pesquise na aba YouTube.'));if(!lib().length){const b=el('button','mp-btn','＋ Adicionar pad de referência');b.type='button';b.onclick=()=>{addAmbientExample();renderAll()};e.append(b)}box.append(e);return}
 const small=window.matchMedia&&matchMedia('(max-width:1000px)').matches,key=ql+'|'+tag+'|'+(plView?plView.length:'');if(key!==listKey){listKey=key;listMax=10}
 const total=ids.length,view=small?ids.slice(0,listMax):ids;
 view.forEach(id=>{const r=el('div','amb-row'+(sel===id?' is-sel':''));r.append(thumb(id));const i=el('div','amb-info');i.append(el('b','',title(id)),el('small','',tagOf(id)||'Sem categoria'));r.append(i,playBtn(id),moreBtn(b=>libMenu(b,id),'Opções de '+title(id)));box.append(r)});
 if(view.length<total){const m=el('button','mp-btn amb-more','Mostrar mais ('+(total-view.length)+' restantes)');m.type='button';m.onclick=()=>{listMax+=15;renderList();if(typeof requestStudioHeight==='function')requestStudioHeight()};box.append(m)}}
let listKey='',listMax=10;
function renderSel(){const box=$('ambSel');if(!box)return;box.replaceChildren();
 if(!sel){box.classList.remove('has');const t=el('span','muted','Nenhuma música selecionada.');const a=el('button','mp-btn','🎲 Sortear');a.type='button';a.title='Escolhe sem repetir as anteriores desta rodada';a.onclick=()=>{randomAmbient();if(selectedYouTube.ambient){sel=selectedYouTube.ambient;renderSel();renderList()}};const b=el('button','mp-btn','↻ Reiniciar rodada');b.type='button';b.onclick=resetAmbientRound;box.append(t,a,b);return}
 box.classList.add('has');box.append(thumb(sel));const i=el('div','amb-info');i.append(el('small','','SELECIONADA'),el('b','',title(sel)));const go=el('button','mp-blue','Projetar no telão');go.type='button';go.onclick=()=>projectSelectedYouTube('ambient');const x=el('button','amb-more','✕');x.type='button';x.title='Limpar seleção';x.onclick=clearSel;box.append(i,go,x)}
/* fila */
function renderQueue(){if(window.stQueueRender)return window.stQueueRender();const box=$('ambQueue');if(!box)return;box.replaceChildren();const queue=spList();
 queue.forEach(id=>fetchTitle(id));
 const h=el('div','q-head');h.append(icon('queue'),el('h3','','Fila de reprodução · Músicas especiais'),el('span','q-count',queue.length+(queue.length===1?' item':' itens')),el('span','st-sp'));
 const sh=el('button','mp-btn');sh.type='button';sh.append(icon('shuffle'),document.createTextNode('Embaralhar'));sh.onclick=()=>{const l=spList();for(let i=l.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[l[i],l[j]]=[l[j],l[i]]}spSave(l);renderQueue()};
 const cl=el('button','mp-btn');cl.type='button';cl.append(icon('trash'),document.createTextNode('Limpar'));cl.onclick=()=>{if(spList().length&&confirm('Limpar a fila de músicas especiais?')){spSave([]);renderSpecial();renderQueue()}};
 h.append(sh,cl);box.append(h);
 if(!queue.length){const e=el('div','q-empty');e.append(icon('queue'),el('b','','A fila de reprodução está vazia.'),el('small','','Pesquise no YouTube ou cole um link em Músicas especiais para montar a sequência.'));box.append(e);return}
 queue.forEach((id,i)=>{const r=el('div','q-row'+(selectedYouTube.special===id?' is-sel':''));r.draggable=true;
  const pb=el('button','amb-play');pb.type='button';pb.title='Selecionar';pb.setAttribute('aria-label','Selecionar '+spTitle(id,i));pb.append(icon('play'));pb.onclick=()=>{selectSpecial(id);renderQueue()};
  r.append(el('span','q-drag','⠿'),el('span','q-n',String(i+1)),thumb(id));const inf=el('div','amb-info');inf.append(el('b','',spTitle(id,i)),el('small','','Música especial'));r.append(inf,pb,moreBtn(b=>queueMenu(b,i),'Opções da fila'));
  const x=el('button','amb-x');x.type='button';x.title='Remover da fila';x.setAttribute('aria-label','Remover da fila');x.append(icon('x'));x.onclick=()=>{spSave(spList().filter(v=>v!==id));renderSpecial();renderQueue()};r.append(x);
  r.ondragstart=e=>{dragFrom=i;r.classList.add('drag');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i))}catch(_){}};
  r.ondragend=()=>{dragFrom=-1;r.classList.remove('drag');box.querySelectorAll('.over').forEach(n=>n.classList.remove('over'))};
  r.ondragover=e=>{e.preventDefault();r.classList.add('over')};r.ondragleave=()=>r.classList.remove('over');
  r.ondrop=e=>{e.preventDefault();if(dragFrom>=0)spMove(dragFrom,i)};
  box.append(r)})}
/* playlists */
function renderPl(){const box=$('ambPlList');if(!box)return;box.replaceChildren();
 if(!pls.length){box.append(el('p','amb-empty muted','Nenhuma playlist salva. Filtre a biblioteca (categoria ou busca) e toque em “Salvar como playlist”.'));return}
 pls.forEach((p,i)=>{const r=el('div','amb-row');const th=p.ids&&p.ids[0]?thumb(p.ids[0]):el('span','amb-th');const inf=el('div','amb-info');inf.append(el('b','',p.name),el('small','',(p.ids||[]).length+' músicas'));const ld=el('button','mp-blue','Abrir');ld.type='button';ld.onclick=()=>{const ids=lib();(p.ids||[]).forEach(id=>{if(!ids.includes(id)){ids.push(id);if(p.titles&&p.titles[id])meta[id]=Object.assign({},meta[id],{title:p.titles[id]})}});setLib(ids);plView=(p.ids||[]).slice();plName=p.name;tag='';q='';$('ambSearch').value='';save();const t=document.querySelector('#ambTabs button[data-pane="lib"]');if(t)t.click();renderAll()};const del=moreBtn(b=>openMenu(b,[{label:'Excluir playlist',danger:true,fn:()=>{pls.splice(i,1);save();renderPl()}}]),'Opções da playlist');r.append(th,inf,ld,del);box.append(r)})}
let plName='';
function visibleIds(){const ql=q.trim().toLowerCase();return(plView?lib().filter(id=>plView.includes(id)):lib()).filter(id=>(!tag||tagOf(id)===tag)&&(!ql||title(id).toLowerCase().includes(ql)||id.toLowerCase()===ql))}
window.ambSavePlaylist=function(){const ids=visibleIds();if(!ids.length){feedback('Nenhuma música na lista para salvar.');return}const name=(prompt('Nome da playlist ('+ids.length+' músicas da lista atual):','Playlist '+(pls.length+1))||'').trim().slice(0,40);if(!name)return;const titles={};ids.forEach(id=>{if(meta[id]&&meta[id].title)titles[id]=meta[id].title});pls.push({name,ids,titles});save();renderPl();feedback('Playlist “'+name+'” salva.')};
/* adicionar URL / YouTube */
window.ambToggleUrl=function(){const r=$('ambUrlRow');r.hidden=!r.hidden;if(!r.hidden)$('ambUrl').focus()};
window.ambAddUrl=function(){const v=$('ambUrl').value.trim();const id=youtubeId(v);if(!id){feedback('Cole um link válido do YouTube.');return}addId(id);$('ambUrl').value='';$('ambUrlRow').hidden=true};
window.ambYtSearch=async function(){const qv=$('ambYtQ').value.trim(),st=$('ambYtStatus'),box=$('ambYtRes');if(!qv){st.textContent='Digite o nome de uma música ou artista.';return}st.textContent='Pesquisando no YouTube…';box.replaceChildren();
 try{const items=await IASDYouTube.search(qv,{music:true});if(!items.length){st.textContent='Nenhum vídeo encontrado.';return}st.textContent=items.length+' resultado(s). Toque em ▶ para ouvir e em Salvar para guardar na biblioteca.';ytItems=items;renderYtRes()}
 catch(e){st.textContent=e.message}};
let ytItems=[];
function renderYtRes(){const box=$('ambYtRes');if(!box)return;box.replaceChildren();
 ytItems.forEach(it=>{const saved=lib().includes(it.id);const r=el('div','amb-row'+(sel===it.id?' is-sel':''));const im=el('img','amb-th');im.src=it.thumb||('https://i.ytimg.com/vi/'+it.id+'/mqdefault.jpg');im.alt='';im.loading='lazy';
  const inf=el('div','amb-info');const dur=it.duration?(Math.floor(it.duration/3600)?Math.floor(it.duration/3600)+':'+String(Math.floor(it.duration%3600/60)).padStart(2,'0'):Math.floor(it.duration/60))+':'+String(it.duration%60).padStart(2,'0'):'';inf.append(el('b','',it.title),el('small','',[it.channel,dur].filter(Boolean).join(' · ')));
  const acts=el('div','vr-acts');const pl=el('button','amb-play');pl.type='button';pl.title='Ouvir / selecionar';pl.setAttribute('aria-label','Ouvir '+it.title);pl.append(icon('play'));pl.onclick=()=>{meta[it.id]=Object.assign({},meta[it.id],{title:it.title});save();sel=it.id;selectedYouTube.ambient=it.id;youtubeEmbed(it.id,'ambientEmbed');renderSel();renderYtRes();feedback('Música selecionada. Toque em Projetar no telão para enviar.')};
  const sv=el('button',saved?'mp-btn is-on':'mp-btn');sv.type='button';sv.append(icon(saved?'starf':'star'),document.createTextNode(saved?'Na biblioteca':'Salvar na biblioteca'));sv.title=saved?'Já está na biblioteca':'Guardar na biblioteca de músicas ambientes';sv.onclick=()=>{if(!saved){addId(it.id,it.title);renderYtRes()}};
  acts.append(pl,sv);r.append(im,inf,acts);box.append(r)})}
function renderAll(){renderChips();renderList();renderSel();renderQueue();renderPl();if(typeof requestStudioHeight==='function')requestStudioHeight()}
document.querySelectorAll('#ambTabs button').forEach(b=>b.onclick=()=>{pane=b.dataset.pane;document.querySelectorAll('#ambTabs button').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-selected',on)});['lib','yt','col','pl'].forEach(p=>{const n=$('ambPane'+p[0].toUpperCase()+p.slice(1));if(n)n.hidden=p!==pane});if(typeof requestStudioHeight==='function')requestStudioHeight()});
$('ambSearch').addEventListener('input',e=>{q=e.target.value;renderList()});
$('ambUrl').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ambAddUrl()}});
$('ambYtQ').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ambYtSearch()}});

/* Pacote inicial (base: Spontaneous Instrumental Worship / Fundo Musical Espontâneo, pads e hinos em piano).
   Entra uma única vez por navegador; depois você pode remover o que não quiser. */
const PACK_V=1;
const PACK=[
['cDffo1ae83o','Messiah · Spontaneous Instrumental Worship #17','Espontâneo'],
['-wLOTibOCI0','Spontaneous Instrumental Worship #3','Espontâneo'],
['JpaCTstFOJM','Siga-me · Spontaneous Instrumental Worship #16','Espontâneo'],
['hyrUakB99eI','Worthy · Spontaneous Instrumental Worship','Espontâneo'],
['GzWyEd4V-LQ','Spontaneous Instrumental Worship #6','Espontâneo'],
['RWALFu4d9eM','Spontaneous Instrumental Worship #6 · Pad + Piano','Espontâneo'],
['r1YEOCTmZ_s','Spontaneous Instrumental Worship #12','Espontâneo'],
['Wgvlqi7-8f4','Spontaneous Instrumental Worship #20','Espontâneo'],
['lGP-NZSJ23I','Spontaneous Instrumental Worship 20','Espontâneo'],
['M0p0OtEuGs8','Spontaneous Instrumental Worship #22','Espontâneo'],
['AdG_ElWG2RI','Fundo Musical para Oração · Spontaneous Instrumental Worship','Espontâneo'],
['rucCJ4a-5i8','Time · Spontaneous Instrumental Worship','Espontâneo'],
['pAzwkKAvkvM','Yeshua · Espontâneo','Espontâneo'],
['u6CqVggVSjg','É Ele · Fundo Musical Espontâneo','Espontâneo'],
['5rhrTONaaMU','Fundo Musical Espontâneo','Espontâneo'],
['IDNGkV7L0H0','Fundo Musical Espontâneo (2)','Espontâneo'],
['gNWrSmskJp0','Fundo Musical Espontâneo Profético','Espontâneo'],
['SJgJ2iqeGxM','Living Hope · Espontâneo','Espontâneo'],
['OCQ4IlZHvQw','Worthy · Espontâneo','Espontâneo'],
['ITcJ9CZqY4Q','Prophetic Worship','Espontâneo'],
['uEAN_E9e0Eg','Fundo Musical Oração','Adoração'],
['blAb9LAVRNs','Fundo Musical para Oração','Adoração'],
['Ol62DLl7LnM','Fundo Musical para Oração (2)','Adoração'],
['S--ZOX0WkeE','Fundo Musical para Orar e Adorar','Adoração'],
['MQoBE7lti0Q','Fundo Musical para Oração e Pregação','Adoração'],
['NBTZBwU6Ak0','Fundo Musical','Calmas'],
['J6PqoNryfa0','Fundo Musical Suave · Piano #1','Piano'],
['9LStUfVsKqA','Yeshua · Louvor Instrumental para oração e meditação','Adoração'],
['soVmLB8yNMw','Surrendering All · Ambient Soaking Worship + Pads','Pads'],
['aCWWzlq07Y0','1 hora · Instrumental Worship Pads','Pads'],
['WqIRSAr7XSg','Encounter God’s Glory · 1 hora de Soaking Worship + Pads','Pads'],
['M1FZMIXzZy0','Peaceful Ambient Pads · 1 hora de pads espontâneos','Pads'],
['JxhoKHDWfwU','1 hora · Pad em Mi bemol (Eb) · Ambient Shimmer Pads','Pads'],
['u8fx6Vz4fiM','Pad em Láb maior e Fá menor · 1 hora de pad para louvor','Pads'],
['ZHz2Z21Ym2A','Pad G','Pads'],
['cQPlHyxqDIQ','Preaching Background Music','Pads'],
['KIso00MAg6A','Spontaneous Soaking Worship','Soaking'],
['9wiTpkVYBe8','Holy Calm · Quiet Worship','Calmas'],
['ged4PqO2FAU','Soaking Worship Music · Peace','Soaking'],
['lrvAvy3vERc','Soaking Worship Instrumental','Soaking'],
['Vu9dpknLtjI','Soothing Worship Instrumental · oração, devoção e leitura da Bíblia','Calmas'],
['Bj4l6jqTYpI','Lead Me Holy Spirit · 3 horas de Soaking Worship','Soaking'],
['D-yLwzbWla4','Soaking Worship Instrumentals','Soaking'],
['JKuoGICeepI','God Bless You · Soaking Worship Instrumental','Soaking'],
['4-BD-2IyKv0','In His Presence · Worship Soaking Instrumental','Soaking'],
['Yq9EUB-TDlA','Worship Piano · Soaking Music para oração','Piano'],
['Uo1hvNUsdjM','1 hora de piano para oração · Spirit of God Fall on Me','Piano'],
['zAudP6Uizzk','1 hora de Himnos Adventistas en piano','Hinos'],
['kvFGl6twLo0','Himnos Adventistas en piano','Hinos'],
['mIvDrdTtz_0','1 hora de Himnos Adventistas en piano (2)','Hinos'],
['4OCF_t9lo14','Música Adventista instrumental para orar','Hinos'],
['r3PHbSkfyR4','Himnos Adventistas en piano · 3 horas','Hinos'],
['a6SYfJ6B64U','Himnario Adventista en piano','Hinos'],
['ll1hIN1maIw','Instrumental adventista','Hinos'],
['B7aBBes9GR8','Himnos Adventistas instrumentales · piano y violín','Hinos'],
['-7Q3k1cnJxY','6 horas · Louvores e hinos com chuva · piano instrumental','Natureza'],
['-3G_fe034fY','2 horas · Louvores e hinos gospel','Instrumentais']
];
(function seed(){
 if(rd('iasd-ambient-pack',0)>=PACK_V)return;
 const ids=lib();
 PACK.forEach(([id,t,g])=>{if(valid(id)&&!ids.includes(id))ids.push(id);meta[id]=Object.assign({title:t,tag:g},meta[id]||{})});
 $('ambientLinks').value=ids.map(i=>'https://www.youtube.com/watch?v='+i).join('\n');
 try{localStorage.setItem('iasd-youtube-ambient',ids.join('\n'))}catch(e){}
 wr('iasd-ambient-pack',PACK_V);wr(K.meta,meta);
})();
lib().forEach(fetchTitle);
renderAll();
if(window.IASDLib){IASDLib.cloudLoad('ambient').then(rows=>{if(!rows)return;const ids=lib();let ch=false;rows.forEach(r=>{if(!ids.includes(r.id)){ids.push(r.id);if(r.title)meta[r.id]=Object.assign({},meta[r.id],{title:r.title});ch=true}});if(ch){setLib(ids);save();renderAll()}ids.forEach(id=>{if(!rows.some(r=>r.id===id))IASDLib.cloudAdd('ambient',{id,title:(meta[id]&&meta[id].title)||''})})})}
if(typeof renderSpecial==='function'){const _rs=window.renderSpecial;window.renderSpecial=function(){_rs.apply(this,arguments);renderQueue()}}
})();
