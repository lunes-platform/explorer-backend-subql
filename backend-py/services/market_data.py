import requests
import logging
from cachetools import TTLCache, cached
from datetime import datetime
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# Cache for 5 minutes (300 seconds) to avoid API rate limits
price_cache = TTLCache(maxsize=1, ttl=300)
trades_cache = TTLCache(maxsize=1, ttl=60)

# ─── BitStorage (primary source — official LUNES exchange) ───
BITSTORAGE_TICKER_URL = "https://api.bitstorage.finance/v1/public/ticker"
BITSTORAGE_TRADES_URL = "https://api.bitstorage.finance/v1/public/trades"
BITSTORAGE_PAIR = "LUNESUSDT"

# ─── CoinGecko (fallback for market cap enrichment) ───
COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price"
COIN_ID = "lunes"
VS_CURRENCY = "usd"

# Fallback data when all external APIs fail
FALLBACK_DATA = {
    "price": 0.0,
    "change24h": 0.0,
    "volume24h": 0.0,
    "marketCap": 0.0,
    "high24h": 0.0,
    "low24h": 0.0,
    "lastUpdated": None,
    "source": "fallback"
}

# Stats for monitoring
_stats = {
    "bitstorage_hits": 0,
    "bitstorage_errors": 0,
    "coingecko_hits": 0,
    "coingecko_errors": 0,
    "cache_hits": 0,
    "total_requests": 0,
}


def _fetch_from_bitstorage() -> Optional[Dict[str, Any]]:
    """
    Fetch LUNES/USDT ticker from BitStorage (primary source).
    Returns normalized price data or None on failure.
    
    BitStorage ticker response format:
    {
      "status": true,
      "data": {
        "id": 2081, "pair": "LUNESUSDT",
        "last": "0.00049900", "open": 0, "close": 0,
        "high": "0.00049900", "low": "0.00049900",
        "volume_24H": 0, "min_trade": "50",
        "percent_сhange": 0   # Note: Cyrillic 'с' in API response
      }
    }
    """
    try:
        response = requests.get(
            BITSTORAGE_TICKER_URL,
            params={"pair": BITSTORAGE_PAIR},
            timeout=10,
        )
        response.raise_for_status()
        json_data = response.json()

        if not json_data.get("status") or not json_data.get("data"):
            logger.warning(f"[BitStorage] Invalid response: {json_data}")
            _stats["bitstorage_errors"] += 1
            return None

        d = json_data["data"]
        _stats["bitstorage_hits"] += 1

        # Note: BitStorage uses Cyrillic 'с' (U+0441) in "percent_сhange"
        return {
            "price": float(d.get("last", 0) or 0),
            "change24h": float(d.get("percent_\u0441hange", 0) or 0),
            "volume24h": float(d.get("volume_24H", 0) or 0),
            "marketCap": 0,  # BitStorage doesn't provide market cap
            "high24h": float(d.get("high", 0) or 0),
            "low24h": float(d.get("low", 0) or 0),
            "lastUpdated": datetime.utcnow().isoformat(),
            "source": "bitstorage",
        }
    except Exception as e:
        logger.error(f"[BitStorage] Fetch error: {e}")
        _stats["bitstorage_errors"] += 1
        return None


def _fetch_from_coingecko() -> Optional[Dict[str, Any]]:
    """
    Fetch LUNES price from CoinGecko (fallback).
    Used to enrich BitStorage data with market cap, or as full fallback.
    """
    try:
        params = {
            "ids": COIN_ID,
            "vs_currencies": VS_CURRENCY,
            "include_24hr_change": "true",
            "include_24hr_vol": "true",
            "include_market_cap": "true",
        }
        response = requests.get(COINGECKO_API_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if COIN_ID not in data:
            logger.warning(f"[CoinGecko] {COIN_ID} not found in response")
            _stats["coingecko_errors"] += 1
            return None

        coin = data[COIN_ID]
        _stats["coingecko_hits"] += 1

        return {
            "price": coin.get(VS_CURRENCY, 0) or 0,
            "change24h": coin.get(f"{VS_CURRENCY}_24h_change", 0) or 0,
            "volume24h": coin.get(f"{VS_CURRENCY}_24h_vol", 0) or 0,
            "marketCap": coin.get(f"{VS_CURRENCY}_market_cap", 0) or 0,
            "high24h": 0,
            "low24h": 0,
            "lastUpdated": datetime.utcnow().isoformat(),
            "source": "coingecko",
        }
    except Exception as e:
        logger.error(f"[CoinGecko] Fetch error: {e}")
        _stats["coingecko_errors"] += 1
        return None


@cached(cache=price_cache)
def fetch_lunes_data() -> Dict[str, Any]:
    """
    Fetches Lunes price data.
    Strategy: BitStorage (primary) → CoinGecko (fallback) → static fallback.
    Cached for 5 minutes.
    """
    _stats["total_requests"] += 1

    # 1. Try BitStorage first (official LUNES exchange)
    bs_data = _fetch_from_bitstorage()
    if bs_data and bs_data["price"] > 0:
        # Enrich with CoinGecko market cap if available
        try:
            cg_data = _fetch_from_coingecko()
            if cg_data and cg_data.get("marketCap"):
                bs_data["marketCap"] = cg_data["marketCap"]
        except Exception:
            pass  # Market cap enrichment is optional
        return bs_data

    # 2. Fallback to CoinGecko
    cg_data = _fetch_from_coingecko()
    if cg_data and cg_data["price"] > 0:
        return cg_data

    # 3. Both failed — return zeros
    logger.warning("[Market] Both BitStorage and CoinGecko failed")
    return _get_fallback_with_timestamp()


@cached(cache=trades_cache)
def fetch_recent_trades() -> List[Dict[str, Any]]:
    """
    Fetch recent LUNES/USDT trades from BitStorage.
    Cached for 60 seconds.
    
    BitStorage trades response format:
    {
      "status": true,
      "data": [
        {"volume": 4430.63, "rate": 0.000499, "price": 2.21, "timestamp": 1771700089, "type": "SELL"}
      ]
    }
    """
    try:
        response = requests.get(
            BITSTORAGE_TRADES_URL,
            params={"pair": BITSTORAGE_PAIR},
            timeout=10,
        )
        response.raise_for_status()
        json_data = response.json()

        if not json_data.get("status") or not json_data.get("data"):
            return []

        trades = []
        for t in json_data["data"]:
            trades.append({
                "volume": float(t.get("volume", 0)),
                "rate": float(t.get("rate", 0)),
                "total": float(t.get("price", 0)),
                "timestamp": t.get("timestamp"),
                "type": t.get("type", "").upper(),
            })
        return trades
    except Exception as e:
        logger.error(f"[BitStorage] Trades fetch error: {e}")
        return []


def get_price_stats() -> Dict[str, Any]:
    """Return monitoring stats for the price service."""
    return {
        **_stats,
        "cache_ttl_seconds": 300,
        "primary_source": "bitstorage",
        "fallback_source": "coingecko",
        "pair": BITSTORAGE_PAIR,
    }


def _get_fallback_with_timestamp() -> Dict[str, Any]:
    data = FALLBACK_DATA.copy()
    data["lastUpdated"] = datetime.utcnow().isoformat()
    return data
