(function(){
const M=window.IASDModules;if(!M)return;
M.register({id:'escalas',page:'Escalas',route:'/escalas',render(ctx){return ctx.section('escalas','Escalados do dia e do mês','Data — nome — função')}});
M.register({id:'datas-especiais',page:'Datas especiais',route:'/datas-especiais',render(ctx){return ctx.section('datas','Datas especiais','Data — evento')}});
})();