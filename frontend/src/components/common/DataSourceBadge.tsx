import React from 'react';

type DataSource = 'RPC' | 'API' | 'INDEXER' | 'RPC + API' | 'RPC + INDEXER' | 'STATIC';
type HealthLevel = 'healthy' | 'delayed' | 'lagging' | 'disconnected';

interface DataSourceBadgeProps {
    source: DataSource;
    updatedAt?: string | null;
    loading?: boolean;
    health?: HealthLevel;
}

const healthColors: Record<HealthLevel, { color: string; border: string; bg: string }> = {
    healthy: {
        color: 'var(--color-brand-300)',
        border: '1px solid rgba(108, 56, 255, 0.45)',
        bg: 'rgba(108, 56, 255, 0.12)',
    },
    delayed: {
        color: 'var(--color-warning, #f59e0b)',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        bg: 'rgba(245, 158, 11, 0.12)',
    },
    lagging: {
        color: 'var(--color-critical, #ef4444)',
        border: '1px solid rgba(239, 68, 68, 0.45)',
        bg: 'rgba(239, 68, 68, 0.12)',
    },
    disconnected: {
        color: 'var(--text-muted, #888)',
        border: '1px solid rgba(136, 136, 136, 0.45)',
        bg: 'rgba(136, 136, 136, 0.12)',
    },
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

const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({ source, updatedAt, loading, health = 'healthy' }) => {
    if (loading) return null;

    const colors = healthColors[health];
    const badgeStyle: React.CSSProperties = {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: colors.color,
        border: colors.border,
        background: colors.bg,
        borderRadius: 999,
        padding: '2px 8px',
    };

    return (
        <div style={containerStyle}>
            <span style={badgeStyle}>{source}</span>
            {updatedAt && <span style={freshnessStyle}>{updatedAt}</span>}
        </div>
    );
};

export default DataSourceBadge;
