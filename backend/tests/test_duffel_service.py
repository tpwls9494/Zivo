from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest
import respx

from app.schemas.flight import NormalizedOffer
from app.services.duffel import (
    _normalize_slice,
    _parse_duration_minutes,
    search_oneway_pair,
    search_roundtrip,
)

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text())


OFFER_REQUEST_RESP = _load("duffel_offer_request.json")
OFFERS_RESP = _load("duffel_offers.json")
DUFFEL_BASE = "https://api.duffel.com"


# ── unit tests ────────────────────────────────────────────────────────────────


def test_parse_duration_minutes() -> None:
    assert _parse_duration_minutes("PT1H55M") == 115
    assert _parse_duration_minutes("PT2H") == 120
    assert _parse_duration_minutes("PT45M") == 45
    assert _parse_duration_minutes("PT0M") == 0
    assert _parse_duration_minutes("bad") == 0


def test_normalize_slice_no_baggage() -> None:
    offer = OFFERS_RESP["data"][0]
    normalized: NormalizedOffer = _normalize_slice(offer)

    assert normalized.offer_id == "off_0000test_cheap"
    assert normalized.carrier_iata == "7C"
    assert normalized.carrier == "Jeju Air"
    assert normalized.departure_iata == "ICN"
    assert normalized.arrival_iata == "KIX"
    assert normalized.duration_minutes == 115
    assert normalized.stops == 0
    assert normalized.baggage_checked_kg == 0
    assert normalized.total_krw == 150000


def test_normalize_slice_with_checked_baggage() -> None:
    offer = OFFERS_RESP["data"][1]
    normalized: NormalizedOffer = _normalize_slice(offer)

    assert normalized.baggage_checked_kg == 20
    assert normalized.total_krw == 180000
    assert normalized.duration_minutes == 130


# ── integration tests (respx) ─────────────────────────────────────────────────


@pytest.mark.asyncio
@respx.mock
async def test_search_roundtrip_returns_krw_only() -> None:
    respx.post(f"{DUFFEL_BASE}/air/offer_requests").mock(
        return_value=httpx.Response(200, json=OFFER_REQUEST_RESP)
    )
    respx.get(f"{DUFFEL_BASE}/air/offers").mock(
        return_value=httpx.Response(200, json=OFFERS_RESP)
    )

    offers = await search_roundtrip("ICN", "KIX", "2026-04-26", "2026-04-29")

    # USD offer is converted to KRW (120 * 1380 ≈ 165600)
    assert len(offers) == 3
    assert all(isinstance(o, NormalizedOffer) for o in offers)
    assert all(o.total_krw > 0 for o in offers)
    # sorted by total_amount (Duffel does this)
    assert offers[0].total_krw == 150000


@pytest.mark.asyncio
@respx.mock
async def test_search_oneway_pair_parallel_calls() -> None:
    call_count = 0

    def _req_handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        # return different IDs so we can verify both were called
        return httpx.Response(
            200,
            json={"data": {"id": f"orq_test_{call_count}", "live_mode": False}},
        )

    respx.post(f"{DUFFEL_BASE}/air/offer_requests").mock(side_effect=_req_handler)
    respx.get(f"{DUFFEL_BASE}/air/offers").mock(
        return_value=httpx.Response(200, json=OFFERS_RESP)
    )

    outbound, inbound = await search_oneway_pair("ICN", "KIX", "2026-04-26", "2026-04-29")

    # two separate offer_requests were made
    assert call_count == 2
    assert len(outbound) == 3
    assert len(inbound) == 3


@pytest.mark.asyncio
@respx.mock
async def test_search_roundtrip_retries_on_5xx() -> None:
    attempt = 0

    def _flaky_offers(request: httpx.Request) -> httpx.Response:
        nonlocal attempt
        attempt += 1
        if attempt < 3:
            return httpx.Response(500, json={"errors": [{"title": "internal error"}]})
        return httpx.Response(200, json=OFFERS_RESP)

    respx.post(f"{DUFFEL_BASE}/air/offer_requests").mock(
        return_value=httpx.Response(200, json=OFFER_REQUEST_RESP)
    )
    respx.get(f"{DUFFEL_BASE}/air/offers").mock(side_effect=_flaky_offers)

    offers = await search_roundtrip("ICN", "KIX", "2026-04-26", "2026-04-29")

    assert attempt == 3
    assert len(offers) == 3


@pytest.mark.asyncio
@respx.mock
async def test_search_roundtrip_raises_after_3_failures() -> None:
    respx.post(f"{DUFFEL_BASE}/air/offer_requests").mock(
        return_value=httpx.Response(200, json=OFFER_REQUEST_RESP)
    )
    respx.get(f"{DUFFEL_BASE}/air/offers").mock(
        return_value=httpx.Response(500, json={"errors": [{"title": "server error"}]})
    )

    with pytest.raises(httpx.HTTPStatusError):
        await search_roundtrip("ICN", "KIX", "2026-04-26", "2026-04-29")


@pytest.mark.asyncio
@respx.mock
async def test_search_roundtrip_no_retry_on_4xx() -> None:
    attempt = 0

    def _bad_req(request: httpx.Request) -> httpx.Response:
        nonlocal attempt
        attempt += 1
        return httpx.Response(422, json={"errors": [{"title": "invalid_airport"}]})

    respx.post(f"{DUFFEL_BASE}/air/offer_requests").mock(
        return_value=httpx.Response(200, json=OFFER_REQUEST_RESP)
    )
    respx.get(f"{DUFFEL_BASE}/air/offers").mock(side_effect=_bad_req)

    with pytest.raises(httpx.HTTPStatusError):
        await search_roundtrip("ICN", "KIX", "2026-04-26", "2026-04-29")

    assert attempt == 1  # no retry on 4xx
