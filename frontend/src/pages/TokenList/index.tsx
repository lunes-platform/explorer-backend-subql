import React from 'react';
import { TrendingUp, TrendingDown, Loader2, Users } from 'lucide-react';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { useAssets, useDashboardStats } from '../../hooks/useChainData';
import { LunesLogo } from '../../components/common/LunesLogo';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import { formatAbbreviatedNumber } from '../../data/tokenomics';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import classes from './TokenList.module.css';

function formatSupply(supply: number): string {
    if (supply >= 1e12) return `${(supply / 1e12).toFixed(2)}T`;
    if (supply >= 1e9) return `${(supply / 1e9).toFixed(2)}B`;
    if (supply >= 1e6) return `${(supply / 1e6).toFixed(2)}M`;
    if (supply >= 1e3) return `${(supply / 1e3).toFixed(2)}K`;
    return supply.toFixed(2);
}

const TokenList: React.FC = () => {
    const { price, change24h, volume24h, loading: priceLoading } = useLunesPrice();
    const { data: assets, loading: assetsLoading } = useAssets();
    const { data: chainStats, loading: statsLoading } = useDashboardStats();
    const health = useHealthStatus();
    const rpcHealth = health.rpc.status === 'connected' ? 'healthy' as const : health.rpc.status === 'connecting' ? 'delayed' as const : 'disconnected' as const;

    const totalIssuance = chainStats?.totalIssuanceFormatted || 0;

    return (
        <div className={classes.pageContainer}>
            <div className={classes.pageHeader}>
                <div>
                    <h1 className={classes.title}>Tokens & Assets</h1>
                    <p className={classes.subtitle}>All tokens and assets on Lunes Blockchain — real-time data from RPC.</p>
                    <DataSourceBadge source="RPC + API" updatedAt={!(priceLoading || assetsLoading || statsLoading) ? `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined} loading={priceLoading && assetsLoading && statsLoading} health={rpcHealth} />
                </div>
            </div>

            <div className={classes.tableContainer}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th style={{ textAlign: 'right' }}>Price</th>
                            <th style={{ textAlign: 'right' }}>24h Change</th>
                            <th style={{ textAlign: 'right' }}>Market Cap</th>
                            <th style={{ textAlign: 'right' }}>Volume (24h)</th>
                            <th style={{ textAlign: 'right' }}>Supply</th>
                            <th style={{ textAlign: 'right' }}>Holders</th>
                            <th style={{ textAlign: 'right' }}>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* LUNES native token */}
                        <tr>
                            <td className={classes.tokenRank}>1</td>
                            <td>
                                <div className={classes.tokenInfo}>
                                    <LunesLogo size={32} />
                                    <div className={classes.tokenNameWrapper}>
                                        <span className={classes.tokenSymbol}>LUNES</span>
                                        <span className={classes.tokenName}>Lunes</span>
                                    </div>
                                </div>
                            </td>
                            <td className={classes.price} style={{ textAlign: 'right' }}>
                                {priceLoading ? '—' : `$${price.toFixed(4)}`}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                {priceLoading ? '—' : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}
                                        className={change24h >= 0 ? classes.positive : classes.negative}>
                                        {change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                                    </div>
                                )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                {statsLoading || priceLoading ? '—' : `$${formatAbbreviatedNumber(price * totalIssuance)}`}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                {priceLoading ? '—' : `$${formatAbbreviatedNumber(volume24h)}`}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                {statsLoading ? '—' : `${formatSupply(totalIssuance)} LUNES`}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                            <td style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(38,208,124,0.15)', borderRadius: 4, color: 'var(--color-success)' }}>
                                    Native
                                </span>
                            </td>
                        </tr>

                        {/* Pallet assets from RPC */}
                        {assetsLoading && (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                                    <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>Loading assets from blockchain...</span>
                                </td>
                            </tr>
                        )}
                        {assets && assets.map((asset, index) => (
                            <tr key={asset.id}>
                                <td className={classes.tokenRank}>{index + 2}</td>
                                <td>
                                    <div className={classes.tokenInfo}>
                                        <div className={classes.tokenIcon} style={{
                                            background: `hsl(${(parseInt(asset.id) * 137) % 360}, 60%, 45%)`
                                        }}>
                                            {asset.symbol.charAt(0)}
                                        </div>
                                        <div className={classes.tokenNameWrapper}>
                                            <span className={classes.tokenSymbol}>{asset.symbol}</span>
                                            <span className={classes.tokenName}>{asset.name}</span>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right' }}>{formatSupply(asset.supplyFormatted)} {asset.symbol}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                                        <Users size={12} /> {asset.accounts}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(0,163,255,0.15)', borderRadius: 4, color: '#00a3ff' }}>
                                        Asset #{asset.id}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TokenList;
