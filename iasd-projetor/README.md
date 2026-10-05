# IASD Projetor — aplicativo Windows

Aplicativo auxiliar do IASD APP para o painel de Sonoplastia. O programa mantém um serviço local em `127.0.0.1:38741`, mostra uma janela de controle quando aberto normalmente e permanece na bandeja do Windows ao fechar a janela.

## Janela de controle

- Mostra que o aplicativo está aberto, o status do pareamento e o código de seis dígitos apenas quando necessário.
- Oferece botão para abrir o site IASD APP, verificar o segundo monitor e abrir/encerrar a projeção.
- Exibe os créditos **Desenvolvido por Victor Lima** e a versão instalada.
- Ao abrir o programa novamente enquanto ele já está rodando, a janela de controle reaparece, sem duplicar o serviço.
- O programa inicia junto com o Windows e já mostra a janela de controle na tela. Ao fechar (X), ele continua na bandeja do Windows; um duplo clique no ícone abre a janela de novo. Para iniciar sem mostrar a janela, use o argumento `--hidden`.

## Pareamento

Na primeira utilização, abra o IASD APP e vá a Sonoplastia → Conectar IASD Projetor. Digite o código exibido no aplicativo. O token é armazenado no perfil local do Windows para ser reutilizado nas próximas inicializações. Se os dados do aplicativo forem apagados ou o site perder seu token, será necessário parear novamente. Não compartilhe o código com pessoas não autorizadas.

## Biblioteca do Louvor JA (versão 0.5.7)

O Projetor lê, somente leitura, a pasta do Louvor JA e o `database.db` do programa e entrega ao site (Sonoplastia → Hinário). Isso evita o bloqueio do Chrome para pastas de sistema (`Program Files`) e dispensa pedidos de permissão. Ele procura sozinho em `Louvor JA` dentro de `Program Files (x86)`, `Program Files` e `ProgramData`; o site também pode abrir a escolha de pasta/arquivo pelo Projetor. Rotas (todas exigem o pareamento): `GET /lja/state`, `POST /lja/scan`, `POST /lja/pick`, `GET /lja/db`, `GET /lja/file?p=`. Só serve arquivos dentro da pasta escolhida; nada é enviado para a internet.

### Cópia da lista do Hinário (versão 0.5.10)

Depois de ler o banco, o site guarda a lista de hinos também aqui, em `lja-index.json` (pasta de dados do Projetor, uns 3,5 MB). Se o navegador apagar os dados do site, a lista volta sozinha ao abrir o Hinário, sem reler o banco. O site só confere tamanho e data do `database.db`; se mudou, avisa "Atualizar lista" (nunca atualiza sozinho durante a projeção). Vale para qualquer conta: a cópia é do computador, não da conta. O pareamento continua guardado no navegador.

## Instalação e desenvolvimento

No computador de desenvolvimento com Node.js LTS:

```powershell
cd iasd-projetor
npm install
npm start
```

Para gerar um instalador Windows NSIS: `npm run dist`. O instalador oferece a opção de executar o aplicativo após a instalação. O executável distribuído precisa ser recompilado para incluir as atualizações do código; instalações antigas não se atualizam automaticamente.

**Estado:** código-fonte atualizado. A compilação do instalador e o teste em um Windows real devem ser confirmados antes da distribuição.

## Segurança

O servidor local só aceita requisições da origem oficial `https://iasd-studio.vercel.app` e exige autenticação para comandar a projeção. Não exponha a porta à rede nem desative a verificação de origem.

## Créditos

**Desenvolvido por Victor Lima · IASD APP**.
# Detecção de saídas de vídeo

A seleção fica centralizada em `display-manager.js`. No Windows, o helper
`windows-topology.ps1` consulta `QueryDisplayConfig(QDC_ONLY_ACTIVE_PATHS)` e
`DisplayConfigGetDeviceInfo`: targets que compartilham adaptador/source formam
um grupo clonado. Coordenadas são utilizadas somente para associar o source
nativo ao display lógico do Electron, após conversão de pixels físicos para DIP.
Nenhuma configuração de monitor do Windows é alterada.

O modo automático mantém a saída atual, prioriza grupos clonados e saídas
externas, com desempate estável. Não existe identificação infalível de uma TV
pela conexão HDMI; em instalações ambíguas use a seleção manual em Monitores
ou no menu do ícone perto do relógio (também disponível com painel remoto).
A escolha é salva em `projection-output.json`, dentro do userData, usando
device paths quando disponíveis. Se a escolha sumir, é usada uma saída disponível;
sem saída elegível a janela fica oculta, mantendo o renderer e conteúdo preparados.
Uma reconexão restaura a mesma janela. O grupo que inclui o principal também
pode ser projetado: todas as telas desse grupo necessariamente exibem o mesmo conteúdo.

Eventos de display são agrupados por 500 ms; não há polling de topologia.
O helper executa sem janela, com timeout e até três tentativas para mudança de
topologia durante a consulta. O build extrai esse arquivo de app.asar para que
o PowerShell possa lê-lo. Se políticas corporativas bloquearem PowerShell ou as
APIs nativas, o diagnóstico informa a falha e utiliza as saídas lógicas do Electron;
nessa condição a identificação de targets clonados fica indisponível.

Diagnóstico: `projection-diagnostics.log` no userData, com rotação em 1 MiB.
Registra saídas, targets, bounds, DPI, seleção, carregamento e falhas do renderer.
Os IDs e caminhos de dispositivo são dados locais: revise antes de compartilhar.

Validação: `node --test tests/display-manager.test.cjs tests/audio-fade.test.mjs
tests/validate.test.mjs` na pasta `iasd-studio`, `node scripts/validate.mjs`, e
`npm run dist` na pasta do Projetor. Este pacote JavaScript não possui configuração
de TypeScript nem tarefa de lint; a verificação de sintaxe usa `node --check`.
Clones, DPI e hotplug têm cenários simulados; a consulta nativa e o seletor são
verificados também no Windows/Electron. Bíblia, YouTube, Sorteador/Cronômetro e
clones físicos precisam de uma verificação final com as TVs da instalação.
