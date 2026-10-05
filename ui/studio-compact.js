/* Studio: o texto de apoio de cada janela vira um "i" ao lado do título (toque para ver). */
(function(){
function inject(){document.querySelectorAll('.mp-tt').forEach(function(t){if(t.querySelector('.mp-i'))return;var p=t.querySelector('p'),h=t.querySelector('h2');if(!p||!h)return;var b=document.createElement('button');b.type='button';b.className='mp-i';b.setAttribute('aria-label','Sobre esta janela');b.title='Sobre esta janela';b.textContent='i';h.insertAdjacentElement('afterend',b)})}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.mp-i');document.querySelectorAll('.mp-tt.open').forEach(function(t){if(!b||t!==b.parentElement)t.classList.remove('open')});if(b)b.parentElement.classList.toggle('open')});
if(document.readyState!=='loading')inject();else document.addEventListener('DOMContentLoaded',inject);
setInterval(inject,1500);
})();
document.addEventListener('click',function(e){var h=e.target.closest&&e.target.closest('#sth-conn .sth-conn:not(.ok) .sth-ch');if(h)document.getElementById('sth-conn').classList.toggle('open')});
/* altura da janela do módulo = altura do preview (rolagem fica dentro da janela) */
(function(){var r=document.documentElement;function sync(){var l=document.querySelector('.st-left');if(!l)return;var h=Math.round(l.getBoundingClientRect().height);if(h>200&&innerWidth>1000)r.style.setProperty('--st-h',h+'px');else r.style.removeProperty('--st-h')}
function init(){sync();var l=document.querySelector('.st-left');if(l&&window.ResizeObserver)new ResizeObserver(sync).observe(l);addEventListener('resize',sync);setInterval(sync,1200)}
if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init)})();
