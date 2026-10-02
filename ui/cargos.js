/* Cargos e acessos: cargos agregados (conjuntos de permissões) e permissões diretas por pessoa.
   Tudo passa pelas funções iasd_perm_* do Supabase (docs/supabase-permissoes.sql), que também barram o que é só do fundador. */
(function(){
'use strict';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data=null,loading=false,err='',tab='pessoas',q='',modal=null;
const cat=()=>(window.IASDAccess&&IASDAccess.catalog)||[];
const flat=()=>cat().flatMap(g=>g.items);
const label=k=>(flat().find(i=>i.key===k)||{}).label||k;
const isSens=k=>!!(flat().find(i=>i.key===k)||{}).sensitive;
const cargoById=id=>(data?.cargos||[]).find(c=>c.id===id);
const redraw=()=>{try{if(typeof current!=='undefined'&&current==='Cargos')render()}catch(e){}};
const canGive=()=>typeof cloudUser!=='undefined'&&cloudUser&&window.IASDAccess&&IASDAccess.canGivePerms(cloudRole);
async function load(){if(loading)return;loading=true;err='';redraw();
 try{const r=await cloud.rpc('iasd_perm_overview');if(r.error)throw r.error;data=r.data}
 catch(e){err=/function|schema cache|iasd_perm/i.test(e.message||'')?'Falta rodar docs/supabase-permissoes.sql no Supabase.':(e.message||'Não foi possível carregar.')}
 loading=false;redraw()}
function chips(m){const ids=(m.cargo_ids||[]).map(cargoById).filter(Boolean),own=(m.perms||[]);
 const a=ids.map(c=>'<span class="cg-chip cg-cargo">'+E(c.name)+'</span>').join('')+own.map(k=>'<span class="cg-chip">'+E(label(k))+'</span>').join('');
 return a||'<span class="cg-none">Nenhum acesso extra</span>'}
function pessoas(){const list=(data.members||[]).filter(m=>{const t=(m.full_name+' '+(m.email||'')).toLowerCase();return !q||t.includes(q.toLowerCase())});
 const adm=['founder','cofounder','admin'];
 return '<div class="cg-bar"><input id="cg-q" type="search" placeholder="Buscar pessoa…" value="'+E(q)+'" oninput="IASDCargos.search(this.value)"></div>'+
  (list.length?list.map(m=>'<article class="cg-card"><div class="cg-who"><b>'+E(m.full_name)+'</b><small>'+E(m.email||'')+'</small>'+(adm.includes(m.role)?'<span class="cg-badge">'+({founder:'Fundador',cofounder:'Co-Fundador',admin:'Administrador'})[m.role]+'</span>':'')+'</div>'+
   (adm.includes(m.role)?'<p class="cg-note">Cargo administrativo: o acesso vem do próprio cargo.</p>':'<div class="cg-chips">'+chips(m)+'</div><button type="button" class="cg-btn" onclick="IASDCargos.editMember(\''+E(m.user_id)+'\')">Editar acessos</button>')+'</article>').join(''):'<p class="cg-none">Ninguém encontrado.</p>')}
function cargos(){const cs=data.cargos||[];
 return '<div class="cg-bar"><button type="button" class="primary" onclick="IASDCargos.editCargo()">＋ Novo cargo</button></div>'+
  (cs.length?cs.map(c=>{const n=(data.members||[]).filter(m=>(m.cargo_ids||[]).includes(c.id)).length;
   return '<article class="cg-card"><div class="cg-who"><b>'+E(c.name)+'</b><small>'+n+' pessoa'+(n===1?'':'s')+'</small></div><div class="cg-chips">'+((c.perms||[]).map(k=>'<span class="cg-chip">'+E(label(k))+'</span>').join('')||'<span class="cg-none">Sem permissões</span>')+'</div><div class="cg-act"><button type="button" class="cg-btn" onclick="IASDCargos.editCargo(\''+E(c.id)+'\')">Editar</button><button type="button" class="cg-btn cg-del" onclick="IASDCargos.delCargo(\''+E(c.id)+'\')">Apagar</button></div></article>'}).join(''):'<p class="cg-none">Nenhum cargo ainda. Crie o primeiro, como “Diretor do Culto”.</p>')}
function page(){
 if(!canGive())return '<div class="panel"><h2>Acesso restrito</h2><p>Somente fundador, cofundador e administrador gerenciam cargos e acessos.</p></div>';
 if(!data&&!loading&&!err)setTimeout(load,0);
 const body=err?'<div class="panel" role="alert">'+E(err)+'</div><button type="button" class="cg-btn" onclick="IASDCargos.reload()">Tentar de novo</button>':(!data?'<div class="panel">Carregando…</div>':(tab==='pessoas'?pessoas():cargos()));
 return '<div class="cg-page"><div class="cg-top"><div><h2>Cargos e acessos</h2><p class="muted">Crie cargos pequenos e escolha o que cada pessoa pode fazer. As mudanças valem na hora, sem a pessoa recarregar o site.</p></div><button type="button" class="cg-btn" onclick="IASDCargos.reload()">↻ Atualizar</button></div>'+
  '<div class="cg-tabs"><button type="button" class="'+(tab==='pessoas'?'on':'')+'" onclick="IASDCargos.tab(\'pessoas\')">Pessoas</button><button type="button" class="'+(tab==='cargos'?'on':'')+'" onclick="IASDCargos.tab(\'cargos\')">Cargos</button></div>'+body+'</div>'}
/* ---------- janelas de edição ---------- */
function permItem(i,on,lockNote){const founder=!!data.me_founder,lock=!!lockNote||(i.sensitive&&!founder);
 return '<label class="cg-perm'+(lock?' lock':'')+'"><input type="checkbox" data-k="'+E(i.key)+'" '+(on?'checked ':'')+(lock?'disabled ':'')+'><span><b>'+E(i.label)+'</b>'+(i.hint?'<small>'+E(i.hint)+'</small>':'')+'<small class="cg-inh" data-inh>'+E(lockNote||((i.sensitive&&!founder)?'só o fundador concede':''))+'</small></span></label>'}
function permBoxes(sel){
 const ready=cat().map(g=>({g:g.group,items:g.items.filter(i=>i.ready)})).filter(x=>x.items.length),soon=cat().flatMap(g=>g.items.filter(i=>!i.ready));
 return ready.map(x=>'<fieldset class="cg-grp"><legend>'+E(x.g.replace(/ \(.*\)/,''))+'</legend>'+x.items.map(i=>permItem(i,sel.has(i.key))).join('')+'</fieldset>').join('')+
  (soon.length?'<details class="cg-soon-box"><summary>Em breve · ainda sem efeito no site ('+soon.length+')</summary><p class="muted">Você já pode marcar, e passa a valer quando o site ganhar essas funções.</p>'+soon.map(i=>permItem(i,sel.has(i.key))).join('')+'</details>':'')}
const same=(a,b)=>a.size===b.size&&[...a].every(x=>b.has(x));
const diff=(a,b)=>[...a].filter(x=>!b.has(x)).length+[...b].filter(x=>!a.has(x)).length;
function close(force){const m=document.getElementById('cg-modal');if(!m)return true;if(!force&&m.__dirty&&m.__dirty()&&!confirm('Descartar as alterações?'))return false;m.remove();document.body.classList.remove('cg-lock');return true}
function open(title,sub,body){close(true);const o=document.createElement('div');o.id='cg-modal';o.className='cg-ov';
 o.innerHTML='<div class="cg-box" role="dialog" aria-modal="true"><div class="cg-head"><div><h3>'+E(title)+'</h3>'+(sub?'<p class="muted">'+E(sub)+'</p>':'')+'</div><button type="button" class="cg-x" aria-label="Fechar" id="cg-x">✕</button></div><div class="cg-body">'+body+'</div><div class="cg-foot"><span class="cg-count" id="cg-count">Sem alterações</span><button type="button" class="cg-btn" id="cg-undo" disabled>↺ Desfazer</button><button type="button" class="cg-btn" id="cg-cancel">Cancelar</button><button type="button" class="primary" id="cg-save" disabled>Salvar</button></div></div>';
 o.addEventListener('mousedown',e=>{if(e.target===o)close()});document.addEventListener('keydown',function k(e){if(!document.getElementById('cg-modal')){document.removeEventListener('keydown',k);return}if(e.key==='Escape')close()});
 o.querySelector('#cg-x').onclick=()=>close();o.querySelector('#cg-cancel').onclick=()=>close();document.body.classList.add('cg-lock');document.body.append(o);return o}
const permInputs=o=>[...o.querySelectorAll('input[data-k]')];
function toast(msg,undo){const t=document.createElement('div');t.className='cg-toast';t.innerHTML='<span>'+E(msg)+'</span>'+(undo?'<button type="button">Desfazer</button>':'');document.body.append(t);let h;const bye=()=>{clearTimeout(h);t.remove()};h=setTimeout(bye,9000);if(undo)t.querySelector('button').onclick=async()=>{bye();await undo()}}
function editMember(uid){const m=(data.members||[]).find(x=>x.user_id===uid);if(!m)return;
 const c0=new Set(m.cargo_ids||[]),p0=new Set(m.perms||[]);let own=new Set(p0);
 const cargoList=(data.cargos||[]).length?(data.cargos||[]).map(c=>{const lock=!data.me_founder&&(c.perms||[]).some(isSens);return '<label class="cg-perm'+(lock?' lock':'')+'"><input type="checkbox" data-c="'+E(c.id)+'" '+(c0.has(c.id)?'checked ':'')+(lock?'disabled ':'')+'><span><b>'+E(c.name)+'</b><small>'+((c.perms||[]).map(label).join(' · ')||'sem permissões')+'</small>'+(lock?'<small class="cg-inh">só o fundador concede</small>':'')+'</span></label>'}).join(''):'<p class="cg-none">Nenhum cargo criado. Use a aba Cargos para criar.</p>';
 const o=open(m.full_name,m.email||'','<section><h4>Cargos</h4>'+cargoList+'</section><section><h4>Permissões soltas</h4><p class="muted">Para liberar só uma função, sem criar um cargo.</p>'+permBoxes(p0)+'</section>');
 const cargosNow=()=>new Set([...o.querySelectorAll('input[data-c]:checked')].map(x=>x.dataset.c));
 function refresh(){const cs=cargosNow(),inh=new Map();cs.forEach(id=>{const c=cargoById(id);(c?.perms||[]).forEach(k=>{if(!inh.has(k))inh.set(k,[]);inh.get(k).push(c.name)})});
  const founder=!!data.me_founder;
  permInputs(o).forEach(x=>{const k=x.dataset.k,from=inh.get(k),sens=isSens(k)&&!founder,lab=x.closest('label'),note=lab.querySelector('[data-inh]');
   if(from){x.checked=true;x.disabled=true;lab.classList.add('lock');note.textContent='já vem do cargo '+from.join(', ')}
   else{x.disabled=sens;x.checked=own.has(k);lab.classList.toggle('lock',sens);note.textContent=sens?'só o fundador concede':''}});
  const n=diff(cs,c0)+diff(own,p0);o.querySelector('#cg-count').textContent=n?n+' alteraç'+(n===1?'ão':'ões')+' não salva'+(n===1?'':'s'):'Sem alterações';
  o.querySelector('#cg-save').disabled=!n;o.querySelector('#cg-undo').disabled=!n;o.__n=n}
 o.__dirty=()=>o.__n>0;
 o.addEventListener('change',e=>{const x=e.target;if(x.dataset.k){x.checked?own.add(x.dataset.k):own.delete(x.dataset.k)}refresh()});
 o.querySelector('#cg-undo').onclick=()=>{own=new Set(p0);o.querySelectorAll('input[data-c]').forEach(x=>x.checked=c0.has(x.dataset.c));refresh()};
 o.querySelector('#cg-save').onclick=async()=>{const b=o.querySelector('#cg-save');b.disabled=true;b.textContent='Salvando…';
  const ids=[...cargosNow()],ps=[...own];
  const r=await cloud.rpc('iasd_perm_set_member',{p_uid:m.user_id,p_cargo_ids:ids,p_perms:ps});
  if(r.error){alert('Não foi possível salvar: '+r.error.message);b.disabled=false;b.textContent='Salvar';return}
  close(true);await load();
  toast('Acessos de '+m.full_name+' salvos.',async()=>{const u=await cloud.rpc('iasd_perm_set_member',{p_uid:m.user_id,p_cargo_ids:[...c0],p_perms:[...p0]});if(u.error)alert('Não foi possível desfazer: '+u.error.message);await load()})};
 refresh()}
function editCargo(id){const c=id?cargoById(id):null,p0=new Set(c?c.perms:[]),n0=c?c.name:'';let own=new Set(p0);
 const o=open(c?'Editar cargo':'Novo cargo',c?'':'Dê um nome e marque o que este cargo pode fazer.','<label class="cg-name">Nome do cargo<input id="cg-name" maxlength="40" placeholder="Ex.: Diretor do Culto" value="'+E(n0)+'"></label>'+permBoxes(p0));
 const refresh=()=>{const nm=o.querySelector('#cg-name').value.trim(),n=diff(own,p0)+(nm!==n0?1:0);o.querySelector('#cg-count').textContent=n?n+' alteraç'+(n===1?'ão':'ões'):'Sem alterações';o.querySelector('#cg-save').disabled=!n||nm.length<2;o.querySelector('#cg-undo').disabled=!n;o.__n=n};
 o.__dirty=()=>o.__n>0;
 o.addEventListener('input',e=>{if(e.target.id==='cg-name')refresh()});
 o.addEventListener('change',e=>{const x=e.target;if(x.dataset.k){x.checked?own.add(x.dataset.k):own.delete(x.dataset.k)}refresh()});
 o.querySelector('#cg-undo').onclick=()=>{own=new Set(p0);o.querySelector('#cg-name').value=n0;permInputs(o).forEach(x=>x.checked=p0.has(x.dataset.k));refresh()};
 o.querySelector('#cg-save').onclick=async()=>{const name=o.querySelector('#cg-name').value.trim();const b=o.querySelector('#cg-save');b.disabled=true;b.textContent='Salvando…';
  const keep=(c?c.perms:[]).filter(k=>isSens(k)&&!data.me_founder);
  const r=await cloud.rpc('iasd_perm_save_cargo',{p_id:c?c.id:null,p_name:name,p_perms:[...new Set([...own,...keep])]});
  if(r.error){alert('Não foi possível salvar: '+r.error.message);b.disabled=false;b.textContent='Salvar';return}
  close(true);await load();
  if(c)toast('Cargo “'+name+'” salvo.',async()=>{const u=await cloud.rpc('iasd_perm_save_cargo',{p_id:c.id,p_name:n0,p_perms:[...p0]});if(u.error)alert('Não foi possível desfazer: '+u.error.message);await load()});
  else toast('Cargo “'+name+'” criado.')};
 refresh();if(!c)o.querySelector('#cg-name').focus()}
async function delCargo(id){const c=cargoById(id);if(!c)return;
 const ok=window.IASDDialog?.confirm?await IASDDialog.confirm('Apagar o cargo “'+c.name+'”? Quem tem este cargo perde as permissões dele.'):confirm('Apagar o cargo “'+c.name+'”?');if(!ok)return;
 const r=await cloud.rpc('iasd_perm_delete_cargo',{p_id:id});if(r.error)return alert('Não foi possível apagar: '+r.error.message);await load()}
window.IASDCargos={page,toast,reload:load,tab:t=>{tab=t;redraw()},search:v=>{q=v;redraw();const i=document.getElementById('cg-q');if(i){i.focus();i.setSelectionRange(v.length,v.length)}},editMember,editCargo,delCargo};
})();
