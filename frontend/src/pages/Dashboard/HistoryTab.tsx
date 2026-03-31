import { Link } from 'react-router-dom';
import { History, ArrowUpRight, ArrowDownLeft, Loader2, ExternalLink } from 'lucide-react';
import { useAccountTransfers } from '../../hooks/useChainData';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import styles from './Dashboard.module.css';

interface Props { address: string; }

export default function HistoryTab({ address }: Props) {
  const { data: transfers, loading, error, refetch } = useAccountTransfers(address, 50);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}><History size={22} /> Transaction History</h2>
        <p className={styles.pageSubtitle}>Recent transfers involving your account (last ~100 blocks scanned via RPC)</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
          <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Scanning recent blocks for your transfers...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--color-critical)', fontSize: 13 }}>{error}</p>
          <button className={styles.submitBtn} onClick={refetch} style={{ marginTop: 12 }}>Retry</button>
        </div>
      ) : !transfers || transfers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
          No recent transfers found in the last 100 blocks. Transfers from earlier blocks will appear once the indexer catches up.
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Direction</th>
              <th>Block</th>
              <th>From</th>
              <th>To</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((tx, i) => {
              const isIncoming = tx.to === address;
              return (
                <tr key={`${tx.blockNumber}-${tx.extrinsicIndex}-${i}`}>
                  <td>
                    {isIncoming ? (
                      <span className={styles.badgeIn} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ArrowDownLeft size={12} /> IN
                      </span>
                    ) : (
                      <span className={styles.badgeOut} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ArrowUpRight size={12} /> OUT
                      </span>
                    )}
                  </td>
                  <td>
                    <Link to={`/block/${tx.blockNumber}`} style={{ color: 'var(--color-brand-400)', textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>
                      #{tx.blockNumber.toLocaleString()}
                    </Link>
                  </td>
                  <td>
                    {tx.from === address ? (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>You</span>
                    ) : (
                      <CopyToClipboard text={tx.from} truncate truncateLength={6} />
                    )}
                  </td>
                  <td>
                    {tx.to === address ? (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>You</span>
                    ) : (
                      <CopyToClipboard text={tx.to} truncate truncateLength={6} />
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                    <span style={{ color: isIncoming ? '#26d07c' : '#ff4d6a' }}>
                      {isIncoming ? '+' : '-'}{tx.amountFormatted.toLocaleString('en-US', { maximumFractionDigits: 4 })} LUNES
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <Link to={`/block/${tx.blockNumber}`} style={{ color: 'var(--text-muted)' }}>
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Showing {transfers?.length || 0} transfers from RPC scan
        </span>
        <Link to={`/account/${address}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-brand-400)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          Full Account Details <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}
