import asyncio
import logging
import uuid
from datetime import date, datetime, timedelta

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

# ── Skyscanner 내부 ID 매핑 (실 URL에서 확인된 값) ──────────────────
_SKY_AIRPORTS: dict[str, str] = {
    "ICN": "12409",
    "KIX": "13068",
    # 미확인 공항은 추가 시 입력
}

_SKY_CARRIERS: dict[str, str] = {
    "7C": "32179",   # 제주항공 ✅
    "OZ": "32558",   # 아시아나항공 ✅
    "NH": "32571",   # ANA ✅
    # 미확인 항공사는 추가 시 입력
}


def _sky_fmt(dt: datetime) -> str:
    """datetime → Skyscanner 시각 포맷 (YYMMDDHHmm)"""
    return dt.strftime("%y%m%d%H%M")


def _skyscanner_config_url(offer: "NormalizedOffer", passengers: int) -> str | None:
    """Skyscanner /config/ 직항편 URL. 매핑 없는 항공사/공항이면 None 반환."""
    carrier_id = _SKY_CARRIERS.get(offer.carrier_iata)
    origin_id  = _SKY_AIRPORTS.get(offer.departure_iata)
    dest_id    = _SKY_AIRPORTS.get(offer.arrival_iata)
    if not all([carrier_id, origin_id, dest_id]):
        return None

    dep_date = offer.departure_at.strftime("%y%m%d")   # 260617
    leg_out = (
        f"{origin_id}-{_sky_fmt(offer.departure_at)}"
        f"--{carrier_id}-{offer.stops}-{dest_id}"
        f"-{_sky_fmt(offer.arrival_at)}"
    )

    if offer.return_at and offer.return_arrival_at:
        ret_date = offer.return_at.strftime("%y%m%d")   # 260626
        leg_ret = (
            f"{dest_id}-{_sky_fmt(offer.return_at)}"
            f"--{carrier_id}-0-{origin_id}"
            f"-{_sky_fmt(offer.return_arrival_at)}"
        )
        itinerary = f"{leg_out}%7C{leg_ret}"  # %7C = URL-encoded |
        return (
            f"https://www.skyscanner.co.kr/transport/flights"
            f"/{offer.departure_iata.lower()}/{offer.arrival_iata.lower()}"
            f"/{dep_date}/{ret_date}/config/{itinerary}"
            f"?adults={passengers}&cabinclass=economy&airlines=-{carrier_id}"
        )
    else:
        return (
            f"https://www.skyscanner.co.kr/transport/flights"
            f"/{offer.departure_iata.lower()}/{offer.arrival_iata.lower()}"
            f"/{dep_date}/config/{leg_out}"
            f"?adults={passengers}&cabinclass=economy&airlines=-{carrier_id}"
        )


def _deep_link(offer: "NormalizedOffer", passengers: int = 1) -> str:
    origin      = offer.departure_iata
    destination = offer.arrival_iata
    dep_date    = offer.departure_at.strftime("%Y-%m-%d")
    ret_date    = offer.return_at.strftime("%Y-%m-%d") if offer.return_at else None
    dep_sky     = offer.departure_at.strftime("%y%m%d")
    ret_sky     = offer.return_at.strftime("%y%m%d") if offer.return_at else None
    is_rt       = ret_date is not None

    def skyscanner_search() -> str:
        base = (
            f"https://www.skyscanner.co.kr/transport/flights"
            f"/{origin.lower()}/{destination.lower()}/{dep_sky}"
        )
        if ret_sky:
            base += f"/{ret_sky}"
        return base + f"/?adults={passengers}&cabinclass=economy"

    # 1) Korean Air: 자체 URL 파라미터 지원 확인됨
    if offer.carrier_iata == "KE":
        return (
            f"https://www.koreanair.com/booking/select-flights"
            f"?lang=ko&cabin=Y&adults={passengers}"
            f"&origin={origin}&destination={destination}&departDate={dep_date}"
            + (f"&returnDate={ret_date}&tripType=RT" if is_rt else "&tripType=OW")
        )

    # 2) 매핑된 항공사: Skyscanner 특정 항공편 URL
    config_url = _skyscanner_config_url(offer, passengers)
    if config_url:
        return config_url

    # 3) 매핑 없는 항공사: Skyscanner 일반 검색
    return skyscanner_search()


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
            deep_link_url=_deep_link(body.offer),
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
                deep_link_url=_deep_link(body.combo_inbound),
                combo_group_id=combo_group_id,
            )
        )

    await db.commit()
    return BookResponse(bookings=result_bookings)
