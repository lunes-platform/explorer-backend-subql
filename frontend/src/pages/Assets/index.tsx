import React, { useState } from 'react';
import { Coins, Search, Loader2, FolderOpen, Users, Lock, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAssets, useDashboardStats } from '../../hooks/useChainData';
import { LunesLogo } from '../../components/common/LunesLogo';
import { useProjectLookup } from '../../hooks/useProjects';
import EmptyState from '../../components/common/EmptyState';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { useLunesPrice, formatPrice } from '../../hooks/useLunesPrice';
import { useTokenPrices } from '../../hooks/useTokenPrices';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import styles from './Assets.module.css';

function formatSupply(supply: number, decimals: number = 2): string {
  if (supply >= 1e12) return `${(supply / 1e12).toFixed(decimals)}T`;
  if (supply >= 1e9) return `${(supply / 1e9).toFixed(decimals)}B`;
  if (supply >= 1e6) return `${(supply / 1e6).toFixed(decimals)}M`;
  if (supply >= 1e3) return `${(supply / 1e3).toFixed(decimals)}K`;
  return supply.toFixed(decimals);
}

const Assets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: assets, loading: assetsLoading, error, refetch } = useAssets();
  const { data: chainStats, loading: statsLoading } = useDashboardStats();
  const health = useHealthStatus();
  const { price: lunesPrice } = useLunesPrice();
  const { getByAssetId } = useTokenPrices();
  const { getByAssetId: getProjectByAssetId } = useProjectLookup();
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
          Network Assets
        </h1>
        <p className={styles.subtitle}>
          All native and pallet-assets registered on the Lunes blockchain (real-time RPC data)
        </p>
        <DataSourceBadge source="RPC" updatedAt={!assetsLoading && assets ? `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined} loading={assetsLoading} health={rpcHealth} />
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
          <span className={styles.statValue}>{assetsLoading ? '...' : (assets?.length || 0)}</span>
          <span className={styles.statLabel}>Pallet Assets</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>
            {assetsLoading ? '...' : (assets?.reduce((s, a) => s + a.accounts, 0) || 0)}
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
        <table className={styles.tokensTable}>
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
              className={styles.clickableRow}
              onClick={() => window.location.href = '/project/lunes-network'}
            >
              <td className={styles.rankCell}>1</td>
              <td>
                <div className={styles.tokenInfo}>
                  <div className={styles.tokenIcon} style={{ backgroundColor: 'rgba(38,208,124,0.12)', color: '#26D07C' }}>
                    <LunesLogo size={20} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className={styles.tokenSim}>Lunes</span>
                    <span className={styles.tokenName}>Native Token</span>
                  </div>
                </div>
              </td>
              <td style={{ fontWeight: 500 }}>LUNES</td>
              <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>8</td>
              <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                {statsLoading ? '...' : formatSupply(totalIssuance)}
              </td>
              <td style={{ textAlign: 'right' }}>
                <span style={{ color: lunesPrice > 0 ? 'var(--color-brand-400)' : 'var(--text-muted)', fontWeight: 500 }}>
                  {lunesPrice > 0 ? formatPrice(lunesPrice) : '—'}
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
                  style={{ color: 'var(--color-brand-400)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Lunes Network
                </Link>
              </td>
            </tr>

            {/* Chain assets from RPC */}
            {assetsLoading && (
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
            {!assetsLoading && displayAssets.map((asset, index) => {
              const project = getProjectByAssetId(asset.id);
              const projectLogo = project?.logo;
              return (
              <tr key={asset.id} className={styles.clickableRow} style={{ cursor: project ? 'pointer' : undefined }} onClick={project ? () => window.location.href = `/project/${project.slug}` : undefined}>
                <td className={styles.rankCell}>{index + 2}</td>
                <td>
                  <div className={styles.tokenInfo}>
                    <div
                      className={styles.tokenIcon}
                      style={{
                        background: projectLogo ? 'transparent' : `hsl(${(parseInt(asset.id) * 137) % 360}, 60%, 45%)`,
                        overflow: 'hidden',
                      }}
                    >
                      {projectLogo ? (
                        <img
                          src={projectLogo}
                          alt={asset.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = 'none';
                            el.parentElement!.style.background = `hsl(${(parseInt(asset.id) * 137) % 360}, 60%, 45%)`;
                            el.parentElement!.textContent = asset.symbol.charAt(0);
                          }}
                        />
                      ) : (
                        asset.symbol.charAt(0)
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className={styles.tokenSim}>{asset.name}</span>
                      <span className={styles.tokenName}>Asset #{asset.id}</span>
                      {project && (
                        <Link
                          to={`/project/${project.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: 11, color: 'var(--color-brand-400)', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none', marginTop: 2 }}
                        >
                          <FolderOpen size={10} />
                          {project.name}
                        </Link>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{asset.symbol}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{asset.decimals}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatSupply(asset.supplyFormatted)} {asset.symbol}</td>
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
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
              </tr>
              );
            })}
            {!assetsLoading && !error && displayAssets.length === 0 && searchTerm && (
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

export default Assets;
