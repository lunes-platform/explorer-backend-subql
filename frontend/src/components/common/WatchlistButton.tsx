import React from 'react';
import { Star } from 'lucide-react';
import styles from './WatchlistButton.module.css';

interface WatchlistButtonProps {
  isWatched: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export const WatchlistButton: React.FC<WatchlistButtonProps> = ({ 
  isWatched, 
  onToggle,
  size = 'md'
}) => {
  return (
    <button
      onClick={onToggle}
      className={`${styles.button} ${isWatched ? styles.active : ''} ${styles[size]}`}
      title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Star size={size === 'sm' ? 14 : 18} fill={isWatched ? 'currentColor' : 'none'} />
      <span>{isWatched ? 'Watched' : 'Watch'}</span>
    </button>
  );
};
