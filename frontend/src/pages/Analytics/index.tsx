import React, { useMemo } from 'react';
import { TrendingUp, Activity, BarChart3, Box, Shield, FileCode, Loader2 } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { GET_HOME_STATS } from '../../services/graphql/queries';
import { useDashboardStats, useStakingOverview } from '../../hooks/useChainData';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import Card from '../../components/common/Card';
import styles from './AnalyticsDashboard.module.css';
import type { HomeStats } from '../../types';

// Simple bar chart component
const SimpleBarChart: React.FC<{ data: { label: string; value: number }[]; color?: string }> = ({ 
  data, 
  color = 'var(--color-brand-400)' 
}) => {
  const max = Math.max(...data.map(d => d.value));
  
  return (
    <div className={styles.barChart}>
      {data.map((item, i) => (
        <div key={i} className={styles.barItem}>
          <div className={styles.barLabel}>{item.label}</div>
          <div className={styles.barTrack}>
            <div 
              className={styles.barFill}
              style={{ 
                width: `${(item.value / max) * 100}%`,
                background: color
              }}
            />
          </div>
          <div className={styles.barValue}>{item.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
};

// Mini stat card
const StatMini: React.FC<{ label: string; value: string; icon: React.ReactNode; sub?: string; loading?: boolean }> = ({ 
  label, value, icon, sub, loading 
}) => (
  <div className={styles.statMini}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statInfo}>
      <span className={styles.statLabel}>{label}</span>
      {loading ? (
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
      ) : (
        <span className={styles.statValue}>{value}</span>
      )}
      {sub && <span className={styles.statTrend}>{sub}</span>}
    </div>
  </div>
);

const AnalyticsDashboard: React.FC = () => {
  usePageTitle('Analytics', 'Lunes blockchain analytics — network stats, transaction volume, staking overview, and growth metrics.');
  const { data: chainStats, loading: chainLoading } = useDashboardStats();
  const { data: stakingData, loading: stakingLoading } = useStakingOverview();
  const { data: indexerStats, loading: indexerLoading } = useQuery<HomeStats>(GET_HOME_STATS, { pollInterval: 15000 });
  const health = useHealthStatus();
  const { price } = useLunesPrice();

  const totalTransfers = indexerStats?.transfers?.totalCount || 0;
  const dailyStats = indexerStats?.dailyStats?.nodes || [];
  const rpcLatestBlock = chainStats?.latestBlock || 0;
  const totalContracts = chainStats?.totalContracts || 0;
  const totalAssets = chainStats?.totalAssets || 0;
  const totalNftCollections = chainStats?.totalNftCollections || 0;
  const currentEra = chainStats?.currentEra || 0;
  const totalIssuance = chainStats?.totalIssuanceFormatted || 0;
  const totalStaked = stakingData?.totalStakedFormatted || 0;
  const validatorCount = stakingData?.activeValidatorCount || chainStats?.activeValidators || 0;
  const totalNominators = useMemo(() => stakingData?.validators?.reduce((a, v) => a + v.nominatorCount, 0) || 0, [stakingData]);
  const marketCap = price > 0 && totalIssuance > 0 ? price * totalIssuance : 0;

  const dailyChartData = useMemo(() => {
    if (!dailyStats.length) return [];
    return [...dailyStats].reverse().map(d => ({
      label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: d.transfersCount || 0,
    }));
  }, [dailyStats]);

  const networkComposition = useMemo(() => [
    { label: 'Transfers', value: totalTransfers, color: '#26d07c' },
    { label: 'Contracts', value: totalContracts, color: '#00a3ff' },
    { label: 'Assets', value: totalAssets, color: '#fe9f00' },
    { label: 'NFT Collections', value: totalNftCollections, color: '#a855f7' },
  ], [totalTransfers, totalContracts, totalAssets, totalNftCollections]);

  const rpcHealth = health.rpc.status === 'connected' ? 'healthy' as const : health.rpc.status === 'connecting' ? 'delayed' as const : 'disconnected' as const;
  const isLoading = chainLoading || indexerLoading;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <BarChart3 size={28} />
          Network Analytics
        </h1>
        <p className={styles.subtitle}>Live network data from RPC and SubQuery indexer</p>
        <DataSourceBadge source="RPC + INDEXER" updatedAt={!isLoading ? `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined} loading={isLoading} health={rpcHealth} />
      </div>

      {/* Mini Stats Row — all real data */}
      <div className={styles.statsRow}>
        <StatMini
          label="Latest Block (RPC)"
          value={`#${rpcLatestBlock.toLocaleString()}`}
          icon={<Box size={20} />}
          sub="Live from chain"
          loading={chainLoading}
        />
        <StatMini
          label="Indexed Transfers"
          value={totalTransfers.toLocaleString()}
          icon={<Activity size={20} />}
          sub="From SubQuery"
          loading={indexerLoading}
        />
        <StatMini
          label="Active Validators"
          value={validatorCount.toString()}
          icon={<Shield size={20} />}
          sub={`Era ${currentEra.toLocaleString()}`}
          loading={chainLoading}
        />
        <StatMini
          label="Smart Contracts"
          value={totalContracts.toLocaleString()}
          icon={<FileCode size={20} />}
          sub="Ink! deployed"
          loading={chainLoading}
        />
      </div>

      {/* Charts Grid — all real data */}
      <div className={styles.chartsGrid}>
        <Card title="Daily Transfers (Indexer)" icon={<Activity size={18} />}>
          {dailyChartData.length > 0 ? (
            <SimpleBarChart data={dailyChartData} />
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {indexerLoading ? 'Loading indexer data...' : 'No daily stats from indexer yet'}
            </div>
          )}
        </Card>

        <Card title="Network Composition" icon={<TrendingUp size={18} />}>
          <div className={styles.pieChart}>
            {networkComposition.map((item, i) => (
              <div key={i} className={styles.pieSegment}>
                <span className={styles.pieColor} style={{ background: item.color }} />
                <span className={styles.pieLabel}>{item.label}</span>
                <span className={styles.pieValue}>{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Staking & Economy" icon={<Shield size={18} />} className={styles.wideCard}>
          <div className={styles.growthStats}>
            <div className={styles.growthItem}>
              <span className={styles.growthLabel}>Total Staked</span>
              <span className={styles.growthValue}>
                {stakingLoading ? '...' : `${(totalStaked / 1e6).toFixed(2)}M LUNES`}
              </span>
              <span className={styles.growthSub}>
                {totalIssuance > 0 ? `${((totalStaked / totalIssuance) * 100).toFixed(1)}% of supply` : '—'}
              </span>
            </div>
            <div className={styles.growthItem}>
              <span className={styles.growthLabel}>Validators / Nominators</span>
              <span className={styles.growthValue}>
                {stakingLoading ? '...' : `${validatorCount} / ${totalNominators}`}
              </span>
              <span className={styles.growthSub}>Securing the network</span>
            </div>
            <div className={styles.growthItem}>
              <span className={styles.growthLabel}>Market Cap</span>
              <span className={styles.growthValue}>
                {marketCap > 0 ? `$${marketCap >= 1e6 ? (marketCap / 1e6).toFixed(2) + 'M' : (marketCap / 1e3).toFixed(1) + 'K'}` : '—'}
              </span>
              <span className={styles.growthSub}>
                {price > 0 ? `@ $${price.toFixed(4)}/LUNES` : 'Price unavailable'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Network Summary" icon={<BarChart3 size={18} />} className={styles.wideCard}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Supply</span>
              <span className={styles.summaryValue}>
                {totalIssuance > 0 ? `${(totalIssuance / 1e6).toFixed(2)}M` : '—'}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Native Assets</span>
              <span className={styles.summaryValue}>{totalAssets}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>NFT Collections</span>
              <span className={styles.summaryValue}>{totalNftCollections}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Current Era</span>
              <span className={styles.summaryValue}>{currentEra.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
