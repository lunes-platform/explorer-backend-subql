import { motion } from 'framer-motion';
import {
  Wifi, WifiOff, Database, Activity,
  Users, FileCode, Box, TrendingUp, Award, Layers,
  ArrowUpRight
} from 'lucide-react';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { useDashboardStats, useStakingOverview } from '../../hooks/useChainData';
import { getAllProjects } from '../../data/knownProjects';
import { useRewardStats } from '../../hooks/useRewards';
import { useAdminAuth } from '../../context/AdminAuthContext';
import styles from './Admin.module.css';

export default function OverviewTab() {
  const { token } = useAdminAuth();
  const health = useHealthStatus();
  const { data: chainStats, loading } = useDashboardStats();
  const { data: stakingData } = useStakingOverview();
  const { data: rewardStats } = useRewardStats(token);
  const projects = getAllProjects();
  const rpc = health.rpc;
  const idx = health.indexer;

  return (
    <div className={styles.overviewContainer}>
      {/* Quick Stats Row */}
      <div className={styles.quickStats}>
        <motion.div 
          className={styles.quickStatCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <div className={styles.quickStatIcon} style={{ background: 'rgba(108,56,255,0.15)' }}>
            <Box size={22} color="var(--color-brand-400)" />
          </div>
          <div className={styles.quickStatInfo}>
            <span className={styles.quickStatValue}>{loading ? '...' : `#${(chainStats?.latestBlock || 0).toLocaleString()}`}</span>
            <span className={styles.quickStatLabel}>Latest Block</span>
          </div>
          <div className={styles.quickStatTrend}>
            <ArrowUpRight size={14} />
            <span>Live</span>
          </div>
        </motion.div>

        <motion.div 
          className={styles.quickStatCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.quickStatIcon} style={{ background: 'rgba(38,208,124,0.15)' }}>
            <Users size={22} color="#26d07c" />
          </div>
          <div className={styles.quickStatInfo}>
            <span className={styles.quickStatValue}>{stakingData?.activeValidatorCount || chainStats?.activeValidators || 0}</span>
            <span className={styles.quickStatLabel}>Validators</span>
          </div>
        </motion.div>

        <motion.div 
          className={styles.quickStatCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.quickStatIcon} style={{ background: 'rgba(0,163,255,0.15)' }}>
            <FileCode size={22} color="#00a3ff" />
          </div>
          <div className={styles.quickStatInfo}>
            <span className={styles.quickStatValue}>{chainStats?.totalContracts || 0}</span>
            <span className={styles.quickStatLabel}>Contracts</span>
          </div>
        </motion.div>

        <motion.div 
          className={styles.quickStatCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.quickStatIcon} style={{ background: 'rgba(168,85,247,0.15)' }}>
            <Layers size={22} color="#a855f7" />
          </div>
          <div className={styles.quickStatInfo}>
            <span className={styles.quickStatValue}>{projects.length}</span>
            <span className={styles.quickStatLabel}>Projects</span>
          </div>
        </motion.div>

        <motion.div 
          className={styles.quickStatCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.quickStatIcon} style={{ background: 'rgba(254,159,0,0.15)' }}>
            <Award size={22} color="#fe9f00" />
          </div>
          <div className={styles.quickStatInfo}>
            <span className={styles.quickStatValue}>{rewardStats?.totalUsers || 0}</span>
            <span className={styles.quickStatLabel}>Reward Users</span>
          </div>
        </motion.div>
      </div>

      {/* Health Status Cards */}
      <div className={styles.sectionTitle}>
        <Activity size={18} />
        <span>System Health</span>
      </div>

      <div className={styles.healthGrid}>
        <motion.div 
          className={styles.healthCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={styles.healthHeader}>
            <div className={styles.healthTitleWrapper}>
              <div className={`${styles.healthStatusIcon} ${rpc.status === 'connected' ? styles.connected : styles.disconnected}`}>
                {rpc.status === 'connected' ? <Wifi size={18} /> : <WifiOff size={18} />}
              </div>
              <span className={styles.healthTitle}>RPC Node</span>
            </div>
            <span className={styles.healthDot} data-status={rpc.status === 'connected' ? 'healthy' : 'disconnected'} />
          </div>
          <div className={styles.healthContent}>
            <div className={styles.healthRow}>
              <span className={styles.healthLabel}>Status</span>
              <span className={`${styles.healthValue} ${styles[rpc.status]}`}>{rpc.status}</span>
            </div>
            <div className={styles.healthRow}>
              <span className={styles.healthLabel}>Block Height</span>
              <span className={styles.healthValue}>#{rpc.latestBlock.toLocaleString()}</span>
            </div>
            <div className={styles.healthRow}>
              <span className={styles.healthLabel}>Last Update</span>
              <span className={styles.healthValue}>{rpc.lastSeen ? new Date(rpc.lastSeen).toLocaleTimeString() : '—'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className={styles.healthCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className={styles.healthHeader}>
            <div className={styles.healthTitleWrapper}>
              <div className={`${styles.healthStatusIcon} ${idx.status === 'healthy' ? styles.healthy : idx.status === 'delayed' ? styles.delayed : styles.lagging}`}>
                <Database size={18} />
              </div>
              <span className={styles.healthTitle}>Indexer</span>
            </div>
            <span className={styles.healthDot} data-status={idx.status} />
          </div>
          <div className={styles.healthContent}>
            <div className={styles.healthRow}>
              <span className={styles.healthLabel}>Status</span>
              <span className={`${styles.healthValue} ${styles[idx.status]}`}>{idx.status}</span>
            </div>
            <div className={styles.healthRow}>
              <span className={styles.healthLabel}>Indexed Block</span>
              <span className={styles.healthValue}>#{idx.latestBlock.toLocaleString()}</span>
            </div>
            <div className={styles.healthRow}>
              <span className={styles.healthLabel}>Sync Lag</span>
              <span className={styles.healthValue}>{idx.lag !== null ? `${idx.lag.toLocaleString()} blocks` : '—'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rewards Stats Section */}
      {rewardStats && (
        <>
          <div className={styles.sectionTitle}>
            <TrendingUp size={18} />
            <span>Rewards Overview</span>
          </div>
          <motion.div 
            className={styles.rewardsOverview}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className={styles.rewardStat}>
              <span className={styles.rewardValue}>{rewardStats.totalPointsDistributed?.toLocaleString() || 0}</span>
              <span className={styles.rewardLabel}>Total Points Distributed</span>
            </div>
            <div className={styles.rewardDivider} />
            <div className={styles.rewardStat}>
              <span className={styles.rewardValue}>{rewardStats.totalPointsClaimed?.toLocaleString() || 0}</span>
              <span className={styles.rewardLabel}>Total Points Claimed</span>
            </div>
            <div className={styles.rewardDivider} />
            <div className={styles.rewardStat}>
              <span className={styles.rewardValue}>
                {Object.entries(rewardStats.walletBalance || {}).map(([token, amount]) => `${amount} ${token.toUpperCase()}`).join(', ')}
              </span>
              <span className={styles.rewardLabel}>Treasury Balance</span>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
