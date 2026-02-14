import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Coins, 
  TrendingUp, 
  Wallet, 
  Clock, 
  Users, 
  Lock,
  Award,
  ArrowRight,
  Shield,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import { StakingModal } from '../../components/staking/StakingModal';
import { useStakingOverview, useAccountStaking } from '../../hooks/useChainData';
import { useWalletAuth } from '../../context/WalletAuthContext';
import type { ValidatorInfo } from '../../services/chain';
import styles from './Staking.module.css';

function shortAddr(addr: string): string {
  if (!addr || addr.length < 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function formatStake(planck: string): string {
  const val = Number(BigInt(planck || '0')) / 1e12;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
  return val.toFixed(4);
}

const Staking: React.FC = () => {
  const { data: stakingData, loading, error } = useStakingOverview();
  const { isConnected, wallet } = useWalletAuth();
  const { data: myStaking, loading: myStakingLoading } = useAccountStaking(
    isConnected ? wallet?.account?.address || null : null
  );
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
  const [showStakingModal, setShowStakingModal] = useState(false);

  const validators = stakingData?.validators || [];
  const totalStaked = stakingData?.totalStakedFormatted || 0;
  const currentEra = stakingData?.currentEra || 0;
  const validatorCount = stakingData?.activeValidatorCount || 0;
  const totalNominators = validators.reduce((acc, v) => acc + v.nominatorCount, 0);

  const handleStakeClick = (validatorAddr: string) => {
    setSelectedValidator(validatorAddr);
    setShowStakingModal(true);
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Shield size={16} />
            <span>NPoS — Nominated Proof of Stake</span>
          </div>
          <h1 className={styles.heroTitle}>
            Stake Your <span className={styles.highlight}>LUNES</span>
          </h1>
          <p className={styles.heroDescription}>
            Earn rewards by nominating active validators on the Lunes network.
            Bond your tokens, choose a validator, and earn staking rewards every era.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>
                {loading ? '...' : `${formatStake((stakingData?.totalStaked || '0'))}`}
              </span>
              <span className={styles.heroStatLabel}>Total Staked (LUNES)</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{loading ? '...' : validatorCount}</span>
              <span className={styles.heroStatLabel}>Active Validators</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{loading ? '...' : currentEra.toLocaleString()}</span>
              <span className={styles.heroStatLabel}>Current Era</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{loading ? '...' : totalNominators}</span>
              <span className={styles.heroStatLabel}>Total Nominators</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Staking Info (when wallet connected) */}
      {isConnected && wallet && (
        <div className={styles.poolsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Wallet size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              My Staking
            </h2>
          </div>
          {myStakingLoading ? (
            <div style={{ display: 'flex', gap: '16px' }}>
              <Skeleton height={100} width="100%" borderRadius={12} />
              <Skeleton height={100} width="100%" borderRadius={12} />
            </div>
          ) : myStaking ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div className={styles.infoCard}>
                <Lock className={styles.infoIcon} size={24} />
                <h3 className={styles.infoTitle}>Bonded</h3>
                <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-400)', margin: 0 }}>
                  {myStaking.bondedFormatted.toFixed(4)} LUNES
                </p>
              </div>
              <div className={styles.infoCard}>
                <Award className={styles.infoIcon} size={24} />
                <h3 className={styles.infoTitle}>Status</h3>
                <p style={{ margin: 0 }}>
                  {myStaking.isValidator ? (
                    <StatusBadge status="info" size="sm">Validator</StatusBadge>
                  ) : myStaking.isNominator ? (
                    <StatusBadge status="success" size="sm">Nominator</StatusBadge>
                  ) : myStaking.bondedFormatted > 0 ? (
                    <StatusBadge status="warning" size="sm">Bonded (not nominating)</StatusBadge>
                  ) : (
                    <StatusBadge status="pending" size="sm">Not Staking</StatusBadge>
                  )}
                </p>
              </div>
              {myStaking.nominations.length > 0 && (
                <div className={styles.infoCard}>
                  <Users className={styles.infoIcon} size={24} />
                  <h3 className={styles.infoTitle}>Nominations</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {myStaking.nominations.map((nom: string) => (
                      <Link key={nom} to={`/account/${nom}`} style={{ fontSize: '11px', color: 'var(--color-brand-400)', textDecoration: 'none', fontFamily: 'monospace' }}>
                        {shortAddr(nom)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {myStaking.bondedFormatted === 0 && (
                <div className={styles.infoCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                    Select a validator below to start staking
                  </p>
                  <Zap size={20} color="var(--color-brand-400)" />
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Unable to load staking info. The RPC node may be temporarily unavailable.
            </div>
          )}
        </div>
      )}

      {/* How It Works */}
      <div className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How Staking Works</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <Wallet size={24} />
            </div>
            <h3 className={styles.stepTitle}>1. Connect Wallet</h3>
            <p className={styles.stepDescription}>Link your Polkadot.js or Talisman wallet</p>
          </div>
          <ArrowRight className={styles.stepArrow} size={24} />
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <Coins size={24} />
            </div>
            <h3 className={styles.stepTitle}>2. Bond LUNES</h3>
            <p className={styles.stepDescription}>Lock your tokens as staking collateral</p>
          </div>
          <ArrowRight className={styles.stepArrow} size={24} />
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <Users size={24} />
            </div>
            <h3 className={styles.stepTitle}>3. Nominate</h3>
            <p className={styles.stepDescription}>Choose an active validator to back</p>
          </div>
          <ArrowRight className={styles.stepArrow} size={24} />
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <Award size={24} />
            </div>
            <h3 className={styles.stepTitle}>4. Earn Rewards</h3>
            <p className={styles.stepDescription}>Receive rewards every era (~6h)</p>
          </div>
        </div>
      </div>

      {/* Active Validators */}
      <div className={styles.poolsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Active Validators</h2>
          <p className={styles.sectionSubtitle}>
            Select a validator to nominate and start earning staking rewards
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
            <Skeleton height={120} width="100%" borderRadius={12} />
            <Skeleton height={120} width="100%" borderRadius={12} />
            <Skeleton height={120} width="100%" borderRadius={12} />
            <Skeleton height={120} width="100%" borderRadius={12} />
          </div>
        ) : error ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <p>Unable to load validators. The RPC node may be temporarily unavailable.</p>
            <p style={{ fontSize: '12px' }}>Error: {error}</p>
          </div>
        ) : validators.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Shield size={32} style={{ marginBottom: '8px' }} />
            <p>No active validators found in current era.</p>
          </div>
        ) : (
          <div className={styles.poolsGrid}>
            {validators.map((validator: ValidatorInfo, index: number) => (
              <div 
                key={validator.address} 
                className={`${styles.poolCard} ${selectedValidator === validator.address ? styles.selected : ''}`}
                onClick={() => setSelectedValidator(
                  validator.address === selectedValidator ? null : validator.address
                )}
              >
                <div className={styles.poolHeader}>
                  <div className={styles.poolIcon}>
                    <Shield size={20} />
                  </div>
                  <StatusBadge 
                    status={validator.isActive ? 'success' : 'warning'} 
                    size="sm"
                  >
                    {validator.isActive ? 'Active' : 'Waiting'}
                  </StatusBadge>
                </div>

                <h3 className={styles.poolName}>
                  Validator #{index + 1}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {shortAddr(validator.address)}
                  </span>
                  <CopyToClipboard text={validator.address} />
                </div>

                <div className={styles.poolStats}>
                  <div className={styles.poolStat}>
                    <Coins size={16} className={styles.poolStatIcon} />
                    <div>
                      <span className={styles.poolStatValue}>
                        {formatStake(validator.totalStake)}
                      </span>
                      <span className={styles.poolStatLabel}>Total Stake</span>
                    </div>
                  </div>

                  <div className={styles.poolStat}>
                    <Lock size={16} className={styles.poolStatIcon} />
                    <div>
                      <span className={styles.poolStatValue}>
                        {formatStake(validator.ownStake)}
                      </span>
                      <span className={styles.poolStatLabel}>Own Stake</span>
                    </div>
                  </div>

                  <div className={styles.poolStat}>
                    <TrendingUp size={16} className={styles.poolStatIcon} />
                    <div>
                      <span className={styles.poolStatValue}>{validator.commission}</span>
                      <span className={styles.poolStatLabel}>Commission</span>
                    </div>
                  </div>

                  <div className={styles.poolStat}>
                    <Users size={16} className={styles.poolStatIcon} />
                    <div>
                      <span className={styles.poolStatValue}>{validator.nominatorCount}</span>
                      <span className={styles.poolStatLabel}>Nominators</span>
                    </div>
                  </div>
                </div>

                <button 
                  className={styles.stakeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStakeClick(validator.address);
                  }}
                >
                  {isConnected ? 'Nominate & Stake' : 'Connect Wallet to Stake'}
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className={styles.infoSection}>
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <Shield className={styles.infoIcon} size={32} />
            <h3 className={styles.infoTitle}>NPoS Consensus</h3>
            <p className={styles.infoText}>
              Lunes uses Nominated Proof-of-Stake (NPoS) where nominators back validators to secure the network.
            </p>
          </div>

          <div className={styles.infoCard}>
            <Zap className={styles.infoIcon} size={32} />
            <h3 className={styles.infoTitle}>Era Rewards</h3>
            <p className={styles.infoText}>
              Rewards are distributed every era. Validators share rewards with their nominators proportionally.
            </p>
          </div>

          <div className={styles.infoCard}>
            <Clock className={styles.infoIcon} size={32} />
            <h3 className={styles.infoTitle}>Unbonding Period</h3>
            <p className={styles.infoText}>
              When you unstake, funds enter an unbonding period of 28 eras before they can be withdrawn.
            </p>
          </div>
        </div>
      </div>

      {/* Staking Modal */}
      <StakingModal 
        isOpen={showStakingModal} 
        onClose={() => setShowStakingModal(false)}
        validatorAddress={selectedValidator || undefined}
      />
    </div>
  );
};

export default Staking;
