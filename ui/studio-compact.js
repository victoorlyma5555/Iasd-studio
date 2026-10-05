/* Studio: o texto de apoio de cada janela vira um "i" ao lado do título (toque para ver). */
(function(){
function inject(){document.querySelectorAll('.mp-tt').forEach(function(t){if(t.querySelector('.mp-i'))return;var p=t.querySelector('p'),h=t.querySelector('h2');if(!p||!h)return;var b=document.createElement('button');b.type='button';b.className='mp-i';b.setAttribute('aria-label','Sobre esta janela');b.title='Sobre esta janela';b.textContent='i';h.insertAdjacentElement('afterend',b)})}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.mp-i');document.querySelectorAll('.mp-tt.open').forEach(function(t){if(!b||t!==b.parentElement)t.classList.remove('open')});if(b)b.parentElement.classList.toggle('open')});
if(document.readyState!=='loading')inject();else document.addEventListener('DOMContentLoaded',inject);
setInterval(inject,1500);
})();
document.addEventListener('click',function(e){var h=e.target.closest&&e.target.closest('#sth-conn .sth-conn:not(.ok) .sth-ch');if(h)document.getElementById('sth-conn').classList.toggle('open')});
/* altura da janela do módulo = altura do preview (rolagem fica dentro da janela) */
(function(){var r=document.documentElement;function sync(){var l=document.querySelector('.st-left');if(!l)return;var k=[].filter.call(l.children,function(c){return c.offsetHeight>0}),cs=getComputedStyle(l),gp=parseFloat(cs.rowGap)||0,h=Math.round(k.reduce(function(a,c){return a+c.getBoundingClientRect().height},0)+gp*Math.max(0,k.length-1)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+2+44);if(h>244&&innerWidth>1000)r.style.setProperty('--st-h',h+'px');else r.style.removeProperty('--st-h')}
function init(){sync();var l=document.querySelector('.st-left');if(l&&window.ResizeObserver)new ResizeObserver(sync).observe(l);addEventListener('resize',sync);setInterval(sync,1200)}
if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init)})();
/* abas internas dos módulos (Sorteador, Cronômetro): .m-tabs > button[data-t] ↔ .m-pane[data-p] */
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.m-tabs button');if(!b)return;var sec=b.closest('section');if(!sec)return;sec.querySelectorAll('.m-tabs button').forEach(function(x){x.classList.toggle('on',x===b)});sec.querySelectorAll('.m-pane').forEach(function(p){p.hidden=p.getAttribute('data-p')!==b.getAttribute('data-t')});var ps=sec.querySelector('.m-pane:not([hidden])');if(ps)ps.scrollTop=0});
/* Temas: duas abas — "Temas" (prévia + fundo animado + lista) e "Transição" (bloco criado pelo studio-transition) */
(function(){function build(){var s=document.getElementById('themes');if(!s||s.querySelector('.m-tabs'))return;var tr=s.querySelector('.tr-box'),prev=document.getElementById('thPrev'),fx=s.querySelector('.st-fxrow'),list=document.getElementById('stThemes'),hd=s.querySelector('.mp-head');if(!tr||!prev||!fx||!list||!hd)return;
var tabs=document.createElement('div');tabs.className='seg m-tabs';tabs.setAttribute('role','tablist');tabs.innerHTML='<button type="button" class="on" data-t="a">Temas</button><button type="button" data-t="b">Transição</button>';
var a=document.createElement('div');a.className='m-pane';a.setAttribute('data-p','a');var b=document.createElement('div');b.className='m-pane';b.setAttribute('data-p','b');b.hidden=true;
hd.insertAdjacentElement('afterend',tabs);tabs.insertAdjacentElement('afterend',a);a.insertAdjacentElement('afterend',b);a.append(prev,fx,list);b.append(tr)}
setInterval(build,800)})();

try{if(window.parent&&window.parent!==window)document.documentElement.classList.add('emb')}catch(e){}
