'use strict';
const {app,BrowserWindow,screen,Tray,Menu,dialog,nativeImage}=require('electron');
const http=require('node:http');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
// Ícone PNG desenhado localmente, sem depender de arquivos externos.
function createTrayIcon(){
 const n=32,pixels=Buffer.alloc(n*(1+n*4));
 function dot(x,y,r,g,b,a=255){if(x<0||y<0||x>=n||y>=n)return;const i=y*(1+n*4)+1+x*4;pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;pixels[i+3]=a;}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  // Fundo azul com cantos arredondados.
  const dx=Math.max(5-x,0,x-26),dy=Math.max(5-y,0,y-26);
  if(dx*dx+dy*dy<=25)dot(x,y,12,42,82);
  // Tela branca com interior azul-escuro.
  if(x>=5&&x<=26&&y>=7&&y<=22)dot(x,y,236,246,255);
  if(x>=7&&x<=24&&y>=9&&y<=20)dot(x,y,21,80,126);
  // Feixe de projeção amarelo.
  if(x>=12&&x<=19&&y>=12&&y<=17&&Math.abs(y-14.5)<=Math.floor((x-11)/2)+1)dot(x,y,255,204,65);
  if(y>=23&&y<=25&&x>=14&&x<=17)dot(x,y,236,246,255);
  if(y===26&&x>=10&&x<=21)dot(x,y,236,246,255);
 }
 const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
 function chunk(type,data){const name=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);let c=0xffffffff;for(const b of Buffer.concat([name,data]))c=crcTable[(c^b)&255]^(c>>>8);crc.writeUInt32BE((c^0xffffffff)>>>0);return Buffer.concat([len,name,data,crc]);}
 const header=Buffer.alloc(13);header.writeUInt32BE(n,0);header.writeUInt32BE(n,4);header[8]=8;header[9]=6;
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
 return nativeImage.createFromBuffer(png);
}

// Apenas uma instância pode usar a porta local de projeção.
const primaryInstance=app.requestSingleInstanceLock();
if(!primaryInstance){app.quit();}
else app.on('second-instance',()=>{
 if(windowRef&&!windowRef.isDestroyed())windowRef.focus();
 else if(tray)tray.displayBalloon?.({title:'IASD Projetor',content:'O aplicativo já está aberto na bandeja do Windows.'});
});
const SITE='https://iasd-studio.vercel.app';
const PORT=38741;
let tray,windowRef,server;
let pairingCode=String(crypto.randomInt(100000,999999));
let authToken=null;
const tokenFile=path.join(app.getPath('userData'),'pairing.json');
function loadPairing(){
 try{
  const saved=JSON.parse(fs.readFileSync(tokenFile,'utf8'));
  if(typeof saved.token==='string'&&/^[a-f0-9]{64}$/.test(saved.token))authToken=saved.token;
 }catch(e){if(e.code!=='ENOENT')console.warn('Não foi possível recuperar o pareamento:',e.message)}
}
function savePairing(){
 fs.mkdirSync(path.dirname(tokenFile),{recursive:true});
 const temp=tokenFile+'.tmp';
 fs.writeFileSync(temp,JSON.stringify({token:authToken}),{encoding:'utf8',mode:0o600});
 fs.renameSync(temp,tokenFile);
}

function chooseDisplay(){
 const displays=screen.getAllDisplays();
 return displays.find(d=>d.id!==screen.getPrimaryDisplay().id)||null;
}
function showProjector(){
 const display=chooseDisplay();
 if(!display)throw Error('Conecte um segundo monitor e use o modo Estender do Windows.');
 if(!windowRef||windowRef.isDestroyed()){
  windowRef=new BrowserWindow({x:display.bounds.x,y:display.bounds.y,width:display.bounds.width,height:display.bounds.height,frame:false,fullscreen:true,autoHideMenuBar:true,backgroundColor:'#000',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  windowRef.loadURL(SITE+'/projection.html');
 }else{
  windowRef.setBounds(display.bounds);
  windowRef.setFullScreen(true);
  windowRef.show();
 }
 return display;
}
function reply(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':SITE,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Cache-Control':'no-store','Vary':'Origin'});res.end(JSON.stringify(data))}
async function handler(req,res){
 if(req.headers.origin!==SITE){res.writeHead(403);res.end();return}
 if(req.method==='OPTIONS'){reply(res,204,{});return}
 if(req.url==='/status'&&req.method==='GET'){reply(res,200,{online:true,paired:!!authToken,secondMonitor:!!chooseDisplay(),projecting:!!windowRef&&!windowRef.isDestroyed()});return}
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000){reply(res,413,{error:'Mensagem muito grande'});return}}
 let data={};try{data=JSON.parse(raw||'{}')}catch{reply(res,400,{error:'JSON inválido'});return}
 if(req.url==='/pair'&&req.method==='POST'){
  if(data.code!==pairingCode){reply(res,403,{error:'Código incorreto'});return}
  authToken=crypto.randomBytes(32).toString('hex');pairingCode=String(crypto.randomInt(100000,999999));
  reply(res,200,{token:authToken});return;
 }
 if(req.headers.authorization!=='Bearer '+authToken||!authToken){reply(res,401,{error:'Pareie este navegador com o IASD Projetor'});return}
 if(req.url==='/open'&&req.method==='POST'){
  try{const display=showProjector();reply(res,200,{ok:true,monitor:display.label||'Monitor secundário'})}catch(e){reply(res,409,{error:e.message})}return;
 }
 if(req.url==='/project'&&req.method==='POST'){
  if(typeof data.content!=='string'||data.content.length>50000){reply(res,400,{error:'Conteúdo inválido'});return}
  try{
   showProjector();
   const content=data.content;
   if(windowRef.webContents.isLoadingMainFrame())await new Promise((resolve,reject)=>{windowRef.webContents.once('did-finish-load',resolve);windowRef.webContents.once('did-fail-load',(_,code,desc)=>reject(new Error(desc)))});
   await windowRef.webContents.executeJavaScript('window.postMessage('+JSON.stringify({type:'iasd-project',content})+','+JSON.stringify(SITE)+')');
   reply(res,200,{ok:true});
  }catch(e){reply(res,409,{error:e.message})}return;
 }
 if(req.url==='/close'&&req.method==='POST'){if(windowRef&&!windowRef.isDestroyed())windowRef.close();windowRef=null;reply(res,200,{ok:true});return}
 reply(res,404,{error:'Rota desconhecida'});
}
if(primaryInstance)app.whenReady().then(()=>{
 loadPairing();
 app.setLoginItemSettings({openAtLogin:true,path:process.execPath,args:app.isPackaged?[]:['.']});
 tray=new Tray(createTrayIcon());
 tray.setToolTip('IASD Projetor');
 tray.setContextMenu(Menu.buildFromTemplate([
  {label:'Mostrar código de pareamento',click:()=>dialog.showMessageBox({type:'info',title:'IASD Projetor',message:'Código de pareamento: '+pairingCode,detail:'Digite este código no painel do sonoplasta. Compartilhe apenas com operadores autorizados.'})},
  {label:'Abrir projeção',click:()=>{try{showProjector()}catch(e){dialog.showErrorBox('IASD Projetor',e.message)}}},
  {label:'Encerrar projeção',click:()=>{if(windowRef&&!windowRef.isDestroyed())windowRef.close();windowRef=null}},
  {type:'separator'},{label:'Sair do IASD Projetor',click:()=>app.quit()}
 ]));
 server=http.createServer((req,res)=>{void handler(req,res).catch(()=>reply(res,500,{error:'Erro interno'}))});
 server.on('error',error=>{
  if(error.code==='EADDRINUSE'){
   dialog.showMessageBox({type:'warning',title:'IASD Projetor já está em execução',message:'A porta 38741 já está em uso.',detail:'Verifique o IASD Projetor perto do relógio do Windows. Se houver outra versão aberta, feche-a antes de iniciar esta.'}).finally(()=>app.quit());
  }else{
   dialog.showErrorBox('IASD Projetor — falha ao iniciar',error.message);
   app.quit();
  }
 });
 server.listen(PORT,'127.0.0.1');
});
app.on('window-all-closed',()=>{});
app.on('before-quit',()=>server?.close());
