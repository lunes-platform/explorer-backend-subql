import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, X } from 'lucide-react';
import { useWatchlist } from '../../hooks/useWatchlist';
import styles from './WatchlistDropdown.module.css';

const SEEN_KEY = 'lunes-watchlist-seen-count';

export const WatchlistDropdown: React.FC = () => {
  const { accounts, tokens, contracts, removeItem, isLoaded } = useWatchlist();
  const [isOpen, setIsOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(() => {
    try { return parseInt(localStorage.getItem(SEEN_KEY) || '0', 10); } catch { return 0; }
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalCount = accounts.length + tokens.length + contracts.length;
  const hasItems = totalCount > 0;
  const newCount = Math.max(0, totalCount - seenCount);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setSeenCount(totalCount);
      localStorage.setItem(SEEN_KEY, String(totalCount));
    }
  };

  if (!isLoaded) return null;

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button className={styles.trigger} title="Watchlist" onClick={handleToggle}>
        <Star size={16} />
        {newCount > 0 && <span className={styles.badge}>{newCount}</span>}
      </button>
      {isOpen && (
        <div className={styles.menuOpen}>
          {!hasItems ? (
            <div className={styles.empty}>
              <Star size={20} opacity={0.3} />
              <p>No items in watchlist</p>
              <span>Click the star on any account, token, or contract to add it here</span>
            </div>
          ) : (
            <>
              {accounts.length > 0 && (
                <div className={styles.section}>
                  <h4>Accounts ({accounts.length})</h4>
                  {accounts.map((item) => (
                    <div key={`${item.type}-${item.id}`} className={styles.item}>
                      <Link to={`/account/${item.id}`} className={styles.link}>
                        <span className={styles.addr}>{item.id.slice(0, 8)}...{item.id.slice(-4)}</span>
                      </Link>
                      <button
                        onClick={() => removeItem(item.id, item.type)}
                        className={styles.remove}
                        title="Remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {tokens.length > 0 && (
                <div className={styles.section}>
                  <h4>Tokens ({tokens.length})</h4>
                  {tokens.map((item) => (
                    <div key={`${item.type}-${item.id}`} className={styles.item}>
                      <Link to={`/token/${item.id}`} className={styles.link}>
                        <span>{item.symbol || item.id.slice(0, 8)}</span>
                      </Link>
                      <button
                        onClick={() => removeItem(item.id, item.type)}
                        className={styles.remove}
                        title="Remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {contracts.length > 0 && (
                <div className={styles.section}>
                  <h4>Contracts ({contracts.length})</h4>
                  {contracts.map((item) => (
                    <div key={`${item.type}-${item.id}`} className={styles.item}>
                      <Link to={`/contract/${item.id}`} className={styles.link}>
                        <span className={styles.addr}>{item.id.slice(0, 8)}...{item.id.slice(-4)}</span>
                      </Link>
                      <button
                        onClick={() => removeItem(item.id, item.type)}
                        className={styles.remove}
                        title="Remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
