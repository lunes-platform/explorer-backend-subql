import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { GET_EXTRINSIC_DETAIL } from '../../services/graphql/queries';
import Card from '../../components/common/Card';

const TxDetail = () => {
    const { id } = useParams();
    const { loading, error, data } = useQuery(GET_EXTRINSIC_DETAIL, {
        variables: { id }
    });

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading Transaction...</div>;
    if (error) return <div className="container" style={{ padding: '2rem', color: 'var(--color-critical)' }}>Error: {error.message}</div>;

    const tx = data?.extrinsic;

    if (!tx) return <div className="container" style={{ padding: '2rem' }}>Transaction not found.</div>;

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                Transaction <span style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>Details</span>
            </h2>

            <Card title="Overview">
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>ID / Hash</span>
                        <span style={{ fontFamily: 'monospace' }}>{tx.id}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Status</span>
                        <span style={{
                            width: 'fit-content',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: tx.success ? 'rgba(38, 208, 124, 0.1)' : 'rgba(255, 40, 76, 0.1)',
                            color: tx.success ? 'var(--color-success)' : 'var(--color-critical)',
                            fontWeight: 600
                        }}>
                            {tx.success ? 'Success' : 'Failed'}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Block</span>
                        <span style={{ color: 'var(--color-brand-400)', fontWeight: 600 }}>
                            #{tx.blockNumber}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Timestamp</span>
                        <span>{tx.timestamp ? new Date(Number(tx.timestamp)).toLocaleString() : 'N/A'}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Method</span>
                        <span style={{ fontFamily: 'monospace', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px' }}>
                            {tx.section}.{tx.method}
                        </span>
                    </div>
                </div>
            </Card>

            <div style={{ height: '1.5rem' }}></div>

            <Card title="Signer & Fees">
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Signer</span>
                        <span style={{ fontFamily: 'monospace', color: 'var(--color-brand-400)' }}>{tx.signer || 'None'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Signature</span>
                        <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                            {tx.signature || 'None'}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Fee</span>
                        <span>{tx.fee ? tx.fee.toString() : '0'}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default TxDetail;
