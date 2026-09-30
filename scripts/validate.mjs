#!/usr/bin/env node
/* Validação antes do deploy. Sem dependências: roda com `node scripts/validate.mjs`.
   Falha (exit 1) se algo puder fazer o site quebrar ou sumir depois de publicar. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const problems = [];
const fail = (m) => problems.push(m);
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(root, f.replace(/^\//, '')));

function syntax(code, label) {
  try { new vm.Script(code, { filename: label }); }
  catch (e) { fail(`Erro de sintaxe em ${label}: ${e.message}`); }
}

// 1) Páginas HTML: scripts, estilos e arquivos locais
for (const page of ['index.html', 'projection.html', 'projection-studio.html']) {
  if (!exists(page)) { fail(`Arquivo ausente: ${page}`); continue; }
  const html = read(page);
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const src = /\bsrc=["']([^"']+)["']/i.exec(m[1]);
    if (src) {
      const u = src[1].split('?')[0];
      if (u.startsWith('/') && !exists(u)) fail(`${page}: script não encontrado → ${u}`);
    } else if (!/type=["'](?!module|text\/javascript)/i.test(m[1])) {
      syntax(m[2], `${page} (script inline)`);
    }
  }
  for (const m of html.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const u = m[1].split('?')[0];
    if (u.startsWith('/') && !exists(u)) fail(`${page}: arquivo não encontrado → ${u}`);
  }
}

// 2) index.html deve continuar sendo só a "casca"
const idx = read('index.html');
if (idx.length > 40_000) fail(`index.html está com ${(idx.length / 1024).toFixed(0)} KB. Mantenha scripts e estilos em arquivos separados (app/, ui/).`);
if (/<style\b/i.test(idx)) fail('index.html contém <style>. Coloque o CSS em app/styles/ ou ui/.');
for (const m of idx.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
  if (m[1].length > 4_000) fail('index.html contém script inline grande. Mova para app/.');
}

// 3) Todo arquivo .js do app precisa compilar e nunca conter "</script" solto
function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === 'node_modules' ? [] : walk(p);
    return p.endsWith('.js') ? [p] : [];
  });
}
for (const dir of ['app', 'core', 'modules', 'services', 'ui', 'shared'].filter((d) => fs.existsSync(path.join(root, d)))) {
  for (const f of walk(dir)) {
    const code = read(f);
    syntax(code, f);
    if (/<\/script/i.test(code)) fail(`${f}: contém "</script" sem proteção (use <\\/script>).`);
  }
}
for (const f of ['live-game.js']) if (exists(f)) syntax(read(f), f);

// 4) vercel.json válido e rotas do roteador cobertas
let cfg = {};
try { cfg = JSON.parse(read('vercel.json')); } catch (e) { fail('vercel.json inválido: ' + e.message); }
const rewrites = cfg.rewrites || [];
const covered = (p) => rewrites.some((r) => {
  const re = new RegExp('^' + r.source.replace(/:path\*/g, '.*') + '$');
  return re.test(p) && r.destination === '/index.html';
});
const router = read('core/router.js');
for (const m of router.matchAll(/'[^']+':\s*'(\/[^']*)'/g)) {
  if (m[1] !== '/' && !covered(m[1])) fail(`Rota ${m[1]} não tem rewrite para /index.html em vercel.json (dá 404 ao recarregar).`);
}

// 5) manifest
try { JSON.parse(read('manifest.webmanifest')); } catch (e) { fail('manifest.webmanifest inválido: ' + e.message); }

if (problems.length) {
  console.error('\n✗ Validação falhou:\n' + problems.map((p) => '  - ' + p).join('\n') + '\n');
  process.exit(1);
}
console.log('✓ Validação OK: scripts compilam, arquivos existem, rotas cobertas.');
