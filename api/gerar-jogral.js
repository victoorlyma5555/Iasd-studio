'use strict';
// Vercel Serverless Function. A chave Gemini fica apenas no ambiente do servidor.
const SUPABASE_URL='https://gtsaaixuampeaivugxdm.supabase.co';
const SUPABASE_KEY='sb_publishable_0nIK7568ulLb9JN0ctyiug_wHWDV7Qf';
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Método não permitido.'})}
 const key=process.env.GEMINI_API_KEY;
 if(!key)return res.status(503).json({error:'A IA ainda não foi ativada. Configure GEMINI_API_KEY nas variáveis do Vercel.'});
 const auth=String(req.headers.authorization||'');
 if(!/^Bearer [\w.-]+$/.test(auth))return res.status(401).json({error:'Entre na sua conta para gerar um jogral.'});
 try{
  const userResponse=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:auth}});
  if(!userResponse.ok)return res.status(401).json({error:'Sua sessão expirou. Entre novamente.'});
  const user=await userResponse.json();
  if(!user.id)return res.status(401).json({error:'Conta não identificada.'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const clean=(value,max=120)=>String(value||'').trim().slice(0,max);
  const tema=clean(body.tema,120),ocasiao=clean(body.ocasiao,70),estilo=clean(body.estilo,60),duracao=clean(body.duracao,30),referencia=clean(body.referencia,100);
  const pessoas=Number(body.pessoas);
  if(!tema||!Number.isInteger(pessoas)||pessoas<2||pessoas>30)return res.status(400).json({error:'Informe um tema e entre 2 e 30 participantes.'});
  const prompt=`Crie um jogral ORIGINAL em português brasileiro para igreja cristã adventista, pronto para ensaio. Tema: ${tema}. Ocasião: ${ocasiao}. Participantes: ${pessoas}. Duração aproximada: ${duracao}. Estilo: ${estilo}. Referência sugerida: ${referencia||'escolha referências bíblicas pertinentes'}. Distribua falas equilibradas identificadas PARTICIPANTE 1 até PARTICIPANTE ${pessoas}, inclua falas de TODOS, abertura e encerramento emocionantes, pausas e instruções discretas de apresentação. Não invente citações bíblicas nem reproduza versículos completos: apresente apenas referências bíblicas e indique que o texto deve ser conferido na Bíblia antes do culto. Evite doutrinas não solicitadas. Responda somente com o roteiro completo, título e instruções, sem introdução de assistente.`;
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),26000);
  let response;
  try{response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.85,maxOutputTokens:3800}}),signal:controller.signal})}finally{clearTimeout(timeout)}
  const result=await response.json();
  if(!response.ok){const exhausted=response.status===429;return res.status(exhausted?429:502).json({error:exhausted?'Limite gratuito da IA atingido. Tente novamente mais tarde.':'A IA não respondeu. Verifique a chave e o modelo configurados.'})}
  const text=(result.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();
  if(!text)return res.status(502).json({error:'A IA não retornou um roteiro. Tente novamente.'});
  return res.status(200).json({text:text.slice(0,28000)});
 }catch(e){return res.status(500).json({error:e.name==='AbortError'?'A IA demorou a responder. Tente novamente.':'Não foi possível gerar o roteiro agora.'})}
};
