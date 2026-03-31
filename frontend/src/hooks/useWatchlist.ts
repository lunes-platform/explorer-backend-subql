import React, { useState, useEffect, useCallback, useContext, createContext, useMemo } from 'react';

export type WatchlistItemType = 'account' | 'token' | 'contract' | 'nft' | 'block';

export type WatchlistItem = {
  id: string;
  type: WatchlistItemType;
  name?: string;
  symbol?: string;
  addedAt: number;
};

const STORAGE_KEY = 'lunes-explorer-watchlist';

interface WatchlistContextValue {
  items: WatchlistItem[];
  isLoaded: boolean;
  addItem: (item: Omit<WatchlistItem, 'addedAt'>) => void;
  removeItem: (id: string, type: WatchlistItemType) => void;
  isWatched: (id: string, type: WatchlistItemType) => boolean;
  toggleItem: (item: Omit<WatchlistItem, 'addedAt'>) => void;
  getItemsByType: (type: WatchlistItemType) => WatchlistItem[];
  accounts: WatchlistItem[];
  tokens: WatchlistItem[];
  contracts: WatchlistItem[];
  nfts: WatchlistItem[];
  blocks: WatchlistItem[];
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = useCallback((item: Omit<WatchlistItem, 'addedAt'>) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id && i.type === item.type)) {
        return prev;
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const removeItem = useCallback((id: string, type: WatchlistItemType) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.type === type)));
  }, []);

  const isWatched = useCallback(
    (id: string, type: WatchlistItemType) => {
      return items.some((i) => i.id === id && i.type === type);
    },
    [items]
  );

  const toggleItem = useCallback(
    (item: Omit<WatchlistItem, 'addedAt'>) => {
      if (isWatched(item.id, item.type)) {
        removeItem(item.id, item.type);
      } else {
        addItem(item);
      }
    },
    [isWatched, removeItem, addItem]
  );

  const getItemsByType = useCallback(
    (type: WatchlistItemType) => {
      return items.filter((i) => i.type === type).sort((a, b) => b.addedAt - a.addedAt);
    },
    [items]
  );

  const value = useMemo(() => ({
    items,
    isLoaded,
    addItem,
    removeItem,
    isWatched,
    toggleItem,
    getItemsByType,
    accounts: getItemsByType('account'),
    tokens: getItemsByType('token'),
    contracts: getItemsByType('contract'),
    nfts: getItemsByType('nft'),
    blocks: getItemsByType('block'),
  }), [items, isLoaded, addItem, removeItem, isWatched, toggleItem, getItemsByType]);

  return React.createElement(WatchlistContext.Provider, { value }, children);
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return ctx;
}
