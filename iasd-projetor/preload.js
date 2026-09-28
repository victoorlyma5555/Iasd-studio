'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const allowed=new Set(['iasd:status','iasd:site','iasd:open','iasd:close','iasd:updates','iasd:new-code']);
contextBridge.exposeInMainWorld('iasd',{invoke:(channel,arg)=>allowed.has(channel)?ipcRenderer.invoke(channel,arg):Promise.reject(Error('Ação não permitida')),openRelease:url=>ipcRenderer.invoke('iasd:release',url)});
