// Financial Configuration Store
// Centralized wallet management for all modules: Verification, Ads, Rewards

import prisma from './prismaClient.ts';

// ─── Wallet Types ───

export type WalletPurpose = 'verification' | 'ads' | 'rewards' | 'donations';

export interface ManagedWallet {
  purpose: WalletPurpose;
  label: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const FINANCIAL_STATE_KEY = 'financial';

export interface WalletAuditEntry {
  id: string;
  purpose: WalletPurpose;
  action: 'address_changed' | 'wallet_created' | 'wallet_toggled' | 'config_changed';
  previousValue?: string;
  newValue?: string;
  changedBy: string;
  timestamp: string;
  ip?: string;
  details?: string;
}

export interface FinancialConfig {
  verificationWallet: string;
  verificationFee: number;
  verificationFeePlanckMultiplier: number;
  adsWallet: string;
  rewardsWallet: string;
  donationsWallet: string;
}

export interface VerificationPayment {
  id: string;
  projectSlug: string;
  projectName: string;
  payerAddress: string;
  receiverAddress: string;
  amount: number;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  submittedAt: string;
  confirmedAt?: string;
}

export interface FinancialSummary {
  totalVerificationIncome: number;
  totalVerificationsCompleted: number;
  totalVerificationsPending: number;
  totalRewardsDistributed: number;
  recentPayments: VerificationPayment[];
}

interface FinancialData {
  config: FinancialConfig;
  wallets: ManagedWallet[];
  auditLog: WalletAuditEntry[];
  verificationPayments: VerificationPayment[];
  lastUpdated: string;
}

const DEFAULT_WALLET_ADDRESS = '5C8Kq8Wd1ZqQJSdZiGNAcbYGmyJy5cKjFg2BgPFEH2EFeXZU';
const DEFAULT_REWARDS_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

const DEFAULT_CONFIG: FinancialConfig = {
  verificationWallet: DEFAULT_WALLET_ADDRESS,
  verificationFee: 1000,
  verificationFeePlanckMultiplier: 1e8,
  adsWallet: DEFAULT_WALLET_ADDRESS,
  rewardsWallet: DEFAULT_REWARDS_ADDRESS,
  donationsWallet: DEFAULT_WALLET_ADDRESS,
};

const DEFAULT_WALLETS: ManagedWallet[] = [
  { purpose: 'verification', label: 'Project Verification (KYC)', address: DEFAULT_WALLET_ADDRESS, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { purpose: 'ads', label: 'Ad Payments', address: DEFAULT_WALLET_ADDRESS, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { purpose: 'rewards', label: 'Rewards Distribution', address: DEFAULT_REWARDS_ADDRESS, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { purpose: 'donations', label: 'Lunes Network Donations', address: DEFAULT_WALLET_ADDRESS, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

function createDefaultState(): FinancialData {
  return {
    config: { ...DEFAULT_CONFIG },
    wallets: JSON.parse(JSON.stringify(DEFAULT_WALLETS)),
    auditLog: [],
    verificationPayments: [],
    lastUpdated: new Date().toISOString(),
  };
}

function normalizeState(data: Partial<FinancialData>): FinancialData {
  const config: FinancialConfig = { ...DEFAULT_CONFIG, ...(data.config || {}) };
  let wallets = Array.isArray(data.wallets) ? data.wallets : [];

  if (wallets.length === 0) {
    wallets = DEFAULT_WALLETS.map((w) => {
      if (w.purpose === 'verification') return { ...w, address: config.verificationWallet || w.address };
      if (w.purpose === 'ads') return { ...w, address: config.adsWallet || w.address };
      if (w.purpose === 'rewards') return { ...w, address: config.rewardsWallet || w.address };
      if (w.purpose === 'donations') return { ...w, address: config.donationsWallet || w.address };
      return w;
    });
  }

  if (!wallets.find((w) => w.purpose === 'donations')) {
    wallets.push({
      purpose: 'donations',
      label: 'Lunes Network Donations',
      address: config.donationsWallet || DEFAULT_WALLET_ADDRESS,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    config,
    wallets,
    auditLog: Array.isArray(data.auditLog) ? data.auditLog : [],
    verificationPayments: Array.isArray(data.verificationPayments) ? data.verificationPayments : [],
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  };
}

async function loadState(): Promise<FinancialData> {
  const row = await prisma.adminDataState.findUnique({ where: { key: FINANCIAL_STATE_KEY } });
  if (!row) {
    const initial = createDefaultState();
    await prisma.adminDataState.create({
      data: { key: FINANCIAL_STATE_KEY, data: initial },
    });
    return initial;
  }

  return normalizeState((row.data as Partial<FinancialData>) || {});
}

async function saveState(state: FinancialData): Promise<void> {
  state.lastUpdated = new Date().toISOString();
  await prisma.adminDataState.upsert({
    where: { key: FINANCIAL_STATE_KEY },
    update: { data: state },
    create: { key: FINANCIAL_STATE_KEY, data: state },
  });
}

// ─── Public API ───

// ─── SS58 Address Validation ───

export function isValidSS58Address(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length < 30 || address.length > 60) return false;
  // SS58 addresses start with 1-9 or A-Z (not 0, I, O, l)
  if (!/^[1-9A-HJ-NP-Za-km-z]{30,60}$/.test(address)) return false;
  return true;
}

// ─── Audit Log ───

async function addAuditEntry(
  state: FinancialData,
  entry: Omit<WalletAuditEntry, 'id' | 'timestamp'>,
): Promise<WalletAuditEntry> {
  const record: WalletAuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  state.auditLog.unshift(record);
  if (state.auditLog.length > 200) {
    state.auditLog = state.auditLog.slice(0, 200);
  }
  await saveState(state);
  return record;
}

export async function getAuditLog(limit: number = 50, purpose?: WalletPurpose): Promise<WalletAuditEntry[]> {
  const state = await loadState();
  let log = state.auditLog;
  if (purpose) log = log.filter(e => e.purpose === purpose);
  return log.slice(0, limit);
}

// ─── Config API ───

export async function getFinancialConfig(): Promise<FinancialConfig> {
  return (await loadState()).config;
}

export async function updateFinancialConfig(updates: Partial<FinancialConfig>, changedBy: string = 'admin'): Promise<FinancialConfig> {
  const state = await loadState();
  const prev = { ...state.config };
  state.config = { ...state.config, ...updates };

  // Sync wallet addresses if changed via config
  if (updates.verificationWallet && updates.verificationWallet !== prev.verificationWallet) {
    await syncWalletAddress(state, 'verification', updates.verificationWallet, changedBy, prev.verificationWallet);
  }
  if (updates.adsWallet && updates.adsWallet !== prev.adsWallet) {
    await syncWalletAddress(state, 'ads', updates.adsWallet, changedBy, prev.adsWallet);
  }
  if (updates.rewardsWallet && updates.rewardsWallet !== prev.rewardsWallet) {
    await syncWalletAddress(state, 'rewards', updates.rewardsWallet, changedBy, prev.rewardsWallet);
  }
  if (updates.donationsWallet && updates.donationsWallet !== prev.donationsWallet) {
    await syncWalletAddress(state, 'donations', updates.donationsWallet, changedBy, prev.donationsWallet);
  }

  await saveState(state);
  return state.config;
}

// ─── Unified Wallet Management ───

export async function getAllWallets(): Promise<ManagedWallet[]> {
  return (await loadState()).wallets;
}

export async function getWalletByPurpose(purpose: WalletPurpose): Promise<ManagedWallet | undefined> {
  return (await loadState()).wallets.find(w => w.purpose === purpose);
}

async function syncWalletAddress(
  state: FinancialData,
  purpose: WalletPurpose,
  newAddress: string,
  changedBy: string,
  previousAddress?: string,
) {
  const wallet = state.wallets.find(w => w.purpose === purpose);
  if (wallet) {
    const prev = previousAddress || wallet.address;
    wallet.address = newAddress;
    wallet.updatedAt = new Date().toISOString();
    await addAuditEntry(state, {
      purpose,
      action: 'address_changed',
      previousValue: prev,
      newValue: newAddress,
      changedBy,
      details: `${purpose} wallet changed from ${prev.slice(0,8)}... to ${newAddress.slice(0,8)}...`,
    });
  }
}

export function updateWalletAddress(
  purpose: WalletPurpose,
  newAddress: string,
  changedBy: string
): Promise<{ success: boolean; error?: string; wallet?: ManagedWallet }> {
  return updateWalletAddressInternal(purpose, newAddress, changedBy);
}

async function updateWalletAddressInternal(
  purpose: WalletPurpose,
  newAddress: string,
  changedBy: string,
): Promise<{ success: boolean; error?: string; wallet?: ManagedWallet }> {
  if (!isValidSS58Address(newAddress)) {
    return { success: false, error: 'Invalid SS58 wallet address format' };
  }

  const state = await loadState();
  const wallet = state.wallets.find(w => w.purpose === purpose);
  if (!wallet) {
    return { success: false, error: `Wallet purpose '${purpose}' not found` };
  }

  if (wallet.address === newAddress) {
    return { success: false, error: 'New address is the same as current' };
  }

  const previousAddress = wallet.address;
  wallet.address = newAddress;
  wallet.updatedAt = new Date().toISOString();

  // Sync to config
  if (purpose === 'verification') state.config.verificationWallet = newAddress;
  if (purpose === 'ads') state.config.adsWallet = newAddress;
  if (purpose === 'rewards') state.config.rewardsWallet = newAddress;
  if (purpose === 'donations') state.config.donationsWallet = newAddress;

  await addAuditEntry(state, {
    purpose,
    action: 'address_changed',
    previousValue: previousAddress,
    newValue: newAddress,
    changedBy,
    details: `${purpose} wallet changed from ${previousAddress.slice(0,8)}... to ${newAddress.slice(0,8)}...`,
  });

  await saveState(state);
  return { success: true, wallet };
}

export function toggleWallet(
  purpose: WalletPurpose,
  changedBy: string
): Promise<{ success: boolean; wallet?: ManagedWallet }> {
  return toggleWalletInternal(purpose, changedBy);
}

async function toggleWalletInternal(
  purpose: WalletPurpose,
  changedBy: string,
): Promise<{ success: boolean; wallet?: ManagedWallet }> {
  const state = await loadState();
  const wallet = state.wallets.find(w => w.purpose === purpose);
  if (!wallet) return { success: false };

  wallet.isActive = !wallet.isActive;
  wallet.updatedAt = new Date().toISOString();

  await addAuditEntry(state, {
    purpose,
    action: 'wallet_toggled',
    previousValue: String(!wallet.isActive),
    newValue: String(wallet.isActive),
    changedBy,
    details: `${purpose} wallet ${wallet.isActive ? 'activated' : 'paused'}`,
  });

  await saveState(state);
  return { success: true, wallet };
}

// ─── Verification Payments ───

export async function recordVerificationPayment(payment: Omit<VerificationPayment, 'id'>): Promise<VerificationPayment> {
  const state = await loadState();
  const record: VerificationPayment = {
    id: `vp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    ...payment,
  };
  state.verificationPayments.unshift(record);
  if (state.verificationPayments.length > 200) {
    state.verificationPayments = state.verificationPayments.slice(0, 200);
  }
  await saveState(state);
  return record;
}

export async function updatePaymentStatus(id: string, status: 'confirmed' | 'failed'): Promise<VerificationPayment | null> {
  const state = await loadState();
  const payment = state.verificationPayments.find(p => p.id === id);
  if (!payment) return null;
  payment.status = status;
  if (status === 'confirmed') payment.confirmedAt = new Date().toISOString();
  await saveState(state);
  return payment;
}

export async function getVerificationPayments(limit: number = 50): Promise<VerificationPayment[]> {
  return (await loadState()).verificationPayments.slice(0, limit);
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const payments = (await loadState()).verificationPayments;
  const confirmed = payments.filter(p => p.status === 'confirmed');
  const pending = payments.filter(p => p.status === 'pending');

  return {
    totalVerificationIncome: confirmed.reduce((sum, p) => sum + p.amount, 0),
    totalVerificationsCompleted: confirmed.length,
    totalVerificationsPending: pending.length,
    totalRewardsDistributed: 0, // Will be enriched from rewards store
    recentPayments: payments.slice(0, 10),
  };
}
