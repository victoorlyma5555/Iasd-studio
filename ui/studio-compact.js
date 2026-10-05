/* Studio: o texto de apoio de cada janela vira um "i" ao lado do título (toque para ver). */
(function(){
function inject(){document.querySelectorAll('.mp-tt').forEach(function(t){if(t.querySelector('.mp-i'))return;var p=t.querySelector('p'),h=t.querySelector('h2');if(!p||!h)return;var b=document.createElement('button');b.type='button';b.className='mp-i';b.setAttribute('aria-label','Sobre esta janela');b.title='Sobre esta janela';b.textContent='i';h.insertAdjacentElement('afterend',b)})}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.mp-i');document.querySelectorAll('.mp-tt.open').forEach(function(t){if(!b||t!==b.parentElement)t.classList.remove('open')});if(b)b.parentElement.classList.toggle('open')});
if(document.readyState!=='loading')inject();else document.addEventListener('DOMContentLoaded',inject);
setInterval(inject,1500);
})();
document.addEventListener('click',function(e){var h=e.target.closest&&e.target.closest('#sth-conn .sth-conn:not(.ok) .sth-ch');if(h)document.getElementById('sth-conn').classList.toggle('open')});
