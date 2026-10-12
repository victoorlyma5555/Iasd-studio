/* IASD APP · Cabeçalho dinâmico.
   Substitui a barra lateral fixa: o topo vira o banner da Home (com as fotos do carrossel que a igreja já enviou) e encolhe nas outras páginas.
   O menu que ficava na lateral agora abre em um painel pelo botão "Menu" (mesmos itens e mesmas permissões, vindos de ui/shell.js).
   Este arquivo não altera rotas, login, permissões, banco de dados nem APIs: os dados vêm de siteAssets/assetFrames/homeBannerItems (app/main.js).
   Carregue DEPOIS de ui/shell.js. Para voltar ao visual anterior: ?ui=old. */
(function () {
  'use strict';
  const UI = window.IASDUI;
  if (!UI || typeof UI.afterRender !== 'function') return;
  UI.headerEnabled = true;                       // shell.js lê isto: a Home deixa de desenhar o banner interno (o cabeçalho é o banner)
  const g = fn => { try { return fn(); } catch (e) { return undefined; } };
  const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = id => document.getElementById(id);
  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

  /* ---------- movimento: o aparelho manda, a pessoa pode ajustar ---------- */
  const MKEY = 'iasd-motion';                     // 'full' | 'calm' | 'off'; ausente = segue o aparelho
  const pref = () => { try { const v = localStorage.getItem(MKEY); return v === 'full' || v === 'calm' || v === 'off' ? v : null; } catch (e) { return null; } };
  const sysReduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const motion = () => pref() || (sysReduced() ? 'off' : 'full');
  function applyMotionAttr() { const p = pref(), h = document.documentElement; if (p) h.setAttribute('data-motion', p); else h.removeAttribute('data-motion'); }
  function setMotion(v) { try { if (v === 'auto') localStorage.removeItem(MKEY); else localStorage.setItem(MKEY, v); } catch (e) { } applyMotionAttr(); if (car) { car.st.auto = motion() !== 'off'; car.sync(); } paintMotionPref(); }
  applyMotionAttr();

  /* ---------- dados (os mesmos da Home atual) ---------- */
  function slides() {
    const items = g(() => homeBannerItems()) || [];
    return items.map(({ slot, path }) => ({ slot, path, url: g(() => imageUrl(path)) || '', video: /\.(mp4|webm|mov)$/i.test(path), f: g(() => assetFrames[slot]) || {} })).filter(s => s.url);
  }
  const seconds = () => Math.min(30, Math.max(2, num(g(() => homeCarouselSeconds()), 5)));
  const manage = () => !!g(() => canManageSite());
  const user = () => g(() => cloudUser) || null;
  function firstName() {
    const p = g(() => myProfile) || null, u = user();
    const n = String((p && p.full_name) || (u && u.user_metadata && u.user_metadata.full_name) || '').trim();
    return n && !n.includes('@') ? n.split(/\s+/)[0] : '';
  }
  const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  /* ---------- ícones do cabeçalho ---------- */
  const ICP = {
    prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>',
    pause: '<rect x="6.5" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/><rect x="13.7" y="5" width="3.8" height="14" rx="1.2" fill="currentColor"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5" fill="currentColor" fill-opacity=".16"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15.3" r="3.2"/><path class="hand" d="M12 13.5v1.8l1.3.9"/>'
  };
  const ic = (n, s) => '<svg class="hd-ic hd-ic--' + n + '" width="' + (s || 22) + '" height="' + (s || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICP[n] || '') + '</svg>';

  /* ---------- navegação principal no topo (substitui a lista da lateral) ---------- */
  const NAV = [['Painel', 'Início'], ['Cronograma', 'Cronogramas'], ['Escalas', 'Escalas'], ['Sonoplastia', 'IASD Studio'], ['Bíblia', 'Bíblia'], ['Lição da Escola Sabatina', 'Lição'], ['Jogo', 'Jogos']];
  function enhanceTop() {
    const top = $('iu-top'); if (!top) return;
    if (!top.querySelector('.hd-brand')) {
      top.insertAdjacentHTML('afterbegin', '<button type="button" class="hd-brand" data-go="Painel" aria-label="IASD APP, ir para o início"><img src="/iasd-app-logo.png?v=1" alt="" width="38" height="38"><span><b>IASD <i>APP</i></b></span></button>'
        + '<nav class="hd-nav" aria-label="Páginas principais">' + NAV.map(([id, label]) => '<button type="button" class="hd-link" data-go="' + E(id) + '"><span>' + E(label) + '</span></button>').join('')
        + '<button type="button" class="hd-link hd-more" data-act="menu" aria-haspopup="dialog" aria-controls="iu-side"><span>Mais</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></nav>');
    }
    const cur = g(() => current) || 'Painel';
    top.querySelectorAll('.hd-link[data-go]').forEach(b => { if (b.dataset.go === cur) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const menu = top.querySelector('.iu-menu'); if (menu && !menu.querySelector('.hd-menu-t')) { menu.setAttribute('aria-controls', 'iu-side'); }
  }

  /* ---------- o cabeçalho ---------- */
  let sig = '', car = null;
  function build() {
    if ($('hd')) return $('hd');
    const main = document.querySelector('body > main'), top = $('iu-top'); if (!main || !top) return null;
    const hd = document.createElement('div'); hd.id = 'hd'; hd.className = 'hd'; hd.setAttribute('role', 'banner'); hd.setAttribute('data-mode', 'page');   // div (não <header>): o app antigo esconde <header> soltos
    hd.innerHTML = '<div class="hd-bg" aria-hidden="true"></div><div class="hd-mesh" aria-hidden="true"></div><div class="hd-scrim" aria-hidden="true"></div><div class="hd-body" id="hd-body"></div><div class="hd-ctl" id="hd-ctl"></div>';
    main.parentNode.insertBefore(hd, main);
    wire(hd);
    return hd;
  }
  function bgHTML(sl) {
    return sl.map((s, i) => {
      const st = '--x:' + num(s.f.position_x, 50) + '%;--y:' + num(s.f.position_y, 50) + '%;--z:' + num(s.f.zoom, 1) + ';--kx:' + (i % 2 ? '1.6%' : '-1.6%') + ';--ky:' + (i % 3 === 1 ? '1.1%' : '-1.1%');
      const media = s.video ? '<video class="hd-media" muted loop playsinline autoplay src="' + E(s.url) + '"></video>' : '<img class="hd-media kb" src="' + E(s.url) + '" alt="" decoding="async"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + '>';
      return '<div class="hd-slide' + (i === 0 ? ' is-active' : '') + '" style="' + st + '" data-i="' + i + '" role="group" aria-roledescription="slide" aria-label="Foto ' + (i + 1) + ' de ' + sl.length + '"' + (i ? ' aria-hidden="true"' : '') + '>' + media + '</div>';
    }).join('');
  }
  function ctlHTML(n) {
    if (n < 2) return '';
    return '<div class="hd-btns"><button type="button" class="hd-cbtn" data-hd="prev" aria-label="Foto anterior">' + ic('prev', 22) + '</button><button type="button" class="hd-cbtn" data-hd="next" aria-label="Próxima foto">' + ic('next', 22) + '</button><button type="button" class="hd-cbtn hd-toggle" data-hd="toggle" id="hd-toggle"><span class="i">' + ic('pause', 18) + '</span><span class="t">Pausar</span></button></div>'
      + '<ol class="hd-dots" aria-label="Escolher foto">' + Array.from({ length: n }, (_, i) => '<li><button type="button" class="hd-dot" data-hd="go" data-i="' + i + '" aria-label="Ir para a foto ' + (i + 1) + ' de ' + n + '"' + (i === 0 ? ' aria-current="true"' : '') + '><i></i></button></li>').join('') + '</ol><span class="hd-count" id="hd-count" aria-hidden="true">1 / ' + n + '</span><div class="hd-sr" id="hd-live" aria-live="polite"></div>';
  }
  function bodyHTML(home, sl) {
    if (!home) { const t = $('iu-title'); return '<h1 class="hd-title" id="hd-h1">' + E((t && t.textContent) || 'IASD APP') + '</h1>'; }
    const lay = g(() => bannerLayersHTML()) || '', name = firstName();
    const copy = lay ? '' : '<div class="hd-copy"><span class="hd-chip">IASD APP</span><h1 class="hd-hello" id="hd-h1">' + E(greeting()) + (name ? ', <em>' + E(name) + '</em>' : '') + '</h1><p>' + (user() ? 'Que bom ter você aqui. Veja o que está acontecendo e como participar.' : 'Acompanhe a programação da sua igreja, as escalas e participe.') + '</p><div class="hd-cta"><button type="button" class="hd-btn hd-btn--p" data-go="Cronograma">' + ic('cal', 20) + 'Ver programação' + ic('arrow', 18) + '</button></div>' + (!sl.length && manage() ? '<p class="hd-hint">Toque em “Editar banner” para colocar as fotos e os avisos da sua igreja.</p>' : '') + '</div>';
    return (lay ? '<h1 class="hd-sr" id="hd-h1">' + E(greeting()) + '</h1><div class="hd-layers">' + lay + '</div>' : '') + copy + (manage() ? '<button type="button" class="hd-edit" data-act="banner">✎ Editar banner</button>' : '');
  }

  /* ---------- carrossel do cabeçalho ---------- */
  function setupCarousel(hd) {
    if (car && car.stop) car.stop(); car = null;
    const sl = [...hd.querySelectorAll('.hd-slide')], dots = [...hd.querySelectorAll('.hd-dot')], n = sl.length;
    hd.classList.toggle('has-photos', n > 0);
    if (n < 2) return;
    const sec = seconds();
    hd.style.setProperty('--hd-int', sec + 's'); hd.style.setProperty('--hd-kb', (sec + 1.4) + 's');
    const st = { i: 0, user: false, hover: false, focus: false, hidden: document.hidden, off: false, auto: motion() !== 'off' };
    const live = hd.querySelector('#hd-live'), count = hd.querySelector('#hd-count'), tgl = hd.querySelector('#hd-toggle');
    /* temporizador em JavaScript (não depende de animação CSS). Pausa com cursor em cima, foco, aba oculta, cabeçalho fora da tela ou pausa manual. */
    let timer = null, t0 = 0, remaining = sec * 1000, was = false;
    const runnable = () => hd.dataset.mode === 'home' && st.auto && !st.user && !(st.hover || st.focus || st.hidden || st.off);
    function stop() { if (timer) { clearTimeout(timer); timer = null; remaining = Math.max(400, remaining - (Date.now() - t0)); } }
    function run() { if (timer || !runnable()) return; t0 = Date.now(); timer = setTimeout(() => { timer = null; remaining = sec * 1000; show(st.i + 1, false); }, remaining); }
    function sync() {
      const playing = st.auto && !st.user, paused = st.hover || st.focus || st.hidden || st.off;
      if (playing && !was) remaining = sec * 1000; was = playing;
      hd.classList.toggle('is-playing', playing); hd.classList.toggle('is-paused', paused);
      if (tgl) { tgl.querySelector('.t').textContent = playing ? 'Pausar' : 'Reproduzir'; tgl.querySelector('.i').innerHTML = ic(playing ? 'pause' : 'play', 18); tgl.setAttribute('aria-label', playing ? 'Pausar a troca automática de fotos' : 'Reproduzir a troca automática de fotos'); }
      if (runnable()) run(); else stop();
    }
    function show(i, announce) {
      i = ((i % n) + n) % n; st.i = i;
      sl.forEach((s, k) => { const on = k === i; s.classList.toggle('is-active', on); if (on) { s.removeAttribute('aria-hidden'); s.removeAttribute('inert'); } else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('inert', ''); } const v = s.querySelector('video'); if (v) { if (on) v.play().catch(() => { }); else v.pause(); } });
      dots.forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      if (count) count.textContent = (i + 1) + ' / ' + n;
      const nx = sl[(i + 1) % n].querySelector('img'); if (nx && nx.loading === 'lazy') nx.loading = 'eager';
      if (announce && live) live.textContent = 'Foto ' + (i + 1) + ' de ' + n;
      if (timer) { clearTimeout(timer); timer = null; } remaining = sec * 1000; run();
    }
    car = { st, show, sync, stop, n };
    hd._car = car;
    if (hd.dataset.wired !== '1') hd.dataset.wired = '1';
    show(0, false); sync();
  }
  /* eventos do cabeçalho (ligados uma única vez; usam a variável car atual) */
  function wire(hd) {
    hd.addEventListener('click', e => {
      const b = e.target.closest('[data-hd]'); if (!b || !car) return;
      const a = b.dataset.hd, st = car.st;
      if (a === 'next') car.show(st.i + 1, true); else if (a === 'prev') car.show(st.i - 1, true); else if (a === 'go') car.show(num(b.dataset.i, 0), true);
      else if (a === 'toggle') { st.user = !st.user; if (!st.user) st.auto = true; car.sync(); }
    });
    hd.addEventListener('pointerenter', e => { if (car && e.pointerType === 'mouse') { car.st.hover = true; car.sync(); } });
    hd.addEventListener('pointerleave', e => { if (car && e.pointerType === 'mouse') { car.st.hover = false; car.sync(); } });
    hd.addEventListener('focusin', () => { if (car) { car.st.focus = true; car.sync(); } });
    hd.addEventListener('focusout', e => { if (car && !hd.contains(e.relatedTarget)) { car.st.focus = false; car.sync(); } });
    hd.addEventListener('keydown', e => {
      if (!car || hd.dataset.mode !== 'home' || e.target.closest('input,select,textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); car.show(car.st.i + 1, true); } else if (e.key === 'ArrowLeft') { e.preventDefault(); car.show(car.st.i - 1, true); }
      else if (e.key === 'Home') { e.preventDefault(); car.show(0, true); } else if (e.key === 'End') { e.preventDefault(); car.show(car.n - 1, true); }
    });
    let sx = 0, sy = 0, sid = null;
    hd.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; if (e.target.closest('button,a,input,select')) return; sx = e.clientX; sy = e.clientY; sid = e.pointerId; });
    hd.addEventListener('pointerup', e => { if (e.pointerId !== sid || !car) return; sid = null; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) car.show(car.st.i + (dx < 0 ? 1 : -1), true); });
    hd.addEventListener('pointercancel', () => { sid = null; });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { if (car) { car.st.off = !es[0].isIntersecting; car.sync(); } }, { threshold: .15 }).observe(hd);
    /* resposta ao toque igual ao hover (setas, botões) */
    hd.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; const el = e.target.closest('.hd-cbtn,.hd-btn,.hd-edit'); if (!el) return; el.classList.add('is-tap'); setTimeout(() => el.classList.remove('is-tap'), 700); });
  }
  document.addEventListener('visibilitychange', () => { if (car) { car.st.hidden = document.hidden; car.sync(); } });

  /* ---------- rolagem: barra vira vidro e a imagem tem paralaxe leve ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const hd = $('hd'), y = window.scrollY || 0; if (!hd) return;
      const stuck = y > 24; document.body.classList.toggle('hd-scrolled', stuck);
      const h = hd.offsetHeight || 1; hd.style.setProperty('--hd-p', Math.min(1, Math.max(0, y / h)).toFixed(3));
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- menu (painel que substitui a lateral): foco, rótulos e fechamento ---------- */
  let lastOpener = null;
  function syncDrawer() {
    const side = $('iu-side'); if (!side) return;
    const open = document.body.classList.contains('iu-open');
    if (open) { side.removeAttribute('inert'); side.setAttribute('role', 'dialog'); side.setAttribute('aria-modal', 'true'); side.setAttribute('aria-label', 'Menu principal'); }
    else { side.setAttribute('inert', ''); side.removeAttribute('aria-modal'); }
    document.querySelectorAll('.iu-menu,.iu-bn-menu,.hd-more').forEach(b => b.setAttribute('aria-expanded', String(open)));
    if (open) { const first = side.querySelector('.iu-nav,.iu-side-me'); if (first) setTimeout(() => { try { first.focus({ preventScroll: true }); } catch (e) { } }, 60); }
    else if (lastOpener && document.contains(lastOpener)) { try { lastOpener.focus({ preventScroll: true }); } catch (e) { } lastOpener = null; }
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-act="menu"]'); if (b) lastOpener = b; }, true);
  new MutationObserver(syncDrawer).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  function paintMotionPref() {
    const box = document.querySelector('#iu-side .hd-motion'); if (!box) return;
    const cur = pref() || 'auto';
    box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === cur)));
  }
  function injectMotionPref() {
    const side = $('iu-side'); if (!side || side.querySelector('.hd-motion')) return;
    const b = (v, t) => '<button type="button" data-hd-motion="' + v + '" data-v="' + v + '" aria-pressed="false">' + t + '</button>';
    side.insertAdjacentHTML('beforeend', '<div class="hd-motion" role="group" aria-label="Movimento da página"><b>Movimento da página</b><small>“Automático” segue a configuração do seu aparelho.</small><div class="hd-seg">' + b('auto', 'Automático') + b('full', 'Completo') + b('calm', 'Suave') + b('off', 'Desligado') + '</div></div>');
    paintMotionPref();
  }
  document.addEventListener('click', e => { const m = e.target.closest('[data-hd-motion]'); if (m) setMotion(m.dataset.v); });

  /* ---------- contraste garantido nos botões coloridos, em qualquer paleta e tema ---------- */
  const cv = document.createElement('canvas').getContext('2d');
  const rgbOf = str => { try { cv.fillStyle = '#000'; cv.fillStyle = String(str).trim(); const h = cv.fillStyle; if (/^#/.test(h)) return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const m = h.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [255, 255, 255]; } catch (e) { return [255, 255, 255]; } };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const mixTo = (c, t, k) => c.map((v, i) => Math.round(v + (t[i] - v) * k));
  const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  function syncContrast() {
    const cs = getComputedStyle(document.documentElement);
    let a = rgbOf(cs.getPropertyValue('--au-a1') || '#ffc15e'), b = rgbOf(cs.getPropertyValue('--au-a2') || '#ff8a4c');
    const dark = [20, 10, 36], white = [255, 255, 255], worst = ink => Math.min(ratio(ink, a), ratio(ink, b));
    let ink = worst(dark) >= worst(white) ? dark : white;
    for (let k = 0; k < 24 && worst(ink) < 4.5; k++) { const to = ink === dark ? white : [0, 0, 0]; a = mixTo(a, to, .08); b = mixTo(b, to, .08); }
    const st = document.documentElement.style; st.setProperty('--hd-g1', hex(a)); st.setProperty('--hd-g2', hex(b)); st.setProperty('--hd-ink', hex(ink));
    document.documentElement.dataset.hdContrast = worst(ink).toFixed(2);
    /* superfícies em degradê: na paleta Comunhão valem os azuis do CSS; nas outras, derivam da cor principal da paleta com texto branco garantido (6:1) */
    const keys = ['--cm-surf1', '--cm-surf2', '--cm-card1', '--cm-card2', '--cm-surf-tx', '--cm-surf-mu'];
    if (document.documentElement.getAttribute('data-palette') === 'comunhao') keys.forEach(k => st.removeProperty(k));
    else { let s1 = rgbOf(cs.getPropertyValue('--au-b') || '#2f6bff'); for (let k = 0; k < 30 && ratio(white, s1) < 6; k++) s1 = mixTo(s1, [5, 12, 50], .12); const s2 = mixTo(s1, [3, 8, 40], .55), c1 = mixTo(s1, white, .07), c2 = mixTo(s2, white, .07); st.setProperty('--cm-surf1', hex(s1)); st.setProperty('--cm-surf2', hex(s2)); st.setProperty('--cm-card1', hex(c1)); st.setProperty('--cm-card2', hex(c2)); st.setProperty('--cm-surf-tx', '#ffffff'); st.setProperty('--cm-surf-mu', '#eef3ff'); }
  }
  new MutationObserver(syncContrast).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette', 'data-skin'] });
  syncContrast();
  /* ---------- liga ao ciclo de desenho do shell ---------- */
  const originalAfter = UI.afterRender;
  UI.afterRender = function () {
    const r = originalAfter.apply(this, arguments);
    try { update(); } catch (e) { console.error('[Cabeçalho]', e); }
    return r;
  };
  let lastMode = null, lastBody = '';
  function update() {
    if (!UI.enabled) return;
    const hd = build(); if (!hd) return;
    enhanceTop(); injectMotionPref(); syncDrawer();
    const home = document.body.classList.contains('iu-is-home');
    const sl = slides(), nsig = sl.map(s => s.slot + '|' + s.path + '|' + num(s.f.position_x, 50) + ',' + num(s.f.position_y, 50) + ',' + num(s.f.zoom, 1)).join(';') + '#' + seconds();
    const bg = hd.querySelector('.hd-bg');
    if (nsig !== sig) { sig = nsig; bg.innerHTML = bgHTML(sl); hd.querySelector('#hd-ctl').innerHTML = ctlHTML(sl.length); setupCarousel(hd); }
    hd.dataset.mode = home ? 'home' : 'page'; hd.dataset.page = (location.pathname.split('/')[1] || 'inicio').toLowerCase(); hd.classList.toggle('has-photos', sl.length > 0);
    hd.classList.toggle('no-title', !home && !!document.querySelector('#content h1, main h1'));   // a própria página já tem o título
    const bodyHtml = bodyHTML(home, sl); const key = (home ? 'h' : 'p') + bodyHtml;
    if (key !== lastBody) { lastBody = key; const body = hd.querySelector('#hd-body'); body.innerHTML = bodyHtml; body.classList.remove('swap'); void body.offsetWidth; body.classList.add('swap'); }
    if (car) car.sync();
    document.body.classList.add('hd-on');
    onScroll();
    if (lastMode !== null && lastMode !== home) { /* a transição de altura é feita pelo CSS */ }
    lastMode = home;
  }
  if (UI.enabled && document.body && $('iu-top')) { try { update(); } catch (e) { } }
})();
