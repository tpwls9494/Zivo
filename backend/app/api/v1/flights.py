import asyncio

from fastapi import APIRouter, HTTPException

from app.schemas.flight import SearchRequest, SearchResponse
from app.services import cache, duffel
from app.services.combo import build_combos

router = APIRouter()

_SUPPORTED_KR = frozenset({"ICN", "GMP"})
_SUPPORTED_JP = frozenset({"KIX", "NRT", "HND", "FUK", "CTS", "KMI"})
_ALLOWED_PAIRS = frozenset(
    {(kr, jp) for kr in _SUPPORTED_KR for jp in _SUPPORTED_JP}
    | {(jp, kr) for jp in _SUPPORTED_JP for kr in _SUPPORTED_KR}
)


@router.post("/search", response_model=SearchResponse)
async def search_flights(req: SearchRequest) -> SearchResponse:
    if (req.origin, req.destination) not in _ALLOWED_PAIRS:
        raise HTTPException(status_code=422, detail="Unsupported route for Phase 1")
    if not req.return_date:
        raise HTTPException(status_code=422, detail="return_date required for Phase 1")

    cache_key = cache.make_search_key(req.origin, req.destination, req.departure_date, req.return_date)
    cached_data = await cache.get_search_cache(cache_key)
    if cached_data:
        return SearchResponse.model_validate({**cached_data, "cached": True})

    try:
        roundtrip_task = duffel.search_roundtrip(
            req.origin, req.destination, req.departure_date, req.return_date
        )
        oneway_task = duffel.search_oneway_pair(
            req.origin, req.destination, req.departure_date, req.return_date
        )
        roundtrip_offers, (outbound_offers, inbound_offers) = await asyncio.gather(
            roundtrip_task, oneway_task
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Duffel API error: {exc}") from exc

    baseline_krw = roundtrip_offers[0].total_krw if roundtrip_offers else None
    combos = build_combos(outbound_offers, inbound_offers, baseline_krw)

    response = SearchResponse(
        offers=roundtrip_offers,
        combos=combos,
        baseline_roundtrip_krw=baseline_krw,
        cached=False,
    )
    await cache.set_search_cache(cache_key, response.model_dump(mode="json"))
    return response


@router.post("/search/flexible")
async def search_flexible() -> dict:
    """Day 7+ 에서 구현."""
    return {"top": []}


@router.post("/book")
async def book() -> dict:
    """Day 5 에서 구현."""
    return {"redirect_url": ""}
