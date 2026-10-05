/* Na aba Projeção (sonoplastia): o cabeçalho do site troca a pesquisa por "Studio de Projeção" + estado das conexões.
   Os dados vêm do próprio Studio (iframe); o banner interno do Studio fica oculto para poupar espaço. */
(function(){
'use strict';
let box=null,on=false,last='';
function doc(){try{const f=document.getElementById('iasd-studio-frame');return f&&f.contentDocument}catch(e){return null}}
function ensure(){
 const top=document.querySelector('.iu-top');if(!top)return null;
 if(box&&box.isConnected)return box;
 box=document.createElement('div');box.className='stt-wrap';box.hidden=true;
 const sp=top.querySelector('.iu-sp');top.insertBefore(box,sp||null);return box;
}
function read(d){
 const g=id=>{const e=d.getElementById(id);return e&&e.getAttribute('data-connected')==='true'};
 const p=d.getElementById('chipProj');
 const ok=!!(p&&p.querySelector('.st-dot.ok'));
 const t=p&&p.querySelector('.st-txt');
 return [['IASD APP',g('stHealthApp')],['Pareamento',g('stHealthPair')],['Telão',g('stHealthScreen')],[t?t.innerHTML:'IASD Projetor',ok,true]];
}
function paint(){
 const isOn=typeof current!=='undefined'&&current==='Projeção';
 if(isOn!==on){on=isOn;document.documentElement.classList.toggle('st-top',on)}
 const b=ensure();if(!b)return;b.hidden=!on;if(!on)return;
 const d=doc();if(!d)return;
 const items=read(d),key=JSON.stringify(items);if(key===last&&b.firstChild)return;last=key;
 b.innerHTML='<b class="stt-name">Studio de Projeção</b><div class="stt-pills">'+items.map(([l,ok,btn])=>'<'+(btn?'button type="button" data-st-setup':'span')+' class="stt-pill'+(ok?' ok':'')+'"><i></i>'+l+'</'+(btn?'button':'span')+'>').join('')+'</div>';
 const bt=b.querySelector('[data-st-setup]');if(bt)bt.onclick=()=>{try{document.getElementById('iasd-studio-frame').contentWindow.showTool('setup')}catch(e){}};
}
setInterval(paint,700);paint();
})();
