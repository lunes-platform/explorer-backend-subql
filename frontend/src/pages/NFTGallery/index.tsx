import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Image, Search, Grid3X3, List, Loader2, Layers, User } from 'lucide-react';
import { useNftCollections } from '../../hooks/useChainData';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import EmptyState from '../../components/common/EmptyState';
import styles from './NFTGallery.module.css';

type ViewMode = 'grid' | 'list';

function collectionHue(id: string): number {
  return (parseInt(id) * 97 + 180) % 360;
}

const NFTGallery: React.FC = () => {
  usePageTitle('NFT Gallery', 'Browse NFT collections on the Lunes blockchain. View collection details, items, owners, and metadata.');
  const { data: collections, loading, error, refetch } = useNftCollections();
  const health = useHealthStatus();
  const rpcHealth = health.rpc.status === 'connected' ? 'healthy' as const
    : health.rpc.status === 'connecting' ? 'delayed' as const : 'disconnected' as const;

  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!collections) return [];
    let list = collections;
    if (selectedCollection) {
      list = list.filter((c) => c.id === selectedCollection);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.id.includes(q) || c.owner.toLowerCase().includes(q)
      );
    }
    return list;
  }, [collections, search, selectedCollection]);

  const totalItems = useMemo(() => {
    if (!collections) return 0;
    return collections.reduce((sum, c) => sum + c.items, 0);
  }, [collections]);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>NFT Gallery</h1>
          <p className={styles.subtitle}>
            Browse all NFT collections on Lunes — {collections?.length || 0} collections, {totalItems} items
          </p>
          <DataSourceBadge
            source="RPC"
            updatedAt={!loading && collections ? `Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined}
            loading={loading}
            health={rpcHealth}
          />
        </div>
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by ID or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${view === 'grid' ? styles.active : ''}`} onClick={() => setView('grid')}>
              <Grid3X3 size={16} />
            </button>
            <button className={`${styles.viewBtn} ${view === 'list' ? styles.active : ''}`} onClick={() => setView('list')}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Collection filter chips */}
      {collections && collections.length > 1 && (
        <div className={styles.filterBar}>
          <button
            className={`${styles.filterChip} ${!selectedCollection ? styles.active : ''}`}
            onClick={() => setSelectedCollection(null)}
          >
            All Collections
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              className={`${styles.filterChip} ${selectedCollection === c.id ? styles.active : ''}`}
              onClick={() => setSelectedCollection(selectedCollection === c.id ? null : c.id)}
            >
              Collection #{c.id} ({c.items})
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
          <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading NFT collections from blockchain...</p>
        </div>
      ) : error ? (
        <EmptyState type="error" message={error} action={{ label: 'Try Again', onClick: refetch }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          type="no-data"
          message={search ? 'No collections match your search' : 'No NFT collections found on the blockchain yet'}
        />
      ) : view === 'grid' ? (
        <div className={styles.grid}>
          {filtered.map((col) => {
            const hue = collectionHue(col.id);
            return (
              <Link to={`/nft/${col.id}`} key={col.id} className={styles.nftCard}>
                <div
                  className={styles.nftImage}
                  style={{ background: `linear-gradient(135deg, hsl(${hue}, 40%, 18%) 0%, hsl(${hue + 40}, 50%, 12%) 100%)` }}
                >
                  <Image size={48} />
                </div>
                <div className={styles.nftInfo}>
                  <div className={styles.nftName}>Collection #{col.id}</div>
                  <div className={styles.nftMeta}>
                    <span>{col.items} items</span>
                    <span className={styles.nftBadge}>NFT</span>
                  </div>
                  <div className={styles.nftMeta}>
                    <span title={col.owner}>Owner: {col.owner.slice(0, 6)}...{col.owner.slice(-4)}</span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Placeholder cards for visual items within collections */}
          {filtered.map((col) => {
            const hue = collectionHue(col.id);
            const placeholders = Math.min(col.items, 8);
            return Array.from({ length: placeholders }, (_, i) => (
              <Link to={`/nft/${col.id}`} key={`${col.id}-item-${i}`} className={styles.nftCard}>
                <div
                  className={styles.nftImage}
                  style={{ background: `linear-gradient(${135 + i * 30}deg, hsl(${(hue + i * 25) % 360}, 35%, 20%) 0%, hsl(${(hue + i * 25 + 60) % 360}, 45%, 14%) 100%)` }}
                >
                  #{i + 1}
                </div>
                <div className={styles.nftInfo}>
                  <div className={styles.nftName}>Item #{i + 1}</div>
                  <div className={styles.nftMeta}>
                    <span>Collection #{col.id}</span>
                  </div>
                </div>
              </Link>
            ));
          })}
        </div>
      ) : (
        /* List view */
        <div className={styles.listView}>
          {filtered.map((col) => {
            const hue = collectionHue(col.id);
            return (
              <Link to={`/nft/${col.id}`} key={col.id} className={styles.listItem}>
                <div className={styles.listThumb} style={{ background: `linear-gradient(135deg, hsl(${hue}, 40%, 22%), hsl(${hue + 40}, 50%, 15%))` }}>
                  <Image size={22} />
                </div>
                <div className={styles.listContent}>
                  <div className={styles.listName}>Collection #{col.id}</div>
                  <div className={styles.listMeta}>
                    Owner: {col.owner.slice(0, 8)}...{col.owner.slice(-6)}
                  </div>
                </div>
                <div className={styles.listStats}>
                  <div className={styles.listStatItem}>
                    <span className={styles.listStatLabel}>Items</span>
                    <span className={styles.listStatValue}>{col.items}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NFTGallery;
