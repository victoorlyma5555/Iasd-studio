const bibleBooks=[["Gênesis","genesis"],["Êxodo","exodus"],["Levítico","leviticus"],["Números","numbers"],["Deuteronômio","deuteronomy"],["Josué","joshua"],["Juízes","judges"],["Rute","ruth"],["1 Samuel","1 samuel"],["2 Samuel","2 samuel"],["1 Reis","1 kings"],["2 Reis","2 kings"],["1 Crônicas","1 chronicles"],["2 Crônicas","2 chronicles"],["Esdras","ezra"],["Neemias","nehemiah"],["Ester","esther"],["Jó","job"],["Salmos","psalms"],["Provérbios","proverbs"],["Eclesiastes","ecclesiastes"],["Cânticos","song of solomon"],["Isaías","isaiah"],["Jeremias","jeremiah"],["Lamentações","lamentations"],["Ezequiel","ezekiel"],["Daniel","daniel"],["Oseias","hosea"],["Joel","joel"],["Amós","amos"],["Obadias","obadiah"],["Jonas","jonah"],["Miqueias","micah"],["Naum","nahum"],["Habacuque","habakkuk"],["Sofonias","zephaniah"],["Ageu","haggai"],["Zacarias","zechariah"],["Malaquias","malachi"],["Mateus","matthew"],["Marcos","mark"],["Lucas","luke"],["João","john"],["Atos","acts"],["Romanos","romans"],["1 Coríntios","1 corinthians"],["2 Coríntios","2 corinthians"],["Gálatas","galatians"],["Efésios","ephesians"],["Filipenses","philippians"],["Colossenses","colossians"],["1 Tessalonicenses","1 thessalonians"],["2 Tessalonicenses","2 thessalonians"],["1 Timóteo","1 timothy"],["2 Timóteo","2 timothy"],["Tito","titus"],["Filemom","philemon"],["Hebreus","hebrews"],["Tiago","james"],["1 Pedro","1 peter"],["2 Pedro","2 peter"],["1 João","1 john"],["2 João","2 john"],["3 João","3 john"],["Judas","jude"],["Apocalipse","revelation"]];let originalBibleResult
let selectedTool='',nextContent='',bibleResult=null,lastDraw=null,rolling=false,muted=false,volume=.75;const urls=new Map();const $=id=>document.getElementById(id);
function call(name,...args){try{const p=window.parent;if(p===window||typeof p[name]!=='function')throw Error('Abra o Studio pela aba Projeção do IASD APP.');return p[name](...args)}catch(e){feedback(e.message);return null}}
function feedback(s){$('feedback').textContent=s}
function toggleTestimonyDrawer(mode){const d=$('testimonyDrawer');const open=mode&&(!d.classList.contains('open')||d.dataset.mode!==mode);d.classList.toggle('open',!!open);d.dataset.mode=open?mode:'';$('testimonyManage').classList.toggle('hide',mode!=='manage'||!open);$('testimonyImport').classList.toggle('hide',mode!=='import'||!open);$('testimonyDrawerTitle').textContent=mode==='import'?'Importar vídeo do computador':'Gerenciar vídeos adicionais';requestStudioHeight()}
async function closeTestimonyProjection(){
 const player=$('testimonyPlayer');if(player)try{player.pause()}catch(e){}
 let stage='';try{stage=localStorage.getItem('iasd-stage')||''}catch(e){}
 try{await window.parent.closePreparedYoutube?.()}catch(e){feedback('Não foi possível fechar o vídeo no IASD Projetor: '+(e.message||e));return}
 if(stage.startsWith('IASD_LOCAL_MEDIA:'))call('stopProjection');
 $('testimonyEmbed').replaceChildren();$('testimonyPrivate')?.classList.add('hide');selectedYouTube.testimony=null;
 $('testimonyChosen').textContent='Vídeo fechado. Escolha outro quando desejar.';feedback('Vídeo fechado: o player e o áudio foram encerrados no Projetor.')}

window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===window.parent&&e.data?.type==='iasd-studio-error')feedback(e.data.message)});
function closeScreen(){call('stopProjection');$('testimonyEmbed')?.replaceChildren();try{localStorage.setItem('iasd-black','0')}catch(e){}mirrorProjection('');stRenderNow();feedback('Telão fechado: janela de projeção e vídeos encerrados.')}
function blackScreen(){project('');feedback('Tela preta: a projeção continua aberta; vídeo do telão pausado e sem áudio.')}
const specialKey='iasd-special-videos';let specialPos=-1;
function specialList(){try{const x=JSON.parse(localStorage.getItem(specialKey)||'[]');return Array.isArray(x)?x.filter(id=>/^[\w-]{11}$/.test(id)):[]}catch{return []}}
function addSpecial(){const id=youtubeId($('specialUrl').value);if(!id){feedback('Insira um link válido do YouTube.');return}addSpecialId(id);$('specialUrl').value=''}
function addSpecialId(id){if(!/^[\\w-]{11}$/.test(id)){feedback('Vídeo do YouTube inválido.');return}const a=specialList();if(!a.includes(id))a.push(id);localStorage.setItem(specialKey,JSON.stringify(a));renderSpecial();selectSpecial(id);feedback('Vídeo adicionado à fila de músicas especiais.')}
function decodeYouTubeText(value){const t=document.createElement('textarea');t.innerHTML=value||'';return t.value}
async function searchSpecialYouTube(){const input=$('specialSearch'),status=$('specialSearchStatus'),results=$('specialSearchResults');const q=input?.value.trim();if(!q){status.textContent='Digite o nome de uma música ou artista.';input?.focus();return}status.textContent='Pesquisando no YouTube…';results.replaceChildren();try{const res=await fetch('/api/youtube-search?q='+encodeURIComponent(q));const data=await res.json();if(!res.ok)throw Error(data.error||'Falha na pesquisa');const items=Array.isArray(data.items)?data.items:[];if(!items.length){status.textContent='Nenhum vídeo encontrado.';return}status.textContent=items.length+' resultado(s). Toque em Adicionar à fila.';for(const item of items){const card=document.createElement('div');card.className='youtube-search-card';const img=document.createElement('img');img.src=item.thumbnail||('https://i.ytimg.com/vi/'+item.id+'/hqdefault.jpg');img.alt='Miniatura de '+decodeYouTubeText(item.title);img.loading='lazy';const info=document.createElement('div');info.className='yt-info';const title=document.createElement('strong');title.textContent=decodeYouTubeText(item.title);const channel=document.createElement('small');channel.textContent=decodeYouTubeText(item.channel);info.append(title,channel);const add=document.createElement('button');add.className='primary yt-add';add.textContent='＋ Adicionar à fila';add.onclick=()=>addSpecialId(item.id);card.append(img,info,add);results.append(card)}requestStudioHeight()}catch(e){status.textContent=e.message==='YOUTUBE_API_KEY_NOT_CONFIGURED'?'A pesquisa precisa da chave da API do YouTube configurada no Vercel.':('Não foi possível pesquisar: '+e.message)}}
function renderSpecial(){const el=$('specialQueue');if(!el)return;el.replaceChildren();specialList().forEach((id,i)=>{const b=document.createElement('button');b.textContent='▶ Vídeo '+(i+1);b.onclick=()=>selectSpecial(id);const d=document.createElement('button');d.textContent='✕';d.title='Remover';d.onclick=()=>{localStorage.setItem(specialKey,JSON.stringify(specialList().filter(x=>x!==id)));renderSpecial()};el.append(b,d)})}
function selectSpecial(id){specialPos=specialList().indexOf(id);selectedYouTube.special=id;$('specialSelected').textContent='Vídeo '+(specialPos+1)+' selecionado';youtubeEmbed(id,'specialEmbed');hideGallery()}
function nextSpecial(){const a=specialList();if(!a.length){feedback('A fila está vazia.');return}selectSpecial(a[(specialPos+1)%a.length])}
function showGallery(){const el=$('galleryGrid');el.replaceChildren();specialList().forEach((id,i)=>{const b=document.createElement('button'),img=document.createElement('img'),label=document.createElement('span');img.src='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';img.loading='lazy';img.alt='Miniatura';label.textContent='Vídeo '+(i+1);b.append(img,label);b.onclick=()=>selectSpecial(id);el.append(b)});if(!el.children.length)el.textContent='Nenhum vídeo na fila.';$('specialGallery').classList.remove('hide')}
function hideGallery(){$('specialGallery').classList.add('hide')}
function offeringDB(){return new Promise((ok,fail)=>{const q=indexedDB.open('iasd-offerings',1);q.onupgradeneeded=()=>q.result.createObjectStore('files',{keyPath:'id'});q.onsuccess=()=>ok(q.result);q.onerror=()=>fail(q.error)})}

function offeringCloud(){const c=window.parent?.iasdCloud;if(!c)throw Error('Conexão com o site indisponível. Abra o Studio pelo IASD APP.');return c}
const OFFER_BUCKET='iasd-offering-videos';
async function uploadOfferingFile(file){const cloud=offeringCloud();const user=window.parent.iasdCurrentUser?.();if(!user)throw Error('Entre na conta de sonoplastia antes de enviar vídeos.');if(file.size>100*1024*1024)throw Error('O limite por vídeo é 100 MB. Comprima o arquivo antes de enviar.');if(!['video/mp4','video/webm','video/quicktime','video/x-m4v','video/ogg'].includes(file.type))throw Error('Formato não permitido. Use MP4, WebM ou MOV.');const path=user.id+'/'+crypto.randomUUID()+'.'+(file.name.split('.').pop()||'mp4').toLowerCase();const {error:uploadError}=await cloud.storage.from(OFFER_BUCKET).upload(path,file,{contentType:file.type,upsert:false});if(uploadError)throw uploadError;const {error:rowError}=await cloud.from('iasd_offering_videos').insert({title:file.name,storage_path:path,uploaded_by:user.id});if(rowError){await cloud.storage.from(OFFER_BUCKET).remove([path]);throw rowError}}
async function saveOffering(){const file=$('serviceVideo')._iasdFile;if(!file){feedback('Importe um vídeo primeiro.');return}const b=document.querySelector('#video button[onclick="saveOffering()"]');if(b)b.disabled=true;feedback('Enviando vídeo para a biblioteca compartilhada do site…');try{await uploadOfferingFile(file);feedback('Vídeo salvo no site! Ele aparecerá em outros navegadores para os sonoplastas autorizados.');await renderOfferings()}catch(e){feedback('Não foi possível salvar no site: '+e.message)}finally{if(b)b.disabled=false}}
async function chooseOffering(item){const cloud=offeringCloud();const {data}=cloud.storage.from(OFFER_BUCKET).getPublicUrl(item.storage_path);const url=data.publicUrl;const v=$('serviceVideo');v.src=url;v._iasdFile=null;v._iasdRemote=item;feedback('Vídeo selecionado: '+item.title+'. Pronto para projetar.')}
async function projectOfferingVideo(){const v=$('serviceVideo');if(v._iasdRemote){try{const cloud=offeringCloud();const {data}=cloud.storage.from(OFFER_BUCKET).getPublicUrl(v._iasdRemote.storage_path);const url=data?.publicUrl;if(!url)throw Error('URL indisponível');const payload='IASD_LOCAL_MEDIA:'+JSON.stringify({kind:'video',url,name:v._iasdRemote.title,volume:muted?0:volume});project(payload);feedback('Vídeo do site enviado ao projetor, sem download nem reenvio local.')}catch(e){feedback('Falha ao projetar vídeo salvo: '+e.message)}return}if(v._iasdFile)return projectLocalMedia('serviceVideo','video');feedback('Selecione um vídeo antes de projetar.')}
async function renderOfferings(){const el=$('offeringLibrary');if(!el)return;el.textContent='Carregando vídeos do site…';try{const cloud=offeringCloud();const {data, error}=await cloud.from('iasd_offering_videos').select('id,title,storage_path,created_at').order('created_at',{ascending:false});if(error)throw error;el.replaceChildren();if(!data?.length){el.textContent='Nenhum vídeo salvo no site ainda.';return}for(const item of data){const b=document.createElement('button');b.textContent='▶ '+item.title;b.onclick=()=>chooseOffering(item);const d=document.createElement('button');d.textContent='✕';d.title='Excluir do site';d.onclick=async()=>{if(!(await IASDDialog.confirm('Excluir '+item.title+' da biblioteca compartilhada?')))return;try{const {error}=await cloud.from('iasd_offering_videos').delete().eq('id',item.id);if(error)throw error;const {error:storageError}=await cloud.storage.from(OFFER_BUCKET).remove([item.storage_path]);if(storageError)feedback('Registro removido, mas o arquivo precisa de limpeza: '+storageError.message);else feedback('Vídeo excluído do site.');renderOfferings()}catch(e){feedback('Erro ao excluir: '+e.message)}};el.append(b,d)}}catch(e){el.textContent='Não foi possível carregar vídeos compartilhados: '+e.message}}
async function migrateLocalOfferings(){try{const db=await offeringDB();const files=await new Promise((ok,fail)=>{const q=db.transaction('files').objectStore('files').getAll();q.onsuccess=()=>ok(q.result);q.onerror=()=>fail(q.error)});db.close();if(!files.length){feedback('Não há vídeos antigos salvos neste navegador.');return}if(!(await IASDDialog.confirm('Enviar '+files.length+' vídeo(s) antigos deste navegador para a biblioteca compartilhada?')))return;let ok=0;for(const item of files){try{await uploadOfferingFile(item.file);ok++}catch(e){feedback('Migração interrompida em '+item.name+': '+e.message);break}}feedback(ok+' de '+files.length+' vídeos enviados ao site.');renderOfferings()}catch(e){feedback('Não foi possível importar vídeos antigos: '+e.message)}}
function requestStudioHeight(){try{window.parent.postMessage({type:'iasd-studio-height',height:Math.ceil(document.querySelector('main').getBoundingClientRect().bottom + window.scrollY + 8)},location.origin)}catch(e){}}


let tmTheme='noturno';try{tmTheme=localStorage.getItem('iasd-timer-theme')||'noturno'}catch(e){}
let tmQr=false;try{tmQr=localStorage.getItem('iasd-timer-qr')==='1'}catch(e){}
const TM={total:3600,remaining:3600,state:'idle',endsAt:0,warn:300,alert:60};
function tmLeft(){return TM.state==='running'?Math.max(0,(TM.endsAt-Date.now())/1000):TM.remaining}
function tmPayload(){return{title:($('tmTitle').value.trim()||'Escola Sabatina'),subtitle:'Caldas do Jorro',total:TM.total,state:TM.state,remaining:TM.remaining,endsAt:TM.endsAt,warn:TM.warn,alert:TM.alert,theme:tmTheme,qr:tmQr}}
function tmQrToggle(){tmQr=!tmQr;try{localStorage.setItem('iasd-timer-qr',tmQr?'1':'0')}catch(e){}tmSync();tmRender()}
function tmOnScreen(){return(localStorage.getItem('iasd-stage')||'').startsWith('IASD_TIMER:')}
function tmSend(){project('IASD_TIMER:'+JSON.stringify(tmPayload()))}
function tmSync(){if(tmOnScreen())tmSend()}
let thView=null;function thMount(){const box=$('thPrev');if(!box||!window.IASDTimerDisplay)return;if(thView)thView.stop();thView=IASDTimerDisplay.mount(box,{title:'Escola Sabatina',subtitle:'Caldas do Jorro',total:3600,state:'running',remaining:2100,endsAt:Date.now()+2100000,beep:false,theme:tmTheme})}
function tmPickTheme(id){tmTheme=id;thMount();try{localStorage.setItem('iasd-timer-theme',id)}catch(e){}tmSync();tmRender();stRethemeLive()}
function stRethemeLive(){const st=localStorage.getItem('iasd-stage')||'';if(st.startsWith('IASD_BIBLE:')||st.startsWith('IASD_DRAW_READY:')||st.startsWith('IASD_DRAW:')){const base=st.startsWith('IASD_DRAW:')?'IASD_DRAW:'+st.slice(10).split('|')[0]:st;project(base)}}
function tmShow(){tmSend()}
function tmSetTotal(sec,fromPreset){sec=Math.max(1,Math.min(36000,Math.round(sec)));TM.total=sec;TM.remaining=sec;TM.state='idle';TM.endsAt=0;$('tmMin').value=Math.floor(sec/60);$('tmSec').value=sec%60;tmSync();tmRender()}
function tmFromInputs(){tmSetTotal((+$('tmMin').value||0)*60+(+$('tmSec').value||0)||60)}
function tmToggle(){if(TM.state==='running'){TM.remaining=tmLeft();TM.state='paused';tmSync();tmRender();return}if(TM.remaining<=0)TM.remaining=TM.total;TM.endsAt=Date.now()+TM.remaining*1000;TM.state='running';tmSend();tmRender()}
function tmReset(){TM.state='idle';TM.remaining=TM.total;TM.endsAt=0;tmSync();tmRender()}
function tmAdjust(delta){const left=tmLeft(),next=Math.max(1,Math.min(36000,left+delta));if(TM.state==='running')TM.endsAt=Date.now()+next*1000;else{TM.remaining=next;if(TM.state==='idle')TM.total=next}TM.total=Math.max(TM.total,Math.ceil(next));tmSync();tmRender()}
let tmPrev=null;
function tmRender(){
 const rem=tmLeft(),done=TM.state!=='idle'&&rem<=0;
 if(TM.state==='running'&&done&&tmPrev!==null&&tmPrev>0&&!tmOnScreen()&&window.IASDTimerDisplay?.beep)IASDTimerDisplay.beep();
 tmPrev=rem;
 $('tmTime').textContent=window.IASDTimerDisplay?IASDTimerDisplay.format(rem):String(Math.ceil(rem));
 const box=$('tmRead');box.classList.toggle('alert',TM.state!=='idle'&&rem<=TM.alert);box.classList.toggle('warn',TM.state!=='idle'&&rem>TM.alert&&rem<=TM.warn);
 $('tmState').textContent=TM.state==='idle'?'Pronto':done?'Tempo encerrado':TM.state==='paused'?'Pausado':'Em andamento';
 {const qb=$('tmQr');if(qb){qb.classList.toggle('on',tmQr);qb.textContent=tmQr?'▦ QR da lição: ligado':'▦ QR da lição: desligado'}}
 $('tmGo').textContent=TM.state==='running'&&!done?'❚❚ Pausar':TM.state==='paused'&&!done?'▶ Continuar':'▶ Iniciar e projetar';
 document.querySelectorAll('#tmThemes button,#stThemes button').forEach(b=>b.classList.toggle('on',b.dataset.t===tmTheme));document.querySelectorAll('#tmPresets button').forEach(b=>b.classList.toggle('on',TM.state==='idle'&&+b.dataset.s===TM.total))}
(function(){const box=$('tmPresets');if(!box)return;[[60,'Escola Sabatina 1 h'],[50,'50 min'],[40,'40 min'],[30,'30 min'],[15,'15 min'],[10,'10 min'],[5,'5 min'],[1,'1 min']].forEach(([m,l])=>{const b=document.createElement('button');b.type='button';b.textContent=l;b.dataset.s=m*60;b.onclick=()=>tmSetTotal(m*60);box.append(b)});['tmThemes','stThemes'].forEach(id=>{const th=$(id);if(!th||!window.IASDTimerDisplay)return;Object.entries(IASDTimerDisplay.themes).forEach(([k,t])=>{const b=document.createElement('button');b.type='button';b.dataset.t=k;b.title=t.name;b.innerHTML='<i style="background:'+t.bg+'"><u style="border-color:'+t.c1+'"></u></i><span></span>';b.lastChild.textContent=t.name;b.onclick=()=>tmPickTheme(k);th.append(b)})});$('tmMin').onchange=$('tmSec').onchange=tmFromInputs;$('tmWarn').onchange=()=>{TM.warn=Math.max(0,Math.round((+$('tmWarn').value||0)*60));tmSync();tmRender()};$('tmAlertS').onchange=()=>{TM.alert=Math.max(0,Math.round(+$('tmAlertS').value||0));tmSync();tmRender()};$('tmTitle').onchange=tmSync;setInterval(tmRender,250);tmRender();thMount()})();

function stEsc(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML}
async function stRenderAlerts(){const box=$('stAlerts');if(!box)return;const P=window.parent;
 if(P===window||typeof P.loadSoundAlertRows!=='function'){box.innerHTML='<p class="muted">Os alertas aparecem quando o Studio é aberto dentro do IASD APP.</p>';return}
 try{const rows=(await P.loadSoundAlertRows()).slice(0,8);
  if(!rows.length){box.innerHTML='<p class="muted">Nenhum alerta por enquanto.</p>';return}
  const quick=P.SOUND_QUICK_REPLIES||['Recebido ✓'];
  box.innerHTML=rows.map(x=>'<div class="st-al"><div class="st-al-h"><span class="st-al-i">🔔</span><div><b>'+stEsc(x.message)+'</b><small>Enviado por '+stEsc(x.sender_name||'Equipe')+' · '+stEsc(P.soundAgo?P.soundAgo(x.created_at):'')+'</small></div><em class="'+(x.reply_message?'ok':'new')+'">'+(x.reply_message?'Respondido':'Novo')+'</em></div>'+
   (x.reply_message?'<div class="st-al-r"><b>↩ '+stEsc(x.replied_by_name||'Sonoplastia')+'</b> · '+stEsc(x.reply_message)+'</div>':'<div class="st-al-a">'+quick.map((t,i)=>'<button type="button" data-q="'+i+'" data-id="'+stEsc(x.id)+'">'+stEsc(t)+'</button>').join('')+'<input type="text" maxlength="300" placeholder="Escrever resposta…" data-in="'+stEsc(x.id)+'"><button type="button" class="primary" data-send="'+stEsc(x.id)+'">Responder</button></div>')+'</div>').join('')
 }catch(e){box.innerHTML='<p class="muted">Não foi possível carregar os alertas.</p>'}}
document.addEventListener('click',async e=>{const b=e.target.closest?.('#stAlerts button');if(!b)return;const P=window.parent;if(P===window)return;const id=b.dataset.id||b.dataset.send;let text='';if(b.dataset.q!==undefined)text=(P.SOUND_QUICK_REPLIES||[])[+b.dataset.q];else text=b.parentElement.querySelector('[data-in]')?.value;b.disabled=true;try{await P.replySoundAlert(id,text)}finally{b.disabled=false;stRenderAlerts();requestStudioHeight()}});
setInterval(stRenderAlerts,15000);stRenderAlerts();

/* Bíblia: recentes */
function bibleRecentList(){try{return JSON.parse(localStorage.getItem('iasd-studio-bible-recent')||'[]')}catch(e){return[]}}
function bibleRecentRender(){const box=$('bibleRecent');if(!box)return;const list=bibleRecentList();box.replaceChildren();if(!list.length){const m=document.createElement('span');m.className='muted';m.textContent='Nenhuma busca ainda.';box.append(m);return}list.forEach(x=>{const b=document.createElement('button');b.type='button';b.textContent=x.label;b.onclick=()=>{$('book').value=x.book;$('chapter').value=x.chapter;$('verse').value=x.verse;if(x.tr&&$('studioTranslation'))$('studioTranslation').value=x.tr;searchBible()};box.append(b)})}
(function(){const orig=searchBible;searchBible=async function(){await orig();try{if(!bibleResult)return;const book=$('book').value,label=books.selectedOptions[0].textContent+' '+$('chapter').value+':'+$('verse').value,list=bibleRecentList().filter(x=>x.label!==label);list.unshift({label,book,chapter:$('chapter').value,verse:$('verse').value,tr:$('studioTranslation')?.value});localStorage.setItem('iasd-studio-bible-recent',JSON.stringify(list.slice(0,6)));bibleRecentRender()}catch(e){}}})();
bibleRecentRender();
/* Sorteador: histórico */
let drawLogged=null;function drawHistRender(){const box=$('drawHist');if(!box)return;let list=[];try{list=JSON.parse(sessionStorage.getItem('iasd-studio-draws')||'[]')}catch(e){}box.replaceChildren();if(!list.length){const m=document.createElement('span');m.className='muted';m.textContent='Nenhum ainda.';box.append(m);return}list.forEach(n=>{const b=document.createElement('span');b.className='chip-n';b.textContent=n;box.append(b)})}
setInterval(()=>{if(lastDraw!==null&&!rolling&&lastDraw!==drawLogged){drawLogged=lastDraw;let list=[];try{list=JSON.parse(sessionStorage.getItem('iasd-studio-draws')||'[]')}catch(e){}list.unshift(lastDraw);try{sessionStorage.setItem('iasd-studio-draws',JSON.stringify(list.slice(0,12)))}catch(e){}drawHistRender()}},400);drawHistRender();
/* Indicadores de pareamento (pílulas acima do telão) */
const stSt={data:null,ok:false,paired:false,at:0};
function stPill(id,dot,html){const el=$(id);if(!el)return;const d=el.querySelector('.st-dot');if(d&&dot)d.className='st-dot '+dot;el.querySelector('.st-txt').innerHTML=html}
function stEsc2(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML}
function stQuality(w,h){return w>=3800?' (4K)':w>=2500?' (2K)':w>=1900?' (Full HD)':w>=1200?' (HD)':''}
function stRenderChips(){const d=stSt.data,token=!!localStorage.getItem('iasd-projetor-token');
 if(d&&d.online&&d.paired&&token)stPill('chipProj','ok','IASD Projetor <em class="ok">Conectado</em>');
 else if(d&&d.online)stPill('chipProj','warn','IASD Projetor <em class="warn">Sem pareamento</em>');
 else stPill('chipProj','bad','IASD Projetor <em class="bad">Desconectado</em>');
 const m=d&&(d.monitors||[]).find(x=>!x.primary),mm=m||(d&&(d.monitors||[])[0]);
 stPill('chipRes',null,mm?stEsc2(mm.width+' × '+mm.height+stQuality(mm.width,mm.height)):'Resolução —');
 const idx=d&&mm?(d.monitors||[]).indexOf(mm)+1:0;
 stPill('chipMon',null,!d?'Telão —':d.secondMonitor&&m?'Monitor '+idx+' - Telão Principal':'Telão não detectado');
 stRenderNow()}
function stRenderNow(){const st=localStorage.getItem('iasd-stage')||'';const live=!!st;
 const el=$('chipNow');if(!el)return;const black=!live&&localStorage.getItem('iasd-black')==='1';el.classList.toggle('is-live',live);el.classList.toggle('is-black',black);stPill('chipNow',live?'live':black?'black':'off',live?'Ao vivo':black?'Tela preta':'Sem Conteúdo');const lb=$('liveLabel');if(lb&&black){lb.classList.remove('is-live');$('liveLabelText').textContent='TELA PRETA NO TELÃO'}}
function stFullscreen(){const f=$('live');try{(f.requestFullscreen||f.webkitRequestFullscreen).call(f)}catch(e){feedback('Não foi possível abrir em tela cheia.')}}
async function stCheck(){try{const r=await fetch('http://127.0.0.1:38741/status',{targetAddressSpace:'loopback',cache:'no-store',signal:AbortSignal.timeout(2500)});const b=await r.json();stSt.data=b;if(b.online&&b.paired)stSt.at=Date.now()}catch(e){stSt.data=null}stRenderChips()}
stCheck();setInterval(stCheck,6000);setInterval(stRenderNow,1000);
window.addEventListener('pointerdown',()=>{window.__stUser=true},{once:true,capture:true});window.addEventListener('keydown',()=>{window.__stUser=true},{once:true,capture:true});
function showTool(name){selectedTool=name;document.body.dataset.tool=name;sessionStorage.setItem('iasd-studio-tool',name);document.querySelectorAll('.work').forEach(x=>x.classList.toggle('active',x.id===name));document.querySelectorAll('.tool').forEach(x=>x.classList.toggle('active',x.dataset.tool===name));if(window.innerWidth<900&&window.__stUser)document.getElementById(name)?.scrollIntoView({behavior:'smooth',block:'nearest'});requestStudioHeight()}
function prepare(content,preview){nextContent=content;$('next').textContent=preview||'Pronto para projetar';syncNextPreview()}
function projectPrepared(){if(!nextContent){feedback('Selecione um versículo primeiro.');return}if(nextContent.startsWith('IASD_LOCAL_MEDIA:')){feedback('Para mídia local, use o botão da própria ferramenta.');return}project(nextContent)}
function clearPrepared(){nextContent='';$('next').textContent='Selecione uma ferramenta';syncNextPreview()}

// Episódios verificados do canal Provai e Vede | Oficial. Sem chave de API e sem necessidade de cadastrar links.
const PROVAI_E_VEDE_LIBRARY=[
 {id:'-uhAImNph_k',title:'As respostas que faltavam',year:2025},
 {id:'v1JPsp-laDI',title:'Construindo com fé',year:2025},
 {id:'bB1yXGDvW7A',title:'Fiel em meio ao caos',year:2025},
 {id:'TjLbQ0FE8S0',title:'Cuidando do templo',year:2025},
 {id:'0Ik4D-NAyog',title:'O Deus que sabe dos detalhes',year:2025},
 {id:'LXT1wTPu4ac',title:'O Relógio de Deus',year:2025},
 {id:'WuhE6_vCcRY',title:'Cada ato, um testemunho (Libras)',year:2025},
 {id:'KhfJhUpFrcE',title:'A esperança que nos mantém',year:2025},
 {id:'LXKrv4lnzwY',title:'O Masterchef Pastor',year:2025},
 {id:'8vdF8n9pNdc',title:'Debutante missionária',year:2025},
 {id:'u4ZxCYskTQg',title:'De filho para mãe',year:2025},
 {id:'POeRiGZIS0Y',title:'Uma comunidade de fé',year:2025},
 {id:'6K7twhY55pA',title:'Firmados em Deus',year:2025},
 {id:'Lyz-qZ2fUbA',title:'Servindo enquanto há tempo',year:2025},
 {id:'pKOpMeY-Rdc',title:'Um século de doação',year:2025},
 {id:'OEQVSWYOP0c',title:'Olhos em Jesus',year:2025},
 {id:'5U5d02UDslw',title:'Quando Deus prepara o caminho',year:2025},
 {id:'zzHB-Yp0n6E',title:'Uma diferença na sociedade',year:2025},
 {id:'E0uqrDH2qk0',title:'Milagre na estrada',year:2025},
 {id:'zS7ZASLQL1g',title:'Prova de Fogo',year:2025},
 {id:'ysyZmuIURLc',title:'A evangelista incansável',year:2025},
 {id:'2WMIS1U64Ok',title:'Da morte para a vida',year:2025},
 {id:'uCrBQhaN0aE',title:'Pregando em silêncio',year:2025},
 {id:'YTaJZQL8LqI',title:'Um chamado de paz',year:2025},
 {id:'tjsGZtAOKaY',title:'Herança do Senhor',year:2025},
 {id:'dQEtwfvZtJk',title:'Bênçãos sem medida',year:2025},
 {id:'dEDpfGZLpHg',title:'A oração tem poder (Libras)',year:2025},
 {id:'FAESRYaYRpw',title:'Do alcoolismo à nova vida',year:2025},
 {id:'crP6q_0pAUg',title:'O resgate missionário',year:2025},
 {id:'3CU1OqCWpZ8',title:'Amor e serviço',year:2025},
 {id:'62ohNAzawQg',title:'A toda língua povo e nação',year:2025},
 {id:'ynTiVPabCrg',title:'Sonhos e fé',year:2025},
 {id:'ke2uK5XWv8g',title:'O caminho do exemplo',year:2025},
 {id:'bSqnxAdGQe0',title:'O privilégio da dificuldade',year:2025},
 {id:'x634cOYqvfA',title:'O privilégio da dificuldade (Libras)',year:2025},
 {id:'AGSKopJ1y0g',title:'Um século de doação (Libras)',year:2025},
 {id:'w3XhRq8C7OQ',title:'A fé e os ensinamentos de um pai',year:2025},
 {id:'EFbdbzoKZPU',title:'A graça que me basta (Libras)',year:2025},
 {id:'Kybr36ZXksw',title:'Educação Abençoada',year:2025},
 {id:'BqwYZ1QIi34',title:'Uma médica de esperança (Libras)',year:2025},
 {id:'8CxrAQfkBHY',title:'Tudo o que preciso',year:2025},
 {id:'AaIDkxFnVjQ',title:'Provação no aeroporto',year:2025},
 {id:'KVaG6GWSK4A',title:'Quanto mais servir, melhor',year:2025},
 {id:'ErgkJ-hq-Kk',title:'Uma missão de aprendizado',year:2024},
 {id:'443pA4EvfXY',title:'Um século de doação (2024)',year:2024},
 {id:'apyVsEe-Yrs',title:'Cara ou coroa',year:2026},
 {id:'4OnWrmTJbAo',title:'Mission Refocus',year:2026},
 {id:'7KQNyUKPot0',title:'Nadando por uma coroa',year:2024},
 {id:'KGR48Jkxc3o',title:'Medicina para o reino',year:2024},
 {id:'4i8WTTZqQAg',title:'Colocado à prova',year:2024},
 {id:'sTDulIHyPn4',title:'Um cuidado maior que a cura',year:2024},
 {id:'gIRUfuzXxhg',title:'Missão longe da zona de conforto (Libras)',year:2024},
 {id:'hmBQnKBF5Sk',title:'Alimentando universitários',year:2024},
 {id:'RC6sy_2XnSw',title:'Alimentando universitários (Libras)',year:2024},
 {id:'e3F0NGj2b00',title:'Alimentando vidas',year:2024},
 {id:'u07AV1j8Fi0',title:'A esperança maior que a cura',year:2024},
 {id:'lhZCqHDBkEc',title:'Do abandono à esperança',year:2026},
 {id:'X3meq_tl8mg',title:'Do abandono à esperança (Libras)',year:2026},
 {id:'bLG9zmRaGOs',title:'Visão espiritual',year:2024}
];
function youtubeId(url){try{const u=new URL(url.trim());const h=u.hostname.toLowerCase();let id='';if(h==='youtu.be'||h==='www.youtu.be')id=u.pathname.slice(1).split('/')[0];else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(h)){id=u.searchParams.get('v')||u.pathname.split('/')[2]||''}return /^[a-zA-Z0-9_-]{11}$/.test(id)?id:null}catch{return null}}
function youtubeList(kind){const extra=($((kind==='ambient'?'ambientLinks':'testimonyLinks')).value||'').split(/\n/).map(youtubeId).filter(Boolean);return [...new Set(kind==='testimony'?[...PROVAI_E_VEDE_LIBRARY.map(v=>v.id),...extra]:extra)]}
function saveYouTubeList(kind){const ids=youtubeList(kind);localStorage.setItem('iasd-youtube-'+kind,ids.join('\n'));feedback(ids.length+' vídeos disponíveis para '+(kind==='ambient'?'música ambiente':'Provai e Vede')+'.')}
async function closePrivateYoutube(){for(const kind of ['ambient','testimony','offering','special']){$(kind+'Embed')?.replaceChildren();$(kind+'Private')?.classList.add('hide')}try{await window.parent.closePreparedYoutube?.()}catch(e){console.warn(e)}let st='';try{st=localStorage.getItem('iasd-stage')||''}catch(e){}if(st.startsWith('IASD_LOCAL_MEDIA:'))call('stopProjection');feedback('Vídeo fechado (prévia e telão). Para fechar a janela do telão use “Fechar telão”.')}
function youtubeEmbed(id,target){const host=$(target);host.replaceChildren();const frame=document.createElement('iframe');frame.className='youtube-player';frame.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0';frame.title='Reprodutor do YouTube';frame.allow='accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture;fullscreen';frame.allowFullscreen=true;host.append(frame)}
const selectedYouTube={testimony:null,ambient:null,offering:null,special:null};
async function projectSelectedYouTube(kind){if(kind==='offering'&&!selectedYouTube.offering)prepareOffering();const id=selectedYouTube[kind];if(!id){feedback('Prepare um vídeo primeiro.');return}feedback('Preparando vídeo no IASD Projetor…');try{if(typeof window.parent.prepareYoutubePreview!=='function'||typeof window.parent.projectPreparedYoutube!=='function')throw Error('Atualize a página do IASD APP.');await window.parent.prepareYoutubePreview(id);await window.parent.projectPreparedYoutube();feedback('Vídeo enviado diretamente ao telão pelo IASD Projetor.');}catch(e){feedback('Falha ao projetar YouTube: '+(e.message||e));}}
function randomYouTube(){const ids=youtubeList('testimony');if(!ids.length){feedback('A biblioteca está temporariamente vazia.');return}let seen=[];try{seen=JSON.parse(localStorage.getItem('iasd-testimony-seen')||'[]')}catch{}let available=ids.filter(id=>!seen.includes(id));if(!available.length){seen=[];available=ids}const id=available[Math.floor(Math.random()*available.length)];seen.push(id);localStorage.setItem('iasd-testimony-seen',JSON.stringify(seen));const item=PROVAI_E_VEDE_LIBRARY.find(v=>v.id===id);$('testimonyChosen').textContent=(item?item.title+' · '+item.year:'Vídeo adicional')+' · '+(ids.length-seen.length)+' ainda não vistos nesta rodada';selectedYouTube.testimony=id;youtubeEmbed(id,'testimonyEmbed');feedback('Vídeo sorteado e pronto para dar play.')}
function resetYouTubeHistory(){localStorage.removeItem('iasd-testimony-seen');feedback('Histórico do Provai e Vede reiniciado.')}
function addAmbientExample(){const id='cDffo1ae83o',el=$('ambientLinks');if(!youtubeList('ambient').includes(id)){el.value+=(el.value.trim()?'\n':'')+'https://www.youtube.com/watch?v='+id;saveYouTubeList('ambient')}feedback('Pad de referência adicionado à seleção.')}
function resetAmbientRound(){localStorage.removeItem('iasd-ambient-seen');feedback('Seleção reiniciada.')}
function randomAmbient(){const ids=youtubeList('ambient');if(!ids.length){feedback('Cadastre links de músicas primeiro.');return}saveYouTubeList('ambient');let seen=[];try{seen=JSON.parse(localStorage.getItem('iasd-ambient-seen')||'[]')}catch{}let available=ids.filter(id=>!seen.includes(id));if(!available.length){seen=[];available=ids}const id=available[Math.floor(Math.random()*available.length)];seen.push(id);localStorage.setItem('iasd-ambient-seen',JSON.stringify(seen));selectedYouTube.ambient=id;youtubeEmbed(id,'ambientEmbed');feedback('Pad escolhido sem repetir os anteriores desta rodada.')}
function prepareOffering(){const id=youtubeId($('offeringUrl').value);if(!id){feedback('Informe um link válido do YouTube.');return}localStorage.setItem('iasd-offering-url',$('offeringUrl').value);selectedYouTube.offering=id;youtubeEmbed(id,'offeringEmbed');feedback('Vídeo dos dízimos pronto para dar play.')}
function syncNextPreview(){const section=$('preview-layout');if(section)section.classList.remove('has-next')}
function hymnKey(){return 'iasd-hymn-'+String($('hymnNumber').value||'').trim()}
function saveHymnLyrics(){const number=Number($('hymnNumber').value),name=$('hymnName').value.trim(),lyrics=$('hymnLyrics').value.trim();if(!Number.isInteger(number)||number<1||!name||!lyrics){feedback('Informe número, título e letra autorizada.');return}localStorage.setItem(hymnKey(),JSON.stringify({number,name,lyrics}));$('hymnStatus').textContent='Hino '+number+' salvo neste navegador.'}
function loadHymnLyrics(){const raw=localStorage.getItem(hymnKey());if(!raw){$('hymnStatus').textContent='Hino ainda não cadastrado neste navegador.';return}try{const hymn=JSON.parse(raw);$('hymnName').value=hymn.name;$('hymnLyrics').value=hymn.lyrics;$('hymnStatus').textContent='Hino '+hymn.number+' carregado.'}catch(e){feedback('Cadastro do hino inválido.')}}
function deleteHymnLyrics(){localStorage.removeItem(hymnKey());$('hymnLyrics').value='';$('hymnStatus').textContent='Hino excluído deste navegador.'}
function projectHymnLyrics(){const number=$('hymnNumber').value,name=$('hymnName').value.trim(),lyrics=$('hymnLyrics').value.trim();if(!number||!name||!lyrics){feedback('Preencha número, título e letra antes de projetar.');return}project('IASD_BIBLE:'+JSON.stringify({ref:'Hino '+number+' · '+name,text:lyrics}));feedback('Letra do hino enviada ao telão.')}
function initYouTubeTools(){for(const kind of ['ambient','testimony']){const el=$(kind+'Links');if(el)el.value=(localStorage.getItem('iasd-youtube-'+kind)||'').split('\n').filter(Boolean).filter(id=>kind!=='testimony'||!PROVAI_E_VEDE_LIBRARY.some(v=>v.id===id)).map(id=>'https://www.youtube.com/watch?v='+id).join('\n')}if($('offeringUrl'))$('offeringUrl').value=localStorage.getItem('iasd-offering-url')||'';renderSpecial();renderOfferings();restoreDrawTrack();syncNextPreview()}

async function checkWindowsConnection(){const status=$('windowsConnectionStatus'),box=$('cfConn');const st=(state,t)=>{status.textContent=t;if(box)box.dataset.state=state};st('busy','Consultando o aplicativo Windows…');try{const r=await fetch('http://127.0.0.1:38741/status',{cache:'no-store',signal:AbortSignal.timeout(4500)});if(!r.ok)throw Error('Aplicativo não respondeu');const info=await r.json();st(info.paired?'ok':'warn','IASD Projetor v'+(info.version||'?')+' · '+(info.paired?'Pareamento salvo':'Aguardando pareamento')+' · '+(info.secondMonitor?'Telão detectado':'Nenhum segundo monitor')+' · '+(info.youtubePreview?'Prévia YouTube preparada':'Prévia inativa'))}catch(e){st('off','IASD Projetor offline ou inacessível neste computador. Abra o aplicativo e verifique se está em execução.')}}
async function cfLoadRelease(){const info=$('cfInfo'),a=$('cfDownload');if(!info||!a)return;try{const r=await fetch('https://api.github.com/repos/victoorlyma5555/Iasd-studio/releases?per_page=12',{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error('GitHub '+r.status);const list=await r.json();const rel=list.find(x=>/^iasd-projetor-v/i.test(x.tag_name||'')&&!x.draft&&!x.prerelease&&(x.assets||[]).some(f=>/\.exe$/i.test(f.name)));if(!rel)throw Error('sem versão');const f=rel.assets.find(x=>/\.exe$/i.test(x.name)),v=(/v(\d+\.\d+\.\d+)/i.exec(rel.tag_name)||[])[1]||rel.tag_name,mb=f.size?Math.round(f.size/1048576)+' MB':'',dt=rel.published_at?new Date(rel.published_at).toLocaleDateString('pt-BR',{timeZone:'America/Bahia'}):'';a.href=f.browser_download_url;a.querySelector('span').textContent='Baixar IASD Projetor '+v;info.textContent='Versão mais recente: '+v+(dt?' · publicada em '+dt:'')+(mb?' · instalador de '+mb:'')+'. O aplicativo instalado se atualiza sozinho.';$('cfTag').textContent='Windows · versão '+v}catch(e){info.textContent='Não foi possível consultar a versão agora. O botão abre a página da versão mais recente.'}}
cfLoadRelease();
function mirrorProjection(content){const label=$('liveLabel');if(label){const live=!!content&&!!localStorage.getItem('iasd-projetor-token');label.classList.toggle('is-live',live);$('liveLabelText').textContent=live?'AO VIVO · NO TELÃO':'NO TELÃO AGORA'}const frame=$('live');if(frame?.contentWindow)frame.contentWindow.postMessage({type:'iasd-project',content},location.origin)}
function stThemed(c){
 if(typeof c!=='string')return c;
 for(const pre of ['IASD_BIBLE:','IASD_DRAW_READY:','IASD_DRAW_ANIM:']){if(c.startsWith(pre)){try{const d=JSON.parse(c.slice(pre.length));d.theme=tmTheme;return pre+JSON.stringify(d)}catch(e){}return c}}
 if(c.startsWith('IASD_DRAW:'))return 'IASD_DRAW:'+c.slice(10).split('|')[0]+'|'+tmTheme;
 return c}
function project(content){const orig=content;content=stThemed(content);call('project',content);try{localStorage.setItem('iasd-black',content===''?'1':'0')}catch(e){}mirrorProjection(content);stRenderNow();feedback(content===''?'Tela preta enviada ao telão.':'Conteúdo enviado.');if(nextContent===orig)clearPrepared()}
function loadAudio(input,id){const f=input.files?.[0];if(!f)return;const el=$(id);if(urls.has(id))URL.revokeObjectURL(urls.get(id));const url=URL.createObjectURL(f);urls.set(id,url);el.src=url;el.volume=muted?0:volume;prepare('','Áudio: '+f.name);feedback('Áudio carregado: '+f.name)}
function loadVideo(input,id){const f=input.files?.[0];if(!f)return;const el=$(id);el._iasdFile=f;el._iasdRemote=null;if(urls.has(id))URL.revokeObjectURL(urls.get(id));const url=URL.createObjectURL(f);urls.set(id,url);el.src=url;el.volume=muted?0:volume;prepare('','Vídeo: '+f.name);feedback('Vídeo carregado: '+f.name)}
async function projectLocalMedia(id,kind){const el=$(id),file=el._iasdFile;if(!file){feedback('Selecione um arquivo antes de projetar.');return}feedback('Preparando mídia para o telão…');try{let url=el.src;const token=localStorage.getItem('iasd-projetor-token');if(token){const response=await fetch('http://127.0.0.1:38741/media/upload',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':file.type||'video/mp4'},body:file});const data=await response.json();if(!response.ok)throw Error(data.error||'Falha no envio');url=data.url}const payload='IASD_LOCAL_MEDIA:'+JSON.stringify({kind,url,name:file.name,volume:muted?0:volume});prepare(payload,'Mídia: '+file.name);project(payload);feedback('Vídeo enviado ao telão.')}catch(e){feedback('Falha ao projetar: '+e.message+'. Atualize o IASD Projetor do Windows para usar arquivos locais.')}}
function setVolume(v){volume=Number(v)/100;document.querySelectorAll('audio,video').forEach(e=>e.volume=muted?0:volume);try{window.parent?.postMessage({type:'iasd-studio-volume',value:muted?0:volume},location.origin)}catch(e){}}
function toggleMute(){muted=!muted;setVolume(volume*100)}
function pauseAll(){document.querySelectorAll('audio,video').forEach(e=>e.pause())}
let drawAudioMode='',drawYoutubeId=null;
const DRAW_DB='iasd-draw-track';
function drawTrackDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DRAW_DB,1);request.onupgradeneeded=()=>request.result.createObjectStore('tracks');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function saveDrawTrack(){const file=$('drawLocalAudio')._iasdFile;if(!file){feedback('Importe uma música antes de salvar.');return}try{const db=await drawTrackDb();await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put(file,'default');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();$('drawSavedStatus').textContent='Salva neste navegador: '+file.name;feedback('Música salva neste navegador. Para sincronizar entre dispositivos será necessário armazenamento na nuvem.')}catch(e){feedback('Não foi possível salvar: '+e.message)}}
async function restoreDrawTrack(){try{const db=await drawTrackDb();const file=await new Promise((resolve,reject)=>{const q=db.transaction('tracks').objectStore('tracks').get('default');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});db.close();if(file){loadDrawAudio({files:[file]});$('drawSavedStatus').textContent='Música salva neste navegador: '+file.name}}catch(e){console.warn('Música salva indisponível',e)}}
async function deleteDrawTrack(){try{const db=await drawTrackDb();await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').delete('default');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();stopDrawAudio();$('drawLocalAudio').removeAttribute('src');$('drawLocalAudio')._iasdFile=null;$('drawSavedStatus').textContent='Música excluída deste navegador.';feedback('Música excluída.')}catch(e){feedback(e.message)}}
function loadDrawAudio(input){const file=input.files?.[0];if(!file)return;const p=$('drawLocalAudio');p._iasdFile=file;if(p.src.startsWith('blob:'))URL.revokeObjectURL(p.src);p.src=URL.createObjectURL(file);p.load();drawAudioMode='file';drawYoutubeId=null;$('drawAudioStatus').textContent='Pronto: '+file.name}
function pauseDrawAudio(){const p=$('drawLocalAudio');p.pause();$('drawAudioStatus').textContent='Música pausada.'}
function stopDrawAudio(){const p=$('drawLocalAudio');p.pause();p.currentTime=0;$('drawAudioStatus').textContent='Áudio parado.'}
function startDrawAudio(){const p=$('drawLocalAudio');if(!p.src){$('drawAudioStatus').textContent='Importe uma música ou carregue uma trilha salva.';return}p.currentTime=0;p.volume=muted?0:volume;p.play().then(()=>$('drawAudioStatus').textContent='Música em reprodução.').catch(()=>feedback('Clique em Play para liberar o áudio.'))}
function projectDrawReady(){
 if(rolling){feedback('Aguarde o sorteio atual terminar.');return}
 const min=Number($('min').value),max=Number($('max').value);
 if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||max<min||max-min>1000000){feedback('Informe um intervalo válido.');return}
 project('IASD_DRAW_READY:'+JSON.stringify({min,max}));
 drawShow('—');
 feedback('Sorteador projetado. Inicie o sorteio quando desejar.');
}
function drawShow(text,win){const box=$('drawNumber');if(!box)return;const str=String(text);box.classList.toggle('win',!!win);box.replaceChildren();[...str].forEach(ch=>{const t=document.createElement('span');t.className='dn';const i=document.createElement('i');i.textContent=ch;t.append(i);box.append(t)})}
function drawPoolKey(){return ($('min').value||'')+':'+($('max').value||'')}
function drawnList(){try{const x=JSON.parse(sessionStorage.getItem('iasd-studio-drawn')||'null');return x&&x.key===drawPoolKey()&&Array.isArray(x.list)?x.list:[]}catch(e){return[]}}
function drawnSave(list){try{sessionStorage.setItem('iasd-studio-drawn',JSON.stringify({key:drawPoolKey(),list}))}catch(e){}}
function drawLeft(){const el=$('drawLeft');if(!el)return;const min=Number($('min').value),max=Number($('max').value);if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||max<min){el.textContent='último número sorteado';return}const total=max-min+1,used=$('noRepeat')?.checked?drawnList().length:0;el.textContent=$('noRepeat')?.checked?(used?'Restam '+(total-used).toLocaleString('pt-BR')+' de '+total.toLocaleString('pt-BR')+' números':'último número sorteado · '+total.toLocaleString('pt-BR')+' números no sorteio'):'último número sorteado'}
function drawPick(min,max){const total=max-min+1;if(!$('noRepeat')?.checked)return min+Math.floor(Math.random()*total);const used=drawnList().filter(n=>n>=min&&n<=max).sort((a,b)=>a-b);if(used.length>=total)return null;let n=min+Math.floor(Math.random()*(total-used.length));for(const d of used){if(d<=n)n++;else break}return n}
function draw(){if(rolling)return;const min=Number($('min').value),max=Number($('max').value),ms=Number($('duration').value);if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||max<min||max-min>1000000){feedback('Informe um intervalo válido de até 1 milhão de números.');return}const target=drawPick(min,max);if(target===null){feedback('Todos os números já foram sorteados. Toque em “Resetar números” para recomeçar.');return}rolling=true;$('drawBtn').disabled=true;lastDraw=null;const start=performance.now();const drawPayload=stThemed('IASD_DRAW_ANIM:'+JSON.stringify({min,max,duration:ms,target}));call('project',drawPayload);try{localStorage.setItem('iasd-black','0')}catch(e){}mirrorProjection(drawPayload);const L=String(target).length,rl=()=>{let r='';for(let i=0;i<L;i++)r+=String((i===0&&L>1)?1+Math.floor(Math.random()*9):Math.floor(Math.random()*10));return r};function tick(now){const elapsed=now-start;const delay=40+Math.pow(elapsed/ms,3)*350;drawShow(rl());if(elapsed<ms){setTimeout(()=>requestAnimationFrame(tick),delay)}else{drawShow(target,true);lastDraw=target;rolling=false;$('drawBtn').disabled=false;if($('noRepeat')?.checked){const l=drawnList();l.push(target);drawnSave(l)}drawLeft();prepare('IASD_DRAW:'+target,'Número sorteado: '+target);feedback('Sorteio concluído. O resultado já está no telão.')}}requestAnimationFrame(tick)}
function drawReset(){if(rolling){feedback('Aguarde o sorteio atual terminar.');return}try{sessionStorage.removeItem('iasd-studio-drawn');sessionStorage.removeItem('iasd-studio-draws')}catch(e){}lastDraw=null;drawLogged=null;drawShow('—');drawHistRender();drawLeft();if(nextContent.startsWith('IASD_DRAW:'))clearPrepared();const st=localStorage.getItem('iasd-stage')||'';if(st.startsWith('IASD_DRAW')){const min=Number($('min').value),max=Number($('max').value);if(Number.isSafeInteger(min)&&Number.isSafeInteger(max)&&max>=min)project('IASD_DRAW_READY:'+JSON.stringify({min,max}))}feedback('Números resetados. O sorteio recomeça do zero.')}
function projectDrawResult(){if(lastDraw===null){feedback('Faça o sorteio primeiro.');return}project('IASD_DRAW:'+lastDraw)}
let bibleCache=new Map();const books=$('book');bibleBooks.forEach(([name,key])=>{const o=document.createElement('option');o.value=key;o.textContent=name;books.append(o)});books.value='genesis';
async function fetchStudioBibleChapter(book,chapter){
 const names=book==='psalms'?['psalms','psalm','ps']: [book];const translation=$('studioTranslation')?.value||'almeida';
 let lastError;
 for(const name of names){try{
  const response=await fetch('https://bible-api.com/'+encodeURIComponent(name+' '+chapter)+'?translation='+encodeURIComponent(translation)+'&single_chapter_book_matching=indifferent');
  if(!response.ok)throw Error('Serviço bíblico indisponível ('+response.status+')');
  const json=await response.json();
  const verses=(json.verses||[]).filter(x=>Number(x.chapter)===chapter&&typeof x.text==='string').map(x=>({...x,verse:Number(x.verse)})).sort((a,b)=>a.verse-b.verse);
  if(verses.length)return verses;
  throw Error('Capítulo sem versículos');
 }catch(e){lastError=e}}
 throw lastError||Error('Capítulo indisponível');
}
async function searchBible(){const book=$('book').value,chapter=Number($('chapter').value),v=$('verse').value.trim(),result=$('bibleResult');$('bibleProject').disabled=true;bibleResult=null;if(!Number.isInteger(chapter)||chapter<1||chapter>150||!/^\d{1,3}(-\d{1,3})?$/.test(v)){result.textContent='Informe capítulo e versículo válidos.';return}const [first,lastRaw]=v.split('-').map(Number),last=lastRaw||first;if(first<1||last<first||last-first>20){result.textContent='Selecione até 21 versículos em sequência.';return}const name=books.selectedOptions[0].textContent,ref=name+' '+chapter+':'+v+' ('+($('studioTranslation')?.selectedOptions[0]?.text||'Almeida')+')';result.textContent='Buscando '+ref+'…';try{const translation=$('studioTranslation')?.value||'almeida';const key=book+'|'+chapter+'|'+translation;let verses=bibleCache.get(key);if(!verses){try{verses=window.parent!==window&&typeof window.parent.fetchBibleChapter==='function'?await window.parent.fetchBibleChapter(book,chapter,translation):await fetchStudioBibleChapter(book,chapter)}catch(e){if(book!=='psalms')throw e;verses=await fetchStudioBibleChapter(book,chapter)}bibleCache.set(key,verses)}const chosen=verses.filter(x=>Number(x.verse)>=first&&Number(x.verse)<=last).sort((a,b)=>Number(a.verse)-Number(b.verse));if(chosen.length!==last-first+1||chosen.some((x,i)=>Number(x.verse)!==first+i))throw Error('Versículos ausentes nesta tradução; não é seguro projetar uma passagem incompleta.');const text=chosen.map(x=>x.text.trim()).join(' ').replace(/\s+/g,' ');bibleResult={ref,text};result.replaceChildren();const title=document.createElement('h3');title.textContent=ref;const para=document.createElement('p');para.textContent=text;result.append(title,para);$('bibleProject').disabled=false;prepare('IASD_BIBLE:'+JSON.stringify(bibleResult),ref+'\n\n'+text)}catch(e){result.textContent='Não foi possível buscar: '+e.message}}
function projectBible(){if(!bibleResult)return;project('IASD_BIBLE:'+JSON.stringify(bibleResult))}
function bibleNext(){const v=$('verse').value.trim();if(!/^\d+$/.test(v)){feedback('Para avançar, selecione um único versículo.');return}$('verse').value=String(Number(v)+1);searchBible()}
function sync(){try{const p=window.parent;if(p===window)return;const stage=localStorage.getItem('iasd-stage')||'';const live=!!stage&&!!localStorage.getItem('iasd-projetor-token');$('liveLabel').classList.toggle('is-live',live);$('liveLabelText').textContent=live?'AO VIVO · NO TELÃO':'NO TELÃO AGORA';if(stage.startsWith('IASD_BIBLE:')){try{const x=JSON.parse(stage.slice(11));$('live').textContent=x.ref+'\n\n'+x.text}catch(e){}}else if(stage.startsWith('IASD_DRAW:'))$('live').textContent='Número: '+stage.slice(10).split('|')[0];else if(stage.startsWith('IASD_LOCAL_MEDIA:'))$('live').textContent='Mídia no telão';else if(stage.startsWith('IASD_YOUTUBE:')){$('connection').textContent='YouTube no telão';}else $('live').textContent=stage||'Tela preta';$('connection').textContent=localStorage.getItem('iasd-projetor-token')?'IASD Projetor pareado':p.canReachProjection?.()?'Janela aberta':'Aguardando telão'}catch(e){}}setInterval(sync,1100);sync();
initYouTubeTools();
const previousTool=sessionStorage.getItem('iasd-studio-tool');showTool(previousTool&&document.getElementById(previousTool)?.classList.contains('work')?previousTool:'ambient');
if(typeof ResizeObserver==='function'){const preview=document.getElementById('preview-layout');let lastPreviewHeight=0;const updateStudioDimensions=()=>{if(window.innerWidth>850&&preview){const h=Math.ceil(preview.querySelector('.screen').getBoundingClientRect().height);if(h>0&&Math.abs(h-lastPreviewHeight)>1){lastPreviewHeight=h;document.querySelector('main').style.setProperty('--iasd-preview-height',h+'px')}}else{lastPreviewHeight=0;document.querySelector('main').style.removeProperty('--iasd-preview-height')}requestStudioHeight()};if(preview)new ResizeObserver(updateStudioDimensions).observe(preview);new ResizeObserver(requestStudioHeight).observe(document.querySelector('main'));window.addEventListener('resize',updateStudioDimensions);updateStudioDimensions()}window.addEventListener('load',requestStudioHeight);window.addEventListener('resize',requestStudioHeight);requestStudioHeight();

/* Rolagem: se nada dentro do Studio pode rolar naquela direção, a roda do mouse rola a página do IASD APP. */
document.addEventListener('wheel',e=>{
 if(e.ctrlKey||e.defaultPrevented||!e.deltaY)return;
 const dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
 const can=el=>{const cs=getComputedStyle(el);return /(auto|scroll)/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+1&&(dy<0?el.scrollTop>0:el.scrollTop+el.clientHeight<el.scrollHeight-1)};
 for(let el=e.target;el&&el.nodeType===1;el=el.parentElement){if(can(el))return}
 const se=document.scrollingElement;if(se&&se.scrollHeight>se.clientHeight+1&&(dy<0?se.scrollTop>0:se.scrollTop+se.clientHeight<se.scrollHeight-1))return;
 try{
  const fe=window.frameElement,P=window.parent;if(!fe||!P||P===window)return;
  for(let p=fe.parentElement;p;p=p.parentElement){const cs=P.getComputedStyle(p);if(/(auto|scroll)/.test(cs.overflowY)&&p.scrollHeight>p.clientHeight+1){p.scrollTop+=dy;e.preventDefault();return}}
  (P.document.scrollingElement||P.document.documentElement).scrollTop+=dy;e.preventDefault();
 }catch(_){}
},{passive:false});

document.addEventListener('input',e=>{if(e.target&&(e.target.id==='min'||e.target.id==='max'))drawLeft()});drawLeft();

/* Bíblia de projeção: campo único de referência + 0 vira 1 */
function bibleNormalize(){
 const c=$('chapter'),v=$('verse');if(!c||!v)return;
 const n=parseInt(c.value,10);c.value=String(n>=1?n:1);
 const txt=String(v.value||'').trim();
 if(!txt){v.value='1';return}
 const fixed=txt.split('-').slice(0,2).map(p=>{const k=parseInt(p,10);return Number.isFinite(k)?String(Math.max(1,k)):''}).filter(Boolean);
 if(fixed.length===2&&Number(fixed[1])<Number(fixed[0]))fixed.reverse();
 v.value=fixed.length===2&&fixed[0]===fixed[1]?fixed[0]:fixed.join('-')||'1';
}
(function(){const orig=searchBible;searchBible=async function(){bibleNormalize();return orig.apply(this,arguments)}})();
['chapter','verse'].forEach(id=>{const el=$(id);if(el)el.addEventListener('change',bibleNormalize)});
function bibleGoRef(){
 const box=$('bibleRef'),res=$('bibleResult');const text=(box?.value||'').trim();
 if(!text){box?.focus();return}
 const r=window.IASDBibleRef?window.IASDBibleRef.parse(text,bibleBooks):null;
 if(!r){res.textContent='Não reconheci “'+text+'”. Exemplos: João 3:16, Sl 23, 1 Co 13:4-7.';return}
 $('book').value=r.book;$('chapter').value=String(r.chapter);$('verse').value=r.from?(r.to?r.from+'-'+r.to:String(r.from)):'1';
 box.value=r.name+' '+r.chapter+(r.from?':'+r.from+(r.to?'-'+r.to:''):'');
 searchBible();
}
