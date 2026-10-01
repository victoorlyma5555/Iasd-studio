/* Janelas próprias do IASD APP no lugar de confirm / alert / prompt do navegador.
   IASDDialog.confirm(msg) e IASDDialog.prompt(msg, padrão) devolvem Promise; alert() agora aparece como aviso bonito. */
(function(){
'use strict';
if(window.IASDDialog)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DANGER=/exclu|apag|remov|zerar|encerr|limpar|delet|sair da/i;
let queue=Promise.resolve();
function lines(msg){const parts=String(msg??'').split(/\n\s*\n/);return parts.map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('')}
function open(kind,msg,def,opts){
 opts=opts||{};
 const run=()=>new Promise(res=>{
  const ov=document.createElement('div');ov.className='iad-ov';
  const danger=kind==='confirm'&&(opts.danger??DANGER.test(msg));
  const title=opts.title||(kind==='alert'?'Aviso':kind==='prompt'?'Digite':danger?'Tem certeza?':'Confirmar');
  const ico=kind==='alert'?'ℹ️':kind==='prompt'?'✏️':danger?'⚠️':'❓';
  ov.innerHTML='<div class="iad-box" role="alertdialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="iad-ic">'+ico+'</div><h3>'+esc(title)+'</h3><div class="iad-msg">'+lines(msg)+'</div>'
   +(kind==='prompt'?'<input class="iad-in" type="text" value="'+esc(def||'')+'" autocomplete="off">':'')
   +'<div class="iad-acts">'+(kind==='alert'?'':'<button class="iad-no" type="button">'+esc(opts.no||'Cancelar')+'</button>')
   +'<button class="iad-ok'+(danger?' danger':'')+'" type="button">'+esc(opts.ok||(kind==='alert'?'Entendi':danger?'Sim, continuar':'OK'))+'</button></div></div>';
  const prev=document.activeElement;
  const input=ov.querySelector('.iad-in');
  let done=false;
  const end=v=>{if(done)return;done=true;document.removeEventListener('keydown',key,true);ov.classList.remove('on');setTimeout(()=>ov.remove(),160);try{prev&&prev.focus&&prev.focus()}catch(e){}res(v)};
  const ok=()=>end(kind==='prompt'?input.value:kind==='alert'?undefined:true);
  const no=()=>end(kind==='prompt'?null:kind==='alert'?undefined:false);
  function key(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();no()}else if(e.key==='Enter'&&(kind!=='prompt'||e.target===input)){e.preventDefault();e.stopPropagation();ok()}else if(e.key==='Tab'){const f=[...ov.querySelectorAll('button,input')];if(!f.length)return;const i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus()}}
  document.addEventListener('keydown',key,true);
  ov.addEventListener('click',e=>{if(e.target===ov&&kind!=='alert')no()});
  ov.querySelector('.iad-ok').onclick=ok;const n=ov.querySelector('.iad-no');if(n)n.onclick=no;
  document.body.appendChild(ov);
  requestAnimationFrame(()=>{ov.classList.add('on');(input||ov.querySelector(danger&&n?'.iad-no':'.iad-ok')).focus();if(input)input.select()});
 });
 const p=queue.then(run);queue=p.catch(()=>{});return p;
}
const API={
 confirm:(m,o)=>open('confirm',m,'',o),
 alert:(m,o)=>open('alert',m,'',o),
 prompt:(m,d,o)=>open('prompt',m,d,o)
};
window.IASDDialog=API;
window.alert=function(m){API.alert(m)};
const st=document.createElement('style');st.textContent=
'.iad-ov{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:rgba(2,8,23,.62);backdrop-filter:blur(3px);opacity:0;transition:opacity .15s}.iad-ov.on{opacity:1}'
+'.iad-box{width:min(400px,100%);box-sizing:border-box;padding:22px 20px 18px;border-radius:20px;background:var(--iu-sf,#0b1730);color:var(--iu-tx,#f4f7ff);border:1px solid rgba(245,183,58,.45);box-shadow:0 24px 70px rgba(0,0,0,.6);text-align:center;transform:translateY(8px) scale(.97);transition:transform .15s;font-family:inherit}.iad-ov.on .iad-box{transform:none}'
+'.iad-ic{font-size:34px;line-height:1;margin-bottom:6px}.iad-box h3{margin:0 0 8px;font-size:18px}.iad-msg{max-height:46vh;overflow:auto}.iad-msg p{margin:0 0 8px;font-size:14.5px;line-height:1.5;opacity:.88}'
+'.iad-in{width:100%;box-sizing:border-box;margin:6px 0 2px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:inherit;font:inherit;font-size:16px}'
+'.iad-acts{display:flex;gap:10px;margin-top:14px}.iad-acts button{flex:1;min-height:46px;padding:10px 14px;border-radius:13px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:inherit;font:inherit;font-weight:700;cursor:pointer}.iad-acts button:focus-visible{outline:2px solid #f5b73a;outline-offset:2px}'
+'.iad-acts .iad-ok{background:#f5b73a;color:#241a00;border-color:transparent}.iad-acts .iad-ok.danger{background:#e5484d;color:#fff}';
document.head.appendChild(st);
})();
