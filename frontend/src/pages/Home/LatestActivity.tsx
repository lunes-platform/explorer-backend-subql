import { Link } from 'react-router-dom';
import { Box, Activity, Clock, ArrowUpRight, Loader2 } from 'lucide-react';
import Card from '../../components/common/Card';
import classes from './Home.module.css';
import { useRecentBlocks, useRecentTransfers } from '../../hooks/useChainData';

type DataMetaProps = {
    loading: boolean;
    updatedAt: string | null;
};

const DataMeta = ({ loading, updatedAt }: DataMetaProps) => {
    if (loading) return null;

    return (
        <div className={classes.statMeta}>
            <span className={classes.sourceBadge}>RPC</span>
            <span className={classes.freshnessText}>{updatedAt ? `Updated ${updatedAt}` : 'Updated now'}</span>
        </div>
    );
};

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
    const { data: blocks, loading: blocksLoading } = useRecentBlocks(8);
    const { data: transfers, loading: transfersLoading } = useRecentTransfers(8);
    const blocksUpdatedAt = !blocksLoading && blocks ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
    const transfersUpdatedAt = !transfersLoading && transfers ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;

    return (
        <div className={classes.latestGrid}>
            <Card title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Box size={20} /> Latest Blocks
                </div>
            } action={<DataMeta loading={blocksLoading} updatedAt={blocksUpdatedAt} />}>
                <div className={classes.listContainer}>
                    {blocksLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                        </div>
                    )}
                    {blocks && blocks.map((block) => (
                        <div key={block.number} className={classes.activityItem}>
                            <div className={classes.activityIcon}>Bk</div>
                            <div className={classes.activityContent}>
                                <div className={classes.activityHeader}>
                                    <Link to={`/block/${block.number}`} className={classes.activityLink}>
                                        #{block.number.toLocaleString()}
                                    </Link>
                                    <span className={classes.activityTime}>
                                        <Clock size={12} style={{ marginRight: 4 }} />
                                        {timeAgo(block.timestamp)}
                                    </span>
                                </div>
                                <div className={classes.activitySub}>
                                    <span>{block.extrinsicCount} extrinsics</span> • <span>{block.eventCount} events</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!blocksLoading && (!blocks || blocks.length === 0) && (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Connecting to blockchain...
                        </div>
                    )}
                    <Link to="/blocks" className={classes.viewAllButton}>View all blocks</Link>
                </div>
            </Card>

            <Card title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={20} /> Recent Transfers
                </div>
            } action={<DataMeta loading={transfersLoading} updatedAt={transfersUpdatedAt} />}>
                <div className={classes.listContainer}>
                    {transfersLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                        </div>
                    )}
                    {transfers && transfers.map((tx, idx) => (
                        <div key={`${tx.blockNumber}-${tx.extrinsicIndex}-${idx}`} className={classes.activityItem}>
                            <div className={classes.activityIcon}>
                                <ArrowUpRight size={14} />
                            </div>
                            <div className={classes.activityContent}>
                                <div className={classes.activityHeader}>
                                    <Link to={`/block/${tx.blockNumber}`} className={classes.activityLink}>
                                        Block #{tx.blockNumber.toLocaleString()}
                                    </Link>
                                    <span className={classes.activityTime}>
                                        <Clock size={12} style={{ marginRight: 4 }} />
                                        {timeAgo(tx.timestamp)}
                                    </span>
                                </div>
                                <div className={classes.activitySub}>
                                    <span>From: <Link to={`/account/${tx.from}`} className={classes.activityLink}>{shortAddr(tx.from)}</Link></span>
                                    <span style={{ margin: '0 4px' }}>→</span>
                                    <span>To: <Link to={`/account/${tx.to}`} className={classes.activityLink}>{shortAddr(tx.to)}</Link></span>
                                    <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--color-brand-400)' }}>
                                        {tx.amountFormatted.toFixed(4)} LUNES
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!transfersLoading && (!transfers || transfers.length === 0) && (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No recent transfers found
                        </div>
                    )}
                    <Link to="/extrinsics" className={classes.viewAllButton}>View all transfers</Link>
                </div>
            </Card>
        </div>
    );
};

export default LatestActivity;
