/* Mantém os botões "Baixar o Studio" sempre na versão mais recente publicada, sem precisar editar o site a cada versão.
   Como usar: no link de download, coloque data-studio-download (o href escrito nele serve de reserva se a consulta falhar)
   e, onde quiser mostrar o número, um elemento com data-studio-version.
   Fonte: lista de arquivos da release "iasd-studio-channel" (GitHub). Só aceita instaladores IASD-Studio-Setup-X.Y.Z.exe
   desse mesmo endereço. Guarda o resultado por 10 minutos neste navegador; se algo falhar, nada muda na página. */
(function () {
  'use strict';
  var API = 'https://api.github.com/repos/victoorlyma5555/Iasd-studio/releases/tags/iasd-studio-channel';
  var BASE = 'https://github.com/victoorlyma5555/Iasd-studio/releases/download/iasd-studio-channel/';
  var KEY = 'iasd-studio-latest', TTL = 10 * 60 * 1000;
  var current = null, pending = null, queued = false;

  function parse(name) {
    var m = /^IASD-Studio-Setup-(\d+)\.(\d+)\.(\d+)\.exe$/.exec(name || '');
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function newer(a, b) {
    for (var i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
    return false;
  }
  function pick(release) {
    var best = null;
    ((release && release.assets) || []).forEach(function (a) {
      var v = parse(a && a.name);
      if (!v || !a.browser_download_url || String(a.browser_download_url).indexOf(BASE) !== 0) return;
      if (!best || newer(v, best.v)) best = { v: v, version: v.join('.'), url: a.browser_download_url };
    });
    return best && { version: best.version, url: best.url };
  }
  function readCache() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && typeof c.at === 'number' && Date.now() - c.at < TTL && parse(String(c.url).slice(BASE.length)) && String(c.url).indexOf(BASE) === 0) return c;
    } catch (e) {}
    return null;
  }
  function writeCache(info) { try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), version: info.version, url: info.url })); } catch (e) {} }

  function latest() {
    if (current) return Promise.resolve(current);
    var c = readCache();
    if (c) { current = { version: c.version, url: c.url }; return Promise.resolve(current); }
    if (pending) return pending;
    pending = fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { var p = pick(j); if (!p) throw new Error('sem instalador'); current = p; writeCache(p); return p; })
      .catch(function () { return null; })
      .then(function (p) { pending = null; return p; });
    return pending;
  }
  function apply(root) {
    return latest().then(function (info) {
      if (!info) return null;
      var scope = root || document;
      Array.prototype.forEach.call(scope.querySelectorAll('a[data-studio-download]'), function (a) {
        if (a.getAttribute('href') !== info.url) a.setAttribute('href', info.url);
      });
      Array.prototype.forEach.call(scope.querySelectorAll('[data-studio-version]'), function (el) {
        var t = 'versão ' + info.version;
        if (el.textContent !== t) el.textContent = t;
      });
      return info;
    });
  }
  /* telas montadas depois (o site monta as páginas por JavaScript): confere de novo, uma vez por quadro, só se houver link novo */
  function watch() {
    if (!window.MutationObserver || !document.body) return;
    new MutationObserver(function () {
      if (queued || !current || !document.querySelector('a[data-studio-download]')) return;
      queued = true;
      (window.requestAnimationFrame || setTimeout)(function () { queued = false; apply(document); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  window.IASDStudioLatest = { apply: apply, latest: latest, pick: pick };
  function start() { apply(document); watch(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
