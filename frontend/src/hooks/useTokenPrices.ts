import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export interface TokenPriceInfo {
  projectSlug: string;
  projectName: string;
  ticker: string;
  coingeckoId: string;
  assetIds: string[];
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  image: string;
  lastUpdated: string | null;
}

export interface UseTokenPricesResult {
  tokens: TokenPriceInfo[];
  loading: boolean;
  error: string | null;
  getByAssetId: (assetId: string) => TokenPriceInfo | undefined;
  getByTicker: (ticker: string) => TokenPriceInfo | undefined;
  getByCoingeckoId: (id: string) => TokenPriceInfo | undefined;
}

export function useTokenPrices(): UseTokenPricesResult {
  const [tokens, setTokens] = useState<TokenPriceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/prices/tokens`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.tokens)) {
          setTokens(data.tokens);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error fetching token prices:', err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const getByAssetId = (assetId: string) =>
    tokens.find(t => t.assetIds.includes(assetId));

  const getByTicker = (ticker: string) =>
    tokens.find(t => t.ticker.toUpperCase() === ticker.toUpperCase());

  const getByCoingeckoId = (id: string) =>
    tokens.find(t => t.coingeckoId === id);

  return { tokens, loading, error, getByAssetId, getByTicker, getByCoingeckoId };
}
