/* Studio — miniaturas (cartões visuais) nas opções de estilo do Sorteador e de transição dos Temas.
   Só acrescenta um <span class="thm"> em cada botão; a lógica das opções continua nos outros arquivos. */
(function(){
'use strict';
const MAP={drTpl:'dt',drFx:'df',drCel:'dc',trType:'tr'};
const GLY={
 dt:{cartoes:'<b class="n">42</b>',bolas:'<b class="n">42</b>',neon:'<b class="n">42</b>',led:'<b class="n">42</b>',slot:'<b class="n">4</b><b class="n">2</b>',minimal:'<b class="n">42</b>'},
 df:{suspense:'<b class="n">?</b>',cascata:'<b class="n a">4</b><b class="n b">2</b>',contagem:'<b class="n c">42</b>'},
 dc:{fogos:'<b class="e">🎆</b>',confete:'<b class="e">🎉</b>',brilho:'<b class="e">✨</b>',nenhum:'<b class="e">⊘</b>'},
 tr:null
};
function dress(box){
 const g=MAP[box.id];if(!g)return;
 box.classList.add('thm-grid');
 box.querySelectorAll('button').forEach(b=>{
  if(b.querySelector('.thm'))return;
  const k=b.dataset.k||'';
  let key=k;
  if(!key){/* trType não traz data-k: descobre pela ordem */
   const i=[...box.children].indexOf(b);const T=window.IASDTr&&Object.keys(IASDTr.types)[i];key=T||'';
  }
  const t=document.createElement('span');t.className='thm thm-'+g+' thm-'+g+'-'+key;
  t.innerHTML=g==='tr'?'<i></i>':((GLY[g]||{})[key]||'');
  b.prepend(t);b.classList.add('has-thm');
 });
}
function all(){Object.keys(MAP).forEach(id=>{const el=document.getElementById(id);if(el)dress(el)})}
const mo=new MutationObserver(()=>{mo.disconnect();all();watch()});
function watch(){Object.keys(MAP).forEach(id=>{const el=document.getElementById(id);if(el)mo.observe(el,{childList:true})})}
all();watch();setTimeout(()=>{all();watch()},900);
})();
