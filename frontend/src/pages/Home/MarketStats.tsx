import React, { useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Box, Shield, Layers, Code2 } from 'lucide-react';
import { LunesLogo } from '../../components/common/LunesLogo';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { useDashboardStats } from '../../hooks/useChainData';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import {
    LUNES_BURN_TARGET,
    LUNES_INITIAL_SUPPLY,
    LUNES_TOTAL_BURNED,
    formatAbbreviatedNumber,
} from '../../data/tokenomics';
import classes from './Home.module.css';
import DegradedBanner from '../../components/common/DegradedBanner';
import { runAllChecks } from '../../utils/sanityChecks';

type HealthLevel = 'healthy' | 'delayed' | 'lagging' | 'disconnected';

const healthBadgeStyles: Record<HealthLevel, React.CSSProperties> = {
    healthy: { color: 'var(--color-brand-300)', border: '1px solid rgba(108, 56, 255, 0.45)', background: 'rgba(108, 56, 255, 0.12)' },
    delayed: { color: 'var(--color-warning, #f59e0b)', border: '1px solid rgba(245, 158, 11, 0.45)', background: 'rgba(245, 158, 11, 0.12)' },
    lagging: { color: 'var(--color-critical, #ef4444)', border: '1px solid rgba(239, 68, 68, 0.45)', background: 'rgba(239, 68, 68, 0.12)' },
    disconnected: { color: 'var(--text-muted, #888)', border: '1px solid rgba(136, 136, 136, 0.45)', background: 'rgba(136, 136, 136, 0.12)' },
};

interface StatProps {
    label: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    source?: 'RPC' | 'API' | 'STATIC';
    freshness?: string;
    healthLevel?: HealthLevel;
}

const StatCard: React.FC<StatProps> = ({ label, value, change, isPositive, icon, loading, source, freshness, healthLevel = 'healthy' }) => (
    <div className={classes.statCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={classes.statLabel}>{label}</span>
            {icon && <span style={{ color: 'var(--color-brand-600)', opacity: 0.8 }}>{icon}</span>}
        </div>
        <div className={classes.statValue}>
            {loading ? '---' : value}
        </div>
        {change && !loading && (
            <div className={`${classes.statChange} ${isPositive ? classes.positive : classes.negative}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {change}
            </div>
        )}

        {(source || freshness) && !loading && (
            <div className={classes.statMeta}>
                {source && <span className={classes.sourceBadge} style={healthBadgeStyles[healthLevel]}>{source}</span>}
                {freshness && <span className={classes.freshnessText}>{freshness}</span>}
            </div>
        )}
    </div>
);

const MarketStats: React.FC = () => {
    const { price, change24h, loading: priceLoading } = useLunesPrice();
    const { data: chainStats, loading: chainLoading } = useDashboardStats();
    const health = useHealthStatus();
    const rpcHealth: HealthLevel = health.rpc.status === 'connected' ? 'healthy' : health.rpc.status === 'connecting' ? 'delayed' : 'disconnected';
    const chainUpdatedAt = useMemo(() => {
        if (!chainStats) return null;
        return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }, [chainStats]);

    const latestBlock = chainStats?.latestBlock || 0;
    const totalAssets = chainStats?.totalAssets || 0;
    const totalContracts = chainStats?.totalContracts || 0;
    const totalNftCollections = chainStats?.totalNftCollections || 0;
    const activeValidators = chainStats?.activeValidators || 0;
    const currentEra = chainStats?.currentEra || 0;
    const currentSupply = chainStats?.totalIssuanceFormatted || 0;

    const sanity = useMemo(() => {
        if (!chainStats) return { valid: true, warnings: [] };
        return runAllChecks({
            totalIssuanceFormatted: chainStats.totalIssuanceFormatted,
            chainDecimals: chainStats.tokenDecimals,
            latestBlock: chainStats.latestBlock,
        });
    }, [chainStats]);

    useEffect(() => {
        if (sanity.warnings.length > 0) {
            sanity.warnings.forEach(w => console.warn('[SanityCheck]', w));
        }
    }, [sanity]);

    const marketCap = (price * currentSupply).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return (
        <div className={classes.heroSection}>
            <div className={classes.heroBlob} />
            {!sanity.valid && !chainLoading && (
                <DegradedBanner
                    level="warning"
                    source="RPC Data"
                    message={sanity.warnings[0]}
                />
            )}
            <div className={classes.marketStatsGrid}>
                <StatCard
                    label="Lunes Price"
                    value={price ? `$${price.toFixed(4)}` : '$0.000'}
                    change={`${Math.abs(change24h).toFixed(2)}%`}
                    isPositive={change24h >= 0}
                    loading={priceLoading}
                    icon={<LunesLogo size={20} />}
                />
                <StatCard
                    label="Market Cap"
                    value={marketCap}
                    loading={priceLoading || chainLoading}
                    icon={<Activity size={20} />}
                    source="RPC"
                    freshness={chainUpdatedAt ? `Updated ${chainUpdatedAt}` : undefined}
                    healthLevel={rpcHealth}
                />
                <StatCard
                    label="Latest Block"
                    value={`#${latestBlock.toLocaleString()}`}
                    loading={chainLoading}
                    icon={<Box size={20} />}
                    source="RPC"
                    freshness={chainUpdatedAt ? `Updated ${chainUpdatedAt}` : undefined}
                    healthLevel={rpcHealth}
                />
                <StatCard
                    label="Current Era"
                    value={currentEra.toLocaleString()}
                    change={`${activeValidators} validators`}
                    isPositive={true}
                    loading={chainLoading}
                    icon={<Shield size={20} />}
                    source="RPC"
                    freshness={chainUpdatedAt ? `Updated ${chainUpdatedAt}` : undefined}
                    healthLevel={rpcHealth}
                />
                <StatCard
                    label="Initial Supply"
                    value={`${formatAbbreviatedNumber(LUNES_INITIAL_SUPPLY)} LUNES`}
                    loading={false}
                    icon={<span style={{ fontSize: '1.2em' }}>🧱</span>}
                />
                <StatCard
                    label="Current Supply"
                    value={currentSupply > 0 ? `${formatAbbreviatedNumber(currentSupply)} LUNES` : '---'}
                    isPositive={true}
                    loading={chainLoading}
                    icon={<LunesLogo size={20} />}
                    source="RPC"
                    freshness={chainUpdatedAt ? `Updated ${chainUpdatedAt}` : undefined}
                    healthLevel={rpcHealth}
                />
                <StatCard
                    label="Burn Target"
                    value={`${formatAbbreviatedNumber(LUNES_BURN_TARGET)} LUNES`}
                    change={`Burned: ${formatAbbreviatedNumber(LUNES_TOTAL_BURNED)} LUNES`}
                    isPositive={true}
                    loading={false}
                    icon={<span style={{ fontSize: '1.2em' }}>🔥</span>}
                />
                <StatCard
                    label="Native Assets"
                    value={totalAssets.toLocaleString()}
                    loading={chainLoading}
                    icon={<Layers size={20} />}
                    source="RPC"
                    freshness={chainUpdatedAt ? `Updated ${chainUpdatedAt}` : undefined}
                    healthLevel={rpcHealth}
                />
                <StatCard
                    label="NFT Collections"
                    value={totalNftCollections.toLocaleString()}
                    loading={chainLoading}
                    icon={<Box size={20} />}
                    source="RPC"
                    freshness={chainUpdatedAt ? `Updated ${chainUpdatedAt}` : undefined}
                    healthLevel={rpcHealth}
                />
                <StatCard
                    label="Smart Contracts"
                    value={totalContracts.toLocaleString()}
                    loading={chainLoading}
                    icon={<Code2 size={20} />}
                    source="RPC"
                    freshness={chainUpdatedAt ? `Updated ${chainUpdatedAt}` : undefined}
                    healthLevel={rpcHealth}
                />
            </div>
        </div>
    );
};

export default MarketStats;
