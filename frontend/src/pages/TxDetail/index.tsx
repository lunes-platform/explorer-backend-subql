import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock, Copy,
    FileText, Send, Loader2, AlertCircle,
} from 'lucide-react';
import Card from '../../components/common/Card';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import { ExportButton } from '../../components/common/ExportButton';
import AIExplanation from '../../components/common/AIExplanation';
import { useAIExplanation } from '../../hooks/useAIExplanation';
import { getExtrinsicByHash, type ExtrinsicDetail } from '../../services/chain';

function shortAddr(addr: string): string {
    if (!addr || addr.length < 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
}

function formatLunes(raw: string): string {
    const n = Number(BigInt(raw)) / 1e8;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return n.toFixed(8);
}

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--color-success)' : 'var(--text-muted)', padding: 2 }}
            title="Copy"
        >
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
        </button>
    );
}

const ROW = { display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as const;
const LABEL = { color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 } as const;
const MONO = { fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' as const };

const TxDetail = () => {
    const { id } = useParams();
    const [tx, setTx] = useState<ExtrinsicDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { explanation, loading: aiLoading, explain, clear } = useAIExplanation();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        getExtrinsicByHash(id)
            .then(result => {                
                setTx(result);
                if (!result) setError('Transaction not found. If this is an extrinsic hash, only the last ~50 blocks are scanned. Try searching by block number (e.g. "9446650-4") or block hash instead.');
            })
            .catch(err => setError(err.message || 'Failed to fetch transaction'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>
                <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>
                    Searching for transaction on-chain...
                </p>
            </div>
        );
    }

    const handleExplain = () => {
        if (!tx) return;
        
        // Prepare data for AI explanation
        const sources: string[] = [`Block #${tx.blockNumber}`, `${tx.section}.${tx.method}`];
        
        const explainData: Record<string, unknown> = {
            hash: tx.hash,
            blockNumber: tx.blockNumber,
            section: tx.section,
            method: tx.method,
            signer: tx.signer,
            success: tx.success,
            timestamp: tx.timestamp,
            fee: tx.fee,
            tip: tx.tip,
            sources,
        };
        
        // Add transfer details if available
        if (tx.transfers.length > 0) {
            const transfer = tx.transfers[0];
            explainData.from = transfer.from;
            explainData.to = transfer.to;
            explainData.amount = transfer.amount;
            explainData.amountFormatted = transfer.amountFormatted;
            sources.push(`Transfer: ${transfer.amountFormatted.toFixed(8)} LUNES`);
        }
        
        explain(tx.transfers.length > 0 ? 'transaction' : 'extrinsic', explainData);
    };

    if (error || !tx) {
        return (
            <div className="container" style={{ padding: '3rem' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, marginBottom: 16 }}>
                    <ArrowLeft size={14} /> Home
                </Link>
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,77,106,0.04)', borderRadius: 14, border: '1px solid rgba(255,77,106,0.12)' }}>
                    <AlertCircle size={36} color="#ff4d6a" />
                    <h3 style={{ margin: '12px 0 6px', fontSize: 18 }}>Transaction Not Found</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 500, margin: '0 auto' }}>
                        {error || `Could not find transaction "${id}".`}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
                        Tip: Try searching by extrinsic ID (e.g. <code>12345-0</code>) or a recent 0x hash.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, marginBottom: 12 }}>
                    <ArrowLeft size={14} /> Home
                </Link>
                <h2 style={{ margin: '8px 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={22} />
                    Transaction <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Details</span>
                </h2>
                <DataSourceBadge source="RPC" updatedAt={`Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`} />
                <ExportButton
                    data={[{
                        hash: tx.hash,
                        blockNumber: tx.blockNumber,
                        index: tx.index,
                        section: tx.section,
                        method: tx.method,
                        signer: tx.signer || '',
                        success: tx.success ? 'Success' : 'Failed',
                        fee: tx.fee,
                        tip: tx.tip,
                        timestamp: tx.timestamp ? new Date(tx.timestamp).toISOString() : '',
                        transfers: tx.transfers.map(t => `${t.from} → ${t.to}: ${t.amountFormatted} LUNES`).join('; '),
                    }]}
                    filename={`tx-${tx.hash.slice(0, 12)}`}
                    columns={[
                        { key: 'hash', label: 'Hash' },
                        { key: 'blockNumber', label: 'Block' },
                        { key: 'section', label: 'Section' },
                        { key: 'method', label: 'Method' },
                        { key: 'signer', label: 'Signer' },
                        { key: 'success', label: 'Status' },
                        { key: 'fee', label: 'Fee' },
                        { key: 'timestamp', label: 'Timestamp' },
                        { key: 'transfers', label: 'Transfers' },
                    ]}
                    label="Export"
                />
            </div>

            {/* AI Explanation */}
            <AIExplanation
                result={explanation}
                loading={aiLoading}
                error={null}
                onExplain={handleExplain}
                onClose={clear}
                showButton={true}
            />

            {/* Transfer Summary — the main from/to/amount card */}
            {tx.transfers.length > 0 && (
                <Card title="Transfer Details" icon={<Send size={18} />}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {tx.transfers.map((tr, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                                borderRadius: 12, background: 'rgba(38, 208, 124, 0.04)',
                                border: '1px solid rgba(38, 208, 124, 0.12)', flexWrap: 'wrap',
                            }}>
                                {/* From */}
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>From</div>
                                    <Link to={`/account/${tr.from}`} style={{ ...MONO, color: 'var(--color-brand-400)', textDecoration: 'none' }}>
                                        {shortAddr(tr.from)}
                                    </Link>
                                    <CopyBtn text={tr.from} />
                                </div>

                                {/* Arrow */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(38, 208, 124, 0.12)', flexShrink: 0,
                                }}>
                                    <ArrowRight size={18} color="#26d07c" />
                                </div>

                                {/* To */}
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>To</div>
                                    <Link to={`/account/${tr.to}`} style={{ ...MONO, color: 'var(--color-brand-400)', textDecoration: 'none' }}>
                                        {shortAddr(tr.to)}
                                    </Link>
                                    <CopyBtn text={tr.to} />
                                </div>

                                {/* Amount */}
                                <div style={{
                                    padding: '10px 18px', borderRadius: 10,
                                    background: 'rgba(38, 208, 124, 0.08)', textAlign: 'center', flexShrink: 0,
                                }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Amount</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#26d07c' }}>
                                        {formatLunes(tr.amount)} <span style={{ fontSize: 12, fontWeight: 400 }}>LUNES</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {tx.transfers.length > 0 && <div style={{ height: '1rem' }} />}

            {/* Overview */}
            <Card title="Overview">
                <div>
                    <div style={ROW}>
                        <span style={LABEL}>Extrinsic Hash</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={MONO}>{tx.hash}</span>
                            <CopyBtn text={tx.hash} />
                        </div>
                    </div>
                    <div style={ROW}>
                        <span style={LABEL}>Extrinsic ID</span>
                        <span style={MONO}>{tx.blockNumber}-{tx.index}</span>
                    </div>
                    <div style={ROW}>
                        <span style={LABEL}>Status</span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content',
                            padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                            background: tx.success ? 'rgba(38, 208, 124, 0.1)' : 'rgba(255, 40, 76, 0.1)',
                            color: tx.success ? 'var(--color-success)' : 'var(--color-critical)',
                        }}>
                            {tx.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {tx.success ? 'Success' : 'Failed'}
                        </span>
                    </div>
                    <div style={ROW}>
                        <span style={LABEL}>Block</span>
                        <Link to={`/block/${tx.blockNumber}`} style={{ color: 'var(--color-brand-400)', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                            #{tx.blockNumber}
                        </Link>
                    </div>
                    <div style={ROW}>
                        <span style={LABEL}>Timestamp</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <Clock size={13} color="var(--text-muted)" />
                            {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                        </span>
                    </div>
                    <div style={ROW}>
                        <span style={LABEL}>Method</span>
                        <span style={{
                            ...MONO, display: 'inline-block', padding: '3px 8px', borderRadius: 6,
                            background: 'rgba(108,56,255,0.08)', color: 'var(--color-brand-400)',
                        }}>
                            {tx.section}.{tx.method}
                        </span>
                    </div>
                    {tx.args.length > 0 && tx.section !== 'timestamp' && (
                        <div style={ROW}>
                            <span style={LABEL}>Arguments</span>
                            <div style={{ ...MONO, color: 'var(--text-secondary)', maxHeight: 120, overflow: 'auto', fontSize: 12 }}>
                                {tx.args.map((arg, i) => (
                                    <div key={i} style={{ marginBottom: 2 }}>[{i}] {arg.length > 80 ? `${arg.slice(0, 80)}...` : arg}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div style={{ height: '1rem' }} />

            {/* Signer & Fees */}
            <Card title="Signer & Fees">
                <div>
                    <div style={ROW}>
                        <span style={LABEL}>Signer</span>
                        {tx.signer ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Link to={`/account/${tx.signer}`} style={{ ...MONO, color: 'var(--color-brand-400)', textDecoration: 'none' }}>
                                    {shortAddr(tx.signer)}
                                </Link>
                                <CopyBtn text={tx.signer} />
                            </div>
                        ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Unsigned</span>
                        )}
                    </div>
                    <div style={ROW}>
                        <span style={LABEL}>Signature</span>
                        <div style={{ ...MONO, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                            {tx.signature ? `${tx.signature.slice(0, 40)}...` : 'None'}
                        </div>
                    </div>
                    <div style={ROW}>
                        <span style={LABEL}>Fee</span>
                        <span style={{ fontSize: 13 }}>{tx.fee !== '0' ? `${formatLunes(tx.fee)} LUNES` : '0'}</span>
                    </div>
                    {tx.tip !== '0' && (
                        <div style={ROW}>
                            <span style={LABEL}>Tip</span>
                            <span style={{ fontSize: 13 }}>{formatLunes(tx.tip)} LUNES</span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Events */}
            {tx.events.length > 0 && (
                <>
                    <div style={{ height: '1rem' }} />
                    <Card title={`Events (${tx.events.length})`}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {tx.events.map((evt, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px', borderRadius: 8,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    fontSize: 12,
                                }}>
                                    <span style={{
                                        ...MONO, padding: '2px 8px', borderRadius: 4,
                                        background: evt.section === 'balances' ? 'rgba(38,208,124,0.08)' :
                                            evt.section === 'system' ? 'rgba(108,56,255,0.08)' : 'rgba(255,255,255,0.04)',
                                        color: evt.section === 'balances' ? '#26d07c' :
                                            evt.section === 'system' ? 'var(--color-brand-400)' : 'var(--text-muted)',
                                    }}>
                                        {evt.section}.{evt.method}
                                    </span>
                                    <span style={{ ...MONO, color: 'var(--text-muted)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                        {evt.data.map(d => d.length > 20 ? `${d.slice(0, 12)}...${d.slice(-6)}` : d).join(', ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

export default TxDetail;
