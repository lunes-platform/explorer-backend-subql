import React, { useState } from 'react';
import { 
  Gift, 
  Trophy, 
  Target, 
  Clock, 
  Zap, 
  Coins, 
  Shield,
  TrendingUp,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
  Image,
  FileCode,
  type LucideIcon
} from 'lucide-react';
import { useWalletAuth } from '../../context/WalletAuthContext';
import { useUserRewards, useLeaderboard, useClaimRewards, useRewardsConfig } from '../../hooks/useRewards';
import { REWARD_TIERS, REWARD_CATEGORIES } from '../../data/rewards';
import { Gift as GiftIcon, Star, Award } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import styles from './Rewards.module.css';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Send,
  TrendingUp,
  Shield,
  Clock,
  Image,
  Coins,
  FileCode,
  Users,
  Zap,
  Gift: GiftIcon,
  Star,
  Award,
};

const CATEGORY_COLORS: Record<string, string> = {
  Send: '#26D07C',
  TrendingUp: '#00A3FF',
  Shield: '#7B42FF',
  Clock: '#FE9F00',
  Image: '#A855F7',
  Coins: '#26D07C',
  FileCode: '#00A3FF',
  Users: '#7B42FF',
  Zap: '#FFC107',
  Gift: '#E91E63',
  Star: '#FFD700',
  Award: '#FF6B35',
};

const Rewards: React.FC = () => {
  const { wallet, isConnected } = useWalletAuth();
  const address = wallet?.account?.address || null;
  
  const { data: userRewards } = useUserRewards(address);
  const { data: leaderboard, loading: leaderboardLoading } = useLeaderboard(10);
  const { claim, loading: claimLoading, result } = useClaimRewards();
  const { data: backendConfig } = useRewardsConfig();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'history'>('overview');
  const [selectedToken, setSelectedToken] = useState<'lunes' | 'lusdt' | 'pidchat'>('lunes');

  // Use backend-managed tiers if available, fallback to static
  const tiers = backendConfig?.tiers?.map(t => ({
    id: t.id,
    name: t.name,
    minTransactions: t.minTransactions,
    minStakeAmount: t.minStakeAmount,
    rewardMultiplier: t.multiplier,
    badge: t.badge,
    color: t.color,
  })) || REWARD_TIERS;

  // Conversion rates from backend config
  const conversionRates = backendConfig?.conversionRates || { lunes: 100, lusdt: 1000, pidchat: 500 };
  const minClaimPoints = backendConfig?.minClaimPoints ?? 100;

  // Use backend-managed goals if available, fallback to static REWARD_CATEGORIES
  const categories = backendConfig?.goals?.filter(g => g.enabled)?.map(g => ({
    id: g.id,
    name: g.name,
    description: g.description,
    basePoints: g.basePoints,
    cooldownHours: g.cooldownHours,
    maxPerDay: g.maxPerDay,
    icon: g.icon,
  })) || REWARD_CATEGORIES;

  const tier = tiers.find(t => t.id === userRewards?.tier) || tiers[0];
  
  const handleClaim = async () => {
    if (!address) return;
    await claim(address, selectedToken);
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  const getTierProgress = () => {
    if (!userRewards) return 0;
    const currentTierIdx = tiers.findIndex(t => t.id === tier.id);
    const nextTier = tiers[currentTierIdx + 1];
    if (!nextTier) return 100;
    
    const txProgress = Math.min((userRewards.transactionCount / nextTier.minTransactions) * 50, 50);
    const stakeProgress = Math.min((userRewards.stakeAmount / nextTier.minStakeAmount) * 50, 50);
    return txProgress + stakeProgress;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Gift size={28} />
          Rewards Center
        </h1>
        <p className={styles.subtitle}>
          Earn points by transacting and staking on Lunes Blockchain
        </p>
      </div>

      {/* Connect Wallet Banner (when not connected) */}
      {!isConnected && (
        <Card>
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Connect your wallet to track your points, claim rewards, and see your rank</p>
          </div>
        </Card>
      )}

      {/* User Stats Cards */}
      {isConnected && userRewards && (
        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <div className={styles.statHeader}>
              <Trophy size={20} color={tier.color} />
              <span className={styles.statLabel}>Current Tier</span>
            </div>
            <div className={styles.statValue} style={{ color: tier.color }}>
              {tier.badge} {tier.name}
            </div>
            <div className={styles.statSub}>
              {tier.rewardMultiplier}x Multiplier
            </div>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statHeader}>
              <Zap size={20} color="#7B42FF" />
              <span className={styles.statLabel}>Available Points</span>
            </div>
            <div className={styles.statValue}>
              {userRewards.availablePoints.toLocaleString()}
            </div>
            <div className={styles.statSub}>
              Total: {userRewards.totalPoints.toLocaleString()}
            </div>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statHeader}>
              <Target size={20} color="#26D07C" />
              <span className={styles.statLabel}>Transactions</span>
            </div>
            <div className={styles.statValue}>
              {userRewards.transactionCount}
            </div>
            <div className={styles.statSub}>
              Stake: {userRewards.stakeAmount.toLocaleString()} LUNES
            </div>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statHeader}>
              <Coins size={20} color="#00A3FF" />
              <span className={styles.statLabel}>Claimed</span>
            </div>
            <div className={styles.statValue}>
              {userRewards.claimedPoints.toLocaleString()}
            </div>
            <div className={styles.statSub}>
              Points converted
            </div>
          </Card>
        </div>
      )}

      {/* Claim Section */}
      {isConnected && userRewards && userRewards.availablePoints > 0 && (
        <Card title="Claim Rewards" icon={<Gift size={18} />}>
          <div className={styles.claimSection}>
            <div className={styles.tokenSelect}>
              <button
                className={`${styles.tokenBtn} ${selectedToken === 'lunes' ? styles.active : ''}`}
                onClick={() => setSelectedToken('lunes')}
              >
                <span className={styles.tokenIcon}>🌙</span>
                <span>LUNES</span>
                <span className={styles.tokenRate}>{conversionRates.lunes} pts = 1 LUNES</span>
              </button>
              <button
                className={`${styles.tokenBtn} ${selectedToken === 'lusdt' ? styles.active : ''}`}
                onClick={() => setSelectedToken('lusdt')}
              >
                <span className={styles.tokenIcon}>💵</span>
                <span>LUSDT</span>
                <span className={styles.tokenRate}>{conversionRates.lusdt} pts = 1 LUSDT</span>
              </button>
              <button
                className={`${styles.tokenBtn} ${selectedToken === 'pidchat' ? styles.active : ''}`}
                onClick={() => setSelectedToken('pidchat')}
              >
                <span className={styles.tokenIcon}>💬</span>
                <span>PIDCHAT</span>
                <span className={styles.tokenRate}>{conversionRates.pidchat} pts = 1 PIDCHAT</span>
              </button>
            </div>

            <div className={styles.claimInfo}>
              <div className={styles.claimAmount}>
                <span className={styles.claimLabel}>You will receive:</span>
                <span className={styles.claimValue}>
                  {Math.floor(userRewards.availablePoints / 
                    (conversionRates[selectedToken] || 100)
                  ).toLocaleString()} {selectedToken.toUpperCase()}
                </span>
              </div>
              
              <button
                className={styles.claimBtn}
                onClick={handleClaim}
                disabled={claimLoading || userRewards.availablePoints < minClaimPoints}
              >
                {claimLoading ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Gift size={18} />
                    Claim Rewards
                  </>
                )}
              </button>
            </div>

            {result && (
              <div className={`${styles.claimResult} ${result.success ? styles.success : styles.error}`}>
                {result.success ? (
                  <>
                    <CheckCircle size={20} />
                    <span>Claimed {result.tokensReceived} {result.tokenSymbol}!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} />
                    <span>{result.error}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Progress to Next Tier */}
      {isConnected && <Card title="Tier Progress" icon={<TrendingUp size={18} />}>
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${getTierProgress()}%`, backgroundColor: tier.color }}
            />
          </div>
          <div className={styles.tierList}>
            {tiers.map((t, idx) => (
              <div 
                key={t.id} 
                className={`${styles.tierItem} ${t.id === tier.id ? styles.current : ''} ${idx < tiers.findIndex(x => x.id === tier.id) ? styles.completed : ''}`}
              >
                <span className={styles.tierBadge}>{t.badge}</span>
                <span className={styles.tierName}>{t.name}</span>
                <span className={styles.tierReq}>{t.minTransactions} txs / {t.minStakeAmount} LUNES</span>
              </div>
            ))}
          </div>
        </div>
      </Card>}

      {/* Reward Categories */}
      <Card title="Ways to Earn" icon={<Zap size={18} />}>
        <div className={styles.categoriesGrid}>
          {categories.map(cat => {
            const IconComp = CATEGORY_ICONS[cat.icon] || Zap;
            const iconColor = CATEGORY_COLORS[cat.icon] || '#7B42FF';
            return (
              <div key={cat.id} className={styles.categoryCard}>
                <div className={styles.categoryIcon} style={{ background: `${iconColor}15`, color: iconColor }}>
                  <IconComp size={20} />
                </div>
                <div className={styles.categoryInfo}>
                  <h4>{cat.name}</h4>
                  <p>{cat.description}</p>
                  <span className={styles.categoryPoints}>+{cat.basePoints} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Trophy size={16} />
          Leaderboard
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={16} />
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <div className={styles.leaderboard}>
            <div className={styles.leaderboardHeader}>
              <span>Rank</span>
              <span>User</span>
              <span>Points</span>
              <span>Tier</span>
            </div>
            {leaderboardLoading ? (
              <div className={styles.loading}>
                <Loader2 size={24} className={styles.spinner} />
              </div>
            ) : (
              leaderboard.map((entry, idx) => (
                <div 
                  key={entry.address} 
                  className={`${styles.leaderboardRow} ${entry.address === address ? styles.currentUser : ''}`}
                >
                  <span className={styles.rank}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${entry.rank}`}
                  </span>
                  <span className={styles.user}>
                    {formatAddress(entry.address)}
                    {entry.address === address && <span className={styles.youBadge}>YOU</span>}
                  </span>
                  <span className={styles.points}>{entry.totalPoints.toLocaleString()}</span>
                  <span className={styles.tier}>{entry.tier}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'history' && userRewards && (
        <Card>
          <div className={styles.history}>
            {userRewards.history.length === 0 ? (
              <EmptyState type="no-data" message="No reward history yet. Start transacting to earn points!" />
            ) : (
              userRewards.history.map(event => (
                <div key={event.id} className={styles.historyItem}>
                  <div className={styles.historyIcon}>
                    {event.type === 'earned' ? <Zap size={16} /> : 
                     event.type === 'claimed' ? <Gift size={16} /> : <Trophy size={16} />}
                  </div>
                  <div className={styles.historyInfo}>
                    <p>{event.description}</p>
                    <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className={`${styles.historyPoints} ${event.points < 0 ? styles.negative : ''}`}>
                    {event.points > 0 ? '+' : ''}{event.points} pts
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Rewards;
