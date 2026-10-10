(function(){
'use strict';
const M=window.IASDModules;if(!M)return;
const paths={globe:'M21 12a9 9 0 11-18 0 9 9 0 0118 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',monitor:'M3 4h18v12H3ZM8 21h8M12 16v5',folder:'M3 6h6l2 2h10v12H3Z',music:'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0ZM20 16a3 3 0 11-6 0 3 3 0 016 0Z',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',open:'M14 3h7v7M21 3l-9 9M10 3H3v18h18v-7'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n]}"/></svg>`;
window.openStudioWeb=function(){
 if(typeof canUseStudio==='function'&&canUseStudio()){go('Projeção');return}
 if(typeof openAuthModal==='function'&&!(typeof cloudUser!=='undefined'&&cloudUser)){openAuthModal();return}
 const note=document.getElementById('studio-web-access');if(note){note.hidden=false;note.focus()}
};
M.register({id:'sonoplastia',page:'Sonoplastia',route:'/sonoplastia',critical:true,render(){
 return `<section class="studio-entry" aria-labelledby="studio-entry-title">
 <header class="studio-entry-head"><h2 id="studio-entry-title">IASD Studio</h2><p>Sua central de sonoplastia e projeção. Escolha como deseja usar.</p></header>
 <div class="studio-entry-options">
 <article class="studio-entry-option"><header><span class="studio-entry-icon">${icon('globe')}</span><div><h3>IASD Studio WEB</h3><p>Direto no navegador</p></div></header>
 <div class="studio-entry-visual"><div class="studio-entry-browser"><div class="studio-entry-browserbar" aria-hidden="true"><i></i><i></i><i></i><span></span></div><img src="/shots/studio-entry/web.jpg" alt="Interface do IASD Studio WEB" width="1600" height="1000"></div></div>
 <p class="studio-entry-description">Abra as ferramentas de projeção pelo site, sem instalar o Studio.</p><ul><li>${icon('monitor')}Acesso pelo navegador</li><li>${icon('music')}Bíblia, músicas, sorteador e cronômetro</li></ul>
 <button class="studio-entry-action" type="button" onclick="openStudioWeb()">${icon('open')}Abrir Studio WEB</button><p id="studio-web-access" class="studio-entry-access" tabindex="-1" hidden>O Studio WEB é reservado à equipe de sonoplastia. Solicite a liberação da sua conta ao responsável pela igreja.</p></article>
 <article class="studio-entry-option"><header><span class="studio-entry-icon">${icon('monitor')}</span><div><h3>IASD Studio PC</h3><p>Aplicativo para Windows</p></div></header>
 <div class="studio-entry-visual"><div class="studio-entry-monitor"><img src="/shots/studio-entry/pc.png" alt="Interface do IASD Studio para Windows" width="1600" height="1000"></div><div class="studio-entry-stand" aria-hidden="true"></div></div>
 <p class="studio-entry-description">Instale no computador da igreja para organizar e projetar o culto.</p><ul><li>${icon('folder')}Biblioteca e arquivos disponíveis offline</li><li>${icon('music')}Controles de áudio e projeção no telão</li></ul>
 <a class="studio-entry-action" href="https://github.com/victoorlyma5555/Iasd-studio/releases/download/iasd-studio-channel/IASD-Studio-Setup.exe">${icon('download')}Baixar Studio PC</a></article></div>
 <p class="studio-entry-help">WEB: acesso pelo site. PC: instalação no Windows; conteúdos baixados podem ser usados sem internet.</p><footer class="studio-entry-credit">Idealizado e desenvolvido por Victor Lima</footer></section>`;
}});
})();
