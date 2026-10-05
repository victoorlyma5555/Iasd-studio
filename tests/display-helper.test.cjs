'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {DisplayManager,nativeTopology,parseTopology,helperPath,logicalOutputs}=require('../iasd-projetor/display-manager');
const target=(targetId,devicePath)=>({sourceKey:'adapter:0',sourceId:0,adapterId:'adapter',targetId,devicePath,name:'TV',connected:true,bounds:{x:1920,y:0,width:1920,height:1080}});
const tv={id:9,bounds:{x:1920,y:0,width:1920,height:1080},workArea:{x:1920,y:0,width:1920,height:1040},scaleFactor:1};
const primary={...tv,id:1,bounds:{...tv.bounds,x:0}};
test('JSON do helper mantém contrato e dois targets no mesmo source formam uma saída',()=>{const paths=parseTopology(JSON.stringify([target(1,'A'),target(2,'B')]));const outputs=logicalOutputs([primary,tv],1,paths,b=>b);assert.equal(outputs.length,2);assert.equal(outputs.find(o=>o.cloned).targets.length,2);assert.equal(outputs.find(o=>o.cloned).id,9)});
test('parser aceita nenhuma saída, rejeita erro, JSON inválido e schema inválido',()=>{assert.deepEqual(parseTopology('[]'),[]);assert.throws(()=>parseTopology('{"success":false,"error":"API indisponível"}'),/API indisponível/);assert.throws(()=>parseTopology('not json'));assert.throws(()=>parseTopology('{}'));assert.throws(()=>parseTopology('[null]'));assert.throws(()=>parseTopology('[{"sourceKey":"s"}]'));});
test('caminhos de desenvolvimento e app.asar apontam para executável real extraído',()=>{assert.equal(helperPath('C:\\dev\\project'),path.join('C:\\dev\\project','native','iasd-display-helper.exe'));assert.equal(helperPath('C:\\install\\resources\\app.asar'),path.join('C:\\install\\resources\\app.asar.unpacked','native','iasd-display-helper.exe'));assert.ok(!helperPath().endsWith('.ps1'));});
for(const [label,error,out] of [['indisponível',Object.assign(Error('ENOENT'),{code:'ENOENT'}),''],['erro de processo',Error('exit 1'),''],['JSON inválido',null,'broken'],['erro estruturado',null,'{"success":false,"error":"QueryDisplayConfig: 5"}'],['schema inválido',null,'{}'],['timeout',Error('ETIMEDOUT'),'']]){
 test('helper '+label+' mantém seleção Electron e app funcionando',{skip:process.platform!=='win32'},async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'iasd-native-fallback-'));t.after(()=>fs.rmSync(dir,{recursive:true}));let calls=0;
  const run=(exe,args,options,callback)=>{calls++;assert.equal(exe,helperPath());assert.deepEqual(args,[]);assert.equal(options.windowsHide,true);assert.equal(options.timeout,10000);assert.equal(options.maxBuffer,1024*1024);callback(error,out)};
  const screen={getAllDisplays:()=>[primary,tv],getPrimaryDisplay:()=>primary,screenToDipRect:(_,b)=>b};
  const manager=new DisplayManager(screen,path.join(dir,'output.json'),null,()=>nativeTopology(run));await manager.scan();assert.equal(calls,1);assert.ok(manager.error);assert.equal(manager.choose().id,9);assert.deepEqual(manager.choose().bounds,tv.bounds);
 });
}
test('executável real retorna JSON compatível e termina',{skip:process.platform!=='win32'},async()=>{assert.ok(fs.existsSync(helperPath()));const paths=await nativeTopology();assert.ok(Array.isArray(paths));assert.equal(paths.length,parseTopology(JSON.stringify(paths)).length);});
test('build configura helper fora do asar e não inclui PowerShell',()=>{const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'../iasd-projetor/package.json'),'utf8'));assert.ok(pkg.build.asarUnpack.includes('native/iasd-display-helper.exe'));assert.equal(pkg.build.beforePack,'./scripts/build-display-helper.cjs');assert.ok(!fs.existsSync(path.join(__dirname,'../iasd-projetor/windows-topology.ps1')));});
