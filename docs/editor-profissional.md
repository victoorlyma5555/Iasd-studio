# Modo de Edição

O editor usa a autenticação e as permissões existentes (`site.edit`, `site.texts`, `site.tabs`). Não modifica os módulos de projeção, Sonoplastia, autenticação ou Bíblia. Os alvos editáveis são registrados na Home: banner, imagem da passagem do dia, cartões e abas personalizadas. Textos antigos `u_*`, `home_static_*` e outras personalizações continuam sendo lidos.

## Dados e publicação

O documento contém textos, caminhos de mídia, enquadramentos e abas. As tabelas públicas existentes continuam sendo a fonte compatível do conteúdo publicado. A RPC de leitura retorna esse conjunto em uma única consulta consistente.

As novas tabelas são `iasd_editor_state`, `iasd_editor_drafts`, `iasd_editor_versions` e `iasd_editor_audit`. As políticas RLS restringem rascunhos ao dono e histórico aos editores autorizados. Não há permissão de escrita direta nessas tabelas. As RPCs públicas usam SECURITY INVOKER; as transações privilegiadas ficam no esquema não exposto `iasd_editor_private`, verificam `auth.uid()` e as permissões existentes, e têm `search_path` fixo.

A migração consolidada em `supabase-editor.sql` já foi aplicada ao projeto. Ela é para instalação inicial: não reaplicar as instruções CREATE TABLE em um banco já migrado. A migração acrescenta tabelas e uma proteção de exclusão no bucket de imagens; não altera conteúdo público nem remove tabelas/políticas anteriores. A assinatura pública antes/depois foi `0a2993d6dd0c32a6bf15b18bbe7673d1`.

Publicar exige rascunho salvo, validação no cliente e no servidor, revisão publicada, assinatura do conteúdo e revisão do rascunho correspondentes. A operação bloqueia concorrência e aplica o conjunto em uma transação. Escritas de clientes antigos também são detectadas pela assinatura; seu estado anterior é capturado antes da nova publicação. Restaurar um snapshot cria uma nova versão e preserva as anteriores. Os snapshots incluem os caminhos originais; mídias usadas em snapshots, rascunhos ou conteúdo atual não podem ser excluídas nem sobrescritas pelo Storage autenticado.

## Rascunho, prévia e recuperação

O salvamento automático tem debounce de 900 ms. O navegador mantém uma cópia por usuário em `iasd-editor-draft:<uuid>` e tenta sincronizar novamente quando a rede volta. Não publica automaticamente. Em caso de conflito, mantém a cópia local, bloqueia publicação e oferece exportação JSON antes de descartar/carregar a versão atual. Não faz merge automático. Falha/quota de armazenamento local é mostrada explicitamente.

Uma única iframe apresenta o rascunho. PC (1440), tablet (768) e celular (390) alteram dimensões sem trocar a URL. São aproximações de viewport. A iframe usa a Home pública, não inicializa a sessão operacional da equipe nem conexões de projeção. O modo Visualizar esconde propriedades e indicações de edição; retornar recupera o mesmo rascunho. Fechar remove iframe, listeners da sessão e ResizeObserver. O visitante não carrega controller, modelo, CSS, histórico ou controles do editor.

Enquadramento usa os mesmos valores atuais: X/Y 0–100 e zoom 1–3. Arrastar e sliders alteram uma prévia temporária até confirmar; cancelar restaura o enquadramento anterior. Os cartões têm IDs estáveis; apenas a região de cartões permite reordenação por arraste ou setas. O carrossel mantém seus slots e a configuração existente, incluindo ordem, imagens desativadas, efeito, tempo e controles.

O desfazer/refazer guarda até 80 estados na sessão e agrupa digitação próxima. Recarregar recupera o documento, não a pilha de undo. Comparação do histórico apresenta campos alterados/removidos, e restaurar pede confirmação.

## Validação

- `node scripts/validate.mjs`: sintaxe, arquivos e rotas.
- `node --test tests/editor.test.cjs tests/validate.test.mjs`: modelo, limites, campos seguros, IDs, undo/redo, preservação de legado e carregamento lazy.
- `tests/editor-transaction.sql`: integração real com papéis autenticado/anon, isolamento do rascunho, CAS, validação, publicação e restauração. Todas as escritas são desfeitas por ROLLBACK.
- Interface exercitada no navegador local com backend simulado para evitar publicar testes: texto, undo/redo, viewports, prévia, confirmação de publicação, histórico, comparação, restauração e descarte.

Este site estático não tem scripts de build, lint ou typecheck. O mecanismo de validação existente compila os scripts para verificar sintaxe. Nenhum instalador ou release do IASD Projetor pertence a esta mudança.

## Limites e operação

O histórico do editor cobre suas quatro tabelas de conteúdo, não temas ou dados operacionais de cronogramas/Bíblia/Sonoplastia. O editor de temas do fundador permanece separado. Somente componentes cadastrados são editáveis; não há HTML, JavaScript, CSS livre ou alteração de rotas internas. Arquivos continuam no bucket público existente, mas o rascunho e suas referências não são publicados nas páginas.

Clientes antigos ainda têm suas permissões anteriores nas tabelas públicas. A detecção de assinatura impede que o editor novo sobrescreva alterações deles silenciosamente; os snapshots não auditam cada escrita feita por esses clientes. Administração privilegiada do banco/Storage pode contornar RLS, portanto backups administrativos continuam relevantes. Para reverter a interface, volte ao commit anterior e mantenha as tabelas adicionais: isso preserva rascunhos e histórico sem uma reversão destrutiva do banco.
