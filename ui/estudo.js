/* Sala de Estudo (fase fundador): cursos e lições editáveis, estudo individual salvo na conta,
   sala ao vivo sincronizada (classe/dupla) com voz e vídeo (WebRTC) e projeção no telão. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cloud=()=>window.iasdCloud||null;
const user=()=>{try{return typeof window.iasdCurrentUser==='function'?window.iasdCurrentUser():null}catch(e){return null}};
const isF=()=>{try{return !!user()&&cloudRole==='founder'}catch(e){return false}};
const rid=()=>Math.random().toString(36).slice(2,9);
const $=id=>document.getElementById(id);
const toast=m=>{try{IASDPages.toast(m)}catch(e){}let t=$('bb-toast');if(!t){t=document.createElement('div');t.id='bb-toast';t.className='bb-toast';document.body.appendChild(t)}t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2400)};
const OVDD=['A Bíblia Sagrada','A Beleza da Criação Divina','A Origem do Mal','O Plano da Salvação','Fé, Arrependimento e Confissão','Sinais da Volta de Cristo','A Volta de Cristo','O Milênio','A Verdade Sobre a Morte','A Nova Terra','Salvação pela Graça','O Santuário de Deus','O Juízo','As Leis na Bíblia','A Lei Moral','O Mandamento Esquecido','Do Sábado para o Domingo','Princípios de Saúde','O Dom de Profecia','O Dízimo','Ofertar, um Ato de Adoração','Como Identificar a Igreja Verdadeira','Porque Devo Ser Batizado','Princípios da Vida Cristã','Educação Cristã','A Vida no Espírito','Um Ministério para Todos'];
const LS_PROG='iasd-study-prog-',SEED_OLD=['Jesus e as Sagradas Escrituras','Jesus e o amor divino','Jesus e a restauração do bem','Jesus e a oração','Jesus e a salvação','Jesus e a intercessão','Jesus e o destino do mundo','Jesus e a vida eterna','Jesus e o juízo','Jesus e a lei de Deus','Jesus e o sábado','Jesus e a igreja','Jesus e o crescimento espiritual','Jesus e a fidelidade','Jesus e o batismo','Jesus e o estilo de vida cristão','Jesus e a missão da igreja','Jesus e o dom de profecia','Jesus e o Espírito Santo','Jesus e a nova terra'];
const ICE=()=>({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}].concat(window.IASD_TURN||[])});

const S={view:'home',courses:null,err:'',cid:null,li:0,edit:false,prog:{},room:null,openV:{}};
const course=()=>(S.courses||[]).find(c=>c.id===S.cid)||null;
const myName=()=>{try{const p=myProfile;if(p&&p.full_name)return p.full_name}catch(e){}const u=user();return (u&&(u.user_metadata?.full_name||(u.email||'').split('@')[0]))||'Fundador'};

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
  S.courses=r.data;S.err='';
  if(S.cid&&!course())S.cid=null;
  if(S.cid)await loadProg();
 }catch(e){S.err=sqlMsg(e);S.courses=S.courses||[]}
 paint();
}
async function loadProg(){
 const id=S.cid;let loc={};try{loc=JSON.parse(localStorage.getItem(LS_PROG+id)||'{}')}catch(e){}
 S.prog=loc;
 try{const u=user(),r=await cloud().from('iasd_study_progress').select('data,updated_at').eq('course_id',id).eq('user_id',u.id).maybeSingle();
  if(r.data&&r.data.data)S.prog={...loc,...r.data.data}}catch(e){}
}
let saveT=null,courseT=null;
function saveProg(){
 try{localStorage.setItem(LS_PROG+S.cid,JSON.stringify(S.prog))}catch(e){}
 clearTimeout(saveT);saveT=setTimeout(async()=>{try{const u=user();if(!u||!S.cid)return;await cloud().from('iasd_study_progress').upsert({user_id:u.id,course_id:S.cid,data:S.prog,updated_at:new Date().toISOString()})}catch(e){console.warn('Estudo: progresso',e)}},900);
}
function saveCourse(now){
 const c=course();if(!c)return;clearTimeout(courseT);
 const run=async()=>{try{const r=await cloud().from('iasd_study_courses').update({title:c.title,description:c.description,lessons:c.lessons,updated_at:new Date().toISOString()}).eq('id',c.id);if(r.error)throw r.error}catch(e){toast('Não salvou: '+sqlMsg(e))}};
 if(now)run();else courseT=setTimeout(run,700);
}
const lesson=()=>{const c=course();return c&&c.lessons[S.li]||null};
const lp=(li)=>S.prog[li]||(S.prog[li]={a:{},d:false});

/* ---------- versículos ---------- */
function parseRef(t){try{return IASDBibleRef.parse(t,bibleBooks)}catch(e){return null}}
async function verseHtml(ref){
 const r=parseRef(ref);if(!r)return '<em>Referência não reconhecida.</em>';
 try{
  const vs=await fetchBibleChapter(r.book,r.chapter);
  const from=r.from||1,to=r.from?(r.to||r.from):Math.min(vs.length?vs[vs.length-1].verse:1,40);
  const pick=vs.filter(v=>v.verse>=from&&v.verse<=to);
  if(!pick.length)return '<em>Versículo não encontrado.</em>';
  return pick.map(v=>'<p><sup>'+v.verse+'</sup> '+esc(String(v.text).trim())+'</p>').join('');
 }catch(e){return '<em>Não foi possível carregar agora.</em>'}
}
async function verseText(ref){const h=await verseHtml(ref);return h.replace(/<sup>(\d+)<\/sup>/g,'$1 ').replace(/<\/p>/g,' ').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim()}

/* ---------- páginas ---------- */
const I=n=>{try{return IASDUI.icon?IASDUI.icon(n):''}catch(e){return ''}};
function page(){
 if(!isF())return '<div class="pg"><div class="pg-card"><h2>Acesso restrito</h2><p>A Sala de Estudo está em testes e é exclusiva do fundador.</p></div></div>';
 return '<div class="pg es" id="es-root"><div class="pg-card pg-empty">Carregando…</div></div>';
}
function after(){if(!isF())return;if(S.courses===null)load();else paint();paintBar();paintDock()}
function paint(){
 const root=$('es-root');if(!root)return;
 if(S.err&&!(S.courses||[]).length){root.innerHTML='<div class="pg-card"><h2>Sala de Estudo</h2><p class="es-err">'+esc(S.err)+'</p><button class="pg-gold" onclick="IASDEstudo.reload()">Tentar de novo</button></div>';return}
 if(S.view==='lesson'&&lessonSrc())root.innerHTML=lessonHTML();
 else if(S.view==='course'&&course())root.innerHTML=courseHTML();
 else root.innerHTML=homeHTML();
 afterPaint();
}
function homeHTML(){
 const cs=S.courses||[];
 return '<div class="es-hero"><div><span class="es-kick">ESTUDO BÍBLICO</span><h1>Sala de <em>Estudo</em></h1><p>Estude sozinho ou ao vivo com sua classe — no PC ou no celular, com voz e vídeo, tudo sincronizado.</p></div><span class="es-beta">TESTE · só fundador</span></div>'
 +'<div class="es-grid">'
 +'<section class="pg-card"><h2 class="es-h">📚 Meus cursos</h2>'+(cs.length?cs.map(c=>{const n=c.lessons.length;return '<button class="es-course" onclick="IASDEstudo.openCourse(\''+c.id+'\')"><b>'+esc(c.title)+'</b><small>'+n+' lição(ões)</small><span>›</span></button>'}).join(''):'<p class="muted">Nenhum curso ainda.</p>')
 +'<button class="pg-ghost es-wide" onclick="IASDEstudo.newCourse()">＋ Novo curso</button></section>'
 +'<section class="pg-card"><h2 class="es-h">🎥 Sala ao vivo</h2>'
 +(S.room?'<p class="muted">Você está na sala <b>'+esc(S.room.code)+'</b>.</p><button class="pg-gold es-wide" onclick="IASDEstudo.backToRoom()">Voltar à sala</button>'
  :'<p class="muted">Crie uma sala e passe o código, ou entre numa sala existente. O dirigente conduz e todos acompanham a mesma lição.</p>'
  +'<button class="pg-gold es-wide" onclick="IASDEstudo.createRoom()">Criar sala (sou o dirigente)</button>'
  +'<div class="es-join"><input id="es-code" maxlength="8" placeholder="CÓDIGO" autocomplete="off" autocapitalize="characters"><button class="pg-ghost" onclick="IASDEstudo.joinRoom()">Entrar</button></div>')
 +'<small class="es-note">Voz e vídeo funcionam direto entre os aparelhos. Em algumas redes 4G pode ser preciso um servidor de apoio (TURN).</small></section>'
 +'</div>';
}
function pct(c,id){let d=0;(c.lessons||[]).forEach((l,i)=>{if(S.prog[i]&&S.prog[i].d)d++});return c.lessons.length?Math.round(d*100/c.lessons.length):0}
function courseHTML(){
 const c=course(),p=pct(c);
 return '<div class="es-top"><button class="pg-ghost" onclick="IASDEstudo.home()">‹ Cursos</button>'+(S.room?'':'')+'</div>'
 +'<div class="pg-card es-chead">'+(S.edit?'<input class="es-in es-title" value="'+esc(c.title)+'" oninput="IASDEstudo.setCourse(\'title\',this.value)"><textarea class="es-in" rows="2" oninput="IASDEstudo.setCourse(\'description\',this.value)" placeholder="Descrição">'+esc(c.description)+'</textarea>':'<h2 class="es-h">'+esc(c.title)+'</h2><p class="muted">'+esc(c.description)+'</p>')
 +'<div class="es-prog"><i style="width:'+p+'%"></i></div><small>'+p+'% concluído</small>'
 +'<div class="es-row"><button class="pg-ghost" onclick="IASDEstudo.importPick()">⬆ Importar lições</button><input type="file" id="es-file" accept=".json,application/json" hidden onchange="IASDEstudo.importFile(this)"><button class="pg-ghost" onclick="IASDEstudo.toggleEdit()">'+(S.edit?'✔ Concluir edição':'✎ Editar curso')+'</button>'+(S.edit?'<button class="pg-ghost" onclick="IASDEstudo.addLesson()">＋ Lição</button><button class="pg-danger" onclick="IASDEstudo.delCourse()">Excluir curso</button>':'')+'</div></div>'
 +'<div class="es-lessons">'+c.lessons.map((l,i)=>{const d=S.prog[i]&&S.prog[i].d,n=(l.blocks||[]).length,ans=Object.values((S.prog[i]||{}).a||{}).filter(Boolean).length;
  return '<div class="es-lrow'+(d?' done':'')+'"><button class="es-lbtn" onclick="IASDEstudo.openLesson('+i+')"><span class="es-n">'+(d?'✔':(i+1))+'</span><span><b>'+esc(l.title)+'</b><small>'+(n?n+' itens'+(ans?' · '+ans+' respondida(s)':''):'sem conteúdo ainda')+'</small></span></button>'
  +(S.edit?'<span class="es-mv"><button onclick="IASDEstudo.moveLesson('+i+',-1)" aria-label="Subir">▲</button><button onclick="IASDEstudo.moveLesson('+i+',1)" aria-label="Descer">▼</button><button onclick="IASDEstudo.renameLesson('+i+')" aria-label="Renomear">✎</button><button onclick="IASDEstudo.delLesson('+i+')" aria-label="Excluir">🗑</button></span>':'')+'</div>'}).join('')+'</div>';
}
/* fonte da lição: dirigente usa a própria; participante usa a que o dirigente enviou */
function lessonSrc(){
 const R=S.room;
 if(R&&!R.host&&S.view==='lesson'&&R.follow&&R.lesson)return R.lesson;
 if(R&&!R.host&&R.lesson&&!course())return R.lesson;
 const l=lesson();return l?{li:S.li,title:l.title,blocks:l.blocks||[]}:(R&&R.lesson)||null;
}
function curBi(){return S.room?S.room.bi:-1}
function lessonHTML(){
 const L=lessonSrc(),R=S.room,host=!R||R.host,editing=S.edit&&host&&!R;
 const li=L.li!=null?L.li:S.li,P=lp(li);
 let h='<div class="es-top"><button class="pg-ghost" onclick="IASDEstudo.'+(R&&!R.host?'home':'course')+'()">‹ '+(R&&!R.host?'Sair da lição':'Lições')+'</button>'
  +(host&&!R?'<button class="pg-ghost" onclick="IASDEstudo.toggleEdit()">'+(S.edit?'✔ Concluir':'✎ Editar lição')+'</button>':'')
  +(R?'<span class="es-badge">'+(R.host?'Você conduz':(R.follow?'Seguindo o dirigente':'Leitura livre'))+'</span>':'')
  +(R&&!R.host?'<button class="pg-ghost" onclick="IASDEstudo.toggleFollow()">'+(R.follow?'Parar de seguir':'Seguir o dirigente')+'</button>':'')+'</div>';
 h+='<div class="pg-card es-lesson"><span class="es-kick">LIÇÃO '+(li+1)+'</span>'+(editing?'<input class="es-in es-title" value="'+esc(L.title)+'" oninput="IASDEstudo.setLessonTitle(this.value)">':'<h2 class="es-h">'+esc(L.title)+'</h2>');
 if(!L.blocks.length&&!editing)h+='<p class="muted">Esta lição ainda não tem conteúdo.'+(host?' Toque em “Editar lição” e cole o texto, as perguntas e os versículos.':'')+'</p>';
 h+='<div class="es-blocks">'+L.blocks.map((b,i)=>blockHTML(b,i,li,P,editing)).join('')+'</div>';
 if(editing)h+=editorHTML();
 if(!R||host)h+='<div class="es-end"><button class="'+(P.d?'pg-ghost':'pg-gold')+'" onclick="IASDEstudo.toggleDone('+li+')">'+(P.d?'✔ Lição concluída (desfazer)':'Marcar lição como concluída')+'</button>'+nextBtn(li)+'</div>';
 return h+'</div>';
}
function nextBtn(li){const c=course();if(!c||li>=c.lessons.length-1)return '';return '<button class="pg-ghost" onclick="IASDEstudo.openLesson('+(li+1)+')">Próxima lição ›</button>'}
function gl(b,i){return '<span class="es-bctl">'+(S.edit&&!S.room?'<button onclick="IASDEstudo.moveBlock('+i+',-1)">▲</button><button onclick="IASDEstudo.moveBlock('+i+',1)">▼</button><button onclick="IASDEstudo.editBlock('+i+')">✎</button><button onclick="IASDEstudo.delBlock('+i+')">🗑</button>':'')+'</span>'}
function optVals(b,P){const v=((P.a||{})[b.id]||'');if(b.kind==='vf'){const a=v.split(',');while(a.length<b.opts.length)a.push('');return a}return v}
function fmtAns(b,v){if(b.kind==='vf')return b.opts.map((o,i)=>(v.split(',')[i]||'—')+' · '+o).join('\n');if(b.kind==='x'){const i=+v;return isNaN(i)||v===''?'':b.opts[i]}return v}
function optsHTML(b,P,editing){
 const v=optVals(b,P),dis=editing?' disabled':'';
 if(b.kind==='vf')return '<div class="es-opts">'+b.opts.map((o,i)=>'<div class="es-opt"><span>'+esc(o)+'</span><span class="es-vf"><button'+dis+' class="'+(v[i]==='V'?'on v':'')+'" onclick="IASDEstudo.setOpt(\''+b.id+'\','+i+',\'V\')">V</button><button'+dis+' class="'+(v[i]==='F'?'on f':'')+'" onclick="IASDEstudo.setOpt(\''+b.id+'\','+i+',\'F\')">F</button></span></div>').join('')+'</div>';
 return '<div class="es-opts">'+b.opts.map((o,i)=>'<label class="es-opt"><input type="radio"'+dis+' name="o-'+esc(b.id)+'" '+(String(v)===String(i)?'checked':'')+' onchange="IASDEstudo.setOpt(\''+b.id+'\','+i+',\'x\')"><span>'+esc(o)+'</span></label>').join('')+'</div>';
}
function guideHTML(b){
 let h='';
 if(b.opts&&b.keys){h+='<div class="es-gab">'+b.opts.map((o,i)=>'<div>'+(b.kind==='vf'?'<b>'+esc(b.keys[i])+'</b>':(b.keys[i]==='X'?'<b>✔</b>':'<b>·</b>'))+' '+esc(o)+'</div>').join('')+'</div>'}
 if(b.guide)h+='<p>'+esc(b.guide).replace(/\n/g,'<br>')+'</p>';
 if(b.note)h+='<p class="es-cm">'+esc(b.note)+'</p>';
 return h?'<details class="es-guide"><summary>Resposta-guia e comentário</summary>'+h+'</details>':'';
}
function blockHTML(b,i,li,P,editing){
 const R=S.room,cur=R&&R.bi===i,host=!R||R.host;
 let ctl;
 if(editing)ctl=gl(b,i);
 else{ctl='<span class="es-bctl">';if(R&&R.host)ctl+='<button onclick="IASDEstudo.setPos('+i+')" title="Levar a turma para cá">▶ Aqui</button>';if(host)ctl+='<button onclick="IASDEstudo.project('+i+')" title="Projetar no telão">📺</button>';ctl+='</span>'}
 const cls='es-b es-'+b.t+(cur?' es-cur':'');
 if(b.t==='q'){
  const chips=(b.refs||[]).length?'<div class="es-chips">'+b.refs.map((r,ri)=>'<button class="es-chip'+(S.openV[li+':'+b.id+':'+ri]?' on':'')+'" onclick="IASDEstudo.toggleVerse(\''+li+':'+b.id+':'+ri+'\',\''+esc(r).replace(/'/g,'')+'\')">📖 '+esc(r)+'</button>').join('')+'</div>'+b.refs.map((r,ri)=>'<div class="es-vt" data-vk="'+li+':'+b.id+':'+ri+'"></div>').join(''):'';
  const ans=(P.a||{})[b.id]||'';
  return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><b>❓ '+esc(b.text)+'</b>'+ctl+'</div>'+chips
   +(host?guideHTML(b):'')
   +(b.opts?optsHTML(b,P,editing):'<textarea class="es-ans" rows="2" data-bid="'+esc(b.id)+'" placeholder="Sua resposta…" '+(editing?'disabled':'')+'>'+esc(ans)+'</textarea>')
   +(R?'<div class="es-rv" data-rv="'+esc(b.id)+'"></div>':'')+'</div>';
 }
 if(b.t==='v'){
  const key=li+':'+b.id,open=S.openV[key];
  return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><button class="es-vbtn" onclick="IASDEstudo.toggleVerse(\''+key+'\',\''+esc(b.ref).replace(/'/g,'')+'\')">📖 '+esc(b.ref)+'</button>'+ctl+'</div><div class="es-vt" data-vk="'+esc(key)+'">'+(open||'')+'</div></div>';
 }
 if(b.t==='note')return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><b>'+esc(b.h||'')+'</b>'+ctl+'</div><p class="es-nt-p">'+esc(b.text).replace(/\n/g,'<br>')+'</p></div>';
 if(b.t==='check'){const on=(((P.a||{})[b.id])||'').split(',');return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><b>✅ '+esc(b.h||'')+'</b>'+ctl+'</div>'+(b.items||[]).map((t,k)=>'<label class="es-ck"><input type="checkbox" '+(on.includes(String(k))?'checked':'')+' onchange="IASDEstudo.toggleCheck(\''+b.id+'\','+k+')"><span>'+esc(t)+'</span></label>').join('')+'</div>'}
 if(b.t==='list')return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh"><b>📚 '+esc(b.h||'')+'</b>'+ctl+'</div><ol class="es-ol">'+(b.items||[]).map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol></div>';
 return '<div class="'+cls+'" data-bi="'+i+'"><div class="es-bh es-th"><p>'+esc(b.text).replace(/\n/g,'<br>')+'</p>'+ctl+'</div></div>';
}
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
  t.addEventListener('input',()=>{const L=lessonSrc(),li=L.li!=null?L.li:S.li,bid=t.dataset.bid;lp(li).a[bid]=t.value;saveProg();if(S.room)debounceSend(bid,t.value)});
 });
 root.querySelectorAll('.es-vt').forEach(el=>{const k=el.dataset.vk;if(S.openV[k])el.innerHTML=S.openV[k]});
 if(S.room){paintReveals();markCur(false)}
}
let ansT=null;
function debounceSend(bid,text){const R=S.room;if(R)(R.ans[bid]=R.ans[bid]||{})[R.me]={name:myName(),text};clearTimeout(ansT);ansT=setTimeout(()=>{if(S.room){send('ans',{bid,id:S.room.me,name:myName(),text});paintReveals()}},700)}

/* ---------- ações (dados) ---------- */
function homeGo(){S.view='home';S.edit=false;paint()}
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
async function addLesson(){const c=course();c.lessons.push({title:'Lição '+(c.lessons.length+1),blocks:[]});saveCourse(true);paint()}
async function renameLesson(i){const c=course(),t=await IASDDialog.prompt('Título da lição:',c.lessons[i].title,{title:'Renomear lição'});if(t==null||!t.trim())return;c.lessons[i].title=t.trim();saveCourse(true);paint()}
async function delLesson(i){const c=course();if(!(await IASDDialog.confirm('Excluir a lição “'+c.lessons[i].title+'”?')))return;c.lessons.splice(i,1);S.prog={};saveCourse(true);paint()}
function moveLesson(i,d){const c=course(),j=i+d;if(j<0||j>=c.lessons.length)return;const a=c.lessons;[a[i],a[j]]=[a[j],a[i]];const p=S.prog,x=p[i];p[i]=p[j];p[j]=x;saveProg();saveCourse(true);paint()}
function toggleDone(li){const P=lp(li);P.d=!P.d;saveProg();paint()}
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
 const R=S.room,isH=!R||R.host;
 const q=()=>document.querySelector('.es-vt[data-vk="'+key+'"]');
 if(S.openV[key]){delete S.openV[key];if(q())q().innerHTML='';if(R&&R.host&&!remote)send('vo',{key,ref,open:false});markChips();return}
 if(q())q().innerHTML='<em>Carregando…</em>';
 const h=await verseHtml(ref)+(isH?'<button class="es-pj" onclick="IASDEstudo.projectRef(\''+ref.replace(/'/g,'')+'\')">📺 Projetar este versículo</button>':'');
 S.openV[key]=h;if(q())q().innerHTML=h;markChips();
 if(R&&R.host&&!remote)send('vo',{key,ref,open:true});
}
function markChips(){document.querySelectorAll('.es-chip').forEach(c=>{const m=(c.getAttribute('onclick')||'').match(/toggleVerse\('([^']+)'/);if(m)c.classList.toggle('on',!!S.openV[m[1]])})}
function setOpt(bid,idx,val){
 const L=lessonSrc(),li=L.li!=null?L.li:S.li,b=L.blocks.find(x=>x.id===bid);if(!b)return;const P=lp(li);
 if(b.kind==='vf'){const a=optVals(b,P);a[idx]=a[idx]===val?'':val;P.a[bid]=a.join(',')}else P.a[bid]=String(idx);
 saveProg();
 const box=[...document.querySelectorAll('.es-b.es-q')].find(x=>x.querySelector('[onclick*="\''+bid+'\'"],[name="o-'+bid+'"]'));
 if(box){const old=box.querySelector('.es-opts');if(old){old.outerHTML=optsHTML(b,P,false)}}
 if(S.room)debounceSend(bid,fmtAns(b,P.a[bid]||''));
}
function toggleCheck(bid,k){
 const L=lessonSrc(),li=L.li!=null?L.li:S.li,P=lp(li);let a=(P.a[bid]||'').split(',').filter(x=>x!=='');
 a=a.includes(String(k))?a.filter(x=>x!==String(k)):a.concat(String(k));P.a[bid]=a.join(',');saveProg()}

/* ---------- projetar no telão ---------- */
function sendTelao(title,text){try{if(typeof sendProjection!=='function')throw 0;sendProjection('IASD_TEXT:'+JSON.stringify({title,text}));toast('Enviado ao telão.')}catch(e){toast('Abra o Studio de Projeção para projetar.')}}
async function project(i){
 const L=lessonSrc();const b=L&&L.blocks[i];if(!b)return;
 let title='Estudo bíblico',text='';
 if(b.t==='q'){title='Pergunta';text=b.text+(b.opts?'\n\n'+b.opts.map(o=>'• '+o).join('\n'):'')}
 else if(b.t==='v'){title=b.ref;text=await verseText(b.ref)}
 else if(b.t==='note'){title=b.h||'';text=b.text}
 else if(b.t==='check'||b.t==='list'){title=b.h||'';text=(b.items||[]).join('\n')}
 else text=b.text;
 sendTelao(title,text);
}
async function projectRef(ref){sendTelao(ref,await verseText(ref))}

/* ---------- sala ao vivo ---------- */
function mkCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=A[Math.floor(Math.random()*A.length)];return s}
function send(ev,payload){const R=S.room;if(!R||!R.ch)return;try{R.ch.send({type:'broadcast',event:ev,payload})}catch(e){}}
async function startRoom(code,host){
 const c=cloud();if(!c){toast('Sem conexão com o servidor.');return false}
 if(S.room)leave(true);
 const me=rid();
 const R=S.room={code,host,me,peers:{},bi:-1,rev:{},ans:{},lesson:null,follow:true,hand:false,voice:null,ch:null,reacts:[]};
 const ch=R.ch=c.channel('study:'+code,{config:{broadcast:{self:false},presence:{key:me}}});
 ch.on('broadcast',{event:'hello'},({payload})=>{if(R.host)pushLesson(true)});
 ch.on('broadcast',{event:'st'},({payload})=>{if(R.host)return;R.lesson=payload.lesson;R.bi=payload.bi;R.rev=payload.rev||{};if(R.follow){S.view='lesson';paint()}else paintBar()});
 ch.on('broadcast',{event:'pos'},({payload})=>{if(R.host)return;R.bi=payload.bi;markCur(true)});
 ch.on('broadcast',{event:'rev'},({payload})=>{R.rev[payload.bid]=payload.on;if(payload.on)shareAnswer(payload.bid);paintReveals()});
 ch.on('broadcast',{event:'ans'},({payload})=>{(R.ans[payload.bid]=R.ans[payload.bid]||{})[payload.id]={name:payload.name,text:payload.text};paintReveals()});
 ch.on('broadcast',{event:'vo'},async({payload})=>{if(R.host||!R.follow)return;if(!!S.openV[payload.key]!==!!payload.open)await toggleVerse(payload.key,payload.ref,true)});
 ch.on('broadcast',{event:'rx'},({payload})=>floatReact(payload.e,payload.name));
 ch.on('broadcast',{event:'sig'},({payload})=>{if(payload.to===me)onSig(payload)});
 ch.on('presence',{event:'sync'},()=>{const st=ch.presenceState();R.peers={};Object.keys(st).forEach(k=>{if(k!==me&&st[k][0])R.peers[k]=st[k][0]});
  Object.keys(R.voice?R.voice.pcs:{}).forEach(id=>{if(!R.peers[id])closePeer(id)});
  paintBar();paintDock();if(R.voice)syncVoicePeers()});
 await new Promise(res=>ch.subscribe(async st=>{
  if(st==='SUBSCRIBED'){await track();res()}
  if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'){toast('Não foi possível conectar à sala.');res()}
 }));
 if(!host)send('hello',{id:me});
 else{S.view='lesson'}
 paint();paintBar();paintDock();return true
}
async function track(){const R=S.room;if(!R||!R.ch)return;try{await R.ch.track({id:R.me,name:myName(),host:R.host,hand:R.hand,voice:!!R.voice,mic:R.voice?R.voice.mic:false,cam:R.voice?R.voice.cam:false})}catch(e){}}
function createRoom(){if(!course()&&!(S.courses||[]).length){toast('Crie um curso antes.');return}
 const c=course()||S.courses[0];S.cid=c.id;loadProg().then(async()=>{await startRoom(mkCode(),true);toast('Sala criada. Passe o código '+S.room.code+' aos participantes.')})}
async function joinRoom(){const v=($('es-code')&&$('es-code').value||'').trim().toUpperCase();if(v.length<4){toast('Digite o código da sala.');return}
 await startRoom(v,false);if(S.room)toast('Aguardando o dirigente…')}
function pushLesson(force){const R=S.room;if(!R||!R.host)return;const l=lesson();if(!l)return;R.lesson={li:S.li,title:l.title,blocks:(l.blocks||[]).map(b=>{const o={...b};delete o.guide;delete o.note;delete o.keys;return o})};send('st',{lesson:R.lesson,bi:R.bi,rev:R.rev})}
function setPos(i){const R=S.room;if(!R||!R.host)return;R.bi=i;send('pos',{bi:i});markCur(false)}
function markCur(scroll){const R=S.room;if(!R)return;document.querySelectorAll('.es-b').forEach(el=>el.classList.toggle('es-cur',R.bi===+el.dataset.bi));
 if(scroll&&R.follow){const el=document.querySelector('.es-b.es-cur');if(el)el.scrollIntoView({block:'center',behavior:'smooth'})}}
function toggleFollow(){const R=S.room;if(!R||R.host)return;R.follow=!R.follow;paint();if(R.follow)markCur(true)}
function myAnswer(bid){const L=lessonSrc();if(!L)return '';const li=L.li!=null?L.li:S.li;return ((S.prog[li]||{}).a||{})[bid]||''}
function shareAnswer(bid){const R=S.room;if(!R)return;const text=myAnswer(bid);if(!text.trim())return;(R.ans[bid]=R.ans[bid]||{})[R.me]={name:myName(),text};send('ans',{bid,id:R.me,name:myName(),text})}
function revealToggle(bid){const R=S.room;if(!R||!R.host)return;R.rev[bid]=!R.rev[bid];send('rev',{bid,on:R.rev[bid]});if(R.rev[bid])shareAnswer(bid);paintReveals()}
function paintReveals(){
 const R=S.room;if(!R)return;
 document.querySelectorAll('[data-rv]').forEach(el=>{
  const bid=el.dataset.rv,all=R.ans[bid]||{},arr=Object.values(all).filter(a=>a.text&&a.text.trim()),on=R.rev[bid];
  let h=(arr.length?'<small>'+arr.length+' respondeu</small>':'<small>Ninguém respondeu ainda</small>');
  if(R.host)h+=' <button class="es-rvb" onclick="IASDEstudo.revealToggle(\''+bid+'\')">'+(on?'Ocultar respostas':'Revelar respostas')+'</button>';
  if(on&&arr.length)h+='<div class="es-rl">'+arr.map(a=>'<div><b>'+esc(a.name)+'</b><span>'+esc(a.text)+'</span></div>').join('')+'</div>';
  el.innerHTML=h;
 });
}
function leave(silent){
 const R=S.room;if(!R)return;stopVoice(true);
 try{R.ch.untrack();cloud().removeChannel(R.ch)}catch(e){}
 S.room=null;paintBar();paintDock();if(!silent){toast('Você saiu da sala.');paint()}
}
function backToRoom(){S.view='lesson';paint()}
function toggleHand(){const R=S.room;if(!R)return;R.hand=!R.hand;track();paintBar()}
function react(e){send('rx',{e,name:myName()});floatReact(e,'Você')}
function floatReact(e,name){const d=document.createElement('div');d.className='es-fl';d.innerHTML=esc(e)+'<small>'+esc(name||'')+'</small>';d.style.left=(20+Math.random()*60)+'%';document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
function copyInvite(){const R=S.room;if(!R)return;const t='Entre na Sala de Estudo do IASD APP: '+location.origin+' → Estudo → código '+R.code;
 if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast('Convite copiado.'));else toast('Código: '+R.code)}

/* barra da sala (fixa) */
function paintBar(){
 let bar=$('es-bar');const R=S.room;
 if(!R){if(bar)bar.remove();return}
 if(!bar){bar=document.createElement('div');bar.id='es-bar';bar.className='es-bar';document.body.appendChild(bar)}
 const peers=Object.values(R.peers),n=peers.length+1,v=R.voice;
 const names=[{name:myName()+' (você)',hand:R.hand,voice:!!v,mic:v&&v.mic,host:R.host}].concat(peers);
 bar.innerHTML='<div class="es-bar-in"><button class="es-pill" onclick="IASDEstudo.togglePanel()" aria-label="Participantes"><b>'+esc(R.code)+'</b><span>👥 '+n+'</span></button>'
  +'<button class="es-bt'+(v?' on':'')+'" onclick="IASDEstudo.'+(v?'stopVoice':'startVoice')+'()">'+(v?'📞 Sair da voz':'🎙 Entrar na voz')+'</button>'
  +(v?'<button class="es-bt'+(v.mic?'':' off')+'" onclick="IASDEstudo.toggleMic()">'+(v.mic?'🎙':'🔇')+'</button><button class="es-bt'+(v.cam?' on':'')+'" onclick="IASDEstudo.toggleCam()">'+(v.cam?'📷':'🚫')+'</button>':'')
  +'<button class="es-bt'+(R.hand?' on':'')+'" onclick="IASDEstudo.toggleHand()" aria-label="Levantar a mão">✋</button>'
  +'<span class="es-rx">'+['🙏','👍','❤️','😮'].map(e=>'<button onclick="IASDEstudo.react(\''+e+'\')">'+e+'</button>').join('')+'</span>'
  +'<button class="es-bt" onclick="IASDEstudo.copyInvite()" aria-label="Copiar convite">🔗</button>'
  +'<button class="es-bt danger" onclick="IASDEstudo.leaveAsk()">Sair</button></div>'
  +'<div class="es-panel" id="es-panel" hidden>'+names.map(p=>'<div><span class="es-av">'+esc((p.name||'?').charAt(0).toUpperCase())+'</span><b>'+esc(p.name||'?')+'</b>'+(p.host?'<i>dirigente</i>':'')+(p.hand?' ✋':'')+(p.voice?(p.mic?' 🎙':' 🔇'):'')+(p.cam?' 📷':'')+'</div>').join('')+'</div>';
}
function togglePanel(){const p=$('es-panel');if(p)p.hidden=!p.hidden}
async function leaveAsk(){if(await IASDDialog.confirm('Sair da sala de estudo?'))leave()}

/* ---------- voz e vídeo (WebRTC em malha; sinalização pelo canal da sala) ---------- */
async function startVoice(){
 const R=S.room;if(!R||R.voice)return;
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Este navegador não permite microfone (use HTTPS).');return}
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}catch(e){toast('Permita o microfone para entrar na voz.');return}
 R.voice={stream,mic:true,cam:false,pcs:{},tiles:{},camTrack:null};
 await track();syncVoicePeers();paintBar();paintDock();toast('Você entrou na voz.');
}
function syncVoicePeers(){const R=S.room;if(!R||!R.voice)return;Object.keys(R.peers).forEach(id=>{if(R.peers[id].voice&&!R.voice.pcs[id])mkPeer(id)})}
function mkPeer(id){
 const R=S.room,V=R.voice;if(!V||V.pcs[id])return V&&V.pcs[id];
 const pc=new RTCPeerConnection(ICE());pc.polite=R.me>id;pc.mk=false;pc.ignore=false;V.pcs[id]=pc;
 V.stream.getTracks().forEach(t=>pc.addTrack(t,V.stream));
 if(V.camTrack)pc.addTrack(V.camTrack,V.stream);
 pc.onnegotiationneeded=async()=>{try{pc.mk=true;await pc.setLocalDescription();sig(id,'desc',pc.localDescription)}catch(e){console.warn(e)}finally{pc.mk=false}};
 pc.onicecandidate=e=>{if(e.candidate)sig(id,'ice',e.candidate)};
 pc.ontrack=e=>{const ms=e.streams[0]||new MediaStream([e.track]);V.tiles[id]=ms;
  ms.onaddtrack=ms.onremovetrack=()=>paintDock();e.track.onmute=e.track.onunmute=()=>paintDock();paintDock()};
 pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState))paintDock()};
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
function closePeer(id){const V=S.room&&S.room.voice;if(!V)return;const pc=V.pcs[id];if(pc){try{pc.close()}catch(e){}delete V.pcs[id]}delete V.tiles[id];paintDock()}
function stopVoice(silent){
 const R=S.room;if(!R||!R.voice)return;const V=R.voice;
 Object.keys(V.pcs).forEach(id=>{try{V.pcs[id].close()}catch(e){}});
 V.stream.getTracks().forEach(t=>t.stop());if(V.camTrack)V.camTrack.stop();
 R.voice=null;track();paintBar();paintDock();if(silent!==true)toast('Você saiu da voz.');
}
function toggleMic(){const V=S.room&&S.room.voice;if(!V)return;V.mic=!V.mic;V.stream.getAudioTracks().forEach(t=>t.enabled=V.mic);track();paintBar();paintDock()}
async function toggleCam(){
 const R=S.room,V=R&&R.voice;if(!V)return;
 if(V.cam){V.cam=false;const t=V.camTrack;V.camTrack=null;Object.values(V.pcs).forEach(pc=>{pc.getSenders().forEach(s=>{if(s.track===t)try{pc.removeTrack(s)}catch(e){}})});if(t)t.stop();track();paintBar();paintDock();return}
 let vs;try{vs=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'}})}catch(e){toast('Permita a câmera para ligar o vídeo.');return}
 const t=vs.getVideoTracks()[0];V.camTrack=t;V.cam=true;Object.values(V.pcs).forEach(pc=>pc.addTrack(t,V.stream));track();paintBar();paintDock();
}
function paintDock(){
 let dock=$('es-dock');const R=S.room,V=R&&R.voice;
 document.body.classList.toggle('es-dk',!!V);
 if(!V){if(dock)dock.remove();return}
 if(!dock){dock=document.createElement('div');dock.id='es-dock';dock.className='es-dock';document.body.appendChild(dock)}
 const ids=Object.keys(R.peers).filter(id=>R.peers[id].voice);
 const tile=(id,name,ms,mic,self)=>{const hasV=ms&&ms.getVideoTracks().some(t=>t.readyState==='live'&&!t.muted);
  return '<div class="es-tile'+(hasV?' vid':'')+'" data-t="'+id+'"><video autoplay playsinline '+(self?'muted':'')+'></video><span class="es-av">'+esc((name||'?').charAt(0).toUpperCase())+'</span><small>'+esc(name||'?')+(mic===false?' 🔇':'')+'</small></div>'};
 dock.innerHTML=tile('me',myName(),V.camTrack?new MediaStream([V.camTrack]):null,V.mic,true)+ids.map(id=>tile(id,R.peers[id].name,V.tiles[id],R.peers[id].mic,false)).join('');
 dock.querySelectorAll('.es-tile').forEach(el=>{const id=el.dataset.t,v=el.querySelector('video');
  const ms=id==='me'?(V.camTrack?new MediaStream([V.camTrack]):null):V.tiles[id];if(ms)v.srcObject=ms;
  if(id!=='me')v.play&&v.play().catch(()=>{})});
}


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
 const out=ls.map(l=>({title:String(l&&l.title||'Lição').slice(0,140),blocks:((l&&l.blocks)||[]).map(cleanBlock).filter(Boolean)}));
 if(!(await IASDDialog.confirm('Importar '+out.length+' lição(ões) para “'+c.title+'”?\n\nO conteúdo atual das lições será substituído. Suas respostas continuam salvas.',{title:'Importar lições',danger:false,ok:'Importar'})))return;
 c.lessons=out;if(j.description)c.description=String(j.description).slice(0,400);
 saveCourse(true);S.edit=false;paint();toast('Importado: '+out.length+' lições.')}

window.IASDEstudo={importPick,importFile,setOpt,toggleCheck,projectRef,page,after,reload:()=>{S.courses=null;load()},home:homeGo,openCourse,openLesson,course:()=>{S.view='course';S.edit=false;paint()},setCourse,setLessonTitle,newCourse,delCourse,toggleEdit,addLesson,renameLesson,delLesson,moveLesson,toggleDone,addBlock,editBlock,delBlock,moveBlock,bulk,toggleVerse,project,createRoom,joinRoom,backToRoom,setPos,toggleFollow,revealToggle,leaveAsk,toggleHand,react,copyInvite,togglePanel,startVoice,stopVoice,toggleMic,toggleCam};
})();
