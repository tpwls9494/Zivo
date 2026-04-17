import asyncio
import logging
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.booking import Booking
from app.schemas.booking import BookingDetail, BookRequest, BookResponse
from app.schemas.flight import NormalizedOffer, SearchRequest, SearchResponse
from app.services import cache, duffel
from app.services.combo import build_combos
from app.services.user import get_or_create_user

logger = logging.getLogger(__name__)

_PRICE_TOLERANCE = 0.02  # 2%

router = APIRouter()

_SUPPORTED_KR = frozenset({"ICN", "GMP"})
_SUPPORTED_JP = frozenset({"KIX", "NRT", "HND", "FUK", "CTS", "KMI"})
_ALLOWED_PAIRS = frozenset(
    {(kr, jp) for kr in _SUPPORTED_KR for jp in _SUPPORTED_JP}
    | {(jp, kr) for jp in _SUPPORTED_JP for kr in _SUPPORTED_KR}
)

_CARRIER_BOOKING_URLS: dict[str, str] = {
    "KE": "https://www.koreanair.com/booking/select-flights",
    "OZ": "https://flyasiana.com/C/KR/KO/booking/flightList",
    "7C": "https://www.jejuair.net/jejuair/KR/KO/booking/ticket/reservation.do",
    "BX": "https://www.airbusan.com/f/booking/flight-search",
    "LJ": "https://www.jinair.com/booking/flight/domestic",
    "TW": "https://www.twayair.com/app/booking",
    "NH": "https://www.ana.co.jp/en/kr/",
    "JL": "https://www.jal.co.jp/kr/ko/",
    "MM": "https://www.flypeach.com/kr/ko",
    "3K": "https://www.jetstar.com/kr/ko",
}


def _deep_link(carrier_iata: str) -> str:
    return _CARRIER_BOOKING_URLS.get(carrier_iata, "https://www.google.com/flights")


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


async def _revalidate_price(offer: NormalizedOffer) -> None:
    """Fetch the live price from Duffel and raise 409 if it changed more than 2%."""
    try:
        live_krw = await duffel.get_offer_price(offer.offer_id)
    except Exception as exc:
        logger.warning("price revalidation failed for %s: %s", offer.offer_id, exc)
        return
    if live_krw is None:
        return
    delta = abs(live_krw - offer.total_krw) / max(offer.total_krw, 1)
    if delta > _PRICE_TOLERANCE:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "PRICE_CHANGED",
                "offer_id": offer.offer_id,
                "cached_krw": offer.total_krw,
                "live_krw": live_krw,
            },
        )


@router.post("/book", response_model=BookResponse)
async def book_flight(
    body: BookRequest,
    x_device_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> BookResponse:
    if settings.DUFFEL_API_KEY:
        await _revalidate_price(body.offer)
        if body.combo_inbound is not None:
            await _revalidate_price(body.combo_inbound)

    user = await get_or_create_user(db, x_device_id)

    is_combo = body.combo_inbound is not None
    combo_group_id = body.combo_group_id or (uuid.uuid4() if is_combo else None)
    direction = "outbound" if is_combo else body.direction

    outbound_id = uuid.uuid4()
    outbound_booking = Booking(
        id=outbound_id,
        user_id=user.id,
        combo_group_id=combo_group_id,
        direction=direction,
        carrier_iata=body.offer.carrier_iata,
        origin=body.offer.departure_iata,
        destination=body.offer.arrival_iata,
        departure_at=body.offer.departure_at,
        arrival_at=body.offer.arrival_at,
        total_krw=body.offer.total_krw,
        offer_snapshot=body.offer.model_dump(mode="json"),
        status="redirected",
    )
    db.add(outbound_booking)

    result_bookings: list[BookingDetail] = [
        BookingDetail(
            booking_id=outbound_id,
            direction=direction,
            deep_link_url=_deep_link(body.offer.carrier_iata),
            combo_group_id=combo_group_id,
        )
    ]

    if is_combo and body.combo_inbound is not None:
        inbound_id = uuid.uuid4()
        inbound_booking = Booking(
            id=inbound_id,
            user_id=user.id,
            combo_group_id=combo_group_id,
            direction="inbound",
            carrier_iata=body.combo_inbound.carrier_iata,
            origin=body.combo_inbound.departure_iata,
            destination=body.combo_inbound.arrival_iata,
            departure_at=body.combo_inbound.departure_at,
            arrival_at=body.combo_inbound.arrival_at,
            total_krw=body.combo_inbound.total_krw,
            offer_snapshot=body.combo_inbound.model_dump(mode="json"),
            status="redirected",
        )
        db.add(inbound_booking)
        result_bookings.append(
            BookingDetail(
                booking_id=inbound_id,
                direction="inbound",
                deep_link_url=_deep_link(body.combo_inbound.carrier_iata),
                combo_group_id=combo_group_id,
            )
        )

    await db.commit()
    return BookResponse(bookings=result_bookings)
