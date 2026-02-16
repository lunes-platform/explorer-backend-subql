import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Search, Loader2, Users, Lock, Unlock } from 'lucide-react';
import { useAssets, useDashboardStats } from '../../hooks/useChainData';
import { LunesLogo } from '../../components/common/LunesLogo';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import EmptyState from '../../components/common/EmptyState';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { useTokenPrices } from '../../hooks/useTokenPrices';
import styles from './TokenList.module.css';

function formatSupply(supply: number, decimals: number = 2): string {
  if (supply >= 1e12) return `${(supply / 1e12).toFixed(decimals)}T`;
  if (supply >= 1e9) return `${(supply / 1e9).toFixed(decimals)}B`;
  if (supply >= 1e6) return `${(supply / 1e6).toFixed(decimals)}M`;
  if (supply >= 1e3) return `${(supply / 1e3).toFixed(decimals)}K`;
  return supply.toFixed(decimals);
}

const TokenList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: assets, loading, error, refetch } = useAssets();
  const { data: chainStats, loading: statsLoading } = useDashboardStats();
  const health = useHealthStatus();
  const { price: lunesPrice } = useLunesPrice();
  const { getByAssetId } = useTokenPrices();
  const rpcHealth = health.rpc.status === 'connected' ? 'healthy' as const : health.rpc.status === 'connecting' ? 'delayed' as const : 'disconnected' as const;

  const totalIssuance = chainStats?.totalIssuanceFormatted || 0;

  let displayAssets = assets || [];
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    displayAssets = displayAssets.filter(a =>
      a.name.toLowerCase().includes(term) ||
      a.symbol.toLowerCase().includes(term) ||
      a.id.includes(term)
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Coins size={28} />
          Tokens & Assets
        </h1>
        <p className={styles.subtitle}>
          All tokens and assets on Lunes Blockchain — real-time data from RPC.
        </p>
        <DataSourceBadge source="RPC" updatedAt={!loading && assets ? `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined} loading={loading} health={rpcHealth} />
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{statsLoading ? '...' : (1 + (assets?.length || 0))}</span>
          <span className={styles.statLabel}>Total Assets</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {statsLoading ? '...' : `${formatSupply(totalIssuance)} LUNES`}
          </span>
          <span className={styles.statLabel}>Native Supply</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{loading ? '...' : (assets?.length || 0)}</span>
          <span className={styles.statLabel}>Pallet Assets</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {loading ? '...' : (assets?.reduce((s, a) => s + a.accounts, 0) || 0)}
          </span>
          <span className={styles.statLabel}>Asset Holders</span>
        </div>
      </div>

      {/* Search */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, symbol, or asset ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Assets Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Asset</th>
              <th>Symbol</th>
              <th style={{ textAlign: 'right' }}>Decimals</th>
              <th style={{ textAlign: 'right' }}>Total Supply</th>
              <th style={{ textAlign: 'right' }}>Price (USD)</th>
              <th style={{ textAlign: 'right' }}>Holders</th>
              <th>Status</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {/* LUNES native token - always first */}
            <tr 
              className={styles.assetRow}
              style={{ cursor: 'pointer' }}
              onClick={() => window.location.href = '/project/lunes-network'}
            >
              <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>1</td>
              <td>
                <div className={styles.assetCell}>
                  <div className={styles.assetIcon} style={{ backgroundColor: 'rgba(38,208,124,0.12)', color: '#26D07C' }}>
                    <LunesLogo size={20} />
                  </div>
                  <div className={styles.assetInfo}>
                    <span className={styles.assetName}>Lunes</span>
                    <span className={styles.assetId}>Native Token</span>
                  </div>
                </div>
              </td>
              <td><span className={styles.assetSymbol}>LUNES</span></td>
              <td style={{ textAlign: 'right' }}><span className={styles.assetDecimals}>8</span></td>
              <td style={{ textAlign: 'right' }}>
                <span className={styles.assetSupply}>
                  {statsLoading ? '...' : formatSupply(totalIssuance)}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span style={{ color: lunesPrice > 0 ? 'var(--color-brand-400)' : 'var(--text-muted)', fontWeight: 500 }}>
                  {lunesPrice > 0 ? `$${lunesPrice.toFixed(4)}` : '—'}
                </span>
              </td>
              <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
              <td>
                <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(38,208,124,0.15)', borderRadius: 4, color: '#26D07C' }}>
                  Native
                </span>
              </td>
              <td>
                <Link 
                  to="/project/lunes-network" 
                  className={styles.ownerLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  Lunes Network
                </Link>
              </td>
            </tr>

            {/* Chain assets from RPC */}
            {loading && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 20 }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                  <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>Loading assets from blockchain...</span>
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    type="error"
                    message={error}
                    action={{ label: 'Try Again', onClick: refetch }}
                  />
                </td>
              </tr>
            )}
            {!loading && displayAssets.map((asset, index) => (
              <tr key={asset.id} className={styles.assetRow}>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>{index + 2}</td>
                <td>
                  <div className={styles.assetCell}>
                    <div
                      className={styles.assetIcon}
                      style={{
                        backgroundColor: `hsl(${(parseInt(asset.id) * 137) % 360}, 60%, 15%)`,
                        color: `hsl(${(parseInt(asset.id) * 137) % 360}, 60%, 55%)`,
                      }}
                    >
                      {asset.symbol.charAt(0)}
                    </div>
                    <div className={styles.assetInfo}>
                      <span className={styles.assetName}>{asset.name}</span>
                      <span className={styles.assetId}>Asset #{asset.id}</span>
                    </div>
                  </div>
                </td>
                <td><span className={styles.assetSymbol}>{asset.symbol}</span></td>
                <td style={{ textAlign: 'right' }}><span className={styles.assetDecimals}>{asset.decimals}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <span className={styles.assetSupply}>{formatSupply(asset.supplyFormatted)} {asset.symbol}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {(() => {
                    const tp = getByAssetId(asset.id);
                    if (tp && tp.price > 0) {
                      return (
                        <span style={{ color: 'var(--color-brand-400)', fontWeight: 500 }}>
                          ${tp.price.toFixed(tp.price >= 1 ? 2 : 4)}
                        </span>
                      );
                    }
                    return <span style={{ color: 'var(--text-muted)' }}>—</span>;
                  })()}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                    <Users size={12} /> {asset.accounts}
                  </span>
                </td>
                <td>
                  {asset.isFrozen ? (
                    <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,59,48,0.15)', borderRadius: 4, color: '#FF3B30', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Lock size={10} /> Frozen
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(38,208,124,0.15)', borderRadius: 4, color: '#26D07C', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Unlock size={10} /> Active
                    </span>
                  )}
                </td>
                <td>
                  {asset.owner ? (
                    <CopyToClipboard text={asset.owner} truncate truncateLength={8} />
                  ) : (
                    <span className={styles.noContract}>—</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && !error && displayAssets.length === 0 && searchTerm && (
              <tr>
                <td colSpan={9}>
                  <EmptyState type="no-data" message="No assets found matching your search" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenList;
