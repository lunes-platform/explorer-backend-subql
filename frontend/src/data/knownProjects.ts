export interface ProjectLink {
  type: 'website' | 'github' | 'x' | 'telegram' | 'discord' | 'docs' | 'medium';
  url: string;
  label?: string;
}

export interface ProjectTeam {
  name: string;
  role: string;
  avatar?: string;
}

export interface ProjectMilestone {
  title: string;
  date: string;
  status: 'completed' | 'in-progress' | 'planned';
  description?: string;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface VerificationData {
  status: VerificationStatus;
  submittedAt?: string;
  verifiedAt?: string;
  paymentTxHash?: string;
  payerAddress?: string;
  // KYC data
  responsibleName?: string;
  responsibleEmail?: string;
  responsibleDocument?: string;
  proofOfOwnership?: string;
  projectWebsite?: string;
}

// Verification fee in LUNES (raw planck units, 12 decimals)
export const VERIFICATION_FEE_LUNES = 1000;
export const VERIFICATION_FEE_PLANCK = BigInt(VERIFICATION_FEE_LUNES) * BigInt(10 ** 12);
// Address that receives verification fees
export const VERIFICATION_RECEIVER = '5C8Kq8Wd1ZqQJSdZiGNAcbYGmyJy5cKjFg2BgPFEH2EFeXZU';

export interface KnownProject {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  category: 'defi' | 'nft' | 'social' | 'infrastructure' | 'gaming' | 'dao' | 'token' | 'other';
  description: string;
  longDescription?: string;
  status: 'active' | 'development' | 'beta' | 'deprecated';
  launchDate?: string;
  links: ProjectLink[];
  team: ProjectTeam[];
  milestones: ProjectMilestone[];
  tags: string[];
  // References to on-chain entities
  contractAddresses: string[];
  tokenIds: string[];
  nftCollectionIds: string[];
  assetIds: string[];
  // Verification
  verification: VerificationData;
}

export const KNOWN_PROJECTS: KnownProject[] = [
  {
    id: 'lunes-network',
    name: 'Lunes',
    slug: 'lunes-network',
    category: 'infrastructure',
    description: 'Blockchain Layer 1 baseada em Substrate com suporte a Smart Contracts Ink!, NFTs e staking nativo.',
    longDescription: `Lunes Network é uma blockchain de Layer 1 construída com o framework Substrate da Parity Technologies.
A rede oferece suporte nativo a Smart Contracts via pallet-contracts (Ink!/WASM), sistema de assets fungíveis,
NFTs via pallet-nfts, e staking com Nominated Proof-of-Stake (NPoS).

Com foco em escalabilidade, baixas taxas e interoperabilidade, a Lunes Network busca ser a infraestrutura
base para aplicações descentralizadas no ecossistema brasileiro e latino-americano.`,
    status: 'active',
    launchDate: '2023-01-01',
    links: [
      { type: 'website', url: 'https://lunes.io', label: 'Lunes.io' },
      { type: 'github', url: 'https://github.com/lunes-platform', label: 'GitHub' },
      { type: 'x', url: 'https://x.com/LunesPlatform', label: '@LunesPlatform' },
      { type: 'telegram', url: 'https://t.me/LunesGlobal', label: 'Telegram' },
      { type: 'docs', url: 'https://lunes-labs.gitbook.io/dao-lunes-labs-en', label: 'Documentation' },
      { type: 'website', url: 'https://gov.lunes.io', label: 'Governance' },
      { type: 'website', url: 'https://safeguard.lunes.io', label: 'Safeguard' },
      { type: 'website', url: 'https://lunex.lunes.io', label: 'Lunex DEX' },
      { type: 'website', url: 'https://launchpad.lunes.io', label: 'Launchpad' },
      { type: 'website', url: 'https://lusdt.lunes.io', label: 'LUSDT Stablecoin' },
    ],
    team: [
      { name: 'Lunes Foundation', role: 'Core Development' },
    ],
    milestones: [
      { title: 'Mainnet Launch', date: '2023-01', status: 'completed', description: 'Lançamento da mainnet Lunes baseada em Substrate' },
      { title: 'Smart Contracts (Ink!)', date: '2023-06', status: 'completed', description: 'Ativação do pallet-contracts para smart contracts WASM' },
      { title: 'Staking NPoS', date: '2023-06', status: 'completed', description: 'Sistema de staking com Nominated Proof-of-Stake' },
      { title: 'Pallet Assets', date: '2024-01', status: 'completed', description: 'Suporte a tokens fungíveis nativos na chain' },
      { title: 'Pallet NFTs', date: '2024-03', status: 'completed', description: 'Suporte a NFTs nativos' },
      { title: 'Explorer v2', date: '2026-02', status: 'in-progress', description: 'Nova versão do explorer com dados em tempo real via RPC' },
      { title: 'Cross-Chain Bridge', date: '2026-Q3', status: 'planned', description: 'Bridge para Ethereum e Polkadot' },
    ],
    tags: ['layer-1', 'substrate', 'ink', 'smart-contracts', 'npos', 'staking'],
    contractAddresses: [],
    tokenIds: [],
    nftCollectionIds: [],
    assetIds: [],
    verification: { status: 'verified', verifiedAt: '2023-01-01' },
  },
  {
    id: 'lusdt-stablecoin',
    name: 'LUSDT Stablecoin',
    slug: 'lusdt',
    category: 'defi',
    description: 'Stablecoin pareada ao dólar americano na rede Lunes, emitida como asset nativo via pallet-assets.',
    longDescription: `LUSDT é uma stablecoin na rede Lunes pareada 1:1 ao dólar americano (USD).
Diferente de stablecoins em smart contracts, LUSDT é um asset nativo da blockchain,
criado via pallet-assets, o que garante maior performance e menor custo de transação.

É o principal par de trading no ecossistema Lunes e serve como base para DeFi na rede.`,
    status: 'active',
    launchDate: '2024-01-15',
    links: [
      { type: 'website', url: 'https://lusdt.lunes.io', label: 'LUSDT' },
      { type: 'x', url: 'https://x.com/LunesPlatform', label: '@LunesPlatform' },
      { type: 'telegram', url: 'https://t.me/LunesGlobal', label: 'Telegram' },
    ],
    team: [
      { name: 'Lunes Foundation', role: 'Issuer' },
    ],
    milestones: [
      { title: 'Asset Creation', date: '2024-01', status: 'completed', description: 'Criação do asset LUSDT na chain' },
      { title: 'Liquidity Pools', date: '2026-Q2', status: 'planned', description: 'Pools de liquidez LUNES/LUSDT' },
    ],
    tags: ['stablecoin', 'usd', 'defi', 'native-asset'],
    contractAddresses: [],
    tokenIds: [],
    nftCollectionIds: [],
    assetIds: ['1'],
    verification: { status: 'verified', verifiedAt: '2024-01-15' },
  },
  {
    id: 'pidchat',
    name: 'PidChat',
    slug: 'pidchat',
    category: 'social',
    description: 'Protocolo de comunicação descentralizada construído na Lunes Network com token social nativo.',
    longDescription: `PidChat é um protocolo de mensagens e comunicação descentralizada construído sobre a Lunes Network.
O projeto utiliza smart contracts Ink! para gerenciar identidades e canais de comunicação,
e possui um token social nativo registrado como asset na blockchain.

O objetivo é criar uma plataforma de comunicação resistente a censura,
onde os usuários têm total controle sobre seus dados e identidade digital.`,
    status: 'development',
    launchDate: '2024-06-01',
    links: [
      { type: 'website', url: 'https://pidchat.io', label: 'PidChat.io' },
      { type: 'telegram', url: 'https://t.me/pidchat', label: 'Telegram' },
    ],
    team: [
      { name: 'PidChat Team', role: 'Development' },
    ],
    milestones: [
      { title: 'Token Launch', date: '2024-06', status: 'completed', description: 'Lançamento do token PIDCHAT como asset nativo' },
      { title: 'Protocol Beta', date: '2026-Q2', status: 'planned', description: 'Versão beta do protocolo de mensagens' },
      { title: 'Mainnet Launch', date: '2026-Q4', status: 'planned', description: 'Lançamento completo com app mobile' },
    ],
    tags: ['social', 'messaging', 'decentralized', 'web3'],
    contractAddresses: [],
    tokenIds: [],
    nftCollectionIds: [],
    assetIds: ['2'],
    verification: { status: 'unverified' },
  },
];

// Lookup helpers
export function getProjectBySlug(slug: string): KnownProject | undefined {
  return KNOWN_PROJECTS.find(p => p.slug === slug);
}

export function getProjectById(id: string): KnownProject | undefined {
  return KNOWN_PROJECTS.find(p => p.id === id);
}

export function getProjectByContract(address: string): KnownProject | undefined {
  return KNOWN_PROJECTS.find(p => p.contractAddresses.includes(address));
}

export function getProjectByAssetId(assetId: string): KnownProject | undefined {
  return KNOWN_PROJECTS.find(p => p.assetIds.includes(assetId));
}

export function getProjectByNftCollection(collectionId: string): KnownProject | undefined {
  return KNOWN_PROJECTS.find(p => p.nftCollectionIds.includes(collectionId));
}

export function getProjectsByCategory(category: KnownProject['category']): KnownProject[] {
  return KNOWN_PROJECTS.filter(p => p.category === category);
}

export function getAllProjects(): KnownProject[] {
  return KNOWN_PROJECTS;
}
