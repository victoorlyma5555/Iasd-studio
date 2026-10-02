/* IASD APP — extras da comunidade: Campeões, Plano de leitura, Lembrete diário, Cartões e Pedidos de oração.
   Tudo abre em folhas (modais) a partir da Home; nada aqui muda as telas existentes se falhar. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const G=n=>{try{return (0,eval)(n)}catch(e){return undefined}};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const todayKey=()=>new Date().toLocaleDateString('en-CA');
const isFounder=()=>{try{return !!(window.IASDPresence&&IASDPresence.isFounder())}catch(e){return false}};
const canSound=()=>{try{return typeof canUseSound==='function'&&canUseSound()}catch(e){return false}};
const logged=()=>{try{return typeof cloudUser!=='undefined'&&!!cloudUser}catch(e){return false}};
let sheetEl=null;
function close(){sheetEl?.remove();sheetEl=null;document.body.classList.remove('vs-lock')}
function sheet(title,sub,html,cls){
 close();const ov=document.createElement('div');ov.className='vs-ov ex-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',title);
 ov.innerHTML='<div class="vs-card ex-card '+(cls||'')+'"><button class="vs-x" data-ex="close" aria-label="Fechar">✕</button><h3>'+esc(title)+'</h3>'+(sub?'<p class="ex-sub">'+esc(sub)+'</p>':'')+'<div class="ex-body">'+html+'</div><div id="ex-toast" class="vs-toast" role="status"></div></div>';
 document.body.appendChild(ov);document.body.classList.add('vs-lock');sheetEl=ov;
 ov.addEventListener('click',e=>{if(e.target===ov)return close();const b=e.target.closest('[data-ex]');if(!b)return;const k=b.dataset.ex;if(k==='close')return close();(HANDLERS[k]||(()=>{}))(b,e)});
 ov.addEventListener('input',e=>{const t=e.target.closest('[data-in]');if(t&&INPUTS[t.dataset.in])INPUTS[t.dataset.in](t)});
 ov.addEventListener('change',e=>{const t=e.target.closest('[data-in]');if(t&&INPUTS[t.dataset.in])INPUTS[t.dataset.in](t)});
 document.addEventListener('keydown',function k(e){if(!sheetEl){document.removeEventListener('keydown',k);return}if(e.key==='Escape')close()});
 return ov;
}
function body(html){const b=sheetEl?.querySelector('.ex-body');if(b)b.innerHTML=html}
function toast(m){const t=document.getElementById('ex-toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2400)}
const HANDLERS={},INPUTS={};

/* ===================== CAMPEÕES (Domingo Jovem) ===================== */
const CH={scope:'week',rows:{},loading:false,err:'',legacy:false};
const CH_TITLE={day:'Campeões do dia',week:'Campeões da semana',month:'Campeões do mês'};
function chMeta(){return LS.get('iasd-champ-meta',{})}
function chMapRow(x){return {id:x.user_id,name:x.full_name||'Participante',avatar:x.avatar_path,score:Number(x.score||0)}}
async function chLoad(force){
 const sc=CH.scope;if(!force&&CH.rows[sc]&&Date.now()-CH.rows[sc].t<30000)return;
 CH.loading=true;CH.err='';chPaint();
 try{
  const r=await cloud.rpc('iasd_daily_ranking',{p_scope:sc});
  if(r.error)throw r.error;
  CH.legacy=false;CH.rows[sc]={t:Date.now(),list:(r.data||[]).map(chMapRow)};
 }catch(e){
  if(/function|schema cache|does not exist/i.test(e.message||'')){
   CH.legacy=true;const rank=G('gameRanking')||[];
   CH.rows[sc]={t:Date.now(),list:rank.map(x=>({id:x.user_id,name:(x.iasd_profiles||{}).full_name||'Participante',avatar:(x.iasd_profiles||{}).avatar_path,score:Number(x.score||0)}))};
  }else CH.err=e.message||'Falha ao carregar';
 }
 CH.loading=false;chPaint();
}
function chAvatar(p){
 if(p.avatar&&typeof profileMediaUrl==='function'){try{return '<img src="'+esc(profileMediaUrl(p.avatar))+'" alt="">'}catch(e){}}
 return '<span>'+esc(String(p.name).split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase())+'</span>';
}
const fmt=n=>Number(n).toLocaleString('pt-BR');
function chText(){
 const list=(CH.rows[CH.scope]?.list||[]).slice(0,5),m=chMeta(),title=(m['t_'+CH.scope]||CH_TITLE[CH.scope]);
 const medals=['🥇','🥈','🥉','4º','5º'];
 return {title,prize:m.prize||'',lines:list.map((p,i)=>medals[i]+' '+p.name+' — '+fmt(p.score)+' pts')};
}
function chPaint(){
 if(!sheetEl||!sheetEl.querySelector('.ch-wrap'))return;
 const w=sheetEl.querySelector('.ch-wrap');const m=chMeta();const can=canSound()||isFounder();
 const list=CH.rows[CH.scope]?.list||[];const top=list.slice(0,3),rest=list.slice(3,10);
 const col=(p,i,cls)=>p?'<div class="ch-col '+cls+'"><span class="ch-av">'+chAvatar(p)+'</span><b class="ch-mdl">'+(i+1)+'</b><strong>'+esc(p.name)+'</strong><small>'+fmt(p.score)+' pts</small><i class="ch-bar"></i></div>':'<div class="ch-col '+cls+' empty"></div>';
 let pod;
 if(CH.loading&&!list.length)pod='<p class="pg-empty ch-msg">Carregando ranking…</p>';
 else if(CH.err)pod='<p class="pg-empty ch-msg">Não foi possível carregar: '+esc(CH.err)+'</p>';
 else if(!list.length)pod='<p class="pg-empty ch-msg">Ninguém pontuou neste período ainda.</p>';
 else pod='<div class="ch-pod">'+col(top[1],1,'s')+col(top[0],0,'g')+col(top[2],2,'b')+'</div>'+(rest.length?'<ol class="ch-rest" start="4">'+rest.map(p=>'<li><span class="ch-av sm">'+chAvatar(p)+'</span><strong>'+esc(p.name)+'</strong><em>'+fmt(p.score)+' pts</em></li>').join('')+'</ol>':'');
 const tt=m['t_'+CH.scope]||CH_TITLE[CH.scope];
 w.querySelector('.ch-head h2').textContent=tt;
 const pz=w.querySelector('.ch-prize');pz.hidden=!m.prize;pz.innerHTML=m.prize?'🎁 <b>Prêmio:</b> '+esc(m.prize):'';
 w.querySelector('.ch-stage').innerHTML=pod+(CH.legacy?'<p class="ex-note">Ranking geral (o ranking por período ainda não foi ativado no servidor).</p>':'');
 w.querySelectorAll('[data-sc]').forEach(b=>b.classList.toggle('on',b.dataset.sc===CH.scope));
 const ti=w.querySelector('#ch-t');if(ti&&document.activeElement!==ti)ti.value=m['t_'+CH.scope]||'';
 if(ti)ti.placeholder=CH_TITLE[CH.scope];
}
function openChampions(){
 const m=chMeta(),can=canSound()||isFounder();
 sheet('Campeões','Escolha o período do Domingo Jovem.',
 '<div class="ch-wrap"><div class="vs-row ch-sc" role="group" aria-label="Período">'+[['day','Hoje'],['week','Semana (seg–dom)'],['month','Mês']].map(([k,l])=>'<button class="vs-chip'+(CH.scope===k?' on':'')+'" data-sc="'+k+'" data-ex="ch-scope">'+l+'</button>').join('')+'</div>'+
 '<div class="ch-head"><h2></h2></div><div class="ch-prize" hidden></div><div class="ch-stage"></div>'+
 (can?'<div class="ch-edit"><label>Título da premiação<input id="ch-t" data-in="ch-t" maxlength="60" placeholder="'+esc(CH_TITLE[CH.scope])+'" value="'+esc(m['t_'+CH.scope]||'')+'"></label><label>Prêmio<input id="ch-p" data-in="ch-p" maxlength="90" placeholder="Ex.: Camiseta + livro" value="'+esc(m.prize||'')+'"></label></div>':'')+
 '<div class="ex-acts"><button class="vs-b" data-ex="ch-full"><b>Tela cheia</b><small>para o telão</small></button>'+(canSound()?'<button class="vs-b" data-ex="ch-proj"><b>Projetar</b><small>enviar ao telão</small></button>':'')+'<button class="vs-b" data-ex="ch-share"><b>Compartilhar</b><small>cartão em imagem</small></button></div></div>','ex-champ');
 chPaint();chLoad(true);
}
HANDLERS['ch-scope']=b=>{CH.scope=b.dataset.sc;chPaint();chLoad(false)};
INPUTS['ch-t']=t=>{const m=chMeta();m['t_'+CH.scope]=t.value.trim();LS.set('iasd-champ-meta',m);chPaint()};
INPUTS['ch-p']=t=>{const m=chMeta();m.prize=t.value.trim();LS.set('iasd-champ-meta',m);chPaint()};
HANDLERS['ch-full']=()=>{const el=sheetEl?.querySelector('.ex-card');if(!el)return;el.classList.toggle('ch-fs');try{if(el.classList.contains('ch-fs'))(sheetEl.requestFullscreen||sheetEl.webkitRequestFullscreen||(()=>{})).call(sheetEl);else if(document.fullscreenElement)document.exitFullscreen()}catch(e){}};
HANDLERS['ch-proj']=()=>{const c=chText();if(!c.lines.length)return toast('Sem campeões para projetar.');try{project('🏆 '+c.title+'\n\n'+c.lines.join('\n')+(c.prize?'\n\n🎁 Prêmio: '+c.prize:''));toast('Enviado ao telão')}catch(e){toast('Não foi possível projetar agora')}};
HANDLERS['ch-share']=()=>{const c=chText();if(!c.lines.length)return toast('Sem campeões para compartilhar.');const keep=sheetEl;window.IASDVerseShare.open({head:c.title,text:c.lines.join('  '),list:c.lines,raw:true,noref:!c.prize,ref:c.prize?'🎁 '+c.prize:'',plain:'🏆 '+c.title+'\n'+c.lines.join('\n')+(c.prize?'\n🎁 Prêmio: '+c.prize:''),theme:'festa',title:'Compartilhar campeões'})};

/* ===================== PLANO DE LEITURA (Bíblia em 1 ano) ===================== */
const PLAN_KEY='iasd-plan-v1';
function planAll(){
 const books=G('bibleBooks')||[],counts=G('bibleChapterCounts')||[];const out=[];
 books.forEach((b,i)=>{for(let c=1;c<=(counts[i]||0);c++)out.push([i,c])});return out;
}
function planDay(d){ // d: 1..365
 const all=planAll(),N=all.length,a=Math.floor((d-1)*N/365),b=Math.floor(d*N/365);return all.slice(a,Math.max(b,a+1));
}
function planLabel(list){
 const books=G('bibleBooks')||[];if(!list.length)return '';
 const f=list[0],l=list[list.length-1];
 if(f[0]===l[0])return books[f[0]][0]+' '+f[1]+(l[1]!==f[1]?'–'+l[1]:'');
 return books[f[0]][0]+' '+f[1]+' – '+books[l[0]][0]+' '+l[1];
}
function planState(){
 const s=LS.get(PLAN_KEY,null);
 try{const m=cloudUser?.user_metadata?.iasd_plan;if(m&&(!s||(m.t||0)>(s.t||0))){LS.set(PLAN_KEY,m);return m}}catch(e){}
 return s;
}
let planTimer=null;
function planSave(s){
 s.t=Date.now();LS.set(PLAN_KEY,s);
 if(logged()&&typeof cloud!=='undefined'){clearTimeout(planTimer);planTimer=setTimeout(()=>{try{cloud.auth.updateUser({data:{iasd_plan:s}})}catch(e){}},1500)}
}
function planDayNow(s){const a=new Date(s.start+'T00:00:00'),b=new Date(todayKey()+'T00:00:00');return Math.floor((b-a)/864e5)+1}
function planStats(){
 const s=planState();if(!s||!s.start)return {done:0,streak:0,started:false};
 const done=new Set(s.done||[]);let n=planDayNow(s),streak=0;if(!done.has(n))n--;while(n>=1&&done.has(n)){streak++;n--}
 return {done:done.size,streak,started:true};
}
const PLAN_BADGES=[['Primeiro dia','1 dia lido','🌱',d=>d.done>=1],['3 dias seguidos','Sequência de 3 dias','🔥',d=>d.best>=3],['Semana com a Palavra','7 dias seguidos','📖',d=>d.best>=7],['Constante','30 dias seguidos','⭐',d=>d.best>=30],['Meio caminho','Metade do plano lida','⛰️',d=>d.done>=183],['Cem dias','100 dias lidos','💯',d=>d.done>=100],['Bíblia completa','365 dias lidos','👑',d=>d.done>=365]];
function planBest(set){const a=[...set].sort((x,y)=>x-y);let best=0,run=0,prev=-9;a.forEach(d=>{run=d===prev+1?run+1:1;prev=d;if(run>best)best=run});return best}
function planBadgesHTML(done,st){const d={done:done.size,best:Math.max(st.streak,planBest(done))};return '<div class="pl-badges" aria-label="Selos do plano">'+PLAN_BADGES.map(b=>{const on=b[3](d);return '<span class="pl-bd'+(on?' on':'')+'" title="'+esc(b[1])+'"><i>'+(on?b[2]:'🔒')+'</i><b>'+esc(b[0])+'</b></span>'}).join('')+'</div>'}
const planUI={sel:0};
function planHTML(){
 const s=planState();
 if(!s||!s.start)return '<div class="pl-start"><div class="pl-emoji">📖</div><h4>Bíblia em 1 ano</h4><p>Todos os 1.189 capítulos em 365 dias, cerca de 3 por dia, do Gênesis ao Apocalipse. Seu progresso fica salvo na sua conta.</p><button class="pg-gold" data-ex="pl-start">Começar hoje</button></div>';
 const done=new Set(s.done||[]),today=Math.min(365,Math.max(1,planDayNow(s))),sel=planUI.sel||today,st=planStats();
 const list=planDay(sel),lbl=planLabel(list),isDone=done.has(sel);
 const pct=Math.round(done.size*100/365);
 let cells='';for(let d=1;d<=365;d++){const c=done.has(d)?'ok':(d<today?'late':(d===today?'now':''));cells+='<button class="pl-d '+c+(d===sel?' sel':'')+'" data-ex="pl-sel" data-d="'+d+'" aria-label="Dia '+d+(done.has(d)?' lido':'')+'"></button>'}
 return '<div class="pl-stats"><div><b>'+done.size+'</b><small>dias lidos</small></div><div><b>'+pct+'%</b><small>da Bíblia</small></div><div><b>'+st.streak+'</b><small>'+(st.streak===1?'dia seguido':'dias seguidos')+'</small></div></div>'+
 '<div class="pl-bar"><i style="width:'+pct+'%"></i></div>'+planBadgesHTML(done,st)+
 '<div class="pl-today"><small>'+(sel===today?'Hoje · ':'')+'Dia '+sel+' de 365</small><h4>'+esc(lbl)+'</h4><p>'+list.length+' capítulo'+(list.length===1?'':'s')+'</p><div class="ex-acts two"><button class="vs-b" data-ex="pl-read"><b>Ler agora</b><small>abrir na Bíblia</small></button><button class="vs-b '+(isDone?'':'wa')+'" data-ex="pl-done"><b>'+(isDone?'✓ Lido (desfazer)':'Marcar como lido')+'</b><small>dia '+sel+'</small></button></div></div>'+
 '<div class="pl-grid" aria-label="Calendário do plano">'+cells+'</div><div class="pl-leg"><i class="ok"></i>lido<i class="now"></i>hoje<i class="late"></i>atrasado</div>'+
 '<button class="pl-reset" data-ex="pl-reset">Recomeçar o plano</button>';
}
function openPlan(){planUI.sel=0;sheet('Plano de leitura','Bíblia em 1 ano',planHTML(),'ex-plan')}
HANDLERS['pl-start']=()=>{planSave({start:todayKey(),done:[]});planUI.sel=0;body(planHTML())};
HANDLERS['pl-sel']=b=>{planUI.sel=+b.dataset.d;body(planHTML())};
HANDLERS['pl-done']=()=>{const s=planState();if(!s)return;const d=planUI.sel||Math.min(365,Math.max(1,planDayNow(s)));const set=new Set(s.done||[]);set.has(d)?set.delete(d):set.add(d);s.done=[...set].sort((a,b)=>a-b);planSave(s);body(planHTML());toast(set.has(d)?'Dia '+d+' concluído 🙌':'Marcação removida')};
HANDLERS['pl-read']=()=>{const s=planState();if(!s)return;const d=planUI.sel||Math.min(365,Math.max(1,planDayNow(s)));const f=planDay(d)[0];const books=G('bibleBooks');if(!f||!books)return;try{readerState.book=books[f[0]][1];readerState.chapter=f[1];saveReader();window.__rdGoto=null}catch(e){}close();go('Bíblia')};
HANDLERS['pl-reset']=async ()=>{if((await IASDDialog.confirm('Recomeçar o plano do dia 1? Seu progresso atual será apagado.'))){planSave({start:todayKey(),done:[]});planUI.sel=0;body(planHTML())}};

/* ===================== LEMBRETE DIÁRIO ===================== */
const RM_KEY='iasd-remind-v1';
const rm=()=>LS.get(RM_KEY,{on:false,hour:'07:00',last:''});
function passageNow(){try{return window.IASDUI?.passage?.()||null}catch(e){return null}}
function remindTick(){
 const r=rm();if(!r.on||!('Notification' in window)||Notification.permission!=='granted')return;
 const now=new Date(),[h,m]=String(r.hour||'07:00').split(':').map(Number);
 if(r.last===todayKey()||now.getHours()*60+now.getMinutes()<h*60+m)return;
 const p=passageNow();const text=p?p.text.replace(/[“”]/g,'')+' — '+p.ref:'Seu versículo do dia está esperando por você.';
 const o={body:text,icon:'/icon-192.png',tag:'iasd-daily'};
 try{if(navigator.serviceWorker?.ready)navigator.serviceWorker.ready.then(reg=>reg.showNotification('📖 Versículo do dia',o)).catch(()=>new Notification('📖 Versículo do dia',o));else new Notification('📖 Versículo do dia',o)}catch(e){try{new Notification('📖 Versículo do dia',o)}catch(_){}}
 r.last=todayKey();LS.set(RM_KEY,r);
}
function remindHTML(){
 const r=rm(),p=passageNow(),perm=('Notification' in window)?Notification.permission:'unsupported';
 return '<div class="rm-verse"><small>Versículo de hoje</small><q>'+esc(p?p.text.replace(/[“”]/g,''):'Carregando…')+'</q><b>'+esc(p?p.ref:'')+'</b></div>'+
 '<div class="ex-acts two"><button class="vs-b wa" data-ex="rm-share"><b>Compartilhar versículo</b><small>cartão em imagem</small></button><button class="vs-b" data-ex="rm-read"><b>Ler o capítulo</b><small>abrir na Bíblia</small></button></div>'+
 '<div class="rm-box"><label class="rm-sw"><input type="checkbox" data-in="rm-on" '+(r.on&&perm==='granted'?'checked':'')+(perm==='unsupported'||perm==='denied'?' disabled':'')+'><span>Avisar neste aparelho</span></label>'+
 '<label class="rm-time">às <input type="time" data-in="rm-hour" value="'+esc(r.hour)+'"></label></div>'+
 '<p class="ex-note">'+(perm==='denied'?'As notificações estão bloqueadas neste navegador. Libere nas configurações do site.':perm==='unsupported'?'Este navegador não permite notificações.':'O aviso aparece quando você abrir o IASD APP depois do horário escolhido. Para um alarme que toca com o app fechado, use o calendário abaixo.')+'</p>'+
 '<button class="vs-b" data-ex="rm-ics"><b>📅 Adicionar ao calendário</b><small>alarme diário no seu celular (arquivo .ics)</small></button>';
}
function openRemind(){sheet('Lembrete de leitura','Comece o dia com a Palavra.',remindHTML(),'ex-rm');const p=passageNow();if(!p||!p.loaded){setTimeout(()=>{if(sheetEl&&sheetEl.querySelector('.rm-verse'))body(remindHTML())},1500)}}
INPUTS['rm-hour']=t=>{const r=rm();r.hour=t.value||'07:00';r.last='';LS.set(RM_KEY,r)};
INPUTS['rm-on']=async t=>{
 const r=rm();
 if(t.checked){let perm=Notification.permission;if(perm!=='granted')perm=await Notification.requestPermission();if(perm!=='granted'){t.checked=false;r.on=false;LS.set(RM_KEY,r);body(remindHTML());return}r.on=true;r.last='';LS.set(RM_KEY,r);toast('Lembrete ativado');remindTick()}
 else{r.on=false;LS.set(RM_KEY,r);toast('Lembrete desativado')}
};
HANDLERS['rm-share']=()=>{const p=passageNow();if(p)window.IASDVerseShare.open({text:p.text,ref:p.ref,link:true})};
HANDLERS['rm-read']=()=>{const p=passageNow();if(!p)return;try{readerState.book=p.book;readerState.chapter=p.chapter;window.__rdGoto={book:p.book,chapter:Number(p.chapter),from:Number(p.verse)||1,to:0};saveReader()}catch(e){}close();go('Bíblia')};
HANDLERS['rm-ics']=()=>{
 const r=rm(),[h,m]=String(r.hour||'07:00').split(':').map(Number),d=new Date();const pad=n=>String(n).padStart(2,'0');
 const dt=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(h)+pad(m)+'00';
 const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//IASD APP//Lembrete//PT','BEGIN:VEVENT','UID:iasd-leitura-diaria@iasdapp.com.br','DTSTAMP:'+dt,'DTSTART:'+dt,'DURATION:PT15M','RRULE:FREQ=DAILY','SUMMARY:📖 Leitura diária – IASD APP','DESCRIPTION:Abra o IASD APP e leia o versículo do dia: '+location.origin,'URL:'+location.origin,'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Leitura diária','TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download='leitura-diaria-iasd-app.ics';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);toast('Abra o arquivo para adicionar ao calendário');
};

/* ===================== CARTÕES (aniversário e datas) ===================== */
const CARD_TYPES={
 aniv:{n:'Aniversário',head:'Feliz aniversário, {n}!',v:'O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e tenha misericórdia de ti.',r:'Números 6:24-25'},
 bodas:{n:'Bodas',head:'Parabéns, {n}! Feliz aniversário de casamento',v:'Melhor é serem dois do que um, porque têm melhor paga do seu trabalho.',r:'Eclesiastes 4:9'},
 batismo:{n:'Batismo',head:'Parabéns pelo seu batismo, {n}!',v:'Se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.',r:'2 Coríntios 5:17'},
 formatura:{n:'Formatura',head:'Parabéns pela conquista, {n}!',v:'Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.',r:'Jeremias 29:11'},
 gratidao:{n:'Gratidão',head:'Obrigado, {n}!',v:'Dou graças ao meu Deus todas as vezes que me lembro de vós.',r:'Filipenses 1:3'},
 bencao:{n:'Bênção',head:'Deus abençoe você, {n}',v:'O Senhor te guardará de todo o mal; guardará a tua alma.',r:'Salmos 121:7'}
};
const CD={type:'aniv',name:''};
function cardDates(){
 try{const lines=(typeof data!=='undefined'&&data&&data.datas)||[];const d=new Date(),out=[];
  lines.forEach(x=>{const m=/^\s*(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?\s*[—–-]\s*(.+)$/.exec(String(x));if(!m)return;const day=+m[1],mon=+m[2];const t=new Date(d.getFullYear(),mon-1,day);const diff=Math.round((t-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);if(diff>=0&&diff<=7)out.push({diff,label:m[3].trim()})});
  return out.sort((a,b)=>a.diff-b.diff).slice(0,6)}catch(e){return []}
}
function cardHTML(){
 const t=CARD_TYPES[CD.type],dates=cardDates();
 return '<div class="vs-row cd-types" role="group" aria-label="Tipo de cartão">'+Object.entries(CARD_TYPES).map(([k,v])=>'<button class="vs-chip'+(CD.type===k?' on':'')+'" data-ex="cd-type" data-k="'+k+'">'+v.n+'</button>').join('')+'</div>'+
 '<label class="ex-f">Nome da pessoa<input id="cd-name" data-in="cd-name" maxlength="40" placeholder="Ex.: Maria" value="'+esc(CD.name)+'"></label>'+
 (dates.length?'<div class="cd-dates"><small>Datas desta semana (toque para usar o nome)</small>'+dates.map(x=>'<button class="vs-chip" data-ex="cd-date" data-l="'+esc(x.label)+'">'+(x.diff===0?'Hoje':'em '+x.diff+'d')+' · '+esc(x.label)+'</button>').join('')+'</div>':'')+
 '<label class="ex-f">Versículo<textarea id="cd-v" data-in="cd-v" rows="3" maxlength="300">'+esc(t.v)+'</textarea></label>'+
 '<label class="ex-f">Referência<input id="cd-r" data-in="cd-r" maxlength="40" value="'+esc(t.r)+'"></label>'+
 '<button class="pg-gold ex-wide" data-ex="cd-make">Criar cartão</button>';
}
function openCards(){sheet('Cartão de parabéns','Crie e compartilhe um cartão no mesmo estilo dos versículos.',cardHTML(),'ex-cd')}
HANDLERS['cd-type']=b=>{CD.type=b.dataset.k;const n=sheetEl.querySelector('#cd-name')?.value||CD.name;CD.name=n;body(cardHTML())};
HANDLERS['cd-date']=b=>{const l=b.dataset.l.replace(/^(anivers[aá]rio|bodas|batismo|forma[tç]ura)\s*(de|do|da)?\s*/i,'').trim();CD.name=l.split(/\s+/).slice(0,2).join(' ');sheetEl.querySelector('#cd-name').value=CD.name};
INPUTS['cd-name']=t=>{CD.name=t.value};
HANDLERS['cd-make']=()=>{
 const t=CARD_TYPES[CD.type],name=(sheetEl.querySelector('#cd-name').value||'').trim();
 if(!name){toast('Digite o nome da pessoa');sheetEl.querySelector('#cd-name').focus();return}
 const v=sheetEl.querySelector('#cd-v').value.trim()||t.v,r=sheetEl.querySelector('#cd-r').value.trim();
 const first=name.split(/\s+/)[0];CD.name=name;
 window.IASDVerseShare.open({head:t.head.replace('{n}',first),text:v,ref:r,theme:'festa',title:'Cartão de '+t.n.toLowerCase()});
};

/* ===================== PEDIDOS DE ORAÇÃO ===================== */
const PR={rows:[],err:'',off:false,loading:false,anon:false,draft:''};
const ago=iso=>{const s=(Date.now()-new Date(iso))/1000;if(s<90)return 'agora';if(s<3600)return Math.round(s/60)+' min';if(s<86400)return Math.round(s/3600)+' h';return Math.round(s/86400)+' d'};
async function prLoad(){
 if(!logged()){PR.err='login';prPaint();return}
 PR.loading=true;prPaint();
 try{const r=await cloud.rpc('iasd_prayer_list');if(r.error)throw r.error;PR.rows=r.data||[];PR.err='';PR.off=false}
 catch(e){PR.off=/function|schema cache|does not exist/i.test(e.message||'');PR.err=e.message||'Falha'}
 PR.loading=false;prPaint();
}
function prPaint(){
 const w=sheetEl?.querySelector('.pr-list');if(!w)return;
 const mod=isFounder()||!!(window.IASDAccess&&logged()&&IASDAccess.canModeratePrayer(cloudRole));
 if(PR.err==='login'){w.innerHTML='<p class="pg-empty">Entre na sua conta para ver e participar do mural.</p><button class="pg-gold ex-wide" data-ex="pr-login">Entrar</button>';return}
 if(PR.off){w.innerHTML='<p class="pg-empty">O mural ainda não foi ativado no servidor. O administrador precisa rodar o arquivo <b>docs/supabase-oracao.sql</b> no Supabase.</p>';return}
 if(PR.err){w.innerHTML='<p class="pg-empty">'+esc(PR.err)+'</p>';return}
 if(PR.loading&&!PR.rows.length){w.innerHTML='<p class="pg-empty">Carregando…</p>';return}
 if(!PR.rows.length){w.innerHTML='<p class="pg-empty">Nenhum pedido ainda. Seja o primeiro a compartilhar.</p>';return}
 w.innerHTML=PR.rows.map(p=>'<article class="pr-it'+(p.answered?' ans':'')+'"><div class="pr-h"><b>'+(p.anonymous?'🙈 Anônimo':esc(p.author||'Irmão(ã)'))+'</b><small>'+ago(p.created_at)+'</small>'+(p.answered?'<span class="pr-tag">Respondida 🙌</span>':'')+'</header><p>'+esc(p.body)+'</p><div class="pr-f"><button class="pr-pray'+(p.i_prayed?' on':'')+'" data-ex="pr-pray" data-id="'+esc(p.id)+'">🙏 '+(p.i_prayed?'Estou orando':'Orar por isso')+' · '+p.amens+'</button>'+((p.mine||mod)?'<button class="pr-sm" data-ex="pr-ans" data-id="'+esc(p.id)+'">'+(p.answered?'Reabrir':'Marcar respondida')+'</button><button class="pr-sm del" data-ex="pr-del" data-id="'+esc(p.id)+'">Apagar</button>':'')+'</div></article>').join('');
}
function openPrayers(){
 sheet('Pedidos de oração','Um lugar para a igreja orar junto.',
 '<div class="pr-form"><textarea id="pr-t" data-in="pr-t" rows="3" maxlength="400" placeholder="Compartilhe seu pedido de oração…">'+esc(PR.draft)+'</textarea><div class="pr-row"><label class="rm-sw"><input type="checkbox" id="pr-a" data-in="pr-a" '+(PR.anon?'checked':'')+'><span>Publicar como anônimo</span></label><button class="pg-gold" data-ex="pr-send">Publicar</button></div><small class="ex-note">Seu nome só aparece se você não marcar anônimo. Evite dados pessoais de terceiros.</small></div><div class="pr-list"></div>','ex-pr');
 prPaint();prLoad();
}
INPUTS['pr-t']=t=>{PR.draft=t.value};INPUTS['pr-a']=t=>{PR.anon=t.checked};
async function prCall(fn,args,ok){try{const r=await cloud.rpc(fn,args);if(r.error)throw r.error;if(ok)toast(ok);await prLoad()}catch(e){toast(e.message||'Não foi possível')}}
HANDLERS['pr-login']=()=>{close();try{openAuthModal()}catch(e){}};
HANDLERS['pr-send']=async()=>{if(!logged())return HANDLERS['pr-login']();const t=(sheetEl.querySelector('#pr-t').value||'').trim();if(t.length<3)return toast('Escreva o seu pedido');await prCall('iasd_prayer_add',{p_body:t,p_anonymous:!!sheetEl.querySelector('#pr-a').checked},'Pedido publicado 🙏');PR.draft='';const el=sheetEl?.querySelector('#pr-t');if(el)el.value=''};
HANDLERS['pr-pray']=b=>prCall('iasd_prayer_toggle',{p_id:b.dataset.id});
HANDLERS['pr-ans']=b=>prCall('iasd_prayer_answer',{p_id:b.dataset.id});
HANDLERS['pr-del']=async b=>{if((await IASDDialog.confirm('Apagar este pedido?')))prCall('iasd_prayer_delete',{p_id:b.dataset.id},'Pedido apagado')};


/* ===================== FAVORITOS (passagens) ===================== */
const FAV_KEY='iasd-favs-v2';
const bookName=id=>{try{return (bibleBooks.find(b=>b[1]===id)||[])[0]||id}catch(e){return id}};
const trLabel=t=>({acf:'ACF',aa:'AA',nvi:'NVI',almeida:'ALM',kjv:'KJV',web:'WEB'})[t]||String(t||'').toUpperCase();
const favKey=p=>[p.book,p.chapter,p.from||0,p.to||0,p.tr].join('|');
function favs(){
 let a=LS.get(FAV_KEY,null);
 if(a===null){ // migra os capítulos salvos no esquema antigo, uma única vez
  a=[];try{(readerState.bookmarks||[]).forEach(k=>{const [b,c]=String(k).split('|');if(b&&c)a.push({id:[b,+c,0,0,readerState.translation||'nvi'].join('|'),book:b,chapter:+c,from:0,to:0,tr:readerState.translation||'nvi',text:'',t:Date.now()-a.length})})}catch(e){}
  LS.set(FAV_KEY,a);
 }
 return a;
}
let favTimer=null;
function favPush(a){
 if(!logged()||typeof cloud==='undefined')return;clearTimeout(favTimer);
 favTimer=setTimeout(()=>{try{cloud.auth.updateUser({data:{iasd_favs:a.slice(0,40).map(f=>[f.book,f.chapter,f.from,f.to,f.tr,f.t].join('|'))}})}catch(e){}},1500);
}
function favPut(a){LS.set(FAV_KEY,a);favPush(a)}
function favPull(){
 try{const m=cloudUser?.user_metadata?.iasd_favs;if(!Array.isArray(m)||!m.length)return false;
  const a=favs(),have=new Set(a.map(f=>f.id));let ch=false;
  m.forEach(r=>{const [book,chapter,from,to,tr,t]=String(r).split('|');const id=[book,+chapter,+from,+to,tr].join('|');if(book&&!have.has(id)){a.push({id,book,chapter:+chapter,from:+from,to:+to,tr,text:'',t:+t||Date.now()});ch=true}});
  if(ch)LS.set(FAV_KEY,a);return ch}catch(e){return false}
}
const favHas=p=>!!p&&!!p.chapter&&favs().some(f=>f.id===favKey(p));
function favToggle(p){
 const a=favs(),k=favKey(p),i=a.findIndex(f=>f.id===k);
 if(i>=0){a.splice(i,1);favPut(a);return false}
 a.unshift({id:k,book:p.book,chapter:p.chapter,from:p.from||0,to:p.to||0,tr:p.tr,text:String(p.text||'').slice(0,400),t:Date.now()});
 favPut(a.slice(0,200));return true;
}
const favCount=()=>{try{return favs().length}catch(e){return 0}};
const favRef=f=>bookName(f.book)+' '+f.chapter+(f.from?':'+f.from+(f.to&&f.to!==f.from?'-'+f.to:''):'');
const FV={q:''};
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function favHTML(){
 const q=fold(FV.q),all=favs().slice().sort((a,b)=>b.t-a.t);
 const list=q?all.filter(f=>fold(favRef(f)+' '+f.text).includes(q)):all;
 const head='<label class="fv-s"><input id="fv-q" data-in="fv-q" type="search" placeholder="Buscar nos favoritos…" value="'+esc(FV.q)+'" aria-label="Buscar nos favoritos"></label>';
 if(!all.length)return '<div class="fv-empty"><div class="pl-emoji">⭐</div><h4>Nenhum favorito ainda</h4><p>Na Bíblia, toque nos versículos que você quer guardar e depois toque na estrela ★ ao lado do capítulo. Sem selecionar nada, a estrela guarda o capítulo.</p></div>';
 return head+(list.length?'<div class="fv-list">'+list.map(f=>'<article class="fv-it"><div class="fv-h"><b>'+esc(favRef(f))+'</b><span class="fv-tr">'+esc(trLabel(f.tr))+'</span></div><p>'+(f.text?esc(f.text):'<i>Toque em “Abrir” para ler a passagem.</i>')+'</p><div class="fv-a"><button class="fv-open" data-ex="fv-open" data-id="'+esc(f.id)+'">Abrir</button><button data-ex="fv-share" data-id="'+esc(f.id)+'">Compartilhar</button><button data-ex="fv-copy" data-id="'+esc(f.id)+'">Copiar</button><button class="del" data-ex="fv-del" data-id="'+esc(f.id)+'" aria-label="Remover dos favoritos">Remover</button></div></article>').join('')+'</div>':'<p class="pg-empty">Nada encontrado para “'+esc(FV.q)+'”.</p>');
}
async function favFill(){
 const a=favs();let ch=false;
 for(const f of a.filter(x=>!x.text).slice(0,8)){
  try{const vs=await fetchBibleChapter(f.book,f.chapter,f.tr);const sel=f.from?vs.filter(v=>v.verse>=f.from&&v.verse<=(f.to||f.from)):vs.slice(0,2);f.text=sel.map(v=>v.text.trim()).join(' ').slice(0,400);ch=true}catch(e){}
 }
 if(ch){LS.set(FAV_KEY,a);if(sheetEl&&sheetEl.querySelector('.fv-list'))body(favHTML())}
}
function openFavs(){FV.q='';favPull();sheet('Meus favoritos','Passagens que você guardou.',favHTML(),'ex-fv');favFill()}
INPUTS['fv-q']=t=>{FV.q=t.value;const pos=t.selectionStart;body(favHTML());const n=sheetEl.querySelector('#fv-q');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}};
const favById=id=>favs().find(f=>f.id===id);
HANDLERS['fv-open']=b=>{const f=favById(b.dataset.id);if(!f)return;try{readerState.book=f.book;readerState.chapter=f.chapter;readerState.translation=f.tr;window.__rdGoto=f.from?{book:f.book,chapter:f.chapter,from:f.from,to:f.to||0}:null;saveReader()}catch(e){}close();if(typeof current!=='undefined'&&current==='Bíblia'){render();readerLoad()}else go('Bíblia')};
HANDLERS['fv-share']=b=>{const f=favById(b.dataset.id);if(!f)return;if(!f.text)return toast('Abra a passagem primeiro para carregar o texto.');window.IASDVerseShare.open({text:f.text,ref:favRef(f),ver:trLabel(f.tr),link:true})};
HANDLERS['fv-copy']=async b=>{const f=favById(b.dataset.id);if(!f)return;if(!f.text)return toast('Abra a passagem primeiro para carregar o texto.');try{await navigator.clipboard.writeText('“'+f.text+'” — '+favRef(f)+' ('+trLabel(f.tr)+')');toast('Texto copiado ✓')}catch(e){toast('Não foi possível copiar')}};
HANDLERS['fv-del']=b=>{const a=favs().filter(f=>f.id!==b.dataset.id);favPut(a);body(favHTML());try{IASDPages.favRefresh()}catch(e){}toast('Removido dos favoritos')};

/* ===================== API ===================== */
const OPEN={champ:openChampions,plan:openPlan,remind:openRemind,cards:openCards,prayer:openPrayers,fav:openFavs};
function planToday(){const s=planState();if(!s||!s.start)return null;const d=Math.min(365,Math.max(1,planDayNow(s)));return {day:d,label:planLabel(planDay(d)),done:(s.done||[]).includes(d)}}
window.IASDExtras={favHas,favToggle,favCount,planToday,open:k=>{try{(OPEN[k]||(()=>{}))()}catch(e){console.warn('[extras]',e)}},planStats,remindTick,close};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)remindTick()});
/* link compartilhado: iasdapp.com.br/biblia?ref=João+3:16 abre a Bíblia direto na passagem */
function openSharedRef(){
 try{
  const u=new URL(location.href),ref=u.searchParams.get('ref');if(!ref||!window.IASDBibleRef||typeof bibleBooks==='undefined')return;
  const r=IASDBibleRef.parse(ref,bibleBooks);u.searchParams.delete('ref');history.replaceState(null,'',u.pathname+(u.search||'')+u.hash);if(!r)return;
  const idx=bibleBooks.findIndex(x=>x[1]===r.book),max=bibleChapterCounts[idx]||150,chapter=Math.min(r.chapter,max);
  readerState.book=r.book;readerState.chapter=chapter;window.__rdGoto={book:r.book,chapter,from:r.from,to:r.to};saveReader();
  if(current!=='Bíblia')go('Bíblia');else{render();readerLoad()}
 }catch(e){console.warn('[ref]',e)}
}
window.addEventListener('load',()=>setTimeout(openSharedRef,500));
setTimeout(remindTick,4000);
})();
