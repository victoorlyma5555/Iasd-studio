(function(){
'use strict';
let loading;
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>{el.remove();reject(Error('Não foi possível carregar Constelações. Tente novamente.'))};document.head.append(el)})}
function style(){if(document.getElementById('cs-style'))return Promise.resolve();return new Promise((resolve,reject)=>{const css=document.createElement('link');css.id='cs-style';css.rel='stylesheet';css.href='/games/constellations/game.css?v=1';css.onload=resolve;css.onerror=()=>{css.remove();reject(Error('Não foi possível carregar o visual do jogo. Tente novamente.'))};document.head.append(css)})}
window.IASDConstellations={open:async function(){try{if(!loading)loading=(async()=>{await style();await script('/games/constellations/engine.js?v=1');await script('/games/constellations/game.js?v=1')})();await loading;window.IASDConstellations.open()}catch(e){loading=null;alert(e.message)}}};
})();
