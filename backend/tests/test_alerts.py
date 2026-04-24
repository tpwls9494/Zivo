"""가격 알림 CRUD 테스트."""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


def _headers() -> dict[str, str]:
    return {"X-Device-Id": f"test-alerts-{uuid.uuid4()}"}


ALERT_PAYLOAD = {
    "origin": "ICN",
    "destination": "KIX",
    "depart_date": "2026-06-01",
    "target_krw": 200000,
    "channel": "email",
}


@pytest.mark.asyncio
async def test_list_alerts_empty(client: AsyncClient) -> None:
    res = await client.get("/api/alerts", headers=_headers())
    assert res.status_code == 200
    assert res.json()["items"] == []


@pytest.mark.asyncio
async def test_create_alert(client: AsyncClient) -> None:
    res = await client.post("/api/alerts", headers=_headers(), json=ALERT_PAYLOAD)
    assert res.status_code == 201
    body = res.json()
    assert body["origin"] == "ICN"
    assert body["destination"] == "KIX"
    assert body["target_krw"] == 200000
    assert body["enabled"] is True


@pytest.mark.asyncio
async def test_list_alerts_after_create(client: AsyncClient) -> None:
    h = _headers()
    await client.post("/api/alerts", headers=h, json=ALERT_PAYLOAD)
    res = await client.get("/api/alerts", headers=h)
    assert res.status_code == 200
    assert len(res.json()["items"]) == 1


@pytest.mark.asyncio
async def test_delete_alert(client: AsyncClient) -> None:
    h = _headers()
    create = await client.post("/api/alerts", headers=h, json=ALERT_PAYLOAD)
    alert_id = create.json()["id"]

    res = await client.delete(f"/api/alerts/{alert_id}", headers=h)
    assert res.status_code == 204

    res2 = await client.get("/api/alerts", headers=h)
    assert res2.json()["items"] == []


@pytest.mark.asyncio
async def test_delete_other_users_alert_404(client: AsyncClient) -> None:
    h = _headers()
    create = await client.post("/api/alerts", headers=h, json=ALERT_PAYLOAD)
    alert_id = create.json()["id"]

    other = _headers()
    res = await client.delete(f"/api/alerts/{alert_id}", headers=other)
    assert res.status_code == 404
