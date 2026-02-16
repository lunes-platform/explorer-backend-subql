# Lunes Explorer

**Blockchain Explorer completo para a rede Lunes** — visualize blocos, transações, contas, tokens, NFTs, staking, validadores, contratos inteligentes e analytics em tempo real.

> Construído com React + TypeScript (frontend), Express.js (API), e SubQuery (indexador on-chain).

---

## Arquitetura

```
explorer-backend-subql/
├── src/                  # SubQuery indexer (handlers, mappings)
├── api/                  # Express.js REST API (porta 4000)
│   ├── server.js         # Servidor principal com todas as rotas
│   ├── adminStore.ts     # Autenticação admin com HMAC-SHA256
│   ├── store.js          # Projetos, social, comentários
│   ├── rewardsStore.ts   # Sistema de recompensas
│   ├── bannerStore.ts    # Gerenciamento de banners
│   ├── adsStore.ts       # Gerenciamento de anúncios
│   ├── aiExplain.js      # Explicações AI de transações
│   ├── anomalyDetection.ts # Detecção de anomalias on-chain
│   ├── priceCache.ts     # Cache de preço (CoinGecko)
│   └── rateLimit.js      # Rate limiting por IP
├── frontend/             # React + Vite + TypeScript (porta 5175)
│   ├── src/pages/        # Páginas (Home, Blocks, Staking, Admin...)
│   ├── src/components/   # Componentes reutilizáveis
│   ├── src/hooks/        # Hooks customizados (RPC, API, chain)
│   ├── src/services/     # Chain service (Polkadot API via WebSocket)
│   └── src/context/      # Contexts (Wallet, Admin Auth)
└── schema.graphql        # Schema do indexador SubQuery
```

### Dados Híbridos

- **RPC direto** (`wss://ws-archive.lunes.io`) — saldos, staking, assets, contratos, blocos recentes
- **SubQuery indexer** — histórico de transferências, blocos, eventos indexados
- **API Express** — projetos, social, rewards, admin, preços, AI

---

## Funcionalidades

### Explorer
- **Blocos** — listagem em tempo real, detalhes, extrinsics por bloco
- **Transações/Extrinsics** — busca, filtros, detalhes completos
- **Contas** — saldo, histórico, staking, assets, NFTs
- **Tokens** — listagem de assets nativos, detalhes, holders
- **NFTs** — galeria de coleções e itens
- **Contratos** — listagem de smart contracts deployados
- **Rich List** — ranking de maiores holders
- **Staking** — overview, validadores, nominators, APY
- **Analytics** — gráficos de atividade da rede

### Ecossistema
- **Projetos** — cadastro e listagem de projetos do ecossistema Lunes
- **Social** — likes, follows, comentários com reações em projetos
- **Verificação** — sistema de verificação de projetos
- **Rewards** — sistema de pontos e recompensas para usuários ativos
- **Swap** — interface de troca de tokens

### Radar de Anomalias (AI)
- **Detecção automática** — identifica transações suspeitas, whale movements, atividade incomum
- **Scan on-chain** — análise de blocos recentes via RPC
- **AI Explain** — explicações em linguagem natural de transações e blocos

### Painel Administrativo (`/admin`)
- **Dashboard** — visão geral do sistema (blocos, validadores, contratos, projetos, rewards)
- **Projetos** — gerenciamento completo (CRUD, verificação, review)
- **Tokens** — informações do token LUNES (links, logo, CoinGecko)
- **Banners** — gerenciamento de banners promocionais da home
- **Ads** — gerenciamento de anúncios com tracking (impressões, cliques, CTR)
- **Anúncios** — comunicados oficiais
- **Rewards** — wallet, distribuição, configuração de tiers/goals/conversão
- **IA / LLM** — configuração de API key e modelos
- **Equipe** — gerenciamento de membros (owner, admin, editor)
- **Configurações** — senha, perfil

### Wallet Integration
- **Polkadot.js** — conexão com extensão de carteira
- **Dashboard do usuário** — meus projetos, favoritos, recompensas
- **Assinatura** — autenticação via assinatura de mensagem

---

## Melhorias Recentes

### SEO & Meta Tags
- Meta descriptions dinâmicas por página via hook `usePageTitle`
- Open Graph e Twitter Cards para compartilhamento social
- JSON-LD structured data para Google
- `robots.txt` e `sitemap.xml`
- Canonical URLs dinâmicas
- OG image SVG customizada

### Upload de Imagens
- Endpoint `POST /api/upload` para upload de logos (PNG, SVG, JPG, WEBP, GIF)
- Componente `ImageUpload` reutilizável com modo URL + upload
- Integrado em: cadastro de projeto, dashboard do usuário, admin tokens
- Validação de tipo, tamanho (max 5MB), e sanitização de SVG contra XSS
- Imagens servidas estaticamente em `/uploads/` com cache de 7 dias

### Segurança
- **Autenticação admin** em todas as rotas `/api/admin/*` (banners, ads, rewards, projetos, AI)
- **Token com expiração** — tokens admin expiram em 24h com cleanup automático
- **Remoção de token legado** — eliminado bypass de token hardcoded
- **Hash de senha melhorado** — HMAC-SHA256 com salt (compatível com senhas existentes)
- **Ownership check** — PUT/DELETE de projetos exigem `ownerAddress` válido
- **Rate limiting** — upload (10/min), escrita (30/min), leitura (120/min)
- **Security headers** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **Sanitização SVG** — rejeita SVGs com `<script>`, event handlers, `javascript:`, `<iframe>`
- **CSP em uploads** — Content-Security-Policy restritiva para arquivos servidos
- **Sanitização de comentários** — escape de HTML para prevenir XSS armazenado
- **Proteção de pontos** — endpoint de pontos requer auth admin + cap de 10.000
- **Validação de path traversal** — filenames de upload validados contra `/` e `\`

---

## Setup

### Pré-requisitos

- Node.js 18+
- Docker & Docker Compose (para o indexador)
- Yarn ou npm

### 1. Indexador SubQuery

```bash
# Na raiz do projeto
yarn install
yarn codegen
yarn build
docker-compose pull && docker-compose up
```

O GraphQL playground estará em [http://localhost:3000](http://localhost:3000).

### 2. API Backend

```bash
cd api
npm install
npx ts-node server.js
```

A API estará em [http://localhost:4000](http://localhost:4000).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará em [http://localhost:5175](http://localhost:5175).

### Admin Padrão

- **Email:** `admin@lunes.io`
- **Senha:** `lunes2024`

> Altere a senha após o primeiro login em Admin > Configurações.

---

## API Endpoints

### Públicos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Status da API |
| GET | `/api/projects` | Listar projetos |
| GET | `/api/projects/:slug` | Detalhes do projeto |
| POST | `/api/projects` | Criar projeto |
| PUT | `/api/projects/:slug` | Atualizar projeto (requer ownerAddress) |
| DELETE | `/api/projects/:slug` | Deletar projeto (requer ownerAddress) |
| GET | `/api/banners` | Banners ativos |
| GET | `/api/ads` | Anúncios ativos |
| GET | `/api/prices` | Preço LUNES (cache 5min) |
| GET | `/api/rewards/config` | Configuração de rewards |
| GET | `/api/rewards/leaderboard` | Leaderboard |
| GET | `/api/rewards/:address` | Rewards do usuário |
| POST | `/api/upload` | Upload de imagem (base64) |

### Autenticados (Bearer Token)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login admin |
| GET | `/api/auth/me` | Dados do usuário logado |
| GET | `/api/admin/banners` | Todos os banners |
| POST/PUT/DELETE | `/api/admin/banners/:id` | CRUD banners |
| GET | `/api/admin/ads` | Todos os anúncios |
| POST/PUT/DELETE | `/api/admin/ads/:id` | CRUD anúncios |
| GET | `/api/admin/rewards/wallet` | Status da wallet |
| PUT | `/api/admin/rewards/config` | Atualizar config rewards |
| GET | `/api/admin/projects` | Todos os projetos (admin) |
| PUT/DELETE | `/api/admin/projects/:slug` | Gerenciar projetos |
| GET/PUT | `/api/admin/ai/config` | Configuração AI |

---

## Query GraphQL (SubQuery)

```graphql
{
  query {
    transfers(first: 5, orderBy: BLOCK_NUMBER_DESC) {
      totalCount
      nodes {
        id
        date
        blockNumber
        toId
        fromId
        amount
      }
    }
    accounts(first: 5, orderBy: SENT_TRANSFERS_COUNT_DESC) {
      nodes {
        id
        sentTransfers(first: 5, orderBy: BLOCK_NUMBER_DESC) {
          totalCount
          nodes {
            id
            toId
            amount
          }
        }
        lastTransferBlock
      }
    }
  }
}
```

---

## Stack Tecnológica

- **Frontend:** React 18, TypeScript, Vite, CSS Modules, Framer Motion, Lucide Icons, Recharts
- **Backend API:** Express.js, TypeScript, Node.js
- **Blockchain:** Polkadot.js API, WebSocket RPC (`wss://ws-archive.lunes.io`)
- **Indexador:** SubQuery (Substrate), PostgreSQL, GraphQL
- **Auth:** HMAC-SHA256, Bearer tokens com TTL
- **Preço:** CoinGecko API com cache de 5 minutos

---

## Licença

Lunes Platform — [lunes.io](https://lunes.io)
