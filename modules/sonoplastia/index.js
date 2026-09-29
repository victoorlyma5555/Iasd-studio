(function(){
const M=window.IASDModules;if(!M)return;
M.register({id:'sonoplastia',page:'Sonoplastia',route:'/sonoplastia',critical:true,render(ctx){
 if(!ctx.canUseSound())return ctx.soundDenied();
 return '<div class="sound-hub"><div class="sound-hub-head"><span class="sound-hub-eyebrow">CENTRAL TÉCNICA</span><h2>Sonoplastia</h2><p>Todos os controles de sorteio, Bíblia e mídia estão reunidos no projetor.</p></div><div class="sound-hub-grid"><button onclick="go(\'Projeção\')"><span>▣</span><strong>Abrir projetor</strong><small>Controle o telão, a Bíblia, os sorteios e as mídias em um só lugar.</small></button></div></div>';
}});
})();