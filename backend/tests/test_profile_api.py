from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import decrypt_sensitive
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.user_profile import UserProfile


def _payload() -> dict[str, object]:
    return {
        "passport_given_name": "sejin",
        "passport_family_name": "lee",
        "birth_date": "1999-01-02",
        "gender": "M",
        "nationality": "KOR",
        "phone": "+821012345678",
        "passport_number": "M12345678",
        "passport_expiry": "2030-01-02",
        "defaults": {
            "default_origin": "ICN",
            "preferred_cabin": "economy",
            "adults": 1,
            "baggage_preference": "carry_only",
        },
    }


async def test_profile_requires_device_id_header(client: AsyncClient) -> None:
    r = await client.get("/api/profile")
    assert r.status_code == 400


async def test_profile_get_empty_returns_defaults(client: AsyncClient) -> None:
    device_id = f"test-{uuid.uuid4()}"
    r = await client.get("/api/profile", headers={"X-Device-Id": device_id})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("exists") is False
    assert body["defaults"]["default_origin"] == "ICN"
    assert body["defaults"]["adults"] == 1


async def test_profile_upsert_then_get_roundtrip_and_masking(client: AsyncClient) -> None:
    device_id = f"test-{uuid.uuid4()}"
    headers = {"X-Device-Id": device_id}

    r1 = await client.put("/api/profile", headers=headers, json=_payload())
    assert r1.status_code == 200, r1.text
    out1 = r1.json()
    assert out1["passport_given_name"] == "SEJIN"
    assert out1["passport_family_name"] == "LEE"
    assert out1["passport_number_masked"].startswith("M1")
    assert out1["passport_number_masked"].endswith("78")
    assert "*" in out1["passport_number_masked"]
    assert out1.get("passport_expiry") is None
    assert out1["defaults"]["baggage_preference"] == "carry_only"

    r2 = await client.get("/api/profile", headers=headers)
    assert r2.status_code == 200
    out2 = r2.json()
    assert out2["passport_given_name"] == "SEJIN"
    assert out2["phone"] == "+821012345678"
    assert out2["passport_number_masked"].startswith("M1")


async def test_profile_upsert_encrypts_passport_in_db(client: AsyncClient) -> None:
    device_id = f"test-{uuid.uuid4()}"
    r = await client.put("/api/profile", headers={"X-Device-Id": device_id}, json=_payload())
    assert r.status_code == 200, r.text

    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.device_id == device_id))).scalar_one()
        profile = (
            await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
        ).scalar_one()
        assert profile.passport_number_enc
        assert "M12345678" not in profile.passport_number_enc
        assert decrypt_sensitive(profile.passport_number_enc) == "M12345678"
        assert profile.passport_expiry_enc
        assert decrypt_sensitive(profile.passport_expiry_enc) == "2030-01-02"


async def test_profile_update_replaces_existing_fields(client: AsyncClient) -> None:
    device_id = f"test-{uuid.uuid4()}"
    headers = {"X-Device-Id": device_id}

    await client.put("/api/profile", headers=headers, json=_payload())
    patched = _payload()
    patched["phone"] = "+821098765432"
    patched["passport_number"] = "M99999999"
    r = await client.put("/api/profile", headers=headers, json=patched)
    assert r.status_code == 200
    out = r.json()
    assert out["phone"] == "+821098765432"
    assert out["passport_number_masked"].endswith("99")


@pytest.mark.parametrize(
    "bad",
    [
        {"gender": "X"},
        {"nationality": "KR"},
        {"birth_date": "not-a-date"},
    ],
)
async def test_profile_upsert_rejects_invalid(
    client: AsyncClient, bad: dict[str, object]
) -> None:
    device_id = f"test-{uuid.uuid4()}"
    body = _payload() | bad
    r = await client.put("/api/profile", headers={"X-Device-Id": device_id}, json=body)
    assert r.status_code == 422
