# DECISIONS

Este documento registra as decisões técnicas do FastMeals e o motivo de cada uma. Ele segue a ordem pedida no enunciado: decisões arquiteturais, abordagem do algoritmo de otimização, justificativa das bibliotecas e dificuldades encontradas. Todos os números citados (testes, tempos de resposta, tamanho de bundle) vêm de execuções reais, com os comandos indicados em cada seção.

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Mapa dos requisitos](#2-mapa-dos-requisitos)
3. [Decisões arquiteturais (ADRs)](#3-decisões-arquiteturais-adrs)
4. [Algoritmo de otimização de atribuição](#4-algoritmo-de-otimização-de-atribuição)
5. [Bibliotecas escolhidas](#5-bibliotecas-escolhidas)
6. [Testes](#6-testes)
7. [Desempenho](#7-desempenho)
8. [Dificuldades encontradas e como foram resolvidas](#8-dificuldades-encontradas-e-como-foram-resolvidas)
9. [Limitações e próximos passos](#9-limitações-e-próximos-passos)

---

## 1. Visão geral

O FastMeals é composto por uma API REST (Node.js, Express 5, TypeScript, Prisma, PostgreSQL) e um painel administrativo (React 18, TypeScript, Vite, MUI 5). Todo o código, inclusive scripts, seeds e arquivos de configuração do ESLint, está em TypeScript com `strict: true` e sem `any`.

```
                       ┌──────────────────────────┐
   Navegador ─────────>│ frontend (nginx :3000)   │  build estático do React
                       │   /api/* ──┐             │
                       └────────────┼─────────────┘
                                    │ proxy reverso (mesma origem, cookie httpOnly)
                       ┌────────────▼─────────────┐
                       │ backend (Express :3001)  │  validação, regras, algoritmo
                       └────────────┬─────────────┘
                                    │ Prisma
                       ┌────────────▼─────────────┐
                       │ PostgreSQL 16            │  constraints, índices, trigger
                       └──────────────────────────┘
```

Como executar: `docker compose up --build` na raiz. Instruções completas, inclusive sem Docker, em [`backend/README.md`](backend/README.md) e [`frontend/README.md`](frontend/README.md).

## 2. Mapa dos requisitos

| Requisito do enunciado | Onde está implementado |
| --- | --- |
| JWT com access de 15 min e refresh de 7 dias | `backend/src/modules/auth/token.service.ts`, `auth.service.ts` |
| bcrypt com no mínimo 10 rounds | `auth.service.ts` (12 rounds) |
| 401 para token inválido ou expirado, 403 para perfil insuficiente | `backend/src/middlewares/authenticate.ts` |
| Rate limit de 100 req/min por IP | `backend/src/middlewares/rateLimiter.ts` |
| CRUD de produtos com paginação, busca e filtros | `backend/src/modules/products/` |
| Produto indisponível fora da listagem pública | `GET /api/menu` (ADR 05) |
| Máquina de estados do pedido com 422 | `backend/src/modules/orders/orderStatus.ts` |
| `totalAmount` calculado no backend | `orders.service.ts` (`createOrder`) |
| Entregadores | `backend/src/modules/deliveryPersons/` |
| Quatro métricas com filtro de período | `backend/src/modules/reports/` |
| Algoritmo de atribuição com Haversine | `backend/src/algorithms/` (seção 4) |
| Validação de body, query e params | Schemas Zod em cada módulo (`*.schemas.ts`) |
| Formato padronizado de erro | `backend/src/middlewares/errorHandler.ts` |
| Telas de login, pedidos, produtos, relatórios e atribuição | `frontend/src/screens/` |
| Atualização dos pedidos | Polling (ADR 07) |
| Testes de backend (mínimo 10) e frontend (mínimo 5) | 96 e 28 testes (seção 6) |
| Seed a partir de `seed/data.json` via `npm run seed` | `backend/prisma/seed.ts` |
| Docker Compose com backend, frontend e banco | `docker-compose.yml` |

---

## 3. Decisões arquiteturais (ADRs)

Cada decisão segue o formato: contexto, decisão, alternativas consideradas e consequências.

### ADR 01. Organização do repositório

**Contexto.** O enunciado sugere pastas por tipo (`routes/`, `controllers/`, `services/`, `pages/`, `types/`) e permite outra organização, desde que justificada.

**Decisão.**

Backend organizado **por domínio**, com as camadas dentro de cada módulo:

```
backend/src/
├── algorithms/        funções puras: haversine, hungarian, planejador de atribuição
├── config/            variáveis de ambiente validadas com Zod
├── errors/            AppError e tabela código de erro → status HTTP
├── lib/               Prisma Client e logger
├── middlewares/       authenticate, authorize, rate limit, errorHandler
├── modules/
│   ├── auth/          routes, controller, service, schemas, token.service
│   ├── products/      routes, controller, service, schemas, mapper
│   ├── orders/        routes, controller, service, schemas, mapper, orderStatus
│   ├── deliveryPersons/
│   ├── reports/
│   └── health/
└── utils/             paginação, validadores, fuso horário, valores monetários
```

Frontend organizado **por tela**, com hooks e componentes exclusivos ao lado da tela:

```
frontend/src/
├── components/        componentes compartilhados (index.tsx + styles.ts)
├── context/           AuthProvider
├── hooks/             useRemoteData, useNotifier, useDebouncedValue
├── layout/            tema MUI e estrutura com navegação
├── routes/            caminhos e guards de autenticação e perfil
├── screens/
│   └── Orders/        index.tsx, styles.ts, types.ts, _hooks/, _components/
├── services/          cliente HTTP e contratos da API validados com Zod
├── stores/            sessão (Zustand, somente em memória)
├── styles/            tokens de design e estilos globais
└── utils/             formatadores, máscaras, rótulos de domínio
```

Responsabilidade de cada camada no backend:

| Camada | Faz | Não faz |
| --- | --- | --- |
| Route | Declara caminho, autenticação e perfil exigido | Lógica |
| Controller | `schema.parse(req.*)`, chama o service, escolhe o status HTTP | Acesso a dados |
| Service | Regras de negócio, transações, lança `AppError` | Conhecer `req`/`res` |
| Mapper | Converte `Prisma.Decimal` em `number` e datas em ISO | Regras |
| Algorithms | Cálculo puro, sem Prisma nem Express | I/O |

**Alternativas consideradas.** A estrutura por tipo do enunciado. Com cinco domínios, cada alteração de funcionalidade tocaria cinco pastas diferentes; agrupando por domínio, os arquivos que mudam juntos ficam juntos. Uma camada de repository também foi avaliada e descartada: o Prisma já é a abstração de acesso a dados, e um repository por entidade apenas repassaria chamadas.

**Consequências.**

- `pages/` virou `screens/`, porque cada pasta contém a tela e os hooks e componentes que só ela usa.
- `types/` foi absorvido pelos `services/`: os tipos são inferidos dos schemas Zod que validam as respostas, então tipo e validação não podem divergir.
- No frontend os testes ficam ao lado do código testado (`index.test.tsx`); no backend ficam em `tests/`, separados em `integration/` e `unit/`.
- Express 5 propaga rejeições de handlers `async` para o error handler, então os controllers não precisam de `try/catch`.

### ADR 02. PostgreSQL com Prisma

**Contexto.** O enunciado exige banco relacional (ou MongoDB) e permite ORM à escolha.

**Decisão.** PostgreSQL 16 com Prisma 6. As agregações de relatório usam `$queryRaw` com template tags.

**Alternativas consideradas.**

| Opção | Por que não |
| --- | --- |
| TypeORM | Tipagem de relações menos precisa; decorators acoplam entidade e persistência |
| Drizzle | Boa tipagem, mas migrations e relações exigiriam mais código para o mesmo resultado |
| Knex ou SQL puro | Sem tipos gerados; cada consulta exigiria tipagem manual |

**Consequências.**

- O tipo `Prisma.OrderGetPayload<{ include }>` usado nos mappers vem do schema, sem conversões manuais.
- `$queryRaw` com template tag parametriza todos os valores, sem concatenação de SQL. Não há `$queryRawUnsafe` no projeto.
- Constraints que o Prisma não modela (CHECK, índice parcial, trigger) foram escritas no SQL da migration (ADR 03).

### ADR 03. Modelagem do banco

**Contexto.** `docs/database-schema.md` é uma referência e permite adicionar campos e tabelas com justificativa.

**Decisão.** Manter o esquema de referência e acrescentar o necessário para as regras do enunciado.

```
users ──1:N── refresh_tokens
  │
  └──1:N── order_status_history ──N:1── orders ──N:1── delivery_persons
                                          │
                                          └──1:N── order_items ──N:1── products
```

| Mudança em relação à referência | Justificativa |
| --- | --- |
| Tabela `order_status_history` (`from_status`, `to_status`, `changed_by_id`, `changed_at`) | O tempo médio de entrega precisa do instante da transição para `delivered`. Uma coluna `delivered_at` resolveria só esse caso; o histórico também alimenta a linha do tempo no detalhe do pedido e registra quem fez cada mudança |
| Tabela `refresh_tokens` | Rotação, revogação no logout e detecção de reuso (ADR 04) |
| `deleted_at` em `products` e `delivery_persons` (soft delete) | O enunciado permite excluir um produto ligado apenas a pedidos entregues, mas `order_items.product_id` referencia o produto. Com exclusão física, ou a chave estrangeira bloquearia a operação, ou o histórico e o ranking de mais vendidos perderiam o produto. O mesmo vale para entregadores e o tempo de entrega por veículo |
| `updated_at` em `delivery_persons` | Consistência com as demais tabelas mutáveis |
| Enums nativos do PostgreSQL em vez de `VARCHAR` com `CHECK` | Mesma integridade, com tipo explícito no banco e no client gerado |
| `UNIQUE (order_id, product_id)` em `order_items` | Itens repetidos no payload são somados antes de gravar; a constraint garante isso no banco |

**Integridade no banco**, além das validações da API:

- `CHECK` para preço positivo, tempo de preparo entre 1 e 120, tamanho de nome e descrição, faixas de latitude e longitude, quantidade e preço unitário positivos, coordenadas do entregador preenchidas em par.
- `CHECK (status NOT IN ('delivering', 'delivered') OR delivery_person_id IS NOT NULL)`: não existe entrega sem entregador, nem por escrita direta no banco.
- **Índice único parcial** `orders(delivery_person_id) WHERE status = 'delivering'`: o banco garante que um entregador tem no máximo uma entrega em andamento. O service verifica antes para dar uma mensagem clara; o índice fecha a condição de corrida entre requisições simultâneas, o que é coberto por um teste que dispara duas transições em paralelo.
- **Trigger `set_updated_at`** em `users`, `products`, `delivery_persons` e `orders`, para que `updated_at` esteja correto também em escritas feitas fora do ORM.

**Índices.** Todos os do esquema de referência, incluindo o composto `orders(status, created_at)` para relatórios, mais:

| Índice | Consulta atendida |
| --- | --- |
| GIN com `pg_trgm` em `products.name` | Busca por nome com `ILIKE '%termo%'`, que um índice B-tree não atende |
| `order_status_history(to_status, changed_at)` | Tempo médio de entrega |
| Parcial de produtos não excluídos por `created_at` | Listagem padrão do cardápio |

**Migrations.** Uma migration inicial gerada pelo Prisma e complementada com as constraints, índices parciais e triggers acima. `prisma migrate diff` entre o banco migrado e o schema retorna migração vazia, ou seja, os dois estão alinhados. O Docker e o `npm run seed` aplicam as migrations com `prisma migrate deploy`.

**Valores monetários.** `DECIMAL(10,2)` no banco e `Prisma.Decimal` nos cálculos (`totalAmount` é somado com `plus` e `times`). A conversão para `number` acontece apenas no mapper de saída. O `unit_price` de cada item é gravado no momento da criação do pedido, então mudanças de preço posteriores não alteram pedidos existentes (coberto por teste).

### ADR 04. Autenticação e autorização

**Contexto.** O enunciado pede JWT com access token de 15 minutos e refresh token de 7 dias, e considera grave guardar tokens no frontend sem httpOnly.

**Decisão.**

| Item | Implementação |
| --- | --- |
| Senha | bcrypt com 12 rounds. Quando o e-mail não existe, o login compara a senha contra um hash fixo, para que o tempo de resposta não revele quais e-mails estão cadastrados |
| Access token | JWT HS256, 15 minutos, payload `{ sub, role, type: 'access' }`. O payload é validado com Zod, então um refresh token não é aceito como access token |
| Refresh token | JWT HS256 com segredo próprio, 7 dias, `jti` registrado em `refresh_tokens`. Cada uso rotaciona o token e revoga o anterior. Se um token já revogado for apresentado, todos os tokens ativos do usuário são revogados (detecção de reuso). `POST /api/auth/logout` revoga o token atual |
| Transporte | O login grava o refresh token em cookie `httpOnly`, `SameSite=Strict`, `Path=/api/auth` e `Secure` em produção. O access token fica apenas na memória do navegador. Ao recarregar a página, a sessão é restaurada chamando `/auth/refresh` com o cookie |
| Erros | `INVALID_TOKEN` e `TOKEN_EXPIRED` (401), `FORBIDDEN` (403), `INVALID_CREDENTIALS` e `INVALID_REFRESH_TOKEN` (401) |
| Perfis | `authorize('admin')` nas rotas de escrita. `viewer` lê pedidos, produtos, entregadores e relatórios. A interface esconde ações de escrita para `viewer`, mas a garantia é do backend |
| Rate limit | 100 requisições por minuto por IP em todas as rotas `/api`, exceto `/api/health`, com resposta `429 RATE_LIMIT_EXCEEDED` no formato padrão. Atrás do nginx, `TRUST_PROXY=true` faz o limite usar o IP real do cliente |

**Compatibilidade com o contrato.** O contrato devolve `refreshToken` no corpo do login e do refresh. Para não expor esse token ao JavaScript da página, vale a regra "o token volta pelo canal em que chegou":

- O login devolve o corpo do contrato e também grava o cookie. O frontend descarta o token do corpo.
- `/auth/refresh` com o token no corpo responde `{ accessToken, refreshToken }`, como no contrato, para clientes de API.
- `/auth/refresh` com o token no cookie responde só `{ accessToken }` e grava o novo refresh token no cookie. Sem essa regra, um script injetado na página poderia chamar `/auth/refresh` e ler na resposta um token válido por 7 dias.

**CSRF.** O cookie é `SameSite=Strict` e só é enviado para `/api/auth`. As rotas de negócio exigem o header `Authorization`, que um site externo não consegue enviar.

**Renovação no frontend.** O interceptor do Axios renova o access token quando recebe `TOKEN_EXPIRED` ou `INVALID_TOKEN`, usando uma única promise compartilhada (várias requisições expiradas ao mesmo tempo geram uma só chamada de refresh), e refaz a requisição original. Se a renovação falhar, a sessão é encerrada e o usuário volta ao login com a mensagem "Sua sessão expirou. Entre novamente para continuar."

**Alternativas consideradas.** Sessão no servidor com cookie de sessão simples: mais simples, mas o enunciado pede JWT. Access token em `localStorage`: descartado por ficar exposto a qualquer script da página.

### ADR 05. Contrato da API, validação e erros

**Contexto.** O enunciado pede validação de toda entrada, um formato único de erro e códigos HTTP semânticos.

**Decisão.**

- Cada módulo tem um arquivo `*.schemas.ts` com schemas Zod para body, query e params. Os controllers chamam `schema.parse`, e as mensagens de cada regra viram `details: [{ field, message }]`.
- Um único error handler converte `AppError` na resposta padrão, `ZodError` em `400 VALIDATION_ERROR`, JSON malformado em `400`, e qualquer outra exceção em `500 INTERNAL_ERROR` com mensagem genérica, registrando o erro no log com o id da requisição. Stack traces e erros do banco nunca aparecem na resposta.
- O mapeamento de código para status HTTP vive em um objeto (`errors/errorCodes.ts`), e o tipo `ErrorCode` é derivado dele, então não é possível lançar um código sem status definido.
- As variáveis de ambiente também são validadas com Zod na inicialização: a API não sobe com segredo JWT curto ou `DATABASE_URL` inválida.

**Adições ao contrato de `docs/api-spec.md`**, todas compatíveis (nada foi removido nem renomeado):

| Adição | Motivo |
| --- | --- |
| `availableTransitions` em cada pedido | A tela mostra só as ações válidas sem duplicar a máquina de estados no frontend (ADR 06) |
| `deliveryPersonId` no pedido e `statusHistory` em `GET /orders/:id` | Exibir o entregador e a linha do tempo no detalhe |
| `startDate` e `endDate` em `GET /orders` | O painel de pedidos exige filtro por data |
| Período opcional em `GET /reports/orders-by-status` | Todos os relatórios respeitam o mesmo filtro de período |
| `GET /api/menu`, público | Atende "produto indisponível não aparece nas listagens públicas, mas continua visível no painel": `/products` é autenticado e mostra tudo, `/menu` mostra só `isAvailable = true` |
| `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/delivery-persons/:id`, `GET /api/health` | Restaurar sessão, revogar token, editar entregador, health check |
| `ORDER_NOT_ASSIGNABLE` (422), `DELIVERY_PERSON_IN_USE` (409), `NOT_FOUND` (404) | Atribuir entregador a pedido finalizado; remover ou desativar entregador em entrega (análogo a `PRODUCT_IN_USE`); rota inexistente |

**Interpretações documentadas.**

- `PUT /products/:id` aceita atualização parcial, como indica a especificação ("todos os campos que serão atualizados"). É o que o toggle de disponibilidade usa.
- `PATCH /orders/:id/assign` aceita pedidos `pending`, `preparing` e `ready`.
- Os relatórios filtram pela data de criação do pedido, coerente com o índice `orders(status, created_at)` do esquema de referência.
- O `reason` dos pedidos sem entregador mantém o texto do contrato (`No available delivery person`); a interface o traduz.
- As mensagens de erro da API estão em português com acentuação.

### ADR 06. Máquina de estados do pedido

**Contexto.** O enunciado lista as transições válidas e exige 422 para qualquer outra.

**Decisão.** As transições ficam em um único lugar, `orders/orderStatus.ts`:

| De | Para | Condição |
| --- | --- | --- |
| `pending` | `preparing`, `cancelled` | |
| `preparing` | `ready`, `cancelled` | |
| `ready` | `delivering`, `cancelled` | `delivering` exige entregador atribuído |
| `delivering` | `delivered` | |
| `delivered`, `cancelled` | nenhum | Estados finais |

- `checkTransition` devolve uma união discriminada (`{ allowed: true }` ou `{ allowed: false, reason }`), e o service escolhe a mensagem de 422 a partir do motivo.
- `getAvailableTransitions` usa a mesma tabela para preencher `availableTransitions` na resposta. O frontend apenas exibe os botões que a API devolve, então a regra não existe duplicada.
- A mudança de status roda em transação com `SELECT ... FOR UPDATE` no pedido. Na transição para `delivering`, o entregador é revalidado (ativo e sem outra entrega), e o índice único parcial do ADR 03 é a última garantia.
- Cada transição grava uma linha em `order_status_history` com o usuário que a fez.

**Alternativa considerada.** Uma biblioteca de máquina de estados (XState, por exemplo). Para seis estados e sete transições, uma tabela tipada é mais legível e não traz dependência.

### ADR 07. Atualização dos pedidos por polling

**Contexto.** O enunciado aceita polling de 30 segundos, e WebSocket é diferencial.

**Decisão.** Polling a cada 15 segundos (configurável em `VITE_ORDERS_POLLING_MS`) no painel de pedidos e na tela de atribuição, pelo hook `useRemoteData`:

- A recarga em segundo plano atualiza a lista no lugar, sem skeleton, e mostra o horário da última atualização.
- Requisições anteriores são canceladas com `AbortController` quando outra começa ou o filtro muda.
- O polling pausa com a aba oculta e recarrega assim que ela volta a ficar visível.
- Se uma recarga falhar, a lista anterior continua na tela, com um aviso de que pode estar desatualizada.
- Depois de qualquer ação do operador (mudar status, criar pedido, aceitar atribuição), a lista é recarregada na hora.

**Alternativas consideradas.** WebSocket ou Server-Sent Events dariam atualização instantânea, mas exigem um canal autenticado à parte (o `EventSource` não envia o header `Authorization`), reconexão e, com mais de uma instância da API, um barramento como Redis pub/sub.

**Consequências.** Uma mudança feita por outro operador aparece em até 15 segundos; as ações do próprio operador aparecem na hora. O custo é baixo: cada ciclo do painel faz uma listagem paginada e uma contagem por status, medidas abaixo de 15 ms com 10.000 pedidos (seção 7).

### ADR 08. Arquitetura do frontend

**Contexto.** O painel precisa de autenticação, cinco telas operacionais, formulários com validação em tempo real e tratamento consistente de carregamento, erro e estado vazio.

**Decisão.**

| Assunto | Decisão |
| --- | --- |
| Build e rotas | Vite com React Router. Um painel autenticado não se beneficia de renderização no servidor |
| Dados do servidor | Hook `useRemoteData(fetcher, key, { pollIntervalMs, enabled })`, que devolve um estado discriminado (`loading`, `success`, `error`) com `reload`, `isRefreshing` e `lastUpdatedAt` |
| Sessão | Zustand sem persistência, para que o interceptor do Axios leia o token fora da árvore React. O `AuthProvider` expõe `signIn`, `signOut` e `isAdmin` |
| Contratos | Cada service valida a resposta com Zod e exporta os tipos inferidos |
| Formulários | React Hook Form com Zod em modo `onChange`. Os campos guardam texto e uma função explícita (`toProductInput`, `toCreateOrderInput`) converte para o payload, aceitando vírgula decimal. Erros de campo vindos da API são aplicados ao campo correspondente |
| Mensagens | `services/errors.ts` traduz cada código de erro da API para uma mensagem ao operador. Erros de rede, de parsing ou desconhecidos usam uma mensagem genérica definida pela tela ("Não foi possível carregar os pedidos. Tente novamente."). Nenhuma mensagem técnica é exibida |
| Telas | Cada tela tem um hook que concentra estado, chamadas e ações (`useOrdersPanel`, `useProductsCatalog`, `useDispatchBoard`), e o `index.tsx` só compõe componentes |
| Divisão de código | Telas carregadas sob demanda com `React.lazy`, e React e MUI em chunks próprios. O bundle inicial de 904 kB em arquivo único passou a ter como maior chunk 303 kB (MUI), e o chart.js só é baixado na tela de relatórios |

**Alternativas consideradas.**

- **TanStack Query:** resolve cache e polling, mas a necessidade real (carregar, cancelar, recarregar e fazer polling) cabe em um hook de cerca de 80 linhas, sem cache global para invalidar.
- **Redux:** excessivo para um único estado global (a sessão).
- **Compartilhar tipos com o backend em um pacote comum:** exigiria um workspace e acoplaria o build das duas aplicações. A validação com Zod em tempo de execução detecta divergências de contrato.

### ADR 09. Interface e customização do MUI

**Contexto.** O enunciado permite MUI, desde que a customização vá além dos componentes padrão.

**Decisão.** O MUI é a base de acessibilidade e comportamento; a identidade visual vem de tokens centralizados em `styles/tokens.ts` e de overrides em `layout/theme.tsx`.

| Token | Valor | Uso |
| --- | --- | --- |
| Asphalt | `#1B2430` | Navegação, texto principal, tooltips, notificações |
| Basil | `#1E6B52` | Cor primária das ações |
| Plate | `#F4F6F5` | Fundo da aplicação |
| Line | `#DCE2DF` | Bordas e divisórias |
| Route | `#2F5D8C` | Séries de dados e linhas de rota |

- Cada status de pedido tem cor **e** ícone próprios (cinza, violeta, ciano, azul, verde, vermelho), então a informação não depende só da cor.
- Cada linha de pedido mostra o ciclo de vida em uma barra de cinco etapas (`StatusProgress`), com descrição acessível ("Etapa 3 de 5: Pronto").
- Tipografia IBM Plex Sans, embarcada no bundle, com algarismos tabulares para alinhar valores, horários e distâncias nas tabelas.
- Overrides do tema: paleta, escala tipográfica, raios por hierarquia (4, 6 e 10 px), botões sem caixa alta e sem ripple, anel de foco próprio, inputs com borda e foco visíveis, cabeçalho de tabela, switch, diálogos, tooltips, toggle buttons, skeleton e notificações do notistack.
- Seletores de data do MUI X com calendário em português e digitação no formato DD/MM/AAAA, encapsulados em `components/Form/DatePicker`, que entrega a data como `YYYY-MM-DD` (formato da API) e só propaga valores válidos.
- Acessibilidade: foco visível em todos os elementos interativos, `aria-label` em botões de ícone, `aria-pressed` no filtro de status, `aria-busy` em tabelas carregando, gráficos com `role="img"` e descrição textual, diálogos com `aria-labelledby`, respeito a `prefers-reduced-motion`, ESLint com `jsx-a11y`.
- Responsividade: a navegação lateral vira menu em gaveta abaixo de 900 px; filtros quebram em linhas; tabelas largas rolam dentro do próprio contêiner, sem rolagem horizontal da página. Validado em 1440 × 900 e 390 × 844.
- A tela de atribuição tem um mapa esquemático em SVG que projeta pedidos e entregadores em um plano e liga os pares sugeridos, para o operador conferir a sugestão sem depender de um serviço de mapas.

### ADR 10. Datas e fuso horário

**Contexto.** Os filtros recebem datas `YYYY-MM-DD`, e os timestamps são `TIMESTAMPTZ`. Interpretando as datas em UTC, um pedido feito às 22h em São Paulo cairia no dia seguinte.

**Decisão.** Filtros de período e agrupamentos diários usam o fuso da operação, configurável em `BUSINESS_TIMEZONE` (padrão `America/Sao_Paulo`). A conversão de data para instante fica em `utils/timeZone.ts`, e o SQL de receita diária agrupa com `AT TIME ZONE`.

**Consequências.** "Pedidos de 11/01" significa 11/01 no horário de São Paulo. Há teste de integração para a virada de dia.

---

## 4. Algoritmo de otimização de atribuição

### Problema

Dados `n` pedidos prontos sem entregador e `m` entregadores livres, escolher pares, com cada entregador recebendo no máximo um pedido, que minimizem a soma das distâncias. É o **problema de atribuição retangular** sobre uma matriz de custos `n × m`, em que `custo[i][j]` é a distância Haversine do entregador `j` até o pedido `i`.

### Abordagem: algoritmo húngaro com potenciais

Implementação em `backend/src/algorithms/hungarian.ts`, na formulação O(n²·m) que insere uma linha por vez e procura caminhos aumentantes de menor custo reduzido:

1. Mantêm-se potenciais `u` (linhas) e `v` (colunas) tais que `custo[i][j] − u[i] − v[j] ≥ 0`, com igualdade nas arestas do emparelhamento atual.
2. Para inserir uma nova linha, procura-se o caminho aumentante de menor custo reduzido, atualizando a folga mínima de cada coluna e ajustando os potenciais pelo menor delta encontrado.
3. Ao alcançar uma coluna livre, o caminho é invertido e o emparelhamento cresce em um par.

O resultado é sempre **ótimo**, não uma aproximação.

**Matriz retangular.** A rotina interna exige `linhas ≤ colunas`. Quando há mais pedidos que entregadores, a matriz é transposta (entregadores viram linhas): o algoritmo escolhe quais pedidos atender, e os demais saem em `unassigned` com o motivo `No available delivery person`. Quando há mais entregadores, os excedentes ficam sem atribuição. Não é preciso preencher a matriz com valores artificiais.

**Haversine.** Implementação em `algorithms/haversine.ts`, com `R = 6371 km` e conversão de graus para radianos, conforme `docs/evaluation-criteria.md`. Verificada contra distâncias conhecidas: São Paulo ao Rio de Janeiro (360,75 km), 1° de longitude no equador (111,19 km), travessia do antimeridiano e polo a polo.

### Fluxo do endpoint

```
POST /api/orders/optimize-assignment
  │
  ├─ busca pedidos ready sem entregador          (ordenados por created_at, id)
  ├─ busca entregadores elegíveis                (ordenados por name, id)
  ├─ monta a matriz de distâncias Haversine      O(n·m)
  ├─ resolve a atribuição (húngaro)              O(k²·K)
  └─ devolve assignments, unassigned, totalDistanceKm, algorithm, executionTimeMs
```

**Elegibilidade.**

- Pedidos: `status = ready` e sem entregador atribuído.
- Entregadores: ativos, não excluídos, com coordenadas e sem pedido `ready` ou `delivering` atribuído. Considerar também `ready` evita sugerir quem já está reservado para um pedido que ainda não saiu.
- As entradas ordenadas tornam o resultado reproduzível quando há empates.
- `executionTimeMs` mede só o algoritmo, para acompanhar seu custo separado das consultas ao banco.

**Aceite na interface.** O endpoint só calcula a sugestão. Ao aceitar um par, o frontend chama `PATCH /orders/:id/assign` e depois `PATCH /orders/:id/status` com `delivering`, que revalida o entregador dentro de uma transação.

### Complexidade

Com `k = min(n, m)` e `K = max(n, m)`:

| Etapa | Tempo | Memória |
| --- | --- | --- |
| Matriz de distâncias | O(n·m) | O(n·m) |
| Algoritmo húngaro | O(k²·K) | O(K) além da matriz |
| Caso do enunciado (50 pedidos, 30 entregadores) | 30² × 50 = 45.000 passos | 1.500 distâncias |

Medido sobre um banco com 10.000 pedidos, 50 prontos e 30 entregadores livres: o algoritmo levou **0,2 ms** e o endpoint completo (consultas, algoritmo e serialização) teve **p95 de 7,4 ms**, contra o limite de 2 segundos.

### Alternativas consideradas

| Alternativa | Complexidade | Por que não |
| --- | --- | --- |
| Força bruta | O(n!) | Proibida pelo enunciado acima de 6 elementos; 30! permutações é impraticável |
| Guloso (menor par global ou vizinho mais próximo) | O(n·m·log(n·m)) | Simples, mas não é ótimo. Na matriz `[[1, 2], [2, 100]]` ele escolhe o par de custo 1 e fica obrigado ao de custo 100 (total 101), enquanto o ótimo é 4. Esse caso está nos testes |
| Fluxo de custo mínimo | Polinomial, com constantes maiores | Também ótimo, porém com mais código para um grafo bipartido completo |
| Leilão (Bertsekas) | Depende do epsilon | Vantajoso em paralelismo e matrizes esparsas, sem ganho para 50 × 30 |

### Casos de borda e validação

Testes unitários:

- Comparação com força bruta em 125 matrizes aleatórias (3×3, 4×6, 6×4, 7×7 e 5×8, 25 amostras cada, com gerador de semente fixa).
- Cada entregador usado no máximo uma vez.
- Matrizes vazias e sem colunas.
- Empates com resultado determinístico.
- Rejeição de valores não finitos e de matrizes irregulares.
- O caso em que o guloso falha.
- 50 × 30 aleatório abaixo de 100 ms e com custo menor ou igual ao do guloso.

Testes de integração do endpoint: caso com solução, nenhum entregador disponível (ocupado, inativo ou sem coordenadas), nenhum pedido pronto, mais pedidos que entregadores e acesso negado a `viewer`.

### Trade-offs assumidos

- **Distância em linha reta**, não por ruas. É o que o enunciado pede, e funciona como estimativa.
- **Só a distância total é minimizada.** Com mais pedidos que entregadores, um pedido distante pode ficar repetidamente sem entregador. Uma evolução seria somar ao custo um peso pelo tempo de espera do pedido; não foi feito para manter a função objetivo do enunciado.
- **A sugestão não reserva entregadores.** Se outro operador usar o mesmo entregador entre o cálculo e o aceite, a API responde 422 e a tela informa o operador.

---

## 5. Bibliotecas escolhidas

### Backend

| Biblioteca | Justificativa |
| --- | --- |
| Express 5 | Opção listada no enunciado. A versão 5 propaga erros de handlers `async` ao error handler, sem wrappers em cada rota |
| Prisma 6 | Tipos gerados a partir do schema, migrations versionadas e `$queryRaw` parametrizado para as agregações (ADR 02) |
| Zod | Valida body, query, params e variáveis de ambiente, e infere os tipos; as mensagens de cada regra viram `details` no erro padrão |
| jsonwebtoken | Emissão e verificação de JWT, com o algoritmo fixado em HS256 para impedir troca de algoritmo |
| bcryptjs | Algoritmo bcrypt sem binário nativo, o que dispensa ferramentas de compilação na imagem Docker Alpine |
| express-rate-limit | Limite por IP com handler customizável para devolver o erro no formato padrão |
| helmet | Cabeçalhos de segurança HTTP |
| cors | CORS com credenciais, necessário para o cookie de refresh quando frontend e API estão em origens diferentes |
| cookie-parser | Leitura do refresh token no cookie |
| pino e pino-http | Logs estruturados em JSON, com id de requisição e redação de `authorization`, cookies, senhas e tokens |
| dotenv | Carrega o `.env` em desenvolvimento |
| Vitest e Supertest | Testes em TypeScript sem compilação separada; o Supertest chama a aplicação em memória, sem abrir porta |
| tsx | Executa TypeScript em desenvolvimento, no seed e no benchmark |

### Frontend

| Biblioteca | Justificativa |
| --- | --- |
| React 18 e React Router 6 | Exigência do enunciado e roteamento com guards por perfil |
| Vite | Build rápido; o `.env.example` do desafio já previa `VITE_API_URL` |
| MUI 5 e Emotion | Componentes acessíveis como base, customizados por tema e `styled` (ADR 09) |
| @mui/x-date-pickers e dayjs | Seletores de data com calendário e formatação em português |
| React Hook Form, @hookform/resolvers e Zod | Formulários com validação em tempo real e schemas tipados |
| Axios | Interceptors para anexar o access token e renová-lo automaticamente |
| Zustand | Estado de sessão acessível fora do React, pelo interceptor, sem boilerplate |
| notistack | Notificações de sucesso e erro das ações |
| chart.js e react-chartjs-2 | Gráficos leves em canvas, carregados apenas na tela de relatórios |
| @fontsource/ibm-plex-sans | Fonte embarcada no bundle, sem requisição a serviços externos |
| Vitest, Testing Library, user-event e MSW | Testes de componente e de tela; o MSW simula a API no nível HTTP, então os testes exercitam o cliente Axios real |

---

## 6. Testes

### Estratégia

- **Backend, integração** (Vitest, Supertest e PostgreSQL real): a aplicação é montada em memória e cada requisição passa por middlewares, validação, services e banco. Um banco separado e descartável (`TEST_DATABASE_URL`) recebe as migrations uma vez e é truncado antes de cada teste; os arquivos rodam em sequência porque compartilham o banco. O banco real foi uma escolha deliberada: as regras mais delicadas (índice único parcial, `FOR UPDATE`, agregações SQL, fuso horário) só são testadas de verdade contra o PostgreSQL.
- **Backend, unidade:** Haversine, algoritmo húngaro e planejador de atribuição, que são funções puras.
- **Frontend** (Vitest, Testing Library, user-event e MSW): o MSW intercepta as requisições do Axios, então os testes cobrem o cliente HTTP, os interceptors e a validação das respostas sem depender do backend.
- Testes parametrizados (`it.each`) para transições válidas e inválidas, regras de validação de produto e tradução de mensagens de erro.

### Resultados

| Suíte | Comando | Arquivos | Testes | Resultado |
| --- | --- | --- | --- | --- |
| Backend | `cd backend && npm test` | 9 | 96 | 96 aprovados |
| Frontend | `cd frontend && npm test` | 5 | 28 | 28 aprovados |

### Cobertura dos mínimos exigidos

| Exigência do enunciado | Testes |
| --- | --- |
| Autenticação: token válido e inválido | `auth.test.ts`: login válido, credenciais inválidas, token válido, ausente, malformado, assinado com outra chave, expirado (`TOKEN_EXPIRED`), refresh usado como access, 403 para `viewer`, rotação com detecção de reuso, refresh por cookie, logout e 429 |
| CRUD de produtos: criação válida e validação de campos | `products.test.ts`: criação, 10 casos de validação, filtros, busca, menu público, atualização parcial, 404, exclusão bloqueada (409) e exclusão com histórico preservado |
| Transição de status: válida e inválida | `orders.test.ts`: 5 transições válidas, 6 inválidas, `ready → delivering` sem e com entregador, concorrência no mesmo entregador, 404, 403, total calculado e preço congelado |
| Algoritmo: com solução e sem entregadores | `optimizeAssignment.test.ts`, `hungarian.test.ts`, `deliveryAssignment.test.ts`, `haversine.test.ts` |
| Relatórios: receita por período e mais vendidos | `reports.test.ts`: receita com dias zerados, validação de período, ranking, limite e período, contagem por status e tempo médio por veículo |
| Frontend: renderização de componente | `StatusBadge/index.test.tsx` |
| Frontend: interação do usuário | `OrderActions/index.test.tsx` (ações e confirmação de cancelamento), `ProductFormDialog/index.test.tsx` (validação em tempo real, envio e erros vindos da API) |
| Frontend: integração de tela | `Login/index.test.tsx`: redirecionamento sem sessão, validação, credenciais inválidas, login até o painel de pedidos, renovação de token expirado e sessão que não pode ser renovada |

### Outras verificações executadas

- `npm run typecheck`, `npm run lint` e `npm run build` nos dois projetos, sem erros.
- `docker compose up --build` em uma cópia limpa do projeto (sem `node_modules`, `dist` nem `.env`): banco e API ficam saudáveis pelos healthchecks, a migration é aplicada, o seed roda na primeira subida e é ignorado nos reinícios.
- No ambiente Docker: cookie httpOnly com `Path=/api/auth`, renovação por cookie sem refresh token no corpo, 403 para `viewer` em escrita, rate limit por IP atrás do proxy (105 requisições seguidas resultaram em 100 respostas 200 e 5 respostas 429), senhas gravadas como hash bcrypt e uma tentativa de SQL injection na busca tratada como texto comum.
- Fluxo manual no navegador contra a API real: login, mudança de status, sugestão e aceite de atribuição, relatórios, validação de formulário, restauração de sessão ao recarregar e layout em 390 px.

---

## 7. Desempenho

`npm run seed:volume` cria 10.000 produtos e 10.000 pedidos (18.907 itens e 33.285 registros de histórico), com 50 pedidos prontos e 30 entregadores livres. `npm run benchmark` sobe a API e mede cada cenário de ponta a ponta via HTTP, com 3 aquecimentos e 30 medições. Execução em máquina de desenvolvimento Windows com PostgreSQL 16 em Docker:

| Cenário | p50 (ms) | p95 (ms) | Limite (ms) |
| --- | --- | --- | --- |
| Produtos, página 1 | 5,4 | 6,7 | 200 |
| Produtos, busca por nome | 5,7 | 6,4 | 200 |
| Produtos, categoria e disponibilidade, ordenados por preço | 5,9 | 7,1 | 200 |
| Produtos, página 400 | 10,1 | 11,1 | 200 |
| Pedidos, página 1 | 8,4 | 9,4 | 200 |
| Pedidos por status, 50 por página | 11,8 | 14,2 | 200 |
| Pedidos ordenados por valor | 12,5 | 13,3 | 200 |
| Pedidos, página 450 | 14,2 | 16,1 | 200 |
| Otimização, 50 pedidos e 30 entregadores | 5,7 | 7,4 | 2000 |

O script termina com código de saída 1 se algum cenário passar do limite, então pode ser usado como verificação automática. Instruções em [`backend/README.md`](backend/README.md).

---

## 8. Dificuldades encontradas e como foram resolvidas

1. **Listagem de pedidos acima de 200 ms com 10.000 registros.** A primeira execução do benchmark mostrou a ordenação por valor com p95 de 216,9 ms e a página 450 com 186,3 ms, enquanto a página 1 levava 8 ms. A mesma consulta em SQL puro, analisada com `EXPLAIN ANALYZE`, levava de 2 a 5 ms, então o custo não estava no banco. A causa era o recurso em preview `relationJoins` do Prisma, que monta os relacionamentos com agregações JSON calculadas antes de aplicar ordenação e offset. Sem ele, o Prisma busca os relacionamentos em consultas separadas por lote, e os dois cenários caíram para 13,3 ms e 16,1 ms.
2. **Benchmark do otimizador medindo o cenário errado.** O mesmo benchmark devolveu 50 atribuições, quando o cenário deveria ter apenas 30 entregadores livres: os 20 entregadores usados para gerar histórico também estavam livres. O seed de volume passou a criá-los inativos, e o cenário agora mede de fato 50 × 30.
3. **Seed sem datas.** `seed/data.json` não traz datas nem histórico de status, mas os relatórios dependem disso. O seed gera uma linha do tempo coerente para cada pedido: pedidos ativos nos últimos minutos, pedidos finalizados espalhados nos dias anteriores e durações derivadas do tempo de preparo dos itens e da distância entre entregador e cliente. Na primeira versão, pedidos recentes com preparo longo ficavam com transições no futuro; a linha do tempo passou a ser deslocada para terminar no passado.
4. **Refresh token no corpo da resposta versus cookie httpOnly.** O contrato devolve o refresh token no JSON, o que o deixaria legível para scripts da página. A regra de canal do ADR 04 mantém o contrato para clientes de API sem expor o token no navegador.
5. **Ordem instável dos itens de um pedido.** Os itens apareciam em ordem diferente a cada atualização automática do painel. Itens do mesmo pedido são gravados na mesma transação e têm o mesmo `created_at`, então ordenar por essa coluna não era determinístico. A ordenação passou a ser por nome do produto e, em seguida, por id.
6. **Validação de par de coordenadas.** A regra "latitude e longitude juntas" é um refinamento sobre o objeto inteiro, e o Zod não o avalia enquanto algum campo isolado é inválido. O comportamento foi mantido (o aviso aparece quando os demais campos estão corretos) e o teste foi separado em dois casos.
7. **Roteiro sem Docker do enunciado.** O roteiro executa `npm run seed` sem um passo de migration, o que falharia em um banco vazio. O script `seed` passou a aplicar as migrations pendentes antes de popular o banco.

---

## 9. Limitações e próximos passos

| Item | Situação |
| --- | --- |
| WebSocket ou SSE | Não implementado; a atualização é por polling (ADR 07) |
| Documentação Swagger/OpenAPI | Não implementada; o contrato é `docs/api-spec.md` mais as adições do ADR 05 |
| Pipeline de CI | Não criado |
| Testes E2E automatizados | Não há suíte E2E versionada; o fluxo completo foi validado manualmente no navegador e o fluxo de login é coberto por teste de integração de tela |
| Modo escuro | Não implementado; os tokens centralizados permitem adicionar um segundo tema |
| Cache de listagens | Não implementado; as listagens respondem abaixo de 20 ms no cenário medido |
| Tabelas no celular | O layout se adapta, mas tabelas largas rolam na horizontal em vez de virar cartões |
| Endereço do pedido | Latitude e longitude são digitadas manualmente na criação do pedido |
| Reserva de entregador | A sugestão de atribuição não reserva entregadores entre o cálculo e o aceite (seção 4) |

Próximos passos naturais em um produto real: geocodificação do endereço na criação do pedido, distância e tempo por ruas (por exemplo, com uma API de rotas) como custo do algoritmo, e peso por tempo de espera na função objetivo para evitar que pedidos distantes fiquem sempre por último.
