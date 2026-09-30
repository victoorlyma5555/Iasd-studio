/* Rede de segurança de inicialização.
   Se algo quebrar ao carregar (script ausente, erro de sintaxe, CDN fora do ar),
   a pessoa vê uma mensagem com botão de recarregar, e não uma tela vazia. */
(function(){
'use strict';
var errors=[];
function note(msg){errors.push(String(msg).slice(0,300));try{console.warn('[IASD boot]',msg)}catch(e){}}
window.addEventListener('error',function(e){note((e&&e.message)||'erro de script')});
window.addEventListener('unhandledrejection',function(e){note((e&&e.reason&&e.reason.message)||'promessa rejeitada')});
function show(){
  var c=document.getElementById('content');
  if(!c||c.innerHTML.trim())return;
  c.innerHTML='<div role="alert" style="max-width:520px;margin:64px auto;padding:24px;border:1px solid #c9a24a;border-radius:16px;font:16px/1.5 system-ui,sans-serif;text-align:center;background:#fff;color:#12284b"><h2 style="margin:0 0 8px">Não foi possível carregar o IASD APP</h2><p style="margin:0 0 16px">Verifique a internet e tente de novo. Se o problema continuar, avise a equipe de tecnologia.</p><button onclick="location.reload()" style="padding:10px 18px;border-radius:10px;border:0;background:#2563eb;color:#fff;font:600 15px system-ui,sans-serif;cursor:pointer">Recarregar</button>'+(errors.length?'<details style="margin-top:14px;text-align:left;font-size:12px;color:#5b6b8c"><summary>Detalhes técnicos</summary><pre style="white-space:pre-wrap">'+errors.join('\n').replace(/[<&]/g,'')+'</pre></details>':'')+'</div>';
}
window.addEventListener('load',function(){setTimeout(show,3500)});
window.IASDBoot=Object.freeze({errors:errors});
})();
