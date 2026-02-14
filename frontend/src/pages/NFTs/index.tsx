import React from 'react';
import { Link } from 'react-router-dom';
import { Image, Loader2 } from 'lucide-react';
import { useNftCollections } from '../../hooks/useChainData';
import EmptyState from '../../components/common/EmptyState';
import classes from './NFTs.module.css';

const NFTs: React.FC = () => {
    const { data: collections, loading, error, refetch } = useNftCollections();

    return (
        <div className={classes.pageContainer}>
            <h1 className={classes.title}>NFT Collections</h1>
            <p className={classes.subtitle}>
                Non-fungible token collections on Lunes — real-time data from pallet-nfts via RPC
            </p>

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
