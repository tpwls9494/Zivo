from fastapi import APIRouter

router = APIRouter()


@router.post("/search")
async def search_flights() -> dict:
    """Day 3 에서 Duffel 연동. 지금은 스켈레톤."""
    return {"offers": [], "combos": [], "baseline_roundtrip_krw": None}


@router.post("/search/flexible")
async def search_flexible() -> dict:
    """Day 7+ 에서 구현."""
    return {"top": []}


@router.post("/book")
async def book() -> dict:
    """Day 5 에서 구현."""
    return {"redirect_url": ""}
