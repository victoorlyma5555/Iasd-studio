# Refactor validation checklist

Branch: `refactor-modular-architecture-20260929`

## Source checks
- [x] Legacy `main` remains outside the refactor branch.
- [x] History API router is loaded before feature modules.
- [x] Vercel rewrites cover all declared public app routes, including `/hinario`.
- [x] Direct routes recognize Projeção, Sorteadores and Alertas.
- [x] Browser back/forward reapplies protected projection access.
- [x] Feature registry is active.
- [x] Shared access rules are centralized in `core/access.js`.
- [x] Shared Supabase boundary exists in `services/cloud.js`.
- [x] Projector boundary exists in `services/projector.js`.
- [x] Existing companion request implementation and localhost port remain unchanged.

## Modules connected
- Bíblia
- Cronogramas
- Escalas
- Datas especiais
- Lição da Escola Sabatina
- Jogos
- Jograis / Palavra em Cena
- Sonoplastia entry
- Perfil
- Fundador / Admin
- Menu mobile

## Runtime tests required before merge
These require a deployed preview or local browser/Electron runtime and are intentionally not marked green by source inspection alone:
1. Direct URL + refresh for every route.
2. Login, signup, email confirmation and Google OAuth.
3. Schedule create/edit/delete with Supabase.
4. Sabbath lesson navigation on mobile.
5. Game room creation/join and realtime flow.
6. Sonoplastia pairing with IASD Projetor.
7. Projection, close projection, black screen and monitor detection.
8. YouTube/media preview and projection.
9. Windows app alerts and reconnect.
10. PWA navigation on Android/iPhone.

Do not merge this branch into `main` until the runtime checklist passes.
