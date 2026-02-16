import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import MarketStats from './MarketStats';
import BannerSlider from './BannerSlider';
import TopTokens from './TopTokens';
import LatestActivity from './LatestActivity';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { usePageTitle } from '../../hooks/usePageTitle';
import SearchResults from '../../components/common/SearchResults';
import { IndexerAlert } from '../../components/common/IndexerAlert';
import classes from './Home.module.css';

const Home = () => {
    usePageTitle('Dashboard', 'Lunes blockchain dashboard — real-time blocks, transactions, market data, validators, and network health at a glance.');
    const { query, setQuery, results, showResults, handleSearch, selectResult, dismissResults, isSearching, selectedIndex } = useGlobalSearch();
    const health = useHealthStatus();

    return (
        <div className={classes.pageContainer}>
            <IndexerAlert lag={health.indexer.lag} />
            
            {/* Search Section - NOW CONNECTED TO useGlobalSearch */}
            <div className={classes.searchContainer}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                    <Search 
                        size={20} 
                        style={{ 
                            position: 'absolute', 
                            left: '16px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none'
                        }} 
                    />
                    <input
                        type="text"
                        className={classes.searchBar}
                        placeholder="Search by Address / Txn Hash / Block / Token"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        style={{ paddingLeft: '48px', paddingRight: query ? '48px' : '24px' }}
                    />
                    {isSearching && (
                        <Loader2 
                            size={20} 
                            style={{ 
                                position: 'absolute', 
                                right: '16px', 
                                top: '50%', 
                                transform: 'translateY(-50%)',
                                color: 'var(--color-brand-400)',
                                animation: 'spin 1s linear infinite'
                            }} 
                        />
                    )}
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
            </div>

            {/* Promotional Banner Slider */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <BannerSlider />
            </motion.div>

            {/* Market Stats Hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
            >
                <MarketStats />
            </motion.div>

            {/* Latest Activity (Blocks & Extrinsics) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <LatestActivity />
            </motion.div>

            {/* Top Tokens List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <TopTokens />
            </motion.div>
        </div>
    );
};

export default Home;
