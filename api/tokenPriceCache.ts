// Token Price Cache Service
// Fetches USD prices for registered project tokens via CoinGecko.
//
// This is separate from the LUNES price (which comes from BitStorage).
// CoinGecko is used here to get prices for ecosystem tokens like USDT,
// stablecoins, and other project tokens that have a coingeckoId mapped.
//
// Usage: Projects registered with a `coingeckoId` field will have their
// token price fetched and cached here.

const COINGECKO_URL = 'https://api.coingecko.com/api/v3';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface TokenPrice {
  coingeckoId: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  image: string;
  lastUpdated: string;
}

interface TokenPriceCacheEntry {
  data: Map<string, TokenPrice>;
  fetchedAt: number;
}

let tokenPriceCache: TokenPriceCacheEntry | null = null;
let fetchInProgress: Promise<Map<string, TokenPrice>> | null = null;

let stats = {
  hits: 0,
  errors: 0,
  cacheHits: 0,
  totalRequests: 0,
};

async function fetchTokenPrices(coingeckoIds: string[]): Promise<Map<string, TokenPrice>> {
  const result = new Map<string, TokenPrice>();
  if (coingeckoIds.length === 0) return result;

  // Deduplicate and clean
  const ids = [...new Set(coingeckoIds.filter(id => id && id.trim()))];
  if (ids.length === 0) return result;

  try {
    const idsParam = ids.join(',');
    const res = await fetch(
      `${COINGECKO_URL}/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      console.warn(`[TokenPriceCache] CoinGecko HTTP ${res.status}`);
      stats.errors++;
      return result;
    }

    const coins = await res.json();
    if (!Array.isArray(coins)) {
      console.warn('[TokenPriceCache] CoinGecko returned non-array');
      stats.errors++;
      return result;
    }

    stats.hits++;
    const now = new Date().toISOString();

    for (const coin of coins) {
      result.set(coin.id, {
        coingeckoId: coin.id,
        symbol: (coin.symbol || '').toUpperCase(),
        name: coin.name || '',
        price: coin.current_price || 0,
        change24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume || 0,
        marketCap: coin.market_cap || 0,
        image: coin.image || '',
        lastUpdated: now,
      });
    }

    return result;
  } catch (err) {
    console.warn('[TokenPriceCache] CoinGecko fetch error:', (err as Error).message);
    stats.errors++;
    return result;
  }
}

export async function getTokenPrices(coingeckoIds: string[]): Promise<TokenPrice[]> {
  stats.totalRequests++;

  // Return cached data if still fresh
  if (tokenPriceCache && (Date.now() - tokenPriceCache.fetchedAt) < CACHE_TTL_MS) {
    stats.cacheHits++;
    // Check if all requested IDs are in cache
    const allCached = coingeckoIds.every(id => tokenPriceCache!.data.has(id));
    if (allCached) {
      return coingeckoIds
        .map(id => tokenPriceCache!.data.get(id)!)
        .filter(Boolean);
    }
  }

  // Prevent concurrent fetches
  if (fetchInProgress) {
    const data = await fetchInProgress;
    return coingeckoIds.map(id => data.get(id)!).filter(Boolean);
  }

  fetchInProgress = fetchTokenPrices(coingeckoIds)
    .then(data => {
      // Merge with existing cache
      const merged = new Map(tokenPriceCache?.data || []);
      data.forEach((v, k) => merged.set(k, v));
      tokenPriceCache = { data: merged, fetchedAt: Date.now() };

      const ids = [...data.keys()].join(', ');
      console.log(`[TokenPriceCache] Updated ${data.size} token prices: ${ids}`);
      return merged;
    })
    .finally(() => {
      fetchInProgress = null;
    });

  const data = await fetchInProgress;
  return coingeckoIds.map(id => data.get(id)!).filter(Boolean);
}

export function getTokenPriceStats() {
  return {
    ...stats,
    cachedTokens: tokenPriceCache ? tokenPriceCache.data.size : 0,
    cacheAge: tokenPriceCache ? Math.floor((Date.now() - tokenPriceCache.fetchedAt) / 1000) : null,
    cacheTtl: Math.floor(CACHE_TTL_MS / 1000),
  };
}
