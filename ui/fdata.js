/* IASD APP · Central de Dados do Fundador.
   Ver, pesquisar, criar, editar, duplicar, mover, excluir (um ou vários) e exportar backup de
   qualquer tabela do site. Só aparece no Painel do Fundador. Precisa de docs/supabase-fundador-total.sql. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const short=(v,n=70)=>{v=v==null?'':typeof v==='object'?JSON.stringify(v):String(v);return v.length>n?v.slice(0,n)+'…':v};
const T=[
 {k:'iasd_schedules',n:'Cronogramas',e:'🗓️',t:r=>r.name,s:r=>[r.service_date,(r.items||[]).length+' itens'].filter(Boolean).join(' · '),o:'service_date'},
 {k:'iasd_sound_alerts',n:'Alertas da sonoplastia',e:'🔔',t:r=>r.message||r.title,s:r=>[r.status,r.created_at&&new Date(r.created_at).toLocaleString('pt-BR')].filter(Boolean).join(' · '),o:'created_at'},
 {k:'iasd_custom_tabs',n:'Abas personalizadas',e:'🧩',t:r=>(r.icon||'')+' '+r.title,s:r=>r.description,o:'sort_order',asc:true,move:'sort_order'},
 {k:'iasd_site_content',n:'Textos do site',e:'✏️',t:r=>r.key||r.id,s:r=>short(r.value||r.content||r.text,80),o:'updated_at'},
 {k:'iasd_site_assets',n:'Imagens e banners',e:'🖼️',t:r=>r.slot||r.key||r.id,s:r=>short(r.path||r.url,80),o:'updated_at'},
 {k:'iasd_asset_framing',n:'Enquadramento de imagens',e:'🎯',t:r=>r.slot||r.key||r.id,s:r=>'',o:'updated_at'},
 {k:'iasd_offering_videos',n:'Vídeos de oferta',e:'🎬',t:r=>r.title||r.name||r.id,s:r=>short(r.url||r.video_url,80),o:'created_at'},
 {k:'iasd_game_stats',n:'Jogos · pontos totais',e:'🏆',t:r=>r.user_id,s:r=>'Pontos: '+(r.score??0)+' · acertos '+(r.correct_answers??0)+'/'+(r.total_answers??0),o:'score'},
 {k:'iasd_game_daily',n:'Jogos · desafios do dia',e:'⚡',t:r=>r.game+' · '+r.day,s:r=>'Pontos: '+(r.score??0)+' · usuário '+short(r.user_id,8),o:'day'},
 {k:'iasd_members',n:'Cargos (permissões)',e:'🛡️',t:r=>r.user_id,s:r=>r.role,o:'created_at',danger:true},
 {k:'iasd_profiles',n:'Perfis dos usuários',e:'👤',t:r=>r.full_name||r.user_id,s:r=>[r.church_position,r.phone].filter(Boolean).join(' · '),o:'created_at',danger:true},
 {k:'iasd_site_theme',n:'Tema do site',e:'🎨',t:r=>r.key||r.id,s:r=>short(r.value||r.theme,80),o:'updated_at',danger:true}
];
const PAGE=50;
const D={k:T[0].k,rows:{},more:{},loading:false,q:'',sel:new Set(),err:'',loaded:{}};
const cfg=()=>T.find(x=>x.k===D.k);
const db=()=>typeof cloud!=='undefined'?cloud:null;
const pk=r=>r.id!==undefined?'id':(r.user_id!==undefined?'user_id':Object.keys(r)[0]);
const rid=r=>r[pk(r)];
const css=()=>{if(document.getElementById('fdata-css'))return;const s=document.createElement('style');s.id='fdata-css';s.textContent=`
.fdx{margin-top:26px}.fdx h2{margin:0 0 4px}.fdx .muted{opacity:.75;font-size:14px;margin:0 0 14px}
.fdx-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.fdx-tabs button{border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf,#fff);color:var(--iu-tx,#0f1c3a);border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}
.fdx-tabs button.on{background:linear-gradient(135deg,#f8c14f,#e38a10);color:#1c1406;border-color:transparent}
.fdx-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
.fdx-bar input[type=search]{flex:1 1 220px;min-width:0;padding:10px 12px;border-radius:12px;border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf,#fff);color:inherit;font:inherit}
.fdx-b{border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf,#fff);color:inherit;border-radius:12px;padding:9px 13px;font:inherit;font-weight:700;cursor:pointer}
.fdx-b.pri{background:var(--iu-pr,#2563eb);color:#fff;border-color:transparent}.fdx-b.dan{background:#fee2e2;color:#b91c1c;border-color:#fca5a5}.fdx-b:disabled{opacity:.45;cursor:default}
.fdx-warn{padding:10px 14px;border-radius:12px;background:#fef3c7;color:#78350f;font-size:14px;margin-bottom:10px}
.fdx-list{display:grid;gap:8px}
.fdm{width:100%;border-collapse:collapse;font-size:13.5px}.fdm th,.fdm td{padding:9px 10px;border-bottom:1px solid var(--iu-bd,#b4c3dc);text-align:center}.fdm th{font-size:12px;opacity:.75;position:sticky;top:0}.fdm th:first-child,.fdm td:first-child{text-align:left;min-width:230px}
.fdm td small{display:block;opacity:.6}.fdm .y{color:#16a34a;font-weight:900}.fdm .n{opacity:.3}.fdm .cnt td{background:var(--iu-sf2,#edf1f9)}
.fdx-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf,#fff)}
.fdx-row.sel{outline:2px solid var(--iu-pr,#2563eb)}.fdx-row input[type=checkbox]{width:18px;height:18px;flex:none}
.fdx-tx{flex:1;min-width:0}.fdx-tx b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fdx-tx small{display:block;opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fdx-act{display:flex;gap:6px;flex:none;flex-wrap:wrap;justify-content:flex-end}.fdx-act .fdx-b{padding:7px 10px;font-size:13px}
.fdx-empty{padding:22px;text-align:center;opacity:.7;border:1px dashed var(--iu-bd,#b4c3dc);border-radius:14px}
.fdx-ov{position:fixed;inset:0;z-index:9990;background:rgba(3,8,20,.66);display:grid;place-items:center;padding:14px}
.fdx-md{width:min(720px,100%);max-height:92vh;overflow:auto;background:var(--iu-sf,#fff);color:var(--iu-tx,#0f1c3a);border-radius:20px;padding:20px;border:1px solid var(--iu-bd,#b4c3dc);display:grid;gap:12px}
.fdx-md h3{margin:0}.fdx-f{display:grid;gap:4px}.fdx-f label{font-size:12px;font-weight:800;opacity:.7;letter-spacing:.04em}
.fdx-f input,.fdx-f textarea,.fdx-f select{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--iu-bd,#b4c3dc);background:var(--iu-sf2,#edf1f9);color:inherit;font:inherit}
.fdx-f textarea{min-height:90px;font-family:ui-monospace,Menlo,monospace;font-size:13px}.fdx-f input:disabled{opacity:.6}
.fdx-ft{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;position:sticky;bottom:-20px;background:var(--iu-sf,#fff);padding:10px 0 0}
`;document.head.appendChild(s)};

async function load(reset){
 const c=cfg(),d=db();if(!d)return;css();
 if(reset){D.rows[c.k]=[];D.more[c.k]=true;D.loaded[c.k]=false}
 D.loading=true;D.err='';repaint();
 const from=(D.rows[c.k]||[]).length;
 let r=await d.from(c.k).select('*').order(c.o,{ascending:!!c.asc}).range(from,from+PAGE-1);
 if(r.error)r=await d.from(c.k).select('*').range(from,from+PAGE-1);
 D.loading=false;
 if(r.error){D.err=r.error.message;D.loaded[c.k]=true;return repaint()}
 D.rows[c.k]=(D.rows[c.k]||[]).concat(r.data||[]);D.more[c.k]=(r.data||[]).length===PAGE;D.loaded[c.k]=true;repaint();
}
function pick(k){D.k=k;D.q='';D.sel.clear();if(!D.loaded[k])load(true);else repaint()}
function match(r){const q=D.q.trim().toLowerCase();if(!q)return true;return JSON.stringify(r).toLowerCase().includes(q)}
function body(){
 const c=cfg(),rows=(D.rows[c.k]||[]).filter(match);
 let h='<div class="fdx-tabs">'+T.map(x=>'<button class="'+(x.k===D.k?'on':'')+'" onclick="IASDData.pick(\''+x.k+'\')">'+x.e+' '+esc(x.n)+'</button>').join('')+'</div>';
 if(c.danger)h+='<div class="fdx-warn">⚠️ Tabela sensível: mudar ou excluir aqui pode tirar o acesso de pessoas ou desconfigurar o site. Para cargos e contas, prefira a lista acima.</div>';
 h+='<div class="fdx-bar"><input type="search" id="fdx-q" placeholder="Pesquisar em '+esc(c.n)+'…" value="'+esc(D.q)+'" oninput="IASDData.search(this.value)"><button class="fdx-b pri" onclick="IASDData.edit()">＋ Novo</button><button class="fdx-b" onclick="IASDData.all()">Selecionar tudo</button><button class="fdx-b dan" '+(D.sel.size?'':'disabled')+' onclick="IASDData.delSel()">🗑 Excluir ('+D.sel.size+')</button><button class="fdx-b" onclick="IASDData.backup()">⬇ Backup JSON</button><button class="fdx-b" onclick="IASDData.reload()">↻</button></div>';
 if(D.err)h+='<div class="fdx-warn" role="alert">Erro: '+esc(D.err)+'<br><small>Se for permissão negada, rode o arquivo <b>docs/supabase-fundador-total.sql</b> no Supabase.</small></div>';
 if(D.loading&&!rows.length)h+='<div class="fdx-empty">Carregando…</div>';
 else if(!rows.length)h+='<div class="fdx-empty">Nenhum registro'+(D.q?' para esta pesquisa':'')+'.</div>';
 else h+='<div class="fdx-list">'+rows.map(r=>{const id=rid(r),sel=D.sel.has(String(id));
  return '<div class="fdx-row '+(sel?'sel':'')+'"><input type="checkbox" '+(sel?'checked':'')+' onchange="IASDData.toggle(\''+esc(id)+'\')" aria-label="Selecionar"><div class="fdx-tx"><b>'+esc(short(c.t(r)||id,80))+'</b><small>'+esc(short(c.s(r)||String(id),100))+'</small></div><div class="fdx-act">'+
  (c.move?'<button class="fdx-b" title="Mover para cima" onclick="IASDData.move(\''+esc(id)+'\',-1)">↑</button><button class="fdx-b" title="Mover para baixo" onclick="IASDData.move(\''+esc(id)+'\',1)">↓</button>':'')+
  '<button class="fdx-b" onclick="IASDData.edit(\''+esc(id)+'\')">Editar</button><button class="fdx-b" onclick="IASDData.dup(\''+esc(id)+'\')">Duplicar</button><button class="fdx-b dan" onclick="IASDData.del(\''+esc(id)+'\')">Excluir</button></div></div>'}).join('')+'</div>';
 if(D.more[c.k]&&!D.q)h+='<div style="text-align:center;margin-top:10px"><button class="fdx-b" onclick="IASDData.loadMore()">'+(D.loading?'Carregando…':'Carregar mais')+'</button></div>';
 return h;
}
function repaint(){const el=document.getElementById('fdx-body');if(!el)return;const keep=document.activeElement&&document.activeElement.id==='fdx-q';el.innerHTML=body();if(keep){const i=document.getElementById('fdx-q');i.focus();i.setSelectionRange(i.value.length,i.value.length)}}

/* ---------- quem pode o quê (conferido com as regras do app) ---------- */
const ROLES=[['founder','Fundador'],['cofounder','Co-fundador'],['admin','Administrador'],['editor','Programação'],['midia','Comunicação'],['lider','Líder'],['sonoplasta','Sonoplasta'],['viewer','Usuário comum']];
function matrix(){
 const R=(window.IASDAccess&&IASDAccess.roles)||{management:['founder','cofounder','admin'],siteEditors:['founder','cofounder','admin','midia'],scheduleEditors:['founder','cofounder','admin','editor','operator'],assigned:['founder','cofounder','admin','editor','operator','midia','lider','sonoplasta'],sound:['sonoplasta','founder','cofounder']};
 const ALL=ROLES.map(r=>r[0]);
 const rows=[
  ['Ver cronogramas, escalas, Bíblia, hinário e jogos','Qualquer pessoa logada',ALL],
  ['Criar e editar cronogramas',null,R.scheduleEditors],
  ['Enviar alertas à sonoplastia',null,R.assigned],
  ['Ver e responder alertas (sonoplasta)',null,R.sound],
  ['Apagar alertas',null,R.assigned],
  ['Usar o IASD Projetor e o Studio de Projeção',null,R.sound],
  ['Modo edição: textos, banners, capas e carrossel',null,R.siteEditors],
  ['Acervo do Site (imagens, vídeos, arquivos)',null,R.siteEditors],
  ['Criar, renomear e excluir abas',null,R.management],
  ['Excluir cronogramas',null,R.management],
  ['Gerenciar usuários e cargos',null,['founder']],
  ['Central de Dados (editar ou excluir qualquer tabela)',null,['founder']],
  ['Zerar o ranking dos jogos',null,['founder']]
 ];
 const accs=(typeof founderAccounts!=='undefined'&&founderAccounts)||[];
 const count=k=>accs.filter(u=>k==='viewer'?(!u.role||u.role==='pending'||u.role==='viewer'):(u.role===k||(k==='editor'&&u.role==='operator'))).length;
 return '<section class="fdx pg-card"><h2>🔑 Quem pode o quê</h2><p class="muted">Tudo o que depende de cargo para ser visto ou editado. A linha “Pessoas” mostra quantas contas têm cada cargo hoje.</p><div style="overflow:auto"><table class="fdm"><thead><tr><th>Função</th>'+ROLES.map(r=>'<th>'+esc(r[1])+'</th>').join('')+'</tr></thead><tbody>'+
  '<tr class="cnt"><td><b>Pessoas</b></td>'+ROLES.map(r=>'<td><b>'+count(r[0])+'</b></td>').join('')+'</tr>'+
  rows.map(r=>'<tr><td>'+esc(r[0])+(r[1]?'<small>'+esc(r[1])+'</small>':'')+'</td>'+ROLES.map(x=>'<td>'+(r[2].includes(x[0])?'<span class="y">✓</span>':'<span class="n">—</span>')+'</td>').join('')+'</tr>').join('')+
  '</tbody></table></div></section>';
}

function section(){
 css();setTimeout(()=>{if(!D.loaded[D.k]&&!D.loading)load(true)},0);
 return matrix()+'<section class="fdx pg-card"><h2>🗂️ Central de Dados do Site</h2><p class="muted">Domínio total: veja, pesquise, crie, edite, duplique, mova, exclua e faça backup de tudo que o site guarda.</p><div id="fdx-body">'+body()+'</div></section>';
}
const find=id=>(D.rows[D.k]||[]).find(r=>String(rid(r))===String(id));
/* ---------- editor ---------- */
function kind(v){if(v!==null&&typeof v==='object')return 'json';if(typeof v==='boolean')return 'bool';if(typeof v==='number')return 'num';if(typeof v==='string'&&(v.length>90||v.includes('\n')))return 'area';return 'text'}
let E=null;
function edit(id){
 const c=cfg();let row=id!==undefined?find(id):null;
 const tmpl=(D.rows[c.k]||[])[0]||{};
 const base=row||Object.fromEntries(Object.keys(tmpl).filter(k=>!['id','created_at','updated_at'].includes(k)).map(k=>[k,null]));
 E={isNew:!row,id,keys:Object.keys(base),orig:row||{}};
 if(!E.keys.length){alert('Esta tabela ainda não tem registros para servir de modelo. Crie o primeiro pelo próprio site.');E=null;return}
 const fields=E.keys.map(k=>{const v=base[k],kd=kind(v),ro=!E.isNew&&(k==='id'||k==='created_at'||k==='user_id'&&c.k==='iasd_profiles');
  const val=kd==='json'?JSON.stringify(v,null,2):v==null?'':String(v);
  let inp;if(kd==='bool')inp='<select id="fdxf-'+k+'" data-k="'+k+'" data-t="bool"><option value="true" '+(v?'selected':'')+'>Sim</option><option value="false" '+(!v?'selected':'')+'>Não</option></select>';
  else if(kd==='json'||kd==='area')inp='<textarea id="fdxf-'+k+'" data-k="'+k+'" data-t="'+kd+'" '+(ro?'disabled':'')+'>'+esc(val)+'</textarea>';
  else inp='<input id="fdxf-'+k+'" data-k="'+k+'" data-t="'+kd+'" value="'+esc(val)+'" '+(ro?'disabled':'')+' '+(kd==='num'?'type="number" step="any"':'')+'>';
  return '<div class="fdx-f"><label>'+esc(k)+(kd==='json'?' (JSON)':'')+'</label>'+inp+'</div>'}).join('');
 const ov=document.createElement('div');ov.className='fdx-ov';ov.id='fdx-ov';ov.onclick=e=>{if(e.target===ov)closeEd()};
 ov.innerHTML='<div class="fdx-md" role="dialog"><h3>'+(E.isNew?'Novo registro':'Editar registro')+' · '+esc(c.n)+'</h3>'+fields+'<div class="fdx-ft"><button class="fdx-b" onclick="IASDData.closeEd()">Cancelar</button><button class="fdx-b pri" id="fdx-save" onclick="IASDData.save()">Salvar</button></div></div>';
 document.body.appendChild(ov);
}
function closeEd(){document.getElementById('fdx-ov')?.remove();E=null}
async function save(){
 if(!E)return;const c=cfg(),d=db(),out={};
 for(const el of document.querySelectorAll('#fdx-ov [data-k]')){
  if(el.disabled)continue;const k=el.dataset.k,t=el.dataset.t;let v=el.value;
  if(t==='bool')v=v==='true';
  else if(t==='num')v=v===''?null:Number(v);
  else if(t==='json'){try{v=v.trim()?JSON.parse(v):null}catch(e){return alert('O campo "'+k+'" tem JSON inválido.')}}
  else if(v===''&&E.orig[k]==null)v=null;
  if(!E.isNew&&JSON.stringify(v)===JSON.stringify(E.orig[k]))continue;
  if(E.isNew&&v===null)continue;
  out[k]=v}
 const b=document.getElementById('fdx-save');b.disabled=true;b.textContent='Salvando…';
 let r;
 if(E.isNew)r=await d.from(c.k).insert(out).select();
 else{if(!Object.keys(out).length){closeEd();return}const p=pk(E.orig);r=await d.from(c.k).update(out).eq(p,E.orig[p]).select()}
 if(r.error){b.disabled=false;b.textContent='Salvar';return alert('Não foi possível salvar: '+r.error.message)}
 if(!E.isNew&&!(r.data||[]).length){b.disabled=false;b.textContent='Salvar';return alert('Nada foi alterado. Provavelmente falta permissão: rode docs/supabase-fundador-total.sql no Supabase.')}
 closeEd();await load(true);afterChange();
}
function afterChange(){try{if(D.k==='iasd_custom_tabs'&&typeof loadCustomTabs==='function')loadCustomTabs();if(D.k==='iasd_schedules'&&typeof loadSchedules==='function')loadSchedules()}catch(e){}}
async function dup(id){
 const r=find(id);if(!r)return;const c=cfg(),copy={...r};delete copy.id;delete copy.created_at;delete copy.updated_at;
 if(copy.name)copy.name+=' (cópia)';else if(copy.title)copy.title+=' (cópia)';
 const x=await db().from(c.k).insert(copy).select();
 if(x.error)return alert('Não foi possível duplicar: '+x.error.message);await load(true);afterChange();
}
async function del(id){
 const r=find(id);if(!r)return;if(!(await IASDDialog.confirm('Excluir este registro?\n\n'+short(cfg().t(r)||id,80)+'\n\nNão dá para desfazer (faça um backup antes se precisar).')))return;
 await rm([id]);
}
async function rm(ids){
 const c=cfg(),d=db();let fail=null;
 for(const id of ids){const r=find(id);if(!r)continue;const p=pk(r);const x=await d.from(c.k).delete().eq(p,r[p]).select();if(x.error){fail=x.error.message;break}if(!(x.data||[]).length){fail='Nada foi excluído (sem permissão). Rode docs/supabase-fundador-total.sql no Supabase.';break}}
 D.sel.clear();if(fail)alert(fail);await load(true);afterChange();
}
async function delSel(){if(!D.sel.size)return;if(!(await IASDDialog.confirm('Excluir '+D.sel.size+' registro(s) de "'+cfg().n+'"?\n\nNão dá para desfazer.')))return;await rm([...D.sel])}
async function move(id,dir){
 const c=cfg(),rows=(D.rows[c.k]||[]).slice(),i=rows.findIndex(r=>String(rid(r))===String(id)),j=i+dir;if(i<0||j<0||j>=rows.length)return;
 [rows[i],rows[j]]=[rows[j],rows[i]];
 const d=db();let err=null;
 for(let n=0;n<rows.length;n++){const r=rows[n];if(Number(r[c.move])===n)continue;const p=pk(r);const x=await d.from(c.k).update({[c.move]:n}).eq(p,r[p]);if(x.error){err=x.error.message;break}}
 if(err)alert('Não foi possível mover: '+err);await load(true);afterChange();
}
function toggle(id){id=String(id);D.sel.has(id)?D.sel.delete(id):D.sel.add(id);repaint()}
function all(){const rows=(D.rows[D.k]||[]).filter(match);const every=rows.every(r=>D.sel.has(String(rid(r))));rows.forEach(r=>every?D.sel.delete(String(rid(r))):D.sel.add(String(rid(r))));repaint()}
function search(v){D.q=v;repaint()}
async function backup(){
 const c=cfg(),d=db();let rows=[],from=0;
 while(true){const r=await d.from(c.k).select('*').range(from,from+999);if(r.error)return alert('Erro no backup: '+r.error.message);rows=rows.concat(r.data||[]);if((r.data||[]).length<1000)break;from+=1000}
 const blob=new Blob([JSON.stringify({table:c.k,exported_at:new Date().toISOString(),rows},null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='backup-'+c.k+'-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
window.IASDData={section,pick,search,edit,closeEd,save,dup,del,delSel,move,toggle,all,backup,reload:()=>load(true),loadMore:()=>load(false)};
})();
