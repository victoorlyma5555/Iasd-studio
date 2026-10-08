/* Sala de Estudo (fase fundador): cursos e lições editáveis, estudo individual salvo na conta,
   sala ao vivo sincronizada (classe/dupla) com voz e vídeo (WebRTC) e projeção no telão. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jq=v=>esc(JSON.stringify(String(v)));/* literal JS seguro dentro de onclick="..." */
const cloud=()=>window.iasdCloud||null;
const user=()=>{try{return typeof window.iasdCurrentUser==='function'?window.iasdCurrentUser():null}catch(e){return null}};
const isF=()=>{try{return !!user()&&!!window.IASDAccess&&IASDAccess.canStudy(cloudRole)}catch(e){return false}};
const rid=()=>Math.random().toString(36).slice(2,9);
const $=id=>document.getElementById(id);
const toast=m=>{try{IASDPages.toast(m)}catch(e){}let t=$('bb-toast');if(!t){t=document.createElement('div');t.id='bb-toast';t.className='bb-toast';document.body.appendChild(t)}t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2400)};
const OVDD=['A Bíblia Sagrada','A Beleza da Criação Divina','A Origem do Mal','O Plano da Salvação','Fé, Arrependimento e Confissão','Sinais da Volta de Cristo','A Volta de Cristo','O Milênio','A Verdade Sobre a Morte','A Nova Terra','Salvação pela Graça','O Santuário de Deus','O Juízo','As Leis na Bíblia','A Lei Moral','O Mandamento Esquecido','Do Sábado para o Domingo','Princípios de Saúde','O Dom de Profecia','O Dízimo','Ofertar, um Ato de Adoração','Como Identificar a Igreja Verdadeira','Porque Devo Ser Batizado','Princípios da Vida Cristã','Educação Cristã','A Vida no Espírito','Um Ministério para Todos'];
const LS_PROG='iasd-study-prog-',SEED_OLD=['Jesus e as Sagradas Escrituras','Jesus e o amor divino','Jesus e a restauração do bem','Jesus e a oração','Jesus e a salvação','Jesus e a intercessão','Jesus e o destino do mundo','Jesus e a vida eterna','Jesus e o juízo','Jesus e a lei de Deus','Jesus e o sábado','Jesus e a igreja','Jesus e o crescimento espiritual','Jesus e a fidelidade','Jesus e o batismo','Jesus e o estilo de vida cristão','Jesus e a missão da igreja','Jesus e o dom de profecia','Jesus e o Espírito Santo','Jesus e a nova terra'];
let TURN_DYN=null;
const ICE=()=>({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}].concat(TURN_DYN||[],window.IASD_TURN||[]),iceCandidatePoolSize:4});
async function loadTurn(){if(TURN_DYN)return;try{const c=new AbortController(),t=setTimeout(()=>c.abort(),4500);const r=await fetch('/api/turn',{signal:c.signal,cache:'no-store'});clearTimeout(t);if(r.ok){const j=await r.json();if(Array.isArray(j.iceServers))TURN_DYN=j.iceServers}}catch(e){}}

const S={view:'home',courses:null,err:'',cid:null,li:0,edit:false,prog:{},room:null,openV:{},sent:{},verdict:{}};
const course=()=>(S.courses||[]).find(c=>c.id===S.cid)||null;
const GN='iasd-study-guest-name';
const guestName=()=>{try{return (localStorage.getItem(GN)||'').trim()}catch(e){return ''}};
const myName=()=>{try{const p=myProfile;if(p&&p.full_name)return p.full_name}catch(e){}const u=user();const n=u&&(u.user_metadata?.full_name||(u.email||'').split('@')[0]);return n||guestName()||(isF()?'Fundador':'Convidado')};
const urlCode=()=>{try{return (new URLSearchParams(location.search).get('sala')||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)}catch(e){return ''}};

/* ---------- dados ---------- */
function sqlMsg(e){const m=(e&&e.message)||String(e);return /does not exist|schema cache|relation|function/i.test(m)?'Falta rodar o SQL docs/supabase-estudo.sql no Supabase.':/permiss|policy|row-level/i.test(m)?'Seu cargo não tem acesso a esta área.':m}
async function load(){
 const c=cloud();if(!c||!isF())return;
 try{
  let r=await c.from('iasd_study_courses').select('*').order('created_at');if(r.error)throw r.error;
  let seeded='';try{seeded=localStorage.getItem('iasd-study-seed')||''}catch(e){}
  if(!r.data.some(x=>x.title==='Ouvindo a Voz de Deus')&&!/ovdd/.test(seeded)){
   const seed={title:'Ouvindo a Voz de Deus',description:'Estudo bíblico em 27 lições. Use “Importar lições” para carregar o conteúdo do estudo, ou “Editar curso” para montar à mão.',lessons:OVDD.map(t=>({title:t,blocks:[]}))};
   const ins=await c.from('iasd_study_courses').insert(seed).select();if(ins.error)throw ins.error;
   try{localStorage.setItem('iasd-study-seed',seeded+'ovdd')}catch(e){}
   r={data:[ins.data[0]].concat(r.data)};
  }
  S.courses=r.data.map(prepareCourse);S.err='';
  if(S.cid&&!course())S.cid=null;
  if(S.cid)await loadProg();
 }catch(e){S.err=sqlMsg(e);S.courses=S.courses||[]}
 paint();
}
async function loadProg(){
 const id=S.cid,u=user(),account=u?.id||'guest',key=progressKey(id);let loc={};try{loc=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}
 S.prog=migrateProgress(loc,course());
 try{if(!u)return;const r=await cloud().from('iasd_study_progress').select('data,updated_at').eq('course_id',id).eq('user_id',u.id).maybeSingle();if(r.error)throw r.error;
  if(S.cid!==id||(user()?.id||'guest')!==account)return;
  if(r.data?.data){const remote=migrateProgress(r.data.data,course());for(const k in remote){const local=S.prog[k];if(!local||(remote[k].updated||0)>(local.updated||0))S.prog[k]=remote[k];}}
  localStorage.setItem(key,JSON.stringify(S.prog));window.IASDStudyMe?.migrateCourse(id,course()?.lessons||[]);
 }catch(e){saveStatus('Não foi possível buscar o progresso na nuvem. As respostas deste aparelho foram preservadas.',true);}
}
let saveT=null,courseT=null;
function progressKey(id=S.cid){const u=user();return LS_PROG+(u?u.id:'guest')+'-'+(id||'sala');}
function lessonKey(li){const R=S.room,l=R&&!R.host&&R.lesson&&R.lesson.li===li?R.lesson:course()?.lessons[li];return l?.id||String(li);}
function migrateProgress(data,c){const out={...data};for(const l of c?.lessons||[]){const old=String(l.legacyIndex);if(l.legacyIndex!=null&&out[old]){if(!out[l.id])out[l.id]=out[old];delete out[old];}}return out;}
function prepareCourse(c){for(const [i,l]of (c.lessons||[]).entries()){if(!l.id){let hash=2166136261;for(const ch of c.id+'|'+l.title+'|'+(l.blocks||[]).map(b=>b.id).join('|'))hash=Math.imul(hash^ch.charCodeAt(0),16777619);l.id='lesson-'+(hash>>>0).toString(36)+'-'+i;l.legacyIndex=i;}}return c;}
function saveStatus(text,error=false){const root=$('es-root');if(!root)return;let el=$('es-save-status');if(!el){el=document.createElement('p');el.id='es-save-status';el.setAttribute('role','status');el.className='es-note';root.prepend(el);}el.textContent=text;el.classList.toggle('es-err',error);}
function saveProg(){
 const id=S.cid,u=user(),key=progressKey(id),data=JSON.parse(JSON.stringify(S.prog));
 try{localStorage.setItem(key,JSON.stringify(data));saveStatus(u?'Salvando…':'Salvo neste aparelho.');}catch(e){saveStatus('Não foi possível salvar neste aparelho.',true);}
 clearTimeout(saveT);if(!u||!id||!isF())return;
 saveT=setTimeout(async()=>{try{if(user()?.id!==u.id)return;const r=await cloud().from('iasd_study_progress').upsert({user_id:u.id,course_id:id,data,updated_at:new Date().toISOString()});if(r.error)throw r.error;if(user()?.id===u.id&&S.cid===id)saveStatus('Progresso salvo.');}catch(e){if(user()?.id===u.id&&S.cid===id)saveStatus('Salvo neste aparelho. Falha na nuvem: '+sqlMsg(e),true);}},900);
}
function saveCourse(now){
 const c=course();if(!c)return;clearTimeout(courseT);
 const run=async()=>{try{const r=await cloud().from('iasd_study_courses').update({title:c.title,description:c.description,lessons:c.lessons,updated_at:new Date().toISOString()}).eq('id',c.id);if(r.error)throw r.error}catch(e){toast('Não salvou: '+sqlMsg(e))}};
 if(now)run();else courseT=setTimeout(run,700);
}
const lesson=()=>{const c=course();return c&&c.lessons[S.li]||null};
const lp=li=>{const k=lessonKey(li);return S.prog[k]||(S.prog[k]={a:{},d:false});};

/* ---------- versículos ---------- */
function parseRef(t){try{return IASDBibleRef.parse(t,bibleBooks)}catch(e){return null}}
async function verseHtml(ref){
 const r=parseRef(ref);if(!r)return '<em>Referência não reconhecida.</em>';
 try{
  const vs=await fetchBibleChapter(r.book,r.chapter,"nvi");
  const from=r.from||1,to=r.from?(r.to||r.from):Math.min(vs.length?vs[vs.length-1].verse:1,40);
  const pick=vs.filter(v=>v.verse>=from&&v.verse<=to);
  if(!pick.length)return '<em>Versículo não encontrado.</em>';
  return pick.map(v=>'<p><sup>'+v.verse+'</sup> '+esc(String(v.text).trim())+'</p>').join('');
 }catch(e){return '<em>Não foi possível carregar agora.</em>'}
}

/* ---------- páginas ---------- */
const I=n=>{try{return IASDUI.icon?IASDUI.icon(n):''}catch(e){return ''}};
function page(){
 return '<div class="pg es" id="es-root"><div class="pg-card pg-empty">Carregando…</div></div>';
}
function after(){if(!isF()){paint();paintBar();paintDock();tryResume();return}if(S.courses===null)load().then(tryResume);else{paint();tryResume()}paintBar();paintDock()}
function paint(){
 const root=$('es-root');if(!root)return;
 {const cc=$('es-chat');if(cc&&cc.parentNode!==document.body){document.body.appendChild(cc);cc.classList.remove('inline')}}
 if(S.room&&S.room.mode==='lobby'){root.innerHTML=lobbyHTML();paintChat();paintDock();return}
 if(S.room&&!S.room.host&&!S.room.lesson){root.innerHTML=waitHTML();return}
 if(!isF()){root.innerHTML=(S.view==='lesson'&&S.room&&lessonSrc())?lessonHTML():guestHTML();afterPaint();return}
 if(S.err&&!(S.courses||[]).length){root.innerHTML='<div class="pg-card"><h2>Sala de Estudo</h2><p class="es-err">'+esc(S.err)+'</p><button class="pg-gold" onclick="IASDEstudo.reload()">Tentar de novo</button></div>';return}
 if(S.view==='lesson'&&lessonSrc())root.innerHTML=lessonHTML();
 else if(S.view==='course'&&course())root.innerHTML=courseHTML();
 else root.innerHTML=homeHTML();
 afterPaint();
}
function guestHTML(){
 const code=(S.room&&S.room.code)||urlCode(),nm=guestName();
 const hero='<div class="es-hero"><div><span class="es-kick">ESTUDO BÍBLICO</span><h1>Sala de <em>Estudo</em></h1><p>Entre na sala com o código que o dirigente passou. Funciona no celular e no computador, com voz e vídeo.</p></div></div>';
 if(S.room)return hero+'<section class="pg-card"><h2 class="es-h">🎥 Você está na sala <b>'+esc(S.room.code)+'</b></h2><p class="muted">Aguardando o dirigente começar a lição…</p><button class="pg-ghost es-wide" onclick="IASDEstudo.leaveAsk()">Sair da sala</button></section>';
 return hero+'<section class="pg-card"><h2 class="es-h">🎥 Entrar na sala</h2>'
  +'<label class="es-lb">Seu nome<input id="es-gname" class="es-in" maxlength="40" autocomplete="name" placeholder="Como quer ser chamado" value="'+esc(nm)+'"></label>'
  +'<label class="es-lb">Código da sala<input id="es-code" class="es-in" maxlength="8" placeholder="CÓDIGO" autocomplete="off" autocapitalize="characters" value="'+esc(code)+'"></label>'
  +'<button class="pg-gold es-wide" onclick="IASDEstudo.joinRoom()">Entrar na sala</button>'
  +'<small class="es-note">Você acompanha a lição e participa por voz e vídeo. Os cursos e as respostas dos membros não ficam visíveis.</small></section>';
}
function waitHTML(){
 const R=S.room,h=Object.values(R.peers).find(p=>p.host);
 return '<div class="es-hero"><div><span class="es-kick">SALA '+esc(R.code)+'</span><h1>Quase <em>lá</em></h1><p>O dirigente está escolhendo a lição. Assim que ele abrir, ela aparece aqui para todos.</p></div></div>'
  +'<div class="pg-card es-waitc"><div class="es-wdots"><i></i><i></i><i></i></div><p class="muted">'+(h?'O dirigente está na sala.':'Aguardando o dirigente entrar…')+' Enquanto isso, use o chat e as reações.</p><button class="pg-ghost es-wide" onclick="IASDEstudo.leaveAsk()">Sair da sala</button></div>';
}
function homeHTML(){
 const cs=S.courses||[];
 return '<div class="es-hero"><div><span class="es-kick">ESTUDO BÍBLICO</span><h1>Sala de <em>Estudo</em></h1><p>Estude sozinho ou ao vivo com sua classe — no PC ou no celular, com voz e vídeo, tudo sincronizado.</p></div><span class="es-beta">TESTE · só fundador</span></div>'
 +'<div class="es-grid">'
 +'<section class="pg-card"><h2 class="es-h">📚 Meus cursos</h2>'+(cs.length?cs.map(c=>{const n=c.lessons.length;return '<button class="es-course" onclick="IASDEstudo.openCourse('+jq(c.id)+')"><b>'+esc(c.title)+'</b><small>'+n+' lição(ões)</small><span>›</span></button>'}).join(''):'<p class="muted">Nenhum curso ainda.</p>')
 +'<button class="pg-ghost es-wide" onclick="IASDEstudo.newCourse()">＋ Novo curso</button></section>'
 +'<section class="pg-card"><h2 class="es-h">🎥 Sala ao vivo</h2>'
 +(S.room?'<p class="muted">Você está na sala <b>'+esc(S.room.code)+'</b>.</p><button class="pg-gold es-wide" onclick="IASDEstudo.backToRoom()">Voltar à sala</button>'
  :'<p class="muted">Crie uma sala e passe o código, ou entre numa sala existente. O dirigente conduz e todos acompanham a mesma lição.</p>'
  +'<button class="pg-gold es-wide" onclick="IASDEstudo.createRoom()">Criar sala (sou o dirigente)</button>'
  +'<div class="es-join"><input id="es-code" maxlength="8" placeholder="CÓDIGO" autocomplete="off" autocapitalize="characters"><button class="pg-ghost" onclick="IASDEstudo.joinRoom()">Entrar</button></div>')
 +'<small class="es-note">Voz e vídeo funcionam direto entre os aparelhos. Em algumas redes 4G pode ser preciso um servidor de apoio (TURN).</small></section>'
 +'</div>';
}
function pct(c,id){let d=0;(c.lessons||[]).forEach((l,i)=>{if(lp(i).d)d++});return c.lessons.length?Math.round(d*100/c.lessons.length):0}
function courseHTML(){
 const c=course(),p=pct(c);
 return '<div class="es-top"><button class="pg-ghost" onclick="IASDEstudo.home()">‹ Cursos</button></div>'+(S.room&&S.room.host?'<div class="es-roomb"><b>Sala '+esc(S.room.code)+'</b><span>Os alunos estão aguardando. Toque numa lição para abrir à turma, ou convide pelo painel ⚙.</span></div>':'')
 +'<div class="pg-card es-chead">'+(S.edit?'<input class="es-in es-title" value="'+esc(c.title)+'" oninput="IASDEstudo.setCourse(\'title\',this.value)"><textarea class="es-in" rows="2" oninput="IASDEstudo.setCourse(\'description\',this.value)" placeholder="Descrição">'+esc(c.description)+'</textarea>':'<h2 class="es-h">'+esc(c.title)+'</h2><p class="muted">'+esc(c.description)+'</p>')
 +'<div class="es-prog"><i style="width:'+p+'%"></i></div><small>'+p+'% concluído</small>'
 +'<div class="es-row"><button class="pg-ghost" onclick="IASDEstudo.importPick()">⬆ Importar lições</button><input type="file" id="es-file" accept=".json,application/json" hidden onchange="IASDEstudo.importFile(this)"><button class="pg-ghost" onclick="IASDEstudo.toggleEdit()">'+(S.edit?'✔ Concluir edição':'✎ Editar curso')+'</button>'+(S.edit?'<button class="pg-ghost" onclick="IASDEstudo.addLesson()">＋ Lição</button><button class="pg-danger" onclick="IASDEstudo.delCourse()">Excluir curso</button>':'')+'</div></div>'
 +'<div class="es-lessons">'+c.lessons.map((l,i)=>{const d=lp(i).d,n=(l.blocks||[]).length,ans=Object.values(lp(i).a||{}).filter(Boolean).length;
  return '<div class="es-lrow'+(d?' done':'')+'"><button class="es-lbtn" onclick="IASDEstudo.openLesson('+i+')"><span class="es-n">'+(d?'✔':(i+1))+'</span><span><b>'+esc(l.title)+'</b><small>'+(n?n+' itens'+(ans?' · '+ans+' respondida(s)':''):'sem conteúdo ainda')+'</small></span></button>'
  +(S.edit?'<span class="es-mv"><button onclick="IASDEstudo.moveLesson('+i+',-1)" aria-label="Subir">▲</button><button onclick="IASDEstudo.moveLesson('+i+',1)" aria-label="Descer">▼</button><button onclick="IASDEstudo.renameLesson('+i+')" aria-label="Renomear">✎</button><button onclick="IASDEstudo.delLesson('+i+')" aria-label="Excluir">🗑</button></span>':'')+'</div>'}).join('')+'</div>';
}
/* fonte da lição: dirigente usa a própria; participante usa a que o dirigente enviou */
function lessonSrc(){
 const R=S.room;
 if(R&&!R.host&&S.view==='lesson'&&R.follow&&R.lesson)return R.lesson;
 if(R&&!R.host&&R.lesson&&!course())return R.lesson;
 const l=lesson();return l?{id:l.id,li:S.li,title:l.title,blocks:l.blocks||[]}:(R&&R.lesson)||null;
}
function curBi(){return S.room?S.room.bi:-1}
function lessonHTML(){
 const L=lessonSrc(),R=S.room,host=!R||R.host,editing=S.edit&&host&&!R;
 const li=L.li!=null?L.li:S.li,P=lp(li);
 let h='<div class="es-top"><button class="pg-ghost" onclick="IASDEstudo.'+(R&&!R.host?'home':'course')+'()">‹ '+(R&&!R.host?'Sair da lição':'Lições')+'</button>'
  +(host&&!R?'<button class="pg-ghost" onclick="IASDEstudo.toggleEdit()">'+(S.edit?'✔ Concluir':'✎ Editar lição')+'</button>':'')
  +(R?'<span class="es-badge">'+(R.host?'Você conduz':(R.follow?'Seguindo o dirigente':'Leitura livre'))+'</span>'+(R.host?'':'<span class="es-badge es-awb" id="es-away" hidden></span>'):'')
  +(R&&!R.host&&!(R.lock&&R.lock.f)?'<button class="pg-ghost" onclick="IASDEstudo.toggleFollow()">'+(R.follow?'Parar de seguir':'Seguir o dirigente')+'</button>':'')+'</div>';
 h+='<div class="pg-card es-lesson"><span class="es-kick">LIÇÃO '+(li+1)+'</span>'+(editing?'<input class="es-in es-title" value="'+esc(L.title)+'" oninput="IASDEstudo.setLessonTitle(this.value)">':'<h2 class="es-h">'+esc(L.title)+'</h2>');
 if(!L.blocks.length&&!editing)h+='<p class="muted">Esta lição ainda não tem conteúdo.'+(host?' Toque em “Editar lição” e cole o texto, as perguntas e os versículos.':'')+'</p>';
 h+='<div class="es-blocks">'+L.blocks.map((b,i)=>blockHTML(b,i,li,P,editing)).join('')+'</div>';
 if(editing)h+=editorHTML();
 if(!editing&&L.blocks.length)h+='<div class="es-end"><button class="'+(P.d?'pg-ghost':'pg-gold')+'" onclick="IASDEstudo.toggleDone('+li+')">'+(P.d?'✔ Lição concluída (desfazer)':(R&&!R.host?'Concluir lição':'Marcar lição como concluída'))+'</button>'+((!R||host)?nextBtn(li):'')+'</div>';
 return h+'</div>';
}
function nextBtn(li){const c=course();if(!c||li>=c.lessons.length-1)return '';return '<button class="pg-ghost" onclick="IASDEstudo.openLesson('+(li+1)+')">Próxima lição ›</button>'}
function gl(b,i){return '<span class="es-bctl">'+(S.edit&&!S.room?'<button onclick="IASDEstudo.moveBlock('+i+',-1)">▲</button><button onclick="IASDEstudo.moveBlock('+i+',1)">▼</button><button onclick="IASDEstudo.editBlock('+i+')">✎</button><button onclick="IASDEstudo.delBlock('+i+')">🗑</button>':'')+'</span>'}
function optVals(b,P){const v=((P.a||{})[b.id]||'');if(b.kind==='vf'){const a=v.split(',');while(a.length<b.opts.length)a.push('');return a}return v}
function fmtAns(b,v){if(b.kind==='vf'){if(!/[VF]/.test(v))return ''}if(b.kind==='vf')return b.opts.map((o,i)=>(v.split(',')[i]||'—')+' · '+o).join('\n');if(b.kind==='x'){const i=+v;return isNaN(i)||v===''?'':b.opts[i]}return v}
function optsHTML(b,P,editing){
 const v=optVals(b,P),dis=editing?' disabled':'';
 if(b.kind==='vf')return '<div class="es-opts" data-oid="'+esc(b.id)+'">'+b.opts.map((o,i)=>'<div class="es-opt"><span>'+esc(o)+'</span><span class="es-vf"><button'+dis+' class="'+(v[i]==='V'?'on v':'')+'" onclick="IASDEstudo.setOpt('+jq(b.id)+','+i+',\'V\')">V</button><button'+dis+' class="'+(v[i]==='F'?'on f':'')+'" onclick="IASDEstudo.setOpt('+jq(b.id)+','+i+',\'F\')">F</button></span></div>').join('')+'</div>';
 return '<div class="es-opts" data-oid="'+esc(b.id)+'">'+b.opts.map((o,i)=>'<label class="es-opt"><input type="radio"'+dis+' name="o-'+esc(b.id)+'" '+(String(v)===String(i)?'checked':'')+' onchange="IASDEstudo.setOpt(\''+b.id+'\','+i+',\'x\')"><span>'+esc(o)+'</span></label>').join('')+'</div>';
}
function gabText(b){
 if(!b.opts||!b.keys)return '';
 if(b.kind==='vf')return b.opts.map((o,i)=>(b.keys[i]||'?')+' — '+o).join('\n');
 return b.opts.filter((o,i)=>b.keys[i]==='X').map(o=>'✔ '+o).join('\n');
}
function guideHTML(b){
 /* a resposta já vem pronta e salva: se a pergunta só tinha gabarito (V/F, alternativas), ele vira o texto da caixa */
 if(!b.guide&&b.opts&&b.keys){const g=gabText(b);if(g){b.guide=g;if(!S.room||S.room.host){clearTimeout(S.gsT);S.gsT=setTimeout(()=>saveCourse(false),600)}}}
 const h='<textarea class="es-gt" data-gid="'+esc(b.id)+'" rows="'+(b.opts?Math.min(8,b.opts.length+1):3)+'" placeholder="Escreva aqui a resposta desta pergunta (só você vê)…">'+esc(b.guide||'')+'</textarea>'+(b.note?'<p class="es-cm">'+esc(b.note)+'</p>':'');
 return '<details class="es-guide" open><summary>🔒 Resposta da pergunta (só você vê)</summary>'+h+'</details>';
}
function blockHTML(b,i,li,P,editing){
 const R=S.room,cur=R&&R.bi===i,host=!R||R.host;
 let ctl;
 if(editing)ctl=gl(b,i);
 else{ctl='<span class="es-bctl">';if(R&&R.host){ctl+='<button onclick="IASDEstudo.setPos('+i+')" title="Levar a turma para cá">▶ Levar a turma</button>';if(b.t==='q')ctl+='<button onclick="IASDEstudo.challenge(\'auto\','+i+')" title="Soltar um desafio sobre esta pergunta">🎯 Desafio</button>'}
 if(host&&b.t==='q'&&!editing)ctl+='<button class="es-exb" onclick="IASDEstudo.explain('+jq(b.id)+')" title="Explicação pronta com o ensino adventista">💡 Explicação</button>';ctl+='</span>'}
 const cls='es-b es-'+b.t+(cur?' es-cur':'');
 if(b.t==='q'){
  const chips=(b.refs||[]).length?'<div class="es-chips">'+b.refs.map((r,ri)=>'<button class="es-chip'+(S.openV[li+':'+b.id+':'+ri]?' on':'')+'" onclick="IASDEstudo.toggleVerse('+jq(li+':'+b.id+':'+ri)+','+jq(r)+')">📖 '+esc(r)+'</button>').join('')+'</div>'+b.refs.map((r,ri)=>'<div class="es-vt" data-vk="'+li+':'+b.id+':'+ri+'"></div>').join(''):'';
  const ans=(P.a||{})[b.id]||'';
  return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><b>❓ '+esc(b.text)+'</b>'+ctl+'</div>'+chips
   +(host?guideHTML(b):'')
   +(b.opts?optsHTML(b,P,editing):'<textarea class="es-ans" rows="2" data-bid="'+esc(b.id)+'" placeholder="Sua resposta…" '+(editing?'disabled':'')+'>'+esc(ans)+'</textarea>')
   +(editing?'':sendBar(b,P))
   +(R?'<div class="es-rv" data-rv="'+esc(b.id)+'"></div>':'')+'</div>';
 }
 if(b.t==='v'){
  const key=li+':'+b.id,open=S.openV[key];
  return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><button class="es-vbtn" onclick="IASDEstudo.toggleVerse('+jq(key)+','+jq(b.ref)+')">📖 '+esc(b.ref)+'</button>'+ctl+'</div><div class="es-vt" data-vk="'+esc(key)+'">'+(open||'')+'</div></div>';
 }
 if(b.t==='note')return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><b>'+esc(b.h||'')+'</b>'+ctl+'</div><p class="es-nt-p">'+esc(b.text).replace(/\n/g,'<br>')+'</p></div>';
 if(b.t==='check'){const on=(((P.a||{})[b.id])||'').split(',');return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><b>✅ '+esc(b.h||'')+'</b>'+ctl+'</div>'+(b.items||[]).map((t,k)=>'<label class="es-ck"><input type="checkbox" '+(on.includes(String(k))?'checked':'')+' onchange="IASDEstudo.toggleCheck(\''+b.id+'\','+k+')"><span>'+esc(t)+'</span></label>').join('')+'</div>'}
 if(b.t==='list')return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><b>📚 '+esc(b.h||'')+'</b>'+ctl+'</div><ol class="es-ol">'+(b.items||[]).map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol></div>';
 return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh es-th"><p>'+esc(b.text).replace(/\n/g,'<br>')+'</p>'+ctl+'</div></div>';
}
/* ---------- Enviar resposta ---------- */
function curAns(b,P){const v=((P.a||{})[b.id]||'');return b.opts?fmtAns(b,v):v}
function sendState(b,P){
 const R=S.room,t=curAns(b,P);if(!String(t).replace(/[,\s]/g,''))return 'empty';
 const sent=(S.sent[b.id]);return sent===undefined?'new':(sent===t?'ok':'chg')}
function sendBar(b,P){
 const st=sendState(b,P),R=S.room,lbl=R?'Enviar':'Salvar no perfil';
 const vd=st==='ok'&&S.verdict[b.id]?S.verdict[b.id].r:'';
 return '<div class="es-sendbar" data-sb="'+esc(b.id)+'" data-st="'+st+'" data-v="'+vd+'"><button class="es-send" onclick="IASDEstudo.sendAns('+jq(b.id)+')"'+(st==='empty'?' disabled':'')+'>'+(st==='ok'?'✔ ':'➤ ')+(st==='ok'?(R?'Enviado':'Salvo'):(st==='chg'?(R?'Enviar de novo':'Salvar de novo'):lbl))+'</button><small>'+(st==='empty'?'Escreva ou escolha sua resposta.':st==='ok'?(S.verdict[b.id]?S.verdict[b.id].msg:(R?'O dirigente já pode ver.':'Guardado no seu perfil.')):st==='chg'?'Você mudou a resposta.':(R?'O dirigente só vê quando você envia.':'Guarde no seu perfil.'))+'</small></div>'}
function paintSend(bid){
 const L=lessonSrc();if(!L)return;const li=L.li!=null?L.li:S.li,b=L.blocks.find(x=>x.id===bid);if(!b)return;
 document.querySelectorAll('[data-sb="'+bid+'"]').forEach(el=>{el.outerHTML=sendBar(b,lp(li))})}
function courseInfo(){const c=course(),R=S.room;
 if(c&&!(R&&!R.host&&R.course))return {id:c.id,title:c.title,total:(c.lessons||[]).length};
 if(R&&R.course)return R.course;return {id:'sala',title:'Estudo',total:0}}
function saveToMe(li,b,text){try{const ci=courseInfo(),L=lessonSrc();window.IASDStudyMe&&IASDStudyMe.rec(ci.id,ci.title,ci.total,lessonKey(li),L&&L.title,b.id,b.text,text)}catch(e){console.warn(e)}}
function explain(bid){
 const L=lessonSrc();if(!L||!window.IASDGuia)return;const b=L.blocks.find(x=>x.id===bid);if(!b)return;
 const x=IASDGuia.explain(b,L.title),R=S.room;
 const old=$('es-exp');if(old)old.remove();
 const el=document.createElement('div');el.id='es-exp';el.className='es-expw';
 el.innerHTML='<div class="es-expb" role="dialog" aria-label="Explicação pronta"><div class="es-exph"><b>💡 Explicação pronta</b><button class="es-expx" aria-label="Fechar">✕</button></div><div class="es-expc">'+x.html+'</div><div class="es-expf">'+(R&&R.host?'<button class="pg-gold" data-a="share">📣 Mostrar à turma</button>':'')+'<button class="pg-ghost" data-a="x">Fechar</button></div></div>';
 el.addEventListener('click',e=>{const a=e.target.dataset&&e.target.dataset.a;if(e.target===el||e.target.classList.contains('es-expx')||a==='x'){el.remove();return}
  if(a==='share'){send('exp',{q:b.text,t:x.share,r:x.refs.slice(0,4)});toast('Explicação mostrada à turma.');el.remove()}});
 document.body.appendChild(el)}
function showExp(p){const old=$('es-exp');if(old)old.remove();const el=document.createElement('div');el.id='es-exp';el.className='es-expw';
 el.innerHTML='<div class="es-expb"><div class="es-exph"><b>💡 Explicação do dirigente</b><button class="es-expx" aria-label="Fechar">✕</button></div><div class="es-expc"><div class="eg-q">'+esc(p.q||'')+'</div><p>'+esc(p.t||'').replace(/\n/g,'<br>')+'</p>'+((p.r||[]).length?'<div class="eg-refs">'+p.r.map(r=>'<span>📖 '+esc(r)+'</span>').join('')+'</div>':'')+'</div><div class="es-expf"><button class="pg-ghost" data-a="x">Fechar</button></div></div>';
 el.addEventListener('click',e=>{if(e.target===el||e.target.classList.contains('es-expx')||(e.target.dataset&&e.target.dataset.a==='x'))el.remove()});document.body.appendChild(el)}
function markMe(li,bid,r){try{const ci=courseInfo();window.IASDStudyMe&&IASDStudyMe.mark(ci.id,lessonKey(li),bid,r)}catch(e){}}
/* o dirigente (que tem a resposta-guia) corrige o que chega e devolve o resultado só para quem enviou */
function gradeIncoming(m){
 const R=S.room;if(!R||!R.host||!window.IASDGuia)return;const L=lessonSrc();const b=L&&L.blocks.find(x=>x.id===m.bid);if(!b)return;
 const g=(b.opts&&b.keys)?IASDGuia.grade(b,m.raw!=null?m.raw:m.text):null;if(g)send('gr',{to:m.id,bid:m.bid,r:g.r,msg:g.msg})}
function sendAns(bid){
 const L=lessonSrc();if(!L)return;const li=L.li!=null?L.li:S.li,b=L.blocks.find(x=>x.id===bid);if(!b)return;
 const t=curAns(b,lp(li));if(!String(t).replace(/[,\s]/g,'')){toast('Escreva ou escolha sua resposta primeiro.');return}
 const R=S.room;
 if(R){(R.ans[bid]=R.ans[bid]||{})[R.me]={name:myName(),text:t};send('ans',{bid,id:R.me,name:myName(),text:t,raw:(lp(li).a||{})[bid]||''})}
 delete S.verdict[bid];
 if(!R||R.host){try{const g=(b.opts&&b.keys&&window.IASDGuia)?IASDGuia.grade(b,(lp(li).a||{})[bid]||''):null;if(g){S.verdict[bid]=g;markMe(li,bid,g.r)}}catch(e){}}
 S.sent[bid]=t;saveToMe(li,b,t);paintSend(bid);if(R)paintReveals();
 toast(R?'Resposta enviada ✔':(window.IASDStudyMe&&IASDStudyMe.isGuest()?'Resposta guardada neste aparelho.':'Resposta salva no seu perfil ✔'))}
function editorHTML(){
 return '<div class="es-editor"><h3>Adicionar à lição</h3>'
 +'<div class="es-row"><button class="pg-ghost" onclick="IASDEstudo.addBlock(\'text\')">＋ Texto</button><button class="pg-ghost" onclick="IASDEstudo.addBlock(\'q\')">＋ Pergunta</button><button class="pg-ghost" onclick="IASDEstudo.addBlock(\'v\')">＋ Versículo</button></div>'
 +'<label class="es-lb">Ou cole o conteúdo de uma vez</label><textarea id="es-bulk" class="es-in" rows="6" placeholder="Cole aqui. Linhas que terminam com ? viram perguntas, linhas que são só uma referência (ex.: João 3:16) viram versículos, o resto vira texto."></textarea>'
 +'<button class="pg-gold" onclick="IASDEstudo.bulk()">Converter e adicionar</button>'
 +'<small class="es-note">Use material seu ou com autorização. Os textos dos estudos oficiais pertencem à Igreja/CPB.</small></div>';
}
function afterPaint(){
 const root=$('es-root');if(!root)return;
 root.querySelectorAll('.es-ans').forEach(t=>{
  t.addEventListener('input',()=>{const L=lessonSrc(),li=L.li!=null?L.li:S.li,bid=t.dataset.bid;lp(li).a[bid]=t.value;lp(li).updated=Date.now();saveProg();dirty(bid)});
 });
 root.querySelectorAll('.es-gt').forEach(t=>{t.addEventListener('input',()=>{const L=lessonSrc(),b=L&&L.blocks.find(x=>x.id===t.dataset.gid);if(!b||(S.room&&!S.room.host))return;b.guide=t.value;saveCourse(false)})});
 root.querySelectorAll('.es-vt').forEach(el=>{const k=el.dataset.vk;if(S.openV[k])el.innerHTML=S.openV[k]});
 if(S.room){paintReveals();markCur(false)}
}
let ansT=null;
function dirty(bid){clearTimeout(dirtyT);dirtyT=setTimeout(()=>paintSendKeep(bid),250)}
let dirtyT=null;
function paintSendKeep(bid){const L=lessonSrc();if(!L)return;const li=L.li!=null?L.li:S.li,b=L.blocks.find(x=>x.id===bid);if(!b)return;document.querySelectorAll('[data-sb="'+bid+'"]').forEach(el=>{const n=document.createElement('div');n.innerHTML=sendBar(b,lp(li));el.replaceWith(n.firstChild)})}
function debounceSend(bid,text){const R=S.room;if(R)(R.ans[bid]=R.ans[bid]||{})[R.me]={name:myName(),text};clearTimeout(ansT);ansT=setTimeout(()=>{if(S.room){send('ans',{bid,id:S.room.me,name:myName(),text});paintReveals()}},700)}

/* ---------- ações (dados) ---------- */
function homeGo(){S.view='home';S.edit=false;if(S.room&&S.room.host)pushLesson();paint()}
async function openCourse(id){S.cid=id;S.view='course';S.edit=false;await loadProg();paint()}
async function openLesson(i){S.li=i;S.view='lesson';S.edit=false;if(S.room&&S.room.host)pushLesson();paint();window.scrollTo({top:0})}
function setCourse(k,v){const c=course();if(!c)return;c[k]=v;saveCourse()}
function setLessonTitle(v){const l=lesson();if(!l)return;l.title=v;saveCourse()}
async function newCourse(){const t=await IASDDialog.prompt('Nome do curso:','', {title:'Novo curso'});if(!t)return;
 const r=await cloud().from('iasd_study_courses').insert({title:t.trim(),description:'',lessons:[{title:'Lição 1',blocks:[]}]}).select();
 if(r.error){toast(sqlMsg(r.error));return}S.courses.push(r.data[0]);openCourse(r.data[0].id)}
async function delCourse(){const c=course();if(!c)return;if(!(await IASDDialog.confirm('Excluir o curso “'+c.title+'” e todo o progresso?')))return;
 const r=await cloud().from('iasd_study_courses').delete().eq('id',c.id);if(r.error){toast(sqlMsg(r.error));return}
 S.courses=S.courses.filter(x=>x.id!==c.id);S.cid=null;homeGo()}
function toggleEdit(){S.edit=!S.edit;if(!S.edit)saveCourse(true);paint()}
async function addLesson(){const c=course();c.lessons.push({id:'lesson-'+crypto.randomUUID(),title:'Lição '+(c.lessons.length+1),blocks:[]});saveCourse(true);paint()}
async function renameLesson(i){const c=course(),t=await IASDDialog.prompt('Título da lição:',c.lessons[i].title,{title:'Renomear lição'});if(t==null||!t.trim())return;c.lessons[i].title=t.trim();saveCourse(true);paint()}
async function delLesson(i){const c=course();if(!(await IASDDialog.confirm('Excluir a lição “'+c.lessons[i].title+'”?')))return;c.lessons.splice(i,1);saveCourse(true);saveProg();paint()}
function moveLesson(i,d){const c=course(),j=i+d;if(j<0||j>=c.lessons.length)return;const a=c.lessons;[a[i],a[j]]=[a[j],a[i]];saveProg();saveCourse(true);paint()}
function toggleDone(li){
 const P=lp(li);P.d=!P.d;P.updated=Date.now();saveProg();
 try{const ci=courseInfo(),L=lessonSrc(),M=window.IASDStudyMe;
  if(M&&L){
   if(P.d)(L.blocks||[]).forEach(b=>{if(b.t==='q'){const t=curAns(b,P);if(String(t).replace(/[,\s]/g,''))saveToMe(li,b,t)}});
   const r=M.done(ci.id,ci.title,ci.total,lessonKey(li),L.title,P.d);
   if(P.d&&r.trophy)setTimeout(()=>M.finish(true,r.title),300);
   else if(P.d)toast(M.isGuest()?'Lição concluída ✔':'Lição concluída e salva no seu perfil ✔');
  }}catch(e){console.warn(e)}
 paint()}
function blocks(){const l=lesson();return l?l.blocks:null}
async function addBlock(t){const b=blocks();if(!b)return;
 if(t==='text'){const x=await IASDDialog.prompt('Texto:','',{title:'Novo texto',multiline:true});if(!x)return;b.push({id:rid(),t:'text',text:x})}
 if(t==='q'){const x=await IASDDialog.prompt('Pergunta:','',{title:'Nova pergunta'});if(!x)return;const g=await IASDDialog.prompt('Resposta-guia (opcional, só você vê):','',{title:'Resposta-guia'});b.push({id:rid(),t:'q',text:x.trim(),guide:(g||'').trim()})}
 if(t==='v'){const x=await IASDDialog.prompt('Referência (ex.: João 3:16-17):','',{title:'Novo versículo'});if(!x)return;const r=parseRef(x);if(!r){toast('Referência não reconhecida.');return}
  b.push({id:rid(),t:'v',ref:r.name+' '+r.chapter+(r.from?':'+r.from+(r.to&&r.to!==r.from?'-'+r.to:''):'')})}
 saveCourse(true);paint()}
async function editBlock(i){const b=blocks()[i];if(!b)return;
 const normRef=x=>{const r=parseRef(x);return r?r.name+' '+r.chapter+(r.from?':'+r.from+(r.to&&r.to!==r.from?'-'+r.to:''):''):null};
 if(b.t==='v'){const x=await IASDDialog.prompt('Referência:',b.ref,{title:'Editar versículo'});if(!x)return;const r=normRef(x);if(!r){toast('Referência não reconhecida.');return}b.ref=r}
 else if(b.t==='q'){
  const x=await IASDDialog.prompt('Pergunta:',b.text,{title:'Editar pergunta',multiline:true});if(x==null||!x.trim())return;b.text=x.trim();
  const rf=await IASDDialog.prompt('Versículos (separe por ponto e vírgula):',(b.refs||[]).join('; '),{title:'Versículos da pergunta'});
  if(rf!=null){const list=rf.split(';').map(t=>t.trim()).filter(Boolean),out=[];for(const t of list){const r=normRef(t);if(!r){toast('Não reconheci: '+t);return}out.push(r)}b.refs=out}
  const g=await IASDDialog.prompt('Resposta-guia (só você vê):',b.guide||'',{title:'Resposta-guia',multiline:true});if(g!=null)b.guide=g;
  const n=await IASDDialog.prompt('Comentário (só você vê):',b.note||'',{title:'Comentário',multiline:true});if(n!=null)b.note=n}
 else if(b.t==='check'||b.t==='list'){const x=await IASDDialog.prompt('Um item por linha:',(b.items||[]).join('\n'),{title:'Editar “'+(b.h||'lista')+'”',multiline:true});if(x==null)return;b.items=x.split('\n').map(t=>t.trim()).filter(Boolean)}
 else{const x=await IASDDialog.prompt('Texto:',b.text,{title:'Editar',multiline:true});if(x==null||!x.trim())return;b.text=x}
 saveCourse(true);paint()}
function delBlock(i){blocks().splice(i,1);saveCourse(true);paint()}
function moveBlock(i,d){const a=blocks(),j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];saveCourse(true);paint()}
function bulk(){
 const ta=$('es-bulk'),b=blocks();if(!ta||!b)return;const lines=ta.value.split(/\n+/).map(s=>s.trim()).filter(Boolean);if(!lines.length)return;
 let buf=[];const flush=()=>{if(buf.length){b.push({id:rid(),t:'text',text:buf.join('\n')});buf=[]}};
 lines.forEach(l=>{
  const line=l.replace(/^[\-•*\d.)\s]+(?=[A-Za-zÀ-ú])/,x=>/^\d/.test(x)&&/\d+[.)]\s*$/.test(x)?'':x);
  if(/\?\s*$/.test(line)){flush();b.push({id:rid(),t:'q',text:line,guide:''});return}
  if(line.length<=34&&/\d/.test(line)){const r=parseRef(line);if(r){flush();b.push({id:rid(),t:'v',ref:r.name+' '+r.chapter+(r.from?':'+r.from+(r.to&&r.to!==r.from?'-'+r.to:''):'')});return}}
  buf.push(l);
 });
 flush();saveCourse(true);paint();toast('Conteúdo adicionado.')}
async function toggleVerse(key,ref,remote){
 const R=S.room;
 if(R&&!R.host&&!remote&&R.lock&&R.lock.v){toast('O dirigente travou os versículos. Você vê os que ele abrir.');return}
 const q=()=>document.querySelector('.es-vt[data-vk="'+key+'"]');
 if(S.openV[key]){delete S.openV[key];if(q())q().innerHTML='';if(R&&R.host&&!remote)send('vo',{key,ref,open:false});markChips();return}
 if(q())q().innerHTML='<em>Carregando…</em>';
 const h=await verseHtml(ref);
 S.openV[key]=h;if(q())q().innerHTML=h;markChips();
 if(R&&R.host&&!remote)send('vo',{key,ref,open:true});
}
function markChips(){document.querySelectorAll('.es-chip').forEach(c=>{const m=(c.getAttribute('onclick')||'').match(/toggleVerse\('([^']+)'/);if(m)c.classList.toggle('on',!!S.openV[m[1]])})}
function setOpt(bid,idx,val){
 const L=lessonSrc(),li=L.li!=null?L.li:S.li,b=L.blocks.find(x=>x.id===bid);if(!b)return;const P=lp(li);
 if(b.kind==='vf'){const a=optVals(b,P);a[idx]=a[idx]===val?'':val;P.a[bid]=a.join(',')}else P.a[bid]=String(idx);
 P.updated=Date.now();saveProg();
 document.querySelectorAll('.es-opts').forEach(old=>{if(old.getAttribute('data-oid')===bid)old.outerHTML=optsHTML(b,P,false)});
 paintSend(bid);
}
function toggleCheck(bid,k){
 const L=lessonSrc(),li=L.li!=null?L.li:S.li,P=lp(li);let a=(P.a[bid]||'').split(',').filter(x=>x!=='');
 a=a.includes(String(k))?a.filter(x=>x!==String(k)):a.concat(String(k));P.a[bid]=a.join(',');P.updated=Date.now();saveProg()}

/* ---------- sala ao vivo ---------- */
function mkCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=A[Math.floor(Math.random()*A.length)];return s}
function send(ev,payload){const R=S.room;if(!R?.ch)return Promise.resolve();R.sendChain=(R.sendChain||Promise.resolve()).then(async()=>{if(S.room!==R)return;const security=window.IASDStudyRoomSecurity;if(security.HOST.has(ev)){if(!R.host||!R.signing)return;payload=await security.sign(R.signing.privateKey,R.code,ev,payload);}const status=await R.ch.send({type:'broadcast',event:ev,payload});if(status==='error'||status==='timed out')throw Error('Falha ao enviar comando.');}).catch(e=>{toast(e.message);});return R.sendChain;}
const FX=(ev,p)=>{try{if(ev==='reset'){window.IASDEstudoFX&&IASDEstudoFX.reset();return}if(ev==='breakgo'){window.IASDEstudoFX&&IASDEstudoFX.breakGo(p.secs);return}window.IASDEstudoFX&&IASDEstudoFX.on(ev,p)}catch(e){console.warn('fx',ev,e)}};
const RK='iasd-study-room',SAVE_H=12*3600e3;
/* tempo máximo de sala SUSPENSA: passou disso, a sala fecha (para quem suspendeu e, se foi o dirigente, para todos). Ajuste aqui. */
const SUSP_MIN=10,SUSP_MS=SUSP_MIN*60e3;
function suspOver(r){return !!(r&&r.pk&&Date.now()-r.pk>SUSP_MS)}
function saveRoom(){const R=S.room;if(!R)return;try{localStorage.setItem(RK,JSON.stringify({code:R.code,host:R.host,me:R.me,cid:S.cid,li:S.li,view:S.view,mode:R.mode,lock:R.lock,soundGroup:R.soundGroup||'',ts:Date.now()}))}catch(e){}}
function clearRoom(){try{localStorage.removeItem(RK)}catch(e){}}
function applyLock(){const R=S.room;document.body.classList.toggle('es-lk-v',!!(R&&!R.host&&R.lock&&R.lock.v))}
async function startRoom(code,host,opts){
 opts=opts||{};
 const c=cloud();if(!c){toast('Sem conexão com o servidor.');return false}
 let signing=null,publicKey=null;
 try{const security=window.IASDStudyRoomSecurity;if(!security)throw Error('Atualize a página para usar a sala.');
  if(host){if(!isF())throw Error('Só o dirigente autorizado pode criar a sala.');try{signing=JSON.parse(sessionStorage.getItem('iasd-room-key-'+code)||'null')}catch{}if(!signing){signing=await security.keys();sessionStorage.setItem('iasd-room-key-'+code,JSON.stringify(signing));}const result=await c.rpc('iasd_study_room_register',{p_code:code,p_key:signing.publicKey});if(result.error)throw result.error;publicKey=signing.publicKey;}
  else{const result=await c.rpc('iasd_study_room_lookup',{p_code:code});if(result.error)throw result.error;publicKey=result.data;if(!publicKey)throw Error('Sala não encontrada ou expirada. Confira o código.');}
 }catch(e){toast('Não foi possível abrir a sala: '+sqlMsg(e));return false;}
 if(S.room&&!opts.snap)leave(true);
 const me=opts.me||rid();
 const R=S.room={code,host,me,peers:{},bi:-1,rev:{},ans:{},lesson:null,follow:true,hand:false,voice:null,ch:null,reacts:[],mode:'study',lock:{v:true,f:false,c:false,r:false},vmute:{},vhide:{},soundGroup:'',hostOpen:false,chat:[],unread:0,chatOpen:false,rxOpen:false,listOpen:false,chOpen:false,awayLast:null};
 if(opts.snap)Object.assign(R,{lesson:opts.snap.lesson,bi:opts.snap.bi,rev:opts.snap.rev,ans:opts.snap.ans,mode:opts.snap.mode,lock:opts.snap.lock,hand:opts.snap.hand,follow:opts.snap.follow,voice:opts.snap.voice,soundGroup:opts.snap.soundGroup||'',vmute:opts.snap.vmute||{},vhide:opts.snap.vhide||{},hostOpen:opts.snap.hostOpen,chat:opts.snap.chat||[],unread:opts.snap.unread||0,chatOpen:opts.snap.chatOpen});
 if(opts.saved){R.soundGroup=opts.saved.soundGroup||'';if(opts.saved.mode)R.mode=opts.saved.mode;if(opts.saved.lock)R.lock=Object.assign({v:true,f:false,c:false,r:false},opts.saved.lock)}
 applyLock();
 const ch=R.ch=c.channel('study:'+code,{config:{broadcast:{self:false},presence:{key:me}}});
 R.signing=signing;R.publicKey=publicKey;R.seen=new Set();
 function listen(ev,fn){ch.on('broadcast',{event:ev},async({payload})=>{if(S.room!==R)return;if(window.IASDStudyRoomSecurity.HOST.has(ev)){payload=await window.IASDStudyRoomSecurity.verify(R.publicKey,R.code,ev,payload,R.seen);if(!payload||S.room!==R)return;}try{await fn({payload});}catch(e){console.warn('Comando inválido da sala',ev);}});}

 listen('hello',({payload})=>{if(!R.host||R.helloT)return;R.helloT=setTimeout(()=>{R.helloT=0;if(S.room!==R)return;pushLesson(true);send('md',{mode:R.mode});send('lk',R.lock);if(R.chat.length)send('chh',{l:R.chat.slice(-30)})},600+Math.random()*600)}); /* muita gente entrando junta: uma única resposta para todos */
 listen('chat',({payload})=>addChat(payload,false));
 listen('chh',({payload})=>{if(R.host||R.chat.length||!Array.isArray(payload.l))return;payload.l.forEach(m=>addChat(m,true));paintChat()});
 listen('md',({payload})=>{if(R.host)return;R.mode=payload.mode==='lobby'?'lobby':'study';if(R.mode==='lobby')R.unread=0;
  if(R.mode==='study'&&R.lesson&&R.follow)S.view='lesson';paint();paintBar();paintDock()});
 listen('lk',({payload})=>{if(R.host)return;R.lock={v:!!payload.v,f:!!payload.f,c:!!payload.c,r:!!payload.r};applyLock();
  if(R.lock.f&&!R.follow){R.follow=true;if(R.mode==='study'&&R.lesson){S.view='lesson'}paint();markCur(true)}else paint();paintBar()});
 listen('st',({payload})=>{if(R.host)return;R.lesson=payload.lesson||null;R.bi=payload.bi;R.rev=payload.rev||{};if(payload.revKeys&&typeof payload.revKeys==='object')R.revKeys=payload.revKeys;if(payload.course)R.course=payload.course;if(R.mode==='lobby'){paintBar();return}if(!R.lesson){paint();paintBar();return}if(R.follow){S.view='lesson';paint()}else paintBar()});
 listen('pos',({payload})=>{if(R.host)return;R.bi=payload.bi;markCur(true)});
 listen('rev',({payload})=>{R.rev[payload.bid]=payload.on;if(Array.isArray(payload.keys)&&/^[\w-]{1,64}$/.test(String(payload.bid)))(R.revKeys=R.revKeys||{})[payload.bid]=payload.keys.slice(0,12).map(x=>String(x).slice(0,2));FX('stage',payload);paintReveals()});
 listen('gr',({payload})=>{if(payload.to!==me)return;S.verdict[payload.bid]={r:payload.r,msg:payload.msg};const L=lessonSrc();markMe(L&&L.li!=null?L.li:S.li,payload.bid,payload.r);paintSend(payload.bid)});
 listen('ans',({payload})=>{if(R.host)gradeIncoming(payload);(R.ans[payload.bid]=R.ans[payload.bid]||{})[payload.id]={name:payload.name,text:payload.text};FX('ans',payload);paintReveals()});
 listen('mf',({payload})=>{if(payload.to===me)handleMf(payload.stage,payload.from)});
 listen('exp',({payload})=>{if(!R.host)showExp(payload)});
 listen('vo',async({payload})=>{if(R.host||!R.follow)return;if(!!S.openV[payload.key]!==!!payload.open)await toggleVerse(payload.key,payload.ref,true)});
 ['chs','cha','chr','chx','hl','brk','call','mute','end'].forEach(ev=>listen(ev,({payload})=>FX(ev,payload)));
 listen('hp',({payload})=>{if(R.host)return;clearTimeout(R.hpT);const ms=Math.min(Math.max(+(payload&&payload.ms)||SUSP_MS,6e4),SUSP_MS);toast('O dirigente suspendeu a sala. Se não voltar em '+Math.round(ms/6e4)+' min, ela fecha.');
  R.hpT=setTimeout(()=>{if(S.room!==R||Object.values(R.peers).some(p=>p.host))return;try{window.IASDStudyMe&&IASDStudyMe.has()&&setTimeout(()=>IASDStudyMe.finish(false),900)}catch(e){}clearRoom();leave(true);resetAfterRoom();paint();toast('Sala fechada: o dirigente ficou suspenso por mais de '+SUSP_MIN+' min.')},ms)});
 listen('rx',({payload})=>floatReact(payload.e,payload.name));
 listen('sig',({payload})=>{if(payload.to===me)onSig(payload)});
 const onSync=()=>{R.syncT=0;const st=ch.presenceState(),prev=R.peers;R.peers={};Object.keys(st).forEach(k=>{if(k!==me&&/^[\w-]{1,64}$/.test(k)&&st[k][0])R.peers[k]=st[k][0]});
  Object.keys(R.peers).forEach(k=>{const p=R.peers[k];if(p.host){R.hostSeen=true;if(R.hpT){clearTimeout(R.hpT);R.hpT=0;toast('O dirigente voltou à sala.')}}if(p.hand&&!(prev[k]&&prev[k].hand))handFx(p.name||'Alguém',false)});
  Object.keys(R.voice?R.voice.pcs:{}).forEach(id=>{if(!R.peers[id])closePeer(id)});
  applyAudio();paintBar();paintDock();syncVoicePeers()};
 ch.on('presence',{event:'sync'},()=>{if(R.syncT)return;R.syncT=setTimeout(onSync,Object.keys(R.peers).length>12?500:150)});
 let first=true,connected=false;
 await new Promise(res=>ch.subscribe(async st=>{
  if(st==='SUBSCRIBED'){connected=true;await track();if(first){first=false;res()}else afterRejoin()}
  else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'||st==='CLOSED'){if(first){first=false;toast('Não foi possível conectar à sala.');res()}else scheduleRejoin()}
 }));
 if(!connected){if(S.room===R){try{await c.removeChannel(ch)}catch(e){}S.room=null;paint();paintBar();paintDock();}return false;}
 ensureVoice();
 if(!host)send('hello',{id:me});
 else{if(!opts.snap)S.view=(opts.saved&&opts.saved.view)||'course';pushLesson(true);send('md',{mode:R.mode});send('lk',R.lock)}
 try{const k='iasd-sm-room-'+code;if(window.IASDStudyMe&&!sessionStorage.getItem(k)){sessionStorage.setItem(k,'1');IASDStudyMe.stat('rooms')}}catch(e){}
 saveRoom();paint();paintBar();paintDock();syncVoicePeers();return true
}
async function track(){const R=S.room;if(!R||!R.ch)return;try{await R.ch.track({id:R.me,name:myName(),host:R.host,hand:R.hand,soundGroup:R.soundGroup||'',voice:true,mic:R.voice?R.voice.mic:false,cam:R.voice?R.voice.cam:false,away:isAway()})}catch(e){}}
function createRoom(){if(!course()&&!(S.courses||[]).length){toast('Crie um curso antes.');return}
 const c=course()||S.courses[0];S.cid=c.id;S.view='course';loadProg().then(async()=>{await startRoom(mkCode(),true);if(S.room){S.view='course';paint();toast('Sala criada. Escolha a lição para abrir à turma, ou convide pelo painel ⚙.')}})}
async function joinRoom(){const v=($('es-code')&&$('es-code').value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(v.length<4){toast('Digite o código da sala.');return}
 if(!isF()){const g=$('es-gname'),n=((g&&g.value)||'').trim();if(!n&&!guestName()){toast('Escreva seu nome.');return}if(n){try{localStorage.setItem(GN,n)}catch(e){}}}
 const ok=await startRoom(v,false);if(ok&&S.room)toast('Aguardando o dirigente…')}
function pushLesson(force){const R=S.room;if(!R||!R.host)return;const l=lesson();
 if(!l||S.view!=='lesson'){R.lesson=null;send('st',{lesson:null,bi:-1,rev:{}});saveRoom();return}
 R.lesson={id:l.id,li:S.li,title:l.title,blocks:(l.blocks||[]).map(b=>{const o={...b};delete o.guide;delete o.note;delete o.keys;return o})};send('st',{lesson:R.lesson,bi:R.bi,rev:R.rev,revKeys:R.revKeys||{},course:courseInfo()});saveRoom()}
function setPos(i){const R=S.room;if(!R||!R.host)return;R.bi=i;send('pos',{bi:i});markCur(false)}
function markCur(scroll){const R=S.room;if(!R)return;document.querySelectorAll('.es-b').forEach(el=>el.classList.toggle('es-cur',R.bi===+el.dataset.bi));
 if(scroll&&R.follow){const el=document.querySelector('.es-b.es-cur');if(el)el.scrollIntoView({block:'center',behavior:'smooth'})}}
function toggleFollow(){const R=S.room;if(!R||R.host)return;if(R.lock&&R.lock.f){toast('O dirigente travou a lição para todos.');return}R.follow=!R.follow;paint();if(R.follow)markCur(true)}
function myAnswer(bid){const L=lessonSrc();if(!L)return '';const li=L.li!=null?L.li:S.li;return (lp(li).a||{})[bid]||''}
function shareAnswer(bid){const R=S.room;if(!R)return;const text=myAnswer(bid);if(!text.trim())return;(R.ans[bid]=R.ans[bid]||{})[R.me]={name:myName(),text};send('ans',{bid,id:R.me,name:myName(),text})}
function revealToggle(bid){const R=S.room;if(!R||!R.host)return;R.rev[bid]=true;
 /* V/F: só na hora de revelar o gabarito vai para a turma, para mostrar o que cada um acertou */
 const L=lessonSrc(),qb=L&&L.blocks.find(x=>x.id===bid),keys=qb&&qb.kind==='vf'&&Array.isArray(qb.keys)?qb.keys.slice(0,12).map(String):null;
 if(keys)(R.revKeys=R.revKeys||{})[bid]=keys;
 send('rev',{bid,on:true,keys});FX('stage',{bid,on:true});paintReveals()}
function openStage(bid){FX('stage',{bid,on:true})}
function ansCount(bid){const R=S.room;return Object.values((R&&R.ans[bid])||{}).filter(a=>a&&String(a.text||'').trim()).length}
function paintReveals(){
 const R=S.room;if(!R)return;
 document.querySelectorAll('[data-rv]').forEach(el=>{
  const bid=el.dataset.rv,n=ansCount(bid);
  let h=n?'<small>'+n+(n===1?' enviou':' enviaram')+(R.host?' de '+(Object.keys(R.peers).length+1):'')+'</small>':'<small>Ninguém enviou ainda</small>';
  if(R.host)h+=' <button class="es-rvb" onclick="IASDEstudo.revealToggle('+jq(bid)+')">🎬 '+(R.rev[bid]?'Revelar de novo':'Revelar respostas')+'</button>';
  else if(R.rev[bid])h+=' <button class="es-rvb" onclick="IASDEstudo.openStage('+jq(bid)+')">👁 Ver respostas</button>';
  el.innerHTML=h;
 });
}
/* fim da sala: zera as respostas da tela e volta para "Criar sala / Entrar com código".
   O que cada pessoa enviou já foi guardado na própria conta (IASDStudyMe.rec) ou neste aparelho, se for convidada. */
function resetAfterRoom(){
 S.sent={};S.verdict={};S.openV={};S.edit=false;S.view='home';S.li=0;
 /* Respostas individuais permanecem guardadas ao sair da sala. */
}
function leave(silent){
 const R=S.room;if(!R)return;stopVoice(true);FX('reset');
 try{R.ch.untrack();cloud().removeChannel(R.ch)}catch(e){}
 document.body.classList.remove('es-fxon','es-host','es-susp');
 S.room=null;if(silent!==true){resetAfterRoom();clearRoom();try{window.IASDStudyMe&&IASDStudyMe.has()&&setTimeout(()=>IASDStudyMe.finish(false),600)}catch(e){}}applyLock();paintBar();paintDock();paintChat();if(!silent){toast('Você saiu da sala.');paint()}
}
function backToRoom(){const R=S.room;
 if(!R){S.resumed=false;if(typeof go==='function')go('Estudo');return}
 if(R.mode==='study'&&lesson())S.view='lesson';paint()}
/* Sala suspensa: ao sair do módulo do estudo a pessoa SAI da conexão (sem câmera, microfone, vídeo nem dados da sala).
   O código da sala fica guardado por 12 h, então dá para voltar depois, até fechando e abrindo o navegador. */
function parkRec(){let r=null;try{r=JSON.parse(localStorage.getItem(RK)||'null')}catch(e){}if(r&&suspOver(r)){clearRoom();S.suspClosed=r.code;return null}return r&&r.code&&Date.now()-(r.ts||0)<=SAVE_H?r:null}
function bar0(b){return b}
function parkBar(){
 let bar=$('es-bar');const r=(!S.room&&!$('es-root'))?parkRec():null;
 if(!r){if(bar&&bar.dataset.park){bar.remove();if(S.suspClosed){toast('A sala '+S.suspClosed+' foi fechada: ficou suspensa por mais de '+SUSP_MIN+' min.');S.suspClosed=null}}return}
 if(!bar){bar=document.createElement('div');bar.id='es-bar';bar.className='es-bar';document.body.appendChild(bar)}
 if(bar.dataset.park===r.code)return;bar.dataset.park=r.code;
 bar.innerHTML='<div class="es-bar-in es-bar-susp"><span class="es-sp"><b>⏸ Sala '+esc(r.code)+' suspensa</b><small>Sem câmera, microfone e dados. Toque para reconectar quando quiser.</small></span><button class="es-bt es-go" onclick="IASDEstudo.backToRoom()">Voltar à sala</button><button class="es-bt danger" onclick="IASDEstudo.leaveParked()">Sair</button></div>'}
async function leaveParked(){const r=parkRec();if(!r){parkBar();return}
 if(await IASDDialog.confirm('Sair de vez da sala '+r.code+'?',{title:'Sair da sala',ok:'Sair',danger:true})){clearRoom();const b=$('es-bar');if(b)b.remove();toast('Você saiu da sala.')}}
function parkRoom(){const R=S.room;if(!R||R.reconnecting||R.parking)return;R.parking=true;saveRoom();try{const r=JSON.parse(localStorage.getItem(RK)||'null');if(r){r.pk=Date.now();localStorage.setItem(RK,JSON.stringify(r))}}catch(e){}
 if(R.host){send('hp',{ms:SUSP_MS});setTimeout(()=>{if(S.room===R)leave(true);S.resumed=false},250)}else{leave(true);S.resumed=false}
 toast('Sala suspensa: câmera, microfone e dados desligados. Volte em até '+SUSP_MIN+' min, ou a sala fecha.')}
window.addEventListener('pagehide',()=>{const R=S.room;if(R&&R.host&&!R.parking)send('hp',{ms:SUSP_MS})});
function suspSync(){if(S.room){if(!$('es-root'))parkRoom();return}parkBar()}
setInterval(suspSync,300);setTimeout(suspSync,500);
function toggleHand(){const R=S.room;if(!R)return;R.hand=!R.hand;if(R.hand)handFx('Você',true);track();paintBar();refreshLobby()}
function handFx(name,self){document.querySelectorAll('.es-handfx').forEach(e=>e.remove());const d=document.createElement('div');d.className='es-handfx'+(self?' me':'');d.setAttribute('role','status');
 d.innerHTML='<span class="eh-hand" aria-hidden="true">✋</span><b>'+esc(name)+(self?' levantou a mão':' levantou a mão')+'</b>';document.body.appendChild(d);
 try{window.IASDEstudoFX&&IASDEstudoFX.sfx&&IASDEstudoFX.sfx.pop()}catch(e){}setTimeout(()=>d.remove(),4200)}
function react(e){const R=S.room;if(!R||(R.lock.r&&!R.host))return;const n=Date.now();if(n-(R.rxLast||0)<700)return;R.rxLast=n;send('rx',{e,name:myName()});floatReact(e,'Você');R.rxOpen=false;paintBar()}
function floatReact(e,name){const d=document.createElement('div');d.className='es-fl';d.innerHTML=esc(e)+'<small>'+esc(name||'')+'</small>';d.style.left=(20+Math.random()*60)+'%';document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}

/* barra da sala (fixa) */
function paintBar(){
 let bar=$('es-bar');const R=S.room;
 if(!R){if(bar)bar.remove();parkBar();paintHost();paintChat();return}
 if(!bar){bar=document.createElement('div');bar.id='es-bar';bar.className='es-bar';document.body.appendChild(bar)}
 delete bar.dataset.park;
 const v=R.voice||{},peers=Object.values(R.peers),n=peers.length+1;
 const names=[{id:R.me,name:myName()+' (você)',hand:R.hand,mic:v.mic,cam:v.cam,host:R.host,self:true,away:isAway()}].concat(peers);
 const rxOff=R.lock.r&&!R.host,chOff=R.mode==='lobby';
 bar.innerHTML='<div class="es-bar-in"><button class="es-pill" onclick="IASDEstudo.togglePanel()" aria-label="Participantes"><b>'+esc(R.code)+'</b><span>👥 '+n+'</span></button>'
  +'<button class="es-bt es-mic'+(v.mic?' on':' off')+'" onclick="IASDEstudo.toggleMic()" aria-label="'+(v.mic?'Desligar microfone':'Ligar microfone')+'"><i>🎙</i><small>Mic</small></button>'
  +'<button class="es-bt es-cam'+(v.cam?' on':' off')+'" onclick="IASDEstudo.toggleCam()" aria-label="'+(v.cam?'Desligar câmera':'Ligar câmera')+'"><i>📷</i><small>Câmera</small></button>'
  +(R.host?'':'<button class="es-bt es-hb'+(R.hand?' on hup':'')+'" onclick="IASDEstudo.toggleHand()" aria-label="'+(R.hand?'Baixar a mão':'Levantar a mão')+'" title="'+(R.hand?'Baixar a mão':'Levantar a mão')+'"><i>✋</i><small>Mão</small></button>')
  +'<button class="es-bt" onclick="IASDEstudo.setSoundGroup()" aria-label="Mesmo ambiente" title="'+(R.soundGroup?'Áudio compartilhado: '+esc(R.soundGroup):'Compartilhar áudio entre aparelhos próximos')+'"><i>'+I('volume')+'</i><small>'+(R.soundGroup?'Juntos':'Ambiente')+'</small></button>'
  +(chOff?'':'<button class="es-bt es-chb'+(R.chatOpen?' on':'')+'" onclick="IASDEstudo.toggleChat()" data-tg="chat" aria-label="Chat"><i>💬</i><small>Chat</small>'+(R.unread?'<i class="es-bdg">'+(R.unread>9?'9+':R.unread)+'</i>':'')+'</button>')
  +(rxOff?'':'<button class="es-bt'+(R.rxOpen?' on':'')+'" onclick="IASDEstudo.toggleRx()" data-tg="rx" aria-label="Reações"><i>😊</i><small>Reações</small></button>')
  +(R.host?'<button class="es-bt es-gear'+(R.hostOpen?' on':'')+'" onclick="IASDEstudo.toggleHost()" aria-label="Painel do dirigente" title="Painel do dirigente"><i>⚙</i><small>Painel</small></button>':'')
  +'<button class="es-bt es-exit" onclick="IASDEstudo.leaveAsk()" aria-label="'+(R.host?'Encerrar a sala':'Sair da sala')+'" title="'+(R.host?'Encerrar a sala':'Sair da sala')+'">'+(R.host?'Encerrar':'Sair')+'</button></div>'
  +(R.rxOpen&&!rxOff?'<div class="es-rxp">'+['🙏','👍','❤️','😮','👏','😂'].map(e=>'<button type="button" onclick="IASDEstudo.react('+jq(e)+')">'+e+'</button>').join('')+'</div>':'')
  +'<div class="es-panel" id="es-panel" '+(R.listOpen?'':'hidden')+'>'+names.map(p=>'<div><span class="es-av">'+esc((p.name||'?').charAt(0).toUpperCase())+'</span><b>'+esc(p.name||'?')+'</b>'+(p.host?'<i>dirigente</i>':'')+(p.hand?' ✋':'')+(p.mic?' 🎙':'')+(p.cam?' 📷':'')+(p.away?' <small class="es-aw">fora da lição</small>':'')
   +(!p.self&&v&&(R.peers[p.id]||{}).mic!==undefined?'<button class="es-mt" onclick="IASDEstudo.muteFrom('+jq(p.id)+')" title="Silenciar o som desta pessoa só no seu aparelho">'+(R.vmute[p.id]?'🔇 sem som':'🔈 som')+'</button>':'')+'</div>').join('')+'<button type="button" class="es-leave" onclick="IASDEstudo.leaveAsk()">'+(R.host?'⛔ Encerrar a sala':'🚪 Sair da sala')+'</button></div>';
 paintHost();paintChat();paintAway();
}
/* clicar fora de qualquer caixinha da sala (participantes, reações, chat) fecha a caixinha */
document.addEventListener('pointerdown',e=>{
 const R=S.room;if(!R)return;const t=e.target;if(!t||!t.closest)return;
 const tg=t.closest('[data-tg]'),on=tg&&tg.dataset.tg;
 if(R.listOpen&&on!=='list'&&!t.closest('#es-panel')){R.listOpen=false;const p=$('es-panel');if(p)p.hidden=true}
 if(R.rxOpen&&on!=='rx'&&!t.closest('.es-rxp')){R.rxOpen=false;paintBar()}
 if(R.chatOpen&&on!=='chat'&&!t.closest('#es-chat')&&!t.closest('#es-exp,.es-expw,#sm-ask,.iad-ov,.iad-box')){R.chatOpen=false;paintBar();paintChat()}
},true);
function togglePanel(){const R=S.room;if(!R)return;R.listOpen=!R.listOpen;const p=$('es-panel');if(p)p.hidden=!R.listOpen}
function toggleRx(){const R=S.room;if(!R)return;R.rxOpen=!R.rxOpen;paintBar()}
async function leaveAsk(){const R=S.room;if(!R)return;
 if(R.host){if(await IASDDialog.confirm('Sair e encerrar a sala para todos?',{title:'Encerrar sala',ok:'Encerrar sala',danger:true})){R.endAsked=true;endRoom()}return}
 if(await IASDDialog.confirm('Sair da sala de estudo?'))leave()}
function isAway(){return document.hidden||!$('es-root')}
function paintAway(){
 const R=S.room,el=$('es-away');if(!el||!R)return;
 const h=Object.values(R.peers).find(p=>p.host);
 const away=!R.host&&((h&&h.away)||(!h&&R.hostSeen));el.hidden=!away;el.textContent=away?(h?'⏸ Dirigente fora da lição':'⏸ Dirigente fora da sala por um momento'):'';
}
async function endRoom(){const R=S.room;if(!R||!R.host)return;
 if(!R.endAsked&&!(await IASDDialog.confirm('Encerrar a sala para todos? Os participantes serão avisados.',{title:'Encerrar sala',ok:'Encerrar sala',danger:true})))return;
 await send('end',{});FX('reset');leave()}
function endedByHost(){clearRoom();leave(true);resetAfterRoom();paint();toast('O dirigente encerrou a sala.');try{window.IASDStudyMe&&IASDStudyMe.has()&&setTimeout(()=>IASDStudyMe.finish(false),900)}catch(e){}}

/* ---------- voz e vídeo (WebRTC em malha; sinalização pelo canal da sala) ---------- */
/* Todos entram só ouvindo e assistindo, sem pedir permissão. Microfone e câmera só ligam quando a própria pessoa toca nos botões. */
const AUDIO_C={echoCancellation:{ideal:true},noiseSuppression:{ideal:true},autoGainControl:{ideal:false},channelCount:{ideal:1},sampleRate:{ideal:48000},voiceIsolation:{ideal:true},googEchoCancellation:{ideal:true},googNoiseSuppression:{ideal:true},googHighpassFilter:{ideal:true}};
const VIDEO_C={width:{ideal:640},height:{ideal:480},frameRate:{ideal:24},facingMode:'user'};
function ensureVoice(){
 const R=S.room;if(!R)return null;
 if(!R.voice){const V=R.voice={ready:false,mic:false,cam:false,aTrack:null,vTrack:null,pcs:{},tiles:{},aud:{},an:{}};
  loadTurn().then(()=>{V.ready=true;if(S.room&&S.room.voice===V){syncVoicePeers();paintDock()}})}
 return R.voice}
/* Só existe conexão de voz/vídeo quando alguém do par está com microfone ou câmera ligados. Quem só ouve não abre conexão com outros ouvintes (evita N×N com muita gente). */
function syncVoicePeers(){const R=S.room,V=R&&R.voice;if(!V||!V.ready)return;const me=!!(V.mic||V.cam);
 Object.keys(R.peers).forEach(id=>{const p=R.peers[id];if(!p.voice)return;const want=me||p.mic||p.cam;if(want&&!V.pcs[id])mkPeer(id);else if(!want&&V.pcs[id])closePeer(id)});
 Object.keys(V.pcs).forEach(id=>{if(!R.peers[id])closePeer(id)})}
const MAX_BC=8;
function bcCount(){const R=S.room;return R?Object.values(R.peers).filter(p=>!p.host&&(p.mic||p.cam)).length:0}
function bcFull(){const R=S.room,V=R&&R.voice;if(!R||R.host)return false;if(V&&(V.mic||V.cam))return false;if(bcCount()>=MAX_BC){toast('Já há '+MAX_BC+' pessoas com microfone/câmera abertos. Levante a mão e aguarde sua vez.');return true}return false}
function mkPeer(id){
 const R=S.room,V=R&&R.voice;if(!V||!V.ready||V.pcs[id])return V&&V.pcs[id];if(Object.keys(V.pcs).length>=24&&!(V.mic||V.cam))return null;
 const pc=new RTCPeerConnection(ICE());pc.polite=R.me>id;pc.mk=false;pc.ignore=false;V.pcs[id]=pc;
 pc.aT=pc.addTransceiver('audio',{direction:'sendrecv'});pc.vT=pc.addTransceiver('video',{direction:'sendrecv'});
 if(V.aTrack)pc.aT.sender.replaceTrack(V.aTrack).catch(()=>{});
 if(V.vTrack)pc.vT.sender.replaceTrack(V.vTrack).catch(()=>{});
 pc.onnegotiationneeded=async()=>{try{pc.mk=true;await pc.setLocalDescription();sig(id,'desc',pc.localDescription)}catch(e){console.warn(e)}finally{pc.mk=false}};
 pc.onicecandidate=e=>{if(e.candidate)sig(id,'ice',e.candidate)};
 pc.ontrack=e=>{const ms=V.tiles[id]||(V.tiles[id]=new MediaStream());if(!ms.getTracks().includes(e.track))ms.addTrack(e.track);
  attachAudio(id);e.track.onmute=e.track.onunmute=()=>paintDock();paintDock()};
 pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'){try{pc.restartIce()}catch(e){}}paintDock()};
 return pc;
}
function sig(to,k,d){send('sig',{to,from:S.room.me,k,d:JSON.parse(JSON.stringify(d))})}
async function onSig(m){
 const R=S.room;if(!R||!R.voice)return;
 const pc=R.voice.pcs[m.from]||mkPeer(m.from);if(!pc)return;
 try{
  if(m.k==='desc'){
   const collision=m.d.type==='offer'&&(pc.mk||pc.signalingState!=='stable');
   pc.ignore=!pc.polite&&collision;if(pc.ignore)return;
   await pc.setRemoteDescription(m.d);
   if(m.d.type==='offer'){await pc.setLocalDescription();sig(m.from,'desc',pc.localDescription)}
  }else if(m.k==='ice'){try{await pc.addIceCandidate(m.d)}catch(e){if(!pc.ignore)console.warn(e)}}
 }catch(e){console.warn('sinalização',e)}
}
function closePeer(id){const V=S.room&&S.room.voice;if(!V)return;const pc=V.pcs[id];if(pc){try{pc.close()}catch(e){}delete V.pcs[id]}delete V.tiles[id];dropAudio(id);paintDock()}
function stopVoice(silent){
 const R=S.room;if(!R||!R.voice)return;const V=R.voice;
 Object.keys(V.pcs).forEach(id=>{try{V.pcs[id].close()}catch(e){}});
 Object.keys(V.aud).forEach(dropAudio);Object.keys(V.an).forEach(id=>dropLevel(id));
 [V.aTrack,V.vTrack].forEach(t=>{try{t&&t.stop()}catch(e){}});
 R.voice=null;if(silent!==true){track();paintBar();paintDock()}
}
async function toggleMic(){
 const V=ensureVoice();if(!V)return;
  if(V.mic){stopMic();return}
 if(bcFull())return;
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Este navegador não permite microfone (use HTTPS).');return}
 let st;try{st=await navigator.mediaDevices.getUserMedia({audio:AUDIO_C})}catch(e){toast('Permita o microfone nas configurações do navegador para falar.');return}
 if(S.room?.voice!==V){st.getTracks().forEach(t=>t.stop());return;}const t=st.getAudioTracks()[0];if(!t){toast('Nenhum microfone disponível.');return;}V.aTrack=t;V.mic=true;t.onended=()=>{if(V.aTrack===t)stopMic()};
 Object.values(V.pcs).forEach(pc=>pc.aT.sender.replaceTrack(t).catch(()=>{}));syncVoicePeers();
 actx();watchLevel('me',new MediaStream([t]));
 applyAudio();toast('Microfone ligado. Para aparelhos próximos, use Mesmo ambiente.');track();paintBar();paintDock();refreshLobby();
}
function stopMic(){
 const V=S.room&&S.room.voice;if(!V||!V.mic)return;V.mic=false;const t=V.aTrack;V.aTrack=null;
 Object.values(V.pcs).forEach(pc=>pc.aT.sender.replaceTrack(null).catch(()=>{}));if(t)t.stop();dropLevel('me');
 applyAudio();track();syncVoicePeers();paintBar();paintDock();refreshLobby();
}
function muteMic(){const V=S.room&&S.room.voice;if(V&&V.mic){stopMic();toast('O dirigente pediu silêncio. Seu microfone foi desligado.')}}
async function toggleCam(){
 const V=ensureVoice();if(!V)return;
 if(V.cam){stopCam();return}
 if(bcFull())return;
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Este navegador não permite câmera (use HTTPS).');return}
 let st;try{st=await navigator.mediaDevices.getUserMedia({video:VIDEO_C})}catch(e){toast('Permita a câmera nas configurações do navegador para aparecer.');return}
 if(S.room?.voice!==V){st.getTracks().forEach(t=>t.stop());return;}const t=st.getVideoTracks()[0];if(!t){toast('Nenhuma câmera disponível.');return;}V.vTrack=t;V.cam=true;t.onended=()=>{if(V.vTrack===t)stopCam()};
 Object.values(V.pcs).forEach(pc=>pc.vT.sender.replaceTrack(t).catch(()=>{}));syncVoicePeers();
 toast('Câmera ligada. Toque de novo para desligar.');track();paintBar();paintDock();refreshLobby();
}
function stopCam(){
 const V=S.room&&S.room.voice;if(!V||!V.cam)return;V.cam=false;const t=V.vTrack;V.vTrack=null;
 Object.values(V.pcs).forEach(pc=>pc.vT.sender.replaceTrack(null).catch(()=>{}));if(t)t.stop();
 track();syncVoicePeers();paintBar();paintDock();refreshLobby();
}
/* Som da sala: um <audio> por pessoa, fixo e separado das bolinhas de vídeo (as bolinhas são redesenhadas toda hora e cortavam o som) */
let AC=null;
function actx(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume().catch(()=>{})}catch(e){}return AC}
function audBox(){let b=$('es-audio');if(!b){b=document.createElement('div');b.id='es-audio';b.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';document.body.appendChild(b)}return b}
function attachAudio(id){const R=S.room,V=R&&R.voice;if(!V)return;const ms=V.tiles[id];if(!ms)return;
 let a=V.aud[id];if(!a){a=V.aud[id]=document.createElement('audio');a.autoplay=true;a.setAttribute('playsinline','');a.dataset.p=id;audBox().appendChild(a)}
 if(a.srcObject!==ms)a.srcObject=ms;applyAudio(id);watchLevel(id,ms)}
function applyAudio(id){const R=S.room,V=R&&R.voice;if(!V)return;
 (id?[id]:Object.keys(V.aud)).forEach(i=>{const a=V.aud[i];if(!a)return;const people=[{id:R.me,group:R.soundGroup||'',host:R.host,mic:V.mic,away:false},...Object.entries(R.peers).map(([id,p])=>({id,group:p.soundGroup||'',host:p.host,mic:p.mic,away:p.away}))];a.muted=!!(R.vmute[i]||R.susp||window.IASDStudyAudio?.muted(people,R.me,i));a.volume=R.duck?.[i]>Date.now()?.15:1;
  const p=a.play();if(p&&p.catch)p.catch(()=>{if(!R.needTap){R.needTap=true;toast('Toque na tela para ativar o som da sala.')}})})}
function dropAudio(id){const V=S.room&&S.room.voice;if(!V)return;const a=V.aud[id];if(a){try{a.pause();a.srcObject=null;a.remove()}catch(e){}delete V.aud[id]}dropLevel(id)}
function watchLevel(id,ms){const V=S.room&&S.room.voice;if(!V)return;const n=ms.getAudioTracks().length;const old=V.an[id];if(old&&old.ms===ms&&old.n===n)return;
 const c=actx();if(!c||!n)return;dropLevel(id);
 try{const src=c.createMediaStreamSource(ms),an=c.createAnalyser();an.fftSize=512;an.smoothingTimeConstant=.3;src.connect(an);V.an[id]={ms,src,an,n,buf:new Uint8Array(an.fftSize),fb:new Uint8Array(an.frequencyBinCount),hw:0,on:false}}catch(e){}}
function dropLevel(id){const V=S.room&&S.room.voice;if(!V||!V.an[id])return;try{V.an[id].src.disconnect()}catch(e){}delete V.an[id];document.querySelectorAll('.es-tile[data-t="'+esc(id)+'"]').forEach(el=>el.classList.remove('talk'))}
async function setSoundGroup(){const R=S.room;if(!R)return;const text=await IASDDialog.prompt('Use o mesmo nome nos aparelhos que estão juntos (ex.: Sala principal). Apenas um aparelho reproduz o áudio da chamada; os demais continuam com vídeo. Deixe vazio para usar áudio individual ou fones.',R.soundGroup||'',{title:'Mesmo ambiente'});if(text==null||S.room!==R)return;R.soundGroup=text.trim().toLocaleLowerCase('pt-BR').slice(0,40);applyAudio();await track();saveRoom();paintBar();paintDock();toast(R.soundGroup?'Áudio compartilhado: '+R.soundGroup:'Áudio individual ativado.');}
/* Microfonia (apito) entre aparelhos no mesmo ambiente: o cancelamento de eco do navegador só vale para o próprio aparelho.
   Se um tom forte e contínuo aparece no som de alguém, silenciamos o som dessa pessoa neste aparelho para quebrar o ciclo. */
function howl(id,o,m,R){
 if(m<40){o.hw=0;return}
 try{o.an.getByteFrequencyData(o.fb)}catch(e){return}
 let pk=0,sum=0;for(let i=3;i<o.fb.length;i++){const v=o.fb[i];sum+=v;if(v>pk)pk=v}
 const avg=sum/(o.fb.length-3),ratio=pk/Math.max(1,avg);
 o.hw=(pk>=210&&ratio>=4.2)?o.hw+1:Math.max(0,o.hw-2);
 if(o.hw>=5){o.hw=0;onHowl(id)}}
/* Microfonia: o som da outra pessoa abaixa por alguns segundos e um dos dois recebe o pedido para falar por um celular só (o app nunca desliga microfone sozinho).
   Quem recebe: o ouvinte antes do dirigente; entre iguais, decide o código. */
function onHowl(id){
 const R=S.room,V=R&&R.voice;if(!R||!V)return;
 R.duck=R.duck||{};R.duck[id]=Date.now()+6000;applyAudio(id);setTimeout(()=>{if(S.room===R)applyAudio(id)},6200);
 const meOn=!!V.mic,xOn=!!(R.peers[id]&&R.peers[id].mic);if(!meOn&&!xOn)return;
 let victim;if(meOn&&!xOn)victim=R.me;else if(!meOn&&xOn)victim=id;else{
  const xh=!!(R.peers[id]&&R.peers[id].host);victim=(R.host&&!xh)?id:(!R.host&&xh)?R.me:(R.me>id?R.me:id)}
 const key=[R.me,id].sort().join('|');R.mf=R.mf||{};const st=R.mf[key]=R.mf[key]||{at:0},now=Date.now();
 if(now-st.at<12000)return;st.at=now;
 if(victim===R.me)handleMf(1,id);else send('mf',{to:victim,stage:1,from:R.me})}
function handleMf(stage,fromId){
 const R=S.room,V=R&&R.voice;if(!R||!V)return;const nm=(R.peers[fromId]||{}).name||'outra pessoa';
 if(!V.mic||$('es-mf'))return;
 const el=document.createElement('div');el.id='es-mf';el.className='es-mf';
 el.innerHTML='<b>⚠ Microfonia detectada</b><p>Entre você e '+esc(nm)+'. Para acabar com o apito, falem por <u>um celular só</u>: desligue o microfone deste aparelho (ou do outro). Vocês continuam participando normalmente pelo celular que ficar ligado.</p><div><button class="es-mfb" data-a="off">Desligar meu microfone</button><button class="es-mfn" data-a="no">Continuar com os dois</button></div><small>O app nunca desliga o seu microfone sozinho.</small>';
 el.addEventListener('click',e=>{const a=e.target.dataset&&e.target.dataset.a;if(!a)return;el.remove();if(a==='off')stopMic()});
 document.body.appendChild(el);setTimeout(()=>{if(el.isConnected)el.remove()},15000)}

setInterval(()=>{const R=S.room,V=R&&R.voice;if(!V)return;Object.keys(V.an).forEach(id=>{const o=V.an[id];try{o.an.getByteTimeDomainData(o.buf)}catch(e){return}
 let m=0;for(let i=0;i<o.buf.length;i++){const d=Math.abs(o.buf[i]-128);if(d>m)m=d}const on=m>9&&!R.susp;
  if(id!=='me')howl(id,o,m,R);
 if(on!==o.on){o.on=on;document.querySelectorAll('.es-tile[data-t="'+esc(id)+'"]').forEach(el=>el.classList.toggle('talk',on))}})},180);
function unlockAudio(){const R=S.room,V=R&&R.voice;try{if(AC&&AC.state==='suspended')AC.resume().catch(()=>{})}catch(e){}
 if(V){if(Object.values(V.aud).some(a=>a.paused)){R.needTap=false;applyAudio()}}
 document.querySelectorAll('.es-tile video').forEach(v=>{if(v.paused&&v.play)v.play().catch(()=>{})})}
['pointerdown','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,unlockAudio,{passive:true,capture:true}));
function startVoice(){ensureVoice();syncVoicePeers()}
function paintDock0(){
 let dock=$('es-dock');const R=S.room,V=R&&R.voice,lobby=!!R&&R.mode==='lobby';
 if(!R){if(dock)dock.remove();document.body.classList.remove('es-dk');return}
 const mine=!!V&&(V.mic||V.cam);
 const ids=lobby?Object.keys(R.peers):Object.keys(R.peers).filter(id=>R.peers[id].mic||R.peers[id].cam);
 const showDock=!lobby&&!!R&&(mine||ids.length>0);
 document.body.classList.toggle('es-dk',showDock);
 const lg=lobby?$('es-lgrid'):null;
 if(lobby&&!lg){if(dock)dock.remove();return}
 if(!lobby&&!showDock){if(dock)dock.remove();return}
 let box;
 if(lobby){if(dock)dock.remove();box=lg}
 else{if(!dock){dock=document.createElement('div');dock.id='es-dock';dock.className='es-dock';document.body.appendChild(dock)}box=dock}
 box.innerHTML=((lobby||mine)?tileHTML('me',myName()+' (você)',V&&V.mic,V&&V.cam,true,R.host):'')+ids.map(id=>tileHTML(id,R.peers[id].name,R.peers[id].mic,R.peers[id].cam,false,R.peers[id].host)).join('');
 bindTiles(box);
}
function tileHTML(id,name,mic,cam,self,host){const R=S.room,V=R&&R.voice,lobby=!!R&&R.mode==='lobby';return '<div class="es-tile'+(cam?' cam':'')+'" data-t="'+esc(id)+'"><div class="es-pic"><video autoplay playsinline muted></video><span class="es-av" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.2" r="4.3"/><path d="M3.4 21.5c.5-4.8 4.2-7.3 8.6-7.3s8.1 2.5 8.6 7.3z"/></svg></span>'
  +(self?'':'<span class="es-tc"><button type="button" data-a="m" title="Silenciar só no seu aparelho" aria-label="Silenciar esta pessoa">'+(R.vmute[id]?'🔇':'🔈')+'</button><button type="button" data-a="v" title="Ocultar o vídeo" aria-label="Ocultar vídeo desta pessoa">'+(R.vhide[id]?'👁':'🙈')+'</button></span>')
  +'</div><small class="es-nm">'+((cam||mic)?'<i class="es-dot" title="Ao vivo" aria-label="Ao vivo"></i>':'')+'<span class="es-nt">'+esc(name||'?')+(host?' · dirigente':'')+(!mic&&!cam&&lobby?' · só assistindo':'')+(!self&&V&&V.pcs[id]&&V.pcs[id].connectionState!=='connected'&&V.pcs[id].connectionState!=='new'?' ⏳':'')+'</span></small></div>'}
function openGal(){const R=S.room;if(!R||R.mode==='lobby')return;R.gal=true;paintGal()}
function closeGal(){const R=S.room;if(R)R.gal=false;paintGal()}
function paintGal(){const R=S.room,V=R&&R.voice;let g=$('es-gal');
 if(!R||!R.gal||R.mode==='lobby'){if(g)g.remove();return}
 if(!g){g=document.createElement('div');g.id='es-gal';g.className='es-gal';g.onclick=e=>{if(e.target===g||e.target.closest('.es-gx'))closeGal()};document.body.appendChild(g)}
 const all=[tileHTML('me',myName()+' (você)',V&&V.mic,V&&V.cam,true,R.host)].concat(Object.keys(R.peers).map(id=>tileHTML(id,R.peers[id].name,R.peers[id].mic,R.peers[id].cam,false,R.peers[id].host)));
 g.innerHTML='<div class="es-gh"><b>Pessoas na sala · '+all.length+'</b><button type="button" class="es-gx" aria-label="Fechar">✕</button></div><div class="es-gg">'+all.join('')+'</div>';
 bindTiles(g)}
function paintDock(){paintDock0();paintGal()}
function bindTiles(box){const R=S.room,V=R&&R.voice,lobby=!!R&&R.mode==='lobby',root0=box,gal0=$('es-gal');const myMs=()=>V&&V.vTrack?new MediaStream([V.vTrack]):null;
 box.querySelectorAll('.es-tile').forEach(el=>{const id=el.dataset.t,v=el.querySelector('video');
  el.onclick=e=>{const b=e.target.closest('button');if(b){e.stopPropagation();if(b.dataset.a==='m')muteFrom(id);else hideFrom(id);return}if(!lobby&&root0!==gal0)openGal()};
  const ms=id==='me'?myMs():(V&&V.tiles[id]);
  if(ms){v.srcObject=ms;const live=ms.getVideoTracks().some(t=>t.readyState==='live'&&!t.muted);el.classList.toggle('vid',live&&!(id!=='me'&&R.vhide[id]))}
  if(V&&V.an[id]&&V.an[id].on)el.classList.add('talk');const pl=v.play&&v.play();if(pl&&pl.catch)pl.catch(()=>{})});
}
function refreshLobby(){if(S.room&&S.room.mode==='lobby')paint()}
function muteFrom(id){const R=S.room;if(!R)return;R.vmute[id]=!R.vmute[id];R.vman=R.vman||{};R.vman[id]=true;applyAudio(id);paintDock();paintBar()}
function hideFrom(id){const R=S.room;if(!R)return;R.vhide[id]=!R.vhide[id];paintDock()}

/* ---------- bate-papo antes do estudo + painel do dirigente ---------- */
function lobbyHTML(){
 const R=S.room,host=R.host,V=R.voice||{},n=Object.keys(R.peers).length+1;
 return '<div class="es-hero"><div><span class="es-kick">ANTES DO ESTUDO · '+n+' NA SALA</span><h1>Bate-papo da <em>turma</em></h1><p>Um momento para se cumprimentar. Quando o dirigente iniciar, todos vão juntos para a lição.</p></div></div>'
  +'<div class="pg-card"><div class="es-priv"><span aria-hidden="true">🔒</span><p><b>Você está no controle.</b> Seu microfone e sua câmera começam desligados e só ligam quando você tocar nos botões abaixo. Nada é gravado nem salvo. Dá para desligar quando quiser e ocultar o vídeo de qualquer pessoa.</p></div>'
  +'<div id="es-lgrid" class="es-lgrid"></div>'
  +'<div class="es-calls"><button type="button" class="es-call'+(V.mic?' on':'')+'" onclick="IASDEstudo.toggleMic()"><i>🎙</i><span>Microfone</span><small>'+(V.mic?'Ligado':'Desligado')+'</small></button>'
  +'<button type="button" class="es-call'+(V.cam?' on':'')+'" onclick="IASDEstudo.toggleCam()"><i>📷</i><span>Câmera</span><small>'+(V.cam?'Ligada':'Desligada')+'</small></button>'
  +'<button type="button" class="es-call'+(R.hand?' on hup':'')+'" onclick="IASDEstudo.toggleHand()"><i>✋</i><span>Pedir a palavra</span><small>'+(R.hand?'Mão levantada':'Levantar a mão')+'</small></button></div>'
  +(host?'<button type="button" class="pg-gold es-wide" onclick="IASDEstudo.setMode(\'study\')">▶ Iniciar o estudo para todos</button>':'<p class="es-note es-wait">Aguardando o dirigente iniciar o estudo…</p>')
  +'</div><div id="es-lchat"></div>';
}
function setMode(m){const R=S.room;if(!R||!R.host)return;R.mode=m==='lobby'?'lobby':'study';R.hostOpen=false;
 if(R.mode==='study'&&lesson()&&S.view!=='course')S.view='lesson';
 send('md',{mode:R.mode});if(R.mode==='study')pushLesson(true);saveRoom();paint();paintBar();paintDock();
 toast(R.mode==='lobby'?'Todos foram para o bate-papo.':'Todos voltaram ao estudo.')}
function setLock(k,on){const R=S.room;if(!R||!R.host)return;R.lock[k]=!!on;send('lk',R.lock);saveRoom();paintHost();paintBar()}
function toggleHost(){const R=S.room;if(!R||!R.host)return;R.hostOpen=!R.hostOpen;R.chOpen=false;paintBar()}
function curQ(){const R=S.room;if(!R||R.bi<0)return null;const L=lessonSrc();const b=L&&L.blocks[R.bi];return b&&b.t==='q'?b:null}
function challenge(kind,bi){const R=S.room;if(!R||!R.host)return;
 if(bi!=null)setPos(bi);
 const sc=R.chScope||(curQ()?'q':'tema'),free=sc==='tema'||['quiz','who','ord','cloud','vf','auto'].includes(kind||'auto');
 if(!free&&(R.bi<0||!curQ())){toast('Toque em “▶ Levar a turma” na pergunta que a turma está estudando.');return}
 R.hostOpen=false;R.chOpen=false;paintHost();window.IASDEstudoFX&&IASDEstudoFX.launch(R.bi,kind||'auto',sc)}
function revealCur(){const R=S.room;if(!R||!R.host)return;const b=curQ();if(!b){toast('Toque em “▶ Levar a turma” na pergunta que a turma está estudando.');return}R.hostOpen=false;paintHost();revealToggle(b.id)}
function setScope(v){const R=S.room;if(!R)return;R.chScope=v==='tema'?'tema':'q';paintHost()}
function setChooser(){const R=S.room;if(!R)return;R.chOpen=!R.chOpen;paintHost()}
function breakGo(secs){const R=S.room;if(!R||!R.host)return;R.hostOpen=false;paintHost();FX('breakgo',{secs})}
function muteAll(){const R=S.room;if(!R||!R.host)return;send('mute',{});toast('Pedi silêncio a todos. Quem estava com o microfone aberto foi silenciado.')}
function callPeer(id){const R=S.room;if(!R||!R.host)return;send('call',{to:id});toast('Convite enviado. A pessoa decide se liga o microfone.')}
function inviteLink(){return location.origin+'/estudo?sala='+S.room.code}
function inviteText(){return '📖 Estudo bíblico ao vivo — IASD APP\nEntre na sala pelo link: '+inviteLink()+'\nCódigo da sala: '+S.room.code}
/* No celular abre o WhatsApp direto na escolha de contatos (esquema whatsapp://); se não abrir, usa o menu de compartilhar do sistema. No computador usa o WhatsApp Web. */
function shareWA(){if(!S.room)return;const t=encodeURIComponent(inviteText()),mob=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
 if(!mob){window.open('https://api.whatsapp.com/send?text='+t,'_blank','noopener');return}
 let left=false;const onHide=()=>{if(document.hidden)left=true};document.addEventListener('visibilitychange',onHide);
 location.href='whatsapp://send?text='+t;
 setTimeout(()=>{document.removeEventListener('visibilitychange',onHide);if(left||document.hidden)return;
  if(navigator.share)shareNative();else location.href='https://api.whatsapp.com/send?text='+t},1400)}
function copyInvite(){const R=S.room;if(!R)return;const t=inviteText();
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(()=>toast('Convite copiado.'),()=>toast('Código: '+R.code));else toast('Código: '+R.code)}
async function shareNative(){if(!S.room)return;try{await navigator.share({title:'Estudo bíblico ao vivo',text:inviteText()})}catch(e){}}
function paintHost(){
 const R=S.room;let tab=$('es-htab'),ov=$('es-hdr');
 document.body.classList.toggle('es-host',!!(R&&R.host));
 if(!R||!R.host){if(tab)tab.remove();if(ov)ov.remove();return}
 if(tab)tab.remove();
 if(!R.hostOpen){if(ov)ov.remove();return}
 const lobby=R.mode==='lobby',L=R.lock,peers=Object.entries(R.peers),hands=peers.filter(([id,p])=>p.hand),q=curQ(),sc0=R.chScope||(q?'q':'tema');
 const sw=(t,d,on,k)=>'<label class="es-sw"><span><b>'+t+'</b><small>'+d+'</small></span><input type="checkbox" '+(on?'checked':'')+' onchange="IASDEstudo.setLock(\''+k+'\',this.checked)"></label>';
 const tile=(ic,t,fn,cls)=>'<button type="button" class="es-pt'+(cls?' '+cls:'')+'" onclick="'+fn+'"><i>'+ic+'</i><span>'+t+'</span></button>';
 const html='<div class="es-pop" role="dialog" aria-modal="true" aria-label="Painel do dirigente">'
  +'<div class="es-ph"><b>Painel do dirigente</b><button type="button" onclick="IASDEstudo.toggleHost()" aria-label="Fechar">✕</button></div>'
  +'<section><h4>Momento da sala · '+(peers.length+1)+' pessoa'+(peers.length?'s':'')+'</h4><div class="es-ptg">'+tile('💬','Bate-papo com câmeras','IASDEstudo.setMode(\'lobby\')',lobby?'on':'')+tile('📖','Estudo da lição','IASDEstudo.setMode(\'study\')',lobby?'':'on')+'</div></section>'
  +'<section><h4>Atividades</h4><p class="es-pq">'+(q?'Pergunta atual: <b>'+esc(q.text.length>90?q.text.slice(0,90)+'…':q.text)+'</b>':'Toque em “▶ Levar a turma” numa pergunta da lição para ligar as atividades a ela.')+'</p>'
  +'<div class="es-ptg">'+tile('🎯','Soltar desafio','IASDEstudo.setChooser()',R.chOpen?'on':'')+tile('🎬','Revelar respostas','IASDEstudo.revealCur()')+tile('☕','Intervalo 5 min','IASDEstudo.breakGo(300)')+tile('☕','Intervalo 10 min','IASDEstudo.breakGo(600)')+'</div>'
  +(R.chOpen?'<div class="es-scope"><span>Sobre</span><button type="button" class="'+(sc0==='tema'?'':'on')+'" onclick="IASDEstudo.setScope(\'q\')">Esta pergunta</button><button type="button" class="'+(sc0==='tema'?'on':'')+'" onclick="IASDEstudo.setScope(\'tema\')">Tema da lição</button></div><div class="es-pchips">'+[['auto','🎲','Surpresa'],['verso','✍️','Completar o versículo'],['ref','📍','Qual é a referência?'],['vf','✔✖','Verdadeiro ou falso'],['quiz','🧠','Múltipla escolha da lição'],['ord','🔢','Colocar na ordem'],['cloud','☁️','Nuvem de palavras']].map(a=>'<button type="button" onclick="IASDEstudo.challenge('+jq(a[0])+')"><i>'+a[1]+'</i>'+a[2]+'</button>').join('')+'</div>':'')+'</section>'
  +'<section><h4>Controle dos alunos</h4>'+sw('Travar versículos','Só veem os versículos que você abrir.',L.v,'v')+sw('Travar a lição','Ficam onde você estiver, sem leitura livre.',L.f,'f')+sw('Pausar o chat','Só você escreve no chat.',L.c,'c')+sw('Pausar as reações','Esconde o botão de reações.',L.r,'r')
  +'<div class="es-ptg">'+tile('🔇','Pedir silêncio a todos','IASDEstudo.muteAll()')+'</div></section>'
  +'<section><h4>Mãos levantadas</h4>'+(hands.length?hands.map(([id,p])=>'<div class="es-hand"><span class="es-av">'+esc((p.name||'?').charAt(0).toUpperCase())+'</span><b>'+esc(p.name||'?')+'</b><button type="button" onclick="IASDEstudo.callPeer('+jq(id)+')">🙋 Chamar</button></div>').join(''):'<p class="es-note">Ninguém pediu a palavra.</p>')+'</section>'
  +'<section><h4>Convidar</h4><div class="es-code">'+esc(R.code)+'</div><div class="es-ptg">'+tile('🟢','Enviar pelo WhatsApp','IASDEstudo.shareWA()','wa')+tile('🔗','Copiar link','IASDEstudo.copyInvite()')+(navigator.share?tile('📤','Mais opções…','IASDEstudo.shareNative()'):'')+'</div></section>'
  +'<section><div class="es-ptg">'+tile('⛔','Encerrar sala para todos','IASDEstudo.endRoom()','danger')+'</div></section></div>';
 if(!ov){ov=document.createElement('div');ov.id='es-hdr';ov.className='es-pop-ov';ov.addEventListener('click',e=>{if(e.target===ov)toggleHost()});document.body.appendChild(ov)}
 const sc=ov.firstElementChild?ov.firstElementChild.scrollTop:0;ov.innerHTML=html;if(ov.firstElementChild)ov.firstElementChild.scrollTop=sc;
}

/* ---------- chat da sala ---------- */
function addChat(m,quiet){
 const R=S.room;if(!R||!m||!m.text)return;
 const msg={id:String(m.id||'').slice(0,12),name:String(m.name||'?').slice(0,40),text:String(m.text).slice(0,500),t:+m.t||Date.now()};
 if(R.chat.some(x=>x.t===msg.t&&x.id===msg.id&&x.text===msg.text))return;
 R.chat.push(msg);if(R.chat.length>200)R.chat.shift();
 if(!quiet&&msg.id!==R.me&&!R.chatOpen){R.unread++;paintBar()}
 chatList();
}
function sendChat(e){
 if(e)e.preventDefault();const R=S.room,i=$('es-chi');if(!R||!i)return false;
 if(R.lock.c&&!R.host){toast('O dirigente pausou o chat.');return false}
 const text=i.value.trim();if(!text)return false;i.value='';
 const m={id:R.me,name:myName(),text:text.slice(0,500),t:Date.now()};
 addChat(m,true);send('chat',m);i.focus();return false;
}
function chatList(){
 const R=S.room,l=$('es-cl');if(!R||!l)return;
 const near=l.scrollHeight-l.scrollTop-l.clientHeight<60;
 l.innerHTML=R.chat.length?R.chat.map(m=>'<div class="es-cm2'+(m.id===R.me?' me':'')+'"><b>'+esc(m.id===R.me?'Você':m.name)+'</b><span>'+esc(m.text)+'</span></div>').join(''):'<p class="es-note">Ninguém escreveu ainda. Diga um oi!</p>';
 if(near||R.chat[R.chat.length-1]&&R.chat[R.chat.length-1].id===R.me)l.scrollTop=l.scrollHeight;
}
function toggleChat(){const R=S.room;if(!R)return;R.chatOpen=!R.chatOpen;if(R.chatOpen)R.unread=0;paintBar();if(R.chatOpen)setTimeout(()=>{const i=$('es-chi');if(i&&!/iPhone|Android/i.test(navigator.userAgent))i.focus();const l=$('es-cl');if(l)l.scrollTop=l.scrollHeight},50)}
function paintChat(){
 const R=S.room;let c=$('es-chat');
 if(!R){if(c)c.remove();return}
 if(!c){c=document.createElement('section');c.id='es-chat';c.className='es-chat';c.setAttribute('aria-label','Chat da sala');
  c.innerHTML='<div class="es-hh"><b>💬 Chat da sala</b><button type="button" onclick="IASDEstudo.toggleChat()" aria-label="Fechar">✕</button></div><div class="es-cl" id="es-cl"></div><form class="es-cf" onsubmit="return IASDEstudo.sendChat(event)"><input id="es-chi" maxlength="500" autocomplete="off" placeholder="Escreva uma mensagem…"><button class="pg-gold" type="submit">Enviar</button></form>';
  document.body.appendChild(c);chatList()}
 const lobby=R.mode==='lobby',slot=lobby?$('es-lchat'):null;
 if(slot){if(c.parentNode!==slot){slot.appendChild(c);chatList()}c.classList.add('inline','on');R.unread=0}
 else{if(c.parentNode!==document.body){document.body.appendChild(c);chatList()}c.classList.remove('inline');c.classList.toggle('on',!!R.chatOpen&&!lobby)}
}

/* ---------- reconexão ---------- */
let rjT=null;
function scheduleRejoin(){clearTimeout(rjT);rjT=setTimeout(()=>{const R=S.room;if(R&&R.ch&&R.ch.state!=='joined')hardReconnect()},2500)}
function afterRejoin(){
 const R=S.room;if(!R)return;
 if(R.host){pushLesson(true);send('md',{mode:R.mode});send('lk',R.lock)}else send('hello',{id:R.me});
 track();syncVoicePeers();paintBar();paintDock();
}
async function hardReconnect(){
 const R=S.room;if(!R||R.reconnecting)return;R.reconnecting=true;
 const snap={lesson:R.lesson,bi:R.bi,rev:R.rev,ans:R.ans,mode:R.mode,lock:R.lock,hand:R.hand,follow:R.follow,voice:R.voice,soundGroup:R.soundGroup||'',vmute:R.vmute,vhide:R.vhide,hostOpen:R.hostOpen,chat:R.chat,unread:R.unread,chatOpen:R.chatOpen};
 try{R.ch.untrack();cloud().removeChannel(R.ch)}catch(e){}
 try{await startRoom(R.code,R.host,{me:R.me,snap})}catch(e){console.warn('reconexão',e)}
 if(S.room)S.room.reconnecting=false;
}
function voiceHealth(){
 const R=S.room,V=R&&R.voice;if(!V)return;
 if(V.mic&&V.aTrack&&V.aTrack.readyState==='ended'){stopMic();toast('Seu microfone foi desligado pelo aparelho. Toque em 🎙 para ligar de novo.')}
 if(V.cam&&V.vTrack&&V.vTrack.readyState==='ended'){stopCam()}
 Object.keys(V.pcs).forEach(id=>{const pc=V.pcs[id];if(['failed','closed'].includes(pc.connectionState)){closePeer(id)}});
 syncVoicePeers();
}
function tryResume(){
 if(S.room||S.resumed)return;S.resumed=true;
 let r=null;try{r=JSON.parse(localStorage.getItem(RK)||'null')}catch(e){}
 if(!r||!r.code||Date.now()-(r.ts||0)>SAVE_H)return;
 if(suspOver(r)){clearRoom();toast('A sala '+r.code+' foi fechada: ficou suspensa por mais de '+SUSP_MIN+' min.');return}
 const uc=urlCode();if(uc&&uc!==r.code)return;
 if(r.host){
  if(!isF())return;const c=(S.courses||[]).find(x=>x.id===r.cid);if(!c)return;
  S.cid=c.id;S.li=Math.min(r.li||0,Math.max(0,c.lessons.length-1));
  loadProg().then(()=>startRoom(r.code,true,{me:r.me,saved:r})).then(ok=>{if(ok){paint();toast('Você voltou para a sala '+r.code+'.')}});
 }else{
  startRoom(r.code,false,{me:r.me}).then(ok=>{if(ok){paint();toast('Você voltou para a sala '+r.code+'.')}});
 }
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')return;const R=S.room;if(!R)return;if(R.ch&&R.ch.state!=='joined')hardReconnect();else{afterRejoin();voiceHealth()}});
window.addEventListener('online',()=>{const R=S.room;if(R&&R.ch&&R.ch.state!=='joined')hardReconnect()});
setInterval(()=>{const R=S.room;if(!R)return;const a=isAway();if(a!==R.awayLast){R.awayLast=a;track()}},2500);
setInterval(()=>{const R=S.room;if(R&&R.ch&&R.ch.state!=='joined'&&!R.reconnecting&&document.visibilityState==='visible')hardReconnect()},8000);


/* ---------- importar lições (arquivo .json do próprio fundador) ---------- */
function importPick(){const f=$('es-file');if(f){f.value='';f.click()}}
function cleanBlock(b){
 const T=['text','q','v','note','check','list'];if(!b||!T.includes(b.t))return null;
 const str=(x,n)=>String(x==null?'':x).slice(0,n),arr=(x,n)=>Array.isArray(x)?x.slice(0,n).map(y=>str(y,1200)):[];
 const o={id:str(b.id||rid(),24).replace(/[^\w-]/g,'')||rid(),t:b.t};
 if(b.text!=null)o.text=str(b.text,9000);if(b.h!=null)o.h=str(b.h,120);if(b.ref!=null)o.ref=str(b.ref,80);
 if(b.refs)o.refs=arr(b.refs,12);if(b.guide!=null)o.guide=str(b.guide,6000);if(b.note!=null)o.note=str(b.note,9000);
 if(b.opts){o.opts=arr(b.opts,12);o.keys=arr(b.keys,12);o.kind=b.kind==='x'?'x':'vf'}
 if(b.items)o.items=arr(b.items,30);
 return o;
}
async function importFile(inp){
 const f=inp.files&&inp.files[0];if(!f)return;const c=course();if(!c)return;
 let j;try{j=JSON.parse(await f.text())}catch(e){toast('Arquivo inválido (não é um .json).');return}
 const ls=Array.isArray(j)?j:j&&j.lessons;if(!Array.isArray(ls)||!ls.length){toast('Não encontrei lições nesse arquivo.');return}
 const out=ls.map(l=>({id:'lesson-'+crypto.randomUUID(),title:String(l&&l.title||'Lição').slice(0,140),blocks:((l&&l.blocks)||[]).map(cleanBlock).filter(Boolean)}));
 if(!(await IASDDialog.confirm('Importar '+out.length+' lição(ões) para “'+c.title+'”?\n\nO conteúdo atual das lições será substituído. Suas respostas continuam salvas.',{title:'Importar lições',danger:false,ok:'Importar'})))return;
 c.lessons=out;if(j.description)c.description=String(j.description).slice(0,400);
 saveCourse(true);S.edit=false;paint();toast('Importado: '+out.length+' lições.')}

window.IASDEstudo={setSoundGroup,onHowl,sendAns,explain,importPick,importFile,setOpt,toggleCheck,page,after,reload:()=>{S.courses=null;load()},home:homeGo,openCourse,openLesson,course:()=>{S.view='course';S.edit=false;if(S.room&&S.room.host)pushLesson();paint()},setCourse,setLessonTitle,newCourse,delCourse,toggleEdit,addLesson,renameLesson,delLesson,moveLesson,toggleDone,addBlock,editBlock,delBlock,moveBlock,bulk,toggleVerse,createRoom,joinRoom,backToRoom,setPos,toggleFollow,revealToggle,leaveAsk,toggleHand,react,copyInvite,togglePanel,muteFrom,setMode,setLock,toggleHost,toggleChat,sendChat,toggleRx,openStage,challenge,revealCur,setChooser,setScope,breakGo,muteAll,callPeer,shareWA,shareNative,endRoom,startVoice,toggleMic,toggleCam,hideFrom,leaveParked,openGal,closeGal};
window.IASDEstudoCore={stream:id=>{const R=S.room,V=R&&R.voice;if(!V)return null;if(id===R.me)return V.cam&&V.vTrack?new MediaStream([V.vTrack]):null;const ms=V.tiles[id];return ms&&ms.getVideoTracks().some(t=>t.readyState==='live'&&!t.muted)?ms:null},S,send,toast,esc,myName,lessonSrc,parseRef,track,paintBar,repaintRv:paintReveals,muteMic,endedByHost,chapter:(b,c)=>fetchBibleChapter(b,c,'nvi')};
})();
