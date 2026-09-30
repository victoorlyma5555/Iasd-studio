/* Músicas ambientes — biblioteca, fila de reprodução e playlists (Studio de Projeção).
   Usa as funções antigas do Studio (youtubeList, youtubeEmbed, saveYouTubeList, randomAmbient, projectSelectedYouTube);
   a lista salva continua na mesma chave do navegador ('iasd-youtube-ambient'). */
(function(){
'use strict';
const $=id=>document.getElementById(id);
if(!$('ambient')||typeof youtubeList!=='function')return;
const K={meta:'iasd-ambient-meta',queue:'iasd-ambient-queue',pls:'iasd-ambient-playlists'};
const TAGS=['Instrumentais','Piano','Natureza','Adoração','Clássicas','Calmas'];
const rd=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}};
const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let meta=rd(K.meta,{}),queue=rd(K.queue,[]).filter(x=>/^[\w-]{11}$/.test(x)),pls=rd(K.pls,[]),pane='lib',tag='',q='',sel=null,dragFrom=-1;
const valid=id=>/^[\w-]{11}$/.test(id);
const lib=()=>youtubeList('ambient');
const title=id=>(meta[id]&&meta[id].title)||'Música ambiente';
const tagOf=id=>(meta[id]&&meta[id].tag)||'';
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function icon(n){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','ti');const u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href','#i-'+n);s.append(u);return s}
function thumb(id){const i=el('img','amb-th');i.src='https://i.ytimg.com/vi/'+id+'/mqdefault.jpg';i.alt='';i.loading='lazy';i.onerror=()=>{i.style.visibility='hidden'};return i}
function save(){wr(K.meta,meta);wr(K.queue,queue);wr(K.pls,pls)}
function setLib(ids){$('ambientLinks').value=ids.map(i=>'https://www.youtube.com/watch?v='+i).join('\n');saveYouTubeList('ambient')}
async function fetchTitle(id){if(meta[id]&&meta[id].title)return;try{const r=await fetch('https://noembed.com/embed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+id),{signal:AbortSignal.timeout(6000)});const j=await r.json();if(j&&j.title){meta[id]=Object.assign({},meta[id],{title:j.title});save();renderAll()}}catch(e){}}
function addId(id,t){if(!valid(id)){feedback('Link do YouTube inválido.');return}const ids=lib();if(!ids.includes(id)){ids.push(id);setLib(ids)}if(t){meta[id]=Object.assign({},meta[id],{title:t})}else fetchTitle(id);save();renderAll();feedback('Música adicionada à biblioteca.')}
function removeId(id){setLib(lib().filter(x=>x!==id));queue=queue.filter(x=>x!==id);if(sel===id)clearSel();save();renderAll()}
function setTag(id,t){meta[id]=Object.assign({},meta[id],{tag:t});save();renderAll()}
function play(id){sel=id;selectedYouTube.ambient=id;youtubeEmbed(id,'ambientEmbed');renderSel();feedback('Música selecionada. Toque em Projetar no telão para enviar.')}
function clearSel(){sel=null;selectedYouTube.ambient=null;const h=$('ambientEmbed');if(h)h.replaceChildren();renderSel()}
function toQueue(id){if(!queue.includes(id))queue.push(id);save();renderQueue();feedback('Adicionada à fila de reprodução.')}
/* menu flutuante "…" */
let menu=null;
function closeMenu(){if(menu){menu.remove();menu=null}}
function openMenu(btn,items){closeMenu();menu=el('div','amb-menu');menu.setAttribute('role','menu');items.forEach(it=>{if(it==='-'){menu.append(el('hr'));return}const b=el('button',it.danger?'danger':'',it.label);b.type='button';b.setAttribute('role','menuitem');b.onclick=e=>{e.stopPropagation();closeMenu();it.fn()};menu.append(b)});document.body.append(menu);const r=btn.getBoundingClientRect(),w=menu.offsetWidth,h=menu.offsetHeight;menu.style.left=Math.max(6,Math.min(innerWidth-w-6,r.right-w))+'px';menu.style.top=(r.bottom+h+6>innerHeight?Math.max(6,r.top-h-4):r.bottom+4)+'px'}
document.addEventListener('click',e=>{if(menu&&!menu.contains(e.target))closeMenu()});
addEventListener('scroll',closeMenu,true);addEventListener('resize',closeMenu);
function libMenu(btn,id){const it=[{label:'Tocar agora',fn:()=>play(id)},{label:'Adicionar à fila',fn:()=>toQueue(id)},'-'];TAGS.forEach(t=>it.push({label:(tagOf(id)===t?'✓ ':'')+'Categoria: '+t,fn:()=>setTag(id,tagOf(id)===t?'':t)}));it.push('-',{label:'Remover da biblioteca',danger:true,fn:()=>removeId(id)});openMenu(btn,it)}
function queueMenu(btn,i){const id=queue[i];openMenu(btn,[{label:'Tocar agora',fn:()=>play(id)},{label:'Subir na fila',fn:()=>move(i,i-1)},{label:'Descer na fila',fn:()=>move(i,i+1)},'-',{label:'Remover da fila',danger:true,fn:()=>{queue.splice(i,1);save();renderQueue()}}])}
function move(a,b){if(b<0||b>=queue.length||a===b)return;const [x]=queue.splice(a,1);queue.splice(b,0,x);save();renderQueue()}
/* biblioteca */
function playBtn(id){const b=el('button','amb-play');b.type='button';b.title='Tocar';b.setAttribute('aria-label','Tocar '+title(id));b.append(icon('play'));b.onclick=()=>play(id);return b}
function moreBtn(fn,label){const b=el('button','amb-more');b.type='button';b.title='Mais opções';b.setAttribute('aria-label',label||'Mais opções');b.textContent='•••';b.onclick=e=>{e.stopPropagation();fn(b)};return b}
function renderChips(){const box=$('ambChips');if(!box)return;box.replaceChildren();['',...TAGS].forEach(t=>{const b=el('button',t===tag?'on':'',t||'Todas');b.type='button';b.onclick=()=>{tag=t;renderChips();renderList()};box.append(b)})}
function renderList(){const box=$('ambList');if(!box)return;box.replaceChildren();const ql=q.trim().toLowerCase();
 const ids=lib().filter(id=>(!tag||tagOf(id)===tag)&&(!ql||title(id).toLowerCase().includes(ql)||id.toLowerCase()===ql));
 if(!ids.length){const e=el('div','amb-empty');e.append(el('p','',lib().length?'Nenhuma música encontrada.':'Sua biblioteca está vazia. Adicione uma URL do YouTube ou pesquise na aba YouTube.'));if(!lib().length){const b=el('button','mp-btn','＋ Adicionar pad de referência');b.type='button';b.onclick=()=>{addAmbientExample();renderAll()};e.append(b)}box.append(e);return}
 ids.forEach(id=>{const r=el('div','amb-row'+(sel===id?' is-sel':''));r.append(thumb(id));const i=el('div','amb-info');i.append(el('b','',title(id)),el('small','',tagOf(id)||'Sem categoria'));r.append(i,playBtn(id),moreBtn(b=>libMenu(b,id),'Opções de '+title(id)));box.append(r)})}
function renderSel(){const box=$('ambSel');if(!box)return;box.replaceChildren();
 if(!sel){box.classList.remove('has');const t=el('span','muted','Nenhuma música selecionada.');const a=el('button','mp-btn','🎲 Sortear');a.type='button';a.title='Escolhe sem repetir as anteriores desta rodada';a.onclick=()=>{randomAmbient();if(selectedYouTube.ambient){sel=selectedYouTube.ambient;renderSel();renderList()}};const b=el('button','mp-btn','↻ Reiniciar rodada');b.type='button';b.onclick=resetAmbientRound;box.append(t,a,b);return}
 box.classList.add('has');box.append(thumb(sel));const i=el('div','amb-info');i.append(el('small','','SELECIONADA'),el('b','',title(sel)));const go=el('button','mp-blue','Projetar no telão');go.type='button';go.onclick=()=>projectSelectedYouTube('ambient');const x=el('button','amb-more','✕');x.type='button';x.title='Limpar seleção';x.onclick=clearSel;box.append(i,go,x)}
/* fila */
function renderQueue(){const box=$('ambQueue');if(!box)return;box.replaceChildren();
 const h=el('div','q-head');h.append(icon('queue'),el('h3','','Fila de reprodução'),el('span','q-count',queue.length+(queue.length===1?' item':' itens')),el('span','st-sp'));
 const sh=el('button','mp-btn');sh.type='button';sh.append(icon('shuffle'),document.createTextNode('Embaralhar'));sh.onclick=()=>{for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]]}save();renderQueue()};
 const cl=el('button','mp-btn');cl.type='button';cl.append(icon('trash'),document.createTextNode('Limpar'));cl.onclick=()=>{if(queue.length&&confirm('Limpar a fila de reprodução?')){queue=[];save();renderQueue()}};
 h.append(sh,cl);box.append(h);
 if(!queue.length){box.append(el('p','amb-empty muted','A fila está vazia. Use ••• → Adicionar à fila nas músicas da biblioteca.'));return}
 queue.forEach((id,i)=>{const r=el('div','q-row');r.draggable=true;r.append(el('span','q-drag','⠿'),el('span','q-n',String(i+1)),thumb(id));const inf=el('div','amb-info');inf.append(el('b','',title(id)),el('small','','Música ambiente'+(tagOf(id)?' · '+tagOf(id):'')));r.append(inf,playBtn(id),moreBtn(b=>queueMenu(b,i),'Opções da fila'));const x=el('button','amb-x');x.type='button';x.title='Remover da fila';x.setAttribute('aria-label','Remover da fila');x.append(icon('x'));x.onclick=()=>{queue.splice(i,1);save();renderQueue()};r.append(x);
  r.ondragstart=e=>{dragFrom=i;r.classList.add('drag');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i))}catch(_){}};
  r.ondragend=()=>{dragFrom=-1;r.classList.remove('drag');box.querySelectorAll('.over').forEach(n=>n.classList.remove('over'))};
  r.ondragover=e=>{e.preventDefault();r.classList.add('over')};r.ondragleave=()=>r.classList.remove('over');
  r.ondrop=e=>{e.preventDefault();if(dragFrom>=0)move(dragFrom,i)};
  box.append(r)})}
/* playlists */
function renderPl(){const box=$('ambPlList');if(!box)return;box.replaceChildren();
 if(!pls.length){box.append(el('p','amb-empty muted','Nenhuma playlist salva. Monte a fila e toque em “Salvar como playlist”.'));return}
 pls.forEach((p,i)=>{const r=el('div','amb-row');const th=p.ids&&p.ids[0]?thumb(p.ids[0]):el('span','amb-th');const inf=el('div','amb-info');inf.append(el('b','',p.name),el('small','',(p.ids||[]).length+' músicas'));const ld=el('button','mp-blue','Carregar na fila');ld.type='button';ld.onclick=()=>{(p.ids||[]).forEach(id=>{if(!lib().includes(id))addId(id,p.titles&&p.titles[id]);if(!queue.includes(id))queue.push(id)});save();renderQueue();feedback('Playlist carregada na fila.')};const del=moreBtn(b=>openMenu(b,[{label:'Excluir playlist',danger:true,fn:()=>{pls.splice(i,1);save();renderPl()}}]),'Opções da playlist');r.append(th,inf,ld,del);box.append(r)})}
window.ambSavePlaylist=function(){const ids=queue.length?queue.slice():lib();if(!ids.length){feedback('Adicione músicas antes de salvar uma playlist.');return}const name=(prompt('Nome da playlist:','Playlist '+(pls.length+1))||'').trim().slice(0,40);if(!name)return;const titles={};ids.forEach(id=>{if(meta[id]&&meta[id].title)titles[id]=meta[id].title});pls.push({name,ids,titles});save();renderPl();feedback('Playlist “'+name+'” salva.')};
/* adicionar URL / YouTube */
window.ambToggleUrl=function(){const r=$('ambUrlRow');r.hidden=!r.hidden;if(!r.hidden)$('ambUrl').focus()};
window.ambAddUrl=function(){const v=$('ambUrl').value.trim();const id=youtubeId(v);if(!id){feedback('Cole um link válido do YouTube.');return}addId(id);$('ambUrl').value='';$('ambUrlRow').hidden=true};
window.ambYtSearch=async function(){const qv=$('ambYtQ').value.trim(),st=$('ambYtStatus'),box=$('ambYtRes');if(!qv){st.textContent='Digite o nome de uma música ou artista.';return}st.textContent='Pesquisando no YouTube…';box.replaceChildren();
 try{const res=await fetch('/api/youtube-search?q='+encodeURIComponent(qv));const data=await res.json();if(!res.ok)throw Error(data.error||'Falha na pesquisa');const items=Array.isArray(data.items)?data.items:[];if(!items.length){st.textContent='Nenhum vídeo encontrado.';return}st.textContent=items.length+' resultado(s).';
  items.forEach(it=>{const r=el('div','amb-row');const im=el('img','amb-th');im.src=it.thumbnail||('https://i.ytimg.com/vi/'+it.id+'/mqdefault.jpg');im.alt='';im.loading='lazy';const inf=el('div','amb-info');const t=(typeof decodeYouTubeText==='function')?decodeYouTubeText(it.title):it.title;inf.append(el('b','',t),el('small','',(typeof decodeYouTubeText==='function')?decodeYouTubeText(it.channel):it.channel));const b=el('button','mp-blue','＋ Adicionar');b.type='button';b.onclick=()=>addId(it.id,t);r.append(im,inf,b);box.append(r)})}
 catch(e){st.textContent=e.message==='YOUTUBE_API_KEY_NOT_CONFIGURED'?'A pesquisa precisa da chave da API do YouTube configurada no Vercel.':('Não foi possível pesquisar: '+e.message)}};
function renderAll(){renderChips();renderList();renderSel();renderQueue();renderPl();if(typeof requestStudioHeight==='function')requestStudioHeight()}
document.querySelectorAll('#ambTabs button').forEach(b=>b.onclick=()=>{pane=b.dataset.pane;document.querySelectorAll('#ambTabs button').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-selected',on)});['lib','yt','col','pl'].forEach(p=>{const n=$('ambPane'+p[0].toUpperCase()+p.slice(1));if(n)n.hidden=p!==pane});if(typeof requestStudioHeight==='function')requestStudioHeight()});
$('ambSearch').addEventListener('input',e=>{q=e.target.value;renderList()});
$('ambUrl').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ambAddUrl()}});
$('ambYtQ').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ambYtSearch()}});
lib().forEach(fetchTitle);
renderAll();
})();
