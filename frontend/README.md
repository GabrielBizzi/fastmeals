# FastMeals Dashboard

Painel administrativo do FastMeals: React 18, TypeScript estrito, Vite e MUI 5. As decisões de interface e arquitetura estão em [`../DECISIONS.md`](../DECISIONS.md).

## Executar localmente

Com a API rodando em `http://localhost:3001` (veja [`../backend/README.md`](../backend/README.md)):

```bash
npm install
npm run dev
```

O painel abre em `http://localhost:3000`. O servidor de desenvolvimento encaminha `/api` para a API, então navegador e API ficam na mesma origem e o cookie de sessão funciona sem configuração de CORS. Para usar outra API, defina `VITE_PROXY_TARGET` ao iniciar o `npm run dev`.

Entre com `admin@fastmeals.com` / `Admin@123` (acesso completo) ou `viewer@fastmeals.com` / `Viewer@123` (somente leitura).

## Telas

| Rota | Conteúdo |
| --- | --- |
| `/login` | Entrada com validação de campos e aviso de sessão expirada |
| `/orders` | Pedidos com filtro por status e período, ações conforme o status, detalhe com histórico, criação de pedido. Atualiza sozinho a cada 15 segundos |
| `/dispatch` | Pedidos prontos, entregadores livres, sugestão de atribuição otimizada com aceite ou recusa por pedido (somente admin) |
| `/products` | Cardápio com busca, filtros, ordenação, paginação, disponibilidade direto na tabela, formulário com validação em tempo real e confirmação de exclusão |
| `/delivery-persons` | Entregadores com situação atual, cadastro e edição |
| `/reports` | Receita, pedidos por status, mais vendidos e tempo de entrega, com filtro de período |

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento na porta 3000 |
| `npm run build` | Verificação de tipos e build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | ESLint com regras de hooks e acessibilidade |
| `npm test` | Testes com Vitest, Testing Library e MSW |

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Base da API usada pelo navegador |
| `VITE_ORDERS_POLLING_MS` | `15000` | Intervalo de atualização de pedidos e despacho |
| `VITE_PROXY_TARGET` | `http://localhost:3001` | Destino do proxy do `npm run dev` |

No Docker, o nginx serve o build e encaminha `/api` para o serviço `backend`.
