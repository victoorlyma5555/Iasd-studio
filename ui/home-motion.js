/* IASD APP · Rolagem animada e resposta ao toque da página inicial.
   - Blocos (.hm-rv) entram em sequência ao rolar: opacidade + deslocamento leve + atraso entre cartões relacionados.
   - Toque e caneta recebem a mesma resposta do hover (classe .is-tap), então nada depende do mouse.
   - Respeita "reduzir movimento" do aparelho e a escolha do menu (Automático, Completo, Suave, Desligado).
   - Rede de segurança: nada fica escondido por mais de 2,6 s. */
(function () {
  'use strict';
  const UI = window.IASDUI;
  if (!UI || typeof UI.afterRender !== 'function') return;
  const motionOff = () => {
    try { const v = localStorage.getItem('iasd-motion'); if (v === 'off') return true; if (v === 'full' || v === 'calm') return false; } catch (e) { }
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  let io = null, last = null;
  function reveal(root) {
    if (io) { io.disconnect(); io = null; }
    const els = [...root.querySelectorAll('.hm-rv')];
    if (!els.length || motionOff() || !('IntersectionObserver' in window)) { root.classList.remove('hm-anim'); return; }
    root.classList.add('hm-anim');
    io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -7% 0px', threshold: .08 });
    els.forEach(el => io.observe(el));
    setTimeout(() => els.forEach(el => el.classList.add('in')), 2600);
  }
  function tap(root) {
    root.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      const el = e.target.closest('.hm-act'); if (!el) return;
      el.classList.add('is-tap'); setTimeout(() => el.classList.remove('is-tap'), 700);
    });
  }
  const original = UI.afterRender;
  UI.afterRender = function () {
    const r = original.apply(this, arguments);
    try { const root = document.querySelector('.hm'); if (root && root !== last) { last = root; reveal(root); tap(root); } else if (!root) { last = null; } } catch (e) { console.error('[Home]', e); }
    return r;
  };
})();
