import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Coins, Users, Database, TrendingUp, TrendingDown,
  Shield, Hash, Snowflake, Loader2, BarChart3, ExternalLink,
} from 'lucide-react';
import { useAssets, useDashboardStats } from '../../hooks/useChainData';
import { useLunesPrice, formatPrice } from '../../hooks/useLunesPrice';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import { LunesLogo } from '../../components/common/LunesLogo';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import { ExportButton } from '../../components/common/ExportButton';
import EmptyState from '../../components/common/EmptyState';
import Card from '../../components/common/Card';
import { WatchlistButton } from '../../components/common/WatchlistButton';
import { useWatchlist } from '../../hooks/useWatchlist';
import { formatAbbreviatedNumber } from '../../data/tokenomics';
import { KNOWN_PROJECTS } from '../../data/knownProjects';
import AIExplanation from '../../components/common/AIExplanation';
import { useAIExplanation } from '../../hooks/useAIExplanation';
import styles from './TokenDetail.module.css';

function formatSupply(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

const TokenDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  usePageTitle(id === 'lunes' ? 'LUNES Token' : `Token #${id}`);
  const { data: assets, loading: assetsLoading } = useAssets();
  const { data: chainStats, loading: statsLoading } = useDashboardStats();
  const { price, change24h, volume24h, loading: priceLoading } = useLunesPrice();
  const health = useHealthStatus();
  const { isWatched, toggleItem } = useWatchlist();

  const rpcHealth = health.rpc.status === 'connected' ? 'healthy' as const
    : health.rpc.status === 'connecting' ? 'delayed' as const : 'disconnected' as const;
  const loading = assetsLoading || statsLoading;
  const { explanation, loading: aiLoading, explain, clear } = useAIExplanation();

  // LUNES native token
  if (id === 'lunes') {
    const totalIssuance = chainStats?.totalIssuanceFormatted || 0;
    const marketCap = price > 0 && totalIssuance > 0 ? price * totalIssuance : 0;

    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/tokens" className={styles.backLink}><ArrowLeft size={16} /> Back to Tokens</Link>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ExportButton
              data={[{
                name: 'Lunes',
                symbol: 'LUNES',
                type: 'Native',
                decimals: chainStats?.tokenDecimals || 8,
                totalSupply: totalIssuance,
                marketCap: marketCap > 0 ? `$${marketCap.toFixed(2)}` : '',
                price: price > 0 ? formatPrice(price) : '',
                change24h: `${change24h.toFixed(2)}%`,
                validators: chainStats?.activeValidators || 0,
              }]}
              filename={`token-lunes-${new Date().toISOString().split('T')[0]}`}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'symbol', label: 'Symbol' },
                { key: 'type', label: 'Type' },
                { key: 'decimals', label: 'Decimals' },
                { key: 'totalSupply', label: 'Total Supply' },
                { key: 'marketCap', label: 'Market Cap' },
                { key: 'price', label: 'Price' },
                { key: 'change24h', label: '24h Change' },
              ]}
              label="Export"
            />
            <WatchlistButton
              isWatched={isWatched('LUNES', 'token')}
              onToggle={() => toggleItem({ id: 'LUNES', type: 'token', symbol: 'LUNES', name: 'Lunes' })}
            />
          </div>
        </div>

        <div className={styles.hero}>
          <LunesLogo size={56} />
          <div>
            <h1 className={styles.tokenName}>
              Lunes <span className={styles.tokenSymbol}>LUNES</span>
            </h1>
            <p className={styles.tokenMeta}>Native token of the Lunes blockchain</p>
            <DataSourceBadge source="RPC + API" loading={loading || priceLoading} health={rpcHealth} />
          </div>
        </div>

        {/* Project Profile Link */}
        {(() => {
          const linkedProject = KNOWN_PROJECTS.find(p => p.tokenSymbol === 'lunes');
          return linkedProject ? (
            <Link to={`/project/${linkedProject.slug}`} className={styles.projectBanner}>
              <div className={styles.projectBannerLeft}>
                <ExternalLink size={16} />
                <div>
                  <span className={styles.projectBannerTitle}>View Full Project Profile</span>
                  <span className={styles.projectBannerDesc}>
                    About, Team, Roadmap, Community & more on {linkedProject.name}
                  </span>
                </div>
              </div>
              <span className={styles.projectBannerArrow}>→</span>
            </Link>
          ) : null;
        })()}

        {/* AI Explanation */}
        <AIExplanation
          result={explanation}
          loading={aiLoading}
          error={null}
          onExplain={() => explain('account', {
            address: 'LUNES (Native Token)',
            totalFormatted: totalIssuance,
            freeFormatted: marketCap,
            reservedFormatted: 0,
            nonce: chainStats?.activeValidators || 0,
            sources: [
              `Price: ${formatPrice(price)}`,
              `Market Cap: $${formatAbbreviatedNumber(marketCap)}`,
              `Supply: ${formatSupply(totalIssuance)} LUNES`,
              `${chainStats?.activeValidators || 0} validators`,
            ],
          })}
          onClose={clear}
          showButton={true}
        />

        {/* Price */}
        <div className={styles.nativePrice}>
          <span className={styles.priceValue}>
            {priceLoading ? '...' : formatPrice(price)}
          </span>
          {!priceLoading && (
            <span className={`${styles.priceChange} ${change24h >= 0 ? styles.positive : styles.negative}`}>
              {change24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          )}
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Market Cap</span>
            <span className={styles.statValue}>{marketCap > 0 ? `$${formatAbbreviatedNumber(marketCap)}` : '—'}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Volume (24h)</span>
            <span className={styles.statValue}>{!priceLoading ? `$${formatAbbreviatedNumber(volume24h)}` : '—'}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Supply</span>
            <span className={styles.statValue}>{statsLoading ? '...' : `${formatSupply(totalIssuance)} LUNES`}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Validators</span>
            <span className={styles.statValue}>{chainStats?.activeValidators || 0}</span>
          </div>
        </div>

        {/* Details */}
        <Card title="Token Details" icon={<Database size={18} />}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Type</span>
              <span className={styles.infoValue}>Native</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Decimals</span>
              <span className={styles.infoValue}>{chainStats?.tokenDecimals || 8}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Symbol</span>
              <span className={styles.infoValue}>{chainStats?.tokenSymbol || 'LUNES'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Current Era</span>
              <span className={styles.infoValue}>{chainStats?.currentEra?.toLocaleString() || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Smart Contracts</span>
              <span className={styles.infoValue}>{chainStats?.totalContracts || 0}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Raw Issuance</span>
              <span className={styles.infoValue} style={{ fontSize: 11 }}>
                {chainStats?.totalIssuance ? `${chainStats.totalIssuance.slice(0, 20)}...` : '—'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Pallet asset by ID
  const asset = assets?.find((a) => a.id === id);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
          <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading asset data...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className={styles.container}>
        <Link to="/tokens" className={styles.backLink}><ArrowLeft size={16} /> Back to Tokens</Link>
        <EmptyState type="no-data" message={`Asset #${id} not found on chain`} action={{ label: 'View All Tokens', onClick: () => { window.location.href = '/tokens'; } }} />
      </div>
    );
  }

  const iconHue = (parseInt(asset.id) * 137) % 360;

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/tokens" className={styles.backLink}><ArrowLeft size={16} /> Back to Tokens</Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ExportButton
            data={[{
              id: asset.id,
              name: asset.name,
              symbol: asset.symbol,
              decimals: asset.decimals,
              totalSupply: asset.supplyFormatted,
              owner: asset.owner,
              frozen: asset.isFrozen ? 'Yes' : 'No',
              holders: asset.accounts,
            }]}
            filename={`token-${asset.symbol}-${new Date().toISOString().split('T')[0]}`}
            columns={[
              { key: 'id', label: 'Asset ID' },
              { key: 'name', label: 'Name' },
              { key: 'symbol', label: 'Symbol' },
              { key: 'decimals', label: 'Decimals' },
              { key: 'totalSupply', label: 'Total Supply' },
              { key: 'owner', label: 'Owner' },
              { key: 'frozen', label: 'Frozen' },
              { key: 'holders', label: 'Holders' },
            ]}
            label="Export"
          />
          <WatchlistButton
            isWatched={isWatched(asset.id, 'token')}
            onToggle={() => toggleItem({ id: asset.id, type: 'token', symbol: asset.symbol, name: asset.name })}
          />
        </div>
      </div>

      <div className={styles.hero}>
        <div className={styles.tokenIcon} style={{ background: `hsl(${iconHue}, 60%, 45%)` }}>
          {asset.symbol.charAt(0)}
        </div>
        <div>
          <h1 className={styles.tokenName}>
            {asset.name} <span className={styles.tokenSymbol}>{asset.symbol}</span>
          </h1>
          <p className={styles.tokenMeta}>Pallet Asset #{asset.id}</p>
          <DataSourceBadge source="RPC" loading={loading} health={rpcHealth} />
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Supply</span>
          <span className={styles.statValue}>{formatSupply(asset.supplyFormatted)} {asset.symbol}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Holders</span>
          <span className={styles.statValue}>{asset.accounts}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Decimals</span>
          <span className={styles.statValue}>{asset.decimals}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Status</span>
          <span className={styles.statValue}>{asset.isFrozen ? 'Frozen' : 'Active'}</span>
        </div>
      </div>

      {/* Details */}
      <Card title="Asset Details" icon={<Database size={18} />}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Asset ID</span>
            <span className={styles.infoValue}>#{asset.id}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Name</span>
            <span className={styles.infoValue}>{asset.name}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Symbol</span>
            <span className={styles.infoValue}>{asset.symbol}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Decimals</span>
            <span className={styles.infoValue}>{asset.decimals}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Owner</span>
            <CopyToClipboard text={asset.owner} truncate truncateLength={8} />
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Min Balance</span>
            <span className={styles.infoValue}>{asset.minBalance}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Frozen</span>
            <span className={styles.infoValue} style={{ color: asset.isFrozen ? 'var(--color-critical)' : 'var(--color-success)' }}>
              {asset.isFrozen ? 'Yes' : 'No'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Raw Supply</span>
            <span className={styles.infoValue} style={{ fontSize: 11 }}>
              {asset.supply.length > 20 ? `${asset.supply.slice(0, 20)}...` : asset.supply}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TokenDetail;
