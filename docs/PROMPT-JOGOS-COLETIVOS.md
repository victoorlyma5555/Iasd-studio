PROMPT MESTRE — GRANDE EXPANSÃO DOS JOGOS COLETIVOS DO IASD APP
EVOLUÇÃO DO SISTEMA EXISTENTE + JOGOS EM EQUIPES + NOVAS MECÂNICAS
+ NOVA IDENTIDADE VISUAL + PERFORMANCE + REALTIME + SINCRONIZAÇÃO


============================================================
CONTEXTO PRINCIPAL
============================================================

Quero fazer uma GRANDE EXPANSÃO do sistema de Jogos do IASD APP,
principalmente do modo JOGO COLETIVO.

PORÉM EXISTE UMA REGRA FUNDAMENTAL:

ESTE PROMPT É UMA CONTINUAÇÃO DO TRABALHO QUE VOCÊ JÁ ESTÁ FAZENDO.

NÃO quero que você descarte o que já desenvolveu.

NÃO quero que você apague funcionalidades existentes para reconstruir tudo.

NÃO quero uma segunda versão paralela do jogo.

NÃO quero que você abandone implementações que já estão em andamento.

Quero que você:

ANALISE
+
PRESERVE
+
COMPLETE
+
APRIMORE
+
EXPANDA.

Pegue o sistema que já estamos construindo e leve-o para um nível muito maior.

Tudo que você já implementou nesta sessão deve ser considerado parte da base oficial
do projeto, desde que esteja funcional e faça sentido dentro da arquitetura atual.


============================================================
1. PRIMEIRO: ENTENDA COMPLETAMENTE O QUE JÁ EXISTE
============================================================

ANTES DE MODIFICAR QUALQUER COISA:

Faça uma análise completa do módulo Jogos existente.

Principalmente:

JOGO COLETIVO.

Analise:

- estrutura atual do jogo;
- arquitetura;
- componentes;
- hooks;
- contextos;
- serviços;
- criação de sala;
- entrada em sala;
- código da sala;
- QR Code;
- jogadores conectados;
- identificação dos participantes;
- host;
- espectadores;
- telão;
- sistema de rodadas;
- perguntas;
- desafios;
- respostas;
- validação;
- pontuação;
- ranking;
- tela de resultado;
- pódio;
- cronômetros;
- sons;
- animações;
- transições;
- estados de espera;
- reconexão;
- mobile;
- desktop;
- telão/projetor;
- banco de dados;
- Supabase;
- Realtime;
- subscriptions;
- persistência;
- autenticação;
- permissões;
- segurança;
- histórico;
- ranking do perfil;
- qualquer outra estrutura relacionada.

Não presuma como o sistema funciona.

LEIA O CÓDIGO ATUAL.

Entenda as dependências.

Descubra o que já está pronto.

Descubra o que está parcialmente pronto.

Descubra o que estava sendo desenvolvido.

Descubra o que pode ser reutilizado.


============================================================
2. NÃO RECOMECE O TRABALHO
============================================================

Este ponto é MUITO IMPORTANTE.

Se algo deste prompt:

JÁ EXISTE:
→ preserve e aprimore apenas se necessário.

ESTÁ PARCIALMENTE IMPLEMENTADO:
→ complete.

AINDA NÃO EXISTE:
→ implemente.

EXISTE DE FORMA EQUIVALENTE:
→ reutilize.

EXISTE DE FORMA MELHOR:
→ preserve a solução existente.

Não refatore grandes áreas apenas por preferência arquitetural.

Não substitua componentes funcionais sem necessidade real.

Não elimine funções já criadas simplesmente porque não foram mencionadas novamente.

NÃO interprete este prompt como:

"apague e faça novamente".

Interprete como:

"continue o que já estamos fazendo e leve para o próximo nível".


============================================================
3. REGRA CRÍTICA: NÃO INTRODUZIR DELAY
============================================================

Este é um jogo coletivo EM TEMPO REAL.

Portanto:

TODA ALTERAÇÃO DEVE SER FEITA COM EXTREMO CUIDADO PARA NÃO GERAR:

- delay;
- atraso;
- travamento;
- engasgos;
- respostas lentas;
- sincronização tardia;
- telas esperando o banco;
- excesso de requisições;
- excesso de subscriptions;
- renderizações desnecessárias.

Uma funcionalidade nova que deixa o jogo mais lento é uma REGRESSÃO.

Quero:

MAIS JOGOS
+
MAIS MECÂNICAS
+
MAIS ANIMAÇÕES
+
MELHOR DESIGN
+
MAIS RECURSOS

SEM PERDER A FLUIDEZ.


============================================================
4. PRIORIDADE DE EXECUÇÃO
============================================================

Quando houver conflito entre:

EFEITO VISUAL
vs
FLUIDEZ

priorize FLUIDEZ.

REFATORAÇÃO
vs
ESTABILIDADE

priorize ESTABILIDADE.

RECRIAR
vs
REUTILIZAR

priorize REUTILIZAR.

ANIMAÇÃO PESADA
vs
ANIMAÇÃO LEVE

priorize ANIMAÇÃO LEVE.

NOVA CONSULTA
vs
DADO JÁ DISPONÍVEL

reutilize o dado disponível.

BELEZA
vs
SINCRONIZAÇÃO

priorize SINCRONIZAÇÃO.

A interface deve ser bonita SEM comprometer o jogo.


============================================================
5. OBJETIVO PRINCIPAL DA EXPANSÃO
============================================================

Quero transformar Jogos Coletivos em uma verdadeira plataforma
de jogos bíblicos em grupo dentro do IASD APP.

O principal novo conceito será:

TIME CONTRA TIME.

Exemplo:

TIME AZUL
VS
TIME DOURADO.

Mas não limite a arquitetura a dois times.

Ela deve permitir futuramente:

2 TIMES
3 TIMES
4 TIMES
ou mais.

O organizador deverá conseguir escolher o formato da partida.


============================================================
6. SISTEMA DE EQUIPES
============================================================

Cada equipe poderá possuir:

- nome;
- cor;
- símbolo;
- jogadores;
- pontuação;
- capitão opcional;
- posição atual.

Exemplos:

TIME LEÕES
TIME ÁGUIAS
TIME GIDEÃO
TIME DAVI.

Disponibilize nomes automáticos.

Não obrigue o organizador a configurar tudo manualmente.

Os participantes poderão:

- escolher o time;
- ser distribuídos automaticamente;
- ser sorteados;
- ou serem organizados pelo host.

A entrada na partida deve continuar EXTREMAMENTE RÁPIDA.

Não transforme a criação da sala em um formulário enorme.


============================================================
7. EXPERIÊNCIA DE FORMAÇÃO DAS EQUIPES
============================================================

Depois que todos entrarem:

ESCOLHA SEU TIME

ou:

SORTEANDO AS EQUIPES...

Depois:

TIME AZUL

Victor
João
Lucas

VS

TIME DOURADO

Pedro
Marcos
Ana

Depois:

PREPAREM-SE!

3
2
1

COMEÇAR.

Essa sequência deve possuir animações bonitas, rápidas e leves.


============================================================
8. NÃO QUERO APENAS QUIZZES
============================================================

Não trate:

"jogo bíblico"

como sinônimo de:

pergunta + quatro alternativas.

Quero MECÂNICAS DIFERENTES.

Utilize a estrutura existente para criar vários tipos de desafios.


============================================================
9. VERSÍCULO PERDIDO
============================================================

Um versículo aparece incompleto.

Exemplo:

"O Senhor é meu ______ e nada me faltará."

Os jogadores precisam encontrar a palavra correta.

Pode funcionar com:

- digitação;
- alternativas;
- seleção de palavras;
- montagem;
- arrastar palavras.

Em equipes, cada participante pode contribuir para a resposta.


============================================================
10. QUEM SOU EU?
============================================================

Pistas aparecem progressivamente.

PISTA 1
Fui rei.

PISTA 2
Construí um templo.

PISTA 3
Era filho de Davi.

Quanto mais cedo a equipe descobrir:

MAIOR A PONTUAÇÃO.

Cada pista reduz gradualmente o valor disponível.


============================================================
11. ONDE ESTÁ NA BÍBLIA?
============================================================

Uma passagem é apresentada.

Os participantes precisam descobrir:

- livro;
- capítulo;
- personagem;
- contexto;
- ou referência.

Pode haver níveis diferentes de dificuldade.


============================================================
12. ORDEM DOS LIVROS
============================================================

Livros aparecem embaralhados.

Os participantes precisam colocá-los na ordem correta.

Preferencialmente utilizando:

DRAG AND DROP

quando o dispositivo permitir.

No celular, a interação deve ser extremamente confortável.


============================================================
13. LINHA DO TEMPO BÍBLICA
============================================================

Eventos aparecem fora de ordem.

A equipe precisa organizá-los cronologicamente.

Exemplo:

Nascimento de Jesus
Crucificação
Ressurreição
Pentecostes.

Pode haver versões:

fáceis;
médias;
difíceis.


============================================================
14. PERSONAGEM SECRETO
============================================================

Uma silhueta, objeto ou conjunto de pistas aparece.

As pistas são liberadas progressivamente.

Quanto menos pistas utilizadas:

MAIS PONTOS.


============================================================
15. BATALHA DE PERGUNTAS
============================================================

Times respondem alternadamente.

Se o TIME A errar:

TIME B pode ROUBAR.

Mostrar visualmente:

CHANCE DE ROUBO.

Utilize animação curta e som característico.


============================================================
16. RESPOSTA RELÂMPAGO
============================================================

Todos os times recebem o mesmo desafio.

Quem responder corretamente primeiro:

recebe bônus de velocidade.

IMPORTANTE:

não confie simplesmente no timestamp enviado pelo navegador.

A validação deve ser segura e consistente.


============================================================
17. VERDADEIRO OU FALSO
============================================================

Todos respondem simultaneamente.

Depois:

VERDADEIRO

ou

FALSO

é revelado.

Apresente uma pequena explicação bíblica depois da resposta.


============================================================
18. COMPLETE A HISTÓRIA
============================================================

Uma história bíblica é revelada progressivamente.

Os participantes precisam identificar:

- personagem;
- acontecimento;
- livro;
- local;
- conclusão.


============================================================
19. BATALHA FINAL
============================================================

Nas últimas rodadas pode surgir:

BATALHA FINAL.

Pode existir:

2X PONTOS

ou eventualmente:

3X PONTOS.

Use com equilíbrio.

Não transforme o jogo inteiro em sorte.

Quem jogou melhor deve continuar sendo recompensado.


============================================================
20. CRIE NOVOS JOGOS
============================================================

As ideias anteriores NÃO são uma lista fechada.

Você tem liberdade criativa.

Depois de compreender a arquitetura existente:

INVENTE NOVAS MECÂNICAS.

Porém todas devem continuar relacionadas a:

- Bíblia;
- conhecimento bíblico;
- integração;
- igreja;
- aprendizado;
- competição saudável.

NÃO transforme o IASD APP em videogame genérico.


============================================================
21. EXEMPLOS DE NOVAS MECÂNICAS QUE VOCÊ PODE EXPLORAR
============================================================

Considere também criar, caso sejam tecnicamente adequados:

QUEM DISSE?

Uma frase bíblica aparece e os times identificam quem falou.

MAPA BÍBLICO

Identificar locais importantes de acontecimentos bíblicos.

LIGAÇÃO BÍBLICA

Relacionar personagem → acontecimento → livro.

PALAVRA PROIBIDA

Um jogador recebe um personagem e precisa ajudar sua equipe a descobrir
sem utilizar determinadas palavras.

DUAS PISTAS, UMA RESPOSTA

Dois elementos aparentemente diferentes apontam para um personagem,
livro ou acontecimento.

ERRO NA HISTÓRIA

Uma narrativa bíblica curta possui um detalhe propositalmente incorreto.
As equipes precisam encontrá-lo.

QUAL NÃO PERTENCE?

Quatro personagens, objetos ou acontecimentos aparecem.
Um não pertence ao contexto dos outros.

MONTE A PASSAGEM

Partes de uma passagem aparecem separadas.
A equipe deve reconstruí-la.

MEMÓRIA BÍBLICA

Elementos aparecem brevemente e desaparecem.
Os participantes precisam lembrar a sequência.

CONEXÃO

Descobrir a relação entre personagens, lugares ou acontecimentos.

Não implemente todas obrigatoriamente.

Analise quais realmente acrescentam valor.


============================================================
22. RODADAS ESPECIAIS
============================================================

O Game Engine poderá utilizar ocasionalmente:

RODADA DUPLA

Pontos x2.

RODADA RELÂMPAGO

Tempo reduzido.

ROUBO

Outro time pode responder.

TODOS CONTRA O TEMPO

Todos resolvem simultaneamente.

PERGUNTA DE OURO

Valor especial.

DESEMPATE

Somente equipes empatadas participam.

RODADA FINAL

Encerramento especial.

Use esses eventos com moderação.


============================================================
23. SISTEMA DE PONTUAÇÃO
============================================================

A pontuação precisa ser compreensível.

Considere:

- acerto;
- velocidade;
- dificuldade;
- sequência;
- rodada especial.

Evite valores absurdos.

Quando houver alteração:

+100
Resposta correta

ou:

+50
Bônus de velocidade

pode aparecer discretamente.

O jogador deve entender POR QUE recebeu os pontos.


============================================================
24. PONTUAÇÃO NÃO PODE SER CONTROLADA PELO CLIENTE
============================================================

O navegador NÃO pode simplesmente enviar:

"me dê 5000 pontos".

Pontuação importante deve ser calculada ou validada por lógica confiável.

Proteja principalmente:

- pontos;
- respostas;
- velocidade;
- equipes;
- rodada;
- host;
- resultados;
- conquistas.


============================================================
25. CELULAR COMO CONTROLE
============================================================

Quero aproveitar muito mais o celular.

O celular do participante deve funcionar quase como um:

CONTROLE DA PARTIDA.

Exemplo:

TELÃO:

ESCOLHAM A RESPOSTA!

CELULAR:

A
B
C
D.

Outro exemplo:

TELÃO:

ORGANIZE OS LIVROS.

CELULAR:

interface interativa para organização.

Assim, nem tudo precisa aparecer igualmente em todas as telas.


============================================================
26. EXPERIÊNCIA DO TELÃO
============================================================

Pense em quem está assistindo de longe.

O telão deve priorizar:

- desafio;
- equipes;
- pontuação;
- rodada;
- cronômetro;
- progresso;
- respostas recebidas;
- mudanças de liderança;
- resultado.

NÃO revele informações secretas antecipadamente.

O telão deve funcionar como o palco do jogo.

Os celulares funcionam como os controles.


============================================================
27. HOST
============================================================

O host precisa conseguir administrar a partida sem uma interface complicada.

Ele poderá controlar quando necessário:

- início;
- pausa quando aplicável;
- próxima rodada;
- equipes;
- jogadores;
- encerramento;
- eventos especiais.

Mas automatize tudo que não precisa de intervenção.

Não transforme o host em operador de dezenas de botões.


============================================================
28. ESTADOS OFICIAIS DA PARTIDA
============================================================

Analise primeiro se já existe uma máquina de estados.

Se existir:

APRIMORE-A.

NÃO crie outra paralela.

Caso seja necessário estruturar melhor, considere estados equivalentes a:

WAITING
TEAM_SELECTION
COUNTDOWN
ACTIVE
LOCKED
REVEAL
RESULT
TRANSITION
FINISHED.

Esses nomes são apenas referência.

Adapte à arquitetura existente.

Todos os dispositivos precisam saber qual é o ESTADO OFICIAL da partida.


============================================================
29. SINCRONIZAÇÃO
============================================================

HOST
JOGADORES
TELÃO
ESPECTADORES

precisam enxergar estados coerentes.

Não permita situações como:

host na rodada 5;
telão na rodada 4;
jogador A vendo resultado;
jogador B ainda respondendo.

Quando o host muda de rodada:

TODOS devem acompanhar.

Quando termina:

TODOS recebem o resultado.

Quando muda o placar:

TODOS recebem a alteração necessária.


============================================================
30. REALTIME — NÃO SOBRECARREGAR
============================================================

Revise cuidadosamente a implementação atual do Supabase Realtime.

NÃO transforme cada pequena mudança visual em:

INSERT
UPDATE
ou broadcast desnecessário.

Separe:

ESTADO PERSISTENTE

de

ESTADO EFÊMERO.

Persistir quando necessário:

- sala;
- jogadores;
- equipes;
- rodada;
- respostas;
- pontuação;
- resultados;
- histórico.

Não persistir constantemente apenas por causa de:

- animações;
- partículas;
- transições;
- brilhos;
- progresso visual;
- frames;
- efeitos locais.


============================================================
31. CRONÔMETRO EFICIENTE
============================================================

NÃO faça o servidor enviar:

30
29
28
27
26...

para todos os dispositivos a cada segundo se isso não for necessário.

Prefira sincronizar:

started_at
ends_at
duration

ou estrutura equivalente.

Cada dispositivo calcula a contagem regressiva localmente.

Faça correções de sincronização quando necessário.

Assim reduzimos:

- tráfego;
- Realtime;
- queries;
- delay.


============================================================
32. RESPOSTA IMEDIATA DA INTERFACE
============================================================

Quando tecnicamente seguro:

o usuário deve sentir resposta imediata.

Exemplo:

tocou em uma resposta →

o botão reage imediatamente.

Depois:

o servidor valida.

Não deixe a pessoa apertar e esperar a rede para descobrir se o toque funcionou.

Utilize quando apropriado:

- optimistic UI;
- estados locais;
- confirmação assíncrona.

MAS:

não confirme pontuação definitiva antes da validação confiável.


============================================================
33. PRÉ-CARREGAMENTO
============================================================

Enquanto a rodada atual acontece:

prepare silenciosamente a próxima.

Pré-carregue quando possível:

- pergunta;
- desafio;
- imagens;
- sons;
- dados necessários;
- assets.

Quero evitar:

PRÓXIMA RODADA
→ loading
→ consulta
→ download
→ render
→ jogo.

Prefira:

PRÓXIMA RODADA
→ transição
→ JOGO.


============================================================
34. NÃO CARREGAR TUDO DE UMA VEZ
============================================================

Pré-carregamento não significa baixar o jogo inteiro.

Faça de maneira inteligente.

Carregue:

o necessário agora

+

o necessário imediatamente depois.

Evite aumentar excessivamente:

memória;
download inicial;
tempo de entrada;
uso de dados móveis.


============================================================
35. RENDERIZAÇÃO
============================================================

Evite rerenders desnecessários.

Uma alteração no cronômetro não deve obrigatoriamente reconstruir:

- fundo;
- placar;
- jogadores;
- cards;
- cenário inteiro.

Uma nova resposta não deve reconstruir toda a aplicação.

Isole componentes e estados quando fizer sentido.

Use memoização somente onde trouxer benefício real.

Não transforme otimização em complexidade desnecessária.


============================================================
36. ANIMAÇÕES
============================================================

A interface deve parecer VIVA.

Utilize animações em:

- entrada;
- jogadores entrando;
- formação de equipes;
- countdown;
- nova rodada;
- pontuação;
- resposta correta;
- resposta errada;
- mudança de liderança;
- rodada especial;
- resultado;
- vitória;
- pódio.

Porém:

ANIMAÇÕES NÃO CONTROLAM A LÓGICA DO GAME.

A lógica da partida deve permanecer independente da animação.

Não espere desnecessariamente uma animação terminar para processar
uma operação importante.


============================================================
37. PERFORMANCE VISUAL
============================================================

Priorize:

CSS;
SVG;
transform;
opacity;
animações leves;
assets compactados;
componentes reutilizáveis.

Evite:

vídeos pesados;
imagens gigantes;
efeitos desnecessários;
blur excessivo;
partículas demais;
animações que destruam FPS;
dependências enormes apenas para pequenos efeitos.

Quero qualidade cinematográfica por meio de BOM DESIGN,
não força bruta de GPU.


============================================================
38. IDENTIDADE SONORA
============================================================

Crie uma identidade sonora consistente.

Sons possíveis:

entrada na sala;
jogador entrando;
countdown;
nova rodada;
tempo acabando;
resposta correta;
resposta errada;
mudança de liderança;
rodada especial;
vitória;
pódio.

Todos devem respeitar:

VOLUME

e

MUDO.

Evite arquivos enormes.

Pré-carregue sons necessários.

Evite tocar o mesmo som duas vezes devido a listeners duplicados.


============================================================
39. RECONEXÃO
============================================================

Se um jogador:

atualizar a página;
perder Wi-Fi;
trocar temporariamente de rede;
fechar e reabrir rapidamente;

tente reconectá-lo automaticamente.

Preserve quando possível:

- identidade;
- sala;
- time;
- pontuação;
- estatísticas;
- posição.

Não crie jogadores duplicados na reconexão.


============================================================
40. QUEDA DO HOST
============================================================

Se o host perder conexão por alguns segundos:

A PARTIDA NÃO DEVE DESAPARECER.

Preserve o estado.

Permita recuperação segura.

Não implemente uma solução complexa desnecessariamente se a arquitetura atual
já resolver parte disso.

APRIMORE O QUE EXISTE.


============================================================
41. EVENTOS DUPLICADOS
============================================================

Proteja o sistema contra:

- resposta duplicada;
- pontos duplicados;
- jogador duplicado;
- áudio duplicado;
- animação duplicada;
- rodada avançando duas vezes;
- listener duplicado;
- subscription acumulada.

Ao desmontar componentes:

encerre subscriptions que não são mais necessárias.


============================================================
42. PÓDIO
============================================================

A tela final deve ser ESPECIAL.

Mas NÃO extremamente carregada.

Quero elegância.

Mostrar:

1º
2º
3º.

Com:

equipes;
ou jogadores quando aplicável.

Utilize:

- iluminação dourada;
- profundidade;
- animação suave;
- confetes discretos;
- efeito de vitória;
- som elegante.

Também poderá mostrar:

pontuação final;
acertos;
melhor sequência;
rodada decisiva.

Depois:

NOVA PARTIDA

JOGAR NOVAMENTE

SAIR.


============================================================
43. RANKING NÃO É O MESMO QUE PÓDIO
============================================================

IMPORTANTE:

Não transforme todas as telas em variações do mesmo ranking.

Precisamos diferenciar visualmente:

PLACAR DURANTE A PARTIDA

RANKING INDIVIDUAL

RESULTADO DA RODADA

RESULTADO DE EQUIPES

PÓDIO FINAL

RANKING DO PERFIL.

Eles pertencem à mesma família visual,
mas possuem funções diferentes.


============================================================
44. ESTATÍSTICAS
============================================================

Registre quando fizer sentido:

- partidas;
- vitórias;
- derrotas;
- posição;
- acertos;
- erros;
- sequência;
- pontos;
- desempenho.

Mesmo jogando em equipe:

cada participante poderá acumular estatísticas individuais.


============================================================
45. INTEGRAÇÃO COM O PERFIL
============================================================

As estatísticas podem alimentar futuramente o sistema de ranking do perfil.

Diferencie:

RANKING PESSOAL

de

RESULTADO DO TIME.

Uma pessoa pode perder a partida com sua equipe e ainda possuir boas
estatísticas individuais.


============================================================
46. HISTÓRICO
============================================================

Permita estruturar histórico de partidas.

Exemplo:

data;
jogo;
equipes;
resultado;
participantes;
pontuação;
vencedor;
estatísticas relevantes.

Não grave dados inúteis apenas para aumentar o banco.


============================================================
47. IMAGENS DE REFERÊNCIA — REGRA FUNDAMENTAL
============================================================

Estou criando e enviando várias IMAGENS DE REFERÊNCIA das telas.

Essas imagens devem se tornar:

A REFERÊNCIA VISUAL OFICIAL DOS JOGOS DO IASD APP.

NÃO trate cada imagem isoladamente.

ESTUDE TODAS.

Extraia delas um:

DESIGN SYSTEM.


============================================================
48. APRENDA A IDENTIDADE VISUAL
============================================================

Analise:

- azul profundo;
- dourado;
- gradientes;
- iluminação;
- sombras;
- bordas;
- cards;
- botões;
- tipografia;
- hierarquia;
- ícones;
- fundos;
- cruz;
- profundidade;
- espaçamento;
- proporções;
- densidade de informação;
- animações;
- distribuição dos elementos;
- atmosfera cinematográfica.

Memorize o padrão visual.


============================================================
49. NÃO VOU CRIAR UMA IMAGEM PARA CADA TELA
============================================================

Isso é FUNDAMENTAL.

Eu NÃO vou produzir manualmente uma referência para:

cada popup;
cada erro;
cada loading;
cada transição;
cada estado.

Depois que você possuir referências suficientes:

APRENDA O PADRÃO.

Se eu fornecer:

LOBBY
PERGUNTA
RESULTADO
PLACAR
PÓDIO

você deverá conseguir criar:

CONTAGEM REGRESSIVA
DESEMPATE
JOGADORES ENTRANDO
ESCOLHA DE EQUIPE
RECONEXÃO
RODADA ESPECIAL
CARREGAMENTO
ERRO
FIM DE RODADA
MUDANÇA DE LIDERANÇA
EQUIPE VENCEDORA

seguindo A MESMA IDENTIDADE.


============================================================
50. NÃO VOLTE PARA O DESIGN ANTIGO
============================================================

Se uma tela ainda não possui referência:

NÃO utilize automaticamente o design antigo.

Use o DESIGN SYSTEM aprendido com as novas referências.

Todas as telas precisam parecer criadas:

PELO MESMO DESIGNER

NO MESMO PROJETO

NA MESMA ÉPOCA.


============================================================
51. CONSISTÊNCIA VISUAL
============================================================

Não quero:

uma tela cinematográfica;
outra parecendo dashboard;
outra genérica;
outra extremamente simples.

Tudo pertence ao:

IASD APP — JOGOS.

Crie uma identidade reconhecível.


============================================================
52. RESPONSIVIDADE REAL
============================================================

O sistema deve funcionar muito bem em:

CELULAR
TABLET
NOTEBOOK
PC
TELÃO
PROJETOR.

NÃO simplesmente reduza o desktop para caber no celular.

CELULAR:

priorize toque e interação.

TELÃO:

priorize leitura à distância e espetáculo.

PC:

equilibre controle e visualização.


============================================================
53. ARQUITETURA REUTILIZÁVEL
============================================================

ANTES de criar novos componentes, analise o que já existe.

Se a arquitetura atual permitir, evolua para conceitos equivalentes a:

GameEngine
RoomManager
TeamManager
ScoreManager
RoundManager
Timer
GameStage
GameResult
Podium
PlayerController
ProjectionView.

IMPORTANTE:

Esses nomes são CONCEITUAIS.

Não crie automaticamente todos eles se já existem estruturas equivalentes.

NÃO faça refatoração gigante apenas para obedecer nomes deste prompt.

O objetivo é:

REUTILIZAÇÃO.

Novos jogos devem utilizar a mesma base sempre que possível.


============================================================
54. NÃO CRIE 20 SISTEMAS DE JOGO INDEPENDENTES
============================================================

Evite:

VerseGame.tsx
QuizGame.tsx
TimelineGame.tsx
CharacterGame.tsx

cada um reinventando:

sala;
timer;
pontuação;
rodada;
resultado;
Realtime.

Prefira uma base compartilhada.

Cada modalidade define principalmente:

conteúdo;
regras;
interação;
validação;
renderização específica.

A infraestrutura deve ser compartilhada quando possível.


============================================================
55. BANCO DE DADOS
============================================================

ANALISE O BANCO EXISTENTE PRIMEIRO.

NÃO saia criando tabelas.

Se forem realmente necessárias estruturas adicionais,
considere conceitos equivalentes a:

game_rooms
game_players
game_teams
game_rounds
game_answers
game_scores
game_history
game_achievements.

Mas:

SE JÁ EXISTE UMA ESTRUTURA EQUIVALENTE:

USE-A.

Evite:

duplicação;
migração desnecessária;
complexidade;
consultas extras.


============================================================
56. SEGURANÇA
============================================================

Proteja:

salas;
host;
pontuação;
equipes;
respostas;
rodadas;
resultados;
ações administrativas.

Não confie em dados críticos simplesmente porque vieram do cliente.

Utilize a estrutura de segurança existente no projeto.

Não enfraqueça RLS ou autenticação apenas para fazer uma função funcionar.


============================================================
57. NÃO QUEBRE O RESTANTE DO IASD APP
============================================================

Preserve:

LOGIN
CADASTRO
PERFIL
RANKING
JOGOS INDIVIDUAIS
JOGO COLETIVO EXISTENTE
SUPABASE
USUÁRIOS
SONOPLASTIA
CRONOGRAMAS
LIÇÃO
BÍBLIA
DEMAIS MÓDULOS.

Não altere áreas que não precisam ser alteradas.


============================================================
58. NÃO FAÇA GRANDES ALTERAÇÕES ÀS CEGAS
============================================================

Antes de modificar um componente importante:

1. descubra quem usa;
2. descubra suas dependências;
3. descubra o estado compartilhado;
4. descubra subscriptions;
5. descubra chamadas ao banco;
6. descubra impacto no mobile;
7. descubra impacto no telão.

Depois altere.


============================================================
59. LIBERDADE CRIATIVA
============================================================

Depois de cumprir os requisitos principais:

PENSE.

Pergunte internamente:

"O que faria essa experiência ficar ainda melhor?"

Se encontrar uma boa ideia:

IMPLEMENTE.

Desde que:

- seja útil;
- seja coerente;
- não complique;
- não prejudique performance;
- não quebre funções;
- mantenha o foco bíblico;
- siga o design system.


============================================================
60. PENSE COMO UMA PLATAFORMA, NÃO COMO UM ÚNICO JOGO
============================================================

Quero utilizar isso em:

cultos jovens;
JA;
classes;
pequenos grupos;
eventos;
retiros;
gincanas;
encontros;
programações especiais.

A visão é:

alguém abre o IASD APP.

Cria uma sala.

Coloca o código no telão.

As pessoas pegam seus celulares.

Entram.

Formam equipes.

E o ambiente vira uma COMPETIÇÃO BÍBLICA INTERATIVA.


============================================================
61. TESTE REAL DE LATÊNCIA
============================================================

Não teste apenas:

"compilou".

Simule uma partida.

Teste:

1 HOST
+
1 TELÃO
+
VÁRIOS JOGADORES.

Observe:

- tempo de entrada;
- criação da sala;
- resposta;
- atualização;
- rodada;
- placar;
- cronômetro;
- animações;
- sons;
- resultado;
- próxima rodada.


============================================================
62. TESTE DE CONCORRÊNCIA
============================================================

Simule vários jogadores respondendo praticamente ao mesmo tempo.

Verifique:

- quem respondeu primeiro;
- validação;
- pontuação;
- duplicidade;
- condições de corrida;
- inconsistências.

Não deixe a lógica depender apenas da ordem visual em que eventos chegaram ao navegador.


============================================================
63. TESTE DE RECONEXÃO
============================================================

Durante uma partida:

atualize um jogador.

Desconecte.

Reconecte.

Faça o mesmo com o host.

Confirme que:

sala;
time;
rodada;
pontos;
estado;

continuam coerentes.


============================================================
64. TESTE MOBILE
============================================================

Teste telas pequenas.

Observe:

- toque;
- teclado;
- scroll;
- drag;
- botões;
- cronômetro;
- respostas;
- safe area;
- orientação;
- reconexão;
- desempenho.

Não aceite interface quebrada apenas porque desktop funciona.


============================================================
65. TESTE TELÃO
============================================================

Verifique:

- legibilidade;
- escala;
- contraste;
- placar;
- cronômetro;
- animações;
- conteúdo secreto;
- transições.

Lembre:

uma pessoa pode estar vendo o telão a vários metros de distância.


============================================================
66. TESTE DE REGRESSÃO
============================================================

Depois da expansão:

TESTE NOVAMENTE O QUE JÁ FUNCIONAVA.

Principalmente:

criação de sala;
entrada;
QR Code;
jogadores;
rodadas;
respostas;
ranking;
resultado;
pódio;
sons;
reconexão;
mobile;
desktop;
Realtime.

Uma função nova NÃO justifica quebrar uma antiga.


============================================================
67. TESTE DE PERFORMANCE
============================================================

Compare o comportamento com o estado anterior.

Procure:

subscriptions duplicadas;
queries repetidas;
listeners acumulados;
renders excessivos;
assets grandes;
efeitos pesados;
operações bloqueantes;
carregamentos sequenciais desnecessários.

Corrija regressões.


============================================================
68. ORDEM DE EXECUÇÃO
============================================================

SIGA ESTA ORDEM:

1. Leia e compreenda o estado ATUAL do Jogo Coletivo.

2. Identifique tudo que VOCÊ JÁ ESTÁ IMPLEMENTANDO.

3. NÃO descarte esse trabalho.

4. Analise todas as imagens de referência disponíveis.

5. Extraia delas o Design System dos Jogos.

6. Analise o banco atual.

7. Analise Supabase e Realtime.

8. Analise subscriptions e sincronização.

9. Identifique componentes reutilizáveis.

10. Identifique gargalos existentes.

11. Planeje a expansão SEM recomeçar o sistema.

12. Complete primeiro implementações que já estavam em andamento quando fizer sentido.

13. Implemente/evolua o sistema de equipes.

14. Implemente os novos modos coletivos.

15. Utilize arquitetura compartilhada.

16. Aplique o novo Design System.

17. Adapte automaticamente telas sem referência específica.

18. Implemente animações leves.

19. Implemente identidade sonora.

20. Implemente histórico e estatísticas quando necessário.

21. Integre estatísticas ao sistema de ranking sem confundir ranking individual com resultado das equipes.

22. Otimize Realtime.

23. Elimine subscriptions duplicadas.

24. Reduza consultas desnecessárias.

25. Implemente pré-carregamento inteligente.

26. Verifique rerenders.

27. Teste host + telão + múltiplos jogadores.

28. Teste vários jogadores respondendo simultaneamente.

29. Teste mudança rápida de rodadas.

30. Teste cronômetros.

31. Teste reconexão de jogador.

32. Teste reconexão de host.

33. Teste desktop.

34. Teste mobile.

35. Teste telão/projeção.

36. Teste sons.

37. Teste animações.

38. Teste segurança da pontuação.

39. Teste regressões.

40. Compare performance antes/depois.

41. Corrija qualquer atraso introduzido.

42. Revise novamente o sistema completo.

43. Somente considere concluído quando o jogo estiver estável.


============================================================
69. NÃO PARE NO PRIMEIRO ERRO
============================================================

Durante a implementação:

se encontrar erro:

INVESTIGUE.

CORRIJA.

TESTE NOVAMENTE.

Continue.

Não abandone a implementação inteira porque um teste intermediário falhou.

Por outro lado:

não faça alterações aleatórias tentando obter um build verde.

Descubra a causa.


============================================================
70. NÃO CONFUNDA BUILD VERDE COM SISTEMA PRONTO
============================================================

Build funcionando NÃO significa:

Realtime funcionando.

Não significa:

multiplayer funcionando.

Não significa:

mobile funcionando.

Não significa:

sincronização funcionando.

Não significa:

reconexão funcionando.

Portanto:

valide comportamento.


============================================================
71. CRITÉRIO DE PERFORMANCE
============================================================

Depois da expansão, quero que a experiência pareça:

TÃO RÁPIDA QUANTO

ou

MAIS RÁPIDA

que a implementação anterior.

Se algum recurso novo provocar atraso perceptível:

investigue antes de considerar concluído.


============================================================
72. CRITÉRIO VISUAL
============================================================

Quando eu navegar por:

LOBBY
EQUIPES
COUNTDOWN
RODADA
RESPOSTA
RESULTADO
PLACAR
DESEMPATE
VITÓRIA
PÓDIO

quero sentir que estou dentro:

DO MESMO JOGO.

As imagens de referência são a fonte visual principal.


============================================================
73. CRITÉRIO DE EXPERIÊNCIA
============================================================

A pessoa não deve precisar de manual.

Fluxo ideal:

ENTRAR
→ ESCOLHER/SER ALOCADO EM UM TIME
→ JOGAR
→ VER RESULTADO.

O host:

CRIAR
→ CONFIGURAR
→ INICIAR.

Simples.


============================================================
74. SUA MISSÃO
============================================================

Atue simultaneamente como:

GAME DESIGNER
UI/UX DESIGNER
FRONT-END DEVELOPER
BACK-END DEVELOPER
ARQUITETO DE SISTEMA
ESPECIALISTA EM REALTIME
ESPECIALISTA EM PERFORMANCE.

Mas não transforme isso em uma reconstrução desnecessária.

Sua missão é:

PEGAR O QUE JÁ CONSTRUÍMOS

E TRANSFORMAR EM ALGO MUITO MAIOR.


============================================================
75. REGRA FINAL
============================================================

NÃO quero terminar esta atualização pensando:

"Claude substituiu nosso jogo."

Quero pensar:

"É o mesmo projeto que estávamos construindo,
mas agora virou uma verdadeira plataforma de jogos bíblicos."


Portanto:

PRESERVE.
COMPLETE.
APRIMORE.
EXPANDA.
OTIMIZE.

Não destrua para reconstruir.


============================================================
RESULTADO FINAL ESPERADO
============================================================

O módulo Jogos do IASD APP deve evoluir para uma plataforma em que:

- um organizador cria uma sala;
- o código aparece no telão;
- participantes entram pelo celular;
- equipes são formadas;
- vários tipos de jogos bíblicos acontecem;
- celulares funcionam como controles;
- o telão funciona como palco;
- placares são sincronizados;
- rodadas acontecem rapidamente;
- respostas são validadas;
- estatísticas são registradas;
- ranking pessoal evolui;
- equipes competem;
- animações enriquecem a experiência;
- sons criam identidade;
- quedas de conexão são recuperadas;
- e tudo continua rápido.

Quero uma experiência:

BONITA
RÁPIDA
COERENTE
DIVERTIDA
BÍBLICA
COMPETITIVA
ESTÁVEL
RESPONSIVA
ESCALÁVEL.

E principalmente:

SEM DELAY PERCEPTÍVEL CAUSADO PELA EXPANSÃO.

COMECE ANALISANDO O QUE VOCÊ JÁ FEZ.

NÃO RECOMECE O PROJETO.

CONTINUE A PARTIR DO ESTADO ATUAL.

Depois expanda progressivamente.

Quando encontrar algo já implementado e funcional:

PRESERVE.

Quando encontrar algo incompleto:

COMPLETE.

Quando encontrar oportunidade real de melhoria:

APRIMORE.

Quando encontrar espaço para uma nova mecânica que realmente agregue:

CRIE.

E antes de considerar terminado:

TESTE TUDO EM CONJUNTO.

============================================================
ESTADO DA IMPLEMENTAÇÃO (atualizado pelo Claude)
============================================================
Feito (pack "Times", sobre o Jogo Coletivo existente, sem alterar o banco):
- Formato da sala escolhido pelo host: Individual · Time × Time · Cabo de Guerra (3º dígito do código da sala).
- Times Azul × Dourado: jogador escolhe ao entrar; host equilibra ao começar; mapa de times viaja no canal em tempo real
  (e fica salvo em localStorage para reconexão do host).
- Sequência: equipes formadas (VS) → contagem 3-2-1 → rodada (celular e telão).
- Placar de times (barra de disputa ou corda), "Time perfeito" (+300), RODADA DUPLA e BATALHA FINAL (×2, só em times),
  resultado final de equipes com craque da partida.
- Sincronia por timestamp de host, timer local (já existente), single-flight nas consultas, áudio sem backlog.
Pendente / exige SQL ou decisão: pontuação validada 100% no servidor, equipes com 3-4 times, histórico/estatísticas
no perfil, novos tipos de desafio (ordem dos livros, monte a passagem, erro na história, batalha de perguntas/roubo).
