/* Temas › Transição ao projetar: estilo e velocidade da entrada/saída do conteúdo no telão. */
(function(){
'use strict';
const T=window.IASDTr,sec=document.getElementById('themes');if(!T||!sec)return;
const box=document.createElement('div');box.className='tr-box';
box.innerHTML='<div class="m-recent"><h4>Transição ao projetar</h4><div class="m-chips fx-chips" id="trType"></div></div><div class="m-recent"><h4>Velocidade</h4><div class="m-chips fx-chips" id="trSpeed"></div></div><div class="tr-demo"><button type="button" id="trTest" class="mp-btn">▶ Testar no preview</button><span class="muted">Vale para tudo que vai ao telão e para o “Fechar telão” e a tela preta.</span></div>';
const anchor=sec.querySelector('#thPrev');if(anchor)anchor.insertAdjacentElement('beforebegin',box);else sec.append(box);
function chips(id,map,cur,pick){const el=document.getElementById(id);el.replaceChildren();Object.entries(map).forEach(([k,l])=>{const b=document.createElement('button');b.type='button';b.textContent=l;const on=String(cur())===k;b.className=on?'on':'';b.setAttribute('aria-pressed',String(on));b.onclick=()=>{pick(k);paint();if(typeof requestStudioHeight==='function')requestStudioHeight()};el.append(b)})}
function paint(){chips('trType',T.types,()=>T.get().type,k=>T.set({type:k}));chips('trSpeed',T.speeds,()=>T.get().ms,k=>T.set({ms:+k}));document.getElementById('trSpeed').style.opacity=T.get().type==='none'?.45:1}
/* demonstração só no preview: alterna dois cartões de texto */
let n=0;document.getElementById('trTest').onclick=()=>{
 const f=document.getElementById('live');if(!f||!f.contentWindow)return;
 const cards=[{title:'Transição',text:'Assim o conteúdo entra no telão'},{title:'Transição',text:'e assim ele sai, sem corte seco'}];
 const c='IASD_TEXT:'+JSON.stringify(cards[n++%2]);
 f.contentWindow.postMessage({type:'iasd-project',content:T.wire(c)},location.origin);
};
const st=document.createElement('style');st.textContent='.tr-box{margin:10px 0 14px;display:grid;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--bd,rgba(255,255,255,.12))}.tr-demo{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px}';
document.head.appendChild(st);paint();
})();
