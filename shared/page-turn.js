/* Virar página: efeito de folha de papel que se dobra e passa ao trocar de versículo no telão.
   A página antiga é fatiada em tiras verticais encadeadas em 3D (cada tira gira um pouco em relação à anterior),
   o que faz a folha "curvar" enquanto vira em torno da lombada, à esquerda. Por baixo já está a página nova. */
(function(){
'use strict';
const N=26;                       // tiras: mais = curva mais suave
let live=null;
const ease=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
function cleanup(){if(live){live.stop();live=null}}
function run(out,render,o){
 o=o||{};cleanup();
 const reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const box=out.getBoundingClientRect(),W=Math.round(box.width),H=Math.round(box.height);
 if(reduced||!W||!H){render();return}
 const ms=Math.min(2200,Math.max(500,o.ms||1250));
 /* foto da página antiga (o CSS do telão usa #out, então o clone mantém o id só durante o efeito) */
 const old=out.cloneNode(true);old.id='out';
 render();
 const stage=document.createElement('div');stage.className='pt-stage';
 stage.style.cssText='position:fixed;left:'+Math.round(box.left)+'px;top:'+Math.round(box.top)+'px;width:'+W+'px;height:'+H+'px;z-index:60;pointer-events:none;perspective:'+Math.round(W*3.4)+'px;perspective-origin:42% 50%;overflow:visible';
 const shadow=document.createElement('div');
 shadow.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;opacity:0';
 stage.append(shadow);
 const sw=W/N,strips=[],shades=[];
 let parent=stage;
 for(let i=0;i<N;i++){
  const s=document.createElement('div');
  s.style.cssText='position:absolute;top:0;left:'+(i?sw:0)+'px;width:'+(sw+1.2)+'px;height:'+H+'px;transform-origin:0 50%;transform-style:preserve-3d;will-change:transform';
  const f=document.createElement('div');
  f.style.cssText='position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden';
  const c=old.cloneNode(true);c.id='out';
  c.style.cssText=(old.getAttribute('style')||'')+';position:absolute;left:'+(-i*sw)+'px;top:0;width:'+W+'px;height:'+H+'px;margin:0;transform:none;opacity:1;animation:none';
  f.append(c);
  const sh=document.createElement('div');sh.style.cssText='position:absolute;inset:0;background:#000;opacity:0;pointer-events:none';f.append(sh);shades.push(sh);
  const b=document.createElement('div');
  b.style.cssText='position:absolute;inset:0;transform:rotateY(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden;background:linear-gradient(90deg,#d9cdb4,#efe5cf 40%,#e2d6bd);';
  s.append(f,b);parent.append(s);strips.push(s);parent=s}
 document.body.append(stage);
 const t0=performance.now();let raf=0,done=false;
 function stop(){if(done)return;done=true;cancelAnimationFrame(raf);stage.remove()}
 live={stop};
 function draw(k){
  if(done)return;
  k=Math.max(0,Math.min(1,k));const e=ease(k);
  const theta=-e*178;                         // giro total em torno da lombada
  const bend=-Math.sin(Math.PI*Math.min(1,e*1.05))*2.6;   // curvatura entre tiras: maior no meio do giro
  let a=theta,x=0;
  strips[0].style.transform='rotateY('+theta+'deg)';
  shades[0].style.opacity=String(Math.min(.55,(1-Math.abs(Math.cos(a*Math.PI/180)))*.5));
  for(let i=1;i<N;i++){
   strips[i].style.transform='rotateY('+bend+'deg)';
   a+=bend;x+=sw*Math.cos(a*Math.PI/180);
   shades[i].style.opacity=String(Math.min(.6,(1-Math.abs(Math.cos(a*Math.PI/180)))*.55));
  }
  x+=sw*Math.cos(theta*Math.PI/180);
  const edge=Math.max(0,Math.min(W,x));
  /* sombra da folha sobre a página nova, logo à frente da borda livre */
  shadow.style.opacity=String(k<1?Math.min(1,Math.sin(Math.PI*k)*1.4):0);
  shadow.style.background='linear-gradient(90deg,rgba(0,0,0,0) '+Math.max(0,edge-6)+'px,rgba(0,0,0,.42) '+edge+'px,rgba(0,0,0,0) '+Math.min(W,edge+W*.22)+'px)';
  if(k>=1)stop();
 }
 const frame=now=>{if(done)return;draw((now-t0)/ms);if(!done)raf=requestAnimationFrame(frame)};
 draw(0);
 if(o.manual)return {draw,stop};
 raf=requestAnimationFrame(frame);
 return {draw,stop};
}
window.IASDPageTurn={run,stop:cleanup};
})();
