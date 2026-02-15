import React from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

type DegradedLevel = 'warning' | 'critical' | 'offline';

interface DegradedBannerProps {
    level: DegradedLevel;
    source: string;
    message?: string;
    onRetry?: () => void;
}

const levelConfig: Record<DegradedLevel, {
    icon: React.ReactNode;
    title: string;
    bg: string;
    border: string;
    color: string;
}> = {
    warning: {
        icon: <AlertTriangle size={16} />,
        title: 'Indexer Delayed',
        bg: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        color: 'var(--color-warning, #f59e0b)',
    },
    critical: {
        icon: <AlertTriangle size={16} />,
        title: 'Indexer Lagging',
        bg: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: 'var(--color-critical, #ef4444)',
    },
    offline: {
        icon: <WifiOff size={16} />,
        title: 'Data Source Unavailable',
        bg: 'rgba(136, 136, 136, 0.08)',
        border: '1px solid rgba(136, 136, 136, 0.3)',
        color: 'var(--text-muted, #888)',
    },
};

const DegradedBanner: React.FC<DegradedBannerProps> = ({ level, source, message, onRetry }) => {
    const config = levelConfig[level];

    const defaultMessages: Record<DegradedLevel, string> = {
        warning: `The ${source} is behind the chain head. Data shown may be slightly outdated.`,
        critical: `The ${source} is significantly behind. Historical data may be incomplete or stale.`,
        offline: `The ${source} is currently unavailable. Some data cannot be displayed.`,
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 8,
            background: config.bg,
            border: config.border,
            marginBottom: 16,
            fontSize: 13,
            color: config.color,
            flexWrap: 'wrap',
        }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                {config.icon}
                {config.title}
            </span>
            <span style={{ color: 'var(--text-secondary, #ccc)', fontWeight: 400 }}>
                {message || defaultMessages[level]}
            </span>
            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: config.border,
                        background: 'transparent',
                        color: config.color,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    <RefreshCw size={12} />
                    Retry
                </button>
            )}
        </div>
    );
};

export default DegradedBanner;
