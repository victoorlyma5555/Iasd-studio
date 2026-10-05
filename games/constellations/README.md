# Constelações (online)
Jogo de cartas e tabuleiro estilo Sequence, 1×1 / 2×2 / 3×3, cada jogador no seu celular.
- `engine.js` regras espelhadas no cliente (só destaque/animação; o servidor decide tudo).
- `game.js` rede (RPC + Realtime só como aviso de versão + consulta periódica), telas e sons.
- `loader.js` carrega sob demanda e trata links `/jogos?seq=CODIGO` e `/jogos?seqtelao=CODIGO`.
- Servidor: `docs/supabase-sequencia.sql` (**precisa ser aplicado no Supabase antes de publicar**).
- Testes: `tests/seq-sql-test.sql`, `tests/constellations.test.cjs`, `tests/seq-e2e*.mjs` (precisam de Postgres local + `tests/seq-test-server.mjs`).
