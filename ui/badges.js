/* IASD APP · Selos ilustrados ("adesivos").
   Conjunto de ícones desenhados para o app, em formas diferentes (círculo, hexágono, cápsula, selo e ingresso), com contorno branco de adesivo e traço à mão.
   As cores acompanham a paleta e o tema escolhidos pela igreja (--au-*). Cada ícone tem uma parte que se move em hover, foco e toque.
   Uso: IASDBadge.html('biblia', 56)  ->  string <svg>. Carregue ANTES de ui/shell.js. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- formas (grade 48 x 48) ---------- */
  const star = (n, r1, r2, rot) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = (Math.PI * i) / n + (rot || 0), r = i % 2 ? r2 : r1; d += (i ? 'L' : 'M') + (24 + r * Math.sin(a)).toFixed(2) + ' ' + (24 - r * Math.cos(a)).toFixed(2); } return d + 'Z'; };
  const SHAPES = {
    circle: { d: 'M24 2a22 22 0 1 0 .01 0z', fill: 'url(#bdg-blue)', ring: 'var(--bd-gold)', ink: 'var(--bd-gold)', rot: 0 },
    hex: { d: 'M24 2.6l18.6 10.7v21.4L24 45.4 5.4 34.7V13.3z', fill: 'url(#bdg-navy)', ring: 'var(--bd-gold)', ink: 'var(--bd-gold)', rot: 0 },
    tag: { d: 'M13 4h22a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H13a8 8 0 0 1-8-8V12a8 8 0 0 1 8-8z', fill: 'url(#bdg-blue2)', ring: 'rgba(255,255,255,.55)', ink: '#fff', rot: 7 },
    seal: { d: star(12, 22.6, 19, 0), fill: 'var(--bd-cream)', ring: 'var(--bd-gold)', ink: 'var(--bd-deep)', rot: 0, inner: true },
    ticket: { d: 'M8 6h32a2 2 0 0 1 2 2v10a3 3 0 0 0 0 6v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V24a3 3 0 0 0 0-6V8a2 2 0 0 1 2-2z', fill: 'var(--bd-cream)', ring: 'var(--bd-gold)', ink: 'var(--bd-deep)', rot: -6, perf: true }
  };

  /* ---------- desenhos (traço); as classes g-* são as partes que se movem ---------- */
  const GL = {
    biblia: '<path d="M6.5 15.5c5.2-1.8 11-1.4 17.5 2 6.5-3.4 12.3-3.8 17.5-2v20.2c-5.2-1.8-11-1.4-17.5 1.8-6.5-3.2-12.3-3.6-17.5-1.8z"/><path d="M24 17.5V37.5"/><g class="g-cross"><path d="M15.2 19.4v9.6M11.8 22.6h6.8"/></g><path class="g-page" d="M28.5 21.5h8.4M28.5 25.4h8.4M28.5 29.3h8.4"/><path d="M8.6 38.4c5.2-1 10.4-.6 15.4 1.6 5-2.2 10.2-2.6 15.4-1.6" opacity=".6"/>',
    cronograma: '<rect x="7.5" y="10" width="33" height="29" rx="6"/><path d="M7.5 19h33M16 6.5v7M32 6.5v7"/><circle cx="24" cy="29" r="6.2"/><path class="g-hand" d="M24 25.6V29l2.6 1.8"/><path d="M12.5 14.2h.1M35.5 14.2h.1" stroke-width="3"/>',
    escalas: '<g class="g-p2"><circle cx="11.5" cy="19" r="4"/><path d="M5 34c.4-4.4 3-6.6 6.5-6.6"/></g><g class="g-p3"><circle cx="36.5" cy="19" r="4"/><path d="M43 34c-.4-4.4-3-6.6-6.5-6.6"/></g><g class="g-p1"><circle cx="24" cy="15.5" r="5.6"/><path d="M13.5 37c.8-6.6 5-10 10.5-10s9.7 3.4 10.5 10z"/></g><path d="M20.5 10.5c1.2-1.4 2.2-2 3.5-2 1.3 0 2.3.6 3.5 2" opacity=".6"/>',
    licao: '<path d="M11 8.5h21a4 4 0 0 1 4 4V37a2.6 2.6 0 0 1-2.6 2.6H14.4A4.4 4.4 0 0 1 10 35.2V9.5a1 1 0 0 1 1-1z"/><path d="M10 35.2a4.4 4.4 0 0 1 4.4-4.4H36"/><path d="M17 16h12M17 21h8"/><path class="g-rib" d="M27 8.5v10.5l3.4-2.4 3.4 2.4V8.5"/><g class="g-ray"><path d="M40.5 8.5l2.6-2.4M43.5 15h3.3M38 4l.7-3"/></g>',
    mais: '<g class="g-dots"><rect x="10" y="10" width="11" height="11" rx="4"/><rect x="27" y="10" width="11" height="11" rx="4"/><rect x="10" y="27" width="11" height="11" rx="4"/><circle class="g-new" cx="32.5" cy="32.5" r="6"/><path class="g-new" d="M32.5 29.5v6M29.5 32.5h6"/></g>',
    estudio: '<rect x="6" y="9" width="36" height="25" rx="5"/><path class="g-play" d="M20.5 15.5v12l10-6z"/><path d="M16 40h16M24 34v6"/><path class="g-wave" d="M3 18c-1.2 2-1.2 5 0 7M45 18c1.2 2 1.2 5 0 7" opacity=".7"/>',
    oracao: '<g class="g-hands"><path d="M22.5 8c5.8 2.3 9.8 9 8.7 17.2l-1 11.8h-9.6l-1.3-9.6c-.9-7.2.7-14.2 3.2-19.4z"/><path d="M24 12.6c1.7 3.5 2.7 6.5 3.1 9.6M27.4 11.2c1.5 3 2.3 5.7 2.5 8.2"/><path d="M19.6 27c-3.1-1.2-6 .5-5.6 3.3.4 2.9 3.1 5.3 6.2 5.3"/><path d="M18 37h14.2v4.6H18z" fill="currentColor" fill-opacity=".25"/></g><g class="g-ray"><path d="M10.5 11l2.6 2.3M38 8l-2 2.8M6.5 21.5l3.2.7M41.5 19l-3.3 1"/></g>',
    plano: '<path d="M6.5 17c5-1.8 10.8-1.4 17.5 1.8 6.7-3.2 12.5-3.6 17.5-1.8v19.5c-5-1.8-10.8-1.4-17.5 1.8-6.7-3.2-12.5-3.6-17.5-1.8z"/><path d="M24 18.8v19.5"/><path class="g-rib" d="M30.5 17.4V29l3-2.2 3 2.2V16.8"/><g class="g-sun"><path d="M24 11.2a4.6 4.6 0 0 1 4.6 4.6M15 11.5l1.6 1.6M33 11.5l-1.6 1.6M24 5.5v2.2"/></g><path d="M11.5 22.6h8M11.5 26.6h8M11.5 30.6h6" opacity=".75"/>',
    lembrete: '<path class="g-bell" d="M11.5 32.5V22a12.5 12.5 0 0 1 25 0v10.5l3 4.5h-31z"/><path d="M19.5 41.5a5 5 0 0 0 9 0"/><g class="g-ray"><path d="M24 4.2v3.2M10.5 8.6l2.2 2.2M37.5 8.6l-2.2 2.2"/></g>',
    parabens: '<rect x="8" y="22" width="32" height="19" rx="3.5"/><path d="M6 17h36v5.5H6zM24 17v24"/><path class="g-bow" d="M24 17c-3-7-11-8.5-11-3.6 0 3 7 3.6 11 3.6zM24 17c3-7 11-8.5 11-3.6 0 3-7 3.6-11 3.6z"/><g class="g-conf"><path d="M9 8.5l1.8 1.8M38.5 6.5l-1.5 2M43 24.5h3M3 26h3" opacity=".8"/></g>',
    campeoes: '<path class="g-cup" d="M14.5 6.5h19v10a9.5 9.5 0 0 1-19 0z"/><path d="M14.5 10H8c0 6 2.6 9.2 7 10M33.5 10H40c0 6-2.6 9.2-7 10M24 26v8M16.5 41h15M19 34h10v7H19z"/><path class="g-star" d="M24 10.4l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"/>',
    arena: '<rect x="6" y="14" width="36" height="22" rx="9"/><path d="M15.5 21v8M11.5 25h8"/><circle class="g-b1" cx="31" cy="23" r="1.7" fill="currentColor"/><circle class="g-b2" cx="35.5" cy="27.5" r="1.7" fill="currentColor"/><g class="g-ray"><path d="M24 4.5v4M15 7l2 3M33 7l-2 3"/></g>',
    pomba: '<path d="M7 34.5c6.4-.6 11.6-3.6 15-8.4 2.2-3.2 5.2-4.8 8.6-4.6 2.8.2 5 1.8 5.6 4.4.6 2.8-.6 5.6-3.4 8-3.6 3.2-9.2 4.6-14.8 4.2-3.8-.3-7.2-1.5-11-3.6z"/><circle cx="34.8" cy="25.8" r="1.1" fill="currentColor" stroke="none"/><path d="M39.4 25.4l4.4 1.4-4.2 1.8"/><g class="g-wing"><path d="M20.8 27.4c-1.8-7.4.8-14.6 7.4-19.6.6 6.6.2 11.6-2.2 16.4"/><path d="M26 25.4c1-6.8 4.6-11.6 10.4-14 -.4 6.4-2.8 10.8-7 14"/></g><path d="M7 34.5l-4.4 3.4M10.4 36.4l-3.4 4.6"/><g class="g-olive"><path d="M38.8 29.6c2.4 2 4.6 2.2 6.6 1"/><path d="M40.6 31c.2-2 1.4-3.2 3.2-3.4.2 2-.8 3.4-3.2 3.4z" fill="currentColor" fill-opacity=".4"/></g>',
    luz: '<path class="g-flame" d="M24 6c.4 6.5 8 10.6 8 19.2a8 8 0 0 1-16 0c0-4 2.4-5.6 3.6-9 1.2 1.6 1.8 2.8 1.8 4.4 2.6-3.2 2.8-9.2 2.6-14.6z"/><path d="M13 41c3.4-1.6 7-2 11-.6 4-1.4 7.6-1 11 .6" opacity=".7"/>',
    sino: '<path d="M11.5 32.5V22a12.5 12.5 0 0 1 25 0v10.5l3 4.5h-31z"/><path d="M19.5 41.5a5 5 0 0 0 9 0"/>',
    usuario: '<circle cx="24" cy="16" r="7.5"/><path d="M9 40c1-8 6.6-12.5 15-12.5S38 32 39 40z"/>',
    perfil: '<circle cx="24" cy="16" r="7.5"/><path d="M9 40c1-8 6.6-12.5 15-12.5S38 32 39 40z"/>'
  };

  /* ---------- definições de cor (uma vez por página) ---------- */
  let defsDone = false;
  function ensureDefs() {
    if (defsDone || !document.body) return; defsDone = true;
    const s = document.createElement('div'); s.setAttribute('aria-hidden', 'true'); s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.innerHTML = '<svg width="0" height="0" focusable="false"><defs>'
      + '<linearGradient id="bdg-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--au-b,#2f6bff) 100%,#fff 8%)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--au-b,#2f6bff) 70%,#001a80)"/></linearGradient>'
      + '<linearGradient id="bdg-blue2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--au-b,#2f6bff) 78%,#6ec1ff)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--au-b,#2f6bff) 82%,#001a80)"/></linearGradient>'
      + '<linearGradient id="bdg-navy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in srgb,var(--au-b,#2f6bff) 30%,#0b0b33)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--au-b,#2f6bff) 16%,#05051c)"/></linearGradient>'
      + '</defs></svg>';
    document.body.appendChild(s);
  }
  if (document.body) ensureDefs(); else document.addEventListener('DOMContentLoaded', ensureDefs);

  /* ---------- API ---------- */
  function html(name, size, shape) {
    ensureDefs();
    const sh = SHAPES[shape || DEFAULT_SHAPE[name] || 'circle'], gl = GL[name] || GL.estudio, s = size || 52;
    const rot = sh.rot ? ' transform="rotate(' + sh.rot + ' 24 24)"' : '';
    return '<svg class="bdg bdg--' + name + '" width="' + s + '" height="' + s + '" viewBox="-2 -2 52 52" aria-hidden="true" focusable="false">'
      + '<g' + rot + '><path d="' + sh.d + '" fill="none" stroke="#fff" stroke-width="5.4" stroke-linejoin="round" class="bdg-sticker"/>'
      + '<path d="' + sh.d + '" fill="' + sh.fill + '" stroke="' + sh.ring + '" stroke-width="1.6" stroke-linejoin="round"/>'
      + (sh.inner ? '<circle cx="24" cy="24" r="14.6" fill="none" stroke="var(--bd-blue)" stroke-width="1.3"/>' : '')
      + (sh.perf ? '<rect x="9.5" y="9.5" width="29" height="29" rx="3" fill="none" stroke="var(--bd-gold)" stroke-width="1.1" stroke-dasharray="1.6 2.4"/>' : '')
      + '<g class="bdg-gl" transform="translate(24 24) scale(' + (sh.inner || sh.perf ? '.6' : '.68') + ') translate(-24 -24)" fill="none" stroke="' + sh.ink + '" stroke-width="' + (sh.inner || sh.perf ? '2.9' : '2.6') + '" stroke-linecap="round" stroke-linejoin="round" style="color:' + sh.ink + '">' + gl + '</g></g></svg>';
  }
  /* forma preferida de cada significado (ritmo visual: círculo, hexágono, cápsula, selo, ingresso) */
  const DEFAULT_SHAPE = { biblia: 'hex', cronograma: 'seal', escalas: 'circle', licao: 'tag', mais: 'tag', estudio: 'hex', oracao: 'ticket', plano: 'tag', lembrete: 'circle', parabens: 'seal', campeoes: 'hex', arena: 'circle', pomba: 'circle', luz: 'seal', sino: 'circle', usuario: 'circle', perfil: 'circle' };
  window.IASDBadge = { html, names: Object.keys(GL), shapes: Object.keys(SHAPES), defaults: DEFAULT_SHAPE };
})();
