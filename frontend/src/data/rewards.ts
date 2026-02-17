/**
 * REWARDS SYSTEM - Business Rules & Architecture
 * 
 * Overview:
 * Gamification system to incentivize Lunes blockchain usage through
 * rewards in LUNES and ecosystem tokens.
 */

// ============================================================================
// BUSINESS RULES
// ============================================================================

export interface RewardTier {
  id: string;
  name: string;
  minTransactions: number;
  minStakeAmount: number; // in LUNES
  rewardMultiplier: number;
  badge: string;
  color: string;
}

export const REWARD_TIERS: RewardTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minTransactions: 10,
    minStakeAmount: 100,
    rewardMultiplier: 1.0,
    badge: '🥉',
    color: '#CD7F32'
  },
  {
    id: 'silver',
    name: 'Silver',
    minTransactions: 50,
    minStakeAmount: 1000,
    rewardMultiplier: 1.5,
    badge: '🥈',
    color: '#C0C0C0'
  },
  {
    id: 'gold',
    name: 'Gold',
    minTransactions: 200,
    minStakeAmount: 10000,
    rewardMultiplier: 2.0,
    badge: '🥇',
    color: '#FFD700'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minTransactions: 500,
    minStakeAmount: 50000,
    rewardMultiplier: 3.0,
    badge: '💎',
    color: '#E5E4E2'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    minTransactions: 1000,
    minStakeAmount: 100000,
    rewardMultiplier: 5.0,
    badge: '💠',
    color: '#B9F2FF'
  }
];

// ============================================================================
// REWARD CATEGORIES
// ============================================================================

export interface RewardCategory {
  id: string;
  name: string;
  description: string;
  basePoints: number;
  cooldownHours: number;
  maxPerDay: number;
  icon: string;
}

export const REWARD_CATEGORIES: RewardCategory[] = [
  {
    id: 'daily_transaction',
    name: 'Daily Transaction',
    description: 'Complete at least 1 transaction per day',
    basePoints: 10,
    cooldownHours: 24,
    maxPerDay: 1,
    icon: 'Send'
  },
  {
    id: 'volume_transaction',
    name: 'Transaction Volume',
    description: 'Transact more than 100 LUNES in a day',
    basePoints: 50,
    cooldownHours: 24,
    maxPerDay: 5,
    icon: 'TrendingUp'
  },
  {
    id: 'staking_deposit',
    name: 'Staking',
    description: 'Stake LUNES tokens',
    basePoints: 100,
    cooldownHours: 0, // Once per deposit
    maxPerDay: 999,
    icon: 'Shield'
  },
  {
    id: 'staking_duration',
    name: 'Long-Term Staking',
    description: 'Maintain stake for 30+ days',
    basePoints: 200,
    cooldownHours: 720, // 30 days
    maxPerDay: 1,
    icon: 'Clock'
  },
  {
    id: 'nft_mint',
    name: 'NFT Mint',
    description: 'Create a new NFT on the blockchain',
    basePoints: 150,
    cooldownHours: 0,
    maxPerDay: 10,
    icon: 'Image'
  },
  {
    id: 'token_transfer',
    name: 'Token Transfer',
    description: 'Transfer ecosystem tokens',
    basePoints: 20,
    cooldownHours: 1,
    maxPerDay: 20,
    icon: 'Coins'
  },
  {
    id: 'contract_interaction',
    name: 'Smart Contract Interaction',
    description: 'Interact with ecosystem contracts',
    basePoints: 30,
    cooldownHours: 0,
    maxPerDay: 50,
    icon: 'FileCode'
  },
  {
    id: 'validator_nomination',
    name: 'Validator Nomination',
    description: 'Nominate a validator on the network',
    basePoints: 75,
    cooldownHours: 0,
    maxPerDay: 5,
    icon: 'Users'
  }
];

// ============================================================================
// POINTS TO REWARDS CONVERSION
// ============================================================================

export interface RewardToken {
  id: string;
  symbol: string;
  name: string;
  pointsPerToken: number; // How many points = 1 token
  maxDailyDistribution: number;
  assetId?: string; // Para tokens nativos do pallet-assets
  contractAddress?: string; // Para PSP22
  isNative: boolean;
}

export const REWARD_TOKENS: RewardToken[] = [
  {
    id: 'lunes',
    symbol: 'LUNES',
    name: 'Lunes Native',
    pointsPerToken: 100, // 100 points = 1 LUNES
    maxDailyDistribution: 1000,
    isNative: true
  },
  {
    id: 'lusdt',
    symbol: 'LUSDT',
    name: 'Lunes Dollar',
    pointsPerToken: 1000, // 1000 points = 1 LUSDT
    maxDailyDistribution: 100,
    assetId: '2',
    isNative: true
  },
  {
    id: 'pidchat',
    symbol: 'PIDCHAT',
    name: 'PidChat Token',
    pointsPerToken: 500,
    maxDailyDistribution: 500,
    assetId: '1',
    isNative: true
  }
];

// ============================================================================
// LEADERBOARD & RANKING
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  address: string;
  totalPoints: number;
  transactions: number;
  stakeAmount: number;
  tier: string;
  lastActive: string;
  rewardsClaimed: number;
}

export const LEADERBOARD_PERIODS = [
  { id: 'daily', name: 'Daily', days: 1 },
  { id: 'weekly', name: 'Weekly', days: 7 },
  { id: 'monthly', name: 'Monthly', days: 30 },
  { id: 'alltime', name: 'All Time', days: 365 }
];

// ============================================================================
// REWARD WALLET CONFIGURATION
// ============================================================================

export interface RewardWallet {
  address: string;
  name: string;
  balances: Record<string, number>;
  dailyLimits: Record<string, number>;
  totalDistributed: Record<string, number>;
  lastRefill: string;
}

// Initial system configuration
export const REWARD_CONFIG = {
  // Wallet that distributes rewards
  distributionWallet: {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Example address
    name: 'Lunes Rewards Treasury'
  },
  
  // Base conversion rate
  baseConversionRate: 100, // 100 pontos = 1 LUNES
  
  // Daily limits per user
  userDailyLimits: {
    lunes: 10,
    lusdt: 1,
    pidchat: 50
  },
  
  // Minimum for claim
  minClaimPoints: 100,
  
  // Leaderboard reset period
  leaderboardResetDays: 30,
  
  // Cooldown between claims (hours)
  claimCooldownHours: 24
};

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

export function calculateTier(transactionCount: number, stakeAmount: number): RewardTier {
  // Find the highest tier the user qualifies for
  for (let i = REWARD_TIERS.length - 1; i >= 0; i--) {
    const tier = REWARD_TIERS[i];
    if (transactionCount >= tier.minTransactions && stakeAmount >= tier.minStakeAmount) {
      return tier;
    }
  }
  return REWARD_TIERS[0]; // Bronze by default
}

export function calculatePoints(
  category: RewardCategory,
  tier: RewardTier,
  amount?: number
): number {
  let points = category.basePoints * tier.rewardMultiplier;
  
  // Volume bonus (if applicable)
  if (amount && amount > 1000) {
    points *= 1.5;
  }
  
  return Math.floor(points);
}

export function pointsToTokens(points: number, token: RewardToken): number {
  return Math.floor(points / token.pointsPerToken);
}

export function formatReward(amount: number, symbol: string): string {
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M ${symbol}`;
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(2)}K ${symbol}`;
  return `${amount.toFixed(2)} ${symbol}`;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export interface RewardValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateClaim(
  userPoints: number,
  userDailyClaims: number,
  token: RewardToken,
  walletBalance: number
): RewardValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check minimum points
  if (userPoints < REWARD_CONFIG.minClaimPoints) {
    errors.push(`Minimum of ${REWARD_CONFIG.minClaimPoints} points required`);
  }
  
  // Check user daily limit
  const dailyLimit = REWARD_CONFIG.userDailyLimits[token.id as keyof typeof REWARD_CONFIG.userDailyLimits];
  if (userDailyClaims >= dailyLimit) {
    errors.push(`Daily limit of ${dailyLimit} ${token.symbol} reached`);
  }
  
  // Check distribution wallet balance
  const tokensToReceive = pointsToTokens(userPoints, token);
  if (tokensToReceive > walletBalance) {
    errors.push('Insufficient balance in the rewards wallet');
  }
  
  // Check global daily limit
  if (tokensToReceive > token.maxDailyDistribution) {
    warnings.push(`High distribution: ${tokensToReceive} ${token.symbol}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
