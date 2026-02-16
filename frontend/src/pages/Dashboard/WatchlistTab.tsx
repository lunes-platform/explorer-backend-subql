import React from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Wallet, Coins, FileCode, Image, Box, Trash2,
} from 'lucide-react';
import { useWatchlist, type WatchlistItem } from '../../hooks/useWatchlist';
import styles from './Dashboard.module.css';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  account: <Wallet size={16} />,
  token: <Coins size={16} />,
  contract: <FileCode size={16} />,
  nft: <Image size={16} />,
  block: <Box size={16} />,
};

const TYPE_COLORS: Record<string, string> = {
  account: 'rgba(108,56,255,0.15)',
  token: 'rgba(38,208,124,0.15)',
  contract: 'rgba(0,163,255,0.15)',
  nft: 'rgba(168,85,247,0.15)',
  block: 'rgba(254,159,0,0.15)',
};

function getItemLink(item: WatchlistItem): string {
  switch (item.type) {
    case 'account': return `/account/${item.id}`;
    case 'token': return `/token/${item.id}`;
    case 'contract': return `/account/${item.id}`;
    case 'nft': return `/nft/${item.id}`;
    case 'block': return `/block/${item.id}`;
    default: return '#';
  }
}

export default function WatchlistTab() {
  const { items, tokens, accounts, contracts, nfts, blocks, removeItem } = useWatchlist();

  const sections: { key: string; label: string; icon: React.ReactNode; items: WatchlistItem[] }[] = [
    { key: 'tokens', label: 'Tokens', icon: <Coins size={16} />, items: tokens },
    { key: 'accounts', label: 'Accounts', icon: <Wallet size={16} />, items: accounts },
    { key: 'contracts', label: 'Contracts', icon: <FileCode size={16} />, items: contracts },
    { key: 'nfts', label: 'NFTs', icon: <Image size={16} />, items: nfts },
    { key: 'blocks', label: 'Blocks', icon: <Box size={16} />, items: blocks },
  ].filter((s) => s.items.length > 0);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}><Star size={22} /> My Watchlist</h2>
        <p className={styles.pageSubtitle}>All items you are monitoring ({items.length} total)</p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
          Your watchlist is empty. Add tokens, accounts, NFTs, or blocks from their detail pages.
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.key} className={styles.section}>
            <div className={styles.sectionTitle}>
              {section.icon} {section.label} ({section.items.length})
            </div>
            <div className={styles.watchGrid}>
              {section.items.map((item) => (
                <div key={`${item.type}-${item.id}`} className={styles.watchCard}>
                  <Link to={getItemLink(item)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                    <div className={styles.watchIcon} style={{ background: TYPE_COLORS[item.type] || 'rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}>
                      {TYPE_ICONS[item.type] || <Star size={16} />}
                    </div>
                    <div className={styles.watchInfo}>
                      <div className={styles.watchName}>
                        {item.name || item.symbol || `${item.id.slice(0, 10)}...`}
                      </div>
                      <div className={styles.watchMeta}>
                        {item.type} · Added {new Date(item.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeItem(item.id, item.type)}
                    className={`${styles.actionBtn} ${styles.danger}`}
                    title="Remove from watchlist"
                    style={{ flexShrink: 0 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
