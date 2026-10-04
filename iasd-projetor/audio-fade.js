/* One cancellable envelope per media element, shared by the site and Electron. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory;
 else root.IASDAudio=root.IASDAudio||factory();
})(typeof globalThis!=='undefined'?globalThis:this,function createAudioFade(){
 const states=new WeakMap();
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 function state(a){let s=states.get(a);if(!s){s={target:clamp(a.volume),timer:0,finish:null,kind:'',generation:0,play:a.play.bind(a),pause:a.pause.bind(a)};states.set(a,s);a.addEventListener?.('volumechange',()=>{if(s.kind&&s.expected!=null&&Math.abs(a.volume-s.expected)>.001)a.volume=s.expected})}return s}
 function cancel(a){const s=state(a);++s.generation;clearTimeout(s.timer);s.timer=0;if(s.finish)s.finish(false);s.finish=null;s.kind='';s.expected=null;return s}
 function configuredDuration(base,c){const f=Number(c.f)||1;const preset={0.6:1500,1:3000,1.8:5000}[f];return preset??Math.max(0,Math.round(base*f))}
 function presetDuration(base){try{return configuredDuration(base,JSON.parse(localStorage.getItem('iasd-fade')||'{}'))}catch{return base}}
 function duration(base,entry=false){try{const c=JSON.parse(localStorage.getItem('iasd-fade')||'{}');if(c.on===false||(entry&&c.i===false))return 0;return configuredDuration(base,c)}catch{return base}}
 function ramp(a,to,ms,kind,done){
  const s=cancel(a),from=clamp(a.volume);s.kind=kind;
  return new Promise(resolve=>{s.finish=resolve;const start=performance.now();
   function step(){const k=ms>0?Math.min(1,(performance.now()-start)/ms):1;
    s.expected=from+(to-from)*(k*k*(3-2*k));a.volume=s.expected;
    if(k<1)s.timer=setTimeout(step,16);
    else{s.timer=0;s.finish=null;s.kind='';if(done)done();resolve(true)}
   }step();
  });
 }
 function play(a,ms=duration(220,true)){
  const s=state(a),resuming=s.kind==='pause';
  if(!s.kind)s.target=clamp(a.volume);
  cancel(a);if(!resuming&&a.paused)a.volume=ms?0:s.target;
  s.kind='play';s.expected=a.volume;const generation=s.generation;
  // Set volume before play(), never in a delayed `play` listener.
  const p=s.play();
  return Promise.resolve(p).then(()=>{if(generation===s.generation)void ramp(a,s.target,ms,'play')}).catch(e=>{if(generation===s.generation){cancel(a);a.volume=s.target}throw e});
 }
 function pause(a,ms=duration(180),done){
  const s=state(a);if(!s.kind)s.target=clamp(a.volume);
  return ramp(a,0,a.paused?0:ms,'pause',()=>{s.pause();a.volume=s.target;if(done)done()});
 }
 function volume(a,v){const s=state(a);s.target=clamp(v);if(s.kind==='play')void ramp(a,s.target,100,'play');else if(s.kind!=='pause')a.volume=s.target}
 function immediate(a){const s=cancel(a);s.pause();a.volume=s.target}
 function install(a){
  const s=state(a);if(s.installed)return;s.installed=true;
  a.play=()=>play(a);a.pause=()=>{void pause(a)};
  // Browser controls can start playback without invoking the JS play method.
  a.addEventListener?.('play',()=>{if(s.kind)return;s.target=clamp(a.volume);const ms=duration(220,true);if(ms){a.volume=0;s.kind='armed';void play(a,ms).catch(()=>{})}});
 }
 function toggle(a){return a.paused||state(a).kind==='pause'?play(a):pause(a)}
 return{play,pause,volume,cancel,immediate,install,toggle,duration,presetDuration,ramp,state};
});
