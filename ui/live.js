/* Atualização instantânea: o que muda no site chega a todos sem F5.
   1) Dados (cronogramas, textos, imagens, abas, tema, vídeos): Supabase Realtime + consulta de reserva.
   2) Código (nova versão publicada): detecta e recarrega sozinho quando for seguro. */
(function(){
 const TABLES={
  iasd_schedules:()=>typeof loadCloud==='function'&&loadCloud(),
  iasd_site_content:()=>typeof loadSiteText==='function'&&loadSiteText(),
  iasd_site_assets:()=>typeof loadSiteBanner==='function'&&loadSiteBanner(),
  iasd_custom_tabs:()=>typeof loadCustomTabs==='function'&&loadCustomTabs(),
  iasd_site_theme:()=>typeof loadActiveTheme==='function'&&loadActiveTheme(),
  iasd_offering_videos:()=>{try{window.dispatchEvent(new Event('iasd-live-videos'))}catch(e){}}
 };
 const pending=new Set();let timer=null,ch=null,lastRun=0,lastVer=null,reloadAsked=false;
let lastTouch=Date.now();['touchstart','touchmove','pointerdown','keydown','wheel','scroll'].forEach(e=>window.addEventListener(e,()=>{lastTouch=Date.now()},{passive:true,capture:true}));
 const idle=()=>Date.now()-lastTouch>5000;
 const typing=()=>{const a=document.activeElement;return !!a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable)};
 const busy=()=>typing()||!!document.querySelector('.vs-back,.ex-back,.vbar,#sg-tm-bar')||(typeof current!=='undefined'&&(current==='Jogo'||current==='Bíblia'));
 function flush(){
  timer=null;
  if(document.hidden||busy()){timer=setTimeout(flush,2500);return}
  const keys=[...pending];pending.clear();lastRun=Date.now();
  // loadCloud já recarrega cronogramas e banner; evita repetir
  if(keys.includes('iasd_schedules')){const i=keys.indexOf('iasd_site_assets');if(i>-1)keys.splice(i,1)}
  keys.forEach(k=>{try{Promise.resolve(TABLES[k]()).catch(()=>{})}catch(e){}});
 }
 function queue(k){pending.add(k);if(!timer)timer=setTimeout(flush,700)}
 function subscribe(){
  if(ch||typeof cloud==='undefined'||!cloud||!cloud.channel)return;
  try{
   ch=cloud.channel('iasd-live-site');
   Object.keys(TABLES).forEach(t=>ch.on('postgres_changes',{event:'*',schema:'public',table:t},()=>queue(t)));
   ch.subscribe();
  }catch(e){ch=null}
 }
 // consulta de reserva: se o realtime não estiver ativo numa tabela, ainda atualiza sozinho
 function poll(){if(document.hidden||Date.now()-lastRun<20000)return;Object.keys(TABLES).forEach(queue)}
 /* ---- versão do código ---- */
 async function version(){
  try{
   const r=await fetch('/index.html?_='+Date.now(),{cache:'no-store'});if(!r.ok)return;
   const t=await r.text(),m=(t.match(/(?:src|href)="\/[^"]+\?v=\d+"/g)||[]).sort().join('|');
   if(lastVer===null){lastVer=m;return}
   if(m&&m!==lastVer)newVersion();
  }catch(e){}
 }
 function newVersion(){
  if(reloadAsked)return;reloadAsked=true;
  const go=()=>{try{const t=+sessionStorage.getItem('iasd-live-rl')||0;if(Date.now()-t<120000)return;sessionStorage.setItem('iasd-live-rl',String(Date.now()))}catch(e){}try{location.reload()}catch(e){}};
  const modal=()=>!!document.querySelector('.vs-back,.ex-back,.vbar,#sg-tm-bar');
  const tryReload=()=>{
   // volta do segundo plano (app da tela inicial): recarrega na hora; em uso: espera 5 s sem toque; nunca com teclado/popup aberto
   if(document.hidden){go();return}
   if(!typing()&&!modal()&&idle()&&!(typeof current!=='undefined'&&current==='Jogo')){toast();setTimeout(go,1500)}else setTimeout(tryReload,3000)};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)go()});
  tryReload();
 }
 function toast(){
  const d=document.createElement('div');d.textContent='✨ Atualizando o site com novidades…';
  d.style.cssText='position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);z-index:9999;background:#0b1730;color:#fff;border:1px solid #f5b73a;border-radius:999px;padding:10px 18px;font:600 14px system-ui;box-shadow:0 10px 30px rgba(0,0,0,.4)';
  document.body.appendChild(d);
 }
 function start(){
  subscribe();setTimeout(subscribe,4000);setTimeout(subscribe,12000);
  version();setInterval(version,15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)version()});
  window.addEventListener('online',()=>version());
 }
 if(document.readyState==='complete')setTimeout(start,1500);else window.addEventListener('load',()=>setTimeout(start,1500));
})();
