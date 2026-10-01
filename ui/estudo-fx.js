/* Sala de Estudo — efeitos e atividades ao vivo: sons, desafio por questão, palco de respostas, intervalo.
   Usa a API interna exposta por estudo.js em window.IASDEstudoCore. Tudo é sincronizado pelo canal da sala. */
(function(){
'use strict';
const K=()=>window.IASDEstudoCore;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rid=()=>Math.random().toString(36).slice(2,8);
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const F={ch:null,hostCh:null,stage:null,brk:null,score:{},board:[]};

/* ---------- sons (WebAudio, sem arquivos) ---------- */
let ctx=null,muted=false;try{muted=localStorage.getItem('iasd-study-sfx')==='0'}catch(e){}
function ac(){if(!ctx){try{ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{ac()},{passive:true}));
function tone(f,d,type,v,at,f2){const a=ac();if(!a||muted||document.body.classList.contains('es-susp'))return;const t=a.currentTime+(at||0),o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.05)}
function noise(d,hp,v,at){const a=ac();if(!a||muted||document.body.classList.contains('es-susp'))return;const n=Math.max(1,Math.floor(a.sampleRate*d)),buf=a.createBuffer(1,n,a.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource();s.buffer=buf;const f=a.createBiquadFilter();f.type='highpass';f.frequency.value=hp||800;const g=a.createGain();g.gain.value=v||.15;s.connect(f);f.connect(g);g.connect(a.destination);s.start(a.currentTime+(at||0))}
const SFX={
 tick(){tone(1400,.035,'square',.07)},tock(){tone(900,.05,'square',.06)},
 beat(){tone(70,.14,'sine',.5);tone(58,.16,'sine',.4,.17)},
 riser(){tone(150,1.5,'sawtooth',.05,0,900)},
 buzz(){tone(140,.75,'sawtooth',.22);tone(105,.75,'square',.12)},
 ding(){tone(880,.35,'sine',.2);tone(1320,.5,'sine',.14,.08)},
 win(){[523,659,784,1046].forEach((f,i)=>tone(f,.3,'triangle',.18,i*.1))},
 lose(){tone(260,.55,'sawtooth',.12,0,110)},
 pop(){tone(520,.12,'sine',.18,0,980)},
 whoosh(){noise(.55,700,.12)},
 drum(){for(let i=0;i<20;i++)noise(.07,180,.1*(.5+i/26),i*.075)},
 crash(){noise(1.3,2800,.2)},
 chime(){tone(660,.6,'sine',.12);tone(990,.8,'sine',.08,.15)}
};
function setMuted(m){muted=!!m;try{localStorage.setItem('iasd-study-sfx',muted?'0':'1')}catch(e){}document.querySelectorAll('.fx-snd').forEach(b=>{b.textContent=muted?'🔇':'🔊'})}
const sndBtn=()=>'<button type="button" class="fx-snd" onclick="IASDEstudoFX.toggleSound()" aria-label="Som">'+(muted?'🔇':'🔊')+'</button>';

/* ---------- banco de perguntas (linguagem simples, texto curto) ---------- */
/* [pergunta, certa, errada1, errada2, errada3, palavras-chave para combinar com a lição] */
const QZ_RAW=[
['Em quantos dias Deus criou o mundo antes de descansar?','Seis','Três','Sete','Dez','criacao genesis sabado descans'],
['O que Deus criou no primeiro dia?','A luz','As plantas','Os animais','O sol','criacao genesis luz'],
['Como se chamava o jardim onde Adão e Eva viveram?','Éden','Getsêmani','Betânia','Canaã','adao eva eden genesis pecado'],
['Quem construiu a arca?','Noé','Moisés','Abraão','Jonas','noe arca diluvio'],
['Que sinal Deus deu a Noé depois do dilúvio?','O arco-íris','Uma estrela','Uma nuvem de fogo','Um trovão','noe diluvio alianca promessa'],
['Quem era o pai de Isaque?','Abraão','Jacó','Noé','Davi','abraao isaque fe'],
['Quantos filhos teve Jacó?','Doze','Sete','Dez','Quatorze','jaco israel tribos'],
['Quem foi vendido pelos irmãos e depois governou o Egito?','José','Benjamim','Rúben','Moisés','jose egito perdao'],
['Quem liderou o povo de Israel para fora do Egito?','Moisés','Josué','Davi','Elias','moises egito exodo libertacao'],
['Quantos mandamentos Deus deu no monte Sinai?','Dez','Sete','Doze','Cinco','mandamento lei sinai moises obedi'],
['Que alimento Deus enviava do céu no deserto?','Maná','Figos','Arroz','Azeitonas','mana deserto exodo provisao'],
['Qual dia da semana é o sábado?','O sétimo','O primeiro','O sexto','O quarto','sabado descans mandamento'],
['Quem derrotou o gigante Golias?','Davi','Sansão','Saul','Jônatas','davi golias coragem'],
['Que cidade teve os muros derrubados depois que o povo marchou ao redor?','Jericó','Belém','Nazaré','Babilônia','jerico josue fe'],
['Quem era conhecido pela grande força?','Sansão','Gideão','Samuel','Elias','sansao forca'],
['Qual rei pediu sabedoria a Deus?','Salomão','Saul','Acabe','Herodes','salomao sabedoria proverbios'],
['Quem construiu o templo em Jerusalém?','Salomão','Davi','Esdras','Neemias','templo salomao'],
['Onde Daniel foi lançado por não deixar de orar?','Na cova dos leões','Na fornalha','Num poço seco','Na prisão do Egito','daniel oracao leoes fidelidade'],
['Quem foi engolido por um grande peixe?','Jonas','Elias','Eliseu','Jeremias','jonas obediencia ninive'],
['Quem foi levado ao céu num redemoinho?','Elias','Isaías','Eliseu','Amós','elias profeta ceu'],
['Em que cidade Jesus nasceu?','Belém','Nazaré','Jerusalém','Cafarnaum','jesus nascimento natal belem'],
['Quem batizou Jesus?','João Batista','Pedro','Paulo','Tiago','batismo jesus joao'],
['Quantos discípulos Jesus escolheu para andar com ele?','Doze','Sete','Dez','Setenta','discipulo apostolo jesus'],
['Qual foi o primeiro milagre de Jesus no Evangelho de João?','Água em vinho','Curar um cego','Multiplicar os pães','Andar sobre as águas','milagre jesus joao cana'],
['Jesus ressuscitou em qual dia, segundo as Escrituras?','Ao terceiro dia','Ao sétimo dia','Ao décimo dia','Ao quadragésimo dia','ressurrei cruz pascoa jesus morte'],
['Qual discípulo negou Jesus três vezes?','Pedro','João','Tomé','André','pedro negacao perdao'],
['Qual discípulo só acreditou depois de ver as marcas nas mãos de Jesus?','Tomé','Filipe','Mateus','Judas','tome duvida fe ressurrei'],
['Quem traiu Jesus por trinta moedas de prata?','Judas','Pedro','Tomé','Barnabé','judas traicao'],
['Qual oração Jesus ensinou aos discípulos?','Pai Nosso','Salmo 23','Cântico de Maria','Credo','oracao pai nosso orar'],
['Qual é o maior mandamento, segundo Jesus?','Amar a Deus de todo o coração','Dar o dízimo','Jejuar toda semana','Ir ao templo todo dia','mandamento amor deus'],
['Em qual livro está a história do bom samaritano?','Lucas','Mateus','João','Atos','samaritano proximo amor lucas'],
['Quem foi o apóstolo que escreveu várias cartas aos gentios?','Paulo','Pedro','João','Tiago','paulo carta apostolo'],
['Qual é o último livro da Bíblia?','Apocalipse','Judas','Atos','Hebreus','biblia livro apocalipse volta fim'],
['Qual é o primeiro livro da Bíblia?','Gênesis','Êxodo','Salmos','Mateus','biblia livro genesis comeco'],
['Quantos livros tem a Bíblia?','66','39','73','27','biblia livros escrituras'],
['Quantos livros tem o Novo Testamento?','27','39','24','66','biblia novo testamento'],
['Quantos livros tem o Antigo Testamento?','39','27','46','66','biblia antigo testamento'],
['Qual livro da Bíblia tem mais capítulos?','Salmos','Isaías','Gênesis','Jó','biblia salmos'],
['Qual é o menor capítulo da Bíblia?','Salmo 117','Salmo 23','Salmo 1','João 3','biblia salmos'],
['Em qual livro está “O Senhor é o meu pastor”?','Salmos','Provérbios','Isaías','Eclesiastes','pastor salmo cuidado'],
['Qual é o primeiro fruto do Espírito citado em Gálatas 5?','Amor','Alegria','Paz','Fé','espirito santo fruto amor'],
['Segundo Efésios 2:8, somos salvos pela…','Graça','Sorte','Lei','Tradição','salvacao graca fe efesios'],
['Segundo João 3:16, o que Deus deu ao mundo?','Seu Filho único','Um profeta','Um anjo','Um rei','salvacao amor jesus joao'],
['Quem escreveu a maior parte dos Salmos?','Davi','Moisés','Salomão','Asafe','salmos davi'],
['Quem escreveu o Apocalipse?','João','Paulo','Pedro','Lucas','apocalipse joao'],
['Josué 1:9 diz: “Seja forte e…”','Corajoso','Rápido','Rico','Sábio','coragem josue forca medo'],
['Qual era o nome da mãe de Jesus?','Maria','Isabel','Marta','Ana','jesus maria nascimento'],
['Qual ave levou um ramo de oliveira a Noé?','Pomba','Corvo','Águia','Andorinha','noe arca diluvio'],
['Em que tipo de árvore Zaqueu subiu para ver Jesus?','Sicômoro','Palmeira','Oliveira','Cedro','zaqueu jesus arrependimento'],
['Qual apóstolo era cobrador de impostos?','Mateus','Pedro','João','Tiago','mateus apostolo'],
['Qual profeta enfrentou os profetas de Baal no monte Carmelo?','Elias','Eliseu','Isaías','Jeremias','elias fogo profeta'],
['Qual rainha salvou o seu povo na Pérsia?','Ester','Rute','Débora','Sara','ester coragem povo'],
['Quantos dias e noites choveu no dilúvio?','Quarenta','Sete','Cem','Trinta','diluvio noe'],
['Quantos anos Israel andou no deserto?','Quarenta','Dez','Setenta','Doze','deserto exodo israel'],
['Quem foi o primeiro homem criado por Deus?','Adão','Abel','Noé','Enoque','adao criacao genesis'],
['Quem foi o primeiro mártir cristão?','Estêvão','Tiago','Paulo','Pedro','martir atos igreja'],
['Em qual ilha João recebeu o Apocalipse?','Patmos','Creta','Chipre','Malta','apocalipse joao'],
['“Eu sou o ___, a verdade e a vida.”','Caminho','Pão','Pastor','Cordeiro','jesus verdade caminho joao'],
['A Palavra de Deus é lâmpada para os meus…','Pés','Olhos','Dias','Braços','palavra biblia lampada salmo luz guia'],
['Quem foi o rei que Deus ungiu depois de Saul?','Davi','Salomão','Roboão','Josafá','davi rei saul'],
['Em qual rio Jesus foi batizado?','Jordão','Nilo','Eufrates','Tigre','batismo jordao jesus']
];
const VF_RAW=[
['A Bíblia tem 66 livros.',1,'biblia livros'],
['O Novo Testamento vem antes do Antigo na Bíblia.',0,'biblia testamento'],
['Noé construiu a arca por ordem de Deus.',1,'noe arca'],
['Moisés recebeu os Dez Mandamentos no monte Sinai.',1,'moises mandamento'],
['Jesus nasceu em Belém.',1,'jesus nascimento'],
['Jesus escolheu doze discípulos.',1,'jesus discipulo'],
['Paulo foi um dos doze discípulos originais.',0,'paulo discipulo'],
['Daniel foi lançado na cova dos leões.',1,'daniel leoes'],
['Jonas foi engolido por um grande peixe.',1,'jonas'],
['Deus descansou no sétimo dia da criação.',1,'criacao sabado'],
['O livro de Salmos fica no Novo Testamento.',0,'salmos biblia'],
['O Apocalipse é o último livro da Bíblia.',1,'apocalipse biblia'],
['Jesus ressuscitou ao terceiro dia.',1,'ressurrei jesus'],
['Pedro negou Jesus três vezes.',1,'pedro negacao'],
['Deus criou o sol e a lua no primeiro dia.',0,'criacao genesis'],
['Mateus, Marcos, Lucas e João são os quatro Evangelhos.',1,'evangelho jesus'],
['A Bíblia foi escrita por cerca de 40 autores ao longo de 1.600 anos.',1,'biblia autores escrituras'],
['Paulo escreveu o Evangelho de Lucas.',0,'paulo lucas'],
['Jesus ensinou a amar até os inimigos.',1,'amor jesus'],
['Segundo a Bíblia, somos salvos pelas nossas boas obras.',0,'salvacao graca obras'],
['O sábado é o sétimo dia da semana.',1,'sabado mandamento'],
['O dilúvio teve quarenta dias e quarenta noites de chuva.',1,'diluvio noe'],
['Elias foi levado ao céu sem passar pela morte.',1,'elias'],
['Zaqueu era pescador.',0,'zaqueu'],
['Davi enfrentou Golias com uma funda e uma pedra.',1,'davi golias'],
['A Bíblia diz que toda a Escritura é inspirada por Deus.',1,'biblia escrituras inspir']
];
const WHO_RAW=[
['Davi',['Fui pastor de ovelhas.','Escrevi muitos salmos.','Fui rei de Israel.','Derrotei o gigante Golias.'],['Saul','Salomão','Samuel'],'davi rei salmos'],
['Noé',['Vivi numa época de muita maldade.','Deus me pediu para construir um barco enorme.','Levei animais de todas as espécies comigo.','Vi um arco-íris depois do dilúvio.'],['Abraão','Moisés','Jó'],'noe arca diluvio'],
['Moisés',['Nasci escravo, mas fui criado num palácio.','Deus falou comigo numa sarça que queimava sem se consumir.','Recebi os Dez Mandamentos.','Conduzi o povo para fora do Egito.'],['Josué','Arão','José'],'moises egito exodo mandamento'],
['Daniel',['Fui levado para a Babilônia ainda jovem.','Interpretava sonhos de reis.','Não deixei de orar, mesmo sendo proibido.','Passei uma noite entre leões famintos.'],['Ezequiel','Jeremias','Neemias'],'daniel leoes oracao'],
['Pedro',['Eu era pescador.','Jesus me chamou para ser pescador de pessoas.','Caminhei sobre as águas por alguns passos.','Neguei Jesus três vezes, mas fui perdoado.'],['André','João','Tiago'],'pedro apostolo negacao'],
['Maria',['Eu era jovem e morava em Nazaré.','Um anjo me visitou com uma notícia especial.','Visitei minha prima Isabel.','Sou a mãe de Jesus.'],['Marta','Ana','Isabel'],'maria jesus nascimento'],
['Paulo',['Antes eu perseguia os cristãos.','Encontrei Jesus numa luz no caminho de Damasco.','Viajei por muitas cidades falando do Evangelho.','Escrevi várias cartas do Novo Testamento.'],['Pedro','Barnabé','Timóteo'],'paulo carta apostolo'],
['José do Egito',['Meu pai me deu uma túnica colorida.','Fui vendido pelos meus irmãos.','Expliquei os sonhos do faraó.','Tornei-me governador do Egito.'],['Benjamim','Judá','Rúben'],'jose egito perdao'],
['Jonas',['Fugi de barco para não obedecer a Deus.','Uma tempestade veio por minha causa.','Fiquei três dias dentro de um grande peixe.','Depois preguei em Nínive.'],['Elias','Oseias','Amós'],'jonas obediencia'],
['Ester',['Fui escolhida rainha da Pérsia.','Era judia, mas no começo escondi isso.','Jejuei e pedi que meu povo jejuasse.','Salvei meu povo da destruição.'],['Rute','Débora','Sara'],'ester coragem'],
['Zaqueu',['Eu era pequeno de estatura.','Era chefe dos cobradores de impostos.','Subi numa árvore para ver Jesus.','Jesus jantou na minha casa.'],['Mateus','Nicodemos','Bartimeu'],'zaqueu jesus'],
['Elias',['Fui profeta no tempo do rei Acabe.','Fui alimentado por corvos.','Fiz descer fogo do céu no monte Carmelo.','Fui levado ao céu num redemoinho.'],['Eliseu','Isaías','Samuel'],'elias fogo profeta']
];
const ORD_RAW=[
['Ordem da criação',['Luz','Plantas','Sol, lua e estrelas','Seres humanos'],'criacao genesis'],
['Os quatro Evangelhos, na ordem da Bíblia',['Mateus','Marcos','Lucas','João'],'evangelho biblia'],
['Os cinco primeiros livros da Bíblia',['Gênesis','Êxodo','Levítico','Números','Deuteronômio'],'biblia livros moises'],
['Do mais antigo ao mais recente',['Adão e Eva','Noé','Abraão','Moisés','Davi'],'biblia historia'],
['A vida de Jesus',['Nascimento','Batismo','Crucificação','Ressurreição','Ascensão'],'jesus vida cruz'],
['A história de José do Egito',['Túnica colorida','Vendido pelos irmãos','Prisão no Egito','Governador do Egito'],'jose egito'],
['A história de Jonas',['Foge de barco','Tempestade','Dentro do grande peixe','Prega em Nínive'],'jonas'],
['O caminho de Israel',['Escravidão no Egito','Travessia do mar Vermelho','Dez Mandamentos','Chegada a Canaã'],'exodo moises israel']
];
const CLOUD_RAW=[
['Uma palavra que lembra o amor de Deus.','amor deus'],
['Uma palavra que descreve a Bíblia para você.','biblia palavra escrituras'],
['Uma palavra que você sente ao orar.','oracao orar'],
['Uma palavra que resume o que Jesus fez por nós.','jesus salvacao cruz'],
['Uma palavra para agradecer a Deus hoje.','gratidao'],
['Uma palavra que Deus fala ao seu coração hoje.','coracao'],
['Uma palavra que mostra como Deus cuida de você.','cuidado deus']
];
const withId=(a,p)=>a.map((x,i)=>({id:p+i,x}));
const QZ=withId(QZ_RAW,'q').map(({id,x})=>({id,q:x[0],o:x.slice(1,5),k:x[5].split(' ')}));
const VFB=withId(VF_RAW,'v').map(({id,x})=>({id,s:x[0],v:!!x[1],k:x[2].split(' ')}));
const WHOB=withId(WHO_RAW,'w').map(({id,x})=>({id,a:x[0],h:x[1],d:x[2],k:x[3].split(' ')}));
const ORDB=withId(ORD_RAW,'o').map(({id,x})=>({id,t:x[0],s:x[1],k:x[2].split(' ')}));
const CLB=withId(CLOUD_RAW,'c').map(({id,x})=>({id,p:x[0],k:x[1].split(' ')}));

/* ---------- desafio por questão ---------- */
const STOP=new Set(['porque','sendo','entre','sobre','quando','assim','ainda','nosso','nossa','vossa','dessa','desse','aquele','aquela','todos','todas','também','portanto','contudo','mesmo','depois','antes','onde','qual','quais','pois','como','muito','todo','toda','seus','suas','esse','essa','isto','aquilo','cujo','cuja']);
const words=t=>(t.match(/[A-Za-zÀ-ÿ]{5,}/g)||[]).filter(w=>!STOP.has(w.toLowerCase()));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const clip=(t,n)=>{t=String(t||'').trim();if(t.length<=n)return t;const c=t.slice(0,n),i=c.lastIndexOf(' ');return (i>n*.6?c.slice(0,i):c)+'…'};
function around(t,mark,n){if(t.length<=n)return t;const i=t.indexOf(mark);let a=Math.max(0,i-Math.floor(n/2)),z=Math.min(t.length,a+n);a=Math.max(0,z-n);
 if(a>0){const s=t.indexOf(' ',a);if(s>-1&&s<i)a=s+1}
 if(z<t.length){const s=t.lastIndexOf(' ',z);if(s>i+mark.length)z=s}
 return (a>0?'… ':'')+t.slice(a,z)+(z<t.length?' …':'')}
F.used=new Set();
const lessonRefs=L=>[...new Set(((L&&L.blocks)||[]).flatMap(x=>(x.refs||[]).concat(x.ref?[x.ref]:[])))];
const lessonVF=L=>((L&&L.blocks)||[]).filter(x=>x.kind==='vf'&&x.opts&&(x.keys||[]).length);
function relText(b,L){return norm(((b&&b.text)||'')+' '+((b&&b.refs)||[]).join(' ')+' '+((L&&L.title)||'')+(b?'':' '+((L&&L.blocks)||[]).map(x=>x.text||'').join(' ')))}
function pickBank(list,b,L){
 const t=relText(b,L);let pool=list.filter(x=>!F.used.has(x.id));if(!pool.length){list.forEach(x=>F.used.delete(x.id));pool=list.slice()}
 const sc=pool.map(x=>({x,s:(x.k||[]).reduce((n,k)=>n+(k&&t.includes(k)?1:0),0)})),mx=Math.max(...sc.map(a=>a.s)),best=sc.filter(a=>a.s===mx).map(a=>a.x);
 const x=best[Math.floor(Math.random()*best.length)];F.used.add(x.id);return x}
async function verseOf(ref){
 const k=K(),r=k.parseRef(ref);if(!r)return null;
 const vs=await k.chapter(r.book,r.chapter);
 const from=r.from||1,to=r.from?(r.to||r.from):Math.min(from+1,vs.length);
 const pick=vs.filter(v=>v.verse>=from&&v.verse<=to);if(!pick.length)return null;
 return {r,vs,pick,text:pick.map(v=>String(v.text).trim()).join(' ')};
}
async function mkVerso(b){
 for(const ref of shuffle(b.refs||[])){
  const v=await verseOf(ref).catch(()=>null);if(!v)continue;
  const ws=words(v.text);if(ws.length<2)continue;
  const ans=ws[Math.floor(ws.length*(.25+Math.random()*.5))]||ws[0];
  const pool=[...new Set(words(v.vs.map(x=>x.text).join(' ')).filter(w=>w.toLowerCase()!==ans.toLowerCase()&&Math.abs(w.length-ans.length)<=3))];
  if(pool.length<3)continue;
  const opts=shuffle([ans].concat(shuffle(pool).slice(0,3)));
  const re=new RegExp('(^|[^A-Za-zÀ-ÿ])'+ans+'(?![A-Za-zÀ-ÿ])');
  const full=v.text.replace(re,(m,p)=>p+'_____');
  return {type:'mc',kind:'verso',ref,prompt:'“'+around(full,'_____',120)+'”',opts,answer:opts.indexOf(ans),secs:15,head:'Complete o versículo'};
 }
 return null;
}
async function mkRef(b){
 for(const ref of shuffle(b.refs||[])){
  const v=await verseOf(ref).catch(()=>null);if(!v||v.text.length<20)continue;
  const lbl=(r,c,a,z)=>r.name+' '+c+':'+a+(z&&z!==a?'-'+z:'');
  const r=v.r,a=r.from||1,z=r.to&&r.to!==a?r.to:null,right=lbl(r,r.chapter,a,z),set=new Set([right]);
  let guard=0;while(set.size<4&&guard++<40){const c=Math.max(1,r.chapter+Math.floor(Math.random()*7)-3),vv=Math.max(1,a+Math.floor(Math.random()*9)-4);set.add(lbl(r,c,vv,z?vv+(z-a):null))}
  if(set.size<4)continue;
  const opts=shuffle([...set]);
  return {type:'mc',kind:'ref',ref,prompt:'“'+clip(v.text,140)+'”',opts,answer:opts.indexOf(right),secs:15,head:'Qual é a referência?'};
 }
 return null;
}
function mkVF(b){
 if(!b||b.kind!=='vf'||!b.opts||!(b.keys||[]).length)return null;
 let idx=[];b.opts.forEach((o,i)=>{if(/^[VF]$/i.test(String(b.keys[i]||'').trim()))idx.push(i)});if(!idx.length)return null;
 const short=idx.filter(i=>String(b.opts[i]).length<=150);if(short.length)idx=short;
 const i=idx[Math.floor(Math.random()*idx.length)];
 return {type:'mc',kind:'vf',ref:'',prompt:'“'+clip(b.opts[i],170)+'”',opts:['Verdadeiro','Falso'],answer:/^V/i.test(String(b.keys[i]).trim())?0:1,secs:10,head:'Verdadeiro ou falso?'};
}
function mkVFBank(b,L){const x=pickBank(VFB,b,L);return {type:'mc',kind:'vf',ref:'',prompt:'“'+x.s+'”',opts:['Verdadeiro','Falso'],answer:x.v?0:1,secs:10,head:'Verdadeiro ou falso?'}}
function mkQuiz(b,L){const x=pickBank(QZ,b,L),opts=shuffle(x.o);return {type:'mc',kind:'quiz',ref:'',prompt:x.q,opts,answer:opts.indexOf(x.o[0]),secs:15,head:'Quiz bíblico'}}
function mkWho(b,L){const x=pickBank(WHOB,b,L),all=[x.a].concat(x.d),opts=shuffle(all);return {type:'mc',kind:'who',ref:'',prompt:'Quem sou eu?',hints:x.h,opts,answer:opts.indexOf(x.a),secs:24,head:'Quem sou eu?'}}
function chunks(text){
 const w=text.replace(/\s+/g,' ').trim().split(' ').slice(0,26);if(w.length<7)return null;
 const n=w.length>=18?5:w.length>=11?4:3,per=Math.ceil(w.length/n),out=[];
 for(let i=0;i<w.length;i+=per)out.push(w.slice(i,i+per).join(' '));
 return out.length>=3&&new Set(out).size===out.length?out:null}
function mkOrdFrom(items,prompt,head,ref){
 let opts=shuffle(items),g=0;while(opts.every((t,i)=>t===items[i])&&g++<10)opts=shuffle(items);
 return {type:'ord',kind:'ord',ref:ref||'',prompt,opts,key:items.map(t=>opts.indexOf(t)),secs:Math.max(25,items.length*7),head:head||'Coloque na ordem'};
}
async function mkOrdVerse(b){
 for(const ref of shuffle((b&&b.refs)||[])){
  const v=await verseOf(ref).catch(()=>null);if(!v)continue;const c=chunks(v.text);if(!c)continue;
  const s=mkOrdFrom(c,'Monte o versículo na ordem certa','Monte o versículo',ref);s.verse=true;return s}
 return null}
function mkOrdBank(b,L){const x=pickBank(ORDB,b,L);return mkOrdFrom(x.s,x.t+': toque na ordem certa','Coloque na ordem')}
function mkCloud(b,L){const t=L&&L.title?String(L.title).replace(/^\d+\s*[-–.:]?\s*/,''):'';
 if(b&&b.text)return {type:'cloud',kind:'cloud',ref:'',prompt:'Uma palavra que resume sua resposta para: '+clip(b.text,80),secs:25,head:'Nuvem de palavras'};
 if(t&&Math.random()<.7)return {type:'cloud',kind:'cloud',ref:'',prompt:'Uma palavra que resume o tema “'+clip(t,50)+'”.',secs:25,head:'Nuvem de palavras'};
 const x=pickBank(CLB,b,L);return {type:'cloud',kind:'cloud',ref:'',prompt:x.p,secs:25,head:'Nuvem de palavras'}}
async function build(b,L,kind,scope){
 const vb=(b&&b.refs&&b.refs.length&&scope!=='tema')?b:{text:'',refs:lessonRefs(L)};
 const vfb=(b&&b.kind==='vf'&&scope!=='tema')?b:shuffle(lessonVF(L))[0]||null;
 const maker={verso:()=>vb.refs.length&&mkVerso(vb),ref:()=>vb.refs.length&&mkRef(vb),vf:()=>mkVF(vfb)||mkVFBank(b,L),quiz:()=>mkQuiz(b,L),who:()=>mkWho(b,L),
  ord:async()=>(vb.refs.length&&await mkOrdVerse(vb))||mkOrdBank(b,L),cloud:()=>mkCloud(b,L)};
 const tries=kind&&kind!=='auto'?[kind]:shuffle(['verso','ref','vf','ord','who','quiz']);
 for(const t of tries){const s=await maker[t]();if(s)return s}
 return kind&&kind!=='auto'&&kind!=='cloud'?mkQuiz(b,L):null;
}
async function launch(bi,kind,scope){
 const k=K(),R=k.S.room;if(!R||!R.host)return;
 if(F.hostCh&&F.hostCh.live){k.toast('Já há um desafio em andamento.');return}
 const L=k.lessonSrc(),blk=L&&bi>=0?L.blocks[bi]:null,b=scope!=='tema'&&blk&&blk.t==='q'?blk:null;
 k.toast('Preparando o desafio…');
 const s=await build(b,L,kind,scope);
 if(!s){k.toast('Não consegui montar este desafio. Tente outro tipo.');return}
 const cid=rid();
 F.hostCh={cid,type:s.type,key:s.type==='ord'?s.key:s.answer,answers:{},live:true,secs:s.secs,t0:Date.now()+1700,end:null};
 const pub={cid,type:s.type,kind:s.kind,head:s.head,title:b?clip(b.text,90):(L&&L.title?clip(L.title,70):''),ref:s.ref,prompt:s.prompt,opts:s.opts||[],hints:s.hints||null,secs:s.secs};
 k.send('chs',pub);playChallenge(pub,true);
}
const SHAPES=['▲','◆','●','■'];
function closeFx(){const o=$('es-fx');if(o)o.remove();if(F.ch){clearInterval(F.ch.tm);clearTimeout(F.ch.auto);F.ch=null}document.body.classList.remove('es-fxon')}
const closeBtn=isHost=>isHost?'':'<button type="button" class="fx-x" onclick="IASDEstudoFX.closeLocal()" aria-label="Fechar">✕</button>';
function playChallenge(p,isHost){
 closeFx();stageClose(true);
 const o=document.createElement('div');o.id='es-fx';o.className='es-fx fx-intro';document.body.appendChild(o);document.body.classList.add('es-fxon');
 F.ch={p,isHost,answered:-1,t0:0,left:p.secs,tm:null,done:false,res:null,ord:[]};
 o.innerHTML='<div class="fx-vig"></div><div class="fx-top"><span class="fx-tag">🎯 DESAFIO</span>'+sndBtn()+closeBtn(isHost)+'</div>'
  +'<div class="fx-intro-box"><div class="fx-big">DESAFIO!</div><p>'+esc(p.head)+'</p>'+(p.title?'<small>'+esc(p.title)+'</small>':'')+'</div>';
 SFX.whoosh();SFX.riser();
 setTimeout(()=>{if(!F.ch||F.ch.p!==p)return;
  F.ch.t0=Date.now();o.classList.remove('fx-intro');o.classList.add('fx-play');
  let mid='';
  if(p.type==='mc'){
   mid=(p.hints?'<div class="fx-hints" id="fx-hints">'+p.hints.map((h,i)=>'<div class="fx-hint" data-h="'+i+'"><em>Dica '+(i+1)+'</em><span>'+esc(h)+'</span></div>').join('')+'</div>':'')
    +'<div class="fx-opts n'+p.opts.length+(p.opts.some(t=>t.length>26)?' long':'')+'">'+p.opts.map((t,i)=>'<button type="button" class="fx-o c'+i+'" data-i="'+i+'" '+(isHost?'disabled':'')+' onclick="IASDEstudoFX.pick('+i+')"><i>'+SHAPES[i%4]+'</i><span>'+esc(t)+'</span></button>').join('')+'</div>';
  }else if(p.type==='ord'){
   mid='<div class="fx-ord"><div class="fx-slots" id="fx-slots"></div><div class="fx-pool" id="fx-pool"></div></div>';
  }else{
   mid=isHost?'<div class="fx-live" id="fx-live"></div>':'<div class="fx-wordbox"><input id="fx-word" maxlength="24" placeholder="Digite uma palavra" autocomplete="off" onkeydown="if(event.key===\'Enter\')IASDEstudoFX.sendWord()"><button type="button" class="fx-send" onclick="IASDEstudoFX.sendWord()">Enviar</button></div>';
  }
  const hint=p.type==='ord'?'Toque nos itens, um por vez, na ordem certa.':p.type==='cloud'?'Escreva só uma palavra. Todos verão a nuvem no final.':p.kind==='who'?'Quanto mais cedo acertar, mais pontos.':'Toque na resposta certa — quanto mais rápido, mais pontos.';
  o.innerHTML='<div class="fx-vig"></div><div class="fx-top"><span class="fx-tag">🎯 '+esc(p.head.toUpperCase())+'</span>'+sndBtn()+closeBtn(isHost)+'</div>'
   +'<div class="fx-body"><div class="fx-timer"><svg viewBox="0 0 100 100"><circle class="fx-ring-bg" cx="50" cy="50" r="44"/><circle id="fx-ring" class="fx-ring" cx="50" cy="50" r="44"/></svg><b id="fx-num">'+p.secs+'</b></div>'
   +'<div class="fx-q'+(p.prompt.length>90?' sm':'')+'">'+esc(p.prompt)+'</div>'+(p.ref&&p.verse?'<div class="fx-sub">'+esc(p.ref)+'</div>':'')+mid
   +'<div class="fx-foot" id="fx-foot">'+(isHost?'<span id="fx-cnt">0 respostas</span><button type="button" class="fx-end" onclick="IASDEstudoFX.endNow()">Encerrar agora</button>':'<span>'+hint+'</span>')+'</div></div>';
  if(p.type==='ord')ordRender();
  tickCh();F.ch.tm=setInterval(tickCh,100);
 },1700);
}
function tickCh(){
 const c=F.ch;if(!c||c.done)return;const p=c.p,el=Math.max(0,(Date.now()-c.t0)/1000),left=Math.max(0,p.secs-el),sec=Math.ceil(left);
 const ring=$('fx-ring'),num=$('fx-num'),o=$('es-fx');if(!ring||!num||!o)return;
 const C=2*Math.PI*44;ring.style.strokeDasharray=C;ring.style.strokeDashoffset=C*(1-left/p.secs);
 if(p.hints){const n=Math.min(p.hints.length,1+Math.floor(el/5));document.querySelectorAll('#fx-hints .fx-hint').forEach((h,i)=>{if(i<n&&!h.classList.contains('on')){h.classList.add('on');if(i>0)SFX.ding()}})}
 if(num.textContent!==String(sec)){num.textContent=sec;
  if(left>0){if(sec<=5){SFX.beat();SFX.tick()}else SFX.tock()}}
 o.classList.toggle('fx-hot',left<=5&&left>0);o.classList.toggle('fx-late',left<=2&&left>0);
 if(left<=0){c.done=true;clearInterval(c.tm);SFX.buzz();o.classList.remove('fx-hot','fx-late');o.classList.add('fx-time');
  const f=$('fx-foot');if(f&&!c.isHost)f.innerHTML='<span>⏰ Tempo! Aguardando o resultado…</span>';
  if(c.isHost)setTimeout(()=>finishChallenge(),900)}
}
function sendAns(extra){const c=F.ch,k=K();c.answered=1;const ms=Date.now()-c.t0;k.send('cha',Object.assign({cid:c.p.cid,id:k.S.room.me,name:k.myName(),ms},extra));
 const f=$('fx-foot');if(f)f.innerHTML='<span>✔ Resposta enviada! Aguardando o tempo acabar…</span>'}
function pick(i){
 const c=F.ch;if(!c||c.isHost||c.done||c.answered>=0||c.p.type!=='mc')return;
 SFX.pop();
 document.querySelectorAll('#es-fx .fx-o').forEach(b=>{b.disabled=true;b.classList.toggle('sel',+b.dataset.i===i);b.classList.toggle('dim',+b.dataset.i!==i)});
 sendAns({i});
}
function ordRender(){
 const c=F.ch;if(!c||c.p.type!=='ord')return;const p=c.p,pool=$('fx-pool'),slots=$('fx-slots');if(!pool||!slots)return;
 const lock=c.isHost||c.done||c.answered>=0;
 slots.innerHTML=p.opts.map((_,s)=>{const idx=c.ord[s];return '<button type="button" class="fx-slot'+(idx!=null?' on':'')+'" '+(idx==null||lock?'disabled':'')+' onclick="IASDEstudoFX.unplace('+s+')"><em>'+(s+1)+'</em><span>'+(idx!=null?esc(p.opts[idx]):'')+'</span></button>'}).join('');
 pool.innerHTML=p.opts.map((t,i)=>'<button type="button" class="fx-chip'+(c.ord.includes(i)?' used':'')+'" '+(c.ord.includes(i)||lock?'disabled':'')+' onclick="IASDEstudoFX.place('+i+')">'+esc(t)+'</button>').join('')}
function place(i){const c=F.ch;if(!c||c.isHost||c.done||c.answered>=0||c.p.type!=='ord'||c.ord.includes(i))return;c.ord.push(i);SFX.pop();
 if(c.ord.length===c.p.opts.length){sendAns({o:c.ord.slice()})}ordRender()}
function unplace(s){const c=F.ch;if(!c||c.isHost||c.done||c.answered>=0||c.p.type!=='ord')return;c.ord.splice(s,1);ordRender()}
function sendWord(){const c=F.ch;if(!c||c.isHost||c.done||c.answered>=0||c.p.type!=='cloud')return;const inp=$('fx-word'),w=(inp&&inp.value||'').trim().split(/\s+/)[0];if(!w){inp&&inp.focus();return}
 SFX.pop();if(inp){inp.disabled=true}const b=document.querySelector('#es-fx .fx-send');if(b)b.disabled=true;sendAns({w:w.slice(0,24)})}
function onAnswer(m){
 const h=F.hostCh;if(!h||!h.live||m.cid!==h.cid||h.answers[m.id])return;
 const a={name:String(m.name||'?').slice(0,40),ms:Math.max(0,Math.min(+m.ms||0,h.secs*1000))};
 if(h.type==='mc')a.i=+m.i;else if(h.type==='ord')a.o=Array.isArray(m.o)?m.o.slice(0,10).map(Number):[];else a.w=String(m.w||'').trim().slice(0,24);
 h.answers[m.id]=a;
 const n=Object.keys(h.answers).length,cnt=$('fx-cnt');if(cnt)cnt.textContent=n+(n===1?' resposta':' respostas');
 if(h.type==='cloud'){const lv=$('fx-live');if(lv&&a.w){const s=document.createElement('span');s.className='fx-bub';s.style.setProperty('--h',hue(a.w));s.textContent=a.w;lv.appendChild(s)}}
 SFX.pop();
 const R=K().S.room;if(!R)return;const total=Object.keys(R.peers).length;
 if(total&&n>=total&&F.ch&&!F.ch.done){setTimeout(()=>{if(F.hostCh&&F.hostCh.live&&F.ch&&!F.ch.done){F.ch.done=true;clearInterval(F.ch.tm);finishChallenge()}},900)}
}
function endNow(){if(F.ch&&F.hostCh&&F.hostCh.live){F.ch.done=true;clearInterval(F.ch.tm);finishChallenge()}}
function finishChallenge(){
 const h=F.hostCh,k=K(),R=k.S.room;if(!h||!h.live||!R)return;h.live=false;
 const ids=new Map();Object.entries(R.peers).forEach(([id,p])=>ids.set(id,String(p.name||'?').slice(0,40)));Object.entries(h.answers).forEach(([id,a])=>{if(!ids.has(id))ids.set(id,a.name)});
 const same=(x,y)=>Array.isArray(x)&&Array.isArray(y)&&x.length===y.length&&x.every((v,i)=>v===y[i]);
 const ppl=[...ids].map(([id,name])=>{const a=h.answers[id];let ok=null;
  if(h.type==='mc')ok=!!a&&a.i===h.key;else if(h.type==='ord')ok=!!a&&same(a.o,h.key);
  const pts=ok?Math.round(1000-700*(a.ms/(h.secs*1000))):0;
  if(a&&h.type!=='cloud'){const s=F.score[id]=F.score[id]||{name,pts:0};s.name=name;s.pts+=pts}
  return {id,name,ok,none:!a,pts,ms:a?a.ms:0,w:a&&a.w||''}});
 const board=Object.entries(F.score).map(([id,s])=>({id,name:s.name,pts:s.pts})).sort((a,b)=>b.pts-a.pts).slice(0,8);
 let words=null;if(h.type==='cloud'){const m=new Map();ppl.forEach(p=>{const w=norm(p.w);if(!w)return;const e=m.get(w)||{w:p.w,n:0};e.n++;m.set(w,e)});words=[...m.values()].sort((a,b)=>b.n-a.n).slice(0,40)}
 const res={cid:h.cid,type:h.type,correct:h.key,ppl,board,words};
 k.send('chr',res);showResult(res);
}
const sil='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.2" r="4.3"/><path d="M3.4 21.5c.5-4.8 4.2-7.3 8.6-7.3s8.1 2.5 8.6 7.3z"/></svg>';
const chip=(p,me,extra)=>'<div class="fx-pp'+(p.id===me?' me':'')+'" style="--h:'+hue(p.name)+'"><span class="fx-pa">'+sil+'</span><b>'+esc(p.name)+(p.id===me?' (você)':'')+'</b>'+(extra?'<small>'+extra+'</small>':'')+'</div>';
function showResult(res){
 const c=F.ch,k=K();if(!c||c.p.cid!==res.cid)return;
 c.done=true;clearInterval(c.tm);c.res=res;const me=k.S.room.me,p=c.p;
 const o=$('es-fx');if(!o)return;o.classList.remove('fx-hot','fx-late','fx-time','fx-play','fx-intro');o.classList.add('fx-res');
 const mine=res.ppl.find(a=>a.id===me);
 if(res.type==='mc')o.querySelectorAll('.fx-o').forEach(b=>{const i=+b.dataset.i;b.disabled=true;b.classList.remove('sel','dim');b.classList.add(i===res.correct?'right':'wrong')});
 if(res.type==='ord'){const sl=$('fx-slots'),pl=$('fx-pool');if(pl)pl.remove();if(sl)sl.innerHTML=res.correct.map((oi,s)=>'<div class="fx-slot on right"><em>'+(s+1)+'</em><span>'+esc(p.opts[oi])+'</span></div>').join('')}
 if(res.type==='cloud'){const mid=$('fx-live')||document.querySelector('.fx-wordbox');const mx=Math.max(1,...(res.words||[]).map(w=>w.n));
  if(mid)mid.outerHTML='<div class="fx-cloud">'+(res.words||[]).map((w,i)=>'<span style="--h:'+hue(w.w)+';--s:'+(1+.9*w.n/mx).toFixed(2)+';--d:'+(i*.07)+'s">'+esc(w.w)+(w.n>1?'<sup>'+w.n+'</sup>':'')+'</span>').join('')+'</div>'}
 const ok=mine&&mine.ok,scored=res.type!=='cloud';
 const win=res.ppl.filter(a=>a.ok),lose=res.ppl.filter(a=>scored&&!a.ok);
 let msg;
 if(!scored)msg='<div class="fx-verdict">'+res.ppl.filter(a=>a.w).length+' palavra(s) enviada(s)</div>';
 else if(c.isHost)msg='<div class="fx-verdict">'+win.length+' de '+res.ppl.length+' acertaram</div>';
 else if(!mine||mine.none)msg='<div class="fx-verdict no">⏰ Você não respondeu a tempo.</div>';
 else msg=ok?'<div class="fx-verdict ok">🎉 Acertou! +'+mine.pts+' pontos</div>':'<div class="fx-verdict no">Quase! O certo está em verde.</div>';
 const who=scored?'<div class="fx-who"><section class="ok"><h4>✔ Acertaram · '+win.length+'</h4>'+(win.length?win.sort((a,b)=>a.ms-b.ms).map((a,i)=>chip(a,me,'+'+a.pts+' · '+(a.ms/1000).toFixed(1)+'s')).join(''):'<p>Ninguém acertou desta vez.</p>')+'</section>'
  +'<section class="no"><h4>✖ Erraram · '+lose.length+'</h4>'+(lose.length?lose.map(a=>chip(a,me,a.none?'não respondeu':'')).join(''):'<p>Ninguém errou. 👏</p>')+'</section></div>'
  :'<div class="fx-who one"><section class="ok"><h4>Quem participou</h4>'+res.ppl.map(a=>chip(a,me,a.w?esc(a.w):'não enviou')).join('')+'</section></div>';
 const board=res.board.map((b,i)=>'<div class="fx-row'+(b.id===me?' me':'')+'" style="--d:'+(i*.12)+'s"><em>'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'º')+'</em><b>'+esc(b.name)+'</b><span>'+b.pts+' pts</span></div>').join('');
 const f=$('fx-foot');
 const html='<div class="fx-result">'+msg+who+(scored&&res.board.length?'<div class="fx-board"><h4>Placar da sala</h4>'+board+'</div>':'')+'<div class="fx-acts">'+(c.isHost?'<button type="button" class="fx-end" onclick="IASDEstudoFX.closeAll()">Fechar para todos</button>':'<button type="button" class="fx-end" onclick="IASDEstudoFX.closeLocal()">Continuar</button>')+'</div></div>';
 if(f)f.outerHTML=html;
 if(scored){if(c.isHost||ok)SFX.win();else SFX.lose()}else SFX.win();
 if(c.isHost)F.hostCh=null;
}
function closeAll(){const k=K();k.send('chx',{});closeFx();F.hostCh=null}
function closeLocal(){closeFx()}

/* ---------- palco: revelar respostas como um jogo ---------- */
function ansList(bid){const R=K().S.room;return Object.entries(R.ans[bid]||{}).filter(([id,a])=>a&&String(a.text||'').trim()).map(([id,a])=>({id,name:a.name,text:a.text}))}
function stageOpen(bid){
 const k=K(),R=k.S.room;if(!R)return;
 const L=k.lessonSrc(),b=L&&L.blocks.find(x=>x.id===bid);if(!b)return;
 closeFx();stageClose(true);
 const o=document.createElement('div');o.id='es-stage';o.className='es-stage';document.body.appendChild(o);document.body.classList.add('es-fxon');
 const S2=F.stage={bid,b,shown:new Set(),tm:null,intro:true,spot:null};
 o.innerHTML='<div class="stg-top"><span class="fx-tag">🎬 RESPOSTAS</span>'+sndBtn()+(R.host?'<button type="button" class="stg-close" onclick="IASDEstudoFX.stageEnd()">Encerrar</button>':'<button type="button" class="fx-x" onclick="IASDEstudoFX.stageClose()" aria-label="Fechar">✕</button>')+'</div>'
  +'<h2 class="stg-q">'+esc(b.text)+'</h2>'
  +'<div class="stg-intro" id="stg-intro"><div class="stg-rings"><i></i><i></i><i></i></div><div class="stg-it">Revelando respostas…</div></div>'
  +'<div class="stg-grid" id="stg-grid"></div><div class="stg-tally" id="stg-tally"></div><div class="stg-note" id="stg-note"></div>';
 SFX.drum();
 setTimeout(()=>{if(F.stage!==S2)return;SFX.crash();S2.intro=false;const i=$('stg-intro');if(i)i.classList.add('out');setTimeout(()=>{const i2=$('stg-intro');if(i2)i2.remove()},500);stageRun()},2000);
}
function stageRun(){
 const S2=F.stage;if(!S2||S2.intro)return;
 if(S2.tm)return;
 S2.tm=setInterval(()=>{
  const st=F.stage;if(!st){return}
  const next=ansList(st.bid).find(a=>!st.shown.has(a.id));
  if(!next){clearInterval(st.tm);st.tm=null;stageNote();return}
  st.shown.add(next.id);addCard(next);
 },720);
}
function fmtFor(b,text){return String(text||'')}
function picHTML(a,big){const k=K(),ms=k.stream(a.id);return {html:'<div class="stg-pic'+(big?' big':'')+(ms?' vid':'')+'" style="--h:'+hue(a.name)+'"><video autoplay playsinline muted></video><span class="stg-sil">'+sil+'</span><i class="stg-in">'+esc((a.name||'?').charAt(0).toUpperCase())+'</i></div>',ms}}
function bindPic(root,ms,id){const v=root.querySelector('video'),pic=root.querySelector('.stg-pic');
 const put=m=>{if(!v||!m)return false;v.srcObject=m;const p=v.play&&v.play();if(p&&p.catch)p.catch(()=>{});if(pic)pic.classList.add('vid');return true};
 if(put(ms)||!id)return;let n=0;const t=setInterval(()=>{if(!root.isConnected||++n>16){clearInterval(t);return}if(put(K().stream(id)))clearInterval(t)},500)}
function typeText(el,text){text=String(text||'');if(text.length>200){el.textContent=text;return}let i=0;el.textContent='';el.classList.add('typing');
 const t=setInterval(()=>{if(!el.isConnected){clearInterval(t);return}i+=2;el.textContent=text.slice(0,i);if(i>=text.length){clearInterval(t);el.classList.remove('typing')}},24)}
function addCard(a){
 const g=$('stg-grid');const k=K(),R=k.S.room;if(!g||!R)return;
 const d=document.createElement('div');d.className='stg-card';d.dataset.id=a.id;d.style.setProperty('--h',hue(a.name));
 const pc=picHTML(a,false);
 d.innerHTML=pc.html+'<b class="stg-nm">'+esc(a.id===R.me?a.name+' (você)':a.name)+'</b><p class="stg-tx"></p>';
 bindPic(d,pc.ms,a.id);
 d.onclick=()=>{if(R.host)k.send('hl',{bid:F.stage&&F.stage.bid,id:a.id}),spot(F.stage&&F.stage.bid,a.id)};
 g.appendChild(d);SFX.pop();setTimeout(()=>typeText(d.querySelector('.stg-tx'),a.text),380);d.scrollIntoView({block:'nearest',behavior:'smooth'});stageTally();stageNote();
}
function stageTally(){
 const S2=F.stage;if(!S2)return;const b=S2.b,t=$('stg-tally');if(!t||b.kind!=='x'||!b.opts)return;
 const list=ansList(S2.bid).filter(a=>S2.shown.has(a.id)),counts=b.opts.map(o=>list.filter(a=>a.text===o).length),mx=Math.max(1,...counts);
 t.innerHTML=b.opts.map((o,i)=>'<div class="stg-bar"><span>'+esc(o)+'</span><i style="--w:'+Math.round(counts[i]*100/mx)+'%"></i><em>'+counts[i]+'</em></div>').join('');
}
function stageNote(){
 const S2=F.stage;if(!S2)return;const k=K(),R=k.S.room,n=$('stg-note');if(!n||!R)return;
 const total=Object.keys(R.peers).length+1,got=ansList(S2.bid).length;
 n.textContent=got?(got<total?(total-got)+' ainda não responderam · toque num cartão para destacar':'Todos responderam · toque num cartão para destacar'):'Ninguém respondeu ainda. As respostas aparecem aqui assim que chegarem.';
 if(!R.host)n.textContent=got?got+' resposta'+(got>1?'s':'')+' reveladas':n.textContent;
}
function spot(bid,id){
 const S2=F.stage;if(!S2||S2.bid!==bid)return;
 const old=document.querySelector('.stg-spot');if(old)old.remove();
 if(!id||S2.spot===id){S2.spot=null;return}
 const a=ansList(bid).find(x=>x.id===id);if(!a)return;S2.spot=id;
 const d=document.createElement('div');d.className='stg-spot';d.style.setProperty('--h',hue(a.name));
 const pc=picHTML(a,true);d.innerHTML='<div class="stg-spotc">'+pc.html+'<b>'+esc(a.name)+'</b><p>'+esc(a.text)+'</p><small>'+(K().S.room.host?'Toque para fechar':'')+'</small></div>';bindPic(d,pc.ms,a.id);
 d.onclick=()=>{if(K().S.room.host){K().send('hl',{bid,id:null});spot(bid,null)}else{d.remove();S2.spot=null}};
 $('es-stage').appendChild(d);SFX.chime();
}
function stageEnd(){const k=K(),R=k.S.room;if(!R||!R.host||!F.stage)return;const bid=F.stage.bid;R.rev[bid]=false;k.send('rev',{bid,on:false});stageClose(true);k.repaintRv()}
function stageClose(silent){const s=F.stage;if(s&&s.tm)clearInterval(s.tm);F.stage=null;const o=$('es-stage');if(o)o.remove();if(!$('es-fx'))document.body.classList.remove('es-fxon')}

/* ---------- intervalo ---------- */
function breakStart(secs){
 const k=K();breakStop(true);if(!secs)return;
 const o=document.createElement('div');o.id='es-break';o.className='es-break';
 o.innerHTML='<div class="brk-c"><div class="brk-ic">☕</div><h3>Intervalo</h3><div class="brk-t" id="brk-t">--:--</div><p>Aproveitem para esticar as pernas e conversar no chat. Voltamos já.</p>'+(k.S.room.host?'<button type="button" class="fx-end" onclick="IASDEstudoFX.breakEnd()">Encerrar intervalo</button>':'')+'</div>';
 document.body.appendChild(o);F.brk={end:Date.now()+secs*1000,tm:null};SFX.chime();
 const tick=()=>{const left=Math.max(0,Math.ceil((F.brk.end-Date.now())/1000)),t=$('brk-t');if(t)t.textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left<=0){SFX.chime();if(k.S.room&&k.S.room.host)breakEnd();else breakStop(true)}};
 tick();F.brk.tm=setInterval(tick,500);
}
function breakStop(silent){if(F.brk&&F.brk.tm)clearInterval(F.brk.tm);F.brk=null;const o=$('es-break');if(o)o.remove()}
function breakEnd(){const k=K();k.send('brk',{secs:0});breakStop(true);k.toast('Intervalo encerrado.')}
function breakGo(secs){const k=K();if(!k.S.room||!k.S.room.host)return;k.send('brk',{secs});breakStart(secs)}

/* ---------- eventos vindos da sala ---------- */
function on(ev,p){
 const k=K(),R=k.S.room;if(!R)return;
 if(ev==='chs'&&!R.host)playChallenge(p,false);
 else if(ev==='cha'&&R.host)onAnswer(p);
 else if(ev==='chr'&&!R.host)showResult(p);
 else if(ev==='chx'&&!R.host)closeFx();
 else if(ev==='stage'){if(p.on)stageOpen(p.bid);else stageClose(true)}
 else if(ev==='ans'){if(F.stage&&F.stage.bid===p.bid){stageRun();stageNote()}}
 else if(ev==='hl')spot(p.bid,p.id);
 else if(ev==='brk')breakStart(+p.secs||0);
 else if(ev==='call'&&p.to===R.me){SFX.chime();k.toast('🙋 O dirigente chamou você. Se quiser falar, ligue o microfone.');if(R.hand){R.hand=false;k.track();k.paintBar()}}
 else if(ev==='mute'&&!R.host){k.muteMic()}
 else if(ev==='end'&&!R.host){closeFx();stageClose(true);breakStop(true);k.endedByHost()}
}
function reset(){closeFx();stageClose(true);breakStop(true);F.hostCh=null;F.score={}}
window.IASDEstudoFX={on,launch,pick,place,unplace,sendWord,endNow,closeAll,closeLocal,stageEnd,stageClose,toggleSound(){setMuted(!muted)},breakGo,breakEnd,reset,sfx:SFX,stageOpen,
 isLive:()=>!!(F.hostCh&&F.hostCh.live)};
})();
