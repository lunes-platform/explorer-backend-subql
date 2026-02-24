import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Coins, FolderOpen, FileCode } from 'lucide-react';
import { useQuery } from '@apollo/client/react';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { useAssets, useDashboardStats } from '../../hooks/useChainData';
import { formatAbbreviatedNumber } from '../../data/tokenomics';
import { getProjectByAssetId } from '../../data/knownProjects';
import { LunesLogo } from '../../components/common/LunesLogo';
import { WatchlistButton } from '../../components/common/WatchlistButton';
import { useWatchlist } from '../../hooks/useWatchlist';
import { GET_TOKEN_MARKET_DATA } from '../../services/graphql/queries';
import classes from './Home.module.css';

interface Psp22TokenNode {
    id: string;
    name: string;
    symbol: string;
    contractAddress: string;
    totalSupply: string;
    decimals: number;
    verified: boolean;
}
interface TokenMarketDataResponse {
    psp22Tokens: { nodes: Psp22TokenNode[] };
}

function formatSupply(supply: number, decimals: number = 2): string {
    if (supply >= 1e12) return `${(supply / 1e12).toFixed(decimals)}T`;
    if (supply >= 1e9) return `${(supply / 1e9).toFixed(decimals)}B`;
    if (supply >= 1e6) return `${(supply / 1e6).toFixed(decimals)}M`;
    if (supply >= 1e3) return `${(supply / 1e3).toFixed(decimals)}K`;
    return supply.toFixed(decimals);
}

const TopTokens: React.FC = () => {
    const navigate = useNavigate();
    const { price, change24h, volume24h, loading: priceLoading } = useLunesPrice();
    const { data: assets, loading: assetsLoading } = useAssets();
    const { data: chainStats, loading: statsLoading } = useDashboardStats();
    const { isWatched, toggleItem } = useWatchlist();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const { data: psp22Data } = useQuery<TokenMarketDataResponse>(GET_TOKEN_MARKET_DATA);
    const psp22Tokens = psp22Data?.psp22Tokens?.nodes || [];

    const loading = priceLoading || assetsLoading || statsLoading;
    const totalIssuance = chainStats?.totalIssuanceFormatted || 0;
    const assetsUpdatedAt = useMemo(() => {
        if (!assets && !chainStats) return null;
        return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }, [assets, chainStats]);

    // Pagination logic
    const totalAssets = assets?.length || 0;
    const totalPages = Math.ceil(totalAssets / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAssets = assets?.slice(startIndex, startIndex + itemsPerPage) || [];

    return (
        <div className={classes.topTokensSection}>
            <div className={classes.sectionHeader}>
                <div>
                    <h2 className={classes.sectionTitle}>
                        <Coins size={22} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Tokens & Assets on Lunes
                    </h2>
                    {!loading && (
                        <div className={classes.statMeta}>
                            <span className={classes.sourceBadge}>RPC + API</span>
                            <span className={classes.freshnessText}>
                                {assetsUpdatedAt ? `Updated ${assetsUpdatedAt}` : 'Updated now'}
                            </span>
                        </div>
                    )}
                </div>
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
                            <th style={{ textAlign: 'center' }}>Watch</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* LUNES native token - always first */}
                        <tr 
                            className={classes.clickableRow}
                            onClick={() => navigate('/token/lunes')}
                        >
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
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <WatchlistButton
                                    isWatched={isWatched('LUNES', 'token')}
                                    onToggle={() => toggleItem({ id: 'LUNES', type: 'token', symbol: 'LUNES', name: 'Lunes' })}
                                    size="sm"
                                />
                            </td>
                        </tr>

                        {/* PSP22 ink! contracts from SubQuery */}
                        {psp22Tokens.map((token, index) => (
                            <tr
                                key={token.id}
                                className={classes.clickableRow}
                                onClick={() => navigate(`/account/${token.contractAddress}`)}
                            >
                                <td className={classes.rankCell}>{index + 2}</td>
                                <td>
                                    <div className={classes.tokenInfo}>
                                        <div className={classes.tokenIconPlaceholder} style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                                            <FileCode size={16} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={classes.tokenSim}>{token.name}</span>
                                                <span className={classes.tokenName}>{token.symbol}</span>
                                                <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(99,102,241,0.15)', borderRadius: '4px', color: '#818cf8' }}>PSP22</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className={classes.supplyContainer} style={{ marginLeft: 'auto' }}>
                                        <span>{token.totalSupply && token.totalSupply !== '0' ? formatSupply(Number(BigInt(token.totalSupply)) / Math.pow(10, token.decimals)) : '—'} {token.symbol}</span>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(99,102,241,0.15)', borderRadius: '4px', color: '#818cf8' }}>PSP22</span>
                                </td>
                                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    <WatchlistButton
                                        isWatched={isWatched(token.id, 'token')}
                                        onToggle={() => toggleItem({ id: token.id, type: 'token', symbol: token.symbol, name: token.name })}
                                        size="sm"
                                    />
                                </td>
                            </tr>
                        ))}

                        {/* Chain assets from RPC */}
                        {assetsLoading && (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
                                    <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>Loading assets from blockchain...</span>
                                </td>
                            </tr>
                        )}
                        {paginatedAssets.map((asset, index) => {
                            const project = getProjectByAssetId(asset.id);
                            const rowDestination = project ? `/project/${project.slug}` : `/asset/${asset.id}`;
                            const actualIndex = startIndex + index;
                            return (
                            <tr 
                                key={asset.id}
                                className={classes.clickableRow}
                                onClick={() => navigate(rowDestination)}
                            >
                                <td className={classes.rankCell}>{actualIndex + 2}</td>
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
                                                    onClick={(e) => e.stopPropagation()}
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
                                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    <WatchlistButton
                                        isWatched={isWatched(asset.id, 'token')}
                                        onToggle={() => toggleItem({ id: asset.id, type: 'token', symbol: asset.symbol, name: asset.name })}
                                        size="sm"
                                    />
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '12px', 
                        marginTop: '20px',
                        padding: '16px 0'
                    }}>
                        <button
                            onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid var(--border-default)',
                                borderRadius: '8px',
                                background: currentPage === 1 ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                            }}
                        >
                            ← Anterior
                        </button>
                        <span style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-muted)',
                            fontWeight: 500
                        }}>
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid var(--border-default)',
                                borderRadius: '8px',
                                background: currentPage === totalPages ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                            }}
                        >
                            Próxima →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopTokens;
