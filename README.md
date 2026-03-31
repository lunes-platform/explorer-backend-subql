# Lunes Explorer

**Blockchain Explorer completo para a rede Lunes** — visualize blocos, transações, contas, tokens, NFTs, staking, validadores e analytics em tempo real. Inclui painel administrativo, sistema de projetos do ecossistema, criação de tokens on-chain, rewards e anúncios.

> Construído com React + TypeScript (frontend), Express.js + Prisma (API), SubQuery (indexador on-chain) e PostgreSQL.

---

## Arquitetura

```
explorer-backend-subql/
├── src/                        # SubQuery indexer (handlers, mappings)
│   └── mappings/
│       └── mappingHandlers.ts  # Block handler principal
├── api/                        # Express.js REST API (porta 4000)
│   ├── server.js               # Servidor principal — todas as rotas
│   ├── prismaClient.ts         # Singleton do Prisma Client
│   ├── prisma/
│   │   └── schema.prisma       # Schema PostgreSQL (AdminUser, AIConfig, AdminDataState...)
│   ├── adminStore.ts           # Auth admin — bcrypt + sessões no PostgreSQL
│   ├── storePrisma.ts          # Projetos, social, comentários → PostgreSQL
│   ├── financialStore.ts       # Carteiras, pagamentos, verificação → PostgreSQL
│   ├── rewardsStorePrisma.ts   # Rewards, leaderboard, wallet → PostgreSQL
│   ├── adsStore.ts             # Anúncios self-service → PostgreSQL
│   ├── bannerStore.ts          # Banners da home → PostgreSQL
│   ├── tokenEmissionStore.ts   # Configuração e registro de tokens → PostgreSQL
│   ├── aiConfigStore.ts        # Configuração LLM/OpenRouter → PostgreSQL
│   ├── aiExplain.js            # Explicações AI de transações
│   ├── anomalyDetection.ts     # Detecção de anomalias on-chain
│   ├── priceCache.ts           # Cache de preço LUNES (CoinGecko)
│   ├── rateLimit.js            # Rate limiting por IP
│   └── data/uploads/           # Imagens enviadas (logos, banners)
├── frontend/                   # React + Vite + TypeScript (porta 5175)
│   ├── src/pages/              # Páginas (Home, Blocks, Dashboard, Admin, Ecosystem...)
│   ├── src/components/         # Componentes reutilizáveis
│   ├── src/hooks/              # Hooks (RPC, API, chain, useTokenEmission...)
│   ├── src/services/           # Chain service (Polkadot.js via WebSocket)
│   └── src/context/            # Contexts (WalletAuth, AdminAuth)
├── docker-compose.yml          # Desenvolvimento local
├── docker-compose.prod.yml     # Produção
└── schema.graphql              # Schema do indexador SubQuery
```

### Persistência de Dados

Todos os dados da aplicação são salvos no **PostgreSQL** via Prisma. Não há mais arquivos JSON para dados de aplicação.

| Store | Tabela / Key |
|---|---|
| Usuários admin + sessões | `admin_users`, `admin_sessions` |
| Configuração AI | `ai_config` |
| Projetos, social, comentários | `admin_data_state` → `projects`, `social`, `comments` |
| Configuração financeira e pagamentos | `admin_data_state` → `financial` |
| Rewards e leaderboard | `admin_data_state` → `rewards` |
| Anúncios | `admin_data_state` → `ads` |
| Banners | `admin_data_state` → `banners` |
| Token emission config + tokens registrados | `admin_data_state` → `token-emission` |

---

## Funcionalidades

### Explorer On-chain
- **Blocos** — listagem em tempo real, detalhes, extrinsics por bloco
- **Transações/Extrinsics** — busca, filtros, detalhes completos
- **Contas** — saldo, histórico, staking, assets, NFTs
- **Tokens** — assets nativos via pallet-assets, detalhes, holders
- **Rich List** — ranking dos maiores holders
- **Staking** — overview, validadores, nominators, APY estimado
- **Analytics** — gráficos de atividade da rede

### Ecossistema Lunes
- **Projetos** — cadastro, listagem e verificação de projetos do ecossistema
- **Criação de Token** — wizard completo via pallet-assets (sem smart contract)
- **Social** — likes, follows, comentários com reações em projetos
- **Rewards** — sistema de pontos e recompensas para usuários ativos
- **Anúncios self-service** — compra e gestão de espaços publicitários
- **Swap** — interface de troca de tokens
- **Landing SEO** — `/ecosystem` para atrair novos projetos

### Painel Administrativo (`/admin`)
- **Dashboard** — visão geral (blocos, validadores, contratos, projetos, rewards)
- **Projetos** — CRUD completo, verificação KYC, review
- **Token Emission** — configurar taxa de emissão, carteira receptora, enable/disable
- **Financeiro** — carteiras, pagamentos, auditoria
- **Banners** — gerenciamento de banners da home
- **Ads** — review e aprovação de anúncios com tracking (impressões, cliques, CTR)
- **Anúncios** — comunicados oficiais
- **Rewards** — wallet de distribuição, tiers, goals, conversão de pontos
- **IA / LLM** — configuração de provider (OpenRouter) e modelo
- **Equipe** — gerenciamento de membros (owner, admin, editor)
- **Configurações** — troca de senha

---

## 🚀 Subindo o Projeto Localmente

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- [Node.js](https://nodejs.org/) 20+
- [Colima](https://github.com/abiosoft/colima) (macOS) ou Docker Desktop

### 1. Clone o repositório

```bash
git clone https://github.com/lunes-platform/explorer-backend-subql.git
cd explorer-backend-subql
```

### 2. Configure as variáveis de ambiente

```bash
cp api/.env.example api/.env
```

Edite `api/.env` com os valores mínimos para desenvolvimento local:

```env
API_PORT=4000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres
CORS_ORIGINS=http://localhost:5175
ADMIN_DEFAULT_PASSWORD=lunes2024
ADMIN_SALT=dev-salt-local
ADMIN_TOKEN_SECRET=dev-token-secret-local
RPC_URL=wss://ws-archive.lunes.io
INDEXER_URL=http://graphql-engine:3000
API_PUBLIC_URL=http://localhost:4000
APP_PUBLIC_URL=http://localhost:5175
```

### 3. Suba os serviços Docker

```bash
# macOS: garantir que o Colima está rodando
colima start

# Subir PostgreSQL + SubQuery + GraphQL + API
docker compose up -d postgres subquery-node graphql-engine api
```

### 4. Suba o frontend em modo dev

```bash
cd frontend
npm install
npm run dev
# Acesse: http://localhost:5175
```

### 5. Verifique

```bash
# Todos os containers
docker compose ps

# API saudável
curl http://localhost:4000/api/health

# GraphQL explorer
open http://localhost:3000

# Aplicação
open http://localhost:5175
```

### Comandos úteis

```bash
# Parar tudo
docker compose down

# Logs em tempo real
docker compose logs -f api

# Rebuild apenas da API após mudanças no código
docker compose build api && docker compose up -d api

# Acessar o banco de dados
docker compose exec postgres psql -U postgres -d postgres

# Ver tabelas
docker compose exec postgres psql -U postgres -d postgres -c "\dt"

# Ver dados de token emission
docker compose exec postgres psql -U postgres -d postgres \
  -c "SELECT key, updated_at FROM admin_data_state;"
```

---

## 🏭 Deploy em Produção

### 1. Clone e configure secrets

```bash
git clone https://github.com/lunes-platform/explorer-backend-subql.git
cd explorer-backend-subql
cp api/.env.example api/.env
```

### 2. Gere segredos seguros

```bash
# Gerar ADMIN_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar ADMIN_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar senha do banco
openssl rand -base64 24

# Gerar senha admin inicial
openssl rand -base64 18
```

### 3. Configure `api/.env` para produção

```env
NODE_ENV=production
API_PORT=4000

# PostgreSQL (use senha forte gerada acima)
DATABASE_URL=postgresql://postgres:SENHA_FORTE@postgres:5432/postgres
POSTGRES_PASSWORD=SENHA_FORTE

# CORS — domínio real da aplicação
CORS_ORIGINS=https://explorer.lunes.io

# URLs públicas
API_PUBLIC_URL=https://explorer.lunes.io
APP_PUBLIC_URL=https://explorer.lunes.io

# Segredos — use os valores gerados acima, NUNCA os defaults
ADMIN_SALT=cole_o_valor_gerado_aqui
ADMIN_TOKEN_SECRET=cole_o_valor_gerado_aqui

# Senha do primeiro admin (será criado automaticamente no primeiro boot)
ADMIN_DEFAULT_PASSWORD=senha_forte_gerada_aqui

# RPC Lunes
RPC_URL=wss://ws-archive.lunes.io
INDEXER_URL=http://graphql-engine:3000
```

### 4. Configure `.env` na raiz (docker-compose.prod.yml)

```env
POSTGRES_PASSWORD=MESMA_SENHA_DO_PASSO_3
```

### 5. Build e deploy

```bash
# Build do frontend para produção
cd frontend
npm install
npm run build
cd ..

# Subir com docker-compose de produção
docker compose -f docker-compose.prod.yml up -d --build
```

### 6. Verificar produção

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Logs da API
docker compose -f docker-compose.prod.yml logs -f api

# Teste de saúde
curl https://explorer.lunes.io/api/health
```

---

## 🔐 Configurando o Admin em Produção

### Primeiro Acesso

Na primeira inicialização, o sistema cria automaticamente o usuário owner com as credenciais do `.env`:

- **Email:** `admin@lunes.io`
- **Senha:** valor de `ADMIN_DEFAULT_PASSWORD` no `.env`

Acesse: `https://explorer.lunes.io/admin`

> ⚠️ **Troque a senha imediatamente** após o primeiro login em Admin → Configurações → Trocar Senha.

### Adicionar Membros da Equipe

No painel: **Admin → Configurações → Equipe**

Funções disponíveis:
| Função | Permissões |
|---|---|
| `owner` | Acesso total, não pode ser deletado |
| `admin` | Acesso total exceto gerenciar owner |
| `editor` | Acesso de leitura e edição de conteúdo |

### Configurar Token Emission

No painel: **Admin → Token Emission**

1. Defina a **taxa de emissão** em LUNES (ex: `1000`)
2. Informe a **carteira receptora** das taxas (endereço SS58 da Lunes)
3. Defina limites de supply mínimo/máximo
4. Ative com o toggle **Enable**

### Configurar Carteiras Financeiras

No painel: **Admin → Financial**

Configure as carteiras para receber pagamentos de:
- Verificação de projetos
- Anúncios
- Rewards (distribuição)

### Configurar AI (Opcional)

No painel: **Admin → AI / LLM**

1. Crie uma conta em [openrouter.ai](https://openrouter.ai)
2. Gere uma API Key gratuita
3. Cole em Admin → AI / LLM → API Key
4. Selecione um modelo gratuito (ex: `google/gemma-3-12b-it:free`)
5. Ative com o toggle **Enable**

### Sessões Admin

- Tokens expiram em **24 horas**
- Se o container da API reiniciar, as sessões são mantidas (persistidas no PostgreSQL)
- Para invalidar todas as sessões: `DELETE FROM admin_sessions;` no banco

---

## API Endpoints

### Públicos

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Status da API |
| GET | `/api/projects` | Listar projetos |
| GET | `/api/projects/:slug` | Detalhes do projeto |
| POST | `/api/projects` | Criar projeto |
| PUT | `/api/projects/:slug` | Atualizar projeto (requer `ownerAddress`) |
| DELETE | `/api/projects/:slug` | Deletar projeto (requer `ownerAddress`) |
| GET | `/api/banners` | Banners ativos |
| GET | `/api/ads` | Anúncios ativos |
| GET | `/api/prices` | Preço LUNES (cache 5min) |
| GET | `/api/rewards/leaderboard` | Leaderboard de rewards |
| GET | `/api/rewards/:address` | Rewards do usuário |
| GET | `/api/token-emission/config` | Config pública de emissão de tokens |
| GET | `/api/tokens` | Tokens registrados |
| GET | `/api/tokens/owner/:address` | Tokens por carteira |
| POST | `/api/tokens/register` | Registrar token criado on-chain |
| POST | `/api/upload` | Upload de imagem (base64) |

### Autenticados (Bearer Token)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login admin |
| GET | `/api/auth/me` | Dados do usuário logado |
| POST | `/api/auth/change-password` | Trocar senha |
| GET/POST/PUT/DELETE | `/api/admin/banners` | CRUD banners |
| GET/POST/PUT/DELETE | `/api/admin/ads` | CRUD anúncios |
| GET/PUT | `/api/admin/token-emission/config` | Config de emissão |
| GET | `/api/admin/tokens` | Todos os tokens registrados |
| GET/PUT | `/api/admin/config/financial` | Config financeira |
| GET/PUT | `/api/admin/wallets/:purpose` | Carteiras por propósito |
| GET/PUT | `/api/admin/rewards/config` | Config rewards |
| GET | `/api/admin/rewards/stats` | Estatísticas rewards |
| GET/PUT/DELETE | `/api/admin/projects/:slug` | Gerenciar projetos |
| POST | `/api/admin/projects/:slug/review` | Revisar verificação |
| GET/PUT | `/api/admin/ai/config` | Configuração AI |
| GET | `/api/admin/team` | Membros da equipe |
| POST | `/api/admin/team` | Adicionar membro |
| PUT/DELETE | `/api/admin/team/:id` | Editar/remover membro |

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript, Vite, CSS Modules, Framer Motion, Lucide Icons, Recharts |
| API | Express.js, TypeScript, Node.js 20, tsx |
| ORM | Prisma 6 + PostgreSQL 16 |
| Blockchain | Polkadot.js API, WebSocket RPC |
| Indexador | SubQuery (Substrate), GraphQL |
| Auth | bcrypt + HMAC-SHA256, sessões no banco com TTL 24h |
| Containers | Docker + Docker Compose |

---

## Licença

Lunes Platform — [lunes.io](https://lunes.io)
