'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFile}=require('node:child_process');
let logFile=null;
function setLogFile(file){logFile=file;}
function projectionLog(level,...args){
 console[level](...args);
 if(!logFile)return;
 try{if(fs.existsSync(logFile)&&fs.statSync(logFile).size>1024*1024)fs.renameSync(logFile,logFile+'.previous');fs.appendFileSync(logFile,new Date().toISOString()+' '+args.join(' ')+'\n');}catch(e){console.warn('Diagnóstico de projeção:',e.message);}
}
function nativeTopology(){
 if(process.platform!=='win32')return Promise.resolve([]);
 // PowerShell is outside Electron and cannot read files inside app.asar.
 const nativeDir=__dirname.replace(/app\.asar([\\/]|$)/,'app.asar.unpacked$1');
 return new Promise((resolve,reject)=>execFile(path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(nativeDir,'windows-topology.ps1')],{windowsHide:true,timeout:10000,maxBuffer:1024*1024},(e,out)=>{
  if(e)return reject(e);try{resolve(JSON.parse(out.replace(/^\uFEFF/,'')))}catch(error){reject(error)}
 }));
}
function validBounds(b){return !!b&&['x','y','width','height'].every(k=>Number.isFinite(b[k]))&&b.width>0&&b.height>0;}
function logicalOutputs(displays,primaryId,paths,toDip){
 const groups=new Map();
 for(const p of paths){if(!p.connected||!validBounds(p.bounds))continue;const g=groups.get(p.sourceKey)||[];g.push(p);groups.set(p.sourceKey,g);}
 const used=new Set(),outputs=[];
 for(const [sourceKey,targets] of groups){
  let b;try{b=toDip(targets[0].bounds)}catch{continue;}if(!validBounds(b))continue;
  // Physical source bounds are converted by Electron, never multiplied by DPI.
  const matches=displays.filter(d=>validBounds(d.bounds)&&['x','y','width','height'].every(k=>Math.abs(d.bounds[k]-b[k])<=2));
  if(matches.length!==1)continue;const display=matches[0];if(used.has(display.id))continue;used.add(display.id);
  const devices=targets.map(t=>t.devicePath||t.adapterId+':'+t.targetId).sort();
  outputs.push({...display,key:'native:'+devices.join('|'),devices,sourceKey,targets,cloned:targets.length>1,primary:display.id===primaryId,label:(targets.length>1?'Grupo duplicado: ':'')+targets.map(t=>t.name||t.sourceName).join(' + ')});
 }
 for(const d of displays)if(!used.has(d.id)&&validBounds(d.bounds)&&d.id!==-1)outputs.push({...d,key:'electron:'+d.id,devices:[],targets:[],primary:d.id===primaryId,cloned:false});
 return outputs;
}
function selectOutput(outputs,saved,current){
 if(saved){const exact=outputs.find(o=>o.key===saved.key);if(exact)return exact;
  const related=outputs.filter(o=>saved.devices?.length&&saved.devices.every(d=>o.devices.includes(d)));if(related.length===1)return related[0];}
 const eligible=outputs.filter(o=>!o.primary||o.cloned);
 return eligible.find(o=>o.key===current)||eligible.sort((a,b)=>Number(b.cloned)-Number(a.cloned)||Number(a.primary)-Number(b.primary)||Number(a.internal)-Number(b.internal)||a.key.localeCompare(b.key))[0]||null;
}
class DisplayManager{
 constructor(screen,file,onChange,read=nativeTopology){this.screen=screen;this.file=file;this.onChange=onChange;this.read=read;this.outputs=[];this.current=null;this.error=null;this.generation=0;this.saved=null;try{this.saved=JSON.parse(fs.readFileSync(file,'utf8'))}catch{} }
 async scan(){
  const generation=++this.generation;let paths=[];let error=null;
  try{paths=await this.read()}catch(e){error=e.message;projectionLog('error','[Topology ERROR]',error)}
  if(generation!==this.generation)return;
  this.error=error;this.outputs=logicalOutputs(this.screen.getAllDisplays(),this.screen.getPrimaryDisplay().id,paths,b=>this.screen.screenToDipRect(null,b));
  this.physicalCount=paths.length||this.outputs.length;
  if(paths.length&&this.outputs.some(o=>!o.targets.length)){this.error='Algumas saídas nativas não puderam ser associadas ao Electron; usando saída lógica de reserva.';projectionLog('warn','[Topology ERROR]',this.error);}
  this.current=selectOutput(this.outputs,this.saved,this.current?.key);
  projectionLog('info','[Displays]',this.physicalCount+' displays físicos / '+this.outputs.length+' saídas lógicas',JSON.stringify(this.outputs.map(o=>({id:o.id,key:o.key,label:o.label,primary:o.primary,cloned:o.cloned,bounds:o.bounds,workArea:o.workArea,scale:o.scaleFactor,rotation:o.rotation,targets:o.targets}))));
  projectionLog('info','[Projection]',this.current?'Selected logical output: '+this.current.key:'Aguardando saída de vídeo...');
  this.onChange?.();
 }
 choose(){const o=this.current;if(!o)return null;const d=this.screen.getAllDisplays().find(d=>d.id===o.id);return d&&validBounds(d.bounds)?{...o,bounds:d.bounds,workArea:d.workArea}:null;}
 save(key){const o=key==='auto'?null:this.outputs.find(o=>o.key===key);if(key!=='auto'&&!o)throw Error('Saída indisponível');this.saved=o?{key:o.key,devices:o.devices}:null;fs.writeFileSync(this.file,JSON.stringify(this.saved));this.current=selectOutput(this.outputs,this.saved,null);this.onChange?.();}
 watch(){this.listener=()=>{if(this.current&&!this.choose())this.onChange?.();clearTimeout(this.timer);this.timer=setTimeout(()=>{void this.scan()},500)};for(const event of ['display-added','display-removed','display-metrics-changed'])this.screen.on(event,this.listener);}
 stop(){clearTimeout(this.timer);this.generation++;for(const event of ['display-added','display-removed','display-metrics-changed'])this.screen.removeListener(event,this.listener);}
}
module.exports={DisplayManager,logicalOutputs,selectOutput,validBounds,nativeTopology,projectionLog,setLogFile};
