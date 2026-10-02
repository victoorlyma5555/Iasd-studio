/* Palavra em Cena — criador de jogral (IA + modelo), no padrão visual do site.
   Tudo que vem de pessoa/IA passa por esc() ou textContent; os botões usam índices, nunca texto livre em onclick. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY_OLD='iasd-palavra-em-cena',KEY='iasd-jogral-salvos',MAX_SAVED=20;
const OCASIOES=['Culto de sábado','Culto jovem','Dia das Mães','Dia dos Pais','Semana de oração','Programa especial'];
const DURACOES=['3 minutos','5 minutos','8 minutos','10 minutos','15 minutos'];
const ESTILOS=['Emocionante','Infantil','Jovem e dinâmico','Solene e reverente'];
const ESTILOS_PECA=['Drama','Comédia leve','Infantil','Parábola bíblica','Moderna'];
const TEMAS=['A volta de Jesus','Gratidão','Família','O poder da oração','Missões','A Criação','Esperança','Amor ao próximo'];
const IC={
 spark:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
 doc:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
 save:'<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
 copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
 print:'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
 play:'<path d="M8 5l11 7-11 7z"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 pen:'<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 left:'<path d="M15 5l-7 7 7 7"/>',right:'<path d="M9 5l7 7-7 7"/>',
 wa:'<path d="M4 20l1.2-4.1A8 8 0 1 1 8.2 19z"/><path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 .8c-.8-.4-1.6-1.2-2-2l.8-1-1-2z"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>'
};
const I=(n,s)=>'<svg width="'+(s||18)+'" height="'+(s||18)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[n]||'')+'</svg>';
const J={tipo:'jogral',tema:'A volta de Jesus',ocasiao:0,n:6,dur:1,estilo:0,ref:'João 14:1–3',nomes:'',obs:'',text:'',view:'roteiro',busy:false,ai:null,msg:'',msgKind:'',id:null,aiWhy:'',more:false};
let saved=[];
const isPeca=()=>J.tipo==='peca',estilos=()=>isPeca()?ESTILOS_PECA:ESTILOS;
function loadSaved(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');saved=Array.isArray(a)?a.filter(x=>x&&typeof x.text==='string').slice(0,MAX_SAVED):[]}catch(e){saved=[]}
 if(!saved.length){try{const o=JSON.parse(localStorage.getItem(KEY_OLD)||'{}');if(o&&o.text){saved=[{id:'old',title:titleOf(o.text),text:o.text,at:o.updatedAt||new Date().toISOString()}];persist()}}catch(e){}}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved.slice(0,MAX_SAVED)))}catch(e){}}
loadSaved();
const root=()=>document.getElementById('jg-root');
const logged=()=>typeof cloudUser!=='undefined'&&!!cloudUser;
const isManager=()=>{try{return !!(window.IASDAccess&&IASDAccess.canManage(cloudRole))}catch(e){return false}};
function titleOf(t){const l=String(t||'').split('\n').map(x=>x.trim()).find(Boolean)||'Jogral sem título';return l.replace(/^(?:JOGRAL|PEÇA)\s*[—–-]\s*/i,'').slice(0,80)||'Jogral sem título'}
function names(){return J.nomes.split('\n').map(x=>x.replace(/[:\[\]]/g,'').trim()).filter(Boolean).slice(0,30)}
function toOut(){const o=document.querySelector('.jg-out');if(o&&o.scrollIntoView&&window.matchMedia('(max-width:980px)').matches)setTimeout(()=>o.scrollIntoView({behavior:'smooth',block:'start'}),60)}
function say(msg,kind){J.msg=msg;J.msgKind=kind||'';const e=document.getElementById('jg-msg');if(e){e.textContent=msg;e.className='jg-msg '+(kind||'')}}
/* ---------- roteiro formatado ---------- */
const HUES=[212,262,172,28,330,142,196,48];
function hue(label){let h=0;for(const c of label)h=(h*31+c.charCodeAt(0))>>>0;return HUES[h%HUES.length]}
function parse(text){
 const out=[];String(text||'').split('\n').forEach((raw,i)=>{const l=raw.trim();if(!l){out.push({k:'gap'});return}
  if(/^(?:JOGRAL|PEÇA)\s*[—–-]/i.test(l)&&!out.some(x=>x.k==='title')){out.push({k:'title',t:l.replace(/^(?:JOGRAL|PEÇA)\s*[—–-]\s*/i,''),peca:/^PEÇA/i.test(l)});return}
  if(/^\[\s*CENA\b.*\]$/i.test(l)){out.push({k:'scene',t:l.slice(1,-1)});return}
  if(/^(?:PERSONAGENS|ELENCO)\s*:?$/i.test(l)){out.push({k:'castH',t:'Personagens'});return}
  if(/^[•\-]\s+\S/.test(l)){out.push({k:'cast',t:l.replace(/^[•\-]\s+/,'')});return}
  if(/^\[.*\]$/.test(l)){out.push({k:'dir',t:l.slice(1,-1)});return}
  const m=l.match(/^([A-ZÀ-ÚÇ0-9][A-ZÀ-ÚÇ0-9 .'()\/-]{0,40}?)\s*(?:\(([^)]{1,40})\))?:\s*(.+)$/);
  if(m&&m[1]===m[1].toUpperCase()){out.push({k:'say',who:m[1].trim(),how:m[2]||'',t:m[3]});return}
  out.push({k:out.some(x=>x.k==='say')?'txt':'meta',t:l})});
 return out}
function scriptHTML(text){
 const rows=parse(text);if(!rows.some(r=>r.k!=='gap'))return '<div class="jg-empty">'+I('doc',34)+'<b>Seu roteiro aparece aqui</b><span>Preencha os dados e toque em “Gerar com IA”, ou use o modelo sem IA.</span></div>';
 let n=0;return '<div class="jg-script">'+rows.map(r=>{
  if(r.k==='gap')return '';
  if(r.k==='title')return '<h3 class="jg-title">'+(r.peca?'<small class="jg-kind">PEÇA</small>':'')+esc(r.t)+'</h3>';
  if(r.k==='scene')return '<h4 class="jg-scene">'+esc(r.t)+'</h4>';
  if(r.k==='castH')return '<h4 class="jg-casth">'+I('user',16)+'Personagens</h4>';
  if(r.k==='cast'){const m=r.t.match(/^([^—–:-]{1,40}?)\s*[—–:-]\s*(.+)$/);return '<div class="jg-cast">'+(m?'<b>'+esc(m[1])+'</b><span>'+esc(m[2])+'</span>':'<span>'+esc(r.t)+'</span>')+'</div>'}
  if(r.k==='meta')return '<p class="jg-meta">'+esc(r.t)+'</p>';
  if(r.k==='dir')return '<p class="jg-dir">'+esc(r.t)+'</p>';
  if(r.k==='txt')return '<p class="jg-txt">'+esc(r.t)+'</p>';
  const all=/^TODOS\b/.test(r.who);n++;
  return '<div class="jg-line'+(all?' all':'')+'" style="--h:'+hue(r.who)+'"><span class="jg-who">'+(all?'✦ ':'')+esc(r.who)+(r.how?'<small>'+esc(r.how)+'</small>':'')+'</span><p>'+esc(r.t)+'</p></div>'}).join('')+'</div>'}
function stats(text){const rows=parse(text).filter(r=>r.k==='say');if(!rows.length)return '';const words=rows.reduce((a,r)=>a+r.t.split(/\s+/).length,0);const who=new Set(rows.filter(r=>!/^TODOS\b/.test(r.who)).map(r=>r.who));return rows.length+' falas · '+who.size+' participante'+(who.size===1?'':'s')+' · ~'+Math.max(1,Math.round(words/110))+' min de leitura'}
/* ---------- página ---------- */
function chips(list,sel,fn){return '<div class="jg-chips">'+list.map((x,i)=>'<button type="button" class="jg-chip'+(i===sel?' on':'')+'" onclick="IASDJogral.'+fn+'('+i+')">'+esc(x)+'</button>').join('')+'</div>'}
function aiBadge(){
 if(J.ai===true)return '<span class="jg-ai on">'+I('spark',14)+'IA ligada</span>';
 if(J.ai===false)return '<span class="jg-ai off">'+I('info',14)+'IA desligada</span>';
 return '<span class="jg-ai">'+I('spark',14)+'IA grátis</span>'}
function aiNotice(){
 if(J.ai!==false)return '';
 return '<div class="jg-note" role="status">'+I('info',18)+'<div><b>A IA ainda não foi ligada neste site.</b><span>'+(isManager()?'Para ligar: crie uma chave grátis em <u>aistudio.google.com</u> e, na Vercel, em <b>Settings → Environment Variables</b>, adicione <b>GEMINI_API_KEY</b> e faça um novo deploy. Enquanto isso, o modelo sem IA funciona normalmente.':'Peça a um administrador para ativá-la. Enquanto isso, o modelo sem IA funciona normalmente.')+'</span></div></div>'}
function formHTML(){
 const nm=names().length;
 return '<section class="pg-card jg-form"><div class="pg-head"><h2 class="pg-h">'+I('pen',22)+(isPeca()?'Monte sua peça':'Monte seu jogral')+'</h2>'+aiBadge()+'</div>'+aiNotice()+
 '<div class="jg-kindsw" role="tablist"><button type="button" role="tab" class="'+(isPeca()?'':'on')+'" onclick="IASDJogral.tipo(\'jogral\')">Jogral</button><button type="button" role="tab" class="'+(isPeca()?'on':'')+'" onclick="IASDJogral.tipo(\'peca\')">Peça teatral</button></div>'+
 '<div class="jg-f"><label for="jg-tema">Tema</label><input id="jg-tema" maxlength="120" value="'+esc(J.tema)+'" oninput="IASDJogral.set(\'tema\',this.value)" placeholder="Ex.: A volta de Jesus"><div class="jg-chips sm">'+TEMAS.slice(0,4).map((t,i)=>'<button type="button" class="jg-chip" onclick="IASDJogral.tema('+i+')">'+esc(t)+'</button>').join('')+'</div></div>'+
 '<div class="jg-f"><label>Ocasião</label>'+chips(OCASIOES,J.ocasiao,'ocasiao')+'</div>'+
 '<div class="jg-row"><div class="jg-f"><label>'+(isPeca()?'Atores':'Participantes')+'</label><div class="jg-step"><button type="button" onclick="IASDJogral.n(-1)" aria-label="Menos um">−</button><output id="jg-n">'+J.n+'</output><button type="button" onclick="IASDJogral.n(1)" aria-label="Mais um">+</button></div></div>'+
 '<div class="jg-f"><label>Duração</label><div class="jg-seg">'+DURACOES.map((d,i)=>'<button type="button" class="'+(i===J.dur?'on':'')+'" onclick="IASDJogral.dur('+i+')">'+esc(d.replace(' minutos',' min'))+'</button>').join('')+'</div></div></div>'+
 '<div class="jg-f"><label>Estilo</label>'+chips(estilos(),J.estilo,'estilo')+'</div>'+
 '<div class="jg-f"><label for="jg-ref">'+(isPeca()?'História ou passagem bíblica':'Referência bíblica')+' <em>(opcional)</em></label><input id="jg-ref" maxlength="100" value="'+esc(J.ref)+'" oninput="IASDJogral.set(\'ref\',this.value)" placeholder="Ex.: João 14:1–3"></div>'+
 '<details class="jg-more"'+(J.more||nm||J.obs?' open':'')+' ontoggle="IASDJogral.more(this.open)"><summary>'+I('user',16)+'Nomes e observações'+(nm?' <i>'+nm+' nome'+(nm===1?'':'s')+'</i>':'')+'</summary>'+
 '<div class="jg-f"><label for="jg-nomes">'+(isPeca()?'Nomes dos atores':'Nomes dos participantes')+' <em>(um por linha, opcional)</em></label><textarea id="jg-nomes" rows="4" oninput="IASDJogral.set(\'nomes\',this.value)" placeholder="Maria&#10;João&#10;Ana">'+esc(J.nomes)+'</textarea></div>'+
 '<div class="jg-f"><label for="jg-obs">Observações para a IA <em>(opcional)</em></label><textarea id="jg-obs" rows="2" maxlength="400" oninput="IASDJogral.set(\'obs\',this.value)" placeholder="'+(isPeca()?'Ex.: cenário simples, só uma mesa e duas cadeiras; final com mensagem de esperança':'Ex.: incluir uma fala das crianças; terminar com uma oração')+'">'+esc(J.obs)+'</textarea></div></details>'+
 '<div class="jg-go"><button type="button" class="pg-blue" id="jg-ai-btn" onclick="IASDJogral.gerar()"'+(J.busy?' disabled':'')+'>'+I('spark',18)+(J.busy?'Criando seu jogral…':'Gerar com IA grátis')+'</button><button type="button" class="pg-ghost" onclick="IASDJogral.modelo()">'+I('doc',18)+'Modelo sem IA</button></div>'+
 '<p class="jg-hint">A IA usa o plano gratuito do Gemini e pode errar. Confira as referências bíblicas na Bíblia antes do culto.'+(logged()?'':' Entre na sua conta para gerar com IA.')+'</p></section>'}
function outHTML(){
 const has=J.text.trim().length>0;
 return '<section class="pg-card jg-out"><div class="pg-head"><h2 class="pg-h">'+I('doc',22)+''+(isPeca()?'Sua peça':'Seu jogral')+'</h2><div class="jg-tabs" role="tablist"><button type="button" role="tab" class="'+(J.view==='roteiro'?'on':'')+'" onclick="IASDJogral.view(\'roteiro\')">Roteiro</button><button type="button" role="tab" class="'+(J.view==='editar'?'on':'')+'" onclick="IASDJogral.view(\'editar\')">Editar texto</button></div></div>'+
 (has?'<p class="jg-stats">'+esc(stats(J.text))+'</p>':'')+
 (J.view==='editar'?'<textarea id="jg-text" class="jg-edit" aria-label="Texto do jogral" spellcheck="true" oninput="IASDJogral.text(this.value)" placeholder="Escreva ou cole seu roteiro. Use RÓTULO: fala para cada participante e [instruções] entre colchetes.">'+esc(J.text)+'</textarea>':scriptHTML(J.text))+
 '<div class="jg-acts"><button type="button" class="pg-blue" onclick="IASDJogral.ensaio()"'+(has?'':' disabled')+'>'+I('play',16)+'Ensaiar</button><button type="button" class="pg-ghost" onclick="IASDJogral.salvar()"'+(has?'':' disabled')+'>'+I('save',16)+'Salvar</button><button type="button" class="pg-ghost" onclick="IASDJogral.copiar()"'+(has?'':' disabled')+'>'+I('copy',16)+'Copiar</button><button type="button" class="pg-ghost" onclick="IASDJogral.imprimir()"'+(has?'':' disabled')+'>'+I('print',16)+'Imprimir / PDF</button><button type="button" class="pg-ghost jg-wa" onclick="IASDJogral.whatsapp()"'+(has?'':' disabled')+'>'+I('wa',16)+'WhatsApp</button></div>'+
 '<p id="jg-msg" class="jg-msg '+esc(J.msgKind)+'" role="status">'+esc(J.msg)+'</p></section>'}
function savedHTML(){
 if(!saved.length)return '';
 return '<section class="pg-card jg-saved"><div class="pg-head"><h2 class="pg-h">'+I('save',22)+'Seus jograis salvos</h2><span class="pg-sub">neste aparelho · '+saved.length+'</span></div><div class="jg-list">'+saved.map((s,i)=>'<article class="jg-item"><div><b>'+esc(s.title)+'</b><small>'+esc(new Date(s.at).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}))+' · '+esc(stats(s.text)||'sem falas')+'</small></div><div class="jg-ia"><button type="button" class="pg-ghost" onclick="IASDJogral.abrir('+i+')">Abrir</button><button type="button" class="pg-ghost danger" onclick="IASDJogral.apagar('+i+')" aria-label="Apagar">'+I('trash',16)+'</button></div></article>').join('')+'</div></section>'}
function body(){return '<div class="jg-grid">'+formHTML()+outHTML()+'</div>'+savedHTML()}
function page(){
 if(J.ai===null)checkAI();
 return '<div class="pg pg-jogral"><section class="pg-hero pg-hero-jogral"><div class="pg-art"><i class="jg-orb"></i><i class="jg-orb b"></i></div><div class="pg-hero-txt"><span class="pg-kick">PALAVRA EM CENA</span><h1>Crie seu <em>jogral</em></h1><p>Escolha o tema, distribua as falas entre os participantes e ensaie com o roteiro na tela.</p></div></section><div id="jg-root">'+body()+'</div></div>'}
function redraw(){const r=root();if(!r)return;const a=document.activeElement,id=a&&a.id,s=a&&a.selectionStart,e=a&&a.selectionEnd;r.innerHTML=body();if(id){const n=document.getElementById(id);if(n){n.focus();try{n.setSelectionRange(s,e)}catch(x){}}}}
let checking=false;
async function checkAI(){if(checking)return;checking=true;try{const r=await fetch('/api/gerar-jogral',{cache:'no-store'});const j=await r.json();J.ai=!!(j&&j.ready)}catch(e){J.ai=null;checking=false;return}checking=false;redraw()}
/* ---------- ações ---------- */
function payload(){const nm=names();return {tema:J.tema.trim(),ocasiao:OCASIOES[J.ocasiao],pessoas:nm.length>=2?Math.min(30,Math.max(J.n,nm.length)):J.n,duracao:DURACOES[J.dur],estilo:estilos()[J.estilo],tipo:J.tipo,referencia:J.ref.trim(),nomes:nm,detalhes:J.obs.trim()}}
async function gerar(){
 if(J.busy)return;
 if(!logged()){if(typeof openAuthModal==='function')openAuthModal();say('Entre na sua conta para gerar com IA.','warn');return}
 const p=payload();if(!p.tema){say('Escreva o tema do jogral.','warn');const t=document.getElementById('jg-tema');if(t)t.focus();return}
 J.busy=true;J.msg='';redraw();say('A IA está escrevendo as falas. Isso leva de 10 a 30 segundos…','');
 try{
  const s=await cloud.auth.getSession();const tk=s&&s.data&&s.data.session&&s.data.session.access_token;if(!tk)throw Error('Entre novamente na sua conta.');
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),58000);
  let r;try{r=await fetch('/api/gerar-jogral',{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+tk},body:JSON.stringify(p)})}finally{clearTimeout(to)}
  let j={};try{j=await r.json()}catch(e){}
  if(!r.ok){if(j&&j.code==='no_key')J.ai=false;throw Error(((j&&j.error)||'Não foi possível gerar o roteiro.')+(j&&j.detail&&isManager()?' [Detalhe técnico: '+j.detail+']':''))}
  J.text=j.text;J.view='roteiro';J.id=null;J.busy=false;redraw();toOut();
  say(j.truncated?'Roteiro criado, mas ficou cortado no fim. Gere de novo com duração menor ou complete na aba “Editar texto”.':(isPeca()?'Peça criada!':'Jogral criado!')+' Revise as falas e confira as referências bíblicas antes do culto.','ok');
 }catch(e){J.busy=false;redraw();say('Erro: '+(e.name==='AbortError'?'a IA demorou demais. Tente de novo.':e.message),'err')}}
const FR_A=['Hoje nos reunimos para anunciar uma esperança que não se apaga.','Mesmo quando os dias são difíceis, a fé nos lembra que não caminhamos sozinhos.','A Palavra de Deus nos convida a olhar além das circunstâncias.','Nossa esperança não está no que vemos, mas naquele em quem confiamos.','Cada promessa do Senhor é um convite à coragem e à perseverança.','Que nossa voz anuncie o amor de Cristo a quem precisa de esperança.'];
const FR_B=['Que nossa fé se transforme em amor.','Que nossa espera seja acompanhada de serviço.','Que nossas palavras transmitam paz.','Que nossa igreja permaneça unida.','Que cada família encontre consolo em Cristo.','E que todos estejamos preparados para o encontro com o Senhor.'];
function modeloPeca(){
 const p=payload(),n=p.pessoas,who=Array.from({length:n},(_,i)=>(p.nomes[i]||'ATOR '+(i+1)).toUpperCase());
 const L=['PEÇA — '+(p.tema||'Uma história de fé').toUpperCase(),p.ocasiao+' · '+p.duracao+' · '+n+' atores · estilo '+p.estilo.toLowerCase(),'','PERSONAGENS'];
 who.forEach((w,i)=>L.push('• '+w+' — '+(i===0?'protagonista, enfrenta o desafio da história':i===1?'amigo ou familiar que oferece apoio':'personagem de apoio (descreva aqui)')));
 L.push('','[CENA 1 — Apresentação do problema]','[Descreva o cenário e a entrada dos atores.]',who[0]+': (em tom preocupado) Não sei o que fazer diante disso…');
 if(who[1])L.push(who[1]+': Calma. Lembre-se de que não estamos sozinhos.');
 L.push('','[CENA 2 — O ponto de virada]',p.referencia?'[Leitura de '+p.referencia+' — ler da Bíblia e conferir o texto antes da apresentação.]':'[Leitura de uma passagem bíblica adequada ao tema — conferir o texto na Bíblia.]',who[0]+': Agora entendo o que Deus quer me dizer.','','[CENA 3 — Desfecho]',who[Math.min(2,n-1)]+': Que mensagem fica para todos nós hoje?','TODOS: Confiar em Deus muda tudo!','','[Encerramento. Luzes baixas; breve silêncio.]');
 J.text=L.join('\n');J.view='roteiro';J.id=null;redraw();toOut();say('Estrutura criada. Escreva as cenas na aba “Editar texto” ou gere com IA.','ok')}
function modelo(){
 if(isPeca())return modeloPeca();
 const p=payload(),n=p.pessoas,who=Array.from({length:n},(_,i)=>(p.nomes[i]||'PARTICIPANTE '+(i+1)).toUpperCase());
 const L=['JOGRAL — '+(p.tema||'A esperança em Jesus').toUpperCase(),p.ocasiao+' · '+p.duracao+' · '+n+' participantes · estilo '+p.estilo.toLowerCase(),'','[Música instrumental suave. Os participantes formam um semicírculo.]',''];
 who.forEach((w,i)=>L.push(w+': '+FR_A[i%FR_A.length]));
 L.push('','TODOS: Nossa esperança está em Jesus!','',p.referencia?'[Leitura bíblica: '+p.referencia+' — ler da Bíblia e conferir o texto antes da apresentação.]':'[Leitura bíblica: escolha e confira uma passagem adequada ao tema.]','','[Pausa. Música instrumental; todos olham para a congregação.]','');
 who.forEach((w,i)=>L.push(w+': '+FR_B[i%FR_B.length]));
 L.push('','TODOS (com firmeza): Até aquele grande dia, permaneceremos firmes na esperança!','','[Encerramento. Breve silêncio; a música diminui aos poucos.]');
 J.text=L.join('\n');J.view='roteiro';J.id=null;redraw();toOut();say('Modelo criado. Personalize as falas para o seu tema na aba “Editar texto”.','ok')}
function salvar(){
 const t=J.text.trim();if(!t)return;const now=new Date().toISOString();
 const i=J.id?saved.findIndex(s=>s.id===J.id):-1;
 if(i>=0){saved[i]={...saved[i],title:titleOf(t),text:J.text,at:now};}
 else{J.id='j'+Date.now().toString(36);saved.unshift({id:J.id,title:titleOf(t),text:J.text,at:now});saved=saved.slice(0,MAX_SAVED)}
 persist();redraw();say('Jogral salvo neste aparelho.','ok')}
function abrir(i){const s=saved[i];if(!s)return;J.text=s.text;J.id=s.id;J.view='roteiro';redraw();say('“'+s.title+'” aberto.','ok');const o=document.querySelector('.jg-out');if(o&&o.scrollIntoView)o.scrollIntoView({behavior:'smooth',block:'start'})}
async function apagar(i){const s=saved[i];if(!s)return;const ok=window.IASDDialog&&IASDDialog.confirm?await IASDDialog.confirm('Apagar “'+s.title+'”?'):confirm('Apagar “'+s.title+'”?');if(!ok)return;saved.splice(i,1);persist();if(J.id===s.id)J.id=null;redraw()}
async function copiar(){try{await navigator.clipboard.writeText(J.text);say('Roteiro copiado.','ok')}catch(e){say('Não foi possível copiar. Selecione o texto na aba “Editar texto”.','err')}}
function waText(){
 return parse(J.text).map(r=>r.k==='gap'?'':r.k==='title'?'*'+(r.peca?'PEÇA':'JOGRAL')+' — '+r.t+'*':r.k==='scene'?'*['+r.t+']*':r.k==='castH'?'*Personagens*':r.k==='cast'?'• '+r.t:r.k==='meta'?'_'+r.t+'_':r.k==='dir'?'_['+r.t+']_':r.k==='say'?'*'+r.who+(r.how?' ('+r.how+')':'')+':* '+r.t:r.t).join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n\n_Criado no IASD APP · Palavra em Cena_'}
async function whatsapp(){
 if(!J.text.trim())return;
 const full=waText();
 try{if(navigator.share&&/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){await navigator.share({text:full});say('Compartilhado.','ok');return}}catch(e){if(e&&e.name==='AbortError')return}
 let t=full,cut=false;
 while(encodeURIComponent(t).length>6500){t=t.slice(0,Math.floor(t.length*0.9));cut=true}
 if(cut){t=t.replace(/\n[^\n]*$/,'')+'\n…(roteiro cortado; o completo está no IASD APP)';try{await navigator.clipboard.writeText(full)}catch(e){}}
 const w=window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank','noopener');
 say(w?(cut?'WhatsApp aberto. O roteiro era longo: o texto completo foi copiado, cole na conversa para enviar inteiro.':'WhatsApp aberto. Escolha a conversa para enviar.'):'Permita abrir janelas neste navegador para compartilhar no WhatsApp.',w?'ok':'warn')}
function imprimir(){
 if(!J.text.trim())return;const w=window.open('','_blank');if(!w){say('Permita a janela de impressão neste navegador.','warn');return}
 const rows=parse(J.text).map(r=>r.k==='gap'?'<div class="g"></div>':r.k==='title'?'<h1>'+esc(r.t)+'</h1>':r.k==='scene'?'<h2>'+esc(r.t)+'</h2>':r.k==='castH'?'<h3>Personagens</h3>':r.k==='cast'?'<p class="c">• '+esc(r.t)+'</p>':r.k==='meta'?'<p class="m">'+esc(r.t)+'</p>':r.k==='dir'?'<p class="d">['+esc(r.t)+']</p>':r.k==='say'?'<p class="s"><b>'+esc(r.who)+(r.how?' <i>('+esc(r.how)+')</i>':'')+'</b>'+esc(r.t)+'</p>':'<p>'+esc(r.t)+'</p>').join('');
 w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>'+(isPeca()?'Peça':'Jogral')+' — '+esc(titleOf(J.text))+'</title><style>body{font:17px/1.6 Georgia,serif;max-width:760px;margin:36px auto;padding:0 22px;color:#16202e}h1{font:800 28px/1.15 system-ui,sans-serif;margin:0 0 6px}.m{color:#5a6678;margin:0 0 16px;font:14px system-ui,sans-serif}.d{color:#6b7280;font-style:italic;margin:10px 0}.s{margin:8px 0;display:grid;grid-template-columns:150px 1fr;gap:12px}.s b{font:700 13px/1.7 system-ui,sans-serif;letter-spacing:.04em;color:#1d4ed8}.s b i{font-weight:500;color:#6b7280}.g{height:8px}h2{font:700 15px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;margin:20px 0 6px;color:#1d4ed8}h3{font:700 14px system-ui,sans-serif;margin:14px 0 4px}.c{margin:2px 0;font-size:15px}@media print{body{margin:0}}</style></head><body>'+rows+'</body></html>');
 w.document.close();w.focus();setTimeout(()=>w.print(),250)}
/* ---------- modo ensaio (tela cheia) ---------- */
let P=null;
function ensaio(){
 let steps=parse(J.text).filter(r=>r.k==='say');if(!steps.length)steps=parse(J.text).filter(r=>r.k==='txt').map(r=>({k:'say',who:'',how:'',t:r.t}));if(!steps.length){say('Não há falas no formato NOME: fala para ensaiar.','warn');return}
 P={steps,i:0};const o=document.createElement('div');o.id='jg-play';o.className='jg-play';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');document.body.append(o);document.body.classList.add('jg-lock');paintPlay();
 o.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b){const a=b.dataset.a;if(a==='x')closePlay();else step(a==='n'?1:-1);return}const r=o.getBoundingClientRect();if(e.target.closest('.jg-pbar'))return;step(e.clientX>r.left+r.width*.3?1:-1)});
 document.addEventListener('keydown',keys)}
function keys(e){if(!P){document.removeEventListener('keydown',keys);return}if(e.key==='Escape')closePlay();else if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'){e.preventDefault();step(1)}else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();step(-1)}}
function step(d){if(!P)return;P.i=Math.max(0,Math.min(P.steps.length-1,P.i+d));paintPlay()}
function closePlay(){const o=document.getElementById('jg-play');if(o)o.remove();document.body.classList.remove('jg-lock');document.removeEventListener('keydown',keys);P=null}
function paintPlay(){
 const o=document.getElementById('jg-play');if(!o||!P)return;const s=P.steps[P.i],n=P.steps.length;
 const nxt=P.steps.slice(P.i+1).find(x=>x.k==='say');
 let main;
 if(s.k==='say'){const all=/^TODOS\b/.test(s.who);main=(s.who?'<div class="jg-pwho'+(all?' all':'')+'" style="--h:'+hue(s.who)+'">'+(all?'✦ ':'')+esc(s.who)+(s.how?' <small>'+esc(s.how)+'</small>':'')+'</div>':'')+'<p class="jg-ptxt">'+esc(s.t)+'</p>'}
 else if(s.k==='dir')main='<p class="jg-pdir">'+esc(s.t)+'</p>';
 else main='<p class="jg-ptitle">'+esc(s.t)+'</p>';
 o.innerHTML='<div class="jg-ptop"><span>'+(P.i+1)+' / '+n+'</span><button type="button" data-a="x" aria-label="Fechar">'+I('x',22)+'</button></div><div class="jg-pmain">'+main+'</div>'+(nxt&&nxt.who?'<div class="jg-pnext">Próxima: <b>'+esc(nxt.who)+'</b></div>':'')+'<div class="jg-pbar"><button type="button" data-a="p" aria-label="Anterior"'+(P.i?'':' disabled')+'>'+I('left',26)+'</button><div class="jg-prog"><i style="width:'+Math.round((P.i+1)/n*100)+'%"></i></div><button type="button" data-a="n" aria-label="Próxima"'+(P.i<n-1?'':' disabled')+'>'+I('right',26)+'</button></div>'}
window.IASDJogral={tipo(t){if(J.tipo===t)return;J.tipo=t;J.estilo=0;redraw()},page,gerar,modelo,salvar,abrir,apagar,copiar,imprimir,ensaio,whatsapp,
 set(k,v){J[k]=v;if(k==='nomes'){const s=document.querySelector('.jg-more summary i');}},
 tema(i){J.tema=TEMAS[i];redraw()},ocasiao(i){J.ocasiao=i;redraw()},estilo(i){J.estilo=i;redraw()},dur(i){J.dur=i;redraw()},
 n(d){J.n=Math.max(2,Math.min(30,J.n+d));const o=document.getElementById('jg-n');if(o)o.textContent=J.n},
 view(v){J.view=v;redraw()},text(v){J.text=v;const s=document.querySelector('.jg-stats');if(s)s.textContent=stats(v)},more(o){J.more=o}};
})();
