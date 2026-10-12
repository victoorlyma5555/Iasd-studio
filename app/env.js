/* Ambiente do IASD APP: separa PRODUÇÃO de PREVIEW e DESENVOLVIMENTO.
   Regra de segurança: fora dos domínios oficiais, o app NUNCA usa o banco de produção.
   - Produção (iasdapp.com.br e iasd-studio.vercel.app): nada muda, o app usa o Supabase de sempre.
   - Preview da Vercel ou localhost: usa o backend de TESTE (STAGING abaixo). Se ele ainda não foi configurado,
     o app roda OFFLINE com dados de demonstração (identificados na tela), sem nenhuma chamada de rede ao Supabase.
   Este arquivo deve ser carregado ANTES de app/main.js. */
(function () {
  'use strict';
  const PROD_HOSTS = ['iasdapp.com.br', 'www.iasdapp.com.br', 'iasd-studio.vercel.app'];
  const host = String(location.hostname || '').toLowerCase();
  const isProd = PROD_HOSTS.includes(host);
  const kind = isProd ? 'production' : (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) ? 'local' : 'preview');

  /* Backend de TESTE (projeto Supabase separado da produção). Preencha SÓ com a URL e a chave PÚBLICA (publishable/anon).
     NUNCA coloque aqui a chave service_role, senhas ou tokens: este arquivo é público.
     Exemplo: const STAGING = { url: 'https://xxxxxxxx.supabase.co', key: 'sb_publishable_...' }; */
  const STAGING = null;

  const env = { kind, isProd, host, cloud: isProd ? null : STAGING, offline: !isProd && !STAGING, demoRole: null };

  if (env.offline) {
    const ROLES = ['visitante', 'membro', 'sonoplasta', 'admin', 'fundador'];
    const q = new URLSearchParams(location.search).get('demo');
    let role = 'visitante';
    try { role = ROLES.includes(q) ? q : (sessionStorage.getItem('iasd-demo-role') || 'visitante'); sessionStorage.setItem('iasd-demo-role', role); } catch (e) { role = ROLES.includes(q) ? q : 'visitante'; }
    env.demoRole = ROLES.includes(role) ? role : 'visitante';
    env.demoRoles = ROLES;
    window.IASDOfflineCloud = makeOfflineCloud(env.demoRole);
  }
  /* barra do modo demonstração: troca o perfil de exemplo (só existe sem backend de teste; nada é real) */
  if (env.offline) {
    const LBL = { visitante: 'Visitante (sem login)', membro: 'Membro', sonoplasta: 'Sonoplasta', admin: 'Administrador', fundador: 'Fundador' };
    const mount = () => {
      if (document.getElementById('iasd-demo-bar')) return;
      const bar = document.createElement('div'); bar.id = 'iasd-demo-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Modo demonstração');
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:52px;box-sizing:border-box;z-index:200;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:6px 12px;background:#1a1030;color:#fff;border-bottom:2px solid #ffc15e;font:600 13px/1.2 system-ui,sans-serif';
      bar.innerHTML = '<b style="color:#ffc15e;letter-spacing:.06em;text-transform:uppercase;font-size:11px">Modo demonstração</b><span>dados fictícios, nada é salvo</span><select aria-label="Ver como (perfil de demonstração)" style="min-height:44px;border-radius:10px;border:1px solid rgba(255,255,255,.45);background:#0e0820;color:#fff;padding:0 10px;font:600 14px system-ui,sans-serif">' + env.demoRoles.map(r => '<option value="' + r + '"' + (r === env.demoRole ? ' selected' : '') + '>' + (LBL[r] || r) + '</option>').join('') + '</select>';
      document.body.insertBefore(bar, document.body.firstChild); document.documentElement.style.setProperty('--demo-h', '52px');
      bar.querySelector('select').addEventListener('change', e => { try { sessionStorage.setItem('iasd-demo-role', e.target.value); } catch (x) { } const u = new URL(location.href); u.searchParams.set('demo', e.target.value); location.href = u.toString(); });
    };
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  }
  window.IASD_ENV = Object.freeze(env);

  /* ---------- cliente offline (mesma "forma" do cliente Supabase, sem rede) ---------- */
  function makeOfflineCloud(role) {
    const ROLE_DB = { visitante: null, membro: null, sonoplasta: 'sonoplasta', admin: 'admin', fundador: 'founder' };
    const PERMS = { sonoplasta: ['sound.use', 'alert.send_sound'], admin: ['sound.use', 'alert.send_sound', 'site.edit', 'site.texts', 'site.tabs', 'cron.edit', 'escala.add', 'escala.edit', 'study.use'], fundador: ['sound.use', 'alert.send_sound', 'site.edit', 'site.texts', 'site.tabs', 'cron.edit', 'cron.delete', 'escala.add', 'escala.edit', 'study.use'] };
    const CARGOS = { sonoplasta: ['Sonoplasta'], admin: ['Administração'], fundador: [] };
    const logged = role !== 'visitante';
    const user = logged ? { id: 'demo-user', email: 'maria.demo@exemplo.invalid', is_anonymous: false, user_metadata: { full_name: 'Maria Souza (demonstração)' } } : null;
    const today = new Date().toLocaleDateString('en-CA');
    const saturday = (() => { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return d.toLocaleDateString('en-CA'); })();
    const TABLES = {
      iasd_profiles: logged ? [{ user_id: 'demo-user', full_name: 'Maria Souza (demonstração)', phone: '+5575999999999', avatar_path: null }] : [],
      iasd_members: logged && ROLE_DB[role] ? [{ user_id: 'demo-user', role: ROLE_DB[role] }] : [],
      iasd_schedules: [
        { id: 'demo-hoje', name: 'Programação de hoje (demonstração)', service_date: today, updated_at: today, items: ['08:30 — Recepção — Equipe de recepção', '09:00 — Escola Sabatina — Professores', '10:30 — Louvor e adoração — Ministério de música', '11:00 — Mensagem — Pastor convidado', '12:15 — Confraternização'] },
        { id: 'demo-sabado', name: 'Próximo sábado (demonstração)', service_date: saturday, updated_at: saturday, items: ['09:00 — Escola Sabatina', '10:30 — Culto de adoração'] }
      ],
      iasd_site_assets: ['home_banner', 'home_banner_1', 'home_banner_2'].map((slot, i) => ({ slot, image_path: 'demo/banner-' + (i + 1) + '.svg' })),
      iasd_escalas: (() => { const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toLocaleDateString('en-CA'); }; return logged ? [{ id: 1, line: d(0) + ' — 08:30 — Maria Souza (demonstração) — Recepção' }, { id: 2, line: d(0) + ' — 09:00 — João Pereira (demonstração) — Escola Sabatina' }, { id: 3, line: d(7) + ' — 10:30 — Maria Souza (demonstração) — Projeção' }, { id: 4, line: d(7) + ' — 10:30 — Ana Lima (demonstração) — Sonoplastia' }, { id: 5, line: d(14) + ' — 09:00 — Carlos Mendes (demonstração) — Regência' }] : []; })(),
      iasd_asset_framing: [],
      iasd_site_content: [{ content_key: 'home_carousel_seconds', content_value: '6' }]
    };
    const DEMO_MSG = 'Modo demonstração: nada é salvo e nenhum dado real é usado.';
    const result = (data) => ({ data, error: null, count: Array.isArray(data) ? data.length : null });
    function runQuery(st) {
      if (st.op !== 'select') return { data: null, error: { message: DEMO_MSG } };
      let rows = (TABLES[st.table] || []).filter(r => st.filters.every(([c, v]) => r[c] === v));
      if (st.single || st.maybe) return result(rows[0] || null);
      return result(rows);
    }
    function builder(table) {
      const st = { table, op: 'select', filters: [], single: false, maybe: false };
      const api = new Proxy(function () { }, {
        get(_, k) {
          if (k === 'then') return (res, rej) => Promise.resolve(runQuery(st)).then(res, rej);
          if (k === 'eq') return (c, v) => { st.filters.push([c, v]); return api; };
          if (k === 'maybeSingle') return () => { st.maybe = true; return api; };
          if (k === 'single') return () => { st.single = true; return api; };
          if (k === 'insert' || k === 'update' || k === 'upsert' || k === 'delete') return () => { st.op = k; return api; };
          return () => api;   // select, order, limit, in, ilike, range...
        }
      });
      return api;
    }
    const chain = () => new Proxy(function () { }, { get: (_, k) => k === 'then' ? undefined : () => chain(), apply: () => chain() });
    const authErr = () => Promise.resolve({ data: { session: null, user: null }, error: { message: 'Modo demonstração: não há login. Use a barra "Ver como" para trocar o perfil de demonstração.' } });
    return {
      from: builder,
      rpc: (name) => Promise.resolve(result(name === 'iasd_my_perms' ? (PERMS[role] || []) : name === 'iasd_my_cargos' ? (CARGOS[role] || []) : [])),
      channel: () => chain(), removeChannel: () => { }, removeAllChannels: () => { },
      auth: {
        getSession: () => Promise.resolve({ data: { session: logged ? { access_token: 'demo', refresh_token: 'demo', user } : null }, error: null }),
        getUser: () => Promise.resolve({ data: { user }, error: null }),
        setSession: () => authErr(), signInWithPassword: authErr, signUp: authErr, signInWithOAuth: authErr, updateUser: authErr, resetPasswordForEmail: authErr,
        signOut: () => { try { sessionStorage.setItem('iasd-demo-role', 'visitante'); } catch (e) { } location.reload(); return Promise.resolve({ error: null }); },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() { } } } })
      },
      storage: {
        from: () => ({
          getPublicUrl: (p) => ({ data: { publicUrl: '/ui/demo/' + String(p || '').split('/').pop() } }),
          list: () => Promise.resolve(result([])), upload: () => Promise.resolve({ data: null, error: { message: DEMO_MSG } }),
          remove: () => Promise.resolve({ data: null, error: { message: DEMO_MSG } }), createSignedUrl: () => Promise.resolve({ data: null, error: { message: DEMO_MSG } })
        })
      }
    };
  }
})();
