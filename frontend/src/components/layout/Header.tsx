import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import classes from './Header.module.css';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { useDashboardStats } from '../../hooks/useChainData';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { GET_HOME_STATS } from '../../services/graphql/queries';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { WalletButton } from '../wallet/WalletButton';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import { LunesLogo } from '../common/LunesLogo';
import { LunesWordmark } from '../common/LunesWordmark';
import type { HomeStats } from '../../types';
import {
    LUNES_BURN_TARGET,
    LUNES_INITIAL_SUPPLY,
    formatLunesAmount,
} from '../../data/tokenomics';

function getIndexerLagStatus(lag: number | null) {
    if (lag === null) return { label: 'Syncing...', color: 'var(--text-muted)' };
    if (lag <= 5) return { label: `Healthy (+${lag})`, color: 'var(--color-success)' };
    if (lag <= 50) return { label: `Delay (+${lag})`, color: 'var(--color-warning)' };
    return { label: `Lagging (+${lag})`, color: 'var(--color-critical)' };
}

const Header: React.FC = () => {
    const location = useLocation();
    const { price, change24h } = useLunesPrice();
    const { data: statsData } = useQuery<HomeStats>(GET_HOME_STATS);
    const { data: chainStats } = useDashboardStats();
    const health = useHealthStatus();
    const { query, setQuery, handleSearch, isSearching } = useGlobalSearch();

    const totalTransfers = statsData?.transfers?.totalCount || 0;
    const currentSupply = chainStats?.totalIssuanceFormatted || 0;
    const rpcLatestBlock = health.rpc.latestBlock || chainStats?.latestBlock || 0;
    const indexerLatestBlock = statsData?.blocks?.nodes?.[0]?.number || 0;
    const indexerLag = rpcLatestBlock > 0 && indexerLatestBlock > 0
        ? Math.max(rpcLatestBlock - indexerLatestBlock, 0)
        : null;
    const indexerLagStatus = getIndexerLagStatus(indexerLag);
    const rpcStatusLabel = health.rpc.status === 'connected' ? '● Mainnet Harmony'
        : health.rpc.status === 'connecting' ? '◌ Connecting...'
        : '○ RPC Offline';
    const rpcStatusColor = health.rpc.status === 'connected' ? 'var(--color-success)'
        : health.rpc.status === 'connecting' ? 'var(--color-warning)'
        : 'var(--color-critical)';
    const marketCap = price > 0 && currentSupply > 0
        ? (price * currentSupply).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
        : '—';

    return (
        <header className={classes.header}>
            <div className={classes.topBar}>
                <div className={classes.tickerContainer}>
                    <div className={classes.tickerItem}>
                        Current Supply: <span>{currentSupply > 0 ? `${currentSupply.toLocaleString('en-US', { maximumFractionDigits: 0 })} LUNES` : '...'}</span>
                    </div>
                    <div className={classes.tickerItem}>
                        Burn Target: <span style={{ color: 'var(--color-warning)' }}>🔥 {formatLunesAmount(LUNES_BURN_TARGET)} LUNES</span>
                    </div>
                    <div className={classes.tickerItem}>
                        Lunes Price: <span className={change24h >= 0 ? classes.tickerPositive : classes.tickerNegative}>
                            ${price.toFixed(4)} ({change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%)
                        </span>
                    </div>
                    <div className={classes.tickerItem}>
                        Market Cap: <span>{marketCap}</span>
                    </div>
                    <div className={classes.tickerItem}>
                        Supply Evolution: <span>{formatLunesAmount(LUNES_INITIAL_SUPPLY)} → {currentSupply > 0 ? currentSupply.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '...'}</span>
                    </div>
                    <div className={classes.tickerItem}>
                        Transactions: <span>{totalTransfers.toLocaleString()}</span>
                    </div>
                    <div className={classes.tickerItem}>
                        Indexer Lag: <span style={{ color: indexerLagStatus.color }}>{indexerLagStatus.label}</span>
                    </div>
                    <div className={classes.tickerItem} style={{ marginLeft: 'auto' }}>
                        Network: <span style={{ color: rpcStatusColor }}>{rpcStatusLabel}</span>
                    </div>
                </div>
            </div>

            <div className={`container ${classes.content}`}>
                <Link to="/" className={classes.logo}>
                    <LunesLogo size={28} />
                    <LunesWordmark height={22} />
                    <span className={classes.title} style={{ fontSize: '11px', opacity: 0.5, fontWeight: 500, letterSpacing: '0.05em' }}>EXPLORER</span>
                </Link>

                <nav className={classes.nav}>
                    <Link to="/" className={`${classes.navLink} ${location.pathname === '/' ? classes.active : ''}`}>Dashboard</Link>

                    <div className={classes.dropdown}>
                        <button className={`${classes.navLink} ${classes.dropdownTrigger} ${['/blocks', '/extrinsics'].some(p => location.pathname.startsWith(p)) ? classes.active : ''}`}>
                            Blockchain <ChevronDown size={12} />
                        </button>
                        <div className={classes.dropdownMenu}>
                            <Link to="/blocks" className={`${classes.dropdownItem} ${location.pathname === '/blocks' ? classes.active : ''}`}>Blocks</Link>
                            <Link to="/extrinsics" className={`${classes.dropdownItem} ${location.pathname === '/extrinsics' ? classes.active : ''}`}>Extrinsics</Link>
                        </div>
                    </div>

                    <div className={classes.dropdown}>
                        <button className={`${classes.navLink} ${classes.dropdownTrigger} ${['/tokens', '/assets', '/nfts'].some(p => location.pathname.startsWith(p)) ? classes.active : ''}`}>
                            Tokens <ChevronDown size={12} />
                        </button>
                        <div className={classes.dropdownMenu}>
                            <Link to="/tokens" className={`${classes.dropdownItem} ${location.pathname === '/tokens' ? classes.active : ''}`}>Tokens</Link>
                            <Link to="/assets" className={`${classes.dropdownItem} ${location.pathname === '/assets' ? classes.active : ''}`}>Assets</Link>
                            <Link to="/nfts" className={`${classes.dropdownItem} ${location.pathname === '/nfts' ? classes.active : ''}`}>NFTs</Link>
                        </div>
                    </div>

                    <div className={classes.dropdown}>
                        <button className={`${classes.navLink} ${classes.dropdownTrigger} ${['/staking', '/rich-list', '/contracts'].some(p => location.pathname.startsWith(p)) ? classes.active : ''}`}>
                            Network <ChevronDown size={12} />
                        </button>
                        <div className={classes.dropdownMenu}>
                            <Link to="/staking" className={`${classes.dropdownItem} ${location.pathname === '/staking' ? classes.active : ''}`}>Staking</Link>
                            <Link to="/rich-list" className={`${classes.dropdownItem} ${location.pathname === '/rich-list' ? classes.active : ''}`}>Rich List</Link>
                            <Link to="/contracts" className={`${classes.dropdownItem} ${location.pathname === '/contracts' ? classes.active : ''}`}>Contracts</Link>
                        </div>
                    </div>

                    <Link to="/projects" className={`${classes.navLink} ${location.pathname.startsWith('/project') ? classes.active : ''}`}>Projects</Link>
                </nav>

                <div className={classes.actions} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <div className={classes.search}>
                        <div className={classes.searchWrapper}>
                            <Search size={16} className={classes.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search Address / Hash / Block / Asset..."
                                className={classes.searchInput}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                            {isSearching && <Loader2 size={14} className={classes.searchLoader} />}
                        </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                        <WalletButton />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
