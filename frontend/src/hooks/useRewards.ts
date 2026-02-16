import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:4000/api';

export interface UserRewards {
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

export interface RewardWallet {
  address: string;
  name: string;
  balances: Record<string, number>;
  dailyDistributed: Record<string, number>;
  totalDistributed: Record<string, number>;
  lastReset: string;
  isActive: boolean;
}

export interface RewardStats {
  totalUsers: number;
  totalPointsDistributed: number;
  totalPointsClaimed: number;
  walletBalance: Record<string, number>;
  walletDistributed: Record<string, number>;
  lastUpdated: string;
}

// Get user rewards
export function useUserRewards(address: string | null) {
  const [data, setData] = useState<UserRewards | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!address) return;
    
    setLoading(true);
    fetch(`${API_BASE_URL}/rewards/${address}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [address, refreshKey]);

  const refetch = useCallback(() => setRefreshKey(k => k + 1), []);

  return { data, loading, error, refetch };
}

// Get leaderboard
export function useLeaderboard(limit: number = 50) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/rewards/leaderboard?limit=${limit}`)
      .then(res => res.json())
      .then(json => setData(json.leaderboard))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  return { data, loading, error };
}

// Claim rewards
export function useClaimRewards() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; tokensReceived?: number; tokenSymbol?: string; error?: string } | null>(null);

  const claim = useCallback(async (address: string, tokenId: 'lunes' | 'lusdt' | 'pidchat') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rewards/${address}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      });
      const data = await res.json();
      setResult(data);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to claim';
      setResult({ success: false, error: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { claim, loading, result };
}

// Get public rewards config (admin-managed)
export interface RewardsConfig {
  minClaimPoints: number;
  claimCooldownHours: number;
  dailyLimits: Record<string, number>;
  conversionRates: Record<string, number>;
  tiers: {
    id: string;
    name: string;
    minTransactions: number;
    minStakeAmount: number;
    multiplier: number;
    badge: string;
    color: string;
  }[];
  goals?: {
    id: string;
    name: string;
    description: string;
    basePoints: number;
    cooldownHours: number;
    maxPerDay: number;
    icon: string;
    enabled: boolean;
  }[];
}

export function useRewardsConfig() {
  const [data, setData] = useState<RewardsConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/rewards/config`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// Admin: Get wallet
export function useAdminWallet(authToken?: string | null) {
  const [data, setData] = useState<RewardWallet | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/rewards/wallet`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const refill = useCallback(async (tokenId: string, amount: number) => {
    const res = await fetch(`${API_BASE_URL}/admin/rewards/wallet/refill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ tokenId, amount }),
    });
    if (res.ok) fetchWallet();
    return res.json();
  }, [fetchWallet, authToken]);

  return { data, loading, refill, refetch: fetchWallet };
}

// Admin: Get stats
export function useRewardStats(authToken?: string | null) {
  const [data, setData] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/admin/rewards/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authToken]);

  return { data, loading };
}
