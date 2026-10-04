import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
function fixture(t) {
  const parent = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(parent, 'iasd-validation-'));
  t.after(() => {
    const resolved = fs.realpathSync(dir);
    if (path.dirname(resolved) !== parent || !path.basename(resolved).startsWith('iasd-validation-')) {
      throw Error('Refusing to remove unexpected temporary directory.');
    }
    fs.rmSync(resolved, {recursive:true});
  });
  const root = path.join(dir, 'Projeto com espaços e acentuação');
  for (const sub of ['scripts','core','app']) fs.mkdirSync(path.join(root,sub),{recursive:true});
  fs.copyFileSync(path.join(project,'scripts/validate.mjs'),path.join(root,'scripts/validate.mjs'));
  for (const page of ['index.html','projection.html','projection-studio.html']) {
    fs.writeFileSync(path.join(root,page),'<html><script src="/app/example.js"></script></html>');
  }
  fs.writeFileSync(path.join(root,'app/example.js'),'const example = 1;');
  fs.writeFileSync(path.join(root,'core/router.js'),"const routes = {'Bíblia':'/biblia'};");
  fs.writeFileSync(path.join(root,'vercel.json'),JSON.stringify({rewrites:[{source:'/biblia',destination:'/index.html'}]}));
  fs.writeFileSync(path.join(root,'manifest.webmanifest'),'{}');
  return {
    write: (file, data) => fs.writeFileSync(path.join(root,file),data),
    run: () => spawnSync(process.execPath,[path.join(root,'scripts/validate.mjs')],{cwd:dir,encoding:'utf8'})
  };
}
test('validates paths with spaces and accents from another working directory',t=>{
  const result=fixture(t).run();
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/Validação OK/);
});
test('rejects JavaScript syntax errors',t=>{
  const f=fixture(t); f.write('app/example.js','const = ;');
  const r=f.run(); assert.equal(r.status,1); assert.match(r.stderr,/Erro de sintaxe/);
});
test('rejects missing scripts',t=>{
  const f=fixture(t); f.write('index.html','<script src="/missing.js"></script>');
  const r=f.run(); assert.equal(r.status,1); assert.match(r.stderr,/script não encontrado/);
});
test('rejects routes without rewrites',t=>{
  const f=fixture(t); f.write('vercel.json','{"rewrites":[]}');
  const r=f.run(); assert.equal(r.status,1); assert.match(r.stderr,/não tem rewrite/);
});
