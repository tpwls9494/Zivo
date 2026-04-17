"""Day 6: price revalidation, tenacity retry, structured logging."""

from __future__ import annotations

import json
import logging
import uuid
from unittest.mock import AsyncMock, patch

import pytest
import respx
from httpx import AsyncClient, Response

DUFFEL_BASE = "https://api.duffel.com"


def _offer(total_krw: int = 200_000, offer_id: str | None = None) -> dict:
    return {
        "offer_id": offer_id or str(uuid.uuid4()),
        "carrier": "Korean Air",
        "carrier_iata": "KE",
        "departure_iata": "ICN",
        "arrival_iata": "KIX",
        "departure_at": "2026-05-01T10:00:00+09:00",
        "arrival_at": "2026-05-01T11:30:00+09:00",
        "duration_minutes": 90,
        "stops": 0,
        "baggage_checked_kg": 23,
        "total_krw": total_krw,
    }


def _duffel_offer_response(offer_id: str, total_krw: int) -> dict:
    return {
        "data": {
            "id": offer_id,
            "total_amount": str(total_krw),
            "total_currency": "KRW",
        }
    }


# ── Price revalidation tests ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_price_unchanged_proceeds(client: AsyncClient) -> None:
    """가격이 동일하면 예약이 정상 처리된다."""
    offer_id = str(uuid.uuid4())
    offer = _offer(total_krw=200_000, offer_id=offer_id)

    with patch(
        "app.api.v1.flights.settings",
        DUFFEL_API_KEY="duffel_test_fake",
    ), patch(
        "app.api.v1.flights.duffel.get_offer_price",
        new=AsyncMock(return_value=200_000),
    ):
        res = await client.post(
            "/api/flights/book",
            json={"offer": offer, "direction": "roundtrip"},
            headers={"X-Device-Id": str(uuid.uuid4())},
        )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_price_within_2pct_proceeds(client: AsyncClient) -> None:
    """가격 변동이 1.9%면 예약이 정상 처리된다."""
    offer_id = str(uuid.uuid4())
    offer = _offer(total_krw=200_000, offer_id=offer_id)
    live = int(200_000 * 1.019)  # 1.9% 상승

    with patch("app.api.v1.flights.settings", DUFFEL_API_KEY="duffel_test_fake"), patch(
        "app.api.v1.flights.duffel.get_offer_price",
        new=AsyncMock(return_value=live),
    ):
        res = await client.post(
            "/api/flights/book",
            json={"offer": offer, "direction": "roundtrip"},
            headers={"X-Device-Id": str(uuid.uuid4())},
        )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_price_increased_3pct_returns_409(client: AsyncClient) -> None:
    """가격이 3% 오르면 409 PRICE_CHANGED를 반환한다."""
    offer_id = str(uuid.uuid4())
    offer = _offer(total_krw=200_000, offer_id=offer_id)
    live = int(200_000 * 1.03)  # 3% 상승

    with patch("app.api.v1.flights.settings", DUFFEL_API_KEY="duffel_test_fake"), patch(
        "app.api.v1.flights.duffel.get_offer_price",
        new=AsyncMock(return_value=live),
    ):
        res = await client.post(
            "/api/flights/book",
            json={"offer": offer, "direction": "roundtrip"},
            headers={"X-Device-Id": str(uuid.uuid4())},
        )
    assert res.status_code == 409
    detail = res.json()["detail"]
    assert detail["code"] == "PRICE_CHANGED"
    assert detail["cached_krw"] == 200_000
    assert detail["live_krw"] == live
    assert detail["offer_id"] == offer_id


@pytest.mark.asyncio
async def test_price_decreased_3pct_returns_409(client: AsyncClient) -> None:
    """가격이 3% 내려도 변동 감지 → 409 (사용자에게 재확인 요구)."""
    offer_id = str(uuid.uuid4())
    offer = _offer(total_krw=200_000, offer_id=offer_id)
    live = int(200_000 * 0.96)  # 4% 하락

    with patch("app.api.v1.flights.settings", DUFFEL_API_KEY="duffel_test_fake"), patch(
        "app.api.v1.flights.duffel.get_offer_price",
        new=AsyncMock(return_value=live),
    ):
        res = await client.post(
            "/api/flights/book",
            json={"offer": offer, "direction": "roundtrip"},
            headers={"X-Device-Id": str(uuid.uuid4())},
        )
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_revalidation_api_failure_proceeds(client: AsyncClient) -> None:
    """Duffel 재확인 API가 실패해도 예약은 진행된다 (soft failure)."""
    offer = _offer(total_krw=200_000)

    with patch("app.api.v1.flights.settings", DUFFEL_API_KEY="duffel_test_fake"), patch(
        "app.api.v1.flights.duffel.get_offer_price",
        new=AsyncMock(side_effect=Exception("Duffel timeout")),
    ):
        res = await client.post(
            "/api/flights/book",
            json={"offer": offer, "direction": "roundtrip"},
            headers={"X-Device-Id": str(uuid.uuid4())},
        )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_no_duffel_key_skips_revalidation(client: AsyncClient) -> None:
    """DUFFEL_API_KEY가 없으면 가격 재확인을 건너뛴다."""
    offer = _offer(total_krw=200_000)

    with patch("app.api.v1.flights.settings", DUFFEL_API_KEY=""):
        res = await client.post(
            "/api/flights/book",
            json={"offer": offer, "direction": "roundtrip"},
            headers={"X-Device-Id": str(uuid.uuid4())},
        )
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_combo_revalidates_both_legs(client: AsyncClient) -> None:
    """편도 조합 예약은 가는편·오는편 모두 재확인한다."""
    outbound_id = str(uuid.uuid4())
    inbound_id = str(uuid.uuid4())
    outbound = _offer(total_krw=120_000, offer_id=outbound_id)
    inbound = {**_offer(total_krw=100_000, offer_id=inbound_id), "departure_iata": "KIX", "arrival_iata": "ICN"}

    call_count = 0

    async def mock_price(offer_id: str) -> int:
        nonlocal call_count
        call_count += 1
        return 120_000 if offer_id == outbound_id else 100_000

    with patch("app.api.v1.flights.settings", DUFFEL_API_KEY="duffel_test_fake"), patch(
        "app.api.v1.flights.duffel.get_offer_price",
        new=AsyncMock(side_effect=mock_price),
    ):
        res = await client.post(
            "/api/flights/book",
            json={"offer": outbound, "direction": "outbound", "combo_inbound": inbound},
            headers={"X-Device-Id": str(uuid.uuid4())},
        )
    assert res.status_code == 200
    assert call_count == 2


# ── Tenacity retry tests ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_offer_price_retries_on_500() -> None:
    """get_offer_price는 5xx에서 3회 재시도 후 예외를 올린다."""
    from app.services.duffel import get_offer_price

    offer_id = "off_test123"
    with respx.mock:
        respx.get(f"{DUFFEL_BASE}/air/offers/{offer_id}").mock(
            side_effect=[
                Response(500),
                Response(500),
                Response(500),
            ]
        )
        with pytest.raises(Exception):
            await get_offer_price(offer_id)


@pytest.mark.asyncio
async def test_get_offer_price_succeeds_after_retry() -> None:
    """get_offer_price는 첫 번째 5xx 후 두 번째 시도에서 성공한다."""
    from app.services.duffel import get_offer_price

    offer_id = "off_test456"
    success_body = json.dumps(
        {"data": {"id": offer_id, "total_amount": "150000", "total_currency": "KRW"}}
    )
    with respx.mock:
        respx.get(f"{DUFFEL_BASE}/air/offers/{offer_id}").mock(
            side_effect=[
                Response(500),
                Response(200, content=success_body.encode()),
            ]
        )
        price = await get_offer_price(offer_id)
    assert price == 150_000


@pytest.mark.asyncio
async def test_get_offer_price_returns_none_on_404() -> None:
    """존재하지 않는 offer_id는 None을 반환한다."""
    from app.services.duffel import get_offer_price

    offer_id = "off_notfound"
    with respx.mock:
        respx.get(f"{DUFFEL_BASE}/air/offers/{offer_id}").mock(return_value=Response(404))
        price = await get_offer_price(offer_id)
    assert price is None


# ── JSON logging tests ────────────────────────────────────────────────────────


def test_json_formatter_outputs_json() -> None:
    """JsonFormatter가 유효한 JSON을 출력한다."""
    from app.core.logging import JsonFormatter

    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="test", level=logging.INFO, pathname="", lineno=0, msg="hello", args=(), exc_info=None
    )
    output = formatter.format(record)
    data = json.loads(output)
    assert data["level"] == "INFO"
    assert data["msg"] == "hello"
    assert "ts" in data


def test_json_formatter_masks_passport() -> None:
    """여권번호가 로그에 마스킹된다."""
    from app.core.logging import JsonFormatter

    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="passport M12345678 booked",
        args=(),
        exc_info=None,
    )
    output = json.loads(formatter.format(record))
    assert "M12345678" not in output["msg"]
    assert "M1" in output["msg"]


def test_json_formatter_masks_phone() -> None:
    """전화번호가 로그에 마스킹된다."""
    from app.core.logging import JsonFormatter

    formatter = JsonFormatter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="contact 010-1234-5678",
        args=(),
        exc_info=None,
    )
    output = json.loads(formatter.format(record))
    assert "1234" not in output["msg"]
