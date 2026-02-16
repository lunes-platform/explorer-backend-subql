import React from 'react';
import { TrendingUp, TrendingDown, Coins, BarChart3, Database, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardStats, useAssets } from '../../hooks/useChainData';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { formatAbbreviatedNumber } from '../../data/tokenomics';
import styles from './ProjectTokenStats.module.css';

interface ProjectTokenStatsProps {
  tokenSymbol: string; // 'lunes' for native, or asset ID for pallet assets
}

function formatSupply(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

const ProjectTokenStats: React.FC<ProjectTokenStatsProps> = ({ tokenSymbol }) => {
  const isNative = tokenSymbol === 'lunes';
  const { data: chainStats, loading: statsLoading } = useDashboardStats();
  const { data: assets, loading: assetsLoading } = useAssets();
  const { price, change24h, volume24h, loading: priceLoading } = useLunesPrice();

  if (isNative) {
    const totalIssuance = chainStats?.totalIssuanceFormatted || 0;
    const marketCap = price > 0 && totalIssuance > 0 ? price * totalIssuance : 0;
    const loading = statsLoading || priceLoading;

    return (
      <div className={styles.tokenStatsContainer}>
        <div className={styles.tokenPriceBar}>
          <div className={styles.tokenPriceLeft}>
            <Coins size={20} className={styles.tokenIcon} />
            <span className={styles.tokenLabel}>LUNES</span>
            <span className={styles.tokenPriceValue}>
              {loading ? '...' : `$${price.toFixed(6)}`}
            </span>
            {!priceLoading && (
              <span className={`${styles.tokenChange} ${change24h >= 0 ? styles.positive : styles.negative}`}>
                {change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
              </span>
            )}
          </div>
          <Link to="/token/lunes" className={styles.tokenLink}>
            <BarChart3 size={14} />
            Token Details
            <ExternalLink size={12} />
          </Link>
        </div>

        <div className={styles.tokenGrid}>
          <div className={styles.tokenStat}>
            <span className={styles.tokenStatLabel}>Market Cap</span>
            <span className={styles.tokenStatValue}>
              {marketCap > 0 ? `$${formatAbbreviatedNumber(marketCap)}` : '—'}
            </span>
          </div>
          <div className={styles.tokenStat}>
            <span className={styles.tokenStatLabel}>Volume (24h)</span>
            <span className={styles.tokenStatValue}>
              {!priceLoading ? `$${formatAbbreviatedNumber(volume24h)}` : '—'}
            </span>
          </div>
          <div className={styles.tokenStat}>
            <span className={styles.tokenStatLabel}>Total Supply</span>
            <span className={styles.tokenStatValue}>
              {statsLoading ? '...' : `${formatSupply(totalIssuance)} LUNES`}
            </span>
          </div>
          <div className={styles.tokenStat}>
            <span className={styles.tokenStatLabel}>Validators</span>
            <span className={styles.tokenStatValue}>
              {chainStats?.activeValidators || 0}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Pallet asset
  const asset = assets?.find((a) => a.id === tokenSymbol || a.symbol.toLowerCase() === tokenSymbol.toLowerCase());
  if (assetsLoading) {
    return (
      <div className={styles.tokenStatsContainer}>
        <div className={styles.tokenPriceBar}>
          <span className={styles.loadingText}>Loading token data...</span>
        </div>
      </div>
    );
  }
  if (!asset) return null;

  return (
    <div className={styles.tokenStatsContainer}>
      <div className={styles.tokenPriceBar}>
        <div className={styles.tokenPriceLeft}>
          <Coins size={20} className={styles.tokenIcon} />
          <span className={styles.tokenLabel}>{asset.symbol}</span>
          <span className={styles.tokenPriceValue}>{asset.name}</span>
        </div>
        <Link to={`/token/${asset.id}`} className={styles.tokenLink}>
          <Database size={14} />
          Asset Details
          <ExternalLink size={12} />
        </Link>
      </div>
      <div className={styles.tokenGrid}>
        <div className={styles.tokenStat}>
          <span className={styles.tokenStatLabel}>Total Supply</span>
          <span className={styles.tokenStatValue}>
            {formatSupply(asset.supplyFormatted)} {asset.symbol}
          </span>
        </div>
        <div className={styles.tokenStat}>
          <span className={styles.tokenStatLabel}>Holders</span>
          <span className={styles.tokenStatValue}>{asset.accounts}</span>
        </div>
        <div className={styles.tokenStat}>
          <span className={styles.tokenStatLabel}>Decimals</span>
          <span className={styles.tokenStatValue}>{asset.decimals}</span>
        </div>
        <div className={styles.tokenStat}>
          <span className={styles.tokenStatLabel}>Status</span>
          <span className={styles.tokenStatValue}>{asset.isFrozen ? 'Frozen' : 'Active'}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectTokenStats;
