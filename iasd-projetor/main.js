'use strict';
const {app,BrowserWindow,screen,Tray,Menu,dialog,nativeImage,ipcMain,shell}=require('electron');
const http=require('node:http');
const https=require('node:https');
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
 showDashboard();
});
const SITE='https://iasd-studio.vercel.app';
const PORT=38741;
let tray,windowRef,dashboardRef,server,youtubeRef=null,youtubeVideoId=null,alertRef=null,lastAlertId=null,siteIdentity=null,lastSiteContact=0;
let pairingCode=String(crypto.randomInt(100000,999999));
const mediaFiles=new Map();const MEDIA_LIMIT=250*1024*1024;
function clearMedia(){for(const item of mediaFiles.values())try{fs.unlinkSync(item.path)}catch{}mediaFiles.clear()}
let authToken=null;
const pairedTokens=new Set();
function authorized(req){const token=String(req.headers.authorization||'').replace(/^Bearer /,'');return !!token&&pairedTokens.has(token)}
const tokenFile=path.join(app.getPath('userData'),'pairing.json');
function loadPairing(){
 try{
  const saved=JSON.parse(fs.readFileSync(tokenFile,'utf8'));
  if(typeof saved.token==='string'&&/^[a-f0-9]{64}$/.test(saved.token))pairedTokens.add(saved.token);
  if(Array.isArray(saved.tokens))for(const token of saved.tokens)if(typeof token==='string'&&/^[a-f0-9]{64}$/.test(token))pairedTokens.add(token);
  authToken=[...pairedTokens][0]||null;
 }catch(e){if(e.code!=='ENOENT')console.warn('Não foi possível recuperar o pareamento:',e.message)}
}
function savePairing(){
 fs.mkdirSync(path.dirname(tokenFile),{recursive:true});
 const temp=tokenFile+'.tmp';
 fs.writeFileSync(temp,JSON.stringify({tokens:[...pairedTokens]}),{encoding:'utf8',mode:0o600});
 fs.renameSync(temp,tokenFile);
}

function monitorInfo(){const primary=screen.getPrimaryDisplay();return screen.getAllDisplays().map((d,i)=>({id:String(d.id),name:d.label||'Monitor '+(i+1),primary:d.id===primary.id,width:d.bounds.width,height:d.bounds.height,scale:d.scaleFactor,position:{x:d.bounds.x,y:d.bounds.y}}))}
function chooseDisplay(){
 const displays=screen.getAllDisplays();
 return displays.find(d=>d.id!==screen.getPrimaryDisplay().id)||null;
}
// Exibe o telão no monitor secundário e solicita foco após a janela estar pronta.
// O Windows pode limitar a ativação de aplicativos em segundo plano.
function activateProjector(win,display){
 if(!win||win.isDestroyed())return;
 win.setBounds(display.bounds);
 win.show();
 win.setFullScreen(true);
 win.setAlwaysOnTop(true,'screen-saver');
 win.moveTop();
 win.focus();
 // A prioridade elevada é temporária: não prender o telão acima de outras janelas.
 setTimeout(()=>{
  if(!win.isDestroyed()){
   win.setAlwaysOnTop(false);
   win.moveTop();
   win.focus();
  }
 },900);
}
function showProjector(){
 const display=chooseDisplay();
 if(!display)throw Error('Conecte um segundo monitor e use o modo Estender do Windows.');
 if(!windowRef||windowRef.isDestroyed()){
  const win=new BrowserWindow({
   x:display.bounds.x,y:display.bounds.y,
   width:display.bounds.width,height:display.bounds.height,
   show:false,frame:false,fullscreen:false,autoHideMenuBar:true,
   backgroundColor:'#000',
   webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}
  });
  windowRef=win;
  let activated=false;
  const activateOnce=()=>{
   if(activated||win.isDestroyed())return;
   activated=true;
   activateProjector(win,display);
  };
  win.once('ready-to-show',activateOnce);
  win.webContents.once('did-finish-load',activateOnce);
  win.loadURL(SITE+'/projection.html').catch(e=>console.error('Falha ao carregar o telão:',e.message));
  // Não deixe a projeção invisível caso o carregamento demore.
  setTimeout(activateOnce,1200);
  win.on('closed',()=>{if(windowRef===win)windowRef=null});
 }else{
  activateProjector(windowRef,display);
 }
 return display;
}
// Player YouTube separado: o painel permanece no navegador; a mesma BrowserWindow muda de monitor.
function youtubeHTML(id){return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}iframe{width:100%;height:100%;border:0}</style></head><body><iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&enablejsapi=1&origin='+encodeURIComponent(SITE)+'" allow="autoplay;encrypted-media;fullscreen;picture-in-picture" allowfullscreen></iframe></body></html>'}
async function prepareYoutube(id){if(!/^[a-zA-Z0-9_-]{11}$/.test(id))throw Error('ID do YouTube inválido');if(youtubeRef&&!youtubeRef.isDestroyed()&&youtubeVideoId===id)return;closeYoutube();const d=screen.getPrimaryDisplay(),b=d.workArea;const win=new BrowserWindow({x:b.x,y:b.y,width:960,height:540,show:false,frame:false,backgroundColor:'#000',webPreferences:{offscreen:true,nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false}});youtubeRef=win;youtubeVideoId=id;win.on('closed',()=>{if(youtubeRef===win){youtubeRef=null;youtubeVideoId=null}});await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(youtubeHTML(id)));win.webContents.setFrameRate(15)}
function closeYoutube(){if(youtubeRef&&!youtubeRef.isDestroyed())youtubeRef.destroy();youtubeRef=null;youtubeVideoId=null}
async function youtubeFrame(){if(!youtubeRef||youtubeRef.isDestroyed())throw Error('Prepare um vídeo primeiro');const frame=await youtubeRef.webContents.capturePage();return frame.resize({width:640}).toJPEG(65).toString('base64')}
function projectPreparedYoutube(){const display=chooseDisplay();if(!display)throw Error('Conecte o segundo monitor e selecione Estender no Windows');if(!youtubeRef||youtubeRef.isDestroyed())throw Error('Prepare um vídeo primeiro');if(windowRef&&!windowRef.isDestroyed())windowRef.hide();youtubeRef.setBounds(display.bounds);youtubeRef.show();youtubeRef.setFullScreen(true);youtubeRef.focus();return display}
function showSoundAlert(payload){const primary=screen.getPrimaryDisplay().workArea;if(alertRef&&!alertRef.isDestroyed())alertRef.close();const width=Math.min(480,primary.width-32),height=260;alertRef=new BrowserWindow({x:primary.x+primary.width-width-18,y:primary.y+22,width,height,show:false,frame:false,alwaysOnTop:true,skipTaskbar:true,resizable:false,backgroundColor:'#14233b',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const html='<!doctype html><html><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#14233b;color:#f2f6ff;font:15px Segoe UI,Arial;border:2px solid #eac56e;box-sizing:border-box;height:100vh}small{color:#eac56e}h2{margin:9px 0;font-size:20px}p{line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;max-height:110px;overflow:auto}footer{font-size:12px;color:#b4c7df}</style><small>🔔 ALERTA PARA A SONOPLASTIA</small><h2>'+escape(payload.sender_name||'Direção do culto')+'</h2><p>'+escape(payload.message)+'</p><footer>'+escape(payload.schedule_name||'IASD Studio')+' · Feche esta janela quando ler.</footer></html>';alertRef.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));alertRef.once('ready-to-show',()=>{if(alertRef&&!alertRef.isDestroyed()){alertRef.showInactive();alertRef.setAlwaysOnTop(true,'floating')}});alertRef.on('closed',()=>{alertRef=null})}
function showDashboard(){
 if(dashboardRef&&!dashboardRef.isDestroyed()){dashboardRef.show();dashboardRef.focus();return}
 dashboardRef=new BrowserWindow({width:590,height:750,minWidth:480,minHeight:630,title:'IASD Projetor — IASD APP',autoHideMenuBar:true,backgroundColor:'#091527',icon:path.join(__dirname,'assets','iasd-app.ico'),webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false}});
 dashboardRef.setMenuBarVisibility(false);
 dashboardRef.loadFile(path.join(__dirname,'dashboard.html'));
 dashboardRef.on('closed',()=>{dashboardRef=null});
}
function closeProjection(){if(windowRef&&!windowRef.isDestroyed())windowRef.close();windowRef=null}
ipcMain.handle('iasd:status',()=>({paired:pairedTokens.size>0,code:pairingCode,monitor:!!chooseDisplay(),version:app.getVersion(),monitors:monitorInfo(),siteConnected:Date.now()-lastSiteContact<45000,siteIdentity}));
ipcMain.handle('iasd:site',()=>shell.openExternal(SITE));
ipcMain.handle('iasd:new-code',()=>{pairingCode=String(crypto.randomInt(100000,999999));return{ok:true}});
ipcMain.handle('iasd:updates',()=>latestWindowsRelease().catch(e=>({error:e.message,current:app.getVersion()})));
ipcMain.handle('iasd:release',(_,url)=>{if(typeof url!=='string'||!/^https:\/\/github\.com\/victoorlyma5555\/Iasd-studio\/releases\//.test(url))throw Error('Endereço não autorizado');return shell.openExternal(url)});
ipcMain.handle('iasd:open',()=>{try{showProjector();return{ok:true}}catch(e){return{error:e.message}}});
ipcMain.handle('iasd:close',()=>{closeProjection();return{ok:true}});
// Atualizações são verificadas online; a instalação requer confirmação do usuário.
function latestWindowsRelease(){return new Promise((resolve,reject)=>{const req=https.get('https://api.github.com/repos/victoorlyma5555/Iasd-studio/releases?per_page=12',{headers:{'User-Agent':'IASD-Projetor/'+app.getVersion(),'Accept':'application/vnd.github+json'}},res=>{let body='';res.on('data',chunk=>{body+=chunk;if(body.length>250000)req.destroy(Error('Resposta muito grande'))});res.on('end',()=>{try{if(res.statusCode!==200)throw Error('GitHub indisponível ('+res.statusCode+')');const releases=JSON.parse(body),release=releases.find(x=>/^iasd-projetor-v/i.test(x.tag_name||'')&&!x.draft&&x.assets?.some(a=>/\.exe$/i.test(a.name)));if(!release){resolve({available:false,current:app.getVersion(),message:'Nenhuma versão Windows publicada.'});return}const match=/^iasd-projetor-v(\d+\.\d+\.\d+)/i.exec(release.tag_name),current=app.getVersion().split('.').map(Number),latest=match?match[1].split('.').map(Number):null;const newer=latest&&latest.some((n,i)=>n>current[i]&&latest.slice(0,i).every((v,j)=>v===current[j]));resolve({available:!!newer,current:app.getVersion(),latest:match?.[1]||release.tag_name,url:release.html_url,downloadUrl:release.assets.find(a=>/\.exe$/i.test(a.name))?.browser_download_url})}catch(e){reject(e)}})});req.on('error',reject);req.setTimeout(8000,()=>req.destroy(Error('Tempo de verificação excedido')))})}
function reply(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':SITE,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Cache-Control':'no-store','Vary':'Origin'});res.end(JSON.stringify(data))}
async function handler(req,res){
 if(req.headers.origin!==SITE&&!(req.method==='GET'&&/^\/media\/[a-f0-9]{32}$/.test(req.url||'')&&!req.headers.origin)){res.writeHead(403);res.end();return}
 if(req.method==='OPTIONS'){reply(res,204,{});return}
 if(req.method==='GET'&&/^\/media\/[a-f0-9]{32}$/.test(req.url||'')){
  const id=req.url.slice(7),item=mediaFiles.get(id);if(!item){reply(res,404,{error:'Mídia não encontrada'});return}
  const size=fs.statSync(item.path).size,range=req.headers.range;let start=0,end=size-1,status=200;
  if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return}if(m[1])start=Number(m[1]);if(m[2])end=Number(m[2]);if(!m[1]&&m[2]){start=Math.max(0,size-Number(m[2]));end=size-1}if(start>=size||end>=size||start>end){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return}status=206}
  const headers={'Content-Type':item.type,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-store','Access-Control-Allow-Origin':SITE,'Cross-Origin-Resource-Policy':'cross-origin'};if(status===206)headers['Content-Range']='bytes '+start+'-'+end+'/'+size;res.writeHead(status,headers);fs.createReadStream(item.path,{start,end}).pipe(res);return
 }
 if(req.url==='/media/upload'&&req.method==='POST'){
  if(!authorized(req)){reply(res,401,{error:'Pareamento necessário'});return}
  const type=String(req.headers['content-type']||'');if(!/^(video|audio)\/[a-z0-9.+-]+$/i.test(type)){reply(res,415,{error:'Formato de mídia inválido'});return}
  const length=Number(req.headers['content-length']);if(!Number.isFinite(length)||length<=0||length>MEDIA_LIMIT){reply(res,413,{error:'Limite de 250 MB por arquivo'});return}
  const id=crypto.randomBytes(16).toString('hex'),folder=path.join(app.getPath('temp'),'iasd-projetor-media');fs.mkdirSync(folder,{recursive:true});const dest=path.join(folder,id);let bytes=0;try{const writer=fs.createWriteStream(dest,{flags:'wx'});for await(const chunk of req){bytes+=chunk.length;if(bytes>MEDIA_LIMIT||bytes>length)throw Error('Arquivo excedeu o limite');if(!writer.write(chunk))await new Promise(resolve=>writer.once('drain',resolve))}await new Promise((resolve,reject)=>writer.end(err=>err?reject(err):resolve()));if(bytes!==length)throw Error('Upload incompleto');mediaFiles.set(id,{path:dest,type});reply(res,200,{url:'http://127.0.0.1:'+PORT+'/media/'+id});return}catch(e){try{fs.unlinkSync(dest)}catch{}reply(res,400,{error:e.message});return}
 }

 if(req.url==='/youtube/frame'&&req.method==='GET'){if(!authorized(req)){reply(res,401,{error:'Pareamento necessário'});return}try{reply(res,200,{image:await youtubeFrame(),id:youtubeVideoId})}catch(e){reply(res,409,{error:e.message})}return}
 if(req.url==='/status'&&req.method==='GET'){reply(res,200,{online:true,paired:pairedTokens.size>0,secondMonitor:!!chooseDisplay(),projecting:!!windowRef&&!windowRef.isDestroyed(),version:app.getVersion(),youtubePreview:!!youtubeRef&&!youtubeRef.isDestroyed(),monitors:monitorInfo(),siteConnected:Date.now()-lastSiteContact<45000,siteIdentity});return}
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000){reply(res,413,{error:'Mensagem muito grande'});return}}
 let data={};try{data=JSON.parse(raw||'{}')}catch{reply(res,400,{error:'JSON inválido'});return}
 if(req.url==='/pair'&&req.method==='POST'){
  if(data.code!==pairingCode){reply(res,403,{error:'Código incorreto'});return}
  const newToken=crypto.randomBytes(32).toString('hex');
  pairedTokens.add(newToken);authToken=newToken;
  try{savePairing()}catch(e){pairedTokens.delete(newToken);authToken=[...pairedTokens][0]||null;reply(res,500,{error:'Falha ao salvar o pareamento'});return}
  pairingCode=String(crypto.randomInt(100000,999999));
  if(dashboardRef&&!dashboardRef.isDestroyed())dashboardRef.webContents.reload();
  reply(res,200,{token:newToken});return;
 }
 if(!authorized(req)){reply(res,401,{error:'Pareie este navegador com o IASD Projetor'});return}
 if(req.url==='/heartbeat'&&req.method==='POST'){lastSiteContact=Date.now();siteIdentity={name:String(data.name||'Usuário autenticado').slice(0,90),email:String(data.email||'').slice(0,150),role:String(data.role||'').slice(0,40)};reply(res,200,{ok:true});return}
 if(req.url==='/alert'&&req.method==='POST'){if(typeof data.id!=='string'||!/^[a-f0-9-]{36}$/.test(data.id)||typeof data.message!=='string'||!data.message.trim()||data.message.length>500){reply(res,400,{error:'Alerta inválido'});return}if(lastAlertId!==data.id){lastAlertId=data.id;showSoundAlert(data)}reply(res,200,{ok:true});return}
 if(req.url==='/youtube/prepare'&&req.method==='POST'){try{await prepareYoutube(String(data.id||''));reply(res,200,{ok:true,id:youtubeVideoId})}catch(e){reply(res,409,{error:e.message})}return}
 if(req.url==='/youtube/control'&&req.method==='POST'){if(!['play','pause','mute','unmute'].includes(data.action)){reply(res,400,{error:'Controle inválido'});return}if(!youtubeRef||youtubeRef.isDestroyed()){reply(res,409,{error:'Prepare o vídeo primeiro'});return}try{const command=data.action==='play'?'playVideo':data.action==='pause'?'pauseVideo':data.action==='mute'?'mute':'unMute';await youtubeRef.webContents.executeJavaScript("document.querySelector('iframe')?.contentWindow?.postMessage("+JSON.stringify(JSON.stringify({event:'command',func:command,args:[]}))+",'https://www.youtube-nocookie.com')");reply(res,200,{ok:true})}catch(e){reply(res,409,{error:e.message})}return}
 if(req.url==='/youtube/project'&&req.method==='POST'){try{const display=projectPreparedYoutube();reply(res,200,{ok:true,monitor:display.label||'Monitor secundário'})}catch(e){reply(res,409,{error:e.message})}return}
 if(req.url==='/youtube/close'&&req.method==='POST'){closeYoutube();reply(res,200,{ok:true});return}
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
 if(req.url==='/close'&&req.method==='POST'){closeYoutube();if(windowRef&&!windowRef.isDestroyed())windowRef.close();windowRef=null;reply(res,200,{ok:true});return}
 reply(res,404,{error:'Rota desconhecida'});
}
if(primaryInstance)app.whenReady().then(()=>{
 loadPairing();
 app.setLoginItemSettings({openAtLogin:true,path:process.execPath,args:app.isPackaged?['--autostart']:['.','--autostart']});
 tray=new Tray(createTrayIcon());
 tray.setToolTip('IASD Projetor — aplicativo em execução');
 tray.on('double-click',showDashboard);
 tray.setContextMenu(Menu.buildFromTemplate([
  {label:'Abrir IASD Projetor',click:showDashboard},
  {label:'Abrir IASD APP (site)',click:()=>shell.openExternal(SITE)},
  {type:'separator'},
  {label:'Mostrar código de pareamento',click:()=>dialog.showMessageBox({type:'info',title:'IASD Projetor',message:'Código de pareamento: '+pairingCode,detail:'Digite este código no painel do sonoplasta. Compartilhe apenas com operadores autorizados.'})},
  {label:'Abrir projeção',click:()=>{try{showProjector()}catch(e){dialog.showErrorBox('IASD Projetor',e.message)}}},
  {label:'Encerrar projeção',click:()=>{if(windowRef&&!windowRef.isDestroyed())windowRef.close();windowRef=null}},
  {type:'separator'},
  {label:'Sobre o IASD Projetor',click:()=>dialog.showMessageBox({type:'info',title:'Sobre o IASD Projetor',message:'IASD Projetor · v'+app.getVersion(),detail:'Desenvolvido por Victor Lima\\nProjeto: IASD APP\\nSite: '+SITE})},
  {label:'Sair do IASD Projetor',click:()=>app.quit()}
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
 server.listen(PORT,'127.0.0.1',()=>{if(!process.argv.includes('--hidden')&&!process.argv.includes('--autostart'))showDashboard()});
});
app.on('window-all-closed',()=>{});
app.on('before-quit',()=>{server?.close();clearMedia()});
