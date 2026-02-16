import requests
import logging
from cachetools import TTLCache, cached
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Cache for 5 minutes (300 seconds) to avoid CoinGecko rate limits
price_cache = TTLCache(maxsize=1, ttl=300)

COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price"
COIN_ID = "lunes"
VS_CURRENCY = "usd"

# Initial fallback data in case external API fails immediately
FALLBACK_DATA = {
    "price": 0.0035,  # Approximate value, safer than 0
    "change24h": 0.0,
    "volume24h": 0.0,
    "marketCap": 0.0,
    "high24h": 0.0,
    "low24h": 0.0,
    "lastUpdated": None,
    "source": "fallback"
}

@cached(cache=price_cache)
def fetch_lunes_data() -> Dict[str, Any]:
    """
    Fetches Lunes price data from CoinGecko.
    Cached for 5 minutes.
    Returns a dictionary with normalized data structure.
    """
    try:
        # 1. Fetch Price & 24h Change
        params = {
            "ids": COIN_ID,
            "vs_currencies": VS_CURRENCY,
            "include_24hr_change": "true",
            "include_24hr_vol": "true",
            "include_market_cap": "true"
        }
        
        response = requests.get(COINGECKO_API_URL, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        if COIN_ID not in data:
            logger.warning(f"CoinID {COIN_ID} not found in CoinGecko response: {data}")
            return _get_fallback_with_timestamp()

        coin_data = data[COIN_ID]

        return {
            "price": coin_data.get(VS_CURRENCY, 0),
            "change24h": coin_data.get(f"{VS_CURRENCY}_24h_change", 0),
            "volume24h": coin_data.get(f"{VS_CURRENCY}_24h_vol", 0),
            "marketCap": coin_data.get(f"{VS_CURRENCY}_market_cap", 0),
            "high24h": 0, # Simple endpoint doesn't return high/low, would need /coins/{id} endpoint
            "low24h": 0,
            "lastUpdated": datetime.utcnow().isoformat(),
            "source": "coingecko"
        }

    except Exception as e:
        logger.error(f"Error fetching data from CoinGecko: {str(e)}")
        return _get_fallback_with_timestamp()

def _get_fallback_with_timestamp():
    data = FALLBACK_DATA.copy()
    data["lastUpdated"] = datetime.utcnow().isoformat()
    return data
