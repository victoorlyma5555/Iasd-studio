# Arquitetura modular do IASD APP

Esta branch reorganiza o projeto de forma incremental, sem reescrever o produto e sem alterar os protocolos do IASD Projetor.

## Regra de dependência

- `core/`: infraestrutura global (roteamento, sessão e contratos).
- `services/`: acesso a serviços externos, como Supabase e o aplicativo IASD Projetor.
- `shared/`: componentes e utilitários reutilizáveis.
- `modules/`: cada recurso funcional isolado.
- módulos podem depender de `core`, `services` e `shared`; um módulo não deve acessar internamente outro módulo.
- Sonoplastia/Projeção permanece congelada até as áreas de menor risco estarem separadas e testadas.

## Rotas públicas

| Área | URL |
|---|---|
| Início | / |
| Bíblia | /biblia |
| Cronogramas | /cronogramas |
| Escalas | /escalas |
| Jograis / Palavra em Cena | /jograis |
| Lição Sabática | /licao-sabatica |
| Jogos | /jogos |
| Sonoplastia | /sonoplastia |
| Perfil | /perfil |
| Administração | /admin |

O roteador em `core/router.js` mantém compatibilidade com o renderizador legado enquanto os módulos são extraídos um a um.
