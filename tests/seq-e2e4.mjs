process.env.SEQ_LIB='1';
const {player,create,join,waitFor,ok,sleep,SH,br,srv}=await import('./seq-e2e.mjs');
const vp={width:360,height:640};const a=await player('Ana',vp),b=await player('Bruno',vp);
await a.open();await a.shot('mob-menu');
const code=await create(a,'2v2');await a.shot('mob-lobby');
const sc=await a.pg.evaluate(()=>{const s=document.querySelector('.cs-screen');return {sw:s.scrollWidth>s.clientWidth+1,sh:s.scrollHeight,ch:s.clientHeight}});console.log(JSON.stringify(sc));
await br.close();srv.close();
