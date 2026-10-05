process.env.SEQ_LIB='1';
const {player,create,join,waitFor,ok,sleep,SH,errs,br,srv,choose}=await import('./seq-e2e.mjs');
let bad=0;const chk=(c,m)=>{ok(c,m);if(!c)bad++};
const VPS={'360x640':{width:360,height:640},'390x844':{width:390,height:844},'land':{width:844,height:390},'tablet':{width:820,height:1180},'desk':{width:1366,height:768}};
for(const [k,vp] of Object.entries(VPS)){
 const a=await player('Ana',vp),b=await player('Bruno',vp);const code=await create(a,'1v1');await join(b,code);await waitFor(a,s=>s.pub.players.length===2);
 await a.pg.click('[data-act=start]');await Promise.all([a,b].map(p=>waitFor(p,s=>s.pub.status==='playing')));
 a.id=(await a.st()).me.id;b.id=(await b.st()).me.id;await sleep(1900);
 for(let i=0;i<5;i++){const s=await a.st();const w=[a,b].find(p=>p.id===s.pub.turnPlayer);await waitFor(w,x=>x.pub.v>=s.pub.v&&x.pub.turnPlayer===w.id);const bb=choose(await w.st());await w.pg.keyboard.press('Escape');await w.pg.click(`.cs-hc[data-i="${bb.i}"]`);await w.pg.waitForSelector(`.cs-cell.valid[data-i="${bb.j}"]`);await w.pg.click(`.cs-cell[data-i="${bb.j}"]`);await w.pg.click('[data-act=confirm]');await waitFor(a,x=>x.pub.v>s.pub.v)}
 const s=await a.st();const w=[a,b].find(p=>p.id===s.pub.turnPlayer);await waitFor(w,x=>x.pub.v>=s.pub.v&&x.pub.turnPlayer===w.id);
 const bb=choose(await w.st());await w.pg.keyboard.press('Escape');await w.pg.click(`.cs-hc[data-i="${bb.i}"]`);await sleep(500);
 await w.shot('vp-'+k+'-vez');
 const over=await w.pg.evaluate(()=>{const r=document.querySelector('#cs-root');const t=document.querySelector('.cs-table');return {sw:r.scrollWidth>r.clientWidth+1,hand:(()=>{const h=document.querySelector('#cs-hand').getBoundingClientRect();return h.bottom<=innerHeight+1&&h.left>=-1&&h.right<=innerWidth+1})(),act:(()=>{const h=document.querySelector('#cs-actions').getBoundingClientRect();return h.bottom<=innerHeight+1})()}});
 chk(!over.sw&&over.hand&&over.act,k+': sem rolagem horizontal; mão e ações visíveis '+JSON.stringify(over));
 await a.ctx.close();await b.ctx.close();
}
chk(errs.length===0,'sem erros de JS '+errs.join('|'));
await br.close();srv.close();process.exit(bad?1:0);
