/* Jogo Coletivo — presença: registra quem joga (logado) e mostra para a liderança quem é frequente e quem veio pela primeira vez. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const user=()=>{try{return typeof window.iasdCurrentUser==='function'?window.iasdCurrentUser():null}catch(e){return null}};
const LEAD=['founder','cofounder','admin','editor','operator','midia','lider','sonoplasta'];
const role=()=>{try{return cloudRole}catch(e){return null}};
const S={days:90,tab:'freq',rows:null,err:'',busy:false};
const API={
 canSee(){return !!user()&&LEAD.includes(role())},
 async log(kind,name,code){
  const c=window.iasdCloud,u=user();if(!c||!u)return;
  try{await c.from('iasd_live_attendance').insert({user_id:u.id,name:String(name||'').replace(/[​]/g,'').slice(0,60),room_code:String(code||'').slice(0,12),kind:kind==='host'?'host':'player'})}catch(e){console.warn('presença:',e)}
 },
 async open(){S.rows=null;S.err='';paint();await load()},
 days(n){S.days=n;API.open()},
 tab(t){S.tab=t;paint()}
};
async function load(){
 const c=window.iasdCloud;if(!c)return;
 try{const r=await c.rpc('live_presence_summary',{p_days:S.days});if(r.error)throw r.error;S.rows=r.data||[]}
 catch(e){S.err=/function|does not exist|schema cache/i.test(e.message||'')?'Falta rodar o SQL docs/supabase-jogo-presenca.sql no Supabase.':(/permiss/i.test(e.message||'')?'Seu cargo não tem acesso a este painel.':'Não foi possível carregar agora.');S.rows=[]}
 paint();
}
function ago(d){const n=Math.floor((Date.now()-new Date(d))/864e5);return n<=0?'hoje':n===1?'ontem':'há '+n+' dias'}
function paint(){
 let ov=document.getElementById('lp-ov');
 if(!ov){ov=document.createElement('div');ov.id='lp-ov';ov.className='bp-ov';ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('.bp-x'))ov.remove()});document.body.appendChild(ov)}
 const rows=S.rows,cut=Date.now()-30*864e5;
 const freq=(rows||[]).filter(r=>r.days>=3),firsts=(rows||[]).filter(r=>new Date(r.first_seen).getTime()>=cut);
 const list=S.tab==='freq'?freq:S.tab==='new'?firsts.slice().sort((a,b)=>new Date(b.first_seen)-new Date(a.first_seen)):rows||[];
 let body='<div class="lp-sum"><div><b>'+(rows?rows.length:'…')+'</b><small>jogaram</small></div><div><b>'+(rows?freq.length:'…')+'</b><small>frequentes</small></div><div><b>'+(rows?firsts.length:'…')+'</b><small>novos (30 dias)</small></div></div>'
  +'<div class="lp-per">'+[30,90,365].map(n=>'<button class="'+(S.days===n?'on':'')+'" onclick="IASDLivePresence.days('+n+')">'+(n===365?'1 ano':n+' dias')+'</button>').join('')+'</div>'
  +'<div class="lp-tabs">'+[['freq','Frequentes'],['new','Primeira vez'],['all','Todos']].map(([k,l])=>'<button class="'+(S.tab===k?'on':'')+'" onclick="IASDLivePresence.tab(\''+k+'\')">'+l+'</button>').join('')+'</div>';
 if(S.err)body+='<p class="bp-empty">'+esc(S.err)+'</p>';
 else if(!rows)body+='<p class="bp-empty">Carregando…</p>';
 else if(!list.length)body+='<p class="bp-empty">'+(S.tab==='freq'?'Ninguém com 3 ou mais dias de jogo neste período ainda.':S.tab==='new'?'Nenhuma pessoa nova nos últimos 30 dias.':'Ainda não há registros.')+'</p>';
 else body+='<div class="bp-list">'+list.map(r=>'<div class="lp-r"><span class="lp-av">'+esc((r.name||'?').trim().charAt(0).toUpperCase())+'</span><div><b>'+esc(r.name)+'</b><small>'+(S.tab==='new'?'1ª vez '+ago(r.first_seen):'Última vez '+ago(r.last_seen))+'</small></div><span class="lp-n"><b>'+r.days+'</b><small>'+(r.days===1?'dia':'dias')+'</small></span></div>').join('')+'</div>';
 body+='<small class="bp-hint">Conta só quem entrou na sala logado no IASD APP. Frequente = jogou em 3 ou mais dias diferentes no período.</small>';
 ov.innerHTML='<div class="bp-sh"><div class="bp-hd"><h3>👥 Presença no Jogo Coletivo</h3><button class="bp-x" aria-label="Fechar">✕</button></div><div class="bp-bd">'+body+'</div></div>';
}
window.IASDLivePresence=API;
const st=document.createElement('style');st.textContent=
'.lp-sum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lp-sum div{display:grid;justify-items:center;padding:10px 4px;border-radius:14px;background:rgba(255,255,255,.06)}.lp-sum b{font-size:24px}.lp-sum small{font-size:11px;opacity:.7}'
+'.lp-per,.lp-tabs{display:flex;gap:6px}.lp-per button,.lp-tabs button{flex:1;padding:9px 6px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:transparent;color:inherit;font-weight:700;cursor:pointer}.lp-per button.on,.lp-tabs button.on{background:#f5b73a;color:#241a00;border-color:transparent}.lp-per button{font-size:12px;padding:6px}'
+'.lp-r{display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05)}.lp-r>div{flex:1;min-width:0;display:grid}.lp-r b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lp-r small{opacity:.65;font-size:12px}.lp-av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#2563eb,#22c55e);font-weight:800}.lp-n{text-align:center}.lp-n b{font-size:20px;display:block}';
document.head.appendChild(st);
})();
