'use strict';
const {app,BrowserWindow,screen,Tray,Menu,dialog,nativeImage}=require('electron');
const http=require('node:http');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const SITE='https://iasd-studio.vercel.app';
const PORT=38741;
let tray,windowRef,server;
let pairingCode=String(crypto.randomInt(100000,999999));
let authToken=null;
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
app.whenReady().then(()=>{
 app.setLoginItemSettings({openAtLogin:true,path:process.execPath,args:app.isPackaged?[]:['.']});
 tray=new Tray(nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9sAAAAASUVORK5CYII='));
 tray.setToolTip('IASD Projetor');
 tray.setContextMenu(Menu.buildFromTemplate([
  {label:'Mostrar código de pareamento',click:()=>dialog.showMessageBox({type:'info',title:'IASD Projetor',message:'Código de pareamento: '+pairingCode,detail:'Digite este código no painel do sonoplasta. Compartilhe apenas com operadores autorizados.'})},
  {label:'Abrir projeção',click:()=>{try{showProjector()}catch(e){dialog.showErrorBox('IASD Projetor',e.message)}}},
  {label:'Encerrar projeção',click:()=>{if(windowRef&&!windowRef.isDestroyed())windowRef.close();windowRef=null}},
  {type:'separator'},{label:'Sair do IASD Projetor',click:()=>app.quit()}
 ]));
 server=http.createServer((req,res)=>{void handler(req,res).catch(()=>reply(res,500,{error:'Erro interno'}))});
 server.listen(PORT,'127.0.0.1');
});
app.on('window-all-closed',()=>{});
app.on('before-quit',()=>server?.close());
