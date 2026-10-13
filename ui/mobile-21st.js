/* IASD APP — camada mobile "m21" (comportamento). Par do arquivo ui/mobile-21st.css.
   Só decora o que ui/shell.js já desenha; não altera nenhuma ação do app (data-go / data-act continuam valendo).
   Como o shell redesenha áreas inteiras com innerHTML, tudo aqui é idempotente e reaplicado por um MutationObserver.
   Se algo falhar, o visual anterior continua funcionando. */
(function(){
'use strict';
if(window.__m21)return;window.__m21=true;

const rm=matchMedia('(prefers-reduced-motion: reduce)');
const small=matchMedia('(max-width:900px)');
const phone=matchMedia('(max-width:700px)');
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const buzz=ms=>{try{if(!rm.matches&&navigator.vibrate)navigator.vibrate(ms)}catch(e){}};
document.documentElement.classList.add('m21-js');

/* ---------- cabeçalho: encolhe ao rolar e se esconde ao descer ---------- */
let lastY=0,down=0,up=0,ticking=false;
function onScroll(){
  if(ticking)return;ticking=true;
  requestAnimationFrame(()=>{
    ticking=false;
    const y=Math.max(0,window.scrollY||document.documentElement.scrollTop||0),dy=y-lastY;lastY=y;
    const b=document.body;if(!b)return;
    b.classList.toggle('m21-scrolled',y>8);
    if(dy>0){down+=dy;up=0}else if(dy<0){up-=dy;down=0}
    const typing=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.iu-search');
    if(small.matches&&y>90&&down>28&&!typing&&!b.classList.contains('iu-open'))b.classList.add('m21-hide');
    else if(up>10||y<=90||typing)b.classList.remove('m21-hide');
  });
}
window.addEventListener('scroll',onScroll,{passive:true});

/* ---------- ripple nos botões do topo ---------- */
document.addEventListener('pointerdown',e=>{
  const t=e.target.closest&&e.target.closest('.iu-ib,.iu-me');
  if(t&&!rm.matches){
    const r=t.getBoundingClientRect(),s=document.createElement('span');
    s.className='m21-rpl';s.style.left=(e.clientX-r.left)+'px';s.style.top=(e.clientY-r.top)+'px';
    t.appendChild(s);setTimeout(()=>s.remove(),620);
  }
  if(e.target.closest&&e.target.closest('.iu-bn button,.au-tile,.iu-ex'))buzz(6);
},{passive:true});

/* ---------- menu inferior: indicador deslizante (tubelight) + lupa do dock ---------- */
let prevX=null,prevW=null;
function placeIndicator(){
  const bar=$('#iu-bn');if(!bar)return;
  let ind=$('.m21-ind',bar);
  const on=$('button.on:not(.iu-bn-menu)',bar);
  if(!ind){
    ind=document.createElement('span');ind.className='m21-ind';ind.setAttribute('aria-hidden','true');
    if(prevX!==null){ /* recria na posição anterior para a troca de aba deslizar em vez de pular */
      ind.classList.add('m21-snap');ind.style.setProperty('--x',prevX+'px');ind.style.setProperty('--w',prevW+'px');
      bar.insertBefore(ind,bar.firstChild);void ind.offsetWidth;ind.classList.remove('m21-snap');
    }else{ind.classList.add('m21-snap');bar.insertBefore(ind,bar.firstChild)}
  }
  if(!on){ind.style.opacity='0';return}
  ind.style.opacity='1';
  const x=on.offsetLeft,w=on.offsetWidth;
  if(prevX===null&&ind.classList.contains('m21-snap')){ind.style.setProperty('--x',x+'px');ind.style.setProperty('--w',w+'px');void ind.offsetWidth;ind.classList.remove('m21-snap')}
  else{ind.style.setProperty('--x',x+'px');ind.style.setProperty('--w',w+'px')}
  prevX=x;prevW=w;
}
function dockMagnify(e){
  const bar=$('#iu-bn');if(!bar||!bar.contains(e.target)||rm.matches)return;
  $$('button',bar).forEach(b=>{
    const r=b.getBoundingClientRect(),d=Math.abs(e.clientX-(r.left+r.width/2));
    b.style.setProperty('--m21-s',(1+.38*Math.max(0,1-d/92)).toFixed(3));
  });
}
function dockReset(){const bar=$('#iu-bn');if(bar)$$('button',bar).forEach(b=>b.style.removeProperty('--m21-s'))}
let dockDown=false;
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('#iu-bn')){dockDown=true;dockMagnify(e)}},{passive:true});
document.addEventListener('pointermove',e=>{if(dockDown)dockMagnify(e)},{passive:true});
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,()=>{if(dockDown){dockDown=false;setTimeout(dockReset,140)}},{passive:true}));

/* ---------- gaveta: cascata + arrastar para fechar ---------- */
function stagger(){
  const side=$('#iu-side');if(!side||!document.body.classList.contains('iu-open'))return;
  Array.from(side.children).forEach((c,i)=>c.style.setProperty('--i',Math.min(i,16)));
}
let sx=0,sy=0,sdx=0,dragging=false,decided=false;
document.addEventListener('touchstart',e=>{
  const side=e.target.closest&&e.target.closest('#iu-side');
  if(!side||!document.body.classList.contains('iu-open'))return;
  const t=e.touches[0];sx=t.clientX;sy=t.clientY;sdx=0;dragging=false;decided=false;
},{passive:true});
document.addEventListener('touchmove',e=>{
  const side=$('#iu-side');if(!side||!document.body.classList.contains('iu-open')||!e.touches.length)return;
  if(!(e.target.closest&&e.target.closest('#iu-side')))return;
  const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  if(!decided&&(Math.abs(dx)>8||Math.abs(dy)>8)){decided=true;dragging=Math.abs(dx)>Math.abs(dy)&&dx<0}
  if(!dragging)return;
  sdx=Math.min(0,dx);side.classList.add('m21-drag');side.style.transform='translateX('+sdx+'px)';
},{passive:true});
function endDrag(){
  const side=$('#iu-side');if(!side)return;
  const close=dragging&&sdx<-70;
  side.classList.remove('m21-drag');side.style.transform='';
  if(close)document.body.classList.remove('iu-open');
  dragging=false;decided=false;sdx=0;
}
document.addEventListener('touchend',endDrag,{passive:true});
document.addEventListener('touchcancel',endDrag,{passive:true});

/* ---------- acesso rápido: spotlight + inclinação 3D ---------- */
let hot=null;
function tileMove(e){
  if(!hot)return;
  const r=hot.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  hot.style.setProperty('--mx',(e.clientX-r.left)+'px');hot.style.setProperty('--my',(e.clientY-r.top)+'px');
  const nx=Math.max(-1,Math.min(1,(e.clientX-cx)/(r.width/2))),ny=Math.max(-1,Math.min(1,(e.clientY-cy)/(r.height/2)));
  hot.style.setProperty('--ry',(nx*14).toFixed(1)+'deg');hot.style.setProperty('--rx',(-ny*14).toFixed(1)+'deg');
}
function tileEnd(){
  if(!hot)return;
  hot.classList.remove('m21-hot');
  const t=hot;setTimeout(()=>{t.style.removeProperty('--rx');t.style.removeProperty('--ry')},320);
  hot=null;
}
document.addEventListener('pointerdown',e=>{
  if(!phone.matches||rm.matches)return;
  const t=e.target.closest&&e.target.closest('.au-tile');if(!t)return;
  hot=t;t.classList.add('m21-hot');tileMove(e);
},{passive:true});
document.addEventListener('pointermove',tileMove,{passive:true});
['pointerup','pointercancel','pointerleave'].forEach(t=>document.addEventListener(t,tileEnd,{passive:true}));

let dockSeen=false;
function enhanceDock(){
  $$('.au-dock:not([data-m21])').forEach(dock=>{
    dock.setAttribute('data-m21','1');
    $$('.au-tile',dock).forEach((t,i)=>t.style.setProperty('--i',i));
    if(dockSeen||rm.matches||!('IntersectionObserver' in window)){dock.classList.add('m21-in','m21-still');return}
    const io=new IntersectionObserver(es=>{
      if(es.some(x=>x.isIntersecting)){dock.classList.add('m21-in');dockSeen=true;io.disconnect()}
    },{threshold:.25});
    io.observe(dock);
    setTimeout(()=>{if(!dock.classList.contains('m21-in')){dock.classList.add('m21-in','m21-still')}io.disconnect()},2500);
  });
}

/* ---------- comunidade: carrossel com centralização ---------- */
let peeked=false;
function enhanceExtras(){
  $$('.iu-extras .iu-qg:not([data-m21])').forEach(qg=>{
    qg.setAttribute('data-m21','1');
    const cards=$$('.iu-ex',qg);if(cards.length<2)return;
    /* cor de cada item: vem do gradiente inline que o shell já define (o skin Aurora o sobrepõe com vidro) */
    cards.forEach(c=>{
      const m=(c.getAttribute('style')||'').match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g)||(c.style.background||'').match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g);
      const tri=x=>x.replace(/[^\d,]/g,'').replace(/,\s*/g,',');
      if(m&&m[0]){c.style.setProperty('--m21-c1',tri(m[0]));c.style.setProperty('--m21-c2',tri(m[1]||m[0]))}
    });
    const dots=document.createElement('div');dots.className='m21-dots';dots.setAttribute('role','tablist');
    dots.innerHTML=cards.map((c,i)=>{const nm=(c.querySelector('b')||{}).textContent||('Item '+(i+1));return '<button type="button" role="tab" aria-label="'+nm.replace(/"/g,'')+'"></button>'}).join('');
    qg.insertAdjacentElement('afterend',dots);
    const db=$$('button',dots);
    let raf=0;
    const update=()=>{
      raf=0;
      if(!phone.matches){cards.forEach(c=>{c.style.removeProperty('--m21-p');c.classList.remove('m21-active')});return}
      const box=qg.getBoundingClientRect(),mid=box.left+box.width/2;
      let best=0,bd=1e9;
      cards.forEach((c,i)=>{
        const r=c.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-mid);
        c.style.setProperty('--m21-p',Math.max(0,1-d/(box.width*.62)).toFixed(3));
        if(d<bd){bd=d;best=i}
      });
      cards.forEach((c,i)=>c.classList.toggle('m21-active',i===best));
      db.forEach((b,i)=>{b.classList.toggle('on',i===best);b.setAttribute('aria-selected',String(i===best))});
    };
    qg.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});
    db.forEach((b,i)=>b.addEventListener('click',()=>{cards[i].scrollIntoView({behavior:rm.matches?'auto':'smooth',inline:'center',block:'nearest'})}));
    update();
    /* dica de que dá para arrastar: um empurrãozinho, uma única vez por sessão */
    if(!peeked&&phone.matches&&!rm.matches&&'IntersectionObserver' in window){
      let seen=false;try{seen=sessionStorage.getItem('m21-peek')==='1'}catch(e){}
      if(!seen){
        const io=new IntersectionObserver(es=>{
          if(es.some(x=>x.isIntersecting&&x.intersectionRatio>.6)){
            io.disconnect();peeked=true;try{sessionStorage.setItem('m21-peek','1')}catch(e){}
            setTimeout(()=>{if(qg.scrollLeft<4){qg.style.scrollSnapType='none';qg.scrollTo({left:54,behavior:'smooth'});
              setTimeout(()=>{qg.scrollTo({left:0,behavior:'smooth'});setTimeout(()=>{qg.style.scrollSnapType=''},420)},520)}},350);
          }
        },{threshold:[.6]});
        io.observe(qg);
      }
    }
  });
}

/* ---------- reaplicar depois de cada redesenho do shell ---------- */
let pending=false;
function enhance(){
  pending=false;
  try{placeIndicator()}catch(e){}
  try{enhanceDock()}catch(e){}
  try{enhanceExtras()}catch(e){}
  try{stagger()}catch(e){}
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(enhance)}}
function start(){
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  new MutationObserver(()=>{stagger();onScroll()}).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',()=>{placeIndicator();$$('.iu-extras .iu-qg').forEach(q=>q.dispatchEvent(new Event('scroll')))},{passive:true});
  if('ResizeObserver' in window){const bar=$('#iu-bn');if(bar)new ResizeObserver(()=>placeIndicator()).observe(bar)}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule);
  enhance();
}
if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
})();
