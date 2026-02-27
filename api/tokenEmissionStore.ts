// Token Emission Store
// Manages configuration for token creation fees and registered tokens
// Persists in PostgreSQL via Prisma (AdminDataState table) — same pattern as adsStore/bannerStore

import prisma from './prismaClient.ts';

const TOKEN_EMISSION_STATE_KEY = 'token-emission';

export interface TokenEmissionConfig {
  emissionFee: number;
  receiverAddress: string;
  minSupply: number;
  maxSupply: number;
  isEnabled: boolean;
  updatedAt: string;
}

export interface RegisteredToken {
  id: string;
  assetId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  ownerAddress: string;
  adminAddress: string;
  paymentTxHash: string;
  feePaid: number;
  logoUrl?: string;
  description?: string;
  website?: string;
  registeredAt: string;
  onChainConfirmed: boolean;
}

interface TokenEmissionState {
  config: TokenEmissionConfig;
  tokens: RegisteredToken[];
}

const DEFAULT_STATE: TokenEmissionState = {
  config: {
    emissionFee: 1000,
    receiverAddress: '',
    minSupply: 1,
    maxSupply: 0,
    isEnabled: true,
    updatedAt: new Date().toISOString(),
  },
  tokens: [],
};

async function loadState(): Promise<TokenEmissionState> {
  const row = await prisma.adminDataState.findUnique({ where: { key: TOKEN_EMISSION_STATE_KEY } });
  if (!row) {
    await prisma.adminDataState.create({ data: { key: TOKEN_EMISSION_STATE_KEY, data: DEFAULT_STATE } });
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  const data = row.data as Partial<TokenEmissionState>;
  return {
    config: { ...DEFAULT_STATE.config, ...(data.config || {}) },
    tokens: Array.isArray(data.tokens) ? data.tokens : [],
  };
}

async function saveState(state: TokenEmissionState): Promise<void> {
  await prisma.adminDataState.upsert({
    where: { key: TOKEN_EMISSION_STATE_KEY },
    update: { data: state },
    create: { key: TOKEN_EMISSION_STATE_KEY, data: state },
  });
}

export async function getTokenEmissionConfig(): Promise<TokenEmissionConfig> {
  return (await loadState()).config;
}

export async function updateTokenEmissionConfig(updates: Partial<TokenEmissionConfig>): Promise<TokenEmissionConfig> {
  const state = await loadState();
  state.config = { ...state.config, ...updates, updatedAt: new Date().toISOString() };
  await saveState(state);
  return state.config;
}

export async function getRegisteredTokens(): Promise<RegisteredToken[]> {
  return (await loadState()).tokens;
}

export async function getRegisteredTokensByOwner(ownerAddress: string): Promise<RegisteredToken[]> {
  return (await loadState()).tokens.filter(t => t.ownerAddress === ownerAddress);
}

export async function getRegisteredTokenByAssetId(assetId: string): Promise<RegisteredToken | null> {
  return (await loadState()).tokens.find(t => t.assetId === assetId) || null;
}

export async function registerToken(data: Omit<RegisteredToken, 'id' | 'registeredAt'>): Promise<RegisteredToken> {
  const state = await loadState();
  const token: RegisteredToken = {
    id: `tok_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    registeredAt: new Date().toISOString(),
    ...data,
  };
  state.tokens.unshift(token);
  await saveState(state);
  return token;
}

export async function confirmTokenOnChain(assetId: string): Promise<RegisteredToken | null> {
  const state = await loadState();
  const token = state.tokens.find(t => t.assetId === assetId);
  if (!token) return null;
  token.onChainConfirmed = true;
  await saveState(state);
  return token;
}
