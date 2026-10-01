/* Compartilhar versículo: cartão em imagem (feed/story) + texto, com divulgação discreta do app */
(function(){
const SITE='iasdapp.com.br',LOGO='/iasd-app-logo.png?v=1';
const THEMES={
 noite:{n:'Noite',a:'#0b1a3a',b:'#1e3a8a',txt:'#ffffff',acc:'#f5b73a',sub:'rgba(255,255,255,.62)'},
 aurora:{n:'Aurora',a:'#2b3a8c',b:'#c2683f',txt:'#ffffff',acc:'#ffd58a',sub:'rgba(255,255,255,.7)'},
 floresta:{n:'Floresta',a:'#073b34',b:'#2f8f6b',txt:'#ffffff',acc:'#ffe08a',sub:'rgba(255,255,255,.68)'},
 festa:{n:'Festa',a:'#4c1d95',b:'#db2777',txt:'#ffffff',acc:'#ffe08a',sub:'rgba(255,255,255,.72)'},
 claro:{n:'Claro',a:'#f6efe0',b:'#e8ecf7',txt:'#1a2547',acc:'#b8730a',sub:'rgba(26,37,71,.55)'}
};
const FORMATS={feed:{n:'Feed',w:1080,h:1080},story:{n:'Story',w:1080,h:1920}};
let S={text:'',ref:'',head:'',lines:null,title:'',theme:'noite',fmt:'feed',logo:null};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function clean(t){return String(t||'').replace(/^[\s“”"«»]+|[\s“”"«»]+$/g,'').replace(/\s+/g,' ')}
function plainText(){if(S.plain)return S.plain+'\n\n📖 IASD APP · '+SITE;return (S.head?S.head+'\n':'')+'“'+S.text+'”\n— '+S.ref+'\n\n📖 IASD APP · '+SITE}
function wrap(ctx,text,maxW){const words=text.split(' '),lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t}if(cur)lines.push(cur);return lines}
function draw(cv){
 const F=FORMATS[S.fmt],T=THEMES[S.theme];cv.width=F.w;cv.height=F.h;const x=cv.getContext('2d'),W=F.w,H=F.h;
 const g=x.createLinearGradient(0,0,W*.4,H);g.addColorStop(0,T.a);g.addColorStop(1,T.b);x.fillStyle=g;x.fillRect(0,0,W,H);
 const r=x.createRadialGradient(W*.8,H*.12,10,W*.8,H*.12,W*.7);r.addColorStop(0,'rgba(255,255,255,'+(S.theme==='claro'?.55:.16)+')');r.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=r;x.fillRect(0,0,W,H);
 const padX=W*.1,maxW=W-padX*2,top=H*(S.fmt==='story'?.2:.12),bot=H*(S.fmt==='story'?.76:.78);
 let hs=0,hl=[];
 if(S.head){hs=S.fmt==='story'?74:68;x.font='800 '+hs+'px Inter, system-ui, sans-serif';hl=wrap(x,S.head,maxW);if(hl.length>2){hs=Math.round(hs*.75);x.font='800 '+hs+'px Inter, system-ui, sans-serif';hl=wrap(x,S.head,maxW)}}
 const headH=hl.length?hl.length*hs*1.2+hs*.6:0;
 let fs=S.fmt==='story'?84:78,lines;
 for(;fs>34;fs-=3){x.font='600 '+fs+'px Georgia, "Times New Roman", serif';lines=S.list?S.list.flatMap(l=>wrap(x,l,maxW)):wrap(x,S.text,maxW);if(lines.length*fs*1.34+headH<=bot-top-150)break}
 x.font='600 '+fs+'px Georgia, "Times New Roman", serif';lines=S.list?S.list.flatMap(l=>wrap(x,l,maxW)):wrap(x,S.text,maxW);
 const lh=fs*1.34,blockH=lines.length*lh+150+headH,y0=top+Math.max(0,(bot-top-blockH)/2);
 x.textAlign='left';
 if(hl.length){x.fillStyle=T.acc;x.font='800 '+hs+'px Inter, system-ui, sans-serif';hl.forEach((l,i)=>x.fillText(l,padX,y0+hs*(1+i*1.2)))}
 else{x.fillStyle=T.acc;x.globalAlpha=.9;x.font='700 '+fs*2+'px Georgia, serif';x.fillText('“',padX-6,y0+fs*.9);x.globalAlpha=1}
 const y0b=y0+headH;
 x.fillStyle=T.txt;x.font='600 '+fs+'px Georgia, "Times New Roman", serif';x.textBaseline='alphabetic';
 lines.forEach((l,i)=>x.fillText(l,padX,y0b+fs*1.5+i*lh));
 const ry=y0b+fs*1.5+lines.length*lh+fs*.55;
 x.fillStyle=T.acc;x.fillRect(padX,ry-fs*.42,64,5);
 if(S.ref){x.font='700 '+Math.round(fs*.62)+'px Inter, system-ui, sans-serif';x.fillText(S.ref,padX,ry+fs*.45)}
 /* rodapé discreto */
 const fy=H-(S.fmt==='story'?170:92),ls=44;
 if(S.logo&&S.logo.complete&&S.logo.naturalWidth){x.globalAlpha=.9;x.drawImage(S.logo,padX,fy-ls+8,ls,ls);x.globalAlpha=1}
 x.fillStyle=T.sub;x.font='600 26px Inter, system-ui, sans-serif';x.fillText('IASD APP  ·  '+SITE,padX+ls+14,fy-4);
}
function toBlob(){return new Promise(res=>{const cv=document.createElement('canvas');draw(cv);cv.toBlob(b=>res(b),'image/png')})}
function toast(m){const m0=document.getElementById('vs-toast');if(!m0)return;m0.textContent=m;m0.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>m0.classList.remove('on'),2200)}
async function shareImage(){
 const b=await toBlob(),f=new File([b],'versiculo-iasd-app.png',{type:'image/png'});
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:plainText()});return true}}catch(e){if(e&&e.name==='AbortError')return true}
 download(b);return false;
}
function download(b){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='versiculo-iasd-app.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800)}
async function act(k){
 if(k==='wa'){window.open('https://wa.me/?text='+encodeURIComponent(plainText()),'_blank','noopener')}
 else if(k==='ig'){const ok=await shareImage();if(!ok)toast('Imagem salva. Abra o Instagram e poste nos Stories.')}
 else if(k==='img'){const ok=await shareImage();if(!ok)toast('Imagem salva na galeria/downloads.')}
 else if(k==='dl'){download(await toBlob());toast('Imagem salva')}
 else if(k==='copy'){try{await navigator.clipboard.writeText(plainText());toast('Texto copiado ✓')}catch(e){toast('Não foi possível copiar')}}
 else if(k==='more'){if(navigator.share)navigator.share({text:plainText()}).catch(()=>{});else act('copy')}
}
function paint(){const cv=document.getElementById('vs-cv');if(cv){draw(cv);cv.parentElement.className='vs-prev '+S.fmt}}
function close(){document.getElementById('vs-ov')?.remove();document.body.classList.remove('vs-lock')}
function open(o){
 close();S.head=o.head||'';S.list=o.list||null;S.plain=o.plain||'';S.title=o.title||'Compartilhar versículo';S.theme=o.theme||(S.theme==='festa'?'noite':S.theme);S.text=o.raw?String(o.text||''):clean(o.text);S.ref=o.noref?'':String(o.ref||'').replace(/\s*\([^)]*\)\s*$/,'')+(o.ver?' ('+o.ver+')':(/\(([^)]+)\)\s*$/.exec(o.ref||'')?' ('+/\(([^)]+)\)\s*$/.exec(o.ref)[1]+')':''));
 const ov=document.createElement('div');ov.id='vs-ov';ov.className='vs-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Compartilhar versículo');
 ov.innerHTML='<div class="vs-card"><button class="vs-x" data-vs="close" aria-label="Fechar">✕</button><h3>'+esc(S.title)+'</h3><div class="vs-prev feed"><canvas id="vs-cv"></canvas></div>'+
 '<div class="vs-row" role="group" aria-label="Formato">'+Object.entries(FORMATS).map(([k,v])=>'<button class="vs-chip'+(S.fmt===k?' on':'')+'" data-fmt="'+k+'">'+v.n+(k==='feed'?' · 1:1':' · 9:16')+'</button>').join('')+'</div>'+
 '<div class="vs-row sw" role="group" aria-label="Estilo">'+Object.entries(THEMES).map(([k,v])=>'<button class="vs-sw'+(S.theme===k?' on':'')+'" data-th="'+k+'" title="'+v.n+'" aria-label="'+v.n+'" style="background:linear-gradient(135deg,'+v.a+','+v.b+')"></button>').join('')+'</div>'+
 '<div class="vs-act"><button class="vs-b wa" data-vs="wa"><b>WhatsApp</b><small>texto + link</small></button><button class="vs-b ig" data-vs="ig"><b>Instagram</b><small>imagem para Stories</small></button><button class="vs-b" data-vs="img"><b>Enviar imagem</b><small>qualquer app</small></button><button class="vs-b" data-vs="dl"><b>Baixar</b><small>salvar PNG</small></button><button class="vs-b" data-vs="copy"><b>Copiar texto</b><small>com a referência</small></button></div>'+
 '<p class="vs-foot">O cartão leva só uma assinatura discreta do IASD APP.</p><div id="vs-toast" class="vs-toast" role="status"></div></div>';
 document.body.appendChild(ov);document.body.classList.add('vs-lock');
 if(!S.logo){S.logo=new Image();S.logo.onload=paint;S.logo.src=LOGO}
 paint();
 ov.addEventListener('click',e=>{
  if(e.target===ov)return close();
  const t=e.target.closest('[data-vs],[data-fmt],[data-th]');if(!t)return;
  if(t.dataset.vs==='close')return close();
  if(t.dataset.fmt){S.fmt=t.dataset.fmt;ov.querySelectorAll('[data-fmt]').forEach(b=>b.classList.toggle('on',b===t));return paint()}
  if(t.dataset.th){S.theme=t.dataset.th;ov.querySelectorAll('[data-th]').forEach(b=>b.classList.toggle('on',b===t));return paint()}
  act(t.dataset.vs);
 });
 document.addEventListener('keydown',function k(e){if(!document.getElementById('vs-ov')){document.removeEventListener('keydown',k);return}if(e.key==='Escape')close()});
 ov.querySelector('.vs-b').focus();
}
window.IASDVerseShare={open,close};
})();
