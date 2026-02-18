import React from 'react';
import { Link } from 'react-router-dom';
import { Image, Loader2, FileCode } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useNftCollections } from '../../hooks/useChainData';
import { GET_NFT_COLLECTIONS } from '../../services/graphql/queries';
import EmptyState from '../../components/common/EmptyState';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import classes from './NFTs.module.css';

interface Psp34CollectionNode {
  id: string;
  contractAddress: string;
  name: string;
  symbol: string;
  creator: string;
  totalSupply: string;
  verified: boolean;
}
interface NftCollectionsResponse {
  psp34Collections: { nodes: Psp34CollectionNode[] };
}

const NFTs: React.FC = () => {
    const { data: collections, loading, error, refetch } = useNftCollections();
    const { data: indexerData, loading: indexerLoading } = useQuery<NftCollectionsResponse>(GET_NFT_COLLECTIONS);
    const health = useHealthStatus();
    const rpcHealth = health.rpc.status === 'connected' ? 'healthy' as const : health.rpc.status === 'connecting' ? 'delayed' as const : 'disconnected' as const;

    const psp34Collections = indexerData?.psp34Collections?.nodes || [];

    return (
        <div className={classes.pageContainer}>
            <h1 className={classes.title}>NFT Collections</h1>
            <p className={classes.subtitle}>
                Non-fungible token collections on Lunes — real-time data from pallet-nfts via RPC
            </p>
            <DataSourceBadge source="RPC + INDEXER" updatedAt={!loading && collections ? `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined} loading={loading || indexerLoading} health={rpcHealth} />

            {/* PSP34 ink! collections from SubQuery */}
            {!indexerLoading && psp34Collections.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileCode size={14} /> PSP34 ink! Contracts
                    </h2>
                    <div className={classes.grid}>
                        {psp34Collections.map((col: Psp34CollectionNode) => (
                            <Link to={`/nft/${col.id}`} key={col.id} className={classes.collectionCard}>
                                <div className={classes.banner}>
                                    <div className={classes.avatar}>
                                        <FileCode size={24} />
                                    </div>
                                </div>
                                <div className={classes.content}>
                                    <div className={classes.collectionName}>{col.name || `Collection ${col.id.slice(-6)}`}</div>
                                    <div className={classes.stats}>
                                        <div className={classes.statItem}>
                                            <span className={classes.statLabel}>Symbol</span>
                                            <span className={classes.statValue}>{col.symbol}</span>
                                        </div>
                                        <div className={classes.statItem}>
                                            <span className={classes.statLabel}>Items</span>
                                            <span className={classes.statValue}>{col.totalSupply || '0'}</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(99,102,241,0.15)', borderRadius: 4, color: '#818cf8', marginTop: 4, display: 'inline-block' }}>PSP34</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* pallet-nfts collections from RPC */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                    <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading NFT collections from blockchain...</p>
                </div>
            ) : error ? (
                <EmptyState
                    type="error"
                    message={error}
                    action={{ label: 'Try Again', onClick: refetch }}
                />
            ) : !collections || collections.length === 0 ? (
                <EmptyState type="no-data" message="No NFT collections found on the blockchain yet." />
            ) : (
                <div className={classes.grid}>
                    {collections.map((col) => (
                        <Link to={`/nft/${col.id}`} key={col.id} className={classes.collectionCard}>
                            <div className={classes.banner}>
                                <div className={classes.avatar}>
                                    <Image size={24} />
                                </div>
                            </div>
                            <div className={classes.content}>
                                <div className={classes.collectionName}>
                                    Collection #{col.id}
                                </div>

                                <div className={classes.stats}>
                                    <div className={classes.statItem}>
                                        <span className={classes.statLabel}>Items</span>
                                        <span className={classes.statValue}>{col.items}</span>
                                    </div>
                                    <div className={classes.statItem}>
                                        <span className={classes.statLabel}>Owner</span>
                                        <span className={classes.statValue}>
                                            {col.owner ? `${col.owner.slice(0, 6)}...${col.owner.slice(-4)}` : 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NFTs;
