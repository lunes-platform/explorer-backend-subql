import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import MarketStats from './MarketStats';
import TopTokens from './TopTokens';
import LatestActivity from './LatestActivity';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import classes from './Home.module.css';

const Home = () => {
    const { query, setQuery, handleSearch, isSearching } = useGlobalSearch();

    return (
        <div className={classes.pageContainer}>
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
                </div>
            </div>

            {/* Market Stats Hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
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
