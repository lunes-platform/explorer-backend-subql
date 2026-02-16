import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';
import { GET_BLOCKS } from '../../services/graphql/queries';
import { SkeletonRows } from '../../components/common/Skeleton';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import EmptyState from '../../components/common/EmptyState';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import DegradedBanner from '../../components/common/DegradedBanner';
import { ExportButton } from '../../components/common/ExportButton';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getIndexerDegradedLevel, degradedToHealth } from '../../utils/indexerHealth';
import classes from './Blocks.module.css';

const PAGE_SIZE = 25;

function timeAgo(ts: number): string {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleString();
}

interface IndexerBlock {
  id: string;
  number: number;
  timestamp: string;
  specVersion: number;
}

interface GetBlocksResponse {
  blocks: {
    nodes: IndexerBlock[];
    totalCount: number;
  };
}

const Blocks: React.FC = () => {
  usePageTitle('Blocks', 'Browse all blocks on the Lunes blockchain. View block height, hash, timestamp, extrinsics count, and validator details.');
  const [page, setPage] = useState(0);
  const health = useHealthStatus();
  const degradedLevel = getIndexerDegradedLevel(health.rpc.latestBlock, health.indexer.latestBlock, false);
  const indexerHealth = degradedToHealth(degradedLevel);

  const { data: gqlData, loading, error, refetch } = useQuery<GetBlocksResponse>(GET_BLOCKS, {
    variables: { first: PAGE_SIZE, offset: page * PAGE_SIZE },
    pollInterval: 15000,
    fetchPolicy: 'cache-and-network',
  });

  const blocks = (gqlData?.blocks?.nodes || []).map(b => ({
    number: b.number,
    hash: b.id,
    timestamp: b.timestamp ? new Date(b.timestamp).getTime() : 0,
    extrinsicCount: 0,
    eventCount: 0,
  }));
  const totalCount = gqlData?.blocks?.totalCount || 0;
  const latestBlock = blocks.length > 0 ? blocks[0].number : 0;
  const estimatedTotalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  return (
    <div className={classes.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className={classes.title} style={{ marginBottom: 4 }}>Blocks</h1>
          {latestBlock > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Latest block: #{latestBlock.toLocaleString()} — Showing page {page + 1}
            </p>
          )}
          <DataSourceBadge source="INDEXER" updatedAt={!loading && blocks.length > 0 ? `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined} loading={loading} health={indexerHealth} />
          {degradedLevel && <DegradedBanner level={degradedLevel} source="SubQuery Indexer" onRetry={() => refetch()} />}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {blocks.length > 0 && (
            <ExportButton
              data={blocks}
              filename={`blocks-page${page + 1}-${new Date().toISOString().split('T')[0]}`}
              columns={[
                { key: 'number', label: 'Block' },
                { key: 'hash', label: 'Hash' },
                { key: 'extrinsicCount', label: 'Extrinsics' },
                { key: 'eventCount', label: 'Events' },
                { key: 'timestamp', label: 'Time', formatter: (v: number) => v ? new Date(v).toISOString() : '' },
              ]}
              label="Export"
            />
          )}
          <StatPill icon={<Box size={14} />} label="Latest" value={`#${latestBlock.toLocaleString()}`} />
          <StatPill icon={<Layers size={14} />} label="Page" value={`${page + 1}`} />
        </div>
      </div>

      <div className={classes.card}>
        <div className={classes.tableContainer}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th>Block</th>
                <th>Hash</th>
                <th style={{ textAlign: 'center' }}>Extrinsics</th>
                <th style={{ textAlign: 'center' }}>Events</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading && blocks.length === 0 ? (
                <SkeletonRows columns={5} rows={PAGE_SIZE} />
              ) : error ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      type="error"
                      message={error.message || 'Failed to load blocks'}
                      action={{ label: 'Try again', onClick: () => refetch() }}
                    />
                  </td>
                </tr>
              ) : blocks.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState type="no-data" message="No blocks found" />
                  </td>
                </tr>
              ) : (
                blocks.map((block) => (
                  <tr key={block.number}>
                    <td>
                      <Link to={`/block/${block.number}`} className={classes.link}>
                        #{block.number.toLocaleString()}
                      </Link>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Link
                          to={`/block/${block.number}`}
                          style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-brand-400)' }}
                        >
                          {block.hash.slice(0, 10)}...{block.hash.slice(-6)}
                        </Link>
                        <CopyToClipboard text={block.hash} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        background: 'rgba(108, 56, 255, 0.1)', padding: '2px 8px',
                        borderRadius: 4, fontSize: 12, fontWeight: 600,
                        color: 'var(--color-brand-400)',
                      }}>
                        {block.extrinsicCount}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {block.eventCount}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {timeAgo(block.timestamp)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
          flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {blocks.length > 0 && (
              <>Blocks #{blocks[0]?.number.toLocaleString()} – #{blocks[blocks.length - 1]?.number.toLocaleString()}</>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NavBtn onClick={() => setPage(0)} disabled={page === 0}>First</NavBtn>
            <NavBtn onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              <ChevronLeft size={14} /> Prev
            </NavBtn>
            <span style={{
              padding: '6px 14px', fontSize: 13, fontWeight: 600,
              background: 'var(--color-brand-600)', borderRadius: 6, color: 'white',
            }}>
              {page + 1}
            </span>
            <NavBtn onClick={() => setPage(page + 1)} disabled={blocks.length < PAGE_SIZE}>
              Next <ChevronRight size={14} />
            </NavBtn>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavBtn: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '6px 12px', borderRadius: 6, border: 'none',
      background: 'rgba(255,255,255,0.05)', color: disabled ? 'rgba(255,255,255,0.2)' : 'white',
      cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
      opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
    }}
  >
    {children}
  </button>
);

const StatPill: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)',
  }}>
    {icon}
    <span>{label}:</span>
    <span style={{ color: 'white', fontWeight: 600 }}>{value}</span>
  </div>
);

export default Blocks;
