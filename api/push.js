'use strict';
// Vercel Serverless Function: envia notificações push (Web Push) quando nasce um alerta ou uma resposta.
// Variáveis no Vercel (Settings → Environment Variables):
//  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  (par gerado com: npx web-push generate-vapid-keys)
//  SUPABASE_SERVICE_ROLE_KEY            (Supabase → Project Settings → API → service_role)
//  PUSH_WEBHOOK_SECRET (segredo do gatilho do banco: docs/supabase-push-gatilho.sql)
//  SUPABASE_URL (opcional; padrão do projeto)
// GET  /api/push            → {publicKey}
// POST /api/push {alert_id,kind:'alert'|'reply'|'member'} com "Authorization: Bearer <token do usuário>"
const SB=(process.env.SUPABASE_URL||'https://gtsaaixuampeaivugxdm.supabase.co').replace(/\/$/,'');
const TARGET_RE=/⁣@@([0-9a-f-]{36})\|([^⁣]*)⁣/;
const UUID=/^[0-9a-f-]{36}$/i;
function cors(req,res){const o=String(req.headers.origin||'');if(/^https:\/\/(www\.)?iasdapp\.com\.br$/.test(o)||/^https:\/\/iasd-studio[\w-]*\.vercel\.app$/.test(o)){res.setHeader('Access-Control-Allow-Origin',o);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','authorization,content-type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS')}}
async function sb(path,key,opt={}){const r=await fetch(SB+path,{...opt,headers:{apikey:key,...((opt.token||!/^sb_/.test(key))?{Authorization:'Bearer '+(opt.token||key)}:{}),'Content-Type':'application/json',...(opt.headers||{})}});const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch{}return {ok:r.ok,status:r.status,json:j}}
module.exports=async function handler(req,res){
 cors(req,res);res.setHeader('Cache-Control','no-store');
 if(req.method==='OPTIONS')return res.status(204).end();
 const pub=process.env.VAPID_PUBLIC_KEY,priv=process.env.VAPID_PRIVATE_KEY,svc=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(req.method==='GET')return res.status(pub?200:503).json(pub?{publicKey:pub}:{error:'Notificações ainda não configuradas no servidor.'});
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
 if(!pub||!priv||!svc)return res.status(503).json({error:'Notificações ainda não configuradas no servidor.'});
 try{
  const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  const kind=body.kind==='reply'?'reply':body.kind==='member'?'member':'alert',id=String(body.alert_id||'');
  const token=String(req.headers.authorization||'').replace(/^Bearer /,'');
  const secret=process.env.PUSH_WEBHOOK_SECRET,given=String(req.headers['x-push-secret']||'');
  // modo confiável: o gatilho do banco chama com o segredo compartilhado (não depende de nenhum aparelho ou do Projetor)
  const trusted=!!secret&&given.length===secret.length&&require('crypto').timingSafeEqual(Buffer.from(given),Buffer.from(secret));
  if(!UUID.test(id)||(!token&&!trusted))return res.status(400).json({error:'Pedido inválido'});
  let uid=null;
  if(!trusted){const who=await sb('/auth/v1/user',svc,{token});if(!who.ok||!who.json?.id)return res.status(401).json({error:'Sessão inválida'});uid=who.json.id}
  if(kind==='member'){
   const ma=await sb('/rest/v1/iasd_member_alerts?id=eq.'+id+'&select=id,created_by,sender_name,message,target_uid,created_at',svc);
   const m=ma.json&&ma.json[0];if(!m)return res.status(404).json({error:'Alerta não encontrado'});
   if((!trusted&&m.created_by!==uid)||Date.now()-Date.parse(m.created_at)>10*60*1000)return res.status(403).json({error:'Não permitido'});
   let rc=[];
   if(m.target_uid)rc=[m.target_uid];
   else{const r=await sb('/rest/v1/iasd_members?role=in.(founder,cofounder,admin,editor,operator,midia,lider,sonoplasta)&select=user_id',svc);rc=(r.json||[]).map(x=>x.user_id)}
   rc=[...new Set(rc.filter(u=>UUID.test(String(u))&&u!==m.created_by))];
   if(!rc.length)return res.status(200).json({sent:0,devices:0});
   const ss=await sb('/rest/v1/iasd_push_subscriptions?user_id=in.('+rc.join(',')+')&select=id,endpoint,p256dh,auth',svc);
   const ls=ss.json||[],wp=require('web-push');wp.setVapidDetails('mailto:contato@iasdapp.com.br',pub,priv);
   const pl={title:'🔔 Aviso da Sonoplastia',body:(m.sender_name||'Sonoplastia')+': '+String(m.message||'').slice(0,200),tag:'iasd-member-'+m.id,url:'/',sticky:true};
   let n=0;const dd=[];
   await Promise.all(ls.map(async s=>{try{await wp.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},JSON.stringify(pl),{TTL:600,urgency:'high'});n++}catch(e){if(e.statusCode===404||e.statusCode===410)dd.push(s.id)}}));
   if(dd.length)await sb('/rest/v1/iasd_push_subscriptions?id=in.('+dd.join(',')+')',svc,{method:'DELETE'});
   return res.status(200).json({sent:n,devices:ls.length});
  }
  const al=await sb('/rest/v1/iasd_sound_alerts?id=eq.'+id+'&select=id,created_by,sender_name,message,schedule_name,created_at,reply_message,replied_by,replied_by_name,replied_at',svc);
  const a=al.json&&al.json[0];if(!a)return res.status(404).json({error:'Alerta não encontrado'});
  const fresh=iso=>Date.now()-Date.parse(iso)<10*60*1000;
  let recipients=[],payload;
  // Só a RESPOSTA gera notificação, e só para quem enviou o alerta. O alerta em si não notifica ninguém por push.
  if(kind==='alert')return res.status(200).json({sent:0,devices:0,skipped:'alerta não notifica'});
  if(kind==='alert'){
   if((!trusted&&a.created_by!==uid)||!fresh(a.created_at))return res.status(403).json({error:'Não permitido'});
   const t=TARGET_RE.exec(String(a.schedule_name||''));
   if(t)recipients=[t[1]];
   else{const m=await sb('/rest/v1/iasd_members?role=in.(sonoplasta,founder,cofounder)&select=user_id',svc);recipients=(m.json||[]).map(x=>x.user_id)}
   recipients=recipients.filter(u=>u!==a.created_by);
   payload={title:'🔔 Alerta para a Sonoplastia',body:(a.sender_name||'Equipe')+': '+String(a.message||'').slice(0,200),tag:'iasd-alert-'+a.id,url:'/',sticky:true};
  }else{
   if(!a.reply_message||(!trusted&&a.replied_by!==uid)||!fresh(a.replied_at))return res.status(403).json({error:'Não permitido'});
   recipients=[a.created_by];
   payload={title:'↩ '+(a.replied_by_name||'Sonoplastia')+' respondeu',body:String(a.reply_message).slice(0,200),tag:'iasd-reply-'+a.id,url:'/'};
  }
  recipients=[...new Set(recipients.filter(u=>UUID.test(String(u))))];
  if(!recipients.length)return res.status(200).json({sent:0,devices:0});
  const subs=await sb('/rest/v1/iasd_push_subscriptions?user_id=in.('+recipients.join(',')+')&select=id,endpoint,p256dh,auth',svc);
  const list=subs.json||[];
  const webpush=require('web-push');webpush.setVapidDetails('mailto:contato@iasdapp.com.br',pub,priv);
  let sent=0;const dead=[];
  await Promise.all(list.map(async s=>{try{await webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},JSON.stringify(payload),{TTL:600,urgency:'high'});sent++}catch(e){if(e.statusCode===404||e.statusCode===410)dead.push(s.id)}}));
  if(dead.length)await sb('/rest/v1/iasd_push_subscriptions?id=in.('+dead.join(',')+')',svc,{method:'DELETE'});
  return res.status(200).json({sent,devices:list.length});
 }catch(e){return res.status(500).json({error:'Falha ao enviar notificações'})}
};
