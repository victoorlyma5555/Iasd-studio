process.env.SEQ_LIB='1';
const {player,create,join,waitFor,match,ok,sleep,SH,errs,br,srv,API,PORT}=await import('./seq-e2e.mjs');
const stats=async()=>(await fetch(`http://localhost:${API}/_stats`)).json();
const chaos=b=>fetch(`http://localhost:${API}/_chaos`,{method:'POST',body:JSON.stringify(b)});
let bad=0;const chk=(c,m)=>{ok(c,m);if(!c)bad++};
console.log('2×2');
const n=['Ana','Bruno','Carla','Davi'];const ps=[];for(const x of n)ps.push(await player(x));
const [a,b,c,d]=ps;
const code=await create(a,'2v2');
await join(b,code);await join(c,code);
// iniciar com 3 deve ficar desabilitado
chk(await a.pg.isDisabled('[data-act=start]'),'iniciar bloqueado com 3/4');
await join(d,code);await waitFor(a,s=>s.pub.players.length===4);
await sleep(300);
let s=await a.st();chk(s.pub.players.length===4,'4 jogadores na sala');
const t0=s.pub.players.filter(p=>p.team===0).length;chk(t0===2,'equipes 2×2 (host distribui)');
// quinto jogador deve ser recusado
const e=await player('Eva');await e.open();await e.pg.fill('#cs-name','Eva');await e.pg.fill('#cs-code',code);await e.pg.click('[data-act=join]');await sleep(700);
chk(await e.pg.isVisible('.cs-menu')&&/cheia/.test(await e.pg.textContent('.cs-toast')),'5º jogador recusado: sala cheia');
await a.shot('lobby-2v2');await a.pg.click('[data-act=start]');
await Promise.all(ps.map(p=>waitFor(p,s=>s.pub.status==='playing')));
for(const p of ps){const st=await p.st();p.id=st.me.id;p.team=st.me.team;chk(st.me.hand.length===5,p.name+' mão de 5')}
s=await a.st();const ord=s.pub.order.map(id=>s.pub.players.find(p=>p.id===id).team);
chk(ord.every((t,i)=>i===0||t!==ord[i-1]),'ordem alterna equipes '+ord.join(''));
const hands=await Promise.all(ps.map(async p=>JSON.stringify((await p.st()).me.hand)));
for(const p of ps){const st=await p.st();for(const q of ps)if(q!==p)chk(!JSON.stringify(st.pub).includes(hands[ps.indexOf(q)]),p.name+' não vê mão de '+q.name)}
await sleep(1900);
// duplo clique: duas jogadas seguidas no mesmo turno
const cur=ps.find(p=>p.id===s.pub.turnPlayer);await a.shot('mesa-2v2-a');
// F5 do host no meio e de um jogador
const v0=(await a.st()).pub.v;
await a.pg.reload();await a.pg.evaluate(()=>IASDConstellations.open({}));await a.pg.waitForSelector('[data-act=resume]');await a.pg.click('[data-act=resume]');
chk(!!await waitFor(a,x=>x.pub.status==='playing'&&x.me.host),'host volta ao jogo após F5 (continua anfitrião)');
chk((await a.st()).me.hand.length===5,'host recuperou a mesma mão');
// aba duplicada do mesmo jogador (mesmo storage)
const pg2=await b.ctx.newPage();await pg2.goto(`http://localhost:${PORT}/tests/seq-harness.html?api=${API}`);await pg2.evaluate(()=>IASDConstellations.open({}));await pg2.click('[data-act=resume]');await pg2.waitForSelector('.cs-table');
chk(JSON.stringify(await pg2.evaluate(()=>IASDConstellations._state().view.me.hand))===JSON.stringify((await b.st()).me.hand),'segunda aba do mesmo jogador vê a mesma mão');await pg2.close();
// queda de rede de um jogador e retorno
await chaos({down:true});await sleep(8500);chk(await c.pg.isVisible('.cs-root.offline .cs-netdot'),'indicador de conexão cai');
await chaos({down:false});
// jogada: joga um turno completo e verifica que todos sincronizam
const play=async()=>{const st=await a.st();const who=ps.find(p=>p.id===st.pub.turnPlayer);const v=st.pub.v;const {choose}=await import('./seq-e2e.mjs');const bst=await who.st();const bb=choose(bst);if(!bb){return}
 await who.pg.keyboard.press('Escape');await who.pg.click(`.cs-hc[data-i="${bb.i}"]`);await who.pg.waitForSelector(`.cs-cell.valid[data-i="${bb.j}"]`);await who.pg.click(`.cs-cell[data-i="${bb.j}"]`);await who.pg.dblclick('[data-act=confirm]');return v};
const v1=await play();await Promise.all(ps.map(p=>waitFor(p,x=>x.pub.v>v1,9000)));
const vs=await Promise.all(ps.map(async p=>(await p.st()).pub.v));chk(new Set(vs).size===1&&vs[0]===v1+1,'duplo clique gerou 1 jogada; todos em v'+vs[0]+' (esperado '+(v1+1)+')');
// partida completa
const fin=await match(ps);chk(fin.pub.status==='finished','2×2 terminou, vencedor equipe '+fin.pub.winner);
await sleep(600);const bs=await Promise.all(ps.map(async p=>JSON.stringify((await p.st()).pub.board)));chk(new Set(bs).size===1,'4 clientes com o mesmo tabuleiro');
await a.shot('fim-2v2');
// revanche por qualquer jogador
await c.pg.click('[data-act=again]');await Promise.all(ps.map(p=>waitFor(p,x=>x.pub.status==='playing'&&x.pub.games>fin.pub.games)));
chk((await d.st()).pub.games===fin.pub.games+1,'revanche iniciada (partida '+((await d.st()).pub.games)+')');
// telão
const tv=await player('TV',{width:1280,height:720});await tv.open();await tv.pg.evaluate(()=>{IASDConstellations.close();IASDConstellations.open({telao:new URLSearchParams(location.search).get('x')})}).catch(()=>{});
await tv.pg.evaluate(c=>{IASDConstellations.close();IASDConstellations.open({telao:c})},code);await waitFor(tv,x=>x.pub.status==='playing');
chk(!(await tv.pg.$('#cs-hand')),'telão não mostra mão');chk((await tv.st()).me===undefined||!(await tv.st()).me,'telão sem dados privados');await sleep(2000);await tv.shot('telao');
// vazamentos: sair de todos e checar canais/timers
for(const p of ps){await p.pg.evaluate(()=>IASDConstellations.close());}await tv.pg.evaluate(()=>IASDConstellations.close());
await sleep(500);const st=await stats();const subs=Object.values(st.subs).reduce((x,y)=>x+y,0);chk(subs===0,'nenhum canal realtime aberto após sair ('+subs+')');
for(const p of ps){const t=await p.pg.evaluate(()=>({m:!!document.getElementById('cs-root'),c:window.iasdCloud.channels}));chk(!t.m&&t.c===0,p.name+' sem raiz/canais');}
console.log('erros de página:',errs);chk(errs.length===0,'sem erros de JS');
await br.close();srv.close();console.log(bad?'FALHAS '+bad:'2×2 OK');process.exit(bad?1:0);
