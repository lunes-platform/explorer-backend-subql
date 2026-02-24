// Financial Configuration Store
// Centralized wallet management for all modules: Verification, Ads, Rewards

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = './data';
const FINANCIAL_FILE = join(DATA_DIR, 'financial.json');

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

let financialData: FinancialData = {
  config: DEFAULT_CONFIG,
  wallets: DEFAULT_WALLETS,
  auditLog: [],
  verificationPayments: [],
  lastUpdated: new Date().toISOString(),
};

function loadData() {
  try {
    if (existsSync(FINANCIAL_FILE)) {
      const data = JSON.parse(readFileSync(FINANCIAL_FILE, 'utf-8'));
      financialData = { ...financialData, ...data };
      if (data.config) {
        financialData.config = { ...DEFAULT_CONFIG, ...data.config };
      }
      // Migrate: ensure wallets array exists
      if (!Array.isArray(financialData.wallets) || financialData.wallets.length === 0) {
        financialData.wallets = DEFAULT_WALLETS.map(w => {
          if (w.purpose === 'verification') return { ...w, address: financialData.config.verificationWallet || w.address };
          if (w.purpose === 'ads') return { ...w, address: financialData.config.adsWallet || w.address };
          if (w.purpose === 'rewards') return { ...w, address: financialData.config.rewardsWallet || w.address };
          if (w.purpose === 'donations') return { ...w, address: financialData.config.donationsWallet || w.address };
          return w;
        });
      }
      // Migrate: add donations wallet if missing
      if (!financialData.wallets.find(w => w.purpose === 'donations')) {
        financialData.wallets.push({ purpose: 'donations', label: 'Lunes Network Donations', address: financialData.config.donationsWallet || DEFAULT_WALLET_ADDRESS, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      if (!Array.isArray(financialData.auditLog)) financialData.auditLog = [];
    }
  } catch (err) {
    console.error('[Financial] Error loading data:', err);
  }
}

function saveData() {
  try {
    financialData.lastUpdated = new Date().toISOString();
    writeFileSync(FINANCIAL_FILE, JSON.stringify(financialData, null, 2));
  } catch (err) {
    console.error('[Financial] Error saving data:', err);
  }
}

loadData();

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

function addAuditEntry(entry: Omit<WalletAuditEntry, 'id' | 'timestamp'>): WalletAuditEntry {
  const record: WalletAuditEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  financialData.auditLog.unshift(record);
  if (financialData.auditLog.length > 200) {
    financialData.auditLog = financialData.auditLog.slice(0, 200);
  }
  saveData();
  return record;
}

export function getAuditLog(limit: number = 50, purpose?: WalletPurpose): WalletAuditEntry[] {
  let log = financialData.auditLog;
  if (purpose) log = log.filter(e => e.purpose === purpose);
  return log.slice(0, limit);
}

// ─── Config API ───

export function getFinancialConfig(): FinancialConfig {
  return financialData.config;
}

export function updateFinancialConfig(updates: Partial<FinancialConfig>, changedBy: string = 'admin'): FinancialConfig {
  const prev = { ...financialData.config };
  financialData.config = { ...financialData.config, ...updates };

  // Sync wallet addresses if changed via config
  if (updates.verificationWallet && updates.verificationWallet !== prev.verificationWallet) {
    syncWalletAddress('verification', updates.verificationWallet, changedBy, prev.verificationWallet);
  }
  if (updates.adsWallet && updates.adsWallet !== prev.adsWallet) {
    syncWalletAddress('ads', updates.adsWallet, changedBy, prev.adsWallet);
  }
  if (updates.rewardsWallet && updates.rewardsWallet !== prev.rewardsWallet) {
    syncWalletAddress('rewards', updates.rewardsWallet, changedBy, prev.rewardsWallet);
  }
  if (updates.donationsWallet && updates.donationsWallet !== prev.donationsWallet) {
    syncWalletAddress('donations', updates.donationsWallet, changedBy, prev.donationsWallet);
  }

  saveData();
  return financialData.config;
}

// ─── Unified Wallet Management ───

export function getAllWallets(): ManagedWallet[] {
  return financialData.wallets;
}

export function getWalletByPurpose(purpose: WalletPurpose): ManagedWallet | undefined {
  return financialData.wallets.find(w => w.purpose === purpose);
}

function syncWalletAddress(purpose: WalletPurpose, newAddress: string, changedBy: string, previousAddress?: string) {
  const wallet = financialData.wallets.find(w => w.purpose === purpose);
  if (wallet) {
    const prev = previousAddress || wallet.address;
    wallet.address = newAddress;
    wallet.updatedAt = new Date().toISOString();
    addAuditEntry({
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
): { success: boolean; error?: string; wallet?: ManagedWallet } {
  if (!isValidSS58Address(newAddress)) {
    return { success: false, error: 'Invalid SS58 wallet address format' };
  }

  const wallet = financialData.wallets.find(w => w.purpose === purpose);
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
  if (purpose === 'verification') financialData.config.verificationWallet = newAddress;
  if (purpose === 'ads') financialData.config.adsWallet = newAddress;
  if (purpose === 'rewards') financialData.config.rewardsWallet = newAddress;
  if (purpose === 'donations') financialData.config.donationsWallet = newAddress;

  addAuditEntry({
    purpose,
    action: 'address_changed',
    previousValue: previousAddress,
    newValue: newAddress,
    changedBy,
    details: `${purpose} wallet changed from ${previousAddress.slice(0,8)}... to ${newAddress.slice(0,8)}...`,
  });

  saveData();
  return { success: true, wallet };
}

export function toggleWallet(
  purpose: WalletPurpose,
  changedBy: string
): { success: boolean; wallet?: ManagedWallet } {
  const wallet = financialData.wallets.find(w => w.purpose === purpose);
  if (!wallet) return { success: false };

  wallet.isActive = !wallet.isActive;
  wallet.updatedAt = new Date().toISOString();

  addAuditEntry({
    purpose,
    action: 'wallet_toggled',
    previousValue: String(!wallet.isActive),
    newValue: String(wallet.isActive),
    changedBy,
    details: `${purpose} wallet ${wallet.isActive ? 'activated' : 'paused'}`,
  });

  saveData();
  return { success: true, wallet };
}

// ─── Verification Payments ───

export function recordVerificationPayment(payment: Omit<VerificationPayment, 'id'>): VerificationPayment {
  const record: VerificationPayment = {
    id: `vp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    ...payment,
  };
  financialData.verificationPayments.unshift(record);
  if (financialData.verificationPayments.length > 200) {
    financialData.verificationPayments = financialData.verificationPayments.slice(0, 200);
  }
  saveData();
  return record;
}

export function updatePaymentStatus(id: string, status: 'confirmed' | 'failed'): VerificationPayment | null {
  const payment = financialData.verificationPayments.find(p => p.id === id);
  if (!payment) return null;
  payment.status = status;
  if (status === 'confirmed') payment.confirmedAt = new Date().toISOString();
  saveData();
  return payment;
}

export function getVerificationPayments(limit: number = 50): VerificationPayment[] {
  return financialData.verificationPayments.slice(0, limit);
}

export function getFinancialSummary(): FinancialSummary {
  const payments = financialData.verificationPayments;
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
