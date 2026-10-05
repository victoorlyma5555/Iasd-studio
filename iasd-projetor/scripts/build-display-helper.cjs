'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
function buildHelper(){
 if(process.platform!=='win32')throw Error('Build do helper requer Windows com .NET Framework 4.x.');
 const framework=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET');
 const compiler=['Framework64','Framework'].map(dir=>path.join(framework,dir,'v4.0.30319','csc.exe')).find(p=>fs.existsSync(p));
 if(!compiler)throw Error('Compilador do .NET Framework não encontrado no Windows de build.');
 const native=path.join(__dirname,'..','native');
 execFileSync(compiler,['/nologo','/optimize+','/target:winexe','/platform:anycpu','/reference:System.Web.Extensions.dll','/out:'+path.join(native,'iasd-display-helper.exe'),path.join(native,'DisplayHelper.cs')],{windowsHide:true,stdio:'pipe',timeout:30000});
 console.info('Display helper compilado ('+fs.statSync(path.join(native,'iasd-display-helper.exe')).size+' bytes).');
}
module.exports=buildHelper;
if(require.main===module)buildHelper();
