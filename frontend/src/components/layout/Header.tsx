import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import classes from './Header.module.css';
import { useLunesPrice, formatPrice } from '../../hooks/useLunesPrice';
import { useDashboardStats } from '../../hooks/useChainData';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { GET_HOME_STATS } from '../../services/graphql/queries';
import type { HomeStats } from '../../types';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { WalletButton } from '../wallet/WalletButton';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import SearchResults from '../common/SearchResults';
import { WatchlistDropdown } from '../common/WatchlistDropdown';
import { PriceAlertPanel } from '../common/PriceAlertPanel';
import { LunesLogo } from '../common/LunesLogo';
import { LunesWordmark } from '../common/LunesWordmark';
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
    const { price, change24h, marketCap: apiMarketCap } = useLunesPrice();
    const { data: chainStats } = useDashboardStats();
    const health = useHealthStatus();
    const { query, setQuery, results, showResults, handleSearch, selectResult, dismissResults, isSearching, selectedIndex } = useGlobalSearch();

    const { data: statsData } = useQuery<HomeStats>(GET_HOME_STATS, { pollInterval: 15000 });
    const totalTransfers = statsData?.transfers?.totalCount || 0;
    const currentSupply = chainStats?.totalIssuanceFormatted || 0;
    const indexerLagStatus = getIndexerLagStatus(health.indexer.lag);
    const rpcStatusLabel = health.rpc.status === 'connected' ? '● Mainnet Harmony'
        : health.rpc.status === 'connecting' ? '◌ Connecting...'
        : '○ RPC Offline';
    const rpcStatusColor = health.rpc.status === 'connected' ? 'var(--color-success)'
        : health.rpc.status === 'connecting' ? 'var(--color-warning)'
        : 'var(--color-critical)';
    const rawMarketCap = apiMarketCap > 0 ? apiMarketCap : (price > 0 && currentSupply > 0 ? price * currentSupply : 0);
    const marketCap = rawMarketCap > 0
        ? rawMarketCap.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
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
                            {formatPrice(price)} ({change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%)
                        </span>
                    </div>
                    <div className={classes.tickerItem}>
                        Market Cap: <span>{marketCap}</span>
                    </div>
                    <div className={classes.tickerItem}>
                        Supply Evolution: <span style={{ color: 'var(--color-brand-400)' }}>{formatLunesAmount(LUNES_INITIAL_SUPPLY)}</span><span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 4px' }}>→</span><span style={{ color: 'var(--color-brand-400)' }}>{currentSupply > 0 ? currentSupply.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '...'}</span>
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

                <nav className={classes.nav} aria-label="Main navigation">
                    <Link to="/" className={`${classes.navLink} ${location.pathname === '/' ? classes.active : ''}`}>Dashboard</Link>

                    <div className={classes.dropdown}>
                        <button aria-haspopup="true" aria-label="Blockchain menu" className={`${classes.navLink} ${classes.dropdownTrigger} ${['/blocks', '/extrinsics'].some(p => location.pathname.startsWith(p)) ? classes.active : ''}`}>
                            Blockchain <ChevronDown size={12} />
                        </button>
                        <div className={classes.dropdownMenu}>
                            <Link to="/blocks" className={`${classes.dropdownItem} ${location.pathname === '/blocks' ? classes.active : ''}`}>Blocks</Link>
                            <Link to="/extrinsics" className={`${classes.dropdownItem} ${location.pathname === '/extrinsics' ? classes.active : ''}`}>Extrinsics</Link>
                        </div>
                    </div>

                    <div className={classes.dropdown}>
                        <button aria-haspopup="true" aria-label="Tokens menu" className={`${classes.navLink} ${classes.dropdownTrigger} ${['/tokens', '/assets', '/nfts'].some(p => location.pathname.startsWith(p)) ? classes.active : ''}`}>
                            Tokens <ChevronDown size={12} />
                        </button>
                        <div className={classes.dropdownMenu}>
                            <Link to="/tokens" className={`${classes.dropdownItem} ${location.pathname === '/tokens' ? classes.active : ''}`}>Tokens</Link>
                            <Link to="/assets" className={`${classes.dropdownItem} ${location.pathname === '/assets' ? classes.active : ''}`}>Assets</Link>
                            <Link to="/assets/transfers" className={`${classes.dropdownItem} ${location.pathname === '/assets/transfers' ? classes.active : ''}`}>Asset Transfers</Link>
                            <Link to="/nfts" className={`${classes.dropdownItem} ${location.pathname === '/nfts' ? classes.active : ''}`}>NFTs</Link>
                        </div>
                    </div>

                    <div className={classes.dropdown}>
                        <button aria-haspopup="true" aria-label="Network menu" className={`${classes.navLink} ${classes.dropdownTrigger} ${['/staking', '/rich-list', '/contracts'].some(p => location.pathname.startsWith(p)) ? classes.active : ''}`}>
                            Network <ChevronDown size={12} />
                        </button>
                        <div className={classes.dropdownMenu}>
                            <Link to="/staking" className={`${classes.dropdownItem} ${location.pathname === '/staking' ? classes.active : ''}`}>Staking</Link>
                            <Link to="/rich-list" className={`${classes.dropdownItem} ${location.pathname === '/rich-list' ? classes.active : ''}`}>Rich List</Link>
                            <Link to="/contracts" className={`${classes.dropdownItem} ${location.pathname === '/contracts' ? classes.active : ''}`}>Contracts</Link>
                        </div>
                    </div>

                    <Link to="/projects" className={`${classes.navLink} ${location.pathname.startsWith('/project') ? classes.active : ''}`}>Projects</Link>
                    <Link to="/analytics" className={`${classes.navLink} ${location.pathname === '/analytics' ? classes.active : ''}`}>Analytics</Link>
                    <Link to="/anomalies" className={`${classes.navLink} ${location.pathname === '/anomalies' ? classes.active : ''}`}>Radar</Link>
                    <Link to="/rewards" className={`${classes.navLink} ${location.pathname.startsWith('/rewards') ? classes.active : ''}`}>Rewards</Link>
                </nav>

                <div className={classes.actions} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <PriceAlertPanel currentPrice={price} />
                    <WatchlistDropdown />
                    <div className={classes.search} style={{ position: 'relative' }}>
                        <div className={classes.searchWrapper}>
                            <Search size={16} className={classes.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search Address / Hash / Block / Asset..."
                                className={classes.searchInput}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                aria-label="Search the blockchain"
                                role="combobox"
                                aria-expanded={showResults}
                                aria-autocomplete="list"
                            />
                            {isSearching && <Loader2 size={14} className={classes.searchLoader} />}
                        </div>
                        <SearchResults
                            results={results}
                            show={showResults}
                            isSearching={isSearching}
                            query={query}
                            onSelect={selectResult}
                            onDismiss={dismissResults}
                            selectedIndex={selectedIndex}
                        />
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
