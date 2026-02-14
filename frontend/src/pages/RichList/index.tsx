import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useRichList } from '../../hooks/useChainData';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import { LunesLogo } from '../../components/common/LunesLogo';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import type { RichListAccount } from '../../services/chain';
import styles from './RichList.module.css';

const PAGE_SIZE = 25;

function shortAddr(addr: string): string {
  if (!addr || addr.length < 16) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
}

function formatBalance(val: number): string {
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
  if (val >= 1) return val.toFixed(4);
  return val.toFixed(8);
}

const RichList: React.FC = () => {
  const { data, loading, error, refetch } = useRichList();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const accounts = data?.accounts || [];
  const totalAccounts = data?.totalAccounts || 0;
  const totalIssuance = data?.totalIssuanceFormatted || 0;

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.trim().toLowerCase();
    return accounts.filter(a => a.address.toLowerCase().includes(q));
  }, [accounts, search]);

  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE);
  const pageAccounts = filteredAccounts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const goToPage = (p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)));
  };

  const top10Total = accounts.slice(0, 10).reduce((acc, a) => acc + a.totalFormatted, 0);
  const top10Pct = totalIssuance > 0 ? (top10Total / totalIssuance) * 100 : 0;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Rich List</h1>
          <p className={styles.subtitle}>Loading all accounts from the blockchain...</p>
        </div>
        <div className={styles.loadingContainer}>
          <Loader2 size={40} className={styles.spinner} />
          <span>Fetching all account balances via RPC...</span>
          <span style={{ fontSize: '12px', opacity: 0.6 }}>This may take a moment on first load</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Rich List</h1>
        </div>
        <div className={styles.loadingContainer}>
          <AlertCircle size={40} />
          <span>Failed to load account data</span>
          <span style={{ fontSize: '12px', opacity: 0.6 }}>{error}</span>
          <button
            onClick={refetch}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: 'var(--color-brand-600)', color: 'white', cursor: 'pointer',
              fontWeight: 600, marginTop: '8px',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Trophy size={28} style={{ verticalAlign: 'middle', marginRight: '10px', color: '#FFC107' }} />
          Rich List
        </h1>
        <p className={styles.subtitle}>
          Top wallets by balance on the Lunes blockchain — {totalAccounts.toLocaleString()} accounts with balance
        </p>
        <DataSourceBadge source="RPC" updatedAt={`Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`} />
      </div>

      {/* Summary stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Accounts</span>
          <span className={styles.statValue}>{totalAccounts.toLocaleString()}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Supply</span>
          <span className={styles.statValue}>{formatBalance(totalIssuance)} LUNES</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Top 10 Concentration</span>
          <span className={styles.statValue}>{top10Pct.toFixed(2)}%</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>#1 Wallet</span>
          <span className={styles.statValue}>
            {accounts.length > 0 ? formatBalance(accounts[0].totalFormatted) : '—'}
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        marginBottom: '16px', flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px', padding: '8px 14px', flex: '1', maxWidth: '400px',
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by address..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'white', fontSize: '14px', width: '100%',
            }}
          />
        </div>
        {search && (
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {filteredAccounts.length} result{filteredAccounts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '50px' }}>#</th>
                <th>Address</th>
                <th style={{ textAlign: 'right' }}>Free Balance</th>
                <th style={{ textAlign: 'right' }}>Reserved</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right', width: '160px' }}>% of Supply</th>
              </tr>
            </thead>
            <tbody>
              {pageAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {search ? 'No accounts match your search' : 'No accounts found'}
                  </td>
                </tr>
              ) : (
                pageAccounts.map((account: RichListAccount, idx: number) => {
                  const globalRank = search
                    ? accounts.findIndex(a => a.address === account.address) + 1
                    : page * PAGE_SIZE + idx + 1;
                  return (
                    <tr key={account.address}>
                      <td className={`${styles.rank} ${globalRank <= 3 ? styles.rankTop : ''}`}>
                        {globalRank <= 3 ? (
                          <span style={{ fontSize: '16px' }}>
                            {globalRank === 1 ? '🥇' : globalRank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : globalRank}
                      </td>
                      <td>
                        <div className={styles.address}>
                          <Link to={`/account/${account.address}`} className={styles.addressLink}>
                            {shortAddr(account.address)}
                          </Link>
                          <CopyToClipboard text={account.address} />
                        </div>
                      </td>
                      <td className={styles.balance} style={{ textAlign: 'right' }}>
                        {formatBalance(account.freeFormatted)}
                      </td>
                      <td className={styles.balanceMuted} style={{ textAlign: 'right' }}>
                        {account.reservedFormatted > 0 ? formatBalance(account.reservedFormatted) : '—'}
                      </td>
                      <td className={styles.balance} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <LunesLogo size={14} />
                          {formatBalance(account.totalFormatted)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={styles.percentBar}>
                          <div className={styles.percentTrack}>
                            <div
                              className={styles.percentFill}
                              style={{ width: `${Math.min(account.percentOfSupply, 100)}%` }}
                            />
                          </div>
                          <span className={styles.percentLabel}>
                            {account.percentOfSupply >= 0.01
                              ? `${account.percentOfSupply.toFixed(2)}%`
                              : '<0.01%'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
            flexWrap: 'wrap', gap: '12px',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredAccounts.length)} of {filteredAccounts.length.toLocaleString()}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PaginationBtn onClick={() => goToPage(0)} disabled={page === 0}>
                <ChevronsLeft size={16} />
              </PaginationBtn>
              <PaginationBtn onClick={() => goToPage(page - 1)} disabled={page === 0}>
                <ChevronLeft size={16} />
              </PaginationBtn>

              {getPageNumbers(page, totalPages).map((p, i) =>
                p === -1 ? (
                  <span key={`ellipsis-${i}`} style={{ padding: '0 6px', color: 'var(--text-muted)' }}>…</span>
                ) : (
                  <PaginationBtn
                    key={p}
                    onClick={() => goToPage(p)}
                    active={p === page}
                  >
                    {p + 1}
                  </PaginationBtn>
                )
              )}

              <PaginationBtn onClick={() => goToPage(page + 1)} disabled={page >= totalPages - 1}>
                <ChevronRight size={16} />
              </PaginationBtn>
              <PaginationBtn onClick={() => goToPage(totalPages - 1)} disabled={page >= totalPages - 1}>
                <ChevronsRight size={16} />
              </PaginationBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Pagination button */
const PaginationBtn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, active, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: '32px', height: '32px', padding: '0 8px',
      borderRadius: '6px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: active ? 'var(--color-brand-600)' : 'rgba(255,255,255,0.05)',
      color: active ? 'white' : disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
      fontWeight: active ? 700 : 500, fontSize: '13px',
      transition: 'all 0.15s',
      opacity: disabled ? 0.4 : 1,
    }}
  >
    {children}
  </button>
);

/* Build page number array with ellipsis */
function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: number[] = [];
  pages.push(0);

  if (current > 3) pages.push(-1);

  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 4) pages.push(-1);

  pages.push(total - 1);

  return pages;
}

export default RichList;
