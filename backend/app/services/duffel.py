import asyncio
import logging
import re
from datetime import datetime

import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.schemas.flight import NormalizedOffer

logger = logging.getLogger(__name__)

DUFFEL_BASE = "https://api.duffel.com"

SUPPORTED_KR = frozenset({"ICN", "GMP"})
SUPPORTED_JP = frozenset({"KIX", "NRT", "HND", "FUK", "CTS", "KMI"})


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.DUFFEL_API_KEY}",
        "Duffel-Version": "v2",
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip",
    }


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.TransportError):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500 or exc.response.status_code == 429
    return False


def _parse_duration_minutes(duration: str) -> int:
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?", duration)
    if not m:
        return 0
    return int(m.group(1) or 0) * 60 + int(m.group(2) or 0)


_retry = retry(
    retry=retry_if_exception(_is_retryable),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
    reraise=True,
)


@_retry
async def _create_offer_request(
    client: httpx.AsyncClient,
    origin: str,
    dest: str,
    depart: str,
    ret: str | None,
    adults: int = 1,
) -> str:
    slices: list[dict] = [{"origin": origin, "destination": dest, "departure_date": depart}]
    if ret:
        slices.append({"origin": dest, "destination": origin, "departure_date": ret})
    payload = {
        "data": {
            "slices": slices,
            "passengers": [{"type": "adult"}] * adults,
            "cabin_class": "economy",
        }
    }
    r = await client.post(f"{DUFFEL_BASE}/air/offer_requests", json=payload, headers=_headers())
    r.raise_for_status()
    return r.json()["data"]["id"]  # type: ignore[no-any-return]


@_retry
async def _list_offers(
    client: httpx.AsyncClient, offer_request_id: str, limit: int = 50
) -> list[dict]:  # type: ignore[return]
    r = await client.get(
        f"{DUFFEL_BASE}/air/offers",
        params={"offer_request_id": offer_request_id, "sort": "total_amount", "limit": limit},
        headers=_headers(),
    )
    r.raise_for_status()
    return r.json()["data"]  # type: ignore[no-any-return]


def _normalize_slice(offer: dict, slice_idx: int = 0) -> NormalizedOffer:
    sl = offer["slices"][slice_idx]
    segs = sl["segments"]
    first_seg = segs[0]
    last_seg = segs[-1]

    baggages = (offer.get("passengers") or [{}])[0].get("baggages") or []
    checked = next((b for b in baggages if b.get("type") == "checked"), None)
    baggage_kg = 20 if checked and int(checked.get("quantity", 0)) > 0 else 0

    return NormalizedOffer(
        offer_id=offer["id"],
        carrier=first_seg["operating_carrier"]["name"],
        carrier_iata=first_seg["operating_carrier"]["iata_code"],
        departure_iata=first_seg["origin"]["iata_code"],
        arrival_iata=last_seg["destination"]["iata_code"],
        departure_at=datetime.fromisoformat(first_seg["departing_at"]),
        arrival_at=datetime.fromisoformat(last_seg["arriving_at"]),
        duration_minutes=_parse_duration_minutes(sl.get("duration", "PT0M")),
        stops=len(segs) - 1,
        baggage_checked_kg=baggage_kg,
        total_krw=_to_krw(offer["total_amount"], offer.get("total_currency", "KRW")),
    )


_APPROX_RATES: dict[str, float] = {"USD": 1380.0, "JPY": 9.2, "EUR": 1500.0}


def _to_krw(amount: str, currency: str) -> int:
    value = float(amount)
    if currency == "KRW":
        return int(value)
    rate = _APPROX_RATES.get(currency, 1.0)
    return int(value * rate)


def _krw_only(offers: list[dict]) -> list[dict]:
    return [o for o in offers if o.get("total_currency") == "KRW"]


async def search_roundtrip(
    origin: str, destination: str, depart: str, ret: str
) -> list[NormalizedOffer]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        req_id = await _create_offer_request(client, origin, destination, depart, ret)
        raw = await _list_offers(client, req_id)
    return [_normalize_slice(o, 0) for o in raw]


async def search_oneway(
    origin: str, destination: str, depart: str
) -> list[NormalizedOffer]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        req_id = await _create_offer_request(client, origin, destination, depart, None)
        raw = await _list_offers(client, req_id)
    return [_normalize_slice(o, 0) for o in raw]


async def search_oneway_pair(
    origin: str, destination: str, depart: str, ret: str
) -> tuple[list[NormalizedOffer], list[NormalizedOffer]]:
    sem = asyncio.Semaphore(10)

    async def _req(org: str, dst: str, date: str) -> str:
        async with sem:
            return await _create_offer_request(client, org, dst, date, None)

    async def _offers(req_id: str) -> list[dict]:
        async with sem:
            return await _list_offers(client, req_id)

    async with httpx.AsyncClient(timeout=30.0) as client:
        out_id, ret_id = await asyncio.gather(
            _req(origin, destination, depart),
            _req(destination, origin, ret),
        )
        outbound_raw, inbound_raw = await asyncio.gather(
            _offers(out_id),
            _offers(ret_id),
        )

    outbound = [_normalize_slice(o) for o in outbound_raw]
    inbound = [_normalize_slice(o) for o in inbound_raw]
    return outbound, inbound


@_retry
async def _fetch_offer(client: httpx.AsyncClient, offer_id: str) -> dict | None:
    r = await client.get(f"{DUFFEL_BASE}/air/offers/{offer_id}", headers=_headers())
    if r.status_code == 404:
        return None
    r.raise_for_status()
    return r.json()["data"]  # type: ignore[no-any-return]


async def get_offer_price(offer_id: str) -> int | None:
    """Return the live KRW price for a single offer, or None if not found."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        data = await _fetch_offer(client, offer_id)
    if data is None:
        return None
    return _to_krw(data["total_amount"], data.get("total_currency", "KRW"))
