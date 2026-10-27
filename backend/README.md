# FastMeals API

API REST do FastMeals: Express 5, TypeScript estrito, Prisma e PostgreSQL. As decisões de arquitetura estão em [`../DECISIONS.md`](../DECISIONS.md) e o contrato em [`../docs/api-spec.md`](../docs/api-spec.md).

## Requisitos

- Node.js 20 ou superior
- PostgreSQL 14 ou superior (ou Docker)

## Executar localmente

```bash
cp .env.example .env

docker run -d --name fastmeals-db -p 5432:5432 \
  -e POSTGRES_USER=fastmeals -e POSTGRES_PASSWORD=fastmeals123 -e POSTGRES_DB=fastmeals \
  postgres:16-alpine

npm install
npm run seed
npm run dev
```

A API sobe em `http://localhost:3001/api`. O health check fica em `GET /api/health`.

Usuários criados pelo seed:

| E-mail | Senha | Perfil |
| --- | --- | --- |
| admin@fastmeals.com | Admin@123 | admin |
| viewer@fastmeals.com | Viewer@123 | viewer |

`npm run seed` aplica as migrations pendentes, apaga os dados atuais e recarrega `../seed/data.json`. Para popular só um banco vazio, use `node dist/prisma/seed.js --if-empty` após o build (é o que o Docker faz).

## Testes

Os testes de integração usam um PostgreSQL real e descartável, apontado por `TEST_DATABASE_URL`. Ele é migrado automaticamente e truncado antes de cada teste. Não aponte essa variável para um banco com dados que você queira manter.

```bash
docker run -d --name fastmeals-db-test -p 5433:5432 \
  -e POSTGRES_USER=fastmeals -e POSTGRES_PASSWORD=fastmeals123 -e POSTGRES_DB=fastmeals_test \
  postgres:16-alpine

npm test
```

## Benchmark de desempenho

Gera 10.000 produtos e 10.000 pedidos e mede as listagens paginadas e a otimização de 50 pedidos por 30 entregadores. Também apaga os dados do banco alvo, então rode contra o banco de testes:

```bash
DATABASE_URL=postgresql://fastmeals:fastmeals123@localhost:5433/fastmeals_test npm run seed:volume
DATABASE_URL=postgresql://fastmeals:fastmeals123@localhost:5433/fastmeals_test npm run benchmark
```

O script termina com código de saída 1 se algum cenário passar do limite (200 ms nas listagens, 2 s na otimização).

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | API com recarga automática na porta 3001 |
| `npm run build` / `npm start` | Compila para `dist/` e executa |
| `npm run start:migrate` | Aplica migrations, popula banco vazio e inicia (usado no Docker) |
| `npm run typecheck` | Verificação de tipos, incluindo testes e scripts |
| `npm run lint` | ESLint com `no-explicit-any` como erro |
| `npm test` | Testes de integração e de unidade |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run seed` | Recarrega `seed/data.json` |
| `npm run seed:volume` / `npm run benchmark` | Massa de dados e medição de desempenho |

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | obrigatória | Conexão PostgreSQL |
| `TEST_DATABASE_URL` | obrigatória nos testes | Banco descartável dos testes |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | obrigatórias | Segredos distintos, com 16 caracteres ou mais |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | `15m`, `7d` | Validade dos tokens (`s`, `m`, `h`, `d`) |
| `PORT` | `3001` | Porta HTTP |
| `CORS_ORIGIN` | `http://localhost:3000` | Origens permitidas, separadas por vírgula |
| `TRUST_PROXY` | `false` | `true` atrás de proxy reverso, para o rate limit usar o IP do cliente |
| `COOKIE_SECURE` | `true` em produção | Força ou desliga o atributo `Secure` do cookie de refresh |
| `RATE_LIMIT_MAX` | `100` | Requisições por minuto por IP |
| `BUSINESS_TIMEZONE` | `America/Sao_Paulo` | Fuso usado em filtros por data e agrupamentos diários |
| `LOG_LEVEL` | `info` | Nível do pino |
