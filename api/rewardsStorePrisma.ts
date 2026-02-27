import prisma from './prismaClient.ts';

export interface UserRewardData {
  address: string;
  totalPoints: number;
  availablePoints: number;
  claimedPoints: number;
  transactionCount: number;
  stakeAmount: number;
  tier: string;
  lastClaimAt: string | null;
  dailyClaims: Record<string, number>;
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

export interface RewardTierConfig {
  id: string;
  name: string;
  minTransactions: number;
  minStakeAmount: number;
  multiplier: number;
  badge: string;
  color: string;
}

export interface RewardConfig {
  minClaimPoints: number;
  claimCooldownHours: number;
  rewardToken: 'lunes' | 'lusdt' | 'pidchat';
  conversionRate: number;
  dailyLimit: number;
  dailyLimits: Record<string, number>;
  conversionRates: Record<string, number>;
  tiers: RewardTierConfig[];
  goals: RewardGoalConfig[];
}

export interface ClaimResult {
  success: boolean;
  error?: string;
  pointsUsed?: number;
  tokensReceived?: number;
  tokenSymbol?: string;
  txHash?: string;
}

interface RewardsData {
  config: RewardConfig;
  wallet: RewardWallet;
  users: Record<string, UserRewardData>;
  leaderboard: LeaderboardEntry[];
  lastUpdated: string;
}

const REWARDS_STATE_KEY = 'rewards';
const INDEXER_URL = process.env.INDEXER_URL || 'http://localhost:3000';

const DEFAULT_CONFIG: RewardConfig = {
  minClaimPoints: 100,
  claimCooldownHours: 24,
  rewardToken: 'lunes',
  conversionRate: 100,
  dailyLimit: 10,
  dailyLimits: { lunes: 10, lusdt: 1, pidchat: 50 },
  conversionRates: { lunes: 100, lusdt: 1000, pidchat: 500 },
  tiers: [
    { id: 'bronze', name: 'Bronze', minTransactions: 10, minStakeAmount: 100, multiplier: 1.0, badge: '🥉', color: '#CD7F32' },
    { id: 'silver', name: 'Silver', minTransactions: 50, minStakeAmount: 1000, multiplier: 1.5, badge: '🥈', color: '#C0C0C0' },
    { id: 'gold', name: 'Gold', minTransactions: 200, minStakeAmount: 10000, multiplier: 2.0, badge: '🥇', color: '#FFD700' },
    { id: 'platinum', name: 'Platinum', minTransactions: 500, minStakeAmount: 50000, multiplier: 3.0, badge: '💎', color: '#E5E4E2' },
    { id: 'diamond', name: 'Diamond', minTransactions: 1000, minStakeAmount: 100000, multiplier: 5.0, badge: '💠', color: '#B9F2FF' },
  ],
  goals: [
    { id: 'daily_transaction', name: 'Daily Transaction', description: 'Complete at least 1 transaction per day', basePoints: 10, cooldownHours: 24, maxPerDay: 1, icon: 'Send', enabled: true },
    { id: 'volume_transaction', name: 'Transaction Volume', description: 'Transact more than 100 LUNES in a day', basePoints: 50, cooldownHours: 24, maxPerDay: 5, icon: 'TrendingUp', enabled: true },
    { id: 'staking_deposit', name: 'Staking', description: 'Stake LUNES tokens', basePoints: 100, cooldownHours: 0, maxPerDay: 999, icon: 'Shield', enabled: true },
    { id: 'staking_duration', name: 'Long-Term Staking', description: 'Maintain stake for 30+ days', basePoints: 200, cooldownHours: 720, maxPerDay: 1, icon: 'Clock', enabled: true },
  ],
};

const DEFAULT_WALLET: RewardWallet = {
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  name: 'Lunes Rewards Treasury',
  balances: { lunes: 10000, lusdt: 1000, pidchat: 50000 },
  dailyDistributed: { lunes: 0, lusdt: 0, pidchat: 0 },
  totalDistributed: { lunes: 0, lusdt: 0, pidchat: 0 },
  lastReset: new Date().toISOString(),
  isActive: true,
  changeLog: [],
};

function defaultState(): RewardsData {
  return {
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    wallet: JSON.parse(JSON.stringify(DEFAULT_WALLET)),
    users: {},
    leaderboard: [],
    lastUpdated: new Date().toISOString(),
  };
}

function normalizeState(data: Partial<RewardsData>): RewardsData {
  return {
    config: { ...DEFAULT_CONFIG, ...(data.config || {}) },
    wallet: { ...DEFAULT_WALLET, ...(data.wallet || {}) },
    users: data.users || {},
    leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  };
}

async function loadState(): Promise<RewardsData> {
  const row = await prisma.adminDataState.findUnique({ where: { key: REWARDS_STATE_KEY } });
  if (!row) {
    const initial = defaultState();
    await prisma.adminDataState.create({ data: { key: REWARDS_STATE_KEY, data: initial } });
    return initial;
  }
  return normalizeState((row.data as Partial<RewardsData>) || {});
}

async function saveState(state: RewardsData): Promise<void> {
  state.lastUpdated = new Date().toISOString();
  await prisma.adminDataState.upsert({
    where: { key: REWARDS_STATE_KEY },
    update: { data: state },
    create: { key: REWARDS_STATE_KEY, data: state },
  });
}

function calculateTier(config: RewardConfig, txCount: number, stake: number): string {
  const tiers = config.tiers;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (txCount >= tiers[i].minTransactions && stake >= tiers[i].minStakeAmount) return tiers[i].id;
  }
  return 'bronze';
}

function getTierMultiplier(config: RewardConfig, tierId: string): number {
  return config.tiers.find((t) => t.id === tierId)?.multiplier || 1.0;
}

async function getOrCreateInternal(state: RewardsData, address: string): Promise<UserRewardData> {
  if (!state.users[address]) {
    state.users[address] = {
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
      updatedAt: new Date().toISOString(),
    };
    await saveState(state);
  }
  return state.users[address];
}

function rebuildLeaderboard(state: RewardsData): LeaderboardEntry[] {
  const entries = Object.values(state.users)
    .map((user) => ({
      rank: 0,
      address: user.address,
      totalPoints: user.totalPoints,
      transactions: user.transactionCount,
      stakeAmount: user.stakeAmount,
      tier: user.tier,
      rewardsClaimed: user.claimedPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  state.leaderboard = entries.slice(0, 100);
  return state.leaderboard;
}

export async function getUserRewards(address: string): Promise<UserRewardData | null> {
  const state = await loadState();
  return state.users[address] || null;
}

export async function getOrCreateUserRewards(address: string): Promise<UserRewardData> {
  const state = await loadState();
  return getOrCreateInternal(state, address);
}

export async function addPoints(address: string, category: string, basePoints: number, description: string, metadata?: Record<string, unknown>): Promise<UserRewardData> {
  const state = await loadState();
  const user = await getOrCreateInternal(state, address);
  const tier = calculateTier(state.config, user.transactionCount, user.stakeAmount);
  const points = Math.floor(basePoints * getTierMultiplier(state.config, tier));

  user.totalPoints += points;
  user.availablePoints += points;
  user.tier = tier;
  user.history.unshift({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type: 'earned',
    category,
    points,
    description,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
  if (user.history.length > 100) user.history = user.history.slice(0, 100);
  user.updatedAt = new Date().toISOString();

  rebuildLeaderboard(state);
  await saveState(state);
  return user;
}

export async function updateUserStats(address: string, stats: { transactionCount?: number; stakeAmount?: number }): Promise<UserRewardData> {
  const state = await loadState();
  const user = await getOrCreateInternal(state, address);

  if (stats.transactionCount !== undefined) user.transactionCount = stats.transactionCount;
  if (stats.stakeAmount !== undefined) user.stakeAmount = stats.stakeAmount;

  const newTier = calculateTier(state.config, user.transactionCount, user.stakeAmount);
  if (newTier !== user.tier) {
    user.tier = newTier;
    if (!user.badges.includes(newTier)) user.badges.push(newTier);
  }

  user.updatedAt = new Date().toISOString();
  rebuildLeaderboard(state);
  await saveState(state);
  return user;
}

export async function claimRewards(address: string): Promise<ClaimResult> {
  const state = await loadState();
  const user = state.users[address];
  if (!user) return { success: false, error: 'User not found' };

  const tokenId = state.config.rewardToken;
  if (user.availablePoints < state.config.minClaimPoints) {
    return { success: false, error: `Minimum ${state.config.minClaimPoints} points required. You have ${user.availablePoints}.` };
  }

  if (user.lastClaimAt) {
    const hours = (Date.now() - new Date(user.lastClaimAt).getTime()) / (1000 * 60 * 60);
    if (hours < state.config.claimCooldownHours) {
      return { success: false, error: `Claim cooldown: ${Math.ceil(state.config.claimCooldownHours - hours)} hours remaining` };
    }
  }

  const dailyClaims = user.dailyClaims[tokenId] || 0;
  if (dailyClaims >= state.config.dailyLimit) {
    return { success: false, error: `Daily limit of ${state.config.dailyLimit} ${tokenId.toUpperCase()} reached` };
  }

  const tokensToReceive = Math.floor(user.availablePoints / state.config.conversionRate);
  const walletBalance = state.wallet.balances[tokenId] || 0;
  if (tokensToReceive <= 0) return { success: false, error: 'Insufficient points for claim' };
  if (tokensToReceive > walletBalance) return { success: false, error: 'Reward wallet balance insufficient. Contact admin.' };

  const pointsUsed = tokensToReceive * state.config.conversionRate;
  user.availablePoints -= pointsUsed;
  user.claimedPoints += pointsUsed;
  user.lastClaimAt = new Date().toISOString();
  user.dailyClaims[tokenId] = dailyClaims + tokensToReceive;
  user.history.unshift({
    id: `claim_${Date.now()}`,
    type: 'claimed',
    points: -pointsUsed,
    tokenSymbol: tokenId.toUpperCase(),
    tokenAmount: tokensToReceive,
    description: `Claimed ${tokensToReceive} ${tokenId.toUpperCase()}`,
    timestamp: new Date().toISOString(),
  });
  user.updatedAt = new Date().toISOString();

  state.wallet.balances[tokenId] -= tokensToReceive;
  state.wallet.dailyDistributed[tokenId] = (state.wallet.dailyDistributed[tokenId] || 0) + tokensToReceive;
  state.wallet.totalDistributed[tokenId] = (state.wallet.totalDistributed[tokenId] || 0) + tokensToReceive;

  await saveState(state);
  return {
    success: true,
    pointsUsed,
    tokensReceived: tokensToReceive,
    tokenSymbol: tokenId.toUpperCase(),
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
  };
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const state = await loadState();
  if (state.leaderboard.length === 0 && Object.keys(state.users).length > 0) {
    rebuildLeaderboard(state);
    await saveState(state);
  }
  return state.leaderboard.slice(0, limit);
}

export async function seedFromIndexer(): Promise<number> {
  try {
    const accountsRes = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `{ accounts(first: 100) { nodes { id balance sentTransfersCount receivedTransfersCount } } }` }),
    });
    const transfersRes = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `{ transfers(first: 500, orderBy: BLOCK_NUMBER_DESC) { nodes { fromId toId amount } } }` }),
    });

    const accounts = (await accountsRes.json())?.data?.accounts?.nodes || [];
    const transfers = (await transfersRes.json())?.data?.transfers?.nodes || [];

    const state = await loadState();
    const txCounts: Record<string, number> = {};
    for (const tx of transfers) {
      txCounts[tx.fromId] = (txCounts[tx.fromId] || 0) + 1;
      txCounts[tx.toId] = (txCounts[tx.toId] || 0) + 1;
    }

    let seeded = 0;
    for (const acc of accounts) {
      const address = acc.id;
      const balance = parseFloat(acc.balance) / 1e8;
      const txCount = (acc.sentTransfersCount || 0) + (acc.receivedTransfersCount || 0) + (txCounts[address] || 0);
      if (txCount === 0 && balance === 0) continue;

      const user = await getOrCreateInternal(state, address);
      if (txCount > user.transactionCount) user.transactionCount = txCount;
      if (balance > user.stakeAmount) user.stakeAmount = balance;
      if (user.totalPoints === 0) {
        const basePoints = Math.max(txCount * 10 + Math.floor(balance / 100), 1);
        user.totalPoints = basePoints;
        user.availablePoints = basePoints;
      }
      user.tier = calculateTier(state.config, user.transactionCount, user.stakeAmount);
      user.updatedAt = new Date().toISOString();
      seeded++;
    }

    rebuildLeaderboard(state);
    await saveState(state);
    return seeded;
  } catch (err) {
    console.error('[Rewards] Error seeding from indexer:', err);
    return 0;
  }
}

export async function getWallet(): Promise<RewardWallet> {
  const state = await loadState();
  const lastReset = new Date(state.wallet.lastReset);
  const now = new Date();
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
  if (hoursSinceReset >= 24) {
    state.wallet.dailyDistributed = { lunes: 0, lusdt: 0, pidchat: 0 };
    state.wallet.lastReset = now.toISOString();
    await saveState(state);
  }
  return state.wallet;
}

export async function updateWallet(updates: Partial<RewardWallet>): Promise<RewardWallet> {
  const state = await loadState();
  state.wallet = { ...state.wallet, ...updates };
  await saveState(state);
  return state.wallet;
}

export async function refillWallet(tokenId: string, amount: number, changedBy = 'admin'): Promise<RewardWallet> {
  const state = await loadState();
  state.wallet.balances[tokenId] = (state.wallet.balances[tokenId] || 0) + amount;
  state.wallet.changeLog.unshift({
    id: `log_${Date.now()}`,
    action: 'balance_refilled',
    newValue: `+${amount} ${tokenId.toUpperCase()}`,
    changedBy,
    timestamp: new Date().toISOString(),
  });
  state.wallet.changeLog = state.wallet.changeLog.slice(0, 50);
  await saveState(state);
  return state.wallet;
}

export async function changeWalletAddress(newAddress: string, changedBy: string): Promise<{ success: boolean; error?: string; wallet?: RewardWallet }> {
  if (!newAddress || newAddress.length < 30) return { success: false, error: 'Invalid wallet address format' };
  const state = await loadState();
  if (newAddress === state.wallet.address) return { success: false, error: 'New address is the same as current' };

  const previousAddress = state.wallet.address;
  state.wallet.address = newAddress;
  state.wallet.changeLog.unshift({
    id: `log_${Date.now()}`,
    action: 'address_changed',
    previousValue: previousAddress,
    newValue: newAddress,
    changedBy,
    timestamp: new Date().toISOString(),
  });
  await saveState(state);
  return { success: true, wallet: state.wallet };
}

export async function changeWalletName(newName: string, changedBy: string): Promise<{ success: boolean; wallet?: RewardWallet }> {
  const state = await loadState();
  state.wallet.changeLog.unshift({
    id: `log_${Date.now()}`,
    action: 'wallet_renamed',
    previousValue: state.wallet.name,
    newValue: newName,
    changedBy,
    timestamp: new Date().toISOString(),
  });
  state.wallet.name = newName;
  await saveState(state);
  return { success: true, wallet: state.wallet };
}

export async function toggleWalletActive(changedBy: string): Promise<{ success: boolean; wallet: RewardWallet }> {
  const state = await loadState();
  const wasActive = state.wallet.isActive;
  state.wallet.isActive = !wasActive;
  state.wallet.changeLog.unshift({
    id: `log_${Date.now()}`,
    action: wasActive ? 'wallet_paused' : 'wallet_resumed',
    changedBy,
    timestamp: new Date().toISOString(),
  });
  await saveState(state);
  return { success: true, wallet: state.wallet };
}

export async function getWalletChangeLog(): Promise<WalletChangeLog[]> {
  return (await loadState()).wallet.changeLog || [];
}

export async function getConfig(): Promise<RewardConfig> {
  return (await loadState()).config;
}

export async function updateConfig(updates: Partial<RewardConfig>): Promise<RewardConfig> {
  const state = await loadState();
  state.config = { ...state.config, ...updates };
  await saveState(state);
  return state.config;
}

export async function getStats() {
  const state = await loadState();
  const users = Object.values(state.users);
  return {
    totalUsers: users.length,
    totalPointsDistributed: users.reduce((sum, u) => sum + u.totalPoints, 0),
    totalPointsClaimed: users.reduce((sum, u) => sum + u.claimedPoints, 0),
    walletBalance: state.wallet.balances,
    walletDistributed: state.wallet.totalDistributed,
    lastUpdated: state.lastUpdated,
  };
}

export async function resetDailyCounters(): Promise<void> {
  const state = await loadState();
  const now = new Date().toISOString();
  Object.values(state.users).forEach((user) => {
    user.dailyClaims = {};
    user.updatedAt = now;
  });
  state.wallet.dailyDistributed = { lunes: 0, lusdt: 0, pidchat: 0 };
  state.wallet.lastReset = now;
  await saveState(state);
}
