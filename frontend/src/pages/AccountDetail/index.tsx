import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { 
  ArrowLeft, 
  Wallet, 
  Activity, 
  Coins, 
  Hexagon,
  Image,
  Sparkles,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Loader2,
  Copy,
  Hash
} from 'lucide-react';
import Card from '../../components/common/Card';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Skeleton, CardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { useAccountInfo, useAccountStaking, useAccountTransfers } from '../../hooks/useChainData';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { 
  GET_ACCOUNT_TOKENS, 
  GET_ACCOUNT_NFTS 
} from '../../services/graphql/queries';
import type { 
  GetAccountTokensResponse,
  GetAccountNftsResponse,
  PSP22Account,
  NftAccount
} from '../../types';
import styles from './AccountDetail.module.css';

type TabType = 'overview' | 'tokens' | 'nfts' | 'staking' | 'transactions';

function shortAddr(addr: string): string {
  if (!addr || addr.length < 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Real-time data from blockchain RPC
  const { data: chainAccount, loading: chainLoading, error: chainError } = useAccountInfo(id || null);
  const { data: stakingData, loading: stakingLoading } = useAccountStaking(
    activeTab === 'staking' || activeTab === 'overview' ? (id || null) : null
  );
  const { data: rpcTransfers, loading: transfersLoading } = useAccountTransfers(id || null);
  const { price } = useLunesPrice();

  // SubQuery data for tokens/nfts
  const { data: tokensData, loading: tokensLoading } = 
    useQuery<GetAccountTokensResponse>(GET_ACCOUNT_TOKENS, {
      variables: { accountId: id },
      skip: !id || activeTab !== 'tokens'
    });

  const { data: nftsData, loading: nftsLoading } = 
    useQuery<GetAccountNftsResponse>(GET_ACCOUNT_NFTS, {
      variables: { accountId: id },
      skip: !id || activeTab !== 'nfts'
    });

  const loading = chainLoading;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton height={24} width="200px" />
        </div>
        <Card title="Overview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={20} width="80%" />
            <Skeleton height={20} width="50%" />
            <Skeleton height={20} width="70%" />
          </div>
        </Card>
      </div>
    );
  }

  if (chainError && !chainAccount) {
    return (
      <div className={styles.container}>
        <EmptyState
          type="error"
          message={chainError}
          action={{
            label: 'Try Again',
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  // Use RPC data for balances
  const freeBalance = chainAccount?.freeFormatted || 0;
  const reservedBalance = chainAccount?.reservedFormatted || 0;
  const totalBalance = chainAccount?.totalFormatted || 0;
  const nonce = chainAccount?.nonce || 0;

  const transfers = rpcTransfers || [];
  const tokenAccounts = tokensData?.psp22Accounts?.nodes || [];
  const nftAccounts = nftsData?.nftAccounts?.nodes || [];

  // Transfer row component for reuse in overview and transactions tab
  const TransferRow = ({ tx, compact = false }: { tx: typeof transfers[0]; compact?: boolean }) => {
    const isSent = tx.from === id;
    return (
      <div className={styles.transferItem} style={{ padding: compact ? '10px 0' : '12px 0' }}>
        <div className={styles.transferMain} style={{ flex: 1 }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isSent ? 'rgba(255, 100, 100, 0.12)' : 'rgba(38, 208, 124, 0.12)',
            flexShrink: 0
          }}>
            {isSent ? <ArrowUpRight size={16} color="#ff6464" /> : <ArrowDownLeft size={16} color="#26d07c" />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <StatusBadge status={isSent ? 'warning' : 'success'} size="sm">
                {isSent ? 'SENT' : 'RECEIVED'}
              </StatusBadge>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Block #{tx.blockNumber.toLocaleString()}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {timeAgo(tx.timestamp)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>From:</span>
              <Link to={`/account/${tx.from}`} style={{ 
                color: tx.from === id ? 'var(--text-secondary)' : 'var(--color-brand-400)',
                textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px'
              }}>
                {tx.from === id ? 'This Account' : shortAddr(tx.from)}
              </Link>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ color: 'var(--text-muted)' }}>To:</span>
              <Link to={`/account/${tx.to}`} style={{ 
                color: tx.to === id ? 'var(--text-secondary)' : 'var(--color-brand-400)',
                textDecoration: 'none', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px'
              }}>
                {tx.to === id ? 'This Account' : shortAddr(tx.to)}
              </Link>
            </div>
            {!compact && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <Hash size={10} color="var(--text-muted)" />
                <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-muted)' }}>
                  {shortAddr(tx.hash)}
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(tx.hash)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                  title="Copy block hash"
                >
                  <Copy size={10} color="var(--text-muted)" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ 
            fontWeight: 600, fontSize: '14px',
            color: isSent ? '#ff6464' : '#26d07c'
          }}>
            {isSent ? '-' : '+'}{tx.amountFormatted.toFixed(4)} LUNES
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ≈ ${(tx.amountFormatted * price).toFixed(2)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={18} />
          Back
        </Link>
        <h1 className={styles.title}>
          <Wallet size={24} />
          Account Details
        </h1>
      </div>

      {/* Address Card */}
      <Card title="Address" icon={<Wallet size={18} />}>
        <div className={styles.addressSection}>
          <CopyToClipboard
            text={id || ''}
            truncate
            truncateLength={20}
            className={styles.addressCopy}
          />
          <div className={styles.addressMeta}>
            <span className={styles.metaItem}>
              <StatusBadge status="success" size="sm">Active</StatusBadge>
            </span>
            <span className={styles.metaItem} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Nonce: {nonce}
            </span>
            {transfers.length > 0 && (
              <span className={styles.metaItem} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {transfers.length} recent transfers
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'transactions' ? styles.active : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <ArrowRightLeft size={16} />
          Transfers {transfers.length > 0 ? `(${transfers.length})` : ''}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tokens' ? styles.active : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          <Hexagon size={16} />
          Tokens
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'nfts' ? styles.active : ''}`}
          onClick={() => setActiveTab('nfts')}
        >
          <Image size={16} />
          NFTs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'staking' ? styles.active : ''}`}
          onClick={() => setActiveTab('staking')}
        >
          <Shield size={16} />
          Staking
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <>
            {/* Balance Cards */}
            <div className={styles.statsGrid}>
              <Card title="Free Balance" icon={<Coins size={18} />} className={styles.statCard}>
                <div className={styles.balanceValue}>
                  {freeBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className={styles.balanceUnit}>LUNES</span>
                </div>
                <div className={styles.balanceUsd}>
                  ≈ ${(freeBalance * price).toFixed(2)} USD
                </div>
              </Card>

              <Card title="Reserved Balance" icon={<Shield size={18} />} className={styles.statCard}>
                <div className={styles.balanceValue}>
                  {reservedBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className={styles.balanceUnit}>LUNES</span>
                </div>
                <div className={styles.balanceUsd}>
                  ≈ ${(reservedBalance * price).toFixed(2)} USD
                </div>
              </Card>

              <Card title="Total Balance" icon={<Wallet size={18} />} className={styles.statCard}>
                <div className={styles.balanceValue}>
                  {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className={styles.balanceUnit}>LUNES</span>
                </div>
                <div className={styles.balanceUsd}>
                  ≈ ${(totalBalance * price).toFixed(2)} USD
                </div>
              </Card>

              <Card title="Staking" icon={<Shield size={18} />} className={styles.statCard}>
                {stakingLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
                  </div>
                ) : stakingData ? (
                  <div className={styles.txStats}>
                    <div className={styles.txStat}>
                      <span className={styles.txLabel}>Bonded</span>
                      <span className={styles.txValue}>{stakingData.bondedFormatted.toFixed(4)}</span>
                    </div>
                    <div className={styles.txDivider} />
                    <div className={styles.txStat}>
                      <span className={styles.txLabel}>Status</span>
                      <span className={styles.txValue}>
                        {stakingData.isValidator ? 'Validator' : stakingData.isNominator ? 'Nominator' : 'Not staking'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.balanceUsd}>Not staking</div>
                )}
              </Card>
            </div>

            {/* Recent Transfers via RPC */}
            <Card title="Recent Transfers" icon={<ArrowRightLeft size={18} />}>
              {transfersLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Scanning recent blocks for transfers...</span>
                  </div>
                  <Skeleton height={18} width="90%" />
                  <Skeleton height={18} width="70%" />
                  <Skeleton height={18} width="80%" />
                </div>
              ) : transfers.length === 0 ? (
                <EmptyState type="no-data" message="No transfers found in recent blocks for this account." />
              ) : (
                <div className={styles.transfersList}>
                  {transfers.slice(0, 5).map((tx, idx) => (
                    <TransferRow key={`${tx.blockNumber}-${tx.extrinsicIndex}-${idx}`} tx={tx} compact />
                  ))}
                  {transfers.length > 5 && (
                    <button 
                      onClick={() => setActiveTab('transactions')}
                      style={{
                        width: '100%', padding: '10px', marginTop: '8px',
                        background: 'rgba(108, 56, 255, 0.1)', border: '1px solid rgba(108, 56, 255, 0.2)',
                        borderRadius: '8px', color: 'var(--color-brand-400)', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 500
                      }}
                    >
                      View all {transfers.length} transfers →
                    </button>
                  )}
                </div>
              )}
            </Card>
          </>
        )}

        {activeTab === 'tokens' && (
          <Card title="Token Holdings" icon={<Hexagon size={18} />}>
            {tokensLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Skeleton height={18} width="80%" />
                <Skeleton height={18} width="60%" />
                <Skeleton height={18} width="70%" />
                <Skeleton height={18} width="50%" />
                <Skeleton height={18} width="65%" />
              </div>
            ) : tokenAccounts.length === 0 ? (
              <EmptyState 
                type="no-data" 
                message="No PSP22 tokens found for this account"
                action={{ label: 'View All Tokens', onClick: () => window.location.href = '/tokens' }}
              />
            ) : (
              <div className={styles.tokensList}>
                {tokenAccounts.map((tokenAccount: PSP22Account) => (
                  <div key={tokenAccount.id} className={styles.tokenItem}>
                    <div className={styles.tokenIcon}>
                      {tokenAccount.token.symbol?.slice(0, 1) || '?'}
                    </div>
                    <div className={styles.tokenInfo}>
                      <span className={styles.tokenName}>{tokenAccount.token.name || 'Unknown Token'}</span>
                      <span className={styles.tokenSymbol}>{tokenAccount.token.symbol || '???'}</span>
                    </div>
                    <div className={styles.tokenBalance}>
                      <span className={styles.tokenBalanceValue}>
                        {(parseInt(tokenAccount.balance) / Math.pow(10, tokenAccount.token.decimals)).toLocaleString()}
                      </span>
                      <span className={styles.tokenBalanceSymbol}>{tokenAccount.token.symbol}</span>
                    </div>
                    <CopyToClipboard 
                      text={tokenAccount.token.contractAddress} 
                      truncate 
                      truncateLength={6}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'nfts' && (
          <Card title="NFT Collections" icon={<Image size={18} />}>
            {nftsLoading ? (
              <CardSkeleton count={6} />
            ) : nftAccounts.length === 0 ? (
              <EmptyState 
                type="no-data" 
                message="No NFTs found for this account"
                action={{ label: 'View All NFTs', onClick: () => window.location.href = '/nfts' }}
              />
            ) : (
              <div className={styles.nftsGrid}>
                {nftAccounts.map((nftAccount: NftAccount) => (
                  <div key={nftAccount.id} className={styles.nftCollection}>
                    <div className={styles.nftCollectionHeader}>
                      <div className={styles.nftCollectionIcon}>
                        {nftAccount.collection.symbol?.slice(0, 1) || <Sparkles size={20} />}
                      </div>
                      <div className={styles.nftCollectionInfo}>
                        <span className={styles.nftCollectionName}>{nftAccount.collection.name || 'Unknown Collection'}</span>
                        <span className={styles.nftCollectionSymbol}>{nftAccount.collection.symbol}</span>
                      </div>
                      <span className={styles.nftCount}>{nftAccount.tokenCount} items</span>
                    </div>
                    <div className={styles.nftTokens}>
                      {nftAccount.tokens?.nodes?.slice(0, 4).map((token) => (
                        <div key={token.id} className={styles.nftToken}>
                          <span className={styles.nftTokenId}>#{token.tokenId}</span>
                        </div>
                      ))}
                      {nftAccount.tokenCount > 4 && (
                        <div className={styles.nftTokenMore}>+{nftAccount.tokenCount - 4} more</div>
                      )}
                    </div>
                    <CopyToClipboard 
                      text={nftAccount.collection.contractAddress} 
                      label="Contract"
                      truncate 
                      truncateLength={6}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'staking' && (
          <Card title="Staking Details" icon={<Shield size={18} />}>
            {stakingLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Skeleton height={18} width="60%" />
                <Skeleton height={18} width="80%" />
                <Skeleton height={18} width="50%" />
                <Skeleton height={18} width="70%" />
              </div>
            ) : stakingData ? (
              <div className={styles.transfersList}>
                <div className={styles.transferItem}>
                  <span className={styles.txLabel}>Bonded Amount</span>
                  <span className={styles.txValue}>{stakingData.bondedFormatted.toFixed(4)} LUNES</span>
                </div>
                <div className={styles.transferItem}>
                  <span className={styles.txLabel}>Status</span>
                  <span className={styles.txValue}>
                    {stakingData.isValidator ? 'Validator' : stakingData.isNominator ? 'Nominator' : 'Not staking'}
                  </span>
                </div>
                {stakingData.nominations.length > 0 && (
                  <div className={styles.transferItem} style={{ flexDirection: 'column', gap: '8px' }}>
                    <span className={styles.txLabel}>Nominations ({stakingData.nominations.length})</span>
                    {stakingData.nominations.map((nom) => (
                      <Link key={nom} to={`/account/${nom}`} className={styles.transferLink} style={{ fontSize: '12px' }}>
                        {nom.slice(0, 12)}...{nom.slice(-6)}
                      </Link>
                    ))}
                  </div>
                )}
                {stakingData.unbonding.length > 0 && (
                  <div className={styles.transferItem} style={{ flexDirection: 'column', gap: '8px' }}>
                    <span className={styles.txLabel}>Unbonding</span>
                    {stakingData.unbonding.map((u, i) => (
                      <span key={i} className={styles.txValue}>
                        {(Number(BigInt(u.amount)) / 1e12).toFixed(4)} LUNES (era {u.era})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState type="no-data" message="This account is not staking" />
            )}
          </Card>
        )}

        {activeTab === 'transactions' && (
          <Card title={`Transfer History (${transfers.length})`} icon={<ArrowRightLeft size={18} />}>
            {transfersLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Scanning last 200 blocks for transfers...</span>
                </div>
                <Skeleton height={48} width="100%" />
                <Skeleton height={48} width="100%" />
                <Skeleton height={48} width="100%" />
              </div>
            ) : transfers.length === 0 ? (
              <EmptyState type="no-data" message="No transfers found in the last 200 blocks for this account." />
            ) : (
              <div className={styles.transfersList}>
                {/* Summary stats */}
                <div style={{ 
                  display: 'flex', gap: '24px', padding: '12px 16px', marginBottom: '8px',
                  background: 'rgba(108, 56, 255, 0.06)', borderRadius: '8px', fontSize: '13px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Total: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{transfers.length}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Sent: </span>
                    <strong style={{ color: '#ff6464' }}>{transfers.filter(t => t.from === id).length}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Received: </span>
                    <strong style={{ color: '#26d07c' }}>{transfers.filter(t => t.to === id).length}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Volume: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {transfers.reduce((s, t) => s + t.amountFormatted, 0).toFixed(2)} LUNES
                    </strong>
                  </div>
                </div>

                {/* Transfer rows */}
                {transfers.map((tx, idx) => (
                  <TransferRow key={`${tx.blockNumber}-${tx.extrinsicIndex}-${idx}`} tx={tx} />
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default AccountDetail;
