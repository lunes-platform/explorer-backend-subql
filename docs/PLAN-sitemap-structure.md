# Plan: Lunes Explorer Sitemap Structure

> **Status**: DRAFT / WAITING FOR APPROVAL
> **Goal**: Define the complete sitemap and navigation structure for the Lunes Block Explorer, referencing CoinMarketCap/CoinGecko style and Lunes Premium Design.

## 1. Context & Requirements
- **Design System**: Lunes Premium (Purple #6C38FF / Dark #1A1A1A).
- **Inspiration**: CoinMarketCap (CMC) / CoinGecko (Dashboard-first approach).
- **Backend**: SubQuery GraphQL (Mainnet).

## 2. Proposed Sitemap (High-Level)

### 🏠 Home (Dashboard)
- **Global Metrics**: Market Cap, Volume, Dominance, TPS.
- **Highlights**: Trending Tokens, Top Gainers, Network Health.
- **Market Table**: List of Top Tokens (Sortable/Filterable).

### ⛓️ Blockchain Data
- **Blocks**:
  - `/blocks` (List of recent blocks, paginated).
  - `/block/:id` (Detail: Hash, Parent, Extrinsics, Events).
- **Transactions (Extrinsics)**:
  - `/txs` (List of latest transactions).
  - `/tx/:hash` (Detail: Status, Fee, Signer, Events).
- **Accounts**:
  - `/account/:address` (Portfolio, Transfer History, Assets).

### 👤 User & Watchlist (Web3 Login)
- **Wallets Supported**: Polkadot.js, Subwallet, Talisman.
- **Features**:
  - `Connect Wallet` button (Top Right).
  - `/watchlist` (Tracked Assets & Custom Portfolio).
  - *No backend auth required initially (LocalStorage + On-chain verify option).*

### 🛡️ Validators & Staking (Phase 3)
- `/validators` (Active Set, Uptime, Commission).
- `/staking` (Calculator, Nominator dashboard).

### 🪙 Tokens (Assets)
- **Fungible Tokens (PSP22)**:
  - `/tokens` (Ranking view - CMC Style).
  - `/token/:id` (Detail: Price Chart, Holders, Transfers, Contract Info).
- **NFTs (PSP34)**:
  - `/nfts` (Gallery View).
  - `/nft/:collection/:id` (Visual detail, Attributes, Owner).

### � Governance (DAO)
*Excuded: Will be on a separate external platform.*

### 🛠️ Developers & Utilities
- `/contracts` (Verified Contracts List).
- `/verify` (Source Code Verification Tool).
- `/api` (GraphQL Playground / Docs).

---

## 3. Implementation Phasing
1. **Phase 1 (Core Explorer)**: Home, Blocks, Txs, Accounts.
2. **Phase 2 (Market Data)**: Token Details, Asset Charts.
3. **Phase 3 (User Features)**: Wallet Connect (Polkadot.js/Subwallet/Talisman) & Watchlist.
4. **Phase 4 (Staking)**: Validators & Network Health.

## 4. Technical Requirements for Wallets
- **Library**: `@polkadot/extension-dapp` & `@talismn/connect`.
- **Logic**: Detect injected extensions, request account access, store "watched" items in `localStorage` keyed by account address.
