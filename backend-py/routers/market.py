from fastapi import APIRouter, HTTPException
from services.market_data import fetch_lunes_data

router = APIRouter(
    prefix="/prices",
    tags=["market"]
)

@router.get("")
async def get_lunes_price():
    """
    Get current Lunes price data.
    Data is cached for 5 minutes to prevent rate limiting.
    """
    data = fetch_lunes_data()
    if not data:
        raise HTTPException(status_code=503, detail="Market data unavailable")
    return data
