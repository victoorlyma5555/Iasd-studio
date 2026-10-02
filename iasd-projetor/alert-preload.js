const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('iasdAlert',{
 reply:(text)=>ipcRenderer.invoke('iasd:alert-reply',String(text||'').slice(0,300)),
 close:()=>ipcRenderer.invoke('iasd:alert-close')
});
