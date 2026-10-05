// Servidor de teste das Constelações: expõe /rest/v1/rpc/<nome> (como o PostgREST do Supabase) executando
// as MESMAS funções SQL de docs/supabase-sequencia.sql num Postgres local, e um canal tipo Realtime (SSE).
// Uso: node tests/seq-test-server.mjs [porta]   (variáveis: PGHOST=/caminho/socket PGPORT=5544)
import http from 'node:http';
import {spawn} from 'node:child_process';

const PORT=Number(process.argv[2]||process.env.SEQ_PORT||4890);
const PGHOST=process.env.PGHOST||'/var/tmp/seqpg',PGPORT=process.env.PGPORT||'5544';
const ALLOWED=new Set(['seq_create_room','seq_join_room','seq_state','seq_watch','seq_set_mode','seq_assign','seq_swap_teams','seq_remove','seq_leave','seq_start','seq_set_timer','seq_move']);
const stats={rpc:{},subs:{},sent:0,errors:0};
let chaos={down:false,delay:0};
const chans=new Map();

const lit=v=>v===null||v===undefined?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
function psql(sql){return new Promise((res,rej)=>{
  const p=spawn('psql',['-h',PGHOST,'-p',PGPORT,'-U','postgres','-tAq','-v','ON_ERROR_STOP=1','-c',sql]);
  let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);
  p.on('close',code=>code===0?res(out.trim()):rej(Error(err.replace(/^ERROR:\s+/m,'').split('\n')[0].trim())));
})}
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Max-Age':'600'};
const body=req=>new Promise(r=>{let b='';req.on('data',d=>b+=d);req.on('end',()=>r(b))});

http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://x');
  if(req.method==='OPTIONS'){res.writeHead(204,cors);return res.end()}
  if(u.pathname==='/_stats'){res.writeHead(200,{...cors,'content-type':'application/json'});const subs={};chans.forEach((s,k)=>subs[k]=s.size);return res.end(JSON.stringify({...stats,subs}))}
  if(u.pathname==='/_chaos'&&req.method==='POST'){chaos={down:false,delay:0,...JSON.parse(await body(req)||'{}')};res.writeHead(200,cors);return res.end('ok')}
  if(u.pathname==='/_reset'){stats.rpc={};stats.sent=0;stats.errors=0;res.writeHead(200,cors);return res.end('ok')}
  if(u.pathname==='/rt'){
    const ch=u.searchParams.get('ch')||'';
    if(req.method==='GET'){
      res.writeHead(200,{...cors,'content-type':'text/event-stream','cache-control':'no-cache',connection:'keep-alive'});res.write(': ok\n\n');
      const cid=u.searchParams.get('cid')||'';const c={res,cid};
      if(!chans.has(ch))chans.set(ch,new Set());chans.get(ch).add(c);
      const hb=setInterval(()=>res.write(': hb\n\n'),15000);
      req.on('close',()=>{clearInterval(hb);chans.get(ch)?.delete(c)});return;
    }
    const msg=await body(req);const cid=u.searchParams.get('cid')||'';stats.sent++;
    if(!chaos.down)chans.get(ch)?.forEach(c=>{if(c.cid!==cid)c.res.write('data: '+msg+'\n\n')});
    res.writeHead(204,cors);return res.end();
  }
  const m=u.pathname.match(/^\/rest\/v1\/rpc\/([a-z_]+)$/);
  if(m&&req.method==='POST'){
    const name=m[1];
    if(chaos.down){res.writeHead(503,{...cors,'content-type':'application/json'});return res.end(JSON.stringify({message:'offline'}))}
    if(chaos.delay)await new Promise(r=>setTimeout(r,chaos.delay));
    if(!ALLOWED.has(name)){res.writeHead(404,{...cors,'content-type':'application/json'});return res.end(JSON.stringify({message:'not found'}))}
    stats.rpc[name]=(stats.rpc[name]||0)+1;
    try{
      const args=JSON.parse(await body(req)||'{}');
      const a=Object.entries(args).map(([k,v])=>k+' => '+lit(v)).join(', ');
      const out=await psql('select public.'+name+'('+a+')');
      res.writeHead(200,{...cors,'content-type':'application/json'});return res.end(out||'null');
    }catch(e){stats.errors++;res.writeHead(400,{...cors,'content-type':'application/json'});return res.end(JSON.stringify({code:'P0001',message:String(e.message||e)}))}
  }
  res.writeHead(404,cors);res.end('nope');
}).listen(PORT,()=>console.log('seq-test-server em http://localhost:'+PORT));
