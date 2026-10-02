'use strict';
// Vercel Serverless Function. A chave Gemini fica apenas no ambiente do servidor (GEMINI_API_KEY).
// GET  → {ready:boolean}  (a tela usa para mostrar se a IA está ligada)
// POST → {text}           (precisa de "Authorization: Bearer <token do usuário>")
const SUPABASE_URL='https://gtsaaixuampeaivugxdm.supabase.co';
const SUPABASE_KEY='sb_publishable_0nIK7568ulLb9JN0ctyiug_wHWDV7Qf';
const MODELS=['gemini-2.5-flash-lite','gemini-2.5-flash'];
const recent=new Map(); // limite simples por usuário (por instância): 8 roteiros a cada 10 minutos
function limited(id){const now=Date.now(),list=(recent.get(id)||[]).filter(t=>now-t<600000);if(list.length>=8){recent.set(id,list);return true}list.push(now);recent.set(id,list);return false}
const clean=(value,max=120)=>String(value||'').replace(/[\u0000-\u001f]+/g,' ').trim().slice(0,max);
async function callGemini(model,key,prompt,signal){
 return fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},
  body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.9,topP:0.95,maxOutputTokens:4096}})});
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const key=process.env.GEMINI_API_KEY;
 if(req.method==='GET')return res.status(200).json({ready:!!key});
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Método não permitido.'})}
 if(!key)return res.status(503).json({code:'no_key',error:'A IA ainda não foi ativada pelo administrador do site.'});
 const auth=String(req.headers.authorization||'');
 if(!/^Bearer [\w.-]+$/.test(auth))return res.status(401).json({error:'Entre na sua conta para gerar um jogral.'});
 try{
  const userResponse=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:auth}});
  if(!userResponse.ok)return res.status(401).json({error:'Sua sessão expirou. Entre novamente.'});
  const user=await userResponse.json();
  if(!user.id)return res.status(401).json({error:'Conta não identificada.'});
  if(limited(user.id))return res.status(429).json({error:'Você já gerou vários roteiros agora há pouco. Aguarde alguns minutos.'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const tema=clean(body.tema,120),ocasiao=clean(body.ocasiao,70),estilo=clean(body.estilo,60),duracao=clean(body.duracao,30),referencia=clean(body.referencia,100),detalhes=clean(body.detalhes,400);
  const pessoas=Number(body.pessoas);
  if(!tema||!Number.isInteger(pessoas)||pessoas<2||pessoas>30)return res.status(400).json({error:'Informe um tema e entre 2 e 30 participantes.'});
  const nomes=(Array.isArray(body.nomes)?body.nomes:[]).map(n=>clean(n,30).replace(/[:\[\]]/g,'')).filter(Boolean).slice(0,pessoas);
  const papeis=Array.from({length:pessoas},(_,i)=>(nomes[i]||('PARTICIPANTE '+(i+1))).toUpperCase());
  const prompt=`Você escreve jograis para igrejas cristãs adventistas. Crie um jogral ORIGINAL em português brasileiro, pronto para ensaiar.

DADOS
- Tema: ${tema}
- Ocasião: ${ocasiao||'culto'}
- Duração aproximada: ${duracao||'5 minutos'} (cerca de 12 a 18 palavras por fala; ajuste o número de falas à duração)
- Estilo: ${estilo||'Emocionante'}
- Referência bíblica sugerida: ${referencia||'escolha referências pertinentes'}
- Participantes (${pessoas}), use exatamente estes rótulos: ${papeis.join(', ')} e também TODOS (coro)${detalhes?'\n- Observações do organizador: '+detalhes:''}

FORMATO OBRIGATÓRIO (somente texto simples, sem markdown, sem asteriscos)
1ª linha: JOGRAL — TÍTULO EM MAIÚSCULAS
2ª linha: uma linha curta com ocasião, duração e número de participantes
Depois uma linha em branco e o roteiro, uma fala por linha, assim: RÓTULO: fala
Instruções de cena ficam sozinhas em uma linha entre colchetes, ex.: [música suave; todos em semicírculo]
Use falas de TODOS na abertura, no meio e no final.

REGRAS
- Distribua as falas de forma equilibrada entre os participantes; ninguém fica sem falar.
- Abertura e encerramento marcantes; inclua pelo menos duas pausas ou momentos de silêncio indicados.
- Não escreva versículos completos nem invente citações: cite apenas a referência (ex.: João 14:1–3) e indique entre colchetes que o texto deve ser lido da Bíblia e conferido antes do culto.
- Não invente doutrinas nem cite autores; mantenha-se fiel ao tema e ao ensino bíblico.
- Responda somente com o roteiro, sem introdução, sem explicações e sem comentários finais.`;
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),50000);
  let response,result,lastStatus=0;
  try{
   for(const model of MODELS){
    response=await callGemini(model,key,prompt,controller.signal);lastStatus=response.status;
    if(response.ok){result=await response.json();break}
    if(response.status===429||response.status===400||response.status===401||response.status===403)break; // outro modelo não resolve
   }
  }finally{clearTimeout(timeout)}
  if(!result){
   const exhausted=lastStatus===429,badKey=lastStatus===400||lastStatus===401||lastStatus===403;
   return res.status(exhausted?429:502).json({code:badKey?'bad_key':undefined,error:exhausted?'Limite gratuito da IA atingido. Tente novamente em alguns minutos.':badKey?'A chave da IA parece inválida. Avise o administrador.':'A IA não respondeu agora. Tente novamente.'});
  }
  const cand=result.candidates&&result.candidates[0];
  const text=((cand&&cand.content&&cand.content.parts)||[]).map(p=>p.text||'').join('').replace(/\*\*/g,'').replace(/^#+\s*/gm,'').trim();
  if(!text)return res.status(502).json({error:cand&&cand.finishReason==='SAFETY'?'A IA recusou este tema. Mude o tema e tente de novo.':'A IA não retornou um roteiro. Tente novamente.'});
  return res.status(200).json({text:text.slice(0,28000),truncated:!!(cand&&cand.finishReason==='MAX_TOKENS')});
 }catch(e){return res.status(500).json({error:e.name==='AbortError'?'A IA demorou a responder. Tente novamente.':'Não foi possível gerar o roteiro agora.'})}
};
