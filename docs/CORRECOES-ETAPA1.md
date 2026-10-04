# Primeira etapa de correções

Base: commit 3c46e1e, tag local codex/baseline-2026-10-04.
Branch: codex/validation-foundation.

## Escopo
- Corrigir resolução de caminhos do validador no Windows e em pastas com espaços/acentos.
- Testar o validador em fixtures locais isoladas.
- Preparar CI para Linux e Windows.
- Reproduzir a mistura de anotações entre contas, sem rede e sem dados reais.
- Nenhuma alteração no código executado pelo site, banco, projetor ou publicação.

## Executar
- node scripts/validate.mjs
- node --test tests/validate.test.mjs
- node --test tests/bible-account-isolation.repro.mjs

O último comando reproduz uma falha conhecida: deve falhar na versão atual.
Ele não faz parte dos testes verdes do CI e não é evidência de isolamento corrigido.
Após corrigir, ampliar para logout, marcações, requisições atrasadas e múltiplas abas,
renomear para .test.mjs e incluí-lo no CI.

## Antes da correção das anotações
- Separar armazenamento por usuário e convidado.
- Preservar as chaves antigas: elas não informam quem é o dono.
- Não importar automaticamente dados antigos para a conta que entrar.
- Oferecer recuperação explícita dos dados antigos sem apagá-los.
- Cancelar tarefas pendentes e descartar respostas de sessões anteriores.
- Verificar compatibilidade com a leitura de marcações em ui/pages.js.
- Tratar exclusões entre aparelhos em mudança separada e compatível.

## Condições antes de publicar alterações funcionais
- Confirmar backup e procedimento de restauração no Supabase. A tag Git não é backup do banco.
- Resolver acesso aos detalhes da equipe Vercel; a consulta anterior retornou 403.
- Garantir que a prévia não grave em produção; usar backend de teste quando necessário.
- Validar login/logout, troca de contas, cargos, cronogramas, escalas, alertas, Bíblia,
  jogos, estudo, pareamento, tela preta, mídia e segundo monitor.
- Não alterar ou remover colunas/RPCs usadas por versões anteriores do site/projetor.
- Revisar o diff e preparar reversão antes da publicação.

## Recuperação
A versão original permanece em main e na tag local citada.
Para inspecioná-la sem apagar trabalho: git show codex/baseline-2026-10-04:<arquivo>.
Nenhum push, deploy, commit de correção ou backup remoto foi realizado nesta etapa.

## Regra de publicação definida pelo usuário
Agrupar alterações em pacotes locais. Não fazer push nem deploy sem autorização explícita.
Ao concluir um pacote, informar criações, alterações, remoções, testes e pendências,
e pedir liberação para publicar. Push pode disparar deploy automático na Vercel.
