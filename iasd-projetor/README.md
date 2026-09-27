# IASD Projetor — protótipo inicial para Windows

Aplicativo Electron que fica na bandeja do Windows, inicia com o login e abre a apresentação do IASD APP em tela cheia no segundo monitor. O servidor local escuta **apenas 127.0.0.1:38741**, exige origem https://iasd-studio.vercel.app e pareamento com código de seis dígitos. O token vale enquanto o aplicativo estiver aberto; ao reiniciar, é necessário parear novamente.

## Desenvolvimento

Instale Node.js LTS no computador de desenvolvimento e execute:

```powershell
cd iasd-projetor
npm install
npm start
```

Clique com o botão direito no ícone na bandeja do Windows para ver o código de pareamento. Para compilar o instalador: `npm run dist`.

**Estado:** primeira versão de código-fonte, ainda não compilada nem testada em um Windows real. O site precisa ser integrado às rotas locais antes do uso completo. O executável ainda não está disponível para download. A execução automática depende das permissões e das configurações de inicialização do Windows.

**Segurança:** o servidor aceita requisições somente da origem oficial e exige um token aleatório. O pareamento exige acesso físico ao computador. Não exponha a porta na rede nem desative a validação de origem.
