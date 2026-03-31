import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { GET_ASSET_TRANSFERS } from '../../services/graphql/queries';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import DegradedBanner from '../../components/common/DegradedBanner';
import { Pagination } from '../../components/common/Pagination';
import { IndexerAlert } from '../../components/common/IndexerAlert';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getIndexerDegradedLevel, degradedToHealth } from '../../utils/indexerHealth';
import type { AssetTransfer, GetAssetTransfersResponse } from '../../types';
import styles from '../AccountDetail/AccountDetail.module.css';

const PAGE_SIZE = 25;

function timeAgo(ts: string | number): string {
  const raw = typeof ts === 'string' ? Number(ts) : ts;
  if (!raw || Number.isNaN(raw)) return 'No timestamp';
  const msTs = raw < 1e12 ? raw * 1000 : raw;
  const diff = Math.floor((Date.now() - msTs) / 1000);
  if (diff < 0) return new Date(msTs).toLocaleString('pt-BR');
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatBigInt(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatTokenAmount(amount: string, decimals: number): string {
  if (!amount) return '0';
  const safeDecimals = Math.max(0, decimals);
  const value = BigInt(amount);
  const base = BigInt(10) ** BigInt(safeDecimals);
  const whole = value / base;
  const fraction = value % base;
  const precision = Math.min(6, safeDecimals);
  if (precision === 0) return formatBigInt(whole);
  const fractionStr = fraction.toString().padStart(safeDecimals, '0').slice(0, precision);
  const trimmed = fractionStr.replace(/0+$/, '');
  const wholeStr = formatBigInt(whole);
  return trimmed ? `${wholeStr}.${trimmed}` : wholeStr;
}

const AssetTransfers: React.FC = () => {
  usePageTitle('Asset Transfers', 'Browse asset transfer history across the Lunes blockchain.');
  const [searchParams] = useSearchParams();
  const assetIdParam = searchParams.get('assetId');
  const addressParam = searchParams.get('address') || searchParams.get('wallet');
  const assetId = assetIdParam ? assetIdParam.trim() : null;
  const address = addressParam ? addressParam.trim() : null;
  const useAssetFilter = Boolean(assetId);
  const useWalletFilter = Boolean(address);
  const useAssetAndWallet = useAssetFilter && useWalletFilter;
  const useAssetOnly = useAssetFilter && !useWalletFilter;
  const useWalletOnly = !useAssetFilter && useWalletFilter;
  const useAll = !useAssetFilter && !useWalletFilter;
  const [page, setPage] = useState(0);
  const { data, loading, error } = useQuery<GetAssetTransfersResponse>(GET_ASSET_TRANSFERS, {
    variables: {
      first: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      assetId: assetId || undefined,
      address: address || undefined,
      useAssetAndWallet,
      useAssetOnly,
      useWalletOnly,
      useAll,
    },
    pollInterval: 0,
  });
  const health = useHealthStatus();
  const degradedLevel = getIndexerDegradedLevel(health.rpc.latestBlock, health.indexer.latestBlock, !!error);

  const connection = data?.assetTransfersAssetAndWallet
    || data?.assetTransfersAssetOnly
    || data?.assetTransfersWalletOnly
    || data?.assetTransfersAll;
  const transfers = connection?.nodes || [];
  const totalCount = connection?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const uniqueAssets = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((tx) => {
      const id = tx.asset?.id || tx.assetId;
      if (id) set.add(id);
    });
    return set.size;
  }, [transfers]);

  useEffect(() => {
    setPage(0);
  }, [assetId, address]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <ArrowRightLeft size={24} />
          Asset Transfers
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
          {totalCount > 0 ? `${totalCount.toLocaleString()} transfers indexed` : 'Loading indexed data...'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <DataSourceBadge
            source="INDEXER"
            updatedAt={!loading && transfers.length > 0 ? `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined}
            loading={loading}
            health={degradedToHealth(degradedLevel)}
          />
        </div>
      </div>

      {degradedLevel && (
        <DegradedBanner
          level={degradedLevel}
          source="SubQuery Indexer"
          onRetry={() => window.location.reload()}
        />
      )}

      <IndexerAlert lag={health.indexer.lag} />

      <Card title="Transfer History" icon={<ArrowRightLeft size={18} />}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
            <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Loading asset transfers...</p>
          </div>
        ) : error ? (
          <EmptyState
            type="error"
            message={error.message}
            action={{ label: 'Try Again', onClick: () => window.location.reload() }}
          />
        ) : transfers.length === 0 ? (
          <EmptyState type="no-data" message="No asset transfers indexed yet. The indexer is syncing..." />
        ) : (
          <div className={styles.transfersList}>
            <div style={{
              display: 'flex',
              gap: '24px',
              padding: '12px 16px',
              marginBottom: '8px',
              background: 'rgba(108, 56, 255, 0.06)',
              borderRadius: '8px',
              fontSize: '13px',
              flexWrap: 'wrap',
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{transfers.length}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Assets: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{uniqueAssets}</strong>
              </div>
            </div>

            {transfers.map((tx: AssetTransfer, idx: number) => {
              const decimals = tx.asset?.decimals ?? 0;
              const symbol = tx.asset?.symbol || '';
              const assetName = tx.asset?.name || (tx.asset?.id ? `Asset #${tx.asset.id}` : tx.assetId ? `Asset #${tx.assetId}` : 'Asset');
              return (
                <div key={`${tx.id}-${idx}`} className={styles.transferItem} style={{ padding: '16px 20px' }}>
                  <div className={styles.transferMain} style={{ flex: 1 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(108, 56, 255, 0.12)',
                      flexShrink: 0,
                    }}>
                      <ArrowRightLeft size={14} color="var(--color-brand-400)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tx Id</span>
                        <Link to={`/tx/${tx.id}`} style={{ color: 'var(--color-brand-400)', textDecoration: 'none', fontSize: '12px' }}>
                          #{tx.id}
                        </Link>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{timeAgo(tx.timestamp)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)' }}>From:</span>
                        <Link to={`/account/${tx.fromId}`} style={{ color: 'var(--color-brand-400)', textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
                          {shortAddr(tx.fromId)}
                        </Link>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span style={{ color: 'var(--text-muted)' }}>To:</span>
                        <Link to={`/account/${tx.toId}`} style={{ color: 'var(--color-brand-400)', textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
                          {shortAddr(tx.toId)}
                        </Link>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Asset:</span>
                        {tx.asset?.id || tx.assetId ? (
                          <Link
                            to={`/project/${tx.asset?.name?.toLocaleLowerCase()}`}
                            style={{ color: 'var(--color-brand-400)', textDecoration: 'none', fontSize: '12px' }}
                          >
                            {assetName}
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{assetName}</span>
                        )}
                        {symbol && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                            ({symbol})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-brand-400)' }}>
                      {formatTokenAmount(tx.amount, decimals)} {symbol}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && transfers.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalCount}
            pageSize={PAGE_SIZE}
          />
        )}
      </Card>
    </div>
  );
};

export default AssetTransfers;
