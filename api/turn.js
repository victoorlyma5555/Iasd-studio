'use strict';
// Vercel Serverless Function: devolve servidores TURN para a voz/vídeo da Sala de Estudo funcionar entre redes diferentes (4G ↔ Wi-Fi).
// Configure UM destes no Vercel (Settings → Environment Variables):
//  • Metered:    METERED_DOMAIN (ex.: seuapp.metered.live) + METERED_API_KEY
//     ou, mais simples: METERED_TURN_USER + METERED_TURN_PASS (usuário e senha da credencial)
//  • Cloudflare: CF_TURN_KEY_ID + CF_TURN_API_TOKEN
// Sem nenhuma configuração, usa o relé público de teste (pode ser instável).
const FALLBACK=[
 {urls:'stun:stun.relay.metered.ca:80'},
 {urls:['turn:global.relay.metered.ca:80','turn:global.relay.metered.ca:80?transport=tcp','turn:global.relay.metered.ca:443','turns:global.relay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'},
 {urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turns:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}
];
async function withTimeout(url,opt,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{return await fetch(url,{...opt,signal:c.signal})}finally{clearTimeout(t)}}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');return res.status(405).end()}
 try{
  const md=process.env.METERED_DOMAIN,mk=process.env.METERED_API_KEY;
  if(md&&mk&&/^[\w.-]+$/.test(md)){
   const r=await withTimeout('https://'+md+'/api/v1/turn/credentials?apiKey='+encodeURIComponent(mk),{},5000);
   if(r.ok){const j=await r.json();if(Array.isArray(j)&&j.length)return res.status(200).json({iceServers:j,source:'metered'})}
  }
  const tu=process.env.METERED_TURN_USER,tp=process.env.METERED_TURN_PASS;
  if(tu&&tp)return res.status(200).json({iceServers:[
   {urls:'stun:stun.relay.metered.ca:80'},
   {urls:['turn:global.relay.metered.ca:80','turn:global.relay.metered.ca:80?transport=tcp','turn:global.relay.metered.ca:443','turns:global.relay.metered.ca:443?transport=tcp'],username:tu,credential:tp}
  ],source:'metered-user'});
  const cid=process.env.CF_TURN_KEY_ID,ct=process.env.CF_TURN_API_TOKEN;
  if(cid&&ct&&/^[\w-]+$/.test(cid)){
   const r=await withTimeout('https://rtc.live.cloudflare.com/v1/turn/keys/'+cid+'/credentials/generate-ice-servers',{method:'POST',headers:{Authorization:'Bearer '+ct,'Content-Type':'application/json'},body:JSON.stringify({ttl:3600})},5000);
   if(r.ok){const j=await r.json();const list=Array.isArray(j.iceServers)?j.iceServers:(j.iceServers?[j.iceServers]:[]);if(list.length)return res.status(200).json({iceServers:list,source:'cloudflare'})}
  }
 }catch(e){}
 return res.status(200).json({iceServers:FALLBACK,source:'public'});
};
