from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


def _offer(
    iata: str = "KE",
    origin: str = "ICN",
    destination: str = "KIX",
    total_krw: int = 200_000,
) -> dict:
    return {
        "offer_id": str(uuid.uuid4()),
        "carrier": "Korean Air",
        "carrier_iata": iata,
        "departure_iata": origin,
        "arrival_iata": destination,
        "departure_at": "2026-05-01T10:00:00+09:00",
        "arrival_at": "2026-05-01T11:30:00+09:00",
        "duration_minutes": 90,
        "stops": 0,
        "baggage_checked_kg": 23,
        "total_krw": total_krw,
    }


def _inbound_offer() -> dict:
    return _offer(iata="OZ", origin="KIX", destination="ICN", total_krw=180_000)


@pytest.mark.asyncio
async def test_book_roundtrip_creates_one_row(client: AsyncClient) -> None:
    """왕복 예약은 booking row 1개와 deep_link_url을 반환한다."""
    device_id = str(uuid.uuid4())
    res = await client.post(
        "/api/flights/book",
        json={"offer": _offer(), "direction": "roundtrip"},
        headers={"X-Device-Id": device_id},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["bookings"]) == 1
    b = data["bookings"][0]
    assert b["direction"] == "roundtrip"
    assert b["combo_group_id"] is None
    assert b["deep_link_url"].startswith("https://")
    assert uuid.UUID(b["booking_id"])


@pytest.mark.asyncio
async def test_book_combo_creates_two_rows_with_same_group(client: AsyncClient) -> None:
    """편도 조합 예약은 같은 combo_group_id를 가진 row 2개를 생성한다."""
    device_id = str(uuid.uuid4())
    res = await client.post(
        "/api/flights/book",
        json={
            "offer": _offer(),
            "direction": "outbound",
            "combo_inbound": _inbound_offer(),
        },
        headers={"X-Device-Id": device_id},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["bookings"]) == 2
    outbound, inbound = data["bookings"]
    assert outbound["direction"] == "outbound"
    assert inbound["direction"] == "inbound"
    assert outbound["combo_group_id"] == inbound["combo_group_id"]
    assert outbound["combo_group_id"] is not None


@pytest.mark.asyncio
async def test_book_combo_different_deep_links(client: AsyncClient) -> None:
    """편도 조합의 두 deep_link_url이 각 항공사 URL이다."""
    device_id = str(uuid.uuid4())
    res = await client.post(
        "/api/flights/book",
        json={
            "offer": _offer(iata="KE"),
            "direction": "outbound",
            "combo_inbound": _inbound_offer(),  # OZ
        },
        headers={"X-Device-Id": device_id},
    )
    data = res.json()
    assert "koreanair" in data["bookings"][0]["deep_link_url"]
    assert "asiana" in data["bookings"][1]["deep_link_url"]


@pytest.mark.asyncio
async def test_list_bookings_empty_for_new_device(client: AsyncClient) -> None:
    """새 device_id는 예약 이력이 없다."""
    res = await client.get(
        "/api/bookings",
        headers={"X-Device-Id": str(uuid.uuid4())},
    )
    assert res.status_code == 200
    assert res.json() == {"items": []}


@pytest.mark.asyncio
async def test_list_bookings_returns_own_bookings(client: AsyncClient) -> None:
    """예약 후 GET /api/bookings에 해당 row가 나타난다."""
    device_id = str(uuid.uuid4())
    await client.post(
        "/api/flights/book",
        json={"offer": _offer(), "direction": "roundtrip"},
        headers={"X-Device-Id": device_id},
    )
    res = await client.get("/api/bookings", headers={"X-Device-Id": device_id})
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["carrier_iata"] == "KE"
    assert data["items"][0]["origin"] == "ICN"
    assert data["items"][0]["status"] == "redirected"


@pytest.mark.asyncio
async def test_list_bookings_isolated_by_device(client: AsyncClient) -> None:
    """다른 device_id의 예약은 조회되지 않는다."""
    device_a = str(uuid.uuid4())
    device_b = str(uuid.uuid4())
    await client.post(
        "/api/flights/book",
        json={"offer": _offer(), "direction": "roundtrip"},
        headers={"X-Device-Id": device_a},
    )
    res = await client.get("/api/bookings", headers={"X-Device-Id": device_b})
    assert res.json() == {"items": []}


@pytest.mark.asyncio
async def test_book_missing_device_id_returns_422(client: AsyncClient) -> None:
    """X-Device-Id 헤더가 없으면 422를 반환한다."""
    res = await client.post(
        "/api/flights/book",
        json={"offer": _offer(), "direction": "roundtrip"},
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_book_unknown_carrier_returns_google_flights(client: AsyncClient) -> None:
    """매핑에 없는 항공사는 google.com/flights를 deep_link로 반환한다."""
    device_id = str(uuid.uuid4())
    offer = _offer(iata="XX")
    res = await client.post(
        "/api/flights/book",
        json={"offer": offer, "direction": "roundtrip"},
        headers={"X-Device-Id": device_id},
    )
    assert res.status_code == 200
    assert "google.com/flights" in res.json()["bookings"][0]["deep_link_url"]
