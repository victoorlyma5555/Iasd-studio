'use strict';
/* Servidor local de DESENVOLVIMENTO (não vai para a produção): serve a raiz do projeto como a Vercel faz (rotas do app caem em index.html).
   Uso: node scripts/serve-preview.cjs [porta]   ->   http://localhost:5190  (localhost nunca usa o banco de produção: ver app/env.js) */
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..'), port = Number(process.argv[2]) || 5190;
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
http.createServer((req, res) => {
  let rel = decodeURIComponent((req.url || '/').split('?')[0]); if (rel.endsWith('/')) rel += 'index.html';
  let file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Acesso negado'); }
  const send = f => fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end('Não encontrado'); } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(d); });
  fs.stat(file, (e, s) => { if (!e && s.isFile()) return send(file); if (!path.extname(rel) && !rel.startsWith('/api/')) return send(path.join(root, 'index.html')); res.writeHead(404); res.end('Não encontrado'); });
}).listen(port, '127.0.0.1', () => console.log('IASD APP (preview local) em http://localhost:' + port));