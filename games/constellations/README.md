# Constelações

Jogo local funcional, isolado da autenticação, Supabase, ranking, Projetor e dos jogos existentes. Entrada: um sexto card em `IASDPages.gameCards()`. O único script adicional no HTML é o loader; CSS, motor e interface carregam sob demanda. Nenhuma rota, tabela ou serviço foi criado. Implementação na branch `codex/constelacoes`. Publicação em produção autorizada pelo usuário em 05/10/2026.

## Regras

- Tabuleiro 8×8 com 32 combinações originais (quatro símbolos × números 1–8), cada uma presente em duas casas. Tabuleiro e baralho são embaralhados a cada partida.
- Duas equipes, Azul e Ouro. 1v1, 2v2, 3v3, 4v4, 5v5 e 6v6, passando o dispositivo. Primeiro participante sorteado; ordem alternada por equipe, visível na interface. Não há adversário controlado pelo computador.
- Cinco cartas por participante, privadas na interface entre turnos. Fichas e pontuação compartilhadas pela equipe. Selecione carta, casa correspondente e confirme. Descarte e compra automáticos, com reciclagem do baralho.
- Vitória com duas linhas de cinco fichas horizontais, verticais ou diagonais. Linhas podem compartilhar apenas uma casa e ficam protegidas contra remoção.
- Baralho de 136 cartas: 128 comuns, quatro Pulsos (remover adversário desprotegido), quatro Escudos (proteger ficha própria). Ocupar casas também bloqueia o adversário.
- Trocar carta sem posição válida consome o turno. Passar ou expirar o prazo também consome o turno. Tempos de 30, 45, 60 segundos ou sem cronômetro. Tempo continua na passagem do dispositivo; ao retornar após ausência, aplica-se a expiração do turno salvo, sem simular uma partida inteira enquanto estava fechado.
- Empate: tabuleiro cheio, duas voltas sem alteração no tabuleiro ou 500 turnos.

## Dispositivos e recursos

Casas quadradas de no mínimo 56 px; zoom de 56 a 104 px com botões. Pan por toque/rolagem e arraste com mouse. Seleção centraliza uma casa válida, e a jogada requer confirmação. Placar permanece fixo ao navegar; mão inferior no retrato e lateral na paisagem. Telão mostra tabuleiro, linhas, ordem e placar, sem cartas privadas. Tela cheia depende do navegador.

Animações finitas de entrada, seleção, colocação/remoção, troca de turno, placar, linhas e resultado. Preferência por movimento reduzido respeitada. Efeitos sintetizados de clique, seleção, colocação, turno, erro, bloqueio, sequência, vitória, derrota, empate e prazo esgotado, com mute. Não há faixa de fundo nem reprodução contínua. O dispositivo compartilhado anuncia a vitória; uma aba local que acompanhou um participante da equipe perdedora emite o efeito de derrota ao receber o resultado.

Estado oficial **local**, em uma chave exclusiva do localStorage. Ações incluem partida, revisão, jogador, tipo, carta e casa. Motor rejeita comandos repetidos, antigos e fora do turno. Web Locks serializa alterações entre abas quando disponível; `storage` sincroniza revisões. Em navegadores sem Web Locks, a validação de revisão continua, mas exclusão simultânea entre abas não é garantida: usar uma aba.

Esta versão não possui salas online, identidade de conta por participante, recuperação entre dispositivos ou mãos privadas contra inspeção do armazenamento. O acesso ao módulo continua sujeito ao login já existente. F5 e sair/retornar recuperam a partida ao escolher Continuar partida salva. A lógica local não depende de conexão depois de carregar os arquivos.

Um AbortController controla todos os listeners do jogo. Um MutationObserver encerra recursos ao remover o módulo na navegação. Cronômetro único só existe nas partidas com tempo e termina no resultado, saída ou nova partida. Sons interrompem os anteriores, desconectam nós ao terminar e fecham AudioContext ao sair. Animações são canceladas na saída. Sem polling de servidor, requestAnimationFrame, timers de animação ou elementos Audio.

## Validação

`node --test tests/constellations.test.cjs`

16 testes: integração preserva os cinco cards anteriores; distribuição 2–12 jogadores; consumo e reposição; validação de posição/carta/jogador/partida/revisão; duplicação; vitórias horizontal, vertical e ambas diagonais; compartilhamento de apenas uma casa; Pulso, Escudo, carta morta; prazo; empate; restauração; 30 partidas completas em 1v1, 2v2 e 3v3. Todos passaram. Também passaram 40 testes existentes de áudio e projetor (`audio-fade`, `display-helper`, `display-manager`).

Interface testada pelo navegador interno em servidor local, usando um harness temporário fora do repositório porque a aba real exige login: selecionar carta → casa válida → confirmar → mão oculta → próximo turno; vitória e empate; 3v3 com 12 passes; F5; sair/retornar; cinco ciclos de novas partidas/saídas; prazo real; modo telão; áudio indisponível; clique duplo; duas abas confirmando simultaneamente produziram apenas um turno e a mesma vitória em ambas. Nenhum erro de console do jogo foi observado.

Instrumentação temporária confirmou zero intervalos, listeners e contextos de áudio do jogo após cada saída; o observador de instrumentação do navegador permaneceu, e o observador do jogo foi removido. Retomada criou um único cronômetro e conjunto de listeners. Resultado encerrou cronômetro. Sem tempo não cria intervalo.

Telas inspecionadas: 360×640, 390×844, 844×390, 768×1024 e 1280×1000. Correções: tabuleiro cortado no desktop, placar fora da tela ao navegar, mão sobreposta na paisagem, animação de linha repetida na seleção e intervalo desnecessário nas partidas sem prazo.

Conceito gerado e implementação inspecionados visualmente: paleta marinho/azul/dourado, título, hierarquia de placar, peças com profundidade, linhas luminosas e controles de cartas. Adaptações deliberadas: tabuleiro mobile com pan em vez de reduzir casas como na imagem de conceito; números 1–8 em todas as combinações; regras corrigidas para cinco fichas da equipe, independentemente dos símbolos; mão lateral na paisagem; resultado e configurações funcionais além da imagem. Arte geométrica nativa em CSS/texto/SVG, sem imagens raster de produção.

Ainda requer validação com conta autenticada na aba Jogos, celulares físicos (especialmente Safari/iOS, gestos e tela cheia), avaliação auditiva humana e uma sessão real com até 12 pessoas. Reconexão online não se aplica ao modo local e não foi implementada nem testada. A interface da aba original foi preservada; seu card foi validado por teste de integração, sem contornar o login.
