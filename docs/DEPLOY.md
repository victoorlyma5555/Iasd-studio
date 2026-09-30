# Como publicar sem quebrar o site

## Estrutura (o que fica onde)

| Pasta / arquivo | Função |
|---|---|
| `index.html` | Só a "casca" (menos de 4 KB). **Não coloque scripts ou estilos dentro dele.** |
| `app/main.js` | Toda a lógica do site (antes ficava inline no `index.html`). |
| `app/styles/legacy.css` | Estilos das telas internas (antes eram 19 blocos `<style>`). |
| `app/boot-guard.js` | Mostra aviso com botão "Recarregar" se o site falhar ao iniciar, em vez de tela em branco. |
| `ui/theme.css` e `ui/shell.js` | Interface nova: menu, topo, navegação do celular e Home. |
| `core/`, `modules/`, `services/` | Sem alterações. |
| `projection.html`, `projection-studio.html`, `api/`, `iasd-projetor/` | Sem alterações. |
| `scripts/validate.mjs` | Verificação automática antes de publicar. |

## Antes de publicar

1. Rode `node scripts/validate.mjs`. O GitHub também roda isso sozinho em todo push (aba Actions).
2. Nunca faça deploy direto na `main`. Suba em uma branch e abra o link de teste (preview) que a Vercel cria.
3. No preview, confira: login, abrir Cronogramas, Bíblia, Sonoplastia, Projeção e trocar o tema. O restante do checklist está em `docs/REFACTOR-VALIDATION.md`.
4. Só então faça o merge na `main`.

## Regras para não quebrar

- **Nunca** cole código dentro de `index.html`. Foi um `</script>` solto dentro de um script inline que fez o site virar texto na tela. Em arquivo `.js` isso não acontece, e o validador reprova se `index.html` voltar a crescer.
- Se uma ferramenta de IA reescrever o projeto, confira se `index.html` continua pequeno e se `app/main.js` continua existindo.
- Toda rota nova do `core/router.js` precisa de uma linha em `vercel.json` (o validador avisa). Existe também uma regra geral que manda qualquer caminho sem extensão para o `index.html`.

## Voltar ao visual antigo rapidamente

Abra o site com `?ui=old` no final do endereço (por exemplo `https://seu-site/?ui=old`). Para reativar o novo: `?ui=new`.
Se o código da interface nova falhar, o site volta sozinho para o visual antigo.

## Textos editáveis da Home

No topo de `ui/shell.js`, o objeto `config` guarda o texto do banner ("O FIM DO PECADO", versículo) e a "Passagem do dia".
