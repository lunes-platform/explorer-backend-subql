from fastapi import APIRouter, HTTPException
from services.market_data import fetch_lunes_data, fetch_recent_trades, get_price_stats

router = APIRouter(
    prefix="/prices",
    tags=["market"]
)

@router.get("")
async def get_lunes_price():
    """
    Get current Lunes price data.
    Primary source: BitStorage (official LUNES exchange).
    Fallback: CoinGecko (for market cap enrichment).
    Data is cached for 5 minutes.
    """
    data = fetch_lunes_data()
    if not data:
        raise HTTPException(status_code=503, detail="Market data unavailable")
    return data

@router.get("/trades")
async def get_recent_trades():
    """
    Get recent LUNES/USDT trades from BitStorage.
    Cached for 60 seconds.
    """
    trades = fetch_recent_trades()
    return {"trades": trades, "pair": "LUNESUSDT", "source": "bitstorage"}

@router.get("/stats")
async def get_market_stats():
    """
    Get price service monitoring stats (cache hits, errors, sources).
    """
    return get_price_stats()
