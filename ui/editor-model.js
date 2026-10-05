/* Shared, dependency-free draft model. Loaded only by the editor. */
(function(root){
'use strict';
const clone=v=>JSON.parse(JSON.stringify(v));
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const slot=/^(home_banner(?:_[1-9][0-9]*)?|site_logo|home_passage|home_icon_[a-zA-Z0-9_-]{1,120}|custom_cover_[a-zA-Z0-9_-]{1,120})$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const path=p=>typeof p==='string'&&p.length<=500&&/^[a-zA-Z0-9_./ -]+$/.test(p)&&!p.includes('..')&&!p.startsWith('/');
function validate(d){
 const errors=[];
 if(!d||typeof d!=='object'||Array.isArray(d))return ['Documento inválido.'];
 if(Object.keys(d).sort().join(',')!=='assets,frames,tabs,texts')errors.push('Estrutura inválida.');
 for(const k of ['texts','assets','frames'])if(!d[k]||typeof d[k]!=='object'||Array.isArray(d[k]))errors.push(k+': formato inválido.');
 if(!Array.isArray(d.tabs))errors.push('Abas inválidas.');
 if(errors.length)return errors;
 for(const [k,v]of Object.entries(d.texts))if(k.length<1||k.length>100||typeof v!=='string'||v.length>10000)errors.push('Texto inválido: '+k);
 for(const [k,v]of Object.entries(d.assets))if(!slot.test(k)||!path(v))errors.push('Imagem inválida: '+k);
 for(const [k,f]of Object.entries(d.frames))if(!f||typeof f!=='object'||Array.isArray(f)||!slot.test(k)||!Number.isInteger(f.position_x)||!Number.isInteger(f.position_y)||f.position_x<0||f.position_x>100||f.position_y<0||f.position_y>100||!Number.isFinite(f.zoom)||f.zoom<1||f.zoom>3||Object.keys(f).sort().join(',')!=='position_x,position_y,zoom')errors.push('Enquadramento inválido: '+k);
 const ids=new Set();
 for(const t of d.tabs){if(!t||typeof t!=='object'||Array.isArray(t)){errors.push('Aba inválida.');continue;}if(Object.keys(t).sort().join(',')!=='description,icon,id,sort_order,title'||!uuid.test(t.id)||ids.has(t.id)||typeof t.title!=='string'||!t.title.trim()||t.title.length>70||typeof t.description!=='string'||t.description.length>2000||typeof t.icon!=='string'||t.icon.length>12||!Number.isInteger(t.sort_order)||t.sort_order<0||t.sort_order>100000)errors.push('Aba inválida.');ids.add(t.id);}
 if(d.texts.home_editor_props){try{const p=JSON.parse(d.texts.home_editor_props);if(!p||Array.isArray(p)||typeof p!=='object')throw Error();for(const [id,o]of Object.entries(p)){if(!/^(banner|passage|cards|card:[a-zA-Z0-9_:-]+)$/.test(id)||!o||typeof o!=='object'||Array.isArray(o))throw Error();for(const [k,v]of Object.entries(o)){if(k==='hidden'){if(typeof v!=='boolean')throw Error();}else if(k==='align'){if(!['left','center','right'].includes(v))throw Error();}else if(k==='order'){if(!Number.isInteger(v)||v<0||v>1000)throw Error();}else if(['title','description','alt'].includes(k)){if(typeof v!=='string'||v.length>1000)throw Error();}else if(k==='destination'){if(!['Cronograma','Bíblia','Escalas','Datas especiais','Mídia','Mais'].includes(v)&&!(v.startsWith('custom:')&&ids.has(v.slice(7))))throw Error();}else throw Error();}}
 }catch(e){errors.push('Propriedades dos componentes inválidas.');}}
 if(d.texts.home_carousel_seconds!==undefined&&!(Number(d.texts.home_carousel_seconds)>=2&&Number(d.texts.home_carousel_seconds)<=30))errors.push('Tempo do carrossel inválido.');
 if(d.texts.home_carousel_cfg){try{const c=JSON.parse(d.texts.home_carousel_cfg);if(!c||Array.isArray(c)||typeof c!=='object')throw Error();for(const [k,v]of Object.entries(c)){if(k==='sec'){if(typeof v!=='number'||v<2||v>30)throw Error();}else if(k==='fx'){if(!['fade','slide','zoom'].includes(v))throw Error();}else if(['shuffle','dots','arrows','pause'].includes(k)){if(typeof v!=='boolean')throw Error();}else if(['order','off'].includes(k)){if(!Array.isArray(v)||new Set(v).size!==v.length||v.some(s=>typeof s!=='string'||!/^home_banner(?:_[1-9][0-9]*)?$/.test(s)))throw Error();}else throw Error();}}catch(e){errors.push('Configuração do carrossel inválida.');}}
 if(canonical(d).length>500000)errors.push('Rascunho muito grande.');
 return errors;
}
function diff(a,b){const changes=[];for(const scope of ['texts','assets','frames'])for(const key of new Set([...Object.keys(a[scope]),...Object.keys(b[scope])]))if(canonical(a[scope][key])!==canonical(b[scope][key]))changes.push({scope,key,before:a[scope][key],after:b[scope][key]});const x=Object.fromEntries(a.tabs.map(t=>[t.id,t])),y=Object.fromEntries(b.tabs.map(t=>[t.id,t]));for(const key of new Set([...Object.keys(x),...Object.keys(y)]))if(canonical(x[key])!==canonical(y[key]))changes.push({scope:'tabs',key,before:x[key],after:y[key]});return changes;}
class History{
 constructor(value,limit=80){this.value=clone(value);this.undoStack=[];this.redoStack=[];this.limit=limit;this.group='';this.at=0;}
 set(next,group=''){if(canonical(next)===canonical(this.value))return false;const now=Date.now();if(!group||group!==this.group||now-this.at>1200){this.undoStack.push(clone(this.value));if(this.undoStack.length>this.limit)this.undoStack.shift();}this.value=clone(next);this.redoStack=[];this.group=group;this.at=now;return true;}
 undo(){if(!this.undoStack.length)return false;this.redoStack.push(this.value);this.value=this.undoStack.pop();this.group='';return true;}
 redo(){if(!this.redoStack.length)return false;this.undoStack.push(this.value);this.value=this.redoStack.pop();this.group='';return true;}
}
const api={clone,canonical,validate,diff,History,path,slot};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.IASDEditorModel=api;
})(typeof window==='undefined'?globalThis:window);
