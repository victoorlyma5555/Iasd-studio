'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const allowed=new Set(['iasd:status','iasd:site','iasd:open','iasd:close']);
contextBridge.exposeInMainWorld('iasd',{invoke:channel=>allowed.has(channel)?ipcRenderer.invoke(channel):Promise.reject(Error('Ação não permitida'))});
