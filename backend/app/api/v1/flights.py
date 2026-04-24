import asyncio
import logging
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
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

def _deep_link(carrier_iata: str, origin: str, destination: str, departure_date: str, passengers: int = 1) -> str:
    d = departure_date.replace("-", "")  # "2026-06-07" → "20260607"
    routes = {
        # ── 대형 항공사 ───────────────────────────────────────────────
        "KE": (
            f"https://www.koreanair.com/booking/select-flights"
            f"?lang=ko&cabin=Y&adults={passengers}&origin={origin}&destination={destination}&departDate={departure_date}"
        ),
        "OZ": (
            f"https://flyasiana.com/C/KR/KO/booking/flightList"
            f"?tripType=OW&originAirport={origin}&destinationAirport={destination}"
            f"&departureDate={d}&adultCount={passengers}&childCount=0&infantCount=0"
        ),
        "JL": (
            f"https://www.jal.co.jp/inter/search/"
            f"?lang=kr&type=ow&dep={origin}&arr={destination}&date={departure_date}&adult={passengers}"
        ),
        "NH": (
            f"https://www.ana.co.jp/en/kr/book-plan/flight/search/"
            f"?tripType=OW&dep={origin}&arr={destination}&departure={departure_date}&adult={passengers}"
        ),
        # ── 한국 LCC ─────────────────────────────────────────────────
        "7C": (
            f"https://www.jejuair.net/kr/ko/booking/search"
            f"?depAirportCode={origin}&arrAirportCode={destination}&depDate={d}&adtCnt={passengers}&tripType=OW"
        ),
        "LJ": (
            f"https://www.jinair.com/booking/availability"
            f"?depPort={origin}&arrPort={destination}&depDate={d}&paxAdult={passengers}&tripType=OW"
        ),
        "TW": (
            f"https://www.twayair.com/app/booking/availability"
            f"?dep={origin}&arr={destination}&depDate={d}&adult={passengers}&tripType=OW"
        ),
        "BX": (
            f"https://www.airbusan.com/part/booking/main"
            f"?depAirport={origin}&arrAirport={destination}&depDate={d}&adultCount={passengers}&tripType=OW"
        ),
        "RS": f"https://www.airseoul.com",
        "ZE": f"https://www.eastarjet.com",
        # ── 일본 LCC ─────────────────────────────────────────────────
        "MM": (
            f"https://booking.flypeach.com/kr"
            f"?origin={origin}&destination={destination}&departure={departure_date}&adults={passengers}&tripType=OW"
        ),
        "GK": (
            f"https://www.jetstar.com/kr/ko/flights"
            f"?from={origin}&to={destination}&date={departure_date}&adults={passengers}"
        ),
        "IJ": f"https://www.springjapan.com/kr",
        "NQ": f"https://www.airjapan.com",
    }
    return routes.get(
        carrier_iata,
        f"https://www.google.com/flights?q={origin}+{destination}+{departure_date}"
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
            req.origin, req.destination, req.departure_date, req.return_date, req.adults
        )
        oneway_task = duffel.search_oneway_pair(
            req.origin, req.destination, req.departure_date, req.return_date, req.adults
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


class FlexibleSearchRequest(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    from_date: date
    to_date: date
    passengers: int = Field(default=1, ge=1, le=9)
    cabin_class: str = "economy"


class DayPrice(BaseModel):
    date: str
    min_krw: int | None


class FlexibleSearchResponse(BaseModel):
    prices: list[DayPrice]
    top3: list[DayPrice]


_FLEXIBLE_CACHE_TTL = 3600  # 1h


@router.post("/search/flexible", response_model=FlexibleSearchResponse)
async def search_flexible(req: FlexibleSearchRequest) -> FlexibleSearchResponse:
    if req.to_date < req.from_date:
        raise HTTPException(status_code=422, detail="to_date must be after from_date")

    days = (req.to_date - req.from_date).days + 1
    if days > 31:
        raise HTTPException(status_code=422, detail="Range must be 31 days or less")

    today = date.today()
    all_dates = [req.from_date + timedelta(days=i) for i in range(days)]
    # 오늘 이전 날짜는 Duffel에서 결과가 없으므로 스킵
    future_dates = [d for d in all_dates if d >= today]

    async def _fetch_day(d: date) -> DayPrice:
        key = f"zivo:flex:{req.origin}:{req.destination}:{d.isoformat()}"
        cached = await cache.get_search_cache(key)
        if cached:
            return DayPrice(**cached)
        try:
            offers = await duffel.search_oneway(req.origin, req.destination, d.isoformat())
            min_krw = min(o.total_krw for o in offers) if offers else None
        except Exception:
            min_krw = None
        dp = DayPrice(date=d.isoformat(), min_krw=min_krw)
        if min_krw:
            await cache.set_search_cache(key, dp.model_dump())
            from app.services.cache import _get_redis
            await _get_redis().expire(key, _FLEXIBLE_CACHE_TTL)
        return dp

    # Rate limit 배려: 3개씩 순차 병렬 처리
    sem = asyncio.Semaphore(3)

    async def _guarded(d: date) -> DayPrice:
        async with sem:
            return await _fetch_day(d)

    # 과거 날짜는 None으로 채우고, 미래 날짜만 Duffel 검색
    past_prices = [DayPrice(date=d.isoformat(), min_krw=None) for d in all_dates if d < today]
    future_prices = list(await asyncio.gather(*[_guarded(d) for d in future_dates]))
    price_list = past_prices + future_prices

    top3 = sorted(
        [p for p in price_list if p.min_krw is not None],
        key=lambda p: p.min_krw,  # type: ignore[return-value]
    )[:3]

    return FlexibleSearchResponse(prices=price_list, top3=top3)


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
            deep_link_url=_deep_link(
                body.offer.carrier_iata,
                body.offer.departure_iata,
                body.offer.arrival_iata,
                body.offer.departure_at.strftime("%Y-%m-%d"),
            ),
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
                deep_link_url=_deep_link(
                    body.combo_inbound.carrier_iata,
                    body.combo_inbound.departure_iata,
                    body.combo_inbound.arrival_iata,
                    body.combo_inbound.departure_at.strftime("%Y-%m-%d"),
                ),
                combo_group_id=combo_group_id,
            )
        )

    await db.commit()
    return BookResponse(bookings=result_bookings)
