import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Coins, FolderOpen } from 'lucide-react';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { useAssets, useDashboardStats } from '../../hooks/useChainData';
import { formatAbbreviatedNumber } from '../../data/tokenomics';
import { getProjectByAssetId } from '../../data/knownProjects';
import { LunesLogo } from '../../components/common/LunesLogo';
import classes from './Home.module.css';

function formatSupply(supply: number, decimals: number = 2): string {
    if (supply >= 1e12) return `${(supply / 1e12).toFixed(decimals)}T`;
    if (supply >= 1e9) return `${(supply / 1e9).toFixed(decimals)}B`;
    if (supply >= 1e6) return `${(supply / 1e6).toFixed(decimals)}M`;
    if (supply >= 1e3) return `${(supply / 1e3).toFixed(decimals)}K`;
    return supply.toFixed(decimals);
}

const TopTokens: React.FC = () => {
    const { price, change24h, volume24h, loading: priceLoading } = useLunesPrice();
    const { data: assets, loading: assetsLoading } = useAssets();
    const { data: chainStats, loading: statsLoading } = useDashboardStats();

    const loading = priceLoading || assetsLoading || statsLoading;
    const totalIssuance = chainStats?.totalIssuanceFormatted || 0;

    return (
        <div className={classes.topTokensSection}>
            <div className={classes.sectionHeader}>
                <h2 className={classes.sectionTitle}>
                    <Coins size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Tokens & Assets on Lunes
                </h2>
                <Link to="/assets" className={classes.viewAllLink}>
                    Ver Tudo <ArrowRight size={16} />
                </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className={classes.tokensTable}>
                    <thead>
                        <tr>
                            <th className={classes.rankCell}>#</th>
                            <th>Name</th>
                            <th style={{ textAlign: 'right' }}>Price</th>
                            <th style={{ textAlign: 'right' }}>24h %</th>
                            <th style={{ textAlign: 'right' }}>Market Cap</th>
                            <th style={{ textAlign: 'right' }}>Volume(24h)</th>
                            <th style={{ textAlign: 'right' }}>Supply</th>
                            <th style={{ textAlign: 'right' }}>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* LUNES native token - always first */}
                        <tr>
                            <td className={classes.rankCell}>1</td>
                            <td>
                                <div className={classes.tokenInfo}>
                                    <div className={classes.tokenIconPlaceholder} style={{ background: 'linear-gradient(135deg, #1a2332, #0d1520)' }}>
                                        <LunesLogo size={20} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={classes.tokenSim}>Lunes</span>
                                        <span className={classes.tokenName}>LUNES</span>
                                        <span style={{ 
                                            fontSize: '10px', 
                                            padding: '2px 6px', 
                                            background: 'rgba(108, 56, 255, 0.2)', 
                                            borderRadius: '4px',
                                            color: 'var(--color-brand-400)'
                                        }}>Native</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ textAlign: 'right' }} className={classes.price}>
                                {priceLoading ? '---' : `$${price.toFixed(4)}`}
                            </td>
                            <td style={{ textAlign: 'right' }} className={change24h >= 0 ? classes.positive : classes.negative}>
                                {priceLoading ? '---' : `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                {loading ? '---' : `$${formatAbbreviatedNumber(price * totalIssuance)}`}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                {priceLoading ? '---' : `$${formatAbbreviatedNumber(volume24h)}`}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <div className={classes.supplyContainer} style={{ marginLeft: 'auto' }}>
                                    <span>{statsLoading ? '---' : `${formatSupply(totalIssuance)} LUNES`}</span>
                                </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <span style={{ 
                                    fontSize: '11px', 
                                    padding: '3px 8px', 
                                    background: 'rgba(38, 208, 124, 0.15)', 
                                    borderRadius: '4px',
                                    color: 'var(--color-success)'
                                }}>Substrate</span>
                            </td>
                        </tr>

                        {/* Chain assets from RPC */}
                        {assetsLoading && (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                                    <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>Loading assets from blockchain...</span>
                                </td>
                            </tr>
                        )}
                        {assets && assets.map((asset, index) => {
                            const project = getProjectByAssetId(asset.id);
                            return (
                            <tr key={asset.id}>
                                <td className={classes.rankCell}>{index + 2}</td>
                                <td>
                                    <div className={classes.tokenInfo}>
                                        <div className={classes.tokenIconPlaceholder} style={{ 
                                            background: `hsl(${(parseInt(asset.id) * 137) % 360}, 60%, 45%)` 
                                        }}>
                                            {asset.symbol.charAt(0)}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={classes.tokenSim}>{asset.name}</span>
                                                <span className={classes.tokenName}>{asset.symbol}</span>
                                                <span style={{ 
                                                    fontSize: '10px', 
                                                    padding: '2px 6px', 
                                                    background: 'rgba(0, 163, 255, 0.15)', 
                                                    borderRadius: '4px',
                                                    color: '#00a3ff'
                                                }}>Asset #{asset.id}</span>
                                            </div>
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
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className={classes.supplyContainer} style={{ marginLeft: 'auto' }}>
                                        <span>{formatSupply(asset.supplyFormatted)} {asset.symbol}</span>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <span style={{ 
                                        fontSize: '11px', 
                                        padding: '3px 8px', 
                                        background: 'rgba(0, 163, 255, 0.15)', 
                                        borderRadius: '4px',
                                        color: '#00a3ff'
                                    }}>pallet-assets</span>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TopTokens;
