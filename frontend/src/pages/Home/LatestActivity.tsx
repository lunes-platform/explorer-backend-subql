import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { Box, Activity, Clock, ArrowUpRight, Loader2 } from 'lucide-react';
import Card from '../../components/common/Card';
import { GET_LATEST_BLOCKS, GET_LATEST_TRANSFERS } from '../../services/graphql/queries';
import { LUNES_DECIMALS } from '../../data/tokenomics';
import classes from './Home.module.css';

type DataMetaProps = {
    loading: boolean;
    updatedAt: string | null;
    source?: string;
};

const DataMeta = ({ loading, updatedAt, source = 'INDEXER' }: DataMetaProps) => {
    if (loading) return null;

    return (
        <div className={classes.statMeta}>
            <span className={classes.sourceBadge}>{source}</span>
            <span className={classes.freshnessText}>{updatedAt ? `Updated ${updatedAt}` : 'Updated now'}</span>
        </div>
    );
};

interface IndexerBlock {
    id: string;
    number: number;
    timestamp: number;
    parentHash: string;
    specVersion: number;
}

interface IndexerTransfer {
    id: string;
    fromId: string;
    toId: string;
    amount: string;
    blockNumber: number;
    timestamp: number;
}

function timeAgo(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function shortAddr(addr: string): string {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const LatestActivity = () => {
    const { data: blocksData, loading: blocksLoading } = useQuery<{ blocks: { nodes: IndexerBlock[] } }>(GET_LATEST_BLOCKS, {
        variables: { first: 8 },
        pollInterval: 6000,
    });
    const { data: transfersData, loading: transfersLoading } = useQuery<{ transfers: { nodes: IndexerTransfer[] } }>(GET_LATEST_TRANSFERS, {
        variables: { first: 8 },
        pollInterval: 6000,
    });

    const blocks = blocksData?.blocks?.nodes || [];
    const transfers = transfersData?.transfers?.nodes || [];
    const blocksUpdatedAt = !blocksLoading && blocks.length > 0 ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
    const transfersUpdatedAt = !transfersLoading && transfers.length > 0 ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;

    return (
        <div className={classes.latestGrid}>
            <Card title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={20} /> Latest Blocks
                </div>
            } action={<DataMeta loading={blocksLoading} updatedAt={blocksUpdatedAt} source="INDEXER" />}>
                <div className={classes.listContainer}>
                    {blocksLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                        </div>
                    )}
                    {blocks.map((block) => (
                        <div key={block.number} className={classes.activityItem}>
                            <div className={classes.activityIcon}>Bk</div>
                            <div className={classes.activityContent}>
                                <div className={classes.activityHeader}>
                                    <Link to={`/block/${block.number}`} className={classes.activityLink}>
                                        #{Number(block.number).toLocaleString()}
                                    </Link>
                                    <span className={classes.activityTime}>
                                        <Clock size={12} style={{ marginRight: 4 }} />
                                        {timeAgo(Number(block.timestamp))}
                                    </span>
                                </div>
                                <div className={classes.activitySub}>
                                    <span>Block #{Number(block.number).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!blocksLoading && blocks.length === 0 && (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Indexer syncing — no blocks indexed yet...
                        </div>
                    )}
                    <Link to="/blocks" className={classes.viewAllButton}>View all blocks</Link>
                </div>
            </Card>

            <Card title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={20} /> Recent Transfers
                </div>
            } action={<DataMeta loading={transfersLoading} updatedAt={transfersUpdatedAt} source="INDEXER" />}>
                <div className={classes.listContainer}>
                    {transfersLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                        </div>
                    )}
                    {transfers.map((tx, idx) => {
                        const amountFormatted = Number(tx.amount) / Math.pow(10, LUNES_DECIMALS);
                        return (
                            <div key={`${tx.id}-${idx}`} className={classes.activityItem}>
                                <div className={classes.activityIcon}>
                                    <ArrowUpRight size={14} />
                                </div>
                                <div className={classes.activityContent}>
                                    <div className={classes.activityHeader}>
                                        <Link to={`/block/${tx.blockNumber}`} className={classes.activityLink}>
                                            Block #{Number(tx.blockNumber).toLocaleString()}
                                        </Link>
                                        <span className={classes.activityTime}>
                                            <Clock size={12} style={{ marginRight: 4 }} />
                                            {timeAgo(Number(tx.timestamp))}
                                        </span>
                                    </div>
                                    <div className={classes.activitySub}>
                                        <span>From: <Link to={`/account/${tx.fromId}`} className={classes.activityLink}>{shortAddr(tx.fromId)}</Link></span>
                                        <span style={{ margin: '0 4px' }}>→</span>
                                        <span>To: <Link to={`/account/${tx.toId}`} className={classes.activityLink}>{shortAddr(tx.toId)}</Link></span>
                                        <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--color-brand-400)' }}>
                                            {amountFormatted.toFixed(4)} LUNES
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {!transfersLoading && transfers.length === 0 && (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No recent transfers indexed yet
                        </div>
                    )}
                    <Link to="/extrinsics" className={classes.viewAllButton}>View all transfers</Link>
                </div>
            </Card>
        </div>
    );
};

export default LatestActivity;
