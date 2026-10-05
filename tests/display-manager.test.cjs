const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const {DisplayManager,logicalOutputs,selectOutput,validBounds,nativeTopology}=require('../iasd-projetor/display-manager');
const display=(id,x=0,scaleFactor=1)=>({id,label:'Monitor '+id,bounds:{x,y:0,width:1920,height:1080},workArea:{x,y:0,width:1920,height:1040},scaleFactor,internal:id===1});
const target=(devicePath,sourceKey='adapter:1',x=1920)=>({sourceKey,adapterId:'adapter',targetId:devicePath,devicePath,name:devicePath,connected:true,bounds:{x,y:0,width:1920,height:1080}});
const outputs=(ds,ps=[])=>logicalOutputs(ds,1,ps,b=>b);
test('principal sozinho aguarda; escolha manual permite principal',()=>{const o=outputs([display(1)]);assert.equal(selectOutput(o,null),null);assert.equal(selectOutput(o,{key:o[0].key}).id,1)});
test('TV estendida e várias TVs: escolha estável sem depender da enumeração',()=>{const ds=[display(1),display(9,1920),display(3,-1920)];assert.equal(selectOutput(outputs(ds),null).id,selectOutput(outputs(ds.reverse()),null).id);assert.equal(outputs(ds).length,3)});
test('clones são agrupados pelo source nativo e preservam targets',()=>{const o=outputs([display(1),display(9,1920)],[target('tvA'),target('tvB')]);assert.equal(o.length,2);const c=o.find(x=>x.cloned);assert.equal(c.targets.length,2);assert.equal(selectOutput(o,null).key,c.key)});
test('clone que inclui principal também é saída válida',()=>{const o=outputs([display(1)],[target('tvA','s',0),target('tvB','s',0)]);assert.equal(selectOutput(o,null).cloned,true)});
test('coordenadas iguais não inventam clone; sources diferentes ficam separados',()=>{const o=outputs([display(1),display(9,1920)],[target('A','s1',0),target('B','s2',1920)]);assert.equal(o.some(x=>x.cloned),false)});
test('escolha persistente sobrevive ID, ordem e posição diferentes',()=>{const a=outputs([display(1),display(9,1920)],[target('A')]);const selected=selectOutput(a,null);const b=outputs([display(8,-1920),display(1)],[target('A','new-source',-1920)]);assert.equal(selectOutput(b,{key:selected.key,devices:selected.devices}).id,8)});
test('grupo reencontrado com target adicional e fallback para alvo ausente',()=>{const o=outputs([display(1),display(9,1920)],[target('A'),target('B')]);assert.equal(selectOutput(o,{key:'old',devices:['A']}).id,9);assert.equal(selectOutput(o,{key:'missing',devices:['absent']}).id,9)});
test('DPI 100%, 125%, 150% mantém bounds Electron em DIP',()=>{for(const scale of [1,1.25,1.5]){const d=display(9,-1920,scale),p=target('TV');p.bounds={x:-1920*scale,y:0,width:1920*scale,height:1080*scale};let converted=false;const o=logicalOutputs([d],1,[p],b=>{converted=true;return{x:b.x/scale,y:0,width:b.width/scale,height:b.height/scale}});assert.ok(converted);assert.deepEqual(o[0].bounds,d.bounds);assert.equal(o[0].devices[0],'TV')}});
test('resoluções variadas e bounds inválidos',()=>{for(const [width,height] of [[1280,720],[1366,768],[1600,900],[1920,1080],[2560,1440],[3840,2160]])assert.ok(validBounds({x:-width,y:100,width,height}));assert.equal(validBounds({x:0,y:0,width:0,height:10}),false);assert.equal(validBounds({x:NaN,y:0,width:10,height:10}),false)});
test('hotplug, desconexão, reconexão, debounce e persistência',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'iasd-displays-'));t.after(()=>fs.rmSync(dir,{recursive:true}));
 const screen=new EventEmitter();let ds=[display(1)],calls=0,changes=0;screen.getAllDisplays=()=>ds;screen.getPrimaryDisplay=()=>display(1);screen.screenToDipRect=(_,b)=>b;
 const file=path.join(dir,'selection.json'),m=new DisplayManager(screen,file,()=>changes++,async()=>{calls++;return ds.length>1?[target('TV')]:[]});m.watch();t.after(()=>m.stop());
 await m.scan();assert.equal(m.choose(),null);ds.push(display(9,1920));await m.scan();m.save(m.current.key);assert.equal(m.choose().id,9);
 ds=[display(1)];await m.scan();assert.equal(m.choose(),null);ds.push(display(8,1920));await m.scan();assert.equal(m.choose().id,8);
 const restored=new DisplayManager(screen,file,null,async()=>[target('TV')]);await restored.scan();assert.equal(restored.choose().id,8);
 const before=calls;for(let i=0;i<10;i++)screen.emit('display-metrics-changed');await new Promise(r=>setTimeout(r,650));assert.equal(calls,before+1);assert.ok(changes>=5);
 ds=[display(1)];assert.equal(m.choose(),null);
});
test('consulta nativa real no Windows', {skip:process.platform!=='win32'},async()=>{const p=await nativeTopology();assert.ok(Array.isArray(p));for(const t of p){assert.ok(t.sourceKey);assert.ok(t.adapterId);assert.ok(validBounds(t.bounds));assert.equal(t.connected,true)}});
function windowFixture(){
 const source=fs.readFileSync(path.join(__dirname,'../iasd-projetor/main.js'),'utf8');
 const win={visible:true,_projectionReady:true,bounds:{x:1920,y:0,width:1920,height:1080},moves:0,opacity:.4,isDestroyed:()=>false,isVisible(){return this.visible},hide(){this.visible=false},showInactive(){this.visible=true},getBounds(){return this.bounds},setBounds(b){this.bounds=b;this.moves++},setFullScreen(){}};
 const context=vm.createContext({windowRef:win,youtubeRef:null,youtubeCover:null,youtubeOnPrimary:false,suspendedWindows:new Set(),display:display(9,1920),projectionError:null});
 vm.runInContext('function chooseDisplay(){return display}\n'+source.slice(source.indexOf('function reconcileProjection()'),source.indexOf('// Exibe o telão')),context);
 return{win,context,run:()=>vm.runInContext('reconcileProjection()',context),source};
}
test('janela desconectada é oculta e recuperada sem recriar renderer ou alterar opacidade/fade',()=>{
 const {win,context,run}=windowFixture();run();assert.equal(win.moves,0);context.display=null;run();assert.equal(win.visible,false);assert.equal(context.suspendedWindows.has(win),true);context.display=display(8,-1920);run();assert.equal(win.visible,true);assert.equal(win.bounds.x,-1920);assert.equal(win.opacity,.4);assert.equal(context.suspendedWindows.size,0);run();assert.equal(win.moves,1);
});
test('janela deliberadamente oculta e renderer com falha não reaparecem no hotplug',()=>{const {win,context,run}=windowFixture();win.visible=false;run();assert.equal(win.visible,false);context.suspendedWindows.add(win);win._projectionReady=false;run();assert.equal(win.visible,false)});
test('tela preta alterna apenas quando explicitamente solicitada e utiliza uma camada',()=>{
 const {source}=windowFixture();let layer=null,created=0;const document={getElementById:()=>layer,createElement:()=>{created++;return{style:{}}},body:{appendChild:x=>{layer=x}}};
 const c=vm.createContext({document});vm.runInContext(source.slice(source.indexOf('function blackoutScript('),source.indexOf("ipcMain.handle('iasd:blackout'")),c);
 const apply=enabled=>vm.runInContext(vm.runInContext('blackoutScript('+enabled+')',c),c);
 apply(false);assert.equal(layer.style.display,'none');apply(true);assert.equal(layer.style.display,'block');apply(false);assert.equal(layer.style.display,'none');assert.equal(created,1);
});
