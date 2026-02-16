// Rewards System - Data Store
// Manages user points, reward claims, leaderboard, and distribution wallet

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = './data';
const REWARDS_FILE = join(DATA_DIR, 'rewards.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================================
// TYPES
// ============================================================================

export interface UserRewardData {
  address: string;
  totalPoints: number;
  availablePoints: number;
  claimedPoints: number;
  transactionCount: number;
  stakeAmount: number;
  tier: string;
  lastClaimAt: string | null;
  dailyClaims: Record<string, number>; // tokenId -> count
  history: RewardEvent[];
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RewardEvent {
  id: string;
  type: 'earned' | 'claimed' | 'bonus';
  category?: string;
  points: number;
  tokenSymbol?: string;
  tokenAmount?: number;
  description: string;
  txHash?: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  totalPoints: number;
  transactions: number;
  stakeAmount: number;
  tier: string;
  rewardsClaimed: number;
}

export interface WalletChangeLog {
  id: string;
  action: 'address_changed' | 'wallet_paused' | 'wallet_resumed' | 'wallet_renamed' | 'balance_refilled';
  previousValue?: string;
  newValue?: string;
  changedBy: string;
  timestamp: string;
  details?: string;
}

export interface RewardWallet {
  address: string;
  name: string;
  balances: Record<string, number>;
  dailyDistributed: Record<string, number>;
  totalDistributed: Record<string, number>;
  lastReset: string;
  isActive: boolean;
  changeLog: WalletChangeLog[];
}

export interface RewardGoalConfig {
  id: string;
  name: string;
  description: string;
  basePoints: number;
  cooldownHours: number;
  maxPerDay: number;
  icon: string;
  enabled: boolean;
}

export interface RewardConfig {
  minClaimPoints: number;
  claimCooldownHours: number;
  dailyLimits: Record<string, number>;
  conversionRates: Record<string, number>;
  tiers: RewardTierConfig[];
  goals: RewardGoalConfig[];
}

export interface RewardTierConfig {
  id: string;
  name: string;
  minTransactions: number;
  minStakeAmount: number;
  multiplier: number;
  badge: string;
  color: string;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: RewardConfig = {
  minClaimPoints: 100,
  claimCooldownHours: 24,
  dailyLimits: {
    lunes: 10,
    lusdt: 1,
    pidchat: 50
  },
  conversionRates: {
    lunes: 100,    // 100 points = 1 LUNES
    lusdt: 1000,   // 1000 points = 1 LUSDT
    pidchat: 500   // 500 points = 1 PIDCHAT
  },
  tiers: [
    { id: 'bronze', name: 'Bronze', minTransactions: 10, minStakeAmount: 100, multiplier: 1.0, badge: '🥉', color: '#CD7F32' },
    { id: 'silver', name: 'Silver', minTransactions: 50, minStakeAmount: 1000, multiplier: 1.5, badge: '🥈', color: '#C0C0C0' },
    { id: 'gold', name: 'Gold', minTransactions: 200, minStakeAmount: 10000, multiplier: 2.0, badge: '🥇', color: '#FFD700' },
    { id: 'platinum', name: 'Platinum', minTransactions: 500, minStakeAmount: 50000, multiplier: 3.0, badge: '💎', color: '#E5E4E2' },
    { id: 'diamond', name: 'Diamond', minTransactions: 1000, minStakeAmount: 100000, multiplier: 5.0, badge: '💠', color: '#B9F2FF' }
  ],
  goals: [
    { id: 'daily_transaction', name: 'Daily Transaction', description: 'Complete at least 1 transaction per day', basePoints: 10, cooldownHours: 24, maxPerDay: 1, icon: 'Send', enabled: true },
    { id: 'volume_transaction', name: 'Transaction Volume', description: 'Transact more than 100 LUNES in a day', basePoints: 50, cooldownHours: 24, maxPerDay: 5, icon: 'TrendingUp', enabled: true },
    { id: 'staking_deposit', name: 'Staking', description: 'Stake LUNES tokens', basePoints: 100, cooldownHours: 0, maxPerDay: 999, icon: 'Shield', enabled: true },
    { id: 'staking_duration', name: 'Long-Term Staking', description: 'Maintain stake for 30+ days', basePoints: 200, cooldownHours: 720, maxPerDay: 1, icon: 'Clock', enabled: true },
    { id: 'nft_mint', name: 'NFT Mint', description: 'Create a new NFT on the blockchain', basePoints: 150, cooldownHours: 0, maxPerDay: 10, icon: 'Image', enabled: true },
    { id: 'token_transfer', name: 'Token Transfer', description: 'Transfer ecosystem tokens', basePoints: 20, cooldownHours: 1, maxPerDay: 20, icon: 'Coins', enabled: true },
    { id: 'contract_interaction', name: 'Smart Contract Interaction', description: 'Interact with ecosystem contracts', basePoints: 30, cooldownHours: 0, maxPerDay: 50, icon: 'FileCode', enabled: true },
    { id: 'validator_nomination', name: 'Validator Nomination', description: 'Nominate a validator on the network', basePoints: 75, cooldownHours: 0, maxPerDay: 5, icon: 'Users', enabled: true }
  ]
};

const DEFAULT_WALLET: RewardWallet = {
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  name: 'Lunes Rewards Treasury',
  balances: {
    lunes: 10000,
    lusdt: 1000,
    pidchat: 50000
  },
  dailyDistributed: {
    lunes: 0,
    lusdt: 0,
    pidchat: 0
  },
  totalDistributed: {
    lunes: 0,
    lusdt: 0,
    pidchat: 0
  },
  lastReset: new Date().toISOString(),
  isActive: true,
  changeLog: []
};

// ============================================================================
// DATA STORE
// ============================================================================

interface RewardsData {
  config: RewardConfig;
  wallet: RewardWallet;
  users: Record<string, UserRewardData>;
  leaderboard: LeaderboardEntry[];
  lastUpdated: string;
}

let rewardsData: RewardsData = {
  config: DEFAULT_CONFIG,
  wallet: DEFAULT_WALLET,
  users: {},
  leaderboard: [],
  lastUpdated: new Date().toISOString()
};

// Load data from file
function loadData() {
  try {
    if (existsSync(REWARDS_FILE)) {
      const data = JSON.parse(readFileSync(REWARDS_FILE, 'utf-8'));
      rewardsData = { ...rewardsData, ...data };
      // Deep-merge config so new default fields (e.g. goals) are preserved
      if (data.config) {
        rewardsData.config = { ...DEFAULT_CONFIG, ...data.config };
      }
    }
  } catch (err) {
    console.error('[Rewards] Error loading data:', err);
  }
}

// Save data to file
function saveData() {
  try {
    writeFileSync(REWARDS_FILE, JSON.stringify(rewardsData, null, 2));
  } catch (err) {
    console.error('[Rewards] Error saving data:', err);
  }
}

// Initialize
loadData();

// ============================================================================
// USER REWARD FUNCTIONS
// ============================================================================

export function getUserRewards(address: string): UserRewardData | null {
  return rewardsData.users[address] || null;
}

export function getOrCreateUserRewards(address: string): UserRewardData {
  if (!rewardsData.users[address]) {
    rewardsData.users[address] = {
      address,
      totalPoints: 0,
      availablePoints: 0,
      claimedPoints: 0,
      transactionCount: 0,
      stakeAmount: 0,
      tier: 'bronze',
      lastClaimAt: null,
      dailyClaims: {},
      history: [],
      badges: ['bronze'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveData();
  }
  return rewardsData.users[address];
}

export function calculateTier(txCount: number, stake: number): string {
  const tiers = rewardsData.config.tiers;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (txCount >= tiers[i].minTransactions && stake >= tiers[i].minStakeAmount) {
      return tiers[i].id;
    }
  }
  return 'bronze';
}

export function getTierMultiplier(tierId: string): number {
  const tier = rewardsData.config.tiers.find(t => t.id === tierId);
  return tier?.multiplier || 1.0;
}

export function addPoints(
  address: string,
  category: string,
  basePoints: number,
  description: string,
  metadata?: Record<string, unknown>
): UserRewardData {
  const user = getOrCreateUserRewards(address);
  const tier = calculateTier(user.transactionCount, user.stakeAmount);
  const multiplier = getTierMultiplier(tier);
  const points = Math.floor(basePoints * multiplier);
  
  const event: RewardEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'earned',
    category,
    points,
    description,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  
  user.totalPoints += points;
  user.availablePoints += points;
  user.tier = tier;
  user.history.unshift(event);
  user.updatedAt = new Date().toISOString();
  
  // Limit history to 100 entries
  if (user.history.length > 100) {
    user.history = user.history.slice(0, 100);
  }
  
  saveData();
  updateLeaderboard();
  
  return user;
}

export function updateUserStats(
  address: string,
  stats: { transactionCount?: number; stakeAmount?: number }
): UserRewardData {
  const user = getOrCreateUserRewards(address);
  
  if (stats.transactionCount !== undefined) {
    user.transactionCount = stats.transactionCount;
  }
  if (stats.stakeAmount !== undefined) {
    user.stakeAmount = stats.stakeAmount;
  }
  
  // Recalculate tier
  const newTier = calculateTier(user.transactionCount, user.stakeAmount);
  if (newTier !== user.tier) {
    user.tier = newTier;
    if (!user.badges.includes(newTier)) {
      user.badges.push(newTier);
    }
  }
  
  user.updatedAt = new Date().toISOString();
  saveData();
  updateLeaderboard();
  
  return user;
}

// ============================================================================
// CLAIM FUNCTIONS
// ============================================================================

export interface ClaimResult {
  success: boolean;
  error?: string;
  pointsUsed?: number;
  tokensReceived?: number;
  tokenSymbol?: string;
  txHash?: string;
}

export function claimRewards(
  address: string,
  tokenId: 'lunes' | 'lusdt' | 'pidchat'
): ClaimResult {
  const user = getUserRewards(address);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  const config = rewardsData.config;
  const wallet = rewardsData.wallet;
  
  // Check minimum points
  if (user.availablePoints < config.minClaimPoints) {
    return { 
      success: false, 
      error: `Minimum ${config.minClaimPoints} points required. You have ${user.availablePoints}.` 
    };
  }
  
  // Check cooldown
  if (user.lastClaimAt) {
    const hoursSinceLastClaim = (Date.now() - new Date(user.lastClaimAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastClaim < config.claimCooldownHours) {
      const hoursRemaining = Math.ceil(config.claimCooldownHours - hoursSinceLastClaim);
      return { success: false, error: `Claim cooldown: ${hoursRemaining} hours remaining` };
    }
  }
  
  // Check daily limit
  const dailyClaims = user.dailyClaims[tokenId] || 0;
  const dailyLimit = config.dailyLimits[tokenId] || 0;
  if (dailyClaims >= dailyLimit) {
    return { success: false, error: `Daily limit of ${dailyLimit} ${tokenId.toUpperCase()} reached` };
  }
  
  // Check wallet balance
  const conversionRate = config.conversionRates[tokenId];
  const tokensToReceive = Math.floor(user.availablePoints / conversionRate);
  const walletBalance = wallet.balances[tokenId] || 0;
  
  if (tokensToReceive <= 0) {
    return { success: false, error: 'Insufficient points for claim' };
  }
  
  if (tokensToReceive > walletBalance) {
    return { success: false, error: 'Reward wallet balance insufficient. Contact admin.' };
  }
  
  // Process claim
  const pointsUsed = tokensToReceive * conversionRate;
  
  user.availablePoints -= pointsUsed;
  user.claimedPoints += pointsUsed;
  user.lastClaimAt = new Date().toISOString();
  user.dailyClaims[tokenId] = dailyClaims + tokensToReceive;
  
  const claimEvent: RewardEvent = {
    id: `claim_${Date.now()}`,
    type: 'claimed',
    points: -pointsUsed,
    tokenSymbol: tokenId.toUpperCase(),
    tokenAmount: tokensToReceive,
    description: `Claimed ${tokensToReceive} ${tokenId.toUpperCase()}`,
    timestamp: new Date().toISOString()
  };
  
  user.history.unshift(claimEvent);
  user.updatedAt = new Date().toISOString();
  
  // Update wallet
  wallet.balances[tokenId] -= tokensToReceive;
  wallet.dailyDistributed[tokenId] = (wallet.dailyDistributed[tokenId] || 0) + tokensToReceive;
  wallet.totalDistributed[tokenId] = (wallet.totalDistributed[tokenId] || 0) + tokensToReceive;
  
  saveData();
  
  return {
    success: true,
    pointsUsed,
    tokensReceived: tokensToReceive,
    tokenSymbol: tokenId.toUpperCase(),
    txHash: `0x${Math.random().toString(16).substr(2, 64)}` // Simulated tx hash
  };
}

// ============================================================================
// LEADERBOARD FUNCTIONS
// ============================================================================

export function updateLeaderboard(): LeaderboardEntry[] {
  const users = Object.values(rewardsData.users);
  
  const entries = users.map(user => ({
    rank: 0,
    address: user.address,
    totalPoints: user.totalPoints,
    transactions: user.transactionCount,
    stakeAmount: user.stakeAmount,
    tier: user.tier,
    rewardsClaimed: user.claimedPoints
  }));
  
  // Sort by total points descending
  entries.sort((a, b) => b.totalPoints - a.totalPoints);
  
  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  rewardsData.leaderboard = entries.slice(0, 100); // Top 100
  rewardsData.lastUpdated = new Date().toISOString();
  saveData();
  
  return rewardsData.leaderboard;
}

export function getLeaderboard(limit: number = 50): LeaderboardEntry[] {
  // Always rebuild dynamically from users if we have users but empty leaderboard
  if (rewardsData.leaderboard.length === 0 && Object.keys(rewardsData.users).length > 0) {
    updateLeaderboard();
  }
  return rewardsData.leaderboard.slice(0, limit);
}

// Seed users from indexer GraphQL data (accounts + transfers)
const INDEXER_URL = process.env.INDEXER_URL || 'http://localhost:3000';

export async function seedFromIndexer(): Promise<number> {
  try {
    // 1. Fetch accounts with balances
    const accountsRes = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ accounts(first: 100) { nodes { id balance sentTransfersCount receivedTransfersCount } } }`
      })
    });
    const accountsData = await accountsRes.json();
    const accounts = accountsData?.data?.accounts?.nodes || [];

    // 2. Fetch recent transfers to count per-address tx activity
    const transfersRes = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ transfers(first: 500, orderBy: BLOCK_NUMBER_DESC) { nodes { fromId toId amount blockNumber } } }`
      })
    });
    const transfersData = await transfersRes.json();
    const transfers = transfersData?.data?.transfers?.nodes || [];

    // Count transactions per address from transfers
    const txCounts: Record<string, number> = {};
    const totalVolume: Record<string, number> = {};
    for (const tx of transfers) {
      txCounts[tx.fromId] = (txCounts[tx.fromId] || 0) + 1;
      txCounts[tx.toId] = (txCounts[tx.toId] || 0) + 1;
      const amt = parseFloat(tx.amount) / 1e8; // Convert from planck
      totalVolume[tx.fromId] = (totalVolume[tx.fromId] || 0) + amt;
      totalVolume[tx.toId] = (totalVolume[tx.toId] || 0) + amt;
    }

    let seeded = 0;

    // 3. Create/update reward users from accounts
    for (const acc of accounts) {
      const address = acc.id;
      const balance = parseFloat(acc.balance) / 1e8;
      const txCount = (acc.sentTransfersCount || 0) + (acc.receivedTransfersCount || 0) + (txCounts[address] || 0);
      
      // Skip completely empty accounts
      if (txCount === 0 && balance === 0) continue;

      const user = getOrCreateUserRewards(address);
      
      // Update stats if indexer has more data
      if (txCount > user.transactionCount) {
        user.transactionCount = txCount;
      }
      if (balance > user.stakeAmount) {
        user.stakeAmount = balance;
      }

      // Award base points for on-chain activity if user has 0 points
      if (user.totalPoints === 0 && (txCount > 0 || balance > 0)) {
        const txPoints = txCount * 10;
        const balancePoints = Math.floor(balance / 100); // 1 point per 100 LUNES held
        const basePoints = Math.max(txPoints + balancePoints, 1);
        user.totalPoints = basePoints;
        user.availablePoints = basePoints;
      }

      // Recalculate tier
      user.tier = calculateTier(user.transactionCount, user.stakeAmount);
      user.updatedAt = new Date().toISOString();
      seeded++;
    }

    // 4. Also seed from transfer addresses not in accounts
    const allAddresses = new Set([...Object.keys(txCounts)]);
    for (const address of allAddresses) {
      if (rewardsData.users[address]) continue; // Already processed
      const txCount = txCounts[address] || 0;
      if (txCount === 0) continue;

      const user = getOrCreateUserRewards(address);
      user.transactionCount = txCount;
      if (user.totalPoints === 0) {
        user.totalPoints = txCount * 10;
        user.availablePoints = txCount * 10;
      }
      user.tier = calculateTier(user.transactionCount, user.stakeAmount);
      user.updatedAt = new Date().toISOString();
      seeded++;
    }

    if (seeded > 0) {
      saveData();
      updateLeaderboard();
    }

    console.log(`[Rewards] Seeded ${seeded} users from indexer`);
    return seeded;
  } catch (err) {
    console.error('[Rewards] Error seeding from indexer:', err);
    return 0;
  }
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

export function getWallet(): RewardWallet {
  // Reset daily counters if needed
  const lastReset = new Date(rewardsData.wallet.lastReset);
  const now = new Date();
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceReset >= 24) {
    rewardsData.wallet.dailyDistributed = { lunes: 0, lusdt: 0, pidchat: 0 };
    rewardsData.wallet.lastReset = now.toISOString();
    saveData();
  }
  
  return rewardsData.wallet;
}

export function updateWallet(updates: Partial<RewardWallet>): RewardWallet {
  rewardsData.wallet = { ...rewardsData.wallet, ...updates };
  saveData();
  return rewardsData.wallet;
}

export function refillWallet(tokenId: string, amount: number, changedBy?: string): RewardWallet {
  rewardsData.wallet.balances[tokenId] = (rewardsData.wallet.balances[tokenId] || 0) + amount;
  if (!rewardsData.wallet.changeLog) rewardsData.wallet.changeLog = [];
  rewardsData.wallet.changeLog.unshift({
    id: `log_${Date.now()}`,
    action: 'balance_refilled',
    newValue: `+${amount} ${tokenId.toUpperCase()}`,
    changedBy: changedBy || 'admin',
    timestamp: new Date().toISOString(),
    details: `New balance: ${rewardsData.wallet.balances[tokenId]} ${tokenId.toUpperCase()}`
  });
  if (rewardsData.wallet.changeLog.length > 50) {
    rewardsData.wallet.changeLog = rewardsData.wallet.changeLog.slice(0, 50);
  }
  saveData();
  return rewardsData.wallet;
}

// ─── Secure Wallet Management ───

export function changeWalletAddress(newAddress: string, changedBy: string, confirmPassword?: string): { success: boolean; error?: string; wallet?: RewardWallet } {
  if (!newAddress || newAddress.length < 30) {
    return { success: false, error: 'Invalid wallet address format' };
  }
  if (newAddress === rewardsData.wallet.address) {
    return { success: false, error: 'New address is the same as current' };
  }

  const previousAddress = rewardsData.wallet.address;
  if (!rewardsData.wallet.changeLog) rewardsData.wallet.changeLog = [];
  rewardsData.wallet.changeLog.unshift({
    id: `log_${Date.now()}`,
    action: 'address_changed',
    previousValue: previousAddress,
    newValue: newAddress,
    changedBy,
    timestamp: new Date().toISOString(),
    details: `Distribution address changed from ${previousAddress.slice(0, 8)}...${previousAddress.slice(-6)} to ${newAddress.slice(0, 8)}...${newAddress.slice(-6)}`
  });
  rewardsData.wallet.address = newAddress;
  saveData();
  return { success: true, wallet: rewardsData.wallet };
}

export function changeWalletName(newName: string, changedBy: string): { success: boolean; wallet?: RewardWallet } {
  const previousName = rewardsData.wallet.name;
  if (!rewardsData.wallet.changeLog) rewardsData.wallet.changeLog = [];
  rewardsData.wallet.changeLog.unshift({
    id: `log_${Date.now()}`,
    action: 'wallet_renamed',
    previousValue: previousName,
    newValue: newName,
    changedBy,
    timestamp: new Date().toISOString()
  });
  rewardsData.wallet.name = newName;
  saveData();
  return { success: true, wallet: rewardsData.wallet };
}

export function toggleWalletActive(changedBy: string): { success: boolean; wallet: RewardWallet } {
  const wasActive = rewardsData.wallet.isActive;
  rewardsData.wallet.isActive = !wasActive;
  if (!rewardsData.wallet.changeLog) rewardsData.wallet.changeLog = [];
  rewardsData.wallet.changeLog.unshift({
    id: `log_${Date.now()}`,
    action: wasActive ? 'wallet_paused' : 'wallet_resumed',
    changedBy,
    timestamp: new Date().toISOString(),
    details: wasActive ? 'Distribution paused' : 'Distribution resumed'
  });
  saveData();
  return { success: true, wallet: rewardsData.wallet };
}

export function getWalletChangeLog(): WalletChangeLog[] {
  return rewardsData.wallet.changeLog || [];
}

export function getConfig(): RewardConfig {
  return rewardsData.config;
}

export function updateConfig(updates: Partial<RewardConfig>): RewardConfig {
  rewardsData.config = { ...rewardsData.config, ...updates };
  saveData();
  return rewardsData.config;
}

export function getStats() {
  const users = Object.values(rewardsData.users);
  return {
    totalUsers: users.length,
    totalPointsDistributed: users.reduce((sum, u) => sum + u.totalPoints, 0),
    totalPointsClaimed: users.reduce((sum, u) => sum + u.claimedPoints, 0),
    walletBalance: rewardsData.wallet.balances,
    walletDistributed: rewardsData.wallet.totalDistributed,
    lastUpdated: rewardsData.lastUpdated
  };
}

// Daily reset (call this periodically)
export function resetDailyCounters() {
  const now = new Date().toISOString();
  
  Object.values(rewardsData.users).forEach(user => {
    user.dailyClaims = {};
    user.updatedAt = now;
  });
  
  rewardsData.wallet.dailyDistributed = { lunes: 0, lusdt: 0, pidchat: 0 };
  rewardsData.wallet.lastReset = now;
  
  saveData();
}

// Auto-save every 5 minutes
setInterval(saveData, 5 * 60 * 1000);
