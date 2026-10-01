/* Áudio dos jogos do IASD APP — tudo gerado no aparelho (sem arquivos de som).
   IASDGameAudio.sfx('correct') · .music('menu'|'play'|'tension'|'lobby'|null) · .setMusic(bool) · .setSfx(bool) · .vol(0..1) */
(function(){
'use strict';
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}};
const SS=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const st={music:LS('iasd_game_music','on')!=='off',sfx:LS('iasd_game_sound','on')!=='off',vol:Math.max(0,Math.min(1,Number(LS('iasd_game_volume',.6))||.6))};
let ctx=null,master=null,mGain=null,sGain=null,noiseBuf=null;
function C(){
 if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=new A();
  master=ctx.createGain();master.gain.value=st.vol;master.connect(ctx.destination);
  mGain=ctx.createGain();mGain.gain.value=.0001;mGain.connect(master);
  sGain=ctx.createGain();sGain.gain.value=1;sGain.connect(master);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
 if(ctx.state==='suspended')ctx.resume();return ctx}
function tone(f,d=.1,type='sine',v=.12,delay=0,dest,slide){
 const x=C();if(!x)return;const t=x.currentTime+delay,o=x.createOscillator(),g=x.createGain();
 o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+d);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+Math.min(.02,d/3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.connect(g);g.connect(dest||sGain);o.start(t);o.stop(t+d+.03)}
function noise(d=.15,v=.06,delay=0,dest,hp=0){
 const x=C();if(!x)return;const t=x.currentTime+delay,n=x.createBufferSource(),g=x.createGain();n.buffer=noiseBuf;n.loop=true;
 let node=n;if(hp){const f=x.createBiquadFilter();f.type='highpass';f.frequency.value=hp;n.connect(f);node=f}
 g.gain.setValueAtTime(Math.max(.0002,v),t);g.gain.exponentialRampToValueAtTime(.0001,t+d);node.connect(g);g.connect(dest||sGain);n.start(t);n.stop(t+d+.03)}
const n2f=m=>440*Math.pow(2,(m-69)/12);

const FX={
 click(){tone(520,.05,'sine',.07)},
 tap(){tone(380,.04,'triangle',.06)},
 join(){tone(523,.08,'sine',.09);tone(659,.12,'sine',.09,.07)},
 sent(){tone(620,.05,'sine',.06);tone(820,.08,'sine',.07,.04)},
 start(){[392,523,659,784].forEach((n,i)=>tone(n,.16,'triangle',.11,i*.08))},
 count(){tone(660,.12,'square',.07)},
 go(){tone(990,.3,'square',.09);tone(1320,.35,'triangle',.08,.02)},
 tick(){tone(880,.04,'square',.05)},
 urgent(){tone(1050,.07,'square',.09)},
 correct(){tone(523,.09,'triangle',.11);tone(659,.1,'triangle',.12,.07);tone(784,.2,'triangle',.14,.14)},
 wrong(){tone(220,.12,'sawtooth',.07);tone(165,.2,'sawtooth',.07,.09)},
 streak(){[660,784,990,1175,1318].forEach((n,i)=>tone(n,.1,'triangle',.1,i*.055))},
 flip(){tone(500,.06,'triangle',.07,0,null,760)},
 match(){tone(700,.08,'sine',.1);tone(930,.14,'sine',.11,.07);noise(.08,.03,.05,null,4000)},
 miss(){tone(260,.12,'triangle',.07,0,null,190)},
 whoosh(){noise(.25,.05,0,null,1200);tone(300,.25,'sine',.04,0,null,900)},
 pop(){tone(780,.06,'sine',.09,0,null,1200)},
 reveal(){tone(330,.1,'triangle',.08);tone(494,.18,'triangle',.1,.09)},
 drum(){for(let i=0;i<14;i++)noise(.06,.04+i*.004,i*.085,null,300)},
 coin(){tone(988,.06,'square',.06);tone(1319,.22,'square',.06,.06)},
 win(){noise(.35,.045);[523,659,784,1047].forEach((n,i)=>tone(n,.34,'triangle',.14,i*.11));setTimeout(()=>noise(.5,.055),380)},
 lose(){[392,349,311,262].forEach((n,i)=>tone(n,.26,'sine',.1,i*.14))},
 level(){[523,659,784,1047,1319].forEach((n,i)=>tone(n,.18,'triangle',.11,i*.07))}
};

/* ---------- música de fundo procedural ---------- */
const TRACKS={
 menu:{bpm:76,chords:[[60,64,67],[57,60,64],[53,57,60],[55,59,62]],bass:true,arp:true,drums:false,lead:false,wave:'sine',vol:.5},
 lobby:{bpm:96,chords:[[62,66,69],[59,62,66],[55,59,62],[57,61,64]],bass:true,arp:true,drums:true,lead:false,wave:'triangle',vol:.55},
 play:{bpm:112,chords:[[60,64,67],[55,59,62],[57,60,64],[53,57,60]],bass:true,arp:true,drums:true,lead:true,wave:'triangle',vol:.6},
 tension:{bpm:148,chords:[[57,60,64],[57,60,64],[53,57,60],[56,59,62]],bass:true,arp:true,drums:true,lead:false,wave:'square',vol:.45},
 victory:{bpm:120,chords:[[60,64,67],[65,69,72],[67,71,74],[60,64,67]],bass:true,arp:true,drums:true,lead:true,wave:'triangle',vol:.6}
};
let cur=null,timer=null,step=0,nextT=0;
function sched(tr){
 const x=C();if(!x)return;const spb=60/tr.bpm/2; /* colcheias */
 while(nextT<x.currentTime+.25){
  const i=step%8,bar=Math.floor(step/8)%tr.chords.length,ch=tr.chords[bar],t=nextT-x.currentTime;
  if(tr.arp){const pat=[0,1,2,1,2,1,2,1],m=ch[pat[i]]+(i%4===3?12:0);tone(n2f(m+12),spb*.9,tr.wave,.055*tr.vol,t,mGain)}
  if(tr.bass&&i%4===0)tone(n2f(ch[0]-12),spb*3.6,'sine',.16*tr.vol,t,mGain);
  if(i===0)ch.forEach(m=>tone(n2f(m),spb*7.6,'sine',.03*tr.vol,t,mGain));
  if(tr.drums){if(i%4===0)tone(120,.12,'sine',.22*tr.vol,t,mGain,45);if(i%4===2)noise(.05,.05*tr.vol,t,mGain,5000);if(i%2===1)noise(.02,.025*tr.vol,t,mGain,8000)}
  if(tr.lead&&(i===0||i===3||i===6)&&bar%2===1)tone(n2f(ch[2]+24),spb*1.6,'triangle',.04*tr.vol,t,mGain);
  nextT+=spb;step++}
}
function music(name){
 if(!name){stopMusic();return}
 if(cur===name&&timer)return;
 const x=C();if(!x)return;stopMusic(true);cur=name;step=0;nextT=x.currentTime+.08;
 if(!st.music)return;fadeTo(1,.8);
 timer=setInterval(()=>{if(cur&&TRACKS[cur])sched(TRACKS[cur])},60)}
function fadeTo(v,s){if(!mGain)return;const t=ctx.currentTime;mGain.gain.cancelScheduledValues(t);mGain.gain.setValueAtTime(Math.max(.0001,mGain.gain.value),t);mGain.gain.exponentialRampToValueAtTime(Math.max(.0001,v),t+s)}
function stopMusic(quick){clearInterval(timer);timer=null;if(mGain&&ctx){if(quick)mGain.gain.value=.0001;else fadeTo(.0001,.4)}if(!quick)cur=null}

const API={
 sfx(n){if(!st.sfx)return;try{FX[n]?.()}catch(e){}},
 music,stop:()=>stopMusic(),
 current:()=>cur,
 setMusic(on){st.music=!!on;SS('iasd_game_music',on?'on':'off');if(!on)stopMusic(false);else if(cur){const n=cur;cur=null;music(n)}return st.music},
 setSfx(on){st.sfx=!!on;SS('iasd_game_sound',on?'on':'off');if(on)FX.click();return st.sfx},
 vol(v){st.vol=Math.max(0,Math.min(1,Number(v)||0));SS('iasd_game_volume',String(st.vol));if(master)master.gain.value=st.vol},
 state:()=>({...st}),
 unlock(){C()},
 /* compatibilidade com o som antigo do jogo coletivo */
 toggle(){return API.setSfx(!st.sfx)},isOn:()=>st.sfx,volume:v=>API.vol(v)
};
Object.keys(FX).forEach(k=>{if(!(k in API))API[k]=()=>API.sfx(k)});
window.IASDGameAudio=API;
/* Celulares só liberam áudio dentro de um toque — e o iPhone ainda silencia o WebAudio no modo silencioso.
   A cada toque: retoma o contexto, toca um instante de silêncio e mantém um <audio> mudo em loop (põe o som como "mídia"). */
let mute=null;
function wake(){
 try{
  const x=C();if(!x)return;
  if(x.state!=='running')x.resume&&x.resume();
  const b=x.createBuffer(1,1,22050),n=x.createBufferSource();n.buffer=b;n.connect(x.destination);n.start(0);
  if(!mute){
   /* WAV mudo de 1 s com amostras de verdade. (O antigo tinha 0 amostras: em loop, o Chrome ficava girando sem parar e travava o computador.) */
   const sr=8000,n=sr,buf=new ArrayBuffer(44+n*2),v=new DataView(buf),w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
   w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
   mute=document.createElement('audio');mute.src=URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));mute.loop=true;mute.setAttribute('playsinline','');mute.volume=.01;
   mute.play&&mute.play().catch(()=>{mute=null})}
  else if(mute.paused)mute.play().catch(()=>{});
  if(cur&&st.music&&!timer){const n2=cur;cur=null;music(n2)}
 }catch(e){}
}
['touchstart','touchend','pointerdown','click','keydown'].forEach(ev=>addEventListener(ev,wake,{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ctx&&ctx.state!=='running')ctx.resume().catch(()=>{})});
API.unlock=wake;
})();
