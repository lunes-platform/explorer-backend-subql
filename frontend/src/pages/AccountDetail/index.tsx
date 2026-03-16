import React, { useEffect, useState } from 'react';
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
import DataSourceBadge from '../../components/common/DataSourceBadge';
import DegradedBanner from '../../components/common/DegradedBanner';
import { ExportButton } from '../../components/common/ExportButton';
import { WatchlistButton } from '../../components/common/WatchlistButton';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useWatchlist } from '../../hooks/useWatchlist';
import { getIndexerDegradedLevel } from '../../utils/indexerHealth';
import { useAccountInfo, useAccountStaking, useAccountTransfers, useAccountAssetBalances } from '../../hooks/useChainData';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { 
  GET_ACCOUNT_TOKENS, 
  GET_ACCOUNT_NFTS,
  GET_ACCOUNT_ASSETS
} from '../../services/graphql/queries';
import type { 
  GetAccountTokensResponse,
  GetAccountNftsResponse,
  GetAccountAssetsResponse,
  PSP22Account,
  AssetAccountWithAsset,
  NftAccount
} from '../../types';
import { useAIExplanation } from '../../hooks/useAIExplanation';
import AIExplanation from '../../components/common/AIExplanation';
import styles from './AccountDetail.module.css';

type TabType = 'overview' | 'tokens' | 'nfts' | 'staking' | 'transactions';

function shortAddr(addr: string): string {
  if (!addr || addr.length < 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function timeAgo(ts: number): string {
  if (!ts || ts <= 0) return '';
  // Auto-detect: if timestamp is in seconds (< year 2001 in ms), convert to ms
  const msTs = ts < 1e12 ? ts * 1000 : ts;
  const diff = Math.floor((Date.now() - msTs) / 1000);
  if (diff < 0) return new Date(msTs).toLocaleString('pt-BR');
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(msTs).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const health = useHealthStatus();
  const { isWatched, toggleItem } = useWatchlist();
  usePageTitle(id ? `Account ${id.slice(0, 8)}...` : 'Account');

  // Real-time data from blockchain RPC
  const { data: chainAccount, loading: chainLoading, error: chainError } = useAccountInfo(id || null);
  const { data: stakingData, loading: stakingLoading } = useAccountStaking(
    activeTab === 'staking' || activeTab === 'overview' ? (id || null) : null
  );
  const { data: rpcTransfers, loading: transfersLoading } = useAccountTransfers(id || null);
  const { price } = useLunesPrice();
  const { explanation, loading: aiLoading, explain, clear } = useAIExplanation();
  useEffect(() => {
    console.log('rpcAssetBalances', rpcAssetBalances);
  }, [activeTab]);
  // SubQuery data for tokens/nfts
  const { data: tokensData, loading: tokensLoading } = 
    useQuery<GetAccountTokensResponse>(GET_ACCOUNT_TOKENS, {
      variables: { accountId: id },
      skip: !id || activeTab !== 'tokens'
    });

  const { data: assetsData, loading: assetsLoading } =
    useQuery<GetAccountAssetsResponse>(GET_ACCOUNT_ASSETS, {
      variables: { accountId: id },
      skip: !id || activeTab !== 'tokens'
    });

  // RPC fallback for pallet-assets balances (works even when indexer is behind)
  const { data: rpcAssetBalances, loading: rpcAssetsLoading } = useAccountAssetBalances(
    activeTab === 'tokens' ? (id || null) : null
  );

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
  const indexerAssetAccounts = assetsData?.assetAccounts?.nodes || [];
  // Merge: use indexer data if available, otherwise build from RPC
  const nativeAssetAccounts: AssetAccountWithAsset[] =  (rpcAssetBalances || []).map(a => ({
        id: `${id}-${a.assetId}`,
        balance: a.balance,
        asset: {
          id: a.assetId,
          name: a.name,
          symbol: a.symbol,
          decimals: a.decimals,
          totalSupply: a.totalSupply,
          assetType: 'Native',
          verified: false,
        },
      }));
  const nftAccounts = nftsData?.nftAccounts?.nodes || [];
      
  // Handle AI explain for a transfer
  const handleExplainTransfer = (tx: typeof transfers[0]) => {
    explain('transaction', {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      amountFormatted: tx.amountFormatted,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      success: true,
      sources: [`Block #${tx.blockNumber}`, `${tx.amountFormatted.toFixed(4)} LUNES`],
    });
  };
  const TransferRow = ({ tx, compact = false, showExplain = false }: { tx: typeof transfers[0]; compact?: boolean; showExplain?: boolean }) => {
    const isSent = tx.from === id;
    return (
      <div className={styles.transferItem} style={{ padding: compact ? '12px 16px' : '16px 20px' }}>
        <div className={styles.transferMain} style={{ flex: 1 }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isSent ? 'rgba(255, 100, 100, 0.12)' : 'rgba(38, 208, 124, 0.12)',
            flexShrink: 0
          }}>
            {isSent ? <ArrowUpRight size={14} color="#ff6464" /> : <ArrowDownLeft size={14} color="#26d07c" />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <Hash size={10} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>{tx.extrinsicHash ? 'TxID:' : 'Ext:'}</span>
              <Link to={`/tx/${tx.blockNumber}-${tx.extrinsicIndex}`} style={{
                fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-brand-400)',
                textDecoration: 'none', fontSize: '11px',
              }}>
                {tx.extrinsicHash ? shortAddr(tx.extrinsicHash) : `${tx.blockNumber}-${tx.extrinsicIndex}`}
              </Link>
              <button 
                onClick={() => navigator.clipboard.writeText(tx.extrinsicHash || `${tx.blockNumber}-${tx.extrinsicIndex}`)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                title={tx.extrinsicHash ? 'Copy TxID' : 'Copy Extrinsic ID'}
              >
                <Copy size={10} color="var(--text-muted)" />
              </button>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '16px' }}>
          <div style={{ 
            fontWeight: 600, fontSize: '14px',
            color: isSent ? '#ff6464' : '#26d07c'
          }}>
            {isSent ? '-' : '+'}{tx.amountFormatted.toFixed(8)} LUNES
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ${(tx.amountFormatted * price).toFixed(2)}
          </div>
          {showExplain && (
            <button
              onClick={(e) => { e.stopPropagation(); handleExplainTransfer(tx); }}
              style={{
                marginTop: '6px',
                padding: '4px 10px',
                background: 'rgba(108, 56, 255, 0.1)',
                border: '1px solid rgba(108, 56, 255, 0.2)',
                borderRadius: '6px',
                color: 'var(--color-brand-400)',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={10} />
              Explain
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleExplainAccount = () => {
    if (!id) return;
    explain('account', {
      address: id,
      totalFormatted: totalBalance,
      freeFormatted: freeBalance,
      reservedFormatted: reservedBalance,
      nonce,
      sources: [`Balance: ${totalBalance.toFixed(4)} LUNES`, `Nonce: ${nonce}`, `${transfers.length} recent transfers`],
    });
  };
 
  const degradedLevel = getIndexerDegradedLevel(health.rpc.latestBlock, health.indexer.latestBlock, false);

  return (
    <div className={styles.container}>
      {degradedLevel && (
        <DegradedBanner level={degradedLevel} source="Indexer" message="Token and NFT data from the indexer may be outdated." />
      )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <DataSourceBadge source="RPC + API" updatedAt={`Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`} health={health.rpc.status === 'connected' ? 'healthy' : health.rpc.status === 'connecting' ? 'delayed' : 'disconnected'} />
          {id && (
            <WatchlistButton
              isWatched={isWatched(id, 'account')}
              onToggle={() => toggleItem({ id, type: 'account' })}
            />
          )}
        </div>
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

      {/* AI Explanation */}
      <AIExplanation
        result={explanation}
        loading={aiLoading}
        error={null}
        onExplain={handleExplainAccount}
        onClose={clear}
        showButton={true}
      />

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
                  ${(freeBalance * price).toFixed(2)} USD
                </div>
              </Card>

              <Card title="Reserved Balance" icon={<Shield size={18} />} className={styles.statCard}>
                <div className={styles.balanceValue}>
                  {reservedBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className={styles.balanceUnit}>LUNES</span>
                </div>
                <div className={styles.balanceUsd}>
                  ${(reservedBalance * price).toFixed(2)} USD
                </div>
              </Card>

              <Card title="Total Balance" icon={<Wallet size={18} />} className={styles.statCard}>
                <div className={styles.balanceValue}>
                  {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className={styles.balanceUnit}>LUNES</span>
                </div>
                <div className={styles.balanceUsd}>
                  ${(totalBalance * price).toFixed(2)} USD
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
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading transfers...</span>
                  </div>
                  <Skeleton height={18} width="90%" />
                  <Skeleton height={18} width="70%" />
                  <Skeleton height={18} width="80%" />
                </div>
              ) : !rpcTransfers ? (
                <EmptyState type="error" message="Unable to load transfers. The RPC connection may be unavailable." />
              ) : transfers.length === 0 ? (
                <EmptyState type="no-data" message="No transfers found for this account." />
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
            {(tokensLoading || assetsLoading || rpcAssetsLoading) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Skeleton height={18} width="80%" />
                <Skeleton height={18} width="60%" />
                <Skeleton height={18} width="70%" />
                <Skeleton height={18} width="50%" />
                <Skeleton height={18} width="65%" />
              </div>
            ) : tokenAccounts.length === 0 && nativeAssetAccounts.length === 0 ? (
              <EmptyState 
                type="no-data" 
                message="No tokens found for this account"
                action={{ label: 'View All Tokens', onClick: () => window.location.href = '/tokens' }}
              />
            ) : (
              <div className={styles.tokensList}>
                {/* pallet-assets (LUSDT, etc.) */}
                {nativeAssetAccounts.map((aa: AssetAccountWithAsset) => (
                  <div key={aa.id} className={styles.tokenItem}>
                    <div className={styles.tokenIcon} style={{ background: 'rgba(38,208,124,0.15)', color: '#26d07c' }}>
                      {aa.asset.symbol?.slice(0, 1) || '#'}
                    </div>
                    <div className={styles.tokenInfo}>
                      <span className={styles.tokenName}>{aa.asset.name || `Asset #${aa.asset.id}`}</span>
                      <span className={styles.tokenSymbol} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {aa.asset.symbol || '???'}
                        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)' }}>pallet-assets</span>
                      </span>
                    </div>
                    <div className={styles.tokenBalance}>
                      <span className={styles.tokenBalanceValue}>
                        {(parseInt(aa.balance) / Math.pow(10, aa.asset.decimals ?? 0)).toLocaleString()}
                      </span>
                      <span className={styles.tokenBalanceSymbol}>{aa.asset.symbol}</span>
                    </div>
                  </div>
                ))}
                {/* PSP22 ink! contracts */}
                {tokenAccounts.map((tokenAccount: PSP22Account) => (
                  <div key={tokenAccount.id} className={styles.tokenItem}>
                    <div className={styles.tokenIcon}>
                      {tokenAccount.token.symbol?.slice(0, 1) || '?'}
                    </div>
                    <div className={styles.tokenInfo}>
                      <span className={styles.tokenName}>{tokenAccount.token.name || 'Unknown Token'}</span>
                      <span className={styles.tokenSymbol} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {tokenAccount.token.symbol || '???'}
                        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)' }}>PSP22</span>
                      </span>
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
                        {(Number(BigInt(u.amount)) / 1e8).toFixed(4)} LUNES (era {u.era})
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
          <Card 
            title={`Transfer History (${transfers.length})`} 
            icon={<ArrowRightLeft size={18} />}
            action={transfers.length > 0 ? (
              <ExportButton
                data={transfers}
                filename={`transfers-${id?.slice(0, 8)}-${new Date().toISOString().split('T')[0]}`}
                columns={[
                  { key: 'blockNumber', label: 'Block' },
                  { key: 'extrinsicHash', label: 'TxID' },
                  { key: 'from', label: 'From' },
                  { key: 'to', label: 'To' },
                  { key: 'amountFormatted', label: 'Amount', formatter: (v) => v.toFixed(8) },
                  { key: 'timestamp', label: 'Timestamp', formatter: (v) => new Date(v).toISOString() },
                ]}
                label="Export"
              />
            ) : undefined}
          >
            {transfersLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading transfer history...</span>
                </div>
                <Skeleton height={48} width="100%" />
                <Skeleton height={48} width="100%" />
                <Skeleton height={48} width="100%" />
              </div>
            ) : transfers.length === 0 ? (
              <EmptyState type="no-data" message="No transfers found for this account across all blocks." />
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
                  <TransferRow key={`${tx.blockNumber}-${tx.extrinsicIndex}-${idx}`} tx={tx} showExplain />
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
