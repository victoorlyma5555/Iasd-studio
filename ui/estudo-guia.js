/* Explicação pronta para o dirigente: junta resposta-guia/comentário da lição com o
   ensino adventista do tema (28 Crenças Fundamentais). Textos bíblicos só como referência. */
(function(){
const T=[ // [regex, tema, crença, explicação, aplicação, referências]
 [/b[ií]blia|escritura|palavra de deus|inspira|voz de deus|ouvir a deus|falar com deus|revela[cç][aã]o/i,'A Palavra de Deus','Crença 1 — As Escrituras','A Bíblia é a Palavra de Deus escrita, inspirada pelo Espírito Santo. Para os adventistas ela é a única regra de fé e prática e o padrão para testar todo ensino e toda experiência. Deus fala conosco por meio dela e confirma o que diz com o Espírito.','Convide a turma a dizer quando a Bíblia lhes falou de forma pessoal e incentive o hábito diário de leitura e oração.',['2 Timóteo 3:16-17','2 Pedro 1:21','Salmo 119:105','João 10:27']],
 [/trindade|esp[ií]rito santo|consolador|pai,? filho/i,'Deus e o Espírito Santo','Crenças 2, 3 e 5 — Trindade, Pai, Espírito Santo','Há um só Deus em três pessoas coeternas: Pai, Filho e Espírito Santo. O Espírito convence do pecado, conduz à verdade, transforma o caráter e capacita a igreja para o testemunho.','Mostre que o Espírito é uma Pessoa que habita e guia, não uma força. Peça um exemplo de como Ele tem conduzido a vida da turma.',['Mateus 28:19','2 Coríntios 13:13','João 16:13','Atos 1:8','Gálatas 5:22-23']],
 [/cria[cç][aã]o|criou|criador|origem|ado[aã]o|\beva\b|[eé]d[eé]n|evolu/i,'Criação','Crença 6 — Criação','Deus criou o mundo e a humanidade em seis dias literais e descansou no sétimo, estabelecendo o Sábado como memorial. O ser humano foi criado à imagem de Deus, com valor e propósito.','Relacione a Criação com o valor de cada pessoa e com o Sábado como lembrança de que Deus é o Criador.',['Gênesis 1:1','Gênesis 1:27','Êxodo 20:11','Salmo 33:6-9']],
 [/s[aá]bado|s[eé]timo dia|guardar o dia|dia de descanso/i,'O Sábado','Crença 20 — O Sábado','O sétimo dia foi santificado por Deus na Criação, ordenado no quarto mandamento e guardado por Jesus. É memorial da criação e sinal da redenção e do descanso em Cristo, guardado do pôr do sol de sexta ao pôr do sol de sábado.','Fale do Sábado como presente e delícia, não como peso: tempo com Deus, a família e a igreja.',['Gênesis 2:2-3','Êxodo 20:8-11','Marcos 2:27-28','Isaías 58:13-14','Lucas 4:16']],
 [/mandamento|lei de deus|decálogo|dez mandamentos|obedi[eê]ncia|lei\b/i,'A Lei de Deus','Crença 19 — A Lei de Deus','Os Dez Mandamentos expressam o amor de Deus e Sua vontade. Não nos salvam, mas mostram o pecado e orientam quem já foi salvo pela graça. Obedecemos por amor a Cristo, com o poder que Ele dá.','Deixe claro: salvos pela graça, e por isso obedecemos. A obediência é fruto do amor, não moeda de troca.',['Êxodo 20:1-17','João 14:15','Romanos 3:31','1 João 5:3','Tiago 2:12']],
 [/salva[cç][aã]o|gra[cç]a|justifica|perd[aã]o|arrepend|convers[aã]o|nascer de novo|pecado|redimi|reden[cç][aã]o/i,'Salvação pela graça','Crenças 9 e 10 — Morte de Cristo e experiência da salvação','Somos salvos pela graça, mediante a fé em Jesus, e não por obras. Cristo viveu e morreu em nosso lugar; pela fé recebemos perdão, justificação e um novo coração, e o Espírito nos transforma dia a dia.','Pergunte onde a turma sente mais dificuldade em descansar na graça e reforce o convite: confessar, crer e seguir.',['Efésios 2:8-9','Romanos 3:23-24','1 João 1:9','Romanos 5:8','Tito 3:5']],
 [/jesus|cristo|cruz|sacrif[ií]cio|mediador|encarna|ressurrei[cç][aã]o de jesus|messias/i,'Jesus Cristo','Crenças 4 e 9 — O Filho; vida, morte e ressurreição de Cristo','Jesus é Deus feito homem: viveu sem pecado, morreu em nosso lugar, ressuscitou e hoje intercede por nós como nosso Sacerdote. Toda a Escritura aponta para Ele.','Conduza a turma a ver Cristo no centro do texto: o que este trecho revela sobre quem Ele é e o que fez por nós?',['João 3:16','Isaías 53:5','1 Pedro 2:24','Hebreus 4:14-16','João 14:6']],
 [/morte|mortos|alma|ressurrei[cç][aã]o|dormir|sepultura|inferno|imortal|c[eé]u e inferno/i,'Morte e ressurreição','Crença 26 — Morte e ressurreição','A morte é um sono inconsciente até a ressurreição na volta de Jesus. A alma não é imortal por natureza: a imortalidade é dom de Deus aos salvos. Os mortos em Cristo ressuscitarão e os vivos serão transformados juntos.','Traga conforto: quem morreu em Cristo repousa na esperança do reencontro. Cuidado com tom de medo; foque na promessa.',['Eclesiastes 9:5-6','João 11:11-14','1 Tessalonicenses 4:13-17','João 5:28-29','1 Coríntios 15:51-54']],
 [/segunda vinda|volta de jesus|sinais|fim dos tempos|advento|pr[oó]xim[ao] vinda|arrebat/i,'A volta de Jesus','Crença 25 — A segunda vinda de Cristo','Jesus voltará pessoal, visível e glorioso para buscar os Seus. Os sinais mostram que está próximo, mas ninguém sabe o dia nem a hora. Por isso vivemos preparados, com esperança e missão.','Termine com esperança e urgência amorosa: estar pronto é viver perto de Jesus hoje.',['Mateus 24:30-31','Mateus 24:36','Atos 1:11','1 Tessalonicenses 4:16-17','Apocalipse 1:7']],
 [/santu[aá]rio|2300|2\.300|ju[ií]zo|investigativo|expia[cç][aã]o|sacerd[oó]cio|dia da expia/i,'Santuário e juízo','Crença 24 — O santuário celestial','No santuário celestial Cristo exerce Seu ministério em nosso favor. Desde 1844 Ele realiza a obra final de juízo, que revela os que aceitaram a salvação e prepara Sua volta. É boa notícia: nosso Advogado é o próprio Juiz.','Mostre o santuário como a história do evangelho: Jesus é nosso Sacrifício, Sacerdote e Advogado.',['Daniel 8:14','Hebreus 8:1-2','Hebreus 9:24','Apocalipse 14:6-7','1 João 2:1']],
 [/batismo|batizar|batizado/i,'Batismo','Crença 15 — Batismo','O batismo por imersão simboliza a morte para o pecado e a nova vida em Cristo. É resposta pública de quem creu, se arrependeu e decidiu seguir a Jesus, e porta de entrada para a igreja.','Convide com carinho quem ainda não decidiu a refletir, sem pressão; reconheça quem já se batizou.',['Mateus 28:19-20','Romanos 6:3-4','Atos 2:38','Marcos 16:16']],
 [/ora[cç][aã]o|orar|jejum|intercess/i,'Oração','Crença 11 — Crescer em Cristo','A oração é conversar com Deus como com um amigo. Crescemos em Cristo orando, estudando a Palavra e servindo, e Deus responde segundo Sua sabedoria e amor.','Peça que alguém conte uma resposta de oração e feche com uma oração curta pela turma.',['Mateus 6:6','Filipenses 4:6-7','1 Tessalonicenses 5:17','Jeremias 33:3']],
 [/d[ií]zimo|oferta|mordomia|dinheiro|bens|generos/i,'Mordomia','Crença 21 — Mordomia','Tudo pertence a Deus; somos administradores do tempo, dos talentos, do corpo e dos bens. O dízimo e as ofertas expressam gratidão e confiança, e sustentam a missão da igreja.','Fale de gratidão e confiança, não de obrigação. Mostre que mordomia vai além do dinheiro.',['Malaquias 3:10','Levítico 27:30','Mateus 23:23','2 Coríntios 9:6-7','Salmo 24:1']],
 [/igreja|comunh[aã]o|congrega|reuni[aã]o|rema?nescente|membro|unidade|ceia/i,'A Igreja','Crenças 12 a 16 — Igreja, remanescente, unidade, batismo e Ceia','A igreja é a comunidade dos que confessam Jesus como Senhor e Salvador. Somos chamados a nos reunir, a servir uns aos outros e a anunciar o evangelho, em unidade e amor.','Valorize a comunhão: pergunte como a turma pode cuidar melhor uns dos outros.',['Mateus 16:18','Hebreus 10:24-25','Efésios 4:11-13','Atos 2:42','João 13:34-35']],
 [/\bdons?\b|talento|minist[eé]rio|servi[cç]o|miss[aã]o|testemunh|evangeliz/i,'Dons e missão','Crença 17 — Dons e ministérios espirituais','Deus dá dons a todos os membros para edificar a igreja e cumprir a missão. Cada pessoa tem um papel e todos são chamados a compartilhar a esperança em Jesus.','Ajude cada pessoa a nomear um dom que já usou e uma forma simples de servir esta semana.',['1 Coríntios 12:4-11','Romanos 12:4-8','Mateus 28:19-20','1 Pedro 4:10']],
 [/sa[uú]de|corpo|templo|alimenta|vício|bebida|fumo|cuidar do corpo|temperan/i,'Corpo e saúde','Crença 22 — Comportamento cristão','O corpo é templo do Espírito Santo. Cuidar da saúde com alimentação simples, exercício, descanso, temperança e confiança em Deus é parte de glorificá-Lo.','Foque em um passo prático e positivo, sem condenação.',['1 Coríntios 6:19-20','1 Coríntios 10:31','3 João 2','Romanos 12:1']],
 [/casamento|fam[ií]lia|esposo|esposa|filhos|\bpais\b|marido/i,'Casamento e família','Crença 23 — Casamento e família','O casamento foi instituído por Deus no Éden como união de um homem e uma mulher em amor e fidelidade. A família é lugar de graça, de ensino e de testemunho.','Aplique com sensibilidade: há famílias de todos os tipos na turma; foque no cuidado e no perdão.',['Gênesis 2:24','Efésios 5:25','Efésios 6:1-4','Deuteronômio 6:6-7']],
 [/satan|diabo|tenta[cç][aã]o|grande conflito|guerra espiritual|dem[oô]nio|\bmal\b|anjos?/i,'O grande conflito','Crença 8 — O grande conflito','Há uma guerra entre Cristo e Satanás sobre o caráter de Deus. Na cruz Satanás foi derrotado; em Cristo temos poder para vencer a tentação, e os anjos servem aos que herdam a salvação.','Traga segurança: Cristo já venceu e fica ao nosso lado. Sem sensacionalismo.',['Apocalipse 12:7-9','Efésios 6:11-12','Tiago 4:7','Hebreus 1:14','1 Pedro 5:8-9']],
 [/ellen|profecia|profeta|dom de profecia|ap[oó]calipse|daniel|besta|estátua|reinos|1260|livro de/i,'Profecia','Crença 18 — O dom de profecia','As profecias mostram que Deus conduz a história e cumpre Sua palavra. O dom de profecia se manifestou no ministério de Ellen G. White, cujos escritos, sujeitos à Bíblia, edificam e orientam a igreja remanescente.','Mostre que a profecia dá confiança, não medo: Deus sabe o fim desde o começo.',['Amós 3:7','Daniel 2:44','Apocalipse 12:17','Apocalipse 19:10','Isaías 46:9-10']],
 [/novo c[eé]u|nova terra|mil[eê]nio|c[eé]u\b|eternidade|vida eterna|restaura/i,'Novo céu e nova terra','Crenças 27 e 28 — O milênio e a nova terra','Após o milênio Deus fará novos céus e nova terra, onde a justiça habita e não haverá mais dor, choro nem morte. A vida eterna é dom de Deus aos que confiam em Jesus.','Termine com esperança concreta: peça que alguém diga o que mais espera da nova terra.',['Apocalipse 21:1-4','2 Pedro 3:13','Isaías 65:17','João 3:16']],
 [/discipul|seguir|vida crist[aã]|fruto|vigiar|crescimento|santifica|transforma|car[aá]ter/i,'Vida cristã','Crença 11 — Crescer em Cristo','Crescemos em Cristo permanecendo nEle: oração, estudo da Palavra, comunhão e serviço. O Espírito produz fruto e molda o caráter, dia após dia.','Peça um compromisso pequeno e prático para esta semana.',['João 15:4-5','Gálatas 2:20','Gálatas 5:22-23','2 Pedro 3:18']]
];
const base=['Leia a pergunta em voz alta e peça que dois ou três respondam com as próprias palavras.','Leia juntos o texto bíblico indicado e deixe a Bíblia responder.','Conclua em uma frase, ligando a resposta a Jesus e a uma decisão prática.'];
function pick(b,lt){
 for(const s of [[b.text,b.guide,b.note].join(' '),lt||''])for(const t of T)if(t[0].test(s))return t;return null;
}
function esc(x){return String(x==null?'':x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function nl(x){return esc(x).replace(/\n/g,'<br>')}
function gabarito(b){
 if(!b.opts||!b.keys)return '';
 if(b.kind==='vf')return b.opts.map((o,i)=>'<li><b>'+esc(b.keys[i])+'</b> — '+esc(o)+'</li>').join('');
 const r=b.opts.filter((o,i)=>b.keys[i]==='X');return r.map(o=>'<li>'+esc(o)+'</li>').join('');
}
/* devolve {html, share}: html para o dirigente, share = texto curto que pode ir para a turma */
const DIRETA={
'A Palavra de Deus':'A Bíblia é a Palavra de Deus, inspirada pelo Espírito Santo, e é a única regra de fé e prática. Por ela Deus fala conosco hoje.',
'Deus e o Espírito Santo':'Há um só Deus em três Pessoas: Pai, Filho e Espírito Santo. O Espírito nos convence, guia à verdade e transforma o caráter.',
'Criação':'Deus criou tudo, e o ser humano à Sua imagem, em seis dias, e descansou no sétimo. Por isso cada pessoa tem valor e propósito.',
'O Sábado':'O sábado, sétimo dia, foi santificado por Deus na Criação e é lembrança de que Ele é Criador e Salvador. Guardamos por amor, com alegria.',
'A Lei de Deus':'A Lei de Deus expressa o Seu amor. Ela não nos salva, mas mostra o pecado e guia quem já foi salvo pela graça. Obedecemos por amor a Jesus.',
'Salvação pela graça':'Somos salvos pela graça, por meio da fé em Jesus, e não por obras. Ele nos perdoa, nos justifica e nos transforma.',
'Jesus Cristo':'Jesus é Deus feito homem, viveu sem pecado, morreu em nosso lugar, ressuscitou e hoje intercede por nós. Toda a Bíblia aponta para Ele.',
'Morte e ressurreição':'A morte é um sono inconsciente até a ressurreição na volta de Jesus. Os que morreram em Cristo ressuscitarão para a vida eterna.',
'A volta de Jesus':'Jesus voltará de forma pessoal, visível e gloriosa para buscar os Seus. Ninguém sabe o dia; por isso vivemos preparados.',
'Santuário e juízo':'No santuário celestial Jesus intercede por nós como Sacerdote e Advogado, e realiza a obra final de juízo antes de voltar.',
'Batismo':'O batismo por imersão mostra a morte para o pecado e a nova vida em Cristo. É a decisão pública de seguir a Jesus.',
'Oração':'Orar é conversar com Deus como com um amigo. Ele nos ouve e responde segundo a Sua sabedoria e o Seu amor.',
'Mordomia':'Tudo pertence a Deus; somos administradores do tempo, dos talentos e dos bens. O dízimo e as ofertas expressam gratidão e confiança.',
'A Igreja':'A igreja é a família dos que seguem a Jesus. Somos chamados a nos reunir, cuidar uns dos outros e anunciar o evangelho em unidade.',
'Dons e missão':'Deus dá dons a todos para edificar a igreja e cumprir a missão. Cada um tem um papel em compartilhar a esperança em Jesus.',
'Corpo e saúde':'O corpo é templo do Espírito Santo. Cuidar da saúde glorifica a Deus: alimentação simples, descanso, exercício e temperança.',
'Casamento e família':'O casamento foi instituído por Deus no Éden, como união de amor e fidelidade. A família é lugar de graça, ensino e testemunho.',
'O grande conflito':'Há uma guerra entre Cristo e Satanás sobre o caráter de Deus. Na cruz Cristo venceu, e nEle também podemos vencer a tentação.',
'Profecia':'As profecias mostram que Deus conduz a história e cumpre a Sua palavra. Elas dão confiança e esperança, não medo.',
'Novo céu e nova terra':'Deus fará novos céus e nova terra, sem dor, choro nem morte. A vida eterna é dom aos que confiam em Jesus.',
'Vida cristã':'Crescemos em Cristo permanecendo nEle: oração, Palavra, comunhão e serviço. O Espírito produz fruto e molda o caráter.'
};
const GENERIC='A resposta está na própria Bíblia: leia o texto indicado e responda com suas palavras o que ele ensina sobre Deus, sobre nós e sobre o caminho da salvação em Jesus.';
function firstSent(x,n){x=String(x||'').replace(/\s+/g,' ').trim();if(!x)return '';const m=x.match(/^(.+?[.!?])(\s|$)/);let t=m?m[1]:x;if(t.length<60&&m){const m2=x.slice(t.length).trim().match(/^(.+?[.!?])(\s|$)/);if(m2)t+=' '+m2[1]}return t.length>n?t.slice(0,n).replace(/\s+\S*$/,'')+'…':t}
function direta(b,t){
 if(b.opts&&b.keys){const g=gabarito(b);if(g){const txt=g.replace(/<\/li>/g,'; ').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/; $/,'');return b.kind==='vf'?'Confira cada afirmação: '+txt:txt}}
 if(b.guide)return firstSent(b.guide,260);
 if(t&&DIRETA[t[1]])return DIRETA[t[1]];
 return GENERIC}
function explain(b,lt){
 const t=pick(b,lt),refs=[...new Set((b.refs||[]).concat(t?t[5].slice(0,3):[]))];
 const g=gabarito(b),dr=direta(b,t);let h='<div class="eg-q">'+esc(b.text)+'</div><div class="eg-d"><b>Resposta direta</b><p>'+esc(dr)+'</p></div>';
 if(g)h+='<h4>Resposta esperada</h4><ul class="eg-ul">'+g+'</ul>';
 if(b.guide&&b.guide.trim()!==dr.trim())h+='<h4>Explicação</h4><p>'+nl(b.guide)+'</p>';
 if(t&&!b.guide)h+='<h4>Explicação</h4><p>'+esc(t[3])+'</p>';
 if(b.note)h+='<h4>Comentário</h4><p>'+nl(b.note)+'</p>';
 if(t&&b.guide)h+='<h4>Ensino adventista — '+esc(t[1])+'</h4><p>'+esc(t[3])+'</p><small class="eg-cr">'+esc(t[2])+'</small>';
 else if(t)h+='<small class="eg-cr">Ensino adventista · '+esc(t[2])+'</small>';
 if(!t&&!b.guide&&!b.note)h+='<h4>Explicação</h4><p>Deixe a própria Bíblia responder: leia o texto indicado e peça que a turma diga com palavras simples o que ele ensina sobre Deus, sobre nós e sobre o caminho da salvação em Jesus.</p>';
 if(refs.length)h+='<h4>Base bíblica</h4><div class="eg-refs">'+refs.map(r=>'<span>📖 '+esc(r)+'</span>').join('')+'</div>';
 h+='<h4>Como conduzir</h4><ol class="eg-ul">'+base.map(x=>'<li>'+esc(x)+'</li>').join('')+(t?'<li>'+esc(t[4])+'</li>':'')+'</ol>';
 const share=(dr+(b.guide&&b.guide.trim()!==dr.trim()?'\n\n'+b.guide:(!b.guide&&t?'\n\n'+t[3]:''))).slice(0,900);
 return {html:h,share,refs,topic:t?t[1]:''};
}

/* ---------- correção automática: certo / quase / ainda não ---------- */
const SW=new Set('que com para uma como mais pois por seu sua suas seus dos das nos nas num numa ele ela eles elas isso isto esse essa este esta são ser foi era está estão tem têm ter não sim mas ou nem já também muito pela pelo pelos pelas sobre entre quando onde qual quais cada todo toda todos todas tudo nada ainda assim então porque quem tua teu vós nós vos nos'.split(' ').map(x=>x.normalize('NFD').replace(/[̀-ͯ]/g,'')));
const nrm=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const KEEP=new Set(['luz','paz','fe','sol','mal','bem']);
function toks(t){return (nrm(t).match(/[a-z]+/g)||[]).filter(w=>(w.length>=4||KEEP.has(w))&&!SW.has(w))}
const stem=w=>w.length>6?w.slice(0,6):w.length>4?w.slice(0,5):w;
function lev(a,b){if(Math.abs(a.length-b.length)>1)return 9;const m=[];for(let i=0;i<=a.length;i++){m[i]=[i];for(let j=1;j<=b.length;j++)m[i][j]=i?0:j}
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]}
const same=(x,y)=>x===y||(x.length>=5&&y.length>=5&&lev(x,y)<=1);
function grade(b,raw){
 raw=String(raw==null?'':raw);
 if(b.opts&&b.keys&&(b.kind==='vf'||b.kind==='x')){
  if(b.kind==='x'&&(b.multiple||b.keys.filter(k=>k==='X').length>1)){const selected=new Set(raw.split(',').filter(x=>/^\d+$/.test(x)).map(Number));if(!selected.size)return null;const right=b.keys.map((k,i)=>k==='X'?i:null).filter(i=>i!=null),wrong=[...selected].some(i=>!right.includes(i)),complete=!wrong&&right.every(i=>selected.has(i));return complete?{r:'ok',msg:'✅ Certo! Você marcou todas as alternativas corretas.'}:wrong?{r:'no',msg:'↻ Revise as alternativas escolhidas.'}:{r:'part',msg:'🟡 Está no caminho. Há outras alternativas corretas.'}}
  if(b.kind==='x'){const i=+raw;if(raw===''||isNaN(i))return null;const ok=b.keys[i]==='X';return ok?{r:'ok',msg:'✅ Certo! Essa é a alternativa correta.'}:{r:'no',msg:'❌ Ainda não. Releia o texto bíblico e tente outra alternativa.'}}
  const a=raw.split(','),tot=b.opts.length;let hit=0,ans=0;b.opts.forEach((o,i)=>{const v=(a[i]||'').trim();if(v)ans++;if(v&&v===String(b.keys[i]).trim())hit++});
  if(!ans)return null;if(hit===tot)return {r:'ok',msg:'✅ Certo! Todas as afirmações estão corretas.'};
  return hit>=Math.ceil(tot/2)?{r:'part',msg:'🟡 Quase! Você acertou '+hit+' de '+tot+'. Revise as outras e envie de novo.'}:{r:'no',msg:'❌ Ainda não: '+hit+' de '+tot+' corretas. Releia o texto e tente de novo.'};
 }
 return null; /* resposta digitada não é corrigida pelo sistema: quem conduz confere */
 const ref=firstSent(b.guide||'',360),T=[...new Map(toks(ref).map(w=>[stem(w),w])).entries()];
 const S=toks(raw).map(stem);
 if(!T.length)return null;
 if(S.length<2){const h1=T.some(([st])=>S.some(x=>same(x,st)));return h1?{r:'part',msg:'🟡 Está no caminho. Explique um pouco mais, com suas palavras.'}:{r:'no',msg:'❌ Escreva um pouco mais para eu conferir, com suas próprias palavras.'}}
 let use=T;if(use.length>14)use=use.slice().sort((x,y)=>y[1].length-x[1].length).slice(0,14);
 const hit=use.filter(([st])=>S.some(x=>same(x,st))),miss=use.filter(u=>!hit.includes(u)),cov=hit.length/use.length;
 if(cov>=.4||hit.length>=4)return {r:'ok',msg:'✅ Certo! Sua resposta está de acordo com o estudo.'};
 if(hit.length>=2||cov>=.18)return {r:'part',msg:'🟡 Está no caminho. Tente incluir também: '+miss.sort((x,y)=>y[1].length-x[1].length).slice(0,3).map(m=>m[1]).join(', ')+'.'};
 return {r:'no',msg:'❌ Ainda não. Releia o texto bíblico indicado e tente de novo.'};
}
window.IASDGuia={explain,pick,grade};
})();
