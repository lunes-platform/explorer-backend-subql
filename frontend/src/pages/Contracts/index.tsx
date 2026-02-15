import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Loader2, Copy, ExternalLink, FolderOpen } from 'lucide-react';
import { useContracts } from '../../hooks/useChainData';
import { getContractInfo } from '../../data/knownContracts';
import { getProjectByContract } from '../../data/knownProjects';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import classes from './Contracts.module.css';

function shortAddr(addr: string): string {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

const Contracts: React.FC = () => {
    const { data: contracts, loading, error } = useContracts();
    const health = useHealthStatus();
    const rpcHealth = health.rpc.status === 'connected' ? 'healthy' as const : health.rpc.status === 'connecting' ? 'delayed' as const : 'disconnected' as const;

    return (
        <div className={classes.pageContainer}>
            <div className={classes.header}>
                <h1 className={classes.title}>Smart Contracts</h1>
                <p className={classes.subtitle}>
                    {loading ? 'Loading contracts from blockchain...' : 
                     contracts ? `${contracts.length} Ink! smart contracts deployed on Lunes Network` :
                     'Ink! smart contracts deployed on Lunes.'}
                </p>
                <DataSourceBadge source="RPC" updatedAt={!loading && contracts ? `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined} loading={loading} health={rpcHealth} />
            </div>

            <div className={classes.tableContainer}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Contract Address</th>
                            <th>Code Hash</th>
                            <th>Storage</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                                    <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                                        Loading contracts from blockchain...
                                    </div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-critical)' }}>
                                    Error: {error}
                                </td>
                            </tr>
                        ) : (!contracts || contracts.length === 0) ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No contracts found
                                </td>
                            </tr>
                        ) : (
                            contracts.map((contract, index) => {
                                const knownInfo = getContractInfo(contract.address);
                                const project = getProjectByContract(contract.address);
                                return (
                                    <tr key={contract.address}>
                                        <td style={{ color: 'var(--text-muted)', width: '40px' }}>{index + 1}</td>
                                        <td>
                                            <div className={classes.contractName}>
                                                <Code2 size={16} color={knownInfo ? 'var(--color-brand-400)' : 'var(--text-muted)'} />
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    {knownInfo && (
                                                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                                                            {knownInfo.name}
                                                        </span>
                                                    )}
                                                    <Link to={`/account/${contract.address}`} className={classes.address}>
                                                        {shortAddr(contract.address)}
                                                    </Link>
                                                    {project && (
                                                        <Link
                                                            to={`/project/${project.slug}`}
                                                            style={{ fontSize: '11px', color: 'var(--color-brand-400)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                                                        >
                                                            <FolderOpen size={10} />
                                                            {project.name}
                                                        </Link>
                                                    )}
                                                </div>
                                                <button 
                                                    className={classes.copyBtn}
                                                    onClick={() => navigator.clipboard.writeText(contract.address)}
                                                    title="Copy address"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={classes.address} style={{ fontSize: '11px' }}>
                                                {contract.codeHash !== 'unknown' ? shortAddr(contract.codeHash) : '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={classes.versionBadge}>
                                                {contract.storageBytes > 0 ? `${contract.storageBytes} bytes` : '—'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Link 
                                                to={`/account/${contract.address}`}
                                                style={{ color: 'var(--color-brand-400)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <ExternalLink size={14} />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Contracts;
