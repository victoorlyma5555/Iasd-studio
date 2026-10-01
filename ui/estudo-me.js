/* Meu estudo: respostas, lições concluídas, selos e troféu — ficam no perfil.
   Convidado: guarda só neste aparelho e, ao concluir, oferece criar conta/entrar.
   Logado: salva direto (localStorage + tabela iasd_study_me, se existir). */
(function(){
const GK='iasd-study-me-guest',UK=id=>'iasd-study-me-'+id;
const cloud=()=>window.iasdCloud||null;
const user=()=>{try{return typeof window.iasdCurrentUser==='function'?window.iasdCurrentUser():null}catch(e){return null}};
const empty=()=>({v:1,courses:{},st:{rooms:0,won:0},ts:0});
let D=null,key='',saveT=null,asked=false,tableOk=true;
const rd=k=>{try{const o=JSON.parse(localStorage.getItem(k)||'null');return o&&o.v?o:null}catch(e){return null}};
const wr=(k,o)=>{try{localStorage.setItem(k,JSON.stringify(o))}catch(e){}};
function merge(a,b){ // une dois registros: vence o mais recente em cada item
 const o=empty();o.st.rooms=Math.max(a.st.rooms||0,b.st.rooms||0);o.st.won=Math.max(a.st.won||0,b.st.won||0);
 for(const src of [a,b])for(const cid in src.courses){
  const c=src.courses[cid],t=o.courses[cid]=o.courses[cid]||{title:c.title,total:c.total,lessons:{},trophy:0};
  t.title=c.title||t.title;t.total=Math.max(t.total||0,c.total||0);t.trophy=Math.max(t.trophy||0,c.trophy||0);
  for(const li in c.lessons){const l=c.lessons[li],m=t.lessons[li]=t.lessons[li]||{t:l.t,d:0,a:{}};
   m.t=l.t||m.t;m.d=Math.max(m.d||0,l.d||0);
   for(const bid in (l.a||{})){const x=l.a[bid];if(!m.a[bid]||(x.ts||0)>=(m.a[bid].ts||0))m.a[bid]=x}}}
 o.ts=Math.max(a.ts||0,b.ts||0);return o;
}
function cur(){
 const u=user(),k=u?UK(u.id):GK;
 if(D&&k===key)return D;
 key=k;D=rd(k)||empty();
 if(u){const g=rd(GK);if(g){D=merge(D,g);wr(k,D);try{localStorage.removeItem(GK)}catch(e){}push()}}
 return D;
}
function push(){
 const u=user(),c=cloud();if(!u||!c||!tableOk)return;clearTimeout(saveT);
 saveT=setTimeout(async()=>{try{const r=await c.from('iasd_study_me').upsert({user_id:u.id,data:D,updated_at:new Date().toISOString()});if(r.error&&/does not exist|schema cache|relation/i.test(r.error.message||''))tableOk=false}catch(e){}},1200);
}
function save(){const d=cur();d.ts=Date.now();wr(key,d);push();try{window.dispatchEvent(new Event('iasd-study-me'))}catch(e){}}
let loadedFor='';
/* busca na nuvem uma vez por conta; devolve true só quando buscou de fato (evita repintar em laço) */
async function loadOnce(){const u=user();cur();if(!u||loadedFor===u.id)return false;loadedFor=u.id;await load();return true}
async function load(){
 const u=user(),c=cloud();const d=cur();if(!u||!c||!tableOk)return d;
 try{const r=await c.from('iasd_study_me').select('data').eq('user_id',u.id).maybeSingle();
  if(r.error){if(/does not exist|schema cache|relation/i.test(r.error.message||''))tableOk=false;return d}
  if(r.data&&r.data.data&&r.data.data.v){D=merge(D,r.data.data);wr(key,D)}}catch(e){}
 return D;
}
function course(cid,title,total){const d=cur(),k=cid||'sala';const c=d.courses[k]=d.courses[k]||{title:title||'Estudo',total:total||0,lessons:{},trophy:0};if(title)c.title=title;if(total)c.total=total;return c}
function lesson(c,li,title){const l=c.lessons[li]=c.lessons[li]||{t:title||'',d:0,a:{}};if(title)l.t=title;return l}
function rec(cid,ctitle,total,li,ltitle,bid,q,a){
 if(!String(a||'').trim())return;const c=course(cid,ctitle,total),l=lesson(c,li,ltitle);l.a[bid]={q:String(q||'').slice(0,300),a:String(a).slice(0,1500),ts:Date.now()};save();
}
function done(cid,ctitle,total,li,ltitle,on){
 const c=course(cid,ctitle,total),l=lesson(c,li,ltitle);l.d=on?Date.now():0;
 const n=Object.values(c.lessons).filter(x=>x.d).length;let trophy=false;
 if(on&&c.total&&n>=c.total&&!c.trophy){c.trophy=Date.now();trophy=true}
 save();return {trophy,n,total:c.total,title:c.title};
}
function stat(k,n){const d=cur();d.st[k]=(d.st[k]||0)+(n||1);save()}
function counts(){
 const d=cur();let ans=0,les=0,tro=0,courses=0;
 for(const k in d.courses){const c=d.courses[k];courses++;if(c.trophy)tro++;for(const li in c.lessons){const l=c.lessons[li];if(l.d)les++;ans+=Object.keys(l.a||{}).length}}
 return {ans,les,tro,courses,rooms:d.st.rooms||0,won:d.st.won||0};
}
const isGuest=()=>!user();
const has=()=>{const c=counts();return c.ans>0||c.les>0||c.rooms>0};
function modal(title,msg,fin,logged){
 const old=document.getElementById('sm-ask');if(old)old.remove();
 const el=document.createElement('div');el.id='sm-ask';el.className='sm-ask';
 el.innerHTML='<div class="sm-box"><div class="sm-ic">'+(fin?'🏆':'💾')+'</div><h3>'+title+'</h3><p>'+msg+'</p>'+(logged?'<button class="pg-gold" data-a="prof">Ver no meu perfil</button><button class="sm-no" data-a="no">Fechar</button>':'<button class="pg-gold" data-a="new">Criar minha conta</button><button class="pg-ghost" data-a="in">Já tenho conta · Entrar</button><button class="sm-no" data-a="no">Agora não</button>')+'</div>';
 el.addEventListener('click',e=>{const a=e.target&&e.target.dataset&&e.target.dataset.a;if(!a&&e.target!==el)return;el.remove();
  if(a==='prof'){try{go('Perfil')}catch(x){}}
  if(a==='new'||a==='in'){try{if(typeof openAuthModal==='function')openAuthModal(a==='new')}catch(x){}}});
 document.body.appendChild(el);
}
/* fim do estudo / da sala: logado salva direto; convidado recebe o convite */
function finish(trophy,title){
 if(!isGuest()){save();if(trophy)modal('Você concluiu o estudo!','Você ganhou o <b>Troféu de conclusão do estudo</b>'+(title?' — '+title:'')+'. Ele já está guardado no seu perfil, junto com suas respostas e seus selos.',true,true);return 'saved'}
 if(asked&&!trophy)return 'skip';asked=true;
 modal(trophy?'Você concluiu o estudo!':'Quer guardar o que você estudou?',
  (trophy?'Você ganhou o <b>Troféu de conclusão do estudo</b>'+(title?' — '+title:'')+'. ':'')+'Crie uma conta (ou entre) para guardar suas respostas, seus selos e o troféu no seu perfil. Nada será perdido: o que você já fez neste aparelho é levado junto.',trophy);
 return 'asked';
}
/* selos de estudo: [título, descrição, emoji, cor1, cor2, predicado] */
const SEALS=[
 ['Primeira resposta','Enviou sua primeira resposta de estudo','✍️','#c2762b','#7a3f12',c=>c.ans>=1],
 ['10 respostas','Respondeu 10 perguntas de estudo','📝','#2f7bff','#13328c',c=>c.ans>=10],
 ['50 respostas','Respondeu 50 perguntas de estudo','📚','#7c3aed','#3b1478',c=>c.ans>=50],
 ['Lição concluída','Concluiu uma lição','✅','#16a34a','#0b4a24',c=>c.les>=1],
 ['5 lições','Concluiu 5 lições','🌿','#0d9488','#134e4a',c=>c.les>=5],
 ['10 lições','Concluiu 10 lições','🌳','#0ea5e9','#0c3b5e',c=>c.les>=10],
 ['Na sala de estudo','Participou de uma sala de estudo ao vivo','🕊️','#f5b73a','#8a5a07',c=>c.rooms>=1],
 ['Desafiante','Acertou um desafio da sala','🎯','#ef4444','#7a1414',c=>c.won>=1],
 ['Mestre dos desafios','Acertou 10 desafios da sala','🏅','#8b5cf6','#3b1c7a',c=>c.won>=10],
 ['Troféu de conclusão do estudo','Concluiu todas as lições de um estudo','🏆','#f5b73a','#8a5a07',c=>c.tro>=1]
];
function view(){ // para a seção "Meu estudo" no perfil
 const d=cur();return Object.keys(d.courses).map(k=>({id:k,...d.courses[k]})).filter(c=>Object.keys(c.lessons).length||c.trophy);
}
window.IASDStudyMe={load,loadOnce,rec,done,stat,counts,finish,isGuest,has,SEALS,view,get:cur};
try{window.addEventListener('iasd-auth',()=>{D=null;key='';loadedFor='';loadOnce().then(()=>{try{window.dispatchEvent(new Event('iasd-study-me'))}catch(e){}})})}catch(e){}
})();
