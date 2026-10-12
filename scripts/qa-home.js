/* Verificações automáticas da Home (desenvolvimento). Rode no console com o site aberto em localhost, por exemplo:
     fetch('/scripts/qa-home.js').then(r => r.text()).then(eval).then(() => __perm())
   __perm()     quem vê o quê: Home, topo e painel de menu (permissões)
   __layout()   rolagem lateral, alvos < 44 px, controles sem nome, títulos
   __contrast() contraste real (WCAG) dos textos e botões principais no tema/paleta atuais */
const __vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return !e.closest('[hidden]') && cs.display !== 'none' && cs.visibility !== 'hidden' && (r.width > 0 || r.height > 0); };
const __key = e => e.dataset.go || ('act:' + e.dataset.act);
window.__perm = async function () {
  await new Promise(r => setTimeout(r, 900));
  const RESTR = ['Projeção', 'Sorteadores', 'Mídia', 'Painel Sonoplastia', 'Cargos', 'Fundador', 'Acervo', 'Alertas', 'Estudo', 'Perfil', 'act:newtab', 'act:banner'];
  const set = sel => new Set([...document.querySelectorAll(sel)].filter(__vis).map(__key));
  const home = set('.hm [data-go], .hm [data-act], #hd [data-go], #hd [data-act]');
  const top = set('.iu-top [data-go], .iu-top [data-act], .iu-bn [data-go]');
  document.body.classList.add('iu-open'); await new Promise(r => setTimeout(r, 700));
  const drawer = set('.iu-side [data-go], .iu-side [data-act]');
  const labels = [...document.querySelectorAll('.iu-side .iu-nav')].filter(__vis).map(e => e.dataset.label || e.textContent.trim());
  document.body.classList.remove('iu-open');
  const pick = s => RESTR.filter(x => s.has(x)).join(', ') || 'nenhum';
  const R = ['[' + IASD_ENV.demoRole + '] logado=' + !!(typeof cloudUser !== 'undefined' && cloudUser) + ' cargo=' + (typeof cloudRole !== 'undefined' ? cloudRole : null)];
  R.push('  HOME + cabeçalho, restritos visíveis: ' + pick(home));
  R.push('  barra do topo e barra inferior: ' + pick(top));
  R.push('  painel de menu: ' + pick(drawer));
  R.push('  itens do painel: ' + labels.join(' | '));
  const q = [...document.querySelectorAll('.hm-tile .hm-txt b')].map(e => e.textContent).join(' | ');
  R.push('  acessos principais: ' + q);
  return R.join('\n');
};
window.__layout = async function (label) {
  await new Promise(r => setTimeout(r, 700));
  const vw = document.documentElement.clientWidth, R = [];
  const inter = [...document.querySelectorAll('.hm button, .hm a[href], #hd button, .iu-top button, .iu-top input, .iu-bn button')].filter(__vis);
  const small = inter.filter(e => { if (e.tagName === 'INPUT' && e.closest('.iu-search')) return false; const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(e => (e.className || e.tagName).toString().slice(0, 24) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  const unnamed = inter.filter(e => !((e.textContent || '').trim() || e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('placeholder'))).map(e => (e.className || e.tagName).toString().slice(0, 24));
  const cut = [...document.querySelectorAll('.hm *, #hd .hd-body *, #hd .hd-ctl *')].filter(e => { if (e.closest('.iu-sidetabs,.iu-sd,.iu-sd-bk,.hd-bg')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1; }).length;
  R.push((label || '') + ' largura=' + vw + 'px');
  R.push('  rolagem lateral: ' + (document.documentElement.scrollWidth - vw) + 'px | elementos cortados à direita: ' + cut);
  R.push('  h1 visíveis: ' + [...document.querySelectorAll('h1')].filter(__vis).length + ' | alvos < 44 px: ' + (small.join('; ') || 'nenhum') + ' | sem nome: ' + (unnamed.join('; ') || 'nenhum'));
  return R.join('\n');
};
window.__contrast = function () {
  const cv = document.createElement('canvas').getContext('2d');
  const rgb = s => { cv.fillStyle = '#000'; cv.fillStyle = s; const h = cv.fillStyle; if (/^#/.test(h)) return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return h.match(/[\d.]+/g).slice(0, 3).map(Number); };
  const L = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const blend = (fg, a, bg) => fg.map((v, i) => Math.round(v * a + bg[i] * (1 - a)));
  const baseBg = () => { const b = getComputedStyle(document.body).backgroundColor; return rgb(b === 'rgba(0, 0, 0, 0)' ? (getComputedStyle(document.documentElement).getPropertyValue('--au-bg') || '#0e0818') : b); };
  const bgOf = el => { const layers = []; let n = el; while (n && n !== document.documentElement) { const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g); if (m && (m[3] === undefined || +m[3] > 0)) layers.push(m.length > 3 ? [m.slice(0, 3).map(Number), +m[3]] : [m.map(Number), 1]); if (m && (m[3] === undefined || +m[3] >= .99)) break; n = n.parentElement; } let base = baseBg(); for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i][0], layers[i][1], base); return base; };
  /* fundo efetivo do texto: o degradê do próprio elemento ou do ancestral mais próximo que tenha degradê/cor opaca (pior caso = cada cor do degradê) */
  const stops = el => { let n = el; while (n && n !== document.documentElement) { const cs = getComputedStyle(n), bg = cs.backgroundImage; if (/gradient/.test(bg)) { const toks = (bg.match(/rgba?\([^)]+\)/g) || []).map(x => { const m = x.match(/[\d.]+/g); return { c: m.slice(0, 3).map(Number), a: m.length > 3 ? +m[3] : 1 }; }).filter(t => t.a > 0); const solid = toks.filter(t => t.a >= .99).map(t => t.c); if (solid.length) { const lightest = solid.reduce((p, c) => L(c) > L(p) ? c : p); const c = solid.concat(toks.filter(t => t.a < .99).map(t => blend(t.c, t.a, lightest))); return c; } } const m = cs.backgroundColor.match(/[\d.]+/g); if (m && (m[3] === undefined || +m[3] >= .99)) return null; n = n.parentElement; } return null; };
  const CH = [['.hd-btn--p', 'botão principal do cabeçalho'], ['.hm-txt b', 'título do acesso principal'], ['.hm-txt small', 'subtítulo do acesso principal'], ['.hm-head h2', 'título da comunidade'], ['.hm-head p', 'subtítulo da comunidade'], ['.hm-ccard .hm-txt small', 'descrição do cartão'], ['.hm-cta', 'chamada do cartão'], ['.hm-arena .hm-txt small', 'texto da arena'], ['.hm-pas-a .iu-btn', 'botão da Palavra do dia'], ['.hd-seg button[aria-pressed="true"]', 'opção ativa do movimento']];
  const out = [], root = document.querySelector('.hm'); if (!root) return 'Home ausente';
  out.push('paleta=' + (document.documentElement.getAttribute('data-palette') || 'aurora') + ' tema=' + document.documentElement.getAttribute('data-theme') + ' | tinta dos botões ' + getComputedStyle(document.documentElement).getPropertyValue('--hd-ink').trim() + ' (medida pelo app: ' + document.documentElement.dataset.hdContrast + ':1)');
  for (const [sel, name] of CH) {
    const el = document.querySelector(sel); if (!el) continue;
    const fg = rgb(getComputedStyle(el).color), st = stops(el);
    const w = st ? Math.min(...st.map(s => ratio(fg, s))) : ratio(fg, bgOf(el));
    out.push((w >= 4.5 ? 'OK    ' : 'FALHA ') + w.toFixed(2) + ':1  ' + name);
  }
  return out.join('\n');
};
