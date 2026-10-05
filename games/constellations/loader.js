(function(){
'use strict';
const V='4';let loading;
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>{el.remove();reject(Error('Não foi possível carregar Constelações. Tente novamente.'))};document.head.append(el)})}
function style(){if(document.getElementById('cs-style'))return Promise.resolve();return new Promise((resolve,reject)=>{const css=document.createElement('link');css.id='cs-style';css.rel='stylesheet';css.href='/games/constellations/game.css?v='+V;css.onload=resolve;css.onerror=()=>{css.remove();reject(Error('Não foi possível carregar o visual do jogo. Tente novamente.'))};document.head.append(css)})}
async function open(opts){try{if(!loading)loading=(async()=>{await style();await script('/games/constellations/engine.js?v='+V);await script('/games/constellations/game.js?v='+V)})();await loading;window.IASDConstellations.open(opts)}catch(e){loading=null;alert(e.message)}}
window.IASDConstellations={open};
/* links de convite: /jogos?seq=123456 (entrar) e /jogos?seqtelao=123456 (telão) */
try{const q=new URLSearchParams(location.search),c=q.get('seq'),t=q.get('seqtelao');
if(c||t){const go=()=>{open(t?{telao:t}:{code:c});try{history.replaceState(null,'',location.pathname)}catch{}};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(go,400)):setTimeout(go,400)}}catch{}
})();
