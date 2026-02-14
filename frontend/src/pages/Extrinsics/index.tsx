import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { GET_EXTRINSICS } from '../../services/graphql/queries';
import { SkeletonRows } from '../../components/common/Skeleton';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import type { Extrinsic, GetExtrinsicsResponse } from '../../types';
import classes from '../Blocks/Blocks.module.css';

const PAGE_SIZE = 25;

const Extrinsics: React.FC = () => {
    const [page, setPage] = useState(0);
    const { data, loading, error } = useQuery<GetExtrinsicsResponse>(GET_EXTRINSICS, {
        variables: { first: PAGE_SIZE, offset: page * PAGE_SIZE },
        pollInterval: 6000,
    });

    const extrinsics = data?.extrinsics?.nodes || [];
    const totalCount = data?.extrinsics?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className={classes.container}>
            <h1 className={classes.title}>Extrinsics (Transações)</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                {totalCount > 0 ? `${totalCount.toLocaleString()} extrinsics indexed` : 'Loading indexed data...'}
                {' · '}Persistent data from SubQuery indexer
            </p>

            <div className={classes.card}>
                <div className={classes.tableContainer}>
                    <table className={classes.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Block</th>
                                <th>Method</th>
                                <th>Signer</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonRows columns={5} rows={10} />
                            ) : error ? (
                                <tr>
                                    <td colSpan={5}>
                                        <EmptyState
                                            type="error"
                                            message={error.message}
                                            action={{ label: 'Try Again', onClick: () => window.location.reload() }}
                                        />
                                    </td>
                                </tr>
                            ) : extrinsics.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <EmptyState type="no-data" message="No extrinsics indexed yet. The indexer is syncing..." />
                                    </td>
                                </tr>
                            ) : (
                                extrinsics.map((ext: Extrinsic) => (
                                    <tr key={ext.id}>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-brand-400)' }}>
                                                {ext.id}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/block/${ext.blockNumber}`} className={classes.link}>
                                                #{Number(ext.blockNumber).toLocaleString()}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className={classes.method}>
                                                {ext.section}.{ext.method}
                                            </span>
                                        </td>
                                        <td className={classes.hash}>
                                            {ext.signer ? (
                                                <Link to={`/account/${ext.signer}`} className={classes.link} style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                                    {ext.signer.substring(0, 8)}...{ext.signer.slice(-4)}
                                                </Link>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Unsigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <StatusBadge status={ext.success ? 'success' : 'error'} size="sm">
                                                {ext.success ? 'Success' : 'Failed'}
                                            </StatusBadge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && !error && extrinsics.length > 0 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={totalCount}
                        pageSize={PAGE_SIZE}
                    />
                )}
            </div>
        </div>
    );
};

export default Extrinsics;
