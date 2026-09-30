(function(){
const M=window.IASDModules;if(!M)return;
M.register({id:'sonoplastia',page:'Sonoplastia',route:'/sonoplastia',critical:true,render(ctx){
 if(!ctx.canUseSound())return ctx.soundDenied();
 return '<div class="sound-hub"><div class="sound-hub-head"><span class="sound-hub-eyebrow">CENTRAL AUDIOVISUAL</span><h2>Sonoplastia</h2><p>Controle projeção, Bíblia, sorteios e mídias a partir de uma central organizada para o culto.</p></div><div class="sound-hub-grid"><button onclick="go(\'Projeção\')"><span>▣</span><strong>Studio de Projeção</strong><small>Abra a central completa para controlar o telão e as apresentações.</small></button><button onclick="go(\'Bíblia\')"><span>▥</span><strong>Bíblia</strong><small>Acesse rapidamente a leitura bíblica disponível no IASD APP.</small></button><button onclick="go(\'Sorteadores\')"><span>✦</span><strong>Sorteadores</strong><small>Acesse as ferramentas de sorteio já disponíveis para a equipe.</small></button></div></div>';
}});
})();