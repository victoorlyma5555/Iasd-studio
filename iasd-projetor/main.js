'use strict';
const {app,BrowserWindow,screen,Tray,Menu,dialog,nativeImage,ipcMain,shell,safeStorage}=require('electron');
const http=require('node:http');
const https=require('node:https');
const {autoUpdater}=require('electron-updater');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {execFile}=require('node:child_process');
const {createClient}=require('@supabase/supabase-js');
const ljaLib=require('./lja.js');
// Ícone PNG desenhado localmente, sem depender de arquivos externos.
function createTrayIcon(){
 const iconPath=path.join(__dirname,'assets','iasd-app.ico');
 const icon=nativeImage.createFromPath(iconPath);
 return icon.isEmpty()?nativeImage.createEmpty():icon;
}

// Apenas uma instância pode usar a porta local de projeção.
const primaryInstance=app.requestSingleInstanceLock();
if(!primaryInstance){app.quit();}
else app.on('second-instance',()=>{
 showDashboard();
});
const SITE='https://iasdapp.com.br';
const PROJECTION_URL='https://www.iasdapp.com.br/sonoplastia/projecao';
// Configuração online: os links abaixo podem ser mudados no site (arquivo /projetor-config.json), sem recompilar o programa.
const CONFIG_URL='https://www.iasdapp.com.br/projetor-config.json';
const CONFIG_HOSTS=new Set(['iasdapp.com.br','www.iasdapp.com.br']);
let remoteConfig={};
function safeLink(v){try{const u=new URL(String(v||''));return u.protocol==='https:'&&CONFIG_HOSTS.has(u.hostname)?u.href:null}catch{return null}}
function projectionUrl(){return safeLink(remoteConfig.projectionUrl)||PROJECTION_URL}
function siteUrl(){return safeLink(remoteConfig.siteUrl)||SITE}
const DASHBOARD_URL='https://www.iasdapp.com.br/iasd-projetor/dashboard.html';
function dashboardRemoteUrl(){return remoteConfig.dashboardMode==='local'?null:(safeLink(remoteConfig.dashboardUrl)||DASHBOARD_URL)}
function loadCachedRemoteConfig(){try{remoteConfig=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'remote-config.json'),'utf8'))||{}}catch{remoteConfig={}}}
async function refreshRemoteConfig(){
 const file=path.join(app.getPath('userData'),'remote-config.json');
 try{const res=await fetch(CONFIG_URL+'?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!res.ok)throw Error('HTTP '+res.status);const cfg=await res.json();if(cfg&&typeof cfg==='object'){remoteConfig={projectionUrl:safeLink(cfg.projectionUrl)||undefined,siteUrl:safeLink(cfg.siteUrl)||undefined,dashboardMode:cfg.dashboardMode==='local'?'local':'remote',dashboardUrl:safeLink(cfg.dashboardUrl)||undefined};try{fs.writeFileSync(file,JSON.stringify(remoteConfig))}catch{}}}
 catch{if(!Object.keys(remoteConfig).length){try{remoteConfig=JSON.parse(fs.readFileSync(file,'utf8'))||{}}catch{}}}
}
const ALLOWED_SITES=new Set([SITE,'https://www.iasdapp.com.br','https://iasd-studio.vercel.app']);
function requestOrigin(req){return String(req.headers.origin||'').replace(/\/$/,'')}
function allowedOrigin(req){
 const origin=requestOrigin(req);
 if(ALLOWED_SITES.has(origin))return origin;
 try{
  const url=new URL(origin);
  // Previews gerados pela Vercel para o projeto iasd-studio na main.
  if(url.protocol==='https:'&&/^iasd-studio-[a-z0-9-]+\.vercel\.app$/i.test(url.hostname))return origin;
 }catch{}
 return null;
}
const PORT=38741;
let tray,windowRef,dashboardRef,server,youtubeRef=null,youtubeVideoId=null,youtubeShown=false,alertRef=null,lastAlertId=null,siteIdentity=null,lastSiteContact=0,lastProjectionContent='',alertsMuted=false;

const ALERT_SUPABASE_URL='https://gtsaaixuampeaivugxdm.supabase.co';
const ALERT_SUPABASE_KEY='sb_publishable_0nIK7568ulLb9JN0ctyiug_wHWDV7Qf';
const alertSessionFile=path.join(app.getPath('userData'),'alert-session.dat');
const alertHistoryFile=path.join(app.getPath('userData'),'alert-history.json');
function loadAlertHistory(){try{return JSON.parse(fs.readFileSync(alertHistoryFile,'utf8'))}catch{return[]}}
function saveAlertHistory(v){fs.writeFileSync(alertHistoryFile,JSON.stringify(v.slice(0,200),null,2),'utf8')}
function storeAlert(item){const list=loadAlertHistory().filter(x=>x.id!==item.id);list.unshift({id:item.id,sender_name:item.sender_name||'IASD APP',message:item.message||'',schedule_name:item.schedule_name||'',created_at:item.created_at||new Date().toISOString(),created_by:item.created_by||null});saveAlertHistory(list)}
const alertCloud=createClient(ALERT_SUPABASE_URL,ALERT_SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
let alertChannel=null,alertAccount=null,alertSeen=new Set(),alertReady=false,alertRecoveryTimer=null,alertLastError=null;
function alertStatus(){return {connected:!!alertChannel&&alertReady,account:alertAccount?.email||null,error:alertLastError}}
function alertBroadcastStatus(){if(dashboardRef&&!dashboardRef.isDestroyed())dashboardRef.webContents.send('iasd:alert-status',alertStatus())}
function saveAlertSession(session){
 if(!safeStorage.isEncryptionAvailable())throw Error('Criptografia do Windows indisponível. Não é seguro guardar o acesso.');
 const encrypted=safeStorage.encryptString(JSON.stringify({access_token:session.access_token,refresh_token:session.refresh_token}));
 fs.writeFileSync(alertSessionFile,encrypted,{mode:0o600});
}
async function alertFetchPending(initial=false){
 if(!alertAccount)return;
 const {data,error}=await alertCloud.from('iasd_sound_alerts').select('id,message,sender_name,schedule_name,created_at,created_by').order('created_at',{ascending:false}).limit(20);
 if(error){alertLastError=error.message;alertBroadcastStatus();console.warn('Alertas independentes:',error.message);return}
 const items=(data||[]).reverse();
 if(initial){items.forEach(x=>{alertSeen.add(x.id);const t=alertTarget(x);if(!t||!alertAccount||t.uid===alertAccount.id)storeAlert(alertClean(x))});return}
 for(const item of items)receiveDirectAlert(item);
}
// Alerta individual: o destinatário vai marcado em schedule_name (\u2063@@uid|Nome\u2063). Quem não é o destino ignora.
const ALERT_TARGET_RE=/\u2063@@([0-9a-f-]{36})\|([^\u2063]*)\u2063/;
function alertTarget(item){const x=ALERT_TARGET_RE.exec(String(item&&item.schedule_name||''));return x?{uid:x[1],name:x[2]}:null}
function alertClean(item){return {...item,schedule_name:String(item&&item.schedule_name||'').replace(ALERT_TARGET_RE,'').trim()}}
function receiveDirectAlert(item){
 if(!item?.id||alertSeen.has(item.id))return;
 const target=alertTarget(item);
 if(target&&alertAccount&&target.uid!==alertAccount.id){alertSeen.add(item.id);return}
 item=alertClean(item);
 alertSeen.add(item.id);
 if(alertSeen.size>300)alertSeen=new Set([...alertSeen].slice(-150));
 lastAlertId=item.id;
 storeAlert(item);
 if(dashboardRef&&!dashboardRef.isDestroyed())dashboardRef.webContents.send('iasd:alert-history-changed');
 if(!alertsMuted)showSoundAlert(item);
}
async function alertSubscribe(){
 if(alertChannel)await alertCloud.removeChannel(alertChannel);
 alertReady=false;alertBroadcastStatus();
 await alertFetchPending(true);
 alertChannel=alertCloud.channel('iasd-windows-alerts').on('postgres_changes',{event:'INSERT',schema:'public',table:'iasd_sound_alerts'},event=>receiveDirectAlert(event.new)).subscribe(status=>{
  alertReady=status==='SUBSCRIBED';
  alertBroadcastStatus();
  if(status==='SUBSCRIBED'){alertLastError=null;void alertFetchPending(false)}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){alertLastError='Conexão em tempo real indisponível; usando verificação de reserva.';alertBroadcastStatus()}
 });
 if(alertRecoveryTimer)clearInterval(alertRecoveryTimer);
 alertRecoveryTimer=setInterval(()=>{if(alertAccount)void alertFetchPending(false)},15000);
}
async function alertStart(session){
 const {data,error}=await alertCloud.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token});
 if(error||!data.user)throw Error(error?.message||'Sessão inválida');
 const {data:member,error:roleError}=await alertCloud.from('iasd_members').select('role').eq('user_id',data.user.id).maybeSingle();
 if(roleError||!['sonoplasta','founder','cofounder'].includes(member?.role)){await alertCloud.auth.signOut();throw Error('A conta não possui permissão de sonoplastia.')}
 alertAccount={id:data.user.id,email:data.user.email};alertLastError=null;
 saveAlertSession(data.session);
 await alertSubscribe();alertBroadcastStatus();
}
alertCloud.auth.onAuthStateChange((event,session)=>{if(event==='TOKEN_REFRESHED'&&session){try{saveAlertSession(session)}catch(e){console.warn(e.message)}}});
async function alertRestore(){
 try{if(!fs.existsSync(alertSessionFile))return;if(!safeStorage.isEncryptionAvailable())return;const session=JSON.parse(safeStorage.decryptString(fs.readFileSync(alertSessionFile)));await alertStart(session)}catch(e){alertLastError='Reconecte sua conta: '+e.message;console.warn('Reconexão de alertas:',e.message);alertBroadcastStatus()}
}
async function alertLogout(){
 if(alertChannel){await alertCloud.removeChannel(alertChannel);alertChannel=null}
 if(alertRecoveryTimer){clearInterval(alertRecoveryTimer);alertRecoveryTimer=null}
 await alertCloud.auth.signOut();alertAccount=null;alertReady=false;alertLastError=null;alertSeen.clear();
 try{fs.unlinkSync(alertSessionFile)}catch(e){if(e.code!=='ENOENT')console.warn(e.message)}
 alertBroadcastStatus();
}
let pairingCode=String(crypto.randomInt(100000,999999));
let updateStatus={state:'idle',message:'Aguardando verificação inicial.'};
let startupUpdateChecked=false,downloadedUpdate=null,installingUpdate=false,installUpdateOnQuit=false;
const updateReceiptFile=path.join(app.getPath('userData'),'pending-update.json');
function installDownloadedUpdate(){
 if(!downloadedUpdate||installingUpdate)return {error:'Nenhuma atualização pronta.'};
 if(projectionActive())return {error:'Encerre a projeção antes de instalar.'};
 try{
  fs.writeFileSync(updateReceiptFile,JSON.stringify({from:app.getVersion(),to:downloadedUpdate.version,time:Date.now()}));
  installingUpdate=true;
  updateProgress('installing','Atualizando para a versão '+downloadedUpdate.version+'…',{latest:downloadedUpdate.version});
  setTimeout(()=>autoUpdater.quitAndInstall(true,true),2500);
  return {ok:true}
 }catch(e){installingUpdate=false;return {error:e.message}}
}
function confirmUpdatedVersion(){
 try{
  const data=JSON.parse(fs.readFileSync(updateReceiptFile,'utf8'));
  if(Date.now()-data.time>604800000){fs.unlinkSync(updateReceiptFile);return}
  if(data.from===app.getVersion())return;
  fs.unlinkSync(updateReceiptFile);
  updateProgress('installed','Atualização concluída! Versão '+app.getVersion()+' instalada.');
  showDashboard();
 }catch(e){if(e.code!=='ENOENT')console.warn('Confirmação da atualização:',e.message)}
}

function updateProgress(state,message,extra={}){updateStatus={state,message,...extra};if(dashboardRef&&!dashboardRef.isDestroyed())dashboardRef.webContents.send('iasd:update-status',updateStatus)}
function projectionActive(){return !!(windowRef&&!windowRef.isDestroyed()&&windowRef.isVisible())||!!(youtubeRef&&!youtubeRef.isDestroyed()&&youtubeRef.isVisible())}
async function checkAutomaticUpdate({startup=false}={}){
 if(!app.isPackaged){updateProgress('development','A instalação automática funciona somente no aplicativo instalado.');return updateStatus}
 if(['downloading','downloaded','checking'].includes(updateStatus.state))return updateStatus;
 updateProgress('checking','Procurando atualizações online…');
 try{
  const release=await latestWindowsRelease();
  if(!release.available){updateProgress('current','Você já tem a versão mais recente.',{current:app.getVersion()});return updateStatus}
  if(!/^iasd-projetor-v\d+\.\d+\.\d+$/.test(release.tag)||!release.hasMetadata){updateProgress('manual','Versão disponível sem pacote automático. Abra a página da versão para instalar.',{url:release.url});return updateStatus}
  updateProgress('available','Nova versão '+release.latest+' disponível.',{latest:release.latest});
  autoUpdater.setFeedURL({provider:'generic',url:'https://github.com/victoorlyma5555/Iasd-studio/releases/download/'+encodeURIComponent(release.tag)+'/'});
  updateProgress('downloading','Baixando a versão '+release.latest+'…',{latest:release.latest});
  await autoUpdater.checkForUpdates();
 }catch(e){updateProgress('error','Não foi possível atualizar: '+e.message)}
 return updateStatus;
}
autoUpdater.autoDownload=true;autoUpdater.autoInstallOnAppQuit=false;autoUpdater.allowPrerelease=false;
autoUpdater.on('download-progress',p=>updateProgress('downloading','Baixando atualização: '+Math.round(p.percent)+'%',{percent:Math.round(p.percent)}));
autoUpdater.on('update-downloaded',info=>{downloadedUpdate={version:info.version};updateProgress('downloaded','Versão '+info.version+' baixada. Pronta para instalar.',{latest:info.version});showDashboard()});
autoUpdater.on('update-not-available',()=>updateProgress('current','Você já tem a versão mais recente.'));
autoUpdater.on('error',e=>updateProgress('error','Falha na atualização: '+e.message));
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

function monitorInfo(){const primary=screen.getPrimaryDisplay();return screen.getAllDisplays().map((d,i)=>({id:String(d.id),name:d.label||'Monitor '+(i+1),primary:d.id===primary.id,width:d.bounds.width,height:d.bounds.height,scale:d.scaleFactor,position:{x:d.bounds.x,y:d.bounds.y},refresh:d.displayFrequency||0}))}
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
   // Se um vídeo do YouTube assumiu o telão nesse meio tempo, não traz o telão preto para frente dele.
   if(!youtubeShown&&win.isVisible()){win.moveTop();win.focus()}
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
   webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,autoplayPolicy:'no-user-gesture-required'}
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
const YT_PARTITION='persist:iasd-youtube';
const CHROME_UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';
async function googleLogged(){try{const c=await require('electron').session.fromPartition(YT_PARTITION).cookies.get({name:'SAPISID'});return c.length>0}catch{return false}}
let googleWin=null;
function googleLogin(){return new Promise(resolve=>{if(googleWin&&!googleWin.isDestroyed()){googleWin.focus();return resolve({ok:true,opened:true})}const ses=require('electron').session.fromPartition(YT_PARTITION);ses.setUserAgent(CHROME_UA);const w=new BrowserWindow({width:520,height:720,title:'Entrar no Google (YouTube Premium)',autoHideMenuBar:true,backgroundColor:'#fff',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,partition:YT_PARTITION}});googleWin=w;w.webContents.setUserAgent(CHROME_UA);w.on('closed',()=>{googleWin=null;googleLogged().then(ok=>resolve({ok,logged:ok}))});let done=false;const check=async()=>{if(done||w.isDestroyed())return;if(await googleLogged()){done=true;setTimeout(()=>{if(!w.isDestroyed())w.close()},1200)}};w.webContents.on('did-navigate',check);w.webContents.on('did-navigate-in-page',check);w.loadURL('https://accounts.google.com/ServiceLogin?service=youtube&continue='+encodeURIComponent('https://www.youtube.com/')).catch(()=>{})})}
async function googleLogout(){try{await require('electron').session.fromPartition(YT_PARTITION).clearStorageData()}catch{}closeYoutube();return{ok:true}}
// Transição por opacidade na janela do vídeo (o Windows anima a janela inteira).
function fadeWin(win,to,ms){return new Promise(resolve=>{if(!win||win.isDestroyed()||!ms||ms<60){try{if(win&&!win.isDestroyed())win.setOpacity(to)}catch{}return resolve()}let from;try{from=win.getOpacity()}catch{from=1-to}const t0=Date.now();const iv=setInterval(()=>{if(win.isDestroyed()){clearInterval(iv);return resolve()}const k=Math.min(1,(Date.now()-t0)/ms),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;try{win.setOpacity(from+(to-from)*e)}catch{}if(k>=1){clearInterval(iv);resolve()}},16)})}
function trMs(content){const m=/^IASD_TR:([a-z]+):(\d{1,4})\|/.exec(String(content||''));return m&&m[1]!=='none'?Math.min(2000,+m[2]):0}
async function prepareYoutube(id){if(!/^[a-zA-Z0-9_-]{11}$/.test(id))throw Error('ID do YouTube inválido');if(youtubeRef&&!youtubeRef.isDestroyed()&&youtubeVideoId===id)return;closeYoutube();const d=screen.getPrimaryDisplay(),b=d.workArea;const win=new BrowserWindow({x:b.x,y:b.y,width:960,height:540,show:false,frame:false,backgroundColor:'#000',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false,partition:YT_PARTITION}});youtubeRef=win;youtubeVideoId=id;win.on('closed',()=>{if(youtubeRef===win){youtubeRef=null;youtubeVideoId=null}});const host=(await googleLogged())?'https://www.youtube.com':'https://www.youtube-nocookie.com';await win.loadURL(host+'/embed/'+id+'?autoplay=1&rel=0&playsinline=1',{httpReferrer:{url:SITE+'/',policy:'strict-origin-when-cross-origin'}});win.webContents.setFrameRate(15)}
function closeYoutube(){if(youtubeRef&&!youtubeRef.isDestroyed()){try{youtubeRef.webContents.setAudioMuted(true)}catch{}youtubeRef.destroy()}youtubeRef=null;youtubeVideoId=null;youtubeShown=false}
const YT_VIDEO=(code)=>"(()=>{const v=document.querySelector('video');if(!v)return false;"+code+";return true})()";
async function youtubeVideoDo(code){if(!youtubeRef||youtubeRef.isDestroyed())return false;try{return await youtubeRef.webContents.executeJavaScript(YT_VIDEO(code))}catch{return false}}
// Tela preta com vídeo no telão: esconde a janela do vídeo, pausa e silencia (a projeção continua aberta).
async function blackoutYoutube(){if(!youtubeRef||youtubeRef.isDestroyed()||!youtubeShown)return;await youtubeVideoDo('v.pause()');youtubeRef.webContents.setAudioMuted(true);youtubeRef.setFullScreen(false);youtubeRef.hide();youtubeShown=false}
async function youtubeFrame(){if(!youtubeRef||youtubeRef.isDestroyed())throw Error('Prepare um vídeo primeiro');const frame=await youtubeRef.webContents.capturePage();return frame.resize({width:640}).toJPEG(65).toString('base64')}
async function projectPreparedYoutube(ms=0){const display=chooseDisplay();if(!display)throw Error('Conecte o segundo monitor e selecione Estender no Windows');if(!youtubeRef||youtubeRef.isDestroyed())throw Error('Prepare um vídeo primeiro');if(windowRef&&!windowRef.isDestroyed()){windowRef.setAlwaysOnTop(false);windowRef.hide()}youtubeRef.setBounds(display.bounds);youtubeRef.webContents.setAudioMuted(false);try{youtubeRef.setOpacity(ms?0:1)}catch{}youtubeRef.show();youtubeRef.setFullScreen(true);youtubeRef.focus();youtubeShown=true;void youtubeVideoDo('v.play()');if(ms)void fadeWin(youtubeRef,1,ms);return display}
let alertCurrent=null,pendingAlertReplies=[];
function queueAlertReply(id,text){pendingAlertReplies=pendingAlertReplies.filter(x=>x.id!==id);pendingAlertReplies.push({id,text,at:Date.now()});if(pendingAlertReplies.length>30)pendingAlertReplies.shift()}
async function sendAlertReply(id,text){
 text=String(text||'').trim().slice(0,300);
 if(!id||!text)return {error:'Escreva uma resposta.'};
 if(alertAccount){
  const {error}=await alertCloud.rpc('iasd_reply_sound_alert',{p_alert_id:id,p_reply:text});
  if(!error)return {ok:true};
  if(!/fetch|network|timeout/i.test(error.message||''))return {error:error.message};
 }
 // Sem conta no Projetor (ou sem internet): guarda e o site entrega a resposta quando estiver aberto.
 queueAlertReply(id,text);return {ok:true,queued:true};
}
ipcMain.handle('iasd:alert-reply',async(event,text)=>{if(!alertRef||alertRef.isDestroyed()||event.sender!==alertRef.webContents||!alertCurrent)return {error:'Alerta indisponível.'};const r=await sendAlertReply(alertCurrent,text);return r});
ipcMain.handle('iasd:alert-close',event=>{if(alertRef&&!alertRef.isDestroyed()&&event.sender===alertRef.webContents)alertRef.close();return {ok:true}});
function showSoundAlert(payload){
 // Janela própria do IASD Projetor: sempre no monitor principal, preservando o conteúdo do telão secundário.
 const area=screen.getPrimaryDisplay().workArea;
 if(alertRef&&!alertRef.isDestroyed())alertRef.close();
 const width=Math.min(560,area.width-36),height=Math.min(640,area.height-36);
 const x=Math.round(area.x+(area.width-width)/2),y=Math.round(area.y+(area.height-height)/2);
 const win=new BrowserWindow({x,y,width,height,show:false,frame:false,title:'IASD APP · Alerta da Sonoplastia',autoHideMenuBar:true,alwaysOnTop:true,skipTaskbar:true,resizable:false,minimizable:false,maximizable:false,backgroundColor:'#0b1730',icon:path.join(__dirname,'assets','iasd-app.ico'),webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(__dirname,'alert-preload.js')}});
 alertRef=win;alertCurrent=/^[a-f0-9-]{36}$/.test(String(payload.id||''))?payload.id:null;
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sender=escape(payload.sender_name||'Direção do culto'),message=escape(payload.message||''),schedule=escape(payload.schedule_name||'');
 const when=new Date(payload.created_at||Date.now()),time=(isNaN(when)?new Date():when).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
 const canReply=!!alertCurrent;
 const quick=['Entendido!','Já estou preparando','Preciso de mais tempo','Não será possível'];
 const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
 *{box-sizing:border-box}html,body{height:100%;margin:0}body{font-family:Segoe UI,Arial,sans-serif;color:#f6f9ff;background:linear-gradient(180deg,rgba(7,15,38,.55),rgba(8,16,40,.93)),radial-gradient(circle at 50% 0%,#2d4f86 0%,#0d1b3a 60%,#070d20 100%);padding:22px 24px;display:flex;flex-direction:column;gap:14px;overflow:hidden;-webkit-app-region:drag}
 button,input{-webkit-app-region:no-drag;font:inherit}.x{position:absolute;right:14px;top:12px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;cursor:pointer;font-size:16px}.x:hover{background:rgba(255,255,255,.22)}
 .top{display:flex;align-items:center;gap:14px;padding-right:34px}.bell{width:52px;height:52px;display:grid;place-items:center;border-radius:16px;background:linear-gradient(135deg,#f9d777,#d7a83d);box-shadow:0 7px 26px #e5b94d44;font-size:26px;flex:none}.ey{font-size:15px;font-weight:800;letter-spacing:1.4px;color:#f4d88a}.br{font-size:12.5px;color:#c3d4e9;margin-top:3px}
 .card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:14px 16px}.who{display:flex;justify-content:space-between;gap:10px;align-items:baseline}.who b{font-size:17px}.who span{font-size:12px;color:#aebfd8;white-space:nowrap}.ctx{font-size:12px;color:#f0d68c;margin-top:2px}.msg{margin:8px 0 0;font-size:18px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;max-height:150px;overflow:auto}
 .lab{font-size:11px;font-weight:800;letter-spacing:1.6px;color:#f4d88a}.q{display:grid;grid-template-columns:1fr 1fr;gap:9px}.q button{padding:12px 10px;border-radius:12px;border:1px solid rgba(244,216,138,.45);background:rgba(244,216,138,.08);color:#fff;cursor:pointer;font-size:14px}.q button:hover{background:rgba(244,216,138,.22)}
 .in{display:flex;gap:8px}.in input{flex:1;min-width:0;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.28);color:#fff;font-size:14px}.in button{width:46px;border:0;border-radius:12px;background:linear-gradient(135deg,#f9d777,#d7a83d);color:#17243c;font-size:18px;cursor:pointer}
 .act{display:flex;gap:10px;margin-top:auto}.act button{flex:1;padding:13px;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px}.sec{background:transparent;border:1px solid rgba(255,255,255,.3);color:#fff}.pri{background:linear-gradient(135deg,#f9d777,#d7a83d);border:0;color:#17243c}
 .st{min-height:18px;font-size:12.5px;color:#9be7b0;text-align:center}.st.err{color:#ff9d9d}button:disabled,input:disabled{opacity:.5;cursor:default}
 </style></head><body><button class="x" id="x" title="Fechar">✕</button>
 <div class="top"><div class="bell">🔔</div><div><div class="ey">ALERTA PARA A SONOPLASTIA</div><div class="br">IASD APP • Comunicação em tempo real</div></div></div>
 <div class="card"><div class="who"><b>${sender}</b><span>Hoje, ${time}</span></div>${schedule?`<div class="ctx">${schedule}</div>`:''}<p class="msg">${message}</p></div>
 ${canReply?`<div class="lab">RESPOSTA RÁPIDA</div><div class="q">${quick.map(t=>`<button data-q="${escape(t)}">${escape(t)}</button>`).join('')}</div>
 <div class="in"><input id="t" maxlength="300" placeholder="Digite sua resposta..."><button id="s" title="Enviar">➤</button></div><div class="st" id="st"></div>`:'<div class="st" id="st"></div>'}
 <div class="act"><button class="sec" id="c">Fechar</button>${canReply?'<button class="pri" id="rc">Responder e fechar</button>':''}</div>
 <script>
 const $=i=>document.getElementById(i),st=$('st');let busy=false;
 async function send(text,closeAfter){text=String(text||'').trim();if(!text){st.className='st err';st.textContent='Escreva uma resposta.';return}if(busy)return;busy=true;document.querySelectorAll('button,input').forEach(e=>e.disabled=true);
  const r=await window.iasdAlert.reply(text).catch(e=>({error:e.message}));busy=false;document.querySelectorAll('button,input').forEach(e=>e.disabled=false);
  if(r&&r.error){st.className='st err';st.textContent=r.error;return}
  st.className='st';st.textContent=r.queued?'Resposta guardada: será enviada quando o site estiver aberto.':'✓ Resposta enviada';if(closeAfter)setTimeout(()=>window.iasdAlert.close(),700);else $('t').value=''}
 $('x').onclick=$('c').onclick=()=>window.iasdAlert.close();
 document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>send(b.dataset.q,true));
 if($('s')){$('s').onclick=()=>send($('t').value,false);$('rc').onclick=()=>{const v=$('t').value.trim();if(v)send(v,true);else{st.className='st err';st.textContent='Digite ou escolha uma resposta.'}};$('t').onkeydown=e=>{if(e.key==='Enter')send($('t').value,false)}}
 </script></body></html>`;
 win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html)).catch(e=>console.warn('Falha ao abrir alerta:',e.message));
 win.once('ready-to-show',()=>{if(!win.isDestroyed()){win.showInactive();win.setAlwaysOnTop(true,'floating');win.moveTop()}});
 win.on('closed',()=>{if(alertRef===win){alertRef=null;alertCurrent=null}});
}
/* janelinha "Abrindo o IASD APP" enquanto o programa sobe (cobre o vazio entre abrir e o painel aparecer, inclusive depois de uma atualização) */
let splashRef=null,splashTimer=null;
function showStartSplash(){
 try{
  if(splashRef&&!splashRef.isDestroyed())return;
  let t='Abrindo o IASD APP…',s='Só um instante.';
  try{const r=JSON.parse(fs.readFileSync(updateReceiptFile,'utf8'));if(r&&r.to&&r.from!==app.getVersion()&&Date.now()-r.time<86400000){t='Atualizado para a versão '+app.getVersion();s='Abrindo o IASD APP…'}}catch{}
  splashRef=new BrowserWindow({width:440,height:250,frame:false,resizable:false,maximizable:false,minimizable:false,fullscreenable:false,movable:true,center:true,show:false,alwaysOnTop:true,skipTaskbar:true,title:'IASD Projetor',backgroundColor:'#09152d',icon:path.join(__dirname,'assets','iasd-app.ico'),webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
  splashRef.setMenuBarVisibility(false);
  splashRef.once('ready-to-show',()=>{if(splashRef&&!splashRef.isDestroyed())splashRef.show()});
  splashRef.on('closed',()=>{splashRef=null});
  splashRef.loadFile(path.join(__dirname,'splash.html'),{query:{t,s}}).catch(()=>closeStartSplash());
  clearTimeout(splashTimer);splashTimer=setTimeout(closeStartSplash,15000)
 }catch(e){splashRef=null}
}
function closeStartSplash(){clearTimeout(splashTimer);try{if(splashRef&&!splashRef.isDestroyed())splashRef.close()}catch{}splashRef=null}
function showDashboard(){
 if(dashboardRef&&!dashboardRef.isDestroyed()){closeStartSplash();dashboardRef.show();dashboardRef.focus();return}
 const wa=screen.getPrimaryDisplay().workArea;dashboardRef=new BrowserWindow({width:Math.min(1400,wa.width),height:Math.min(860,wa.height),minWidth:980,minHeight:650,maximizable:false,fullscreenable:false,frame:false,title:'IASD Projetor — IASD APP',autoHideMenuBar:true,backgroundColor:'#091527',icon:path.join(__dirname,'assets','iasd-app.ico'),webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false,webviewTag:true}});
 dashboardRef.setMenuBarVisibility(false);
 const localPanel=()=>{if(dashboardRef&&!dashboardRef.isDestroyed())dashboardRef.loadFile(path.join(__dirname,'dashboard.html'))};
 const remotePanel=dashboardRemoteUrl();
 if(!remotePanel)localPanel();
 else{
  const wc=dashboardRef.webContents;let settled=false;
  const fallback=()=>{if(settled)return;settled=true;clearTimeout(timer);localPanel()};
  const timer=setTimeout(fallback,7000);
  wc.on('did-fail-load',(e,code,desc,url,isMain)=>{if(isMain!==false&&code!==-3)fallback()});
  wc.once('did-navigate',(e,url,status)=>{if(status>=400)fallback()});
  wc.once('dom-ready',()=>{if(settled)return;wc.executeJavaScript('window.__IASD_PANEL_OK===true').then(ok=>{if(ok){settled=true;clearTimeout(timer)}else fallback()}).catch(fallback)});
  // o painel online só pode navegar dentro do site autorizado; links externos abrem no navegador
  wc.on('will-navigate',(e,url)=>{if(!safeLink(url)&&!url.startsWith('file://')){e.preventDefault()}});
  wc.setWindowOpenHandler(({url})=>{const u=safeLink(url);if(u)shell.openExternal(u);return{action:'deny'}});
  dashboardRef.loadURL(remotePanel,{extraHeaders:'pragma: no-cache\n'}).catch(()=>{});
 }
 dashboardRef.once('ready-to-show',()=>{closeStartSplash();if(!dashboardRef||dashboardRef.isDestroyed())return;dashboardRef.show();dashboardRef.moveTop();dashboardRef.focus()});
 dashboardRef.on('closed',()=>{dashboardRef=null});
}
function closeProjection(){if(windowRef&&!windowRef.isDestroyed())windowRef.close();windowRef=null}
ipcMain.handle('iasd:alert-login',async(_,credentials)=>{try{const email=String(credentials?.email||'').trim(),password=String(credentials?.password||'');if(!email||!password)return {error:'Informe e-mail e senha.'};const {data,error}=await alertCloud.auth.signInWithPassword({email,password});if(error)throw error;await alertStart(data.session);return {ok:true,...alertStatus()}}catch(e){return {error:e.message}}});
ipcMain.handle('iasd:test-alert',()=>{if(!alertAccount)return {error:'Ative os alertas independentes entrando com sua conta no aplicativo.'};showSoundAlert({sender_name:'IASD APP · Teste',message:'Este aviso deve aparecer no Windows mesmo com o navegador fechado. A projeção não será interrompida.',schedule_name:'Teste local'});return {ok:true}});
ipcMain.handle('iasd:google-login',()=>googleLogin());ipcMain.handle('iasd:google-logout',()=>googleLogout());ipcMain.handle('iasd:google-status',async()=>({logged:await googleLogged()}));
ipcMain.handle('iasd:alert-logout',async()=>{await alertLogout();return {ok:true}});
ipcMain.handle('iasd:alerts-history',()=>({ok:true,items:loadAlertHistory()}));
ipcMain.handle('iasd:alert-delete',(_,id)=>{saveAlertHistory(loadAlertHistory().filter(x=>x.id!==id));return{ok:true}});
ipcMain.handle('iasd:alerts-clear',()=>{saveAlertHistory([]);return{ok:true}});
ipcMain.handle('iasd:alerts-mute',(_,value)=>{alertsMuted=!!value;return{ok:true,muted:alertsMuted}});
ipcMain.handle('iasd:identify-monitors',()=>{const wins=[];screen.getAllDisplays().forEach((display,index)=>{const b=display.bounds,w=new BrowserWindow({x:b.x,y:b.y,width:b.width,height:b.height,frame:false,alwaysOnTop:true,skipTaskbar:true,focusable:false,transparent:false,backgroundColor:'#081525',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});wins.push(w);const label=index===0?'COMPUTADOR':'TELÃO';w.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(`<html><body style="margin:0;background:#081525;color:white;height:100vh;display:grid;place-items:center;font-family:Segoe UI"><div style="text-align:center"><div style="font-size:22vw;font-weight:900">${index+1}</div><div style="font-size:4vw;color:#f3cf77;font-weight:800">${label}</div></div></body></html>`));w.once('ready-to-show',()=>w.showInactive())});setTimeout(()=>wins.forEach(w=>{if(!w.isDestroyed())w.close()}),3500);return{ok:true}});
ipcMain.handle('iasd:status',()=>({alertStatus:alertStatus(),paired:pairedTokens.size>0,code:pairingCode,monitor:!!chooseDisplay(),version:app.getVersion(),monitors:monitorInfo(),siteConnected:pairedTokens.size>0&&(Date.now()-lastSiteContact<900000||!!siteIdentity),siteIdentity,lastProjectionContent,youtubeActive:!!youtubeRef&&!youtubeRef.isDestroyed()&&youtubeRef.isVisible(),alertsMuted,projecting:projectionActive(),projectionType:youtubeRef&&!youtubeRef.isDestroyed()&&youtubeRef.isVisible()?'YouTube':lastProjectionContent?'Conteúdo do IASD APP':'Telão livre'}));
ipcMain.handle('iasd:site',async()=>{await refreshRemoteConfig();return shell.openExternal(projectionUrl())});
ipcMain.handle('iasd:new-code',()=>{pairingCode=String(crypto.randomInt(100000,999999));return{ok:true}});
ipcMain.handle('iasd:updates',()=>checkAutomaticUpdate({startup:false}));
ipcMain.handle('iasd:install-update',()=>installDownloadedUpdate());
ipcMain.handle('iasd:install-on-quit',()=>{if(!downloadedUpdate)return{error:'Nenhuma atualização pronta.'};installUpdateOnQuit=true;updateProgress('downloaded','Versão '+downloadedUpdate.version+' pronta. Será instalada quando o IASD Projetor for fechado.',{latest:downloadedUpdate.version,installOnQuit:true});return{ok:true}});
ipcMain.handle('iasd:update-status',()=>updateStatus);
ipcMain.handle('iasd:release',(_,url)=>{if(typeof url!=='string'||!/^https:\/\/github\.com\/victoorlyma5555\/Iasd-studio\/releases\//.test(url))throw Error('Endereço não autorizado');return shell.openExternal(url)});
ipcMain.handle('iasd:open',()=>{try{showProjector();return{ok:true}}catch(e){return{error:e.message}}});
ipcMain.handle('iasd:close',()=>{closeProjection();return{ok:true}});
ipcMain.handle('iasd:window',(_,action)=>{if(!dashboardRef||dashboardRef.isDestroyed())return{error:'Janela indisponível'};if(action==='minimize')dashboardRef.minimize();else if(action==='maximize')return{ok:false};else if(action==='close')dashboardRef.close();else return{error:'Ação inválida'};return{ok:true,maximized:dashboardRef&&!dashboardRef.isDestroyed()&&dashboardRef.isMaximized()}});
async function projectorScript(script){if(!windowRef||windowRef.isDestroyed())showProjector();if(windowRef.webContents.isLoadingMainFrame())await new Promise((resolve,reject)=>{windowRef.webContents.once('did-finish-load',resolve);windowRef.webContents.once('did-fail-load',(_,code,desc)=>reject(Error(desc)))});return windowRef.webContents.executeJavaScript(script)}
ipcMain.handle('iasd:blackout',async(_,enabled)=>{try{await projectorScript(`(()=>{let x=document.getElementById('iasd-desktop-blackout');if(!x){x=document.createElement('div');x.id='iasd-desktop-blackout';Object.assign(x.style,{position:'fixed',inset:'0',background:'#000',zIndex:'2147483647',display:'none'});document.body.appendChild(x)}x.style.display=${enabled?'\'block\'':'\'none\''};return true})()`);return{ok:true,enabled:!!enabled}}catch(e){return{error:e.message}}});
ipcMain.handle('iasd:test-projection',async()=>{try{lastProjectionContent='IASD_TEXT:'+JSON.stringify({title:'Teste de projeção',text:'IASD Projetor conectado e funcionando.'});showProjector();await projectorScript(`window.postMessage({type:'iasd-project',content:'IASD_TEXT:'+JSON.stringify({title:'Teste de projeção',text:'IASD Projetor conectado e funcionando.'})},location.origin);true`);return{ok:true}}catch(e){return{error:e.message}}});
const appearanceFile=path.join(app.getPath('userData'),'appearance.json');
function loadAppearance(){try{return JSON.parse(fs.readFileSync(appearanceFile,'utf8'))}catch{return{images:[],background:'linear-gradient(135deg,#061a2d,#0b4b91)',fit:'cover'}}}
function saveAppearance(v){fs.writeFileSync(appearanceFile,JSON.stringify(v,null,2),'utf8')}
function imageDataUrl(file){const ext=path.extname(file).toLowerCase(),mime=ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg';return 'data:'+mime+';base64,'+fs.readFileSync(file).toString('base64')}
async function applyDesktopProjectionAppearance(a){const bg=String(a.background||'linear-gradient(135deg,#061a2d,#0b4b91)');showProjector();let script;if(a.image&&fs.existsSync(a.image)){const url=imageDataUrl(a.image),fit=a.fit==='contain'?'contain':a.fit==='center'||a.fit==='none'?'center':'cover';script=`(async()=>{applyProjectionBackground('#000000');await applyProjectionVisual({imageUrl:${JSON.stringify(url)},fit:${JSON.stringify(fit)},transition:'fade'});return true})()`}else{script=`(async()=>{applyProjectionBackground(${JSON.stringify(bg)});await applyProjectionVisual({imageUrl:'',imageId:'',fit:'cover',transition:'fade'});return true})()`}await projectorScript(script)}
ipcMain.handle('iasd:appearance',()=>{const a=loadAppearance();return{...a,images:(a.images||[]).filter(x=>fs.existsSync(x)).map(x=>({path:x,name:path.basename(x),preview:imageDataUrl(x)}))}});
ipcMain.handle('iasd:choose-backgrounds',async()=>{const r=await dialog.showOpenDialog(dashboardRef,{title:'Adicionar imagens',properties:['openFile','multiSelections'],filters:[{name:'Imagens',extensions:['jpg','jpeg','png','webp']}]});if(r.canceled)return{canceled:true};const a=loadAppearance();a.images=[...new Set([...(a.images||[]),...r.filePaths])];saveAppearance(a);return{ok:true,images:a.images.map(x=>({path:x,name:path.basename(x)}))}});
ipcMain.handle('iasd:remove-background',(_,file)=>{try{const a=loadAppearance();a.images=(a.images||[]).filter(x=>x!==file);if(a.image===file)a.image='';saveAppearance(a);return{ok:true}}catch(e){return{error:e.message}}});
ipcMain.handle('iasd:clear-backgrounds',()=>{try{const a=loadAppearance();a.images=[];a.image='';saveAppearance(a);return{ok:true}}catch(e){return{error:e.message}}});
ipcMain.handle('iasd:set-background',async(_,v)=>{try{const a=loadAppearance();if(v?.background)a.background=String(v.background);if(v?.fit)a.fit=String(v.fit);a.image=v?.image||'';saveAppearance(a);await applyDesktopProjectionAppearance(a);return{ok:true}}catch(e){return{error:e.message}}});
ipcMain.handle('iasd:set-wallpaper',async(_,file)=>new Promise(resolve=>{if(typeof file!=='string'||!fs.existsSync(file))return resolve({error:'Imagem não encontrada'});const safe=file.replace(/'/g,"''");const ps=`$p='${safe}'; Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name WallpaperStyle -Value '10'; Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name TileWallpaper -Value '0'; Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class W { [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int SystemParametersInfo(int a,int b,string c,int d); }'; $r=[W]::SystemParametersInfo(20,0,$p,3); if(-not $r){exit 1}`;execFile('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-Command',ps],{windowsHide:true},e=>resolve(e?{error:'O Windows não conseguiu aplicar esta imagem como papel de parede.'}:{ok:true}))}));
// Atualizações são verificadas online; a instalação requer confirmação do usuário.
function httpGetText(url,headers){return new Promise((resolve,reject)=>{const req=https.get(url,{headers:Object.assign({'User-Agent':'IASD-Projetor/'+app.getVersion()},headers||{})},res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();httpGetText(new URL(res.headers.location,url).href,headers).then(resolve,reject);return}let body='';res.on('data',c=>{body+=c;if(body.length>400000)req.destroy(Error('Resposta muito grande'))});res.on('end',()=>res.statusCode===200?resolve(body):reject(Error('GitHub indisponível ('+res.statusCode+')')))});req.on('error',reject);req.setTimeout(8000,()=>req.destroy(Error('Tempo de verificação excedido')))})}
/* o GitHub não lista as versões em ordem: escolhe a MAIOR versão. A API tem limite de 60 consultas/hora por rede (403); nesse caso usa o feed público, sem limite. */
async function latestWindowsRelease(){
 const verOf=t=>{const k=/^iasd-projetor-v(\d+)\.(\d+)\.(\d+)/i.exec(t||'');return k?[+k[1],+k[2],+k[3]]:null};
 const cmp=(p,q)=>{for(let i=0;i<3;i++){if(p[i]!==q[i])return p[i]-q[i]}return 0};
 const cur=app.getVersion().split('.').map(Number),base='https://github.com/victoorlyma5555/Iasd-studio/releases/';
 let tag,url,downloadUrl,hasMetadata=true;
 try{
  const releases=JSON.parse(await httpGetText('https://api.github.com/repos/victoorlyma5555/Iasd-studio/releases?per_page=12',{Accept:'application/vnd.github+json'}));
  const r=releases.filter(x=>verOf(x.tag_name)&&!x.draft&&x.assets?.some(a=>/\.exe$/i.test(a.name))).sort((x,y)=>cmp(verOf(y.tag_name),verOf(x.tag_name)))[0];
  if(!r)return{available:false,current:app.getVersion(),message:'Nenhuma versão Windows publicada.'};
  tag=r.tag_name;url=r.html_url;downloadUrl=r.assets.find(a=>/\.exe$/i.test(a.name))?.browser_download_url;hasMetadata=r.assets.some(a=>a.name==='latest.yml')
 }catch(e){
  const m=/\((403|429)\)/.exec(e.message||'');if(!m)throw e;
  const atom=await httpGetText(base.replace('/releases/','/releases.atom'));
  const tags=[...atom.matchAll(/releases\/tag\/(iasd-projetor-v\d+\.\d+\.\d+)/gi)].map(x=>x[1]).filter(t=>verOf(t)).sort((a,b)=>cmp(verOf(b),verOf(a)));
  if(!tags.length)return{available:false,current:app.getVersion(),message:'Nenhuma versão Windows publicada.'};
  tag=tags[0];url=base+'tag/'+tag;downloadUrl=base+'download/'+tag+'/IASD-Projetor-Setup.exe'
 }
 const v=verOf(tag);
 return{available:cmp(v,cur)>0,current:app.getVersion(),latest:v.join('.'),url,downloadUrl,tag,hasMetadata}
}
let _lja=null;const ljaStore=()=>_lja||(_lja=ljaLib.create(app.getPath('userData')));
function reply(res,code,data,req){const origin=req?allowedOrigin(req):(res.__iasdOrigin||SITE);res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':origin||SITE,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Cache-Control':'no-store','Vary':'Origin'});res.end(JSON.stringify(data))}
async function handler(req,res){res.__iasdOrigin=allowedOrigin(req)||SITE;
 if(!allowedOrigin(req)&&!(req.method==='GET'&&/^\/media\/[a-f0-9]{32}$/.test(req.url||'')&&!req.headers.origin)){res.writeHead(403);res.end();return}
 if(req.method==='OPTIONS'){reply(res,204,{},req);return}
 if(req.method==='GET'&&/^\/media\/[a-f0-9]{32}$/.test(req.url||'')){
  const id=req.url.slice(7),item=mediaFiles.get(id);if(!item){reply(res,404,{error:'Mídia não encontrada'});return}
  const size=fs.statSync(item.path).size,range=req.headers.range;let start=0,end=size-1,status=200;
  if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return}if(m[1])start=Number(m[1]);if(m[2])end=Number(m[2]);if(!m[1]&&m[2]){start=Math.max(0,size-Number(m[2]));end=size-1}if(start>=size||end>=size||start>end){res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return}status=206}
  const headers={'Content-Type':item.type,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Cache-Control':'no-store','Access-Control-Allow-Origin':allowedOrigin(req)||SITE,'Cross-Origin-Resource-Policy':'cross-origin'};if(status===206)headers['Content-Range']='bytes '+start+'-'+end+'/'+size;res.writeHead(status,headers);fs.createReadStream(item.path,{start,end}).pipe(res);return
 }
 if(req.url==='/media/upload'&&req.method==='POST'){
  if(!authorized(req)){reply(res,401,{error:'Pareamento necessário'});return}
  const type=String(req.headers['content-type']||'');if(!/^(video|audio)\/[a-z0-9.+-]+$/i.test(type)){reply(res,415,{error:'Formato de mídia inválido'});return}
  const length=Number(req.headers['content-length']);if(!Number.isFinite(length)||length<=0||length>MEDIA_LIMIT){reply(res,413,{error:'Limite de 250 MB por arquivo'});return}
  const id=crypto.randomBytes(16).toString('hex'),folder=path.join(app.getPath('temp'),'iasd-projetor-media');fs.mkdirSync(folder,{recursive:true});const dest=path.join(folder,id);let bytes=0;try{const writer=fs.createWriteStream(dest,{flags:'wx'});for await(const chunk of req){bytes+=chunk.length;if(bytes>MEDIA_LIMIT||bytes>length)throw Error('Arquivo excedeu o limite');if(!writer.write(chunk))await new Promise(resolve=>writer.once('drain',resolve))}await new Promise((resolve,reject)=>writer.end(err=>err?reject(err):resolve()));if(bytes!==length)throw Error('Upload incompleto');mediaFiles.set(id,{path:dest,type});reply(res,200,{url:'http://127.0.0.1:'+PORT+'/media/'+id});return}catch(e){try{fs.unlinkSync(dest)}catch{}reply(res,400,{error:e.message});return}
 }

 if(req.url==='/youtube/frame'&&req.method==='GET'){if(!authorized(req)){reply(res,401,{error:'Pareamento necessário'});return}try{reply(res,200,{image:await youtubeFrame(),id:youtubeVideoId})}catch(e){reply(res,409,{error:e.message})}return}
 if(req.url==='/status'&&req.method==='GET'){reply(res,200,{online:true,paired:pairedTokens.size>0,secondMonitor:!!chooseDisplay(),projecting:!!windowRef&&!windowRef.isDestroyed(),version:app.getVersion(),youtubePreview:!!youtubeRef&&!youtubeRef.isDestroyed(),monitors:monitorInfo(),siteConnected:Date.now()-lastSiteContact<45000,siteIdentity});return}

 /* Biblioteca do Louvor JA (somente leitura): o site lê a pasta do programa por aqui, sem passar pelo Chrome */
 if(req.method==='GET'&&(req.url||'').startsWith('/lja/')){
  if(!authorized(req)){reply(res,401,{error:'Pareamento necessário'});return}
  const lja=ljaStore(),u=new URL(req.url,'http://127.0.0.1');
  if(u.pathname==='/lja/state'){reply(res,200,lja.state());return}
  const cors={'Access-Control-Allow-Origin':allowedOrigin(req)||SITE,'Cross-Origin-Resource-Policy':'cross-origin','Vary':'Origin'};
  if(u.pathname==='/lja/cache'){const f=lja.cachePath();if(!f){reply(res,404,{error:'Sem cópia da lista'});return}lja.sendFile(req,res,f,Object.assign({'Content-Type':'application/json; charset=utf-8'},cors));return}
  if(u.pathname==='/lja/db'){const f=lja.dbPath();if(!f){reply(res,404,{error:'Banco do Louvor JA não encontrado'});return}lja.sendFile(req,res,f,cors);return}
  if(u.pathname==='/lja/file'){const f=lja.resolveRel(u.searchParams.get('p')||'');if(!f){reply(res,404,{error:'Arquivo não encontrado'});return}lja.sendFile(req,res,f,cors);return}
  reply(res,404,{error:'Rota desconhecida'});return
 }
 const bodyLimit=req.url==='/project'?6000000:req.url==='/lja/cache'?31000000:100000;let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>bodyLimit){reply(res,413,{error:'Mensagem muito grande'});return}}
 let data={};try{data=JSON.parse(raw||'{}')}catch{reply(res,400,{error:'JSON inválido'});return}
 if(req.url==='/lja/cache'&&req.method==='POST'){
  if(!authorized(req)){reply(res,401,{error:'Pareamento necessário'});return}
  try{if(!data.ix||typeof data.ix.cols!=='object'||!data.meta)throw Error('Lista inválida.');reply(res,200,{ok:true,cache:ljaStore().cachePut(raw,data.at)})}catch(e){reply(res,400,{error:e.message})}return
 }
 if(req.url==='/lja/scan'&&req.method==='POST'){
  if(!authorized(req)){reply(res,401,{error:'Pareamento necessário'});return}
  try{reply(res,200,await ljaStore().scan())}catch(e){reply(res,409,{error:e.message})}return
 }
 if(req.url==='/lja/pick'&&req.method==='POST'){
  if(!authorized(req)){reply(res,401,{error:'Pareamento necessário'});return}
  try{
   const lja=ljaStore(),kind=data.kind==='db'?'db':'root';
   const parent=dashboardRef&&!dashboardRef.isDestroyed()?dashboardRef:undefined;
   if(parent){try{parent.show();parent.focus()}catch{}}
   const r=await dialog.showOpenDialog(parent,kind==='db'?{title:'Escolha o database.db do Louvor JA',properties:['openFile'],filters:[{name:'Banco do Louvor JA',extensions:['db']}]}:{title:'Escolha a pasta do Louvor JA',properties:['openDirectory']});
   if(r.canceled||!r.filePaths[0]){reply(res,200,Object.assign(lja.state(),{canceled:true}));return}
   reply(res,200,kind==='db'?lja.setDb(r.filePaths[0]):lja.setRoot(r.filePaths[0]))
  }catch(e){reply(res,409,{error:e.message})}return
 }
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
 if(req.url==='/unpair'&&req.method==='POST'){
  const header=String(req.headers.authorization||'');const token=header.startsWith('Bearer ')?header.slice(7):'';
  if(token)pairedTokens.delete(token);authToken=[...pairedTokens][0]||null;
  try{savePairing()}catch(e){reply(res,500,{error:'Falha ao salvar o despareamento'});return}
  if(dashboardRef&&!dashboardRef.isDestroyed())dashboardRef.webContents.reload();
  reply(res,200,{ok:true,paired:pairedTokens.size>0});return;
 }
 if(req.url==='/heartbeat'&&req.method==='POST'){lastSiteContact=Date.now();siteIdentity={name:String(data.name||'Usuário autenticado').slice(0,90),email:String(data.email||'').slice(0,150),role:String(data.role||'').slice(0,40),avatar:String(data.avatar||data.avatar_url||'').slice(0,1000)};reply(res,200,{ok:true});return}
 if(req.url==='/alert-replies'&&req.method==='POST'){const out=pendingAlertReplies;pendingAlertReplies=[];reply(res,200,{replies:out});return}
 if(req.url==='/alert'&&req.method==='POST'){if(typeof data.id!=='string'||!/^[a-f0-9-]{36}$/.test(data.id)||typeof data.message!=='string'||!data.message.trim()||data.message.length>500){reply(res,400,{error:'Alerta inválido'});return}if(!alertSeen.has(data.id)&&lastAlertId!==data.id){alertSeen.add(data.id);lastAlertId=data.id;storeAlert(data);if(!alertsMuted)showSoundAlert(data);if(dashboardRef&&!dashboardRef.isDestroyed())dashboardRef.webContents.send('iasd:alert-history-changed')}reply(res,200,{ok:true});return}
 if(req.url==='/youtube/prepare'&&req.method==='POST'){try{await prepareYoutube(String(data.id||''));reply(res,200,{ok:true,id:youtubeVideoId})}catch(e){reply(res,409,{error:e.message})}return}
 if(req.url==='/youtube/control'&&req.method==='POST'){if(!['play','pause','mute','unmute'].includes(data.action)){reply(res,400,{error:'Controle inválido'});return}if(!youtubeRef||youtubeRef.isDestroyed()){reply(res,409,{error:'Prepare o vídeo primeiro'});return}const code={play:'v.play()',pause:'v.pause()',mute:'v.muted=true',unmute:'v.muted=false'}[data.action];if(!await youtubeVideoDo(code)){reply(res,409,{error:'O player ainda está carregando. Tente novamente em instantes.'});return}reply(res,200,{ok:true});return}
 if(req.url==='/youtube/project'&&req.method==='POST'){try{const display=await projectPreparedYoutube(Math.min(2000,Math.max(0,+data.ms||0)));reply(res,200,{ok:true,monitor:display.label||'Monitor secundário'})}catch(e){reply(res,409,{error:e.message})}return}
 if(req.url==='/youtube/close'&&req.method==='POST'){closeYoutube();reply(res,200,{ok:true});return}
 if(req.url==='/open'&&req.method==='POST'){
  try{const display=showProjector();reply(res,200,{ok:true,monitor:display.label||'Monitor secundário'})}catch(e){reply(res,409,{error:e.message})}return;
 }
 if(req.url==='/project'&&req.method==='POST'){
  if(typeof data.content!=='string'||data.content.length>(data.content.replace(/^IASD_TR:[a-z]+:\d{1,4}\|/,'').startsWith('IASD_LYRIC:')?4000000:50000)){reply(res,400,{error:'Conteúdo inválido'});return}
  try{
   const content=data.content;
   if(content===''&&(!windowRef||windowRef.isDestroyed())&&!(youtubeRef&&!youtubeRef.isDestroyed()&&youtubeShown)){lastProjectionContent='';reply(res,200,{ok:true,closed:true});return}
   // Novo conteúdo substitui o vídeo do telão (sem áudio residual); conteúdo vazio = tela preta.
   if(youtubeRef&&!youtubeRef.isDestroyed()&&youtubeShown){const ms=trMs(content);if(ms)await fadeWin(youtubeRef,0,Math.round(ms*.5));if(content==='')await blackoutYoutube();else closeYoutube();try{if(youtubeRef&&!youtubeRef.isDestroyed())youtubeRef.setOpacity(1)}catch{}}
   showProjector();
   lastProjectionContent=content;
   if(windowRef.webContents.isLoadingMainFrame())await new Promise((resolve,reject)=>{windowRef.webContents.once('did-finish-load',resolve);windowRef.webContents.once('did-fail-load',(_,code,desc)=>reject(new Error(desc)))});
   await windowRef.webContents.executeJavaScript('window.postMessage('+JSON.stringify({type:'iasd-project',content})+', location.origin)');
   reply(res,200,{ok:true});
  }catch(e){reply(res,409,{error:e.message})}return;
 }
 if(req.url==='/close'&&req.method==='POST'){if(youtubeRef&&!youtubeRef.isDestroyed()&&youtubeShown){const ms=Math.min(2000,Math.max(0,+data.ms||0));if(ms)await fadeWin(youtubeRef,0,ms)}closeYoutube();if(windowRef&&!windowRef.isDestroyed())windowRef.close();windowRef=null;reply(res,200,{ok:true});return}
 reply(res,404,{error:'Rota desconhecida'});
}
if(primaryInstance)app.whenReady().then(()=>{
 if(!process.argv.includes('--hidden'))showStartSplash();
 loadCachedRemoteConfig();
 loadPairing();
 void alertRestore();
 app.setLoginItemSettings({openAtLogin:true,path:process.execPath,args:app.isPackaged?['--autostart']:['.','--autostart']});
 tray=new Tray(createTrayIcon());
 tray.setToolTip('IASD Projetor · v'+app.getVersion());
 tray.on('double-click',showDashboard);
 function refreshTrayMenu(){
  const siteOnline=Date.now()-lastSiteContact<45000;
  const screenOpen=projectionActive();
  tray.setContextMenu(Menu.buildFromTemplate([
   {label:'IASD Projetor · v'+app.getVersion(),enabled:false},
   {label:(siteOnline?'● IASD APP conectado':'○ Aguardando IASD APP'),enabled:false},
   {label:(screenOpen?'● Telão em projeção':'○ Telão aguardando'),enabled:false},
   {type:'separator'},
   {label:'Abrir painel',click:showDashboard},
   {label:'Abrir IASD Projetor no site',click:()=>{void refreshRemoteConfig().finally(()=>shell.openExternal(projectionUrl()))}},
   {type:'separator'},
   {label:screenOpen?'Fechar telão':'Abrir telão',click:()=>{try{if(projectionActive()){closeYoutube();if(windowRef&&!windowRef.isDestroyed())windowRef.close();windowRef=null}else showProjector();setTimeout(refreshTrayMenu,150)}catch(e){dialog.showErrorBox('IASD Projetor',e.message)}}},
   {label:'Código de pareamento: '+pairingCode,click:()=>dialog.showMessageBox({type:'info',title:'Pareamento · IASD Projetor',message:'Código: '+pairingCode,detail:'Digite este código no IASD APP para autorizar este computador.'})},
   {type:'separator'},
   {label:'Sobre',click:()=>dialog.showMessageBox({type:'info',title:'IASD Projetor',message:'IASD Projetor · v'+app.getVersion(),detail:'Desenvolvido por Victor Lima\\nIASD APP'})},
   {label:'Sair',click:()=>{if(installUpdateOnQuit&&downloadedUpdate&&!projectionActive())installDownloadedUpdate();else app.quit()}}
  ]));
 }
 refreshTrayMenu();
 tray.on('click',()=>refreshTrayMenu());
 server=http.createServer((req,res)=>{void handler(req,res).catch(()=>reply(res,500,{error:'Erro interno'}))});
 server.on('error',error=>{
  if(error.code==='EADDRINUSE'){
   dialog.showMessageBox({type:'warning',title:'IASD Projetor já está em execução',message:'A porta 38741 já está em uso.',detail:'Verifique o IASD Projetor perto do relógio do Windows. Se houver outra versão aberta, feche-a antes de iniciar esta.'}).finally(()=>app.quit());
  }else{
   dialog.showErrorBox('IASD Projetor — falha ao iniciar',error.message);
   app.quit();
  }
 });
 server.listen(PORT,'127.0.0.1',()=>{confirmUpdatedVersion();void refreshRemoteConfig();setInterval(()=>{void refreshRemoteConfig()},3600000);if(!process.argv.includes('--hidden'))showDashboard();if(!startupUpdateChecked){startupUpdateChecked=true;setTimeout(()=>{void checkAutomaticUpdate({startup:true})},4000)}});
});
app.on('window-all-closed',()=>{});
app.on('before-quit',event=>{if(installUpdateOnQuit&&downloadedUpdate&&!installingUpdate&&!projectionActive()){event.preventDefault();installDownloadedUpdate();return}server?.close();clearMedia();if(alertRecoveryTimer)clearInterval(alertRecoveryTimer);if(alertChannel)void alertCloud.removeChannel(alertChannel)});
