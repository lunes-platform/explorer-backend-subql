import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Clock,
  Hash,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { useBlockDetail } from '../../hooks/useChainData';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import Card from '../../components/common/Card';
import { Skeleton } from '../../components/common/Skeleton';

const BlockDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: block, loading, error } = useBlockDetail(id);

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        <Skeleton height={32} width="300px" />
        <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
          <Skeleton height={200} />
          <Skeleton height={300} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-critical)', marginBottom: 16 }} />
        <h2 style={{ marginBottom: 8 }}>Error loading block</h2>
        <p style={{ color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  if (!block) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <Box size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <h2 style={{ marginBottom: 8 }}>Block not found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          Block #{id} could not be found on the Lunes blockchain.
        </p>
        <Link to="/blocks" style={{ color: 'var(--color-brand-400)' }}>← Back to Blocks</Link>
      </div>
    );
  }

  const timeAgo = block.timestamp > 0
    ? new Date(block.timestamp).toLocaleString()
    : 'Unknown';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/blocks')}
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8,
              padding: '8px 12px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700,
            background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Block #{block.number.toLocaleString()}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => navigate(`/block/${block.number - 1}`)}
            disabled={block.number <= 0}
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6,
              padding: '6px 12px', cursor: 'pointer', color: 'white', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 4, opacity: block.number <= 0 ? 0.3 : 1,
            }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            onClick={() => navigate(`/block/${block.number + 1}`)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6,
              padding: '6px 12px', cursor: 'pointer', color: 'white', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {/* Overview Card */}
        <Card title="Overview" icon={<Layers size={18} />}>
          <div style={{ display: 'grid', gap: 0 }}>
            <InfoRow label="Block Number" value={`#${block.number.toLocaleString()}`} />
            <InfoRow label="Timestamp" value={timeAgo} icon={<Clock size={14} style={{ color: 'var(--text-muted)' }} />} />
            <InfoRow label="Block Hash" mono>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>{block.hash}</span>
                <CopyToClipboard text={block.hash} />
              </div>
            </InfoRow>
            <InfoRow label="Parent Hash" mono>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link
                  to={`/block/${block.number - 1}`}
                  style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-brand-400)', wordBreak: 'break-all' }}
                >
                  {block.parentHash}
                </Link>
                <CopyToClipboard text={block.parentHash} />
              </div>
            </InfoRow>
            <InfoRow label="State Root" mono>
              <span style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', color: 'var(--text-muted)' }}>{block.stateRoot}</span>
            </InfoRow>
            <InfoRow label="Extrinsics Root" mono>
              <span style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', color: 'var(--text-muted)' }}>{block.extrinsicsRoot}</span>
            </InfoRow>
            <InfoRow label="Spec Version" value={block.specVersion.toString()} />
            <InfoRow label="Extrinsics" value={block.extrinsicCount.toString()} />
            <InfoRow label="Events" value={block.eventCount.toString()} />
          </div>
        </Card>

        {/* Extrinsics Card */}
        <Card title={`Extrinsics (${block.extrinsicCount})`} icon={<Hash size={18} />}>
          {block.extrinsics.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              No extrinsics in this block
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Hash</th>
                    <th style={thStyle}>Method</th>
                    <th style={thStyle}>Signer</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {block.extrinsics.map((ext) => (
                    <tr key={ext.index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{block.number}-{ext.index}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-brand-400)' }}>
                            {ext.hash.slice(0, 10)}...{ext.hash.slice(-6)}
                          </span>
                          <CopyToClipboard text={ext.hash} />
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          background: 'rgba(108, 56, 255, 0.1)', padding: '3px 8px',
                          borderRadius: 4, fontSize: 12, fontFamily: 'monospace', fontWeight: 600,
                          color: 'var(--color-brand-400)',
                        }}>
                          {ext.section}.{ext.method}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {ext.signer ? (
                          <Link
                            to={`/account/${ext.signer}`}
                            style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-brand-400)' }}
                          >
                            {ext.signer.slice(0, 8)}...{ext.signer.slice(-6)}
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Unsigned</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {ext.success ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                            background: 'rgba(38, 208, 124, 0.1)', color: 'var(--color-success)',
                          }}>
                            <CheckCircle size={12} /> Success
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                            background: 'rgba(255, 40, 76, 0.1)', color: 'var(--color-critical)',
                          }}>
                            <XCircle size={12} /> Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

/* Helper: info row for the overview card */
const InfoRow: React.FC<{
  label: string;
  value?: string;
  mono?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ label, value, mono, icon, children }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16,
    padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    alignItems: 'center',
  }}>
    <span style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon} {label}
    </span>
    {children || (
      <span style={{ fontFamily: mono ? 'monospace' : 'inherit', fontSize: 14 }}>
        {value}
      </span>
    )}
  </div>
);

const thStyle: React.CSSProperties = {
  padding: '12px 14px', fontSize: 11, textTransform: 'uppercase',
  letterSpacing: '0.8px', color: 'var(--text-muted)',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  background: 'rgba(255,255,255,0.02)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: 14,
};

export default BlockDetail;
