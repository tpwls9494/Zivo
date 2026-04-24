"""카카오 OAuth 엔드포인트 테스트."""
from __future__ import annotations

import pytest
import respx
from httpx import AsyncClient, Response


KAKAO_TOKEN_RESP = {"access_token": "test_access_token", "token_type": "bearer"}
KAKAO_ME_RESP = {
    "id": 12345678,
    "properties": {"nickname": "테스트유저"},
    "kakao_account": {"email": "test@kakao.com"},
}


@pytest.mark.asyncio
async def test_kakao_exchange_sets_cookie(client: AsyncClient) -> None:
    """code 교환 성공 시 JWT 쿠키가 설정된다."""
    with respx.mock:
        respx.post("https://kauth.kakao.com/oauth/token").mock(
            return_value=Response(200, json=KAKAO_TOKEN_RESP)
        )
        respx.get("https://kapi.kakao.com/v2/user/me").mock(
            return_value=Response(200, json=KAKAO_ME_RESP)
        )

        res = await client.post("/api/auth/kakao/exchange", json={"code": "valid_code"})

    assert res.status_code == 200
    body = res.json()
    assert body["kakao_id"] == "12345678"
    assert body["nickname"] == "테스트유저"
    assert body["email"] == "test@kakao.com"
    assert body["is_kakao_user"] is True
    assert "zivo_token" in res.cookies


@pytest.mark.asyncio
async def test_kakao_exchange_invalid_code(client: AsyncClient) -> None:
    """카카오 API 실패 시 400을 반환한다."""
    with respx.mock:
        respx.post("https://kauth.kakao.com/oauth/token").mock(
            return_value=Response(400, json={"error": "invalid_grant"})
        )
        res = await client.post("/api/auth/kakao/exchange", json={"code": "bad_code"})

    assert res.status_code == 400


@pytest.mark.asyncio
async def test_auth_me_with_valid_cookie(client: AsyncClient) -> None:
    """유효한 쿠키로 /me 호출 시 유저 정보를 반환한다."""
    with respx.mock:
        respx.post("https://kauth.kakao.com/oauth/token").mock(
            return_value=Response(200, json=KAKAO_TOKEN_RESP)
        )
        respx.get("https://kapi.kakao.com/v2/user/me").mock(
            return_value=Response(200, json=KAKAO_ME_RESP)
        )
        await client.post("/api/auth/kakao/exchange", json={"code": "valid_code"})

    res = await client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["is_kakao_user"] is True
    assert res.json()["kakao_id"] == "12345678"


@pytest.mark.asyncio
async def test_auth_me_without_cookie(client: AsyncClient) -> None:
    """/me 쿠키 없으면 401."""
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_logout_clears_cookie(client: AsyncClient) -> None:
    """로그아웃 후 쿠키가 삭제된다."""
    with respx.mock:
        respx.post("https://kauth.kakao.com/oauth/token").mock(
            return_value=Response(200, json=KAKAO_TOKEN_RESP)
        )
        respx.get("https://kapi.kakao.com/v2/user/me").mock(
            return_value=Response(200, json=KAKAO_ME_RESP)
        )
        await client.post("/api/auth/kakao/exchange", json={"code": "valid_code"})

    res = await client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["ok"] is True


@pytest.mark.asyncio
async def test_device_merge_on_exchange(client: AsyncClient) -> None:
    """device_id 제공 시 기존 프로필이 카카오 유저로 병합된다."""
    device_id = "test-device-merge-123"

    # 익명 프로필 생성
    await client.put(
        "/api/profile",
        headers={"X-Device-Id": device_id},
        json={
            "passport_given_name": "GILDONG",
            "passport_family_name": "HONG",
            "birth_date": "1990-01-01",
            "gender": "M",
            "nationality": "KOR",
            "phone": "+821012345678",
            "defaults": {"default_origin": "ICN", "preferred_cabin": "economy", "adults": 1, "baggage_preference": "any"},
        },
    )

    # 카카오 로그인 + 병합
    with respx.mock:
        respx.post("https://kauth.kakao.com/oauth/token").mock(
            return_value=Response(200, json=KAKAO_TOKEN_RESP)
        )
        respx.get("https://kapi.kakao.com/v2/user/me").mock(
            return_value=Response(200, json=KAKAO_ME_RESP)
        )
        res = await client.post(
            "/api/auth/kakao/exchange",
            json={"code": "valid_code", "device_id": device_id},
        )

    assert res.status_code == 200

    # 카카오 유저로 프로필 조회 → 병합된 데이터 확인
    profile_res = await client.get("/api/profile")
    assert profile_res.status_code == 200
    assert profile_res.json()["passport_given_name"] == "GILDONG"
