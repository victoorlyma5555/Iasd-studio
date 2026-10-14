/* Hero pública: celular e monitor animados pela rolagem com React + Framer Motion.
   Ilha carregada sob demanda (só para visitantes, só em telas largas). Se as bibliotecas não carregarem,
   a hero estática gerada por auLanding() continua valendo.
   Vídeos das telas: coloque os arquivos em design/assets (veja HERO_VIDEOS). Sem arquivo, usa a captura/demo atual. */
(function(){
  'use strict';
  const HERO_VIDEOS={
    studio:'/design/assets/hero-studio.mp4', /* 1920x1007 (16:8,4), sem barra do Windows */
    app:'/design/assets/hero-app.mp4'        /* 242x508 (celular em pé), ex.: 1080x2268 */
  };
  const LIBS=[
    'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
    'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js',
    'https://cdn.jsdelivr.net/npm/framer-motion@10.18.0/dist/framer-motion.js'
  ];
  const WIDE='(min-width:1101px)';
  let loading=null,active=null,pending=false,mql=null;

  function loadScript(src){return new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>fail(new Error(src));document.head.appendChild(s)})}
  function loadLibs(){
    if(window.React&&window.ReactDOM&&window.Motion)return Promise.resolve();
    if(!loading)loading=LIBS.reduce((p,src)=>p.then(()=>loadScript(src)),Promise.resolve()).catch(e=>{loading=null;throw e});
    return loading;
  }
  const reducedMotion=()=>!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  /* u = 1% da largura de projeto (mesma unidade --u do CSS) */
  function measure(){const W=innerWidth,H=innerHeight,u=Math.min(W/100,H*1.777/100);return{u,Hu:H/u}}
  const clamp=v=>Math.min(1,Math.max(0,v));
  const ease=v=>{v=clamp(v);return v<.5?4*v*v*v:1-Math.pow(-2*v+2,3)/2};
  const lerp=(a,b,t)=>a+(b-a)*t;
  function readProgress(el){const d=Math.max(1,el.offsetHeight-innerHeight);return clamp(-el.getBoundingClientRect().top/d)}

  function useVideoFile(url){
    const {useState,useEffect}=React;
    const [ok,setOk]=useState(false);
    useEffect(()=>{
      let live=true;
      fetch(url,{method:'HEAD'}).then(r=>{if(live&&r.ok&&/video/i.test(r.headers.get('content-type')||''))setOk(true)}).catch(()=>{});
      return()=>{live=false};
    },[url]);
    return ok;
  }
  function Video(props){
    const reduced=reducedMotion();
    return React.createElement('video',{className:'au-hero-video',src:props.src,poster:props.poster,muted:true,loop:true,playsInline:true,autoPlay:!reduced,preload:'auto','aria-hidden':'true'});
  }

  function Island(props){
    const h=React.createElement,M=Motion.motion;
    const {useRef,useEffect,useLayoutEffect}=React;
    const {useMotionValue,useSpring,useTransform,useMotionValueEvent}=Motion;
    /* Sem rotação 3D de propósito (mantém o texto da captura nítido). Movimento reduzido: mesma composição final, sem deslocar o texto e com mola mais firme. */
    const reduced=reducedMotion(),k=1;
    const studioVideo=useVideoFile(HERO_VIDEOS.studio),appVideo=useVideoFile(HERO_VIDEOS.app);
    /* Progresso medido direto no DOM (0 a 1 ao longo do trecho fixo da hero) e suavizado por mola. */
    const raw=useMotionValue(readProgress(props.landing));
    useEffect(()=>{
      const el=props.landing;let f=0;
      const upd=()=>{f=0;raw.set(readProgress(el))};
      const on=()=>{if(!f)f=requestAnimationFrame(upd)};
      upd();
      addEventListener('scroll',on,{passive:true});addEventListener('resize',on);
      return()=>{removeEventListener('scroll',on);removeEventListener('resize',on);if(f)cancelAnimationFrame(f)};
    },[]);
    const p=useSpring(raw,{stiffness:reduced?220:120,damping:reduced?34:28,mass:.6,restDelta:.0004});
    const mP=v=>ease((v-.12)/.8),pP=v=>ease(v/.42);

    /* Monitor: do canto direito (composição de referência) ao centro, plano e grande. */
    const MON={x:44.38,y:12.98,w:51.9,h:27.78},S1=1.28;
    const monScale=useTransform(p,v=>lerp(1,1+(S1-1)*k,mP(v)));
    const monX=useTransform(p,v=>{const g=measure();return lerp(0,(50-(MON.x+MON.w/2))*g.u*k,mP(v))});
    const monY=useTransform(p,v=>{const g=measure();return lerp(0,(g.Hu/2-1-(MON.y+MON.h/2))*g.u*k,mP(v))});
    /* Celular: na frente, depois sobe e encolhe para a direita. */
    const phScale=useTransform(p,v=>{const g=measure();return .0482*g.u*lerp(1,lerp(1,.6,k),pP(v))});
    const phX=useTransform(p,v=>{const g=measure();return lerp(0,(85-41.33)*g.u*k,pP(v))});
    const phY=useTransform(p,v=>{const g=measure();return lerp(0,(11-20.93)*g.u*k,pP(v))});
    const capOp=useTransform(p,v=>clamp((v-.62)/.22));
    const capY=useTransform(p,v=>16*(1-clamp((v-.62)/.22)));

    /* Texto, atalhos e foto de fundo (elementos fora da ilha) */
    useLayoutEffect(()=>{props.apply(p.get())},[]);
    useMotionValueEvent(p,'change',v=>props.apply(v));

    return h(React.Fragment,null,
      h(M.div,{className:'au-studio-monitor','aria-hidden':'true',style:{scale:monScale,x:monX,y:monY}},
        h('div',{className:'au-studio-screen'},
          studioVideo?h(Video,{src:HERO_VIDEOS.studio,poster:props.studioSrc}):h('img',{src:props.studioSrc,alt:'Captura real do IASD Studio'})),
        h('div',{className:'au-studio-stand'})),
      h(M.div,{className:'au-phone',style:{originX:0,originY:0,scale:phScale,x:phX,y:phY}},
        h('div',{className:'au-phone-hardware','aria-hidden':'true'}),
        appVideo
          ?h('div',{className:'au-phone-screen'},h(Video,{src:HERO_VIDEOS.app}))
          :h('div',{style:{display:'contents'},dangerouslySetInnerHTML:{__html:props.screenHTML}})),
      h(M.div,{className:'au-device-caption',style:{opacity:capOp,y:capY,x:'-50%'}},
        h('small',null,'IASD STUDIO'),h('strong',null,'Projeção e sonoplastia')));
  }

  function makeApply(landing){
    const q=s=>landing.querySelector(s);
    const copy=q('.au-landing-copy'),feat=q('.au-landing-features'),rule=q('.au-landing-rule');
    const k=reducedMotion()?0:1;
    return v=>{
      const t=ease(v/.4);
      if(copy){copy.style.opacity=String(1-t);copy.style.transform=`translate3d(${-3*t*k}vw,0,0)`;copy.style.pointerEvents=t>.8?'none':''}
      const f=String(clamp(1-v*3.4));
      if(feat){feat.style.opacity=f;feat.style.pointerEvents=v>.3?'none':''}
      if(rule)rule.style.opacity=f;
      landing.style.setProperty('--hp',v.toFixed(3));
    };
  }

  function teardown(){
    if(!active)return;
    const a=active;active=null;
    try{a.root.unmount()}catch(e){}
    if(a.stage.isConnected)a.stage.innerHTML=a.saved;
    delete a.stage.dataset.live;
    a.landing.classList.remove('au-hero-live');
    a.landing.style.removeProperty('--hp');
    ['.au-landing-copy','.au-landing-features','.au-landing-rule'].forEach(s=>{const el=a.landing.querySelector(s);if(el){el.style.removeProperty('opacity');el.style.removeProperty('transform');el.style.removeProperty('pointer-events')}});
  }

  function doMount(landing){
    const stage=landing.querySelector('.au-phone-stage');
    if(!stage||stage.dataset.live||!window.matchMedia(WIDE).matches)return;
    const screen=stage.querySelector('.au-phone-screen'),img=stage.querySelector('.au-studio-screen img');
    if(!screen||!img)return;
    const saved=stage.innerHTML;
    stage.dataset.live='1';
    landing.classList.add('au-hero-live');
    const root=ReactDOM.createRoot(stage);
    active={root,stage,landing,saved};
    ReactDOM.flushSync(()=>root.render(React.createElement(Island,{landing,studioSrc:img.getAttribute('src'),screenHTML:screen.outerHTML,apply:makeApply(landing)})));
  }

  function mount(landing){
    if(!landing)return;
    if(!mql){mql=window.matchMedia(WIDE);mql.addEventListener('change',()=>{if(!mql.matches)teardown();else mount(document.querySelector('.au-landing'))})}
    if(!mql.matches){teardown();return}
    if(active&&active.landing===landing&&active.stage.isConnected)return;
    if(active)teardown();
    if(pending)return;
    pending=true;
    loadLibs().then(()=>{pending=false;const cur=document.querySelector('.au-landing');if(cur&&document.body.classList.contains('iu-is-landing'))doMount(cur)}).catch(()=>{pending=false;window.IASDHeroFailed=true;const cur=document.querySelector('.au-landing');if(cur)cur.classList.remove('au-hero-live')});
  }
  window.IASDHeroScroll={mount,teardown,debug:()=>({active:!!active,same:!!active&&active.landing===document.querySelector('.au-landing'),stageConnected:!!active&&active.stage.isConnected,pending})};
})();
