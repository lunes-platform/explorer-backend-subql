import React from 'react';

type DataSource = 'RPC' | 'API' | 'INDEXER' | 'RPC + API' | 'STATIC';

interface DataSourceBadgeProps {
    source: DataSource;
    updatedAt?: string | null;
    loading?: boolean;
}

const badgeStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--color-brand-300)',
    border: '1px solid rgba(108, 56, 255, 0.45)',
    background: 'rgba(108, 56, 255, 0.12)',
    borderRadius: 999,
    padding: '2px 8px',
};

const freshnessStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--text-muted)',
};

const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
};

const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({ source, updatedAt, loading }) => {
    if (loading) return null;

    return (
        <div style={containerStyle}>
            <span style={badgeStyle}>{source}</span>
            {updatedAt && <span style={freshnessStyle}>{updatedAt}</span>}
        </div>
    );
};

export default DataSourceBadge;
