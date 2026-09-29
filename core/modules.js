(function(){
'use strict';
const registry=new Map();
function register(def){
 if(!def||!def.id||typeof def.render!=='function')throw new Error('Módulo IASD inválido');
 registry.set(def.id,Object.freeze({...def}));
 return def;
}
function get(id){return registry.get(id)||null}
function render(id,ctx={}){const mod=get(id);return mod?mod.render(ctx):null}
function afterRender(id,ctx={}){const mod=get(id);if(mod&&typeof mod.afterRender==='function')mod.afterRender(ctx)}
window.IASDModules={register,get,render,afterRender,list:()=>[...registry.keys()]};
})();