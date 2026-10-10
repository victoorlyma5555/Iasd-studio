# Verificação da central IASD Studio

Interface administrativa com seis seções. Cadastros, tokens, QR Codes e alertas novos são demonstrações em memória; o painel existente do projetor mantém a integração atual e a restrição administrativa.

## Fidelidade visual
- Estrutura: título, navegação horizontal, tabela e detalhes à direita preservam o conceito.
- Paleta: superfícies e destaques usam as variáveis do site para respeitar o tema escolhido.
- Tipografia: fontes existentes do IASD APP, sem adicionar outra família.
- Marca: logo oficial substitui a marca ilustrativa do conceito.
- Conteúdo: campos de igreja reduzidos a nome, cidade, responsável e contato; dados explicitamente demonstrativos.
- Responsividade: detalhes empilham no celular; tabela e navegação têm rolagem própria sem ampliar a página.

## Validação
- scripts/validate.mjs aprovado.
- Navegador: geração e revogação simulada de token, formulário, pesquisa de igrejas, resposta de alerta e navegação entre seções.
- Revisão visual em desktop e 390 × 844; largura de página sem transbordamento horizontal no celular.
- Evidências locais: design/studio-admin-concept.png, design/studio-admin-desktop.jpg e design/studio-admin-mobile.jpg.
- Prévia isolada utilizada para testar a interface sem depender de sessão autenticada; o gate administrativo existente permanece no shell.
