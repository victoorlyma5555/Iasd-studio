# Pesquisa do YouTube no Studio de Projeção

A busca de **Músicas ambientes**, **Músicas especiais** e **Provai e Vede** usa a função `api/youtube-search.js`
(Vercel) e a **YouTube Data API v3**. Ela precisa de uma chave, que só o dono do projeto pode criar:

1. Acesse https://console.cloud.google.com e crie (ou escolha) um projeto.
2. Em **APIs e serviços → Biblioteca**, procure **YouTube Data API v3** e clique em **Ativar**.
3. Em **APIs e serviços → Credenciais → Criar credenciais → Chave de API**. Copie a chave.
   (Recomendado: em "Restrições de API", limite a chave à *YouTube Data API v3*.)
4. No Vercel: projeto **iasd-studio → Settings → Environment Variables** → nome `YOUTUBE_API_KEY`, valor = a chave,
   ambientes *Production* (e *Preview*, se quiser). Salve.
5. **Redeploy** do último deployment (Deployments → ⋯ → Redeploy) para a variável valer.

Cota gratuita: 10.000 unidades por dia. Cada pesquisa gasta ~101 unidades (busca + duração), ou seja,
cerca de 99 pesquisas por dia. Os resultados ficam em cache por 5 minutos.

Sem a chave, o Studio mostra: “A pesquisa do YouTube precisa da chave da API (YOUTUBE_API_KEY) no Vercel”.
