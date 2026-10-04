import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../iasd-projetor/audio-fade.js',import.meta.url),'utf8');
function fixture(config={}){
 let now=0,id=0;const timers=new Map();
 const context=vm.createContext({module:{exports:{}},performance:{now:()=>now},localStorage:{getItem:()=>JSON.stringify(config)},setTimeout:(f,ms)=>{timers.set(++id,{at:now+ms,f});return id},clearTimeout:n=>timers.delete(n)});
 vm.runInContext(source,context);const api=context.module.exports();
 const media={volume:.6,paused:true,atPlay:[],pauses:0,play(){this.atPlay.push(this.volume);this.paused=false;return Promise.resolve()},pause(){this.paused=true;this.pauses++}};
 async function tick(ms){await Promise.resolve();await Promise.resolve();const end=now+ms;for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;timers.delete(next[0]);next[1].f();await Promise.resolve()}now=end;await Promise.resolve()}
 return{api,media,tick,timers,context};
}
test('entrada arma volume zero antes de play e restaura o volume escolhido',async()=>{
 const {api,media,tick}=fixture();await api.play(media,200);assert.equal(media.atPlay[0],0);await tick(80);assert.ok(media.volume>0&&media.volume<.6);await tick(150);assert.equal(media.volume,.6);
});
test('play durante fade de pausa cancela pausa e limpeza antigas',async()=>{
 const {api,media,tick,timers}=fixture();media.paused=false;let cleared=false;const old=api.pause(media,200,()=>{cleared=true});await tick(80);await api.play(media,100);assert.equal(await old,false);await tick(250);assert.equal(media.paused,false);assert.equal(cleared,false);assert.equal(media.volume,.6);assert.equal(timers.size,0);
});
test('pausa durante entrada ganha e não deixa a rampa antiga voltar',async()=>{
 const {api,media,tick}=fixture();await api.play(media,200);await tick(64);const p=api.pause(media,80);await tick(240);assert.equal(await p,true);assert.equal(media.paused,true);assert.equal(media.volume,.6);
});
test('zero significa imediato, inclusive callback de encerramento',async()=>{
 const {api,media}=fixture();media.paused=false;let stopped=false;await api.pause(media,0,()=>{stopped=true});assert.equal(stopped,true);assert.equal(media.paused,true);
});
test('Assistive Touch respeita desligado, entrada desligada e velocidade',()=>{
 assert.equal(fixture({on:false}).api.duration(220,true),0);assert.equal(fixture({i:false}).api.duration(220,true),0);assert.equal(fixture({i:false}).api.duration(180),180);assert.equal(fixture({f:2}).api.duration(180),360);
});
test('volume alterado durante entrada usa o novo alvo',async()=>{
 const {api,media,tick}=fixture();await api.play(media,200);await tick(32);api.volume(media,.25);await tick(220);assert.equal(media.volume,.25);
});
test('play pendente antigo não reativa som depois de stop',async()=>{
 const {api,media,tick}=fixture();let ready;media.play=()=>{media.paused=false;return new Promise(r=>ready=r)};const p=api.play(media,200);await tick(300);assert.equal(media.volume,0);await api.pause(media,0);ready();await p;await tick(300);assert.equal(media.paused,true);assert.equal(media.volume,.6);
});
test('elementos instalados usam a mesma rampa e alternância rápida',async()=>{
 const {api,media,tick}=fixture();api.install(media);await media.play();await tick(300);media.pause();await tick(32);await api.toggle(media);await tick(400);assert.equal(media.paused,false);assert.equal(media.volume,.6);
});
test('falha de play anterior não cancela comando posterior',async()=>{
 const {api,media,tick}=fixture();let reject;let calls=0;media.play=()=>{media.paused=false;return ++calls===1?new Promise((_,r)=>reject=r):Promise.resolve()};const old=api.play(media,200).catch(()=>{});await api.play(media,100);reject(Error('interrompido'));await old;await tick(200);assert.equal(media.paused,false);assert.equal(media.volume,.6);
});
test('YouTube arma volume antes de liberar áudio e conserva alvo',async()=>{
 const {api,media,tick,context}=fixture();media.paused=false;
 const main=fs.readFileSync(new URL('../iasd-projetor/main.js',import.meta.url),'utf8');
 const fn=main.slice(main.indexOf('async function youtubeAudio('),main.indexOf('\nfunction closeYoutube'));
 context.audioBootstrap='';context.window={IASDAudio:api};context.IASDAudio=api;context.document={querySelector:()=>media};vm.runInContext(fn,context);
 const win={isDestroyed:()=>false,webContents:{executeJavaScript:code=>vm.runInContext(code,context)}};
 assert.equal(await context.youtubeAudio(win,'play',220,true),true);assert.equal(media.atPlay[0],0);await tick(300);assert.equal(media.volume,.6);
 await context.youtubeAudio(win,'pause',100);await tick(32);await context.youtubeAudio(win,'play',100);await tick(200);assert.equal(media.paused,false);assert.equal(media.volume,.6);
});
test('fechamento pendente não destrói uma nova projeção',async()=>{
 const main=fs.readFileSync(new URL('../iasd-projetor/main.js',import.meta.url),'utf8');
 const fn=main.slice(main.indexOf('async function closeProjectionAudio('),main.indexOf('\nfunction closeYoutube'));
 let finish;let closes=0;
 const win={isDestroyed:()=>false,close:()=>closes++};
 const ctx=vm.createContext({audioCommand:0,lastFadeOutMs:180,youtubeRef:win,windowRef:win,fadeAudioIn:()=>new Promise(r=>finish=r),fadeWin:()=>Promise.resolve(),closeYoutube:()=>closes++});
 // Independent windows resolve independently, just like executeJavaScript promises.
 const resolvers=[];ctx.fadeAudioIn=()=>new Promise(r=>resolvers.push(r));vm.runInContext(fn,ctx);
 const pending=ctx.closeProjectionAudio(180);ctx.audioCommand++;resolvers.forEach(r=>r());await pending;assert.equal(closes,0);
 const latest=ctx.closeProjectionAudio(180);resolvers.forEach(r=>r());await latest;assert.equal(closes,2);
});
test('fechamento não destrói janelas substituídas durante a espera',async()=>{
 const main=fs.readFileSync(new URL('../iasd-projetor/main.js',import.meta.url),'utf8');
 const fn=main.slice(main.indexOf('async function closeProjectionAudio('),main.indexOf('\nfunction closeYoutube'));
 const resolvers=[];let closes=0;
 const win={isDestroyed:()=>false,close:()=>closes++};
 const ctx=vm.createContext({audioCommand:0,lastFadeOutMs:180,youtubeRef:win,windowRef:win,fadeAudioIn:()=>new Promise(r=>resolvers.push(r)),fadeWin:()=>Promise.resolve(),closeYoutube:()=>closes++});vm.runInContext(fn,ctx);
 const pending=ctx.closeProjectionAudio(180);ctx.youtubeRef={};ctx.windowRef={};resolvers.forEach(r=>r());await pending;assert.equal(closes,0);
});
