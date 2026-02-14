import React from 'react';
import { TrendingUp, TrendingDown, Activity, Box, Shield, Layers, Code2 } from 'lucide-react';
import { LunesLogo } from '../../components/common/LunesLogo';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { useDashboardStats } from '../../hooks/useChainData';
import {
    LUNES_BURN_TARGET,
    LUNES_INITIAL_SUPPLY,
    LUNES_TOTAL_BURNED,
    formatAbbreviatedNumber,
} from '../../data/tokenomics';
import classes from './Home.module.css';

interface StatProps {
    label: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
}

const StatCard: React.FC<StatProps> = ({ label, value, change, isPositive, icon, loading }) => (
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
    </div>
);

const MarketStats: React.FC = () => {
    const { price, change24h, loading: priceLoading } = useLunesPrice();
    const { data: chainStats, loading: chainLoading } = useDashboardStats();

    const latestBlock = chainStats?.latestBlock || 0;
    const totalAssets = chainStats?.totalAssets || 0;
    const totalContracts = chainStats?.totalContracts || 0;
    const totalNftCollections = chainStats?.totalNftCollections || 0;
    const activeValidators = chainStats?.activeValidators || 0;
    const currentEra = chainStats?.currentEra || 0;
    const currentSupply = chainStats?.totalIssuanceFormatted || 0;

    const marketCap = (price * currentSupply).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return (
        <div className={classes.heroSection}>
            <div className={classes.heroBlob} />
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
                />
                <StatCard
                    label="Latest Block"
                    value={`#${latestBlock.toLocaleString()}`}
                    loading={chainLoading}
                    icon={<Box size={20} />}
                />
                <StatCard
                    label="Current Era"
                    value={currentEra.toLocaleString()}
                    change={`${activeValidators} validators`}
                    isPositive={true}
                    loading={chainLoading}
                    icon={<Shield size={20} />}
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
                />
                <StatCard
                    label="NFT Collections"
                    value={totalNftCollections.toLocaleString()}
                    loading={chainLoading}
                    icon={<Box size={20} />}
                />
                <StatCard
                    label="Smart Contracts"
                    value={totalContracts.toLocaleString()}
                    loading={chainLoading}
                    icon={<Code2 size={20} />}
                />
            </div>
        </div>
    );
};

export default MarketStats;
