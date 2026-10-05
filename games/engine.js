/* Motor de perguntas dos jogos do IASD APP.
   Junta os bancos (games/bank-*.js) com geradores que criam milhares de combinações:
   ordem dos livros, capítulos, versículos com lacuna, quem disse, linha do tempo, memória... */
(function(){
'use strict';
const B=window.IASDBank=window.IASDBank||{};
const BOOKS=['Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute','1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras','Neemias','Ester','Jó','Salmos','Provérbios','Eclesiastes','Cantares','Isaías','Jeremias','Lamentações','Ezequiel','Daniel','Oseias','Joel','Amós','Obadias','Jonas','Miqueias','Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias','Mateus','Marcos','Lucas','João','Atos','Romanos','1 Coríntios','2 Coríntios','Gálatas','Efésios','Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses','1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus','Tiago','1 Pedro','2 Pedro','1 João','2 João','3 João','Judas','Apocalipse'];
const CH=[50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
const ORD=['primeiro','segundo','terceiro','quarto','quinto','sexto','sétimo','oitavo','nono','décimo'];

/* ---------- aleatório com semente (mesmo resultado para todos no "desafio do dia") ---------- */
function hash(s){let h=2166136261>>>0;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=(seed==null?Math.random()*4294967296:hash(seed))>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const pick=(a,r)=>a[Math.floor(r()*a.length)];
function sample(a,n,r){return shuffle(a,r).slice(0,n)}
function fold(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()}

/* monta uma pergunta de múltipla escolha com 4 opções embaralhadas */
function mc(o,r){
 const wrong=[...new Set((o.wrong||[]).filter(x=>x!=null&&String(x)!==String(o.a)))];
 const opts=shuffle([o.a].concat(wrong.slice(0,3)),r);
 return {type:'mc',kind:o.kind||'quiz',cat:o.cat||'',q:o.q,opts,ans:opts.indexOf(o.a),a:o.a,ref:o.ref||'',d:o.d||2,hint:o.hint||''};
}

/* ---------- geradores derivados ---------- */
const GEN={
 bookNext(r){const i=Math.floor(r()*(BOOKS.length-1));const w=sample(BOOKS.filter((b,j)=>j!==i+1&&Math.abs(j-(i+1))>1),3,r);
  return mc({kind:'livros',cat:'Livros e Números',q:'Qual livro da Bíblia vem logo depois de '+BOOKS[i]+'?',a:BOOKS[i+1],wrong:w,d:i<5||i>60?2:3},r)},
 bookPrev(r){const i=1+Math.floor(r()*(BOOKS.length-1));const w=sample(BOOKS.filter((b,j)=>j!==i-1&&Math.abs(j-(i-1))>1),3,r);
  return mc({kind:'livros',cat:'Livros e Números',q:'Qual livro da Bíblia vem logo antes de '+BOOKS[i]+'?',a:BOOKS[i-1],wrong:w,d:3},r)},
 bookOrdinalAT(r){const i=Math.floor(r()*10);return mc({kind:'livros',cat:'Livros e Números',q:'Qual é o '+ORD[i]+' livro do Antigo Testamento?',a:BOOKS[i],wrong:sample(BOOKS.slice(0,39).filter((b,j)=>j!==i&&Math.abs(j-i)<14),3,r),d:i<3?1:2},r)},
 bookOrdinalNT(r){const i=Math.floor(r()*10);return mc({kind:'livros',cat:'Livros e Números',q:'Qual é o '+ORD[i]+' livro do Novo Testamento?',a:BOOKS[39+i],wrong:sample(BOOKS.slice(39).filter((b,j)=>j!==i&&Math.abs(j-i)<14),3,r),d:i<4?1:2},r)},
 bookTestament(r){const i=Math.floor(r()*BOOKS.length),nt=i>=39;return mc({kind:'livros',cat:'Livros e Números',q:'O livro de '+BOOKS[i]+' está em qual parte da Bíblia?',a:nt?'Novo Testamento':'Antigo Testamento',wrong:[nt?'Antigo Testamento':'Novo Testamento','Nenhuma das duas','Os dois'],d:1},r)},
 bookIntruder(r){const nt=r()<.5,pool=nt?BOOKS.slice(39):BOOKS.slice(0,39),other=nt?BOOKS.slice(0,39):BOOKS.slice(39);
  const a=pick(other,r);return mc({kind:'livros',cat:'Livros e Números',q:'Qual destes livros NÃO pertence ao '+(nt?'Novo':'Antigo')+' Testamento?',a,wrong:sample(pool,3,r),d:2},r)},
 bookChapters(r){const big=[0,1,18,22,27,39,42,43,44,65,19,19,18,42,51];const i=pick(big,r),n=CH[i];
  const w=new Set();while(w.size<3){const c=Math.max(1,n+Math.round((r()-.5)*Math.max(6,n*.6)));if(c!==n)w.add(c)}
  return mc({kind:'livros',cat:'Livros e Números',q:'Quantos capítulos tem o livro de '+BOOKS[i]+'?',a:String(n),wrong:[...w].map(String),d:3},r)},
 bookByChapters(r){const uniq=[[18,'Salmos'],[22,'Isaías'],[0,'Gênesis'],[1,'Êxodo'],[65,'Apocalipse'],[42,'Lucas']];const x=pick(uniq,r);
  const n=CH[x[0]];return mc({kind:'livros',cat:'Livros e Números',q:'Qual destes livros tem '+n+' capítulos?',a:x[1],wrong:sample(BOOKS.filter(b=>b!==x[1]&&CH[BOOKS.indexOf(b)]!==n),3,r),d:3},r)},
 verse(r){const v=B.verses;if(!v||!v.length)return null;const x=pick(v,r);
  return mc({kind:'versiculo',cat:'Versículos',q:'Complete ('+x[0]+'): “'+x[1].replace('___','_____')+'”',a:x[2],wrong:x[3],ref:x[0],d:2,hint:'Versículo'},r)},
 verseRef(r){const v=B.verses;if(!v||v.length<8)return null;const x=pick(v,r);const w=sample(v.filter(y=>y[0]!==x[0]),3,r).map(y=>y[0]);
  return mc({kind:'versiculo',cat:'Versículos',q:'Onde está escrito: “'+x[1].replace('___',x[2])+'”?',a:x[0],wrong:w,ref:x[0],d:3},r)},
 said(r){const s=B.said;if(!s||!s.length)return null;const x=pick(s,r);
  return mc({kind:'quemdisse',cat:'Quem disse?',q:'Quem disse: “'+x[0]+'”',a:x[1],wrong:x[2],ref:x[3],d:x[4]||2},r)},
 before(r){const t=B.timeline;if(!t||!t.length)return null;const set=pick(t,r),L=set.items.length;if(L<5)return null;
  const m=1+Math.floor(r()*(L-2)),later=L-m-1,earlier=m;let ask,a,wr;
  if(later>=3&&earlier>=1&&(r()<.5||earlier<3)){ask='ANTES';a=pick(set.items.slice(0,m),r);wr=sample(set.items.slice(m+1),3,r)}
  else if(earlier>=3&&later>=1){ask='DEPOIS';a=pick(set.items.slice(m+1),r);wr=sample(set.items.slice(0,m),3,r)}
  else return null;
  return mc({kind:'tempo',cat:'Linha do Tempo',q:'Qual destes aconteceu '+ask+' de “'+set.items[m]+'”? ('+set.t+')',a,wrong:wr,ref:set.ref,d:set.d||2},r)},
 last(r){const t=B.timeline;if(!t||!t.length)return null;const set=pick(t,r);if(set.items.length<5)return null;
  const idx=sample([...set.items.keys()],4,r).sort((a,b)=>a-b);const last=r()<.5;
  return mc({kind:'tempo',cat:'Linha do Tempo',q:'Entre estes acontecimentos, qual foi '+(last?'o ÚLTIMO':'o PRIMEIRO')+'? ('+set.t+')',a:set.items[last?idx[3]:idx[0]],wrong:(last?idx.slice(0,3):idx.slice(1)).map(k=>set.items[k]),ref:set.ref,d:set.d||2},r)},
 who(r){const w=B.who;if(!w||!w.length)return null;const x=pick(w,r);return mc({kind:'quemsou',cat:'Quem sou eu?',q:'Quem sou eu? '+x[2][0]+' '+x[2][1],a:x[0],wrong:x[5],ref:x[3],d:x[6]||2},r)}
};
const GEN_W={bookNext:2,bookPrev:1,bookOrdinalAT:1,bookOrdinalNT:1,bookIntruder:1,bookChapters:1,bookByChapters:1,verse:5,verseRef:2,said:4,before:4,last:3,who:3};

function curated(r,opts){
 let pool=B.quiz||[];
 if(opts&&opts.cats&&opts.cats.length)pool=pool.filter(x=>opts.cats.includes(x[0]));
 if(opts&&opts.diff)pool=pool.filter(x=>x[5]===opts.diff);
 return pool;
}

/* ---------- Quiz ---------- */
/* opts: {n,seed,cats,diff,mix (0..1 = fatia de perguntas geradas, padrão .35)} */
function quiz(opts){
 opts=opts||{};const r=rng(opts.seed),n=opts.n||10,pool=curated(r,opts);
 const mix=opts.cats&&opts.cats.length?0:(opts.mix==null?.35:opts.mix);
 const out=[],seen=new Set();let guard=0;
 const order=shuffle(pool,r);let oi=0;
 const gkeys=Object.keys(GEN_W).flatMap(k=>Array(GEN_W[k]).fill(k));
 while(out.length<n&&guard++<n*40){
  let q=null;
  if(r()<mix||oi>=order.length){const g=pick(gkeys,r);q=GEN[g](r)}
  else{const x=order[oi++];q=mc({kind:'quiz',cat:x[0],q:x[1],a:x[2],wrong:x[3],ref:x[4],d:x[5]},r)}
  if(!q||q.ans<0||q.opts.length<4)continue;
  const key=fold(q.q)+'|'+fold(q.a);if(seen.has(key))continue;seen.add(key);out.push(q)}
 return out;
}

/* ---------- Verdadeiro ou Falso (derivado do banco) ---------- */
function tf(opts){
 opts=opts||{};const r=rng(opts.seed),n=opts.n||10,out=[],seen=new Set();let g=0;
 const pool=shuffle(B.quiz||[],r);let i=0;
 while(out.length<n&&g++<n*20&&i<pool.length){
  const x=pool[i++],truth=r()<.5,ans=truth?x[2]:pick(x[3],r);
  const q=x[1].replace(/\?$/,'');const key=fold(x[1]);if(seen.has(key))continue;seen.add(key);
  out.push({type:'tf',kind:'vf',cat:x[0],q:x[1],claim:ans,truth,a:truth?'Verdadeiro':'Falso',opts:['Verdadeiro','Falso'],ans:truth?0:1,ref:x[4],d:x[5],fix:truth?'':x[2]});
 }
 return out;
}


/* ---------- seleção equilibrada para partidas do Jogo Coletivo ----------
   Tudo é função apenas do código da sala (seed) e dos bancos, então host e celulares montam a mesma partida. */
const BAD_OPT=/^(nenhuma|nenhum|os dois|as duas|todas|todos|ambos)/i;
const longestAns=x=>{const a=String(x[2]).length;return x[3].every(o=>String(o).length<a)};
const isJesus=x=>/\bJesus\b/.test(x[1]+' '+x[2]);
/* n perguntas do banco de quiz: categorias em rodízio (cada uma com o mesmo peso), sem repetir referência bíblica,
   dificuldade ~30/45/25, poucas respostas "mais longas" e poucas sobre Jesus; relaxa as regras só se faltar pergunta */
function planQuiz(n,seed,used){
 const r=rng(seed),Q=B.quiz||[];used=used||new Set();const out=[];if(n<=0||!Q.length)return out;
 const byCat={};shuffle(Q.map((x,i)=>i),r).forEach(i=>{if(used.has(i))return;const c=Q[i][0];(byCat[c]=byCat[c]||[]).push(i)});
 const cats=Object.keys(byCat);if(!cats.length)return out;
 const tg={1:Math.round(n*.3),2:Math.round(n*.45)};tg[3]=Math.max(0,n-tg[1]-tg[2]);
 const capL=Math.round(n*.28)+1,capJ=Math.round(n*.2)+1,refs=new Set(),dc={1:0,2:0,3:0};let lc=0,jc=0,lvl=0,miss=0,queue=[],guard=0;
 const ok=(x,l)=>{const d=x[5]||2;
  if(l<3&&refs.has(x[4]))return false;
  if(l<2&&dc[d]>=tg[d]+(l?1:0))return false;
  if(l<2&&longestAns(x)&&lc>=capL)return false;
  if(l<2&&isJesus(x)&&jc>=capJ)return false;return true};
 while(out.length<n&&guard++<n*200){
  if(!queue.length)queue=shuffle(cats,r);
  const c=queue.shift(),list=byCat[c];let hit=-1;
  for(let j=0;j<list.length;j++){if(ok(Q[list[j]],lvl)){hit=j;break}}
  if(hit<0){if(++miss>=cats.length*2){lvl++;miss=0;if(lvl>4)break}continue}
  miss=0;const i=list.splice(hit,1)[0],x=Q[i];out.push(i);used.add(i);refs.add(x[4]);dc[x[5]||2]++;if(longestAns(x))lc++;if(isJesus(x))jc++}
 return out;
}
/* sequência de verdadeiro/falso: 40–60% de verdadeiras (varia por partida), sem mais de 3 iguais seguidas e sem alternância certinha */
function truthPlan(n,r){
 if(n<=0)return[];
 const mk=()=>{const lo=Math.floor(n*.4),hi=Math.ceil(n*.6),k=lo+Math.floor(r()*(hi-lo+1));return shuffle(Array.from({length:n},(_,i)=>i<k),r)};
 let a=mk();if(n<4)return a;
 for(let t=0;t<60;t++){
  let run=1,mr=1,ch=0;for(let i=1;i<n;i++){if(a[i]===a[i-1]){run++;mr=Math.max(mr,run)}else{run=1;ch++}}
  if(mr<=3&&ch<=Math.ceil((n-1)*.72))return a;a=mk()}
 return a;
}
/* itens de V/F: {src:'vf',i,truth} (afirmação própria) ou {src:'q',i,truth,w} (derivada de uma pergunta do quiz) */
function planVF(n,seed,used){
 const r=rng(seed),VF=B.vf||[],Q=B.quiz||[];used=used||new Set();const out=[];if(n<=0)return out;
 const tp=truthPlan(n,r);
 const mkList=t=>{const byCat={};shuffle(VF.map((x,i)=>i),r).forEach(i=>{if(!!VF[i][2]!==t)return;(byCat[VF[i][0]]=byCat[VF[i][0]]||[]).push(i)});return byCat};
 const L={true:mkList(true),false:mkList(false)},cq={true:[],false:[]};
 const spare=planQuiz(n*2+6,seed+'|vq',used);let qi=0;
 const takeDed=t=>{const byCat=L[t],cs=shuffle(Object.keys(byCat).filter(c=>byCat[c].length),r);return cs.length?byCat[cs[0]].shift():-1};
 const usedStm=new Set();
 tp.forEach(t=>{
  let it=null;
  if(r()<.55){const i=takeDed(t);if(i>=0&&!usedStm.has(fold(VF[i][1]))){usedStm.add(fold(VF[i][1]));it={src:'vf',i,truth:t}}}
  while(!it&&qi<spare.length){const i=spare[qi++],x=Q[i];
   if(t){it={src:'q',i,truth:true};break}
   const w=x[3].map((o,k)=>k).filter(k=>!BAD_OPT.test(String(x[3][k])));if(!w.length)continue;
   it={src:'q',i,truth:false,w:w[Math.floor(r()*w.length)]};}
  if(!it){const i=takeDed(t);if(i>=0)it={src:'vf',i,truth:t}}
  if(it)out.push(it)});
 return out;
}
function quizRow(i,seed){const x=B.quiz[i];return mc({kind:'quiz',cat:x[0],q:x[1],a:x[2],wrong:x[3],ref:x[4],d:x[5]},rng(seed))}
function vfItem(it){
 if(it.src==='vf'){const x=B.vf[it.i];return {type:'tf',kind:'vf',cat:x[0],q:'“'+x[1]+'”',claim:'',truth:!!x[2],a:x[2]?'Verdadeiro':'Falso',opts:['Verdadeiro','Falso'],ans:x[2]?0:1,ref:(x[2]||!x[5]?'':x[5]+' · ')+x[3],d:x[4]||2,hint:'Verdadeiro ou falso?'}}
 const x=B.quiz[it.i],t=it.truth,claim=t?x[2]:x[3][it.w];
 return {type:'tf',kind:'vf',cat:x[0],q:x[1],claim,truth:t,a:t?'Verdadeiro':'Falso',opts:['Verdadeiro','Falso'],ans:t?0:1,ref:(t?'':'Certo: '+x[2]+' · ')+x[4],d:x[5]||2,fix:t?'':x[2]};
}
/* reposiciona a resposta certa das perguntas de 4 alternativas para que A–D fiquem equilibradas na partida, sem padrão (nunca 3 seguidas iguais) */
function balanceAnswers(list,seed){
 const r=rng(seed),idx=[];list.forEach((q,k)=>{if(q&&q.opts&&q.opts.length===4&&q.ans>=0)idx.push(k)});
 const n=idx.length;if(n<2)return list;
 const bag=()=>{const a=[];for(let i=0;i<n;i++)a.push(i%4);return shuffle(a,r)};
 let pos=bag();
 for(let t=0;t<80;t++){let ok=true,steps=0;for(let i=2;i<n;i++){if(pos[i]===pos[i-1]&&pos[i]===pos[i-2]){ok=false;break}}
  for(let i=1;i<n;i++){if((pos[i]-pos[i-1]+4)%4===1)steps++}
  if(ok&&steps<=Math.ceil((n-1)*.5))break;pos=bag()}
 idx.forEach((k,j)=>{const q=list[k],o=q.opts.slice(),c=q.ans,to=pos[j];if(c===to)return;[o[c],o[to]]=[o[to],o[c]];q.opts=o;q.ans=to});
 return list;
}

/* ---------- Quem sou eu ---------- */
function who(opts){
 opts=opts||{};const r=rng(opts.seed),n=opts.n||8;let pool=B.who||[];
 if(opts.cats&&opts.cats.length)pool=pool.filter(x=>opts.cats.includes(x[4]));
 return sample(pool,n,r).map(x=>({type:'who',kind:'quemsou',cat:x[4],a:x[0],aliases:(x[1]||[]).concat([x[0]]).map(fold),clues:x[2],ref:x[3],wrong:x[5],d:x[6]||2,
  opts:shuffle([x[0]].concat(x[5].slice(0,3)),r)}));
}

/* ---------- Linha do tempo (ordenar) ---------- */
function timeline(opts){
 opts=opts||{};const r=rng(opts.seed),n=opts.n||5,size=opts.size||5;let pool=B.timeline||[];
 if(opts.diff)pool=pool.filter(x=>x.d===opts.diff);
 return sample(pool,n,r).map(set=>{
  let idx=[...set.items.keys()];if(idx.length>size)idx=sample(idx,size,r).sort((a,b)=>a-b);
  const items=idx.map(k=>set.items[k]);let sh=shuffle(items,r);let t=0;while(sh.every((x,i)=>x===items[i])&&t++<5)sh=shuffle(items,r);
  return {type:'order',kind:'tempo',cat:'Linha do Tempo',title:set.t,items,shuffled:sh,ref:set.ref,d:set.d||2};
 });
}

/* ---------- Memória ---------- */
function memory(opts){
 opts=opts||{};const r=rng(opts.seed),pairs=opts.pairs||8;const decks=B.memory||[];
 const deck=opts.deck?decks.find(d=>d.t===opts.deck):pick(decks,r);
 if(!deck)return {deck:'',cards:[]};
 const chosen=sample(deck.pairs,Math.min(pairs,deck.pairs.length),r);
 const cards=shuffle(chosen.flatMap((p,i)=>[{v:p[0],pair:i,side:0},{v:p[1],pair:i,side:1}]),r);
 return {deck:deck.t,emoji:deck.emoji||'✦',cards,pairs:chosen.length};
}

/* ---------- Desafio do dia (mesmo para todos) ---------- */
function today(){try{return new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})}catch(e){return new Date().toISOString().slice(0,10)}}
function weekStart(day){const d=new Date((day||today())+'T12:00:00Z');const wd=d.getUTCDay(); /* semana vai de segunda a domingo */const back=(wd+6)%7;d.setUTCDate(d.getUTCDate()-back);return d.toISOString().slice(0,10)}
const DAILY_N={quiz:10,who:6,order:5,memory:8};
function daily(game,day){day=day||today();const seed='iasd|'+day+'|'+game;
 if(game==='quiz')return quiz({n:DAILY_N.quiz,seed});
 if(game==='who')return who({n:DAILY_N.who,seed});
 if(game==='order')return timeline({n:DAILY_N.order,seed});
 if(game==='memory')return memory({pairs:DAILY_N.memory,seed});
 return null}

function stats(){const g=Object.keys(GEN_W).length;return {vf:(B.vf||[]).length,quiz:(B.quiz||[]).length,who:(B.who||[]).length,said:(B.said||[]).length,timeline:(B.timeline||[]).length,memory:(B.memory||[]).length,verses:(B.verses||[]).length,generators:g,
 total:(B.quiz||[]).length+(B.who||[]).length+(B.said||[]).length+(B.verses||[]).length*2+(B.timeline||[]).length*10+BOOKS.length*5}}

window.IASDGameEngine={BOOKS,CH,rng,shuffle,sample,pick,fold,hash,quiz,tf,who,timeline,memory,daily,today,weekStart,DAILY_N,stats,GEN,mc,planQuiz,planVF,quizRow,vfItem,truthPlan,balanceAnswers,
 cats:()=>[...new Set((B.quiz||[]).map(x=>x[0]))],
 whoCats:()=>[...new Set((B.who||[]).map(x=>x[4]))],
 decks:()=>(B.memory||[]).map(d=>({t:d.t,emoji:d.emoji,n:d.pairs.length}))};
})();
