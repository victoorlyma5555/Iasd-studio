// E2E multi-cliente das Constelações. Uso: node tests/seq-e2e.mjs  (Postgres local + seq-test-server em 4890)
import {serve,chromium} from '/tmp/claude-0/-home-claude/6a2a0ee4-7c6d-5261-9e02-3c1ae83ee384/scratchpad/t/harness.mjs';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SH='/tmp/claude-0/-home-claude/6a2a0ee4-7c6d-5261-9e02-3c1ae83ee384/scratchpad/s/';
const PORT=4891,API=4890;let fails=0;
const ok=(c,m)=>{console.log((c?'  ok  ':' FAIL ')+m);if(!c)fails++};
const srv=await serve(ROOT,PORT);
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const errs=[];
async function player(name,vp={width:390,height:844}){
  const ctx=await br.newContext({viewport:vp,hasTouch:vp.width<900,isMobile:vp.width<900});const pg=await ctx.newPage();
  pg.on('pageerror',e=>errs.push(name+': '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load resource/.test(m.text()))errs.push(name+' console: '+m.text())});
  const P={name,ctx,pg,
   async open(q=''){await pg.goto(`http://localhost:${PORT}/tests/seq-harness.html?api=${API}${q}`);await pg.evaluate(()=>IASDConstellations.open({code:new URLSearchParams(location.search).get('seq')||''}));await pg.waitForSelector('#cs-root');},
   st:()=>pg.evaluate(()=>{const s=IASDConstellations._state&&IASDConstellations._state();return s&&s.view?{pub:s.view.pub,me:s.view.me,screen:s.screen,v:s.v}:null}),
   async shot(n){await pg.screenshot({path:SH+n+'.png'})}};
  await pg.addInitScript(()=>{});return P;
}
async function create(p,mode){await p.open();await p.pg.fill('#cs-name',p.name);await p.pg.click(`[data-act=mode][data-m="${mode}"]`);await p.pg.click('[data-act=create]');await p.pg.waitForSelector('.cs-lobby');return (await p.pg.textContent('#cs-codeTxt')).trim()}
async function join(p,code){await p.open();await p.pg.fill('#cs-name',p.name);await p.pg.fill('#cs-code',code);await p.pg.click('[data-act=join]');await p.pg.waitForSelector('.cs-lobby')}
async function waitFor(p,fn,t=8000){const t0=Date.now();while(Date.now()-t0<t){const s=await p.st();if(s&&fn(s))return s;await sleep(100)}return null}
const LINES=(()=>{const L=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){const cells=[];for(let k=0;k<5;k++){const rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>7||cc<0||cc>7){cells.length=0;break}cells.push(rr*8+cc)}if(cells.length)L.push(cells)}return L})();
function choose(s){ // heurística gulosa: ignora Remover/coringa se houver carta normal boa
  const {pub,me}=s;let best=null;
  me.hand.forEach((c,i)=>{const valid=pub.board.map((b,j)=>[b,j]).filter(([b,j])=>{const own=b[1];if(c===33)return own!==-1&&own!==me.team&&!pub.lines.some(l=>l.c.includes(j));if(c===32)return own===-1;return b[0]===c&&own===-1}).map(([,j])=>j);
    valid.forEach(j=>{let sc=c===33?1:0;LINES.forEach(l=>{if(!l.includes(j))return;const mine=l.filter(x=>pub.board[x][1]===me.team).length,opp=l.filter(x=>pub.board[x][1]===1-me.team).length;if(c<32&&!opp)sc+=mine*mine+1;if(c<32&&!mine)sc+=opp*opp*.9});if(c===32)sc+=.5;if(!best||sc>best.sc)best={sc,i,j}})});
  return best;
}
async function playTurn(p){ // por interface: carta -> casa -> casa (confirma)
  const s=await p.st();const b=choose(s);
  if(!b){const dead=s.me.hand.findIndex(c=>{return true});await p.pg.click('[data-act=swapany],[data-act=pass]').catch(()=>{});return 'swap'}
  await p.pg.keyboard.press('Escape');await p.pg.click(`.cs-hc[data-i="${b.i}"]`);await p.pg.waitForSelector(`.cs-cell.valid[data-i="${b.j}"]`);await p.pg.click(`.cs-cell[data-i="${b.j}"]`);await p.pg.click('[data-act=confirm]');return 'play';
}
async function match(ps,{log=false}={}){ // joga até terminar
  for(let n=0;n<300;n++){
    const s=await ps[0].st();if(s.pub.status==='finished')return s;
    const cur=ps.find(p=>p.id===s.pub.turnPlayer);if(!cur){await sleep(100);continue}
    const v=s.pub.v;if(!await waitFor(cur,x=>x.pub.v>=v&&x.pub.turnPlayer===cur.id,8000)){console.log('cliente da vez não sincronizou');break}await sleep(60);await playTurn(cur);
    await waitFor(ps[0],x=>x.pub.v>v||x.pub.status==='finished',6000);
  }
  return await ps[0].st();
}
export {player,create,join,waitFor,match,ok,sleep,SH,errs,br,srv,API,PORT,choose,fails as _f};
if(process.argv[1].endsWith('seq-e2e.mjs')&&!process.env.SEQ_LIB){
 // ---------- 1×1 ----------
 console.log('1×1');
 const a=await player('Ana'),b=await player('Bruno');
 const code=await create(a,'1v1');ok(/^\d{6}$/.test(code),'código de 6 dígitos '+code);
 await a.shot('lobby-host');
 await join(b,code);await waitFor(a,s=>s.pub.players.length===2);
 ok((await a.st()).pub.players.length===2,'host vê 2 jogadores');
 await b.shot('lobby-guest');
 await a.pg.click('[data-act=start]');
 const sa=await waitFor(a,s=>s.pub.status==='playing'),sb=await waitFor(b,s=>s.pub.status==='playing');
 ok(sa&&sb,'ambos entraram na mesa');
 ok(sa.me.hand.length===6&&sb.me.hand.length===6,'mãos de 6 cartas');
 ok(JSON.stringify(sa.me.hand)!==JSON.stringify(sb.me.hand),'mãos diferentes');
 ok(!JSON.stringify(sa.pub).includes(JSON.stringify(sb.me.hand)),'estado público não traz a mão do outro');
 await sleep(2000);
 const firstP=(await a.st()).pub.turnPlayer;a.id=sa.me.id;b.id=sb.me.id;
 const mover=firstP===a.id?a:b,other=mover===a?b:a;
 await mover.pg.click('.cs-hc[data-i="0"]');await mover.shot('mesa-selecao');
 await other.shot('mesa-espera');
 // jogada fora de turno é bloqueada pela UI
 await other.pg.click('.cs-hc[data-i="0"]',{force:true});ok((await other.pg.$$('.cs-cell.valid')).length===0,'quem não é da vez não vê casas válidas');
 const fin=await match([a,b]);
 ok(fin.pub.status==='finished'&&(fin.pub.winner===0||fin.pub.winner===1||fin.pub.winner===-1),'partida terminou, vencedor '+fin.pub.winner);
 await sleep(500);await a.shot('fim-a');await b.shot('fim-b');
 const [fa,fb]=[await a.st(),await b.st()];ok(JSON.stringify(fa.pub.board)===JSON.stringify(fb.pub.board),'tabuleiros iguais nos dois clientes');
 console.log('erros de página:',errs);ok(errs.length===0,'sem erros de JS');
 await br.close();srv.close();console.log(fails?'FALHAS: '+fails:'1×1 OK');process.exit(fails?1:0);
}
