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
 b.innerHTML='<b class="stt-name">Studio de Projeção</b><div class="stt-pills">'+items.map(([l,ok,btn])=>'<'+(btn?'button type="button" data-st-setup':'span')+' class="stt-pill'+(ok?' ok':'')+'"><i></i>'+l+'</'+(btn?'button':'span')+'>').join('')+'</div><button type="button" class="stt-gear" data-st-cfg title="Configurações do Studio" aria-label="Configurações"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg></button>';
 const gr=b.querySelector('[data-st-cfg]');if(gr)gr.onclick=()=>{try{document.getElementById('iasd-studio-frame').contentWindow.showTool('setup')}catch(e){}};
 const bt=b.querySelector('[data-st-setup]');if(bt)bt.onclick=()=>{try{document.getElementById('iasd-studio-frame').contentWindow.showTool('setup')}catch(e){}};
}
setInterval(paint,700);paint();
})();
