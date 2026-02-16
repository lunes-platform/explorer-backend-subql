// Price Cache Service
// Fetches prices from CoinGecko (primary) + BitStorage (fallback)
// with an in-memory buffer to avoid exceeding free API rate limits.
//
// CoinGecko free tier: ~10-30 req/min. We fetch once every 5 minutes.
// The cache serves all frontend requests from memory.

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const COINGECKO_URL = 'https://api.coingecko.com/api/v3';
const BITSTORAGE_URL = 'https://api.bitstorage.finance/v1/public/ticker';

export interface PriceData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  source: 'coingecko' | 'bitstorage' | 'cache';
  lastUpdated: string;
  nextUpdate: string;
  cacheHit: boolean;
}

interface CacheEntry {
  data: PriceData;
  fetchedAt: number;
}

// In-memory cache
let priceCache: CacheEntry | null = null;
let fetchInProgress: Promise<PriceData> | null = null;

// Stats for monitoring
let stats = {
  coingeckoHits: 0,
  coingeckoErrors: 0,
  bitstorageHits: 0,
  bitstorageErrors: 0,
  cacheHits: 0,
  totalRequests: 0,
};

async function fetchFromCoinGecko(): Promise<PriceData | null> {
  try {
    const res = await fetch(
      `${COINGECKO_URL}/simple/price?ids=lunes&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.warn(`[PriceCache] CoinGecko HTTP ${res.status}`);
      stats.coingeckoErrors++;
      return null;
    }

    const json = await res.json();
    if (!json?.lunes) {
      console.warn('[PriceCache] CoinGecko returned no lunes data');
      stats.coingeckoErrors++;
      return null;
    }

    const d = json.lunes;
    stats.coingeckoHits++;
    const now = new Date();

    return {
      price: d.usd || 0,
      change24h: d.usd_24h_change || 0,
      volume24h: d.usd_24h_vol || 0,
      marketCap: d.usd_market_cap || 0,
      high24h: 0, // CoinGecko simple endpoint doesn't include high/low
      low24h: 0,
      source: 'coingecko',
      lastUpdated: now.toISOString(),
      nextUpdate: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
      cacheHit: false,
    };
  } catch (err) {
    console.warn('[PriceCache] CoinGecko fetch error:', (err as Error).message);
    stats.coingeckoErrors++;
    return null;
  }
}

async function fetchFromBitStorage(): Promise<PriceData | null> {
  try {
    const res = await fetch(
      `${BITSTORAGE_URL}?pair=LUNESUSDT`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.warn(`[PriceCache] BitStorage HTTP ${res.status}`);
      stats.bitstorageErrors++;
      return null;
    }

    const json = await res.json();
    if (!json?.status || !json?.data) {
      console.warn('[PriceCache] BitStorage returned invalid data');
      stats.bitstorageErrors++;
      return null;
    }

    const d = json.data;
    stats.bitstorageHits++;
    const now = new Date();

    return {
      price: parseFloat(d.last) || 0,
      change24h: parseFloat(d.percent_сhange) || 0, // Note: UTF-8 'с' from API
      volume24h: parseFloat(d.volume_24H) || 0,
      marketCap: 0, // BitStorage doesn't provide market cap
      high24h: parseFloat(d.high) || 0,
      low24h: parseFloat(d.low) || 0,
      source: 'bitstorage',
      lastUpdated: now.toISOString(),
      nextUpdate: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
      cacheHit: false,
    };
  } catch (err) {
    console.warn('[PriceCache] BitStorage fetch error:', (err as Error).message);
    stats.bitstorageErrors++;
    return null;
  }
}

async function fetchFreshPrice(): Promise<PriceData> {
  // Try CoinGecko first (has market cap)
  const cgData = await fetchFromCoinGecko();
  if (cgData && cgData.price > 0) {
    // Enrich with BitStorage high/low if available
    const bsData = await fetchFromBitStorage().catch(() => null);
    if (bsData) {
      cgData.high24h = bsData.high24h;
      cgData.low24h = bsData.low24h;
      // If CoinGecko change24h is null, use BitStorage
      if (!cgData.change24h && bsData.change24h) {
        cgData.change24h = bsData.change24h;
      }
    }
    return cgData;
  }

  // Fallback to BitStorage
  const bsData = await fetchFromBitStorage();
  if (bsData && bsData.price > 0) {
    return bsData;
  }

  // Both failed — return stale cache if available, or zeros
  if (priceCache) {
    console.warn('[PriceCache] Both sources failed, returning stale cache');
    return { ...priceCache.data, cacheHit: true, source: 'cache' };
  }

  const now = new Date();
  return {
    price: 0,
    change24h: 0,
    volume24h: 0,
    marketCap: 0,
    high24h: 0,
    low24h: 0,
    source: 'cache',
    lastUpdated: now.toISOString(),
    nextUpdate: new Date(now.getTime() + 60000).toISOString(), // Retry in 1 min
    cacheHit: false,
  };
}

export async function getPrice(): Promise<PriceData> {
  stats.totalRequests++;

  // Return cached data if still fresh
  if (priceCache && (Date.now() - priceCache.fetchedAt) < CACHE_TTL_MS) {
    stats.cacheHits++;
    return { ...priceCache.data, cacheHit: true };
  }

  // Prevent concurrent fetches (dedup)
  if (fetchInProgress) {
    return fetchInProgress;
  }

  fetchInProgress = fetchFreshPrice()
    .then(data => {
      priceCache = { data, fetchedAt: Date.now() };
      console.log(`[PriceCache] Updated from ${data.source}: $${data.price.toFixed(6)} (${data.change24h?.toFixed(2) || 0}%)`);
      return data;
    })
    .finally(() => {
      fetchInProgress = null;
    });

  return fetchInProgress;
}

export function getPriceStats() {
  return {
    ...stats,
    cacheAge: priceCache ? Math.floor((Date.now() - priceCache.fetchedAt) / 1000) : null,
    cacheTtl: Math.floor(CACHE_TTL_MS / 1000),
    lastSource: priceCache?.data.source || null,
  };
}

// Pre-warm cache on startup
setTimeout(() => {
  getPrice().then(d => {
    console.log(`[PriceCache] Startup cache warmed: $${d.price.toFixed(6)} from ${d.source}`);
  });
}, 2000);

// Background refresh every 5 minutes
setInterval(() => {
  getPrice().catch(err => console.error('[PriceCache] Background refresh error:', err));
}, CACHE_TTL_MS);
